#!/bin/bash
set -euo pipefail

# =============================================================================
# Canary Deployment Script
#
# Progressive traffic shift: 10% → 50% → 100% with metric-based promotion gates.
# Auto-rollback if error rate > 1% or p99 latency > 500ms.
#
# Usage:
#   ./canary.sh [--namespace NAMESPACE] [--release RELEASE] [--image-tag TAG]
#               [--step-duration SECONDS] [--initial-weight 10]
#
# Examples:
#   ./canary.sh --image-tag abc1234
#   ./canary.sh --initial-weight 5 --step-duration 300
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
  --namespace NS     Kubernetes namespace                     [default: almokhtabar]
  --release NAME     Helm release name                        [default: almokhtabar]
  --image-tag TAG    Container image tag to deploy            [required]
  --initial-weight   Initial canary traffic percentage         [default: 10]
  --step-duration    Seconds between traffic shifts            [default: 180]
  --max-error-rate   Error rate threshold for rollback         [default: 1.0]
  --max-latency-p99  p99 latency threshold in ms               [default: 500]
  --values FILE      Helm values file                         [default: values-production.yaml]
  --chart PATH       Path to Helm chart                       [default: ../../kubernetes/helm/almokhtabar]
  --help             Show this help message
EOF
    exit 0
}

# ---- Defaults ----
NAMESPACE="${NAMESPACE:-almokhtabar}"
RELEASE="${RELEASE:-almokhtabar}"
IMAGE_TAG="${IMAGE_TAG:-}"
INITIAL_WEIGHT="${INITIAL_WEIGHT:-10}"
STEP_DURATION="${STEP_DURATION:-180}"
MAX_ERROR_RATE="${MAX_ERROR_RATE:-1.0}"
MAX_LATENCY_P99="${MAX_LATENCY_P99:-500}"
VALUES="${VALUES:-values-production.yaml}"
CHART="${CHART:-../../kubernetes/helm/almokhtabar}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---- Parse arguments ----
while [[ $# -gt 0 ]]; do
    case "$1" in
        --namespace)      NAMESPACE="$2";       shift 2 ;;
        --release)        RELEASE="$2";         shift 2 ;;
        --image-tag)      IMAGE_TAG="$2";       shift 2 ;;
        --initial-weight) INITIAL_WEIGHT="$2";  shift 2 ;;
        --step-duration)  STEP_DURATION="$2";   shift 2 ;;
        --max-error-rate) MAX_ERROR_RATE="$2";  shift 2 ;;
        --max-latency-p99) MAX_LATENCY_P99="$2"; shift 2 ;;
        --values)         VALUES="$2";          shift 2 ;;
        --chart)          CHART="$2";           shift 2 ;;
        --help|-h)        usage ;;
        *) log_error "Unknown argument: $1"; usage ;;
    esac
done

if [[ -z "$IMAGE_TAG" ]]; then
    log_error "--image-tag is required"
    exit 1
fi

# ---- Metric evaluation ----

check_metrics() {
    local weight="$1"

    # This function queries Prometheus or a metrics sidecar.
    # Replace the curl URL with your actual metrics endpoint.

    local metrics_url="http://prometheus-operated.${NAMESPACE}.svc.cluster.local:9090/api/v1/query"

    # Query error rate (last 2 minutes)
    local error_rate=0
    local p99_latency=0

    if curl -sf --connect-timeout 5 "$metrics_url" --data-urlencode \
        "query=sum(rate(http_requests_total{app=\"${RELEASE}-canary\",status=~\"5..\"}[2m]))/sum(rate(http_requests_total{app=\"${RELEASE}-canary\"}[2m]))*100" \
        -o /tmp/canary-metrics.json 2>/dev/null; then
        error_rate=$(jq -r '.data.result[0].value[1] // 0' /tmp/canary-metrics.json 2>/dev/null || echo 0)
    fi

    if curl -sf --connect-timeout 5 "$metrics_url" --data-urlencode \
        "query=histogram_quantile(0.99,sum(rate(http_request_duration_seconds_bucket{app=\"${RELEASE}-canary\"}[2m]))by(le))*1000" \
        -o /tmp/canary-metrics-p99.json 2>/dev/null; then
        p99_latency=$(jq -r '.data.result[0].value[1] // 0' /tmp/canary-metrics-p99.json 2>/dev/null || echo 0)
    fi

    log_info "Canary metrics at ${weight}%: error_rate=${error_rate}%, p99=${p99_latency}ms"

    # Compare thresholds
    local error_status=0
    local latency_status=0

    if (( $(echo "$error_rate > $MAX_ERROR_RATE" | bc -l 2>/dev/null || echo 0) )); then
        log_error "Error rate ${error_rate}% exceeds threshold ${MAX_ERROR_RATE}%"
        error_status=1
    fi

    if (( $(echo "$p99_latency > $MAX_LATENCY_P99" | bc -l 2>/dev/null || echo 0) )); then
        log_error "p99 latency ${p99_latency}ms exceeds threshold ${MAX_LATENCY_P99}ms"
        latency_status=1
    fi

    if [[ $error_status -eq 1 || $latency_status -eq 1 ]]; then
        return 1
    fi

    log_info "Metrics within thresholds — continuing"
    return 0
}

# ---- Traffic shift ----

shift_traffic() {
    local weight="$1"

    log_step "Shifting canary traffic to ${weight}%..."

    # If using a service mesh like Istio, update the VirtualService
    # Otherwise, scale the canary replicas proportional to weight

    local stable_replicas=10
    local canary_replicas=$(( weight * stable_replicas / (100 - weight) ))
    [[ $canary_replicas -lt 1 ]] && canary_replicas=1

    log_info "Scaling canary to $canary_replicas replicas (${weight}% traffic)"

    kubectl scale deployment "${RELEASE}-canary" \
        --namespace "$NAMESPACE" \
        --replicas="$canary_replicas"

    # If using Ingress controller with weight-based routing:
    # kubectl annotate ingress "${RELEASE}-ingress" \
    #   --namespace "$NAMESPACE" \
    #   nginx.ingress.kubernetes.io/canary-weight="$weight"

    log_info "Traffic shifted to ${weight}%"
}

deploy_canary() {
    log_step "Deploying canary (initial weight: ${INITIAL_WEIGHT}%)..."

    local values_path="${SCRIPT_DIR}/../../kubernetes/helm/almokhtabar/${VALUES}"
    local values_flag=""

    if [[ -f "$values_path" ]]; then
        values_flag="-f $values_path"
    fi

    helm upgrade --install "${RELEASE}-canary" "$CHART" \
        --namespace "$NAMESPACE" \
        $values_flag \
        --set "global.imageTag=${IMAGE_TAG}" \
        --set "global.color=canary" \
        --set "backend.replicaCount=1" \
        --set "web.replicaCount=1" \
        --set "ai-service.replicaCount=1" \
        --set "global.canary=true" \
        --wait --timeout 5m

    log_info "Canary deployed"
}

rollback_canary() {
    log_error "${BOLD}CANARY ROLLBACK INITIATED${NC}"

    log_info "Scaling down canary to 0 replicas..."
    kubectl scale deployment "${RELEASE}-canary" \
        --namespace "$NAMESPACE" \
        --replicas=0 || true

    # Reset canary weight to 0
    # kubectl annotate ingress "${RELEASE}-ingress" \
    #   --namespace "$NAMESPACE" \
    #   nginx.ingress.kubernetes.io/canary-weight- || true

    log_info "Canary rolled back — stable version remains at 100%"
}

cleanup_canary() {
    log_step "Promoting canary to stable..."

    # Move the canary image tag to the stable release
    helm upgrade "${RELEASE}" "$CHART" \
        --namespace "$NAMESPACE" \
        --set "global.imageTag=${IMAGE_TAG}" \
        --set "backend.replicaCount=5" \
        --set "web.replicaCount=5" \
        --set "ai-service.replicaCount=3" \
        --wait --timeout 5m

    # Scale down canary
    helm upgrade "${RELEASE}-canary" "$CHART" \
        --namespace "$NAMESPACE" \
        --set "backend.replicaCount=0" \
        --set "web.replicaCount=0" \
        --set "ai-service.replicaCount=0" || true

    log_info "Canary promoted to stable"
}

# ---- Main ----
main() {
    log_info "============================================"
    log_info "  Al Mokhtabar Canary Deployment"
    log_info "  Namespace:      ${NAMESPACE}"
    log_info "  Image Tag:      ${IMAGE_TAG}"
    log_info "  Initial Weight: ${INITIAL_WEIGHT}%"
    log_info "  Step Duration:  ${STEP_DURATION}s"
    log_info "============================================"

    command -v kubectl >/dev/null 2>&1 || { log_error "kubectl is required"; exit 1; }
    command -v helm    >/dev/null 2>&1 || { log_error "helm is required"; exit 1; }
    command -v bc      >/dev/null 2>&1 || log_warn "bc not found — metric comparisons may fail"
    command -v jq      >/dev/null 2>&1 || log_warn "jq not found — metric parsing may fail"

    # Phase 1: Deploy canary
    deploy_canary

    # Phase 2: Progressive traffic shift with metric gates
    local weights=("$INITIAL_WEIGHT")
    if [[ "$INITIAL_WEIGHT" -lt 50 ]]; then
        weights+=("50")
    fi
    if [[ "${weights[-1]}" -lt 100 ]]; then
        weights+=("100")
    fi

    for weight in "${weights[@]}"; do
        shift_traffic "$weight"

        log_info "Monitoring for ${STEP_DURATION}s before promoting..."
        sleep "$STEP_DURATION"

        if ! check_metrics "$weight"; then
            rollback_canary
            exit 1
        fi
    done

    # Phase 3: Promote
    cleanup_canary

    echo ""
    log_info "${BOLD}${GREEN}Canary deployment promoted to stable${NC}"
    log_info "Image: ${IMAGE_TAG}"
}

main
