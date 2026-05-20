import type { Level } from '../../data'

export type ScrapeCefrLevel = Level | 'C2'

export interface ScrapedText {
  id: string
  title: string
  body: string
  source: string
  url: string
  language: string
  publishedAt: string
  wordCount: number
  estimatedCEFR: ScrapeCefrLevel
  imageUrl?: string
}
