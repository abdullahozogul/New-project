import { useState } from 'react'
import { Highlighter } from 'lucide-react'
import './AnnotationLayer.css'

export type ReadingNote = {
  id: string
  quote: string
  note: string
  createdAt: string
}

type AnnotationLayerProps = {
  notes: ReadingNote[]
  onAddNote: (quote: string, note: string) => void
  onRemoveNote: (id: string) => void
}

export function AnnotationLayer({ notes, onAddNote, onRemoveNote }: AnnotationLayerProps) {
  const [draftQuote, setDraftQuote] = useState('')
  const [draftNote, setDraftNote] = useState('')

  const submit = () => {
    const quote = draftQuote.trim()
    const note = draftNote.trim()
    if (!quote || !note) {
      return
    }
    onAddNote(quote, note)
    setDraftQuote('')
    setDraftNote('')
  }

  return (
    <aside className="annotation-layer" aria-label="Okuma notları">
      <header>
        <Highlighter size={16} aria-hidden="true" />
        <strong>Notlar</strong>
        <span>{notes.length}</span>
      </header>

      <div className="annotation-layer__form">
        <input
          type="text"
          placeholder="İşaretlenen ifade"
          value={draftQuote}
          onChange={(event) => setDraftQuote(event.target.value)}
          aria-label="Alıntı"
        />
        <textarea
          placeholder="Notunuz"
          value={draftNote}
          onChange={(event) => setDraftNote(event.target.value)}
          rows={2}
          aria-label="Not metni"
        />
        <button type="button" onClick={submit}>
          Not ekle
        </button>
      </div>

      <ul className="annotation-layer__list">
        {notes.map((item) => (
          <li key={item.id}>
            <blockquote>{item.quote}</blockquote>
            <p>{item.note}</p>
            <button type="button" onClick={() => onRemoveNote(item.id)}>
              Sil
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
