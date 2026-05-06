/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_NEWS_SOURCE_ENDPOINT?: string
  readonly VITE_AI_ASSISTANT_ENDPOINT?: string
  readonly VITE_TTS_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
