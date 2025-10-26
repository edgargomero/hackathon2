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

// Root route - Welcome page
app.get('/', (c) => {
  return c.html(
    <html>
      <head>
        <title>ICAP Survey Platform</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          h1 { font-size: 3rem; margin-bottom: 1rem; }
          p { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
          .links {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
          }
          a {
            padding: 0.8rem 2rem;
            background: white;
            color: #667eea;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          }
          a:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
          }
          .status {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            font-size: 0.9rem;
          }
        `}</style>
      </head>
      <body>
        <div class="container">
          <h1>🎯 ICAP Survey Platform</h1>
          <p>Sistema de Encuestas y Evaluación Psicológica</p>
          <div class="links">
            <a href="/api/health">Health Check</a>
            <a href="/api/version">API Version</a>
            <a href="/api/dashboard">Dashboard</a>
          </div>
          <div class="status">
            <strong>Status:</strong> ✅ Online<br/>
            <strong>Environment:</strong> {c.env.NODE_ENV || 'development'}<br/>
            <strong>API:</strong> {c.env.DJANGO_API_URL ? '✅ Configured' : '⚠️ Not configured'}
          </div>
        </div>
      </body>
    </html>
  )
})

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
