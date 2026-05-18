import type { Level } from '../data'

/**
 * Context-specific dialogue lessons — inspired by brylie/language-lesson-chat
 * (scenario + CEFR level + key concepts, persistent coach memory).
 */
export type LessonScenario = {
  id: string
  title: string
  setting: string
  minLevel: Level
  imageTone: 'mint' | 'coral' | 'blue' | 'gold' | 'violet'
  intro: string
  keyConcepts: string[]
}

export const lessonScenarios: LessonScenario[] = [
  {
    id: 'cafe-order',
    title: 'Kafede sipariş',
    setting: 'A busy café in the city centre. You are ordering food and drinks.',
    minLevel: 'A1',
    imageTone: 'coral',
    intro: 'Practice polite requests, menu vocabulary, and paying at the counter.',
    keyConcepts: ['would like', 'please', 'bill', 'table for two'],
  },
  {
    id: 'airport-checkin',
    title: 'Havalimanı check-in',
    setting: 'International airport departure desk. You need to check in and ask about your gate.',
    minLevel: 'A2',
    imageTone: 'blue',
    intro: 'Use travel phrases for luggage, boarding pass, and delays.',
    keyConcepts: ['boarding pass', 'gate', 'carry-on', 'delayed'],
  },
  {
    id: 'job-interview',
    title: 'İş görüşmesi',
    setting: 'A short video call with a hiring manager for an entry-level role.',
    minLevel: 'B1',
    imageTone: 'violet',
    intro: 'Describe experience, strengths, and ask one question about the team.',
    keyConcepts: ['responsible for', 'strength', 'deadline', 'collaborate'],
  },
  {
    id: 'news-debate',
    title: 'Haber tartışması',
    setting: 'You discuss today’s headline with a friend and give your opinion.',
    minLevel: 'B2',
    imageTone: 'gold',
    intro: 'Summarise the story, compare viewpoints, and use linking words.',
    keyConcepts: ['however', 'according to', 'in my view', 'implications'],
  },
]

export function getScenarioById(id: string | null): LessonScenario | null {
  if (!id) {
    return null
  }
  return lessonScenarios.find((scenario) => scenario.id === id) ?? null
}
