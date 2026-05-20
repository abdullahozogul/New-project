import type { ReactNode } from 'react'
import { Clock3 } from 'lucide-react'
import type { Level } from '../../data'
import { articleFromBundle, type NewsStoryBundle } from '../../lib/cefrNews'
import { StorySourceCitation } from './StorySourceCitation'
import './CefrLevelsPanel.css'

type CefrLevelsPanelProps = {
  bundle: NewsStoryBundle
  activeLevel: Level
  renderParagraph: (paragraph: string) => ReactNode
}

export function CefrLevelsPanel({ bundle, activeLevel, renderParagraph }: CefrLevelsPanelProps) {
  const variant = articleFromBundle(bundle, activeLevel)

  if (!variant) {
    return null
  }

  const panelId = `cefr-level-panel-${activeLevel}`

  return (
    <section className="cefr-levels-panel" aria-labelledby="cefr-levels-title">
      <header className="cefr-levels-head">
        <div>
          <p className="eyebrow">Seviyeli okuma</p>
          <h3 id="cefr-levels-title">{variant.title}</h3>
          <p className="cefr-levels-lead">{variant.deck}</p>
        </div>
      </header>

      <article
        key={activeLevel}
        id={panelId}
        className={`cefr-level-block cefr-level-block--${activeLevel.toLowerCase()} cefr-level-block--active`}
      >
        <header className="cefr-level-block-head">
          <div className="cefr-level-block-title-row">
            <span className="cefr-level-badge">{activeLevel}</span>
            <span className="cefr-level-meta-pill">
              <Clock3 size={13} aria-hidden="true" />
              {variant.minutes} min
            </span>
          </div>
          {variant.readingPurpose ? (
            <p className="cefr-level-purpose">
              <span className="cefr-level-purpose-label">Okuma amacı</span>
              {variant.readingPurpose}
            </p>
          ) : null}
          {variant.grammarUsed && variant.grammarUsed.length > 0 ? (
            <ul className="cefr-grammar-tags" aria-label={`${activeLevel} dilbilgisi`}>
              {variant.grammarUsed.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </header>
        <div className="cefr-level-body story-copy">
          {variant.paragraphs.map((paragraph) => (
            <div key={`${activeLevel}-${paragraph.slice(0, 24)}`}>
              {renderParagraph(paragraph)}
            </div>
          ))}
          <StorySourceCitation
            sourceName={bundle.sourceName}
            sourceUrl={bundle.sourceUrl}
            isLive={bundle.isLive}
          />
        </div>
      </article>
    </section>
  )
}
