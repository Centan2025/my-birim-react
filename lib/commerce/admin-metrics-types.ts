export type MetricsTimeRange = 'today' | '7d' | '30d' | '90d' | 'custom'

export interface AdminCommerceMetricsQuery {
  range?: MetricsTimeRange | string
  from?: string
  to?: string
}

export interface CurrencyCommerceMetrics {
  currency: string
  grossSales: number
  netSales: number
  refundTotal: number
  paidOrdersCount: number
  pendingPaymentsCount: number
  averageOrderValue: number
  cancelledOrdersCount: number
  failedPaymentsCount: number
}

export interface DailyMetricPoint {
  date: string // YYYY-MM-DD
  currency: string
  grossSales: number
  netSales: number
  refundTotal: number
  paidOrders: number
}

export interface AdminCommerceMetricsResult {
  range: string
  from: string
  to: string
  metrics: Record<string, CurrencyCommerceMetrics>
  daily: DailyMetricPoint[]
}
