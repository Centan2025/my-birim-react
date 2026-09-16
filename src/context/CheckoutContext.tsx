/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type PropsWithChildren,
} from 'react'
import type {
  CheckoutFormState,
  CheckoutContextValue,
  CheckoutValidationResult,
  CustomerType,
  CustomerInfo,
  Address,
  CorporateBillingInfo,
  OrderResult,
  CheckoutStep,
  PaymentExecutionState,
  PaymentIntent,
} from '../types/checkout'
import type {CommerceCartError} from '../types/commerceCart'
import {useCommerceCart} from '../hooks/useCommerceCart'
import {validateCommerceCheckout} from '../services/commerce/checkout'
import {createCommerceOrderClient, fetchCommerceOrderClient} from '../services/commerce/orders'
import {
  initiateCommercePayment,
  completeMockPaymentClient,
  fetchPaymentStatusClient,
} from '../services/commerce/payments'
import {CommerceCartServiceError} from '../services/commerce/cart'

const initialAddress: Address = {
  firstName: '',
  lastName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  district: '',
  postalCode: '',
  country: 'Türkiye',
  phone: '',
}

const initialFormState: CheckoutFormState = {
  customerType: 'INDIVIDUAL',
  customer: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  },
  shippingAddress: {...initialAddress},
  billingAddress: {...initialAddress},
  billingSameAsShipping: true,
  corporateBilling: {
    companyName: '',
    taxOffice: '',
    taxNumber: '',
  },
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null)

export const useCheckout = () => {
  const context = useContext(CheckoutContext)
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider')
  }
  return context
}

export const CheckoutProvider = ({children}: PropsWithChildren) => {
  const {items, clearCart} = useCommerceCart()

  // Step state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('CART_REVIEW')

  // Strictly Memory-Only state (Zero PII or tokens stored in localStorage)
  const [form, setForm] = useState<CheckoutFormState>(initialFormState)
  const [isValidating, setIsValidating] = useState<boolean>(false)
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false)
  const [validationError, setValidationError] = useState<CommerceCartError | null>(null)
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutValidationResult | null>(null)
  const [createdOrder, setCreatedOrder] = useState<OrderResult | null>(null)
  const [guestToken, setGuestToken] = useState<string | null>(null)

  // Payment execution state (Memory-Only)
  const [paymentState, setPaymentState] = useState<PaymentExecutionState>('IDLE')
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null)
  const [paymentError, setPaymentError] = useState<CommerceCartError | null>(null)

  const setCustomerType = useCallback((type: CustomerType) => {
    setForm(prev => ({...prev, customerType: type}))
    setCheckoutSummary(null)
  }, [])

  const updateCustomer = useCallback((fields: Partial<CustomerInfo>) => {
    setForm(prev => ({
      ...prev,
      customer: {...prev.customer, ...fields},
    }))
    setCheckoutSummary(null)
  }, [])

  const updateShippingAddress = useCallback((fields: Partial<Address>) => {
    setForm(prev => {
      const nextShipping = {...prev.shippingAddress, ...fields}
      return {
        ...prev,
        shippingAddress: nextShipping,
        billingAddress: prev.billingSameAsShipping ? {...nextShipping} : prev.billingAddress,
      }
    })
    setCheckoutSummary(null)
  }, [])

  const updateBillingAddress = useCallback((fields: Partial<Address>) => {
    setForm(prev => ({
      ...prev,
      billingAddress: {...prev.billingAddress, ...fields},
    }))
    setCheckoutSummary(null)
  }, [])

  const updateCorporateBilling = useCallback((fields: Partial<CorporateBillingInfo>) => {
    setForm(prev => ({
      ...prev,
      corporateBilling: {...prev.corporateBilling, ...fields},
    }))
    setCheckoutSummary(null)
  }, [])

  const setBillingSameAsShipping = useCallback((same: boolean) => {
    setForm(prev => ({
      ...prev,
      billingSameAsShipping: same,
      billingAddress: same ? {...prev.shippingAddress} : prev.billingAddress,
    }))
    setCheckoutSummary(null)
  }, [])

  const resetCheckout = useCallback(() => {
    setCurrentStep('CART_REVIEW')
    setForm(initialFormState)
    setValidationError(null)
    setCheckoutSummary(null)
    setCreatedOrder(null)
    setGuestToken(null)
    setPaymentState('IDLE')
    setPaymentIntent(null)
    setPaymentError(null)
    setIsValidating(false)
    setIsCreatingOrder(false)
  }, [])

  const submitCheckoutValidation =
    useCallback(async (): Promise<CheckoutValidationResult | null> => {
      if (items.length === 0) {
        setValidationError({
          code: 'EMPTY_CART',
          message: 'Sepetinizde ürün bulunmamaktadır.',
        })
        setCheckoutSummary(null)
        return null
      }

      setIsValidating(true)
      setValidationError(null)

      try {
        const result = await validateCommerceCheckout(items, form)
        setCheckoutSummary(result)
        setValidationError(null)
        setIsValidating(false)
        return result
      } catch (err: unknown) {
        if (err instanceof CommerceCartServiceError) {
          setValidationError({
            code: err.code,
            message: err.message,
            productId: err.productId,
            variantId: err.variantId,
            statusCode: err.statusCode,
          })
        } else {
          setValidationError({
            code: 'INTERNAL_ERROR',
            message: 'Sipariş doğrulanırken beklenmeyen bir hata oluştu.',
          })
        }
        setCheckoutSummary(null)
        setIsValidating(false)
        return null
      }
    }, [items, form])

  const createOrder = useCallback(
    async (options: {notes?: string} = {}): Promise<OrderResult | null> => {
      if (items.length === 0) {
        setValidationError({
          code: 'EMPTY_CART',
          message: 'Sipariş oluşturmak için sepetinizde ürün bulunmalıdır.',
        })
        return null
      }

      setIsCreatingOrder(true)
      setValidationError(null)

      try {
        const orderResult = await createCommerceOrderClient(items, form, {
          expectedGrandTotal: checkoutSummary?.grandTotal,
          notes: options.notes,
        })
        setCreatedOrder(orderResult)
        if (orderResult.guestToken) {
          setGuestToken(orderResult.guestToken)
        }
        setValidationError(null)
        setIsCreatingOrder(false)
        setCurrentStep('PAYMENT')
        // CRITICAL: Cart is NOT cleared on order creation!
        return orderResult
      } catch (err: unknown) {
        if (err instanceof CommerceCartServiceError) {
          setValidationError({
            code: err.code,
            message: err.message,
            productId: err.productId,
            variantId: err.variantId,
            statusCode: err.statusCode,
          })
        } else {
          setValidationError({
            code: 'INTERNAL_ERROR',
            message: 'Sipariş oluşturulurken beklenmeyen bir hata oluştu.',
          })
        }
        setIsCreatingOrder(false)
        return null
      }
    },
    [items, form, checkoutSummary]
  )

  const startPayment = useCallback(async (): Promise<PaymentIntent | null> => {
    if (!createdOrder) {
      setPaymentError({
        code: 'INVALID_REQUEST',
        message: 'Ödeme başlatmak için geçerli bir sipariş kaydı bulunamadı.',
      })
      return null
    }

    setPaymentState('INITIATING')
    setPaymentError(null)

    try {
      const intent = await initiateCommercePayment(createdOrder.id, {
        guestToken: guestToken || undefined,
      })
      setPaymentIntent(intent)
      setPaymentState('PROCESSING')
      return intent
    } catch (err: unknown) {
      if (err instanceof CommerceCartServiceError) {
        setPaymentError({
          code: err.code,
          message: err.message,
          statusCode: err.statusCode,
        })
      } else {
        setPaymentError({
          code: 'INTERNAL_ERROR',
          message: 'Ödeme başlatılamadı. Lütfen tekrar deneyin.',
        })
      }
      setPaymentState('FAILED')
      return null
    }
  }, [createdOrder, guestToken])

  const simulateMockPayment = useCallback(
    async (status: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PROCESSING'): Promise<boolean> => {
      let targetIntent = paymentIntent
      if (!targetIntent) {
        targetIntent = await startPayment()
        if (!targetIntent) return false
      }

      setPaymentState('PROCESSING')
      setPaymentError(null)

      try {
        const result = await completeMockPaymentClient(targetIntent.id, {
          status,
          orderId: createdOrder?.id,
          guestToken: guestToken || undefined,
        })

        if (result.status === 'PAID') {
          setPaymentState('SUCCESS')
          setCreatedOrder(prev => (prev ? {...prev, status: 'PAID', paymentStatus: 'PAID'} : null))
          // Clear commerce cart ONLY upon confirmed payment success!
          clearCart()
          setCurrentStep('RESULT')
          return true
        } else if (result.status === 'FAILED') {
          setPaymentState('FAILED')
          setPaymentError({
            code: 'PAYMENT_FAILED',
            message: 'Ödeme gerçekleştirilemedi. Lütfen tekrar deneyin.',
          })
          return false
        } else if (result.status === 'CANCELLED') {
          setPaymentState('CANCELLED')
          setPaymentError({
            code: 'PAYMENT_CANCELLED',
            message: 'Ödeme işlemi iptal edildi.',
          })
          return false
        } else {
          setPaymentState('PROCESSING')
          return true
        }
      } catch (err: unknown) {
        // Network Error Recovery: verify authoritative payment/order state before declaring failure
        setPaymentState('VERIFYING')

        if (createdOrder) {
          try {
            const freshOrder = await fetchCommerceOrderClient(createdOrder.id, {
              guestToken: guestToken || undefined,
            })
            if (freshOrder.paymentStatus === 'PAID' || freshOrder.status === 'PAID') {
              setPaymentState('SUCCESS')
              setCreatedOrder(prev =>
                prev ? {...prev, status: 'PAID', paymentStatus: 'PAID'} : null
              )
              clearCart()
              setCurrentStep('RESULT')
              return true
            }
          } catch {
            // Secondary lookup failed, fallback to payment status lookup
            if (targetIntent) {
              try {
                const freshPayment = await fetchPaymentStatusClient(targetIntent.id, {
                  guestToken: guestToken || undefined,
                })
                if (freshPayment.status === 'PAID') {
                  setPaymentState('SUCCESS')
                  setCreatedOrder(prev =>
                    prev ? {...prev, status: 'PAID', paymentStatus: 'PAID'} : null
                  )
                  clearCart()
                  setCurrentStep('RESULT')
                  return true
                }
              } catch {
                // Ignore recovery lookup failure
              }
            }
          }
        }

        if (err instanceof CommerceCartServiceError) {
          setPaymentError({
            code: err.code,
            message: err.message,
            statusCode: err.statusCode,
          })
        } else {
          setPaymentError({
            code: 'INTERNAL_ERROR',
            message:
              'Ödeme işlemi sırasında bir hata oluştu veya yanıt alınamadı. Sepetiniz korunmuştur.',
          })
        }
        setPaymentState('FAILED')
        return false
      }
    },
    [paymentIntent, startPayment, createdOrder, guestToken, clearCart]
  )

  const retryPayment = useCallback(async () => {
    setPaymentError(null)
    setPaymentIntent(null)
    setPaymentState('IDLE')
    await startPayment()
  }, [startPayment])

  const cancelPayment = useCallback(async () => {
    if (paymentIntent) {
      try {
        await completeMockPaymentClient(paymentIntent.id, {
          status: 'CANCELLED',
          orderId: createdOrder?.id,
          guestToken: guestToken || undefined,
        })
      } catch {
        // Ignore cancellation cleanup error
      }
    }
    setPaymentState('CANCELLED')
    setPaymentError({
      code: 'PAYMENT_CANCELLED',
      message: 'Ödeme işlemi iptal edildi.',
    })
  }, [paymentIntent, createdOrder, guestToken])

  const value = useMemo<CheckoutContextValue>(
    () => ({
      currentStep,
      setCurrentStep,
      form,
      isValidating,
      isCreatingOrder,
      validationError,
      checkoutSummary,
      createdOrder,
      guestToken,
      paymentState,
      paymentIntent,
      paymentError,
      setCustomerType,
      updateCustomer,
      updateShippingAddress,
      updateBillingAddress,
      updateCorporateBilling,
      setBillingSameAsShipping,
      submitCheckoutValidation,
      createOrder,
      startPayment,
      simulateMockPayment,
      retryPayment,
      cancelPayment,
      resetCheckout,
    }),
    [
      currentStep,
      setCurrentStep,
      form,
      isValidating,
      isCreatingOrder,
      validationError,
      checkoutSummary,
      createdOrder,
      guestToken,
      paymentState,
      paymentIntent,
      paymentError,
      setCustomerType,
      updateCustomer,
      updateShippingAddress,
      updateBillingAddress,
      updateCorporateBilling,
      setBillingSameAsShipping,
      submitCheckoutValidation,
      createOrder,
      startPayment,
      simulateMockPayment,
      retryPayment,
      cancelPayment,
      resetCheckout,
    ]
  )

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
}
