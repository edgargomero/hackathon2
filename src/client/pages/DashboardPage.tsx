/**
 * DashboardPage.tsx - Dashboard Principal SPA
 *
 * Usa Preact Signals para estado reactivo
 * Fetch datos desde Django via Hono API
 * Animaciones con Framer Motion
 */

import { signal, computed, effect } from '@preact/signals'
import { motion } from 'framer-motion'
import type { DashboardData, TimePeriod } from '@shared/types/dashboard'
import { fetchDashboardData } from '../services/dashboard-api'
import { useAuth } from '../stores/auth'

// ============ State Signals ============

const dashboardData = signal<DashboardData | null>(null)
const isLoading = signal<boolean>(true)
const error = signal<string | null>(null)

// Filtros
const selectedPeriod = signal<TimePeriod>('this_month')
const selectedInstitutionId = signal<string | null>(null)

// Paginación
const currentPage = signal<number>(0)
const pageSize = signal<number>(10)

// ============ Computed Values ============

const offset = computed(() => currentPage.value * pageSize.value)

// ============ Effects ============

// Fetch dashboard data cuando cambian filtros
effect(() => {
  const period = selectedPeriod.value
  const institucionId = selectedInstitutionId.value
  const limit = pageSize.value
  const off = offset.value

  // Fetch data
  isLoading.value = true
  error.value = null

  fetchDashboardData({
    period,
    institucionId: institucionId || undefined,
    limit,
    offset: off
  })
    .then((data) => {
      dashboardData.value = data
      isLoading.value = false
    })
    .catch((err) => {
      error.value = err instanceof Error ? err.message : 'Failed to load dashboard'
      isLoading.value = false
    })
})

// ============ Dashboard Page Component ============

export function DashboardPage() {
  const { displayName, userRole, logout } = useAuth()

  // Handlers
  const handlePeriodChange = (period: TimePeriod) => {
    selectedPeriod.value = period
    currentPage.value = 0 // Reset pagination
  }

  const handlePreviousPage = () => {
    if (currentPage.value > 0) {
      currentPage.value--
    }
  }

  const handleNextPage = () => {
    const data = dashboardData.value
    if (data?.recentActivity.hasMore) {
      currentPage.value++
    }
  }

  // Loading state
  if (isLoading.value && !dashboardData.value) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div class="text-center">
          <div class="loader mx-auto mb-4" />
          <p class="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error.value && !dashboardData.value) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 max-w-md">
          <div class="text-center">
            <span class="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Error Loading Dashboard
            </h2>
            <p class="text-slate-600 dark:text-slate-400 mb-6">{error.value}</p>
            <button
              onClick={() => window.location.reload()}
              class="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const data = dashboardData.value
  if (!data) return null

  return (
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            {/* Logo + Title */}
            <div class="flex items-center gap-4">
              <div class="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-lg">
                <span class="material-symbols-outlined text-white text-2xl">dashboard</span>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                  Welcome, {displayName.value}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div class="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => {
                  document.documentElement.classList.toggle('dark')
                  const isDark = document.documentElement.classList.contains('dark')
                  localStorage.setItem('darkMode', isDark ? 'dark' : 'light')
                }}
                class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                <span class="material-symbols-outlined text-slate-700 dark:text-slate-300">
                  dark_mode
                </span>
              </button>

              {/* Logout */}
              <button
                onClick={() => logout()}
                class="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                <span class="material-symbols-outlined">logout</span>
                <span class="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filters */}
        <div class="flex flex-wrap items-center justify-between gap-4">
          {/* Period Filters */}
          <div class="flex gap-2">
            {(['last_7_days', 'this_month', 'last_30_days'] as TimePeriod[]).map((period) => (
              <button
                onClick={() => handlePeriodChange(period)}
                class={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedPeriod.value === period
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {period === 'last_7_days'
                  ? 'Last 7 Days'
                  : period === 'this_month'
                    ? 'This Month'
                    : 'Last 30 Days'}
              </button>
            ))}
          </div>

          {/* Role Badge */}
          <div class="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
            <span class="material-symbols-outlined text-primary-600 dark:text-primary-400 text-sm">
              badge
            </span>
            <span class="text-sm font-semibold text-primary-700 dark:text-primary-300 capitalize">
              {userRole.value?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Active Institutions */}
          <StatCard
            label="Active Institutions"
            value={data.stats.activeInstitutions.value}
            percentageChange={data.stats.activeInstitutions.percentageChange}
            trend={data.stats.activeInstitutions.trend}
            icon="business"
          />

          {/* Pending Surveys */}
          <StatCard
            label="Pending Surveys"
            value={data.stats.pendingSurveys.value}
            percentageChange={data.stats.pendingSurveys.percentageChange}
            trend={data.stats.pendingSurveys.trend}
            icon="pending_actions"
          />

          {/* Completed Surveys */}
          <StatCard
            label="Completed Surveys"
            value={data.stats.completedSurveys.value}
            percentageChange={data.stats.completedSurveys.percentageChange}
            trend={data.stats.completedSurveys.trend}
            icon="check_circle"
          />

          {/* Reports Generated */}
          <StatCard
            label="Reports Generated"
            value={data.stats.reportsGenerated.value}
            percentageChange={data.stats.reportsGenerated.percentageChange}
            trend={data.stats.reportsGenerated.trend}
            icon="description"
          />
        </div>

        {/* Charts Placeholder (implementation in next step) */}
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div class="xl:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Submission Trends
            </h3>
            <div class="h-80 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p class="text-slate-500 dark:text-slate-400 text-sm">
                Chart: Total {data.submissionTrends.total} submissions, Avg{' '}
                {data.submissionTrends.average.toFixed(1)}/day
              </p>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Survey Completions
            </h3>
            <div class="h-80 flex flex-col items-center justify-center space-y-4">
              <div class="text-center">
                <p class="text-4xl font-bold text-slate-900 dark:text-slate-50">
                  {data.completions.total}
                </p>
                <p class="text-sm text-slate-500 dark:text-slate-400">Total Surveys</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Recent Survey Activity
            </h3>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th class="px-6 py-3 text-left">Institution</th>
                  <th class="px-6 py-3 text-left">Survey Title</th>
                  <th class="px-6 py-3 text-left">Status</th>
                  <th class="px-6 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentActivity.data.length === 0 ? (
                  <tr>
                    <td colSpan={4} class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      No recent activity found
                    </td>
                  </tr>
                ) : (
                  data.recentActivity.data.map((activity) => (
                    <tr key={activity.id} class="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-50">
                        {activity.institutionName}
                      </td>
                      <td class="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {activity.surveyTitle}
                      </td>
                      <td class="px-6 py-4">
                        <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                          {activity.statusDisplay}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {new Date(activity.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.recentActivity.total > 0 && (
            <div class="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800">
              <span class="text-sm text-slate-500 dark:text-slate-400">
                Showing {data.recentActivity.offset + 1} to{' '}
                {Math.min(data.recentActivity.offset + pageSize.value, data.recentActivity.total)}{' '}
                of {data.recentActivity.total}
              </span>
              <div class="flex gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage.value === 0}
                  class="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={!data.recentActivity.hasMore}
                  class="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ============ Stat Card Component ============

interface StatCardProps {
  label: string
  value: number
  percentageChange: number
  trend: 'up' | 'down' | 'neutral'
  icon: string
}

function StatCard({ label, value, percentageChange, trend, icon }: StatCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-green-600 dark:text-green-500'
      : trend === 'down'
        ? 'text-red-600 dark:text-red-500'
        : 'text-slate-600 dark:text-slate-400'

  const trendIcon = trend === 'up' ? 'arrow_upward' : trend === 'down' ? 'arrow_downward' : 'remove'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-2"
    >
      <div class="flex items-center justify-between">
        <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
        <span class="material-symbols-outlined text-primary-500 text-2xl">{icon}</span>
      </div>

      <p class="text-3xl font-bold text-slate-900 dark:text-slate-50">{value.toLocaleString()}</p>

      <p class={`text-sm font-medium flex items-center gap-1 ${trendColor}`}>
        <span class="material-symbols-outlined text-base">{trendIcon}</span>
        {percentageChange >= 0 ? '+' : ''}
        {percentageChange.toFixed(1)}%
      </p>
    </motion.div>
  )
}
