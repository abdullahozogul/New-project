import type { SRSCard } from '../types'

const MIN_EASE = 1.3
const MAX_EASE = 2.5

export type SRSRating = 0 | 1 | 2 | 3 | 4 | 5

/** SM-2 style interval update (quality 0–5). */
export function reviewCard(card: SRSCard, quality: SRSRating): SRSCard {
  let { easeFactor, interval, repetitions } = card

  if (quality < 3) {
    repetitions = 0
    interval = 1
  } else {
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 3
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
    easeFactor = Math.min(
      MAX_EASE,
      Math.max(MIN_EASE, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))),
    )
  }

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReview: nextReview.toISOString(),
  }
}

export function cardsDueForReview(cards: SRSCard[], now = new Date()): SRSCard[] {
  const ts = now.getTime()
  return cards.filter((card) => new Date(card.nextReview).getTime() <= ts)
}

export function createCard(
  partial: Pick<SRSCard, 'id' | 'skill' | 'cefrLevel' | 'front' | 'back'>,
): SRSCard {
  return {
    ...partial,
    nextReview: new Date().toISOString(),
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
  }
}
