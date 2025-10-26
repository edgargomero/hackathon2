import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { setCookie, deleteCookie } from 'hono/cookie'
import type { HonoEnv } from '@shared/types/env'
import { createDjangoAuthClient } from '../services/django-auth'
import { HTTPException } from 'hono/http-exception'

/**
 * Authentication Routes
 *
 * Handles user authentication via Django REST API
 * Public routes - no auth middleware required
 */
const app = new Hono<HonoEnv>()

// ==================== VALIDATION SCHEMAS ====================

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

const registerSchema = z.object({
  username: z.string().min(3).max(150).regex(/^[\w.@+-]+$/, 'Username can only contain letters, numbers and @/./+/-/_'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password2: z.string(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  role: z.enum(['superadmin', 'clinica_admin', 'institucion_admin', 'profesional', 'agente_ia', 'readonly']),
  clinica_id: z.string().uuid('Invalid clinic ID'),
  institucion_id: z.string().uuid().optional(),
  can_view_sensitive_data: z.boolean().optional().default(false),
}).refine(data => data.password === data.password2, {
  message: 'Passwords do not match',
  path: ['password2'],
})

const refreshTokenSchema = z.object({
  refresh: z.string().min(1, 'Refresh token is required'),
})

const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  new_password2: z.string(),
}).refine(data => data.new_password === data.new_password2, {
  message: 'New passwords do not match',
  path: ['new_password2'],
})

const updateProfileSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  can_view_sensitive_data: z.boolean().optional(),
  configuracion: z.record(z.any()).optional(),
})

// ==================== HELPER FUNCTIONS ====================

/**
 * Set HTTP-only cookies for tokens (more secure than localStorage)
 */
function setAuthCookies(c: any, accessToken: string, refreshToken: string) {
  // Access token - 1 hour
  setCookie(c, 'access_token', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 3600, // 1 hour in seconds
    path: '/',
  })

  // Refresh token - 1 day
  setCookie(c, 'refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 86400, // 1 day in seconds
    path: '/',
  })
}

/**
 * Clear auth cookies on logout
 */
function clearAuthCookies(c: any) {
  deleteCookie(c, 'access_token', { path: '/' })
  deleteCookie(c, 'refresh_token', { path: '/' })
}

// ==================== ROUTES ====================

/**
 * POST /api/auth/login
 * User login - obtain JWT tokens
 */
app.post('/login', zValidator('json', loginSchema), async (c) => {
  const credentials = c.req.valid('json')
  const djangoAuth = createDjangoAuthClient(c.env)

  try {
    const response = await djangoAuth.login(credentials)

    // Set HTTP-only cookies
    setAuthCookies(c, response.access, response.refresh)

    // Return user info + tokens (tokens also in cookies)
    return c.json({
      user: response.user,
      tokens: {
        access: response.access,
        refresh: response.refresh,
      },
      message: 'Login successful',
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(401, { message: 'Invalid credentials' })
  }
})

/**
 * POST /api/auth/register
 * User registration - create new account
 */
app.post('/register', zValidator('json', registerSchema), async (c) => {
  const userData = c.req.valid('json')
  const djangoAuth = createDjangoAuthClient(c.env)

  try {
    const response = await djangoAuth.register(userData)

    // Set HTTP-only cookies
    setAuthCookies(c, response.tokens.access, response.tokens.refresh)

    // Return user info + tokens
    return c.json({
      user: response.user,
      tokens: response.tokens,
      message: response.message,
    }, 201)
  } catch (error) {
    if (error instanceof HTTPException) {
      // Django validation errors
      throw error
    }
    throw new HTTPException(400, { message: 'Registration failed' })
  }
})

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
app.post('/refresh', zValidator('json', refreshTokenSchema), async (c) => {
  const { refresh } = c.req.valid('json')
  const djangoAuth = createDjangoAuthClient(c.env)

  try {
    const response = await djangoAuth.refreshToken(refresh)

    // Update access token cookie
    setCookie(c, 'access_token', response.access, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 3600,
      path: '/',
    })

    return c.json({
      access: response.access,
      message: 'Token refreshed successfully',
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(401, { message: 'Invalid refresh token' })
  }
})

/**
 * POST /api/auth/logout
 * Logout - clear cookies
 */
app.post('/logout', (c) => {
  clearAuthCookies(c)

  return c.json({
    message: 'Logged out successfully',
  })
})

/**
 * GET /api/auth/validate
 * Validate current access token
 * Requires Authorization header
 */
app.get('/validate', async (c) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing or invalid Authorization header' })
  }

  const accessToken = authHeader.substring(7)
  const djangoAuth = createDjangoAuthClient(c.env)

  try {
    const response = await djangoAuth.validateToken(accessToken)

    return c.json(response)
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(401, { message: 'Invalid token' })
  }
})

// ==================== PROTECTED USER ROUTES ====================
// Note: These require authMiddleware to be applied in parent router

/**
 * GET /api/auth/me
 * Get current user details
 */
app.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing Authorization header' })
  }

  const accessToken = authHeader.substring(7)
  const djangoAuth = createDjangoAuthClient(c.env)

  const user = await djangoAuth.getCurrentUser(accessToken)

  return c.json(user)
})

/**
 * PATCH /api/auth/profile
 * Update current user's profile
 */
app.patch('/profile', zValidator('json', updateProfileSchema), async (c) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing Authorization header' })
  }

  const accessToken = authHeader.substring(7)
  const updates = c.req.valid('json')
  const djangoAuth = createDjangoAuthClient(c.env)

  // Get current user to extract user ID
  const currentUser = await djangoAuth.getCurrentUser(accessToken)

  // Update profile
  const updatedUser = await djangoAuth.updateProfile(currentUser.id, updates, accessToken)

  return c.json(updatedUser)
})

/**
 * POST /api/auth/change-password
 * Change current user's password
 */
app.post('/change-password', zValidator('json', changePasswordSchema), async (c) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing Authorization header' })
  }

  const accessToken = authHeader.substring(7)
  const passwords = c.req.valid('json')
  const djangoAuth = createDjangoAuthClient(c.env)

  // Get current user to extract user ID
  const currentUser = await djangoAuth.getCurrentUser(accessToken)

  // Change password
  const result = await djangoAuth.changePassword(currentUser.id, passwords, accessToken)

  return c.json(result)
})

export { app as authRoutes }
