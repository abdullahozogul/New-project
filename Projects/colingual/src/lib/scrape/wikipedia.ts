import { fetchWithTimeout } from '../rssParse'
import type { ScrapeCefrLevel, ScrapedText } from './types'
import { wordCount } from './utils'

const WIKI_ENDPOINTS: Record<string, string> = {
  en_simple: 'https://simple.wikipedia.org/w/api.php',
  en: 'https://en.wikipedia.org/w/api.php',
  tr: 'https://tr.wikipedia.org/w/api.php',
  de: 'https://de.wikipedia.org/w/api.php',
  fr: 'https://fr.wikipedia.org/w/api.php',
  es: 'https://es.wikipedia.org/w/api.php',
  it: 'https://it.wikipedia.org/w/api.php',
  ja: 'https://ja.wikipedia.org/w/api.php',
}

const CEFR_TO_WIKI: Record<ScrapeCefrLevel, string> = {
  A1: 'en_simple',
  A2: 'en_simple',
  B1: 'en_simple',
  B2: 'en',
  C1: 'en',
  C2: 'en',
}

const WIKI_HEADERS = {
  'User-Agent': 'Colingual/1.0 (language-learning; https://github.com/colingual)',
  Accept: 'application/json',
}

async function wikiGet(endpoint: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(endpoint)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  const response = await fetchWithTimeout(url.toString(), 12_000, { headers: WIKI_HEADERS })
  if (!response.ok) {
    throw new Error(`wikipedia_http_${response.status}`)
  }
  return response.json()
}

export async function fetchWikipediaText(
  language: string,
  cefrLevel: ScrapeCefrLevel = 'B1',
  topic?: string,
): Promise<ScrapedText> {
  const wikiLang =
    language === 'en' ? CEFR_TO_WIKI[cefrLevel] : (WIKI_ENDPOINTS[language] ? language : 'en')
  const endpoint = WIKI_ENDPOINTS[wikiLang] ?? WIKI_ENDPOINTS.en

  const searchParams: Record<string, string> = topic
    ? { action: 'query', list: 'search', srsearch: topic, format: 'json', srlimit: '1' }
    : { action: 'query', list: 'random', rnnamespace: '0', rnlimit: '1', format: 'json' }

  const searchData = (await wikiGet(endpoint, searchParams)) as {
    query?: { search?: { title: string }[]; random?: { title: string }[] }
  }

  const pageTitle = topic
    ? searchData.query?.search?.[0]?.title
    : searchData.query?.random?.[0]?.title

  if (!pageTitle) {
    throw new Error('Wikipedia: makale bulunamadı')
  }

  const pageData = (await wikiGet(endpoint, {
    action: 'query',
    titles: pageTitle,
    prop: 'extracts|pageimages',
    exintro: 'false',
    explaintext: 'true',
    exsectionformat: 'plain',
    piprop: 'thumbnail',
    pithumbsize: '500',
    format: 'json',
  })) as {
    query?: {
      pages?: Record<string, { title?: string; extract?: string; thumbnail?: { source?: string } }>
    }
  }

  const pages = pageData.query?.pages ?? {}
  const page = pages[Object.keys(pages)[0]]
  const body = String(page?.extract ?? '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 4000)

  if (!body) {
    throw new Error('Wikipedia: içerik boş')
  }

  const wikiHost = wikiLang.replace('_simple', '')
  const words = wordCount(body)

  return {
    id: `wiki-${Date.now()}`,
    title: page?.title ?? pageTitle,
    body,
    source: wikiLang === 'en_simple' ? 'Wikipedia Simple English' : 'Wikipedia',
    url: `https://${wikiHost}.wikipedia.org/wiki/${encodeURIComponent(page?.title ?? pageTitle)}`,
    language,
    publishedAt: new Date().toISOString(),
    wordCount: words,
    estimatedCEFR: cefrLevel,
    imageUrl: page?.thumbnail?.source,
  }
}
