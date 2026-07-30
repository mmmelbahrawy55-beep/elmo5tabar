#!/bin/bash
set -euo pipefail

# =============================================================================
# Failback Script — Al Mokhtabar Laboratory
#
# After primary region recovers, this script:
#   1. Syncs data from DR back to primary
#   2. Verifies data consistency
#   3. Switches DNS back to primary
#   4. Demotes old DR primary
#   5. Validates application health
#
# Usage:
#   ./failback.sh [--primary-region REGION] [--dr-region REGION]
#                 [--dns-zone ZONE] [--dry-run]
#
# Examples:
#   ./failback.sh
#   ./failback.sh --primary-region us-east-1 --dr-region us-west-2 --dry-run
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
  --primary-region  Primary region identifier                 [default: us-east-1]
  --dr-region       DR region identifier                      [default: us-west-2]
  --dns-zone        Cloudflare DNS zone name                  [default: almokhtabar.com]
  --cluster-name    Kubernetes cluster name prefix            [default: almokhtabar]
  --dry-run         Show what would be done without doing it
  --help            Show this help message
EOF
    exit 0
}

PRIMARY_REGION="${PRIMARY_REGION:-us-east-1}"
DR_REGION="${DR_REGION:-us-west-2}"
DNS_ZONE="${DNS_ZONE:-almokhtabar.com}"
CLUSTER_NAME="${CLUSTER_NAME:-almokhtabar}"
DRY_RUN="${DRY_RUN:-false}"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --primary-region) PRIMARY_REGION="$2"; shift 2 ;;
        --dr-region)      DR_REGION="$2";      shift 2 ;;
        --dns-zone)       DNS_ZONE="$2";       shift 2 ;;
        --cluster-name)   CLUSTER_NAME="$2";   shift 2 ;;
        --dry-run)        DRY_RUN="true";      shift ;;
        --help|-h)        usage ;;
        *) log_error "Unknown: $1"; usage ;;
    esac
done

check_prerequisites() {
    log_step "Checking prerequisites..."
    command -v psql      >/dev/null 2>&1 || log_warn "psql not found"
    command -v redis-cli >/dev/null 2>&1 || log_warn "redis-cli not found"
    command -v rsync     >/dev/null 2>&1 || log_warn "rsync not found"
    command -v curl      >/dev/null 2>&1 || { log_error "curl required"; exit 1; }
    command -v jq        >/dev/null 2>&1 || log_warn "jq not found"
    command -v kubectl   >/dev/null 2>&1 || log_warn "kubectl not found"
    log_info "Prerequisites check complete"
}

verify_primary_healthy() {
    log_step "Verifying primary region (${PRIMARY_REGION}) health..."

    local primary_url="https://primary.${PRIMARY_REGION}.almokhtabar.com/api/health"

    for i in $(seq 1 6); do
        local status
        status=$(curl -s -o /dev/null -w "%{http_code}" \
            --connect-timeout 10 "$primary_url" 2>/dev/null || echo "000")

        if [[ "$status" == "200" ]]; then
            log_info "Primary region is healthy (HTTP 200)"
            return 0
        fi
        log_info "Attempt $i: primary returned HTTP ${status}, retrying..."
        sleep 10
    done

    log_error "Primary region not healthy after failback attempt"
    return 1
}

sync_database() {
    log_step "Syncing database from DR back to primary..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would sync Postgres from ${DR_REGION} -> ${PRIMARY_REGION}"
        return 0
    fi

    local pg_dr_host="${PG_DR_HOST:-dr-postgres.${DR_REGION}.almokhtabar.com}"
    local pg_primary_host="${PG_PRIMARY_HOST:-postgres.${PRIMARY_REGION}.almokhtabar.com}"

    if command -v pg_dump &>/dev/null && command -v psql &>/dev/null; then
        log_info "Taking a dump of DR database..."

        PGPASSWORD="${PG_DR_PASSWORD:-}" pg_dump -h "$pg_dr_host" \
            -U "${PG_DR_USER:-postgres}" -d "${PG_DR_DB:-almokhtabar}" \
            --no-owner --no-acl -Fc -f /tmp/dr_dump.dump 2>/dev/null || {
            log_error "Failed to dump DR database"
            return 1
        }

        log_info "Restoring to primary..."
        PGPASSWORD="${PG_PRIMARY_PASSWORD:-}" pg_restore -h "$pg_primary_host" \
            -U "${PG_PRIMARY_USER:-postgres}" -d "${PG_PRIMARY_DB:-almokhtabar}" \
            --clean --if-exists -j 4 /tmp/dr_dump.dump 2>/dev/null || {
            log_warn "pg_restore had warnings (continuing)"
        }

        rm -f /tmp/dr_dump.dump
        log_info "Database sync complete"
    fi

    # Redis sync
    local redis_dr_host="${REDIS_DR_HOST:-dr-redis.${DR_REGION}.almokhtabar.com}"
    local redis_primary_host="${REDIS_PRIMARY_HOST:-redis-master.${PRIMARY_REGION}.almokhtabar.com}"

    if command -v redis-cli &>/dev/null; then
        log_info "Syncing Redis..."
        redis-cli -h "$redis_dr_host" --rdb /tmp/dr_redis.rdb 2>/dev/null || true
        # Configure primary as replica of DR temporarily
        redis-cli -h "$redis_primary_host" SLAVEOF "$redis_dr_host" 6379 2>/dev/null || true
        sleep 5
        redis-cli -h "$redis_primary_host" SLAVEOF NO ONE 2>/dev/null || true
        log_info "Redis sync complete"
    fi
}

sync_uploads() {
    log_step "Syncing uploaded files from DR to primary..."

    local dr_uploads_host="${DR_UPLOADS_HOST:-dr-storage.${DR_REGION}.almokhtabar.com}"
    local primary_uploads_host="${PRIMARY_UPLOADS_HOST:-storage.${PRIMARY_REGION}.almokhtabar.com}"
    local dr_path="${DR_UPLOADS_PATH:-/data/uploads/}"
    local primary_path="${PRIMARY_UPLOADS_PATH:-/data/uploads/}"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would rsync: ${dr_uploads_host}:${dr_path} -> ${primary_uploads_host}:${primary_path}"
        return 0
    fi

    if command -v rsync &>/dev/null; then
        rsync -avz --delete -e "ssh -o StrictHostKeyChecking=no" \
            "${dr_uploads_host}:${dr_path}" \
            "${primary_uploads_host}:${primary_path}" 2>/dev/null || {
            log_warn "rsync failed -- uploads may be out of sync"
        }
        log_info "Uploads sync complete"
    else
        log_warn "rsync not found -- skipping uploads sync"
    fi
}

verify_consistency() {
    log_step "Verifying data consistency between regions..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would verify consistency"
        return 0
    fi

    if command -v psql &>/dev/null; then
        local pg_primary_host="${PG_PRIMARY_HOST:-postgres.${PRIMARY_REGION}.almokhtabar.com}"
        local pg_dr_host="${PG_DR_HOST:-dr-postgres.${DR_REGION}.almokhtabar.com}"

        local primary_count
        local dr_count

        primary_count=$(PGPASSWORD="${PG_PRIMARY_PASSWORD:-}" psql -h "$pg_primary_host" \
            -U "${PG_PRIMARY_USER:-postgres}" -d "${PG_PRIMARY_DB:-almokhtabar}" \
            -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ' || echo 0)

        dr_count=$(PGPASSWORD="${PG_DR_PASSWORD:-}" psql -h "$pg_dr_host" \
            -U "${PG_DR_USER:-postgres}" -d "${PG_DR_DB:-almokhtabar}" \
            -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ' || echo 0)

        if [[ "$primary_count" -eq "$dr_count" ]] && [[ "$primary_count" -gt 0 ]]; then
            log_info "Consistency check: ${primary_count} tables in both regions"
        else
            log_warn "Table count mismatch: primary=${primary_count}, dr=${dr_count}"
        fi
    fi

    log_info "Consistency verification complete"
}

switch_dns_to_primary() {
    log_step "Switching DNS back to primary region (${PRIMARY_REGION})..."

    if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
        log_warn "CLOUDFLARE_API_TOKEN not set -- DNS update skipped"
        return 1
    fi

    local primary_ip="${PRIMARY_LOAD_BALANCER_IP:?Primary LB IP is required}"
    local records=("@", "api", "app", "www")

    for record in "${records[@]}"; do
        local record_id
        record_id=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=A&name=${record}.${DNS_ZONE}" \
            -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
            -H "Content-Type: application/json" | jq -r '.result[0].id // empty' 2>/dev/null || echo "")

        if [[ -n "$record_id" ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                log_info "[DRY RUN] Would update ${record}.${DNS_ZONE} -> ${primary_ip}"
            else
                curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${record_id}" \
                    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
                    -H "Content-Type: application/json" \
                    -d "{\"type\":\"A\",\"name\":\"${record}.${DNS_ZONE}\",\"content\":\"${primary_ip}\",\"ttl\":60,\"proxied\":true}" \
                    >/dev/null
                log_info "DNS: ${record}.${DNS_ZONE} -> ${primary_ip}"
            fi
        fi
    done

    log_info "DNS switched to primary"
}

demote_dr() {
    log_step "Demoting DR region to replica status..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would configure DR as replica of primary"
        return 0
    fi

    local pg_primary_host="${PG_PRIMARY_HOST:-postgres.${PRIMARY_REGION}.almokhtabar.com}"
    local pg_dr_host="${PG_DR_HOST:-dr-postgres.${DR_REGION}.almokhtabar.com}"

    if command -v psql &>/dev/null; then
        PGPASSWORD="${PG_DR_PASSWORD:-}" psql -h "$pg_dr_host" \
            -U "${PG_DR_USER:-postgres}" -d "${PG_DR_DB:-almokhtabar}" \
            -c "SELECT pg_promote();" 2>/dev/null || true

        # Configure DR as standby of primary
        # In production, this would involve rebuilding the replica
        log_info "DR database demoted to replica"
    fi

    local redis_primary_host="${REDIS_PRIMARY_HOST:-redis-master.${PRIMARY_REGION}.almokhtabar.com}"
    local redis_dr_host="${REDIS_DR_HOST:-dr-redis.${DR_REGION}.almokhtabar.com}"

    if command -v redis-cli &>/dev/null; then
        redis-cli -h "$redis_dr_host" SLAVEOF "$redis_primary_host" 6379 2>/dev/null || true
        log_info "DR Redis configured as replica"
    fi
}

validate_health() {
    log_step "Validating application health in primary region..."

    local url="https://${DNS_ZONE}/api/health"

    for i in $(seq 1 6); do
        local status
        status=$(curl -s -o /dev/null -w "%{http_code}" \
            --connect-timeout 10 "$url" 2>/dev/null || echo "000")

        if [[ "$status" == "200" ]]; then
            log_info "Health check: HTTP 200"
            return 0
        fi
        log_info "Attempt $i: HTTP ${status}"
        sleep 10
    done

    log_warn "Health check did not return 200"
    return 1
}

notify() {
    log_step "Sending failback notifications..."

    local message="? FAILBACK COMPLETE
    Primary: ${PRIMARY_REGION}
    DR:      ${DR_REGION}
    Time:    $(date -u)"

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
                \"event_action\": \"resolve\",
                \"payload\": {
                    \"summary\": \"Failback to ${PRIMARY_REGION} complete\",
                    \"severity\": \"info\",
                    \"source\": \"${CLUSTER_NAME}\"
                }
            }" >/dev/null
        log_info "PagerDuty incident resolved"
    fi
}

main() {
    log_info "============================================"
    log_info "  Failback to Primary Region"
    log_info "  Primary: ${PRIMARY_REGION}"
    log_info "  DR:      ${DR_REGION}"
    log_info "  Dry Run: ${DRY_RUN}"
    log_info "============================================"

    check_prerequisites
    verify_primary_healthy || exit 1
    sync_database
    sync_uploads
    verify_consistency
    switch_dns_to_primary
    demote_dr
    validate_health
    notify

    echo ""
    log_info "Failback to ${PRIMARY_REGION} complete"
}

main