import type {SupabaseClient} from '@supabase/supabase-js'
import {CommerceValidationError} from './types'
import type {
  AdminOrderListQuery,
  AdminOrderListResult,
  AdminOrderDetailResult,
  AdminOrderSummary,
  AdminPaymentTransactionSnapshot,
} from './admin-order-types'
import type {OrderItemSnapshot} from './order-types'
import type {RefundRecord, OrderEventRecord, RefundStatus} from './refund-types'
import {calculateRefundableAmount} from './refund-service'
import {getSafeSupabaseAdmin} from '../server/supabaseAdmin'

export interface ListAdminCommerceOrdersOptions {
  supabaseClientOverride?: SupabaseClient | null
  ordersOverride?: Array<Record<string, unknown>>
}

export interface GetAdminCommerceOrderDetailOptions {
  supabaseClientOverride?: SupabaseClient | null
  orderOverride?: Record<string, unknown>
  refundsOverride?: Array<Record<string, unknown>>
  eventsOverride?: Array<Record<string, unknown>>
}

/**
 * Authoritative admin service to list, search, filter and paginate commerce orders.
 * Strictly requires admin authorization at the API layer.
 */
export async function listAdminCommerceOrders(
  query: AdminOrderListQuery = {},
  options: ListAdminCommerceOrdersOptions = {}
): Promise<AdminOrderListResult> {
  const page = Math.max(1, Math.floor(Number(query.page) || 1))
  const limit = Math.max(1, Math.min(100, Math.floor(Number(query.limit) || 20)))
  const offset = (page - 1) * limit

  // 1. In-memory override for unit testing / mock environments
  if (options.ordersOverride) {
    let list = [...options.ordersOverride]

    // Status filter
    if (query.status && query.status.trim()) {
      const statusFilter = query.status.trim()
      list = list.filter(o => String(o['status']) === statusFilter)
    }

    // Payment status filter
    if (query.paymentStatus && query.paymentStatus.trim()) {
      const paymentStatusFilter = query.paymentStatus.trim()
      list = list.filter(o => String(o['payment_status']) === paymentStatusFilter)
    }

    // Search query (orderNumber, customerEmail, customerName)
    if (query.q && query.q.trim()) {
      const qLower = query.q.trim().toLowerCase()
      list = list.filter(o => {
        const orderNum = String(o['order_number'] || '').toLowerCase()
        const email = String(o['customer_email'] || '').toLowerCase()
        const name = String(o['customer_name'] || '').toLowerCase()
        return orderNum.includes(qLower) || email.includes(qLower) || name.includes(qLower)
      })
    }

    // Date range
    if (query.startDate) {
      const start = new Date(query.startDate).getTime()
      list = list.filter(o => new Date(String(o['created_at'])).getTime() >= start)
    }
    if (query.endDate) {
      const end = new Date(query.endDate).getTime()
      list = list.filter(o => new Date(String(o['created_at'])).getTime() <= end)
    }

    const total = list.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const paged = list.slice(offset, offset + limit)

    const orders: AdminOrderSummary[] = paged.map(o => {
      const itemsList = Array.isArray(o['order_items'])
        ? o['order_items']
        : Array.isArray(o['items'])
          ? o['items']
          : []
      return {
        id: String(o['id']),
        orderNumber: String(o['order_number']),
        userId: o['user_id'] ? String(o['user_id']) : null,
        customerType: o['customer_type'] ? String(o['customer_type']) : 'INDIVIDUAL',
        customerName: String(o['customer_name'] || 'Bilinmeyen Müşteri'),
        customerEmail: String(o['customer_email'] || ''),
        customerPhone: o['customer_phone'] ? String(o['customer_phone']) : undefined,
        status: String(o['status']),
        paymentStatus: String(o['payment_status']),
        currency: String(o['currency'] || 'TRY'),
        subtotal: Number(o['subtotal'] || 0),
        discountTotal: Number(o['discount_total'] || 0),
        shippingTotal: Number(o['shipping_total'] || 0),
        taxTotal: Number(o['tax_total'] || 0),
        grandTotal: Number(o['grand_total'] || 0),
        itemsCount: itemsList.length || Number(o['items_count'] || 0),
        createdAt: String(o['created_at'] || new Date().toISOString()),
      }
    })

    return {
      orders,
      pagination: {
        total,
        limit,
        page,
        totalPages,
      },
    }
  }

  // 2. PostgreSQL query via Supabase Admin
  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    return {
      orders: [],
      pagination: {
        total: 0,
        limit,
        page: 1,
        totalPages: 1,
      },
    }
  }

  let dbQuery = supabase
    .from('orders')
    .select(
      'id, order_number, user_id, status, payment_status, currency, subtotal, discount_total, shipping_total, tax_total, grand_total, customer_type, customer_name, customer_email, customer_phone, created_at, order_items(id)',
      {count: 'exact'}
    )

  if (query.status && query.status.trim()) {
    dbQuery = dbQuery.eq('status', query.status.trim())
  }

  if (query.paymentStatus && query.paymentStatus.trim()) {
    dbQuery = dbQuery.eq('payment_status', query.paymentStatus.trim())
  }

  if (query.startDate && query.startDate.trim()) {
    dbQuery = dbQuery.gte('created_at', query.startDate.trim())
  }

  if (query.endDate && query.endDate.trim()) {
    dbQuery = dbQuery.lte('created_at', query.endDate.trim())
  }

  if (query.q && query.q.trim()) {
    const q = query.q.trim().replace(/[,()]/g, '').slice(0, 100)
    if (q.length > 0) {
      dbQuery = dbQuery.or(
        `order_number.ilike.%${q}%,customer_email.ilike.%${q}%,customer_name.ilike.%${q}%`
      )
    }
  }

  dbQuery = dbQuery.order('created_at', {ascending: false}).range(offset, offset + limit - 1)

  const {data: rows, count, error} = await dbQuery

  if (error) {
    throw new Error(`[Admin Order Service] Failed to list orders: ${error.message}`)
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const orders: AdminOrderSummary[] = (rows || []).map(r => {
    const itemsList = Array.isArray(r['order_items']) ? r['order_items'] : []
    return {
      id: String(r['id']),
      orderNumber: String(r['order_number']),
      userId: r['user_id'] ? String(r['user_id']) : null,
      customerType: r['customer_type'] ? String(r['customer_type']) : 'INDIVIDUAL',
      customerName: String(r['customer_name'] || 'Bilinmeyen Müşteri'),
      customerEmail: String(r['customer_email'] || ''),
      customerPhone: r['customer_phone'] ? String(r['customer_phone']) : undefined,
      status: String(r['status']),
      paymentStatus: String(r['payment_status']),
      currency: String(r['currency'] || 'TRY'),
      subtotal: Number(r['subtotal'] || 0),
      discountTotal: Number(r['discount_total'] || 0),
      shippingTotal: Number(r['shipping_total'] || 0),
      taxTotal: Number(r['tax_total'] || 0),
      grandTotal: Number(r['grand_total'] || 0),
      itemsCount: itemsList.length,
      createdAt: String(r['created_at'] || new Date().toISOString()),
    }
  })

  return {
    orders,
    pagination: {
      total,
      limit,
      page,
      totalPages,
    },
  }
}

/**
 * Authoritative admin service to fetch full order detail snapshot,
 * including line items, payment transactions, refunds history, and audit trail.
 */
export async function getAdminCommerceOrderDetail(
  orderId: string,
  options: GetAdminCommerceOrderDetailOptions = {}
): Promise<AdminOrderDetailResult> {
  const cleanId = String(orderId || '').trim()
  if (!cleanId) {
    throw new CommerceValidationError(400, 'INVALID_REQUEST', 'Geçersiz sipariş ID.')
  }

  // 1. In-memory override for unit testing / mock environments
  if (options.orderOverride) {
    const o = options.orderOverride
    const rawItems =
      (o['items'] as Array<Record<string, unknown>>) ||
      (o['order_items'] as Array<Record<string, unknown>>) ||
      []
    const rawTxs = (o['payment_transactions'] as Array<Record<string, unknown>>) || []
    const rawRefunds = (options.refundsOverride ||
      (o['refunds'] as Array<Record<string, unknown>>) ||
      []) as Array<Record<string, unknown>>
    const rawEvents = (options.eventsOverride ||
      (o['order_events'] as Array<Record<string, unknown>>) ||
      []) as Array<Record<string, unknown>>

    const items: OrderItemSnapshot[] = rawItems.map(i => ({
      productId: String(i['product_id'] || i['productId']),
      variantId: i['variant_id']
        ? String(i['variant_id'])
        : i['variantId']
          ? String(i['variantId'])
          : null,
      productName: String(i['product_name_snapshot'] || i['productName'] || 'Ürün'),
      sku: String(i['sku_snapshot'] || i['sku'] || ''),
      selectedOptions: (i['selected_options_snapshot'] || i['selectedOptions'] || null) as Record<
        string,
        string
      > | null,
      quantity: Number(i['quantity'] || 1),
      unitPrice: Number(i['unit_price'] || i['unitPrice'] || 0),
      totalPrice: Number(i['total_price'] || i['totalPrice'] || 0),
    }))

    const paymentTransactions: AdminPaymentTransactionSnapshot[] = rawTxs.map(t => ({
      id: String(t['id']),
      orderId: String(t['order_id'] || cleanId),
      provider: String(t['provider'] || 'test'),
      providerPaymentId: t['provider_payment_id'] ? String(t['provider_payment_id']) : null,
      providerTransactionId: t['provider_transaction_id']
        ? String(t['provider_transaction_id'])
        : null,
      amount: Number(t['amount'] || 0),
      currency: String(t['currency'] || 'TRY'),
      status: String(t['status'] || 'PENDING'),
      installment: Number(t['installment'] || 1),
      errorCode: t['error_code'] ? String(t['error_code']) : null,
      errorMessage: t['error_message'] ? String(t['error_message']) : null,
      metadata: (t['metadata'] as Record<string, unknown>) || null,
      createdAt: String(t['created_at'] || new Date().toISOString()),
      updatedAt: t['updated_at'] ? String(t['updated_at']) : undefined,
    }))

    const refunds: RefundRecord[] = rawRefunds.map(r => ({
      id: String(r['id']),
      orderId: String(r['order_id'] || cleanId),
      paymentTransactionId: r['payment_transaction_id']
        ? String(r['payment_transaction_id'])
        : null,
      idempotencyKey: r['idempotency_key'] ? String(r['idempotency_key']) : null,
      amount: Number(r['amount'] || 0),
      currency: String(r['currency'] || 'TRY'),
      reason: String(r['reason'] || ''),
      status: (r['status'] || 'SUCCESS') as RefundStatus,
      provider: String(r['provider'] || 'mock'),
      providerRefundId: r['provider_refund_id'] ? String(r['provider_refund_id']) : null,
      metadata: (r['metadata'] as Record<string, unknown>) || null,
      createdAt: String(r['created_at'] || new Date().toISOString()),
      updatedAt: r['updated_at'] ? String(r['updated_at']) : undefined,
    }))

    const orderEvents: OrderEventRecord[] = rawEvents.map(e => ({
      id: String(e['id']),
      orderId: String(e['order_id'] || cleanId),
      eventType: String(e['event_type'] || e['eventType']),
      actorType: (e['actor_type'] || e['actorType'] || 'system') as 'system' | 'customer' | 'admin',
      actorId: e['actor_id'] ? String(e['actor_id']) : e['actorId'] ? String(e['actorId']) : null,
      metadata: (e['metadata'] as Record<string, unknown>) || null,
      createdAt: String(e['created_at'] || e['createdAt'] || new Date().toISOString()),
    }))

    const grandTotal = Number(o['grand_total'] || o['grandTotal'] || 0)
    const currency = String(o['currency'] || 'TRY')
    const calc = calculateRefundableAmount(grandTotal, refunds, currency)

    return {
      id: String(o['id']),
      orderNumber: String(o['order_number'] || o['orderNumber']),
      userId: o['user_id'] ? String(o['user_id']) : o['userId'] ? String(o['userId']) : null,
      status: String(o['status']),
      paymentStatus: String(o['payment_status'] || o['paymentStatus']),
      currency,
      subtotal: Number(o['subtotal'] || 0),
      discountTotal: Number(o['discount_total'] || o['discountTotal'] || 0),
      shippingTotal: Number(o['shipping_total'] || o['shippingTotal'] || 0),
      taxTotal: Number(o['tax_total'] || o['taxTotal'] || 0),
      grandTotal,
      customerType: String(o['customer_type'] || o['customerType'] || 'INDIVIDUAL'),
      customerName: String(o['customer_name'] || o['customerName'] || 'Bilinmeyen Müşteri'),
      customerEmail: String(o['customer_email'] || o['customerEmail'] || ''),
      customerPhone: String(o['customer_phone'] || o['customerPhone'] || ''),
      billingAddress: (o['billing_address_snapshot'] || o['billingAddress'] || {}) as Record<
        string,
        unknown
      >,
      shippingAddress: (o['shipping_address_snapshot'] || o['shippingAddress'] || {}) as Record<
        string,
        unknown
      >,
      notes: o['notes'] ? String(o['notes']) : null,
      items,
      paymentTransactions,
      refunds,
      orderEvents,
      alreadyRefunded: calc.alreadyRefunded,
      remainingRefundable: calc.remainingRefundable,
      createdAt: String(o['created_at'] || o['createdAt'] || new Date().toISOString()),
      updatedAt: o['updated_at'] ? String(o['updated_at']) : undefined,
    }
  }

  // 2. PostgreSQL query via Supabase Admin
  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    throw new CommerceValidationError(404, 'ORDER_NOT_FOUND', 'Sipariş bulunamadı.')
  }

  // Try query by id first, then order_number as fallback
  let orderData: Record<string, unknown> | null = null

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)

  if (isUuid) {
    const {data, error} = await supabase.from('orders').select('*').eq('id', cleanId).single()

    if (!error && data) {
      orderData = data
    }
  }

  if (!orderData) {
    const {data, error} = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', cleanId)
      .single()

    if (!error && data) {
      orderData = data
    }
  }

  if (!orderData) {
    throw new CommerceValidationError(404, 'ORDER_NOT_FOUND', 'Sipariş bulunamadı.')
  }

  const dbOrderId = String(orderData['id'])

  // Fetch items
  const {data: itemsData, error: itemsError} = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', dbOrderId)

  if (itemsError) {
    throw new Error(`[Admin Order Service] Failed to load order items: ${itemsError.message}`)
  }

  // Fetch payment transactions
  const {data: txData, error: txError} = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('order_id', dbOrderId)
    .order('created_at', {ascending: false})

  if (txError) {
    throw new Error(`[Admin Order Service] Failed to load payment transactions: ${txError.message}`)
  }

  // Fetch refunds
  const {data: refundsData} = await supabase
    .from('refunds')
    .select('*')
    .eq('order_id', dbOrderId)
    .order('created_at', {ascending: false})

  // Fetch audit events
  const {data: eventsData} = await supabase
    .from('commerce_order_events')
    .select('*')
    .eq('order_id', dbOrderId)
    .order('created_at', {ascending: false})

  const items: OrderItemSnapshot[] = (itemsData || []).map(i => ({
    productId: String(i['product_id']),
    variantId: i['variant_id'] ? String(i['variant_id']) : null,
    productName: String(i['product_name_snapshot'] || i['product_id']),
    sku: String(i['sku_snapshot'] || ''),
    selectedOptions: (i['selected_options_snapshot'] as Record<string, string>) || null,
    quantity: Number(i['quantity'] || 1),
    unitPrice: Number(i['unit_price'] || 0),
    totalPrice: Number(i['total_price'] || 0),
  }))

  const paymentTransactions: AdminPaymentTransactionSnapshot[] = (txData || []).map(t => ({
    id: String(t['id']),
    orderId: String(t['order_id']),
    provider: String(t['provider']),
    providerPaymentId: t['provider_payment_id'] ? String(t['provider_payment_id']) : null,
    providerTransactionId: t['provider_transaction_id']
      ? String(t['provider_transaction_id'])
      : null,
    amount: Number(t['amount'] || 0),
    currency: String(t['currency'] || 'TRY'),
    status: String(t['status']),
    installment: Number(t['installment'] || 1),
    errorCode: t['error_code'] ? String(t['error_code']) : null,
    errorMessage: t['error_message'] ? String(t['error_message']) : null,
    metadata: (t['metadata'] as Record<string, unknown>) || null,
    createdAt: String(t['created_at'] || new Date().toISOString()),
    updatedAt: t['updated_at'] ? String(t['updated_at']) : undefined,
  }))

  const refunds: RefundRecord[] = (refundsData || []).map(r => ({
    id: String(r['id']),
    orderId: String(r['order_id']),
    paymentTransactionId: r['payment_transaction_id'] ? String(r['payment_transaction_id']) : null,
    idempotencyKey: r['idempotency_key'] ? String(r['idempotency_key']) : null,
    amount: Number(r['amount'] || 0),
    currency: String(r['currency'] || 'TRY'),
    reason: String(r['reason'] || ''),
    status: (r['status'] || 'SUCCESS') as RefundStatus,
    provider: String(r['provider'] || 'mock'),
    providerRefundId: r['provider_refund_id'] ? String(r['provider_refund_id']) : null,
    metadata: (r['metadata'] as Record<string, unknown>) || null,
    createdAt: String(r['created_at'] || new Date().toISOString()),
    updatedAt: r['updated_at'] ? String(r['updated_at']) : undefined,
  }))

  const orderEvents: OrderEventRecord[] = (eventsData || []).map(e => ({
    id: String(e['id']),
    orderId: String(e['order_id']),
    eventType: String(e['event_type']),
    actorType: (e['actor_type'] || 'system') as 'system' | 'customer' | 'admin',
    actorId: e['actor_id'] ? String(e['actor_id']) : null,
    metadata: (e['metadata'] as Record<string, unknown>) || null,
    createdAt: String(e['created_at']),
  }))

  const grandTotal = Number(orderData['grand_total'] || 0)
  const currency = String(orderData['currency'] || 'TRY')
  const calc = calculateRefundableAmount(grandTotal, refunds, currency)

  return {
    id: dbOrderId,
    orderNumber: String(orderData['order_number']),
    userId: orderData['user_id'] ? String(orderData['user_id']) : null,
    status: String(orderData['status']),
    paymentStatus: String(orderData['payment_status']),
    currency,
    subtotal: Number(orderData['subtotal'] || 0),
    discountTotal: Number(orderData['discount_total'] || 0),
    shippingTotal: Number(orderData['shipping_total'] || 0),
    taxTotal: Number(orderData['tax_total'] || 0),
    grandTotal,
    customerType: String(orderData['customer_type'] || 'INDIVIDUAL'),
    customerName: String(orderData['customer_name'] || 'Bilinmeyen Müşteri'),
    customerEmail: String(orderData['customer_email'] || ''),
    customerPhone: String(orderData['customer_phone'] || ''),
    billingAddress: (orderData['billing_address_snapshot'] as Record<string, unknown>) || {},
    shippingAddress: (orderData['shipping_address_snapshot'] as Record<string, unknown>) || {},
    notes: orderData['notes'] ? String(orderData['notes']) : null,
    items,
    paymentTransactions,
    refunds,
    orderEvents,
    alreadyRefunded: calc.alreadyRefunded,
    remainingRefundable: calc.remainingRefundable,
    createdAt: String(orderData['created_at'] || new Date().toISOString()),
    updatedAt: orderData['updated_at'] ? String(orderData['updated_at']) : undefined,
  }
}
