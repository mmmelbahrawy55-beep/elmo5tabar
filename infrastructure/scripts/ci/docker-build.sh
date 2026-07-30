#!/bin/bash
set -euo pipefail

# =============================================================================
# Docker Build Script — Multi-Arch Build with Buildx, Cosign Signing, and
# GitHub Actions Cache
#
# Usage:
#   ./docker-build.sh [--service backend|web|ai-service] [--tag TAG] [--push]
#                     [--platforms linux/amd64,linux/arm64]
#
# Examples:
#   ./docker-build.sh --service backend --push
#   ./docker-build.sh --service web --tag v1.2.3 --platforms linux/amd64
# =============================================================================

BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[ERROR]${NC} $*" >&2; }
log_step()  { echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[STEP]${NC}  $*"; }

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Options:
  --service NAME   Service to build (backend|web|ai-service)  [required]
  --tag TAG        Image tag (default: git sha or "dev")
  --registry URL   Container registry URL                     [default: ghcr.io/almokhtabar]
  --push           Push images after building
  --platforms      Comma-separated platforms                  [default: linux/amd64,linux/arm64]
  --cosign-key     Path to cosign private key                 [default: cosign.key]
  --help           Show this help message
EOF
    exit 0
}

# ---- Defaults ----
SERVICE=""
TAG="${GITHUB_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo "dev")}"
REGISTRY="${REGISTRY:-ghcr.io/almokhtabar}"
PUSH="false"
PLATFORMS="linux/amd64,linux/arm64"
COSIGN_KEY="${COSIGN_KEY:-cosign.key}"
DOCKER_DIR="docker"

# ---- Parse arguments ----
while [[ $# -gt 0 ]]; do
    case "$1" in
        --service)    SERVICE="$2";       shift 2 ;;
        --tag)        TAG="$2";           shift 2 ;;
        --registry)   REGISTRY="$2";      shift 2 ;;
        --push)       PUSH="true";        shift   ;;
        --platforms)  PLATFORMS="$2";     shift 2 ;;
        --cosign-key) COSIGN_KEY="$2";    shift 2 ;;
        --help|-h)    usage              ;;
        *) log_error "Unknown argument: $1"; usage ;;
    esac
done

if [[ -z "$SERVICE" ]]; then
    log_error "--service is required. Use: backend, web, or ai-service"
    exit 1
fi

VALID_SERVICES="backend web ai-service"
if ! echo "$VALID_SERVICES" | grep -qw "$SERVICE"; then
    log_error "Invalid service '$SERVICE'. Must be one of: $VALID_SERVICES"
    exit 1
fi

DOCKERFILE="${DOCKER_DIR}/Dockerfile.${SERVICE}"
if [[ ! -f "$DOCKERFILE" ]]; then
    log_error "Dockerfile not found: $DOCKERFILE"
    exit 1
fi

IMAGE_NAME="${REGISTRY}/${SERVICE}"
TAGS=("${IMAGE_NAME}:${TAG}" "${IMAGE_NAME}:latest")

# ---- Pre-flight checks ----
check_prerequisites() {
    log_step "Checking prerequisites..."

    command -v docker  >/dev/null 2>&1 || { log_error "docker is required but not installed"; exit 1; }
    command -v cosign  >/dev/null 2>&1 || log_warn "cosign not found — image signing will be skipped"

    if [[ "$PUSH" == "true" ]]; then
        docker system info 2>/dev/null | grep -q "Experimental: true" || \
            log_warn "Docker experimental features may be required for multi-arch builds"
    fi

    log_info "All prerequisites met"
}

# ---- Setup Buildx ----
setup_buildx() {
    log_step "Setting up Docker Buildx..."

    BUILDER_NAME="almokhtabar-builder-$(date +%s)"

    if docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
        log_info "Using existing builder: $BUILDER_NAME"
    else
        docker buildx create --name "$BUILDER_NAME" --driver docker-container --bootstrap --use
        log_info "Created new builder: $BUILDER_NAME"
    fi

    docker buildx inspect --bootstrap
    log_info "Buildx ready"
}

# ---- Build and push ----
build_image() {
    log_step "Building image for service: ${BOLD}${SERVICE}${NC}"

    local push_flag=""
    [[ "$PUSH" == "true" ]] && push_flag="--push"

    # Build arguments for tags
    local tag_args=()
    for t in "${TAGS[@]}"; do
        tag_args+=("--tag" "$t")
    done

    # Retry logic
    local max_retries=3
    local attempt=1

    while [[ $attempt -le $max_retries ]]; do
        log_info "Build attempt $attempt of $max_retries"

        if docker buildx build \
            --builder "$BUILDER_NAME" \
            -f "$DOCKERFILE" \
            --platform "$PLATFORMS" \
            "${tag_args[@]}" \
            --cache-from type=gha \
            --cache-to type=gha,mode=max \
            --provenance mode=max \
            --sbom true \
            $push_flag \
            . ; then
            log_info "Build succeeded on attempt $attempt"
            return 0
        else
            log_warn "Build failed on attempt $attempt"
            attempt=$((attempt + 1))
            if [[ $attempt -le $max_retries ]]; then
                log_info "Waiting 10 seconds before retry..."
                sleep 10
            fi
        fi
    done

    log_error "Build failed after $max_retries attempts"
    exit 1
}

# ---- Sign image with cosign ----
sign_image() {
    if [[ "$PUSH" != "true" ]]; then
        log_info "Skipping signing (--push not set)"
        return 0
    fi

    if ! command -v cosign &>/dev/null; then
        log_warn "cosign not found — skipping image signing"
        return 0
    fi

    if [[ ! -f "$COSIGN_KEY" ]]; then
        log_warn "Cosign key not found at '$COSIGN_KEY' — skipping signing"
        return 0
    fi

    log_step "Signing images with cosign..."

    for t in "${TAGS[@]}"; do
        log_info "Signing: $t"
        COSIGN_PASSWORD="" cosign sign --key "$COSIGN_KEY" "$t"
    done

    log_info "Image signing complete"
}

# ---- Cleanup ----
cleanup() {
    log_step "Cleaning up..."

    if [[ -n "${BUILDER_NAME:-}" ]]; then
        docker buildx rm "$BUILDER_NAME" 2>/dev/null || true
        log_info "Removed builder: $BUILDER_NAME"
    fi

    log_info "Cleanup complete"
}

# ---- Main ----
main() {
    log_info "============================================"
    log_info "  Al Mokhtabar Docker Build"
    log_info "  Service:    ${SERVICE}"
    log_info "  Tag:        ${TAG}"
    log_info "  Registry:   ${REGISTRY}"
    log_info "  Platforms:  ${PLATFORMS}"
    log_info "  Push:       ${PUSH}"
    log_info "============================================"

    check_prerequisites
    setup_buildx
    build_image
    sign_image
    cleanup

    echo ""
    log_info "${BOLD}Build complete!${NC}"
    for t in "${TAGS[@]}"; do
        echo -e "  ${GREEN}✓${NC} $t"
    done
}

trap cleanup EXIT
main
