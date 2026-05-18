import { PRIMARY_NAV } from '../../config/navigation'
import type { AppView } from '../../config/navigation'

type MobileTabBarProps = {
  activeView: AppView
}

export function MobileTabBar({ activeView }: MobileTabBarProps) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobil menü">
      {PRIMARY_NAV.map((item) => (
        <a
          key={item.view}
          href={item.hash}
          className={activeView === item.view ? 'nav-active' : undefined}
          aria-current={activeView === item.view ? 'page' : undefined}
        >
          <item.icon size={22} strokeWidth={2} aria-hidden="true" />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  )
}
