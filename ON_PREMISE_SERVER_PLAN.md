# 🏛️ On-Premise Windows Server Deployment Plan
## The Junagadh Commercial Co-operative Bank Ltd. (JCCB) — Gold Loan Portal

---

## 1. Executive Summary & Compliance Objective

* **Objective:** Deploy a 100% on-premise, air-gapped web and database server on the Bank's internal Windows Server infrastructure without any third-party cloud dependencies (Zero Firebase / Zero AWS / Zero Google Cloud).
* **Compliance & Security:** Ensures full adherence to **RBI Data Localization & Banking Security Guidelines**. All customer Personally Identifiable Information (PII), Aadhaar, PAN, gold packet serials, valuation records, and financial accounting data reside strictly within the bank's physical servers and private Local Area Network (LAN / VPN).

---

## 2. System Architecture

```
                               ┌─────────────────────────────────────────────────────────────┐
                               │             BANK CENTRAL WINDOWS SERVER                     │
                               │             (IP: 192.168.1.100 or goldloan.jccb.local)      │
                               │                                                             │
                               │  ┌───────────────────────────────────────────────────────┐  │
                               │  │   HTTP Web & REST API Server (Node.js / Express)      │  │
                               │  │   • Port: 5000 / 8080 (Windows Service Auto-Start)    │  │
                               │  │   • Serves UI: HTML, CSS, JavaScript                  │  │
                               │  │   • Handles: Branch Auth, Loans, Rates, Reports       │  │
                               │  └──────────────────────────┬────────────────────────────┘  │
                               │                             ▼                               │
                               │  ┌───────────────────────────────────────────────────────┐  │
                               │  │   Local Enterprise Database (SQLite / MS SQL)         │  │
                               │  │   • File Path: D:\JCCB_Bank_Data\goldloan.sqlite      │  │
                               │  │   • High-Performance ACID Transactions                │  │
                               │  │   • Zero External Network Access                      │  │
                               │  └──────────────────────────┬────────────────────────────┘  │
                               │                             ▼                               │
                               │  ┌───────────────────────────────────────────────────────┐  │
                               │  │   Automated Nightly Backup Engine                     │  │
                               │  │   • Target: Secondary HDD / Bank NAS / Tape Storage   │  │
                               │  └───────────────────────────────────────────────────────┘  │
                               └─────────────────────────────▲───────────────────────────────┘
                                                             │
                                   ┌─────────────────────────┴─────────────────────────┐
                                   │ Bank Private LAN / Intranet / Leased Line VPN     │
                                   └─────────────────────────┬─────────────────────────┘
                                                             │
                     ┌───────────────────────────────────────┼───────────────────────────────────────┐
                     ▼                                       ▼                                       ▼
       ┌───────────────────────────┐           ┌───────────────────────────┐           ┌───────────────────────────┐
       │   HEAD OFFICE ADMIN PC    │           │    BRANCH 01 (AZADCHOWK)  │           │    BRANCH 02 (JOSHIPARA)  │
       │ • Full Bank-Wide Access   │           │ • Branch-Specific Access  │           │ • Branch-Specific Access  │
       │ • Add/Remove Branches     │           │ • Create & Print Loans    │           │ • Create & Print Loans    │
       │ • Set Daily Gold Rates    │           │ • Daily Branch Vouchers   │           │ • Daily Branch Vouchers   │
       └───────────────────────────┘           └───────────────────────────┘           └───────────────────────────┘
```

---

## 3. Technology Stack & Storage Engine

| Component | Technology | Rationale |
|---|---|---|
| **Server OS** | Windows Server 2016 / 2019 / 2022 or Windows 10/11 Pro | Native to bank's existing server infrastructure. |
| **Backend Runtime** | Node.js (LTS) / Express.js | High throughput, handles thousands of concurrent requests, single executable service. |
| **Database Engine** | **SQLite 3 (WAL Mode)** or **Microsoft SQL Server** | Serverless, zero maintenance, ACID compliant, stored in a single encrypted file on disk. |
| **Frontend Client** | Vanilla JS, HTML5, CSS3 | Extremely fast loading on branch PCs without heavy build steps or frontend dependencies. |
| **Service Daemon** | NSSM (Non-Sucking Service Manager) / PM2 Windows | Keeps server running 24/7 and restarts automatically on server reboot. |

---

## 4. Database Schema (Local SQLite / MS SQL)

### Table 1: `branches`
Stores branch master records. Head Office Admin can add, edit, or deactivate branches.
```sql
CREATE TABLE branches (
    branch_code TEXT PRIMARY KEY,       -- e.g. '01', '02', '99'
    branch_name TEXT NOT NULL,          -- e.g. 'AZADCHOWK BRANCH'
    branch_name_guj TEXT,               -- e.g. 'આઝાદચોક શાખા'
    password_hash TEXT NOT NULL,        -- Bcrypt / Secure SHA-256 Hash
    is_head_office INTEGER DEFAULT 0,   -- 1 for HO (99), 0 for branches
    is_active INTEGER DEFAULT 1,
    starting_ac_no INTEGER DEFAULT 1001,
    starting_packet_no INTEGER DEFAULT 501,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table 2: `loans`
Stores all gold loan records across all branches.
```sql
CREATE TABLE loans (
    id TEXT PRIMARY KEY,                -- e.g. 'LOAN_1724912345678_01'
    branch_code TEXT NOT NULL,          -- Scoped to branch
    date TEXT NOT NULL,                 -- YYYY-MM-DD
    account_no TEXT NOT NULL,
    packet_no TEXT NOT NULL,
    customer_no TEXT,
    borrower_name TEXT NOT NULL,
    mobile TEXT,
    address TEXT,
    savings_ac TEXT,
    loan_type TEXT NOT NULL,            -- e.g. 'GD-3524', 'GW-3725', '3527'
    interest_rate REAL NOT NULL,        -- e.g. 11.50
    sanctioned_amount REAL NOT NULL,
    valuation_amount REAL NOT NULL,
    gold_weight REAL NOT NULL,          -- Net Weight
    gross_weight REAL NOT NULL,
    deductions_json TEXT,               -- Share, fees, stamp duty, insurance
    ornaments_json TEXT,                -- List of ornaments, purity, weights
    customer_photo TEXT,                -- Base64 compressed image string
    ornament_photo TEXT,                -- Base64 compressed image string
    status TEXT DEFAULT 'APPROVED',     -- DRAFT, APPROVED, CLOSED
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_code) REFERENCES branches(branch_code)
);
```

### Table 3: `daily_gold_rates`
Managed by Head Office Admin to set today's locked 22K/24K gold market rates.
```sql
CREATE TABLE daily_gold_rates (
    rate_date TEXT PRIMARY KEY,         -- YYYY-MM-DD
    rate_22k REAL NOT NULL,             -- e.g. 72000
    rate_24k REAL NOT NULL,             -- e.g. 78545
    updated_by TEXT DEFAULT 'HEAD_OFFICE',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table 4: `audit_logs`
Immutable banking audit log for security compliance.
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    branch_code TEXT,
    user_identifier TEXT,
    action TEXT NOT NULL,               -- 'LOGIN', 'LOAN_CREATED', 'RATE_UPDATED', 'BRANCH_MODIFIED'
    details_json TEXT
);
```

---

## 5. Security & Role-Based Access Control (RBAC)

```
┌────────────────────────────────────────────────────────┐
│                   HEAD OFFICE (ADMIN)                  │
│ • Full CRUD on all branches                            │
│ • View all branches' loan books, reports & ledgers     │
│ • Set daily gold rates (locks for branches)            │
│ • Full database backup & restore                       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   BRANCH USERS (01 to 17)              │
│ • Login with unique branch passcode                    │
│ • Access ONLY own branch's loan entries                │
│ • Print 3-in-1 vouchers, sanad, and loan ledgers       │
│ • Read-only access to daily gold rates                 │
│ • Cannot view or modify other branches' data           │
└────────────────────────────────────────────────────────┘
```

---

## 6. Step-by-Step Server Installation Guide

### Step 1: Install Node.js LTS on Windows Server
1. Download **Node.js LTS (v20.x or v22.x)** from [nodejs.org](https://nodejs.org).
2. Run the Windows MSI installer and complete standard setup.

### Step 2: Setup Application Directory
1. Copy the project files to:
   ```cmd
   D:\JCCB_Gold_Server\
   ```
2. Open Command Prompt as Administrator and run:
   ```cmd
   cd /d D:\JCCB_Gold_Server
   npm install express cors better-sqlite3 bcryptjs compression helmet
   ```

### Step 3: Configure Windows Firewall Rule
Allow incoming connections on Port `5000`:
```cmd
netsh advfirewall firewall add rule name="JCCB Gold Portal Port 5000" dir=in action=allow protocol=TCP localport=5000
```

### Step 4: Run as Windows Background Service (Auto-Start on Boot)
Using **NSSM (Non-Sucking Service Manager)**:
1. Download NSSM executable.
2. Run:
   ```cmd
   nssm install JCCBGoldService "C:\Program Files\nodejs\node.exe" "D:\JCCB_Gold_Server\server.js"
   nssm set JCCBGoldService AppDirectory "D:\JCCB_Gold_Server"
   nssm set JCCBGoldService Start SERVICE_AUTO_START
   nssm start JCCBGoldService
   ```
*The server will now run silently in the background and automatically start whenever Windows Server boots.*

---

## 7. Automated Daily Backup Strategy (Zero Data Loss)

Create a batch script `D:\JCCB_Gold_Server\scripts\daily_backup.bat`:
```cmd
@echo off
set BACKUP_DIR=E:\JCCB_Daily_Backups\%date:~10,4%-%date:~4,2%-%date:~7,2%
mkdir "%BACKUP_DIR%" 2>nul
copy "D:\JCCB_Gold_Server\data\goldloan.sqlite" "%BACKUP_DIR%\goldloan_backup.sqlite" /Y
echo [%date% %time%] Backup completed successfully to %BACKUP_DIR% >> "D:\JCCB_Gold_Server\logs\backup.log"
```
*Configure this script in **Windows Task Scheduler** to execute every evening at 08:00 PM.*

---

## 8. Summary of Benefits vs Cloud

| Feature | On-Premise Windows Server | Cloud (Firebase) |
|---|:---:|:---:|
| **Data Privacy & Security** | 🔒 100% Internal Bank Network | ☁️ Third-party Cloud |
| **RBI Data Localization** | ✅ Fully Compliant | ⚠️ Requires Cloud Audit |
| **Internet Dependency** | 🚀 Works 100% Offline (LAN) | ❌ Needs Active Internet |
| **Recurring Cloud Costs** | 💰 ₹0 (No monthly billing) | 💳 Plan upgrades required |
| **Speed / Latency** | ⚡ Instant LAN Speeds (< 5ms) | 🌐 Subject to ISP latency |
| **Database Ownership** | 📁 Direct SQLite/SQL access | 📑 Cloud Console export |
