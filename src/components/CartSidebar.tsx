import React, {useState} from 'react'
import {useCart} from '../context/CartContext'
import {useTranslation} from '../i18n'
import {useFocusTrap} from '../hooks/useFocusTrap'
import {useBodyScrollLock} from '../hooks/useBodyScrollLock'
import {useNavigate, Link} from 'react-router-dom'
import {formatCurrency} from '../utils/currency'
import {LegalAgreementModal, LegalDocType} from './LegalAgreementModal'

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
)

const MinusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
)

export function CartSidebar() {
  const {cartItems, removeFromCart, updateQuantity, isCartOpen, toggleCart, cartTotal} = useCart()
  const {t, locale} = useTranslation()
  const navigate = useNavigate()
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [termsError, setTermsError] = useState(false)
  const [legalModalDoc, setLegalModalDoc] = useState<LegalDocType | null>(null)

  useBodyScrollLock(isCartOpen)

  const cartFocusTrap = useFocusTrap(isCartOpen, toggleCart)

  const hasBuyableItems = cartItems.some(item => (item.product.price || 0) > 0)

  const handleCheckout = () => {
    if (!agreedToTerms) {
      setTermsError(true)
      return
    }

    setTermsError(false)
    toggleCart()
    if (hasBuyableItems) {
      navigate('/checkout')
      return
    }

    const summary = cartItems
      .map(
        item =>
          `${typeof item.product.name === 'string' ? item.product.name : t(item.product.name)} (x${item.quantity})`
      )
      .join(', ')
    try {
      sessionStorage.setItem('birim_cart_quote', summary)
    } catch {
      // ignore
    }
    navigate('/contact?source=cart')
  }

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleCart}
        aria-label={t('close_cart') || 'Sepeti kapat'}
      />
      <div
        ref={cartFocusTrap as React.RefObject<HTMLDivElement>}
        data-lenis-prevent
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('cart') || 'Sepet'}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {t('cart') || 'Sepet'}
              </h2>
            </div>
            <button
              type="button"
              onClick={toggleCart}
              className="p-1.5 text-neutral-500 hover:text-[var(--text-primary)] dark:text-neutral-400 dark:hover:text-white transition-all duration-300 ease-out hover:rotate-90 hover:scale-110 active:scale-95 cursor-pointer -mr-1"
              aria-label={t('close_cart') || 'Sepeti kapat'}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {cartItems.length > 0 ? (
            <>
              <div
                data-lenis-prevent
                onWheel={e => e.stopPropagation()}
                className="flex-grow overflow-y-auto p-6 space-y-4 overscroll-contain"
              >
                {cartItems.map(item => (
                  <div key={item.product.id} className="flex items-start gap-4">
                    <img
                      src={
                        typeof item.product.mainImage === 'string'
                          ? item.product.mainImage
                          : item.product.mainImage?.url || ''
                      }
                      alt={
                        typeof item.product.name === 'string'
                          ? item.product.name
                          : t(item.product.name)
                      }
                      className="w-20 h-20 object-cover rounded-md flex-shrink-0 bg-neutral-100 dark:bg-neutral-800"
                    />
                    <div className="flex-grow">
                      <Link
                        to={`/product/${item.product.id}`}
                        onClick={toggleCart}
                        className="font-semibold text-gray-800 dark:text-gray-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                      >
                        {typeof item.product.name === 'string'
                          ? item.product.name
                          : t(item.product.name)}
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(
                          item.product.price || 0,
                          item.product.currency || 'TRY',
                          locale
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                          aria-label={t('decrease_quantity') || 'Miktarı azalt'}
                        >
                          <MinusIcon />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                          aria-label={t('increase_quantity') || 'Miktarı artır'}
                        >
                          <PlusIcon />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                      aria-label={`${t('remove_item') || 'Ürünü kaldır'}: ${typeof item.product.name === 'string' ? item.product.name : t(item.product.name)}`}
                      title={t('remove_item') || 'Sepetten çıkar'}
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center font-semibold text-lg text-gray-800 dark:text-gray-100">
                  <span>{t('subtotal') || 'Ara Toplam'}</span>
                  <span>{formatCurrency(cartTotal, 'TRY', locale)}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('shipping_taxes_calculated') ||
                    'Kargo ve teslimat detayları teklif sürecinde netleştirilir.'}
                </p>

                {/* E-Ticaret Yasal Onay Alanı (Ön Bilgilendirme, Mesafeli Satış & KVKK) */}
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-600 dark:text-gray-400 select-none">
                    <input
                      id="cart-terms-agreement"
                      name="termsAgreement"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={e => {
                        setAgreedToTerms(e.target.checked)
                        if (e.target.checked) setTermsError(false)
                      }}
                      className="mt-0.5 rounded border-gray-300 dark:border-gray-700 text-gray-900 focus:ring-gray-500 cursor-pointer"
                    />
                    <span className="leading-snug">
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          setLegalModalDoc('preliminary')
                        }}
                        className="underline text-gray-900 dark:text-gray-200 hover:text-black dark:hover:text-white font-medium"
                      >
                        {locale === 'en'
                          ? 'Preliminary Information Form'
                          : 'Ön Bilgilendirme Formu'}
                      </button>
                      {', '}
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          setLegalModalDoc('distance_sales')
                        }}
                        className="underline text-gray-900 dark:text-gray-200 hover:text-black dark:hover:text-white font-medium"
                      >
                        {locale === 'en' ? 'Distance Sales Agreement' : 'Mesafeli Satış Sözleşmesi'}
                      </button>{' '}
                      {locale === 'en' ? 'and' : 've'}{' '}
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          setLegalModalDoc('kvkk')
                        }}
                        className="underline text-gray-900 dark:text-gray-200 hover:text-black dark:hover:text-white font-medium"
                      >
                        {locale === 'en' ? 'Clarification Text (KVKK)' : 'Aydınlatma Metni'}
                      </button>
                      {locale === 'en' ? ' I have read and agree.' : "'ni okudum, kabul ediyorum."}
                    </span>
                  </label>
                  {termsError && (
                    <p className="text-red-500 text-[11px] mt-1.5 font-medium">
                      {locale === 'en'
                        ? 'Please review and accept the preliminary information and distance sales terms to proceed.'
                        : 'Lütfen devam etmek için Ön Bilgilendirme ve Mesafeli Satış koşullarını onaylayınız.'}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-3 rounded-none hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                >
                  {hasBuyableItems
                    ? locale === 'en'
                      ? 'Proceed to Checkout'
                      : 'Satın Al / Ödemeye Geç'
                    : t('request_quote') || 'Teklif Talebi Oluştur'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {t('cart_empty') || 'Sepetiniz henüz boş.'}
              </p>
              <button
                onClick={toggleCart}
                className="mt-4 text-gray-800 dark:text-gray-200 font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              >
                {t('continue_shopping') || 'Ürünleri İncele'}
              </button>
            </div>
          )}
        </div>
      </div>

      <LegalAgreementModal
        isOpen={Boolean(legalModalDoc)}
        initialDoc={legalModalDoc || 'preliminary'}
        onClose={() => setLegalModalDoc(null)}
      />
    </>
  )
}
