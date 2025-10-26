/**
 * Dashboard Service (Django Backend)
 *
 * Service layer for fetching dashboard analytics and statistics
 * from Django REST API with multi-tenant isolation
 */

import type {
  DashboardStats,
  DashboardStat,
  DashboardData,
} from '@shared/types/dashboard'
import { createDjangoDataClient } from './django-data'

/**
 * Get dashboard statistics using Django API
 */
export async function getDashboardStatsFromDjango(
  env: { DJANGO_API_URL: string },
  accessToken: string
): Promise<DashboardStats> {
  const djangoData = createDjangoDataClient(env)

  // Django API handles all the aggregations and filtering by clinica_id
  const stats = await djangoData.getDashboardStats(accessToken)

  // Create DashboardStat objects with trend calculations
  const createStat = (
    label: string,
    value: number,
    previousValue: number = 0
  ): DashboardStat => {
    const percentageChange =
      previousValue > 0
        ? ((value - previousValue) / previousValue) * 100
        : 0

    const trend =
      value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral'

    return {
      label,
      value,
      previousValue,
      percentageChange,
      trend,
    }
  }

  return {
    activeInstitutions: createStat(
      'Active Institutions',
      stats.activeInstitutions
    ),
    pendingSurveys: createStat('Pending Surveys', stats.pendingSurveys),
    completedSurveys: createStat('Completed Surveys', stats.completedSurveys),
    reportsGenerated: createStat('Reports Generated', stats.reportsGenerated),
  }
}

/**
 * Get complete dashboard data using Django API
 */
export async function getDashboardDataFromDjango(
  env: { DJANGO_API_URL: string },
  accessToken: string
): Promise<DashboardData> {
  const stats = await getDashboardStatsFromDjango(env, accessToken)

  // For now, return basic dashboard data
  // TODO: Implement trends and activity from Django
  return {
    stats,
    submissionTrends: {
      period: 'last_30_days',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      data: [],
      total: 0,
      average: 0,
    },
    completions: {
      total: stats.pendingSurveys.value + stats.completedSurveys.value,
      segments: [
        {
          status: 'pendiente',
          count: stats.pendingSurveys.value,
          percentage:
            (stats.pendingSurveys.value /
              (stats.pendingSurveys.value + stats.completedSurveys.value)) *
              100 || 0,
          color: '#3b82f6',
        },
        {
          status: 'completada',
          count: stats.completedSurveys.value,
          percentage:
            (stats.completedSurveys.value /
              (stats.pendingSurveys.value + stats.completedSurveys.value)) *
              100 || 0,
          color: '#22c55e',
        },
      ],
    },
    recentActivity: {
      data: [],
      total: 0,
      limit: 10,
      offset: 0,
      hasMore: false,
    },
    generatedAt: new Date().toISOString(),
    clinicaId: '', // Will be set by route handler
  }
}
