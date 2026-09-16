import React, {useState, useEffect} from 'react'
import {Link} from 'react-router-dom'
import {Helmet} from 'react-helmet-async'
import {useCommerceCart} from '../hooks/useCommerceCart'
import {CheckoutProvider, useCheckout} from '../hooks/useCheckout'
import {useSEO} from '../hooks/useSEO'
import {useTranslation} from '../i18n'
import {formatCurrency} from '../utils/currency'
import type {CheckoutStep} from '../types/checkout'

function formatPrice(amount: number, currency: string = 'TRY'): string {
  return formatCurrency(amount, currency, 'tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

const STEPS: {id: CheckoutStep; label: string; number: number}[] = [
  {id: 'CART_REVIEW', label: 'Sepet', number: 1},
  {id: 'CUSTOMER_INFO', label: 'İletişim', number: 2},
  {id: 'SHIPPING_BILLING', label: 'Adres', number: 3},
  {id: 'ORDER_SUMMARY', label: 'Onay', number: 4},
  {id: 'PAYMENT', label: 'Ödeme', number: 5},
  {id: 'RESULT', label: 'Sonuç', number: 6},
]

const CheckoutInner: React.FC = () => {
  const {t} = useTranslation()
  const {items, validatedCart} = useCommerceCart()
  const {
    currentStep,
    setCurrentStep,
    form,
    isValidating,
    isCreatingOrder,
    validationError,
    checkoutSummary,
    createdOrder,
    paymentState,
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
  } = useCheckout()

  const [orderNotes, setOrderNotes] = useState<string>('')
  const [localStepError, setLocalStepError] = useState<string | null>(null)

  // Clear local step error when navigating steps
  useEffect(() => {
    setLocalStepError(null)
  }, [currentStep])

  // 1. Result View (Step 6)
  if (currentStep === 'RESULT' || (createdOrder && createdOrder.paymentStatus === 'PAID')) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
        <div className="w-16 h-16 bg-neutral-900 text-white rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">Ödeme Başarılı</p>
        <h1 className="font-serif text-3xl md:text-4xl text-neutral-900 tracking-tight mb-4">
          Siparişiniz Alındı
        </h1>
        <p className="text-neutral-600 text-sm md:text-base max-w-lg mx-auto mb-8">
          Siparişiniz ve ödemeniz başarıyla kaydedilmiştir. Sipariş detaylarınızı aşağıda
          inceleyebilirsiniz.
        </p>

        <div className="bg-neutral-50 border border-neutral-200 p-6 md:p-8 text-left space-y-4 mb-10 max-w-lg mx-auto">
          <div className="flex justify-between text-sm py-1 border-b border-neutral-200">
            <span className="text-neutral-500">Sipariş Numarası</span>
            <span className="font-mono font-medium text-neutral-900">
              {createdOrder?.orderNumber}
            </span>
          </div>
          <div className="flex justify-between text-sm py-1 border-b border-neutral-200">
            <span className="text-neutral-500">Sipariş Durumu</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              {createdOrder?.status || 'PAID'}
            </span>
          </div>
          <div className="flex justify-between text-sm py-1 border-b border-neutral-200">
            <span className="text-neutral-500">Ödeme Durumu</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              {createdOrder?.paymentStatus || 'PAID'}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold py-1 pt-2">
            <span className="text-neutral-900">Toplam Tutar</span>
            <span className="text-neutral-900">
              {createdOrder ? formatPrice(createdOrder.grandTotal, createdOrder.currency) : '-'}
            </span>
          </div>
        </div>

        <div>
          <Link
            to="/products"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-neutral-900 text-white text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
          >
            {t('common.viewProducts') || 'Ürünleri İncele'}
          </Link>
        </div>
      </div>
    )
  }

  // 2. Empty Cart View (only if no order in progress)
  if (items.length === 0 && currentStep !== 'PAYMENT') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-serif text-3xl md:text-4xl text-neutral-900 tracking-tight mb-4">
          Sepetiniz Boş
        </h1>
        <p className="text-neutral-500 max-w-md text-sm md:text-base leading-relaxed mb-8">
          Sipariş oluşturmak için sepetinizde en az bir adet satın alınabilir ürün bulunmalıdır.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center justify-center px-8 py-3.5 bg-neutral-900 text-white text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
        >
          {t('common.viewProducts') || 'Ürünleri İncele'}
        </Link>
      </div>
    )
  }

  // Step 2 validation helper
  const handleProceedFromCustomerInfo = () => {
    if (
      !form.customer.firstName.trim() ||
      !form.customer.lastName.trim() ||
      !form.customer.email.trim() ||
      !form.customer.phone.trim()
    ) {
      setLocalStepError('Lütfen tüm zorunlu müşteri bilgilerini doldurunuz.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.customer.email.trim())) {
      setLocalStepError('Lütfen geçerli bir e-posta adresi giriniz.')
      return
    }
    setLocalStepError(null)
    setCurrentStep('SHIPPING_BILLING')
  }

  // Step 3 validation helper
  const handleProceedFromShippingBilling = () => {
    const s = form.shippingAddress
    if (
      !s.firstName.trim() ||
      !s.lastName.trim() ||
      !s.addressLine1.trim() ||
      !s.city.trim() ||
      !s.district.trim() ||
      !s.postalCode.trim()
    ) {
      setLocalStepError('Lütfen tüm zorunlu teslimat adresi alanlarını doldurunuz.')
      return
    }

    if (form.customerType === 'CORPORATE') {
      const c = form.corporateBilling
      if (!c.companyName.trim() || !c.taxOffice.trim() || !c.taxNumber.trim()) {
        setLocalStepError('Lütfen kurumsal fatura bilgilerini eksiksiz doldurunuz.')
        return
      }
    }

    if (!form.billingSameAsShipping) {
      const b = form.billingAddress
      if (
        !b.firstName.trim() ||
        !b.lastName.trim() ||
        !b.addressLine1.trim() ||
        !b.city.trim() ||
        !b.district.trim() ||
        !b.postalCode.trim()
      ) {
        setLocalStepError('Lütfen tüm zorunlu fatura adresi alanlarını doldurunuz.')
        return
      }
    }

    setLocalStepError(null)
    setCurrentStep('ORDER_SUMMARY')
  }

  // Step 4: Submit Order Creation
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalStepError(null)

    const valid = await submitCheckoutValidation()
    if (valid) {
      await createOrder({notes: orderNotes})
    }
  }

  // Display calculations
  const displayItems = checkoutSummary?.items || validatedCart?.items || []
  const subtotal = checkoutSummary?.subtotal ?? validatedCart?.subtotal ?? 0
  const grandTotal =
    createdOrder?.grandTotal ?? checkoutSummary?.grandTotal ?? validatedCart?.grandTotal ?? 0
  const currency =
    createdOrder?.currency || checkoutSummary?.currency || validatedCart?.currency || 'TRY'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      {/* Header & Step Indicator */}
      <div className="mb-10 md:mb-12">
        <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">Commerce Checkout</p>
        <h1 className="font-serif text-3xl md:text-5xl text-neutral-900 tracking-tight mb-8">
          Sipariş Tamamlama
        </h1>

        {/* Step Progress Bar */}
        <nav aria-label="Sipariş Aşamaları" className="border-y border-neutral-200 py-4">
          <ol className="flex items-center justify-between max-w-2xl text-xs">
            {STEPS.map((s, idx) => {
              const isCurrent = currentStep === s.id
              const isPast = STEPS.findIndex(step => step.id === currentStep) > idx
              return (
                <li key={s.id} className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-medium ${
                      isCurrent
                        ? 'bg-neutral-900 text-white'
                        : isPast
                          ? 'bg-neutral-300 text-neutral-800'
                          : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                    }`}
                  >
                    {s.number}
                  </span>
                  <span
                    className={`hidden sm:inline font-medium uppercase tracking-wider text-[11px] ${
                      isCurrent
                        ? 'text-neutral-900'
                        : isPast
                          ? 'text-neutral-600'
                          : 'text-neutral-400'
                    }`}
                  >
                    {s.label}
                  </span>
                  {idx < STEPS.length - 1 && (
                    <span className="text-neutral-300 mx-1 sm:mx-2">/</span>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left Interactive Column (7 cols) */}
        <div className="lg:col-span-7">
          {localStepError && (
            <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm">
              {localStepError}
            </div>
          )}

          {validationError && (
            <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm">
              <p className="font-semibold mb-1">Hata</p>
              <p>{validationError.message}</p>
            </div>
          )}

          {/* STEP 1: Cart Review */}
          {currentStep === 'CART_REVIEW' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 mb-6">
                  1. Sepet Özeti
                </h2>
                <div className="divide-y divide-neutral-200 border-y border-neutral-200">
                  {items.map((item, idx) => (
                    <div
                      key={`${item.productId}-${item.variantId || 'base'}-${idx}`}
                      className="py-4 flex justify-between"
                    >
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">
                          Ürün ID: {item.productId}
                        </p>
                        {item.variantId && (
                          <p className="text-xs text-neutral-500">Varyant: {item.variantId}</p>
                        )}
                        <p className="text-xs text-neutral-400 mt-1">Adet: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep('CUSTOMER_INFO')}
                  className="px-8 py-3.5 bg-neutral-900 text-white text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                >
                  Müşteri Bilgilerine Geç
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Customer Info */}
          {currentStep === 'CUSTOMER_INFO' && (
            <div className="space-y-8">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 mb-6">
                2. Müşteri Bilgileri
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="c-firstName"
                    className="block text-xs uppercase tracking-wider text-neutral-600 mb-2"
                  >
                    Ad *
                  </label>
                  <input
                    id="c-firstName"
                    type="text"
                    required
                    value={form.customer.firstName}
                    onChange={e => updateCustomer({firstName: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900"
                    placeholder="Adınız"
                  />
                </div>
                <div>
                  <label
                    htmlFor="c-lastName"
                    className="block text-xs uppercase tracking-wider text-neutral-600 mb-2"
                  >
                    Soyad *
                  </label>
                  <input
                    id="c-lastName"
                    type="text"
                    required
                    value={form.customer.lastName}
                    onChange={e => updateCustomer({lastName: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900"
                    placeholder="Soyadınız"
                  />
                </div>
                <div>
                  <label
                    htmlFor="c-email"
                    className="block text-xs uppercase tracking-wider text-neutral-600 mb-2"
                  >
                    E-posta *
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    required
                    value={form.customer.email}
                    onChange={e => updateCustomer({email: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900"
                    placeholder="ornek@alanadi.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="c-phone"
                    className="block text-xs uppercase tracking-wider text-neutral-600 mb-2"
                  >
                    Telefon *
                  </label>
                  <input
                    id="c-phone"
                    type="tel"
                    required
                    value={form.customer.phone}
                    onChange={e => updateCustomer({phone: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900"
                    placeholder="+90 5xx xxx xx xx"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep('CART_REVIEW')}
                  className="px-6 py-3 border border-neutral-300 text-neutral-700 text-xs uppercase tracking-widest hover:bg-neutral-100 transition-colors"
                >
                  Geri
                </button>
                <button
                  type="button"
                  onClick={handleProceedFromCustomerInfo}
                  className="px-8 py-3.5 bg-neutral-900 text-white text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                >
                  Adres Bilgilerine Geç
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Shipping & Billing */}
          {currentStep === 'SHIPPING_BILLING' && (
            <div className="space-y-8">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 mb-6">
                3. Teslimat & Fatura Adresi
              </h2>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="s-firstName"
                      className="block text-xs uppercase tracking-wider text-neutral-600 mb-2"
                    >
                      Alıcı Adı *
                    </label>
                    <input
                      id="s-firstName"
                      type="text"
                      required
                      value={form.shippingAddress.firstName}
                      onChange={e => updateShippingAddress({firstName: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="s-lastName"
                      className="block text-xs uppercase tracking-wider text-neutral-600 mb-2"
                    >
                      Alıcı Soyadı *
                    </label>
                    <input
                      id="s-lastName"
                      type="text"
                      required
                      value={form.shippingAddress.lastName}
                      onChange={e => updateShippingAddress({lastName: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="s-address1"
                    className="block text-xs uppercase tracking-wider text-neutral-600 mb-2"
                  >
                    Adres Satırı 1 *
                  </label>
                  <input
                    id="s-address1"
                    type="text"
                    required
                    value={form.shippingAddress.addressLine1}
                    onChange={e => updateShippingAddress({addressLine1: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900"
                    placeholder="Cadde, sokak, no"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label
                      htmlFor="s-city"
                      className="block text-xs uppercase tracking-wider text-neutral-600 mb-2"
                    >
                      İl *
                    </label>
                    <input
                      id="s-city"
                      type="text"
                      required
                      value={form.shippingAddress.city}
                      onChange={e => updateShippingAddress({city: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="s-district"
                      className="block text-xs uppercase tracking-wider text-neutral-600 mb-2"
                    >
                      İlçe *
                    </label>
                    <input
                      id="s-district"
                      type="text"
                      required
                      value={form.shippingAddress.district}
                      onChange={e => updateShippingAddress({district: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="s-postal"
                      className="block text-xs uppercase tracking-wider text-neutral-600 mb-2"
                    >
                      Posta Kodu *
                    </label>
                    <input
                      id="s-postal"
                      type="text"
                      required
                      value={form.shippingAddress.postalCode}
                      onChange={e => updateShippingAddress({postalCode: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                {/* Fatura Türü */}
                <div className="pt-6 border-t border-neutral-200">
                  <div className="flex gap-6 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="customerType"
                        value="INDIVIDUAL"
                        checked={form.customerType === 'INDIVIDUAL'}
                        onChange={() => setCustomerType('INDIVIDUAL')}
                        className="accent-neutral-900"
                      />
                      <span>Bireysel Fatura</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="customerType"
                        value="CORPORATE"
                        checked={form.customerType === 'CORPORATE'}
                        onChange={() => setCustomerType('CORPORATE')}
                        className="accent-neutral-900"
                      />
                      <span>Kurumsal Fatura</span>
                    </label>
                  </div>

                  {form.customerType === 'CORPORATE' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 p-4 bg-neutral-50 border border-neutral-200 mb-4">
                      <div>
                        <label
                          htmlFor="c-company"
                          className="block text-xs uppercase text-neutral-600 mb-1"
                        >
                          Şirket Unvanı *
                        </label>
                        <input
                          id="c-company"
                          type="text"
                          required
                          value={form.corporateBilling.companyName}
                          onChange={e => updateCorporateBilling({companyName: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-neutral-200 text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="c-taxOffice"
                          className="block text-xs uppercase text-neutral-600 mb-1"
                        >
                          Vergi Dairesi *
                        </label>
                        <input
                          id="c-taxOffice"
                          type="text"
                          required
                          value={form.corporateBilling.taxOffice}
                          onChange={e => updateCorporateBilling({taxOffice: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-neutral-200 text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="c-taxNum"
                          className="block text-xs uppercase text-neutral-600 mb-1"
                        >
                          Vergi No *
                        </label>
                        <input
                          id="c-taxNum"
                          type="text"
                          required
                          value={form.corporateBilling.taxNumber}
                          onChange={e => updateCorporateBilling({taxNumber: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-neutral-200 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={form.billingSameAsShipping}
                      onChange={e => setBillingSameAsShipping(e.target.checked)}
                      className="accent-neutral-900 rounded"
                    />
                    <span>Fatura adresim teslimat adresim ile aynı</span>
                  </label>

                  {!form.billingSameAsShipping && (
                    <div className="space-y-4 pt-4 mt-4 border-t border-neutral-200">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                        Fatura Adresi
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="b-firstName"
                            className="block text-xs uppercase text-neutral-600 mb-1"
                          >
                            Fatura Adı *
                          </label>
                          <input
                            id="b-firstName"
                            type="text"
                            required
                            value={form.billingAddress.firstName}
                            onChange={e => updateBillingAddress({firstName: e.target.value})}
                            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 text-sm"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="b-lastName"
                            className="block text-xs uppercase text-neutral-600 mb-1"
                          >
                            Fatura Soyadı *
                          </label>
                          <input
                            id="b-lastName"
                            type="text"
                            required
                            value={form.billingAddress.lastName}
                            onChange={e => updateBillingAddress({lastName: e.target.value})}
                            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="b-addressLine1"
                          className="block text-xs uppercase text-neutral-600 mb-1"
                        >
                          Fatura Adresi *
                        </label>
                        <input
                          id="b-addressLine1"
                          type="text"
                          required
                          value={form.billingAddress.addressLine1}
                          onChange={e => updateBillingAddress({addressLine1: e.target.value})}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label
                            htmlFor="b-city"
                            className="block text-xs uppercase text-neutral-600 mb-1"
                          >
                            İl *
                          </label>
                          <input
                            id="b-city"
                            type="text"
                            required
                            value={form.billingAddress.city}
                            onChange={e => updateBillingAddress({city: e.target.value})}
                            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 text-sm"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="b-district"
                            className="block text-xs uppercase text-neutral-600 mb-1"
                          >
                            İlçe *
                          </label>
                          <input
                            id="b-district"
                            type="text"
                            required
                            value={form.billingAddress.district}
                            onChange={e => updateBillingAddress({district: e.target.value})}
                            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 text-sm"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="b-postalCode"
                            className="block text-xs uppercase text-neutral-600 mb-1"
                          >
                            Posta Kodu *
                          </label>
                          <input
                            id="b-postalCode"
                            type="text"
                            required
                            value={form.billingAddress.postalCode}
                            onChange={e => updateBillingAddress({postalCode: e.target.value})}
                            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep('CUSTOMER_INFO')}
                  className="px-6 py-3 border border-neutral-300 text-neutral-700 text-xs uppercase tracking-widest hover:bg-neutral-100 transition-colors"
                >
                  Geri
                </button>
                <button
                  type="button"
                  onClick={handleProceedFromShippingBilling}
                  className="px-8 py-3.5 bg-neutral-900 text-white text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                >
                  Sipariş Özetine Geç
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Order Summary & Place Order */}
          {currentStep === 'ORDER_SUMMARY' && (
            <form onSubmit={handleCreateOrder} className="space-y-8">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 mb-6">
                4. Sipariş Onayı
              </h2>

              <div className="bg-neutral-50 border border-neutral-200 p-6 space-y-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wider text-neutral-400 mb-1">Müşteri</p>
                  <p className="font-medium text-neutral-900">
                    {form.customer.firstName} {form.customer.lastName} ({form.customer.email})
                  </p>
                  <p className="text-neutral-500 text-xs">{form.customer.phone}</p>
                </div>
                <div className="pt-3 border-t border-neutral-200">
                  <p className="text-xs uppercase tracking-wider text-neutral-400 mb-1">
                    Teslimat Adresi
                  </p>
                  <p className="text-neutral-800">
                    {form.shippingAddress.addressLine1}, {form.shippingAddress.district}/
                    {form.shippingAddress.city}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="order-notes"
                  className="block text-xs uppercase tracking-wider text-neutral-600 mb-2"
                >
                  Sipariş Notu (Opsiyonel)
                </label>
                <textarea
                  id="order-notes"
                  rows={2}
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900"
                  placeholder="Teslimatla ilgili özel notlarınız..."
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep('SHIPPING_BILLING')}
                  className="px-6 py-3 border border-neutral-300 text-neutral-700 text-xs uppercase tracking-widest hover:bg-neutral-100 transition-colors"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  disabled={isValidating || isCreatingOrder}
                  className="px-8 py-3.5 bg-neutral-900 text-white text-xs uppercase tracking-widest hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreatingOrder
                    ? 'Sipariş Oluşturuluyor...'
                    : isValidating
                      ? 'Doğrulanıyor...'
                      : 'Siparişi Oluştur ve Ödemeye Geç'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: Payment (Mock in dev, clean status in UI) */}
          {currentStep === 'PAYMENT' && (
            <div className="space-y-8">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 mb-6">
                5. Ödeme
              </h2>

              <div className="bg-neutral-50 border border-neutral-200 p-6 space-y-4">
                <div className="flex justify-between text-sm py-1 border-b border-neutral-200">
                  <span className="text-neutral-500">Sipariş No</span>
                  <span className="font-mono font-medium text-neutral-900">
                    {createdOrder?.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-neutral-200">
                  <span className="text-neutral-500">Sipariş Durumu</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                    {createdOrder?.status || 'PENDING_PAYMENT'}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold py-1">
                  <span className="text-neutral-900">Ödenecek Tutar</span>
                  <span className="text-neutral-900">
                    {createdOrder
                      ? formatPrice(createdOrder.grandTotal, createdOrder.currency)
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Processing / Live Status */}
              <div aria-live="polite" className="space-y-4">
                {paymentState === 'PROCESSING' && (
                  <div className="p-6 bg-neutral-900 text-white text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm font-medium">Ödemeniz işleniyor...</p>
                    <p className="text-xs text-neutral-400">Lütfen bu sayfayı kapatmayın.</p>
                  </div>
                )}

                {paymentState === 'VERIFYING' && (
                  <div className="p-6 bg-neutral-900 text-white text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm font-medium">Ödeme durumu doğrulanıyor...</p>
                    <p className="text-xs text-neutral-400">
                      Sunucu ile bağlantı kontrol ediliyor, lütfen bekleyin.
                    </p>
                  </div>
                )}

                {paymentError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                    <p className="font-semibold mb-1">Ödeme Hatası</p>
                    <p>{paymentError.message}</p>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={retryPayment}
                        className="px-4 py-2 bg-red-700 text-white text-xs uppercase tracking-wider hover:bg-red-800"
                      >
                        Tekrar Dene
                      </button>
                      <button
                        type="button"
                        onClick={cancelPayment}
                        className="px-4 py-2 border border-red-300 text-red-700 text-xs uppercase tracking-wider hover:bg-red-100"
                      >
                        İptal Et
                      </button>
                    </div>
                  </div>
                )}

                {paymentState === 'CANCELLED' && !paymentError && (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    <p>Ödeme işlemi iptal edildi.</p>
                    <button
                      type="button"
                      onClick={retryPayment}
                      className="mt-3 px-4 py-2 bg-amber-800 text-white text-xs uppercase tracking-wider hover:bg-amber-900"
                    >
                      Yeniden Başlat
                    </button>
                  </div>
                )}

                {paymentState === 'IDLE' && (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={startPayment}
                      className="w-full py-4 bg-neutral-900 text-white text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                    >
                      Ödemeyi Başlat
                    </button>
                  </div>
                )}
              </div>

              {/* DEV / TEST ONLY Simulation Sandbox (Strictly Omitted in Production) */}
              {import.meta.env.DEV && (
                <div className="p-5 border border-dashed border-neutral-300 bg-neutral-100/50 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    [Geliştirme / Test Simülasyonu - Prodüksiyonda Görünmez]
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => simulateMockPayment('SUCCESS')}
                      className="px-3 py-2 bg-emerald-800 text-white text-xs hover:bg-emerald-700"
                    >
                      Simüle Et: Başarılı Ödeme (Success)
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateMockPayment('FAILED')}
                      className="px-3 py-2 bg-red-800 text-white text-xs hover:bg-red-700"
                    >
                      Simüle Et: Başarısız Ödeme (Fail)
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateMockPayment('CANCELLED')}
                      className="px-3 py-2 bg-neutral-700 text-white text-xs hover:bg-neutral-600"
                    >
                      Simüle Et: Ödeme İptal (Cancel)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Order Summary Column (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 bg-neutral-50 p-6 md:p-8 border border-neutral-200">
            <h2 className="font-serif text-xl text-neutral-900 mb-6">Sipariş Özeti</h2>

            <div className="divide-y divide-neutral-200 max-h-80 overflow-y-auto pr-1 mb-6">
              {displayItems.map((item, idx) => (
                <div
                  key={`${item.productId}-${item.variantId || 'base'}-${idx}`}
                  className="py-4 first:pt-0"
                >
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-medium text-neutral-900">
                        {item.productName || item.productId}
                      </p>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {item.selectedOptions.map(opt => `${opt.name}: ${opt.value}`).join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-neutral-400 mt-1">Adet: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-neutral-900 ml-4">
                      {formatPrice(item.totalPrice, item.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-4 border-t border-neutral-200 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Ara Toplam</span>
                <span>{formatPrice(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Kargo</span>
                <span className="text-emerald-700 font-medium">Ücretsiz</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-neutral-900 pt-3 border-t border-neutral-200">
                <span>Toplam</span>
                <span>{formatPrice(grandTotal, currency)}</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 mt-6 leading-relaxed">
              Tüm fiyatlara KDV dahildir. Nihai sipariş tutarı ve stok uygunluğu sunucu tarafından
              gerçek zamanlı olarak doğrulanır.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const CommerceCheckoutPage: React.FC = () => {
  useSEO({
    title: 'Sipariş Tamamlama | BİRİM',
  })

  return (
    <CheckoutProvider>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <CheckoutInner />
    </CheckoutProvider>
  )
}

export default CommerceCheckoutPage
