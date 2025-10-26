/**
 * Dashboard Type Definitions
 *
 * Type definitions for the clinic administrator dashboard
 * including stats, charts, and activity data
 */

/**
 * Time period filter options for dashboard data
 */
export type TimePeriod = 'last_7_days' | 'this_month' | 'last_30_days' | 'custom'

/**
 * Trend direction for percentage changes
 */
export type TrendDirection = 'up' | 'down' | 'neutral'

/**
 * Survey status types matching Supabase encuesta table
 */
export type SurveyStatus =
  | 'pendiente'      // Pending
  | 'en_progreso'    // In Progress
  | 'completada'     // Completed
  | 'revisada'       // Reviewed
  | 'cancelada'      // Cancelled

/**
 * Dashboard statistics card data
 */
export interface DashboardStat {
  label: string
  value: number
  previousValue: number
  percentageChange: number
  trend: TrendDirection
}

/**
 * Complete dashboard statistics
 */
export interface DashboardStats {
  activeInstitutions: DashboardStat
  pendingSurveys: DashboardStat
  completedSurveys: DashboardStat
  reportsGenerated: DashboardStat
}

/**
 * Data point for submission trends chart (line chart)
 */
export interface SubmissionTrendPoint {
  date: string // YYYY-MM-DD format
  count: number
  label?: string // Optional display label
}

/**
 * Submission trends data for the last N days
 */
export interface SubmissionTrendsData {
  period: TimePeriod
  startDate: string
  endDate: string
  data: SubmissionTrendPoint[]
  total: number
  average: number
}

/**
 * Survey completion distribution segment (for doughnut chart)
 */
export interface CompletionSegment {
  status: SurveyStatus
  count: number
  percentage: number
  color: string // Hex color for chart rendering
}

/**
 * Survey completions distribution data
 */
export interface SurveyCompletionsData {
  total: number
  segments: CompletionSegment[]
}

/**
 * Recent survey activity item
 */
export interface RecentSurveyActivity {
  id: string
  institutionId: string
  institutionName: string
  surveyId: string
  surveyTitle: string
  status: SurveyStatus
  statusDisplay: string
  date: string // ISO 8601 format
  assignedCount?: number
  completedCount?: number
}

/**
 * Paginated recent activity response
 */
export interface RecentActivityResponse {
  data: RecentSurveyActivity[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

/**
 * Dashboard query parameters
 */
export interface DashboardQueryParams {
  period?: TimePeriod
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  institucionId?: string
  limit?: number
  offset?: number
}

/**
 * Complete dashboard data response
 */
export interface DashboardData {
  stats: DashboardStats
  submissionTrends: SubmissionTrendsData
  completions: SurveyCompletionsData
  recentActivity: RecentActivityResponse
  generatedAt: string // ISO 8601 timestamp
  clinicaId: string
}

/**
 * Dashboard export options
 */
export interface DashboardExportOptions {
  format: 'csv' | 'xlsx' | 'pdf'
  period: TimePeriod
  startDate?: string
  endDate?: string
  includeCharts: boolean
  includeActivity: boolean
}

/**
 * Helper function to get status display name
 */
export function getSurveyStatusDisplay(status: SurveyStatus): string {
  const statusMap: Record<SurveyStatus, string> = {
    pendiente: 'Pending',
    en_progreso: 'In Progress',
    completada: 'Completed',
    revisada: 'Reviewed',
    cancelada: 'Cancelled',
  }
  return statusMap[status] || status
}

/**
 * Helper function to get status color for badges
 */
export function getSurveyStatusColor(status: SurveyStatus): string {
  const colorMap: Record<SurveyStatus, string> = {
    pendiente: 'blue',
    en_progreso: 'yellow',
    completada: 'green',
    revisada: 'purple',
    cancelada: 'red',
  }
  return colorMap[status] || 'gray'
}

/**
 * Helper function to calculate trend direction
 */
export function calculateTrend(current: number, previous: number): TrendDirection {
  if (previous === 0) return 'neutral'
  const change = ((current - previous) / previous) * 100
  if (change > 0.5) return 'up'
  if (change < -0.5) return 'down'
  return 'neutral'
}

/**
 * Helper function to format percentage change
 */
export function formatPercentageChange(current: number, previous: number): string {
  if (previous === 0) return '0%'
  const change = ((current - previous) / previous) * 100
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}
