import { Capacitor } from '@capacitor/core'

export type ColingualPlatform = 'web' | 'ios' | 'android'

/** True when running inside a Capacitor native shell (iOS or Android). */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

/** Alias for mobile auth / external-link branching. */
export function isNative(): boolean {
  return isNativePlatform()
}

/** True when running in a browser or Capacitor web view without native APIs. */
export function isWebPlatform(): boolean {
  return !Capacitor.isNativePlatform()
}

export function isIosPlatform(): boolean {
  return Capacitor.getPlatform() === 'ios'
}

export function isAndroidPlatform(): boolean {
  return Capacitor.getPlatform() === 'android'
}

/** `web` in browser; `ios` / `android` in native Capacitor apps. */
export function getColingualPlatform(): ColingualPlatform {
  if (!Capacitor.isNativePlatform()) {
    return 'web'
  }

  const platform = Capacitor.getPlatform()
  if (platform === 'ios' || platform === 'android') {
    return platform
  }

  return 'web'
}
