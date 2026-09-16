import type {PaymentIntentStatus} from './types'
import {PaymentError} from './errors'

const VALID_TRANSITIONS: Record<PaymentIntentStatus, ReadonlySet<PaymentIntentStatus>> = {
  PENDING: new Set(['PENDING', 'PROCESSING', 'FAILED', 'CANCELLED']),
  PROCESSING: new Set(['PROCESSING', 'AUTHORIZED', 'PAID', 'FAILED', 'CANCELLED']),
  AUTHORIZED: new Set(['AUTHORIZED', 'PAID', 'CANCELLED']),
  PAID: new Set(['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED']),
  PARTIALLY_REFUNDED: new Set(['PARTIALLY_REFUNDED', 'REFUNDED']),
  FAILED: new Set(['FAILED']),
  CANCELLED: new Set(['CANCELLED']),
  REFUNDED: new Set(['REFUNDED']),
}

/**
 * Checks if a transition between two payment states is legally allowed.
 */
export function isValidPaymentTransition(
  from: PaymentIntentStatus,
  to: PaymentIntentStatus
): boolean {
  if (from === to) return true
  const allowed = VALID_TRANSITIONS[from]
  return allowed ? allowed.has(to) : false
}

/**
 * Asserts valid transition or throws PaymentError(422, 'PAYMENT_INVALID_STATE').
 */
export function assertValidPaymentTransition(
  from: PaymentIntentStatus,
  to: PaymentIntentStatus
): void {
  if (!isValidPaymentTransition(from, to)) {
    throw new PaymentError(
      422,
      'PAYMENT_INVALID_STATE',
      `Geçersiz ödeme durum geçişi: ${from} -> ${to}`
    )
  }
}
