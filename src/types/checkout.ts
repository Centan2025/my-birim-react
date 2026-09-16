import type {
  CustomerType,
  CustomerInfo,
  Address,
  CorporateBillingInfo,
  CheckoutPayload,
  CheckoutValidationResult,
} from '../../lib/commerce/checkout-types'
import type {OrderResult} from '../../lib/commerce/order-types'
import type {PaymentIntent} from '../../lib/commerce/payment/types'
import type {CommerceCartError} from './commerceCart'

export type {
  CustomerType,
  CustomerInfo,
  Address,
  CorporateBillingInfo,
  CheckoutPayload,
  CheckoutValidationResult,
  OrderResult,
  PaymentIntent,
}

export type CheckoutStep =
  | 'CART_REVIEW'
  | 'CUSTOMER_INFO'
  | 'SHIPPING_BILLING'
  | 'ORDER_SUMMARY'
  | 'PAYMENT'
  | 'RESULT'

export type PaymentExecutionState =
  | 'IDLE'
  | 'INITIATING'
  | 'PROCESSING'
  | 'VERIFYING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'

export interface CheckoutFormState {
  customerType: CustomerType
  customer: CustomerInfo
  shippingAddress: Address
  billingAddress: Address
  billingSameAsShipping: boolean
  corporateBilling: CorporateBillingInfo
}

export interface CheckoutContextValue {
  currentStep: CheckoutStep
  setCurrentStep: (step: CheckoutStep) => void
  form: CheckoutFormState
  isValidating: boolean
  isCreatingOrder: boolean
  validationError: CommerceCartError | null
  checkoutSummary: CheckoutValidationResult | null
  createdOrder: OrderResult | null
  guestToken: string | null
  paymentState: PaymentExecutionState
  paymentIntent: PaymentIntent | null
  paymentError: CommerceCartError | null
  setCustomerType: (type: CustomerType) => void
  updateCustomer: (fields: Partial<CustomerInfo>) => void
  updateShippingAddress: (fields: Partial<Address>) => void
  updateBillingAddress: (fields: Partial<Address>) => void
  updateCorporateBilling: (fields: Partial<CorporateBillingInfo>) => void
  setBillingSameAsShipping: (same: boolean) => void
  submitCheckoutValidation: () => Promise<CheckoutValidationResult | null>
  createOrder: (options?: {notes?: string}) => Promise<OrderResult | null>
  startPayment: () => Promise<PaymentIntent | null>
  simulateMockPayment: (
    status: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PROCESSING'
  ) => Promise<boolean>
  retryPayment: () => Promise<void>
  cancelPayment: () => Promise<void>
  resetCheckout: () => void
}
