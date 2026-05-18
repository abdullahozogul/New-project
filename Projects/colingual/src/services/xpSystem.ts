export const XP_RULES = {
  completeExercise: 10,
  correctAnswer: 5,
  perfectSession: 50,
  streakBonus: (streak: number) => Math.min(streak * 2, 50),
  cefrLevelUp: 500,
  dailyGoalReached: 30,
} as const

export const XP_PER_LEVEL = 200

export function xpForLevel(levelIndex: number): number {
  return XP_PER_LEVEL * levelIndex
}

export function levelFromTotalXp(totalXP: number): number {
  return Math.floor(totalXP / XP_PER_LEVEL) + 1
}

export function xpProgressInLevel(totalXP: number): {
  level: number
  current: number
  max: number
  percentage: number
} {
  const level = levelFromTotalXp(totalXP)
  const floor = (level - 1) * XP_PER_LEVEL
  const current = totalXP - floor
  const max = XP_PER_LEVEL
  return {
    level,
    current,
    max,
    percentage: Math.min(100, Math.round((current / max) * 100)),
  }
}

export type XPEvent =
  | { type: 'completeExercise' }
  | { type: 'correctAnswer'; count?: number }
  | { type: 'perfectSession' }
  | { type: 'streakBonus'; streak: number }
  | { type: 'cefrLevelUp' }
  | { type: 'dailyGoalReached' }

export function computeXpGain(event: XPEvent): number {
  switch (event.type) {
    case 'completeExercise':
      return XP_RULES.completeExercise
    case 'correctAnswer':
      return XP_RULES.correctAnswer * (event.count ?? 1)
    case 'perfectSession':
      return XP_RULES.perfectSession
    case 'streakBonus':
      return XP_RULES.streakBonus(event.streak)
    case 'cefrLevelUp':
      return XP_RULES.cefrLevelUp
    case 'dailyGoalReached':
      return XP_RULES.dailyGoalReached
    default:
      return 0
  }
}
