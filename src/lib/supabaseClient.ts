import {createClient} from '@supabase/supabase-js'

const supabaseUrl =
  (import.meta.env['VITE_SUPABASE_URL'] as string | undefined) ||
  'https://rkmpfxervwqleibhbiqv.supabase.co'
const supabaseAnonKey = (import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined) || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    'VITE_SUPABASE_ANON_KEY bulunamadi. Supabase kimlik dogrulama ve veri tabani ozellikleri icin .env dosyasina VITE_SUPABASE_ANON_KEY ekleyin.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'dummy-key')
