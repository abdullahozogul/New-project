import type { TTSRequest } from '../../types/tts'
import type { CEFRLevel } from '../../types'
import { truncateForTts } from '../../utils/ttsUtils'

export const OPENAI_SPEED_BY_CEFR: Record<CEFRLevel, number> = {
  A1: 0.85,
  A2: 0.9,
  B1: 0.95,
  B2: 1,
  C1: 1.05,
  C2: 1.1,
}

export async function openaiTTSSynthesize(
  request: TTSRequest,
  apiKey: string,
): Promise<ArrayBuffer> {
  if (!apiKey) {
    throw new Error('openai_key_missing')
  }

  const speed =
    request.speed ??
    (request.cefrLevel ? OPENAI_SPEED_BY_CEFR[request.cefrLevel] : 1)
  const text = truncateForTts(request.text, request.useCase)

  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: request.voice ?? 'nova',
      speed,
      response_format: 'mp3',
    }),
  })

  if (!res.ok) {
    throw new Error(`OpenAI TTS: ${res.status}`)
  }

  return res.arrayBuffer()
}
