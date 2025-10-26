/**
 * LoginPage.tsx - Página de inicio de sesión
 *
 * Usa AuthStore para autenticación
 * Redirect a /dashboard después de login exitoso
 */

import { signal } from '@preact/signals'
import { useLocation } from 'wouter-preact'
import { motion } from 'framer-motion'
import { useAuth } from '../stores/auth'

// Signals locales para el form
const username = signal('')
const password = signal('')

/**
 * LoginPage Component
 */
export function LoginPage() {
  const { login, error, isLoading, isAuthenticated } = useAuth()
  const [, setLocation] = useLocation()

  // Si ya está autenticado, redirect a dashboard
  if (isAuthenticated.value) {
    setLocation('/dashboard')
    return null
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()

    if (!username.value || !password.value) {
      return
    }

    try {
      await login(username.value, password.value)
      // Redirect a dashboard (se hace automáticamente por isAuthenticated)
      setLocation('/dashboard')
    } catch (err) {
      // Error ya está en authStore.error
      console.error('[LoginPage] Login failed:', err)
    }
  }

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-purple-700 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        class="w-full max-w-md"
      >
        {/* Card */}
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div class="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-6 text-white text-center">
            <h1 class="text-3xl font-bold mb-2">ICAP Platform</h1>
            <p class="text-primary-100 text-sm">Chilean HealthTech Survey System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} class="px-8 py-8 space-y-6">
            {/* Error Alert */}
            {error.value && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3"
              >
                <span class="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">
                  error
                </span>
                <div class="flex-1">
                  <h3 class="text-red-800 dark:text-red-200 font-semibold text-sm">
                    Login Failed
                  </h3>
                  <p class="text-red-700 dark:text-red-300 text-sm mt-1">{error.value}</p>
                </div>
              </motion.div>
            )}

            {/* Username Field */}
            <div>
              <label
                for="username"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Username or Email
              </label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  person
                </span>
                <input
                  id="username"
                  type="text"
                  value={username.value}
                  onInput={(e) => (username.value = (e.target as HTMLInputElement).value)}
                  placeholder="Enter your username"
                  disabled={isLoading.value}
                  required
                  class="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Password
              </label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  value={password.value}
                  onInput={(e) => (password.value = (e.target as HTMLInputElement).value)}
                  placeholder="Enter your password"
                  disabled={isLoading.value}
                  required
                  class="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading.value || !username.value || !password.value}
              class="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading.value ? (
                <>
                  <div class="loader border-white border-t-transparent w-5 h-5" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span class="material-symbols-outlined text-xl">login</span>
                  <span>Sign In</span>
                </>
              )}
            </button>

            {/* Demo Credentials */}
            <div class="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <p class="text-xs text-slate-600 dark:text-slate-400 mb-2 font-semibold">
                Demo Credentials:
              </p>
              <div class="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <p>
                  <strong>Superadmin:</strong> w_hat / ADRIAN123!
                </p>
                <p class="text-slate-500 dark:text-slate-500 text-[10px]">
                  (Full system access)
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p class="text-center text-white/80 text-sm mt-6">
          © 2025 ICAP Platform · Chilean HealthTech
        </p>
      </motion.div>
    </div>
  )
}
