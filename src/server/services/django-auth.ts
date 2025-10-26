import { HTTPException } from 'hono/http-exception'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  TokenRefreshResponse,
  TokenValidateResponse,
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserDetail,
  DjangoErrorResponse,
} from '@shared/types/django'

/**
 * Django Authentication API Client
 *
 * Handles all authentication operations with Django REST API
 * Base URL: /api/auth/
 */
export class DjangoAuthClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, '')
  }

  /**
   * Generic request handler
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers as Record<string, string>,
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Handle non-OK responses
      if (!response.ok) {
        let errorData: DjangoErrorResponse
        try {
          errorData = await response.json()
        } catch {
          errorData = { detail: response.statusText }
        }

        // Extract error message
        const message = errorData.detail || errorData.error || 'Request failed'

        throw new HTTPException(response.status as any, { message })
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

      // Network or parsing errors
      throw new HTTPException(500, {
        message: `Django API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Login - Obtain JWT tokens
   * POST /api/auth/login/
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  /**
   * Register - Create new user account
   * POST /api/auth/register/
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  /**
   * Refresh access token
   * POST /api/auth/token/refresh/
   */
  async refreshToken(refreshToken: string): Promise<TokenRefreshResponse> {
    return this.request<TokenRefreshResponse>('/api/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    })
  }

  /**
   * Validate current token
   * GET /api/auth/validate-token/
   */
  async validateToken(accessToken: string): Promise<TokenValidateResponse> {
    return this.request<TokenValidateResponse>('/api/auth/validate-token/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
  }

  // ==================== USER MANAGEMENT ====================

  /**
   * Get current user info
   * GET /api/auth/users/me/
   */
  async getCurrentUser(accessToken: string): Promise<UserDetail> {
    return this.request<UserDetail>('/api/auth/users/me/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
  }

  /**
   * Get user by ID
   * GET /api/auth/users/{id}/
   */
  async getUserById(userId: number, accessToken: string): Promise<UserDetail> {
    return this.request<UserDetail>(`/api/auth/users/${userId}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
  }

  /**
   * Update user profile
   * PATCH /api/auth/users/{id}/update_profile/
   */
  async updateProfile(
    userId: number,
    updates: UpdateProfileRequest,
    accessToken: string
  ): Promise<UserDetail> {
    return this.request<UserDetail>(`/api/auth/users/${userId}/update_profile/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
  }

  /**
   * Change password
   * POST /api/auth/users/{id}/change_password/
   */
  async changePassword(
    userId: number,
    passwords: ChangePasswordRequest,
    accessToken: string
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/auth/users/${userId}/change_password/`, {
      method: 'POST',
      body: JSON.stringify(passwords),
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
  }

  /**
   * Deactivate user (soft delete)
   * POST /api/auth/users/{id}/deactivate/
   */
  async deactivateUser(
    userId: number,
    accessToken: string
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/auth/users/${userId}/deactivate/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
  }

  /**
   * Activate user
   * POST /api/auth/users/{id}/activate/
   */
  async activateUser(
    userId: number,
    accessToken: string
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/auth/users/${userId}/activate/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
  }
}

/**
 * Factory function to create Django auth client from environment
 */
export function createDjangoAuthClient(env: { DJANGO_API_URL: string }) {
  return new DjangoAuthClient(env.DJANGO_API_URL)
}
