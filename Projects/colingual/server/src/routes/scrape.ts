import { Router, type Request, type Response } from 'express'
import { fetchRSSTexts } from '../services/rssService'
import { fetchWikipediaText } from '../services/wikipediaService'
import type { CEFRLevel } from '../types'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'colingual-scrape' })
})

router.get('/news', async (req: Request, res: Response) => {
  try {
    const { language = 'en', cefrLevel, count = '3' } = req.query as Record<string, string>
    const texts = await fetchRSSTexts(language, cefrLevel as CEFRLevel | undefined, parseInt(count, 10) || 3)
    res.json({ success: true, data: texts })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[/api/scrape/news]', message)
    res.status(500).json({ success: false, error: message })
  }
})

router.get('/wikipedia', async (req: Request, res: Response) => {
  try {
    const { language = 'en', cefrLevel = 'B1', topic } = req.query as Record<string, string>
    const text = await fetchWikipediaText(language, cefrLevel as CEFRLevel, topic)
    res.json({ success: true, data: text })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[/api/scrape/wikipedia]', message)
    res.status(500).json({ success: false, error: message })
  }
})

router.get('/text', async (req: Request, res: Response) => {
  try {
    const { language = 'en', cefrLevel = 'B1', source = 'rss', topic } = req.query as Record<string, string>

    let data
    if (source === 'wikipedia') {
      data = await fetchWikipediaText(language, cefrLevel as CEFRLevel, topic)
    } else {
      try {
        const results = await fetchRSSTexts(language, cefrLevel as CEFRLevel, 1)
        data = results[0]
      } catch (rssError) {
        console.warn('[/api/scrape/text] RSS failed, trying Wikipedia:', rssError)
        data = await fetchWikipediaText(language, cefrLevel as CEFRLevel, topic)
      }
      if (!data) {
        throw new Error('Metin bulunamadı')
      }
    }

    res.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[/api/scrape/text]', message)
    res.status(500).json({ success: false, error: message })
  }
})

export default router
