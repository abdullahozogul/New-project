import type { ScrapeCefrLevel } from './types'

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

export function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function estimateCEFR(text: string): ScrapeCefrLevel {
  const words = wordCount(text)
  if (words < 80) return 'A2'

  const avgWordLength = text.replace(/\s/g, '').length / words
  const sentenceCount = Math.max(1, text.split(/[.!?]+/).filter((s) => s.trim()).length)
  const avgSentenceLength = words / sentenceCount

  if (avgWordLength < 4.5 && avgSentenceLength < 10) return 'A2'
  if (avgWordLength < 5.0 && avgSentenceLength < 15) return 'B1'
  if (avgWordLength < 5.5 && avgSentenceLength < 20) return 'B2'
  if (avgWordLength < 6.0 && avgSentenceLength < 25) return 'C1'
  return 'C2'
}

export function hashId(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
