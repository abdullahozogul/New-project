import { useCallback, useEffect, useRef, useState } from 'react'
import { synthesize } from '../services/tts/ttsService'
import type { TTSRequest } from '../types/tts'

type SpeakOptions = {
  playbackRate?: number
  onEnded?: () => void
  onFallback?: () => void
}

export function useTTS() {
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  const revokeUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    audioRef.current?.pause()
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }, [])

  const speak = useCallback(
    async (request: TTSRequest, options?: SpeakOptions) => {
      stop()
      revokeUrl()
      setIsLoading(true)
      setError(null)

      try {
        const result = await synthesize(request)
        urlRef.current = result.audioUrl
        const audio = new Audio(result.audioUrl)
        audio.playbackRate = options?.playbackRate ?? 1
        audioRef.current = audio
        audio.onended = () => {
          setIsPlaying(false)
          options?.onEnded?.()
        }
        audio.onerror = () => {
          setIsPlaying(false)
          setError('Ses oynatma hatası')
        }
        setIsLoading(false)
        setIsPlaying(true)
        await audio.play()
      } catch (err) {
        setIsLoading(false)
        setIsPlaying(false)
        const message = err instanceof Error ? err.message : 'TTS hatası'
        setError(message)
        options?.onFallback?.()
      }
    },
    [revokeUrl, stop],
  )

  useEffect(
    () => () => {
      stop()
      revokeUrl()
    },
    [revokeUrl, stop],
  )

  return { isLoading, isPlaying, error, speak, stop }
}
