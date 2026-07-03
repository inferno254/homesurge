export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  geminiKey: import.meta.env.VITE_GEMINI_API_KEY ?? '',
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN ?? '',
  publicPhone: import.meta.env.VITE_HOMESURGE_PUBLIC_PHONE ?? '',
  whatsappUrl: import.meta.env.VITE_HOMESURGE_WHATSAPP_URL ?? '',
  groqKey: import.meta.env.VITE_GROQ_API_KEY ?? '',
  moondreamKey: import.meta.env.VITE_MOONDREAM_API_KEY ?? '',
  tavilyKey: import.meta.env.VITE_TAVILY_API_KEY ?? '',
  deepseekKey: import.meta.env.VITE_DEEPSEEK_API_KEY ?? '',
  mistralKey: import.meta.env.VITE_MISTRAL_API_KEY ?? '',
  openrouterKey: import.meta.env.VITE_OPENROUTER_API_KEY ?? '',
}

export function supabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey)
}
