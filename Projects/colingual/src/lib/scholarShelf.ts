/**
 * Personal reading shelf — inspired by ScholarShelf (AminaAsif9/ScholarShelf):
 * learners collect stories and vocabulary sources, then ask the coach about that shelf.
 */

export type ShelfItem = {
  storyKey: string
  title: string
  category: string
  savedAt: number
  sourceUrl?: string
  isLive?: boolean
  lastLevel?: string
}

const STORAGE_KEY = 'colingual-scholar-shelf-v1'

export function loadShelf(): ShelfItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as ShelfItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveShelf(items: ShelfItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function isOnShelf(storyKey: string): boolean {
  return loadShelf().some((item) => item.storyKey === storyKey)
}

export function addToShelf(item: Omit<ShelfItem, 'savedAt'>): ShelfItem[] {
  const current = loadShelf().filter((entry) => entry.storyKey !== item.storyKey)
  const next = [{ ...item, savedAt: Date.now() }, ...current].slice(0, 40)
  saveShelf(next)
  return next
}

export function removeFromShelf(storyKey: string): ShelfItem[] {
  const next = loadShelf().filter((item) => item.storyKey !== storyKey)
  saveShelf(next)
  return next
}

export function shelfSummaryForCoach(items: ShelfItem[]): string {
  if (items.length === 0) {
    return 'Öğrencinin kişisel rafı boş.'
  }
  const titles = items
    .slice(0, 6)
    .map((item) => item.title)
    .join('; ')
  return `ScholarShelf (${items.length} hikâye): ${titles}.`
}

/** SchoBot-style prompts from saved shelf titles (ScholarShelf). */
export function shelfCoachPrompts(items: ShelfItem[]): string[] {
  const latest = items[0]
  if (!latest) {
    return []
  }
  return [
    `"${latest.title}" hikâyesini iki cümleyle özetle ve dilimi düzelt.`,
    `Rafımdaki "${latest.title}" metninden üç önemli kelime seç ve örnek ver.`,
    items.length > 1 ?
      `Rafımdaki ${items.length} hikâyeyi karşılaştır — hangisi benim seviyeme daha uygun?`
    : `Bu haberde anlamadığım bir ifadeyi basitleştir.`,
  ]
}
