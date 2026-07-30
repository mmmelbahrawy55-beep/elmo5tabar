#!/bin/bash
set -euo pipefail

# =============================================================================
# Disaster Recovery Plan Orchestrator — Al Mokhtabar Laboratory
#
# Complete DR runbook that coordinates across failover, failback, backup,
# restore, and notification workflows.
#
# Usage:
#   ./disaster-recovery-plan.sh [--plan check|failover|failback|restore|status]
#                                [--dry-run]
#
# Examples:
#   ./disaster-recovery-plan.sh --plan check
#   ./disaster-recovery-plan.sh --plan failover --dry-run
#   ./disaster-recovery-plan.sh --plan status
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
Usage: $(basename "$0") --plan {check|failover|failback|restore|status} [OPTIONS]

Plans:
  check     Run readiness checks across all regions
  failover  Execute cross-region failover to DR
  failback  Failback to primary after recovery
  restore   Restore from latest backup
  status    Print DR status summary

Options:
  --primary-region  Primary region                           [default: us-east-1]
  --dr-region       DR region                                [default: us-west-2]
  --dry-run         Show what would be done without doing it
  --help            Show this help message
EOF
    exit 0
}

PLAN="${PLAN:-check}"
PRIMARY_REGION="${PRIMARY_REGION:-us-east-1}"
DR_REGION="${DR_REGION:-us-west-2}"
DRY_RUN="${DRY_RUN:-false}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

declare -A REGION_STATUS

while [[ $# -gt 0 ]]; do
    case "$1" in
        --plan)           PLAN="$2";          shift 2 ;;
        --primary-region) PRIMARY_REGION="$2"; shift 2 ;;
        --dr-region)      DR_REGION="$2";     shift 2 ;;
        --dry-run)        DRY_RUN="true";     shift ;;
        --help|-h)        usage ;;
        *) log_error "Unknown: $1"; usage ;;
    esac
done

validate_plan() {
    case "$PLAN" in
        check|failover|failback|restore|status) return 0 ;;
        *) log_error "Invalid plan: $PLAN"; usage ;;
    esac
}

check_prerequisites() {
    log_step "Checking prerequisites..."
    local missing=0
    for cmd in kubectl helm curl jq dig; do
        command -v "$cmd" >/dev/null 2>&1 || { log_warn "$cmd not found"; missing=$((missing + 1)); }
    done
    [[ $missing -gt 0 ]] && log_warn "${missing} tool(s) missing — some operations may be limited"
    log_info "Prerequisites check complete"
}

# ---------------------------------------------------------------------------
# PLAN: check — Readiness checks across all regions
# ---------------------------------------------------------------------------
run_check() {
    log_info "============================================"
    log_info "  DR Readiness Check"
    log_info "============================================"

    check_prerequisites

    # Check cluster connectivity
    for region in "$PRIMARY_REGION" "$DR_REGION"; do
        local context="${CLUSTER_NAME:-almokhtabar}-${region}"
        if kubectl config use-context "$context" &>/dev/null; then
            local nodes
            nodes=$(kubectl get nodes --no-headers 2>/dev/null | wc -l || echo 0)
            local pods
            pods=$(kubectl get pods --all-namespaces --no-headers 2>/dev/null | wc -l || echo 0)
            REGION_STATUS["${region}_nodes"]=$nodes
            REGION_STATUS["${region}_pods"]=$pods
            log_info "${region}: ${nodes} nodes, ${pods} pods"
        else
            REGION_STATUS["${region}_nodes"]=0
            REGION_STATUS["${region}_pods"]=0
            log_warn "${region}: cannot connect"
        fi
    done

    # Check DNS
    local dns_ip
    dns_ip=$(dig +short "${DNS_ZONE:-almokhtabar.com}" @8.8.8.8 2>/dev/null || echo "unresolved")
    log_info "DNS: ${DNS_ZONE:-almokhtabar.com} -> ${dns_ip}"

    # Check backup freshness
    local latest_backup
    latest_backup=$(aws s3 ls "${BUCKET_URL:-s3://almokhtabar-backups}/daily/" 2>/dev/null | sort | tail -1 | awk '{print $1, $2}' || echo "none")
    log_info "Latest backup: ${latest_backup}"

    # Database replication lag
    if command -v psql &>/dev/null; then
        log_info "Checking replication lag..."
        local pg_dr_host="${PG_DR_HOST:-dr-postgres.${DR_REGION}.almokhtabar.com}"
        local lag
        lag=$(PGPASSWORD="${PG_DR_PASSWORD:-}" psql -h "$pg_dr_host" \
            -U "${PG_DR_USER:-postgres}" -d "${PG_DR_DB:-almokhtabar}" \
            -t -c "SELECT GREATEST(0, EXTRACT(EPOCH FROM NOW() - pg_last_xact_replay_timestamp()))::int;" 2>/dev/null | tr -d ' ' || echo "unknown")
        log_info "Replication lag: ${lag}s"
    fi

    # Summary
    echo ""
    log_info "============================================"
    log_info "  Readiness Summary"
    log_info "  Primary (${PRIMARY_REGION}): ${REGION_STATUS[${PRIMARY_REGION}_nodes]:-0} nodes, ${REGION_STATUS[${PRIMARY_REGION}_pods]:-0} pods"
    log_info "  DR (${DR_REGION}):      ${REGION_STATUS[${DR_REGION}_nodes]:-0} nodes, ${REGION_STATUS[${DR_REGION}_pods]:-0} pods"
    log_info "  DNS:      ${dns_ip}"
    log_info "  Backup:   ${latest_backup}"
    log_info "============================================"
}

# ---------------------------------------------------------------------------
# PLAN: failover
# ---------------------------------------------------------------------------
run_failover() {
    log_info "============================================"
    log_info "  Executing Failover: ${PRIMARY_REGION} -> ${DR_REGION}"
    log_info "============================================"

    local script="${SCRIPT_DIR}/failover.sh"
    if [[ -x "$script" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would execute: $script --primary-region $PRIMARY_REGION --dr-region $DR_REGION --dry-run"
        else
            log_info "Launching failover script..."
            "$script" --primary-region "$PRIMARY_REGION" --dr-region "$DR_REGION" --force
        fi
    else
        log_error "failover.sh not found at ${script}"
        exit 1
    fi
}

# ---------------------------------------------------------------------------
# PLAN: failback
# ---------------------------------------------------------------------------
run_failback() {
    log_info "============================================"
    log_info "  Executing Failback: ${DR_REGION} -> ${PRIMARY_REGION}"
    log_info "============================================"

    local script="${SCRIPT_DIR}/failback.sh"
    if [[ -x "$script" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would execute: $script --primary-region $PRIMARY_REGION --dr-region $DR_REGION --dry-run"
        else
            log_info "Launching failback script..."
            "$script" --primary-region "$PRIMARY_REGION" --dr-region "$DR_REGION"
        fi
    else
        log_error "failback.sh not found at ${script}"
        exit 1
    fi
}

# ---------------------------------------------------------------------------
# PLAN: restore
# ---------------------------------------------------------------------------
run_restore() {
    log_info "============================================"
    log_info "  DR Restore from Backup"
    log_info "============================================"

    local script="${SCRIPT_DIR}/../backup/restore.sh"
    if [[ -x "$script" ]]; then
        local restore_type="${BACKUP_TYPE:-daily}"
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would restore latest ${restore_type} backup"
        else
            log_info "Launching restore..."
            "$script" --type "$restore_type" --all
        fi
    else
        log_error "restore.sh not found at ${script}"
        exit 1
    fi
}

# ---------------------------------------------------------------------------
# PLAN: status
# ---------------------------------------------------------------------------
run_status() {
    log_info "============================================"
    log_info "  DR Status Report"
    log_info "============================================"

    check_prerequisites

    # Primary region status
    log_step "Primary Region: ${PRIMARY_REGION}"
    local primary_context="${CLUSTER_NAME:-almokhtabar}-${PRIMARY_REGION}"
    if kubectl config use-context "$primary_context" &>/dev/null; then
        local primary_pods
        primary_pods=$(kubectl get pods -n "${NAMESPACE:-almokhtabar}" --no-headers 2>/dev/null | \
            awk '{print $3}' | sort | uniq -c | tr '\n' ' ' || echo "unknown")
        log_info "  Pods: ${primary_pods}"
        log_info "  Services:" 
        kubectl get svc -n "${NAMESPACE:-almokhtabar}" -o name 2>/dev/null | while read -r svc; do
            log_info "    ${svc}"
        done
    else
        log_warn "  Cannot connect to primary cluster"
    fi

    # DR region status
    echo ""
    log_step "DR Region: ${DR_REGION}"
    local dr_context="${CLUSTER_NAME:-almokhtabar}-${DR_REGION}"
    if kubectl config use-context "$dr_context" &>/dev/null; then
        local dr_pods
        dr_pods=$(kubectl get pods -n "${NAMESPACE:-almokhtabar}" --no-headers 2>/dev/null | \
            awk '{print $3}' | sort | uniq -c | tr '\n' ' ' || echo "unknown")
        log_info "  Pods: ${dr_pods}"
    else
        log_warn "  Cannot connect to DR cluster"
    fi

    # Health endpoint check
    echo ""
    log_step "Application Health"
    local url="https://${DNS_ZONE:-almokhtabar.com}/api/health"
    local status
    status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$url" 2>/dev/null || echo "unreachable")
    log_info "  ${url}: HTTP ${status}"

    # Backup status
    echo ""
    log_step "Backup Status"
    if command -v aws &>/dev/null; then
        for type in daily weekly monthly; do
            local count
            count=$(aws s3 ls "${BUCKET_URL:-s3://almokhtabar-backups}/${type}/" 2>/dev/null | wc -l || echo 0)
            log_info "  ${type}: ${count} backup(s)"
        done
    fi

    # PagerDuty status
    echo ""
    log_step "Incident Status"
    if [[ -n "${PAGERDUTY_INTEGRATION_KEY:-}" ]]; then
        log_info "  PagerDuty integration configured"
    else
        log_warn "  PagerDuty not configured"
    fi

    log_info "============================================"
    log_info "  DR Status Report Complete"
    log_info "============================================"
}

# ---------------------------------------------------------------------------
# Main — Plan dispatcher
# ---------------------------------------------------------------------------
main() {
    log_info "============================================"
    log_info "  Al Mokhtabar Disaster Recovery Plan"
    log_info "  Plan:      ${PLAN}"
    log_info "  Primary:   ${PRIMARY_REGION}"
    log_info "  DR:        ${DR_REGION}"
    log_info "  Dry Run:   ${DRY_RUN}"
    log_info "============================================"

    validate_plan

    case "$PLAN" in
        check)    run_check ;;
        failover) run_failover ;;
        failback) run_failback ;;
        restore)  run_restore ;;
        status)   run_status ;;
    esac
}

main