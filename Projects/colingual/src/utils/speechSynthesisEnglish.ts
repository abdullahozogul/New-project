/** Tarayıcı TTS — İngilizce ses seçimi (cloud API yokken veya yedek). */
export function pickEnglishSpeechVoice(): SpeechSynthesisVoice | undefined {
  if (!('speechSynthesis' in window)) {
    return undefined
  }

  const voices = window.speechSynthesis.getVoices()
  const preferred =
    voices.find((voice) => voice.lang === 'en-US' && /google|natural|online/i.test(voice.name)) ??
    voices.find((voice) => voice.lang === 'en-US') ??
    voices.find((voice) => voice.lang.startsWith('en-')) ??
    voices.find((voice) => voice.lang.startsWith('en'))

  return preferred
}

export function speakEnglishWithBrowserPromise(
  text: string,
  options?: { rate?: number },
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('speech_synthesis_unavailable'))
      return
    }

    window.speechSynthesis.cancel()

    const run = () => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = options?.rate ?? 1
      const voice = pickEnglishSpeechVoice()
      if (voice) {
        utterance.voice = voice
      }
      utterance.onend = () => resolve()
      utterance.onerror = () => reject(new Error('speech_synthesis_error'))
      window.speechSynthesis.speak(utterance)
    }

    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null
        run()
      }
      return
    }

    run()
  })
}

export function speakEnglishWithBrowser(
  text: string,
  options?: { rate?: number; onEnded?: () => void },
): void {
  if (!('speechSynthesis' in window)) {
    return
  }

  window.speechSynthesis.cancel()

  const run = () => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = options?.rate ?? 1
    const voice = pickEnglishSpeechVoice()
    if (voice) {
      utterance.voice = voice
    }
    utterance.onend = () => options?.onEnded?.()
    window.speechSynthesis.speak(utterance)
  }

  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null
      run()
    }
    return
  }

  run()
}

export async function speakEnglishChunksWithBrowser(
  chunks: string[],
  options?: { rate?: number; onEnded?: () => void; signal?: AbortSignal },
): Promise<void> {
  for (const chunk of chunks) {
    if (options?.signal?.aborted) {
      return
    }
    await speakEnglishWithBrowserPromise(chunk, { rate: options?.rate })
  }
  if (!options?.signal?.aborted) {
    options?.onEnded?.()
  }
}
