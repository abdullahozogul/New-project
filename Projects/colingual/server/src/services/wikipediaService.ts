import type { CEFRLevel, ScrapedText } from '../types'
import { http } from '../httpClient'

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

const CEFR_TO_WIKI: Record<CEFRLevel, string> = {
  A1: 'en_simple',
  A2: 'en_simple',
  B1: 'en_simple',
  B2: 'en',
  C1: 'en',
  C2: 'en',
}

export async function fetchWikipediaText(
  language: string,
  cefrLevel: CEFRLevel = 'B1',
  topic?: string,
): Promise<ScrapedText> {
  const wikiLang =
    language === 'en' ? CEFR_TO_WIKI[cefrLevel] : (WIKI_ENDPOINTS[language] ? language : 'en')

  const endpoint = WIKI_ENDPOINTS[wikiLang] ?? WIKI_ENDPOINTS.en

  const searchParams = topic
    ? { action: 'query', list: 'search', srsearch: topic, format: 'json', srlimit: 1 }
    : { action: 'query', list: 'random', rnnamespace: '0', rnlimit: '1', format: 'json' }

  const { data: searchData } = await http.get(endpoint, { params: searchParams })

  const pageTitle = topic
    ? searchData.query?.search?.[0]?.title
    : searchData.query?.random?.[0]?.title

  if (!pageTitle) {
    throw new Error('Wikipedia: makale bulunamadı')
  }

  const { data: pageData } = await http.get(endpoint, {
    params: {
      action: 'query',
      titles: pageTitle,
      prop: 'extracts|pageimages',
      exintro: false,
      explaintext: true,
      exsectionformat: 'plain',
      piprop: 'thumbnail',
      pithumbsize: 500,
      format: 'json',
    },
  })

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
  const wordCount = body.split(/\s+/).filter(Boolean).length

  return {
    id: `wiki-${Date.now()}`,
    title: page.title ?? pageTitle,
    body,
    source: wikiLang === 'en_simple' ? 'Wikipedia Simple English' : 'Wikipedia',
    url: `https://${wikiHost}.wikipedia.org/wiki/${encodeURIComponent(page.title ?? pageTitle)}`,
    language,
    publishedAt: new Date().toISOString(),
    wordCount,
    estimatedCEFR: cefrLevel,
    imageUrl: page.thumbnail?.source,
  }
}
