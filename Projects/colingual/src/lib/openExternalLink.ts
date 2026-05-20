import type { MouseEvent } from 'react'
import { isNativePlatform } from './platform'

export type OpenExternalLinkOptions = {
  presentationStyle?: 'fullscreen' | 'popover'
}

type CapacitorBrowserModule = {
  Browser: {
    open: (opts: { url: string; presentationStyle?: 'fullscreen' | 'popover' }) => Promise<void>
  }
}

/** Dynamic import so web builds work before @capacitor/browser is installed. */
async function openWithCapacitorBrowser(
  url: string,
  options?: OpenExternalLinkOptions,
): Promise<boolean> {
  try {
    const pluginId = '@capacitor/browser'
    const module = (await import(
      /* @vite-ignore */ pluginId
    )) as CapacitorBrowserModule
    await module.Browser.open({
      url,
      presentationStyle: options?.presentationStyle,
    })
    return true
  } catch {
    return false
  }
}

export async function openExternalLink(
  url: string,
  options?: OpenExternalLinkOptions,
): Promise<void> {
  const trimmed = url.trim()
  if (!trimmed) {
    return
  }

  if (isNativePlatform()) {
    const opened = await openWithCapacitorBrowser(trimmed, options)
    if (opened) {
      return
    }
  }

  window.open(trimmed, '_blank', 'noopener,noreferrer')
}

/** Left-click handler for external `<a href>` — keeps href for accessibility/SEO. */
export function handleExternalLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  url: string,
  options?: OpenExternalLinkOptions,
): void {
  if (event.defaultPrevented || event.button !== 0) {
    return
  }
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }

  event.preventDefault()
  void openExternalLink(url, options)
}
