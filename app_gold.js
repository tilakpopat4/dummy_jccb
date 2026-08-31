// ==================== ROLE-BASED ACCESS CONTROL (RBAC) ENGINE ====================
const ROLES = {
    ADMIN: "admin", // Head Office Super Admin (Full System Access)
    BRANCH_MANAGER: "branch_manager", // Branch Manager (Loan Entry, Customer Master, Branch Reports)
    BRANCH_OPERATOR: "branch_operator", // Loan Operator (Loan Entry & Document Printing)
    AUDITOR: "auditor" // Auditor / Inspector (Read-Only access across all branches)
};

const ROLE_DEFINITIONS = {
    [ROLES.ADMIN]: {
        key: ROLES.ADMIN,
        title: "Head Office Admin",
        titleGuj: "મુખ્ય સંચાલક (Super Admin)",
        badgeClass: "badge-primary",
        icon: "fa-crown"
    },
    [ROLES.BRANCH_MANAGER]: {
        key: ROLES.BRANCH_MANAGER,
        title: "Branch Manager",
        titleGuj: "શાખા મેનેજર",
        badgeClass: "badge-gold",
        icon: "fa-user-tie"
    },
    [ROLES.BRANCH_OPERATOR]: {
        key: ROLES.BRANCH_OPERATOR,
        title: "Loan Operator",
        titleGuj: "લોન ઓપરેટર",
        badgeClass: "badge-secondary",
        icon: "fa-user-pen"
    },
    [ROLES.AUDITOR]: {
        key: ROLES.AUDITOR,
        title: "Auditor / Inspector",
        titleGuj: "ઓડિટર / ઇન્સ્પેક્ટર",
        badgeClass: "badge-info",
        icon: "fa-magnifying-glass-chart"
    }
};

function getUserRole(session = null) {
    const s = session || (state ? state.currentSession : null);
    if (!s) return ROLES.BRANCH_MANAGER;
    if (s.isHO === true || String(s.code) === "99" || String(s.code) === "099") {
        return s.role || ROLES.ADMIN;
    }
    return s.role || ROLES.BRANCH_MANAGER;
}

function getRoleBadgeHTML(roleKey) {
    const r = ROLE_DEFINITIONS[roleKey] || ROLE_DEFINITIONS[ROLES.BRANCH_MANAGER];
    return `<span class="badge ${r.badgeClass}" style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:4px;"><i class="fa-solid ${r.icon}"></i> ${r.title}</span>`;
}

function hasPermission(permissionName, targetBranchCode = null) {
    const role = getUserRole();
    if (!role) return false;
    if (role === ROLES.ADMIN) return true; // Super Admin has all privileges

    switch (permissionName) {
        case "EDIT_GOLD_RATE":
        case "LOCK_GOLD_RATE":
        case "MANAGE_BRANCHES":
        case "MANAGE_VALUERS":
        case "MANAGE_PRODUCTS":
        case "MANAGE_RULES":
        case "BACKUP_RESTORE":
        case "ACCOUNT_SETTINGS":
            return role === ROLES.ADMIN;

        case "DELETE_LOAN":
            if (role === ROLES.ADMIN) return true;
            if (role === ROLES.AUDITOR) return false;
            if (targetBranchCode && state.currentSession) return isBranchMatch(state.currentSession.code, targetBranchCode);
            return true;

        case "CREATE_LOAN":
        case "EDIT_LOAN":
            if (role === ROLES.AUDITOR) return false; // Auditor is strictly read-only
            if (targetBranchCode && state.currentSession) return isBranchMatch(state.currentSession.code, targetBranchCode);
            return true;

        case "VIEW_LOANS":
        case "VIEW_REPORTS":
        case "VIEW_VOUCHERS":
            if (role === ROLES.ADMIN || role === ROLES.AUDITOR) return true;
            if (targetBranchCode && state.currentSession) return isBranchMatch(state.currentSession.code, targetBranchCode);
            return true;

        case "MANAGE_CUSTOMERS":
            return role === ROLES.ADMIN || role === ROLES.BRANCH_MANAGER || role === ROLES.BRANCH_OPERATOR;

        default:
            return false;
    }
}

// ==========================================================================
// THE JUNAGADH COMMERCIAL CO-OPERATIVE BANK LTD. - GOLD LOAN PORTAL (v3.0)
// Configured with Fully Editable Rules Master (HO Authorized) & Dynamic Calculations
// ==========================================================================
"use strict";

const STORAGE_KEY = "jccb_gold_system_state_v2";
const LOGO_SRC = "jccb-logo.png";

// Bank Branches
const DEFAULT_BRANCHES = [
    { code: "99", name: "99 HEAD OFFICE", role: ROLES.ADMIN, isHO: true, password: "Rahul#80810", isDefaultPassword: false, passwordChanged: true },
    { code: "01", name: "01 AZADCHOWK BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "02", name: "02 JOSHIPARA BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "03", name: "03 DOLATPARA BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "04", name: "04 KODINAR BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "05", name: "05 KESHOD BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "06", name: "06 VANTHALI BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "07", name: "07 MANAVADAR BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "08", name: "08 GANDHINAGAR BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "09", name: "09 LIMBDI BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "10", name: "10 MENDARDA BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "11", name: "11 VISAVADAR BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "12", name: "12 JAMNAGAR BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "13", name: "13 BUS STAND BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "14", name: "14 LATHI BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "16", name: "16 AHMEDABAD BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "17", name: "17 RAJKOT BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false },
    { code: "18", name: "18 ZANZARDA BRANCH", role: ROLES.BRANCH_MANAGER, isHO: false, password: "Admin@123", isDefaultPassword: true, passwordChanged: false }
];

// Product Schemes
const DEFAULT_PRODUCTS = [
    { id: "1", code: "GW-3725", minAmt: 0, maxAmt: 50000, rate: 11.00, name: "Gold Loan up to ₹50,000 (GW-3725) 11.00% FIX", type: "bullet" },
    { id: "2", code: "GW-3725", minAmt: 50001, maxAmt: 100000, rate: 11.50, name: "Gold Loan ₹50,001 to ₹100,000 (GW-3725) 11.50% FIX", type: "bullet" },
    { id: "3", code: "GD-3524", minAmt: 100001, maxAmt: 200000, rate: 11.50, name: "Gold Loan ₹100,001 to ₹200,000 (GD-3524) 11.50% FIX", type: "bullet" },
    { id: "4", code: "GNA-3527", minAmt: 200001, maxAmt: 999999999, rate: 11.50, name: "Gold Loan above ₹200,000 (GNA-3527) 11.50% FIX", type: "installment" },
    { id: "5", code: "GOD-3553", minAmt: 200001, maxAmt: 999999999, rate: 11.50, name: "Gold Loan above ₹200,000 (Overdraft) (GOD-3553) 11.50% FIX", type: "overdraft" }
];

// Authorized Valuers
const DEFAULT_VALUERS = [
    { id: "V01", name: "SURYAKANT HIMMATLAL LUHAR", phone: "9033048938", address: "KANKAI SHERI, JUNI BAZAR, MU. KODINAR", savingsAc: "004131800000121", branch: "04", active: true },
    { id: "V02", name: "DHAVALKUMAR BHOGILAL ZANZMERIYA", phone: "9427041022", address: "A-301, IMPERIAL HEIGHTS, MONALISHA TOWNSHIP,, CHOBARI ROAD, JUNAGADH", savingsAc: "001131800012753", branch: "01", active: true },
    { id: "V03", name: "NAINESH HARESHBHAI KATHRODIA", phone: "8128730511", address: "BLOCK NO : 103,, JALARAM NAGAR, ZANZARDA ROAD, JUNAGADH", savingsAc: "013131800002329", branch: "13", active: true },
    { id: "V04", name: "NAVNEETLAL MOHANLAL LODHIYA", phone: "9879025311", address: "302, RUDHRAKSH APPARTMENT,  VANZARI GARBI CHOWK MAIN ROAD, JUNAGADH", savingsAc: "013131800000179", branch: "13", active: true },
    { id: "V05", name: "MAHENDRA RAMNIKLAL DHOLAKIYA", phone: "9879284739", address: "MADHURAM, NR. SHREE TAWOR, JAY NAGAR, KESHOD", savingsAc: "005131800000188", branch: "05", active: true },
    { id: "V06", name: "DHARMENDRA NAVNITLAL DHOLAKIYA", phone: "9033337737", address: "PRAMUKHSAGAR APPARTMENT,  BH. MAHENDRASINHJI CHOWK, KESHOD", savingsAc: "005131800002017", branch: "05", active: true },
    { id: "V07", name: "MEHUL BHOGILAL DHOLAKIYA", phone: "9426991565", address: "RAILWAY STATION ROAD, MURLIDHAR MILL, VISAVADAR", savingsAc: "011131800001933", branch: "11", active: true },
    { id: "V08", name: "CHANDRAKANT AMRUTLAL DHOLAKIA", phone: "9904816713", address: "GOKUL APPARTMENT,  BLOCK NO : 101, JUNAGADH ROAD, KESHOD", savingsAc: "006131800005086", branch: "06", active: true },
    { id: "V09", name: "CHETAN RAMESHCHANDRA ZINZUVADIA", phone: "9033345925", address: "B-501, JINKUSHAL RESIDENCY, BH. NAVA NAGAR HIGHT SCHOOL, NR. JAYSHREE TALKISE, SUPERMARKET, JAMNAGAR", savingsAc: "012131700001868", branch: "12", active: true },
    { id: "V10", name: "KIRANKUMAR INDRAVADANBHAI DHOLAKIYA", phone: "8780227669", address: "SANGHAVI SHERI, MU.LATHI", savingsAc: "014131800002958", branch: "14", active: true },
    { id: "V11", name: "VIPULCHANDRA MANEKLAL FICHADIYA", phone: "8320560985", address: "MU.LIMBDI, DIST : SURENDRANAGAR", savingsAc: "009131800006127", branch: "09", active: true },
    { id: "V12", name: "KISHORBHAI NAROTTAMDAS MEVACHA", phone: "9426860887", address: "SARDARGADH PARA, SHERI NO-1, POLICE STATION GROUND, MANAVADAR", savingsAc: "007131800000004", branch: "07", active: true },
    { id: "V13", name: "MITESHBHAI HARILAL SIMEJIYA", phone: "9427929160", address: "GANDHI CHOWK, MAIN ROAD, MANAVADAR", savingsAc: "007131800001582", branch: "07", active: true },
    { id: "V14", name: "ANILBHAI NAROTTAMBHAI GHORDA", phone: "9824845046", address: "FLAT NO.401, RAGHUVIR PALACE APPARTMENT, SERI NO 7-A/18, MILPARA, BHAKTI NAGAR, RAJKOT", savingsAc: "017131800000041", branch: "17", active: true },
    { id: "V15", name: "RAJESHBHAI SONI", phone: "9825443106", address: "SECTOR-21, GANDHINAGAR", savingsAc: "1111111111111111", branch: "08", active: true }
];

// Default Dynamic Bank Rules (Editable via HO Rules Master)
const DEFAULT_RULES = {
    membership: {
        nonMemberLimit: 99999,
        shareGroupB: 50,
        shareGroupA: 500,
        memberFee: 25
    },
    valuation: {
        slab1Max: 25000,
        slab1Amt: 100,
        slab2Max: 50000,
        slab2Amt: 150,
        slab3Max: 100000,
        slab3Amt: 250,
        ratePercent: 0.25,
        slab4MaxCap: 1000,
        slab5MaxCap: 1500,
        slab6MaxCap: 2000
    },
    insurance: {
        threshold: 200000,
        slab1Amt: 50,
        slab2Amt: 100
    },
    docCharge: {
        slab1Limit: 100000,
        slab1Amt: 50,
        slab2Limit: 200000,
        slab2Amt: 100,
        slab3Amt: 200
    },
    serviceCharge: {
        threshold: 200000,
        slab1Rate: 0.25,
        slab1Cap: 500,
        slab2Rate: 0.50,
        slab2Cap: 5000
    },
    stampDuty: {
        exemptLimit: 49999,
        slabLimit: 119999,
        ratePercent: 0.25,
        roundUpMultiple: 10,
        fixedAboveAmount: 300,
        aboveExtraFee: 300,
        scheme3553ExtraFee: 300
    },
    gst: {
        cgstPercent: 9,
        sgstPercent: 9
    },
    customCharges: []
};

// Default App State
const DEFAULT_STATE = {
    currentSession: null,
    goldRates: {
        "24K": 0,
        "22K": 0,
        "rateDate": "",
        "lastUpdated": ""
    },
    rateHistory: [
        { date: "2026-08-21", rate22K: 72000, rate24K: Math.round(72000 * (24 / 22)) }
    ],
    loans: [],
    deletedLoanIds: [],
    branches: DEFAULT_BRANCHES,
    products: DEFAULT_PRODUCTS,
    valuers: DEFAULT_VALUERS,
    customers: [],
    rules: DEFAULT_RULES,
    settings: {
        branchSeeds: {},
        lastPacketSeed: 100,
        enableAutoSync: true
    }
};

// ==================== LOAN ACCOUNT NUMBER FORMAT ENFORCER ====================
// Standard Format: 001-3527-00000001 (Branch 3 digits - Product 4 digits - Serial 8 digits)
function formatLoanAccountNo(accNo, branchCode, productCode) {
    if (!accNo || String(accNo).trim() === "" || String(accNo).toUpperCase() === "PENDING") {
        return "PENDING";
    }
    const clean = String(accNo).trim();
    
    // Check if already in standard XXX-XXXX-XXXXXXXX format (3 digits - 4 digits - 8 digits)
    if (/^\d{3}-\d{4}-\d{8}$/.test(clean)) {
        return clean;
    }
    
    const rawBranch = branchCode ? String(branchCode).trim() : (state && state.currentSession ? String(state.currentSession.code).trim() : "001");
    const numBranch = rawBranch.match(/\d+/) ? rawBranch.match(/\d+/)[0] : rawBranch;
    const bCode = String(numBranch).padStart(3, "0");

    let pCode = "3725";
    if (productCode) {
        const numMatch = String(productCode).match(/\d+/);
        if (numMatch) pCode = numMatch[0];
    }
    pCode = String(pCode).padStart(4, "0");

    // If hyphen-separated (e.g. 1-3527-1, 001-3527-1, 3527-1)
    const parts = clean.split("-").map(p => p.trim());
    if (parts.length === 3) {
        const b = (parts[0].match(/\d+/) ? parts[0].match(/\d+/)[0] : parts[0]).padStart(3, "0");
        const p = (parts[1].match(/\d+/) ? parts[1].match(/\d+/)[0] : parts[1]).padStart(4, "0");
        const s = (parts[2].match(/\d+/) ? parts[2].match(/\d+/)[0] : parts[2]).padStart(8, "0");
        return `${b}-${p}-${s}`;
    } else if (parts.length === 2) {
        const pMatch = parts[0].match(/\d+/);
        const p = pMatch ? pMatch[0].padStart(4, "0") : pCode;
        const sMatch = parts[1].match(/\d+/);
        const s = sMatch ? sMatch[0].padStart(8, "0") : "00000001";
        return `${bCode}-${p}-${s}`;
    } else {
        const numOnly = clean.replace(/\D/g, '');
        const s = String(numOnly || "1").padStart(8, "0");
        return `${bCode}-${pCode}-${s}`;
    }
}

// ==================== SESSION PERSISTENCE (PER-TAB & STORAGE) ====================
function getActiveSession() {
    try {
        const raw = sessionStorage.getItem("jccb_active_session");
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
}

function setActiveSession(sess) {
    try {
        if (sess) {
            sessionStorage.setItem("jccb_active_session", JSON.stringify(sess));
        } else {
            sessionStorage.removeItem("jccb_active_session");
        }
    } catch (e) {}
}

function isHeadOfficeSession() {
    if (!state || !state.currentSession) return false;
    const sess = state.currentSession;
    const numOnly = String(sess.code || "").trim().replace(/\D/g, '');
    const name = String(sess.name || "").toUpperCase();
    
    // Head office is code 99 / role admin / explicit HEAD OFFICE name
    if (numOnly === "99" || numOnly === "099" || numOnly === "00" || numOnly === "0") return true;
    if (sess.role === ROLES.ADMIN || sess.role === "admin") return true;
    if (name.includes("HEAD OFFICE") || name.includes("મુખ્ય કચેરી")) return true;
    return false;
}

function isBranchMatch(codeA, codeB) {
    if (!codeA || !codeB) return false;
    const a = String(codeA).trim().replace(/\D/g, '');
    const b = String(codeB).trim().replace(/\D/g, '');
    if (a && b) {
        return parseInt(a, 10) === parseInt(b, 10);
    }
    return String(codeA).trim().toLowerCase() === String(codeB).trim().toLowerCase();
}

let state = loadState();
let cropperInstance = null;
let currentPhotoTarget = null;

// ==================== STATE PERSISTENCE ====================
function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            let prods = parsed.products;
            if (!prods || prods.length !== 5 || !prods.some(p => p.code === "GNA-3527")) {
                prods = DEFAULT_PRODUCTS;
            }
            let vals = parsed.valuers;
            if (!vals || vals.length < 15 || !vals.some(v => v.name && v.name.includes("SURYAKANT"))) {
                vals = DEFAULT_VALUERS;
            }
            let branches = parsed.branches;
            if (!Array.isArray(branches) || branches.length === 0) {
                branches = DEFAULT_BRANCHES;
            }
            let session = getActiveSession();
            let rules = parsed.rules;
            if (!rules || !rules.membership || !rules.valuation) {
                rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
            }
            if (!Array.isArray(rules.customCharges)) {
                rules.customCharges = [];
            }
            let loans = parsed.loans || [];
            if (Array.isArray(loans)) {
                loans = loans.map(l => ({
                    ...l,
                    accountNo: formatLoanAccountNo(l.accountNo, l.branchCode, l.loanType)
                }));
            }

            let rateHist = Array.isArray(parsed.rateHistory) ? parsed.rateHistory : [...DEFAULT_STATE.rateHistory];
            
            rateHist = rateHist.map(r => {
                const r22 = parseFloat(r.rate22K || r.rate24K || 72000);
                return {
                    date: r.date,
                    rate22K: r22,
                    rate24K: Math.round(r22 * (24 / 22)),
                    updatedBy: r.updatedBy || ""
                };
            });

            // Ensure baseline rate history if empty
            if (rateHist.length === 0) {
                rateHist = [...DEFAULT_STATE.rateHistory];
            }

            let goldRates = parsed.goldRates || { "24K": 0, "22K": 0, rateDate: "", lastUpdated: "" };
            if (goldRates && (parseFloat(goldRates["22K"]) > 0 || parseFloat(goldRates["24K"]) > 0)) {
                const r22 = parseFloat(goldRates["22K"] || goldRates["24K"]);
                goldRates["22K"] = r22;
                goldRates["24K"] = Math.round(r22 * (24 / 22));
            }

            let settings = parsed.settings || JSON.parse(JSON.stringify(DEFAULT_STATE.settings));
            if (!settings.branchSeeds || typeof settings.branchSeeds !== "object") {
                settings.branchSeeds = {};
            }

            let deletedLoanIds = Array.isArray(parsed.deletedLoanIds) ? parsed.deletedLoanIds : [];

            return {
                ...DEFAULT_STATE,
                ...parsed,
                settings: settings,
                goldRates: goldRates,
                rateHistory: rateHist,
                loans: loans,
                deletedLoanIds: deletedLoanIds,
                currentSession: session,
                branches: branches,
                products: prods,
                valuers: vals,
                rules: rules
            };
        }
    } catch (e) {
        console.error("State loading error:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("State saving error:", e);
        alert("Warning: LocalStorage storage quota exceeded or storage error.");
    }
}

// ==================== APPLICATION INIT ====================
document.addEventListener("DOMContentLoaded", () => {
    const safeRun = (fn, name) => {
        try { if (typeof fn === "function") fn(); } catch (e) { console.warn(`[Init] Error in ${name}:`, e); }
    };

    safeRun(initClock, "initClock");
    safeRun(initGlobalUppercaseEnforcer, "initGlobalUppercaseEnforcer");
    safeRun(initAuth, "initAuth");
    safeRun(initNavigation, "initNavigation");
    safeRun(initDashboard, "initDashboard");
    safeRun(initLoanEntryForm, "initLoanEntryForm");
    safeRun(initRegister, "initRegister");
    safeRun(initDailyVouchers, "initDailyVouchers");
    safeRun(initGoldRateMaster, "initGoldRateMaster");
    safeRun(initBranchMaster, "initBranchMaster");
    safeRun(initValuerMaster, "initValuerMaster");
    safeRun(initProductMaster, "initProductMaster");
    safeRun(initRulesMaster, "initRulesMaster");
    safeRun(initCustomerMaster, "initCustomerMaster");
    safeRun(initSettings, "initSettings");
    safeRun(initMandatoryPasswordModal, "initMandatoryPasswordModal");
    safeRun(initBackupRestore, "initBackupRestore");
    safeRun(initImageCropper, "initImageCropper");
    safeRun(initReminders, "initReminders");
    safeRun(initPrintModal, "initPrintModal");
    safeRun(initReports, "initReports");
    safeRun(updateHeaderGoldRate, "updateHeaderGoldRate");

    // Wire manual sync button in header immediately
    const btnManualSync = document.getElementById("btn-manual-cloud-sync");
    if (btnManualSync) {
        btnManualSync.addEventListener("click", (e) => {
            e.preventDefault();
            syncCloudData(true);
        });
    }

    // Trigger immediate sync on page startup
    syncCloudData();

    // Continuous 5-second resilient background cloud polling across all machines
    setInterval(() => syncCloudData(false), 5000);

    // Initialize Firebase Realtime Cloud Backend & Background Auto-Sync
    if (window.FirebaseService) {
        window.FirebaseService.init().then(() => {
            console.log("[Firebase] Central Cloud Database Initialized.");
            
            // 1. Listen for realtime gold rate changes
            if (typeof window.FirebaseService.listenDailyRates === "function") {
                window.FirebaseService.listenDailyRates((cloudRates) => {
                    if (cloudRates && (parseFloat(cloudRates.rate22K) > 0 || parseFloat(cloudRates.rate24K) > 0)) {
                        const cloud22 = parseFloat(cloudRates.rate22K || cloudRates.rate24K);
                        applyDailyGoldRate(cloud22, getTodayDateYMD(), {
                            isLocked: cloudRates.isLocked,
                            lockedAt: cloudRates.lockedAt,
                            lockedBy: cloudRates.lockedBy
                        });
                    }
                });
            }

            // 2. Listen for realtime deleted loans across all devices
            if (typeof window.FirebaseService.listenDeletedLoans === "function") {
                window.FirebaseService.listenDeletedLoans((deletedId) => {
                    if (!deletedId) return;
                    const cleanId = String(deletedId).trim();
                    if (!state.deletedLoanIds) state.deletedLoanIds = [];
                    if (!state.deletedLoanIds.includes(cleanId)) {
                        state.deletedLoanIds.push(cleanId);
                        if (state.deletedLoanIds.length > 500) {
                            state.deletedLoanIds = state.deletedLoanIds.slice(-500);
                        }
                    }
                    const prevCount = (state.loans || []).length;
                    state.loans = (state.loans || []).filter(l => {
                        const lid = String(l.id || l.loanId || "").trim();
                        return lid !== cleanId;
                    });
                    if (state.loans.length !== prevCount) {
                        saveState();
                        renderDashboard();
                        renderRegisterTable();
                        if (typeof renderReportsTable === "function") renderReportsTable();
                        console.log("[Firebase] Loan deletion synced from another device:", cleanId);
                    }
                });
            }

            // 3. Listen for realtime loan records
            if (typeof window.FirebaseService.listenLoans === "function") {
                window.FirebaseService.listenLoans(null, (cloudLoans) => {
                    if (Array.isArray(cloudLoans)) {
                        if (!state.loans) state.loans = [];
                        const deletedSet = new Set(state.deletedLoanIds || []);

                        const validCloudLoans = cloudLoans.filter(cl => {
                            const id = String(cl.id || cl.loanId || "").trim();
                            return id && !deletedSet.has(id);
                        });

                        const updatedList = [];
                        const seenIds = new Set();

                        validCloudLoans.forEach(cl => {
                            const id = String(cl.id || cl.loanId).trim();
                            seenIds.add(id);
                            const local = state.loans.find(x => String(x.id || x.loanId).trim() === id);
                            if (local) {
                                updatedList.push({ ...local, ...cl, id: id, loanId: id });
                            } else {
                                updatedList.push({ ...cl, id: id, loanId: id });
                            }
                        });

                        state.loans.forEach(localLoan => {
                            const id = String(localLoan.id || localLoan.loanId || "").trim();
                            if (id && !seenIds.has(id) && !deletedSet.has(id)) {
                                const createdTime = localLoan.createdAt ? new Date(localLoan.createdAt).getTime() : 0;
                                const isRecent = createdTime > 0 && (Date.now() - createdTime < 3600000);
                                if (isRecent) {
                                    updatedList.unshift(localLoan);
                                    seenIds.add(id);
                                }
                            }
                        });

                        state.loans = updatedList;
                        saveState();
                        renderDashboard();
                        renderRegisterTable();
                        if (typeof renderReportsTable === "function") renderReportsTable();
                    }
                });
            }

            // 4. Listen for realtime Branch Settings & Account/Packet Seeds
            if (typeof window.FirebaseService.listenSettings === "function") {
                window.FirebaseService.listenSettings((cloudSettings) => {
                    if (cloudSettings && typeof cloudSettings === "object") {
                        state.settings = { ...state.settings, ...cloudSettings };
                        saveState();
                        if (typeof renderBranchSettings === "function") {
                            const branchSelect = document.getElementById("settings-branch-select");
                            renderBranchSettings(branchSelect ? branchSelect.value : null);
                        }
                        const curBranch = document.getElementById("loan-branch") ? document.getElementById("loan-branch").value : (state.currentSession ? state.currentSession.code : "99");
                        generateNextProposalNo(curBranch);
                        generateNextPacketNo(curBranch);
                        console.log("[Firebase] Realtime settings & seeds synced across PCs.");
                    }
                });
            }

            // 5. Listen for realtime Rules Master
            if (typeof window.FirebaseService.listenRules === "function") {
                window.FirebaseService.listenRules((cloudRules) => {
                    if (cloudRules && typeof cloudRules === "object" && cloudRules.membership) {
                        state.rules = { ...state.rules, ...cloudRules };
                        saveState();
                        calculateAllCharges();
                        if (typeof renderRulesMaster === "function") renderRulesMaster();
                        if (typeof renderCustomChargesTable === "function") renderCustomChargesTable();
                        console.log("[Firebase] Realtime Rules Master synced across PCs.");
                    }
                });
            }

            // 6. Listen for realtime Branches Master (passwords & branch changes)
            if (typeof window.FirebaseService.listenBranches === "function") {
                window.FirebaseService.listenBranches((cloudBranches) => {
                    if (Array.isArray(cloudBranches) && cloudBranches.length > 0) {
                        state.branches = cloudBranches;
                        saveState();
                        if (typeof populateLoginBranches === "function") populateLoginBranches();
                        if (typeof renderBranchMaster === "function") renderBranchMaster();
                        if (typeof updateBranchContextUI === "function") updateBranchContextUI();
                        console.log("[Firebase] Realtime Branches & Passwords synced across PCs.");
                    }
                });
            }

            // 7. Listen for realtime Valuers Master
            if (typeof window.FirebaseService.listenValuers === "function") {
                window.FirebaseService.listenValuers((cloudValuers) => {
                    if (Array.isArray(cloudValuers) && cloudValuers.length > 0) {
                        state.valuers = cloudValuers;
                        saveState();
                        if (typeof renderValuers === "function") renderValuers();
                        console.log("[Firebase] Realtime Valuers Master synced across PCs.");
                    }
                });
            }

            // 8. Listen for realtime Product Schemes Master
            if (typeof window.FirebaseService.listenProducts === "function") {
                window.FirebaseService.listenProducts((cloudProducts) => {
                    if (Array.isArray(cloudProducts) && cloudProducts.length > 0) {
                        state.products = cloudProducts;
                        saveState();
                        if (typeof renderProductMaster === "function") renderProductMaster();
                        console.log("[Firebase] Realtime Product Schemes synced across PCs.");
                    }
                });
            }

            // 9. Listen for realtime Customer Profiles
            if (typeof window.FirebaseService.listenCustomers === "function") {
                window.FirebaseService.listenCustomers((cloudCustomers) => {
                    if (Array.isArray(cloudCustomers) && cloudCustomers.length > 0) {
                        state.customers = cloudCustomers;
                        saveState();
                        if (typeof renderCustomerMasterList === "function") renderCustomerMasterList();
                        console.log("[Firebase] Realtime Customers synced across PCs.");
                    }
                });
            }
        }).catch(err => console.warn("[Firebase] Init warning:", err));
    }
});

// Centralized Hybrid Cloud Synchronizer (Dual REST + SDK)
async function syncCloudData(isManual = false) {
    if (!window.FirebaseService) return;
    const spinIcon = document.getElementById("cloud-sync-spin-icon");
    const syncText = document.getElementById("cloud-sync-text");
    const syncDot = document.getElementById("cloud-sync-dot");

    if (spinIcon) spinIcon.classList.add("fa-spin");
    if (syncText && isManual) syncText.textContent = "Syncing...";

    try {
        // 1. Sync Daily Rates
        const fbRates = await window.FirebaseService.getDailyRates();
        let activeCloudRate = null;
        if (fbRates && (parseFloat(fbRates.rate22K) > 0 || parseFloat(fbRates.rate24K) > 0)) {
            activeCloudRate = parseFloat(fbRates.rate22K || fbRates.rate24K);
            if (!state.goldRates || parseFloat(state.goldRates["22K"]) !== activeCloudRate) {
                applyDailyGoldRate(activeCloudRate, getTodayDateYMD(), {
                    isLocked: fbRates.isLocked,
                    lockedAt: fbRates.lockedAt,
                    lockedBy: fbRates.lockedBy
                });
            }
        }

        // 2. Sync Settings & Branch Seeds
        if (typeof window.FirebaseService.getSettings === "function") {
            const fbSettings = await window.FirebaseService.getSettings();
            if (fbSettings && typeof fbSettings === "object") {
                state.settings = { ...state.settings, ...fbSettings };
            } else if (state.settings && Object.keys(state.settings.branchSeeds || {}).length > 0) {
                window.FirebaseService.saveSettings(state.settings).catch(() => {});
            }
        }

        // 3. Sync Rules Master
        if (typeof window.FirebaseService.getRules === "function") {
            const fbRules = await window.FirebaseService.getRules();
            if (fbRules && typeof fbRules === "object" && fbRules.membership) {
                state.rules = { ...state.rules, ...fbRules };
            } else if (state.rules && state.rules.membership) {
                window.FirebaseService.saveRules(state.rules).catch(() => {});
            }
        }

        // 4. Sync Branches List
        if (typeof window.FirebaseService.getBranchesList === "function") {
            const fbBranches = await window.FirebaseService.getBranchesList();
            if (Array.isArray(fbBranches) && fbBranches.length > 0) {
                state.branches = fbBranches;
            } else if (Array.isArray(state.branches) && state.branches.length > 0) {
                window.FirebaseService.saveBranchesList(state.branches).catch(() => {});
            }
        }

        // 5. Sync Valuers List
        if (typeof window.FirebaseService.getValuersList === "function") {
            const fbValuers = await window.FirebaseService.getValuersList();
            if (Array.isArray(fbValuers) && fbValuers.length > 0) {
                state.valuers = fbValuers;
            } else if (Array.isArray(state.valuers) && state.valuers.length > 0) {
                window.FirebaseService.saveValuersList(state.valuers).catch(() => {});
            }
        }

        // 6. Sync Products List
        if (typeof window.FirebaseService.getProductsList === "function") {
            const fbProducts = await window.FirebaseService.getProductsList();
            if (Array.isArray(fbProducts) && fbProducts.length > 0) {
                state.products = fbProducts;
            } else if (Array.isArray(state.products) && state.products.length > 0) {
                window.FirebaseService.saveProductsList(state.products).catch(() => {});
            }
        }

        // 7. Sync Deleted Loans catchup
        if (typeof window.FirebaseService.getDeletedLoanIds === "function") {
            const cloudDeletedIds = await window.FirebaseService.getDeletedLoanIds();
            if (Array.isArray(cloudDeletedIds) && cloudDeletedIds.length > 0) {
                if (!state.deletedLoanIds) state.deletedLoanIds = [];
                cloudDeletedIds.forEach(id => {
                    const cleanId = String(id).trim();
                    if (cleanId && !state.deletedLoanIds.includes(cleanId)) {
                        state.deletedLoanIds.push(cleanId);
                    }
                });
            }
        }

        // 8. Sync Loans
        const fbLoans = await window.FirebaseService.getLoans();
        const deletedSet = new Set(state.deletedLoanIds || []);

        if (Array.isArray(fbLoans)) {
            const validFbLoans = fbLoans.filter(cl => {
                const id = String(cl.id || cl.loanId || "").trim();
                return id && !deletedSet.has(id);
            });

            const mergedLoans = [];
            const seen = new Set();

            validFbLoans.forEach(cl => {
                const id = String(cl.id || cl.loanId).trim();
                seen.add(id);
                const local = (state.loans || []).find(x => String(x.id || x.loanId).trim() === id);
                if (local) {
                    mergedLoans.push({ ...local, ...cl, id: id, loanId: id });
                } else {
                    mergedLoans.push({ ...cl, id: id, loanId: id });
                }
            });

            // Retain and upload only recently created offline loans
            (state.loans || []).forEach(localLoan => {
                const id = String(localLoan.id || localLoan.loanId || "").trim();
                if (id && !seen.has(id) && !deletedSet.has(id)) {
                    const createdTime = localLoan.createdAt ? new Date(localLoan.createdAt).getTime() : 0;
                    const isRecent = createdTime > 0 && (Date.now() - createdTime < 3600000);
                    if (isRecent) {
                        mergedLoans.unshift(localLoan);
                        seen.add(id);
                        window.FirebaseService.saveLoan(localLoan).catch(() => {});
                    }
                }
            });

            state.loans = mergedLoans;
        }

        saveState();
        updateHeaderGoldRate();
        renderDashboard();
        renderRegisterTable();
        if (typeof renderReportsTable === "function") renderReportsTable();

        if (syncText) syncText.textContent = "Cloud Live";
        if (syncDot) syncDot.style.background = "#22c55e";

        if (isManual) {
            const currentR = getActiveGoldRate22K();
            showToast(`✅ Cloud Synced: All Masters & Loans Live across PCs`);
        }
    } catch (e) {
        console.warn("[CloudSync] Background sync check notice:", e);
        if (syncText) syncText.textContent = "Offline/Retrying";
        if (syncDot) syncDot.style.background = "#f59e0b";
        if (isManual) {
            showToast("⚠️ Cloud Sync Notice: Checking connection...");
        }
    } finally {
        if (spinIcon) spinIcon.classList.remove("fa-spin");
    }
}

// ==================== GLOBAL UPPERCASE & ENGLISH ENFORCER ====================
function initGlobalUppercaseEnforcer() {
    // Intercept all typing / input in text fields and textareas
    document.addEventListener("input", (e) => {
        const el = e.target;
        if (!el) return;

        const tagName = el.tagName ? el.tagName.toLowerCase() : "";
        const inputType = el.type ? el.type.toLowerCase() : "";
        const id = (el.id || "").toLowerCase();
        const name = (el.name || "").toLowerCase();

        // STRICTLY EXCLUDE password inputs, date, number, file, checkbox, radio, and any field with 'pass' in id/name/class
        if (inputType === "password" || id.includes("pass") || name.includes("pass") || el.classList.contains("normal-case")) {
            return;
        }

        // Apply to text, search, and textarea inputs (exclude password, date, number, file, checkbox, radio)
        if (tagName === "textarea" || (tagName === "input" && (inputType === "text" || inputType === "search" || !inputType))) {
            const origVal = el.value;
            if (!origVal) return;

            // Remove Gujarati unicode characters (\u0A80-\u0AFF) and convert to uppercase English
            const cleanedVal = origVal.replace(/[\u0A80-\u0AFF]/g, "").toUpperCase();

            if (origVal !== cleanedVal) {
                const start = el.selectionStart;
                const end = el.selectionEnd;
                el.value = cleanedVal;
                if (start !== null && end !== null) {
                    try {
                        el.setSelectionRange(start, end);
                    } catch (err) {}
                }
            }
        }
    });

    // Also block keypress of Gujarati characters directly (exclude password inputs)
    document.addEventListener("keypress", (e) => {
        const el = e.target;
        if (!el) return;
        const tagName = el.tagName ? el.tagName.toLowerCase() : "";
        const inputType = el.type ? el.type.toLowerCase() : "";
        const id = (el.id || "").toLowerCase();
        const name = (el.name || "").toLowerCase();

        if (inputType === "password" || id.includes("pass") || name.includes("pass") || el.classList.contains("normal-case")) {
            return;
        }

        if (tagName === "textarea" || (tagName === "input" && (inputType === "text" || inputType === "search" || !inputType))) {
            const char = e.key;
            if (/[\u0A80-\u0AFF]/.test(char)) {
                e.preventDefault();
            }
        }
    });
}

// Live Clock
function initClock() {
    function tick() {
        const now = new Date();
        const dateEl = document.getElementById("header-date");
        const timeEl = document.getElementById("header-time");
        if (dateEl) dateEl.textContent = formatDateDMY(now);
        if (timeEl) timeEl.textContent = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    }
    tick();
    setInterval(tick, 1000);
}

// ==================== AUTHENTICATION ====================
function populateLoginBranches() {
    const loginBranchSelect = document.getElementById("login-branch");
    if (loginBranchSelect && state.branches) {
        const curVal = loginBranchSelect.value;
        loginBranchSelect.innerHTML = "";
        state.branches.forEach(b => {
            const opt = document.createElement("option");
            opt.value = b.code;
            opt.textContent = b.name;
            loginBranchSelect.appendChild(opt);
        });
        if (curVal) loginBranchSelect.value = curVal;
    }
}

function initAuth() {
    const loginForm = document.getElementById("login-form");
    const togglePassBtn = document.getElementById("toggle-password-btn");
    const logoutBtn = document.getElementById("logout-btn");

    populateLoginBranches();

    if (togglePassBtn) {
        togglePassBtn.addEventListener("click", () => {
            const passInput = document.getElementById("login-password");
            if (passInput) {
                const isPass = passInput.type === "password";
                passInput.type = isPass ? "text" : "password";
                togglePassBtn.innerHTML = isPass ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const branchCode = document.getElementById("login-branch").value;
            const password = document.getElementById("login-password").value.trim();
            const errorAlert = document.getElementById("login-error");

            const branchObj = state.branches.find(b => b.code === branchCode) || { code: branchCode, name: branchCode + " BRANCH", isHO: (branchCode === "99") };
            const expectedPass = branchObj.password || (branchCode === "99" ? "Rahul#80810" : "Admin@123");
            const isValid = (password === expectedPass);

            if (isValid) {
                state.currentSession = branchObj;
                setActiveSession(branchObj);
                saveState();
                if (errorAlert) errorAlert.classList.add("hidden");
                document.getElementById("login-password").value = "";

                // Reset any previous terminated flag and generate a fresh session ID for this login
                const freshSessionId = `DEV_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
                localStorage.removeItem("jccb_device_terminated");
                localStorage.setItem("jccb_device_session_id", freshSessionId);
                localStorage.setItem("jccb_session_login_time", new Date().toISOString());

                // Check if branch password is default / requires mandatory first-time password change
                const isDefaultPass = (branchCode !== "99") && (
                    password === "Admin@123" ||
                    branchObj.password === "Admin@123" ||
                    branchObj.isDefaultPassword === true ||
                    !branchObj.passwordChanged
                );

                if (isDefaultPass) {
                    promptMandatoryPasswordChange(branchObj);
                    return;
                }

                showApp();
                showToast(`સ્વાગત છે! ${branchObj.name} લૉગઇન સફળ.`);

                // Log audit event and start killswitch listener & heartbeat
                if (window.FirebaseService) {
                    if (typeof window.FirebaseService.logAuditEvent === "function") {
                        window.FirebaseService.logAuditEvent("LOGIN", `User logged into ${branchObj.name} (${branchObj.code})`, {
                            branchCode: branchObj.code,
                            branchName: branchObj.name,
                            operator: branchObj.name
                        });
                    }
                    if (typeof window.FirebaseService.updateDeviceHeartbeat === "function") {
                        window.FirebaseService.updateDeviceHeartbeat({
                            branchCode: branchObj.code,
                            branchName: branchObj.name,
                            operator: branchObj.name
                        });
                    }
                    setupDeviceKillswitchListener();
                }
            } else {
                if (errorAlert) {
                    errorAlert.classList.remove("hidden");
                    errorAlert.textContent = "ખોટો પાસવર્ડ! કૃપા કરીને સાચો પાસવર્ડ દાખલ કરો (Incorrect Password).";
                }
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            if (confirm("Are you sure you want to log out? (શું તમે ખરેખર લૉગઆઉટ કરવા માંગો છો?)")) {
                if (window.FirebaseService && typeof window.FirebaseService.logAuditEvent === "function") {
                    window.FirebaseService.logAuditEvent("LOGOUT", `User logged out from ${state.currentSession ? state.currentSession.name : 'Session'}`, {
                        branchCode: state.currentSession ? state.currentSession.code : '99'
                    });
                }
                const currentSid = localStorage.getItem("jccb_device_session_id");
                if (currentSid && window.FirebaseService && typeof window.FirebaseService.deleteActiveSession === "function") {
                    try { await window.FirebaseService.deleteActiveSession(currentSid); } catch(e){}
                }
                if (state.gdrive && state.gdrive.connected && state.gdrive.syncOnLogout !== false) {
                    try {
                        showToast("Google Drive માં બેકઅપ સિંક થઈ રહ્યો છે...");
                        await syncAllBackupsToGoogleDrive(true);
                    } catch (e) {
                        console.warn("Logout sync warning:", e);
                    }
                }
                state.currentSession = null;
                setActiveSession(null);
                saveState();
                showLogin();
                showToast("સફળતાપૂર્વક લૉગઆઉટ થઈ ગયું છે.");
            }
        });
    }

    // Continuous 30-second live device presence heartbeat
    setInterval(async () => {
        if (state.currentSession && window.FirebaseService && typeof window.FirebaseService.updateDeviceHeartbeat === "function") {
            const res = await window.FirebaseService.updateDeviceHeartbeat({
                branchCode: state.currentSession.code,
                branchName: state.currentSession.name,
                operator: state.currentSession.name
            });
            if (res && res.terminated) {
                triggerRemoteForceDisconnect();
            }
        }
    }, 30000);

    if (state.currentSession) {
        const curBranch = state.currentSession;
        const isDefaultPass = (curBranch.code !== "99") && (
            curBranch.password === "Admin@123" ||
            curBranch.isDefaultPassword === true ||
            !curBranch.passwordChanged
        );
        if (isDefaultPass) {
            promptMandatoryPasswordChange(curBranch);
        } else {
            showApp();
            if (window.FirebaseService && typeof window.FirebaseService.updateDeviceHeartbeat === "function") {
                window.FirebaseService.updateDeviceHeartbeat({
                    branchCode: curBranch.code,
                    branchName: curBranch.name,
                    operator: curBranch.name
                }).then(res => {
                    if (res && res.terminated) {
                        triggerRemoteForceDisconnect();
                    } else {
                        setupDeviceKillswitchListener();
                    }
                });
            }
        }
    } else {
        showLogin();
    }
}

function promptMandatoryPasswordChange(branchObj) {
    const modal = document.getElementById("mandatory-password-modal");
    const label = document.getElementById("mandatory-branch-name-label");
    const currPassInp = document.getElementById("mandatory-current-pass");
    const newPassInp = document.getElementById("mandatory-new-pass");
    const confPassInp = document.getElementById("mandatory-confirm-pass");
    const errBox = document.getElementById("mandatory-password-error");
    const errText = document.getElementById("mandatory-error-text");

    if (label) label.textContent = `શાખા: ${branchObj.name} (${branchObj.code})`;
    if (currPassInp) currPassInp.value = "";
    if (newPassInp) newPassInp.value = "";
    if (confPassInp) confPassInp.value = "";
    if (errBox) {
        errBox.classList.add("hidden");
        errBox.style.display = "none";
    }

    if (modal) {
        modal.classList.remove("hidden");
        modal.style.display = "flex";
    }

    const appContainer = document.getElementById("app-container");
    if (appContainer) {
        appContainer.classList.add("hidden");
        appContainer.style.display = "none";
    }
    const loginContainer = document.getElementById("login-container");
    if (loginContainer) {
        loginContainer.classList.add("hidden");
        loginContainer.style.display = "none";
    }
}

function initMandatoryPasswordModal() {
    const form = document.getElementById("mandatory-password-form");
    const logoutBtn = document.getElementById("btn-mandatory-logout");
    const errBox = document.getElementById("mandatory-password-error");
    const errText = document.getElementById("mandatory-error-text");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            const modal = document.getElementById("mandatory-password-modal");
            if (modal) {
                modal.classList.add("hidden");
                modal.style.display = "none";
            }
            state.currentSession = null;
            setActiveSession(null);
            saveState();
            showLogin();
        });
    }

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const currPass = document.getElementById("mandatory-current-pass").value.trim();
            const newPass = document.getElementById("mandatory-new-pass").value.trim();
            const confPass = document.getElementById("mandatory-confirm-pass").value.trim();

            const curBranch = state.currentSession;
            if (!curBranch) {
                showLogin();
                return;
            }

            const expectedPass = curBranch.password || "Admin@123";
            if (currPass !== expectedPass) {
                if (errBox && errText) {
                    errBox.classList.remove("hidden");
                    errBox.style.display = "block";
                    errText.textContent = "વર્તમાન ડિફોલ્ટ પાસવર્ડ ખોટો છે! (Incorrect current password)";
                }
                return;
            }

            if (newPass === "Admin@123" || newPass.toLowerCase() === "admin") {
                if (errBox && errText) {
                    errBox.classList.remove("hidden");
                    errBox.style.display = "block";
                    errText.textContent = "નવો પાસવર્ડ 'Admin@123' ન હોઈ શકે. કૃપા કરીને તમારો પોતાનો સુરક્ષિત પાસવર્ડ બનાવો.";
                }
                return;
            }

            if (newPass.length < 6) {
                if (errBox && errText) {
                    errBox.classList.remove("hidden");
                    errBox.style.display = "block";
                    errText.textContent = "પાસવર્ડ ઓછામાં ઓછો ૬ અક્ષરનો હોવો જરૂરી છે (Min 6 characters required).";
                }
                return;
            }

            if (newPass !== confPass) {
                if (errBox && errText) {
                    errBox.classList.remove("hidden");
                    errBox.style.display = "block";
                    errText.textContent = "નવા પાસવર્ડ અને કન્ફર્મ પાસવર્ડ મેળ ખાતા નથી (Passwords do not match).";
                }
                return;
            }

            // Update Branch Password in State & DB
            curBranch.password = newPass;
            curBranch.isDefaultPassword = false;
            curBranch.passwordChanged = true;
            curBranch.passwordChangedAt = new Date().toISOString();

            const idx = state.branches.findIndex(b => b.code === curBranch.code);
            if (idx !== -1) {
                state.branches[idx].password = newPass;
                state.branches[idx].isDefaultPassword = false;
                state.branches[idx].passwordChanged = true;
                state.branches[idx].passwordChangedAt = new Date().toISOString();
            }

            saveState();

            // Cloud Firestore Sync (Update branch record and branch list)
            if (window.FirebaseService) {
                if (typeof window.FirebaseService.saveBranch === "function") {
                    window.FirebaseService.saveBranch({
                        branchCode: curBranch.code,
                        branchName: curBranch.name,
                        password: newPass,
                        isDefaultPassword: false,
                        passwordChanged: true,
                        passwordChangedAt: new Date().toISOString(),
                        isHeadOffice: (curBranch.code === "99"),
                        isActive: true
                    }).catch(e => console.warn("Cloud branch password save warning:", e));
                }
                if (typeof window.FirebaseService.saveBranchesList === "function") {
                    window.FirebaseService.saveBranchesList(state.branches).catch(e => console.warn("Cloud branches master sync warning:", e));
                }
                if (typeof window.FirebaseService.logAuditEvent === "function") {
                    window.FirebaseService.logAuditEvent("MANDATORY_PASSWORD_CHANGED", `Branch ${curBranch.name} (${curBranch.code}) successfully changed password from default`, {
                        branchCode: curBranch.code,
                        branchName: curBranch.name,
                        operator: curBranch.name
                    });
                }
                if (typeof window.FirebaseService.updateDeviceHeartbeat === "function") {
                    window.FirebaseService.updateDeviceHeartbeat({
                        branchCode: curBranch.code,
                        branchName: curBranch.name,
                        operator: curBranch.name
                    });
                }
                setupDeviceKillswitchListener();
            }

            const modal = document.getElementById("mandatory-password-modal");
            if (modal) {
                modal.classList.add("hidden");
                modal.style.display = "none";
            }

            showApp();
            showToast(`સફળ! ${curBranch.name} નો નવો પાસવર્ડ સફળતાપૂર્વક સેટ થઈ ગયો છે.`);
            alert(`સૂચના: ${curBranch.name} નો નવો પાસવર્ડ સેટ થઈ ગયો છે.\nહવેથી આ શાખામાં ફક્ત તમારા આ નવા પાસવર્ડથી જ લૉગઇન થઈ શકશે.\nપાસવર્ડ ભૂલી ગયા હોવ તો હેડ ઓફિસ (Head Office) નો સંપર્ક કરવો.`);
        });
    }
}

let activeKillswitchUnsubscribe = null;

function setupDeviceKillswitchListener() {
    if (activeKillswitchUnsubscribe) {
        try { activeKillswitchUnsubscribe(); } catch (e) {}
        activeKillswitchUnsubscribe = null;
    }
    const sessionId = localStorage.getItem("jccb_device_session_id");
    if (!sessionId || !window.FirebaseService || typeof window.FirebaseService.listenSessionKillswitch !== "function") return;

    activeKillswitchUnsubscribe = window.FirebaseService.listenSessionKillswitch(sessionId, (data) => {
        if (data && (data.terminated === true || data.status === "terminated" || data.isOnline === false)) {
            triggerRemoteForceDisconnect();
        }
    });
}

function triggerRemoteForceDisconnect() {
    if (!state.currentSession) return;
    const branchName = state.currentSession ? state.currentSession.name : "Branch";

    if (activeKillswitchUnsubscribe) {
        try { activeKillswitchUnsubscribe(); } catch (e) {}
        activeKillswitchUnsubscribe = null;
    }
    const sid = localStorage.getItem("jccb_device_session_id");
    if (sid) localStorage.setItem("jccb_device_terminated", sid);

    state.currentSession = null;
    setActiveSession(null);
    saveState();
    showLogin();

    const errorAlert = document.getElementById("login-error-alert");
    if (errorAlert) {
        errorAlert.classList.remove("hidden");
        errorAlert.innerHTML = `<strong><i class="fa-solid fa-ban"></i> સેશન ડિસ્કનેક્ટ:</strong> તમારું શાખા સેશન (${branchName}) કેન્દ્રીય એડમિનિસ્ટ્રેટર / મેનેજમેન્ટ પોર્ટલ દ્વારા ડિસ્કનેક્ટ કરવામાં આવ્યું છે (Session Disconnected by Administrator).`;
    }
    alert(`સૂચના: તમારું શાખા સેશન (${branchName}) કેન્દ્રીય મેનેજમેન્ટ પોર્ટલ દ્વારા ડિસ્કનેક્ટ કરવામાં આવ્યું છે.\n(Your session was disconnected by the Central Administrator).`);
}

function showLogin() {
    const loginContainer = document.getElementById("login-container");
    const appContainer = document.getElementById("app-container");
    if (loginContainer) {
        loginContainer.classList.remove("hidden");
        loginContainer.style.display = "flex";
    }
    if (appContainer) {
        appContainer.classList.add("hidden");
        appContainer.style.display = "none";
    }
    populateLoginBranches();
    const errorAlert = document.getElementById("login-error");
    if (errorAlert) errorAlert.classList.add("hidden");
    const passInput = document.getElementById("login-password");
    if (passInput) {
        passInput.value = "";
        setTimeout(() => passInput.focus(), 150);
    }
}

function showApp() {
    const loginContainer = document.getElementById("login-container");
    const appContainer = document.getElementById("app-container");
    if (loginContainer) {
        loginContainer.classList.add("hidden");
        loginContainer.style.display = "none";
    }
    if (appContainer) {
        appContainer.classList.remove("hidden");
        appContainer.style.display = "flex";
    }

    const userBranchSpan = document.getElementById("current-user-branch");
    const welcomeBranchSpan = document.getElementById("welcome-branch-name");
    if (userBranchSpan && state.currentSession) userBranchSpan.textContent = state.currentSession.name;
    if (welcomeBranchSpan && state.currentSession) welcomeBranchSpan.textContent = state.currentSession.name;

    updateBranchContextUI();
    renderDashboard();
    renderRegisterTable();
    initReports();
    renderReportsTable();
    renderValuers();
    renderGoldRateMaster();
    renderBranchMaster();
    renderProductMaster();
    renderRulesMaster();
    renderCustomerMasterList();
    renderBranchSettings();
    updateHeaderGoldRate();
}

function updateBranchContextUI() {
    const isHO = isHeadOfficeSession();
    const userRole = getUserRole();
    const userBranch = state.currentSession ? state.currentSession.code : "99";
    const userBranchName = state.currentSession ? state.currentSession.name : "99 HEAD OFFICE";

    // 0. Update Role Badges in Sidebar and Dashboard Header
    const roleDef = ROLE_DEFINITIONS[userRole] || ROLE_DEFINITIONS[ROLES.BRANCH_MANAGER];
    const userRoleBadge = document.getElementById("current-user-role-badge");
    const welcomeRoleBadge = document.getElementById("welcome-user-role-badge");
    if (userRoleBadge) {
        userRoleBadge.className = `badge ${roleDef.badgeClass}`;
        userRoleBadge.innerHTML = `<i class="fa-solid ${roleDef.icon}"></i> ${roleDef.title}`;
    }
    if (welcomeRoleBadge) {
        welcomeRoleBadge.className = `badge ${roleDef.badgeClass}`;
        welcomeRoleBadge.innerHTML = `<i class="fa-solid ${roleDef.icon}"></i> ${roleDef.title}`;
    }

    // 1. Loan Branch Select in Loan Entry Sheet (Strict single option and locked for branch)
    const branchSelect = document.getElementById("loan-branch");
    if (branchSelect) {
        branchSelect.innerHTML = "";
        if (isHO) {
            branchSelect.disabled = false;
            branchSelect.style.pointerEvents = "auto";
            branchSelect.style.backgroundColor = "";
            branchSelect.style.cursor = "default";
            (state.branches || []).forEach(b => {
                const opt = document.createElement("option");
                opt.value = b.code;
                opt.textContent = b.name;
                branchSelect.appendChild(opt);
            });
            if (!branchSelect.value) branchSelect.value = "99";
        } else {
            // ONLY the logged-in branch option is present in the list, completely excluding all other branches
            const opt = document.createElement("option");
            opt.value = String(userBranch);
            opt.textContent = String(userBranchName);
            branchSelect.appendChild(opt);
            branchSelect.value = String(userBranch);
            branchSelect.disabled = true; // Fixed and locked to logged-in branch
            branchSelect.style.pointerEvents = "none";
            branchSelect.style.backgroundColor = "#f1f5f9";
            branchSelect.style.cursor = "not-allowed";
        }
    }

    // 1.5 Proposal No, Account No, Packet No: Editable for Head Office with live sync, locked for branch terminals
    const proposalNoInp = document.getElementById("unique-proposal-no");
    const packetNoInp = document.getElementById("packet-no");
    const accountNoInp = document.getElementById("loan-ac-no");

    if (proposalNoInp) {
        if (isHO) {
            proposalNoInp.removeAttribute("readonly");
            proposalNoInp.readOnly = false;
            proposalNoInp.style.backgroundColor = "#ffffff";
            proposalNoInp.style.cursor = "text";
            proposalNoInp.style.border = "1.5px solid var(--primary)";
            proposalNoInp.title = "Head Office Privilege: Editable Proposal Number";
            if (!proposalNoInp.dataset.boundUserEdit) {
                proposalNoInp.dataset.boundUserEdit = "true";
                proposalNoInp.addEventListener("input", () => {
                    proposalNoInp.dataset.userEdited = "true";
                });
            }
        } else {
            proposalNoInp.setAttribute("readonly", "true");
            proposalNoInp.readOnly = true;
            proposalNoInp.style.backgroundColor = "#f8fafc";
            proposalNoInp.style.cursor = "not-allowed";
            proposalNoInp.style.border = "1px solid var(--border-color)";
            proposalNoInp.title = "Auto-calculated for branch";
            delete proposalNoInp.dataset.userEdited;
        }
    }

    if (packetNoInp) {
        if (isHO) {
            packetNoInp.removeAttribute("readonly");
            packetNoInp.readOnly = false;
            packetNoInp.style.backgroundColor = "#ffffff";
            packetNoInp.style.cursor = "text";
            packetNoInp.style.border = "1.5px solid var(--primary)";
            packetNoInp.title = "Head Office Privilege: Editable Gold Packet Number";
            if (!packetNoInp.dataset.boundUserEdit) {
                packetNoInp.dataset.boundUserEdit = "true";
                packetNoInp.addEventListener("input", () => {
                    packetNoInp.dataset.userEdited = "true";
                });
            }
        } else {
            packetNoInp.setAttribute("readonly", "true");
            packetNoInp.readOnly = true;
            packetNoInp.style.backgroundColor = "#f8fafc";
            packetNoInp.style.cursor = "not-allowed";
            packetNoInp.style.border = "1px solid var(--border-color)";
            packetNoInp.title = "Auto-calculated for branch";
            delete packetNoInp.dataset.userEdited;
        }
    }

    if (accountNoInp) {
        if (isHO) {
            accountNoInp.removeAttribute("readonly");
            accountNoInp.readOnly = false;
            accountNoInp.style.backgroundColor = "#ffffff";
            accountNoInp.style.cursor = "text";
            accountNoInp.style.border = "1.5px solid var(--primary)";
            accountNoInp.title = "Head Office Privilege: Editable Loan Account Number";
            if (!accountNoInp.dataset.boundUserEdit) {
                accountNoInp.dataset.boundUserEdit = "true";
                accountNoInp.addEventListener("input", () => {
                    accountNoInp.dataset.userEdited = "true";
                });
            }
        } else {
            accountNoInp.setAttribute("readonly", "true");
            accountNoInp.readOnly = true;
            accountNoInp.style.backgroundColor = "#f8fafc";
            accountNoInp.style.cursor = "not-allowed";
            accountNoInp.style.border = "1px solid var(--border-color)";
            accountNoInp.title = "Auto-calculated for branch";
            delete accountNoInp.dataset.userEdited;
        }
    }

    // Auto-generate proposal & packet seeds for active branch
    generateNextProposalNo(userBranch);
    generateNextPacketNo(userBranch);
    if (typeof updateLoanAmountLogic === "function") updateLoanAmountLogic();

    // 2. Hide / Show Sidebar Navigation Items based on Branch vs Head Office role
    const branchMasterNav = document.getElementById("branch-master-nav");
    const valuerMasterNav = document.getElementById("valuer-master-nav");
    const customerMasterNav = document.getElementById("customer-master-nav");
    const goldRateMasterNav = document.getElementById("gold-rate-master-nav");
    const productMasterNav = document.getElementById("product-master-nav");
    const rulesMasterNav = document.getElementById("rules-master-nav");
    const backupRestoreNav = document.getElementById("backup-restore-nav");
    const settingsNav = document.getElementById("settings-nav");
    const configNavDivider = document.getElementById("config-nav-divider");

    // Strictly show Customer Master, Daily Gold Rate, and Account Settings for Branch users
    if (customerMasterNav) customerMasterNav.classList.remove("hidden");
    if (goldRateMasterNav) goldRateMasterNav.classList.remove("hidden");
    if (branchMasterNav) branchMasterNav.classList.toggle("hidden", !isHO);
    if (valuerMasterNav) valuerMasterNav.classList.toggle("hidden", !isHO);
    if (productMasterNav) productMasterNav.classList.toggle("hidden", !isHO);
    if (rulesMasterNav) rulesMasterNav.classList.toggle("hidden", !isHO);
    if (backupRestoreNav) backupRestoreNav.classList.toggle("hidden", !isHO);
    if (settingsNav) settingsNav.classList.remove("hidden");
    if (configNavDivider) configNavDivider.classList.remove("hidden");

    // 3. Daily Gold Rate Master: View-Only for Branch, Editable for Head Office
    const goldRateFormCard = document.querySelector("#gold-rate-master-view .master-form-card");
    const goldRateSaveBtn = document.getElementById("btn-save-gold-rate-master");
    const goldRateDateInput = document.getElementById("m-gold-rate-date");
    const goldRateValInput = document.getElementById("m-gold-rate-val");

    let branchNotice = document.getElementById("gold-rate-branch-notice");
    if (!branchNotice && goldRateFormCard) {
        branchNotice = document.createElement("div");
        branchNotice.id = "gold-rate-branch-notice";
        branchNotice.style.cssText = "background:#fffbeb; color:#92400e; padding:10px 12px; border-radius:6px; font-size:12px; margin-bottom:12px; border:1px solid #fde68a;";
        branchNotice.innerHTML = `<i class="fa-solid fa-lock text-gold"></i> <strong>Read-Only Mode:</strong> દૈનિક ગોલ્ડ રેટ ફક્ત હેડ ઓફિસ (Head Office) દ્વારા જ સેટ અથવા અપડેટ કરી શકાય છે. શાખા અહીં માત્ર રેટ હિસ્ટ્રી જોઈ શકે છે.`;
        const formEl = goldRateFormCard.querySelector("form");
        if (formEl) goldRateFormCard.insertBefore(branchNotice, formEl);
        else goldRateFormCard.appendChild(branchNotice);
    }

    if (branchNotice) {
        branchNotice.classList.toggle("hidden", isHO);
    }
    if (goldRateSaveBtn) {
        goldRateSaveBtn.disabled = !isHO;
        goldRateSaveBtn.style.opacity = isHO ? "1" : "0.5";
        goldRateSaveBtn.style.cursor = isHO ? "pointer" : "not-allowed";
        if (!isHO) goldRateSaveBtn.title = "Only Head Office can update gold rates";
    }
    if (goldRateDateInput) {
        goldRateDateInput.disabled = !isHO;
        goldRateDateInput.style.color = "#000000";
        goldRateDateInput.style.backgroundColor = isHO ? "#ffffff" : "#f1f5f9";
    }
    if (goldRateValInput) {
        goldRateValInput.disabled = !isHO;
        goldRateValInput.style.color = "#000000";
        goldRateValInput.style.backgroundColor = isHO ? "#ffffff" : "#f1f5f9";
    }

    // 4. Dashboard Gold Rate Lock for Branch users
    const dashGoldRateInput = document.getElementById("dashboard-gold-rate");
    const dashSaveRateBtn = document.getElementById("save-gold-rate-btn");
    const dashRateLockBadge = document.getElementById("dashboard-gold-rate-lock-badge");
    const dashRateNote = document.getElementById("dashboard-rate-note");

    if (dashGoldRateInput) {
        dashGoldRateInput.disabled = !isHO;
        dashGoldRateInput.readOnly = !isHO;
        dashGoldRateInput.style.color = "#000000";
        dashGoldRateInput.style.backgroundColor = isHO ? "#ffffff" : "#f1f5f9";
        dashGoldRateInput.style.cursor = isHO ? "text" : "not-allowed";
    }
    if (dashSaveRateBtn) {
        dashSaveRateBtn.style.display = isHO ? "inline-flex" : "none";
        dashSaveRateBtn.disabled = !isHO;
    }
    if (dashRateLockBadge) {
        dashRateLockBadge.classList.toggle("hidden", isHO);
    }
    if (dashRateNote) {
        dashRateNote.textContent = isHO 
            ? "* Head Office: ૨૨ કેરેટ સોનાનો આજનો ભાવ દાખલ કરો અથવા સુધારો કરો." 
            : "* દૈનિક રેટ ફક્ત હેડ ઓફિસ દ્વારા જ સેટ/અપડેટ કરી શકાય છે (Branch Read-Only)";
    }

    // 5. Loan Entry Gold Rate Lock for Branch users
    const valGoldRateInput = document.getElementById("val-gold-rate-input");
    if (valGoldRateInput) {
        valGoldRateInput.disabled = !isHO;
        valGoldRateInput.readOnly = !isHO;
        valGoldRateInput.style.backgroundColor = isHO ? "#ffffff" : "#fefcf0";
        valGoldRateInput.style.cursor = isHO ? "text" : "not-allowed";
        if (!isHO) {
            valGoldRateInput.title = "Gold rate is locked by Head Office";
        } else {
            valGoldRateInput.title = "";
        }
    }

    // 6. Dashboard Shortcut Cards Visibility
    document.querySelectorAll(".shortcut-btn").forEach(btn => {
        const tab = btn.getAttribute("data-go-tab");
        if (tab === "branch-master-view" || tab === "valuer-master-view" || tab === "product-master-view" || tab === "rules-master-view" || tab === "backup-restore-view") {
            btn.style.display = isHO ? "" : "none";
        }
    });

    // 7. Account Settings: lock branch selection to branch for Branch user
    const settingsBranchSelect = document.getElementById("settings-branch-select");
    if (settingsBranchSelect) {
        if (!isHO) {
            settingsBranchSelect.innerHTML = `<option value="${userBranch}">${userBranch} ${userBranchName}</option>`;
            settingsBranchSelect.value = userBranch;
            settingsBranchSelect.disabled = true;
            settingsBranchSelect.style.backgroundColor = "#f1f5f9";
            settingsBranchSelect.style.cursor = "not-allowed";
        } else {
            settingsBranchSelect.disabled = false;
            settingsBranchSelect.style.backgroundColor = "";
            settingsBranchSelect.style.cursor = "default";
        }
    }

    // Hide Factory Reset for non-HO users
    const factoryResetCard = document.getElementById("settings-factory-reset-card") || (document.getElementById("reset-system-data-btn") ? document.getElementById("reset-system-data-btn").closest(".card") : null);
    if (factoryResetCard) {
        factoryResetCard.style.display = isHO ? "" : "none";
    }

    // 8. Register Filter Branch lock
    const filterBranchEl = document.getElementById("filter-branch");
    if (filterBranchEl) {
        if (!isHO) {
            filterBranchEl.innerHTML = `<option value="${userBranch}">${userBranchName}</option>`;
            filterBranchEl.value = userBranch;
            filterBranchEl.disabled = true;
        } else {
            filterBranchEl.disabled = false;
        }
    }

    // 9. Reports Filter Branch lock
    const repBranchSelect = document.getElementById("report-filter-branch");
    if (repBranchSelect) {
        if (!isHO) {
            repBranchSelect.innerHTML = `<option value="${userBranch}">${userBranchName}</option>`;
            repBranchSelect.value = userBranch;
            repBranchSelect.disabled = true;
        } else {
            repBranchSelect.disabled = false;
            if (repBranchSelect.options.length <= 1) {
                const curVal = repBranchSelect.value;
                repBranchSelect.innerHTML = '<option value="">-- All Branches --</option>';
                (state.branches || []).forEach(b => {
                    const opt = document.createElement("option");
                    opt.value = b.code;
                    opt.textContent = b.name;
                    repBranchSelect.appendChild(opt);
                });
                if (curVal) repBranchSelect.value = curVal;
            }
        }
    }

    // 10. Voucher Filter Branch lock
    const voucherBranchSelect = document.getElementById("voucher-branch-select");
    if (voucherBranchSelect) {
        if (!isHO) {
            voucherBranchSelect.innerHTML = `<option value="${userBranch}">${userBranchName}</option>`;
            voucherBranchSelect.value = userBranch;
            voucherBranchSelect.disabled = true;
        } else {
            voucherBranchSelect.disabled = false;
        }
    }
}

// ==================== NAVIGATION ====================
function initNavigation() {
    const navButtons = document.querySelectorAll(".sidebar-nav .nav-item");
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-tab");
            if (!targetId) return;

            const isHO = isHeadOfficeSession();
            const restrictedTabs = ["branch-master-view", "valuer-master-view", "product-master-view", "rules-master-view", "backup-restore-view"];
            if (!isHO && restrictedTabs.includes(targetId)) {
                alert("આ સેક્શન ફક્ત હેડ ઓફિસ (Head Office) માટે ઉપલબ્ધ છે.");
                return;
            }

            document.querySelectorAll(".tab-content").forEach(tab => tab.classList.add("hidden"));
            document.querySelectorAll(".sidebar-nav .nav-item").forEach(b => b.classList.remove("active"));

            btn.classList.add("active");
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.remove("hidden");

            if (targetId === "dashboard-view") renderDashboard();
            if (targetId === "register-view") renderRegisterTable();
            if (targetId === "customer-master-view") renderCustomerMasterList();
            if (targetId === "valuer-master-view" && isHO) renderValuers();
            if (targetId === "gold-rate-master-view") renderGoldRateMaster();
            if (targetId === "branch-master-view" && isHO) renderBranchMaster();
            if (targetId === "product-master-view" && isHO) renderProductMaster();
            if (targetId === "rules-master-view" && isHO) renderRulesMaster();
            if (targetId === "backup-restore-view" && isHO) updateBackupStats();
            if (targetId === "daily-vouchers-view") initDailyVouchers();
            if (targetId === "reports-view") {
                initReports();
                renderReportsTable();
            }
            if (targetId === "settings-view") renderBranchSettings();
            if (targetId === "entry-view") {
                updateBranchContextUI();
                const b = document.getElementById("loan-branch") ? document.getElementById("loan-branch").value : (state.currentSession ? state.currentSession.code : "99");
                generateNextProposalNo(b);
                generateNextPacketNo(b);
                updateLoanAmountLogic();
            }
        });
    });

    // Shortcut & Action buttons across dashboard (e.g. View Register, New Loan Entry, etc.)
    document.querySelectorAll(".shortcut-btn, .view-all-register-btn, [data-go-tab]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const targetTab = btn.getAttribute("data-go-tab") || (btn.classList.contains("view-all-register-btn") ? "register-view" : "");
            if (targetTab) {
                const navBtn = document.querySelector(`.sidebar-nav .nav-item[data-tab="${targetTab}"]`);
                if (navBtn) {
                    navBtn.click();
                } else {
                    // Direct tab switch fallback
                    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.add("hidden"));
                    document.querySelectorAll(".sidebar-nav .nav-item").forEach(b => b.classList.remove("active"));
                    const targetEl = document.getElementById(targetTab);
                    if (targetEl) targetEl.classList.remove("hidden");
                    if (targetTab === "register-view" && typeof renderRegisterTable === "function") {
                        renderRegisterTable();
                    }
                }
            }
        });
    });
}

// ==================== DAILY GOLD RATE LOGIC & PERSISTENCE ENGINE ====================
function getTodayDateYMD(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Single authoritative source of truth for the active 22K gold rate
function getActiveGoldRate22K() {
    if (state.goldRates && parseFloat(state.goldRates["22K"]) > 0) {
        return parseFloat(state.goldRates["22K"]);
    }
    if (state.goldRates && parseFloat(state.goldRates["24K"]) > 0) {
        return parseFloat(state.goldRates["24K"]);
    }
    if (state.rateHistory && state.rateHistory.length > 0) {
        const sorted = [...state.rateHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
        if (sorted[0] && (parseFloat(sorted[0].rate22K) > 0 || parseFloat(sorted[0].rate24K) > 0)) {
            return parseFloat(sorted[0].rate22K || sorted[0].rate24K);
        }
    }
    return 72000;
}

// 24K rate computed mathematically from 22K
function getActiveGoldRate24K() {
    return Math.round(getActiveGoldRate22K() * (24 / 22));
}

// Validates and carries forward the gold rate across days without EVER resetting to 0 or fluctuating
function checkDailyGoldRateValidity() {
    const todayStr = getTodayDateYMD();
    if (!state.rateHistory) state.rateHistory = [];
    if (!state.goldRates) state.goldRates = { "24K": 0, "22K": 0, rateDate: "", lastUpdated: "" };

    const activeRate22 = getActiveGoldRate22K();
    const activeRate24 = Math.round(activeRate22 * (24 / 22));

    state.goldRates["22K"] = activeRate22;
    state.goldRates["24K"] = activeRate24;
    state.goldRates.rateDate = todayStr;

    // Ensure today has an entry in rateHistory so history is continuous
    const todayRecord = state.rateHistory.find(r => r.date === todayStr);
    if (!todayRecord) {
        state.rateHistory.unshift({
            date: todayStr,
            rate22K: activeRate22,
            rate24K: activeRate24,
            updatedBy: state.goldRates.lockedBy || "HEAD OFFICE"
        });
    } else {
        todayRecord.rate22K = activeRate22;
        todayRecord.rate24K = activeRate24;
    }

    saveState();
    updateHeaderGoldRate();
}

function updateHeaderGoldRate() {
    const headerRateVal = document.getElementById("header-gold-rate-value");
    if (!headerRateVal) return;
    const activeRate22 = getActiveGoldRate22K();
    headerRateVal.textContent = `₹ ${activeRate22.toLocaleString("en-IN")}`;
}

// ==================== GOLD RATE LOCK & HEAD OFFICE PERMISSIONS ====================
function isDailyGoldRateLocked() {
    // For Branch sessions, gold rate is ALWAYS locked and read-only
    if (!isHeadOfficeSession()) return true;
    if (!state.goldRates) return false;
    return !!state.goldRates.isLocked;
}

function getLockRemainingInfo() {
    const isHO = isHeadOfficeSession();
    if (!isHO) {
        return { isLocked: true, text: "🔒 Head Office Locked (ફક્ત હેડ ઓફિસ દ્વારા જ બદલી શકાય)" };
    }
    if (!isDailyGoldRateLocked()) {
        return { isLocked: false, text: "🔓 Unlocked (ભાવ સુધારી શકાય છે)" };
    }
    return {
        isLocked: true,
        text: `🔒 લૉક કરેલ છે (ભાવ સ્થિર છે)`
    };
}

function lockGoldRateFor24Hours() {
    if (!isHeadOfficeSession()) {
        alert("સોનાનો ભાવ લૉક કરવાનો અધિકાર ફક્ત હેડ ઓફિસ (Head Office) પાસે છે.");
        return false;
    }

    const rate22 = getActiveGoldRate22K();
    if (rate22 <= 0) {
        alert("ભાવ લૉક કરતાં પહેલાં આજનો ૨૨ કેરેટ સોનાનો ભાવ દાખલ કરવો જરૂરી છે.");
        return false;
    }

    const now = new Date();
    if (!state.goldRates) state.goldRates = { "24K": 0, "22K": 0, rateDate: "" };
    state.goldRates.isLocked = true;
    state.goldRates.lockedAt = now.toISOString();
    state.goldRates.lockedBy = state.currentSession ? state.currentSession.name : "HEAD OFFICE";

    saveState();

    // Sync to Cloud Firestore
    if (window.FirebaseService && typeof window.FirebaseService.saveDailyRates === "function") {
        window.FirebaseService.saveDailyRates({
            rate22K: state.goldRates["22K"],
            rate24K: state.goldRates["24K"],
            date: state.goldRates.rateDate || getTodayDateYMD(),
            isLocked: true,
            lockedAt: state.goldRates.lockedAt,
            lockedBy: state.goldRates.lockedBy
        }).catch(e => console.warn("[Firebase] Lock rate sync error:", e));
    }

    updateBranchContextUI();
    renderDashboard();
    renderGoldRateMaster();
    showToast("૨૨ કેરેટ સોનાનો ભાવ સફળતાપૂર્વક લૉક કરવામાં આવ્યો છે.");
    return true;
}

function unlockGoldRate() {
    if (!isHeadOfficeSession()) {
        alert("સોનાનો ભાવ અનલૉક કરવાનો અધિકાર ફક્ત હેડ ઓફિસ (Head Office) પાસે છે.");
        return false;
    }

    if (!confirm("શું તમે સોનાનો ભાવ અનલૉક કરવા માંગો છો જેથી નવો ભાવ દાખલ અથવા સુધારી શકાય?")) {
        return false;
    }

    if (!state.goldRates) state.goldRates = { "24K": 0, "22K": 0, rateDate: "" };
    state.goldRates.isLocked = false;
    state.goldRates.lockedAt = null;

    saveState();

    // Sync to Cloud Firestore
    if (window.FirebaseService && typeof window.FirebaseService.saveDailyRates === "function") {
        window.FirebaseService.saveDailyRates({
            rate22K: state.goldRates["22K"],
            rate24K: state.goldRates["24K"],
            date: state.goldRates.rateDate || getTodayDateYMD(),
            isLocked: false,
            lockedAt: null
        }).catch(e => console.warn("[Firebase] Unlock rate sync error:", e));
    }

    updateBranchContextUI();
    renderDashboard();
    renderGoldRateMaster();
    showToast("સોનાનો ભાવ અનલૉક થયો. હવે નવો ભાવ દાખલ અથવા સુધારી શકાશે.");
    return true;
}

function applyDailyGoldRate(val, targetDate = null, lockData = null) {
    const todayStr = getTodayDateYMD();
    const date = targetDate || todayStr;
    const rate22 = parseFloat(val || 0);

    if (rate22 <= 0 || isNaN(rate22)) {
        return false;
    }

    const rate24 = Math.round(rate22 * (24 / 22));
    
    if (!state.rateHistory) state.rateHistory = [];
    state.rateHistory = state.rateHistory.filter(r => r.date !== date);
    state.rateHistory.unshift({
        date: date,
        rate22K: rate22,
        rate24K: rate24,
        updatedBy: (lockData && lockData.lockedBy) || (state.currentSession ? state.currentSession.name : "HEAD OFFICE")
    });

    if (!state.goldRates) state.goldRates = {};
    state.goldRates["22K"] = rate22;
    state.goldRates["24K"] = rate24;
    state.goldRates.rateDate = todayStr;
    state.goldRates.lastUpdated = new Date().toISOString();

    if (lockData) {
        state.goldRates.isLocked = !!lockData.isLocked;
        state.goldRates.lockedAt = lockData.lockedAt || null;
        state.goldRates.lockedBy = lockData.lockedBy || null;
    }

    // Synchronize rate input fields across all views
    const valRateInput = document.getElementById("val-gold-rate-input");
    if (valRateInput) valRateInput.value = rate22;

    const inlineRateInput = document.getElementById("inline-gold-rate");
    if (inlineRateInput) inlineRateInput.value = "";

    const dashRateInput = document.getElementById("dashboard-gold-rate");
    if (dashRateInput) dashRateInput.value = rate22;

    saveState();
    updateHeaderGoldRate();
    renderDashboard();
    renderGoldRateMaster();
    updateBranchContextUI();
    if (typeof updateOrnamentsTotals === "function") updateOrnamentsTotals();
    if (typeof calculateAllCharges === "function") calculateAllCharges();
    return true;
}

function setDailyGoldRate(val, targetDate = null) {
    if (!isHeadOfficeSession()) {
        alert("દૈનિક સોનાનો ભાવ ફક્ત હેડ ઓફિસ (Head Office) દ્વારા જ દાખલ અથવા સુધારી શકાય છે. શાખા માટે આ ફીલ્ડ લોક છે.");
        return false;
    }

    const todayStr = getTodayDateYMD();
    const date = targetDate || todayStr;
    const rate22 = parseFloat(val || 0);

    if (rate22 <= 0 || isNaN(rate22)) {
        alert("કૃપા કરીને ૨૨ કેરેટ સોનાનો માન્ય ભાવ દાખલ કરો.");
        return false;
    }

    const success = applyDailyGoldRate(rate22, date);
    if (!success) return false;

    const rate24 = Math.round(rate22 * (24 / 22));

    // Sync Daily Rates to Cloud Firestore
    if (window.FirebaseService && typeof window.FirebaseService.saveDailyRates === "function") {
        window.FirebaseService.saveDailyRates({
            date: date,
            rate22K: rate22,
            rate24K: rate24,
            isLocked: true,
            lockedAt: new Date().toISOString(),
            lockedBy: state.currentSession ? state.currentSession.name : "HEAD OFFICE"
        }).then(() => {
            console.log("[Firebase] Daily rate synced to cloud Firestore successfully:", rate22);
        }).catch(e => console.error("[Firebase] Daily rate cloud sync error:", e));

        if (typeof window.FirebaseService.logAuditEvent === "function") {
            window.FirebaseService.logAuditEvent("RATE_UPDATE", `Updated 22K Gold Rate to ₹${rate22.toLocaleString("en-IN")}/10g (24K: ₹${rate24.toLocaleString("en-IN")})`, {
                rate22K: rate22,
                rate24K: rate24
            });
        }
    }

    showToast(`તા. ${formatDateDMY(date)} નો ૨૨ કેરેટ સોનાનો ભાવ ₹${rate22.toLocaleString("en-IN")}/10g સેવ થયો છે.`);
    return true;
}

// ==================== DASHBOARD ====================
function initDashboard() {
    checkDailyGoldRateValidity();

    const rateInput = document.getElementById("dashboard-gold-rate");
    const saveRateBtn = document.getElementById("save-gold-rate-btn") || document.getElementById("btn-save-gold-rate");
    const btnLock24h = document.getElementById("btn-lock-rate-24h");
    const btnUnlock = document.getElementById("btn-unlock-rate");

    if (btnLock24h) {
        btnLock24h.onclick = (e) => {
            e.preventDefault();
            lockGoldRateFor24Hours();
        };
    }

    if (btnUnlock) {
        btnUnlock.onclick = (e) => {
            e.preventDefault();
            unlockGoldRate();
        };
    }

    if (saveRateBtn) {
        saveRateBtn.onclick = (e) => {
            e.preventDefault();
            const input = document.getElementById("dashboard-gold-rate");
            if (input && input.value && parseFloat(input.value) > 0) {
                setDailyGoldRate(input.value);
            } else {
                alert("કૃપા કરીને ૨૨ કેરેટ સોનાનો ભાવ દાખલ કરો.");
                if (input) input.focus();
            }
        };
    }

    if (rateInput) {
        rateInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (rateInput.value && parseFloat(rateInput.value) > 0) {
                    setDailyGoldRate(rateInput.value);
                }
            }
        });
    }

    // Auto-check gold rate validity periodically to maintain continuous history
    setInterval(checkDailyGoldRateValidity, 60000);
}

function renderDashboard() {
    const isHO = isHeadOfficeSession();
    const userBranch = state.currentSession ? state.currentSession.code : "99";

    // Branch sees only its own loans, Head Office sees all branches combined
    const filteredLoans = isHO ? (state.loans || []) : (state.loans || []).filter(l => isBranchMatch(l.branchCode, userBranch));

    let totalLoans = filteredLoans.length;
    let totalSanctioned = 0;
    let totalWeight = 0;

    filteredLoans.forEach(l => {
        totalSanctioned += parseFloat(l.sanctionedAmount || 0);
        totalWeight += parseFloat(l.goldWeight || 0);
    });

    const statLoans = document.getElementById("stat-total-loans");
    const statAmount = document.getElementById("stat-total-amount");
    const statWeight = document.getElementById("stat-total-weight");
    const statRate = document.getElementById("stat-today-rate");
    const rateInput = document.getElementById("dashboard-gold-rate");

    if (statLoans) statLoans.textContent = totalLoans;
    if (statAmount) statAmount.textContent = "₹ " + Math.round(totalSanctioned).toLocaleString("en-IN");
    if (statWeight) statWeight.textContent = totalWeight.toFixed(3) + " g";
    
    const todayStr = getTodayDateYMD();
    const activeRate22 = getActiveGoldRate22K();

    if (statRate) {
        statRate.textContent = `₹ ${activeRate22.toLocaleString("en-IN")} (22K)`;
    }
    if (rateInput) {
        rateInput.value = activeRate22;
    }

    updateHeaderGoldRate();

    // Hide rate warning since rate is always maintained continuously
    const rateAlert = document.getElementById("rate-missing-alert");
    if (rateAlert) {
        rateAlert.classList.add("hidden");
    }

    // Populate Today's Recent Entries table on Dashboard
    const recentTbody = document.querySelector("#dashboard-recent-table tbody");
    if (recentTbody) {
        const todayLoans = filteredLoans.filter(l => l.date === todayStr);
        if (todayLoans.length === 0) {
            recentTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No loans created today.</td></tr>';
        } else {
            recentTbody.innerHTML = "";
            todayLoans.slice(0, 10).forEach(l => {
                const tr = document.createElement("tr");
                const accFormatted = formatLoanAccountNo(l.accountNo, l.branchCode, l.loanType);
                tr.innerHTML = `
                    <td><strong>${accFormatted}</strong></td>
                    <td><strong>${l.borrowerName}</strong></td>
                    <td><span class="badge badge-gold">${l.loanType || "GW-3725"}</span></td>
                    <td style="font-weight:700;">₹ ${Math.round(parseFloat(l.sanctionedAmount || 0)).toLocaleString("en-IN")}</td>
                    <td><strong>${l.packetNo || "-"}</strong></td>
                `;
                recentTbody.appendChild(tr);
            });
        }
    }
}

// ==================== LOAN ENTRY FORM ====================
let isEditingExistingLoan = false;
let currentEditingLoanId = null;

function initLoanEntryForm() {
    updateBranchContextUI();
    const form = document.getElementById("gold-loan-form");
    const loanAmountInput = document.getElementById("loan-amount");
    const loanBranchSelect = document.getElementById("loan-branch");
    const loanCatSelect = document.getElementById("loan-category-select");
    const isMemberSelect = document.getElementById("is-member");
    const memberNoGroup = document.getElementById("member-no-group");
    const memberNoInput = document.getElementById("member-no");
    const addRowBtn = document.getElementById("btn-add-ornament-row");
    const resetBtn = document.getElementById("reset-loan-form-btn");

    // Default Date
    const loanDateInput = document.getElementById("loan-date");
    if (loanDateInput && !loanDateInput.value) {
        loanDateInput.value = new Date().toISOString().split("T")[0];
    }

    // Auto Proposal Number & Packet Number
    const curBranch = (loanBranchSelect && loanBranchSelect.value) ? loanBranchSelect.value : (state.currentSession ? state.currentSession.code : "99");
    generateNextProposalNo(curBranch);
    generateNextPacketNo(curBranch);

    if (loanBranchSelect) {
        loanBranchSelect.addEventListener("change", () => {
            const b = loanBranchSelect.value;
            generateNextProposalNo(b);
            generateNextPacketNo(b);
            updateLoanAmountLogic();
            calculateAllCharges();
        });
    }

    if (loanAmountInput) {
        loanAmountInput.addEventListener("input", () => {
            updateLoanAmountLogic();
            calculateAllCharges();
        });
        loanAmountInput.addEventListener("change", () => {
            updateLoanAmountLogic();
            calculateAllCharges();
        });
    }

    if (loanCatSelect) {
        loanCatSelect.addEventListener("change", () => {
            updateLoanAmountLogic();
            calculateAllCharges();
        });
    }

    // Membership toggle listener (Bank Member Status)
    if (isMemberSelect) {
        isMemberSelect.addEventListener("change", () => {
            const isMem = (isMemberSelect.value.toLowerCase() === "yes");
            if (memberNoGroup) memberNoGroup.style.display = isMem ? "block" : "none";
            if (!isMem && memberNoInput) memberNoInput.value = "";
            calculateAllCharges();
        });
    }

    if (memberNoInput) {
        memberNoInput.addEventListener("input", () => calculateAllCharges());
    }

    // Manual Adj input
    const manualAdjInput = document.getElementById("charge-adjustment");
    if (manualAdjInput) {
        manualAdjInput.addEventListener("input", () => calculateAllCharges());
    }

    if (addRowBtn) {
        addRowBtn.addEventListener("click", () => {
            addOrnamentRow();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (confirm("Reset loan entry form? Unsaved inputs will be lost.")) {
                resetLoanEntryForm();
            }
        });
    }

    // Customer Lookup
    initCustomerAutofill();

    // Birth Date -> Auto Age calculation
    const custDobInput = document.getElementById("cust-dob");
    const custAgeInput = document.getElementById("cust-age");
    if (custDobInput && custAgeInput) {
        const autoCalcAge = () => {
            const dobVal = custDobInput.value;
            const refDate = loanDateInput && loanDateInput.value ? loanDateInput.value : getTodayDateYMD();
            const age = calculateAgeFromDOB(dobVal, refDate);
            custAgeInput.value = (age !== "" && !isNaN(age)) ? age : "";
        };
        custDobInput.addEventListener("input", autoCalcAge);
        custDobInput.addEventListener("change", autoCalcAge);
        if (loanDateInput) {
            loanDateInput.addEventListener("change", () => {
                if (custDobInput.value) autoCalcAge();
            });
        }
    }

    // Init first ornament row
    const tbody = document.getElementById("ornaments-table-tbody");
    if (tbody && tbody.children.length === 0) {
        addOrnamentRow();
    }

    // Form Submit
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            submitLoanEntry();
        });
    }

    const saveBtn = document.getElementById("btn-save-loan-record");
    if (saveBtn) {
        saveBtn.addEventListener("click", (e) => {
            e.preventDefault();
            submitLoanEntry();
        });
    }

    // Inline rate save button
    const inlineRateInput = document.getElementById("inline-gold-rate");
    const inlineSaveBtn = document.getElementById("inline-save-rate-btn");
    if (inlineSaveBtn && inlineRateInput) {
        inlineSaveBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const val = inlineRateInput.value;
            if (setDailyGoldRate(val)) {
                inlineRateInput.value = "";
                updateOrnamentsTotals();
            }
        });
    }

    // Rate per 10g Input in Section 4
    const valRateInput = document.getElementById("val-gold-rate-input");
    if (valRateInput) {
        valRateInput.addEventListener("input", () => updateOrnamentsTotals());
        valRateInput.addEventListener("change", () => updateOrnamentsTotals());
    }

    // Initial Account Number & Loan Logic
    updateLoanAmountLogic();
}

function updateLoanAmountLogic() {
    const amtInput = document.getElementById("loan-amount");
    const wordsInput = document.getElementById("loan-amount-words");
    const catDisplay = document.getElementById("loan-category-display");
    const catSelect = document.getElementById("loan-category-select");
    const rateDisplay = document.getElementById("interest-rate-display");
    const emiContainer = document.getElementById("installment-fields-container");
    const branchEl = document.getElementById("loan-branch");
    const branchCode = branchEl && branchEl.value ? branchEl.value : (state.currentSession ? state.currentSession.code : "99");

    const amt = parseFloat(amtInput ? amtInput.value || 0 : 0);

    if (wordsInput) {
        wordsInput.value = amt > 0 ? numberToGujaratiWords(amt) + " રૂપિયા પૂરા" : "";
    }

    const products = state.products || DEFAULT_PRODUCTS;
    let selectedProdCode = "3725";

    if (amt <= 0) {
        if (catDisplay) catDisplay.value = "";
        if (rateDisplay) rateDisplay.value = "";
        if (emiContainer) emiContainer.style.display = "none";
        if (catSelect) catSelect.style.display = "none";
        selectedProdCode = "3725";
    } else if (amt <= 200000) {
        // Automatically find matching product from Product Master based on amount
        if (catSelect) catSelect.style.display = "none";
        if (emiContainer) emiContainer.style.display = "none";

        const matchedProd = products.find(p => {
            const min = parseFloat(p.minAmt || 0);
            const max = parseFloat(p.maxAmt || 999999999);
            return amt >= min && amt <= max && !p.code.includes("3527") && !p.code.includes("3553");
        }) || products.find(p => {
            const min = parseFloat(p.minAmt || 0);
            const max = parseFloat(p.maxAmt || 999999999);
            return amt >= min && amt <= max;
        });

        if (matchedProd) {
            const rate = parseFloat(matchedProd.rate || 11.50).toFixed(2);
            if (catDisplay) catDisplay.value = `${matchedProd.code} - ${matchedProd.name || matchedProd.code}`;
            if (rateDisplay) rateDisplay.value = `${rate}%`;
            selectedProdCode = matchedProd.code;
        } else {
            const defaultProd = amt <= 100000 ? "GW-3725" : "GD-3524";
            if (catDisplay) catDisplay.value = amt <= 50000 ? "GW-3725 (Gold Loan up to ₹50,000)" : (amt <= 100000 ? "GW-3725 (Gold Loan ₹50,001 to ₹1,00,000)" : "GD-3524 (Gold Loan ₹100,001 to ₹2,00,000)");
            if (rateDisplay) rateDisplay.value = amt <= 50000 ? "11.00%" : "11.50%";
            selectedProdCode = defaultProd;
        }
    } else {
        // Amount above ₹2,00,000: Ask Installment (GNA-3527) or Overdraft (GOD-3553)
        if (catSelect) {
            catSelect.style.display = "inline-block";
            if (catSelect.value === "auto") {
                catSelect.value = "3527"; // Default to Installment scheme
            }
        }

        const isOverdraft = (catSelect && (catSelect.value === "3553" || catSelect.value === "GOD-3553"));
        const targetCode = isOverdraft ? "GOD-3553" : "GNA-3527";
        selectedProdCode = isOverdraft ? "3553" : "3527";

        const matchedProd = products.find(p => p.code.includes(isOverdraft ? "3553" : "3527")) || {
            code: targetCode,
            name: isOverdraft ? "Gold Loan above ₹200,000 (Overdraft) (GOD-3553)" : "Gold Loan above ₹200,000 (GNA-3527)",
            rate: 11.50
        };

        const rate = parseFloat(matchedProd.rate || 11.50).toFixed(2);
        if (catDisplay) catDisplay.value = `${matchedProd.code} - ${matchedProd.name || matchedProd.code}`;
        if (rateDisplay) rateDisplay.value = `${rate}%`;

        if (!isOverdraft) {
            if (emiContainer) emiContainer.style.display = "block";
            calculateInstallmentEMI(amt, parseFloat(rate), 36);
        } else {
            if (emiContainer) emiContainer.style.display = "none";
        }
    }

    // Auto Account Number format: શાખાનો કોડ + પ્રોડક્ટ કોડ + ખાતા નંબર(ઓટો સીરીયલ નંબર)
    const acInput = document.getElementById("loan-ac-no");
    if (acInput && !isEditingExistingLoan) {
        if (!acInput.dataset.userEdited) {
            acInput.value = generateNextAccountNo(branchCode, selectedProdCode);
        }
    }
}

function calculateInstallmentEMI(principal, annualRate, months = 36) {
    const emiInput = document.getElementById("loan-emi-amount");
    const instCountInput = document.getElementById("loan-installments");

    if (!principal || principal <= 0) {
        if (emiInput) emiInput.value = "";
        return;
    }

    const r = (annualRate / 12) / 100;
    const n = months;
    const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    if (emiInput && (!emiInput.value || parseFloat(emiInput.value) === 0 || isNaN(parseFloat(emiInput.value)))) {
        emiInput.value = Math.round(emi);
    }
    if (instCountInput) instCountInput.value = n;
}

// ==================== ORNAMENTS TABLE ====================
function truncateTo3Decimals(num) {
    if (!num || isNaN(num) || num <= 0) return 0;
    const fixedStr = Number(num).toFixed(8);
    const [intPart, decPart] = fixedStr.split(".");
    return parseFloat(intPart + "." + (decPart ? decPart.slice(0, 3) : "000"));
}

function addOrnamentRow(data = {}) {
    const tbody = document.getElementById("ornaments-table-tbody");
    if (!tbody) return;

    if (tbody.children.length >= 10) {
        alert("Maximum 10 ornament rows allowed per loan.");
        return;
    }

    const rowNum = tbody.children.length + 1;
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td style="text-align: center; font-weight: 700;">${rowNum}</td>
        <td><input type="text" class="orn-item-name" placeholder="E.G. GOLD BANGLES / RING / CHAIN" value="${data.name || ""}" required></td>
        <td><input type="number" class="orn-item-qty" placeholder="1" value="${data.qty || 1}" min="1" step="1" required style="text-align:center;"></td>
        <td><input type="number" class="orn-gross-gm" placeholder="0.000" value="${data.grossGm !== undefined ? data.grossGm : ""}" step="0.001" min="0" required style="text-align:right;"></td>
        <td><input type="number" class="orn-gross-mg" placeholder="0" value="${data.grossMg !== undefined ? data.grossMg : ""}" step="1" min="0" max="999" style="text-align:right;"></td>
        <td><input type="number" class="orn-net-gm" placeholder="0.000" value="${data.netGm !== undefined ? data.netGm : ""}" step="0.001" min="0" required style="text-align:right; font-weight:700;"></td>
        <td><input type="number" class="orn-net-mg" placeholder="0" value="${data.netMg !== undefined ? data.netMg : ""}" step="1" min="0" max="999" style="text-align:right;"></td>
        <td>
            <select class="orn-purity" style="padding:4px; font-size:12px; font-weight:600; width:100%; cursor:pointer;">
                <option value="22" ${String(data.purity || "22").replace(/\D/g, '') === "22" ? "selected" : ""}>22 Karat (916)</option>
                <option value="21" ${String(data.purity || "22").replace(/\D/g, '') === "21" ? "selected" : ""}>21 Karat (875)</option>
                <option value="20" ${String(data.purity || "22").replace(/\D/g, '') === "20" ? "selected" : ""}>20 Karat (833)</option>
                <option value="19" ${String(data.purity || "22").replace(/\D/g, '') === "19" ? "selected" : ""}>19 Karat (792)</option>
                <option value="18" ${String(data.purity || "22").replace(/\D/g, '') === "18" ? "selected" : ""}>18 Karat (750)</option>
                <option value="17" ${String(data.purity || "22").replace(/\D/g, '') === "17" ? "selected" : ""}>17 Karat (708)</option>
                ${(data.purity && String(data.purity).replace(/\D/g, '') === "24") ? '<option value="24" selected>24 Karat (999)</option>' : ''}
            </select>
        </td>
        <td><input type="number" class="orn-fine-gold-gm auto-calc-field" placeholder="0.000" value="${data.fineGoldGm !== undefined ? data.fineGoldGm : ""}" readonly step="0.001" style="text-align:right; font-weight:700; color:#166534;"></td>
        <td><input type="number" class="orn-market-val auto-calc-field" placeholder="0" value="${data.marketVal !== undefined ? data.marketVal : ""}" readonly style="text-align:right; font-weight:700; color:#854d0e;"></td>
        <td style="text-align: center;">
            <button type="button" class="btn-icon-red remove-orn-row-btn" style="padding: 2px 6px; cursor:pointer;" title="Delete Row"><i class="fa-solid fa-trash-can"></i></button>
        </td>
    `;

    tbody.appendChild(tr);

    // Row input event listeners
    tr.querySelectorAll("input, select").forEach(el => {
        el.addEventListener("input", () => updateOrnamentsTotals());
        el.addEventListener("change", () => updateOrnamentsTotals());
    });

    tr.querySelector(".remove-orn-row-btn").addEventListener("click", () => {
        if (tbody.children.length > 1) {
            tr.remove();
            reindexOrnamentRows();
            updateOrnamentsTotals();
        } else {
            alert("ઓછામાં ઓછો એક દાગીનો હોવો જરૂરી છે.");
        }
    });

    updateOrnamentsTotals();
}

function reindexOrnamentRows() {
    const tbody = document.getElementById("ornaments-table-tbody");
    if (!tbody) return;
    Array.from(tbody.children).forEach((row, i) => {
        row.children[0].textContent = i + 1;
    });
}

function updateOrnamentsTotals() {
    const tbody = document.getElementById("ornaments-table-tbody");
    if (!tbody) return;

    let totalPcs = 0;
    let totalGrossGm = 0, totalGrossMg = 0;
    let totalNetGm = 0, totalNetMg = 0;
    let totalFineGoldGm = 0;
    let totalValuation = 0;
    const names = [];

    // 1. Resolve Active 22K Gold Rate
    const valRateInput = document.getElementById("val-gold-rate-input");
    let goldRate22K = (valRateInput && parseFloat(valRateInput.value) > 0) ? parseFloat(valRateInput.value) : getActiveGoldRate22K();

    if (valRateInput && (!valRateInput.value || parseFloat(valRateInput.value) <= 0)) {
        valRateInput.value = goldRate22K;
    }

    const goldRatePer10g = goldRate22K;
    const ratePerGram = goldRatePer10g / 10;

    Array.from(tbody.children).forEach(row => {
        const name = row.querySelector(".orn-item-name")?.value.trim() || "";
        const qty = parseInt(row.querySelector(".orn-item-qty")?.value || 1);
        const grossGm = parseFloat(row.querySelector(".orn-gross-gm")?.value || 0);
        const grossMg = parseInt(row.querySelector(".orn-gross-mg")?.value || 0);
        const netGm = parseFloat(row.querySelector(".orn-net-gm")?.value || 0);
        const netMg = parseInt(row.querySelector(".orn-net-mg")?.value || 0);
        const purityVal = parseFloat(row.querySelector(".orn-purity")?.value || 22);

        if (name) names.push(`${name} (${qty})`);

        const netWeightInGm = netGm + (netMg / 1000);
        
        // Fine Gold (Grams) Formula: (Net Weight in Gm * Purity / 22) truncated to exactly 3 decimal digits
        const rawFineGold = netWeightInGm > 0 ? (netWeightInGm * purityVal) / 22 : 0;
        const fineGoldInGm = truncateTo3Decimals(rawFineGold);
        
        // Fine Gold Value (₹) Formula: fineGoldInGm (3 decimals) * Rate per 10g / 10
        const rowVal = Math.round(fineGoldInGm * (goldRatePer10g / 10));

        const elFineGold = row.querySelector(".orn-fine-gold-gm");
        const elMarketVal = row.querySelector(".orn-market-val");

        if (elFineGold) elFineGold.value = fineGoldInGm > 0 ? fineGoldInGm.toFixed(3) : "";
        if (elMarketVal) elMarketVal.value = rowVal > 0 ? rowVal : "";

        totalPcs += qty;
        totalGrossGm += grossGm;
        totalGrossMg += grossMg;
        totalNetGm += netGm;
        totalNetMg += netMg;
        totalFineGoldGm += fineGoldInGm;
        totalValuation += rowVal;
    });

    const normGrossGm = (totalGrossGm + Math.floor(totalGrossMg / 1000)).toFixed(3);
    const normGrossMg = totalGrossMg % 1000;
    const normNetGm = (totalNetGm + Math.floor(totalNetMg / 1000)).toFixed(3);
    const normNetMg = totalNetMg % 1000;

    // Update Footer Totals
    const elPcs = document.getElementById("total-orn-pcs");
    const elGGm = document.getElementById("total-gross-gm");
    const elGMg = document.getElementById("total-gross-mg");
    const elNGm = document.getElementById("total-net-gm");
    const elNMg = document.getElementById("total-net-mg");
    const elFineGoldTot = document.getElementById("total-fine-gold-gm");
    const elVal = document.getElementById("total-orn-val");

    if (elPcs) elPcs.textContent = totalPcs;
    if (elGGm) elGGm.textContent = normGrossGm;
    if (elGMg) elGMg.textContent = normGrossMg;
    if (elNGm) elNGm.textContent = normNetGm;
    if (elNMg) elNMg.textContent = normNetMg;
    if (elFineGoldTot) elFineGoldTot.textContent = totalFineGoldGm.toFixed(3);
    if (elVal) elVal.textContent = "₹ " + totalValuation.toLocaleString("en-IN");

    // Auto-update Section 3 Gold Weight (Locked Field)
    const finalNetWt = (parseFloat(normNetGm) + (normNetMg / 1000)).toFixed(3);
    const goldWeightInput = document.getElementById("gold-weight");
    if (goldWeightInput && tbody.children.length > 0) {
        goldWeightInput.value = parseFloat(finalNetWt) > 0 ? finalNetWt : "";
    }

    const descHidden = document.getElementById("ornaments-desc");
    if (descHidden) descHidden.value = names.join(", ");

    calculateAllCharges();
}

function getOrnamentsTableJSON() {
    const tbody = document.getElementById("ornaments-table-tbody");
    if (!tbody) return [];

    const list = [];
    Array.from(tbody.children).forEach(row => {
        const netGm = parseFloat(row.querySelector(".orn-net-gm")?.value || 0);
        const netMg = parseInt(row.querySelector(".orn-net-mg")?.value || 0);
        const purity = row.querySelector(".orn-purity") ? row.querySelector(".orn-purity").value : "22";
        const netWeightInGm = netGm + (netMg / 1000);
        const rawFineGold = (netWeightInGm * parseFloat(purity)) / 22;
        const fineGold = truncateTo3Decimals(rawFineGold);

        list.push({
            name: row.querySelector(".orn-item-name")?.value.trim() || "",
            qty: parseInt(row.querySelector(".orn-item-qty")?.value || 1),
            grossGm: parseFloat(row.querySelector(".orn-gross-gm")?.value || 0),
            grossMg: parseInt(row.querySelector(".orn-gross-mg")?.value || 0),
            netGm: netGm,
            netMg: netMg,
            purity: purity,
            fineGoldGm: fineGold,
            marketVal: parseFloat(row.querySelector(".orn-market-val")?.value || 0)
        });
    });
    return list;
}

// ==================== CHARGES & DEDUCTIONS (DYNAMIC RULES MASTER LOGIC) ====================
function getCustomChargesListForCurrentLoan(loanAmt, isMember, schemeSelectVal) {
    const rules = state.rules || DEFAULT_RULES;
    const customList = [];
    const activeCustom = (rules.customCharges || []).filter(c => c.active !== false && c.active !== "false");

    activeCustom.forEach(chg => {
        let isApplicable = true;
        if (chg.applicability === "non_member" && isMember) isApplicable = false;
        if (chg.applicability === "member" && !isMember) isApplicable = false;
        if (chg.applicability === "scheme_3527" && schemeSelectVal !== "3527" && schemeSelectVal !== "GNA-3527") isApplicable = false;

        let chgAmt = 0;
        if (isApplicable && loanAmt > 0) {
            if (chg.calcType === "percent") {
                const raw = Math.round(loanAmt * (parseFloat(chg.value || 0) / 100));
                if (chg.maxCap && parseFloat(chg.maxCap) > 0) {
                    chgAmt = Math.min(parseFloat(chg.maxCap), raw);
                } else {
                    chgAmt = raw;
                }
            } else {
                chgAmt = parseFloat(chg.value || 0);
            }
        }

        customList.push({
            id: chg.id,
            nameEn: chg.nameEn,
            nameGu: chg.nameGu || chg.nameEn,
            code: chg.code,
            calcType: chg.calcType,
            value: chg.value,
            amount: chgAmt,
            gstApplicable: chg.gstApplicable === "yes"
        });
    });

    return customList;
}

function calculateAllCharges() {
    const loanAmt = parseFloat(document.getElementById("loan-amount") ? document.getElementById("loan-amount").value || 0 : 0);
    const goldWeight = parseFloat(document.getElementById("gold-weight") ? document.getElementById("gold-weight").value || 0 : 0);
    const isMemberVal = document.getElementById("is-member") ? document.getElementById("is-member").value.toLowerCase() : "no";
    const isMember = (isMemberVal === "yes");
    const schemeSelectVal = document.getElementById("loan-category-select") ? document.getElementById("loan-category-select").value : "auto";

    const valRateInput = document.getElementById("val-gold-rate-input");
    const goldRatePer10g = (valRateInput && parseFloat(valRateInput.value) > 0) ? parseFloat(valRateInput.value) : getActiveGoldRate22K();
    const totalFineGold = parseFloat(document.getElementById("total-fine-gold-gm") ? document.getElementById("total-fine-gold-gm").textContent || 0 : 0);
    const marketValue = totalFineGold > 0 ? Math.round(totalFineGold * (goldRatePer10g / 10)) : (goldWeight > 0 ? Math.round(goldWeight * (goldRatePer10g / 10)) : 0);
    const eligibleAmt75 = Math.round(marketValue * 0.75);

    const rules = state.rules || DEFAULT_RULES;

    // 1. Membership & Share Rules:
    let shareA = 0;
    let shareB = 0;
    let memberFee = 0;

    if (loanAmt > 0) {
        if (isMember) {
            shareA = 0;
            shareB = 0;
            memberFee = 0;
        } else {
            const nonMemLimit = parseFloat(rules.membership?.nonMemberLimit ?? 99999);
            if (loanAmt <= nonMemLimit) {
                shareA = 0;
                shareB = parseFloat(rules.membership?.shareGroupB ?? 50);
                memberFee = 0;
            } else {
                shareA = parseFloat(rules.membership?.shareGroupA ?? 500);
                shareB = 0;
                memberFee = parseFloat(rules.membership?.memberFee ?? 25);
            }
        }
    }

    // 2. Valuation Fee Slabs:
    let valuationFee = 0;
    const vRules = rules.valuation || DEFAULT_RULES.valuation;
    if (loanAmt > 0) {
        if (loanAmt <= parseFloat(vRules.slab1Max ?? 25000)) {
            valuationFee = parseFloat(vRules.slab1Amt ?? 100);
        } else if (loanAmt <= parseFloat(vRules.slab2Max ?? 50000)) {
            valuationFee = parseFloat(vRules.slab2Amt ?? 150);
        } else if (loanAmt <= parseFloat(vRules.slab3Max ?? 100000)) {
            valuationFee = parseFloat(vRules.slab3Amt ?? 250);
        } else if (loanAmt <= 500000) {
            const raw = Math.round(loanAmt * (parseFloat(vRules.ratePercent ?? 0.25) / 100));
            valuationFee = Math.min(parseFloat(vRules.slab4MaxCap ?? 1000), raw);
        } else if (loanAmt <= 1000000) {
            const raw = Math.round(loanAmt * (parseFloat(vRules.ratePercent ?? 0.25) / 100));
            valuationFee = Math.min(parseFloat(vRules.slab5MaxCap ?? 1500), raw);
        } else {
            const raw = Math.round(loanAmt * (parseFloat(vRules.ratePercent ?? 0.25) / 100));
            valuationFee = Math.min(parseFloat(vRules.slab6MaxCap ?? 2000), raw);
        }
    }

    // 3. Insurance Fee:
    let insurance = 0;
    const insRules = rules.insurance || DEFAULT_RULES.insurance;
    if (loanAmt > 0) {
        insurance = (loanAmt <= parseFloat(insRules.threshold ?? 200000)) ? parseFloat(insRules.slab1Amt ?? 50) : parseFloat(insRules.slab2Amt ?? 100);
    }

    // 4. Doc Charge:
    let docCharge = 0;
    const docRules = rules.docCharge || DEFAULT_RULES.docCharge;
    if (loanAmt > 0) {
        if (loanAmt <= parseFloat(docRules.slab1Limit ?? 100000)) {
            docCharge = parseFloat(docRules.slab1Amt ?? 50);
        } else if (loanAmt <= parseFloat(docRules.slab2Limit ?? 200000)) {
            docCharge = parseFloat(docRules.slab2Amt ?? 100);
        } else {
            docCharge = parseFloat(docRules.slab3Amt ?? 200);
        }
    }

    // 5. Service Charge:
    let serviceChg = 0;
    const srvRules = rules.serviceCharge || DEFAULT_RULES.serviceCharge;
    if (loanAmt > 0) {
        if (loanAmt <= parseFloat(srvRules.threshold ?? 200000)) {
            const raw = Math.round(loanAmt * (parseFloat(srvRules.slab1Rate ?? 0.25) / 100));
            serviceChg = Math.min(parseFloat(srvRules.slab1Cap ?? 500), raw);
        } else {
            const raw = Math.round(loanAmt * (parseFloat(srvRules.slab2Rate ?? 0.50) / 100));
            serviceChg = Math.min(parseFloat(srvRules.slab2Cap ?? 5000), raw);
        }
    }

    // 6. Stamp Duty:
    let stampDuty = 0;
    const stRules = rules.stampDuty || DEFAULT_RULES.stampDuty;
    if (loanAmt > 0) {
        const exempt = parseFloat(stRules.exemptLimit ?? 49999);
        const slabLimit = parseFloat(stRules.slabLimit ?? 119999);
        const stRate = parseFloat(stRules.ratePercent ?? 0.25) / 100;
        const roundMult = parseFloat(stRules.roundUpMultiple ?? 10);
        const fixedAboveAmt = parseFloat(stRules.fixedAboveAmount ?? stRules.aboveExtraFee ?? 300);
        const s3553Fee = parseFloat(stRules.scheme3553ExtraFee ?? 300);

        if (loanAmt <= exempt) {
            stampDuty = 0;
        } else if (loanAmt <= slabLimit) {
            const rawStamp = loanAmt * stRate;
            stampDuty = Math.ceil(rawStamp / roundMult) * roundMult;
        } else {
            stampDuty = fixedAboveAmt; // Fixed ₹300 for ₹1,20,000 and above
        }

        // Scheme 3553 extra fee (₹300)
        const isScheme3553 = (schemeSelectVal === "3553" || schemeSelectVal === "GOD-3553" || (typeof selectedProdCode !== "undefined" && String(selectedProdCode).includes("3553")));
        if (isScheme3553) {
            stampDuty += s3553Fee;
        }
    }

    // 7. Dynamic Custom Charges
    let customChargesTotal = 0;
    let customGstTaxable = 0;
    const dynamicContainer = document.getElementById("dynamic-custom-charges-loan-grid");
    if (dynamicContainer) dynamicContainer.innerHTML = "";

    const customList = getCustomChargesListForCurrentLoan(loanAmt, isMember, schemeSelectVal);
    customList.forEach(item => {
        customChargesTotal += item.amount;
        if (item.gstApplicable && item.amount > 0) {
            customGstTaxable += item.amount;
        }

        if (dynamicContainer) {
            const div = document.createElement("div");
            div.className = "form-group";
            div.innerHTML = `
                <label for="custom-chg-${item.id}">${item.nameGu} (₹)</label>
                <input type="number" id="custom-chg-${item.id}" class="auto-calc-field" readonly value="${item.amount}">
            `;
            dynamicContainer.appendChild(div);
        }
    });

    // 8. CGST & SGST (Taxable: Service Charge + Doc Charge + Custom Taxable Charges):
    let cgst = 0;
    let sgst = 0;
    const gstRules = rules.gst || DEFAULT_RULES.gst;
    const totalTaxable = serviceChg + docCharge + customGstTaxable;
    if (totalTaxable > 0) {
        const cgstRate = parseFloat(gstRules.cgstPercent ?? 9) / 100;
        const sgstRate = parseFloat(gstRules.sgstPercent ?? 9) / 100;
        cgst = Math.round(totalTaxable * cgstRate);
        sgst = Math.round(totalTaxable * sgstRate);
    }

    const manualAdj = parseFloat(document.getElementById("charge-adjustment") ? document.getElementById("charge-adjustment").value || 0 : 0);

    const totalDeductions = shareA + shareB + memberFee + valuationFee + stampDuty + serviceChg + docCharge + insurance + cgst + sgst + customChargesTotal + manualAdj;
    const netDisbursed = Math.max(0, loanAmt - totalDeductions);
    const ltvRatio = marketValue > 0 ? ((loanAmt / marketValue) * 100).toFixed(2) : "0.00";
    const marginRatio = marketValue > 0 ? (100 - parseFloat(ltvRatio)).toFixed(2) : "100.00";

    // Set UI Input values
    if (document.getElementById("charge-share-a")) document.getElementById("charge-share-a").value = shareA;
    if (document.getElementById("charge-share-b")) document.getElementById("charge-share-b").value = shareB;
    if (document.getElementById("charge-member-fee")) document.getElementById("charge-member-fee").value = memberFee;
    if (document.getElementById("charge-valuation")) document.getElementById("charge-valuation").value = valuationFee;
    if (document.getElementById("charge-stamp")) document.getElementById("charge-stamp").value = stampDuty;
    if (document.getElementById("charge-service")) document.getElementById("charge-service").value = serviceChg;
    if (document.getElementById("charge-document")) document.getElementById("charge-document").value = docCharge;
    if (document.getElementById("charge-insurance")) document.getElementById("charge-insurance").value = insurance;
    if (document.getElementById("charge-cgst")) document.getElementById("charge-cgst").value = cgst;
    if (document.getElementById("charge-sgst")) document.getElementById("charge-sgst").value = sgst;
    if (document.getElementById("charge-total")) document.getElementById("charge-total").value = totalDeductions;

    // Set Valuation Summary Displays
    const elRateDisp = document.getElementById("val-rate-display");
    const elMktDisp = document.getElementById("val-market-val-display");
    const elEligDisp = document.getElementById("val-eligible-display");
    const elLtvDisp = document.getElementById("val-ltv-display");
    const elMarginDisp = document.getElementById("val-margin-display");
    const cardLtv = document.getElementById("val-ltv-card");
    const cardMargin = document.getElementById("val-margin-card");
    const ltvWarning = document.getElementById("ltv-warning-badge");

    if (elRateDisp) elRateDisp.textContent = goldRatePer10g > 0 ? `₹ ${goldRatePer10g.toLocaleString("en-IN")}` : "₹ 0";
    if (elMktDisp) elMktDisp.textContent = marketValue > 0 ? `₹ ${marketValue.toLocaleString("en-IN")}` : "₹ 0";
    if (elEligDisp) elEligDisp.textContent = eligibleAmt75 > 0 ? `₹ ${eligibleAmt75.toLocaleString("en-IN")}` : "₹ 0";
    if (elLtvDisp) elLtvDisp.textContent = `${ltvRatio}%`;
    if (elMarginDisp) elMarginDisp.textContent = `${marginRatio}%`;

    const numMargin = parseFloat(marginRatio || 100);
    const isMarginLow = (marketValue > 0 && loanAmt > 0 && numMargin < 25.0);

    if (cardMargin) {
        if (isMarginLow) {
            cardMargin.classList.add("metric-danger-red");
            cardMargin.classList.remove("metric-safe-green");
        } else {
            cardMargin.classList.remove("metric-danger-red");
            cardMargin.classList.add("metric-safe-green");
        }
    }

    if (cardLtv) {
        if (isMarginLow) {
            cardLtv.classList.add("metric-danger-red");
            cardLtv.classList.remove("metric-safe-blue");
        } else {
            cardLtv.classList.remove("metric-danger-red");
            cardLtv.classList.add("metric-safe-blue");
        }
    }

    if (ltvWarning) {
        if (isMarginLow) {
            ltvWarning.classList.remove("hidden");
            ltvWarning.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> સાવચેતી: બેંક માર્જીન ૨૫% કરતાં ઓછું છે (${marginRatio}%)! LTV: ${ltvRatio}% (RBI નિયમ મુજબ ૨૫% માર્જીન હોવું જરૂરી છે)`;
        } else {
            ltvWarning.classList.add("hidden");
        }
    }

    // Set Net Disbursal Card
    const sumSanc = document.getElementById("summary-sanctioned-amt");
    const sumDeduct = document.getElementById("summary-deductions-amt");
    const sumNet = document.getElementById("summary-net-disbursal");

    if (sumSanc) sumSanc.textContent = `₹ ${loanAmt.toLocaleString("en-IN")}`;
    if (sumDeduct) sumDeduct.textContent = `₹ ${totalDeductions.toLocaleString("en-IN")}`;
    if (sumNet) sumNet.textContent = `₹ ${netDisbursed.toLocaleString("en-IN")}`;
}

// ==================== SAVE / SUBMIT LOAN ENTRY ====================
function submitLoanEntry() {
    try {
        const loanAmtInput = document.getElementById("loan-amount");
        const loanAmt = parseFloat(loanAmtInput ? loanAmtInput.value || 0 : 0);
        if (loanAmt <= 0) {
            alert("કૃપા કરીને મંજૂર લોનની રકમ (Sanctioned Loan Amount) દાખલ કરો.");
            if (loanAmtInput) loanAmtInput.focus();
            return;
        }

        const nameInput = document.getElementById("cust-name");
        const borrowerName = nameInput ? nameInput.value.trim() : "";
        if (!borrowerName) {
            alert("કૃપા કરીને ગ્રાહકનું નામ (Customer / Borrower Name) દાખલ કરો.");
            if (nameInput) nameInput.focus();
            return;
        }

        const goldWeightInput = document.getElementById("gold-weight");
        const goldWeight = parseFloat(goldWeightInput ? goldWeightInput.value || 0 : 0);
        if (goldWeight <= 0) {
            alert("કૃપા કરીને દાગીનાની વિગત ભરીને નેટ વજન (Net Weight) દાખલ કરો.");
            return;
        }

        const valuerInput = document.getElementById("valuer-select");
        const valuerName = valuerInput ? valuerInput.value.trim() : "";
        if (!valuerName) {
            alert("કૃપા કરીને વેલ્યુઅર સોની (Valuer) પસંદ કરો.");
            if (valuerInput) valuerInput.focus();
            return;
        }

        const isHO = isHeadOfficeSession();
        const branchEl = document.getElementById("loan-branch");
        const branchCode = isHO ? (branchEl && branchEl.value ? branchEl.value : "99") : (state.currentSession ? state.currentSession.code : "99");
        const branchObj = state.branches.find(b => isBranchMatch(b.code, branchCode)) || { code: branchCode, name: branchCode + " BRANCH" };

        const proposalNoInput = document.getElementById("unique-proposal-no");
        const proposalNo = (proposalNoInput && proposalNoInput.value.trim()) ? proposalNoInput.value.trim() : ("GL-P-" + String(state.loans.length + 1).padStart(4, "0"));
        
        const loanDateInput = document.getElementById("loan-date");
        const loanDate = (loanDateInput && loanDateInput.value) ? loanDateInput.value : new Date().toISOString().split("T")[0];
        const packetNoInput = document.getElementById("packet-no");
        const packetNo = (packetNoInput && packetNoInput.value.trim()) ? packetNoInput.value.trim() : generateNextPacketNo(branchCode);

        const valRateInput = document.getElementById("val-gold-rate-input");
        const goldRate22K = (valRateInput && parseFloat(valRateInput.value) > 0) ? parseFloat(valRateInput.value) : getActiveGoldRate22K();
        const goldRate24K = Math.round(goldRate22K * (24 / 22));
        const marketValue = Math.round(goldWeight * (goldRate22K / 10));

        // Determine loan type code dynamically from Product Master
        const products = state.products || DEFAULT_PRODUCTS;
        const catSelectVal = document.getElementById("loan-category-select") ? document.getElementById("loan-category-select").value : "auto";
        let loanTypeCode = "GW-3725";
        let interestRateVal = 11.50;

        if (loanAmt > 200000) {
            if (catSelectVal === "3553" || catSelectVal === "GOD-3553") {
                loanTypeCode = "GOD-3553";
            } else {
                loanTypeCode = "GNA-3527";
            }
            const matchedProd = products.find(p => p.code.includes(loanTypeCode.split("-")[1])) || products.find(p => p.code === loanTypeCode);
            if (matchedProd) interestRateVal = parseFloat(matchedProd.rate || 11.50);
        } else {
            const matchedProd = products.find(p => {
                const min = parseFloat(p.minAmt || 0);
                const max = parseFloat(p.maxAmt || 999999999);
                return loanAmt >= min && loanAmt <= max && !p.code.includes("3527") && !p.code.includes("3553");
            }) || products.find(p => {
                const min = parseFloat(p.minAmt || 0);
                const max = parseFloat(p.maxAmt || 999999999);
                return loanAmt >= min && loanAmt <= max;
            });

            if (matchedProd) {
                loanTypeCode = matchedProd.code;
                interestRateVal = parseFloat(matchedProd.rate || 11.50);
            } else {
                loanTypeCode = loanAmt <= 100000 ? "GW-3725" : "GD-3524";
                interestRateVal = loanAmt <= 50000 ? 11.00 : 11.50;
            }
        }

        const accountNoInput = document.getElementById("loan-ac-no");
        const rawAccountNo = (accountNoInput && accountNoInput.value.trim()) ? accountNoInput.value.trim() : generateNextAccountNo(branchCode, loanTypeCode);
        const accountNo = formatLoanAccountNo(rawAccountNo, branchCode, loanTypeCode);

        const isMember = (document.getElementById("is-member") && document.getElementById("is-member").value.toLowerCase() === "yes");

        const customChargesList = getCustomChargesListForCurrentLoan(loanAmt, isMember, loanTypeCode);
        const customChargesTotal = customChargesList.reduce((sum, item) => sum + (item.amount || 0), 0);

        const statusRadio = document.querySelector('input[name="loan-status"]:checked');
        const loanStatus = statusRadio ? statusRadio.value : "New";

        const custNo = document.getElementById("cust-no") ? document.getElementById("cust-no").value.trim() : "";
        const address = document.getElementById("cust-address") ? document.getElementById("cust-address").value.trim() : "";
        const mobile = document.getElementById("cust-mobile") ? document.getElementById("cust-mobile").value.trim() : "";
        const savingsAc = document.getElementById("cust-savings-ac") ? document.getElementById("cust-savings-ac").value.trim() : "";
        const dob = document.getElementById("cust-dob") ? document.getElementById("cust-dob").value : "";
        const age = document.getElementById("cust-age") ? document.getElementById("cust-age").value.trim() : (dob ? calculateAgeFromDOB(dob, loanDate) : "");
        const occupation = document.getElementById("cust-occupation") ? document.getElementById("cust-occupation").value.trim() : "";
        const religion = document.getElementById("cust-religion") ? document.getElementById("cust-religion").value.trim() : "";
        const caste = document.getElementById("cust-caste") ? document.getElementById("cust-caste").value.trim() : "";
        const nomineeName = document.getElementById("cust-nominee-name") ? document.getElementById("cust-nominee-name").value.trim() : "";
        const nomineeRelation = document.getElementById("cust-nominee-relation") ? document.getElementById("cust-nominee-relation").value.trim() : "";
        const memberNo = isMember && document.getElementById("member-no") ? document.getElementById("member-no").value.trim() : "";

        const loanObj = {
            id: isEditingExistingLoan && currentEditingLoanId ? currentEditingLoanId : ("GL-" + Date.now()),
            loanNo: proposalNo,
            date: loanDate,
            loanStatus: loanStatus,
            branchCode: branchCode,
            branchName: branchObj.name,
            accountNo: accountNo,
            packetNo: packetNo,
            customerNo: custNo,
            isMember: isMember,
            memberNo: memberNo,
            borrowerName: borrowerName,
            address: address,
            mobile: mobile,
            savingsAc: savingsAc,
            dob: dob,
            age: age,
            occupation: occupation,
            religion: religion,
            caste: caste,
            nomineeName: nomineeName,
            nomineeRelation: nomineeRelation,
            valuerName: valuerName,
            loanType: loanTypeCode,
            interestRate: interestRateVal,
            sanctionedAmount: loanAmt,
            valuationAmount: marketValue,
            goldWeight: (() => {
                const ornList = getOrnamentsTableJSON();
                let calcNet = 0;
                if (ornList.length > 0) {
                    ornList.forEach(orn => {
                        calcNet += parseFloat(orn.netGm || 0) + (parseFloat(orn.netMg || 0) / 1000);
                    });
                }
                return calcNet > 0 ? calcNet.toFixed(3) : parseFloat(goldWeight || 0).toFixed(3);
            })(),
            grossWeight: (() => {
                const ornList = getOrnamentsTableJSON();
                let calcGross = 0;
                if (ornList.length > 0) {
                    ornList.forEach(orn => {
                        calcGross += parseFloat(orn.grossGm || 0) + (parseFloat(orn.grossMg || 0) / 1000);
                    });
                }
                return calcGross > 0 ? calcGross.toFixed(3) : parseFloat(goldWeight || 0).toFixed(3);
            })(),
            purpose: document.getElementById("loan-purpose") ? (document.getElementById("loan-purpose").value.trim() || "Personal / Business Use") : "Personal / Business Use",
            emiAmount: parseFloat(document.getElementById("loan-emi-amount") ? document.getElementById("loan-emi-amount").value || 0 : 0),
            installments: parseInt(document.getElementById("loan-installments") ? document.getElementById("loan-installments").value || 36 : 36),
            // Itemized Deductions & Charges
            shareA: parseFloat(document.getElementById("charge-share-a") ? document.getElementById("charge-share-a").value || 0 : 0),
            shareB: parseFloat(document.getElementById("charge-share-b") ? document.getElementById("charge-share-b").value || 0 : 0),
            memberFee: parseFloat(document.getElementById("charge-member-fee") ? document.getElementById("charge-member-fee").value || 0 : 0),
            valuerFee: parseFloat(document.getElementById("charge-valuation") ? document.getElementById("charge-valuation").value || 0 : 0),
            stampDuty: parseFloat(document.getElementById("charge-stamp") ? document.getElementById("charge-stamp").value || 0 : 0),
            serviceCharge: parseFloat(document.getElementById("charge-service") ? document.getElementById("charge-service").value || 0 : 0),
            docCharges: parseFloat(document.getElementById("charge-document") ? document.getElementById("charge-document").value || 0 : 0),
            insurance: parseFloat(document.getElementById("charge-insurance") ? document.getElementById("charge-insurance").value || 0 : 0),
            cgst: parseFloat(document.getElementById("charge-cgst") ? document.getElementById("charge-cgst").value || 0 : 0),
            sgst: parseFloat(document.getElementById("charge-sgst") ? document.getElementById("charge-sgst").value || 0 : 0),
            otherCharges: parseFloat(document.getElementById("charge-adjustment") ? document.getElementById("charge-adjustment").value || 0 : 0),
            customCharges: customChargesList,
            customChargesTotal: customChargesTotal,
            totalDeductions: parseFloat(document.getElementById("charge-total") ? document.getElementById("charge-total").value || 0 : 0),
            ornamentsTable: getOrnamentsTableJSON(),
            goldRate24K: goldRate24K,
            goldRate22K: goldRate22K,
            goldRate: goldRate22K,
            customerPhoto: document.getElementById("cust-photo-preview") && document.getElementById("cust-photo-preview").querySelector("img") ? document.getElementById("cust-photo-preview").querySelector("img").src : "",
            ornamentPhoto: document.getElementById("gold-photo-preview") && document.getElementById("gold-photo-preview").querySelector("img") ? document.getElementById("gold-photo-preview").querySelector("img").src : "",
            grievanceOfficer: document.getElementById("grievance-officer") ? document.getElementById("grievance-officer").value.trim() : "Amrutlal Valjibhai Chavda",
            updatedAt: new Date().toISOString()
        };

        // Save / Update in state.loans
        if (!state.loans) state.loans = [];
        if (isEditingExistingLoan && currentEditingLoanId) {
            const idx = state.loans.findIndex(l => l.id === currentEditingLoanId);
            if (idx !== -1) {
                state.loans[idx] = { ...state.loans[idx], ...loanObj };
            } else {
                state.loans.unshift(loanObj);
            }
        } else {
            state.loans.unshift(loanObj); // Add to top so it appears first in register
        }

        // Also save/update Customer Directory
        if (!state.customers) state.customers = [];
        let custIdx = -1;
        if (custNo) {
            custIdx = state.customers.findIndex(c => c.customerNo === custNo);
        }
        if (custIdx === -1 && borrowerName) {
            custIdx = state.customers.findIndex(c => c.name && c.name.toLowerCase() === borrowerName.toLowerCase());
        }
        const custData = {
            id: custIdx !== -1 ? state.customers[custIdx].id : ("CUST-" + Date.now()),
            customerNo: custNo || (custIdx !== -1 ? state.customers[custIdx].customerNo : ("CUST-" + (state.customers.length + 1))),
            name: borrowerName,
            address: address,
            mobile: mobile,
            savingsAc: savingsAc,
            dob: dob,
            age: age,
            occupation: occupation,
            religion: religion,
            caste: caste,
            nomineeName: nomineeName,
            nomineeRelation: nomineeRelation,
            isMember: isMember,
            memberNo: memberNo,
            photo: loanObj.customerPhoto || (custIdx !== -1 ? (state.customers[custIdx].photo || state.customers[custIdx].customerPhoto || "") : ""),
            customerPhoto: loanObj.customerPhoto || (custIdx !== -1 ? (state.customers[custIdx].photo || state.customers[custIdx].customerPhoto || "") : ""),
            updatedAt: new Date().toISOString()
        };
        if (custIdx !== -1) {
            state.customers[custIdx] = { ...state.customers[custIdx], ...custData };
        } else {
            state.customers.push(custData);
        }

        saveState();
        resetLoanEntryForm();
        renderDashboard();
        renderRegisterTable();
        renderCustomerMasterList();

        // Sync Loan Record & Customer Profile to Cloud Firestore
        if (window.FirebaseService && typeof window.FirebaseService.saveLoan === "function") {
            window.FirebaseService.saveLoan(loanObj).then(() => {
                console.log("[Firebase] Loan synced successfully to cloud:", loanObj.id);
            }).catch(e => console.warn("[Firebase] Loan record cloud sync error:", e));

            if (custData && typeof window.FirebaseService.saveCustomer === "function") {
                window.FirebaseService.saveCustomer(custData).catch(e => console.warn("[Firebase] Customer profile cloud sync error:", e));
            }

            if (typeof window.FirebaseService.logAuditEvent === "function") {
                const accFmt = formatLoanAccountNo(loanObj.accountNo, loanObj.branchCode, loanObj.loanType);
                window.FirebaseService.logAuditEvent("LOAN_SANCTION", `Sanctioned Loan ${accFmt} for ₹${Number(loanObj.loanAmount || 0).toLocaleString("en-IN")} to ${loanObj.borrowerName || "Borrower"}`, {
                    branchCode: loanObj.branchCode,
                    loanId: loanObj.id,
                    amount: loanObj.loanAmount
                });
            }
        }

        // Switch active tab view to Register Tab immediately
        document.querySelectorAll(".tab-content").forEach(tab => tab.classList.add("hidden"));
        document.querySelectorAll(".sidebar-nav .nav-item").forEach(b => b.classList.remove("active"));
        const regTab = document.getElementById("register-view");
        if (regTab) regTab.classList.remove("hidden");
        const regNavBtn = document.querySelector('.sidebar-nav .nav-item[data-tab="register-view"]');
        if (regNavBtn) regNavBtn.classList.add("active");

        showToast("લોન રેકોર્ડ સફળતાપૂર્વક રજીસ્ટરમાં સેવ થઈ ગયો છે!");

        setTimeout(() => {
            if (confirm("લોન રેકોર્ડ રજીસ્ટરમાં સેવ થઈ ગયો છે! શું તમારે લોન ડોક્યુમેન્ટ્સ પ્રિન્ટ કરવા છે? (Loan Documents Print)")) {
                print4PageDocument(loanObj);
            }
        }, 200);

    } catch (err) {
        console.error("Save Loan Entry Error:", err);
        alert("લોન સેવ કરતી વખતે ક્ષતિ આવી: " + err.message);
    }
}

function resetLoanEntryForm() {
    isEditingExistingLoan = false;
    currentEditingLoanId = null;

    const form = document.getElementById("gold-loan-form");
    if (form) form.reset();

    const proposalNoInp = document.getElementById("unique-proposal-no");
    const packetNoInp = document.getElementById("packet-no");
    const accountNoInp = document.getElementById("loan-ac-no");
    if (proposalNoInp) delete proposalNoInp.dataset.userEdited;
    if (packetNoInp) delete packetNoInp.dataset.userEdited;
    if (accountNoInp) delete accountNoInp.dataset.userEdited;

    const loanDateInput = document.getElementById("loan-date");
    if (loanDateInput) loanDateInput.value = new Date().toISOString().split("T")[0];

    const catSelect = document.getElementById("loan-category-select");
    if (catSelect) catSelect.value = "auto";

    const isMemberSelect = document.getElementById("is-member");
    if (isMemberSelect) isMemberSelect.value = "No";
    const memberNoGroup = document.getElementById("member-no-group");
    if (memberNoGroup) memberNoGroup.style.display = "none";

    generateNextProposalNo();
    generateNextPacketNo();

    const tbody = document.getElementById("ornaments-table-tbody");
    if (tbody) {
        tbody.innerHTML = "";
        addOrnamentRow();
    }

    // Reset previews
    const custPrev = document.getElementById("cust-photo-preview");
    const goldPrev = document.getElementById("gold-photo-preview");
    if (custPrev) custPrev.innerHTML = '<div class="photo-placeholder-content"><i class="fa-regular fa-image"></i><span>કોઈ ફોટો પસંદ કરેલ નથી<br>(No Photo Selected)</span></div>';
    if (goldPrev) goldPrev.innerHTML = '<div class="photo-placeholder-content"><i class="fa-regular fa-image"></i><span>કોઈ ફોટો પસંદ કરેલ નથી<br>(No Photo Selected)</span></div>';

    const submitBtn = document.querySelector('#gold-loan-form button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Record & Generate Voucher';

    const groInput = document.getElementById("grievance-officer");
    if (groInput) groInput.value = "Amrutlal Valjibhai Chavda";

    const valRateInput = document.getElementById("val-gold-rate-input");
    if (valRateInput) {
        valRateInput.value = getActiveGoldRate22K();
    }

    updateBranchContextUI();
    const curBranch = document.getElementById("loan-branch") ? document.getElementById("loan-branch").value : (state.currentSession ? state.currentSession.code : "99");
    generateNextProposalNo(curBranch);
    generateNextPacketNo(curBranch);
    updateLoanAmountLogic();
    calculateAllCharges();
}

function getBranchProductSeed(branchCode, productCode) {
    if (!state.settings) state.settings = {};
    if (!state.settings.branchSeeds) state.settings.branchSeeds = {};

    const rawBranch = String(branchCode || (state.currentSession ? state.currentSession.code : "99")).trim();
    const numOnly = rawBranch.replace(/\D/g, '');
    const bCode2 = numOnly ? numOnly.padStart(2, '0') : "99";
    const bCode3 = numOnly ? numOnly.padStart(3, '0') : "099";
    const bCode1 = numOnly ? String(parseInt(numOnly)) : "99";

    const branchConfig = state.settings.branchSeeds[bCode2] 
                      || state.settings.branchSeeds[bCode3] 
                      || state.settings.branchSeeds[rawBranch] 
                      || state.settings.branchSeeds[bCode1] 
                      || {};

    const acSeeds = branchConfig.accountSeeds || {};

    const pCodeRaw = String(productCode || "3725").trim();
    const pCodeMatch = pCodeRaw.match(/\d+/);
    const pCode4 = pCodeMatch ? pCodeMatch[0].padStart(4, '0') : pCodeRaw;

    if (acSeeds[pCode4] !== undefined && acSeeds[pCode4] !== null && acSeeds[pCode4] !== "") return parseInt(acSeeds[pCode4]) || 0;
    if (acSeeds[pCodeRaw] !== undefined && acSeeds[pCodeRaw] !== null && acSeeds[pCodeRaw] !== "") return parseInt(acSeeds[pCodeRaw]) || 0;
    if (pCodeMatch && acSeeds[pCodeMatch[0]] !== undefined) return parseInt(acSeeds[pCodeMatch[0]]) || 0;

    return 0;
}

function getBranchPacketSeed(branchCode) {
    if (!state.settings) state.settings = {};
    if (!state.settings.branchSeeds) state.settings.branchSeeds = {};

    const rawBranch = String(branchCode || (state.currentSession ? state.currentSession.code : "99")).trim();
    const numOnly = rawBranch.replace(/\D/g, '');
    const bCode2 = numOnly ? numOnly.padStart(2, '0') : "99";
    const bCode3 = numOnly ? numOnly.padStart(3, '0') : "099";
    const bCode1 = numOnly ? String(parseInt(numOnly)) : "99";

    const branchConfig = state.settings.branchSeeds[bCode2] 
                      || state.settings.branchSeeds[bCode3] 
                      || state.settings.branchSeeds[rawBranch] 
                      || state.settings.branchSeeds[bCode1] 
                      || {};

    if (branchConfig.lastPacketNo !== undefined && branchConfig.lastPacketNo !== null && branchConfig.lastPacketNo !== "") {
        return parseInt(branchConfig.lastPacketNo) || 0;
    }
    return parseInt(state.settings.lastPacketSeed || 0) || 0;
}

function getBranchProposalSeed(branchCode) {
    if (!state.settings) state.settings = {};
    if (!state.settings.branchSeeds) state.settings.branchSeeds = {};

    const rawBranch = String(branchCode || (state.currentSession ? state.currentSession.code : "99")).trim();
    const numOnly = rawBranch.replace(/\D/g, '');
    const bCode2 = numOnly ? numOnly.padStart(2, '0') : "99";
    const bCode3 = numOnly ? numOnly.padStart(3, '0') : "099";
    const bCode1 = numOnly ? String(parseInt(numOnly)) : "99";

    const branchConfig = state.settings.branchSeeds[bCode2] 
                      || state.settings.branchSeeds[bCode3] 
                      || state.settings.branchSeeds[rawBranch] 
                      || state.settings.branchSeeds[bCode1] 
                      || {};

    return parseInt(branchConfig.lastProposalNo || 0) || 0;
}

function getBranchFirst3Letters(branchCode) {
    const raw = branchCode ? String(branchCode).trim() : (state && state.currentSession ? String(state.currentSession.code).trim() : "99");
    const numOnly = raw.replace(/\D/g, '');
    const bCode2 = numOnly ? numOnly.padStart(2, '0') : "99";

    const BRANCH_PREFIX_MAP = {
        "01": "CBB",
        "02": "JPB",
        "03": "DPB",
        "04": "KDR",
        "05": "KSD",
        "06": "VTL",
        "07": "VTL",
        "08": "GNB",
        "09": "LIM",
        "10": "MND",
        "11": "VIS",
        "12": "JAM",
        "13": "STB",
        "14": "LTH",
        "16": "AHM",
        "17": "RJT",
        "18": "ZAN",
        "99": "HO"
    };

    if (BRANCH_PREFIX_MAP[bCode2]) {
        return BRANCH_PREFIX_MAP[bCode2];
    }
    if (BRANCH_PREFIX_MAP[raw]) {
        return BRANCH_PREFIX_MAP[raw];
    }

    const branches = (state && state.branches) || DEFAULT_BRANCHES;
    const branchObj = branches.find(b => String(b.code).replace(/\D/g, '').padStart(2, '0') === bCode2 || String(b.code) === raw)
                   || (state && state.currentSession && String(state.currentSession.code) === raw ? state.currentSession : null);

    let rawName = (branchObj && branchObj.name) ? branchObj.name : raw;
    let cleaned = rawName.replace(/^[0-9\s_-]+/, '').replace(/\bBRANCH\b/ig, '').trim();
    let letters = cleaned.replace(/[^A-Za-z]/g, '').toUpperCase();

    if (letters.length >= 3) {
        return letters.substring(0, 3);
    }
    return letters ? (letters + "XXX").substring(0, 3) : ("BR" + bCode2);
}

function generateNextProposalNo(branchCode) {
    const input = document.getElementById("unique-proposal-no");
    const rawBranch = branchCode ? String(branchCode).trim() : (document.getElementById("loan-branch") ? document.getElementById("loan-branch").value : (state.currentSession ? state.currentSession.code : "99"));
    const numOnly = String(rawBranch).replace(/\D/g, '');
    const bCode2 = numOnly ? numOnly.padStart(2, "0") : "99";
    const bCode3 = numOnly ? numOnly.padStart(3, "0") : "099";

    const baseSeed = getBranchProposalSeed(bCode2);
    const branchLoans = (state.loans || []).filter(l => {
        const lBranch = String(l.branchCode || "").replace(/\D/g, '');
        return lBranch === numOnly || lBranch === bCode2 || lBranch === bCode3;
    });

    const nextNo = baseSeed + branchLoans.length + 1;
    const branchLetters = getBranchFirst3Letters(rawBranch || bCode2);
    const currentYear = new Date().getFullYear();
    const serialFormatted = String(nextNo).padStart(4, "0");

    // Format: <branch shortname>/<current year>/<serial No.> (દા.ત. CBB/2026/0001)
    const proposalStr = `${branchLetters}/${currentYear}/${serialFormatted}`;
    if (input && !input.dataset.userEdited) input.value = proposalStr;
    return proposalStr;
}

function generateNextAccountNo(branchCode, productCode) {
    const rawBranch = branchCode ? String(branchCode).trim() : (state.currentSession ? String(state.currentSession.code).trim() : "99");
    const numOnly = rawBranch.replace(/\D/g, '');
    const bCode3 = String(numOnly || "99").padStart(3, "0");
    const bCode2 = String(numOnly || "99").padStart(2, "0");

    let pCode4 = "3725";
    if (productCode) {
        const numMatch = String(productCode).match(/\d+/);
        if (numMatch) pCode4 = numMatch[0].padStart(4, "0");
    } else {
        const catDisp = document.getElementById("loan-category-display");
        if (catDisp && catDisp.value) {
            const numMatch = catDisp.value.match(/\d+/);
            if (numMatch) pCode4 = numMatch[0].padStart(4, "0");
        }
    }

    const baseSeed = getBranchProductSeed(bCode2, pCode4);

    const branchProductLoans = (state.loans || []).filter(l => {
        const lBranch = String(l.branchCode || "").replace(/\D/g, '');
        const lProdMatch = String(l.loanType || "").match(/\d+/);
        const lProd = lProdMatch ? lProdMatch[0].padStart(4, "0") : "";
        return (lBranch === numOnly || lBranch === bCode2 || lBranch === bCode3) && (lProd === pCode4);
    });

    const nextSerial = baseSeed + branchProductLoans.length + 1;
    const serialStr = String(nextSerial).padStart(8, "0");

    // Format: 001-3527-00000001 (શાખાનો કોડ ૩ ડીજીટ - પ્રોડક્ટ કોડ ૪ ડીજીટ - સીરીયલ ૮ ડીજીટ)
    return `${bCode3}-${pCode4}-${serialStr}`;
}

function generateNextPacketNo(branchCode) {
    const input = document.getElementById("packet-no");
    const rawBranch = branchCode ? String(branchCode).trim() : (document.getElementById("loan-branch") ? document.getElementById("loan-branch").value : (state.currentSession ? state.currentSession.code : "99"));
    const numOnly = String(rawBranch).replace(/\D/g, '');
    const bCode2 = String(numOnly || "99").padStart(2, "0");
    const bCode3 = String(numOnly || "99").padStart(3, "0");

    const baseSeed = getBranchPacketSeed(bCode2);
    const branchLoans = (state.loans || []).filter(l => {
        const lBranch = String(l.branchCode || "").replace(/\D/g, '');
        return lBranch === numOnly || lBranch === bCode2 || lBranch === bCode3;
    });

    const nextNo = baseSeed + branchLoans.length + 1;
    if (input && !input.dataset.userEdited) input.value = nextNo;
    return String(nextNo);
}

// ==================== LOAN REGISTER ====================
function initRegister() {
    const filterSearch = document.getElementById("filter-search");
    const filterBranch = document.getElementById("filter-branch");
    const filterDateFrom = document.getElementById("filter-date-from");
    const filterDateTo = document.getElementById("filter-date-to");
    const filterProduct = document.getElementById("filter-product");
    const clearBtn = document.getElementById("clear-filters-btn");
    const exportBtn = document.getElementById("export-csv-btn");
    const deleteAllBtn = document.getElementById("delete-all-loans-btn");

    if (filterBranch) {
        filterBranch.innerHTML = '<option value="">-- All Branches --</option>';
        state.branches.forEach(b => {
            const opt = document.createElement("option");
            opt.value = b.code;
            opt.textContent = b.name;
            filterBranch.appendChild(opt);
        });
    }

    if (filterProduct) {
        filterProduct.innerHTML = '<option value="">-- All Schemes --</option>';
        state.products.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.code;
            opt.textContent = `${p.code} - ${p.name}`;
            filterProduct.appendChild(opt);
        });
    }

    [filterSearch, filterBranch, filterDateFrom, filterDateTo, filterProduct].forEach(el => {
        if (el) {
            el.addEventListener("input", () => renderRegisterTable());
            el.addEventListener("change", () => renderRegisterTable());
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (filterSearch) filterSearch.value = "";
            if (filterBranch) filterBranch.value = "";
            if (filterDateFrom) filterDateFrom.value = "";
            if (filterDateTo) filterDateTo.value = "";
            if (filterProduct) filterProduct.value = "";
            renderRegisterTable();
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener("click", exportRegisterCSV);
    }

    if (deleteAllBtn) {
        const isHO = isHeadOfficeSession();
        deleteAllBtn.style.display = isHO ? "inline-block" : "none";
        deleteAllBtn.addEventListener("click", () => {
            if (confirm("CRITICAL: Delete ALL loan records in the register? This cannot be undone!")) {
                const idsToDelete = (state.loans || []).map(l => String(l.id || l.loanId).trim()).filter(Boolean);
                if (!state.deletedLoanIds) state.deletedLoanIds = [];
                idsToDelete.forEach(id => {
                    if (!state.deletedLoanIds.includes(id)) state.deletedLoanIds.push(id);
                });
                state.loans = [];
                saveState();
                renderDashboard();
                renderRegisterTable();
                if (typeof renderReportsTable === "function") renderReportsTable();
                if (window.FirebaseService) {
                    idsToDelete.forEach(id => {
                        window.FirebaseService.deleteLoan(id).catch(() => {});
                    });
                }
                showToast("All loans deleted.");
            }
        });
    }
}

function renderRegisterTable() {
    const tbody = document.getElementById("register-tbody");
    const emptyMsg = document.getElementById("register-empty-msg");
    if (!tbody) return;

    tbody.innerHTML = "";

    const isHO = isHeadOfficeSession();
    const userBranch = state.currentSession ? state.currentSession.code : "99";
    const userBranchName = state.currentSession ? state.currentSession.name : "99 HEAD OFFICE";

    // Sync filter-branch dropdown options
    const filterBranchEl = document.getElementById("filter-branch");
    if (filterBranchEl) {
        filterBranchEl.disabled = false;
        if (filterBranchEl.options.length <= 1) {
            filterBranchEl.innerHTML = '<option value="">-- All Branches --</option>';
            state.branches.forEach(b => {
                const opt = document.createElement("option");
                opt.value = b.code;
                opt.textContent = b.name;
                filterBranchEl.appendChild(opt);
            });
        }
    }

    const filterSearch = document.getElementById("filter-search") ? document.getElementById("filter-search").value.toLowerCase().trim() : "";
    const filterBranch = filterBranchEl ? filterBranchEl.value : "";
    const filterDateFrom = document.getElementById("filter-date-from") ? document.getElementById("filter-date-from").value : "";
    const filterDateTo = document.getElementById("filter-date-to") ? document.getElementById("filter-date-to").value : "";
    const filterProduct = document.getElementById("filter-product") ? document.getElementById("filter-product").value : "";

    // Branch sees only its own loans by default; Head Office sees all branches
    let list = isHO ? (state.loans || []) : (state.loans || []).filter(l => isBranchMatch(l.branchCode, userBranch));

    if (isHO && filterBranch) list = list.filter(l => isBranchMatch(l.branchCode, filterBranch));
    if (filterProduct) list = list.filter(l => (l.loanType || "").includes(filterProduct));
    if (filterDateFrom) list = list.filter(l => l.date >= filterDateFrom);
    if (filterDateTo) list = list.filter(l => l.date <= filterDateTo);
    if (filterSearch) {
        list = list.filter(l => {
            const accFmt = formatLoanAccountNo(l.accountNo, l.branchCode, l.loanType);
            return (l.borrowerName && l.borrowerName.toLowerCase().includes(filterSearch)) ||
                (l.accountNo && l.accountNo.includes(filterSearch)) ||
                (accFmt && accFmt.includes(filterSearch)) ||
                (l.customerNo && l.customerNo.includes(filterSearch)) ||
                (l.packetNo && l.packetNo.includes(filterSearch));
        });
    }

    if (list.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove("hidden");
        return;
    } else {
        if (emptyMsg) emptyMsg.classList.add("hidden");
    }

    list.forEach(loan => {
        const sancAmt = Math.round(parseFloat(loan.sanctionedAmount || 0));
        const deductions = Math.round(parseFloat(loan.totalDeductions || (
            (parseFloat(loan.shareA || 0) + parseFloat(loan.shareB || 0) + parseFloat(loan.memberFee || 0) + 
             parseFloat(loan.valuerFee || 0) + parseFloat(loan.stampDuty || 0) + parseFloat(loan.serviceCharge || 0) + 
             parseFloat(loan.docCharges || 0) + parseFloat(loan.insurance || 0) + parseFloat(loan.cgst || 0) + 
             parseFloat(loan.sgst || 0) + parseFloat(loan.otherCharges || 0))
        )));
        const netPaid = sancAmt - deductions;
        const accFormatted = formatLoanAccountNo(loan.accountNo, loan.branchCode, loan.loanType);
        const canDelete = isHO || isBranchMatch(loan.branchCode, userBranch);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="white-space:nowrap;"><strong>${formatDateDMY(loan.date)}</strong></td>
            <td style="white-space:nowrap; text-align:center;"><span class="badge badge-primary">${loan.branchCode}</span></td>
            <td style="white-space:nowrap;"><strong>${accFormatted}</strong></td>
            <td style="white-space:nowrap; text-align:center;"><strong>${loan.packetNo || "-"}</strong></td>
            <td style="min-width:160px; font-weight:700;">${loan.borrowerName}</td>
            <td style="white-space:nowrap; text-align:center;"><span class="badge badge-gold">${loan.loanType || "GW-3725"}</span></td>
            <td style="text-align:right; white-space:nowrap; font-weight:800;">₹ ${sancAmt.toLocaleString("en-IN")}</td>
            <td style="text-align:right; white-space:nowrap;">${parseFloat(loan.goldWeight || 0).toFixed(3)} g</td>
            <td style="text-align:right; white-space:nowrap; color:#b91c1c;">₹ ${deductions.toLocaleString("en-IN")}</td>
            <td style="text-align:right; font-weight:800; color:var(--success-dark); white-space:nowrap;">₹ ${netPaid.toLocaleString("en-IN")}</td>
            <td style="text-align:center; white-space:nowrap; width:280px; min-width:280px; padding:6px 8px;">
                <div style="display:inline-flex; gap:6px; justify-content:center; align-items:center; flex-wrap:nowrap;">
                    <button class="btn btn-sm btn-gold print-doc-btn" data-id="${loan.id}" title="Loan Documents (૪-૫ પેઇજ)" style="display:inline-flex; align-items:center; gap:5px; padding:4px 10px; font-size:11.5px; font-weight:700; border-radius:5px; white-space:nowrap; height:29px; cursor:pointer;">
                        <i class="fa-solid fa-file-pdf"></i> Loan Documents
                    </button>
                    <button class="btn btn-sm print-sanction-btn" data-id="${loan.id}" style="background:#0284c7; color:#ffffff; font-weight:700; border:none; border-radius:5px; padding:4px 10px; font-size:11.5px; white-space:nowrap; height:29px; cursor:pointer;">
                        <i class="fa-solid fa-print"></i> Sanction
                    </button>
                    <button class="btn-icon-blue edit-loan-btn" data-id="${loan.id}" title="Edit Loan Entry" style="width:29px; height:29px; display:inline-flex; align-items:center; justify-content:center; border-radius:5px;"><i class="fa-solid fa-pen-to-square"></i></button>
                    ${canDelete ? `<button class="btn-icon-red delete-loan-btn" data-id="${loan.id}" title="Delete Loan Entry" style="width:29px; height:29px; display:inline-flex; align-items:center; justify-content:center; border-radius:5px;"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".print-doc-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const l = state.loans.find(x => x.id === id);
            if (l) print4PageDocument(l);
        });
    });

    tbody.querySelectorAll(".print-sanction-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const l = state.loans.find(x => x.id === id);
            if (l) printSanctionLetter(l);
        });
    });

    tbody.querySelectorAll(".edit-loan-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            editLoanRecord(id);
        });
    });

    tbody.querySelectorAll(".delete-loan-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            deleteLoanRecord(id);
        });
    });
}

function editLoanRecord(id) {
    const loan = state.loans.find(l => l.id === id);
    if (!loan) return;

    if (!isHeadOfficeSession()) {
        const userBranch = state.currentSession ? state.currentSession.code : "";
        if (!isBranchMatch(loan.branchCode, userBranch)) {
            alert("તમે ફક્ત તમારી પોતાની શાખાની જ લોન એન્ટ્રીમાં સુધારો કરી શકો છો.");
            return;
        }
    }

    isEditingExistingLoan = true;
    currentEditingLoanId = loan.id;

    // Switch to Loan Entry tab
    const entryTab = document.querySelector('.sidebar-nav .nav-item[data-tab="entry-view"]');
    if (entryTab) entryTab.click();

    // Populate Fields
    document.getElementById("unique-proposal-no").value = loan.loanNo || "";
    document.getElementById("loan-date").value = loan.date || "";
    document.getElementById("loan-branch").value = loan.branchCode || "99";
    document.getElementById("cust-no").value = loan.customerNo || "";

    const isMem = (loan.isMember === true || loan.isMember === "Yes" || (loan.memberNo && loan.memberNo.trim() !== ""));
    const isMemberSelect = document.getElementById("is-member");
    const memberNoGroup = document.getElementById("member-no-group");
    const memberNoInput = document.getElementById("member-no");

    if (isMemberSelect) isMemberSelect.value = isMem ? "Yes" : "No";
    if (memberNoGroup) memberNoGroup.style.display = isMem ? "block" : "none";
    if (memberNoInput) memberNoInput.value = loan.memberNo || "";

    document.getElementById("cust-name").value = loan.borrowerName || "";
    document.getElementById("cust-address").value = loan.address || "";
    document.getElementById("cust-mobile").value = loan.mobile || "";
    document.getElementById("cust-savings-ac").value = loan.savingsAc || "";
    if (document.getElementById("cust-dob")) document.getElementById("cust-dob").value = loan.dob || "";
    document.getElementById("cust-age").value = loan.age || (loan.dob ? calculateAgeFromDOB(loan.dob, loan.date) : "");
    document.getElementById("cust-occupation").value = loan.occupation || "";
    document.getElementById("cust-religion").value = loan.religion || "";
    document.getElementById("cust-caste").value = loan.caste || "";
    document.getElementById("cust-nominee-name").value = loan.nomineeName || "";
    document.getElementById("cust-nominee-relation").value = loan.nomineeRelation || "";
    document.getElementById("valuer-select").value = loan.valuerName || "";
    document.getElementById("loan-amount").value = loan.sanctionedAmount || "";
    document.getElementById("loan-ac-no").value = formatLoanAccountNo(loan.accountNo, loan.branchCode, loan.loanType);
    document.getElementById("packet-no").value = loan.packetNo || "";
    document.getElementById("loan-purpose").value = loan.purpose || "";

    const catSelect = document.getElementById("loan-category-select");
    if (catSelect) {
        if ((loan.loanType || "").includes("3553")) {
            catSelect.value = "3553";
        } else {
            catSelect.value = "3527";
        }
    }

    if (document.getElementById("loan-emi-amount")) {
        document.getElementById("loan-emi-amount").value = loan.emiAmount || "";
    }
    if (document.getElementById("loan-installments")) {
        document.getElementById("loan-installments").value = loan.installments || 36;
    }
    if (document.getElementById("charge-adjustment")) {
        document.getElementById("charge-adjustment").value = loan.otherCharges || "";
    }
    if (document.getElementById("grievance-officer")) {
        document.getElementById("grievance-officer").value = loan.grievanceOfficer || "Amrutlal Valjibhai Chavda";
    }

    const valRateInput = document.getElementById("val-gold-rate-input");
    if (valRateInput) {
        valRateInput.value = loan.goldRate22K || loan.goldRate || (loan.goldRate24K ? Math.round(loan.goldRate24K * (22 / 24)) : getActiveGoldRate22K());
    }

    // Populate Ornaments Table
    const tbody = document.getElementById("ornaments-table-tbody");
    if (tbody) {
        tbody.innerHTML = "";
        if (loan.ornamentsTable && loan.ornamentsTable.length > 0) {
            loan.ornamentsTable.forEach(row => addOrnamentRow(row));
        } else {
            addOrnamentRow({ grossGm: loan.goldWeight, netGm: loan.goldWeight });
        }
    }

    // Photos
    const custPrev = document.getElementById("cust-photo-preview");
    const goldPrev = document.getElementById("gold-photo-preview");
    if (loan.customerPhoto && custPrev) {
        custPrev.innerHTML = `<div class="uploaded-photo-wrap"><img src="${loan.customerPhoto}" alt="Customer Photo"><div class="uploaded-photo-badge"><i class="fa-solid fa-circle-check"></i> ફોટો અપલોડ થયેલ છે</div></div>`;
    } else if (custPrev) {
        custPrev.innerHTML = '<div class="photo-placeholder-content"><i class="fa-regular fa-image"></i><span>કોઈ ફોટો પસંદ કરેલ નથી<br>(No Photo Selected)</span></div>';
    }
    if (loan.ornamentPhoto && goldPrev) {
        goldPrev.innerHTML = `<div class="uploaded-photo-wrap"><img src="${loan.ornamentPhoto}" alt="Gold Photo"><div class="uploaded-photo-badge"><i class="fa-solid fa-circle-check"></i> ફોટો અપલોડ થયેલ છે</div></div>`;
    } else if (goldPrev) {
        goldPrev.innerHTML = '<div class="photo-placeholder-content"><i class="fa-regular fa-image"></i><span>કોઈ ફોટો પસંદ કરેલ નથી<br>(No Photo Selected)</span></div>';
    }

    updateLoanAmountLogic();
    calculateAllCharges();

    const submitBtn = document.querySelector('#gold-loan-form button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Loan Record';

    showToast("Loan details loaded for modification.");
}

function deleteLoanRecord(id) {
    if (!id) return;
    const cleanId = String(id).trim();
    const loan = state.loans.find(l => String(l.id).trim() === cleanId || String(l.loanId).trim() === cleanId);
    if (!loan) {
        console.warn("Loan not found for deletion:", id);
        return;
    }

    if (!isHeadOfficeSession()) {
        const userBranch = state.currentSession ? state.currentSession.code : "";
        if (!isBranchMatch(loan.branchCode, userBranch)) {
            alert("તમે ફક્ત તમારી પોતાની શાખાની જ લોન એન્ટ્રી કાઢી શકો છો. (You can only delete loan records from your own branch.)");
            return;
        }
    }

    const accFormatted = formatLoanAccountNo(loan.accountNo, loan.branchCode, loan.loanType);
    const borrower = loan.borrowerName || "Unnamed";

    if (confirm(`શું તમે આ ગોલ્ડ લોન એન્ટ્રી (${accFormatted} - ${borrower}) કાયમ માટે કાઢી નાંખવા માંગો છો?\n(Are you sure you want to permanently delete this loan record?)`)) {
        const targetId = String(loan.id || cleanId).trim();

        // 1. Maintain list of deleted IDs to prevent background sync resurrection
        if (!state.deletedLoanIds) state.deletedLoanIds = [];
        if (!state.deletedLoanIds.includes(targetId)) {
            state.deletedLoanIds.push(targetId);
            if (state.deletedLoanIds.length > 500) {
                state.deletedLoanIds = state.deletedLoanIds.slice(-500);
            }
        }

        // 2. Remove immediately from local state
        state.loans = state.loans.filter(l => {
            const lid = String(l.id || l.loanId || "").trim();
            return lid !== targetId && lid !== cleanId;
        });

        saveState();
        renderDashboard();
        renderRegisterTable();
        if (typeof renderReportsTable === "function") renderReportsTable();

        // 3. Delete from Firebase Cloud Firestore
        if (window.FirebaseService) {
            window.FirebaseService.deleteLoan(targetId)
                .then(() => console.log("[Firebase] Loan permanently deleted:", targetId))
                .catch(e => console.warn("[Firebase] Loan delete cloud notice:", e));

            if (typeof window.FirebaseService.logAuditEvent === "function") {
                window.FirebaseService.logAuditEvent("LOAN_DELETE", `Deleted loan ${accFormatted} for borrower ${borrower} (Amount: ₹${Number(loan.loanAmount || 0).toLocaleString("en-IN")})`, {
                    branchCode: loan.branchCode,
                    loanId: targetId
                });
            }
        }

        showToast("લોન એન્ટ્રી ડિલીટ થઈ ગઈ છે. (Loan entry deleted.)");
    }
}

function exportRegisterCSV() {
    const isHO = isHeadOfficeSession();
    const userBranch = state.currentSession ? state.currentSession.code : "99";
    const exportLoans = isHO ? (state.loans || []) : (state.loans || []).filter(l => isBranchMatch(l.branchCode, userBranch));

    if (exportLoans.length === 0) {
        alert("No loan records to export.");
        return;
    }

    let csv = "ID,Date,Branch,AccountNo,PacketNo,CustomerNo,BorrowerName,Mobile,Address,Scheme,SanctionedAmount,GoldWeight,ValuationAmount,ShareA,ShareB,MemberFee,ValuerFee,StampDuty,ServiceCharge,DocCharges,Insurance,CGST,SGST,TotalDeductions,NetPaid\n";

    exportLoans.forEach(l => {
        const sanc = Math.round(parseFloat(l.sanctionedAmount || 0));
        const totalDeduct = Math.round(parseFloat(l.totalDeductions || (
            (parseFloat(l.shareA || 0) + parseFloat(l.shareB || 0) + parseFloat(l.memberFee || 0) + 
             parseFloat(l.valuerFee || 0) + parseFloat(l.stampDuty || 0) + parseFloat(l.serviceCharge || 0) + 
             parseFloat(l.docCharges || 0) + parseFloat(l.insurance || 0) + parseFloat(l.cgst || 0) + 
             parseFloat(l.sgst || 0) + parseFloat(l.otherCharges || 0))
        )));
        const net = sanc - totalDeduct;
        const accFormatted = formatLoanAccountNo(l.accountNo, l.branchCode, l.loanType);

        const row = [
            `"${l.id}"`,
            `"${l.date}"`,
            `"${l.branchCode}"`,
            `"${accFormatted}"`,
            `"${l.packetNo || ""}"`,
            `"${l.customerNo || ""}"`,
            `"${(l.borrowerName || "").replace(/"/g, '""')}"`,
            `"${l.mobile || ""}"`,
            `"${(l.address || "").replace(/"/g, '""')}"`,
            `"${l.loanType || ""}"`,
            sanc,
            parseFloat(l.goldWeight || 0).toFixed(3),
            Math.round(parseFloat(l.valuationAmount || 0)),
            parseFloat(l.shareA || 0),
            parseFloat(l.shareB || 0),
            parseFloat(l.memberFee || 0),
            parseFloat(l.valuerFee || 0),
            parseFloat(l.stampDuty || 0),
            parseFloat(l.serviceCharge || 0),
            parseFloat(l.docCharges || 0),
            parseFloat(l.insurance || 0),
            parseFloat(l.cgst || 0),
            parseFloat(l.sgst || 0),
            totalDeduct,
            net
        ];
        csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `JCCB_GoldLoans_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==================== DAILY GL EXPENSE CASH CREDIT VOUCHERS ====================

const GL_EXPENSE_HEADS = [
    {
        key: "shareA",
        glCode: "GL-150040",
        glName: "Share Application Money (Group-A)",
        nameGu: "શેર ગ્રુપ-A",
        getValue: (loan) => parseFloat(loan.shareA || 0),
        getNarration: (count, accStr) => `આજ રોજ સોના ધિરાણના ખુલેલ ${count > 1 ? 'કુલ ' + count + ' ખાતાઓના' : 'ખાતા નં. ' + accStr + ' ના'} શેર ગ્રુપ-A ની રકમના રોકડા જમા લેતા${count > 1 && accStr ? ' (ખાતા નં. ' + accStr + ')' : ''}`
    },
    {
        key: "shareB",
        glCode: "GL-150058",
        glName: "Share Application Money (Group-B)",
        nameGu: "શેર ગ્રુપ-B",
        getValue: (loan) => parseFloat(loan.shareB || 0),
        getNarration: (count, accStr) => `આજ રોજ સોના ધિરાણના ખુલેલ ${count > 1 ? 'કુલ ' + count + ' ખાતાઓના' : 'ખાતા નં. ' + accStr + ' ના'} શેર ગ્રુપ-B ની રકમના રોકડા જમા લેતા${count > 1 && accStr ? ' (ખાતા નં. ' + accStr + ')' : ''}`
    },
    {
        key: "memberFee",
        glCode: "GL-160067",
        glName: "Member Fee",
        nameGu: "સભાસદ પ્રવેશ ફી",
        getValue: (loan) => parseFloat(loan.memberFee || 0),
        getNarration: (count, accStr) => `આજ રોજ સોના ધિરાણના ખુલેલ ${count > 1 ? 'કુલ ' + count + ' ખાતાઓના' : 'ખાતા નં. ' + accStr + ' ના'} સભાસદ પ્રવેશ ફી ની રકમના રોકડા જમા લેતા${count > 1 && accStr ? ' (ખાતા નં. ' + accStr + ')' : ''}`
    },
    {
        key: "stampDuty",
        glCode: "GL-370065",
        glName: "Adhesive Stamp Advance",
        nameGu: "સ્ટેમ્પ ડ્યુટી",
        getValue: (loan) => parseFloat(loan.stampDuty || 0),
        getNarration: (count, accStr) => `આજ રોજ સોના ધિરાણના ખુલેલ ${count > 1 ? 'કુલ ' + count + ' ખાતાઓના' : 'ખાતા નં. ' + accStr + ' ના'} સ્ટેમ્પ ડ્યુટી ની રકમના રોકડા જમા લેતા${count > 1 && accStr ? ' (ખાતા નં. ' + accStr + ')' : ''}`
    },
    {
        key: "serviceCharge",
        glCode: "GL-160063",
        glName: "Service Charge Income",
        nameGu: "સર્વિસ ચાર્જ",
        getValue: (loan) => parseFloat(loan.serviceCharge || 0),
        getNarration: (count, accStr) => `આજ રોજ સોના ધિરાણના ખુલેલ ${count > 1 ? 'કુલ ' + count + ' ખાતાઓના' : 'ખાતા નં. ' + accStr + ' ના'} સર્વિસ ચાર્જ ની રકમના રોકડા જમા લેતા${count > 1 && accStr ? ' (ખાતા નં. ' + accStr + ')' : ''}`
    },
    {
        key: "docCharges",
        glCode: "GL-160181",
        glName: "Document Charge Income",
        nameGu: "ડોક્યુમેન્ટ ચાર્જ",
        getValue: (loan) => parseFloat(loan.docCharges || 0),
        getNarration: (count, accStr) => `આજ રોજ સોના ધિરાણના ખુલેલ ${count > 1 ? 'કુલ ' + count + ' ખાતાઓના' : 'ખાતા નં. ' + accStr + ' ના'} ડોક્યુમેન્ટ ચાર્જ ની રકમના રોકડા જમા લેતા${count > 1 && accStr ? ' (ખાતા નં. ' + accStr + ')' : ''}`
    },
    {
        key: "insurance",
        glCode: "GL-150050",
        glName: "Insurance Deposits",
        nameGu: "ઇન્સ્યોરન્સ ડિપોઝીટ",
        getValue: (loan) => parseFloat(loan.insurance || 0),
        getNarration: (count, accStr) => `આજ રોજ સોના ધિરાણના ખુલેલ ${count > 1 ? 'કુલ ' + count + ' ખાતાઓના' : 'ખાતા નં. ' + accStr + ' ના'} ઇન્સ્યોરન્સ ડિપોઝીટ ની રકમના રોકડા જમા લેતા${count > 1 && accStr ? ' (ખાતા નં. ' + accStr + ')' : ''}`
    },
    {
        key: "sgst",
        glCode: "GL-370260",
        glName: "SGST Payable",
        nameGu: "એસ જી એસ ટી (SGST)",
        getValue: (loan) => parseFloat(loan.sgst || 0),
        getNarration: (count, accStr) => `આજ રોજ સોના ધિરાણના ખુલેલ ${count > 1 ? 'કુલ ' + count + ' ખાતાઓના' : 'ખાતા નં. ' + accStr + ' ના'} એસ જી એસ ટી ની રકમના રોકડા જમા લેતા${count > 1 && accStr ? ' (ખાતા નં. ' + accStr + ')' : ''}`
    },
    {
        key: "cgst",
        glCode: "GL-370261",
        glName: "CGST Payable",
        nameGu: "સી જી એસ ટી (CGST)",
        getValue: (loan) => parseFloat(loan.cgst || 0),
        getNarration: (count, accStr) => `આજ રોજ સોના ધિરાણના ખુલેલ ${count > 1 ? 'કુલ ' + count + ' ખાતાઓના' : 'ખાતા નં. ' + accStr + ' ના'} સી જી એસ ટી ની રકમના રોકડા જમા લેતા${count > 1 && accStr ? ' (ખાતા નં. ' + accStr + ')' : ''}`
    },
    {
        key: "otherCharges",
        glCode: "GL-160199",
        glName: "Other Charges Income",
        nameGu: "અન્ય ચાર્જ",
        getValue: (loan) => parseFloat(loan.otherCharges || 0),
        getNarration: (count, accStr) => `આજ રોજ સોના ધિરાણના ખુલેલ ${count > 1 ? 'કુલ ' + count + ' ખાતાઓના' : 'ખાતા નં. ' + accStr + ' ના'} અન્ય ચાર્જ પેટે જમા${count > 1 && accStr ? ' (ખાતા નં. ' + accStr + ')' : ''}`
    }
];

function getDailyAggregatedVouchersData(date, branchFilter = "") {
    const isHO = state.currentSession && state.currentSession.code === "99";
    const userBranch = state.currentSession ? state.currentSession.code : "99";
    const effectiveBranch = isHO ? branchFilter : userBranch;

    const loans = state.loans.filter(l => {
        if (l.date !== date) return false;
        if (effectiveBranch && l.branchCode !== effectiveBranch) return false;
        return true;
    });

    const aggregatedList = [];

    // 1. Standard GL Heads
    GL_EXPENSE_HEADS.forEach(head => {
        let total = 0;
        let count = 0;
        const accs = [];

        loans.forEach(loan => {
            const val = head.getValue(loan);
            if (val > 0) {
                total += val;
                count++;
                const accFmt = formatLoanAccountNo(loan.accountNo, loan.branchCode, loan.loanType);
                if (accFmt && !accs.includes(accFmt)) {
                    accs.push(accFmt);
                }
            }
        });

        if (total > 0) {
            const accStr = accs.length <= 4 ? accs.join(", ") : (accs.slice(0, 3).join(", ") + ` વગેરે કુલ ${accs.length}`);
            aggregatedList.push({
                glCode: head.glCode,
                glName: head.glName,
                nameGu: head.nameGu,
                amount: Math.round(total * 100) / 100,
                count: count,
                accounts: accs,
                narration: head.getNarration(count, accStr)
            });
        }
    });

    // 2. Valuer Fees grouped by Valuer
    const valuerMap = {};
    loans.forEach(loan => {
        const vFee = parseFloat(loan.valuerFee || 0);
        if (vFee > 0) {
            const vName = (loan.valuerName || "Approved Valuer").trim();
            if (!valuerMap[vName]) {
                valuerMap[vName] = { total: 0, count: 0, accs: [] };
            }
            valuerMap[vName].total += vFee;
            valuerMap[vName].count++;
            const accFmt = formatLoanAccountNo(loan.accountNo, loan.branchCode, loan.loanType);
            if (accFmt && !valuerMap[vName].accs.includes(accFmt)) {
                valuerMap[vName].accs.push(accFmt);
            }
        }
    });

    Object.keys(valuerMap).forEach(vName => {
        const vData = valuerMap[vName];
        const valObj = (state.valuers || []).find(v => v.name && v.name.trim().toLowerCase() === vName.toLowerCase());
        const valAc = (valObj && valObj.savingsAc) ? `A/C: ${valObj.savingsAc}` : "VALUER A/C";
        const accStr = vData.accs.length <= 4 ? vData.accs.join(", ") : (vData.accs.slice(0, 3).join(", ") + ` વગેરે કુલ ${vData.accs.length}`);

        aggregatedList.push({
            glCode: valAc,
            glName: vName,
            nameGu: "વેલ્યુએશન ફી",
            amount: Math.round(vData.total * 100) / 100,
            count: vData.count,
            accounts: vData.accs,
            narration: `આજ રોજ સોના ધિરાણના ખુલેલ ${vData.count > 1 ? 'કુલ ' + vData.count + ' ખાતાઓના' : 'ખાતા નં. ' + accStr + ' ના'} સોનાના દાગીના વેલ્યુએશન ફી પેટે જમા${vData.count > 1 && accStr ? ' (ખાતા નં. ' + accStr + ')' : ''}`
        });
    });

    // 3. Custom Charges
    const customMap = {};
    loans.forEach(loan => {
        if (Array.isArray(loan.customCharges)) {
            loan.customCharges.forEach(cc => {
                const ccAmt = parseFloat(cc.amount || 0);
                if (ccAmt > 0) {
                    const cKey = cc.glCode || cc.name || "GL-OTHER";
                    if (!customMap[cKey]) {
                        customMap[cKey] = {
                            glCode: cc.glCode || "GL-OTHER",
                            glName: cc.name || "Custom Charge",
                            nameGu: cc.nameGu || cc.name || "કસ્ટમ ચાર્જ",
                            total: 0,
                            count: 0,
                            accs: []
                        };
                    }
                    customMap[cKey].total += ccAmt;
                    customMap[cKey].count++;
                    const accFmt = formatLoanAccountNo(loan.accountNo, loan.branchCode, loan.loanType);
                    if (accFmt && !customMap[cKey].accs.includes(accFmt)) {
                        customMap[cKey].accs.push(accFmt);
                    }
                }
            });
        }
    });

    Object.keys(customMap).forEach(cKey => {
        const cData = customMap[cKey];
        const accStr = cData.accs.length <= 4 ? cData.accs.join(", ") : (cData.accs.slice(0, 3).join(", ") + ` વગેરે કુલ ${cData.accs.length}`);
        aggregatedList.push({
            glCode: cData.glCode,
            glName: cData.glName,
            nameGu: cData.nameGu,
            amount: Math.round(cData.total * 100) / 100,
            count: cData.count,
            accounts: cData.accs,
            narration: `આજ રોજ સોના ધિરાણના ખુલેલ ${cData.count > 1 ? 'કુલ ' + cData.count + ' ખાતાઓના' : 'ખાતા નં. ' + accStr + ' ના'} ${cData.nameGu} પેટે જમા${cData.count > 1 && accStr ? ' (ખાતા નં. ' + accStr + ')' : ''}`
        });
    });

    // Branch title
    let displayBranchName = "HEAD OFFICE";
    if (effectiveBranch) {
        const bObj = (state.branches || []).find(b => b.code === effectiveBranch);
        displayBranchName = bObj ? bObj.name : `BRANCH ${effectiveBranch}`;
    }

    return {
        date,
        branchCode: effectiveBranch,
        branchName: displayBranchName,
        loansCount: loans.length,
        vouchers: aggregatedList
    };
}

function initDailyVouchers() {
    const dateInput = document.getElementById("voucher-date-select");
    const branchSelect = document.getElementById("voucher-branch-select");
    const loadBtn = document.getElementById("load-vouchers-btn");
    const printBtn = document.getElementById("print-vouchers-btn");

    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split("T")[0];
    }

    if (branchSelect) {
        const isHO = state.currentSession && state.currentSession.code === "99";
        const curVal = branchSelect.value;
        branchSelect.innerHTML = '<option value="">-- All Branches --</option>';
        (state.branches || []).forEach(b => {
            const opt = document.createElement("option");
            opt.value = b.code;
            opt.textContent = b.name;
            branchSelect.appendChild(opt);
        });
        if (!isHO && state.currentSession) {
            branchSelect.value = state.currentSession.code;
            branchSelect.disabled = true;
        } else if (curVal) {
            branchSelect.value = curVal;
        }
    }

    if (dateInput) {
        dateInput.addEventListener("change", () => renderDailyVouchersSummary());
    }

    if (branchSelect) {
        branchSelect.addEventListener("change", () => renderDailyVouchersSummary());
    }

    if (loadBtn) {
        loadBtn.addEventListener("click", () => renderDailyVouchersSummary());
    }

    if (printBtn) {
        printBtn.addEventListener("click", () => {
            const date = document.getElementById("voucher-date-select") ? document.getElementById("voucher-date-select").value : new Date().toISOString().split("T")[0];
            const branchFilter = document.getElementById("voucher-branch-select") ? document.getElementById("voucher-branch-select").value : "";

            const data = getDailyAggregatedVouchersData(date, branchFilter);
            if (data.loansCount === 0) {
                alert("તારીખ " + formatDateDMY(date) + " ના રોજ કોઈ લોન રેકોર્ડ મળેલ નથી.");
                return;
            }
            if (data.vouchers.length === 0) {
                alert("તારીખ " + formatDateDMY(date) + " ના રોજ કોઈ ખર્ચ/કપાતની રકમ નોંધાયેલ નથી.");
                return;
            }

            const fullHtml = generateDailyVouchers3in1HTML(date, branchFilter);
            printContent(fullHtml);
        });
    }

    renderDailyVouchersSummary();
}

function renderDailyVouchersSummary() {
    const tbody = document.getElementById("daily-vouchers-tbody");
    const tfoot = document.getElementById("daily-vouchers-tfoot");
    const badge = document.getElementById("daily-loans-count-badge");
    const dateInput = document.getElementById("voucher-date-select");
    const branchSelect = document.getElementById("voucher-branch-select");

    const date = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split("T")[0];
    const branchFilter = branchSelect ? branchSelect.value : "";

    if (!tbody) return;

    const data = getDailyAggregatedVouchersData(date, branchFilter);

    if (badge) {
        badge.textContent = `${data.loansCount} Loan${data.loansCount === 1 ? '' : 's'} (${data.vouchers.length} Vouchers)`;
        badge.className = data.loansCount > 0 ? "badge badge-gold" : "badge badge-secondary";
    }

    tbody.innerHTML = "";

    if (data.vouchers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:30px 15px; color:#64748b;">
                    <i class="fa-solid fa-receipt" style="font-size:24px; margin-bottom:8px; display:block; opacity:0.5;"></i>
                    <strong>તારીખ ${formatDateDMY(date)} ના રોજ કોઈ ખર્ચ/કપાત વાળી લોન નોંધાયેલ નથી.</strong>
                </td>
            </tr>
        `;
        if (tfoot) tfoot.innerHTML = "";
        return;
    }

    let grandTotal = 0;

    data.vouchers.forEach(v => {
        grandTotal += v.amount;
        const words = formatAmountToGujaratiWords(v.amount);
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong style="color:var(--primary);">${v.glCode}</strong></td>
            <td>
                <strong>${v.glName}</strong>
                <div style="font-size:11.5px; color:#555; margin-top:2px;">${v.nameGu || ""}</div>
            </td>
            <td style="text-align:center;"><span class="badge badge-primary">${v.count} Accounts</span></td>
            <td style="font-weight:800; font-size:13px; text-align:right; color:#0f1c3f;">₹ ${v.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="font-size:11.5px; color:#1e293b; font-style:italic;">અંકે રૂપિયા ${words} પૂરા</td>
        `;
        tbody.appendChild(tr);
    });

    if (tfoot) {
        const grandWords = formatAmountToGujaratiWords(grandTotal);
        tfoot.innerHTML = `
            <tr style="background:#f8fafc; border-top:2px solid #0f1c3f; font-weight:800;">
                <td colspan="3" style="text-align:right; font-size:13px; font-weight:800;">કુલ સરવાળો (Grand Total) :</td>
                <td style="text-align:right; font-size:14px; font-weight:900; color:#0f1c3f;">₹ ${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="font-size:11.5px; font-weight:700; color:#0f1c3f;">અંકે રૂપિયા ${grandWords} પૂરા</td>
            </tr>
        `;
    }
}

// ==================== COMPREHENSIVE REPORTS & ANALYSIS CENTER ====================

function initReports() {
    const fromDateEl = document.getElementById("report-filter-date-from");
    const toDateEl = document.getElementById("report-filter-date-to");
    const branchEl = document.getElementById("report-filter-branch");
    const productEl = document.getElementById("report-filter-product");
    const valuerEl = document.getElementById("report-filter-valuer");
    const searchEl = document.getElementById("report-filter-search");

    const genBtn = document.getElementById("report-btn-generate");
    const resetBtn = document.getElementById("report-btn-reset");
    const excelBtn = document.getElementById("report-btn-excel");
    const printBtn = document.getElementById("report-btn-print-pdf");

    // Populate Branches dropdown
    if (branchEl && state.branches) {
        const isHO = isHeadOfficeSession();
        const userBranch = state.currentSession ? state.currentSession.code : "99";
        if (!isHO) {
            branchEl.innerHTML = `<option value="${userBranch}">${state.currentSession ? state.currentSession.name : userBranch}</option>`;
            branchEl.value = userBranch;
            branchEl.disabled = true;
        } else {
            branchEl.disabled = false;
            const curVal = branchEl.value;
            branchEl.innerHTML = '<option value="">-- All Branches (તમામ શાખાઓ) --</option>';
            state.branches.forEach(b => {
                const opt = document.createElement("option");
                opt.value = b.code;
                opt.textContent = b.name;
                branchEl.appendChild(opt);
            });
            if (curVal) branchEl.value = curVal;
        }
    }

    // Populate Schemes dropdown
    if (productEl && state.products) {
        const curVal = productEl.value;
        productEl.innerHTML = '<option value="">-- All Schemes --</option>';
        state.products.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.code;
            opt.textContent = `${p.code} - ${p.name}`;
            productEl.appendChild(opt);
        });
        if (curVal) productEl.value = curVal;
    }

    // Populate Valuers dropdown
    if (valuerEl && state.valuers) {
        const curVal = valuerEl.value;
        valuerEl.innerHTML = '<option value="">-- All Valuers --</option>';
        state.valuers.forEach(v => {
            const opt = document.createElement("option");
            opt.value = v.name;
            opt.textContent = v.name;
            valuerEl.appendChild(opt);
        });
        if (curVal) valuerEl.value = curVal;
    }

    // Event listeners
    if (genBtn) genBtn.addEventListener("click", () => renderReportsTable());
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (fromDateEl) fromDateEl.value = "";
            if (toDateEl) toDateEl.value = "";
            if (productEl) productEl.value = "";
            if (valuerEl) valuerEl.value = "";
            if (searchEl) searchEl.value = "";
            const isHO = isHeadOfficeSession();
            if (branchEl && isHO) branchEl.value = "";
            renderReportsTable();
        });
    }
    if (excelBtn) excelBtn.addEventListener("click", () => exportReportToExcel());
    if (printBtn) printBtn.addEventListener("click", () => printReportPDF());

    [fromDateEl, toDateEl, branchEl, productEl, valuerEl, searchEl].forEach(el => {
        if (el) {
            el.addEventListener("input", () => renderReportsTable());
            el.addEventListener("change", () => renderReportsTable());
        }
    });

    renderReportsTable();
}

function getFilteredReportLoans() {
    const isHO = isHeadOfficeSession();
    const userBranch = state.currentSession ? String(state.currentSession.code).replace(/\D/g, '') : "99";

    const fromDate = document.getElementById("report-filter-date-from") ? document.getElementById("report-filter-date-from").value : "";
    const toDate = document.getElementById("report-filter-date-to") ? document.getElementById("report-filter-date-to").value : "";
    const branchVal = document.getElementById("report-filter-branch") ? document.getElementById("report-filter-branch").value : "";
    const productVal = document.getElementById("report-filter-product") ? document.getElementById("report-filter-product").value : "";
    const valuerVal = document.getElementById("report-filter-valuer") ? document.getElementById("report-filter-valuer").value : "";
    const searchVal = document.getElementById("report-filter-search") ? document.getElementById("report-filter-search").value.toLowerCase().trim() : "";

    const bMatch = (loanBCode, targetBCode) => {
        if (!loanBCode || !targetBCode) return false;
        const a = String(loanBCode).replace(/\D/g, '');
        const b = String(targetBCode).replace(/\D/g, '');
        return a === b || a.padStart(2, '0') === b.padStart(2, '0') || a.padStart(3, '0') === b.padStart(3, '0');
    };

    let list = isHO ? (state.loans || []) : (state.loans || []).filter(l => bMatch(l.branchCode, userBranch));

    if (isHO && branchVal) {
        list = list.filter(l => bMatch(l.branchCode, branchVal));
    }
    if (fromDate) {
        list = list.filter(l => (l.date || "") >= fromDate);
    }
    if (toDate) {
        list = list.filter(l => (l.date || "") <= toDate);
    }
    if (productVal) {
        list = list.filter(l => (l.loanType || "").includes(productVal));
    }
    if (valuerVal) {
        list = list.filter(l => (l.valuerName || "").trim().toLowerCase() === valuerVal.trim().toLowerCase());
    }
    if (searchVal) {
        list = list.filter(l => {
            const accFmt = formatLoanAccountNo(l.accountNo, l.branchCode, l.loanType);
            return (l.borrowerName && l.borrowerName.toLowerCase().includes(searchVal)) ||
                   (l.accountNo && String(l.accountNo).toLowerCase().includes(searchVal)) ||
                   (accFmt && accFmt.toLowerCase().includes(searchVal)) ||
                   (l.customerNo && String(l.customerNo).toLowerCase().includes(searchVal)) ||
                   (l.packetNo && String(l.packetNo).toLowerCase().includes(searchVal)) ||
                   (l.loanNo && String(l.loanNo).toLowerCase().includes(searchVal)) ||
                   (l.mobile && String(l.mobile).includes(searchVal));
        });
    }

    // Sort by date desc, then accountNo desc
    list = [...list].sort((a, b) => {
        if (a.date !== b.date) return (b.date || "").localeCompare(a.date || "");
        return String(b.accountNo || "").localeCompare(String(a.accountNo || ""));
    });

    return list;
}

// Helper to get precise Gross and Net Gold weight from loan or ornamentsTable
function getLoanGrossAndNetWeight(loan) {
    let grossWt = 0;
    let netWt = 0;

    if (Array.isArray(loan.ornamentsTable) && loan.ornamentsTable.length > 0) {
        loan.ornamentsTable.forEach(row => {
            const gGm = parseFloat(row.grossGm || 0);
            const gMg = parseFloat(row.grossMg || 0);
            const nGm = parseFloat(row.netGm || 0);
            const nMg = parseFloat(row.netMg || 0);

            const rowGross = gGm + (gMg / 1000);
            const rowNet = nGm + (nMg / 1000);

            grossWt += (rowGross > 0 ? rowGross : (rowNet > 0 ? rowNet : 0));
            netWt += (rowNet > 0 ? rowNet : (rowGross > 0 ? rowGross : 0));
        });
    } else {
        grossWt = parseFloat(loan.grossWeight || loan.goldWeight || 0);
        netWt = parseFloat(loan.goldWeight || loan.grossWeight || 0);
    }

    if (grossWt <= 0 && parseFloat(loan.goldWeight || 0) > 0) {
        grossWt = parseFloat(loan.goldWeight);
    }
    if (netWt <= 0 && parseFloat(loan.goldWeight || 0) > 0) {
        netWt = parseFloat(loan.goldWeight);
    }

    return {
        grossWeight: grossWt,
        netWeight: netWt
    };
}

function renderReportsTable() {
    const tbody = document.getElementById("reports-tbody");
    const tfoot = document.getElementById("reports-tfoot");
    const emptyMsg = document.getElementById("reports-empty-msg");
    const countBadge = document.getElementById("report-records-count");
    const filterBadge = document.getElementById("report-filter-summary-badge");

    if (!tbody) return;

    const list = getFilteredReportLoans();

    // Populate live KPI metric totals
    let totalCount = list.length;
    let totalSanctioned = 0;
    let totalGrossWt = 0;
    let totalNetWt = 0;
    let totalValuation = 0;
    let totalDeductions = 0;
    let totalNetPaid = 0;

    list.forEach(l => {
        const sanc = parseFloat(l.sanctionedAmount || 0);
        const wts = getLoanGrossAndNetWeight(l);
        const gross = wts.grossWeight;
        const net = wts.netWeight;

        const valAmt = parseFloat(l.valuationAmount || (sanc * 1.33) || 0);
        const ded = parseFloat(l.totalDeductions || (calculateLoanTotalDeductions(l)));
        const netPaid = sanc - ded;

        totalSanctioned += sanc;
        totalGrossWt += gross;
        totalNetWt += net;
        totalValuation += valAmt;
        totalDeductions += ded;
        totalNetPaid += netPaid;
    });

    // Update KPI Card DOM
    if (document.getElementById("rep-kpi-count")) document.getElementById("rep-kpi-count").textContent = totalCount;
    if (document.getElementById("rep-kpi-sanctioned")) document.getElementById("rep-kpi-sanctioned").textContent = "₹ " + Math.round(totalSanctioned).toLocaleString("en-IN");
    if (document.getElementById("rep-kpi-weight")) document.getElementById("rep-kpi-weight").textContent = totalNetWt.toFixed(3) + " g";
    if (document.getElementById("rep-kpi-valuation")) document.getElementById("rep-kpi-valuation").textContent = "₹ " + Math.round(totalValuation).toLocaleString("en-IN");
    if (document.getElementById("rep-kpi-deductions")) document.getElementById("rep-kpi-deductions").textContent = "₹ " + Math.round(totalDeductions).toLocaleString("en-IN");
    if (document.getElementById("rep-kpi-net")) document.getElementById("rep-kpi-net").textContent = "₹ " + Math.round(totalNetPaid).toLocaleString("en-IN");
    if (countBadge) countBadge.textContent = totalCount;

    // Filter badge text
    if (filterBadge) {
        const fromDate = document.getElementById("report-filter-date-from") ? document.getElementById("report-filter-date-from").value : "";
        const toDate = document.getElementById("report-filter-date-to") ? document.getElementById("report-filter-date-to").value : "";
        if (fromDate && toDate) {
            filterBadge.textContent = `${formatDateDMY(fromDate)} થી ${formatDateDMY(toDate)}`;
        } else if (fromDate) {
            filterBadge.textContent = `From ${formatDateDMY(fromDate)}`;
        } else if (toDate) {
            filterBadge.textContent = `Up to ${formatDateDMY(toDate)}`;
        } else {
            filterBadge.textContent = `All Recorded Loans (${totalCount})`;
        }
    }

    tbody.innerHTML = "";

    if (list.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove("hidden");
        if (tfoot) tfoot.innerHTML = "";
        return;
    } else {
        if (emptyMsg) emptyMsg.classList.add("hidden");
    }

    list.forEach((loan, idx) => {
        const sancAmt = Math.round(parseFloat(loan.sanctionedAmount || 0));
        const wts = getLoanGrossAndNetWeight(loan);
        const grossWt = wts.grossWeight;
        const netWt = wts.netWeight;
        let ornSummary = "";

        if (Array.isArray(loan.ornamentsTable) && loan.ornamentsTable.length > 0) {
            const ornParts = [];
            loan.ornamentsTable.forEach(row => {
                const qty = row.qty || 1;
                const name = row.name || "ORNAMENT";
                const karat = row.karat || "22K";
                ornParts.push(`${qty}x ${name} (${karat})`);
            });
            ornSummary = ornParts.join(", ");
        } else {
            ornSummary = loan.ornamentsDescription || `${grossWt.toFixed(3)}g Gold`;
        }

        const valAmt = Math.round(parseFloat(loan.valuationAmount || (sancAmt * 1.33) || 0));
        const deductions = Math.round(parseFloat(loan.totalDeductions || calculateLoanTotalDeductions(loan)));
        const netPaid = sancAmt - deductions;
        const accFormatted = formatLoanAccountNo(loan.accountNo, loan.branchCode, loan.loanType);

        const bObj = (state.branches || []).find(b => b.code === loan.branchCode);
        const branchDisplay = bObj ? bObj.code : (loan.branchCode || "-");

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="text-align:center; font-weight:700;">${idx + 1}</td>
            <td style="white-space:nowrap;">${formatDateDMY(loan.date)}</td>
            <td style="text-align:center;"><span class="badge badge-secondary" title="${bObj ? bObj.name : ''}">${branchDisplay}</span></td>
            <td><strong style="color:var(--primary);">${accFormatted}</strong></td>
            <td><strong>${loan.packetNo || "-"}</strong></td>
            <td>
                <strong>${loan.borrowerName || "-"}</strong>
                ${loan.mobile ? `<div style="font-size:10.5px; color:#64748b;"><i class="fa-solid fa-phone" style="font-size:9px;"></i> ${loan.mobile}</div>` : ''}
            </td>
            <td style="text-align:center;"><span class="badge badge-gold" style="font-size:10.5px;">${loan.loanType || "GW-3725"}</span></td>
            <td style="max-width:200px; font-size:11px; color:#334155; line-height:1.3;">${ornSummary}</td>
            <td style="text-align:right; font-weight:600;">${grossWt.toFixed(3)}</td>
            <td style="text-align:right; font-weight:700; color:#d97706;">${netWt.toFixed(3)}</td>
            <td style="text-align:right; font-weight:600;">₹ ${valAmt.toLocaleString("en-IN")}</td>
            <td style="text-align:right; font-weight:800; color:#0f172a;">₹ ${sancAmt.toLocaleString("en-IN")}</td>
            <td style="text-align:right; color:#b91c1c; font-weight:600;">₹ ${deductions.toLocaleString("en-IN")}</td>
            <td style="text-align:right; font-weight:800; color:#15803d;">₹ ${netPaid.toLocaleString("en-IN")}</td>
            <td style="font-size:11px; white-space:nowrap;">${loan.valuerName || "-"}</td>
            <td style="text-align:center; white-space:nowrap;">
                <div style="display:flex; gap:4px; justify-content:center;">
                    <button class="btn btn-sm btn-gold rep-print-doc-btn" data-id="${loan.id}" title="Loan Documents" style="padding:3px 7px; font-size:11px;">
                        <i class="fa-solid fa-file-pdf"></i> Docs
                    </button>
                    <button class="btn btn-sm rep-print-sanc-btn" data-id="${loan.id}" style="background:#0284c7; color:#fff; border:none; border-radius:3px; padding:3px 7px; font-size:11px;" title="Customer Letter">
                        <i class="fa-solid fa-file-contract"></i> Letter
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Grand Totals in Footer
    if (tfoot) {
        tfoot.innerHTML = `
            <tr style="background:#0f1c3f; color:#ffffff; font-weight:900; font-size:12px;">
                <td colspan="7" style="text-align:right; padding:10px 12px; font-size:12.5px;">કુલ ગ્રાન્ડ સરવાળો (TOTAL ${totalCount} LOANS) :</td>
                <td>-</td>
                <td style="text-align:right; padding:10px 8px;">${totalGrossWt.toFixed(3)} g</td>
                <td style="text-align:right; padding:10px 8px; color:#fde047;">${totalNetWt.toFixed(3)} g</td>
                <td style="text-align:right; padding:10px 8px;">₹ ${Math.round(totalValuation).toLocaleString("en-IN")}</td>
                <td style="text-align:right; padding:10px 8px; color:#38bdf8;">₹ ${Math.round(totalSanctioned).toLocaleString("en-IN")}</td>
                <td style="text-align:right; padding:10px 8px; color:#fca5a5;">₹ ${Math.round(totalDeductions).toLocaleString("en-IN")}</td>
                <td style="text-align:right; padding:10px 8px; color:#86efac;">₹ ${Math.round(totalNetPaid).toLocaleString("en-IN")}</td>
                <td colspan="2"></td>
            </tr>
        `;
    }

    // Attach quick print action listeners
    tbody.querySelectorAll(".rep-print-doc-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const l = state.loans.find(x => x.id === btn.getAttribute("data-id"));
            if (l) print4PageDocument(l);
        });
    });

    tbody.querySelectorAll(".rep-print-sanc-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const l = state.loans.find(x => x.id === btn.getAttribute("data-id"));
            if (l) printSanctionLetter(l);
        });
    });
}

function calculateLoanTotalDeductions(loan) {
    let tot = 0;
    tot += parseFloat(loan.shareA || 0);
    tot += parseFloat(loan.shareB || 0);
    tot += parseFloat(loan.memberFee || 0);
    tot += parseFloat(loan.stampDuty || 0);
    tot += parseFloat(loan.serviceCharge || 0);
    tot += parseFloat(loan.docCharges || 0);
    tot += parseFloat(loan.insurance || 0);
    tot += parseFloat(loan.sgst || 0);
    tot += parseFloat(loan.cgst || 0);
    tot += parseFloat(loan.valuerCharge || loan.valuerFee || 0);
    tot += parseFloat(loan.otherCharges || 0);
    if (Array.isArray(loan.customCharges)) {
        loan.customCharges.forEach(c => tot += parseFloat(c.amount || 0));
    }
    return tot;
}

function exportReportToExcel() {
    try {
        const list = getFilteredReportLoans();
        if (!list || list.length === 0) {
            const hasAny = state.loans && state.loans.length > 0;
            if (hasAny) {
                alert("પસંદ કરેલ ફિલ્ટર મુજબ કોઈ લોન રેકોર્ડ મળેલ નથી. કૃપા કરીને 'Reset' બટન દબાવો અથવા ફિલ્ટર બદલો (No matching loan records for current filter).");
            } else {
                alert("સિસ્ટમમાં હજુ કોઈ લોન રેકોર્ડ સેવ થયેલ નથી (No loan records found in system).");
            }
            return;
        }

        const fromDate = document.getElementById("report-filter-date-from") ? document.getElementById("report-filter-date-from").value : "";
        const toDate = document.getElementById("report-filter-date-to") ? document.getElementById("report-filter-date-to").value : "";
        const branchVal = document.getElementById("report-filter-branch") ? document.getElementById("report-filter-branch").value : "";
        const prodVal = document.getElementById("report-filter-product") ? document.getElementById("report-filter-product").value : "";

        let branchTitle = "All Branches";
        if (branchVal) {
            const b = (state.branches || []).find(x => x.code === branchVal);
            branchTitle = b ? b.name : `Branch ${branchVal}`;
        } else if (state.currentSession && state.currentSession.code !== "99") {
            branchTitle = state.currentSession.name;
        }

        const dateScope = (fromDate && toDate) ? `${formatDateDMY(fromDate)} To ${formatDateDMY(toDate)}` : "All Time Records";

        const rows = [];
        rows.push(["THE JUNAGADH COMMERCIAL CO-OPERATIVE BANK LTD."]);
        rows.push(["GOLD LOAN DISBURSEMENT & ANALYSIS REPORT (ગોલ્ડ લોન ધિરાણ પત્રક)"]);
        rows.push([`Period: ${dateScope}`, `Branch: ${branchTitle}`, `Scheme: ${prodVal || 'All Schemes'}`, `Generated On: ${new Date().toLocaleString()}`]);
        rows.push([]);

        const headers = [
            "Sr No", "Loan Date", "Branch Code", "Branch Name", "Account No", "Proposal No", "Packet No",
            "Borrower Name", "Mobile No", "Customer No", "Member Status", "Member No", "Scheme / Product",
            "Interest Rate %", "Ornaments Details", "Gross Wt (g)", "Net Gold Wt (g)", "Valuation Rate (₹/10g)",
            "Market Valuation (₹)", "Sanctioned Loan (₹)", "Share Group A (₹)", "Share Group B (₹)", "Member Fee (₹)",
            "Stamp Duty (₹)", "Service Charge (₹)", "Doc Charges (₹)", "Insurance (₹)", "SGST (₹)", "CGST (₹)",
            "Valuer Fee (₹)", "Other Charges (₹)", "Total Deductions (₹)", "Net Disbursed (₹)", "Valuer Name",
            "Savings A/C No", "Loan Purpose"
        ];
        rows.push(headers);

        let sumGross = 0, sumNet = 0, sumValuation = 0, sumSanctioned = 0;
        let sumShareA = 0, sumShareB = 0, sumMemFee = 0, sumStamp = 0, sumService = 0, sumDoc = 0;
        let sumIns = 0, sumSGST = 0, sumCGST = 0, sumValuerFee = 0, sumOther = 0, sumDeductions = 0, sumNetPaid = 0;

        list.forEach((l, idx) => {
            const bObj = (state.branches || []).find(b => b.code === l.branchCode);
            const bName = bObj ? bObj.name : `BRANCH ${l.branchCode || ''}`;
            const accFmt = formatLoanAccountNo(l.accountNo, l.branchCode, l.loanType);

            let ornDesc = "";
            const wts = getLoanGrossAndNetWeight(l);
            const grossWt = wts.grossWeight;
            const netWt = wts.netWeight;

            if (Array.isArray(l.ornamentsTable) && l.ornamentsTable.length > 0) {
                const ornParts = [];
                l.ornamentsTable.forEach(row => {
                    const qty = row.qty || 1;
                    const name = row.name || "ORNAMENT";
                    const karat = row.karat || "22K";
                    const rowGross = parseFloat(row.grossGm || 0) + (parseFloat(row.grossMg || 0) / 1000);
                    const rowNet = parseFloat(row.netGm || 0) + (parseFloat(row.netMg || 0) / 1000);
                    ornParts.push(`${qty}x ${name} (${karat}) [G:${rowGross.toFixed(3)}g, N:${rowNet.toFixed(3)}g]`);
                });
                ornDesc = ornParts.join("; ");
            } else {
                ornDesc = l.ornamentsDescription || `${grossWt.toFixed(3)}g Gold`;
            }

            const sanc = Math.round(parseFloat(l.sanctionedAmount || 0));
            const valAmt = Math.round(parseFloat(l.valuationAmount || (sanc * 1.33) || 0));
            const shareA = parseFloat(l.shareA || 0);
            const shareB = parseFloat(l.shareB || 0);
            const memFee = parseFloat(l.memberFee || 0);
            const stamp = parseFloat(l.stampDuty || 0);
            const service = parseFloat(l.serviceCharge || 0);
            const doc = parseFloat(l.docCharges || 0);
            const ins = parseFloat(l.insurance || 0);
            const sgst = parseFloat(l.sgst || 0);
            const cgst = parseFloat(l.cgst || 0);
            const valFee = parseFloat(l.valuerCharge || l.valuerFee || 0);
            const other = parseFloat(l.otherCharges || 0);
            const totDed = Math.round(parseFloat(l.totalDeductions || calculateLoanTotalDeductions(l)));
            const netPaid = sanc - totDed;

            sumGross += grossWt;
            sumNet += netWt;
            sumValuation += valAmt;
            sumSanctioned += sanc;
            sumShareA += shareA;
            sumShareB += shareB;
            sumMemFee += memFee;
            sumStamp += stamp;
            sumService += service;
            sumDoc += doc;
            sumIns += ins;
            sumSGST += sgst;
            sumCGST += cgst;
            sumValuerFee += valFee;
            sumOther += other;
            sumDeductions += totDed;
            sumNetPaid += netPaid;

            rows.push([
                idx + 1,
                l.date || "",
                l.branchCode || "",
                bName,
                accFmt,
                l.proposalNo || l.loanNo || "",
                l.packetNo || "",
                l.borrowerName || "",
                l.mobile || "",
                l.customerNo || "",
                l.isMember ? "Yes" : "No",
                l.memberNo || "",
                l.loanType || "GW-3725",
                l.interestRate || "11.50%",
                ornDesc,
                parseFloat(grossWt.toFixed(3)),
                parseFloat(netWt.toFixed(3)),
                parseFloat(l.goldRate24K || l.goldRate || 72000),
                valAmt,
                sanc,
                shareA,
                shareB,
                memFee,
                stamp,
                service,
                doc,
                ins,
                sgst,
                cgst,
                valFee,
                other,
                totDed,
                netPaid,
                l.valuerName || "",
                l.savingsAc || "",
                l.purpose || "GOLD LOAN"
            ]);
        });

        rows.push([
            "TOTAL", "", "", `TOTAL ${list.length} LOANS`, "", "", "", "", "", "", "", "", "", "", "",
            parseFloat(sumGross.toFixed(3)),
            parseFloat(sumNet.toFixed(3)),
            "",
            Math.round(sumValuation),
            Math.round(sumSanctioned),
            Math.round(sumShareA),
            Math.round(sumShareB),
            Math.round(sumMemFee),
            Math.round(sumStamp),
            Math.round(sumService),
            Math.round(sumDoc),
            Math.round(sumIns),
            Math.round(sumSGST),
            Math.round(sumCGST),
            Math.round(sumValuerFee),
            Math.round(sumOther),
            Math.round(sumDeductions),
            Math.round(sumNetPaid),
            "", "", ""
        ]);

        const filename = `JCCB_Gold_Loan_Report_${new Date().toISOString().split("T")[0]}.xlsx`;

        if (typeof XLSX !== "undefined") {
            const ws = XLSX.utils.aoa_to_sheet(rows);
            ws['!cols'] = [
                { wch: 6 }, { wch: 12 }, { wch: 8 }, { wch: 22 }, { wch: 20 }, { wch: 16 }, { wch: 10 },
                { wch: 26 }, { wch: 13 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
                { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 15 }, { wch: 16 }, { wch: 12 },
                { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
                { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 16 }, { wch: 24 }, { wch: 16 },
                { wch: 20 }
            ];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Gold Loans Report");
            XLSX.writeFile(wb, filename);
            showToast("Excel (.xlsx) ફાઇલ સફળતાપૂર્વક ડાઉનલોડ થઈ ગઈ છે.");
            return;
        }

        // CSV Fallback
        let csv = "\uFEFF";
        rows.forEach(r => {
            const line = r.map(c => `"${String(c !== undefined && c !== null ? c : '').replace(/"/g, '""')}"`).join(",");
            csv += line + "\n";
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename.replace(".xlsx", ".csv"));
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("CSV/Excel ફાઇલ સફળતાપૂર્વક ડાઉનલોડ થઈ ગઈ છે.");
    } catch (err) {
        console.error("Export Report Error:", err);
        alert("Excel એક્સપોર્ટ કરતી વખતે ક્ષતિ આવી: " + err.message);
    }
}

async function printReportPDF() {
    try {
        const list = getFilteredReportLoans();
        if (!list || list.length === 0) {
            const hasAny = state.loans && state.loans.length > 0;
            if (hasAny) {
                alert("પસંદ કરેલ ફિલ્ટર મુજબ પ્રિન્ટ કરવા માટે કોઈ લોન રેકોર્ડ મળેલ નથી. કૃપા કરીને 'Reset' બટન દબાવો અથવા ફિલ્ટર બદલો (No matching loan records to print).");
            } else {
                alert("સિસ્ટમમાં હજુ કોઈ લોન રેકોર્ડ સેવ થયેલ નથી (No loan records found in system).");
            }
            return;
        }

        const fromDate = document.getElementById("report-filter-date-from") ? document.getElementById("report-filter-date-from").value : "";
        const toDate = document.getElementById("report-filter-date-to") ? document.getElementById("report-filter-date-to").value : "";
        const branchVal = document.getElementById("report-filter-branch") ? document.getElementById("report-filter-branch").value : "";

        let branchTitle = "ALL BRANCHES";
        if (branchVal) {
            const b = (state.branches || []).find(x => x.code === branchVal);
            branchTitle = b ? b.name : `BRANCH ${branchVal}`;
        } else if (state.currentSession && state.currentSession.code !== "99") {
            branchTitle = state.currentSession.name;
        }

        const dateScope = (fromDate && toDate) ? `${formatDateDMY(fromDate)} થી ${formatDateDMY(toDate)}` : "તમામ લોન રેકોર્ડ્સ (ALL RECORDS)";

        let sumGross = 0;
        let sumNet = 0;
        let sumValuation = 0;
        let sumSanctioned = 0;
        let sumDeductions = 0;
        let sumNetPaid = 0;

        let rowsHtml = "";

        list.forEach((l, idx) => {
            const bObj = (state.branches || []).find(b => b.code === l.branchCode);
            const bCode = bObj ? bObj.code : (l.branchCode || "");
            const accFmt = formatLoanAccountNo(l.accountNo, l.branchCode, l.loanType);

            let ornDesc = "";
            const wts = getLoanGrossAndNetWeight(l);
            const grossWt = wts.grossWeight;
            const netWt = wts.netWeight;

            if (Array.isArray(l.ornamentsTable) && l.ornamentsTable.length > 0) {
                const ornParts = [];
                l.ornamentsTable.forEach(row => {
                    const qty = row.qty || 1;
                    const name = row.name || "ORN";
                    const karat = row.karat || "22K";
                    ornParts.push(`${qty}x ${name} (${karat})`);
                });
                ornDesc = ornParts.join(", ");
            } else {
                ornDesc = l.ornamentsDescription || `${grossWt.toFixed(3)}g`;
            }

            const sanc = Math.round(parseFloat(l.sanctionedAmount || 0));
            const valAmt = Math.round(parseFloat(l.valuationAmount || (sanc * 1.33) || 0));
            const totDed = Math.round(parseFloat(l.totalDeductions || calculateLoanTotalDeductions(l)));
            const netPaid = sanc - totDed;

            sumGross += grossWt;
            sumNet += netWt;
            sumValuation += valAmt;
            sumSanctioned += sanc;
            sumDeductions += totDed;
            sumNetPaid += netPaid;

            rowsHtml += `
                <tr style="border-bottom: 1px solid #cbd5e1; min-height: 28px; height: 28px; font-size: 9.5px; page-break-inside: avoid;">
                    <td style="text-align:center; font-weight:700; border:1px solid #94a3b8; padding: 4px 2px; width:8mm;">${idx + 1}</td>
                    <td style="white-space:nowrap; text-align:center; border:1px solid #94a3b8; padding: 4px 2px; width:21mm;">${formatDateDMY(l.date)}</td>
                    <td style="text-align:center; border:1px solid #94a3b8; padding: 4px 2px; font-weight:600; width:9mm;">${bCode}</td>
                    <td style="border:1px solid #94a3b8; font-weight:700; padding: 4px 3px; white-space:nowrap; font-family:monospace; font-size:9.5px; width:33mm;">${accFmt}</td>
                    <td style="text-align:center; border:1px solid #94a3b8; font-weight:700; padding: 4px 2px; width:13mm;">${l.packetNo || "-"}</td>
                    <td style="border:1px solid #94a3b8; font-weight:700; padding: 4px 4px; word-break:break-word; width:38mm; line-height:1.25;">${l.borrowerName || "-"}</td>
                    <td style="text-align:center; border:1px solid #94a3b8; padding: 4px 2px; font-size:9px; width:17mm;">${l.loanType || "GW-3725"}</td>
                    <td style="border:1px solid #94a3b8; font-size:9px; padding: 4px 4px; word-break:break-word; width:36mm; line-height:1.25;">${ornDesc}</td>
                    <td style="text-align:right; border:1px solid #94a3b8; padding: 4px 4px; font-variant-numeric: tabular-nums; white-space:nowrap; width:15mm;">${grossWt.toFixed(3)}</td>
                    <td style="text-align:right; border:1px solid #94a3b8; font-weight:700; padding: 4px 4px; font-variant-numeric: tabular-nums; white-space:nowrap; width:15mm;">${netWt.toFixed(3)}</td>
                    <td style="text-align:right; border:1px solid #94a3b8; padding: 4px 4px; font-variant-numeric: tabular-nums; white-space:nowrap; width:20mm;">${valAmt.toLocaleString("en-IN")}</td>
                    <td style="text-align:right; border:1px solid #94a3b8; font-weight:800; padding: 4px 4px; font-variant-numeric: tabular-nums; white-space:nowrap; width:20mm;">${sanc.toLocaleString("en-IN")}</td>
                    <td style="text-align:right; border:1px solid #94a3b8; padding: 4px 4px; font-variant-numeric: tabular-nums; white-space:nowrap; width:15mm;">${totDed.toLocaleString("en-IN")}</td>
                    <td style="text-align:right; border:1px solid #94a3b8; font-weight:800; color:#0f1c3f; padding: 4px 4px; font-variant-numeric: tabular-nums; white-space:nowrap; width:20mm;">${netPaid.toLocaleString("en-IN")}</td>
                    <td style="font-size:9px; padding: 4px 4px; word-break:break-word; border:1px solid #94a3b8; width:27mm; line-height:1.25;">${l.valuerName || "-"}</td>
                </tr>
            `;
        });

        const printHtml = `
            <div class="print-report-landscape-container" style="font-family: 'Outfit', 'Noto Sans Gujarati', 'Segoe UI', Tahoma, sans-serif; color: #000000; width: 100%; max-width: 100%; margin: 0; box-sizing: border-box; padding: 2mm 0;">
                <style>
                    @page {
                        size: A4 landscape !important;
                        margin: 5mm 6mm !important;
                    }
                    @media print {
                        @page {
                            size: A4 landscape !important;
                            margin: 5mm 6mm !important;
                        }
                        html, body {
                            width: 297mm !important;
                            height: 210mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #ffffff !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        #print-area {
                            display: block !important;
                            width: 297mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        .print-report-landscape-container {
                            width: 297mm !important;
                            max-width: 297mm !important;
                            padding: 4mm 6mm !important;
                            box-sizing: border-box !important;
                        }
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        table-layout: fixed;
                    }
                </style>

                <!-- Bank Title Header -->
                <div style="border-bottom: 2.5px solid #0f1c3f; padding-bottom: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <img src="${LOGO_SRC}" alt="JCCB" style="height: 48px; width: 48px; object-fit: contain;">
                        <div>
                            <div style="font-size: 17px; font-weight: 900; color: #0f1c3f; letter-spacing: 0.5px;">ધી જૂનાગઢ કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ.</div>
                            <div style="font-size: 12.5px; font-weight: 800; color: #b45309; letter-spacing: 0.3px;">THE JUNAGADH COMMERCIAL CO-OPERATIVE BANK LTD.</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 15px; font-weight: 900; color: #0f1c3f; text-transform: uppercase;">ગોલ્ડ લોન ધિરાણ વિશ્લેષણ પત્રક (GOLD LOAN MIS REPORT)</div>
                        <div style="font-size: 11px; color: #334155; font-weight: 700; margin-top: 3px;">
                            શાખા: <strong>${branchTitle}</strong> | સમયગાળો: <strong>${dateScope}</strong> | પ્રિન્ટ તારીખ: <strong>${formatDateDMY(new Date().toISOString().split("T")[0])}</strong>
                        </div>
                    </div>
                </div>

                <!-- Mini Filter & KPI Row -->
                <div style="display: flex; justify-content: space-between; background: #f8fafc; border: 1.5px solid #0f1c3f; border-radius: 4px; padding: 6px 12px; margin-bottom: 8px; font-size: 10.5px; font-weight: 700;">
                    <div>કુલ ખાતાઓ: <strong style="font-size:11.5px; color:#0f1c3f;">${list.length}</strong></div>
                    <div>કુલ ગ્રોસ વજન: <strong>${sumGross.toFixed(3)} g</strong></div>
                    <div>કુલ નેટ સોનું: <strong style="color:#d97706;">${sumNet.toFixed(3)} g</strong></div>
                    <div>કુલ બજાર કિંમત: <strong>₹ ${Math.round(sumValuation).toLocaleString("en-IN")}</strong></div>
                    <div>કુલ મંજૂર રકમ: <strong style="color:#0f1c3f; font-size:12px;">₹ ${Math.round(sumSanctioned).toLocaleString("en-IN")}</strong></div>
                    <div>કુલ કપાત: <strong style="color:#b91c1c;">₹ ${Math.round(sumDeductions).toLocaleString("en-IN")}</strong></div>
                    <div>કુલ નેટ ચૂકવણી: <strong style="color:#15803d; font-size:12px;">₹ ${Math.round(sumNetPaid).toLocaleString("en-IN")}</strong></div>
                </div>

                <!-- Itemized Table -->
                <table style="border: 1.5px solid #0f1c3f; font-size: 9.5px; width: 100%; border-collapse: collapse; table-layout: fixed;">
                    <thead>
                        <tr style="background-color: #0f1c3f; color: #ffffff; height: 30px; text-align: left; font-size: 9.5px; font-weight: 800;">
                            <th style="width: 8mm; text-align: center; border: 1px solid #475569; padding: 4px 2px;">#</th>
                            <th style="width: 21mm; text-align: center; border: 1px solid #475569; padding: 4px 2px;">Date</th>
                            <th style="width: 9mm; text-align: center; border: 1px solid #475569; padding: 4px 2px;">Br</th>
                            <th style="width: 33mm; border: 1px solid #475569; padding: 4px 3px;">Account No</th>
                            <th style="width: 13mm; text-align: center; border: 1px solid #475569; padding: 4px 2px;">Pkt No</th>
                            <th style="width: 38mm; border: 1px solid #475569; padding: 4px 4px;">Borrower Name</th>
                            <th style="width: 17mm; text-align: center; border: 1px solid #475569; padding: 4px 2px;">Scheme</th>
                            <th style="width: 36mm; border: 1px solid #475569; padding: 4px 4px;">Ornaments Breakdown</th>
                            <th style="width: 15mm; text-align: right; border: 1px solid #475569; padding: 4px 4px;">Gross (g)</th>
                            <th style="width: 15mm; text-align: right; border: 1px solid #475569; padding: 4px 4px;">Net (g)</th>
                            <th style="width: 20mm; text-align: right; border: 1px solid #475569; padding: 4px 4px;">Valuation (₹)</th>
                            <th style="width: 20mm; text-align: right; border: 1px solid #475569; padding: 4px 4px;">Loan Amt (₹)</th>
                            <th style="width: 15mm; text-align: right; border: 1px solid #475569; padding: 4px 4px;">Deduct (₹)</th>
                            <th style="width: 20mm; text-align: right; border: 1px solid #475569; padding: 4px 4px;">Net Paid (₹)</th>
                            <th style="width: 27mm; border: 1px solid #475569; padding: 4px 4px;">Valuer</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #f1f5f9; border-top: 2px solid #0f1c3f; height: 30px; font-weight: 900; font-size: 10px;">
                            <td colspan="8" style="text-align: right; padding-right: 8px; border: 1px solid #94a3b8; font-weight: 900;">કુલ ગ્રાન્ડ સરવાળો (GRAND TOTAL) :</td>
                            <td style="text-align: right; border: 1px solid #94a3b8; padding: 4px 4px; font-variant-numeric: tabular-nums; white-space:nowrap;">${sumGross.toFixed(3)}</td>
                            <td style="text-align: right; border: 1px solid #94a3b8; padding: 4px 4px; color:#b45309; font-variant-numeric: tabular-nums; white-space:nowrap;">${sumNet.toFixed(3)}</td>
                            <td style="text-align: right; border: 1px solid #94a3b8; padding: 4px 4px; font-variant-numeric: tabular-nums; white-space:nowrap;">${Math.round(sumValuation).toLocaleString("en-IN")}</td>
                            <td style="text-align: right; border: 1px solid #94a3b8; padding: 4px 4px; color:#0f1c3f; font-variant-numeric: tabular-nums; white-space:nowrap;">${Math.round(sumSanctioned).toLocaleString("en-IN")}</td>
                            <td style="text-align: right; border: 1px solid #94a3b8; padding: 4px 4px; color:#b91c1c; font-variant-numeric: tabular-nums; white-space:nowrap;">${Math.round(sumDeductions).toLocaleString("en-IN")}</td>
                            <td style="text-align: right; border: 1px solid #94a3b8; padding: 4px 4px; color:#15803d; font-variant-numeric: tabular-nums; white-space:nowrap;">${Math.round(sumNetPaid).toLocaleString("en-IN")}</td>
                            <td style="border: 1px solid #94a3b8;"></td>
                        </tr>
                    </tfoot>
                </table>

                <!-- Signatures Section -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 32px; padding: 0 10px; font-size: 11px; font-weight: 800; color: #0f1c3f;">
                    <div style="text-align: center; width: 170px; border-top: 1.5px dashed #475569; padding-top: 4px;">
                        તૈયાર કરનાર<br><span style="font-size:9.5px; font-weight:600; color:#64748b;">(Prepared By)</span>
                    </div>
                    <div style="text-align: center; width: 170px; border-top: 1.5px dashed #475569; padding-top: 4px;">
                        તપાસનાર ક્લાર્ક / ઓફિસર<br><span style="font-size:9.5px; font-weight:600; color:#64748b;">(Checked By)</span>
                    </div>
                    <div style="text-align: center; width: 170px; border-top: 1.5px dashed #475569; padding-top: 4px;">
                        શાખા પ્રબંધક<br><span style="font-size:9.5px; font-weight:600; color:#64748b;">(Branch Manager)</span>
                    </div>
                    <div style="text-align: center; width: 170px; border-top: 1.5px dashed #475569; padding-top: 4px;">
                        જનરલ મેનેજર / CEO<br><span style="font-size:9.5px; font-weight:600; color:#64748b;">(General Manager / HO)</span>
                    </div>
                </div>
            </div>
        `;

        await printContent(printHtml, true);
    } catch (err) {
        console.error("Print Report Error:", err);
        alert("રીપોર્ટ પ્રિન્ટ કરતી વખતે ક્ષતિ આવી: " + err.message);
    }
}

// Global scope registration
window.exportReportToExcel = exportReportToExcel;
window.printReportPDF = printReportPDF;
window.renderReportsTable = renderReportsTable;

// ==================== MASTERS: RULES MASTER (EDITABLE & HO CONTROLLED) ====================
function initRulesMaster() {
    const saveBtn = document.getElementById("btn-save-rules");
    const resetBtn = document.getElementById("btn-reset-rules");

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const isHO = state.currentSession && state.currentSession.code === "99";
            if (!isHO) {
                alert("Authorization Denied: Only Head Office (99) can modify Banking Rules.");
                return;
            }

            state.rules = {
                membership: {
                    nonMemberLimit: parseFloat(document.getElementById("rule-mem-limit").value || 99999),
                    shareGroupB: parseFloat(document.getElementById("rule-share-b").value || 50),
                    shareGroupA: parseFloat(document.getElementById("rule-share-a").value || 500),
                    memberFee: parseFloat(document.getElementById("rule-member-fee").value || 25)
                },
                valuation: {
                    slab1Max: 25000,
                    slab1Amt: parseFloat(document.getElementById("rule-val-slab1").value || 100),
                    slab2Max: 50000,
                    slab2Amt: parseFloat(document.getElementById("rule-val-slab2").value || 150),
                    slab3Max: 100000,
                    slab3Amt: parseFloat(document.getElementById("rule-val-slab3").value || 250),
                    ratePercent: parseFloat(document.getElementById("rule-val-rate").value || 0.25),
                    slab4MaxCap: parseFloat(document.getElementById("rule-val-slab4-cap").value || 1000),
                    slab5MaxCap: parseFloat(document.getElementById("rule-val-slab5-cap").value || 1500),
                    slab6MaxCap: parseFloat(document.getElementById("rule-val-slab6-cap").value || 2000)
                },
                insurance: {
                    threshold: 200000,
                    slab1Amt: parseFloat(document.getElementById("rule-ins-slab1").value || 50),
                    slab2Amt: parseFloat(document.getElementById("rule-ins-slab2").value || 100)
                },
                docCharge: {
                    slab1Limit: 100000,
                    slab1Amt: parseFloat(document.getElementById("rule-doc-slab1").value || 50),
                    slab2Limit: 200000,
                    slab2Amt: parseFloat(document.getElementById("rule-doc-slab2").value || 100),
                    slab3Amt: parseFloat(document.getElementById("rule-doc-slab3").value || 200)
                },
                serviceCharge: {
                    threshold: 200000,
                    slab1Rate: parseFloat(document.getElementById("rule-srv-slab1-rate").value || 0.25),
                    slab1Cap: parseFloat(document.getElementById("rule-srv-slab1-cap").value || 500),
                    slab2Rate: parseFloat(document.getElementById("rule-srv-slab2-rate").value || 0.50),
                    slab2Cap: parseFloat(document.getElementById("rule-srv-slab2-cap").value || 5000)
                },
                stampDuty: {
                    exemptLimit: parseFloat(document.getElementById("rule-stamp-exempt")?.value || 49999),
                    slabLimit: parseFloat(document.getElementById("rule-stamp-limit")?.value || 119999),
                    ratePercent: parseFloat(document.getElementById("rule-stamp-rate")?.value || 0.25),
                    roundUpMultiple: parseFloat(document.getElementById("rule-stamp-round")?.value || 10),
                    fixedAboveAmount: parseFloat(document.getElementById("rule-stamp-above-fee")?.value || 300),
                    aboveExtraFee: parseFloat(document.getElementById("rule-stamp-above-fee")?.value || 300),
                    scheme3553ExtraFee: parseFloat(document.getElementById("rule-stamp-3553-fee")?.value || 300)
                },
                gst: {
                    cgstPercent: parseFloat(document.getElementById("rule-cgst-rate").value || 9),
                    sgstPercent: parseFloat(document.getElementById("rule-sgst-rate").value || 9)
                }
            };

            saveState();
            calculateAllCharges();
            showToast("Rules Configuration saved! All loan entries updated.");
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            const isHO = state.currentSession && state.currentSession.code === "99";
            if (!isHO) {
                alert("Only Head Office can reset rules.");
                return;
            }
            if (confirm("Reset all Rules Master configurations back to bank defaults?")) {
                state.rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
                saveState();
                renderRulesMaster();
                calculateAllCharges();
                showToast("Rules reset to standard defaults.");
            }
        });
    }
}

function renderRulesMaster() {
    const isHO = state.currentSession && state.currentSession.code === "99";
    const notice = document.getElementById("rules-branch-notice");
    const actionBtns = document.getElementById("rules-action-buttons");
    const form = document.getElementById("rules-master-form");

    if (notice) {
        if (isHO) notice.classList.add("hidden");
        else notice.classList.remove("hidden");
    }

    if (actionBtns) {
        actionBtns.style.display = isHO ? "flex" : "none";
    }

    const rules = state.rules || DEFAULT_RULES;

    // Set values
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = val;
            el.disabled = !isHO;
            el.style.backgroundColor = isHO ? "#ffffff" : "#f8fafc";
            el.style.cursor = isHO ? "text" : "not-allowed";
        }
    };

    // 1. Membership
    setVal("rule-mem-limit", rules.membership?.nonMemberLimit ?? 99999);
    setVal("rule-share-b", rules.membership?.shareGroupB ?? 50);
    setVal("rule-share-a", rules.membership?.shareGroupA ?? 500);
    setVal("rule-member-fee", rules.membership?.memberFee ?? 25);

    // 2. Valuation
    setVal("rule-val-slab1", rules.valuation?.slab1Amt ?? 100);
    setVal("rule-val-slab2", rules.valuation?.slab2Amt ?? 150);
    setVal("rule-val-slab3", rules.valuation?.slab3Amt ?? 250);
    setVal("rule-val-slab4-cap", rules.valuation?.slab4MaxCap ?? 1000);
    setVal("rule-val-slab5-cap", rules.valuation?.slab5MaxCap ?? 1500);
    setVal("rule-val-slab6-cap", rules.valuation?.slab6MaxCap ?? 2000);
    setVal("rule-val-rate", rules.valuation?.ratePercent ?? 0.25);

    // 3. Doc & Insurance
    setVal("rule-doc-slab1", rules.docCharge?.slab1Amt ?? 50);
    setVal("rule-doc-slab2", rules.docCharge?.slab2Amt ?? 100);
    setVal("rule-doc-slab3", rules.docCharge?.slab3Amt ?? 200);
    setVal("rule-ins-slab1", rules.insurance?.slab1Amt ?? 50);
    setVal("rule-ins-slab2", rules.insurance?.slab2Amt ?? 100);

    // 4. Service & GST
    setVal("rule-srv-slab1-rate", rules.serviceCharge?.slab1Rate ?? 0.25);
    setVal("rule-srv-slab1-cap", rules.serviceCharge?.slab1Cap ?? 500);
    setVal("rule-srv-slab2-rate", rules.serviceCharge?.slab2Rate ?? 0.50);
    setVal("rule-srv-slab2-cap", rules.serviceCharge?.slab2Cap ?? 5000);
    setVal("rule-cgst-rate", rules.gst?.cgstPercent ?? 9);
    setVal("rule-sgst-rate", rules.gst?.sgstPercent ?? 9);

    // 5. Stamp Duty
    setVal("rule-stamp-exempt", rules.stampDuty?.exemptLimit ?? 49999);
    setVal("rule-stamp-limit", rules.stampDuty?.slabLimit ?? 119999);
    setVal("rule-stamp-rate", rules.stampDuty?.ratePercent ?? 0.25);
    setVal("rule-stamp-round", rules.stampDuty?.roundUpMultiple ?? 10);
    setVal("rule-stamp-above-fee", rules.stampDuty?.fixedAboveAmount ?? rules.stampDuty?.aboveExtraFee ?? 300);
    setVal("rule-stamp-3553-fee", rules.stampDuty?.scheme3553ExtraFee ?? 300);
}

// ==================== MASTERS: GOLD RATE MASTER ====================
function initGoldRateMaster() {
    const form = document.getElementById("gold-rate-master-form");
    const dateInput = document.getElementById("m-gold-rate-date");
    const valInput = document.getElementById("m-gold-rate-val");
    const searchInput = document.getElementById("search-gold-rate-input");

    if (dateInput) {
        dateInput.value = getTodayDateYMD();
    }

    if (valInput) {
        valInput.value = getActiveGoldRate22K();
    }

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const date = document.getElementById("m-gold-rate-date").value || getTodayDateYMD();
            const rate22 = parseFloat(document.getElementById("m-gold-rate-val").value || 0);

            if (setDailyGoldRate(rate22, date)) {
                showToast(`તા. ${formatDateDMY(date)} નો ૨૨ કેરેટ સોનાનો ભાવ ₹${rate22.toLocaleString("en-IN")}/10g સફળતાપૂર્વક સેટ થયો.`);
            }
        };
    }

    const masterBtnLock24h = document.getElementById("master-btn-lock-24h");
    if (masterBtnLock24h) {
        masterBtnLock24h.onclick = (e) => {
            e.preventDefault();
            lockGoldRateFor24Hours();
        };
    }

    const masterBtnUnlock = document.getElementById("master-btn-unlock");
    if (masterBtnUnlock) {
        masterBtnUnlock.onclick = (e) => {
            e.preventDefault();
            unlockGoldRate();
        };
    }

    if (searchInput) {
        searchInput.oninput = () => renderGoldRateMaster();
    }
}

function renderGoldRateMaster() {
    const tbody = document.getElementById("gold-rate-list-tbody");
    const search = document.getElementById("search-gold-rate-input") ? document.getElementById("search-gold-rate-input").value.toLowerCase().trim() : "";
    if (!tbody) return;

    tbody.innerHTML = "";

    let list = state.rateHistory || [];
    if (search) {
        list = list.filter(r => r.date.includes(search) || formatDateDMY(r.date).includes(search));
    }

    // Sort descending by date (latest dates first)
    list = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:15px; color:var(--text-muted);">કોઈ ૨૨ કેરેટ ગોલ્ડ રેટ હિસ્ટ્રી નોંધાયેલ નથી.</td></tr>';
        return;
    }

    const todayStr = getTodayDateYMD();

    list.forEach(r => {
        const tr = document.createElement("tr");
        const isToday = (r.date === todayStr);
        const rate22 = parseFloat(r.rate22K) || parseFloat(r.rate24K) || 0;
        const ratePerGm22 = (rate22 / 10).toFixed(2);

        // Count loans created on this date
        const loansOnDate = (state.loans || []).filter(l => l.date === r.date || String(l.date).split("T")[0] === r.date);
        const loanBadge = loansOnDate.length > 0
            ? `<span class="badge badge-gold" style="font-weight:700;">${loansOnDate.length} લોન</span>`
            : `<span style="color:var(--text-muted); font-size:11.5px;">-</span>`;

        tr.innerHTML = `
            <td>
                <strong>${formatDateDMY(r.date)}</strong>
                ${isToday ? '<br><span class="badge badge-success" style="font-size:10px; margin-top:2px;">આજનો ભાવ</span>' : ''}
            </td>
            <td>
                <strong style="font-size:13.5px; color:#0f1c3f;">₹ ${rate22.toLocaleString("en-IN")}</strong> <span class="badge badge-gold" style="font-size:9.5px; padding:1px 5px; margin-left:4px;">22K</span>
            </td>
            <td>
                <strong style="color:#0284c7; font-size:12.5px;">₹ ${ratePerGm22} / 1g</strong>
            </td>
            <td style="text-align:center;">
                ${loanBadge}
            </td>
            <td style="text-align:center; white-space:nowrap;">
                ${isHeadOfficeSession() ? `
                    <button type="button" class="btn-icon-blue edit-rate-btn" data-date="${r.date}" data-rate="${rate22}" title="Edit 22K Gold Rate"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button type="button" class="btn-icon-red delete-rate-btn" data-date="${r.date}" title="Delete Rate Record"><i class="fa-solid fa-trash-can"></i></button>
                ` : `
                    <span style="color:var(--text-muted); font-size:11px; font-weight:600;"><i class="fa-solid fa-lock"></i> Head Office Only</span>
                `}
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".edit-rate-btn").forEach(btn => {
        btn.onclick = () => {
            const date = btn.getAttribute("data-date");
            const rate = btn.getAttribute("data-rate");
            const dateInp = document.getElementById("m-gold-rate-date");
            const valInp = document.getElementById("m-gold-rate-val");
            if (dateInp) dateInp.value = date;
            if (valInp) {
                valInp.value = rate;
                valInp.focus();
            }
            showToast(`તા. ${formatDateDMY(date)} નો ૨૨ કેરેટ ભાવ સુધારવા માટે ફોર્મમાં લોડ થયો.`);
        };
    });

    tbody.querySelectorAll(".delete-rate-btn").forEach(btn => {
        btn.onclick = () => {
            const date = btn.getAttribute("data-date");
            if (confirm(`શું તમે તા. ${formatDateDMY(date)} નો સોનાનો ભાવ રેકોર્ડ કાઢી નાંખવા માંગો છો?`)) {
                state.rateHistory = state.rateHistory.filter(r => r.date !== date);
                if (state.goldRates && state.goldRates.rateDate === date) {
                    state.goldRates["24K"] = 0;
                    state.goldRates["22K"] = 0;
                    state.goldRates.rateDate = "";
                }
                saveState();
                renderDashboard();
                renderGoldRateMaster();
                showToast(`તા. ${formatDateDMY(date)} નો ભાવ રેકોર્ડ કાઢી નાંખેલ છે.`);
            }
        };
    });
}

// ==================== MASTERS: BRANCH MASTER ====================
function initBranchMaster() {
    const form = document.getElementById("branch-master-form");
    const cancelBtn = document.getElementById("branch-cancel-edit-btn");
    const defaultPassBtn = document.getElementById("btn-default-branch-pass");
    const searchInput = document.getElementById("search-branch-input");

    if (defaultPassBtn) {
        defaultPassBtn.addEventListener("click", () => {
            const codeInput = document.getElementById("branch-code");
            const passInput = document.getElementById("branch-password");
            if (passInput) {
                const code = codeInput ? codeInput.value.trim() : "";
                passInput.value = (code === "99" || code === "HO") ? "Rahul#80810" : "Admin@123";
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => renderBranchMaster());
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            resetBranchMasterForm();
        });
    }

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const editCode = document.getElementById("edit-branch-code") ? document.getElementById("edit-branch-code").value.trim() : "";
            const rawCode = document.getElementById("branch-code").value.trim();
            const code = rawCode.padStart(2, "0");
            let name = document.getElementById("branch-name").value.trim().toUpperCase();
            const password = document.getElementById("branch-password") ? document.getElementById("branch-password").value.trim() : (code === "99" ? "Rahul#80810" : "Admin@123");

            if (!code || !name || !password) {
                alert("Please fill all required branch fields.");
                return;
            }

            // Ensure name starts with branch code if not already
            if (!name.startsWith(code) && !name.startsWith(rawCode)) {
                name = `${code} ${name}`;
            }

            const branchObj = {
                code: code,
                name: name,
                password: password,
                isHO: (code === "99")
            };

            if (editCode) {
                const idx = state.branches.findIndex(b => b.code === editCode);
                if (idx !== -1) {
                    state.branches[idx] = branchObj;
                    showToast(`Branch ${name} updated successfully!`);
                } else {
                    state.branches.push(branchObj);
                    showToast("Branch registered successfully!");
                }
            } else {
                const existing = state.branches.find(b => b.code === code);
                if (existing) {
                    alert("A branch with code " + code + " already exists. Please use another code or edit the existing branch.");
                    return;
                }
                state.branches.push(branchObj);
                showToast("New branch registered successfully!");
            }

            saveState();
            resetBranchMasterForm();
            renderBranchMaster();
            updateBranchContextUI();
            populateLoginBranches();

            // Sync Branch to Cloud Firestore (Admin privilege)
            if (window.FirebaseService && window.FirebaseService.isInitialized) {
                window.FirebaseService.saveBranch({
                    branchCode: code,
                    branchName: name,
                    password: password,
                    isHeadOffice: (code === "99"),
                    isActive: true
                }).catch(e => console.warn("[Firebase] Branch cloud save error:", e));
            }
        });
    }
}

function resetBranchMasterForm() {
    const form = document.getElementById("branch-master-form");
    if (form) form.reset();
    
    const editCodeInput = document.getElementById("edit-branch-code");
    if (editCodeInput) editCodeInput.value = "";

    const codeInput = document.getElementById("branch-code");
    if (codeInput) {
        codeInput.readOnly = false;
        codeInput.style.backgroundColor = "";
    }

    const passInput = document.getElementById("branch-password");
    if (passInput) passInput.value = "Admin@123";
    const roleSelect = document.getElementById("branch-role");
    if (roleSelect) roleSelect.value = "branch_manager";

    const titleEl = document.getElementById("branch-form-title");
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-code-branch"></i> Add New Branch Office';

    const saveBtn = document.getElementById("branch-save-btn");
    if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Save Branch';

    const cancelBtn = document.getElementById("branch-cancel-edit-btn");
    if (cancelBtn) cancelBtn.classList.add("hidden");
}

function renderBranchMaster() {
    const tbody = document.getElementById("branch-list-tbody");
    const countSpan = document.getElementById("branch-total-count");
    const search = document.getElementById("search-branch-input") ? document.getElementById("search-branch-input").value.toLowerCase().trim() : "";
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!state.branches) state.branches = DEFAULT_BRANCHES;
    if (countSpan) countSpan.textContent = state.branches.length;

    let list = state.branches;
    if (search) {
        list = list.filter(b => b.code.toLowerCase().includes(search) || b.name.toLowerCase().includes(search));
    }

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px; color:var(--text-muted);">No branches match your search.</td></tr>';
        return;
    }

    list.forEach(b => {
        const tr = document.createElement("tr");
        const passDisplay = b.password || (b.code === "99" ? "Rahul#80810" : "Admin@123");
        const branchRole = b.role || (b.isHO || b.code === "99" ? ROLES.ADMIN : ROLES.BRANCH_MANAGER);
        const roleBadge = getRoleBadgeHTML(branchRole);

        tr.innerHTML = `
            <td><span class="badge badge-primary font-bold">${b.code}</span></td>
            <td><strong>${b.name}</strong> ${b.isHO ? '<span class="badge badge-gold" style="margin-left:5px; font-size:10px;">HO</span>' : ''}</td>
            <td>${roleBadge}</td>
            <td>
                <span class="branch-passcode-cell" style="font-family:monospace; background:#f1f5f9; padding:3px 8px; border-radius:4px; font-size:12px; font-weight:600;">
                    ${passDisplay}
                </span>
            </td>
            <td style="text-align:center; white-space:nowrap;">
                <button type="button" class="btn-icon-blue edit-branch-btn" data-code="${b.code}" title="Edit Branch, Role & Password"><i class="fa-solid fa-pen-to-square"></i></button>
                ${b.code !== "99" ? `<button type="button" class="btn-icon-red delete-branch-btn" data-code="${b.code}" title="Delete Branch"><i class="fa-solid fa-trash-can"></i></button>` : ""}
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".edit-branch-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const code = btn.getAttribute("data-code");
            const b = state.branches.find(x => x.code === code);
            if (!b) return;

            document.getElementById("edit-branch-code").value = b.code;
            const codeInput = document.getElementById("branch-code");
            if (codeInput) {
                codeInput.value = b.code;
                if (b.code === "99") {
                    codeInput.readOnly = true;
                    codeInput.style.backgroundColor = "#f1f5f9";
                } else {
                    codeInput.readOnly = false;
                    codeInput.style.backgroundColor = "";
                }
            }

            // Strip leading code from name if needed
            let branchName = b.name;
            if (branchName.startsWith(b.code + " ")) {
                branchName = branchName.substring(b.code.length + 1);
            }
            document.getElementById("branch-name").value = branchName;
            document.getElementById("branch-password").value = b.password || (b.code === "99" ? "Rahul#80810" : "Admin@123");
            const roleSelect = document.getElementById("branch-role");
            if (roleSelect) {
                roleSelect.value = b.role || (b.isHO || b.code === "99" ? ROLES.ADMIN : ROLES.BRANCH_MANAGER);
            }

            const titleEl = document.getElementById("branch-form-title");
            if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Branch Office';

            const saveBtn = document.getElementById("branch-save-btn");
            if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Branch';

            const cancelBtn = document.getElementById("branch-cancel-edit-btn");
            if (cancelBtn) cancelBtn.classList.remove("hidden");

            const form = document.getElementById("branch-master-form");
            if (form) form.scrollIntoView({ behavior: "smooth" });
        });
    });

    tbody.querySelectorAll(".delete-branch-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const code = btn.getAttribute("data-code");
            const b = state.branches.find(x => x.code === code);
            if (b && confirm(`Are you sure you want to delete Branch ${b.name}?`)) {
                state.branches = state.branches.filter(x => x.code !== code);
                saveState();
                renderBranchMaster();
                updateBranchContextUI();
                populateLoginBranches();

                // Delete Branch from Cloud Firestore (Admin privilege)
                if (window.FirebaseService && window.FirebaseService.isInitialized) {
                    window.FirebaseService.deleteBranch(code).catch(e => console.warn("[Firebase] Branch cloud delete error:", e));
                }

                showToast("Branch removed successfully.");
            }
        });
    });
}

// ==================== MASTERS: VALUER MASTER ====================
function initValuerMaster() {
    const form = document.getElementById("valuer-master-form");
    const cancelBtn = document.getElementById("valuer-cancel-edit-btn");
    const triggerExcelBtn = document.getElementById("btn-trigger-valuer-excel-upload");
    const fileInput = document.getElementById("valuer-excel-file-input");
    const downloadTemplateBtn = document.getElementById("btn-download-valuer-template");
    const searchInput = document.getElementById("search-valuer-input");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const editId = document.getElementById("edit-valuer-id") ? document.getElementById("edit-valuer-id").value : "";
            const name = document.getElementById("valuer-name").value.trim().toUpperCase();
            const mobile = document.getElementById("valuer-mobile").value.trim();
            const address = document.getElementById("valuer-address").value.trim();
            const savingsAc = document.getElementById("valuer-savings-ac").value.trim();

            const valuerObj = {
                id: editId || ("V" + (state.valuers.length + 1).toString().padStart(2, "0")),
                name,
                phone: mobile,
                address,
                savingsAc,
                branch: state.currentSession ? state.currentSession.code : "99",
                active: true
            };

            if (editId) {
                const idx = state.valuers.findIndex(v => v.id === editId);
                if (idx !== -1) {
                    state.valuers[idx] = valuerObj;
                } else {
                    state.valuers.push(valuerObj);
                }
            } else {
                state.valuers.push(valuerObj);
            }

            saveState();
            form.reset();
            if (document.getElementById("edit-valuer-id")) document.getElementById("edit-valuer-id").value = "";
            if (cancelBtn) cancelBtn.classList.add("hidden");
            const saveBtn = document.getElementById("valuer-save-btn");
            if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Register Valuer';

            renderValuers();
            showToast("Valuer profile saved!");
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            if (form) form.reset();
            if (document.getElementById("edit-valuer-id")) document.getElementById("edit-valuer-id").value = "";
            cancelBtn.classList.add("hidden");
            const saveBtn = document.getElementById("valuer-save-btn");
            if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Register Valuer';
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => renderValuers());
    }

    if (triggerExcelBtn && fileInput) {
        triggerExcelBtn.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                importValuersFromExcel(e.target.files[0]);
            }
        });
    }

    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener("click", () => {
            const csv = "ValuerName,Mobile,Address,SavingsAc\nSURYAKANT HIMMATLAL LUHAR,9033048938,KANKAI SHERI JUNI BAZAR MU KODINAR,004131800000121\n";
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Valuer_Import_Template.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }
}

function importValuersFromExcel(file) {
    if (typeof XLSX === "undefined") {
        alert("SheetJS library not loaded.");
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, { type: "array" });
            const firstSheet = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(firstSheet);

            let added = 0;
            json.forEach(row => {
                const name = row["ValuerName"] || row["Name"] || row["વેલ્યુઅરનું નામ"];
                if (name) {
                    state.valuers.push({
                        id: "V" + Date.now() + Math.floor(Math.random() * 100),
                        name: String(name).trim().toUpperCase(),
                        phone: String(row["Mobile"] || row["Phone"] || "").trim(),
                        address: String(row["Address"] || "").trim(),
                        savingsAc: String(row["SavingsAc"] || "").trim(),
                        branch: "99",
                        active: true
                    });
                    added++;
                }
            });

            saveState();
            renderValuers();
            alert(`Successfully imported ${added} valuers from file.`);
        } catch (err) {
            alert("Error parsing excel: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function renderValuers() {
    const tbody = document.getElementById("valuer-list-tbody") || document.getElementById("valuer-master-tbody");
    const selectValuer = document.getElementById("valuer-select") || document.getElementById("loan-valuer-name");
    const countSpan = document.getElementById("valuer-total-count");
    const search = document.getElementById("search-valuer-input") ? document.getElementById("search-valuer-input").value.toLowerCase().trim() : "";

    if (countSpan) countSpan.textContent = state.valuers ? state.valuers.length : 0;

    if (selectValuer) {
        selectValuer.innerHTML = '<option value="">-- Select Valuer --</option>';
        state.valuers.forEach(v => {
            const opt = document.createElement("option");
            opt.value = v.name;
            opt.textContent = `${v.name} (${v.phone || "-"})`;
            selectValuer.appendChild(opt);
        });
    }

    if (!tbody) return;
    tbody.innerHTML = "";

    let list = state.valuers || [];
    if (search) {
        list = list.filter(v => 
            (v.name && v.name.toLowerCase().includes(search)) ||
            (v.phone && v.phone.includes(search)) ||
            (v.address && v.address.toLowerCase().includes(search)) ||
            (v.savingsAc && v.savingsAc.includes(search))
        );
    }

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:15px; color:var(--text-muted);">No valuer records found.</td></tr>';
        return;
    }

    list.forEach(v => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${v.name}</strong></td>
            <td>${v.phone || "-"}</td>
            <td>${v.address || "-"}</td>
            <td><span class="badge badge-primary">${v.savingsAc || "-"}</span></td>
            <td style="white-space:nowrap; text-align:center;">
                <button class="btn-icon-blue edit-valuer-btn" title="Edit Valuer" data-id="${v.id}"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn-icon-red delete-valuer-btn" title="Delete Valuer" data-id="${v.id}"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".edit-valuer-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const v = state.valuers.find(x => x.id === id);
            if (!v) return;

            document.getElementById("edit-valuer-id").value = v.id;
            document.getElementById("valuer-name").value = v.name || "";
            document.getElementById("valuer-mobile").value = v.phone || "";
            document.getElementById("valuer-address").value = v.address || "";
            document.getElementById("valuer-savings-ac").value = v.savingsAc || "";

            const cancelBtn = document.getElementById("valuer-cancel-edit-btn");
            if (cancelBtn) cancelBtn.classList.remove("hidden");
            const saveBtn = document.getElementById("valuer-save-btn");
            if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Valuer';

            const form = document.getElementById("valuer-master-form");
            if (form) form.scrollIntoView({ behavior: "smooth" });
        });
    });

    tbody.querySelectorAll(".delete-valuer-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const v = state.valuers.find(x => x.id === id);
            if (v && confirm(`Are you sure you want to delete valuer ${v.name}?`)) {
                state.valuers = state.valuers.filter(x => x.id !== id);
                saveState();
                renderValuers();
                showToast("Valuer record removed.");
            }
        });
    });
}

// ==================== MASTERS: PRODUCT MASTER ====================
function initProductMaster() {
    const form = document.getElementById("product-master-form");
    const cancelBtn = document.getElementById("product-cancel-edit-btn");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const editId = document.getElementById("edit-product-id") ? document.getElementById("edit-product-id").value : "";
            const code = document.getElementById("prod-code").value.trim();
            const minAmt = parseFloat(document.getElementById("prod-min-amt").value || 0);
            const maxAmt = parseFloat(document.getElementById("prod-max-amt").value || 0);
            const rate = parseFloat(document.getElementById("prod-interest-rate").value || 0);
            const desc = document.getElementById("prod-desc").value.trim();

            if (!code || !desc || rate <= 0) {
                alert("Please fill all required product fields.");
                return;
            }

            const type = code.includes("3527") ? "installment" : (code.includes("3553") ? "overdraft" : "bullet");
            const prodObj = {
                id: editId || String(state.products.length + 1),
                code,
                minAmt,
                maxAmt,
                rate,
                name: desc,
                type
            };

            if (editId) {
                const idx = state.products.findIndex(p => String(p.id) === String(editId));
                if (idx !== -1) {
                    state.products[idx] = prodObj;
                } else {
                    state.products.push(prodObj);
                }
            } else {
                state.products.push(prodObj);
            }

            saveState();
            form.reset();
            if (document.getElementById("edit-product-id")) document.getElementById("edit-product-id").value = "";
            if (cancelBtn) cancelBtn.classList.add("hidden");
            const saveBtn = document.getElementById("product-save-btn");
            if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Product';

            renderProductMaster();
            showToast("Product Scheme saved successfully!");

            // Sync Product Schemes to Cloud Firestore (Live across all PCs)
            if (window.FirebaseService && typeof window.FirebaseService.saveProductsList === "function") {
                window.FirebaseService.saveProductsList(state.products).catch(e => console.warn("[Firebase] Products sync error:", e));
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            if (form) form.reset();
            if (document.getElementById("edit-product-id")) document.getElementById("edit-product-id").value = "";
            cancelBtn.classList.add("hidden");
            const saveBtn = document.getElementById("product-save-btn");
            if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Product';
        });
    }
}

function renderProductMaster() {
    const tbody = document.getElementById("product-list-tbody");
    const filterProduct = document.getElementById("filter-product");

    if (filterProduct) {
        filterProduct.innerHTML = '<option value="">-- All Schemes --</option>';
        state.products.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.code;
            opt.textContent = `${p.code} - ${p.name}`;
            filterProduct.appendChild(opt);
        });
    }

    if (!tbody) return;
    tbody.innerHTML = "";

    if (!state.products || state.products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:15px; color:var(--text-muted);">No product schemes configured.</td></tr>';
        return;
    }

    state.products.forEach((p, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="text-align:center; font-weight:700;">${p.id || (idx + 1)}</td>
            <td><span class="badge badge-gold font-bold">${p.code}</span></td>
            <td style="text-align:right;">₹ ${Number(p.minAmt || 0).toLocaleString("en-IN")}</td>
            <td style="text-align:right;">${p.maxAmt >= 999999999 ? "No Limit" : "₹ " + Number(p.maxAmt).toLocaleString("en-IN")}</td>
            <td style="text-align:center;"><strong>${parseFloat(p.rate || 11.50).toFixed(2)}%</strong></td>
            <td><strong>${p.name}</strong></td>
            <td style="white-space:nowrap; text-align:center;">
                <button class="btn-icon-blue edit-product-btn" title="Edit Scheme" data-id="${p.id}"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn-icon-red delete-product-btn" title="Delete Scheme" data-id="${p.id}"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".edit-product-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const p = state.products.find(x => String(x.id) === String(id));
            if (!p) return;

            document.getElementById("edit-product-id").value = p.id;
            document.getElementById("prod-code").value = p.code;
            document.getElementById("prod-min-amt").value = p.minAmt;
            document.getElementById("prod-max-amt").value = p.maxAmt;
            document.getElementById("prod-interest-rate").value = p.rate;
            document.getElementById("prod-desc").value = p.name;

            const cancelBtn = document.getElementById("product-cancel-edit-btn");
            if (cancelBtn) cancelBtn.classList.remove("hidden");
            const saveBtn = document.getElementById("product-save-btn");
            if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Product';

            const form = document.getElementById("product-master-form");
            if (form) form.scrollIntoView({ behavior: "smooth" });
        });
    });

    tbody.querySelectorAll(".delete-product-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const p = state.products.find(x => String(x.id) === String(id));
            if (p && confirm(`Are you sure you want to delete Product Scheme ${p.code} (${p.name})?`)) {
                state.products = state.products.filter(x => String(x.id) !== String(id));
                saveState();
                renderProductMaster();

                if (window.FirebaseService && typeof window.FirebaseService.saveProductsList === "function") {
                    window.FirebaseService.saveProductsList(state.products).catch(e => console.warn("[Firebase] Products delete sync error:", e));
                }

                showToast("Product scheme removed.");
            }
        });
    });
}

// ==================== MASTERS: CUSTOMER MASTER ====================
function initCustomerMaster() {
    const form = document.getElementById("customer-master-form");
    const cancelBtn = document.getElementById("customer-cancel-edit-btn");
    const isMemberSelect = document.getElementById("m-cust-is-member");
    const memberNoGroup = document.getElementById("m-cust-member-no-group");
    const memberNoInput = document.getElementById("m-cust-member-no");
    const searchInput = document.getElementById("customer-dir-search");
    const photoInput = document.getElementById("m-cust-photo-upload");
    const photoPreview = document.getElementById("m-cust-photo-preview");

    if (isMemberSelect && memberNoGroup) {
        isMemberSelect.addEventListener("change", () => {
            const isMem = isMemberSelect.value.toLowerCase() === "yes";
            memberNoGroup.style.display = isMem ? "block" : "none";
            if (!isMem && memberNoInput) memberNoInput.value = "";
        });
    }

    if (photoInput && photoPreview) {
        photoInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (file) {
                const optimizedBase64 = await compressImageFile(file, 600, 0.85);
                photoPreview.innerHTML = `<img src="${optimizedBase64}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Customer Photo">`;
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => renderCustomerMasterList());
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            resetCustomerMasterForm();
        });
    }

    // Birth Date -> Auto Age calculation for Customer Master
    const mDobInput = document.getElementById("m-cust-dob");
    const mAgeInput = document.getElementById("m-cust-age");
    if (mDobInput && mAgeInput) {
        const autoCalcMAge = () => {
            const dobVal = mDobInput.value;
            const age = calculateAgeFromDOB(dobVal);
            mAgeInput.value = (age !== "" && !isNaN(age)) ? age : "";
        };
        mDobInput.addEventListener("input", autoCalcMAge);
        mDobInput.addEventListener("change", autoCalcMAge);
    }

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const editId = document.getElementById("edit-customer-id") ? document.getElementById("edit-customer-id").value.trim() : "";
            const custNo = document.getElementById("m-cust-no").value.trim();
            const name = document.getElementById("m-cust-name").value.trim();
            const isMember = isMemberSelect ? isMemberSelect.value.toLowerCase() === "yes" : false;
            const memberNo = isMember && memberNoInput ? memberNoInput.value.trim() : "";
            const address = document.getElementById("m-cust-address").value.trim();
            const savingsAc = document.getElementById("m-cust-savings-ac").value.trim();
            const dob = document.getElementById("m-cust-dob") ? document.getElementById("m-cust-dob").value : "";
            const age = document.getElementById("m-cust-age") ? document.getElementById("m-cust-age").value.trim() : (dob ? calculateAgeFromDOB(dob) : "");
            const occupation = document.getElementById("m-cust-occupation").value.trim();
            const religion = document.getElementById("m-cust-religion").value.trim();
            const caste = document.getElementById("m-cust-caste").value.trim();
            const mobile = document.getElementById("m-cust-mobile").value.trim();
            const nomineeName = document.getElementById("m-cust-nominee-name") ? document.getElementById("m-cust-nominee-name").value.trim() : "";
            const nomineeRelation = document.getElementById("m-cust-nominee-relation") ? document.getElementById("m-cust-nominee-relation").value.trim() : "";
            const photoImg = photoPreview ? photoPreview.querySelector("img") : null;
            const photoSrc = photoImg ? photoImg.src : "";

            if (!custNo || !name) {
                alert("Please enter Customer Number and Name.");
                return;
            }

            if (!state.customers) state.customers = [];

            const custObj = {
                id: editId || ("CUST-" + Date.now()),
                customerNo: custNo,
                name: name,
                isMember: isMember,
                memberNo: memberNo,
                address: address,
                savingsAc: savingsAc,
                dob: dob,
                age: age,
                occupation: occupation,
                religion: religion,
                caste: caste,
                mobile: mobile,
                nomineeName: nomineeName,
                nomineeRelation: nomineeRelation,
                photo: photoSrc,
                updatedAt: new Date().toISOString()
            };

            if (editId) {
                const idx = state.customers.findIndex(c => c.id === editId || c.customerNo === editId);
                if (idx !== -1) {
                    state.customers[idx] = { ...state.customers[idx], ...custObj };
                    showToast(`Customer profile ${name} updated successfully!`);
                } else {
                    state.customers.push(custObj);
                    showToast("Customer profile saved successfully!");
                }
            } else {
                const existingIdx = state.customers.findIndex(c => c.customerNo === custNo);
                if (existingIdx !== -1) {
                    if (confirm(`Customer No ${custNo} already exists for "${state.customers[existingIdx].name}". Do you want to update this customer profile?`)) {
                        state.customers[existingIdx] = { ...state.customers[existingIdx], ...custObj };
                        showToast(`Customer profile ${name} updated!`);
                    } else {
                        return;
                    }
                } else {
                    state.customers.push(custObj);
                    showToast("New customer profile saved successfully!");
                }
            }

            saveState();
            resetCustomerMasterForm();
            renderCustomerMasterList();

            // Sync Customer Profile to Cloud Firestore (Live across all PCs)
            if (window.FirebaseService && window.FirebaseService.isInitialized && typeof window.FirebaseService.saveCustomer === "function") {
                window.FirebaseService.saveCustomer(custObj).catch(e => console.warn("[Firebase] Customer cloud sync error:", e));
            }
        });
    }
}

function resetCustomerMasterForm() {
    const form = document.getElementById("customer-master-form");
    if (form) form.reset();

    const editIdInput = document.getElementById("edit-customer-id");
    if (editIdInput) editIdInput.value = "";

    const mDobInput = document.getElementById("m-cust-dob");
    if (mDobInput) mDobInput.value = "";
    const mAgeInput = document.getElementById("m-cust-age");
    if (mAgeInput) mAgeInput.value = "";

    const memberNoGroup = document.getElementById("m-cust-member-no-group");
    if (memberNoGroup) memberNoGroup.style.display = "none";

    const photoPreview = document.getElementById("m-cust-photo-preview");
    if (photoPreview) {
        photoPreview.innerHTML = '<i class="fa-regular fa-image"></i><span>No Photo Selected</span>';
    }

    const titleEl = document.getElementById("customer-form-title");
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-user-plus"></i> New Customer Profile';

    const saveBtn = document.getElementById("customer-save-btn");
    if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Save Customer Profile';

    const cancelBtn = document.getElementById("customer-cancel-edit-btn");
    if (cancelBtn) cancelBtn.classList.add("hidden");
}

function renderCustomerMasterList() {
    const tbody = document.getElementById("customer-master-tbody") || document.getElementById("customer-list-tbody");
    const countSpan = document.getElementById("customer-total-count");
    const search = document.getElementById("customer-dir-search") ? document.getElementById("customer-dir-search").value.toLowerCase().trim() : "";
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!state.customers) state.customers = [];
    if (countSpan) countSpan.textContent = state.customers.length;

    let list = state.customers;
    if (search) {
        list = list.filter(c => 
            (c.customerNo && c.customerNo.toLowerCase().includes(search)) ||
            (c.name && c.name.toLowerCase().includes(search)) ||
            (c.mobile && c.mobile.includes(search)) ||
            (c.savingsAc && c.savingsAc.toLowerCase().includes(search)) ||
            (c.memberNo && c.memberNo.toLowerCase().includes(search))
        );
    }

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:18px; color:var(--text-muted); font-size:13px;">No customer records found.</td></tr>';
        return;
    }

    list.forEach((c, idx) => {
        const tr = document.createElement("tr");
        const photoHtml = (c.photo || c.customerPhoto) 
            ? `<img src="${c.photo || c.customerPhoto}" style="width:34px; height:34px; border-radius:50%; object-fit:cover; border:1.5px solid var(--gold);" alt="Photo">` 
            : `<div style="width:34px; height:34px; border-radius:50%; background:#f1f5f9; color:#94a3b8; display:flex; align-items:center; justify-content:center; font-size:14px; margin:0 auto;"><i class="fa-solid fa-user"></i></div>`;

        const isMem = (c.isMember === true || c.isMember === "yes" || (c.memberNo && c.memberNo.trim() !== ""));
        const memberBadge = isMem 
            ? `<span class="badge badge-success" title="${c.memberNo || ''}">Member${c.memberNo ? ` (${c.memberNo})` : ''}</span>` 
            : `<span class="badge" style="background:#f1f5f9; color:#64748b;">Non-Member</span>`;

        tr.innerHTML = `
            <td style="text-align:center;">${photoHtml}</td>
            <td><strong>${c.customerNo || ("CUST-" + (idx + 1))}</strong></td>
            <td><strong>${c.name}</strong><br><small style="color:var(--text-secondary);">${c.address || ""}</small></td>
            <td>${c.mobile || "-"}</td>
            <td>${c.savingsAc || "-"}</td>
            <td style="text-align:center;">${memberBadge}</td>
            <td>${c.nomineeName ? `<strong>${c.nomineeName}</strong>${c.nomineeRelation ? ` (${c.nomineeRelation})` : ''}` : '-'}</td>
            <td style="text-align:center; white-space:nowrap;">
                <button type="button" class="btn-icon-blue edit-cust-btn" data-id="${c.id || c.customerNo}" title="Edit Customer Details"><i class="fa-solid fa-pen-to-square"></i></button>
                <button type="button" class="btn-icon-red delete-cust-btn" data-id="${c.id || c.customerNo}" title="Delete Customer Profile"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".edit-cust-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const c = state.customers.find(x => x.id === id || x.customerNo === id);
            if (!c) return;

            document.getElementById("edit-customer-id").value = c.id || c.customerNo;
            document.getElementById("m-cust-no").value = c.customerNo || "";
            document.getElementById("m-cust-name").value = c.name || "";
            
            const isMem = (c.isMember === true || c.isMember === "yes" || (c.memberNo && c.memberNo.trim() !== ""));
            const memSelect = document.getElementById("m-cust-is-member");
            const memGroup = document.getElementById("m-cust-member-no-group");
            const memNoInput = document.getElementById("m-cust-member-no");

            if (memSelect) memSelect.value = isMem ? "yes" : "no";
            if (memGroup) memGroup.style.display = isMem ? "block" : "none";
            if (memNoInput) memNoInput.value = c.memberNo || "";

            document.getElementById("m-cust-address").value = c.address || "";
            document.getElementById("m-cust-savings-ac").value = c.savingsAc || "";
            if (document.getElementById("m-cust-dob")) document.getElementById("m-cust-dob").value = c.dob || "";
            document.getElementById("m-cust-age").value = c.age || (c.dob ? calculateAgeFromDOB(c.dob) : "");
            document.getElementById("m-cust-occupation").value = c.occupation || "";
            document.getElementById("m-cust-religion").value = c.religion || "";
            document.getElementById("m-cust-caste").value = c.caste || "";
            document.getElementById("m-cust-mobile").value = c.mobile || "";

            if (document.getElementById("m-cust-nominee-name")) document.getElementById("m-cust-nominee-name").value = c.nomineeName || "";
            if (document.getElementById("m-cust-nominee-relation")) document.getElementById("m-cust-nominee-relation").value = c.nomineeRelation || "";

            const photoPreview = document.getElementById("m-cust-photo-preview");
            if (photoPreview) {
                if (c.photo || c.customerPhoto) {
                    photoPreview.innerHTML = `<img src="${c.photo || c.customerPhoto}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Photo">`;
                } else {
                    photoPreview.innerHTML = '<i class="fa-regular fa-image"></i><span>No Photo Selected</span>';
                }
            }

            const titleEl = document.getElementById("customer-form-title");
            if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Customer Profile';

            const saveBtn = document.getElementById("customer-save-btn");
            if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Customer Profile';

            const cancelBtn = document.getElementById("customer-cancel-edit-btn");
            if (cancelBtn) cancelBtn.classList.remove("hidden");

            const form = document.getElementById("customer-master-form");
            if (form) form.scrollIntoView({ behavior: "smooth" });
        });
    });

    tbody.querySelectorAll(".delete-cust-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const c = state.customers.find(x => x.id === id || x.customerNo === id);
            if (c && confirm(`Are you sure you want to delete customer profile ${c.name} (${c.customerNo})?`)) {
                state.customers = state.customers.filter(x => x.id !== id && x.customerNo !== id);
                saveState();
                renderCustomerMasterList();

                // Delete from Cloud Firestore (Live across all PCs)
                if (window.FirebaseService && window.FirebaseService.isInitialized && typeof window.FirebaseService.deleteCustomer === "function") {
                    window.FirebaseService.deleteCustomer(id).catch(e => console.warn("[Firebase] Customer cloud delete error:", e));
                }

                showToast("Customer profile deleted.");
            }
        });
    });
}

function initCustomerAutofill() {
    const custNoInput = document.getElementById("cust-no");
    if (custNoInput) {
        const handleCustAutofill = () => {
            const val = custNoInput.value.trim();
            if (!val) return;
            const cust = (state.customers || []).find(c => c.customerNo === val);
            if (cust) {
                document.getElementById("cust-name").value = cust.name || "";
                document.getElementById("cust-address").value = cust.address || "";
                document.getElementById("cust-savings-ac").value = cust.savingsAc || "";
                if (document.getElementById("cust-dob")) document.getElementById("cust-dob").value = cust.dob || "";
                document.getElementById("cust-age").value = cust.age || (cust.dob ? calculateAgeFromDOB(cust.dob) : "");
                document.getElementById("cust-occupation").value = cust.occupation || "";
                document.getElementById("cust-religion").value = cust.religion || "";
                document.getElementById("cust-caste").value = cust.caste || "";
                document.getElementById("cust-mobile").value = cust.mobile || "";

                const isMem = (cust.memberNo && cust.memberNo.trim() !== "");
                const isMemberSelect = document.getElementById("is-member");
                const memberNoGroup = document.getElementById("member-no-group");
                const memberNoInput = document.getElementById("member-no");

                if (isMemberSelect) isMemberSelect.value = isMem ? "Yes" : "No";
                if (memberNoGroup) memberNoGroup.style.display = isMem ? "block" : "none";
                if (memberNoInput) memberNoInput.value = cust.memberNo || "";

                // Auto-load customer photo or sync uploaded photo
                const custPrev = document.getElementById("cust-photo-preview");
                if (custPrev) {
                    const existingImg = custPrev.querySelector("img");
                    if (cust.photo || cust.customerPhoto) {
                        custPrev.innerHTML = `
                            <div class="uploaded-photo-wrap">
                                <img src="${cust.photo || cust.customerPhoto}" alt="Customer Photo">
                                <div class="uploaded-photo-badge"><i class="fa-solid fa-circle-check"></i> ફોટો અપલોડ થયેલ છે</div>
                            </div>`;
                    } else if (existingImg && existingImg.src) {
                        cust.photo = existingImg.src;
                        cust.customerPhoto = existingImg.src;
                        cust.updatedAt = new Date().toISOString();
                        saveState();
                        renderCustomerMasterList();
                    }
                }

                calculateAllCharges();
                showToast("Customer details auto-populated!");
            }
        };

        custNoInput.addEventListener("blur", handleCustAutofill);
        custNoInput.addEventListener("change", handleCustAutofill);
    }
}

// ==================== MASTERS: RULES MASTER (DYNAMIC & EXTENSIBLE) ====================
function initRulesMaster() {
    // 1. Subtab Switching
    const btnStandard = document.getElementById("subtab-btn-standard");
    const btnCustom = document.getElementById("subtab-btn-custom");
    const contentStandard = document.getElementById("subtab-content-standard");
    const contentCustom = document.getElementById("subtab-content-custom");

    if (btnStandard && btnCustom && contentStandard && contentCustom) {
        btnStandard.addEventListener("click", () => {
            btnStandard.className = "btn btn-sm btn-primary active-subtab";
            btnCustom.className = "btn btn-sm btn-secondary";
            contentStandard.classList.remove("hidden");
            contentCustom.classList.add("hidden");
        });

        btnCustom.addEventListener("click", () => {
            btnCustom.className = "btn btn-sm btn-primary active-subtab";
            btnStandard.className = "btn btn-sm btn-secondary";
            contentCustom.classList.remove("hidden");
            contentStandard.classList.add("hidden");
            renderCustomChargesTable();
        });
    }

    // 2. Standard Rules Save & Reset
    const saveBtn = document.getElementById("btn-save-rules");
    const resetBtn = document.getElementById("btn-reset-rules");

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            if (!state.currentSession || state.currentSession.code !== "99") {
                alert("Authorization Denied: Only Head Office (99) can modify banking deduction rules.");
                return;
            }

            state.rules = {
                membership: {
                    nonMemberLimit: parseFloat(document.getElementById("rule-mem-limit")?.value || 99999),
                    shareGroupB: parseFloat(document.getElementById("rule-share-b")?.value || 50),
                    shareGroupA: parseFloat(document.getElementById("rule-share-a")?.value || 500),
                    memberFee: parseFloat(document.getElementById("rule-member-fee")?.value || 25)
                },
                valuation: {
                    slab1Max: parseFloat(document.getElementById("rule-val-slab1")?.value || 25000),
                    slab1Amt: parseFloat(document.getElementById("rule-val-slab1")?.value || 100),
                    slab2Max: 50000,
                    slab2Amt: parseFloat(document.getElementById("rule-val-slab2")?.value || 150),
                    slab3Max: 100000,
                    slab3Amt: parseFloat(document.getElementById("rule-val-slab3")?.value || 250),
                    ratePercent: parseFloat(document.getElementById("rule-val-rate")?.value || 0.25),
                    slab4MaxCap: parseFloat(document.getElementById("rule-val-slab4-cap")?.value || 1000),
                    slab5MaxCap: parseFloat(document.getElementById("rule-val-slab5-cap")?.value || 1500),
                    slab6MaxCap: parseFloat(document.getElementById("rule-val-slab6-cap")?.value || 2000)
                },
                insurance: {
                    threshold: 200000,
                    slab1Amt: parseFloat(document.getElementById("rule-ins-slab1")?.value || 50),
                    slab2Amt: parseFloat(document.getElementById("rule-ins-slab2")?.value || 100)
                },
                docCharge: {
                    slab1Limit: 100000,
                    slab1Amt: parseFloat(document.getElementById("rule-doc-slab1")?.value || 50),
                    slab2Limit: 200000,
                    slab2Amt: parseFloat(document.getElementById("rule-doc-slab2")?.value || 100),
                    slab3Amt: parseFloat(document.getElementById("rule-doc-slab3")?.value || 200)
                },
                serviceCharge: {
                    threshold: 200000,
                    slab1Rate: parseFloat(document.getElementById("rule-srv-slab1-rate")?.value || 0.25),
                    slab1Cap: parseFloat(document.getElementById("rule-srv-slab1-cap")?.value || 500),
                    slab2Rate: parseFloat(document.getElementById("rule-srv-slab2-rate")?.value || 0.50),
                    slab2Cap: parseFloat(document.getElementById("rule-srv-slab2-cap")?.value || 5000)
                },
                stampDuty: {
                    exemptLimit: parseFloat(document.getElementById("rule-stamp-exempt")?.value || 50000),
                    slabLimit: parseFloat(document.getElementById("rule-stamp-limit")?.value || 119999),
                    ratePercent: parseFloat(document.getElementById("rule-stamp-rate")?.value || 0.25),
                    roundUpMultiple: parseFloat(document.getElementById("rule-stamp-round")?.value || 10),
                    aboveExtraFee: parseFloat(document.getElementById("rule-stamp-above-fee")?.value || 300),
                    scheme3527ExtraFee: parseFloat(document.getElementById("rule-stamp-3527-fee")?.value || 300)
                },
                gst: {
                    cgstPercent: parseFloat(document.getElementById("rule-cgst-rate")?.value || 9),
                    sgstPercent: parseFloat(document.getElementById("rule-sgst-rate")?.value || 9)
                },
                customCharges: state.rules.customCharges || []
            };

            saveState();
            calculateAllCharges();
            renderRulesMaster();
            showToast("Banking & Deduction Rules successfully saved!");

            // Sync Rules Master to Cloud Firestore (Live across all PCs)
            if (window.FirebaseService && typeof window.FirebaseService.saveRules === "function") {
                window.FirebaseService.saveRules(state.rules).catch(e => console.warn("[Firebase] Rules sync error:", e));
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (!state.currentSession || state.currentSession.code !== "99") {
                alert("Authorization Denied: Only Head Office (99) can reset rules.");
                return;
            }
            if (confirm("Are you sure you want to reset standard banking rules to default bank policy?")) {
                const existingCustom = state.rules?.customCharges || [];
                state.rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
                state.rules.customCharges = existingCustom;
                saveState();
                calculateAllCharges();
                renderRulesMaster();
                showToast("Rules reset to default standard.");

                if (window.FirebaseService && typeof window.FirebaseService.saveRules === "function") {
                    window.FirebaseService.saveRules(state.rules).catch(e => console.warn("[Firebase] Rules reset sync error:", e));
                }
            }
        });
    }

    // 3. Custom Charge Modal & Handlers
    const modal = document.getElementById("modal-custom-rule");
    const openBtn = document.getElementById("btn-open-custom-rule-modal");
    const openBtn2 = document.getElementById("btn-add-custom-charge-trigger");
    const closeBtn = document.getElementById("btn-close-custom-rule-modal");
    const cancelBtn = document.getElementById("btn-cancel-custom-rule");
    const customRuleForm = document.getElementById("custom-rule-form");

    function openModal(rule = null) {
        if (!state.currentSession || state.currentSession.code !== "99") {
            alert("Authorization Denied: Only Head Office (99) can create or modify custom charges.");
            return;
        }
        if (customRuleForm) customRuleForm.reset();
        const title = document.getElementById("modal-custom-rule-title");
        if (rule) {
            if (title) title.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> કસ્ટમ ચાર્જ સુધારો (Edit Charge Head)';
            document.getElementById("custom-rule-id").value = rule.id;
            document.getElementById("custom-rule-name-en").value = rule.nameEn || "";
            document.getElementById("custom-rule-name-gu").value = rule.nameGu || "";
            document.getElementById("custom-rule-code").value = rule.code || "";
            document.getElementById("custom-rule-calc-type").value = rule.calcType || "fixed";
            document.getElementById("custom-rule-value").value = rule.value || 0;
            document.getElementById("custom-rule-max-cap").value = rule.maxCap || "";
            document.getElementById("custom-rule-applicability").value = rule.applicability || "all";
            document.getElementById("custom-rule-gst-applicable").value = rule.gstApplicable || "no";
            document.getElementById("custom-rule-active").value = (rule.active === false || rule.active === "false") ? "false" : "true";
        } else {
            if (title) title.innerHTML = '<i class="fa-solid fa-circle-plus"></i> નવો ચાર્જ / નિયમ ઉમેરો (Add New Charge Head)';
            document.getElementById("custom-rule-id").value = "";
            document.getElementById("custom-rule-active").value = "true";
        }
        if (modal) modal.classList.remove("hidden");
    }

    function closeModal() {
        if (modal) modal.classList.add("hidden");
    }

    if (openBtn) openBtn.addEventListener("click", () => openModal(null));
    if (openBtn2) openBtn2.addEventListener("click", () => openModal(null));
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    if (customRuleForm) {
        customRuleForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const editId = document.getElementById("custom-rule-id").value;
            const nameEn = document.getElementById("custom-rule-name-en").value.trim();
            const nameGu = document.getElementById("custom-rule-name-gu").value.trim() || nameEn;
            const code = document.getElementById("custom-rule-code").value.trim().toUpperCase();
            const calcType = document.getElementById("custom-rule-calc-type").value;
            const value = parseFloat(document.getElementById("custom-rule-value").value || 0);
            const maxCap = document.getElementById("custom-rule-max-cap").value ? parseFloat(document.getElementById("custom-rule-max-cap").value) : null;
            const applicability = document.getElementById("custom-rule-applicability").value;
            const gstApplicable = document.getElementById("custom-rule-gst-applicable").value;
            const active = (document.getElementById("custom-rule-active").value === "true");

            if (!nameEn || !code || value < 0) {
                alert("Please fill all required custom charge details.");
                return;
            }

            state.rules = state.rules || JSON.parse(JSON.stringify(DEFAULT_RULES));
            state.rules.customCharges = state.rules.customCharges || [];

            const chargeObj = {
                id: editId || ("CR-" + Date.now()),
                nameEn,
                nameGu,
                code,
                calcType,
                value,
                maxCap,
                applicability,
                gstApplicable,
                active
            };

            if (editId) {
                const idx = state.rules.customCharges.findIndex(c => c.id === editId);
                if (idx !== -1) {
                    state.rules.customCharges[idx] = chargeObj;
                } else {
                    state.rules.customCharges.push(chargeObj);
                }
            } else {
                state.rules.customCharges.push(chargeObj);
            }

            saveState();
            calculateAllCharges();
            renderRulesMaster();
            closeModal();
            showToast("Custom Charge Rule saved successfully!");

            if (window.FirebaseService && typeof window.FirebaseService.saveRules === "function") {
                window.FirebaseService.saveRules(state.rules).catch(e => console.warn("[Firebase] Custom rules sync error:", e));
            }
        });
    }
}

function renderRulesMaster() {
    const isHO = (state.currentSession && state.currentSession.code === "99");
    const rules = state.rules || DEFAULT_RULES;

    // Notice banner
    const notice = document.getElementById("rules-branch-notice");
    if (notice) {
        if (isHO) notice.classList.add("hidden");
        else notice.classList.remove("hidden");
    }

    // Action buttons visibility
    const actionBtns = document.getElementById("rules-action-buttons");
    if (actionBtns) {
        actionBtns.style.display = isHO ? "flex" : "none";
    }

    // Form fields lock/unlock
    const form = document.getElementById("rules-master-form");
    if (form) {
        form.querySelectorAll("input, select").forEach(inp => {
            inp.disabled = !isHO;
            if (!isHO) {
                inp.style.backgroundColor = "#f8fafc";
                inp.style.cursor = "not-allowed";
            } else {
                inp.style.backgroundColor = "";
                inp.style.cursor = "";
            }
        });
    }

    // 1. Membership
    if (document.getElementById("rule-mem-limit")) document.getElementById("rule-mem-limit").value = rules.membership?.nonMemberLimit ?? 99999;
    if (document.getElementById("rule-share-b")) document.getElementById("rule-share-b").value = rules.membership?.shareGroupB ?? 50;
    if (document.getElementById("rule-share-a")) document.getElementById("rule-share-a").value = rules.membership?.shareGroupA ?? 500;
    if (document.getElementById("rule-member-fee")) document.getElementById("rule-member-fee").value = rules.membership?.memberFee ?? 25;

    // 2. Valuation
    if (document.getElementById("rule-val-slab1")) document.getElementById("rule-val-slab1").value = rules.valuation?.slab1Amt ?? 100;
    if (document.getElementById("rule-val-slab2")) document.getElementById("rule-val-slab2").value = rules.valuation?.slab2Amt ?? 150;
    if (document.getElementById("rule-val-slab3")) document.getElementById("rule-val-slab3").value = rules.valuation?.slab3Amt ?? 250;
    if (document.getElementById("rule-val-slab4-cap")) document.getElementById("rule-val-slab4-cap").value = rules.valuation?.slab4MaxCap ?? 1000;
    if (document.getElementById("rule-val-slab5-cap")) document.getElementById("rule-val-slab5-cap").value = rules.valuation?.slab5MaxCap ?? 1500;
    if (document.getElementById("rule-val-rate")) document.getElementById("rule-val-rate").value = rules.valuation?.ratePercent ?? 0.25;
    if (document.getElementById("rule-val-slab6-cap")) document.getElementById("rule-val-slab6-cap").value = rules.valuation?.slab6MaxCap ?? 2000;

    // 3. Doc & Insurance
    if (document.getElementById("rule-doc-slab1")) document.getElementById("rule-doc-slab1").value = rules.docCharge?.slab1Amt ?? 50;
    if (document.getElementById("rule-doc-slab2")) document.getElementById("rule-doc-slab2").value = rules.docCharge?.slab2Amt ?? 100;
    if (document.getElementById("rule-doc-slab3")) document.getElementById("rule-doc-slab3").value = rules.docCharge?.slab3Amt ?? 200;
    if (document.getElementById("rule-ins-slab1")) document.getElementById("rule-ins-slab1").value = rules.insurance?.slab1Amt ?? 50;
    if (document.getElementById("rule-ins-slab2")) document.getElementById("rule-ins-slab2").value = rules.insurance?.slab2Amt ?? 100;

    // 4. Service & GST
    if (document.getElementById("rule-srv-slab1-rate")) document.getElementById("rule-srv-slab1-rate").value = rules.serviceCharge?.slab1Rate ?? 0.25;
    if (document.getElementById("rule-srv-slab1-cap")) document.getElementById("rule-srv-slab1-cap").value = rules.serviceCharge?.slab1Cap ?? 500;
    if (document.getElementById("rule-srv-slab2-rate")) document.getElementById("rule-srv-slab2-rate").value = rules.serviceCharge?.slab2Rate ?? 0.50;
    if (document.getElementById("rule-srv-slab2-cap")) document.getElementById("rule-srv-slab2-cap").value = rules.serviceCharge?.slab2Cap ?? 5000;
    if (document.getElementById("rule-cgst-rate")) document.getElementById("rule-cgst-rate").value = rules.gst?.cgstPercent ?? 9;
    if (document.getElementById("rule-sgst-rate")) document.getElementById("rule-sgst-rate").value = rules.gst?.sgstPercent ?? 9;

    // 5. Stamp Duty
    if (document.getElementById("rule-stamp-exempt")) document.getElementById("rule-stamp-exempt").value = rules.stampDuty?.exemptLimit ?? 50000;
    if (document.getElementById("rule-stamp-limit")) document.getElementById("rule-stamp-limit").value = rules.stampDuty?.slabLimit ?? 119999;
    if (document.getElementById("rule-stamp-rate")) document.getElementById("rule-stamp-rate").value = rules.stampDuty?.ratePercent ?? 0.25;
    if (document.getElementById("rule-stamp-round")) document.getElementById("rule-stamp-round").value = rules.stampDuty?.roundUpMultiple ?? 10;
    if (document.getElementById("rule-stamp-above-fee")) document.getElementById("rule-stamp-above-fee").value = rules.stampDuty?.aboveExtraFee ?? 300;
    if (document.getElementById("rule-stamp-3527-fee")) document.getElementById("rule-stamp-3527-fee").value = rules.stampDuty?.scheme3527ExtraFee ?? 300;

    // Update count badge & custom table
    const countBadge = document.getElementById("custom-charges-count-badge");
    const count = (rules.customCharges || []).length;
    if (countBadge) countBadge.textContent = count;

    renderCustomChargesTable();
}

function renderCustomChargesTable() {
    const tbody = document.getElementById("custom-charges-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const isHO = (state.currentSession && state.currentSession.code === "99");
    const customList = state.rules?.customCharges || [];

    if (customList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:18px; color:var(--text-muted); font-size:13px;">કોઈ કસ્ટમ વધારાનો ચાર્જ ઉમેરેલ નથી. નવો ચાર્જ ઉમેરવા માટે "+ નવો ચાર્જ ઉમેરો" બટન દબાવો.</td></tr>';
        return;
    }

    customList.forEach((c, idx) => {
        const tr = document.createElement("tr");
        const typeBadge = c.calcType === "percent" 
            ? `<span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:700;">Percent (%)</span>` 
            : `<span class="badge" style="background:#fef3c7; color:#92400e; font-weight:700;">Fixed (₹)</span>`;
        
        const valText = c.calcType === "percent" 
            ? `<strong>${c.value}%</strong> ${c.maxCap ? `<br><small style="color:var(--text-muted);">Cap: ₹${c.maxCap}</small>` : ""}` 
            : `<strong>₹ ${c.value}</strong>`;

        let condText = "તમામ લોન";
        if (c.applicability === "non_member") condText = "ફક્ત નોન-મેમ્બર";
        else if (c.applicability === "member") condText = "ફક્ત મેમ્બર";
        else if (c.applicability === "scheme_3527") condText = "ફક્ત સ્કીમ 3527";

        const gstText = (c.gstApplicable === "yes" || c.gstApplicable === true)
            ? '<span style="color:#16a34a; font-weight:700;"><i class="fa-solid fa-check"></i> Yes (18%)</span>'
            : '<span style="color:var(--text-muted);">No</span>';

        const statusBadge = (c.active !== false && c.active !== "false")
            ? `<span class="badge badge-success toggle-rule-status" data-id="${c.id}" style="cursor:pointer;" title="Click to Toggle">Active</span>`
            : `<span class="badge badge-danger toggle-rule-status" data-id="${c.id}" style="cursor:pointer;" title="Click to Toggle">Inactive</span>`;

        tr.innerHTML = `
            <td style="text-align:center; font-weight:700;">${idx + 1}</td>
            <td><strong>${c.nameEn}</strong><br><small style="color:var(--text-secondary);">${c.nameGu || ""}</small></td>
            <td><span class="badge badge-gold font-bold">${c.code}</span></td>
            <td>${typeBadge}</td>
            <td>${valText}</td>
            <td><small style="font-weight:600;">${condText}</small></td>
            <td style="text-align:center;">${gstText}</td>
            <td style="text-align:center;">${statusBadge}</td>
            <td style="text-align:center; white-space:nowrap;">
                ${isHO ? `
                    <button type="button" class="btn-icon-blue edit-custom-charge-btn" data-id="${c.id}" title="Edit Charge"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button type="button" class="btn-icon-red delete-custom-charge-btn" data-id="${c.id}" title="Delete Charge"><i class="fa-solid fa-trash-can"></i></button>
                ` : '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (isHO) {
        tbody.querySelectorAll(".toggle-rule-status").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                const item = (state.rules.customCharges || []).find(x => x.id === id);
                if (item) {
                    item.active = !(item.active !== false && item.active !== "false");
                    saveState();
                    calculateAllCharges();
                    renderRulesMaster();

                    if (window.FirebaseService && typeof window.FirebaseService.saveRules === "function") {
                        window.FirebaseService.saveRules(state.rules).catch(e => console.warn("[Firebase] Rules toggle sync error:", e));
                    }

                    showToast(`Charge "${item.nameEn}" is now ${item.active ? 'Active' : 'Inactive'}.`);
                }
            });
        });

        tbody.querySelectorAll(".edit-custom-charge-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                const item = (state.rules.customCharges || []).find(x => x.id === id);
                if (item) {
                    const modal = document.getElementById("modal-custom-rule");
                    const title = document.getElementById("modal-custom-rule-title");
                    if (title) title.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> કસ્ટમ ચાર્જ સુધારો (Edit Charge Head)';
                    document.getElementById("custom-rule-id").value = item.id;
                    document.getElementById("custom-rule-name-en").value = item.nameEn || "";
                    document.getElementById("custom-rule-name-gu").value = item.nameGu || "";
                    document.getElementById("custom-rule-code").value = item.code || "";
                    document.getElementById("custom-rule-calc-type").value = item.calcType || "fixed";
                    document.getElementById("custom-rule-value").value = item.value || 0;
                    document.getElementById("custom-rule-max-cap").value = item.maxCap || "";
                    document.getElementById("custom-rule-applicability").value = item.applicability || "all";
                    document.getElementById("custom-rule-gst-applicable").value = item.gstApplicable || "no";
                    document.getElementById("custom-rule-active").value = (item.active === false || item.active === "false") ? "false" : "true";
                    if (modal) modal.classList.remove("hidden");
                }
            });
        });

        tbody.querySelectorAll(".delete-custom-charge-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                const item = (state.rules.customCharges || []).find(x => x.id === id);
                if (item && confirm(`Are you sure you want to delete charge "${item.nameEn}"?`)) {
                    state.rules.customCharges = state.rules.customCharges.filter(x => x.id !== id);
                    saveState();
                    calculateAllCharges();
                    renderRulesMaster();

                    if (window.FirebaseService && typeof window.FirebaseService.saveRules === "function") {
                        window.FirebaseService.saveRules(state.rules).catch(e => console.warn("[Firebase] Rules delete sync error:", e));
                    }

                    showToast("Custom charge deleted successfully.");
                }
            });
        });
    }
}

// ==================== SETTINGS (BRANCH-WISE ACCOUNT, PACKET & PROPOSAL SEQUENCES) ====================
function initSettings() {
    const branchSelect = document.getElementById("settings-branch-select");
    const form = document.getElementById("settings-branch-master-form");
    const saveBtn = document.getElementById("btn-save-branch-settings");
    const resetBtn = document.getElementById("reset-system-data-btn");

    if (branchSelect) {
        branchSelect.addEventListener("change", () => {
            renderBranchSettings(branchSelect.value);
        });
    }

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            saveBranchSettings();
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", (e) => {
            e.preventDefault();
            saveBranchSettings();
        });
    }

    const resetBranchSeedsBtn = document.getElementById("btn-reset-branch-seeds-zero");
    if (resetBranchSeedsBtn) {
        resetBranchSeedsBtn.addEventListener("click", () => {
            const isHO = isHeadOfficeSession();
            const branchSelect = document.getElementById("settings-branch-select");
            const currentCode = state.currentSession ? state.currentSession.code : "99";
            const selectedBranch = !isHO ? currentCode : (branchSelect ? branchSelect.value : currentCode);
            const numOnly = String(selectedBranch).replace(/\D/g, '');
            const bCode2 = numOnly ? numOnly.padStart(2, '0') : "99";
            const bCode3 = numOnly ? numOnly.padStart(3, '0') : "099";
            const bCode1 = numOnly ? String(parseInt(numOnly)) : "99";

            const branchObj = (state.branches || DEFAULT_BRANCHES).find(b => String(b.code).replace(/\D/g, '').padStart(2, '0') === bCode2) || { name: selectedBranch };

            if (confirm(`શું તમે ખરેખર ${branchObj.name} ના બધા એકાઉન્ટ નંબર, પેકેટ નંબર અને પ્રપોઝલ નંબર 0 (Fresh / Brand New) કરવા માંગો છો?`)) {
                if (!state.settings) state.settings = {};
                if (!state.settings.branchSeeds) state.settings.branchSeeds = {};

                const cleanZeroSeeds = {
                    accountSeeds: {
                        "3725": 0,
                        "3524": 0,
                        "3527": 0,
                        "3553": 0,
                        "GW-3725": 0,
                        "GD-3524": 0,
                        "GNA-3527": 0,
                        "GOD-3553": 0
                    },
                    lastPacketNo: 0,
                    lastProposalNo: 0
                };

                state.settings.branchSeeds[bCode2] = cleanZeroSeeds;
                state.settings.branchSeeds[bCode3] = cleanZeroSeeds;
                state.settings.branchSeeds[selectedBranch] = cleanZeroSeeds;
                state.settings.branchSeeds[bCode1] = cleanZeroSeeds;

                saveState();
                renderBranchSettings(selectedBranch);

                if (window.FirebaseService && window.FirebaseService.isInitialized && typeof window.FirebaseService.saveSettings === "function") {
                    window.FirebaseService.saveSettings(state.settings).catch(e => console.warn("[Firebase] Settings cloud sync error:", e));
                }

                updateLoanAmountLogic();
                const curBranch = document.getElementById("loan-branch") ? document.getElementById("loan-branch").value : (state.currentSession ? state.currentSession.code : "99");
                generateNextPacketNo(curBranch);
                generateNextProposalNo(curBranch);

                showToast(`શાખા ${branchObj.name} ના તમામ નંબર સફળતાપૂર્વક 0 (Fresh) કરી દેવામાં આવ્યા છે!`);
                alert(`શાખા ${branchObj.name} ના તમામ નંબર 0 (Fresh) કરી દેવામાં આવ્યા છે.\nનવો આવનાર પેકેટ નંબર: 1\nનવો પ્રપોઝલ નંબર: CBB/2026/0001\nનવો ખાતા નંબર: 001-3725-00000001`);
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (confirm("CRITICAL WARNING: This will permanently delete ALL loans and custom data. Are you sure?")) {
                localStorage.removeItem(STORAGE_KEY);
                state = JSON.parse(JSON.stringify(DEFAULT_STATE));
                saveState();
                alert("Data reset complete. Reloading...");
                window.location.reload();
            }
        });
    }

    renderBranchSettings();
}

function getUniqueProductCodes() {
    const products = state.products || DEFAULT_PRODUCTS;
    const seen = new Set();
    const result = [];

    products.forEach(p => {
        const numMatch = String(p.code).match(/\d+/);
        const pCode4 = numMatch ? numMatch[0].padStart(4, '0') : p.code;
        if (!seen.has(pCode4)) {
            seen.add(pCode4);
            result.push({
                code: p.code,
                pCode4: pCode4,
                shortCode: numMatch ? numMatch[0] : p.code,
                name: p.name || p.code
            });
        }
    });

    // Ensure standard schemes exist
    const standardSchemes = [
        { pCode4: "3725", code: "GW-3725", name: "Gold Loan up to ₹100,000 (GW-3725)" },
        { pCode4: "3524", code: "GD-3524", name: "Gold Loan ₹100,001 to ₹200,000 (GD-3524)" },
        { pCode4: "3527", code: "GNA-3527", name: "Gold Loan above ₹200,000 (Installment) (GNA-3527)" },
        { pCode4: "3553", code: "GOD-3553", name: "Gold Loan above ₹200,000 (Overdraft) (GOD-3553)" }
    ];

    standardSchemes.forEach(s => {
        if (!seen.has(s.pCode4)) {
            seen.add(s.pCode4);
            result.push({
                code: s.code,
                pCode4: s.pCode4,
                shortCode: s.pCode4,
                name: s.name
            });
        }
    });

    return result;
}

function saveBranchSettings(targetBranch = null) {
    const isHO = isHeadOfficeSession();
    const branchSelect = document.getElementById("settings-branch-select");
    const currentCode = state.currentSession ? state.currentSession.code : "99";
    const selectedBranch = !isHO ? currentCode : (targetBranch || (branchSelect ? branchSelect.value : currentCode));
    const numOnly = String(selectedBranch).replace(/\D/g, '');
    const bCode2 = numOnly ? numOnly.padStart(2, '0') : "99";
    const bCode3 = numOnly ? numOnly.padStart(3, '0') : "099";
    const bCode1 = numOnly ? String(parseInt(numOnly)) : "99";

    if (!state.settings) state.settings = {};
    if (!state.settings.branchSeeds) state.settings.branchSeeds = {};

    const acSeeds = {};
    const uniqueProds = getUniqueProductCodes();
    uniqueProds.forEach(p => {
        const inp = document.getElementById(`seed-ac-${p.pCode4}`);
        const val = inp ? (parseInt(inp.value || 0) || 0) : 0;
        acSeeds[p.pCode4] = val;
        acSeeds[p.code] = val;
        acSeeds[p.shortCode] = val;
    });

    const packetInput = document.getElementById("branch-last-packet-no");
    const proposalInput = document.getElementById("branch-last-proposal-no");
    const lastPacketVal = parseInt(packetInput ? packetInput.value || 0 : 0) || 0;
    const lastProposalVal = parseInt(proposalInput ? proposalInput.value || 0 : 0) || 0;

    const seedObj = {
        accountSeeds: acSeeds,
        lastPacketNo: lastPacketVal,
        lastProposalNo: lastProposalVal
    };

    state.settings.branchSeeds[bCode2] = seedObj;
    state.settings.branchSeeds[bCode3] = seedObj;
    state.settings.branchSeeds[selectedBranch] = seedObj;
    state.settings.branchSeeds[bCode1] = seedObj;

    saveState();
    renderBranchSettings(selectedBranch);

    // Sync Branch Seeds & Settings to Cloud Firestore (Live across all PCs)
    if (window.FirebaseService && window.FirebaseService.isInitialized && typeof window.FirebaseService.saveSettings === "function") {
        window.FirebaseService.saveSettings(state.settings).catch(e => console.warn("[Firebase] Settings cloud sync error:", e));
    }

    // Refresh loan entry active form
    updateLoanAmountLogic();
    const curBranch = document.getElementById("loan-branch") ? document.getElementById("loan-branch").value : (state.currentSession ? state.currentSession.code : "99");
    generateNextPacketNo(curBranch);
    generateNextProposalNo(curBranch);

    const branchObj = (state.branches || DEFAULT_BRANCHES).find(b => String(b.code).replace(/\D/g, '').padStart(2, '0') === bCode2) || { name: selectedBranch };
    showToast(`શાખા ${branchObj.name} ના એકાઉન્ટ અને પેકેટ સેટીંગ્સ સફળતાપૂર્વક સેવ થઈ ગયા!`);
}

function renderBranchSettings(targetBranch = null) {
    const branchSelect = document.getElementById("settings-branch-select");
    const container = document.getElementById("account-seeds-container");
    if (!branchSelect || !container) return;

    const isHO = isHeadOfficeSession();
    const branches = state.branches || DEFAULT_BRANCHES;
    const currentCode = state.currentSession ? state.currentSession.code : "99";
    const currentBranchObj = branches.find(b => String(b.code) === String(currentCode)) || (state.currentSession || { code: currentCode, name: currentCode });
    const currentName = currentBranchObj.name || (state.currentSession ? state.currentSession.name : currentCode);
    
    // Maintain current dropdown selection if valid, otherwise fallback to session code or targetBranch
    let selectedBranch = targetBranch;
    if (!isHO) {
        selectedBranch = currentCode;
    } else if (!selectedBranch) {
        selectedBranch = branchSelect.value ? branchSelect.value : currentCode;
    }
    
    const numOnly = String(selectedBranch).replace(/\D/g, '');
    const bCode2 = numOnly ? numOnly.padStart(2, '0') : "99";
    const bCode3 = numOnly ? numOnly.padStart(3, '0') : "099";

    // Populate branch options
    if (!isHO) {
        branchSelect.innerHTML = `<option value="${currentCode}">${currentCode} ${currentName}</option>`;
        branchSelect.value = currentCode;
        branchSelect.disabled = true;
        branchSelect.style.backgroundColor = "#f1f5f9";
        branchSelect.style.cursor = "not-allowed";
    } else {
        branchSelect.disabled = false;
        branchSelect.style.backgroundColor = "";
        branchSelect.style.cursor = "default";
        if (branchSelect.children.length !== branches.length) {
            branchSelect.innerHTML = "";
            branches.forEach(b => {
                const opt = document.createElement("option");
                opt.value = b.code;
                opt.textContent = `${b.code} ${b.name}`;
                if (b.code === selectedBranch || String(b.code).replace(/\D/g, '').padStart(2, '0') === bCode2) {
                    opt.selected = true;
                }
                branchSelect.appendChild(opt);
            });
        }
        branchSelect.value = selectedBranch;
    }

    // Toggle Factory Reset Card visibility
    const factoryResetCard = document.getElementById("settings-factory-reset-card") || (document.getElementById("reset-system-data-btn") ? document.getElementById("reset-system-data-btn").closest(".card") : null);
    if (factoryResetCard) {
        factoryResetCard.style.display = isHO ? "" : "none";
    }

    if (!state.settings) state.settings = {};
    if (!state.settings.branchSeeds) state.settings.branchSeeds = {};
    const branchConfig = state.settings.branchSeeds[bCode2] 
                      || state.settings.branchSeeds[bCode3] 
                      || state.settings.branchSeeds[selectedBranch] 
                      || {};
    const acSeeds = branchConfig.accountSeeds || {};

    const uniqueProds = getUniqueProductCodes();
    container.innerHTML = "";

    uniqueProds.forEach(p => {
        const pCode4 = p.pCode4;
        const currentVal = acSeeds[pCode4] !== undefined 
            ? acSeeds[pCode4] 
            : (acSeeds[p.code] !== undefined ? acSeeds[p.code] : (acSeeds[p.shortCode] || 0));

        // Count existing loans for this branch & this product
        const count = (state.loans || []).filter(l => {
            const lBranch = String(l.branchCode || "").replace(/\D/g, '');
            const lProdMatch = String(l.loanType || "").match(/\d+/);
            const lProd = lProdMatch ? lProdMatch[0].padStart(4, "0") : "";
            return (lBranch === numOnly || lBranch === bCode2 || lBranch === bCode3) && (lProd === pCode4);
        }).length;

        const nextSerial = parseInt(currentVal || 0) + count + 1;
        const nextSampleAcc = `${bCode3}-${pCode4}-${String(nextSerial).padStart(8, '0')}`;

        const rowDiv = document.createElement("div");
        rowDiv.className = "form-group";
        rowDiv.style.cssText = "background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 14px;";
        rowDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <div>
                    <span class="badge badge-gold" style="font-weight:700;">${p.code}</span>
                    <strong style="margin-left:6px; font-size:13px;">${p.name}</strong>
                </div>
                <small style="color:var(--text-secondary);">વર્તમાન લોન: <strong>${count}</strong></small>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="flex:1;">
                    <label style="font-size:11px; margin-bottom:2px;">છેલ્લો ખાતા નંબર (Last Account Serial):</label>
                    <input type="number" id="seed-ac-${pCode4}" class="seed-ac-input" data-pcode="${pCode4}" value="${currentVal}" min="0" placeholder="0" style="font-weight:700; width:100%; height:38px;">
                </div>
                <div style="flex:1.2; background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; padding:6px 10px;">
                    <div style="font-size:10.5px; color:var(--text-secondary);">આગામી નવો ખાતા નંબર:</div>
                    <div id="seed-preview-${pCode4}" style="font-weight:800; color:var(--primary); font-family:monospace; font-size:13px;">${nextSampleAcc}</div>
                </div>
            </div>
        `;
        container.appendChild(rowDiv);
    });

    // Real-time calculation on typing in seed input
    container.querySelectorAll(".seed-ac-input").forEach(inp => {
        inp.addEventListener("input", () => {
            const pCode4 = inp.getAttribute("data-pcode");
            const val = parseInt(inp.value || 0);
            const count = (state.loans || []).filter(l => {
                const lBranch = String(l.branchCode || "").replace(/\D/g, '');
                const lProdMatch = String(l.loanType || "").match(/\d+/);
                const lProd = lProdMatch ? lProdMatch[0].padStart(4, "0") : "";
                return (lBranch === numOnly || lBranch === bCode2 || lBranch === bCode3) && (lProd === pCode4);
            }).length;
            const nextSerial = val + count + 1;
            const previewEl = document.getElementById(`seed-preview-${pCode4}`);
            if (previewEl) {
                previewEl.textContent = `${bCode3}-${pCode4}-${String(nextSerial).padStart(8, '0')}`;
            }
        });
    });

    // Packet & Proposal numbers
    const packetInp = document.getElementById("branch-last-packet-no");
    const proposalInp = document.getElementById("branch-last-proposal-no");
    const packetHint = document.getElementById("sample-next-packet-hint");
    const proposalHint = document.getElementById("sample-next-proposal-hint");

    const curPacketVal = branchConfig.lastPacketNo !== undefined ? branchConfig.lastPacketNo : (state.settings.lastPacketSeed || 0);
    const curProposalVal = branchConfig.lastProposalNo || 0;

    if (packetInp) packetInp.value = curPacketVal;
    if (proposalInp) proposalInp.value = curProposalVal;

    const branchLoanCount = (state.loans || []).filter(l => {
        const lBranch = String(l.branchCode || "").replace(/\D/g, '');
        return lBranch === numOnly || lBranch === bCode2 || lBranch === bCode3;
    }).length;

    const branchLetters = getBranchFirst3Letters(selectedBranch || bCode2);
    const currentYear = new Date().getFullYear();
    const nextPacketNo = parseInt(curPacketVal || 0) + branchLoanCount + 1;
    const nextProposalNo = parseInt(curProposalVal || 0) + branchLoanCount + 1;
    const proposalFormatted = `${branchLetters}/${currentYear}/${String(nextProposalNo).padStart(4, '0')}`;

    if (packetHint) packetHint.innerHTML = `આવનાર નવો પેકેટ નંબર: <strong>${nextPacketNo}</strong> (શાખામાં કુલ લોન: ${branchLoanCount})`;
    if (proposalHint) proposalHint.innerHTML = `આવનાર નવો પ્રપોઝલ / સીરીયલ નંબર: <strong>${proposalFormatted}</strong>`;

    if (packetInp) {
        packetInp.oninput = () => {
            const nextP = (parseInt(packetInp.value || 0)) + branchLoanCount + 1;
            if (packetHint) packetHint.innerHTML = `આવનાર નવો પેકેટ નંબર: <strong>${nextP}</strong> (શાખામાં કુલ લોન: ${branchLoanCount})`;
        };
    }

    if (proposalInp) {
        proposalInp.oninput = () => {
            const nextProp = (parseInt(proposalInp.value || 0)) + branchLoanCount + 1;
            if (proposalHint) proposalHint.innerHTML = `આવનાર નવો પ્રપોઝલ / સીરીયલ નંબર: <strong>${branchLetters}/${currentYear}/${String(nextProp).padStart(4, '0')}</strong>`;
        };
    }
}

// ==================== UNIVERSAL MULTI-SHEET BACKUP & RESTORE ENGINE ====================
function updateBackupStats() {
    const elLoans = document.getElementById("bkp-stat-loans");
    const elValuers = document.getElementById("bkp-stat-valuers");
    const elProducts = document.getElementById("bkp-stat-products");
    const elBranches = document.getElementById("bkp-stat-branches");
    const elRules = document.getElementById("bkp-stat-rules");

    if (elLoans) elLoans.textContent = state.loans ? state.loans.length : 0;
    if (elValuers) elValuers.textContent = state.valuers ? state.valuers.length : 0;
    if (elProducts) elProducts.textContent = state.products ? state.products.length : 0;
    if (elBranches) elBranches.textContent = state.branches ? state.branches.length : 0;
    if (elRules) {
        const customCount = state.rules?.customCharges?.length || 0;
        elRules.textContent = customCount > 0 ? `Standard + ${customCount} Custom` : "Standard Rules";
    }
}

function initBackupRestore() {
    // 0. Google Drive Automated Cloud Backup & Scheduler
    initGDriveIntegration();

    // 1. Secure Enterprise Data Vault (.jccb / .json)
    const exportSecureBtn = document.getElementById("btn-export-backup-secure");
    const exportJsonBtn = document.getElementById("btn-export-backup-json");
    const importSecureBtn = document.getElementById("btn-import-restore-secure");
    const fileSecureInput = document.getElementById("restore-secure-file");

    if (exportSecureBtn) {
        exportSecureBtn.addEventListener("click", () => exportSecureVaultBackup("jccb"));
    }

    if (exportJsonBtn) {
        exportJsonBtn.addEventListener("click", () => exportSecureVaultBackup("json"));
    }

    if (fileSecureInput) {
        fileSecureInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleSecureFileSelected(e.target.files[0]);
            } else {
                handleSecureFileSelected(null);
            }
        });
    }

    if (importSecureBtn) {
        importSecureBtn.addEventListener("click", () => {
            importSecureVaultBackup();
        });
    }

    // 2. Universal Excel (.xlsx)
    const exportBtn = document.getElementById("btn-export-backup-excel");
    const importBtn = document.getElementById("btn-import-restore-excel");
    const fileInput = document.getElementById("restore-excel-file");

    if (exportBtn) {
        exportBtn.addEventListener("click", exportCompleteBackupExcel);
    }

    if (importBtn && fileInput) {
        importBtn.addEventListener("click", () => {
            if (!fileInput.files || fileInput.files.length === 0) {
                alert("કૃપા કરીને પહેલા માન્ય બેકઅપ એક્સેલ ફાઈલ (.xlsx) પસંદ કરો.");
                return;
            }
            if (confirm("ચેતવણી: આ બેકઅપ ફાઈલ રિસ્ટોર કરવાથી સિસ્ટમનો ચાલુ ડેટા અપડેટ થઈ જશે. શું તમે આગળ વધવા માંગો છો?")) {
                importCompleteRestoreExcel(fileInput.files[0]);
            }
        });
    }

    updateBackupStats();
}

function exportCompleteBackupExcel() {
    try {
        if (typeof XLSX === "undefined") {
            if (confirm("SheetJS લાઈબ્રેરી લોડ થઈ શકી નથી. શું તમે સંપૂર્ણ JSON માસ્ટર બેકઅપ ફાઈલ ડાઉનલોડ કરવા માંગો છો?")) {
                exportJSONMasterBackup();
            }
            return;
        }

        const wb = XLSX.utils.book_new();
        const photoVaultRows = [];
        const CHUNK_SIZE = 25000; // Strictly below Excel 32,767 per-cell limit to avoid truncation/corruption

        const vaultLargeString = (key, str) => {
            if (!str || typeof str !== "string") return "";
            if (str.length <= CHUNK_SIZE) return str;

            const totalChunks = Math.ceil(str.length / CHUNK_SIZE);
            for (let i = 0; i < totalChunks; i++) {
                photoVaultRows.push({
                    "VaultKey": key,
                    "ChunkIndex": i,
                    "TotalChunks": totalChunks,
                    "DataChunk": str.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
                });
            }
            return `VAULT_REF:${key}`;
        };

        // 1. Loans Directory (All Branches)
        const loansData = (state.loans || []).map((l, idx) => ({
            "ID": l.id || "",
            "ProposalNo": l.loanNo || "",
            "Date": l.date || "",
            "LoanStatus": l.loanStatus || "New",
            "BranchCode": String(l.branchCode || "99").padStart(2, "0"),
            "BranchName": l.branchName || "",
            "AccountNo": formatLoanAccountNo(l.accountNo, l.branchCode, l.loanType),
            "PacketNo": l.packetNo || "",
            "CustomerNo": l.customerNo || "",
            "IsMember": (l.isMember === true || l.isMember === "Yes") ? "Yes" : "No",
            "MemberNo": l.memberNo || "",
            "BorrowerName": l.borrowerName || "",
            "Mobile": l.mobile || "",
            "Address": l.address || "",
            "SavingsAc": l.savingsAc || "",
            "DOB": l.dob || "",
            "Age": l.age || (l.dob ? calculateAgeFromDOB(l.dob, l.date) : ""),
            "Occupation": l.occupation || "",
            "Religion": l.religion || "",
            "Caste": l.caste || "",
            "NomineeName": l.nomineeName || "",
            "NomineeRelation": l.nomineeRelation || "",
            "ValuerName": l.valuerName || "",
            "LoanType": l.loanType || "GW-3725",
            "InterestRate": l.interestRate || 11.50,
            "SanctionedAmount": l.sanctionedAmount || 0,
            "ValuationAmount": l.valuationAmount || 0,
            "GoldWeight": l.goldWeight || 0,
            "GrossWeight": l.grossWeight || l.goldWeight || 0,
            "Purpose": l.purpose || "",
            "ShareA": l.shareA || 0,
            "ShareB": l.shareB || 0,
            "MemberFee": l.memberFee || 0,
            "ValuerFee": l.valuerFee || 0,
            "StampDuty": l.stampDuty || 0,
            "ServiceCharge": l.serviceCharge || 0,
            "DocCharges": l.docCharges || 0,
            "Insurance": l.insurance || 0,
            "CGST": l.cgst || 0,
            "SGST": l.sgst || 0,
            "OtherCharges": l.otherCharges || 0,
            "CustomChargesJSON": vaultLargeString(`LOAN_${l.id || idx}_custom_charges`, JSON.stringify(l.customCharges || [])),
            "CustomChargesTotal": l.customChargesTotal || 0,
            "TotalDeductions": l.totalDeductions || 0,
            "EmiAmount": l.emiAmount || 0,
            "Installments": l.installments || 36,
            "GrievanceOfficer": l.grievanceOfficer || "Amrutlal Valjibhai Chavda",
            "OrnamentsTableJSON": vaultLargeString(`LOAN_${l.id || idx}_ornaments`, JSON.stringify(l.ornamentsTable || [])),
            "CustomerPhoto": vaultLargeString(`LOAN_${l.id || idx}_cust_photo`, l.customerPhoto || l.photo || ""),
            "OrnamentPhoto": vaultLargeString(`LOAN_${l.id || idx}_orn_photo`, l.ornamentPhoto || l.goldPhoto || ""),
            "UpdatedAt": l.updatedAt || new Date().toISOString()
        }));

        const wsLoans = loansData.length > 0 
            ? XLSX.utils.json_to_sheet(loansData) 
            : XLSX.utils.aoa_to_sheet([["ID", "ProposalNo", "Date", "LoanStatus", "BranchCode", "BranchName", "AccountNo", "PacketNo", "CustomerNo", "IsMember", "MemberNo", "BorrowerName", "Mobile", "Address", "SavingsAc", "DOB", "Age", "Occupation", "Religion", "Caste", "NomineeName", "NomineeRelation", "ValuerName", "LoanType", "InterestRate", "SanctionedAmount", "ValuationAmount", "GoldWeight", "GrossWeight", "Purpose", "ShareA", "ShareB", "MemberFee", "ValuerFee", "StampDuty", "ServiceCharge", "DocCharges", "Insurance", "CGST", "SGST", "OtherCharges", "CustomChargesJSON", "CustomChargesTotal", "TotalDeductions", "EmiAmount", "Installments", "GrievanceOfficer", "OrnamentsTableJSON", "CustomerPhoto", "OrnamentPhoto", "UpdatedAt"]]);
        XLSX.utils.book_append_sheet(wb, wsLoans, "1_Loans_Register");

        // 2. Customer Master
        const customersData = (state.customers || []).map((c, idx) => ({
            "id": c.id || ("CUST-" + (idx + 1)),
            "customerNo": c.customerNo || "",
            "name": c.name || "",
            "isMember": (c.isMember === true || c.isMember === "yes" || c.isMember === "Yes") ? "Yes" : "No",
            "memberNo": c.memberNo || "",
            "address": c.address || "",
            "savingsAc": c.savingsAc || "",
            "dob": c.dob || "",
            "age": c.age || "",
            "occupation": c.occupation || "",
            "religion": c.religion || "",
            "caste": c.caste || "",
            "mobile": c.mobile || "",
            "nomineeName": c.nomineeName || "",
            "nomineeRelation": c.nomineeRelation || "",
            "photo": vaultLargeString(`CUST_${c.id || c.customerNo || idx}_photo`, c.photo || c.customerPhoto || "")
        }));
        const wsCustomers = (customersData.length > 0)
            ? XLSX.utils.json_to_sheet(customersData)
            : XLSX.utils.aoa_to_sheet([["id", "customerNo", "name", "isMember", "memberNo", "address", "savingsAc", "dob", "age", "occupation", "religion", "caste", "mobile", "nomineeName", "nomineeRelation", "photo"]]);
        XLSX.utils.book_append_sheet(wb, wsCustomers, "2_Customer_Master");

        // 3. Valuer Master
        const wsValuers = (state.valuers && state.valuers.length > 0)
            ? XLSX.utils.json_to_sheet(state.valuers)
            : XLSX.utils.aoa_to_sheet([["id", "name", "phone", "address", "savingsAc", "branch", "active"]]);
        XLSX.utils.book_append_sheet(wb, wsValuers, "3_Valuer_Master");

        // 4. Product Master
        const wsProducts = (state.products && state.products.length > 0)
            ? XLSX.utils.json_to_sheet(state.products)
            : XLSX.utils.aoa_to_sheet([["id", "code", "shortCode", "minAmt", "maxAmt", "rate", "name", "type"]]);
        XLSX.utils.book_append_sheet(wb, wsProducts, "4_Product_Master");

        // 5. Branch Master
        const branchesData = (state.branches || []).map(b => ({
            "code": b.code,
            "name": b.name,
            "password": b.password || (b.code === "99" ? "Rahul#80810" : "Admin@123"),
            "isHO": (b.isHO || b.code === "99") ? "Yes" : "No"
        }));
        const wsBranches = (branchesData.length > 0)
            ? XLSX.utils.json_to_sheet(branchesData)
            : XLSX.utils.aoa_to_sheet([["code", "name", "password", "isHO"]]);
        XLSX.utils.book_append_sheet(wb, wsBranches, "5_Branch_Master");

        // 6. Gold Rates History
        const wsRates = (state.rateHistory && state.rateHistory.length > 0)
            ? XLSX.utils.json_to_sheet(state.rateHistory)
            : XLSX.utils.aoa_to_sheet([["date", "rate24K", "rate22K"]]);
        XLSX.utils.book_append_sheet(wb, wsRates, "6_Gold_Rates_History");

        // 7. Rules Master & Dynamic Custom Charges
        const rulesExportData = [{
            "RulesConfigJSON": vaultLargeString("SYSTEM_RULES_CONFIG", JSON.stringify(state.rules || DEFAULT_RULES)),
            "LastUpdated": new Date().toISOString()
        }];
        const wsRules = XLSX.utils.json_to_sheet(rulesExportData);
        XLSX.utils.book_append_sheet(wb, wsRules, "7_Rules_Master");

        // 8. System Config & Branch Seeds
        const settingsExportData = [{
            "SettingsJSON": vaultLargeString("SYSTEM_SETTINGS_CONFIG", JSON.stringify(state.settings || { branchSeeds: {} })),
            "LastUpdated": new Date().toISOString()
        }];
        const wsSettings = XLSX.utils.json_to_sheet(settingsExportData);
        XLSX.utils.book_append_sheet(wb, wsSettings, "8_System_Settings");

        // 9. Photo & Large Data Vault Sheet (Safe 25KB chunks per cell)
        const wsVault = (photoVaultRows.length > 0)
            ? XLSX.utils.json_to_sheet(photoVaultRows)
            : XLSX.utils.aoa_to_sheet([["VaultKey", "ChunkIndex", "TotalChunks", "DataChunk"]]);
        XLSX.utils.book_append_sheet(wb, wsVault, "9_Photo_Vault");

        const dateStr = new Date().toISOString().split("T")[0];
        const fileName = `JCCB_GoldLoan_Universal_Database_${dateStr}.xlsx`;

        // Direct binary blob download for maximum cross-browser reliability
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        showToast("સંપૂર્ણ સિસ્ટમનો યુનિવર્સલ એક્સેલ બેકઅપ સફળતાપૂર્વક ડાઉનલોડ થયો!");
    } catch (err) {
        console.error("Backup Excel Export Error:", err);
        alert("બેકઅપ ડાઉનલોડ કરતી વખતે ક્ષતિ આવી: " + err.message);
    }
}

// ==================== SECURE ENTERPRISE DATA VAULT (.JCCB / .JSON) ENGINE ====================
let pendingSecureVaultData = null;

function calculateVaultChecksum(dataStr) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < dataStr.length; i++) {
        hash ^= dataStr.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

function exportSecureVaultBackup(format = "jccb") {
    try {
        const dateStr = new Date().toISOString().split("T")[0];
        const rawDatabase = {
            loans: state.loans || [],
            customers: state.customers || [],
            valuers: state.valuers || [],
            products: state.products || [],
            branches: state.branches || [],
            rateHistory: state.rateHistory || [],
            goldRates: state.goldRates || { "24K": 0, "22K": 0 },
            rules: state.rules || DEFAULT_RULES,
            settings: state.settings || { branchSeeds: {} }
        };

        const dbString = JSON.stringify(rawDatabase);
        const checksum = calculateVaultChecksum(dbString);

        const vaultPackage = {
            appSignature: "JCCB_GOLD_LOAN_ENTERPRISE_VAULT",
            bankName: "THE JUNAGADH COMMERCIAL CO-OPERATIVE BANK LTD.",
            vaultVersion: "2.0",
            exportTimestamp: new Date().toISOString(),
            exportDateFormatted: formatDateDMY(new Date()),
            exportedBy: (state.currentSession && state.currentSession.name) ? `${state.currentSession.name} (${state.currentSession.code})` : "Head Office (99)",
            stats: {
                loansCount: (state.loans || []).length,
                customersCount: (state.customers || []).length,
                valuersCount: (state.valuers || []).length,
                productsCount: (state.products || []).length,
                branchesCount: (state.branches || []).length,
                rateHistoryCount: (state.rateHistory || []).length,
                hasCustomRules: !!(state.rules?.customCharges?.length > 0),
                customRulesCount: state.rules?.customCharges?.length || 0,
                hasBranchSeeds: !!(state.settings?.branchSeeds && Object.keys(state.settings.branchSeeds).length > 0)
            },
            checksum: checksum,
            database: rawDatabase
        };

        const finalOutputStr = JSON.stringify(vaultPackage, null, 2);
        const ext = format === "json" ? "json" : "jccb";
        const mimeType = format === "json" ? "application/json" : "application/octet-stream";
        const fileName = `JCCB_GoldLoan_SecureVault_${dateStr}.${ext}`;

        const blob = new Blob([finalOutputStr], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        showToast(`સંપૂર્ણ સિક્યોર વૉલ્ટ બેકઅપ ફાઈલ (${fileName}) સફળતાપૂર્વક ડાઉનલોડ થઈ ગઈ છે!`);
    } catch (err) {
        console.error("Secure Vault Export Error:", err);
        alert("સિક્યોર વૉલ્ટ ડાઉનલોડ કરતી વખતે ક્ષતિ આવી: " + err.message);
    }
}

function exportJSONMasterBackup() {
    exportSecureVaultBackup("json");
}

function handleSecureFileSelected(file) {
    const previewBox = document.getElementById("restore-secure-preview-box");
    const previewChecksum = document.getElementById("secure-preview-checksum");
    const previewDetails = document.getElementById("secure-preview-details");

    if (!file) {
        if (previewBox) previewBox.classList.add("hidden");
        pendingSecureVaultData = null;
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            const parsed = JSON.parse(content);
            
            let db = null;
            let isValidVault = false;
            let checkStatus = "Unknown";
            let stats = {};

            if (parsed.appSignature === "JCCB_GOLD_LOAN_ENTERPRISE_VAULT" && parsed.database) {
                db = parsed.database;
                isValidVault = true;
                const dbStr = JSON.stringify(db);
                const calcHash = calculateVaultChecksum(dbStr);
                if (parsed.checksum && parsed.checksum === calcHash) {
                    checkStatus = "Verified & Authentic (✅ ૧૦૦% માન્ય ચેકસમ)";
                } else {
                    checkStatus = "Checksum Warning (ચેતવણી: ચેકસમ મેળ ખાતો નથી)";
                }
                stats = parsed.stats || {};
            } else if (parsed.loans || parsed.customers || parsed.branches) {
                db = parsed;
                isValidVault = true;
                checkStatus = "Standard JSON Backup";
                stats = {
                    loansCount: (parsed.loans || []).length,
                    customersCount: (parsed.customers || []).length,
                    valuersCount: (parsed.valuers || []).length,
                    branchesCount: (parsed.branches || []).length
                };
            } else {
                throw new Error("અમાન્ય ફાઈલ ફોર્મેટ: આ અધિકૃત JCCB બેકઅપ વૉલ્ટ ફાઈલ નથી.");
            }

            pendingSecureVaultData = {
                vault: parsed,
                database: db,
                isValid: isValidVault,
                fileName: file.name
            };

            if (previewBox && previewDetails && previewChecksum) {
                previewBox.classList.remove("hidden");
                previewChecksum.textContent = checkStatus;
                previewChecksum.className = checkStatus.includes("Warning") ? "badge badge-danger" : "badge badge-success";
                
                const exportDate = parsed.exportDateFormatted || parsed.exportTimestamp || "N/A";
                const exportedBy = parsed.exportedBy || "N/A";
                const loanCount = stats.loansCount !== undefined ? stats.loansCount : (db.loans || []).length;
                const custCount = stats.customersCount !== undefined ? stats.customersCount : (db.customers || []).length;
                const valuerCount = stats.valuersCount !== undefined ? stats.valuersCount : (db.valuers || []).length;
                const branchCount = stats.branchesCount !== undefined ? stats.branchesCount : (db.branches || []).length;

                previewDetails.innerHTML = `
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:4px;">
                        <div>• <strong>ફાઈલ નામ:</strong> ${file.name}</div>
                        <div>• <strong>એક્સપોર્ટ તારીખ:</strong> ${exportDate}</div>
                        <div>• <strong>કુલ લોન રેકોર્ડ્સ:</strong> <span style="color:#16a34a; font-weight:800;">${loanCount}</span></div>
                        <div>• <strong>ગ્રાહક પ્રોફાઈલ:</strong> <span style="color:#2563eb; font-weight:800;">${custCount}</span></div>
                        <div>• <strong>વેલ્યુઅર્સ / બ્રાન્ચ:</strong> ${valuerCount} / ${branchCount}</div>
                        <div>• <strong>એક્સપોર્ટ કરનાર:</strong> ${exportedBy}</div>
                    </div>
                `;
            }
        } catch (err) {
            console.error("Secure File Preview Error:", err);
            pendingSecureVaultData = null;
            if (previewBox) previewBox.classList.add("hidden");
            alert("ફાઈલ વાંચવામાં ક્ષતિ આવી: " + err.message);
        }
    };
    reader.readAsText(file);
}

function importSecureVaultBackup() {
    const fileInput = document.getElementById("restore-secure-file");
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert("કૃપા કરીને પહેલા સિક્યોર વૉલ્ટ બેકઅપ ફાઈલ (.jccb અથવા .json) પસંદ કરો.");
        return;
    }

    if (!pendingSecureVaultData || !pendingSecureVaultData.database) {
        alert("બેકઅપ ફાઈલ વેરિફિકેશન પૂર્ણ થયું નથી. કૃપા કરીને ફાઈલ ફરીથી પસંદ કરો.");
        return;
    }

    const db = pendingSecureVaultData.database;
    const loanCount = (db.loans || []).length;
    const custCount = (db.customers || []).length;

    const confirmMsg = `શું તમે ખરેખર આ સિક્યોર વૉલ્ટ ફાઈલમાંથી ડેટા રીસ્ટોર કરવા માંગો છો?\n\n` +
        `• કુલ લોન ખાતાઓ: ${loanCount} રેકોર્ડ્સ\n` +
        `• કુલ ગ્રાહકો: ${custCount} પ્રોફાઈલ્સ\n` +
        `• વૉલ્ટ ફાઈલ: ${pendingSecureVaultData.fileName}\n\n` +
        `ચેતવણી: આ પ્રક્રિયાથી સિસ્ટમનો વર્તમાન ડેટાબેઝ આ બેકઅપ મુજબ સંપૂર્ણપણે અપડેટ થઈ જશે.`;

    if (!confirm(confirmMsg)) return;

    try {
        if (Array.isArray(db.loans)) state.loans = db.loans;
        if (Array.isArray(db.customers)) state.customers = db.customers;
        if (Array.isArray(db.valuers)) state.valuers = db.valuers;
        if (Array.isArray(db.products)) state.products = db.products;
        if (Array.isArray(db.branches)) state.branches = db.branches;
        if (Array.isArray(db.rateHistory)) state.rateHistory = db.rateHistory;
        if (db.goldRates) state.goldRates = db.goldRates;
        if (db.rules) {
            state.rules = db.rules;
            if (!Array.isArray(state.rules.customCharges)) state.rules.customCharges = [];
        }
        if (db.settings) state.settings = { ...state.settings, ...db.settings };

        saveState();
        updateBackupStats();

        // Refresh all UI modules
        if (typeof renderLoansTable === "function") renderLoansTable();
        if (typeof renderCustomerMasterList === "function") renderCustomerMasterList();
        if (typeof renderValuers === "function") renderValuers();
        if (typeof renderProductMaster === "function") renderProductMaster();
        if (typeof renderBranchMaster === "function") renderBranchMaster();
        if (typeof renderRulesMaster === "function") renderRulesMaster();
        if (typeof renderBranchSettings === "function") renderBranchSettings();
        if (typeof updateBranchContextUI === "function") updateBranchContextUI();

        // Calculate branch wise loans summary
        const branchBreakdown = {};
        (state.loans || []).forEach(l => {
            const rawBCode = String(l.branchCode || "99").replace(/\D/g, '').padStart(2, "0");
            branchBreakdown[rawBCode] = (branchBreakdown[rawBCode] || 0) + 1;
        });

        const branchLines = Object.keys(branchBreakdown).map(bCode => {
            const bObj = (state.branches || []).find(b => b.code === bCode);
            const bName = bObj ? bObj.name : `શાખા ${bCode}`;
            return `  • શાખા [${bCode}] ${bName}: ${branchBreakdown[bCode]} લોન`;
        }).join("\n");

        const successMsg = `🎉 સિક્યોર વૉલ્ટ ડેટાબેઝ સફળતાપૂર્વક રીસ્ટોર થયો!\n\n` +
            `📊 રીસ્ટોર થયેલ વિગતવાર સમરી:\n` +
            `----------------------------------------\n` +
            `• કુલ લોન ખાતાઓ: ${state.loans.length} રેકોર્ડ્સ\n` +
            (branchLines ? `${branchLines}\n` : '') +
            `• ગ્રાહક સભાસદ પ્રોફાઈલ્સ: ${state.customers.length}\n` +
            `• અધિકૃત વેલ્યુઅર્સ: ${state.valuers.length}\n` +
            `• લોન પ્રોડક્ટ સ્કીમ્સ: ${state.products.length}\n` +
            `• બેંક શાખાઓ: ${state.branches.length}\n` +
            `• ગોલ્ડ રેટ હિસ્ટ્રી: ${state.rateHistory.length} દિવસો\n` +
            `• બેંકિંગ રૂલ્સ & કસ્ટમ ચાર્જીસ: ૧૦૦% કન્ફિગર્ડ\n` +
            `• બ્રાન્ચ એકાઉન્ટ & પેકેટ સીડ્સ: ૧૦૦% અપડેટેડ\n` +
            `----------------------------------------\n` +
            `તમામ રેકોર્ડ્સ અને હાઇ-ડેફિનેશન ફોટોઝ અસલ સ્થિતિમાં પુનઃસ્થાપિત થયા છે.`;

        alert(successMsg);
        showToast("સિક્યોર વૉલ્ટ ડેટાબેઝ ૧૦૦% સચોટતા સાથે રીસ્ટોર થઈ ગયો!");
    } catch (err) {
        console.error("Secure Vault Restore Error:", err);
        alert("સિક્યોર વૉલ્ટ રીસ્ટોર કરતી વખતે ક્ષતિ આવી: " + err.message);
    }
}
// ==================== GOOGLE DRIVE AUTOMATED CLOUD BACKUP & 12:00 AM SCHEDULER ====================
let gdriveTokenClient = null;
let gdriveSchedulerTimer = null;

function initGDriveIntegration() {
    state.gdrive = state.gdrive || {
        enabled: true,
        scheduleTime: "00:00",
        syncOnLogout: true,
        formats: { jccb: true, json: true, xlsx: true },
        clientId: "",
        accessToken: "",
        tokenExpiry: 0,
        connected: false,
        userEmail: "",
        userName: "",
        lastSyncTimestamp: "",
        lastSyncStatus: "",
        lastAutoSyncDate: ""
    };

    const clientIdInput = document.getElementById("gdrive-client-id");
    const autoStatusSelect = document.getElementById("gdrive-auto-status");
    const scheduleTimeInput = document.getElementById("gdrive-schedule-time");
    const fmtJccbCheck = document.getElementById("gdrive-fmt-jccb");
    const fmtJsonCheck = document.getElementById("gdrive-fmt-json");
    const fmtXlsxCheck = document.getElementById("gdrive-fmt-xlsx");
    const syncLogoutCheck = document.getElementById("gdrive-sync-on-logout");
    const btnConnect = document.getElementById("btn-gdrive-connect");
    const btnDisconnect = document.getElementById("btn-gdrive-disconnect");
    const btnSyncNow = document.getElementById("btn-gdrive-sync-now");

    if (clientIdInput) {
        clientIdInput.value = state.gdrive.clientId || "";
        clientIdInput.addEventListener("change", () => {
            state.gdrive.clientId = clientIdInput.value.trim();
            saveState();
        });
    }

    if (autoStatusSelect) {
        autoStatusSelect.value = state.gdrive.enabled !== false ? "enabled" : "disabled";
        autoStatusSelect.addEventListener("change", () => {
            state.gdrive.enabled = (autoStatusSelect.value === "enabled");
            saveState();
            updateGDriveUI();
        });
    }

    if (scheduleTimeInput) {
        scheduleTimeInput.value = state.gdrive.scheduleTime || "00:00";
        scheduleTimeInput.addEventListener("change", () => {
            state.gdrive.scheduleTime = scheduleTimeInput.value || "00:00";
            saveState();
            updateGDriveUI();
        });
    }

    if (fmtJccbCheck) {
        fmtJccbCheck.checked = state.gdrive.formats?.jccb !== false;
        fmtJccbCheck.addEventListener("change", () => {
            state.gdrive.formats = state.gdrive.formats || {};
            state.gdrive.formats.jccb = fmtJccbCheck.checked;
            saveState();
        });
    }

    if (fmtJsonCheck) {
        fmtJsonCheck.checked = state.gdrive.formats?.json !== false;
        fmtJsonCheck.addEventListener("change", () => {
            state.gdrive.formats = state.gdrive.formats || {};
            state.gdrive.formats.json = fmtJsonCheck.checked;
            saveState();
        });
    }

    if (fmtXlsxCheck) {
        fmtXlsxCheck.checked = state.gdrive.formats?.xlsx !== false;
        fmtXlsxCheck.addEventListener("change", () => {
            state.gdrive.formats = state.gdrive.formats || {};
            state.gdrive.formats.xlsx = fmtXlsxCheck.checked;
            saveState();
        });
    }

    if (syncLogoutCheck) {
        syncLogoutCheck.checked = state.gdrive.syncOnLogout !== false;
        syncLogoutCheck.addEventListener("change", () => {
            state.gdrive.syncOnLogout = syncLogoutCheck.checked;
            saveState();
        });
    }

    if (btnConnect) {
        btnConnect.addEventListener("click", connectGoogleDrive);
    }

    if (btnDisconnect) {
        btnDisconnect.addEventListener("click", disconnectGoogleDrive);
    }

    if (btnSyncNow) {
        btnSyncNow.addEventListener("click", () => syncAllBackupsToGoogleDrive(false));
    }

    updateGDriveUI();

    if (!gdriveSchedulerTimer) {
        gdriveSchedulerTimer = setInterval(checkScheduledAutoBackup, 60000);
        setTimeout(checkScheduledAutoBackup, 4000);
    }
}

function updateGDriveUI() {
    const isConnected = !!(state.gdrive?.connected && state.gdrive?.accessToken && (state.gdrive?.tokenExpiry > Date.now()));
    const statusBadge = document.getElementById("gdrive-status-badge");
    const disconnectedBox = document.getElementById("gdrive-disconnected-box");
    const connectedBox = document.getElementById("gdrive-connected-box");
    const userEmailSpan = document.getElementById("gdrive-user-email");
    const lastSyncStatus = document.getElementById("gdrive-last-sync-status");
    const nextSyncHint = document.getElementById("gdrive-next-sync-hint");

    if (statusBadge) {
        if (isConnected) {
            statusBadge.innerHTML = `<span class="badge" style="background:#10b981; color:#ffffff; font-size:12px; padding:5px 12px; font-weight:700;"><i class="fa-solid fa-cloud-check"></i> Google Drive Connected</span>`;
        } else {
            statusBadge.innerHTML = `<span class="badge" style="background:rgba(255,255,255,0.25); color:#ffffff; font-size:12px; padding:5px 12px;"><i class="fa-solid fa-cloud-slash"></i> Not Connected</span>`;
        }
    }

    if (disconnectedBox && connectedBox) {
        if (isConnected) {
            disconnectedBox.classList.add("hidden");
            connectedBox.classList.remove("hidden");
            if (userEmailSpan) {
                userEmailSpan.textContent = state.gdrive?.userEmail || "Connected";
            }
        } else {
            disconnectedBox.classList.remove("hidden");
            connectedBox.classList.add("hidden");
        }
    }

    if (lastSyncStatus) {
        if (state.gdrive?.lastSyncTimestamp) {
            const syncDate = new Date(state.gdrive.lastSyncTimestamp);
            const timeStr = syncDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            const dateStr = syncDate.toLocaleDateString('en-GB');
            lastSyncStatus.innerHTML = `<strong style="color:#16a34a;"><i class="fa-solid fa-circle-check"></i> સફળતાપૂર્વક અપલોડ: ${dateStr} ${timeStr}</strong> (${state.gdrive.lastSyncStatus || 'All formats'})`;
        } else {
            lastSyncStatus.textContent = "હજુ સુધી કોઈ ક્લાઉડ સિંક થયેલ નથી.";
        }
    }

    if (nextSyncHint) {
        const schedTime = state.gdrive?.scheduleTime || "00:00";
        if (state.gdrive?.enabled !== false) {
            nextSyncHint.innerHTML = `<i class="fa-regular fa-clock"></i> આગામી ઓટો-બેકઅપ: <strong>રોજ ${schedTime === "00:00" ? "રાત્રે ૧૨:૦૦ વાગ્યે" : schedTime}</strong>`;
        } else {
            nextSyncHint.innerHTML = `<span style="color:#ef4444;"><i class="fa-solid fa-circle-pause"></i> ઓટો-બેકઅપ હાલ બંધ (Paused) છે</span>`;
        }
    }
}

function connectGoogleDrive() {
    let clientId = (state.gdrive?.clientId || "").trim();
    if (!clientId) {
        const inputId = prompt(
            "Google Drive API કનેક્ટ કરવા માટે કૃપા કરીને તમારો Google Cloud OAuth 2.0 Web Client ID દાખલ કરો:\n\n" +
            "(દા.ત. 1234567890-abc123xyz.apps.googleusercontent.com)\n\n" +
            "નોંધ: જો તમારી પાસે Client ID ન હોય તો Google Cloud Console (console.cloud.google.com) માંથી ૧ મિનિટમાં ફ્રી બનાવી શકાય છે."
        );
        if (!inputId || !inputId.trim()) return;
        clientId = inputId.trim();
        state.gdrive.clientId = clientId;
        const clientIdInput = document.getElementById("gdrive-client-id");
        if (clientIdInput) clientIdInput.value = clientId;
        saveState();
    }

    if (typeof google === "undefined" || !google.accounts || !google.accounts.oauth2) {
        alert("Google Identity Services લાઈબ્રેરી લોડ થઈ રહી છે. કૃપા કરીને થોડી સેકન્ડ પછી ફરી પ્રયાસ કરો.");
        return;
    }

    try {
        gdriveTokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
            callback: async (resp) => {
                if (resp.error) {
                    alert("Google Drive ઓથોરાઈઝેશનમાં ક્ષતિ આવી: " + (resp.error_description || resp.error));
                    return;
                }
                state.gdrive.accessToken = resp.access_token;
                state.gdrive.tokenExpiry = Date.now() + ((resp.expires_in || 3600) * 1000);
                state.gdrive.connected = true;

                await fetchGoogleUserProfile();
                saveState();
                updateGDriveUI();
                showToast("Google Drive સફળતાપૂર્વક કનેક્ટ થઈ ગયું!");

                if (confirm("Google Drive કનેક્ટ થઈ ગયું છે!\n\nશું તમે હમણાં જ પ્રથમ ટેસ્ટ બેકઅપ તમારી Google Drive માં અપલોડ કરવા માંગો છો?")) {
                    syncAllBackupsToGoogleDrive(false);
                }
            }
        });
        gdriveTokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
        console.error("Google Auth Error:", err);
        alert("Google Drive કનેક્શન શરૂ કરતી વખતે ક્ષતિ આવી: " + err.message);
    }
}

async function fetchGoogleUserProfile() {
    if (!state.gdrive?.accessToken) return;
    try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${state.gdrive.accessToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            state.gdrive.userEmail = data.email || "";
            state.gdrive.userName = data.name || "";
        }
    } catch (e) {
        console.warn("Could not fetch user profile:", e);
    }
}

function disconnectGoogleDrive() {
    if (confirm("શું તમે Google Drive કનેક્શન અનલિંક (Disconnect) કરવા માંગો છો?")) {
        state.gdrive.connected = false;
        state.gdrive.accessToken = "";
        state.gdrive.tokenExpiry = 0;
        state.gdrive.userEmail = "";
        saveState();
        updateGDriveUI();
        showToast("Google Drive ડિસ્કનેક્ટ થઈ ગયું.");
    }
}

async function getOrCreateDriveBackupFolder(accessToken) {
    const folderName = "JCCB_GoldLoan_Daily_Backups";
    try {
        const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}'+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)`;
        const searchRes = await fetch(searchUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.files && searchData.files.length > 0) {
                return searchData.files[0].id;
            }
        }

        const createUrl = 'https://www.googleapis.com/drive/v3/files';
        const createRes = await fetch(createUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                description: 'Automated daily backups for JCCB Gold Loan Portal'
            })
        });

        if (createRes.ok) {
            const createData = await createRes.json();
            return createData.id;
        }
    } catch (e) {
        console.warn("Error getting/creating folder:", e);
    }
    return null;
}

async function uploadSingleFileToDrive(fileName, mimeType, fileBlob, folderId, accessToken) {
    const metadata = {
        name: fileName,
        parents: folderId ? [folderId] : []
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink';
    const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form
    });

    if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`Upload failed: ${errText}`);
    }
    return await uploadRes.json();
}

function generateVaultBlobPackage() {
    const dateStr = new Date().toISOString().split("T")[0];
    const rawDatabase = {
        loans: state.loans || [],
        customers: state.customers || [],
        valuers: state.valuers || [],
        products: state.products || [],
        branches: state.branches || [],
        rateHistory: state.rateHistory || [],
        goldRates: state.goldRates || { "24K": 0, "22K": 0 },
        rules: state.rules || DEFAULT_RULES,
        settings: state.settings || { branchSeeds: {} }
    };
    const dbString = JSON.stringify(rawDatabase);
    const checksum = calculateVaultChecksum(dbString);

    const vaultPackage = {
        appSignature: "JCCB_GOLD_LOAN_ENTERPRISE_VAULT",
        bankName: "THE JUNAGADH COMMERCIAL CO-OPERATIVE BANK LTD.",
        vaultVersion: "2.0",
        exportTimestamp: new Date().toISOString(),
        exportDateFormatted: formatDateDMY(new Date()),
        exportedBy: (state.currentSession && state.currentSession.name) ? `${state.currentSession.name} (${state.currentSession.code})` : "Head Office (99)",
        stats: {
            loansCount: (state.loans || []).length,
            customersCount: (state.customers || []).length,
            valuersCount: (state.valuers || []).length,
            productsCount: (state.products || []).length,
            branchesCount: (state.branches || []).length,
            rateHistoryCount: (state.rateHistory || []).length
        },
        checksum: checksum,
        database: rawDatabase
    };

    const finalOutputStr = JSON.stringify(vaultPackage, null, 2);
    const blob = new Blob([finalOutputStr], { type: "application/octet-stream" });
    const fileName = `JCCB_GoldLoan_Vault_${dateStr}.jccb`;
    return { fileName, blob, mimeType: "application/octet-stream" };
}

function generateJSONBlobPackage() {
    const dateStr = new Date().toISOString().split("T")[0];
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const fileName = `JCCB_GoldLoan_FullBackup_${dateStr}.json`;
    return { fileName, blob, mimeType: "application/json" };
}

function generateExcelBlobPackage() {
    if (typeof XLSX === "undefined") return null;
    const wb = XLSX.utils.book_new();
    const photoVaultRows = [];
    const CHUNK_SIZE = 25000;

    const vaultLargeString = (key, str) => {
        if (!str || typeof str !== "string") return "";
        if (str.length <= CHUNK_SIZE) return str;
        const totalChunks = Math.ceil(str.length / CHUNK_SIZE);
        for (let i = 0; i < totalChunks; i++) {
            photoVaultRows.push({
                "VaultKey": key,
                "ChunkIndex": i,
                "TotalChunks": totalChunks,
                "DataChunk": str.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
            });
        }
        return `VAULT_REF:${key}`;
    };

    const loansData = (state.loans || []).map((l, idx) => ({
        "ID": l.id || "",
        "ProposalNo": l.loanNo || "",
        "Date": l.date || "",
        "LoanStatus": l.loanStatus || "New",
        "BranchCode": String(l.branchCode || "99").padStart(2, "0"),
        "BranchName": l.branchName || "",
        "AccountNo": formatLoanAccountNo(l.accountNo, l.branchCode, l.loanType),
        "PacketNo": l.packetNo || "",
        "CustomerNo": l.customerNo || "",
        "IsMember": (l.isMember === true || l.isMember === "Yes") ? "Yes" : "No",
        "MemberNo": l.memberNo || "",
        "BorrowerName": l.borrowerName || "",
        "Mobile": l.mobile || "",
        "Address": l.address || "",
        "SavingsAc": l.savingsAc || "",
        "DOB": l.dob || "",
        "Age": l.age || (l.dob ? calculateAgeFromDOB(l.dob, l.date) : ""),
        "Occupation": l.occupation || "",
        "Religion": l.religion || "",
        "Caste": l.caste || "",
        "NomineeName": l.nomineeName || "",
        "NomineeRelation": l.nomineeRelation || "",
        "ValuerName": l.valuerName || "",
        "LoanType": l.loanType || "GW-3725",
        "InterestRate": l.interestRate || 11.50,
        "SanctionedAmount": l.sanctionedAmount || 0,
        "ValuationAmount": l.valuationAmount || 0,
        "GoldWeight": l.goldWeight || 0,
        "GrossWeight": l.grossWeight || l.goldWeight || 0,
        "Purpose": l.purpose || "",
        "ShareA": l.shareA || 0,
        "ShareB": l.shareB || 0,
        "MemberFee": l.memberFee || 0,
        "ValuerFee": l.valuerFee || 0,
        "StampDuty": l.stampDuty || 0,
        "ServiceCharge": l.serviceCharge || 0,
        "DocCharges": l.docCharges || 0,
        "Insurance": l.insurance || 0,
        "CGST": l.cgst || 0,
        "SGST": l.sgst || 0,
        "OtherCharges": l.otherCharges || 0,
        "CustomChargesJSON": vaultLargeString(`LOAN_${l.id || idx}_custom_charges`, JSON.stringify(l.customCharges || [])),
        "CustomChargesTotal": l.customChargesTotal || 0,
        "TotalDeductions": l.totalDeductions || 0,
        "EmiAmount": l.emiAmount || 0,
        "Installments": l.installments || 36,
        "GrievanceOfficer": l.grievanceOfficer || "Amrutlal Valjibhai Chavda",
        "OrnamentsTableJSON": vaultLargeString(`LOAN_${l.id || idx}_ornaments`, JSON.stringify(l.ornamentsTable || [])),
        "CustomerPhoto": vaultLargeString(`LOAN_${l.id || idx}_cust_photo`, l.customerPhoto || l.photo || ""),
        "OrnamentPhoto": vaultLargeString(`LOAN_${l.id || idx}_orn_photo`, l.ornamentPhoto || l.goldPhoto || ""),
        "UpdatedAt": l.updatedAt || new Date().toISOString()
    }));
    const wsLoans = loansData.length > 0 ? XLSX.utils.json_to_sheet(loansData) : XLSX.utils.aoa_to_sheet([["ID"]]);
    XLSX.utils.book_append_sheet(wb, wsLoans, "1_Loans_Register");

    const customersData = (state.customers || []).map((c, idx) => ({
        "id": c.id || ("CUST-" + (idx + 1)),
        "customerNo": c.customerNo || "",
        "name": c.name || "",
        "isMember": c.isMember ? "Yes" : "No",
        "memberNo": c.memberNo || "",
        "address": c.address || "",
        "savingsAc": c.savingsAc || "",
        "dob": c.dob || "",
        "age": c.age || "",
        "occupation": c.occupation || "",
        "religion": c.religion || "",
        "caste": c.caste || "",
        "mobile": c.mobile || "",
        "nomineeName": c.nomineeName || "",
        "nomineeRelation": c.nomineeRelation || "",
        "photo": vaultLargeString(`CUST_${c.id || idx}_photo`, c.photo || "")
    }));
    const wsCust = customersData.length > 0 ? XLSX.utils.json_to_sheet(customersData) : XLSX.utils.aoa_to_sheet([["id"]]);
    XLSX.utils.book_append_sheet(wb, wsCust, "2_Customer_Master");

    const valuersData = (state.valuers || []).map(v => ({
        "id": v.id || "",
        "name": v.name || "",
        "firm": v.firm || "",
        "mobile": v.mobile || "",
        "address": v.address || "",
        "branch": v.branch || "",
        "status": v.status || "Active"
    }));
    const wsVal = valuersData.length > 0 ? XLSX.utils.json_to_sheet(valuersData) : XLSX.utils.aoa_to_sheet([["id"]]);
    XLSX.utils.book_append_sheet(wb, wsVal, "3_Valuer_Master");

    const productsData = (state.products || []).map(p => ({
        "code": p.code || "",
        "name": p.name || "",
        "interestRate": p.interestRate || 0,
        "maxAmount": p.maxAmount || 0,
        "maxLTV": p.maxLTV || 0,
        "tenureMonths": p.tenureMonths || 12,
        "status": p.status || "Active"
    }));
    const wsProd = productsData.length > 0 ? XLSX.utils.json_to_sheet(productsData) : XLSX.utils.aoa_to_sheet([["code"]]);
    XLSX.utils.book_append_sheet(wb, wsProd, "4_Product_Master");

    const branchesData = (state.branches || []).map(b => ({
        "code": String(b.code || "").padStart(2, "0"),
        "name": b.name || "",
        "prefix": b.prefix || "",
        "manager": b.manager || "",
        "phone": b.phone || "",
        "address": b.address || "",
        "password": b.password || "1234"
    }));
    const wsBranch = branchesData.length > 0 ? XLSX.utils.json_to_sheet(branchesData) : XLSX.utils.aoa_to_sheet([["code"]]);
    XLSX.utils.book_append_sheet(wb, wsBranch, "5_Branch_Master");

    const ratesData = (state.rateHistory || []).map(r => ({
        "date": r.date || "",
        "rate24K": r.rate24K || 0,
        "rate22K": r.rate22K || 0,
        "updatedBy": r.updatedBy || ""
    }));
    const wsRates = ratesData.length > 0 ? XLSX.utils.json_to_sheet(ratesData) : XLSX.utils.aoa_to_sheet([["date"]]);
    XLSX.utils.book_append_sheet(wb, wsRates, "6_Gold_Rates_History");

    const rulesExportData = [{
        "RulesConfigJSON": vaultLargeString("SYSTEM_RULES_CONFIG", JSON.stringify(state.rules || DEFAULT_RULES)),
        "LastUpdated": new Date().toISOString()
    }];
    const wsRules = XLSX.utils.json_to_sheet(rulesExportData);
    XLSX.utils.book_append_sheet(wb, wsRules, "7_Rules_Master");

    const settingsExportData = [{
        "SettingsJSON": vaultLargeString("SYSTEM_SETTINGS_CONFIG", JSON.stringify(state.settings || { branchSeeds: {} })),
        "LastUpdated": new Date().toISOString()
    }];
    const wsSettings = XLSX.utils.json_to_sheet(settingsExportData);
    XLSX.utils.book_append_sheet(wb, wsSettings, "8_System_Settings");

    const wsVault = (photoVaultRows.length > 0)
        ? XLSX.utils.json_to_sheet(photoVaultRows)
        : XLSX.utils.aoa_to_sheet([["VaultKey", "ChunkIndex", "TotalChunks", "DataChunk"]]);
    XLSX.utils.book_append_sheet(wb, wsVault, "9_Photo_Vault");

    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `JCCB_GoldLoan_Universal_Database_${dateStr}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    return { fileName, blob, mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
}

async function syncAllBackupsToGoogleDrive(isAutomated = false) {
    if (!state.gdrive?.connected || !state.gdrive?.accessToken) {
        if (!isAutomated) {
            connectGoogleDrive();
        }
        return;
    }

    if (Date.now() > (state.gdrive.tokenExpiry || 0)) {
        if (!isAutomated) {
            alert("Google Drive કનેક્શન ટોકન એક્સપાયર થયેલ છે. કૃપા કરીને ફરી કનેક્ટ કરો.");
            connectGoogleDrive();
        }
        return;
    }

    try {
        if (!isAutomated) showToast("Google Drive માં બેકઅપ અપલોડ થઈ રહ્યો છે...");
        
        const folderId = await getOrCreateDriveBackupFolder(state.gdrive.accessToken);
        const uploadedFiles = [];

        // 1. .jccb Secure Vault
        if (state.gdrive.formats?.jccb !== false) {
            const vaultPkg = generateVaultBlobPackage();
            if (vaultPkg) {
                await uploadSingleFileToDrive(vaultPkg.fileName, vaultPkg.mimeType, vaultPkg.blob, folderId, state.gdrive.accessToken);
                uploadedFiles.push(vaultPkg.fileName);
            }
        }

        // 2. .json Data
        if (state.gdrive.formats?.json !== false) {
            const jsonPkg = generateJSONBlobPackage();
            if (jsonPkg) {
                await uploadSingleFileToDrive(jsonPkg.fileName, jsonPkg.mimeType, jsonPkg.blob, folderId, state.gdrive.accessToken);
                uploadedFiles.push(jsonPkg.fileName);
            }
        }

        // 3. .xlsx Excel
        if (state.gdrive.formats?.xlsx !== false) {
            const xlsxPkg = generateExcelBlobPackage();
            if (xlsxPkg) {
                await uploadSingleFileToDrive(xlsxPkg.fileName, xlsxPkg.mimeType, xlsxPkg.blob, folderId, state.gdrive.accessToken);
                uploadedFiles.push(xlsxPkg.fileName);
            }
        }

        state.gdrive.lastSyncTimestamp = new Date().toISOString();
        state.gdrive.lastSyncStatus = uploadedFiles.join(", ");
        saveState();
        updateGDriveUI();

        const successMsg = `🎉 Google Drive માં બેકઅપ સફળતાપૂર્વક અપલોડ થયો!\n\n` +
            `📁 ફોલ્ડર: JCCB_GoldLoan_Daily_Backups\n` +
            `📄 અપલોડ થયેલ ફાઈલો:\n` +
            uploadedFiles.map(f => `  • ${f}`).join("\n");

        if (!isAutomated) {
            alert(successMsg);
            showToast("Google Drive ક્લાઉડ સિંક સફળ!");
        } else {
            console.log("Automated Google Drive Sync completed:", uploadedFiles);
        }
    } catch (err) {
        console.error("Google Drive Sync Error:", err);
        if (!isAutomated) {
            alert("Google Drive માં બેકઅપ અપલોડ કરતી વખતે ક્ષતિ આવી: " + err.message);
        }
    }
}

function checkScheduledAutoBackup() {
    if (!state.gdrive || state.gdrive.enabled === false || !state.gdrive.connected) {
        return;
    }

    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, "0");
    const currentMinutes = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${currentHours}:${currentMinutes}`;
    const todayDateStr = now.toISOString().split("T")[0];

    const targetTime = state.gdrive.scheduleTime || "00:00";

    if (currentTime === targetTime && state.gdrive.lastAutoSyncDate !== todayDateStr) {
        console.log(`Executing scheduled auto backup to Google Drive at ${currentTime}...`);
        state.gdrive.lastAutoSyncDate = todayDateStr;
        saveState();
        syncAllBackupsToGoogleDrive(true);
    }
}

function importCompleteRestoreExcel(file) {
    if (typeof XLSX === "undefined") {
        alert("SheetJS library not loaded.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, { type: "array" });
            const sheetNames = wb.SheetNames;

            let restoredSummary = {
                loans: 0,
                branchBreakdown: {},
                customers: 0,
                valuers: 0,
                products: 0,
                branches: 0,
                rates: 0,
                rules: false,
                settings: false,
                photosCount: 0
            };

            // Helper to find sheet by name matching
            const findSheet = (pattern) => {
                const foundName = sheetNames.find(name => name.toLowerCase().includes(pattern.toLowerCase()));
                return foundName ? wb.Sheets[foundName] : null;
            };

            // 0. Pre-build Photo & Large String Vault Map
            const vaultSheet = findSheet("vault") || findSheet("photo");
            const vaultMap = {};
            if (vaultSheet) {
                const vaultRows = XLSX.utils.sheet_to_json(vaultSheet);
                const grouped = {};
                vaultRows.forEach(r => {
                    const key = r["VaultKey"] || r["Key"] || r["vaultKey"];
                    const idx = parseInt(r["ChunkIndex"] || 0);
                    const chunk = String(r["DataChunk"] || r["Chunk"] || "");
                    if (key) {
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key][idx] = chunk;
                    }
                });
                Object.keys(grouped).forEach(k => {
                    vaultMap[k] = grouped[k].join("");
                });
            }

            const resolveVaultString = (refStr) => {
                if (!refStr) return "";
                const str = String(refStr).trim();
                if (str.startsWith("VAULT_REF:")) {
                    const key = str.substring("VAULT_REF:".length).trim();
                    const resolved = vaultMap[key] || "";
                    if (resolved) restoredSummary.photosCount++;
                    return resolved;
                }
                if (str.startsWith("data:image/")) {
                    restoredSummary.photosCount++;
                }
                return str;
            };

            // 1. Loans Sheet (All Branches)
            const loansSheet = findSheet("loan");
            if (loansSheet) {
                const rawLoans = XLSX.utils.sheet_to_json(loansSheet);
                state.loans = rawLoans.map(r => {
                    const rawBCode = String(r["BranchCode"] || r["branchCode"] || "99").replace(/\D/g, '');
                    const bCode = rawBCode ? rawBCode.padStart(2, "0") : "99";
                    const bName = String(r["BranchName"] || r["branchName"] || "");

                    // Track branch-wise count
                    restoredSummary.branchBreakdown[bCode] = (restoredSummary.branchBreakdown[bCode] || 0) + 1;

                    // Parse ornaments table
                    let ornTable = [];
                    const rawOrn = r["OrnamentsTableJSON"] || r["ornamentsTableJSON"] || r["ornamentsTable"];
                    if (rawOrn) {
                        try {
                            const parsed = JSON.parse(resolveVaultString(rawOrn));
                            ornTable = Array.isArray(parsed) ? parsed : [];
                        } catch (e) {
                            console.warn("Ornaments table parse warning:", e);
                        }
                    }

                    // Parse custom charges
                    let customCharges = [];
                    const rawCustom = r["CustomChargesJSON"] || r["customChargesJSON"] || r["customCharges"];
                    if (rawCustom) {
                        try {
                            const parsed = JSON.parse(resolveVaultString(rawCustom));
                            customCharges = Array.isArray(parsed) ? parsed : [];
                        } catch (e) {
                            console.warn("Custom charges parse warning:", e);
                        }
                    }

                    const custPhoto = resolveVaultString(r["CustomerPhoto"] || r["CustomerPhotoBase64"] || r["photo"] || r["Photo"] || "");
                    const ornPhoto = resolveVaultString(r["OrnamentPhoto"] || r["OrnamentPhotoBase64"] || r["goldPhoto"] || r["GoldPhoto"] || "");

                    return {
                        id: String(r["ID"] || r["id"] || ("GL-" + Date.now() + Math.floor(Math.random()*1000))),
                        loanNo: String(r["ProposalNo"] || r["loanNo"] || r["LoanNo"] || ("GL-P-" + (r["AccountNo"] || "0001"))),
                        date: String(r["Date"] || r["date"] || new Date().toISOString().split("T")[0]),
                        loanStatus: String(r["LoanStatus"] || r["loanStatus"] || r["Status"] || r["status"] || "New"),
                        branchCode: bCode,
                        branchName: bName,
                        accountNo: formatLoanAccountNo(r["AccountNo"] || r["accountNo"] || "", bCode, r["LoanType"] || r["loanType"]),
                        packetNo: String(r["PacketNo"] || r["packetNo"] || ""),
                        customerNo: String(r["CustomerNo"] || r["customerNo"] || ""),
                        isMember: (r["IsMember"] === "Yes" || r["IsMember"] === true || r["isMember"] === "Yes" || r["isMember"] === true || !!r["MemberNo"] || !!r["memberNo"]),
                        memberNo: String(r["MemberNo"] || r["memberNo"] || ""),
                        borrowerName: String(r["BorrowerName"] || r["borrowerName"] || r["Name"] || ""),
                        mobile: String(r["Mobile"] || r["mobile"] || ""),
                        address: String(r["Address"] || r["address"] || ""),
                        savingsAc: String(r["SavingsAc"] || r["savingsAc"] || ""),
                        dob: String(r["DOB"] || r["dob"] || r["BirthDate"] || r["birthDate"] || r["જન્મતારીખ"] || "").trim(),
                        age: String(r["Age"] || r["age"] || (r["DOB"] || r["dob"] ? calculateAgeFromDOB(r["DOB"] || r["dob"], r["Date"] || r["date"]) : "")),
                        occupation: String(r["Occupation"] || r["occupation"] || ""),
                        religion: String(r["Religion"] || r["religion"] || ""),
                        caste: String(r["Caste"] || r["caste"] || ""),
                        nomineeName: String(r["NomineeName"] || r["nomineeName"] || ""),
                        nomineeRelation: String(r["NomineeRelation"] || r["nomineeRelation"] || ""),
                        valuerName: String(r["ValuerName"] || r["valuerName"] || ""),
                        loanType: String(r["LoanType"] || r["loanType"] || "GW-3725"),
                        interestRate: parseFloat(r["InterestRate"] || r["interestRate"] || 11.50),
                        sanctionedAmount: parseFloat(r["SanctionedAmount"] || r["sanctionedAmount"] || 0),
                        valuationAmount: parseFloat(r["ValuationAmount"] || r["valuationAmount"] || 0),
                        goldWeight: parseFloat(r["GoldWeight"] || r["goldWeight"] || 0),
                        grossWeight: parseFloat(r["GrossWeight"] || r["grossWeight"] || r["GoldWeight"] || r["goldWeight"] || 0),
                        purpose: String(r["Purpose"] || r["purpose"] || ""),
                        shareA: parseFloat(r["ShareA"] || r["shareA"] || 0),
                        shareB: parseFloat(r["ShareB"] || r["shareB"] || 0),
                        memberFee: parseFloat(r["MemberFee"] || r["memberFee"] || 0),
                        valuerFee: parseFloat(r["ValuerFee"] || r["valuerFee"] || 0),
                        stampDuty: parseFloat(r["StampDuty"] || r["stampDuty"] || 0),
                        serviceCharge: parseFloat(r["ServiceCharge"] || r["serviceCharge"] || 0),
                        docCharges: parseFloat(r["DocCharges"] || r["docCharges"] || 0),
                        insurance: parseFloat(r["Insurance"] || r["insurance"] || 0),
                        cgst: parseFloat(r["CGST"] || r["cgst"] || 0),
                        sgst: parseFloat(r["SGST"] || r["sgst"] || 0),
                        otherCharges: parseFloat(r["OtherCharges"] || r["otherCharges"] || 0),
                        customCharges: customCharges,
                        customChargesTotal: parseFloat(r["CustomChargesTotal"] || r["customChargesTotal"] || 0),
                        totalDeductions: parseFloat(r["TotalDeductions"] || r["totalDeductions"] || 0),
                        emiAmount: parseFloat(r["EmiAmount"] || r["emiAmount"] || 0),
                        installments: parseInt(r["Installments"] || r["installments"] || 36),
                        grievanceOfficer: String(r["GrievanceOfficer"] || r["grievanceOfficer"] || "Amrutlal Valjibhai Chavda"),
                        ornamentsTable: ornTable,
                        customerPhoto: custPhoto,
                        ornamentPhoto: ornPhoto,
                        updatedAt: String(r["UpdatedAt"] || r["updatedAt"] || new Date().toISOString())
                    };
                });
                restoredSummary.loans = state.loans.length;
            }

            // 2. Customers Sheet
            const custSheet = findSheet("cust");
            if (custSheet) {
                const rawCustomers = XLSX.utils.sheet_to_json(custSheet);
                state.customers = rawCustomers.map((c, idx) => ({
                    id: String(c["id"] || c["ID"] || ("CUST-" + (idx + 1))),
                    customerNo: String(c["customerNo"] || c["CustomerNo"] || ""),
                    name: String(c["name"] || c["Name"] || ""),
                    isMember: (c["isMember"] === "Yes" || c["isMember"] === true || c["IsMember"] === "Yes" || c["IsMember"] === true),
                    memberNo: String(c["memberNo"] || c["MemberNo"] || ""),
                    address: String(c["address"] || c["Address"] || ""),
                    savingsAc: String(c["savingsAc"] || c["SavingsAc"] || ""),
                    dob: String(c["dob"] || c["DOB"] || c["BirthDate"] || c["birthDate"] || c["જન્મતારીખ"] || "").trim(),
                    age: String(c["age"] || c["Age"] || ""),
                    occupation: String(c["occupation"] || c["Occupation"] || ""),
                    religion: String(c["religion"] || c["Religion"] || ""),
                    caste: String(c["caste"] || c["Caste"] || ""),
                    mobile: String(c["mobile"] || c["Mobile"] || ""),
                    nomineeName: String(c["nomineeName"] || c["NomineeName"] || ""),
                    nomineeRelation: String(c["nomineeRelation"] || c["NomineeRelation"] || ""),
                    photo: resolveVaultString(c["photo"] || c["Photo"] || c["customerPhoto"] || c["CustomerPhoto"] || "")
                }));
                restoredSummary.customers = state.customers.length;
            }

            // 3. Valuers Sheet
            const valuerSheet = findSheet("valuer");
            if (valuerSheet) {
                const rawValuers = XLSX.utils.sheet_to_json(valuerSheet);
                state.valuers = rawValuers.map(v => ({
                    id: String(v["id"] || v["ID"] || ""),
                    name: String(v["name"] || v["Name"] || ""),
                    phone: String(v["phone"] || v["Phone"] || v["mobile"] || ""),
                    address: String(v["address"] || v["Address"] || ""),
                    savingsAc: String(v["savingsAc"] || v["SavingsAc"] || ""),
                    branch: String(v["branch"] || v["Branch"] || "All Branches"),
                    active: (v["active"] === true || v["active"] === "true" || v["Active"] === "Yes" || v["Active"] === true || v["active"] === undefined)
                }));
                restoredSummary.valuers = state.valuers.length;
            }

            // 4. Products Sheet
            const prodSheet = findSheet("product");
            if (prodSheet) {
                const rawProducts = XLSX.utils.sheet_to_json(prodSheet);
                state.products = rawProducts.map(p => ({
                    id: String(p["id"] || p["ID"] || ""),
                    name: String(p["name"] || p["Name"] || ""),
                    type: String(p["type"] || p["Type"] || "Bullet")
                }));
                restoredSummary.products = state.products.length;
            }

            // 5. Branches Sheet
            const branchSheet = findSheet("branch");
            if (branchSheet) {
                const rawBranches = XLSX.utils.sheet_to_json(branchSheet);
                state.branches = rawBranches.map(b => {
                    const numOnly = String(b["code"] || b["Code"] || "01").replace(/\D/g, '');
                    const code2 = numOnly ? numOnly.padStart(2, "0") : "01";
                    return {
                        code: code2,
                        name: String(b["name"] || b["Name"] || "").trim(),
                        password: String(b["password"] || b["Password"] || (code2 === "99" ? "Rahul#80810" : "Admin@123")),
                        isHO: (b["isHO"] === "Yes" || b["isHO"] === true || b["IsHO"] === "Yes" || code2 === "99")
                    };
                });
                restoredSummary.branches = state.branches.length;
            }

            // 6. Rates Sheet
            const ratesSheet = findSheet("rate");
            if (ratesSheet) {
                const rawRates = XLSX.utils.sheet_to_json(ratesSheet);
                state.rateHistory = rawRates.map(r => ({
                    date: String(r["date"] || r["Date"] || ""),
                    rate24K: parseFloat(r["rate24K"] || r["Rate24K"] || r["rate"] || 0),
                    rate22K: parseFloat(r["rate22K"] || r["Rate22K"] || 0)
                })).filter(r => r.date);
                restoredSummary.rates = state.rateHistory.length;
            }

            // 7. Rules Master Sheet
            const rulesSheet = findSheet("rule");
            if (rulesSheet) {
                const rawRules = XLSX.utils.sheet_to_json(rulesSheet);
                if (rawRules.length > 0) {
                    const row = rawRules[0];
                    const rawRulesStr = row["RulesConfigJSON"] || row["rulesConfigJSON"] || row["RulesJSON"];
                    if (rawRulesStr) {
                        const rulesJsonStr = resolveVaultString(rawRulesStr);
                        try {
                            state.rules = JSON.parse(rulesJsonStr);
                            if (!Array.isArray(state.rules.customCharges)) {
                                state.rules.customCharges = [];
                            }
                            restoredSummary.rules = true;
                        } catch (err) {
                            console.warn("Rules JSON parse error:", err);
                        }
                    }
                }
            }

            // 8. Settings Sheet & Branch Seeds
            const settingsSheet = findSheet("setting");
            if (settingsSheet) {
                const rawSettings = XLSX.utils.sheet_to_json(settingsSheet);
                if (rawSettings.length > 0) {
                    const row = rawSettings[0];
                    const rawSettingsStr = row["SettingsJSON"] || row["settingsJSON"] || row["SettingsConfigJSON"];
                    if (rawSettingsStr) {
                        const settingsStr = resolveVaultString(rawSettingsStr);
                        try {
                            const parsed = JSON.parse(settingsStr);
                            state.settings = { ...state.settings, ...parsed };
                            restoredSummary.settings = true;
                        } catch (err) {
                            console.warn("Settings JSON parse warning:", err);
                        }
                    } else {
                        state.settings = { ...state.settings, ...row };
                        restoredSummary.settings = true;
                    }
                }
            }

            saveState();
            updateBackupStats();

            // Format branch breakdown text
            const branchLines = Object.keys(restoredSummary.branchBreakdown).map(bCode => {
                const bObj = (state.branches || []).find(b => b.code === bCode);
                const bName = bObj ? bObj.name : `શાખા ${bCode}`;
                return `  • શાખા [${bCode}] ${bName}: ${restoredSummary.branchBreakdown[bCode]} લોન`;
            }).join("\n");

            alert(`✅ યુનિવર્સલ એક્સેલ ડેટાબેઝ સફળતાપૂર્વક રિસ્ટોર થયેલ છે!\n\n` +
                  `📊 શાખા વાઇઝ સંપૂર્ણ ડેટા સારાંશ:\n` +
                  `• કુલ લોન રેકોર્ડ્સ: ${restoredSummary.loans}\n` +
                  (branchLines ? `${branchLines}\n` : "") +
                  `• સભાસદ/ગ્રાહક પ્રોફાઈલ્સ: ${restoredSummary.customers}\n` +
                  `• અધિકૃત સોની વેલ્યુઅર્સ: ${restoredSummary.valuers}\n` +
                  `• પ્રોડક્ટ સ્કીમ્સ: ${restoredSummary.products}\n` +
                  `• બેંક શાખાઓ: ${restoredSummary.branches}\n` +
                  `• દૈનિક સોનાના ભાવ હિસ્ટ્રી: ${restoredSummary.rates} દિવસો\n` +
                  `• રૂલ્સ માસ્ટર & કસ્ટમ ચાર્જીસ: ${restoredSummary.rules ? "હા (સંપૂર્ણ સેટ)" : "સાચવેલ"}\n` +
                  `• એકાઉન્ટ સેટિંગ્સ & શાખા સીડ્સ: ${restoredSummary.settings ? "હા (તમામ શાખાઓ)" : "સાચવેલ"}\n` +
                  `• ગ્રાહક અને દાગીનાના ફોટા: ${restoredSummary.photosCount} પુનઃસ્થાપિત\n\n` +
                  `પોર્ટલ તમામ નવા ડેટા સાથે તાત્કાલિક રીલોડ થઈ રહ્યું છે...`);
            
            window.location.reload();
        } catch (err) {
            console.error("Restore error:", err);
            alert("એક્સેલ ફાઈલ રીસ્ટોર કરતી વખતે ક્ષતિ આવી: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// ==================== IMAGE COMPRESSOR & PHOTO UPLOAD ====================
function compressImageFile(file, maxDim = 800, quality = 0.85) {
    return new Promise((resolve) => {
        if (!file) {
            resolve("");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const rawData = e.target.result;
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;

                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL("image/jpeg", quality);
                    resolve(dataUrl);
                } catch (err) {
                    console.warn("Canvas compression fallback:", err);
                    resolve(rawData);
                }
            };
            img.onerror = () => {
                resolve(rawData);
            };
            img.src = rawData;
        };
        reader.onerror = (err) => {
            console.error("FileReader error:", err);
            resolve("");
        };
        reader.readAsDataURL(file);
    });
}

function initImageCropper() {
    const custInput = document.getElementById("cust-photo-upload");
    const goldInput = document.getElementById("gold-photo-upload");
    const custPreview = document.getElementById("cust-photo-preview");
    const goldPreview = document.getElementById("gold-photo-preview");
    const modal = document.getElementById("cropper-modal");
    const cropBtn = document.getElementById("crop-btn") || document.getElementById("btn-apply-crop");
    const cancelBtn = document.getElementById("cropper-cancel-btn");
    const closeBtn = document.getElementById("cropper-close-btn");

    async function processImageFile(file, target) {
        if (!file) return;
        currentPhotoTarget = target;
        const maxDim = target === "customer" ? 600 : 900;
        const optimizedBase64 = await compressImageFile(file, maxDim, 0.85);

        if (!optimizedBase64) return;

        // Instantly render preview so image is immediately active and clearly visible
        if (target === "customer" && custPreview) {
            custPreview.innerHTML = `
                <div class="uploaded-photo-wrap">
                    <img src="${optimizedBase64}" alt="Customer Photo">
                    <div class="uploaded-photo-badge"><i class="fa-solid fa-circle-check"></i> ફોટો અપલોડ થયેલ છે</div>
                </div>`;
            showToast("ગ્રાહકનો ફોટો સફળતાપૂર્વક અપલોડ થયો!");

            // Auto-sync photo to Customer Master if customer number / name is present on form
            const currentCustNo = document.getElementById("cust-no") ? document.getElementById("cust-no").value.trim() : "";
            const currentCustName = document.getElementById("cust-name") ? document.getElementById("cust-name").value.trim() : "";
            if (currentCustNo || currentCustName) {
                if (!state.customers) state.customers = [];
                let cIdx = -1;
                if (currentCustNo) {
                    cIdx = state.customers.findIndex(c => c.customerNo === currentCustNo);
                }
                if (cIdx === -1 && currentCustName) {
                    cIdx = state.customers.findIndex(c => c.name && c.name.toLowerCase() === currentCustName.toLowerCase());
                }
                if (cIdx !== -1) {
                    state.customers[cIdx].photo = optimizedBase64;
                    state.customers[cIdx].customerPhoto = optimizedBase64;
                    state.customers[cIdx].updatedAt = new Date().toISOString();
                    saveState();
                    renderCustomerMasterList();
                }
            }
        } else if (target === "ornament" && goldPreview) {
            goldPreview.innerHTML = `
                <div class="uploaded-photo-wrap">
                    <img src="${optimizedBase64}" alt="Gold Photo">
                    <div class="uploaded-photo-badge"><i class="fa-solid fa-circle-check"></i> ફોટો અપલોડ થયેલ છે</div>
                </div>`;
            showToast("દાગીનાનો ફોટો સફળતાપૂર્વક અપલોડ થયો!");
        }
    }

    if (custInput) {
        custInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                processImageFile(e.target.files[0], "customer");
            }
        });
    }
    if (goldInput) {
        goldInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                processImageFile(e.target.files[0], "ornament");
            }
        });
    }

    if (cropBtn) {
        cropBtn.addEventListener("click", () => {
            if (cropperInstance) {
                try {
                    const canvas = cropperInstance.getCroppedCanvas({
                        width: currentPhotoTarget === "customer" ? 400 : 700,
                        height: currentPhotoTarget === "customer" ? 400 : 525
                    });
                    if (canvas) {
                        const croppedBase64 = canvas.toDataURL("image/jpeg", 0.85);
                        if (currentPhotoTarget === "customer" && custPreview) {
                            custPreview.innerHTML = `<img src="${croppedBase64}" style="width:100%; height:100%; max-height:96px; border-radius:6px; object-fit:contain;" alt="Customer Photo">`;
                        } else if (currentPhotoTarget === "ornament" && goldPreview) {
                            goldPreview.innerHTML = `<img src="${croppedBase64}" style="width:100%; height:100%; max-height:96px; border-radius:6px; object-fit:contain;" alt="Ornament Photo">`;
                        }
                    }
                } catch (e) {
                    console.error("Cropping error:", e);
                }
                try { cropperInstance.destroy(); } catch (err) {}
                cropperInstance = null;
            }
            if (modal) modal.classList.add("hidden");
            showToast("ફોટો સફળતાપૂર્વક અપલોડ થયો!");
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            if (modal) modal.classList.add("hidden");
            if (cropperInstance) {
                try { cropperInstance.destroy(); } catch (err) {}
                cropperInstance = null;
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            if (modal) modal.classList.add("hidden");
            if (cropperInstance) {
                try { cropperInstance.destroy(); } catch (err) {}
                cropperInstance = null;
            }
        });
    }
}

// ==================== REMINDERS ====================
function initReminders() {
    const reminderNav = document.getElementById("pending-reminder-nav");
    const modal = document.getElementById("reminder-modal");
    const closeBtn = document.getElementById("close-reminder-modal-btn");
    const closeBtn2 = document.getElementById("btn-reminder-close");

    if (reminderNav) {
        reminderNav.addEventListener("click", () => {
            const pendingLoans = state.loans.filter(l => !l.customerNo);
            const tbody = document.getElementById("reminder-list-tbody");
            if (tbody) {
                tbody.innerHTML = "";
                if (pendingLoans.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px;">No pending customer numbers.</td></tr>';
                } else {
                    pendingLoans.forEach(l => {
                        const tr = document.createElement("tr");
                        const accFmt = formatLoanAccountNo(l.accountNo, l.branchCode, l.loanType);
                        tr.innerHTML = `
                            <td style="padding:6px 12px;">${formatDateDMY(l.date)}</td>
                            <td style="padding:6px 12px;"><strong>${accFmt}</strong></td>
                            <td style="padding:6px 12px;">${l.borrowerName}</td>
                            <td style="padding:6px 12px; text-align:center;">
                                <button class="btn-sm btn-primary edit-reminder-loan" data-id="${l.id}">Update</button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });

                    tbody.querySelectorAll(".edit-reminder-loan").forEach(b => {
                        b.addEventListener("click", () => {
                            if (modal) modal.classList.add("hidden");
                            editLoanRecord(b.getAttribute("data-id"));
                        });
                    });
                }
            }
            if (modal) modal.classList.remove("hidden");
        });
    }

    if (closeBtn) closeBtn.addEventListener("click", () => modal && modal.classList.add("hidden"));
    if (closeBtn2) closeBtn2.addEventListener("click", () => modal && modal.classList.add("hidden"));
}

// ==================== DOCUMENT PRINT GENERATION ====================
function getCleanBranchName(name) {
    if (!name) return "";
    let clean = String(name).replace(/^\d+\s*[-:]*\s*/, '').trim();
    clean = clean.replace(/(\s+(BRANCH|શાખા))+$/gi, '').trim();
    return clean;
}

function compressBase64Image(base64Str, maxDim = 800, quality = 0.85) {
    return new Promise((resolve) => {
        if (!base64Str || typeof base64Str !== "string" || !base64Str.startsWith("data:image")) {
            resolve(base64Str || "");
            return;
        }
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL("image/jpeg", quality);
                resolve(dataUrl);
            } catch (err) {
                console.warn("Base64 compression fallback:", err);
                resolve(base64Str);
            }
        };
        img.onerror = () => {
            resolve(base64Str);
        };
        img.src = base64Str;
    });
}

function getLoanGrossAndNetWeight(loan) {
    if (!loan) return { grossWeight: 0, netWeight: 0 };
    let gross = 0;
    let net = 0;
    if (Array.isArray(loan.ornamentsTable) && loan.ornamentsTable.length > 0) {
        loan.ornamentsTable.forEach(row => {
            const gGm = parseFloat(row.grossGm || 0);
            const gMg = parseFloat(row.grossMg || 0);
            const nGm = parseFloat(row.netGm || 0);
            const nMg = parseFloat(row.netMg || 0);
            gross += gGm + (gMg / 1000);
            net += nGm + (nMg / 1000);
        });
    } else {
        net = parseFloat(loan.goldWeight || 0);
        gross = parseFloat(loan.grossWeight || loan.goldWeight || 0);
    }
    return {
        grossWeight: gross > 0 ? gross : net,
        netWeight: net
    };
}

async function print4PageDocument(loan) {
    try {
        if (!loan) {
            alert("પ્રિન્ટ કરવા માટે લોન રેકોર્ડ મળ્યો નથી.");
            return;
        }

        const sanctionedAmt = parseFloat(loan.sanctionedAmount || 0);
        const valuationAmt = parseFloat(loan.valuationAmount || 0);
        const ltv = valuationAmt > 0 ? (sanctionedAmt / valuationAmt) * 100 : 75;

        const hasShareGroupA = parseFloat(loan.shareA || 0) > 0;
        const hasShareGroupB = parseFloat(loan.shareB || 0) > 0;

        // Fast pre-optimization of photos if uncompressed (>80KB)
        let custPhoto = loan.customerPhoto || loan.photo || "";
        let ornPhoto = loan.ornamentPhoto || loan.goldPhoto || "";
        
        if (custPhoto && custPhoto.length > 80000) {
            custPhoto = await compressBase64Image(custPhoto, 500, 0.85);
            loan.customerPhoto = custPhoto;
            loan.photo = custPhoto;
        }
        if (ornPhoto && ornPhoto.length > 80000) {
            ornPhoto = await compressBase64Image(ornPhoto, 800, 0.85);
            loan.ornamentPhoto = ornPhoto;
            loan.goldPhoto = ornPhoto;
        }

        const loanForPrint = {
            ...loan,
            customerPhoto: custPhoto,
            photo: custPhoto,
            ornamentPhoto: ornPhoto,
            goldPhoto: ornPhoto
        };

        let html = "";
        html += generatePage1KarajManganiHTML(loanForPrint, false);
        html += generatePage2ValuationReportHTML(loanForPrint, ltv, true);
        html += generatePage3ReceiptsHTML(loanForPrint, true);
        html += generatePage4KFSHTML(loanForPrint, ltv, true);
        if (hasShareGroupA) {
            html += generatePage5MembershipGroupAHTML(loanForPrint, true);
        } else if (hasShareGroupB) {
            html += generatePage5MembershipGroupBHTML(loanForPrint, true);
        }
        await printContent(html);
    } catch (err) {
        console.error("Print 4-Page Document Error:", err);
        alert("લોન ડોક્યુમેન્ટ્સ પ્રિન્ટ કરતી વખતે ક્ષતિ આવી: " + err.message);
    }
}

async function print3in1Voucher(loan) {
    try {
        if (!loan) return;
        let custPhoto = loan.customerPhoto || loan.photo || "";
        let ornPhoto = loan.ornamentPhoto || loan.goldPhoto || "";
        
        if (custPhoto && custPhoto.length > 80000) {
            custPhoto = await compressBase64Image(custPhoto, 500, 0.85);
        }
        if (ornPhoto && ornPhoto.length > 80000) {
            ornPhoto = await compressBase64Image(ornPhoto, 800, 0.85);
        }

        const loanForPrint = {
            ...loan,
            customerPhoto: custPhoto,
            photo: custPhoto,
            ornamentPhoto: ornPhoto,
            goldPhoto: ornPhoto
        };

        const html = generate3in1VoucherHTML(loanForPrint, false);
        await printContent(html);
    } catch (err) {
        console.error("Print Voucher Error:", err);
        alert("વાઉચર પ્રિન્ટ કરતી વખતે ક્ષતિ આવી: " + err.message);
    }
}

// ==================== SANCTION LETTER (2-COPIES: CUSTOMER & BANK COPY) ====================

function generateSingleSanctionLetterCard(loan, copyTag, copyTitleGujarati) {
    const sanctionedAmt = Math.round(parseFloat(loan.sanctionedAmount || 0));
    const valuationAmt = Math.round(parseFloat(loan.valuationAmount || 0));
    const shareA = parseFloat(loan.shareA || 0);
    const shareB = parseFloat(loan.shareB || 0);
    const memberFee = parseFloat(loan.memberFee || 0);
    const valuerFee = parseFloat(loan.valuerFee || 0);
    const stampDuty = parseFloat(loan.stampDuty || 0);
    const serviceCharge = parseFloat(loan.serviceCharge || 0);
    const docCharges = parseFloat(loan.docCharges || 0);
    const insurance = parseFloat(loan.insurance || 0);
    const cgst = parseFloat(loan.cgst || 0);
    const sgst = parseFloat(loan.sgst || 0);
    const customChargesTotal = parseFloat(loan.customChargesTotal || 0);
    const otherCharges = parseFloat(loan.otherCharges || 0);
    const totalDeductions = Math.round(parseFloat(loan.totalDeductions || (shareA + shareB + memberFee + valuerFee + stampDuty + serviceCharge + docCharges + insurance + cgst + sgst + customChargesTotal + otherCharges)));
    const netDisbursed = sanctionedAmt - totalDeductions;
    const wts = getLoanGrossAndNetWeight(loan);
    const goldWeight = wts.netWeight.toFixed(3);
    const grossWeight = wts.grossWeight.toFixed(3);
    const accFormatted = formatLoanAccountNo(loan.accountNo, loan.branchCode, loan.loanType);
    const cleanBranch = getCleanBranchName(loan.branchName);
    const dateFormatted = formatDateDMY(loan.date);
    const sancWords = numberToGujaratiWords(sanctionedAmt);
    const netWords = numberToGujaratiWords(netDisbursed);
    const interestRate = loan.interestRate || "11.50";
    const tenureText = (loan.loanType && String(loan.loanType).includes("3553")) ? `${loan.installments || 36} માસ (EMI)` : "૧૨ માસ (Bullet)";
    const schemeText = loan.loanType || "GW-3725";

    // Deductions items array for clean table display
    const deductionsList = [];
    if (shareA + shareB > 0) deductionsList.push({ name: `શેર મૂડી (${shareA > 0 ? 'ગ્રુપ-A' : 'ગ્રુપ-B'})`, amt: shareA + shareB });
    if (memberFee > 0) deductionsList.push({ name: "સભાસદ પ્રવેશ ફી", amt: memberFee });
    if (valuerFee > 0) deductionsList.push({ name: "સોના વેલ્યુએશન ફી", amt: valuerFee });
    if (stampDuty > 0) deductionsList.push({ name: "સ્ટેમ્પ ડ્યુટી", amt: stampDuty });
    if (serviceCharge > 0) deductionsList.push({ name: "સર્વિસ ચાર્જ", amt: serviceCharge });
    if (docCharges > 0) deductionsList.push({ name: "ડોક્યુમેન્ટ ચાર્જ", amt: docCharges });
    if (insurance > 0) deductionsList.push({ name: "ઇન્સ્યોરન્સ ડિપોઝીટ", amt: insurance });
    if (cgst + sgst > 0) deductionsList.push({ name: "GST (CGST+SGST 18%)", amt: cgst + sgst });
    if (customChargesTotal + otherCharges > 0) deductionsList.push({ name: "અન્ય / કસ્ટમ ચાર્જીસ", amt: customChargesTotal + otherCharges });

    let deductRowsTableHtml = "";
    if (deductionsList.length === 0) {
        deductRowsTableHtml = `<tr><td colspan="2" style="padding:2px 3px; font-size:8.2px; color:#555; text-align:center;">કોઈ કપાત લાગુ નથી (₹ ૦)</td></tr>`;
    } else {
        deductionsList.forEach(item => {
            deductRowsTableHtml += `
                <tr>
                    <td style="padding: 1.5px 3px; color: #222; white-space: nowrap;">• ${item.name}</td>
                    <td style="padding: 1.5px 3px; text-align: right; font-weight: 700; color: #000; white-space: nowrap;">₹ ${item.amt.toLocaleString('en-IN')}</td>
                </tr>
            `;
        });
    }

    return `
    <div class="sanction-slip-content" style="display:flex; flex-direction:column; justify-content:space-between; height:100%; box-sizing:border-box; font-family:'Outfit', 'Noto Sans Gujarati', Arial, sans-serif; color:#000000; line-height:1.28;">
        
        <!-- Top Bank Header: Bank Name and Branch Name displayed together -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.2px solid #000000; padding-bottom: 3px; margin-bottom: 2px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${LOGO_SRC}" alt="JCCB" loading="eager" decoding="sync" style="width: 38px; height: 38px; object-fit: contain; flex-shrink:0;">
                <div>
                    <div style="font-size: 11.5px; font-weight: 900; color: #000000; letter-spacing: 0.2px; line-height: 1.15;">
                        THE JUNAGADH COMMERCIAL CO-OPERATIVE BANK LTD. - ${cleanBranch.toUpperCase()} BRANCH
                    </div>
                    <div style="font-size: 9.5px; font-weight: 700; color: #111111; line-height: 1.25; margin-top: 1px;">
                        ધી જૂનાગઢ કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ. - ${cleanBranch} શાખા &nbsp;|&nbsp; હે.ઓ. જૂનાગઢ
                    </div>
                    <div style="font-size: 11.5px; font-weight: 900; color: #000000; line-height: 1.2; margin-top: 2px;">
                        તા. <strong>${dateFormatted}</strong>
                    </div>
                </div>
            </div>
            <div style="text-align: right; flex-shrink:0;">
                <div style="border: 1.2px solid #000000; background: #f1f5f9; padding: 2.5px 8px; border-radius: 3px; font-size: 9px; font-weight: 900; text-transform: uppercase; display: inline-block; white-space:nowrap;">
                    ${copyTag} (${copyTitleGujarati})
                </div>
            </div>
        </div>

        <!-- Title Bar -->
        <div style="text-align: center; background: #f1f5f9; border-top: 1px solid #000; border-bottom: 1.2px solid #000; padding: 2px 0; margin-bottom: 2px;">
            <span style="font-size: 10px; font-weight: 900; letter-spacing: 0.4px; text-transform: uppercase;">
                GOLD LOAN SANCTION & EXPENSE ADVICE (સોના ધિરાણ મંજૂરી અને ખર્ચ પત્રક)
            </span>
        </div>

        <!-- 1. Unified Clean Structured Table for Loan & Borrower Particulars (Generous Row Height) -->
        <table style="width: 100%; border-collapse: collapse; border: 1.2px solid #000; margin-bottom: 2.5px; font-size: 9px; line-height: 1.32;">
            <tbody>
                <tr style="border-bottom: 1px solid #000;">
                    <td style="border-right: 1px solid #000; padding: 3px 5px; width: 14%; font-weight: 700; background: #f8fafc;">ખાતા નંબર:</td>
                    <td style="border-right: 1px solid #000; padding: 3px 5px; width: 22%; font-weight: 900; font-size: 9.8px;">${accFormatted}</td>
                    <td style="border-right: 1px solid #000; padding: 3px 5px; width: 14%; font-weight: 700; background: #f8fafc;">દરખાસ્ત નં.:</td>
                    <td style="border-right: 1px solid #000; padding: 3px 5px; width: 18%; font-weight: 700;">${loan.loanNo || "-"}</td>
                    <td style="border-right: 1px solid #000; padding: 3px 5px; width: 14%; font-weight: 700; background: #f8fafc;">પેકેટ નંબર:</td>
                    <td style="padding: 3px 5px; width: 18%; font-weight: 800;">${loan.packetNo || "-"}</td>
                </tr>
                <tr style="border-bottom: 1px solid #000;">
                    <td style="border-right: 1px solid #000; padding: 3px 5px; font-weight: 700; background: #f8fafc;">અરજદારનું નામ:</td>
                    <td style="border-right: 1px solid #000; padding: 3px 5px; font-weight: 900; font-size: 9.5px;" colspan="3">${loan.borrowerName}</td>
                    <td style="border-right: 1px solid #000; padding: 3px 5px; font-weight: 700; background: #f8fafc;">કસ્ટમર / સભાસદ:</td>
                    <td style="padding: 3px 5px; font-weight: 700;">${loan.customerNo || "-"}${loan.memberNo ? ' / સભાસદ: ' + loan.memberNo : ''}</td>
                </tr>
                <tr style="border-bottom: 1px solid #000;">
                    <td style="border-right: 1px solid #000; padding: 3px 5px; font-weight: 700; background: #f8fafc;">સરનામું & મો.:</td>
                    <td style="border-right: 1px solid #000; padding: 3px 5px;" colspan="3">${loan.address || "-"} ${loan.mobile ? ' (મો. ' + loan.mobile + ')' : ''}</td>
                    <td style="border-right: 1px solid #000; padding: 3px 5px; font-weight: 700; background: #f8fafc;">બચત ખાતા નં.:</td>
                    <td style="padding: 3px 5px; font-weight: 800;">${loan.savingsAc || "-"}</td>
                </tr>
                <tr style="border-bottom: 1px solid #000;">
                    <td style="border-right: 1px solid #000; padding: 3px 5px; font-weight: 700; background: #f8fafc;">લોન સ્કીમ & મુદ્દત:</td>
                    <td style="border-right: 1px solid #000; padding: 3px 5px;"><strong>${schemeText}</strong> (${tenureText})</td>
                    <td style="border-right: 1px solid #000; padding: 3px 5px; font-weight: 700; background: #f8fafc;">વ્યાજ દર (%):</td>
                    <td style="border-right: 1px solid #000; padding: 3px 5px; font-weight: 800;">${interestRate}% વાર્ષિક</td>
                    <td style="border-right: 1px solid #000; padding: 3px 5px; font-weight: 700; background: #f8fafc;">સોની વેલ્યુઅર:</td>
                    <td style="padding: 3px 5px;">${loan.valuerName || "-"}</td>
                </tr>
                <tr>
                    <td style="border-right: 1px solid #000; padding: 3px 5px; font-weight: 700; background: #f8fafc;">સોના દાગીના વજન:</td>
                    <td style="border-right: 1px solid #000; padding: 3px 5px;" colspan="3">ગ્રોસ વજન: <strong>${grossWeight} g</strong> &nbsp;|&nbsp; ચોખ્ખું સોનું (Net): <strong>${goldWeight} g</strong></td>
                    <td style="border-right: 1px solid #000; padding: 3px 5px; font-weight: 700; background: #f8fafc;">કુલ વેલ્યુએશન:</td>
                    <td style="padding: 3px 5px; font-weight: 800;">₹ ${valuationAmt.toLocaleString('en-IN')}/-</td>
                </tr>
            </tbody>
        </table>

        <!-- 2. Financials Section: Sanction, Itemized Deductions & Net Paid (Structured 3-column table) -->
        <table style="width: 100%; border-collapse: collapse; border: 1.2px solid #000; margin-bottom: 2.5px; font-size: 8.8px;">
            <thead>
                <tr style="background: #e2e8f0; border-bottom: 1.2px solid #000; font-weight: 800;">
                    <th style="border-right: 1px solid #000; padding: 2.5px 5px; width: 33%; text-align: left; font-size: 9px;">(A) મંજૂર લોનની રકમ (Sanctioned Loan)</th>
                    <th style="border-right: 1px solid #000; padding: 2.5px 5px; width: 37%; text-align: left; font-size: 9px;">(B) થયેલ ખર્ચ / કપાત વિગત (Deductions)</th>
                    <th style="padding: 2.5px 5px; width: 30%; text-align: left; font-size: 9px;">(C) ચૂકવવાપાત્ર ચોખ્ખી રકમ (Net Paid)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <!-- Column A: Sanction Amount Banner -->
                    <td style="border-right: 1px solid #000; vertical-align: top; padding: 4px 6px; background: #fafafa;">
                        <div style="font-size: 8.5px; font-weight: 700; color: #333;">કુલ મંજૂર થયેલ ધિરાણ રકમ:</div>
                        <div style="font-size: 14px; font-weight: 900; color: #000000; margin: 3px 0 2px 0;">
                            ₹ ${sanctionedAmt.toLocaleString('en-IN')}/-
                        </div>
                        <div style="font-size: 8.2px; color: #222; line-height: 1.25;">
                            અંકે: રૂપિયા ${sancWords} પૂરા.
                        </div>
                    </td>

                    <!-- Column B: Detailed Deductions -->
                    <td style="border-right: 1px solid #000; vertical-align: top; padding: 2px 4px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 8.3px; line-height: 1.22;">
                            ${deductRowsTableHtml}
                            <tr style="border-top: 1px solid #000; font-weight: 800; background: #f1f5f9;">
                                <td style="padding: 2px 3px;">કુલ કપાત (Total Deductions):</td>
                                <td style="padding: 2px 3px; text-align: right; color: #b91c1c; font-size: 9px;">(-) ₹ ${totalDeductions.toLocaleString('en-IN')}/-</td>
                            </tr>
                        </table>
                    </td>

                    <!-- Column C: Net Disbursal Banner -->
                    <td style="vertical-align: top; padding: 4px 6px; background: #f0fdf4; border-left: 1px solid #000;">
                        <div style="font-size: 8.5px; font-weight: 700; color: #166534;">ચોખ્ખી ચૂકવેલ / જમા રકમ:</div>
                        <div style="font-size: 14.5px; font-weight: 900; color: #15803d; margin: 3px 0 2px 0;">
                            ₹ ${netDisbursed.toLocaleString('en-IN')}/-
                        </div>
                        <div style="font-size: 8.2px; font-weight: 700; color: #166534; line-height: 1.25;">
                            અંકે: રૂપિયા ${netWords} પૂરા.
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- 3. Legal Undertaking & Declaration -->
        <div style="border: 1px solid #000; padding: 2px 5px; font-size: 8.2px; line-height: 1.25; background: #ffffff; margin-bottom: 2px;">
            <strong>ગ્રાહક બાંહેધરી :</strong> અમોએ બેંકના સોના ધિરાણના તમામ નિયમો-શરતો વાંચી-સમજીને સ્વીકારેલ છે. ઉપરોક્ત વિગત મુજબ તમામ ખર્ચ કપાત બાદ નેટ રકમ રૂ. <strong>${netDisbursed.toLocaleString('en-IN')}/-</strong> બચત ખાતામાં જમા / રોકડેથી મળેલ છે.
        </div>

        <!-- 4. Signatures (3 Distinct Columns: Borrower, Clerk, Branch Manager with Ample Height) -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 8.8px; font-weight: 800; padding: 0 10px; margin-top: 4px;">
            <div style="text-align: center; min-width: 130px;">
                <div style="height: 28px;"></div>
                <div style="border-bottom: 1.3px solid #000; width: 125px; margin: 0 auto 3px auto;"></div>
                <div>અરજદાર / ગ્રાહકની સહી (Borrower)</div>
            </div>
            <div style="text-align: center; min-width: 115px;">
                <div style="height: 28px;"></div>
                <div style="border-bottom: 1.3px solid #000; width: 110px; margin: 0 auto 3px auto;"></div>
                <div>તૈયાર કરનાર / ક્લાર્ક (Clerk)</div>
            </div>
            <div style="text-align: center; min-width: 130px;">
                <div style="height: 28px;"></div>
                <div style="border-bottom: 1.3px solid #000; width: 125px; margin: 0 auto 3px auto;"></div>
                <div>શાખા પ્રબંધક (Branch Manager)</div>
            </div>
        </div>

    </div>
    `;
}

function generateSanctionLetter2CopiesHTML(loan, isPageBreak = false) {
    const pageBreakClass = isPageBreak ? "print-page-break" : "";
    
    // Copy 1: Customer Copy
    const customerCopyHtml = generateSingleSanctionLetterCard(loan, "CUSTOMER COPY", "ગ્રાહક કોપી");
    
    // Copy 2: Bank / Loan File Copy
    const bankCopyHtml = generateSingleSanctionLetterCard(loan, "BANK / LOAN FILE COPY", "બેંક લોન ફાઇલ કોપી");

    return `
    <div class="print-page print-sanction-letter-page ${pageBreakClass}" style="width:210mm; height:297mm; max-height:297mm; box-sizing:border-box; padding:0.50in 0.50in 0.50in 1.00in; background:#ffffff; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; font-family:'Outfit', 'Noto Sans Gujarati', Arial, sans-serif;">
        
        <!-- Top Half: Customer Copy (Exact 50% Top Half) -->
        <div class="sanction-slip-copy" style="height:129mm; max-height:129mm; border:1.3px solid #000000; border-radius:3px; padding:2mm 3.5mm; background:#ffffff; box-sizing:border-box; overflow:hidden;">
            ${customerCopyHtml}
        </div>

        <!-- Scissor Cut Divider (Exact Center of A4 Page) -->
        <div class="sanction-cut-divider" style="height:5mm; display:flex; align-items:center; justify-content:center; position:relative; text-align:center; width:100%; margin:0; box-sizing:border-box;">
            <div style="border-top:1.4px dashed #000000; width:100%;"></div>
            <span style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:#ffffff; padding:0 12px; font-size:8.5px; color:#000000; font-weight:800; letter-spacing:0.4px; white-space:nowrap;">
                ✂ - - - - - - - - - - - - - - - અહીંથી અલગ કરો / CUT HERE - - - - - - - - - - - - - - - ✂
            </span>
        </div>

        <!-- Bottom Half: Bank / Loan File Copy (Exact 50% Bottom Half) -->
        <div class="sanction-slip-copy" style="height:129mm; max-height:129mm; border:1.3px solid #000000; border-radius:3px; padding:2mm 3.5mm; background:#ffffff; box-sizing:border-box; overflow:hidden;">
            ${bankCopyHtml}
        </div>

    </div>
    `;
}

async function printSanctionLetter(loan) {
    try {
        if (!loan) return;
        let custPhoto = loan.customerPhoto || loan.photo || "";
        let ornPhoto = loan.ornamentPhoto || loan.goldPhoto || "";
        
        if (custPhoto && custPhoto.length > 80000) {
            custPhoto = await compressBase64Image(custPhoto, 500, 0.85);
        }
        if (ornPhoto && ornPhoto.length > 80000) {
            ornPhoto = await compressBase64Image(ornPhoto, 800, 0.85);
        }

        const loanForPrint = {
            ...loan,
            customerPhoto: custPhoto,
            photo: custPhoto,
            ornamentPhoto: ornPhoto,
            goldPhoto: ornPhoto
        };

        const html = generateSanctionLetter2CopiesHTML(loanForPrint, false);
        await printContent(html);
    } catch (err) {
        console.error("Print Sanction Letter Error:", err);
        alert("સેંક્શન લેટર પ્રિન્ટ કરતી વખતે ક્ષતિ આવી: " + err.message);
    }
}

let currentLoanToPrint = null;

function openPrintModal(loan) {
    currentLoanToPrint = loan;
    const modal = document.getElementById("print-modal");
    if (modal) modal.classList.remove("hidden");
}

function initPrintModal() {
    const modal = document.getElementById("print-modal");
    const closeBtn = document.getElementById("close-print-modal-btn");
    const btnApp = document.getElementById("btn-print-application-form");
    const btnSanction = document.getElementById("btn-print-sanction-letter");
    const btnVouchers = document.getElementById("btn-print-single-a4");

    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.classList.add("hidden");
        });
    }

    if (btnApp) {
        btnApp.addEventListener("click", () => {
            if (modal) modal.classList.add("hidden");
            if (currentLoanToPrint) print4PageDocument(currentLoanToPrint);
        });
    }

    if (btnSanction) {
        btnSanction.addEventListener("click", () => {
            if (modal) modal.classList.add("hidden");
            if (currentLoanToPrint) printSanctionLetter(currentLoanToPrint);
        });
    }

    if (btnVouchers) {
        btnVouchers.addEventListener("click", () => {
            if (modal) modal.classList.add("hidden");
            if (currentLoanToPrint) print3in1Voucher(currentLoanToPrint);
        });
    }
}

async function printContent(contentHtml, isLandscape = false) {
    let printArea = document.getElementById("print-area");
    if (!printArea) {
        printArea = document.createElement("div");
        printArea.id = "print-area";
        document.body.appendChild(printArea);
    }

    const landscapeMode = isLandscape || (contentHtml && contentHtml.includes("landscape"));
    const pageSize = landscapeMode ? "A4 landscape" : "A4 portrait";
    const bodyWidth = landscapeMode ? "297mm" : "210mm";

    const printStyleHeader = `
    <style id="loan-document-print-margins">
        @page {
            size: ${pageSize} !important;
            margin: 0 !important;
        }
        @media print {
            @page {
                size: ${pageSize} !important;
                margin: 0 !important;
            }
            html, body {
                width: ${bodyWidth} !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            #print-area {
                display: block !important;
                width: ${bodyWidth} !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .print-page, .print-voucher, .print-requisition-form, .print-sanction-letter-page, .print-vouchers-page {
                width: 210mm !important;
                height: 297mm !important;
                max-height: 297mm !important;
                box-sizing: border-box !important;
                padding-top: 0.50in !important;     /* 0.50 inch (12.7mm) Top Margin */
                padding-left: 1.00in !important;    /* 1.00 inch (25.4mm) Left Margin */
                padding-right: 0.50in !important;   /* 0.50 inch (12.7mm) Right Margin */
                padding-bottom: 0.50in !important;  /* 0.50 inch (12.7mm) Bottom Margin */
                margin: 0 auto !important;
                background: #ffffff !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                overflow: hidden !important;
            }
            .print-page-break {
                page-break-after: always !important;
                break-after: page !important;
            }
        }
    </style>
    `;

    printArea.innerHTML = printStyleHeader + contentHtml;

    // Fast image decoding & readiness check so print preview opens instantly with all images fully rendered
    const images = Array.from(printArea.querySelectorAll("img"));
    if (images.length > 0) {
        await Promise.all(images.map(img => {
            if (img.complete) return Promise.resolve();
            if (img.decode) {
                return img.decode().catch(() => {});
            }
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
                setTimeout(resolve, 200);
            });
        }));
    }

    requestAnimationFrame(() => {
        setTimeout(() => {
            window.print();
        }, 50);
    });
}

// --- Page 1: સોનાનાં દાગીનાની જામીનગીરી પર કરજ માંગણીની અરજી ---
function generatePage1KarajManganiHTML(loan, isPageBreak = false) {
    const pageBreakClass = isPageBreak ? "print-page-break" : "";
    const sanctionedAmt = Math.round(parseFloat(loan.sanctionedAmount || 0));
    let ornamentsMarketVal = 0;
    if (loan.ornamentsTable && loan.ornamentsTable.length > 0) {
        loan.ornamentsTable.forEach((orn) => {
            ornamentsMarketVal += Math.round(parseFloat(orn.marketVal || 0));
        });
    }
    const valuationAmt = ornamentsMarketVal > 0 ? ornamentsMarketVal : Math.round(parseFloat(loan.valuationAmount || 0));
    const ltv = valuationAmt > 0 ? ((sanctionedAmt / valuationAmt) * 100).toFixed(2) : "75.00";
    const amountInWords = numberToGujaratiWords(sanctionedAmt);
    const purposeText = loan.purpose && loan.purpose.trim() ? loan.purpose.trim() : "ધિરાણ";
    const cleanBranch = getCleanBranchName(loan.branchName);
    const photoSrc = loan.customerPhoto || loan.photo || "";

    return `
    <div class="print-page print-voucher print-requisition-form ${pageBreakClass}" style="width:210mm; height:297mm; max-height:297mm; box-sizing:border-box; padding:0.50in 0.50in 0.50in 1.00in; font-family:'Outfit', 'Noto Sans Gujarati', sans-serif; color:#000000; line-height:1.65; background-color:#ffffff; font-size:11.5px; overflow:hidden;">
        
        <!-- Bank Header with Logo and Large Title -->
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
            <img src="${LOGO_SRC}" alt="JCCB Logo" loading="eager" decoding="sync" style="width:50px; height:50px; object-fit:contain;">
            <div style="flex:1; text-align:center;">
                <h1 style="font-size:19px; font-weight:800; margin:0; color:#000000; letter-spacing:0.5px;">ધી જૂનાગઢ  કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ.</h1>
                <p style="font-size:11px; margin:2px 0 0 0; font-weight:700; color:#111111;">હે.ઓ. : “ચંદ્રકાંત માલવિયા સ્મૃતિ ભવન”, ચોકસી બજાર, જૂનાગઢ. ૩૬૨૦૦૧</p>
            </div>
            <div style="width:50px;"></div>
        </div>
        
        <div style="border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; height:3.5px; margin:4px 0 10px 0;"></div>

        <!-- Application Title -->
        <div style="text-align:center; margin:6px 0 12px 0;">
            <h2 style="font-size:15px; font-weight:800; margin:0; text-decoration:underline;">સોનાનાં દાગીનાની જામીનગીરી પર કરજ માંગણીની અરજી</h2>
        </div>

        <!-- Recipient Details and Customer Photo Box -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
            <div style="font-size:12px; line-height:1.55;">
                પ્રતિ,<br>
                મેનેજરશ્રી,<br>
                ધી જૂનાગઢ કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ.<br>
                <strong>${cleanBranch}</strong><br>
                Customer Number : <strong>${loan.customerNo || ""}</strong>
            </div>

            <!-- Customer Photo Box -->
            <div style="width:92px; height:108px; border:1.5px solid #000000; border-radius:4px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:3px; box-sizing:border-box; background:#fafafa; flex-shrink:0;">
                ${photoSrc ? `<img src="${photoSrc}" alt="Customer Photo" loading="eager" decoding="sync" style="width:100%; height:100%; object-fit:cover; border-radius:2px;">` : `<div style="font-size:9.5px; font-weight:700; color:#333; line-height:1.25;">અરજદારનો<br>પાસપોર્ટ સાઈઝનો<br>ફોટો</div>`}
            </div>
        </div>

        <div style="font-weight:700; margin-bottom:8px; font-size:12.5px;">સાહેબશ્રી,</div>

        <!-- Paragraph 1: Personal Particulars -->
        <p style="text-align:justify; margin:0 0 10px 0; line-height:1.75; font-size:11.8px;">
            સવિનય હું <strong>${loan.borrowerName}</strong> સરનામું : <strong>${loan.address || "-"}</strong>, ઉ.વ. <strong>${loan.age ? loan.age + " વર્ષ" : "-"}</strong> આશરે, ધંધો : <strong>${loan.occupation || "-"}</strong>, ધર્મે : <strong>${loan.religion || "-"}</strong> , જ્ઞાતિ : <strong>${loan.caste || "-"}</strong>, મોબાઈલ નંબર : <strong>${loan.mobile || "-"}</strong> સભાસદ નંબર : <strong>${loan.memberNo || "-"}</strong>
        </p>

        <!-- Paragraph 2: Sanction Request & Legal Undertaking -->
        <p style="text-align:justify; margin:0 0 10px 0; line-height:1.75; font-size:11.8px;">
            આ સાથે સામેલ વેલ્યુએશન રિપોર્ટ મુજબના મારી માલિકીના સોનાનાં દાગીનાની જામીનગીરી ઉપર રૂ.<strong>${sanctionedAmt.toLocaleString("en-IN")}/-</strong> નું આપની બેંકમાંથી ધિરાણ <strong>${purposeText}</strong> ના હેતુ માટે મેળવવા માટે અરજી કરું છું. આથી હું તમો બેંકને ખાતરી અને બાંહેધરી આપું છું કે બેંકને જામીનગીરીમાં આપેલ દાગીના મારી સ્વતંત્ર માલિકીના છે. મેં બેંકના સોનાના દાગીનાની જામીનગીરી પર ધિરાણના નિયમો વાંચ્યા છે જે મને કબુલ-મંજુર છે. વધુમાં હું કબુલ રાખું છું કે રિઝર્વ બેંક ઓફ ઇન્ડિયાની વખતો વખતની સૂચના પ્રમાણે બેંક વ્યાજ મારા ખાતામાં ઉધરશે જે મને મંજુર છે. બેંકને નિયમાનુસાર દસ્તાવેજો લખી આપવા હું તૈયાર છું.
        </p>

        <!-- Paragraph 3: Sanction in Words & Safety Delivery -->
        <p style="text-align:justify; margin:0 0 10px 0; line-height:1.75; font-size:11.8px;">
            આજરોજ બેંક દ્વારા મંજુર કરાયેલ રકમ રૂ. <strong>${sanctionedAmt.toLocaleString("en-IN")}/-</strong> અંકે રૂપિયા <strong>${amountInWords} પૂરા</strong> ના ધિરાણની સલામતી પેટે હું આ સાથે સામેલ વેલ્યુએશન રિપોર્ટમાં દર્શાવ્યા મુજબના મારી માલિકીના સોનાના દાગીના થાલમાં આપી બેંકને સોંપુ છું.
        </p>

        <!-- Paragraph 4: Sealed Packet Procedure -->
        <p style="text-align:justify; margin:0 0 10px 0; line-height:1.75; font-size:11.8px;">
            વેલ્યુએશન રિપોર્ટમાં દર્શાવેલા તમામ સોનાના દાગીનાઓ શરાફે મારી હાજરીમાં એક સીલબંધ પેકેટ બનાવી, એક કાગળનું લેબલ બનાવી મારી હાજરીમાં બેંકના અધિકારીની સહી કરાવી દાગીનાના પેકેટ ઉપર ચોટાડી તૈયાર થયેલ સદર સીલબંધ પેકેટમાં રાખેલ સોનાના દાગીના હું બેંકને થાલમાં આપું છું.
        </p>

        <!-- Paragraph 5: Nominee -->
        <p style="text-align:justify; margin:0 0 12px 0; line-height:1.75; font-size:11.8px;">
            ઉપરાંત આ દાગીનાના વારસદાર તરીકે હું <strong>${loan.nomineeName || "-"}</strong> સંબંધે <strong>${loan.nomineeRelation || "-"}</strong> ની નિમણુંક કરું છું.
        </p>

        <!-- Location, Date & Borrower Signature -->
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:12px; margin-bottom:12px;">
            <div style="font-size:12px; line-height:1.55;">
                સ્થળઃ- <strong>${cleanBranch}</strong><br>
                તારીખઃ- <strong>${formatDateDMY(loan.date)}</strong>
            </div>
            <div style="text-align:center;">
                <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:4px; margin-bottom:4px; white-space:nowrap;">
                    <span style="font-weight:bold; font-size:13px; line-height:1;">X</span>
                    <span style="display:inline-block; width:160px; border-bottom:1.5px solid #000000;"></span>
                </div>
                <div style="font-weight:700; font-size:12px;">અરજદારની સહી</div>
                <div style="font-weight:700; font-size:11.5px;">(<strong>${loan.borrowerName}</strong>)</div>
            </div>
        </div>

        <!-- Office Order Divider Header -->
        <div style="display:flex; align-items:center; width:100%; margin:12px 0 10px 0;">
            <div style="flex:1; border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; height:3.5px;"></div>
            <div style="padding:0 14px; font-weight:900; font-size:14px; letter-spacing:0.5px; white-space:nowrap; color:#000000;">
                ઓફિસ શેરો
            </div>
            <div style="flex:1; border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; height:3.5px;"></div>
        </div>

        <!-- Office Table -->
        <table style="width:100%; border-collapse:collapse; border:1.2px solid #000; text-align:center; font-size:11.5px; margin-bottom:10px;">
            <tr style="background:#f1f5f9; font-weight:700;">
                <th style="border:1px solid #000; padding:5px 6px;">ખાતા નંબર</th>
                <th style="border:1px solid #000; padding:5px 6px;">પેકેટ નંબર</th>
                <th style="border:1px solid #000; padding:5px 6px;">સેવીંગ ખાતા નં.</th>
            </tr>
            <tr style="font-weight:700;">
                <td style="border:1px solid #000; padding:5px 6px;">${formatLoanAccountNo(loan.accountNo, loan.branchCode, loan.loanType)}</td>
                <td style="border:1px solid #000; padding:5px 6px;">${loan.packetNo || "-"}</td>
                <td style="border:1px solid #000; padding:5px 6px;">${loan.savingsAc || "-"}</td>
            </tr>
        </table>

        <!-- Office Sanction Order Text -->
        <p style="font-size:11.8px; line-height:1.75; margin:8px 0 16px 0; text-align:justify;">
            વેલ્યુએશન રિપોર્ટમાં દર્શાવ્યા મુજબના સોનાનાં દાગીના થાલમાં લઈને તેની કુલ કિંમત રૂ. <strong>${valuationAmt.toLocaleString("en-IN")}/-</strong> ના <strong>${ltv}%</strong> ટકા લેખે ધિરાણની રકમ રૂ. <strong>${sanctionedAmt.toLocaleString("en-IN")}/-</strong> અંકે રૂપિયા <strong>${amountInWords} પૂરા</strong> નો બેંકના સોનાના દાગીના સામે ધિરાણના નિયમાનુસાર ચુકાદો કરવાની મંજુરી આપવામાં આવે છે. આજરોજ ઉપરોક્ત દાગીનાનું સીલબંધ પેકેટ અરજદાર પાસેથી સંભાળી લૉકરમાં મુકેલ છે.
        </p>

        <!-- Officer Signatures -->
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:24px;">
            <div style="text-align:center; width:40%;">
                <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:4px; margin-bottom:4px;">
                    <span style="font-weight:bold; font-size:13px;">X</span>
                    <span style="display:inline-block; width:160px; border-bottom:1.5px solid #000000;"></span>
                </div>
                <div style="font-weight:800; font-size:12px;">Bank Officer</div>
            </div>
            <div style="text-align:center; width:40%;">
                <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:4px; margin-bottom:4px;">
                    <span style="font-weight:bold; font-size:13px;">X</span>
                    <span style="display:inline-block; width:160px; border-bottom:1.5px solid #000000;"></span>
                </div>
                <div style="font-weight:800; font-size:12px;">Branch Manager</div>
            </div>
        </div>

    </div>
    `;
}

// --- Page 2: સોનાના દાગીનાનો વેલ્યુએશન રિપોર્ટ & ડિમાન્ડ પ્રોમિસરી નોટ ---
function generatePage2ValuationReportHTML(loan, ltv, isPageBreak = true) {
    const pageBreakClass = isPageBreak ? "print-page-break" : "";
    const sanctionedAmt = Math.round(parseFloat(loan.sanctionedAmount || 0));
    const amountInWords = numberToGujaratiWords(sanctionedAmt);
    const cleanBranch = getCleanBranchName(loan.branchName);
    const activeHORate = getActiveGoldRate22K();
    const effectiveGoldRate = parseFloat(loan.goldRate22K || loan.goldRate || (state.goldRates && (state.goldRates["22K"] || state.goldRates["24K"])) || activeHORate || 72000);
    const ornamentPhotoSrc = loan.ornamentPhoto || loan.goldPhoto || "";

    let rowsHtml = "";
    let totalQty = 0;
    let totalGrossGm = 0, totalGrossMg = 0, totalNetGm = 0, totalNetMg = 0, totalFineGoldGm = 0, totalVal = 0;

    if (loan.ornamentsTable && loan.ornamentsTable.length > 0) {
        loan.ornamentsTable.forEach((orn) => {
            const netWeight = parseFloat(orn.netGm || 0) + (parseInt(orn.netMg || 0) / 1000);
            const purity = parseFloat(orn.purity || 22);
            const fineGold = (orn.fineGoldGm !== undefined && orn.fineGoldGm !== null && orn.fineGoldGm !== "") ? parseFloat(orn.fineGoldGm) : truncateTo3Decimals((netWeight * purity) / 22);

            totalQty += parseInt(orn.qty || 1);
            totalGrossGm += parseFloat(orn.grossGm || 0);
            totalGrossMg += parseInt(orn.grossMg || 0);
            totalNetGm += parseFloat(orn.netGm || 0);
            totalNetMg += parseInt(orn.netMg || 0);
            totalFineGoldGm += fineGold;
            totalVal += Math.round(parseFloat(orn.marketVal || 0));
        });
    }

    const normGrossGm = (totalGrossGm + Math.floor(totalGrossMg / 1000)).toFixed(3);
    const normGrossMg = totalGrossMg % 1000;
    const normNetGm = (totalNetGm + Math.floor(totalNetMg / 1000)).toFixed(3);
    const normNetMg = totalNetMg % 1000;

    for (let i = 0; i < 10; i++) {
        if (loan.ornamentsTable && i < loan.ornamentsTable.length) {
            const orn = loan.ornamentsTable[i];
            const netWeight = parseFloat(orn.netGm || 0) + (parseInt(orn.netMg || 0) / 1000);
            const purity = parseFloat(orn.purity || 22);
            const fineGold = (orn.fineGoldGm !== undefined && orn.fineGoldGm !== null && orn.fineGoldGm !== "") ? parseFloat(orn.fineGoldGm) : truncateTo3Decimals((netWeight * purity) / 22);
            const valAmt = Math.round(parseFloat(orn.marketVal || 0));

            rowsHtml += `
                <tr style="text-align:center; font-size:10px;">
                    <td style="border:1px solid #000; padding:2.5px 2px;">${i + 1}</td>
                    <td style="border:1px solid #000; padding:2.5px 4px; text-align:left;"><strong>${orn.name || ""}</strong></td>
                    <td style="border:1px solid #000; padding:2.5px 2px;"><strong>${orn.qty || 1}</strong></td>
                    <td style="border:1px solid #000; padding:2.5px 2px;">${parseFloat(orn.grossGm || 0).toFixed(3)}</td>
                    <td style="border:1px solid #000; padding:2.5px 2px;">${orn.grossMg || 0}</td>
                    <td style="border:1px solid #000; padding:2.5px 2px;"><strong>${parseFloat(orn.netGm || 0).toFixed(3)}</strong></td>
                    <td style="border:1px solid #000; padding:2.5px 2px;"><strong>${orn.netMg || 0}</strong></td>
                    <td style="border:1px solid #000; padding:2.5px 2px;">${orn.purity || 22} K</td>
                    <td style="border:1px solid #000; padding:2.5px 2px;"><strong>${fineGold.toFixed(3)}</strong></td>
                    <td style="border:1px solid #000; padding:2.5px 4px; text-align:right;"><strong>₹ ${valAmt.toLocaleString("en-IN")}</strong></td>
                </tr>
            `;
        } else {
            rowsHtml += `
                <tr style="text-align:center; font-size:10px; height:18px;">
                    <td style="border:1px solid #000; padding:2px;">${i + 1}</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                </tr>
            `;
        }
    }

    return `
    <div class="print-page print-voucher print-requisition-form ${pageBreakClass}" style="width:210mm; height:297mm; max-height:297mm; box-sizing:border-box; padding:0.50in 0.50in 0.50in 1.00in; font-family:'Outfit', 'Noto Sans Gujarati', sans-serif; color:#000000; line-height:1.36; background-color:#ffffff; font-size:10.5px; overflow:hidden;">
        
        <!-- Bank Header with Logo and Large Title -->
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
            <img src="${LOGO_SRC}" alt="JCCB Logo" loading="eager" decoding="sync" style="width:48px; height:48px; object-fit:contain;">
            <div style="flex:1; text-align:center;">
                <h1 style="font-size:18px; font-weight:800; margin:0; color:#000000; letter-spacing:0.5px;">ધી જૂનાગઢ  કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ.</h1>
                <p style="font-size:10.5px; margin:2px 0 0 0; font-weight:700; color:#111111;">હે.ઓ. : “ચંદ્રકાંત માલવિયા સ્મૃતિ ભવન”, ચોકસી બજાર, જૂનાગઢ. ૩૬૨૦૦૧</p>
            </div>
            <div style="width:48px;"></div>
        </div>
        
        <div style="border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; height:3px; margin:4px 0 8px 0;"></div>

        <!-- Recipient Details & Ornaments Photo Box -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
            <div style="font-size:11.5px; line-height:1.35;">
                પ્રતિ, મેનેજરશ્રી,<br>
                ધી જૂનાગઢ કોમર્શિયલ કો-ઓપરેટીવ બેંક લી.<br>
                <strong>${cleanBranch}</strong>
            </div>

            <!-- Spacious Centered Ornaments Photo Box (50% Bigger) -->
            <div style="width:220px; height:140px; border:1.5px solid #000000; border-radius:4px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:3px; box-sizing:border-box; background:#fafafa; flex-shrink:0;">
                ${ornamentPhotoSrc ? `<img src="${ornamentPhotoSrc}" alt="Ornaments Photo" loading="eager" decoding="sync" style="width:100%; height:100%; object-fit:cover; border-radius:2px;">` : `<div style="font-size:11px; font-weight:700; color:#333; line-height:1.3;">સોનાના દાગીનાનો ફોટો</div>`}
            </div>
        </div>

        <div style="font-weight:700; margin-bottom:2px; font-size:11.5px;">સાહેબશ્રી,</div>

        <!-- Borrower Name & Address (Centered, Bold, Large) -->
        <div style="text-align:center; font-size:13px; font-weight:700; margin:2px 0 2px 0; line-height:1.4; color:#000000;">
            નામ : <strong>${loan.borrowerName}</strong> &nbsp; રહે. <strong>${loan.address || "-"}</strong>
        </div>

        <!-- Center Gold Market Rate Line -->
        <div style="text-align:center; font-size:13.5px; font-weight:800; margin:2px 0 5px 0; color:#000000; letter-spacing:0.3px;">
            આજનો બજાર ભાવ રૂ. <strong>${effectiveGoldRate.toLocaleString("en-IN")}</strong>/- ૧૦ ગ્રામ શુદ્ધ સોનાનો
        </div>

        <!-- Section Title -->
        <div style="text-align:center; margin:3px 0 6px 0;">
            <h2 style="font-size:13.5px; font-weight:800; margin:0; text-decoration:underline;">સોનાનાં દાગીનાનો વેલ્યુએશન રિપોર્ટ</h2>
        </div>

        <!-- Ornaments Valuation 10-Row Table -->
        <table style="width:100%; border-collapse:collapse; border:1.5px solid #000; margin-bottom:6px; font-size:9.5px;">
            <thead>
                <tr style="background-color:#f1f5f9; text-align:center; font-weight:800;">
                    <th rowspan="2" style="border:1px solid #000; padding:2.5px; width:4%;">અ.નં.</th>
                    <th rowspan="2" style="border:1px solid #000; padding:2.5px; width:27%;">દાગીનાની વિગત</th>
                    <th rowspan="2" style="border:1px solid #000; padding:2.5px; width:6%;">નંગ</th>
                    <th colspan="2" style="border:1px solid #000; padding:2.5px; width:16%;">કુલ વજન</th>
                    <th colspan="2" style="border:1px solid #000; padding:2.5px; width:16%;">ચોખ્ખું વજન (Net)</th>
                    <th rowspan="2" style="border:1px solid #000; padding:2.5px; width:8%;">શુદ્ધતા</th>
                    <th rowspan="2" style="border:1px solid #000; padding:2.5px; width:11%;">ફાઇન ગોલ્ડ (g)</th>
                    <th rowspan="2" style="border:1px solid #000; padding:2.5px; width:12%;">કિંમત રૂ.</th>
                </tr>
                <tr style="background-color:#f8fafc; font-size:9px;">
                    <th style="border:1px solid #000; padding:2px;">ગ્રામ</th>
                    <th style="border:1px solid #000; padding:2px;">મી.ગ્રા.</th>
                    <th style="border:1px solid #000; padding:2px;">ગ્રામ</th>
                    <th style="border:1px solid #000; padding:2px;">મી.ગ્રા.</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
                <tr style="background-color:#f1f5f9; font-weight:800; text-align:center; font-size:10px;">
                    <td colspan="2" style="border:1px solid #000; padding:3px; text-align:right;">કુલ સરવાળો :</td>
                    <td style="border:1px solid #000; padding:3px;"><strong>${totalQty}</strong></td>
                    <td style="border:1px solid #000; padding:3px;">${normGrossGm}</td>
                    <td style="border:1px solid #000; padding:3px;">${normGrossMg}</td>
                    <td style="border:1px solid #000; padding:3px;"><strong>${normNetGm}</strong></td>
                    <td style="border:1px solid #000; padding:3px;"><strong>${normNetMg}</strong></td>
                    <td style="border:1px solid #000; padding:3px;">-</td>
                    <td style="border:1px solid #000; padding:3px;"><strong>${totalFineGoldGm.toFixed(3)}</strong></td>
                    <td style="border:1px solid #000; padding:3px; text-align:right;"><strong>₹ ${(totalVal || loan.valuationAmount || 0).toLocaleString("en-IN")}</strong></td>
                </tr>
            </tbody>
        </table>

        <!-- Valuer Undertaking -->
        <p style="text-align:justify; margin:4px 0 6px 0; font-size:11px; line-height:1.4;">
            આથી ખાતરી આપવામાં આવે છે કે ઉપર મુજબના દાગીના મેં જોઈ તપાસી અને કાળજીપૂર્વક તેની શુદ્ધતા, વજન, દર, કિંમતની આકારણી કરેલ છે અને મેં દર્શાવેલ વિગત વાજબી છે.
        </p>

        <!-- Location, Date & Valuer Signature -->
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:6px; margin-bottom:8px; font-size:11px;">
            <div style="line-height:1.4;">
                સ્થળ : <strong>${cleanBranch}</strong><br>
                તારીખ :- <strong>${formatDateDMY(loan.date)}</strong>
            </div>
            <div style="text-align:center; min-width:190px;">
                <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:4px; margin-bottom:2px; white-space:nowrap;">
                    <span style="font-weight:bold; font-size:12px;">X</span>
                    <span style="display:inline-block; width:150px; border-bottom:1.5px solid #000000;"></span>
                </div>
                <div style="font-weight:700; font-size:11px;">વેલ્યુઅરની સહી</div>
                <div style="font-weight:700; font-size:10.5px;">(<strong>${loan.valuerName || "Approved Valuer"}</strong>)</div>
            </div>
        </div>

        <!-- Borrower Acceptance Undertaking -->
        <p style="text-align:justify; margin:4px 0 6px 0; font-size:11px; line-height:1.4;">
            ઉપરોક્ત વિગતે વેલ્યુઅરે જે શુદ્ધતા, વજન, દર, કિંમત આકારેલ છે તે વાજબી છે અને મને કબૂલ-મંજુર છે.
        </p>

        <!-- Borrower Signature -->
        <div style="display:flex; justify-content:flex-end; margin-top:4px; margin-bottom:8px; font-size:11px;">
            <div style="text-align:center; min-width:190px;">
                <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:4px; margin-bottom:2px; white-space:nowrap;">
                    <span style="font-weight:bold; font-size:12px;">X</span>
                    <span style="display:inline-block; width:150px; border-bottom:1.5px solid #000000;"></span>
                </div>
                <div style="font-weight:700; font-size:11px;">અરજદારની સહી</div>
                <div style="font-weight:700; font-size:10.5px;">(<strong>${loan.borrowerName}</strong>)</div>
            </div>
        </div>

        <!-- DEMAND PROMISSORY NOTE DIVIDER HEADER -->
        <div style="display:flex; align-items:center; width:100%; margin:8px 0 6px 0;">
            <div style="flex:1; border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; height:3px;"></div>
            <div style="padding:0 12px; font-weight:800; font-size:13px; letter-spacing:0.5px; white-space:nowrap; color:#000000;">
                :: ડિમાન્ડ પ્રોમિસરી નોટ – વચન ચિઠ્ઠી ::
            </div>
            <div style="flex:1; border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; height:3px;"></div>
        </div>

        <!-- Demand Promissory Note Text -->
        <p style="text-align:justify; margin:4px 0 8px 0; font-size:11px; line-height:1.5;">
            હું <strong>${loan.borrowerName}</strong> આજરોજ મને મળેલા અવેજ બદલ રૂ. <strong>${sanctionedAmt.toLocaleString("en-IN")}/-</strong> અંકે રૂપિયા <strong>${amountInWords} પૂરા</strong> <strong>${loan.interestRate || "11.50"}%</strong> માસિક ચક્રવૃદ્ધિ વ્યાજ ગણતરી અનુસાર વાર્ષિક વ્યાજ દરે ચડત વ્યાજની રકમ સહીત જયારે માંગો ત્યારે ધી જૂનાગઢ કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ. – <strong>${cleanBranch}</strong> અથવા તેનાં આદેશ અનુસાર તેની કોઈપણ શાખામાં ચૂકવી આપવાનું વચન આપું છું.
        </p>

        <!-- Promissory Note Location, Date and Double Signatures with Revenue Stamp -->
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:8px; font-size:11px;">
            <div style="line-height:1.4;">
                તારીખ :- <strong>${formatDateDMY(loan.date)}</strong><br>
                સ્થળ : <strong>${cleanBranch}</strong>
            </div>

            <!-- Left Borrower Signature -->
            <div style="text-align:center; min-width:170px;">
                <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:4px; margin-bottom:2px; white-space:nowrap;">
                    <span style="font-weight:bold; font-size:12px;">X</span>
                    <span style="display:inline-block; width:140px; border-bottom:1.5px solid #000000;"></span>
                </div>
                <div style="font-weight:700; font-size:11px;">સહી</div>
                <div style="font-weight:700; font-size:10.5px;">(<strong>${loan.borrowerName}</strong>)</div>
            </div>

            <!-- Right Borrower Signature with Revenue Stamp Box -->
            <div style="text-align:center; min-width:170px; display:flex; flex-direction:column; align-items:center;">
                <!-- Revenue Stamp Box -->
                <div style="border:1.5px dashed #000000; width:52px; height:58px; display:flex; align-items:center; justify-content:center; font-size:9.5px; font-weight:800; text-align:center; margin-bottom:4px; background:#fafafa; line-height:1.2;">
                    રેવન્યુ<br>સ્ટેમ્પ
                </div>
                <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:4px; margin-bottom:2px; white-space:nowrap;">
                    <span style="font-weight:bold; font-size:12px;">X</span>
                    <span style="display:inline-block; width:140px; border-bottom:1.5px solid #000000;"></span>
                </div>
                <div style="font-weight:700; font-size:11px;">સહી</div>
                <div style="font-weight:700; font-size:10.5px;">(<strong>${loan.borrowerName}</strong>)</div>
            </div>
        </div>

    </div>
    `;
}

// --- Page 3: ગ્રાહક પહોંચ અને દાગીના પરત પહોંચ ---
function generatePage3ReceiptsHTML(loan, isPageBreak = true) {
    const pageBreakClass = isPageBreak ? "print-page-break" : "";
    const sanctionedAmt = Math.round(parseFloat(loan.sanctionedAmount || 0));
    const cleanBranch = getCleanBranchName(loan.branchName);
    const activeHORate = getActiveGoldRate22K();
    const effectiveGoldRate = parseFloat(loan.goldRate22K || loan.goldRate || (state.goldRates && (state.goldRates["22K"] || state.goldRates["24K"])) || activeHORate || 72000);
    const custPhotoSrc = loan.customerPhoto || loan.photo || "";
    const ornamentPhotoSrc = loan.ornamentPhoto || loan.goldPhoto || "";

    let rowsHtml = "";
    let totalQty = 0;
    let totalGrossGm = 0, totalGrossMg = 0, totalNetGm = 0, totalNetMg = 0, totalFineGoldGm = 0, totalVal = 0;

    if (loan.ornamentsTable && loan.ornamentsTable.length > 0) {
        loan.ornamentsTable.forEach((orn) => {
            const netWeight = parseFloat(orn.netGm || 0) + (parseInt(orn.netMg || 0) / 1000);
            const purity = parseFloat(orn.purity || 22);
            const fineGold = (orn.fineGoldGm !== undefined && orn.fineGoldGm !== null && orn.fineGoldGm !== "") ? parseFloat(orn.fineGoldGm) : parseFloat(((netWeight * purity) / 22).toFixed(3));

            totalQty += parseInt(orn.qty || 1);
            totalGrossGm += parseFloat(orn.grossGm || 0);
            totalGrossMg += parseInt(orn.grossMg || 0);
            totalNetGm += parseFloat(orn.netGm || 0);
            totalNetMg += parseInt(orn.netMg || 0);
            totalFineGoldGm += fineGold;
            totalVal += Math.round(parseFloat(orn.marketVal || 0));
        });
    }

    const normGrossGm = (totalGrossGm + Math.floor(totalGrossMg / 1000)).toFixed(3);
    const normGrossMg = totalGrossMg % 1000;
    const normNetGm = (totalNetGm + Math.floor(totalNetMg / 1000)).toFixed(3);
    const normNetMg = totalNetMg % 1000;

    for (let i = 0; i < 10; i++) {
        if (loan.ornamentsTable && i < loan.ornamentsTable.length) {
            const orn = loan.ornamentsTable[i];
            const netWeight = parseFloat(orn.netGm || 0) + (parseInt(orn.netMg || 0) / 1000);
            const purity = parseFloat(orn.purity || 22);
            const fineGold = (orn.fineGoldGm !== undefined && orn.fineGoldGm !== null && orn.fineGoldGm !== "") ? parseFloat(orn.fineGoldGm) : parseFloat(((netWeight * purity) / 22).toFixed(3));
            const valAmt = Math.round(parseFloat(orn.marketVal || 0));

            rowsHtml += `
                <tr style="text-align:center; font-size:10px;">
                    <td style="border:1px solid #000; padding:2.5px 2px;">${i + 1}</td>
                    <td style="border:1px solid #000; padding:2.5px 4px; text-align:left;"><strong>${orn.name || ""}</strong></td>
                    <td style="border:1px solid #000; padding:2.5px 2px;"><strong>${orn.qty || 1}</strong></td>
                    <td style="border:1px solid #000; padding:2.5px 2px;">${parseFloat(orn.grossGm || 0).toFixed(3)}</td>
                    <td style="border:1px solid #000; padding:2.5px 2px;">${orn.grossMg || 0}</td>
                    <td style="border:1px solid #000; padding:2.5px 2px;"><strong>${parseFloat(orn.netGm || 0).toFixed(3)}</strong></td>
                    <td style="border:1px solid #000; padding:2.5px 2px;"><strong>${orn.netMg || 0}</strong></td>
                    <td style="border:1px solid #000; padding:2.5px 2px;">${orn.purity || 22} K</td>
                    <td style="border:1px solid #000; padding:2.5px 2px;"><strong>${fineGold.toFixed(3)}</strong></td>
                    <td style="border:1px solid #000; padding:2.5px 4px; text-align:right;"><strong>₹ ${valAmt.toLocaleString("en-IN")}</strong></td>
                </tr>
            `;
        } else {
            rowsHtml += `
                <tr style="text-align:center; font-size:10px; height:18px;">
                    <td style="border:1px solid #000; padding:2px;">${i + 1}</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                    <td style="border:1px solid #000; padding:2px;">&nbsp;</td>
                </tr>
            `;
        }
    }

    return `
    <div class="print-page print-voucher print-requisition-form ${pageBreakClass}" style="width:210mm; height:297mm; max-height:297mm; box-sizing:border-box; padding:0.50in 0.50in 0.50in 1.00in; font-family:'Outfit', 'Noto Sans Gujarati', sans-serif; color:#000000; line-height:1.36; background-color:#ffffff; font-size:10.5px; overflow:hidden;">
        
        <!-- Bank Header with Logo and Large Title -->
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
            <img src="${LOGO_SRC}" alt="JCCB Logo" loading="eager" decoding="sync" style="width:48px; height:48px; object-fit:contain;">
            <div style="flex:1; text-align:center;">
                <h1 style="font-size:18px; font-weight:800; margin:0; color:#000000; letter-spacing:0.5px;">ધી જૂનાગઢ  કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ.</h1>
                <p style="font-size:10.5px; margin:2px 0 0 0; font-weight:700; color:#111111;">હે.ઓ. : “ચંદ્રકાંત માલવિયા સ્મૃતિ ભવન”, ચોકસી બજાર, જૂનાગઢ. ૩૬૨૦૦૧</p>
            </div>
            <div style="width:48px;"></div>
        </div>
        
        <div style="border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; height:3px; margin:4px 0 8px 0;"></div>

        <!-- Recipient Details & Dual Photo Boxes -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
            <div style="font-size:11.5px; line-height:1.35;">
                પ્રતિ,<br>
                મેનેજરશ્રી,<br>
                ધી જૂનાગઢ કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ.<br>
                <strong>${cleanBranch}</strong>
            </div>

            <!-- Dual Photos on Right: Customer Photo + 50% Bigger Ornaments Photo -->
            <div style="display:flex; gap:8px; align-items:center;">
                <!-- Customer Photo Box -->
                <div style="width:90px; height:130px; border:1.5px solid #000000; border-radius:4px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:3px; box-sizing:border-box; background:#fafafa; flex-shrink:0;">
                    ${custPhotoSrc ? `<img src="${custPhotoSrc}" alt="Customer Photo" loading="eager" decoding="sync" style="width:100%; height:100%; object-fit:cover; border-radius:2px;">` : `<div style="font-size:9.5px; font-weight:700; color:#333; line-height:1.25;">અરજદારનો<br>ફોટો</div>`}
                </div>
                <!-- Ornaments Photo Box (50% Bigger) -->
                <div style="width:175px; height:130px; border:1.5px solid #000000; border-radius:4px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:3px; box-sizing:border-box; background:#fafafa; flex-shrink:0;">
                    ${ornamentPhotoSrc ? `<img src="${ornamentPhotoSrc}" alt="Ornaments Photo" loading="eager" decoding="sync" style="width:100%; height:100%; object-fit:cover; border-radius:2px;">` : `<div style="font-size:10.5px; font-weight:700; color:#333; line-height:1.25;">સોનાના દાગીનાનો<br>ફોટો</div>`}
                </div>
            </div>
        </div>

        <div style="font-weight:700; margin-bottom:2px; font-size:11.5px;">સાહેબશ્રી,</div>

        <!-- Borrower Name & Address (Centered, Bold, Large) -->
        <div style="text-align:center; font-size:12.5px; font-weight:700; margin:2px 0; line-height:1.4; color:#000000;">
            નામ : <strong>${loan.borrowerName}</strong> &nbsp; રહે. <strong>${loan.address || "-"}</strong>
        </div>

        <!-- Center Gold Market Rate Line -->
        <div style="text-align:center; font-size:13px; font-weight:800; margin:2px 0 5px 0; color:#000000; letter-spacing:0.3px;">
            આજનો બજાર ભાવ રૂ. <strong>${effectiveGoldRate.toLocaleString("en-IN")}</strong>/- ૧૦ ગ્રામ શુદ્ધ સોનાનો
        </div>

        <!-- Section Title -->
        <div style="text-align:center; margin:2px 0 5px 0;">
            <h2 style="font-size:13.5px; font-weight:800; margin:0; text-decoration:underline;">ગ્રાહકને આપવાની પહોંચ</h2>
        </div>

        <!-- Ornaments Valuation 10-Row Table -->
        <table style="width:100%; border-collapse:collapse; border:1.5px solid #000; margin-bottom:5px; font-size:9.5px;">
            <thead>
                <tr style="background-color:#f1f5f9; text-align:center; font-weight:800;">
                    <th rowspan="2" style="border:1px solid #000; padding:2.5px; width:4%;">અ.નં.</th>
                    <th rowspan="2" style="border:1px solid #000; padding:2.5px; width:27%;">દાગીનાની વિગત</th>
                    <th rowspan="2" style="border:1px solid #000; padding:2.5px; width:6%;">નંગ</th>
                    <th colspan="2" style="border:1px solid #000; padding:2.5px; width:16%;">કુલ વજન</th>
                    <th colspan="2" style="border:1px solid #000; padding:2.5px; width:16%;">ચોખ્ખું વજન (Net)</th>
                    <th rowspan="2" style="border:1px solid #000; padding:2.5px; width:8%;">શુદ્ધતા</th>
                    <th rowspan="2" style="border:1px solid #000; padding:2.5px; width:11%;">ફાઇન ગોલ્ડ (g)</th>
                    <th rowspan="2" style="border:1px solid #000; padding:2.5px; width:12%;">કિંમત રૂ.</th>
                </tr>
                <tr style="background-color:#f8fafc; font-size:9px;">
                    <th style="border:1px solid #000; padding:2px;">ગ્રામ</th>
                    <th style="border:1px solid #000; padding:2px;">મી.ગ્રા.</th>
                    <th style="border:1px solid #000; padding:2px;">ગ્રામ</th>
                    <th style="border:1px solid #000; padding:2px;">મી.ગ્રા.</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
                <tr style="background-color:#f1f5f9; font-weight:800; text-align:center; font-size:10px;">
                    <td colspan="2" style="border:1px solid #000; padding:3px; text-align:right;">કુલ સરવાળો :</td>
                    <td style="border:1px solid #000; padding:3px;"><strong>${totalQty}</strong></td>
                    <td style="border:1px solid #000; padding:3px;">${normGrossGm}</td>
                    <td style="border:1px solid #000; padding:3px;">${normGrossMg}</td>
                    <td style="border:1px solid #000; padding:3px;"><strong>${normNetGm}</strong></td>
                    <td style="border:1px solid #000; padding:3px;"><strong>${normNetMg}</strong></td>
                    <td style="border:1px solid #000; padding:3px;">-</td>
                    <td style="border:1px solid #000; padding:3px;"><strong>${totalFineGoldGm.toFixed(3)}</strong></td>
                    <td style="border:1px solid #000; padding:3px; text-align:right;"><strong>₹ ${(totalVal || loan.valuationAmount || 0).toLocaleString("en-IN")}</strong></td>
                </tr>
            </tbody>
        </table>

        <!-- Tenure Line -->
        <p style="font-size:11px; font-weight:700; margin:4px 0 3px 0;">
            સદરહુ ધિરાણ રૂ. <strong>${sanctionedAmt.toLocaleString("en-IN")}/-</strong> ની મુદત તા. <strong>${formatDateDMY(loan.date)}</strong> થી ૧ વર્ષ સુધીની છે.
        </p>

        <!-- 3 Signatures in One Line across 100% width with ample signing space -->
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:20px; margin-bottom:6px; font-size:10.5px;">
            <!-- 1. Sealed Packet Creator -->
            <div style="text-align:center; width:31%;">
                <div style="height:38px;"></div>
                <span style="display:inline-block; width:150px; border-bottom:1.5px solid #000000; margin-bottom:4px;"></span>
                <div style="font-weight:800; font-size:10.5px; color:#000000;">સીલબંધ પેકેટ તૈયાર કરનાર</div>
                <div style="font-weight:700; font-size:9.5px; margin-top:1px;">(<strong>${loan.valuerName || "Approved Valuer"}</strong>)</div>
            </div>
            <!-- 2. Ornaments Handover / Borrower -->
            <div style="text-align:center; width:31%;">
                <div style="height:38px;"></div>
                <span style="display:inline-block; width:150px; border-bottom:1.5px solid #000000; margin-bottom:4px;"></span>
                <div style="font-weight:800; font-size:10.5px; color:#000000;">દાગીના સોંપનારની સહી</div>
                <div style="font-weight:700; font-size:9.5px; margin-top:1px;">(<strong>${loan.borrowerName}</strong>)</div>
            </div>
            <!-- 3. Bank Handled (Officer & Manager) -->
            <div style="text-align:center; width:31%;">
                <div style="height:38px;"></div>
                <span style="display:inline-block; width:150px; border-bottom:1.5px solid #000000; margin-bottom:4px;"></span>
                <div style="font-weight:800; font-size:10.5px; color:#000000;">બેંક વતી દાગીના સંભાળ્યા</div>
                <div style="display:flex; justify-content:space-around; font-weight:800; font-size:9.5px; margin-top:2px; padding:0 6px;">
                    <span>ઓફિસર</span><span>મેનેજર</span>
                </div>
            </div>
        </div>

        <!-- Location & Date Below Signatures -->
        <div style="margin-top:3px; margin-bottom:4px; font-size:10.5px; font-weight:700; line-height:1.4;">
            <div>સ્થળ : <strong>${cleanBranch}</strong></div>
            <div>તારીખ :- <strong>${formatDateDMY(loan.date)}</strong></div>
        </div>

        <!-- DIVIDER: RETURN RECEIPT SECTION -->
        <div style="display:flex; align-items:center; width:100%; margin:4px 0 3px 0;">
            <div style="flex:1; border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; height:3px;"></div>
            <div style="padding:0 10px; font-weight:800; font-size:12px; letter-spacing:0.5px; white-space:nowrap; color:#000000;">
                :: દાગીના પરત મળ્યાંની પહોંચ ::
            </div>
            <div style="flex:1; border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; height:3px;"></div>
        </div>

        <div style="font-size:10px; margin-bottom:2px; line-height:1.3;">
            પ્રતિ, મેનેજરશ્રી, ધી જૂનાગઢ કોમ. કો-ઓપ. બેંક લી. <strong>${cleanBranch}</strong>
        </div>

        <p style="text-align:justify; margin:2px 0 3px 0; font-size:10px; line-height:1.3;">
            ઉપરોક્ત વિગતે મેં બેંકને ગીરો આપેલ સોનાના દાગીના અસલ સ્થિતિમાં પરત મળ્યાં છે તે બદલ હું આ પહોંચમાં મારી સહી કરી આપું છું.
        </p>

        <!-- Account No & Packet No in a Prominent Box Table -->
        <div style="display:flex; justify-content:center; margin:3px 0 4px 0;">
            <table style="border:1.5px solid #000000; border-collapse:collapse; text-align:center; background:#f8fafc;">
                <tr>
                    <td style="border:1.5px solid #000000; padding:2.5px 14px; font-size:11px; font-weight:800; color:#000000;">
                        ખાતા નંબર : <span style="font-size:12px; font-weight:900; letter-spacing:0.3px;">${formatLoanAccountNo(loan.accountNo, loan.branchCode, loan.loanType)}</span>
                    </td>
                    <td style="border:1.5px solid #000000; padding:2.5px 14px; font-size:11px; font-weight:800; color:#000000;">
                        પેકેટ નંબર : <span style="font-size:12px; font-weight:900; letter-spacing:0.3px;">${loan.packetNo || "-"}</span>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Return Section Date and Return Signature with Ample Space -->
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:12px; margin-bottom:3px; font-size:10px;">
            <div style="line-height:1.3; font-weight:700; font-size:10.5px;">
                તારીખ : __________________
            </div>
            <div style="text-align:center; min-width:170px;">
                <span style="display:inline-block; width:140px; border-bottom:1.5px solid #000000; margin-bottom:3px;"></span>
                <div style="font-weight:800; font-size:10.5px;">દાગીના પરત મેળવનારની સહી</div>
                <div style="font-weight:700; font-size:9.5px;">(<strong>${loan.borrowerName}</strong>)</div>
            </div>
        </div>

        <!-- Rules Box at the Bottom -->
        <div style="border:1px solid #000000; border-radius:3px; padding:2.5px 5px; font-size:8.5px; line-height:1.25; margin-top:3px; background:#fafafa; text-align:justify;">
            <strong>:: નિયમો ::</strong> (૧) આ ધિરાણની મુદત એક વર્ષની છે. (૨) વ્યાજનો દર બેંકનું બોર્ડ વખતોવખત ઠરાવશે તે લાગુ રહેશે. (૩) ખાતે ઉધારેલ માસિક વ્યાજ દર માસે જમા કરાવવાનું છે. અન્યથા ૨ % પેલન ચાર્જ વસુલવામાં આવશે. (૪) ધિરાણ લેનારે વારસદાર નીમવા ફરજીયાત છે. (૫) આ ધિરાણ અંગેના તમામ વ્યવહારો કરતી વખતે આ પહોંચ સાથે રાખવી ફરજીયાત છે. (૬) ધિરાણ લેનાર વ્યક્તિને જ દાગીના પરત સોંપવામાં આવશે.
        </div>

    </div>
    `;
}

// --- Page 4: KEY FACTS STATEMENT (KFS) ---
function generatePage4KFSHTML(loan, ltv, isPageBreak = false) {
    const pageBreakClass = isPageBreak ? "print-page-break" : "";
    const schemeCode = (loan.loanType || "").toString();
    const isInstallmentScheme = schemeCode.includes("3527") || schemeCode.includes("GNA");
    const isOverdraftScheme = schemeCode.includes("3553") || schemeCode.includes("GOD");
    const cleanBranch = getCleanBranchName(loan.branchName);
    const todayFormatted = formatDateDMY(new Date());
    const accFormatted = formatLoanAccountNo(loan.accountNo, loan.branchCode, loan.loanType);

    const sanctionedAmt = Math.round(parseFloat(loan.sanctionedAmount || 0));
    const totalDeductions = Math.round(parseFloat(loan.totalDeductions || (
        (parseFloat(loan.shareA || 0) + parseFloat(loan.shareB || 0) + parseFloat(loan.memberFee || 0) + 
         parseFloat(loan.valuerFee || 0) + parseFloat(loan.stampDuty || 0) + parseFloat(loan.serviceCharge || 0) + 
         parseFloat(loan.docCharges || 0) + parseFloat(loan.insurance || 0) + parseFloat(loan.cgst || 0) + 
         parseFloat(loan.sgst || 0) + parseFloat(loan.otherCharges || 0))
    )));
    // Disbursed Amount is equal to Sanctioned Loan Amount
    const disbursedAmt = sanctionedAmt;

    // Gross Weight & Net Weight calculated from ornaments table totals
    let calcGrossGm = 0, calcGrossMg = 0, calcNetGm = 0, calcNetMg = 0;
    if (loan.ornamentsTable && loan.ornamentsTable.length > 0) {
        loan.ornamentsTable.forEach((orn) => {
            calcGrossGm += parseFloat(orn.grossGm || 0);
            calcGrossMg += parseInt(orn.grossMg || 0);
            calcNetGm += parseFloat(orn.netGm || 0);
            calcNetMg += parseInt(orn.netMg || 0);
        });
    }
    const finalGrossWeight = (calcGrossGm > 0 || calcGrossMg > 0) 
        ? (calcGrossGm + (calcGrossMg / 1000)).toFixed(3) 
        : (loan.grossWeight ? parseFloat(loan.grossWeight).toFixed(3) : parseFloat(loan.goldWeight || 0).toFixed(3));
    const finalNetWeight = (calcNetGm > 0 || calcNetMg > 0) 
        ? (calcNetGm + (calcNetMg / 1000)).toFixed(3) 
        : parseFloat(loan.goldWeight || 0).toFixed(3);
    const goldWt = finalNetWeight;
    const grossWt = finalGrossWeight;
    const interestRate = parseFloat(loan.interestRate || 11.50).toFixed(2);
    const aprRate = interestRate;

    const srvFee = Math.round(parseFloat(loan.serviceCharge || 0));
    const valFee = Math.round(parseFloat(loan.valuerFee || 0));
    const docFee = Math.round(parseFloat(loan.docCharges || 0));
    const stampFee = Math.round(parseFloat(loan.stampDuty || 0));
    const otherDeduct = Math.round(parseFloat(loan.insurance || 0) + parseFloat(loan.shareA || 0) + parseFloat(loan.shareB || 0) + parseFloat(loan.memberFee || 0) + parseFloat(loan.cgst || 0) + parseFloat(loan.sgst || 0) + parseFloat(loan.otherCharges || 0));

    const groName = (loan.grievanceOfficer && loan.grievanceOfficer.trim()) ? loan.grievanceOfficer.trim() : (document.getElementById("grievance-officer") ? document.getElementById("grievance-officer").value.trim() : "Amrutlal Valjibhai Chavda");
    const groDisplay = groName;

    // 1. Overdraft Facility KFS (Scheme 3553 / GOD-3553)
    if (isOverdraftScheme) {
        const maturityDate = getMaturityDate(loan.date, 12);

        return `
        <div class="print-page print-voucher print-requisition-form ${pageBreakClass}" style="width:210mm; height:297mm; max-height:297mm; box-sizing:border-box; padding:0.50in 0.50in 0.50in 1.00in; font-family:'Outfit', 'Segoe UI', Arial, sans-serif; color:#000000; line-height:1.2; background-color:#ffffff; font-size:8.8px; overflow:hidden;">
            
            <!-- Bank Header with Logo on Left -->
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:2px;">
                <img src="${LOGO_SRC}" alt="JCCB Logo" loading="eager" decoding="sync" style="width:38px; height:38px; object-fit:contain;">
                <div style="flex:1; text-align:center;">
                    <h1 style="font-size:15px; font-weight:800; margin:0; color:#000000; letter-spacing:0.3px;">THE JUNAGADH COMMERCIAL CO-OPERATIVE BANK LTD.</h1>
                    <p style="font-size:9px; margin:1px 0 0 0; font-weight:600; color:#111111;">H.O. : “Chandrakant Malaviya Smruti Bhavan”, Choksi Bazar, Junagadh - 362001</p>
                    <p style="font-size:10px; margin:1px 0 0 0; font-weight:700; color:#000000;">Branch : <strong>${cleanBranch}</strong></p>
                </div>
                <div style="width:38px;"></div>
            </div>
            
            <div style="border-top:1.5px solid #000000; margin:2px 0 4px 0;"></div>

            <div style="text-align:center; margin:1px 0 3px 0;">
                <h2 style="font-size:12.5px; font-weight:800; margin:0; text-transform:uppercase; text-decoration:underline;">KEY FACTS STATEMENT (KFS) – SUMMARY BOX</h2>
                <div style="font-size:10px; font-weight:700; color:#000000; margin-top:1px;">(Gold Loan – Overdraft Facility)</div>
            </div>

            <!-- KFS Summary Table for 3553 Overdraft Scheme -->
            <table style="width:100%; border-collapse:collapse; font-size:9.5px; border:1.5px solid #000; margin-bottom:4px;">
                <thead>
                    <tr style="background-color:#f1f5f9; border-bottom:1.5px solid #000;">
                        <th style="border:1px solid #000; padding:2.5px 6px; width:42%; text-align:left; font-weight:800; font-size:10px;">Particulars</th>
                        <th style="border:1px solid #000; padding:2.5px 6px; width:58%; text-align:left; font-weight:800; font-size:10px;">Details</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Unique Proposal Number</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;">${loan.loanNo || "GL-" + accFormatted}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Date of KFS</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;"><strong>${formatDateDMY(loan.date)}</strong></td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Borrower Name</td>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">${loan.borrowerName || ""}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Customer ID</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;">${loan.customerNo || "N/A"}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Loan Account No.</td>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">${accFormatted}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Type of Facility</td>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Gold Loan – Overdraft (OD)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Purpose of Loan</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;">${loan.purpose || "Agriculture / Business / Personal"}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Sanctioned Limit</td>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">₹ ${sanctionedAmt.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Available Drawing Limit</td>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">₹ ${sanctionedAmt.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Amount Disbursed / Utilised (Initial)</td>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">₹ ${disbursedAmt.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Facility Validity / Maturity Date</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;"><strong>${formatDateDMY(maturityDate)}</strong></td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Rate of Interest</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;"><strong>${interestRate}% p.a. (Fixed / Floating)</strong></td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Annual Percentage Rate (APR)</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;"><strong>${aprRate}%</strong></td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Interest Recovery Frequency</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;">Monthly / Quarterly</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Processing Charges</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;">₹ ${srvFee.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Gold Appraiser Charges</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;">₹ ${valFee.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Documentation Charges</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;">₹ ${docFee.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Other Charges (if any)</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;">₹ ${(stampFee + otherDeduct).toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Penal Charges</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;">2.00% p.a. on overdue amount for delayed period</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Security</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;">Pledge of Gold Ornaments (Packet #${loan.packetNo || ""})</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Gross Weight / Net Weight of Gold</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;">Gross: ${grossWt} g / Net: <strong>${goldWt} g</strong></td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Purity of Gold</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;">22 Karat (916)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Loan-to-Value (LTV)</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;"><strong>${ltv ? parseFloat(ltv).toFixed(2) : "75.00"}%</strong> (Max 75%)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700; font-size:9px; line-height:1.2;">Repayment Terms</td>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-size:9px; line-height:1.2;">The overdraft facility is repayable on demand or on/before the maturity date. Interest is payable at the prescribed frequency on the amount utilized.</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Redraw Facility</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;">Permitted / Not Permitted (as per sanction terms)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700;">Prepayment / Closure Charges</td>
                        <td style="border:1px solid #000; padding:2.5px 6px;">Nil</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700; font-size:8.5px; line-height:1.2;">Consequences of Default</td>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-size:8.5px; line-height:1.2;">
                            Failure to service interest or repay the dues may attract penal charges. In case of continued default, the Bank may enforce the pledge and recover outstanding dues by sale/auction of the pledged gold in accordance with RBI guidelines and the loan agreement after giving the required notice.
                        </td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-weight:700; font-size:9px;">Grievance Redressal Officer</td>
                        <td style="border:1px solid #000; padding:2.5px 6px; font-size:9px;">${groDisplay}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Borrower's Acknowledgement Section -->
            <div style="border:1.5px solid #000; padding:5px 10px; margin-top:3px; background:#fafafa;">
                <div style="text-align:center; font-size:11.5px; font-weight:800; text-transform:uppercase; margin-bottom:2px; text-decoration:underline; color:#000000; letter-spacing:0.5px;">
                    Borrower's Acknowledgement
                </div>
                <p style="text-align:justify; font-size:9px; font-weight:700; font-style:italic; line-height:1.3; margin:0 0 10px 0; color:#000000;">
                    I/We acknowledge that I/We have received the Key Facts Statement prior to execution of the loan documents. I/We have understood the sanctioned limit, applicable interest rate, APR, charges, repayment terms, security, penal charges, and consequences of default.
                </p>

                <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:9px; font-weight:700; margin-top:14px;">
                    <div style="line-height:1.35;">
                        <div>Date: <strong>${formatDateDMY(loan.date)}</strong></div>
                        <div style="margin-top:2px;">Place: <strong>${cleanBranch}</strong></div>
                    </div>

                    <div style="text-align:center; min-width:170px;">
                        <span style="display:inline-block; width:150px; border-bottom:1.5px solid #000000; margin-bottom:3px;"></span>
                        <div>Borrower's Signature:</div>
                        <div style="font-size:8.5px; font-weight:700;">(<strong>${loan.borrowerName}</strong>)</div>
                    </div>

                    <div style="text-align:center; min-width:170px;">
                        <span style="display:inline-block; width:150px; border-bottom:1.5px solid #000000; margin-bottom:3px;"></span>
                        <div>Bank Official's Signature:</div>
                        <div style="font-size:8.5px; font-weight:700;">(<strong>Officer / Manager</strong>)</div>
                    </div>
                </div>
            </div>

        </div>
        `;
    }

    // 2. Installment Scheme KFS (Scheme 3527 / GNA-3527)
    if (isInstallmentScheme) {
        const tenureMonths = parseInt(loan.installments || 36) || 36;
        const emiAmt = Math.round(parseFloat(loan.emiAmount || 0));
        const firstEmiDate = getFirstEmiDueDate(loan.date);
        const lastEmiDate = getMaturityDate(loan.date, tenureMonths);
        const totalPayable = emiAmt * tenureMonths;

        return `
        <div class="print-page print-voucher print-requisition-form ${pageBreakClass}" style="width:100%; box-sizing:border-box; font-family:'Outfit', 'Segoe UI', Arial, sans-serif; color:#000000; line-height:1.25; background-color:#ffffff; font-size:10px;">
            
            <!-- Bank Header with Logo on Left -->
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:2px;">
                <img src="${LOGO_SRC}" alt="JCCB Logo" loading="eager" decoding="sync" style="width:42px; height:42px; object-fit:contain;">
                <div style="flex:1; text-align:center;">
                    <h1 style="font-size:16px; font-weight:800; margin:0; color:#000000; letter-spacing:0.4px;">THE JUNAGADH COMMERCIAL CO-OPERATIVE BANK LTD.</h1>
                    <p style="font-size:9.5px; margin:2px 0 0 0; font-weight:600; color:#111111;">H.O. : “Chandrakant Malaviya Smruti Bhavan”, Choksi Bazar, Junagadh - 362001</p>
                    <p style="font-size:10.5px; margin:2px 0 0 0; font-weight:700; color:#000000;">Branch : <strong>${cleanBranch}</strong></p>
                </div>
                <div style="width:42px;"></div>
            </div>
            
            <div style="border-top:1.5px solid #000000; margin:3px 0 5px 0;"></div>

            <div style="text-align:center; margin:2px 0 5px 0;">
                <h2 style="font-size:13px; font-weight:800; margin:0; text-transform:uppercase; text-decoration:underline;">KEY FACTS STATEMENT (KFS) – SUMMARY BOX</h2>
                <div style="font-size:10px; font-weight:700; color:#000000; margin-top:2px;">(Gold Loan – Instalment / EMI Repayment)</div>
            </div>

            <!-- KFS Summary Table for 3527 Installment Scheme -->
            <table style="width:100%; border-collapse:collapse; font-size:10px; border:1.5px solid #000; margin-bottom:6px;">
                <thead>
                    <tr style="background-color:#f1f5f9; border-bottom:1.5px solid #000;">
                        <th style="border:1px solid #000; padding:3.5px 8px; width:45%; text-align:left; font-weight:800; font-size:10.5px;">Particulars</th>
                        <th style="border:1px solid #000; padding:3.5px 8px; width:55%; text-align:left; font-weight:800; font-size:10.5px;">Details</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Unique Proposal Number</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;">${loan.loanNo || "GL-" + accFormatted}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Date of KFS</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;"><strong>${formatDateDMY(loan.date)}</strong></td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Borrower Name</td>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">${loan.borrowerName || ""}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Customer ID</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;">${loan.customerNo || "N/A"}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Loan Account No.</td>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">${accFormatted}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Type of Loan</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;">Gold Loan (Instalment / EMI)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Purpose of Loan</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;">${loan.purpose || "Agriculture / Business / Personal"}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Sanctioned Loan Amount</td>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">₹ ${sanctionedAmt.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Disbursed Amount</td>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">₹ ${disbursedAmt.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Loan Tenure</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;"><strong>${tenureMonths} Months</strong></td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Annual Percentage Rate (APR)</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;"><strong>${aprRate}%</strong></td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Repayment Frequency</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;">Monthly</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">No. of Instalments (EMIs)</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;"><strong>${tenureMonths}</strong></td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">EMI Amount</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;">₹ ${emiAmt.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">First EMI Due Date</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;"><strong>${formatDateDMY(firstEmiDate)}</strong></td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Last EMI / Maturity Date</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;"><strong>${formatDateDMY(lastEmiDate)}</strong></td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Processing Charges</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;">₹ ${srvFee.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Gold Appraiser Charges</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;">₹ ${valFee.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Documentation Charges</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;">₹ ${docFee.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Other Charges (if any)</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;">₹ ${(stampFee + otherDeduct).toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Penal Charges</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;">2.00% p.a. on overdue amount for delayed period</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Security</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;">Pledge of Gold Ornaments (Packet #${loan.packetNo || ""})</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Gross Weight / Net Weight of Gold</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;">Gross: ${grossWt} g / Net: <strong>${goldWt} g</strong></td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Purity of Gold</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;">22 Karat (916)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Loan-to-Value (LTV)</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;"><strong>${ltv ? parseFloat(ltv).toFixed(2) : "75.00"}%</strong> (Max 75%)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Total Amount Payable by Borrower</td>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:800; color:#000;">₹ ${totalPayable.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700;">Prepayment / Foreclosure Charges</td>
                        <td style="border:1px solid #000; padding:3.5px 8px;">Nil</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700; font-size:9.5px; line-height:1.25;">Consequences of Default</td>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-size:9.5px; line-height:1.25;">
                            Delay in payment of EMI(s) will attract applicable penal charges. Continued default may result in enforcement of the pledge and sale/auction of the pledged gold in accordance with RBI guidelines and the loan agreement after giving the required notice.
                        </td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-weight:700; font-size:9.5px; line-height:1.25;">Grievance Redressal Officer</td>
                        <td style="border:1px solid #000; padding:3.5px 8px; font-size:9.5px; line-height:1.25;">
                            ${groDisplay}
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Borrower's Acknowledgement Section -->
            <div style="border:1.5px solid #000; padding:8px 12px; margin-top:6px; background:#fafafa;">
                <div style="text-align:center; font-size:12.5px; font-weight:800; text-transform:uppercase; margin-bottom:4px; text-decoration:underline; color:#000000; letter-spacing:0.5px;">
                    Borrower's Acknowledgement
                </div>
                <p style="text-align:justify; font-size:10px; font-weight:700; font-style:italic; line-height:1.4; margin:0 0 16px 0; color:#000000;">
                    I/We acknowledge that I/We have received the Key Facts Statement before execution of the loan agreement. I/We have understood the loan amount, interest rate, APR, EMI amount, repayment schedule, applicable charges, security, penal charges, and consequences of default.
                </p>

                <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:10px; font-weight:700; margin-top:20px;">
                    <div style="line-height:1.4;">
                        <div>Date : <strong>${formatDateDMY(loan.date)}</strong></div>
                        <div style="margin-top:2px;">Place : <strong>${cleanBranch}</strong></div>
                    </div>

                    <div style="text-align:center; min-width:180px;">
                        <span style="display:inline-block; width:160px; border-bottom:1.5px solid #000000; margin-bottom:4px;"></span>
                        <div>Borrower's Signature:</div>
                        <div style="font-size:9.5px; font-weight:700;">(<strong>${loan.borrowerName}</strong>)</div>
                    </div>

                    <div style="text-align:center; min-width:180px;">
                        <span style="display:inline-block; width:160px; border-bottom:1.5px solid #000000; margin-bottom:4px;"></span>
                        <div>Bank Official's Signature:</div>
                        <div style="font-size:9.5px; font-weight:700;">(<strong>Officer / Manager</strong>)</div>
                    </div>
                </div>
            </div>

        </div>
        `;
    }

    // 3. Bullet Repayment KFS (for GW-3725 and GD-3524)
    const maturityDate = getMaturityDate(loan.date, 12);
    const totalInterest = Math.round(sanctionedAmt * (parseFloat(interestRate) / 100));
    const totalPayable = sanctionedAmt + totalInterest;

    return `
    <div class="print-page print-voucher print-requisition-form ${pageBreakClass}" style="width:210mm; height:297mm; max-height:297mm; box-sizing:border-box; padding:0.50in 0.50in 0.50in 1.00in; font-family:'Outfit', 'Segoe UI', Arial, sans-serif; color:#000000; line-height:1.2; background-color:#ffffff; font-size:8.8px; overflow:hidden;">
        
        <!-- Bank Header with Logo on Left -->
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:2px;">
            <img src="${LOGO_SRC}" alt="JCCB Logo" loading="eager" decoding="sync" style="width:38px; height:38px; object-fit:contain;">
            <div style="flex:1; text-align:center;">
                <h1 style="font-size:15px; font-weight:800; margin:0; color:#000000; letter-spacing:0.3px;">THE JUNAGADH COMMERCIAL CO-OPERATIVE BANK LTD.</h1>
                <p style="font-size:9px; margin:1px 0 0 0; font-weight:600; color:#111111;">H.O. : “Chandrakant Malaviya Smruti Bhavan”, Choksi Bazar, Junagadh - 362001</p>
                <p style="font-size:10px; margin:1px 0 0 0; font-weight:700; color:#000000;">Branch : <strong>${cleanBranch}</strong></p>
            </div>
            <div style="width:38px;"></div>
        </div>
        
        <div style="border-top:1.5px solid #000000; margin:2px 0 4px 0;"></div>

        <div style="text-align:center; margin:1px 0 3px 0;">
            <h2 style="font-size:12.5px; font-weight:800; margin:0; text-transform:uppercase; text-decoration:underline;">KEY FACTS STATEMENT (KFS) – SUMMARY BOX</h2>
            <div style="font-size:10px; font-weight:700; color:#000000; margin-top:1px;">(Gold Loan – Bullet Repayment)</div>
        </div>

        <!-- KFS Summary Table for 3725 / 3524 Bullet Scheme -->
        <table style="width:100%; border-collapse:collapse; font-size:10px; border:1.5px solid #000; margin-bottom:5px;">
            <thead>
                <tr style="background-color:#f1f5f9; border-bottom:1.5px solid #000;">
                    <th style="border:1px solid #000; padding:3.5px 6px; width:42%; text-align:left; font-weight:800; font-size:10.5px;">Particulars</th>
                    <th style="border:1px solid #000; padding:3.5px 6px; width:58%; text-align:left; font-weight:800; font-size:10.5px;">Details</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Unique Proposal Number</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;">${loan.loanNo || "GL-" + accFormatted}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Date of KFS</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;"><strong>${formatDateDMY(loan.date)}</strong></td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Borrower Name</td>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">${loan.borrowerName || ""}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Customer ID</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;">${loan.customerNo || "N/A"}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Loan Account No.</td>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">${accFormatted}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Type of Loan</td>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Gold Loan</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Purpose of Loan</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;">${loan.purpose || "Agriculture / Business / Personal"}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Sanctioned Loan Amount</td>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">₹ ${sanctionedAmt.toLocaleString("en-IN")}/-</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Disbursed Amount</td>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">₹ ${disbursedAmt.toLocaleString("en-IN")}/-</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Tenure of Loan</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;"><strong>12 Months</strong></td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Rate of Interest</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;"><strong>${interestRate}% p.a. (Fixed / Floating)</strong></td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Annual Percentage Rate (APR)</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;"><strong>${aprRate}%</strong></td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Interest Recovery</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;">Monthly / Quarterly / At Maturity (as per sanction terms)</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Repayment Type</td>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Bullet Repayment</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700; font-size:9.5px; line-height:1.22;">Repayment Terms</td>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-size:9.5px; line-height:1.22;">The principal amount is repayable in one lump sum on or before the due date. Interest shall be paid as per the sanctioned terms.</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Due Date of Maturity</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;"><strong>${formatDateDMY(maturityDate)}</strong></td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Processing Charges</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;">₹ ${srvFee.toLocaleString("en-IN")}/-</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Appraiser Charges</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;">₹ ${valFee.toLocaleString("en-IN")}/-</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Documentation Charges</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;">₹ ${docFee.toLocaleString("en-IN")}/-</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Other Charges (if any)</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;">₹ ${(stampFee + otherDeduct).toLocaleString("en-IN")}/-</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Penal Charges (in case of default)</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;">2.00% p.a. on overdue amount for delayed period</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Security</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;">Pledge of Gold Ornaments (Packet #${loan.packetNo || ""})</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Gross Weight / Net Weight of Gold</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;">Gross: ${grossWt} g / Net: <strong>${goldWt} g</strong></td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Purity of Gold</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;">22 Karat (916)</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Loan-to-Value (LTV)</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;"><strong>${ltv ? parseFloat(ltv).toFixed(2) : "75.00"}%</strong> (Max 75%)</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Total Amount Payable at Maturity</td>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:800; color:#000;">₹ ${totalPayable.toLocaleString("en-IN")}/- <span style="font-size:8.5px; font-weight:600;">(Subject to interest accrued as per terms)</span></td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700;">Prepayment / Foreclosure Charges</td>
                    <td style="border:1px solid #000; padding:3.5px 6px;">Nil</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700; font-size:9px; line-height:1.22;">Consequences of Default</td>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-size:9px; line-height:1.22;">
                        In case of non-payment on the due date, penal charges will apply. If the default continues, the Bank may enforce the pledge and recover dues by sale/auction of the pledged gold in accordance with RBI guidelines and the loan agreement, after giving the required notice.
                    </td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-weight:700; font-size:9.5px;">Grievance Redressal Officer</td>
                    <td style="border:1px solid #000; padding:3.5px 6px; font-size:9.5px;">${groDisplay}</td>
                </tr>
            </tbody>
        </table>

        <!-- Borrower's Acknowledgement Section -->
        <div style="border:1.5px solid #000; padding:6px 12px; margin-top:4px; background:#fafafa;">
            <div style="text-align:center; font-size:12px; font-weight:800; text-transform:uppercase; margin-bottom:3px; text-decoration:underline; color:#000000; letter-spacing:0.5px;">
                Borrower's Acknowledgement
            </div>
            <p style="text-align:justify; font-size:9.5px; font-weight:700; font-style:italic; line-height:1.32; margin:0 0 12px 0; color:#000000;">
                I/We acknowledge that I/We have received and understood this Key Facts Statement before execution of the loan documents. The loan amount, interest rate, applicable charges, bullet repayment terms, security, and consequences of default have been explained to me/us.
            </p>

            <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:9.5px; font-weight:700; margin-top:16px;">
                <div style="line-height:1.35;">
                    <div>Date: <strong>${formatDateDMY(loan.date)}</strong></div>
                    <div style="margin-top:2px;">Place: <strong>${cleanBranch}</strong></div>
                </div>

                <div style="text-align:center; min-width:170px;">
                    <span style="display:inline-block; width:150px; border-bottom:1.5px solid #000000; margin-bottom:3px;"></span>
                    <div>Borrower's Signature:</div>
                    <div style="font-size:9px; font-weight:700;">(<strong>${loan.borrowerName}</strong>)</div>
                </div>

                <div style="text-align:center; min-width:170px;">
                    <span style="display:inline-block; width:150px; border-bottom:1.5px solid #000000; margin-bottom:3px;"></span>
                    <div>Bank Official's Signature:</div>
                    <div style="font-size:9px; font-weight:700;">(<strong>Officer / Manager</strong>)</div>
                </div>
            </div>
        </div>

    </div>
    `;
}

// --- Page 5: સભાસદ અરજી (ગ્રુપ-A) (When Share Group A > 0) ---
function generatePage5MembershipGroupAHTML(loan, isPageBreak = false) {
    const pageBreakClass = isPageBreak ? "print-page-break" : "";
    const cleanBranch = getCleanBranchName(loan.branchName);
    const photoSrc = loan.customerPhoto || loan.photo || "";
    const todayFormatted = formatDateDMY(loan.date || getTodayDateYMD());
    const borrowerName = loan.borrowerName || "";
    const customerNo = loan.customerNo || "N/A";
    const memberNo = loan.memberNo || "";
    const age = loan.age ? loan.age + " વર્ષ" : "-";
    const dob = loan.dob ? formatDateDMY(loan.dob) : "-";
    const address = loan.address || "-";
    const occupation = loan.occupation || "-";
    const religion = loan.religion || "-";
    const caste = loan.caste || "-";
    const mobile = loan.mobile || "-";
    const nomineeName = loan.nomineeName || "-";
    const nomineeRelation = loan.nomineeRelation || "-";
    const shareA = parseFloat(loan.shareA || 500);
    const memberFee = parseFloat(loan.memberFee || 25);
    const totalShareFee = shareA + memberFee;
    const savingsAc = loan.savingsAc || "";
    const loanAccFormatted = formatLoanAccountNo(loan.accountNo, loan.branchCode, loan.loanType);

    return `
    <div class="print-page print-voucher print-requisition-form ${pageBreakClass}" style="width:210mm; height:297mm; max-height:297mm; box-sizing:border-box; padding:0.50in 0.50in 0.50in 1.00in; font-family:'Outfit', 'Noto Sans Gujarati', Arial, sans-serif; color:#000000; line-height:1.32; background-color:#ffffff; font-size:10px; overflow:hidden;">
        
        <!-- Bank Header with Logo on Left -->
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:3px;">
            <img src="${LOGO_SRC}" alt="JCCB Logo" loading="eager" decoding="sync" style="width:46px; height:46px; object-fit:contain;">
            <div style="flex:1; text-align:center;">
                <h1 style="font-size:17.5px; font-weight:800; margin:0; color:#000000; letter-spacing:0.4px;">ધી જૂનાગઢ  કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ.</h1>
                <p style="font-size:10px; margin:1px 0 0 0; font-weight:700; color:#111111;">હે.ઓ. : “ચંદ્રકાંત માલવિયા સ્મૃતિ ભવન”, ચોકસી બજાર, જૂનાગઢ - ૩૬૨૦૦૧</p>
                <p style="font-size:11.5px; margin:2px 0 0 0; font-weight:700; color:#000000;">શાખા : <strong>${cleanBranch}</strong></p>
            </div>
            <div style="width:46px;"></div>
        </div>
        
        <div style="border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; height:3px; margin:3px 0 6px 0;"></div>

        <!-- Application Title -->
        <div style="text-align:center; margin:3px 0 6px 0;">
            <h2 style="font-size:14.5px; font-weight:800; margin:0; text-transform:uppercase; text-decoration:underline; letter-spacing:0.5px;">સભાસદ અરજી (ગ્રુપ-A)</h2>
        </div>

        <!-- Recipient and Photo Box -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
            <div style="font-size:11px; line-height:1.42;">
                પ્રતિ,<br>
                <strong>ચેરમેનશ્રી,</strong><br>
                <strong>ધી જૂનાગઢ કોમર્શિયલ કો-ઓપરેટિવ બેન્ક લિ.</strong><br>
                શાખા : <strong>${cleanBranch}</strong><br>
                કસ્ટમર આઇ.ડી. : <strong>${customerNo}</strong>
            </div>

            <!-- Customer Photo Box -->
            <div style="width:78px; height:92px; border:1.5px solid #000000; border-radius:4px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:2px; box-sizing:border-box; background:#fafafa; flex-shrink:0;">
                ${photoSrc ? `<img src="${photoSrc}" alt="Customer Photo" loading="eager" decoding="sync" style="width:100%; height:100%; object-fit:cover; border-radius:2px;">` : `<div style="font-size:9px; font-weight:700; color:#333; line-height:1.25;">અરજદારનો<br>પાસપોર્ટ સાઇઝનો<br>ફોટો</div>`}
            </div>
        </div>

        <!-- Intro Paragraphs -->
        <p style="text-align:justify; margin:0 0 4px 0; line-height:1.4; font-size:10.5px;">
            જય ભારત સાથ અમો આપની બેન્કનાં દરેક રૂ. ૧૦૦/- અંકે રૂપિયા એકસો પૂરાની કિંમતના શેર નંગ ૫ લેવા ઇચ્છીએ છીએ તો અમોને સભ્ય તરીકે દાખલ કરવાં વિનંતી કરું છું. બેન્કનાં હાલનાં અમલી પેટા નિયમો તથા ભવિષ્યમાં તેમાં જે સુધારા-વધારા થાય તેને આધીન રહેવા અમો કબૂલાત આપીએ છીએ.
        </p>
        <p style="text-align:justify; margin:0 0 6px 0; line-height:1.4; font-size:10.5px;">
            સરકારી કાનૂન ૨૧ તથા બેન્કનાં કાયદા ૧૬ અન્વયે હું નીચે પ્રમાણે મારાં વારસદારનાં નામની રજૂઆત કરું છું તો તે દાખલ કરવાં વિનંતી છે.
        </p>

        <!-- 10-Point Details Table -->
        <table style="width:100%; border-collapse:collapse; font-size:10.5px; border:1.5px solid #000; margin-bottom:6px;">
            <tbody>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; width:5%; text-align:center; font-weight:700;">૧</td>
                    <td style="border:1px solid #000; padding:3px 8px; width:35%; font-weight:700;">વ્યક્તિ / પેઢી / સંસ્થાનું પૂરું નામ</td>
                    <td style="border:1px solid #000; padding:3px 8px; width:60%; font-weight:700;">${borrowerName}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૨</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">ઉંમર વર્ષ</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${age}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૩</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">જન્મ તારીખ</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${dob}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૪</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">સરનામું</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${address}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૫</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">ધંધો / વ્યવસાય</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${occupation}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૬</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">ધર્મ</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${religion}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૭</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">જ્ઞાતિ</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${caste}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૮</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">ટેલિફોન / મોબાઇલ નંબર</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${mobile}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૯</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">વારસદારનું નામ</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">${nomineeName}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૧૦</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">વારસદારનો સંબંધ</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${nomineeRelation}</td>
                </tr>
            </tbody>
        </table>

        <!-- Share Amount Payment Text -->
        <p style="text-align:justify; margin:4px 0 6px 0; line-height:1.4; font-size:10.5px;">
            અમો આ સાથે કુલ શેર ૫ ના રૂ. ${shareA.toFixed(0)}/- તથા પ્રવેશ ફીના રૂ. ${memberFee.toFixed(0)}/- મળીને કુલ રૂ. ${totalShareFee.toFixed(0)}/- અંકે રૂપિયા પાંચસો પચીસ પૂરા રોકડા / ચેકથી જમા કરાવીએ છીએ.
        </p>

        <!-- Date and Applicant Signature (Spacious Signature Block) -->
        <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:10.5px; margin:8px 0 10px 0;">
            <div style="font-weight:700;">
                તારીખ : <strong>${todayFormatted}</strong>
            </div>
            <div style="text-align:center; min-width:200px;">
                <div style="font-weight:800; font-size:11px;">આપનો વિશ્વાસુ,</div>
                <div style="margin-top:38px; border-bottom:1.5px solid #000; width:180px; display:inline-block; margin-bottom:3px;"></div>
                <div style="font-weight:800; font-size:10.5px;">( <strong>${borrowerName}</strong> )</div>
            </div>
        </div>

        <!-- Specimen Signature Table (Enlarged Height for Signature) -->
        <table style="width:100%; border-collapse:collapse; font-size:10.5px; border:1.5px solid #000; margin-bottom:6px;">
            <thead>
                <tr style="background-color:#f1f5f9; border-bottom:1.5px solid #000;">
                    <th style="border:1px solid #000; padding:3px 8px; width:8%; text-align:center; font-weight:800;">ક્રમ</th>
                    <th style="border:1px solid #000; padding:3px 8px; width:45%; text-align:left; font-weight:800;">વ્યક્તિ / માલિક / ભાગીદારનું આખું નામ</th>
                    <th style="border:1px solid #000; padding:3px 8px; width:47%; text-align:center; font-weight:800;">સહીનો નમૂનો</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700; height:60px;">૧</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">${borrowerName}</td>
                    <td style="border:1px solid #000; padding:3px 8px;"></td>
                </tr>
            </tbody>
        </table>

        <!-- Endorsement Banner (શેરો) -->
        <div style="display:flex; align-items:center; width:100%; margin:10px 0 6px 0;">
            <div style="flex:1; border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; height:3.5px;"></div>
            <div style="padding:0 14px; font-weight:900; font-size:13.5px; letter-spacing:1px; white-space:nowrap; color:#000000;">
                શેરો
            </div>
            <div style="flex:1; border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; height:3.5px;"></div>
        </div>

        <p style="text-align:justify; margin:4px 0 6px 0; line-height:1.38; font-size:10px;">
            સદરહુ અરજદારને બેન્કના સભાસદ તરીકે તા. __________________ ના રોજ મળેલ બેન્કની મળેલ એક્ઝિક્યુટિવ કમિટી / બોર્ડ ઓફ ડિરેક્ટર્સની બેઠકના ઠરાવ નં. ____________ થી દાખલ કરી શેર ફાળવી આપવાનું સર્વાનુમતે ઠરાવવામાં આવેલ છે.
        </p>

        <!-- Office Details 6 Fields -->
        <table style="width:100%; border-collapse:collapse; font-size:10px; border:1px solid #000; margin-bottom:6px;">
            <tbody>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; width:50%;">૧. તારીખ : <strong>${todayFormatted}</strong></td>
                    <td style="border:1px solid #000; padding:3px 8px; width:50%;">૨. પહોંચ નંબર : __________________</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px;">૩. રૂપિયા : <strong>₹ ${totalShareFee.toFixed(0)}/-</strong></td>
                    <td style="border:1px solid #000; padding:3px 8px;">૪. થાપણ ખાતા પ્રકાર અને નંબર : <strong>${savingsAc ? "બચત નં. " + savingsAc : "બચત નં. ____________"}</strong></td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px;">૫. સભાસદ નંબર : <strong>${memberNo ? memberNo : "__________________"}</strong></td>
                    <td style="border:1px solid #000; padding:3px 8px;">૬. ધિરાણ ખાતા પ્રકાર અને નંબર : <strong>${loanAccFormatted}</strong></td>
                </tr>
            </tbody>
        </table>

        <!-- Manager Signature (Spacious Signature & Stamp Area) -->
        <div style="display:flex; justify-content:flex-end; font-size:11px; margin:8px 0 6px 0;">
            <div style="text-align:center; min-width:180px;">
                <div style="height:48px;"></div>
                <div style="border-bottom:1.5px solid #000; width:160px; display:inline-block; margin-bottom:4px;"></div>
                <div style="font-weight:800; font-size:11.5px;">મેનેજર</div>
            </div>
        </div>

        <!-- Footer Note -->
        <div style="text-align:center; font-weight:800; font-size:10px; margin-top:2px; color:#000;">
            નોંધ : સભાસદ અરજી સાથે વ્યક્તિ / ભાગીદારોના ફોટા જોડવાં.
        </div>

    </div>
    `;
}

// --- Page 5: સભાસદ અરજી (ગ્રુપ-B) (When Share Group B > 0) ---
function generatePage5MembershipGroupBHTML(loan, isPageBreak = false) {
    const pageBreakClass = isPageBreak ? "print-page-break" : "";
    const cleanBranch = getCleanBranchName(loan.branchName);
    const photoSrc = loan.customerPhoto || loan.photo || "";
    const todayFormatted = formatDateDMY(loan.date || getTodayDateYMD());
    const borrowerName = loan.borrowerName || "";
    const customerNo = loan.customerNo || "N/A";
    const memberNo = loan.memberNo || "";
    const age = loan.age ? loan.age + " વર્ષ" : "-";
    const dob = loan.dob ? formatDateDMY(loan.dob) : "-";
    const address = loan.address || "-";
    const occupation = loan.occupation || "-";
    const religion = loan.religion || "-";
    const caste = loan.caste || "-";
    const mobile = loan.mobile || "-";
    const nomineeName = loan.nomineeName || "-";
    const nomineeRelation = loan.nomineeRelation || "-";
    const shareB = parseFloat(loan.shareB || 50);
    const savingsAc = loan.savingsAc || "";
    const loanAccFormatted = formatLoanAccountNo(loan.accountNo, loan.branchCode, loan.loanType);

    return `
    <div class="print-page print-voucher print-requisition-form ${pageBreakClass}" style="width:210mm; height:297mm; max-height:297mm; box-sizing:border-box; padding:0.50in 0.50in 0.50in 1.00in; font-family:'Outfit', 'Noto Sans Gujarati', Arial, sans-serif; color:#000000; line-height:1.32; background-color:#ffffff; font-size:10px; overflow:hidden;">
        
        <!-- Bank Header with Logo on Left -->
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:3px;">
            <img src="${LOGO_SRC}" alt="JCCB Logo" loading="eager" decoding="sync" style="width:46px; height:46px; object-fit:contain;">
            <div style="flex:1; text-align:center;">
                <h1 style="font-size:17.5px; font-weight:800; margin:0; color:#000000; letter-spacing:0.4px;">ધી જૂનાગઢ  કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ.</h1>
                <p style="font-size:10px; margin:1px 0 0 0; font-weight:700; color:#111111;">હે.ઓ. : “ચંદ્રકાંત માલવિયા સ્મૃતિ ભવન”, ચોકસી બજાર, જૂનાગઢ - ૩૬૨૦૦૧</p>
                <p style="font-size:11.5px; margin:2px 0 0 0; font-weight:700; color:#000000;">શાખા : <strong>${cleanBranch}</strong></p>
            </div>
            <div style="width:46px;"></div>
        </div>
        
        <div style="border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; height:3px; margin:3px 0 6px 0;"></div>

        <!-- Application Title -->
        <div style="text-align:center; margin:3px 0 6px 0;">
            <h2 style="font-size:14.5px; font-weight:800; margin:0; text-transform:uppercase; text-decoration:underline; letter-spacing:0.5px;">સભાસદ અરજી (ગ્રુપ-B)</h2>
        </div>

        <!-- Recipient and Photo Box -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
            <div style="font-size:11px; line-height:1.42;">
                પ્રતિ,<br>
                <strong>ચેરમેનશ્રી,</strong><br>
                <strong>ધી જૂનાગઢ કોમર્શિયલ કો-ઓપરેટિવ બેન્ક લિ.</strong><br>
                શાખા : <strong>${cleanBranch}</strong><br>
                કસ્ટમર આઇ.ડી. : <strong>${customerNo}</strong>
            </div>

            <!-- Customer Photo Box -->
            <div style="width:78px; height:92px; border:1.5px solid #000000; border-radius:4px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:2px; box-sizing:border-box; background:#fafafa; flex-shrink:0;">
                ${photoSrc ? `<img src="${photoSrc}" alt="Customer Photo" loading="eager" decoding="sync" style="width:100%; height:100%; object-fit:cover; border-radius:2px;">` : `<div style="font-size:9px; font-weight:700; color:#333; line-height:1.25;">અરજદારનો<br>પાસપોર્ટ સાઇઝનો<br>ફોટો</div>`}
            </div>
        </div>

        <!-- Intro Paragraphs -->
        <p style="text-align:justify; margin:0 0 4px 0; line-height:1.4; font-size:10.5px;">
            જય ભારત સાથ અમો આપની બેન્કનાં દરેક રૂ. ૫૦/- અંકે રૂપિયા પચાસ પૂરાની કિંમતના શેર નંગ ૧ (એક) લેવા ઇચ્છીએ છીએ તો અમોને સભ્ય તરીકે દાખલ કરવાં વિનંતી કરું છું. બેન્કનાં હાલનાં અમલી પેટા નિયમો તથા ભવિષ્યમાં તેમાં જે સુધારા-વધારા થાય તેને આધીન રહેવા અમો કબૂલાત આપીએ છીએ.
        </p>
        <p style="text-align:justify; margin:0 0 6px 0; line-height:1.4; font-size:10.5px;">
            સરકારી કાનૂન ૨૧ તથા બેન્કનાં કાયદા ૧૬ અન્વયે હું નીચે પ્રમાણે મારાં વારસદારનાં નામની રજૂઆત કરું છું તો તે દાખલ કરવાં વિનંતી છે.
        </p>

        <!-- 10-Point Details Table -->
        <table style="width:100%; border-collapse:collapse; font-size:10.5px; border:1.5px solid #000; margin-bottom:6px;">
            <tbody>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; width:5%; text-align:center; font-weight:700;">૧</td>
                    <td style="border:1px solid #000; padding:3px 8px; width:35%; font-weight:700;">વ્યક્તિ / પેઢી / સંસ્થાનું પૂરું નામ</td>
                    <td style="border:1px solid #000; padding:3px 8px; width:60%; font-weight:700;">${borrowerName}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૨</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">ઉંમર વર્ષ</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${age}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૩</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">જન્મ તારીખ</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${dob}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૪</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">સરનામું</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${address}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૫</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">ધંધો / વ્યવસાય</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${occupation}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૬</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">ધર્મ</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${religion}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૭</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">જ્ઞાતિ</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${caste}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૮</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">ટેલિફોન / મોબાઇલ નંબર</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${mobile}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૯</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">વારસદારનું નામ</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">${nomineeName}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700;">૧૦</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">વારસદારનો સંબંધ</td>
                    <td style="border:1px solid #000; padding:3px 8px;">${nomineeRelation}</td>
                </tr>
            </tbody>
        </table>

        <!-- Share Amount Payment Text -->
        <p style="text-align:justify; margin:4px 0 6px 0; line-height:1.4; font-size:10.5px;">
            અમો આ સાથે કુલ શેર ૧ ના રૂ. ${shareB.toFixed(0)}/- અંકે રૂપિયા પચાસ પૂરા રોકડા / ચેકથી જમા કરાવીએ છીએ.
        </p>

        <!-- Date and Applicant Signature (Spacious Signature Block) -->
        <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:10.5px; margin:8px 0 10px 0;">
            <div style="font-weight:700;">
                તારીખ : <strong>${todayFormatted}</strong>
            </div>
            <div style="text-align:center; min-width:200px;">
                <div style="font-weight:800; font-size:11px;">આપનો વિશ્વાસુ,</div>
                <div style="margin-top:38px; border-bottom:1.5px solid #000; width:180px; display:inline-block; margin-bottom:3px;"></div>
                <div style="font-weight:800; font-size:10.5px;">( <strong>${borrowerName}</strong> )</div>
            </div>
        </div>

        <!-- Specimen Signature Table (Enlarged Height for Signature) -->
        <table style="width:100%; border-collapse:collapse; font-size:10.5px; border:1.5px solid #000; margin-bottom:6px;">
            <thead>
                <tr style="background-color:#f1f5f9; border-bottom:1.5px solid #000;">
                    <th style="border:1px solid #000; padding:3px 8px; width:8%; text-align:center; font-weight:800;">ક્રમ</th>
                    <th style="border:1px solid #000; padding:3px 8px; width:45%; text-align:left; font-weight:800;">વ્યક્તિ / માલિક / ભાગીદારનું આખું નામ</th>
                    <th style="border:1px solid #000; padding:3px 8px; width:47%; text-align:center; font-weight:800;">સહીનો નમૂનો</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; text-align:center; font-weight:700; height:60px;">૧</td>
                    <td style="border:1px solid #000; padding:3px 8px; font-weight:700;">${borrowerName}</td>
                    <td style="border:1px solid #000; padding:3px 8px;"></td>
                </tr>
            </tbody>
        </table>

        <!-- Endorsement Banner (શેરો) -->
        <div style="display:flex; align-items:center; width:100%; margin:10px 0 6px 0;">
            <div style="flex:1; border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; height:3.5px;"></div>
            <div style="padding:0 14px; font-weight:900; font-size:13.5px; letter-spacing:1px; white-space:nowrap; color:#000000;">
                શેરો
            </div>
            <div style="flex:1; border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; height:3.5px;"></div>
        </div>

        <p style="text-align:justify; margin:4px 0 6px 0; line-height:1.38; font-size:10px;">
            સદરહુ અરજદારને બેન્કના સભાસદ તરીકે તા. __________________ ના રોજ મળેલ બેન્કની મળેલ એક્ઝિક્યુટિવ કમિટી / બોર્ડ ઓફ ડિરેક્ટર્સની બેઠકના ઠરાવ નં. ____________ થી દાખલ કરી શેર ફાળવી આપવાનું સર્વાનુમતે ઠરાવવામાં આવેલ છે.
        </p>

        <!-- Office Details 6 Fields -->
        <table style="width:100%; border-collapse:collapse; font-size:10px; border:1px solid #000; margin-bottom:6px;">
            <tbody>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px; width:50%;">૧. તારીખ : <strong>${todayFormatted}</strong></td>
                    <td style="border:1px solid #000; padding:3px 8px; width:50%;">૨. પહોંચ નંબર : __________________</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px;">૩. રૂપિયા : <strong>₹ ${shareB.toFixed(0)}/-</strong></td>
                    <td style="border:1px solid #000; padding:3px 8px;">૪. થાપણ ખાતા પ્રકાર અને નંબર : <strong>${savingsAc ? "બચત નં. " + savingsAc : "બચત નં. ____________"}</strong></td>
                </tr>
                <tr>
                    <td style="border:1px solid #000; padding:3px 8px;">૫. સભાસદ નંબર : <strong>${memberNo ? memberNo : "__________________"}</strong></td>
                    <td style="border:1px solid #000; padding:3px 8px;">૬. ધિરાણ ખાતા પ્રકાર અને નંબર : <strong>${loanAccFormatted}</strong></td>
                </tr>
            </tbody>
        </table>

        <!-- Manager Signature (Spacious Signature & Stamp Area) -->
        <div style="display:flex; justify-content:flex-end; font-size:11px; margin:8px 0 6px 0;">
            <div style="text-align:center; min-width:180px;">
                <div style="height:48px;"></div>
                <div style="border-bottom:1.5px solid #000; width:160px; display:inline-block; margin-bottom:4px;"></div>
                <div style="font-weight:800; font-size:11.5px;">મેનેજર</div>
            </div>
        </div>

        <!-- Footer Note -->
        <div style="text-align:center; font-weight:800; font-size:10px; margin-top:2px; color:#000;">
            નોંધ : સભાસદ અરજી સાથે વ્યક્તિ / ભાગીદારોના ફોટા જોડવાં.
        </div>

    </div>
    `;
}

// ==================== EXPENSE CASH CREDIT VOUCHERS SYSTEM ====================

function getLoanExpenseVouchersList(loan) {
    const vouchers = [];
    const accFormatted = formatLoanAccountNo(loan.accountNo, loan.branchCode, loan.loanType);
    const borrowerName = loan.borrowerName || "";
    const valuerName = loan.valuerName || "Approved Valuer";

    // 1. Share Group A
    const shareA = parseFloat(loan.shareA || 0);
    if (shareA > 0) {
        vouchers.push({
            glCode: "GL-150040",
            glName: "Share Application Money (Group-A)",
            amount: shareA,
            narration: `આજ રોજ સોના ધિરાણના ખુલેલ ખાતાના શેર ગ્રુપ-A ની રકમના રોકડા જમા લેતા (ખાતા નં. ${accFormatted} - ${borrowerName})`
        });
    }

    // 2. Share Group B
    const shareB = parseFloat(loan.shareB || 0);
    if (shareB > 0) {
        vouchers.push({
            glCode: "GL-150058",
            glName: "Share Application Money (Group-B)",
            amount: shareB,
            narration: `આજ રોજ સોના ધિરાણના ખુલેલ ખાતાના શેર ગ્રુપ-B ની રકમના રોકડા જમા લેતા (ખાતા નં. ${accFormatted} - ${borrowerName})`
        });
    }

    // 3. Member Fee
    const memberFee = parseFloat(loan.memberFee || 0);
    if (memberFee > 0) {
        vouchers.push({
            glCode: "GL-160067",
            glName: "Member Fee",
            amount: memberFee,
            narration: `આજ રોજ સોના ધિરાણના ખુલેલ ખાતાના સભાસદ પ્રવેશ ફી ની રકમના રોકડા જમા લેતા (ખાતા નં. ${accFormatted} - ${borrowerName})`
        });
    }

    // 4. Stamp Duty
    const stampDuty = parseFloat(loan.stampDuty || 0);
    if (stampDuty > 0) {
        vouchers.push({
            glCode: "GL-370065",
            glName: "Adhesive Stamp Advance",
            amount: stampDuty,
            narration: `આજ રોજ સોના ધિરાણના ખુલેલ ખાતાના સ્ટેમ્પ ડ્યુટી ની રકમના રોકડા જમા લેતા (ખાતા નં. ${accFormatted} - ${borrowerName})`
        });
    }

    // 5. Service Charge
    const serviceCharge = parseFloat(loan.serviceCharge || 0);
    if (serviceCharge > 0) {
        vouchers.push({
            glCode: "GL-160063",
            glName: "Service Charge Income",
            amount: serviceCharge,
            narration: `આજ રોજ સોના ધિરાણના ખુલેલ ખાતાના સર્વિસ ચાર્જ ની રકમના રોકડા જમા લેતા (ખાતા નં. ${accFormatted} - ${borrowerName})`
        });
    }

    // 6. Doc Charges
    const docCharges = parseFloat(loan.docCharges || 0);
    if (docCharges > 0) {
        vouchers.push({
            glCode: "GL-160181",
            glName: "Document Charge Income",
            amount: docCharges,
            narration: `આજ રોજ સોના ધિરાણના ખુલેલ ખાતાના ડોક્યુમેન્ટ ચાર્જ ની રકમના રોકડા જમા લેતા (ખાતા નં. ${accFormatted} - ${borrowerName})`
        });
    }

    // 7. Insurance
    const insurance = parseFloat(loan.insurance || 0);
    if (insurance > 0) {
        vouchers.push({
            glCode: "GL-150050",
            glName: "Insurance Deposits",
            amount: insurance,
            narration: `આજ રોજ સોના ધિરાણના ખુલેલ ખાતાના ઇન્સ્યોરન્સ ડિપોઝીટ ની રકમના રોકડા જમા લેતા (ખાતા નં. ${accFormatted} - ${borrowerName})`
        });
    }

    // 8. SGST (9%)
    const sgst = parseFloat(loan.sgst || 0);
    if (sgst > 0) {
        vouchers.push({
            glCode: "GL-370260",
            glName: "SGST Payable",
            amount: sgst,
            narration: `આજ રોજ સોના ધિરાણના ખુલેલ ખાતાઓના એસ જી એસ ટી ની રકમના રોકડા જમા લેતા (ખાતા નં. ${accFormatted} - ${borrowerName})`
        });
    }

    // 9. CGST (9%)
    const cgst = parseFloat(loan.cgst || 0);
    if (cgst > 0) {
        vouchers.push({
            glCode: "GL-370261",
            glName: "CGST Payable",
            amount: cgst,
            narration: `આજ રોજ સોના ધિરાણના ખુલેલ ખાતાઓના સી જી એસ ટી ની રકમના રોકડા જમા લેતા (ખાતા નં. ${accFormatted} - ${borrowerName})`
        });
    }

    // 10. Valuer Fee (Valuer Account)
    const valuerFee = parseFloat(loan.valuerFee || 0);
    if (valuerFee > 0) {
        const valObj = (state.valuers || []).find(v => v.name && v.name.trim().toLowerCase() === valuerName.trim().toLowerCase());
        const valAc = (valObj && valObj.savingsAc) ? `A/C: ${valObj.savingsAc}` : "VALUER A/C";
        vouchers.push({
            glCode: valAc,
            glName: valuerName,
            amount: valuerFee,
            narration: `આજ રોજ સોના ધિરાણના ખુલેલ ખાતાના સોનાના દાગીના વેલ્યુએશન ફી પેટે જમા (ખાતા નં. ${accFormatted} - ${borrowerName})`
        });
    }

    // 11. Other Charges (if any)
    const otherCharges = parseFloat(loan.otherCharges || 0);
    if (otherCharges > 0) {
        vouchers.push({
            glCode: "GL-160199",
            glName: "Other Charges Income",
            amount: otherCharges,
            narration: `આજ રોજ સોના ધિરાણના ખુલેલ ખાતાના અન્ય ચાર્જ પેટે જમા (ખાતા નં. ${accFormatted} - ${borrowerName})`
        });
    }

    // 12. Custom Charges (if defined in loan)
    if (Array.isArray(loan.customCharges)) {
        loan.customCharges.forEach(cc => {
            const ccAmt = parseFloat(cc.amount || 0);
            if (ccAmt > 0) {
                vouchers.push({
                    glCode: cc.glCode || "GL-OTHER",
                    glName: cc.nameGu || cc.name || "Custom Charge",
                    amount: ccAmt,
                    narration: `આજ રોજ સોના ધિરાણના ખુલેલ ખાતાના ${cc.nameGu || cc.name} પેટે જમા (ખાતા નં. ${accFormatted} - ${borrowerName})`
                });
            }
        });
    }

    return vouchers;
}

function formatAmountToGujaratiWords(num) {
    const val = parseFloat(num || 0);
    if (isNaN(val) || val <= 0) return "શૂન્ય";
    const rupees = Math.floor(val);
    const paise = Math.round((val - rupees) * 100);

    let words = numberToGujaratiWords(rupees).replace(/\s+/g, " ").trim();
    if (paise > 0) {
        words += " રૂપિયા અને " + numberToGujaratiWords(paise).replace(/\s+/g, " ").trim() + " પૈસા";
    }
    return words;
}

// --- Daily Aggregated Cash Credit Expense Vouchers (3 Vouchers per A4 Page) ---
function generateDailyVouchers3in1HTML(date, branchFilter = "") {
    const data = getDailyAggregatedVouchersData(date, branchFilter);
    if (data.vouchers.length === 0) {
        return `
        <div class="print-page" style="padding:50px 20px; text-align:center; font-family:'Outfit', 'Noto Sans Gujarati', sans-serif; font-size:15px; font-weight:700; background:#ffffff;">
            તારીખ ${formatDateDMY(date)} ના રોજ કોઈ ખર્ચ વાઉચર નોંધાયેલ નથી.
        </div>
        `;
    }

    const cleanBranch = getCleanBranchName(data.branchName);
    const dateFormatted = formatDateDMY(date);

    // Group vouchers in sets of 3 per A4 sheet
    const pages = [];
    for (let i = 0; i < data.vouchers.length; i += 3) {
        pages.push(data.vouchers.slice(i, i + 3));
    }

    let fullHtml = "";

    pages.forEach((pageVouchers, pIdx) => {
        const pageBreakClass = pIdx > 0 ? "print-page-break" : "";
        
        let vouchersHtml = "";
        pageVouchers.forEach((v, vIdx) => {
            const amountFormatted = parseFloat(v.amount).toFixed(2);
            const amountInWords = formatAmountToGujaratiWords(v.amount);
            const showCutLine = (vIdx < pageVouchers.length - 1);

            vouchersHtml += `
            <div class="voucher-card" style="box-sizing:border-box; padding:2mm 0; font-family:'Outfit', 'Noto Sans Gujarati', Arial, sans-serif; color:#000000; line-height:1.2; background:#ffffff;">
                
                <!-- Top Center Pill & Branch -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                    <div style="width:20%;"></div>
                    <div style="text-align:center;">
                        <span style="display:inline-block; border:1.5px solid #000000; border-radius:14px; padding:1.5px 22px; font-size:11.5px; font-weight:800; letter-spacing:0.6px; background:#f1f5f9; text-transform:uppercase;">
                            CASH CREDIT VOUCHER
                        </span>
                    </div>
                    <div style="width:28%; text-align:right; font-size:11px; font-weight:800; white-space:nowrap;">
                        શાખા : <strong style="font-weight:900;">${cleanBranch}</strong>
                    </div>
                </div>

                <!-- Bank Name & Logo Rounded Box with Date (Left Logo & Right Date) -->
                <div style="border:1.5px solid #000000; border-radius:8px; padding:3px 8px; background:#f1f5f9; display:flex; align-items:center; justify-content:space-between; margin-bottom:3px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${LOGO_SRC}" alt="JCCB" loading="eager" decoding="sync" style="width:42px; height:42px; object-fit:contain; flex-shrink:0;">
                        <div style="font-size:14px; font-weight:800; letter-spacing:0.2px; color:#000000;">
                            The Junagadh Commercial Co-Ope. Bank Ltd.
                        </div>
                    </div>
                    <div style="border:1.5px solid #000000; border-radius:4px; padding:2.5px 10px; font-size:11px; font-weight:800; background:#ffffff; white-space:nowrap;">
                        ${dateFormatted}
                    </div>
                </div>

                <!-- GL Row -->
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:3px; font-size:11px;">
                    <div style="border:1.5px solid #000000; border-radius:12px; padding:2px 14px; font-weight:900; background:#ffffff; text-transform:uppercase; letter-spacing:0.5px;">
                        CREDIT
                    </div>
                    <div style="border:1.5px solid #000000; border-radius:6px; padding:2px 10px; font-weight:800; background:#ffffff; white-space:nowrap;">
                        ${v.glCode}
                    </div>
                    <div style="border:1.5px solid #000000; border-radius:6px; padding:2px 12px; font-weight:800; background:#ffffff; flex:1;">
                        ${v.glName}
                    </div>
                </div>

                <!-- Ledger Table (8 Lines Total: 1 Narration + 6 Empty Ledger Lines + 1 Total Row) -->
                <table style="width:100%; border-collapse:collapse; border:1.5px solid #000000; margin-bottom:2px; background:#ffffff; font-size:10px;">
                    <thead>
                        <tr style="border-bottom:1.5px solid #000000; background:#ffffff;">
                            <th style="border-right:1.5px solid #000000; padding:2px 6px; width:80%; text-align:center; font-weight:800; font-size:10.5px;">વિગત</th>
                            <th style="padding:2px 6px; width:20%; text-align:center; font-weight:800; font-size:10.5px;">રૂ.પૈસા</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border-right:1.5px solid #000000; border-bottom:1px solid #000000; padding:2.5px 6px; font-size:10px; font-weight:700; text-align:left; line-height:1.25;">
                                ${v.narration}
                            </td>
                            <td style="border-bottom:1px solid #000000; padding:2.5px 8px; font-size:11.5px; font-weight:800; text-align:right; white-space:nowrap;">
                                ${amountFormatted}
                            </td>
                        </tr>
                        <tr style="height:9px;"><td style="border-right:1.5px solid #000000; border-bottom:1px solid #000000;">&nbsp;</td><td style="border-bottom:1px solid #000000;">&nbsp;</td></tr>
                        <tr style="height:9px;"><td style="border-right:1.5px solid #000000; border-bottom:1px solid #000000;">&nbsp;</td><td style="border-bottom:1px solid #000000;">&nbsp;</td></tr>
                        <tr style="height:9px;"><td style="border-right:1.5px solid #000000; border-bottom:1px solid #000000;">&nbsp;</td><td style="border-bottom:1px solid #000000;">&nbsp;</td></tr>
                        <tr style="height:9px;"><td style="border-right:1.5px solid #000000; border-bottom:1px solid #000000;">&nbsp;</td><td style="border-bottom:1px solid #000000;">&nbsp;</td></tr>
                        <tr style="height:9px;"><td style="border-right:1.5px solid #000000; border-bottom:1px solid #000000;">&nbsp;</td><td style="border-bottom:1px solid #000000;">&nbsp;</td></tr>
                        <tr style="height:9px;"><td style="border-right:1.5px solid #000000; border-bottom:1px solid #000000;">&nbsp;</td><td style="border-bottom:1px solid #000000;">&nbsp;</td></tr>
                        <tr style="border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; font-weight:900; background:#fafafa;">
                            <td style="border-right:1.5px solid #000000; height:14px;">&nbsp;</td>
                            <td style="text-align:right; padding:2px 8px; font-size:11.5px; font-weight:900;">
                                ${amountFormatted}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Amount In Words -->
                <div style="font-size:10px; font-weight:800; margin:2px 0 3px 4px; font-style:italic; color:#000000;">
                    અંકે રૂપિયા ${amountInWords} પૂરા.
                </div>

                <!-- Signatures Row (Ample signing space) -->
                <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:10.5px; font-weight:800; padding:0 25px; margin-top:28px; margin-bottom:2px;">
                    <div style="width:25%; text-align:center;">Clerk</div>
                    <div style="width:35%; text-align:center;">Sn. / Junior Officer</div>
                    <div style="width:25%; text-align:center;">Manager</div>
                </div>
            </div>
            `;

            if (showCutLine) {
                vouchersHtml += `
                <div style="border-top:1px dashed #555; margin:2.5mm 0 2mm 0; position:relative; text-align:center; height:1px;">
                    <span style="position:absolute; top:-8px; right:15px; background:#fff; padding:0 6px; font-size:9px; color:#555;">✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂</span>
                </div>
                `;
            }
        });

        fullHtml += `
        <div class="print-page print-vouchers-page ${pageBreakClass}" style="width:210mm; height:297mm; max-height:297mm; box-sizing:border-box; padding:0.50in 0.50in 0.50in 1.00in; background:#ffffff; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between;">
            ${vouchersHtml}
        </div>
        `;
    });

    return fullHtml;
}

// Fallback single loan voucher generator
function generate3in1VoucherHTML(loan, isPageBreak = false) {
    const vouchers = getLoanExpenseVouchersList(loan);
    if (vouchers.length === 0) {
        return `
        <div class="print-page ${isPageBreak ? 'print-page-break' : ''}" style="padding:40px 20px; text-align:center; font-family:'Outfit', 'Noto Sans Gujarati', sans-serif; font-size:14px; font-weight:700; background:#ffffff;">
            આ લોન માટે કોઈ કપાત / ખર્ચની રકમ નોંધાયેલ નથી, જેથી વાઉચર બનાવી શકાય તેમ નથી.
        </div>
        `;
    }

    const cleanBranch = getCleanBranchName(loan.branchName);
    const dateFormatted = formatDateDMY(loan.date);

    const pages = [];
    for (let i = 0; i < vouchers.length; i += 3) {
        pages.push(vouchers.slice(i, i + 3));
    }

    let fullHtml = "";

    pages.forEach((pageVouchers, pIdx) => {
        const pageBreakClass = (isPageBreak || pIdx > 0) ? "print-page-break" : "";
        
        let vouchersHtml = "";
        pageVouchers.forEach((v, vIdx) => {
            const amountFormatted = parseFloat(v.amount).toFixed(2);
            const amountInWords = formatAmountToGujaratiWords(v.amount);
            const showCutLine = (vIdx < pageVouchers.length - 1);

            vouchersHtml += `
            <div class="voucher-card" style="box-sizing:border-box; padding:2mm 0; font-family:'Outfit', 'Noto Sans Gujarati', Arial, sans-serif; color:#000000; line-height:1.2; background:#ffffff;">
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                    <div style="width:20%;"></div>
                    <div style="text-align:center;">
                        <span style="display:inline-block; border:1.5px solid #000000; border-radius:14px; padding:1.5px 22px; font-size:11.5px; font-weight:800; letter-spacing:0.6px; background:#f1f5f9; text-transform:uppercase;">
                            CASH CREDIT VOUCHER
                        </span>
                    </div>
                    <div style="width:28%; text-align:right; font-size:11px; font-weight:800; white-space:nowrap;">
                        શાખા : <strong style="font-weight:900;">${cleanBranch}</strong>
                    </div>
                </div>

                <div style="border:1.5px solid #000000; border-radius:8px; padding:3px 8px; background:#f1f5f9; display:flex; align-items:center; justify-content:space-between; margin-bottom:3px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${LOGO_SRC}" alt="JCCB" loading="eager" decoding="sync" style="width:42px; height:42px; object-fit:contain; flex-shrink:0;">
                        <div style="font-size:14px; font-weight:800; letter-spacing:0.2px; color:#000000;">
                            The Junagadh Commercial Co-Ope. Bank Ltd.
                        </div>
                    </div>
                    <div style="border:1.5px solid #000000; border-radius:4px; padding:2.5px 10px; font-size:11px; font-weight:800; background:#ffffff; white-space:nowrap;">
                        ${dateFormatted}
                    </div>
                </div>

                <div style="display:flex; align-items:center; gap:6px; margin-bottom:3px; font-size:11px;">
                    <div style="border:1.5px solid #000000; border-radius:12px; padding:2px 14px; font-weight:900; background:#ffffff; text-transform:uppercase; letter-spacing:0.5px;">
                        CREDIT
                    </div>
                    <div style="border:1.5px solid #000000; border-radius:6px; padding:2px 10px; font-weight:800; background:#ffffff; white-space:nowrap;">
                        ${v.glCode}
                    </div>
                    <div style="border:1.5px solid #000000; border-radius:6px; padding:2px 12px; font-weight:800; background:#ffffff; flex:1;">
                        ${v.glName}
                    </div>
                </div>

                <table style="width:100%; border-collapse:collapse; border:1.5px solid #000000; margin-bottom:2px; background:#ffffff; font-size:10px;">
                    <thead>
                        <tr style="border-bottom:1.5px solid #000000; background:#ffffff;">
                            <th style="border-right:1.5px solid #000000; padding:2px 6px; width:80%; text-align:center; font-weight:800; font-size:10.5px;">વિગત</th>
                            <th style="padding:2px 6px; width:20%; text-align:center; font-weight:800; font-size:10.5px;">રૂ.પૈસા</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border-right:1.5px solid #000000; border-bottom:1px solid #000000; padding:2.5px 6px; font-size:10px; font-weight:700; text-align:left; line-height:1.25;">
                                ${v.narration}
                            </td>
                            <td style="border-bottom:1px solid #000000; padding:2.5px 8px; font-size:11.5px; font-weight:800; text-align:right; white-space:nowrap;">
                                ${amountFormatted}
                            </td>
                        </tr>
                        <tr style="height:9px;"><td style="border-right:1.5px solid #000000; border-bottom:1px solid #000000;">&nbsp;</td><td style="border-bottom:1px solid #000000;">&nbsp;</td></tr>
                        <tr style="height:9px;"><td style="border-right:1.5px solid #000000; border-bottom:1px solid #000000;">&nbsp;</td><td style="border-bottom:1px solid #000000;">&nbsp;</td></tr>
                        <tr style="height:9px;"><td style="border-right:1.5px solid #000000; border-bottom:1px solid #000000;">&nbsp;</td><td style="border-bottom:1px solid #000000;">&nbsp;</td></tr>
                        <tr style="height:9px;"><td style="border-right:1.5px solid #000000; border-bottom:1px solid #000000;">&nbsp;</td><td style="border-bottom:1px solid #000000;">&nbsp;</td></tr>
                        <tr style="height:9px;"><td style="border-right:1.5px solid #000000; border-bottom:1px solid #000000;">&nbsp;</td><td style="border-bottom:1px solid #000000;">&nbsp;</td></tr>
                        <tr style="height:9px;"><td style="border-right:1.5px solid #000000; border-bottom:1px solid #000000;">&nbsp;</td><td style="border-bottom:1px solid #000000;">&nbsp;</td></tr>
                        <tr style="border-top:1.5px solid #000000; border-bottom:1.5px solid #000000; font-weight:900; background:#fafafa;">
                            <td style="border-right:1.5px solid #000000; height:14px;">&nbsp;</td>
                            <td style="text-align:right; padding:2px 8px; font-size:11.5px; font-weight:900;">
                                ${amountFormatted}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div style="font-size:10px; font-weight:800; margin:2px 0 3px 4px; font-style:italic; color:#000000;">
                    અંકે રૂપિયા ${amountInWords} પૂરા.
                </div>

                <!-- Signatures Row (Ample signing space) -->
                <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:10.5px; font-weight:800; padding:0 25px; margin-top:28px; margin-bottom:2px;">
                    <div style="width:25%; text-align:center;">Clerk</div>
                    <div style="width:35%; text-align:center;">Sn. / Junior Officer</div>
                    <div style="width:25%; text-align:center;">Manager</div>
                </div>
            </div>
            `;

            if (showCutLine) {
                vouchersHtml += `
                <div style="border-top:1px dashed #555; margin:2.5mm 0 2mm 0; position:relative; text-align:center; height:1px;">
                    <span style="position:absolute; top:-8px; right:15px; background:#fff; padding:0 6px; font-size:9px; color:#555;">✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂</span>
                </div>
                `;
            }
        });

        fullHtml += `
        <div class="print-page print-vouchers-page ${pageBreakClass}" style="width:210mm; height:297mm; max-height:297mm; box-sizing:border-box; padding:0.50in 0.50in 0.50in 1.00in; background:#ffffff; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between;">
            ${vouchersHtml}
        </div>
        `;
    });

    return fullHtml;
}

// ==================== HELPER FUNCTIONS ====================
function formatDateDMY(dateInput) {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

function calculateAgeFromDOB(dobString, baseDateStr = null) {
    if (!dobString) return "";
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return "";

    const refDate = baseDateStr ? new Date(baseDateStr) : new Date();
    let age = refDate.getFullYear() - birthDate.getFullYear();
    const m = refDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && refDate.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 0 ? age : 0;
}

function getMaturityDate(dateInput, monthsToAdd = 12) {
    const d = new Date(dateInput || new Date());
    d.setMonth(d.getMonth() + monthsToAdd);
    return d;
}

function getFirstEmiDueDate(dateInput) {
    const d = new Date(dateInput || new Date());
    d.setMonth(d.getMonth() + 1);
    return d;
}

function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.style.cssText = "position:fixed; bottom:20px; right:20px; background:#0f1c3f; color:#ffd700; padding:12px 20px; border-radius:8px; z-index:99999; box-shadow:0 4px 12px rgba(0,0,0,0.3); font-weight:600; display:flex; align-items:center; gap:8px;";
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function numberToGujaratiWords(num) {
    if (!num || num === 0) return "શૂન્ય";
    const a = [
        "", "એક", "બે", "ત્રણ", "ચાર", "પાંચ", "છ", "સાત", "આઠ", "નવ", "દસ",
        "અગિયાર", "બાર", "તેર", "ચૌદ", "પંદર", "સોળ", "સત્તર", "અઢાર", "ઓગણીસ", "વીસ",
        "એકવીસ", "બાવીસ", "તેવીસ", "ચોવીસ", "પચ્ચીસ", "છવ્વીસ", "સત્તાવીસ", "અઠ્ઠાવીસ", "ઓગણત્રીસ", "ત્રીસ",
        "એકત્રીસ", "બત્રીસ", "તેત્રીસ", "ચોત્રીસ", "પાંત્રીસ", "છત્રીસ", "સાડત્રીસ", "આડત્રીસ", "ઓગણચાલીસ", "ચાલીસ",
        "એકતાલીસ", "બેતાલીસ", "તેતાલીસ", "ચુંમાલીસ", "પિસ્તાલીસ", "છેતાલીસ", "સુડતાલીસ", "અડતાલીસ", "ઓગણપચાસ", "પચાસ",
        "એકાવન", "બાવન", "ત્રેપન", "ચોપન", "પંચાવન", "છપ્પન", "સત્તાવન", "અઠ્ઠાવન", "ઓગણસાઠ", "સાઠ",
        "એકસઠ", "બાસઠ", "ત્રેસઠ", "ચોસઠ", "પાંસઠ", "છાસઠ", "સડસઠ", "અડસઠ", "ઓગણોસિત્તેર", "સિત્તેર",
        "એકોતેર", "બોતેર", "તેરોતેર", "ચોંતેર", "પંચોતેર", "છોતેર", "સંતોતેર", "ઇઠોતેર", "ઓગણાએંસી", "એંસી",
        "એક્યાસી", "બ્યાસી", "ત્યાસી", "ચોર્યાસી", "પંચાસી", "છ્યાસી", "સત્ત્યાસી", "અઠ્યાસી", "નેવ્યાસી", "નેવું",
        "એકાણું", "બાણું", "ત્રાણું", "ચોરાણું", "પંચાણું", "છન્નું", "સત્તાણું", "અઠ્ઠાણું", "નવ્વાણું"
    ];

    const hundreds = [
        "", "એકસો", "બસ્સો", "ત્રણસો", "ચારસો", "પાંચસો", "છસો", "સાતસો", "આઠસો", "નવસો"
    ];

    function convertGroup(n) {
        let str = "";
        if (n >= 100) {
            const h = Math.floor(n / 100);
            if (h < hundreds.length && hundreds[h]) {
                str += hundreds[h] + " ";
            } else {
                str += (a[h] || "") + " સો ";
            }
            n %= 100;
        }
        if (n > 0) {
            str += a[n] + " ";
        }
        return str;
    }

    let result = "";
    let n = Math.floor(Math.abs(num));

    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const remainder = n;

    if (crore > 0) result += convertGroup(crore) + "કરોડ ";
    if (lakh > 0) result += convertGroup(lakh) + "લાખ ";
    if (thousand > 0) result += convertGroup(thousand) + "હજાર ";
    if (remainder > 0) result += convertGroup(remainder);

    return result.replace(/\s+/g, " ").trim();
}

// Global Window Exports
window.deleteLoanRecord = deleteLoanRecord;
window.editLoanRecord = editLoanRecord;
window.syncCloudData = syncCloudData;

