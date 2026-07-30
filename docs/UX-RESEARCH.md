# AL MOKHTABAR — Complete UX Research & Experience Design

> **Document Version:** 1.0  
> **Date:** July 2026  
> **Scope:** Full platform UX across 7 user roles  
> **Principle:** Speed · Clarity · Trust

---

## Table of Contents

1. [User Roles & Personas](#1-user-roles--personas)
2. [Sitemap](#2-sitemap)
3. [Information Architecture](#3-information-architecture)
4. [Navigation Hierarchy](#4-navigation-hierarchy)
5. [Role-Specific UX](#5-role-specific-ux)
6. [Core User Flows](#6-core-user-flows)
7. [Breadcrumb Strategy](#7-breadcrumb-strategy)
8. [Search Strategy](#8-search-strategy)
9. [Accessibility Framework](#9-accessibility-framework)
10. [Mobile Experience](#10-mobile-experience)
11. [Performance Budget](#11-performance-budget)
12. [Trust Signals](#12-trust-signals)

---

# 1. User Roles & Personas

## 1.1 Patient — "سالم" (Salem)

**Demographics:** 35, employed, tech-savvy, uses phone for most tasks  
**Frequency:** 2-4 times per year  
**Context:** Visits lab during work breaks or weekends

### Goals
- Book appointments quickly without phone calls
- Understand test preparation instructions clearly
- Receive results fast with plain-language explanations
- Pay invoices digitally without visiting the branch
- Track order status in real-time like a delivery
- Share reports with their doctor easily

### Pain Points
- Long wait times at the lab with no visibility into queue position
- Medical jargon in reports they don't understand
- Having to physically pick up printed reports
- Unclear pricing before booking tests
- Forgetting preparation instructions (fasting, etc.)
- Results arriving late with no status updates

### Emotional Journey
```
Anxious (need test) → Relieved (easy booking) → 
Confident (clear instructions) → Impatient (waiting) → 
Reassured (real-time updates) → Satisfied (clear results) → 
Empowered (understands health data)
```

---

## 1.2 Doctor — "د. سارة" (Dr. Sarah)

**Demographics:** 42, specialist, manages 30+ patients/day  
**Frequency:** Daily  
**Context:** Orders tests between patient consultations

### Goals
- Order tests for patients in < 2 minutes
- Access results immediately when available
- Compare current results with historical data
- Identify critical values instantly
- Integrate lab data into patient records
- Track pending orders across all patients

### Pain Points
- Switching between multiple systems to order and view results
- Waiting for faxed/emailed reports
- Difficulty comparing results across time periods
- No alert system for critical values
- Manual entry of test results into patient records
- Unclear which lab handles which tests

### Emotional Journey
```
Focused (seeing patient) → Efficient (quick ordering) → 
Alert (critical value notification) → Informed (comprehensive view) → 
Confident (decision supported) → Complete (patient record updated)
```

---

## 1.3 Receptionist — "منى" (Mona)

**Demographics:** 28, customer-facing, multitasks constantly  
**Frequency:** All day, every day  
**Context:** Front desk at branch, first point of contact

### Goals
- Register new patients in < 3 minutes
- Check in arriving patients instantly
- Print labels and route samples correctly
- Handle payments and insurance verification
- Manage the appointment schedule
- Answer patient queries about status and pricing

### Pain Points
- Duplicate patient records from manual entry
- Insurance eligibility checks take too long
- Queue management with no real-time visibility
- Balancing phone calls with walk-in patients
- Payment reconciliation errors
- System downtime during peak hours

### Emotional Journey
```
Overwhelmed (morning rush) → Organized (system organized) → 
Efficient (quick check-ins) → Stressed (peak time) → 
Supported (system handles flow) → Accomplished (day complete)
```

---

## 1.4 Laboratory Technician — "خالد" (Khaled)

**Demographics:** 30, detail-oriented, works in shifts  
**Frequency:** All day, processing samples  
**Context:** Lab bench, processing and analyzing samples

### Goals
- See incoming samples queue prioritized by urgency
- Access test protocols quickly
- Record results accurately with validation
- Flag abnormal values immediately
- Track sample chain of custody
- Complete batch processing efficiently

### Pain Points
- Illegible handwritten labels
- Missing or incomplete sample information
- No priority indicator for urgent samples
- Manual data entry leading to transcription errors
- Difficulty tracking which samples need re-testing
- Equipment downtime without warning

### Emotional Journey
```
Prepared (shift start) → Methodical (processing samples) → 
Focused (detailed analysis) → Alert (abnormal finding) → 
Confident (verified result) → Efficient (batch complete)
```

---

## 1.5 Branch Manager — "عبدالله" (Abdullah)

**Demographics:** 45, manages operations + staff  
**Frequency:** Daily, monitors metrics  
**Context:** Office + floor, oversees branch performance

### Goals
- Monitor branch KPIs (turnaround, throughput, revenue)
- Manage staff schedules and assignments
- Resolve escalated patient issues
- Ensure compliance with regulations
- Optimize resource allocation
- Review and approve reports

### Pain Points
- No real-time dashboard for branch performance
- Difficulty identifying bottlenecks in workflow
- Manual staff scheduling conflicts
- Insurance claim tracking is scattered
- Compliance audit preparation is time-consuming
- No visibility into patient satisfaction metrics

### Emotional Journey
```
Informed (morning review) → Proactive (identifying issues) → 
Decisive (making adjustments) → Supportive (helping team) → 
Accountable (reporting to admin) → Satisfied (metrics met)
```

---

## 1.6 Administrator — "فهد" (Fahd)

**Demographics:** 50, C-level, strategic decisions  
**Frequency:** Daily (analytics), weekly (deep dives)  
**Context:** Executive dashboard, multi-branch oversight

### Goals
- See organization-wide performance at a glance
- Compare branch performance across regions
- Monitor revenue, costs, and profitability
- Track compliance across all branches
- Manage system configuration and users
- Plan growth based on data insights

### Pain Points
- Aggregating data from multiple branches manually
- No single view of financial health
- Difficulty detecting fraud or anomalies
- Compliance gaps discovered too late
- System changes require IT tickets
- No predictive analytics for demand planning

### Emotional Journey
```
Informed (dashboard review) → Analytical (drilling into data) → 
Strategic (planning actions) → Decisive (approving changes) → 
Confident (compliance assured) → Visionary (growth planning)
```

---

## 1.7 Finance Officer — "نورة" (Noura)

**Demographics:** 35, detail-oriented, deadline-driven  
**Frequency:** Daily, peaks at month-end  
**Context:** Finance department, invoicing and collections

### Goals
- Generate and send invoices automatically
- Track payment status across all patients
- Reconcile insurance claims efficiently
- Generate financial reports for management
- Manage payment plans and partial payments
- Follow up on overdue accounts

### Pain Points
- Manual invoice generation is time-consuming
- Insurance claim rejections require manual investigation
- Partial payment tracking is complex
- No automated follow-up for overdue payments
- Reconciliation between systems doesn't match
- Tax compliance (ZATCA) requires manual formatting

### Emotional Journey
```
Organized (morning review) → Methodical (processing invoices) → 
Persistent (following up) → Analytical (reconciling) → 
Accurate (reports complete) → Confident (audit-ready)
```

---

# 2. Sitemap

```
al-mokhtabar.com
│
├── / (Landing Page)
│   ├── /about
│   ├── /services
│   ├── /branches
│   ├── /pricing
│   ├── /faq
│   ├── /contact
│   └── /careers
│
├── /auth
│   ├── /login
│   ├── /register
│   ├── /forgot-password
│   ├── /reset-password
│   ├── /verify-email
│   └── /verify-phone
│
├── /patient (Patient Dashboard)
│   ├── / (Overview)
│   ├── /tests (Test Catalog)
│   │   └── /[test-id] (Test Detail)
│   ├── /book (Booking Flow)
│   │   ├── /select-tests
│   │   ├── /select-branch
│   │   ├── /select-date
│   │   ├── /confirm
│   │   └── /payment
│   ├── /orders
│   │   └── /[order-id] (Order Tracking)
│   ├── /reports
│   │   └── /[report-id] (Report Detail)
│   ├── /appointments
│   │   └── /[appointment-id]
│   ├── /invoices
│   │   └── /[invoice-id]
│   ├── /profile
│   ├── /family (Family Members)
│   ├── /settings
│   └── /notifications
│
├── /doctor (Doctor Dashboard)
│   ├── / (Overview)
│   ├── /patients
│   │   └── /[patient-id] (Patient Profile)
│   ├── /orders
│   │   ├── /new (New Order)
│   │   └── /[order-id]
│   ├── /reports
│   │   ├── /pending (Awaiting Results)
│   │   └── /[report-id]
│   ├── /analytics (Practice Analytics)
│   └── /settings
│
├── /reception (Reception Dashboard)
│   ├── / (Overview + Queue)
│   ├── /checkin (Patient Check-in)
│   ├── /register (New Patient)
│   ├── /queue (Live Queue Management)
│   ├── /appointments (Schedule View)
│   ├── /payments (Payment Processing)
│   ├── /insurance (Insurance Verification)
│   └── /settings
│
├── /technician (Lab Technician Dashboard)
│   ├── / (Overview)
│   ├── /queue (Sample Queue)
│   │   └── /[sample-id] (Process Sample)
│   ├── /results (Enter Results)
│   │   └── /[test-id] (Result Entry)
│   ├── /equipment (Equipment Status)
│   ├── /quality (QC Dashboard)
│   └── /settings
│
├── /manager (Branch Manager Dashboard)
│   ├── / (Branch Overview)
│   ├── /analytics (Branch Analytics)
│   ├── /staff (Staff Management)
│   │   └── /[staff-id]
│   ├── /schedule (Shift Schedule)
│   ├── /performance (KPIs)
│   ├── /compliance (Compliance Checklist)
│   ├── /escalations (Escalated Issues)
│   └── /settings
│
├── /admin (System Administrator)
│   ├── / (Organization Dashboard)
│   ├── /analytics (Org-wide Analytics)
│   ├── /branches
│   │   └── /[branch-id]
│   ├── /users
│   │   └── /[user-id]
│   ├── /tests (Test Management)
│   │   └── /[test-id]
│   ├── /orders (All Orders)
│   ├── /reports (All Reports)
│   ├── /audit (Audit Logs)
│   ├── /integrations (External Systems)
│   ├── /config (System Configuration)
│   └── /settings
│
├── /finance (Finance Dashboard)
│   ├── / (Financial Overview)
│   ├── /invoices
│   │   └── /[invoice-id]
│   ├── /payments (Payment Ledger)
│   ├── /insurance (Insurance Claims)
│   │   └── /[claim-id]
│   ├── /reconciliation (Bank Reconciliation)
│   ├── /reports (Financial Reports)
│   ├── /tax (ZATCA Compliance)
│   └── /settings
│
└── /shared
    ├── /notifications
    ├── /messages
    ├── /help
    └── /legal
        ├── /privacy
        ├── /terms
        └── /consent
```

---

# 3. Information Architecture

## 3.1 Content Priority Matrix

| Priority | Content Type | Rationale |
|----------|-------------|-----------|
| P0 | Login, Dashboard, Core Actions | Must be accessible in < 2 clicks |
| P1 | Test Catalog, Orders, Reports | Primary value drivers |
| P2 | Appointments, Billing, Profile | Supporting workflows |
| P3 | Settings, Help, Analytics | Administrative functions |
| P4 | About, Careers, Legal | Informational, low frequency |

## 3.2 Content Grouping Strategy

**By User Role:**
- Each role gets a dedicated dashboard with role-specific navigation
- Shared components (notifications, profile, help) are consistent across all roles
- Cross-role features (test catalog, reports) use the same underlying data

**By Workflow Phase:**
1. **Discovery** → Landing, Services, Pricing
2. **Onboarding** → Register, Profile Setup
3. **Transaction** → Book, Order, Pay
4. **Monitoring** → Track, Queue, Status
5. **Result** → Reports, Downloads, Sharing
6. **Follow-up** → Re-book, Share, Analyze

## 3.3 Data Model (UX Perspective)

```
Patient
├── Profile (name, DOB, insurance, contacts)
├── Family Members (linked accounts)
├── Orders (past + active)
│   ├── Tests (selected)
│   ├── Samples (collected)
│   ├── Results (analyzed)
│   └── Reports (generated)
├── Appointments (scheduled)
├── Invoices (billing)
├── Notifications (history)
└── Preferences (language, notifications)

Doctor
├── Profile (specialty, license)
├── Patients (assigned)
├── Orders (placed)
├── Reports (received)
└── Analytics (practice insights)

Branch
├── Staff (assigned)
├── Equipment (inventory)
├── Queue (real-time)
├── Performance (KPIs)
└── Compliance (status)
```

---

# 4. Navigation Hierarchy

## 4.1 Primary Navigation (Sidebar)

**Role-specific, persistent, collapsible**

```
┌─────────────────────────────────┐
│  Logo + Branch Name             │
│  [Branch Selector ▼]            │
├─────────────────────────────────┤
│  🏠 لوحة التحكم (Dashboard)     │
│  ─────────────────────────────  │
│  📋 [Role-specific items]       │
│     • Patient: Tests, Orders... │
│     • Doctor: Patients, Orders..│
│     • Tech: Queue, Results...   │
│  ─────────────────────────────  │
│  📊 Analytics                   │
│  👥 [Team/Users]                │
│  ⚙️ الإعدادات (Settings)        │
├─────────────────────────────────┤
│  👤 Profile                     │
│  🔔 Notifications [badge]       │
│  🌐 Language Toggle             │
│  🚪 Logout                      │
└─────────────────────────────────┘
```

## 4.2 Secondary Navigation (Tabs)

**Page-level, within content area**

```
┌─────────────────────────────────┐
│  Page Title                     │
├─────────────────────────────────┤
│  [Tab 1] [Tab 2] [Tab 3] [+]  │
├─────────────────────────────────┤
│  Content Area                   │
│                                 │
│                                 │
└─────────────────────────────────┘
```

## 4.3 Tertiary Navigation (Filters/Actions)

**Within-table or within-card**

```
┌─────────────────────────────────┐
│  Section Title    [Filter ▼]    │
│  ─────────────────────────────  │
│  [Status Pills] [Search] [Sort] │
├─────────────────────────────────┤
│  Data / Content                 │
└─────────────────────────────────┘
```

## 4.4 Responsive Navigation Behavior

| Breakpoint | Sidebar | Header | Mobile Nav |
|------------|---------|--------|------------|
| Desktop (≥1280px) | Fixed, expanded | Search + actions | — |
| Laptop (≥1024px) | Collapsible | Search + actions | — |
| Tablet (≥768px) | Hidden (overlay) | Hamburger + search | — |
| Mobile (<768px) | Hidden (overlay) | Hamburger + logo | Bottom tabs |

---

# 5. Role-Specific UX

## 5.1 Patient Dashboard

### Wireframe Structure
```
┌────────────────────────────────────────────┐
│  Header: Search | Notifications | Profile  │
├────────────────────────────────────────────┤
│                                            │
│  Welcome Banner                            │
│  "مرحباً سالم" | Last visit: 2 weeks ago  │
│                                            │
├─────────────┬─────────────┬────────────────┤
│  Stat Card  │  Stat Card  │  Stat Card    │
│  Pending    │  Reports    │  Appointments │
│  Orders: 2  │  Total: 12  │  Next: Jul 28 │
├─────────────┴─────────────┴────────────────┤
│                                            │
│  Quick Actions Grid                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │ Book │ │Tests │ │Pay   │ │Share │     │
│  │New   │ │Browse│ │Bill  │ │Report│     │
│  └──────┘ └──────┘ └──────┘ └──────┘     │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Recent Activity Timeline                  │
│  ─ Jul 25: Report ready (CBC)             │
│  ─ Jul 20: Sample collected               │
│  ─ Jul 18: Appointment booked             │
│  ─ Jul 15: Payment processed              │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Upcoming                                  │
│  ┌─────────────────────────────────────┐  │
│  │ 📅 Appointment: Jul 28, 9:00 AM    │  │
│  │    Branch: Riyadh Main              │  │
│  │    [View Details] [Reschedule]      │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │ 💳 Invoice Due: SAR 450            │  │
│  │    Due: Aug 1                      │  │
│  │    [Pay Now] [View]                │  │
│  └─────────────────────────────────────┘  │
│                                            │
├────────────────────────────────────────────┤
│  Mobile Bottom Nav: Home | Tests | Orders  │
│                      Reports | Profile     │
└────────────────────────────────────────────┘
```

### Navigation Map
```
Dashboard
├── Quick Book (→ Booking Flow)
├── My Orders
│   └── Order Detail (→ Tracking View)
├── My Reports
│   └── Report Detail (→ Results + AI)
├── Appointments
│   └── Book / Reschedule / Cancel
├── Invoices
│   └── Invoice Detail → Payment Flow
├── Test Catalog
│   └── Test Detail → Add to Cart → Book
├── Profile & Settings
└── Family Members
    └── Switch Account / Manage
```

### Key Actions (Priority Order)
1. **Book Appointment** — Largest CTA, always visible
2. **View Latest Report** — Card at top of dashboard
3. **Pay Outstanding Invoice** — Banner if unpaid
4. **Track Active Order** — Progress indicator
5. **Download/Share Report** — On report detail

### Mobile Experience
- **Bottom Navigation:** 5 tabs (Home, Tests, Orders, Reports, Profile)
- **Pull to Refresh** on all list views
- **Swipe Actions:** Swipe order left to track, right to share
- **Bottom Sheet** for quick actions (pay, download, share)
- **Push Notifications** for results, reminders, payments

---

## 5.2 Doctor Dashboard

### Wireframe Structure
```
┌────────────────────────────────────────────┐
│  Header: Search Patient | Alerts | Profile │
├────────────────────────────────────────────┤
│                                            │
│  Stats Bar                                 │
│  Patients Today: 24 | Pending: 8 |         │
│  Critical: 1 | Reports Ready: 5           │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  ⚠️ Critical Alert Banner                  │
│  "1 critical result requires attention"    │
│  [View Now]                                │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Patient Search                            │
│  ┌─────────────────────────────────────┐  │
│  │ 🔍 Search by name, ID, or phone... │  │
│  └─────────────────────────────────────┘  │
│  Recent: Ahmed M. | Fatima A. | Khalid S. │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Pending Orders (sorted by urgency)        │
│  ┌─────────────────────────────────────┐  │
│  │ 🔴 ORD-005 — Abdullah — Urgent      │  │
│  │    CBC, ESR, CRP — Pending          │  │
│  │    [View] [Order More]              │  │
│  ├─────────────────────────────────────┤  │
│  │ 🟡 ORD-002 — Fatima — Normal        │  │
│  │    TSH, Free T4 — In Progress       │  │
│  │    [View] [Order More]              │  │
│  └─────────────────────────────────────┘  │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Recent Reports                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │RPT-1 │ │RPT-2 │ │RPT-3 │ │RPT-4 │     │
│  │CBC ✓ │ │TSH ⚠ │ │Lipid │ │HbA1c │     │
│  │AI ✓  │ │AI ✓  │ │AI ✓  │ │AI ✓  │     │
│  └──────┘ └──────┘ └──────┘ └──────┘     │
│                                            │
├────────────────────────────────────────────┤
│  Sidebar: Patients | Orders | Reports |   │
│           Analytics | Settings             │
└────────────────────────────────────────────┘
```

### Navigation Map
```
Doctor Dashboard
├── Patient Search → Patient Profile
│   ├── Medical History
│   ├── Past Orders
│   ├── Past Reports (with comparison)
│   └── New Order (→ Order Flow)
├── New Order
│   ├── Select Patient
│   ├── Select Tests (with quick-add)
│   ├── Priority / Notes
│   └── Submit → Confirmation
├── Reports
│   ├── Pending (awaiting results)
│   ├── Ready (with AI insights)
│   └── Report Detail
│       ├── Results Table
│       ├── Historical Comparison
│       ├── AI Analysis
│       └── Actions (print, share, annotate)
├── Analytics
│   ├── Tests Ordered (trends)
│   ├── Turnaround Time
│   └── Patient Distribution
└── Settings
```

### Key Actions
1. **Search Patient** — Prominent search bar, always accessible
2. **New Order** — Primary CTA button
3. **View Critical Results** — Red badge/banner, cannot be missed
4. **Compare Results** — Side-by-side historical view
5. **Add Clinical Notes** — Inline annotation on reports

### Mobile Experience
- **Compact patient list** with swipe to order
- **Voice search** for patient lookup
- **Quick-order templates** (common test panels)
- **Push alerts** for critical values (cannot be silenced)
- **Offline access** to recent patient data

---

## 5.3 Receptionist Dashboard

### Wireframe Structure
```
┌────────────────────────────────────────────┐
│  Header: Queue Status | Schedule | Profile │
├────────────────────────────────────────────┤
│                                            │
│  Live Queue Board (large, visible)         │
│  ┌────────┬────────┬────────┬────────┐    │
│  │ Wait:  │ In     │ Sample │ Done   │    │
│  │   5    │ Process│ Collect│ Today  │    │
│  │        │   3    │   2    │  18    │    │
│  └────────┴────────┴────────┴────────┘    │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Quick Actions                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │Check │ │New   │ │Pay   │ │Insur.│     │
│  │In    │ │Reg.  │ │Ment  │ │Check │     │
│  └──────┘ └──────┘ └──────┘ └──────┘     │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Today's Schedule (Timeline View)          │
│  08:00 ████████ Ahmed (CBC)                │
│  08:30 ████████ Fatima (TSH)               │
│  09:00 ████████ [Empty - Available]        │
│  09:30 ████████ Khalid (Full Panel)        │
│  10:00 ████████ [Empty]                    │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Check-in Queue (left-to-right flow)       │
│  ┌─────────────────────────────────────┐  │
│  │ 1. Ahmed — Waiting (2 min)     [→]  │  │
│  │ 2. Fatima — Just arrived       [→]  │  │
│  │ 3. Khalid — Ready for sample   [→]  │  │
│  └─────────────────────────────────────┘  │
│                                            │
├────────────────────────────────────────────┤
│  Sidebar: Queue | Check-in | Register |   │
│           Payments | Insurance | Schedule  │
└────────────────────────────────────────────┘
```

### Navigation Map
```
Reception Dashboard
├── Check-in Flow
│   ├── Search Patient (by name/ID/phone)
│   ├── Verify Identity
│   ├── Confirm Appointment Details
│   ├── Insurance Verification (if applicable)
│   ├── Collect Payment (if needed)
│   ├── Print Label
│   └── → Queue (assigned to technician)
├── New Registration
│   ├── Personal Info
│   ├── Insurance Info
│   ├── Emergency Contact
│   ├── Consent
│   └── → First Appointment
├── Queue Management
│   ├── Live Queue Board
│   ├── Drag to Reorder (priority)
│   ├── Assign to Counter/Technician
│   └── Mark as Complete/No-show
├── Payments
│   ├── Process Payment
│   ├── Issue Receipt
│   └── Insurance Claim
└── Insurance
    ├── Verify Eligibility
    ├── Pre-authorization
    └── Claim Submission
```

### Key Actions
1. **Check-in Patient** — Largest, most frequent action
2. **View Queue** — Real-time, visible from any screen
3. **Process Payment** — Quick access, multiple methods
4. **Register New Patient** — Guided wizard
5. **Print Labels** — One-click after check-in

### Mobile Experience (Tablet-optimized)
- **iPad-first** for counter use
- **Large touch targets** (min 48px)
- **Barcode scanner** integration
- **Split view:** Queue on left, detail on right
- **Receipt printer** direct integration

---

## 5.4 Laboratory Technician Dashboard

### Wireframe Structure
```
┌────────────────────────────────────────────┐
│  Header: Queue Count | Alerts | Profile    │
├────────────────────────────────────────────┤
│                                            │
│  Workstation Status                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │Queue │ │In    │ │QC    │ │Done  │     │
│  │Ready │ │Process│ │Status│ │Today │     │
│  │  12  │ │  3   │ │ ✅   │ │  45  │     │
│  └──────┘ └──────┘ └──────┘ └──────┘     │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Sample Queue (Priority-sorted)            │
│  ┌─────────────────────────────────────┐  │
│  │ 🔴 URGENT: Sample #S-456           │  │
│  │    Patient: Abdullah M.             │  │
│  │    Tests: CBC, ESR, CRP             │  │
│  │    Collected: 09:15                 │  │
│  │    [Start Processing]               │  │
│  ├─────────────────────────────────────┤  │
│  │ 🟡 NORMAL: Sample #S-457           │  │
│  │    Patient: Fatima A.               │  │
│  │    Tests: TSH, Free T4              │  │
│  │    Collected: 09:30                 │  │
│  │    [Start Processing]               │  │
│  └─────────────────────────────────────┘  │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Active Processing                         │
│  Sample #S-455 — Ahmed M. — CBC           │
│  ┌─────────────────────────────────────┐  │
│  │ Step 1: Hematology Analyzer    ✅   │  │
│  │ Step 2: Differential Count     🔄   │  │
│  │ Step 3: Manual Review          ⬜   │  │
│  │ Step 4: Enter Results          ⬜   │  │
│  │                                    │  │
│  │ [Auto-fill from Equipment] [Enter] │  │
│  └─────────────────────────────────────┘  │
│                                            │
├────────────────────────────────────────────┤
│  Sidebar: Queue | Process | Results |     │
│           Equipment | QC | Settings        │
└────────────────────────────────────────────┘
```

### Navigation Map
```
Technician Dashboard
├── Sample Queue
│   ├── Priority Queue (auto-sorted)
│   ├── Filter by test type
│   └── Sample Detail
│       ├── Chain of Custody
│       ├── Processing Steps
│       └── Enter/Verify Results
├── Result Entry
│   ├── Auto-fill from equipment (HL7)
│   ├── Manual entry with validation
│   ├── Reference range comparison
│   ├── Flag abnormal values
│   └── Submit → Review Queue
├── QC Dashboard
│   ├── Daily QC Runs
│   ├── Levey-Jennings Charts
│   ├── Out-of-range Alerts
│   └── Calibration Status
├── Equipment
│   ├── Status Monitor
│   ├── Maintenance Schedule
│   └── Reagent Inventory
└── Settings
```

### Key Actions
1. **Accept Sample** — Scan barcode, verify, start
2. **Enter Results** — Auto-fill + manual override
3. **Flag Critical** — One-click, triggers alert chain
4. **QC Check** — Daily routine, visual charts
5. **Equipment Status** — At-a-glance health

### Mobile Experience
- **Barcode scanner** phone integration
- **Large input fields** for gloved hands
- **Voice-to-text** for result entry
- **Minimal navigation** — single-task focus
- **Offline queue** — sync when connected

---

## 5.5 Branch Manager Dashboard

### Wireframe Structure
```
┌────────────────────────────────────────────┐
│  Header: Branch Name | Date Range | Profile│
├────────────────────────────────────────────┤
│                                            │
│  Branch Health Score: 87/100               │
│  ████████████████████░░░ (Good)            │
│                                            │
├─────────────┬─────────────┬────────────────┤
│  Revenue    │  Patients   │  Avg TAT      │
│  SAR 45,200 │  Today: 32  │  2.3 hours    │
│  ↑ 12%     │  ↑ 8%       │  ↓ 15%       │
├─────────────┴─────────────┴────────────────┤
│                                            │
│  Real-time Operations Board                │
│  ┌─────────────────────────────────────┐  │
│  │ Reception: ✅ 2 staff active        │  │
│  │ Lab: ⚠️ 1 equipment alert           │  │
│  │ Collection: ✅ Queue: 3 patients    │  │
│  │ Report Review: 🔴 5 pending         │  │
│  └─────────────────────────────────────┘  │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Staff Status                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │Recep.│ │Tech. │ │Phlebo│ │Admin │     │
│  │ 2/2  │ │ 3/3  │ │ 1/2  │ │ 1/1  │     │
│  │ ✅   │ │ ⚠️   │ │ 🟡   │ │ ✅   │     │
│  └──────┘ └──────┘ └──────┘ └──────┘     │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Today's Performance Chart                 │
│  [Bar chart: hourly patient throughput]    │
│                                            │
├────────────────────────────────────────────┤
│  Sidebar: Overview | Analytics | Staff |   │
│           Schedule | Compliance | Settings │
└────────────────────────────────────────────┘
```

### Navigation Map
```
Manager Dashboard
├── Branch Overview (this page)
├── Analytics
│   ├── Revenue & Financial
│   ├── Patient Volume
│   ├── Turnaround Time
│   ├── Staff Performance
│   └── Patient Satisfaction
├── Staff Management
│   ├── Roster / Schedule
│   ├── Individual Performance
│   ├── Training Status
│   └── Assign / Reassign
├── Queue Management
│   ├── Live Queue Override
│   ├── Capacity Planning
│   └── Bottleneck Analysis
├── Compliance
│   ├── Audit Readiness Score
│   ├── Document Expiry Tracker
│   ├── Training Compliance
│   └── Equipment Certifications
├── Escalations
│   ├── Patient Complaints
│   ├── Equipment Issues
│   ├── Staff Issues
│   └── Compliance Gaps
└── Settings (branch-specific)
```

### Key Actions
1. **Monitor Live Operations** — Dashboard with real-time data
2. **Reassign Staff** — Drag from one queue to another
3. **Handle Escalation** — One-click to see and resolve
4. **Review Compliance** — Checklist with due dates
5. **Generate Reports** — Export for management

### Mobile Experience
- **Read-only dashboard** for on-the-go monitoring
- **Push alerts** for escalations and equipment issues
- **Quick approve/reject** for pending actions
- **Minimal data entry** — use desktop for that

---

## 5.6 System Administrator Dashboard

### Wireframe Structure
```
┌────────────────────────────────────────────┐
│  Header: Organization | System Health |    │
│          Audit Log | Profile               │
├────────────────────────────────────────────┤
│                                            │
│  System Health                             │
│  ┌─────────────────────────────────────┐  │
│  │ API: ✅ 99.9% uptime              │  │
│  │ DB: ✅ 45ms avg response           │  │
│  │ Cache: ✅ Redis connected           │  │
│  │ Queue: ✅ BullMQ processing         │  │
│  │ Storage: ⚠️ 78% capacity            │  │
│  └─────────────────────────────────────┘  │
│                                            │
├─────────────┬─────────────┬────────────────┤
│  Revenue    │  All Branches│  Active Users │
│  SAR 1.2M   │     3        │     45       │
│  ↑ 15%     │  All healthy │  ↑ 5 this wk │
├─────────────┴─────────────┴────────────────┤
│                                            │
│  Branch Comparison                         │
│  [Table: Branch | Revenue | Patients | TAT │
│   | Satisfaction | Status]                 │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Recent System Events                      │
│  ─ User created: tech3@almokhtabar.com    │
│  ─ Config updated: TAT threshold          │
│  ─ Integration: ZATCA sync completed      │
│  ─ Alert: Storage 78% capacity            │
│                                            │
├────────────────────────────────────────────┤
│  Sidebar: Dashboard | Analytics | Branches │
│           Users | Tests | Orders | Reports │
│           Audit | Integrations | Settings  │
└────────────────────────────────────────────┘
```

### Key Actions
1. **System Health Monitor** — Always visible
2. **User Management** — CRUD with RBAC
3. **Configuration** — System-wide settings
4. **Audit Trail** — Searchable, filterable
5. **Integration Management** — Connect/disconnect services

---

## 5.7 Finance Officer Dashboard

### Wireframe Structure
```
┌────────────────────────────────────────────┐
│  Header: Period Selector | Alerts | Profile│
├────────────────────────────────────────────┤
│                                            │
│  Financial Health                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │Revenue│ │Out-  │ │Overdue│ │Claims│     │
│  │      │ │standing│ │     │ │Pending│    │
│  │SAR  │ │SAR   │ │SAR  │ │SAR   │     │
│  │180K │ │23K   │ │8K   │ │45K   │     │
│  └──────┘ └──────┘ └──────┘ └──────┘     │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Collection Rate: 87% ████████████░░       │
│  Insurance Claim Rate: 92% █████████████░  │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Overdue Invoices (Auto-sorted)            │
│  ┌─────────────────────────────────────┐  │
│  │ 🔴 INV-008 — SAR 850 — 15 days     │  │
│  │    Ahmed M. — [Send Reminder] [Call]│  │
│  ├─────────────────────────────────────┤  │
│  │ 🟡 INV-012 — SAR 320 — 5 days      │  │
│  │    Fatima A. — [Send Reminder]      │  │
│  └─────────────────────────────────────┘  │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Insurance Claims Pipeline                 │
│  Pending: 12 → Processing: 8 →            │
│  Approved: 45 → Rejected: 3               │
│                                            │
├────────────────────────────────────────────┤
│  Sidebar: Overview | Invoices | Payments   │
│           Insurance | Reports | Tax |      │
│           Settings                         │
└────────────────────────────────────────────┘
```

### Key Actions
1. **Invoice Generation** — Batch or individual
2. **Payment Processing** — Record and reconcile
3. **Insurance Claims** — Submit, track, appeal
4. **Follow-up** — Automated reminders
5. **Financial Reports** — P&L, balance sheet, tax

---

# 6. Core User Flows

## 6.1 Booking Flow (Patient)

```
START
  │
  ▼
[Select Tests] ─────────────────────────────┐
  │ Browse catalog                           │
  │ Search by name/category                  │
  │ View test details (prep, price, time)    │
  │ Add to cart                              │
  │                                          │
  ▼                                          │
[Select Branch]                              │
  │ View nearby branches                     │
  │ Check availability                       │
  │ View branch hours & facilities           │
  │                                          │
  ▼                                          │
[Select Date & Time]                         │
  │ Calendar view                            │
  │ Available time slots                     │
  │ Selected tests grouped into appointment  │
  │                                          │
  ▼                                          │
[Review & Confirm]                           │
  │ Summary of tests, branch, date, time     │
  │ Estimated cost                           │
  │ Preparation instructions                 │
  │ Insurance coverage check                 │
  │                                          │
  ▼                                          │
[Payment]                                    │
  │ Select payment method                    │
  │ Card / Apple Pay / STC Pay               │
  │ Apply insurance (if eligible)            │
  │ Confirm payment                          │
  │                                          │
  ▼                                          │
[Confirmation]                               │
  │ Booking reference number                 │
  │ Calendar invite (.ics)                   │
  │ Preparation reminders (notification)     │
  │ SMS + Email confirmation                 │
  │                                          │
  ▼                                          │
END ─────────────────────────────────────────┘
```

**Decision Points:**
- If insurance covers 100% → Skip payment, show "Covered"
- If tests need different branches → Show conflict, suggest alternatives
- If time slot unavailable → Show next available, allow waitlist
- If patient not registered → Redirect to registration, preserve cart

**Error Recovery:**
- Payment fails → Show error, offer retry or alternate method
- Slot taken during booking → Auto-refresh, offer alternatives
- Network error → Save draft, retry when connected

---

## 6.2 Queue Flow (Reception → Technician → Report)

```
Patient Arrives
  │
  ▼
[Check-in] ──── Receptionist scans/enters patient ID
  │              Verify appointment
  │              Insurance check
  │              Print sample labels
  │              Collect payment (if needed)
  │
  ▼
[Queue Entry] ── Patient enters digital queue
  │               Assigned queue number
  │               Estimated wait time
  │               Push notification when ready
  │
  ▼
[Sample Collection] ── Phlebotomist calls patient
  │                     Verify identity (2 factors)
  │                     Collect sample
  │                     Label & log sample
  │                     Confirm in system
  │
  ▼
[Lab Processing] ── Sample arrives at lab
  │                   Technician receives in queue
  │                   Priority auto-assigned
  │                   Process per protocol
  │                   Enter results
  │                   QC check
  │
  ▼
[Result Review] ── Results reviewed
  │                 Auto-flag abnormalities
  │                 AI analysis generated
  │                 Doctor review (if required)
  │                 Final approval
  │
  ▼
[Report Published] ── Report available to patient
  │                    Push notification sent
  │                    Doctor notified
  │                    Available for download/share
  │
  ▼
END
```

**Real-time Visibility:**
- Patient sees: "Waiting" → "With Phlebotomist" → "Processing" → "Complete"
- Each status change triggers a notification
- Estimated completion time updates based on actual progress

---

## 6.3 Result Download Flow

```
Patient Opens Report
  │
  ▼
[Report Detail View]
  │ Full results table
  │ Reference ranges
  │ AI insights summary
  │ Historical comparison
  │
  ├──→ [Download PDF]
  │      │ Official branded PDF
  │      │ Includes all results + ranges
  │      │ AI insights section
  │      │ QR code for verification
  │      │
  │      ▼
  │    [Share Options]
  │      ├── Save to device
  │      ├── Email to self
  │      ├── Email to doctor
  │      ├── Share via WhatsApp
  │      └── Print
  │
  ├──→ [Share with Doctor]
  │      │ Select doctor from list
  │      │ Or enter doctor's email
  │      │ Add message (optional)
  │      │ Send → Confirmation
  │
  └──→ [Request Physical Copy]
         │ Select delivery method
         │ ├── Pick up from branch
         │ └── Home delivery (SAR 15)
         │ Confirm → Processing
```

---

## 6.4 Emergency Flow (Critical Result)

```
Critical Value Detected
  │ (Auto-detected by system or flagged by technician)
  │
  ▼
[Immediate Alert Chain]
  │
  ├──→ Technician: "Critical value flagged, please review"
  │
  ├──→ Doctor: PUSH NOTIFICATION + SMS + IN-APP BANNER
  │    "⚠️ CRITICAL: Patient Abdullah M. - HGB: 5.2 g/dL"
  │    [View Report] [Call Patient] [Order Re-test]
  │
  ├──→ Branch Manager: Alert logged
  │
  └──→ System: Auto-logs critical event
         Timestamp, who flagged, who acknowledged
  │
  ▼
[Doctor Reviews]
  │ Verify result
  │ Order confirmation test (if needed)
  │ Contact patient immediately
  │ Document clinical decision
  │
  ▼
[Patient Notification]
  │ "Your result requires immediate medical attention"
  │ "Please contact your doctor or visit the nearest ER"
  │ Doctor's contact information included
  │
  ▼
[Audit Trail]
  │ Complete log of:
  │ - When result was flagged
  │ - When doctor was notified
  │ - When doctor acknowledged
  │ - Clinical action taken
  │ - Patient was contacted
  │ Compliance: 100% traceable
```

**SLA:**
- Critical value → Doctor notification: < 5 minutes
- Doctor acknowledgment: < 15 minutes
- Patient contact: < 30 minutes
- Full audit trail: Real-time

---

## 6.5 Insurance Verification Flow

```
Patient Presents Insurance
  │
  ▼
[Scan/Enter Insurance ID]
  │ National ID or insurance card
  │
  ▼
[Real-time Verification]
  │ API call to insurance provider
  │ Check:
  │ ├── Coverage active?
  │ ├── Lab tests covered?
  │ ├── Pre-authorization needed?
  │ ├── Co-pay amount?
  │ └── Remaining limit?
  │
  ├──→ [Fully Covered]
  │      │ Show: "100% covered by insurance"
  │      │ No patient payment needed
  │      │ → Proceed to check-in
  │
  ├──→ [Partially Covered]
  │      │ Show: "Insurance covers SAR X"
  │      │ "Patient co-pay: SAR Y"
  │      │ Collect co-pay
  │      │ → Proceed to check-in
  │
  ├──→ [Pre-authorization Required]
  │      │ Submit pre-auth request
  │      │ Wait for approval (async)
  │      │ Notify when approved
  │      │ → Queue until approved
  │
  └──→ [Not Covered / Invalid]
         │ Show: "Insurance not valid for this test"
         │ Offer full payment option
         │ Provide alternative insurance check
         │ → Self-pay or reschedule
```

---

# 7. Breadcrumb Strategy

## 7.1 Structure

```
Home > Section > Sub-section > Page > Detail
```

**Example paths:**
```
Patient:
  لوحة التحكم > طلباتي > طلب #ORD-001 > تفاصيل العينات
  Dashboard > My Orders > Order #ORD-001 > Sample Details

Doctor:
  لوحة التحكم > المرضى > سالم أحمد > التقارير > تقرير #RPT-001
  Dashboard > Patients > Salem Ahmed > Reports > Report #RPT-001

Admin:
  لوحة التحكم > المستخدمون > سارة الأحمد > الصلاحيات
  Dashboard > Users > Sarah Ahmad > Permissions
```

## 7.2 Rules

1. **Always show** the first 2 levels (Home > Section)
2. **Collapsible** middle levels on mobile (show `...`)
3. **Clickable** except the last item (current page)
4. **RTL-aware** — breadcrumbs flow right-to-left
5. **Dynamic** — reflect actual navigation path, not URL

## 7.3 Mobile Behavior

```
Desktop:  لوحة التحكم > طلباتي > طلب #ORD-001 > تفاصيل العينات
Mobile:   ... > طلب #ORD-001 > تفاصيل العينات
```

- Middle items collapse into `...`
- Tapping `...` expands full breadcrumb as bottom sheet
- First item always accessible (Home/Dashboard)

---

# 8. Search Strategy

## 8.1 Global Search (Command Palette)

**Trigger:** `Cmd/Ctrl + K` or search icon in header

```
┌─────────────────────────────────────────┐
│ 🔍 ابحث عن أي شيء...                  │
├─────────────────────────────────────────┤
│  Recent Searches                        │
│  ─ CBC test                             │
│  ─ Ahmed patient                        │
│  ─ Vitamin D price                      │
├─────────────────────────────────────────┤
│  Quick Actions                          │
│  ─ حجز موعد جديد (New Appointment)     │
│  ─ إضافة مريض (Add Patient)            │
│  ─ إنشاء طلب (Create Order)            │
├─────────────────────────────────────────┤
│  Results (as you type)                  │
│  Patients:                              │
│  ─ أحمد محمد (P001)                    │
│  ─ فاطمة علي (P002)                    │
│  Tests:                                 │
│  ─ Complete Blood Count                 │
│  ─ Lipid Profile                        │
│  Orders:                                │
│  ─ ORD-2026-001                         │
└─────────────────────────────────────────┘
```

## 8.2 Contextual Search

**Within specific pages:**

| Page | Search Scope | Results |
|------|-------------|---------|
| Test Catalog | Test name, category | Test cards |
| Orders | Order ID, patient name | Order list |
| Reports | Report ID, test name | Report list |
| Patients | Name, ID, phone, email | Patient cards |
| Invoices | Invoice ID, patient | Invoice list |

## 8.3 Search Rules

1. **Min 2 characters** to trigger search
2. **Debounce 300ms** — don't search on every keystroke
3. **RTL-aware** — search works correctly in Arabic
4. **Fuzzy matching** — "كبيسي" matches "كاملة"
5. **Recent searches** persisted per user
6. **Keyboard navigation** — arrows + Enter
7. **No results state** — suggest alternatives
8. **Voice search** on mobile (where supported)

---

# 9. Accessibility Framework

## 9.1 WCAG 2.1 AA Compliance

### Color & Contrast
- **Text contrast ratio:** Minimum 4.5:1 (normal text), 3:1 (large text)
- **Focus indicators:** 3px solid brand-500 ring, always visible
- **Color not sole indicator:** Every status uses icon + color + text
- **Dark mode:** Full support with adjusted contrast ratios

### Keyboard Navigation
- **Tab order:** Logical, follows visual flow
- **Skip links:** "Skip to main content" on every page
- **Focus trapping:** Modals, dropdowns, dialogs trap focus
- **Escape key:** Closes all overlays
- **Arrow keys:** Navigate within lists, tables, menus

### Screen Reader Support
- **Semantic HTML:** `<nav>`, `<main>`, `<article>`, `<aside>`
- **ARIA labels:** All interactive elements labeled
- **Live regions:** Status updates announced (`aria-live="polite"`)
- **Alt text:** All images, icons have descriptive text
- **Table headers:** Proper `<th>` with `scope`

### Motor Accessibility
- **Touch targets:** Minimum 44x44px (iOS) / 48x48px (Android)
- **No time pressure:** Sessions don't timeout without warning
- **Drag alternatives:** All drag-and-drop has button alternative
- **One-handed use:** Key actions accessible with thumb zone

### Cognitive Accessibility
- **Clear language:** Plain Arabic, no medical jargon for patients
- **Consistent layout:** Same patterns across all pages
- **Error prevention:** Confirm before destructive actions
- **Error recovery:** Clear error messages with fix suggestions
- **Progress indicators:** Multi-step flows show progress

## 9.2 RTL (Right-to-Left) Support

- **Full RTL layout:** All text, navigation, forms flow right-to-left
- **Mirrored icons:** directional arrows flip
- **Consistent spacing:** Same visual rhythm in both directions
- **Language switch:** Easy toggle between AR/EN
- **Mixed content:** Proper handling of LTR text within RTL

## 9.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# 10. Mobile Experience

## 10.1 Responsive Breakpoints

| Breakpoint | Device | Layout |
|------------|--------|--------|
| < 640px | Phone (portrait) | Single column, bottom nav |
| 640-768px | Phone (landscape) | Single column, bottom nav |
| 768-1024px | Tablet (portrait) | Two columns, collapsed sidebar |
| 1024-1280px | Tablet (landscape) | Two columns, expandable sidebar |
| > 1280px | Desktop | Full layout with sidebar |

## 10.2 Mobile-Specific Components

### Bottom Navigation Bar
```
┌─────┬─────┬─────┬─────┬─────┐
│ 🏠  │ 🧪  │ 📋  │ 📊  │ 👤  │
│ Home│Tests│Order│Rpts │ Me  │
└─────┴─────┴─────┴─────┴─────┘
```
- Fixed bottom, always visible
- 5 items maximum
- Active state with brand color
- Badge support for notifications

### Pull to Refresh
- Available on all list views
- Smooth animation
- Shows last updated time

### Swipe Actions
```
Order Card:
  ← Swipe Left: Share Report
  → Swipe Right: Track Order
```

### Bottom Sheet (Actions)
```
┌─────────────────────────┐
│  ━━━━━━━━━━━━━━━━━━━━   │
│                         │
│  اجراءات                │
│  ─────────────────────  │
│  📥 تحميل PDF          │
│  📤 مشاركة              │
│  🖨️ طباعة              │
│  📋 نسخ رقم الطلب      │
│  ─────────────────────  │
│  ❌ إلغاء               │
└─────────────────────────┘
```

## 10.3 Touch Optimizations

- **Tap targets:** 48px minimum
- **Gestures:** Swipe, long-press, pinch-to-zoom on reports
- **Haptic feedback:** Light vibration on key actions
- **Safe areas:** Proper padding for notch/home indicator
- **Keyboard handling:** Input fields push content up
- **Autofill:** Phone, email, credit card fields optimized

## 10.4 Offline Support

- **Critical pages cached:** Dashboard, recent orders, recent reports
- **Queue works offline:** Sync when connection restored
- **Draft preservation:** Form data saved locally
- **Status indicator:** "Offline" banner when no connection
- **Background sync:** Upload pending actions when connected

## 10.5 Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| First Contentful Paint | < 1.5s | SSR + CDN |
| Largest Contentful Paint | < 2.5s | Image optimization, code splitting |
| Time to Interactive | < 3.5s | Lazy loading, prefetching |
| Cumulative Layout Shift | < 0.1 | Reserved spaces, font loading |
| First Input Delay | < 100ms | Event delegation, web workers |

---

# 11. Performance Budget

## 11.1 Bundle Size

| Resource | Budget | Current |
|----------|--------|---------|
| JavaScript | < 200KB gzipped | — |
| CSS | < 50KB gzipped | — |
| Images | < 500KB per page | — |
| Fonts | < 100KB (2 weights) | — |
| Total | < 850KB | — |

## 11.2 Loading Strategy

```
1. Shell (header + sidebar) → Instant (SSR)
2. Main content → < 1s (SSR + streaming)
3. Secondary content → < 2s (lazy loaded)
4. Charts/analytics → < 3s (client rendered)
5. Modals/dialogs → On demand (code split)
```

## 11.3 Caching Strategy

| Content | Cache Duration | Strategy |
|---------|---------------|----------|
| Static assets | 1 year | Cache-Control: immutable |
| API responses | 5 min | Stale-while-revalidate |
| User data | No cache | Always fresh |
| Test catalog | 1 hour | Background refresh |
| Images | 1 week | CDN + browser cache |

---

# 12. Trust Signals

## 12.1 Brand Trust Elements

- **Professional design:** Clean, consistent, no clutter
- **Arabic-first:** Native language, not translated
- **Saudi compliance:** ZATCA, Nphies, CCHI badges visible
- **Certifications:** ISO 15189, CAP displayed
- **Branch photos:** Real images of facilities
- **Doctor credentials:** Specializations and licenses shown

## 12.2 Security Trust

- **SSL padlock:** Always visible in browser
- **"Secured by"** badge on payment pages
- **Privacy policy:** Clear, plain-language Arabic
- **Consent management:** Granular opt-in/opt-out
- **Data encryption:** Mentioned at data entry points
- **Two-factor authentication:** Available and promoted

## 12.3 Transparency Trust

- **Pricing:** Always visible before booking
- **Wait times:** Real-time estimated
- **Status tracking:** Full visibility into process
- **Audit trail:** Patients can see their own history
- **No hidden fees:** All costs itemized

## 12.4 Social Trust

- **Patient testimonials** (anonymized)
- **Branch ratings** and reviews
- **Number of tests completed** (counter)
- **Doctor profiles** with photos
- **Partnership logos** (hospitals, insurance)

## 12.5 Result Trust

- **QR code verification** on every PDF report
- **Digital signature** from lab director
- **Reference ranges** from recognized sources
- **AI confidence scores** displayed
- **Chain of custody** visible to patients
- **Quality certifications** badge on reports

---

# Appendix A: Component Interaction Matrix

| User Action | System Response | Feedback | Error Handling |
|-------------|----------------|----------|----------------|
| Book appointment | Create order + payment | Confirmation screen + email + SMS | Slot taken → suggest alternatives |
| Check in | Update status + queue entry | Queue number + wait time | Already checked in → show status |
| Collect sample | Log sample + start processing | Status update to patient | Wrong patient → alert + verify |
| Enter results | Validate + flag abnormal | Technician confirmation | Out of range → require review |
| Approve report | Generate PDF + notify | Patient notification | Doctor unavailable → escalate |
| Process payment | Record + reconcile | Receipt + confirmation | Payment failed → retry/alternate |
| Download report | Generate + serve PDF | Download starts | expired → regenerate |

---

# Appendix B: Notification Matrix

| Event | Patient | Doctor | Tech | Manager | Method |
|-------|---------|--------|------|---------|--------|
| Booking confirmed | ✅ | — | — | — | Push + SMS + Email |
| Appointment reminder (24h) | ✅ | — | — | — | Push + SMS |
| Check-in | — | — | — | — | — |
| Sample collected | ✅ | — | ✅ | — | Push |
| Results ready | ✅ | ✅ | — | — | Push + SMS |
| Critical value | ✅ | ✅ | — | ✅ | Push + SMS + Phone |
| Invoice generated | ✅ | — | — | — | Push + Email |
| Payment received | ✅ | — | — | ✅ | Push + Email |
| Payment overdue | ✅ | — | — | ✅ | Push + SMS |
| Report shared | ✅ | ✅ | — | — | Push |

---

*Document prepared by UX Research Team — Al Mokhtabar Laboratory*
*For questions, contact the UX Lead*
