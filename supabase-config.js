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
      const { data, error } = await _supabase.from('loans').select('*, loan_ornaments(*)');
      if (error || !Array.isArray(data)) return [];
      return data.map(l => {
        const ornaments = (l.loan_ornaments || []).map(o => ({
          name: o.item_name || 'Gold Ornament',
          qty: o.quantity || 1,
          quantity: o.quantity || 1,
          grossWeight: parseFloat(o.gross_weight_grams || 0),
          grossWt: parseFloat(o.gross_weight_grams || 0),
          netWeight: parseFloat(o.net_weight_grams || 0),
          netWt: parseFloat(o.net_weight_grams || 0),
          purity: o.purity_karat || 22,
          karat: o.purity_karat || 22,
          valuation: parseFloat(o.valuation_amount || 0),
          amount: parseFloat(o.valuation_amount || 0)
        }));

        return {
          id: String(l.id || l.loan_no),
          loanId: String(l.id || l.loan_no),
          loanNo: String(l.loan_no || l.id),
          accountNo: String(l.account_no || l.loan_no || l.id),
          proposalNo: String(l.proposal_no || ''),
          branchCode: String(l.branch_id || '99'),
          customerNo: String(l.customer_no || ''),
          customerId: String(l.customer_no || ''),
          date: l.loan_date || '',
          loanStatus: l.loan_status || 'New',
          loanType: l.loan_type || 'GOLD_LOAN',
          packetNo: l.packet_no || '',
          sanctionedAmount: parseFloat(l.sanctioned_amount || 0),
          loanAmount: parseFloat(l.sanctioned_amount || 0),
          valuationAmount: parseFloat(l.valuation_amount || 0),
          marketValue: parseFloat(l.valuation_amount || 0),
          goldWeight: parseFloat(l.gold_weight || 0),
          grossWeight: parseFloat(l.gross_weight || 0),
          interestRate: parseFloat(l.interest_rate || 11.5),
          valuerName: l.valuer_name || '',
          valuerFee: parseFloat(l.valuer_fee || 0),
          docCharges: parseFloat(l.doc_charges || 0),
          serviceCharge: parseFloat(l.service_charge || 0),
          cgst: parseFloat(l.cgst || 0),
          sgst: parseFloat(l.sgst || 0),
          stampDuty: parseFloat(l.stamp_duty || 0),
          insurance: parseFloat(l.insurance || 0),
          shareA: parseFloat(l.share_a || 0),
          shareB: parseFloat(l.share_b || 0),
          memberFee: parseFloat(l.member_fee || 0),
          otherCharges: parseFloat(l.other_charges || 0),
          totalDeductions: parseFloat(l.total_deductions || 0),
          totalCharges: parseFloat(l.total_deductions || 0),
          emiAmount: parseFloat(l.emi_amount || 0),
          installments: parseInt(l.installments || 36),
          ornamentsTable: ornaments,
          customerPhoto: l.ornament_photo_url || '',
          ornamentPhoto: l.ornament_photo_url || '',
          createdAt: l.created_at || new Date().toISOString(),
          updatedAt: l.updated_at || new Date().toISOString()
        };
      });
    } catch (e) {
      console.warn("[Supabase] getLoans error:", e);
      return [];
    }
  },

  async getCustomers() {
    if (!_supabase) return [];
    try {
      const { data, error } = await _supabase.from('customers').select('*');
      if (error || !Array.isArray(data)) return [];
      return data.map(c => ({
        id: String(c.customer_no || c.id),
        customerNo: String(c.customer_no || c.id),
        name: c.full_name || 'Customer',
        borrowerName: c.full_name || 'Customer',
        mobile: c.mobile || '',
        address: c.address || '',
        savingsAc: c.savings_account || '',
        dob: c.dob || '',
        age: c.age || '',
        occupation: c.occupation || '',
        religion: c.religion || '',
        caste: c.caste || '',
        nomineeName: c.nominee_name || '',
        nomineeRelation: c.nominee_relation || '',
        isMember: !!c.is_member,
        memberNo: c.member_no || '',
        photo: c.photo_url || '',
        branchCode: c.branch_id || '99'
      }));
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

};

/**
 * Universal Batch Uploader: Saves complete restored backup to Supabase
 */
window.uploadRestoredStateToSupabase = async function(appState) {
  if (!_supabase || !appState) return { success: false };
  console.log("⏳ Uploading restored data to Supabase in background...");

  try {
    // 1. Upload Rules Master
    if (appState.rules) {
      await _supabase.from('rules_master').upsert({
        id: 'rulesMaster',
        rules_json: appState.rules,
        updated_by: 'RESTORE_ENGINE'
      }, { onConflict: 'id' });
    }

    // 2. Upload Rates
    if (Array.isArray(appState.rateHistory) && appState.rateHistory.length > 0) {
      const ratesPayload = appState.rateHistory.map(r => ({
        rate_date: r.date || new Date().toISOString().split('T')[0],
        rate_22k: parseFloat(r.rate22K || r.rate || 0),
        rate_24k: parseFloat(r.rate24K || 0),
        is_locked: false,
        updated_by: r.updatedBy || 'RESTORE'
      })).filter(r => r.rate_date && r.rate_22k > 0);

      if (ratesPayload.length > 0) {
        await _supabase.from('rates').upsert(ratesPayload, { onConflict: 'rate_date' });
      }
    }

    // 3. Upload Valuers
    if (Array.isArray(appState.valuers) && appState.valuers.length > 0) {
      const valuerPayload = appState.valuers.map(v => ({
        id: v.id || ('val_' + Date.now()),
        name: v.name || 'Valuer',
        phone: v.phone || '',
        address: v.address || '',
        savings_account: v.savingsAc || '',
        branch_id: String(v.branch || v.branchCode || '99').replace(/\D/g, '') || '99'
      }));
      await _supabase.from('valuers').upsert(valuerPayload, { onConflict: 'id' });
    }

    // 4. Upload Products
    if (Array.isArray(appState.products) && appState.products.length > 0) {
      const prodPayload = appState.products.map(p => ({
        id: p.id || p.code || ('prod_' + Date.now()),
        code: p.code || 'GL',
        name: p.name || 'Product Scheme',
        min_amount: parseFloat(p.minAmt || 0),
        max_amount: parseFloat(p.maxAmt || 999999999),
        interest_rate: parseFloat(p.rate || 11.5),
        scheme_type: p.type || 'bullet'
      }));
      await _supabase.from('products').upsert(prodPayload, { onConflict: 'id' });
    }

    // 5. Upload Customers in Chunks of 50
    if (Array.isArray(appState.customers) && appState.customers.length > 0) {
      const custPayload = appState.customers.map(c => ({
        customer_no: String(c.customerNo || c.id || ('CUST_' + Date.now())),
        branch_id: String(c.branchCode || '99').replace(/\D/g, '') || '99',
        full_name: c.name || 'Customer',
        mobile: c.mobile || '',
        address: c.address || '',
        savings_account: c.savingsAc || '',
        dob: c.dob && c.dob.length === 10 ? c.dob : null,
        age: parseInt(c.age || 0) || null,
        occupation: c.occupation || '',
        religion: c.religion || '',
        caste: c.caste || '',
        nominee_name: c.nomineeName || '',
        nominee_relation: c.nomineeRelation || '',
        is_member: !!c.isMember,
        member_no: c.memberNo || '',
        photo_url: c.photo || ''
      }));

      for (let i = 0; i < custPayload.length; i += 50) {
        const chunk = custPayload.slice(i, i + 50);
        await _supabase.from('customers').upsert(chunk, { onConflict: 'customer_no' });
      }
    }

    // 6. Upload Loans in Chunks of 50
    if (Array.isArray(appState.loans) && appState.loans.length > 0) {
      const loanPayload = [];
      const ornamentsPayload = [];

      appState.loans.forEach(l => {
        const lid = String(l.id || l.loanId || ('loan_' + Date.now())).trim();
        const bCode = String(l.branchCode || '99').replace(/\D/g, '') || '99';
        const cNo = String(l.customerNo || l.customerId || ('CUST_' + lid));

        loanPayload.push({
          id: lid,
          loan_no: String(l.loanNo || l.proposalNo || lid),
          account_no: String(l.accountNo || lid),
          proposal_no: String(l.proposalNo || ''),
          branch_id: bCode,
          customer_no: cNo,
          loan_date: l.date || new Date().toISOString().split('T')[0],
          loan_status: String(l.loanStatus || 'New'),
          loan_type: String(l.loanType || l.productCode || 'GOLD_LOAN'),
          packet_no: String(l.packetNo || ''),
          sanctioned_amount: parseFloat(l.sanctionedAmount || l.loanAmount || 0),
          valuation_amount: parseFloat(l.valuationAmount || l.marketValue || 0),
          gold_weight: parseFloat(l.goldWeight || 0),
          gross_weight: parseFloat(l.grossWeight || 0),
          interest_rate: parseFloat(l.interestRate || 11.5),
          valuer_name: l.valuerName || '',
          valuer_fee: parseFloat(l.valuerFee || l.valuationCharge || 0),
          doc_charges: parseFloat(l.docCharges || l.docCharge || 0),
          service_charge: parseFloat(l.serviceCharge || 0),
          cgst: parseFloat(l.cgst || 0),
          sgst: parseFloat(l.sgst || 0),
          stamp_duty: parseFloat(l.stampDuty || 0),
          insurance: parseFloat(l.insurance || 0),
          share_a: parseFloat(l.shareA || 0),
          share_b: parseFloat(l.shareB || 0),
          member_fee: parseFloat(l.memberFee || 0),
          other_charges: parseFloat(l.otherCharges || 0),
          total_deductions: parseFloat(l.totalDeductions || l.totalCharges || 0),
          emi_amount: parseFloat(l.emiAmount || 0),
          installments: parseInt(l.installments || 36),
          created_by: 'RESTORE_ENGINE',
          updated_by: 'RESTORE_ENGINE'
        });

        // Ornaments extraction
        if (Array.isArray(l.ornamentsTable)) {
          l.ornamentsTable.forEach((orn, idx) => {
            ornamentsPayload.push({
              loan_id: lid,
              item_index: idx + 1,
              item_name: orn.name || orn.itemName || orn.desc || 'Gold Ornament',
              quantity: parseInt(orn.qty || orn.quantity || 1),
              gross_weight_grams: parseFloat(orn.grossWeight || orn.grossWt || 0),
              net_weight_grams: parseFloat(orn.netWeight || orn.netWt || 0),
              purity_karat: parseInt(orn.purity || orn.karat || 22),
              valuation_amount: parseFloat(orn.valuation || orn.amount || 0)
            });
          });
        }
      });

      for (let i = 0; i < loanPayload.length; i += 50) {
        const chunk = loanPayload.slice(i, i + 50);
        await _supabase.from('loans').upsert(chunk, { onConflict: 'id' });
      }

      if (ornamentsPayload.length > 0) {
        for (let i = 0; i < ornamentsPayload.length; i += 50) {
          const ornChunk = ornamentsPayload.slice(i, i + 50);
          await _supabase.from('loan_ornaments').insert(ornChunk);
        }
      }
    }

    // 7. Log Audit Event
    await window.logAuditEvent("RESTORE_COMPLETED", `Restored ${appState.loans ? appState.loans.length : 0} loans and ${appState.customers ? appState.customers.length : 0} customers into database`, {
      branchCode: '99',
      operator: 'ADMIN'
    });

    console.log("✅ [Supabase] Full Restored State successfully synced to Supabase tables!");
    return { success: true };
  } catch (err) {
    console.error("❌ [Supabase] Restore sync error:", err);
    return { success: false, error: err };
  }
};

// Auto Health Check & Live Sync Trigger
(async () => {
  if (!_supabase) return;
  const { error } = await _supabase.from('loans').select('count', { count: 'exact', head: true });
  if (error) console.error("⚠️ Supabase connection test:", error.message);
  else console.log("🚀 Supabase connected cleanly (Zero Firebase dependencies).");
})();
