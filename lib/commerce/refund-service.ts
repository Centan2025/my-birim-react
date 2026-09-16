import type {SupabaseClient} from '@supabase/supabase-js'
import {CommerceValidationError} from './types'
import {createRefundRequestSchema} from './refund-schemas'
import type {
  CreateRefundResult,
  RefundRecord,
  RefundCalculation,
  RefundStatus,
} from './refund-types'
import {canRefundOrderStatus} from './order-lifecycle'
import {getSafeSupabaseAdmin} from '../server/supabaseAdmin'

export interface CreateCommerceRefundOptions {
  actorType?: 'system' | 'customer' | 'admin'
  actorId?: string | null
  provider?: string
  providerRefundId?: string | null
  supabaseClientOverride?: SupabaseClient | null
  orderOverride?: Record<string, unknown>
  refundsOverride?: Array<Record<string, unknown>>
}

export interface ListOrderRefundsOptions {
  supabaseClientOverride?: SupabaseClient | null
  refundsOverride?: Array<Record<string, unknown>>
}

/**
 * Converts major currency unit (e.g. 150.50 TL) to minor unit (15050 kuruş).
 * Protects against JavaScript IEEE-754 floating point arithmetic precision errors.
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Converts minor currency unit (e.g. 15050 kuruş) to major unit (150.50 TL).
 */
export function fromMinorUnits(minor: number): number {
  return minor / 100
}

/**
 * Calculates authoritative refundable amount in minor-unit precision.
 */
export function calculateRefundableAmount(
  orderTotalMajor: number,
  existingRefunds: Array<{amount: number; status: string}> = [],
  currency = 'TRY'
): RefundCalculation {
  const orderTotalMinor = toMinorUnits(orderTotalMajor)

  const successfulRefundsMinor = existingRefunds
    .filter(r => r.status === 'SUCCESS' || r.status === 'PAID')
    .reduce((sum, r) => sum + toMinorUnits(Number(r.amount) || 0), 0)

  const remainingMinor = Math.max(0, orderTotalMinor - successfulRefundsMinor)
  const isFullyRefunded = remainingMinor === 0

  return {
    orderTotal: fromMinorUnits(orderTotalMinor),
    alreadyRefunded: fromMinorUnits(successfulRefundsMinor),
    remainingRefundable: fromMinorUnits(remainingMinor),
    currency,
    isFullyRefunded,
  }
}

/**
 * Authoritative Server-Side Order Refund Service.
 * - Enforces minor-unit calculation & over-refund protection.
 * - Guarantees atomic PostgreSQL execution via RPC with Row-level locking.
 * - Provides full idempotency protection.
 * - Logs audit trail event.
 */
export async function createCommerceRefund(
  rawPayload: unknown,
  options: CreateCommerceRefundOptions = {}
): Promise<CreateRefundResult> {
  // 1. Strict Schema Validation
  const parseResult = createRefundRequestSchema.safeParse(rawPayload)
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Geçersiz iade verisi.'
    throw new CommerceValidationError(400, 'INVALID_REQUEST', firstError)
  }

  const {orderId, amount, reason, idempotencyKey} = parseResult.data
  const actorType = options.actorType || 'admin'
  const actorId = options.actorId || null
  const provider = options.provider || 'mock'
  const providerRefundId = options.providerRefundId || null

  // 2. In-Memory Mock Override for Unit Testing
  if (options.orderOverride) {
    const order = options.orderOverride
    const orderStatus = String(order['status'] || 'PENDING_PAYMENT')

    if (!canRefundOrderStatus(orderStatus)) {
      throw new CommerceValidationError(
        422,
        'REFUND_NOT_ALLOWED',
        `'${orderStatus}' durumundaki sipariş için iade işlemi başlatılamaz.`
      )
    }

    const existingRefunds = (options.refundsOverride || []) as Array<{
      id?: string
      order_id?: string
      amount: number
      status: string
      reason?: string
      idempotency_key?: string
      created_at?: string
    }>

    // Idempotency check in mock
    if (idempotencyKey && idempotencyKey.trim()) {
      const match = existingRefunds.find(r => r.idempotency_key === idempotencyKey.trim())
      if (match) {
        if (toMinorUnits(Number(match.amount)) !== toMinorUnits(amount)) {
          throw new CommerceValidationError(
            409,
            'REFUND_IDEMPOTENCY_KEY_REUSED',
            'Bu iade işlem anahtarı farklı bir tutar veya talep ile kullanılmıştır.'
          )
        }
        const calc = calculateRefundableAmount(
          Number(order['grand_total'] || 0),
          existingRefunds,
          String(order['currency'] || 'TRY')
        )
        return {
          success: true,
          isExisting: true,
          refundId: String(match.id || 'ref_mock_existing'),
          orderId,
          amount: Number(match.amount),
          currency: String(order['currency'] || 'TRY'),
          status: 'SUCCESS',
          reason: String(match.reason || reason),
          orderStatus: String(order['status']),
          remainingRefundable: calc.remainingRefundable,
          createdAt: String(match.created_at || new Date().toISOString()),
        }
      }
    }

    const calc = calculateRefundableAmount(
      Number(order['grand_total'] || 0),
      existingRefunds,
      String(order['currency'] || 'TRY')
    )

    const requestMinor = toMinorUnits(amount)
    const remainingMinor = toMinorUnits(calc.remainingRefundable)

    if (requestMinor > remainingMinor) {
      throw new CommerceValidationError(
        422,
        'REFUND_AMOUNT_EXCEEDS_REMAINING',
        `İade tutarı (${amount} ${calc.currency}) kalan iade edilebilir tutarı (${calc.remainingRefundable} ${calc.currency}) aşamaz.`
      )
    }

    const newRemainingMinor = remainingMinor - requestMinor
    const newOrderStatus = newRemainingMinor <= 0 ? 'REFUNDED' : 'PARTIALLY_REFUNDED'

    order['status'] = newOrderStatus
    order['payment_status'] = newOrderStatus

    const createdRefund = {
      id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      order_id: orderId,
      amount,
      currency: calc.currency,
      status: 'SUCCESS',
      reason,
      idempotency_key: idempotencyKey || null,
      created_at: new Date().toISOString(),
    }

    if (options.refundsOverride) {
      options.refundsOverride.push(createdRefund)
    }

    return {
      success: true,
      isExisting: false,
      refundId: createdRefund.id,
      orderId,
      amount,
      currency: calc.currency,
      status: 'SUCCESS',
      reason,
      orderStatus: newOrderStatus,
      remainingRefundable: fromMinorUnits(newRemainingMinor),
      createdAt: createdRefund.created_at,
    }
  }

  // 3. PostgreSQL RPC execution via Supabase Admin
  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) {
    throw new CommerceValidationError(
      503,
      'INTERNAL_ERROR',
      'Veritabanı bağlantısı yapılandırılamadı.'
    )
  }

  const {data, error} = await supabase.rpc('process_order_refund_atomic', {
    p_refund: {
      order_id: orderId,
      amount,
      reason: reason.trim(),
      idempotency_key: idempotencyKey ? idempotencyKey.trim() : null,
      actor_type: actorType,
      actor_id: actorId,
      provider,
      provider_refund_id: providerRefundId,
    },
  })

  if (error) {
    if (error.code === 'P0001' || error.message?.includes('REFUND_IDEMPOTENCY_KEY_REUSED')) {
      throw new CommerceValidationError(
        409,
        'REFUND_IDEMPOTENCY_KEY_REUSED',
        'Bu iade işlem anahtarı farklı bir tutar veya talep ile kullanılmıştır.'
      )
    }
    if (error.code === 'P0002' || error.message?.includes('ORDER_NOT_FOUND')) {
      throw new CommerceValidationError(
        404,
        'ORDER_NOT_FOUND',
        'İade yapılacak sipariş bulunamadı.'
      )
    }
    if (error.code === 'P0006' || error.message?.includes('REFUND_AMOUNT_INVALID')) {
      throw new CommerceValidationError(
        422,
        'REFUND_AMOUNT_INVALID',
        'İade tutarı geçerli değildir.'
      )
    }
    if (error.code === 'P0007' || error.message?.includes('REFUND_NOT_ALLOWED')) {
      throw new CommerceValidationError(
        422,
        'REFUND_NOT_ALLOWED',
        'Bu sipariş mevcut durumunda iade edilemez. Yalnızca ödenmiş siparişler iade edilebilir.'
      )
    }
    if (error.code === 'P0008' || error.message?.includes('REFUND_AMOUNT_EXCEEDS_REMAINING')) {
      throw new CommerceValidationError(
        422,
        'REFUND_AMOUNT_EXCEEDS_REMAINING',
        'İade tutarı, siparişin kalan iade edilebilir tutarını aşıyor.'
      )
    }
    throw new Error(`[Refund Service] Database error during atomic refund: ${error.message}`)
  }

  if (!data || !data.success) {
    throw new Error('[Refund Service] Atomic refund RPC returned invalid payload.')
  }

  return {
    success: true,
    isExisting: Boolean(data.is_existing),
    refundId: String(data.refund_id),
    orderId: String(data.order_id),
    amount: Number(data.amount),
    currency: String(data.currency || 'TRY'),
    status: (data.status || 'SUCCESS') as RefundStatus,
    reason: String(data.reason || reason),
    orderStatus: String(data.order_status),
    remainingRefundable: Number(data.remaining_refundable || 0),
    createdAt: String(data.created_at || new Date().toISOString()),
  }
}

/**
 * Lists all refunds for a specific order.
 */
export async function listOrderRefunds(
  orderId: string,
  options: ListOrderRefundsOptions = {}
): Promise<RefundRecord[]> {
  const cleanOrderId = String(orderId || '').trim()
  if (!cleanOrderId) return []

  if (options.refundsOverride) {
    return options.refundsOverride
      .filter(r => String(r['order_id']) === cleanOrderId)
      .map(r => ({
        id: String(r['id']),
        orderId: String(r['order_id']),
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
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) return []

  const {data, error} = await supabase
    .from('refunds')
    .select('*')
    .eq('order_id', cleanOrderId)
    .order('created_at', {ascending: false})

  if (error || !data) return []

  return data.map(r => ({
    id: String(r['id']),
    orderId: String(r['order_id']),
    paymentTransactionId: r['payment_transaction_id'] ? String(r['payment_transaction_id']) : null,
    idempotencyKey: r['idempotency_key'] ? String(r['idempotency_key']) : null,
    amount: Number(r['amount']),
    currency: String(r['currency']),
    reason: String(r['reason']),
    status: r['status'] as RefundStatus,
    provider: String(r['provider']),
    providerRefundId: r['provider_refund_id'] ? String(r['provider_refund_id']) : null,
    metadata: (r['metadata'] as Record<string, unknown>) || null,
    createdAt: String(r['created_at']),
    updatedAt: r['updated_at'] ? String(r['updated_at']) : undefined,
  }))
}
