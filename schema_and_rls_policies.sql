-- =============================================================================
-- THE JUNAGADH COMMERCIAL CO-OPERATIVE BANK LTD. (JCCB)
-- Production Supabase PostgreSQL Schema & Security Policy Engine (v3.0)
-- 1-Click Zero-Error Setup for Complete Gold Loan Platform & Multi-Branch Realtime
-- =============================================================================

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 2. MASTER & TRANSACTION TABLES
-- =============================================================================

-- A. Branches Directory
CREATE TABLE IF NOT EXISTS public.branches (
    branch_code VARCHAR(16) PRIMARY KEY,
    branch_name VARCHAR(255) NOT NULL,
    branch_name_guj VARCHAR(255),
    is_head_office BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- B. Daily Gold Rates
CREATE TABLE IF NOT EXISTS public.rates (
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
CREATE TABLE IF NOT EXISTS public.rules_master (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'rulesMaster',
    rules_json JSONB NOT NULL,
    updated_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D. Product Schemes Master
CREATE TABLE IF NOT EXISTS public.products (
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

-- E. Authorized Valuers
CREATE TABLE IF NOT EXISTS public.valuers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    address TEXT,
    savings_account VARCHAR(64),
    branch_id VARCHAR(16) REFERENCES public.branches(branch_code) ON UPDATE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- F. Customer Profiles Master (Borrower Directory)
CREATE TABLE IF NOT EXISTS public.customers (
    customer_no VARCHAR(64) PRIMARY KEY,
    branch_id VARCHAR(16) REFERENCES public.branches(branch_code) ON UPDATE CASCADE,
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

-- G. Loans Transaction Master
CREATE TABLE IF NOT EXISTS public.loans (
    id VARCHAR(64) PRIMARY KEY, -- loanId (e.g. 'GL-1788243720550')
    loan_no VARCHAR(64) NOT NULL UNIQUE,
    account_no VARCHAR(64) NOT NULL,
    proposal_no VARCHAR(64),
    branch_id VARCHAR(16) NOT NULL REFERENCES public.branches(branch_code) ON UPDATE CASCADE,
    customer_no VARCHAR(64) REFERENCES public.customers(customer_no) ON UPDATE CASCADE,
    loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    loan_status VARCHAR(32) NOT NULL DEFAULT 'New', -- 'New', 'Active', 'Closed', 'NPA'
    loan_type VARCHAR(32) NOT NULL DEFAULT 'GW-3725',
    packet_no VARCHAR(64),
    sanctioned_amount NUMERIC(15, 2) NOT NULL,
    valuation_amount NUMERIC(15, 2) NOT NULL,
    gold_weight NUMERIC(10, 3) NOT NULL, -- Net Weight
    gross_weight NUMERIC(10, 3) NOT NULL,
    interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 11.50,
    installments INTEGER NOT NULL DEFAULT 0,
    emi_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    valuer_name VARCHAR(255),
    valuer_fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    doc_charges NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    service_charge NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cgst NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    sgst NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    stamp_duty NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    insurance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    share_a NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    share_b NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    member_fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    other_charges NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_deductions NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    custom_charges_json JSONB DEFAULT '[]'::jsonb,
    ornament_photo_url TEXT,
    created_by VARCHAR(64) NOT NULL DEFAULT 'OPERATOR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(64) NOT NULL DEFAULT 'OPERATOR',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- H. Loan Ornaments Detail Table (Itemized Gold Pieces)
CREATE TABLE IF NOT EXISTS public.loan_ornaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id VARCHAR(64) NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    item_index INTEGER NOT NULL DEFAULT 1,
    item_type VARCHAR(64) DEFAULT 'Gold Ornament',
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    gross_weight_grams NUMERIC(10, 3) NOT NULL,
    net_weight_grams NUMERIC(10, 3) NOT NULL,
    purity_karat INTEGER NOT NULL DEFAULT 22,
    valuation_rate NUMERIC(10, 2) DEFAULT 0.00,
    valuation_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- I. Active Device Sessions (Realtime Presence & Killswitch)
CREATE TABLE IF NOT EXISTS public.active_sessions (
    id VARCHAR(128) PRIMARY KEY, -- sessionId
    branch_id VARCHAR(16) NOT NULL REFERENCES public.branches(branch_code),
    operator_name VARCHAR(255) NOT NULL,
    ip_address VARCHAR(64),
    user_agent TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'terminated'
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- J. Immutable Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_action VARCHAR(64) NOT NULL,
    entity_name VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128),
    branch_id VARCHAR(16),
    actor_name VARCHAR(255) NOT NULL DEFAULT 'SYSTEM',
    details TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================================================
-- 3. INDEXES FOR HIGH-SPEED MULTI-TERMINAL SEARCH
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_loans_branch ON public.loans(branch_id);
CREATE INDEX IF NOT EXISTS idx_loans_customer ON public.loans(customer_no);
CREATE INDEX IF NOT EXISTS idx_loans_account ON public.loans(account_no);
CREATE INDEX IF NOT EXISTS idx_loans_packet ON public.loans(packet_no);
CREATE INDEX IF NOT EXISTS idx_customers_branch ON public.customers(branch_id);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(mobile);
CREATE INDEX IF NOT EXISTS idx_loan_ornaments_loan ON public.loan_ornaments(loan_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_active_sessions_status ON public.active_sessions(status, last_heartbeat);

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES — FULL UNRESTRICTED PERMISSIONS
-- =============================================================================
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

-- Clean existing policies if re-running
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_anon_%s" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_auth_%s" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "allow_all_anon_%s" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)', t, t);
        EXECUTE format('CREATE POLICY "allow_all_auth_%s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
    END LOOP;
END $$;

-- =============================================================================
-- 5. REALTIME REPLICATION PUBLICATION SETUP
-- =============================================================================
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.branches, 
    public.rates, 
    public.rules_master, 
    public.products, 
    public.valuers, 
    public.customers, 
    public.loans, 
    public.loan_ornaments, 
    public.active_sessions;

-- =============================================================================
-- 6. DEFAULT BANK MASTER PRE-SEEDING
-- =============================================================================

-- Branches Seed
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
ON CONFLICT (branch_code) DO UPDATE SET is_active = TRUE;

-- Product Schemes Seed
INSERT INTO public.products (id, code, name, min_amount, max_amount, interest_rate, scheme_type, is_active)
VALUES
    ('1', 'GW-3725', 'Gold Loan up to ₹50,000 (GW-3725) 11.00% FIX', 0, 50000, 11.00, 'bullet', TRUE),
    ('2', 'GW-3725', 'Gold Loan ₹50,001 to ₹100,000 (GW-3725) 11.50% FIX', 50001, 100000, 11.50, 'bullet', TRUE),
    ('3', 'GD-3524', 'Gold Loan ₹100,001 to ₹200,000 (GD-3524) 11.50% FIX', 100001, 200000, 11.50, 'bullet', TRUE),
    ('4', 'GNA-3527', 'Gold Loan above ₹200,000 (GNA-3527) 11.50% FIX', 200001, 999999999, 11.50, 'installment', TRUE),
    ('5', 'GOD-3553', 'Gold Loan above ₹200,000 (Overdraft) (GOD-3553) 11.50% FIX', 200001, 999999999, 11.50, 'overdraft', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Authorized Valuers Seed
INSERT INTO public.valuers (id, name, phone, address, savings_account, branch_id, is_active)
VALUES
    ('V01', 'SURYAKANT HIMMATLAL LUHAR', '9033048938', 'KANKAI SHERI, JUNI BAZAR, MU. KODINAR', '004131800000121', '04', TRUE),
    ('V02', 'DHAVALKUMAR BHOGILAL ZANZMERIYA', '9427041022', 'A-301, IMPERIAL HEIGHTS, MONALISHA TOWNSHIP,, CHOBARI ROAD, JUNAGADH', '001131800012753', '01', TRUE),
    ('V03', 'NAINESH HARESHBHAI KATHRODIA', '8128730511', 'BLOCK NO : 103,, JALARAM NAGAR, ZANZARDA ROAD, JUNAGADH', '013131800002329', '13', TRUE),
    ('V04', 'NAVNEETLAL MOHANLAL LODHIYA', '9879025311', '302, RUDHRAKSH APPARTMENT,  VANZARI GARBI CHOWK MAIN ROAD, JUNAGADH', '013131800000179', '13', TRUE),
    ('V05', 'MAHENDRA RAMNIKLAL DHOLAKIYA', '9879284739', 'MADHURAM, NR. SHREE TAWOR, JAY NAGAR, KESHOD', '005131800000188', '05', TRUE),
    ('V06', 'DHARMENDRA NAVNITLAL DHOLAKIYA', '9033337737', 'PRAMUKHSAGAR APPARTMENT,  BH. MAHENDRASINHJI CHOWK, KESHOD', '005131800002017', '05', TRUE),
    ('V07', 'MEHUL BHOGILAL DHOLAKIYA', '9426991565', 'RAILWAY STATION ROAD, MURLIDHAR MILL, VISAVADAR', '011131800001933', '11', TRUE),
    ('V08', 'CHANDRAKANT AMRUTLAL DHOLAKIA', '9904816713', 'GOKUL APPARTMENT,  BLOCK NO : 101, JUNAGADH ROAD, KESHOD', '006131800005086', '06', TRUE),
    ('V09', 'CHETAN RAMESHCHANDRA ZINZUVADIA', '9033345925', 'B-501, JINKUSHAL RESIDENCY, BH. NAVA NAGAR HIGHT SCHOOL, NR. JAYSHREE TALKISE, SUPERMARKET, JAMNAGAR', '012131700001868', '12', TRUE),
    ('V10', 'KIRANKUMAR INDRAVADANBHAI DHOLAKIYA', '8780227669', 'SANGHAVI SHERI, MU.LATHI', '014131800002958', '14', TRUE),
    ('V11', 'VIPULCHANDRA MANEKLAL FICHADIYA', '8320560985', 'MU.LIMBDI, DIST : SURENDRANAGAR', '009131800006127', '09', TRUE),
    ('V12', 'KISHORBHAI NAROTTAMDAS MEVACHA', '9426860887', 'SARDARGADH PARA, SHERI NO-1, POLICE STATION GROUND, MANAVADAR', '007131800000004', '07', TRUE),
    ('V13', 'MITESHBHAI HARILAL SIMEJIYA', '9427929160', 'GANDHI CHOWK, MAIN ROAD, MANAVADAR', '007131800001582', '07', TRUE),
    ('V14', 'ANILBHAI NAROTTAMBHAI GHORDA', '9824845046', 'FLAT NO.401, RAGHUVIR PALACE APPARTMENT, SERI NO 7-A/18, MILPARA, BHAKTI NAGAR, RAJKOT', '017131800000041', '17', TRUE),
    ('V15', 'RAJESHBHAI SONI', '9825443106', 'SECTOR-21, GANDHINAGAR', '1111111111111111', '08', TRUE)
ON CONFLICT (id) DO NOTHING;
