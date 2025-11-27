/**
 * Analytics Service
 *
 * Supports multiple analytics providers:
 * - Google Analytics (gtag)
 * - Plausible Analytics
 * - Custom analytics
 */

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

  /**
   * Initialize Google Analytics
   */
  private initGoogleAnalytics(gaId: string) {
    if (typeof window === 'undefined') return

    // Load gtag script (GA4 önerilen snippet ile birebir aynı mantık)
    const script1 = document.createElement('script')
    script1.async = true
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.appendChild(script1)

    // Resmi GA4 snippet'iyle aynı dataLayer & gtag tanımı:
    // window.dataLayer = window.dataLayer || [];
    // function gtag(){dataLayer.push(arguments);}
    const w = window as unknown as {
      dataLayer?: unknown[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gtag?: (...args: any[]) => void
    }
    w.dataLayer = w.dataLayer || []
    // GA4'ün orijinal snippet'inde olduğu gibi arguments kullanmak gerekiyor;
    // bu sayede collect istekleri doğru oluşuyor.
    // Bu fonksiyonun içinde arguments kullanımı GA'nın resmi snippet'iyle uyum için gerekli.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, prefer-rest-params
    w.gtag = function gtag(this: unknown, ...args: any[]) {
      w.dataLayer!.push(args)
    }

    // İlk sayfa yüklemesinde config gönder
    w.gtag('js', new Date())
    w.gtag('config', gaId, {
      page_path: window.location.pathname,
    })

    if (import.meta.env.DEV && DEBUG_LOGS) {
      console.debug('[Analytics] Google Analytics initialized')
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
    // Google Analytics
    if (this.googleAnalyticsId && (window as any).gtag) {
      ;(window as any).gtag('config', this.googleAnalyticsId, {
        page_path: path,
        page_title: title,
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
    // Google Analytics
    if (this.googleAnalyticsId && (window as any).gtag) {
      ;(window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
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
