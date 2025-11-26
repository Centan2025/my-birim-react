/**
 * Web Vitals Monitoring
 * Core Web Vitals metriklerini toplar ve analytics'e gönderir
 */

import {onCLS, onFID, onFCP, onLCP, onTTFB, onINP, Metric} from 'web-vitals'
import {analytics} from './analytics'
import {errorReporter} from './errorReporting'

const DEBUG_LOGS = (import.meta.env as any).VITE_DEBUG_LOGS === 'true'

interface WebVitalsConfig {
  /** Analytics'e gönderilecek mi? */
  sendToAnalytics?: boolean
  /** Sentry'ye gönderilecek mi? */
  sendToSentry?: boolean
  /** Debug mode (console'a yazdır) */
  debug?: boolean
}

/**
 * Web Vitals metriklerini işle
 */
function handleMetric(metric: Metric, config: WebVitalsConfig = {}) {
  const {name, value, rating, delta, id} = metric

  // Debug mode (sadece açıkça debug istenirse veya VITE_DEBUG_LOGS=true ise)
  if (config.debug || (import.meta.env.DEV && DEBUG_LOGS)) {
    console.debug(`[Web Vitals] ${name}:`, {
      value: value.toFixed(2),
      rating,
      delta: delta.toFixed(2),
      id,
    })
  }

  // Analytics'e gönder
  if (config.sendToAnalytics !== false) {
    try {
      analytics.event({
        category: 'Web Vitals',
        action: name,
        label: rating,
        value: Math.round(value),
      })
    } catch (error) {
      console.error('[Web Vitals] Analytics error:', error)
    }
  }

  // Sentry'ye gönder (poor rating için)
  if (config.sendToSentry !== false && rating === 'poor') {
    try {
      errorReporter.captureException(new Error(`Poor Web Vital: ${name}`), {
        tags: {
          type: 'web-vital',
          metric: name,
          rating,
        },
        extra: {
          value: value.toFixed(2),
          delta: delta.toFixed(2),
          id,
        },
      })
    } catch (error) {
      console.error('[Web Vitals] Sentry error:', error)
    }
  }
}

/**
 * Web Vitals monitoring'i başlat
 */
export function initWebVitals(config: WebVitalsConfig = {}) {
  // Production'da veya açıkça aktif edilmişse çalıştır
  if (!(import.meta.env.PROD as boolean | undefined) && !config.debug) {
    return
  }

  try {
    // Cumulative Layout Shift (CLS)
    onCLS(metric => handleMetric(metric, config))

    // First Input Delay (FID) - deprecated, INP kullanılmalı
    onFID(metric => handleMetric(metric, config))

    // First Contentful Paint (FCP)
    onFCP(metric => handleMetric(metric, config))

    // Largest Contentful Paint (LCP)
    onLCP(metric => handleMetric(metric, config))

    // Time to First Byte (TTFB)
    onTTFB(metric => handleMetric(metric, config))

    // Interaction to Next Paint (INP) - FID'in yerine geçer
    onINP(metric => handleMetric(metric, config))

    if (config.debug || (import.meta.env.DEV && DEBUG_LOGS)) {
      console.debug('[Web Vitals] Monitoring initialized')
    }
  } catch (error) {
    console.error('[Web Vitals] Initialization error:', error)
  }
}

/**
 * Web Vitals metriklerini manuel olarak al
 * (Test veya debug için)
 */
export function getWebVitalsMetrics(): Promise<Metric[]> {
  return new Promise(resolve => {
    const metrics: Metric[] = []

    const handleMetric = (metric: Metric) => {
      metrics.push(metric)
      if (metrics.length >= 6) {
        resolve(metrics)
      }
    }

    onCLS(handleMetric)
    onFID(handleMetric)
    onFCP(handleMetric)
    onLCP(handleMetric)
    onTTFB(handleMetric)
    onINP(handleMetric)

    // Timeout after 10 seconds
    setTimeout(() => resolve(metrics), 10000)
  })
}
