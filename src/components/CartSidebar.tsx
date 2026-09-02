import {useCart} from '../context/CartContext'
import {useTranslation} from '../i18n'
import {useFocusTrap} from '../hooks/useFocusTrap'
import {useNavigate, Link} from 'react-router-dom'

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

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
  const {isCartOpen, toggleCart, cartItems, removeFromCart, updateQuantity, cartTotal} = useCart()
  const {t, locale} = useTranslation()
  const cartFocusTrap = useFocusTrap(isCartOpen, toggleCart)
  const navigate = useNavigate()

  const handleCheckout = () => {
    toggleCart()
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
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('cart') || 'Sepet'}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {t('cart') || 'Sepet'}
            </h2>
            <button
              onClick={toggleCart}
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]"
              aria-label={t('close_cart') || 'Sepeti kapat'}
            >
              <CloseIcon />
            </button>
          </div>

          {cartItems.length > 0 ? (
            <>
              <div className="flex-grow overflow-y-auto p-6 space-y-4">
                {cartItems.map(item => (
                  <div key={item.product.id} className="flex items-start gap-4">
                    <img
                      src={
                        typeof item.product.mainImage === 'string'
                          ? item.product.mainImage
                          : item.product.mainImage?.url || ''
                      }
                      alt={t(item.product.name)}
                      className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="flex-grow">
                      <Link
                        to={`/product/${item.product.id}`}
                        onClick={toggleCart}
                        className="font-semibold text-gray-800 dark:text-gray-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]"
                      >
                        {t(item.product.name)}
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Intl.NumberFormat(locale, {
                          style: 'currency',
                          currency: item.product.currency || 'TRY',
                        }).format(item.product.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]"
                        >
                          <MinusIcon />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]"
                        >
                          <PlusIcon />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-gray-400 hover:text-red-500 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center font-semibold text-lg text-gray-800 dark:text-gray-100">
                  <span>{t('subtotal') || 'Ara Toplam'}</span>
                  <span>
                    {new Intl.NumberFormat(locale, {style: 'currency', currency: 'TRY'}).format(
                      cartTotal
                    )}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('shipping_taxes_calculated') ||
                    'Kargo ve teslimat detayları teklif sürecinde netleştirilir.'}
                </p>
                <button
                  onClick={handleCheckout}
                  className="w-full mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-3 rounded-none hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]"
                >
                  {t('request_quote') || 'Teklif Talebi Oluştur'}
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
                className="mt-4 text-gray-800 dark:text-gray-200 font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]"
              >
                {t('continue_shopping') || 'Ürünleri İncele'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
