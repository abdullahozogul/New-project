import { useCallback, useMemo } from 'react'
import { useProgressStore } from '../stores/useProgressStore'

const STREAK_KEY = 'colingual-streak-v1'

type StreakSnapshot = {
  streak: number
  lastActiveDate: string
  freezesLeft: number
}

function loadStreak(): StreakSnapshot {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (!raw) {
      return { streak: 0, lastActiveDate: '', freezesLeft: 1 }
    }
    return JSON.parse(raw) as StreakSnapshot
  } catch {
    return { streak: 0, lastActiveDate: '', freezesLeft: 1 }
  }
}

function saveStreak(snapshot: StreakSnapshot) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(snapshot))
}

function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

function yesterdayKey(): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - 1)
  return utcDateKey(date)
}

export function useStreak() {
  const progress = useProgressStore((state) => state.progress)

  const snapshot = useMemo(() => {
    const stored = loadStreak()
    if (stored.streak !== progress.streak) {
      return { ...stored, streak: progress.streak }
    }
    return stored
  }, [progress.streak])

  const markActiveToday = useCallback(() => {
    const today = utcDateKey()
    const stored = loadStreak()
    if (stored.lastActiveDate === today) {
      return stored.streak
    }

    let streak = stored.streak
    if (stored.lastActiveDate === yesterdayKey()) {
      streak += 1
    } else if (stored.lastActiveDate && stored.lastActiveDate !== today) {
      streak = 1
    } else {
      streak = Math.max(1, streak || 1)
    }

    const next = { ...stored, streak, lastActiveDate: today }
    saveStreak(next)
    useProgressStore.setState((state) => ({
      progress: { ...state.progress, streak },
    }))
    useProgressStore.getState().addXp({ type: 'streakBonus', streak })
    return streak
  }, [])

  const useFreeze = useCallback(() => {
    const stored = loadStreak()
    if (stored.freezesLeft <= 0) {
      return false
    }
    saveStreak({
      ...stored,
      freezesLeft: stored.freezesLeft - 1,
      lastActiveDate: utcDateKey(),
    })
    return true
  }, [])

  const atRisk =
    snapshot.lastActiveDate !== utcDateKey() &&
    snapshot.lastActiveDate !== yesterdayKey() &&
    snapshot.streak > 0

  return {
    streak: snapshot.streak,
    freezesLeft: snapshot.freezesLeft,
    markActiveToday,
    useFreeze,
    atRisk,
    milestones: [7, 30, 100, 365] as const,
  }
}
