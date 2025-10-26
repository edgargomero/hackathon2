/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#1173d4",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
        "neutral-light": "#f4f6f8",
        "neutral-dark": "#182431",
        "neutral-border-light": "#e1e4e8",
        "neutral-border-dark": "#2c3a47",
        "text-light": "#333333",
        "text-dark": "#e5e7eb",
        "text-subtle-light": "#6b7280",
        "text-subtle-dark": "#9ca3af",
        "success": "#28a745",
        "danger": "#dc3545",
        "warning": "#F5A623",
        "status-pending": "#9B9B9B",
        "status-progress": "#F5A623",
        "status-scheduled": "#9013FE",
        "status-completed": "#7ED321",
        "priority-high": "#D0021B"
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
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
