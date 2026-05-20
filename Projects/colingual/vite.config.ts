import { spawn } from 'node:child_process'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { extractArticleBodyFromUrl } from './src/lib/articleExtract'
import { assessTextCefr } from './src/lib/cefrAssess'
import { headlineFieldsFromRssTitle } from './src/lib/newsSource'
import { fetchRssFeedItems, type RssFeedItem } from './src/lib/rssParse'
import {
  fetchScrapedNewsList,
  fetchScrapedSingleText,
  type ScrapeCefrLevel,
} from './src/lib/scrape'
import { serverSynthesize } from './src/services/tts/serverSynthesize'
import { prepareTtsRequest } from './src/services/tts/ttsLanguage'
import type { TTSRequest } from './src/types/tts'

const GOOGLE_NEWS_RSS_BY_LANG: Record<string, string> = {
  en: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
  tr: 'https://news.google.com/rss?hl=tr&gl=TR&ceid=TR:tr',
  de: 'https://news.google.com/rss?hl=de&gl=DE&ceid=DE:de',
  fr: 'https://news.google.com/rss?hl=fr&gl=FR&ceid=FR:fr',
  es: 'https://news.google.com/rss?hl=es&gl=ES&ceid=ES:es',
  it: 'https://news.google.com/rss?hl=it&gl=IT&ceid=IT:it',
}

function rssUrlForLang(lang: string | null): string {
  const code = lang?.toLowerCase() ?? 'en'
  return GOOGLE_NEWS_RSS_BY_LANG[code] ?? GOOGLE_NEWS_RSS_BY_LANG.en
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

function mapRssItems(items: RssFeedItem[]) {
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

async function fetchFromGNews(apiKey: string, limit: number) {
  const url = new URL('https://gnews.io/api/v4/top-headlines')
  url.searchParams.set('lang', 'en')
  url.searchParams.set('max', String(limit))
  url.searchParams.set('apikey', apiKey)

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`gnews_${response.status}`)
  }

  const payload = (await response.json()) as {
    articles?: {
      title?: string
      description?: string
      url?: string
      publishedAt?: string
      source?: { name?: string }
    }[]
  }

  return (payload.articles ?? []).map((article) => {
    const rawTitle = article.title?.trim() ?? 'Untitled'
    const { title, sourceName: parsedSource } = headlineFieldsFromRssTitle(rawTitle)
    const sourceName = article.source?.name?.trim() || parsedSource
    return {
      id: hashHeadlineId(rawTitle, article.url),
      title,
      summary: (article.description ?? rawTitle).trim(),
      category: pickCategoryFromTitle(title),
      sourceName,
      sourceUrl: article.url,
      publishedAt: article.publishedAt,
    }
  })
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function geminiDevProxyPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'colingual-gemini-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/gemini/generate', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        const apiKey = env.AI_ASSISTANT_API_KEY?.trim() || env.VITE_GEMINI_API_KEY?.trim()
        if (!apiKey) {
          res.statusCode = 503
          res.end(JSON.stringify({ error: 'missing_gemini_key' }))
          return
        }

        try {
          const body = (await readJsonBody(req)) as {
            model?: string
            systemInstruction?: { parts?: { text?: string }[] }
            contents?: { role?: string; parts?: { text?: string }[] }[]
            generationConfig?: Record<string, unknown>
          }

          const model = body.model?.trim() || env.VITE_GEMINI_MODEL?.trim() || 'gemini-2.5-flash'
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            model,
          )}:generateContent?key=${encodeURIComponent(apiKey)}`

          const upstream = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: body.systemInstruction,
              contents: body.contents,
              generationConfig: body.generationConfig,
            }),
          })

          const payload = await upstream.text()
          res.statusCode = upstream.status
          res.setHeader('Content-Type', 'application/json')
          res.end(payload)
        } catch (error) {
          res.statusCode = 502
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'gemini_proxy_failed',
            }),
          )
        }
      })
    },
  }
}

type HeadlineApiItem = {
  id: string
  title: string
  summary: string
  category: string
  sourceName?: string
  sourceUrl?: string
  publishedAt?: string
  articleBody?: string
}

function seleniumSiteForLang(lang: string | null, env: Record<string, string>): string {
  const configured = env.NEWS_SCRAPE_SITE?.trim()
  if (configured) {
    return configured
  }
  return lang?.toLowerCase() === 'tr' ? 'bbc' : 'wired'
}

function fetchFromSeleniumScraper(
  limit: number,
  lang: string | null,
  env: Record<string, string>,
  withBody: boolean,
): Promise<HeadlineApiItem[]> {
  return new Promise((resolve) => {
    const script = path.join(process.cwd(), 'scraping', 'fetch_headlines.py')
    const python = process.platform === 'win32' ? 'python' : 'python3'
    const site = seleniumSiteForLang(lang, env)
    const args = [script, '--limit', String(limit), '--site', site]
    if (withBody) {
      args.push('--with-body')
    }

    const proc = spawn(python, args, {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    })
    let stdout = ''
    const killTimer = setTimeout(() => {
      proc.kill()
      resolve([])
    }, 120_000)

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
    })
    proc.on('error', () => {
      clearTimeout(killTimer)
      resolve([])
    })
    proc.on('close', (code) => {
      clearTimeout(killTimer)
      if (code !== 0) {
        resolve([])
        return
      }
      try {
        const payload = JSON.parse(stdout) as { items?: HeadlineApiItem[] }
        resolve(
          (payload.items ?? []).map((item) => ({
            ...item,
            category: item.category || pickCategoryFromTitle(item.title),
          })),
        )
      } catch {
        resolve([])
      }
    })
  })
}

function extractArticleBodyViaPython(url: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const script = path.join(process.cwd(), 'scraping', 'article_extract.py')
    const python = process.platform === 'win32' ? 'python' : 'python3'
    const proc = spawn(python, [script, url], { cwd: process.cwd() })
    let stdout = ''
    const killTimer = setTimeout(() => {
      proc.kill()
      resolve(undefined)
    }, 12_000)

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
    })
    proc.on('error', () => {
      clearTimeout(killTimer)
      resolve(undefined)
    })
    proc.on('close', (code) => {
      clearTimeout(killTimer)
      if (code !== 0) {
        resolve(undefined)
        return
      }
      try {
        const payload = JSON.parse(stdout) as { articleBody?: string | null }
        const body = payload.articleBody?.trim()
        resolve(body && body.length > 120 ? body : undefined)
      } catch {
        resolve(undefined)
      }
    })
  })
}

async function scrapeArticleBody(
  url: string,
  preferPython: boolean,
): Promise<string | undefined> {
  if (preferPython) {
    const fromPython = await extractArticleBodyViaPython(url)
    if (fromPython) {
      return fromPython
    }
  }
  return extractArticleBodyFromUrl(url)
}

function scrapeApiVitePlugin(): Plugin {
  return {
    name: 'colingual-scrape-api-vite',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0]
        if (!pathname.startsWith('/api/scrape')) {
          next()
          return
        }

        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        const requestUrl = new URL(req.url ?? '', 'http://localhost')
        const query = requestUrl.searchParams

        const sendJson = (status: number, payload: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(payload))
        }

        try {
          if (pathname === '/api/scrape/health') {
            sendJson(200, { status: 'ok', service: 'colingual-scrape-vite' })
            return
          }

          const language = query.get('language') ?? 'en'
          const cefrLevel = (query.get('cefrLevel') ?? 'B1') as ScrapeCefrLevel
          const topic = query.get('topic') ?? undefined

          if (pathname === '/api/scrape/news') {
            const count = Math.min(10, Math.max(1, Number.parseInt(query.get('count') ?? '3', 10) || 3))
            const data = await fetchScrapedNewsList(language, cefrLevel, count)
            sendJson(200, { success: true, data })
            return
          }

          if (pathname === '/api/scrape/wikipedia') {
            const data = await fetchScrapedSingleText(language, cefrLevel, 'wikipedia', topic)
            sendJson(200, { success: true, data })
            return
          }

          if (pathname === '/api/scrape/text') {
            const source = query.get('source') === 'wikipedia' ? 'wikipedia' : 'rss'
            const data = await fetchScrapedSingleText(language, cefrLevel, source, topic)
            sendJson(200, { success: true, data })
            return
          }

          sendJson(404, { success: false, error: 'not_found' })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'scrape_failed'
          console.error('[vite /api/scrape]', pathname, message)
          sendJson(500, { success: false, error: message })
        }
      })
    },
  }
}

function newsApiPlugin(env: Record<string, string>): Plugin {
  const preferPythonScraper = env.NEWS_USE_PYTHON_SCRAPER?.trim() === 'true'

  return {
    name: 'colingual-news-api',
    configureServer(server) {
      server.middlewares.use(
        '/api/news/article-body',
        async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'GET') {
            res.statusCode = 405
            res.end('Method not allowed')
            return
          }

          try {
            const requestUrl = new URL(req.url ?? '', 'http://localhost')
            const target = requestUrl.searchParams.get('url')?.trim()
            if (!target || !/^https?:\/\//i.test(target)) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'invalid_url' }))
              return
            }

            const articleBody = await scrapeArticleBody(target, preferPythonScraper)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ articleBody: articleBody ?? null }))
          } catch (error) {
            res.statusCode = 502
            res.end(
              JSON.stringify({
                error: error instanceof Error ? error.message : 'article_scrape_failed',
              }),
            )
          }
        },
      )

      server.middlewares.use(
        '/api/news/headlines',
        async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'GET') {
            res.statusCode = 405
            res.end('Method not allowed')
            return
          }

          try {
            const requestUrl = new URL(req.url ?? '', 'http://localhost')
            const exclude = new Set(
              (requestUrl.searchParams.get('exclude') ?? '')
                .split(',')
                .map((id) => id.trim())
                .filter(Boolean),
            )
            const limit = Math.min(
              20,
              Math.max(1, Number.parseInt(requestUrl.searchParams.get('limit') ?? '12', 10) || 12),
            )

            const lang = requestUrl.searchParams.get('lang')
            const useSelenium = env.NEWS_USE_SELENIUM_SCRAPER?.trim() === 'true'
            let items: HeadlineApiItem[] = []

            if (env.NEWS_SOURCE_API_KEY?.trim()) {
              items = await fetchFromGNews(env.NEWS_SOURCE_API_KEY.trim(), limit)
            }

            if (items.length === 0) {
              items = mapRssItems(await fetchRssFeedItems(rssUrlForLang(lang), { timeoutMs: 12_000 }))
            }

            if (items.length === 0 && useSelenium) {
              items = await fetchFromSeleniumScraper(Math.min(limit, 8), lang, env, false)
            }

            items = items.filter((item) => !exclude.has(item.id))

            for (let pass = 0; pass < items.length; pass += 1) {
              const j = Math.floor(Math.random() * (pass + 1))
              ;[items[pass], items[j]] = [items[j], items[pass]]
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ items: items.slice(0, limit) }))
          } catch (error) {
            res.statusCode = 502
            res.end(
              JSON.stringify({
                error: error instanceof Error ? error.message : 'news_fetch_failed',
              }),
            )
          }
        },
      )
    },
  }
}

function aiWritingFeedbackPlugin(): Plugin {
  return {
    name: 'colingual-ai-writing-feedback',
    configureServer(server) {
      server.middlewares.use('/api/ai/writing-feedback', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        try {
          const body = (await readJsonBody(req)) as {
            text?: string
            cefrLevel?: string
          }
          const text = body.text?.trim() ?? ''
          const assessment = assessTextCefr(text)
          const score = Math.min(
            100,
            Math.max(
              35,
              100 -
                assessment.sentenceScores.length * 4 -
                Math.round(assessment.averageScore * 2),
            ),
          )

          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              overallScore: score,
              grammarIssues: [],
              vocabularySuggestions: [],
              cohesionFeedback:
                'Geliştirme modu: tam AI geri bildirimi için Gemini anahtarını kullanın.',
              cefrAlignment: body.cefrLevel ?? assessment.estimatedLevel,
              improvedVersion: text,
            }),
          )
        } catch (error) {
          res.statusCode = 400
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'writing_feedback_failed',
            }),
          )
        }
      })
    },
  }
}

function ttsSynthesizePlugin(env: Record<string, string>): Plugin {
  return {
    name: 'colingual-tts-synthesize',
    configureServer(server) {
      server.middlewares.use('/api/tts/synthesize', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        const elevenKey = env.ELEVENLABS_API_KEY || env.VITE_ELEVENLABS_API_KEY || ''
        const openaiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY || ''

        if (!elevenKey && !openaiKey) {
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'tts_not_configured' }))
          return
        }

        try {
          const body = (await readJsonBody(req)) as TTSRequest
          if (!body.text?.trim()) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'text_required' }))
            return
          }

          const prepared = prepareTtsRequest({
            text: body.text,
            language: body.language || 'en',
            useCase: body.useCase || 'listening_content',
            cefrLevel: body.cefrLevel,
            voice: body.voice,
            speed: body.speed,
            streaming: body.streaming,
          })

          const { buffer } = await serverSynthesize(prepared, elevenKey, openaiKey)

          res.setHeader('Content-Type', 'audio/mpeg')
          res.end(Buffer.from(buffer))
        } catch (error) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'tts_synthesis_failed',
            }),
          )
        }
      })
    },
  }
}

function cefrAssessPlugin(): Plugin {
  return {
    name: 'colingual-cefr-assess',
    configureServer(server) {
      server.middlewares.use('/api/cefr/assess', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        try {
          const body = (await readJsonBody(req)) as { text?: string }
          const text = body.text?.trim() ?? ''
          const assessment = assessTextCefr(text)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(assessment))
        } catch (error) {
          res.statusCode = 400
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'cefr_assess_failed',
            }),
          )
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const scrapeApiPort = env.SCRAPE_API_PORT?.trim() || '3001'
  const useExternalScrapeServer = env.SCRAPE_USE_EXTERNAL_SERVER?.trim() === 'true'

  return {
    plugins: [
      react(),
      scrapeApiVitePlugin(),
      newsApiPlugin(env),
      geminiDevProxyPlugin(env),
      cefrAssessPlugin(),
      aiWritingFeedbackPlugin(),
      ttsSynthesizePlugin(env),
    ],
    server: {
      // Built-in scrape runs in Vite (src/lib/scrape). Set SCRAPE_USE_EXTERNAL_SERVER=true for server/.
      proxy: useExternalScrapeServer
        ? {
            '/api/scrape': {
              target: `http://localhost:${scrapeApiPort}`,
              changeOrigin: true,
            },
          }
        : undefined,
    },
  }
})
