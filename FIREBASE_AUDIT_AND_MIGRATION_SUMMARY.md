# The Junagadh Commercial Co-operative Bank Ltd. (JCCB)
## Core System Migration Assessment & Audit Summary
**From Firebase (Firestore + Auth) to Supabase (PostgreSQL + RLS)**  
**Document ID:** `JCCB-MIG-SUMMARY-20260902`  
**Classification:** Confidential — Internal Banking  
**Date:** September 02, 2026  

---

## Executive Summary & System Context

The JCCB Gold Loan Management application is currently deployed across **17 branches and Head Office with 120+ active bank employee terminals**. Over a 48-hour period in production, the system generated **123,000+ Firestore reads**, which is abnormally high for standard loan entry volume.

A comprehensive, forensic audit of the client application codebase (`app_gold.js`, `management.js`, and `firebase-config.js`) was conducted to diagnose the read surge, inventory all read and write operations, evaluate multi-tenancy and data isolation risks, and prepare a zero-data-loss migration pipeline to Supabase (PostgreSQL).

---

## 1. Root Cause of the 123,000+ Read Surge (Phase 1 Audit)

The read spike is caused by an **architectural polling and listener storm** in the client-side JavaScript, not legitimate banking transactions.

### Mathematical Breakdown of Top Offenders

| Rank | Root Cause | Exact Location | Operational Mechanism | Daily Impact (120 Users) | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **#1** | **5-Second Global Polling Loop** | [`app_gold.js:L696`](file:///d:/JCCBGold-main%2021082026-20260829T025201Z-1-001/JCCBGold-main%2021082026/app_gold.js#L696)<br>`syncCloudData()` | Runs a recursive `setInterval` every 5,000ms on all 120+ machines, executing full fetches for `loans`, `deleted_loans`, `rates`, and 5 master configuration docs. | **~691,200 poll cycles/day** reading the entire `loans` table. | 🔴 **CRITICAL (Primary Driver)** |
| **#2** | **Heartbeat Read-Before-Write** | [`app_gold.js:L1307`](file:///d:/JCCBGold-main%2021082026-20260829T025201Z-1-001/JCCBGold-main%2021082026/app_gold.js#L1307)<br>[`firebase-config.js:L1305`](file:///d:/JCCBGold-main%2021082026-20260829T025201Z-1-001/JCCBGold-main%2021082026/firebase-config.js#L1305) | Every 30 seconds, `updateDeviceHeartbeat` runs a `doc.get()` read on `active_sessions/{sessionId}` to verify if it was terminated before updating state. | **~345,600 document reads/day** solely for presence checks. | 🔴 **CRITICAL** |
| **#3** | **Unbounded Live Listeners** | [`app_gold.js:L746`](file:///d:/JCCBGold-main%2021082026-20260829T025201Z-1-001/JCCBGold-main%2021082026/app_gold.js#L746)<br>`listenLoans()` | All 120+ client tabs subscribe to the entire multi-branch `loans` collection via `onSnapshot()` without branch filtering or limits. | 1 write in any branch triggers document reads across all 120 connected clients. | 🔴 **HIGH** |
| **#4** | **Management 5s Poller** | [`management.js:L202`](file:///d:/JCCBGold-main%2021082026-20260829T025201Z-1-001/JCCBGold-main%2021082026/management.js#L202)<br>`loadAllData()` | Executes `Promise.all()` across 6 collections/docs (including full `loans` and `audit_logs(300)`) every 5 seconds. | **~17,280 full queries/day** per open central management console window. | 🔴 **HIGH** |
| **#5** | **Zero Server-Side Scoping** | [`firebase-config.js:L529`](file:///d:/JCCBGold-main%2021082026-20260829T025201Z-1-001/JCCBGold-main%2021082026/firebase-config.js#L529) | Branch operators download all 17 branches' loans over the network and filter by `branchId` in JavaScript memory. | **17× unnecessary data over-fetching** per branch terminal. | 🟠 **MEDIUM** |
| **#6** | **Discarded Unsubscribe Handlers** | `app_gold.js` & `management.js` | Return functions from `onSnapshot()` are never stored or called on re-login, causing duplicate listener accumulation. | Progressive memory and connection leaks over long sessions. | 🟠 **MEDIUM** |

---

## 2. Master Settings Overwrite Vulnerability (Phase 1B Audit)

> [!CAUTION]
> **CRITICAL FINDING:** Regular branch terminal operators currently **CAN and DO overwrite bank-wide master settings** (`settings/rulesMaster`, `settings/branchSeeds`, `settings/valuersList`, and `settings/productsList`).

### Overwrite Mechanisms Identified in Code:

1. **Automated 5-Second Background Sync Fallback (`app_gold.js:L946-L964`):**  
   If a branch terminal's fetch for bank rules or settings momentarily times out or returns empty, the branch machine immediately pushes its local `localStorage` copy of `state.rules` / `state.settings` to the cloud via `saveRules()` / `saveSettings()`.
2. **Continuous Unconditional Valuer Writes (`app_gold.js:L1031`):**  
   `saveValuersList(state.valuers, state.deletedValuerIds)` is executed **unconditionally on every 5-second sync cycle from every branch PC**, creating race conditions.
3. **Missing Role Validation in UI Forms (`app_gold.js:L7200-L7214`):**  
   The Rules Master save handler does not check if `currentSession.code === "99"`. Any branch operator can modify deduction percentages or LTV rules and commit them.
4. **Open Backend Rules (`firestore.rules:L5-L7`):**  
   `match /{document=**} { allow read, write: if true; }` grants unrestricted write access to any connected client.

---

## 3. Inventory of All Mutation (Write) Operations

| Operation | Target Collection / Document | Source Code Reference | Method | Scope | Trigger | Authorization Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`saveLoan`** | `loans/{loanId}` | `firebase-config.js:470`<br>`app_gold.js:3634, 4167, 9896, 10041, 10219, 1092` | SDK `doc.set(merge)` + REST `PATCH` | Branch Record | Loan CRUD + 5s Auto-sync for offline loans | ❌ Open in DB |
| **`deleteLoan`** | `loans/{loanId}`<br>+ `deleted_loans/{id}` | `firebase-config.js:569, 576`<br>`app_gold.js:4034, 4436` | SDK `delete()` + SDK `set()` tombstone | Target Loan Doc | Loan Deletion Modal / Account Rename | ❌ No branch ownership check |
| **`saveDailyRates`** | `rates/today`<br>+ `settings/dailyRates` | `firebase-config.js:717, 718`<br>`app_gold.js:2161, 2196, 2286` | SDK `doc.set(merge)` + REST `PATCH` | 🌐 Global Bank-Wide | Daily rate entry / Rate lock modal | ⚠️ UI check only; DB open |
| **`saveRules`** | `settings/rulesMaster` | `firebase-config.js:910`<br>`app_gold.js:962, 7211, 7232, 7335, 7488, 7530` | SDK `doc.set(merge)` + REST `PATCH` | 🌐 Global Bank-Wide | **5s Auto-Sync fallback** + Rules form | ❌ Branch PCs can overwrite |
| **`saveSettings`** | `settings/branchSeeds` | `firebase-config.js:840`<br>`app_gold.js:952, 7609, 7724` | SDK `doc.set(merge)` + REST `PATCH` | 🌐 Global Bank-Wide | **5s Auto-Sync fallback** + Settings form | ❌ Branch PCs can overwrite |
| **`saveValuersList`** | `settings/valuersList` | `firebase-config.js:1039`<br>`app_gold.js:1031, 6303, 6418, 6533` | SDK `doc.set()` + REST `PATCH` | 🌐 Global Bank-Wide | **Continuous 5s Loop from ALL 120+ PCs** | ❌ Continuous overwrite |
| **`saveProductsList`** | `settings/productsList` | `firebase-config.js:1099`<br>`app_gold.js:1041, 6604, 6692` | SDK `doc.set(merge)` + REST `PATCH` | 🌐 Global Bank-Wide | **5s Auto-Sync fallback** + Product CRUD | ❌ Branch PCs can overwrite |
| **`saveBranchesList`** | `settings/branchesList` | `firebase-config.js:978`<br>`app_gold.js:1518, 6079` | SDK `doc.set(merge)` + REST `PATCH` | 🌐 Global Bank-Wide | Branch Master update / Password change | ❌ DB open |
| **`saveBranch`** | `branches/{branchCode}` | `firebase-config.js:265`<br>`app_gold.js:1506, 6069` | SDK `doc.set(merge)` | Branch Doc | Branch Master modal save | ❌ DB open |
| **`deleteBranch`** | `branches/{branchCode}` | `firebase-config.js:274` | SDK `doc.delete()` | Branch Doc | Branch deletion | ❌ DB open |
| **`toggleBranchStatus`** | `branches/{branchCode}` | `firebase-config.js:282` | SDK `doc.update()` | Branch Doc | Active/Inactive toggle | ❌ DB open |
| **`seedDefaultBranches`**| `branches/{branchCode}` | `firebase-config.js:240` | SDK `batch.set(merge)` | All 17 Branches | Cold start initial seed | ❌ DB open |
| **`saveUserRole`** | `users/{uid}` | `firebase-config.js:316` | SDK `doc.set(merge)` | User RBAC Doc | Admin User Management | ❌ DB open |
| **`saveCustomer`** | `customers/{custId}` | `firebase-config.js:780`<br>`app_gold.js:3639, 6845` | SDK `doc.set(merge)` | Customer Record | Loan Submit / Customer Directory | ⚠️ Global customer pool |
| **`deleteCustomer`** | `customers/{custId}` | `firebase-config.js:822`<br>`app_gold.js:6980` | SDK `doc.delete()` | Customer Record | Customer Directory Delete | ⚠️ Global customer pool |
| **`updateDeviceHeartbeat`**| `active_sessions/{sid}` | `firebase-config.js:1310`<br>`app_gold.js:1282, 1309, 1332` | SDK `doc.set(merge)` + REST `PATCH` | Device Session | Continuous 30s background timer | ℹ️ Device session write |
| **`terminateActiveSession`**| `active_sessions/{sid}` | `firebase-config.js:1343`<br>`management.js:372` | SDK `doc.set(merge)` + REST `PATCH` | Target Session | Remote Killswitch Disconnect | ✅ Admin Action |
| **`deleteActiveSession`** | `active_sessions/{sid}` | `firebase-config.js:1403`<br>`app_gold.js:1363`<br>`management.js:399` | SDK `delete()` + REST `DELETE` | Target Session | User Logout / Session cleanup | ℹ️ Device session |
| **`logAuditEvent`** | `audit_logs/{logId}` | `firebase-config.js:1199`<br>`app_gold.js:1275, 1357`<br>`management.js:81, 374` | SDK `doc.set()` + REST `PATCH` | Audit Record | Security audit tracking | ❌ Not immutable in DB |

---

## 4. Target Supabase & PostgreSQL Architecture Blueprint

| Architectural Component | Current Firestore Implementation | Target Supabase (PostgreSQL) Implementation |
| :--- | :--- | :--- |
| **Data Synchronization** | Unmanaged 5-second polling loop (`setInterval`) on all clients. | **Supabase Realtime (WebSockets)** scoped only to rate changes and central alerts. Zero polling loops. |
| **Multi-Tenancy & Data Isolation** | Full collection downloaded over the wire; filtered in client memory. | **Postgres Row Level Security (RLS)**: Enforced in the SQL kernel (`WHERE branch_id = auth.jwt() ->> 'branch_id'`). |
| **Master Table Protection** | Master tables modified by branch fallback routines and open rules. | **Strict Admin-Only RLS**: Only `role = 'admin' AND branch_id = '99'` can mutate master tables; regular branches receive hard SQL `403 Forbidden`. |
| **Query Pagination** | Unbounded full collection reads. | Explicit SQL Pagination: `.range(offset, offset + limit - 1)` with index-backed cursors. |
| **Device Presence / Heartbeat** | 30s read-before-write to `active_sessions` causing 345,600 reads/day. | **Supabase Realtime Presence**: In-memory WebSocket presence tracking generating **0 database disk reads**. |
| **Audit Log Integrity** | Modifiable and deletable by any client. | **Postgres Append-Only Table**: RLS blocks `UPDATE` and `DELETE` for all users (including Super Admin). |

---

## 5. Phase 4: Data Migration (Step-by-Step Zero-Data-Loss Plan)

### A. Forensic Analysis of `loan_ornaments` Schema & Evolution

#### 1. Collection Hierarchy Confirmation
* **Firestore Storage:** `loan_ornaments` is **NOT a nested subcollection** (`loans/{loanId}/loan_ornaments`). Instead, ornament items are stored as an **embedded JSON array** (`ornamentsTable` / `ornamentsItems`) directly inside each top-level document in the **`loans`** collection.
* **Zero-Loss Guarantee:** Exporting the top-level `loans` collection guarantees **100% capture of all gold ornament valuation line items**. No subcollections will be skipped.

#### 2. Evolution Across Application Versions (Legacy vs Current)

| Target Relational Concept | Current Production Field (`app_gold.js`) | Legacy Field (`app.js` / `app_v2.js`) | Backup Vault Field (`XLSX`) |
| :--- | :--- | :--- | :--- |
| **Item Description** | `name` (e.g. `"બંગડી / Bangles"`) | `desc` | `name` or `desc` |
| **Quantity / Pieces** | `qty` (integer) | `pcs` | `qty` or `pcs` |
| **Gross Weight (Gm / Mg)** | `grossGm` (float), `grossMg` (int) | `grossGm`, `grossMg` | `grossGm`, `grossMg` |
| **Net Weight (Gm / Mg)** | `netGm` (float), `netMg` (int) | `netGm`, `netMg` | `netGm`, `netMg` |
| **Purity / Karat** | `purity` (`"22"`, `"20"`, `"18"`, `"24"`) | `purity` (`"22"`, `"22K"`) | `purity` |
| **Fine Gold (Grams)** | `fineGoldGm` (float: 3 decimals) | *(Computed on the fly)* | `fineGoldGm` |
| **Market Valuation (₹)** | `marketVal` (float) | `val` (float) | `marketVal` or `val` |

#### 3. Purity Representation Across Generations (Real Codebase Examples)

| Schema Generation | Raw Stored Purity Value | Sample Real Record Context | Standardized Karat (1-24) |
| :--- | :--- | :--- | :--- |
| **Current Production (`app_gold.js`)** | `value: "22"` | `data.purity = "22"` (Label: "22 Karat (916)") | **22 Karat** |
| | `value: "20"` | `data.purity = "20"` (Label: "20 Karat (833)") | **20 Karat** |
| | `value: "18"` | `data.purity = "18"` (Label: "18 Karat (750)") | **18 Karat** |
| | `value: "21"` | `data.purity = "21"` (Label: "21 Karat (875)") | **21 Karat** |
| | `value: "24"` | `data.purity = "24"` (Label: "24 Karat (999)") | **24 Karat** |
| **Legacy Schema (`app.js`, `app_v2.js`)** | `value: "22 Kt"` | `item.purity = "22 Kt"` (Label: "22 Kt (91.6)") | **22 Karat** |
| | `value: "24 Kt"` | `item.purity = "24 Kt"` (Label: "24 Kt (99.9)") | **24 Karat** |
| | `value: "20 Kt"` | `item.purity = "20 Kt"` (Label: "20 Kt (83.3)") | **20 Karat** |
| | `value: "18 Kt"` | `item.purity = "18 Kt"` (Label: "18 Kt (75.0)") | **18 Karat** |
| | `value: "22"` | Default fallback string in older handlers | **22 Karat** |
| **Backup Vault / Excel (`XLSX`, `JSON`)**| `value: "916"` | Fineness string in legacy batch uploads | **22 Karat** |
| | `value: "999"` | Fineness string for 24K pure gold coins | **24 Karat** |
| | `value: "91.6"` | Percentage string representation | **22 Karat** |
| | `value: "22K"` | Alphanumeric karat abbreviation | **22 Karat** |
| | `value: "750"` | Fineness string for 18K ornaments | **18 Karat** |

#### 4. Revised Target PostgreSQL `loan_ornaments` DDL (Strict Nullable Standard)

> [!IMPORTANT]
> All weight, purity, and valuation columns are defined as **NULLABLE** with **NO DEFAULT PLACEHOLDERS** (`DEFAULT 0` or `DEFAULT 22` removed). If any field cannot be parsed unambiguously, the row is rejected to `_rejected_rows` with the exact raw failure reason.

```sql
CREATE TABLE loan_ornaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id VARCHAR(64) NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    item_index INTEGER NOT NULL DEFAULT 1,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER,
    gross_weight_grams NUMERIC(10, 3),
    net_weight_grams NUMERIC(10, 3),
    purity_karat INTEGER,
    fine_gold_grams NUMERIC(10, 3),
    valuation_amount NUMERIC(15, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loan_ornaments_loan_id ON loan_ornaments(loan_id);
```

#### 5. Step 3 Parsing & Rejection Rules (Zero-Assumption Policy)
```javascript
// Transform & Validation Rules:
// 1. Gross & Net Weights: Must be valid positive floats. If unparseable -> REJECT to _rejected_rows.
// 2. Purity Normalization:
//    - "22", "22 Kt", "22K", "916", "91.6" -> 22
//    - "24", "24 Kt", "999", "99.9"       -> 24
//    - "20", "20 Kt", "833", "83.3"       -> 20
//    - "18", "18 Kt", "750", "75.0"       -> 18
//    - "21", "875"                        -> 21
//    - "19", "792"                        -> 19
//    - "17", "708"                        -> 17
//    - Any unrecognized string/value     -> REJECT to _rejected_rows (no guessing)
// 3. Fine Gold: Must equal truncateTo3Decimals((netWeight * purity) / 22).
// 4. Valuation Amount: Must be a non-negative number.
```

---

### B. Step 1 — Official Managed Firestore Export

Run in **Google Cloud Shell** or an authenticated Cloud SDK environment:

```bash
# 1. Trigger the managed server-side export to Google Cloud Storage
gcloud firestore export gs://jccbgold.firebasestorage.app/firestore_exports/jccb_staging_$(date +%Y%m%d_%H%M%S) \
  --project=jccbgold \
  --collection-ids='loans','deleted_loans','customers','rates','settings','branches','users','active_sessions','audit_logs'

# 2. Inspect the export operation status
gcloud firestore operations list --project=jccbgold --limit=1

# 3. Retrieve exact document count baseline per collection
gcloud firestore operations describe [OPERATION_NAME] --project=jccbgold
```

---

### C. Step 2 through Step 6 Execution Roadmap

* **STEP 2 — Staging Tables:** Create Postgres `_staging_*` raw tables (`JSONB` storage) and load raw Firestore exported documents unmodified before any transformation.
* **STEP 3 — Transform with Dry-Run Mode:** Execute transform script mapping `_staging_*` to normalized relational schema. Run `--dry-run` to generate detailed validation and `_rejected_rows` report before any real writes.
* **STEP 4 — Transactional Import:** Run all-or-nothing transactional SQL imports per table respecting foreign key hierarchy (`branches` → `users` → `customers` → `loans` → `loan_ornaments`).
* **STEP 5 — Mathematical Reconciliation Checkpoints:**
  1. **Document / Row Counts:** Exact match ($Postgres == Firestore$).
  2. **Financial Checksum:** $\sum \text{loans.sanctioned\_amount}$ grouped by `branch_id` in Postgres must equal the sum from Firestore export.
  3. **Ornament Valuation Integrity:** For every loan:
     $$\left| \sum \text{loan\_ornaments.valuation\_amount} - \text{loans.valuation\_amount} \right| \le ₹1.00$$
     *Any loan with divergence $> ₹1.00$ is flagged as an ornament-unpacking defect.*
  4. **Spot-Check Audit:** 20 randomly selected loans compared field-by-field.
* **STEP 6 — Cutover & Instant Rollback Plan:** Detailed maintenance window steps, delta sync, and zero-downtime rollback capability.

---

## 6. Generated Deliverables & Reports

The following formal audit deliverables have been generated in the project workspace:

1. **[PHASE_1_FIREBASE_AUDIT_REPORT.pdf](file:///d:/JCCBGold-main%2021082026-20260829T025201Z-1-001/JCCBGold-main%2021082026/PHASE_1_FIREBASE_AUDIT_REPORT.pdf)**  
   *Comprehensive architecture & Firestore read surge forensic audit report.*
2. **[PHASE_1B_WRITE_OPERATIONS_AUDIT_REPORT.pdf](file:///d:/JCCBGold-main%2021082026-20260829T025201Z-1-001/JCCBGold-main%2021082026/PHASE_1B_WRITE_OPERATIONS_AUDIT_REPORT.pdf)**  
   *Complete mutation inventory, trigger analysis, and master settings overwrite risk assessment.*
3. **[phase1_audit_report.html](file:///d:/JCCBGold-main%2021082026-20260829T025201Z-1-001/JCCBGold-main%2021082026/phase1_audit_report.html)** & **[phase1b_audit_report.html](file:///d:/JCCBGold-main%2021082026-20260829T025201Z-1-001/JCCBGold-main%2021082026/phase1b_audit_report.html)**  
   *Source print-optimized HTML templates.*
4. **[FIREBASE_AUDIT_AND_MIGRATION_SUMMARY.md](file:///d:/JCCBGold-main%2021082026-20260829T025201Z-1-001/JCCBGold-main%2021082026/FIREBASE_AUDIT_AND_MIGRATION_SUMMARY.md)**  
   *Full central audit summary, schema vulnerability analysis, and zero-data-loss migration blueprint.*
