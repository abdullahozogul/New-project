import { useMemo } from 'react'
import type { LearningPathConfig, Skill } from '../types'
import { skillLabels } from '../constants/labels'
import { detectWeakestSkill, rollingAverageBySkill } from '../utils/weakSkillDetector'
import { useProgressStore } from '../stores/useProgressStore'
import { useUserStore } from '../stores/useUserStore'

export type DailyActivity = {
  skill: Skill
  label: string
  activities: number
  minutes: number
  reason: string
}

export function useLearningPath(config?: Partial<LearningPathConfig>) {
  const sessions = useProgressStore((state) => state.sessions)
  const progress = useProgressStore((state) => state.progress)
  const userId = useUserStore((state) => state.userId)
  const storedDailyGoalMinutes = useUserStore((state) => state.dailyGoalMinutes)
  const todayMinutes = config?.todayMinutes ?? storedDailyGoalMinutes
  const weakSkillWeight = config?.weakSkillWeight ?? 0.65

  const averages = useMemo(() => rollingAverageBySkill(sessions), [sessions])
  const weakSkill = useMemo(() => detectWeakestSkill(averages), [averages])

  const plan = useMemo((): DailyActivity[] => {
    const skills: Skill[] = ['reading', 'writing', 'listening', 'speaking']
    const sorted = [...skills].sort((a, b) => {
      if (a === weakSkill) {
        return -1
      }
      if (b === weakSkill) {
        return 1
      }
      return averages[a] - averages[b]
    })

    const weakShare = Math.round(todayMinutes * weakSkillWeight)
    const restShare = todayMinutes - weakShare
    const others = sorted.filter((skill) => skill !== weakSkill)

    return sorted.map((skill, index) => {
      const isWeak = skill === weakSkill
      const minutes =
        isWeak ?
          weakShare
        : Math.max(3, Math.round(restShare / Math.max(1, others.length)))
      const activities = isWeak ? 3 : index === 1 ? 2 : 1
      return {
        skill,
        label: skillLabels[skill],
        activities,
        minutes,
        reason:
          isWeak ?
            `Son oturumlarda ${skillLabels[skill].toLowerCase()} en çok gelişim istiyor.`
          : 'Denge için destek becerisi.',
      }
    })
  }, [averages, weakSkill, todayMinutes, weakSkillWeight])

  const nextUp = plan[0] ?? null

  return {
    userId: config?.userId ?? userId,
    weakSkill,
    averages,
    plan,
    nextUp,
    progress,
  }
}
