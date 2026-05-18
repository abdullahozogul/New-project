import { BookMarked, BookOpen, Trash2 } from 'lucide-react'
import type { ShelfItem } from '../../lib/scholarShelf'

type ScholarShelfPanelProps = {
  items: ShelfItem[]
  activeStoryKey: string | null
  onOpen: (storyKey: string) => void
  onRemove: (storyKey: string) => void
}

export function ScholarShelfPanel({
  items,
  activeStoryKey,
  onOpen,
  onRemove,
}: ScholarShelfPanelProps) {
  return (
    <section className="panel scholar-shelf-panel" id="library" aria-labelledby="shelf-title">
      <header className="panel-heading">
        <div>
          <p className="eyebrow">ScholarShelf</p>
          <h2 id="shelf-title">Kütüphanem</h2>
          <p className="scholar-shelf-lead">
            Kaydettiğiniz hikâyeler burada durur. Koç, rafınızdaki metinlere göre yanıt verir.
          </p>
        </div>
        <BookMarked size={20} aria-hidden="true" />
      </header>

      {items.length === 0 ? (
        <p className="scholar-shelf-empty">
          Henüz hikâye yok. Okuma masasında <strong>Rafa ekle</strong> ile kaydedin.
        </p>
      ) : (
        <ul className="scholar-shelf-list">
          {items.map((item) => (
            <li key={item.storyKey}>
              <button
                type="button"
                className={
                  item.storyKey === activeStoryKey ?
                    'scholar-shelf-row scholar-shelf-row--active'
                  : 'scholar-shelf-row'
                }
                onClick={() => onOpen(item.storyKey)}
              >
                <span className="scholar-shelf-row__icon" aria-hidden="true">
                  <BookOpen size={20} />
                </span>
                <span className="scholar-shelf-row__body">
                  <small>
                    {item.category}
                    {item.isLive ? ' • Canlı' : ''}
                    {item.lastLevel ? ` • ${item.lastLevel}` : ''}
                  </small>
                  <strong>{item.title}</strong>
                </span>
              </button>
              <button
                type="button"
                className="scholar-shelf-remove"
                aria-label={`${item.title} rafından kaldır`}
                onClick={() => onRemove(item.storyKey)}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
