import { ClickableText } from '../shared/ClickableText'
import './TranscriptViewer.css'

type TranscriptViewerProps = {
  paragraphs: string[]
  activeWord?: string | null
  onWordClick?: (word: string) => void
  onSeekParagraph?: (index: number) => void
}

export function TranscriptViewer({
  paragraphs,
  activeWord,
  onWordClick,
  onSeekParagraph,
}: TranscriptViewerProps) {
  return (
    <div className="transcript-viewer" aria-label="Transkript">
      {paragraphs.map((paragraph, index) => (
        <p
          key={paragraph.slice(0, 40)}
          className={activeWord && paragraph.includes(activeWord) ? 'transcript-viewer__p--active' : ''}
        >
          <button
            type="button"
            className="transcript-viewer__seek"
            onClick={() => onSeekParagraph?.(index)}
            aria-label={`Paragraf ${index + 1}`}
          >
            §
          </button>
          <ClickableText text={paragraph} onWordClick={onWordClick} />
        </p>
      ))}
    </div>
  )
}
