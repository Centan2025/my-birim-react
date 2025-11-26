import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import {ErrorBoundary} from './components/ErrorBoundary'
import {errorReporter} from './src/lib/errorReporting'
import {initWebVitals} from './src/lib/webVitals'
import {validateEnv, checkRequiredEnv} from './src/lib/envValidation'
import './src/index.css'

const DEBUG_LOGS = (import.meta.env as any).VITE_DEBUG_LOGS === 'true'

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
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
