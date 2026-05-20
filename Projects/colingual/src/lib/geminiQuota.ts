const STORAGE_KEY = 'colingual.geminiQuotaUntil'

/** After 429, skip Gemini CEFR calls until cooldown ends. */
const COOLDOWN_MS = 30 * 60 * 1000

export function markGeminiQuotaExceeded(): void {
  if (typeof sessionStorage === 'undefined') {
    return
  }
  sessionStorage.setItem(STORAGE_KEY, String(Date.now() + COOLDOWN_MS))
}

export function isGeminiQuotaBlocked(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false
  }
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return false
  }
  const until = Number(raw)
  if (!Number.isFinite(until) || Date.now() >= until) {
    sessionStorage.removeItem(STORAGE_KEY)
    return false
  }
  return true
}

export function geminiQuotaUserMessage(): string {
  return 'Gemini API kotası doldu (429). Orijinal haber metni gösteriliyor — Google AI Studio’da kotanızı kontrol edin.'
}

export function isGeminiQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes('429') ||
    message.includes('quota') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('Too Many Requests')
  )
}
