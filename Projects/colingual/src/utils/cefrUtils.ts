import type { CEFRLevel } from '../types'
import { CEFR_LEVELS } from '../types'
import type { Level } from '../data'

const LEVEL_RANK: Record<CEFRLevel, number> = {
  A1: 0,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 5,
}

export function cefrRank(level: CEFRLevel): number {
  return LEVEL_RANK[level]
}

export function compareCefr(a: CEFRLevel, b: CEFRLevel): number {
  return cefrRank(a) - cefrRank(b)
}

export function isLevelUnlocked(target: CEFRLevel, current: CEFRLevel): boolean {
  return cefrRank(target) <= cefrRank(current)
}

export function nextCefrLevel(level: CEFRLevel): CEFRLevel | null {
  const index = CEFR_LEVELS.indexOf(level)
  if (index < 0 || index >= CEFR_LEVELS.length - 1) {
    return null
  }
  return CEFR_LEVELS[index + 1]
}

export function levelFromAppLevel(level: Level): CEFRLevel {
  return level
}

export function readingTypographyForLevel(level: CEFRLevel): {
  fontSize: string
  lineHeight: number
} {
  const rank = cefrRank(level)
  if (rank <= 1) {
    return { fontSize: '1.125rem', lineHeight: 1.75 }
  }
  if (rank <= 3) {
    return { fontSize: '1.05rem', lineHeight: 1.65 }
  }
  return { fontSize: '1rem', lineHeight: 1.55 }
}
