import { BookMarked, BookOpen, ChevronRight, Flame, MapPinned, MessageSquareText } from 'lucide-react'
import type { ProgressMetric } from '../../data'
import { practiceModules } from '../../data'

type HomeViewProps = {
  metrics: ProgressMetric[]
  continueTitle: string
  continueMeta: string
  onContinueRead: () => void
  onOpenPractice: () => void
}

export function HomeView({
  metrics,
  continueTitle,
  continueMeta,
  onContinueRead,
  onOpenPractice,
}: HomeViewProps) {
  return (
    <div className="app-view app-view--home">
      <section className="metric-grid" aria-label="Özet">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <metric.icon size={20} aria-hidden="true" />
            <div>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.change}</small>
            </div>
          </article>
        ))}
      </section>

      <button type="button" className="continue-reading-card" onClick={onContinueRead}>
        <span className="continue-reading-card__icon" aria-hidden="true">
          <BookOpen size={26} />
        </span>
        <span className="continue-reading-card__body">
          <span className="eyebrow">Kaldığın yerden</span>
          <strong>{continueTitle}</strong>
          <em>{continueMeta}</em>
        </span>
        <ChevronRight size={22} aria-hidden="true" />
      </button>

      <div className="home-quick-grid">
        <button type="button" className="home-quick-card" onClick={onContinueRead}>
          <BookOpen size={20} aria-hidden="true" />
          <span>Yeni haber oku</span>
        </button>
        <button type="button" className="home-quick-card" onClick={onOpenPractice}>
          <MessageSquareText size={20} aria-hidden="true" />
          <span>Koç ile yaz</span>
        </button>
        <a href="#library" className="home-quick-card">
          <BookMarked size={20} aria-hidden="true" />
          <span>Kütüphanem</span>
        </a>
        <a href="#progress" className="home-quick-card">
          <MapPinned size={20} aria-hidden="true" />
          <span>Müfredat</span>
        </a>
        <div className="home-quick-card home-quick-card--stat">
          <Flame size={20} aria-hidden="true" />
          <span>14 gün seri</span>
        </div>
      </div>

      <section className="panel home-modules-panel" aria-labelledby="home-modules-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Bu hafta</p>
            <h2 id="home-modules-title">Pratik modülleri</h2>
          </div>
        </div>
        <div className="module-list module-list--compact">
          {practiceModules.map((module) => (
            <article className="module-row" key={module.label}>
              <module.icon size={18} aria-hidden="true" />
              <div>
                <strong>{module.label}</strong>
                <span>{module.detail}</span>
                <div className="progress-track">
                  <span style={{ width: `${module.progress}%` }} />
                </div>
              </div>
              <em>{module.progress}%</em>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
