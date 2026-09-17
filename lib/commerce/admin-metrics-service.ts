import type {SupabaseClient} from '@supabase/supabase-js'
import {CommerceValidationError} from './types'
import type {
  AdminCommerceMetricsQuery,
  AdminCommerceMetricsResult,
  CurrencyCommerceMetrics,
  DailyMetricPoint,
  MetricsTimeRange,
} from './admin-metrics-types'
import {getSafeSupabaseAdmin} from '../server/supabaseAdmin'
import {toMinorUnits, fromMinorUnits} from './refund-service'

export interface GetAdminCommerceMetricsOptions {
  supabaseClientOverride?: SupabaseClient | null
  ordersOverride?: Array<Record<string, unknown>>
  refundsOverride?: Array<Record<string, unknown>>
  nowOverride?: Date
}

const VALID_RANGES: ReadonlySet<MetricsTimeRange> = new Set(['today', '7d', '30d', '90d', 'custom'])

/**
 * Calculates start and end ISO dates from a range string or custom from/to parameters.
 */
export function resolveDateRange(
  query: AdminCommerceMetricsQuery,
  now: Date = new Date()
): {range: string; fromDate: Date; toDate: Date} {
  const rawRange = (query.range || '30d').trim().toLowerCase()

  if (query.from || query.to || rawRange === 'custom') {
    if (!query.from && !query.to) {
      throw new CommerceValidationError(
        400,
        'INVALID_REQUEST',
        'Custom aralık için en az bir başlangıç (from) veya bitiş (to) tarihi belirtilmelidir.'
      )
    }

    const fromDate = query.from
      ? new Date(query.from)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const toDate = query.to ? new Date(query.to) : new Date(now)

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new CommerceValidationError(
        400,
        'INVALID_REQUEST',
        'Geçersiz tarih formatı. ISO 8601 formatı (YYYY-MM-DDTHH:mm:ssZ) gereklidir.'
      )
    }

    if (fromDate.getTime() > toDate.getTime()) {
      throw new CommerceValidationError(
        400,
        'INVALID_REQUEST',
        'Başlangıç tarihi bitiş tarihinden sonra olamaz.'
      )
    }

    return {range: 'custom', fromDate, toDate}
  }

  if (!VALID_RANGES.has(rawRange as MetricsTimeRange)) {
    throw new CommerceValidationError(
      400,
      'INVALID_REQUEST',
      `Geçersiz zaman aralığı: ${rawRange}. Desteklenen aralıklar: today, 7d, 30d, 90d, custom.`
    )
  }

  const toDate = new Date(now)
  let fromDate: Date

  switch (rawRange) {
    case 'today': {
      fromDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
      )
      break
    }
    case '7d': {
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    }
    case '90d': {
      fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    }
    case '30d':
    default: {
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    }
  }

  return {range: rawRange, fromDate, toDate}
}

/**
 * Checks if an order status or payment status represents a paid/successful payment.
 */
function isOrderPaid(status: string, paymentStatus: string): boolean {
  const paidStatuses = new Set(['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'])
  return paidStatuses.has(status.toUpperCase()) || paidStatuses.has(paymentStatus.toUpperCase())
}

/**
 * Checks if an order is pending payment.
 */
function isOrderPendingPayment(status: string, paymentStatus: string): boolean {
  const s = status.toUpperCase()
  const ps = paymentStatus.toUpperCase()
  return s === 'PENDING_PAYMENT' || ps === 'PENDING'
}

/**
 * Authoritative commerce calculation function.
 * Pure and deterministic, operates on normalized order and refund record snapshots.
 */
export function calculateCommerceMetrics(
  orders: Array<Record<string, unknown>>,
  refunds: Array<Record<string, unknown>>,
  range: string,
  fromDate: Date,
  toDate: Date
): AdminCommerceMetricsResult {
  const metricsByCurrency: Record<
    string,
    {
      currency: string
      grossSalesMinor: number
      refundTotalMinor: number
      paidOrdersCount: number
      pendingPaymentsCount: number
      cancelledOrdersCount: number
      failedPaymentsCount: number
    }
  > = {}

  // Helper to ensure currency bucket exists
  const getCurrencyBucket = (currency: string) => {
    const c = (currency || 'TRY').toUpperCase().trim()
    if (!metricsByCurrency[c]) {
      metricsByCurrency[c] = {
        currency: c,
        grossSalesMinor: 0,
        refundTotalMinor: 0,
        paidOrdersCount: 0,
        pendingPaymentsCount: 0,
        cancelledOrdersCount: 0,
        failedPaymentsCount: 0,
      }
    }
    return metricsByCurrency[c]
  }

  // Daily map: key = `${YYYY-MM-DD}_${CURRENCY}`
  const dailyMap: Record<
    string,
    {
      date: string
      currency: string
      grossSalesMinor: number
      refundTotalMinor: number
      paidOrders: number
    }
  > = {}

  const getDailyBucket = (dateStr: string, currency: string) => {
    const c = (currency || 'TRY').toUpperCase().trim()
    const key = `${dateStr}_${c}`
    if (!dailyMap[key]) {
      dailyMap[key] = {
        date: dateStr,
        currency: c,
        grossSalesMinor: 0,
        refundTotalMinor: 0,
        paidOrders: 0,
      }
    }
    return dailyMap[key]
  }

  // Process orders
  for (const order of orders) {
    const currency = String(order['currency'] || 'TRY')
      .toUpperCase()
      .trim()
    const bucket = getCurrencyBucket(currency)
    const status = String(order['status'] || '')
    const paymentStatus = String(order['payment_status'] || '')
    const grandTotalMajor = Number(order['grand_total'] || 0)
    const grandTotalMinor = toMinorUnits(grandTotalMajor)

    const createdAt = new Date(String(order['created_at']))
    const dateStr = !isNaN(createdAt.getTime())
      ? createdAt.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)

    const dailyBucket = getDailyBucket(dateStr, currency)

    if (isOrderPaid(status, paymentStatus)) {
      bucket.paidOrdersCount += 1
      bucket.grossSalesMinor += grandTotalMinor
      dailyBucket.paidOrders += 1
      dailyBucket.grossSalesMinor += grandTotalMinor
    } else if (isOrderPendingPayment(status, paymentStatus)) {
      bucket.pendingPaymentsCount += 1
    } else if (status.toUpperCase() === 'CANCELLED') {
      bucket.cancelledOrdersCount += 1
    } else if (
      status.toUpperCase() === 'PAYMENT_FAILED' ||
      paymentStatus.toUpperCase() === 'FAILED'
    ) {
      bucket.failedPaymentsCount += 1
    }
  }

  // Process refunds
  for (const refund of refunds) {
    const status = String(refund['status'] || '').toUpperCase()
    // Authoritative successful refunds only
    if (status !== 'SUCCESS' && status !== 'PAID') {
      continue
    }

    const currency = String(refund['currency'] || 'TRY')
      .toUpperCase()
      .trim()
    const bucket = getCurrencyBucket(currency)
    const amountMajor = Number(refund['amount'] || 0)
    const amountMinor = toMinorUnits(amountMajor)

    bucket.refundTotalMinor += amountMinor

    const createdAt = new Date(String(refund['created_at']))
    const dateStr = !isNaN(createdAt.getTime())
      ? createdAt.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)

    const dailyBucket = getDailyBucket(dateStr, currency)
    dailyBucket.refundTotalMinor += amountMinor
  }

  // Default TRY bucket if no records at all
  if (Object.keys(metricsByCurrency).length === 0) {
    getCurrencyBucket('TRY')
  }

  const finalMetrics: Record<string, CurrencyCommerceMetrics> = {}

  for (const [cur, data] of Object.entries(metricsByCurrency)) {
    const grossSales = fromMinorUnits(data.grossSalesMinor)
    const refundTotal = fromMinorUnits(data.refundTotalMinor)
    const netSales = fromMinorUnits(Math.max(0, data.grossSalesMinor - data.refundTotalMinor))
    const averageOrderValue =
      data.paidOrdersCount > 0 ? Number((netSales / data.paidOrdersCount).toFixed(2)) : 0

    finalMetrics[cur] = {
      currency: cur,
      grossSales,
      netSales,
      refundTotal,
      paidOrdersCount: data.paidOrdersCount,
      pendingPaymentsCount: data.pendingPaymentsCount,
      averageOrderValue,
      cancelledOrdersCount: data.cancelledOrdersCount,
      failedPaymentsCount: data.failedPaymentsCount,
    }
  }

  // Convert dailyMap to sorted array
  const daily: DailyMetricPoint[] = Object.values(dailyMap)
    .map(d => {
      const grossSales = fromMinorUnits(d.grossSalesMinor)
      const refundTotal = fromMinorUnits(d.refundTotalMinor)
      const netSales = fromMinorUnits(Math.max(0, d.grossSalesMinor - d.refundTotalMinor))
      return {
        date: d.date,
        currency: d.currency,
        grossSales,
        netSales,
        refundTotal,
        paidOrders: d.paidOrders,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    range,
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    metrics: finalMetrics,
    daily,
  }
}

/**
 * Authoritative Server-Side Service to query and return aggregated commerce metrics.
 * Strictly excludes all PII (no names, emails, phones, addresses, IP addresses).
 */
export async function getAdminCommerceMetrics(
  query: AdminCommerceMetricsQuery = {},
  options: GetAdminCommerceMetricsOptions = {}
): Promise<AdminCommerceMetricsResult> {
  const now = options.nowOverride || new Date()
  const {range, fromDate, toDate} = resolveDateRange(query, now)
  const fromIso = fromDate.toISOString()
  const toIso = toDate.toISOString()

  // 1. In-memory override for unit testing / mock environments
  if (options.ordersOverride !== undefined || options.refundsOverride !== undefined) {
    const orders = (options.ordersOverride || []).filter(o => {
      const created = new Date(String(o['created_at'])).getTime()
      return created >= fromDate.getTime() && created <= toDate.getTime()
    })
    const refunds = (options.refundsOverride || []).filter(r => {
      const created = new Date(String(r['created_at'])).getTime()
      return created >= fromDate.getTime() && created <= toDate.getTime()
    })
    return calculateCommerceMetrics(orders, refunds, range, fromDate, toDate)
  }

  // 2. Database query via Supabase Admin (Zero PII columns only)
  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    return calculateCommerceMetrics([], [], range, fromDate, toDate)
  }

  // Query orders (only aggregate columns, zero PII)
  const {data: ordersData, error: ordersError} = await supabase
    .from('orders')
    .select('id, status, payment_status, currency, grand_total, created_at')
    .gte('created_at', fromIso)
    .lte('created_at', toIso)

  if (ordersError) {
    throw new Error(`[Admin Metrics Service] Failed to fetch orders: ${ordersError.message}`)
  }

  // Query refunds (only aggregate columns)
  const {data: refundsData, error: refundsError} = await supabase
    .from('refunds')
    .select('id, order_id, amount, status, currency, created_at')
    .gte('created_at', fromIso)
    .lte('created_at', toIso)

  if (refundsError) {
    throw new Error(`[Admin Metrics Service] Failed to fetch refunds: ${refundsError.message}`)
  }

  return calculateCommerceMetrics(
    (ordersData || []) as Array<Record<string, unknown>>,
    (refundsData || []) as Array<Record<string, unknown>>,
    range,
    fromDate,
    toDate
  )
}
