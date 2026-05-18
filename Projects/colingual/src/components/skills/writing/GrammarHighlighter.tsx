import type { GrammarIssue } from '../../../types'
import './GrammarHighlighter.css'

type GrammarHighlighterProps = {
  text: string
  issues: GrammarIssue[]
}

const CATEGORY_CLASS: Record<GrammarIssue['category'], string> = {
  grammar: 'grammar-issue--grammar',
  vocabulary: 'grammar-issue--vocab',
  coherence: 'grammar-issue--coherence',
}

export function GrammarHighlighter({ text, issues }: GrammarHighlighterProps) {
  if (issues.length === 0 || !text.trim()) {
    return null
  }

  return (
    <ul className="grammar-highlighter" aria-label="Dilbilgisi geri bildirimi">
      {issues.map((issue, index) => (
        <li key={`${issue.span}-${index}`} className={CATEGORY_CLASS[issue.category]}>
          <strong>{issue.span}</strong>
          <span>{issue.message}</span>
        </li>
      ))}
    </ul>
  )
}
