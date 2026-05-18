import type { WritingFeedbackResponse } from '../../types'
import './WritingFeedbackPanel.css'

type WritingFeedbackPanelProps = {
  feedback: WritingFeedbackResponse
}

export function WritingFeedbackPanel({ feedback }: WritingFeedbackPanelProps) {
  return (
    <aside className="writing-feedback-panel" aria-label="Yazma geri bildirimi">
      <header>
        <strong>AI geri bildirim</strong>
        <span className="writing-feedback-panel__score">{feedback.overallScore}/100</span>
      </header>
      <p className="writing-feedback-panel__alignment">
        Tahmini seviye: <strong>{feedback.cefrAlignment}</strong>
      </p>
      <p>{feedback.cohesionFeedback}</p>
      {feedback.vocabularySuggestions.length > 0 ? (
        <section>
          <h4>Kelime önerileri</h4>
          <ul>
            {feedback.vocabularySuggestions.map((item) => (
              <li key={item.original}>
                <strong>{item.original}</strong> → {item.suggestion}
                <span>{item.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {feedback.improvedVersion ? (
        <details>
          <summary>Düzeltilmiş versiyon</summary>
          <p>{feedback.improvedVersion}</p>
        </details>
      ) : null}
    </aside>
  )
}
