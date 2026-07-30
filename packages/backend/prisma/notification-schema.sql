-- ============================================================================
-- ELM5TBER Enterprise Notification System - PostgreSQL Schema
-- Production-ready with partitioning, triggers, materialized views, and seed data
-- Full Arabic/English bilingual support
-- ============================================================================

BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE notification_channel AS ENUM (
    'SMS',
    'WHATSAPP',
    'EMAIL',
    'PUSH',
    'IN_APP',
    'VOICE_CALL'
);

CREATE TYPE notification_type AS ENUM (
    'APPOINTMENT_CONFIRMATION',
    'APPOINTMENT_REMINDER',
    'QUEUE_UPDATE',
    'HOME_VISIT_UPDATE',
    'PAYMENT_SUCCESS',
    'INVOICE_READY',
    'RESULT_READY',
    'CRITICAL_RESULT_ALERT',
    'DOCTOR_MESSAGE',
    'MARKETING_CAMPAIGN',
    'NEWSLETTER',
    'BIRTHDAY_GREETINGS',
    'INSURANCE_EXPIRY',
    'WELCOME',
    'PASSWORD_CHANGED',
    'ACCOUNT_LOCKED'
);

CREATE TYPE delivery_status AS ENUM (
    'PENDING',
    'QUEUED',
    'PROCESSING',
    'SENT',
    'DELIVERED',
    'READ',
    'FAILED',
    'BOUNCED',
    'CANCELLED'
);

CREATE TYPE notification_priority AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'CRITICAL'
);

CREATE TYPE template_variable_type AS ENUM (
    'STRING',
    'NUMBER',
    'DATE',
    'BOOLEAN',
    'ARRAY',
    'OBJECT'
);

CREATE TYPE batch_status AS ENUM (
    'DRAFT',
    'SCHEDULED',
    'SENDING',
    'COMPLETED',
    'CANCELLED',
    'PARTIALLY_FAILED'
);

CREATE TYPE push_token_provider AS ENUM (
    'FCM',
    'APNS',
    'WEB'
);

CREATE TYPE audit_action AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'SEND',
    'RETRY',
    'CANCEL',
    'RATE_LIMITED'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1. NOTIFICATION TEMPLATES
CREATE TABLE notification_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            notification_type NOT NULL,
    channel         notification_channel NOT NULL,
    title_ar        VARCHAR(500),
    title_en        VARCHAR(500),
    body_ar         TEXT,
    body_en         TEXT,
    sms_body_ar     TEXT,
    sms_body_en     TEXT,
    push_title_ar   VARCHAR(500),
    push_title_en   VARCHAR(500),
    push_body_ar    TEXT,
    push_body_en    TEXT,
    variables       JSONB DEFAULT '[]'::jsonb,
    variables_ar_description TEXT,
    variables_en_description TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    version         INTEGER NOT NULL DEFAULT 1,
    created_by      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT uq_template_type_channel_version UNIQUE (type, channel, version)
);

CREATE INDEX idx_nt_active ON notification_templates (is_active) WHERE is_active = true;
CREATE INDEX idx_nt_type ON notification_templates (type);
CREATE INDEX idx_nt_channel ON notification_templates (channel);

-- 2. NOTIFICATION PREFERENCES
CREATE TABLE notification_preferences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    channel         notification_channel NOT NULL,
    type            notification_type NOT NULL,
    enabled         BOOLEAN NOT NULL DEFAULT true,
    quiet_hours_start TIME,
    quiet_hours_end   TIME,
    days_of_week    JSONB DEFAULT '["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]'::jsonb,
    max_per_day     INTEGER,
    last_sent_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_channel_type UNIQUE (user_id, channel, type)
);

CREATE INDEX idx_np_user ON notification_preferences (user_id);

-- 3. NOTIFICATION QUEUE (partitioned by month)
CREATE TABLE notification_queue (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    type            notification_type NOT NULL,
    channel         notification_channel NOT NULL,
    priority        notification_priority NOT NULL DEFAULT 'NORMAL',
    title_ar        VARCHAR(500),
    title_en        VARCHAR(500),
    body_ar         TEXT,
    body_en         TEXT,
    variables       JSONB DEFAULT '{}'::jsonb,
    scheduled_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    max_retries     INTEGER NOT NULL DEFAULT 3,
    retry_count     INTEGER NOT NULL DEFAULT 0,
    last_retry_at   TIMESTAMPTZ,
    next_retry_at   TIMESTAMPTZ,
    status          delivery_status NOT NULL DEFAULT 'PENDING',
    error_message   TEXT,
    batch_id        UUID,
    campaign_id     UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_nq_status_retry ON notification_queue (status, next_retry_at) WHERE status IN ('PENDING', 'FAILED');
CREATE INDEX idx_nq_scheduled_status ON notification_queue (scheduled_at, status) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_nq_user_created ON notification_queue (user_id, created_at DESC);
CREATE INDEX idx_nq_type_channel ON notification_queue (type, channel);
CREATE INDEX idx_nq_batch ON notification_queue (batch_id);
CREATE INDEX idx_nq_campaign ON notification_queue (campaign_id);
CREATE INDEX idx_nq_priority ON notification_queue (priority, created_at DESC) WHERE priority IN ('HIGH', 'CRITICAL');
CREATE INDEX idx_nq_expires ON notification_queue (expires_at) WHERE expires_at IS NOT NULL;

-- 4. NOTIFICATION DELIVERY LOG (partitioned by month)
CREATE TABLE notification_delivery_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id            UUID NOT NULL,
    user_id             UUID NOT NULL,
    channel             notification_channel NOT NULL,
    type                notification_type NOT NULL,
    status              delivery_status NOT NULL,
    provider_response   JSONB,
    delivery_receipt_at TIMESTAMPTZ,
    read_at             TIMESTAMPTZ,
    clicked_at          TIMESTAMPTZ,
    error_code          VARCHAR(100),
    error_message       TEXT,
    attempt_number      INTEGER NOT NULL DEFAULT 1,
    duration_ms         INTEGER,
    ip_address          INET,
    user_agent          TEXT,
    device_token        VARCHAR(500),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_ndl_queue ON notification_delivery_log (queue_id);
CREATE INDEX idx_ndl_user_created ON notification_delivery_log (user_id, created_at DESC);
CREATE INDEX idx_ndl_channel_status_created ON notification_delivery_log (channel, status, created_at DESC);
CREATE INDEX idx_ndl_type_created ON notification_delivery_log (type, created_at DESC);
CREATE INDEX idx_ndl_status ON notification_delivery_log (status);

-- 5. NOTIFICATION BATCHES
CREATE TABLE notification_batches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name_ar   VARCHAR(500),
    batch_name_en   VARCHAR(500),
    type            notification_type NOT NULL,
    channel         notification_channel NOT NULL,
    status          batch_status NOT NULL DEFAULT 'DRAFT',
    total_recipients INTEGER NOT NULL DEFAULT 0,
    success_count   INTEGER NOT NULL DEFAULT 0,
    failed_count    INTEGER NOT NULL DEFAULT 0,
    scheduled_at    TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_by      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nb_status_scheduled ON notification_batches (status, scheduled_at);

-- 6. NOTIFICATION CAMPAIGNS
CREATE TABLE notification_campaigns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar         VARCHAR(500),
    name_en         VARCHAR(500),
    type            notification_type NOT NULL,
    channels        JSONB NOT NULL DEFAULT '[]'::jsonb,
    audience_query  JSONB,
    title_ar        VARCHAR(500),
    title_en        VARCHAR(500),
    body_ar         TEXT,
    body_en         TEXT,
    variables       JSONB DEFAULT '{}'::jsonb,
    scheduled_at    TIMESTAMPTZ,
    status          batch_status NOT NULL DEFAULT 'DRAFT',
    total_recipients INTEGER NOT NULL DEFAULT 0,
    sent_count      INTEGER NOT NULL DEFAULT 0,
    open_count      INTEGER NOT NULL DEFAULT 0,
    click_count     INTEGER NOT NULL DEFAULT 0,
    created_by      UUID,
    approved_by     UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nc_status ON notification_campaigns (status);

-- 7. NOTIFICATION ANALYTICS DAILY (partitioned by quarter)
CREATE TABLE notification_analytics_daily (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date                DATE NOT NULL,
    type                notification_type NOT NULL,
    channel             notification_channel NOT NULL,
    sent_count          INTEGER NOT NULL DEFAULT 0,
    delivered_count     INTEGER NOT NULL DEFAULT 0,
    read_count          INTEGER NOT NULL DEFAULT 0,
    clicked_count       INTEGER NOT NULL DEFAULT 0,
    failed_count        INTEGER NOT NULL DEFAULT 0,
    bounced_count       INTEGER NOT NULL DEFAULT 0,
    avg_delivery_time_ms FLOAT,
    total_duration_ms   BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uq_analytics_date_type_channel UNIQUE (date, type, channel)
) PARTITION BY RANGE (date);

CREATE INDEX idx_nad_date ON notification_analytics_daily (date DESC);
CREATE INDEX idx_nad_type ON notification_analytics_daily (type);
CREATE INDEX idx_nad_channel ON notification_analytics_daily (channel);

-- 8. NOTIFICATION DEVICES
CREATE TABLE notification_devices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    device_id           UUID,
    push_token          VARCHAR(500),
    push_token_provider push_token_provider,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nd_push_token ON notification_devices (push_token) WHERE push_token IS NOT NULL;
CREATE INDEX idx_nd_user ON notification_devices (user_id);
CREATE INDEX idx_nd_user_active ON notification_devices (user_id) WHERE is_active = true;

-- 9. NOTIFICATION CHANNEL CONFIG
CREATE TABLE notification_channel_config (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel             notification_channel NOT NULL,
    provider_name       VARCHAR(100) NOT NULL,
    credentials         JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    rate_limit_per_min  INTEGER NOT NULL DEFAULT 60,
    rate_limit_per_hour INTEGER NOT NULL DEFAULT 1000,
    daily_limit         INTEGER NOT NULL DEFAULT 10000,
    priority            INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ncc_channel_active ON notification_channel_config (channel) WHERE is_active = true;

-- 10. NOTIFICATION AUDIT
CREATE TABLE notification_audit (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action          audit_action NOT NULL,
    queue_id        UUID,
    user_id         UUID,
    actor_id        UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_na_created ON notification_audit (created_at DESC);
CREATE INDEX idx_na_queue ON notification_audit (queue_id);
CREATE INDEX idx_na_user ON notification_audit (user_id);
CREATE INDEX idx_na_actor ON notification_audit (actor_id);

-- ============================================================================
-- PARTITIONS - notification_queue (monthly)
-- ============================================================================

-- Create partitions for 2024-2026 (36 months)
DO $$
DECLARE
    start_date DATE := '2024-01-01';
    end_date DATE := '2027-01-01';
    partition_date DATE;
    partition_name TEXT;
    month_end DATE;
BEGIN
    partition_date := start_date;
    WHILE partition_date < end_date LOOP
        month_end := partition_date + INTERVAL '1 month';
        partition_name := 'notification_queue_' || TO_CHAR(partition_date, 'YYYY_MM');
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF notification_queue FOR VALUES FROM (%L) TO (%L)',
            partition_name, partition_date, month_end
        );
        partition_date := month_end;
    END LOOP;
END;
$$;

-- ============================================================================
-- PARTITIONS - notification_delivery_log (monthly)
-- ============================================================================

DO $$
DECLARE
    start_date DATE := '2024-01-01';
    end_date DATE := '2027-01-01';
    partition_date DATE;
    partition_name TEXT;
    month_end DATE;
BEGIN
    partition_date := start_date;
    WHILE partition_date < end_date LOOP
        month_end := partition_date + INTERVAL '1 month';
        partition_name := 'notification_delivery_log_' || TO_CHAR(partition_date, 'YYYY_MM');
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF notification_delivery_log FOR VALUES FROM (%L) TO (%L)',
            partition_name, partition_date, month_end
        );
        partition_date := month_end;
    END LOOP;
END;
$$;

-- ============================================================================
-- PARTITIONS - notification_analytics_daily (quarterly)
-- ============================================================================

DO $$
DECLARE
    start_date DATE := '2024-01-01';
    end_date DATE := '2027-01-01';
    quarter_start DATE;
    quarter_end DATE;
    partition_name TEXT;
BEGIN
    quarter_start := start_date;
    WHILE quarter_start < end_date LOOP
        quarter_end := quarter_start + INTERVAL '3 months';
        partition_name := 'notification_analytics_daily_' || TO_CHAR(quarter_start, 'YYYY_') || TO_CHAR(quarter_start, 'Q');
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF notification_analytics_daily FOR VALUES FROM (%L) TO (%L)',
            partition_name, quarter_start, quarter_end
        );
        quarter_start := quarter_end;
    END LOOP;
END;
$$;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- 1. AUTO-UPDATE ANALYTICS
CREATE OR REPLACE FUNCTION auto_update_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    delivery_duration_ms INTEGER;
BEGIN
    delivery_duration_ms := NEW.duration_ms;

    INSERT INTO notification_analytics_daily (date, type, channel, sent_count, delivered_count, read_count, clicked_count, failed_count, bounced_count, avg_delivery_time_ms, total_duration_ms)
    VALUES (
        NEW.created_at::DATE,
        NEW.type,
        NEW.channel,
        CASE WHEN NEW.status IN ('SENT', 'DELIVERED', 'READ') THEN 1 ELSE 0 END,
        CASE WHEN NEW.status IN ('DELIVERED', 'READ') THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'READ' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'READ' AND NEW.clicked_at IS NOT NULL THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'FAILED' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'BOUNCED' THEN 1 ELSE 0 END,
        CASE WHEN delivery_duration_ms IS NOT NULL THEN delivery_duration_ms ELSE 0 END,
        CASE WHEN delivery_duration_ms IS NOT NULL THEN delivery_duration_ms ELSE 0 END
    )
    ON CONFLICT (date, type, channel) DO UPDATE SET
        sent_count          = notification_analytics_daily.sent_count + EXCLUDED.sent_count,
        delivered_count     = notification_analytics_daily.delivered_count + EXCLUDED.delivered_count,
        read_count          = notification_analytics_daily.read_count + EXCLUDED.read_count,
        clicked_count       = notification_analytics_daily.clicked_count + EXCLUDED.clicked_count,
        failed_count        = notification_analytics_daily.failed_count + EXCLUDED.failed_count,
        bounced_count       = notification_analytics_daily.bounced_count + EXCLUDED.bounced_count,
        total_duration_ms   = notification_analytics_daily.total_duration_ms + EXCLUDED.total_duration_ms,
        avg_delivery_time_ms = CASE
            WHEN (notification_analytics_daily.sent_count + EXCLUDED.sent_count) > 0
            THEN (notification_analytics_daily.total_duration_ms + EXCLUDED.total_duration_ms)::FLOAT
                 / (notification_analytics_daily.sent_count + EXCLUDED.sent_count)
            ELSE 0
        END;

    RETURN NEW;
END;
$$;

-- 2. CLEANUP EXPIRED NOTIFICATIONS
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notification_queue
    WHERE created_at < NOW() - INTERVAL '30 days'
      AND status IN ('DELIVERED', 'READ', 'FAILED', 'BOUNCED', 'CANCELLED');
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    DELETE FROM notification_delivery_log
    WHERE created_at < NOW() - INTERVAL '30 days';

    RETURN deleted_count;
END;
$$;

-- 3. ENFORCE RATE LIMIT
CREATE OR REPLACE FUNCTION enforce_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    recent_count INTEGER;
    config_record RECORD;
BEGIN
    SELECT rate_limit_per_min, rate_limit_per_hour, daily_limit
    INTO config_record
    FROM notification_channel_config
    WHERE channel = NEW.channel AND is_active = true
    ORDER BY priority ASC
    LIMIT 1;

    IF config_record.rate_limit_per_min IS NOT NULL THEN
        SELECT COUNT(*)
        INTO recent_count
        FROM notification_delivery_log
        WHERE channel = NEW.channel
          AND created_at > NOW() - INTERVAL '1 minute';

        IF recent_count >= config_record.rate_limit_per_min THEN
            INSERT INTO notification_audit (action, queue_id, user_id, new_values, ip_address)
            VALUES ('RATE_LIMITED', NEW.id, NEW.user_id,
                    jsonb_build_object('reason', 'per_minute_limit', 'limit', config_record.rate_limit_per_min),
                    NULL);
            NEW.next_retry_at := NOW() + INTERVAL '1 minute';
            NEW.status := 'FAILED';
            NEW.error_message := 'Rate limited: exceeded ' || config_record.rate_limit_per_min || ' per minute';
        END IF;
    END IF;

    IF config_record.rate_limit_per_hour IS NOT NULL AND NEW.status != 'FAILED' THEN
        SELECT COUNT(*)
        INTO recent_count
        FROM notification_delivery_log
        WHERE channel = NEW.channel
          AND created_at > NOW() - INTERVAL '1 hour';

        IF recent_count >= config_record.rate_limit_per_hour THEN
            INSERT INTO notification_audit (action, queue_id, user_id, new_values, ip_address)
            VALUES ('RATE_LIMITED', NEW.id, NEW.user_id,
                    jsonb_build_object('reason', 'per_hour_limit', 'limit', config_record.rate_limit_per_hour),
                    NULL);
            NEW.status := 'FAILED';
            NEW.error_message := 'Rate limited: exceeded ' || config_record.rate_limit_per_hour || ' per hour';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 4. PROCESS RETRY QUEUE
CREATE OR REPLACE FUNCTION process_retry_queue()
RETURNS TABLE(
    notification_id UUID,
    user_id_val UUID,
    channel_val notification_channel,
    type_val notification_type,
    retry_attempt INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    UPDATE notification_queue
    SET status = 'PENDING',
        retry_count = retry_count + 1,
        last_retry_at = NOW(),
        next_retry_at = CASE
            WHEN retry_count + 1 >= max_retries THEN NULL
            ELSE NOW() + (INTERVAL '1 minute') * (2 ^ (retry_count + 1))
        END,
        updated_at = NOW()
    WHERE id IN (
        SELECT id FROM notification_queue
        WHERE status IN ('FAILED', 'PENDING')
          AND retry_count < max_retries
          AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        ORDER BY priority DESC, next_retry_at ASC NULLS FIRST
        LIMIT 100
        FOR UPDATE SKIP LOCKED
    )
    RETURNING id, user_id, channel, type, retry_count;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_auto_update_analytics
    AFTER INSERT ON notification_delivery_log
    FOR EACH ROW
    WHEN (NEW.status IN ('SENT', 'DELIVERED', 'READ', 'FAILED', 'BOUNCED'))
    EXECUTE FUNCTION auto_update_analytics();

CREATE TRIGGER trg_enforce_rate_limit
    BEFORE INSERT ON notification_queue
    FOR EACH ROW
    WHEN (NEW.status = 'PENDING')
    EXECUTE FUNCTION enforce_rate_limit();

-- Auto-update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_queue_updated_at
    BEFORE UPDATE ON notification_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_campaigns_updated_at
    BEFORE UPDATE ON notification_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_devices_updated_at
    BEFORE UPDATE ON notification_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_channel_config_updated_at
    BEFORE UPDATE ON notification_channel_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger for notification_queue status changes
CREATE OR REPLACE FUNCTION audit_queue_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO notification_audit (action, queue_id, user_id, old_values, new_values)
        VALUES (
            CASE
                WHEN NEW.status = 'CANCELLED' THEN 'CANCEL'
                WHEN NEW.status = 'FAILED' AND OLD.status = 'PENDING' THEN 'SEND'
                WHEN OLD.status = 'FAILED' AND NEW.status = 'PENDING' THEN 'RETRY'
                ELSE 'UPDATE'
            END,
            NEW.id,
            NEW.user_id,
            jsonb_build_object('status', OLD.status, 'retry_count', OLD.retry_count),
            jsonb_build_object('status', NEW.status, 'retry_count', NEW.retry_count, 'error_message', NEW.error_message)
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_queue_audit
    AFTER UPDATE OF status ON notification_queue
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION audit_queue_status_change();

-- ============================================================================
-- MATERIALIZED VIEWS
-- ============================================================================

-- 1. Last 24 hours stats by channel and type
CREATE MATERIALIZED VIEW mv_notification_stats_24h AS
SELECT
    ndl.channel,
    ndl.type,
    ndl.status,
    COUNT(*) AS count,
    COUNT(DISTINCT ndl.user_id) AS unique_users,
    COALESCE(AVG(ndl.duration_ms) FILTER (WHERE ndl.duration_ms IS NOT NULL), 0)::FLOAT AS avg_duration_ms,
    MAX(ndl.created_at) AS last_activity
FROM notification_delivery_log ndl
WHERE ndl.created_at > NOW() - INTERVAL '24 hours'
GROUP BY ndl.channel, ndl.type, ndl.status
ORDER BY ndl.channel, ndl.type, ndl.status;

CREATE UNIQUE INDEX idx_mv_stats_24h ON mv_notification_stats_24h (channel, type, status);

-- 2. Channel performance
CREATE MATERIALIZED VIEW mv_channel_performance AS
SELECT
    ndl.channel,
    COUNT(*) AS total_attempts,
    COUNT(*) FILTER (WHERE ndl.status = 'DELIVERED') AS delivered_count,
    COUNT(*) FILTER (WHERE ndl.status = 'READ') AS read_count,
    COUNT(*) FILTER (WHERE ndl.status = 'FAILED') AS failed_count,
    COUNT(*) FILTER (WHERE ndl.status = 'BOUNCED') AS bounced_count,
    CASE
        WHEN COUNT(*) > 0
        THEN (COUNT(*) FILTER (WHERE ndl.status IN ('DELIVERED', 'READ')))::FLOAT / COUNT(*) * 100
        ELSE 0
    END AS delivery_rate_pct,
    COALESCE(AVG(ndl.duration_ms) FILTER (WHERE ndl.duration_ms IS NOT NULL), 0)::FLOAT AS avg_delivery_time_ms,
    COUNT(*) FILTER (WHERE ndl.error_code IS NOT NULL) AS error_count
FROM notification_delivery_log ndl
WHERE ndl.created_at > NOW() - INTERVAL '7 days'
GROUP BY ndl.channel
ORDER BY ndl.channel;

CREATE UNIQUE INDEX idx_mv_channel_perf ON mv_channel_performance (channel);

-- 3. Campaign performance
CREATE MATERIALIZED VIEW mv_campaign_performance AS
SELECT
    nc.id AS campaign_id,
    nc.name_en,
    nc.name_ar,
    nc.type,
    nc.total_recipients,
    nc.sent_count,
    nc.open_count,
    nc.click_count,
    CASE
        WHEN nc.sent_count > 0
        THEN (nc.open_count::FLOAT / nc.sent_count) * 100
        ELSE 0
    END AS open_rate_pct,
    CASE
        WHEN nc.sent_count > 0
        THEN (nc.click_count::FLOAT / nc.sent_count) * 100
        ELSE 0
    END AS click_rate_pct,
    nc.status,
    nc.scheduled_at,
    nc.created_at
FROM notification_campaigns nc
WHERE nc.status IN ('COMPLETED', 'SENDING')
ORDER BY nc.created_at DESC;

CREATE UNIQUE INDEX idx_mv_campaign_perf ON mv_campaign_performance (campaign_id);

-- 4. User engagement
CREATE MATERIALIZED VIEW mv_user_engagement AS
SELECT
    ndl.user_id,
    COUNT(*) AS total_notifications,
    COUNT(*) FILTER (WHERE ndl.status = 'READ') AS read_count,
    COUNT(*) FILTER (WHERE ndl.status = 'DELIVERED') AS delivered_count,
    COUNT(*) FILTER (WHERE ndl.clicked_at IS NOT NULL) AS click_count,
    COUNT(DISTINCT ndl.type) AS unique_types,
    COUNT(DISTINCT ndl.channel) AS unique_channels,
    MAX(ndl.created_at) AS last_notification_at,
    COUNT(*) FILTER (WHERE ndl.created_at > NOW() - INTERVAL '7 days') AS last_7_days_count,
    CASE
        WHEN COUNT(*) > 0
        THEN (COUNT(*) FILTER (WHERE ndl.status = 'READ'))::FLOAT / COUNT(*) * 100
        ELSE 0
    END AS engagement_rate_pct
FROM notification_delivery_log ndl
WHERE ndl.created_at > NOW() - INTERVAL '90 days'
GROUP BY ndl.user_id
ORDER BY total_notifications DESC;

CREATE UNIQUE INDEX idx_mv_user_eng ON mv_user_engagement (user_id);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. DEFAULT CHANNEL CONFIGURATIONS
-- --------------------------------------------------------------------------
INSERT INTO notification_channel_config (channel, provider_name, credentials, is_active, rate_limit_per_min, rate_limit_per_hour, daily_limit, priority) VALUES
('SMS',       'twilio',    '{"account_sid":"","auth_token":"","from_number":"","messaging_service_sid":""}', true, 60,  1000, 10000, 1),
('WHATSAPP',  'whatsapp_cloud_api', '{"phone_number_id":"","business_account_id":"","access_token":"","api_version":"v18.0"}', true, 30, 500, 5000, 1),
('EMAIL',     'sendgrid',  '{"api_key":"","from_email":"noreply@elm5tber.com","from_name":"Elm5tber"}', true, 100, 5000, 50000, 1),
('PUSH',      'firebase_cloud_messaging', '{"server_key":"","sender_id":"","project_id":""}', true, 300, 10000, 100000, 1);

-- --------------------------------------------------------------------------
-- 2. DEFAULT TEMPLATES - ALL 16 TYPES × 5 CHANNELS
-- --------------------------------------------------------------------------

-- Helper: SMS templates for all types
INSERT INTO notification_templates (type, channel, title_ar, title_en, body_ar, body_en, sms_body_ar, sms_body_en, variables, is_active, version) VALUES

-- APPOINTMENT_CONFIRMATION
('APPOINTMENT_CONFIRMATION', 'SMS', NULL, NULL, NULL, NULL,
 'تم تأكيد موعدك في {{clinic_name}} يوم {{appointment_date}} الساعة {{appointment_time}}. رقم الحجز: {{booking_number}}.',
 'Your appointment at {{clinic_name}} is confirmed for {{appointment_date}} at {{appointment_time}}. Booking #: {{booking_number}}.',
 '[{"name":"clinic_name","type":"STRING"},{"name":"appointment_date","type":"DATE"},{"name":"appointment_time","type":"STRING"},{"name":"booking_number","type":"STRING"}]', true, 1),

-- APPOINTMENT_REMINDER
('APPOINTMENT_REMINDER', 'SMS', NULL, NULL, NULL, NULL,
 'تذكير: لديك موعد في {{clinic_name}} غدا {{appointment_date}} الساعة {{appointment_time}}. للغاء او تعديل الموعد: {{cancel_link}}',
 'Reminder: You have an appointment at {{clinic_name}} tomorrow {{appointment_date}} at {{appointment_time}}. To cancel or reschedule: {{cancel_link}}',
 '[{"name":"clinic_name","type":"STRING"},{"name":"appointment_date","type":"DATE"},{"name":"appointment_time","type":"STRING"},{"name":"cancel_link","type":"STRING"}]', true, 1),

-- QUEUE_UPDATE
('QUEUE_UPDATE', 'SMS', NULL, NULL, NULL, NULL,
 'تم تحديث دورك في {{clinic_name}}. رقم دورك: {{queue_number}}. المتبقي: {{waiting_count}} مرضى. يرجى التواجد في العيادة.',
 'Your queue position at {{clinic_name}} has been updated. Queue #: {{queue_number}}. Remaining: {{waiting_count}} patients. Please be present at the clinic.',
 '[{"name":"clinic_name","type":"STRING"},{"name":"queue_number","type":"STRING"},{"name":"waiting_count","type":"NUMBER"}]', true, 1),

-- HOME_VISIT_UPDATE
('HOME_VISIT_UPDATE', 'SMS', NULL, NULL, NULL, NULL,
 'تحديث زيارة منزلية: الطبيب {{doctor_name}} في الطريق إليك. وقت الوصول المتوقع: {{estimated_arrival}}. رقم الاتصال: {{contact_number}}.',
 'Home visit update: Dr. {{doctor_name}} is on their way. Estimated arrival: {{estimated_arrival}}. Contact: {{contact_number}}.',
 '[{"name":"doctor_name","type":"STRING"},{"name":"estimated_arrival","type":"STRING"},{"name":"contact_number","type":"STRING"}]', true, 1),

-- PAYMENT_SUCCESS
('PAYMENT_SUCCESS', 'SMS', NULL, NULL, NULL, NULL,
 'تمت عملية الدفع بنجاح في {{clinic_name}}. المبلغ: {{amount}} {{currency}}. رقم العملية: {{transaction_id}}. شكرا لك.',
 'Payment successful at {{clinic_name}}. Amount: {{amount}} {{currency}}. Transaction #: {{transaction_id}}. Thank you.',
 '[{"name":"clinic_name","type":"STRING"},{"name":"amount","type":"STRING"},{"name":"currency","type":"STRING"},{"name":"transaction_id","type":"STRING"}]', true, 1),

-- INVOICE_READY
('INVOICE_READY', 'SMS', NULL, NULL, NULL, NULL,
 'فاتورتك من {{clinic_name}} جاهزة. المبلغ: {{amount}} {{currency}}. رابط الفاتورة: {{invoice_link}}.',
 'Your invoice from {{clinic_name}} is ready. Amount: {{amount}} {{currency}}. Invoice link: {{invoice_link}}.',
 '[{"name":"clinic_name","type":"STRING"},{"name":"amount","type":"STRING"},{"name":"currency","type":"STRING"},{"name":"invoice_link","type":"STRING"}]', true, 1),

-- RESULT_READY
('RESULT_READY', 'SMS', NULL, NULL, NULL, NULL,
 'نتيجة الفحص الخاصة بك جاهزة من {{clinic_name}}. لعرض النتيجة: {{result_link}}.',
 'Your test result is ready from {{clinic_name}}. View result: {{result_link}}.',
 '[{"name":"clinic_name","type":"STRING"},{"name":"result_link","type":"STRING"}]', true, 1),

-- CRITICAL_RESULT_ALERT
('CRITICAL_RESULT_ALERT', 'SMS', NULL, NULL, NULL, NULL,
 'تنبيه مهم: يرجى الاتصال بالعيادة فورا على {{emergency_number}} بخصوص نتيجة الفحص الخاصة بك. رمز الحالة: {{case_code}}.',
 'URGENT: Please call the clinic immediately at {{emergency_number}} regarding your test result. Case code: {{case_code}}.',
 '[{"name":"emergency_number","type":"STRING"},{"name":"case_code","type":"STRING"}]', true, 1),

-- DOCTOR_MESSAGE
('DOCTOR_MESSAGE', 'SMS', NULL, NULL, NULL, NULL,
 'رسالة من د. {{doctor_name}}: {{message_body}}. للرد: {{reply_link}}.',
 'Message from Dr. {{doctor_name}}: {{message_body}}. To reply: {{reply_link}}.',
 '[{"name":"doctor_name","type":"STRING"},{"name":"message_body","type":"STRING"},{"name":"reply_link","type":"STRING"}]', true, 1),

-- MARKETING_CAMPAIGN
('MARKETING_CAMPAIGN', 'SMS', NULL, NULL, NULL, NULL,
 '{{clinic_name}}: {{offer_text}}. العرض ساري حتى {{expiry_date}}. للاستفادة: {{offer_link}}.',
 '{{clinic_name}}: {{offer_text}}. Offer valid until {{expiry_date}}. Claim: {{offer_link}}.',
 '[{"name":"clinic_name","type":"STRING"},{"name":"offer_text","type":"STRING"},{"name":"expiry_date","type":"DATE"},{"name":"offer_link","type":"STRING"}]', true, 1),

-- NEWSLETTER
('NEWSLETTER', 'SMS', NULL, NULL, NULL, NULL,
 'جديد {{clinic_name}}: {{newsletter_title}}. للمزيد: {{newsletter_link}}. للالغاء: {{unsubscribe_link}}.',
 '{{clinic_name}} update: {{newsletter_title}}. Read more: {{newsletter_link}}. Unsubscribe: {{unsubscribe_link}}.',
 '[{"name":"clinic_name","type":"STRING"},{"name":"newsletter_title","type":"STRING"},{"name":"newsletter_link","type":"STRING"},{"name":"unsubscribe_link","type":"STRING"}]', true, 1),

-- BIRTHDAY_GREETINGS
('BIRTHDAY_GREETINGS', 'SMS', NULL, NULL, NULL, NULL,
 '{{clinic_name}} تهنئك بعيد ميلادك! نتمنى لك يوما رائعا. كود الخصم الخاص بك: {{discount_code}}.',
 '{{clinic_name}} wishes you a happy birthday! Have a wonderful day. Your discount code: {{discount_code}}.',
 '[{"name":"clinic_name","type":"STRING"},{"name":"discount_code","type":"STRING"}]', true, 1),

-- INSURANCE_EXPIRY
('INSURANCE_EXPIRY', 'SMS', NULL, NULL, NULL, NULL,
 'تذكير: وثيقة التأمين الخاصة بك ستنتهي في {{expiry_date}}. يرجى تجديدها من خلال: {{renewal_link}}. للاستفسار: {{contact_number}}.',
 'Reminder: Your insurance policy expires on {{expiry_date}}. Please renew at: {{renewal_link}}. Inquiries: {{contact_number}}.',
 '[{"name":"expiry_date","type":"DATE"},{"name":"renewal_link","type":"STRING"},{"name":"contact_number","type":"STRING"}]', true, 1),

-- WELCOME
('WELCOME', 'SMS', NULL, NULL, NULL, NULL,
 'اهلا بك في {{clinic_name}}! تم تفعيل حسابك بنجاح. يمكنك حجز المواعيد من خلال: {{app_link}}. للدعم: {{support_number}}.',
 'Welcome to {{clinic_name}}! Your account has been activated. Book appointments at: {{app_link}}. Support: {{support_number}}.',
 '[{"name":"clinic_name","type":"STRING"},{"name":"app_link","type":"STRING"},{"name":"support_number","type":"STRING"}]', true, 1),

-- PASSWORD_CHANGED
('PASSWORD_CHANGED', 'SMS', NULL, NULL, NULL, NULL,
 'تم تغيير كلمة المرور لحسابك في {{clinic_name}}. اذا لم تكن قمت بهذا التغيير، يرجى الاتصال بنا فورا على {{support_number}}.',
 'Your {{clinic_name}} account password has been changed. If you did not make this change, please contact us immediately at {{support_number}}.',
 '[{"name":"clinic_name","type":"STRING"},{"name":"support_number","type":"STRING"}]', true, 1),

-- ACCOUNT_LOCKED
('ACCOUNT_LOCKED', 'SMS', NULL, NULL, NULL, NULL,
 'تم قفل حسابك في {{clinic_name}} بسبب محاولات دخول كثيرة. لفتح الحساب: {{unlock_link}}. الدعم الفني: {{support_number}}.',
 'Your {{clinic_name}} account has been locked due to multiple login attempts. To unlock: {{unlock_link}}. Support: {{support_number}}.',
 '[{"name":"clinic_name","type":"STRING"},{"name":"unlock_link","type":"STRING"},{"name":"support_number","type":"STRING"}]', true, 1);

-- WhatsApp templates
INSERT INTO notification_templates (type, channel, title_ar, title_en, body_ar, body_en, variables, is_active, version) VALUES
('APPOINTMENT_CONFIRMATION', 'WHATSAPP', 'تأكيد موعد', 'Appointment Confirmation',
 'مرحبا {{patient_name}}،\n\nتم تأكيد موعدك في **{{clinic_name}}**:\n📅 التاريخ: {{appointment_date}}\n⏰ الوقت: {{appointment_time}}\n🔢 رقم الحجز: {{booking_number}}\n\n📍 العنوان: {{clinic_address}}\n\nيمكنك إدارة موعدك من هنا: {{manage_link}}',
 'Hello {{patient_name}},\n\nYour appointment at **{{clinic_name}}** is confirmed:\n📅 Date: {{appointment_date}}\n⏰ Time: {{appointment_time}}\n🔢 Booking #: {{booking_number}}\n\n📍 Address: {{clinic_address}}\n\nManage your appointment: {{manage_link}}',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"appointment_date","type":"DATE"},{"name":"appointment_time","type":"STRING"},{"name":"booking_number","type":"STRING"},{"name":"clinic_address","type":"STRING"},{"name":"manage_link","type":"STRING"}]', true, 1),

('APPOINTMENT_REMINDER', 'WHATSAPP', 'تذكير بالموعد', 'Appointment Reminder',
 'مرحبا {{patient_name}}،\n\nتذكير: لديك موعد غدا {{appointment_date}} الساعة {{appointment_time}} في {{clinic_name}}.\n\nاذا كنت بحاجة لتعديل أو إلغاء الموعد: {{cancel_link}}',
 'Hello {{patient_name}},\n\nReminder: You have an appointment tomorrow {{appointment_date}} at {{appointment_time}} at {{clinic_name}}.\n\nTo reschedule or cancel: {{cancel_link}}',
 '[{"name":"patient_name","type":"STRING"},{"name":"appointment_date","type":"DATE"},{"name":"appointment_time","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"cancel_link","type":"STRING"}]', true, 1),

('QUEUE_UPDATE', 'WHATSAPP', 'تحديث الدور', 'Queue Update',
 'مرحبا {{patient_name}}،\n\nتحديث دورك في {{clinic_name}}:\n🔢 رقم الدور: {{queue_number}}\n👥 المرضى المتبقين: {{waiting_count}}\n⏱ وقت الانتظار المتوقع: {{estimated_wait}}\n\nيرجى التواجد في العيادة عند اقتراب دورك.',
 'Hello {{patient_name}},\n\nQueue update at {{clinic_name}}:\n🔢 Queue #: {{queue_number}}\n👥 Remaining patients: {{waiting_count}}\n⏱ Estimated wait: {{estimated_wait}}\n\nPlease be present at the clinic when your turn approaches.',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"queue_number","type":"STRING"},{"name":"waiting_count","type":"NUMBER"},{"name":"estimated_wait","type":"STRING"}]', true, 1),

('HOME_VISIT_UPDATE', 'WHATSAPP', 'تحديث الزيارة المنزلية', 'Home Visit Update',
 'مرحبا {{patient_name}}،\n\nالطبيب {{doctor_name}} في الطريق إليك.\n🚗 وقت الوصول المتوقع: {{estimated_arrival}}\n📞 رقم الطبيب: {{doctor_phone}}\n\nملاحظات: {{visit_notes}}',
 'Hello {{patient_name}},\n\nDr. {{doctor_name}} is on the way to your location.\n🚗 Estimated arrival: {{estimated_arrival}}\n📞 Doctor contact: {{doctor_phone}}\n\nNotes: {{visit_notes}}',
 '[{"name":"patient_name","type":"STRING"},{"name":"doctor_name","type":"STRING"},{"name":"estimated_arrival","type":"STRING"},{"name":"doctor_phone","type":"STRING"},{"name":"visit_notes","type":"STRING"}]', true, 1),

('PAYMENT_SUCCESS', 'WHATSAPP', 'تأكيد الدفع', 'Payment Confirmation',
 'مرحبا {{patient_name}}،\n\nتمت عملية الدفع بنجاح ✅\n💰 المبلغ: {{amount}} {{currency}}\n🏥 المنشأة: {{clinic_name}}\n📄 رقم العملية: {{transaction_id}}\n📅 التاريخ: {{payment_date}}\n\nشكرا لثقتكم.',
 'Hello {{patient_name}},\n\nPayment successful ✅\n💰 Amount: {{amount}} {{currency}}\n🏥 Facility: {{clinic_name}}\n📄 Transaction #: {{transaction_id}}\n📅 Date: {{payment_date}}\n\nThank you for your trust.',
 '[{"name":"patient_name","type":"STRING"},{"name":"amount","type":"STRING"},{"name":"currency","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"transaction_id","type":"STRING"},{"name":"payment_date","type":"DATE"}]', true, 1),

('INVOICE_READY', 'WHATSAPP', 'الفاتورة جاهزة', 'Invoice Ready',
 'مرحبا {{patient_name}}،\n\nفاتورتك من {{clinic_name}} جاهزة:\n💰 المبلغ: {{amount}} {{currency}}\n📄 رقم الفاتورة: {{invoice_number}}\n\nلتحميل الفاتورة: {{invoice_link}}',
 'Hello {{patient_name}},\n\nYour invoice from {{clinic_name}} is ready:\n💰 Amount: {{amount}} {{currency}}\n📄 Invoice #: {{invoice_number}}\n\nDownload invoice: {{invoice_link}}',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"amount","type":"STRING"},{"name":"currency","type":"STRING"},{"name":"invoice_number","type":"STRING"},{"name":"invoice_link","type":"STRING"}]', true, 1),

('RESULT_READY', 'WHATSAPP', 'النتيجة جاهزة', 'Result Ready',
 'مرحبا {{patient_name}}،\n\nنتيجة {{test_name}} الخاصة بك جاهزة من {{clinic_name}}.\n📅 تاريخ الفحص: {{test_date}}\n\nلعرض النتيجة: {{result_link}}',
 'Hello {{patient_name}},\n\nYour {{test_name}} result is ready from {{clinic_name}}.\n📅 Test date: {{test_date}}\n\nView result: {{result_link}}',
 '[{"name":"patient_name","type":"STRING"},{"name":"test_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"test_date","type":"DATE"},{"name":"result_link","type":"STRING"}]', true, 1),

('CRITICAL_RESULT_ALERT', 'WHATSAPP', 'تنبيه نتيجة حرجة', 'Critical Result Alert',
 '⚠️ تنبيه مهم لـ {{patient_name}}\n\nنتيجة فحص {{test_name}} تتطلب متابعة عاجلة.\nيرجى الاتصال بالعيادة فورا على {{emergency_number}}.\n\nرمز الحالة: {{case_code}}',
 '⚠️ Urgent alert for {{patient_name}}\n\nYour {{test_name}} result requires immediate attention.\nPlease call the clinic right away at {{emergency_number}}.\n\nCase code: {{case_code}}',
 '[{"name":"patient_name","type":"STRING"},{"name":"test_name","type":"STRING"},{"name":"emergency_number","type":"STRING"},{"name":"case_code","type":"STRING"}]', true, 1),

('DOCTOR_MESSAGE', 'WHATSAPP', 'رسالة من الطبيب', 'Message from Doctor',
 'لديك رسالة جديدة من د. {{doctor_name}}:\n\n{{message_body}}\n\nللرد على الرسالة: {{reply_link}}',
 'You have a new message from Dr. {{doctor_name}}:\n\n{{message_body}}\n\nReply: {{reply_link}}',
 '[{"name":"doctor_name","type":"STRING"},{"name":"message_body","type":"STRING"},{"name":"reply_link","type":"STRING"}]', true, 1),

('MARKETING_CAMPAIGN', 'WHATSAPP', 'عرض خاص', 'Special Offer',
 'مرحبا {{patient_name}}،\n\n{{clinic_name}} تقدم لكم:\n🎉 {{offer_text}}\n\n✅ العرض ساري حتى {{expiry_date}}\n\nللحصول على العرض: {{offer_link}}',
 'Hello {{patient_name}},\n\n{{clinic_name}} offers you:\n🎉 {{offer_text}}\n\n✅ Valid until {{expiry_date}}\n\nClaim offer: {{offer_link}}',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"offer_text","type":"STRING"},{"name":"expiry_date","type":"DATE"},{"name":"offer_link","type":"STRING"}]', true, 1),

('NEWSLETTER', 'WHATSAPP', 'نشرة {{clinic_name}}', '{{clinic_name}} Newsletter',
 'مرحبا {{patient_name}}،\n\n📰 {{newsletter_title}}\n\n{{newsletter_summary}}\n\nلقراءة المزيد: {{newsletter_link}}\n\nالغاء الاشتراك: {{unsubscribe_link}}',
 'Hello {{patient_name}},\n\n📰 {{newsletter_title}}\n\n{{newsletter_summary}}\n\nRead more: {{newsletter_link}}\n\nUnsubscribe: {{unsubscribe_link}}',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"newsletter_title","type":"STRING"},{"name":"newsletter_summary","type":"STRING"},{"name":"newsletter_link","type":"STRING"},{"name":"unsubscribe_link","type":"STRING"}]', true, 1),

('BIRTHDAY_GREETINGS', 'WHATSAPP', 'عيد ميلاد سعيد!', 'Happy Birthday!',
 '🎂 عيد ميلاد سعيد {{patient_name}}!\n\n{{clinic_name}} تتمنى لك يوما رائعا مليئا بالصحة والسعادة.\n\nكود خصم خاص بمناسبة عيد ميلادك: {{discount_code}}\n\nصالح لمدة {{validity_days}} يوما.',
 '🎂 Happy Birthday {{patient_name}}!\n\n{{clinic_name}} wishes you a wonderful day filled with health and happiness.\n\nSpecial birthday discount code: {{discount_code}}\n\nValid for {{validity_days}} days.',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"discount_code","type":"STRING"},{"name":"validity_days","type":"NUMBER"}]', true, 1),

('INSURANCE_EXPIRY', 'WHATSAPP', 'تنبيه انتهاء التأمين', 'Insurance Expiry Notice',
 'مرحبا {{patient_name}}،\n\nنود تذكيرك بأن وثيقة التأمين الخاصة بك ستنتهي في {{expiry_date}}.\n\nلتجديد الوثيقة: {{renewal_link}}\n\nللاستفسار: {{contact_number}}',
 'Hello {{patient_name}},\n\nThis is a reminder that your insurance policy expires on {{expiry_date}}.\n\nRenew now: {{renewal_link}}\n\nInquiries: {{contact_number}}',
 '[{"name":"patient_name","type":"STRING"},{"name":"expiry_date","type":"DATE"},{"name":"renewal_link","type":"STRING"},{"name":"contact_number","type":"STRING"}]', true, 1),

('WELCOME', 'WHATSAPP', 'مرحبا بك في {{clinic_name}}', 'Welcome to {{clinic_name}}',
 'مرحبا {{patient_name}} 👋\n\nاهلا بك في {{clinic_name}}! تم تفعيل حسابك بنجاح.\n\nيمكنك الآن:\n📅 حجز المواعيد\n📋 عرض نتائج الفحوصات\n💬 التواصل مع الأطباء\n\nلبدء استخدام التطبيق: {{app_link}}',
 'Hello {{patient_name}} 👋\n\nWelcome to {{clinic_name}}! Your account has been activated.\n\nYou can now:\n📅 Book appointments\n📋 View test results\n💬 Message doctors\n\nGet started: {{app_link}}',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"app_link","type":"STRING"}]', true, 1),

('PASSWORD_CHANGED', 'WHATSAPP', 'تغيير كلمة المرور', 'Password Changed',
 '🔒 تأكيد تغيير كلمة المرور\n\nمرحبا {{patient_name}}،\n\nتم تغيير كلمة مرور حسابك في {{clinic_name}} بنجاح.\n\nاذا لم تكن قمت بهذا التغيير، يرجى الاتصال بنا فورا على {{support_number}}.',
 '🔒 Password Change Confirmation\n\nHello {{patient_name}},\n\nYour {{clinic_name}} account password has been changed successfully.\n\nIf you did not make this change, please contact us immediately at {{support_number}}.',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"support_number","type":"STRING"}]', true, 1),

('ACCOUNT_LOCKED', 'WHATSAPP', 'تم قفل الحساب', 'Account Locked',
 '🔒 تم قفل حسابك\n\nمرحبا {{patient_name}}،\n\nتم قفل حسابك في {{clinic_name}} بسبب محاولات تسجيل دخول متعددة فاشلة.\n\nلفتح الحساب: {{unlock_link}}\n\nالدعم الفني: {{support_number}}',
 '🔒 Account Locked\n\nHello {{patient_name}},\n\nYour {{clinic_name}} account has been locked due to multiple failed login attempts.\n\nTo unlock: {{unlock_link}}\n\nSupport: {{support_number}}',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"unlock_link","type":"STRING"},{"name":"support_number","type":"STRING"}]', true, 1);

-- Email templates
INSERT INTO notification_templates (type, channel, title_ar, title_en, body_ar, body_en, variables, is_active, version) VALUES
('APPOINTMENT_CONFIRMATION', 'EMAIL', 'تأكيد حجز موعد - {{clinic_name}}', 'Appointment Confirmation - {{clinic_name}}',
 '<h2>مرحبا {{patient_name}}</h2><p>تم تأكيد موعدك في <strong>{{clinic_name}}</strong></p><table><tr><td>📅 التاريخ</td><td>{{appointment_date}}</td></tr><tr><td>⏰ الوقت</td><td>{{appointment_time}}</td></tr><tr><td>🔢 رقم الحجز</td><td>{{booking_number}}</td></tr><tr><td>📍 العنوان</td><td>{{clinic_address}}</td></tr></table><br><a href="{{manage_link}}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">إدارة الموعد</a>',
 '<h2>Hello {{patient_name}}</h2><p>Your appointment at <strong>{{clinic_name}}</strong> is confirmed</p><table><tr><td>📅 Date</td><td>{{appointment_date}}</td></tr><tr><td>⏰ Time</td><td>{{appointment_time}}</td></tr><tr><td>🔢 Booking #</td><td>{{booking_number}}</td></tr><tr><td>📍 Address</td><td>{{clinic_address}}</td></tr></table><br><a href="{{manage_link}}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Manage Appointment</a>',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"appointment_date","type":"DATE"},{"name":"appointment_time","type":"STRING"},{"name":"booking_number","type":"STRING"},{"name":"clinic_address","type":"STRING"},{"name":"manage_link","type":"STRING"}]', true, 1),

('APPOINTMENT_REMINDER', 'EMAIL', 'تذكير بالموعد - {{clinic_name}}', 'Appointment Reminder - {{clinic_name}}',
 '<h2>مرحبا {{patient_name}}</h2><p>تذكير: لديك موعد غدا <strong>{{appointment_date}}</strong> الساعة <strong>{{appointment_time}}</strong></p><p>📍 {{clinic_name}} - {{clinic_address}}</p><br><a href="{{cancel_link}}" style="background:#dc3545;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">إلغاء أو تعديل الموعد</a>',
 '<h2>Hello {{patient_name}}</h2><p>Reminder: You have an appointment tomorrow <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong></p><p>📍 {{clinic_name}} - {{clinic_address}}</p><br><a href="{{cancel_link}}" style="background:#dc3545;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Cancel or Reschedule</a>',
 '[{"name":"patient_name","type":"STRING"},{"name":"appointment_date","type":"DATE"},{"name":"appointment_time","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"clinic_address","type":"STRING"},{"name":"cancel_link","type":"STRING"}]', true, 1),

('QUEUE_UPDATE', 'EMAIL', 'تحديث دورك في {{clinic_name}}', 'Queue Update - {{clinic_name}}',
 '<h2>مرحبا {{patient_name}}</h2><p>تحديث دورك في <strong>{{clinic_name}}</strong>:</p><table><tr><td>🔢 رقم الدور</td><td>{{queue_number}}</td></tr><tr><td>👥 المرضى المتبقين</td><td>{{waiting_count}}</td></tr><tr><td>⏱ وقت الانتظار المتوقع</td><td>{{estimated_wait}}</td></tr></table><p>يرجى التواجد في العيادة.</p>',
 '<h2>Hello {{patient_name}}</h2><p>Queue update at <strong>{{clinic_name}}</strong>:</p><table><tr><td>🔢 Queue #</td><td>{{queue_number}}</td></tr><tr><td>👥 Remaining patients</td><td>{{waiting_count}}</td></tr><tr><td>⏱ Estimated wait</td><td>{{estimated_wait}}</td></tr></table><p>Please be present at the clinic.</p>',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"queue_number","type":"STRING"},{"name":"waiting_count","type":"NUMBER"},{"name":"estimated_wait","type":"STRING"}]', true, 1),

('HOME_VISIT_UPDATE', 'EMAIL', 'تحديث الزيارة المنزلية', 'Home Visit Update',
 '<h2>مرحبا {{patient_name}}</h2><p>الطبيب <strong>{{doctor_name}}</strong> في الطريق إليك</p><table><tr><td>🚗 وقت الوصول المتوقع</td><td>{{estimated_arrival}}</td></tr><tr><td>📞 رقم الطبيب</td><td>{{doctor_phone}}</td></tr></table><p>{{visit_notes}}</p>',
 '<h2>Hello {{patient_name}}</h2><p>Dr. <strong>{{doctor_name}}</strong> is on the way</p><table><tr><td>🚗 Estimated arrival</td><td>{{estimated_arrival}}</td></tr><tr><td>📞 Doctor contact</td><td>{{doctor_phone}}</td></tr></table><p>{{visit_notes}}</p>',
 '[{"name":"patient_name","type":"STRING"},{"name":"doctor_name","type":"STRING"},{"name":"estimated_arrival","type":"STRING"},{"name":"doctor_phone","type":"STRING"},{"name":"visit_notes","type":"STRING"}]', true, 1),

('PAYMENT_SUCCESS', 'EMAIL', 'تأكيد الدفع - {{clinic_name}}', 'Payment Confirmation - {{clinic_name}}',
 '<h2>مرحبا {{patient_name}}</h2><p>✅ تمت عملية الدفع بنجاح</p><table><tr><td>💰 المبلغ</td><td>{{amount}} {{currency}}</td></tr><tr><td>🏥 المنشأة</td><td>{{clinic_name}}</td></tr><tr><td>📄 رقم العملية</td><td>{{transaction_id}}</td></tr><tr><td>📅 التاريخ</td><td>{{payment_date}}</td></tr></table><p>شكرا لثقتكم.</p>',
 '<h2>Hello {{patient_name}}</h2><p>✅ Payment successful</p><table><tr><td>💰 Amount</td><td>{{amount}} {{currency}}</td></tr><tr><td>🏥 Facility</td><td>{{clinic_name}}</td></tr><tr><td>📄 Transaction #</td><td>{{transaction_id}}</td></tr><tr><td>📅 Date</td><td>{{payment_date}}</td></tr></table><p>Thank you for your trust.</p>',
 '[{"name":"patient_name","type":"STRING"},{"name":"amount","type":"STRING"},{"name":"currency","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"transaction_id","type":"STRING"},{"name":"payment_date","type":"DATE"}]', true, 1),

('INVOICE_READY', 'EMAIL', 'الفاتورة جاهزة - {{clinic_name}}', 'Invoice Ready - {{clinic_name}}',
 '<h2>مرحبا {{patient_name}}</h2><p>فاتورتك من <strong>{{clinic_name}}</strong> جاهزة</p><table><tr><td>💰 المبلغ</td><td>{{amount}} {{currency}}</td></tr><tr><td>📄 رقم الفاتورة</td><td>{{invoice_number}}</td></tr></table><br><a href="{{invoice_link}}" style="background:#28a745;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">تحميل الفاتورة</a>',
 '<h2>Hello {{patient_name}}</h2><p>Your invoice from <strong>{{clinic_name}}</strong> is ready</p><table><tr><td>💰 Amount</td><td>{{amount}} {{currency}}</td></tr><tr><td>📄 Invoice #</td><td>{{invoice_number}}</td></tr></table><br><a href="{{invoice_link}}" style="background:#28a745;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Download Invoice</a>',
 '[{"name":"patient_name","type":"STRING"},{"name":"amount","type":"STRING"},{"name":"currency","type":"STRING"},{"name":"invoice_number","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"invoice_link","type":"STRING"}]', true, 1),

('RESULT_READY', 'EMAIL', 'نتيجة الفحص جاهزة - {{clinic_name}}', 'Test Result Ready - {{clinic_name}}',
 '<h2>مرحبا {{patient_name}}</h2><p>نتيجة <strong>{{test_name}}</strong> الخاصة بك جاهزة من {{clinic_name}}.</p><p>📅 تاريخ الفحص: {{test_date}}</p><br><a href="{{result_link}}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">عرض النتيجة</a>',
 '<h2>Hello {{patient_name}}</h2><p>Your <strong>{{test_name}}</strong> result is ready from {{clinic_name}}.</p><p>📅 Test date: {{test_date}}</p><br><a href="{{result_link}}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">View Result</a>',
 '[{"name":"patient_name","type":"STRING"},{"name":"test_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"test_date","type":"DATE"},{"name":"result_link","type":"STRING"}]', true, 1),

('CRITICAL_RESULT_ALERT', 'EMAIL', '⚠️ تنبيه نتيجة حرجة', '⚠️ Critical Result Alert',
 '<h2 style="color:#dc3545;">⚠️ تنبيه مهم</h2><p>عزيزي {{patient_name}}،</p><p>نتيجة فحص <strong>{{test_name}}</strong> تتطلب متابعة عاجلة.</p><p>يرجى الاتصال بالعيادة فورا على <strong>{{emergency_number}}</strong>.</p><p>رمز الحالة: <code>{{case_code}}</code></p>',
 '<h2 style="color:#dc3545;">⚠️ Urgent Alert</h2><p>Dear {{patient_name}},</p><p>Your <strong>{{test_name}}</strong> result requires immediate attention.</p><p>Please call the clinic immediately at <strong>{{emergency_number}}</strong>.</p><p>Case code: <code>{{case_code}}</code></p>',
 '[{"name":"patient_name","type":"STRING"},{"name":"test_name","type":"STRING"},{"name":"emergency_number","type":"STRING"},{"name":"case_code","type":"STRING"}]', true, 1),

('DOCTOR_MESSAGE', 'EMAIL', 'رسالة من د. {{doctor_name}}', 'Message from Dr. {{doctor_name}}',
 '<h2>رسالة جديدة من د. {{doctor_name}}</h2><p>{{message_body}}</p><br><a href="{{reply_link}}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">رد على الرسالة</a>',
 '<h2>New message from Dr. {{doctor_name}}</h2><p>{{message_body}}</p><br><a href="{{reply_link}}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Reply</a>',
 '[{"name":"doctor_name","type":"STRING"},{"name":"message_body","type":"STRING"},{"name":"reply_link","type":"STRING"}]', true, 1),

('MARKETING_CAMPAIGN', 'EMAIL', '{{clinic_name}} - عرض خاص', '{{clinic_name}} - Special Offer',
 '<h2>مرحبا {{patient_name}}</h2><p>🎉 {{clinic_name}} تقدم لكم:</p><div style="border:2px dashed #007bff;padding:20px;text-align:center;margin:20px 0;"><h3>{{offer_text}}</h3><p>✅ العرض ساري حتى {{expiry_date}}</p></div><a href="{{offer_link}}" style="background:#28a745;color:#fff;padding:15px 30px;text-decoration:none;border-radius:5px;font-size:18px;">الحصول على العرض</a>',
 '<h2>Hello {{patient_name}}</h2><p>🎉 {{clinic_name}} offers you:</p><div style="border:2px dashed #007bff;padding:20px;text-align:center;margin:20px 0;"><h3>{{offer_text}}</h3><p>✅ Valid until {{expiry_date}}</p></div><a href="{{offer_link}}" style="background:#28a745;color:#fff;padding:15px 30px;text-decoration:none;border-radius:5px;font-size:18px;">Claim Offer</a>',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"offer_text","type":"STRING"},{"name":"expiry_date","type":"DATE"},{"name":"offer_link","type":"STRING"}]', true, 1),

('NEWSLETTER', 'EMAIL', '{{newsletter_title}} - {{clinic_name}}', '{{newsletter_title}} - {{clinic_name}}',
 '<h2>{{newsletter_title}}</h2><p>{{newsletter_summary}}</p><div style="background:#f8f9fa;padding:20px;margin:20px 0;border-radius:5px;">{{newsletter_body}}</div><br><a href="{{newsletter_link}}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">قراءة المزيد</a><br><br><small><a href="{{unsubscribe_link}}" style="color:#6c757d;">الغاء الاشتراك</a></small>',
 '<h2>{{newsletter_title}}</h2><p>{{newsletter_summary}}</p><div style="background:#f8f9fa;padding:20px;margin:20px 0;border-radius:5px;">{{newsletter_body}}</div><br><a href="{{newsletter_link}}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Read More</a><br><br><small><a href="{{unsubscribe_link}}" style="color:#6c757d;">Unsubscribe</a></small>',
 '[{"name":"newsletter_title","type":"STRING"},{"name":"newsletter_summary","type":"STRING"},{"name":"newsletter_body","type":"STRING"},{"name":"newsletter_link","type":"STRING"},{"name":"unsubscribe_link","type":"STRING"}]', true, 1),

('BIRTHDAY_GREETINGS', 'EMAIL', '🎂 عيد ميلاد سعيد من {{clinic_name}}', '🎂 Happy Birthday from {{clinic_name}}',
 '<h2>🎂 عيد ميلاد سعيد {{patient_name}}!</h2><p>{{clinic_name}} تتمنى لك يوما رائعا مليئا بالصحة والسعادة.</p><div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:30px;text-align:center;margin:20px 0;border-radius:10px;"><h3>كود خصم عيد الميلاد</h3><div style="font-size:32px;letter-spacing:5px;background:rgba(255,255,255,0.2);padding:15px;border-radius:5px;margin:15px 0;">{{discount_code}}</div><p>صالح لمدة {{validity_days}} يوما</p></div>',
 '<h2>🎂 Happy Birthday {{patient_name}}!</h2><p>{{clinic_name}} wishes you a wonderful day filled with health and happiness.</p><div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:30px;text-align:center;margin:20px 0;border-radius:10px;"><h3>Birthday Discount Code</h3><div style="font-size:32px;letter-spacing:5px;background:rgba(255,255,255,0.2);padding:15px;border-radius:5px;margin:15px 0;">{{discount_code}}</div><p>Valid for {{validity_days}} days</p></div>',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"discount_code","type":"STRING"},{"name":"validity_days","type":"NUMBER"}]', true, 1),

('INSURANCE_EXPIRY', 'EMAIL', 'تنبيه انتهاء التأمين - {{clinic_name}}', 'Insurance Expiry Notice - {{clinic_name}}',
 '<h2>مرحبا {{patient_name}}</h2><p>نود تذكيرك بأن وثيقة التأمين الخاصة بك ستنتهي في <strong>{{expiry_date}}</strong>.</p><br><a href="{{renewal_link}}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">تجديد الوثيقة</a><br><br><p>للاستفسار: {{contact_number}}</p>',
 '<h2>Hello {{patient_name}}</h2><p>This is a reminder that your insurance policy expires on <strong>{{expiry_date}}</strong>.</p><br><a href="{{renewal_link}}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Renew Policy</a><br><br><p>Inquiries: {{contact_number}}</p>',
 '[{"name":"patient_name","type":"STRING"},{"name":"expiry_date","type":"DATE"},{"name":"renewal_link","type":"STRING"},{"name":"contact_number","type":"STRING"}]', true, 1),

('WELCOME', 'EMAIL', 'مرحبا بك في {{clinic_name}}', 'Welcome to {{clinic_name}}',
 '<h2>👋 مرحبا {{patient_name}}!</h2><p>اهلا بك في <strong>{{clinic_name}}</strong>! تم تفعيل حسابك بنجاح.</p><div style="background:#e3f2fd;padding:20px;margin:20px 0;border-radius:5px;"><p>يمكنك الآن:</p><ul><li>📅 حجز المواعيد</li><li>📋 عرض نتائج الفحوصات</li><li>💬 التواصل مع الأطباء</li><li>💰 عرض الفواتير والدفع</li></ul></div><a href="{{app_link}}" style="background:#28a745;color:#fff;padding:15px 30px;text-decoration:none;border-radius:5px;font-size:18px;">بدء الاستخدام</a>',
 '<h2>👋 Hello {{patient_name}}!</h2><p>Welcome to <strong>{{clinic_name}}</strong>! Your account has been activated successfully.</p><div style="background:#e3f2fd;padding:20px;margin:20px 0;border-radius:5px;"><p>You can now:</p><ul><li>📅 Book appointments</li><li>📋 View test results</li><li>💬 Message doctors</li><li>💰 View invoices and pay</li></ul></div><a href="{{app_link}}" style="background:#28a745;color:#fff;padding:15px 30px;text-decoration:none;border-radius:5px;font-size:18px;">Get Started</a>',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"app_link","type":"STRING"}]', true, 1),

('PASSWORD_CHANGED', 'EMAIL', '🔒 تأكيد تغيير كلمة المرور - {{clinic_name}}', '🔒 Password Change Confirmation - {{clinic_name}}',
 '<h2>🔒 تأكيد تغيير كلمة المرور</h2><p>مرحبا {{patient_name}}،</p><p>تم تغيير كلمة مرور حسابك في <strong>{{clinic_name}}</strong> بنجاح.</p><p>📅 التاريخ: {{change_date}}</p><p>🌐 عنوان IP: {{ip_address}}</p><br><div style="background:#fff3cd;padding:15px;border-radius:5px;border-left:4px solid #ffc107;"><strong>⚠️ لم تقم بهذا التغيير؟</strong><br>يرجى الاتصال بنا فورا على {{support_number}}.</div>',
 '<h2>🔒 Password Change Confirmation</h2><p>Hello {{patient_name}},</p><p>Your <strong>{{clinic_name}}</strong> account password has been changed successfully.</p><p>📅 Date: {{change_date}}</p><p>🌐 IP Address: {{ip_address}}</p><br><div style="background:#fff3cd;padding:15px;border-radius:5px;border-left:4px solid #ffc107;"><strong>⚠️ Did not make this change?</strong><br>Please contact us immediately at {{support_number}}.</div>',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"change_date","type":"DATE"},{"name":"ip_address","type":"STRING"},{"name":"support_number","type":"STRING"}]', true, 1),

('ACCOUNT_LOCKED', 'EMAIL', '🔒 تم قفل حسابك - {{clinic_name}}', '🔒 Account Locked - {{clinic_name}}',
 '<h2>🔒 تم قفل الحساب</h2><p>مرحبا {{patient_name}}،</p><p>تم قفل حسابك في <strong>{{clinic_name}}</strong> بسبب محاولات تسجيل دخول متعددة فاشلة.</p><br><a href="{{unlock_link}}" style="background:#dc3545;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">فتح الحساب</a><br><br><p>الدعم الفني: {{support_number}}</p>',
 '<h2>🔒 Account Locked</h2><p>Hello {{patient_name}},</p><p>Your <strong>{{clinic_name}}</strong> account has been locked due to multiple failed login attempts.</p><br><a href="{{unlock_link}}" style="background:#dc3545;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Unlock Account</a><br><br><p>Support: {{support_number}}</p>',
 '[{"name":"patient_name","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"unlock_link","type":"STRING"},{"name":"support_number","type":"STRING"}]', true, 1);

-- Push notification templates
INSERT INTO notification_templates (type, channel, push_title_ar, push_title_en, push_body_ar, push_body_en, variables, is_active, version) VALUES
('APPOINTMENT_CONFIRMATION', 'PUSH', 'تأكيد موعد', 'Appointment Confirmed',
 'تم تأكيد موعدك في {{clinic_name}} يوم {{appointment_date}}. رقم الحجز: {{booking_number}}',
 'Your appointment at {{clinic_name}} on {{appointment_date}} is confirmed. Booking #: {{booking_number}}',
 '[{"name":"clinic_name","type":"STRING"},{"name":"appointment_date","type":"DATE"},{"name":"booking_number","type":"STRING"}]', true, 1),

('APPOINTMENT_REMINDER', 'PUSH', 'تذكير بالموعد', 'Appointment Reminder',
 'تذكير: موعدك في {{clinic_name}} بعد {{hours_remaining}} ساعات',
 'Reminder: Your appointment at {{clinic_name}} is in {{hours_remaining}} hours',
 '[{"name":"clinic_name","type":"STRING"},{"name":"hours_remaining","type":"NUMBER"}]', true, 1),

('QUEUE_UPDATE', 'PUSH', 'تحديث الدور', 'Queue Update',
 'دورك رقم {{queue_number}} في {{clinic_name}}. متبقي {{waiting_count}} مرضى',
 'Your queue #{{queue_number}} at {{clinic_name}}. {{waiting_count}} patients remaining',
 '[{"name":"queue_number","type":"STRING"},{"name":"clinic_name","type":"STRING"},{"name":"waiting_count","type":"NUMBER"}]', true, 1),

('HOME_VISIT_UPDATE', 'PUSH', 'الطبيب في الطريق', 'Doctor En Route',
 'د. {{doctor_name}} في الطريق إليك. وقت الوصول: {{estimated_arrival}}',
 'Dr. {{doctor_name}} is on the way. ETA: {{estimated_arrival}}',
 '[{"name":"doctor_name","type":"STRING"},{"name":"estimated_arrival","type":"STRING"}]', true, 1),

('PAYMENT_SUCCESS', 'PUSH', 'تم الدفع بنجاح', 'Payment Successful',
 'تم الدفع بنجاح بمبلغ {{amount}} {{currency}} في {{clinic_name}}',
 'Payment of {{amount}} {{currency}} at {{clinic_name}} successful',
 '[{"name":"amount","type":"STRING"},{"name":"currency","type":"STRING"},{"name":"clinic_name","type":"STRING"}]', true, 1),

('INVOICE_READY', 'PUSH', 'الفاتورة جاهزة', 'Invoice Ready',
 'فاتورتك من {{clinic_name}} بمبلغ {{amount}} {{currency}} جاهزة',
 'Your invoice from {{clinic_name}} for {{amount}} {{currency}} is ready',
 '[{"name":"clinic_name","type":"STRING"},{"name":"amount","type":"STRING"},{"name":"currency","type":"STRING"}]', true, 1),

('RESULT_READY', 'PUSH', 'النتيجة جاهزة', 'Result Ready',
 'نتيجة {{test_name}} جاهزة من {{clinic_name}}',
 'Your {{test_name}} result from {{clinic_name}} is ready',
 '[{"name":"test_name","type":"STRING"},{"name":"clinic_name","type":"STRING"}]', true, 1),

('CRITICAL_RESULT_ALERT', 'PUSH', '⚠️ تنبيه نتيجة حرجة', '⚠️ Critical Result',
 'نتيجتك تتطلب متابعة عاجلة. يرجى الاتصال بالعيادة فورا',
 'Your result requires immediate attention. Please call the clinic now',
 '[]', true, 1),

('DOCTOR_MESSAGE', 'PUSH', 'رسالة من د. {{doctor_name}}', 'Message from Dr. {{doctor_name}}',
 'لديك رسالة جديدة من د. {{doctor_name}}',
 'You have a new message from Dr. {{doctor_name}}',
 '[{"name":"doctor_name","type":"STRING"}]', true, 1),

('MARKETING_CAMPAIGN', 'PUSH', '{{clinic_name}} - عرض', '{{clinic_name}} - Offer',
 '{{offer_text}} - العرض ساري حتى {{expiry_date}}',
 '{{offer_text}} - Valid until {{expiry_date}}',
 '[{"name":"clinic_name","type":"STRING"},{"name":"offer_text","type":"STRING"},{"name":"expiry_date","type":"DATE"}]', true, 1),

('NEWSLETTER', 'PUSH', '{{newsletter_title}}', '{{newsletter_title}}',
 'منشور جديد من {{clinic_name}}',
 'New update from {{clinic_name}}',
 '[{"name":"newsletter_title","type":"STRING"},{"name":"clinic_name","type":"STRING"}]', true, 1),

('BIRTHDAY_GREETINGS', 'PUSH', '🎂 عيد ميلاد سعيد!', '🎂 Happy Birthday!',
 '{{clinic_name}} تهنئك بعيد ميلادك! كود خصم: {{discount_code}}',
 '{{clinic_name}} wishes you a happy birthday! Code: {{discount_code}}',
 '[{"name":"clinic_name","type":"STRING"},{"name":"discount_code","type":"STRING"}]', true, 1),

('INSURANCE_EXPIRY', 'PUSH', 'تنبيه انتهاء التأمين', 'Insurance Expiry',
 'تأمينك سينتهي في {{expiry_date}}. جدد الآن',
 'Your insurance expires on {{expiry_date}}. Renew now',
 '[{"name":"expiry_date","type":"DATE"}]', true, 1),

('WELCOME', 'PUSH', 'مرحبا بك!', 'Welcome!',
 'اهلا بك في {{clinic_name}}! تم تفعيل حسابك',
 'Welcome to {{clinic_name}}! Your account is active',
 '[{"name":"clinic_name","type":"STRING"}]', true, 1),

('PASSWORD_CHANGED', 'PUSH', '🔒 تغيير كلمة المرور', '🔒 Password Changed',
 'تم تغيير كلمة مرور حسابك في {{clinic_name}}',
 'Your {{clinic_name}} password has been changed',
 '[{"name":"clinic_name","type":"STRING"}]', true, 1),

('ACCOUNT_LOCKED', 'PUSH', '🔒 تم قفل الحساب', '🔒 Account Locked',
 'تم قفل حسابك في {{clinic_name}}. اضغط لفتحه',
 'Your {{clinic_name}} account has been locked. Tap to unlock',
 '[{"name":"clinic_name","type":"STRING"}]', true, 1);

-- In-App notification templates (same as Push for in-app display)
INSERT INTO notification_templates (type, channel, push_title_ar, push_title_en, push_body_ar, push_body_en, variables, is_active, version)
SELECT type, 'IN_APP'::notification_channel, push_title_ar, push_title_en, push_body_ar, push_body_en, variables, is_active, version
FROM notification_templates
WHERE channel = 'PUSH'
  AND NOT EXISTS (
    SELECT 1 FROM notification_templates nt2
    WHERE nt2.type = notification_templates.type AND nt2.channel = 'IN_APP'
  );

-- --------------------------------------------------------------------------
-- 3. ADMIN NOTIFICATION PREFERENCES
-- --------------------------------------------------------------------------
-- Create admin preference preferences for all channels and types for user ID '00000000-0000-0000-0000-000000000001' (placeholder admin)
INSERT INTO notification_preferences (user_id, channel, type, enabled, max_per_day)
SELECT
    '00000000-0000-0000-0000-000000000001'::UUID,
    channel,
    type,
    true,
    100
FROM (SELECT unnest(enum_range(NULL::notification_channel)) AS channel) ch
CROSS JOIN (SELECT unnest(enum_range(NULL::notification_type)) AS type) tp
WHERE channel IN ('SMS', 'WHATSAPP', 'EMAIL', 'PUSH', 'IN_APP')
ON CONFLICT (user_id, channel, type) DO NOTHING;

-- --------------------------------------------------------------------------
-- 4. REFRESH MATERIALIZED VIEWS FUNCTION
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_notification_materialized_views()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_notification_stats_24h;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_channel_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_campaign_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_engagement;
END;
$$;

-- --------------------------------------------------------------------------
-- 5. SCHEDULED JOB FUNCTION (for pg_cron or external scheduler)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION run_notification_maintenance()
RETURNS TABLE(
    task_name TEXT,
    rows_affected INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    cleanup_count INTEGER;
    refresh_count INTEGER;
BEGIN
    -- Cleanup expired notifications
    SELECT cleanup_expired_notifications() INTO cleanup_count;
    task_name := 'cleanup_expired';
    rows_affected := cleanup_count;
    RETURN NEXT;

    -- Refresh materialized views
    PERFORM refresh_notification_materialized_views();
    task_name := 'refresh_materialized_views';
    rows_affected := 0;
    RETURN NEXT;
END;
$$;

COMMIT;
