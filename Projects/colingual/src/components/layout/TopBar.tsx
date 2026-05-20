import { useEffect, useState } from 'react'
import { Bell, Languages, Moon, Search, Sun } from 'lucide-react'
import { StreakDisplay } from '../gamification/StreakDisplay'
import { XPBar } from '../gamification/XPBar'
import { handleExternalLinkClick } from '../../lib/openExternalLink'
import './TopBar.css'

const CEFR_LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1'])

export type Profile = {
  level: string
  targetLanguageLabel: string
  displayName?: string
  email?: string
  avatarUrl?: string | null
}

export type TopBarProps = {
  profile: Profile
  /** When true, hides the upgrade CTA for signed-in users. */
  isPremium?: boolean
  authenticated: boolean
  premiumCheckoutUrl?: string | null
  onGoogleSignIn?: () => void
  googleSignInDisabled?: boolean
  plansHref?: string
  onNotificationClick?: () => void
  onSignOut?: () => void
}

function levelBadgeClassName(level: string) {
  const key = CEFR_LEVELS.has(level) ? level : 'B1'
  return `topbar-level-badge topbar-level-badge--${key}`
}

export function TopBar({
  profile,
  isPremium = false,
  authenticated,
  premiumCheckoutUrl,
  onGoogleSignIn,
  googleSignInDisabled,
  plansHref = '#pricing',
  onNotificationClick,
  onSignOut,
}: TopBarProps) {
  const [themeDark, setThemeDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (themeDark) {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }
  }, [themeDark])

  const initial = (profile.displayName?.trim() || profile.email?.trim() || 'U')
    .charAt(0)
    .toUpperCase()

  const showUpgrade = authenticated && !isPremium

  return (
    <div
      className={`topbar-saas${themeDark ? ' topbar-saas--dark' : ''}`}
      id="profile"
    >
      <div className="topbar-saas__inner">
        <a href="#home" className="topbar-saas__brand">
          <span className="topbar-saas__logo-mark">
            <Languages size={22} aria-hidden="true" />
          </span>
          <span className="topbar-saas__brand-name">Colingual</span>
        </a>

        <div className="topbar-saas__center">
          <StreakDisplay />
          <XPBar />
          <div className="topbar-saas__search" role="search">
            <Search
              size={18}
              aria-hidden="true"
              className="topbar-saas__search-icon"
            />
            <input
              type="search"
              readOnly
              placeholder="Ara…"
              aria-label="Arama (yakında)"
              className="topbar-saas__search-input"
            />
          </div>
        </div>

        <div className="topbar-saas__right">
          {!authenticated ? (
            <div className="topbar-saas__guest-actions">
              <button
                type="button"
                className="topbar-btn topbar-btn--ghost"
                onClick={() => onGoogleSignIn?.()}
                disabled={googleSignInDisabled}
              >
                Google ile Giriş
              </button>
              {premiumCheckoutUrl ? (
                <a
                  href={premiumCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="topbar-btn topbar-btn--premium-ls"
                  onClick={(event) => handleExternalLinkClick(event, premiumCheckoutUrl)}
                >
                  Premium (Lemon Squeezy)
                </a>
              ) : (
                <span
                  className="topbar-btn topbar-btn--premium-ls topbar-btn--premium-ls-disabled"
                  aria-disabled="true"
                >
                  Premium (Lemon Squeezy)
                </span>
              )}
              <a href={plansHref} className="topbar-saas__plans-link">
                Planları Gör
              </a>
            </div>
          ) : (
            <div className="topbar-saas__user-actions">
              {showUpgrade &&
                (premiumCheckoutUrl ? (
                  <a
                    href={premiumCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="topbar-upgrade-pill"
                    onClick={(event) => handleExternalLinkClick(event, premiumCheckoutUrl)}
                  >
                    <span className="topbar-upgrade-pill__spark" aria-hidden="true">
                      ✦
                    </span>
                    <span>Premium&apos;a Yükselt</span>
                  </a>
                ) : (
                  <span className="topbar-upgrade-pill topbar-upgrade-pill--ghost">
                    <span className="topbar-upgrade-pill__spark" aria-hidden="true">
                      ✦
                    </span>
                    <span>Premium&apos;a Yükselt</span>
                  </span>
                ))}
              <div className="topbar-saas__user-meta">
                <div className="topbar-saas__avatar">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      className="topbar-saas__avatar-img"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="topbar-saas__avatar-fallback">{initial}</span>
                  )}
                </div>
                <span className={levelBadgeClassName(profile.level)}>
                  {profile.level}
                </span>
                <span className="topbar-saas__lang">
                  {profile.targetLanguageLabel}
                </span>
              </div>
              {onSignOut ? (
                <button type="button" className="topbar-saas__signout" onClick={onSignOut}>
                  Çıkış
                </button>
              ) : null}
            </div>
          )}

          <button
            type="button"
            className="topbar-icon-btn"
            aria-label="Bildirimler"
            onClick={() => onNotificationClick?.()}
          >
            <Bell size={20} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="topbar-icon-btn"
            aria-label={themeDark ? 'Açık tema' : 'Koyu tema'}
            onClick={() => setThemeDark((value) => !value)}
          >
            {themeDark ? (
              <Sun size={20} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Moon size={20} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
