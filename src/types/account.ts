export interface CustomerProfileData {
  id: string
  email: string
  name: string
  firstName?: string | null
  lastName?: string | null
  company?: string | null
  profession?: string | null
  phone?: string | null
  taxId?: string | null
  role: string
  architectVerificationStatus?: 'none' | 'pending' | 'approved' | 'rejected'
  isVerified?: boolean
  newsletterSubscribed?: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomerAddress {
  id: string
  userId: string
  label: string | null
  recipientName: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  district: string
  postalCode: string | null
  country: string
  isDefaultShipping: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomerBillingProfile {
  id: string
  userId: string
  billingType: 'individual' | 'company'
  label: string | null
  fullName: string | null
  companyName: string | null
  taxOffice: string | null
  taxNumber: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  district: string
  postalCode: string | null
  country: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface OrderItemSnapshot {
  productId: string
  variantId?: string | null
  productName: string
  productNameSnapshot?: string
  sku: string
  skuSnapshot?: string
  selectedOptions?: Record<string, string> | null
  selectedOptionsSnapshot?: Record<string, string> | null
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface OrderAddressSnapshot {
  firstName: string
  lastName: string
  phone?: string | null
  addressLine1: string
  addressLine2?: string | null
  city: string
  district: string
  postalCode?: string | null
  country: string
}

export interface OrderCorporateBillingSnapshot {
  companyName: string
  taxOffice: string
  taxNumber: string
}

export interface OrderDetailResult {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  currency: string
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  grandTotal: number
  items: OrderItemSnapshot[]
  shippingAddressSnapshot?: OrderAddressSnapshot | null
  billingAddressSnapshot?: OrderAddressSnapshot | null
  corporateBillingSnapshot?: OrderCorporateBillingSnapshot | null
  createdAt: string
  updatedAt?: string
}

export interface CustomerOrderSummary {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  currency: string
  subtotal: number
  discountTotal: number
  shippingTotal: number
  taxTotal: number
  grandTotal: number
  itemsCount: number
  firstItemNameSnapshot?: string | null
  firstItemSkuSnapshot?: string | null
  createdAt: string
}
