/**
 * The Junagadh Commercial Co-operative Bank Ltd. (JCCB)
 * Firebase Configuration & RBAC Service
 */

const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Global Firebase State
const FirebaseService = {
    app: null,
    auth: null,
    db: null,
    storage: null,
    currentUser: null,
    userProfile: null, // { uid, email, role: 'admin'|'branch_manager'|'branch_user', branchId, branchName, isActive }

    /**
     * Initialize Firebase SDK
     */
    init: function() {
        if (typeof firebase === 'undefined') {
            console.error("Firebase SDK script not loaded.");
            return;
        }

        if (!firebase.apps.length) {
            this.app = firebase.initializeApp(firebaseConfig);
        } else {
            this.app = firebase.app();
        }

        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.storage = firebase.storage();

        // Enable offline persistence for Firestore (banking reliability)
        this.db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn("Firestore persistence failed: Multiple tabs open.");
            } else if (err.code === 'unimplemented') {
                console.warn("Firestore persistence not supported in this browser.");
            }
        });

        console.log("JCCB Firebase Service Initialized.");
    },

    /**
     * Listen for authentication state changes and fetch RBAC profile
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
                        this.userProfile = {
                            uid: user.uid,
                            email: user.email,
                            role: 'branch_user',
                            branchId: null,
                            isActive: false
                        };
                    }
                } catch (e) {
                    console.error("Error fetching user profile:", e);
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
     * Role Check Utilities
     */
    isAdmin: function() {
        return this.userProfile && this.userProfile.role === 'admin' && this.userProfile.isActive;
    },

    isBranchManager: function() {
        return this.userProfile && this.userProfile.role === 'branch_manager' && this.userProfile.isActive;
    },

    getUserBranchId: function() {
        return this.userProfile ? this.userProfile.branchId : null;
    }
};

// Export to window
window.FirebaseService = FirebaseService;
