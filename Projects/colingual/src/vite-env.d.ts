/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_NEWS_SOURCE_ENDPOINT?: string
  readonly VITE_AI_ASSISTANT_ENDPOINT?: string
  /** Dev-only: exposes key to the browser. Prefer `VITE_AI_ASSISTANT_ENDPOINT` in production. */
  readonly VITE_GEMINI_API_KEY?: string
  /** Override Gemini model id (default: gemini-2.5-flash). */
  readonly VITE_GEMINI_MODEL?: string
  readonly VITE_TTS_ENDPOINT?: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string
  /** Public site URL (dev server or production), e.g. Stripe return URLs */
  readonly VITE_APP_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
