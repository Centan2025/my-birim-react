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
  private hasRejectionHandler = false
  private hasErrorHandler = false
  private storagePatched = false

  /**
   * Initialize analytics
   */
  init() {
    if (this.isInitialized) return

    // GA ID olsa da olmasa da, Storage patch'ini devreye al ki
    // "Access to storage is not allowed..." hataları development'ta konsolu kirletmesin.
    this.patchStorageIfNeeded()

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

    // Bazı ortamlarda (özellikle Safari / 3rd party context) localStorage erişimi
    // "Access to storage is not allowed from this context" hatası fırlatabiliyor.
    // GA'yı kapatmak yerine, Storage API'lerini sarmalayıp bu spesifik hatayı
    // yutan bir patch uyguluyoruz.
    this.patchStorageIfNeeded()

    try {
      // react-ga4, GA4 script'ini kendi yükler ve initialize eder
      ReactGA.initialize(gaId)
    } catch (_e: unknown) {
      // GA4 init hatalarını tamamen yut; prod build'te parse sorunu yaşamamak için
    }

    // GA her zaman etkin kalsın istiyoruz, fakat bazı ortamlarda (Safari, bazı Chrome context'leri)
    // storage erişimi "Uncaught (in promise) Error: Access to storage is not allowed from this context"
    // şeklinde görünüyor. Bunu global olarak yutmak için hem unhandledrejection hem de error handler ekliyoruz.
    if (!this.hasRejectionHandler) {
      window.addEventListener('unhandledrejection', event => {
        try {
          const reason = event.reason
          const msg =
            (reason &&
              (reason instanceof Error
                ? reason.message
                : typeof reason.toString === 'function'
                  ? reason.toString()
                  : String(reason))) ||
            (event.reason instanceof Error ? event.reason.message : '') ||
            ''
          if (typeof msg === 'string' && msg.includes('Access to storage is not allowed')) {
            // Bu hatayı GA yüzünden unutulmuş promise rejection olarak görme,
            // uygulamayı ve konsolu kirletmesin.
            event.preventDefault()
            if (DEBUG_LOGS) {
              console.debug('[Analytics] Storage access rejection suppressed:', msg)
            }
          }
        } catch {
          // Herhangi bir şey olursa, handler hata fırlatmasın.
        }
      })
      this.hasRejectionHandler = true
    }

    if (!this.hasErrorHandler) {
      window.addEventListener(
        'error',
        event => {
          try {
            const msg =
              (event.error instanceof Error ? event.error.message : '') || event.message || ''

            if (typeof msg === 'string' && msg.includes('Access to storage is not allowed')) {
              // Bazı tarayıcılarda senkron hatalar "Uncaught Error: Access to storage is not allowed..."
              // olarak geliyor; bunları da bastırıyoruz ki GA açık kalırken konsol kirlenmesin.
              event.preventDefault()
              // Safari vb. için ekstra güvenlik
              if ('returnValue' in event) {
                (event as ErrorEvent & {returnValue: boolean}).returnValue = false
              }

              if (DEBUG_LOGS) {
                console.debug('[Analytics] Storage access error suppressed:', msg)
              }
            }
          } catch {
            // handler kendi içinde asla patlamasın
          }
        },
        {
          capture: true,
        }
      )
      this.hasErrorHandler = true
    }
  }

  /**
   * Storage API'lerini (localStorage / sessionStorage) patch ederek
   * "Access to storage is not allowed..." hatasını sessizce yutar.
   *
   * Not: GA'yı kapatmıyoruz; sadece bu özel storage hatasını engelliyoruz.
   */
  private patchStorageIfNeeded() {
    if (this.storagePatched) return
    if (typeof window === 'undefined') return
    const StorageCtor = (window as Window & {Storage?: typeof Storage}).Storage
    const StorageProto = StorageCtor && StorageCtor.prototype
    if (!StorageProto) return

    const BLOCK_SUBSTRING = 'Access to storage is not allowed'

    const wrapMethod = (methodName: keyof Storage) => {
      const original = (StorageProto as unknown as Record<string, unknown>)[methodName]
      if (typeof original !== 'function') return
      ;(StorageProto as unknown as Record<string, unknown>)[methodName] = function (
        ...args: unknown[]
      ) {
        try {
          return original.apply(this, args)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err || '')
          if (typeof msg === 'string' && msg.includes(BLOCK_SUBSTRING)) {
            // API sözleşmesine yakın kal: getItem / key için null döndür,
            // diğerleri için undefined yeterli.
            if (methodName === 'getItem' || methodName === 'key') {
              return null
            }
            return undefined
          }
          // Farklı bir hata ise normal şekilde fırlat
          throw err
        }
      }
    }

    wrapMethod('getItem')
    wrapMethod('setItem')
    wrapMethod('removeItem')
    wrapMethod('clear')
    wrapMethod('key')

    this.storagePatched = true
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

    interface PlausibleWindow extends Window {
      plausible?: ((...args: unknown[]) => void) | {q: unknown[][]}
    }
    const w = window as PlausibleWindow
    if (!w.plausible) {
      const queue: unknown[][] = []
      w.plausible = function (...args: unknown[]) {
        queue.push(args)
      }
      ;(w.plausible as unknown as {q: unknown[][]}).q = queue
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
      try {
        ReactGA.send({
          hitType: 'pageview',
          page: path,
          title,
        })
      } catch (e: unknown) {
        if (DEBUG_LOGS) {
          const message = e instanceof Error ? e.message : String(e)
          console.debug('[Analytics] GA4 pageview error (ignored):', message || e)
        }
      }
    }

    // Plausible
    interface PlausibleWindow extends Window {
      plausible?: (...args: unknown[]) => void
    }
    const plausibleWindow = window as PlausibleWindow
    if (this.plausibleDomain && plausibleWindow.plausible) {
      plausibleWindow.plausible('pageview', {url: path})
    }

    if (import.meta.env.DEV && DEBUG_LOGS) {
      console.debug('[Analytics] Pageview:', path, title)
    }
  }

  /**
   * Track event
   */
  event(event: AnalyticsEvent) {
    const safeValue =
      typeof event.value === 'number' && Number.isFinite(event.value) ? event.value : undefined

    // Google Analytics (GA4 via react-ga4)
    if (this.googleAnalyticsId) {
      try {
        ReactGA.event({
          action: event.action,
          category: event.category,
          label: event.label,
          value: safeValue,
        })
      } catch (err) {
        if (import.meta.env.DEV && DEBUG_LOGS) {
          console.debug('[Analytics] GA4 event error (ignored):', err)
        }
      }
    }

    // Plausible
    interface PlausibleWindow extends Window {
      plausible?: (...args: unknown[]) => void
    }
    const plausibleWindow = window as PlausibleWindow
    if (this.plausibleDomain && plausibleWindow.plausible) {
      plausibleWindow.plausible(event.action, {
        props: {
          category: event.category,
          label: event.label,
          value: safeValue,
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
    const numericValue = typeof value === 'number' && Number.isFinite(value) ? value : undefined

    this.event({
      action,
      category: 'ecommerce',
      label: productId,
      value: numericValue,
    })
  }
}

export const analytics = new Analytics()

// Initialize on module load
if (typeof window !== 'undefined') {
  analytics.init()
}
