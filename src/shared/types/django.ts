/**
 * Django API Types
 * Based on api-psycho Django REST Framework API
 */

// ==================== USER & AUTHENTICATION ====================

export interface DjangoUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_active: boolean
  is_superuser: boolean
  date_joined: string
}

export interface UserProfile {
  role: 'superadmin' | 'clinica_admin' | 'institucion_admin' | 'profesional' | 'agente_ia' | 'readonly'
  role_display: string
  clinica_id: string | null
  institucion_id: string | null
  is_agent: boolean
  can_view_sensitive_data: boolean
  activo: boolean
  fecha_registro: string
  ultima_actividad: string | null
  configuracion: Record<string, any>
}

export interface UserDetail extends DjangoUser {
  profile: UserProfile
  is_superadmin: boolean
  is_clinica_admin: boolean
  is_institucion_admin: boolean
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  refresh: string
  access: string
  user: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    role: UserProfile['role']
    role_display: string
    activo: boolean
  }
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  password2: string
  first_name: string
  last_name: string
  role: UserProfile['role']
  clinica_id: string
  institucion_id?: string
  can_view_sensitive_data?: boolean
}

export interface RegisterResponse {
  user: UserDetail
  tokens: {
    refresh: string
    access: string
  }
  message: string
}

export interface TokenRefreshRequest {
  refresh: string
}

export interface TokenRefreshResponse {
  access: string
}

export interface TokenValidateResponse {
  valid: boolean
  user: {
    id: number
    username: string
    role: UserProfile['role']
    clinica_id: string | null
  }
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
  new_password2: string
}

export interface UpdateProfileRequest {
  first_name?: string
  last_name?: string
  email?: string
  can_view_sensitive_data?: boolean
  configuracion?: Record<string, any>
}

// ==================== JWT TOKEN CLAIMS ====================

export interface JWTTokenClaims {
  user_id: number
  username: string
  email: string
  role: UserProfile['role']
  clinica_id: string | null
  institucion_id: string | null
  is_agent: boolean
  exp: number
  iat: number
}

// ==================== PAGINATION ====================

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ==================== ERROR RESPONSES ====================

export interface DjangoErrorResponse {
  detail?: string
  error?: string
  [key: string]: any // Field-specific errors
}

export interface DjangoValidationError {
  [field: string]: string[]
}
