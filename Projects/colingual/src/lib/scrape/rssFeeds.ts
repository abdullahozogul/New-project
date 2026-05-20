import { extractArticleBodyFromUrl } from '../articleExtract'
import { fetchRssFeedItems } from '../rssParse'
import type { ScrapeCefrLevel, ScrapedText } from './types'
import { estimateCEFR, hashId, shuffle, wordCount } from './utils'

type FeedSource = { url: string; name: string; cefr: ScrapeCefrLevel[] }

const RSS_SOURCES: Record<string, FeedSource[]> = {
  en: [
    { url: 'https://feeds.bbci.co.uk/news/rss.xml', name: 'BBC News', cefr: ['B1', 'B2', 'C1'] },
    {
      url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
      name: 'BBC World',
      cefr: ['B1', 'B2', 'C1'],
    },
    {
      url: 'https://www.theguardian.com/world/rss',
      name: 'The Guardian',
      cefr: ['B2', 'C1', 'C2'],
    },
  ],
  tr: [
    { url: 'https://www.bbc.com/turkce/index.xml', name: 'BBC Türkçe', cefr: ['B1', 'B2'] },
    {
      url: 'https://www.hurriyet.com.tr/rss/anasayfa',
      name: 'Hürriyet',
      cefr: ['B1', 'B2', 'C1'],
    },
  ],
  de: [{ url: 'https://www.tagesschau.de/xml/rss2', name: 'Tagesschau', cefr: ['B2', 'C1'] }],
  fr: [{ url: 'https://www.rfi.fr/fr/rss', name: 'RFI', cefr: ['B1', 'B2'] }],
  es: [{ url: 'https://elpais.com/rss/elpais/portada.xml', name: 'El País', cefr: ['B2', 'C1'] }],
}

const MAX_ARTICLE_FETCHES = 2

function bodyFromRssItem(description?: string, contentEncoded?: string): string {
  const raw = contentEncoded ?? description ?? ''
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function fetchPublisherRssTexts(
  language: string,
  cefrLevel?: ScrapeCefrLevel,
  count = 5,
): Promise<ScrapedText[]> {
  const sources = RSS_SOURCES[language] ?? RSS_SOURCES.en
  const filtered = cefrLevel ? sources.filter((s) => s.cefr.includes(cefrLevel)) : sources
  const errors: string[] = []

  for (const source of shuffle([...filtered])) {
    try {
      const items = await fetchRssFeedItems(source.url, { timeoutMs: 12_000 })
      const results: ScrapedText[] = []
      let articleFetches = 0

      for (const item of items.slice(0, Math.max(count * 2, 8))) {
        if (results.length >= count) break
        const url = item.link?.trim()
        const title = item.title?.trim()
        if (!url || !title) continue

        let body = bodyFromRssItem(item.description, item.contentEncoded)
        if (wordCount(body) < 50 && articleFetches < MAX_ARTICLE_FETCHES) {
          articleFetches += 1
          const full = await extractArticleBodyFromUrl(url)
          if (full) body = full
        }
        if (wordCount(body) < 30) continue

        results.push({
          id: `rss-${hashId(title + url)}`,
          title,
          body: body.slice(0, 5000),
          source: source.name,
          url,
          language,
          publishedAt: item.pubDate ?? new Date().toISOString(),
          wordCount: wordCount(body),
          estimatedCEFR: estimateCEFR(body),
        })
      }

      if (results.length > 0) return results
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'rss_error')
    }
  }

  throw new Error(errors[0] ?? 'publisher_rss_failed')
}
