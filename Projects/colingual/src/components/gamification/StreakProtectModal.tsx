import { useStreak } from '../../hooks/useStreak'
import './StreakProtectModal.css'

type StreakProtectModalProps = {
  open: boolean
  onClose: () => void
}

export function StreakProtectModal({ open, onClose }: StreakProtectModalProps) {
  const { streak, freezesLeft, markActiveToday, applyFreeze, atRisk } = useStreak()

  if (!open || !atRisk) {
    return null
  }

  return (
    <div className="streak-protect-modal" role="dialog" aria-modal="true">
      <div className="streak-protect-modal__card">
        <h3>Serin risk altında!</h3>
        <p>
          {streak} günlük serini korumak için bugün pratik yap veya dondurma kullan (
          {freezesLeft} kaldı).
        </p>
        <div className="streak-protect-modal__actions">
          <button
            type="button"
            disabled={freezesLeft <= 0}
            onClick={() => {
              if (applyFreeze()) {
                onClose()
              }
            }}
          >
            Seriyi dondur
          </button>
          <button
            type="button"
            onClick={() => {
              markActiveToday()
              onClose()
            }}
          >
            Pratiğe git
          </button>
        </div>
      </div>
    </div>
  )
}
