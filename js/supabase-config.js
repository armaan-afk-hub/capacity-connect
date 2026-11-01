// ==============================================================================
// CAPACITY CONNECT - Supabase Client Configuration
// SIH26075 - Digital Capacity Building and Learning Management Portal
// ==============================================================================

const SUPABASE_URL = 'https://aqqefwjuprvsthoeuxes.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AEhXFpaxIBJV4OIftirfgA_rxkbpzAB';

// Initialize Supabase Client using the official CDN library
let supabaseClient = null;

if (typeof supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL') {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Supabase Client initialized successfully.');
} else {
  console.warn('⚠️ Supabase credentials loaded. Awaiting Supabase CDN script initialization.');
}

/**
 * Check whether Supabase is configured with real credentials
 */
function isSupabaseConfigured() {
  return (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('YOUR_SUPABASE') &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE')
  );
}

/**
 * Test connectivity with Supabase database
 */
async function testConnection() {
  if (!isSupabaseConfigured() || !supabaseClient) {
    return {
      connected: false,
      message: 'Supabase credentials are not configured in js/supabase-config.js yet.'
    };
  }

  try {
    const { data, error } = await supabaseClient.from('courses').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          connected: true,
          schemaReady: false,
          message: 'Connected to Supabase! However, the database tables have not been created yet. Please execute supabase/schema.sql in the Supabase SQL Editor.'
        };
      }
      return { connected: false, message: error.message };
    }
    return {
      connected: true,
      schemaReady: true,
      message: 'Successfully connected to your live Supabase database!'
    };
  } catch (err) {
    return { connected: false, message: err.message || 'Network error connecting to Supabase.' };
  }
}

// Export for usage across script files
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.supabaseClient = supabaseClient;
window.isSupabaseConfigured = isSupabaseConfigured;
window.testConnection = testConnection;
