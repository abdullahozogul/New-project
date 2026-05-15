/** Default model for Colingual AI coach — Google Gemini 2.5 Flash. */
export const GEMINI_MODEL_DEFAULT = 'gemini-2.5-flash'

export function resolveGeminiModel(): string {
  const fromEnv = import.meta.env.VITE_GEMINI_MODEL?.trim()
  return fromEnv || GEMINI_MODEL_DEFAULT
}

export type CoachTurn = { role: 'coach' | 'learner'; text: string }

export type CoachContext = {
  nativeLanguageLabel: string
  targetLanguageLabel: string
  level: string
  goal: string
  articleTitle: string
}

function canUseBrowserGeminiKey(): boolean {
  return Boolean(import.meta.env.DEV && import.meta.env.VITE_GEMINI_API_KEY?.trim())
}

export function isGeminiAiConfigured(): boolean {
  return Boolean(
    canUseBrowserGeminiKey() ||
      import.meta.env.VITE_AI_ASSISTANT_ENDPOINT?.trim(),
  )
}

function buildSystemInstruction(context: CoachContext): string {
  return [
    'You are Colingual, a supportive language coach.',
    `The learner's native language is ${context.nativeLanguageLabel}.`,
    `They are learning ${context.targetLanguageLabel} at CEFR level ${context.level}.`,
    `Their stated goal: ${context.goal}.`,
    `They are currently reading: "${context.articleTitle}".`,
    'Respond in the TARGET language when giving examples or corrections, unless you briefly clarify in the native language when helpful.',
    'Be concise: correct gently, suggest one improved sentence when useful, and ask one short follow-up.',
  ].join(' ')
}

function toGeminiContents(turns: CoachTurn[]): { role: string; parts: { text: string }[] }[] {
  const contents: { role: string; parts: { text: string }[] }[] = []

  for (const turn of turns) {
    const role = turn.role === 'learner' ? 'user' : 'model'
    contents.push({ role, parts: [{ text: turn.text }] })
  }

  if (contents.length === 0) {
    return contents
  }

  // Gemini expects a user turn first; if the transcript starts with the coach, seed a minimal user turn.
  if (contents[0].role === 'model') {
    contents.unshift({ role: 'user', parts: [{ text: '(Conversation started.)' }] })
  }

  return contents
}

async function generateViaGoogleAiStudio(
  model: string,
  systemInstruction: string,
  contents: { role: string; parts: { text: string }[] }[],
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('missing_api_key')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 1024,
      },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`gemini_http_${response.status}: ${errText.slice(0, 200)}`)
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
    error?: { message?: string }
  }

  if (data.error?.message) {
    throw new Error(data.error.message)
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  if (!text.trim()) {
    throw new Error('empty_response')
  }

  return text.trim()
}

async function generateViaAssistantProxy(
  model: string,
  systemInstruction: string,
  contents: { role: string; parts: { text: string }[] }[],
): Promise<string> {
  const endpoint = import.meta.env.VITE_AI_ASSISTANT_ENDPOINT?.trim()
  if (!endpoint) {
    throw new Error('missing_proxy')
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`proxy_http_${response.status}: ${errText.slice(0, 200)}`)
  }

  const raw = (await response.json()) as { reply?: string; text?: string; message?: string }
  const text = raw.reply ?? raw.text ?? raw.message ?? ''
  if (!text.trim()) {
    throw new Error('empty_proxy_response')
  }

  return text.trim()
}

/**
 * Calls Gemini **gemini-2.5-flash** (unless overridden by `VITE_GEMINI_MODEL`).
 * Configure either `VITE_AI_ASSISTANT_ENDPOINT` (your server forwards to Gemini with the same model id)
 * or `VITE_GEMINI_API_KEY` for local Vite dev only. Production builds never call Gemini
 * directly from the browser because VITE_ values are public client configuration.
 */
export async function generateCoachReply(
  turns: CoachTurn[],
  context: CoachContext,
): Promise<string> {
  const model = resolveGeminiModel()
  const systemInstruction = buildSystemInstruction(context)
  const contents = toGeminiContents(turns)

  const proxyUrl = import.meta.env.VITE_AI_ASSISTANT_ENDPOINT?.trim()
  if (proxyUrl) {
    return generateViaAssistantProxy(model, systemInstruction, contents)
  }

  if (!canUseBrowserGeminiKey()) {
    throw new Error('browser_gemini_key_disabled')
  }

  return generateViaGoogleAiStudio(model, systemInstruction, contents)
}

export function offlineCoachFallback(learnerText: string): string {
  return `Try this refined version: "${learnerText.replace(/\bi\b/g, 'I')}" Add one detail from the article and one opinion to make the answer stronger.`
}
