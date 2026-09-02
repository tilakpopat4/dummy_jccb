// supabase-config.js - Central Supabase Client
const SUPABASE_URL = "https://qsfsmomphgotmfcpfhkd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2FO68n0R0yCmB_PyUyVOFQ_2oIUZEQA";

// Initialize Supabase Client
const _supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
window.db = _supabase;

// Helper: Get Logged In User Profile & Role
window.getCurrentUserProfile = async function() {
  try {
    if (!_supabase) return null;
    const { data: { user }, error: authErr } = await _supabase.auth.getUser();
    if (authErr || !user) return null;

    const { data: profile, error: profErr } = await _supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profErr) {
      console.warn("Profile fetch error:", profErr.message);
      return { id: user.id, email: user.email, role: 'employee', branch: '' };
    }
    return profile;
  } catch (err) {
    console.error("Auth status error:", err);
    return null;
  }
};

// Health Check
(async () => {
  if (!_supabase) return;
  const { error } = await _supabase.from('loans').select('count', { count: 'exact', head: true });
  if (error) console.error("⚠️ Supabase connection test:", error.message);
  else console.log("🚀 Supabase connected cleanly (Zero Firebase dependencies).");
})();
