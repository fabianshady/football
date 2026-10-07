import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

/** No placeholder connection: missing configuration is an explicit unavailable state. */
export const supabase = url && key ? createClient<Database>(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
}) : null
