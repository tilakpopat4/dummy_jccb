/**
 * =================================================================
 * JCCB CENTRAL MANAGEMENT & SECURITY AUDIT PORTAL LOGIC
 * =================================================================
 */

// State
const mgmtState = {
    isAuthenticated: false,
    activeSessions: [],
    auditLogs: [],
    loans: [],
    customers: [],
    branches: [],
    valuers: [],
    products: [],
    rules: {},
    settings: {},
    filterAction: "",
    filterBranch: "",
    filterSearch: ""
};

document.addEventListener("DOMContentLoaded", () => {
    initAuth();
    initClock();
    initTabs();
    initFilters();
    initExportButtons();

    // Initialize Firebase and start listeners
    if (window.FirebaseService) {
        window.FirebaseService.init().then(() => {
            console.log("[Management] Firebase Central initialized.");
            startRealtimeListeners();
            loadAllData();
        }).catch(err => {
            console.warn("[Management] Firebase init error:", err);
            loadLocalFallbackData();
        });
    } else {
        loadLocalFallbackData();
    }
});

// ==================== AUTHENTICATION ====================
function initAuth() {
    const overlay = document.getElementById("auth-overlay");
    const form = document.getElementById("mgmt-auth-form");
    const passInput = document.getElementById("mgmt-passcode");
    const errorEl = document.getElementById("mgmt-auth-error");
    const lockBtn = document.getElementById("btn-lock-mgmt");

    // Check if session is already authorized
    const isUnlocked = sessionStorage.getItem("jccb_mgmt_unlocked") === "true";
    let isHOUser = false;
    try {
        const savedState = JSON.parse(localStorage.getItem("jccb_gold_state") || "{}");
        if (savedState.currentSession && (savedState.currentSession.code === "99" || savedState.currentSession.isHO)) {
            isHOUser = true;
        }
    } catch (e) {}

    if (isUnlocked || isHOUser) {
        mgmtState.isAuthenticated = true;
        if (overlay) overlay.classList.add("hidden");
    } else {
        if (overlay) overlay.classList.remove("hidden");
    }

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const val = passInput ? passInput.value.trim() : "";
            if (val === "Rahul#80810" || val === "Admin@123") {
                sessionStorage.setItem("jccb_mgmt_unlocked", "true");
                mgmtState.isAuthenticated = true;
                if (overlay) overlay.classList.add("hidden");
                if (errorEl) errorEl.classList.add("hidden");
                if (window.FirebaseService && typeof window.FirebaseService.logAuditEvent === "function") {
                    window.FirebaseService.logAuditEvent("MANAGEMENT_LOGIN", "Administrator accessed the Management & Audit Console", {
                        branchCode: "99",
                        branchName: "HEAD OFFICE",
                        operator: "ADMIN"
                    });
                }
            } else {
                if (errorEl) errorEl.classList.remove("hidden");
            }
        });
    }

    if (lockBtn) {
        lockBtn.addEventListener("click", () => {
            sessionStorage.removeItem("jccb_mgmt_unlocked");
            mgmtState.isAuthenticated = false;
            if (overlay) {
                overlay.classList.remove("hidden");
                if (passInput) passInput.value = "";
            }
        });
    }
}

// ==================== CLOCK ====================
function initClock() {
    const timeEl = document.getElementById("mgmt-current-time");
    const updateTime = () => {
        if (timeEl) {
            const now = new Date();
            timeEl.textContent = now.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }) + " " + now.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            });
        }
    };
    updateTime();
    setInterval(updateTime, 1000);
}

// ==================== TABS ====================
function initTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-tab");
            tabBtns.forEach(b => b.classList.remove("active"));
            tabPanels.forEach(p => p.classList.remove("active"));

            btn.classList.add("active");
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) targetPanel.classList.add("active");
        });
    });
}

// ==================== REALTIME LISTENERS ====================
function startRealtimeListeners() {
    if (!window.FirebaseService) return;

    // 1. Listen for active connected sessions
    if (typeof window.FirebaseService.listenActiveSessions === "function") {
        window.FirebaseService.listenActiveSessions((sessions) => {
            if (Array.isArray(sessions)) {
                mgmtState.activeSessions = sessions;
                renderActiveSessions();
                updateTopMetadata();
            }
        });
    }

    // 2. Listen for audit logs
    if (typeof window.FirebaseService.listenAuditLogs === "function") {
        window.FirebaseService.listenAuditLogs((logs) => {
            if (Array.isArray(logs)) {
                mgmtState.auditLogs = logs;
                renderAuditLogs();
                updateTopMetadata();
            }
        });
    }

    // 3. Listen for loans
    if (typeof window.FirebaseService.listenLoans === "function") {
        window.FirebaseService.listenLoans(null, (loans) => {
            if (Array.isArray(loans)) {
                mgmtState.loans = loans;
                updateTopMetadata();
            }
        });
    }

    // 4. Listen for branches
    if (typeof window.FirebaseService.listenBranches === "function") {
        window.FirebaseService.listenBranches((branches) => {
            if (Array.isArray(branches)) {
                mgmtState.branches = branches;
                populateBranchFilters();
            }
        });
    }

    // 5. Listen for customers
    if (typeof window.FirebaseService.listenCustomers === "function") {
        window.FirebaseService.listenCustomers((customers) => {
            if (Array.isArray(customers)) {
                mgmtState.customers = customers;
                updateTopMetadata();
            }
        });
    }

    // Continuous 5-second polling fallback
    setInterval(() => loadAllData(false), 5000);
}

async function loadAllData(showSpinner = true) {
    if (!window.FirebaseService) return;

    try {
        const [loans, customers, branches, valuers, products, logs] = await Promise.all([
            window.FirebaseService.getLoans ? window.FirebaseService.getLoans() : [],
            window.FirebaseService.getCustomers ? window.FirebaseService.getCustomers() : [],
            window.FirebaseService.getBranchesList ? window.FirebaseService.getBranchesList() : [],
            window.FirebaseService.getValuersList ? window.FirebaseService.getValuersList() : [],
            window.FirebaseService.getProductsList ? window.FirebaseService.getProductsList() : [],
            window.FirebaseService.getAuditLogs ? window.FirebaseService.getAuditLogs(300) : []
        ]);

        if (Array.isArray(loans) && loans.length > 0) mgmtState.loans = loans;
        if (Array.isArray(customers) && customers.length > 0) mgmtState.customers = customers;
        if (Array.isArray(branches) && branches.length > 0) {
            mgmtState.branches = branches;
            populateBranchFilters();
        }
        if (Array.isArray(valuers) && valuers.length > 0) mgmtState.valuers = valuers;
        if (Array.isArray(products) && products.length > 0) mgmtState.products = products;
        if (Array.isArray(logs) && logs.length > 0 && mgmtState.auditLogs.length === 0) {
            mgmtState.auditLogs = logs;
            renderAuditLogs();
        }

        updateTopMetadata();
    } catch (e) {
        console.warn("[Management] loadAllData notice:", e);
    }
}

function loadLocalFallbackData() {
    try {
        const saved = JSON.parse(localStorage.getItem("jccb_gold_state") || "{}");
        if (saved.loans) mgmtState.loans = saved.loans;
        if (saved.customers) mgmtState.customers = saved.customers;
        if (saved.branches) mgmtState.branches = saved.branches;
        if (saved.valuers) mgmtState.valuers = saved.valuers;
        if (saved.products) mgmtState.products = saved.products;
        if (saved.rules) mgmtState.rules = saved.rules;
        if (saved.settings) mgmtState.settings = saved.settings;

        populateBranchFilters();
        updateTopMetadata();
    } catch (e) {}
}

// ==================== TOP METADATA STATS ====================
function updateTopMetadata() {
    const now = Date.now();
    const activeOnlineDevices = (mgmtState.activeSessions || []).filter(s => {
        const pingTime = s.lastPingMs || (s.lastPing ? new Date(s.lastPing).getTime() : 0);
        return (now - pingTime < 90000); // Active within last 90 seconds
    });

    const activeBranchesCount = activeOnlineDevices.length;
    const totalLoans = (mgmtState.loans || []).length;
    const totalDisbursed = (mgmtState.loans || []).reduce((sum, l) => {
        const val = parseFloat(l.loanAmount || l.sanctionAmount || l.amount || l.eligibleLoanAmount || 0) || 0;
        return sum + val;
    }, 0);
    const totalCustomers = (mgmtState.customers || []).length;
    const totalLogs = (mgmtState.auditLogs || []).length;

    // Stat Cards
    const elActive = document.getElementById("stat-active-devices");
    const elLoans = document.getElementById("stat-total-loans");
    const elAmt = document.getElementById("stat-total-amount");
    const elCust = document.getElementById("stat-total-customers");
    const elLogs = document.getElementById("stat-total-logs");

    if (elActive) elActive.textContent = activeBranchesCount;
    if (elLoans) elLoans.textContent = totalLoans.toLocaleString("en-IN");
    if (elAmt) elAmt.textContent = "₹ " + Math.round(totalDisbursed).toLocaleString("en-IN");
    if (elCust) elCust.textContent = totalCustomers.toLocaleString("en-IN");
    if (elLogs) elLogs.textContent = totalLogs.toLocaleString("en-IN");

    // Badges on Tabs
    const badgeDev = document.getElementById("badge-device-count");
    const badgeLog = document.getElementById("badge-log-count");
    if (badgeDev) badgeDev.textContent = activeBranchesCount;
    if (badgeLog) badgeLog.textContent = totalLogs;
}

// ==================== RENDER ACTIVE SESSIONS ====================
function renderActiveSessions() {
    const tbody = document.getElementById("devices-tbody");
    if (!tbody) return;

    const sessions = mgmtState.activeSessions || [];
    if (sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">કોઈ સક્રિય શાખા / ડિવાઇસ કનેક્ટેડ નથી (No active branch devices registered).</td></tr>';
        return;
    }

    tbody.innerHTML = "";
    const now = Date.now();

    sessions.sort((a, b) => (b.lastPingMs || 0) - (a.lastPingMs || 0));

    sessions.forEach(s => {
        const pingTime = s.lastPingMs || (s.lastPing ? new Date(s.lastPing).getTime() : 0);
        const isOnline = (now - pingTime < 90000);
        const diffSec = Math.round((now - pingTime) / 1000);
        const relativePing = diffSec < 60 ? `${diffSec}s ago` : `${Math.round(diffSec / 60)}m ago`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="text-align:center;">
                ${isOnline
                    ? '<span class="badge badge-live"><span class="pulse-dot"></span> LIVE ONLINE</span>'
                    : '<span class="badge badge-offline">OFFLINE</span>'
                }
            </td>
            <td>
                <strong>${s.branchName || 'Branch ' + s.branchCode}</strong>
                <br><span class="badge ${s.branchCode === '99' ? 'badge-action-delete' : 'badge-action-login'}">Code: ${s.branchCode || '99'}</span>
            </td>
            <td>
                <strong>${s.operator || 'Operator'}</strong>
            </td>
            <td>
                <span class="ip-badge"><i class="fa-solid fa-globe"></i> ${s.ip || 'Local / Office IP'}</span>
            </td>
            <td>
                <small style="color:var(--text-muted); font-size:11px;">${formatUserAgent(s.userAgent || s.platform)}</small>
            </td>
            <td>
                <small>${formatTime(s.loginTime)}</small>
            </td>
            <td>
                <strong>${relativePing}</strong>
                <br><small style="color:var(--text-muted); font-size:11px;">${formatTime(s.lastPing)}</small>
            </td>
            <td style="text-align:center;">
                <button class="btn btn-secondary btn-sm terminate-session-btn" data-session-id="${s.sessionId}" title="Terminate Session">
                    <i class="fa-solid fa-power-off text-danger"></i> Disconnect
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".terminate-session-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const sid = btn.getAttribute("data-session-id");
            if (sid && confirm("Terminate this active device session?")) {
                if (window.FirebaseService && typeof window.FirebaseService.deleteActiveSession === "function") {
                    window.FirebaseService.deleteActiveSession(sid).then(() => {
                        mgmtState.activeSessions = mgmtState.activeSessions.filter(x => x.sessionId !== sid);
                        renderActiveSessions();
                        updateTopMetadata();
                    });
                }
            }
        });
    });
}

// ==================== RENDER AUDIT LOGS ====================
function renderAuditLogs() {
    const tbody = document.getElementById("logs-tbody");
    if (!tbody) return;

    let logs = mgmtState.auditLogs || [];

    // Filter
    if (mgmtState.filterAction) {
        logs = logs.filter(l => String(l.action).toUpperCase() === mgmtState.filterAction.toUpperCase());
    }
    if (mgmtState.filterBranch) {
        logs = logs.filter(l => String(l.branchCode) === mgmtState.filterBranch);
    }
    if (mgmtState.filterSearch) {
        const query = mgmtState.filterSearch.toLowerCase();
        logs = logs.filter(l => {
            return (
                (l.action || "").toLowerCase().includes(query) ||
                (l.details || "").toLowerCase().includes(query) ||
                (l.operator || "").toLowerCase().includes(query) ||
                (l.ip || "").toLowerCase().includes(query) ||
                (l.branchName || "").toLowerCase().includes(query)
            );
        });
    }

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">કોઈ ઓડિટ લૉગ ઉપલબ્ધ નથી (No matching security audit logs found).</td></tr>';
        return;
    }

    tbody.innerHTML = "";
    logs.slice(0, 200).forEach(l => {
        const tr = document.createElement("tr");
        const actionBadgeClass = getActionBadgeClass(l.action);

        tr.innerHTML = `
            <td style="white-space:nowrap;">
                <strong>${formatTime(l.timestamp)}</strong>
            </td>
            <td>
                <strong>${l.branchName || 'Branch ' + l.branchCode}</strong>
                <br><span class="badge ${l.branchCode === '99' ? 'badge-action-delete' : 'badge-action-login'}">Code: ${l.branchCode}</span>
            </td>
            <td>
                <strong>${l.operator || 'System'}</strong>
            </td>
            <td style="text-align:center;">
                <span class="badge ${actionBadgeClass}">${l.action || 'EVENT'}</span>
            </td>
            <td>
                <span style="font-weight:600; color:var(--primary-dark);">${l.details || '-'}</span>
            </td>
            <td>
                <span class="ip-badge"><i class="fa-solid fa-location-dot"></i> ${l.ip || 'Office Network'}</span>
            </td>
            <td>
                <small style="color:var(--text-muted); font-size:11px;">${formatUserAgent(l.userAgent || l.platform)}</small>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getActionBadgeClass(action) {
    const act = String(action || "").toUpperCase();
    if (act.includes("LOGIN")) return "badge-action-login";
    if (act.includes("LOGOUT")) return "badge-action-logout";
    if (act.includes("SANCTION") || act.includes("CREATE")) return "badge-action-sanction";
    if (act.includes("DELETE")) return "badge-action-delete";
    if (act.includes("RATE")) return "badge-action-rate";
    if (act.includes("RULE")) return "badge-action-rules";
    return "badge-action-branch";
}

function populateBranchFilters() {
    const select = document.getElementById("log-filter-branch");
    if (!select) return;
    const branches = mgmtState.branches || [];
    select.innerHTML = '<option value="">-- All Branches --</option>';
    branches.forEach(b => {
        const opt = document.createElement("option");
        opt.value = b.code;
        opt.textContent = `${b.code} - ${b.name}`;
        select.appendChild(opt);
    });
}

function initFilters() {
    const searchInp = document.getElementById("log-search-input");
    const actionSelect = document.getElementById("log-filter-action");
    const branchSelect = document.getElementById("log-filter-branch");
    const resetBtn = document.getElementById("btn-clear-log-filters");
    const refreshSessionsBtn = document.getElementById("btn-refresh-sessions");

    if (searchInp) {
        searchInp.addEventListener("input", () => {
            mgmtState.filterSearch = searchInp.value.trim();
            renderAuditLogs();
        });
    }

    if (actionSelect) {
        actionSelect.addEventListener("change", () => {
            mgmtState.filterAction = actionSelect.value;
            renderAuditLogs();
        });
    }

    if (branchSelect) {
        branchSelect.addEventListener("change", () => {
            mgmtState.filterBranch = branchSelect.value;
            renderAuditLogs();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (searchInp) searchInp.value = "";
            if (actionSelect) actionSelect.value = "";
            if (branchSelect) branchSelect.value = "";
            mgmtState.filterSearch = "";
            mgmtState.filterAction = "";
            mgmtState.filterBranch = "";
            renderAuditLogs();
        });
    }

    if (refreshSessionsBtn) {
        refreshSessionsBtn.addEventListener("click", () => {
            loadAllData();
        });
    }
}

// ==================== CSV EXPORT ENGINES ====================
function initExportButtons() {
    const btnAuditCsv = document.getElementById("btn-export-audit-csv");
    const btnAuditQuick = document.getElementById("btn-download-logs-quick");
    const btnLoansCsv = document.getElementById("btn-export-loans-csv");
    const btnCustCsv = document.getElementById("btn-export-customers-csv");
    const btnMastersCsv = document.getElementById("btn-export-masters-csv");
    const btnFullJson = document.getElementById("btn-export-full-json");

    if (btnAuditCsv) btnAuditCsv.addEventListener("click", exportAuditLogsCSV);
    if (btnAuditQuick) btnAuditQuick.addEventListener("click", exportAuditLogsCSV);
    if (btnLoansCsv) btnLoansCsv.addEventListener("click", exportLoansCSV);
    if (btnCustCsv) btnCustCsv.addEventListener("click", exportCustomersCSV);
    if (btnMastersCsv) btnMastersCsv.addEventListener("click", exportMastersCSV);
    if (btnFullJson) btnFullJson.addEventListener("click", exportFullDatabaseJSON);
}

/**
 * Export Security Audit Logs as CSV (UTF-8 BOM formatted)
 */
function exportAuditLogsCSV() {
    const logs = mgmtState.auditLogs || [];
    if (logs.length === 0) {
        alert("No audit logs available for export.");
        return;
    }

    const headers = ["Timestamp", "Action", "Branch Code", "Branch Name", "Operator", "Details", "Client IP", "Device OS / Platform"];
    const rows = logs.map(l => [
        `"${formatTime(l.timestamp)}"`,
        `"${(l.action || '').replace(/"/g, '""')}"`,
        `"${(l.branchCode || '').replace(/"/g, '""')}"`,
        `"${(l.branchName || '').replace(/"/g, '""')}"`,
        `"${(l.operator || '').replace(/"/g, '""')}"`,
        `"${(l.details || '').replace(/"/g, '""')}"`,
        `"${(l.ip || '').replace(/"/g, '""')}"`,
        `"${(l.userAgent || l.platform || '').replace(/"/g, '""')}"`
    ]);

    downloadCSV("JCCB_Security_Audit_Logs_" + getTimestampSuffix() + ".csv", headers, rows);
}

/**
 * Export All Loans Register as CSV
 */
function exportLoansCSV() {
    const loans = mgmtState.loans || [];
    if (loans.length === 0) {
        alert("No loan records available for export.");
        return;
    }

    const headers = [
        "Loan ID", "Account No", "Branch Code", "Borrower Name", "Loan Type", "Loan Amount",
        "Gold Rate (22K)", "Gross Weight (g)", "Net Weight (g)", "Valuation Amount",
        "Valuer Name", "Sanction Date", "Due Date", "Created At"
    ];

    const rows = loans.map(l => [
        `"${l.id || l.loanId || ''}"`,
        `"${l.accountNo || ''}"`,
        `"${l.branchCode || ''}"`,
        `"${(l.borrowerName || '').replace(/"/g, '""')}"`,
        `"${l.loanType || ''}"`,
        `"${l.loanAmount || 0}"`,
        `"${l.goldRate || ''}"`,
        `"${l.grossWeight || 0}"`,
        `"${l.netWeight || 0}"`,
        `"${l.valuationAmount || 0}"`,
        `"${(l.valuerName || '').replace(/"/g, '""')}"`,
        `"${l.sanctionDate || l.loanDate || ''}"`,
        `"${l.dueDate || ''}"`,
        `"${l.createdAt || ''}"`
    ]);

    downloadCSV("JCCB_Full_Loans_Register_" + getTimestampSuffix() + ".csv", headers, rows);
}

/**
 * Export Customers Directory as CSV
 */
function exportCustomersCSV() {
    const customers = mgmtState.customers || [];
    if (customers.length === 0) {
        alert("No customer profiles available for export.");
        return;
    }

    const headers = [
        "Customer No", "Full Name", "Is Member", "Member No", "Mobile Phone",
        "Address", "Savings Ac", "DOB", "Age", "Occupation", "Nominee Name", "Nominee Relation"
    ];

    const rows = customers.map(c => [
        `"${c.customerNo || c.id || ''}"`,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${c.isMember || ''}"`,
        `"${c.memberNo || ''}"`,
        `"${c.mobile || c.phone || ''}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        `"${c.savingsAc || ''}"`,
        `"${c.dob || ''}"`,
        `"${c.age || ''}"`,
        `"${(c.occupation || '').replace(/"/g, '""')}"`,
        `"${(c.nomineeName || '').replace(/"/g, '""')}"`,
        `"${(c.nomineeRelation || '').replace(/"/g, '""')}"`
    ]);

    downloadCSV("JCCB_Customer_Master_" + getTimestampSuffix() + ".csv", headers, rows);
}

/**
 * Export Master Directories as CSV
 */
function exportMastersCSV() {
    const branches = mgmtState.branches || [];
    const valuers = mgmtState.valuers || [];
    const products = mgmtState.products || [];

    const headers = ["Master Category", "Code / ID", "Name / Title", "Parameter 1", "Parameter 2", "Status / Role"];
    const rows = [];

    branches.forEach(b => {
        rows.push([
            `"BRANCH"`,
            `"${b.code}"`,
            `"${(b.name || '').replace(/"/g, '""')}"`,
            `"Password: ${(b.password || '')}"`,
            `"${b.isHO ? 'Head Office' : 'Branch Office'}"`,
            `"${b.active === false ? 'Inactive' : 'Active'}"`
        ]);
    });

    valuers.forEach(v => {
        rows.push([
            `"VALUER"`,
            `"${v.id}"`,
            `"${(v.name || '').replace(/"/g, '""')}"`,
            `"Phone: ${(v.phone || '')}"`,
            `"SavingsAc: ${(v.savingsAc || '')}"`,
            `"${v.active === false ? 'Inactive' : 'Active'}"`
        ]);
    });

    products.forEach(p => {
        rows.push([
            `"PRODUCT_SCHEME"`,
            `"${p.code}"`,
            `"${(p.name || '').replace(/"/g, '""')}"`,
            `"Min: ₹${p.minAmt || 0} - Max: ₹${p.maxAmt || 0}"`,
            `"Rate: ${p.rate || 0}%"`,
            `"${p.type || 'Active'}"`
        ]);
    });

    downloadCSV("JCCB_Organizational_Masters_" + getTimestampSuffix() + ".csv", headers, rows);
}

/**
 * Export Complete Central Database Snapshot as JSON
 */
function exportFullDatabaseJSON() {
    const fullBackup = {
        metadata: {
            bank: "The Junagadh Commercial Co-operative Bank Ltd.",
            system: "JCCB Gold Enterprise Management",
            exportTimestamp: new Date().toISOString(),
            version: "v20260831_v10"
        },
        loans: mgmtState.loans || [],
        customers: mgmtState.customers || [],
        branches: mgmtState.branches || [],
        valuers: mgmtState.valuers || [],
        products: mgmtState.products || [],
        rules: mgmtState.rules || {},
        settings: mgmtState.settings || {},
        auditLogs: mgmtState.auditLogs || []
    };

    const jsonStr = JSON.stringify(fullBackup, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "JCCB_Full_Database_Snapshot_" + getTimestampSuffix() + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Utility: CSV Downloader with UTF-8 BOM
function downloadCSV(filename, headers, rows) {
    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Utility: Formatting helpers
function formatTime(isoStr) {
    if (!isoStr) return "-";
    try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }) + " " + d.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
    } catch (e) {
        return isoStr;
    }
}

function formatUserAgent(ua) {
    if (!ua) return "Desktop Terminal";
    if (ua.includes("Windows")) return "Windows PC (" + (ua.includes("Chrome") ? "Chrome" : "Browser") + ")";
    if (ua.includes("Mac")) return "macOS (" + (ua.includes("Safari") ? "Safari" : "Browser") + ")";
    if (ua.includes("Linux")) return "Linux OS";
    if (ua.includes("Android")) return "Android Device";
    if (ua.includes("iPhone")) return "iPhone / iOS";
    return ua.substring(0, 30);
}

function getTimestampSuffix() {
    const d = new Date();
    return d.toISOString().replace(/[-:T]/g, "").slice(0, 14);
}
