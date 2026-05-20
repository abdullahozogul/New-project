import { handleExternalLinkClick } from '../../lib/openExternalLink'

type StorySourceCitationProps = {
  sourceName?: string
  sourceUrl?: string
  isLive?: boolean
}

export function StorySourceCitation({
  sourceName,
  sourceUrl,
  isLive,
}: StorySourceCitationProps) {
  const publisher = sourceName?.trim() || (isLive ? undefined : 'Colingual')
  const showSampleNote = !isLive && !sourceUrl

  if (!publisher && !sourceUrl) {
    return null
  }

  return (
    <footer className="story-source-citation" aria-label="Kaynakça">
      <p className="story-source-citation__heading">Kaynakça</p>
      <p className="story-source-citation__body">
        {publisher ? <span>{publisher}</span> : null}
        {sourceUrl ? (
          <>
            {publisher ? ' · ' : null}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => handleExternalLinkClick(event, sourceUrl)}
            >
              Orijinal makale
            </a>
          </>
        ) : null}
        {showSampleNote ? (
          <span className="story-source-citation__note"> · Eğitim amaçlı örnek metin</span>
        ) : null}
      </p>
    </footer>
  )
}
