/**
 * Dashboard Component
 *
 * Server-side rendered dashboard page with statistics,
 * charts, and recent activity
 */

import type { FC } from 'hono/jsx'
import type { DashboardData } from '@shared/types/dashboard'
import { Layout } from './Layout'
import { getSurveyStatusColor } from '@shared/types/dashboard'

interface DashboardProps {
  data: DashboardData
  user?: {
    username: string
    email: string
    role: string
  }
}

export const Dashboard: FC<DashboardProps> = ({ data, user }) => {
  const { stats, submissionTrends, completions, recentActivity } = data

  return (
    <Layout title="Administrator Overview" user={user} currentPath="/dashboard">
      {/* Filters and Quick Actions */}
      <div class="flex flex-wrap items-center justify-between gap-4">
        {/* Time Period Chips */}
        <div class="flex gap-2">
          <button class="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 hover:bg-slate-50 dark:hover:bg-slate-700/50">
            <p class="text-slate-700 dark:text-slate-200 text-sm font-medium">
              Last 7 Days
            </p>
            <span class="material-symbols-outlined text-slate-500 dark:text-slate-400 text-lg">
              expand_more
            </span>
          </button>
          <button class="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-primary/10 text-primary border border-primary/20 px-3">
            <p class="text-sm font-semibold">This Month</p>
          </button>
          <button class="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 hover:bg-slate-50 dark:hover:bg-slate-700/50">
            <p class="text-slate-700 dark:text-slate-200 text-sm font-medium">
              Custom Range
            </p>
            <span class="material-symbols-outlined text-slate-500 dark:text-slate-400 text-lg">
              calendar_today
            </span>
          </button>
        </div>

        {/* Action Buttons */}
        <div class="flex gap-3">
          <button class="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-4 hover:bg-slate-50 dark:hover:bg-slate-700/50">
            <span class="material-symbols-outlined text-slate-600 dark:text-slate-300 text-lg">
              download
            </span>
            <p class="text-slate-700 dark:text-slate-200 text-sm font-medium">
              Export
            </p>
          </button>
          <button class="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-primary text-white px-4 hover:bg-primary/90">
            <span class="material-symbols-outlined text-lg">add</span>
            <p class="text-sm font-medium">New Survey</p>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Institutions */}
        <div class="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Active Institutions
          </p>
          <p class="text-slate-900 dark:text-slate-50 text-3xl font-bold">
            {stats.activeInstitutions.value}
          </p>
          <p
            class={`text-sm font-medium flex items-center gap-1 ${
              stats.activeInstitutions.trend === 'up'
                ? 'text-green-600 dark:text-green-500'
                : stats.activeInstitutions.trend === 'down'
                  ? 'text-red-600 dark:text-red-500'
                  : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span class="material-symbols-outlined text-base">
              {stats.activeInstitutions.trend === 'up'
                ? 'arrow_upward'
                : stats.activeInstitutions.trend === 'down'
                  ? 'arrow_downward'
                  : 'remove'}
            </span>
            {stats.activeInstitutions.percentageChange >= 0 ? '+' : ''}
            {stats.activeInstitutions.percentageChange.toFixed(1)}%
          </p>
        </div>

        {/* Pending Surveys */}
        <div class="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Pending Surveys
          </p>
          <p class="text-slate-900 dark:text-slate-50 text-3xl font-bold">
            {stats.pendingSurveys.value}
          </p>
          <p
            class={`text-sm font-medium flex items-center gap-1 ${
              stats.pendingSurveys.trend === 'up'
                ? 'text-green-600 dark:text-green-500'
                : stats.pendingSurveys.trend === 'down'
                  ? 'text-red-600 dark:text-red-500'
                  : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span class="material-symbols-outlined text-base">
              {stats.pendingSurveys.trend === 'up'
                ? 'arrow_upward'
                : stats.pendingSurveys.trend === 'down'
                  ? 'arrow_downward'
                  : 'remove'}
            </span>
            {stats.pendingSurveys.percentageChange >= 0 ? '+' : ''}
            {stats.pendingSurveys.percentageChange.toFixed(1)}%
          </p>
        </div>

        {/* Completed Surveys */}
        <div class="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Completed Surveys
          </p>
          <p class="text-slate-900 dark:text-slate-50 text-3xl font-bold">
            {stats.completedSurveys.value}
          </p>
          <p
            class={`text-sm font-medium flex items-center gap-1 ${
              stats.completedSurveys.trend === 'up'
                ? 'text-green-600 dark:text-green-500'
                : stats.completedSurveys.trend === 'down'
                  ? 'text-red-600 dark:text-red-500'
                  : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span class="material-symbols-outlined text-base">
              {stats.completedSurveys.trend === 'up'
                ? 'arrow_upward'
                : stats.completedSurveys.trend === 'down'
                  ? 'arrow_downward'
                  : 'remove'}
            </span>
            {stats.completedSurveys.percentageChange >= 0 ? '+' : ''}
            {stats.completedSurveys.percentageChange.toFixed(1)}%
          </p>
        </div>

        {/* Reports Generated */}
        <div class="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p class="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Reports Generated
          </p>
          <p class="text-slate-900 dark:text-slate-50 text-3xl font-bold">
            {stats.reportsGenerated.value}
          </p>
          <p
            class={`text-sm font-medium flex items-center gap-1 ${
              stats.reportsGenerated.trend === 'up'
                ? 'text-green-600 dark:text-green-500'
                : stats.reportsGenerated.trend === 'down'
                  ? 'text-red-600 dark:text-red-500'
                  : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span class="material-symbols-outlined text-base">
              {stats.reportsGenerated.trend === 'up'
                ? 'arrow_upward'
                : stats.reportsGenerated.trend === 'down'
                  ? 'arrow_downward'
                  : 'remove'}
            </span>
            {stats.reportsGenerated.percentageChange >= 0 ? '+' : ''}
            {stats.reportsGenerated.percentageChange.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div class="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Submission Trends - Line Chart */}
        <div class="xl:col-span-3 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Submission Trends (Last 30 Days)
          </h3>
          <div class="h-80 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <p class="text-slate-500 dark:text-slate-400 text-sm">
              Chart visualization - Total submissions: {submissionTrends.total},
              Average: {submissionTrends.average.toFixed(1)}/day
            </p>
          </div>
        </div>

        {/* Survey Completions - Doughnut Chart */}
        <div class="xl:col-span-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Survey Completions
          </h3>
          <div class="h-80 flex flex-col items-center justify-center space-y-4">
            {/* Total */}
            <div class="text-center">
              <p class="text-4xl font-bold text-slate-900 dark:text-slate-50">
                {completions.total}
              </p>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                Total Surveys
              </p>
            </div>

            {/* Distribution */}
            <div class="w-full space-y-2">
              {completions.segments.map((segment) => (
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-3 h-3 rounded-full"
                      style={`background-color: ${segment.color}`}
                    />
                    <span class="text-sm text-slate-700 dark:text-slate-300 capitalize">
                      {segment.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {segment.count}
                    </span>
                    <span class="text-xs text-slate-500 dark:text-slate-400">
                      ({segment.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Survey Activity Table */}
      <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Recent Survey Activity
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead class="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-800">
              <tr>
                <th class="px-6 py-3" scope="col">
                  Institution
                </th>
                <th class="px-6 py-3" scope="col">
                  Survey Title
                </th>
                <th class="px-6 py-3" scope="col">
                  Status
                </th>
                <th class="px-6 py-3" scope="col">
                  Date
                </th>
                <th class="px-6 py-3" scope="col">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.data.map((activity) => {
                const statusColor = getSurveyStatusColor(activity.status)
                const colorClasses = {
                  blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300',
                  yellow: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
                  green: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
                  purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300',
                  red: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
                  gray: 'bg-gray-100 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300',
                }

                return (
                  <tr class="bg-white dark:bg-slate-900 border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <th
                      class="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap"
                      scope="row"
                    >
                      {activity.institutionName}
                    </th>
                    <td class="px-6 py-4">{activity.surveyTitle}</td>
                    <td class="px-6 py-4">
                      <span
                        class={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          colorClasses[statusColor as keyof typeof colorClasses] ||
                          colorClasses.gray
                        }`}
                      >
                        {activity.statusDisplay}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      {new Date(activity.date).toLocaleDateString()}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <a
                        href={`/surveys/${activity.surveyId}`}
                        class="font-medium text-primary hover:underline"
                      >
                        View Details
                      </a>
                    </td>
                  </tr>
                )
              })}

              {recentActivity.data.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    class="px-6 py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    No recent activity found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {recentActivity.total > 0 && (
          <div class="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800">
            <span class="text-sm text-slate-500 dark:text-slate-400">
              Showing{' '}
              <span class="font-semibold text-slate-900 dark:text-white">
                {recentActivity.offset + 1}
              </span>{' '}
              to{' '}
              <span class="font-semibold text-slate-900 dark:text-white">
                {Math.min(
                  recentActivity.offset + recentActivity.limit,
                  recentActivity.total
                )}
              </span>{' '}
              of{' '}
              <span class="font-semibold text-slate-900 dark:text-white">
                {recentActivity.total}
              </span>
            </span>
            <div class="inline-flex rounded-lg shadow-sm border border-slate-300 dark:border-slate-700">
              <button
                class="relative inline-flex items-center px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/50 rounded-l-lg hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-10 focus:ring-2 focus:ring-primary"
                type="button"
                disabled={recentActivity.offset === 0}
              >
                Previous
              </button>
              <button
                class="relative -ml-px inline-flex items-center px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/50 rounded-r-lg border-l border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-10 focus:ring-2 focus:ring-primary"
                type="button"
                disabled={!recentActivity.hasMore}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
