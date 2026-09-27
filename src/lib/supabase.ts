import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://nbowmxfsxsadmdaddhto.supabase.co'

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
  throw new Error('Supabase publishable key is missing.')
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)

// Club Space currently assumes a single club per deployment.
export const CLUB_ID =
  import.meta.env.VITE_CLUB_ID ||
  '00000000-0000-0000-0000-000000000001'

export function friendlyError(_error: unknown): string {
  return "We couldn't do that right now. Please try again."
}