import { useState } from 'react'
import type { Level } from '../../data'
import type { CefrTextAssessment } from '../../lib/cefrAssess'
import { levelsMatch, pickHardestSentences } from '../../lib/cefrAssess'
import './CefrAssessmentBadge.css'

type CefrAssessmentBadgeProps = {
  selectedLevel: Level
  assessment: CefrTextAssessment
}

export function CefrAssessmentBadge({ selectedLevel, assessment }: CefrAssessmentBadgeProps) {
  const [open, setOpen] = useState(false)
  const aligned = levelsMatch(selectedLevel, assessment.estimatedLevel)
  const confidencePct = Math.round(assessment.confidence * 100)
  const hardest = pickHardestSentences(assessment, 3)

  return (
    <div
      className={`cefr-assess-badge ${aligned ? 'cefr-assess-badge--ok' : 'cefr-assess-badge--warn'}`}
    >
      <div className="cefr-assess-badge__row">
        <span className="cefr-assess-badge__label">Seçili seviye</span>
        <strong>{selectedLevel}</strong>
        <span className="cefr-assess-badge__sep" aria-hidden="true">
          ·
        </span>
        <span className="cefr-assess-badge__label">Metin tahmini</span>
        <strong>{assessment.estimatedLevel}</strong>
        <span className="cefr-assess-badge__meta">%{confidencePct} güven</span>
        {hardest.length > 0 ? (
          <button
            type="button"
            className="cefr-assess-badge__toggle"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Cümleleri gizle' : 'CEFR-SP cümleleri'}
          </button>
        ) : null}
      </div>
      {!aligned ? (
        <span className="cefr-assess-badge__hint">
          Üst sekmeyi {assessment.estimatedLevel} yapmayı deneyin
        </span>
      ) : null}
      {open && hardest.length > 0 ? (
        <ul className="cefr-assess-sentences">
          {hardest.map((row) => (
            <li key={row.sentence.slice(0, 48)}>
              <span className="cefr-assess-sentences__level">{row.level}</span>
              <span>{row.sentence}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
