import type { TTSProvider, TTSRequest } from '../../types/tts'
import { elevenLabsSynthesize } from './elevenLabsProvider'
import { openaiTTSSynthesize } from './openaiTTSProvider'
import { prepareTtsRequest, type PreparedTtsRequest } from './ttsLanguage'

export async function serverSynthesize(
  request: TTSRequest | PreparedTtsRequest,
  elevenKey: string,
  openaiKey: string,
): Promise<{ buffer: ArrayBuffer; provider: TTSProvider }> {
  const prepared = 'profile' in request ? request : prepareTtsRequest(request)

  const tryEleven = async () => ({
    buffer: await elevenLabsSynthesize(prepared, elevenKey),
    provider: 'elevenlabs' as const,
  })
  const tryOpenai = async () => ({
    buffer: await openaiTTSSynthesize(prepared, openaiKey),
    provider: 'openai' as const,
  })

  const order =
    prepared.language === 'en'
      ? prepared.useCase === 'listening_content' || prepared.useCase === 'pronunciation'
        ? (['openai', 'elevenlabs'] as const)
        : (['openai', 'elevenlabs'] as const)
      : prepared.profile.preferProvider === 'elevenlabs'
        ? (['elevenlabs', 'openai'] as const)
        : (['openai', 'elevenlabs'] as const)

  let lastError: unknown
  for (const provider of order) {
    try {
      if (provider === 'elevenlabs' && elevenKey) {
        return await tryEleven()
      }
      if (provider === 'openai' && openaiKey) {
        return await tryOpenai()
      }
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('tts_synthesis_failed')
}
