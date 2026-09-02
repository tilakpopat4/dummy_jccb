/**
 * =============================================================================
 * FIREBASE CONFIGURATION — NEUTRALIZED & DISABLED
 * Sandbox Migration: dummy_jccb (Supabase Sandbox)
 * =============================================================================
 * All Firebase production endpoints, credentials, and polling loops have been
 * completely wiped and deactivated to prevent any accidental interaction with
 * live bank infrastructure.
 */

console.info("[Firebase] Production Firebase service has been completely neutralized for Supabase sandbox.");

// Dummy / No-op FirebaseService to prevent runtime script crashes during migration
window.FirebaseService = {
    isInitialized: false,
    auth: null,
    db: null,
    storage: null,
    async init() { console.warn("[Firebase] Firebase is disabled in this environment."); return false; },
    async syncCloudData() { return false; },
    async logAuditEvent() { return false; },
    async updatePresence() { return false; },
    async get() { return []; },
    async set() { return false; }
};
