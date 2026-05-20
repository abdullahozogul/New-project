import type { SupabaseClient, User } from '@supabase/supabase-js'
import { clearSupabaseAuthCallbackFromUrl, isSupabaseAuthCallback } from './authCallback'

/** Fast PKCE exchange on OAuth return; otherwise a single getSession(). */
export async function resolveInitialAuthUser(client: SupabaseClient): Promise<User | null> {
  if (isSupabaseAuthCallback()) {
    // TODO(mobile): handle deep link in mobileAuthListener.ts
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      const { data, error } = await client.auth.exchangeCodeForSession(code)
      if (!error && data.session?.user) {
        clearSupabaseAuthCallbackFromUrl()
        return data.session.user
      }
    }

    // TODO(mobile): handle deep link in mobileAuthListener.ts
    const hash = window.location.hash.slice(1)
    if (hash) {
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      if (accessToken && refreshToken) {
        const { data, error } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (!error && data.session?.user) {
          clearSupabaseAuthCallbackFromUrl()
          return data.session.user
        }
      }
    }
  }

  const { data } = await client.auth.getSession()
  if (data.session?.user) {
    if (isSupabaseAuthCallback()) {
      clearSupabaseAuthCallbackFromUrl()
    }
    return data.session.user
  }

  return null
}
