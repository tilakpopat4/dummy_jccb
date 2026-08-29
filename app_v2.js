// ==================== CONFIGURATION AND CONSTANTS ====================
const INITIAL_BRANCHES = [
    { code: "01", name: "MAIN BRANCH" },
    { code: "02", name: "STATION ROAD BRANCH" },
    { code: "03", name: "ZANZARDA ROAD BRANCH" },
    { code: "04", name: "JOSHIPURA BRANCH" },
    { code: "05", name: "GIRNAR ROAD BRANCH" },
    { code: "06", name: "BILKHA BRANCH" },
    { code: "07", name: "VISAVADAR BRANCH" },
    { code: "08", name: "MENDARD BRANCH" },
    { code: "09", name: "VANTHALI BRANCH" },
    { code: "10", name: "MANAVADAR BRANCH" },
    { code: "11", name: "KESHOD BRANCH" },
    { code: "12", name: "MANGROL BRANCH" },
    { code: "13", name: "VERAVAL BRANCH" },
    { code: "14", name: "TALALA BRANCH" },
    { code: "15", name: "SUTRAPADA BRANCH" },
    { code: "16", name: "KODINAR BRANCH" },
    { code: "17", name: "UNA BRANCH" },
    { code: "99", name: "HEAD OFFICE" }
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
            
            if (!state.branches || !Array.isArray(state.branches) || state.branches.length === 0) {
                state.branches = [...INITIAL_BRANCHES];
            }
            if (!state.products || !Array.isArray(state.products) || state.products.length === 0) {
                state.products = [...INITIAL_PRODUCTS];
            }
            if (!state.valuers || !Array.isArray(state.valuers) || state.valuers.length === 0) {
                state.valuers = [...INITIAL_VALUERS];
            }
            if (!state.customers || !Array.isArray(state.customers)) {
                state.customers = [];
            }
            if (!state.goldRates || typeof state.goldRates !== "object") {
                state.goldRates = {};
            }
        }
    } catch (e) {
        console.error("Failed to load local storage state:", e);
    }
    
    if (!state.accountSeeds || typeof state.accountSeeds !== "object") {
        state.accountSeeds = {};
    }
    
    INITIAL_BRANCHES.forEach(b => {
        if (!state.accountSeeds[b.code]) {
            state.accountSeeds[b.code] = { ...DEFAULT_ACCOUNT_SEEDS };
        }
    });

    if (!state.lastPacketSeed || typeof state.lastPacketSeed !== "object") {
        const pSeedObj = {};
        INITIAL_BRANCHES.forEach(b => {
            pSeedObj[b.code] = 100;
        });
        state.lastPacketSeed = pSeedObj;
    }
}

function saveState() {
    try {
        localStorage.setItem("jccb_gold_loan_state", JSON.stringify(state));
    } catch (e) {
        console.error("Failed to save state to localStorage:", e);
    }
}

// ==================== AUTHENTICATION & SESSION ====================
function initAuth() {
    const branchSelect = document.getElementById("login-branch");
    const loginForm = document.getElementById("login-form");
    const logoutBtn = document.getElementById("logout-btn");
    const togglePasswordBtn = document.getElementById("toggle-password-btn");
    const passwordInput = document.getElementById("login-password");

    if (branchSelect) {
        branchSelect.innerHTML = '<option value="">-- Select Your Branch --</option>';
        state.branches.forEach(b => {
            const opt = document.createElement("option");
            opt.value = b.code;
            opt.textContent = `${b.code} - ${b.name}`;
            branchSelect.appendChild(opt);
        });
    }

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.onclick = (e) => {
            e.preventDefault();
            const icon = togglePasswordBtn.querySelector("i");
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                if (icon) {
                    icon.classList.remove("fa-eye");
                    icon.classList.add("fa-eye-slash");
                }
            } else {
                passwordInput.type = "password";
                if (icon) {
                    icon.classList.remove("fa-eye-slash");
                    icon.classList.add("fa-eye");
                }
            }
        };
    }

    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            const branchCode = branchSelect.value;
            const password = passwordInput.value.trim();

            if (!branchCode) {
                alert("Please select your branch!");
                return;
            }

            const isHeadOffice = (branchCode.toString() === "99");
            const expectedPassword = isHeadOffice ? "Rahul#80810" : "Admin@123";

            if (password === expectedPassword) {
                const branchObj = state.branches.find(b => b.code.toString() === branchCode.toString());
                state.currentSession = {
                    code: branchCode,
                    name: branchObj ? branchObj.name : "BRANCH " + branchCode,
                    loginTime: new Date().toISOString()
                };
                saveState();
                enterApp();
            } else {
                alert("Incorrect password! For Head Office use Rahul#80810, for Branches use Admin@123.");
            }
        };
    }

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (confirm("Are you sure you want to log out?")) {
                state.currentSession = null;
                saveState();
                exitApp();
            }
        };
    }
}

function enterApp() {
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

    const branchLabel = `${state.currentSession.code} - ${state.currentSession.name}`;
    const userBranchDisplay = document.getElementById("current-user-branch");
    const welcomeBranchName = document.getElementById("welcome-branch-name");
    if (userBranchDisplay) userBranchDisplay.textContent = branchLabel;
    if (welcomeBranchName) welcomeBranchName.textContent = branchLabel;

    const isHO = (state.currentSession.code.toString() === "99");
    const hoElements = document.querySelectorAll(".ho-only");
    hoElements.forEach(el => {
        if (isHO) {
            el.classList.remove("hidden");
            el.style.display = "";
        } else {
            el.classList.add("hidden");
            el.style.display = "none";
        }
    });

    configureChargeInputsAccess();
    updateLiveDateTime();
    setInterval(updateLiveDateTime, 1000);

    switchTab("dashboard-view");
}

function configureChargeInputsAccess() {
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
        "charge-sgst",
        "charge-total"
    ];

    chargeInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.readOnly = true;
            input.classList.add("auto-calc-field");
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
}

// ==================== NAVIGATION AND TABS ====================
function initTabs() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const tabId = item.getAttribute("data-tab");
            if (tabId) switchTab(tabId);
        });
    });

    const shortcuts = document.querySelectorAll("[data-go-tab]");
    shortcuts.forEach(btn => {
        btn.addEventListener("click", () => {
            const tabId = btn.getAttribute("data-go-tab");
            if (tabId) switchTab(tabId);
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

    if (tabId === "dashboard-view") {
        updateDashboardStats();
    } else if (tabId === "entry-view") {
        prepareEntryForm(false);
    } else if (tabId === "register-view") {
        renderLoanRegister();
    } else if (tabId === "daily-vouchers-view") {
        prepareDailyVouchersView();
    } else if (tabId === "gold-rate-master-view") {
        renderDailyGoldRateMaster();
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

// ==================== LIVE CLOCK & DATE ====================
function updateLiveDateTime() {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
    const timeStr = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });

    const liveDateElem = document.getElementById("header-date");
    const liveTimeElem = document.getElementById("header-time");
    if (liveDateElem) liveDateElem.textContent = dateStr;
    if (liveTimeElem) liveTimeElem.textContent = timeStr;
}

function getTodayDateStr() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatDateDMY(dateString) {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
}

// ==================== DASHBOARD VIEW ====================
function updateDashboardStats() {
    const totalAmountElem = document.getElementById("stat-total-amount");
    const totalAccountsElem = document.getElementById("stat-total-accounts");
    const totalWeightElem = document.getElementById("stat-total-weight");
    const totalValuersElem = document.getElementById("stat-total-valuers");
    const branchOnlyLoansElem = document.getElementById("stat-branch-only-loans");

    const isHeadOffice = (state.currentSession && state.currentSession.code === "99");
    const viewLoans = isHeadOffice 
        ? state.loans 
        : state.loans.filter(l => l.branchCode === state.currentSession.code);

    if (branchOnlyLoansElem) {
        branchOnlyLoansElem.textContent = isHeadOffice ? "All Branches Combined" : `Branch ${state.currentSession.code} Data`;
    }

    const totalAmount = viewLoans.reduce((sum, item) => sum + parseFloat(item.loanAmount || 0), 0);
    const totalAccounts = viewLoans.length;
    const totalWeight = viewLoans.reduce((sum, item) => sum + parseFloat(item.goldWeight || 0), 0);
    const totalValuers = state.valuers.length;

    if (totalAmountElem) totalAmountElem.textContent = `₹${totalAmount.toLocaleString("en-IN")}`;
    if (totalAccountsElem) totalAccountsElem.textContent = totalAccounts;
    if (totalWeightElem) totalWeightElem.textContent = `${totalWeight.toFixed(3)} g`;
    if (totalValuersElem) totalValuersElem.textContent = totalValuers;

    const todayStr = getTodayDateStr();
    const currentRate = state.goldRates[todayStr] || "";
    const rateInput = document.getElementById("dashboard-gold-rate");
    const saveRateBtn = document.getElementById("save-gold-rate-btn");
    const rateNote = document.querySelector(".rate-note");

    if (rateInput) rateInput.value = currentRate;

    // Head Office can always enter and update today's rate; Branches are strictly view-only
    if (!isHeadOffice) {
        if (rateInput) rateInput.disabled = true;
        if (saveRateBtn) {
            saveRateBtn.disabled = true;
            saveRateBtn.style.display = "none";
        }
        if (rateNote) {
            rateNote.textContent = currentRate 
                ? "* Today's gold rate set by Head Office." 
                : "* Today's gold rate has not been set by Head Office yet.";
        }
    } else {
        if (rateInput) rateInput.disabled = false;
        if (saveRateBtn) {
            saveRateBtn.disabled = false;
            saveRateBtn.style.display = "inline-flex";
            saveRateBtn.innerHTML = currentRate 
                ? '<i class="fa-solid fa-pen-to-square"></i> Update' 
                : '<i class="fa-solid fa-floppy-disk"></i> Save';
        }
        if (rateNote) {
            rateNote.textContent = currentRate 
                ? `* Today's rate set (₹${currentRate.toLocaleString("en-IN")}/10g). Head Office can update at any time.` 
                : "* Set gold market rate for today.";
        }
    }

    if (saveRateBtn) {
        saveRateBtn.onclick = () => {
            if (!isHeadOffice) return;
            const rateVal = parseInt(rateInput.value);
            if (rateVal && rateVal > 1000) {
                state.goldRates[todayStr] = rateVal;
                saveState();
                alert(`Today's gold rate ₹${rateVal.toLocaleString("en-IN")}/10g saved.`);
                updateDashboardStats();
                prepareEntryForm(false);
            } else {
                alert("Please enter a valid gold rate!");
            }
        };
    }

    renderDashboardRecentTable(viewLoans);
}

function renderDashboardRecentTable(loansList) {
    const tbody = document.querySelector("#dashboard-recent-table tbody");
    if (!tbody) return;
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

// ==================== DAILY GOLD RATE MASTER ====================
function renderDailyGoldRateMaster() {
    const dateInput = document.getElementById("m-gold-rate-date");
    const rateInput = document.getElementById("m-gold-rate-val");
    const saveBtn = document.getElementById("btn-save-gold-rate-master");
    const todayStr = getTodayDateStr();

    if (dateInput && !dateInput.value) {
        dateInput.value = todayStr;
    }

    if (dateInput && rateInput) {
        const selDate = dateInput.value || todayStr;
        const currentRate = state.goldRates[selDate] || "";
        rateInput.value = currentRate;
        if (saveBtn) {
            saveBtn.innerHTML = currentRate 
                ? '<i class="fa-solid fa-pen-to-square"></i> Update Gold Rate' 
                : '<i class="fa-solid fa-floppy-disk"></i> Save Gold Rate';
        }
    }

    const tbody = document.getElementById("gold-rate-list-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const searchInput = document.getElementById("search-gold-rate-input");
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const dates = Object.keys(state.goldRates).sort().reverse();

    const filteredDates = dates.filter(d => {
        const dmy = formatDateDMY(d).toLowerCase();
        return !query || d.includes(query) || dmy.includes(query);
    });

    if (filteredDates.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No gold rates recorded.</td></tr>`;
        return;
    }

    const isHO = (state.currentSession && state.currentSession.code === "99");

    filteredDates.forEach(dateStr => {
        const rate = state.goldRates[dateStr];
        const ratePerGram = Math.round((rate / 10) * 100) / 100;
        const tr = document.createElement("tr");
        
        tr.innerHTML = `
            <td><strong>${formatDateDMY(dateStr)}</strong> <small class="text-muted">(${dateStr})</small></td>
            <td class="bold-text gold-color">₹${rate.toLocaleString("en-IN")}</td>
            <td>₹${ratePerGram.toLocaleString("en-IN")}</td>
            <td>
                ${isHO ? `
                    <div class="action-group">
                        <button class="btn-icon btn-icon-green" title="Edit Rate" onclick="editDailyGoldRate('${dateStr}')">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="btn-icon btn-icon-red" title="Delete Rate" onclick="deleteDailyGoldRate('${dateStr}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                ` : '<span class="text-muted">Read-Only</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function initDailyGoldRateMaster() {
    const form = document.getElementById("gold-rate-master-form");
    const dateInput = document.getElementById("m-gold-rate-date");
    const rateInput = document.getElementById("m-gold-rate-val");
    const saveBtn = document.getElementById("btn-save-gold-rate-master");
    const searchInput = document.getElementById("search-gold-rate-input");

    if (dateInput) {
        dateInput.onchange = () => {
            const selDate = dateInput.value;
            const existingRate = state.goldRates[selDate] || "";
            if (rateInput) rateInput.value = existingRate;
            if (saveBtn) {
                saveBtn.innerHTML = existingRate 
                    ? '<i class="fa-solid fa-pen-to-square"></i> Update Gold Rate' 
                    : '<i class="fa-solid fa-floppy-disk"></i> Save Gold Rate';
            }
        };
    }

    if (searchInput) {
        searchInput.oninput = renderDailyGoldRateMaster;
    }

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            if (state.currentSession.code !== "99") {
                alert("Permission Denied: Only Head Office can set or update daily gold rates.");
                return;
            }
            const targetDate = dateInput.value;
            const rateVal = parseInt(rateInput.value);

            if (!targetDate) {
                alert("Please select a date.");
                return;
            }
            if (!rateVal || rateVal <= 1000) {
                alert("Please enter a valid gold rate (minimum ₹1,000/10g).");
                return;
            }

            state.goldRates[targetDate] = rateVal;
            saveState();
            alert(`Gold rate for ${formatDateDMY(targetDate)} saved: ₹${rateVal.toLocaleString("en-IN")}/10g.`);
            renderDailyGoldRateMaster();
            updateDashboardStats();
        };
    }
}

function editDailyGoldRate(dateStr) {
    const dateInput = document.getElementById("m-gold-rate-date");
    const rateInput = document.getElementById("m-gold-rate-val");
    const saveBtn = document.getElementById("btn-save-gold-rate-master");

    if (dateInput) dateInput.value = dateStr;
    if (rateInput) rateInput.value = state.goldRates[dateStr] || "";
    if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Update Gold Rate';
    if (rateInput) rateInput.focus();
}

function deleteDailyGoldRate(dateStr) {
    if (state.currentSession.code !== "99") {
        alert("Permission Denied: Only Head Office can delete gold rates.");
        return;
    }
    if (confirm(`Are you sure you want to delete the gold rate for ${formatDateDMY(dateStr)}?`)) {
        delete state.goldRates[dateStr];
        saveState();
        renderDailyGoldRateMaster();
        updateDashboardStats();
    }
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

function addOrnamentRow(item = {}) {
    const tbody = document.getElementById("ornaments-table-tbody");
    if (!tbody) return;

    const currentRows = tbody.querySelectorAll("tr").length;
    if (currentRows >= 10) {
        alert("Maximum 10 ornaments rows allowed per loan record.");
        return;
    }

    const rowIdx = currentRows + 1;
    const tr = document.createElement("tr");
    tr.className = "ornament-row";
    tr.dataset.rowId = rowIdx;

    tr.innerHTML = `
        <td class="row-num text-center" style="font-weight: bold; width: 35px;">${rowIdx}</td>
        <td>
            <input type="text" class="orn-desc" placeholder="દાગીનાની વિગત (e.g. સોનાનો હાર)" value="${item.desc || ""}" style="width: 100%; min-width: 140px;">
        </td>
        <td>
            <input type="number" class="orn-pcs" placeholder="નંગ" value="${item.pcs || 1}" min="1" style="width: 55px; text-align: center;">
        </td>
        <td>
            <input type="number" class="orn-gross-gm" placeholder="ગ્રામ" value="${item.grossGm || ""}" step="0.001" min="0" style="width: 75px; text-align: right;">
        </td>
        <td>
            <input type="number" class="orn-gross-mg" placeholder="મી.ગ્રા." value="${item.grossMg || ""}" step="1" min="0" max="999" style="width: 65px; text-align: right;">
        </td>
        <td>
            <input type="number" class="orn-net-gm" placeholder="ગ્રામ" value="${item.netGm || ""}" step="0.001" min="0" style="width: 75px; text-align: right;">
        </td>
        <td>
            <input type="number" class="orn-net-mg" placeholder="મી.ગ્રા." value="${item.netMg || ""}" step="1" min="0" max="999" style="width: 65px; text-align: right;">
        </td>
        <td>
            <select class="orn-purity" style="width: 85px;">
                <option value="22 Kt" ${item.purity === "22 Kt" || !item.purity ? "selected" : ""}>22 Kt (91.6)</option>
                <option value="24 Kt" ${item.purity === "24 Kt" ? "selected" : ""}>24 Kt (99.9)</option>
                <option value="20 Kt" ${item.purity === "20 Kt" ? "selected" : ""}>20 Kt (83.3)</option>
                <option value="18 Kt" ${item.purity === "18 Kt" ? "selected" : ""}>18 Kt (75.0)</option>
            </select>
        </td>
        <td>
            <input type="number" class="orn-val auto-calc-field" placeholder="કિંમત રૂ." value="${item.val || ""}" readonly style="width: 95px; text-align: right; font-weight: bold;">
        </td>
        <td class="text-center" style="width: 40px;">
            <button type="button" class="btn-icon-red" onclick="removeOrnamentRow(this)">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </td>
    `;

    tbody.appendChild(tr);

    const inputs = tr.querySelectorAll("input, select");
    inputs.forEach(input => {
        input.addEventListener("input", () => {
            calculateSingleOrnamentRow(tr);
            updateOrnamentsSummary();
        });
        input.addEventListener("change", () => {
            calculateSingleOrnamentRow(tr);
            updateOrnamentsSummary();
        });
    });

    calculateSingleOrnamentRow(tr);
    updateOrnamentsSummary();
}

function removeOrnamentRow(btn) {
    const tr = btn.closest("tr");
    if (tr) {
        tr.remove();
        renumberOrnamentRows();
        updateOrnamentsSummary();
    }
}

function renumberOrnamentRows() {
    const tbody = document.getElementById("ornaments-table-tbody");
    if (!tbody) return;
    const rows = tbody.querySelectorAll("tr");
    rows.forEach((r, idx) => {
        const numCell = r.querySelector(".row-num");
        if (numCell) numCell.textContent = idx + 1;
        r.dataset.rowId = idx + 1;
    });
}

function calculateSingleOrnamentRow(row) {
    const loanDateVal = document.getElementById("loan-date") ? document.getElementById("loan-date").value : getTodayDateStr();
    const marketRate = state.goldRates[loanDateVal] || 0;

    const netGm = parseFloat(row.querySelector(".orn-net-gm").value) || 0;
    const netMg = parseFloat(row.querySelector(".orn-net-mg").value) || 0;
    const totalNetGrams = netGm + (netMg / 1000);

    const purity = row.querySelector(".orn-purity").value;
    let purityFactor = 1.0;
    if (purity === "22 Kt") purityFactor = 22 / 24;
    else if (purity === "20 Kt") purityFactor = 20 / 24;
    else if (purity === "18 Kt") purityFactor = 18 / 24;
    else purityFactor = 1.0;

    const rowVal = Math.round((totalNetGrams / 10) * marketRate * purityFactor);
    row.querySelector(".orn-val").value = rowVal > 0 ? rowVal : "";
}

function updateOrnamentsSummary() {
    const tbody = document.getElementById("ornaments-table-tbody");
    if (!tbody) return;

    let totalPcs = 0;
    let totalGrossGm = 0;
    let totalGrossMg = 0;
    let totalNetGm = 0;
    let totalNetMg = 0;
    let totalVal = 0;
    let descriptions = [];

    const rows = tbody.querySelectorAll(".ornament-row");
    rows.forEach(r => {
        const desc = r.querySelector(".orn-desc").value.trim();
        const pcs = parseInt(r.querySelector(".orn-pcs").value) || 0;
        const grossGm = parseFloat(r.querySelector(".orn-gross-gm").value) || 0;
        const grossMg = parseInt(r.querySelector(".orn-gross-mg").value) || 0;
        const netGm = parseFloat(r.querySelector(".orn-net-gm").value) || 0;
        const netMg = parseInt(r.querySelector(".orn-net-mg").value) || 0;
        const val = parseFloat(r.querySelector(".orn-val").value) || 0;

        if (desc) {
            descriptions.push(`${desc} (${pcs})`);
        }

        totalPcs += pcs;
        totalGrossGm += grossGm;
        totalGrossMg += grossMg;
        totalNetGm += netGm;
        totalNetMg += netMg;
        totalVal += val;
    });

    const normGrossGm = totalGrossGm + Math.floor(totalGrossMg / 1000);
    const normGrossMg = totalGrossMg % 1000;
    const normNetGm = totalNetGm + Math.floor(totalNetMg / 1000);
    const normNetMg = totalNetMg % 1000;

    const totalPcsElem = document.getElementById("total-orn-pcs");
    const totalGrossGmElem = document.getElementById("total-gross-gm");
    const totalGrossMgElem = document.getElementById("total-gross-mg");
    const totalNetGmElem = document.getElementById("total-net-gm");
    const totalNetMgElem = document.getElementById("total-net-mg");
    const totalValElem = document.getElementById("total-orn-val");

    if (totalPcsElem) totalPcsElem.textContent = totalPcs;
    if (totalGrossGmElem) totalGrossGmElem.textContent = normGrossGm.toFixed(3);
    if (totalGrossMgElem) totalGrossMgElem.textContent = normGrossMg;
    if (totalNetGmElem) totalNetGmElem.textContent = normNetGm.toFixed(3);
    if (totalNetMgElem) totalNetMgElem.textContent = normNetMg;
    if (totalValElem) totalValElem.textContent = `₹${totalVal.toLocaleString("en-IN")}`;

    const finalNetWeight = (normNetGm + (normNetMg / 1000)).toFixed(3);
    const goldWeightInput = document.getElementById("gold-weight");
    if (goldWeightInput && rows.length > 0) {
        goldWeightInput.value = parseFloat(finalNetWeight) > 0 ? finalNetWeight : "";
    }

    const descInput = document.getElementById("ornaments-desc");
    if (descInput) {
        descInput.value = descriptions.join(", ");
    }

    calculateCharges();
}

function getOrnamentsTableData() {
    const tbody = document.getElementById("ornaments-table-tbody");
    if (!tbody) return [];

    const items = [];
    const rows = tbody.querySelectorAll(".ornament-row");
    rows.forEach(r => {
        const desc = r.querySelector(".orn-desc").value.trim();
        const pcs = parseInt(r.querySelector(".orn-pcs").value) || 0;
        const grossGm = parseFloat(r.querySelector(".orn-gross-gm").value) || 0;
        const grossMg = parseInt(r.querySelector(".orn-gross-mg").value) || 0;
        const netGm = parseFloat(r.querySelector(".orn-net-gm").value) || 0;
        const netMg = parseInt(r.querySelector(".orn-net-mg").value) || 0;
        const purity = r.querySelector(".orn-purity").value;
        const val = parseFloat(r.querySelector(".orn-val").value) || 0;

        if (desc || pcs > 0 || grossGm > 0 || netGm > 0) {
            items.push({
                sr: items.length + 1,
                desc, pcs, grossGm, grossMg, netGm, netMg, purity, val
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
        items.forEach(item => addOrnamentRow(item));
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
        const emiInput = document.getElementById("loan-emi-amount");
        if (emiInput) {
            emiInput.value = "";
            emiInput.dataset.autoCalculated = "true";
        }
        const tenureInput = document.getElementById("loan-installments");
        if (tenureInput) {
            tenureInput.value = "36";
        }
        const installmentContainer = document.getElementById("installment-fields-container");
        if (installmentContainer) {
            installmentContainer.style.display = "none";
            installmentContainer.classList.add("hidden");
        }
        loadOrnamentsTableData([]);
    } else {
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
        "is-member",
        "loan-installments"
    ];
    inputsToWatch.forEach(id => {
        const elem = document.getElementById(id);
        if (elem && !elem.dataset.calcBound) {
            elem.dataset.calcBound = "true";
            elem.addEventListener("input", calculateCharges);
            elem.addEventListener("change", calculateCharges);
        }
    });

    const emiElem = document.getElementById("loan-emi-amount");
    if (emiElem && !emiElem.dataset.inputBound) {
        emiElem.dataset.inputBound = "true";
        emiElem.addEventListener("input", () => {
            emiElem.dataset.autoCalculated = "false";
        });
    }

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

    // Auto-populate customer details on entering Customer Number
    const custNoInput = document.getElementById("cust-no");
    if (custNoInput && !custNoInput.dataset.bound) {
        custNoInput.dataset.bound = "true";
        const handleLookup = () => {
            const custNo = custNoInput.value.trim();
            if (custNo) {
                let customer = state.customers.find(c => c.custNo === custNo);
                if (!customer) {
                    const loanMatch = state.loans.slice().reverse().find(l => l.custNo === custNo);
                    if (loanMatch) {
                        customer = {
                            custNo: loanMatch.custNo,
                            name: loanMatch.borrowerName,
                            address: loanMatch.custAddress,
                            savingsAc: loanMatch.custSavingsAc,
                            age: loanMatch.custAge,
                            occupation: loanMatch.custOccupation,
                            religion: loanMatch.custReligion,
                            caste: loanMatch.custCaste,
                            mobile: loanMatch.custMobile,
                            nomineeName: loanMatch.custNomineeName,
                            nomineeRelation: loanMatch.custNomineeRelation,
                            photo: loanMatch.custPhoto
                        };
                    }
                }

                if (customer) {
                    if (document.getElementById("cust-name")) document.getElementById("cust-name").value = customer.name || "";
                    if (document.getElementById("cust-address")) document.getElementById("cust-address").value = customer.address || "";
                    if (document.getElementById("cust-savings-ac")) document.getElementById("cust-savings-ac").value = customer.savingsAc || "";
                    if (document.getElementById("cust-age")) document.getElementById("cust-age").value = customer.age || "";
                    if (document.getElementById("cust-occupation")) document.getElementById("cust-occupation").value = customer.occupation || "";
                    if (document.getElementById("cust-religion")) document.getElementById("cust-religion").value = customer.religion || "";
                    if (document.getElementById("cust-caste")) document.getElementById("cust-caste").value = customer.caste || "";
                    if (document.getElementById("cust-mobile")) document.getElementById("cust-mobile").value = customer.mobile || "";
                    if (document.getElementById("cust-nominee-name")) document.getElementById("cust-nominee-name").value = customer.nomineeName || "";
                    if (document.getElementById("cust-nominee-relation")) document.getElementById("cust-nominee-relation").value = customer.nomineeRelation || "";
                    
                    if (customer.photo) {
                        currentUploadedCustPhoto = customer.photo;
                        const preview = document.getElementById("cust-photo-preview");
                        if (preview) {
                            preview.innerHTML = `<img src="${customer.photo}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" />`;
                        }
                    }
                }
            }
        };
        custNoInput.addEventListener("input", handleLookup);
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

    // Dynamic Installment Field for Product Code 3527
    const installmentContainer = document.getElementById("installment-fields-container");
    const emiInput = document.getElementById("loan-emi-amount");
    const tenureInput = document.getElementById("loan-installments");

    if (productCode === "3527") {
        if (installmentContainer) {
            installmentContainer.style.display = "block";
            installmentContainer.classList.remove("hidden");
        }
        if (tenureInput && !tenureInput.value) {
            tenureInput.value = "36";
        }
        if (emiInput) {
            if ((!emiInput.value || emiInput.dataset.autoCalculated === "true") && amount > 0) {
                const months = parseInt(tenureInput ? tenureInput.value : 36) || 36;
                const r = (11.5 / 12) / 100;
                const calculatedEmi = Math.round((amount * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
                emiInput.value = calculatedEmi;
                emiInput.dataset.autoCalculated = "true";
            }
        }
    } else {
        if (installmentContainer) {
            installmentContainer.style.display = "none";
            installmentContainer.classList.add("hidden");
        }
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
            shareA = 0;
            shareB = 0;
            memberFee = 0;
        }

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

        if (amount <= 50000) {
            stampCharge = 0;
        } else {
            const calculated = roundTo10(Math.round(amount * 0.25 / 100));
            stampCharge = Math.min(300, calculated);
        }

        if (amount > 200000 && productCode === "3553") {
            stampCharge += 300;
        }

        if (amount <= 200000) {
            serviceCharge = Math.min(500, roundTo10(Math.round(amount * 0.25 / 100)));
        } else {
            serviceCharge = Math.min(5000, roundTo10(Math.round(amount * 0.50 / 100)));
        }

        if (amount <= 100000) {
            docCharge = 50;
        } else if (amount <= 200000) {
            docCharge = 100;
        } else {
            docCharge = 200;
        }

        if (amount <= 200000) {
            insCharge = 50;
        } else {
            insCharge = 100;
        }
    }

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
    const branchCode = state.currentSession ? state.currentSession.code : "99";
    
    let seed = 1001;
    if (state.accountSeeds && state.accountSeeds[branchCode] && state.accountSeeds[branchCode][schemeCode]) {
        seed = parseInt(state.accountSeeds[branchCode][schemeCode]);
    }

    let maxSerial = seed - 1;

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

// ==================== SAVE ENTRY FORM ====================
function initFormSubmit() {
    const form = document.getElementById("gold-loan-form");
    if (!form) return;
    
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

        const isEditing = !!state.editingLoanId;
        const confirmSave = confirm(isEditing ? "Are you sure you want to update this gold loan entry?" : "Are you sure you want to save this gold loan entry?");
        if (!confirmSave) return;

        const categoryDisplay = document.getElementById("loan-category-display");
        const categorySelect = document.getElementById("loan-category-select");
        let productCodeVal = (amount > 200000 && categorySelect && !categorySelect.classList.contains("hidden"))
            ? categorySelect.value
            : (categoryDisplay ? categoryDisplay.value : "");

        const totalChargesVal = parseFloat(document.getElementById("charge-total").value) || 0;
        const netDisbursalVal = amount - totalChargesVal;

        if (isEditing) {
            const index = state.loans.findIndex(l => l.id === state.editingLoanId);
            if (index !== -1) {
                if (!productCodeVal && state.loans[index].productCode) {
                    productCodeVal = state.loans[index].productCode;
                }

                const updatedLoan = {
                    ...state.loans[index],
                    date: dateStr,
                    uniqueProposalNo: document.getElementById("unique-proposal-no") ? document.getElementById("unique-proposal-no").value.trim() : "",
                    loanStatus: form.elements["loan-status"].value,
                    isMember: document.getElementById("is-member").value,
                    memberNo: document.getElementById("member-no").value || "-",
                    isNewMember: document.getElementById("is-new-member-checkbox").checked,
                    packetNo: document.getElementById("packet-no").value.trim() || state.loans[index].packetNo,
                    valuerId: valuerId,
                    borrowerName: document.getElementById("cust-name").value.trim(),
                    loanAmount: amount,
                    productCode: productCodeVal,
                    accountNo: document.getElementById("loan-ac-no").value.trim() || state.loans[index].accountNo,
                    interestRate: document.getElementById("interest-rate-display").value || state.loans[index].interestRate || "11.50%",
                    goldWeight: weight,
                    ornamentsDesc: document.getElementById("ornaments-desc") ? document.getElementById("ornaments-desc").value.trim() : "",
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
                    custPhoto: currentUploadedCustPhoto || state.loans[index].custPhoto || "",
                    goldPhoto: currentUploadedGoldPhoto || state.loans[index].goldPhoto || "",
                    loanPurpose: document.getElementById("loan-purpose").value.trim(),
                    installmentAmount: parseFloat(document.getElementById("loan-emi-amount") ? document.getElementById("loan-emi-amount").value : 0) || 0,
                    installments: parseInt(document.getElementById("loan-installments") ? document.getElementById("loan-installments").value : 36) || 36,
                    
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
                    totalCharges: totalChargesVal,
                    netDisbursal: netDisbursalVal
                };

                state.loans[index] = updatedLoan;
                
                upsertCustomerFromForm();
                saveState();
                alert("Gold loan entry updated successfully.");
                
                state.editingLoanId = null;
                
                prepareEntryForm(true);
                updateDashboardStats();
                switchTab("register-view");
                openPrintModal(updatedLoan.id);
                return;
            }
        }

        // New Loan Entry
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
            borrowerName: document.getElementById("cust-name").value.trim(),
            loanAmount: amount,
            productCode: productCodeVal,
            accountNo: document.getElementById("loan-ac-no").value.trim(),
            interestRate: document.getElementById("interest-rate-display").value || "11.50%",
            goldWeight: weight,
            ornamentsDesc: document.getElementById("ornaments-desc") ? document.getElementById("ornaments-desc").value.trim() : "",
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
            installmentAmount: parseFloat(document.getElementById("loan-emi-amount") ? document.getElementById("loan-emi-amount").value : 0) || 0,
            installments: parseInt(document.getElementById("loan-installments") ? document.getElementById("loan-installments").value : 36) || 36,
            
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
            totalCharges: totalChargesVal,
            netDisbursal: netDisbursalVal
        };

        state.loans.push(newLoan);
        upsertCustomerFromForm();
        saveState();

        alert("Gold loan entry saved successfully.");
        
        prepareEntryForm(true);
        updateDashboardStats();
        switchTab("register-view");
        openPrintModal(newLoan.id);
    });

    const resetBtn = document.getElementById("reset-loan-form-btn");
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (confirm("Reset all form inputs?")) {
                prepareEntryForm(true);
            }
        };
    }
}

// ==================== LOAN REGISTER / DATA GRID ====================
function renderLoanRegister() {
    const tbody = document.getElementById("register-tbody");
    const emptyMsg = document.getElementById("register-empty-msg");
    if (!tbody) return;
    
    const filterBranchSelect = document.getElementById("filter-branch");
    if (filterBranchSelect) {
        filterBranchSelect.innerHTML = '<option value="">-- All Branches --</option>';
        state.branches.forEach(b => {
            const opt = document.createElement("option");
            opt.value = b.code;
            opt.textContent = `${b.code} - ${b.name}`;
            filterBranchSelect.appendChild(opt);
        });
    }

    const filterProductSelect = document.getElementById("filter-product");
    if (filterProductSelect) {
        filterProductSelect.innerHTML = '<option value="">-- All Schemes --</option>';
        const uniqueSchemes = [...new Set(state.products.map(p => p.code))];
        uniqueSchemes.forEach(code => {
            const opt = document.createElement("option");
            opt.value = code;
            opt.textContent = code;
            filterProductSelect.appendChild(opt);
        });
    }

    function runFilters() {
        const searchInput = document.getElementById("filter-search");
        const query = searchInput ? searchInput.value.toLowerCase() : "";
        const branchCode = filterBranchSelect ? filterBranchSelect.value : "";
        const dateFromInput = document.getElementById("filter-date-from");
        const dateToInput = document.getElementById("filter-date-to");
        const dateFrom = dateFromInput ? dateFromInput.value : "";
        const dateTo = dateToInput ? dateToInput.value : "";
        const productCode = filterProductSelect ? filterProductSelect.value : "";

        const isHeadOffice = (state.currentSession && state.currentSession.code === "99");
        let list = state.loans;
        if (!isHeadOffice && state.currentSession) {
            list = list.filter(l => l.branchCode === state.currentSession.code);
        }

        const filtered = list.filter(loan => {
            const matchesQuery = !query || 
                (loan.borrowerName && loan.borrowerName.toLowerCase().includes(query)) || 
                (loan.accountNo && loan.accountNo.toLowerCase().includes(query)) || 
                (loan.packetNo && loan.packetNo.toString().includes(query));
            
            const matchesBranch = !branchCode || loan.branchCode === branchCode;
            const matchesProduct = !productCode || loan.productCode === productCode;
            
            let matchesDate = true;
            if (dateFrom && loan.date < dateFrom) matchesDate = false;
            if (dateTo && loan.date > dateTo) matchesDate = false;

            return matchesQuery && matchesBranch && matchesProduct && matchesDate;
        });

        tbody.innerHTML = "";
        if (filtered.length === 0) {
            if (emptyMsg) emptyMsg.classList.remove("hidden");
            return;
        }
        if (emptyMsg) emptyMsg.classList.add("hidden");

        const sorted = [...filtered].reverse();

        sorted.forEach(loan => {
            const tr = document.createElement("tr");
            const canEdit = isHeadOffice || (state.currentSession && loan.branchCode === state.currentSession.code);
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
                    <div class="action-group">
                        ${canEdit ? `
                            <button class="btn-icon btn-icon-green" title="Edit Loan" onclick="editLoanRecord('${loan.id}')">
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                        ` : ''}
                        ${isHeadOffice ? `
                            <button class="btn-icon btn-icon-red" title="Delete Loan" onclick="deleteLoanRecord('${loan.id}')">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    const filters = ["filter-search", "filter-branch", "filter-date-from", "filter-date-to", "filter-product"];
    filters.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.oninput = runFilters;
            el.onchange = runFilters;
        }
    });

    const clearBtn = document.getElementById("clear-filters-btn");
    if (clearBtn) {
        clearBtn.onclick = () => {
            if (document.getElementById("filter-search")) document.getElementById("filter-search").value = "";
            if (document.getElementById("filter-branch")) document.getElementById("filter-branch").value = "";
            if (document.getElementById("filter-date-from")) document.getElementById("filter-date-from").value = "";
            if (document.getElementById("filter-date-to")) document.getElementById("filter-date-to").value = "";
            if (document.getElementById("filter-product")) document.getElementById("filter-product").value = "";
            runFilters();
        };
    }

    const exportBtn = document.getElementById("export-csv-btn");
    if (exportBtn) {
        exportBtn.onclick = () => {
            exportLoansToCSV();
        };
    }

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
    const isHeadOffice = (state.currentSession && state.currentSession.code === "99");
    const loan = state.loans.find(l => l.id === loanId);
    if (!loan) {
        alert("Error: Loan record not found.");
        return;
    }

    if (!isHeadOffice && loan.branchCode !== state.currentSession.code) {
        alert("Permission Denied: You can only edit loan records of your own branch.");
        return;
    }

    state.editingLoanId = loanId;

    switchTab("entry-view");

    // Populate all form fields accurately
    document.getElementById("loan-date").value = loan.date;
    
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

    isMemberSelect.value = loan.isMember || "No";
    if (loan.isMember === "Yes") {
        memberNoGroup.style.display = "block";
        memberNoInput.required = true;
        memberNoInput.value = loan.memberNo || "";
        if (isNewMemberCheck) isNewMemberCheck.checked = false;
    } else {
        memberNoGroup.style.display = "none";
        memberNoInput.required = false;
        memberNoInput.value = "";
        if (isNewMemberCheck) isNewMemberCheck.checked = true;
    }
    if (isNewMemberCheck) isNewMemberCheck.disabled = true;

    document.getElementById("packet-no").value = loan.packetNo;
    document.getElementById("valuer-select").value = loan.valuerId;
    
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

    document.getElementById("loan-amount").value = loan.loanAmount;
    document.getElementById("gold-weight").value = loan.goldWeight;
    
    const descInput = document.getElementById("ornaments-desc");
    if (descInput) descInput.value = loan.ornamentsDesc || "";

    loadOrnamentsTableData(loan.ornamentsItems || []);

    if (loan.custPhoto) {
        currentUploadedCustPhoto = loan.custPhoto;
        document.getElementById("cust-photo-preview").innerHTML = `<img src="${loan.custPhoto}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" />`;
    } else {
        currentUploadedCustPhoto = "";
        document.getElementById("cust-photo-preview").innerHTML = `<i class="fa-regular fa-image"></i><span>No Image Chosen</span>`;
    }

    if (loan.goldPhoto) {
        currentUploadedGoldPhoto = loan.goldPhoto;
        document.getElementById("gold-photo-preview").innerHTML = `<img src="${loan.goldPhoto}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" />`;
    } else {
        currentUploadedGoldPhoto = "";
        document.getElementById("gold-photo-preview").innerHTML = `<i class="fa-regular fa-image"></i><span>No Image Chosen</span>`;
    }

    // Handle Scheme / Product
    const categoryDisplay = document.getElementById("loan-category-display");
    const categorySelect = document.getElementById("loan-category-select");
    if (loan.loanAmount > 200000) {
        if (categoryDisplay) categoryDisplay.classList.add("hidden");
        if (categorySelect) {
            categorySelect.classList.remove("hidden");
            categorySelect.value = loan.productCode || "";
        }
    } else {
        if (categoryDisplay) {
            categoryDisplay.classList.remove("hidden");
            categoryDisplay.value = loan.productCode || "";
        }
        if (categorySelect) categorySelect.classList.add("hidden");
    }

    if (document.getElementById("interest-rate-display")) {
        document.getElementById("interest-rate-display").value = loan.interestRate || "11.50%";
    }
    if (document.getElementById("loan-ac-no")) {
        document.getElementById("loan-ac-no").value = loan.accountNo || "";
    }

    if (document.getElementById("loan-emi-amount")) {
        document.getElementById("loan-emi-amount").value = loan.installmentAmount || "";
        document.getElementById("loan-emi-amount").dataset.autoCalculated = "false";
    }
    if (document.getElementById("loan-installments")) {
        document.getElementById("loan-installments").value = loan.installments || 36;
    }

    calculateCharges();

    // Re-apply preserved loan charges and account number after calculateCharges
    if (document.getElementById("loan-ac-no")) document.getElementById("loan-ac-no").value = loan.accountNo || "";
    if (loan.productCode === "3527") {
        const instContainer = document.getElementById("installment-fields-container");
        if (instContainer) {
            instContainer.style.display = "block";
            instContainer.classList.remove("hidden");
        }
        if (document.getElementById("loan-emi-amount") && loan.installmentAmount) {
            document.getElementById("loan-emi-amount").value = loan.installmentAmount;
            document.getElementById("loan-emi-amount").dataset.autoCalculated = "false";
        }
    }
    if (document.getElementById("charge-share-a")) document.getElementById("charge-share-a").value = loan.shareA;
    if (document.getElementById("charge-share-b")) document.getElementById("charge-share-b").value = loan.shareB;
    if (document.getElementById("charge-member-fee")) document.getElementById("charge-member-fee").value = loan.memberFee;
    if (document.getElementById("charge-valuation")) document.getElementById("charge-valuation").value = loan.valuationCharge;
    if (document.getElementById("charge-stamp")) document.getElementById("charge-stamp").value = loan.stampCharge;
    if (document.getElementById("charge-service")) document.getElementById("charge-service").value = loan.serviceCharge;
    if (document.getElementById("charge-document")) document.getElementById("charge-document").value = loan.docCharge;
    if (document.getElementById("charge-insurance")) document.getElementById("charge-insurance").value = loan.insCharge;
    if (document.getElementById("charge-cgst")) document.getElementById("charge-cgst").value = loan.cgst;
    if (document.getElementById("charge-sgst")) document.getElementById("charge-sgst").value = loan.sgst;
    if (document.getElementById("charge-adjustment")) document.getElementById("charge-adjustment").value = loan.adjustment;

    updateTotals();

    const submitBtn = document.querySelector('#gold-loan-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Update Record & Re-generate Voucher';
    }

    const formEl = document.getElementById("gold-loan-form");
    if (formEl) {
        formEl.scrollIntoView({ behavior: "smooth" });
    }
}

function exportLoansToCSV() {
    const isHeadOffice = (state.currentSession.code === "99");
    let list = isHeadOffice ? state.loans : state.loans.filter(l => l.branchCode === state.currentSession.code);

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
    if (voucherDateSelect && !voucherDateSelect.value) {
        voucherDateSelect.value = getTodayDateStr();
    }

    loadDailyVouchersSummary();

    const loadBtn = document.getElementById("load-vouchers-btn");
    if (loadBtn) {
        loadBtn.onclick = () => {
            loadDailyVouchersSummary();
        };
    }

    const printBtn = document.getElementById("print-vouchers-btn");
    if (printBtn) {
        printBtn.onclick = () => {
            printDailyVouchers();
        };
    }
}

function getDailyVouchersData(dateStr) {
    const isHeadOffice = (state.currentSession && state.currentSession.code === "99");
    
    let dayLoans = state.loans.filter(l => l.date === dateStr);
    if (!isHeadOffice && state.currentSession) {
        dayLoans = dayLoans.filter(l => l.branchCode === state.currentSession.code);
    }

    let shareA = 0;
    let shareB = 0;
    let memberFee = 0;
    let stamp = 0;
    let service = 0;
    let doc = 0;
    let insurance = 0;
    let sgst = 0;
    let cgst = 0;

    let valuerChargesMap = {};

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

    let activeVouchers = voucherAccounts.filter(v => v.amount > 0);

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
    if (!tbody) return;
    tbody.innerHTML = "";
    
    const dateSelect = document.getElementById("voucher-date-select");
    const dateStr = dateSelect ? dateSelect.value : getTodayDateStr();
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
    const dateSelect = document.getElementById("voucher-date-select");
    const dateStr = dateSelect ? dateSelect.value : getTodayDateStr();
    const vouchers = getDailyVouchersData(dateStr);

    if (vouchers.length === 0) {
        alert("No transaction entries to print on this date.");
        return;
    }

    const printArea = document.getElementById("print-area");
    if (!printArea) return;
    printArea.innerHTML = "";

    let html = "";
    const vouchersPerPage = 3;
    const totalPages = Math.ceil(vouchers.length / vouchersPerPage);

    for (let page = 0; page < totalPages; page++) {
        const isLastPage = (page === totalPages - 1);
        const pageClass = isLastPage ? "print-voucher print-a4-three" : "print-voucher print-a4-three print-page-break";
        
        html += `<div class="${pageClass}">`;

        for (let i = 0; i < vouchersPerPage; i++) {
            const vIndex = (page * vouchersPerPage) + i;
            if (vIndex >= vouchers.length) {
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
    if (!tbody) return;
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
    if (form) {
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
    if (!tbody) return;
    tbody.innerHTML = "";

    const isHO = (state.currentSession && state.currentSession.code.toString() === "99");
    const countDisplay = document.getElementById("valuer-total-count");
    const hoActions = document.getElementById("valuer-head-office-actions");
    const branchNotice = document.getElementById("valuer-branch-notice");
    const valuerForm = document.getElementById("valuer-master-form");

    if (hoActions) {
        if (isHO) {
            hoActions.classList.remove("hidden");
            hoActions.style.display = "flex";
        } else {
            hoActions.classList.add("hidden");
            hoActions.style.display = "none";
        }
    }

    if (branchNotice && valuerForm) {
        if (isHO) {
            branchNotice.classList.add("hidden");
            valuerForm.querySelectorAll("input, button").forEach(el => el.disabled = false);
        } else {
            branchNotice.classList.remove("hidden");
            valuerForm.querySelectorAll("input, button").forEach(el => el.disabled = true);
        }
    }

    const searchInput = document.getElementById("search-valuer-input");
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const filtered = state.valuers.filter(v => {
        if (!query) return true;
        return (
            (v.name && v.name.toLowerCase().includes(query)) ||
            (v.mobile && v.mobile.toLowerCase().includes(query)) ||
            (v.address && v.address.toLowerCase().includes(query)) ||
            (v.savingsAc && v.savingsAc.toLowerCase().includes(query))
        );
    });

    if (countDisplay) {
        countDisplay.textContent = filtered.length;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">No valuer records found matching search.</td></tr>`;
        return;
    }

    filtered.forEach(v => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${v.name}</strong></td>
            <td>${v.mobile || "-"}</td>
            <td><small>${v.address || "-"}</small></td>
            <td><code>${v.savingsAc || "-"}</code></td>
            <td>
                ${isHO ? `
                    <div class="action-group">
                        <button class="btn-icon btn-icon-green" title="Edit Valuer" onclick="editValuer('${v.id}')">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="btn-icon btn-icon-red" title="Delete Valuer" onclick="deleteValuer('${v.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                ` : `
                    <span style="font-size:11px; color:#888; font-style:italic;">Read-Only</span>
                `}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function initValuerMaster() {
    const form = document.getElementById("valuer-master-form");
    const cancelBtn = document.getElementById("valuer-cancel-edit-btn");
    const searchInput = document.getElementById("search-valuer-input");
    const uploadBtn = document.getElementById("btn-trigger-valuer-excel-upload");
    const fileInput = document.getElementById("valuer-excel-file-input");
    const templateBtn = document.getElementById("btn-download-valuer-template");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            renderValuerMasterList();
        });
    }

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener("click", () => {
            if (state.currentSession.code !== "99") {
                alert("Error: Only Head Office can upload Valuer excel sheets.");
                return;
            }
            fileInput.click();
        });

        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = new Uint8Array(ev.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                    if (!jsonRows || jsonRows.length === 0) {
                        alert("The uploaded Excel file contains no data rows.");
                        fileInput.value = "";
                        return;
                    }

                    let addedCount = 0;
                    let updatedCount = 0;

                    jsonRows.forEach((row, idx) => {
                        let name = "";
                        let mobile = "";
                        let address = "";
                        let savingsAc = "";

                        for (const key of Object.keys(row)) {
                            const cleanKey = key.trim().toLowerCase().replace(/[\s\-_.\/]/g, "");
                            const val = (row[key] !== undefined && row[key] !== null) ? String(row[key]).trim() : "";

                            if (cleanKey.includes("name") || cleanKey.includes("valuer") || cleanKey.includes("નામ") || cleanKey.includes("soni")) {
                                if (!name) name = val;
                            } else if (cleanKey.includes("mobile") || cleanKey.includes("phone") || cleanKey.includes("cell") || cleanKey.includes("મોબાઇલ") || cleanKey.includes("contact")) {
                                if (!mobile) mobile = val;
                            } else if (cleanKey.includes("address") || cleanKey.includes("addr") || cleanKey.includes("સરનામું") || cleanKey.includes("city")) {
                                if (!address) address = val;
                            } else if (cleanKey.includes("saving") || cleanKey.includes("ac") || cleanKey.includes("account") || cleanKey.includes("ખાતા") || cleanKey.includes("bank")) {
                                if (!savingsAc) savingsAc = val;
                            }
                        }

                        if (!name && row[0]) name = String(row[0]).trim();
                        if (!mobile && row[1]) mobile = String(row[1]).trim();
                        if (!address && row[2]) address = String(row[2]).trim();
                        if (!savingsAc && row[3]) savingsAc = String(row[3]).trim();

                        if (name) {
                            mobile = mobile.replace(/[^0-9]/g, "");

                            const existingIndex = state.valuers.findIndex(v => 
                                (v.name && v.name.toLowerCase() === name.toLowerCase()) ||
                                (mobile && v.mobile === mobile)
                            );

                            if (existingIndex !== -1) {
                                state.valuers[existingIndex].name = name;
                                if (mobile) state.valuers[existingIndex].mobile = mobile;
                                if (address) state.valuers[existingIndex].address = address;
                                if (savingsAc) state.valuers[existingIndex].savingsAc = savingsAc;
                                updatedCount++;
                            } else {
                                state.valuers.push({
                                    id: "valuer_" + Date.now() + "_" + idx,
                                    name,
                                    mobile: mobile || "-",
                                    address: address || "-",
                                    savingsAc: savingsAc || "-"
                                });
                                addedCount++;
                            }
                        }
                    });

                    saveState();
                    renderValuerMasterList();
                    alert(`Valuer Excel Import Successful!\n\nAdded New: ${addedCount}\nUpdated: ${updatedCount}\nTotal Valuers: ${state.valuers.length}`);
                } catch (err) {
                    console.error("Excel import error:", err);
                    alert("Error parsing Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.");
                } finally {
                    fileInput.value = "";
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    if (templateBtn) {
        templateBtn.addEventListener("click", () => {
            const templateData = [
                {
                    "Valuer Name": "Soni Kamalbhai Lodhiya",
                    "Mobile": "9876543210",
                    "Address": "Choksi Bazar, Junagadh",
                    "Savings A/c": "001201000456"
                },
                {
                    "Valuer Name": "Soni Rajeshbhai Zaveri",
                    "Mobile": "9426512345",
                    "Address": "M.G. Road, Junagadh",
                    "Savings A/c": "001201000789"
                }
            ];

            const ws = XLSX.utils.json_to_sheet(templateData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Valuers");
            XLSX.writeFile(wb, "JCCB_Valuer_Master_Template.xlsx");
        });
    }

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            if (state.currentSession.code !== "99") {
                alert("Error: Only Head Office can add or modify Valuers.");
                return;
            }

            const editId = document.getElementById("edit-valuer-id").value;
            const name = document.getElementById("valuer-name").value.trim();
            const mobile = document.getElementById("valuer-mobile").value.trim();
            const address = document.getElementById("valuer-address").value.trim();
            const savingsAc = document.getElementById("valuer-savings-ac").value.trim();

            if (editId) {
                const index = state.valuers.findIndex(v => v.id === editId);
                if (index !== -1) {
                    state.valuers[index] = { id: editId, name, mobile, address, savingsAc };
                    alert("Valuer details updated successfully.");
                }
            } else {
                const newValuer = {
                    id: "valuer_" + Date.now(),
                    name, mobile, address, savingsAc
                };
                state.valuers.push(newValuer);
                alert("Valuer registered successfully.");
            }

            saveState();
            form.reset();
            document.getElementById("edit-valuer-id").value = "";
            document.getElementById("valuer-form-title").innerHTML = '<i class="fa-solid fa-user-plus"></i> Register New Valuer';
            document.getElementById("valuer-save-btn").innerHTML = '<i class="fa-solid fa-user-plus"></i> Register Valuer';
            if (cancelBtn) cancelBtn.classList.add("hidden");
            renderValuerMasterList();
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            if (form) form.reset();
            document.getElementById("edit-valuer-id").value = "";
            document.getElementById("valuer-form-title").innerHTML = '<i class="fa-solid fa-user-plus"></i> Register New Valuer';
            document.getElementById("valuer-save-btn").innerHTML = '<i class="fa-solid fa-user-plus"></i> Register Valuer';
            cancelBtn.classList.add("hidden");
        };
    }
}

function editValuer(id) {
    if (state.currentSession.code !== "99") {
        alert("Error: Only Head Office can modify Valuer records.");
        return;
    }

    const valuer = state.valuers.find(v => v.id === id);
    if (!valuer) return;

    document.getElementById("edit-valuer-id").value = valuer.id;
    document.getElementById("valuer-name").value = valuer.name || "";
    document.getElementById("valuer-mobile").value = valuer.mobile || "";
    document.getElementById("valuer-address").value = valuer.address || "";
    document.getElementById("valuer-savings-ac").value = valuer.savingsAc || "";

    document.getElementById("valuer-form-title").innerHTML = '<i class="fa-solid fa-pencil"></i> Edit Valuer Record';
    document.getElementById("valuer-save-btn").innerHTML = '<i class="fa-solid fa-check"></i> Update Valuer';
    
    const cancelBtn = document.getElementById("valuer-cancel-edit-btn");
    if (cancelBtn) cancelBtn.classList.remove("hidden");

    const container = document.getElementById("valuer-form-container");
    if (container) {
        container.scrollIntoView({ behavior: "smooth" });
    }
}

function deleteValuer(id) {
    if (state.currentSession.code !== "99") {
        alert("Error: Only Head Office can delete Valuer records.");
        return;
    }
    if (confirm("Are you sure you want to delete this valuer?")) {
        state.valuers = state.valuers.filter(v => v.id !== id);
        saveState();
        renderValuerMasterList();
    }
}

// ==================== PRODUCT MASTER VIEW ====================
function renderProductMasterList() {
    const tbody = document.getElementById("product-list-tbody");
    if (!tbody) return;
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
    if (form) {
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

        const cancelBtn = document.getElementById("product-cancel-edit-btn");
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                form.reset();
                document.getElementById("edit-product-id").value = "";
                document.getElementById("product-save-btn").innerHTML = '<i class="fa-solid fa-save"></i> Save Product';
                cancelBtn.classList.add("hidden");
            };
        }
    }
}

function editProduct(id) {
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
        alert("Error: Only Head Office can delete loan products.");
        return;
    }
    if (confirm("Delete this loan product?")) {
        state.products = state.products.filter(p => p.id !== id);
        saveState();
        renderProductMasterList();
    }
}

// ==================== SETTINGS VIEW ====================
function renderSettings() {
    const branchCode = state.currentSession ? state.currentSession.code : "99";
    const seedsContainer = document.getElementById("account-seeds-container");
    if (!seedsContainer) return;
    seedsContainer.innerHTML = "";

    const uniqueSchemes = [...new Set(state.products.map(p => p.code))];
    
    if (!state.accountSeeds[branchCode]) {
        state.accountSeeds[branchCode] = { ...DEFAULT_ACCOUNT_SEEDS };
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

    const packetInput = document.getElementById("seed-last-packet-no");
    if (packetInput && state.lastPacketSeed) {
        packetInput.value = state.lastPacketSeed[branchCode] || 100;
    }

    const accountsForm = document.getElementById("settings-accounts-form");
    if (accountsForm) {
        accountsForm.onsubmit = (e) => {
            e.preventDefault();
            uniqueSchemes.forEach(code => {
                const inputEl = document.getElementById(`seed-ac-${code}`);
                if (inputEl) {
                    const inputVal = parseInt(inputEl.value);
                    if (!isNaN(inputVal) && inputVal > 0) {
                        state.accountSeeds[branchCode][code] = inputVal;
                    }
                }
            });

            saveState();
            alert(`Account sequence seeds for branch ${branchCode} saved.`);
            renderSettings();
        };
    }

    const genForm = document.getElementById("settings-general-form");
    if (genForm) {
        genForm.onsubmit = (e) => {
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
}

// ==================== PRINT RECEIPT ENGINE ====================
function printVoucher(loanId, format) {
    const loan = state.loans.find(l => l.id === loanId);
    if (!loan) {
        alert("Error: Loan record not found.");
        return;
    }

    const valuer = state.valuers.find(v => v.id === loan.valuerId) || { name: loan.valuerId || "વેલ્યુઅર સોની", savingsAc: "-", mobile: "-" };
    const printArea = document.getElementById("print-area");
    if (!printArea) return;
    printArea.innerHTML = "";

    const loanAmt = parseFloat(loan.loanAmount) || 0;
    const mktVal = parseFloat(loan.marketValue) || 0;
    const gujWords = numberToGujaratiWords(loanAmt);
    const ltv = mktVal > 0 ? Math.round((loanAmt / mktVal) * 100) : 0;

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
                        <div class="meta-item"><span class="m-label">Customer Number</span><span class="m-val">${loan.custNo || "-"}</span></div>
                        <div class="meta-item"><span class="m-label">Borrower Name</span><span class="m-val">${loan.borrowerName}</span></div>
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
                    <div class="sig-block">Borrower Signature<br><small style="font-weight:700;">(${loan.borrowerName || "Borrower"})</small></div>
                    <div class="sig-block">Valuer Soni Signature</div>
                    <div class="sig-block">Cashier Signature</div>
                    <div class="sig-block">Loan Clerk</div>
                    <div class="sig-block">Branch Manager</div>
                </div>
            </div>
        `;
    }

    // Format 2: Complete Loan Documents Set (3-Page Set OR 4-Page Set with KFS if 3725/3524)
    if (format === "application_form") {
        const isKFS = isKFSApplicable(loan);
        printArea.innerHTML = `
            ${generatePage1RequisitionHTML(loan, gujWords, ltv, true)}
            ${generatePage2ValuationPromissoryHTML(loan, gujWords, valuer, true)}
            ${generatePage3CustomerReceiptHTML(loan, gujWords, valuer, isKFS)}
            ${isKFS ? generatePage4KFSHTML(loan, ltv, false) : ""}
        `;
    }

    setTimeout(() => {
        window.print();
    }, 150);
}

function generatePage1RequisitionHTML(loan, gujWords, ltv, isPageBreak = false) {
    const pageBreakClass = isPageBreak ? "print-page-break" : "";
    return `
        <div class="print-page print-voucher print-requisition-form ${pageBreakClass}" style="width:100%; box-sizing:border-box; font-family:'Outfit', 'Noto Sans Gujarati', sans-serif; color:#000000; line-height:1.5; background-color:#ffffff; font-size:12px; margin-bottom: 20px;">
            
            <!-- Bank Header with Logo on Left -->
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
                <img src="${LOGO_SRC}" alt="JCCB Logo" style="width:48px; height:48px; object-fit:contain;">
                <div style="flex:1; text-align:center;">
                    <h1 style="font-size:17.5px; font-weight:800; margin:0; color:#000000; letter-spacing:0.3px;">ધી જૂનાગઢ કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ.</h1>
                    <p style="font-size:11px; margin:2px 0 0 0; font-weight:600; color:#111111;">હે.ઓ. : “ચંદ્રકાંત માલવિયા સ્મૃતિ ભવન”, ચોકસી બજાર, જૂનાગઢ. ૩૬૨૦૦૧</p>
                </div>
                ${loan.custPhoto ? `<div style="border:1.5px solid #000000; width:70px; height:80px; overflow:hidden; display:flex; align-items:center; justify-content:center;"><img src="${loan.custPhoto}" style="width:100%; height:100%; object-fit:cover;"></div>` : `<div style="width:48px;"></div>`}
            </div>
            
            <div style="border-top:1.5px solid #000000; margin:4px 0 6px 0;"></div>
            
            <div style="text-align:center; margin-bottom:8px;">
                <h2 style="font-size:14px; font-weight:800; margin:0; text-decoration:underline;">સોનાનાં દાગીનાની જામીનગીરી પર કરજ માંગણીની અરજી</h2>
            </div>

            <!-- Recipient Block -->
            <div style="font-size:12px; line-height:1.45; font-weight:700; margin-bottom:6px;">
                પ્રતિ,<br>
                મેનેજરશ્રી,<br>
                ધી જૂનાગઢ કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ.<br>
                <strong>${loan.branchName}</strong><br>
                Customer Number : <strong>${loan.custNo || "-"}</strong>
            </div>

            <!-- Body Text -->
            <div style="font-size:12px; line-height:1.55; text-align:justify;">
                <p style="font-weight:700; margin:0 0 4px 0;">સાહેબશ્રી,</p>
                
                <p style="margin:0 0 6px 0;">
                    સવિનય હું <strong>${loan.borrowerName || "-"}</strong> સરનામું : <strong>${loan.custAddress || "-"}</strong>, ઉ.વ. <strong>${loan.custAge || "-"}</strong> આશરે, ધંધો : <strong>${loan.custOccupation || "-"}</strong>, ધર્મે : <strong>${loan.custReligion || "-"}</strong>, જ્ઞાતિ : <strong>${loan.custCaste || "-"}</strong>, મોબાઈલ નંબર : <strong>${loan.custMobile || "-"}</strong> સભાસદ નંબર : <strong>${loan.memberNo || "-"}</strong>
                </p>

                <p style="margin:0 0 6px 0;">
                    આ સાથે સામેલ વેલ્યુએશન રિપોર્ટ મુજબના મારી માલિકીના સોનાનાં દાગીનાની જામીનગીરી ઉપર રૂ.<strong>${parseFloat(loan.loanAmount).toLocaleString("en-IN")}/-</strong> નું આપની બેંકમાંથી ધિરાણ <strong>${loan.loanPurpose || "સોનાના દાગીના સામે ધિરાણ"}</strong> ના હેતુ માટે મેળવવા માટે અરજી કરું છું. આથી હું તમો બેંકને ખાતરી અને બાંહેધરી આપું છું કે બેંકને જામીનગીરીમાં આપેલ દાગીના મારી સ્વતંત્ર માલિકીના છે. મેં બેંકના સોનાના દાગીનાની જામીનગીરી પર ધિરાણના નિયમો વાંચ્યા છે જે મને કબુલ-મંજુર છે. વધુમાં હું કબુલ રાખું છું કે રિઝર્વ બેંક ઓફ ઇન્ડિયાની વખતો વખતની સૂચના પ્રમાણે બેંક વ્યાજ મારા ખાતામાં ઉધરશે જે મને મંજુર છે. બેંકને નિયમાનુસાર દસ્તાવેજો લખી આપવા હું તૈયાર છું.
                </p>

                <p style="margin:0 0 6px 0;">
                    આજરોજ બેંક દ્વારા મંજુર કરાયેલ રકમ રૂ. <strong>${parseFloat(loan.loanAmount).toLocaleString("en-IN")}/-</strong> અંકે રૂપિયા <strong>${gujWords}</strong> ના ધિરાણની સલામતી પેટે હું આ સાથે સામેલ વેલ્યુએશન રિપોર્ટમાં દર્શાવ્યા મુજબના મારી માલિકીના સોનાના દાગીના થાલમાં આપી બેંકને સોંપુ છું.
                </p>

                <p style="margin:0 0 6px 0;">
                    વેલ્યુએશન રિપોર્ટમાં દર્શાવેલા તમામ સોનાના દાગીનાઓ શરાફે મારી હાજરીમાં એક સીલબંધ પેકેટ બનાવી, એક કાગળનું લેબલ બનાવી મારી હાજરીમાં બેંકના અધિકારીની સહી કરાવી દાગીનાના પેકેટ ઉપર ઉપર ચોટાડી તૈયાર થયેલ સદર સીલબંધ પેકેટમાં રાખેલ સોનાના દાગીના હું બેંકને થાલમાં આપું છું.
                </p>

                <p style="margin:0 0 8px 0;">
                    ઉપરાંત આ દાગીનાના વારસદાર તરીકે હું <strong>${loan.custNomineeName || "-"}</strong> સંબંધે <strong>${loan.custNomineeRelation || "-"}</strong> ની નિમણુંક કરું છું.
                </p>
            </div>

            <!-- Date, Location & Borrower Signature with extra signing space -->
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin:24px 0 10px 0; font-size:12px;">
                <div style="font-weight:700; line-height:1.6;">
                    સ્થળઃ- <strong>${loan.branchName}</strong><br>
                    તારીખઃ- <strong>${formatDateDMY(loan.date)}</strong>
                </div>
                <div style="text-align:center; min-width:220px;">
                    <div style="height:25px;"></div>
                    <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:6px; margin-bottom:4px; white-space:nowrap;">
                        <span style="font-weight:bold; font-size:13px; line-height:1;">X</span>
                        <span style="display:inline-block; width:180px; border-bottom:1.5px solid #000000;"></span>
                    </div>
                    <div style="font-weight:700;">(${loan.borrowerName || "અરજદારનું નામ"})</div>
                </div>
            </div>

            <!-- Office Check Block (ઓફિસ શેરો) -->
            <div style="margin-top:6px; border-top:1.5px dashed #000000; padding-top:4px;">
                <div style="text-align:center; font-weight:800; font-size:12px; margin-bottom:4px; letter-spacing:0.5px;">
                    ======================== ઓફિસ શેરો ========================
                </div>

                <table style="width:100%; border-collapse:collapse; margin-bottom:6px; font-size:11px; border:1.5px solid #000000; text-align:center;">
                    <thead>
                        <tr style="background-color:#f1f5f9; border-bottom:1px solid #000000;">
                            <th style="padding:3px 6px; border-right:1px solid #000000; width:33.33%;">ખાતા નંબર</th>
                            <th style="padding:3px 6px; border-right:1px solid #000000; width:33.33%;">પેકેટ નંબર</th>
                            <th style="padding:3px 6px; width:33.33%;">સેવીંગ ખાતા નં.</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding:4px 6px; font-weight:700; border-right:1px solid #000000;">${loan.accountNo || "-"}</td>
                            <td style="padding:4px 6px; font-weight:700; border-right:1px solid #000000;">#${loan.packetNo || "-"}</td>
                            <td style="padding:4px 6px; font-weight:700;">${loan.custSavingsAc || "-"}</td>
                        </tr>
                    </tbody>
                </table>

                <p style="font-size:11px; line-height:1.45; text-align:justify; margin:3px 0 10px 0;">
                    વેલ્યુએશન રિપોર્ટમાં દર્શાવ્યા મુજબના સોનાનાં દાગીના થાલમાં લઈને તેની કુલ કિંમત રૂ.<strong>${parseFloat(loan.marketValue || 0).toLocaleString("en-IN")}/-</strong> ના <strong>${ltv}</strong> ટકા લેખે ધિરાણની રકમ રૂ. <strong>${parseFloat(loan.loanAmount).toLocaleString("en-IN")}/-</strong> અંકે રૂપિયા <strong>${gujWords}</strong> નો બેંકના સોનાના દાગીના સામે ધિરાણના નિયમાનુસાર ચુકાદો કરવાની મંજુરી આપવામાં આવે છે. આજરોજ ઉપરોક્ત દાગીનાનું સીલબંધ પેકેટ અરજદાર પાસેથી સંભાળી લૉકરમાં મુકેલ છે.
                </p>

                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:35px; font-size:11.5px; font-weight:700; padding:0 10px;">
                    <div style="text-align:center; width:45%;">
                        <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:6px; margin-bottom:4px; white-space:nowrap;">
                            <span style="font-weight:bold; font-size:12px; line-height:1;">X</span>
                            <span style="display:inline-block; width:160px; border-bottom:1.5px solid #000000;"></span>
                        </div>
                        <div>Bank Officer</div>
                    </div>
                    <div style="text-align:center; width:45%;">
                        <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:6px; margin-bottom:4px; white-space:nowrap;">
                            <span style="font-weight:bold; font-size:12px; line-height:1;">X</span>
                            <span style="display:inline-block; width:160px; border-bottom:1.5px solid #000000;"></span>
                        </div>
                        <div>Branch Manager</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generatePage2ValuationPromissoryHTML(loan, gujWords, valuer, isPageBreak = false) {
    const pageBreakClass = isPageBreak ? "print-page-break" : "";
    return `
        <div class="print-page print-voucher print-requisition-form ${pageBreakClass}" style="width:100%; box-sizing:border-box; font-family:'Outfit', 'Noto Sans Gujarati', sans-serif; color:#000000; line-height:1.4; background-color:#ffffff; font-size:11.5px;">
            
            <!-- Bank Header with Logo on Left -->
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:2px;">
                <img src="${LOGO_SRC}" alt="JCCB Logo" style="width:44px; height:44px; object-fit:contain;">
                <div style="flex:1; text-align:center;">
                    <h1 style="font-size:16.5px; font-weight:800; margin:0; color:#000000; letter-spacing:0.3px;">ધી જૂનાગઢ કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ.</h1>
                    <p style="font-size:10.5px; margin:1px 0 0 0; font-weight:600; color:#111111;">હે.ઓ. : “ચંદ્રકાંત માલવિયા સ્મૃતિ ભવન”, ચોકસી બજાર, જૂનાગઢ. ૩૬૨૦૦૧</p>
                </div>
                <div style="width:44px;"></div>
            </div>
            
            <div style="border-top:1.5px solid #000000; margin:3px 0 4px 0;"></div>

            <!-- Recipient Block -->
            <div style="font-size:11.5px; line-height:1.35; font-weight:700; margin-bottom:3px;">
                પ્રતિ,<br>
                મેનેજરશ્રી, ધી જૂનાગઢ કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ. – <strong>${loan.branchName}</strong>
            </div>

            <!-- Salutation & Big Bold Centered Name and Market Rate Info Above Photo -->
            <div style="font-size:11.5px; line-height:1.35;">
                <p style="font-weight:700; margin:0 0 2px 0;">સાહેબશ્રી,</p>
                <div style="text-align:center; font-size:12.5px; font-weight:800; line-height:1.4; color:#000000; margin:2px 0 4px 0;">
                    <div>નામ : <strong>${loan.borrowerName || "-"}</strong> રહે. <strong>${loan.custAddress || "-"}</strong></div>
                    <div>આજનો બજાર ભાવ રૂ. <strong>${parseFloat(loan.marketRate || 0).toLocaleString("en-IN")}/-</strong> ૧૦ ગ્રામ શુદ્ધ સોનાનો</div>
                </div>
            </div>

            <!-- Prominent Gold Ornaments Photo Box Centered Above Heading -->
            <div style="text-align:center; margin:3px 0 4px 0;">
                <div style="display:inline-flex; align-items:center; justify-content:center; border:2px solid #000000; border-radius:5px; width:360px; max-width:90%; height:95px; background-color:#ffffff; overflow:hidden; padding:3px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                    ${loan.goldPhoto 
                        ? `<img src="${loan.goldPhoto}" alt="Gold Ornaments" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:3px;">` 
                        : `<div style="text-align:center; color:#333; font-size:11px; font-weight:700; padding:6px;">
                             <i class="fa-solid fa-gem" style="font-size:22px; color:#d97706; margin-bottom:2px; display:block;"></i>
                             સોનાના દાગીનાનો ફોટો
                           </div>`
                    }
                </div>
            </div>

            <div style="text-align:center; margin:2px 0 3px 0;">
                <h2 style="font-size:12.5px; font-weight:800; margin:0; text-decoration:underline;">સોનાનાં દાગીનાનો વેલ્યુએશન રિપોર્ટ</h2>
            </div>

            <!-- Ornaments Valuation Table -->
            ${renderValuationReportTable(loan)}

            <!-- Valuer Certification Statement & Signatures with compact spacing -->
            <p style="font-size:11px; line-height:1.35; text-align:justify; margin:3px 0 2px 0;">
                આથી ખાતરી આપવામાં આવે છે કે ઉપર મુજબના દાગીના મેં જોઈ તપાસી અને કાળજીપૂર્વક તેની શુદ્ધતા, વજન, દર, કિંમતની આકારણી કરેલ છે અને મેં દર્શાવેલ વિગત વાજબી છે.
            </p>

            <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:11px; margin:8px 0 3px 0;">
                <div style="font-weight:700; line-height:1.4;">
                    સ્થળ : <strong>${loan.branchName}</strong><br>
                    તારીખ :- <strong>${formatDateDMY(loan.date)}</strong>
                </div>
                <div style="text-align:center; min-width:180px;">
                    <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:6px; margin-bottom:2px; white-space:nowrap;">
                        <span style="font-weight:bold; font-size:11.5px; line-height:1;">X</span>
                        <span style="display:inline-block; width:140px; border-bottom:1.5px solid #000000;"></span>
                    </div>
                    <div style="font-weight:700;">(<strong>${valuer.name}</strong>)</div>
                </div>
            </div>

            <p style="font-size:11px; line-height:1.35; text-align:justify; margin:3px 0 2px 0;">
                ઉપરોક્ત વિગતે વેલ્યુઅરે જે શુદ્ધતા, વજન, દર, કિંમત આકારેલ છે તે વાજબી છે અને મને કબૂલ-મંજુર છે.
            </p>

            <div style="display:flex; justify-content:flex-end; margin:8px 0 3px 0;">
                <div style="text-align:center; min-width:180px; font-size:11px;">
                    <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:6px; margin-bottom:2px; white-space:nowrap;">
                        <span style="font-weight:bold; font-size:11.5px; line-height:1;">X</span>
                        <span style="display:inline-block; width:140px; border-bottom:1.5px solid #000000;"></span>
                    </div>
                    <div style="font-weight:700;">(<strong>${loan.borrowerName}</strong>)</div>
                </div>
            </div>

            <!-- Demand Promissory Note Section -->
            <div style="border-top:1.5px dashed #000000; padding-top:3px; margin-top:3px;">
                <div style="text-align:center; font-weight:800; font-size:12px; margin-bottom:3px; letter-spacing:0.5px;">
                    :: ડિમાન્ડ પ્રોમિસરી નોટ – વચન ચિઠ્ઠી ::
                </div>
                <p style="font-size:10.5px; line-height:1.35; text-align:justify; margin:0 0 4px 0;">
                    હું <strong>${loan.borrowerName}</strong> આજરોજ મને મળેલા અવેજ બદલ રૂ. <strong>${parseFloat(loan.loanAmount).toLocaleString("en-IN")}/-</strong> અંકે રૂપિયા <strong>${gujWords}</strong> <strong>${loan.interestRate || "11.50%"}</strong> માસિક ચક્રવૃદ્ધિ વ્યાજ ગણતરી અનુસાર વાર્ષિક વ્યાજ દરે ચડત વ્યાજની રકમ સહીત જયારે માંગો ત્યારે ધી જૂનાગઢ કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ. – <strong>${loan.branchName}</strong> અથવા તેનાં આદેશ અનુસાર તેની કોઈપણ શાખામાં ચૂકવી આપવાનું વચન આપું છું.
                </p>

                <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:10.5px; margin-top:6px;">
                    <div style="font-weight:700; line-height:1.4;">
                        તારીખ :- <strong>${formatDateDMY(loan.date)}</strong><br>
                        સ્થળ : <strong>${loan.branchName}</strong>
                    </div>
                    <div style="display:flex; align-items:flex-end; gap:20px;">
                        <!-- Left Signature Block -->
                        <div style="text-align:center; min-width:130px;">
                            <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:4px; margin-bottom:2px; white-space:nowrap;">
                                <span style="font-weight:bold; font-size:11.5px; line-height:1;">X</span>
                                <span style="display:inline-block; width:130px; border-bottom:1.5px solid #000000;"></span>
                            </div>
                            <div style="font-weight:700; font-size:10.5px;">(<strong>${loan.borrowerName}</strong>)</div>
                        </div>
                        <!-- Right Signature Block with Revenue Stamp Box directly above -->
                        <div style="text-align:center; min-width:130px;">
                            <div style="border:1.5px dashed #000; width:50px; height:58px; margin:0 auto 3px auto; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; font-size:8px; font-weight:700; padding:2px; line-height:1.15;">
                                <span>રેવન્યુ</span>
                                <span>સ્ટેમ્પ</span>
                                <span>રૂ. ૧/-</span>
                            </div>
                            <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:4px; margin-bottom:2px; white-space:nowrap;">
                                <span style="font-weight:bold; font-size:11.5px; line-height:1;">X</span>
                                <span style="display:inline-block; width:130px; border-bottom:1.5px solid #000000;"></span>
                            </div>
                            <div style="font-weight:700; font-size:10.5px;">(<strong>${loan.borrowerName}</strong>)</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generatePage3CustomerReceiptHTML(loan, gujWords, valuer, isPageBreak = false) {
    const pageBreakClass = isPageBreak ? "print-page-break" : "";
    return `
        <div class="print-page print-voucher print-requisition-form ${pageBreakClass}" style="width:100%; box-sizing:border-box; font-family:'Outfit', 'Noto Sans Gujarati', sans-serif; color:#000000; line-height:1.4; background-color:#ffffff; font-size:11.5px;">
            
            <!-- Bank Header with Logo on Left -->
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:2px;">
                <img src="${LOGO_SRC}" alt="JCCB Logo" style="width:44px; height:44px; object-fit:contain;">
                <div style="flex:1; text-align:center;">
                    <h1 style="font-size:16.5px; font-weight:800; margin:0; color:#000000; letter-spacing:0.3px;">ધી જૂનાગઢ કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ.</h1>
                    <p style="font-size:10.5px; margin:1px 0 0 0; font-weight:600; color:#111111;">હે.ઓ. : “ચંદ્રકાંત માલવિયા સ્મૃતિ ભવન”, ચોકસી બજાર, જૂનાગઢ. ૩૬૨૦૦૧</p>
                </div>
                <div style="width:44px;"></div>
            </div>
            
            <div style="border-top:1.5px solid #000000; margin:3px 0 4px 0;"></div>

            <!-- Branch & Recipient Block -->
            <div style="font-size:11.5px; line-height:1.35; font-weight:700; margin-bottom:3px;">
                ધી જૂનાગઢ કોમર્શિયલ કો-ઓપરેટીવ બેંક લિ.<br>
                <strong>${loan.branchName}</strong>
            </div>

            <!-- Salutation & Big Bold Centered Name and Market Rate Info Above Photos -->
            <div style="font-size:11.5px; line-height:1.35;">
                <p style="font-weight:700; margin:0 0 2px 0;">સાહેબશ્રી,</p>
                <div style="text-align:center; font-size:12.5px; font-weight:800; line-height:1.4; color:#000000; margin:2px 0 4px 0;">
                    <div>નામ : <strong>${loan.borrowerName || "-"}</strong> રહે. <strong>${loan.custAddress || "-"}</strong></div>
                    <div>આજનો બજાર ભાવ રૂ. <strong>${parseFloat(loan.marketRate || 0).toLocaleString("en-IN")}/-</strong> ૧૦ ગ્રામ શુદ્ધ સોનાનો</div>
                </div>
            </div>

            <!-- Two Centered Attractive Photo Boxes (Customer Photo & Gold Ornaments Photo) -->
            <div style="display:flex; justify-content:center; align-items:center; gap:16px; margin:3px 0 4px 0;">
                <!-- Customer Photo Box -->
                <div style="border:1.5px solid #000000; border-radius:4px; width:95px; height:90px; display:flex; align-items:center; justify-content:center; overflow:hidden; background-color:#ffffff; padding:2px; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                    ${loan.custPhoto 
                        ? `<img src="${loan.custPhoto}" alt="Customer Photo" style="max-width:100%; max-height:100%; object-fit:cover; border-radius:3px;">` 
                        : `<div style="text-align:center; color:#555; font-size:9px; font-weight:700; padding:2px;"><i class="fa-solid fa-user" style="font-size:18px; color:#475569; margin-bottom:2px; display:block;"></i>ગ્રાહકનો ફોટો</div>`
                    }
                </div>
                <!-- Gold Ornaments Photo Box -->
                <div style="border:1.5px solid #000000; border-radius:4px; width:210px; height:90px; display:flex; align-items:center; justify-content:center; overflow:hidden; background-color:#ffffff; padding:2px; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                    ${loan.goldPhoto 
                        ? `<img src="${loan.goldPhoto}" alt="Gold Photo" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:3px;">` 
                        : `<div style="text-align:center; color:#555; font-size:9.5px; font-weight:700; padding:4px;"><i class="fa-solid fa-gem" style="font-size:20px; color:#d97706; margin-bottom:2px; display:block;"></i>સોનાના દાગીનાનો ફોટો</div>`
                    }
                </div>
            </div>

            <div style="text-align:center; margin:2px 0 3px 0;">
                <h2 style="font-size:12.5px; font-weight:800; margin:0; text-decoration:underline;">ગ્રાહકને આપવાની પહોંચ</h2>
            </div>

            <!-- Ornaments Valuation Table (10 Rows) -->
            ${renderValuationReportTable(loan)}

            <!-- Loan Tenure & Date Statement -->
            <div style="font-size:11px; line-height:1.45; margin:3px 0 4px 0;">
                <div>સદરહુ ધિરાણ રૂ. <strong>${parseFloat(loan.loanAmount || 0).toLocaleString("en-IN")}/-</strong> ની મુદત તા. <strong>${formatDateDMY(loan.date)}</strong> થી <strong>૧૨</strong> માસ સુધીની છે.</div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                    <div>સ્થળ : <strong>${loan.branchName}</strong></div>
                    <div>તારીખ :- <strong>${formatDateDMY(loan.date)}</strong></div>
                </div>
            </div>

            <!-- Signatures Row (3 columns) with extra signing space -->
            <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:10px; margin:12px 0 5px 0; text-align:center;">
                <!-- Column 1: Valuer -->
                <div style="width:30%;">
                    <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:4px; margin-bottom:2px; white-space:nowrap;">
                        <span style="font-weight:bold; font-size:10.5px; line-height:1;">X</span>
                        <span style="display:inline-block; width:95px; border-bottom:1.5px solid #000000;"></span>
                    </div>
                    <div style="font-weight:700; font-size:9.5px;">સીલબંધ પેકેટ તૈયાર કરનાર</div>
                    <div style="font-weight:700; font-size:9.5px;">(<strong>${valuer.name}</strong>)</div>
                </div>
                <!-- Column 2: Borrower -->
                <div style="width:36%;">
                    <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:4px; margin-bottom:2px; white-space:nowrap;">
                        <span style="font-weight:bold; font-size:10.5px; line-height:1;">X</span>
                        <span style="display:inline-block; width:115px; border-bottom:1.5px solid #000000;"></span>
                    </div>
                    <div style="font-weight:700; font-size:9.5px;">દાગીના સોંપનારની સહી</div>
                    <div style="font-weight:700; font-size:9.5px;">(<strong>${loan.borrowerName}</strong>)</div>
                </div>
                <!-- Column 3: Bank Officers -->
                <div style="width:30%;">
                    <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:4px; margin-bottom:2px; white-space:nowrap;">
                        <span style="font-weight:bold; font-size:10.5px; line-height:1;">X</span>
                        <span style="display:inline-block; width:95px; border-bottom:1.5px solid #000000;"></span>
                    </div>
                    <div style="font-weight:700; font-size:9.5px;">બેંક વતી દાગીના સંભાળ્યા</div>
                    <div style="display:flex; justify-content:space-around; font-weight:700; font-size:9px; margin-top:2px;">
                        <span>ઓફિસર</span>
                        <span>મેનેજર</span>
                    </div>
                </div>
            </div>

            <!-- Scissor Cut Line -->
            <div style="border-top:1.5px dashed #000000; position:relative; margin:10px 0 6px 0; text-align:center;">
                <span style="background-color:#ffffff; padding:0 8px; font-size:9.5px; font-weight:700; position:relative; top:-7px; display:inline-flex; align-items:center; gap:5px; border:1px solid #777; border-radius:8px;">
                    <i class="fa-solid fa-scissors"></i> ✂ અહીંથી કટ કરવું / Cut Here
                </span>
            </div>

            <!-- Return Acknowledgement Receipt -->
            <div style="text-align:center; margin:1px 0 2px 0;">
                <h2 style="font-size:12px; font-weight:800; margin:0; text-decoration:underline;">:: દાગીના પરત મળ્યાંની પહોંચ ::</h2>
            </div>

            <div style="font-size:10.5px; line-height:1.3; margin-bottom:2px;">
                <strong>પ્રતિ,</strong><br>
                મેનેજરશ્રી, ધી જૂનાગઢ કોમ. કો-ઓપ. બેંક લિ. – <strong>${loan.branchName}</strong> શાખા
            </div>

            <!-- Account & Packet Number Highlight Table Box in Center (Big Bold) -->
            <table style="margin:3px auto 4px auto; width:70%; border-collapse:collapse; text-align:center; border:1.5px solid #000000; font-size:11px;">
                <thead>
                    <tr style="background-color:#f1f5f9; border-bottom:1.5px solid #000000;">
                        <th style="padding:2px 6px; border-right:1.5px solid #000000; width:50%; font-size:11px;">ખાતા નંબર</th>
                        <th style="padding:2px 6px; width:50%; font-size:11px;">પેકેટ નંબર</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding:3px 6px; font-size:13.5px; font-weight:800; border-right:1.5px solid #000000; color:#000000;">${loan.accountNo || "-"}</td>
                        <td style="padding:3px 6px; font-size:13.5px; font-weight:800; color:#000000;">#${loan.packetNo || "-"}</td>
                    </tr>
                </tbody>
            </table>

            <p style="font-size:10.5px; line-height:1.35; text-align:justify; margin:2px 0 3px 0;">
                ઉપરોક્ત વિગતે મેં બેંકને ગીરો આપેલ સોનાના દાગીના અસલ સ્થિતિમાં પરત મળ્યાં છે તે બદલ હું આ પહોંચમાં મારી સહી કરી આપ�        return `
        <div class="print-page print-voucher print-requisition-form ${pageBreakClass}" style="width:100%; box-sizing:border-box; font-family:'Outfit', 'Segoe UI', Arial, sans-serif; color:#000000; line-height:1.25; background-color:#ffffff; font-size:9.2px;">
            
            <!-- Bank Header with Logo on Left -->
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:2px;">
                <img src="${LOGO_SRC}" alt="JCCB Logo" style="width:38px; height:38px; object-fit:contain;">
                <div style="flex:1; text-align:center;">
                    <h1 style="font-size:14.5px; font-weight:800; margin:0; color:#000000; letter-spacing:0.3px;">THE JUNAGADH COMMERCIAL CO-OPERATIVE BANK LTD.</h1>
                    <p style="font-size:8.5px; margin:1px 0 0 0; font-weight:600; color:#111111;">H.O. : “Chandrakant Malaviya Smruti Bhavan”, Choksi Bazar, Junagadh - 362001</p>
                    <p style="font-size:9px; margin:1px 0 0 0; font-weight:700; color:#000000;">Branch : <strong>${loan.branchName}</strong></p>
                </div>
                <div style="width:38px;"></div>
            </div>
            
            <div style="border-top:1.5px solid #000000; margin:2px 0 3px 0;"></div>

            <div style="text-align:center; margin:1px 0 3px 0;">
                <h2 style="font-size:11.5px; font-weight:800; margin:0; text-transform:uppercase; text-decoration:underline;">KEY FACTS STATEMENT (KFS) – SUMMARY BOX</h2>
                <div style="font-size:9.5px; font-weight:700; color:#222; margin-top:1px;">(Gold Loan – Instalment / EMI Repayment)</div>
            </div>

            <!-- KFS Summary Table for 3527 Installment Scheme with increased row height -->
            <table style="width:100%; border-collapse:collapse; font-size:9px; border:1.5px solid #000; margin-bottom:3px;">
                <thead>
                    <tr style="background-color:#f1f5f9; border-bottom:1.5px solid #000;">
                        <th style="padding:2.5px 6px; border-right:1.5px solid #000; width:40%; text-align:left; font-size:9.5px; font-weight:800;">Particulars</th>
                        <th style="padding:2.5px 6px; text-align:left; font-size:9.5px; font-weight:800;">Details</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Unique Proposal Number</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">${proposalNo}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Date of KFS</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">${formatDateDMY(loan.date)}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Borrower Name</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">${loan.borrowerName || "-"}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Customer ID</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">${loan.custNo || "-"}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">Loan Account No.</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">${loan.accountNo || "-"}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Type of Loan</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Gold Loan (Instalment / EMI)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Purpose of Loan</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">${loan.loanPurpose || "Personal Use / Business"}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Sanctioned Loan Amount</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">₹ ${sanctionAmt.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Disbursed Amount</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">₹ ${netDisbursal.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Loan Tenure</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">${tenureMonths} Months</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Rate of Interest</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">${intRate} p.a. (Fixed)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Annual Percentage Rate (APR)</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">${intRate} (Approx. as per Total Cost of Credit)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Repayment Frequency</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Monthly</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">No. of Instalments (EMIs)</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">${tenureMonths}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">EMI Amount</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">₹ ${emiAmt.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">First EMI Due Date</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">${firstEmiDate}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">Last EMI / Maturity Date</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">${lastEmiDate}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Processing Charges</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">₹ ${procCharges.toLocaleString("en-IN")}/- ${gst > 0 ? `(GST ₹${gst.toLocaleString("en-IN")}/-)` : ""}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Gold Appraiser Charges</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">₹ ${appraiserCharges.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Documentation Charges</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">₹ ${docCharges.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Other Charges (if any)</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">₹ ${otherCharges.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Penal Charges</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">2% p.a. on overdue amount for delayed period</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Security</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Pledge of Gold Ornaments (Packet #${loan.packetNo || "-"})</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Gross Weight / Net Weight of Gold</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">${totalGross.toFixed(3)} Grams / ${totalNet.toFixed(3)} Grams</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Purity of Gold</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">22 Karat (916 Purity)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">Loan-to-Value (LTV)</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">${ltv}% (Max permissible 75%)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Total Amount Payable by Borrower</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">₹ ${totalPayable.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Prepayment / Foreclosure Charges</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Nil / As per Bank Policy</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Consequences of Default</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-size:8.4px; line-height:1.25;">Delay in payment of EMI(s) will attract applicable penal charges. Continued default may result in enforcement of the pledge and sale/auction of the pledged gold in accordance with RBI guidelines and the loan agreement after giving the required notice.</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Grievance Redressal Officer</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Mr. Amrutlal Valjibhai Chavda, Head Office, Junagadh</td>
                    </tr>
                </tbody>
            </table>

            <!-- Borrower's Acknowledgement Box with Signature Clearance -->
            <div style="border:1.5px solid #000000; border-radius:4px; padding:4px 8px; background-color:#ffffff; margin-top:2px;">
                <div style="font-size:10px; font-weight:800; text-decoration:underline; margin-bottom:2px; text-transform:uppercase;">
                    BORROWER'S ACKNOWLEDGEMENT
                </div>
                <p style="font-size:8.6px; line-height:1.25; margin:0 0 3px 0; font-weight:700; text-align:justify;">
                    I/We acknowledge that I/We have received the Key Facts Statement before execution of the loan agreement. I/We have understood the loan amount, interest rate, APR, EMI amount, repayment schedule, applicable charges, security, penal charges, and consequences of default.
                </p>

                <!-- Extra vertical space for pen signing -->
                <div style="height:18px;"></div>

                <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:9.2px; font-weight:700;">
                    <div style="width:38%;">
                        <div style="display:inline-flex; align-items:flex-end; gap:4px; margin-bottom:2px; white-space:nowrap;">
                            <span>Borrower's Signature:</span>
                            <span style="display:inline-block; width:120px; border-bottom:1.5px solid #000000;"></span>
                        </div>
                        <div style="padding-left:2px;">(<strong>${loan.borrowerName || "Borrower"}</strong>)</div>
                    </div>

                    <div style="width:38%; text-align:center;">
                        <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:4px; margin-bottom:2px; white-space:nowrap;">
                            <span>Bank Official's Signature:</span>
                            <span style="display:inline-block; width:110px; border-bottom:1.5px solid #000000;"></span>
                        </div>
                        <div>(<strong>Officer / Manager</strong>)</div>
                    </div>

                    <div style="width:24%; text-align:right; line-height:1.3;">
                        <div>Date: <strong>${formatDateDMY(loan.date)}</strong></div>
                        <div>Place: <strong>${loan.branchName}</strong></div>
                    </div>
                </div>
            </div>

        </div>
        `;
    }           <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">₹ ${docCharges.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">Other Charges (if any)</td>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">₹ ${otherCharges.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">Penal Charges</td>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">2% p.a. on overdue amount for delayed period</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">Security</td>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">Pledge of Gold Ornaments (Packet #${loan.packetNo || "-"})</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">Gross Weight / Net Weight of Gold</td>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:800;">${totalGross.toFixed(3)} Grams / ${totalNet.toFixed(3)} Grams</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">Purity of Gold</td>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">22 Karat (916 Purity)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:800;">Loan-to-Value (LTV)</td>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:800;">${ltv}% (Max permissible 75%)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">Total Amount Payable by Borrower</td>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:800;">₹ ${totalPayable.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">Prepayment / Foreclosure Charges</td>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">Nil / As per Bank Policy</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">Consequences of Default</td>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-size:8px; line-height:1.2;">Delay in payment of EMI(s) will attract applicable penal charges. Continued default may result in enforcement of the pledge and sale/auction of the pledged gold in accordance with RBI guidelines and the loan agreement after giving the required notice.</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">Grievance Redressal Officer</td>
                        <td style="border:1px solid #000; padding:1.2px 5px; font-weight:700;">Mr. Amrutlal Valjibhai Chavda, Head Office, Junagadh</td>
                    </tr>
                </tbody>
            </table>

            <!-- Borrower's Acknowledgement Box with Signature Clearance -->
            <div style="border:1.5px solid #000000; border-radius:4px; padding:4px 8px; background-color:#ffffff; margin-top:2px;">
                <div style="font-size:10px; font-weight:800; text-decoration:underline; margin-bottom:2px; text-transform:uppercase;">
                    BORROWER'S ACKNOWLEDGEMENT
                </div>
                <p style="font-size:8.5px; line-height:1.25; margin:0 0 3px 0; font-weight:700; text-align:justify;">
                    I/We acknowledge that I/We have received the Key Facts Statement before execution of the loan agreement. I/We have understood the loan amount, interest rate, APR, EMI amount, repayment schedule, applicable charges, security, penal charges, and consequences of default.
                </p>

                <!-- Extra vertical space for pen signing -->
                <div style="height:18px;"></div>

                <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:9px; font-weight:700;">
                    <div style="width:38%;">
                        <div style="display:inline-flex; align-items:flex-end; gap:4px; margin-bottom:2px; white-space:nowrap;">
                            <span>Borrower's Signature:</span>
                            <span style="display:inline-block; width:120px; border-bottom:1.5px solid #000000;"></span>
                        </div>
                        <div style="padding-left:2px;">(<strong>${loan.borrowerName || "Borrower"}</strong>)</div>
                    </div>

                    <div style="width:38%; text-align:center;">
                        <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:4px; margin-bottom:2px; white-space:nowrap;">
                            <span>Bank Official's Signature:</span>
                            <span style="display:inline-block; width:110px; border-bottom:1.5px solid #000000;"></span>
                        </div>
                        <div>(<strong>Officer / Manager</strong>)</div>
                    </div>

                    <div style="width:24%; text-align:right; line-height:1.3;">
                        <div>Date: <strong>${formatDateDMY(loan.date)}</strong></div>
                        <div>Place: <strong>${loan.branchName}</strong></div>
                    </div>
                </div>
            </div>

        </div>
        `;
    }

    // Bullet Repayment KFS (for 3725 / 3524)
    const maturityDate = getMaturityDate(loan.date, 12);
    const goldWt = parseFloat(loan.goldWeight || 0).toFixed(3);

    return `
        <div class="print-page print-voucher print-requisition-form ${pageBreakClass}" style="width:100%; box-sizing:border-box; font-family:'Outfit', 'Segoe UI', Arial, sans-serif; color:#000000; line-height:1.3; background-color:#ffffff; font-size:10px;">
            
            <!-- Bank Header with Logo on Left -->
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:2px;">
                <img src="${LOGO_SRC}" alt="JCCB Logo" style="width:42px; height:42px; object-fit:contain;">
                <div style="flex:1; text-align:center;">
                    <h1 style="font-size:15.5px; font-weight:800; margin:0; color:#000000; letter-spacing:0.3px;">THE JUNAGADH COMMERCIAL CO-OPERATIVE BANK LTD.</h1>
                    <p style="font-size:9.5px; margin:1px 0 0 0; font-weight:600; color:#111111;">H.O. : “Chandrakant Malaviya Smruti Bhavan”, Choksi Bazar, Junagadh - 362001</p>
                    <p style="font-size:10px; margin:1px 0 0 0; font-weight:700; color:#000000;">Branch : <strong>${loan.branchName}</strong></p>
                </div>
                <div style="width:42px;"></div>
            </div>
            
            <div style="border-top:1.5px solid #000000; margin:2px 0 4px 0;"></div>

            <div style="text-align:center; margin:2px 0 4px 0;">
                <h2 style="font-size:12.5px; font-weight:800; margin:0; text-transform:uppercase; text-decoration:underline;">KEY FACTS STATEMENT (KFS) – SUMMARY BOX</h2>
                <div style="font-size:10.5px; font-weight:700; color:#222; margin-top:1px;">(Gold Loan – Bullet Repayment)</div>
            </div>

            <!-- KFS Summary Table with increased row height -->
            <table style="width:100%; border-collapse:collapse; font-size:9.5px; border:1.5px solid #000; margin-bottom:5px;">
                <thead>
                    <tr style="background-color:#f1f5f9; border-bottom:1.5px solid #000;">
                        <th style="padding:3px 6px; border-right:1.5px solid #000; width:38%; text-align:left; font-size:10px; font-weight:800;">Particulars</th>
                        <th style="padding:3px 6px; text-align:left; font-size:10px; font-weight:800;">Details</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Unique Proposal Number</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">${proposalNo}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Date of KFS</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">${formatDateDMY(loan.date)}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Borrower Name</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">${loan.borrowerName || "-"}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Customer ID</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">${loan.custNo || "-"}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">Loan Account No.</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">${loan.accountNo || "-"}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Type of Loan</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Gold Loan (Product Code: <strong>${loan.productCode || "-"}</strong>)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Purpose of Loan</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">${loan.loanPurpose || "Personal Use / Business"}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Sanctioned Loan Amount</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">₹ ${sanctionAmt.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Disbursed Amount</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">₹ ${netDisbursal.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Tenure of Loan</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">12 Months</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Rate of Interest</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">${intRate} p.a. (Fixed)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Annual Percentage Rate (APR)</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">${intRate} (Approx. as per Total Cost of Credit)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Interest Recovery</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Monthly / Quarterly / At Maturity (as per sanction terms)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">Repayment Type</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">Bullet Repayment</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Repayment Terms</td>
                        <td style="border:1px solid #000; padding:2.2px 6px;">The principal amount is repayable in one lump sum on or before the due date. Interest shall be paid as per the sanctioned terms.</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Due Date of Maturity</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">${maturityDate}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Processing Charges</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">₹ ${procCharges.toLocaleString("en-IN")}/- ${gst > 0 ? `(GST ₹${gst.toLocaleString("en-IN")}/-)` : ""}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Appraiser Charges</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">₹ ${appraiserCharges.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Documentation Charges</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">₹ ${docCharges.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Other Charges (if any)</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">₹ ${otherCharges.toLocaleString("en-IN")}/-</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Penal Charges (in case of default)</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">2.00% p.a. additional overdue interest for default period</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Security</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Pledge of Gold Ornaments (Packet #${loan.packetNo || "-"})</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Gross Weight / Net Weight of Gold</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">${goldWt} Grams / ${goldWt} Grams</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Purity of Gold</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">22 Karat (916 Purity)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">Loan-to-Value (LTV)</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">${ltv}% (Max permissible 75%)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Total Amount Payable at Maturity</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:800;">₹ ${sanctionAmt.toLocaleString("en-IN")}/- (Subject to interest accrued as per terms)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Prepayment / Foreclosure Charges</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Nil (No prepayment penalty)</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Consequences of Default</td>
                        <td style="border:1px solid #000; padding:2.2px 6px;">In case of non-payment on the due date, penal charges will apply. If the default continues, the Bank may enforce the pledge and recover dues by sale/auction of the pledged gold in accordance with RBI guidelines and the loan agreement, after giving the required notice.</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Grievance Redressal Officer</td>
                        <td style="border:1px solid #000; padding:2.2px 6px; font-weight:700;">Mr. Amrutlal Valjibhai Chavda, Head Office, Junagadh</td>
                    </tr>
                </tbody>
            </table>

            <!-- Borrower's Acknowledgement Box with Enhanced Signature Height -->
            <div style="border:1.5px solid #000000; border-radius:4px; padding:6px 8px; background-color:#ffffff; margin-top:4px;">
                <div style="font-size:11px; font-weight:800; text-decoration:underline; margin-bottom:3px; text-transform:uppercase;">
                    BORROWER'S ACKNOWLEDGEMENT
                </div>
                <p style="font-size:9px; line-height:1.35; margin:0 0 6px 0; font-weight:700; text-align:justify;">
                    I/We acknowledge that I/We have received and understood this Key Facts Statement before execution of the loan documents. The loan amount, interest rate, applicable charges, bullet repayment terms, security, and consequences of default have been explained to me/us.
                </p>

                <!-- Extra vertical space for pen signing -->
                <div style="height:22px;"></div>

                <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:9.5px; font-weight:700;">
                    <div style="width:38%;">
                        <div style="display:inline-flex; align-items:flex-end; gap:6px; margin-bottom:2px; white-space:nowrap;">
                            <span>Borrower's Signature:</span>
                            <span style="display:inline-block; width:130px; border-bottom:1.5px solid #000000;"></span>
                        </div>
                        <div style="padding-left:2px;">(<strong>${loan.borrowerName || "Borrower"}</strong>)</div>
                    </div>

                    <div style="width:38%; text-align:center;">
                        <div style="display:inline-flex; align-items:flex-end; justify-content:center; gap:6px; margin-bottom:2px; white-space:nowrap;">
                            <span>Bank Official's Signature:</span>
                            <span style="display:inline-block; width:120px; border-bottom:1.5px solid #000000;"></span>
                        </div>
                        <div>(<strong>Officer / Manager</strong>)</div>
                    </div>

                    <div style="width:24%; text-align:right; line-height:1.4;">
                        <div>Date: <strong>${formatDateDMY(loan.date)}</strong></div>
                        <div>Place: <strong>${loan.branchName}</strong></div>
                    </div>
                </div>
            </div>

        </div>
    `;
}

function renderValuationReportTable(loan) {
    let items = (loan.ornamentsItems && loan.ornamentsItems.length > 0)
        ? loan.ornamentsItems
        : [{
            sr: 1,
            desc: loan.ornamentsDesc || "સોનાના દાગીના",
            pcs: 1,
            grossGm: parseFloat(loan.goldWeight || 0),
            grossMg: 0,
            netGm: parseFloat(loan.goldWeight || 0),
            netMg: 0,
            purity: "22 Kt",
            val: parseFloat(loan.marketValue || 0)
        }];

    let totalPcs = 0;
    let totalGrossGm = 0;
    let totalGrossMg = 0;
    let totalNetGm = 0;
    let totalNetMg = 0;
    let totalVal = 0;

    let rowsHtml = "";
    items.forEach((item, index) => {
        const sr = index + 1;
        const pcs = parseInt(item.pcs) || 0;
        const grossGm = parseFloat(item.grossGm) || 0;
        const grossMg = parseInt(item.grossMg) || 0;
        const netGm = parseFloat(item.netGm) || 0;
        const netMg = parseInt(item.netMg) || 0;
        const purity = item.purity || "22 Kt";
        const val = parseFloat(item.val) || 0;

        totalPcs += pcs;
        totalGrossGm += grossGm;
        totalGrossMg += grossMg;
        totalNetGm += netGm;
        totalNetMg += netMg;
        totalVal += val;

        rowsHtml += `
            <tr style="height:15px;">
                <td style="border:1px solid #000; padding:1px 2px; font-weight:700;">${sr}</td>
                <td style="border:1px solid #000; padding:1px 3px; text-align:left; font-weight:700;">${item.desc || "-"}</td>
                <td style="border:1px solid #000; padding:1px 2px; font-weight:700;">${pcs || "-"}</td>
                <td style="border:1px solid #000; padding:1px 2px; text-align:right; font-weight:700;">${grossGm > 0 ? grossGm.toFixed(3) : "-"}</td>
                <td style="border:1px solid #000; padding:1px 2px; text-align:right; font-weight:700;">${grossMg > 0 ? grossMg : "0"}</td>
                <td style="border:1px solid #000; padding:1px 2px; text-align:right; font-weight:700;">${netGm > 0 ? netGm.toFixed(3) : "-"}</td>
                <td style="border:1px solid #000; padding:1px 2px; text-align:right; font-weight:700;">${netMg > 0 ? netMg : "0"}</td>
                <td style="border:1px solid #000; padding:1px 2px; font-weight:700;">${purity}</td>
                <td style="border:1px solid #000; padding:1px 3px; text-align:right; font-weight:700;">${val > 0 ? val.toLocaleString("en-IN") : "-"}</td>
            </tr>
        `;
    });

    const minRows = 10;
    for (let i = items.length + 1; i <= minRows; i++) {
        rowsHtml += `
            <tr style="height:14px;">
                <td style="border:1px solid #000; padding:1px; font-weight:700;">${i}</td>
                <td style="border:1px solid #000;"></td>
                <td style="border:1px solid #000;"></td>
                <td style="border:1px solid #000;"></td>
                <td style="border:1px solid #000;"></td>
                <td style="border:1px solid #000;"></td>
                <td style="border:1px solid #000;"></td>
                <td style="border:1px solid #000;"></td>
                <td style="border:1px solid #000;"></td>
            </tr>
        `;
    }

    const normGrossGm = totalGrossGm + Math.floor(totalGrossMg / 1000);
    const normGrossMg = totalGrossMg % 1000;
    const normNetGm = totalNetGm + Math.floor(totalNetMg / 1000);
    const normNetMg = totalNetMg % 1000;
    const finalVal = totalVal > 0 ? totalVal : parseFloat(loan.marketValue || 0);

    return `
        <table style="width:100%; border-collapse:collapse; font-size:10px; border:1.5px solid #000; text-align:center; margin-bottom:4px;">
            <thead>
                <tr style="background-color:#f1f5f9; border-bottom:1px solid #000;">
                    <th rowspan="2" style="border:1px solid #000; padding:2px; width:26px;">ક્રમ</th>
                    <th rowspan="2" style="border:1px solid #000; padding:2px 3px;">દાગીનાની વિગત</th>
                    <th rowspan="2" style="border:1px solid #000; padding:2px; width:32px;">નંગ</th>
                    <th colspan="2" style="border:1px solid #000; padding:1px 2px;">ગ્રોસ વજન</th>
                    <th colspan="2" style="border:1px solid #000; padding:1px 2px;">નેટ વજન</th>
                    <th rowspan="2" style="border:1px solid #000; padding:2px; width:55px;">શુદ્ધતા કેરેટ</th>
                    <th rowspan="2" style="border:1px solid #000; padding:2px 3px; width:70px;">કિંમત રૂ.</th>
                </tr>
                <tr style="background-color:#f1f5f9; border-bottom:1.5px solid #000;">
                    <th style="border:1px solid #000; padding:1px 2px; width:40px;">ગ્રામ</th>
                    <th style="border:1px solid #000; padding:1px 2px; width:36px;">મી.ગ્રા.</th>
                    <th style="border:1px solid #000; padding:1px 2px; width:40px;">ગ્રામ</th>
                    <th style="border:1px solid #000; padding:1px 2px; width:36px;">મી.ગ્રા.</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
                <tr style="background-color:#f8fafc; font-weight:800; border-top:1.5px solid #000; height:15px;">
                    <td colspan="2" style="border:1px solid #000; padding:2px 3px; text-align:right;">કુલ સરવાળો</td>
                    <td style="border:1px solid #000; padding:2px;">${totalPcs || "-"}</td>
                    <td style="border:1px solid #000; padding:2px; text-align:right;">${normGrossGm > 0 ? normGrossGm.toFixed(3) : "-"}</td>
                    <td style="border:1px solid #000; padding:2px; text-align:right;">${normGrossMg > 0 ? normGrossMg : "0"}</td>
                    <td style="border:1px solid #000; padding:2px; text-align:right;">${normNetGm > 0 ? normNetGm.toFixed(3) : "-"}</td>
                    <td style="border:1px solid #000; padding:2px; text-align:right;">${normNetMg > 0 ? normNetMg : "0"}</td>
                    <td style="border:1px solid #000; padding:2px;">-</td>
                    <td style="border:1px solid #000; padding:2px 3px; text-align:right; font-size:10.5px;">${finalVal > 0 ? finalVal.toLocaleString("en-IN") : "-"}</td>
                </tr>
            </tbody>
        </table>
    `;
}

// Convert Number to Gujarati Words
const GUJ_1_TO_99 = [
    "", "એક", "બે", "ત્રણ", "ચાર", "પાંચ", "છ", "સાત", "આઠ", "નવ", "દસ",
    "અગિયાર", "બાર", "તેર", "ચૌદ", "પંદર", "સોળ", "સત્તર", "અઢાર", "ઓગણીસ", "વીસ",
    "એકવીસ", "બાવીસ", "ત્રેવીસ", "ચોવીસ", "પચીસ", "છવીસ", "સત્તાવીસ", "અઠ્ઠાવીસ", "ઓગણત્રીસ", "ત્રીસ",
    "એકત્રીસ", "બત્રીસ", "તેત્રીસ", "ચોત્રીસ", "પાંત્રીસ", "છત્રીસ", "સાડત્રીસ", "આડત્રીસ", "ઓગણચાલીસ", "ચાલીસ",
    "એકતાલીસ", "બેતાલીસ", "તેતાલીસ", "ચુમ્માલીસ", "પિસ્તાલીસ", "છેતાલીસ", "સુડતાલીસ", "અડતાલીસ", "ઓગણપચાસ", "પચાસ",
    "એકાવન", "બાવન", "ત્રેપન", "ચોપન", "પંચાવન", "છપ્પન", "સત્તાવન", "અઠ્ઠાવન", "ઓગણસાઠ", "સાઠ",
    "એકસઠ", "બાસઠ", "ત્રેસઠ", "ચોસઠ", "પાંસઠ", "છાસઠ", "સડસઠ", "અડસઠ", "ઓગણસિત્તેર", "સિત્તેર",
    "એકોતેર", "બોતેર", "તેંતેર", "ચુમોતેર", "પંચોતેર", "છોતેર", "સંતોતેર", "અઠોતેર", "ઓગણાએંસી", "એંસી",
    "એક્યાસી", "બ્યાસી", "ત્યાસી", "ચોર્યાસી", "પંચાસી", "છ્યાસી", "સત્ત્યાસી", "અઠ્યાસી", "નેવ્યાસી", "નેવું",
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
        words += (GUJ_1_TO_99[thousand] || convertUnderThousand(thousand)) + " હજાર ";
    }
    if (num > 0) {
        words += convertUnderThousand(num) + " ";
    }

    return "રૂપિયા " + words.trim() + " પૂરા";
}

function numberToWords(num) {
    if (num === 0) return "Zero Rupees Only";
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function inWords(n) {
        if (n === 0) return "";
        if (n < 20) return a[n] + " ";
        if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10] + " ";
        if (n < 1000) return a[Math.floor(n / 100)] + " Hundred " + inWords(n % 100);
        if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + inWords(n % 1000);
        if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + inWords(n % 100000);
        return inWords(Math.floor(n / 10000000)) + "Crore " + inWords(n % 10000000);
    }

    return inWords(Math.floor(num)).trim() + " Rupees Only";
}

function roundTo10(val) {
    return Math.round(val / 10) * 10;
}

function roundUpTo5(val) {
    return Math.ceil(val / 5) * 5;
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

    const btnSingle = document.getElementById("btn-print-single-a4");
    if (btnSingle) {
        btnSingle.onclick = () => {
            if (currentPrintLoanId) {
                const targetId = currentPrintLoanId;
                closePrintModal();
                printVoucher(targetId, "single");
            }
        };
    }

    const btnAppForm = document.getElementById("btn-print-application-form");
    if (btnAppForm) {
        btnAppForm.onclick = () => {
            if (currentPrintLoanId) {
                const targetId = currentPrintLoanId;
                closePrintModal();
                printVoucher(targetId, "application_form");
            }
        };
    }
}

// ==================== CUSTOMER MASTER DATABASE CRUD ====================
function renderCustomerMasterList() {
    const tbody = document.getElementById("customer-list-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const searchInput = document.getElementById("customer-dir-search");
    const query = searchInput ? searchInput.value.toLowerCase() : "";

    const filtered = state.customers.filter(c => {
        return !query || 
            c.custNo.toLowerCase().includes(query) || 
            c.name.toLowerCase().includes(query) || 
            c.mobile.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No customers found.</td></tr>`;
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
        const age = parseInt(document.getElementById("m-cust-age").value) || 0;
        const occupation = document.getElementById("m-cust-occupation").value.trim();
        const religion = document.getElementById("m-cust-religion").value.trim();
        const caste = document.getElementById("m-cust-caste") ? document.getElementById("m-cust-caste").value.trim() : "";
        const mobile = document.getElementById("m-cust-mobile").value.trim();
        const nomineeName = document.getElementById("m-cust-nominee-name").value.trim();
        const nomineeRelation = document.getElementById("m-cust-nominee-relation").value.trim();

        if (editId) {
            const index = state.customers.findIndex(c => c.custNo === editId);
            if (index !== -1) {
                state.customers[index] = {
                    ...state.customers[index],
                    name, address, savingsAc, age, occupation, religion, caste,
                    mobile, nomineeName, nomineeRelation,
                    photo: currentUploadedMasterCustPhoto || state.customers[index].photo || ""
                };
                alert("Customer profile updated.");
            }
        } else {
            if (state.customers.some(c => c.custNo === custNo)) {
                alert("A customer with this Customer Number already exists!");
                return;
            }
            const newCust = {
                custNo, name, address, savingsAc, age, occupation, religion, caste,
                mobile, nomineeName, nomineeRelation,
                photo: currentUploadedMasterCustPhoto || ""
            };
            state.customers.push(newCust);
            alert("Customer profile saved.");
        }

        saveState();
        resetCustomerMasterForm();
        renderCustomerMasterList();
    });

    const cancelBtn = document.getElementById("customer-cancel-edit-btn");
    if (cancelBtn) {
        cancelBtn.onclick = resetCustomerMasterForm;
    }

    const searchInput = document.getElementById("customer-dir-search");
    if (searchInput) {
        searchInput.oninput = renderCustomerMasterList;
    }
}

function resetCustomerMasterForm() {
    const form = document.getElementById("customer-master-form");
    if (!form) return;
    form.reset();
    document.getElementById("edit-customer-id").value = "";
    document.getElementById("customer-form-title").textContent = "New Customer Profile";
    document.getElementById("customer-save-btn").innerHTML = '<i class="fa-solid fa-user-plus"></i> Save Customer Profile';
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
    if (document.getElementById("m-cust-caste")) document.getElementById("m-cust-caste").value = customer.caste || "";
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
        caste: document.getElementById("cust-caste") ? document.getElementById("cust-caste").value.trim() : "",
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
window.editValuer = editValuer;
window.deleteValuer = deleteValuer;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.openPrintModal = openPrintModal;
window.closePrintModal = closePrintModal;
window.editCustomerProfile = editCustomerProfile;
window.deleteCustomerProfile = deleteCustomerProfile;
window.removeOrnamentRow = removeOrnamentRow;
window.addOrnamentRow = addOrnamentRow;
window.editDailyGoldRate = editDailyGoldRate;
window.deleteDailyGoldRate = deleteDailyGoldRate;

// ==================== APP INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", () => {
    loadState();
    initTabs();
    initAuth();
    initFormSubmit();
    initPrintModal();
    initPhotoUploads();
    initCustomerMasterForm();
    initDailyGoldRateMaster();
    initValuerMaster();

    if (state.currentSession) {
        enterApp();
    } else {
        exitApp();
    }
});
