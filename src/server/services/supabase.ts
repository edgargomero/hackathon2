import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Student, Survey, Institution, Guardian, CallLog } from '@shared/types/api'

/**
 * Supabase Client for Direct Database Queries
 *
 * Used for read-optimized operations to reduce Django load
 * All queries must include multi-tenant filtering by clinica_id
 */

export type SupabaseClientInstance = SupabaseClient<any>

/**
 * Create Supabase client with service role key
 */
export function createSupabaseClient(env: {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}): SupabaseClientInstance {
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// ==================== QUERY HELPERS ====================

/**
 * Get students with filtering
 */
export async function getStudents(
  supabase: SupabaseClientInstance,
  clinicaId: string,
  filters: {
    search?: string
    institucionId?: string
    curso?: string
    activo?: boolean
    limit?: number
    offset?: number
  } = {}
) {
  let query = supabase
    .from('alumno')
    .select(`
      *,
      institucion:institucion_id (
        id,
        nombre,
        codigo
      )
    `, { count: 'exact' })

  // Multi-tenant filtering - CRITICAL!
  // Note: We're filtering at app level since clinica_id is in institucion table
  if (filters.institucionId) {
    query = query.eq('institucion_id', filters.institucionId)
  }

  // Search by name or RUT
  if (filters.search) {
    query = query.or(`nombre.ilike.%${filters.search}%,rut.ilike.%${filters.search}%,apellido_paterno.ilike.%${filters.search}%`)
  }

  // Filter by course
  if (filters.curso) {
    query = query.eq('curso', filters.curso)
  }

  // Filter by active status
  if (filters.activo !== undefined) {
    query = query.eq('activo', filters.activo)
  }

  // Pagination
  const limit = filters.limit ?? 50
  const offset = filters.offset ?? 0

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return { data: data as Student[], count: count ?? 0 }
}

/**
 * Get single student by ID
 */
export async function getStudentById(
  supabase: SupabaseClientInstance,
  studentId: string,
  clinicaId: string
) {
  const { data, error } = await supabase
    .from('alumno')
    .select(`
      *,
      institucion:institucion_id (
        id,
        nombre,
        codigo,
        clinica_id
      )
    `)
    .eq('id', studentId)
    .single()

  if (error) throw error

  // Verify tenant ownership
  if (data.institucion.clinica_id !== clinicaId) {
    throw new Error('Unauthorized access to student')
  }

  return data as Student
}

/**
 * Get surveys with related data
 */
export async function getSurveys(
  supabase: SupabaseClientInstance,
  clinicaId: string,
  filters: {
    estado?: Survey['estado']
    institucionId?: string
    plantillaId?: string
    limit?: number
    offset?: number
  } = {}
) {
  let query = supabase
    .from('encuesta')
    .select(`
      *,
      alumno:alumno_id (
        id,
        nombre,
        apellido_paterno,
        rut
      ),
      apoderado:apoderado_id (
        id,
        nombre,
        apellido_paterno,
        telefono_principal
      ),
      plantilla_encuesta:plantilla_encuesta_id (
        id,
        nombre,
        version
      ),
      institucion:institucion_id (
        id,
        nombre,
        clinica_id
      )
    `, { count: 'exact' })

  // Filter by institution (which contains clinica_id)
  if (filters.institucionId) {
    query = query.eq('institucion_id', filters.institucionId)
  }

  // Filter by status
  if (filters.estado) {
    query = query.eq('estado', filters.estado)
  }

  // Filter by template
  if (filters.plantillaId) {
    query = query.eq('plantilla_encuesta_id', filters.plantillaId)
  }

  const limit = filters.limit ?? 50
  const offset = filters.offset ?? 0

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  // Post-filter by clinica_id (since it's in nested institucion)
  const filteredData = data?.filter(survey => survey.institucion.clinica_id === clinicaId) ?? []

  return { data: filteredData as Survey[], count: count ?? 0 }
}

/**
 * Get call logs with related data
 */
export async function getCallLogs(
  supabase: SupabaseClientInstance,
  clinicaId: string,
  filters: {
    estado?: CallLog['estado']
    encuestaId?: string
    limit?: number
    offset?: number
  } = {}
) {
  let query = supabase
    .from('registro_llamada')
    .select(`
      *,
      encuesta:encuesta_id (
        id,
        institucion:institucion_id (
          clinica_id
        ),
        plantilla_encuesta:plantilla_encuesta_id (
          nombre
        )
      ),
      apoderado:apoderado_id (
        id,
        nombre,
        apellido_paterno,
        telefono_principal
      )
    `, { count: 'exact' })

  // Filter by survey
  if (filters.encuestaId) {
    query = query.eq('encuesta_id', filters.encuestaId)
  }

  // Filter by status
  if (filters.estado) {
    query = query.eq('estado', filters.estado)
  }

  const limit = filters.limit ?? 50
  const offset = filters.offset ?? 0

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  // Post-filter by clinica_id
  const filteredData = data?.filter(log => log.encuesta?.institucion?.clinica_id === clinicaId) ?? []

  return { data: filteredData as CallLog[], count: count ?? 0 }
}

/**
 * Get institutions for a clinic
 */
export async function getInstitutions(
  supabase: SupabaseClientInstance,
  clinicaId: string
) {
  const { data, error } = await supabase
    .from('institucion')
    .select('*')
    .eq('clinica_id', clinicaId)
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (error) throw error

  return data as Institution[]
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(
  supabase: SupabaseClientInstance,
  clinicaId: string
) {
  // Get institutions for this clinic
  const { data: institutions } = await supabase
    .from('institucion')
    .select('id')
    .eq('clinica_id', clinicaId)

  const institutionIds = institutions?.map(i => i.id) ?? []

  if (institutionIds.length === 0) {
    return {
      activeInstitutions: 0,
      pendingSurveys: 0,
      completedSurveys: 0,
      reportsGenerated: 0,
    }
  }

  // Run queries in parallel
  const [
    activeInstitutionsResult,
    pendingSurveysResult,
    completedSurveysResult,
    reportsResult,
  ] = await Promise.all([
    supabase
      .from('institucion')
      .select('id', { count: 'exact', head: true })
      .eq('clinica_id', clinicaId)
      .eq('activo', true),

    supabase
      .from('encuesta')
      .select('id', { count: 'exact', head: true })
      .in('institucion_id', institutionIds)
      .eq('estado', 'pendiente'),

    supabase
      .from('encuesta')
      .select('id', { count: 'exact', head: true })
      .in('institucion_id', institutionIds)
      .eq('estado', 'completada'),

    supabase
      .from('informe_icap')
      .select('id', { count: 'exact', head: true })
      .eq('clinica_id', clinicaId),
  ])

  return {
    activeInstitutions: activeInstitutionsResult.count ?? 0,
    pendingSurveys: pendingSurveysResult.count ?? 0,
    completedSurveys: completedSurveysResult.count ?? 0,
    reportsGenerated: reportsResult.count ?? 0,
  }
}

/**
 * Get recent survey activity
 */
export async function getRecentActivity(
  supabase: SupabaseClientInstance,
  clinicaId: string,
  limit: number = 10
) {
  const { data: institutions } = await supabase
    .from('institucion')
    .select('id')
    .eq('clinica_id', clinicaId)

  const institutionIds = institutions?.map(i => i.id) ?? []

  if (institutionIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('encuesta')
    .select(`
      *,
      institucion:institucion_id (nombre),
      plantilla_encuesta:plantilla_encuesta_id (nombre)
    `)
    .in('institucion_id', institutionIds)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return data
}
