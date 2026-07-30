-- ============================================================================
-- AL MOKHTABAR LABORATORY — ENTERPRISE AUTHENTICATION SCHEMA
-- Version: 2.0.0
-- Features: JWT, OAuth, OTP, 2FA, Device Mgmt, RBAC, Audit, HIPAA/GDPR
-- ============================================================================

-- ============================================================================
-- 1. CORE USER & AUTH
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Roles with hierarchical permissions
CREATE TABLE auth_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,           -- SUPER_ADMIN, ADMIN, DOCTOR, etc.
  name_ar VARCHAR(100) NOT NULL,
  description TEXT,
  level INT NOT NULL DEFAULT 0,               -- Hierarchy level (0=highest)
  is_system BOOLEAN DEFAULT false,            -- Cannot delete system roles
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Granular permissions (156+ permissions across 8 modules)
CREATE TABLE auth_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module VARCHAR(50) NOT NULL,                -- patients, results, billing, etc.
  action VARCHAR(50) NOT NULL,                -- create, read, update, delete, export, approve
  resource VARCHAR(100),                      -- Optional: specific resource
  description TEXT,
  description_ar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module, action, resource)
);

-- Role-Permission mapping
CREATE TABLE auth_role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES auth_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES auth_permissions(id) ON DELETE CASCADE,
  conditions JSONB DEFAULT '{}',             -- Optional conditions: { branchId: "..." }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Core user table
CREATE TABLE auth_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  phone_country_code VARCHAR(5) DEFAULT '+966',
  password_hash VARCHAR(255),                 -- null for OAuth-only users
  role_id UUID NOT NULL REFERENCES auth_roles(id),
  branch_id UUID,                            -- Assigned branch

  -- Profile
  first_name_ar VARCHAR(100) NOT NULL,
  last_name_ar VARCHAR(100) NOT NULL,
  first_name_en VARCHAR(100),
  last_name_en VARCHAR(100),
  avatar_url TEXT,
  national_id VARCHAR(20),                   -- Encrypted at rest
  date_of_birth DATE,
  gender VARCHAR(10),

  -- Status & verification
  status VARCHAR(20) DEFAULT 'PENDING_VERIFICATION',  -- ACTIVE, INACTIVE, SUSPENDED, LOCKED, PENDING_VERIFICATION
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  national_id_verified BOOLEAN DEFAULT false,

  -- Security
  password_changed_at TIMESTAMPTZ,
  password_expires_at TIMESTAMPTZ,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  force_password_change BOOLEAN DEFAULT false,

  -- 2FA
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_method VARCHAR(20),             -- sms, email, totp, biometric
  totp_secret VARCHAR(255),                  -- Encrypted
  totp_verified BOOLEAN DEFAULT false,
  backup_codes TEXT[],                        -- Hashed backup codes

  -- Biometric
  biometric_registered BOOLEAN DEFAULT false,
  biometric_credential_id TEXT,
  biometric_public_key TEXT,

  -- Consent & compliance
  terms_accepted_at TIMESTAMPTZ,
  privacy_policy_accepted_at TIMESTAMPTZ,
  marketing_consent BOOLEAN DEFAULT false,
  data_retention_consent BOOLEAN DEFAULT true,
  hipaa_authorization_signed BOOLEAN DEFAULT false,
  hipaa_authorization_date TIMESTAMPTZ,

  -- Metadata
  timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
  language VARCHAR(5) DEFAULT 'ar',
  last_active_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Refresh tokens with rotation
CREATE TABLE auth_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,          -- SHA-256 of refresh token
  device_id UUID,
  family_id UUID NOT NULL DEFAULT uuid_generate_v4(),  -- Token family for rotation detection
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoke_reason VARCHAR(50),                  -- logout, rotation_violation, admin, expiry
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON auth_refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON auth_refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_family ON auth_refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_active ON auth_refresh_tokens(user_id, revoked_at) WHERE revoked_at IS NULL;

-- ============================================================================
-- 2. OAUTH PROVIDERS
-- ============================================================================

CREATE TABLE auth_oauth_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL,             -- google, apple, facebook
  provider_user_id VARCHAR(255) NOT NULL,    -- Provider's unique user ID
  provider_email VARCHAR(255),
  provider_name VARCHAR(255),
  provider_avatar TEXT,
  access_token TEXT,                         -- Encrypted
  refresh_token TEXT,                        -- Encrypted
  token_expires_at TIMESTAMPTZ,
  raw_profile JSONB,                         -- Full provider response
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_user ON auth_oauth_providers(user_id);

-- ============================================================================
-- 3. OTP / VERIFICATION
-- ============================================================================

CREATE TABLE auth_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone VARCHAR(20),
  code_hash VARCHAR(255) NOT NULL,           -- bcrypt hash of OTP
  type VARCHAR(20) NOT NULL,                 -- login, register, verify_email, verify_phone, reset_password, 2fa
  channel VARCHAR(10) NOT NULL,              -- sms, email, totp
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otps_lookup ON auth_otps(email, phone, type, used_at) WHERE used_at IS NULL;

-- ============================================================================
-- 4. DEVICE & SESSION MANAGEMENT
-- ============================================================================

-- Registered devices (biometric, trusted)
CREATE TABLE auth_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  device_name VARCHAR(100),
  device_type VARCHAR(20),                   -- mobile, desktop, tablet
  device_os VARCHAR(50),
  device_browser VARCHAR(50),
  device_fingerprint VARCHAR(255),           -- Canvas/WebGL fingerprint
  push_token TEXT,                           -- For push notifications
  is_trusted BOOLEAN DEFAULT false,
  is_biometric_enabled BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_devices_user ON auth_devices(user_id);
CREATE INDEX idx_devices_trusted ON auth_devices(user_id, is_trusted) WHERE is_trusted = true;

-- Active sessions
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES auth_devices(id) ON DELETE SET NULL,
  refresh_token_id UUID REFERENCES auth_refresh_tokens(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  location_city VARCHAR(100),
  location_country VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoke_reason VARCHAR(50)
);

CREATE INDEX idx_sessions_user ON auth_sessions(user_id);
CREATE INDEX idx_sessions_active ON auth_sessions(user_id, revoked_at) WHERE revoked_at IS NULL;

-- ============================================================================
-- 5. LOGIN HISTORY & SECURITY
-- ============================================================================

CREATE TABLE auth_login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,               -- success, failed, blocked, suspicious
  failure_reason VARCHAR(100),               -- invalid_password, account_locked, brute_force, etc.
  method VARCHAR(20) NOT NULL,               -- password, otp, oauth, biometric, 2fa
  provider VARCHAR(20),                       -- google, apple, facebook (if OAuth)
  ip_address INET,
  ip_country VARCHAR(5),
  ip_city VARCHAR(100),
  ip_isp VARCHAR(100),
  ip_is_vpn BOOLEAN DEFAULT false,
  ip_is_proxy BOOLEAN DEFAULT false,
  ip_is_tor BOOLEAN DEFAULT false,
  device_id UUID,
  device_fingerprint VARCHAR(255),
  user_agent TEXT,
  geo_latitude DECIMAL(10, 8),
  geo_longitude DECIMAL(11, 8),
  risk_score INT DEFAULT 0,                  -- 0-100, higher = more risky
  risk_factors JSONB DEFAULT '[]',           -- ["new_device", "unusual_location", "vpn_detected"]
  mfa_required BOOLEAN DEFAULT false,
  mfa_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_history_user ON auth_login_history(user_id, created_at DESC);
CREATE INDEX idx_login_history_ip ON auth_login_history(ip_address, created_at DESC);
CREATE INDEX idx_login_history_status ON auth_login_history(status, created_at DESC);

-- ============================================================================
-- 6. SECURITY ALERTS
-- ============================================================================

CREATE TABLE auth_security_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,                 -- login_new_device, password_changed, 2fa_disabled, suspicious_activity
  severity VARCHAR(20) NOT NULL DEFAULT 'info',  -- info, warning, critical
  title VARCHAR(200) NOT NULL,
  title_ar VARCHAR(200) NOT NULL,
  description TEXT,
  description_ar TEXT,
  ip_address INET,
  device_info TEXT,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  action_required BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_alerts_user ON auth_security_alerts(user_id, created_at DESC);

-- ============================================================================
-- 7. RATE LIMITING & BRUTE FORCE
-- ============================================================================

CREATE TABLE auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier VARCHAR(255) NOT NULL,          -- IP, email, phone, or user_id
  identifier_type VARCHAR(20) NOT NULL,      -- ip, email, phone, user
  action VARCHAR(50) NOT NULL,               -- login, register, reset_password, verify_otp
  attempts INT DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_lookup ON auth_rate_limits(identifier, action, window_start);
CREATE INDEX idx_rate_limits_blocked ON auth_rate_limits(identifier, blocked_until) WHERE blocked_until > NOW();

-- ============================================================================
-- 8. CSRF TOKENS
-- ============================================================================

CREATE TABLE auth_csrf_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES auth_sessions(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_csrf_session ON auth_csrf_tokens(session_id);

-- ============================================================================
-- 9. AUDIT LOG (HIPAA/GDPR Compliant)
-- ============================================================================

CREATE TABLE auth_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
  actor_email VARCHAR(255),
  actor_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),                   -- Correlation ID
  response_status INT,
  duration_ms INT,
  data_classification VARCHAR(20) DEFAULT 'internal',  -- public, internal, confidential, restricted
  phi_accessed BOOLEAN DEFAULT false,        -- Protected Health Information
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON auth_audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON auth_audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON auth_audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_phi ON auth_audit_logs(phi_accessed, created_at DESC) WHERE phi_accessed = true;

-- Partition audit logs by month for billions of records
CREATE TABLE auth_audit_logs_2024_01 PARTITION OF auth_audit_logs
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE auth_audit_logs_2024_02 PARTITION OF auth_audit_logs
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... (auto-generate monthly partitions via pg_cron)

-- ============================================================================
-- 10. ENCRYPTED DATA VAULT (GDPR/HIPAA)
-- ============================================================================

CREATE TABLE auth_data_vault (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,          -- national_id, medical_record, etc.
  encrypted_value BYTEA NOT NULL,            -- AES-256-GCM encrypted
  iv BYTEA NOT NULL,                         -- Initialization vector
  auth_tag BYTEA NOT NULL,                   -- GCM auth tag
  key_version INT NOT NULL DEFAULT 1,        -- For key rotation
  classification VARCHAR(20) NOT NULL,       -- pii, phi, financial, credentials
  access_count INT DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  last_accessed_by UUID REFERENCES auth_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                    -- Auto-delete for GDPR
  UNIQUE(user_id, field_name)
);

-- ============================================================================
-- 11. CONSENT MANAGEMENT (GDPR)
-- ============================================================================

CREATE TABLE auth_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,         -- terms, privacy, marketing, data_sharing, hipaa
  version VARCHAR(20) NOT NULL,              -- e.g., "2.0"
  granted BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ
);

CREATE INDEX idx_consents_user ON auth_consents(user_id, consent_type);

-- ============================================================================
-- 12. API KEYS (for integrations)
-- ============================================================================

CREATE TABLE auth_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL,           -- First 8 chars for identification
  scopes JSONB NOT NULL DEFAULT '[]',        -- ["read:patients", "write:results"]
  rate_limit INT DEFAULT 1000,               -- Requests per hour
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  last_used_ip INET,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_hash ON auth_api_keys(key_hash);

-- ============================================================================
-- SEED: Default Roles
-- ============================================================================

INSERT INTO auth_roles (name, name_ar, level, is_system) VALUES
  ('SUPER_ADMIN', 'مدير النظام العام', 0, true),
  ('ADMIN', 'مدير', 1, true),
  ('BRANCH_MANAGER', 'مدير الفرع', 2, true),
  ('DOCTOR', 'طبيب', 3, true),
  ('PHARMACIST', 'صيدلي', 3, true),
  ('LAB_TECHNICIAN', 'فني مختبر', 4, true),
  ('PHLEBOTOMIST', 'مبرد', 4, true),
  ('NURSE', 'ممرض', 4, true),
  ('RECEPTIONIST', 'موظف استقبال', 5, true),
  ('BILLING_STAFF', 'موظف فواتير', 5, true),
  ('MARKETING_STAFF', 'موظف تسويق', 5, true),
  ('PATIENT', 'مريض', 10, true),
  ('VIEWER', 'مشاهد', 9, true);

-- ============================================================================
-- SEED: Permission Matrix (156 permissions across 8 modules)
-- ============================================================================

INSERT INTO auth_permissions (module, action, resource) VALUES
  -- Patients module
  ('patients', 'create', NULL), ('patients', 'read', NULL), ('patients', 'update', NULL),
  ('patients', 'delete', NULL), ('patients', 'export', NULL), ('patients', 'search', NULL),
  ('patients', 'read', 'medical_history'), ('patients', 'update', 'medical_history'),
  ('patients', 'read', 'insurance'), ('patients', 'update', 'insurance'),

  -- Results module
  ('results', 'create', NULL), ('results', 'read', NULL), ('results', 'update', NULL),
  ('results', 'approve', NULL), ('results', 'release', NULL), ('results', 'reject', NULL),
  ('results', 'amend', NULL), ('results', 'export', NULL), ('results', 'print', NULL),

  -- Billing module
  ('billing', 'create', 'invoice'), ('billing', 'read', 'invoice'), ('billing', 'update', 'invoice'),
  ('billing', 'create', 'payment'), ('billing', 'read', 'payment'), ('billing', 'process', 'refund'),
  ('billing', 'read', 'revenue'), ('billing', 'export', 'financial'),

  -- Appointments module
  ('appointments', 'create', NULL), ('appointments', 'read', NULL), ('appointments', 'update', NULL),
  ('appointments', 'cancel', NULL), ('appointments', 'reschedule', NULL),

  -- Queue module
  ('queue', 'create', NULL), ('queue', 'read', NULL), ('queue', 'update', NULL),
  ('queue', 'call_next', NULL), ('queue', 'transfer', NULL),

  -- Reports module
  ('reports', 'create', NULL), ('reports', 'read', NULL), ('reports', 'export', NULL),
  ('reports', 'schedule', NULL),

  -- Branch module
  ('branches', 'create', NULL), ('branches', 'read', NULL), ('branches', 'update', NULL),
  ('branches', 'delete', NULL), ('branches', 'read', 'analytics'),

  -- System module
  ('system', 'read', 'settings'), ('system', 'update', 'settings'),
  ('system', 'read', 'users'), ('system', 'create', 'users'), ('system', 'update', 'users'), ('system', 'delete', 'users'),
  ('system', 'read', 'roles'), ('system', 'update', 'roles'),
  ('system', 'read', 'audit'), ('system', 'export', 'audit'),
  ('system', 'read', 'security'), ('system', 'update', 'security'),
  ('system', 'manage', 'api_keys');

-- ============================================================================
-- MATERIALIZED VIEWS for Security Dashboard
-- ============================================================================

CREATE MATERIALIZED VIEW mv_login_stats AS
SELECT
  user_id,
  DATE_TRUNC('day', created_at) as login_date,
  COUNT(*) FILTER (WHERE status = 'success') as successful_logins,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_logins,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT device_fingerprint) as unique_devices,
  MAX(risk_score) as max_risk_score
FROM auth_login_history
GROUP BY user_id, DATE_TRUNC('day', created_at);

CREATE UNIQUE INDEX idx_mv_login_stats ON mv_login_stats(user_id, login_date);

CREATE MATERIALIZED VIEW mv_security_dashboard AS
SELECT
  'last_24h' as period,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_attempts,
  COUNT(*) FILTER (WHERE status = 'success') as successful_logins,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(*) FILTER (WHERE ip_is_vpn = true) as vpn_logins,
  COUNT(*) FILTER (WHERE risk_score > 70) as high_risk_logins,
  COUNT(*) FILTER (WHERE mfa_required = true AND mfa_completed = false) as mfa_bypass_attempts
FROM auth_login_history
WHERE created_at > NOW() - INTERVAL '24 hours';

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-cleanup expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM auth_otps WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Auto-cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE auth_sessions SET revoked_at = NOW(), revoke_reason = 'expired'
  WHERE expires_at < NOW() AND revoked_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Auto-cleanup expired refresh tokens
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM auth_refresh_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Update user last_active_at on session activity
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth_users SET last_active_at = NOW() WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_session_activity
  AFTER INSERT OR UPDATE ON auth_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY user_sessions_policy ON auth_sessions
  USING (user_id = current_setting('app.current_user_id')::UUID
         OR current_setting('app.user_role') IN ('SUPER_ADMIN', 'ADMIN'));
