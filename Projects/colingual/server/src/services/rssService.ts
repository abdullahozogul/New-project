import Parser from 'rss-parser'
import * as cheerio from 'cheerio'
import type { CEFRLevel, ScrapedText } from '../types'
import { http } from '../httpClient'

const parser = new Parser({
  customFields: {
    item: [
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:content', 'mediaContent'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
})

const MAX_ARTICLE_FETCHES_PER_FEED = 2
const ARTICLE_FETCH_TIMEOUT_MS = 6_000

const RSS_SOURCES: Record<string, { url: string; name: string; cefr: CEFRLevel[] }[]> = {
  en: [
    {
      url: 'https://feeds.bbci.co.uk/news/rss.xml',
      name: 'BBC News',
      cefr: ['B1', 'B2', 'C1'],
    },
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
    {
      url: 'https://feeds.skynews.com/feeds/rss/world.xml',
      name: 'Sky News',
      cefr: ['B1', 'B2'],
    },
  ],
  tr: [
    {
      url: 'https://www.bbc.com/turkce/index.xml',
      name: 'BBC Türkçe',
      cefr: ['B1', 'B2'],
    },
    {
      url: 'https://www.hurriyet.com.tr/rss/anasayfa',
      name: 'Hürriyet',
      cefr: ['B1', 'B2', 'C1'],
    },
  ],
  de: [
    {
      url: 'https://www.tagesschau.de/xml/rss2',
      name: 'Tagesschau',
      cefr: ['B2', 'C1'],
    },
  ],
  fr: [
    {
      url: 'https://www.rfi.fr/fr/rss',
      name: 'RFI',
      cefr: ['B1', 'B2'],
    },
  ],
}

function estimateCEFR(text: string): CEFRLevel {
  const words = text.split(/\s+/).filter(Boolean)
  const wordCount = words.length
  if (wordCount < 80) return 'A2'

  const avgWordLength = text.replace(/\s/g, '').length / wordCount
  const sentenceCount = Math.max(1, text.split(/[.!?]+/).filter((s) => s.trim()).length)
  const avgSentenceLength = wordCount / sentenceCount

  if (avgWordLength < 4.5 && avgSentenceLength < 10) return 'A2'
  if (avgWordLength < 5.0 && avgSentenceLength < 15) return 'B1'
  if (avgWordLength < 5.5 && avgSentenceLength < 20) return 'B2'
  if (avgWordLength < 6.0 && avgSentenceLength < 25) return 'C1'
  return 'C2'
}

type RssFeedItem = {
  content?: string
  contentSnippet?: string
  summary?: string
  contentEncoded?: string
}

function bodyFromRssItem(item: RssFeedItem): string {
  const raw =
    item.contentEncoded ?? item.content ?? item.contentSnippet ?? item.summary ?? ''
  if (!raw.trim()) return ''
  const $ = cheerio.load(raw)
  return $.text().replace(/\s{2,}/g, ' ').trim()
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

async function extractArticleText(url: string): Promise<string> {
  try {
    const { data: html } = await http.get<string>(url, {
      timeout: ARTICLE_FETCH_TIMEOUT_MS,
    })

    const $ = cheerio.load(html)
    $('script, style, nav, footer, header, aside, .ad, .advertisement, .cookie-banner').remove()

    const selectors = [
      'article',
      '[class*="article-body"]',
      '[class*="story-body"]',
      '[class*="post-content"]',
      '[class*="entry-content"]',
      'main',
      '.content',
    ]

    let articleText = ''
    for (const selector of selectors) {
      const el = $(selector).first()
      if (el.length) {
        articleText = el.text()
        break
      }
    }

    if (!articleText) {
      articleText = $('p')
        .map((_, el) => $(el).text())
        .get()
        .join('\n\n')
    }

    return articleText
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 5000)
  } catch {
    return ''
  }
}

export async function fetchRSSTexts(
  language: string,
  cefrLevel?: CEFRLevel,
  count = 5,
): Promise<ScrapedText[]> {
  const sources = RSS_SOURCES[language] ?? RSS_SOURCES.en
  const filteredSources = cefrLevel ? sources.filter((s) => s.cefr.includes(cefrLevel)) : sources

  const errors: string[] = []

  for (const selectedSource of shuffle([...filteredSources])) {
    try {
      const feed = await parser.parseURL(selectedSource.url)
      const items = feed.items.slice(0, Math.max(count * 2, 6))
      const results: ScrapedText[] = []
      let articleFetches = 0

      for (const item of items) {
        if (results.length >= count) break

        const url = item.link ?? ''
        if (!url) continue

        let body = bodyFromRssItem(item as RssFeedItem)

        if (wordCount(body) < 50 && articleFetches < MAX_ARTICLE_FETCHES_PER_FEED) {
          articleFetches += 1
          const fullText = await extractArticleText(url)
          if (fullText) body = fullText
        }

        if (wordCount(body) < 30) continue

        const words = wordCount(body)

        results.push({
          id: `rss-${hashId(item.title ?? url)}`,
          title: item.title ?? 'Başlıksız',
          body,
          source: selectedSource.name,
          url,
          language,
          publishedAt: item.pubDate ?? new Date().toISOString(),
          wordCount: words,
          estimatedCEFR: estimateCEFR(body),
        })
      }

      if (results.length > 0) {
        return results
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'rss_error'
      errors.push(`${selectedSource.name}: ${message}`)
    }
  }

  throw new Error(
    errors.length > 0 ? `RSS kaynaklarından metin alınamadı (${errors[0]})` : 'RSS kaynaklarından metin alınamadı',
  )
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function hashId(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}
