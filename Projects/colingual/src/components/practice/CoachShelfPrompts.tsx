import type { ShelfItem } from '../../lib/scholarShelf'
import { shelfCoachPrompts } from '../../lib/scholarShelf'

type CoachShelfPromptsProps = {
  items: ShelfItem[]
  onPick: (prompt: string) => void
  disabled?: boolean
}

export function CoachShelfPrompts({ items, onPick, disabled }: CoachShelfPromptsProps) {
  if (items.length === 0) {
    return (
      <p className="coach-shelf-hint">
        Rafınız boş. Okumada <strong>Rafa ekle</strong> ile hikâye kaydedin; SchoBot bu metinlere göre
        yanıt verir.
      </p>
    )
  }

  const prompts = shelfCoachPrompts(items)

  return (
    <div className="coach-shelf-prompts" aria-label="Rafınıza göre önerilen sorular">
      <span className="coach-shelf-prompts__label">ScholarShelf önerileri</span>
      <div className="coach-shelf-prompts__list">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="coach-shelf-prompt-btn"
            disabled={disabled}
            onClick={() => onPick(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
