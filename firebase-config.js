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
                    console.warn("[Firebase] Persistence failed: Multiple tabs open simultaneously.");
                } else if (err.code === 'unimplemented') {
                    console.warn("[Firebase] Persistence not supported in current browser.");
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

    // =================================================================
    // LOAN DATA OPERATIONS & SYNC
    // =================================================================

    /**
     * Save a gold loan record to Firestore
     */
    saveLoan: async function(loanData) {
        if (!this.db) throw new Error("Firestore not initialized.");
        const loanId = String(loanData.id || loanData.loanId || `LOAN_${Date.now()}_${loanData.branchCode || '01'}`).trim();
        const loanRef = this.db.collection('loans').doc(loanId);
        
        const payload = {
            ...loanData,
            id: loanId,
            loanId: loanId,
            branchId: String(loanData.branchCode || loanData.branchId || '01'),
            updatedAt: new Date().toISOString(),
            updatedBy: this.currentUser ? this.currentUser.uid : (loanData.updatedBy || 'SYSTEM')
        };
        if (!loanData.createdAt) {
            payload.createdAt = new Date().toISOString();
            payload.createdBy = this.currentUser ? this.currentUser.uid : (loanData.createdBy || 'SYSTEM');
        }

        await loanRef.set(payload, { merge: true });
        return payload;
    },

    /**
     * Fetch all loans from Firestore (no complex indexing required)
     */
    getLoans: async function(branchCode = null) {
        if (!this.db) return [];
        try {
            const snapshot = await this.db.collection('loans').get();
            const list = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                list.push({ ...data, id: doc.id, loanId: data.loanId || doc.id });
            });
            if (branchCode && branchCode !== '99') {
                return list.filter(l => String(l.branchCode || l.branchId) === String(branchCode));
            }
            return list;
        } catch (error) {
            console.error("[Firebase] Error fetching loans:", error);
            return [];
        }
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
            console.warn("[Firebase] Loan snapshot listener error:", err);
        });
    },

    /**
     * Delete loan record
     */
    deleteLoan: async function(loanId) {
        if (!this.db) throw new Error("Firestore not initialized.");
        const cleanId = String(loanId).trim();
        await this.db.collection('loans').doc(cleanId).delete();
    },

    // =================================================================
    // DAILY RATES & GLOBAL SETTINGS
    // =================================================================

    /**
     * Get daily gold rates from Firestore
     */
    getDailyRates: async function() {
        if (!this.db) return null;
        try {
            const doc = await this.db.collection('rates').doc('today').get();
            return doc.exists ? doc.data() : null;
        } catch (e) {
            console.warn("[Firebase] Could not fetch rates:", e);
            return null;
        }
    },

    /**
     * Save daily gold rates (Admin only)
     */
    saveDailyRates: async function(ratesData) {
        if (!this.db) throw new Error("Firestore not initialized.");
        await this.db.collection('rates').doc('today').set({
            ...ratesData,
            updatedAt: new Date().toISOString(),
            updatedBy: this.currentUser ? this.currentUser.uid : 'ADMIN'
        }, { merge: true });
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
            console.warn("[Firebase] Rates listener error:", err);
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
     * Save branch seeds & settings to Firestore
     */
    saveSettings: async function(settingsData) {
        if (!this.db) return;
        await this.db.collection('settings').doc('branchSeeds').set({
            ...settingsData,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    },

    /**
     * Get branch seeds & settings from Firestore
     */
    getSettings: async function() {
        if (!this.db) return null;
        try {
            const doc = await this.db.collection('settings').doc('branchSeeds').get();
            return doc.exists ? doc.data() : null;
        } catch (e) {
            console.warn("[Firebase] Error fetching settings:", e);
            return null;
        }
    },

    /**
     * Realtime listener for branch settings
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
