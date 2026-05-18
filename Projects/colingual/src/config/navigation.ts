import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  LayoutDashboard,
  MoreHorizontal,
  MessageSquareText,
  Trophy,
} from 'lucide-react'

/** Primary app sections (LingQ / Beelinguapp–style). */
export type AppView = 'home' | 'read' | 'practice' | 'progress' | 'more'

export type NavItem = {
  view: AppView
  hash: string
  label: string
  icon: LucideIcon
  /** Shown in sidebar secondary group */
  secondary?: boolean
}

export const PRIMARY_NAV: NavItem[] = [
  { view: 'home', hash: '#home', label: 'Ana sayfa', icon: LayoutDashboard },
  { view: 'read', hash: '#read', label: 'Oku', icon: BookOpen },
  { view: 'practice', hash: '#practice', label: 'Pratik', icon: MessageSquareText },
  { view: 'progress', hash: '#progress', label: 'İlerleme', icon: Trophy },
  { view: 'more', hash: '#more', label: 'Daha fazla', icon: MoreHorizontal },
]

const HASH_ALIASES: Record<string, AppView> = {
  '#home': 'home',
  '#dashboard': 'home',
  '#read': 'read',
  '#reading': 'read',
  '#practice': 'practice',
  '#vocabulary': 'practice',
  '#chat': 'practice',
  '#progress': 'progress',
  '#learning-path': 'progress',
  '#more': 'more',
  '#library': 'more',
  '#community': 'more',
  '#pricing': 'more',
  '#profile': 'more',
}

/** Deep links within a view — not rewritten to the primary tab hash. */
export const DEEP_LINK_HASHES = new Set([
  '#library',
  '#community',
  '#pricing',
  '#learning-path',
  '#scenarios',
  '#study-material',
  '#course-ai',
  '#ecosystem',
  '#skills',
])

export function resolveAppView(hash: string): AppView {
  return HASH_ALIASES[hash] ?? 'home'
}

export function hashForView(view: AppView): string {
  return PRIMARY_NAV.find((item) => item.view === view)?.hash ?? '#home'
}

export const VIEW_TITLES: Record<AppView, { eyebrow: string; title: string; lead?: string }> = {
  home: {
    eyebrow: 'Günlük plan',
    title: 'Bugün ne okuyalım?',
    lead: 'Canlı haberler ve seviye uyumlu metinlerle devam edin.',
  },
  read: {
    eyebrow: 'Okuma masası',
    title: 'Haber oku',
    lead: 'Soldan hikâyeyi seçin; üstten aynı metnin CEFR seviyesini değiştirin.',
  },
  practice: {
    eyebrow: 'Pratik',
    title: 'Kelimeler ve koç',
    lead: 'Kaydettiğiniz kelimeleri tekrarlayın, okuduğunuz metin hakkında yazın.',
  },
  progress: {
    eyebrow: 'Yolculuk',
    title: 'İlerleme ve müfredat',
    lead: 'Seri, modüller ve ünite ilerlemeniz.',
  },
  more: {
    eyebrow: 'Keşfet',
    title: 'Kütüphane ve topluluk',
    lead: 'ScholarShelf rafı, sorular, premium ve iletişim.',
  },
}
