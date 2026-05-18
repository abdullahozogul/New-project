import { Flame } from 'lucide-react'
import { useStreak } from '../../hooks/useStreak'
import { t } from '../../constants/labels'
import './StreakDisplay.css'

export function StreakDisplay() {
  const { streak } = useStreak()

  return (
    <div className="streak-display" aria-label={`${streak} ${t('streak.days')}`}>
      <Flame size={18} aria-hidden="true" className="streak-display__icon" />
      <strong>{streak}</strong>
    </div>
  )
}
