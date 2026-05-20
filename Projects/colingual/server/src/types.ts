export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface ScrapedText {
  id: string
  title: string
  body: string
  source: string
  url: string
  language: string
  publishedAt: string
  wordCount: number
  estimatedCEFR: CEFRLevel
  imageUrl?: string
}
