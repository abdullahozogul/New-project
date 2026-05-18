import type { ReactNode } from 'react'
import './FeedbackOverlay.css'

type FeedbackOverlayProps = {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function FeedbackOverlay({ open, title, children, onClose }: FeedbackOverlayProps) {
  if (!open) {
    return null
  }

  return (
    <div className="feedback-overlay" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <button type="button" className="feedback-overlay__backdrop" onClick={onClose} aria-label="Kapat" />
      <aside className="feedback-overlay__panel">
        <header>
          <h3 id="feedback-title">{title}</h3>
          <button type="button" onClick={onClose}>
            Kapat
          </button>
        </header>
        <div className="feedback-overlay__body">{children}</div>
      </aside>
    </div>
  )
}
