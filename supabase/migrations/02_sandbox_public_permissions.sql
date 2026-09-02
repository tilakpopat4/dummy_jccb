-- =============================================================================
-- JCCB SANDBOX: UNRESTRICTED PERMISSIONS FOR ANON/PUBLIC CLIENT ACCESS
-- =============================================================================

BEGIN;

-- Drop any restrictive policies on public schema tables
DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename); 
    END LOOP; 
END $$;

-- Create Sandbox Permissive Policies for PUBLIC (Anon + Authenticated)
CREATE POLICY "rates_public_all" ON public.rates FOR ALL TO public USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "rules_master_public_all" ON public.rules_master FOR ALL TO public USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "branches_public_all" ON public.branches FOR ALL TO public USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "products_public_all" ON public.products FOR ALL TO public USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "valuers_public_all" ON public.valuers FOR ALL TO public USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "customers_public_all" ON public.customers FOR ALL TO public USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "loans_public_all" ON public.loans FOR ALL TO public USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "loan_ornaments_public_all" ON public.loan_ornaments FOR ALL TO public USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "active_sessions_public_all" ON public.active_sessions FOR ALL TO public USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "audit_logs_public_all" ON public.audit_logs FOR ALL TO public USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "user_profiles_public_all" ON public.user_profiles FOR ALL TO public USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "profiles_public_all" ON public.profiles FOR ALL TO public USING (TRUE) WITH CHECK (TRUE);

-- Grant full table permissions to anon and authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, postgres, service_role;

COMMIT;
