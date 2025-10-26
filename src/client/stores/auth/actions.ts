import { batch } from '@preact/signals'
import type { AuthState, AuthActions, RegisterUserData } from './types'
import type { UserDetail } from '@shared/types/django'
import {
  LoginResponseSchema,
  RegisterResponseSchema,
  ValidateTokenResponseSchema,
  parseResponse,
  parseErrorResponse
} from './validation'

/**
 * createAuthActions - Factory para crear acciones de autenticaci�n
 *
 * IMPORTANTE: Todas las requests van a endpoints del servidor Hono (/api/auth/*)
 * que internamente hacen proxy al backend Django.
 *
 * Los tokens JWT se almacenan en HTTP-only cookies (gestionadas por el servidor),
 * NO en localStorage (vulnerable a XSS).
 *
 * @param state - AuthState con signals mutables
 * @returns AuthActions - Funciones as�ncronas para autenticaci�n
 */
export function createAuthActions(state: AuthState): AuthActions {
  /**
   * Login - Autenticar usuario con credenciales
   *
   * Endpoint: POST /api/auth/login
   * Respuesta: { user: UserDetail } + Set-Cookie con tokens
   *
   * @throws Error si credenciales inv�lidas o error de red
   */
  async function login(username: string, password: string): Promise<UserDetail> {
    // Validaci�n b�sica
    if (!username.trim() || !password.trim()) {
      throw new Error('Username and password are required')
    }

    // Limpiar errores previos y marcar loading
    batch(() => {
      state.error.value = null
      state.isLoading.value = true
    })

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Env�a cookies (para refresh token)
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response)
        throw new Error(errorMessage)
      }

      const data = await parseResponse(response, LoginResponseSchema)
      const user = data.user as UserDetail

      // Actualizar estado at�micamente
      batch(() => {
        state.currentUser.value = user
        state.lastRefreshTimestamp.value = Date.now()
        state.isLoading.value = false
        state.error.value = null
      })

      return user
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown login error'

      batch(() => {
        state.error.value = errorMessage
        state.isLoading.value = false
      })

      throw new Error(errorMessage)
    }
  }

  /**
   * Logout - Cerrar sesi�n y limpiar cookies
   *
   * Endpoint: POST /api/auth/logout
   * Efecto: Limpia HTTP-only cookies en el servidor
   */
  async function logout(): Promise<void> {
    state.isLoading.value = true

    try {
      // Llamar al endpoint de logout (limpia cookies)
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (err) {
      // Ignorar errores de logout (limpiamos estado igual)
      console.error('Logout request failed:', err)
    } finally {
      // Limpiar estado local
      batch(() => {
        state.currentUser.value = null
        state.lastRefreshTimestamp.value = null
        state.isLoading.value = false
        state.error.value = null
      })
    }
  }

  /**
   * RefreshToken - Renovar access token usando refresh token
   *
   * Endpoint: POST /api/auth/token/refresh
   * Cookies: refresh token se env�a autom�ticamente
   * Respuesta: Nuevo access token en HTTP-only cookie
   *
   * Se llama autom�ticamente cada 55 min (token expira en 60 min)
   */
  async function refreshToken(): Promise<void> {
    try {
      const response = await fetch('/api/auth/token/refresh', {
        method: 'POST',
        credentials: 'include' // Env�a refresh token cookie
      })

      if (!response.ok) {
        // Refresh token expirado o inv�lido -> forzar re-login
        if (response.status === 401 || response.status === 403) {
          batch(() => {
            state.currentUser.value = null
            state.lastRefreshTimestamp.value = null
            state.error.value = 'Session expired. Please login again.'
          })
        }
        throw new Error(`Token refresh failed: ${response.statusText}`)
      }

      // Actualizar timestamp del �ltimo refresh
      state.lastRefreshTimestamp.value = Date.now()
    } catch (err) {
      console.error('Token refresh error:', err)
      throw err
    }
  }

  /**
   * ValidateCurrentSession - Validar sesi�n existente al cargar app
   *
   * Endpoint: POST /api/auth/validate-token
   * Cookies: access token se env�a autom�ticamente
   * Respuesta: { valid: boolean, user: UserDetail }
   *
   * Usado en App.tsx para restaurar sesi�n desde cookie
   *
   * @returns UserDetail si sesi�n v�lida, null si no
   */
  async function validateCurrentSession(): Promise<UserDetail | null> {
    state.isLoading.value = true

    try {
      const response = await fetch('/api/auth/validate-token', {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        // No hay sesi�n v�lida
        state.isLoading.value = false
        return null
      }

      const data = await parseResponse(response, ValidateTokenResponseSchema)

      if (!data.valid || !data.user) {
        state.isLoading.value = false
        return null
      }

      const user = data.user as UserDetail

      // Restaurar estado de sesi�n
      batch(() => {
        state.currentUser.value = user
        state.lastRefreshTimestamp.value = Date.now()
        state.isLoading.value = false
      })

      return user
    } catch (err) {
      console.error('Session validation error:', err)
      state.isLoading.value = false
      return null
    }
  }

  /**
   * Register - Registrar nuevo usuario (solo superadmins)
   *
   * Endpoint: POST /api/auth/register
   * Requiere: Permisos de superadmin
   * Respuesta: { user: UserDetail } + tokens en cookies
   *
   * @throws Error si falta permisos o datos inv�lidos
   */
  async function register(data: RegisterUserData): Promise<UserDetail> {
    // Validaci�n de contrase�a match
    if (data.password !== data.password2) {
      throw new Error('Passwords do not match')
    }

    // Validaci�n de campos requeridos
    if (!data.username || !data.email || !data.password || !data.first_name || !data.last_name) {
      throw new Error('All fields are required')
    }

    batch(() => {
      state.error.value = null
      state.isLoading.value = true
    })

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response)
        throw new Error(errorMessage)
      }

      const responseData = await parseResponse(response, RegisterResponseSchema)
      const user = responseData.user as UserDetail

      // Actualizar estado con el usuario registrado
      batch(() => {
        state.currentUser.value = user
        state.lastRefreshTimestamp.value = Date.now()
        state.isLoading.value = false
        state.error.value = null
      })

      return user
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown registration error'

      batch(() => {
        state.error.value = errorMessage
        state.isLoading.value = false
      })

      throw new Error(errorMessage)
    }
  }

  return {
    login,
    logout,
    refreshToken,
    validateCurrentSession,
    register
  }
}
