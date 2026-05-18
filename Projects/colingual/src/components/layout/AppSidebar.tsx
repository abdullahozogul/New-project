import { Languages, UserRound } from 'lucide-react'
import { PRIMARY_NAV } from '../../config/navigation'
import type { AppView } from '../../config/navigation'

type AppSidebarProps = {
  activeView: AppView
  supabaseConfigured: boolean
  userLabel: string
  userMeta: string
}

export function AppSidebar({
  activeView,
  supabaseConfigured,
  userLabel,
  userMeta,
}: AppSidebarProps) {
  return (
    <aside className="sidebar" aria-label="Ana menü">
      <div className="brand">
        <div className="brand-mark">
          <Languages size={24} aria-hidden="true" />
        </div>
        <div>
          <strong>Colingual</strong>
          <span>Okuma odaklı dil öğrenme</span>
        </div>
      </div>

      <nav className="nav-list nav-list--primary">
        {PRIMARY_NAV.map((item) => (
          <a
            key={item.view}
            href={item.hash}
            className={activeView === item.view ? 'nav-active' : undefined}
            aria-current={activeView === item.view ? 'page' : undefined}
          >
            <item.icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="sync-card">
        <span className={supabaseConfigured ? 'status-dot online' : 'status-dot'} />
        <div>
          <strong>{supabaseConfigured ? 'Bağlı' : 'Çevrimdışı'}</strong>
          <span>{supabaseConfigured ? 'Hesap senkronu' : 'Örnek içerik'}</span>
        </div>
      </div>

      <div className="sidebar-footer-user">
        <div className="sidebar-footer-avatar" aria-hidden="true">
          <UserRound size={20} aria-hidden="true" />
        </div>
        <div className="sidebar-footer-meta">
          <strong>{userLabel}</strong>
          <span>{userMeta}</span>
        </div>
      </div>
    </aside>
  )
}
