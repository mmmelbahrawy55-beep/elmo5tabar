#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K6_DIR="$(dirname "$SCRIPT_DIR")/k6"
REPORT_DIR="$(dirname "$SCRIPT_DIR")/../reports/load"

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
REPORT_NAME="soak-test-${TIMESTAMP}"

echo "============================================"
echo "  Al Mokhtabar - 2-Hour Soak Test"
echo "  Started: $(date)"
echo "============================================"
echo ""

if ! command -v k6 &> /dev/null; then
    echo "ERROR: k6 is not installed. See https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Check if tests/auth-load.js exists
if [ ! -f "$K6_DIR/scripts/auth-load.js" ]; then
    echo "WARNING: auth-load.js not found. Ensure scripts are present."
fi

mkdir -p "$REPORT_DIR"

echo "Running 2-hour soak test with 200 concurrent VUs..."
echo ""

k6 run "$K6_DIR/scripts/concurrent-mix.js" \
    --vus 200 \
    --duration 2h \
    --out json="${REPORT_DIR}/${REPORT_NAME}.json" \
    --out csv="${REPORT_DIR}/${REPORT_NAME}-metrics.csv" \
    --summary-export="${REPORT_DIR}/${REPORT_NAME}-summary.json" \
    --tag "test_id=${REPORT_NAME}" \
    --tag "test_type=soak" \
    --env BASE_URL="${BASE_URL:-https://almokhtabar.com}" \
    --env AUTH_TOKEN="${AUTH_TOKEN:-}" \
    --env ENV="${ENV:-staging}"

echo ""
echo "Soak test complete at $(date)"

# Generate HTML report
if command -v k6 &> /dev/null && k6 version | grep -q "v0.4"; then
    echo "Generating HTML report..."
    k6 report --out "${REPORT_DIR}/${REPORT_NAME}-report.html" "${REPORT_DIR}/${REPORT_NAME}.json" 2>/dev/null || true
fi

# Print summary
echo ""
echo "============================================"
echo "  Soak Test Summary"
echo "============================================"
if [ -f "${REPORT_DIR}/${REPORT_NAME}-summary.json" ]; then
    echo "HTTP Requests: $(jq -r '.metrics.http_reqs.count // "N/A"' "${REPORT_DIR}/${REPORT_NAME}-summary.json")"
    echo "P95 Latency:  $(jq -r '.metrics.http_req_duration["p(95)"] // "N/A"' "${REPORT_DIR}/${REPORT_NAME}-summary.json")"
    echo "Error Rate:   $(jq -r '.metrics.http_req_failed.rate // "N/A"' "${REPORT_DIR}/${REPORT_NAME}-summary.json")"
fi
echo ""
echo "Reports saved to: ${REPORT_DIR}/${REPORT_NAME}*"
