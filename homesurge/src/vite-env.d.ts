/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_MAPBOX_TOKEN: string
  readonly VITE_HOMESURGE_PUBLIC_PHONE: string
  readonly VITE_HOMESURGE_WHATSAPP_URL: string
  readonly VITE_GROQ_API_KEY: string
  readonly VITE_MOONDREAM_API_KEY: string
  readonly VITE_TAVILY_API_KEY: string
  readonly DEEPSEEK_API_KEY?: string
  readonly MISTRAL_API_KEY?: string
  readonly OPENROUTER_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
