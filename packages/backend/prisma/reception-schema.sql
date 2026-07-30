-- ============================================================================
-- Al Mokhtabar Laboratory - Enterprise Reception Dashboard Schema
-- ============================================================================
-- This schema extends the existing database with queue management, walk-in
-- registration, insurance verification, branch transfers, home visits,
-- priority/VIP management, emergency cases, barcode tracking, and audit logging.
-- ============================================================================

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE queue_service_type AS ENUM ('walk-in', 'appointment', 'home-visit', 'consultation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE queue_priority AS ENUM ('normal', 'priority', 'vip', 'emergency');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE queue_status AS ENUM ('waiting', 'serving', 'completed', 'no-show', 'cancelled', 'transferred');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE service_point_type AS ENUM ('counter', 'desk', 'vip', 'emergency', 'consultation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE service_point_status AS ENUM ('active', 'inactive', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE insurance_verification_status AS ENUM ('pending', 'verified', 'rejected', 'expired', 'partial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transfer_status AS ENUM ('pending', 'accepted', 'in-transit', 'completed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transfer_priority AS ENUM ('normal', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE home_visit_status AS ENUM ('pending', 'assigned', 'en-route', 'sample-collected', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE home_visit_priority AS ENUM ('normal', 'urgent', 'vip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE priority_condition_type AS ENUM ('age-over-60', 'pregnant', 'corporate-vip', 'doctor-referral', 'insurance-vip', 'loyalty-tier', 'disability');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM ('priority', 'vip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vip_tier AS ENUM ('silver', 'gold', 'platinum', 'diamond');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE emergency_severity AS ENUM ('critical', 'urgent', 'moderate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE emergency_status AS ENUM ('triaged', 'in-treatment', 'stabilized', 'transferred', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE barcode_entity_type AS ENUM ('patient', 'order', 'appointment', 'walk-in', 'sample', 'queue-ticket');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE barcode_type AS ENUM ('code128', 'qr', 'datamatrix');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE barcode_job_status AS ENUM ('queued', 'printing', 'printed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE referral_source AS ENUM ('walk-in', 'online', 'doctor-referral', 'corporate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE walk_in_gender AS ENUM ('male', 'female', 'other', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 1. QUEUE MANAGEMENT
-- ============================================================================

-- ---------------------------------------------------------------------------
-- queue_settings: Per-branch queue configuration
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS queue_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  branch_id TEXT NOT NULL UNIQUE REFERENCES branches(id) ON DELETE CASCADE,
  max_wait_target_minutes INT NOT NULL DEFAULT 30 CHECK (max_wait_target_minutes > 0),
  auto_assign_enabled BOOLEAN NOT NULL DEFAULT true,
  priority_boost_minutes INT NOT NULL DEFAULT 10 CHECK (priority_boost_minutes >= 0),
  vip_max_wait_minutes INT NOT NULL DEFAULT 5 CHECK (vip_max_wait_minutes >= 0),
  emergency_override BOOLEAN NOT NULL DEFAULT true,
  announce_on_screen BOOLEAN NOT NULL DEFAULT true,
  announce_audio BOOLEAN NOT NULL DEFAULT true,
  ticket_printer_enabled BOOLEAN NOT NULL DEFAULT true,
  operating_hours JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- queue_service_points: Physical service points (counters/desks)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS queue_service_points (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type service_point_type NOT NULL DEFAULT 'counter',
  status service_point_status NOT NULL DEFAULT 'active',
  current_queue_entry_id TEXT,
  assigned_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  max_concurrent INT NOT NULL DEFAULT 1 CHECK (max_concurrent > 0),
  average_service_minutes INT NOT NULL DEFAULT 15 CHECK (average_service_minutes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_queue_service_points_branch_status
  ON queue_service_points(branch_id, status);

-- ---------------------------------------------------------------------------
-- queue_entries: Main queue table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS queue_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  ticket_number TEXT NOT NULL UNIQUE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_national_id TEXT,
  service_type queue_service_type NOT NULL DEFAULT 'walk-in',
  priority queue_priority NOT NULL DEFAULT 'normal',
  status queue_status NOT NULL DEFAULT 'waiting',
  service_point TEXT,
  phlebotomist_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  called_at TIMESTAMPTZ,
  started_serving_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_wait_minutes INT CHECK (estimated_wait_minutes >= 0),
  actual_wait_minutes INT CHECK (actual_wait_minutes >= 0),
  notes TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_queue_called_after_created
    CHECK (called_at IS NULL OR called_at >= created_at),
  CONSTRAINT chk_queue_serving_after_called
    CHECK (started_serving_at IS NULL OR called_at IS NULL OR started_serving_at >= called_at),
  CONSTRAINT chk_queue_completed_after_serving
    CHECK (completed_at IS NULL OR started_serving_at IS NULL OR completed_at >= started_serving_at)
);

-- Now add the FK from queue_service_points to queue_entries
ALTER TABLE queue_service_points
  ADD CONSTRAINT fk_queue_service_points_current_entry
  FOREIGN KEY (current_queue_entry_id) REFERENCES queue_entries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_queue_entries_branch_status
  ON queue_entries(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_branch_created
  ON queue_entries(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_queue_entries_patient
  ON queue_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_ticket_number
  ON queue_entries(ticket_number);
CREATE INDEX IF NOT EXISTS idx_queue_entries_priority_created
  ON queue_entries(priority, created_at);

-- ============================================================================
-- 2. WALK-IN REGISTRATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS walk_in_registrations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  registration_number TEXT NOT NULL UNIQUE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  queue_entry_id TEXT REFERENCES queue_entries(id) ON DELETE SET NULL,
  appointment_id TEXT REFERENCES appointment_bookings(id) ON DELETE SET NULL,
  is_new_patient BOOLEAN NOT NULL DEFAULT false,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_national_id TEXT,
  patient_dob DATE,
  patient_gender walk_in_gender,
  insurance_provider TEXT,
  insurance_number TEXT,
  insurance_expiry DATE,
  requested_services JSONB,
  referral_source referral_source NOT NULL DEFAULT 'walk-in',
  notes TEXT,
  barcode TEXT,
  qr_code TEXT,
  registered_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_walkin_insurance_fields
    CHECK (
      (insurance_provider IS NULL AND insurance_number IS NULL AND insurance_expiry IS NULL)
      OR
      (insurance_provider IS NOT NULL AND insurance_number IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_walk_in_registrations_branch_created
  ON walk_in_registrations(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_walk_in_registrations_patient
  ON walk_in_registrations(patient_id);
CREATE INDEX IF NOT EXISTS idx_walk_in_registrations_registration_number
  ON walk_in_registrations(registration_number);

-- ============================================================================
-- 3. INSURANCE VERIFICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS insurance_verifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  verification_number TEXT NOT NULL UNIQUE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  walk_in_id TEXT REFERENCES walk_in_registrations(id) ON DELETE SET NULL,
  insurance_provider TEXT NOT NULL,
  insurance_number TEXT NOT NULL,
  insurance_expiry DATE,
  verification_status insurance_verification_status NOT NULL DEFAULT 'pending',
  coverage_percentage FLOAT CHECK (coverage_percentage IS NULL OR (coverage_percentage >= 0 AND coverage_percentage <= 100)),
  covered_amount FLOAT CHECK (covered_amount IS NULL OR covered_amount >= 0),
  total_amount FLOAT CHECK (total_amount IS NULL OR total_amount >= 0),
  approval_code TEXT,
  rejection_reason TEXT,
  verified_at TIMESTAMPTZ,
  verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  api_response JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_insurance_verified_fields
    CHECK (
      (verification_status != 'verified')
      OR
      (approval_code IS NOT NULL AND verified_at IS NOT NULL AND verified_by IS NOT NULL)
    ),
  CONSTRAINT chk_insurance_rejected_fields
    CHECK (
      (verification_status != 'rejected')
      OR
      (rejection_reason IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_insurance_verifications_branch_created
  ON insurance_verifications(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insurance_verifications_patient
  ON insurance_verifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_verifications_provider
  ON insurance_verifications(insurance_provider);
CREATE INDEX IF NOT EXISTS idx_insurance_verifications_status
  ON insurance_verifications(verification_status);

-- ============================================================================
-- 4. BRANCH TRANSFERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS branch_transfers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  transfer_number TEXT NOT NULL UNIQUE,
  from_branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  to_branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  queue_entry_id TEXT REFERENCES queue_entries(id) ON DELETE SET NULL,
  walk_in_id TEXT REFERENCES walk_in_registrations(id) ON DELETE SET NULL,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status transfer_status NOT NULL DEFAULT 'pending',
  priority transfer_priority NOT NULL DEFAULT 'normal',
  notes TEXT,
  transferred_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  accepted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  transferred_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_transfer_different_branches
    CHECK (from_branch_id != to_branch_id),
  CONSTRAINT chk_transfer_accepted_fields
    CHECK (
      (status NOT IN ('accepted', 'in-transit', 'completed'))
      OR
      (accepted_by IS NOT NULL AND accepted_at IS NOT NULL)
    ),
  CONSTRAINT chk_transfer_completed_fields
    CHECK (
      (status != 'completed')
      OR
      (completed_at IS NOT NULL)
    ),
  CONSTRAINT chk_transfer_timeline
    CHECK (
      accepted_at IS NULL OR transferred_at IS NULL OR accepted_at >= transferred_at
    )
);

CREATE INDEX IF NOT EXISTS idx_branch_transfers_from_status
  ON branch_transfers(from_branch_id, status);
CREATE INDEX IF NOT EXISTS idx_branch_transfers_to_status
  ON branch_transfers(to_branch_id, status);
CREATE INDEX IF NOT EXISTS idx_branch_transfers_patient
  ON branch_transfers(patient_id);

-- ============================================================================
-- 5. HOME VISIT REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS home_visit_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  request_number TEXT NOT NULL UNIQUE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  queue_entry_id TEXT REFERENCES queue_entries(id) ON DELETE SET NULL,
  status home_visit_status NOT NULL DEFAULT 'pending',
  priority home_visit_priority NOT NULL DEFAULT 'normal',
  patient_address TEXT NOT NULL,
  patient_city TEXT,
  patient_lat FLOAT,
  patient_lng FLOAT,
  preferred_date DATE,
  preferred_time_start TIME,
  preferred_time_end TIME,
  assigned_phlebotomist_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  en_route_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  special_instructions TEXT,
  access_notes TEXT,
  distance_km FLOAT CHECK (distance_km IS NULL OR distance_km >= 0),
  estimated_arrival_minutes INT CHECK (estimated_arrival_minutes IS NULL OR estimated_arrival_minutes >= 0),
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_hv_assigned_fields
    CHECK (
      (status NOT IN ('assigned', 'en-route', 'sample-collected', 'completed'))
      OR
      (assigned_phlebotomist_id IS NOT NULL AND assigned_at IS NOT NULL)
    ),
  CONSTRAINT chk_hv_en_route_fields
    CHECK (
      (status NOT IN ('en-route', 'sample-collected', 'completed'))
      OR
      (en_route_at IS NOT NULL)
    ),
  CONSTRAINT chk_hv_completed_fields
    CHECK (
      (status != 'completed')
      OR
      (completed_at IS NOT NULL)
    ),
  CONSTRAINT chk_hv_time_range
    CHECK (
      preferred_time_end IS NULL OR preferred_time_start IS NULL
      OR preferred_time_end >= preferred_time_start
    )
);

CREATE INDEX IF NOT EXISTS idx_home_visit_requests_branch_status
  ON home_visit_requests(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_home_visit_requests_patient
  ON home_visit_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_home_visit_requests_phlebotomist_status
  ON home_visit_requests(assigned_phlebotomist_id, status);
CREATE INDEX IF NOT EXISTS idx_home_visit_requests_preferred_date
  ON home_visit_requests(preferred_date);

-- ============================================================================
-- 6. PRIORITY & VIP MANAGEMENT
-- ============================================================================

-- ---------------------------------------------------------------------------
-- priority_rules: Rules for automatic priority assignment
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS priority_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  condition_type priority_condition_type NOT NULL,
  condition_value JSONB,
  priority_level priority_level NOT NULL,
  auto_apply BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- vip_members: VIP patient registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vip_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  patient_id TEXT NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  vip_tier vip_tier NOT NULL DEFAULT 'silver',
  reason TEXT,
  granted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  benefits JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_vip_expiry_future
    CHECK (expires_at IS NULL OR expires_at > granted_at)
);

CREATE INDEX IF NOT EXISTS idx_vip_members_tier
  ON vip_members(vip_tier);

-- ============================================================================
-- 7. EMERGENCY CASES
-- ============================================================================

CREATE TABLE IF NOT EXISTS emergency_cases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  case_number TEXT NOT NULL UNIQUE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  queue_entry_id TEXT REFERENCES queue_entries(id) ON DELETE SET NULL,
  severity_level emergency_severity NOT NULL,
  symptoms TEXT NOT NULL,
  vitals JSONB,
  assigned_doctor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status emergency_status NOT NULL DEFAULT 'triaged',
  transferred_to TEXT,
  transfer_notes TEXT,
  triage_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_emergency_transferred_fields
    CHECK (
      (status != 'transferred')
      OR
      (transferred_to IS NOT NULL AND transfer_notes IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_emergency_cases_branch_status
  ON emergency_cases(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_severity
  ON emergency_cases(severity_level);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_created
  ON emergency_cases(created_at DESC);

-- ============================================================================
-- 8. BARCODE & QR CODE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS barcode_print_jobs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  entity_type barcode_entity_type NOT NULL,
  entity_id TEXT NOT NULL,
  barcode_data TEXT NOT NULL,
  barcode_type barcode_type NOT NULL DEFAULT 'code128',
  printer_id TEXT,
  printed_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  printed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status barcode_job_status NOT NULL DEFAULT 'printed',
  copies INT NOT NULL DEFAULT 1 CHECK (copies > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_barcode_print_jobs_entity
  ON barcode_print_jobs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_barcode_print_jobs_branch_created
  ON barcode_print_jobs(branch_id, created_at DESC);

-- ============================================================================
-- 9. RECEPTION ACTIVITY LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS reception_audit_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reception_audit_log_branch_created
  ON reception_audit_log(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reception_audit_log_user_created
  ON reception_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reception_audit_log_action
  ON reception_audit_log(action);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_queue_settings_updated_at
    BEFORE UPDATE ON queue_settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_queue_service_points_updated_at
    BEFORE UPDATE ON queue_service_points
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_queue_entries_updated_at
    BEFORE UPDATE ON queue_entries
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_walk_in_registrations_updated_at
    BEFORE UPDATE ON walk_in_registrations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_insurance_verifications_updated_at
    BEFORE UPDATE ON insurance_verifications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_branch_transfers_updated_at
    BEFORE UPDATE ON branch_transfers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_home_visit_requests_updated_at
    BEFORE UPDATE ON home_visit_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_priority_rules_updated_at
    BEFORE UPDATE ON priority_rules
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_vip_members_updated_at
    BEFORE UPDATE ON vip_members
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_emergency_cases_updated_at
    BEFORE UPDATE ON emergency_cases
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
