import crypto from 'crypto'
import type {PaymentProvider} from './provider'
import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  GetPaymentStatusInput,
  GetPaymentStatusResult,
  VerifyPaymentCallbackInput,
  VerifiedPaymentEvent,
} from './types'
import {PaymentError} from './errors'

export class MockPaymentProvider implements PaymentProvider {
  public readonly id = 'mock'

  private assertAllowedEnvironment(): void {
    const isProd = process.env['NODE_ENV'] === 'production'
    const allowMockInProd = process.env['PAYMENT_ALLOW_MOCK'] === 'true'

    if (isProd && !allowMockInProd) {
      throw new PaymentError(
        403,
        'MOCK_PROVIDER_DISABLED',
        'Mock payment provider is not permitted in production environment.'
      )
    }
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    this.assertAllowedEnvironment()

    const mockTxId = `mock_tx_${crypto.randomUUID()}`
    const mockToken = `mock_tok_${crypto.randomBytes(8).toString('hex')}`

    return {
      providerTransactionId: mockTxId,
      providerPaymentId: `mock_pay_${input.orderId.slice(0, 8)}`,
      providerToken: mockToken,
      status: 'PENDING',
      clientSecret: `mock_sec_${crypto.randomBytes(16).toString('hex')}`,
      redirectUrl: `/checkout/mock-pay?tx=${mockTxId}`,
      rawResponseScrubbed: {
        mockStatus: 'INITIATED',
        timestamp: new Date().toISOString(),
      },
    }
  }

  async getPaymentStatus(_input: GetPaymentStatusInput): Promise<GetPaymentStatusResult> {
    this.assertAllowedEnvironment()

    return {
      status: 'PAID',
      paidAt: new Date().toISOString(),
    }
  }

  async verifyCallback(input: VerifyPaymentCallbackInput): Promise<VerifiedPaymentEvent> {
    this.assertAllowedEnvironment()

    const authHeader = input.headers['x-mock-signature'] || input.headers['authorization']
    if (authHeader === 'invalid_signature') {
      throw new PaymentError(
        400,
        'PAYMENT_CALLBACK_INVALID',
        'Invalid mock payment callback signature.'
      )
    }

    const payload = input.payload
    const eventId = String(payload['eventId'] || `mock_evt_${crypto.randomUUID()}`)
    const orderId = typeof payload['orderId'] === 'string' ? payload['orderId'] : undefined
    const paymentTxId =
      typeof payload['paymentTransactionId'] === 'string'
        ? payload['paymentTransactionId']
        : undefined
    const status = (
      typeof payload['status'] === 'string' ? payload['status'] : 'PAID'
    ) as import('./types').PaymentIntentStatus

    return {
      provider: 'mock',
      providerEventId: eventId,
      providerTransactionId:
        typeof payload['providerTransactionId'] === 'string'
          ? payload['providerTransactionId']
          : `mock_tx_${eventId}`,
      orderId,
      paymentTransactionId: paymentTxId,
      status,
      occurredAt: new Date().toISOString(),
    }
  }
}

export const mockPaymentProvider = new MockPaymentProvider()
