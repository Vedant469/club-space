import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Club Space currently assumes a single club per deployment.
// Swap this for a club picker later if you support multiple clubs.
export const CLUB_ID = import.meta.env.VITE_CLUB_ID

/** Maps a Supabase/Postgres error to a friendly, non-technical message. */
export function friendlyError(_error: unknown): string {
  return "We couldn't do that right now. Please try again."
}