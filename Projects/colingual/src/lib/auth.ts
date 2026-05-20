import { isNative } from './platform'
import { supabase } from './supabase'

export type AuthActionResult = { ok: true } | { ok: false; message: string }

const MOBILE_AUTH_CALLBACK_URL = 'com.colingual.app://auth/callback'

/** Supabase redirect target: web origin or native deep link. */
export function getRedirectUrl(): string {
  if (isNative()) {
    return MOBILE_AUTH_CALLBACK_URL
  }

  if (typeof window === 'undefined') {
    return ''
  }

  return window.location.origin
}

function formatAuthError(error: { message: string }): string {
  return error.message
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase yapılandırılmadı.' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { ok: false, message: formatAuthError(error) }
  }
  return { ok: true }
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase yapılandırılmadı.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: getRedirectUrl() },
  })
  if (error) {
    return { ok: false, message: formatAuthError(error) }
  }
  return { ok: true }
}

export async function sendPasswordReset(email: string): Promise<AuthActionResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase yapılandırılmadı.' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getRedirectUrl(),
  })
  if (error) {
    return { ok: false, message: formatAuthError(error) }
  }
  return { ok: true }
}
