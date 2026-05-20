import { apiFetch, resolveApiUrl } from './apiClient'
import { isGeminiQuotaBlocked, markGeminiQuotaExceeded } from './geminiQuota'

/** Default model for Colingual AI — Google Gemini 2.5 Flash. */
export const GEMINI_MODEL_DEFAULT = 'gemini-2.5-flash'

function noteGeminiRateLimit(status: number, errText: string): void {
  if (status === 429 || errText.includes('quota') || errText.includes('RESOURCE_EXHAUSTED')) {
    markGeminiQuotaExceeded()
  }
}
export function resolveGeminiModel(): string {
  const fromEnv = import.meta.env.VITE_GEMINI_MODEL?.trim()
  return fromEnv || GEMINI_MODEL_DEFAULT
}

export type GeminiContent = { role: string; parts: { text: string }[] }

function devGeminiProxyEndpoint(): string | null {
  if (!import.meta.env.DEV) {
    return null
  }
  return resolveApiUrl('/gemini/generate')
}

export function isGeminiConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_GEMINI_API_KEY?.trim() ||
      import.meta.env.VITE_AI_ASSISTANT_ENDPOINT?.trim() ||
      devGeminiProxyEndpoint(),
  )
}

async function generateViaGoogleAiStudio(
  model: string,
  systemInstruction: string,
  contents: GeminiContent[],
  generationConfig?: Record<string, unknown>,
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
        temperature: 0.55,
        maxOutputTokens: 8192,
        ...generationConfig,
      },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    noteGeminiRateLimit(response.status, errText)
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
  contents: GeminiContent[],
  generationConfig?: Record<string, unknown>,
): Promise<string> {
  const endpoint =
    import.meta.env.VITE_AI_ASSISTANT_ENDPOINT?.trim() || devGeminiProxyEndpoint() || ''
  if (!endpoint) {
    throw new Error('missing_proxy')
  }

  const response = await apiFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    noteGeminiRateLimit(response.status, errText)
    throw new Error(`proxy_http_${response.status}: ${errText.slice(0, 200)}`)
  }

  const raw = (await response.json()) as {
    reply?: string
    text?: string
    message?: string
    candidates?: { content?: { parts?: { text?: string }[] } }[]
    error?: { message?: string }
  }

  if (raw.error?.message) {
    throw new Error(raw.error.message)
  }

  const fromCandidates =
    raw.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? ''
  const text = raw.reply ?? raw.text ?? raw.message ?? fromCandidates
  if (!text.trim()) {
    throw new Error('empty_proxy_response')
  }

  return text.trim()
}

export async function generateGeminiText(
  systemInstruction: string,
  userPrompt: string,
  generationConfig?: Record<string, unknown>,
): Promise<string> {
  return generateGeminiContents(
    systemInstruction,
    [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig,
  )
}

export async function generateGeminiContents(
  systemInstruction: string,
  contents: GeminiContent[],
  generationConfig?: Record<string, unknown>,
): Promise<string> {
  if (isGeminiQuotaBlocked()) {
    throw new Error('gemini_quota_blocked')
  }

  const model = resolveGeminiModel()
  const proxyUrl =
    import.meta.env.VITE_AI_ASSISTANT_ENDPOINT?.trim() || devGeminiProxyEndpoint() || ''

  if (proxyUrl) {
    return generateViaAssistantProxy(model, systemInstruction, contents, generationConfig)
  }

  return generateViaGoogleAiStudio(model, systemInstruction, contents, generationConfig)
}

function extractJsonObject(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    return fenced[1].trim()
  }

  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return raw.slice(start, end + 1)
  }

  return raw.trim()
}

export async function generateGeminiJson<T>(
  systemInstruction: string,
  userPrompt: string,
  generationConfig?: Record<string, unknown>,
): Promise<T> {
  const text = await generateGeminiText(
    `${systemInstruction}\nRespond with valid JSON only. No markdown fences or commentary.`,
    userPrompt,
    {
      responseMimeType: 'application/json',
      ...generationConfig,
    },
  )

  return JSON.parse(extractJsonObject(text)) as T
}
