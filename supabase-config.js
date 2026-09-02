// supabase-config.js - Central Supabase Client & Complete Backend Adapter
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
 * Supabase Backend Service Adapter (Provides seamless Firebase-compatible interface)
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
    if (!_supabase) return null;
    try {
      let sessionId = localStorage.getItem("jccb_device_session_id");
      if (!sessionId) {
        sessionId = `DEV_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        localStorage.setItem("jccb_device_session_id", sessionId);
      }

      const branchCode = sessionData.branchCode || (window.currentSession ? window.currentSession.code : '99');
      const operator = sessionData.operator || (window.currentSession ? window.currentSession.operator : 'Operator');

      const payload = {
        id: sessionId,
        session_id: sessionId,
        branch_id: String(branchCode).replace(/\D/g, '').padStart(2, '0') || '99',
        operator_name: String(operator),
        status: 'active',
        last_heartbeat: new Date().toISOString()
      };

      await _supabase.from('active_sessions').upsert(payload, { onConflict: 'id' });
      return { ...payload, isOnline: true, terminated: false };
    } catch (e) {
      return null;
    }
  },

  async getActiveSessions() {
    if (!_supabase) return [];
    try {
      const { data } = await _supabase.from('active_sessions').select('*').order('last_heartbeat', { ascending: false });
      if (!Array.isArray(data)) return [];
      return data.map(s => ({
        id: s.id,
        sessionId: s.id || s.session_id,
        branchCode: s.branch_id || '99',
        branchName: `Branch ${s.branch_id || '99'}`,
        operator: s.operator_name || 'Operator',
        ip: s.ip_address || 'Office IP',
        loginTime: s.created_at || s.last_heartbeat,
        lastPing: s.last_heartbeat,
        lastPingMs: new Date(s.last_heartbeat || Date.now()).getTime(),
        isOnline: (Date.now() - new Date(s.last_heartbeat || 0).getTime() < 120000),
        status: s.status || 'active',
        terminated: s.status === 'terminated'
      }));
    } catch (e) {
      return [];
    }
  },

  async terminateActiveSession(sessionId) {
    if (!_supabase || !sessionId) return;
    try {
      await _supabase.from('active_sessions').update({ status: 'terminated' }).eq('id', sessionId);
    } catch (e) {}
  },

  async deleteActiveSession(sessionId) {
    if (!_supabase || !sessionId) return;
    try {
      await _supabase.from('active_sessions').delete().eq('id', sessionId);
    } catch (e) {}
  },

  async getAuditLogs(limitCount = 200) {
    if (!_supabase) return [];
    try {
      const { data } = await _supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limitCount);
      if (!Array.isArray(data)) return [];
      return data.map(l => ({
        id: l.id,
        action: l.event_action || 'EVENT',
        details: l.details || '',
        branchCode: l.branch_id || '99',
        branchName: `Branch ${l.branch_id || '99'}`,
        operator: l.actor_name || 'System',
        timestamp: l.created_at,
        timestampMs: new Date(l.created_at).getTime(),
        ip: 'Office Network'
      }));
    } catch (e) {
      return [];
    }
  },

  async getDailyRates() {
    if (!_supabase) return null;
    try {
      const { data, error } = await _supabase.from('rates').select('*').order('rate_date', { ascending: false });
      if (error || !Array.isArray(data) || data.length === 0) return null;
      const latest = data[0];
      const history = data.map(r => ({
        date: r.rate_date,
        rate22K: parseFloat(r.rate_22k || 0),
        rate24K: parseFloat(r.rate_24k || 0),
        updatedBy: r.updated_by || 'HEAD OFFICE'
      }));
      return {
        rate22K: latest.rate_22k,
        rate24K: latest.rate_24k,
        isLocked: latest.is_locked,
        date: latest.rate_date,
        history: history
      };
    } catch (e) {
      return null;
    }
  },

  async saveDailyRates(rateObj) {
    if (!_supabase || !rateObj) return false;
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

      const { error } = await _supabase.from('rates').upsert(payload, { onConflict: 'rate_date' });
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
      return {
        list: data.map(v => ({
          id: v.id,
          name: v.name,
          phone: v.phone,
          address: v.address,
          savingsAc: v.savings_account,
          branch: v.branch_id
        })),
        deletedIds: []
      };
    } catch (e) {
      return { list: [], deletedIds: [] };
    }
  },

  async saveValuersList(list) {
    if (!_supabase || !Array.isArray(list)) return;
    try {
      const records = list.map(v => ({
        id: v.id || ('val_' + Date.now()),
        name: v.name || 'Valuer',
        phone: v.phone || '',
        address: v.address || '',
        savings_account: v.savingsAc || '',
        branch_id: String(v.branch || '99').replace(/\D/g, '') || '99'
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

  async getLoans(branchCode = null) {
    if (!_supabase) return [];
    try {
      let query = _supabase.from('loans').select('*, loan_ornaments(*), customers(*)');
      if (branchCode && branchCode !== '99') {
        query = query.eq('branch_id', String(branchCode).padStart(2, '0'));
      }
      const { data, error } = await query;
      if (error || !Array.isArray(data)) return [];

      return data.map(l => {
        const cust = l.customers || {};
        const ornaments = (l.loan_ornaments || []).map(o => ({
          itemType: o.item_type || 'Other',
          name: o.item_name || 'Gold Ornament',
          itemName: o.item_name || 'Gold Ornament',
          qty: o.quantity || 1,
          quantity: o.quantity || 1,
          grossWeight: parseFloat(o.gross_weight_grams || 0),
          grossWt: parseFloat(o.gross_weight_grams || 0),
          netWeight: parseFloat(o.net_weight_grams || 0),
          netWt: parseFloat(o.net_weight_grams || 0),
          purity: o.purity_karat ? (String(o.purity_karat) + 'K') : '22K',
          karat: o.purity_karat || 22,
          valuationRate: parseFloat(o.valuation_rate || 0),
          itemValuation: parseFloat(o.valuation_amount || 0),
          valuation: parseFloat(o.valuation_amount || 0),
          amount: parseFloat(o.valuation_amount || 0)
        }));

        const custPh = cust.photo_url || cust.photo || l.customer_photo_url || l.CustomerPhoto || l.customer_photo || l.customerPhoto || l.photo || '';
        const ornPh = l.ornament_photo_url || l.OrnamentPhoto || l.ornament_photo || l.ornamentPhoto || l.goldPhoto || '';

        const borrowerName = String(cust.full_name || l.borrower_name || l.BorrowerName || l.name || '').trim();
        const pktNo = String(l.packet_no || l.PacketNo || '').trim();
        const cNo = String(l.customer_no || cust.customer_no || l.CustomerNo || '').trim();

        return {
          id: String(l.id || l.loan_no || l.ID),
          loanId: String(l.id || l.loan_no || l.ID),
          loanNo: String(l.loan_no || l.ProposalNo || l.id),
          accountNo: String(l.account_no || l.AccountNo || l.loan_no || l.id),
          proposalNo: String(l.proposal_no || l.ProposalNo || ''),
          branchCode: String(l.branch_id || l.BranchCode || '99'),
          branchName: String(l.branch_name || l.BranchName || ''),
          borrowerName: borrowerName,
          name: borrowerName,
          mobile: String(cust.mobile || l.mobile || l.Mobile || ''),
          address: String(cust.address || l.address || l.Address || ''),
          savingsAc: String(cust.savings_account || l.savings_account || l.SavingsAc || ''),
          customerNo: cNo,
          customerId: cNo,
          date: l.loan_date || l.Date || '',
          loanStatus: l.loan_status || l.LoanStatus || 'New',
          loanType: l.loan_type || l.LoanType || 'GW-3725',
          packetNo: pktNo,
          isMember: !!(cust.is_member || l.is_member || l.IsMember || cust.member_no || l.member_no || l.MemberNo),
          memberNo: String(cust.member_no || l.member_no || l.MemberNo || ''),
          interestRate: parseFloat(l.interest_rate || l.InterestRate || 11.5),
          sanctionedAmount: parseFloat(l.sanctioned_amount || l.SanctionedAmount || l.loanAmount || 0),
          loanAmount: parseFloat(l.sanctioned_amount || l.SanctionedAmount || l.loanAmount || 0),
          valuationAmount: parseFloat(l.valuation_amount || l.ValuationAmount || 0),
          goldWeight: parseFloat(l.gold_weight || l.GoldWeight || 0),
          grossWeight: parseFloat(l.gross_weight || l.GrossWeight || 0),
          purpose: String(l.purpose || l.Purpose || ''),
          shareA: parseFloat(l.share_a || l.ShareA || 0),
          shareB: parseFloat(l.share_b || l.ShareB || 0),
          memberFee: parseFloat(l.member_fee || l.MemberFee || 0),
          valuerFee: parseFloat(l.valuer_fee || l.ValuerFee || 0),
          stampDuty: parseFloat(l.stamp_duty || l.StampDuty || 0),
          serviceCharge: parseFloat(l.service_charge || l.ServiceCharge || 0),
          docCharges: parseFloat(l.doc_charges || l.DocCharges || 0),
          insurance: parseFloat(l.insurance || l.Insurance || 0),
          cgst: parseFloat(l.cgst || l.CGST || 0),
          sgst: parseFloat(l.sgst || l.SGST || 0),
          otherCharges: parseFloat(l.other_charges || l.OtherCharges || 0),
          totalDeductions: parseFloat(l.total_deductions || l.TotalDeductions || 0),
          emiAmount: parseFloat(l.emi_amount || l.EmiAmount || 0),
          installments: parseInt(l.installments || l.Installments || 36),
          valuerName: String(l.valuer_name || l.ValuerName || ''),
          grievanceOfficer: String(l.grievance_officer || l.GrievanceOfficer || 'Amrutlal Valjibhai Chavda'),
          ornamentsTable: ornaments,
          customerPhoto: custPh,
          photo: custPh,
          applicantPhoto: custPh,
          ornamentPhoto: ornPh,
          goldPhoto: ornPh,
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
      return data.map(c => {
        const ph = c.photo || c.photo_url || c.customerPhoto || '';
        return {
          id: String(c.customer_no || c.id || c.customerNo),
          customerNo: String(c.customer_no || c.customerNo || c.id),
          name: c.full_name || c.name || c.BorrowerName || 'Customer',
          borrowerName: c.full_name || c.name || c.BorrowerName || 'Customer',
          mobile: c.mobile || '',
          address: c.address || '',
          savingsAc: c.savings_account || c.savingsAc || '',
          dob: c.dob || '',
          age: c.age || '',
          occupation: c.occupation || '',
          religion: c.religion || '',
          caste: c.caste || '',
          nomineeName: c.nominee_name || c.nomineeName || '',
          nomineeRelation: c.nominee_relation || c.nomineeRelation || '',
          isMember: !!(c.is_member || c.isMember || c.member_no || c.memberNo),
          memberNo: c.member_no || c.memberNo || '',
          photo: ph,
          customerPhoto: ph,
          branchCode: c.branch_id || c.branchCode || '99'
        };
      });
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
      const bCode = String(loan.branchCode || (window.currentSession ? window.currentSession.code : '99')).replace(/\D/g, '').padStart(2, '0');
      const cNo = String(loan.customerNo || loan.customerId || ('CUST_' + loanId)).trim();
      const custPh = loan.customerPhoto || loan.photo || loan.applicantPhoto || '';
      const ornPh = loan.ornamentPhoto || loan.goldPhoto || '';

      // 1. Ensure customer record exists in customers table first
      if (cNo && cNo !== 'CUST_UNKNOWN') {
        await _supabase.from('customers').upsert({
          customer_no: cNo,
          branch_id: bCode,
          full_name: String(loan.borrowerName || loan.name || 'Customer'),
          mobile: String(loan.mobile || ''),
          address: String(loan.address || ''),
          savings_account: String(loan.savingsAc || ''),
          is_member: !!loan.isMember,
          member_no: String(loan.memberNo || ''),
          photo_url: custPh
        }, { onConflict: 'customer_no' });
      }

      // 2. Save loan record
      const loanRecord = {
        id: loanId,
        loan_no: String(loan.loanNo || loan.accountNo || loanId),
        account_no: String(loan.accountNo || loanId),
        proposal_no: String(loan.proposalNo || ''),
        branch_id: bCode,
        customer_no: cNo,
        loan_date: loan.date || new Date().toISOString().split('T')[0],
        loan_status: String(loan.loanStatus || 'New'),
        loan_type: String(loan.loanType || loan.productCode || 'GW-3725'),
        packet_no: String(loan.packetNo || ''),
        sanctioned_amount: parseFloat(loan.sanctionedAmount || loan.loanAmount || 0),
        valuation_amount: parseFloat(loan.valuationAmount || loan.marketValue || 0),
        gold_weight: parseFloat(loan.goldWeight || 0),
        gross_weight: parseFloat(loan.grossWeight || 0),
        interest_rate: parseFloat(loan.interestRate || 11.5),
        share_a: parseFloat(loan.shareA || 0),
        share_b: parseFloat(loan.shareB || 0),
        member_fee: parseFloat(loan.memberFee || 0),
        valuer_fee: parseFloat(loan.valuerFee || 0),
        stamp_duty: parseFloat(loan.stampDuty || 0),
        service_charge: parseFloat(loan.serviceCharge || 0),
        doc_charges: parseFloat(loan.docCharges || 0),
        insurance: parseFloat(loan.insurance || 0),
        cgst: parseFloat(loan.cgst || 0),
        sgst: parseFloat(loan.sgst || 0),
        other_charges: parseFloat(loan.otherCharges || 0),
        total_deductions: parseFloat(loan.totalDeductions || 0),
        emi_amount: parseFloat(loan.emiAmount || 0),
        installments: parseInt(loan.installments || 36),
        valuer_name: String(loan.valuerName || ''),
        ornament_photo_url: ornPh,
        created_by: String((window.currentSession && window.currentSession.operator) || 'OPERATOR'),
        updated_by: String((window.currentSession && window.currentSession.operator) || 'OPERATOR')
      };

      await _supabase.from('loans').upsert(loanRecord, { onConflict: 'id' });

      // 3. Save ornaments
      if (Array.isArray(loan.ornamentsTable) && loan.ornamentsTable.length > 0) {
        const ornRows = loan.ornamentsTable.map((o, idx) => ({
          loan_id: loanId,
          item_index: idx + 1,
          item_name: o.name || o.itemName || 'Gold Ornament',
          quantity: parseInt(o.qty || o.quantity || 1),
          gross_weight_grams: parseFloat(o.grossWeight || o.grossWt || 0),
          net_weight_grams: parseFloat(o.netWeight || o.netWt || 0),
          purity_karat: parseInt(String(o.purity || o.karat || 22).replace(/\D/g, '') || 22),
          valuation_amount: parseFloat(o.valuation || o.amount || o.itemValuation || 0)
        }));
        await _supabase.from('loan_ornaments').delete().eq('loan_id', loanId);
        await _supabase.from('loan_ornaments').insert(ornRows);
      }
    } catch (e) {
      console.warn("[Supabase] saveLoan error:", e);
    }
  },

  async saveCustomer(cust) {
    if (!_supabase || !cust) return;
    try {
      const cNo = String(cust.customerNo || cust.id || ('CUST_' + Date.now())).trim();
      const bCode = String(cust.branchCode || (window.currentSession ? window.currentSession.code : '99')).replace(/\D/g, '').padStart(2, '0');
      const photo = cust.photo || cust.customerPhoto || '';

      await _supabase.from('customers').upsert({
        customer_no: cNo,
        branch_id: bCode,
        full_name: String(cust.name || cust.borrowerName || 'Customer'),
        mobile: String(cust.mobile || ''),
        address: String(cust.address || ''),
        savings_account: String(cust.savingsAc || ''),
        dob: cust.dob && cust.dob.length === 10 ? cust.dob : null,
        age: parseInt(cust.age || 0) || null,
        occupation: String(cust.occupation || ''),
        religion: String(cust.religion || ''),
        caste: String(cust.caste || ''),
        nominee_name: String(cust.nomineeName || ''),
        nominee_relation: String(cust.nomineeRelation || ''),
        is_member: !!cust.isMember,
        member_no: String(cust.memberNo || ''),
        photo_url: photo
      }, { onConflict: 'customer_no' });
      console.log("✅ [Supabase] Customer profile saved:", cNo);
    } catch (e) {
      console.warn("[Supabase] saveCustomer error:", e);
    }
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
    const fetchLatest = async () => {
      const rates = await this.getDailyRates();
      if (rates) cb(rates);
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
    const fetchLoans = async () => {
      const loans = await this.getLoans(branchCode);
      if (Array.isArray(loans)) cb(loans);
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
    const fetchCusts = async () => {
      const custs = await this.getCustomers();
      if (Array.isArray(custs)) cb(custs);
    };
    fetchCusts();
    _supabase.channel('public:customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchCusts)
      .subscribe();
  }
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
        photo_url: c.photo || c.customerPhoto || ''
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
        const custPh = l.customerPhoto || l.photo || l.applicantPhoto || '';
        const ornPh = l.ornamentPhoto || l.goldPhoto || '';

        loanPayload.push({
          id: lid,
          loan_no: String(l.loanNo || l.proposalNo || lid),
          account_no: String(l.accountNo || lid),
          proposal_no: String(l.proposalNo || ''),
          branch_id: bCode,
          customer_no: cNo,
          loan_date: l.date || new Date().toISOString().split('T')[0],
          loan_status: String(l.loanStatus || 'New'),
          loan_type: String(l.loanType || l.productCode || 'GW-3725'),
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
          ornament_photo_url: ornPh,
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
              purity_karat: parseInt(String(orn.purity || orn.karat || 22).replace(/\D/g, '') || 22),
              valuation_amount: parseFloat(orn.valuation || orn.amount || orn.itemValuation || 0)
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
