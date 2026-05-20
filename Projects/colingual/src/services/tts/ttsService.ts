import { apiFetch } from '../../lib/apiClient'
import type { CEFRLevel } from '../../types'
import type { TTSProvider, TTSRequest, TTSResponse, TTSUseCase } from '../../types/tts'
import { elevenLabsSynthesize } from './elevenLabsProvider'
import { openaiTTSSynthesize } from './openaiTTSProvider'
import { getCachedAudio, setCachedAudio } from './ttsCache'
import { cacheVoiceKey, prepareTtsRequest, type PreparedTtsRequest } from './ttsLanguage'

const USE_CASE_PROVIDER: Record<TTSUseCase, TTSProvider> = {
  listening_content: 'elevenlabs',
  pronunciation: 'elevenlabs',
  ui_feedback: 'openai',
  conversation: 'openai',
  word_definition: 'openai',
}

async function fetchSynthesizeFromDevApi(request: PreparedTtsRequest): Promise<ArrayBuffer> {
  const response = await apiFetch('/tts/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: request.text,
      language: request.language,
      useCase: request.useCase,
      cefrLevel: request.cefrLevel,
      voice: request.voice,
      speed: request.speed,
      streaming: request.streaming,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(detail || `tts_api_${response.status}`)
  }

  return response.arrayBuffer()
}

async function synthesizeWithProviders(
  request: PreparedTtsRequest,
  elevenKey: string,
  openaiKey: string,
): Promise<{ buffer: ArrayBuffer; provider: TTSProvider }> {
  const profileProvider = request.profile.preferProvider

  const tryEleven = () => elevenLabsSynthesize(request, elevenKey)
  const tryOpenai = () => openaiTTSSynthesize(request, openaiKey)

  const order: TTSProvider[] =
    request.language === 'en'
      ? request.useCase === 'listening_content' || request.useCase === 'pronunciation'
        ? ['openai', 'elevenlabs']
        : ['openai', 'elevenlabs']
      : profileProvider === 'elevenlabs'
        ? ['elevenlabs', 'openai']
        : ['openai', 'elevenlabs']

  let lastError: unknown
  for (const provider of order) {
    try {
      if (provider === 'elevenlabs' && elevenKey) {
        return { buffer: await tryEleven(), provider: 'elevenlabs' }
      }
      if (provider === 'openai' && openaiKey) {
        return { buffer: await tryOpenai(), provider: 'openai' }
      }
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('tts_synthesis_failed')
}

async function synthesizeBuffer(request: PreparedTtsRequest): Promise<{ buffer: ArrayBuffer; provider: TTSProvider }> {
  if (import.meta.env.DEV) {
    try {
      const buffer = await fetchSynthesizeFromDevApi(request)
      return { buffer, provider: USE_CASE_PROVIDER[request.useCase] }
    } catch {
      // fall through
    }
  }

  const elevenKey = import.meta.env.VITE_ELEVENLABS_API_KEY ?? ''
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY ?? ''

  if (!elevenKey && !openaiKey) {
    throw new Error('tts_not_configured')
  }

  return synthesizeWithProviders(request, elevenKey, openaiKey)
}

function hasClientTtsKeys(): boolean {
  return Boolean(
    import.meta.env.VITE_ELEVENLABS_API_KEY || import.meta.env.VITE_OPENAI_API_KEY,
  )
}

/** Dev proxy veya client VITE_* anahtarları — yoksa tarayıcı EN TTS. */
export function isCloudTtsConfigured(): boolean {
  return hasClientTtsKeys()
}

export async function isCloudTtsReachable(): Promise<boolean> {
  if (hasClientTtsKeys()) {
    return true
  }
  if (!import.meta.env.DEV) {
    return false
  }
  try {
    const response = await apiFetch('/tts/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hi',
        language: 'en',
        useCase: 'word_definition',
      }),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function synthesize(request: TTSRequest): Promise<TTSResponse> {
  const prepared = prepareTtsRequest(request)
  const voice = cacheVoiceKey(prepared)

  if (!prepared.streaming) {
    const cached = await getCachedAudio(prepared.text, prepared.language, voice, prepared.useCase)
    if (cached) {
      return {
        audioUrl: URL.createObjectURL(new Blob([cached], { type: 'audio/mpeg' })),
        provider: USE_CASE_PROVIDER[prepared.useCase],
        cached: true,
      }
    }
  }

  const { buffer, provider } = await synthesizeBuffer(prepared)

  if (!prepared.streaming) {
    await setCachedAudio(prepared.text, prepared.language, voice, prepared.useCase, buffer)
  }

  return {
    audioUrl: URL.createObjectURL(new Blob([buffer], { type: 'audio/mpeg' })),
    provider,
    cached: false,
  }
}

export const tts = {
  pronunciation: (text: string, language: string, cefrLevel?: CEFRLevel, speed?: number) =>
    synthesize({ text, language, useCase: 'pronunciation', cefrLevel, speed }),
  listening: (text: string, language: string, cefrLevel?: CEFRLevel, speed?: number) =>
    synthesize({ text, language, useCase: 'listening_content', cefrLevel, speed }),
  word: (word: string, language: string) =>
    synthesize({ text: word, language, useCase: 'word_definition' }),
  conversation: (text: string, language: string) =>
    synthesize({ text, language, useCase: 'conversation', streaming: true }),
  uiFeedback: (text: string, language: string) =>
    synthesize({ text, language, useCase: 'ui_feedback' }),
}

export { prepareTtsRequest, resolveTtsProfile } from './ttsLanguage'
