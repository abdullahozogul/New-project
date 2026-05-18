import { ChevronRight } from 'lucide-react'
import { skillLabels, t } from '../../constants/labels'
import { useLearningPath } from '../../hooks/useLearningPath'
import './DailyPlanCard.css'

export function DailyPlanCard() {
  const { plan, nextUp, weakSkill } = useLearningPath()

  return (
    <article className="daily-plan-card">
      <header>
        <p className="eyebrow">{t('dailyPlan.title')}</p>
        <h3>Zayıf beceri: {skillLabels[weakSkill]}</h3>
      </header>
      <ul className="daily-plan-card__list">
        {plan.map((item) => (
          <li key={item.skill}>
            <span>{item.label}</span>
            <em>
              {item.activities} aktivite · ~{item.minutes} dk
            </em>
          </li>
        ))}
      </ul>
      {nextUp ? (
        <p className="daily-plan-card__next">
          <ChevronRight size={16} aria-hidden="true" />
          {t('dailyPlan.next')}: {nextUp.label} (~{nextUp.minutes} dk)
        </p>
      ) : null}
    </article>
  )
}
