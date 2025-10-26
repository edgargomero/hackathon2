/**
 * App.tsx - Root Component de la SPA
 *
 * Implementa routing client-side con wouter-preact
 * Valida sesión al montar la app
 * Protected routes con AuthStore
 */

import { useEffect } from 'preact/hooks'
import { Route, Router, Switch, Redirect } from 'wouter-preact'
import { useAuth } from './stores/auth'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { NotFoundPage } from './pages/NotFoundPage'

import type { FunctionComponent } from 'preact'

/**
 * ProtectedRoute - Componente para rutas que requieren autenticación
 *
 * Si el usuario no está autenticado, redirige a /login
 */
function ProtectedRoute({ component: Component }: { component: FunctionComponent }) {
  const { isAuthenticated, isLoading } = useAuth()

  // Mientras valida sesión, mostrar loader
  if (isLoading.value) {
    return (
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="loader mx-auto mb-4" />
          <p class="text-slate-600 dark:text-slate-400">Validating session...</p>
        </div>
      </div>
    )
  }

  // Si no autenticado, redirect a login
  if (!isAuthenticated.value) {
    return <Redirect to="/login" />
  }

  // Renderizar componente protegido
  return <Component />
}

/**
 * App - Componente raíz de la aplicación
 *
 * Funcionalidades:
 * 1. Valida sesión existente al montar (desde HTTP-only cookie)
 * 2. Configura routing con wouter-preact
 * 3. Maneja dark mode desde localStorage
 */
export function App() {
  const { validateCurrentSession, isLoading } = useAuth()

  // Validar sesión al montar la app
  useEffect(() => {
    validateCurrentSession().catch((error: unknown) => {
      console.error('[App] Session validation failed:', error)
    })
  }, [])

  // Inicializar dark mode desde localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (savedMode === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // Detectar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  // Mientras valida sesión inicial, mostrar splash
  if (isLoading.value) {
    return (
      <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-500 to-primary-700">
        <div class="text-center text-white">
          <h1 class="text-4xl font-bold mb-4">ICAP</h1>
          <div class="loader mx-auto border-white" />
          <p class="mt-4 text-primary-100">Initializing platform...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Switch>
        {/* Ruta raíz - redirect según autenticación */}
        <Route path="/">
          {() => {
            const { isAuthenticated } = useAuth()
            return isAuthenticated.value ? <Redirect to="/dashboard" /> : <Redirect to="/login" />
          }}
        </Route>

        {/* Ruta de login - pública */}
        <Route path="/login" component={LoginPage} />

        {/* Rutas protegidas */}
        <Route path="/dashboard">
          <ProtectedRoute component={DashboardPage} />
        </Route>

        {/* 404 - Ruta no encontrada */}
        <Route component={NotFoundPage} />
      </Switch>
    </Router>
  )
}
