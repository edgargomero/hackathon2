/**
 * Django API Response Types
 */

// Student (Alumno)
export interface Student {
  id: string
  clinica_id: string
  institucion_id: string
  rut: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  fecha_nacimiento: string
  edad: number
  curso: string
  genero: 'M' | 'F' | 'O' | null
  activo: boolean
  created_at: string
  updated_at: string
}

// Guardian (Apoderado)
export interface Guardian {
  id: string
  institucion_id: string
  rut: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  email: string | null
  telefono_principal: string
  telefono_secundario: string | null
  consentimiento_informado: boolean
  fecha_consentimiento: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

// Survey (Encuesta)
export interface Survey {
  id: string
  alumno_id: string
  apoderado_id: string
  plantilla_encuesta_id: string
  institucion_id: string
  estado: 'pendiente' | 'en_contacto' | 'agendada' | 'en_progreso' | 'completada' | 'cancelada' | 'rechazada'
  prioridad: number
  intentos_contacto: number
  created_at: string
  updated_at: string
}

// Survey Template (Plantilla Encuesta)
export interface SurveyTemplate {
  id: string
  clinica_id: string
  nombre: string
  version: string
  descripcion: string | null
  estructura: Record<string, any>
  activo: boolean
  created_at: string
  updated_at: string
}

// Institution
export interface Institution {
  id: string
  clinica_id: string
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
}

// Call Log (Registro Llamada)
export interface CallLog {
  id: string
  encuesta_id: string
  apoderado_id: string
  telefono: string
  estado: 'programada' | 'en_curso' | 'completada' | 'fallida' | 'cancelada' | 'no_contesta'
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

// API Error Response
export interface APIError {
  error: string
  detail?: string
  code?: string
}

// Django API Error Response
export interface DjangoErrorResponse {
  detail?: string
  error?: string
  code?: string
  [key: string]: any // Additional error fields
}

// Pagination
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Create/Update inputs
export interface CreateSurveyInput {
  alumno_id: string
  apoderado_id: string
  plantilla_encuesta_id: string
  institucion_id: string
  prioridad?: number
}

export interface UpdateSurveyInput {
  estado?: Survey['estado']
  prioridad?: number
  intentos_contacto?: number
}

export interface CreateStudentInput {
  institucion_id: string
  rut: string
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  fecha_nacimiento: string
  edad: number
  curso: string
  genero?: 'M' | 'F' | 'O'
}

// Report (Informe ICAP)
export interface Report {
  id: string
  clinica_id: string
  tipo_informe: 'icap' | 'evaluacion' | 'seguimiento' | 'personalizado'
  alumno_id?: string
  encuesta_id?: string
  titulo: string
  contenido: Record<string, any>
  archivo_url?: string | null
  generado_por: string
  created_at: string
  updated_at: string
}
