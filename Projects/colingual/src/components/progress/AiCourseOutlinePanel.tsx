import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import type { Level } from '../../data'
import { generateCourseOutline, type CourseOutlineResult } from '../../lib/aiEducation'
import { isGeminiAiConfigured } from '../../lib/gemini'
import { handleExternalLinkClick } from '../../lib/openExternalLink'

type AiCourseOutlinePanelProps = {
  defaultCourseName: string
  level: Level
  targetLanguageLabel: string
}

export function AiCourseOutlinePanel({
  defaultCourseName,
  level,
  targetLanguageLabel,
}: AiCourseOutlinePanelProps) {
  const [courseName, setCourseName] = useState(defaultCourseName)
  const [loading, setLoading] = useState(false)
  const [outline, setOutline] = useState<CourseOutlineResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await generateCourseOutline({
        courseName: courseName.trim() || defaultCourseName,
        level,
        targetLanguage: targetLanguageLabel,
        moduleCount: 3,
      })
      setOutline(result)
    } catch {
      setError('Müfredat taslağı oluşturulamadı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel course-outline-panel" id="course-ai" aria-labelledby="course-ai-title">
      <header className="panel-heading">
        <div>
          <p className="eyebrow">ACCG · ClassroomIO</p>
          <h2 id="course-ai-title">AI müfredat taslağı</h2>
          <p className="course-outline-lead">
            Kurs adı ve seviye girin; ünite, ders ve kısa quiz üretin (
            <a
              href="https://github.com/pramodkoujalagi/Automated-Course-Content-Generator"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) =>
                handleExternalLinkClick(
                  event,
                  'https://github.com/pramodkoujalagi/Automated-Course-Content-Generator',
                )
              }
            >
              ACCG
            </a>
            tarzı).
          </p>
        </div>
        <BookOpen size={20} aria-hidden="true" />
      </header>

      <label className="course-outline-field">
        <span>Kurs adı</span>
        <input
          value={courseName}
          onChange={(event) => setCourseName(event.target.value)}
          placeholder="Örn. Günlük haber okuma"
        />
      </label>
      <p className="course-outline-meta">
        Hedef: {targetLanguageLabel} · {level}
        {!isGeminiAiConfigured() ? ' · Demo şablon' : ''}
      </p>

      <button type="button" className="study-generate-btn" disabled={loading} onClick={generate}>
        {loading ? 'Üretiliyor…' : 'Taslak oluştur'}
      </button>
      {error ? <p className="study-material-error">{error}</p> : null}

      {outline ?
        <article className="course-outline-output">
          <h3>{outline.title}</h3>
          <p className="course-outline-audience">{outline.audience}</p>
          {outline.modules.map((module) => (
            <div key={module.title} className="course-outline-module">
              <h4>{module.title}</h4>
              <ul>
                {module.lessons.map((lesson) => (
                  <li key={lesson}>{lesson}</li>
                ))}
              </ul>
            </div>
          ))}
          <h4>Quiz</h4>
          <ol className="course-outline-quiz">
            {outline.quiz.map((item) => (
              <li key={item.question}>
                <strong>{item.question}</strong>
                <span> — {item.choices.join(' / ')} · Cevap: {item.answer}</span>
              </li>
            ))}
          </ol>
        </article>
      : null}
    </section>
  )
}
