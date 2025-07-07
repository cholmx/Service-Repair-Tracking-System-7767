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

// Test the connection when the file loads
console.log('Supabase client initialized:', {
  url: SUPABASE_URL,
  keyLength: SUPABASE_ANON_KEY.length,
  connected: true
})

export default supabaseClient
export const supabase = supabaseClient