/**
 * The Junagadh Commercial Co-operative Bank Ltd. (JCCB)
 * Firebase Configuration & Realtime RBAC Database Engine
 */

const firebaseConfig = {
  apiKey: "AIzaSyAOIUkyCR_88wGGXb10qmdyK13xWPDSOCU",
  authDomain: "jccbgold.firebaseapp.com",
  projectId: "jccbgold",
  storageBucket: "jccbgold.firebasestorage.app",
  messagingSenderId: "665851575048",
  appId: "1:665851575048:web:a823afb8824c80abe14abd",
  measurementId: "G-KGRPF845CW"
};

// Default static branch list used for initial seed / offline fallback
const DEFAULT_JCCB_BRANCHES = [
    { branchCode: "99", branchName: "99 HEAD OFFICE", branchNameGuj: "૯૯ હેડ ઓફિસ (મુખ્ય કચેરી)", role: "admin", roleTitle: "Head Office Super Admin", isActive: true, isHeadOffice: true, password: "Rahul#80810" },
    { branchCode: "01", branchName: "01 AZADCHOWK BRANCH", branchNameGuj: "૦૧ આઝાદચોક શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" },
    { branchCode: "02", branchName: "02 JOSHIPARA BRANCH", branchNameGuj: "૦૨ જોશીપરા શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" },
    { branchCode: "03", branchName: "03 DOLATPARA BRANCH", branchNameGuj: "૦૩ દોલતપરા શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" },
    { branchCode: "04", branchName: "04 KODINAR BRANCH", branchNameGuj: "૦૪ કોડીનાર શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" },
    { branchCode: "05", branchName: "05 KESHOD BRANCH", branchNameGuj: "૦૫ કેશોદ શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" },
    { branchCode: "06", branchName: "06 VANTHALI BRANCH", branchNameGuj: "૦૬ વંથલી શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" },
    { branchCode: "07", branchName: "07 MANAVADAR BRANCH", branchNameGuj: "૦૭ માણાવદર શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" },
    { branchCode: "08", branchName: "08 GANDHINAGAR BRANCH", branchNameGuj: "૦૮ ગાંધીનગર શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" },
    { branchCode: "09", branchName: "09 LIMBDI BRANCH", branchNameGuj: "૦૯ લીંબડી શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" },
    { branchCode: "10", branchName: "10 MENDARDA BRANCH", branchNameGuj: "૧૦ મેંદરડા શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" },
    { branchCode: "11", branchName: "11 VISAVADAR BRANCH", branchNameGuj: "૧૧ વિસાવદર શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" },
    { branchCode: "12", branchName: "12 JAMNAGAR BRANCH", branchNameGuj: "૧૨ જામનગર શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" },
    { branchCode: "13", branchName: "13 BUS STAND BRANCH", branchNameGuj: "૧૩ બસ સ્ટેન્ડ શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" },
    { branchCode: "14", branchName: "14 LATHI BRANCH", branchNameGuj: "૧૪ લાઠી શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" },
    { branchCode: "16", branchName: "16 AHMEDABAD BRANCH", branchNameGuj: "૧૬ અમદાવાદ શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" },
    { branchCode: "17", branchName: "17 RAJKOT BRANCH", branchNameGuj: "૧૭ રાજકોટ શાખા", role: "branch_manager", roleTitle: "Branch Manager", isActive: true, isHeadOffice: false, password: "Admin@123" }
];

const FirebaseService = {
    app: null,
    auth: null,
    db: null,
    storage: null,
    analytics: null,
    isInitialized: false,
    currentUser: null,
    userProfile: null, // { uid, email, role: 'admin'|'branch_manager'|'branch_user', branchId, branchName, isActive }

    /**
     * Initialize Firebase App and Services
     */
    init: async function() {
        try {
            if (typeof firebase === 'undefined') {
                console.warn("[Firebase] SDK script tags not loaded yet. Running in offline/local mode.");
                return false;
            }

            if (!firebase.apps.length) {
                this.app = firebase.initializeApp(firebaseConfig);
            } else {
                this.app = firebase.app();
            }

            this.auth = firebase.auth();
            this.db = firebase.firestore();
            
            // Storage is completely optional (works on free Spark plan without storage)
            if (firebase.storage) {
                try {
                    this.storage = firebase.storage();
                } catch (stErr) {
                    console.warn("[Firebase] Storage not enabled on project (using Firestore base64/local mode):", stErr);
                    this.storage = null;
                }
            }

            if (firebase.analytics) {
                try {
                    this.analytics = firebase.analytics();
                } catch (anErr) {
                    console.warn("[Firebase Analytics]", anErr);
                }
            }

            // Enable offline persistence for reliable banking operations
            try {
                await this.db.enablePersistence({ synchronizeTabs: true });
                console.log("[Firebase] Firestore offline persistence enabled.");
            } catch (err) {
                if (err.code === 'failed-precondition') {
                    console.warn("[Firebase] Persistence notice: Multiple tabs open simultaneously.");
                } else if (err.code === 'unimplemented') {
                    console.warn("[Firebase] Persistence not supported in current browser.");
                }
            }

            // Ensure authenticated Firebase session (Anonymous auth fallback)
            if (this.auth && !this.auth.currentUser) {
                try {
                    await this.auth.signInAnonymously();
                    console.log("[Firebase] Cloud authentication session active.");
                } catch (authErr) {
                    console.warn("[Firebase] Anonymous auth fallback notice:", authErr);
                }
            }

            this.isInitialized = true;
            console.log("[Firebase] Successfully connected to Firebase Project:", firebaseConfig.projectId);
            return true;
        } catch (error) {
            console.error("[Firebase] Initialization error:", error);
            this.isInitialized = false;
            return false;
        }
    },

    // =================================================================
    // AUTHENTICATION & RBAC STATE
    // =================================================================

    /**
     * Listen for Auth changes and load user RBAC profile from Firestore
     */
    onAuthStateChanged: function(callback) {
        if (!this.auth) return;
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                try {
                    const userDoc = await this.db.collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        this.userProfile = userDoc.data();
                    } else {
                        // Default profile if newly signed up
                        this.userProfile = {
                            uid: user.uid,
                            email: user.email,
                            role: 'branch_user',
                            branchId: '01',
                            branchName: 'Branch 01',
                            isActive: true,
                            createdAt: new Date().toISOString()
                        };
                    }
                } catch (e) {
                    console.warn("[Firebase] Could not fetch user profile:", e);
                }
            } else {
                this.currentUser = null;
                this.userProfile = null;
            }

            if (typeof callback === 'function') {
                callback(this.currentUser, this.userProfile);
            }
        });
    },

    /**
     * Sign in with email and password
     */
    login: async function(email, password) {
        if (!this.auth) throw new Error("Firebase Auth not initialized.");
        const cred = await this.auth.signInWithEmailAndPassword(email, password);
        const userDoc = await this.db.collection('users').doc(cred.user.uid).get();
        if (userDoc.exists) {
            this.userProfile = userDoc.data();
        }
        return { user: cred.user, profile: this.userProfile };
    },

    /**
     * Sign out
     */
    logout: async function() {
        if (this.auth) {
            await this.auth.signOut();
        }
        this.currentUser = null;
        this.userProfile = null;
    },

    /**
     * Check if current user is Head Office Admin
     */
    isAdmin: function() {
        return (this.userProfile && this.userProfile.role === 'admin' && this.userProfile.isActive) ||
               (this.userProfile && this.userProfile.branchId === '99');
    },

    /**
     * Check if user is active branch manager
     */
    isBranchManager: function() {
        return this.userProfile && this.userProfile.role === 'branch_manager' && this.userProfile.isActive;
    },

    /**
     * Get assigned branch ID
     */
    getUserBranchId: function() {
        return this.userProfile ? this.userProfile.branchId : null;
    },

    // =================================================================
    // BRANCH MANAGEMENT (HEAD OFFICE ADMIN PRIVILEGE)
    // =================================================================

    /**
     * Get all branches (realtime or fetch from Firestore)
     */
    getBranches: async function() {
        if (!this.db) return DEFAULT_JCCB_BRANCHES;
        try {
            const snapshot = await this.db.collection('branches').orderBy('branchCode').get();
            if (snapshot.empty) {
                // If branches collection is empty, seed defaults
                console.log("[Firebase] Seeding initial branch master list...");
                await this.seedDefaultBranches();
                return DEFAULT_JCCB_BRANCHES;
            }
            const list = [];
            snapshot.forEach(doc => {
                list.push({ id: doc.id, ...doc.data() });
            });
            return list;
        } catch (error) {
            console.warn("[Firebase] Error fetching branches from Firestore:", error);
            return DEFAULT_JCCB_BRANCHES;
        }
    },

    /**
     * Seed default 17 JCCB branches into Firestore
     */
    seedDefaultBranches: async function() {
        if (!this.db) return;
        const batch = this.db.batch();
        DEFAULT_JCCB_BRANCHES.forEach(branch => {
            const ref = this.db.collection('branches').doc(branch.branchCode);
            batch.set(ref, {
                ...branch,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, { merge: true });
        });
        await batch.commit();
    },

    /**
     * Add or Update a Branch (Admin Only)
     */
    saveBranch: async function(branchData) {
        if (!this.db) throw new Error("Firestore not initialized.");
        const branchCode = String(branchData.branchCode).padStart(2, '0');
        const docRef = this.db.collection('branches').doc(branchCode);
        const payload = {
            ...branchData,
            branchCode: branchCode,
            updatedAt: new Date().toISOString(),
            updatedBy: this.currentUser ? this.currentUser.uid : 'ADMIN'
        };
        if (!branchData.createdAt) {
            payload.createdAt = new Date().toISOString();
        }
        await docRef.set(payload, { merge: true });
        return { id: branchCode, ...payload };
    },

    /**
     * Remove / Delete a Branch (Admin Only)
     */
    deleteBranch: async function(branchCode) {
        if (!this.db) throw new Error("Firestore not initialized.");
        await this.db.collection('branches').doc(String(branchCode)).delete();
    },

    /**
     * Toggle Branch Active/Inactive Status
     */
    toggleBranchStatus: async function(branchCode, isActive) {
        if (!this.db) throw new Error("Firestore not initialized.");
        await this.db.collection('branches').doc(String(branchCode)).update({
            isActive: Boolean(isActive),
            updatedAt: new Date().toISOString()
        });
    },

    // =================================================================
    // USER & ROLE MANAGEMENT (HEAD OFFICE ADMIN PRIVILEGE)
    // =================================================================

    /**
     * Get all users in system (Admin only)
     */
    getUsers: async function() {
        if (!this.db) return [];
        const snapshot = await this.db.collection('users').get();
        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    },

    /**
     * Create or update a user's role and branch assignment
     */
    saveUserRole: async function(uid, userData) {
        if (!this.db) throw new Error("Firestore not initialized.");
        const userRef = this.db.collection('users').doc(uid);
        const payload = {
            ...userData,
            uid: uid,
            updatedAt: new Date().toISOString()
        };
        await userRef.set(payload, { merge: true });
    },

    /**
     * Compress base64 image if too large to fit in Firestore doc (< 1MB)
     */
    compressBase64Image: function(dataUrl, maxWidth = 400, quality = 0.6) {
        return new Promise((resolve) => {
            if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image")) {
                return resolve(dataUrl || "");
            }
            if (dataUrl.length < 120000) {
                return resolve(dataUrl);
            }
            try {
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvas = document.createElement("canvas");
                        let width = img.width;
                        let height = img.height;
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, width, height);
                        const compressed = canvas.toDataURL("image/jpeg", quality);
                        resolve(compressed);
                    } catch (e) {
                        resolve(dataUrl);
                    }
                };
                img.onerror = () => resolve(dataUrl);
                img.src = dataUrl;
            } catch (err) {
                resolve(dataUrl);
            }
        });
    },

    /**
     * Convert JS object to Firestore REST API document format
     */
    toFirestoreDocument: function(obj) {
        const fields = {};
        for (const [key, val] of Object.entries(obj)) {
            if (val === undefined || val === null) {
                fields[key] = { nullValue: null };
            } else if (typeof val === "boolean") {
                fields[key] = { booleanValue: val };
            } else if (typeof val === "number") {
                if (Number.isInteger(val)) {
                    fields[key] = { integerValue: String(val) };
                } else {
                    fields[key] = { doubleValue: val };
                }
            } else if (typeof val === "string") {
                fields[key] = { stringValue: val };
            } else if (Array.isArray(val)) {
                fields[key] = {
                    arrayValue: {
                        values: val.map(item => {
                            if (typeof item === "object" && item !== null) {
                                return { mapValue: this.toFirestoreDocument(item) };
                            } else if (typeof item === "number") {
                                return Number.isInteger(item) ? { integerValue: String(item) } : { doubleValue: item };
                            } else {
                                return { stringValue: String(item || "") };
                            }
                        })
                    }
                };
            } else if (typeof val === "object") {
                fields[key] = { mapValue: this.toFirestoreDocument(val) };
            }
        }
        return { fields };
    },

    /**
     * Convert Firestore REST API document to plain JS object
     */
    fromFirestoreDocument: function(doc) {
        if (!doc || !doc.fields) return {};
        const result = {};
        for (const [key, valObj] of Object.entries(doc.fields)) {
            if ("stringValue" in valObj) result[key] = valObj.stringValue;
            else if ("integerValue" in valObj) result[key] = parseInt(valObj.integerValue, 10);
            else if ("doubleValue" in valObj) result[key] = parseFloat(valObj.doubleValue);
            else if ("booleanValue" in valObj) result[key] = valObj.booleanValue;
            else if ("nullValue" in valObj) result[key] = null;
            else if ("mapValue" in valObj) result[key] = this.fromFirestoreDocument(valObj.mapValue);
            else if ("arrayValue" in valObj) {
                result[key] = (valObj.arrayValue.values || []).map(v => {
                    if ("stringValue" in v) return v.stringValue;
                    if ("integerValue" in v) return parseInt(v.integerValue, 10);
                    if ("doubleValue" in v) return parseFloat(v.doubleValue);
                    if ("booleanValue" in v) return v.booleanValue;
                    if ("mapValue" in v) return this.fromFirestoreDocument(v.mapValue);
                    return null;
                });
            }
        }
        if (doc.name) {
            const parts = doc.name.split("/");
            result.id = parts[parts.length - 1];
        }
        return result;
    },

    /**
     * Save a gold loan record to Firestore (Dual SDK + REST fallback)
     */
    saveLoan: async function(loanData) {
        const loanId = String(loanData.id || loanData.loanId || `GL_${Date.now()}_${loanData.branchCode || '01'}`).trim();
        
        let custPhoto = loanData.customerPhoto || "";
        let ornPhoto = loanData.ornamentPhoto || "";

        if (typeof custPhoto === "string" && custPhoto.startsWith("data:image") && custPhoto.length > 120000) {
            try {
                custPhoto = await this.compressBase64Image(custPhoto, 400, 0.6);
            } catch (e) {}
        }
        if (typeof ornPhoto === "string" && ornPhoto.startsWith("data:image") && ornPhoto.length > 120000) {
            try {
                ornPhoto = await this.compressBase64Image(ornPhoto, 400, 0.6);
            } catch (e) {}
        }

        const rawPayload = {
            ...loanData,
            id: loanId,
            loanId: loanId,
            customerPhoto: custPhoto,
            ornamentPhoto: ornPhoto,
            branchId: String(loanData.branchCode || loanData.branchId || '01'),
            updatedAt: new Date().toISOString(),
            updatedBy: this.currentUser ? this.currentUser.uid : (loanData.updatedBy || 'SYSTEM')
        };
        if (!loanData.createdAt) {
            rawPayload.createdAt = new Date().toISOString();
            rawPayload.createdBy = this.currentUser ? this.currentUser.uid : (loanData.createdBy || 'SYSTEM');
        }

        const payload = JSON.parse(JSON.stringify(rawPayload));

        // 1. Write via Firestore SDK
        if (this.db) {
            try {
                const loanRef = this.db.collection('loans').doc(loanId);
                await loanRef.set(payload, { merge: true });
                console.log("[Firebase SDK] Loan saved to Firestore:", loanId);
            } catch (sdkErr) {
                console.warn("[Firebase SDK] Firestore write notice:", sdkErr);
            }
        }

        // 2. Guaranteed REST API cloud write fallback
        try {
            const fsDoc = this.toFirestoreDocument(payload);
            await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/loans/${loanId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fsDoc)
            });
            console.log("[Firebase REST] Loan synced to Firestore cloud:", loanId);
        } catch (restErr) {
            console.warn("[Firebase REST] REST sync error:", restErr);
        }

        return payload;
    },

    /**
     * Fetch all loans from Firestore (Dual SDK + REST fallback)
     */
    getLoans: async function(branchCode = null) {
        let list = [];
        // 1. Direct REST fetch (instant response, bypasses hanging SDK WebChannel & stale cache)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/loans`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.documents)) {
                    list = data.documents.map(d => this.fromFirestoreDocument(d));
                    console.log("[Firebase REST] Fetched loans from cloud:", list.length);
                }
            }
        } catch (restErr) {
            console.warn("[Firebase REST] Error fetching loans via REST:", restErr);
        }

        // 2. Fallback to Firestore SDK
        if (list.length === 0 && this.db) {
            try {
                const snapshot = await this.db.collection('loans').get();
                snapshot.forEach(doc => {
                    const data = doc.data();
                    list.push({ ...data, id: doc.id, loanId: data.loanId || doc.id });
                });
            } catch (sdkErr) {}
        }

        if (branchCode && branchCode !== '99') {
            return list.filter(l => String(l.branchCode || l.branchId) === String(branchCode));
        }
        return list;
    },

    /**
     * Realtime listener for loan records across all branches & Head Office
     */
    listenLoans: function(branchCode, onUpdate) {
        if (!this.db) return () => {};
        return this.db.collection('loans').onSnapshot((snapshot) => {
            const list = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                list.push({ ...data, id: doc.id, loanId: data.loanId || doc.id });
            });
            if (typeof onUpdate === 'function') {
                onUpdate(list);
            }
        }, (err) => {
            console.warn("[Firebase] Loan snapshot listener notice:", err);
        });
    },

    /**
     * Delete loan record (Dual delete from loans collection + write tombstone to deleted_loans for live multi-device sync)
     */
    deleteLoan: async function(loanId) {
        if (!loanId) return;
        const cleanId = String(loanId).trim();
        let deleted = false;
        const tombstone = {
            id: cleanId,
            deletedAt: new Date().toISOString(),
            deletedBy: this.currentUser ? this.currentUser.uid : 'SYSTEM'
        };

        // 1. Delete from loans collection & record in deleted_loans via SDK
        if (this.db) {
            try {
                await this.db.collection('loans').doc(cleanId).delete();
                console.log("[Firebase SDK] Loan deleted from Firestore:", cleanId);
                deleted = true;
            } catch (e) {
                console.warn("[Firebase SDK] Loan delete SDK notice:", e);
            }
            try {
                await this.db.collection('deleted_loans').doc(cleanId).set(tombstone);
            } catch (e) {}
        }

        // 2. Guaranteed REST Fallback
        try {
            const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/loans/${cleanId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                console.log("[Firebase REST] Loan deleted via REST:", cleanId);
                deleted = true;
            }
        } catch (e) {
            console.warn("[Firebase REST] Loan delete REST notice:", e);
        }

        try {
            const fsDoc = this.toFirestoreDocument(tombstone);
            await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/deleted_loans/${cleanId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fsDoc)
            });
        } catch (e) {}

        return deleted;
    },

    /**
     * Realtime listener for deleted loans across all devices
     */
    listenDeletedLoans: function(onDeleted) {
        if (!this.db || typeof onDeleted !== 'function') return () => {};
        return this.db.collection('deleted_loans').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' || change.type === 'modified') {
                    const data = change.doc.data();
                    const deletedId = (data && data.id) ? data.id : change.doc.id;
                    if (deletedId) onDeleted(deletedId);
                }
            });
        }, (err) => {
            console.warn("[Firebase] Deleted loans listener notice:", err);
        });
    },

    /**
     * Fetch all deleted loan IDs for cold start / offline sync catchup
     */
    getDeletedLoanIds: async function() {
        let list = [];
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/deleted_loans`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.documents)) {
                    list = data.documents.map(d => {
                        const parsed = this.fromFirestoreDocument(d);
                        return parsed.id || d.name.split('/').pop();
                    });
                }
            }
        } catch (e) {}

        if (list.length === 0 && this.db) {
            try {
                const snap = await this.db.collection('deleted_loans').get();
                snap.forEach(doc => list.push(doc.id));
            } catch (e) {}
        }
        return list;
    },

    // =================================================================
    // DAILY RATES & GLOBAL SETTINGS
    // =================================================================

    /**
     * Get daily gold rates from Firestore (Direct REST with SDK fallback)
     */
    getDailyRates: async function() {
        // 1. Direct REST fetch (instant, never hangs)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/rates/today`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                const parsed = this.fromFirestoreDocument(data);
                if (parsed && (parseFloat(parsed.rate22K) > 0 || parseFloat(parsed.rate24K) > 0)) {
                    return parsed;
                }
            }
        } catch (restErr) {
            console.warn("[Firebase REST] Rates REST fetch notice:", restErr);
        }

        // 2. Fallback check in settings/dailyRates
        try {
            const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/settings/dailyRates`);
            if (res.ok) {
                const data = await res.json();
                return this.fromFirestoreDocument(data);
            }
        } catch (e) {}

        // 3. Fallback to SDK
        if (this.db) {
            try {
                const doc = await this.db.collection('rates').doc('today').get();
                if (doc && doc.exists) {
                    return doc.data();
                }
            } catch (e) {}
        }
        return null;
    },

    /**
     * Save daily gold rates to Firestore (Dual SDK + REST)
     */
    saveDailyRates: async function(ratesData) {
        const payload = JSON.parse(JSON.stringify({
            ...ratesData,
            updatedAt: new Date().toISOString(),
            updatedBy: this.currentUser ? this.currentUser.uid : 'ADMIN'
        }));

        // 1. Write via SDK
        if (this.db) {
            try {
                await Promise.all([
                    this.db.collection('rates').doc('today').set(payload, { merge: true }),
                    this.db.collection('settings').doc('dailyRates').set(payload, { merge: true })
                ]);
            } catch (e) {}
        }

        // 2. Write via REST API
        try {
            const fsDoc = this.toFirestoreDocument(payload);
            await Promise.all([
                fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/rates/today`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(fsDoc)
                }),
                fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/settings/dailyRates`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(fsDoc)
                })
            ]);
            console.log("[Firebase REST] Daily rates saved to cloud successfully.");
        } catch (restErr) {
            console.warn("[Firebase REST] Daily rates REST save error:", restErr);
        }

        return payload;
    },

    /**
     * Realtime listener for daily gold rates
     */
    listenDailyRates: function(onUpdate) {
        if (!this.db) return () => {};
        return this.db.collection('rates').doc('today').onSnapshot((doc) => {
            if (doc.exists && typeof onUpdate === 'function') {
                onUpdate(doc.data());
            }
        }, (err) => {
            console.warn("[Firebase] Rates listener notice:", err);
        });
    },

    // =================================================================
    // CUSTOMER DIRECTORY OPERATIONS & SYNC
    // =================================================================

    /**
     * Save customer profile to Firestore
     */
    saveCustomer: async function(custData) {
        if (!this.db) return custData;
        const custId = String(custData.customerNo || custData.id || `CUST_${Date.now()}`).trim();
        const docRef = this.db.collection('customers').doc(custId);
        const payload = {
            ...custData,
            id: custId,
            customerNo: custData.customerNo || custId,
            updatedAt: new Date().toISOString()
        };
        if (!custData.createdAt) {
            payload.createdAt = new Date().toISOString();
        }
        await docRef.set(payload, { merge: true });
        return payload;
    },

    /**
     * Get all customers from Firestore
     */
    getCustomers: async function() {
        if (!this.db) return [];
        try {
            const snapshot = await this.db.collection('customers').get();
            const list = [];
            snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            return list;
        } catch (e) {
            console.warn("[Firebase] Error fetching customers:", e);
            return [];
        }
    },

    /**
     * Realtime listener for customers
     */
    listenCustomers: function(onUpdate) {
        if (!this.db) return () => {};
        return this.db.collection('customers').onSnapshot((snapshot) => {
            const list = [];
            snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            if (typeof onUpdate === 'function') {
                onUpdate(list);
            }
        }, (err) => {
            console.warn("[Firebase] Customer snapshot error:", err);
        });
    },

    /**
     * Delete customer from Firestore
     */
    deleteCustomer: async function(custId) {
        if (!this.db) return;
        const id = String(custId).trim();
        await this.db.collection('customers').doc(id).delete();
    },

    // =================================================================
    // SYSTEM SETTINGS & BRANCH SEEDS SYNC
    // =================================================================

    /**
     * Save branch seeds & settings to Firestore (Dual SDK + REST)
     */
    saveSettings: async function(settingsData) {
        const payload = JSON.parse(JSON.stringify({
            ...settingsData,
            updatedAt: new Date().toISOString()
        }));

        if (this.db) {
            try {
                await this.db.collection('settings').doc('branchSeeds').set(payload, { merge: true });
                console.log("[Firebase SDK] Settings saved to cloud.");
            } catch (e) {}
        }
        try {
            const fsDoc = this.toFirestoreDocument(payload);
            await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/settings/branchSeeds`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fsDoc)
            });
        } catch (e) {}
    },

    /**
     * Get branch seeds & settings from Firestore
     */
    getSettings: async function() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/settings/branchSeeds`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                return this.fromFirestoreDocument(data);
            }
        } catch (e) {}

        if (this.db) {
            try {
                const doc = await this.db.collection('settings').doc('branchSeeds').get();
                return doc.exists ? doc.data() : null;
            } catch (e) {}
        }
        return null;
    },

    /**
     * Realtime listener for branch settings across all PCs
     */
    listenSettings: function(onUpdate) {
        if (!this.db) return () => {};
        return this.db.collection('settings').doc('branchSeeds').onSnapshot((doc) => {
            if (doc.exists && typeof onUpdate === 'function') {
                onUpdate(doc.data());
            }
        }, (err) => {
            console.warn("[Firebase] Settings snapshot error:", err);
        });
    },

    // =================================================================
    // RULES MASTER SYNC (BANK DEDUCTIONS, VALUATION SLABS, GST)
    // =================================================================

    /**
     * Save Rules Master configurations to Firestore
     */
    saveRules: async function(rulesData) {
        const payload = JSON.parse(JSON.stringify({
            ...rulesData,
            updatedAt: new Date().toISOString(),
            updatedBy: this.currentUser ? this.currentUser.uid : 'ADMIN'
        }));

        if (this.db) {
            try {
                await this.db.collection('settings').doc('rulesMaster').set(payload, { merge: true });
                console.log("[Firebase SDK] Rules Master saved to cloud.");
            } catch (e) {}
        }
        try {
            const fsDoc = this.toFirestoreDocument(payload);
            await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/settings/rulesMaster`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fsDoc)
            });
        } catch (e) {}
    },

    /**
     * Get Rules Master from Firestore
     */
    getRules: async function() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/settings/rulesMaster`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                return this.fromFirestoreDocument(data);
            }
        } catch (e) {}

        if (this.db) {
            try {
                const doc = await this.db.collection('settings').doc('rulesMaster').get();
                return doc.exists ? doc.data() : null;
            } catch (e) {}
        }
        return null;
    },

    /**
     * Realtime listener for Rules Master
     */
    listenRules: function(onUpdate) {
        if (!this.db) return () => {};
        return this.db.collection('settings').doc('rulesMaster').onSnapshot((doc) => {
            if (doc.exists && typeof onUpdate === 'function') {
                onUpdate(doc.data());
            }
        }, (err) => {
            console.warn("[Firebase] Rules listener error:", err);
        });
    },

    // =================================================================
    // BRANCHES, VALUERS & PRODUCTS MASTER SYNC
    // =================================================================

    /**
     * Save all branches list to Firestore
     */
    saveBranchesList: async function(branchesList) {
        const payload = {
            list: branchesList,
            updatedAt: new Date().toISOString()
        };
        if (this.db) {
            try {
                await this.db.collection('settings').doc('branchesList').set(payload, { merge: true });
            } catch (e) {}
        }
        try {
            const fsDoc = this.toFirestoreDocument(payload);
            await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/settings/branchesList`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fsDoc)
            });
        } catch (e) {}
    },

    /**
     * Get all branches list from Firestore
     */
    getBranchesList: async function() {
        try {
            const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/settings/branchesList`);
            if (res.ok) {
                const data = await res.json();
                const parsed = this.fromFirestoreDocument(data);
                if (parsed && Array.isArray(parsed.list)) return parsed.list;
            }
        } catch (e) {}

        if (this.db) {
            try {
                const doc = await this.db.collection('settings').doc('branchesList').get();
                if (doc.exists && doc.data().list) return doc.data().list;
            } catch (e) {}
        }
        return null;
    },

    /**
     * Realtime listener for Branches Master
     */
    listenBranches: function(onUpdate) {
        if (!this.db) return () => {};
        return this.db.collection('settings').doc('branchesList').onSnapshot((doc) => {
            if (doc.exists && typeof onUpdate === 'function') {
                const data = doc.data();
                if (Array.isArray(data.list)) onUpdate(data.list);
            }
        }, (err) => {
            console.warn("[Firebase] Branches listener error:", err);
        });
    },

    /**
     * Save all Valuers list to Firestore
     */
    saveValuersList: async function(valuersList) {
        const payload = {
            list: valuersList,
            updatedAt: new Date().toISOString()
        };
        if (this.db) {
            try {
                await this.db.collection('settings').doc('valuersList').set(payload, { merge: true });
            } catch (e) {}
        }
        try {
            const fsDoc = this.toFirestoreDocument(payload);
            await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/settings/valuersList`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fsDoc)
            });
        } catch (e) {}
    },

    /**
     * Get all Valuers list from Firestore
     */
    getValuersList: async function() {
        try {
            const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/settings/valuersList`);
            if (res.ok) {
                const data = await res.json();
                const parsed = this.fromFirestoreDocument(data);
                if (parsed && Array.isArray(parsed.list)) return parsed.list;
            }
        } catch (e) {}

        if (this.db) {
            try {
                const doc = await this.db.collection('settings').doc('valuersList').get();
                if (doc.exists && doc.data().list) return doc.data().list;
            } catch (e) {}
        }
        return null;
    },

    /**
     * Realtime listener for Valuers Master
     */
    listenValuers: function(onUpdate) {
        if (!this.db) return () => {};
        return this.db.collection('settings').doc('valuersList').onSnapshot((doc) => {
            if (doc.exists && typeof onUpdate === 'function') {
                const data = doc.data();
                if (Array.isArray(data.list)) onUpdate(data.list);
            }
        }, (err) => {
            console.warn("[Firebase] Valuers listener error:", err);
        });
    },

    /**
     * Save all Product Schemes list to Firestore
     */
    saveProductsList: async function(productsList) {
        const payload = {
            list: productsList,
            updatedAt: new Date().toISOString()
        };
        if (this.db) {
            try {
                await this.db.collection('settings').doc('productsList').set(payload, { merge: true });
            } catch (e) {}
        }
        try {
            const fsDoc = this.toFirestoreDocument(payload);
            await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/settings/productsList`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fsDoc)
            });
        } catch (e) {}
    },

    /**
     * Get all Product Schemes list from Firestore
     */
    getProductsList: async function() {
        try {
            const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/settings/productsList`);
            if (res.ok) {
                const data = await res.json();
                const parsed = this.fromFirestoreDocument(data);
                if (parsed && Array.isArray(parsed.list)) return parsed.list;
            }
        } catch (e) {}

        if (this.db) {
            try {
                const doc = await this.db.collection('settings').doc('productsList').get();
                if (doc.exists && doc.data().list) return doc.data().list;
            } catch (e) {}
        }
        return null;
    },

    /**
     * Realtime listener for Product Schemes Master
     */
    listenProducts: function(onUpdate) {
        if (!this.db) return () => {};
        return this.db.collection('settings').doc('productsList').onSnapshot((doc) => {
            if (doc.exists && typeof onUpdate === 'function') {
                const data = doc.data();
                if (Array.isArray(data.list)) onUpdate(data.list);
            }
        }, (err) => {
            console.warn("[Firebase] Products listener error:", err);
        });
    },

    // =================================================================
    // SECURITY AUDIT LOGS & CLIENT IP TRACKING
    // =================================================================

    /**
     * Get or resolve client IP address
     */
    getClientIp: async function() {
        if (this._cachedIp) return this._cachedIp;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (data && data.ip) {
                    this._cachedIp = data.ip;
                    return data.ip;
                }
            }
        } catch (e) {}
        this._cachedIp = "Local / Office Network";
        return this._cachedIp;
    },

    /**
     * Record an audit event with timestamp, branch, operator, IP, and device metadata
     */
    logAuditEvent: async function(action, details, metadata = {}) {
        try {
            const ip = await this.getClientIp();
            const logId = `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const payload = {
                id: logId,
                action: String(action || 'ACTION').toUpperCase(),
                details: String(details || ''),
                branchCode: metadata.branchCode || (window.state?.currentSession?.code) || '99',
                branchName: metadata.branchName || (window.state?.currentSession?.name) || 'Head Office',
                operator: metadata.operator || (window.state?.currentSession?.name || 'ADMIN'),
                ip: ip,
                userAgent: navigator.userAgent || '',
                platform: navigator.platform || '',
                timestamp: new Date().toISOString(),
                timestampMs: Date.now(),
                ...metadata
            };

            if (this.db) {
                try {
                    await this.db.collection('audit_logs').doc(logId).set(payload);
                } catch (e) {}
            }
            try {
                const fsDoc = this.toFirestoreDocument(payload);
                await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/audit_logs/${logId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(fsDoc)
                });
            } catch (e) {}

            return payload;
        } catch (err) {
            console.warn("[Firebase] logAuditEvent notice:", err);
            return null;
        }
    },

    /**
     * Get recent audit logs from Firestore
     */
    getAuditLogs: async function(limit = 200) {
        if (this.db) {
            try {
                const snapshot = await this.db.collection('audit_logs').orderBy('timestampMs', 'desc').limit(limit).get();
                const logs = [];
                snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
                if (logs.length > 0) return logs;
            } catch (e) {}
        }
        try {
            const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/audit_logs?pageSize=${limit}`);
            if (res.ok) {
                const data = await res.json();
                if (data.documents && Array.isArray(data.documents)) {
                    return data.documents.map(d => this.fromFirestoreDocument(d)).sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
                }
            }
        } catch (e) {}
        return [];
    },

    /**
     * Realtime listener for security audit logs
     */
    listenAuditLogs: function(onUpdate, limit = 200) {
        if (!this.db) return () => {};
        try {
            return this.db.collection('audit_logs').orderBy('timestampMs', 'desc').limit(limit).onSnapshot((snapshot) => {
                const logs = [];
                snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
                if (typeof onUpdate === 'function') onUpdate(logs);
            }, (err) => {
                console.warn("[Firebase] Audit logs listener error:", err);
            });
        } catch (e) {
            return () => {};
        }
    },

    // =================================================================
    // ACTIVE DEVICE HEARTBEAT & LIVE BRANCH PRESENCE
    // =================================================================

    /**
     * Update device heartbeat ping with IP and session details
     */
    updateDeviceHeartbeat: async function(sessionInfo = {}) {
        try {
            let sessionId = localStorage.getItem("jccb_device_session_id");
            if (!sessionId) {
                sessionId = `DEV_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
                localStorage.setItem("jccb_device_session_id", sessionId);
            }

            // If this device was previously terminated by admin, do not send online heartbeat
            if (localStorage.getItem("jccb_device_terminated") === sessionId) {
                return { terminated: true };
            }

            const ip = await this.getClientIp();
            const payload = {
                sessionId: sessionId,
                branchCode: sessionInfo.branchCode || (window.state?.currentSession?.code) || '99',
                branchName: sessionInfo.branchName || (window.state?.currentSession?.name) || 'Head Office',
                operator: sessionInfo.operator || (window.state?.currentSession?.name) || 'Operator',
                ip: ip,
                userAgent: navigator.userAgent || '',
                platform: navigator.platform || '',
                screenWidth: window.screen ? window.screen.width : 0,
                screenHeight: window.screen ? window.screen.height : 0,
                loginTime: sessionInfo.loginTime || localStorage.getItem("jccb_session_login_time") || new Date().toISOString(),
                lastPing: new Date().toISOString(),
                lastPingMs: Date.now(),
                isOnline: true,
                terminated: false,
                status: "active"
            };

            if (!localStorage.getItem("jccb_session_login_time")) {
                localStorage.setItem("jccb_session_login_time", payload.loginTime);
            }

            if (this.db) {
                try {
                    const doc = await this.db.collection('active_sessions').doc(sessionId).get();
                    if (doc.exists && (doc.data().terminated === true || doc.data().status === "terminated")) {
                        localStorage.setItem("jccb_device_terminated", sessionId);
                        return { terminated: true };
                    }
                    await this.db.collection('active_sessions').doc(sessionId).set(payload, { merge: true });
                } catch (e) {}
            }
            try {
                const fsDoc = this.toFirestoreDocument(payload);
                await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/active_sessions/${sessionId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(fsDoc)
                });
            } catch (e) {}

            return payload;
        } catch (err) {
            return null;
        }
    },

    /**
     * Terminate / Force-Disconnect an active device session from Central Management
     */
    terminateActiveSession: async function(sessionId) {
        const payload = {
            sessionId: sessionId,
            isOnline: false,
            terminated: true,
            status: "terminated",
            terminatedAt: new Date().toISOString(),
            terminatedAtMs: Date.now()
        };

        if (this.db) {
            try {
                await this.db.collection('active_sessions').doc(sessionId).set(payload, { merge: true });
            } catch (e) {}
        }
        try {
            const fsDoc = this.toFirestoreDocument(payload);
            await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/active_sessions/${sessionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fsDoc)
            });
        } catch (e) {}

        return payload;
    },

    /**
     * Realtime listener on client device for remote killswitch / force logout
     */
    listenSessionKillswitch: function(sessionId, onTerminated) {
        if (!this.db || !sessionId) return () => {};
        try {
            return this.db.collection('active_sessions').doc(sessionId).onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    if (data && (data.terminated === true || data.status === "terminated" || data.isOnline === false)) {
                        if (typeof onTerminated === "function") onTerminated(data);
                    }
                }
            }, (err) => {
                console.warn("[Firebase] Session killswitch listener notice:", err);
            });
        } catch (e) {
            return () => {};
        }
    },

    /**
     * Realtime listener for active branches and connected devices
     */
    listenActiveSessions: function(onUpdate) {
        if (!this.db) return () => {};
        try {
            return this.db.collection('active_sessions').onSnapshot((snapshot) => {
                const sessions = [];
                snapshot.forEach(doc => sessions.push({ id: doc.id, ...doc.data() }));
                if (typeof onUpdate === 'function') onUpdate(sessions);
            }, (err) => {
                console.warn("[Firebase] Active sessions listener error:", err);
            });
        } catch (e) {
            return () => {};
        }
    },

    /**
     * Terminate or remove an active session
     */
    deleteActiveSession: async function(sessionId) {
        if (this.db) {
            try {
                await this.db.collection('active_sessions').doc(sessionId).delete();
            } catch (e) {}
        }
        try {
            await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/active_sessions/${sessionId}`, {
                method: "DELETE"
            });
        } catch (e) {}
    },

    // =================================================================
    // CLOUD STORAGE UPLOADS (ORNAMENTS & KYC)
    // =================================================================

    /**
     * Upload gold ornament photo to Firebase Storage
     */
    uploadOrnamentPhoto: async function(branchCode, loanId, fileBlob, fileName) {
        if (!this.storage) throw new Error("Firebase Storage not initialized.");
        const path = `branches/${branchCode}/loans/${loanId}/${Date.now()}_${fileName || 'ornament.jpg'}`;
        const storageRef = this.storage.ref().child(path);
        const snapshot = await storageRef.put(fileBlob);
        const downloadUrl = await snapshot.ref.getDownloadURL();
        return { path, downloadUrl };
    }
};

// Expose globally
window.FirebaseService = FirebaseService;
