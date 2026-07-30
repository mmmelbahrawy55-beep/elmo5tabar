#!/bin/bash
set -euo pipefail

# Benchmark Comparison Script
# Compares current benchmark results against baseline
# Fails if regression > 10%

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QA_DIR="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="$QA_DIR/reports"
BASELINE_FILE="${REPORT_DIR}/benchmark-baseline.json"
CURRENT_FILE="${REPORT_DIR}/api-benchmark-results.json"
DB_BASELINE_FILE="${REPORT_DIR}/db-benchmark-baseline.json"
DB_CURRENT_FILE="${REPORT_DIR}/db-benchmark-results.json"

REGRESSION_THRESHOLD=${REGRESSION_THRESHOLD:-10}  # percent
OVERALL_PASSED=true

echo "============================================"
echo "  Benchmark Comparison Tool"
echo "  Threshold: ${REGRESSION_THRESHOLD}%"
echo "  Started: $(date)"
echo "============================================"
echo ""

# === API Benchmarks ===
compare_api_benchmarks() {
  echo "--- API Benchmark Comparison ---"

  if [ ! -f "$BASELINE_FILE" ]; then
    echo "No API baseline found at ${BASELINE_FILE}"
    echo "Run benchmarks first to create baseline."
    return 1
  fi

  if [ ! -f "$CURRENT_FILE" ]; then
    echo "No current API benchmark results at ${CURRENT_FILE}"
    echo "Run 'node qa/performance/benchmarks/api-benchmarks.js' first."
    return 1
  fi

  local REGRESSIONS=0

  # Compare each endpoint
  for ENDPOINT_NAME in $(python3 -c "
import json
current = json.load(open('${CURRENT_FILE}'))
for r in current.get('results', []):
    print(r['name'])
" 2>/dev/null); do

    # Extract p95 from both files
    BASELINE_P95=$(python3 -c "
import json
baseline = json.load(open('${BASELINE_FILE}'))
for r in baseline.get('results', []):
    if r['name'] == '${ENDPOINT_NAME}':
        print(r.get('p95', r.get('duration', 0)))
        break
" 2>/dev/null || echo "0")

    CURRENT_P95=$(python3 -c "
import json
current = json.load(open('${CURRENT_FILE}'))
for r in current.get('results', []):
    if r['name'] == '${ENDPOINT_NAME}':
        print(r.get('p95', r.get('duration', 0)))
        break
" 2>/dev/null || echo "0")

    # Calculate percentage change
    if [ "$(echo "$BASELINE_P95 > 0" | bc -l)" -eq 1 ]; then
      DIFF=$(echo "scale=2; (${CURRENT_P95} - ${BASELINE_P95}) / ${BASELINE_P95} * 100" | bc -l)
      ABS_DIFF=$(echo "scale=2; ${DIFF#-}" | bc -l)

      if [ "$(echo "$ABS_DIFF > $REGRESSION_THRESHOLD" | bc -l)" -eq 1 ] && [ "$(echo "$DIFF > 0" | bc -l)" -eq 1 ]; then
        echo "  REGRESSION: ${ENDPOINT_NAME}"
        echo "    Baseline: ${BASELINE_P95}ms → Current: ${CURRENT_P95}ms (${DIFF}%)"
        REGRESSIONS=$((REGRESSIONS + 1))
      elif [ "$(echo "$ABS_DIFF > $REGRESSION_THRESHOLD" | bc -l)" -eq 1 ]; then
        echo "  IMPROVEMENT: ${ENDPOINT_NAME}"
        echo "    Baseline: ${BASELINE_P95}ms → Current: ${CURRENT_P95}ms (${DIFF}%)"
      else
        echo "  OK: ${ENDPOINT_NAME} (${DIFF}%)"
      fi
    fi
  done

  if [ "$REGRESSIONS" -gt 0 ]; then
    echo ""
    echo "  FAILED: ${REGRESSIONS} API endpoint(s) exceeded ${REGRESSION_THRESHOLD}% regression threshold"
    return 1
  else
    echo ""
    echo "  PASSED: No API regressions detected"
    return 0
  fi
}

# === DB Benchmarks ===
compare_db_benchmarks() {
  echo "--- DB Benchmark Comparison ---"

  if [ ! -f "$DB_BASELINE_FILE" ]; then
    echo "No DB baseline found at ${DB_BASELINE_FILE}"
    return 1
  fi

  if [ ! -f "$DB_CURRENT_FILE" ]; then
    echo "No current DB benchmark results at ${DB_CURRENT_FILE}"
    return 1
  fi

  local REGRESSIONS=0

  # Compare query execution times
  for QUERY_NAME in $(python3 -c "
import json
current = json.load(open('${DB_CURRENT_FILE}'))
for q in current.get('results', {}).get('queries', []):
    if 'name' in q:
        print(q['name'])
" 2>/dev/null); do

    BASELINE_TIME=$(python3 -c "
import json
baseline = json.load(open('${DB_BASELINE_FILE}'))
for q in baseline.get('results', {}).get('queries', []):
    if q.get('name') == '${QUERY_NAME}' and 'planAnalysis' in q and q['planAnalysis']:
        print(q['planAnalysis'].get('actualTotalTime', 0))
        break
" 2>/dev/null || echo "0")

    CURRENT_TIME=$(python3 -c "
import json
current = json.load(open('${DB_CURRENT_FILE}'))
for q in current.get('results', {}).get('queries', []):
    if q.get('name') == '${QUERY_NAME}' and 'planAnalysis' in q and q['planAnalysis']:
        print(q['planAnalysis'].get('actualTotalTime', 0))
        break
" 2>/dev/null || echo "0")

    if [ "$(echo "$BASELINE_TIME > 0" | bc -l)" -eq 1 ]; then
      DIFF=$(echo "scale=2; (${CURRENT_TIME} - ${BASELINE_TIME}) / ${BASELINE_TIME} * 100" | bc -l)
      ABS_DIFF=$(echo "scale=2; ${DIFF#-}" | bc -l)

      if [ "$(echo "$ABS_DIFF > $REGRESSION_THRESHOLD" | bc -l)" -eq 1 ] && [ "$(echo "$DIFF > 0" | bc -l)" -eq 1 ]; then
        echo "  REGRESSION: ${QUERY_NAME}"
        echo "    Baseline: ${BASELINE_TIME}ms → Current: ${CURRENT_TIME}ms (${DIFF}%)"
        REGRESSIONS=$((REGRESSIONS + 1))
      else
        echo "  OK: ${QUERY_NAME} (${DIFF}%)"
      fi
    fi
  done

  # Compare cache hit ratio
  echo ""
  echo "--- Cache Hit Ratio Comparison ---"
  for RATIO_NAME in "index hit rate" "table hit rate"; do
    BASELINE_RATIO=$(python3 -c "
import json
baseline = json.load(open('${DB_BASELINE_FILE}'))
for r in baseline.get('results', {}).get('cacheHit', []):
    if r.get('name') == '${RATIO_NAME}':
        print(float(r.get('ratio', 0)) * 100)
        break
" 2>/dev/null || echo "0")

    CURRENT_RATIO=$(python3 -c "
import json
current = json.load(open('${DB_CURRENT_FILE}'))
for r in current.get('results', {}).get('cacheHit', []):
    if r.get('name') == '${RATIO_NAME}':
        print(float(r.get('ratio', 0)) * 100)
        break
" 2>/dev/null || echo "0")

    if [ "$(echo "$BASELINE_RATIO > 0" | bc -l)" -eq 1 ]; then
      RATIO_DIFF=$(echo "scale=2; ${CURRENT_RATIO} - ${BASELINE_RATIO}" | bc -l)
      if [ "$(echo "$RATIO_DIFF < -5" | bc -l)" -eq 1 ]; then
        echo "  WARNING: ${RATIO_NAME} dropped from ${BASELINE_RATIO}% to ${CURRENT_RATIO}% (${RATIO_DIFF}%)"
      else
        echo "  OK: ${RATIO_NAME}: ${CURRENT_RATIO}% (was ${BASELINE_RATIO}%)"
      fi
    fi
  done

  if [ "$REGRESSIONS" -gt 0 ]; then
    echo ""
    echo "  FAILED: ${REGRESSIONS} DB query(s) exceeded ${REGRESSION_THRESHOLD}% regression threshold"
    return 1
  else
    echo ""
    echo "  PASSED: No DB regressions detected"
    return 0
  fi
}

# === Main ===
API_RESULT=0
DB_RESULT=0

compare_api_benchmarks || API_RESULT=$?
echo ""
compare_db_benchmarks || DB_RESULT=$?
echo ""

echo "============================================"
echo "  Comparison Summary"
echo "============================================"
echo "  API Benchmarks: $([ "$API_RESULT" -eq 0 ] && echo 'PASS' || echo 'FAIL')"
echo "  DB Benchmarks:  $([ "$DB_RESULT" -eq 0 ] && echo 'PASS' || echo 'FAIL')"
echo ""

if [ "$API_RESULT" -ne 0 ] || [ "$DB_RESULT" -ne 0 ]; then
  echo "OVERALL: FAILED - Regressions detected above ${REGRESSION_THRESHOLD}% threshold"
  echo "Investigate and optimize before deploying."
  exit 1
else
  echo "OVERALL: PASSED - All benchmarks within acceptable range"
  exit 0
fi
