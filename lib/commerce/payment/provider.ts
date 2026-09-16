import type {
  PaymentProviderId,
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  GetPaymentStatusInput,
  GetPaymentStatusResult,
  VerifyPaymentCallbackInput,
  VerifiedPaymentEvent,
} from './types'

/**
 * Provider-Neutral Payment Provider Interface.
 * Concrete adapters (e.g. Mock, iyzico, PayTR, Stripe) implement this interface.
 */
export interface PaymentProvider {
  readonly id: PaymentProviderId

  /**
   * Initializes a payment intent / checkout session on provider.
   */
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult>

  /**
   * Fetches latest payment status from provider.
   */
  getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusResult>

  /**
   * Verifies callback / webhook signature and normalizes into VerifiedPaymentEvent.
   */
  verifyCallback(input: VerifyPaymentCallbackInput): Promise<VerifiedPaymentEvent>
}
