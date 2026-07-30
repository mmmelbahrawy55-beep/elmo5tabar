#!/bin/bash
set -euo pipefail

# =============================================================================
# Blue-Green Deployment Script
#
# Performs a zero-downtime blue-green deployment:
#   1. Detect which color (blue/green) is currently active
#   2. Deploy new version to the inactive side
#   3. Run smoke tests against new version
#   4. Switch traffic to new version via Kubernetes service selector
#   5. Health check after switch — rollback on failure
#   6. Scale down old version
#
# Usage:
#   ./blue-green.sh [--namespace NAMESPACE] [--release RELEASE] [--color auto|blue|green]
#                   [--image-tag TAG] [--values FILE] [--timeout DURATION]
#
# Examples:
#   ./blue-green.sh
#   ./blue-green.sh --namespace almokhtabar --image-tag abc1234 --timeout 10m
#   ./blue-green.sh --color green --release almokhtabar-green
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
  --namespace NS   Kubernetes namespace                     [default: almokhtabar]
  --release NAME   Helm release name prefix                 [default: almokhtabar]
  --color COLOR    Deployment color (auto|blue|green)       [default: auto]
  --image-tag TAG  Container image tag to deploy            [default: latest]
  --values FILE    Helm values file                         [default: values-production.yaml]
  --timeout DUR    Helm install timeout                     [default: 10m]
  --chart PATH     Path to Helm chart                       [default: ../../kubernetes/helm/almokhtabar]
  --skip-smoke     Skip smoke tests
  --help           Show this help message
EOF
    exit 0
}

# ---- Defaults ----
NAMESPACE="${NAMESPACE:-almokhtabar}"
RELEASE="${RELEASE:-almokhtabar}"
COLOR="${COLOR:-auto}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
VALUES="${VALUES:-values-production.yaml}"
TIMEOUT="${TIMEOUT:-10m}"
CHART="${CHART:-../../kubernetes/helm/almokhtabar}"
SKIP_SMOKE="${SKIP_SMOKE:-false}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---- Parse arguments ----
while [[ $# -gt 0 ]]; do
    case "$1" in
        --namespace)  NAMESPACE="$2";  shift 2 ;;
        --release)    RELEASE="$2";    shift 2 ;;
        --color)      COLOR="$2";      shift 2 ;;
        --image-tag)  IMAGE_TAG="$2";  shift 2 ;;
        --values)     VALUES="$2";     shift 2 ;;
        --timeout)    TIMEOUT="$2";    shift 2 ;;
        --chart)      CHART="$2";      shift 2 ;;
        --skip-smoke) SKIP_SMOKE="true"; shift ;;
        --help|-h)    usage ;;
        *) log_error "Unknown argument: $1"; usage ;;
    esac
done

# ---- Functions ----

detect_active_color() {
    log_step "Detecting active deployment color..."

    local current
    current=$(kubectl get svc "${RELEASE}-active" -n "$NAMESPACE" \
        -o jsonpath='{.spec.selector.color}' 2>/dev/null || echo "")

    if [[ -z "$current" ]]; then
        log_warn "No active service found — defaulting to blue"
        ACTIVE="blue"
        INACTIVE="green"
    else
        ACTIVE="$current"
        if [[ "$current" == "blue" ]]; then
            INACTIVE="green"
        else
            INACTIVE="blue"
        fi
        log_info "Active: ${BOLD}${ACTIVE}${NC}, Inactive: ${BOLD}${INACTIVE}${NC}"
    fi

    if [[ "$COLOR" != "auto" ]]; then
        if [[ "$COLOR" == "$ACTIVE" ]]; then
            log_error "Requested color '$COLOR' is already active — would cause downtime"
            exit 1
        fi
        INACTIVE="$COLOR"
        log_info "Overriding target color to: ${BOLD}$INACTIVE${NC}"
    fi
}

check_prerequisites() {
    log_step "Checking prerequisites..."

    command -v kubectl  >/dev/null 2>&1 || { log_error "kubectl is required"; exit 1; }
    command -v helm     >/dev/null 2>&1 || { log_error "helm is required"; exit 1; }
    command -v curl     >/dev/null 2>&1 || { log_error "curl is required"; exit 1; }

    if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
        log_error "Namespace '$NAMESPACE' does not exist"
        exit 1
    fi

    if [[ ! -f "$CHART/Chart.yaml" ]]; then
        log_error "Helm chart not found at '$CHART'"
        exit 1
    fi

    VALUES_PATH="${SCRIPT_DIR}/../../kubernetes/helm/almokhtabar/${VALUES}"
    if [[ ! -f "$VALUES_PATH" ]] && [[ ! "$VALUES" == /* ]]; then
        log_warn "Values file not found at '$VALUES_PATH', using chart defaults"
    fi

    log_info "All prerequisites met"
}

deploy_inactive() {
    log_step "Deploying to inactive side: ${BOLD}${INACTIVE}${NC}"

    local release_name="${RELEASE}-${INACTIVE}"
    local values_flag=""

    if [[ -f "$VALUES_PATH" ]]; then
        values_flag="-f $VALUES_PATH"
    fi

    log_info "Running: helm upgrade --install $release_name $CHART --namespace $NAMESPACE $values_flag ..."

    helm upgrade --install "$release_name" "$CHART" \
        --namespace "$NAMESPACE" \
        $values_flag \
        --set "global.imageTag=${IMAGE_TAG}" \
        --set "global.color=${INACTIVE}" \
        --wait --timeout "$TIMEOUT"

    log_info "Deployment to ${INACTIVE} completed"
}

run_smoke_tests() {
    if [[ "$SKIP_SMOKE" == "true" ]]; then
        log_warn "Skipping smoke tests (--skip-smoke)"
        return 0
    fi

    log_step "Running smoke tests against ${INACTIVE}..."

    if [[ -x "${SCRIPT_DIR}/smoke-test.sh" ]]; then
        "${SCRIPT_DIR}/smoke-test.sh" "$INACTIVE"
    else
        log_warn "smoke-test.sh not found at ${SCRIPT_DIR}/smoke-test.sh"
        log_warn "Performing basic health check instead..."

        local svc_name="${RELEASE}-${INACTIVE}"
        local health_url="http://${svc_name}.${NAMESPACE}.svc.cluster.local:3000/api/health"

        for i in $(seq 1 6); do
            local status
            status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$health_url" 2>/dev/null || echo "000")
            if [[ "$status" == "200" ]]; then
                log_info "Health check passed (HTTP $status)"
                return 0
            fi
            log_info "Attempt $i: health endpoint returned $status, retrying in 10s..."
            sleep 10
        done

        log_error "Smoke tests failed for ${INACTIVE}"
        return 1
    fi
}

switch_traffic() {
    log_step "Switching traffic to ${BOLD}${INACTIVE}${NC}..."

    # Patch the active service selector to point to the new color
    kubectl patch svc "${RELEASE}-active" -n "$NAMESPACE" \
        -p "{\"spec\":{\"selector\":{\"color\":\"${INACTIVE}\"}}}"

    log_info "Traffic switched to ${INACTIVE}"
}

health_check_after_switch() {
    log_step "Performing health check after traffic switch..."

    local max_attempts=12
    for i in $(seq 1 $max_attempts); do
        local status
        status=$(curl -s -o /dev/null -w "%{http_code}" \
            --connect-timeout 10 \
            "https://almokhtabar.com/api/health" 2>/dev/null || echo "000")

        if [[ "$status" == "200" ]]; then
            log_info "Health check passed (HTTP $status)"
            return 0
        fi

        log_info "Attempt $i of $max_attempts: health endpoint returned $status, retrying in 10s..."
        sleep 10
    done

    log_error "Health check failed after $max_attempts attempts"
    return 1
}

scale_down_old() {
    log_step "Scaling down old version (${BOLD}${ACTIVE}${NC})..."

    local old_release="${RELEASE}-${ACTIVE}"

    helm upgrade "$old_release" "$CHART" \
        --namespace "$NAMESPACE" \
        --set "global.imageTag=${IMAGE_TAG}" \
        --set "global.color=${ACTIVE}" \
        --set backend.replicaCount=0 \
        --set web.replicaCount=0 \
        --set ai-service.replicaCount=0 || true

    log_info "Old version scaled down"
}

rollback() {
    log_error "${BOLD}ROLLBACK INITIATED${NC}"

    log_info "Switching traffic back to ${ACTIVE}..."
    kubectl patch svc "${RELEASE}-active" -n "$NAMESPACE" \
        -p "{\"spec\":{\"selector\":{\"color\":\"${ACTIVE}\"}}}" || true

    log_info "Scaling down failed deployment..."
    local failed_release="${RELEASE}-${INACTIVE}"
    helm upgrade "$failed_release" "$CHART" \
        --namespace "$NAMESPACE" \
        --set backend.replicaCount=0 \
        --set web.replicaCount=0 \
        --set ai-service.replicaCount=0 || true

    log_info "Rollback complete — traffic returned to ${ACTIVE}"
}

# ---- Main ----
main() {
    log_info "============================================"
    log_info "  Al Mokhtabar Blue-Green Deployment"
    log_info "  Namespace:  ${NAMESPACE}"
    log_info "  Release:    ${RELEASE}"
    log_info "  Image Tag:  ${IMAGE_TAG}"
    log_info "  Timeout:    ${TIMEOUT}"
    log_info "============================================"

    check_prerequisites
    detect_active_color

    echo ""
    log_info "${BOLD}Deployment plan:${NC}"
    echo "  Active:  ${ACTIVE}"
    echo "  Target:  ${INACTIVE} ← will deploy here"
    echo ""

    # Deploy to inactive side
    deploy_inactive

    # Run smoke tests
    if ! run_smoke_tests; then
        rollback
        exit 1
    fi

    # Switch traffic
    switch_traffic

    # Health check
    if ! health_check_after_switch; then
        rollback
        exit 1
    fi

    # Scale down old
    scale_down_old

    echo ""
    log_info "${BOLD}${GREEN}Deployment complete!${NC}"
    echo "  Active: ${INACTIVE} (was ${ACTIVE})"
    echo "  Image:  ${IMAGE_TAG}"
}

main
