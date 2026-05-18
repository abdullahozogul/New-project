import { BADGES } from '../../config/badges'
import { t } from '../../constants/labels'
import './BadgeGrid.css'

type BadgeGridProps = {
  earnedIds: string[]
}

export function BadgeGrid({ earnedIds }: BadgeGridProps) {
  return (
    <section className="badge-grid-wrap" aria-labelledby="badge-grid-title">
      <h3 id="badge-grid-title">{t('badges.title')}</h3>
      <div className="badge-grid">
        {BADGES.map((badge) => {
          const earned = earnedIds.includes(badge.id)
          return (
            <div
              key={badge.id}
              className={earned ? 'badge-tile badge-tile--earned' : 'badge-tile'}
              title={badge.description}
            >
              <span className="badge-tile__icon" aria-hidden="true">
                {badge.icon}
              </span>
              <strong>{badge.name}</strong>
              <span>{earned ? 'Kazanıldı' : 'Kilitli'}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
