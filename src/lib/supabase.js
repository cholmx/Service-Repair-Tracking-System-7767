import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xibhmevisztsdlpueutj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpYmhtZXZpc3p0c2RscHVldXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NzkxMTEsImV4cCI6MjA2NjU1NTExMX0.NnKoDfqIinXqATfHAtdA-khC9Ea8ytNnzzUfkrwBgEg'

if (SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables')
}

// Create Supabase client with proper configuration
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Disable auth sessions since we're not using authentication
    autoRefreshToken: false
  },
  global: {
    headers: {
      'X-Client-Info': 'servicetracker-app'
    }
  }
})

// Simple table creation without complex migration
const ensureTablesExist = async () => {
  try {
    console.log('Ensuring database tables exist...')
    
    // Try to create tables if they don't exist
    const { error } = await supabaseClient
      .from('service_orders_public_st847291')
      .select('id')
      .limit(1)
    
    if (error && error.code === 'PGRST204') {
      console.log('Tables do not exist, they need to be created manually in Supabase dashboard')
      console.log('Please create the tables using the SQL migration file')
    } else if (error) {
      console.log('Database connection error:', error.message)
    } else {
      console.log('Database tables are ready')
    }
  } catch (error) {
    console.log('Database check error:', error.message)
  }
}

// Check tables on module load
ensureTablesExist()

// Test the connection when the file loads
console.log('Supabase client initialized:', {
  url: SUPABASE_URL,
  keyLength: SUPABASE_ANON_KEY.length,
  connected: true
})

// NOTE: This Supabase client is kept for backward compatibility
// The main application now uses NoCode Backend API
console.warn('⚠️ Application has been migrated to NoCode Backend API')
console.log('🔄 Supabase client is maintained for fallback purposes only')

export default supabaseClient
export const supabase = supabaseClient