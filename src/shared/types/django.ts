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

// ==================== DATA MODELS (from Django API) ====================

/**
 * Clinica - Top-level tenant organization
 */
export interface Clinica {
  id: string
  nombre: string
  rut: string
  direccion: string | null
  telefono: string | null
  email: string
  plan: string
  activo: boolean
  configuracion: Record<string, any> | null
  created_at: string
  updated_at: string
  total_instituciones?: number
}

/**
 * Institución - Educational institution
 */
export interface Institucion {
  id: string
  clinica: string
  clinica_nombre?: string
  codigo: string
  nombre: string
  direccion: string | null
  comuna: string | null
  region: string | null
  telefono: string | null
  email: string | null
  activo: boolean
  created_at: string
  updated_at: string
  total_alumnos?: number
}

/**
 * Alumno - Student
 */
export interface Alumno {
  id: string
  clinica_id: string
  institucion: string
  institucion_nombre?: string
  rut: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  nombre_completo?: string
  fecha_nacimiento: string
  edad: number
  curso: string
  genero: 'M' | 'F' | 'O' | null
  genero_display?: string
  activo: boolean
  created_at: string
  updated_at: string
}

/**
 * Apoderado - Guardian/Parent
 */
export interface Apoderado {
  id: string
  institucion: string
  institucion_nombre?: string
  rut: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  nombre_completo?: string
  email: string | null
  telefono_principal: string
  telefono_secundario: string | null
  consentimiento_informado: boolean
  fecha_consentimiento: string | null
  ip_consentimiento: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

/**
 * PlantillaEncuesta - Survey Template
 */
export interface PlantillaEncuesta {
  id: string
  clinica: string
  clinica_nombre?: string
  nombre: string
  version: string
  descripcion: string | null
  estructura: Record<string, any>
  activo: boolean
  created_at: string
  updated_at: string
}

/**
 * Encuesta - Survey Assignment
 */
export interface Encuesta {
  id: string
  alumno: string
  alumno_nombre?: string
  apoderado: string
  apoderado_nombre?: string
  plantilla_encuesta: string
  plantilla_nombre?: string
  institucion: string
  institucion_nombre?: string
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'revisada' | 'cancelada'
  estado_display?: string
  prioridad: number
  intentos_contacto: number
  created_at: string
  updated_at: string
}

/**
 * RespuestaEncuesta - Survey Response
 */
export interface RespuestaEncuesta {
  id: string
  encuesta: string
  encuesta_id?: string
  respuestas: Record<string, any>
  puntaje_total: number | null
  puntajes_detalle: Record<string, any> | null
  observaciones: string | null
  fecha_inicio: string | null
  fecha_completado: string | null
  duracion_segundos: number | null
  created_at: string
  updated_at: string
}

/**
 * RegistroLlamada - Call Log (ElevenLabs integration)
 */
export interface RegistroLlamada {
  id: string
  encuesta: string
  encuesta_id?: string
  apoderado: string
  apoderado_nombre?: string
  telefono: string
  estado: 'pendiente' | 'en_curso' | 'completada' | 'fallida' | 'sin_respuesta' | 'cancelada'
  estado_display?: string
  fecha_programada: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  duracion_segundos: number | null
  elevenlabs_call_id: string | null
  elevenlabs_agent_id: string | null
  audio_url: string | null
  transcripcion: string | null
  metadatos: Record<string, any> | null
  errores: Record<string, any> | null
  intentos: number
  created_at: string
  updated_at: string
}

/**
 * InformeIcap - Generated Report
 */
export interface InformeIcap {
  id: string
  alumno: string
  alumno_nombre?: string
  encuesta: string | null
  clinica: string
  clinica_nombre?: string
  tipo_informe: 'evaluacion' | 'seguimiento' | 'alta'
  tipo_informe_display?: string
  pdf_url: string | null
  pdf_s3_key: string | null
  fecha_generacion: string
  datos_informe: Record<string, any>
  firmado_por_profesional: boolean
  profesional_id: string | null
  fecha_firma: string | null
  created_at: string
  updated_at: string
}
