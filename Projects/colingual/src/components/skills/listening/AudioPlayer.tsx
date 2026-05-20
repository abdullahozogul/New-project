import { useCallback, useEffect, useState } from 'react'
import { Headphones, Loader2, Pause, Play } from 'lucide-react'
import type { CEFRLevel } from '../../../types'
import { useTTS } from '../../../hooks/useTTS'
import { isCloudTtsConfigured } from '../../../services/tts/ttsService'
import { localeToLanguage, resolveTtsProfile } from '../../../utils/ttsUtils'
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
  const { isLoading, isPlaying, error, lastProvider, speakListening, stop } = useTTS()
  const fullText = [title, transcript].filter(Boolean).join('. ')
  const ttsProfile = resolveTtsProfile(localeToLanguage(locale), fullText)
  const language = ttsProfile.language

  const play = useCallback(() => {
    void speakListening(
      {
        text: fullText,
        language,
        useCase: 'listening_content',
        cefrLevel,
        speed: rate,
      },
      {
        playbackRate: rate,
        onEnded: onListenComplete,
        chunked: true,
      },
    )
  }, [cefrLevel, fullText, language, onListenComplete, rate, speakListening])

  const handleToggle = () => {
    if (isPlaying) {
      stop()
      return
    }
    play()
  }

  useEffect(
    () => () => {
      stop()
    },
    [stop],
  )

  const busy = isLoading
  const active = isPlaying

  const providerLabel =
    lastProvider === 'openai'
      ? 'OpenAI EN'
      : lastProvider === 'elevenlabs'
        ? 'ElevenLabs EN'
        : lastProvider === 'browser'
          ? 'Tarayıcı EN'
          : isCloudTtsConfigured()
            ? 'İngilizce TTS'
            : 'Tarayıcı EN'

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
          <span>{providerLabel}</span>
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
