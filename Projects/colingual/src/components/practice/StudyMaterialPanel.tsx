import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { Level } from '../../data'
import { generateStudyMaterial, type StudyMaterialResult } from '../../lib/aiEducation'
import { isGeminiAiConfigured } from '../../lib/gemini'

type StudyMaterialPanelProps = {
  topic: string
  level: Level
  targetLanguageLabel: string
  nativeLanguageLabel: string
  vocabularyTerms: string[]
}

export function StudyMaterialPanel({
  topic,
  level,
  targetLanguageLabel,
  nativeLanguageLabel,
  vocabularyTerms,
}: StudyMaterialPanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [material, setMaterial] = useState<StudyMaterialResult | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await generateStudyMaterial({
        topic,
        level,
        targetLanguage: targetLanguageLabel,
        nativeLanguage: nativeLanguageLabel,
        vocabularyTerms,
      })
      setMaterial(result)
    } catch {
      setError('Çalışma materyali oluşturulamadı. Gemini anahtarını kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel study-material-panel" id="study-material" aria-labelledby="study-title">
      <header className="panel-heading">
        <div>
          <p className="eyebrow">AI Study Material Generator</p>
          <h2 id="study-title">Kişisel çalışma sayfası</h2>
          <p className="study-material-lead">
            Okuduğunuz konuya göre özet, kelime ve pratik soruları —{' '}
            <em>{topic}</em> ({level})
          </p>
        </div>
        <Sparkles size={20} aria-hidden="true" />
      </header>

      <button type="button" className="study-generate-btn" disabled={loading} onClick={generate}>
        {loading ? 'Oluşturuluyor…' : 'Materyal üret'}
      </button>
      {!isGeminiAiConfigured() ? (
        <p className="study-material-hint">Demo modu: örnek şablon gösterilir.</p>
      ) : null}
      {error ? <p className="study-material-error">{error}</p> : null}

      {material ?
        <article className="study-material-output">
          <h3>Özet</h3>
          <p>{material.summary}</p>
          <h3>Önemli noktalar</h3>
          <ul>
            {material.keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <h3>Kelime</h3>
          <dl className="study-vocab-dl">
            {material.vocabulary.map((row) => (
              <div key={row.term}>
                <dt>{row.term}</dt>
                <dd>{row.definition}</dd>
              </div>
            ))}
          </dl>
          <h3>Pratik</h3>
          <ul>
            {material.practicePrompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </article>
      : null}
    </section>
  )
}
