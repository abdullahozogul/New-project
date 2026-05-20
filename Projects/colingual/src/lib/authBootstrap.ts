import type { SupabaseClient, User } from '@supabase/supabase-js'
import {
  clearSupabaseAuthCallbackFromUrl,
  getAuthCallbackUrl,
  isSupabaseAuthCallback,
  parseAuthCallbackUrl,
  setPendingAuthCallbackUrl,
} from './authCallback'

/** Exchange PKCE code or hash tokens from an OAuth / email-link return URL. */
export async function applyAuthCallbackUrl(
  client: SupabaseClient,
  callbackUrl: string,
): Promise<User | null> {
  const params = parseAuthCallbackUrl(callbackUrl)
  if (!params) {
    return null
  }

  if (params.code) {
    const { data, error } = await client.auth.exchangeCodeForSession(params.code)
    if (!error && data.session?.user) {
      clearSupabaseAuthCallbackFromUrl()
      return data.session.user
    }
    return null
  }

  if (params.accessToken && params.refreshToken) {
    const { data, error } = await client.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
    })
    if (!error && data.session?.user) {
      clearSupabaseAuthCallbackFromUrl()
      return data.session.user
    }
    return null
  }

  return null
}

/** Fast PKCE exchange on OAuth return; otherwise a single getSession(). */
export async function resolveInitialAuthUser(client: SupabaseClient): Promise<User | null> {
  const callbackUrl = getAuthCallbackUrl()
  if (callbackUrl) {
    const user = await applyAuthCallbackUrl(client, callbackUrl)
    if (user) {
      return user
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

/** Store a native deep link and complete sign-in (call from Capacitor appUrlOpen). */
export async function handleMobileAuthCallbackUrl(
  client: SupabaseClient,
  url: string,
): Promise<User | null> {
  setPendingAuthCallbackUrl(url)
  return applyAuthCallbackUrl(client, url)
}
