import type { TTSRequest } from '../../types/tts'
import type { TTSProvider, TTSUseCase } from '../../types/tts'
import { elevenLabsSynthesize } from './elevenLabsProvider'
import { openaiTTSSynthesize } from './openaiTTSProvider'

const PROVIDER_RULES: Record<TTSUseCase, TTSProvider> = {
  listening_content: 'elevenlabs',
  pronunciation: 'elevenlabs',
  ui_feedback: 'openai',
  conversation: 'openai',
  word_definition: 'openai',
}

export async function serverSynthesize(
  request: TTSRequest,
  elevenKey: string,
  openaiKey: string,
): Promise<{ buffer: ArrayBuffer; provider: TTSProvider }> {
  const preferred = PROVIDER_RULES[request.useCase]

  const run = async (provider: TTSProvider) => {
    if (provider === 'elevenlabs') {
      return { buffer: await elevenLabsSynthesize(request, elevenKey), provider }
    }
    return { buffer: await openaiTTSSynthesize(request, openaiKey), provider }
  }

  try {
    if (preferred === 'elevenlabs' && elevenKey) {
      return await run('elevenlabs')
    }
    if (openaiKey) {
      return await run('openai')
    }
    if (elevenKey) {
      return await run('elevenlabs')
    }
    throw new Error('tts_no_provider_key')
  } catch {
    const fallback: TTSProvider = preferred === 'elevenlabs' ? 'openai' : 'elevenlabs'
    if (fallback === 'openai' && openaiKey) {
      return await run('openai')
    }
    if (elevenKey) {
      return await run('elevenlabs')
    }
    throw new Error('tts_synthesis_failed')
  }
}
