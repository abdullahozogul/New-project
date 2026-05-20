const DB_NAME = 'colingual-tts-cache'
const STORE_NAME = 'audio'
const TTL_MS = 7 * 24 * 60 * 60 * 1000

function hashText(text: string): string {
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function cacheKey(text: string, lang: string, voice: string, useCase: string): string {
  return `${useCase}::${lang}::${voice}::${hashText(text.trim())}`
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'key' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getCachedAudio(
  text: string,
  lang: string,
  voice: string,
  useCase: string,
): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(cacheKey(text, lang, voice, useCase))
      req.onsuccess = () => {
        const entry = req.result as { audioData: ArrayBuffer; timestamp: number } | undefined
        if (!entry || Date.now() - entry.timestamp > TTL_MS) {
          resolve(null)
          return
        }
        resolve(entry.audioData)
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function setCachedAudio(
  text: string,
  lang: string,
  voice: string,
  useCase: string,
  audioData: ArrayBuffer,
): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put({
        key: cacheKey(text, lang, voice, useCase),
        audioData,
        timestamp: Date.now(),
      })
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    // ignore cache write failures
  }
}
