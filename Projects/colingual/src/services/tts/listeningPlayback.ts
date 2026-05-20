import type { CEFRLevel } from '../../types'
import type { TTSProvider } from '../../types/tts'
import { splitTextIntoListeningChunks } from './listeningChunks'
import { synthesize } from './ttsService'
import { speakEnglishChunksWithBrowser } from '../../utils/speechSynthesisEnglish'

export async function playListeningSequence(
  text: string,
  language: string,
  options?: {
    cefrLevel?: CEFRLevel
    speed?: number
    playbackRate?: number
    onEnded?: () => void
    signal?: AbortSignal
  },
): Promise<TTSProvider | 'browser'> {
  const chunks = splitTextIntoListeningChunks(text)
  if (chunks.length === 0) {
    return 'browser'
  }

  let lastProvider: TTSProvider | 'browser' = 'browser'

  try {
    for (const chunk of chunks) {
      if (options?.signal?.aborted) {
        break
      }
      const result = await synthesize({
        text: chunk,
        language,
        useCase: 'listening_content',
        cefrLevel: options?.cefrLevel,
        speed: options?.speed,
      })
      lastProvider = result.provider
      const audio = new Audio(result.audioUrl)
      audio.playbackRate = options?.playbackRate ?? 1
      await audio.play()
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve()
        audio.onerror = () => reject(new Error('audio_playback_failed'))
      })
      URL.revokeObjectURL(result.audioUrl)
    }
    options?.onEnded?.()
    return lastProvider
  } catch {
    if (options?.signal?.aborted) {
      return 'browser'
    }
    await speakEnglishChunksWithBrowser(chunks, {
      rate: options?.playbackRate,
      onEnded: options?.onEnded,
      signal: options?.signal,
    })
    return 'browser'
  }
}
