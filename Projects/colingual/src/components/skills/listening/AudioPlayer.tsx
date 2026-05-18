import { useCallback, useEffect, useState } from 'react'
import { Headphones, Loader2, Pause, Play } from 'lucide-react'
import type { CEFRLevel } from '../../../types'
import { useTTS } from '../../../hooks/useTTS'
import { isCloudTtsConfigured } from '../../../services/tts/ttsService'
import { localeToLanguage } from '../../../utils/ttsUtils'
import './AudioPlayer.css'

const RATES = [0.75, 1, 1.25, 1.5] as const

type AudioPlayerProps = {
  title: string
  transcript: string
  locale?: string
  cefrLevel: CEFRLevel
  onListenComplete?: () => void
}

export function AudioPlayer({
  title,
  transcript,
  locale = 'en-US',
  cefrLevel,
  onListenComplete,
}: AudioPlayerProps) {
  const [rate, setRate] = useState<(typeof RATES)[number]>(
    cefrLevel === 'A1' || cefrLevel === 'A2' ? 0.75 : 1,
  )
  const [showTranscript, setShowTranscript] = useState(false)
  const { isLoading, isPlaying, error, speak, stop } = useTTS()
  const language = localeToLanguage(locale)
  const fullText = [title, transcript].filter(Boolean).join('. ')

  const playWithSpeechSynthesis = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(fullText)
    utterance.lang = locale
    utterance.rate = rate
    utterance.onend = () => onListenComplete?.()
    window.speechSynthesis.speak(utterance)
  }, [fullText, locale, onListenComplete, rate])

  const play = useCallback(() => {
    const request = {
      text: fullText,
      language,
      useCase: 'listening_content' as const,
      cefrLevel,
      speed: rate,
    }

    if (isCloudTtsConfigured()) {
      void speak(request, {
        playbackRate: rate,
        onEnded: onListenComplete,
        onFallback: playWithSpeechSynthesis,
      })
      return
    }

    playWithSpeechSynthesis()
  }, [cefrLevel, fullText, language, onListenComplete, playWithSpeechSynthesis, rate, speak])

  const handleToggle = () => {
    if (isPlaying) {
      stop()
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      return
    }
    play()
  }

  useEffect(
    () => () => {
      stop()
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    },
    [stop],
  )

  const busy = isLoading
  const active = isPlaying

  return (
    <div className="audio-player skill-surface skill-surface--listening">
      <div className="audio-player__controls">
        <button
          type="button"
          className="audio-player__play"
          onClick={handleToggle}
          disabled={busy}
          aria-label={active ? 'Duraklat' : 'Oynat'}
        >
          {busy ? (
            <Loader2 size={20} className="audio-player__spin" aria-hidden="true" />
          ) : active ? (
            <Pause size={20} aria-hidden="true" />
          ) : (
            <Play size={20} aria-hidden="true" />
          )}
        </button>
        <div className="audio-player__meta">
          <Headphones size={16} aria-hidden="true" />
          <span>{isCloudTtsConfigured() ? 'TTS dinleme' : 'Dinleme (tarayıcı)'}</span>
        </div>
        <div className="audio-player__rates" role="group" aria-label="Oynatma hızı">
          {RATES.map((candidate) => (
            <button
              key={candidate}
              type="button"
              className={rate === candidate ? 'active' : ''}
              onClick={() => {
                setRate(candidate)
                if (active) {
                  stop()
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel()
                  }
                  setTimeout(play, 80)
                }
              }}
            >
              {candidate}x
            </button>
          ))}
        </div>
        <button
          type="button"
          className="audio-player__transcript-toggle"
          onClick={() => setShowTranscript((value) => !value)}
        >
          {showTranscript ? 'Transkripti gizle' : 'Transkript'}
        </button>
      </div>
      {error ? <p className="audio-player__error">{error}</p> : null}
      {showTranscript ? (
        <p className="audio-player__transcript-preview">{transcript.slice(0, 280)}…</p>
      ) : null}
    </div>
  )
}
