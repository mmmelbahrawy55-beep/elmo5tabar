# Al Mokhtabar Laboratory - Enterprise Database Architecture

## ER Diagram Description

### Entity Count: 50+ tables
### Total Lines: ~1,800 (Prisma) + ~400 (SQL migration)

---

## Core Entity Relationships

### Authentication & Users (4 tables)
```
User ──1:1──> UserProfile
User ──1:N──> RefreshToken
User ──1:N──> Session
User ──N:1──> Role (via roleId)
Role ──M:N──> Permission (via RolePermission)
```

### Patients (3 tables)
```
Patient ──1:1──> User (optional)
Patient ──M:1──> Patient (parentPatientId, self-referential for family)
Patient ──1:N──> MedicalHistory
Patient ──1:N──> InsurancePolicy
Patient ──1:N──> InsuranceClaim
Patient ──1:N──> AiConversation
```

### Staff (4 tables)
```
DoctorProfile ──1:1──> User
DoctorProfile ──M:1──> Department
DoctorProfile ──1:N──> DoctorSchedule
EmployeeProfile ──1:1──> User
EmployeeProfile ──M:1──> Department
EmployeeProfile ──M:1──> Branch
PhlebotomistProfile ──1:1──> User
PhlebotomistProfile ──M:1──> Branch
```

### Branches & Departments (3 tables)
```
Branch ──1:N──> Department
Branch ──1:N──> QueueSettings
Branch ──1:N──> QueueServicePoint
Branch ──1:N──> QueueEntry
Department ──M:1──> Department (parentId, self-referential tree)
```

### Lab Tests & Catalog (7 tables)
```
TestCategory ──M:1──> Department
TestCategory ──M:1──> TestCategory (parentId, self-referential tree)
TestSubcategory ──M:1──> TestCategory
LabTest ──M:1──> TestCategory
LabTest ──M:1──> TestSubcategory
LabTest ──M:N──> Branch (via TestBranchPricing)
TestPackage ──M:1──> TestCategory
TestPackage ──M:N──> LabTest (via TestPackageItem)
```

### Orders & Samples (6 tables)
```
Order ──M:1──> Patient
Order ──M:1──> User (doctorId)
Order ──M:1──> Branch
Order ──1:N──> OrderItem
Order ──1:N──> Sample
Order ──1:1──> Report
Order ──1:1──> Invoice
Order ──M:1──> Coupon
OrderItem ──M:1──> LabTest
OrderItem ──M:1──> TestPackage
Sample ──1:N──> SampleTrackingEvent
```

### Reports & Results (4 tables)
```
Report ──M:1──> Order
Report ──M:1──> Patient
Report ──M:1──> User (reviewedById)
Report ──1:N──> ReportItem
Report ──1:N──> ResultAttachment
ReportItem ──M:1──> LabTest
```

### Appointments & Queue (6 tables)
```
Appointment ──M:1──> Patient
Appointment ──M:1──> Branch
Appointment ──M:1──> User (phlebotomistId)
Appointment ──1:1──> Order (optional)
QueueSettings ──1:1──> Branch
QueueServicePoint ──M:1──> Branch
QueueServicePoint ──M:1──> User (assignedUserId)
QueueEntry ──M:1──> Branch
QueueEntry ──M:1──> Patient
QueueEntry ──1:1──> QueueServicePoint (currentEntry)
QueueHistory ──M:1──> QueueEntry
```

### Insurance (4 tables)
```
InsuranceCompany ──1:N──> InsurancePolicy
InsuranceCompany ──1:N──> InsuranceClaim
InsurancePolicy ──M:1──> Patient
InsurancePolicy ──M:1──> InsuranceCompany
InsuranceVerification ──M:1──> Branch
InsuranceVerification ──M:1──> Patient
InsuranceVerification ──M:1──> InsurancePolicy
InsuranceClaim ──M:1──> InsurancePolicy
InsuranceClaim ──M:1──> InsuranceCompany
```

### Billing (3 tables)
```
Invoice ──1:1──> Order
Invoice ──M:1──> Patient
Invoice ──M:1──> Branch
Invoice ──1:N──> Payment
Invoice ──1:1──> Refund
Payment ──M:1──> Invoice
Refund ──M:1──> Invoice
```

### Communications (4 tables)
```
Notification ──M:1──> User
SmsLog ──M:1──> User (sentById)
EmailLog ──M:1──> User (sentById)
WhatsAppLog ──M:1──> User (sentById)
```

### Operations (6 tables)
```
HomeVisitRequest ──M:1──> Branch
HomeVisitRequest ──M:1──> Patient
HomeVisitRequest ──M:1──> PhlebotomistProfile
BranchTransfer ──M:1──> Branch (from)
BranchTransfer ──M:1──> Branch (to)
BranchTransfer ──M:1──> Patient
EmergencyCase ──M:1──> Branch
EmergencyCase ──M:1──> Patient
VipMember ──1:1──> Patient
```

### System (8 tables)
```
AuditLog ──M:1──> User
ActivityLog ──M:1──> User
SystemLog ──M:1──> User (createdById)
SystemConfig (standalone)
Media ──M:1──> User (uploadedById)
ApiKey ──M:1──> User
BarcodePrintJob ──M:1──> Branch
ReceptionAuditLog ──M:1──> Branch
ReceptionAuditLog ──M:1──> User
```

### CMS & Content (5 tables)
```
PageContent (standalone)
BlogPost (standalone)
Faq (standalone)
SupportTicket ──M:1──> Patient
TicketMessage ──M:1──> SupportTicket
```

### AI (2 tables)
```
AiConversation ──M:1──> Patient
AiConversation ──M:1──> User
AiMessage ──M:1──> AiConversation
```

### Payroll (1 table)
```
PayrollEntry ──M:1──> EmployeeProfile
```

### Marketing & Partners (2 tables)
```
Partner (standalone)
MarketingCampaign (standalone)
```

### Inventory (3 tables)
```
Supplier ──1:N──> InventoryItem
InventoryItem ──1:N──> InventoryMovement
```

### Coupons (1 table)
```
Coupon ──1:N──> Order
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| UUID primary keys | Distributed system safe, no sequential ID guessing, works across services |
| CUID default in Prisma | Time-sortable, URL-safe, collision-resistant |
| Soft deletes everywhere | Data retention, audit trail, no data loss on accidental deletion |
| CreatedBy/UpdatedBy audit | Full accountability chain for every record |
| Partitioned log tables | Billions of records without performance degradation |
| Materialized views | Dashboard queries execute in <100ms regardless of data volume |
| Denormalized display fields | Patient name on orders/reports avoids N+1 joins |
| Self-referential trees | Departments, categories support unlimited nesting |
| Composite indexes | Optimized for the most common query patterns |
| Partial indexes | Smaller indexes, faster queries for active data only |
| Row-level security | Branch-level data isolation at database level |
| Sequential number generators | Human-readable IDs (P-2024000001, ORD-2024000001, etc.) |

---

## Migration Strategy

### Phase 1: Schema Creation (Week 1)
1. Backup existing database
2. Run `prisma migrate dev --create-only` to generate migration
3. Review generated SQL
4. Add partitioned tables, materialized views, RLS policies
5. Run migration on staging database
6. Validate all constraints and indexes

### Phase 2: Data Migration (Week 2)
1. Migrate existing data from old schema
2. Generate sequential numbers for existing records
3. Populate materialized views
4. Validate data integrity

### Phase 3: Application Update (Week 3)
1. Update Prisma client: `npx prisma generate`
2. Update API endpoints for new schema
3. Update frontend types
4. Run full test suite

### Phase 4: Production Deployment (Week 4)
1. Blue-green deployment
2. Run migration on primary
3. Verify replication to replicas
4. Monitor performance metrics
5. Rollback plan ready

---

## Backup Strategy

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| Full backup (pg_basebackup) | Daily 2:00 AM | 30 days | Local + S3 |
| WAL archive | Continuous | 30 days | S3 +异地 |
| Logical dump (pg_dump) | Weekly Sunday 3:00 AM | 90 days | S3 |
| Point-in-time recovery | On-demand | 30 days | WAL archive |
| Cross-region replica | Real-time | Always | Secondary DC |

### Recovery Objectives
- **RPO (Recovery Point Objective)**: < 1 minute (WAL streaming)
- **RTO (Recovery Time Objective)**: < 15 minutes (automated failover)

---

## High Availability Architecture

```
                    ┌─────────────┐
                    │   PgBouncer │ (Connection Pooler)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼─────┐ ┌───▼─────┐
        │  Primary   │ │Replica 1│ │Replica 2│
        │  (R/W)     │ │ (R/O)   │ │ (R/O)   │
        └─────┬──────┘ └────┬────┘ └────┬────┘
              │             │           │
              │  Synchronous│    Async  │
              └─────────────┼───────────┘
                            │
                    ┌───────▼───────┐
                    │  Redis Cache  │ (Queue, Sessions)
                    └───────────────┘
```

### Connection Routing
- **Writes**: Primary only (orders, payments, reports)
- **Dashboard analytics**: Replica 1 (materialized views)
- **Search queries**: Replica 2 (full-text search, trigram)
- **Real-time queue**: Primary + Redis cache
- **Session management**: Redis

### Scaling Strategy
- **Read scaling**: Add replicas for read-heavy workloads
- **Write scaling**: Partition high-volume tables by month
- **Cache layer**: Redis for hot data (queue, sessions, dashboard)
- **Search layer**: Meilisearch for full-text search (offload from PostgreSQL)
- **Archive layer**: Move old data to cold storage (S3 + Parquet)

---

## Performance Optimization Summary

| Optimization | Target Tables | Expected Improvement |
|-------------|---------------|---------------------|
| Partitioning | audit_logs, activity_logs, system_logs, sms_logs, email_logs, login_history, notifications | 10x faster queries on old data |
| Materialized views | 6 views for dashboards | <100ms dashboard load (from 2-5s) |
| Full-text search (GIN) | lab_tests, patients, blog_posts | Instant search across millions of records |
| Trigram indexes (pg_trgm) | patients, lab_tests | Fuzzy matching for Arabic names |
| Partial indexes | orders, patients, queue_entries, appointments, invoices | 50% smaller indexes, faster hot queries |
| Covering indexes | orders, reports | Index-only scans for dashboard queries |
| Row-level security | patients, orders, reports, invoices, payments, audit_logs | Branch-level isolation at DB level |
| Connection pooling | All tables | 10x connection efficiency via PgBouncer |
| Redis caching | Queue, sessions, dashboard | Sub-millisecond response for cached data |
