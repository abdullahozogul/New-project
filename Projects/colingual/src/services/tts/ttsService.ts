import type { CEFRLevel } from '../../types'
import type { TTSProvider, TTSRequest, TTSResponse, TTSUseCase } from '../../types/tts'
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

function cloudTtsEndpoint(): string | null {
  const configured = import.meta.env.VITE_TTS_ENDPOINT?.trim()
  if (configured) {
    return configured
  }

  return import.meta.env.DEV ? '/api/tts/synthesize' : null
}

async function fetchSynthesizeFromEndpoint(
  endpoint: string,
  request: TTSRequest,
): Promise<ArrayBuffer> {
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

async function synthesizeBuffer(request: TTSRequest): Promise<{ buffer: ArrayBuffer; provider: TTSProvider }> {
  const endpoint = cloudTtsEndpoint()
  if (!endpoint) {
    throw new Error('tts_not_configured')
  }

  return {
    buffer: await fetchSynthesizeFromEndpoint(endpoint, request),
    provider: PROVIDER_RULES[request.useCase],
  }
}

export function isCloudTtsConfigured(): boolean {
  return Boolean(cloudTtsEndpoint())
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
