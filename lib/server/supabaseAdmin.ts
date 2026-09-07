import {createClient} from '@supabase/supabase-js'

const supabaseUrl =
  process.env['SUPABASE_URL'] ||
  process.env['VITE_SUPABASE_URL'] ||
  'https://rkmpfxervwqleibhbiqv.supabase.co'

const DEFAULT_SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbXBmeGVydndxbGVpYmhiaXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODc5MzU4NCwiZXhwIjoyMTA0MzY5NTg0fQ.4Bglk8zupMO9ooUDL0u4-9TpRZg7kMDM0MxwqALlVa8'

const supabaseServiceKey =
  process.env['SUPABASE_SERVICE_ROLE_KEY'] || DEFAULT_SUPABASE_SERVICE_ROLE_KEY

export function getSupabaseAdmin() {
  if (!supabaseServiceKey) {
    throw new Error(
      '[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY is required for server-side administrative operations.'
    )
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function getSafeSupabaseAdmin() {
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'] || DEFAULT_SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
