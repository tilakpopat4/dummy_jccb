# 🏛️ બેંક સ્થાનિક વિન્ડોઝ સર્વર ડિપ્લોયમેન્ટ પ્લાન (On-Premise Server Plan)
## ધી જૂનાગઢ કોમર્શીયલ કો-ઓપરેટીવ બેંક લી. (JCCB) — ગોલ્ડ લોન પોર્ટલ

---

## ૧. મુખ્ય ઉદ્દેશ્ય અને આરબીઆઈ (RBI) નિયમ પાલન

* **મુખ્ય ઉદ્દેશ્ય:** બેંકના પોતાના આંતરિક વિન્ડોઝ સર્વર (Local Windows Server) પર સંપૂર્ણપણે સ્થાનિક, ક્લાઉડ-મુક્ત (Zero Cloud / No Firebase) વેબ અને ડેટાબેઝ સિસ્ટમ ચલાવવી.
* **સુરક્ષા અને ગોપનીયતા:** **RBI Data Localization & Banking Security Guidelines** ના તમામ નિયમોનું ૧૦૦% પાલન થાય છે. ગ્રાહકોની ખાનગી માહિતી (Aadhaar, PAN), સોનાના દાગીનાની વિગતો, વેલ્યુએશન રેકોર્ડ અને હિસાબી ડેટા બેંકની પોતાની ઑફિસ અને સર્વરની બહાર ઇન્ટરનેટ પર ક્યાંય મોકલવામાં આવતો નથી.

---

## ૨. સિસ્ટમ આર્કિટેક્ચર (System Architecture)

```
                               ┌─────────────────────────────────────────────────────────────┐
                               │                 બેંક મુખ્ય વિન્ડોઝ સર્વર                    │
                               │             (IP: 192.168.1.100 અથવા goldloan.jccb.local)    │
                               │                                                             │
                               │  ┌───────────────────────────────────────────────────────┐  │
                               │  │   સ્થાનિક વેબ અને REST API સર્વર (Node.js / Express)  │  │
                               │  │   • પોર્ટ: 5000 / 8080 (ઓટો-સ્ટાર્ટ વિન્ડોઝ સર્વિસ)   │  │
                               │  │   • પોર્ટલ UI: HTML, CSS, JavaScript                  │  │
                               │  │   • શાખા લોગઇન, લોન ડેટા, સોનાના ભાવ, રિપોર્ટ્સ        │  │
                               │  └──────────────────────────┬────────────────────────────┘  │
                               │                             ▼                               │
                               │  ┌───────────────────────────────────────────────────────┐  │
                               │  │   સ્થાનિક સુરક્ષિત ડેટાબેઝ (SQLite / MS SQL)          │  │
                               │  │   • ફાઇલ પાથ: D:\JCCB_Bank_Data\goldloan.sqlite       │  │
                               │  │   • હાઈ-સ્પીડ સુરક્ષિત ACID ટ્રાન્ઝેક્શન્સ            │  │
                               │  │   • બહારના ઇન્ટરનેટ સાથે કોઈ કનેક્શન નહીં             │  │
                               │  └──────────────────────────┬────────────────────────────┘  │
                               │                             ▼                               │
                               │  ┌───────────────────────────────────────────────────────┐  │
                               │  │   ઓટોમેટીક દૈનિક બેકઅપ સિસ્ટમ (Automated Backup)      │  │
                               │  │   • બીજી હાર્ડ ડ્રાઈવ / બેંક NAS / ટેપ સ્ટોરેજ        │  │
                               │  └───────────────────────────────────────────────────────┘  │
                               └─────────────────────────────▲───────────────────────────────┘
                                                             │
                                   ┌─────────────────────────┴─────────────────────────┐
                                   │ બેંકનું ખાનગી નેટવર્ક (LAN / Intranet / Leased VPN) │
                                   └─────────────────────────┬─────────────────────────┘
                                                             │
                     ┌───────────────────────────────────────┼───────────────────────────────────────┐
                     ▼                                       ▼                                       ▼
       ┌───────────────────────────┐           ┌───────────────────────────┐           ┌───────────────────────────┐
       │   હેડ ઓફિસ એડમિન કમ્પ્યુટર │           │   શાખા ૦૧ (આઝાદચોક શાખા)  │           │   શાખા ૦૨ (જોશીપરા શાખા)  │
       │ • સમગ્ર બેંકનો સેન્ટ્રલ ડેટા│           │ • માત્ર પોતાની શાખાનો ડેટા│           │ • માત્ર પોતાની શાખાનો ડેટા│
       │ • નવી શાખા ઉમેરવી / રદ કરવી│           │ • નવી લોન એન્ટ્રી & પ્રિન્ટ│           │ • નવી લોન એન્ટ્રી & પ્રિન્ટ│
       │ • દૈનિક સોનાનો ભાવ સેટ કરવો │           │ • દૈનિક વાઉચર & રજીસ્ટર   │           │ • દૈનિક વાઉચર & રજીસ્ટર   │
       └───────────────────────────┘           └───────────────────────────┘           └───────────────────────────┘
```

---

## ૩. ટેકનોલોજી અને સ્ટોરેજ એન્જિન (Technology Stack)

| ઘટક (Component) | ટેકનોલોજી (Technology) | કારણ અને ફાયદા (Why this?) |
|---|---|---|
| **સર્વર ઓપરેટિંગ સિસ્ટમ** | Windows Server 2016 / 2019 / 2022 અથવા Windows 10/11 Pro | બેંકના હાલના સર્વર હાર્ડવેર સાથે ૧૦૦% સુસંગત. |
| **બેકએન્ડ એન્જિન** | Node.js (LTS) / Express.js | ખૂબ ઝડપી, એક સાથે સેંકડો શાખાઓની એન્ટ્રી હેન્ડલ કરી શકે તેવી ક્ષમતા. |
| **ડેટાબેઝ (Database)** | **SQLite 3 (WAL Mode)** અથવા **Microsoft SQL Server** | સર્વરની હાર્ડ ડ્રાઈવ પર સિંગલ એન્ક્રિપ્ટેડ ફાઇલમાં સેવ થાય છે, ઝીરો મેન્ટેનન્સ. |
| **ફ્રન્ટ-એન્ડ (UI)** | પ્યોર JavaScript, HTML5, CSS3 | બ્રાઉઝરમાં પલકવારમાં ખૂલે છે, કોઈ ભારે સોફ્ટવેર ઇન્સ્ટોલ કરવાની જરૂર નથી. |
| **બેકગ્રાઉન્ડ સર્વિસ** | NSSM / PM2 Windows Service | સર્વર રીબૂટ થાય તો પણ સિસ્ટમ આપમેળે બેકગ્રાઉન્ડમાં ચાલુ થઈ જશે. |

---

## ૪. ડેટાબેઝ માળખું (Local Database Schema)

### ૧. `branches` ટેબલ (શાખા માસ્ટર)
હેડ ઓફિસ એડમિન નવી શાખા ઉમેરી શકે છે અથવા માહિતી બદલી શકે છે:
```sql
CREATE TABLE branches (
    branch_code TEXT PRIMARY KEY,       -- દા.ત. '01', '02', '99'
    branch_name TEXT NOT NULL,          -- દા.ત. 'AZADCHOWK BRANCH'
    branch_name_guj TEXT,               -- દા.ત. 'આઝાદચોક શાખા'
    password_hash TEXT NOT NULL,        -- સુરક્ષિત પાસવર્ડ હેશ
    is_head_office INTEGER DEFAULT 0,   -- હેડ ઓફિસ માટે ૧, શાખા માટે ૦
    is_active INTEGER DEFAULT 1,
    starting_ac_no INTEGER DEFAULT 1001,
    starting_packet_no INTEGER DEFAULT 501,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### ૨. `loans` ટેબલ (લોન ખાતાઓની એન્ટ્રી)
તમામ શાખાઓના ગોલ્ડ લોન રેકોર્ડ્સ:
```sql
CREATE TABLE loans (
    id TEXT PRIMARY KEY,                -- દા.ત. 'LOAN_1724912345678_01'
    branch_code TEXT NOT NULL,          -- જે શાખાની લોન હોય તે કોડ
    date TEXT NOT NULL,                 -- તારીખ (YYYY-MM-DD)
    account_no TEXT NOT NULL,           -- લોન ખાતા નંબર
    packet_no TEXT NOT NULL,            -- પેકેટ નંબર
    customer_no TEXT,                   -- કસ્ટમર નંબર
    borrower_name TEXT NOT NULL,        -- ખાતેદારનું નામ
    mobile TEXT,                        -- મોબાઇલ નંબર
    address TEXT,                       -- સરનામું
    savings_ac TEXT,                    -- બચત ખાતા નંબર
    loan_type TEXT NOT NULL,            -- સ્કીમ કોડ (GD-3524, GW-3725, 3527)
    interest_rate REAL NOT NULL,        -- વ્યાજ દર (દા.ત. 11.50)
    sanctioned_amount REAL NOT NULL,    -- મંજૂર લોનની રકમ
    valuation_amount REAL NOT NULL,     -- સોનાની કુલ માર્કેટ કિંમત
    gold_weight REAL NOT NULL,          -- ચોખ્ખું વજન (Net Weight)
    gross_weight REAL NOT NULL,         -- કુલ વજન (Gross Weight)
    deductions_json TEXT,               -- શેર ફી, સ્ટેમ્પ ડ્યુટી, વીમો, કપાત
    ornaments_json TEXT,                -- દાગીનાની વિગત, કેરેટ અને વજન
    customer_photo TEXT,                -- ગ્રાહકનો ફોટો (Base64)
    ornament_photo TEXT,                -- દાગીનાનો ફોટો (Base64)
    status TEXT DEFAULT 'APPROVED',     -- સ્ટેટસ (APPROVED, CLOSED)
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_code) REFERENCES branches(branch_code)
);
```

### ૩. `daily_gold_rates` ટેબલ (દૈનિક સોનાનો ભાવ)
હેડ ઓફિસ દ્વારા રોજ સવારે સોનાનો ભાવ લોક કરવામાં આવશે:
```sql
CREATE TABLE daily_gold_rates (
    rate_date TEXT PRIMARY KEY,         -- તારીખ (YYYY-MM-DD)
    rate_22k REAL NOT NULL,             -- ૨૨ કેરેટ સોનાનો ભાવ (દા.ત. 72000)
    rate_24k REAL NOT NULL,             -- ૨૪ કેરેટ સોનાનો ભાવ
    updated_by TEXT DEFAULT 'HEAD_OFFICE',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## ૫. અધિકાર અને સુરક્ષા વ્યવસ્થા (Roles & Permissions)

```
┌────────────────────────────────────────────────────────┐
│                   હેડ ઓફિસ એડમિન (HEAD OFFICE)         │
│ • તમામ ૧૭ શાખાઓનો સેન્ટ્રલ ડેટા અને રિપોર્ટ જોવો      │
│ • નવી શાખા ઉમેરવી, સુધારવી કે બંધ કરવી                 │
│ • રોજ સવારે સમગ્ર બેંક માટે સોનાનો ભાવ લોક કરવો        │
│ • સેન્ટ્રલ ડેટાબેઝ બેકઅપ અને રિસ્ટોર કરવો              │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   શાખા કક્ષાના યુઝર્સ (BRANCH USERS)   │
│ • પોતાની શાખાના પાસવર્ડથી લોગઇન કરવું                  │
│ • માત્ર પોતાની શાખાની લોન એન્ટ્રી અને વાઉચર પ્રિન્ટ    │
│ • બીજી શાખાનો ડેટા જોઈ કે બદલી શકાશે નહીં              │
│ • સોનાનો દૈનિક ભાવ માત્ર વાંચી શકાશે (બદલી શકાશે નહીં) │
└────────────────────────────────────────────────────────┘
```

---

## ૬. સર્વર ઇન્સ્ટોલેશન પ્રક્રિયા (Step-by-Step Installation)

### પગલું ૧: વિન્ડોઝ સર્વર પર Node.js ઇન્સ્ટોલ કરવું
1. [nodejs.org](https://nodejs.org) પરથી **Node.js LTS (v20.x અથવા v22.x)** ડાઉનલોડ કરો.
2. વિન્ડોઝ સર્વર પર standard MSI ઇન્સ્ટોલર રન કરો.

### પગલું ૨: પ્રોજેક્ટ ફોલ્ડર સેટઅપ કરવું
1. પ્રોજેક્ટ ફાઇલો નીચેના ફોલ્ડરમાં કોપી કરો:
   ```cmd
   D:\JCCB_Gold_Server\
   ```
2. કમાન્ડ પ્રોમ્પ્ટ (CMD as Administrator) ખોલીને રન કરો:
   ```cmd
   cd /d D:\JCCB_Gold_Server
   npm install express cors better-sqlite3 bcryptjs compression helmet
   ```

### પગલું ૩: વિન્ડોઝ ફાયરવોલ (Firewall) પોર્ટ ખોલવો
પોર્ટ `5000` પર અન્ય કમ્પ્યુટર્સ કનેક્ટ થઈ શકે તે માટે:
```cmd
netsh advfirewall firewall add rule name="JCCB Gold Portal Port 5000" dir=in action=allow protocol=TCP localport=5000
```

### પગલું ૪: વિન્ડોઝ સર્વિસ તરીકે રન કરવું (Auto-Start on Boot)
**NSSM (Non-Sucking Service Manager)** દ્વારા:
```cmd
nssm install JCCBGoldService "C:\Program Files\nodejs\node.exe" "D:\JCCB_Gold_Server\server.js"
nssm set JCCBGoldService AppDirectory "D:\JCCB_Gold_Server"
nssm set JCCBGoldService Start SERVICE_AUTO_START
nssm start JCCBGoldService
```
*હવે સર્વર રીસ્ટાર્ટ થશે તો પણ સોફ્ટવેર આપમેળે ચાલુ થઈ જશે.*

---

## ૭. દૈનિક ઓટોમેટીક બેકઅપ પ્લાન (Daily Auto Backup)

બેકઅપ સ્ક્રિપ્ટ ફાઇલ `D:\JCCB_Gold_Server\scripts\daily_backup.bat`:
```cmd
@echo off
set BACKUP_DIR=E:\JCCB_Daily_Backups\%date:~10,4%-%date:~4,2%-%date:~7,2%
mkdir "%BACKUP_DIR%" 2>nul
copy "D:\JCCB_Gold_Server\data\goldloan.sqlite" "%BACKUP_DIR%\goldloan_backup.sqlite" /Y
echo [%date% %time%] બેકઅપ સફળતાપૂર્વક પૂર્ણ થયું: %BACKUP_DIR% >> "D:\JCCB_Gold_Server\logs\backup.log"
```
*આ સ્ક્રિપ્ટને **Windows Task Scheduler** માં રોજ સાંજે ૦૮:૦૦ વાગ્યે ઓટોમેટિક રન કરવા માટે સેટ કરવી.*

---

## ૮. સ્થાનિક સર્વર vs ક્લાઉડ (Firebase) સરખામણી

| સુવિધા | બેંક સ્થાનિક સર્વર (On-Premise) | ક્લાઉડ (Firebase) |
|---|:---:|:---:|
| **ડેટા પ્રાઈવસી અને સિક્યોરિટી** | 🔒 ૧૦૦% બેંકની પોતાની ઓફિસમાં | ☁️ થર્ડ-પાર્ટી ક્લાઉડ સર્વર પર |
| **RBI ગાઇડલાઇન્સ** | ✅ સંપૂર્ણપણે માન્ય અને સુરક્ષિત | ⚠️ ક્લાઉડ ઓડિટિંગ જરૂરી |
| **ઇન્ટરનેટ નિર્ભરતા** | 🚀 ઇન્ટરનેટ વિના પણ LAN પર ચાલશે | ❌ સળંગ ઇન્ટરનેટ કનેક્શન જરૂરી |
| **ખર્ચ (Cost)** | 💰 ₹૦ (કોઈ માસિક બિલિંગ નહીં) | 💳 પ્લાન અપગ્રેડ અને ચાર્જીસ |
| **સ્પીડ (Speed)** | ⚡ સ્થાનિક નેટવર્ક સ્પીડ (< ૫ms) | 🌐 ઇન્ટરનેટ સ્પીડ પર આધારિત |
| **ડેટાબેઝ માલિકી** | 📁 સીધી SQLite/SQL ફાઇલનો કંટ્રોલ | 📑 ક્લાઉડ કન્સોલ પર નિર્ભર |
