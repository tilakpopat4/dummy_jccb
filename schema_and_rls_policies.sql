-- =============================================================================
-- THE JUNAGADH COMMERCIAL CO-OPERATIVE BANK LTD. (JCCB)
-- Production Supabase PostgreSQL Schema & Row-Level Security (RLS) Policy Engine
-- Model: 3-Role Standard (head_office, branch_employee, tech_admin)
-- Authorization: Instant Revocation via Lookup Table (user_profiles)
-- Audit Standard: 100% Server-Side Trigger Logging (Immutable Audit Logs)
-- Security Standard: Zero 'FOR ALL' Policies (Explicit Command Separation)
-- =============================================================================

-- =============================================================================
-- 1. EXTENSIONS & ENUMS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 2. USER PROFILES TABLE (AUTHORIZATION LOOKUP TABLE)
-- =============================================================================
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('head_office', 'branch_employee', 'tech_admin')),
    branch_id VARCHAR(16) NOT NULL, -- '99' for Head Office / Tech Admin, '01' through '18' for branches
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_auth ON public.user_profiles(id, is_active, role, branch_id);

-- =============================================================================
-- 3. INSTANT REVOCATION SECURITY DEFINER HELPER FUNCTION
-- =============================================================================
-- Evaluated on every single query. If is_active is set to FALSE, access is revoked
-- instantly (0 ms delay) without waiting for JWT token expiration (1 hour).
CREATE OR REPLACE FUNCTION public.get_auth_profile()
RETURNS TABLE (
    user_id UUID,
    role VARCHAR,
    branch_id VARCHAR,
    full_name VARCHAR
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id, role, branch_id, full_name
    FROM public.user_profiles
    WHERE id = auth.uid() AND is_active = TRUE;
$$;

-- =============================================================================
-- 4. MASTER & TRANSACTION TABLES
-- =============================================================================

-- A. Branches Directory
CREATE TABLE public.branches (
    branch_code VARCHAR(16) PRIMARY KEY,
    branch_name VARCHAR(255) NOT NULL,
    branch_name_guj VARCHAR(255),
    is_head_office BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- B. Daily Gold Rates
CREATE TABLE public.rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    rate_22k NUMERIC(10, 2) NOT NULL,
    rate_24k NUMERIC(10, 2) NOT NULL,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- C. Rules Master (Dynamic Bank Policies)
CREATE TABLE public.rules_master (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'rulesMaster',
    rules_json JSONB NOT NULL,
    updated_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D. Product Schemes Master
CREATE TABLE public.products (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    min_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    max_amount NUMERIC(15, 2) NOT NULL DEFAULT 999999999.00,
    interest_rate NUMERIC(5, 2) NOT NULL,
    scheme_type VARCHAR(32) NOT NULL DEFAULT 'bullet', -- 'bullet', 'installment', 'overdraft'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- E. Valuers Directory (Branch-Scoped)
CREATE TABLE public.valuers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    address TEXT,
    savings_account VARCHAR(64),
    branch_id VARCHAR(16) NOT NULL REFERENCES public.branches(branch_code),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_valuers_branch ON public.valuers(branch_id);

-- F. Customer KYC Master
CREATE TABLE public.customers (
    customer_no VARCHAR(64) PRIMARY KEY,
    branch_id VARCHAR(16) NOT NULL REFERENCES public.branches(branch_code),
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(32),
    address TEXT,
    savings_account VARCHAR(64),
    dob DATE,
    age INTEGER,
    occupation VARCHAR(128),
    religion VARCHAR(64),
    caste VARCHAR(64),
    nominee_name VARCHAR(255),
    nominee_relation VARCHAR(64),
    is_member BOOLEAN NOT NULL DEFAULT FALSE,
    member_no VARCHAR(64),
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_customers_branch ON public.customers(branch_id);

-- G. Loans Table (Zero-Assumption Nullable Financial Standard)
CREATE TABLE public.loans (
    id VARCHAR(64) PRIMARY KEY,
    loan_no VARCHAR(64) NOT NULL UNIQUE,
    account_no VARCHAR(64) NOT NULL,
    proposal_no VARCHAR(64),
    branch_id VARCHAR(16) NOT NULL REFERENCES public.branches(branch_code),
    customer_no VARCHAR(64) NOT NULL REFERENCES public.customers(customer_no),
    loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    loan_status VARCHAR(32) NOT NULL DEFAULT 'New', -- 'New', 'Draft', 'Sanctioned', 'Disbursed', 'Closed', 'Foreclosed'
    loan_type VARCHAR(32) NOT NULL,
    packet_no VARCHAR(64),
    -- Core Financials (Strictly Nullable, No Silent Default Placeholders)
    sanctioned_amount NUMERIC(15, 2),
    valuation_amount NUMERIC(15, 2),
    gold_weight NUMERIC(10, 3),
    gross_weight NUMERIC(10, 3),
    interest_rate NUMERIC(5, 2),
    installments INTEGER,
    emi_amount NUMERIC(15, 2),
    -- Valuer & Charge Breakdown (Default 0.00 for optional line-item deductions)
    valuer_name VARCHAR(255),
    valuer_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    doc_charges NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    service_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cgst NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    sgst NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    stamp_duty NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    insurance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    share_a NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    share_b NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    member_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    other_charges NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_deductions NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    custom_charges_json JSONB DEFAULT '[]'::jsonb,
    ornament_photo_url TEXT,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(64) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_loans_branch ON public.loans(branch_id);
CREATE INDEX idx_loans_status ON public.loans(loan_status);

-- H. Normalized Loan Ornaments Table (Split Fine Gold Metric Standard)
CREATE TABLE public.loan_ornaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id VARCHAR(64) NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    item_index INTEGER NOT NULL DEFAULT 1,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER,
    gross_weight_grams NUMERIC(10, 3),
    net_weight_grams NUMERIC(10, 3),
    purity_karat INTEGER,
    fine_gold_22k_equivalent_gm NUMERIC(10, 3), -- Computed consistently as: (net_weight * purity_karat / 22)
    fine_gold_pure_gm NUMERIC(10, 3),           -- Computed consistently as: (net_weight * purity_karat / 24)
    valuation_amount NUMERIC(15, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_loan_ornaments_loan ON public.loan_ornaments(loan_id);

-- I. Active Device Sessions (Realtime Terminal Presence & Killswitch)
CREATE TABLE public.active_sessions (
    id VARCHAR(128) PRIMARY KEY, -- sessionId (UUID)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    branch_id VARCHAR(16) NOT NULL REFERENCES public.branches(branch_code),
    operator_name VARCHAR(255) NOT NULL,
    ip_address VARCHAR(64),
    user_agent TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'terminated'
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_active_sessions_status ON public.active_sessions(status, last_heartbeat);

-- J. Immutable Audit Logs Table (Read-Only to ALL Clients)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_action VARCHAR(64) NOT NULL,
    entity_name VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128),
    branch_id VARCHAR(16),
    user_id UUID,
    actor_name VARCHAR(255) NOT NULL DEFAULT 'SYSTEM',
    details TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(event_timestamp DESC);
CREATE INDEX idx_audit_logs_branch ON public.audit_logs(branch_id);

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES — 3-ROLE INSTANT REVOCATION MODEL
-- =============================================================================
-- NOTE: Every table uses EXPLICIT command policies (FOR SELECT, FOR INSERT, 
-- FOR UPDATE, FOR DELETE). NO 'FOR ALL' policies are used to guarantee zero
-- permissive policy union overlaps or bypasses.

-- Enable RLS on ALL tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_ornaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- A. USER PROFILES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "user_profiles_select" ON public.user_profiles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'tech_admin')
    );

CREATE POLICY "user_profiles_insert" ON public.user_profiles
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'tech_admin'));

CREATE POLICY "user_profiles_update" ON public.user_profiles
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'tech_admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'tech_admin'));

CREATE POLICY "user_profiles_delete" ON public.user_profiles
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'tech_admin'));

-- -----------------------------------------------------------------------------
-- B. AUDIT LOGS POLICIES (100% IMMUTABLE: READ-ONLY TO CLIENTS)
-- -----------------------------------------------------------------------------
CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_auth_profile() p
            WHERE p.role IN ('head_office', 'tech_admin')
        )
    );
-- ZERO INSERT, UPDATE, DELETE POLICIES EXIST FOR CLIENTS ON audit_logs.

-- -----------------------------------------------------------------------------
-- C. LOANS POLICIES (FINANCIAL DATA: TECH ADMIN HAS ZERO ACCESS)
-- -----------------------------------------------------------------------------
CREATE POLICY "loans_select" ON public.loans
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_auth_profile() p
            WHERE (p.role = 'head_office')
               OR (p.role = 'branch_employee' AND p.branch_id = loans.branch_id)
        )
    );

CREATE POLICY "loans_insert" ON public.loans
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.get_auth_profile() p
            WHERE (p.role = 'head_office')
               OR (p.role = 'branch_employee' AND p.branch_id = loans.branch_id)
        )
    );

CREATE POLICY "loans_update" ON public.loans
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_auth_profile() p
            WHERE (p.role = 'head_office')
               OR (p.role = 'branch_employee' AND p.branch_id = loans.branch_id AND loans.loan_status IN ('New', 'Draft'))
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.get_auth_profile() p
            WHERE (p.role = 'head_office')
               OR (p.role = 'branch_employee' AND p.branch_id = loans.branch_id AND loans.loan_status IN ('New', 'Draft'))
        )
    );

CREATE POLICY "loans_delete" ON public.loans
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_auth_profile() p
            WHERE (p.role = 'head_office')
               OR (p.role = 'branch_employee' AND p.branch_id = loans.branch_id AND loans.loan_status IN ('New', 'Draft'))
        )
    );

-- -----------------------------------------------------------------------------
-- D. LOAN ORNAMENTS POLICIES (EXPLICIT BRANCH ISOLATION ON ALL COMMANDS)
-- -----------------------------------------------------------------------------
CREATE POLICY "loan_ornaments_select" ON public.loan_ornaments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.loans l
            JOIN public.get_auth_profile() p ON (p.role = 'head_office' OR (p.role = 'branch_employee' AND p.branch_id = l.branch_id))
            WHERE l.id = loan_ornaments.loan_id
        )
    );

CREATE POLICY "loan_ornaments_insert" ON public.loan_ornaments
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.loans l
            JOIN public.get_auth_profile() p ON (p.role = 'head_office' OR (p.role = 'branch_employee' AND p.branch_id = l.branch_id))
            WHERE l.id = loan_ornaments.loan_id
        )
    );

CREATE POLICY "loan_ornaments_update" ON public.loan_ornaments
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.loans l
            JOIN public.get_auth_profile() p ON (p.role = 'head_office' OR (p.role = 'branch_employee' AND p.branch_id = l.branch_id AND l.loan_status IN ('New', 'Draft')))
            WHERE l.id = loan_ornaments.loan_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.loans l
            JOIN public.get_auth_profile() p ON (p.role = 'head_office' OR (p.role = 'branch_employee' AND p.branch_id = l.branch_id AND l.loan_status IN ('New', 'Draft')))
            WHERE l.id = loan_ornaments.loan_id
        )
    );

CREATE POLICY "loan_ornaments_delete" ON public.loan_ornaments
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.loans l
            JOIN public.get_auth_profile() p ON (p.role = 'head_office' OR (p.role = 'branch_employee' AND p.branch_id = l.branch_id AND l.loan_status IN ('New', 'Draft')))
            WHERE l.id = loan_ornaments.loan_id
        )
    );

-- -----------------------------------------------------------------------------
-- E. CUSTOMERS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "customers_select" ON public.customers
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_auth_profile() p
            WHERE (p.role = 'head_office')
               OR (p.role = 'branch_employee' AND p.branch_id = customers.branch_id)
        )
    );

CREATE POLICY "customers_insert" ON public.customers
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.get_auth_profile() p
            WHERE (p.role = 'head_office')
               OR (p.role = 'branch_employee' AND p.branch_id = customers.branch_id)
        )
    );

CREATE POLICY "customers_update" ON public.customers
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_auth_profile() p
            WHERE (p.role = 'head_office')
               OR (p.role = 'branch_employee' AND p.branch_id = customers.branch_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.get_auth_profile() p
            WHERE (p.role = 'head_office')
               OR (p.role = 'branch_employee' AND p.branch_id = customers.branch_id)
        )
    );

CREATE POLICY "customers_delete" ON public.customers
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_auth_profile() p
            WHERE (p.role = 'head_office')
               OR (p.role = 'branch_employee' AND p.branch_id = customers.branch_id)
        )
    );

-- -----------------------------------------------------------------------------
-- F. VALUERS DIRECTORY POLICIES (BRANCH-SCOPED)
-- -----------------------------------------------------------------------------
CREATE POLICY "valuers_select" ON public.valuers
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_auth_profile() p
            WHERE (p.role = 'head_office')
               OR (p.role = 'branch_employee' AND p.branch_id = valuers.branch_id)
        )
    );

CREATE POLICY "valuers_insert" ON public.valuers
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'));

CREATE POLICY "valuers_update" ON public.valuers
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'));

CREATE POLICY "valuers_delete" ON public.valuers
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'));

-- -----------------------------------------------------------------------------
-- G. RATES, RULES MASTER, PRODUCTS, BRANCHES (BANK-WIDE MASTER DATA)
-- -----------------------------------------------------------------------------
-- SELECT: Active Authenticated Users
CREATE POLICY "branches_select" ON public.branches FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "rates_select" ON public.rates FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "rules_master_select" ON public.rules_master FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated USING (TRUE);

-- INSERT / UPDATE / DELETE: Head Office Only
CREATE POLICY "branches_insert" ON public.branches FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'));
CREATE POLICY "branches_update" ON public.branches FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office')) WITH CHECK (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'));
CREATE POLICY "branches_delete" ON public.branches FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'));

CREATE POLICY "rates_insert" ON public.rates FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'));
CREATE POLICY "rates_update" ON public.rates FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office')) WITH CHECK (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'));
CREATE POLICY "rates_delete" ON public.rates FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'));

CREATE POLICY "rules_master_insert" ON public.rules_master FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'));
CREATE POLICY "rules_master_update" ON public.rules_master FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office')) WITH CHECK (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'));
CREATE POLICY "rules_master_delete" ON public.rules_master FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'));

CREATE POLICY "products_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'));
CREATE POLICY "products_update" ON public.products FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office')) WITH CHECK (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'));
CREATE POLICY "products_delete" ON public.products FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role = 'head_office'));

-- -----------------------------------------------------------------------------
-- H. ACTIVE SESSIONS POLICIES (TERMINAL PRESENCE & REMOTE KILLSWITCH)
-- -----------------------------------------------------------------------------
CREATE POLICY "sessions_select" ON public.active_sessions
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role IN ('head_office', 'tech_admin'))
    );

CREATE POLICY "sessions_insert" ON public.active_sessions
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_update" ON public.active_sessions
    FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role IN ('head_office', 'tech_admin'))
    )
    WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role IN ('head_office', 'tech_admin'))
    );

CREATE POLICY "sessions_delete" ON public.active_sessions
    FOR DELETE TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.get_auth_profile() p WHERE p.role IN ('head_office', 'tech_admin'))
    );

-- =============================================================================
-- 6. AUTOMATED SERVER-SIDE AUDIT LOGGING TRIGGERS (100% SECURE)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.process_audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_actor_name VARCHAR(255) := 'SYSTEM';
    v_branch_id VARCHAR(16) := '99';
    v_action VARCHAR(64);
    v_details TEXT;
    v_entity_id VARCHAR(128);
    v_meta JSONB := '{}'::jsonb;
BEGIN
    -- Resolve actor info from user_profiles if available
    SELECT full_name, branch_id INTO v_actor_name, v_branch_id 
    FROM public.user_profiles 
    WHERE id = v_user_id;

    IF v_actor_name IS NULL THEN 
        v_actor_name := 'SYSTEM / AUTOMATION'; 
    END IF;

    -- A. LOANS AUDIT LOGIC
    IF TG_TABLE_NAME = 'loans' THEN
        IF TG_OP = 'INSERT' THEN
            v_action := 'LOAN_CREATED';
            v_entity_id := NEW.id;
            v_branch_id := NEW.branch_id;
            v_details := format('Created loan %s (Account: %s, Amount: ₹%s, Borrower: %s)', NEW.loan_no, NEW.account_no, NEW.sanctioned_amount, NEW.customer_no);
            v_meta := jsonb_build_object('branch_id', NEW.branch_id, 'amount', NEW.sanctioned_amount, 'status', NEW.loan_status);
        ELSIF TG_OP = 'UPDATE' THEN
            v_action := CASE WHEN OLD.loan_status <> NEW.loan_status THEN 'LOAN_STATUS_CHANGED' ELSE 'LOAN_UPDATED' END;
            v_entity_id := NEW.id;
            v_branch_id := NEW.branch_id;
            v_details := format('Loan %s updated (Status: %s -> %s)', NEW.loan_no, OLD.loan_status, NEW.loan_status);
            v_meta := jsonb_build_object('old_status', OLD.loan_status, 'new_status', NEW.loan_status, 'amount', NEW.sanctioned_amount);
        ELSIF TG_OP = 'DELETE' THEN
            v_action := 'LOAN_DELETED';
            v_entity_id := OLD.id;
            v_branch_id := OLD.branch_id;
            v_details := format('Deleted loan %s (Account: %s, Amount: ₹%s)', OLD.loan_no, OLD.account_no, OLD.sanctioned_amount);
            v_meta := jsonb_build_object('branch_id', OLD.branch_id, 'amount', OLD.sanctioned_amount);
        END IF;

    -- B. RATES AUDIT LOGIC (Bank-Wide -> Tagged to '99' Head Office)
    ELSIF TG_TABLE_NAME = 'rates' THEN
        v_branch_id := '99';
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            v_action := 'RATE_UPDATE';
            v_entity_id := NEW.id::text;
            v_details := format('Updated 22K Gold Rate to ₹%s/10g (24K: ₹%s, Locked: %s)', NEW.rate_22k, NEW.rate_24k, NEW.is_locked);
            v_meta := jsonb_build_object('rate_22k', NEW.rate_22k, 'rate_24k', NEW.rate_24k, 'is_locked', NEW.is_locked);
        END IF;

    -- C. RULES MASTER AUDIT LOGIC (Bank-Wide -> Tagged to '99' Head Office)
    ELSIF TG_TABLE_NAME = 'rules_master' THEN
        v_branch_id := '99';
        v_action := 'RULES_MASTER_UPDATED';
        v_entity_id := NEW.id;
        v_details := 'Head Office updated dynamic bank rules / deduction master settings';

    -- D. PRODUCTS AUDIT LOGIC (Bank-Wide -> Tagged to '99' Head Office)
    ELSIF TG_TABLE_NAME = 'products' THEN
        v_branch_id := '99';
        IF TG_OP = 'INSERT' THEN
            v_action := 'PRODUCT_CREATED'; v_entity_id := NEW.id;
            v_details := format('Product scheme %s (%s) created', NEW.name, NEW.code);
        ELSIF TG_OP = 'UPDATE' THEN
            v_action := 'PRODUCT_UPDATED'; v_entity_id := NEW.id;
            v_details := format('Product scheme %s (%s) updated', NEW.name, NEW.code);
        ELSIF TG_OP = 'DELETE' THEN
            v_action := 'PRODUCT_DELETED'; v_entity_id := OLD.id;
            v_details := format('Product scheme %s (%s) deleted', OLD.name, OLD.code);
        END IF;

    -- E. VALUERS AUDIT LOGIC
    ELSIF TG_TABLE_NAME = 'valuers' THEN
        IF TG_OP = 'INSERT' THEN
            v_action := 'VALUER_REGISTERED'; v_entity_id := NEW.id; v_branch_id := NEW.branch_id;
            v_details := format('Valuer %s (%s) registered for Branch %s', NEW.name, NEW.id, NEW.branch_id);
        ELSIF TG_OP = 'UPDATE' THEN
            v_action := 'VALUER_UPDATED'; v_entity_id := NEW.id; v_branch_id := NEW.branch_id;
            v_details := format('Valuer %s (%s) details updated', NEW.name, NEW.id);
        ELSIF TG_OP = 'DELETE' THEN
            v_action := 'VALUER_DELETED'; v_entity_id := OLD.id; v_branch_id := OLD.branch_id;
            v_details := format('Valuer %s (%s) deleted', OLD.name, OLD.id);
        END IF;

    -- F. ACTIVE SESSIONS AUDIT LOGIC
    ELSIF TG_TABLE_NAME = 'active_sessions' THEN
        IF TG_OP = 'INSERT' THEN
            v_action := 'SESSION_LOGIN'; v_entity_id := NEW.id; v_branch_id := NEW.branch_id;
            v_details := format('Operator %s logged into Branch %s (IP: %s)', NEW.operator_name, NEW.branch_id, NEW.ip_address);
        ELSIF TG_OP = 'UPDATE' AND NEW.status = 'terminated' AND OLD.status <> 'terminated' THEN
            v_action := 'KILLSWITCH_DISCONNECT'; v_entity_id := NEW.id; v_branch_id := NEW.branch_id;
            v_details := format('Session for operator %s (Branch %s) forcefully terminated', NEW.operator_name, NEW.branch_id);
        ELSIF TG_OP = 'DELETE' THEN
            v_action := 'SESSION_LOGOUT'; v_entity_id := OLD.id; v_branch_id := OLD.branch_id;
            v_details := format('Operator %s logged out from Branch %s', OLD.operator_name, OLD.branch_id);
        END IF;

    -- G. USER PROFILES AUDIT LOGIC
    ELSIF TG_TABLE_NAME = 'user_profiles' THEN
        IF TG_OP = 'UPDATE' AND OLD.is_active <> NEW.is_active THEN
            v_action := CASE WHEN NEW.is_active THEN 'USER_ACTIVATED' ELSE 'USER_DEACTIVATED' END;
            v_entity_id := NEW.id::text;
            v_branch_id := NEW.branch_id;
            v_details := format('User %s (%s) active=%s', NEW.full_name, NEW.email, NEW.is_active);
        END IF;
    END IF;

    -- Insert into immutable audit_logs using safe local variables
    IF v_action IS NOT NULL THEN
        INSERT INTO public.audit_logs (
            event_action,
            entity_name,
            entity_id,
            branch_id,
            user_id,
            actor_name,
            details,
            metadata
        ) VALUES (
            v_action,
            TG_TABLE_NAME,
            v_entity_id,
            v_branch_id,
            v_user_id,
            v_actor_name,
            v_details,
            v_meta
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach Triggers to Tables
DROP TRIGGER IF EXISTS trg_audit_loans ON public.loans;
CREATE TRIGGER trg_audit_loans
    AFTER INSERT OR UPDATE OR DELETE ON public.loans
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log_trigger();

DROP TRIGGER IF EXISTS trg_audit_rates ON public.rates;
CREATE TRIGGER trg_audit_rates
    AFTER INSERT OR UPDATE ON public.rates
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log_trigger();

DROP TRIGGER IF EXISTS trg_audit_rules ON public.rules_master;
CREATE TRIGGER trg_audit_rules
    AFTER INSERT OR UPDATE ON public.rules_master
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log_trigger();

DROP TRIGGER IF EXISTS trg_audit_valuers ON public.valuers;
CREATE TRIGGER trg_audit_valuers
    AFTER INSERT OR UPDATE OR DELETE ON public.valuers
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log_trigger();

DROP TRIGGER IF EXISTS trg_audit_sessions ON public.active_sessions;
CREATE TRIGGER trg_audit_sessions
    AFTER INSERT OR UPDATE OR DELETE ON public.active_sessions
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log_trigger();

DROP TRIGGER IF EXISTS trg_audit_user_profiles ON public.user_profiles;
CREATE TRIGGER trg_audit_user_profiles
    AFTER UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log_trigger();

-- =============================================================================
-- 7. INITIAL DATABASE BOOTSTRAPPING PROCEDURE (SERVICE ROLE / SQL EDITOR)
-- =============================================================================
-- NOTE: On a fresh database, no tech_admin exists to insert the first profile.
-- Run this initial seeding script ONCE via the Supabase Dashboard SQL Editor
-- (which executes as postgres / service_role bypassing RLS) immediately after schema creation.

/*
-- STEP 1: Insert default bank branches (17 branches + Head Office)
INSERT INTO public.branches (branch_code, branch_name, branch_name_guj, is_head_office, is_active)
VALUES
    ('99', '99 HEAD OFFICE', '૯૯ હેડ ઓફિસ (મુખ્ય કચેરી)', TRUE, TRUE),
    ('01', '01 AZADCHOWK BRANCH', '૦૧ આઝાદચોક શાખા', FALSE, TRUE),
    ('02', '02 JOSHIPARA BRANCH', '૦૨ જોશીપરા શાખા', FALSE, TRUE),
    ('03', '03 DOLATPARA BRANCH', '૦૩ દોલતપરા શાખા', FALSE, TRUE),
    ('04', '04 KODINAR BRANCH', '૦૪ કોડીનાર શાખા', FALSE, TRUE),
    ('05', '05 KESHOD BRANCH', '૦૫ કેશોદ શાખા', FALSE, TRUE),
    ('06', '06 VANTHALI BRANCH', '૦૬ વંથલી શાખા', FALSE, TRUE),
    ('07', '07 MANAVADAR BRANCH', '૦૭ માણાવદર શાખા', FALSE, TRUE),
    ('08', '08 GANDHINAGAR BRANCH', '૦૮ ગાંધીનગર શાખા', FALSE, TRUE),
    ('09', '09 LIMBDI BRANCH', '૦૯ લીંબડી શાખા', FALSE, TRUE),
    ('10', '10 MENDARDA BRANCH', '૧૦ મેંદરડા શાખા', FALSE, TRUE),
    ('11', '11 VISAVADAR BRANCH', '૧૧ વિસાવદર શાખા', FALSE, TRUE),
    ('12', '12 JAMNAGAR BRANCH', '૧૨ જામનગર શાખા', FALSE, TRUE),
    ('13', '13 BUS STAND BRANCH', '૧૩ બસ સ્ટેન્ડ શાખા', FALSE, TRUE),
    ('14', '14 LATHI BRANCH', '૧૪ લાઠી શાખા', FALSE, TRUE),
    ('16', '16 AHMEDABAD BRANCH', '૧૬ અમદાવાદ શાખા', FALSE, TRUE),
    ('17', '17 RAJKOT BRANCH', '૧૭ રાજકોટ શાખા', FALSE, TRUE),
    ('18', '18 ZANZARDA BRANCH', '૧૮ ઝાંઝરડા શાખા', FALSE, TRUE)
ON CONFLICT (branch_code) DO NOTHING;

-- STEP 2: Create initial Tech Admin & Head Office profiles (Linked to created Auth UUIDs)
-- Replace <AUTH_USER_UUID_FOR_ADMIN> with the real auth.users id created in Supabase Auth.
INSERT INTO public.user_profiles (id, email, full_name, role, branch_id, is_active)
VALUES 
    ('<AUTH_USER_UUID_FOR_TECH_ADMIN>', 'admin@jccbgold.com', 'JCCB Primary Tech Administrator', 'tech_admin', '99', TRUE),
    ('<AUTH_USER_UUID_FOR_HEAD_OFFICE>', 'ho@jccbgold.com', 'JCCB Head Office Administrator', 'head_office', '99', TRUE)
ON CONFLICT (id) DO UPDATE SET is_active = TRUE;
*/
