/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type PropsWithChildren,
} from 'react'
import type {
  CommerceCartItem,
  CommerceCartError,
  CommerceCartContextValue,
  CartValidationResult,
} from '../types/commerceCart'
import {validateCommerceCart, CommerceCartServiceError} from '../services/commerce/cart'

const COMMERCE_STORAGE_KEY = 'birim_commerce_cart'
const MAX_CART_LINES = 50
const MAX_ITEM_QUANTITY = 100
const MIN_ITEM_QUANTITY = 1
const VALIDATION_DEBOUNCE_MS = 250

/**
 * Safely parse and sanitize stored cart data from localStorage.
 * Strictly extracts only intent fields (productId, variantId, quantity).
 * Any forged or extraneous properties (price, currency, sku, etc.) are discarded.
 */
function parseStoredCart(raw: string | null): CommerceCartItem[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    const sanitized: CommerceCartItem[] = []
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue
      const productId = typeof item.productId === 'string' ? item.productId.trim() : ''
      if (!productId) continue

      const variantId =
        typeof item.variantId === 'string' && item.variantId.trim() ? item.variantId.trim() : null

      const rawQuantity = Number(item.quantity)
      const quantity =
        Number.isInteger(rawQuantity) && rawQuantity >= MIN_ITEM_QUANTITY
          ? Math.min(rawQuantity, MAX_ITEM_QUANTITY)
          : MIN_ITEM_QUANTITY

      sanitized.push({
        productId,
        variantId,
        quantity,
      })

      if (sanitized.length >= MAX_CART_LINES) break
    }

    return sanitized
  } catch {
    return []
  }
}

/**
 * Checks if two cart items reference the exact same product and variant combination.
 */
function isSameCartLine(
  a: CommerceCartItem,
  b: {productId: string; variantId?: string | null}
): boolean {
  if (a.productId !== b.productId) return false
  const aVar = a.variantId || null
  const bVar = b.variantId || null
  return aVar === bVar
}

const CommerceCartContext = createContext<CommerceCartContextValue | null>(null)

export const useCommerceCart = () => {
  const context = useContext(CommerceCartContext)
  if (!context) {
    throw new Error('useCommerceCart must be used within a CommerceCartProvider')
  }
  return context
}

export const CommerceCartProvider = ({children}: PropsWithChildren) => {
  const [items, setItems] = useState<CommerceCartItem[]>(() => {
    if (typeof window === 'undefined' || !window.localStorage) return []
    return parseStoredCart(localStorage.getItem(COMMERCE_STORAGE_KEY))
  })

  const [validatedCart, setValidatedCart] = useState<CartValidationResult | null>(null)
  const [validationError, setValidationError] = useState<CommerceCartError | null>(null)
  const [isValidating, setIsValidating] = useState<boolean>(false)
  const [isStale, setIsStale] = useState<boolean>(false)

  const itemsRef = useRef<CommerceCartItem[]>(items)
  itemsRef.current = items
  const isInitialMount = useRef(true)
  const requestSeqRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Persist only pure intent (productId, variantId, quantity) to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (items.length === 0) {
          localStorage.removeItem(COMMERCE_STORAGE_KEY)
        } else {
          const minimalPayload = items.map(item => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
          }))
          localStorage.setItem(COMMERCE_STORAGE_KEY, JSON.stringify(minimalPayload))
        }
      }
    } catch {
      // Ignore storage write quota or access restrictions
    }
  }, [items])

  /**
   * Performs server validation with sequence ID and AbortController race-condition prevention.
   */
  const performValidation = useCallback(async (cartItems: CommerceCartItem[]) => {
    if (cartItems.length === 0) {
      setValidatedCart(null)
      setValidationError(null)
      setIsValidating(false)
      setIsStale(false)
      return
    }

    const currentSeq = ++requestSeqRef.current

    // Abort previous in-flight validation request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsValidating(true)

    try {
      const result = await validateCommerceCart(cartItems, controller.signal)

      // Discard response if a newer request has been dispatched
      if (currentSeq === requestSeqRef.current) {
        setValidatedCart(result)
        setValidationError(null)
        setIsStale(false)
        setIsValidating(false)
      }
    } catch (err: unknown) {
      // Ignore deliberate abort cancellations
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }

      if (currentSeq === requestSeqRef.current) {
        // Do NOT automatically delete invalid lines; keep intent and expose structured error
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
            message: 'Sepet doğrulanırken beklenmeyen bir hata oluştu.',
          })
        }
        setValidatedCart(null)
        setIsStale(false)
        setIsValidating(false)
      }
    }
  }, [])

  /**
   * Schedule debounced server validation when items state changes.
   */
  const scheduleValidation = useCallback(
    (newItems: CommerceCartItem[]) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      if (newItems.length === 0) {
        performValidation([])
        return
      }

      debounceTimerRef.current = setTimeout(() => {
        performValidation(newItems)
      }, VALIDATION_DEBOUNCE_MS)
    },
    [performValidation]
  )

  // Initial validation on mount if items exist in storage
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      if (items.length > 0) {
        performValidation(items)
      }
    }
  }, [items, performValidation])

  // Cleanup timers & abort controllers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const addItem = useCallback(
    async (productId: string, variantId?: string | null, quantity: number = 1) => {
      const cleanProductId = String(productId || '').trim()
      if (!cleanProductId) return

      const cleanVariantId = variantId ? String(variantId).trim() : null
      const safeQuantity = Math.max(
        MIN_ITEM_QUANTITY,
        Math.min(MAX_ITEM_QUANTITY, Math.floor(quantity) || 1)
      )

      const prevItems = itemsRef.current
      const existingIndex = prevItems.findIndex(item =>
        isSameCartLine(item, {productId: cleanProductId, variantId: cleanVariantId})
      )

      let nextItems: CommerceCartItem[]
      const existing = existingIndex > -1 ? prevItems[existingIndex] : undefined
      if (existing) {
        const newQty = Math.min(MAX_ITEM_QUANTITY, existing.quantity + safeQuantity)
        nextItems = prevItems.map((item, idx) =>
          idx === existingIndex ? {...item, quantity: newQty} : item
        )
      } else {
        if (prevItems.length >= MAX_CART_LINES) {
          return
        }
        nextItems = [
          ...prevItems,
          {
            productId: cleanProductId,
            variantId: cleanVariantId,
            quantity: safeQuantity,
          },
        ]
      }

      itemsRef.current = nextItems
      setItems(nextItems)
      setIsStale(true)
      setValidatedCart(null)
      setValidationError(null)
      scheduleValidation(nextItems)
    },
    [scheduleValidation]
  )

  const removeItem = useCallback(
    async (productId: string, variantId?: string | null) => {
      const cleanProductId = String(productId || '').trim()
      const cleanVariantId = variantId ? String(variantId).trim() : null

      const prevItems = itemsRef.current
      const nextItems = prevItems.filter(
        item => !isSameCartLine(item, {productId: cleanProductId, variantId: cleanVariantId})
      )

      itemsRef.current = nextItems
      setItems(nextItems)
      setIsStale(true)
      setValidatedCart(null)
      setValidationError(null)
      scheduleValidation(nextItems)
    },
    [scheduleValidation]
  )

  const updateQuantity = useCallback(
    async (productId: string, variantId: string | null | undefined, quantity: number) => {
      const cleanProductId = String(productId || '').trim()
      const cleanVariantId = variantId ? String(variantId).trim() : null

      const prevItems = itemsRef.current
      let nextItems: CommerceCartItem[]
      if (quantity <= 0) {
        nextItems = prevItems.filter(
          item => !isSameCartLine(item, {productId: cleanProductId, variantId: cleanVariantId})
        )
      } else {
        const safeQuantity = Math.min(
          MAX_ITEM_QUANTITY,
          Math.max(MIN_ITEM_QUANTITY, Math.floor(quantity))
        )
        nextItems = prevItems.map(item =>
          isSameCartLine(item, {productId: cleanProductId, variantId: cleanVariantId})
            ? {...item, quantity: safeQuantity}
            : item
        )
      }

      itemsRef.current = nextItems
      setItems(nextItems)
      setIsStale(true)
      setValidatedCart(null)
      setValidationError(null)
      scheduleValidation(nextItems)
    },
    [scheduleValidation]
  )

  const clearCart = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    itemsRef.current = []
    setItems([])
    setValidatedCart(null)
    setValidationError(null)
    setIsStale(false)
    setIsValidating(false)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(COMMERCE_STORAGE_KEY)
      }
    } catch {
      // Ignore
    }
  }, [])

  const validateCart = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    await performValidation(itemsRef.current)
  }, [performValidation])

  const itemCount = useMemo(() => items.reduce((acc, item) => acc + item.quantity, 0), [items])

  const hasItems = useMemo(() => items.length > 0, [items])

  const value = useMemo<CommerceCartContextValue>(
    () => ({
      items,
      validatedCart,
      isValidating,
      validationError,
      isStale,
      itemCount,
      hasItems,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      validateCart,
    }),
    [
      items,
      validatedCart,
      isValidating,
      validationError,
      isStale,
      itemCount,
      hasItems,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      validateCart,
    ]
  )

  return <CommerceCartContext.Provider value={value}>{children}</CommerceCartContext.Provider>
}
