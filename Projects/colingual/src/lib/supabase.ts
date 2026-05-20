import { createClient } from '@supabase/supabase-js'
import { isNativePlatform } from './platform'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          flowType: 'pkce',
          // Native OAuth returns via deep link, not window.location (see mobileAuthListener).
          detectSessionInUrl: !isNativePlatform(),
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null

export const supabaseConfigured = Boolean(supabase)
