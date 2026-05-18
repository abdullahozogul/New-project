import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CEFRLevel, SessionRecord, Skill, UserProgress } from '../types'
import { SKILLS } from '../types'
import { earnedBadgeIds } from '../config/badges'
import { computeXpGain, type XPEvent } from '../services/xpSystem'

function defaultSkill(skill: Skill, level: CEFRLevel = 'A1'): UserProgress['skills'][Skill] {
  const now = new Date().toISOString()
  return {
    skill,
    level,
    percentage: skill === 'reading' ? 24 : 12,
    totalSessions: 0,
    lastPracticed: now,
  }
}

function createDefaultProgress(userId = 'local'): UserProgress {
  return {
    userId,
    currentLevel: 'A1',
    skills: {
      reading: defaultSkill('reading', 'A1'),
      writing: defaultSkill('writing', 'A1'),
      listening: defaultSkill('listening', 'A1'),
      speaking: defaultSkill('speaking', 'A1'),
    },
    streak: 0,
    totalXP: 0,
  }
}

type ProgressState = {
  progress: UserProgress
  sessions: SessionRecord[]
  earnedBadges: string[]
  recentAnswers: { correct: boolean }[]
  recordSession: (skill: Skill, score?: number) => void
  addXp: (event: XPEvent) => void
  bumpSkillProgress: (skill: Skill, delta: number) => void
  setCurrentLevel: (level: CEFRLevel) => void
  pushAnswer: (correct: boolean) => void
  syncFromSignals: (signals: {
    savedWordCount: number
    coachUsed: boolean
    shelfCount: number
    hasLiveStory: boolean
  }) => void
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: createDefaultProgress(),
      sessions: [],
      earnedBadges: [],
      recentAnswers: [],

      recordSession: (skill, score = 70) => {
        const at = new Date().toISOString()
        set((state) => {
          const skillProgress = state.progress.skills[skill]
          const nextSkills = {
            ...state.progress.skills,
            [skill]: {
              ...skillProgress,
              totalSessions: skillProgress.totalSessions + 1,
              lastPracticed: at,
              percentage: Math.min(100, skillProgress.percentage + 4),
            },
          }
          const progress = { ...state.progress, skills: nextSkills }
          return {
            progress,
            sessions: [...state.sessions, { skill, score, at }].slice(-200),
            earnedBadges: earnedBadgeIds(progress),
          }
        })
        get().addXp({ type: 'completeExercise' })
      },

      addXp: (event) => {
        set((state) => {
          const progress = {
            ...state.progress,
            totalXP: state.progress.totalXP + computeXpGain(event),
          }
          return {
            progress,
            earnedBadges: earnedBadgeIds(progress),
          }
        })
      },

      bumpSkillProgress: (skill, delta) => {
        set((state) => {
          const current = state.progress.skills[skill]
          const progress = {
            ...state.progress,
            skills: {
              ...state.progress.skills,
              [skill]: {
                ...current,
                percentage: Math.min(100, Math.max(0, current.percentage + delta)),
              },
            },
          }
          return { progress, earnedBadges: earnedBadgeIds(progress) }
        })
      },

      setCurrentLevel: (level) => {
        set((state) => {
          const progress = { ...state.progress, currentLevel: level }
          for (const skill of SKILLS) {
            if (progress.skills[skill].level !== level) {
              progress.skills[skill] = { ...progress.skills[skill], level }
            }
          }
          return { progress, earnedBadges: earnedBadgeIds(progress) }
        })
      },

      pushAnswer: (correct) => {
        set((state) => ({
          recentAnswers: [...state.recentAnswers, { correct }].slice(-20),
        }))
        if (correct) {
          get().addXp({ type: 'correctAnswer' })
        }
      },

      syncFromSignals: (signals) => {
        set((state) => {
          const readingPct = Math.min(
            100,
            20 + signals.savedWordCount * 2 + signals.shelfCount * 5,
          )
          const writingPct = signals.coachUsed ? 48 : state.progress.skills.writing.percentage
          const listeningPct = signals.hasLiveStory ? 42 : state.progress.skills.listening.percentage
          const progress: UserProgress = {
            ...state.progress,
            skills: {
              ...state.progress.skills,
              reading: {
                ...state.progress.skills.reading,
                percentage: Math.max(state.progress.skills.reading.percentage, readingPct),
              },
              writing: {
                ...state.progress.skills.writing,
                percentage: Math.max(state.progress.skills.writing.percentage, writingPct),
              },
              listening: {
                ...state.progress.skills.listening,
                percentage: Math.max(state.progress.skills.listening.percentage, listeningPct),
              },
            },
          }
          return { progress, earnedBadges: earnedBadgeIds(progress) }
        })
      },
    }),
    { name: 'colingual-progress-v1' },
  ),
)
