/**
 * dashboard-api.ts - Cliente API para Dashboard
 *
 * Funciones para fetch de datos del dashboard desde Hono backend
 * El backend hace proxy a Django REST API
 */

import { z } from 'zod'
import type {
  DashboardData,
  DashboardStats,
  DashboardQueryParams,
  DashboardExportOptions
} from '@shared/types/dashboard'

// ============ Validation Schemas ============

const DashboardDataSchema = z.object({
  success: z.boolean(),
  data: z.any() // Dashboard types already validated in shared/types
})

const DashboardStatsSchema = z.object({
  success: z.boolean(),
  data: z.any()
})

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional()
})

// ============ API Functions ============

/**
 * Fetch complete dashboard data
 *
 * Endpoint: GET /api/dashboard/api
 */
export async function fetchDashboardData(
  params?: DashboardQueryParams
): Promise<DashboardData> {
  const query = new URLSearchParams()

  if (params?.period) query.append('period', params.period)
  if (params?.startDate) query.append('start_date', params.startDate)
  if (params?.endDate) query.append('end_date', params.endDate)
  if (params?.institucionId) query.append('institucion_id', params.institucionId)
  if (params?.limit) query.append('limit', params.limit.toString())
  if (params?.offset) query.append('offset', params.offset.toString())

  const url = `/api/dashboard/api${query.toString() ? '?' + query.toString() : ''}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Enviar cookies JWT
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const parsed = ErrorResponseSchema.safeParse(errorData)

      if (parsed.success) {
        throw new Error(parsed.data.message || parsed.data.error)
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const json = await response.json()
    const validated = DashboardDataSchema.parse(json)

    return validated.data as DashboardData
  } catch (error) {
    console.error('[DashboardAPI] Error fetching dashboard data:', error)
    throw error
  }
}

/**
 * Fetch only dashboard statistics
 *
 * Endpoint: GET /api/dashboard/stats
 */
export async function fetchDashboardStats(
  params?: DashboardQueryParams
): Promise<DashboardStats> {
  const query = new URLSearchParams()

  if (params?.period) query.append('period', params.period)
  if (params?.startDate) query.append('start_date', params.startDate)
  if (params?.endDate) query.append('end_date', params.endDate)

  const url = `/api/dashboard/stats${query.toString() ? '?' + query.toString() : ''}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const parsed = ErrorResponseSchema.safeParse(errorData)

      if (parsed.success) {
        throw new Error(parsed.data.message || parsed.data.error)
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const json = await response.json()
    const validated = DashboardStatsSchema.parse(json)

    return validated.data as DashboardStats
  } catch (error) {
    console.error('[DashboardAPI] Error fetching dashboard stats:', error)
    throw error
  }
}

/**
 * Export dashboard data
 *
 * Endpoint: GET /api/dashboard/export
 * Returns: File download (CSV, XLSX, PDF)
 */
export async function exportDashboard(options: DashboardExportOptions): Promise<void> {
  const query = new URLSearchParams()

  query.append('format', options.format)
  query.append('period', options.period)
  if (options.startDate) query.append('start_date', options.startDate)
  if (options.endDate) query.append('end_date', options.endDate)
  query.append('include_charts', options.includeCharts.toString())
  query.append('include_activity', options.includeActivity.toString())

  const url = `/api/dashboard/export?${query.toString()}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const parsed = ErrorResponseSchema.safeParse(errorData)

      if (parsed.success) {
        throw new Error(parsed.data.message || parsed.data.error)
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Detectar tipo de contenido
    const contentType = response.headers.get('Content-Type')

    if (contentType?.includes('application/json')) {
      // Respuesta JSON (formato no implementado aún)
      const json = await response.json() as { message?: string }
      console.warn('[DashboardAPI] Export format not yet implemented:', json.message)
      alert(json.message || 'Export format coming soon!')
      return
    }

    // Descargar archivo
    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition')
    const filenameMatch = disposition?.match(/filename="(.+)"/)
    const filename =
      filenameMatch?.[1] ||
      `dashboard-export-${new Date().toISOString().split('T')[0]}.${options.format}`

    // Crear link temporal para descarga
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('[DashboardAPI] Error exporting dashboard:', error)
    throw error
  }
}
