-- ============================================================
-- Appointment Booking System Schema
-- For Al Mokhtabar Laboratory
-- ============================================================

-- Enums
CREATE TYPE "AppointmentServiceType" AS ENUM (
  'analysis',
  'package',
  'home-visit',
  'consultation',
  'corporate'
);

CREATE TYPE "BookingStatus" AS ENUM (
  'pending',
  'confirmed',
  'checked-in',
  'in-progress',
  'completed',
  'cancelled',
  'no-show',
  'rescheduled'
);

CREATE TYPE "BookingPaymentMethod" AS ENUM (
  'visa',
  'mastercard',
  'apple-pay',
  'google-pay',
  'cash',
  'insurance',
  'wallet'
);

CREATE TYPE "BookingPaymentStatus" AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded'
);

CREATE TYPE "CrowdLevel" AS ENUM (
  'low',
  'medium',
  'high'
);

CREATE TYPE "NotificationChannel" AS ENUM (
  'sms',
  'email',
  'whatsapp',
  'push'
);

CREATE TYPE "NotificationStatus" AS ENUM (
  'pending',
  'sent',
  'delivered',
  'failed'
);

-- ============================================================
-- 1. Available booking services with pricing
-- ============================================================
CREATE TABLE appointment_services (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name_ar         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description_ar  TEXT,
  description_en  TEXT,
  type            "AppointmentServiceType" NOT NULL,
  base_price      DOUBLE PRECISION NOT NULL,
  discounted_price DOUBLE PRECISION,
  currency        TEXT NOT NULL DEFAULT 'SAR',
  duration_minutes INT NOT NULL DEFAULT 15,
  requires_prep   BOOLEAN NOT NULL DEFAULT false,
  prep_instructions_ar TEXT,
  prep_instructions_en TEXT,
  home_visit_surcharge DOUBLE PRECISION DEFAULT 0,
  icon            TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointment_services_type ON appointment_services(type);
CREATE INDEX idx_appointment_services_active ON appointment_services(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX idx_appointment_services_slug ON appointment_services(slug);

-- ============================================================
-- 2. Main booking table with full 7-step data
-- ============================================================
CREATE TABLE appointment_bookings (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_number  TEXT NOT NULL UNIQUE,

  -- Step 1: Service selection
  service_id      TEXT NOT NULL REFERENCES appointment_services(id) ON DELETE RESTRICT,
  service_type    "AppointmentServiceType" NOT NULL,

  -- Step 2: Branch & date selection
  branch_id       TEXT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  booking_date    DATE NOT NULL,

  -- Step 3: Time slot selection
  slot_start_time TIME NOT NULL,
  slot_end_time   TIME NOT NULL,

  -- Step 4: Patient info
  patient_id      TEXT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  patient_name    TEXT NOT NULL,
  patient_phone   TEXT NOT NULL,
  patient_email   TEXT,
  patient_national_id TEXT,
  patient_date_of_birth DATE,
  patient_gender  TEXT,
  is_walk_in      BOOLEAN NOT NULL DEFAULT false,

  -- Step 5: Additional info
  notes           TEXT,
  special_requests TEXT,
  accompanying_person_name TEXT,
  accompanying_person_phone TEXT,
  referral_source TEXT,

  -- Step 6: Payment
  service_price   DOUBLE PRECISION NOT NULL,
  home_visit_surcharge DOUBLE PRECISION NOT NULL DEFAULT 0,
  discount        DOUBLE PRECISION NOT NULL DEFAULT 0,
  tax_amount      DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_amount    DOUBLE PRECISION NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'SAR',
  payment_method  "BookingPaymentMethod",
  payment_status  "BookingPaymentStatus" NOT NULL DEFAULT 'pending',
  insurance_provider TEXT,
  insurance_number TEXT,
  insurance_approval TEXT,

  -- Step 7: Confirmation
  qr_code_url     TEXT,
  barcode         TEXT,
  confirmed_at    TIMESTAMPTZ,

  -- Status tracking
  status          "BookingStatus" NOT NULL DEFAULT 'pending',
  cancel_reason   TEXT,
  cancelled_at    TIMESTAMPTZ,
  rescheduled_from TEXT REFERENCES appointment_bookings(id) ON DELETE SET NULL,
  checked_in_at   TIMESTAMPTZ,
  in_progress_at  TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  no_show_at      TIMESTAMPTZ,

  -- Calendar
  calendar_synced BOOLEAN NOT NULL DEFAULT false,
  calendar_event_id TEXT,

  -- Metadata
  booked_by_user_id TEXT,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_branch_date ON appointment_bookings(branch_id, booking_date);
CREATE INDEX idx_bookings_patient ON appointment_bookings(patient_id);
CREATE INDEX idx_bookings_status ON appointment_bookings(status);
CREATE INDEX idx_bookings_service ON appointment_bookings(service_id);
CREATE INDEX idx_bookings_date_status ON appointment_bookings(booking_date, status);
CREATE INDEX idx_bookings_number ON appointment_bookings(booking_number);
CREATE INDEX idx_bookings_created ON appointment_bookings(created_at DESC);
CREATE INDEX idx_bookings_patient_status ON appointment_bookings(patient_id, status);
CREATE INDEX idx_bookings_branch_status_date ON appointment_bookings(branch_id, status, booking_date);

-- ============================================================
-- 3. Available time slots per branch per day
-- ============================================================
CREATE TABLE appointment_time_slots (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  branch_id       TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  slot_date       DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  max_capacity    INT NOT NULL DEFAULT 5,
  current_bookings INT NOT NULL DEFAULT 0,
  is_available    BOOLEAN NOT NULL DEFAULT true,
  is_peak_hour    BOOLEAN NOT NULL DEFAULT false,
  is_holiday      BOOLEAN NOT NULL DEFAULT false,
  holiday_name    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_branch_date_time UNIQUE (branch_id, slot_date, start_time)
);

CREATE INDEX idx_time_slots_branch_date ON appointment_time_slots(branch_id, slot_date);
CREATE INDEX idx_time_slots_available ON appointment_time_slots(branch_id, slot_date, is_available) WHERE is_available = true;
CREATE INDEX idx_time_slots_date ON appointment_time_slots(slot_date);

-- ============================================================
-- 4. Junction table tracking slot bookings (prevents double-booking)
-- ============================================================
CREATE TABLE appointment_slot_bookings (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slot_id         TEXT NOT NULL REFERENCES appointment_time_slots(id) ON DELETE CASCADE,
  booking_id      TEXT NOT NULL REFERENCES appointment_bookings(id) ON DELETE CASCADE,
  branch_id       TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  slot_date       DATE NOT NULL,
  start_time      TIME NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',
  locked_until    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_slot_booking UNIQUE (slot_id, booking_id)
);

CREATE INDEX idx_slot_bookings_slot ON appointment_slot_bookings(slot_id);
CREATE INDEX idx_slot_bookings_booking ON appointment_slot_bookings(booking_id);
CREATE INDEX idx_slot_bookings_branch_date ON appointment_slot_bookings(branch_id, slot_date);
CREATE INDEX idx_slot_bookings_locked ON appointment_slot_bookings(locked_until) WHERE locked_until IS NOT NULL;

-- ============================================================
-- 5. Payment records
-- ============================================================
CREATE TABLE appointment_payments (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id      TEXT NOT NULL REFERENCES appointment_bookings(id) ON DELETE CASCADE,
  amount          DOUBLE PRECISION NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'SAR',
  method          "BookingPaymentMethod" NOT NULL,
  status          "BookingPaymentStatus" NOT NULL DEFAULT 'pending',
  transaction_id  TEXT,
  gateway_response JSONB,
  card_last_four  TEXT,
  card_brand      TEXT,
  refunded_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  refund_reason   TEXT,
  refund_transaction_id TEXT,
  refunded_at     TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_booking ON appointment_payments(booking_id);
CREATE INDEX idx_payments_status ON appointment_payments(status);
CREATE INDEX idx_payments_transaction ON appointment_payments(transaction_id);

-- ============================================================
-- 6. Notification log (SMS, email, WhatsApp, push)
-- ============================================================
CREATE TABLE appointment_notifications (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id      TEXT NOT NULL REFERENCES appointment_bookings(id) ON DELETE CASCADE,
  channel         "NotificationChannel" NOT NULL,
  recipient       TEXT NOT NULL,
  subject         TEXT,
  body            TEXT NOT NULL,
  status          "NotificationStatus" NOT NULL DEFAULT 'pending',
  error_message   TEXT,
  external_id     TEXT,
  sent_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  read_at         TIMESTAMPTZ,
  retry_count     INT NOT NULL DEFAULT 0,
  max_retries     INT NOT NULL DEFAULT 3,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_booking ON appointment_notifications(booking_id);
CREATE INDEX idx_notifications_status ON appointment_notifications(status);
CREATE INDEX idx_notifications_channel ON appointment_notifications(channel);
CREATE INDEX idx_notifications_recipient ON appointment_notifications(recipient);

-- ============================================================
-- 7. Calendar integration tracking
-- ============================================================
CREATE TABLE appointment_calendar_sync (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id      TEXT NOT NULL REFERENCES appointment_bookings(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL DEFAULT 'internal',
  calendar_id     TEXT,
  event_id        TEXT,
  ics_content     TEXT,
  sync_status     TEXT NOT NULL DEFAULT 'pending',
  last_synced_at  TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_calendar_booking UNIQUE (booking_id, provider)
);

CREATE INDEX idx_calendar_booking ON appointment_calendar_sync(booking_id);

-- ============================================================
-- 8. Real-time crowd/capacity per branch
-- ============================================================
CREATE TABLE branch_crowd_status (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  branch_id       TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  current_count   INT NOT NULL DEFAULT 0,
  max_capacity    INT NOT NULL DEFAULT 50,
  crowd_level     "CrowdLevel" NOT NULL DEFAULT 'low',
  estimated_wait_minutes INT NOT NULL DEFAULT 0,
  active_bookings INT NOT NULL DEFAULT 0,
  checked_in_count INT NOT NULL DEFAULT 0,
  served_today    INT NOT NULL DEFAULT 0,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_branch_crowd UNIQUE (branch_id)
);

CREATE INDEX idx_crowd_branch ON branch_crowd_status(branch_id);
CREATE INDEX idx_crowd_level ON branch_crowd_status(crowd_level);

-- ============================================================
-- Triggers for updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_appointment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_appointment_services_updated_at
  BEFORE UPDATE ON appointment_services
  FOR EACH ROW EXECUTE FUNCTION update_appointment_updated_at();

CREATE TRIGGER trg_appointment_bookings_updated_at
  BEFORE UPDATE ON appointment_bookings
  FOR EACH ROW EXECUTE FUNCTION update_appointment_updated_at();

CREATE TRIGGER trg_time_slots_updated_at
  BEFORE UPDATE ON appointment_time_slots
  FOR EACH ROW EXECUTE FUNCTION update_appointment_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON appointment_payments
  FOR EACH ROW EXECUTE FUNCTION update_appointment_updated_at();

CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON appointment_notifications
  FOR EACH ROW EXECUTE FUNCTION update_appointment_updated_at();

CREATE TRIGGER trg_calendar_sync_updated_at
  BEFORE UPDATE ON appointment_calendar_sync
  FOR EACH ROW EXECUTE FUNCTION update_appointment_updated_at();

CREATE TRIGGER trg_crowd_status_updated_at
  BEFORE UPDATE ON branch_crowd_status
  FOR EACH ROW EXECUTE FUNCTION update_appointment_updated_at();

-- ============================================================
-- Trigger: Auto-update slot current_bookings on slot_booking insert/delete
-- ============================================================
CREATE OR REPLACE FUNCTION update_slot_booking_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE appointment_time_slots
    SET current_bookings = current_bookings + 1,
        is_available = (current_bookings + 1) < max_capacity
    WHERE id = NEW.slot_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE appointment_time_slots
    SET current_bookings = GREATEST(current_bookings - 1, 0),
        is_available = true
    WHERE id = OLD.slot_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_slot_booking_count_insert
  AFTER INSERT ON appointment_slot_bookings
  FOR EACH ROW EXECUTE FUNCTION update_slot_booking_count();

CREATE TRIGGER trg_slot_booking_count_delete
  AFTER DELETE ON appointment_slot_bookings
  FOR EACH ROW EXECUTE FUNCTION update_slot_booking_count();

-- ============================================================
-- Trigger: Auto-calculate crowd level from current_count
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_crowd_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.max_capacity > 0 THEN
    NEW.crowd_level = CASE
      WHEN (NEW.current_count::double precision / NEW.max_capacity) < 0.5 THEN 'low'
      WHEN (NEW.current_count::double precision / NEW.max_capacity) < 0.8 THEN 'medium'
      ELSE 'high'
    END::"CrowdLevel";
  END IF;
  NEW.recorded_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_crowd_level_calculation
  BEFORE UPDATE OF current_count ON branch_crowd_status
  FOR EACH ROW EXECUTE FUNCTION calculate_crowd_level();
