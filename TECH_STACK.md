# 🛠️ Technology Stack Documentation
## The Junagadh Commercial Co-operative Bank Ltd. (JCCB) — Gold Loan Portal

---

## 1. High-Level Architecture Overview

The **JCCB Gold Loan Portal** is built with a zero-dependency, ultra-lightweight, and high-performance client-centric architecture designed for reliable banking operations across 17 branches.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND USER INTERFACE                                │
│                                                                                          │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │   Semantic HTML5 UI     │  │   CSS3 Banking Theme    │  │  Vanilla JavaScript ES6+ │  │
│  │   • Single Page App     │  │   • Glassmorphism       │  │  • Modular Controllers   │  │
│  │   • Multi-Tab Views     │  │   • Print Engine        │  │  • Realtime Calculations │  │
│  │   • Dynamic Modals      │  │   • Responsive Grid/Flex│  │  • Auto Numbering Logic  │  │
│  └─────────────────────────┘  └─────────────────────────┘  └──────────────────────────┘  │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │
┌────────────────────────────────────────────▼─────────────────────────────────────────────┐
│                               CLIENT-SIDE PROCESSING ENGINE                              │
│                                                                                          │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │  SheetJS (xlsx v0.18.5) │  │  Cropper.js (v1.6.1)    │  │ Security & Enforcer      │  │
│  │  • Multi-Sheet Excel    │  │  • Camera Capture       │  │  • DevTools Blocker      │  │
│  │  • Photo Vault Export   │  │  • Lossless Compression │  │  • Uppercase Sanitizer   │  │
│  │  • Valuer/Loan Importer │  │  • Base64 Converter     │  │  • Anti-Tampering Shield │  │
│  └─────────────────────────┘  └─────────────────────────┘  └──────────────────────────┘  │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │
┌────────────────────────────────────────────▼─────────────────────────────────────────────┐
│                            DATA STORAGE & SYNCHRONIZATION MODES                          │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Local Offline Engine (Built-in)                                                 │  │
│  │    • Web Storage API (localStorage & sessionStorage)                               │  │
│  │    • Works 100% without internet on any browser                                    │  │
│  ├────────────────────────────────────────────────────────────────────────────────────┤  │
│  │ 2. Cloud Synchronization (Connected)                                               │  │
│  │    • Firebase SDK v10 (Cloud Firestore Realtime DB + Auth + Offline Persistence)    │  │
│  │    • Google Drive API v3 (OAuth2 GIS Automated Daily Backup Vault)                 │  │
│  ├────────────────────────────────────────────────────────────────────────────────────┤  │
│  │ 3. On-Premise Bank Server (Air-Gapped / Intranet Deployment)                       │  │
│  │    • Node.js / Express REST API Engine                                             │  │
│  │    • Local SQLite 3 / MS SQL Server Database on Bank Windows Server                │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Technology Breakdown

### 🎨 Layer 1: Frontend & Presentation

| Technology / Library | Version / Source | Purpose & Usage in Portal |
|---|---|---|
| **HTML5** | Standard | Semantic UI structure, custom data attributes (`data-tab`, `data-go-tab`), accessible forms, modal dialogs, and SVG vectors. |
| **CSS3** | Custom (`styles.css`) | Curated banking theme, CSS Custom Properties (CSS variables), sleek dark/light glowing elements, glassmorphism, flexbox, and CSS Grid. |
| **Print CSS Engine** | `@media print` | Specialized high-precision layouts for: <br>• **A4 Single Page Voucher**<br>• **3-in-1 A4 Dotted Cut Voucher** (Bank Copy, Customer Copy, Vault Packet Copy)<br>• **4-Page Full Sanad & Loan Agreement Documents** |
| **Google Fonts (Outfit)** | Google Fonts CDN | Modern typography loaded with weights `300` to `800` for crisp legibility across banking screens. |
| **FontAwesome** | v6.4.0 (CDN) | High-definition iconography across dashboard cards, action buttons, status pills, and navigation tabs. |

---

### ⚙️ Layer 2: Core Application Logic & Calculations

| Technology | Implementation File | Purpose & Usage |
|---|---|---|
| **Vanilla JavaScript** | [`app_gold.js`](file:///d:/JCCBGold-main%2021082026-20260829T025201Z-1-001/JCCBGold-main%2021082026/app_gold.js) | Complete banking business logic, multi-branch routing, ledger calculations, customer directory, valuer master, and automated serial generation. |
| **Dynamic Calculation Engine** | Pure Math in JS | • Gold Market Value = `(Net Weight / 10) * Daily 22K Rate`<br>• Maximum Eligible Loan = `75% Market Value (LTV)`<br>• Automated Scheme Switching (`GW-3725`, `GD-3524`, `3527`, `3553`)<br>• Automated Deductions: Share Capital (A & B), Member Fee, Valuer Fee, Stamp Duty, Insurance, CGST, SGST. |
| **Input Enforcer & Sanitizer** | Event Listeners | Intercepts keyboard input to automatically convert text to uppercase English while filtering out unintended characters in text fields. |
| **Security Shield** | Inline Head Script | Disables right-click context menu and intercepts developer inspection hotkeys (`F12`, `Ctrl+Shift+I/J/C`, `Ctrl+U/S`). |

---

### 📦 Layer 3: Client-Side Helper Libraries

| Library | Version / CDN | Key Features & Implementation |
|---|---|---|
| **SheetJS (xlsx.full.min.js)** | `v0.18.5` | • Instant Excel export of Loan Register.<br>• Full Database Backup and One-Click Restore.<br>• Multi-sheet Excel workbook creation.<br>• Base64 Photo Vault Sheet embedding.<br>• Multi-CDN fallback mechanism. |
| **Cropper.js** | `v1.6.1` | • Live camera capture and file picker handling.<br>• Realtime image cropping for Customer Photos and Ornament Photos.<br>• Canvas-based image compression to maintain lightweight Base64 strings. |

---

### 🗄️ Layer 4: Storage, Backend & Cloud Sync

| Layer | Technology | Usage in Project |
|---|---|---|
| **Local Web Storage** | `localStorage` + `sessionStorage` | Provides instant zero-latency offline persistence. Keeps the application completely functional even if network drops. |
| **Cloud Database** | **Firebase SDK v10 (Firestore)** | Realtime multi-branch cloud synchronization for loan records, daily rates, and branch configurations with offline cache. |
| **Cloud Backup** | **Google Identity Services (OAuth2) + Google Drive API v3** | Automated daily backup uploads of JSON/Excel workbooks directly into bank's Google Drive folder (`JCCB_GoldLoan_Daily_Backups`). |
| **On-Premise Server** *(Optional)* | **Node.js + Express + SQLite 3 / MS SQL** | 100% private, air-gapped on-premise deployment on the Bank's internal Windows Server over LAN/VPN. |

---

## 3. Key Architectural Strengths

1. **Zero External Build Tool Lock-in**: Runs directly in standard modern web browsers (Chrome, Edge, Firefox) with no compilation or heavy build pipeline required.
2. **Dual-Mode Capability**: Can run either as a standalone offline client-side web application or as a networked multi-branch portal (via Firebase or Local Windows Server).
3. **High Reliability for Banking**: Features multi-layer data redundancy across local browser storage, central database, and automated daily backup files.
