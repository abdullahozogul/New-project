import { useEffect, useMemo, useState } from 'react'
import type { Article } from '../../data'
import type { GrammarIssue, SpeakingEvaluationResponse, WritingFeedbackResponse } from '../../types'
import { levelFromAppLevel } from '../../utils/cefrUtils'
import type { Level } from '../../data'
import { ReadingPassage } from './reading/ReadingPassage'
import { AnnotationLayer, type ReadingNote } from './reading/AnnotationLayer'
import { WritingEditor } from './writing/WritingEditor'
import { AudioPlayer } from './listening/AudioPlayer'
import { TranscriptViewer } from './listening/TranscriptViewer'
import { SpeakingRecorder } from './speaking/SpeakingRecorder'
import { WritingFeedbackPanel } from '../ai/WritingFeedbackPanel'
import { SpeakingFeedbackCard } from '../ai/SpeakingFeedbackCard'
import { FeedbackOverlay } from '../shared/FeedbackOverlay'
import { TTSPlayer } from '../audio/TTSPlayer'
import { localeToLanguage } from '../../utils/ttsUtils'
import { fetchWritingFeedback, fetchSpeakingEvaluation } from '../../services/aiService'
import { useProgressStore } from '../../stores/useProgressStore'
import './skills-themes.css'
import './SkillsWorkbench.css'

type SkillTab = 'reading' | 'writing' | 'listening' | 'speaking'

type SkillsWorkbenchProps = {
  article: Article
  appLevel: Level
  locale?: string
  storyKey: string
  onWordClick?: (word: string) => void
}

function loadNotes(storyKey: string): ReadingNote[] {
  try {
    const raw = localStorage.getItem(`colingual-notes-${storyKey}`)
    return raw ? (JSON.parse(raw) as ReadingNote[]) : []
  } catch {
    return []
  }
}

function saveNotes(storyKey: string, notes: ReadingNote[]) {
  try {
    localStorage.setItem(`colingual-notes-${storyKey}`, JSON.stringify(notes))
  } catch {
    // Keep note editing usable even when browser storage is unavailable.
  }
}

export function SkillsWorkbench({
  article,
  appLevel,
  locale,
  storyKey,
  onWordClick,
}: SkillsWorkbenchProps) {
  const cefrLevel = levelFromAppLevel(appLevel)
  const [tab, setTab] = useState<SkillTab>('reading')
  const [notes, setNotes] = useState<ReadingNote[]>(() => loadNotes(storyKey))
  const [writingFeedback, setWritingFeedback] = useState<WritingFeedbackResponse | null>(null)
  const [writingIssues, setWritingIssues] = useState<GrammarIssue[]>([])
  const [writingLoading, setWritingLoading] = useState(false)
  const [speakingFeedback, setSpeakingFeedback] = useState<SpeakingEvaluationResponse | null>(null)
  const [speakingOpen, setSpeakingOpen] = useState(false)
  const [aiWordTip, setAiWordTip] = useState<string | null>(null)
  const [lastWord, setLastWord] = useState<string | null>(null)
  const ttsLanguage = localeToLanguage(locale)
  const recordSession = useProgressStore((state) => state.recordSession)

  const transcript = useMemo(() => article.paragraphs.join(' '), [article.paragraphs])

  useEffect(() => {
    setNotes(loadNotes(storyKey))
  }, [storyKey])

  const addNote = (quote: string, note: string) => {
    const next: ReadingNote = {
      id: `n-${Date.now()}`,
      quote,
      note,
      createdAt: new Date().toISOString(),
    }
    setNotes((current) => {
      const merged = [next, ...current]
      saveNotes(storyKey, merged)
      return merged
    })
    recordSession('reading')
  }

  const removeNote = (id: string) => {
    setNotes((current) => {
      const merged = current.filter((item) => item.id !== id)
      saveNotes(storyKey, merged)
      return merged
    })
  }

  const reviewWriting = async (text: string) => {
    setWritingLoading(true)
    try {
      const feedback = await fetchWritingFeedback({
        text,
        cefrLevel,
        taskType: 'description',
        targetLanguage: 'English',
        nativeLanguage: 'Turkish',
      })
      setWritingFeedback(feedback)
      setWritingIssues(feedback.grammarIssues)
      recordSession('writing', feedback.overallScore)
    } catch {
      setWritingFeedback(null)
      setWritingIssues([])
    } finally {
      setWritingLoading(false)
    }
  }

  const submitSpeaking = async (payload: { transcript: string; durationSeconds: number }) => {
    const words = payload.transcript.split(/\s+/).filter(Boolean).length
    const wpm = Math.round((words / Math.max(payload.durationSeconds, 1)) * 60)
    try {
      const evaluation = await fetchSpeakingEvaluation({
        transcript: payload.transcript,
        cefrLevel,
        prompt: article.title,
        durationSeconds: payload.durationSeconds,
        wordsPerMinute: wpm,
      })
      setSpeakingFeedback(evaluation)
      setSpeakingOpen(true)
      recordSession('speaking', evaluation.fluencyScore)
    } catch {
      setSpeakingFeedback(null)
    }
  }

  const tabs: { id: SkillTab; label: string }[] = [
    { id: 'reading', label: 'Okuma' },
    { id: 'writing', label: 'Yazma' },
    { id: 'listening', label: 'Dinleme' },
    { id: 'speaking', label: 'Konuşma' },
  ]

  return (
    <section className="panel skills-workbench" id="skills" aria-labelledby="skills-title">
      <header className="panel-heading">
        <div>
          <p className="eyebrow">Dört beceri</p>
          <h2 id="skills-title">Beceri atölyesi</h2>
        </div>
      </header>

      <div className="skills-workbench__tabs" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'active' : ''}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="skills-workbench__pane" role="tabpanel">
        {tab === 'reading' && (
          <div className="skills-workbench__reading skill-surface skill-surface--reading">
            <ReadingPassage
              level={cefrLevel}
              paragraphs={article.paragraphs}
              onWordClick={(word) => {
                setLastWord(word)
                onWordClick?.(word)
              }}
              onAskAi={(word) => setAiWordTip(`“${word}” — bağlam: ${article.title}`)}
            />
            {lastWord ? (
              <div className="skills-workbench__word-tts">
                <TTSPlayer
                  text={lastWord}
                  language={ttsLanguage}
                  cefrLevel={cefrLevel}
                  useCase="word_definition"
                  variant="button"
                />
              </div>
            ) : null}
            {aiWordTip ? <p className="skills-workbench__ai-tip">{aiWordTip}</p> : null}
            <AnnotationLayer notes={notes} onAddNote={addNote} onRemoveNote={removeNote} />
          </div>
        )}

        {tab === 'writing' && (
          <>
            <WritingEditor
              cefrLevel={cefrLevel}
              issues={writingIssues}
              reviewing={writingLoading}
              onReview={reviewWriting}
            />
            {writingFeedback ? <WritingFeedbackPanel feedback={writingFeedback} /> : null}
          </>
        )}

        {tab === 'listening' && (
          <div className="skill-surface skill-surface--listening">
            <AudioPlayer
              title={article.title}
              transcript={transcript}
              locale={locale}
              cefrLevel={cefrLevel}
              onListenComplete={() => recordSession('listening')}
            />
            <TranscriptViewer paragraphs={article.paragraphs} onWordClick={onWordClick} />
          </div>
        )}

        {tab === 'speaking' && (
          <SpeakingRecorder
            cefrLevel={cefrLevel}
            prompt={`${article.title}: İki cümleyle özetle.`}
            onSubmit={submitSpeaking}
          />
        )}
      </div>

      <FeedbackOverlay
        open={speakingOpen}
        title="Konuşma değerlendirmesi"
        onClose={() => setSpeakingOpen(false)}
      >
        {speakingFeedback ? <SpeakingFeedbackCard evaluation={speakingFeedback} /> : null}
      </FeedbackOverlay>
    </section>
  )
}
