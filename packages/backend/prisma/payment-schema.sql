-- ============================================================================
-- Enterprise Healthcare Payment System - PostgreSQL Schema
-- Production-ready for Saudi Arabia healthcare with SAR currency, 15% VAT
-- ============================================================================

BEGIN;

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE payment_method AS ENUM (
    'CASH', 'VISA', 'MASTERCARD', 'APPLE_PAY', 'GOOGLE_PAY',
    'PAYPAL', 'WALLET', 'INSTALLMENT', 'GIFT_CARD',
    'CORPORATE_BILLING', 'INSURANCE'
);

CREATE TYPE payment_status AS ENUM (
    'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED',
    'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED', 'EXPIRED'
);

CREATE TYPE invoice_status AS ENUM (
    'DRAFT', 'SENT', 'VIEWED', 'PAID', 'PARTIALLY_PAID',
    'OVERDUE', 'CANCELLED', 'REFUNDED'
);

CREATE TYPE refund_status AS ENUM (
    'PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'
);

CREATE TYPE installment_status AS ENUM (
    'ACTIVE', 'PAID', 'OVERDUE', 'DEFAULTED', 'CANCELLED'
);

CREATE TYPE gift_card_status AS ENUM (
    'ACTIVE', 'USED', 'EXPIRED', 'DEACTIVATED'
);

CREATE TYPE corporate_account_status AS ENUM (
    'ACTIVE', 'SUSPENDED', 'CLOSED'
);

CREATE TYPE insurance_claim_status AS ENUM (
    'DRAFT', 'SUBMITTED', 'PROCESSING', 'APPROVED',
    'PARTIALLY_APPROVED', 'DENIED', 'APPEALED', 'PAID'
);

CREATE TYPE transaction_type AS ENUM (
    'CHARGE', 'REFUND', 'CHARGEBACK', 'DISPUTE', 'ADJUSTMENT', 'TRANSFER'
);

CREATE TYPE discount_type AS ENUM (
    'PERCENTAGE', 'FIXED', 'FREE_TEST', 'FREE_PACKAGE'
);

CREATE TYPE fraud_risk_level AS ENUM (
    'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
);

CREATE TYPE subscription_status AS ENUM (
    'ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED'
);

CREATE TYPE wallet_tx_type AS ENUM ('DEBIT', 'CREDIT', 'TRANSFER');

CREATE TYPE webhook_status AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'RETRYING');

CREATE TYPE fraud_alert_status AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE');

CREATE TYPE fraud_rule_type AS ENUM ('VELOCITY', 'AMOUNT', 'GEOLOCATION', 'DEVICE', 'PATTERN');

CREATE TYPE fraud_action AS ENUM ('BLOCK', 'FLAG', 'REVIEW', 'ALERT');

CREATE TYPE subscription_billing_cycle AS ENUM (
    'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'
);

CREATE TYPE corporate_billing_status AS ENUM ('OPEN', 'CLOSED', 'PAID');

CREATE TYPE tax_type AS ENUM ('VAT', 'EXEMPT');

CREATE TYPE tax_applies_to AS ENUM ('ALL', 'LAB_TESTS', 'MEDICATIONS', 'SERVICES');

CREATE TYPE wallet_status AS ENUM ('ACTIVE', 'FROZEN', 'CLOSED');

CREATE TYPE installment_payment_status AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'DEFAULTED');

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. invoices
-- ----------------------------------------------------------------------------
CREATE TABLE invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number      VARCHAR(20) UNIQUE NOT NULL,
    patient_id          UUID NOT NULL,
    order_id            UUID,
    branch_id           UUID NOT NULL,
    doctor_id           UUID,
    insurance_company_id UUID,
    policy_id           UUID,
    corporate_account_id UUID,
    subtotal            DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_type       discount_type,
    discount_code       VARCHAR(50),
    tax_rate            DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    tax_amount          DECIMAL(12,2) NOT NULL DEFAULT 0,
    insurance_coverage  DECIMAL(12,2) NOT NULL DEFAULT 0,
    patient_copay       DECIMAL(12,2) NOT NULL DEFAULT 0,
    total               DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency            VARCHAR(3) NOT NULL DEFAULT 'SAR',
    status              invoice_status NOT NULL DEFAULT 'DRAFT',
    due_date            DATE NOT NULL,
    paid_at             TIMESTAMPTZ,
    notes               TEXT,
    issued_by           UUID,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT chk_invoices_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_invoices_discount CHECK (discount_amount >= 0),
    CONSTRAINT chk_invoices_tax CHECK (tax_amount >= 0),
    CONSTRAINT chk_invoices_coverage CHECK (insurance_coverage >= 0),
    CONSTRAINT chk_invoices_copay CHECK (patient_copay >= 0),
    CONSTRAINT chk_invoices_total CHECK (total >= 0),
    CONSTRAINT chk_invoices_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100)
);

CREATE INDEX idx_invoices_patient_created ON invoices (patient_id, created_at DESC);
CREATE INDEX idx_invoices_status ON invoices (status);
CREATE INDEX idx_invoices_corporate ON invoices (corporate_account_id);
CREATE INDEX idx_invoices_due_date ON invoices (due_date) WHERE status IN ('SENT', 'VIEWED', 'OVERDUE');
CREATE INDEX idx_invoices_branch ON invoices (branch_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 2. invoice_items
-- ----------------------------------------------------------------------------
CREATE TABLE invoice_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    lab_test_id         UUID,
    package_id          UUID,
    test_name           VARCHAR(255) NOT NULL,
    test_name_ar        VARCHAR(255),
    quantity            INT NOT NULL DEFAULT 1,
    unit_price          DECIMAL(12,2) NOT NULL,
    discount_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount          DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_price         DECIMAL(12,2) NOT NULL,
    insurance_covered   DECIMAL(12,2) NOT NULL DEFAULT 0,
    patient_amount      DECIMAL(12,2) NOT NULL,

    CONSTRAINT chk_inv_items_qty CHECK (quantity > 0),
    CONSTRAINT chk_inv_items_price CHECK (unit_price >= 0),
    CONSTRAINT chk_inv_items_discount CHECK (discount_amount >= 0),
    CONSTRAINT chk_inv_items_tax CHECK (tax_amount >= 0),
    CONSTRAINT chk_inv_items_total CHECK (total_price >= 0)
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items (invoice_id);

-- ----------------------------------------------------------------------------
-- 3. payments (partitioned by month on created_at)
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
    id                      UUID NOT NULL DEFAULT gen_random_uuid(),
    payment_number          VARCHAR(20) UNIQUE NOT NULL,
    invoice_id              UUID NOT NULL,
    patient_id              UUID NOT NULL,
    method                  payment_method NOT NULL,
    status                  payment_status NOT NULL DEFAULT 'PENDING',
    amount                  DECIMAL(12,2) NOT NULL,
    currency                VARCHAR(3) NOT NULL DEFAULT 'SAR',
    exchange_rate           DECIMAL(10,6) DEFAULT 1.000000,
    platform_fee            DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_amount              DECIMAL(12,2) NOT NULL,
    gateway                 VARCHAR(50),
    gateway_transaction_id  VARCHAR(255),
    gateway_response        JSONB,
    card_last4              VARCHAR(4),
    card_brand              VARCHAR(20),
    card_exp_month          INT,
    card_exp_year           INT,
    wallet_id               UUID,
    installment_plan_id     UUID,
    gift_card_id            UUID,
    corporate_account_id    UUID,
    insurance_claim_id      UUID,
    processed_at            TIMESTAMPTZ,
    failed_at               TIMESTAMPTZ,
    failure_reason          TEXT,
    idempotency_key         VARCHAR(255) UNIQUE,
    metadata                JSONB,
    created_by              UUID,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (id, created_at),
    CONSTRAINT chk_payments_amount CHECK (amount > 0),
    CONSTRAINT chk_payments_platform_fee CHECK (platform_fee >= 0),
    CONSTRAINT chk_payments_net CHECK (net_amount >= 0),
    CONSTRAINT chk_payments_card_exp CHECK (
        (card_exp_month IS NULL AND card_exp_year IS NULL)
        OR (card_exp_month BETWEEN 1 AND 12 AND card_exp_year >= 2020)
    )
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for current and next 12 months
CREATE TABLE payments_2026_01 PARTITION OF payments FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE payments_2026_02 PARTITION OF payments FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE payments_2026_03 PARTITION OF payments FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE payments_2026_04 PARTITION OF payments FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE payments_2026_05 PARTITION OF payments FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE payments_2026_06 PARTITION OF payments FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE payments_2026_07 PARTITION OF payments FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE payments_2026_08 PARTITION OF payments FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE payments_2026_09 PARTITION OF payments FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE payments_2026_10 PARTITION OF payments FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE payments_2026_11 PARTITION OF payments FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE payments_2026_12 PARTITION OF payments FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

CREATE INDEX idx_payments_invoice ON payments (invoice_id);
CREATE INDEX idx_payments_patient_created ON payments (patient_id, created_at DESC);
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payments_gateway_tx ON payments (gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;
CREATE INDEX idx_payments_created ON payments (created_at DESC);
CREATE INDEX idx_payments_method ON payments (method, created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. payment_refunds
-- ----------------------------------------------------------------------------
CREATE TABLE payment_refunds (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refund_number       VARCHAR(20) UNIQUE NOT NULL,
    payment_id          UUID NOT NULL,
    invoice_id          UUID NOT NULL,
    amount              DECIMAL(12,2) NOT NULL,
    reason              TEXT NOT NULL,
    reason_ar           TEXT,
    status              refund_status NOT NULL DEFAULT 'PENDING',
    gateway_refund_id   VARCHAR(255),
    processed_by        UUID,
    approved_by         UUID,
    processed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_refunds_amount CHECK (amount > 0)
);

CREATE INDEX idx_refunds_payment ON payment_refunds (payment_id);
CREATE INDEX idx_refunds_status ON payment_refunds (status);
CREATE INDEX idx_refunds_created ON payment_refunds (created_at DESC);

-- ----------------------------------------------------------------------------
-- 5. payment_webhooks (partitioned by month on created_at)
-- ----------------------------------------------------------------------------
CREATE TABLE payment_webhooks (
    id                      UUID NOT NULL DEFAULT gen_random_uuid(),
    provider                VARCHAR(50) NOT NULL,
    event_type              VARCHAR(100) NOT NULL,
    event_id                VARCHAR(255),
    payload                 JSONB NOT NULL,
    signature               TEXT,
    status                  webhook_status NOT NULL DEFAULT 'RECEIVED',
    processing_attempts     INT NOT NULL DEFAULT 0,
    last_attempt_at         TIMESTAMPTZ,
    processed_at            TIMESTAMPTZ,
    idempotency_key         VARCHAR(255) UNIQUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE payment_webhooks_2026_01 PARTITION OF payment_webhooks FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE payment_webhooks_2026_02 PARTITION OF payment_webhooks FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE payment_webhooks_2026_03 PARTITION OF payment_webhooks FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE payment_webhooks_2026_04 PARTITION OF payment_webhooks FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE payment_webhooks_2026_05 PARTITION OF payment_webhooks FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE payment_webhooks_2026_06 PARTITION OF payment_webhooks FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE payment_webhooks_2026_07 PARTITION OF payment_webhooks FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE payment_webhooks_2026_08 PARTITION OF payment_webhooks FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE payment_webhooks_2026_09 PARTITION OF payment_webhooks FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE payment_webhooks_2026_10 PARTITION OF payment_webhooks FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE payment_webhooks_2026_11 PARTITION OF payment_webhooks FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE payment_webhooks_2026_12 PARTITION OF payment_webhooks FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

CREATE INDEX idx_webhooks_provider_event ON payment_webhooks (provider, event_type);
CREATE INDEX idx_webhooks_status ON payment_webhooks (status) WHERE status IN ('RECEIVED', 'RETRYING');
CREATE INDEX idx_webhooks_event_id ON payment_webhooks (event_id) WHERE event_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 6. wallet
-- ----------------------------------------------------------------------------
CREATE TABLE wallet (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_number   VARCHAR(20) UNIQUE NOT NULL,
    patient_id      UUID NOT NULL,
    balance         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    currency        VARCHAR(3) NOT NULL DEFAULT 'SAR',
    status          wallet_status NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_wallet_balance CHECK (balance >= 0)
);

CREATE INDEX idx_wallet_patient ON wallet (patient_id);
CREATE UNIQUE INDEX idx_wallet_number ON wallet (wallet_number);

-- ----------------------------------------------------------------------------
-- 7. wallet_transactions
-- ----------------------------------------------------------------------------
CREATE TABLE wallet_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id       UUID NOT NULL REFERENCES wallet(id) ON DELETE CASCADE,
    type            wallet_tx_type NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    balance_after   DECIMAL(12,2) NOT NULL,
    description     TEXT,
    reference_type  VARCHAR(50),
    reference_id    UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_wtx_amount CHECK (amount > 0),
    CONSTRAINT chk_wtx_balance CHECK (balance_after >= 0)
);

CREATE INDEX idx_wtx_wallet ON wallet_transactions (wallet_id, created_at DESC);
CREATE INDEX idx_wtx_reference ON wallet_transactions (reference_type, reference_id) WHERE reference_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 8. gift_cards
-- ----------------------------------------------------------------------------
CREATE TABLE gift_cards (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_number         VARCHAR(20) UNIQUE NOT NULL,
    card_code_hash      VARCHAR(255) NOT NULL,
    initial_amount      DECIMAL(12,2) NOT NULL,
    current_amount      DECIMAL(12,2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'SAR',
    status              gift_card_status NOT NULL DEFAULT 'ACTIVE',
    purchased_by        UUID NOT NULL,
    recipient_name      VARCHAR(255),
    recipient_email     VARCHAR(255),
    recipient_phone     VARCHAR(20),
    expires_at          TIMESTAMPTZ NOT NULL,
    redeemed_at         TIMESTAMPTZ,
    redeemed_by         UUID,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_gc_initial CHECK (initial_amount > 0),
    CONSTRAINT chk_gc_current CHECK (current_amount >= 0),
    CONSTRAINT chk_gc_amounts CHECK (current_amount <= initial_amount)
);

CREATE INDEX idx_gc_card_number ON gift_cards (card_number);
CREATE INDEX idx_gc_card_code ON gift_cards (card_code_hash);
CREATE INDEX idx_gc_status ON gift_cards (status) WHERE status = 'ACTIVE';
CREATE INDEX idx_gc_purchased_by ON gift_cards (purchased_by);

-- ----------------------------------------------------------------------------
-- 9. installment_plans
-- ----------------------------------------------------------------------------
CREATE TABLE installment_plans (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_number             VARCHAR(20) UNIQUE NOT NULL,
    patient_id              UUID NOT NULL,
    invoice_id              UUID NOT NULL,
    total_amount            DECIMAL(12,2) NOT NULL,
    number_of_installments   INT NOT NULL,
    installment_amount      DECIMAL(12,2) NOT NULL,
    down_payment            DECIMAL(12,2) NOT NULL DEFAULT 0,
    interest_rate           DECIMAL(5,2) NOT NULL DEFAULT 0,
    monthly_fee             DECIMAL(12,2) NOT NULL DEFAULT 0,
    status                  installment_status NOT NULL DEFAULT 'ACTIVE',
    start_date              DATE NOT NULL,
    next_due_date           DATE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_inst_total CHECK (total_amount > 0),
    CONSTRAINT chk_inst_installments CHECK (number_of_installments > 0),
    CONSTRAINT chk_inst_installment_amt CHECK (installment_amount > 0),
    CONSTRAINT chk_inst_down CHECK (down_payment >= 0),
    CONSTRAINT chk_inst_interest CHECK (interest_rate >= 0 AND interest_rate <= 100),
    CONSTRAINT chk_inst_monthly_fee CHECK (monthly_fee >= 0)
);

CREATE INDEX idx_inst_plans_patient ON installment_plans (patient_id);
CREATE INDEX idx_inst_plans_status ON installment_plans (status);
CREATE INDEX idx_inst_plans_next_due ON installment_plans (next_due_date) WHERE status = 'ACTIVE';

-- ----------------------------------------------------------------------------
-- 10. installment_payments
-- ----------------------------------------------------------------------------
CREATE TABLE installment_payments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id                 UUID NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
    installment_number      INT NOT NULL,
    amount_due              DECIMAL(12,2) NOT NULL,
    amount_paid             DECIMAL(12,2) NOT NULL DEFAULT 0,
    due_date                DATE NOT NULL,
    paid_at                 TIMESTAMPTZ,
    status                  installment_payment_status NOT NULL DEFAULT 'PENDING',
    late_fee                DECIMAL(12,2) NOT NULL DEFAULT 0,
    gateway_transaction_id  VARCHAR(255),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_inst_pay_due CHECK (amount_due > 0),
    CONSTRAINT chk_inst_pay_paid CHECK (amount_paid >= 0),
    CONSTRAINT chk_inst_pay_late CHECK (late_fee >= 0),
    CONSTRAINT chk_inst_pay_number CHECK (installment_number > 0),
    CONSTRAINT uq_inst_pay_plan_number UNIQUE (plan_id, installment_number)
);

CREATE INDEX idx_inst_payments_plan ON installment_payments (plan_id);
CREATE INDEX idx_inst_payments_status ON installment_payments (status) WHERE status IN ('PENDING', 'OVERDUE');
CREATE INDEX idx_inst_payments_due ON installment_payments (due_date) WHERE status = 'PENDING';

-- ----------------------------------------------------------------------------
-- 11. corporate_accounts
-- ----------------------------------------------------------------------------
CREATE TABLE corporate_accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number      VARCHAR(20) UNIQUE NOT NULL,
    company_name        VARCHAR(255) NOT NULL,
    company_name_ar     VARCHAR(255),
    tax_number          VARCHAR(20) NOT NULL,
    cr_number           VARCHAR(20) NOT NULL,
    contact_name        VARCHAR(255) NOT NULL,
    contact_email       VARCHAR(255) NOT NULL,
    contact_phone       VARCHAR(20) NOT NULL,
    credit_limit        DECIMAL(12,2) NOT NULL DEFAULT 0,
    current_balance     DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_terms_days  INT NOT NULL DEFAULT 30,
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    status              corporate_account_status NOT NULL DEFAULT 'ACTIVE',
    contract_start_date DATE NOT NULL,
    contract_end_date   DATE,
    billing_address     JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT chk_corp_credit CHECK (credit_limit >= 0),
    CONSTRAINT chk_corp_balance CHECK (current_balance >= 0),
    CONSTRAINT chk_corp_terms CHECK (payment_terms_days > 0),
    CONSTRAINT chk_corp_discount CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    CONSTRAINT chk_corp_dates CHECK (contract_end_date IS NULL OR contract_end_date >= contract_start_date)
);

CREATE INDEX idx_corp_account_number ON corporate_accounts (account_number);
CREATE INDEX idx_corp_company ON corporate_accounts (company_name);
CREATE INDEX idx_corp_status ON corporate_accounts (status) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 12. corporate_billing_cycles
-- ----------------------------------------------------------------------------
CREATE TABLE corporate_billing_cycles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_account_id    UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
    cycle_start             DATE NOT NULL,
    cycle_end               DATE NOT NULL,
    total_invoices          INT NOT NULL DEFAULT 0,
    total_amount            DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_applied        DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_amount              DECIMAL(12,2) NOT NULL DEFAULT 0,
    status                  corporate_billing_status NOT NULL DEFAULT 'OPEN',
    due_date                DATE NOT NULL,
    paid_at                 TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_corp_cycle_invoices CHECK (total_invoices >= 0),
    CONSTRAINT chk_corp_cycle_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_corp_cycle_discount CHECK (discount_applied >= 0),
    CONSTRAINT chk_corp_cycle_net CHECK (net_amount >= 0),
    CONSTRAINT chk_corp_cycle_dates CHECK (cycle_end >= cycle_start)
);

CREATE INDEX idx_corp_cycle_account ON corporate_billing_cycles (corporate_account_id, cycle_start DESC);
CREATE INDEX idx_corp_cycle_status ON corporate_billing_cycles (status) WHERE status = 'OPEN';
CREATE INDEX idx_corp_cycle_due ON corporate_billing_cycles (due_date) WHERE status IN ('OPEN', 'CLOSED');

-- ----------------------------------------------------------------------------
-- 13. subscriptions
-- ----------------------------------------------------------------------------
CREATE TABLE subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id          UUID NOT NULL,
    package_id          UUID NOT NULL,
    branch_id           UUID NOT NULL,
    status              subscription_status NOT NULL DEFAULT 'ACTIVE',
    billing_cycle       subscription_billing_cycle NOT NULL DEFAULT 'MONTHLY',
    price_per_cycle     DECIMAL(12,2) NOT NULL,
    next_billing_date   DATE NOT NULL,
    start_date          DATE NOT NULL,
    end_date            DATE,
    cancelled_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_sub_price CHECK (price_per_cycle > 0),
    CONSTRAINT chk_sub_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_sub_patient ON subscriptions (patient_id);
CREATE INDEX idx_sub_status ON subscriptions (status);
CREATE INDEX idx_sub_next_billing ON subscriptions (next_billing_date) WHERE status = 'ACTIVE';
CREATE INDEX idx_sub_branch ON subscriptions (branch_id);

-- ----------------------------------------------------------------------------
-- 14. coupons
-- ----------------------------------------------------------------------------
CREATE TABLE coupons (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                    VARCHAR(50) UNIQUE NOT NULL,
    code_hash               VARCHAR(255) NOT NULL,
    description             TEXT,
    description_ar          TEXT,
    discount_type           discount_type NOT NULL,
    discount_value          DECIMAL(12,2) NOT NULL,
    max_uses                INT NOT NULL,
    used_count              INT NOT NULL DEFAULT 0,
    min_order_amount        DECIMAL(12,2) NOT NULL DEFAULT 0,
    max_discount_amount     DECIMAL(12,2),
    valid_from              TIMESTAMPTZ NOT NULL,
    valid_until             TIMESTAMPTZ NOT NULL,
    applicable_test_ids     JSONB,
    applicable_package_ids  JSONB,
    is_active               BOOLEAN NOT NULL DEFAULT true,
    created_by              UUID,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_coupon_value CHECK (discount_value > 0),
    CONSTRAINT chk_coupon_uses CHECK (max_uses > 0 AND used_count >= 0 AND used_count <= max_uses),
    CONSTRAINT chk_coupon_min_order CHECK (min_order_amount >= 0),
    CONSTRAINT chk_coupon_max_discount CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),
    CONSTRAINT chk_coupon_validity CHECK (valid_until > valid_from)
);

CREATE INDEX idx_coupons_code ON coupons (code);
CREATE INDEX idx_coupons_code_hash ON coupons (code_hash);
CREATE INDEX idx_coupons_active ON coupons (is_active, valid_from, valid_until) WHERE is_active = true;

-- ----------------------------------------------------------------------------
-- 15. payment_audit_log (partitioned by month on created_at)
-- ----------------------------------------------------------------------------
CREATE TABLE payment_audit_log (
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    payment_id      UUID NOT NULL,
    action          VARCHAR(100) NOT NULL,
    actor_id        UUID NOT NULL,
    actor_email     VARCHAR(255) NOT NULL,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    request_id      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE payment_audit_log_2026_01 PARTITION OF payment_audit_log FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE payment_audit_log_2026_02 PARTITION OF payment_audit_log FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE payment_audit_log_2026_03 PARTITION OF payment_audit_log FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE payment_audit_log_2026_04 PARTITION OF payment_audit_log FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE payment_audit_log_2026_05 PARTITION OF payment_audit_log FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE payment_audit_log_2026_06 PARTITION OF payment_audit_log FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE payment_audit_log_2026_07 PARTITION OF payment_audit_log FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE payment_audit_log_2026_08 PARTITION OF payment_audit_log FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE payment_audit_log_2026_09 PARTITION OF payment_audit_log FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE payment_audit_log_2026_10 PARTITION OF payment_audit_log FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE payment_audit_log_2026_11 PARTITION OF payment_audit_log FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE payment_audit_log_2026_12 PARTITION OF payment_audit_log FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

CREATE INDEX idx_audit_payment ON payment_audit_log (payment_id, created_at DESC);
CREATE INDEX idx_audit_actor ON payment_audit_log (actor_id, created_at DESC);
CREATE INDEX idx_audit_action ON payment_audit_log (action);

-- ----------------------------------------------------------------------------
-- 16. fraud_detection_rules
-- ----------------------------------------------------------------------------
CREATE TABLE fraud_detection_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name       VARCHAR(100) NOT NULL,
    rule_type       fraud_rule_type NOT NULL,
    conditions      JSONB NOT NULL,
    action          fraud_action NOT NULL DEFAULT 'REVIEW',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    severity        fraud_risk_level NOT NULL DEFAULT 'LOW',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fraud_rules_type ON fraud_detection_rules (rule_type) WHERE is_active = true;
CREATE INDEX idx_fraud_rules_active ON fraud_detection_rules (is_active);

-- ----------------------------------------------------------------------------
-- 17. fraud_alerts
-- ----------------------------------------------------------------------------
CREATE TABLE fraud_alerts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id          UUID NOT NULL,
    patient_id          UUID NOT NULL,
    rule_id             UUID NOT NULL REFERENCES fraud_detection_rules(id),
    risk_level          fraud_risk_level NOT NULL,
    risk_score          INT NOT NULL DEFAULT 0,
    risk_factors        JSONB,
    status              fraud_alert_status NOT NULL DEFAULT 'OPEN',
    investigated_by     UUID,
    resolution_notes    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ,

    CONSTRAINT chk_fraud_score CHECK (risk_score BETWEEN 0 AND 100)
);

CREATE INDEX idx_fraud_alerts_payment ON fraud_alerts (payment_id);
CREATE INDEX idx_fraud_alerts_risk ON fraud_alerts (risk_level);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts (status) WHERE status IN ('OPEN', 'INVESTIGATING');

-- ----------------------------------------------------------------------------
-- 18. tax_configurations
-- ----------------------------------------------------------------------------
CREATE TABLE tax_configurations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_name        VARCHAR(100) NOT NULL,
    tax_name_ar     VARCHAR(100) NOT NULL,
    tax_rate        DECIMAL(5,2) NOT NULL,
    tax_type        tax_type NOT NULL DEFAULT 'VAT',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    applies_to      tax_applies_to NOT NULL DEFAULT 'ALL',
    effective_from  DATE NOT NULL,
    effective_until DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100),
    CONSTRAINT chk_tax_dates CHECK (effective_until IS NULL OR effective_until >= effective_from)
);

CREATE INDEX idx_tax_active ON tax_configurations (is_active, effective_from) WHERE is_active = true;
CREATE INDEX idx_tax_applies ON tax_configurations (applies_to);

-- ============================================================================
-- MATERIALIZED VIEWS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- mv_revenue_daily — Daily revenue by branch and payment method
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_revenue_daily AS
SELECT
    DATE(p.created_at)                      AS revenue_date,
    i.branch_id,
    p.method,
    p.currency,
    COUNT(*)                                AS transaction_count,
    SUM(p.amount)                           AS gross_revenue,
    SUM(p.platform_fee)                     AS total_fees,
    SUM(p.net_amount)                       AS net_revenue,
    SUM(CASE WHEN p.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
    SUM(CASE WHEN p.status = 'FAILED' THEN 1 ELSE 0 END)    AS failed_count
FROM payments p
JOIN invoices i ON i.id = p.invoice_id
WHERE p.status IN ('COMPLETED', 'PARTIALLY_REFUNDED')
  AND i.deleted_at IS NULL
GROUP BY DATE(p.created_at), i.branch_id, p.method, p.currency
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_revenue_daily
    ON mv_revenue_daily (revenue_date, branch_id, method, currency);

-- ----------------------------------------------------------------------------
-- mv_revenue_monthly — Monthly revenue summary
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_revenue_monthly AS
SELECT
    DATE_TRUNC('month', p.created_at)       AS revenue_month,
    i.branch_id,
    p.currency,
    COUNT(DISTINCT p.id)                    AS total_transactions,
    COUNT(DISTINCT p.patient_id)            AS unique_patients,
    SUM(p.amount)                           AS gross_revenue,
    SUM(p.platform_fee)                     AS total_fees,
    SUM(p.net_amount)                       AS net_revenue,
    SUM(i.tax_amount)                       AS total_tax_collected,
    SUM(i.discount_amount)                  AS total_discounts,
    AVG(p.amount)                           AS avg_transaction_value,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY p.amount) AS p95_transaction_value
FROM payments p
JOIN invoices i ON i.id = p.invoice_id
WHERE p.status = 'COMPLETED'
  AND i.deleted_at IS NULL
GROUP BY DATE_TRUNC('month', p.created_at), i.branch_id, p.currency
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_revenue_monthly
    ON mv_revenue_monthly (revenue_month, branch_id, currency);

-- ----------------------------------------------------------------------------
-- mv_payment_stats — Payment success/failure rates
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_payment_stats AS
SELECT
    DATE_TRUNC('day', p.created_at)         AS stat_date,
    p.method,
    p.gateway,
    COUNT(*)                                AS total_attempts,
    SUM(CASE WHEN p.status = 'COMPLETED' THEN 1 ELSE 0 END)    AS successful,
    SUM(CASE WHEN p.status = 'FAILED' THEN 1 ELSE 0 END)       AS failed,
    SUM(CASE WHEN p.status = 'PENDING' THEN 1 ELSE 0 END)      AS pending,
    SUM(CASE WHEN p.status = 'CANCELLED' THEN 1 ELSE 0 END)    AS cancelled,
    ROUND(
        100.0 * SUM(CASE WHEN p.status = 'COMPLETED' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
        2
    )                                       AS success_rate_pct,
    ROUND(
        100.0 * SUM(CASE WHEN p.status = 'FAILED' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
        2
    )                                       AS failure_rate_pct,
    SUM(CASE WHEN p.status = 'COMPLETED' THEN p.amount ELSE 0 END) AS successful_amount,
    SUM(CASE WHEN p.status = 'FAILED' THEN p.amount ELSE 0 END)    AS failed_amount
FROM payments p
GROUP BY DATE_TRUNC('day', p.created_at), p.method, p.gateway
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_payment_stats
    ON mv_payment_stats (stat_date, method, gateway);

-- ----------------------------------------------------------------------------
-- mv_outstanding_invoices — Overdue invoices with aging
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_outstanding_invoices AS
SELECT
    i.id                                    AS invoice_id,
    i.invoice_number,
    i.patient_id,
    i.branch_id,
    i.corporate_account_id,
    i.total,
    i.due_date,
    i.status,
    CURRENT_DATE - i.due_date               AS days_overdue,
    CASE
        WHEN CURRENT_DATE - i.due_date <= 30  THEN '1-30 days'
        WHEN CURRENT_DATE - i.due_date <= 60  THEN '31-60 days'
        WHEN CURRENT_DATE - i.due_date <= 90  THEN '61-90 days'
        ELSE '90+ days'
    END                                     AS aging_bucket,
    COALESCE((
        SELECT SUM(pr.amount)
        FROM payment_refunds pr
        WHERE pr.invoice_id = i.id AND pr.status = 'COMPLETED'
    ), 0)                                   AS total_refunded,
    i.total - COALESCE((
        SELECT SUM(pr.amount)
        FROM payment_refunds pr
        WHERE pr.invoice_id = i.id AND pr.status = 'COMPLETED'
    ), 0)                                   AS outstanding_amount
FROM invoices i
WHERE i.status IN ('SENT', 'VIEWED', 'PARTIALLY_PAID', 'OVERDUE')
  AND i.deleted_at IS NULL
  AND i.due_date < CURRENT_DATE
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_outstanding_invoices
    ON mv_outstanding_invoices (invoice_id);

-- ----------------------------------------------------------------------------
-- mv_corporate_outstanding — Corporate account balances
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_corporate_outstanding AS
SELECT
    ca.id                                   AS corporate_account_id,
    ca.account_number,
    ca.company_name,
    ca.credit_limit,
    ca.current_balance,
    ca.payment_terms_days,
    ca.status,
    COUNT(i.id)                             AS open_invoices,
    COALESCE(SUM(i.total), 0)               AS total_invoiced,
    COALESCE(SUM(CASE
        WHEN i.status IN ('SENT', 'VIEWED', 'OVERDUE')
        THEN i.total ELSE 0
    END), 0)                                AS outstanding_amount,
    MIN(i.due_date) FILTER (
        WHERE i.status IN ('SENT', 'VIEWED', 'OVERDUE')
    )                                       AS earliest_due_date,
    MAX(i.due_date) FILTER (
        WHERE i.status IN ('SENT', 'VIEWED', 'OVERDUE')
    )                                       AS latest_due_date
FROM corporate_accounts ca
LEFT JOIN invoices i ON i.corporate_account_id = ca.id AND i.deleted_at IS NULL
WHERE ca.deleted_at IS NULL
GROUP BY ca.id, ca.account_number, ca.company_name, ca.credit_limit,
         ca.current_balance, ca.payment_terms_days, ca.status
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_corporate_outstanding
    ON mv_corporate_outstanding (corporate_account_id);

-- ----------------------------------------------------------------------------
-- mv_refund_stats — Refund rates by reason
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_refund_stats AS
SELECT
    DATE_TRUNC('month', pr.created_at)      AS refund_month,
    pr.reason,
    pr.status                               AS refund_status,
    COUNT(*)                                AS refund_count,
    SUM(pr.amount)                          AS total_refund_amount,
    AVG(pr.amount)                          AS avg_refund_amount,
    MAX(pr.amount)                          AS max_refund_amount,
    MIN(pr.created_at) FILTER (WHERE pr.status = 'COMPLETED') AS earliest_processed,
    MAX(pr.created_at) FILTER (WHERE pr.status = 'COMPLETED') AS latest_processed
FROM payment_refunds pr
GROUP BY DATE_TRUNC('month', pr.created_at), pr.reason, pr.status
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_refund_stats
    ON mv_refund_stats (refund_month, reason, refund_status);

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoices_updated
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_payments_updated
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_refunds_updated
    BEFORE UPDATE ON payment_refunds
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_wallet_updated
    BEFORE UPDATE ON wallet
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_installment_plans_updated
    BEFORE UPDATE ON installment_plans
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_corporate_accounts_updated
    BEFORE UPDATE ON corporate_accounts
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_subscriptions_updated
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- Auto-update corporate account balance on payment
CREATE OR REPLACE FUNCTION fn_update_corporate_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'COMPLETED' AND NEW.corporate_account_id IS NOT NULL THEN
        UPDATE corporate_accounts
        SET current_balance = current_balance + NEW.amount
        WHERE id = NEW.corporate_account_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_corporate_balance
    AFTER INSERT OR UPDATE OF status ON payments
    FOR EACH ROW EXECUTE FUNCTION fn_update_corporate_balance();

-- Auto-update invoice status on payment completion
CREATE OR REPLACE FUNCTION fn_update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_total_paid DECIMAL(12,2);
    v_invoice_total DECIMAL(12,2);
BEGIN
    IF NEW.status = 'COMPLETED' THEN
        SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
        FROM payments
        WHERE invoice_id = NEW.invoice_id AND status = 'COMPLETED';

        SELECT total INTO v_invoice_total
        FROM invoices WHERE id = NEW.invoice_id;

        IF v_total_paid >= v_invoice_total THEN
            UPDATE invoices SET status = 'PAID', paid_at = NOW()
            WHERE id = NEW.invoice_id AND status NOT IN ('PAID', 'CANCELLED', 'REFUNDED');
        ELSIF v_total_paid > 0 THEN
            UPDATE invoices SET status = 'PARTIALLY_PAID'
            WHERE id = NEW.invoice_id AND status NOT IN ('PAID', 'CANCELLED', 'REFUNDED');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_invoice_status
    AFTER INSERT OR UPDATE OF status ON payments
    FOR EACH ROW EXECUTE FUNCTION fn_update_invoice_status_on_payment();

-- Prevent duplicate idempotent payments
CREATE OR REPLACE FUNCTION fn_check_idempotency()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.idempotency_key IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM payments
            WHERE idempotency_key = NEW.idempotency_key
              AND id != NEW.id
        ) THEN
            RAISE EXCEPTION 'Duplicate idempotency key: %', NEW.idempotency_key;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_idempotency
    BEFORE INSERT ON payments
    FOR EACH ROW EXECUTE FUNCTION fn_check_idempotency();

-- ============================================================================
-- SEQUENCE GENERATORS (for auto-numbering)
-- ============================================================================

CREATE SEQUENCE seq_invoice_number START 1;
CREATE SEQUENCE seq_payment_number START 1;
CREATE SEQUENCE seq_refund_number START 1;
CREATE SEQUENCE seq_wallet_number START 1;
CREATE SEQUENCE seq_gift_card_number START 1;
CREATE SEQUENCE seq_installment_plan_number START 1;
CREATE SEQUENCE seq_corporate_account_number START 1;
CREATE SEQUENCE seq_subscription_number START 1;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Default tax configuration: 15% VAT Saudi Arabia
INSERT INTO tax_configurations (tax_name, tax_name_ar, tax_rate, tax_type, is_active, applies_to, effective_from)
VALUES
    ('VAT 15%', 'ضريبة القيمة المضافة ١٥٪', 15.00, 'VAT', true, 'ALL', '2020-07-01'),
    ('VAT 5% (Legacy)', 'ضريبة القيمة المضافة ٥٪ (قديم)', 5.00, 'VAT', false, 'ALL', '2018-01-01'),
    ('Zero Rated', 'معدل صفري', 0.00, 'EXEMPT', true, 'ALL', '2020-07-01');

-- Sample fraud detection rules
INSERT INTO fraud_detection_rules (rule_name, rule_type, conditions, action, is_active, severity)
VALUES
    (
        'Velocity: 5 payments in 10 minutes',
        'VELOCITY',
        '{"window_minutes": 10, "max_count": 5, "scope": "patient_id"}'::jsonb,
        'FLAG',
        true,
        'MEDIUM'
    ),
    (
        'Velocity: 3 failed payments in 5 minutes',
        'VELOCITY',
        '{"window_minutes": 5, "max_count": 3, "scope": "patient_id", "status_filter": "FAILED"}'::jsonb,
        'BLOCK',
        true,
        'HIGH'
    ),
    (
        'Amount: Single payment over 50,000 SAR',
        'AMOUNT',
        '{"min_amount": 50000, "currency": "SAR"}'::jsonb,
        'REVIEW',
        true,
        'HIGH'
    ),
    (
        'Amount: Daily total over 100,000 SAR',
        'AMOUNT',
        '{"daily_max": 100000, "currency": "SAR", "scope": "patient_id"}'::jsonb,
        'REVIEW',
        true,
        'HIGH'
    ),
    (
        'Device: Known fraud device fingerprint',
        'DEVICE',
        '{"match_against": "flagged_device_ids", "action_on_match": "BLOCK"}'::jsonb,
        'BLOCK',
        true,
        'CRITICAL'
    ),
    (
        'Geolocation: Payment from different country than patient address',
        'GEOLOCATION',
        '{"check_ip_vs_address": true, "allowed_countries": ["SA", "AE", "BH", "KW", "QA", "OM"]}'::jsonb,
        'FLAG',
        true,
        'MEDIUM'
    ),
    (
        'Pattern: Multiple cards same device in 24 hours',
        'PATTERN',
        '{"window_hours": 24, "unique_cards_threshold": 3, "scope": "device_id"}'::jsonb,
        'REVIEW',
        true,
        'HIGH'
    ),
    (
        'Pattern: Gift card used immediately after purchase',
        'PATTERN',
        '{"redeem_within_minutes": 5, "flag_if_amount_matches_initial": true}'::jsonb,
        'ALERT',
        true,
        'MEDIUM'
    ),
    (
        'Velocity: 10+ refunds in 30 days',
        'VELOCITY',
        '{"window_days": 30, "max_count": 10, "scope": "patient_id", "status_filter": "COMPLETED"}'::jsonb,
        'REVIEW',
        true,
        'MEDIUM'
    ),
    (
        'Amount: Refund request over 80% of original payment',
        'AMOUNT',
        '{"percentage_of_original": 80}'::jsonb,
        'ALERT',
        true,
        'LOW'
    );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-generate invoice numbers
CREATE OR REPLACE FUNCTION fn_generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') ||
            LPAD(nextval('seq_invoice_number')::TEXT, 8, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoices_number
    BEFORE INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION fn_generate_invoice_number();

-- Auto-generate payment numbers
CREATE OR REPLACE FUNCTION fn_generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
        NEW.payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYY') ||
            LPAD(nextval('seq_payment_number')::TEXT, 8, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_number
    BEFORE INSERT ON payments
    FOR EACH ROW EXECUTE FUNCTION fn_generate_payment_number();

-- Auto-generate refund numbers
CREATE OR REPLACE FUNCTION fn_generate_refund_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.refund_number IS NULL OR NEW.refund_number = '' THEN
        NEW.refund_number := 'REF-' || TO_CHAR(NOW(), 'YYYY') ||
            LPAD(nextval('seq_refund_number')::TEXT, 8, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refunds_number
    BEFORE INSERT ON payment_refunds
    FOR EACH ROW EXECUTE FUNCTION fn_generate_refund_number();

-- Auto-generate wallet numbers
CREATE OR REPLACE FUNCTION fn_generate_wallet_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.wallet_number IS NULL OR NEW.wallet_number = '' THEN
        NEW.wallet_number := 'WAL-' || TO_CHAR(NOW(), 'YYYY') ||
            LPAD(nextval('seq_wallet_number')::TEXT, 8, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_number
    BEFORE INSERT ON wallet
    FOR EACH ROW EXECUTE FUNCTION fn_generate_wallet_number();

-- Auto-generate gift card numbers
CREATE OR REPLACE FUNCTION fn_generate_gift_card_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.card_number IS NULL OR NEW.card_number = '' THEN
        NEW.card_number := 'GC-' || TO_CHAR(NOW(), 'YYYY') ||
            LPAD(nextval('seq_gift_card_number')::TEXT, 8, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gift_cards_number
    BEFORE INSERT ON gift_cards
    FOR EACH ROW EXECUTE FUNCTION fn_generate_gift_card_number();

-- Auto-generate installment plan numbers
CREATE OR REPLACE FUNCTION fn_generate_installment_plan_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.plan_number IS NULL OR NEW.plan_number = '' THEN
        NEW.plan_number := 'INST-' || TO_CHAR(NOW(), 'YYYY') ||
            LPAD(nextval('seq_installment_plan_number')::TEXT, 8, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_installment_plans_number
    BEFORE INSERT ON installment_plans
    FOR EACH ROW EXECUTE FUNCTION fn_generate_installment_plan_number();

-- Auto-generate corporate account numbers
CREATE OR REPLACE FUNCTION fn_generate_corporate_account_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.account_number IS NULL OR NEW.account_number = '' THEN
        NEW.account_number := 'CORP-' || TO_CHAR(NOW(), 'YYYY') ||
            LPAD(nextval('seq_corporate_account_number')::TEXT, 8, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_corporate_accounts_number
    BEFORE INSERT ON corporate_accounts
    FOR EACH ROW EXECUTE FUNCTION fn_generate_corporate_account_number();

-- Auto-generate subscription numbers
CREATE OR REPLACE FUNCTION fn_generate_subscription_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.subscription_number IS NULL OR NEW.subscription_number = '' THEN
        NEW.subscription_number := 'SUB-' || TO_CHAR(NOW(), 'YYYY') ||
            LPAD(nextval('seq_subscription_number')::TEXT, 8, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscriptions_number
    BEFORE INSERT ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION fn_generate_subscription_number();

-- ============================================================================
-- REFRESH MATERIALIZED VIEWS (call via cron or pg_cron)
-- ============================================================================

-- Example cron job setup (requires pg_cron extension):
-- SELECT cron.schedule('refresh-revenue-daily', '0 2 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_daily');
-- SELECT cron.schedule('refresh-revenue-monthly', '0 3 1 * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_monthly');
-- SELECT cron.schedule('refresh-payment-stats', '*/15 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_payment_stats');
-- SELECT cron.schedule('refresh-outstanding', '0 1 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_outstanding_invoices');
-- SELECT cron.schedule('refresh-corporate', '0 1 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_corporate_outstanding');
-- SELECT cron.schedule('refresh-refund-stats', '0 3 * * 0', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_refund_stats');

COMMIT;
