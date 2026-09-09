import {createClient, type SupabaseClient} from '@supabase/supabase-js'

const sanitizeEnv = (val?: string) => val?.trim().replace(/^["']|["']$/g, '') || ''

const rawUrl = sanitizeEnv(import.meta.env['VITE_SUPABASE_URL'] as string | undefined)
const rawKey = sanitizeEnv(import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined)

const fallbackUrl = 'https://drertbtypneggtjjbiiu.supabase.co'

function isValidHttpUrl(url: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const supabaseUrl = isValidHttpUrl(rawUrl) ? rawUrl : fallbackUrl
const supabaseAnonKey = rawKey

export const isSupabaseConfigured = Boolean(isValidHttpUrl(rawUrl) && supabaseAnonKey)

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    'VITE_SUPABASE_ANON_KEY veya gecerli VITE_SUPABASE_URL bulunamadi. Supabase ozellikleri devre disi.'
  )
}

let client: SupabaseClient
try {
  client = createClient(supabaseUrl, supabaseAnonKey || 'dummy-anon-key')
} catch (err: unknown) {
  console.error('Supabase client initialization error:', err)
  client = createClient(fallbackUrl, 'dummy-anon-key')
}

export const supabase = client

