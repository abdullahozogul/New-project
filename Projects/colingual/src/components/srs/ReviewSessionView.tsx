import { useMemo, useState } from 'react'
import { useSRSStore } from '../../stores/useSRSStore'
import { useProgressStore } from '../../stores/useProgressStore'
import { cardsDueForReview, type SRSRating } from '../../services/srsEngine'
import './ReviewSessionView.css'

export function ReviewSessionView() {
  const cards = useSRSStore((state) => state.cards)
  const dueCards = useMemo(() => cardsDueForReview(cards), [cards])
  const rateCard = useSRSStore((state) => state.rateCard)
  const recordRetention = useSRSStore((state) => state.recordRetention)
  const addXp = useProgressStore((state) => state.addXp)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [correct, setCorrect] = useState(0)

  const card = dueCards[index] ?? null
  const remaining = dueCards.length - index

  const badge = useMemo(() => `${dueCards.length} kart bekliyor`, [dueCards.length])

  if (dueCards.length === 0) {
    return (
      <section className="panel review-session review-session--empty">
        <p>Bugün review için kart yok. Okurken kelime kaydedin.</p>
      </section>
    )
  }

  const rate = (quality: SRSRating) => {
    if (!card) {
      return
    }
    const wasCorrect = quality >= 3
    const nextCorrect = wasCorrect ? correct + 1 : correct
    if (wasCorrect) {
      setCorrect(nextCorrect)
    }
    rateCard(card.id, quality)
    setFlipped(false)
    if (index + 1 >= dueCards.length) {
      const ratePct = Math.round((nextCorrect / Math.max(dueCards.length, 1)) * 100)
      recordRetention(ratePct)
      addXp({ type: 'dailyGoalReached' })
      setIndex(0)
      setCorrect(0)
    } else {
      setIndex((value) => value + 1)
    }
  }

  return (
    <section className="panel review-session" aria-labelledby="review-title">
      <header className="panel-heading">
        <div>
          <p className="eyebrow">SRS</p>
          <h2 id="review-title">Günlük tekrar</h2>
        </div>
        <span className="count-pill">{badge}</span>
      </header>

      {card ? (
        <article className="review-card">
          <p className="review-card__meta">
            {card.skill} · {card.cefrLevel} · {remaining} kaldı
          </p>
          <button type="button" className="review-card__face" onClick={() => setFlipped((value) => !value)}>
            {flipped ? card.back : card.front}
          </button>
          <div className="review-card__rates">
            {[1, 3, 5].map((quality) => (
              <button key={quality} type="button" onClick={() => rate(quality as SRSRating)}>
                {quality === 1 ? 'Zor' : quality === 3 ? 'İyi' : 'Kolay'}
              </button>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  )
}
