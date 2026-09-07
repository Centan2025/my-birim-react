import {createClient} from '@supabase/supabase-js'

const supabaseUrl =
  process.env['SUPABASE_URL'] ||
  process.env['VITE_SUPABASE_URL'] ||
  'https://rkmpfxervwqleibhbiqv.supabase.co'

const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || ''

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
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!key) return null
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
