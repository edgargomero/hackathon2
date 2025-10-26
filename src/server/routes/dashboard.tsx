/**
 * Dashboard Routes
 *
 * API endpoints for clinic administrator dashboard
 * Provides statistics, trends, and activity data
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { HonoEnv } from '@shared/types/env'
import { createSupabaseClient } from '@server/services/supabase'
import {
  getDashboardData,
  getDashboardStats,
  getSubmissionTrends,
  getSurveyCompletions,
  getRecentActivity,
} from '@server/services/dashboard'
import { Dashboard } from '@server/components/Dashboard'

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
 * Render dashboard page with SSR
 */
app.get('/', zValidator('query', dashboardQuerySchema), async (c) => {
  const clinicaId = c.get('clinicaId')
  const userName = c.get('userName')
  const userRole = c.get('userRole')
  const userId = c.get('userId')
  const query = c.req.valid('query')

  if (!clinicaId) {
    return c.html(
      <div>
        <h1>Error: No clinic context</h1>
        <p>User must be associated with a clinic to view dashboard</p>
      </div>,
      403
    )
  }

  try {
    const supabase = createSupabaseClient(c.env)

    const dashboardData = await getDashboardData(supabase, clinicaId, {
      period: query.period,
      startDate: query.start_date,
      endDate: query.end_date,
      institucionId: query.institucion_id,
      limit: query.limit,
      offset: query.offset,
    })

    return c.html(
      <Dashboard
        data={dashboardData}
        user={{
          username: userName || `User ${userId}`,
          email: '',
          role: userRole || 'readonly',
        }}
      />
    )
  } catch (error) {
    console.error('[Dashboard] Error rendering page:', error)
    return c.html(
      <div>
        <h1>Error loading dashboard</h1>
        <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>,
      500
    )
  }
})

/**
 * GET /api (JSON API)
 * Get complete dashboard data (stats, trends, completions, recent activity)
 */
app.get('/api', zValidator('query', dashboardQuerySchema), async (c) => {
  const clinicaId = c.get('clinicaId')
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
    const supabase = createSupabaseClient(c.env)

    const dashboardData = await getDashboardData(supabase, clinicaId, {
      period: query.period,
      startDate: query.start_date,
      endDate: query.end_date,
      institucionId: query.institucion_id,
      limit: query.limit,
      offset: query.offset,
    })

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
 * GET /api/dashboard/stats
 * Get only dashboard statistics
 */
app.get('/stats', zValidator('query', dashboardQuerySchema), async (c) => {
  const clinicaId = c.get('clinicaId')
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
    const supabase = createSupabaseClient(c.env)

    const stats = await getDashboardStats(supabase, clinicaId, {
      period: query.period,
      startDate: query.start_date,
      endDate: query.end_date,
    })

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
 * GET /api/dashboard/trends
 * Get submission trends for line chart
 */
app.get('/trends', zValidator('query', dashboardQuerySchema), async (c) => {
  const clinicaId = c.get('clinicaId')
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
    const supabase = createSupabaseClient(c.env)

    const trends = await getSubmissionTrends(supabase, clinicaId, {
      period: query.period,
      startDate: query.start_date,
      endDate: query.end_date,
    })

    return c.json({
      success: true,
      data: trends,
    })
  } catch (error) {
    console.error('[Dashboard] Error fetching trends:', error)
    return c.json(
      {
        error: 'Failed to fetch submission trends',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * GET /api/dashboard/completions
 * Get survey completions distribution for doughnut chart
 */
app.get('/completions', zValidator('query', dashboardQuerySchema), async (c) => {
  const clinicaId = c.get('clinicaId')
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
    const supabase = createSupabaseClient(c.env)

    const completions = await getSurveyCompletions(supabase, clinicaId, {
      period: query.period,
      startDate: query.start_date,
      endDate: query.end_date,
    })

    return c.json({
      success: true,
      data: completions,
    })
  } catch (error) {
    console.error('[Dashboard] Error fetching completions:', error)
    return c.json(
      {
        error: 'Failed to fetch survey completions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * GET /api/dashboard/activity
 * Get recent survey activity with pagination
 */
app.get('/activity', zValidator('query', dashboardQuerySchema), async (c) => {
  const clinicaId = c.get('clinicaId')
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
    const supabase = createSupabaseClient(c.env)

    const activity = await getRecentActivity(supabase, clinicaId, {
      institucionId: query.institucion_id,
      limit: query.limit,
      offset: query.offset,
    })

    return c.json({
      success: true,
      data: activity.data,
      pagination: {
        total: activity.total,
        limit: activity.limit,
        offset: activity.offset,
        hasMore: activity.hasMore,
      },
    })
  } catch (error) {
    console.error('[Dashboard] Error fetching activity:', error)
    return c.json(
      {
        error: 'Failed to fetch recent activity',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * GET /api/dashboard/export
 * Export dashboard data in various formats
 */
app.get('/export', zValidator('query', exportQuerySchema), async (c) => {
  const clinicaId = c.get('clinicaId')
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
    const supabase = createSupabaseClient(c.env)

    // Fetch dashboard data for export
    const dashboardData = await getDashboardData(supabase, clinicaId, {
      period: query.period,
      startDate: query.start_date,
      endDate: query.end_date,
      limit: 1000, // Export more records
      offset: 0,
    })

    // For now, return JSON format
    // TODO: Implement CSV, XLSX, PDF generation in future
    if (query.format === 'csv') {
      // CSV format placeholder
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

  // Recent Activity
  lines.push('Recent Survey Activity')
  lines.push('Institution,Survey Title,Status,Date')
  data.recentActivity.data.forEach((activity: any) => {
    lines.push(
      `"${activity.institutionName}","${activity.surveyTitle}",${activity.status},${activity.date}`
    )
  })

  return lines.join('\n')
}

export default app
