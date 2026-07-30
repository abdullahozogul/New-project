import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, RotateCcw, Send } from 'lucide-react'
import type { CEFRLevel } from '../../../types'
import { WaveformVisualizer } from './WaveformVisualizer'
import './SpeakingRecorder.css'

const MAX_SECONDS: Record<CEFRLevel, number> = {
  A1: 30,
  A2: 45,
  B1: 60,
  B2: 90,
  C1: 120,
  C2: 120,
}

type SpeakingRecorderProps = {
  cefrLevel: CEFRLevel
  prompt: string
  onSubmit: (payload: { transcript: string; durationSeconds: number }) => void
}

export function SpeakingRecorder({ cefrLevel, prompt, onSubmit }: SpeakingRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [transcript, setTranscript] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mountedRef = useRef(true)

  const maxSeconds = MAX_SECONDS[cefrLevel]

  const releaseCapture = useCallback((updateUi: boolean) => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop()
      } catch {
        /* already stopped */
      }
    }
    mediaRecorderRef.current = null

    const recognition = recognitionRef.current
    if (recognition) {
      try {
        recognition.stop()
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null
    }

    const audioContext = audioContextRef.current
    if (audioContext) {
      void audioContext.close().catch(() => undefined)
      audioContextRef.current = null
    }
    analyserRef.current = null

    if (updateUi) {
      setRecording(false)
    }
  }, [])

  const stopTracks = useCallback(() => {
    releaseCapture(true)
  }, [releaseCapture])

  // SkillsWorkbench unmounts this component when leaving the speaking tab.
  // Without cleanup, getUserMedia tracks / SpeechRecognition / AudioContext keep running.
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      releaseCapture(false)
    }
  }, [releaseCapture])

  const start = useCallback(async () => {
    setTranscript('')
    setSeconds(0)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
      }
      mediaRecorderRef.current = recorder
      recorder.start()
    } catch {
      /* mic permission denied */
    }

    if (!mountedRef.current) {
      releaseCapture(false)
      return
    }

    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (SpeechRecognitionCtor) {
      const recognition = new SpeechRecognitionCtor()
      recognition.lang = 'en-US'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onresult = (event) => {
        if (!mountedRef.current) {
          return
        }
        const parts: string[] = []
        for (let index = 0; index < event.results.length; index += 1) {
          parts.push(event.results[index][0].transcript)
        }
        setTranscript(parts.join(' ').trim())
      }
      recognition.start()
      recognitionRef.current = recognition
    }

    setRecording(true)
  }, [releaseCapture])

  useEffect(() => {
    if (!recording) {
      return
    }
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value + 1 >= maxSeconds) {
          stopTracks()
          return maxSeconds
        }
        return value + 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [maxSeconds, recording, stopTracks])

  const retry = () => {
    stopTracks()
    setTranscript('')
    setSeconds(0)
  }

  const submit = () => {
    stopTracks()
    onSubmit({ transcript: transcript.trim(), durationSeconds: seconds || 1 })
  }

  return (
    <div className="speaking-recorder skill-surface skill-surface--speaking">
      <p className="speaking-recorder__prompt">{prompt}</p>
      <WaveformVisualizer analyser={analyserRef.current} active={recording} />
      <div className="speaking-recorder__timer" aria-live="polite">
        {seconds}s / {maxSeconds}s
      </div>
      {transcript ? <p className="speaking-recorder__transcript">{transcript}</p> : null}
      <div className="speaking-recorder__actions">
        <button
          type="button"
          className="speaking-recorder__record"
          onClick={() => (recording ? stopTracks() : void start())}
          aria-pressed={recording}
        >
          <Mic size={18} aria-hidden="true" />
          {recording ? 'Durdur' : 'Kaydet'}
        </button>
        <button type="button" onClick={retry} className="speaking-recorder__secondary">
          <RotateCcw size={16} aria-hidden="true" />
          Tekrar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!transcript.trim()}
          className="speaking-recorder__submit"
        >
          <Send size={16} aria-hidden="true" />
          Gönder
        </button>
      </div>
    </div>
  )
}
