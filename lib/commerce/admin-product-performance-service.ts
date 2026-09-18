import type {SupabaseClient} from '@supabase/supabase-js'
import {resolveDateRange} from './admin-metrics-service.js'
import type {AdminCommerceMetricsQuery} from './admin-metrics-types.js'
import {getSafeSupabaseAdmin} from '../server/supabaseAdmin.js'
import {toMinorUnits, fromMinorUnits} from './refund-service.js'

export interface ProductPerformanceItem {
  productId: string
  productName: string
  slug: string
  categorySlug?: string
  currency: string
  views: number
  clicks: number
  variantInteractions: number
  addToBagCount: number
  paidOrders: number
  unitsSold: number
  grossRevenue: number
  viewToBagRate: number
  bagToPurchaseRate: number
}

export interface FunnelSummary {
  views: number
  addToBags: number
  checkoutStarts: number
  paidOrders: number
  overallConversionRate: number
}

export interface AdminProductPerformanceResult {
  range: string
  from: string
  to: string
  currency: string
  products: ProductPerformanceItem[]
  funnel: FunnelSummary
  refundAllocationNote: string
}

export interface GetAdminProductPerformanceOptions {
  supabaseClientOverride?: SupabaseClient | null
  eventsOverride?: Array<Record<string, unknown>>
  ordersOverride?: Array<Record<string, unknown>>
  orderItemsOverride?: Array<Record<string, unknown>>
  nowOverride?: Date
}

function isOrderPaid(status: string, paymentStatus: string): boolean {
  const paidStatuses = new Set(['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'])
  return paidStatuses.has(status.toUpperCase()) || paidStatuses.has(paymentStatus.toUpperCase())
}

/**
 * Pure calculation function for product performance and conversion funnel metrics.
 */
export function calculateProductPerformance(
  events: Array<Record<string, unknown>>,
  orders: Array<Record<string, unknown>>,
  orderItems: Array<Record<string, unknown>>,
  range: string,
  fromDate: Date,
  toDate: Date,
  selectedCurrency: string = 'TRY'
): AdminProductPerformanceResult {
  const targetCurrency = selectedCurrency.toUpperCase().trim()

  // 1. Filter paid orders for selected currency and date range
  const paidOrderIds = new Set<string>()
  for (const order of orders) {
    const cur = String(order['currency'] || 'TRY')
      .toUpperCase()
      .trim()
    const status = String(order['status'] || '')
    const paymentStatus = String(order['payment_status'] || '')
    const id = String(order['id'] || '')

    if (cur === targetCurrency && isOrderPaid(status, paymentStatus)) {
      paidOrderIds.add(id)
    }
  }

  // 2. Authoritative sales aggregation by product (Strictly from order_items of paid orders)
  const salesByProduct: Record<
    string,
    {
      productName: string
      slug: string
      unitsSold: number
      grossSalesMinor: number
      orderIds: Set<string>
    }
  > = {}

  for (const item of orderItems) {
    const orderId = String(item['order_id'] || '')
    if (!paidOrderIds.has(orderId)) continue

    const prodId = String(item['product_id'] || item['sku'] || 'unknown')
    const prodName = String(
      item['product_title'] || item['product_name'] || item['title'] || prodId
    )
    const slug = String(item['product_slug'] || item['slug'] || prodId)
    const qty = typeof item['quantity'] === 'number' ? Number(item['quantity']) : 1
    const unitPrice = typeof item['unit_price'] === 'number' ? Number(item['unit_price']) : 0
    const totalMinor = toMinorUnits(unitPrice * qty)

    if (!salesByProduct[prodId]) {
      salesByProduct[prodId] = {
        productName: prodName,
        slug,
        unitsSold: 0,
        grossSalesMinor: 0,
        orderIds: new Set(),
      }
    }

    salesByProduct[prodId].unitsSold += qty
    salesByProduct[prodId].grossSalesMinor += totalMinor
    salesByProduct[prodId].orderIds.add(orderId)
  }

  // 3. Engagement aggregation by product from zero-PII shop analytics events
  const engagementByProduct: Record<
    string,
    {
      productName?: string
      slug?: string
      categorySlug?: string
      views: number
      clicks: number
      variantInteractions: number
      addToBags: number
    }
  > = {}

  let totalViews = 0
  let totalAddToBags = 0
  let totalCheckoutStarts = 0

  for (const event of events) {
    const eventName = String(event['event_name'] || '')
      .toLowerCase()
      .trim()
    const prodId = String(event['product_id'] || '')
    const slug = String(event['slug'] || '')
    const catSlug = String(event['category_slug'] || '')

    if (eventName === 'checkout_start') {
      totalCheckoutStarts += 1
      continue
    }

    if (eventName === 'product_view') totalViews += 1
    if (eventName === 'add_to_bag') totalAddToBags += 1

    const lookupKey = prodId || slug
    if (!lookupKey) continue

    if (!engagementByProduct[lookupKey]) {
      engagementByProduct[lookupKey] = {
        views: 0,
        clicks: 0,
        variantInteractions: 0,
        addToBags: 0,
        slug: slug || undefined,
        categorySlug: catSlug || undefined,
      }
    }

    if (eventName === 'product_view') {
      engagementByProduct[lookupKey].views += 1
    } else if (eventName === 'product_click') {
      engagementByProduct[lookupKey].clicks += 1
    } else if (eventName === 'variant_select') {
      engagementByProduct[lookupKey].variantInteractions += 1
    } else if (eventName === 'add_to_bag') {
      engagementByProduct[lookupKey].addToBags += 1
    }

    if (slug && !engagementByProduct[lookupKey].slug) {
      engagementByProduct[lookupKey].slug = slug
    }
    if (catSlug && !engagementByProduct[lookupKey].categorySlug) {
      engagementByProduct[lookupKey].categorySlug = catSlug
    }
  }

  // 4. Combine engagement and authoritative commerce data
  const allProductKeys = new Set([
    ...Object.keys(salesByProduct),
    ...Object.keys(engagementByProduct),
  ])
  const productList: ProductPerformanceItem[] = []

  for (const key of allProductKeys) {
    const sales = salesByProduct[key]
    const engagement = engagementByProduct[key]

    const views = engagement?.views || 0
    const clicks = engagement?.clicks || 0
    const variantInteractions = engagement?.variantInteractions || 0
    const addToBagCount = engagement?.addToBags || 0

    const paidOrders = sales?.orderIds ? sales.orderIds.size : 0
    const unitsSold = sales?.unitsSold || 0
    const grossRevenue = sales ? fromMinorUnits(sales.grossSalesMinor) : 0

    const productName = sales?.productName || engagement?.slug || key
    const slug = sales?.slug || engagement?.slug || key
    const categorySlug = engagement?.categorySlug

    // Safe rates with zero division protection
    const viewToBagRate = views > 0 ? Number(((addToBagCount / views) * 100).toFixed(2)) : 0
    const bagToPurchaseRate =
      addToBagCount > 0 ? Number(((paidOrders / addToBagCount) * 100).toFixed(2)) : 0

    productList.push({
      productId: key,
      productName,
      slug,
      categorySlug,
      currency: targetCurrency,
      views,
      clicks,
      variantInteractions,
      addToBagCount,
      paidOrders,
      unitsSold,
      grossRevenue,
      viewToBagRate,
      bagToPurchaseRate,
    })
  }

  // Sort products by gross revenue descending, then by views descending
  productList.sort((a, b) => {
    if (b.grossRevenue !== a.grossRevenue) return b.grossRevenue - a.grossRevenue
    if (b.views !== a.views) return b.views - a.views
    return b.addToBagCount - a.addToBagCount
  })

  // 5. Store-wide conversion funnel
  const totalPaidOrders = paidOrderIds.size
  const overallConversionRate =
    totalViews > 0 ? Number(((totalPaidOrders / totalViews) * 100).toFixed(2)) : 0

  const funnel: FunnelSummary = {
    views: totalViews,
    addToBags: totalAddToBags,
    checkoutStarts: totalCheckoutStarts,
    paidOrders: totalPaidOrders,
    overallConversionRate,
  }

  return {
    range,
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    currency: targetCurrency,
    products: productList,
    funnel,
    refundAllocationNote:
      'Product revenue reflects gross sales from authoritative paid orders. Refund deductions are managed at the order level.',
  }
}

/**
 * Server service to fetch and compute product performance metrics for Sanity Control Center.
 */
export async function getAdminProductPerformance(
  query: AdminCommerceMetricsQuery = {},
  options: GetAdminProductPerformanceOptions = {}
): Promise<AdminProductPerformanceResult> {
  const now = options.nowOverride || new Date()
  const {range, fromDate, toDate} = resolveDateRange(query, now)
  const fromIso = fromDate.toISOString()
  const toIso = toDate.toISOString()
  const currency = typeof query.currency === 'string' ? query.currency.toUpperCase().trim() : 'TRY'

  // 1. In-memory override for unit testing
  if (
    options.eventsOverride !== undefined ||
    options.ordersOverride !== undefined ||
    options.orderItemsOverride !== undefined
  ) {
    const events = (options.eventsOverride || []).filter(e => {
      const created = new Date(String(e['created_at'])).getTime()
      return created >= fromDate.getTime() && created <= toDate.getTime()
    })
    const orders = (options.ordersOverride || []).filter(o => {
      const created = new Date(String(o['created_at'])).getTime()
      return created >= fromDate.getTime() && created <= toDate.getTime()
    })
    const orderItems = options.orderItemsOverride || []

    return calculateProductPerformance(
      events,
      orders,
      orderItems,
      range,
      fromDate,
      toDate,
      currency
    )
  }

  // 2. Database query via Supabase Admin (Zero PII columns only)
  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    return calculateProductPerformance([], [], [], range, fromDate, toDate, currency)
  }

  // Query events (Zero PII)
  const {data: eventsData, error: eventsError} = await supabase
    .from('shop_analytics_events')
    .select('event_name, product_id, slug, category_slug, variant_id, created_at, metadata')
    .gte('created_at', fromIso)
    .lte('created_at', toIso)

  if (eventsError) {
    console.warn('[Product Performance Service] Events query warning:', eventsError.message)
  }

  // Query orders (Zero PII)
  const {data: ordersData, error: ordersError} = await supabase
    .from('orders')
    .select('id, status, payment_status, currency, created_at')
    .gte('created_at', fromIso)
    .lte('created_at', toIso)

  if (ordersError) {
    console.warn('[Product Performance Service] Orders query warning:', ordersError.message)
  }

  const safeOrdersData = (ordersData || []) as Array<Record<string, unknown>>
  const orderIds = safeOrdersData.map(o => o.id)

  // Query order items for matching orders
  let orderItemsData: Array<Record<string, unknown>> = []
  if (orderIds.length > 0) {
    const {data: items, error: itemsError} = await supabase
      .from('order_items')
      .select('order_id, product_id, product_title, product_slug, quantity, unit_price')
      .in('order_id', orderIds)

    if (itemsError) {
      console.warn('[Product Performance Service] Order items query warning:', itemsError.message)
    } else {
      orderItemsData = items || []
    }
  }

  return calculateProductPerformance(
    (eventsData || []) as Array<Record<string, unknown>>,
    (ordersData || []) as Array<Record<string, unknown>>,
    orderItemsData,
    range,
    fromDate,
    toDate,
    currency
  )
}
