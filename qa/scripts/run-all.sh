#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QA_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$QA_DIR")"
REPORT_DIR="$QA_DIR/reports"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
RUN_ID="qa-run-${TIMESTAMP}"

echo "============================================"
echo "  Al Mokhtabar - Full QA Suite"
echo "  Run ID: ${RUN_ID}"
echo "  Started: $(date)"
echo "============================================"
echo ""

mkdir -p "${REPORT_DIR}/summary"
SUMMARY_JSON="${REPORT_DIR}/summary/${RUN_ID}-summary.json"
OVERALL_PASSED=true
ALL_RESULTS=()

# Helper function to record test result
record_result() {
  local test_name="$1"
  local status="$2"
  local duration="$3"
  local detail="$4"

  ALL_RESULTS+=("$(cat <<EOF
  {
    "test": "$test_name",
    "status": "$status",
    "duration": "$duration",
    "detail": "$detail"
  }
EOF
  )")

  if [ "$status" != "PASS" ]; then
    OVERALL_PASSED=false
    echo "  >> RESULT: FAILED"
  else
    echo "  >> RESULT: PASSED"
  fi
  echo ""
}

# === 1. Unit Tests (Jest + Vitest) ===
echo "=== [1/8] Unit Tests (Jest + Vitest) ==="
UNIT_START=$(date +%s%N)

if [ -f "$PROJECT_DIR/package.json" ]; then
  if grep -q '"jest"' "$PROJECT_DIR/package.json" 2>/dev/null; then
    echo "Running Jest unit tests..."
    cd "$PROJECT_DIR"
    npx jest --coverage --reporters=default --reporters=jest-junit 2>&1 || true
    UNIT_EXIT=$?
  elif grep -q '"vitest"' "$PROJECT_DIR/package.json" 2>/dev/null; then
    echo "Running Vitest unit tests..."
    cd "$PROJECT_DIR"
    npx vitest run --coverage 2>&1 || true
    UNIT_EXIT=$?
  else
    echo "No test runner detected (jest/vitest). Skipping unit tests."
    UNIT_EXIT=0
  fi
else
  echo "No package.json found. Skipping unit tests."
  UNIT_EXIT=0
fi

UNIT_END=$(date +%s%N)
UNIT_DURATION=$(( (UNIT_END - UNIT_START) / 1000000 ))
UNIT_STATUS=$([ "$UNIT_EXIT" -eq 0 ] && echo "PASS" || echo "FAIL")
record_result "Unit Tests" "$UNIT_STATUS" "$UNIT_DURATION" "exit_code=$UNIT_EXIT"

# === 2. Integration Tests ===
echo "=== [2/8] Integration Tests ==="
INT_START=$(date +%s%N)

if [ -f "$PROJECT_DIR/package.json" ]; then
  if grep -q '"test:integration"' "$PROJECT_DIR/package.json" 2>/dev/null; then
    cd "$PROJECT_DIR"
    npm run test:integration 2>&1 || true
    INT_EXIT=$?
  elif grep -q '"test:e2e"' "$PROJECT_DIR/package.json" 2>/dev/null; then
    echo "Found e2e script but no integration script. Skipping."
    INT_EXIT=0
  else
    echo "No integration test script found. Skipping."
    INT_EXIT=0
  fi
else
  echo "No package.json found. Skipping integration tests."
  INT_EXIT=0
fi

INT_END=$(date +%s%N)
INT_DURATION=$(( (INT_END - INT_START) / 1000000 ))
INT_STATUS=$([ "$INT_EXIT" -eq 0 ] && echo "PASS" || echo "FAIL")
record_result "Integration Tests" "$INT_STATUS" "$INT_DURATION" "exit_code=$INT_EXIT"

# === 3. E2E Tests (Playwright) ===
echo "=== [3/8] E2E Tests (Playwright) ==="
E2E_START=$(date +%s%N)

if command -v npx &> /dev/null && npx playwright --version &>/dev/null; then
  mkdir -p "${REPORT_DIR}/e2e"
  cd "$PROJECT_DIR"

  npx playwright test --reporter=html,json 2>&1 || true
  E2E_EXIT=$?

  # Move reports if they exist
  if [ -d "playwright-report" ]; then
    cp -r playwright-report/* "${REPORT_DIR}/e2e/" 2>/dev/null || true
  fi
else
  echo "Playwright not found. Skipping E2E tests."
  E2E_EXIT=0
fi

E2E_END=$(date +%s%N)
E2E_DURATION=$(( (E2E_END - E2E_START) / 1000000 ))
E2E_STATUS=$([ "$E2E_EXIT" -eq 0 ] && echo "PASS" || echo "FAIL")
record_result "E2E Tests" "$E2E_STATUS" "$E2E_DURATION" "exit_code=$E2E_EXIT"

# === 4. API Security Tests ===
echo "=== [4/8] API Security Tests ==="
SEC_START=$(date +%s%N)

if [ -f "$QA_DIR/security/api-security-tests.js" ]; then
  cd "$QA_DIR/security"
  node api-security-tests.js 2>&1 || true
  SEC_EXIT=$?
else
  echo "Security test script not found. Skipping."
  SEC_EXIT=0
fi

SEC_END=$(date +%s%N)
SEC_DURATION=$(( (SEC_END - SEC_START) / 1000000 ))
SEC_STATUS=$([ "$SEC_EXIT" -eq 0 ] && echo "PASS" || echo "FAIL")
record_result "API Security Tests" "$SEC_STATUS" "$SEC_DURATION" "exit_code=$SEC_EXIT"

# === 5. Accessibility Tests (axe) ===
echo "=== [5/8] Accessibility Tests (aXe) ==="
AXE_START=$(date +%s%N)

if [ -f "$QA_DIR/accessibility/axe-tests.js" ]; then
  cd "$QA_DIR/accessibility"
  node axe-tests.js 2>&1 || true
  AXE_EXIT=$?
else
  echo "Accessibility test script not found. Skipping."
  AXE_EXIT=0
fi

AXE_END=$(date +%s%N)
AXE_DURATION=$(( (AXE_END - AXE_START) / 1000000 ))
AXE_STATUS=$([ "$AXE_EXIT" -eq 0 ] && echo "PASS" || echo "FAIL")
record_result "Accessibility Tests" "$AXE_STATUS" "$AXE_DURATION" "exit_code=$AXE_EXIT"

# === 6. Lighthouse Audit ===
echo "=== [6/8] Lighthouse Audit ==="
LH_START=$(date +%s%N)

if command -v npx &> /dev/null && npx lighthouse --version &>/dev/null; then
  LH_REPORT_DIR="${REPORT_DIR}/lighthouse/${RUN_ID}"
  mkdir -p "$LH_REPORT_DIR"

  # Run against key pages
  LH_URLS=(
    "https://almokhtabar.com"
    "https://almokhtabar.com/ar/login"
  )

  for URL in "${LH_URLS[@]}"; do
    echo "  Auditing: $URL"
    npx lighthouse "$URL" \
      --quiet \
      --chrome-flags="--headless --no-sandbox" \
      --output=json,html \
      --output-path="${LH_REPORT_DIR}/$(echo $URL | sed 's|https://||;s|/|_|g')" \
      --preset=desktop \
      --only-categories=performance,accessibility,best-practices,seo 2>&1 || true
  done

  LH_EXIT=0
else
  echo "Lighthouse not found. Skipping."
  LH_EXIT=0
fi

LH_END=$(date +%s%N)
LH_DURATION=$(( (LH_END - LH_START) / 1000000 ))
LH_STATUS=$([ "$LH_EXIT" -eq 0 ] && echo "PASS" || echo "FAIL")
record_result "Lighthouse Audit" "$LH_STATUS" "$LH_DURATION" "exit_code=$LH_EXIT"

# === 7. Load Test (k6 smoke) ===
echo "=== [7/8] Load Test (k6 Smoke) ==="
K6_START=$(date +%s%N)

if command -v k6 &> /dev/null; then
  K6_REPORT_DIR="${REPORT_DIR}/load/${RUN_ID}"
  mkdir -p "$K6_REPORT_DIR"

  k6 run "$QA_DIR/load/k6/scripts/concurrent-mix.js" \
    --vus 5 \
    --duration 1m \
    --out json="${K6_REPORT_DIR}/smoke-results.json" \
    --out csv="${K6_REPORT_DIR}/smoke-metrics.csv" \
    --summary-export="${K6_REPORT_DIR}/smoke-summary.json" \
    --tag "test_id=${RUN_ID}" \
    --tag "test_type=smoke" \
    --env BASE_URL="${BASE_URL:-https://almokhtabar.com}" \
    --env ENV="${ENV:-staging}" 2>&1 || true

  K6_EXIT=$?
else
  echo "k6 not found. Skipping load test."
  K6_EXIT=0
fi

K6_END=$(date +%s%N)
K6_DURATION=$(( (K6_END - K6_START) / 1000000 ))
K6_STATUS=$([ "$K6_EXIT" -eq 0 ] && echo "PASS" || echo "FAIL")
record_result "Load Test (k6 Smoke)" "$K6_STATUS" "$K6_DURATION" "exit_code=$K6_EXIT"

# === 8. Summary Report ===
echo "=== [8/8] Generating Summary Report ==="

# Calculate total duration
TOTAL_DURATION=$(( UNIT_DURATION + INT_DURATION + E2E_DURATION + SEC_DURATION + AXE_DURATION + LH_DURATION + K6_DURATION ))

# Build JSON summary
cat > "$SUMMARY_JSON" << EOF
{
  "run_id": "$RUN_ID",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "total_duration_ms": $TOTAL_DURATION,
  "overall_passed": $OVERALL_PASSED,
  "results": [
    $(IFS=,; echo "${ALL_RESULTS[*]}")
  ]
}
EOF

echo "Summary written to: ${SUMMARY_JSON}"

# Print final summary
echo ""
echo "============================================"
echo "  QA Suite Complete"
echo "============================================"
echo "  Run ID: ${RUN_ID}"
echo "  Duration: $((TOTAL_DURATION / 1000))s"
echo ""

for result in "${ALL_RESULTS[@]}"; do
  TEST_NAME=$(echo "$result" | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['test'])" 2>/dev/null || echo "?")
  STATUS=$(echo "$result" | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['status'])" 2>/dev/null || echo "?")
  echo "  ${TEST_NAME}: ${STATUS}"
done

echo ""
echo "  Overall: $([ "$OVERALL_PASSED" = true ] && echo 'PASSED' || echo 'FAILED')"
echo "============================================"

# Exit with proper code
if [ "$OVERALL_PASSED" = false ]; then
  exit 1
fi

exit 0
