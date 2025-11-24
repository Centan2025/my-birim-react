/**
 * Error Reporting Service
 *
 * This module provides error reporting functionality.
 * Supports Sentry for production error tracking.
 */

import * as Sentry from '@sentry/react'

interface ErrorContext {
  user?: {
    id?: string
    email?: string
  }
  tags?: Record<string, string>
  extra?: Record<string, any>
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
          integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
              maskAllText: true,
              blockAllMedia: true,
            }),
          ],
          // Performance Monitoring
          tracesSampleRate: (import.meta.env.PROD as boolean | undefined) ? 0.1 : 1.0, // 10 percent in production, 100 percent in dev
          // Session Replay
          replaysSessionSampleRate: (import.meta.env.PROD as boolean | undefined) ? 0.1 : 1.0,
          replaysOnErrorSampleRate: 1.0, // Always record replays on errors
          // Filter out localhost errors in production
          beforeSend(event) {
            // Don't send errors from localhost in production
            if (
              (import.meta.env.PROD as boolean | undefined) &&
              window.location.hostname === 'localhost'
            ) {
              return null
            }
            return event
          },
        })
        console.log('[ErrorReporter] Sentry initialized')
      } catch (error) {
        console.error('[ErrorReporter] Failed to initialize Sentry:', error)
        this.dsn = null
      }
    } else {
      console.log('[ErrorReporter] Initialized in console-only mode (no DSN provided)')
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
    if (import.meta.env.DEV as boolean | undefined) {
      console.log(`[ErrorReporter] ${level.toUpperCase()}:`, message, context)
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
