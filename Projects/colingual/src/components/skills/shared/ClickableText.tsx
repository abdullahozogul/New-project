import type { MouseEvent } from 'react'
import { extractLexeme, isWordToken, tokenizeClickableText } from '../../../utils/wordTokens'

type ClickableTextProps = {
  text: string
  onWordClick?: (word: string) => void
  onWordContextMenu?: (word: string, event: MouseEvent) => void
}

export function ClickableText({ text, onWordClick, onWordContextMenu }: ClickableTextProps) {
  const tokens = tokenizeClickableText(text)

  return (
    <>
      {tokens.map((token, index) => {
        if (!isWordToken(token)) {
          return <span key={`${token}-${index}`}>{token}</span>
        }

        const lexeme = extractLexeme(token)
        if (!lexeme) {
          return <span key={`${token}-${index}`}>{token}</span>
        }

        return (
          <button
            key={`${token}-${index}`}
            type="button"
            className="inline-word"
            data-word={lexeme}
            onClick={() => onWordClick?.(lexeme)}
            onContextMenu={(event) => {
              if (onWordContextMenu) {
                event.preventDefault()
                onWordContextMenu(lexeme, event)
              }
            }}
            aria-label={`${lexeme} — sözlük`}
          >
            {token}
          </button>
        )
      })}
    </>
  )
}
