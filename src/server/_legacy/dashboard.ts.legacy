/**
 * Dashboard Service
 *
 * Service layer for fetching dashboard analytics and statistics
 * from Supabase database with multi-tenant isolation
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  DashboardStats,
  DashboardStat,
  SubmissionTrendsData,
  SubmissionTrendPoint,
  SurveyCompletionsData,
  CompletionSegment,
  RecentSurveyActivity,
  RecentActivityResponse,
  DashboardQueryParams,
  DashboardData,
  TimePeriod,
  SurveyStatus,
} from '@shared/types/dashboard'
import {
  calculateTrend,
  getSurveyStatusDisplay,
  getSurveyStatusColor,
} from '@shared/types/dashboard'

type SupabaseClientInstance = SupabaseClient<any, 'public', any>

/**
 * Get date range for a time period
 */
function getDateRange(period: TimePeriod, customStart?: string, customEnd?: string) {
  const now = new Date()
  const endDate = new Date(now)
  endDate.setHours(23, 59, 59, 999)

  let startDate = new Date(now)
  startDate.setHours(0, 0, 0, 0)

  switch (period) {
    case 'last_7_days':
      startDate.setDate(startDate.getDate() - 7)
      break
    case 'this_month':
      startDate.setDate(1)
      break
    case 'last_30_days':
      startDate.setDate(startDate.getDate() - 30)
      break
    case 'custom':
      if (customStart) startDate = new Date(customStart)
      if (customEnd) endDate.setTime(new Date(customEnd).getTime())
      break
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  }
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(
  supabase: SupabaseClientInstance,
  clinicaId: string,
  params: DashboardQueryParams = {}
): Promise<DashboardStats> {
  const period = params.period || 'this_month'
  const { startDate, endDate } = getDateRange(
    period,
    params.startDate,
    params.endDate
  )

  // Calculate previous period for comparison
  const startDateObj = new Date(startDate)
  const endDateObj = new Date(endDate)
  const periodDays = Math.ceil(
    (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
  )
  const previousStartDate = new Date(startDateObj)
  previousStartDate.setDate(previousStartDate.getDate() - periodDays)
  const previousEndDate = new Date(startDateObj)
  previousEndDate.setDate(previousEndDate.getDate() - 1)

  // Active Institutions (institutions with surveys assigned in period)
  const { count: activeInstitutionsCount } = await supabase
    .from('encuesta_asignada')
    .select('institucion_id', { count: 'exact', head: true })
    .gte('fecha_asignacion', startDate)
    .lte('fecha_asignacion', endDate)
    .not('institucion_id', 'is', null)

  const { count: previousActiveInstitutionsCount } = await supabase
    .from('encuesta_asignada')
    .select('institucion_id', { count: 'exact', head: true })
    .gte('fecha_asignacion', previousStartDate.toISOString().split('T')[0])
    .lte('fecha_asignacion', previousEndDate.toISOString().split('T')[0])
    .not('institucion_id', 'is', null)

  // Pending Surveys
  const { count: pendingSurveysCount } = await supabase
    .from('encuesta_asignada')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pendiente')
    .gte('fecha_asignacion', startDate)
    .lte('fecha_asignacion', endDate)

  const { count: previousPendingSurveysCount } = await supabase
    .from('encuesta_asignada')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pendiente')
    .gte('fecha_asignacion', previousStartDate.toISOString().split('T')[0])
    .lte('fecha_asignacion', previousEndDate.toISOString().split('T')[0])

  // Completed Surveys
  const { count: completedSurveysCount } = await supabase
    .from('encuesta_asignada')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'completada')
    .gte('fecha_completado', startDate)
    .lte('fecha_completado', endDate)

  const { count: previousCompletedSurveysCount } = await supabase
    .from('encuesta_asignada')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'completada')
    .gte('fecha_completado', previousStartDate.toISOString().split('T')[0])
    .lte('fecha_completado', previousEndDate.toISOString().split('T')[0])

  // Reports Generated (completed surveys = generated reports)
  const reportsCount = completedSurveysCount || 0
  const previousReportsCount = previousCompletedSurveysCount || 0

  // Calculate stats with trends
  const activeInstitutions: DashboardStat = {
    label: 'Active Institutions',
    value: activeInstitutionsCount || 0,
    previousValue: previousActiveInstitutionsCount || 0,
    percentageChange:
      previousActiveInstitutionsCount && previousActiveInstitutionsCount > 0
        ? ((activeInstitutionsCount || 0) - previousActiveInstitutionsCount) /
          previousActiveInstitutionsCount *
          100
        : 0,
    trend: calculateTrend(
      activeInstitutionsCount || 0,
      previousActiveInstitutionsCount || 0
    ),
  }

  const pendingSurveys: DashboardStat = {
    label: 'Pending Surveys',
    value: pendingSurveysCount || 0,
    previousValue: previousPendingSurveysCount || 0,
    percentageChange:
      previousPendingSurveysCount && previousPendingSurveysCount > 0
        ? ((pendingSurveysCount || 0) - previousPendingSurveysCount) /
          previousPendingSurveysCount *
          100
        : 0,
    trend: calculateTrend(
      pendingSurveysCount || 0,
      previousPendingSurveysCount || 0
    ),
  }

  const completedSurveys: DashboardStat = {
    label: 'Completed Surveys',
    value: completedSurveysCount || 0,
    previousValue: previousCompletedSurveysCount || 0,
    percentageChange:
      previousCompletedSurveysCount && previousCompletedSurveysCount > 0
        ? ((completedSurveysCount || 0) - previousCompletedSurveysCount) /
          previousCompletedSurveysCount *
          100
        : 0,
    trend: calculateTrend(
      completedSurveysCount || 0,
      previousCompletedSurveysCount || 0
    ),
  }

  const reportsGenerated: DashboardStat = {
    label: 'Reports Generated',
    value: reportsCount,
    previousValue: previousReportsCount,
    percentageChange:
      previousReportsCount > 0
        ? (reportsCount - previousReportsCount) / previousReportsCount * 100
        : 0,
    trend: calculateTrend(reportsCount, previousReportsCount),
  }

  return {
    activeInstitutions,
    pendingSurveys,
    completedSurveys,
    reportsGenerated,
  }
}

/**
 * Get submission trends data for line chart
 */
export async function getSubmissionTrends(
  supabase: SupabaseClientInstance,
  clinicaId: string,
  params: DashboardQueryParams = {}
): Promise<SubmissionTrendsData> {
  const period = params.period || 'last_30_days'
  const { startDate, endDate } = getDateRange(
    period,
    params.startDate,
    params.endDate
  )

  // Fetch all submissions in the date range
  const { data: submissions, error } = await supabase
    .from('encuesta_asignada')
    .select('fecha_completado, estado')
    .eq('estado', 'completada')
    .gte('fecha_completado', startDate)
    .lte('fecha_completado', endDate)
    .order('fecha_completado', { ascending: true })

  if (error) {
    console.error('[Dashboard] Error fetching submission trends:', error)
    throw new Error('Failed to fetch submission trends')
  }

  // Group by date
  const dateCounts: Record<string, number> = {}
  submissions?.forEach((submission) => {
    if (submission.fecha_completado) {
      const date = submission.fecha_completado.split('T')[0]
      dateCounts[date] = (dateCounts[date] || 0) + 1
    }
  })

  // Fill in missing dates with zero counts
  const data: SubmissionTrendPoint[] = []
  const currentDate = new Date(startDate)
  const endDateObj = new Date(endDate)

  while (currentDate <= endDateObj) {
    const dateStr = currentDate.toISOString().split('T')[0]
    data.push({
      date: dateStr,
      count: dateCounts[dateStr] || 0,
      label: dateStr,
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const total = data.reduce((sum, point) => sum + point.count, 0)
  const average = data.length > 0 ? total / data.length : 0

  return {
    period,
    startDate,
    endDate,
    data,
    total,
    average,
  }
}

/**
 * Get survey completions distribution for doughnut chart
 */
export async function getSurveyCompletions(
  supabase: SupabaseClientInstance,
  clinicaId: string,
  params: DashboardQueryParams = {}
): Promise<SurveyCompletionsData> {
  const period = params.period || 'this_month'
  const { startDate, endDate } = getDateRange(
    period,
    params.startDate,
    params.endDate
  )

  // Get counts by status
  const { data: statusCounts, error } = await supabase
    .from('encuesta_asignada')
    .select('estado')
    .gte('fecha_asignacion', startDate)
    .lte('fecha_asignacion', endDate)

  if (error) {
    console.error('[Dashboard] Error fetching survey completions:', error)
    throw new Error('Failed to fetch survey completions')
  }

  // Count by status
  const counts: Record<string, number> = {}
  statusCounts?.forEach((item) => {
    const status = item.estado || 'pendiente'
    counts[status] = (counts[status] || 0) + 1
  })

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)

  // Color mapping for chart segments
  const colorMap: Record<SurveyStatus, string> = {
    pendiente: '#3b82f6', // blue
    en_progreso: '#eab308', // yellow
    completada: '#22c55e', // green
    revisada: '#a855f7', // purple
    cancelada: '#ef4444', // red
  }

  // Create segments
  const segments: CompletionSegment[] = Object.entries(counts).map(
    ([status, count]) => ({
      status: status as SurveyStatus,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      color: colorMap[status as SurveyStatus] || '#6b7280', // gray fallback
    })
  )

  return {
    total,
    segments,
  }
}

/**
 * Get recent survey activity
 */
export async function getRecentActivity(
  supabase: SupabaseClientInstance,
  clinicaId: string,
  params: DashboardQueryParams = {}
): Promise<RecentActivityResponse> {
  const limit = params.limit || 10
  const offset = params.offset || 0

  let query = supabase
    .from('encuesta_asignada')
    .select(
      `
      id,
      encuesta_id,
      institucion_id,
      estado,
      fecha_asignacion,
      fecha_completado,
      encuesta:encuesta_id (
        id,
        titulo
      ),
      institucion:institucion_id (
        id,
        nombre
      )
    `,
      { count: 'exact' }
    )
    .order('fecha_asignacion', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.institucionId) {
    query = query.eq('institucion_id', params.institucionId)
  }

  const { data: activities, count, error } = await query

  if (error) {
    console.error('[Dashboard] Error fetching recent activity:', error)
    throw new Error('Failed to fetch recent activity')
  }

  const data: RecentSurveyActivity[] =
    activities?.map((activity: any) => ({
      id: activity.id,
      institutionId: activity.institucion_id,
      institutionName: (activity.institucion as any)?.nombre || 'Unknown Institution',
      surveyId: activity.encuesta_id,
      surveyTitle: (activity.encuesta as any)?.titulo || 'Unknown Survey',
      status: activity.estado as SurveyStatus,
      statusDisplay: getSurveyStatusDisplay(activity.estado as SurveyStatus),
      date:
        activity.fecha_completado ||
        activity.fecha_asignacion ||
        new Date().toISOString(),
    })) || []

  return {
    data,
    total: count || 0,
    limit,
    offset,
    hasMore: (count || 0) > offset + limit,
  }
}

/**
 * Get complete dashboard data
 */
export async function getDashboardData(
  supabase: SupabaseClientInstance,
  clinicaId: string,
  params: DashboardQueryParams = {}
): Promise<DashboardData> {
  // Fetch all dashboard data in parallel
  const [stats, submissionTrends, completions, recentActivity] =
    await Promise.all([
      getDashboardStats(supabase, clinicaId, params),
      getSubmissionTrends(supabase, clinicaId, params),
      getSurveyCompletions(supabase, clinicaId, params),
      getRecentActivity(supabase, clinicaId, params),
    ])

  return {
    stats,
    submissionTrends,
    completions,
    recentActivity,
    generatedAt: new Date().toISOString(),
    clinicaId,
  }
}
