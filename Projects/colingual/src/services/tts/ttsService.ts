import type { CEFRLevel } from '../../types'
import type { TTSProvider, TTSRequest, TTSResponse, TTSUseCase } from '../../types/tts'
import { elevenLabsSynthesize } from './elevenLabsProvider'
import { openaiTTSSynthesize } from './openaiTTSProvider'
import { getCachedAudio, setCachedAudio } from './ttsCache'

const PROVIDER_RULES: Record<TTSUseCase, TTSProvider> = {
  listening_content: 'elevenlabs',
  pronunciation: 'elevenlabs',
  ui_feedback: 'openai',
  conversation: 'openai',
  word_definition: 'openai',
}

function voiceKey(request: TTSRequest): string {
  return request.voice ?? request.language
}

function ttsProxyEndpoint(): string {
  return import.meta.env.VITE_TTS_ENDPOINT?.trim() || (import.meta.env.DEV ? '/api/tts/synthesize' : '')
}

async function fetchSynthesizeFromProxy(endpoint: string, request: TTSRequest): Promise<ArrayBuffer> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(detail || `tts_api_${response.status}`)
  }

  return response.arrayBuffer()
}

async function synthesizeWithProviders(
  request: TTSRequest,
  elevenKey: string,
  openaiKey: string,
): Promise<{ buffer: ArrayBuffer; provider: TTSProvider }> {
  const preferred = PROVIDER_RULES[request.useCase]

  const tryEleven = () => elevenLabsSynthesize(request, elevenKey)
  const tryOpenai = () => openaiTTSSynthesize(request, openaiKey)

  try {
    if (preferred === 'elevenlabs' && elevenKey) {
      return { buffer: await tryEleven(), provider: 'elevenlabs' }
    }
    if (openaiKey) {
      return { buffer: await tryOpenai(), provider: 'openai' }
    }
    if (elevenKey) {
      return { buffer: await tryEleven(), provider: 'elevenlabs' }
    }
    throw new Error('tts_no_provider_key')
  } catch {
    if (preferred === 'elevenlabs' && openaiKey) {
      return { buffer: await tryOpenai(), provider: 'openai' }
    }
    if (elevenKey) {
      return { buffer: await tryEleven(), provider: 'elevenlabs' }
    }
    throw new Error('tts_synthesis_failed')
  }
}

async function synthesizeBuffer(request: TTSRequest): Promise<{ buffer: ArrayBuffer; provider: TTSProvider }> {
  const proxyEndpoint = ttsProxyEndpoint()
  if (proxyEndpoint) {
    try {
      const buffer = await fetchSynthesizeFromProxy(proxyEndpoint, request)
      return { buffer, provider: PROVIDER_RULES[request.useCase] }
    } catch {
      if (!import.meta.env.DEV) {
        throw new Error('tts_proxy_failed')
      }
      // In dev only, fall through to direct provider keys for local testing.
    }
  }

  const elevenKey = import.meta.env.DEV ? (import.meta.env.VITE_ELEVENLABS_API_KEY ?? '') : ''
  const openaiKey = import.meta.env.DEV ? (import.meta.env.VITE_OPENAI_API_KEY ?? '') : ''

  if (!elevenKey && !openaiKey) {
    throw new Error('tts_not_configured')
  }

  return synthesizeWithProviders(request, elevenKey, openaiKey)
}

function hasClientTtsKeys(): boolean {
  return Boolean(
    import.meta.env.DEV &&
      (import.meta.env.VITE_ELEVENLABS_API_KEY || import.meta.env.VITE_OPENAI_API_KEY),
  )
}

export function isCloudTtsConfigured(): boolean {
  return Boolean(ttsProxyEndpoint() || hasClientTtsKeys())
}

export async function synthesize(request: TTSRequest): Promise<TTSResponse> {
  const voice = voiceKey(request)

  if (!request.streaming) {
    const cached = await getCachedAudio(request.text, request.language, voice, request.useCase)
    if (cached) {
      return {
        audioUrl: URL.createObjectURL(new Blob([cached], { type: 'audio/mpeg' })),
        provider: PROVIDER_RULES[request.useCase],
        cached: true,
      }
    }
  }

  const { buffer, provider } = await synthesizeBuffer(request)

  if (!request.streaming) {
    await setCachedAudio(request.text, request.language, voice, request.useCase, buffer)
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
