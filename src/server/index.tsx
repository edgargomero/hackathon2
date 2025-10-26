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
 * Deployed on Cloudflare Pages with Django REST API backend
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

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.NODE_ENV || 'development',
  })
})

// API version endpoint
app.get('/api/version', (c) => {
  return c.json({
    name: 'ICAP Survey Platform API',
    version: '1.0.0',
    django_api_configured: !!c.env.DJANGO_API_URL,
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

// ==================== SPA FALLBACK ====================

/**
 * Serve SPA for all non-API routes
 * This enables client-side routing with wouter-preact
 *
 * IMPORTANT: This MUST be defined BEFORE error handlers
 * so that the 404 handler doesn't catch SPA routes
 */
app.get('*', async (c) => {
  // Read and serve index.html
  // In development, Vite serves this automatically
  // In production (Cloudflare Pages), this will serve the built index.html

  return c.html(`<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ICAP Survey Platform</title>

    <!-- Material Symbols Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

    <!-- Tailwind CSS CDN (development) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              primary: {
                50: '#f0f9ff',
                100: '#e0f2fe',
                200: '#bae6fd',
                300: '#7dd3fc',
                400: '#38bdf8',
                500: '#0ea5e9',
                600: '#0284c7',
                700: '#0369a1',
                800: '#075985',
                900: '#0c4a6e',
              }
            }
          }
        }
      }
    </script>

    <style>
      /* Loading spinner */
      .loader {
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-top-color: currentColor;
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/client/client.tsx"></script>
  </body>
</html>`)
})

// ==================== ERROR HANDLING ====================

// Global error handler (handles errors thrown in routes/middleware)
app.onError((err, c) => {
  console.error('[Server Error]:', err)

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
