import { MOBILE_AUTH_CALLBACK_URL, PENDING_AUTH_CALLBACK_KEY } from './authConstants'

export type AuthCallbackParams = {
  code?: string
  accessToken?: string
  refreshToken?: string
  error?: string
  errorDescription?: string
}

function paramsFromSearch(search: URLSearchParams): AuthCallbackParams | null {
  const code = search.get('code')
  const accessToken = search.get('access_token')
  const refreshToken = search.get('refresh_token')
  const error = search.get('error')
  const errorDescription = search.get('error_description')

  if (code) {
    return { code, error: error ?? undefined, errorDescription: errorDescription ?? undefined }
  }

  if (accessToken && refreshToken) {
    return {
      accessToken,
      refreshToken,
      error: error ?? undefined,
      errorDescription: errorDescription ?? undefined,
    }
  }

  if (error || errorDescription) {
    return { error: error ?? undefined, errorDescription: errorDescription ?? undefined }
  }

  return null
}

/** Parse Supabase OAuth return from a full URL (web origin or native deep link). */
export function parseAuthCallbackUrl(url: string): AuthCallbackParams | null {
  try {
    const parsed = new URL(url)

    const fromSearch = paramsFromSearch(parsed.searchParams)
    if (fromSearch) {
      return fromSearch
    }

    const hash = parsed.hash.slice(1)
    if (hash) {
      return paramsFromSearch(new URLSearchParams(hash))
    }

    return null
  } catch {
    return null
  }
}

export function isAuthCallbackUrl(url: string): boolean {
  if (!url) {
    return false
  }

  try {
    const parsed = new URL(url)
    if (parsed.href.startsWith(MOBILE_AUTH_CALLBACK_URL)) {
      return parseAuthCallbackUrl(url) !== null
    }
  } catch {
    return false
  }

  return parseAuthCallbackUrl(url) !== null
}

export function setPendingAuthCallbackUrl(url: string): void {
  try {
    sessionStorage.setItem(PENDING_AUTH_CALLBACK_KEY, url)
  } catch {
    // ignore
  }
}

export function clearPendingAuthCallbackUrl(): void {
  try {
    sessionStorage.removeItem(PENDING_AUTH_CALLBACK_KEY)
  } catch {
    // ignore
  }
}

function readPendingAuthCallbackUrl(): string | null {
  try {
    return sessionStorage.getItem(PENDING_AUTH_CALLBACK_KEY)
  } catch {
    return null
  }
}

/** Active OAuth return URL: browser location or stored native deep link. */
export function getAuthCallbackUrl(): string | null {
  if (typeof window !== 'undefined') {
    const href = window.location.href
    if (isAuthCallbackUrl(href)) {
      return href
    }
  }

  const pending = readPendingAuthCallbackUrl()
  if (pending && isAuthCallbackUrl(pending)) {
    return pending
  }

  return null
}

/** True while an OAuth / magic-link return must be exchanged for a session. */
export function isSupabaseAuthCallback(): boolean {
  return getAuthCallbackUrl() !== null
}

/** Remove OAuth params from the browser URL and clear stored deep-link payload. */
export function clearSupabaseAuthCallbackFromUrl(): void {
  clearPendingAuthCallbackUrl()

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
