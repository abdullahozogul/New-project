const USER_AGENT =
  'Mozilla/5.0 (compatible; Colingual/1.0; language-learning) AppleWebKit/537.36'

const MAX_ARTICLE_CHARS = 6000

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
}

function stripHtmlTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  )
}

function normalizeArticleText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_ARTICLE_CHARS)
}

function extractJsonLdArticleBody(html: string): string | undefined {
  const blocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  if (!blocks) {
    return undefined
  }

  for (const block of blocks) {
    const inner = block.replace(/^[\s\S]*?>/, '').replace(/<\/script>$/i, '').trim()
    try {
      const parsed = JSON.parse(inner) as unknown
      const nodes = Array.isArray(parsed) ? parsed : [parsed]
      for (const node of nodes) {
        if (!node || typeof node !== 'object') {
          continue
        }
        const record = node as Record<string, unknown>
        const type = String(record['@type'] ?? '')
        if (!/NewsArticle|Article|ReportageNewsArticle/i.test(type)) {
          continue
        }
        const body = record.articleBody
        if (typeof body === 'string' && body.trim().length > 120) {
          return normalizeArticleText(stripHtmlTags(body))
        }
      }
    } catch {
      // ignore invalid JSON-LD
    }
  }

  return undefined
}

function extractArticleTagText(html: string): string | undefined {
  const match = html.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i)
  if (!match?.[1]) {
    return undefined
  }
  const text = stripHtmlTags(match[1])
  return text.length > 180 ? normalizeArticleText(text) : undefined
}

function extractParagraphText(html: string): string | undefined {
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripHtmlTags(match[1] ?? ''))
    .filter((paragraph) => paragraph.length > 48)

  if (paragraphs.length < 2) {
    return undefined
  }

  return normalizeArticleText(paragraphs.join(' '))
}

/** Extract main article plain text from publisher HTML (dev server / scraping pipeline). */
export function extractTextFromNewsHtml(html: string): string | undefined {
  const jsonLd = extractJsonLdArticleBody(html)
  if (jsonLd) {
    return jsonLd
  }

  const articleTag = extractArticleTagText(html)
  if (articleTag) {
    return articleTag
  }

  const paragraphs = extractParagraphText(html)
  if (paragraphs) {
    return paragraphs
  }

  const ogMatch = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
  )
  if (ogMatch?.[1]) {
    const og = normalizeArticleText(stripHtmlTags(ogMatch[1]))
    if (og.length > 120) {
      return og
    }
  }

  return undefined
}

export async function fetchPublisherHtml(url: string, timeoutMs = 8000): Promise<string | undefined> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
      },
    })

    if (!response.ok) {
      return undefined
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return undefined
    }

    return await response.text()
  } catch {
    return undefined
  } finally {
    clearTimeout(timer)
  }
}

export async function extractArticleBodyFromUrl(url: string): Promise<string | undefined> {
  const html = await fetchPublisherHtml(url)
  if (!html) {
    return undefined
  }
  return extractTextFromNewsHtml(html)
}
