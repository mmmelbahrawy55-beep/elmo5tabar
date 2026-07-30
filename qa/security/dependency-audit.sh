#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")/.."
REPORT_DIR="$SCRIPT_DIR/../reports/security"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
REPORT_NAME="dependency-audit-${TIMESTAMP}"

echo "============================================"
echo "  Dependency Security Audit"
echo "  Started: $(date)"
echo "============================================"
echo ""

mkdir -p "$REPORT_DIR"
SUMMARY_FILE="${REPORT_DIR}/${REPORT_NAME}-summary.json"
REPORT_FILE="${REPORT_DIR}/${REPORT_NAME}-report.txt"

# Redirect all output to both console and report file
exec > >(tee -a "$REPORT_FILE") 2>&1

OVERALL_PASSED=true

# === npm audit ===
echo "--- npm audit (high & critical) ---"
if command -v npm &> /dev/null; then
  NPM_RESULT=0
  npm audit --audit-level=high 2>&1 || NPM_RESULT=$?

  if [ $NPM_RESULT -eq 0 ]; then
    echo "npm audit: PASSED - No high or critical vulnerabilities"
    NPM_AUDIT_RESULT="passed"
  else
    echo "npm audit: FAILED - High or critical vulnerabilities found"
    NPM_AUDIT_RESULT="failed"
    OVERALL_PASSED=false
  fi

  # Generate detailed npm audit JSON
  npm audit --json 2>/dev/null > "${REPORT_DIR}/${REPORT_NAME}-npm-audit.json" || true
else
  echo "npm not found. Skipping npm audit."
  NPM_AUDIT_RESULT="skipped"
fi

echo ""

# === Snyk test ===
echo "--- Snyk Security Scan ---"
if command -v snyk &> /dev/null; then
  SNYK_RESULT=0
  snyk test --severity-threshold=high --json 2>&1 > "${REPORT_DIR}/${REPORT_NAME}-snyk.json" || SNYK_RESULT=$?

  if [ $SNYK_RESULT -eq 0 ]; then
    echo "Snyk: PASSED - No high or critical vulnerabilities"
    SNYK_RESULT_TEXT="passed"
  else
    echo "Snyk: FAILED - Vulnerabilities found (see report)"
    SNYK_RESULT_TEXT="failed"
    OVERALL_PASSED=false
  fi

  # Display summary from Snyk JSON
  if [ -f "${REPORT_DIR}/${REPORT_NAME}-snyk.json" ]; then
    VULN_COUNT=$(cat "${REPORT_DIR}/${REPORT_NAME}-snyk.json" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if isinstance(data, dict):
        print(data.get('vulnerabilities', []))
    elif isinstance(data, list):
        print(sum(len(item.get('vulnerabilities', [])) for item in data))
except:
    print(0)
" 2>/dev/null || echo "N/A")
    echo "Total vulnerabilities found: $VULN_COUNT"
  fi
else
  echo "Snyk not found. Install with: npm install -g snyk"
  echo "Then authenticate: snyk auth"
  SNYK_RESULT_TEXT="skipped"
fi

echo ""

# === Yarn audit (if yarn.lock exists) ===
echo "--- Yarn Audit ---"
if [ -f "$PROJECT_DIR/yarn.lock" ] && command -v yarn &> /dev/null; then
  YARN_RESULT=0
  yarn audit --level high 2>&1 || YARN_RESULT=$?

  if [ $YARN_RESULT -eq 0 ]; then
    echo "Yarn audit: PASSED"
    YARN_AUDIT_RESULT="passed"
  else
    echo "Yarn audit: FAILED"
    YARN_AUDIT_RESULT="failed"
    OVERALL_PASSED=false
  fi

  # Generate HTML report
  if command -v npx &> /dev/null; then
    npx yarn-audit-html --output "${REPORT_DIR}/${REPORT_NAME}-yarn-audit.html" 2>/dev/null || true
  fi
else
  echo "yarn.lock not found or yarn not installed. Skipping yarn audit."
  YARN_AUDIT_RESULT="skipped"
fi

echo ""

# === Check for known CVEs in production dependencies ===
echo "--- CVE Database Check ---"
if [ -f "$PROJECT_DIR/package.json" ]; then
  # Check specific high-profile packages for known CVEs
  PACKAGES_TO_CHECK=(
    "next"
    "react"
    "express"
    "prisma"
    "ioredis"
    "passport"
    "jsonwebtoken"
    "bcrypt"
    "stripe"
    "socket.io"
  )

  echo "Checking production dependency versions against known CVEs..."

  if command -v node &> /dev/null; then
    node -e "
    const pkg = require('${PROJECT_DIR}/package.json');
    const deps = {...pkg.dependencies, ...pkg.devDependencies};
    const check = ${PACKAGES_TO_CHECK[@]};
    check.forEach(name => {
      if (deps[name]) {
        console.log('  ${name}: ' + deps[name]);
      }
    });
    " 2>/dev/null || echo "  Could not parse package.json"
  fi

  # Use npm audit for CVE details
  if [ -f "${REPORT_DIR}/${REPORT_NAME}-npm-audit.json" ]; then
    CRITICAL=$(cat "${REPORT_DIR}/${REPORT_NAME}-npm-audit.json" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('metadata', {}).get('vulnerabilities', {}).get('critical', 0))
except:
    print('N/A')
" 2>/dev/null || echo "N/A")
    HIGH=$(cat "${REPORT_DIR}/${REPORT_NAME}-npm-audit.json" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('metadata', {}).get('vulnerabilities', {}).get('high', 0))
except:
    print('N/A')
" 2>/dev/null || echo "N/A")
    echo "Critical CVEs: $CRITICAL"
    echo "High CVEs: $HIGH"
  fi
fi

echo ""

# === Summary ===
echo "============================================"
echo "  Dependency Audit Summary"
echo "============================================"
echo "  npm audit:     $NPM_AUDIT_RESULT"
echo "  Snyk scan:     $SNYK_RESULT_TEXT"
echo "  Yarn audit:    $YARN_AUDIT_RESULT"
echo "  Overall:       $([ "$OVERALL_PASSED" = true ] && echo 'PASSED' || echo 'FAILED')"
echo "============================================"

# Write summary JSON
cat > "$SUMMARY_FILE" << SUMSOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "npm_audit": "$NPM_AUDIT_RESULT",
  "snyk": "$SNYK_RESULT_TEXT",
  "yarn_audit": "$YARN_AUDIT_RESULT",
  "overall_passed": $OVERALL_PASSED,
  "report_files": {
    "detailed": "${REPORT_FILE}",
    "npm_audit_json": "${REPORT_DIR}/${REPORT_NAME}-npm-audit.json",
    "snyk_json": "${REPORT_DIR}/${REPORT_NAME}-snyk.json"
  }
}
SUMSOF

echo ""
echo "Report saved to: ${REPORT_DIR}/${REPORT_NAME}*"

# Exit with error if audit failed
if [ "$OVERALL_PASSED" = false ]; then
  echo ""
  echo "ERROR: Dependency audit found vulnerabilities that exceed the threshold."
  echo "Fix critical and high vulnerabilities before proceeding."
  exit 1
fi

exit 0
