/**
 * Google News RSS — same pattern as scraping/news_rss.py and
 * AI-Cursor-Scraping-Assistant (no browser, no CORS from server-side fetch).
 */
import { extractArticleBodyFromUrl } from '../articleExtract'
import { headlineFieldsFromRssTitle } from '../newsSource'
import { fetchRssFeedItems } from '../rssParse'
import type { ScrapedText } from './types'
import { estimateCEFR, hashId, wordCount } from './utils'

const GOOGLE_NEWS_RSS: Record<string, { url: string; label: string }> = {
  en: {
    url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
    label: 'Google News',
  },
  tr: {
    url: 'https://news.google.com/rss?hl=tr&gl=TR&ceid=TR:tr',
    label: 'Google Haberler',
  },
  de: {
    url: 'https://news.google.com/rss?hl=de&gl=DE&ceid=DE:de',
    label: 'Google News',
  },
  fr: {
    url: 'https://news.google.com/rss?hl=fr&gl=FR&ceid=FR:fr',
    label: 'Google Actualités',
  },
  es: {
    url: 'https://news.google.com/rss?hl=es&gl=ES&ceid=ES:es',
    label: 'Google Noticias',
  },
  it: {
    url: 'https://news.google.com/rss?hl=it&gl=IT&ceid=IT:it',
    label: 'Google News',
  },
}

function bodyFromItem(description: string | undefined, contentEncoded: string | undefined): string {
  const raw = contentEncoded ?? description ?? ''
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function fetchGoogleNewsTexts(language: string, count = 5): Promise<ScrapedText[]> {
  const feed = GOOGLE_NEWS_RSS[language] ?? GOOGLE_NEWS_RSS.en
  const items = await fetchRssFeedItems(feed.url, { timeoutMs: 14_000 })
  const results: ScrapedText[] = []

  for (const item of items) {
    if (results.length >= count) break
    const rawTitle = item.title?.trim()
    const link = item.link?.trim()
    if (!rawTitle || !link) continue

    const { title, sourceName } = headlineFieldsFromRssTitle(rawTitle)
    let body = bodyFromItem(item.description, item.contentEncoded)
    if (wordCount(body) < 80 && link) {
      const scraped = await extractArticleBodyFromUrl(link)
      if (scraped) body = scraped
    }
    if (wordCount(body) < 25) {
      body = body.length > 0 ? body : title
    }
    if (wordCount(body) < 8) continue

    results.push({
      id: `gnews-${hashId(rawTitle + link)}`,
      title,
      body: body.slice(0, 5000),
      source: sourceName ?? feed.label,
      url: link,
      language,
      publishedAt: item.pubDate ?? new Date().toISOString(),
      wordCount: wordCount(body),
      estimatedCEFR: estimateCEFR(body),
    })
  }

  if (results.length === 0) {
    throw new Error('google_news_empty')
  }

  return results
}
