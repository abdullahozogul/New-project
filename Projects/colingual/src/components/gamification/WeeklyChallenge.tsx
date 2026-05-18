import { useProgressStore } from '../../stores/useProgressStore'
import './WeeklyChallenge.css'

const WEEKLY_XP_TARGET = 500

export function WeeklyChallenge() {
  const totalXP = useProgressStore((state) => state.progress.totalXP)
  const weekProgress = Math.min(100, Math.round((totalXP % WEEKLY_XP_TARGET) / 5))

  return (
    <article className="weekly-challenge panel">
      <p className="eyebrow">Haftalık meydan okuma</p>
      <h3>Bu hafta dinleme odağı</h3>
      <p>{WEEKLY_XP_TARGET} XP kazan — beceri dengesi için dinleme ağırlıklı plan.</p>
      <div className="weekly-challenge__bar" role="progressbar" aria-valuenow={weekProgress}>
        <span style={{ width: `${weekProgress}%` }} />
      </div>
      <em>{weekProgress}%</em>
    </article>
  )
}
