export type ControlCenterTimeRange = 'today' | '7d' | '30d' | '90d'

export interface CurrencyMetrics {
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

export interface DailyPoint {
  date: string
  currency: string
  grossSales: number
  netSales: number
  refundTotal: number
  paidOrders: number
}

export interface CommerceMetricsResponse {
  success: boolean
  range: string
  from: string
  to: string
  metrics: Record<string, CurrencyMetrics>
  daily: DailyPoint[]
  code?: string
  message?: string
}

export interface OrderSummaryItem {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  currency: string
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  grandTotal: number
  itemsCount: number
  createdAt: string
}

export interface RecentOrdersResponse {
  success: boolean
  orders: OrderSummaryItem[]
  pagination?: {
    total: number
    limit: number
    page: number
    totalPages: number
  }
}

export interface NeedsAttentionItem {
  _id: string
  name?: {tr?: string; en?: string}
  sku?: string
  sales_mode?: string
  issue: string
}

export interface ProductHealthCounts {
  readyCount: number
  needsAttentionCount: number
  inStockCount: number
  preorderCount: number
  outOfStockCount: number
  totalCount: number
  needsAttentionItems: NeedsAttentionItem[]
}
