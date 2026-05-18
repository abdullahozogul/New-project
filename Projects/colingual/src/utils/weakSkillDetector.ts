import type { SessionRecord, Skill } from '../types'
import { SKILLS } from '../types'

const DAY_MS = 86_400_000

export function rollingAverageBySkill(
  sessions: SessionRecord[],
  windowDays = 7,
): Record<Skill, number> {
  const cutoff = Date.now() - windowDays * DAY_MS
  const totals: Record<Skill, { sum: number; count: number }> = {
    reading: { sum: 0, count: 0 },
    writing: { sum: 0, count: 0 },
    listening: { sum: 0, count: 0 },
    speaking: { sum: 0, count: 0 },
  }

  for (const session of sessions) {
    const at = new Date(session.at).getTime()
    if (at < cutoff) {
      continue
    }
    totals[session.skill].sum += session.score
    totals[session.skill].count += 1
  }

  const averages = {} as Record<Skill, number>
  for (const skill of SKILLS) {
    const bucket = totals[skill]
    averages[skill] = bucket.count > 0 ? bucket.sum / bucket.count : 50
  }
  return averages
}

export function detectWeakestSkill(averages: Record<Skill, number>): Skill {
  let weakest: Skill = 'speaking'
  let lowest = Infinity
  for (const skill of SKILLS) {
    if (averages[skill] < lowest) {
      lowest = averages[skill]
      weakest = skill
    }
  }
  return weakest
}
