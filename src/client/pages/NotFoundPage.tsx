/**
 * NotFoundPage.tsx - Página 404
 */

import { Link } from 'wouter-preact'
import { motion } from 'framer-motion'

export function NotFoundPage() {
  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        class="text-center"
      >
        {/* 404 Icon */}
        <div class="mb-8">
          <span class="material-symbols-outlined text-9xl text-primary-500">
            error_outline
          </span>
        </div>

        {/* Title */}
        <h1 class="text-6xl font-bold text-slate-900 dark:text-slate-50 mb-4">404</h1>
        <h2 class="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Page Not Found
        </h2>

        {/* Description */}
        <p class="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div class="flex gap-4 justify-center">
          <Link href="/dashboard">
            <a class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all">
              <span class="material-symbols-outlined">home</span>
              <span>Go to Dashboard</span>
            </a>
          </Link>

          <button
            onClick={() => window.history.back()}
            class="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 px-6 rounded-lg border border-slate-300 dark:border-slate-700 shadow-lg transition-all"
          >
            <span class="material-symbols-outlined">arrow_back</span>
            <span>Go Back</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
