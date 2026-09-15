import {createClient, type SupabaseClient} from '@supabase/supabase-js'

function getSupabaseServerConfig(): {url: string; serviceKey: string} | null {
  const rawUrl = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL']
  const rawKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

  if (!rawUrl || !rawKey) {
    return null
  }

  const url = rawUrl.trim().replace(/^["']|["']$/g, '')
  const serviceKey = rawKey.trim().replace(/^["']|["']$/g, '')

  if (!url || !serviceKey) {
    return null
  }

  return {url, serviceKey}
}

export function getSupabaseAdmin(): SupabaseClient {
  const config = getSupabaseServerConfig()
  if (!config) {
    throw new Error(
      '[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL environment variables are required for server-side operations.'
    )
  }
  return createClient(config.url, config.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function getSafeSupabaseAdmin(): SupabaseClient | null {
  const config = getSupabaseServerConfig()
  if (!config) return null
  return createClient(config.url, config.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
