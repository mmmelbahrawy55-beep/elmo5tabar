# Bug Reporting Workflow

## Al Mokhtabar Laboratory Platform

| Metadata | Value |
|---|---|
| **Document Version** | 1.0.0 |
| **Last Updated** | 2026-07-30 |
| **Classification** | Internal - Confidential |
| **Owner** | QA Engineering |

---

## 1. Bug Discovery

Bugs can be discovered and reported by anyone: QA engineers, developers, product managers, customer support, or end users.

### 1.1 Sources of Bug Reports

| Source | Method | Auto-Captures | Priority |
|---|---|---|---|
| **QA Testing** | Manual + Automated test execution | Full environment info, logs, screenshots | As assigned |
| **Developer Testing** | During development or code review | Git commit, branch context | As assigned |
| **CI/CD Pipeline** | Automated test failures | CI run ID, test report, trace | Based on severity |
| **Customer Support** | User reports via Zendesk | User ID, URL, browser info | User-reported priority |
| **In-App Bug Report** | Integrated feedback button | Screenshot, console logs, network logs, session replay, user agent, URL | User-assessed |
| **Monitoring/Alerts** | Sentry, Datadog, Checkly | Stack trace, environment, request context | Severity from monitoring |
| **Security Scan** | OWASP ZAP, Snyk, SonarQube | Scan report, CVE IDs, affected component | From scan severity |
| **Performance Monitoring** | k6, Lighthouse CI, RUM | Performance metrics, baseline comparison | Based on regression |

### 1.2 In-App Bug Report Button

The application includes a floating bug report button (available to authenticated users with QA/beta roles):

**Auto-captured context when report is submitted:**
- Full-page screenshot (client-side rendered)
- Console logs (last 100 entries, filtered for errors/warnings)
- Network request log (last 50 requests with status codes and timing)
- User agent string
- Current URL and previous 5 navigation entries
- Session replay link (if Sentry session replay is enabled)
- Feature flags active for the user
- User role and permissions
- Browser storage state (localStorage keys, no values for security)

---

## 2. Bug Report Submission

### 2.1 Bug Report Template

All bug reports must use the following template. Fields in **bold** are required.

```
**Title:** [Severity] Module - Brief Description

**Environment:**
- **URL:** [Full URL including locale, e.g. https://almokhtabar.com/ar/appointments]
- **API Endpoint:** [If API bug, e.g. POST /api/v1/appointments]
- **Browser:** [Browser Name Version / OS, e.g. Chrome 125 / Windows 11]
- **Device:** [If mobile, e.g. iPhone 15 Pro / iOS 17.5]
- **Viewport:** [Screen resolution, e.g. 1440x900]
- **User Role:** [Patient / Doctor / Admin / Lab Technician / Support]
- **Locale:** [ar-SA / en-US]
- **App Version:** [Version from footer or API response header]
- **Build ID:** [CI build ID from footer]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Third step]
   - [Sub-step if needed]
4. [Continue as needed]

**Expected Result:**
[What should happen when following the steps above]

**Actual Result:**
[What actually happens when following the steps above]

**Screenshots / Video:**
[Attach screenshots or video recording. For UI bugs, always include a screenshot.]

**Console Errors:**
[Paste relevant console output. If none, write "None captured"]

**Network Request:**
[Paste relevant network request details: method, URL, status code, response body]

**Severity:** [P0 / P1 / P2 / P3 / P4]
**Priority:** [P0 / P1 / P2 / P3 / P4]

**Frequency:** [Always / Often / Sometimes / Rarely / Once]
**Regression:** [Yes / No / Unknown] - [Last known working version if regression]

**Workaround:** [Describe if any workaround exists, or "None"]

**Related Issues:** [Link to related Jira issues, if any]

**Additional Context:**
[Any other information that might help, such as: time of day, network conditions, account age, number of appointments, etc.]

**Attachments:**
- [ ] Screenshot(s) attached
- [ ] Console logs attached
- [ ] HAR file attached
- [ ] Video recording attached
- [ ] Session replay link provided
```

### 2.2 Bug Report Examples

**Example 1 - P0 Critical Bug:**

```
Title: P0 Payments - Invoice Double Charge on Stripe Retry

Environment:
- URL: https://almokhtabar.com/ar/payments/checkout
- Browser: Chrome 125 / Windows 11
- User Role: Patient
- Locale: ar-SA
- App Version: v1.2.3

Steps to Reproduce:
1. Log in as patient@example.com
2. Navigate to /ar/payments/checkout?invoice=INV-12345
3. Select Stripe payment method
4. Enter card details (4242...)
5. Click "دفع" (Pay)
6. Network timeout occurs (simulated by throttling)
7. User clicks "دفع" again after 5 seconds

Expected Result:
Idempotency key prevents second charge. Only one charge of 250 SAR.

Actual Result:
Two charges of 250 SAR each (500 SAR total). Invoice shows single payment of 250 SAR but Stripe dashboard shows two successful charges.

Severity: P0
Priority: P0
Frequency: Sometimes (intermittent network issues)
Regression: Yes - worked in v1.2.0
```

**Example 2 - P2 UI Bug:**

```
Title: P2 Appointments - Time Slot Selection Broken on Mobile Safari

Environment:
- URL: https://almokhtabar.com/ar/appointments/book
- Device: iPhone 15 Pro / iOS 17.5 / Safari
- Viewport: 390x844
- User Role: Patient
- Locale: ar-SA
- App Version: v1.3.0-rc.1

Steps to Reproduce:
1. Open booking page on iPhone Safari
2. Select branch "الرياض - فرع ١"
3. Select "فحص شامل" package
4. Tap date field to open date picker
5. Select a date
6. Scroll to time slot list
7. Tap on an available time slot

Expected Result:
Time slot highlights as selected, "تأكيد الحجز" button becomes enabled.

Actual Result:
Time slot highlights briefly (200ms) then unhighlights. Tapping multiple times sometimes works after 5+ attempts.

Screenshots: [attached]
Console Errors: "TypeError: Cannot read properties of undefined (reading 'map')" at TimeSlotPicker.tsx:143

Severity: P2
Priority: P2
Frequency: Always
Regression: Unknown (new feature in v1.3.0)
```

---

## 3. Bug Triage Process

### 3.1 Daily Triage Meeting

| Aspect | Detail |
|---|---|
| **Schedule** | Daily, 15 minutes, 9:00 AM AST |
| **Attendees** | QA Lead, Engineering Lead, Product Owner (optional), relevant devs |
| **Format** | Standup style, review new bugs in priority order |
| **Board** | Jira filter: `project = ALMOKH AND status = New AND created >= -24h` |
| **Goal** | Assign severity, priority, and owner for each new bug |

### 3.2 Triage Decision Flow

```
                    ┌─────────────────────┐
                    │   New Bug Reported   │
                    │   (Status = New)     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Can reproduce?     │
                    └──────┬──────┬───────┘
                           │      │
                       Yes │      │ No
                           │      │
              ┌────────────▼┐  ┌──▼──────────────┐
              │ Set severity │  │ More info needed│
              │ Set priority │  │ Status = Awaiting│
              │ Assign owner │  │ Reply           │
              │ Status =     │  └──┬──────────────┘
              │ Triaged      │     │
              └──────────────┘     │ (reporter responds)
                                   │
                          ┌────────▼────────┐
                          │  Can reproduce? │
                          └────┬──────┬─────┘
                               │      │
                           Yes │      │ No
                               │      │
                      ┌────────▼┐  ┌──▼──────────┐
                      │ Triaged │  │ Close as    │
                      └─────────┘  │ "Cannot     │
                                   │ Reproduce"  │
                                   └─────────────┘
```

### 3.3 Triage Criteria

| Criteria | Decision |
|---|---|
| **Security vulnerability** | Immediate escalation to Security Lead. Status stays at P0 until fixed. |
| **Data loss or corruption** | Automatic P0. Engineering Lead notified immediately (bypass triage). |
| **Payment issue** | Automatic P1 minimum. Payment team lead assigned. |
| **PHI exposure** | Automatic P0. Compliance Officer and Security Lead notified immediately. |
| **UI/UX issue** | Severity based on impact. P2 if workaround exists, P1 if blocks flow. |
| **Performance regression** | Compare to baseline. P2 if > 10% regression, P1 if > 20%. |
| **Accessibility issue** | P1 if WCAG A violation, P2 if WCAG AA violation. |
| **Documentation issue** | P3 minimum. P2 if it causes incorrect system usage. |

---

## 4. Bug Lifecycle

### 4.1 State Transitions

```
                  ┌──────────────────────────────────────┐
                  │                                      │
                  ▼                                      │
┌──────┐   ┌─────────┐   ┌──────────┐   ┌────────────┐  │
│  New │──▶│ Triaged │──▶│ Assigned │──▶│ In Progress│  │
└──┬───┘   └─────────┘   └──────────┘   └──────┬─────┘  │
   │                                            │        │
   │  ┌───────────┐                              │        │
   ├──▶ Duplicate │──▶ Closed                    │        │
   │  └───────────┘                              │        │
   │                                             │        │
   │  ┌──────────────┐                           │        │
   ├──▶ Won't Fix    │──▶ Closed                  │        │
   │  └──────────────┘                           │        │
   │                                             │        │
   │  ┌──────────────────┐                       │        │
   └──▶ Cannot Reproduce │──▶ Closed              │        │
      └──────────────────┘                       │        │
                                        ┌────────▼───────┐
                                        │     Fixed      │
                                        │ (PR submitted) │
                                        └────────┬───────┘
                                                 │
                                        ┌────────▼───────┐
                                        │   Verified     │
                                        │ (QA on staging)│
                                        └──┬────────┬────┘
                                           │        │
                                       Pass │        │ Fail
                                           │        │
                                    ┌──────▼┐  ┌────▼──────┐
                                    │ Closed│  │ Reopened  │
                                    │       │  │ (-> In    │
                                    │       │  │  Progress)│
                                    └───────┘  └───────────┘
```

### 4.2 Lifecycle Responsibilities

| State | Owner | Action |
|---|---|---|
| **New** | Reporter | Submit bug with complete information |
| **Triaged** | QA Lead | Assign severity, priority, and owner |
| **Assigned** | Developer | Review, request more info if needed, add to sprint |
| **In Progress** | Developer | Create fix branch, write/update tests, submit PR |
| **Fixed** | Developer | PR approved and merged, link fix commit to bug |
| **Verified** | QA Engineer | Deploy fix to staging, execute test case, confirm fix |
| **Closed** | QA Lead | Confirm fix in production monitoring window |
| **Reopened** | Reporter/QA | If issue recurs or fix is incomplete, move back to In Progress |

### 4.3 Bug Rejection Reasons

| Resolution | Description | Who Decides |
|---|---|---|
| **Duplicate** | Already reported in existing issue | Triage team |
| **Won't Fix** | Out of scope, not a bug, or by design decision | Product Owner |
| **Cannot Reproduce** | Unable to reproduce with provided steps | QA Lead |
| **Not a Bug** | Works as designed/intended | Product Owner |
| **Deferred** | Valid bug but deferred to future release | Product Owner + Eng Lead |

---

## 5. Bug SLAs

### 5.1 Response and Fix SLAs

| Severity | Initial Response | Root Cause Identified | Fix Deployed | Communication Cadence |
|---|---|---|---|---|
| **P0 - Critical** | < 30 minutes | < 2 hours | < 4 hours | Every 30 min during incident |
| **P1 - High** | < 2 hours | < 12 hours | < 24 hours | Daily status update |
| **P2 - Medium** | < 8 hours | < 48 hours | < 72 hours | Per sprint |
| **P3 - Low** | < 1 sprint | < 2 sprints | < 2 sprints | Per sprint |
| **P4 - Trivial** | Backlog | Next quarter | Next quarter | Quarterly review |

### 5.2 SLA Escalation

| Breach Level | Escalation | Action |
|---|---|---|
| **First breach** | Team Lead notified | Resource reallocation discussion |
| **Second breach** | Engineering Lead notified | Sprint priority adjustment |
| **Third breach** | VP Engineering notified | Blocker escalation, potential hotfix |
| **P0 SLA breach** | Automatic escalation to CTO | War room, all-hands response |

### 5.3 SLA Monitoring

| Metric | Tool | Alert |
|---|---|---|
| Response time SLA breach | Jira automation | Slack #sla-breaches |
| Fix time SLA breach | Jira automation | Slack #sla-breaches |
| Untriaged bugs > 24h | Jira dashboard | Daily triage reminder |
| P0 count > 3 open | Datadog + Jira | PagerDuty to QA Lead |

---

## 6. Bug Severity vs. Priority Matrix

| | P0 Blocker | P1 High | P2 Medium | P3 Low |
|---|---|---|---|---|
| **P0 Critical** | System down, data loss, security breach | Major feature broken, no workaround | N/A | N/A |
| **P1 High** | N/A | Core feature broken, workaround complex | Feature partially broken | N/A |
| **P2 Medium** | N/A | N/A | Minor feature issue, workaround exists | Cosmetic issue |
| **P3 Low** | N/A | N/A | N/A | Minor cosmetic, typo |
| **P4 Trivial** | N/A | N/A | N/A | Enhancement request |

---

## 7. Bug Tracking Tools

| Tool | Purpose | URL |
|---|---|---|
| **Jira** | Bug tracking, workflow, sprint planning | https://almokhtabar.atlassian.net |
| **Qase / Zephyr** | Test case management, bug-test linkage | https://app.qase.io |
| **Sentry** | Error tracking, session replay, performance | https://sentry.io |
| **Datadog** | APM, monitoring, alerting | https://app.datadoghq.com |
| **Slack** | Notifications, alerts, communication | #bugs channel |
| **PagerDuty** | Incident management, on-call scheduling | https://pagerduty.com |
| **Confluence** | Bug report documentation, post-mortems | https://almokhtabar.atlassian.net/wiki |

---

## 8. Post-Mortem Process

### 8.1 When to Conduct

A post-mortem is required for:
- All P0 production incidents
- Any P1 incident that lasted > 2 hours
- Any security incident involving PHI
- Any incident that resulted in customer data loss
- Any incident with significant business impact (revenue, reputation)

### 8.2 Post-Mortem Template

```
# Incident Post-Mortem

## Incident Overview
- **Incident ID:** INC-[YYYY]-[NNN]
- **Date:** YYYY-MM-DD
- **Duration:** [Start] - [End] (X hours X minutes)
- **Severity:** P[0/1]
- **Impact:** [Number of affected users, revenue impact, data impact]
- **Services Affected:** [List of affected services/modules]

## Timeline
| Time (AST) | Event |
|---|---|
| HH:MM | [First symptom detected] |
| HH:MM | [Alert triggered] |
| HH:MM | [Engineer acknowledged] |
| HH:MM | [Root cause identified] |
| HH:MM | [Fix deployed] |
| HH:MM | [Service restored] |

## Root Cause Analysis
- **Primary Cause:** [Technical root cause]
- **Trigger:** [What triggered the issue]
- **Contributing Factors:** [Config issues, missing tests, monitoring gaps]

## Detection
- **How was it detected?** [Alert / User report / Monitoring]
- **Time to detect:** [Minutes from occurrence to alert]
- **Could it have been detected faster?** [Yes/No - explain]

## Response
- **Time to respond:** [Minutes from alert to action]
- **Time to mitigate:** [Minutes from action to fix]
- **What went well in the response?**
- **What could be improved in the response?**

## Resolution
- **Immediate fix:** [What was done to resolve]
- **Long-term fix:** [What permanent changes are needed]

## Action Items
| Action | Owner | Due Date | Jira Ticket |
|---|---|---|---|
| [Action] | [Owner] | [Date] | [Link] |
| [Action] | [Owner] | [Date] | [Link] |

## Prevention
- [ ] Monitoring/alerts added
- [ ] Tests added to prevent regression
- [ ] Runbook updated
- [ ] Team notified/trained
- [ ] Stakeholder communication completed

## Lessons Learned
1. [Lesson 1]
2. [Lesson 2]
3. [Lesson 3]

## Signatures
- **Incident Commander:** [Name]
- **Engineering Lead:** [Name]
- **QA Lead:** [Name]
```

### 8.3 Post-Mortem SLA

| Activity | Deadline |
|---|---|
| Draft post-mortem created | Within 24 hours of incident resolution |
| Root cause determined | Within 48 hours |
| Action items assigned | Within 48 hours |
| Post-mortem reviewed by team | Within 1 week |
| Action items completed | Within 2 sprints |

---

## Appendix A: Bug Report Field Definitions

| Field | Definition | Values |
|---|---|---|
| **Severity** | Technical impact of the bug | P0-Critical, P1-High, P2-Medium, P3-Low, P4-Trivial |
| **Priority** | Business urgency to fix | P0-Blocker, P1-High, P2-Medium, P3-Low |
| **Frequency** | How often the bug occurs | Always, Often, Sometimes, Rarely, Once |
| **Regression** | Whether this is a regression | Yes, No, Unknown |
| **Environment** | Where the bug was found | Production, Staging, Dev, Preview |
| **Component** | Affected module/component | Auth, Appointments, Results, Payments, etc. |
| **Labels** | Categorization tags | security, performance, accessibility, i18n, mobile |

## Appendix B: Bug Report Hotkeys & Shortcuts

| Action | Shortcut | Context |
|---|---|---|
| Report a bug | `Ctrl + Shift + B` | Anywhere in app (QA roles) |
| Take screenshot | `Ctrl + Shift + S` | Bug report modal open |
| Start recording | `Ctrl + Shift + R` | Bug report modal open |
| Open Jira quickly | `g + i` | Internal tools |
| Submit with auto-capture | `Ctrl + Enter` | Bug report modal open |
