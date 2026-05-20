import type { TTSProvider, TTSRequest } from '../../types/tts'

export type OpenAiTtsVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'

export type TtsLanguageProfile = {
  language: string
  /** ISO 639-1 for ElevenLabs / detection */
  languageCode: string
  /** BCP-47 for Web Speech API */
  speechLocale: string
  elevenLabsVoiceId: string
  openaiVoice: OpenAiTtsVoice
  /** Primary cloud provider for this language */
  preferProvider: TTSProvider
}

const ENGLISH_PROFILE: TtsLanguageProfile = {
  language: 'en',
  languageCode: 'en',
  speechLocale: 'en-US',
  /** ElevenLabs Adam — native English */
  elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
  /** OpenAI — clear English (listening önceliği) */
  openaiVoice: 'alloy',
  preferProvider: 'openai',
}

const PROFILES: Record<string, TtsLanguageProfile> = {
  en: ENGLISH_PROFILE,
  tr: {
    language: 'tr',
    languageCode: 'tr',
    speechLocale: 'tr-TR',
    elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
    openaiVoice: 'nova',
    preferProvider: 'openai',
  },
  es: {
    language: 'es',
    languageCode: 'es',
    speechLocale: 'es-ES',
    elevenLabsVoiceId: 'GBv7mTt0atIp3Br8iCZE',
    openaiVoice: 'nova',
    preferProvider: 'elevenlabs',
  },
  fr: {
    language: 'fr',
    languageCode: 'fr',
    speechLocale: 'fr-FR',
    elevenLabsVoiceId: 'MF3mGyEYCl7XYWbV9V6O',
    openaiVoice: 'nova',
    preferProvider: 'elevenlabs',
  },
  de: {
    language: 'de',
    languageCode: 'de',
    speechLocale: 'de-DE',
    elevenLabsVoiceId: 'VR6AewLTigWG4xSOukaG',
    openaiVoice: 'nova',
    preferProvider: 'elevenlabs',
  },
  it: {
    language: 'it',
    languageCode: 'it',
    speechLocale: 'it-IT',
    elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
    openaiVoice: 'nova',
    preferProvider: 'elevenlabs',
  },
  ja: {
    language: 'ja',
    languageCode: 'ja',
    speechLocale: 'ja-JP',
    elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
    openaiVoice: 'shimmer',
    preferProvider: 'openai',
  },
}

export function normalizeLanguageCode(language?: string): string {
  if (!language) {
    return 'en'
  }
  const base = language.split('-')[0]?.toLowerCase()
  return base || 'en'
}

/** Heuristic: Latin-script English learning content (articles, news). */
export function isPredominantlyEnglish(text: string): boolean {
  const sample = text.slice(0, 1200)
  const latin = (sample.match(/[A-Za-z]/g) ?? []).length
  const turkishChars = (sample.match(/[çğıöşüÇĞİÖŞÜ]/g) ?? []).length
  const letters = latin + turkishChars
  if (letters < 12) {
    return true
  }
  return latin / letters > 0.88 && turkishChars / letters < 0.08
}

export function resolveTtsProfile(language: string, text?: string): TtsLanguageProfile {
  const code = normalizeLanguageCode(language)
  if (code === 'en' || (text && isPredominantlyEnglish(text))) {
    return ENGLISH_PROFILE
  }
  return PROFILES[code] ?? ENGLISH_PROFILE
}

export type PreparedTtsRequest = TTSRequest & {
  profile: TtsLanguageProfile
}

export function prepareTtsRequest(request: TTSRequest): PreparedTtsRequest {
  const profile = resolveTtsProfile(request.language, request.text)
  return {
    ...request,
    language: profile.language,
    profile,
  }
}

export function cacheVoiceKey(request: PreparedTtsRequest): string {
  if (request.voice) {
    return request.voice
  }
  return `${request.profile.language}:${request.profile.elevenLabsVoiceId}`
}
