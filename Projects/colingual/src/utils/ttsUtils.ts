import type { TTSUseCase } from '../types/tts'

const MAX_TEXT_BY_USE_CASE: Record<TTSUseCase, number> = {
  listening_content: 4000,
  pronunciation: 800,
  ui_feedback: 300,
  conversation: 2000,
  word_definition: 120,
}

export function localeToLanguage(locale?: string): string {
  if (!locale) {
    return 'en'
  }
  const base = locale.split('-')[0]?.toLowerCase()
  return base || 'en'
}

export function truncateForTts(text: string, useCase: TTSUseCase): string {
  const trimmed = text.trim()
  const max = MAX_TEXT_BY_USE_CASE[useCase]
  if (trimmed.length <= max) {
    return trimmed
  }
  return `${trimmed.slice(0, max - 1)}…`
}
