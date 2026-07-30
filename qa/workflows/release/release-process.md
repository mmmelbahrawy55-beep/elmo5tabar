# Release Process

## Al Mokhtabar Laboratory Platform

| Metadata | Value |
|---|---|
| **Document Version** | 1.0.0 |
| **Last Updated** | 2026-07-30 |
| **Classification** | Internal - Confidential |
| **Owner** | Release Management |

---

## 1. Release Overview

### 1.1 Release Types

| Type | Frequency | Description | Risk Level |
|---|---|---|---|
| **Major Release** | Monthly | New features, breaking changes, major improvements | High |
| **Minor Release** | Bi-weekly | Feature additions, non-breaking changes | Medium |
| **Patch Release** | As needed | Bug fixes, security patches, performance improvements | Low |
| **Hotfix** | Emergency | Critical production issues requiring immediate fix | Critical |

### 1.2 Release Cadence

| Activity | Schedule | Owner |
|---|---|---|
| Release planning | Every 2 weeks (sprint planning) | Product Owner |
| Development sprint | 2 weeks | Engineering team |
| Code freeze | 24h before release date | Release Manager |
| Release build | Release date, 09:00 AST | CI Pipeline |
| Staging deploy | Release date, 10:00 AST | DevOps |
| UAT sign-off | Release date, 10:00-14:00 AST | QA + Stakeholders |
| Production deploy | Release date, 14:00-16:00 AST (after Jumu'ah on Fri) | DevOps |
| Post-deploy monitoring | Release date, 16:00-17:00 AST | DevOps + QA |

---

## 2. Release Phases

### Phase 1: Start Release (T-7 days)

**Trigger:** Development sprint ends, feature freeze begins.

**Steps:**

| # | Action | Owner | Duration |
|---|---|---|---|
| 1.1 | Verify all sprint stories meet Definition of Done | Scrum Master | 1h |
| 1.2 | Create release branch from develop: `git checkout -b release/vX.Y.Z develop` | Tech Lead | 5min |
| 1.3 | Update version numbers: `package.json`, `version.ts`, Helm chart values | Tech Lead | 15min |
| 1.4 | Update CHANGELOG.md with release notes draft | Tech Lead | 30min |
| 1.5 | Update API documentation if applicable | Tech Lead | 1h |
| 1.6 | Run pre-release checklist ([see release-checklist.md](../../docs/release-checklist.md)) | QA Lead | 2h |
| 1.7 | Create release candidate RC.1 | CI Pipeline | 30min |
| 1.8 | Tag RC.1: `git tag -a vX.Y.Z-rc.1 -m "Release vX.Y.Z RC.1"` | Release Manager | 5min |
| 1.9 | Notify team: Release process started in #releases Slack channel | Release Manager | 5min |

**Outputs:**
- Release branch `release/vX.Y.Z`
- Release candidate `vX.Y.Z-rc.1`
- Pre-release checklist started

### Phase 2: Release Branch Validation (T-3 days)

**Trigger:** RC.1 build complete.

**Steps:**

| # | Action | Owner | Duration |
|---|---|---|---|
| 2.1 | Run full CI suite on release branch (all tests) | CI Pipeline | 3h |
| 2.2 | Run full regression suite | CI Pipeline | 3h |
| 2.3 | Run performance benchmarks (k6 load test) | QA Engineer | 1h |
| 2.4 | Run security scan (OWASP ZAP full scan) | QA/Security Engineer | 2h |
| 2.5 | Run accessibility scan (axe-core all pages) | QA Engineer | 30min |
| 2.6 | Run visual regression (all pages vs. baseline) | QA Engineer | 1h |
| 2.7 | Review all results; if any required check fails → fix + create RC.2 | QA Lead | 2h |
| 2.8 | Repeat until all checks pass (RC.2, RC.3, ...) | QA + Dev | As needed |

**Exit Criteria:**
- Release checklist 100% green
- No P0/P1 open bugs
- Performance baselines verified

### Phase 3: Staging Deploy & UAT (T-1 day)

**Trigger:** Release candidate passes all validation.

**Steps:**

| # | Action | Owner | Duration |
|---|---|---|---|
| 3.1 | Deploy RC to staging environment | DevOps | 15min |
| 3.2 | Execute smoke tests on staging | CI Pipeline | 10min |
| 3.3 | Verify monitoring dashboards on staging | DevOps | 15min |
| 3.4 | UAT by QA team: full exploratory testing | QA Engineers | 4h |
| 3.5 | UAT by Product Owner: feature verification | Product Owner | 2h |
| 3.6 | UAT by medical stakeholders: workflow verification | Medical Lead | 2h |
| 3.7 | Collect UAT sign-off signatures | Release Manager | 1h |
| 3.8 | If UAT fails → fix, create RC.N, redeploy to staging | Dev + QA | As needed |

**Outputs:**
- Release candidate deployed to staging
- UAT signed off by all stakeholders
- Final go/no-go decision prepared

### Phase 4: Production Deploy (Release Day)

**Trigger:** UAT signed off, go decision made.

**Pre-deployment Checklist:**

```
□ All checks from Phase 2 pass
□ UAT sign-off obtained
□ Go/no-go decision documented
□ Maintenance window communicated (if downtime expected)
□ Rollback script verified
□ Monitoring dashboards open
□ On-call engineer notified
□ Support team briefed
□ Stakeholders notified of maintenance window
```

**Deployment Steps:**

| # | Action | Owner | Duration | Command/Details |
|---|---|---|---|---|
| 4.1 | Deploy to production (blue-green) | DevOps | 2min | `kubectl apply -f k8s/production/` |
| 4.2 | Wait for pods to become healthy | DevOps | 30s | `kubectl wait --for=condition=ready pods -l app=backend` |
| 4.3 | Switch traffic to green environment | DevOps | 1min | Update service selector / ingress |
| 4.4 | Run smoke tests against production | CI Pipeline | 5min | `npx playwright test --config=e2e/smoke.config.ts` |
| 4.5 | Start canary analysis (10% traffic) | Flagger | 5min | Automatic, monitor metrics |
| 4.6 | If canary passes → 50% → 100% rollout | Flagger | 10min | Automatic, or manual override |
| 4.7 | Execute post-deployment monitoring | DevOps + QA | 30min | See Phase 5 |
| 4.8 | Announce deployment complete | Release Manager | Immediate | Slack #releases |

**Rollback Procedure (if needed):**

| # | Action | Owner | Duration |
|---|---|---|---|
| 1 | Trigger rollback: `./scripts/rollback.sh vX.Y.Z` | DevOps | 1min |
| 2 | Verify previous version deployed | DevOps | 30s |
| 3 | Run smoke tests on rolled-back version | CI Pipeline | 5min |
| 4 | Announce rollback to stakeholders | Release Manager | 5min |
| 5 | Begin incident investigation | Engineering Lead | Immediate |

### Phase 5: Post-Deploy Verification

**Trigger:** Production traffic switched to new version.

**Monitoring Window: 60 minutes**

| Time Window | Focus Area | Owner |
|---|---|---|
| T+0 to T+10min | Error rates, API latency, auth success rate | DevOps |
| T+10min to T+30min | Payment processing, critical user journeys | QA + DevOps |
| T+30min to T+60min | All systems, background jobs, integrations | DevOps |
| T+24h | Final verification: error rates, performance, stability | QA |

**Verification Checklist:**

```
□ All pods running and healthy (kubectl get pods)
□ API error rate < 0.5% above baseline (Datadog)
□ API p95 latency within SLO (Datadog)
□ Payment success rate > 99% (Stripe dashboard)
□ Auth success rate > 95% (Datadog)
□ Sentry error count normal (Sentry dashboard)
□ Background jobs processing without errors (RabbitMQ + Datadog)
□ All integrated services responding (webhook delivery logs)
□ Synthetic monitors passing (Checkly)
□ Lighthouse CI scores published
```

### Phase 6: Release Communication

**Trigger:** Post-deployment monitoring passes.

| Audience | Channel | Message | Timing |
|---|---|---|---|
| Internal team | Slack #releases | Deployment complete, version, key changes | Immediate |
| Internal team | Email (eng@) | Release summary, known issues, rollback info | T+1h |
| Customer support | Slack #support | Release notes, known issues, script for handling questions | T+1h |
| External (patients) | Status page | If downtime occurred: "Resolved" update | T+1h |
| External (patients) | App notification | If new features: in-app banner "What's New" | T+24h |
| External (B2B) | Email | If API changes: API changelog | T+24h |

### Phase 7: Post-Release & Retrospective (T+48h)

**Trigger:** 48 hours after production deployment.

**Steps:**

| # | Action | Owner | Duration |
|---|---|---|---|
| 7.1 | Verify no P0/P1 incidents since release | QA Lead | 15min |
| 7.2 | Review release metrics: error rates, performance, usage | DevOps + PM | 30min |
| 7.3 | Tag release in git: `git tag -a vX.Y.Z -m "Release vX.Y.Z"` | Release Manager | 5min |
| 7.4 | Merge release branch to main: `git checkout main && git merge release/vX.Y.Z` | Tech Lead | 5min |
| 7.5 | Merge release branch back to develop: `git checkout develop && git merge release/vX.Y.Z` | Tech Lead | 5min |
| 7.6 | Delete release branch: `git branch -d release/vX.Y.Z` | Tech Lead | 1min |
| 7.7 | Conduct release retrospective with team | Scrum Master | 1h |
| 7.8 | Update release process documentation with lessons learned | Release Manager | 30min |

### Phase 8: Post-Mortem (if incident occurred)

**Trigger:** Any P0 incident during release.

**Steps:**

| # | Action | Owner | Deadline |
|---|---|---|---|
| 8.1 | Create incident post-mortem document | Incident Commander | 24h |
| 8.2 | Determine root cause | Engineering Lead | 48h |
| 8.3 | Assign action items with owners and due dates | Engineering Lead | 48h |
| 8.4 | Present post-mortem to engineering team | Engineering Lead | 1 week |
| 8.5 | Track action items to completion | QA Lead | 2 sprints |
| 8.6 | Update runbooks and automation to prevent recurrence | DevOps | 1 sprint |

---

## 3. Release Automation

### 3.1 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/release.yml
name: Release Pipeline

on:
  push:
    branches:
      - 'release/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e:smoke
      - run: npm run security:scan
      - run: npm run dep:audit
      - run: npm run build

  deploy-staging:
    needs: validate
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/deploy-staging.sh
      - run: npm run test:e2e:smoke -- --base-url=${{ env.STAGING_URL }}

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    concurrency: production-deploy
    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/deploy-production-blue-green.sh
      - run: npm run test:e2e:smoke -- --base-url=https://almokhtabar.com
      - run: ./scripts/canary-analyze.sh
```

### 3.2 Release Automation Scripts

| Script | Purpose | Location |
|---|---|---|
| `deploy-staging.sh` | Deploy to staging K8s cluster | `scripts/deploy-staging.sh` |
| `deploy-production-blue-green.sh` | Blue-green deploy to production | `scripts/deploy-production-blue-green.sh` |
| `rollback.sh` | Rollback to previous version | `scripts/rollback.sh` |
| `tag-release.sh` | Create and push git tags | `scripts/tag-release.sh` |
| `update-version.sh` | Bump version in all files | `scripts/update-version.sh` |
| `canary-analyze.sh` | Analyze canary metrics | `scripts/canary-analyze.sh` |

---

## 4. Release Roles & Responsibilities

| Role | Person | Responsibilities |
|---|---|---|
| **Release Manager** | Rotating (weekly) | Overall coordination, communication, go/no-go decision |
| **Engineering Lead** | Tech Lead on duty | Code quality, merge management, technical decisions |
| **QA Lead** | QA Manager | Test sign-off, regression results, UAT coordination |
| **DevOps Lead** | SRE on call | Deployment execution, monitoring, rollback |
| **Product Owner** | PO | Feature acceptance, UAT sign-off, priority decisions |
| **Compliance Officer** | Compliance | Compliance checklist sign-off |
| **Support Lead** | Support Manager | Support team readiness, customer communication |
| **Medical Lead** | Medical Advisor | Clinical workflow verification, medical UAT |

---

## 5. Release Artifacts

| Artifact | Location | Retention |
|---|---|---|
| Release tag | GitHub: `vX.Y.Z` | Permanent |
| Release notes | GitHub Releases + CHANGELOG.md | Permanent |
| Pre-release checklist | Confluence + this doc | 1 year |
| UAT sign-off document | Confluence | 1 year |
| Production sign-off certificate | Confluence (signed PDF) | 6 years (HIPAA) |
| Deployment log | Datadog + CI logs | 90 days |
| Post-mortem (if applicable) | Confluence | 3 years |

---

## 6. Release Communication Templates

### Slack #releases Announcement

```
🚀 Release v{version} - {status}

Status: {IN PROGRESS | DEPLOYED | ROLLED BACK | COMPLETE}
Environment: {Staging | Production}
Release Manager: @{name}

Changes:
- Feature 1: {brief description}
- Feature 2: {brief description}
- Bug fixes: {count} bugs fixed
- Security: {count} patches

Known Issues:
- Issue 1: {description} (workaround: {workaround})

Monitoring Dashboard: {link}
Release Notes: {link}

Next action: {next step}
```

### Go/No-Go Decision Template

```
# Go/No-Go Decision: v{version}

Date: YYYY-MM-DD
Time: HH:MM AST
Release Manager: {name}

## Prerequisites
- [ ] Pre-release checklist complete (all required items pass)
- [ ] UAT signed off by Product Owner
- [ ] UAT signed off by Medical Lead
- [ ] Stakeholders notified of deployment window
- [ ] Support team briefed

## Risk Assessment
- Risk Level: {Low / Medium / High / Critical}
- Risk Factors: {list}
- Mitigations: {list}

## Decision
☐ GO - Proceed with production deployment
☐ NO-GO - Do not deploy
☐ CONDITIONAL - Deploy with conditions: {conditions}

## Signatures
- Release Manager: ______________
- Engineering Lead: ______________
- QA Lead: ______________
- Product Owner: ______________
- VP Engineering: ______________
```
