import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SRSCard } from '../types'
import { cardsDueForReview, createCard, reviewCard, type SRSRating } from '../services/srsEngine'

type SRSState = {
  cards: SRSCard[]
  retentionHistory: { date: string; rate: number }[]
  addCard: (card: Omit<SRSCard, 'nextReview' | 'interval' | 'easeFactor' | 'repetitions'>) => void
  rateCard: (id: string, quality: SRSRating) => void
  dueCards: () => SRSCard[]
  recordRetention: (rate: number) => void
}

export const useSRSStore = create<SRSState>()(
  persist(
    (set, get) => ({
      cards: [],
      retentionHistory: [],

      addCard: (partial) => {
        set((state) => ({
          cards:
            state.cards.some((card) => card.id === partial.id) ?
              state.cards
            : [...state.cards, createCard(partial)],
        }))
      },

      rateCard: (id, quality) => {
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id ? reviewCard(card, quality) : card,
          ),
        }))
      },

      dueCards: () => cardsDueForReview(get().cards),

      recordRetention: (rate) => {
        const date = new Date().toISOString().slice(0, 10)
        set((state) => ({
          retentionHistory: [
            ...state.retentionHistory.filter((item) => item.date !== date),
            { date, rate },
          ].slice(-30),
        }))
      },
    }),
    { name: 'colingual-srs-v1' },
  ),
)
