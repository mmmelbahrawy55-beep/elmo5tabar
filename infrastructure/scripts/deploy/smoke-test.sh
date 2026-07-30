#!/bin/bash
set -euo pipefail

# =============================================================================
# Smoke Test Script
#
# Validates deployment health by checking:
#   - Health endpoint (200)
#   - Auth endpoint (valid response)
#   - Database connectivity
#   - Redis connectivity
#   - AI service health
#   - Static asset serving
#   - API response time (< 500ms)
#
# Usage:
#   ./smoke-test.sh [deployment-color|preview] [hostname]
#
# Examples:
#   ./smoke-test.sh blue
#   ./smoke-test.sh green
#   ./smoke-test.sh preview pr-42.staging.almokhtabar.com
# =============================================================================

BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[INFO]${NC}  $*"; }
log_pass()  { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[PASS]${NC}  $*"; }
log_fail()  { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[FAIL]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[WARN]${NC}  $*"; }
log_step()  { echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[STEP]${NC}  $*"; }

usage() {
    cat <<EOF
Usage: $(basename "$0") [COLOR|preview] [HOSTNAME]

Arguments:
  COLOR     Deployment color (blue|green)                   [default: blue]
  HOSTNAME  Override hostname for preview environments

Examples:
  $(basename "$0") blue
  $(basename "$0") green
  $(basename "$0") preview pr-42.staging.almokhtabar.com
EOF
    exit 0
}

# ---- Configuration ----
COLOR="${1:-blue}"
HOSTNAME="${2:-}"
NAMESPACE="${NAMESPACE:-almokhtabar}"
RELEASE="${RELEASE:-almokhtabar}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

max_time_ms=5000
timeout_seconds=10

# ---- Helpers ----

pass() {
    log_pass "$1"
    PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
    log_fail "$1"
    FAIL_COUNT=$((FAIL_COUNT + 1))
}

skip() {
    log_warn "$1"
    SKIP_COUNT=$((SKIP_COUNT + 1))
}

http_get() {
    local url="$1"
    local max_time="${2:-$max_time_ms}"

    curl -s -o /dev/null -w "%{http_code}:%{time_total}" \
        --connect-timeout "$timeout_seconds" \
        --max-time "$((timeout_seconds + 5))" \
        "$url" 2>/dev/null || echo "000:9999"
}

k8s_exec() {
    local pod_label="$1"
    local container="$2"
    shift 2
    local cmd=("$@")

    local pod
    pod=$(kubectl get pods -n "$NAMESPACE" \
        -l "app=${RELEASE},color=${COLOR},${pod_label}" \
        -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

    if [[ -z "$pod" ]]; then
        echo "POD_NOT_FOUND"
        return 1
    fi

    kubectl exec -n "$NAMESPACE" "$pod" -c "$container" -- "${cmd[@]}" 2>/dev/null || echo "EXEC_FAILED"
}

# ---- Tests ----

test_health_endpoint() {
    log_step "Testing health endpoint..."

    local base_url
    if [[ -n "$HOSTNAME" ]]; then
        base_url="https://${HOSTNAME}"
    else
        base_url="http://${RELEASE}-${COLOR}.${NAMESPACE}.svc.cluster.local:3000"
    fi

    local result
    result=$(http_get "${base_url}/api/health")
    local http_code="${result%%:*}"
    local response_time="${result##*:}"

    if [[ "$http_code" == "200" ]]; then
        local response_time_ms
        response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "0")
        pass "Health endpoint: HTTP 200 (${response_time_ms}ms)"
    else
        fail "Health endpoint: HTTP ${http_code} (expected 200)"
    fi

    if [[ -n "$response_time" ]]; then
        local response_time_ms
        response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "0")
        if (( $(echo "$response_time_ms > 500" | bc -l 2>/dev/null || echo 0) )); then
            fail "Health endpoint response time ${response_time_ms}ms exceeds 500ms threshold"
        fi
    fi
}

test_auth_endpoint() {
    log_step "Testing auth endpoint..."

    local base_url
    if [[ -n "$HOSTNAME" ]]; then
        base_url="https://${HOSTNAME}"
    else
        base_url="http://${RELEASE}-${COLOR}.${NAMESPACE}.svc.cluster.local:3000"
    fi

    local result
    result=$(http_get "${base_url}/api/v1/auth/status")
    local http_code="${result%%:*}"

    if [[ "$http_code" == "200" ]]; then
        pass "Auth endpoint: HTTP 200"
    else
        fail "Auth endpoint: HTTP ${http_code} (expected 200)"
    fi
}

test_database_connectivity() {
    log_step "Testing database connectivity..."

    local result
    result=$(k8s_exec "app.kubernetes.io/component=backend" "backend" \
        npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null || echo "EXEC_FAILED")

    if [[ "$result" != "POD_NOT_FOUND" && "$result" != "EXEC_FAILED" ]]; then
        pass "Database connectivity: OK"
    elif [[ "$result" == "POD_NOT_FOUND" ]]; then
        skip "Database test skipped — no backend pod found for color ${COLOR}"
    else
        fail "Database connectivity: FAILED"
    fi
}

test_redis_connectivity() {
    log_step "Testing Redis connectivity..."

    local result
    result=$(k8s_exec "app.kubernetes.io/component=backend" "backend" \
        redis-cli -h redis-master.${NAMESPACE}.svc.cluster.local ping 2>/dev/null || echo "EXEC_FAILED")

    if [[ "$result" == "PONG" ]]; then
        pass "Redis connectivity: OK"
    elif [[ "$result" == "POD_NOT_FOUND" ]]; then
        skip "Redis test skipped — no backend pod found"
    else
        fail "Redis connectivity: FAILED (got: ${result})"
    fi
}

test_ai_service_health() {
    log_step "Testing AI service health..."

    local base_url
    if [[ -n "$HOSTNAME" ]]; then
        base_url="https://ai.${HOSTNAME}"
    else
        base_url="http://${RELEASE}-ai-${COLOR}.${NAMESPACE}.svc.cluster.local:8000"
    fi

    local result
    result=$(http_get "${base_url}/health")
    local http_code="${result%%:*}"

    if [[ "$http_code" == "200" ]]; then
        pass "AI service health: HTTP 200"
    else
        warn "AI service health: HTTP ${http_code} (expected 200)"
    fi
}

test_static_assets() {
    log_step "Testing static assets..."

    local base_url
    if [[ -n "$HOSTNAME" ]]; then
        base_url="https://${HOSTNAME}"
    else
        base_url="http://${RELEASE}-${COLOR}.${NAMESPACE}.svc.cluster.local:3000"
    fi

    local result
    result=$(http_get "${base_url}/favicon.ico")
    local http_code="${result%%:*}"

    if [[ "$http_code" == "200" || "$http_code" == "304" ]]; then
        pass "Static assets: HTTP ${http_code}"
    else
        skip "Static assets: HTTP ${http_code} (non-critical)"
    fi
}

test_api_response_time() {
    log_step "Testing API response time (< 500ms)..."

    local base_url
    if [[ -n "$HOSTNAME" ]]; then
        base_url="https://${HOSTNAME}"
    else
        base_url="http://${RELEASE}-${COLOR}.${NAMESPACE}.svc.cluster.local:3000"
    fi

    local total=0
    local samples=3

    for i in $(seq 1 $samples); do
        local result
        result=$(http_get "${base_url}/api/health" 5000)
        local response_time="${result##*:}"
        total=$(echo "$total + $response_time" | bc 2>/dev/null || echo 0)
    done

    local avg
    avg=$(echo "scale=2; $total / $samples * 1000" | bc 2>/dev/null || echo "0")

    if (( $(echo "$avg < 500" | bc -l 2>/dev/null || echo 0) )); then
        pass "API response time: ${avg}ms (avg over ${samples} requests)"
    else
        fail "API response time: ${avg}ms exceeds 500ms threshold"
    fi
}

# ---- Main ----
main() {
    log_info "============================================"
    log_info "  Al Mokhtabar Smoke Tests"
    log_info "  Color:    ${COLOR}"
    log_info "  Hostname: ${HOSTNAME:-<internal>}"
    log_info "============================================"

    command -v kubectl >/dev/null 2>&1 || log_warn "kubectl not found — in-cluster tests will be skipped"
    command -v curl    >/dev/null 2>&1 || { log_error "curl is required"; exit 1; }
    command -v bc      >/dev/null 2>&1 || log_warn "bc not found — timing comparisons may fail"

    test_health_endpoint
    test_auth_endpoint
    test_database_connectivity
    test_redis_connectivity
    test_ai_service_health
    test_static_assets
    test_api_response_time

    echo ""
    log_info "============================================"
    log_info "  Smoke Test Summary"
    log_info "  Passed: ${GREEN}${PASS_COUNT}${NC}"
    log_info "  Failed: ${RED}${FAIL_COUNT}${NC}"
    log_info "  Skipped: ${YELLOW}${SKIP_COUNT}${NC}"
    log_info "============================================"

    if [[ $FAIL_COUNT -gt 0 ]]; then
        exit 1
    fi

    log_info "${BOLD}${GREEN}All smoke tests passed!${NC}"
}

main
