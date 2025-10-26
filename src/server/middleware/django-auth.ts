import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { getCookie } from 'hono/cookie'
import type { HonoEnv } from '@shared/types/env'
import { createDjangoAuthClient } from '../services/django-auth'

/**
 * Django JWT Authentication Middleware
 *
 * Validates JWT tokens from Django REST Framework
 * Tokens can come from:
 * 1. Authorization: Bearer <token> header (preferred)
 * 2. access_token cookie (fallback)
 *
 * Sets userId, userRole, clinicaId in context for downstream use
 */
export const djangoAuthMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  // Try to get token from Authorization header first
  let accessToken = c.req.header('Authorization')?.replace('Bearer ', '')

  // Fallback to cookie
  if (!accessToken) {
    accessToken = getCookie(c, 'access_token')
  }

  if (!accessToken) {
    throw new HTTPException(401, {
      message: 'Missing authentication token. Please login.',
    })
  }

  // Validate token with Django API
  const djangoAuth = createDjangoAuthClient(c.env)

  try {
    const validation = await djangoAuth.validateToken(accessToken)

    if (!validation.valid || !validation.user) {
      throw new HTTPException(401, { message: 'Invalid token' })
    }

    // Set context variables from validated token
    // Note: Django uses user.id (number), we convert to string for consistency
    c.set('userId', validation.user.id.toString())
    c.set('userRole', validation.user.role)
    c.set('clinicaId', validation.user.clinica_id || '')

    // Store the access token for downstream use
    c.set('accessToken', accessToken)

    await next()
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }

    // Token validation failed
    throw new HTTPException(401, {
      message: 'Token validation failed. Please login again.',
    })
  }
})

/**
 * Optional Django Auth Middleware
 *
 * Same as djangoAuthMiddleware but doesn't throw if no token present
 * Useful for routes that can work with or without authentication
 */
export const optionalDjangoAuthMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  // Try to get token from Authorization header first
  let accessToken = c.req.header('Authorization')?.replace('Bearer ', '')

  // Fallback to cookie
  if (!accessToken) {
    accessToken = getCookie(c, 'access_token')
  }

  if (accessToken) {
    const djangoAuth = createDjangoAuthClient(c.env)

    try {
      const validation = await djangoAuth.validateToken(accessToken)

      if (validation.valid && validation.user) {
        c.set('userId', validation.user.id.toString())
        c.set('userRole', validation.user.role)
        c.set('clinicaId', validation.user.clinica_id || '')
        c.set('accessToken', accessToken)
      }
    } catch {
      // Invalid token, but we don't throw - just continue without auth
    }
  }

  await next()
})

/**
 * Django Clinic Context Middleware
 *
 * Fetches full user details from Django to get clinic context
 * This is more comprehensive than just token validation
 *
 * MUST be used after djangoAuthMiddleware
 */
export const djangoClinicContextMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const accessToken = c.get('accessToken')

  if (!accessToken) {
    throw new HTTPException(401, {
      message: 'Authentication required. Use djangoAuthMiddleware before djangoClinicContextMiddleware',
    })
  }

  const djangoAuth = createDjangoAuthClient(c.env)

  try {
    const user = await djangoAuth.getCurrentUser(accessToken)

    if (!user.profile.activo) {
      throw new HTTPException(403, { message: 'User account is inactive' })
    }

    // Superadmins can operate without a clinica_id (they manage multiple clinics)
    if (!user.profile.clinica_id && user.profile.role !== 'superadmin') {
      throw new HTTPException(403, { message: 'No clinic associated with this user' })
    }

    // Update context with full user details
    // clinica_id can be null for superadmins
    c.set('clinicaId', user.profile.clinica_id || undefined)
    c.set('userRole', user.profile.role)
    c.set('userName', `${user.first_name} ${user.last_name}`)

    // Store full user object if needed
    c.set('currentUser', user)

    await next()
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }

    throw new HTTPException(500, {
      message: 'Failed to fetch user context',
    })
  }
})
