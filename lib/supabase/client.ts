import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Add this - it syncs auth changes to cookies automatically
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[AUTH STATE CHANGE]', event, session ? 'HAS SESSION' : 'NO SESSION')
})