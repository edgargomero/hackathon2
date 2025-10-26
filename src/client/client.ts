/**
 * Client-side Entry Point
 *
 * This file handles client-side JavaScript for interactive features
 * Currently minimal - add interactivity as needed
 */

console.log('ICAP Survey Platform - Client initialized')

// Dark mode toggle (if needed)
function initDarkMode() {
  const darkModeToggle = document.getElementById('dark-mode-toggle')

  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark')
      localStorage.setItem(
        'darkMode',
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      )
    })
  }

  // Restore from localStorage
  const savedMode = localStorage.getItem('darkMode')
  if (savedMode === 'dark') {
    document.documentElement.classList.add('dark')
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDarkMode)
} else {
  initDarkMode()
}
