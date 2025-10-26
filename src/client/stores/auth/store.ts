import { signal, computed } from '@preact/signals'
import type { AuthState } from './types'
import type { UserDetail } from '@shared/types/django'
import { getRolePermissions } from './types'

/**
 * createAuthStore - Factory para crear el estado de autenticaci�n con Preact Signals
 *
 * Este store NO almacena tokens JWT (est�n en HTTP-only cookies).
 * Solo maneja estado de UI y datos del usuario.
 *
 * @returns AuthState - Estado reactivo con signals mutables y computed
 */
export function createAuthStore(): AuthState {
  // ============ Mutable Signals ============

  /**
   * Usuario autenticado actual
   * Se actualiza cuando:
   * - Login exitoso
   * - Refresh token exitoso
   * - Logout (se pone en null)
   * - Validaci�n de sesi�n al cargar app
   */
  const currentUser = signal<UserDetail | null>(null)

  /**
   * Indica operaci�n en progreso (login, logout, refresh)
   * Usado para mostrar spinners y deshabilitar forms
   */
  const isLoading = signal<boolean>(false)

  /**
   * Error m�s reciente de autenticaci�n
   * Se limpia al inicio de cada operaci�n
   */
  const error = signal<string | null>(null)

  /**
   * Timestamp del �ltimo refresh exitoso
   * Usado para calcular pr�ximo auto-refresh (55 min)
   */
  const lastRefreshTimestamp = signal<number | null>(null)

  // ============ Readonly Computed Signals ============

  /**
   * true si hay usuario autenticado y activo
   * @computed - Se actualiza autom�ticamente cuando currentUser cambia
   */
  const isAuthenticated = computed<boolean>(() => {
    const user = currentUser.value
    return user !== null && user.profile.activo === true
  })

  /**
   * Rol del usuario actual
   * null si no hay usuario autenticado
   * @computed
   */
  const userRole = computed(() => {
    return currentUser.value?.profile.role ?? null
  })

  /**
   * ID de cl�nica para multi-tenant filtering
   * null para superadmins sin cl�nica asignada
   * @computed
   */
  const clinicaId = computed(() => {
    return currentUser.value?.profile.clinica_id ?? null
  })

  /**
   * ID de instituci�n
   * null para usuarios no asociados a instituci�n
   * @computed
   */
  const institucionId = computed(() => {
    return currentUser.value?.profile.institucion_id ?? null
  })

  /**
   * Permisos del usuario basados en su rol
   * Set vac�o si no hay usuario autenticado
   * @computed
   */
  const permissions = computed(() => {
    const role = userRole.value
    return getRolePermissions(role)
  })

  /**
   * Nombre completo para mostrar en UI
   * Formato: "Nombre Apellido"
   * @computed
   */
  const displayName = computed(() => {
    const user = currentUser.value
    if (!user) return ''

    const firstName = user.first_name?.trim() || ''
    const lastName = user.last_name?.trim() || ''

    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    }

    return firstName || lastName || user.username
  })

  /**
   * Flags de autorizaci�n del usuario
   * @computed
   */
  const isAgent = computed(() => {
    return currentUser.value?.profile.is_agent ?? false
  })

  const canViewSensitiveData = computed(() => {
    return currentUser.value?.profile.can_view_sensitive_data ?? false
  })

  const isSuperAdmin = computed(() => {
    return currentUser.value?.is_superadmin ?? false
  })

  const isClinicaAdmin = computed(() => {
    return currentUser.value?.is_clinica_admin ?? false
  })

  const isInstitucionAdmin = computed(() => {
    return currentUser.value?.is_institucion_admin ?? false
  })

  // ============ Return Store ============

  return {
    // Mutable
    currentUser,
    isLoading,
    error,
    lastRefreshTimestamp,

    // Computed
    isAuthenticated,
    userRole,
    clinicaId,
    institucionId,
    permissions,
    displayName,
    isAgent,
    canViewSensitiveData,
    isSuperAdmin,
    isClinicaAdmin,
    isInstitucionAdmin
  }
}
