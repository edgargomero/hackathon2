import { z } from 'zod'

/**
 * Schemas de validación Zod para respuestas del API de autenticación
 *
 * Estos schemas validan las respuestas JSON del servidor en runtime,
 * garantizando type-safety completo con TypeScript strict mode.
 */

// ============ User Profile Schema ============

const UserProfileSchema = z.object({
  role: z.enum([
    'superadmin',
    'clinica_admin',
    'institucion_admin',
    'profesional',
    'agente_ia',
    'readonly'
  ]),
  role_display: z.string(),
  clinica_id: z.string().uuid().nullable(),
  institucion_id: z.string().uuid().nullable(),
  is_agent: z.boolean(),
  can_view_sensitive_data: z.boolean(),
  activo: z.boolean(),
  fecha_registro: z.string(),
  ultima_actividad: z.string().nullable(),
  configuracion: z.record(z.any()).optional()
}).transform((data) => ({
  ...data,
  configuracion: data.configuracion ?? {}
}))

// ============ User Detail Schema ============

const UserDetailSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  is_active: z.boolean(),
  is_staff: z.boolean(),
  is_superuser: z.boolean(),
  date_joined: z.string(),
  last_login: z.string().nullable(),

  // Profile data
  profile: UserProfileSchema,

  // Computed properties from Django
  is_superadmin: z.boolean(),
  is_clinica_admin: z.boolean(),
  is_institucion_admin: z.boolean()
})

// ============ API Response Schemas ============

/**
 * Respuesta de /api/auth/login
 */
export const LoginResponseSchema = z.object({
  user: UserDetailSchema,
  // Tokens están en HTTP-only cookies, no en JSON
  message: z.string().optional()
})

/**
 * Respuesta de /api/auth/register
 */
export const RegisterResponseSchema = z.object({
  user: UserDetailSchema,
  message: z.string().optional()
})

/**
 * Respuesta de /api/auth/validate-token
 */
export const ValidateTokenResponseSchema = z.object({
  valid: z.boolean(),
  user: UserDetailSchema.optional()
})

/**
 * Respuesta de error genérica
 */
export const ErrorResponseSchema = z.object({
  message: z.string().optional(),
  detail: z.string().optional(),
  error: z.string().optional(),
  errors: z.record(z.array(z.string())).optional() // Errores de validación Django
})

// ============ Helper Functions ============

/**
 * Parse y valida respuesta JSON con Zod schema
 *
 * @param response - Fetch Response
 * @param schema - Zod schema para validar
 * @returns Promise<T> - Datos validados
 * @throws Error si validación falla
 */
export async function parseResponse<T>(
  response: Response,
  schema: z.ZodSchema<T>
): Promise<T> {
  const json = await response.json()
  const result = schema.safeParse(json)

  if (!result.success) {
    console.error('[Auth Validation] Response validation failed:', result.error)
    throw new Error('Invalid server response format')
  }

  return result.data
}

/**
 * Parse mensaje de error de respuesta
 *
 * @param response - Fetch Response con error
 * @returns Promise<string> - Mensaje de error legible
 */
export async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const json = await response.json()
    const result = ErrorResponseSchema.safeParse(json)

    if (result.success) {
      const { message, detail, error, errors } = result.data

      // Prioridad: message > detail > error > errores de validación
      if (message) return message
      if (detail) return detail
      if (error) return error

      // Errores de validación Django (campo: [errores])
      if (errors) {
        const fieldErrors = Object.entries(errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join('; ')
        return fieldErrors
      }
    }
  } catch (err) {
    // JSON parse falló o validación falló
    console.error('[Auth Validation] Error parsing error response:', err)
  }

  // Fallback a statusText
  return response.statusText || 'Unknown error'
}
