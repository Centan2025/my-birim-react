import {createClient, type SupabaseClient} from '@supabase/supabase-js'

function getSupabaseServerConfig(): {url: string; serviceKey: string} | null {
  const env =
    (globalThis as {process?: {env?: Record<string, string | undefined>}}).process?.env || {}
  const rawUrl =
    env['SUPABASE_URL'] ||
    env['VITE_SUPABASE_URL'] ||
    env['NEXT_PUBLIC_SUPABASE_URL']
  const rawKey =
    env['SUPABASE_SERVICE_ROLE_KEY'] ||
    env['SUPABASE_SERVICE_KEY'] ||
    env['SUPABASE_KEY'] ||
    env['VITE_SUPABASE_SERVICE_ROLE_KEY'] ||
    env['VITE_SUPABASE_ANON_KEY']

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
