import crypto from 'crypto'
import type {SupabaseClient} from '@supabase/supabase-js'
import {initiatePaymentRequestSchema} from './schemas.js'
import {PaymentError} from './errors.js'
import {getPaymentProvider} from './provider-registry.js'
import {verifyGuestOrderToken} from './guest-auth.js'
import {assertValidPaymentTransition} from './state-machine.js'
import type {PaymentProvider} from './provider.js'
import type {
  PaymentIntent,
  VerifiedPaymentEvent,
  PaymentCallbackResult,
  VerifyPaymentCallbackInput,
} from './types.js'
import {getSafeSupabaseAdmin} from '../../server/supabaseAdmin.js'

export interface InitiatePaymentOptions {
  userId?: string | null
  supabaseClientOverride?: SupabaseClient | null
  providerOverride?: PaymentProvider
  orderOverride?: Record<string, unknown>
}

export interface HandlePaymentCallbackOptions {
  providerOverride?: PaymentProvider
  supabaseClientOverride?: SupabaseClient | null
}

/**
 * Server-Authoritative Payment Initiation Service.
 * 1. Strictly validates request payload
 * 2. Fetches authoritative order from database
 * 3. Verifies user/guest authorization & payable state
 * 4. Derives amount & currency directly from server order snapshot
 * 5. Executes provider-neutral payment intent creation and atomic DB transaction
 */
export async function initiatePayment(
  rawPayload: unknown,
  options: InitiatePaymentOptions = {}
): Promise<PaymentIntent> {
  // 1. Strict Schema Validation
  const parseResult = initiatePaymentRequestSchema.safeParse(rawPayload)
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Geçersiz ödeme başlatma isteği.'
    throw new PaymentError(400, 'INVALID_REQUEST', firstError)
  }

  const {orderId, guestToken, idempotencyKey} = parseResult.data

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  // 2. Fetch Authoritative Order
  let order: Record<string, unknown> | null = null

  if (options.orderOverride) {
    order = options.orderOverride
  } else if (supabase) {
    const {data: orderData, error: orderError} = await supabase
      .from('orders')
      .select(
        'id, order_number, user_id, status, payment_status, currency, grand_total, customer_name, customer_email, customer_phone, billing_address_snapshot, shipping_address_snapshot'
      )
      .eq('id', orderId)
      .single()

    if (orderError || !orderData) {
      throw new PaymentError(404, 'PAYMENT_ORDER_NOT_FOUND', 'Ödeme yapılacak sipariş bulunamadı.')
    }
    order = orderData
  } else {
    // In-memory mock fallback for tests/dev without DB
    order = {
      id: orderId,
      order_number: `BRM-20260916-${orderId.slice(0, 6).toUpperCase()}`,
      user_id: options.userId || null,
      status: 'PENDING_PAYMENT',
      payment_status: 'PENDING',
      currency: 'TRY',
      grand_total: 15000,
      customer_name: 'Test Customer',
      customer_email: 'customer@example.com',
      billing_address_snapshot: {},
      shipping_address_snapshot: {},
    }
  }

  // 3. Authorization Verification (User vs Guest)
  const orderUserId = order['user_id'] ? String(order['user_id']).trim() : null
  const authenticatedUserId = options.userId ? options.userId.trim() : null

  if (orderUserId) {
    // Authenticated order: MUST match authenticated user
    if (!authenticatedUserId || authenticatedUserId !== orderUserId) {
      throw new PaymentError(
        403,
        'PAYMENT_ORDER_NOT_OWNED',
        'Bu sipariş için ödeme başlatma yetkiniz bulunmamaktadır.'
      )
    }
  } else {
    // Guest order: MUST provide valid guestToken
    if (!guestToken || !verifyGuestOrderToken(String(order['id']), guestToken)) {
      throw new PaymentError(
        403,
        'PAYMENT_ORDER_NOT_OWNED',
        'Misafir siparişi için geçerli erişim anahtarı sağlanmadı.'
      )
    }
  }

  // 4. Order Payable State Verification
  const orderStatus = String(order['status'] || 'PENDING_PAYMENT')
  const paymentStatus = String(order['payment_status'] || 'PENDING')
  const rawGrandTotal = Number(order['grand_total'])
  const currency = String(order['currency'] || 'TRY').toUpperCase()

  if (orderStatus === 'PAID' || paymentStatus === 'PAID') {
    throw new PaymentError(
      409,
      'PAYMENT_ALREADY_PAID',
      'Bu siparişin ödemesi zaten tamamlanmıştır.'
    )
  }

  if (orderStatus !== 'PENDING_PAYMENT') {
    throw new PaymentError(
      422,
      'PAYMENT_ORDER_NOT_PAYABLE',
      'Bu sipariş ödeme başlatmak için uygun durumda değildir.'
    )
  }

  if (isNaN(rawGrandTotal) || rawGrandTotal <= 0) {
    throw new PaymentError(422, 'PAYMENT_AMOUNT_MISMATCH', 'Geçersiz sipariş toplam tutarı.')
  }

  // 5. Derive Money Snapshot using Integer Minor Units
  const amount = rawGrandTotal
  const amountMinor = Math.round(amount * 100)

  // 6. Resolve Provider & Scoped Idempotency Key
  const provider = options.providerOverride || getPaymentProvider()
  const scopedIdempotencyKey = idempotencyKey
    ? `pay:order_${orderId}:${idempotencyKey.trim()}`
    : null

  // 7. Initialize Payment on Provider Adapter
  const providerResult = await provider.createPaymentIntent({
    orderId: String(order['id']),
    orderNumber: String(order['order_number']),
    amount,
    amountMinor,
    currency,
    customer: {
      name: String(order['customer_name'] || ''),
      email: String(order['customer_email'] || ''),
      phone: order['customer_phone'] ? String(order['customer_phone']) : null,
    },
    billingAddress: (order['billing_address_snapshot'] as Record<string, unknown>) || {},
    shippingAddress: (order['shipping_address_snapshot'] as Record<string, unknown>) || {},
    items: [],
  })

  // 8. Record Payment Transaction in Database Atomically
  if (supabase) {
    const transactionData = {
      order_id: String(order['id']),
      provider: provider.id,
      provider_transaction_id: providerResult.providerTransactionId,
      provider_payment_id: providerResult.providerPaymentId || null,
      provider_token: providerResult.providerToken || null,
      amount,
      currency,
      status: providerResult.status,
      idempotency_key: scopedIdempotencyKey,
      metadata: providerResult.rawResponseScrubbed || {},
    }

    const {data, error} = await supabase.rpc('create_payment_transaction_atomic', {
      p_transaction: transactionData,
    })

    if (error) {
      if (error.code === 'P0001' || error.message?.includes('PAYMENT_IDEMPOTENCY_KEY_REUSED')) {
        throw new PaymentError(
          409,
          'PAYMENT_IDEMPOTENCY_KEY_REUSED',
          'Bu ödeme işlem anahtarı (idempotency key) farklı bir siparişle kullanılmıştır.'
        )
      }

      if (error.code === 'P0003' || error.message?.includes('PAYMENT_ALREADY_PAID')) {
        throw new PaymentError(409, 'PAYMENT_ALREADY_PAID', 'Bu sipariş zaten ödenmiştir.')
      }

      if (error.code === 'P0004' || error.message?.includes('PAYMENT_ORDER_NOT_PAYABLE')) {
        throw new PaymentError(422, 'PAYMENT_ORDER_NOT_PAYABLE', 'Sipariş ödeme için uygun değil.')
      }

      throw new Error(`[Payment Service] Failed to create payment transaction: ${error.message}`)
    }

    return {
      id: String(data.transaction_id),
      orderId: String(data.order_id),
      orderNumber: String(order['order_number']),
      provider: provider.id,
      amount: Number(data.amount),
      amountMinor,
      currency: String(data.currency),
      status: String(data.status) as import('./types').PaymentIntentStatus,
      clientSecret: providerResult.clientSecret,
      redirectUrl: providerResult.redirectUrl,
      createdAt: data.created_at || new Date().toISOString(),
      isExisting: Boolean(data.is_existing),
    }
  }

  // 9. Fallback when Supabase is not configured (e.g. testing / demo)
  return {
    id: `tx_${crypto.randomUUID()}`,
    orderId: String(order['id']),
    orderNumber: String(order['order_number']),
    provider: provider.id,
    amount,
    amountMinor,
    currency,
    status: providerResult.status,
    clientSecret: providerResult.clientSecret,
    redirectUrl: providerResult.redirectUrl,
    createdAt: new Date().toISOString(),
    isExisting: false,
  }
}

/**
 * Handles incoming verified payment events (callbacks / webhooks)
 * and updates payment transaction and order status atomically.
 */
export async function handlePaymentCallback(
  rawInput: VerifyPaymentCallbackInput,
  options: HandlePaymentCallbackOptions = {}
): Promise<PaymentCallbackResult> {
  // 1. Verify Callback via Provider Adapter
  const provider = options.providerOverride || getPaymentProvider()
  const event: VerifiedPaymentEvent = await provider.verifyCallback(rawInput)

  // 2. Validate State Machine
  assertValidPaymentTransition('PROCESSING', event.status)

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  // 3. Update Database Atomically
  if (supabase && event.paymentTransactionId) {
    const {data, error} = await supabase.rpc('resolve_payment_event_atomic', {
      p_event: {
        transaction_id: event.paymentTransactionId,
        status: event.status,
        provider_event_id: event.providerEventId,
        provider_transaction_id: event.providerTransactionId || null,
        error_code: event.errorCode || null,
        error_message: event.errorMessage || null,
      },
    })

    if (error) {
      throw new Error(`[Payment Service] Failed to resolve payment event: ${error.message}`)
    }

    return {
      success: true,
      orderId: data.order_id,
      status: data.status,
      duplicate: Boolean(data.is_duplicate),
      message: data.is_duplicate
        ? 'Duplicate callback event acknowledged.'
        : 'Payment event resolved successfully.',
    }
  }

  return {
    success: true,
    orderId: event.orderId,
    status: event.status,
    duplicate: false,
    message: 'Payment event processed successfully.',
  }
}

export interface GetPaymentStatusOptions {
  userId?: string | null
  guestToken?: string | null
  supabaseClientOverride?: SupabaseClient | null
  transactionOverride?: Record<string, unknown>
}

/**
 * Retrieves authoritative payment transaction details with strict authorization.
 * Verifies authenticated userId or signed HMAC guestToken to prevent IDOR vulnerabilities.
 */
export async function getPaymentStatus(
  transactionId: string,
  options: GetPaymentStatusOptions = {}
): Promise<PaymentIntent> {
  const cleanTxId = String(transactionId || '').trim()
  if (!cleanTxId) {
    throw new PaymentError(400, 'INVALID_REQUEST', 'Geçersiz ödeme işlem ID.')
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  let txData: Record<string, unknown> | null = null
  let orderData: Record<string, unknown> | null = null

  if (options.transactionOverride) {
    txData = options.transactionOverride
    orderData = (options.transactionOverride['order'] as Record<string, unknown>) || {
      id: txData['order_id'],
      user_id: options.userId || null,
      order_number: 'BRM-20260916-SAMPLE',
    }
  } else if (supabase) {
    const {data, error} = await supabase
      .from('payment_transactions')
      .select(
        'id, order_id, provider, amount, currency, status, provider_transaction_id, provider_payment_id, created_at, orders(id, user_id, order_number, status, payment_status)'
      )
      .eq('id', cleanTxId)
      .single()

    if (error || !data) {
      throw new PaymentError(404, 'PAYMENT_TRANSACTION_NOT_FOUND', 'Ödeme işlemi bulunamadı.')
    }

    txData = data as unknown as Record<string, unknown>
    orderData = (Array.isArray(data.orders) ? data.orders[0] : data.orders) as unknown as Record<
      string,
      unknown
    > | null
  } else {
    // In-memory fallback
    txData = {
      id: cleanTxId,
      order_id: 'ord_mock_123',
      provider: 'mock',
      amount: 15000,
      currency: 'TRY',
      status: 'PENDING',
      created_at: new Date().toISOString(),
    }
    orderData = {
      id: 'ord_mock_123',
      user_id: options.userId || null,
      order_number: 'BRM-20260916-MOCK123',
      status: 'PENDING_PAYMENT',
      payment_status: 'PENDING',
    }
  }

  // Authorization Check (User vs Guest)
  const orderUserId = orderData && orderData['user_id'] ? String(orderData['user_id']).trim() : null
  const authUserId = options.userId ? options.userId.trim() : null

  if (orderUserId) {
    if (!authUserId || authUserId !== orderUserId) {
      throw new PaymentError(
        403,
        'PAYMENT_ORDER_NOT_OWNED',
        'Bu ödeme işlemine erişim yetkiniz bulunmamaktadır.'
      )
    }
  } else {
    const orderId = String(orderData?.['id'] || txData['order_id'])
    if (!options.guestToken || !verifyGuestOrderToken(orderId, options.guestToken)) {
      throw new PaymentError(
        403,
        'PAYMENT_ORDER_NOT_OWNED',
        'Misafir siparişi için geçerli yetki anahtarı sağlanmadı.'
      )
    }
  }

  const amount = Number(txData['amount'])
  return {
    id: String(txData['id']),
    orderId: String(orderData?.['id'] || txData['order_id']),
    orderNumber: String(orderData?.['order_number'] || ''),
    provider: String(txData['provider'] || 'mock'),
    amount,
    amountMinor: Math.round(amount * 100),
    currency: String(txData['currency'] || 'TRY'),
    status: String(txData['status']) as import('./types').PaymentIntentStatus,
    createdAt: String(txData['created_at'] || new Date().toISOString()),
  }
}
