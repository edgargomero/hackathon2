/**
 * Dashboard Routes
 *
 * API endpoints for clinic administrator dashboard
 * Provides statistics, trends, and activity data via Django REST API
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { HonoEnv } from '@shared/types/env'
import { getDashboardStatsFromDjango, getDashboardDataFromDjango } from '@server/services/dashboard-django'

const app = new Hono<HonoEnv>()

// Validation schemas
const dashboardQuerySchema = z.object({
  period: z
    .enum(['last_7_days', 'this_month', 'last_30_days', 'custom'])
    .optional()
    .default('this_month'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  institucion_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

const exportQuerySchema = z.object({
  format: z.enum(['csv', 'xlsx', 'pdf']).default('csv'),
  period: z
    .enum(['last_7_days', 'this_month', 'last_30_days', 'custom'])
    .default('this_month'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  include_charts: z.coerce.boolean().optional().default(true),
  include_activity: z.coerce.boolean().optional().default(true),
})

/**
 * GET / (HTML page)
 * DEPRECATED: SSR removed in favor of SPA
 * This route now redirects to the SPA served from index.html
 *
 * The actual dashboard is now a Preact SPA that calls /api endpoints
 */
app.get('/', (c) => {
  // Redirect to root which serves index.html with Preact SPA
  return c.redirect('/')
})

/**
 * GET /api (JSON API)
 * Get complete dashboard data from Django
 */
app.get('/api', zValidator('query', dashboardQuerySchema), async (c) => {
  const clinicaId = c.get('clinicaId')
  const accessToken = c.get('accessToken')

  if (!clinicaId) {
    return c.json(
      {
        error: 'Clinic context required',
        message: 'User must be associated with a clinic',
      },
      403
    )
  }

  try {
    const dashboardData = await getDashboardDataFromDjango(c.env, accessToken)
    dashboardData.clinicaId = clinicaId

    return c.json({
      success: true,
      data: dashboardData,
    })
  } catch (error) {
    console.error('[Dashboard] Error fetching dashboard data:', error)
    return c.json(
      {
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * GET /stats
 * Get only dashboard statistics from Django
 */
app.get('/stats', zValidator('query', dashboardQuerySchema), async (c) => {
  const clinicaId = c.get('clinicaId')
  const accessToken = c.get('accessToken')

  if (!clinicaId) {
    return c.json(
      {
        error: 'Clinic context required',
        message: 'User must be associated with a clinic',
      },
      403
    )
  }

  try {
    const stats = await getDashboardStatsFromDjango(c.env, accessToken)

    return c.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('[Dashboard] Error fetching stats:', error)
    return c.json(
      {
        error: 'Failed to fetch statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * GET /export
 * Export dashboard data in various formats
 */
app.get('/export', zValidator('query', exportQuerySchema), async (c) => {
  const clinicaId = c.get('clinicaId')
  const accessToken = c.get('accessToken')
  const query = c.req.valid('query')

  if (!clinicaId) {
    return c.json(
      {
        error: 'Clinic context required',
        message: 'User must be associated with a clinic',
      },
      403
    )
  }

  try {
    // Fetch dashboard data from Django for export
    const dashboardData = await getDashboardDataFromDjango(c.env, accessToken)
    dashboardData.clinicaId = clinicaId

    // For now, return JSON format
    // TODO: Implement CSV, XLSX, PDF generation
    if (query.format === 'csv') {
      const csv = convertDashboardToCSV(dashboardData)

      return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="dashboard-export-${new Date().toISOString().split('T')[0]}.csv"`,
      })
    } else {
      // Return JSON for now (XLSX and PDF to be implemented)
      return c.json({
        success: true,
        data: dashboardData,
        message: `Export format '${query.format}' will be implemented soon. Returning JSON for now.`,
      })
    }
  } catch (error) {
    console.error('[Dashboard] Error exporting data:', error)
    return c.json(
      {
        error: 'Failed to export dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * Helper function to convert dashboard data to CSV
 */
function convertDashboardToCSV(data: any): string {
  const lines: string[] = []

  // Header
  lines.push('Dashboard Export')
  lines.push(`Generated: ${data.generatedAt}`)
  lines.push(`Clinic ID: ${data.clinicaId}`)
  lines.push('')

  // Stats
  lines.push('Statistics')
  lines.push('Metric,Value,Previous Value,Change %,Trend')
  lines.push(
    `Active Institutions,${data.stats.activeInstitutions.value},${data.stats.activeInstitutions.previousValue},${data.stats.activeInstitutions.percentageChange.toFixed(1)}%,${data.stats.activeInstitutions.trend}`
  )
  lines.push(
    `Pending Surveys,${data.stats.pendingSurveys.value},${data.stats.pendingSurveys.previousValue},${data.stats.pendingSurveys.percentageChange.toFixed(1)}%,${data.stats.pendingSurveys.trend}`
  )
  lines.push(
    `Completed Surveys,${data.stats.completedSurveys.value},${data.stats.completedSurveys.previousValue},${data.stats.completedSurveys.percentageChange.toFixed(1)}%,${data.stats.completedSurveys.trend}`
  )
  lines.push(
    `Reports Generated,${data.stats.reportsGenerated.value},${data.stats.reportsGenerated.previousValue},${data.stats.reportsGenerated.percentageChange.toFixed(1)}%,${data.stats.reportsGenerated.trend}`
  )
  lines.push('')

  return lines.join('\n')
}

export default app
