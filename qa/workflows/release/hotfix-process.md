# Hotfix Process

## Al Mokhtabar Laboratory Platform

| Metadata | Value |
|---|---|
| **Document Version** | 1.0.0 |
| **Last Updated** | 2026-07-30 |
| **Classification** | Internal - Confidential |
| **Owner** | Release Management |

---

## 1. Overview

### 1.1 When to Use Hotfix

A hotfix is an emergency release intended to fix a **P0 (Critical)** or **P1 (High)** issue in production that cannot wait for the next scheduled release.

**Hotfix triggers:**
- Production service outage affecting all users
- Payment processing failure
- Security vulnerability (active exploitation or imminent risk)
- PHI data exposure
- Critical business metric drop (booking rate, payment success, etc.)
- Complete feature failure with no workaround

**NOT a hotfix (use regular patch release):**
- Minor UI bug
- Non-critical performance regression
- Feature enhancement
- Documentation update
- Low-severity security findings with no active exploitation

### 1.2 Hotfix SLA

| Metric | Target |
|---|---|
| **Detection to branch** | < 15 minutes |
| **Fix development** | < 2 hours |
| **QA verification (smoke)** | < 15 minutes |
| **Production deploy** | < 5 minutes |
| **Total time (detection to deploy)** | < 4 hours |

---

## 2. Hotfix Workflow

### Phase 1: Detection & Triage

**Trigger:** P0/P1 incident detected via monitoring, user report, or security scan.

| # | Action | Owner | Duration |
|---|---|---|---|
| 1.1 | Incident reported in #incidents Slack channel | Reporter | Immediate |
| 1.2 | On-call engineer acknowledges within 5 minutes | On-call SRE | < 5min |
| 1.3 | Assess severity: is this a hotfix candidate? | On-call SRE + Eng Lead | < 10min |
| 1.4 | If hotfix: declare via PagerDuty, create incident INC-YYYY-NNN | On-call SRE | < 5min |
| 1.5 | Assemble hotfix team (minimal: 1 dev + 1 QA + 1 SRE) | Engineering Lead | < 5min |
| 1.6 | Determine hotfix scope: minimal fix, no scope creep | Engineering Lead | < 10min |

### Phase 2: Branch & Fix

**Important difference from regular release:** Hotfix branches from `main` (production), not from `develop`.

| # | Action | Owner | Command |
|---|---|---|---|
| 2.1 | Branch from main: `git checkout -b hotfix/INC-YYYY-NNN-description main` | Developer | `git checkout -b hotfix/INC-2026-042-payment-timeout main` |
| 2.2 | Implement minimal fix (no refactoring, no unrelated changes) | Developer | Code changes |
| 2.3 | Write/update unit + integration test for the fix | Developer | `npm run test:unit -- --related` |
| 2.4 | Run relevant unit + integration tests only | CI (or local) | Target affected modules |
| 2.5 | Commit with conventional commit format | Developer | `git commit -m "fix(payments): add idempotency retry logic for Stripe timeouts"` |
| 2.6 | Push branch: `git push origin hotfix/INC-YYYY-NNN-description` | Developer | `git push -u origin hotfix/INC-2026-042-payment-timeout` |

### Phase 3: Validation (Accelerated QA)

**Hotfix QA is abbreviated but not skipped. Only critical checks run.**

| # | Check | Tool | Duration | Skip Criteria |
|---|---|---|---|---|
| 3.1 | Unit tests (affected modules) | Jest | 5min | Never |
| 3.2 | Integration tests (affected endpoints) | Supertest | 5min | Never |
| 3.3 | E2E smoke suite | Playwright | 10min | Never |
| 3.4 | E2E test for the specific fixed flow | Playwright | 2min | Never |
| 3.5 | Security scan (SAST only, affected files) | SonarQube | 5min | If no code change to security-sensitive files |
| 3.6 | Visual regression (affected pages only) | Percy | 5min | If no UI change |
| 3.7 | Performance benchmark (affected endpoint) | autocannon | 2min | If no algorithmic/DB change |
| **Total** | | | **~34min** | |

**Full regression and full security scan are SKIPPED for hotfixes.**

### Phase 4: Code Review (Accelerated)

| # | Action | Owner | Duration |
|---|---|---|---|
| 4.1 | Create PR: `hotfix/INC-YYYY-NNN-description → main` | Developer | 2min |
| 4.2 | Minimum 1 reviewer (Engineering Lead or senior dev) | Reviewer | < 30min |
| 4.3 | Review focuses on: correctness, security, no side effects | Reviewer | 15min |
| 4.4 | No style or architecture nitpicks | Reviewer | N/A |
| 4.5 | PR approved and merged to main | Reviewer | Immediate |

### Phase 5: Deploy to Production

| # | Action | Owner | Duration |
|---|---|---|---|
| 5.1 | CI builds main branch | CI Pipeline | 5min |
| 5.2 | Deploy to production (direct deploy, no canary) | DevOps | 2min |
| 5.3 | Run smoke tests against production | CI Pipeline | 5min |
| 5.4 | Verify fix in production (targeted test) | QA Engineer | 5min |
| 5.5 | Monitor error rates for 15 minutes | DevOps | 15min |
| 5.6 | If rollback needed: `git revert HEAD` on main, deploy | DevOps | 3min |
| 5.7 | Announce hotfix complete in #incidents | On-call SRE | Immediate |

### Phase 6: Post-Hotfix Merge & Cleanup

| # | Action | Owner | Duration |
|---|---|---|---|
| 6.1 | Merge main → develop (so fix is in next regular release) | Developer | `git checkout develop && git merge main` |
| 6.2 | Resolve any merge conflicts | Developer | 15min |
| 6.3 | Push develop | Developer | `git push origin develop` |
| 6.4 | Delete hotfix branch | Developer | `git branch -d hotfix/INC-YYYY-NNN-description` |
| 6.5 | Tag hotfix: `git tag -a vX.Y.Z-hotfix.N -m "Hotfix: description"` | Release Manager | `git push origin vX.Y.Z-hotfix.N` |
| 6.6 | Update CHANGELOG: add hotfix entry | Tech Lead | 10min |
| 6.7 | Close incident in PagerDuty/Jira | On-call SRE | Immediate |

### Phase 7: Post-Mortem

| # | Action | Owner | Deadline |
|---|---|---|---|
| 7.1 | Create post-mortem document | Incident Commander | 24h |
| 7.2 | Root cause analysis | Engineering Lead | 24h |
| 7.3 | Identify preventative measures | Engineering Lead | 48h |
| 7.4 | Assign action items with owners/dates | Engineering Lead | 48h |
| 7.5 | Present post-mortem to engineering team | Engineering Lead | 1 week |
| 7.6 | Track action items to completion | QA Lead | 2 sprints |

---

## 3. Hotfix vs. Regular Release Comparison

| Aspect | Regular Release | Hotfix |
|---|---|---|
| **Branch from** | `develop` | `main` |
| **Merge to** | `main` | `main` then `main → develop` |
| **Branch name** | `release/vX.Y.Z` | `hotfix/INC-YYYY-NNN-description` |
| **QA scope** | Full regression (3h) | Smoke + targeted (30min) |
| **Security scan** | Full DAST + SAST | SAST only, affected files |
| **Performance test** | Full k6 benchmark | Targeted endpoint check |
| **Code review** | Full review | Accelerated, single reviewer |
| **Deploy strategy** | Blue-green + canary | Direct deploy |
| **Rollback** | Automated blue-green | Git revert + deploy |
| **Post-mortem** | If P0 incident | Always |
| **Release notes** | Comprehensive | Brief entry in CHANGELOG |
| **Version format** | vX.Y.Z | vX.Y.Z-hotfix.N |

---

## 4. Hotfix Versioning

Hotfix versions follow the format: `v{MAJOR}.{MINOR}.{PATCH}-hotfix.{N}`

Examples:
- `v1.2.3-hotfix.1` - First hotfix on top of v1.2.3
- `v1.2.3-hotfix.2` - Second hotfix on top of v1.2.3

After a hotfix, the next regular release version does NOT increment the patch number if the hotfix was already merged. The regular release version should be one higher than the hotfix base.

---

## 5. Hotfix Contact Tree

```
Hotfix Triggered
      │
      ▼
On-call SRE acknowledges (PagerDuty)
      │
      ▼
     ┌─────────────────────────────────────┐
     │  Engineering Lead notified           │
     │  (Phone call if after hours)         │
     └─────────────────────────────────────┘
      │
      ├──────────────────────────────────────┐
      ▼                                      ▼
  Developer (fix)                        QA Engineer (verify)
      │                                      │
      ├──────────────────────────────────────┘
      │
      ▼
  DevOps (deploy)
      │
      ▼
  Release Manager (communicate)
      │
      ▼
  Stakeholder notification
```

### Escalation Phone Numbers

| Role | Primary | Secondary |
|---|---|---|
| **On-call SRE** | [Phone] | [Phone] |
| **Engineering Lead** | [Phone] | [Phone] |
| **QA Lead** | [Phone] | [Phone] |
| **VP Engineering** | [Phone] | [Phone] |
| **CTO** | [Phone] | [Phone] |

---

## 6. Hotfix Script

```bash
#!/bin/bash
# scripts/hotfix.sh - Create hotfix branch
# Usage: ./scripts/hotfix.sh INC-2026-042 "fix payment timeout"

INCIDENT=$1
DESCRIPTION=$2
SLUG=$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
BRANCH="hotfix/${INCIDENT}-${SLUG}"

# Ensure we're on main with latest
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b "$BRANCH"

echo "Created hotfix branch: $BRANCH"
echo ""
echo "Next steps:"
echo "1. Implement the fix"
echo "2. Commit: git commit -m \"fix($MODULE): $DESCRIPTION\""
echo "3. Push: git push -u origin $BRANCH"
echo "4. Create PR to main"
```
