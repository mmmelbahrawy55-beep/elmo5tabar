#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K6_DIR="$(dirname "$SCRIPT_DIR")/k6"
REPORT_DIR="$(dirname "$SCRIPT_DIR")/../reports/load"

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
REPORT_NAME="stress-test-${TIMESTAMP}"

echo "============================================"
echo "  Al Mokhtabar - Stress Test"
echo "  Finding Breaking Point"
echo "  Started: $(date)"
echo "============================================"
echo ""

if ! command -v k6 &> /dev/null; then
    echo "ERROR: k6 is not installed"
    exit 1
fi

mkdir -p "$REPORT_DIR"

STAGES_FILE=$(mktemp)
cat > "$STAGES_FILE" << 'STAGEOF'
[
  { "duration": "3m", "target": 100 },
  { "duration": "3m", "target": 200 },
  { "duration": "3m", "target": 500 },
  { "duration": "3m", "target": 750 },
  { "duration": "3m", "target": 1000 },
  { "duration": "3m", "target": 1500 },
  { "duration": "3m", "target": 2000 },
  { "duration": "3m", "target": 3000 },
  { "duration": "3m", "target": 5000 },
  { "duration": "5m", "target": 0 }
]
STAGEOF

echo "Gradually ramping up to find system breaking point..."
echo "Stages: 100 -> 200 -> 500 -> 750 -> 1K -> 1.5K -> 2K -> 3K -> 5K"
echo ""

k6 run "$K6_DIR/scripts/concurrent-mix.js" \
    --stage "$(cat "$STAGES_FILE" | tr -d '\n ')" \
    --out json="${REPORT_DIR}/${REPORT_NAME}.json" \
    --out csv="${REPORT_DIR}/${REPORT_NAME}-metrics.csv" \
    --summary-export="${REPORT_DIR}/${REPORT_NAME}-summary.json" \
    --tag "test_id=${REPORT_NAME}" \
    --tag "test_type=stress" \
    --env BASE_URL="${BASE_URL:-https://almokhtabar.com}" \
    --env ENV="${ENV:-staging}" \
    2>&1 | tee "${REPORT_DIR}/${REPORT_NAME}-output.log"

rm -f "$STAGES_FILE"

echo ""
echo "============================================"
echo "  Stress Test Results"
echo "============================================"

# Parse results to find breaking point
if [ -f "${REPORT_DIR}/${REPORT_NAME}-summary.json" ]; then
    P95=$(jq -r '.metrics.http_req_duration["p(95)"] // "0"' "${REPORT_DIR}/${REPORT_NAME}-summary.json")
    ERROR_RATE=$(jq -r '.metrics.http_req_failed.rate // "0"' "${REPORT_DIR}/${REPORT_NAME}-summary.json")
    MAX_VUS=$(jq -r '.metrics.vus_max.value // "0"' "${REPORT_DIR}/${REPORT_NAME}-summary.json")

    echo "Peak Concurrent VUs: $MAX_VUS"
    echo "P95 Response Time:   ${P95}ms"
    echo "Error Rate:          ${ERROR_RATE}"

    # Determine breaking point
    if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )) || (( $(echo "$P95 > 5000" | bc -l) )); then
        echo ""
        echo "BREAKING POINT DETECTED at approximately ${MAX_VUS} concurrent users"
        echo "Recommendation: Set production scaling target below ${MAX_VUS}"
    else
        echo ""
        echo "No breaking point reached at ${MAX_VUS} VUs. Consider increasing target."
    fi
fi

echo ""
echo "Report saved to: ${REPORT_DIR}/${REPORT_NAME}*"
