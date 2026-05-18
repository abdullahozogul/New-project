import type { LessonScenario } from '../../config/lessonScenarios'
import { lessonScenarios } from '../../config/lessonScenarios'

type ScenarioLessonPickerProps = {
  activeId: string | null
  onSelect: (id: string | null) => void
}

export function ScenarioLessonPicker({ activeId, onSelect }: ScenarioLessonPickerProps) {
  return (
    <section className="scenario-picker" id="scenarios" aria-labelledby="scenario-picker-title">
      <p className="eyebrow">language-lesson-chat</p>
      <h3 id="scenario-picker-title">Senaryo dersi</h3>
      <p className="scenario-picker-lead">
        Gerçek bağlamda konuşma — koç bu sahneyi ve anahtar kavramları hatırlar.
      </p>
      <div className="scenario-picker-grid" role="list">
        {lessonScenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            active={activeId === scenario.id}
            onSelect={() => onSelect(activeId === scenario.id ? null : scenario.id)}
          />
        ))}
      </div>
    </section>
  )
}

function ScenarioCard({
  scenario,
  active,
  onSelect,
}: {
  scenario: LessonScenario
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="listitem"
      className={
        active ?
          `scenario-card scenario-card--active tone-${scenario.imageTone}`
        : `scenario-card tone-${scenario.imageTone}`
      }
      onClick={onSelect}
      aria-pressed={active}
    >
      <span className="scenario-card__level">{scenario.minLevel}+</span>
      <strong>{scenario.title}</strong>
      <span>{scenario.intro}</span>
    </button>
  )
}
