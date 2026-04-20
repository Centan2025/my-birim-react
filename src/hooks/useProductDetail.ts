import {useState, useEffect, useMemo} from 'react'
import {useLocation} from 'react-router-dom'
import {useProduct, useProductsByCategory} from './useProducts'
import {useDesignersByIds} from './useDesigners'
import {useCategories} from './useCategories'
import {useSiteSettings} from './useSiteData'
import {useProductHero} from './useProductHero'
import {useHeaderTheme} from '../context/HeaderThemeContext'

import type {Product, Designer, SanityImagePalette} from '../types'

/**
 * Encapsulates all data-fetching, derived state, and side effects
 * for the ProductDetailPage.
 */
export function useProductDetail(productId: string | undefined, prefetchedProduct?: Product) {
  const location = useLocation()

  // React Query hooks
  const {data: productData, isLoading: productLoading} = useProduct(
    productId,
    prefetchedProduct ?? location.state?.product
  )

  // Data freezing to prevent blank pages during exit animations
  const [frozenProduct, setFrozenProduct] = useState<Product | null>(null)
  useEffect(() => {
    if (productData) setFrozenProduct(productData)
  }, [productData])

  const product = productData || frozenProduct

  const {data: siteSettings} = useSiteSettings()
  const {data: allCategories = []} = useCategories()
  const {setFromPalette, reset} = useHeaderTheme()

  // Multiple Designers Support
  const {data: designersData} = useDesignersByIds(product?.designerIds)
  const [frozenDesigners, setFrozenDesigners] = useState<Designer[]>([])
  useEffect(() => {
    if (designersData && designersData.length > 0) setFrozenDesigners(designersData)
  }, [designersData])
  const designers = designersData || frozenDesigners
  const designer = designers[0] || null // Still provide single designer for backward compatibility

  const {data: siblingProducts = []} = useProductsByCategory(product?.categoryId)
  const category = useMemo(
    () => allCategories.find(c => c.id === product?.categoryId),
    [allCategories, product?.categoryId]
  )

  // Responsive state
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  )

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Band media (all items in product.media, cover first)
  const bandMedia = useMemo(() => {
    if (!product || !Array.isArray(product.media)) return []
    const media = [...product.media]
    const coverIdx = media.findIndex((m) => (m as {isCover?: boolean}).isCover)
    if (coverIdx > 0) {
      const [cover] = media.splice(coverIdx, 1)
      media.unshift(cover)
    }
    return media
  }, [product])

  const slideCount = bandMedia.length
  const heroMedia = useMemo(() => {
    if (slideCount <= 1) return bandMedia
    const first = bandMedia[0]
    const last = bandMedia[bandMedia.length - 1]
    return [last, ...bandMedia, first]
  }, [bandMedia, slideCount])

  const heroHook = useProductHero(slideCount)

  // Merged material groups
  const mergedGroups = useMemo(() => {
    if (!product) return []
    const groupedMap = new Map<string, unknown>()
    const productGrouped = product.groupedMaterials || []
    for (const g of productGrouped) {
      const key = typeof g.groupTitle === 'string' ? g.groupTitle : JSON.stringify(g.groupTitle)
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          ...g,
          books: [...(g.books || [])],
          materials: [...(g.materials || [])],
        })
      } else {
        const existing = groupedMap.get(key)
        existing.books = [...existing.books, ...(g.books || [])]
        existing.materials = [...existing.materials, ...(g.materials || [])]
      }
    }
    return Array.from(groupedMap.values())
  }, [product])

  // Settings-derived values
  const imageBorderClass =
    siteSettings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'
  const showRelatedProducts = siteSettings?.showRelatedProducts !== false
  const showProductPrevNext = Boolean(siteSettings?.showProductPrevNext)

  // Related products
  const relatedProducts = useMemo(
    () => (product ? siblingProducts.filter(p => p.id !== product.id).slice(0, 4) : []),
    [siblingProducts, product]
  )

  // Prev/Next navigation
  const productIdForNav = product?.id
  const currentIdxInSiblings = siblingProducts.findIndex(p => p.id === productIdForNav)
  const prevProduct = currentIdxInSiblings > 0 ? siblingProducts[currentIdxInSiblings - 1] : null
  const nextProduct =
    currentIdxInSiblings < siblingProducts.length - 1
      ? siblingProducts[currentIdxInSiblings + 1]
      : null

  // Header theme effect
  useEffect(() => {
    if (!product) {
      reset()
      return
    }
    const mainImg = product.mainImage as {palette?: SanityImagePalette}
    const palette =
      typeof product.mainImage === 'object' ? mainImg?.palette : undefined
    setFromPalette(palette)
    return () => reset()
  }, [product, reset, setFromPalette])

  return {
    product,
    productLoading,
    designer,
    designers,
    category,
    siteSettings,
    siblingProducts,
    isMobile,
    bandMedia,
    heroMedia,
    slideCount,
    heroHook,
    mergedGroups,
    imageBorderClass,
    showRelatedProducts,
    showProductPrevNext,
    relatedProducts,
    prevProduct,
    nextProduct,
  }
}
