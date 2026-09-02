// supabase-config.js
const SUPABASE_URL = "https://qsfsmomphgotmfcpfhkd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2FO68n0R0yCmB_PyUyVOFQ_2oIUZEQA";

const _supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
window.db = _supabase;
window.supabaseClient = _supabase;

/**
 * =============================================================================
 * THE JUNAGADH COMMERCIAL CO-OPERATIVE BANK LTD. (JCCB)
 * Supabase Client Database & Auth Service Layer
 * =============================================================================
 */
const SupabaseService = {
    client: _supabase,

    async login(email, password) {
        if (!this.client) throw new Error("Supabase client not initialized");
        const { data, error } = await this.client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const profile = await this.getCurrentUserProfile(data.user.id);
        return { user: data.user, profile };
    },

    async logout() {
        if (!this.client) return;
        await this.client.auth.signOut();
    },

    async getCurrentUserProfile(userId) {
        if (!this.client) return null;
        const { data, error } = await this.client
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .eq('is_active', true)
            .single();
        if (error) {
            console.error("[Supabase] Profile lookup failed:", error);
            return null;
        }
        return data;
    },

    async getLoansByBranch(branchId) {
        if (!this.client) return [];
        let query = this.client
            .from('loans')
            .select(`*, loan_ornaments (*)`)
            .order('created_at', { ascending: false });

        if (branchId && branchId !== '99') {
            query = query.eq('branch_id', branchId);
        }

        const { data, error } = await query;
        if (error) {
            console.error("[Supabase] Error loading loans:", error);
            return [];
        }
        return data || [];
    },

    async saveLoanWithOrnaments(loanData, ornamentsList) {
        if (!this.client) throw new Error("Supabase client not initialized");

        const { data: savedLoan, error: loanErr } = await this.client
            .from('loans')
            .upsert(loanData, { onConflict: 'id' })
            .select()
            .single();

        if (loanErr) throw loanErr;

        if (ornamentsList && ornamentsList.length > 0) {
            await this.client
                .from('loan_ornaments')
                .delete()
                .eq('loan_id', savedLoan.id);

            const preparedOrnaments = ornamentsList.map((item, idx) => ({
                loan_id: savedLoan.id,
                item_index: idx + 1,
                item_name: item.name || item.itemName || "Gold Ornament",
                quantity: parseInt(item.qty || item.quantity || 1, 10),
                gross_weight_grams: parseFloat(item.grossWeight || item.grossGm || 0),
                net_weight_grams: parseFloat(item.netWeight || item.netGm || 0),
                purity_karat: parseInt(item.purity || 22, 10),
                fine_gold_22k_equivalent_gm: parseFloat(((parseFloat(item.netWeight || item.netGm || 0) * parseInt(item.purity || 22, 10)) / 22).toFixed(3)),
                fine_gold_pure_gm: parseFloat(((parseFloat(item.netWeight || item.netGm || 0) * parseInt(item.purity || 22, 10)) / 24).toFixed(3)),
                valuation_amount: parseFloat(item.valuationAmount || item.marketVal || item.val || 0)
            }));

            const { error: ornErr } = await this.client
                .from('loan_ornaments')
                .insert(preparedOrnaments);

            if (ornErr) throw ornErr;
        }

        return savedLoan;
    },

    async deleteLoan(loanId) {
        if (!this.client) return;
        const { error } = await this.client
            .from('loans')
            .delete()
            .eq('id', loanId);
        if (error) throw error;
    },

    async getLatestRates() {
        if (!this.client) return null;
        const { data, error } = await this.client
            .from('rates')
            .select('*')
            .order('rate_date', { ascending: false })
            .limit(1)
            .single();
        if (error && error.code !== 'PGRST116') console.error("[Supabase] Rate fetch error:", error);
        return data || null;
    },

    async getRulesMaster() {
        if (!this.client) return null;
        const { data, error } = await this.client
            .from('rules_master')
            .select('*')
            .eq('id', 'rulesMaster')
            .single();
        if (error && error.code !== 'PGRST116') console.error("[Supabase] Rules fetch error:", error);
        return data ? data.rules_json : null;
    },

    async getValuers(branchId) {
        if (!this.client) return [];
        let query = this.client.from('valuers').select('*').eq('is_active', true);
        if (branchId && branchId !== '99') {
            query = query.eq('branch_id', branchId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async getBranches() {
        if (!this.client) return [];
        const { data, error } = await this.client
            .from('branches')
            .select('*')
            .eq('is_active', true)
            .order('branch_code', { ascending: true });
        if (error) throw error;
        return data || [];
    }
};

window.SupabaseService = SupabaseService;
