import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CEFRLevel } from '../types'

type UserState = {
  userId: string
  displayName: string
  targetLanguage: string
  nativeLanguage: string
  cefrLevel: CEFRLevel
  dailyGoalMinutes: number
  setProfile: (partial: Partial<Omit<UserState, 'setProfile'>>) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: 'local',
      displayName: 'Learner',
      targetLanguage: 'en',
      nativeLanguage: 'tr',
      cefrLevel: 'B1',
      dailyGoalMinutes: 15,
      setProfile: (partial) => set((state) => ({ ...state, ...partial })),
    }),
    { name: 'colingual-user-v1' },
  ),
)
