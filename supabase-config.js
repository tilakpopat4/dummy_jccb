// supabase-config.js - Central Supabase Client & Backend Adapter
const SUPABASE_URL = "https://qsfsmomphgotmfcpfhkd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2FO68n0R0yCmB_PyUyVOFQ_2oIUZEQA";

// Initialize Supabase Client
const _supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
window.db = _supabase;
window.supabaseClient = _supabase;

// Helper: Get Logged In User Profile & Role
window.getCurrentUserProfile = async function() {
  try {
    if (!_supabase) return null;
    const { data: { user }, error: authErr } = await _supabase.auth.getUser();
    if (authErr || !user) return null;

    const { data: profile, error: profErr } = await _supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profErr) {
      console.warn("Profile fetch error:", profErr.message);
      return { id: user.id, email: user.email, role: 'employee', branch: '' };
    }
    return profile;
  } catch (err) {
    console.error("Auth status error:", err);
    return null;
  }
};

// Helper: Global Audit Logging to Supabase audit_logs table
window.logAuditEvent = async function(action, details, meta = {}) {
  try {
    if (!_supabase) return;
    const branchCode = meta.branchCode || meta.branch_id || (window.currentSession ? window.currentSession.code : '99');
    const operator = meta.operator || (window.currentSession ? window.currentSession.operator : 'ADMIN');

    await _supabase.from('audit_logs').insert([{
      event_action: action,
      entity_name: meta.entityName || 'system',
      entity_id: meta.entityId || String(Date.now()),
      branch_id: String(branchCode),
      actor_name: String(operator),
      details: String(details || action),
      metadata: meta
    }]);
  } catch (err) {
    console.warn("[Supabase] Audit log insert warning:", err);
  }
};

/**
 * Supabase Backend Service Adapter
 */
window.FirebaseService = {
  isInitialized: true,
  logAuditEvent: window.logAuditEvent,

  async init() {
    return true;
  },

  async updatePresence(branchCode, branchName, operator) {
    if (!_supabase) return;
    try {
      const sessionId = (window.currentSession && window.currentSession.sessionId) || ('sess_' + branchCode);
      await _supabase.from('active_sessions').upsert({
        id: sessionId,
        branch_id: String(branchCode || '99'),
        operator_name: String(operator || 'Operator'),
        status: 'active',
        last_heartbeat: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch (e) {}
  },

  async updateDeviceHeartbeat(sessionData) {
    if (!_supabase || !sessionData) return { success: true, isTerminated: false };
    try {
      const sid = String(sessionData.sessionId || sessionData.id || ('sess_' + (sessionData.branchCode || '99'))).trim();
      const { data } = await _supabase.from('active_sessions').upsert({
        id: sid,
        branch_id: String(sessionData.branchCode || '99'),
        operator_name: String(sessionData.operator || sessionData.operatorName || 'Operator'),
        ip_address: sessionData.ip || 'Office IP',
        user_agent: navigator.userAgent,
        status: 'active',
        last_heartbeat: new Date().toISOString()
      }, { onConflict: 'id' }).select('status').single();

      if (data && data.status === 'terminated') {
        return { success: true, isTerminated: true };
      }
      return { success: true, isTerminated: false };
    } catch (e) {
      return { success: true, isTerminated: false };
    }
  },

  async deleteActiveSession(sid) {
    if (!_supabase || !sid) return;
    try {
      await _supabase.from('active_sessions').delete().eq('id', sid);
    } catch (e) {}
  },

  async getDailyRates() {
    if (!_supabase) return null;
    try {
      const { data } = await _supabase
        .from('rates')
        .select('*')
        .order('rate_date', { ascending: false })
        .limit(1)
        .single();
      if (!data) return null;
      return {
        rate22K: data.rate_22k,
        rate24K: data.rate_24k,
        isLocked: data.is_locked,
        date: data.rate_date
      };
    } catch (e) {
      return null;
    }
  },

  async saveDailyRates(rateObj) {
    if (!_supabase || !rateObj) return;
    try {
      let dStr = rateObj.date;
      if (!dStr || dStr.length !== 10) {
        dStr = new Date().toISOString().split('T')[0];
      }
      const r22 = parseFloat(rateObj.rate22K || rateObj.rate22 || rateObj.rate24K || 0);
      const r24 = parseFloat(rateObj.rate24K || rateObj.rate24 || (r22 * (24 / 22)) || 0);

      const payload = {
        rate_date: dStr,
        rate_22k: r22,
        rate_24k: r24,
        is_locked: !!rateObj.isLocked,
        updated_by: (window.currentSession && window.currentSession.operator) || 'ADMIN'
      };

      const { data, error } = await _supabase.from('rates').upsert(payload, { onConflict: 'rate_date' }).select();
      if (error) {
        console.error("[Supabase] Rate save failed:", error.message || error);
        return false;
      }
      console.log("✅ [Supabase] Daily Gold Rate Saved Successfully:", payload);
      return true;
    } catch (e) {
      console.error("[Supabase] Rate save exception:", e);
      return false;
    }
  },

  async getRules() {
    if (!_supabase) return null;
    try {
      const { data } = await _supabase.from('rules_master').select('rules_json').eq('id', 'rulesMaster').single();
      return data && data.rules_json ? data.rules_json : null;
    } catch (e) {
      return null;
    }
  },

  async saveRules(rulesObj) {
    if (!_supabase || !rulesObj) return;
    try {
      await _supabase.from('rules_master').upsert({
        id: 'rulesMaster',
        rules_json: rulesObj,
        updated_by: (window.currentSession && window.currentSession.operator) || 'ADMIN'
      }, { onConflict: 'id' });
    } catch (e) {}
  },

  async getSettings() {
    return { branchSeeds: {} };
  },

  async saveSettings(settingsObj) {
    return true;
  },

  async getBranchesList() {
    if (!_supabase) return [];
    try {
      const { data } = await _supabase.from('branches').select('*').order('branch_code');
      if (!Array.isArray(data)) return [];
      return data.map(b => ({
        code: b.branch_code,
        name: b.branch_name,
        nameGuj: b.branch_name_guj,
        isHO: b.is_head_office,
        active: b.is_active
      }));
    } catch (e) {
      return [];
    }
  },

  async getValuersList() {
    if (!_supabase) return { list: [], deletedIds: [] };
    try {
      const { data } = await _supabase.from('valuers').select('*');
      if (!Array.isArray(data)) return { list: [], deletedIds: [] };
      const list = data.map(v => ({
        id: v.id,
        name: v.name,
        phone: v.phone,
        address: v.address,
        savingsAc: v.savings_account,
        branchCode: v.branch_id
      }));
      return { list, deletedIds: [] };
    } catch (e) {
      return { list: [], deletedIds: [] };
    }
  },

  async saveValuersList(valuersList) {
    if (!_supabase || !Array.isArray(valuersList)) return;
    try {
      const records = valuersList.map(v => ({
        id: v.id || ('val_' + Date.now()),
        name: v.name || 'Valuer',
        phone: v.phone || '',
        address: v.address || '',
        savings_account: v.savingsAc || '',
        branch_id: v.branchCode || '99'
      }));
      await _supabase.from('valuers').upsert(records, { onConflict: 'id' });
    } catch (e) {}
  },

  async getProductsList() {
    if (!_supabase) return [];
    try {
      const { data } = await _supabase.from('products').select('*');
      if (!Array.isArray(data)) return [];
      return data.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        minAmt: p.min_amount,
        maxAmt: p.max_amount,
        rate: p.interest_rate,
        type: p.scheme_type
      }));
    } catch (e) {
      return [];
    }
  },

  async saveProductsList(productsList) {
    if (!_supabase || !Array.isArray(productsList)) return;
    try {
      const records = productsList.map(p => ({
        id: p.id || p.code || ('prod_' + Date.now()),
        code: p.code || 'GL',
        name: p.name || 'Product Scheme',
        min_amount: parseFloat(p.minAmt || p.min_amount || 0),
        max_amount: parseFloat(p.maxAmt || p.max_amount || 999999999),
        interest_rate: parseFloat(p.rate || p.interest_rate || 11.5),
        scheme_type: p.type || 'bullet'
      }));
      await _supabase.from('products').upsert(records, { onConflict: 'id' });
    } catch (e) {}
  },

  async getLoans() {
    if (!_supabase) return [];
    try {
      const { data } = await _supabase.from('loans').select('*');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },

  async getCustomers() {
    if (!_supabase) return [];
    try {
      const { data } = await _supabase.from('customers').select('*');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },

  async getDeletedLoanIds() {
    return [];
  },

  async saveLoan(loan) {
    if (!_supabase || !loan) return;
    try {
      const loanId = String(loan.id || loan.loanId || ('loan_' + Date.now())).trim();
      const loanRecord = {
        id: loanId,
        loan_no: String(loan.loanNo || loan.accountNo || loanId),
        account_no: String(loan.accountNo || loan.accNo || loanId),
        proposal_no: String(loan.proposalNo || ''),
        branch_id: String(loan.branchCode || (window.currentSession ? window.currentSession.code : '99')),
        customer_no: String(loan.customerNo || loan.customerId || 'CUST_UNKNOWN'),
        loan_date: loan.date || new Date().toISOString().split('T')[0],
        loan_status: String(loan.loanStatus || 'New'),
        loan_type: String(loan.loanType || loan.productCode || 'GOLD_LOAN'),
        sanctioned_amount: parseFloat(loan.sanctionedAmount || loan.loanAmount || 0),
        valuation_amount: parseFloat(loan.valuationAmount || loan.marketValue || 0),
        gold_weight: parseFloat(loan.goldWeight || 0),
        gross_weight: parseFloat(loan.grossWeight || 0),
        interest_rate: parseFloat(loan.interestRate || 11.5),
        created_by: String((window.currentSession && window.currentSession.operator) || 'OPERATOR'),
        updated_by: String((window.currentSession && window.currentSession.operator) || 'OPERATOR')
      };
      await _supabase.from('loans').upsert(loanRecord, { onConflict: 'id' });
    } catch (e) {}
  },

  async deleteLoan(loanId) {
    if (!_supabase || !loanId) return;
    try {
      await _supabase.from('loans').delete().eq('id', String(loanId).trim());
    } catch (e) {}
  },

  // Realtime Listeners (Active Live WebSockets across PCs)
  listenDailyRates(cb) {
    if (!_supabase || typeof cb !== 'function') return;
    const fetchLatest = () => {
      _supabase.from('rates').select('*').order('rate_date', { ascending: false }).limit(1).single().then(({ data }) => {
        if (data) cb({ rate22K: data.rate_22k, rate24K: data.rate_24k, isLocked: data.is_locked, date: data.rate_date });
      });
    };
    fetchLatest();
    _supabase.channel('public:rates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rates' }, fetchLatest)
      .subscribe();
  },

  listenRules(cb) {
    if (!_supabase || typeof cb !== 'function') return;
    const fetchRules = () => {
      _supabase.from('rules_master').select('rules_json').eq('id', 'rulesMaster').single().then(({ data }) => {
        if (data && data.rules_json) cb(data.rules_json);
      });
    };
    fetchRules();
    _supabase.channel('public:rules_master')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rules_master' }, fetchRules)
      .subscribe();
  },

  listenLoans(branchCode, cb) {
    if (!_supabase || typeof cb !== 'function') return;
    const fetchLoans = () => {
      let q = _supabase.from('loans').select('*');
      if (branchCode && branchCode !== '99') q = q.eq('branch_id', branchCode);
      q.then(({ data }) => { if (Array.isArray(data)) cb(data); });
    };
    fetchLoans();
    _supabase.channel('public:loans')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, fetchLoans)
      .subscribe();
  },

  listenBranches(cb) {
    if (!_supabase || typeof cb !== 'function') return;
    const fetchBranches = () => {
      _supabase.from('branches').select('*').order('branch_code').then(({ data }) => {
        if (Array.isArray(data)) cb(data.map(b => ({ code: b.branch_code, name: b.branch_name, nameGuj: b.branch_name_guj })));
      });
    };
    fetchBranches();
    _supabase.channel('public:branches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'branches' }, fetchBranches)
      .subscribe();
  },

  listenValuers(cb) {
    if (!_supabase || typeof cb !== 'function') return;
    const fetchValuers = () => {
      _supabase.from('valuers').select('*').then(({ data }) => {
        if (Array.isArray(data)) cb(data.map(v => ({ id: v.id, name: v.name, phone: v.phone, branchCode: v.branch_id })), []);
      });
    };
    fetchValuers();
    _supabase.channel('public:valuers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'valuers' }, fetchValuers)
      .subscribe();
  },

  listenProducts(cb) {
    if (!_supabase || typeof cb !== 'function') return;
    const fetchProducts = () => {
      _supabase.from('products').select('*').then(({ data }) => {
        if (Array.isArray(data)) cb(data);
      });
    };
    fetchProducts();
    _supabase.channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .subscribe();
  },

  listenCustomers(cb) {
    if (!_supabase || typeof cb !== 'function') return;
    const fetchCusts = () => {
      _supabase.from('customers').select('*').then(({ data }) => {
        if (Array.isArray(data)) cb(data);
      });
    };
    fetchCusts();
    _supabase.channel('public:customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchCusts)
      .subscribe();
  },

  listenDeletedLoans(cb) {},
  listenSettings(cb) {}
};

// Auto Health Check & Live Sync Trigger
(async () => {
  if (!_supabase) return;
  const { error } = await _supabase.from('loans').select('count', { count: 'exact', head: true });
  if (error) console.error("⚠️ Supabase connection test:", error.message);
  else console.log("🚀 Supabase connected cleanly (Zero Firebase dependencies).");
})();
