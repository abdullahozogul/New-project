/** Detect Supabase OAuth return (PKCE ?code= or legacy hash tokens). */
export function isSupabaseAuthCallback(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // TODO(mobile): handle deep link in mobileAuthListener.ts
  const search = new URLSearchParams(window.location.search)
  if (search.has('code')) {
    return true
  }

  const hash = window.location.hash.slice(1)
  if (!hash) {
    return false
  }

  const hashParams = new URLSearchParams(hash)
  return (
    hashParams.has('access_token') ||
    hashParams.has('error') ||
    hashParams.has('error_description')
  )
}

/** Remove OAuth params from URL after session is established. */
export function clearSupabaseAuthCallbackFromUrl(): void {
  if (typeof window === 'undefined') {
    return
  }

  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('error')
  url.searchParams.delete('error_description')

  const hashRaw = url.hash.slice(1)
  if (hashRaw) {
    const hashParams = new URLSearchParams(hashRaw)
    const isAuthHash =
      hashParams.has('access_token') ||
      hashParams.has('error') ||
      hashParams.has('error_description')

    if (isAuthHash) {
      url.hash = '#home'
    }
  } else if (!url.hash) {
    url.hash = '#home'
  }

  const next = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState(null, '', next)
}

export const OAUTH_PENDING_KEY = 'colingual-oauth-pending'

export function markOAuthPending(): void {
  try {
    sessionStorage.setItem(OAUTH_PENDING_KEY, '1')
  } catch {
    // ignore
  }
}

export function clearOAuthPending(): void {
  try {
    sessionStorage.removeItem(OAUTH_PENDING_KEY)
  } catch {
    // ignore
  }
}

export function isOAuthPending(): boolean {
  try {
    return sessionStorage.getItem(OAUTH_PENDING_KEY) === '1'
  } catch {
    return false
  }
}
