import type { TTSRequest } from '../../types/tts'
import type { CEFRLevel } from '../../types'
import { truncateForTts } from '../../utils/ttsUtils'

export const ELEVENLABS_SPEED_BY_CEFR: Record<CEFRLevel, number> = {
  A1: 0.8,
  A2: 0.85,
  B1: 0.9,
  B2: 0.95,
  C1: 1,
  C2: 1,
}

export const ELEVENLABS_VOICE_MAP: Record<string, string> = {
  en: 'pNInz6obpgDQGcFmaJgB',
  en_female: 'EXAVITQu4vr4xnSDxMaL',
  de: 'VR6AewLTigWG4xSOukaG',
  fr: 'MF3mGyEYCl7XYWbV9V6O',
  es: 'GBv7mTt0atIp3Br8iCZE',
  tr: 'pNInz6obpgDQGcFmaJgB',
}

export async function elevenLabsSynthesize(
  request: TTSRequest,
  apiKey: string,
): Promise<ArrayBuffer> {
  if (!apiKey) {
    throw new Error('elevenlabs_key_missing')
  }

  const voiceId =
    request.voice ?? ELEVENLABS_VOICE_MAP[request.language] ?? ELEVENLABS_VOICE_MAP.en
  const text = truncateForTts(request.text, request.useCase)
  const endpoint = request.streaming
    ? `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`
    : `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.8,
        style: 0.2,
        use_speaker_boost: true,
      },
    }),
  })

  if (!res.ok) {
    throw new Error(`ElevenLabs: ${res.status}`)
  }

  return res.arrayBuffer()
}
