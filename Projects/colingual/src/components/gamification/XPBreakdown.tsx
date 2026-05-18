import { XP_RULES } from '../../services/xpSystem'
import './XPBreakdown.css'

type XPBreakdownProps = {
  exercises: number
  correct: number
  streak: number
  perfect?: boolean
}

export function XPBreakdown({ exercises, correct, streak, perfect }: XPBreakdownProps) {
  const lines = [
    { label: 'Egzersiz', value: exercises * XP_RULES.completeExercise },
    { label: 'Doğru cevap', value: correct * XP_RULES.correctAnswer },
    { label: 'Seri bonusu', value: XP_RULES.streakBonus(streak) },
    ...(perfect ? [{ label: 'Kusursuz oturum', value: XP_RULES.perfectSession }] : []),
  ]
  const total = lines.reduce((sum, line) => sum + line.value, 0)

  return (
    <div className="xp-breakdown">
      <h4>Bu oturumda kazandıkların</h4>
      <ul>
        {lines.map((line) => (
          <li key={line.label}>
            <span>{line.label}</span>
            <strong>+{line.value} XP</strong>
          </li>
        ))}
      </ul>
      <p>
        Toplam: <strong>{total} XP</strong>
      </p>
    </div>
  )
}
