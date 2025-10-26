import { HTTPException } from 'hono/http-exception'
import type {
  Survey,
  SurveyTemplate,
  Student,
  Guardian,
  CallLog,
  CreateSurveyInput,
  UpdateSurveyInput,
  CreateStudentInput,
  PaginatedResponse,
  APIError,
} from '@shared/types/api'

/**
 * Django OMR API Client
 *
 * Handles all write operations and business logic through Django REST API
 */
export class DjangoAPIClient {
  private baseURL: string
  private apiKey: string

  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL.replace(/\/$/, '') // Remove trailing slash
    this.apiKey = apiKey
  }

  /**
   * Generic request handler with authentication
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      })

      // Handle non-200 responses
      if (!response.ok) {
        const errorData: APIError = await response.json().catch(() => ({
          error: 'Unknown error',
          detail: response.statusText,
        }))

        throw new HTTPException(response.status, {
          message: errorData.detail || errorData.error,
        })
      }

      return response.json()
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }

      // Network or parsing errors
      throw new HTTPException(500, {
        message: `Django API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  // ==================== SURVEYS ====================

  /**
   * Create a new survey assignment
   */
  async createSurvey(data: CreateSurveyInput): Promise<Survey> {
    return this.request<Survey>('/api/encuestas/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Update an existing survey
   */
  async updateSurvey(id: string, data: UpdateSurveyInput): Promise<Survey> {
    return this.request<Survey>(`/api/encuestas/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  /**
   * Delete a survey
   */
  async deleteSurvey(id: string): Promise<void> {
    await this.request<void>(`/api/encuestas/${id}/`, {
      method: 'DELETE',
    })
  }

  // ==================== STUDENTS ====================

  /**
   * Create a new student
   */
  async createStudent(data: CreateStudentInput): Promise<Student> {
    return this.request<Student>('/api/alumnos/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Update a student
   */
  async updateStudent(id: string, data: Partial<CreateStudentInput>): Promise<Student> {
    return this.request<Student>(`/api/alumnos/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  /**
   * Delete a student (soft delete)
   */
  async deleteStudent(id: string): Promise<void> {
    await this.request<void>(`/api/alumnos/${id}/`, {
      method: 'DELETE',
    })
  }

  // ==================== GUARDIANS ====================

  /**
   * Create a new guardian
   */
  async createGuardian(data: Omit<Guardian, 'id' | 'created_at' | 'updated_at'>): Promise<Guardian> {
    return this.request<Guardian>('/api/apoderados/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ==================== CALLS ====================

  /**
   * Initiate an ElevenLabs call for a survey
   */
  async initiateCall(surveyId: string): Promise<CallLog> {
    return this.request<CallLog>(`/api/encuestas/${surveyId}/initiate_call/`, {
      method: 'POST',
    })
  }

  /**
   * Retry a failed call
   */
  async retryCall(callId: string): Promise<CallLog> {
    return this.request<CallLog>(`/api/registro-llamadas/${callId}/retry/`, {
      method: 'POST',
    })
  }

  // ==================== REPORTS ====================

  /**
   * Generate a PDF report for a survey
   */
  async generateReport(surveyId: string): Promise<{ pdf_url: string; informe_id: string }> {
    return this.request<{ pdf_url: string; informe_id: string }>('/api/informes/generate/', {
      method: 'POST',
      body: JSON.stringify({ encuesta_id: surveyId }),
    })
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Validate a Django token and get user info
   */
  async validateToken(token: string): Promise<{ user_id: number; username: string; email: string }> {
    return this.request<{ user_id: number; username: string; email: string }>('/api/auth/validate/', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
      },
    })
  }
}

/**
 * Factory function to create Django client from environment
 */
export function createDjangoClient(env: { DJANGO_API_URL: string; DJANGO_API_KEY: string }) {
  return new DjangoAPIClient(env.DJANGO_API_URL, env.DJANGO_API_KEY)
}
