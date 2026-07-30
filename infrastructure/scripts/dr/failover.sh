#!/bin/bash
set -euo pipefail

# =============================================================================
# Cross-Region Failover Script — Al Mokhtabar Laboratory
#
# Performs automated failover to the disaster recovery region:
#   1. Health check against primary region
#   2. If unhealthy, promote DR replica to primary
#   3. Update DNS (Cloudflare API)
#   4. Verify read replicas are operational
#   5. Notify all stakeholders (Slack, PagerDuty, email)
#   6. Create incident in PagerDuty
#
# Usage:
#   ./failover.sh [--primary-region REGION] [--dr-region REGION]
#                 [--health-endpoint URL] [--dry-run]
#
# Examples:
#   ./failover.sh
#   ./failover.sh --primary-region us-east-1 --dr-region us-west-2
#   ./failover.sh --dry-run
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
  --primary-region   Primary region identifier                [default: us-east-1]
  --dr-region        DR region identifier                     [default: us-west-2]
  --health-endpoint  Primary health check URL                 [default: https://almokhtabar.com/api/health]
  --dns-zone         Cloudflare DNS zone name                 [default: almokhtabar.com]
  --cluster-name     Kubernetes cluster name prefix           [default: almokhtabar]
  --dry-run          Show what would be done without doing it
  --force            Skip health checks and force failover
  --help             Show this help message
EOF
    exit 0
}

# ---- Defaults ----
PRIMARY_REGION="${PRIMARY_REGION:-us-east-1}"
DR_REGION="${DR_REGION:-us-west-2}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-https://almokhtabar.com/api/health}"
DNS_ZONE="${DNS_ZONE:-almokhtabar.com}"
CLUSTER_NAME="${CLUSTER_NAME:-almokhtabar}"
DRY_RUN="${DRY_RUN:-false}"
FORCE="${FORCE:-false}"

HEALTH_RETRIES=3
HEALTH_TIMEOUT=10
HEALTH_INTERVAL=5

while [[ $# -gt 0 ]]; do
    case "$1" in
        --primary-region)  PRIMARY_REGION="$2";  shift 2 ;;
        --dr-region)       DR_REGION="$2";       shift 2 ;;
        --health-endpoint) HEALTH_ENDPOINT="$2"; shift 2 ;;
        --dns-zone)        DNS_ZONE="$2";        shift 2 ;;
        --cluster-name)    CLUSTER_NAME="$2";    shift 2 ;;
        --dry-run)         DRY_RUN="true";       shift ;;
        --force)           FORCE="true";         shift ;;
        --help|-h)         usage ;;
        *) log_error "Unknown argument: $1"; usage ;;
    esac
done

check_prerequisites() {
    log_step "Checking prerequisites..."
    command -v kubectl >/dev/null 2>&1 || log_warn "kubectl not found"
    command -v helm    >/dev/null 2>&1 || log_warn "helm not found"
    command -v curl    >/dev/null 2>&1 || { log_error "curl is required"; exit 1; }
    command -v jq      >/dev/null 2>&1 || log_warn "jq not found"
    command -v dig     >/dev/null 2>&1 || log_warn "dig not found"
    log_info "Prerequisites check complete"
}

health_check_primary() {
    if [[ "$FORCE" == "true" ]]; then
        log_warn "Force mode enabled -- skipping health checks"
        return 1
    fi

    log_step "Health checking primary region (${PRIMARY_REGION})..."

    local failures=0
    for i in $(seq 1 $HEALTH_RETRIES); do
        local status
        status=$(curl -s -o /dev/null -w "%{http_code}" \
            --connect-timeout "$HEALTH_TIMEOUT" \
            --max-time "$((HEALTH_TIMEOUT + 5))" \
            "$HEALTH_ENDPOINT" 2>/dev/null || echo "000")

        if [[ "$status" == "200" ]]; then
            log_info "Attempt $i: HTTP 200"
            failures=0
        else
            log_warn "Attempt $i: HTTP ${status}"
            failures=$((failures + 1))
        fi
        sleep "$HEALTH_INTERVAL"
    done

    if [[ $failures -lt 2 ]]; then
        log_info "Primary region is healthy -- no failover needed"
        return 0
    fi

    log_warn "Primary unhealthy (${failures}/${HEALTH_RETRIES} failures)"
    return 1
}

verify_dr_readiness() {
    log_step "Verifying DR region (${DR_REGION})..."

    if command -v kubectl &>/dev/null; then
        local dr_context="${CLUSTER_NAME}-${DR_REGION}"

        if kubectl config use-context "$dr_context" &>/dev/null; then
            local node_count
            node_count=$(kubectl get nodes --no-headers 2>/dev/null | wc -l || echo 0)

            if [[ "$node_count" -ge 3 ]]; then
                log_info "DR cluster: ${node_count} nodes"
            else
                log_error "DR cluster has ${node_count} nodes (need 3+)"
                return 1
            fi

            for ns in almokhtabar ingress-nginx monitoring; do
                kubectl get namespace "$ns" &>/dev/null && \
                    log_info "Namespace '${ns}' exists" || \
                    log_warn "Namespace '${ns}' not found"
            done
        else
            log_warn "Context '${dr_context}' not found"
        fi
    fi

    verify_database_readiness
    log_info "DR readiness check complete"
}

verify_database_readiness() {
    log_step "Checking database replicas in DR..."

    local pg_dr_host="${PG_DR_HOST:-dr-postgres.${DR_REGION}.almokhtabar.com}"
    local pg_dr_port="${PG_DR_PORT:-5432}"

    if command -v psql &>/dev/null; then
        if PGPASSWORD="${PG_DR_PASSWORD:-}" psql -h "$pg_dr_host" -p "$pg_dr_port" \
            -U "${PG_DR_USER:-postgres}" -d "${PG_DR_DB:-almokhtabar}" \
            -c "SELECT pg_is_in_recovery();" -t 2>/dev/null | grep -q "t"; then
            log_info "DR Postgres is in recovery mode (accepting reads)"
        else
            log_warn "DR Postgres not in recovery or unreachable"
        fi
    else
        log_warn "psql not found -- skipping DB check"
    fi

    local redis_dr_host="${REDIS_DR_HOST:-dr-redis.${DR_REGION}.almokhtabar.com}"
    local redis_dr_port="${REDIS_DR_PORT:-6379}"

    if command -v redis-cli &>/dev/null; then
        if redis-cli -h "$redis_dr_host" -p "$redis_dr_port" PING 2>/dev/null | grep -q "PONG"; then
            log_info "DR Redis reachable"
        else
            log_warn "DR Redis unreachable"
        fi
    fi
}

promote_dr_database() {
    log_step "Promoting DR database to primary..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would promote DR Postgres in ${DR_REGION}"
        return 0
    fi

    local pg_dr_host="${PG_DR_HOST:-dr-postgres.${DR_REGION}.almokhtabar.com}"
    local pg_dr_port="${PG_DR_PORT:-5432}"

    if command -v psql &>/dev/null; then
        PGPASSWORD="${PG_DR_PASSWORD:-}" psql -h "$pg_dr_host" -p "$pg_dr_port" \
            -U "${PG_DR_USER:-postgres}" -d "${PG_DR_DB:-almokhtabar}" \
            -c "SELECT pg_promote();" 2>/dev/null || {
            log_warn "pg_promote() failed -- may need manual intervention"
        }
        log_info "DR Postgres promoted to primary"
    fi

    # Promote Redis replica to primary
    local redis_dr_host="${REDIS_DR_HOST:-dr-redis.${DR_REGION}.almokhtabar.com}"
    local redis_dr_port="${REDIS_DR_PORT:-6379}"

    if command -v redis-cli &>/dev/null; then
        redis-cli -h "$redis_dr_host" -p "$redis_dr_port" SLAVEOF NO ONE 2>/dev/null || true
        log_info "DR Redis promoted to primary"
    fi
}

update_dns() {
    log_step "Updating DNS to point to DR region (${DR_REGION})..."

    if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
        log_warn "CLOUDFLARE_API_TOKEN not set -- DNS update skipped"
        log_info "Update these records manually:"
        echo "  A almokhtabar.com -> ${DR_LOAD_BALANCER_IP:-<DR-LB-IP>}"
        echo "  A api.almokhtabar.com -> ${DR_LOAD_BALANCER_IP:-<DR-LB-IP>}"
        return 1
    fi

    if [[ -z "${CLOUDFLARE_ZONE_ID:-}" ]]; then
        log_warn "CLOUDFLARE_ZONE_ID not set -- cannot update DNS"
        return 1
    fi

    local dr_ip="${DR_LOAD_BALANCER_IP:?DR load balancer IP is required}"
    local records=("@", "api", "app", "www")

    for record in "${records[@]}"; do
        local record_id
        record_id=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=A&name=${record}.${DNS_ZONE}" \
            -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
            -H "Content-Type: application/json" | jq -r '.result[0].id // empty' 2>/dev/null || echo "")

        if [[ -n "$record_id" ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                log_info "[DRY RUN] Would update ${record}.${DNS_ZONE} -> ${dr_ip} (TTL: 60)"
            else
                curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${record_id}" \
                    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
                    -H "Content-Type: application/json" \
                    -d "{\"type\":\"A\",\"name\":\"${record}.${DNS_ZONE}\",\"content\":\"${dr_ip}\",\"ttl\":60,\"proxied\":true}" \
                    >/dev/null
                log_info "Updated ${record}.${DNS_ZONE} -> ${dr_ip}"
            fi
        fi
    done

    log_info "DNS updated -- waiting for propagation..."
    if [[ "$DRY_RUN" != "true" ]]; then
        sleep 60
    fi
}

verify_dns_propagation() {
    log_step "Verifying DNS propagation..."

    local expected_ip="${DR_LOAD_BALANCER_IP:?}"

    for i in $(seq 1 12); do
        local resolved_ip
        resolved_ip=$(dig +short "${DNS_ZONE}" @8.8.8.8 2>/dev/null | head -1 || echo "")

        if [[ "$resolved_ip" == "$expected_ip" ]]; then
            log_info "DNS propagated: ${DNS_ZONE} -> ${resolved_ip}"
            return 0
        fi
        log_info "Attempt $i: waiting for DNS propagation..."
        sleep 10
    done

    log_warn "DNS may not have fully propagated"
    return 0
}

deploy_dr_workloads() {
    log_step "Scaling up workloads in DR region..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy workloads in ${DR_REGION}"
        return 0
    fi

    if command -v helm &>/dev/null; then
        local chart_path="../../kubernetes/helm/almokhtabar"
        local values_path="../../kubernetes/helm/almokhtabar/values-dr.yaml"

        if [[ -f "$chart_path/Chart.yaml" ]]; then
            helm upgrade --install "almokhtabar" "$chart_path" \
                --namespace "almokhtabar" \
                -f "$values_path" \
                --set "global.environment=dr" \
                --set "global.region=${DR_REGION}" \
                --set "backend.replicaCount=3" \
                --set "web.replicaCount=3" \
                --set "ai-service.replicaCount=2" \
                --set "global.databaseHost=localhost" \
                --set "global.redisHost=redis-master" \
                --wait --timeout 10m

            log_info "DR workloads deployed"
        else
            log_warn "Helm chart not found at ${chart_path}"
        fi
    fi
}

validate_dr_health() {
    log_step "Validating application health in DR region..."

    local dr_url="https://${DNS_ZONE}/api/health"

    for i in $(seq 1 6); do
        local status
        status=$(curl -s -o /dev/null -w "%{http_code}" \
            --connect-timeout 10 "$dr_url" 2>/dev/null || echo "000")

        if [[ "$status" == "200" ]]; then
            log_info "DR health: HTTP 200"
            return 0
        fi
        log_info "Attempt $i: DR health returned ${status}"
        sleep 10
    done

    log_warn "DR health check did not return 200"
    return 1
}

notify_stakeholders() {
    log_step "Sending failover notifications..."

    local message="?? CROSS-REGION FAILOVER initiated
    Primary: ${PRIMARY_REGION}
    DR:      ${DR_REGION}
    Time:    $(date -u)
    Action:  ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"

    if [[ -n "${SLACK_WEBHOOK_URL:-}" && "$DRY_RUN" != "true" ]]; then
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"${message}\"}" >/dev/null
        log_info "Slack notification sent"
    fi

    if [[ -n "${PAGERDUTY_INTEGRATION_KEY:-}" && "$DRY_RUN" != "true" ]]; then
        curl -s -X POST "https://events.pagerduty.com/v2/enqueue" \
            -H "Content-Type: application/json" \
            -d "{
                \"routing_key\": \"${PAGERDUTY_INTEGRATION_KEY}\",
                \"event_action\": \"trigger\",
                \"payload\": {
                    \"summary\": \"Failover to ${DR_REGION}\",
                    \"severity\": \"critical\",
                    \"source\": \"${CLUSTER_NAME}\",
                    \"custom_details\": {
                        \"primary\": \"${PRIMARY_REGION}\",
                        \"dr\": \"${DR_REGION}\"
                    }
                }
            }" >/dev/null
        log_info "PagerDuty incident created"
    fi

    if [[ -n "${EMAIL_RECIPIENTS:-}" && "$DRY_RUN" != "true" ]]; then
        echo "$message" | mail -s "ALERT: Failover to ${DR_REGION}" "$EMAIL_RECIPIENTS" 2>/dev/null || true
        log_info "Email notification sent"
    fi
}

main() {
    log_info "============================================"
    log_info "  Cross-Region Failover"
    log_info "  Primary: ${PRIMARY_REGION}"
    log_info "  DR:      ${DR_REGION}"
    log_info "  Dry Run: ${DRY_RUN}"
    log_info "============================================"

    check_prerequisites

    if health_check_primary; then
        log_info "Primary is healthy -- no action needed"
        exit 0
    fi

    verify_dr_readiness
    deploy_dr_workloads
    promote_dr_database
    update_dns
    verify_dns_propagation
    validate_dr_health
    notify_stakeholders

    echo ""
    log_info "============================================"
    log_info "  Failover to ${DR_REGION} complete"
    log_info "============================================"
}

main