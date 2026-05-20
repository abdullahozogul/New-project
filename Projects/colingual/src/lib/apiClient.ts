export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export type ApiRequestOptions = {
  signal?: AbortSignal
  headers?: HeadersInit
  /** Default 15_000 ms */
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 15_000
const RETRY_BACKOFF_MS = 500

let productionBaseWarned = false

function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }

  if (import.meta.env.MODE === 'production' && !productionBaseWarned) {
    productionBaseWarned = true
    console.warn(
      '[colingual] VITE_API_BASE_URL is not set; falling back to /api. Configure Supabase Edge Functions base URL for production.',
    )
  }

  return '/api'
}

/** Resolves a path or absolute URL against {@link getApiBase}. */
export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const base = getApiBase()
  const normalized = path.startsWith('/') ? path : `/${path}`

  if (normalized.startsWith('/api/')) {
    return normalized
  }

  return `${base}${normalized}`
}

export const API_USER_AGENT = 'Colingual/1.0'

/** Default API headers plus optional Bearer token. */
export function apiRequestHeaders(
  options?: { authorization?: string | null; headers?: HeadersInit },
): HeadersInit {
  const headers = new Headers(options?.headers)
  if (!headers.has('User-Agent')) {
    headers.set('User-Agent', API_USER_AGENT)
  }
  const token = options?.authorization?.trim()
  if (token) {
    headers.set('Authorization', token.startsWith('Bearer ') ? token : `Bearer ${token}`)
  }
  return headers
}

function mergeAbortSignals(
  timeoutMs: number,
  external?: AbortSignal,
): { signal: AbortSignal; cleanup: () => void } {
  const timeoutController = new AbortController()
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs)
  const cleanups: (() => void)[] = [() => clearTimeout(timer)]

  if (external) {
    if (external.aborted) {
      timeoutController.abort()
    } else {
      const onAbort = () => timeoutController.abort()
      external.addEventListener('abort', onAbort, { once: true })
      cleanups.push(() => external.removeEventListener('abort', onAbort))
    }
  }

  return {
    signal: timeoutController.signal,
    cleanup: () => {
      for (const fn of cleanups) {
        fn()
      }
    },
  }
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 && status < 600
}

async function readErrorBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }
  const text = await response.text().catch(() => '')
  return text || null
}

async function parseJsonBody<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text.trim()) {
    throw new ApiError('empty_response', response.status, null)
  }
  try {
    return JSON.parse(text) as T
  } catch {
    throw new ApiError('invalid_json', response.status, text)
  }
}

function mergeHeaders(extra?: HeadersInit, defaults?: HeadersInit): Headers {
  const merged = new Headers(defaults)
  if (extra) {
    new Headers(extra).forEach((value, key) => merged.set(key, value))
  }
  return merged
}

export async function apiFetch(path: string, init?: RequestInit & ApiRequestOptions): Promise<Response> {
  const { signal: externalSignal, headers: extraHeaders, timeoutMs, ...fetchInit } = init ?? {}
  const url = resolveApiUrl(path)
  const timeout = timeoutMs ?? DEFAULT_TIMEOUT_MS
  const { signal, cleanup } = mergeAbortSignals(timeout, externalSignal)

  const headers = mergeHeaders(extraHeaders, apiRequestHeaders())

  let lastResponse: Response | undefined
  let attempt = 0

  try {
    while (attempt < 2) {
      const response = await fetch(url, {
        ...fetchInit,
        headers,
        signal,
      })

      lastResponse = response

      if (attempt === 0 && isRetryableStatus(response.status)) {
        attempt += 1
        await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS))
        continue
      }

      return response
    }

    return lastResponse!
  } finally {
    cleanup()
  }
}

export async function apiGet<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  const response = await apiFetch(path, { method: 'GET', ...options })

  if (!response.ok) {
    const body = await readErrorBody(response)
    throw new ApiError(`http_${response.status}`, response.status, body)
  }

  return parseJsonBody<T>(response)
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  const response = await apiFetch(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: mergeHeaders(options?.headers, { 'Content-Type': 'application/json' }),
    signal: options?.signal,
    timeoutMs: options?.timeoutMs,
  })

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    throw new ApiError(`http_${response.status}`, response.status, errorBody)
  }

  return parseJsonBody<T>(response)
}

export async function apiPostJson<T>(
  path: string,
  body: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiPost<T>(path, body, options)
}
