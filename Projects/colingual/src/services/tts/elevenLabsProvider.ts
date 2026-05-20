import type { PreparedTtsRequest } from './ttsLanguage'
import { truncateForTts } from '../../utils/ttsUtils'

export async function elevenLabsSynthesize(
  request: PreparedTtsRequest,
  apiKey: string,
): Promise<ArrayBuffer> {
  if (!apiKey) {
    throw new Error('elevenlabs_key_missing')
  }

  const { profile } = request
  const voiceId = request.voice ?? profile.elevenLabsVoiceId
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
      language_code: profile.languageCode,
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
