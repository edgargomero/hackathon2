/**
 * Cloudflare Workers Environment Bindings
 * These are injected at runtime by Cloudflare
 */
export type Bindings = {
  // Environment variables
  DJANGO_API_URL: string
  SUPABASE_URL: string

  // Secrets (set via wrangler secret put)
  DJANGO_API_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  JWT_SECRET: string

  // Cloudflare bindings
  KV?: KVNamespace // Optional until created
}

/**
 * Variables set by middleware and available in context
 */
export type Variables = {
  userId: string
  userRole: 'superadmin' | 'clinica_admin' | 'institucion_admin' | 'profesional' | 'agente_ia' | 'readonly'
  clinicaId: string
  userName?: string
  accessToken?: string
  currentUser?: any // Full UserDetail object from Django
}

/**
 * Complete Hono app environment
 */
export type HonoEnv = {
  Bindings: Bindings
  Variables: Variables
}
