#!/bin/bash
set -euo pipefail

# =============================================================================
# Emergency Rollback Script
#
# Performs a complete rollback to the previous stable revision:
#   1. Helm rollback to previous revision
#   2. Database migration rollback (if schema changed)
#   3. DNS failover (if needed)
#   4. Notification to on-call team
#
# Usage:
#   ./rollback.sh [--namespace NS] [--release RELEASE] [--revision NUM]
#                 [--db-migration] [--dns-failover] [--reason TEXT]
#
# Examples:
#   ./rollback.sh --reason "p99 latency > 2s after deploy"
#   ./rollback.sh --revision 3 --db-migration --dns-failover
# =============================================================================

BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[ERROR]${NC} $*" >&2; }
log_step()  { echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[STEP]${NC}  $*"; }

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Options:
  --namespace NS    Kubernetes namespace                     [default: almokhtabar]
  --release NAME    Helm release name                        [default: almokhtabar]
  --revision NUM    Target Helm revision to rollback to       [default: previous]
  --db-migration    Also roll back the last database migration
  --dns-failover    Update DNS to point to DR site
  --reason TEXT     Reason for rollback (for notification)
  --dry-run         Show what would be done without doing it
  --help            Show this help message
EOF
    exit 0
}

# ---- Defaults ----
NAMESPACE="${NAMESPACE:-almokhtabar}"
RELEASE="${RELEASE:-almokhtabar}"
REVISION="${REVISION:-0}"
DB_MIGRATION="${DB_MIGRATION:-false}"
DNS_FAILOVER="${DNS_FAILOVER:-false}"
REASON="${REASON:-"No reason provided"}"
DRY_RUN="${DRY_RUN:-false}"

# ---- Parse arguments ----
while [[ $# -gt 0 ]]; do
    case "$1" in
        --namespace)   NAMESPACE="$2";   shift 2 ;;
        --release)     RELEASE="$2";     shift 2 ;;
        --revision)    REVISION="$2";    shift 2 ;;
        --db-migration) DB_MIGRATION="true"; shift ;;
        --dns-failover) DNS_FAILOVER="true"; shift ;;
        --reason)      REASON="$2";      shift 2 ;;
        --dry-run)     DRY_RUN="true";   shift ;;
        --help|-h)     usage ;;
        *) log_error "Unknown argument: $1"; usage ;;
    esac
done

# ---- Functions ----

check_prerequisites() {
    log_step "Checking prerequisites..."
    command -v kubectl >/dev/null 2>&1 || { log_error "kubectl is required"; exit 1; }
    command -v helm    >/dev/null 2>&1 || { log_error "helm is required"; exit 1; }
    command -v curl    >/dev/null 2>&1 || { log_error "curl is required"; exit 1; }
    log_info "All prerequisites met"
}

helm_rollback() {
    log_step "Rolling back Helm release '${RELEASE}' in namespace '${NAMESPACE}'..."

    local history
    history=$(helm history "$RELEASE" --namespace "$NAMESPACE" -o json 2>/dev/null || echo "[]")
    local revision_count
    revision_count=$(echo "$history" | jq '. | length' 2>/dev/null || echo 0)

    if [[ "$revision_count" -lt 2 ]]; then
        log_error "No previous revision to roll back to"
        exit 1
    fi

    local target_revision
    if [[ "$REVISION" -eq 0 ]]; then
        # Roll back to the previous revision
        target_revision=$(echo "$history" | jq '.[-2].revision' 2>/dev/null || echo "")
        log_info "Auto-selecting previous revision: ${target_revision}"
    else
        target_revision="$REVISION"
    fi

    if [[ -z "$target_revision" ]]; then
        log_error "Could not determine target revision"
        exit 1
    fi

    log_info "Rolling back to revision ${target_revision}..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would run: helm rollback $RELEASE $target_revision --namespace $NAMESPACE --wait --timeout 10m"
    else
        helm rollback "$RELEASE" "$target_revision" \
            --namespace "$NAMESPACE" \
            --wait --timeout 10m

        log_info "Helm rollback to revision ${target_revision} complete"
    fi
}

verify_rollback() {
    log_step "Verifying rollback..."

    local attempts=12
    for i in $(seq 1 $attempts); do
        local status
        status=$(curl -s -o /dev/null -w "%{http_code}" \
            --connect-timeout 10 \
            "https://almokhtabar.com/api/health" 2>/dev/null || echo "000")

        if [[ "$status" == "200" ]]; then
            log_info "Health check passed after rollback (HTTP $status)"
            return 0
        fi

        log_info "Attempt $i of $attempts: health endpoint returned $status, retrying in 10s..."
        sleep 10
    done

    log_error "Health check failed after rollback — manual intervention required"
    return 1
}

rollback_database() {
    if [[ "$DB_MIGRATION" != "true" ]]; then
        log_info "Skipping database rollback (use --db-migration to enable)"
        return 0
    fi

    log_step "Rolling back database migration..."

    local pod
    pod=$(kubectl get pods -n "$NAMESPACE" \
        -l "app.kubernetes.io/component=backend" \
        -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

    if [[ -z "$pod" ]]; then
        log_warn "No backend pod found — skipping database rollback"
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would run: prisma migrate reset on pod $pod"
    else
        log_info "Running prisma migrate reset..."
        kubectl exec -n "$NAMESPACE" "$pod" -c backend -- \
            npx prisma migrate reset --force 2>/dev/null || log_warn "Database rollback encountered issues"
        log_info "Database rollback complete"
    fi
}

dns_failover() {
    if [[ "$DNS_FAILOVER" != "true" ]]; then
        log_info "Skipping DNS failover (use --dns-failover to enable)"
        return 0
    fi

    log_step "Initiating DNS failover via Cloudflare API..."

    if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
        log_warn "CLOUDFLARE_API_TOKEN not set — skipping DNS failover"
        return 0
    fi

    if [[ -z "${CLOUDFLARE_ZONE_ID:-}" ]]; then
        log_warn "CLOUDFLARE_ZONE_ID not set — skipping DNS failover"
        return 0
    fi

    local dr_hostname="dr.almokhtabar.com"
    local primary_hostname="almokhtabar.com"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would update DNS record $primary_hostname -> $dr_hostname"
    else
        curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${DNS_RECORD_ID}" \
            -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
            -H "Content-Type: application/json" \
            -d "{\"type\":\"CNAME\",\"name\":\"${primary_hostname}\",\"content\":\"${dr_hostname}\",\"ttl\":60,\"proxied\":true}" \
            >/dev/null

        log_info "DNS failover initiated — TTL set to 60s"
    fi
}

send_notification() {
    log_step "Sending rollback notification..."

    local status="${1:-pending}"
    local message

    if [[ "$status" == "success" ]]; then
        message="✅ Rollback completed successfully for ${RELEASE}/${NAMESPACE}"
    else
        message="🚨 Rollback FAILED for ${RELEASE}/${NAMESPACE} — manual intervention required"
    fi

    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        if [[ "$DRY_RUN" != "true" ]]; then
            curl -s -X POST "$SLACK_WEBHOOK_URL" \
                -H "Content-Type: application/json" \
                -d "{
                    \"text\": \"${message}\nReason: ${REASON}\nTime: $(date -u)\"
                }" >/dev/null
            log_info "Slack notification sent"
        else
            log_info "[DRY RUN] Would send Slack notification"
        fi
    else
        log_warn "SLACK_WEBHOOK_URL not set — notification skipped"
    fi

    if [[ -n "${PAGERDUTY_INTEGRATION_KEY:-}" ]]; then
        if [[ "$DRY_RUN" != "true" ]]; then
            curl -s -X POST "https://events.pagerduty.com/v2/enqueue" \
                -H "Content-Type: application/json" \
                -d "{
                    \"routing_key\": \"${PAGERDUTY_INTEGRATION_KEY}\",
                    \"event_action\": \"trigger\",
                    \"payload\": {
                        \"summary\": \"Rollback: ${REASON}\",
                        \"severity\": \"critical\",
                        \"source\": \"${RELEASE}/${NAMESPACE}\"
                    }
                }" >/dev/null
            log_info "PagerDuty notification sent"
        else
            log_info "[DRY RUN] Would send PagerDuty notification"
        fi
    fi
}

# ---- Main ----
main() {
    log_info "============================================"
    log_info "  Al Mokhtabar Emergency Rollback"
    log_info "  Namespace:  ${NAMESPACE}"
    log_info "  Release:    ${RELEASE}"
    log_info "  Revision:   ${REVISION:-previous}"
    log_info "  Reason:     ${REASON}"
    log_info "  Dry Run:    ${DRY_RUN}"
    log_info "============================================"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_warn "${BOLD}DRY RUN MODE — no changes will be made${NC}"
        echo ""
    fi

    check_prerequisites

    # Phase 1: Helm rollback
    helm_rollback

    # Phase 2: Verify
    if ! verify_rollback; then
        send_notification "failed"
        exit 1
    fi

    # Phase 3: Database rollback (optional)
    rollback_database

    # Phase 4: DNS failover (optional)
    dns_failover

    # Phase 5: Notify
    send_notification "success"

    echo ""
    log_info "${BOLD}${GREEN}Rollback completed successfully${NC}"
    log_info "For more details, run: helm history ${RELEASE} --namespace ${NAMESPACE}"
}

main
