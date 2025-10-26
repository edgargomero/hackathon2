import { HTTPException } from 'hono/http-exception'
import type {
  Student,
  Institution,
  Guardian,
  Survey,
  SurveyTemplate,
  CallLog,
  Report,
  PaginatedResponse,
  DjangoErrorResponse,
} from '@shared/types/api'

/**
 * Django Data API Client
 *
 * Handles all data operations with Django REST API
 * Base URL: /api/data/
 *
 * All endpoints require authentication via JWT token
 * All queries are automatically filtered by clinica_id based on user's token
 */
export class DjangoDataClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, '')
  }

  /**
   * Generic request handler with auth
   */
  private async request<T>(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers as Record<string, string>,
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Handle non-OK responses
      if (!response.ok) {
        const errorData: DjangoErrorResponse = await response.json().catch(() => ({
          detail: response.statusText,
        }))

        const message = errorData.detail || errorData.error || 'Request failed'
        throw new HTTPException(response.status, { message })
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T
      }

      return response.json()
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }

      throw new HTTPException(500, {
        message: `Django API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  // ==================== INSTITUTIONS ====================

  /**
   * Get institutions
   * GET /api/data/instituciones/
   */
  async getInstitutions(
    accessToken: string,
    filters?: {
      clinica_id?: string
      activo?: boolean
      search?: string
    }
  ): Promise<Institution[]> {
    const params = new URLSearchParams()
    if (filters?.clinica_id) params.set('clinica_id', filters.clinica_id)
    if (filters?.activo !== undefined) params.set('activo', String(filters.activo))
    if (filters?.search) params.set('search', filters.search)

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<Institution[]>(`/api/data/instituciones/${query}`, accessToken)
  }

  /**
   * Get single institution
   * GET /api/data/instituciones/{id}/
   */
  async getInstitution(
    institutionId: string,
    accessToken: string
  ): Promise<Institution> {
    return this.request<Institution>(`/api/data/instituciones/${institutionId}/`, accessToken)
  }

  /**
   * Create institution
   * POST /api/data/instituciones/
   */
  async createInstitution(
    data: Partial<Institution>,
    accessToken: string
  ): Promise<Institution> {
    return this.request<Institution>(`/api/data/instituciones/`, accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Update institution
   * PATCH /api/data/instituciones/{id}/
   */
  async updateInstitution(
    institutionId: string,
    data: Partial<Institution>,
    accessToken: string
  ): Promise<Institution> {
    return this.request<Institution>(`/api/data/instituciones/${institutionId}/`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  /**
   * Delete institution (soft delete)
   * DELETE /api/data/instituciones/{id}/
   */
  async deleteInstitution(
    institutionId: string,
    accessToken: string
  ): Promise<void> {
    await this.request<void>(`/api/data/instituciones/${institutionId}/`, accessToken, {
      method: 'DELETE',
    })
  }

  // ==================== STUDENTS ====================

  /**
   * Get students with pagination
   * GET /api/data/alumnos/
   */
  async getStudents(
    accessToken: string,
    filters?: {
      institucion_id?: string
      curso?: string
      search?: string
      page?: number
      page_size?: number
    }
  ): Promise<PaginatedResponse<Student>> {
    const params = new URLSearchParams()
    if (filters?.institucion_id) params.set('institucion_id', filters.institucion_id)
    if (filters?.curso) params.set('curso', filters.curso)
    if (filters?.search) params.set('search', filters.search)
    if (filters?.page) params.set('page', String(filters.page))
    if (filters?.page_size) params.set('page_size', String(filters.page_size))

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<PaginatedResponse<Student>>(`/api/data/alumnos/${query}`, accessToken)
  }

  /**
   * Get single student
   * GET /api/data/alumnos/{id}/
   */
  async getStudent(
    studentId: string,
    accessToken: string
  ): Promise<Student> {
    return this.request<Student>(`/api/data/alumnos/${studentId}/`, accessToken)
  }

  /**
   * Create student
   * POST /api/data/alumnos/
   */
  async createStudent(
    data: Partial<Student>,
    accessToken: string
  ): Promise<Student> {
    return this.request<Student>(`/api/data/alumnos/`, accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Update student
   * PATCH /api/data/alumnos/{id}/
   */
  async updateStudent(
    studentId: string,
    data: Partial<Student>,
    accessToken: string
  ): Promise<Student> {
    return this.request<Student>(`/api/data/alumnos/${studentId}/`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  /**
   * Delete student (soft delete)
   * DELETE /api/data/alumnos/{id}/
   */
  async deleteStudent(
    studentId: string,
    accessToken: string
  ): Promise<void> {
    await this.request<void>(`/api/data/alumnos/${studentId}/`, accessToken, {
      method: 'DELETE',
    })
  }

  // ==================== GUARDIANS ====================

  /**
   * Get guardians
   * GET /api/data/apoderados/
   */
  async getGuardians(
    accessToken: string,
    filters?: {
      search?: string
      page?: number
      page_size?: number
    }
  ): Promise<PaginatedResponse<Guardian>> {
    const params = new URLSearchParams()
    if (filters?.search) params.set('search', filters.search)
    if (filters?.page) params.set('page', String(filters.page))
    if (filters?.page_size) params.set('page_size', String(filters.page_size))

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<PaginatedResponse<Guardian>>(`/api/data/apoderados/${query}`, accessToken)
  }

  /**
   * Get single guardian
   * GET /api/data/apoderados/{id}/
   */
  async getGuardian(
    guardianId: string,
    accessToken: string
  ): Promise<Guardian> {
    return this.request<Guardian>(`/api/data/apoderados/${guardianId}/`, accessToken)
  }

  /**
   * Create guardian
   * POST /api/data/apoderados/
   */
  async createGuardian(
    data: Partial<Guardian>,
    accessToken: string
  ): Promise<Guardian> {
    return this.request<Guardian>(`/api/data/apoderados/`, accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Update guardian
   * PATCH /api/data/apoderados/{id}/
   */
  async updateGuardian(
    guardianId: string,
    data: Partial<Guardian>,
    accessToken: string
  ): Promise<Guardian> {
    return this.request<Guardian>(`/api/data/apoderados/${guardianId}/`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  /**
   * Delete guardian (soft delete)
   * DELETE /api/data/apoderados/{id}/
   */
  async deleteGuardian(
    guardianId: string,
    accessToken: string
  ): Promise<void> {
    await this.request<void>(`/api/data/apoderados/${guardianId}/`, accessToken, {
      method: 'DELETE',
    })
  }

  // ==================== SURVEYS ====================

  /**
   * Get surveys
   * GET /api/data/encuestas/
   */
  async getSurveys(
    accessToken: string,
    filters?: {
      estado?: Survey['estado']
      institucion_id?: string
      page?: number
      page_size?: number
    }
  ): Promise<PaginatedResponse<Survey>> {
    const params = new URLSearchParams()
    if (filters?.estado) params.set('estado', filters.estado)
    if (filters?.institucion_id) params.set('institucion_id', filters.institucion_id)
    if (filters?.page) params.set('page', String(filters.page))
    if (filters?.page_size) params.set('page_size', String(filters.page_size))

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<PaginatedResponse<Survey>>(`/api/data/encuestas/${query}`, accessToken)
  }

  /**
   * Get single survey
   * GET /api/data/encuestas/{id}/
   */
  async getSurvey(
    surveyId: string,
    accessToken: string
  ): Promise<Survey> {
    return this.request<Survey>(`/api/data/encuestas/${surveyId}/`, accessToken)
  }

  /**
   * Create survey
   * POST /api/data/encuestas/
   */
  async createSurvey(
    data: Partial<Survey>,
    accessToken: string
  ): Promise<Survey> {
    return this.request<Survey>(`/api/data/encuestas/`, accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Update survey
   * PATCH /api/data/encuestas/{id}/
   */
  async updateSurvey(
    surveyId: string,
    data: Partial<Survey>,
    accessToken: string
  ): Promise<Survey> {
    return this.request<Survey>(`/api/data/encuestas/${surveyId}/`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // ==================== CALL LOGS ====================

  /**
   * Get call logs
   * GET /api/data/llamadas/
   */
  async getCallLogs(
    accessToken: string,
    filters?: {
      estado?: CallLog['estado']
      encuesta_id?: string
      page?: number
      page_size?: number
    }
  ): Promise<PaginatedResponse<CallLog>> {
    const params = new URLSearchParams()
    if (filters?.estado) params.set('estado', filters.estado)
    if (filters?.encuesta_id) params.set('encuesta_id', filters.encuesta_id)
    if (filters?.page) params.set('page', String(filters.page))
    if (filters?.page_size) params.set('page_size', String(filters.page_size))

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<PaginatedResponse<CallLog>>(`/api/data/llamadas/${query}`, accessToken)
  }

  /**
   * Get single call log
   * GET /api/data/llamadas/{id}/
   */
  async getCallLog(
    callLogId: string,
    accessToken: string
  ): Promise<CallLog> {
    return this.request<CallLog>(`/api/data/llamadas/${callLogId}/`, accessToken)
  }

  /**
   * Create call log
   * POST /api/data/llamadas/
   */
  async createCallLog(
    data: Partial<CallLog>,
    accessToken: string
  ): Promise<CallLog> {
    return this.request<CallLog>(`/api/data/llamadas/`, accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Update call log
   * PATCH /api/data/llamadas/{id}/
   */
  async updateCallLog(
    callLogId: string,
    data: Partial<CallLog>,
    accessToken: string
  ): Promise<CallLog> {
    return this.request<CallLog>(`/api/data/llamadas/${callLogId}/`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // ==================== REPORTS ====================

  /**
   * Get reports
   * GET /api/data/informes/
   */
  async getReports(
    accessToken: string,
    filters?: {
      tipo_informe?: Report['tipo_informe']
      page?: number
      page_size?: number
    }
  ): Promise<PaginatedResponse<Report>> {
    const params = new URLSearchParams()
    if (filters?.tipo_informe) params.set('tipo_informe', filters.tipo_informe)
    if (filters?.page) params.set('page', String(filters.page))
    if (filters?.page_size) params.set('page_size', String(filters.page_size))

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<PaginatedResponse<Report>>(`/api/data/informes/${query}`, accessToken)
  }

  /**
   * Get single report
   * GET /api/data/informes/{id}/
   */
  async getReport(
    reportId: string,
    accessToken: string
  ): Promise<Report> {
    return this.request<Report>(`/api/data/informes/${reportId}/`, accessToken)
  }

  /**
   * Generate report
   * POST /api/data/informes/
   */
  async generateReport(
    data: Partial<Report>,
    accessToken: string
  ): Promise<Report> {
    return this.request<Report>(`/api/data/informes/`, accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Delete report
   * DELETE /api/data/informes/{id}/
   */
  async deleteReport(
    reportId: string,
    accessToken: string
  ): Promise<void> {
    await this.request<void>(`/api/data/informes/${reportId}/`, accessToken, {
      method: 'DELETE',
    })
  }

  // ==================== DASHBOARD STATISTICS ====================

  /**
   * Get dashboard statistics
   * Custom endpoint that aggregates data for dashboard
   */
  async getDashboardStats(accessToken: string): Promise<{
    activeInstitutions: number
    totalStudents: number
    pendingSurveys: number
    completedSurveys: number
    reportsGenerated: number
    recentActivity: any[]
  }> {
    // This would need to be implemented as a custom Django endpoint
    // For now, we'll fetch data from multiple endpoints
    const [institutions, students, surveys] = await Promise.all([
      this.getInstitutions(accessToken, { activo: true }),
      this.getStudents(accessToken, { page_size: 1 }),
      this.getSurveys(accessToken, { page_size: 100 }),
    ])

    const pendingSurveys = surveys.results?.filter(s => s.estado === 'pendiente').length || 0
    const completedSurveys = surveys.results?.filter(s => s.estado === 'completada').length || 0

    return {
      activeInstitutions: institutions.length,
      totalStudents: students.count || 0,
      pendingSurveys,
      completedSurveys,
      reportsGenerated: 0, // Would need reports endpoint
      recentActivity: surveys.results?.slice(0, 10) || [],
    }
  }
}

/**
 * Factory function to create Django data client from environment
 */
export function createDjangoDataClient(env: { DJANGO_API_URL: string }) {
  return new DjangoDataClient(env.DJANGO_API_URL)
}
