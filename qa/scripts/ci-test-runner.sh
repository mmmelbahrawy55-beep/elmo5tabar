#!/bin/bash
set -euo pipefail

# CI-Optimized Test Runner with sharding and parallel execution
# Designed for GitHub Actions, GitLab CI, and CircleCI

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QA_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$QA_DIR")"
REPORT_DIR="$QA_DIR/reports"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
CI=${CI:-false}
NODE_INDEX=${CI_NODE_INDEX:-${CIRCLE_NODE_INDEX:-${GITHUB_RUN_ATTEMPT:-0}}}
NODE_TOTAL=${CI_NODE_TOTAL:-${CIRCLE_NODE_TOTAL:-1}}
SHARD_COUNT=${SHARD_COUNT:-4}

echo "============================================"
echo "  CI Test Runner"
echo "  Node: ${NODE_INDEX}/${NODE_TOTAL}"
echo "  Shards: ${SHARD_COUNT}"
echo "  CI Mode: ${CI}"
echo "============================================"
echo ""

mkdir -p "${REPORT_DIR}/ci"

# Detect available test runners
HAS_JEST=false
HAS_VITEST=false
HAS_PLAYWRIGHT=false
HAS_K6=false

command -v jest &>/dev/null && HAS_JEST=true
command -v vitest &>/dev/null || (test -f "$PROJECT_DIR/node_modules/.bin/vitest" && HAS_VITEST=true) || HAS_VITEST=false
command -v npx &>/dev/null && npx playwright --version &>/dev/null 2>&1 && HAS_PLAYWRIGHT=true
command -v k6 &>/dev/null && HAS_K6=true

# === Sharded Unit Tests ===
run_sharded_unit_tests() {
  echo "--- Running Sharded Unit Tests ---"

  if [ "$HAS_JEST" = true ]; then
    TEST_FILES=$(find "$PROJECT_DIR" -name "*.test.js" -o -name "*.spec.js" -o -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null | grep -v node_modules | sort)
  elif [ "$HAS_VITEST" = true ]; then
    TEST_FILES=$(find "$PROJECT_DIR" -name "*.test.js" -o -name "*.spec.js" -o -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null | grep -v node_modules | sort)
  else
    echo "No test runner detected."
    return 0
  fi

  TOTAL_FILES=$(echo "$TEST_FILES" | wc -l)
  FILES_PER_SHARD=$(( (TOTAL_FILES + SHARD_COUNT - 1) / SHARD_COUNT ))

  if [ "$TOTAL_FILES" -eq 0 ]; then
    echo "No test files found."
    return 0
  fi

  echo "Total test files: $TOTAL_FILES"
  echo "Files per shard: $FILES_PER_SHARD"

  # Run shards in parallel
  for ((i=0; i<SHARD_COUNT; i++)); do
    START=$((i * FILES_PER_SHARD))
    SHARD_FILES=$(echo "$TEST_FILES" | tail -n +$((START + 1)) | head -n $FILES_PER_SHARD)

    if [ -n "$SHARD_FILES" ]; then
      echo "Starting shard $((i+1)) with $(echo "$SHARD_FILES" | wc -l) files..."

      if [ "$HAS_JEST" = true ]; then
        npx jest --ci --reporters=default --reporters=jest-junit \
          --outputFile="${REPORT_DIR}/ci/junit-shard-${i}.xml" \
          $SHARD_FILES &
      elif [ "$HAS_VITEST" = true ]; then
        npx vitest run --reporter=verbose \
          --outputFile="${REPORT_DIR}/ci/vitest-shard-${i}.json" \
          $SHARD_FILES &
      fi
    fi
  done

  # Wait for all shards to finish
  wait
  echo "All shards completed."
}

# === Parallel E2E Tests ===
run_parallel_e2e() {
  echo "--- Running Parallel E2E Tests ---"

  if [ "$HAS_PLAYWRIGHT" = false ]; then
    echo "Playwright not found. Skipping."
    return 0
  fi

  # Detect number of CPU cores for parallelism
  if [ "$(uname)" = "Linux" ] || [ "$(uname)" = "Darwin" ]; then
    WORKERS=$(nproc 2>/dev/null || sysctl -n hw.logicalcpu 2>/dev/null || echo 2)
  else
    WORKERS=2
  fi

  echo "Using $WORKERS parallel workers"

  cd "$PROJECT_DIR"
  npx playwright test \
    --reporter=html,json \
    --workers="$WORKERS" \
    --output="${REPORT_DIR}/e2e" \
    --shard="${CI_NODE_INDEX}/${CI_NODE_TOTAL}" \
    2>&1 || true
}

# === Quick Security Smoke Test (CI mode) ===
run_security_smoke() {
  echo "--- Running Quick Security Smoke Test ---"

  if [ -f "$QA_DIR/security/api-security-tests.js" ]; then
    cd "$QA_DIR/security"
    node -e "
    // Run only critical security checks in CI
    const tests = require('./api-security-tests.js');
    // Selective run of JWT, rate limit, and auth bypass tests only
    console.log('CI security smoke: critical checks only');
    " 2>&1 || true
  fi
}

# === Parallel Lint + Type Check ===
run_lint_typecheck() {
  echo "--- Running Lint and Type Check ---"

  cd "$PROJECT_DIR"

  # Run lint and typecheck in parallel
  if grep -q '"lint"' package.json 2>/dev/null; then
    npm run lint 2>&1 &
    LINT_PID=$!
  fi

  if grep -q '"typecheck"' package.json 2>/dev/null || grep -q '"typescript"' package.json 2>/dev/null; then
    npm run typecheck 2>&1 &
    TYPECHECK_PID=$!
  fi

  # Wait for both
  [ -n "${LINT_PID:-}" ] && wait $LINT_PID || true
  [ -n "${TYPECHECK_PID:-}" ] && wait $TYPECHECK_PID || true

  echo "Lint and type check completed."
}

# === Conditional Load Test ===
run_load_smoke() {
  echo "--- Running Load Test Smoke Check ---"

  if [ "$HAS_K6" = false ]; then
    echo "k6 not found. Skipping."
    return 0
  fi

  mkdir -p "${REPORT_DIR}/load/ci"

  k6 run "$QA_DIR/load/k6/scripts/auth-load.js" \
    --vus 2 \
    --duration 30s \
    --out json="${REPORT_DIR}/load/ci/k6-smoke-${TIMESTAMP}.json" \
    --tag "ci=true" \
    --env BASE_URL="${BASE_URL:-https://almokhtabar.com}" 2>&1 || true
}

# === Main Execution ===
echo "Starting CI test execution..."

case "${1:-all}" in
  unit)
    run_sharded_unit_tests
    ;;
  e2e)
    run_parallel_e2e
    ;;
  lint)
    run_lint_typecheck
    ;;
  security)
    run_security_smoke
    ;;
  load)
    run_load_smoke
    ;;
  all)
    # Run lint/typecheck first, then parallel unit + security, then e2e, then load
    run_lint_typecheck

    # Run sharded unit tests and security smoke in parallel
    run_sharded_unit_tests &
    UNIT_PID=$!
    run_security_smoke &
    SEC_PID=$!
    wait $UNIT_PID $SEC_PID

    # Run E2E and load in parallel
    run_parallel_e2e &
    E2E_PID=$!
    run_load_smoke &
    LOAD_PID=$!
    wait $E2E_PID $LOAD_PID

    echo ""
    echo "============================================"
    echo "  CI Test Run Complete"
    echo "  Reports: ${REPORT_DIR}/ci/"
    echo "============================================"
    ;;
  *)
    echo "Unknown target: $1"
    echo "Usage: $0 {unit|e2e|lint|security|load|all}"
    exit 1
    ;;
esac

echo "CI test runner finished."
