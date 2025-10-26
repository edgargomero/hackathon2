import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import type { HonoEnv } from '@shared/types/env'

// Middleware
import { djangoAuthMiddleware, djangoClinicContextMiddleware } from './middleware/django-auth'

// Routes
import { authRoutes } from './routes/auth'
import { studentRoutes } from './routes/students'
import dashboardRoutes from './routes/dashboard'
// import { surveyRoutes } from './routes/surveys'
// import { callRoutes } from './routes/calls'

/**
 * Main Hono Application
 *
 * Entry point for the ICAP Survey Platform
 * Deployed on Cloudflare Pages with Supabase backend
 */
const app = new Hono<HonoEnv>()

// ==================== GLOBAL MIDDLEWARE ====================

// Request logging
app.use('*', logger())

// Pretty JSON responses in development
app.use('*', prettyJSON())

// CORS configuration
app.use('/api/*', cors({
  origin: (origin) => {
    // Allow local development and production domains
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://hackathon2-icap.pages.dev',
      'https://hackathon2-icap-staging.pages.dev',
    ]

    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}))

// ==================== PUBLIC ROUTES ====================

// Health check endpoint (no auth required)
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.DJANGO_API_URL ? 'configured' : 'not-configured',
  })
})

// API version info
app.get('/api/version', (c) => {
  return c.json({
    version: '1.0.0',
    platform: 'Cloudflare Pages + Hono',
    database: 'Supabase PostgreSQL',
  })
})

// ==================== PUBLIC AUTH ROUTES ====================

// Authentication routes (login, register, refresh) - NO auth required
app.route('/api/auth', authRoutes)

// ==================== PROTECTED ROUTES ====================

// Apply Django JWT authentication + clinic context to all /api routes except public ones
app.use('/api/students/*', djangoAuthMiddleware, djangoClinicContextMiddleware)
app.use('/api/dashboard/*', djangoAuthMiddleware, djangoClinicContextMiddleware)
app.use('/api/surveys/*', djangoAuthMiddleware, djangoClinicContextMiddleware)
app.use('/api/calls/*', djangoAuthMiddleware, djangoClinicContextMiddleware)

// ==================== API ROUTES ====================

// Mount data routes
app.route('/api/students', studentRoutes)
app.route('/api/dashboard', dashboardRoutes)
// app.route('/api/surveys', surveyRoutes)
// app.route('/api/calls', callRoutes)

// ==================== ERROR HANDLING ====================

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404
  )
})

// Global error handler
app.onError((err, c) => {
  console.error('Error:', err)

  // Check if it's an HTTPException from middleware
  if ('status' in err && typeof err.status === 'number') {
    return c.json(
      {
        error: err.message,
        status: err.status,
      },
      err.status as any
    )
  }

  // Generic server error
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred',
    },
    500
  )
})

// ==================== EXPORT ====================

export default app
