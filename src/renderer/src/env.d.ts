/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_AI_BASE_URL?: string
  readonly VITE_AI_API_KEYS?: string
  readonly VITE_AI_API_KEY?: string
  readonly VITE_AI_MODEL_NAME?: string
  readonly VITE_APP_URL?: string
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string
  readonly VITE_RESEND_API_KEY?: string
  readonly VITE_RESEND_FROM_EMAIL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
