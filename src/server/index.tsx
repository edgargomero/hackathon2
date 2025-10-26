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
            <a href="/login">Login</a>
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

// Login page
app.get('/login', (c) => {
  return c.html(
    <html>
      <head>
        <title>Login - ICAP Survey Platform</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .login-container {
            background: white;
            padding: 2.5rem;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
          }
          h1 {
            color: #667eea;
            text-align: center;
            margin-bottom: 0.5rem;
            font-size: 2rem;
          }
          .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 2rem;
            font-size: 0.9rem;
          }
          .form-group {
            margin-bottom: 1.5rem;
          }
          label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 500;
          }
          input {
            width: 100%;
            padding: 0.8rem;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 1rem;
            transition: border-color 0.3s;
          }
          input:focus {
            outline: none;
            border-color: #667eea;
          }
          button {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          }
          button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          .message {
            margin-top: 1rem;
            padding: 0.8rem;
            border-radius: 8px;
            text-align: center;
            font-size: 0.9rem;
            display: none;
          }
          .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
          .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
          .back-link {
            display: block;
            text-align: center;
            margin-top: 1.5rem;
            color: #667eea;
            text-decoration: none;
            font-size: 0.9rem;
          }
          .back-link:hover {
            text-decoration: underline;
          }
        `}</style>
      </head>
      <body>
        <div class="login-container">
          <h1>🔐 Login</h1>
          <p class="subtitle">ICAP Survey Platform</p>

          <form id="loginForm">
            <div class="form-group">
              <label for="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                required
                autocomplete="username"
                placeholder="Enter your username"
              />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autocomplete="current-password"
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" id="loginBtn">Login</button>
          </form>

          <div id="message" class="message"></div>

          <a href="/" class="back-link">← Back to home</a>
        </div>

        <script>{`
          const form = document.getElementById('loginForm');
          const btn = document.getElementById('loginBtn');
          const msg = document.getElementById('message');

          form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            btn.disabled = true;
            btn.textContent = 'Logging in...';
            msg.style.display = 'none';

            try {
              const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
              });

              const data = await response.json();

              if (response.ok) {
                msg.className = 'message success';
                msg.textContent = 'Login successful! Redirecting...';
                msg.style.display = 'block';

                // Store token in localStorage
                localStorage.setItem('access_token', data.tokens.access);
                localStorage.setItem('refresh_token', data.tokens.refresh);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect to dashboard
                setTimeout(() => {
                  window.location.href = '/api/dashboard';
                }, 1000);
              } else {
                throw new Error(data.error || data.detail || 'Login failed');
              }
            } catch (error) {
              msg.className = 'message error';
              msg.textContent = error.message || 'Login failed. Please try again.';
              msg.style.display = 'block';
            } finally {
              btn.disabled = false;
              btn.textContent = 'Login';
            }
          });
        `}</script>
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
    backend: 'Django REST API',
    database: 'PostgreSQL',
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
