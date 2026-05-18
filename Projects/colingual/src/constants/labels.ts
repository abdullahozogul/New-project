import type { CEFRLevel, Skill } from '../types'

export const skillLabels: Record<Skill, string> = {
  reading: 'Okuma',
  writing: 'Yazma',
  listening: 'Dinleme',
  speaking: 'Konuşma',
}

export const skillLabelsEn: Record<Skill, string> = {
  reading: 'Reading',
  writing: 'Writing',
  listening: 'Listening',
  speaking: 'Speaking',
}

export const cefrLevelLabels: Record<CEFRLevel, string> = {
  A1: 'A1',
  A2: 'A2',
  B1: 'B1',
  B2: 'B2',
  C1: 'C1',
  C2: 'C2',
}

export function t(key: string): string {
  const table: Record<string, string> = {
    'dashboard.title': 'CEFR yolculuğun',
    'dashboard.subtitle': 'Dört beceri · A1 → C2',
    'dailyPlan.title': 'Bugünkü planın',
    'dailyPlan.next': 'Sıradaki aktivite',
    'xp.level': 'Seviye',
    'streak.days': 'gün seri',
    'missions.title': 'Günlük görevler',
    'badges.title': 'Rozetler',
    'review.pending': 'kart bekliyor',
  }
  return table[key] ?? key
}
