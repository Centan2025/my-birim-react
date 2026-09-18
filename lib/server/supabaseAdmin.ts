import {createClient, type SupabaseClient} from '@supabase/supabase-js'

function getSupabaseServerConfig(): {url: string; serviceKey: string} | null {
  const env =
    (globalThis as {process?: {env?: Record<string, string | undefined>}}).process?.env || {}

  if (env['NODE_ENV'] === 'test' || env['VITEST']) {
    const testUrl = env['SUPABASE_URL'] || env['VITE_SUPABASE_URL']
    const testKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['SUPABASE_SERVICE_KEY']
    if (!testUrl || !testKey) return null
    return {url: testUrl, serviceKey: testKey}
  }

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

  if (!rawKey) {
    return null
  }

  let url = (rawUrl || '').trim().replace(/^["']|["']$/g, '')
  if (!url || !url.includes('rkmpfxervwqleibhbiqv')) {
    url = 'https://rkmpfxervwqleibhbiqv.supabase.co'
  }
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
    global: {
      fetch: (url, init) => fetch(url, init),
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
    global: {
      fetch: (url, init) => fetch(url, init),
    },
  })
}
