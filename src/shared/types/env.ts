/**
 * Cloudflare Workers Environment Bindings
 * These are injected at runtime by Cloudflare
 */
export type Bindings = {
  // Environment variables
  DJANGO_API_URL: string
  NODE_ENV?: string // Optional: development, staging, production

  // Secrets (set via wrangler secret put)
  DJANGO_API_KEY?: string // Optional API key for Django if needed
  JWT_SECRET?: string // Optional secret for frontend session management

  // Cloudflare bindings
  KV?: KVNamespace // Optional until created
}

/**
 * Variables set by middleware and available in context
 * All protected routes have these values set by djangoAuthMiddleware
 */
export type Variables = {
  userId: string
  userRole: 'superadmin' | 'clinica_admin' | 'institucion_admin' | 'profesional' | 'agente_ia' | 'readonly'
  clinicaId?: string // Optional: undefined for superadmins without assigned clinic
  accessToken: string // Always present after djangoAuthMiddleware
  userName?: string // Optional, set by djangoClinicContextMiddleware
  currentUser?: any // Optional, full UserDetail object from Django
}

/**
 * Complete Hono app environment
 */
export type HonoEnv = {
  Bindings: Bindings
  Variables: Variables
}
