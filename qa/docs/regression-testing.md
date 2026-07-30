# Regression Testing Strategy

## Al Mokhtabar Laboratory Platform

| Metadata | Value |
|---|---|
| **Document Version** | 1.0.0 |
| **Last Updated** | 2026-07-30 |
| **Total Automated Tests** | 15,000+ |
| **Suite Execution SLA** | Smoke: 10 min, Mini: 30 min, Full: 3 hours |

---

## 1. Regression Test Suites

We maintain three tiers of regression testing, designed to provide fast feedback at different stages of the release cycle.

### 1.1 Smoke Suite

**Purpose:** Verify that the most critical user journeys work before and after every deployment.

**Duration:** 10 minutes

**Trigger:** Every deployment (staging and production), every merge to main

**Scope:**

| # | Test Area | Tests | Description |
|---|---|---|---|
| 1 | Authentication | 4 | Login, logout, token refresh, protected route access |
| 2 | Appointment Booking | 2 | Book appointment, view appointments list |
| 3 | Results Viewing | 2 | View latest result, download PDF |
| 4 | Payment | 2 | Load payment page, initiate payment flow |
| 5 | Navigation | 3 | All main nav links work, footer links, language switch |
| 6 | Health Check | 1 | API `/health` endpoint returns 200 |
| **Total** | | **14** | |

**Exit Criteria:** 100% pass rate. Any failure blocks deployment.

**Playwright Configuration:**
```javascript
// playwright.smoke.config.ts
export default defineConfig({
  testDir: './e2e/smoke',
  timeout: 60000,
  workers: 4,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
  },
});
```

### 1.2 Mini Regression

**Purpose:** Verify all API endpoints and key UI interactions to catch regressions in core functionality.

**Duration:** 30 minutes

**Trigger:** Nightly (00:00 AST), every staging deployment

**Scope:**

| Component | Tests | Coverage |
|---|---|---|
| Smoke suite | 14 | All smoke tests |
| All API endpoints | 97 | Every REST + GraphQL endpoint gets positive + negative call |
| Key UI interactions | 50 | Modals, forms, filters, pagination, file uploads |
| All page loads | 44 | Every route renders without JS error |
| Visual regression (critical pages) | 20 | Compare key pages against baseline |
| **Total** | **~225** | |

**Exit Criteria:** >= 98% pass rate. Failures must be triaged within 24 hours.

### 1.3 Full Regression

**Purpose:** Comprehensive validation of the entire application before a production release.

**Duration:** 3 hours (parallelized across 8 workers)

**Trigger:** Pre-release (weekly, or before any production deployment)

**Scope:**
- All automated test cases (15,000+)
- All visual regression comparisons (900+ screenshots)
- All accessibility scans (axe-core on every page)
- All performance assertions (Lighthouse CI)
- Cross-browser variants (Chromium + Firefox + WebKit)
- Mobile emulation variants (iPhone 13 + Pixel 7)

**Exit Criteria:**
- >= 98% overall pass rate
- 0 P0/P1 failures
- Known failures documented with Jira ticket links
- No regression > 5% in pass rate compared to previous run

---

## 2. Smart Test Selection (Impact Analysis)

To optimize regression execution time, we use impact analysis to select the relevant subset of tests for each change.

### 2.1 Change Detection

```
changed_files = git diff --name-only HEAD~1

if changed_files matches "src/backend/modules/auth/**":
  include all auth tests
  include all integration tests for auth-dependent modules

if changed_files matches "src/shared/**" or "src/backend/common/**":
  include full regression (shared code impacts everything)

if changed_files matches "src/frontend/components/**":
  include visual regression for affected components
  include E2E tests for pages using those components

if changed_files matches "package.json" or "yarn.lock":
  include full regression (dependency changes are high risk)
```

### 2.2 Test Selection Matrix

| Change Type | Tests to Run | Rationale |
|---|---|---|
| **Bug fix in module X** | Module X tests + smoke + integration | Verify fix + no regression on core paths |
| **New feature (new module)** | New module tests + smoke + integration + E2E | Feature must work with existing system |
| **UI component change** | Visual regression for component + E2E for affected pages | Visual and functional impact |
| **Database migration** | All integration tests + E2E smoke | Data layer changes affect everything |
| **Dependency update** | Full regression | Highest risk - could break anything |
| **Configuration change** | Smoke + affected module tests | Low risk, targeted verification |
| **Infrastructure change** | Smoke + performance benchmarks | Verify connectivity and performance |

---

## 3. Flaky Test Management

### 3.1 Detection

A test is considered **flaky** if it fails on at least 1 out of 3 consecutive CI runs without any code changes that could have affected it.

### 3.2 Auto-Retry Policy

| Suite | Max Retries | Condition |
|---|---|---|
| Smoke | 0 | No retries - must be 100% reliable |
| Mini Regression | 3 | Retry on failure, fail if all 3 fail |
| Full Regression | 3 | Retry on failure, fail if all 3 fail |
| Visual Regression | 1 | Retry on diff (animation variance) |
| Load Tests | 0 | No retries - must be stable |

### 3.3 Quarantine Process

1. **Detection:** CI pipeline marks test as "suspected flaky" after 2 failures in 5 runs
2. **Auto-Quarantine:** After 5 failures in any 10-run window, test is automatically moved to `e2e/quarantine/` directory
3. **Alert:** Slack notification sent to QA team with list of quarantined tests
4. **Investigation:** QA engineer investigates root cause within 24 hours
5. **Resolution:** Either fix the test (return to active), improve the test, or delete if no longer relevant
6. **Review:** Weekly triage meeting reviews all quarantined tests

### 3.4 Flaky Test Metrics

| Metric | Target | Alert Threshold |
|---|---|---|
| Flaky test count | < 10 | > 20 |
| Flaky test rate | < 2% of total suite | > 5% |
| Time to resolve flaky | < 1 week | > 2 weeks |
| Quarantined tests | < 5 | > 10 |

---

## 4. Baseline Comparison

### 4.1 What We Compare

Every regression run is compared against the previous run on the same branch/main:

| Metric | Comparison | Action on Regression |
|---|---|---|
| **Pass rate** | Percentage decrease > 2% | Investigate all new failures |
| **Execution time** | Per-test increase > 20% | Flag for performance review |
| **Visual diff** | New unexpected diffs | Block merge if UI-related |
| **Console errors** | New JS errors | Investigate and fix |
| **API response time** | p95 increase > 10% | Performance review needed |

### 4.2 Reporting

```yaml
# qa/reports/regression-summary.yml template
run_id: reg-2026-07-30-001
branch: release/v1.3.0
commit: a1b2c3d4e5f6
started_at: 2026-07-30T00:00:00Z
completed_at: 2026-07-30T03:00:00Z

summary:
  total: 15234
  passed: 15189
  failed: 32
  skipped: 13
  pass_rate: 99.71%
  execution_time: 2h 47m

regressions:
  - test: TC-PAY-001
    previous_pass_rate: 100%
    current_pass_rate: 67%
    status: INVESTIGATING

new_failures:
  - test: TC-APT-004
    failure: "Reschedule button not found"
    assigned: "QA-ENG-1"

flaky_tests:
  - test: TC-ANIM-004
    failures_last_10_runs: 3
    status: QUARANTINED

performance:
  api_p95_ms: 342
  previous_api_p95_ms: 318
  change: "+7.5%"
  status: WITHIN_THRESHOLD
```

---

## 5. Regression Test Maintenance

### 5.1 Review Cadence

| Activity | Frequency | Owner |
|---|---|---|
| Flaky test review | Weekly | QA Engineer |
| Test suite optimization | Monthly | QA Engineer |
| Obsolete test cleanup | Monthly | QA Engineer + Dev |
| New feature test coverage | Per sprint | QA + Dev |
| Test data refresh | Weekly | DevOps |
| Visual baseline update | Per intentional UI change | Dev + QA |

### 5.2 Test Data Strategy for Regression

| Data Type | Source | Freshness |
|---|---|---|
| User accounts | Seed script | Every run (ephemeral) |
| Patient records | Factory + Faker | Every run |
| Appointment data | Seed script | Every run |
| Test results | Seed script + Factory | Every run |
| Payment records | Stripe test mode + Factory | Every run |
| Notification logs | Factory | Every run |

### 5.3 Exclusions from Regression

The following are explicitly excluded from automated regression:

- **Third-party service availability** (Stripe, WhatsApp, etc.) - covered by synthetic monitoring
- **Browser-specific rendering quirks** (covers by cross-browser tests in pre-release only)
- **Performance under load** (covered by dedicated load tests)
- **Security penetration** (covered by dedicated security tests)
- **Manual accessibility audit** (covered by quarterly accessibility audit)

---

## 6. Regression Run Types Summary

| Feature | Smoke | Mini | Full |
|---|---|---|---|
| **Duration** | 10 min | 30 min | 3 hours |
| **Frequency** | Every deploy | Nightly | Pre-release |
| **Tests** | 14 critical paths | ~225 (smoke + APIs + key UI) | 15,000+ (full suite) |
| **Workers** | 4 | 8 | 8 |
| **Retries** | 0 | 3 | 3 |
| **Pass Rate Target** | 100% | >= 98% | >= 98% |
| **Failure Action** | Block deploy | Investigate within 24h | Investigate before release |
| **Browsers** | Chromium only | Chromium + Firefox | Chromium + Firefox + WebKit |
| **Mobile** | No | No | Yes (iPhone 13, Pixel 7) |
| **Visual Regression** | No | Critical pages | All pages |
| **Accessibility** | No | No | Yes (axe-core) |
| **Performance** | No | No | Yes (Lighthouse CI) |
