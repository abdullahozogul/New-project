import { useMemo } from 'react'
import { Check, Flag, Lock, Play, Sparkles } from 'lucide-react'
import { deriveClassroomCourse, type ProgressSignals } from '../../lib/classroomProgress'

type LearningPathSectionProps = {
  signals: ProgressSignals
}

export function LearningPathSection({ signals }: LearningPathSectionProps) {
  const course = useMemo(() => deriveClassroomCourse(signals), [signals])
  const activeUnit = course.units[0]
  const lockedUnit = course.units[1]

  return (
    <section className="learning-path-section" id="learning-path" aria-labelledby="lp-title">
      <div className="learning-path-intro">
        <p className="eyebrow">ClassroomIO tarzı müfredat</p>
        <h2 id="lp-title">{course.title}</h2>
        <p className="learning-path-lead">
          Üniteler ve dersler uygulama içi görünümlere bağlı — ilerleme aktivitenize göre açılır.
        </p>
      </div>
      <div className="learning-path-layout">
        <div className="lp-column-main">
          <article className="lp-unit-card">
            <header className="lp-unit-header">
              <div className="lp-unit-header-text">
                <span className="lp-unit-label">{activeUnit.label}</span>
                <h3>{activeUnit.title}</h3>
                <p>{activeUnit.description}</p>
              </div>
              <div className="lp-unit-ring" aria-hidden="true">
                <span>{activeUnit.progressPct}%</span>
              </div>
            </header>
            <div className="lp-lesson-list">
              {activeUnit.lessons.map((lesson) => (
                <div key={lesson.id} className={`lp-lesson lp-lesson--${lesson.state}`}>
                  <div className="lp-lesson-icon">
                    {lesson.state === 'done' ? <Check size={18} aria-hidden="true" /> : null}
                    {lesson.state === 'current' ? <Play size={18} aria-hidden="true" /> : null}
                    {lesson.state === 'locked' ?
                      lesson.category === 'Milestone' ?
                        <Flag size={18} aria-hidden="true" />
                      : <Lock size={18} aria-hidden="true" />
                    : null}
                  </div>
                  <div className="lp-lesson-body">
                    <span className="lp-lesson-cat">{lesson.category}</span>
                    <h4>{lesson.title}</h4>
                    {lesson.description ? <p>{lesson.description}</p> : null}
                  </div>
                  {lesson.state === 'current' || lesson.state === 'done' ?
                    <a href={lesson.href} className="lp-start-btn">
                      {lesson.state === 'done' ? 'Tekrar' : 'Derse git'}
                    </a>
                  : null}
                </div>
              ))}
            </div>
          </article>
          <article className="lp-unit-card lp-unit-locked-card" aria-labelledby="lp-u2-title">
            <header className="lp-unit-locked-head">
              <div>
                <span className="lp-unit-label muted">{lockedUnit.label}</span>
                <h3 id="lp-u2-title">{lockedUnit.title}</h3>
              </div>
              <Lock size={26} className="lp-lock-icon" aria-hidden="true" />
            </header>
          </article>
        </div>
        <aside className="lp-column-aside" aria-label="Yol kenar çubuğu">
          <div className="lp-widget lp-ai-card">
            <Sparkles size={24} aria-hidden="true" />
            <h4>ScholarShelf + koç</h4>
            <p>Rafa eklediğiniz metinler hakkında SchoBot tarzı sorular sorun.</p>
            <a href="#library" className="lp-ai-cta">
              Kütüphaneye git
            </a>
          </div>
        </aside>
      </div>
    </section>
  )
}
