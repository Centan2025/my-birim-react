import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useProduct, useProductsByCategory } from './useProducts'
import { useDesigner } from './useDesigners'
import { useCategories } from './useCategories'
import { useSiteSettings } from './useSiteData'
import { useProductHero } from './useProductHero'
import { useHeaderTheme } from '../context/HeaderThemeContext'

/**
 * Encapsulates all data-fetching, derived state, and side effects
 * for the ProductDetailPage.
 */
export function useProductDetail(productId: string | undefined, prefetchedProduct?: any) {
  const location = useLocation()

  // React Query hooks
  const { data: productData, isLoading: productLoading } = useProduct(
    productId,
    prefetchedProduct ?? location.state?.product
  )

  // Data freezing to prevent blank pages during exit animations
  const [frozenProduct, setFrozenProduct] = useState<any>(null)
  useEffect(() => {
    if (productData) setFrozenProduct(productData)
  }, [productData])

  const product = productData || frozenProduct

  const { data: siteSettings } = useSiteSettings()
  const { data: allCategories = [] } = useCategories()
  const { setFromPalette, reset } = useHeaderTheme()

  const { data: designerData } = useDesigner(product?.designerId)
  const [frozenDesigner, setFrozenDesigner] = useState<any>(null)
  useEffect(() => {
    if (designerData) setFrozenDesigner(designerData)
  }, [designerData])
  const designer = designerData || frozenDesigner

  const { data: siblingProducts = [] } = useProductsByCategory(product?.categoryId)
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

  // Band media (deduplicated)
  const bandMedia = useMemo(() => {
    if (!product) return []
    const altMedia = product.alternativeMedia || []
    const mainUrl =
      typeof product.mainImage === 'string' ? product.mainImage : product.mainImage?.url || ''
    const head = mainUrl
      ? [
        {
          type: 'image' as const,
          url: mainUrl,
          ...((typeof product.mainImage === 'object' ? product.mainImage : {}) as any),
        },
      ]
      : []
    const merged = [...head, ...altMedia]
    const seen = new Set<string>()
    return merged.filter(m => {
      const key = `${m.type}:${m.url}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
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
    const groupedMap = new Map<string, any>()
    const productGrouped = (product as any).groupedMaterials || []
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
    const palette =
      typeof product.mainImage === 'object' ? (product.mainImage as any)?.palette : undefined
    setFromPalette(palette)
    return () => reset()
  }, [product, reset, setFromPalette])

  return {
    product,
    productLoading,
    designer,
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
