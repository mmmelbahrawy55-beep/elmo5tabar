# Pre-Release Checklist

## Al Mokhtabar Laboratory Platform

| Metadata | Value |
|---|---|
| **Document Version** | 1.0.0 |
| **Last Updated** | 2026-07-30 |
| **Classification** | Internal - Confidential |
| **Owner** | Release Management |

---

## Release Information

| Field | Value |
|---|---|
| **Release Version** | v[1-9].[0-9].[0-9] |
| **Release Candidate** | RC-[1-9] |
| **Release Date** | YYYY-MM-DD |
| **Release Manager** | [Name] |
| **QA Lead** | [Name] |
| **Build Number** | [CI Build ID] |
| **Commit Hash** | [Git SHA] |
| **Branch** | release/v[version] |

---

## Instructions

1. Run each check in order. Do not skip any check unless explicitly documented and approved.
2. Mark each item as Pass, Fail, Skip (with reason), or N/A.
3. If any required check fails, the release candidate is **REJECTED** and must be fixed before re-submission.
4. Attach evidence (CI run URLs, screenshots, reports) for each check.
5. This checklist must be signed off by both QA Lead and Release Manager before production deployment.

---

## Checklist

### 1. Automated Testing

| # | Check | Required | Result | Evidence |
|---|---|---|---|---|
| 1.1 | All unit tests pass (100%) | Yes | ☐ Pass ☐ Fail | CI Run #[ID] |
| 1.2 | All integration tests pass (100%) | Yes | ☐ Pass ☐ Fail | CI Run #[ID] |
| 1.3 | All E2E tests pass (>= 98%) | Yes | ☐ Pass ☐ Fail | CI Run #[ID] |
| 1.4 | Known E2E failures documented | If < 100% | ☐ Pass ☐ N/A | Jira tickets linked |
| 1.5 | Flaky test count < 10 | Yes | ☐ Pass ☐ Fail | CI analytics |
| 1.6 | No P0/P1 test failures | Yes | ☐ Pass ☐ Fail | Test report |

### 2. Code Coverage

| # | Check | Required | Result | Evidence |
|---|---|---|---|---|
| 2.1 | Statements coverage >= 80% | Yes | ☐ Pass ☐ Fail | SonarQube report |
| 2.2 | Branches coverage >= 75% | Yes | ☐ Pass ☐ Fail | SonarQube report |
| 2.3 | Functions coverage >= 80% | Yes | ☐ Pass ☐ Fail | SonarQube report |
| 2.4 | Lines coverage >= 80% | Yes | ☐ Pass ☐ Fail | SonarQube report |
| 2.5 | Per-module minimums met (>= 75% statements) | Yes | ☐ Pass ☐ Fail | SonarQube report |
| 2.6 | New code coverage >= 90% | Yes | ☐ Pass ☐ Fail | SonarQube report |
| 2.7 | Coverage trend not decreasing from baseline | Yes | ☐ Pass ☐ Fail | SonarQube report |

### 3. Performance

| # | Check | Required | Result | Evidence |
|---|---|---|---|---|
| 3.1 | Lighthouse Performance >= 95 | Yes | ☐ Pass ☐ Fail | Lighthouse CI report |
| 3.2 | Lighthouse Accessibility >= 95 | Yes | ☐ Pass ☐ Fail | Lighthouse CI report |
| 3.3 | Lighthouse Best Practices >= 95 | Yes | ☐ Pass ☐ Fail | Lighthouse CI report |
| 3.4 | Lighthouse SEO >= 95 | Yes | ☐ Pass ☐ Fail | Lighthouse CI report |
| 3.5 | FCP < 1.5s | Yes | ☐ Pass ☐ Fail | Lighthouse CI report |
| 3.6 | LCP < 2.5s | Yes | ☐ Pass ☐ Fail | Lighthouse CI report |
| 3.7 | CLS < 0.1 | Yes | ☐ Pass ☐ Fail | Lighthouse CI report |
| 3.8 | TBT < 200ms | Yes | ☐ Pass ☐ Fail | Lighthouse CI report |
| 3.9 | API p95 latency < 500ms (load test) | Yes | ☐ Pass ☐ Fail | k6 report |
| 3.10 | API p99 latency < 1000ms (load test) | Yes | ☐ Pass ☐ Fail | k6 report |
| 3.11 | Error rate < 1% (load test) | Yes | ☐ Pass ☐ Fail | k6 report |
| 3.12 | No performance regression > 10% from baseline | Yes | ☐ Pass ☐ Fail | Performance comparison report |
| 3.13 | Bundle size within budget | Yes | ☐ Pass ☐ Fail | Bundle analysis report |

### 4. Security

| # | Check | Required | Result | Evidence |
|---|---|---|---|---|
| 4.1 | SAST scan: 0 critical, 0 high issues | Yes | ☐ Pass ☐ Fail | SonarQube report |
| 4.2 | DAST scan: 0 critical vulnerabilities | Yes | ☐ Pass ☐ Fail | OWASP ZAP report |
| 4.3 | Dependency audit: no high/critical CVEs | Yes | ☐ Pass ☐ Fail | Snyk / npm audit report |
| 4.4 | Secret scanning: no secrets detected | Yes | ☐ Pass ☐ Fail | GitLeaks report |
| 4.5 | Security headers all present and correct | Yes | ☐ Pass ☐ Fail | securityheaders.com report |
| 4.6 | SSL Labs rating >= A+ | Yes | ☐ Pass ☐ Fail | SSL Labs report |
| 4.7 | CSP configured and effective | Yes | ☐ Pass ☐ Fail | CSP evaluator |
| 4.8 | Rate limiting verified on auth/OTP endpoints | Yes | ☐ Pass ☐ Fail | Test report |
| 4.9 | CORS configured correctly | Yes | ☐ Pass ☐ Fail | Test report |
| 4.10 | All API keys and secrets rotated since last release | Yes | ☐ Pass ☐ Fail | DevOps verification |

### 5. Accessibility

| # | Check | Required | Result | Evidence |
|---|---|---|---|---|
| 5.1 | axe-core: 0 critical violations | Yes | ☐ Pass ☐ Fail | axe report |
| 5.2 | axe-core: 0 serious violations | Yes | ☐ Pass ☐ Fail | axe report |
| 5.3 | Keyboard navigation: all pages navigable | Yes | ☐ Pass ☐ Fail | Test report |
| 5.4 | Screen reader: all content announced correctly | Yes | ☐ Pass ☐ Fail | Manual audit report |
| 5.5 | Color contrast: WCAG AA minimum met | Yes | ☐ Pass ☐ Fail | axe report |
| 5.6 | Focus indicators visible on all interactive elements | Yes | ☐ Pass ☐ Fail | Visual regression report |

### 6. Cross-Browser & Mobile

| # | Check | Required | Result | Evidence |
|---|---|---|---|---|
| 6.1 | Chromium (latest): all critical flows pass | Yes | ☐ Pass ☐ Fail | Playwright report |
| 6.2 | Firefox (latest): all critical flows pass | Yes | ☐ Pass ☐ Fail | Playwright report |
| 6.3 | Safari (latest): all critical flows pass | Yes | ☐ Pass ☐ Fail | Playwright / BrowserStack report |
| 6.4 | Edge (latest): all critical flows pass | Yes | ☐ Pass ☐ Fail | Playwright report |
| 6.5 | iOS Safari (iPhone 14/15): critical flows pass | Yes | ☐ Pass ☐ Fail | BrowserStack report |
| 6.6 | Android Chrome (Pixel 7/8): critical flows pass | Yes | ☐ Pass ☐ Fail | BrowserStack report |
| 6.7 | Touch interactions verified on mobile | Yes | ☐ Pass ☐ Fail | Test report |
| 6.8 | PWA manifest and service worker verified | Yes | ☐ Pass ☐ Fail | Lighthouse report |

### 7. Localization & i18n

| # | Check | Required | Result | Evidence |
|---|---|---|---|---|
| 7.1 | Arabic (ar-SA) pages render correctly (RTL) | Yes | ☐ Pass ☐ Fail | Visual regression |
| 7.2 | English (en-US) pages render correctly (LTR) | Yes | ☐ Pass ☐ Fail | Visual regression |
| 7.3 | No untranslated strings visible in AR locale | Yes | ☐ Pass ☐ Fail | i18n audit script |
| 7.4 | Date formats correct per locale | Yes | ☐ Pass ☐ Fail | Unit tests |
| 7.5 | Number formats correct per locale | Yes | ☐ Pass ☐ Fail | Unit tests |
| 7.6 | Currency formatting correct (SAR/USD) | Yes | ☐ Pass ☐ Fail | Unit tests |
| 7.7 | Phone number validation correct for Saudi format | Yes | ☐ Pass ☐ Fail | Unit tests |
| 7.8 | RTL layout: no broken UI elements | Yes | ☐ Pass ☐ Fail | Visual regression |

### 8. Visual Regression

| # | Check | Required | Result | Evidence |
|---|---|---|---|---|
| 8.1 | All pages compared against baseline | Yes | ☐ Pass ☐ Fail | Percy report |
| 8.2 | No unexpected visual changes | Yes | ☐ Pass ☐ Fail | Percy report |
| 8.3 | All intentional visual changes reviewed and approved | Yes | ☐ Pass ☐ Fail | Percy approval log |
| 8.4 | Loading/error/empty states verified | Yes | ☐ Pass ☐ Fail | Visual regression report |

### 9. API & Contract

| # | Check | Required | Result | Evidence |
|---|---|---|---|---|
| 9.1 | OpenAPI spec matches implementation | Yes | ☐ Pass ☐ Fail | Spectral report |
| 9.2 | No breaking API changes | Yes | ☐ Pass ☐ Fail | API diff report |
| 9.3 | GraphQL schema validated | Yes | ☐ Pass ☐ Fail | Schema check |
| 9.4 | WebSocket message contracts verified | Yes | ☐ Pass ☐ Fail | Integration tests |
| 9.5 | API versioning strategy followed | Yes | ☐ Pass ☐ Fail | Code review |

### 10. Database

| # | Check | Required | Result | Evidence |
|---|---|---|---|---|
| 10.1 | Migration forward-compatible | Yes | ☐ Pass ☐ Fail | Migration test |
| 10.2 | Migration backward-compatible (rollback tested) | Yes | ☐ Pass ☐ Fail | Migration test |
| 10.3 | No long-running migrations (> 5 min) | Yes | ☐ Pass ☐ Fail | Migration test |
| 10.4 | Seed data scripts updated for new schemas | Yes | ☐ Pass ☐ Fail | Code review |
| 10.5 | Database backup verified before migration | Yes | ☐ Pass ☐ Fail | DevOps verification |

### 11. Monitoring & Observability

| # | Check | Required | Result | Evidence |
|---|---|---|---|---|
| 11.1 | Error tracking (Sentry): no new errors in staging | Yes | ☐ Pass ☐ Fail | Sentry dashboard |
| 11.2 | Logging: all new features have audit logs | Yes | ☐ Pass ☐ Fail | Code review |
| 11.3 | Metrics: new metrics added to Datadog | Yes | ☐ Pass ☐ Fail | Datadog dashboard |
| 11.4 | Dashboards updated for new features | Yes | ☐ Pass ☐ Fail | Grafana review |
| 11.5 | Alerts configured for new metrics/SLOs | Yes | ☐ Pass ☐ Fail | PagerDuty / Slack review |
| 11.6 | Synthetic monitors updated for new flows | Yes | ☐ Pass ☐ Fail | Checkly review |

### 12. Infrastructure & DevOps

| # | Check | Required | Result | Evidence |
|---|---|---|---|---|
| 12.1 | Infrastructure provisioned for target capacity | Yes | ☐ Pass ☐ Fail | Terraform plan |
| 12.2 | CDN cache purged for updated assets | Yes | ☐ Pass ☐ Fail | DevOps verification |
| 12.3 | WAF rules active and not blocking legitimate traffic | Yes | ☐ Pass ☐ Fail | WAF log review |
| 12.4 | SSL certificates valid for > 30 days | Yes | ☐ Pass ☐ Fail | Certificate check |
| 12.5 | DNS records verified (including new subdomains) | Yes | ☐ Pass ☐ Fail | DNS check |
| 12.6 | Disaster recovery plan tested and current | Yes | ☐ Pass ☐ Fail | DR test report |
| 12.7 | Backup and restore verified | Yes | ☐ Pass ☐ Fail | Backup test report |
| 12.8 | Feature flags configured (enabled/disabled as needed) | Yes | ☐ Pass ☐ Fail | Feature flag config review |
| 12.9 | Canary deployment strategy configured | Yes | ☐ Pass ☐ Fail | Flagger config review |

### 13. Compliance

| # | Check | Required | Result | Evidence |
|---|---|---|---|---|
| 13.1 | HIPAA controls verified | Yes | ☐ Pass ☐ Fail | Compliance checklist |
| 13.2 | GDPR compliance confirmed | Yes | ☐ Pass ☐ Fail | Data processing review |
| 13.3 | NPHIES integration requirements met | Yes | ☐ Pass ☐ Fail | Contract tests |
| 13.4 | CCHI requirements met | Yes | ☐ Pass ☐ Fail | Business logic tests |
| 13.5 | ZATCA e-invoicing compliance verified | Yes | ☐ Pass ☐ Fail | QR code + invoice tests |
| 13.6 | Data retention policy applied (audit logs, PHI) | Yes | ☐ Pass ☐ Fail | Policy review |
| 13.7 | Audit trail enabled for all PHI access | Yes | ☐ Pass ☐ Fail | Audit log review |
| 13.8 | Consent management verified | Yes | ☐ Pass ☐ Fail | Consent flow tests |

### 14. Deployment & Rollback

| # | Check | Required | Result | Evidence |
|---|---|---|---|---|
| 14.1 | Blue-green deployment targets ready | Yes | ☐ Pass ☐ Fail | K8s cluster review |
| 14.2 | Rollback plan documented and tested | Yes | ☐ Pass ☐ Fail | Rollback script + test |
| 14.3 | Rollback triggers defined and monitored | Yes | ☐ Pass ☐ Fail | Release notes |
| 14.4 | Deployment runbook updated | Yes | ☐ Pass ☐ Fail | Runbook review |

### 15. Documentation & Communication

| # | Check | Required | Result | Evidence |
|---|---|---|---|---|
| 15.1 | Release notes written and reviewed | Yes | ☐ Pass ☐ Fail | Release notes doc |
| 15.2 | Changelog updated | Yes | ☐ Pass ☐ Fail | CHANGELOG.md |
| 15.3 | API documentation updated (if applicable) | If API changes | ☐ Pass ☐ N/A | API docs |
| 15.4 | Technical documentation updated | If feature changes | ☐ Pass ☐ N/A | Wiki/Confluence |
| 15.5 | UAT signed off by stakeholders | Yes | ☐ Pass ☐ Fail | UAT sign-off doc |
| 15.6 | Training materials prepared (if needed) | If new features | ☐ Pass ☐ N/A | Training docs |
| 15.7 | Support team briefed on new release | Yes | ☐ Pass ☐ Fail | Meeting notes |
| 15.8 | Communication plan executed (internal + external) | Yes | ☐ Pass ☐ Fail | Email / status page |
| 15.9 | Status page updated for maintenance window | If downtime | ☐ Pass ☐ N/A | Statuspage |

---

## Summary

| Category | Total Checks | Pass | Fail | Skip/N/A |
|---|---|---|---|---|
| Automated Testing | 6 | | | |
| Code Coverage | 7 | | | |
| Performance | 13 | | | |
| Security | 10 | | | |
| Accessibility | 6 | | | |
| Cross-Browser & Mobile | 8 | | | |
| Localization & i18n | 8 | | | |
| Visual Regression | 4 | | | |
| API & Contract | 5 | | | |
| Database | 5 | | | |
| Monitoring & Observability | 6 | | | |
| Infrastructure & DevOps | 9 | | | |
| Compliance | 8 | | | |
| Deployment & Rollback | 4 | | | |
| Documentation & Communication | 9 | | | |
| **Total** | **108** | **0** | **0** | **0** |

---

## Release Decision

> A release may proceed only if all required checks pass and all sign-offs are obtained.

| Decision | Criteria | Select |
|---|---|---|
| **APPROVED** | All required checks pass (no fails) | ☐ |
| **CONDITIONAL** | Minor fails with documented exceptions approved by VP Eng | ☐ |
| **REJECTED** | Any critical/required check fails | ☐ |

## Signatures

| Role | Name | Signature | Date |
|---|---|---|---|
| **QA Lead** | | | YYYY-MM-DD |
| **Release Manager** | | | YYYY-MM-DD |
| **Engineering Lead** | | | YYYY-MM-DD |
| **VP of Engineering** | | | YYYY-MM-DD |
| **Product Owner** | | | YYYY-MM-DD |
