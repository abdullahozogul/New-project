import { useState } from 'react'
import { Loader2, Square, Volume2 } from 'lucide-react'
import { useTTS } from '../../hooks/useTTS'
import type { CEFRLevel } from '../../types'
import type { TTSUseCase } from '../../types/tts'
import './TTSPlayer.css'

type TTSPlayerProps = {
  text: string
  language: string
  useCase?: TTSUseCase
  cefrLevel?: CEFRLevel
  showSpeed?: boolean
  variant?: 'icon' | 'button' | 'inline'
  onEnded?: () => void
}

const SPEED_OPTIONS = [0.75, 0.9, 1, 1.25, 1.5] as const

export function TTSPlayer({
  text,
  language,
  useCase = 'pronunciation',
  cefrLevel,
  showSpeed = false,
  variant = 'icon',
  onEnded,
}: TTSPlayerProps) {
  const { isLoading, isPlaying, error, speak, stop } = useTTS()
  const [speed, setSpeed] = useState(1)

  const handlePlay = () => {
    if (isPlaying) {
      stop()
      return
    }
    void speak(
      { text, language, useCase, cefrLevel, speed },
      { playbackRate: speed, onEnded },
    )
  }

  const label = isPlaying ? 'Durdur' : 'Seslendir'

  if (variant === 'icon') {
    return (
      <button
        type="button"
        className="tts-player tts-player--icon"
        onClick={handlePlay}
        disabled={isLoading || !text.trim()}
        aria-label={label}
      >
        {isLoading ? (
          <Loader2 size={18} className="tts-player__spin" aria-hidden="true" />
        ) : isPlaying ? (
          <Square size={18} aria-hidden="true" />
        ) : (
          <Volume2 size={18} aria-hidden="true" />
        )}
      </button>
    )
  }

  if (variant === 'button') {
    return (
      <div className="tts-player tts-player--button" role="group">
        <button type="button" onClick={handlePlay} disabled={isLoading || !text.trim()}>
          {isLoading ? (
            <>
              <Loader2 size={16} className="tts-player__spin" aria-hidden="true" />
              Yükleniyor…
            </>
          ) : isPlaying ? (
            <>
              <Square size={16} aria-hidden="true" />
              Durdur
            </>
          ) : (
            <>
              <Volume2 size={16} aria-hidden="true" />
              Dinle
            </>
          )}
        </button>
        {showSpeed ? (
          <select
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            aria-label="Oynatma hızı"
          >
            {SPEED_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}x
              </option>
            ))}
          </select>
        ) : null}
        {error ? <span className="tts-player__error">{error}</span> : null}
      </div>
    )
  }

  return (
    <span className="tts-player tts-player--inline">
      {text}
      <button type="button" onClick={handlePlay} disabled={isLoading} aria-label={label}>
        {isLoading ? (
          <Loader2 size={14} className="tts-player__spin" aria-hidden="true" />
        ) : (
          <Volume2 size={14} aria-hidden="true" />
        )}
      </button>
    </span>
  )
}
