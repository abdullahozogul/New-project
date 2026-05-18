import { xpProgressInLevel } from '../../services/xpSystem'
import { useProgressStore } from '../../stores/useProgressStore'
import { t } from '../../constants/labels'
import './XPBar.css'

export function XPBar() {
  const totalXP = useProgressStore((state) => state.progress.totalXP)
  const { level, percentage } = xpProgressInLevel(totalXP)

  return (
    <div
      className="xp-bar"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${t('xp.level')} ${level}`}
    >
      <span className="xp-bar__level">
        {t('xp.level')} {level}
      </span>
      <span className="xp-bar__track">
        <span className="xp-bar__fill" style={{ width: `${percentage}%` }} />
      </span>
      <span className="xp-bar__xp">{totalXP} XP</span>
    </div>
  )
}
