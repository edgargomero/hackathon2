import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { verify } from 'hono/jwt'
import type { HonoEnv } from '@shared/types/env'

/**
 * Authentication Middleware
 *
 * Validates JWT token from Authorization header
 * Sets userId and userRole in context for downstream use
 */
export const authMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader) {
    throw new HTTPException(401, {
      message: 'Missing Authorization header',
    })
  }

  // Check for Bearer token format
  if (!authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, {
      message: 'Invalid Authorization format. Expected "Bearer <token>"',
    })
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    // Verify JWT token
    const payload = await verify(token, c.env.JWT_SECRET)

    // Extract user information from token
    const userId = payload.sub as string
    const userRole = payload.role as HonoEnv['Variables']['userRole']

    if (!userId) {
      throw new HTTPException(401, { message: 'Invalid token payload' })
    }

    // Set context variables for downstream middleware/handlers
    c.set('userId', userId)
    c.set('userRole', userRole || 'agent')

    if (payload.name) {
      c.set('userName', payload.name as string)
    }

    await next()
  } catch (error) {
    // JWT verification failed
    throw new HTTPException(401, {
      message: 'Invalid or expired token',
    })
  }
})

/**
 * Optional Auth Middleware
 *
 * Same as authMiddleware but doesn't throw if no token present
 * Useful for routes that can work with or without authentication
 */
export const optionalAuthMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)

    try {
      const payload = await verify(token, c.env.JWT_SECRET)
      const userId = payload.sub as string
      const userRole = payload.role as HonoEnv['Variables']['userRole']

      if (userId) {
        c.set('userId', userId)
        c.set('userRole', userRole || 'agent')

        if (payload.name) {
          c.set('userName', payload.name as string)
        }
      }
    } catch {
      // Invalid token, but we don't throw - just continue without auth
    }
  }

  await next()
})
