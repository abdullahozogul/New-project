export type RssFeedItem = {
  title?: string
  description?: string
  /** Full HTML body when the feed exposes content:encoded */
  contentEncoded?: string
  link?: string
  pubDate?: string
}

function readRssTag(block: string, tag: string): string | undefined {
  const cdata = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i')
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
  const match = block.match(cdata) ?? block.match(plain)
  const value = match?.[1]?.trim()
  return value ? value.replace(/\s+/g, ' ').trim() : undefined
}

export function parseRssXmlItems(xml: string): RssFeedItem[] {
  const blocks = xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) ?? []
  const items: RssFeedItem[] = []

  for (const block of blocks) {
    const title = readRssTag(block, 'title')
    if (!title) {
      continue
    }
    items.push({
      title,
      link: readRssTag(block, 'link'),
      description: readRssTag(block, 'description'),
      contentEncoded: readRssTag(block, 'content:encoded'),
      pubDate: readRssTag(block, 'pubDate'),
    })
  }

  return items
}

export async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

const RSS_USER_AGENT =
  'Mozilla/5.0 (compatible; Colingual/1.0; language-learning) AppleWebKit/537.36'

export async function fetchRssFeedItems(
  rssUrl: string,
  options?: { timeoutMs?: number },
): Promise<RssFeedItem[]> {
  const timeoutMs = options?.timeoutMs ?? 10_000

  try {
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`
    const proxyResponse = await fetchWithTimeout(proxyUrl, Math.min(timeoutMs, 8_000))
    if (proxyResponse.ok) {
      const payload = (await proxyResponse.json()) as { items?: RssFeedItem[] }
      if (payload.items?.length) {
        return payload.items
      }
    }
  } catch {
    // fall through to direct RSS
  }

  const directResponse = await fetchWithTimeout(rssUrl, timeoutMs, {
    headers: {
      'User-Agent': RSS_USER_AGENT,
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
  })

  if (!directResponse.ok) {
    throw new Error(`rss_direct_${directResponse.status}`)
  }

  const xml = await directResponse.text()
  const items = parseRssXmlItems(xml)
  if (items.length === 0) {
    throw new Error('rss_empty')
  }

  return items
}
