import { effect } from '@preact/signals'
import { createAuthStore } from './store'
import { createAuthActions } from './actions'
import type { AuthStore } from './types'

/**
 * Auto-refresh interval: 55 minutos (token expira en 60 min)
 * Dejamos 5 min de margen para evitar race conditions
 */
const AUTO_REFRESH_INTERVAL_MS = 55 * 60 * 1000 // 55 minutos

/**
 * createAuthStoreWithAutoRefresh - Factory completo del AuthStore
 *
 * Combina:
 * 1. createAuthStore() - Estado con Signals
 * 2. createAuthActions() - Acciones as�ncronas
 * 3. Auto-refresh effect - Timer para renovar token cada 55 min
 *
 * @returns AuthStore - Store completo con estado, acciones y cleanup
 */
function createAuthStoreWithAutoRefresh(): AuthStore {
  // 1. Crear estado con Signals
  const state = createAuthStore()

  // 2. Crear acciones con referencias al estado
  const actions = createAuthActions(state)

  // 3. Timer para auto-refresh (cleanup al destruir store)
  let refreshIntervalId: ReturnType<typeof setInterval> | null = null

  /**
   * Auto-refresh effect - Se ejecuta cuando el usuario est� autenticado
   *
   * Usa effect() de Preact Signals para reaccionar a cambios en isAuthenticated.
   * Si el usuario est� autenticado, inicia timer de refresh.
   * Si se desautentica (logout o sesi�n expirada), cancela timer.
   */
  const disposeAutoRefreshEffect = effect(() => {
    const isAuth = state.isAuthenticated.value

    if (isAuth) {
      // Usuario autenticado -> iniciar auto-refresh
      console.log('[AuthStore] User authenticated, starting auto-refresh timer')

      // Cancelar timer previo si existe
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId)
      }

      // Programar refresh cada 55 min
      refreshIntervalId = setInterval(async () => {
        console.log('[AuthStore] Auto-refreshing token...')

        try {
          await actions.refreshToken()
          console.log('[AuthStore] Token refreshed successfully')
        } catch (err) {
          console.error('[AuthStore] Auto-refresh failed:', err)

          // Si falla el refresh, probablemente la sesi�n expir�
          // El usuario ver� error en state.error y ser� redirigido a login
        }
      }, AUTO_REFRESH_INTERVAL_MS)
    } else {
      // Usuario no autenticado -> cancelar timer
      if (refreshIntervalId) {
        console.log('[AuthStore] User logged out, stopping auto-refresh timer')
        clearInterval(refreshIntervalId)
        refreshIntervalId = null
      }
    }
  })

  /**
   * Cleanup function - Llamar cuando la app se desmonta
   *
   * Cancela:
   * - Timer de auto-refresh
   * - Effect de Preact Signals
   */
  function destroy(): void {
    console.log('[AuthStore] Destroying store, cleaning up timers...')

    // Cancelar timer
    if (refreshIntervalId) {
      clearInterval(refreshIntervalId)
      refreshIntervalId = null
    }

    // Cancelar effect
    disposeAutoRefreshEffect()
  }

  // Retornar store completo
  return {
    // Estado (signals)
    ...state,

    // Acciones (funciones as�ncronas)
    ...actions,

    // Cleanup
    destroy
  }
}

/**
 * authStore - Instancia singleton del AuthStore
 *
 * Este es el store compartido por toda la aplicaci�n.
 * Se importa en componentes v�a useAuth() hook.
 *
 * IMPORTANTE: Este store se crea una sola vez al importar el m�dulo.
 * En aplicaciones con SSR (Cloudflare Pages Functions), asegurarse de
 * que este c�digo solo se ejecute en el cliente.
 */
export const authStore = createAuthStoreWithAutoRefresh()

/**
 * useAuth - Hook para consumir AuthStore en componentes Preact
 *
 * Los componentes que usen este hook se re-renderizar�n autom�ticamente
 * cuando los Signals que accedan cambien.
 *
 * Ejemplo:
 * ```tsx
 * import { useAuth } from '@client/stores/auth'
 *
 * function Dashboard() {
 *   const { isAuthenticated, displayName, logout } = useAuth()
 *
 *   if (!isAuthenticated.value) {
 *     return <Redirect to="/login" />
 *   }
 *
 *   return (
 *     <div>
 *       <h1>Welcome {displayName.value}</h1>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @returns AuthStore - Store con estado reactivo y acciones
 */
export function useAuth(): AuthStore {
  return authStore
}

// Re-exportar tipos para conveniencia
export type { AuthStore, AuthState, AuthActions, RegisterUserData } from './types'
export { ROLE_PERMISSIONS, getRolePermissions, hasPermission } from './types'
