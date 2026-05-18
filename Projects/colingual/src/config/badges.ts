import type { Badge, UserProgress } from '../types'

export const BADGES: Badge[] = [
  {
    id: 'first-speak',
    name: 'İlk Kelam',
    description: 'İlk konuşma egzersizini tamamla',
    category: 'skill',
    icon: '🎤',
    condition: (p) => p.skills.speaking.totalSessions >= 1,
  },
  {
    id: 'first-read',
    name: 'İlk Okuma',
    description: 'İlk okuma oturumunu tamamla',
    category: 'skill',
    icon: '📖',
    condition: (p) => p.skills.reading.totalSessions >= 1,
  },
  {
    id: 'b1-reading',
    name: 'B1 Okuyucu',
    description: 'Okumada B1 seviyesine ulaş',
    category: 'cefr',
    icon: '📚',
    condition: (p) => ['B1', 'B2', 'C1', 'C2'].includes(p.skills.reading.level),
  },
  {
    id: 'streak-7',
    name: '7 Gün Ateşi',
    description: '7 günlük seri yakala',
    category: 'streak',
    icon: '🔥',
    condition: (p) => p.streak >= 7,
  },
  {
    id: 'streak-30',
    name: 'Ay Boyu',
    description: '30 günlük seri',
    category: 'streak',
    icon: '⭐',
    condition: (p) => p.streak >= 30,
  },
  {
    id: 'xp-500',
    name: '500 XP',
    description: 'Toplam 500 XP kazan',
    category: 'challenge',
    icon: '💎',
    condition: (p) => p.totalXP >= 500,
  },
  {
    id: 'writer-10',
    name: 'Kalem Ustası',
    description: '10 yazma oturumu',
    category: 'skill',
    icon: '✍️',
    condition: (p) => p.skills.writing.totalSessions >= 10,
  },
  {
    id: 'listener-10',
    name: 'Kulak Veren',
    description: '10 dinleme oturumu',
    category: 'skill',
    icon: '🎧',
    condition: (p) => p.skills.listening.totalSessions >= 10,
  },
]

export function earnedBadgeIds(progress: UserProgress): string[] {
  return BADGES.filter((badge) => badge.condition(progress)).map((badge) => badge.id)
}
