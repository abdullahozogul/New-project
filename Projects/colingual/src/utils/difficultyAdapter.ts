import type { CEFRLevel } from '../types'
import { nextCefrLevel } from './cefrUtils'

export type RecentAnswer = {
  correct: boolean
}

export function shouldSuggestLevelUp(
  recent: RecentAnswer[],
  threshold = 0.8,
  windowSize = 5,
): boolean {
  const slice = recent.slice(-windowSize)
  if (slice.length < windowSize) {
    return false
  }
  const correctCount = slice.filter((item) => item.correct).length
  return correctCount / slice.length >= threshold
}

export function proposedLevelAfterSuccess(current: CEFRLevel): CEFRLevel | null {
  return nextCefrLevel(current)
}
