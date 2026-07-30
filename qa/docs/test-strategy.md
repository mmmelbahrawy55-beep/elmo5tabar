# QA Test Strategy Document

## Al Mokhtabar Laboratory Platform

| Metadata | Value |
|---|---|
| **Document Version** | 1.0.0 |
| **Last Updated** | 2026-07-30 |
| **Classification** | Internal - Confidential |
| **Owner** | QA Engineering |
| **Approved By** | VP of Engineering |

---

## 1. Test Strategy Overview

### 1.1 Scope

This test strategy covers the entire Al Mokhtabar Laboratory Platform ecosystem:

| Scope Area | Coverage |
|---|---|
| **Backend Modules (18)** | Auth, Appointments, Results, Payments, Patients, Branches, Laboratories, Tests, Packages, Insurances, Reports, Notifications, Audit, Admin, Integrations, Analytics, Support, Content |
| **Animation Components (44)** | Hero entrances (6), Parallax sections (4), Glass cards (5), Charts/visualizations (7), Cursor effects (3), Loading states (8), Page transitions (5), Micro-interactions (6) |
| **Web Pages** | All routes in Arabic and English, including public, patient, and admin surfaces |
| **APIs** | REST (97 endpoints), GraphQL (22 queries/mutations), WebSocket (4 channels) |
| **Integrations** | Stripe, Tap, HyperPay, PayPal, WhatsApp Business, Twilio, SendGrid, Google, Apple, NPHIES, CCHI, ZATCA |
| **Mobile** | iOS Safari, Android Chrome, React Native wrapper, Flutter webview |

### 1.2 Quality Goals

| Metric | Target | Measurement Method |
|---|---|---|
| **Lighthouse Performance** | 100/100 all categories | Lighthouse CI |
| **Code Coverage (Statements)** | 80%+ overall, 75% per module | Jest/Vitest coverage reports |
| **Code Coverage (Branches)** | 75%+ overall, 70% per module | Jest/Vitest coverage reports |
| **Production P0/P1 Bugs** | Zero (target) | Bug tracker + monitoring |
| **API Latency (p95)** | < 500ms | k6 + Datadog APM |
| **API Latency (p99)** | < 1000ms | k6 + Datadog APM |
| **Page Load (LCP)** | < 2.5s | Lighthouse RUM |
| **Uptime** | 99.95% monthly | Statuspage + Datadog |
| **Security Score** | A+ (SSL Labs) | SSL Labs test |
| **Accessibility** | WCAG 2.1 AA | axe-core + manual audit |
| **Flaky Test Rate** | < 2% of total suite | CI analytics |

### 1.3 Risk Assessment Matrix

Risk scoring: **Likelihood** (1=Rare, 5=Almost Certain) × **Impact** (1=Negligible, 5=Catastrophic)

| Module | Risk | Likelihood | Impact | Risk Score | Mitigation |
|---|---|---|---|---|---|
| **Auth** | Credential stuffing / brute force | 4 | 5 | **20** | Rate limiting, MFA, account lockout, WAF |
| **Auth** | JWT token compromise | 2 | 5 | **10** | Short TTL, rotation, family detection |
| **Payments** | Payment processor failure | 3 | 5 | **15** | Multi-provider fallback, retry queue |
| **Payments** | Double charge / data loss | 2 | 5 | **10** | Idempotency keys, reconciliation |
| **Results** | PHI data leak (IDOR) | 3 | 5 | **15** | Authorization checks, audit log |
| **Results** | Incorrect result display | 2 | 5 | **10** | Data integrity validation, tests |
| **Appointments** | Double booking race condition | 3 | 4 | **12** | Optimistic locking, queue system |
| **Appointments** | Slot availability mismatch | 3 | 3 | **9** | Real-time sync, cache invalidation |
| **Notifications** | Missed critical notification | 3 | 4 | **12** | Delivery tracking, fallback channel |
| **Notifications** | PHI in notification content | 2 | 5 | **10** | Content stripping, audit |
| **Database** | Migration failure | 2 | 4 | **8** | Forward/backward compatible, dry run |
| **Infrastructure** | Multi-region failover | 2 | 4 | **8** | DR tested, automated failover |
| **Compliance** | Regulatory audit finding | 3 | 4 | **12** | Compliance automation, evidence collection |
| **Animation** | Performance regression | 3 | 2 | **6** | Bundle analysis, performance budgets |
| **CI/CD** | Pipeline failure blocking release | 3 | 3 | **9** | Pipeline redundancy, retry logic |

---

## 2. Test Levels

### 2.1 Unit Tests

| Aspect | Detail |
|---|---|
| **Framework** | Jest (backend Node.js), Vitest (frontend Vue/React) |
| **Coverage Target** | 85% statements, 80% branches |
| **Run Frequency** | Every commit and PR |
| **Execution Time SLA** | < 10 minutes for full suite |
| **File Pattern** | `*.spec.ts`, `*.test.ts`, `*.test.tsx` |
| **What We Test** | Services, utilities, helpers, composables, stores, API handlers, validators |
| **What We Skip** | Generated files, type definitions, configuration, third-party adapters (mocked) |
| **Mocking Strategy** | Manual mocks for DB, Redis, external APIs; faker.js for test data |

**Key Practices:**
- One assertion pattern per test where possible
- Descriptive test names following Given/When/Then convention
- No network calls in unit tests
- Mock external services at boundary
- Factory functions for consistent test data

### 2.2 Integration Tests

| Aspect | Detail |
|---|---|
| **Framework** | Supertest (HTTP), Testcontainers (DB/Redis) |
| **Coverage Target** | 75% module interaction paths |
| **Run Frequency** | Every PR and nightly |
| **Execution Time SLA** | < 20 minutes |
| **What We Test** | API → Service → Repository → DB flow, Cache integration, Message queue integration, Webhook delivery |
| **Infrastructure** | Ephemeral PostgreSQL + Redis via Testcontainers |

**Integration Test Suites:**
1. **API Contract Tests** - Validate request/response schemas, status codes, headers
2. **Database Integration** - Query correctness, transaction behavior, migration forward/backward
3. **Cache Integration** - Redis set/get, TTL, invalidation patterns, connection recovery
4. **Message Queue** - Job publish/consume, retry logic, dead letter handling
5. **External Service Adapters** - Stripe, Tap, WhatsApp, Twilio (sandbox modes)

### 2.3 E2E Tests

| Aspect | Detail |
|---|---|
| **Framework** | Playwright (v1.45+) |
| **Browsers** | Chromium, Firefox, WebKit |
| **Mobile Emulation** | iPhone 13, Pixel 7, Samsung Galaxy S23 |
| **Run Frequency** | Nightly full suite, smoke suite every deploy |
| **Execution Time SLA** | Smoke: 10 min, Full: 90 min |
| **Reporting** | Playwright HTML report, trace viewer, video recordings |

**Test Organization:**
```
e2e/
  specs/
    auth/
    appointments/
    results/
    payments/
    navigation/
    responsive/
  fixtures/
    users.json
    patients.json
  helpers/
    api.ts
    db.ts
    auth.ts
  global-setup.ts
  global-teardown.ts
```

**Key Scenarios:**
- Complete user journey: Register → Book appointment → Visit lab → View results → Pay → Download report
- Admin workflows: Manage branches, manage tests, view analytics, handle support tickets
- Error states: Network failure, empty states, validation errors, 404 pages
- Cross-cutting: RTL layout, keyboard navigation, screen reader compatibility

### 2.4 API Tests

| Aspect | Detail |
|---|---|
| **Framework** | Playwright API testing + Supertest |
| **Validation** | OpenAPI/Swagger contract enforcement (Spectral) |
| **Run Frequency** | Every PR |
| **What We Test** | 97 REST endpoints, 22 GraphQL operations, 4 WebSocket channels |

**API Test Categories:**
1. **Positive Tests** - Happy path with valid payloads
2. **Negative Tests** - Invalid payloads, missing fields, wrong types
3. **Edge Cases** - Boundary values, empty arrays, maximum payload sizes
4. **Auth Tests** - No auth, expired token, wrong role, revoked token
5. **Rate Limit Tests** - Burst behavior, sliding window, per-endpoint limits
6. **Contract Tests** - Response schema matches OpenAPI spec
7. **Performance Assertions** - Response time within SLO

### 2.5 Visual Regression Tests

| Aspect | Detail |
|---|---|
| **Framework** | Playwright Visual Comparisons + Percy |
| **Baseline** | Stored in `qa/visual-baselines/` per component/page |
| **Threshold** | 0.1% pixel diff tolerance for animations, 0% for static |
| **Run Frequency** | Every PR (affected pages), nightly (full suite) |

**What We Capture:**
- Every page in both AR and EN locales
- Every UI component in default, hover, focus, active, disabled states
- Mobile, tablet, and desktop viewport widths
- Print layout (PDF preview)
- Loading, empty, error, and edge case states

---

## 3. Test Types

### 3.1 Functional Testing

Every user story in the product backlog maps to at least one automated test case. The mapping is maintained in the Test Case Management System (Qase/Zephyr) and linked to Jira issues.

| Epic | Test Cases | Automation % |
|---|---|---|
| Patient Registration & Login | 52 | 100% |
| Appointment Booking | 48 | 100% |
| Test Results Viewing | 35 | 100% |
| Payment Processing | 64 | 98% |
| Notification Delivery | 28 | 95% |
| Admin Dashboard | 42 | 90% |
| Branch Management | 22 | 100% |
| Insurance Processing | 18 | 85% |

### 3.2 Regression Testing

See [regression-testing.md](./regression-testing.md) for complete strategy.

### 3.3 Smoke Testing

**Critical User Journeys (CUJs):**

| Journey | Steps | Max Time |
|---|---|---|
| **User Login** | Navigate → Enter credentials → Submit → Dashboard loads | 10s |
| **Book Appointment** | Select branch → Select service → Pick slot → Confirm → SMS received | 30s |
| **View Results** | Login → Navigate to results → View PDF → Download | 15s |
| **Make Payment** | Select invoice → Choose payment method → Complete → Receipt shown | 20s |
| **Admin: Manage Tests** | Login as admin → CRUD test → Verify listing | 25s |

**Execution:** Automated via Playwright, runs on every production deployment. Any smoke test failure blocks the deployment and triggers automatic rollback.

### 3.4 Performance Testing

| Type | Tool | Frequency | Thresholds |
|---|---|---|---|
| **Lighthouse** | Lighthouse CI | Every PR + staging | 95+ all categories |
| **Load Test** | k6 | Nightly + pre-release | p95 < 500ms, error < 1% |
| **Stress Test** | k6 | Pre-release | Identify breaking point |
| **Soak Test** | k6 | Pre-release (quarterly) | 12h sustained, no degradation |
| **Spike Test** | k6 | Pre-release | 10x traffic in 30s, recovery < 2min |
| **API Benchmark** | autocannon | Every deploy | Compare to baseline |

**k6 Test Scenarios:**

```javascript
// Auth - Login flow
export const authOptions = {
  stages: [
    { duration: '2m', target: 100 },  // ramp up
    { duration: '5m', target: 1000 },  // sustain
    { duration: '1m', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};
```

### 3.5 Security Testing

| Type | Tool | Frequency | Description |
|---|---|---|---|
| **SAST (Static Analysis)** | SonarQube, ESLint security plugins | Every PR | Code pattern analysis |
| **DAST (Dynamic Analysis)** | OWASP ZAP | Nightly + pre-release | Active scan against staging |
| **Dependency Audit** | npm audit, Snyk | Every PR | Known CVE check |
| **Secret Scanning** | GitLeaks, TruffleHog | Every commit | Prevent credential leaks |
| **Penetration Testing** | Third-party | Quarterly + major release | Manual pentest |
| **API Fuzzing** | Custom fuzzer | Pre-release | Malformed payload testing |

**Security Test Checklist:**
- [ ] SQL Injection (all input fields)
- [ ] XSS (reflected, stored, DOM-based)
- [ ] CSRF (all state-changing endpoints)
- [ ] IDOR (all resource access patterns)
- [ ] Mass Assignment (all POST/PUT endpoints)
- [ ] JWT (alg none, weak secret, expiration)
- [ ] Rate Limiting (auth, OTP, payment endpoints)
- [ ] CORS (origin validation)
- [ ] SSL/TLS (TLS 1.3 only, strong ciphers)
- [ ] Security Headers (HSTS, CSP, X-Frame-Options, etc.)

### 3.6 Accessibility Testing

| Standard | Tool | Target | Frequency |
|---|---|---|---|
| **WCAG 2.1 AA** | axe-core (Playwright integration) | 0 critical, 0 serious | Every PR + nightly |
| **Screen Reader** | NVDA (Windows), VoiceOver (macOS) | All pages navigable | Pre-release |
| **Keyboard Navigation** | Playwright keyboard tests | All interactive elements | Every PR |
| **Color Contrast** | axe-core | 4.5:1 (normal), 3:1 (large) | Every PR |
| **Focus Indicators** | Visual regression | Visible focus rings | Pre-release |

**Accessibility Test Scope:**
- All public pages (login, registration, landing, about, contact)
- All patient pages (dashboard, appointments, results, profile)
- All admin pages (users, branches, tests, settings)
- All modals, dialogs, tooltips, and popovers
- All forms with validation messages
- Navigation (header, sidebar, footer, breadcrumbs)
- Payment checkout flow

### 3.7 Localization Testing

| Aspect | Requirement | Test Method |
|---|---|---|
| **Arabic (ar-SA)** | Full RTL layout, correct glyphs | Visual regression + manual |
| **English (en-US)** | Standard LTR layout | Automated |
| **Date Formats** | ar: `هـ 1446/01/15`, en: `2026-01-15` | Unit tests |
| **Number Formats** | ar: `١٬٢٣٤٫٥٦`, en: `1,234.56` | Unit tests |
| **Currency** | SAR (ر.س), USD ($) | Unit tests |
| **Phone Numbers** | +966 XX XXX XXXX | Format validation |
| **National ID/Iqama** | 10-digit format validation | Format validation |
| **Translation Completeness** | 100% of keys translated | i18n audit script |

### 3.8 Mobile Testing

| Platform | Browser/Webview | Test Method |
|---|---|---|
| **iOS** | Safari 17+ | Playwright emulation + BrowserStack real devices |
| **Android** | Chrome 125+ | Playwright emulation + BrowserStack real devices |
| **React Native** | WKWebView (iOS), WebView (Android) | Manual testing on physical devices |
| **Flutter** | Flutter WebView | Manual testing on physical devices |

**Mobile-Specific Tests:**
- Touch interactions (tap, swipe, pinch, long press)
- Viewport adaptation (320px through 430px widths)
- Safe area insets (notch, home indicator)
- Keyboard behavior (avoid overlap, dismiss on submit)
- Orientation change (portrait ↔ landscape)
- App-like behavior when saved to home screen
- PWA manifest verification

### 3.9 Chaos Testing

| Experiment | Scenario | Frequency |
|---|---|---|
| **Service Failure** | Kill each microservice individually | Monthly |
| **Latency Injection** | 500ms, 1000ms, 3000ms delays | Quarterly |
| **Resource Exhaustion** | CPU throttle, memory limit, disk full | Quarterly |
| **Network Partition** | Drop 25%, 50%, 75% of packets | Quarterly |
| **DNS Failure** | Block external DNS resolution | Quarterly |
| **Certificate Expiry** | Test behavior with expired SSL | Monthly |

**Chaos Engineering Principles:**
- Run in staging environment only
- Define steady-state metrics before experiment
- Automatic rollback if metrics violate SLOs
- Post-experiment report with findings
- Game days every quarter with cross-team participation

---

## 4. Test Environment Strategy

### 4.1 Environment Overview

| Environment | Purpose | Infrastructure | Data |
|---|---|---|---|
| **Local (Dev)** | Developer testing | Docker Compose | Seeded test data |
| **Feature Preview** | PR validation | Ephemeral K8s namespace | Fresh seed per deploy |
| **Staging** | Pre-release validation | Persistent K8s cluster | Anonymized production subset |
| **Production** | Live | Multi-region K8s | Real production data |

### 4.2 Dev Environment

- **Provisioning:** `docker compose up` with all services
- **Test Data:** Factory pattern with Faker.js, seeded on startup
- **Hot Reload:** Vite for frontend, nodemon for backend
- **Debugging:** Chrome DevTools, VS Code debugger, Node.js inspector

### 4.3 Preview Environment (Ephemeral)

- **Trigger:** Auto-created on PR open, destroyed on PR merge/close
- **Provisioning:** GitHub Actions → Helm chart → K8s namespace
- **URL:** `https://pr-{number}.preview.almokhtabar.com`
- **Test Data:** Fresh database from seed scripts
- **Teardown:** Automated after 24h or PR close

### 4.4 Staging Environment

- **Configuration:** Mirrors production (reduced replica count)
- **Test Data:** Anonymized production data refreshed weekly
- **External Services:** Sandbox/Test modes for Stripe, Tap, WhatsApp, etc.
- **Monitoring:** Full observability stack (Datadog, Grafana, Sentry)
- **Access:** VPN + SSO, restricted to engineering team

### 4.5 Production Monitoring

| Method | Tool | What We Monitor |
|---|---|---|
| **Synthetic Monitoring** | Checkly/Playwright | Critical user journeys every 5 min |
| **Real User Monitoring (RUM)** | Datadog RUM | LCP, FID, CLS, JS errors |
| **APM** | Datadog APM | Request latency, error rates, DB query perf |
| **Canary Analysis** | Flagger + Datadog | Compare canary vs. baseline metrics |
| **Error Tracking** | Sentry | Unhandled exceptions, console errors |
| **Alerting** | PagerDuty | Pager for P0/P1, Slack for P2+ |

### 4.6 Test Data Management

| Aspect | Policy |
|---|---|
| **Data Generation** | Factory functions with Faker.js, consistent via fixed seeds |
| **Data Cleanup** | Ephemeral environments: destroy on teardown. Staging: weekly refresh |
| **PHI Handling** | No real PHI in non-production. Anonymization script for staging sync |
| **Synthetic Users** | Predefined users for each role (patient, doctor, admin, etc.) |
| **Data Versioning** | Migration files in source control with rollback scripts |

---

## 5. Defect Management

### 5.1 Severity Definitions

| Severity | Label | Definition | Example |
|---|---|---|---|
| **P0 - Critical** | `severity/critical` | Complete system outage, data loss, security breach | Payment processing down, PHI exposed |
| **P1 - High** | `severity/high` | Major feature broken, no workaround | Appointment booking fails, results not loading |
| **P2 - Medium** | `severity/medium` | Feature partially broken, workaround exists | Search filtering incorrect, minor display issue |
| **P3 - Low** | `severity/low` | Minor issue, cosmetic, nice-to-have | Button misalignment, typo in translated copy |
| **P4 - Trivial** | `severity/trivial` | Cosmetic only, no user impact | Inconsistent icon sizing, minor color shade |

### 5.2 Priority Definitions

| Priority | Label | Definition | Response SLA |
|---|---|---|---|
| **P0 - Blocker** | `priority/blocker` | Blocks release or deployment | Acknowledge < 30min, Fix < 4h |
| **P1 - High** | `priority/high` | Must fix before next release | Acknowledge < 2h, Fix < 24h |
| **P2 - Medium** | `priority/medium` | Should fix in current sprint | Acknowledge < 8h, Fix < 72h |
| **P3 - Low** | `priority/low` | Nice to have, next sprint | Triage within sprint, fix within 2 |

### 5.3 Bug Lifecycle

```
New ──→ Triaged ──→ Assigned ──→ In Progress ──→ Fixed ──→ Verified ──→ Closed
  │         │                                                      │
  └──→ Duplicate ──→ Closed                                        │
  └──→ Won't Fix ──→ Closed                                        │
  └──→ Not Reproducible ──→ More Info ──→ (back to New)            │
                                                                   │
                                                          Reopened ←┘
```

**Lifecycle Transitions:**
1. **New → Triaged:** Daily triage meeting reviews and assigns severity/priority
2. **Triaged → Assigned:** Assigned to developer with sprint commitment
3. **Assigned → In Progress:** Developer starts work, links to fix branch
4. **In Progress → Fixed:** PR submitted, tests passing, code reviewed
5. **Fixed → Verified:** QA verifies fix on staging, runs regression for affected area
6. **Verified → Closed:** Confirmed fixed in production monitoring window

### 5.4 Bug SLAs

| Severity | Acknowledge | Root Cause | Fix Deployed | Communication Cadence |
|---|---|---|---|---|
| **P0** | < 30 minutes | < 2 hours | < 4 hours | Every 30 min until resolved |
| **P1** | < 2 hours | < 12 hours | < 24 hours | Daily during incident |
| **P2** | < 8 hours | < 48 hours | < 72 hours | Every 3 days |
| **P3** | < 1 sprint | < 2 sprints | < 2 sprints | Per sprint review |
| **P4** | Backlog | Quarterly | Quarterly | Per quarter review |

---

## 6. Test Automation Approach

### 6.1 CI/CD Integration

| Trigger | Tests Run | Time Budget | Blocks Merge? |
|---|---|---|---|
| **Commit** | Lint + Type check + Unit (affected) | 5 min | No |
| **PR Open** | Lint + Unit + Integration + SAST + Dep audit | 15 min | Yes |
| **PR Updated** | Same as PR Open | 15 min | Yes |
| **Merge to Main** | Lint + Unit + Integration + E2E smoke + Build | 20 min | N/A |
| **Staging Deploy** | All of above + Full E2E (parallel) | 45 min | N/A |
| **Production Deploy** | Smoke suite + Synthetic monitoring | 10 min | N/A |

### 6.2 Scheduled Test Runs

| Schedule | Tests | Duration | Purpose |
|---|---|---|---|
| **Nightly (00:00 AST)** | Full E2E + Load + Accessibility | 2 hours | Deep regression, performance trend |
| **Weekly (Sunday)** | Full regression + Security audit | 3 hours | Release readiness |
| **Weekly (Wednesday)** | Chaos experiments | 2 hours | Resilience validation |
| **Monthly** | Full pentest + Penetration test | 6 hours | Comprehensive security review |

### 6.3 Test Automation Tool Stack

| Tool | Purpose | Version | License |
|---|---|---|---|
| **Jest** | Backend unit + integration tests | v29.7 | MIT |
| **Vitest** | Frontend unit tests | v1.6 | MIT |
| **Playwright** | E2E, Visual regression, API tests | v1.45 | Apache 2.0 |
| **k6** | Load, stress, soak, spike tests | v0.52 | AGPL |
| **OWASP ZAP** | DAST security scanning | v2.15 | Apache 2.0 |
| **axe-core** | Accessibility audit | v4.9 | MIT |
| **Lighthouse CI** | Performance, best practices, SEO | v12 | Apache 2.0 |
| **SonarQube** | SAST, code quality, coverage | v10.6 | Community Edition |
| **Snyk** | Dependency vulnerability scanning | v1.1290 | Apache 2.0 |
| **Percy** | Visual regression diffing | v10 | Commercial |
| **Spectral** | OpenAPI contract validation | v6.14 | Apache 2.0 |
| **Testcontainers** | Integration test infrastructure | v10 | MIT |

### 6.4 Automation Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CI/CD Pipeline (GitHub Actions)               │
├────────────┬────────────┬───────────┬───────────┬───────────────────┤
│ Unit Tests │ Integration│  SAST +   │  Build +  │    E2E Tests       │
│ (Jest/     │ (Supertest │ Dependency│  Deploy   │   (Playwright)     │
│  Vitest)   │ + TC)      │  Audit    │           │                    │
├────────────┴────────────┴───────────┴───────────┴───────────────────┤
│                        Parallel Execution Layer                      │
├─────────────────────────────────────────────────────────────────────┤
│                         Test Reporting (Allure)                      │
├─────────────────────────────────────────────────────────────────────┤
│              Test Data (Factories + Faker.js + Seed Scripts)         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Metrics & Reporting

### 7.1 QA Metrics Dashboard (Grafana)

| Dashboard Section | Metrics | Source |
|---|---|---|
| **Test Execution** | Pass/fail/skip counts, execution time, pass rate trend | Allure + CI |
| **Coverage** | Line, branch, function, statement coverage by module | Jest/Vitest |
| **Flaky Tests** | Flaky test list, failure count, quarantine status | CI analytics |
| **Defect Metrics** | Defect density by module, MTD (mean time to detect), MTF (mean time to fix) | Jira |
| **Build Stability** | Build pass rate, average duration, queue time | GitHub Actions |
| **Performance** | API latency (p50/p95/p99), throughput, error rate, DB query time | Datadog |
| **Lighthouse** | Performance, Accessibility, Best Practices, SEO scores | Lighthouse CI |

### 7.2 Key Performance Indicators

| KPI | Target | Measurement | Alert Threshold |
|---|---|---|---|
| **Test Pass Rate** | >= 98% | CI pipeline | < 95% (Slack alert) |
| **Code Coverage** | >= 80% | SonarQube | < 75% (PR block) |
| **Flaky Test Rate** | <= 2% | CI analytics | > 5% (Review required) |
| **Defect Density** | <= 0.5 per KLOC | Jira / SonarQube | > 1.0 (Review required) |
| **Mean Time to Detect** | < 1 hour from commit | Monitoring + CI | > 4 hours (Process review) |
| **Mean Time to Fix (P0/P1)** | < 4 hours / < 24 hours | Jira / PagerDuty | Breach SLA (Escalation) |
| **Build Stability Index** | >= 95% | GitHub Actions | < 90% (Pipeline review) |
| **Deployment Frequency** | Multiple times per week | GitHub Actions | < 1 per week (Process review) |
| **Change Failure Rate** | <= 5% | Monitoring + CI | > 10% (Process review) |

### 7.3 Reporting Cadence

| Report | Frequency | Audience | Format |
|---|---|---|---|
| **Daily Test Summary** | Daily | QA team | Slack bot |
| **Weekly QA Report** | Weekly | Engineering team | Email + Confluence |
| **Release Readiness Report** | Per release | All stakeholders | Confluence + Slack |
| **Monthly Quality Review** | Monthly | Leadership | Slide deck |
| **Quarterly Audit Report** | Quarterly | Compliance | PDF + Evidence bundle |

### 7.4 Continuous Improvement

- **Retrospective:** Bi-weekly sprint retro includes QA process discussion
- **Root Cause Analysis:** Conducted for every P0/P1 production incident
- **Test Debt Tracking:** Technical debt backlog for test maintenance
- **Tool Evaluation:** Quarterly review of testing tool effectiveness
- **Training:** Monthly knowledge sharing sessions on testing techniques

---

## Appendix A: Module List

| # | Module | Code | Key Tables/Services |
|---|---|---|---|
| 1 | Authentication | `auth` | users, roles, permissions, sessions, mfa_devices |
| 2 | Appointments | `appointments` | appointments, time_slots, branches, services |
| 3 | Results | `results` | test_results, report_files, critical_alerts |
| 4 | Payments | `payments` | invoices, transactions, refunds, wallets, subscriptions |
| 5 | Patients | `patients` | patients, medical_history, documents |
| 6 | Branches | `branches` | branches, branch_hours, branch_services |
| 7 | Laboratories | `labs` | laboratories, lab_technicians, lab_equipment |
| 8 | Tests | `tests` | test_catalog, test_panels, test_pricing |
| 9 | Packages | `packages` | packages, package_tests, package_discounts |
| 10 | Insurances | `insurances` | insurance_providers, insurance_plans, coverage |
| 11 | Reports | `reports` | analytics_reports, scheduled_reports, exports |
| 12 | Notifications | `notifications` | notification_templates, delivery_logs, channels |
| 13 | Audit | `audit` | audit_logs, data_retention, compliance_reports |
| 14 | Admin | `admin` | admin_users, system_settings, feature_flags |
| 15 | Integrations | `integrations` | webhook_configs, api_keys, integration_logs |
| 16 | Analytics | `analytics` | events, user_journeys, dashboards |
| 17 | Support | `support` | tickets, chat_messages, faq_categories |
| 18 | Content | `content` | pages, blog_posts, seo_metadata, translations |

## Appendix B: Compliance Mapping

| Requirement | Test Coverage | Frequency | Evidence |
|---|---|---|---|
| **HIPAA** (164.312(a)(1)) - Access Control | Auth tests, role-based access | Every PR | Test report |
| **HIPAA** (164.312(c)(1)) - Integrity | Audit log tests | Every PR | Audit trail |
| **HIPAA** (164.312(e)(1)) - Transmission | TLS tests, security headers | Every PR | SSL report |
| **GDPR** Art. 17 - Right to Erasure | Data deletion tests | Pre-release | Test report |
| **GDPR** Art. 32 - Security | Security scan, pen test | Monthly | Scan report |
| **NPHIES** - Claim Submission | Integration contract tests | Every PR | Contract report |
| **CCHI** - Appointment Rules | Business logic tests | Every PR | Test report |
| **ZATCA** - E-Invoicing | Invoice format tests, QR code | Pre-release | QR validation |

## Appendix C: Test Environment Configuration

| Service | Dev | Staging | Production |
|---|---|---|---|
| **PostgreSQL** | Docker (14.x) | RDS (15.x, db.r6g.large) | RDS (15.x, Multi-AZ, db.r6g.2xlarge) |
| **Redis** | Docker (7.x) | ElastiCache (7.x, cache.r6g.large) | ElastiCache (7.x, Cluster, cache.r6g.xlarge) |
| **RabbitMQ** | Docker (3.x) | MQ (3.x, mq.m5.large) | Amazon MQ (3.x, HA, mq.m5.xlarge) |
| **Object Storage** | Local MinIO | S3-compatible | AWS S3 + AWS CloudFront |
| **CDN** | N/A | CloudFront | CloudFront + Akamai |
| **K8s** | Docker Desktop | EKS (3 nodes, m5.xlarge) | EKS (10 nodes, m5.2xlarge, multi-AZ) |
