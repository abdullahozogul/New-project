import { fetchGoogleNewsTexts } from './googleNews'
import { fetchPublisherRssTexts } from './rssFeeds'
import type { ScrapeCefrLevel, ScrapedText } from './types'
import { fetchWikipediaText } from './wikipedia'

export type { ScrapeCefrLevel, ScrapedText } from './types'

export async function fetchScrapedNewsList(
  language: string,
  cefrLevel?: ScrapeCefrLevel,
  count = 3,
): Promise<ScrapedText[]> {
  try {
    return await fetchPublisherRssTexts(language, cefrLevel, count)
  } catch {
    return fetchGoogleNewsTexts(language, count)
  }
}

export async function fetchScrapedSingleText(
  language: string,
  cefrLevel: ScrapeCefrLevel = 'B1',
  source: 'rss' | 'wikipedia' = 'rss',
  topic?: string,
): Promise<ScrapedText> {
  if (source === 'wikipedia') {
    return fetchWikipediaText(language, cefrLevel, topic)
  }

  try {
    const publisher = await fetchPublisherRssTexts(language, cefrLevel, 1)
    if (publisher[0]) return publisher[0]
  } catch {
    // try Google News RSS next
  }

  try {
    const google = await fetchGoogleNewsTexts(language, 1)
    if (google[0]) return google[0]
  } catch {
    // Wikipedia fallback
  }

  return fetchWikipediaText(language, cefrLevel, topic)
}
