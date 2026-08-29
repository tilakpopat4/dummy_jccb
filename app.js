// ==================== INITIAL SEED DATA ====================
const INITIAL_BRANCHES = [
    { code: "99", name: "HEAD OFFICE" },
    { code: "01", name: "AZADCHOWK BRANCH" },
    { code: "02", name: "JOSHIPARA BRANCH" },
    { code: "03", name: "DOLATPARA BRANCH" },
    { code: "04", name: "KODINAR BRANCH" },
    { code: "05", name: "KESHOD BRANCH" },
    { code: "06", name: "VANTHALI BRANCH" },
    { code: "07", name: "MANAVADAR BRANCH" },
    { code: "08", name: "GANDHINAGAR BRANCH" },
    { code: "09", name: "LIMBDI BRANCH" },
    { code: "10", name: "MENDARDA BRANCH" },
    { code: "11", name: "VISAVADAR BRANCH" },
    { code: "12", name: "JAMNAGAR BRANCH" },
    { code: "13", name: "BUS STAND BRANCH" },
    { code: "14", name: "LATHI BRANCH" },
    { code: "16", name: "AHMEDABAD BRANCH" },
    { code: "17", name: "RAJKOT BRANCH" }
];

const INITIAL_PRODUCTS = [
    { id: "1", code: "GW-3725", minAmt: 0, maxAmt: 50000, rate: 11.00, desc: "Gold Loan up to ₹50,000 (GW-3725) 11.00% FIX" },
    { id: "2", code: "GW-3725", minAmt: 50001, maxAmt: 100000, rate: 11.50, desc: "Gold Loan ₹50,001 to ₹100,000 (GW-3725) 11.50% FIX" },
    { id: "3", code: "GD-3524", minAmt: 100001, maxAmt: 200000, rate: 11.50, desc: "Gold Loan ₹100,001 to ₹200,000 (GD-3524) 11.50% FIX" },
    { id: "4", code: "3527", minAmt: 200001, maxAmt: 999999999, rate: 11.50, desc: "Gold Loan above ₹200,000 (3527) 11.50% FIX" },
    { id: "5", code: "3553", minAmt: 200001, maxAmt: 999999999, rate: 11.50, desc: "Gold Loan above ₹200,000 (Overdraft) (3553) 11.50% FIX" }
];

const INITIAL_VALUERS = [
    { id: "v1", name: "Soni Jamnadas Pragjibhai", mobile: "9825012345", address: "Zaveri Bazar, Junagadh", savingsAc: "002010100012345" },
    { id: "v2", name: "Soni Hareshbhai Dahyalal", mobile: "9426211223", address: "College Road, Junagadh", savingsAc: "002010100056789" }
];

const DEFAULT_ACCOUNT_SEEDS = {
    "GW-3725": 1001,
    "GD-3524": 5001,
    "3527": 8001,
    "3553": 9001
};

const LOGO_SRC = "jccb-logo.png";

let currentUploadedCustPhoto = "";
let currentUploadedGoldPhoto = "";
let currentUploadedMasterCustPhoto = "";
let currentPrintLoanId = null;

// ==================== STATE MANAGEMENT ====================
let state = {
    branches: [...INITIAL_BRANCHES],
    products: [...INITIAL_PRODUCTS],
    valuers: [...INITIAL_VALUERS],
    loans: [],
    customers: [],
    goldRates: {}, 
    accountSeeds: {}, 
    lastPacketSeed: 100, 
    currentSession: null,
    editingLoanId: null
};

function loadState() {
    try {
        const stored = localStorage.getItem("jccb_gold_loan_state");
        if (stored) {
            state = JSON.parse(stored);
            
            // Ensure state.branches exists and is not empty
            if (!state.branches || !Array.isArray(state.branches) || state.branches.length === 0) {
                state.branches = [...INITIAL_BRANCHES];
            }
            if (!state.products || !Array.isArray(state.products) || state.products.length === 0) {
                state.products = [...INITIAL_PRODUCTS];
            }
            if (!state.valuers || !Array.isArray(state.valuers) || state.valuers.length === 0) {
                state.valuers = [...INITIAL_VALUERS];
            }
            // Ensure state.customers exists
            if (!state.customers || !Array.isArray(state.customers)) {
                state.customers = [];
            }
            if (!state.loans || !Array.isArray(state.loans)) {
                state.loans = [];
            }
            if (!state.goldRates || typeof state.goldRates !== 'object') {
                state.goldRates = {};
            }
            
            // Run migration for accountSeeds (from flat object to branch-nested objects)
            if (state.accountSeeds && !Object.values(state.accountSeeds).some(val => typeof val === 'object')) {
                const flatSeeds = { ...state.accountSeeds };
                state.accountSeeds = {};
                state.branches.forEach(b => {
                    state.accountSeeds[b.code] = { ...flatSeeds };
                });
            }
            
            // Ensure every branch has account seeds
            if (!state.accountSeeds) state.accountSeeds = {};
            state.branches.forEach(b => {
                if (!state.accountSeeds[b.code]) {
                    state.accountSeeds[b.code] = { ...DEFAULT_ACCOUNT_SEEDS };
                }
            });

            // Run migration for lastPacketSeed (from flat number to branch-nested numbers)
            if (typeof state.lastPacketSeed === 'number' || typeof state.lastPacketSeed === 'string') {
                const flatPacketSeed = parseInt(state.lastPacketSeed) || 100;
                state.lastPacketSeed = {};
                state.branches.forEach(b => {
                    state.lastPacketSeed[b.code] = flatPacketSeed;
                });
            }
            
            // Ensure every branch has lastPacketSeed
            if (!state.lastPacketSeed) state.lastPacketSeed = {};
            state.branches.forEach(b => {
                if (state.lastPacketSeed[b.code] === undefined) {
                    state.lastPacketSeed[b.code] = 100;
                }
            });
        } else {
            state.branches = [...INITIAL_BRANCHES];
            state.products = [...INITIAL_PRODUCTS];
            state.valuers = [...INITIAL_VALUERS];
            state.loans = [];
            state.customers = [];
            state.goldRates = {};
            
            state.accountSeeds = {};
            state.branches.forEach(b => {
                state.accountSeeds[b.code] = { ...DEFAULT_ACCOUNT_SEEDS };
            });
            
            state.lastPacketSeed = {};
            state.branches.forEach(b => {
                state.lastPacketSeed[b.code] = 100;
            });
            
            state.currentSession = null;
            saveState();
        }
    } catch (e) {
        console.error("Error loading local storage state", e);
    }
}

function saveState() {
    try {
        localStorage.setItem("jccb_gold_loan_state", JSON.stringify(state));
    } catch (e) {
        console.error("Error saving state", e);
    }
}

// ==================== UTILITY HELPERS ====================
function formatDateDMY(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
        if (parts[0].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    }
    return dateStr;
}

function getTodayDateStr() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function roundTo10(val) {
    return Math.round(val / 10) * 10;
}

function roundUpTo5(val) {
    return Math.ceil(val / 5) * 5;
}

// Convert Number to English Words (Indian numbering system: Lakhs, Crores)
function numberToWords(amount) {
    if (amount === 0) return "Rupees Zero Only";
    
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];
    
    function numToWords2(n) {
        if (n < 20) return a[n];
        const digit = n % 10;
        return b[Math.floor(n / 10)] + (digit !== 0 ? a[digit] : '');
    }
    
    function numToWords3(n) {
        const hundred = Math.floor(n / 100);
        const rest = n % 100;
        let str = '';
        if (hundred > 0) {
            str += a[hundred] + 'Hundred ';
        }
        if (rest > 0) {
            if (hundred > 0) str += 'and ';
            str += numToWords2(rest);
        }
        return str;
    }
    
    let num = Math.floor(amount);
    let paise = Math.round((amount - num) * 100);
    
    let words = "Rupees ";
    
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    
    if (crore > 0) {
        words += numToWords3(crore) + "Crore ";
    }
    if (lakh > 0) {
        words += numToWords3(lakh) + "Lakh ";
    }
    if (thousand > 0) {
        words += numToWords3(thousand) + "Thousand ";
    }
    if (num > 0) {
        words += numToWords3(num);
    }
    
    words = words.trim() + " Only";
    
    if (paise > 0) {
        words += " and " + numToWords2(paise) + "Paise Only";
    }
    
    return words;
}

// ==================== TAB NAVIGATION ====================
function initTabs() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const tabId = item.getAttribute("data-tab");
            switchTab(tabId);
        });
    });

    const shortcuts = document.querySelectorAll("[data-go-tab]");
    shortcuts.forEach(btn => {
        btn.addEventListener("click", () => {
            const tabId = btn.getAttribute("data-go-tab");
            switchTab(tabId);
        });
    });

    const viewAllBtn = document.querySelector(".view-all-register-btn");
    if (viewAllBtn) {
        viewAllBtn.addEventListener("click", () => {
            switchTab("register-view");
        });
    }
}

function switchTab(tabId) {
    const contents = document.querySelectorAll(".tab-content");
    contents.forEach(content => content.classList.add("hidden"));

    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => item.classList.remove("active"));

    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.remove("hidden");
    }

    const activeBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (activeBtn) {
        activeBtn.classList.add("active");
    }

    // Tab actions
    if (tabId === "dashboard-view") {
        updateDashboardStats();
    } else if (tabId === "entry-view") {
        prepareEntryForm(false);
    } else if (tabId === "register-view") {
        renderLoanRegister();
    } else if (tabId === "daily-vouchers-view") {
        prepareDailyVouchersView();
    } else if (tabId === "branch-master-view") {
        renderBranchMasterList();
    } else if (tabId === "valuer-master-view") {
        renderValuerMasterList();
    } else if (tabId === "customer-master-view") {
        renderCustomerMasterList();
    } else if (tabId === "product-master-view") {
        renderProductMasterList();
    } else if (tabId === "settings-view") {
        renderSettings();
    }
}

// ==================== AUTH & SESSION ====================
function initAuth() {
    const loginForm = document.getElementById("login-form");
    const loginBranchSelect = document.getElementById("login-branch");
    const loginPasswordInput = document.getElementById("login-password");
    const togglePasswordBtn = document.getElementById("toggle-password-btn");
    const loginError = document.getElementById("login-error");
    const logoutBtn = document.getElementById("logout-btn");

    function populateLoginBranches() {
        if (!state.branches || state.branches.length === 0) {
            state.branches = [...INITIAL_BRANCHES];
        }
        const currentVal = loginBranchSelect.value || "99";
        loginBranchSelect.innerHTML = "";
        state.branches.forEach(branch => {
            const option = document.createElement("option");
            option.value = branch.code.toString();
            option.textContent = `${branch.code} ${branch.name}`;
            loginBranchSelect.appendChild(option);
        });
        loginBranchSelect.value = currentVal;
    }

    populateLoginBranches();

    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener("click", () => {
            const type = loginPasswordInput.type === "password" ? "text" : "password";
            loginPasswordInput.type = type;
            const icon = togglePasswordBtn.querySelector("i");
            if (icon) icon.className = type === "password" ? "fa-solid fa-eye" : "fa-solid fa-eye-slash";
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const selectedBranchCode = (loginBranchSelect.value || "").toString().trim();
            const enteredPassword = (loginPasswordInput.value || "").toString().trim();

            if (!selectedBranchCode) {
                alert("Please select a branch.");
                return;
            }

            let branch = state.branches.find(b => b.code.toString() === selectedBranchCode);
            if (!branch) {
                branch = INITIAL_BRANCHES.find(b => b.code.toString() === selectedBranchCode);
                if (branch && !state.branches.some(b => b.code.toString() === branch.code.toString())) {
                    state.branches.push(branch);
                }
            }
            if (!branch) {
                branch = { code: selectedBranchCode, name: selectedBranchCode === "99" ? "HEAD OFFICE" : `BRANCH ${selectedBranchCode}` };
            }

            let isValid = false;
            if (selectedBranchCode === "99") {
                isValid = (enteredPassword === "Rahul#80810");
            } else {
                isValid = (enteredPassword === "Admin@123");
            }

            if (isValid) {
                if (loginError) loginError.classList.add("hidden");
                state.currentSession = branch;
                saveState();
                enterApp();
            } else {
                if (loginError) loginError.classList.remove("hidden");
                alert("Incorrect Password! Please enter the correct branch password.");
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            state.currentSession = null;
            saveState();
            exitApp();
        });
    }
}

function enterApp() {
    try {
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

        const userBranchElem = document.getElementById("current-user-branch");
        const welcomeBranchElem = document.getElementById("welcome-branch-name");
        if (userBranchElem && state.currentSession) {
            userBranchElem.textContent = `${state.currentSession.code} ${state.currentSession.name}`;
        }
        if (welcomeBranchElem && state.currentSession) {
            welcomeBranchElem.textContent = state.currentSession.name;
        }
        
        // RBAC Nav Menu
        const isAdmin = (state.currentSession && state.currentSession.code.toString() === "99");
        const branchMasterNav = document.getElementById("branch-master-nav");
        const productMasterNav = document.getElementById("product-master-nav");
        const mastersNavDivider = document.getElementById("masters-nav-divider");
        
        if (isAdmin) {
            if (branchMasterNav) branchMasterNav.classList.remove("hidden");
            if (productMasterNav) productMasterNav.classList.remove("hidden");
            if (mastersNavDivider) mastersNavDivider.classList.remove("hidden");
        } else {
            if (branchMasterNav) branchMasterNav.classList.add("hidden");
            if (productMasterNav) productMasterNav.classList.add("hidden");
        }
        
        configureChargeInputsAccess();
        updateDashboardStats();
        startClock();
        switchTab("dashboard-view");
    } catch (err) {
        console.error("Error entering app:", err);
    }
}

function configureChargeInputsAccess() {
    const isHO = (state.currentSession && state.currentSession.code.toString() === "99");
    const chargeInputs = [
        "charge-share-a",
        "charge-share-b",
        "charge-member-fee",
        "charge-valuation",
        "charge-stamp",
        "charge-service",
        "charge-document",
        "charge-insurance",
        "charge-cgst",
        "charge-sgst"
    ];

    chargeInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            if (isHO) {
                input.readOnly = false;
                input.classList.add("admin-editable");
            } else {
                input.readOnly = true;
                input.classList.remove("admin-editable");
            }
        }
    });
}

function exitApp() {
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
    const passwordInput = document.getElementById("login-password");
    if (passwordInput) passwordInput.value = "";
    const loginError = document.getElementById("login-error");
    if (loginError) loginError.classList.add("hidden");
}

function startClock() {
    const headerDate = document.getElementById("header-date");
    const headerTime = document.getElementById("header-time");

    function updateTime() {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        headerDate.textContent = `${dd}-${mm}-${yyyy}`;

        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        headerTime.textContent = `${hours}:${minutes} ${ampm}`;
    }

    updateTime();
    setInterval(updateTime, 1000 * 60);
}

// ==================== DASHBOARD VIEW ====================
function updateDashboardStats() {
    const totalAmountElem = document.getElementById("stat-total-amount");
    const totalAccountsElem = document.getElementById("stat-total-accounts");
    const totalWeightElem = document.getElementById("stat-total-weight");
    const totalValuersElem = document.getElementById("stat-total-valuers");
    const branchOnlyLoansElem = document.getElementById("stat-branch-only-loans");

    const isHeadOffice = (state.currentSession.code === "99");
    const viewLoans = isHeadOffice 
        ? state.loans 
        : state.loans.filter(l => l.branchCode === state.currentSession.code);

    branchOnlyLoansElem.textContent = isHeadOffice ? "All Branches Combined" : `Branch ${state.currentSession.code} Data`;

    const totalAmount = viewLoans.reduce((sum, item) => sum + parseFloat(item.loanAmount || 0), 0);
    const totalAccounts = viewLoans.length;
    const totalWeight = viewLoans.reduce((sum, item) => sum + parseFloat(item.goldWeight || 0), 0);
    const totalValuers = state.valuers.length;

    totalAmountElem.textContent = `₹${totalAmount.toLocaleString("en-IN")}`;
    totalAccountsElem.textContent = totalAccounts;
    totalWeightElem.textContent = `${totalWeight.toFixed(3)} g`;
    totalValuersElem.textContent = totalValuers;

    const todayStr = getTodayDateStr();
    const currentRate = state.goldRates[todayStr] || "";
    const rateInput = document.getElementById("dashboard-gold-rate");
    const saveRateBtn = document.getElementById("save-gold-rate-btn");
    const rateNote = document.querySelector(".rate-note");

    rateInput.value = currentRate;

    if (!isHeadOffice) {
        rateInput.disabled = true;
        saveRateBtn.disabled = true;
        saveRateBtn.style.display = "none";
        if (rateNote) {
            rateNote.textContent = currentRate 
                ? "* Today's gold rate set by Head Office." 
                : "* Today's gold rate has not been set by Head Office yet.";
        }
    } else {
        saveRateBtn.style.display = "inline-flex";
        if (currentRate) {
            rateInput.disabled = true;
            saveRateBtn.disabled = true;
            if (rateNote) {
                rateNote.textContent = "* Today's gold rate is locked.";
            }
        } else {
            rateInput.disabled = false;
            saveRateBtn.disabled = false;
            if (rateNote) {
                rateNote.textContent = "* Set once per calendar date (Locked for the day once saved)";
            }
        }
    }

    saveRateBtn.onclick = () => {
        if (!isHeadOffice) return;
        const rateVal = parseInt(rateInput.value);
        if (rateVal && rateVal > 1000) {
            state.goldRates[todayStr] = rateVal;
            saveState();
            alert(`Today's gold rate ₹${rateVal}/10g saved.`);
            updateDashboardStats();
            prepareEntryForm(false);
        } else {
            alert("Please enter a valid gold rate!");
        }
    };

    renderDashboardRecentTable(viewLoans);
}

function renderDashboardRecentTable(loansList) {
    const tbody = document.querySelector("#dashboard-recent-table tbody");
    tbody.innerHTML = "";

    const recent = [...loansList].reverse().slice(0, 5);

    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No loans created today.</td></tr>`;
        return;
    }

    recent.forEach(loan => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${loan.accountNo}</strong></td>
            <td>${loan.borrowerName}</td>
            <td><span class="gold-badge">${loan.productCode}</span></td>
            <td>₹${parseFloat(loan.loanAmount).toLocaleString("en-IN")}</td>
            <td>Packet #${loan.packetNo}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ==================== ORNAMENTS VALUATION TABLE ====================
function initOrnamentsTable() {
    const addBtn = document.getElementById("btn-add-ornament-row");
    if (addBtn && !addBtn.dataset.bound) {
        addBtn.dataset.bound = "true";
        addBtn.addEventListener("click", () => {
            addOrnamentRow();
        });
    }
}

function addOrnamentRow(item = null) {
    const tbody = document.getElementById("ornaments-table-tbody");
    if (!tbody) return;

    const rowCount = tbody.children.length;
    if (rowCount >= 10) {
        alert("વધુમાં વધુ ૧૦ દાગીના ઉમેરી શકાય છે.");
        return;
    }

    const row = document.createElement("tr");
    const srNo = rowCount + 1;

    const descVal = item ? (item.desc || "") : "";
    const pcsVal = item ? (item.pcs !== undefined ? item.pcs : 1) : 1;
    const grossGmVal = item ? (item.grossGm || "") : "";
    const grossMgVal = item ? (item.grossMg || "") : "";
    const netGmVal = item ? (item.netGm || "") : "";
    const netMgVal = item ? (item.netMg || "") : "";
    const purityVal = item ? (item.purity || "22 Kt") : "22 Kt";
    const valVal = item ? (item.val || "") : "";

    row.innerHTML = `
        <td class="orn-sr" style="text-align: center; font-weight: 700; font-size: 13px;">${srNo}</td>
        <td><input type="text" class="orn-desc" placeholder="e.g. સોનાની બંગડી" value="${descVal}" style="width: 100%;"></td>
        <td><input type="number" class="orn-pcs" min="1" value="${pcsVal}" style="width: 100%; text-align: center;"></td>
        <td><input type="number" class="orn-gross-gm" step="0.001" min="0" placeholder="0.000" value="${grossGmVal}" style="width: 100%; text-align: right;"></td>
        <td><input type="number" class="orn-gross-mg" step="1" min="0" max="999" placeholder="0" value="${grossMgVal}" style="width: 100%; text-align: right;"></td>
        <td><input type="number" class="orn-net-gm" step="0.001" min="0" placeholder="0.000" value="${netGmVal}" style="width: 100%; text-align: right;"></td>
        <td><input type="number" class="orn-net-mg" step="1" min="0" max="999" placeholder="0" value="${netMgVal}" style="width: 100%; text-align: right;"></td>
        <td>
            <select class="orn-purity" style="width: 100%;">
                <option value="22 Kt" ${purityVal === "22 Kt" ? "selected" : ""}>22 Kt</option>
                <option value="20 Kt" ${purityVal === "20 Kt" ? "selected" : ""}>20 Kt</option>
                <option value="18 Kt" ${purityVal === "18 Kt" ? "selected" : ""}>18 Kt</option>
                <option value="24 Kt" ${purityVal === "24 Kt" ? "selected" : ""}>24 Kt</option>
            </select>
        </td>
        <td><input type="number" class="orn-val" min="0" placeholder="0.00" value="${valVal}" style="width: 100%; text-align: right;"></td>
        <td style="text-align: center;">
            <button type="button" class="btn-icon-red" title="કાઢી નાખો" onclick="removeOrnamentRow(this)">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </td>
    `;

    tbody.appendChild(row);

    // Live calculation events on inputs
    const inputs = row.querySelectorAll("input, select");
    inputs.forEach(input => {
        input.addEventListener("input", calculateOrnamentsTotals);
        input.addEventListener("change", calculateOrnamentsTotals);
    });

    updateOrnamentsAddButtonState();
    calculateOrnamentsTotals();
}

function removeOrnamentRow(btn) {
    const row = btn.closest("tr");
    if (!row) return;
    const tbody = document.getElementById("ornaments-table-tbody");
    row.remove();

    if (tbody.children.length === 0) {
        addOrnamentRow();
    } else {
        Array.from(tbody.children).forEach((r, idx) => {
            const srCell = r.querySelector(".orn-sr");
            if (srCell) {
                srCell.textContent = idx + 1;
            }
        });
        updateOrnamentsAddButtonState();
        calculateOrnamentsTotals();
    }
}

function updateOrnamentsAddButtonState() {
    const tbody = document.getElementById("ornaments-table-tbody");
    const addBtn = document.getElementById("btn-add-ornament-row");
    if (tbody && addBtn) {
        if (tbody.children.length >= 10) {
            addBtn.disabled = true;
            addBtn.style.opacity = "0.5";
            addBtn.style.cursor = "not-allowed";
        } else {
            addBtn.disabled = false;
            addBtn.style.opacity = "1";
            addBtn.style.cursor = "pointer";
        }
    }
}

function calculateOrnamentsTotals() {
    const tbody = document.getElementById("ornaments-table-tbody");
    if (!tbody) return;

    let totPcs = 0;
    let totGrossGm = 0;
    let totGrossMg = 0;
    let totNetGm = 0;
    let totNetMg = 0;
    let totVal = 0;
    const items = [];

    Array.from(tbody.children).forEach((r, idx) => {
        const desc = r.querySelector(".orn-desc") ? r.querySelector(".orn-desc").value.trim() : "";
        const pcs = parseInt(r.querySelector(".orn-pcs") ? r.querySelector(".orn-pcs").value : 0) || 0;
        const grossGm = parseFloat(r.querySelector(".orn-gross-gm") ? r.querySelector(".orn-gross-gm").value : 0) || 0;
        const grossMg = parseInt(r.querySelector(".orn-gross-mg") ? r.querySelector(".orn-gross-mg").value : 0) || 0;
        const netGm = parseFloat(r.querySelector(".orn-net-gm") ? r.querySelector(".orn-net-gm").value : 0) || 0;
        const netMg = parseInt(r.querySelector(".orn-net-mg") ? r.querySelector(".orn-net-mg").value : 0) || 0;
        const purity = r.querySelector(".orn-purity") ? r.querySelector(".orn-purity").value : "22 Kt";
        const val = parseFloat(r.querySelector(".orn-val") ? r.querySelector(".orn-val").value : 0) || 0;

        totPcs += pcs;
        totGrossGm += grossGm;
        totGrossMg += grossMg;
        totNetGm += netGm;
        totNetMg += netMg;
        totVal += val;

        if (desc || pcs > 0 || grossGm > 0 || netGm > 0) {
            items.push({
                sr: idx + 1,
                desc,
                pcs,
                grossGm,
                grossMg,
                netGm,
                netMg,
                purity,
                val
            });
        }
    });

    const normGrossGm = totGrossGm + Math.floor(totGrossMg / 1000);
    const normGrossMg = totGrossMg % 1000;
    const normNetGm = totNetGm + Math.floor(totNetMg / 1000);
    const normNetMg = totNetMg % 1000;
    const netTotalDecimal = normNetGm + (normNetMg / 1000);

    const totalPcsElem = document.getElementById("total-orn-pcs");
    const totalGrossGmElem = document.getElementById("total-gross-gm");
    const totalGrossMgElem = document.getElementById("total-gross-mg");
    const totalNetGmElem = document.getElementById("total-net-gm");
    const totalNetMgElem = document.getElementById("total-net-mg");
    const totalValElem = document.getElementById("total-orn-val");

    if (totalPcsElem) totalPcsElem.textContent = totPcs;
    if (totalGrossGmElem) totalGrossGmElem.textContent = normGrossGm.toFixed(3);
    if (totalGrossMgElem) totalGrossMgElem.textContent = normGrossMg;
    if (totalNetGmElem) totalNetGmElem.textContent = normNetGm.toFixed(3);
    if (totalNetMgElem) totalNetMgElem.textContent = normNetMg;
    if (totalValElem) totalValElem.textContent = `₹${totVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    // Sync Net Weight to Section 3 gold-weight
    const goldWeightInput = document.getElementById("gold-weight");
    if (goldWeightInput && netTotalDecimal > 0) {
        goldWeightInput.value = netTotalDecimal.toFixed(3);
    }

    // Sync summary string to ornaments-desc
    const ornDescInput = document.getElementById("ornaments-desc");
    if (ornDescInput && items.length > 0) {
        const summaryStr = items.map(i => i.desc ? `${i.desc}${i.pcs > 1 ? ` x${i.pcs}` : ''}` : '').filter(Boolean).join(", ");
        if (summaryStr) {
            ornDescInput.value = summaryStr;
        }
    }

    calculateCharges();
}

function getOrnamentsTableData() {
    const tbody = document.getElementById("ornaments-table-tbody");
    if (!tbody) return [];

    const items = [];
    Array.from(tbody.children).forEach((r, idx) => {
        const desc = r.querySelector(".orn-desc") ? r.querySelector(".orn-desc").value.trim() : "";
        const pcs = parseInt(r.querySelector(".orn-pcs") ? r.querySelector(".orn-pcs").value : 0) || 0;
        const grossGm = parseFloat(r.querySelector(".orn-gross-gm") ? r.querySelector(".orn-gross-gm").value : 0) || 0;
        const grossMg = parseInt(r.querySelector(".orn-gross-mg") ? r.querySelector(".orn-gross-mg").value : 0) || 0;
        const netGm = parseFloat(r.querySelector(".orn-net-gm") ? r.querySelector(".orn-net-gm").value : 0) || 0;
        const netMg = parseInt(r.querySelector(".orn-net-mg") ? r.querySelector(".orn-net-mg").value : 0) || 0;
        const purity = r.querySelector(".orn-purity") ? r.querySelector(".orn-purity").value : "22 Kt";
        const val = parseFloat(r.querySelector(".orn-val") ? r.querySelector(".orn-val").value : 0) || 0;

        if (desc || pcs > 0 || grossGm > 0 || netGm > 0) {
            items.push({
                sr: idx + 1,
                desc,
                pcs,
                grossGm,
                grossMg,
                netGm,
                netMg,
                purity,
                val
            });
        }
    });
    return items;
}

function loadOrnamentsTableData(items) {
    const tbody = document.getElementById("ornaments-table-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (items && Array.isArray(items) && items.length > 0) {
        items.slice(0, 10).forEach(item => {
            addOrnamentRow(item);
        });
    } else {
        addOrnamentRow();
    }
}

// ==================== GOLD LOAN FORM ====================
function prepareEntryForm(isFullReset = false) {
    initOrnamentsTable();
    const form = document.getElementById("gold-loan-form");
    const tbody = document.getElementById("ornaments-table-tbody");

    if (isFullReset) {
        state.editingLoanId = null;
        if (form) {
            form.reset();
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Record & Generate Voucher';
            }
        }
        currentUploadedCustPhoto = "";
        currentUploadedGoldPhoto = "";
        const custPreview = document.getElementById("cust-photo-preview");
        if (custPreview) {
            custPreview.innerHTML = `<i class="fa-regular fa-image"></i><span>No Image Chosen</span>`;
        }
        const goldPreview = document.getElementById("gold-photo-preview");
        if (goldPreview) {
            goldPreview.innerHTML = `<i class="fa-regular fa-image"></i><span>No Image Chosen</span>`;
        }
        loadOrnamentsTableData([]);
    } else {
        // Just make sure there is at least 1 ornament row if empty
        if (tbody && tbody.children.length === 0) {
            loadOrnamentsTableData([]);
        }
    }

    const loanDateInput = document.getElementById("loan-date");
    const valuerSelect = document.getElementById("valuer-select");
    const todayStr = getTodayDateStr();

    if (!loanDateInput.value) {
        loanDateInput.value = todayStr;
    }

    const prevValuer = valuerSelect.value;
    valuerSelect.innerHTML = '<option value="">-- Select Valuer --</option>';
    state.valuers.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v.id;
        opt.textContent = `${v.name} (${v.mobile})`;
        valuerSelect.appendChild(opt);
    });
    if (prevValuer && state.valuers.some(v => v.id === prevValuer)) {
        valuerSelect.value = prevValuer;
    }

    checkGoldRateForDate(loanDateInput.value || todayStr);

    if (!document.getElementById("packet-no").value) {
        autoCalculatePacketNumber(loanDateInput.value || todayStr);
    }

    const isMemberSelect = document.getElementById("is-member");
    const memberNoGroup = document.getElementById("member-no-group");
    const memberNoInput = document.getElementById("member-no");
    const isNewMemberCheck = document.getElementById("is-new-member-checkbox");

    if (isMemberSelect.value === "Yes") {
        memberNoGroup.style.display = "block";
        memberNoInput.required = true;
        if (isNewMemberCheck) isNewMemberCheck.checked = false;
    } else {
        memberNoGroup.style.display = "none";
        memberNoInput.required = false;
        if (isNewMemberCheck) isNewMemberCheck.checked = true;
    }

    loanDateInput.onchange = () => {
        checkGoldRateForDate(loanDateInput.value);
        autoCalculatePacketNumber(loanDateInput.value);
        calculateCharges();
    };

    const inputsToWatch = [
        "loan-amount",
        "gold-weight",
        "is-member"
    ];
    inputsToWatch.forEach(id => {
        const elem = document.getElementById(id);
        if (elem && !elem.dataset.calcBound) {
            elem.dataset.calcBound = "true";
            elem.addEventListener("input", calculateCharges);
            elem.addEventListener("change", calculateCharges);
        }
    });

    const categorySelect = document.getElementById("loan-category-select");
    if (categorySelect && !categorySelect.dataset.calcBound) {
        categorySelect.dataset.calcBound = "true";
        categorySelect.addEventListener("change", calculateCharges);
    }

    const chargeAdj = document.getElementById("charge-adjustment");
    if (chargeAdj && !chargeAdj.dataset.bound) {
        chargeAdj.dataset.bound = "true";
        chargeAdj.addEventListener("input", updateTotals);
        chargeAdj.addEventListener("change", updateTotals);
    }

    const resetBtn = document.getElementById("reset-loan-form-btn");
    if (resetBtn && !resetBtn.dataset.bound) {
        resetBtn.dataset.bound = "true";
        resetBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to reset the gold loan entry form?")) {
                prepareEntryForm(true);
            }
        });
    }

    isMemberSelect.onchange = () => {
        if (isMemberSelect.value === "Yes") {
            memberNoGroup.style.display = "block";
            memberNoInput.required = true;
            if (isNewMemberCheck) isNewMemberCheck.checked = false;
        } else {
            memberNoGroup.style.display = "none";
            memberNoInput.required = false;
            memberNoInput.value = "";
            if (isNewMemberCheck) isNewMemberCheck.checked = true;
        }
        calculateCharges();
    };

    const inlineSaveBtn = document.getElementById("inline-save-rate-btn");
    const inlineRateInput = document.getElementById("inline-gold-rate");
    if (inlineSaveBtn && !inlineSaveBtn.dataset.bound) {
        inlineSaveBtn.dataset.bound = "true";
        inlineSaveBtn.onclick = (e) => {
            e.preventDefault();
            const targetDate = loanDateInput.value;
            const rateVal = parseInt(inlineRateInput.value);
            if (rateVal && rateVal > 1000) {
                state.goldRates[targetDate] = rateVal;
                saveState();
                checkGoldRateForDate(targetDate);
                calculateCharges();
            } else {
                alert("Please enter a valid gold rate.");
            }
        };
    }

    const custNoInput = document.getElementById("cust-no");
    if (custNoInput && !custNoInput.dataset.bound) {
        custNoInput.dataset.bound = "true";
        const handleLookup = () => {
            const custNo = custNoInput.value.trim();
            if (custNo) {
                const customer = state.customers.find(c => c.custNo === custNo);
                if (customer) {
                    document.getElementById("cust-name").value = customer.name || "";
                    document.getElementById("cust-address").value = customer.address || "";
                    document.getElementById("cust-savings-ac").value = customer.savingsAc || "";
                    document.getElementById("cust-age").value = customer.age || "";
                    document.getElementById("cust-occupation").value = customer.occupation || "";
                    document.getElementById("cust-religion").value = customer.religion || "";
                    document.getElementById("cust-mobile").value = customer.mobile || "";
                    document.getElementById("cust-nominee-name").value = customer.nomineeName || "";
                    document.getElementById("cust-nominee-relation").value = customer.nomineeRelation || "";
                    
                    if (customer.photo) {
                        currentUploadedCustPhoto = customer.photo;
                        document.getElementById("cust-photo-preview").innerHTML = `<img src="${customer.photo}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" />`;
                    }
                }
            }
        };
        custNoInput.addEventListener("blur", handleLookup);
        custNoInput.addEventListener("change", handleLookup);
    }

    calculateCharges();
}

function checkGoldRateForDate(dateStr) {
    const rateWarningAlert = document.getElementById("rate-missing-alert");
    const valRateDisplay = document.getElementById("val-rate-display");
    const rate = state.goldRates[dateStr] || null;

    if (rate) {
        if (rateWarningAlert) rateWarningAlert.classList.add("hidden");
        if (valRateDisplay) valRateDisplay.textContent = `₹${rate.toLocaleString("en-IN")}`;
    } else {
        if (rateWarningAlert) rateWarningAlert.classList.remove("hidden");
        if (valRateDisplay) valRateDisplay.textContent = `₹0 (Not Set)`;
        
        const isHO = (state.currentSession && state.currentSession.code === "99");
        const inlineInput = document.getElementById("inline-gold-rate");
        const inlineBtn = document.getElementById("inline-save-rate-btn");
        const warningText = rateWarningAlert ? rateWarningAlert.querySelector("span") : null;
        
        if (isHO) {
            if (inlineInput) inlineInput.style.display = "inline-block";
            if (inlineBtn) inlineBtn.style.display = "inline-block";
            if (warningText) {
                warningText.innerHTML = `<strong>Warning:</strong> Gold market rate is not set for today. Set rate in dashboard or enter here:`;
            }
        } else {
            if (inlineInput) inlineInput.style.display = "none";
            if (inlineBtn) inlineBtn.style.display = "none";
            if (warningText) {
                warningText.innerHTML = `<strong>Warning:</strong> Today's gold market rate is not set by the Head Office. Please contact Head Office to set the rate.`;
            }
        }
    }
}

function autoCalculatePacketNumber(dateStr) {
    const packetNoInput = document.getElementById("packet-no");
    if (!packetNoInput) return;
    
    // If editing a loan, preserve its packet number and do not auto-calculate.
    if (state.editingLoanId) {
        const loan = state.loans.find(l => l.id === state.editingLoanId);
        if (loan) {
            packetNoInput.value = loan.packetNo;
            return;
        }
    }
    
    const branchCode = state.currentSession ? state.currentSession.code : "99";
    
    let seed = 100;
    if (state.lastPacketSeed && state.lastPacketSeed[branchCode] !== undefined) {
        seed = parseInt(state.lastPacketSeed[branchCode]) || 100;
    }
    
    let maxPacket = seed;
    
    state.loans.forEach(loan => {
        if (loan.branchCode === branchCode) {
            const pNum = parseInt(loan.packetNo);
            if (!isNaN(pNum) && pNum > maxPacket) {
                maxPacket = pNum;
            }
        }
    });

    packetNoInput.value = maxPacket + 1;
}

function calculateCharges() {
    const loanAmountInput = document.getElementById("loan-amount");
    const goldWeightInput = document.getElementById("gold-weight");
    const loanDateVal = document.getElementById("loan-date") ? document.getElementById("loan-date").value : getTodayDateStr();
    const isMember = document.getElementById("is-member") ? document.getElementById("is-member").value : "No";

    const amount = parseFloat(loanAmountInput ? loanAmountInput.value : 0) || 0;
    const weight = parseFloat(goldWeightInput ? goldWeightInput.value : 0) || 0;
    const marketRate = state.goldRates[loanDateVal] || 0;

    // Amount in Words
    const wordsInput = document.getElementById("loan-amount-words");
    if (wordsInput) {
        wordsInput.value = amount > 0 ? numberToGujaratiWords(amount) : "";
    }

    let matchedProduct = null;
    const matchingProducts = state.products.filter(p => amount >= p.minAmt && amount <= p.maxAmt);
    
    if (matchingProducts.length > 0) {
        matchedProduct = matchingProducts[0];
    }

    const categoryDisplay = document.getElementById("loan-category-display");
    const categorySelect = document.getElementById("loan-category-select");
    const rateDisplay = document.getElementById("interest-rate-display");
    const acNoInput = document.getElementById("loan-ac-no");

    let productCode = "";
    let interestRateVal = "";

    if (amount > 200000) {
        if (categoryDisplay) categoryDisplay.classList.add("hidden");
        if (categorySelect) categorySelect.classList.remove("hidden");
        productCode = categorySelect ? categorySelect.value : "";
        const matchingProd = state.products.find(p => p.code === productCode && amount >= p.minAmt && amount <= p.maxAmt);
        if (matchingProd) {
            interestRateVal = `${matchingProd.rate.toFixed(2)}%`;
        } else {
            interestRateVal = "11.50%";
        }
    } else {
        if (categoryDisplay) categoryDisplay.classList.remove("hidden");
        if (categorySelect) categorySelect.classList.add("hidden");
        
        if (matchedProduct && amount > 0) {
            if (categoryDisplay) categoryDisplay.value = matchedProduct.code;
            productCode = matchedProduct.code;
            interestRateVal = `${matchedProduct.rate.toFixed(2)}%`;
        } else {
            if (categoryDisplay) categoryDisplay.value = "";
            productCode = "";
            interestRateVal = "";
        }
    }

    if (productCode && amount > 0) {
        if (rateDisplay) rateDisplay.value = interestRateVal;
        
        if (acNoInput) {
            if (state.editingLoanId) {
                const loan = state.loans.find(l => l.id === state.editingLoanId);
                if (loan && loan.productCode === productCode) {
                    acNoInput.value = loan.accountNo;
                } else {
                    acNoInput.value = generateNextAccountNumber(productCode);
                }
            } else {
                acNoInput.value = generateNextAccountNumber(productCode);
            }
        }
    } else {
        if (rateDisplay) rateDisplay.value = "";
        if (acNoInput) acNoInput.value = "";
    }

    const marketValue = Math.round((weight / 10) * marketRate);
    const eligibleAmount = Math.round(marketValue * 0.75);
    
    const marketValDisplay = document.getElementById("val-market-val-display");
    const eligibleDisplay = document.getElementById("val-eligible-display");
    const ltvDisplay = document.getElementById("val-ltv-display");
    const marginDisplay = document.getElementById("val-margin-display");

    if (marketValDisplay) marketValDisplay.textContent = `₹${marketValue.toLocaleString("en-IN")}`;
    if (eligibleDisplay) eligibleDisplay.textContent = `₹${eligibleAmount.toLocaleString("en-IN")}`;

    let ltv = 0;
    let margin = 100;
    if (marketValue > 0) {
        ltv = Math.round((amount / marketValue) * 100);
        margin = Math.max(0, 100 - ltv);
    }
    if (ltvDisplay) ltvDisplay.textContent = `${ltv}%`;
    if (marginDisplay) marginDisplay.textContent = `${margin}%`;

    const ltvWarning = document.getElementById("ltv-warning-badge");
    if (ltvWarning) {
        if (ltv > 75) {
            ltvWarning.classList.remove("hidden");
        } else {
            ltvWarning.classList.add("hidden");
        }
    }

    let shareA = 0;
    let shareB = 0;
    let memberFee = 0;
    let valuationCharge = 0;
    let stampCharge = 0;
    let serviceCharge = 0;
    let docCharge = 0;
    let insCharge = 0;

    if (amount > 0) {
        // Non-member rules: Fixed ₹25 member fee; Share B is ₹50 if loan <= 50,000; Share A is ₹500 if loan > 50,000
        if (isMember === "No") {
            memberFee = 25;
            if (amount > 50000) {
                shareA = 500;
                shareB = 0;
            } else {
                shareA = 0;
                shareB = 50;
            }
        } else {
            // Already a member
            shareA = 0;
            shareB = 0;
            memberFee = 0;
        }

        // Valuation Fee (0.25% of loan, rounded up to nearest 5)
        if (amount <= 25000) {
            valuationCharge = 100;
        } else if (amount <= 50000) {
            valuationCharge = 150;
        } else if (amount <= 100000) {
            valuationCharge = 250;
        } else if (amount <= 500000) {
            valuationCharge = Math.min(1000, roundUpTo5(amount * 0.25 / 100));
        } else if (amount <= 1000000) {
            valuationCharge = Math.min(1500, roundUpTo5(amount * 0.25 / 100));
        } else {
            valuationCharge = Math.min(2000, roundUpTo5(amount * 0.25 / 100));
        }

        // Stamp Charge
        if (amount <= 50000) {
            stampCharge = 0;
        } else {
            const calculated = roundTo10(Math.round(amount * 0.25 / 100));
            stampCharge = Math.min(300, calculated);
        }

        // Extra Stamp Charge for 3553 (Overdraft) scheme when loan amount is > 200k
        if (amount > 200000 && productCode === "3553") {
            stampCharge += 300;
        }

        // Service Charge
        if (amount <= 200000) {
            serviceCharge = Math.min(500, roundTo10(Math.round(amount * 0.25 / 100)));
        } else {
            serviceCharge = Math.min(5000, roundTo10(Math.round(amount * 0.50 / 100)));
        }

        // Document Charge
        if (amount <= 100000) {
            docCharge = 50;
        } else if (amount <= 200000) {
            docCharge = 100;
        } else {
            docCharge = 200;
        }

        // Insurance Charge
        if (amount <= 200000) {
            insCharge = 50;
        } else {
            insCharge = 100;
        }
    }

    // GST (9% CGST + 9% SGST on Service Charge, rounded to nearest rupee)
    const cgst = Math.round(serviceCharge * 9 / 100);
    const sgst = cgst;

    if (document.getElementById("charge-share-a")) document.getElementById("charge-share-a").value = shareA;
    if (document.getElementById("charge-share-b")) document.getElementById("charge-share-b").value = shareB;
    if (document.getElementById("charge-member-fee")) document.getElementById("charge-member-fee").value = memberFee;
    if (document.getElementById("charge-valuation")) document.getElementById("charge-valuation").value = valuationCharge;
    if (document.getElementById("charge-stamp")) document.getElementById("charge-stamp").value = stampCharge;
    if (document.getElementById("charge-service")) document.getElementById("charge-service").value = serviceCharge;
    if (document.getElementById("charge-document")) document.getElementById("charge-document").value = docCharge;
    if (document.getElementById("charge-insurance")) document.getElementById("charge-insurance").value = insCharge;
    if (document.getElementById("charge-cgst")) document.getElementById("charge-cgst").value = cgst;
    if (document.getElementById("charge-sgst")) document.getElementById("charge-sgst").value = sgst;

    updateTotals();
}

function updateTotals() {
    const loanAmountInput = document.getElementById("loan-amount");
    const amount = parseFloat(loanAmountInput ? loanAmountInput.value : 0) || 0;

    const shareA = parseFloat(document.getElementById("charge-share-a") ? document.getElementById("charge-share-a").value : 0) || 0;
    const shareB = parseFloat(document.getElementById("charge-share-b") ? document.getElementById("charge-share-b").value : 0) || 0;
    const memberFee = parseFloat(document.getElementById("charge-member-fee") ? document.getElementById("charge-member-fee").value : 0) || 0;
    const valuationCharge = parseFloat(document.getElementById("charge-valuation") ? document.getElementById("charge-valuation").value : 0) || 0;
    const stampCharge = parseFloat(document.getElementById("charge-stamp") ? document.getElementById("charge-stamp").value : 0) || 0;
    const serviceCharge = parseFloat(document.getElementById("charge-service") ? document.getElementById("charge-service").value : 0) || 0;
    const docCharge = parseFloat(document.getElementById("charge-document") ? document.getElementById("charge-document").value : 0) || 0;
    const insCharge = parseFloat(document.getElementById("charge-insurance") ? document.getElementById("charge-insurance").value : 0) || 0;
    const cgst = parseFloat(document.getElementById("charge-cgst") ? document.getElementById("charge-cgst").value : 0) || 0;
    const sgst = parseFloat(document.getElementById("charge-sgst") ? document.getElementById("charge-sgst").value : 0) || 0;
    const adjustment = parseFloat(document.getElementById("charge-adjustment") ? document.getElementById("charge-adjustment").value : 0) || 0;

    const totalDeductions = shareA + shareB + memberFee + valuationCharge + stampCharge + serviceCharge + docCharge + insCharge + cgst + sgst + adjustment;
    const roundedTotalDeductions = Math.round(totalDeductions * 100) / 100;
    if (document.getElementById("charge-total")) document.getElementById("charge-total").value = roundedTotalDeductions;

    const netDisbursal = Math.max(0, amount - roundedTotalDeductions);
    const roundedNetDisbursal = Math.round(netDisbursal * 100) / 100;

    const summarySanctioned = document.getElementById("summary-sanctioned-amt");
    const summaryDeductions = document.getElementById("summary-deductions-amt");
    const summaryNet = document.getElementById("summary-net-disbursal");

    if (summarySanctioned) summarySanctioned.textContent = `₹${amount.toLocaleString("en-IN")}`;
    if (summaryDeductions) summaryDeductions.textContent = `₹${roundedTotalDeductions.toLocaleString("en-IN")}`;
    if (summaryNet) summaryNet.textContent = `₹${roundedNetDisbursal.toLocaleString("en-IN")}`;
}

function generateNextAccountNumber(schemeCode) {
    let branchCode = state.currentSession ? state.currentSession.code : "99";
    if (state.editingLoanId) {
        const loan = state.loans.find(l => l.id === state.editingLoanId);
        if (loan) {
            branchCode = loan.branchCode;
        }
    }
    
    // Get seed for this branch and scheme
    let seed = 1001;
    if (state.accountSeeds[branchCode] && state.accountSeeds[branchCode][schemeCode] !== undefined) {
        seed = parseInt(state.accountSeeds[branchCode][schemeCode]);
    } else {
        seed = DEFAULT_ACCOUNT_SEEDS[schemeCode] || 1001;
    }
    
    let maxSerial = seed - 1;

    // Filter loans for this branch AND this scheme
    state.loans.forEach(loan => {
        if (loan.branchCode === branchCode && loan.productCode === schemeCode) {
            let num = 0;
            if (loan.accountNo.includes("-")) {
                const parts = loan.accountNo.split("-");
                num = parseInt(parts[parts.length - 1]);
            } else {
                num = parseInt(loan.accountNo);
            }
            if (!isNaN(num) && num > maxSerial) {
                maxSerial = num;
            }
        }
    });

    const nextNum = maxSerial + 1;
    return `${schemeCode}-${nextNum}`;
}

// Save Entry Form
function initFormSubmit() {
    const form = document.getElementById("gold-loan-form");
    
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const dateStr = document.getElementById("loan-date").value;
        const rate = state.goldRates[dateStr] || 0;
        if (rate <= 0) {
            alert("Error: Gold market rate is not set for this date! Configure it before saving.");
            return;
        }

        const valuerId = document.getElementById("valuer-select").value;
        if (!valuerId) {
            alert("Please select a Soni Valuer.");
            return;
        }

        const amount = parseFloat(document.getElementById("loan-amount").value);
        const weight = parseFloat(document.getElementById("gold-weight").value);
        const marketValue = Math.round((weight / 10) * rate);
        if (amount > marketValue * 0.75) {
            const confirmLTV = confirm("Warning: Loan amount exceeds 75% of gold value. Do you still want to proceed?");
            if (!confirmLTV) return;
        }

        const confirmSave = confirm(state.editingLoanId ? "Are you sure you want to update this gold loan entry?" : "Are you sure you want to save this gold loan entry?");
        if (!confirmSave) return;

        if (state.editingLoanId) {
            const index = state.loans.findIndex(l => l.id === state.editingLoanId);
            if (index !== -1) {
                // Update existing loan object
                state.loans[index] = {
                    ...state.loans[index],
                    date: dateStr,
                    uniqueProposalNo: document.getElementById("unique-proposal-no") ? document.getElementById("unique-proposal-no").value.trim() : "",
                    loanStatus: form.elements["loan-status"].value,
                    isMember: document.getElementById("is-member").value,
                    memberNo: document.getElementById("member-no").value || "-",
                    isNewMember: document.getElementById("is-new-member-checkbox").checked,
                    packetNo: document.getElementById("packet-no").value,
                    valuerId: valuerId,
                    borrowerName: document.getElementById("cust-name").value,
                    loanAmount: amount,
                    productCode: document.getElementById("loan-category-display").value,
                    accountNo: document.getElementById("loan-ac-no").value,
                    interestRate: document.getElementById("interest-rate-display").value,
                    goldWeight: weight,
                    ornamentsDesc: document.getElementById("ornaments-desc").value,
                    ornamentsItems: getOrnamentsTableData(),
                    marketRate: rate,
                    marketValue: marketValue,
                    eligibleAmount: Math.round(marketValue * 0.75),
                    
                    // Customer fields
                    custNo: document.getElementById("cust-no").value.trim(),
                    custAddress: document.getElementById("cust-address").value.trim(),
                    custSavingsAc: document.getElementById("cust-savings-ac").value.trim(),
                    custAge: parseInt(document.getElementById("cust-age").value) || 0,
                    custOccupation: document.getElementById("cust-occupation").value.trim(),
                    custReligion: document.getElementById("cust-religion").value.trim(),
                    custCaste: document.getElementById("cust-caste") ? document.getElementById("cust-caste").value.trim() : "",
                    custMobile: document.getElementById("cust-mobile").value.trim(),
                    custNomineeName: document.getElementById("cust-nominee-name").value.trim(),
                    custNomineeRelation: document.getElementById("cust-nominee-relation").value.trim(),
                    custPhoto: currentUploadedCustPhoto,
                    goldPhoto: currentUploadedGoldPhoto,
                    loanPurpose: document.getElementById("loan-purpose").value.trim(),
                    
                    // Charges
                    shareA: parseFloat(document.getElementById("charge-share-a").value) || 0,
                    shareB: parseFloat(document.getElementById("charge-share-b").value) || 0,
                    memberFee: parseFloat(document.getElementById("charge-member-fee").value) || 0,
                    valuationCharge: parseFloat(document.getElementById("charge-valuation").value) || 0,
                    stampCharge: parseFloat(document.getElementById("charge-stamp").value) || 0,
                    serviceCharge: parseFloat(document.getElementById("charge-service").value) || 0,
                    docCharge: parseFloat(document.getElementById("charge-document").value) || 0,
                    insCharge: parseFloat(document.getElementById("charge-insurance").value) || 0,
                    cgst: parseFloat(document.getElementById("charge-cgst").value) || 0,
                    sgst: parseFloat(document.getElementById("charge-sgst").value) || 0,
                    adjustment: parseFloat(document.getElementById("charge-adjustment").value) || 0,
                    totalCharges: parseFloat(document.getElementById("charge-total").value) || 0,
                    netDisbursal: amount - (parseFloat(document.getElementById("charge-total").value) || 0)
                };
                
                upsertCustomerFromForm();
                saveState();
                alert("Gold loan entry updated successfully.");
                const updatedLoan = state.loans[index];
                
                // Reset edit mode
                state.editingLoanId = null;
                
                // Restore form submit button text
                const submitBtn = form.querySelector('button[type="submit"]');
                submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Record & Generate Voucher';
                
                // Switch back to register tab to see update
                switchTab("register-view");

                // Open Print Modal
                openPrintModal(updatedLoan.id);
            }
        } else {
            const newLoan = {
                id: "loan_" + Date.now(),
                date: dateStr,
                uniqueProposalNo: document.getElementById("unique-proposal-no") ? document.getElementById("unique-proposal-no").value.trim() : "",
                branchCode: state.currentSession.code,
                branchName: state.currentSession.name,
                loanStatus: form.elements["loan-status"].value,
                isMember: document.getElementById("is-member").value,
                memberNo: document.getElementById("member-no").value || "-",
                isNewMember: document.getElementById("is-new-member-checkbox").checked,
                packetNo: document.getElementById("packet-no").value,
                valuerId: valuerId,
                borrowerName: document.getElementById("cust-name").value,
                loanAmount: amount,
                productCode: document.getElementById("loan-category-display").value,
                accountNo: document.getElementById("loan-ac-no").value,
                interestRate: document.getElementById("interest-rate-display").value,
                goldWeight: weight,
                ornamentsDesc: document.getElementById("ornaments-desc").value,
                ornamentsItems: getOrnamentsTableData(),
                marketRate: rate,
                marketValue: marketValue,
                eligibleAmount: Math.round(marketValue * 0.75),
                
                // Customer fields
                custNo: document.getElementById("cust-no").value.trim(),
                custAddress: document.getElementById("cust-address").value.trim(),
                custSavingsAc: document.getElementById("cust-savings-ac").value.trim(),
                custAge: parseInt(document.getElementById("cust-age").value) || 0,
                custOccupation: document.getElementById("cust-occupation").value.trim(),
                custReligion: document.getElementById("cust-religion").value.trim(),
                custCaste: document.getElementById("cust-caste") ? document.getElementById("cust-caste").value.trim() : "",
                custMobile: document.getElementById("cust-mobile").value.trim(),
                custNomineeName: document.getElementById("cust-nominee-name").value.trim(),
                custNomineeRelation: document.getElementById("cust-nominee-relation").value.trim(),
                custPhoto: currentUploadedCustPhoto,
                goldPhoto: currentUploadedGoldPhoto,
                loanPurpose: document.getElementById("loan-purpose").value.trim(),
                
                // Charges
                shareA: parseFloat(document.getElementById("charge-share-a").value) || 0,
                shareB: parseFloat(document.getElementById("charge-share-b").value) || 0,
                memberFee: parseFloat(document.getElementById("charge-member-fee").value) || 0,
                valuationCharge: parseFloat(document.getElementById("charge-valuation").value) || 0,
                stampCharge: parseFloat(document.getElementById("charge-stamp").value) || 0,
                serviceCharge: parseFloat(document.getElementById("charge-service").value) || 0,
                docCharge: parseFloat(document.getElementById("charge-document").value) || 0,
                insCharge: parseFloat(document.getElementById("charge-insurance").value) || 0,
                cgst: parseFloat(document.getElementById("charge-cgst").value) || 0,
                sgst: parseFloat(document.getElementById("charge-sgst").value) || 0,
                adjustment: parseFloat(document.getElementById("charge-adjustment").value) || 0,
                totalCharges: parseFloat(document.getElementById("charge-total").value) || 0,
                netDisbursal: amount - (parseFloat(document.getElementById("charge-total").value) || 0)
            };

            state.loans.push(newLoan);
            upsertCustomerFromForm();
            saveState();

            alert("Gold loan entry saved successfully.");
            
            // Open Print Modal
            openPrintModal(newLoan.id);
        }

        prepareEntryForm();
        updateDashboardStats();
    });

    document.getElementById("reset-loan-form-btn").onclick = () => {
        if (confirm("Reset all form inputs?")) {
            prepareEntryForm();
        }
    };
}

// ==================== LOAN LEDGER REGISTER ====================
function renderLoanRegister() {
    const tbody = document.getElementById("register-tbody");
    const emptyMsg = document.getElementById("register-empty-msg");
    const filterBranchSelect = document.getElementById("filter-branch");
    const filterProductSelect = document.getElementById("filter-product");

    filterBranchSelect.innerHTML = '<option value="">-- All Branches --</option>';
    state.branches.forEach(b => {
        const opt = document.createElement("option");
        opt.value = b.code;
        opt.textContent = `${b.code} ${b.name}`;
        filterBranchSelect.appendChild(opt);
    });

    filterProductSelect.innerHTML = '<option value="">-- All Schemes --</option>';
    const uniqueCodes = [...new Set(state.products.map(p => p.code))];
    uniqueCodes.forEach(code => {
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = code;
        filterProductSelect.appendChild(opt);
    });

    function runFilters() {
        const query = document.getElementById("filter-search").value.toLowerCase();
        const branchCode = filterBranchSelect.value;
        const dateFrom = document.getElementById("filter-date-from").value;
        const dateTo = document.getElementById("filter-date-to").value;
        const productCode = filterProductSelect.value;

        const isHeadOffice = (state.currentSession.code === "99");
        let list = state.loans;
        if (!isHeadOffice) {
            list = list.filter(l => l.branchCode === state.currentSession.code);
        }

        const filtered = list.filter(loan => {
            const matchesQuery = !query || 
                loan.borrowerName.toLowerCase().includes(query) || 
                loan.accountNo.toLowerCase().includes(query) || 
                loan.packetNo.toString().includes(query);
            
            const matchesBranch = !branchCode || loan.branchCode === branchCode;
            const matchesProduct = !productCode || loan.productCode === productCode;
            
            let matchesDate = true;
            if (dateFrom && loan.date < dateFrom) matchesDate = false;
            if (dateTo && loan.date > dateTo) matchesDate = false;

            return matchesQuery && matchesBranch && matchesProduct && matchesDate;
        });

        tbody.innerHTML = "";
        if (filtered.length === 0) {
            emptyMsg.classList.remove("hidden");
            return;
        }
        emptyMsg.classList.add("hidden");

        const sorted = [...filtered].reverse();

        sorted.forEach(loan => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${formatDateDMY(loan.date)}</td>
                <td><small>${loan.branchCode} ${loan.branchName.replace(" BRANCH", "")}</small></td>
                <td><strong>${loan.accountNo}</strong></td>
                <td>Packet #${loan.packetNo}</td>
                <td>${loan.borrowerName}</td>
                <td><small class="gold-badge">${loan.productCode}</small></td>
                <td>₹${parseFloat(loan.loanAmount).toLocaleString("en-IN")}</td>
                <td>${parseFloat(loan.goldWeight).toFixed(3)}g</td>
                <td>₹${parseFloat(loan.totalCharges).toLocaleString("en-IN")}</td>
                <td class="bold-text green-color">₹${parseFloat(loan.netDisbursal).toLocaleString("en-IN")}</td>
                <td>
                    <button class="btn btn-secondary-sm" onclick="openPrintModal('${loan.id}')">
                        <i class="fa-solid fa-print"></i> Print
                    </button>
                </td>
                <td>
                    ${isHeadOffice ? `
                        <div class="action-group">
                            <button class="btn-icon btn-icon-green" title="Edit" onclick="editLoanRecord('${loan.id}')">
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                            <button class="btn-icon btn-icon-red" title="Delete" onclick="deleteLoanRecord('${loan.id}')">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    ` : '<span class="text-muted">-</span>'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    const filters = ["filter-search", "filter-branch", "filter-date-from", "filter-date-to", "filter-product"];
    filters.forEach(id => {
        document.getElementById(id).oninput = runFilters;
        document.getElementById(id).onchange = runFilters;
    });

    document.getElementById("clear-filters-btn").onclick = () => {
        document.getElementById("filter-search").value = "";
        document.getElementById("filter-branch").value = "";
        document.getElementById("filter-date-from").value = "";
        document.getElementById("filter-date-to").value = "";
        document.getElementById("filter-product").value = "";
        runFilters();
    };

    document.getElementById("export-csv-btn").onclick = () => {
        exportLoansToCSV();
    };

    runFilters();
}

function deleteLoanRecord(loanId) {
    if (state.currentSession.code !== "99") {
        alert("Permission Denied: Only Head Office can delete loan records.");
        return;
    }
    const confirmDel = confirm("Warning: Are you sure you want to permanently delete this loan record?");
    if (!confirmDel) return;

    state.loans = state.loans.filter(l => l.id !== loanId);
    saveState();
    alert("Record deleted.");
    renderLoanRegister();
    updateDashboardStats();
}

function editLoanRecord(loanId) {
    if (state.currentSession.code !== "99") {
        alert("Permission Denied: Only Head Office can edit loan records.");
        return;
    }
    
    const loan = state.loans.find(l => l.id === loanId);
    if (!loan) {
        alert("Error: Loan record not found.");
        return;
    }

    state.editingLoanId = loanId;

    // Switch to entry view
    switchTab("entry-view");

    // Populate all form fields
    document.getElementById("loan-date").value = loan.date;
    
    // Set radio button for loan-status
    const statusRadios = document.getElementsByName("loan-status");
    statusRadios.forEach(radio => {
        if (radio.value === loan.loanStatus) {
            radio.checked = true;
        }
    });

    const isMemberSelect = document.getElementById("is-member");
    const memberNoGroup = document.getElementById("member-no-group");
    const memberNoInput = document.getElementById("member-no");
    const isNewMemberCheck = document.getElementById("is-new-member-checkbox");

    isMemberSelect.value = loan.isMember;
    if (loan.isMember === "Yes") {
        memberNoGroup.style.display = "block";
        memberNoInput.required = true;
        memberNoInput.value = loan.memberNo;
        isNewMemberCheck.checked = false;
    } else {
        memberNoGroup.style.display = "none";
        memberNoInput.required = false;
        memberNoInput.value = "";
        isNewMemberCheck.checked = true;
    }
    isNewMemberCheck.disabled = true;

    document.getElementById("packet-no").value = loan.packetNo;
    document.getElementById("valuer-select").value = loan.valuerId;
    
    // Customer profile fields
    if (document.getElementById("unique-proposal-no")) document.getElementById("unique-proposal-no").value = loan.uniqueProposalNo || "";
    document.getElementById("cust-no").value = loan.custNo || "";
    document.getElementById("cust-name").value = loan.borrowerName || "";
    document.getElementById("cust-address").value = loan.custAddress || "";
    document.getElementById("cust-savings-ac").value = loan.custSavingsAc || "";
    document.getElementById("cust-age").value = loan.custAge || "";
    document.getElementById("cust-occupation").value = loan.custOccupation || "";
    document.getElementById("cust-religion").value = loan.custReligion || "";
    if (document.getElementById("cust-caste")) document.getElementById("cust-caste").value = loan.custCaste || "";
    document.getElementById("cust-mobile").value = loan.custMobile || "";
    document.getElementById("cust-nominee-name").value = loan.custNomineeName || "";
    document.getElementById("cust-nominee-relation").value = loan.custNomineeRelation || "";
    document.getElementById("loan-purpose").value = loan.loanPurpose || "";

    if (loan.custPhoto) {
        currentUploadedCustPhoto = loan.custPhoto;
        document.getElementById("cust-photo-preview").innerHTML = `<img src="${loan.custPhoto}" style="width:100%; height:100%; object-fit:contain; border-radius:4px;" />`;
    } else {
        currentUploadedCustPhoto = "";
        document.getElementById("cust-photo-preview").innerHTML = `<i class="fa-regular fa-image"></i><span>No Image Chosen</span>`;
    }

    if (loan.goldPhoto) {
        currentUploadedGoldPhoto = loan.goldPhoto;
        document.getElementById("gold-photo-preview").innerHTML = `<img src="${loan.goldPhoto}" style="width:100%; height:100%; object-fit:contain; border-radius:4px;" />`;
    } else {
        currentUploadedGoldPhoto = "";
        document.getElementById("gold-photo-preview").innerHTML = `<i class="fa-regular fa-image"></i><span>No Image Chosen</span>`;
    }

    document.getElementById("loan-amount").value = loan.loanAmount;
    document.getElementById("gold-weight").value = loan.goldWeight;
    document.getElementById("ornaments-desc").value = loan.ornamentsDesc;
    document.getElementById("charge-adjustment").value = loan.adjustment;
    
    // Load Ornaments Table items
    loadOrnamentsTableData(loan.ornamentsItems);
    
    if (loan.loanAmount > 200000) {
        document.getElementById("loan-category-select").value = loan.productCode;
    }

    // Update submit button text
    const form = document.getElementById("gold-loan-form");
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fa-solid fa-check-double"></i> Update Loan Entry';

    // Recalculate charges
    calculateCharges();
}

function exportLoansToCSV() {
    const isHeadOffice = (state.currentSession.code === "99");
    let list = state.loans;
    if (!isHeadOffice) {
        list = list.filter(l => l.branchCode === state.currentSession.code);
    }

    if (list.length === 0) {
        alert("No records to export.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = [
        "Date", "Branch Code", "Branch Name", "Account No", "Packet No", 
        "Borrower Name", "Loan Status", "Member Status", "Member No", 
        "Gold Weight(g)", "Market Rate", "Market Value", "Sanctioned Amount", 
        "Valuation Charge", "Stamp Duty", "Service Charge", "Doc Charge", 
        "Insurance", "CGST", "SGST", "Adjustment", "Total Deductions", "Net Disbursed"
    ];
    csvContent += headers.join(",") + "\r\n";

    list.forEach(l => {
        const row = [
            l.date, l.branchCode, `"${l.branchName}"`, `"${l.accountNo}"`, l.packetNo,
            `"${l.borrowerName}"`, l.loanStatus, l.isMember, l.memberNo,
            l.goldWeight, l.marketRate, l.marketValue, l.loanAmount,
            l.valuationCharge, l.stampCharge, l.serviceCharge, l.docCharge,
            l.insCharge, l.cgst, l.sgst, l.adjustment, l.totalCharges, l.netDisbursal
        ];
        csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `JCCB_Gold_Loans_${getTodayDateStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==================== DAILY CREDIT VOUCHERS MANAGER ====================
function prepareDailyVouchersView() {
    const voucherDateSelect = document.getElementById("voucher-date-select");
    if (!voucherDateSelect.value) {
        voucherDateSelect.value = getTodayDateStr();
    }

    loadDailyVouchersSummary();

    document.getElementById("load-vouchers-btn").onclick = () => {
        loadDailyVouchersSummary();
    };

    document.getElementById("print-vouchers-btn").onclick = () => {
        printDailyVouchers();
    };
}

// Calculate daily aggregates
function getDailyVouchersData(dateStr) {
    const isHeadOffice = (state.currentSession.code === "99");
    
    // Filter loans by date and branch
    let dayLoans = state.loans.filter(l => l.date === dateStr);
    if (!isHeadOffice) {
        dayLoans = dayLoans.filter(l => l.branchCode === state.currentSession.code);
    }

    // Totals
    let shareA = 0;
    let shareB = 0;
    let memberFee = 0;
    let stamp = 0;
    let service = 0;
    let doc = 0;
    let insurance = 0;
    let sgst = 0;
    let cgst = 0;

    // Group valuation charges by valuer
    let valuerChargesMap = {}; // Format: { valuerId: sum }

    dayLoans.forEach(loan => {
        shareA += parseFloat(loan.shareA || 0);
        shareB += parseFloat(loan.shareB || 0);
        memberFee += parseFloat(loan.memberFee || 0);
        stamp += parseFloat(loan.stampCharge || 0);
        service += parseFloat(loan.serviceCharge || 0);
        doc += parseFloat(loan.docCharge || 0);
        insurance += parseFloat(loan.insCharge || 0);
        sgst += parseFloat(loan.sgst || 0);
        cgst += parseFloat(loan.cgst || 0);

        if (loan.valuationCharge && loan.valuationCharge > 0) {
            valuerChargesMap[loan.valuerId] = (valuerChargesMap[loan.valuerId] || 0) + parseFloat(loan.valuationCharge);
        }
    });

    // Structure GL accounts
    const voucherAccounts = [
        { key: "shareA", code: "GL-150040-SHARE APPLICATION MONEY (GROUP-A)", title: "Share Application Money (Group A)", amount: shareA },
        { key: "shareB", code: "GL-150058-SHARE APPLICATION MONEY (GROUP-B)", title: "Share Application Money (Group B)", amount: shareB },
        { key: "memberFee", code: "GL-160067-MBMBER FEE", title: "Member Fee", amount: memberFee },
        { key: "stamp", code: "GL-370065-ADHESIV STAMP ADVANCE", title: "Stamp Charges", amount: stamp },
        { key: "service", code: "GL-160063-SERVICE CHARGE INCOME", title: "Service Charge Income", amount: service },
        { key: "doc", code: "GL-160181-DOCUMENT CHARGE INCOME", title: "Document Charge Income", amount: doc },
        { key: "insurance", code: "GL-150050-INSURANCE DEPOSIT", title: "Insurance Deposit", amount: insurance },
        { key: "sgst", code: "GL-370260-SGST PAYABLE", title: "SGST Payable", amount: sgst },
        { key: "cgst", code: "GL-370261-CGST PAYABLE", title: "CGST Payable", amount: cgst }
    ];

    // Filter out accounts with zero amounts
    let activeVouchers = voucherAccounts.filter(v => v.amount > 0);

    // Append valuer vouchers
    for (let valuerId in valuerChargesMap) {
        const valuerSum = valuerChargesMap[valuerId];
        if (valuerSum > 0) {
            const valuer = state.valuers.find(v => v.id === valuerId) || { name: valuerId, savingsAc: "-" };
            activeVouchers.push({
                key: "valuer_" + valuerId,
                code: `A/C: ${valuer.savingsAc} - VALUER CHARGE`,
                title: `Valuer Valuation: ${valuer.name}`,
                amount: valuerSum,
                isValuer: true,
                valuerName: valuer.name,
                valuerAc: valuer.savingsAc
            });
        }
    }

    return activeVouchers;
}

function loadDailyVouchersSummary() {
    const tbody = document.getElementById("daily-vouchers-tbody");
    tbody.innerHTML = "";
    
    const dateStr = document.getElementById("voucher-date-select").value;
    const vouchers = getDailyVouchersData(dateStr);

    if (vouchers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No transactions or deductions found on ${formatDateDMY(dateStr)}.</td></tr>`;
        return;
    }

    vouchers.forEach(v => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${v.title}</strong></td>
            <td><code>${v.code}</code></td>
            <td class="bold-text">₹${v.amount.toLocaleString("en-IN")}.00</td>
            <td><small class="text-muted">${numberToWords(v.amount)}</small></td>
        `;
        tbody.appendChild(tr);
    });
}

function printDailyVouchers() {
    const dateStr = document.getElementById("voucher-date-select").value;
    const vouchers = getDailyVouchersData(dateStr);

    if (vouchers.length === 0) {
        alert("No transaction entries to print on this date.");
        return;
    }

    const printArea = document.getElementById("print-area");
    printArea.innerHTML = "";

    // Render A4 sheets, 3 vouchers per sheet
    let html = "";
    const vouchersPerPage = 3;
    const totalPages = Math.ceil(vouchers.length / vouchersPerPage);

    for (let page = 0; page < totalPages; page++) {
        const isLastPage = (page === totalPages - 1);
        const pageClass = isLastPage ? "print-voucher print-a4-three" : "print-voucher print-a4-three print-page-break";
        
        html += `<div class="${pageClass}">`;

        // Render 3 vouchers inside this page
        for (let i = 0; i < vouchersPerPage; i++) {
            const vIndex = (page * vouchersPerPage) + i;
            if (vIndex >= vouchers.length) {
                // Empty spacer segments to maintain proportions
                html += `<div class="three-part-segment" style="border:none; visibility:hidden;"></div>`;
                continue;
            }

            const voucher = vouchers[vIndex];
            const isLastInPage = (i === vouchersPerPage - 1);
            
            html += `
                <div class="three-part-segment">
                    <div class="voucher-print-header">
                        <div style="display:flex; align-items:center;">
                            <img src="${LOGO_SRC}" alt="JCCB Logo" class="print-bank-logo">
                            <div class="bank-info">
                                <h2 class="bank-title" style="font-size: 11px;">The Junagadh Commercial Co-operative Bank Ltd.</h2>
                                <p class="bank-subtitle" style="font-size: 8px;">Branch: ${state.currentSession.code} - ${state.currentSession.name}</p>
                            </div>
                        </div>
                        <div class="voucher-badge" style="font-size: 8.5px; padding: 2px 6px;">CASH CREDIT VOUCHER</div>
                    </div>

                    <div class="print-meta-grid-three" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 8px;">
                        <div><strong>Voucher Date:</strong> ${formatDateDMY(dateStr)}</div>
                        <div><strong>Voucher No:</strong> JV-${dateStr.replace(/-/g, "")}-${vIndex + 1}</div>
                        <div><strong>Account Head:</strong> Credits Ledger</div>
                    </div>

                    <div style="border: 1px solid #ccc; padding: 10px; font-size: 10px; margin-bottom: 5px; flex: 1; display:flex; flex-direction:column; justify-content:space-between;">
                        <div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:6px; border-bottom:1.5px solid #222; padding-bottom:4px;">
                                <span style="font-weight:700;">Account Header: ${voucher.code}</span>
                                <span style="font-weight:800; font-size:11px;">₹ ${voucher.amount.toLocaleString("en-IN")}.00</span>
                            </div>
                            <div style="font-size:9.5px; margin-bottom: 6px;">
                                <strong>Amount in Words:</strong> <em>${numberToWords(voucher.amount)}</em>
                            </div>
                        </div>
                        
                        <!-- Particulars in the middle, in larger bold font -->
                        <div style="font-size: 11px; font-weight: 700; color: #111; text-align: center; margin: 10px 0; border: 1px dashed #888; padding: 8px 6px; border-radius: 4px; background-color: #fafafa; line-height: 1.3;">
                            Particulars: Being aggregated credit sum of ${voucher.title} for Gold Loans on ${formatDateDMY(dateStr)}.
                        </div>
                    </div>

                    <div class="print-signatures-row-three" style="margin-top: 10px;">
                        <div class="sig-block" style="font-size:7px; border-top: 0.5px solid black; width: 22%;">Clerk / Cashier</div>
                        <div class="sig-block" style="font-size:7px; border-top: 0.5px solid black; width: 22%;">Officer</div>
                        <div class="sig-block" style="font-size:7px; border-top: 0.5px solid black; width: 22%;">Manager</div>
                    </div>

                    ${!isLastInPage ? `<div class="tear-line-indicator"><i class="fa-solid fa-scissors"></i> Tear here -------------------------------------------------------------</div>` : ''}
                </div>
            `;
        }

        html += `</div>`;
    }

    printArea.innerHTML = html;
    window.print();
}

// ==================== BRANCH MASTER VIEW ====================
function renderBranchMasterList() {
    const tbody = document.getElementById("branch-list-tbody");
    tbody.innerHTML = "";

    state.branches.forEach(b => {
        const tr = document.createElement("tr");
        const isHO = (b.code === "99");
        const passwordLabel = isHO ? "Rahul#80810" : "Admin@123";
        
        tr.innerHTML = `
            <td><strong>${b.code}</strong></td>
            <td>${b.name}</td>
            <td><code class="text-muted">${passwordLabel}</code></td>
            <td>
                ${isHO ? '<span class="text-muted">Read-Only</span>' : `
                    <button class="btn-icon btn-icon-red" onclick="deleteBranch('${b.code}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                `}
            </td>
        `;
        tbody.appendChild(tr);
    });

    const form = document.getElementById("branch-master-form");
    form.onsubmit = (e) => {
        e.preventDefault();
        if (state.currentSession.code !== "99") {
            alert("Error: Only Head Office can add branch records.");
            return;
        }
        const code = document.getElementById("branch-code").value.trim().padStart(2, '0');
        const name = document.getElementById("branch-name").value.trim().toUpperCase() + " BRANCH";

        if (state.branches.some(b => b.code === code)) {
            alert("This branch code already exists!");
            return;
        }

        state.branches.push({ code, name });
        
        // Initialize sequence seeds for this new branch
        if (!state.accountSeeds) state.accountSeeds = {};
        state.accountSeeds[code] = { ...DEFAULT_ACCOUNT_SEEDS };
        if (!state.lastPacketSeed) state.lastPacketSeed = {};
        state.lastPacketSeed[code] = 100;

        saveState();
        alert("Branch added successfully.");
        form.reset();
        renderBranchMasterList();
        initAuth();
    };
}

function deleteBranch(code) {
    if (state.currentSession.code !== "99") {
        alert("Error: Only Head Office can delete branch records.");
        return;
    }
    if (code === "99") return;
    if (confirm(`Are you sure you want to delete branch ${code}?`)) {
        state.branches = state.branches.filter(b => b.code !== code);
        saveState();
        renderBranchMasterList();
        initAuth();
    }
}

// ==================== VALUER MASTER VIEW ====================
function renderValuerMasterList() {
    const tbody = document.getElementById("valuer-list-tbody");
    tbody.innerHTML = "";

    state.valuers.forEach(v => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${v.name}</strong></td>
            <td>${v.mobile}</td>
            <td><small>${v.address}</small></td>
            <td><code>${v.savingsAc}</code></td>
            <td>
                <button class="btn-icon btn-icon-red" onclick="deleteValuer('${v.id}')">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const form = document.getElementById("valuer-master-form");
    form.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById("valuer-name").value.trim();
        const mobile = document.getElementById("valuer-mobile").value.trim();
        const address = document.getElementById("valuer-address").value.trim();
        const savingsAc = document.getElementById("valuer-savings-ac").value.trim();

        const newValuer = {
            id: "valuer_" + Date.now(),
            name, mobile, address, savingsAc
        };

        state.valuers.push(newValuer);
        saveState();
        alert("Valuer registered successfully.");
        form.reset();
        renderValuerMasterList();
    };
}

function deleteValuer(id) {
    if (confirm("Delete this valuer?")) {
        state.valuers = state.valuers.filter(v => v.id !== id);
        saveState();
        renderValuerMasterList();
    }
}

// ==================== PRODUCT MASTER VIEW ====================
function renderProductMasterList() {
    const tbody = document.getElementById("product-list-tbody");
    tbody.innerHTML = "";

    state.products.forEach(p => {
        const tr = document.createElement("tr");
        const limitText = p.maxAmt > 99999999 ? `₹${p.minAmt.toLocaleString("en-IN")} & Above` : `₹${p.minAmt.toLocaleString("en-IN")} to ₹${p.maxAmt.toLocaleString("en-IN")}`;
        
        tr.innerHTML = `
            <td><strong>${p.code}</strong></td>
            <td><small>${limitText}</small></td>
            <td class="bold-text">${p.rate.toFixed(2)}%</td>
            <td><small>${p.desc}</small></td>
            <td>
                <div class="action-group">
                    <button class="btn-icon btn-icon-green" onclick="editProduct('${p.id}')">
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                    <button class="btn-icon btn-icon-red" onclick="deleteProduct('${p.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const form = document.getElementById("product-master-form");
    form.onsubmit = (e) => {
        e.preventDefault();
        if (state.currentSession.code !== "99") {
            alert("Error: Only Head Office can add or modify loan products.");
            return;
        }
        const editId = document.getElementById("edit-product-id").value;
        const code = document.getElementById("prod-code").value.trim();
        const minAmt = parseFloat(document.getElementById("prod-min-amt").value) || 0;
        const maxAmt = parseFloat(document.getElementById("prod-max-amt").value) || 999999999;
        const rate = parseFloat(document.getElementById("prod-interest-rate").value) || 0;
        const desc = document.getElementById("prod-desc").value.trim();

        if (editId) {
            const index = state.products.findIndex(p => p.id === editId);
            if (index !== -1) {
                state.products[index] = { id: editId, code, minAmt, maxAmt, rate, desc };
                alert("Product updated successfully.");
            }
        } else {
            const newProduct = {
                id: "prod_" + Date.now(),
                code, minAmt, maxAmt, rate, desc
            };
            state.products.push(newProduct);
            alert("Product added successfully.");
        }

        saveState();
        form.reset();
        document.getElementById("edit-product-id").value = "";
        document.getElementById("product-save-btn").innerHTML = '<i class="fa-solid fa-save"></i> Save Product';
        document.getElementById("product-cancel-edit-btn").classList.add("hidden");
        renderProductMasterList();
    };

    document.getElementById("product-cancel-edit-btn").onclick = () => {
        form.reset();
        document.getElementById("edit-product-id").value = "";
        document.getElementById("product-save-btn").innerHTML = '<i class="fa-solid fa-save"></i> Save Product';
        document.getElementById("product-cancel-edit-btn").classList.add("hidden");
    };
}

function editProduct(id) {
    if (state.currentSession.code !== "99") {
        alert("Error: Only Head Office can edit products.");
        return;
    }
    const product = state.products.find(p => p.id === id);
    if (!product) return;

    document.getElementById("edit-product-id").value = product.id;
    document.getElementById("prod-code").value = product.code;
    document.getElementById("prod-min-amt").value = product.minAmt;
    document.getElementById("prod-max-amt").value = product.maxAmt;
    document.getElementById("prod-interest-rate").value = product.rate;
    document.getElementById("prod-desc").value = product.desc;

    document.getElementById("product-save-btn").innerHTML = '<i class="fa-solid fa-check"></i> Update Product';
    document.getElementById("product-cancel-edit-btn").classList.remove("hidden");
}

function deleteProduct(id) {
    if (state.currentSession.code !== "99") {
        alert("Error: Only Head Office can delete products.");
        return;
    }
    if (confirm("Permanently delete this product scheme?")) {
        state.products = state.products.filter(p => p.id !== id);
        saveState();
        renderProductMasterList();
    }
}

// ==================== SETTINGS CONFIGURATION ====================
function renderSettings() {
    const isHO = (state.currentSession.code === "99");
    const branchSelectGroup = document.getElementById("settings-branch-select-group");
    const branchSelect = document.getElementById("settings-branch-select");

    let targetBranchCode = state.currentSession.code;

    if (isHO) {
        branchSelectGroup.classList.remove("hidden");
        
        // Save current selection to restore it after populating
        const prevSelected = branchSelect.value;
        
        branchSelect.innerHTML = "";
        state.branches.forEach(b => {
            const opt = document.createElement("option");
            opt.value = b.code;
            opt.textContent = `${b.code} ${b.name}`;
            branchSelect.appendChild(opt);
        });

        if (prevSelected && state.branches.some(b => b.code === prevSelected)) {
            branchSelect.value = prevSelected;
        }

        targetBranchCode = branchSelect.value;

        branchSelect.onchange = () => {
            renderSettingsForBranch(branchSelect.value);
        };
    } else {
        branchSelectGroup.classList.add("hidden");
    }

    renderSettingsForBranch(targetBranchCode);

    document.getElementById("reset-system-data-btn").onclick = () => {
        const confirm1 = confirm("Warning: Are you sure you want to restore the system? This will clear all transactions, registers, and custom valuers!");
        if (confirm1) {
            const confirm2 = confirm("Final confirmation: This is a permanent delete. Proceed?");
            if (confirm2) {
                localStorage.removeItem("jccb_gold_loan_state");
                alert("Data cleared. Portal will reload.");
                location.reload();
            }
        }
    };
}

function renderSettingsForBranch(branchCode) {
    const seedsContainer = document.getElementById("account-seeds-container");
    seedsContainer.innerHTML = "";

    const uniqueSchemes = [...new Set(state.products.map(p => p.code))];
    
    // Ensure seeds nested objects exist for target branch
    if (!state.accountSeeds[branchCode]) {
        state.accountSeeds[branchCode] = { ...DEFAULT_ACCOUNT_SEEDS };
    }
    if (state.lastPacketSeed[branchCode] === undefined) {
        state.lastPacketSeed[branchCode] = 100;
    }

    uniqueSchemes.forEach(code => {
        const currentSeed = state.accountSeeds[branchCode][code] || DEFAULT_ACCOUNT_SEEDS[code] || 1001;

        const group = document.createElement("div");
        group.className = "form-group";
        group.innerHTML = `
            <label for="seed-ac-${code}">Scheme: ${code} - Starting Account Serial</label>
            <input type="number" id="seed-ac-${code}" value="${currentSeed}" required min="1">
            <small class="helper-text">Serials will start from this number (e.g. ${currentSeed})</small>
        `;
        seedsContainer.appendChild(group);
    });

    document.getElementById("seed-last-packet-no").value = state.lastPacketSeed[branchCode];

    document.getElementById("settings-accounts-form").onsubmit = (e) => {
        e.preventDefault();
        
        uniqueSchemes.forEach(code => {
            const inputVal = parseInt(document.getElementById(`seed-ac-${code}`).value);
            if (!isNaN(inputVal) && inputVal > 0) {
                state.accountSeeds[branchCode][code] = inputVal;
            }
        });

        saveState();
        alert(`Account sequence seeds for branch ${branchCode} saved.`);
        renderSettings();
    };

    document.getElementById("settings-general-form").onsubmit = (e) => {
        e.preventDefault();
        const pSeed = parseInt(document.getElementById("seed-last-packet-no").value);
        if (!isNaN(pSeed) && pSeed >= 0) {
            state.lastPacketSeed[branchCode] = pSeed;
            saveState();
            alert(`Packet serial seed for branch ${branchCode} saved.`);
            renderSettings();
        }
    };
}

// ==================== PRINT RECEIPT ENGINE ====================
function printVoucher(loanId, format) {
    const loan = state.loans.find(l => l.id === loanId);
    if (!loan) {
        alert("Error: Loan record not found.");
        return;
    }

    const valuer = state.valuers.find(v => v.id === loan.valuerId) || { name: loan.valuerId, savingsAc: "-", mobile: "-" };
    const printArea = document.getElementById("print-area");
    printArea.innerHTML = "";

    // Single Voucher (A4 Copy)
    if (format === "single") {
        printArea.innerHTML = `
            <div class="print-voucher print-a4-single">
                <div>
                    <div class="voucher-print-header">
                        <div style="display:flex; align-items:center;">
                            <img src="${LOGO_SRC}" alt="JCCB Logo" class="print-bank-logo" style="width:40px; height:40px;">
                            <div class="bank-info">
                                <h2 class="bank-title">The Junagadh Commercial Co-operative Bank Ltd.</h2>
                                <p class="bank-subtitle">Branch: ${loan.branchCode} - ${loan.branchName}</p>
                            </div>
                        </div>
                        <div class="voucher-badge">Gold Loan Sanction Slip</div>
                    </div>

                    <div class="print-meta-grid">
                        <div class="meta-item"><span class="m-label">Account Number</span><span class="m-val">${loan.accountNo}</span></div>
                        <div class="meta-item"><span class="m-label">Packet Number</span><span class="m-val">#${loan.packetNo}</span></div>
                        <div class="meta-item"><span class="m-label">Sanction Date</span><span class="m-val">${formatDateDMY(loan.date)}</span></div>
                        <div class="meta-item"><span class="m-label">Loan Type</span><span class="m-val">${loan.loanStatus}</span></div>
                        <div class="meta-item" style="grid-column: span 2;"><span class="m-label">Borrower Name</span><span class="m-val">${loan.borrowerName}</span></div>
                        <div class="meta-item"><span class="m-label">Member Status</span><span class="m-val">${loan.isMember} (No: ${loan.memberNo})</span></div>
                        <div class="meta-item"><span class="m-label">Scheme Code</span><span class="m-val">${loan.productCode}</span></div>
                    </div>

                    <div class="print-details-split">
                        <div class="print-panel-card">
                            <h4>Gold Evaluation & Valuation</h4>
                            <div class="p-row"><span>Ornaments Weight:</span><span class="p-val">${parseFloat(loan.goldWeight).toFixed(3)} Grams</span></div>
                            <div class="p-row"><span>Gold Market Rate (/10g):</span><span class="p-val">₹${parseFloat(loan.marketRate).toLocaleString("en-IN")}</span></div>
                            <div class="p-row"><span>Ornaments Market Value:</span><span class="p-val">₹${parseFloat(loan.marketValue).toLocaleString("en-IN")}</span></div>
                            <div class="p-row"><span>Max Eligible Loan (75%):</span><span class="p-val">₹${parseFloat(loan.eligibleAmount).toLocaleString("en-IN")}</span></div>
                            <div class="p-row"><span>Ornaments Description:</span><span class="p-val" style="font-size:8px;">${loan.ornamentsDesc}</span></div>
                            <div class="p-row"><span>Authorized Soni Valuer:</span><span class="p-val" style="font-size:8px;">${valuer.name}</span></div>
                        </div>

                        <div class="print-panel-card">
                            <h4>Loan Parameters</h4>
                            <div class="p-row"><span>Sanctioned Amount:</span><span class="p-val" style="font-size:12px;">₹${parseFloat(loan.loanAmount).toLocaleString("en-IN")}</span></div>
                            <div class="p-row"><span>Interest Rate (Fix):</span><span class="p-val">${loan.interestRate}</span></div>
                            <div class="p-row"><span>Valuer Savings A/c No:</span><span class="p-val">${valuer.savingsAc}</span></div>
                            <div class="p-row"><span>Valuer Mobile No:</span><span class="p-val">${valuer.mobile}</span></div>
                        </div>
                    </div>

                    <h4 style="font-size:11px; margin-bottom: 4px;">Deductions & Service Charges Breakdown</h4>
                    <table class="print-charges-table">
                        <thead>
                            <tr>
                                <th>Charge Description</th>
                                <th>Amount (₹)</th>
                                <th>Charge Description</th>
                                <th>Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Share Capital (Group A)</td>
                                <td>₹${parseFloat(loan.shareA).toFixed(2)}</td>
                                <td>Service Charges</td>
                                <td>₹${parseFloat(loan.serviceCharge).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Share Capital (Group B)</td>
                                <td>₹${parseFloat(loan.shareB).toFixed(2)}</td>
                                <td>Document Charges</td>
                                <td>₹${parseFloat(loan.docCharge).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Member Fee</td>
                                <td>₹${parseFloat(loan.memberFee).toFixed(2)}</td>
                                <td>Insurance Charges</td>
                                <td>₹${parseFloat(loan.insCharge).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Valuation Fee</td>
                                <td>₹${parseFloat(loan.valuationCharge).toFixed(2)}</td>
                                <td>CGST (9%)</td>
                                <td>₹${parseFloat(loan.cgst).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Stamp Duty</td>
                                <td>₹${parseFloat(loan.stampCharge).toFixed(2)}</td>
                                <td>SGST (9%)</td>
                                <td>₹${parseFloat(loan.sgst).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Manual Adjustment</td>
                                <td>₹${parseFloat(loan.adjustment).toFixed(2)}</td>
                                <td><strong>Total Deductions</strong></td>
                                <td><strong>₹${parseFloat(loan.totalCharges).toFixed(2)}</strong></td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="print-net-banner">
                        <span>Net Loan Disbursal Amount (Net Payable):</span>
                        <span class="disbursal-num">₹${parseFloat(loan.netDisbursal).toLocaleString("en-IN")}.00</span>
                    </div>

                    <div style="font-size: 8px; line-height: 1.4; border: 1px solid #ddd; padding: 6px; margin-top: 10px;">
                        <strong>Declaration:</strong> I/We declare that the gold ornaments pledged in the bank have been inspected and sealed in my presence. If I fail to repay the principal with interest inside the loan tenure, the bank reserves full rights to auction the pledged assets to recover outstanding debts.
                    </div>
                </div>

                <div class="print-signatures-row">
                    <div class="sig-block">Borrower Signature</div>
                    <div class="sig-block">Valuer Soni Signature</div>
                    <div class="sig-block">Cashier Signature</div>
                    <div class="sig-block">Loan Clerk</div>
                    <div class="sig-block">Branch Manager</div>
                </div>
            </div>
        `;
    }

    // 3-in-1 Voucher Template (A4 split)
    if (format === "three-in-one") {
        const segments = [
            { title: "Bank Copy", subtitle: "For Ledger Records" },
            { title: "Borrower Copy", subtitle: "To be given to customer" },
            { title: "Vault Packet Copy", subtitle: "To be kept inside sealed packet in vault" }
        ];

        let html = `<div class="print-voucher print-a4-three">`;
        
        segments.forEach((seg, idx) => {
            html += `
                <div class="three-part-segment">
                    <div class="voucher-print-header">
                        <div style="display:flex; align-items:center;">
                            <img src="${LOGO_SRC}" alt="JCCB Logo" class="print-bank-logo">
                            <div class="bank-info">
                                <h2 class="bank-title" style="font-size: 11px;">The Junagadh Commercial Co-operative Bank Ltd.</h2>
                                <p class="bank-subtitle" style="font-size: 8px;">Branch: ${loan.branchCode} - ${loan.branchName}</p>
                            </div>
                        </div>
                        <div class="voucher-badge" style="font-size: 8px; padding: 2px 6px;">${seg.title}</div>
                    </div>

                    <div class="print-meta-grid-three">
                        <div><strong>Account No:</strong> ${loan.accountNo}</div>
                        <div><strong>Packet No:</strong> #${loan.packetNo}</div>
                        <div><strong>Sanction Date:</strong> ${formatDateDMY(loan.date)}</div>
                        <div><strong>Name:</strong> ${loan.borrowerName}</div>
                        <div><strong>Member ID:</strong> ${loan.memberNo}</div>
                        <div><strong>Scheme:</strong> ${loan.productCode}</div>
                    </div>

                    <div class="print-details-split-three">
                        <div class="print-panel-card" style="padding: 4px 6px;">
                            <h4 style="font-size: 8px; margin-bottom: 2px;">Evaluation Details</h4>
                            <div class="p-row"><span>Gold Weight:</span><span class="p-val">${parseFloat(loan.goldWeight).toFixed(3)}g</span></div>
                            <div class="p-row"><span>Market Rate:</span><span class="p-val">₹${parseFloat(loan.marketRate)}</span></div>
                            <div class="p-row"><span>Market Value:</span><span class="p-val">₹${parseFloat(loan.marketValue)}</span></div>
                            <div class="p-row"><span>Inspector:</span><span class="p-val" style="font-size:7px;">${valuer.name.substring(0, 18)}</span></div>
                        </div>

                        <div class="print-panel-card" style="padding: 4px 6px;">
                            <h4 style="font-size: 8px; margin-bottom: 2px;">Financial Summary & Charges</h4>
                            <div class="p-row"><span>Sanctioned Amount:</span><span class="p-val">₹${parseFloat(loan.loanAmount).toLocaleString("en-IN")}</span></div>
                            <div class="p-row"><span>Total Deductions:</span><span class="p-val">₹${parseFloat(loan.totalCharges).toLocaleString("en-IN")}</span></div>
                            <div class="p-row"><span>Interest Rate:</span><span class="p-val">${loan.interestRate}</span></div>
                            <div class="p-row"><span>Particulars:</span><span class="p-val" style="font-size:7.5px;">${loan.ornamentsDesc.substring(0, 28)}</span></div>
                        </div>
                    </div>

                    <div class="print-net-banner-three">
                        <span>Net Loan Disbursed (Net Paid):</span>
                        <span class="disbursal-num">₹${parseFloat(loan.netDisbursal).toLocaleString("en-IN")}.00</span>
                    </div>
                    <div class="print-signatures-row-three">
                        <div class="sig-block" style="font-size:7px; border-top: 0.5px solid black; width: 22%;">Borrower Signature</div>
                        <div class="sig-block" style="font-size:7px; border-top: 0.5px solid black; width: 22%;">Valuer Signature</div>
                        <div class="sig-block" style="font-size:7px; border-top: 0.5px solid black; width: 22%;">Cashier Signature</div>
                        <div class="sig-block" style="font-size:7px; border-top: 0.5px solid black; width: 22%;">Manager Signature</div>
                    </div>

                    ${idx < 2 ? `<div class="tear-line-indicator"><i class="fa-solid fa-scissors"></i> Tear along line ----------------------------------------------------------------------</div>` : ''}
                </div>
            `;
        });
        html += `</div>`;
        printArea.innerHTML = html;
    }

    // Gujarati Loan Requisition Form Print (Awaiting user's new format)
    if (format === "application_form") {
        printArea.innerHTML = `
            <div class="print-voucher print-requisition-form" style="width:100%; box-sizing:border-box; padding:40px; font-family:'Outfit', 'Noto Sans Gujarati', sans-serif; color:#000000; text-align:center; background-color:#ffffff;">
                <div style="border: 2px dashed #94a3b8; border-radius: 8px; padding: 40px; background-color: #f8fafc;">
                    <h2 style="font-size:18px; color:#1e293b; margin-bottom:10px;">નવા લોન ડોક્યુમેન્ટનું ફોર્મેટ અહીં સેટ થશે</h2>
                    <p style="font-size:13px; color:#64748b;">(Awaiting new format from user)</p>
                </div>
            </div>
        `;
    }

    window.print();
}

function renderPrintOrnamentsTable(loan) {
    const items = (loan.ornamentsItems && loan.ornamentsItems.length > 0)
        ? loan.ornamentsItems
        : [{
            sr: 1,
            desc: loan.ornamentsDesc || "સોનાના દાગીના",
            pcs: 1,
            grossGm: parseFloat(loan.goldWeight) || 0,
            grossMg: 0,
            netGm: parseFloat(loan.goldWeight) || 0,
            netMg: 0,
            purity: "22 Kt",
            val: parseFloat(loan.marketValue) || 0
        }];

    let totalPcs = 0;
    let totalGrossGm = 0;
    let totalGrossMg = 0;
    let totalNetGm = 0;
    let totalNetMg = 0;
    let totalVal = 0;

    let rowsHtml = "";
    for (let i = 0; i < 10; i++) {
        const item = items[i];
        const gujSr = (i + 1);

        if (item) {
            const pcs = parseInt(item.pcs) || 0;
            const grossGm = parseFloat(item.grossGm) || 0;
            const grossMg = parseInt(item.grossMg) || 0;
            const netGm = parseFloat(item.netGm) || 0;
            const netMg = parseInt(item.netMg) || 0;
            const val = parseFloat(item.val) || 0;

            totalPcs += pcs;
            totalGrossGm += grossGm;
            totalGrossMg += grossMg;
            totalNetGm += netGm;
            totalNetMg += netMg;
            totalVal += val;

            rowsHtml += `
                <tr>
                    <td style="border: 1px solid #000000; padding: 2px 4px; text-align: center; font-weight: bold;">${gujSr}</td>
                    <td style="border: 1px solid #000000; padding: 2px 6px; text-align: left;">${item.desc || "-"}</td>
                    <td style="border: 1px solid #000000; padding: 2px 4px; text-align: center;">${pcs > 0 ? pcs : "-"}</td>
                    <td style="border: 1px solid #000000; padding: 2px 4px; text-align: right;">${grossGm > 0 ? grossGm.toFixed(3) : "-"}</td>
                    <td style="border: 1px solid #000000; padding: 2px 4px; text-align: right;">${grossMg > 0 ? grossMg : "-"}</td>
                    <td style="border: 1px solid #000000; padding: 2px 4px; text-align: right;">${netGm > 0 ? netGm.toFixed(3) : "-"}</td>
                    <td style="border: 1px solid #000000; padding: 2px 4px; text-align: right;">${netMg > 0 ? netMg : "-"}</td>
                    <td style="border: 1px solid #000000; padding: 2px 4px; text-align: center;">${item.purity || "-"}</td>
                    <td style="border: 1px solid #000000; padding: 2px 6px; text-align: right;">${val > 0 ? '₹' + val.toLocaleString("en-IN") : "-"}</td>
                </tr>
            `;
        } else {
            rowsHtml += `
                <tr>
                    <td style="border: 1px solid #000000; padding: 2px 4px; text-align: center; font-weight: bold;">${gujSr}</td>
                    <td style="border: 1px solid #000000; padding: 2px 6px;">&nbsp;</td>
                    <td style="border: 1px solid #000000; padding: 2px 4px;">&nbsp;</td>
                    <td style="border: 1px solid #000000; padding: 2px 4px;">&nbsp;</td>
                    <td style="border: 1px solid #000000; padding: 2px 4px;">&nbsp;</td>
                    <td style="border: 1px solid #000000; padding: 2px 4px;">&nbsp;</td>
                    <td style="border: 1px solid #000000; padding: 2px 4px;">&nbsp;</td>
                    <td style="border: 1px solid #000000; padding: 2px 4px;">&nbsp;</td>
                    <td style="border: 1px solid #000000; padding: 2px 6px;">&nbsp;</td>
                </tr>
            `;
        }
    }

    const normGrossGm = totalGrossGm + Math.floor(totalGrossMg / 1000);
    const normGrossMg = totalGrossMg % 1000;
    const normNetGm = totalNetGm + Math.floor(totalNetMg / 1000);
    const normNetMg = totalNetMg % 1000;
    const totalValStr = totalVal > 0 ? '₹' + totalVal.toLocaleString("en-IN") : (loan.marketValue > 0 ? '₹' + parseFloat(loan.marketValue).toLocaleString("en-IN") : "-");

    return `
        <table class="print-ornaments-table" style="width: 100%; border-collapse: collapse; text-align: center; font-size: 10px; border: 1.5px solid #000000; margin: 4px 0;">
            <thead>
                <tr style="background-color: #f2f2f2; border-bottom: 1.5px solid #000000;">
                    <th style="border: 1px solid #000000; padding: 3px 2px; width: 32px;" rowspan="2">ક્રમ</th>
                    <th style="border: 1px solid #000000; padding: 3px 6px; min-width: 150px;" rowspan="2">દાગીનાની વિગત</th>
                    <th style="border: 1px solid #000000; padding: 3px 4px; width: 45px;" rowspan="2">નંગ</th>
                    <th style="border: 1px solid #000000; padding: 2px 4px;" colspan="2">ગ્રોસ વજન</th>
                    <th style="border: 1px solid #000000; padding: 2px 4px;" colspan="2">નેટ વજન</th>
                    <th style="border: 1px solid #000000; padding: 3px 4px; width: 85px;" rowspan="2">શુદ્ધતા કેરેટમાં</th>
                    <th style="border: 1px solid #000000; padding: 3px 6px; width: 100px;" rowspan="2">કિંમત રૂ.</th>
                </tr>
                <tr style="background-color: #fafafa; border-bottom: 1.5px solid #000000;">
                    <th style="border: 1px solid #000000; padding: 2px; width: 60px;">ગ્રામ</th>
                    <th style="border: 1px solid #000000; padding: 2px; width: 55px;">મી.ગ્રા.</th>
                    <th style="border: 1px solid #000000; padding: 2px; width: 60px;">ગ્રામ</th>
                    <th style="border: 1px solid #000000; padding: 2px; width: 55px;">મી.ગ્રા.</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
            <tfoot>
                <tr style="background-color: #f8fafc; font-weight: 800; border-top: 1.5px solid #000000;">
                    <td colspan="2" style="border: 1px solid #000000; padding: 3px; text-align: center; font-weight: bold;">કુલ (Total)</td>
                    <td style="border: 1px solid #000000; padding: 3px; text-align: center;">${totalPcs > 0 ? totalPcs : "-"}</td>
                    <td style="border: 1px solid #000000; padding: 3px; text-align: right;">${normGrossGm > 0 ? normGrossGm.toFixed(3) : "-"}</td>
                    <td style="border: 1px solid #000000; padding: 3px; text-align: right;">${normGrossMg > 0 ? normGrossMg : "-"}</td>
                    <td style="border: 1px solid #000000; padding: 3px; text-align: right;">${normNetGm > 0 ? normNetGm.toFixed(3) : (parseFloat(loan.goldWeight) > 0 ? parseFloat(loan.goldWeight).toFixed(3) : "-")}</td>
                    <td style="border: 1px solid #000000; padding: 3px; text-align: right;">${normNetMg > 0 ? normNetMg : "-"}</td>
                    <td style="border: 1px solid #000000; padding: 3px; text-align: center;">-</td>
                    <td style="border: 1px solid #000000; padding: 3px; text-align: right; font-weight: bold;">${totalValStr}</td>
                </tr>
            </tfoot>
        </table>
    `;
}

// Convert Number to Gujarati Words
const GUJ_1_TO_99 = [
    "", "એક", "બે", "ત્રણ", "ચાર", "પાંચ", "છ", "સાત", "આઠ", "નવ", "દસ",
    "અગિયાર", "બાર", "તેર", "ચૌદ", "પંદર", "સોળ", "સત્તર", "અઢાર", "ઓગણીસ", "વીસ",
    "એકવીસ", "બાવીસ", "ત્રેવીસ", "ચોવીસ", "પચીસ", "છવીસ", "સત્તાવીસ", "અઠ્ઠાવીસ", "ઓગણત્રીસ", "ત્રીસ",
    "એકત્રીસ", "બ�function numberToGujaratiWords(amount) {
    if (!amount || amount === 0) return "રૂપિયા શૂન્ય પૂરા";
    
    function convertUnderThousand(n) {
        if (n === 0) return "";
        let str = "";
        if (n >= 100) {
            const h = Math.floor(n / 100);
            str += (GUJ_1_TO_99[h] || h) + " સો ";
            n %= 100;
        }
        if (n > 0) {
            str += (GUJ_1_TO_99[n] || n) + " ";
        }
        return str.trim();
    }

    let num = Math.floor(amount);
    let words = "";

    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;

    if (crore > 0) {
        words += (GUJ_1_TO_99[crore] || convertUnderThousand(crore)) + " કરોડ ";
    }
    if (lakh > 0) {
        words += (GUJ_1_TO_99[lakh] || convertUnderThousand(lakh)) + " લાખ ";
    }
    if (thousand > 0) {
        words += (GUJ_1_TO_99[thousand] || convertUnderThousand(thousand)) + " હજાર ";
    }
    if (num > 0) {
        words += convertUnderThousand(num) + " ";
    }

    return "રૂપિયા " + words.trim() + " પૂરા";
}�યાસી", "ચોર્યાસી", "પંચાસી", "છ્યાસી", "સત્ત્યાસી", "અઠ્યાસી", "નેવ્યાસી", "નેવું",
    "એકાણું", "બાણું", "ત્રાણું", "ચોરાણું", "પંચાણું", "છન્નું", "સત્તાણું", "અઠ્ઠાણું", "નવ્વાણું"
];

function numberToGujaratiWords(amount) {
    if (!amount || amount === 0) return "રૂપિયા શૂન્ય પૂરા";
    
    function convertUnderThousand(n) {
        if (n === 0) return "";
        let str = "";
        if (n >= 100) {
            const h = Math.floor(n / 100);
            str += (GUJ_1_TO_99[h] || h) + " સો ";
            n %= 100;
        }
        if (n > 0) {
            str += (GUJ_1_TO_99[n] || n) + " ";
        }
        return str.trim();
    }

    let num = Math.floor(amount);
    let words = "";

    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;

    if (crore > 0) {
        words += (GUJ_1_TO_99[crore] || convertUnderThousand(crore)) + " કરોડ ";
    }
    if (lakh > 0) {
        words += (GUJ_1_TO_99[lakh] || convertUnderThousand(lakh)) + " લાખ ";
    }
    if (thousand > 0) {
        words += convertLessThanThousand(thousand) + " àª¹àªœàª¾àª° ";
    }
    if (num > 0) {
        words += convertLessThanThousand(num);
    }

    return "àª°à«‚àªªàª¿àª¯àª¾ " + words.trim() + " àªªà«àª°àª¾";
}

// ==================== IMAGE COMPRESSION UTILITY ====================
function compressImage(file, callback) {
    if (!file) {
        callback(null);
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            const max_size = 300;
            if (width > height) {
                if (width > max_size) {
                    height *= max_size / width;
                    width = max_size;
                }
            } else {
                if (height > max_size) {
                    width *= max_size / height;
                    height = max_size;
                }
            }
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            callback(dataUrl);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// ==================== PHOTO UPLOADS REGISTRY ====================
function initPhotoUploads() {
    const custPhotoUpload = document.getElementById("cust-photo-upload");
    const custPhotoPreview = document.getElementById("cust-photo-preview");
    if (custPhotoUpload && custPhotoPreview) {
        custPhotoUpload.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const base64 = ev.target.result;
                    currentUploadedCustPhoto = base64;
                    custPhotoPreview.innerHTML = `<img src="${base64}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" />`;
                };
                reader.readAsDataURL(file);
            } else {
                currentUploadedCustPhoto = "";
                custPhotoPreview.innerHTML = `<i class="fa-regular fa-image"></i><span>No Image Chosen</span>`;
            }
        });
    }

    const goldPhotoUpload = document.getElementById("gold-photo-upload");
    const goldPhotoPreview = document.getElementById("gold-photo-preview");
    if (goldPhotoUpload && goldPhotoPreview) {
        goldPhotoUpload.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const base64 = ev.target.result;
                    currentUploadedGoldPhoto = base64;
                    goldPhotoPreview.innerHTML = `<img src="${base64}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" />`;
                };
                reader.readAsDataURL(file);
            } else {
                currentUploadedGoldPhoto = "";
                goldPhotoPreview.innerHTML = `<i class="fa-regular fa-image"></i><span>No Image Chosen</span>`;
            }
        });
    }

    const masterCustPhotoUpload = document.getElementById("m-cust-photo-upload");
    const masterCustPhotoPreview = document.getElementById("m-cust-photo-preview");
    if (masterCustPhotoUpload && masterCustPhotoPreview) {
        masterCustPhotoUpload.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const base64 = ev.target.result;
                    currentUploadedMasterCustPhoto = base64;
                    masterCustPhotoPreview.innerHTML = `<img src="${base64}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" />`;
                };
                reader.readAsDataURL(file);
            } else {
                currentUploadedMasterCustPhoto = "";
                masterCustPhotoPreview.innerHTML = `<i class="fa-regular fa-image"></i><span>No Photo Selected</span>`;
            }
        });
    }
}

// ==================== UNIFIED PRINT OPTIONS MODAL ====================
function openPrintModal(loanId) {
    currentPrintLoanId = loanId;
    const modal = document.getElementById("print-modal");
    if (modal) {
        modal.classList.remove("hidden");
    }
}

function closePrintModal() {
    const modal = document.getElementById("print-modal");
    if (modal) {
        modal.classList.add("hidden");
    }
    currentPrintLoanId = null;
}

function initPrintModal() {
    const closeBtn = document.getElementById("close-print-modal-btn");
    if (closeBtn) {
        closeBtn.onclick = closePrintModal;
    }

    const modal = document.getElementById("print-modal");
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                closePrintModal();
            }
        };
    }

    const btn3in1 = document.getElementById("btn-print-three-in-one");
    if (btn3in1) {
        btn3in1.onclick = () => {
            if (currentPrintLoanId) {
                printVoucher(currentPrintLoanId, "three-in-one");
                closePrintModal();
            }
        };
    }

    const btnSingle = document.getElementById("btn-print-single-a4");
    if (btnSingle) {
        btnSingle.onclick = () => {
            if (currentPrintLoanId) {
                printVoucher(currentPrintLoanId, "single");
                closePrintModal();
            }
        };
    }

    const btnAppForm = document.getElementById("btn-print-application-form");
    if (btnAppForm) {
        btnAppForm.onclick = () => {
            if (currentPrintLoanId) {
                printVoucher(currentPrintLoanId, "application_form");
                closePrintModal();
            }
        };
    }
}

// ==================== CUSTOMER MASTER DATABASE CRUD ====================
function renderCustomerMasterList() {
    const tbody = document.getElementById("customer-list-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const query = document.getElementById("customer-dir-search").value.toLowerCase();

    const filtered = state.customers.filter(c => {
        return !query || 
            c.custNo.toLowerCase().includes(query) || 
            c.name.toLowerCase().includes(query) || 
            c.mobile.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No customers found.</td></tr>`;
        return;
    }

    filtered.forEach(c => {
        const tr = document.createElement("tr");
        const photoHtml = c.photo 
            ? `<img src="${c.photo}" style="width:35px; height:35px; object-fit:cover; border-radius:50%; border:1px solid #ddd;" />`
            : `<div style="width:35px; height:35px; border-radius:50%; background:#eee; display:flex; align-items:center; justify-content:center;"><i class="fa-regular fa-user" style="font-size:12px; color:#999;"></i></div>`;
        
        tr.innerHTML = `
            <td class="text-center">${photoHtml}</td>
            <td><strong>${c.custNo}</strong></td>
            <td>${c.name}</td>
            <td>${c.mobile}</td>
            <td>${c.nomineeName || "-"} <br><small class="text-muted">${c.nomineeRelation || ""}</small></td>
            <td>
                <div class="action-group">
                    <button class="btn-icon btn-icon-green" onclick="editCustomerProfile('${c.custNo}')" title="Edit">
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                    <button class="btn-icon btn-icon-red" onclick="deleteCustomerProfile('${c.custNo}')" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function initCustomerMasterForm() {
    const form = document.getElementById("customer-master-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const editId = document.getElementById("edit-customer-id").value;
        const custNo = document.getElementById("m-cust-no").value.trim();
        const name = document.getElementById("m-cust-name").value.trim();
        const address = document.getElementById("m-cust-address").value.trim();
        const savingsAc = document.getElementById("m-cust-savings-ac").value.trim();
        const age = parseInt(document.getElementById("m-cust-age").value);
        const occupation = document.getElementById("m-cust-occupation").value.trim();
        const religion = document.getElementById("m-cust-religion").value.trim();
        const mobile = document.getElementById("m-cust-mobile").value.trim();
        const nomineeName = document.getElementById("m-cust-nominee-name").value.trim();
        const nomineeRelation = document.getElementById("m-cust-nominee-relation").value.trim();

        if (!editId) {
            const exists = state.customers.some(c => c.custNo === custNo);
            if (exists) {
                alert("Error: A customer with this Customer Number already exists!");
                return;
            }
        }

        const customerObj = {
            custNo,
            name,
            address,
            savingsAc,
            age,
            occupation,
            religion,
            mobile,
            nomineeName,
            nomineeRelation,
            photo: currentUploadedMasterCustPhoto
        };

        if (editId) {
            const index = state.customers.findIndex(c => c.custNo === editId);
            if (index !== -1) {
                if (editId !== custNo && state.customers.some(c => c.custNo === custNo)) {
                    alert("Error: The new Customer Number already exists!");
                    return;
                }
                state.customers[index] = customerObj;
                alert("Customer profile updated successfully.");
            }
        } else {
            state.customers.push(customerObj);
            alert("Customer profile registered successfully.");
        }

        saveState();
        resetCustomerMasterForm();
        renderCustomerMasterList();
    });

    const cancelBtn = document.getElementById("customer-cancel-edit-btn");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", resetCustomerMasterForm);
    }

    const customerSearch = document.getElementById("customer-dir-search");
    if (customerSearch) {
        customerSearch.addEventListener("input", renderCustomerMasterList);
    }
}

function resetCustomerMasterForm() {
    const form = document.getElementById("customer-master-form");
    if (form) form.reset();
    document.getElementById("edit-customer-id").value = "";
    document.getElementById("customer-form-title").textContent = "Register New Customer";
    document.getElementById("customer-save-btn").innerHTML = '<i class="fa-solid fa-save"></i> Save Customer Profile';
    document.getElementById("customer-cancel-edit-btn").classList.add("hidden");
    document.getElementById("m-cust-no").disabled = false;
    currentUploadedMasterCustPhoto = "";
    document.getElementById("m-cust-photo-preview").innerHTML = `<i class="fa-regular fa-image"></i><span>No Photo Selected</span>`;
}

function editCustomerProfile(custNo) {
    const customer = state.customers.find(c => c.custNo === custNo);
    if (!customer) return;

    document.getElementById("edit-customer-id").value = customer.custNo;
    document.getElementById("m-cust-no").value = customer.custNo;
    document.getElementById("m-cust-no").disabled = true;

    document.getElementById("m-cust-name").value = customer.name || "";
    document.getElementById("m-cust-address").value = customer.address || "";
    document.getElementById("m-cust-savings-ac").value = customer.savingsAc || "";
    document.getElementById("m-cust-age").value = customer.age || "";
    document.getElementById("m-cust-occupation").value = customer.occupation || "";
    document.getElementById("m-cust-religion").value = customer.religion || "";
    document.getElementById("m-cust-mobile").value = customer.mobile || "";
    document.getElementById("m-cust-nominee-name").value = customer.nomineeName || "";
    document.getElementById("m-cust-nominee-relation").value = customer.nomineeRelation || "";

    if (customer.photo) {
        currentUploadedMasterCustPhoto = customer.photo;
        document.getElementById("m-cust-photo-preview").innerHTML = `<img src="${customer.photo}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" />`;
    } else {
        currentUploadedMasterCustPhoto = "";
        document.getElementById("m-cust-photo-preview").innerHTML = `<i class="fa-regular fa-image"></i><span>No Photo Selected</span>`;
    }

    document.getElementById("customer-form-title").textContent = "Edit Customer Profile";
    document.getElementById("customer-save-btn").innerHTML = '<i class="fa-solid fa-check"></i> Update Customer Profile';
    document.getElementById("customer-cancel-edit-btn").classList.remove("hidden");
}

function deleteCustomerProfile(custNo) {
    if (confirm(`Are you sure you want to delete the profile for customer #${custNo}?`)) {
        state.customers = state.customers.filter(c => c.custNo !== custNo);
        saveState();
        renderCustomerMasterList();
    }
}

function upsertCustomerFromForm() {
    const custNo = document.getElementById("cust-no").value.trim();
    if (!custNo) return;

    const customerObj = {
        custNo: custNo,
        name: document.getElementById("cust-name").value.trim(),
        address: document.getElementById("cust-address").value.trim(),
        savingsAc: document.getElementById("cust-savings-ac").value.trim(),
        age: parseInt(document.getElementById("cust-age").value) || 0,
        occupation: document.getElementById("cust-occupation").value.trim(),
        religion: document.getElementById("cust-religion").value.trim(),
        mobile: document.getElementById("cust-mobile").value.trim(),
        nomineeName: document.getElementById("cust-nominee-name").value.trim(),
        nomineeRelation: document.getElementById("cust-nominee-relation").value.trim(),
        photo: currentUploadedCustPhoto
    };

    const index = state.customers.findIndex(c => c.custNo === custNo);
    if (index !== -1) {
        if (!customerObj.photo && state.customers[index].photo) {
            customerObj.photo = state.customers[index].photo;
        }
        state.customers[index] = customerObj;
    } else {
        state.customers.push(customerObj);
    }
    saveState();
}

window.printVoucher = printVoucher;
window.deleteLoanRecord = deleteLoanRecord;
window.editLoanRecord = editLoanRecord;
window.deleteBranch = deleteBranch;
window.deleteValuer = deleteValuer;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.openPrintModal = openPrintModal;
window.closePrintModal = closePrintModal;
window.editCustomerProfile = editCustomerProfile;
window.deleteCustomerProfile = deleteCustomerProfile;
window.removeOrnamentRow = removeOrnamentRow;
window.addOrnamentRow = addOrnamentRow;

// ==================== APP INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", () => {
    loadState();
    initTabs();
    initAuth();
    initFormSubmit();
    initPrintModal();
    initPhotoUploads();
    initCustomerMasterForm();

    if (state.currentSession) {
        enterApp();
    } else {
        exitApp();
    }
});

