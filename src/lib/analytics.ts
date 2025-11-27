/**
 * Analytics Service
 *
 * Supports multiple analytics providers:
 * - Google Analytics (GA4) via react-ga4
 * - Plausible Analytics
 * - Custom analytics
 */

import ReactGA from 'react-ga4'

interface AnalyticsEvent {
  action: string
  category?: string
  label?: string
  value?: number
}

const DEBUG_LOGS =
  (import.meta.env as unknown as {VITE_DEBUG_LOGS?: string}).VITE_DEBUG_LOGS === 'true'

class Analytics {
  private isInitialized = false
  private googleAnalyticsId: string | null = null
  private plausibleDomain: string | null = null

  /**
   * Initialize analytics
   */
  init() {
    if (this.isInitialized) return

    // Google Analytics
    this.googleAnalyticsId = import.meta.env['VITE_GA_ID'] || null
    if (this.googleAnalyticsId) {
      this.initGoogleAnalytics(this.googleAnalyticsId)
    }

    // Plausible Analytics
    this.plausibleDomain = import.meta.env['VITE_PLAUSIBLE_DOMAIN'] || null
    if (this.plausibleDomain) {
      this.initPlausible(this.plausibleDomain)
    }

    this.isInitialized = true
  }

  private initGoogleAnalytics(gaId: string) {
    if (typeof window === 'undefined') return

    // react-ga4, GA4 script'ini kendi yükler ve initialize eder
    ReactGA.initialize(gaId)

    if (import.meta.env.DEV && DEBUG_LOGS) {
      console.debug('[Analytics] Google Analytics (react-ga4) initialized with', gaId)
    }
  }

  /**
   * Initialize Plausible Analytics
   */
  private initPlausible(domain: string) {
    if (typeof window === 'undefined') return

    const script = document.createElement('script')
    script.defer = true
    script.setAttribute('data-domain', domain)
    script.src = 'https://plausible.io/js/script.js'
    document.head.appendChild(script)
    ;(window as any).plausible =
      (window as any).plausible ||
      function (...args: any[]) {
        ;((window as any).plausible as any).q = ((window as any).plausible as any).q || []
        ;((window as any).plausible as any).q.push(args)
      }

    if (import.meta.env.DEV && DEBUG_LOGS) {
      console.debug('[Analytics] Plausible Analytics initialized')
    }
  }

  /**
   * Track page view
   */
  pageview(path: string, title?: string) {
    // Google Analytics (GA4 via react-ga4)
    if (this.googleAnalyticsId) {
      ReactGA.send({
        hitType: 'pageview',
        page: path,
        title,
      })
    }

    // Plausible
    if (this.plausibleDomain && (window as any).plausible) {
      ;(window as any).plausible('pageview', {url: path})
    }

    if (import.meta.env.DEV && DEBUG_LOGS) {
      console.debug('[Analytics] Pageview:', path, title)
    }
  }

  /**
   * Track event
   */
  event(event: AnalyticsEvent) {
    // Google Analytics (GA4 via react-ga4)
    if (this.googleAnalyticsId) {
      ReactGA.event({
        action: event.action,
        category: event.category,
        label: event.label,
        value: event.value,
      })
    }

    // Plausible
    if (this.plausibleDomain && (window as any).plausible) {
      ;(window as any).plausible(event.action, {
        props: {
          category: event.category,
          label: event.label,
          value: event.value,
        },
      })
    }

    if (import.meta.env.DEV && DEBUG_LOGS) {
      console.debug('[Analytics] Event:', event)
    }
  }

  /**
   * Track user action (login, signup, etc.)
   */
  trackUserAction(action: string, userId?: string) {
    this.event({
      action,
      category: 'user',
      label: userId,
    })
  }

  /**
   * Track e-commerce event
   */
  trackEcommerce(action: string, productId?: string, value?: number) {
    this.event({
      action,
      category: 'ecommerce',
      label: productId,
      value,
    })
  }
}

export const analytics = new Analytics()

// Initialize on module load
if (typeof window !== 'undefined') {
  analytics.init()
}
