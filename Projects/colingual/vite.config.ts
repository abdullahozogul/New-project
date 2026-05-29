import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { assessTextCefr } from './src/lib/cefrAssess'
import { serverSynthesize } from './src/services/tts/serverSynthesize'
import type { TTSRequest } from './src/types/tts'

const GOOGLE_NEWS_RSS_EN =
  'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en'

const GOOGLE_NEWS_RSS_TR =
  'https://news.google.com/rss?hl=tr&gl=TR&ceid=TR:tr'

function rssUrlForLang(lang: string | null): string {
  return lang?.toLowerCase() === 'tr' ? GOOGLE_NEWS_RSS_TR : GOOGLE_NEWS_RSS_EN
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

function mapRssItems(items: Rss2JsonItem[]) {
  return items
    .filter((item) => item.title?.trim())
    .map((item) => {
      const title = item.title!.trim()
      const summary = (item.description ?? title)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      return {
        id: hashHeadlineId(title, item.link),
        title,
        summary: summary.slice(0, 600),
        category: pickCategoryFromTitle(title),
        sourceUrl: item.link,
        publishedAt: item.pubDate,
      }
    })
}

async function fetchFromRss2Json(rssUrl: string): Promise<Rss2JsonResponse> {
  const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`
  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error(`rss2json_${response.status}`)
  }
  return (await response.json()) as Rss2JsonResponse
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
    articles?: { title?: string; description?: string; url?: string; publishedAt?: string }[]
  }

  return (payload.articles ?? []).map((article) => ({
    id: hashHeadlineId(article.title ?? '', article.url),
    title: article.title?.trim() ?? 'Untitled',
    summary: (article.description ?? article.title ?? '').trim(),
    category: pickCategoryFromTitle(article.title ?? ''),
    sourceUrl: article.url,
    publishedAt: article.publishedAt,
  }))
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

        const apiKey = env.AI_ASSISTANT_API_KEY?.trim()
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

          const model = env.GEMINI_MODEL?.trim() || env.VITE_GEMINI_MODEL?.trim() || 'gemini-2.5-flash'
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

function newsApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'colingual-news-api',
    configureServer(server) {
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
            let items =
              env.NEWS_SOURCE_API_KEY?.trim() ?
                await fetchFromGNews(env.NEWS_SOURCE_API_KEY.trim(), limit)
              : mapRssItems((await fetchFromRss2Json(rssUrlForLang(lang))).items ?? [])

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

        const elevenKey = env.ELEVENLABS_API_KEY || ''
        const openaiKey = env.OPENAI_API_KEY || ''

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

          const { buffer } = await serverSynthesize(
            {
              text: body.text,
              language: body.language || 'en',
              useCase: body.useCase || 'listening_content',
              cefrLevel: body.cefrLevel,
              voice: body.voice,
              speed: body.speed,
              streaming: body.streaming,
            },
            elevenKey,
            openaiKey,
          )

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
  return {
    plugins: [
      react(),
      newsApiPlugin(env),
      geminiDevProxyPlugin(env),
      cefrAssessPlugin(),
      aiWritingFeedbackPlugin(),
      ttsSynthesizePlugin(env),
    ],
  }
})
