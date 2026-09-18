import type {CartItemInput, ValidatedCartItem} from './types.js'

export type CustomerType = 'INDIVIDUAL' | 'CORPORATE'

export interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface Address {
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  district: string
  postalCode: string
  country: string
  phone?: string | null
}

export interface CorporateBillingInfo {
  companyName: string
  taxOffice: string
  taxNumber: string
}

export interface CheckoutPayload {
  customerType: CustomerType
  customer: CustomerInfo
  shippingAddress: Address
  billingAddress: Address
  billingSameAsShipping: boolean
  corporateBilling?: CorporateBillingInfo | null
}

export interface CheckoutValidateRequest {
  items: CartItemInput[]
  checkout: CheckoutPayload
}

export interface CheckoutValidationResult {
  valid: true
  currency: string
  customer: {
    customerType: CustomerType
  }
  items: ValidatedCartItem[]
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  grandTotal: number
}
