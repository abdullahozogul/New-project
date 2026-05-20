import { apiFetch } from './apiClient'
import { headlineFieldsFromRssTitle } from './newsSource'

export type RawNewsHeadline = {
  id: string
  title: string
  summary: string
  category: string
  /** Publisher or outlet name (e.g. BBC News). */
  sourceName?: string
  sourceUrl?: string
  publishedAt?: string
  /** Scraped publisher article text (fed to Gemini for faithful CEFR adaptation). */
  articleBody?: string
}

const SEEN_HEADLINES_KEY = 'colingual.seenHeadlineIds'
const MAX_SEEN = 120

export function loadSeenHeadlineIds(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(SEEN_HEADLINES_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function rememberHeadlineId(id: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const next = [id, ...loadSeenHeadlineIds().filter((item) => item !== id)].slice(0, MAX_SEEN)
  window.localStorage.setItem(SEEN_HEADLINES_KEY, JSON.stringify(next))
}

function hashHeadlineId(title: string, link?: string): string {
  const seed = `${title}::${link ?? ''}`
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index)
    hash |= 0
  }
  return `hn-${Math.abs(hash).toString(36)}`
}

function pickCategoryFromTitle(title: string): string {
  const lower = title.toLowerCase()
  if (/(sport|football|nba|soccer|olympic)/.test(lower)) {
    return 'Sports'
  }
  if (/(tech|ai|software|cyber|startup|apple|google)/.test(lower)) {
    return 'Technology'
  }
  if (/(health|hospital|virus|medicine|covid)/.test(lower)) {
    return 'Health'
  }
  if (/(climate|environment|energy|carbon)/.test(lower)) {
    return 'Environment'
  }
  if (/(market|economy|inflation|bank|trade)/.test(lower)) {
    return 'Business'
  }
  return 'World'
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

type Rss2JsonItem = {
  title?: string
  description?: string
  link?: string
  pubDate?: string
}

type Rss2JsonResponse = {
  status?: string
  items?: Rss2JsonItem[]
}

function mapRssItems(items: Rss2JsonItem[]): RawNewsHeadline[] {
  return items
    .filter((item) => item.title?.trim())
    .map((item) => {
      const rawTitle = item.title!.trim()
      const { title, sourceName } = headlineFieldsFromRssTitle(rawTitle)
      const summary = (item.description ?? rawTitle)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return {
        id: hashHeadlineId(rawTitle, item.link),
        title,
        summary: summary.slice(0, 600),
        category: pickCategoryFromTitle(title),
        sourceName,
        sourceUrl: item.link,
        publishedAt: item.pubDate,
      }
    })
}

export async function fetchLiveNewsHeadlines(options?: {
  excludeIds?: string[]
  limit?: number
  /** BCP-47 style code; `tr` fetches Turkish Google News RSS in dev. */
  languageCode?: string
}): Promise<RawNewsHeadline[]> {
  const exclude = new Set(options?.excludeIds ?? loadSeenHeadlineIds())
  const limit = options?.limit ?? 12
  const configuredEndpoint = import.meta.env.VITE_NEWS_SOURCE_ENDPOINT?.trim()

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)

  let response: Response

  try {
    if (configuredEndpoint) {
      const url = new URL(configuredEndpoint, window.location.origin)
      url.searchParams.set('limit', String(limit))
      if (exclude.size > 0) {
        url.searchParams.set('exclude', [...exclude].join(','))
      }
      response = await fetch(url.toString(), { signal: controller.signal })
    } else {
      const params = new URLSearchParams()
      if (exclude.size > 0) {
        params.set('exclude', [...exclude].join(','))
      }
      params.set('limit', String(limit))
      if (options?.languageCode) {
        params.set('lang', options.languageCode)
      }
      response = await apiFetch(`/news/headlines?${params.toString()}`, {
        signal: controller.signal,
        timeoutMs: 20_000,
      })
    }
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    throw new Error(`news_http_${response.status}`)
  }

  const payload = (await response.json()) as { items?: RawNewsHeadline[] } | RawNewsHeadline[]

  const items = Array.isArray(payload) ? payload : (payload.items ?? [])
  const fresh = shuffle(items.filter((item) => item.title && !exclude.has(item.id)))

  if (fresh.length > 0) {
    return fresh.slice(0, limit)
  }

  return shuffle(items.filter((item) => item.title)).slice(0, limit)
}

export function parseRss2JsonPayload(payload: Rss2JsonResponse): RawNewsHeadline[] {
  return mapRssItems(payload.items ?? [])
}

const ARTICLE_SCRAPE_TIMEOUT_MS = 5_000

/** Optional scrape; never blocks load if publisher URL fails. */
export async function enrichHeadlineWithArticleBody(
  headline: RawNewsHeadline,
): Promise<RawNewsHeadline> {
  if (headline.articleBody && headline.articleBody.trim().length > 120) {
    return headline
  }

  if (!headline.sourceUrl) {
    return headline
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ARTICLE_SCRAPE_TIMEOUT_MS)

  try {
    const params = new URLSearchParams({ url: headline.sourceUrl })
    const response = await apiFetch(`/news/article-body?${params.toString()}`, {
      signal: controller.signal,
      timeoutMs: ARTICLE_SCRAPE_TIMEOUT_MS,
    })
    if (!response.ok) {
      return headline
    }

    const payload = (await response.json()) as { articleBody?: string | null }
    const articleBody = payload.articleBody?.trim()
    if (!articleBody || articleBody.length < 120) {
      return headline
    }

    return {
      ...headline,
      articleBody,
      summary: articleBody.slice(0, 600),
    }
  } catch {
    return headline
  } finally {
    clearTimeout(timer)
  }
}

/** First headline + quick scrape attempt (RSS summary is always used as fallback). */
export async function prepareHeadlineForCefr(
  headlines: RawNewsHeadline[],
): Promise<RawNewsHeadline | null> {
  const primary = headlines[0]
  if (!primary) {
    return null
  }

  if (primary.articleBody && primary.articleBody.length > 120) {
    return primary
  }

  return enrichHeadlineWithArticleBody(primary)
}
