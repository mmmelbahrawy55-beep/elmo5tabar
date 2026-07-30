-- ============================================================================
-- AL MOKHTABAR LABORATORY - Enterprise Migration & Optimization
-- ============================================================================
-- Version: 2.0.0
-- Strategy: Zero-downtime migration with partitioning, materialized views,
--           row-level security, and performance optimization.
-- ============================================================================

-- ============================================================================
-- 1. PARTITIONING STRATEGY (for high-volume tables)
-- ============================================================================
-- Partition audit_logs, activity_logs, system_logs, login_history, sms_logs,
-- email_logs, notifications by month for billion-row scalability.

-- Audit Logs - Range partitioned by month
CREATE TABLE IF NOT EXISTS audit_logs_partitioned (
  LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for current + next 12 months
DO $$
DECLARE
  m INT;
  y INT;
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR m IN 0..12 LOOP
    start_date := date_trunc('month', CURRENT_DATE) + (m || ' months')::INTERVAL;
    end_date := start_date + INTERVAL '1 month';
    y := EXTRACT(YEAR FROM start_date)::INT;
    partition_name := 'audit_logs_' || TO_CHAR(start_date, 'YYYY_MM');
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs_partitioned FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
  END LOOP;
END $$;

-- Activity Logs - Range partitioned by month
CREATE TABLE IF NOT EXISTS activity_logs_partitioned (
  LIKE activity_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

DO $$
DECLARE
  m INT;
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR m IN 0..12 LOOP
    start_date := date_trunc('month', CURRENT_DATE) + (m || ' months')::INTERVAL;
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'activity_logs_' || TO_CHAR(start_date, 'YYYY_MM');
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF activity_logs_partitioned FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
  END LOOP;
END $$;

-- System Logs - Range partitioned by month
CREATE TABLE IF NOT EXISTS system_logs_partitioned (
  LIKE system_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

DO $$
DECLARE
  m INT;
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR m IN 0..12 LOOP
    start_date := date_trunc('month', CURRENT_DATE) + (m || ' months')::INTERVAL;
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'system_logs_' || TO_CHAR(start_date, 'YYYY_MM');
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF system_logs_partitioned FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
  END LOOP;
END $$;

-- Login History - Range partitioned by month
CREATE TABLE IF NOT EXISTS login_history_partitioned (
  LIKE login_history INCLUDING ALL
) PARTITION BY RANGE (created_at);

DO $$
DECLARE
  m INT;
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR m IN 0..12 LOOP
    start_date := date_trunc('month', CURRENT_DATE) + (m || ' months')::INTERVAL;
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'login_history_' || TO_CHAR(start_date, 'YYYY_MM');
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF login_history_partitioned FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
  END LOOP;
END $$;

-- SMS Logs - Range partitioned by month
CREATE TABLE IF NOT EXISTS sms_logs_partitioned (
  LIKE sms_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

DO $$
DECLARE
  m INT;
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR m IN 0..12 LOOP
    start_date := date_trunc('month', CURRENT_DATE) + (m || ' months')::INTERVAL;
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'sms_logs_' || TO_CHAR(start_date, 'YYYY_MM');
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF sms_logs_partitioned FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
  END LOOP;
END $$;

-- Email Logs - Range partitioned by month
CREATE TABLE IF NOT EXISTS email_logs_partitioned (
  LIKE email_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

DO $$
DECLARE
  m INT;
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR m IN 0..12 LOOP
    start_date := date_trunc('month', CURRENT_DATE) + (m || ' months')::INTERVAL;
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'email_logs_' || TO_CHAR(start_date, 'YYYY_MM');
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF email_logs_partitioned FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
  END LOOP;
END $$;

-- Notifications - Range partitioned by month
CREATE TABLE IF NOT EXISTS notifications_partitioned (
  LIKE notifications INCLUDING ALL
) PARTITION BY RANGE (created_at);

DO $$
DECLARE
  m INT;
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR m IN 0..12 LOOP
    start_date := date_trunc('month', CURRENT_DATE) + (m || ' months')::INTERVAL;
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'notifications_' || TO_CHAR(start_date, 'YYYY_MM');
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF notifications_partitioned FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
  END LOOP;
END $$;


-- ============================================================================
-- 2. ADVANCED INDEXES (beyond Prisma defaults)
-- ============================================================================

-- Full-text search indexes (Arabic + English)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lab_tests_fulltext
  ON lab_tests USING GIN (
    to_tsvector('simple', coalesce(name_ar, '') || ' ' || coalesce(name_en, '') || ' ' || coalesce(code, ''))
  );

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_fulltext
  ON patients USING GIN (
    to_tsvector('simple',
      coalesce(first_name_ar, '') || ' ' || coalesce(last_name_ar, '') || ' '
      || coalesce(first_name_en, '') || ' ' || coalesce(last_name_en, '') || ' '
      || coalesce(phone, '') || ' ' || coalesce(national_id, '')
    )
  );

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_fulltext
  ON blog_posts USING GIN (
    to_tsvector('simple', coalesce(title_ar, '') || ' ' || coalesce(content_ar, ''))
  );

-- Trigram indexes for fuzzy search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_name_trgm
  ON patients USING GIN (first_name_ar gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lab_tests_name_trgm
  ON lab_tests USING GIN (name_ar gin_trgm_ops);

-- Partial indexes for hot queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_active
  ON orders (created_at DESC)
  WHERE status NOT IN ('CANCELLED', 'REFUNDED') AND deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_active
  ON patients (created_at DESC)
  WHERE is_active = true AND deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_queue_entries_waiting
  ON queue_entries (priority, created_at)
  WHERE status = 'waiting';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_upcoming
  ON appointments (branch_id, scheduled_at)
  WHERE status IN ('SCHEDULED', 'CONFIRMED') AND deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lab_tests_active_popular
  ON lab_tests (category_id)
  WHERE is_active = true AND deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_overdue
  ON invoices (due_date)
  WHERE status = 'PENDING' AND deleted_at IS NULL;

-- Covering indexes for dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_dashboard
  ON orders (status, created_at, total)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_dashboard
  ON reports (status, created_at, patient_id)
  WHERE deleted_at IS NULL;

-- Composite index for patient search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_search
  ON patients (phone, national_id, email)
  WHERE deleted_at IS NULL;


-- ============================================================================
-- 3. MATERIALIZED VIEWS (for dashboard performance)
-- ============================================================================

-- Daily revenue summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_revenue AS
SELECT
  date_trunc('day', o.created_at) AS day,
  o.branch_id,
  b.name_en AS branch_name,
  COUNT(o.id) AS order_count,
  SUM(o.total) AS revenue,
  SUM(o.tax) AS tax_collected,
  AVG(o.total) AS avg_order_value,
  COUNT(DISTINCT o.patient_id) AS unique_patients
FROM orders o
JOIN branches b ON b.id = o.branch_id
WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
  AND o.deleted_at IS NULL
GROUP BY date_trunc('day', o.created_at), o.branch_id, b.name_en
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_revenue
  ON mv_daily_revenue (day, branch_id);

-- Patient visit frequency
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_patient_visits AS
SELECT
  p.id AS patient_id,
  p.patient_number,
  p.first_name_ar,
  p.last_name_ar,
  COUNT(o.id) AS total_visits,
  MAX(o.created_at) AS last_visit,
  SUM(o.total) AS lifetime_value,
  COUNT(DISTINCT date_trunc('month', o.created_at)) AS active_months
FROM patients p
LEFT JOIN orders o ON o.patient_id = p.id
  AND o.status NOT IN ('CANCELLED', 'REFUNDED')
  AND o.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.patient_number, p.first_name_ar, p.last_name_ar
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_patient_visits
  ON mv_patient_visits (patient_id);

-- Test popularity ranking
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_test_popularity AS
SELECT
  lt.id AS test_id,
  lt.code,
  lt.name_ar,
  lt.name_en,
  tc.name_en AS category_name,
  COUNT(oi.id) AS order_count,
  SUM(oi.price * oi.quantity) AS total_revenue,
  COUNT(DISTINCT o.patient_id) AS unique_patients,
  COUNT(DISTINCT date_trunc('month', o.created_at)) AS months_active
FROM lab_tests lt
JOIN test_categories tc ON tc.id = lt.category_id
LEFT JOIN order_items oi ON oi.lab_test_id = lt.id
LEFT JOIN orders o ON o.id = oi.order_id
  AND o.status NOT IN ('CANCELLED', 'REFUNDED')
  AND o.deleted_at IS NULL
WHERE lt.deleted_at IS NULL
GROUP BY lt.id, lt.code, lt.name_ar, lt.name_en, tc.name_en
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_test_popularity
  ON mv_test_popularity (test_id);

-- Branch performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_branch_performance AS
SELECT
  b.id AS branch_id,
  b.name_en AS branch_name,
  b.city,
  COUNT(DISTINCT o.id) AS total_orders,
  COUNT(DISTINCT o.patient_id) AS total_patients,
  SUM(o.total) AS total_revenue,
  AVG(o.total) AS avg_order_value,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'COMPLETED') AS completed_appointments,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'NO_SHOW') AS no_shows,
  AVG(CASE WHEN qe.status = 'completed' THEN qe.actual_wait_minutes END) AS avg_wait_minutes
FROM branches b
LEFT JOIN orders o ON o.branch_id = b.id
  AND o.status NOT IN ('CANCELLED', 'REFUNDED')
  AND o.deleted_at IS NULL
LEFT JOIN appointments a ON a.branch_id = b.id AND a.deleted_at IS NULL
LEFT JOIN queue_entries qe ON qe.branch_id = b.id
WHERE b.deleted_at IS NULL
GROUP BY b.id, b.name_en, b.city
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_branch_performance
  ON mv_branch_performance (branch_id);

-- Doctor performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_doctor_performance AS
SELECT
  dp.user_id AS doctor_id,
  up.first_name_ar || ' ' || up.last_name_ar AS doctor_name,
  dp.specialty_ar,
  COUNT(DISTINCT o.id) AS total_orders,
  COUNT(DISTINCT a.id) AS total_appointments,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'COMPLETED') AS completed_appointments,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'NO_SHOW') AS no_shows,
  ROUND(AVG(r.rating) FILTER (WHERE r.rating > 0), 1) AS avg_rating,
  COUNT(DISTINCT r.id) FILTER (WHERE r.rating > 0) AS total_ratings
FROM doctor_profiles dp
JOIN user_profiles up ON up.user_id = dp.user_id
LEFT JOIN orders o ON o.doctor_id = dp.user_id AND o.deleted_at IS NULL
LEFT JOIN appointments a ON a.phlebotomist_id = dp.user_id AND a.deleted_at IS NULL
GROUP BY dp.user_id, up.first_name_ar, up.last_name_ar, dp.specialty_ar
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_doctor_performance
  ON mv_doctor_performance (doctor_id);

-- Insurance claims summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_insurance_claims_summary AS
SELECT
  ic.id AS insurance_company_id,
  ic.name_en AS company_name,
  date_trunc('month', icl.submitted_at) AS month,
  COUNT(icl.id) AS total_claims,
  SUM(icl.submitted_amount) AS total_submitted,
  SUM(CASE WHEN icl.status = 'APPROVED' THEN icl.approved_amount ELSE 0 END) AS total_approved,
  SUM(CASE WHEN icl.status = 'REJECTED' THEN icl.submitted_amount ELSE 0 END) AS total_rejected,
  ROUND(
    COUNT(*) FILTER (WHERE icl.status = 'APPROVED')::NUMERIC /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS approval_rate
FROM insurance_companies ic
LEFT JOIN insurance_claims icl ON icl.insurance_company_id = ic.id
  AND icl.deleted_at IS NULL
WHERE ic.deleted_at IS NULL
GROUP BY ic.id, ic.name_en, date_trunc('month', icl.submitted_at)
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_insurance_claims
  ON mv_insurance_claims_summary (insurance_company_id, month);


-- ============================================================================
-- 4. REFRESH FUNCTION FOR MATERIALIZED VIEWS
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_patient_visits;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_test_popularity;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_branch_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_doctor_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_insurance_claims_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every 15 minutes via pg_cron
-- SELECT cron.schedule('refresh-mv', '*/15 * * * *', 'SELECT refresh_materialized_views();');


-- ============================================================================
-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Branch-level isolation: users can only see data from their branch
CREATE POLICY branch_isolation_patients ON patients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id')::UUID
      AND (
        u.role = 'SUPER_ADMIN'
        OR u.role = 'ADMIN'
        OR EXISTS (
          SELECT 1 FROM employee_profiles ep
          WHERE ep.user_id = u.id AND ep.branch_id = patients.created_by
        )
      )
    )
  );

-- Super admin bypass for audit logs
CREATE POLICY admin_only_audit_logs ON audit_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id')::UUID
      AND u.role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- Patient data access policy
CREATE POLICY patient_own_data ON patients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id')::UUID
      AND (
        u.role IN ('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'LAB_TECHNICIAN')
        OR patients.user_id = u.id
      )
    )
  );


-- ============================================================================
-- 6. AUDIT TRIGGERS
-- ============================================================================

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-set patient total_visits
CREATE OR REPLACE FUNCTION update_patient_visit_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
    UPDATE patients
    SET total_visits = total_visits + 1,
        last_visit_at = NEW.completed_at
    WHERE id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_visit_count
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_visit_count();

-- Auto-set order balance_due
CREATE OR REPLACE FUNCTION update_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance_due = NEW.total - NEW.paid_amount;
  IF NEW.balance_due <= 0 THEN
    NEW.status = 'PAID';
    NEW.paid_at = COALESCE(NEW.paid_at, now());
  ELSIF NEW.paid_amount > 0 THEN
    NEW.status = 'PARTIALLY_PAID';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_balance
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_balance();

-- Auto-generate patient number
CREATE OR REPLACE FUNCTION generate_patient_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.patient_number IS NULL THEN
    NEW.patient_number := 'P-' || TO_CHAR(now(), 'YYYY') ||
      LPAD(nextval('patient_number_seq')::TEXT, 8, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS patient_number_seq START 1;

CREATE TRIGGER trg_patient_number
  BEFORE INSERT ON patients
  FOR EACH ROW
  EXECUTE FUNCTION generate_patient_number();

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ORD-' || TO_CHAR(now(), 'YYYY') ||
      LPAD(nextval('order_number_seq')::TEXT, 8, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE TRIGGER trg_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Auto-generate report number
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.report_number IS NULL THEN
    NEW.report_number := 'RPT-' || TO_CHAR(now(), 'YYYY') ||
      LPAD(nextval('report_number_seq')::TEXT, 8, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS report_number_seq START 1;

CREATE TRIGGER trg_report_number
  BEFORE INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION generate_report_number();

-- Auto-generate sample code
CREATE OR REPLACE FUNCTION generate_sample_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sample_code IS NULL THEN
    NEW.sample_code := 'S-' || TO_CHAR(now(), 'YYYY') ||
      LPAD(nextval('sample_code_seq')::TEXT, 8, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS sample_code_seq START 1;

CREATE TRIGGER trg_sample_code
  BEFORE INSERT ON samples
  FOR EACH ROW
  EXECUTE FUNCTION generate_sample_code();

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(now(), 'YYYY') ||
      LPAD(nextval('invoice_number_seq')::TEXT, 8, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- Auto-generate payment number
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_number IS NULL THEN
    NEW.payment_number := 'PAY-' || TO_CHAR(now(), 'YYYY') ||
      LPAD(nextval('payment_number_seq')::TEXT, 8, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS payment_number_seq START 1;

CREATE TRIGGER trg_payment_number
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION generate_payment_number();


-- ============================================================================
-- 7. PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Connection pooling settings (for pgbouncer)
-- max_connections = 200
-- shared_buffers = 25% of RAM
-- effective_cache_size = 75% of RAM
-- work_mem = 256MB
-- maintenance_work_mem = 1GB
-- wal_buffers = 64MB
-- checkpoint_completion_target = 0.9
-- random_page_cost = 1.1 (SSD)

-- Analyze tables for query planner
ANALYZE users;
ANALYZE patients;
ANALYZE orders;
ANALYZE reports;
ANALYZE lab_tests;
ANALYZE appointments;
ANALYZE queue_entries;
ANALYZE invoices;
ANALYZE audit_logs;


-- ============================================================================
-- 8. BACKUP STRATEGY
-- ============================================================================

-- pg_basebackup for full backup (daily)
-- pg_dump for logical backup (weekly)
-- WAL archiving for point-in-time recovery (continuous)
-- Barman for automated backup management

-- Backup schedule:
-- Full backup: Daily at 2:00 AM (pg_basebackup)
-- WAL archive: Continuous (archive_command)
-- Logical dump: Weekly Sunday 3:00 AM (pg_dump)
-- Retention: 30 days for WAL, 90 days for full backups
--异地备份: Daily replication to secondary datacenter


-- ============================================================================
-- 9. HIGH AVAILABILITY
-- ============================================================================

-- Primary-Replica setup:
-- 1 Primary (read/write) + 2 Replicas (read-only)
-- Synchronous replication for critical data (payments, reports)
-- Asynchronous replication for analytics queries
-- Automatic failover via Patroni/pg_auto_failover

-- Read routing:
-- Writes -> Primary
-- Dashboard analytics -> Replica 1
-- Search queries -> Replica 2
-- Real-time queue -> Primary (with Redis cache)

-- Connection limits:
-- Primary: 100 connections (application + replicas)
-- Replica 1: 80 connections (analytics + reporting)
-- Replica 2: 60 connections (search + read-heavy queries)


-- ============================================================================
-- 10. DATA RETENTION & ARCHIVAL
-- ============================================================================

-- Archive old data to separate tables
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- Move audit logs older than 2 years to archive
  INSERT INTO audit_logs_archive
  SELECT * FROM audit_logs
  WHERE created_at < now() - INTERVAL '2 years';

  DELETE FROM audit_logs
  WHERE created_at < now() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Create archive tables
CREATE TABLE IF NOT EXISTS audit_logs_archive (LIKE audit_logs INCLUDING ALL);
CREATE TABLE IF NOT EXISTS activity_logs_archive (LIKE activity_logs INCLUDING ALL);
CREATE TABLE IF NOT EXISTS system_logs_archive (LIKE system_logs INCLUDING ALL);
CREATE TABLE IF NOT EXISTS login_history_archive (LIKE login_history INCLUDING ALL);

-- Schedule archival via pg_cron
-- SELECT cron.schedule('archive-logs', '0 3 1 * *', 'SELECT archive_old_audit_logs();');
