import type { MouseEvent } from 'react'

type ClickableTextProps = {
  text: string
  onWordClick?: (word: string) => void
  onWordContextMenu?: (word: string, event: MouseEvent) => void
}

export function ClickableText({ text, onWordClick, onWordContextMenu }: ClickableTextProps) {
  const tokens =
    text.match(/[A-Za-zÀ-ÖØ-öø-ÿ]+(?:'[A-Za-zÀ-ÖØ-öø-ÿ]+)?|[^A-Za-zÀ-ÖØ-öø-ÿ]+/g) ?? [text]

  return (
    <>
      {tokens.map((token, index) => {
        const isWord = /^[A-Za-zÀ-ÖØ-öø-ÿ]/.test(token)
        if (!isWord) {
          return <span key={`${token}-${index}`}>{token}</span>
        }

        const lexeme = token.replace(/^[^A-Za-zÀ-ÖØ-öø-ÿ]+|[^A-Za-zÀ-ÖØ-öø-ÿ]+$/g, '')
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
