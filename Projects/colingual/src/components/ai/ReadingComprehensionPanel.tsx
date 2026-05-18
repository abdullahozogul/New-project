import { Loader2 } from 'lucide-react'
import { useReadingComprehension } from '../../hooks/useReadingComprehension'
import type { CEFRLevel } from '../../types'
import { ExerciseCard } from '../shared/ExerciseCard'
import './ReadingComprehensionPanel.css'

type ReadingComprehensionPanelProps = {
  passage: string
  cefrLevel: CEFRLevel
}

export function ReadingComprehensionPanel({ passage, cefrLevel }: ReadingComprehensionPanelProps) {
  const { questions, loading, error, generate } = useReadingComprehension()

  return (
    <section className="reading-comprehension panel" aria-labelledby="comprehension-title">
      <header className="panel-heading">
        <div>
          <p className="eyebrow">Okuma anlama</p>
          <h3 id="comprehension-title">AI soruları</h3>
        </div>
        <button type="button" disabled={loading} onClick={() => void generate(passage, cefrLevel)}>
          {loading ? <Loader2 size={16} className="spin" /> : 'Sorular üret'}
        </button>
      </header>
      {error ? <p className="reading-comprehension__error">{error}</p> : null}
      <div className="reading-comprehension__list">
        {questions.map((question) => (
          <ExerciseCard key={question.id} cardKey={question.id} result="idle">
            <p>
              <strong>{question.question}</strong>
            </p>
            <ol>
              {question.options.map((option) => (
                <li key={option}>{option}</li>
              ))}
            </ol>
          </ExerciseCard>
        ))}
      </div>
    </section>
  )
}
