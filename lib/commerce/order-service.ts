import crypto from 'crypto'
import type {SupabaseClient} from '@supabase/supabase-js'
import {validateCheckout} from './checkout-validator'
import {createOrderRequestSchema} from './order-schemas'
import {CommerceValidationError} from './types'
import type {AuthoritativeCatalogBatch} from './sanityCommerceClient'
import {createGuestOrderToken, verifyGuestOrderToken} from './payment/guest-auth'
import type {
  CreateOrderRequest,
  OrderResult,
  OrderDetailResult,
  CustomerOrderSummary,
} from './order-types'
import {getSafeSupabaseAdmin} from '../server/supabaseAdmin'

export interface CreateCommerceOrderOptions {
  userId?: string | null
  catalogBatchOverride?: AuthoritativeCatalogBatch
  supabaseClientOverride?: SupabaseClient | null
}

export interface GetCommerceOrderOptions {
  userId?: string | null
  guestToken?: string | null
  supabaseClientOverride?: SupabaseClient | null
  orderOverride?: Record<string, unknown>
}

export interface ListCommerceOrdersOptions {
  supabaseClientOverride?: SupabaseClient | null
  ordersOverride?: Array<Record<string, unknown>>
}

/**
 * Minor unit to major unit helper
 * (e.g. 1500000 kuruş -> 15000.00 TL)
 */
export function minorToMajor(minor: number): number {
  return minor / 100
}

/**
 * Scopes idempotency key by authenticated user ID or guest email
 * to guarantee complete isolation across different users/guests.
 */
export function scopeIdempotencyKey(
  rawKey: string,
  userId?: string | null,
  email?: string
): string {
  const cleanKey = rawKey.trim()
  if (userId && userId.trim()) {
    return `auth:${userId.trim()}:${cleanKey}`
  }
  if (email && email.trim()) {
    return `guest:${email.trim().toLowerCase()}:${cleanKey}`
  }
  return `anon:${cleanKey}`
}

/**
 * Generates human-readable, unique order number in format: BRM-YYYYMMDD-XXXXXX
 */
export function generateOrderNumber(date = new Date()): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `BRM-${yyyy}${mm}${dd}-${randomSuffix}`
}

/**
 * Computes deterministic SHA-256 canonical hash of order input payload.
 * Protects against idempotency key reuse with mismatched payloads.
 */
export function computeRequestFingerprint(
  items: CreateOrderRequest['items'],
  checkout: CreateOrderRequest['checkout']
): string {
  // Sort items deterministically by productId, then variantId
  const sortedItems = [...items]
    .map(i => ({
      productId: i.productId.trim(),
      variantId: i.variantId ? i.variantId.trim() : null,
      quantity: i.quantity,
    }))
    .sort((a, b) => {
      const pComp = a.productId.localeCompare(b.productId)
      if (pComp !== 0) return pComp
      return (a.variantId || '').localeCompare(b.variantId || '')
    })

  const canonicalPayload = {
    items: sortedItems,
    customerType: checkout.customerType,
    customer: {
      firstName: checkout.customer.firstName.trim().toLowerCase(),
      lastName: checkout.customer.lastName.trim().toLowerCase(),
      email: checkout.customer.email.trim().toLowerCase(),
      phone: checkout.customer.phone.trim(),
    },
    shippingAddress: {
      addressLine1: checkout.shippingAddress.addressLine1.trim().toLowerCase(),
      city: checkout.shippingAddress.city.trim().toLowerCase(),
      district: checkout.shippingAddress.district.trim().toLowerCase(),
      postalCode: checkout.shippingAddress.postalCode.trim(),
      country: checkout.shippingAddress.country.trim().toLowerCase(),
    },
  }

  return crypto.createHash('sha256').update(JSON.stringify(canonicalPayload)).digest('hex')
}

/**
 * Authoritative Order Creation Engine.
 * 1. Validates strict schema & rejects client tampering
 * 2. Fetches fresh Sanity catalog & calculates minor-unit totals
 * 3. Compares expectedGrandTotal with live catalog to detect price changes (409 PRICE_CHANGED)
 * 4. Enforces scoped idempotency and executes atomic PostgreSQL transaction via RPC
 * 5. Returns safe, authoritative Order snapshot (with HMAC guestToken for guest checkout)
 */
export async function createCommerceOrder(
  rawPayload: unknown,
  options: CreateCommerceOrderOptions = {}
): Promise<OrderResult> {
  // 1. Strict Schema Validation
  const parseResult = createOrderRequestSchema.safeParse(rawPayload)
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Geçersiz sipariş oluşturma verisi.'
    throw new CommerceValidationError(400, 'INVALID_REQUEST', firstError)
  }

  const {items, checkout, expectedGrandTotal, idempotencyKey, notes} = parseResult.data

  // 2. Authoritative Server Validation & Pricing Calculation
  // Runs in-memory validation against fresh Sanity catalog
  const validationResult = await validateCheckout({items, checkout}, options.catalogBatchOverride)

  // 3. Detect Price Changes (PRICE_CHANGED Check)
  // If client supplied expectedGrandTotal from its validated snapshot, ensure it matches fresh live catalog
  if (expectedGrandTotal !== undefined && expectedGrandTotal !== null) {
    const expectedMinor = Math.round(expectedGrandTotal * 100)
    const actualMinor = Math.round(validationResult.grandTotal * 100)

    if (expectedMinor !== actualMinor) {
      throw new CommerceValidationError(
        409,
        'PRICE_CHANGED',
        'Sepetinizdeki ürünlerin güncel fiyatında değişiklik oldu. Lütfen güncel tutarı inceleyip tekrar onaylayın.'
      )
    }
  }

  // 4. Compute Scoped Idempotency Key & Deterministic Request Fingerprint
  const scopedIdempotencyKey = idempotencyKey
    ? scopeIdempotencyKey(idempotencyKey, options.userId, checkout.customer.email)
    : null

  const fingerprint = computeRequestFingerprint(items, checkout)

  // 5. Generate Order Number
  const orderNumber = generateOrderNumber()

  // 6. Build Database Order Record & Snapshots
  const orderData = {
    order_number: orderNumber,
    user_id: options.userId || null,
    status: 'PENDING_PAYMENT',
    payment_status: 'PENDING',
    currency: validationResult.currency,
    subtotal: validationResult.subtotal,
    discount_total: validationResult.discountTotal,
    shipping_total: validationResult.shippingTotal,
    tax_total: validationResult.taxTotal,
    grand_total: validationResult.grandTotal,
    customer_type: checkout.customerType,
    customer_name: `${checkout.customer.firstName} ${checkout.customer.lastName}`.trim(),
    customer_email: checkout.customer.email.toLowerCase().trim(),
    customer_phone: checkout.customer.phone.trim(),
    billing_address_snapshot: checkout.billingAddress,
    shipping_address_snapshot: checkout.shippingAddress,
    idempotency_key: scopedIdempotencyKey,
    request_fingerprint: fingerprint,
    notes: notes ? notes.trim() : null,
  }

  const itemsData = validationResult.items.map(item => ({
    product_id: item.productId,
    variant_id: item.variantId || null,
    product_name_snapshot: item.name,
    sku_snapshot: item.sku,
    selected_options_snapshot: item.selectedOptions || {},
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.totalPrice,
  }))

  // 7. Execute Atomic Order Transaction via Supabase RPC
  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (supabase) {
    const {data, error} = await supabase.rpc('create_commerce_order_atomic', {
      p_order: orderData,
      p_items: itemsData,
    })

    if (error) {
      if (
        error.code === 'P0001' ||
        error.message?.includes('IDEMPOTENCY_KEY_REUSED') ||
        error.details?.includes('IDEMPOTENCY_KEY_REUSED')
      ) {
        throw new CommerceValidationError(
          409,
          'IDEMPOTENCY_KEY_REUSED',
          'Bu sipariş işlem anahtarı (idempotency key) farklı bir sepet içeriğiyle kullanılmıştır.'
        )
      }

      // Check unique constraint violation on idempotency_key as fallback
      if (error.code === '23505' && error.message?.includes('idx_orders_idempotency_key')) {
        throw new CommerceValidationError(
          409,
          'IDEMPOTENCY_KEY_REUSED',
          'Aynı işlem anahtarı ile devam eden bir işlem mevcut.'
        )
      }

      throw new Error(
        `[Order Service] Database error while creating atomic order: ${error.message}`
      )
    }

    if (!data || !data.order_id) {
      throw new Error('[Order Service] Atomic order creation returned invalid payload.')
    }

    const createdOrderId = String(data.order_id)
    const confirmedOrderNumber = String(data.order_number)
    const guestToken = !options.userId
      ? createGuestOrderToken(createdOrderId, confirmedOrderNumber)
      : undefined

    return {
      id: createdOrderId,
      orderNumber: confirmedOrderNumber,
      status: String(data.status),
      paymentStatus: String(data.payment_status),
      currency: String(data.currency),
      subtotal: Number(data.subtotal),
      discountTotal: Number(data.discount_total || 0),
      shippingTotal: Number(data.shipping_total || 0),
      taxTotal: Number(data.tax_total || 0),
      grandTotal: Number(data.grand_total),
      itemsCount: itemsData.length,
      createdAt: data.created_at || new Date().toISOString(),
      isExisting: Boolean(data.is_existing),
      guestToken,
    }
  }

  // 8. Fallback when Supabase is not configured (e.g. testing / demo environments without DB)
  const mockOrderId = crypto.randomUUID()
  const guestToken = !options.userId ? createGuestOrderToken(mockOrderId, orderNumber) : undefined

  return {
    id: mockOrderId,
    orderNumber,
    status: 'PENDING_PAYMENT',
    paymentStatus: 'PENDING',
    currency: validationResult.currency,
    subtotal: validationResult.subtotal,
    discountTotal: validationResult.discountTotal,
    shippingTotal: validationResult.shippingTotal,
    taxTotal: validationResult.taxTotal,
    grandTotal: validationResult.grandTotal,
    itemsCount: itemsData.length,
    createdAt: new Date().toISOString(),
    isExisting: false,
    guestToken,
  }
}

/**
 * Retrieves authoritative order details with strict authorization.
 * Verifies authenticated userId or signed HMAC guestToken to prevent IDOR vulnerabilities.
 */
export async function getCommerceOrderById(
  orderId: string,
  options: GetCommerceOrderOptions = {}
): Promise<OrderDetailResult> {
  const cleanOrderId = String(orderId || '').trim()
  if (!cleanOrderId) {
    throw new CommerceValidationError(400, 'INVALID_REQUEST', 'Geçersiz sipariş ID.')
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  let orderData: Record<string, unknown> | null = null
  let itemsData: Array<Record<string, unknown>> = []

  if (options.orderOverride) {
    orderData = options.orderOverride
    itemsData = (options.orderOverride['items'] as Array<Record<string, unknown>>) || []
  } else if (supabase) {
    const {data: oData, error: oError} = await supabase
      .from('orders')
      .select(
        'id, order_number, user_id, status, payment_status, currency, subtotal, discount_total, shipping_total, tax_total, grand_total, created_at'
      )
      .eq('id', cleanOrderId)
      .single()

    if (oError || !oData) {
      throw new CommerceValidationError(404, 'ORDER_NOT_FOUND', 'Sipariş bulunamadı.')
    }
    orderData = oData

    const {data: iData} = await supabase
      .from('order_items')
      .select(
        'product_id, variant_id, product_name_snapshot, sku_snapshot, selected_options_snapshot, quantity, unit_price, total_price'
      )
      .eq('order_id', cleanOrderId)

    itemsData = iData || []
  } else {
    // In-memory mock fallback for tests without DB
    orderData = {
      id: cleanOrderId,
      order_number: `BRM-20260916-${cleanOrderId.slice(0, 6).toUpperCase()}`,
      user_id: options.userId || null,
      status: 'PENDING_PAYMENT',
      payment_status: 'PENDING',
      currency: 'TRY',
      subtotal: 15000,
      discount_total: 0,
      shipping_total: 0,
      tax_total: 0,
      grand_total: 15000,
      created_at: new Date().toISOString(),
    }
    itemsData = [
      {
        product_id: 'prod_test',
        variant_id: null,
        product_name_snapshot: 'Test Ürün',
        sku_snapshot: 'SKU-TEST',
        selected_options_snapshot: {},
        quantity: 1,
        unit_price: 15000,
        total_price: 15000,
      },
    ]
  }

  // Authorization Check (Auth User vs Guest)
  const orderUserId = orderData['user_id'] ? String(orderData['user_id']).trim() : null
  const authUserId = options.userId ? options.userId.trim() : null

  if (orderUserId) {
    if (!authUserId || authUserId !== orderUserId) {
      throw new CommerceValidationError(
        403,
        'UNAUTHORIZED',
        'Bu sipariş bilgilerini görüntüleme yetkiniz bulunmamaktadır.'
      )
    }
  } else {
    // Guest order: MUST provide valid guestToken
    if (!options.guestToken || !verifyGuestOrderToken(cleanOrderId, options.guestToken)) {
      throw new CommerceValidationError(
        403,
        'UNAUTHORIZED',
        'Misafir siparişi için geçerli yetki anahtarı sağlanmadı.'
      )
    }
  }

  return {
    id: String(orderData['id']),
    orderNumber: String(orderData['order_number']),
    status: String(orderData['status']),
    paymentStatus: String(orderData['payment_status']),
    currency: String(orderData['currency']),
    subtotal: Number(orderData['subtotal']),
    discountTotal: Number(orderData['discount_total'] || 0),
    shippingTotal: Number(orderData['shipping_total'] || 0),
    taxTotal: Number(orderData['tax_total'] || 0),
    grandTotal: Number(orderData['grand_total']),
    items: itemsData.map(i => ({
      productId: String(i['product_id']),
      variantId: i['variant_id'] ? String(i['variant_id']) : null,
      productName: String(i['product_name_snapshot'] || i['product_id']),
      sku: String(i['sku_snapshot'] || ''),
      selectedOptions: (i['selected_options_snapshot'] as Record<string, string>) || null,
      quantity: Number(i['quantity'] || 1),
      unitPrice: Number(i['unit_price'] || 0),
      totalPrice: Number(i['total_price'] || 0),
    })),
    createdAt: String(orderData['created_at'] || new Date().toISOString()),
  }
}

/**
 * Retrieves all order history for an authenticated customer.
 * Strict IDOR protection: strictly filters by authenticated user_id.
 */
export async function listCommerceOrdersForUser(
  userId: string,
  options: ListCommerceOrdersOptions = {}
): Promise<CustomerOrderSummary[]> {
  const cleanUserId = String(userId || '').trim()
  if (!cleanUserId) {
    throw new CommerceValidationError(400, 'INVALID_REQUEST', 'Geçersiz kullanıcı bilgisi.')
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (options.ordersOverride) {
    return options.ordersOverride.map(o => ({
      id: String(o['id']),
      orderNumber: String(o['order_number']),
      status: String(o['status']),
      paymentStatus: String(o['payment_status']),
      currency: String(o['currency']),
      subtotal: Number(o['subtotal']),
      discountTotal: Number(o['discount_total'] || 0),
      shippingTotal: Number(o['shipping_total'] || 0),
      taxTotal: Number(o['tax_total'] || 0),
      grandTotal: Number(o['grand_total']),
      itemsCount: Array.isArray(o['items'])
        ? o['items'].length
        : Array.isArray(o['order_items'])
          ? o['order_items'].length
          : Number(o['items_count'] || 0),
      createdAt: String(o['created_at'] || new Date().toISOString()),
    }))
  }

  if (supabase) {
    const {data: ordersData, error: ordersError} = await supabase
      .from('orders')
      .select(
        'id, order_number, status, payment_status, currency, subtotal, discount_total, shipping_total, tax_total, grand_total, created_at, order_items(id)'
      )
      .eq('user_id', cleanUserId)
      .order('created_at', {ascending: false})

    if (ordersError) {
      throw new Error(
        `[Order Service] Database error while fetching customer orders: ${ordersError.message}`
      )
    }

    return (ordersData || []).map(o => {
      const itemsList = Array.isArray(o['order_items']) ? o['order_items'] : []
      return {
        id: String(o['id']),
        orderNumber: String(o['order_number']),
        status: String(o['status']),
        paymentStatus: String(o['payment_status']),
        currency: String(o['currency']),
        subtotal: Number(o['subtotal']),
        discountTotal: Number(o['discount_total'] || 0),
        shippingTotal: Number(o['shipping_total'] || 0),
        taxTotal: Number(o['tax_total'] || 0),
        grandTotal: Number(o['grand_total']),
        itemsCount: itemsList.length,
        createdAt: String(o['created_at'] || new Date().toISOString()),
      }
    })
  }

  return []
}
