import type { ReactNode } from 'react'
import type { CEFRLevel } from '../../../types'
import { readingTypographyForLevel } from '../../../utils/cefrUtils'
import { ClickableText } from '../shared/ClickableText'
import './ReadingPassage.css'

type ReadingPassageProps = {
  level: CEFRLevel
  paragraphs: string[]
  onWordClick?: (word: string) => void
  onAskAi?: (word: string) => void
  renderExtra?: (paragraph: string) => ReactNode
}

export function ReadingPassage({
  level,
  paragraphs,
  onWordClick,
  onAskAi,
  renderExtra,
}: ReadingPassageProps) {
  const typography = readingTypographyForLevel(level)

  return (
    <div
      className="reading-passage"
      style={{ fontSize: typography.fontSize, lineHeight: typography.lineHeight }}
    >
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 48)} className="reading-passage__p">
          <ClickableText
            text={paragraph}
            onWordClick={onWordClick}
            onWordContextMenu={(word, event) => {
              if (onAskAi && event.shiftKey) {
                event.preventDefault()
                onAskAi(word)
              }
            }}
          />
          {renderExtra?.(paragraph)}
        </p>
      ))}
    </div>
  )
}
