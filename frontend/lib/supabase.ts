import { createBrowserClient } from '@supabase/ssr'

let _supabase: ReturnType<typeof createBrowserClient> | null = null

export const createClient = () => {
  if (_supabase) return _supabase
  
  _supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return _supabase
}

export const supabase = createClient()
