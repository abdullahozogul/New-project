import { resolveApiUrl } from '../lib/apiClient'
import type { Level } from '../data'
import type { RawNewsHeadline } from '../lib/newsFeed'

export type CEFRLevel = Level | 'C2'

export interface FetchedText {
  id: string
  title: string
  body: string
  source: string
  url: string
  language: string
  publishedAt: string
  wordCount: number
  estimatedCEFR: CEFRLevel
  imageUrl?: string
}

export interface TextFetchOptions {
  language: string
  cefrLevel?: CEFRLevel
  source?: 'rss' | 'wikipedia'
  topic?: string
  count?: number
}

const SCRAPE_API_BASE = import.meta.env.VITE_SCRAPE_API_URL?.trim() ?? ''

function scrapeApiUrl(path: '/text' | '/news' | '/health'): string {
  const suffix = `/scrape${path}`
  if (SCRAPE_API_BASE) {
    return `${SCRAPE_API_BASE.replace(/\/$/, '')}/api${suffix}`
  }
  return resolveApiUrl(suffix)
}

async function fetchWithTimeout(url: string, timeoutMs = 45_000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

type ScrapeResponse<T> = { success: boolean; data?: T; error?: string }

export function mapScrapedToHeadline(text: FetchedText): RawNewsHeadline {
  return {
    id: text.id,
    title: text.title,
    summary: text.body.slice(0, 600),
    category: 'World',
    sourceName: text.source,
    sourceUrl: text.url,
    articleBody: text.body,
  }
}

export async function fetchSingleText(options: TextFetchOptions): Promise<FetchedText> {
  const params = new URLSearchParams({
    language: options.language,
    source: options.source ?? 'rss',
    ...(options.cefrLevel ? { cefrLevel: options.cefrLevel } : {}),
    ...(options.topic ? { topic: options.topic } : {}),
  })

  const res = await fetchWithTimeout(`${scrapeApiUrl('/text')}?${params}`)

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as ScrapeResponse<never>
    throw new Error(err.error ?? `scrape_http_${res.status}`)
  }

  const json = (await res.json()) as ScrapeResponse<FetchedText>
  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'scrape_empty')
  }

  return json.data
}

export async function fetchNewsList(options: TextFetchOptions): Promise<FetchedText[]> {
  const params = new URLSearchParams({
    language: options.language,
    count: String(options.count ?? 3),
    ...(options.cefrLevel ? { cefrLevel: options.cefrLevel } : {}),
  })

  const res = await fetchWithTimeout(`${scrapeApiUrl('/news')}?${params}`)

  if (!res.ok) {
    throw new Error(`scrape_http_${res.status}`)
  }

  const json = (await res.json()) as ScrapeResponse<FetchedText[]>
  if (!json.success || !json.data?.length) {
    throw new Error(json.error ?? 'scrape_news_empty')
  }

  return json.data
}

/** Express scrape API — RSS/Wikipedia, no browser CORS. */
export async function fetchHeadlineViaScrapeApi(
  options: TextFetchOptions,
): Promise<RawNewsHeadline | null> {
  try {
    const text = await fetchSingleText(options)
    return mapScrapedToHeadline(text)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[colingual] scrape failed', options, error)
    }
    return null
  }
}

export async function isScrapeApiAvailable(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(scrapeApiUrl('/health'), 4000)
    if (!res.ok) return false
    const json = (await res.json()) as { status?: string }
    return json.status === 'ok'
  } catch {
    return false
  }
}
