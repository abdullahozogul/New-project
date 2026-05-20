import { isAuthCallbackUrl, setPendingAuthCallbackUrl } from './authCallback'
import { isNative } from './platform'

type CapacitorAppModule = {
  App: {
    addListener: (
      event: 'appUrlOpen',
      handler: (event: { url: string }) => void,
    ) => Promise<{ remove: () => void }>
    getLaunchUrl: () => Promise<{ url: string } | undefined>
  }
}

let callbackHandler: ((url: string) => void) | null = null

/** React (or bootstrap) can apply the session when a deep link arrives mid-session. */
export function registerMobileAuthCallbackHandler(handler: (url: string) => void): () => void {
  callbackHandler = handler
  return () => {
    if (callbackHandler === handler) {
      callbackHandler = null
    }
  }
}

function dispatchAuthCallback(url: string): void {
  setPendingAuthCallbackUrl(url)
  callbackHandler?.(url)
}

async function loadCapacitorApp(): Promise<CapacitorAppModule | null> {
  try {
    const pluginId = '@capacitor/app'
    return (await import(/* @vite-ignore */ pluginId)) as CapacitorAppModule
  } catch {
    return null
  }
}

/**
 * Registers native deep-link handlers for Supabase OAuth return URLs.
 * Call once from `main.tsx` before React mounts.
 */
export function initMobileAuthListener(): void {
  if (!isNative()) {
    return
  }

  void loadCapacitorApp().then((module) => {
    if (!module) {
      return
    }

    void module.App.addListener('appUrlOpen', (event) => {
      if (!isAuthCallbackUrl(event.url)) {
        return
      }
      dispatchAuthCallback(event.url)
    })

    void module.App.getLaunchUrl().then((launch) => {
      const url = launch?.url
      if (url && isAuthCallbackUrl(url)) {
        dispatchAuthCallback(url)
      }
    })
  })
}
