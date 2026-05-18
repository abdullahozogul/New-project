import { useCallback, useEffect, useState } from 'react'
import { DEEP_LINK_HASHES, hashForView, resolveAppView, type AppView } from '../config/navigation'

export function useAppNavigation() {
  const [navHash, setNavHash] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash || '#home' : '#home',
  )

  const activeView = resolveAppView(navHash)

  useEffect(() => {
    const syncHash = () => setNavHash(window.location.hash || '#home')
    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const hash = window.location.hash || '#home'
    if (DEEP_LINK_HASHES.has(hash)) {
      const id = hash.slice(1)
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      return
    }
    const canonical = hashForView(resolveAppView(hash))
    if (hash !== canonical) {
      window.history.replaceState(null, '', canonical)
      setNavHash(canonical)
    }
  }, [])

  useEffect(() => {
    if (!DEEP_LINK_HASHES.has(navHash)) {
      return
    }
    const id = navHash.slice(1)
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [navHash, activeView])

  const goToView = useCallback((view: AppView) => {
    const hash = hashForView(view)
    if (window.location.hash !== hash) {
      window.location.hash = hash
    }
    setNavHash(hash)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return { navHash, activeView, goToView, isActive: (view: AppView) => activeView === view }
}
