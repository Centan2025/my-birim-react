import React from 'react'
import ReactDOM from 'react-dom/client'
import {HelmetProvider} from 'react-helmet-async'
import App from './App'
import {ErrorBoundary} from './components/ErrorBoundary'
import {errorReporter} from './lib/errorReporting'
import {initWebVitals} from './lib/webVitals'
import {validateEnv, checkRequiredEnv} from './lib/envValidation'
import './index.css'

const DEBUG_LOGS =
  (import.meta.env as {VITE_DEBUG_LOGS?: string}).VITE_DEBUG_LOGS === 'true'

type PatchedStorageMethod = ((this: Storage, ...args: unknown[]) => unknown) & {__patched?: boolean}

// Patch Storage API to silently handle access errors (must be done early)
if (typeof window !== 'undefined') {
  try {
    const StorageProto = window.Storage?.prototype as Storage & {
      [key: string]: PatchedStorageMethod | undefined
    }
    if (StorageProto) {
      const BLOCK_SUBSTRING = 'Access to storage is not allowed'
      const wrapMethod = (methodName: keyof Storage & string) => {
        const original = StorageProto[methodName] as PatchedStorageMethod | undefined
        if (typeof original !== 'function') return
        const wrapped = StorageProto[methodName]
        if (wrapped?.__patched) return // Already patched

        const patched: PatchedStorageMethod = function (this: Storage, ...args: unknown[]) {
          try {
            return original.apply(this, args)
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : String((err as unknown) ?? '')
            if (typeof msg === 'string' && msg.includes(BLOCK_SUBSTRING)) {
              // Return appropriate default values
              if (methodName === 'getItem' || methodName === 'key') {
                return null
              }
              return undefined
            }
            throw err
          }
        }
        patched.__patched = true
        StorageProto[methodName] = patched
      }

      wrapMethod('getItem')
      wrapMethod('setItem')
      wrapMethod('removeItem')
      wrapMethod('clear')
      wrapMethod('key')
    }
  } catch {
    // If patching fails, continue anyway
  }
}

// Filter out known non-critical console warnings and errors
if (typeof window !== 'undefined') {
  // Filter console.warn
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => {
    const message = args.map(String).join(' ')
    // Filter out Zustand deprecation warnings (from Sentry or other dependencies)
    if (typeof message === 'string' && message.includes('[DEPRECATED] Default export is deprecated')) {
      return
    }
    // Call original warn for other messages
    originalWarn.apply(console, args)
  }

  // Filter console.error for known non-critical errors
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    const message = args.map(String).join(' ')
    // Filter out storage access errors and Sentry session errors
    // Also filter "Uncaught (in promise)" messages for these errors
    if (
      typeof message === 'string' &&
      (message.includes('Access to storage is not allowed') ||
        message.includes('Could not fetch session') ||
        (message.includes('Uncaught (in promise)') &&
          (message.includes('Access to storage') || message.includes('Could not fetch session'))))
    ) {
      return
    }
    // Call original error for other messages
    originalError.apply(console, args)
  }

  // Global unhandled promise rejection handler - must be set early
  // Use addEventListener for better compatibility and earlier execution
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const errorMessage =
      event.reason?.message ||
      event.reason?.toString() ||
      String(event.reason || '')
    
    // Silently ignore known non-critical errors
    if (
      typeof errorMessage === 'string' &&
      (errorMessage.includes('Could not fetch session') ||
        errorMessage.includes('Access to storage is not allowed from this context') ||
        errorMessage.includes('Access to storage is not allowed'))
    ) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
  }, true) // Use capture phase for earlier execution

  // Also set onunhandledrejection as fallback
  const originalUnhandledRejection = window.onunhandledrejection
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const errorMessage =
      event.reason?.message ||
      event.reason?.toString() ||
      String(event.reason || '')
    
    // Silently ignore known non-critical errors
    if (
      typeof errorMessage === 'string' &&
      (errorMessage.includes('Could not fetch session') ||
        errorMessage.includes('Access to storage is not allowed from this context') ||
        errorMessage.includes('Access to storage is not allowed'))
    ) {
      event.preventDefault()
      return
    }
    
    // Call original handler if exists
    if (originalUnhandledRejection) {
      originalUnhandledRejection.call(window, event)
    }
  }

  // Also handle uncaught errors that might be related
  // Use addEventListener for better compatibility
  window.addEventListener('error', (event: ErrorEvent) => {
    const errorMessage =
      event.message ||
      event.error?.message ||
      String(event.error || '')
    
    // Silently ignore known non-critical errors
    if (
      typeof errorMessage === 'string' &&
      (errorMessage.includes('Could not fetch session') ||
        errorMessage.includes('Access to storage is not allowed') ||
        errorMessage.includes('Access to storage is not allowed from this context'))
    ) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
  }, true) // Use capture phase for earlier execution

  // Also set onerror as fallback
  const originalErrorHandler = window.onerror
  window.onerror = (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ): boolean => {
    const errorMessage =
      typeof message === 'string'
        ? message
        : error?.message || String(message || '')
    
    // Silently ignore known non-critical errors
    if (
      typeof errorMessage === 'string' &&
      (errorMessage.includes('Could not fetch session') ||
        errorMessage.includes('Access to storage is not allowed') ||
        errorMessage.includes('Access to storage is not allowed from this context'))
    ) {
      return true // Prevent default error handling
    }
    
    // Call original handler if exists
    if (originalErrorHandler) {
      const result = originalErrorHandler.call(
        window,
        message,
        source,
        lineno,
        colno,
        error
      )
      return result === true
    }
    return false
  }
}

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
