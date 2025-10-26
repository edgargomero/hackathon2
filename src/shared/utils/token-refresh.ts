/**
 * Token Refresh Utility
 *
 * Handles automatic JWT token refresh before expiry
 * Access tokens expire in 1 hour, refresh 5 minutes before
 */

const REFRESH_BUFFER = 5 * 60 * 1000 // 5 minutes in milliseconds
const ACCESS_TOKEN_LIFETIME = 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * Parse JWT token to extract expiry time
 * Does NOT validate signature - only extracts claims
 */
export function parseJWT(token: string): { exp?: number; iat?: number } {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return {}
  }
}

/**
 * Check if token needs refresh
 * Returns true if token expires in less than 5 minutes
 */
export function shouldRefreshToken(accessToken: string): boolean {
  const claims = parseJWT(accessToken)

  if (!claims.exp) {
    return true // If we can't read expiry, assume we need refresh
  }

  const expiryTime = claims.exp * 1000 // Convert to milliseconds
  const currentTime = Date.now()
  const timeUntilExpiry = expiryTime - currentTime

  return timeUntilExpiry < REFRESH_BUFFER
}

/**
 * Refresh access token using refresh token
 * Returns new access token or null if refresh failed
 */
export async function refreshAccessToken(
  refreshToken: string,
  apiUrl: string
): Promise<string | null> {
  try {
    const response = await fetch(`${apiUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.access || null
  } catch {
    return null
  }
}

/**
 * Setup automatic token refresh interval
 * Returns cleanup function to clear interval
 */
export function setupTokenRefresh(
  getTokens: () => { access: string | null; refresh: string | null },
  updateAccessToken: (newToken: string) => void,
  onRefreshFailed: () => void,
  apiUrl: string
): () => void {
  // Check every minute
  const intervalId = setInterval(async () => {
    const { access, refresh } = getTokens()

    if (!access || !refresh) {
      return
    }

    if (shouldRefreshToken(access)) {
      const newToken = await refreshAccessToken(refresh, apiUrl)

      if (newToken) {
        updateAccessToken(newToken)
        console.log('[Token Refresh] Access token refreshed successfully')
      } else {
        console.error('[Token Refresh] Failed to refresh token')
        onRefreshFailed()
      }
    }
  }, 60 * 1000) // Check every minute

  // Return cleanup function
  return () => clearInterval(intervalId)
}

/**
 * Get time until token expiry in seconds
 */
export function getTokenExpiryTime(accessToken: string): number {
  const claims = parseJWT(accessToken)

  if (!claims.exp) {
    return 0
  }

  const expiryTime = claims.exp * 1000
  const currentTime = Date.now()
  const timeUntilExpiry = Math.max(0, expiryTime - currentTime)

  return Math.floor(timeUntilExpiry / 1000) // Return in seconds
}

/**
 * Check if token is expired
 */
export function isTokenExpired(accessToken: string): boolean {
  const claims = parseJWT(accessToken)

  if (!claims.exp) {
    return true
  }

  const expiryTime = claims.exp * 1000
  const currentTime = Date.now()

  return currentTime >= expiryTime
}
