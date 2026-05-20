import { useCallback, useEffect, useRef, useState } from 'react'
import { splitTextIntoListeningChunks } from '../services/tts/listeningChunks'
import { synthesize } from '../services/tts/ttsService'
import type { TTSProvider } from '../types/tts'
import type { TTSRequest } from '../types/tts'
import { speakEnglishChunksWithBrowser, speakEnglishWithBrowser } from '../utils/speechSynthesisEnglish'

type SpeakOptions = {
  playbackRate?: number
  onEnded?: () => void
  onFallback?: () => void
}

type SpeakListeningOptions = SpeakOptions & {
  /** Parça parça okuma — uzun makaleler için */
  chunked?: boolean
}

function waitForAudioEnd(audio: HTMLAudioElement): Promise<void> {
  return new Promise((resolve, reject) => {
    audio.onended = () => resolve()
    audio.onerror = () => reject(new Error('Ses oynatma hatası'))
  })
}

export function useTTS() {
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastProvider, setLastProvider] = useState<TTSProvider | 'browser' | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const revokeUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    audioRef.current?.pause()
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
  }, [])

  const playUrl = useCallback(
    async (audioUrl: string, playbackRate: number, signal: AbortSignal) => {
      revokeUrl()
      urlRef.current = audioUrl
      const audio = new Audio(audioUrl)
      audio.playbackRate = playbackRate
      audioRef.current = audio
      if (signal.aborted) {
        return
      }
      await audio.play()
      await waitForAudioEnd(audio)
    },
    [revokeUrl],
  )

  const speak = useCallback(
    async (request: TTSRequest, options?: SpeakOptions) => {
      stop()
      const signal = new AbortController()
      abortRef.current = signal
      setIsLoading(true)
      setError(null)

      try {
        const result = await synthesize(request)
        if (signal.signal.aborted) {
          return
        }
        setLastProvider(result.provider)
        setIsLoading(false)
        setIsPlaying(true)
        await playUrl(result.audioUrl, options?.playbackRate ?? 1, signal.signal)
        revokeUrl()
        setIsPlaying(false)
        options?.onEnded?.()
      } catch (err) {
        if (signal.signal.aborted) {
          return
        }
        setIsLoading(false)
        setIsPlaying(false)
        const message = err instanceof Error ? err.message : 'TTS hatası'
        setError(message)

        if (request.language === 'en') {
          setLastProvider('browser')
          speakEnglishWithBrowser(request.text, {
            rate: options?.playbackRate,
            onEnded: options?.onEnded,
          })
          setIsPlaying(true)
          return
        }

        options?.onFallback?.()
      }
    },
    [playUrl, revokeUrl, stop],
  )

  const speakListening = useCallback(
    async (request: TTSRequest, options?: SpeakListeningOptions) => {
      stop()
      const signal = new AbortController()
      abortRef.current = signal
      setIsLoading(true)
      setError(null)

      const chunks =
        options?.chunked !== false
          ? splitTextIntoListeningChunks(request.text)
          : [request.text.trim()].filter(Boolean)

      if (chunks.length === 0) {
        setIsLoading(false)
        return
      }

      try {
        for (let index = 0; index < chunks.length; index += 1) {
          if (signal.signal.aborted) {
            return
          }
          const chunkRequest: TTSRequest = {
            ...request,
            text: chunks[index],
          }
          const result = await synthesize(chunkRequest)
          if (signal.signal.aborted) {
            URL.revokeObjectURL(result.audioUrl)
            return
          }
          setLastProvider(result.provider)
          setIsLoading(false)
          setIsPlaying(true)
          await playUrl(result.audioUrl, options?.playbackRate ?? 1, signal.signal)
          URL.revokeObjectURL(result.audioUrl)
        }
        setIsPlaying(false)
        options?.onEnded?.()
      } catch (err) {
        if (signal.signal.aborted) {
          return
        }
        setIsLoading(false)
        setIsPlaying(false)
        setError(err instanceof Error ? err.message : 'TTS hatası')
        setLastProvider('browser')
        await speakEnglishChunksWithBrowser(chunks, {
          rate: options?.playbackRate,
          onEnded: options?.onEnded,
          signal: signal.signal,
        })
        setIsPlaying(false)
      }
    },
    [playUrl, stop],
  )

  useEffect(
    () => () => {
      stop()
      revokeUrl()
    },
    [revokeUrl, stop],
  )

  return { isLoading, isPlaying, error, lastProvider, speak, speakListening, stop }
}
