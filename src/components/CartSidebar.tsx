import {useCart} from '../context/CartContext'
import {useTranslation} from '../i18n'
import {useFocusTrap} from '../hooks/useFocusTrap'
import {Link} from 'react-router-dom'

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
  const {isCartOpen, toggleCart, cartItems, removeFromCart, updateQuantity, cartTotal, clearCart} =
    useCart()
  const {t, locale} = useTranslation()
  const cartFocusTrap = useFocusTrap(isCartOpen)

  const handleCheckout = () => {
    alert('Thank you for your order!')
    clearCart()
    toggleCart()
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleCart}
      ></div>
      <div
        ref={cartFocusTrap as React.RefObject<HTMLDivElement>}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('cart') || 'Sepet'}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Your Cart</h2>
            <button onClick={toggleCart} className="text-gray-500 hover:text-gray-800">
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
                        className="font-semibold text-gray-800 hover:underline"
                      >
                        {t(item.product.name)}
                      </Link>
                      <p className="text-sm text-gray-600">
                        {new Intl.NumberFormat(locale, {
                          style: 'currency',
                          currency: item.product.currency || 'TRY',
                        }).format(item.product.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 border rounded-md hover:bg-gray-100"
                        >
                          <MinusIcon />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 border rounded-md hover:bg-gray-100"
                        >
                          <PlusIcon />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-gray-400 hover:text-red-500 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t">
                <div className="flex justify-between items-center font-semibold text-lg text-gray-800">
                  <span>Subtotal</span>
                  <span>
                    {new Intl.NumberFormat(locale, {style: 'currency', currency: 'TRY'}).format(
                      cartTotal
                    )}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Shipping and taxes calculated at checkout.
                </p>
                <button
                  onClick={handleCheckout}
                  className="w-full mt-4 bg-gray-900 text-white font-semibold py-3 rounded-lg hover:bg-gray-700 transition-colors duration-300"
                >
                  Checkout
                </button>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
              <p className="text-gray-600">Your cart is empty.</p>
              <button
                onClick={toggleCart}
                className="mt-4 text-gray-800 font-semibold hover:underline"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
