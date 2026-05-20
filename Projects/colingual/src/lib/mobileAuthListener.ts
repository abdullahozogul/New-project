import { isNative } from './platform'

/**
 * Registers native deep-link handlers for Supabase OAuth return URLs.
 * Call from `main.tsx` once @capacitor/app is installed.
 */
export function initMobileAuthListener(): void {
  if (!isNative()) {
    return
  }

  // Will be implemented after @capacitor/app is installed
}
