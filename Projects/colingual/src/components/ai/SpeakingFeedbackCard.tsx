import { useEffect, useState } from 'react'
import type { SpeakingEvaluationResponse } from '../../types'
import './SpeakingFeedbackCard.css'

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 700)
      setDisplay(Math.round(value * progress))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <strong>{display}</strong>
}

type SpeakingFeedbackCardProps = {
  evaluation: SpeakingEvaluationResponse
}

export function SpeakingFeedbackCard({ evaluation }: SpeakingFeedbackCardProps) {
  return (
    <article className="speaking-feedback-card">
      <div className="speaking-feedback-card__scores">
        <div>
          Akıcılık <CountUp value={evaluation.fluencyScore} />
        </div>
        <div>
          Dilbilgisi <CountUp value={evaluation.grammarScore} />
        </div>
        <div>
          Kelime <CountUp value={evaluation.vocabularyScore} />
        </div>
      </div>
      <p>
        Genel CEFR: <strong>{evaluation.overallCEFR}</strong>
      </p>
      <p>{evaluation.pronunciationFeedback}</p>
      <section>
        <h4>Güçlü yönler</h4>
        <ul>
          {evaluation.strongPoints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section>
        <h4>Geliştir</h4>
        <ul>
          {evaluation.improvementAreas.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      {evaluation.modelAnswer ? (
        <p className="speaking-feedback-card__model">
          <span>Örnek cevap:</span> {evaluation.modelAnswer}
        </p>
      ) : null}
    </article>
  )
}
