import {useTranslation} from '../../i18n'
import {useCart} from '../../context/CartContext'

const TransparentShoppingBagIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
)

interface ProductAddToCartProps {
  product: { buyable?: boolean; id: string; [key: string]: unknown }
  mergedGroups: unknown[]
  activeMaterialGroup: number | null
}

export function ProductAddToCart({
  product,
  mergedGroups,
  activeMaterialGroup,
}: ProductAddToCartProps) {
  const {t} = useTranslation()
  const {addToCart} = useCart()

  if (!product.buyable) return null

  const disabled = mergedGroups.length > 0 && activeMaterialGroup === null

  return (
    <div className="pt-6 border-t border-gray-200">
      <button
        onClick={() => (disabled ? alert(t('please_select_price_group')) : addToCart(product as unknown as Parameters<typeof addToCart>[0]))}
        className={`group w-20 h-20 flex items-center justify-center rounded-full transition-all duration-300 transform hover:scale-110 active:scale-100 hover:shadow-lg ${disabled ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
      >
        <TransparentShoppingBagIcon />
      </button>
    </div>
  )
}
