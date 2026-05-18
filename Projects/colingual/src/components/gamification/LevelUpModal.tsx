import './LevelUpModal.css'

type LevelUpModalProps = {
  open: boolean
  level: number
  onClose: () => void
}

export function LevelUpModal({ open, level, onClose }: LevelUpModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="level-up-modal" role="dialog" aria-modal="true">
      <div className="level-up-modal__confetti" aria-hidden="true" />
      <div className="level-up-modal__card">
        <p className="eyebrow">Tebrikler!</p>
        <h2>Seviye {level}</h2>
        <p>Becerilerinle bağlantılı XP kazandın. Yarın da devam et!</p>
        <button type="button" onClick={onClose}>
          Harika
        </button>
      </div>
    </div>
  )
}
