/**
 * Authentication Usage Example
 *
 * This file demonstrates how to use the authentication system
 * in client-side JavaScript applications
 */

import {
  setupTokenRefresh,
  shouldRefreshToken,
  refreshAccessToken,
  parseJWT,
  getTokenExpiryTime,
  isTokenExpired,
} from '@shared/utils/token-refresh'

// ==================== CONFIGURATION ====================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173'

// ==================== TOKEN STORAGE ====================

/**
 * Token storage interface
 * Use localStorage for development, consider sessionStorage or memory for production
 */
class TokenStorage {
  setAccessToken(token: string) {
    localStorage.setItem('access_token', token)
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  }

  setRefreshToken(token: string) {
    localStorage.setItem('refresh_token', token)
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token')
  }

  setUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user))
  }

  getUser(): any | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }

  clear() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken()
    return token !== null && !isTokenExpired(token)
  }
}

export const tokenStorage = new TokenStorage()

// ==================== AUTH SERVICE ====================

export class AuthService {
  private cleanupTokenRefresh?: () => void

  /**
   * Login user
   */
  async login(username: string, password: string) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }

    const data = await response.json()

    // Store tokens and user
    tokenStorage.setAccessToken(data.tokens.access)
    tokenStorage.setRefreshToken(data.tokens.refresh)
    tokenStorage.setUser(data.user)

    // Setup automatic token refresh
    this.setupAutoRefresh()

    return data.user
  }

  /**
   * Register new user
   */
  async register(userData: {
    username: string
    email: string
    password: string
    password2: string
    first_name: string
    last_name: string
    role: string
    clinica_id: string
  }) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Registration failed')
    }

    const data = await response.json()

    // Store tokens and user
    tokenStorage.setAccessToken(data.tokens.access)
    tokenStorage.setRefreshToken(data.tokens.refresh)
    tokenStorage.setUser(data.user)

    // Setup automatic token refresh
    this.setupAutoRefresh()

    return data.user
  }

  /**
   * Logout user
   */
  async logout() {
    // Cleanup auto-refresh
    if (this.cleanupTokenRefresh) {
      this.cleanupTokenRefresh()
    }

    // Call logout endpoint to clear cookies
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })

    // Clear local storage
    tokenStorage.clear()
  }

  /**
   * Get current user from API
   */
  async getCurrentUser() {
    const token = tokenStorage.getAccessToken()

    if (!token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user')
    }

    const user = await response.json()
    tokenStorage.setUser(user)

    return user
  }

  /**
   * Setup automatic token refresh
   */
  private setupAutoRefresh() {
    this.cleanupTokenRefresh = setupTokenRefresh(
      // Get tokens
      () => ({
        access: tokenStorage.getAccessToken(),
        refresh: tokenStorage.getRefreshToken(),
      }),
      // Update access token
      (newToken) => {
        tokenStorage.setAccessToken(newToken)
        console.log('[Auth] Access token refreshed')
      },
      // On refresh failed
      () => {
        console.error('[Auth] Token refresh failed - logging out')
        this.logout()
        window.location.href = '/login'
      },
      API_URL
    )
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenStorage.isAuthenticated()
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return tokenStorage.getAccessToken()
  }
}

// ==================== HTTP CLIENT ====================

/**
 * Authenticated HTTP client
 * Automatically includes auth token and handles token refresh
 */
export class AuthenticatedClient {
  private authService: AuthService

  constructor(authService: AuthService) {
    this.authService = authService
  }

  /**
   * Make authenticated request
   */
  async request(url: string, options: RequestInit = {}) {
    let accessToken = this.authService.getAccessToken()

    if (!accessToken) {
      throw new Error('Not authenticated')
    }

    // Check if token needs refresh
    if (shouldRefreshToken(accessToken)) {
      const refreshToken = tokenStorage.getRefreshToken()

      if (refreshToken) {
        const newToken = await refreshAccessToken(refreshToken, API_URL)

        if (newToken) {
          tokenStorage.setAccessToken(newToken)
          accessToken = newToken
        } else {
          // Refresh failed - logout
          await this.authService.logout()
          window.location.href = '/login'
          throw new Error('Session expired')
        }
      }
    }

    // Make request with token
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    // Handle 401 (token invalid)
    if (response.status === 401) {
      await this.authService.logout()
      window.location.href = '/login'
      throw new Error('Session expired')
    }

    return response
  }

  /**
   * GET request
   */
  async get(url: string) {
    const response = await this.request(url, { method: 'GET' })
    return response.json()
  }

  /**
   * POST request
   */
  async post(url: string, data: any) {
    const response = await this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.json()
  }

  /**
   * PATCH request
   */
  async patch(url: string, data: any) {
    const response = await this.request(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    return response.json()
  }

  /**
   * DELETE request
   */
  async delete(url: string) {
    const response = await this.request(url, { method: 'DELETE' })

    if (response.status === 204) {
      return null
    }

    return response.json()
  }
}

// ==================== USAGE EXAMPLES ====================

// Create singleton instances
export const authService = new AuthService()
export const apiClient = new AuthenticatedClient(authService)

// Example usage in components:

/*
// Login
async function handleLogin(username, password) {
  try {
    const user = await authService.login(username, password)
    console.log('Logged in:', user)
    // Redirect to dashboard
    window.location.href = '/dashboard'
  } catch (error) {
    console.error('Login failed:', error.message)
    alert(error.message)
  }
}

// Logout
async function handleLogout() {
  await authService.logout()
  window.location.href = '/login'
}

// Make authenticated request
async function fetchStudents() {
  try {
    const students = await apiClient.get('/api/students')
    console.log('Students:', students)
    return students.data
  } catch (error) {
    console.error('Failed to fetch students:', error)
  }
}

// Create student
async function createStudent(studentData) {
  try {
    const newStudent = await apiClient.post('/api/students', studentData)
    console.log('Created student:', newStudent)
    return newStudent
  } catch (error) {
    console.error('Failed to create student:', error)
  }
}

// Update student
async function updateStudent(studentId, updates) {
  try {
    const updated = await apiClient.patch(`/api/students/${studentId}`, updates)
    console.log('Updated student:', updated)
    return updated
  } catch (error) {
    console.error('Failed to update student:', error)
  }
}

// Delete student
async function deleteStudent(studentId) {
  try {
    await apiClient.delete(`/api/students/${studentId}`)
    console.log('Student deleted')
  } catch (error) {
    console.error('Failed to delete student:', error)
  }
}

// Check if authenticated
if (!authService.isAuthenticated()) {
  window.location.href = '/login'
}

// Get current user
const currentUser = tokenStorage.getUser()
console.log('Current user:', currentUser)

// Check token expiry
const token = tokenStorage.getAccessToken()
if (token) {
  const expiresIn = getTokenExpiryTime(token)
  console.log(`Token expires in ${expiresIn} seconds`)
}
*/
