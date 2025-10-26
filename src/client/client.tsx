/**
 * Client-side Entry Point - Preact SPA
 *
 * Monta la aplicación Preact en el elemento #root
 */

import { render } from 'preact'
import { App } from './App'

console.log('ICAP Survey Platform - Initializing Preact SPA...')

// Buscar elemento root
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found! Expected <div id="root"></div> in HTML')
}

// Montar App de Preact
render(<App />, rootElement)

console.log('✓ ICAP Survey Platform - Preact SPA mounted successfully')
