import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { CEFRLevel } from '../../../types'
import { GrammarHighlighter } from './GrammarHighlighter'
import type { GrammarIssue } from '../../../types'
import './WritingEditor.css'

const WORD_TARGETS: Record<CEFRLevel, number> = {
  A1: 40,
  A2: 60,
  B1: 90,
  B2: 120,
  C1: 150,
  C2: 180,
}

type WritingEditorProps = {
  cefrLevel: CEFRLevel
  issues?: GrammarIssue[]
  onReview: (text: string) => void
  reviewing?: boolean
}

export function WritingEditor({ cefrLevel, issues = [], onReview, reviewing }: WritingEditorProps) {
  const [text, setText] = useState('')
  const wordCount = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean).length,
    [text],
  )
  const target = WORD_TARGETS[cefrLevel]

  return (
    <div className="writing-editor skill-surface skill-surface--writing">
      <header className="writing-editor__head">
        <div>
          <p className="eyebrow">Yazma</p>
          <strong>
            {wordCount} / {target} kelime
          </strong>
        </div>
        <button
          type="button"
          className="writing-editor__review"
          disabled={reviewing || text.trim().length < 8}
          onClick={() => onReview(text)}
        >
          <Sparkles size={16} aria-hidden="true" />
          AI Gözden Geçir
        </button>
      </header>

      <div
        className="writing-editor__area"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Yazma alanı"
        suppressContentEditableWarning
        onInput={(event) => setText(event.currentTarget.textContent ?? '')}
      />

      <GrammarHighlighter text={text} issues={issues} />
    </div>
  )
}
