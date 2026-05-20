import { colingualEcosystemNotes } from '../../config/learningEcosystem'
import { handleExternalLinkClick } from '../../lib/openExternalLink'

export function LearningEcosystemPanel() {
  return (
    <section className="panel ecosystem-panel" id="ecosystem" aria-labelledby="ecosystem-title">
      <header className="panel-heading">
        <div>
          <p className="eyebrow">language-learning-apps · ai-education</p>
          <h2 id="ecosystem-title">Colingual nerede duruyor?</h2>
          <p className="ecosystem-lead">
            Popüler uygulamalarla rekabet etmek yerine onları tamamlar — haber, CEFR ve AI koç
            odaklı katman.
          </p>
        </div>
      </header>
      <ul className="ecosystem-list">
        {colingualEcosystemNotes.map((app) => (
          <li key={app.name}>
            <strong>{app.name}</strong>
            <span>{app.focus}</span>
            <p>{app.colingualRole}</p>
          </li>
        ))}
      </ul>
      <p className="ecosystem-foot">
        Kaynak:{' '}
        <a
          href="https://github.com/bj36272/language-learning-apps"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) =>
            handleExternalLinkClick(event, 'https://github.com/bj36272/language-learning-apps')
          }
        >
          language-learning-apps
        </a>
        {' · '}
        <a
          href="https://github.com/topics/ai-education"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) =>
            handleExternalLinkClick(event, 'https://github.com/topics/ai-education')
          }
        >
          ai-education
        </a>
      </p>
    </section>
  )
}
