import './lib/suppressWarnings'
import React from 'react'
import ReactDOM from 'react-dom/client'
import {HelmetProvider} from 'react-helmet-async'
import App from './App'
import {ErrorBoundary} from './components/ErrorBoundary'
import {errorReporter} from './lib/errorReporting'
import {initWebVitals} from './lib/webVitals'
import {validateEnv, checkRequiredEnv} from './lib/envValidation'
import './index.css'

// Handle Vite dynamic import / chunk preload errors (happens when a new build is deployed and chunk hashes change)
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    const key = 'vite_preload_reload'
    const lastReload = sessionStorage.getItem(key)
    const now = Date.now()
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem(key, String(now))
      window.location.reload()
    }
  })
}

const DEBUG_LOGS = (import.meta.env as {VITE_DEBUG_LOGS?: string}).VITE_DEBUG_LOGS === 'true'

// Validate environment variables
try {
  validateEnv()
  // checkRequiredEnv() sadece içsel kontrol için kullanılabilir,
  // artık konsola uyarı basmıyoruz ki dev konsol temiz kalsın.
  checkRequiredEnv()
} catch (error) {
  console.error('[Env Validation] Failed:', error)
  if (import.meta.env.PROD) {
    // Production'da hata fırlat
    throw error
  }
}

// Initialize error reporting
errorReporter.init()

// Initialize Web Vitals monitoring
initWebVitals({
  sendToAnalytics: true,
  sendToSentry: true,
  debug: DEBUG_LOGS,
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Could not find root element to mount to')
}

const root = ReactDOM.createRoot(rootElement)
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
)
