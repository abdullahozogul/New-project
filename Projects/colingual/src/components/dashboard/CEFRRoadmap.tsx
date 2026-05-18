import type { CEFRLevel } from '../../types'
import { CEFR_LEVELS } from '../../types'
import { cefrLevelLabels, t } from '../../constants/labels'
import { isLevelUnlocked } from '../../utils/cefrUtils'
import './CEFRRoadmap.css'

type CEFRRoadmapProps = {
  currentLevel: CEFRLevel
  onSelectLevel?: (level: CEFRLevel) => void
}

export function CEFRRoadmap({ currentLevel, onSelectLevel }: CEFRRoadmapProps) {
  return (
    <section className="cefr-roadmap" aria-label={t('dashboard.title')}>
      <div className="cefr-roadmap__track">
        {CEFR_LEVELS.map((level) => {
          const unlocked = isLevelUnlocked(level, currentLevel)
          const active = level === currentLevel
          const locked = !unlocked

          return (
            <button
              key={level}
              type="button"
              className={[
                'cefr-milestone',
                active ? 'cefr-milestone--active' : '',
                locked ? 'cefr-milestone--locked' : 'cefr-milestone--done',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={locked}
              onClick={() => onSelectLevel?.(level)}
              aria-current={active ? 'step' : undefined}
            >
              <span className="cefr-milestone__dot" aria-hidden="true" />
              <span className="cefr-milestone__level">{cefrLevelLabels[level]}</span>
              <span className="cefr-milestone__hint">
                {active ? 'Aktif' : locked ? 'Kilitli' : 'Tamamlandı'}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
