/**
 * Base Layout Component
 *
 * Provides the HTML structure, navigation, and common elements
 * for all server-side rendered pages
 */

import type { FC } from 'hono/jsx'

interface LayoutProps {
  title?: string
  children: any
  user?: {
    username: string
    email: string
    role: string
  }
  currentPath?: string
}

export const Layout: FC<LayoutProps> = ({
  title = 'ICAP Survey Manager',
  children,
  user,
  currentPath = '/dashboard',
}) => {
  const navItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard', active: true },
    { path: '/institutions', icon: 'corporate_fare', label: 'Institutions', active: false },
    { path: '/surveys', icon: 'assignment', label: 'Surveys', active: false },
    { path: '/reports', icon: 'summarize', label: 'Reports', active: false },
    { path: '/settings', icon: 'settings', label: 'Settings', active: false },
  ]

  return (
    <html lang="en" class="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>

        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

        {/* Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />

        {/* Tailwind Config */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: "class",
                theme: {
                  extend: {
                    colors: {
                      "primary": "#1173d4",
                      "background-light": "#f6f7f8",
                      "background-dark": "#101922",
                    },
                    fontFamily: {
                      "display": ["Inter", "sans-serif"]
                    },
                    borderRadius: {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
                    },
                  },
                },
              }
            `,
          }}
        />

        {/* Material Icons Config */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .material-symbols-outlined {
                font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24
              }
              .material-symbols-outlined.fill {
                font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24
              }
            `,
          }}
        />
      </head>

      <body class="font-display bg-background-light dark:bg-background-dark">
        <div class="relative flex h-auto min-h-screen w-full flex-row">
          {/* Side Navigation */}
          <nav class="flex h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-background-dark sticky top-0">
            {/* Logo */}
            <div class="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <span class="material-symbols-outlined text-primary text-3xl">
                fact_check
              </span>
              <h2 class="text-slate-800 dark:text-slate-200 text-lg font-bold">
                ICAP Survey
              </h2>
            </div>

            {/* Navigation Items */}
            <div class="flex flex-col justify-between h-full p-4">
              <div class="flex flex-col gap-2">
                {navItems.map((item) => {
                  const isActive = currentPath.startsWith(item.path)
                  const baseClass =
                    'flex items-center gap-3 px-3 py-2 rounded-lg'
                  const activeClass =
                    'bg-primary/10 text-primary'
                  const inactiveClass =
                    'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'

                  return (
                    <a
                      href={item.path}
                      class={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
                    >
                      <span
                        class={`material-symbols-outlined ${isActive ? 'fill' : ''}`}
                      >
                        {item.icon}
                      </span>
                      <p class="text-sm font-medium">{item.label}</p>
                    </a>
                  )
                })}
              </div>

              {/* Bottom Section */}
              <div class="flex flex-col gap-4">
                <div class="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col gap-2">
                  <a
                    href="/help"
                    class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg"
                  >
                    <span class="material-symbols-outlined">help_center</span>
                    <p class="text-sm font-medium">Help & Support</p>
                  </a>
                  <a
                    href="/api/auth/logout"
                    class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg"
                  >
                    <span class="material-symbols-outlined">logout</span>
                    <p class="text-sm font-medium">Logout</p>
                  </a>
                </div>

                {/* User Profile */}
                {user && (
                  <div class="flex gap-3 items-center px-3">
                    <div class="bg-primary/20 text-primary rounded-full size-10 flex items-center justify-center font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex flex-col">
                      <h1 class="text-slate-800 dark:text-slate-200 text-sm font-medium">
                        {user.username}
                      </h1>
                      <p class="text-slate-500 dark:text-slate-400 text-xs">
                        {user.email || user.role}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main class="flex-1 overflow-y-auto">
            {/* Top Navigation Bar */}
            <header class="sticky top-0 z-10 flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm px-8 py-4">
              <p class="text-slate-900 dark:text-slate-50 text-2xl font-bold tracking-tight">
                {title}
              </p>

              <div class="flex flex-1 justify-end items-center gap-4">
                {/* Search Bar */}
                <label class="relative flex-col min-w-40 !h-10 max-w-64 hidden sm:flex">
                  <span class="material-symbols-outlined text-slate-500 absolute left-3 top-1/2 -translate-y-1/2">
                    search
                  </span>
                  <input
                    type="search"
                    class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-800 dark:text-slate-200 focus:outline-0 focus:ring-2 focus:ring-primary/50 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/50 h-full placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-10 pr-4 text-sm"
                    placeholder="Search..."
                  />
                </label>

                {/* Action Buttons */}
                <div class="flex gap-2">
                  <button class="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span class="material-symbols-outlined text-xl">
                      notifications
                    </span>
                  </button>
                  <button class="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span class="material-symbols-outlined text-xl">help</span>
                  </button>
                </div>

                {/* User Avatar */}
                {user && (
                  <div class="bg-primary/20 text-primary rounded-full size-10 flex items-center justify-center font-semibold text-lg">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </header>

            {/* Page Content */}
            <div class="p-8 space-y-8">{children}</div>
          </main>
        </div>

        {/* Client Script (if needed) */}
        <script src="/static/client.js" defer></script>
      </body>
    </html>
  )
}
