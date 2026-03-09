import { createClient } from '@supabase/supabase-js'

// Durante el build de Docker, estas variables pueden no estar presentes.
// Usamos valores placeholder para evitar que el proceso de build falle.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseKey)
