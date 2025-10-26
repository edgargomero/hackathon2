import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { createSupabaseClient } from '../services/supabase'
import type { HonoEnv } from '@shared/types/env'

/**
 * Clinic Context Middleware
 *
 * Retrieves the user's clinic assignment from Supabase
 * This ensures multi-tenant isolation - every request is scoped to a clinic
 *
 * MUST be used after authMiddleware
 */
export const clinicContextMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const userId = c.get('userId')

  if (!userId) {
    throw new HTTPException(401, {
      message: 'Authentication required. Use authMiddleware before clinicContextMiddleware',
    })
  }

  const supabase = createSupabaseClient(c.env)

  // Get user's clinic from user_profile table
  const { data: profile, error } = await supabase
    .from('user_profile')
    .select('clinica_id, role')
    .eq('user_id', parseInt(userId)) // Django auth_user.id is integer
    .eq('activo', true)
    .single()

  if (error || !profile) {
    throw new HTTPException(403, {
      message: 'User profile not found or inactive',
    })
  }

  if (!profile.clinica_id) {
    throw new HTTPException(403, {
      message: 'No clinic associated with this user',
    })
  }

  // Set clinic context for downstream handlers
  c.set('clinicaId', profile.clinica_id)

  // Override role from profile if available
  if (profile.role) {
    c.set('userRole', profile.role as HonoEnv['Variables']['userRole'])
  }

  await next()
})
