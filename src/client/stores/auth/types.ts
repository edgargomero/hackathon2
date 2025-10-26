import type { Signal, ReadonlySignal } from '@preact/signals'
import type { UserDetail, UserProfile } from '@shared/types/django'

/**
 * AuthState - Estado mutable y computado para autenticación
 *
 * Usa Preact Signals para reactividad granular sin re-renders innecesarios.
 * Los campos Signal<T> son mutables, ReadonlySignal<T> son derivados.
 */
export interface AuthState {
  // ============ Mutable Signals ============

  /**
   * Usuario autenticado actual
   * null cuando no hay sesión activa
   */
  currentUser: Signal<UserDetail | null>

  /**
   * Indica si hay una operación de autenticación en progreso
   * (login, logout, refresh token)
   */
  isLoading: Signal<boolean>

  /**
   * Error de autenticación más reciente
   * null cuando no hay errores
   */
  error: Signal<string | null>

  /**
   * Timestamp (ms) del último refresh de token exitoso
   * Usado para calcular cuando hacer el próximo auto-refresh
   */
  lastRefreshTimestamp: Signal<number | null>

  // ============ Readonly Computed Signals ============

  /**
   * true si hay un usuario autenticado y activo
   * @computed de currentUser
   */
  isAuthenticated: ReadonlySignal<boolean>

  /**
   * Rol del usuario actual
   * @computed de currentUser.profile.role
   */
  userRole: ReadonlySignal<UserProfile['role'] | null>

  /**
   * ID de clínica del usuario (multi-tenant)
   * null para superadmins sin clínica asignada
   * @computed de currentUser.profile.clinica_id
   */
  clinicaId: ReadonlySignal<string | null>

  /**
   * ID de institución del usuario
   * null para usuarios no asociados a institución específica
   * @computed de currentUser.profile.institucion_id
   */
  institucionId: ReadonlySignal<string | null>

  /**
   * Permisos del usuario basados en su rol
   * Set de strings tipo "customers:read", "evaluations:write"
   * @computed de userRole usando getRolePermissions()
   */
  permissions: ReadonlySignal<Set<string>>

  /**
   * Nombre completo del usuario para UI
   * @computed de currentUser.first_name + last_name
   */
  displayName: ReadonlySignal<string>

  /**
   * Propiedades de autorización del usuario
   * @computed de currentUser flags
   */
  isAgent: ReadonlySignal<boolean>
  canViewSensitiveData: ReadonlySignal<boolean>
  isSuperAdmin: ReadonlySignal<boolean>
  isClinicaAdmin: ReadonlySignal<boolean>
  isInstitucionAdmin: ReadonlySignal<boolean>
}

/**
 * AuthActions - Acciones asíncronas para gestión de autenticación
 *
 * Todas las acciones usan el backend Django como fuente de verdad.
 * Los tokens se almacenan en HTTP-only cookies por seguridad.
 */
export interface AuthActions {
  /**
   * Iniciar sesión con credenciales
   *
   * @param username - Usuario (email o username)
   * @param password - Contraseña
   * @returns Promise<UserDetail> - Usuario autenticado
   * @throws Error si credenciales inválidas
   *
   * Flujo:
   * 1. POST /api/auth/login con username/password
   * 2. Backend devuelve tokens en HTTP-only cookies
   * 3. Backend devuelve user data en JSON
   * 4. Actualiza currentUser signal
   * 5. Inicia timer de auto-refresh
   */
  login(username: string, password: string): Promise<UserDetail>

  /**
   * Cerrar sesión
   *
   * @returns Promise<void>
   *
   * Flujo:
   * 1. POST /api/auth/logout (backend limpia cookies)
   * 2. Limpia currentUser signal
   * 3. Cancela timer de auto-refresh
   * 4. Redirige a /login
   */
  logout(): Promise<void>

  /**
   * Refrescar token de acceso
   *
   * @returns Promise<void>
   * @throws Error si refresh token inválido/expirado
   *
   * Flujo:
   * 1. POST /api/auth/token/refresh (cookie automática)
   * 2. Backend devuelve nuevo access token en cookie
   * 3. Actualiza lastRefreshTimestamp
   *
   * Se llama automáticamente cada 55 minutos (token expira en 60min)
   */
  refreshToken(): Promise<void>

  /**
   * Validar token actual y obtener datos del usuario
   *
   * @returns Promise<UserDetail | null>
   *
   * Usado al cargar la app para restaurar sesión desde cookie.
   * Devuelve null si no hay token válido.
   */
  validateCurrentSession(): Promise<UserDetail | null>

  /**
   * Registrar nuevo usuario (solo para superadmins)
   *
   * @param data - Datos del nuevo usuario
   * @returns Promise<UserDetail>
   * @throws Error si falta permisos o datos inválidos
   */
  register(data: RegisterUserData): Promise<UserDetail>
}

/**
 * Datos para registro de nuevo usuario
 */
export interface RegisterUserData {
  username: string
  email: string
  password: string
  password2: string
  first_name: string
  last_name: string
  role: UserProfile['role']
  clinica_id?: string | null
  institucion_id?: string | null
}

/**
 * AuthStore - Store completo con estado y acciones
 *
 * Este es el objeto exportado que consumen los componentes vía useAuth()
 */
export interface AuthStore extends AuthState, AuthActions {
  /**
   * Cleanup function para cancelar auto-refresh timer
   * Llamar cuando la app se desmonta (cleanup en efecto)
   */
  destroy(): void
}

/**
 * Mapeo de roles a permisos
 *
 * Basado en el nivel de rol en Django:
 * - superadmin (100): TODOS los permisos
 * - clinica_admin (90): Gestión de clínica
 * - institucion_admin (80): Gestión de institución
 * - profesional (60): Evaluaciones y reportes
 * - agente_ia (40): Solo llamadas y encuestas
 * - readonly (10): Solo lectura
 */
export const ROLE_PERMISSIONS: Record<UserProfile['role'], Set<string>> = {
  superadmin: new Set([
    // CRUD completo en todos los módulos
    'clinicas:read', 'clinicas:write', 'clinicas:delete',
    'instituciones:read', 'instituciones:write', 'instituciones:delete',
    'alumnos:read', 'alumnos:write', 'alumnos:delete',
    'apoderados:read', 'apoderados:write', 'apoderados:delete',
    'encuestas:read', 'encuestas:write', 'encuestas:delete',
    'evaluaciones:read', 'evaluaciones:write', 'evaluaciones:delete',
    'llamadas:read', 'llamadas:write', 'llamadas:delete',
    'informes:read', 'informes:write', 'informes:delete',
    'usuarios:read', 'usuarios:write', 'usuarios:delete',
    'configuracion:read', 'configuracion:write',
    'sensitive_data:view', 'sensitive_data:export'
  ]),

  clinica_admin: new Set([
    'clinicas:read', // Solo su clínica
    'instituciones:read', 'instituciones:write', 'instituciones:delete',
    'alumnos:read', 'alumnos:write', 'alumnos:delete',
    'apoderados:read', 'apoderados:write', 'apoderados:delete',
    'encuestas:read', 'encuestas:write', 'encuestas:delete',
    'evaluaciones:read', 'evaluaciones:write', 'evaluaciones:delete',
    'llamadas:read', 'llamadas:write', 'llamadas:delete',
    'informes:read', 'informes:write', 'informes:delete',
    'usuarios:read', 'usuarios:write', // Solo usuarios de su clínica
    'configuracion:read', 'configuracion:write',
    'sensitive_data:view'
  ]),

  institucion_admin: new Set([
    'instituciones:read', // Solo su institución
    'alumnos:read', 'alumnos:write', 'alumnos:delete',
    'apoderados:read', 'apoderados:write', 'apoderados:delete',
    'encuestas:read', 'encuestas:write',
    'evaluaciones:read', 'evaluaciones:write',
    'llamadas:read',
    'informes:read', 'informes:write',
    'usuarios:read' // Solo usuarios de su institución
  ]),

  profesional: new Set([
    'alumnos:read',
    'apoderados:read',
    'encuestas:read', 'encuestas:write',
    'evaluaciones:read', 'evaluaciones:write',
    'llamadas:read',
    'informes:read', 'informes:write'
  ]),

  agente_ia: new Set([
    'alumnos:read',
    'apoderados:read',
    'encuestas:read',
    'llamadas:read', 'llamadas:write'
  ]),

  readonly: new Set([
    'alumnos:read',
    'encuestas:read',
    'evaluaciones:read',
    'informes:read'
  ])
}

/**
 * Obtener permisos para un rol específico
 */
export function getRolePermissions(role: UserProfile['role'] | null): Set<string> {
  if (!role) return new Set()
  return ROLE_PERMISSIONS[role]
}

/**
 * Verificar si un rol tiene un permiso específico
 */
export function hasPermission(
  role: UserProfile['role'] | null,
  permission: string
): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].has(permission)
}
