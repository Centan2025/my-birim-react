import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  PropsWithChildren,
} from 'react'
import type {Product, CartItem} from '../types'
import {analytics} from '../lib/analytics'

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartCount: number
  cartTotal: number
  isCartOpen: boolean
  toggleCart: () => void
  openCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({children}: PropsWithChildren) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('birim_cart')
      if (storedCart) {
        setCartItems(JSON.parse(storedCart))
      }
    } catch (e) {
      localStorage.removeItem('birim_cart')
    }
  }, [])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('birim_cart', JSON.stringify(cartItems))
      }
    } catch {
      // Storage erişilemiyorsa sessizce devam et
    }
  }, [cartItems])

  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), [])
  const openCart = useCallback(() => setIsCartOpen(true), [])

  const addToCart = useCallback((product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id)
      const newQuantity = existingItem ? existingItem.quantity + 1 : 1

      analytics.trackEcommerce('add_to_cart', product.id, product.price)

      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id ? {...item, quantity: newQuantity} : item
        )
      }
      return [...prevItems, {product, quantity: newQuantity}]
    })
    setIsCartOpen(true)
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prevItems => {
      const itemToRemove = prevItems.find(item => item.product.id === productId)
      if (itemToRemove) {
        analytics.trackEcommerce(
          'remove_from_cart',
          itemToRemove.product.id,
          itemToRemove.product.price
        )
      }
      return prevItems.filter(item => item.product.id !== productId)
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems(prevItems => {
      if (quantity <= 0) {
        const itemToRemove = prevItems.find(item => item.product.id === productId)
        if (itemToRemove) {
          analytics.trackEcommerce(
            'remove_from_cart',
            itemToRemove.product.id,
            itemToRemove.product.price
          )
        }
        return prevItems.filter(item => item.product.id !== productId)
      }
      return prevItems.map(item => (item.product.id === productId ? {...item, quantity} : item))
    })
  }, [])

  const clearCart = useCallback(() => {
    setCartItems(prev => {
      if (prev.length > 0) {
        analytics.event({
          action: 'clear_cart',
          category: 'ecommerce',
          label: `Cleared ${prev.length} items`,
        })
      }
      return []
    })
  }, [])

  const cartCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  )

  const cartTotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + (item.product.price || 0) * item.quantity, 0),
    [cartItems]
  )

  const value = useMemo<CartContextType>(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal,
      isCartOpen,
      toggleCart,
      openCart,
    }),
    [
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal,
      isCartOpen,
      toggleCart,
      openCart,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
