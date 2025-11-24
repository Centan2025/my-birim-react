import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import {ErrorBoundary} from './components/ErrorBoundary'
import {errorReporter} from './src/lib/errorReporting'
import {initWebVitals} from './src/lib/webVitals'
import {validateEnv, checkRequiredEnv} from './src/lib/envValidation'
import './src/index.css'

// Validate environment variables
try {
  validateEnv()
  const {warnings} = checkRequiredEnv()
  if (warnings.length > 0 && import.meta.env.DEV) {
    console.warn('[Env Validation] Warnings:', warnings)
  }
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
  debug: import.meta.env.DEV,
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
