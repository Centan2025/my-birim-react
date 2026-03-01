/**
 * Error Reporting Service
 *
 * This module provides error reporting functionality.
 * Supports Sentry for production error tracking.
 */

import * as Sentry from '@sentry/react'

const DEBUG_LOGS = (import.meta.env as {VITE_DEBUG_LOGS?: string}).VITE_DEBUG_LOGS === 'true'

interface ErrorContext {
  user?: {
    id?: string
    email?: string
  }
  tags?: Record<string, string>
  extra?: Record<string, unknown>
}

class ErrorReporter {
  private isInitialized = false
  private dsn: string | null = null

  /**
   * Initialize error reporting service
   * @param dsn - Data Source Name (e.g., Sentry DSN)
   */
  init(dsn?: string) {
    if (this.isInitialized) return

    this.dsn = dsn || (import.meta.env['VITE_SENTRY_DSN'] as string | undefined) || null

    if (this.dsn) {
      try {
        Sentry.init({
          dsn: this.dsn,
          environment: (import.meta.env.MODE as string | undefined) || 'development',
          // Sentry'nin kendi tunnel seçeneği — adblocker bypass için monkey-patch gerekmez
          // tunnel: '/api/sentry-tunnel',  // Opsiyonel: Vercel API route ise aktif edilebilir
          // Disable default integrations and only include what we need
          defaultIntegrations: false,
          integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
              maskAllText: true,
              blockAllMedia: true,
            }),
          ].filter(Boolean),
          // Performance Monitoring
          tracesSampleRate: (import.meta.env.PROD as boolean | undefined) ? 0.1 : 1.0,
          // Session Replay
          replaysSessionSampleRate: (import.meta.env.PROD as boolean | undefined) ? 0.1 : 1.0,
          replaysOnErrorSampleRate: 1.0,
          // Ignore known non-critical errors
          ignoreErrors: [
            'Could not fetch session',
            'Access to storage is not allowed from this context',
            // Adblocker/DNS hatalarını sessizce yoksay (monkey-patch'e gerek kalmadan)
            'ERR_NAME_NOT_RESOLVED',
            'Failed to fetch',
            'NetworkError',
            'Network Error',
            'Load failed',
          ],
          beforeSend(event) {
            if (
              (import.meta.env.PROD as boolean | undefined) &&
              window.location.hostname === 'localhost'
            ) {
              return null
            }
            return event
          },
        })

        if (import.meta.env.DEV && DEBUG_LOGS) {
          console.debug('[ErrorReporter] Sentry initialized')
        }
      } catch (error) {
        console.error('[ErrorReporter] Failed to initialize Sentry:', error)
        this.dsn = null
      }
    } else {
      if (import.meta.env.DEV && DEBUG_LOGS) {
        console.debug('[ErrorReporter] Initialized in console-only mode (no DSN provided)')
      }
    }

    this.isInitialized = true
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: ErrorContext) {
    if (import.meta.env.DEV as boolean | undefined) {
      console.error('[ErrorReporter] Exception:', error, context)
    }

    if (this.dsn) {
      try {
        Sentry.captureException(error, {
          user: context?.user,
          tags: context?.tags,
          extra: context?.extra,
        })
      } catch (err) {
        console.error('[ErrorReporter] Failed to capture exception:', err)
      }
    }
  }

  /**
   * Capture a message
   */
  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: ErrorContext
  ) {
    if (import.meta.env.DEV && DEBUG_LOGS) {
      console.debug(`[ErrorReporter] ${level.toUpperCase()}:`, message, context)
    }

    if (this.dsn) {
      try {
        Sentry.captureMessage(message, {
          level: level as Sentry.SeverityLevel,
          user: context?.user,
          tags: context?.tags,
          extra: context?.extra,
        })
      } catch (err) {
        console.error('[ErrorReporter] Failed to capture message:', err)
      }
    }
  }

  /**
   * Set user context
   */
  setUser(user: {id?: string; email?: string; name?: string}) {
    if (this.dsn) {
      try {
        Sentry.setUser(user)
      } catch (err) {
        console.error('[ErrorReporter] Failed to set user:', err)
      }
    }
  }

  /**
   * Clear user context
   */
  clearUser() {
    if (this.dsn) {
      try {
        Sentry.setUser(null)
      } catch (err) {
        console.error('[ErrorReporter] Failed to clear user:', err)
      }
    }
  }
}

export const errorReporter = new ErrorReporter()

// Initialize on module load
errorReporter.init()
