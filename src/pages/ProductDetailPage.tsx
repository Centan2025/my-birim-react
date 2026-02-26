import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { PageLoading } from '../components/LoadingSpinner'
import { useTranslation } from '../i18n'
import { useCart } from '../context/CartContext'
import { useSEO } from '../hooks/useSEO'
import { FullscreenMediaViewer } from '../components/FullscreenMediaViewer'
import { addStructuredData, getProductSchema } from '../lib/seo'
import { analytics } from '../lib/analytics'
import { useProduct, useProductsByCategory } from '../hooks/useProducts'
import { useDesigner } from '../hooks/useDesigners'
import { useCategories } from '../hooks/useCategories'
import { useSiteSettings } from '../hooks/useSiteData'
import { useHeaderTheme } from '../context/HeaderThemeContext'
import { ProductDesignerSection } from '../components/ProductDesignerSection'
import { ProductExclusiveContentSection } from '../components/ProductExclusiveContentSection'
import { ProductMediaPanels } from '../components/ProductMediaPanels'

// Modular components
import { ProductHero } from '../components/product/ProductHero'
import { ProductThumbnails } from '../components/product/ProductThumbnails'
import { ProductInfo } from '../components/product/ProductInfo'
import { ProductMaterials } from '../components/product/ProductMaterials'
import { ProductDimensions } from '../components/product/ProductDimensions'
import { ProductBottomNav } from '../components/product/ProductBottomNav'
import { ProductRelated } from '../components/product/ProductRelated'
import { ProductMediaLightbox } from '../components/product/ProductMediaLightbox'

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

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()

  // React Query hooks
  const { data: product, isLoading: productLoading } = useProduct(productId)
  const { data: siteSettings } = useSiteSettings()
  const { data: allCategories = [] } = useCategories()
  const { setFromPalette, reset } = useHeaderTheme()

  const { data: designer } = useDesigner(product?.designerId)
  const { data: siblingProducts = [] } = useProductsByCategory(product?.categoryId)
  const category = useMemo(
    () => allCategories.find(c => c.id === product?.categoryId),
    [allCategories, product?.categoryId]
  )

  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0)
  const [lightboxSource, setLightboxSource] = useState<'band' | 'panel'>('band')
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState<number>(0)
  const [draggedX, setDraggedX] = useState<number>(0)
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [heroSlideIndex, setHeroSlideIndex] = useState<number>(1)
  const [heroTransitionEnabled, setHeroTransitionEnabled] = useState(true)
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false))
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [isFullscreenButtonVisible, setIsFullscreenButtonVisible] = useState(false)
  const [isTitleVisible, setIsTitleVisible] = useState(false)
  const [isDesignerVisible, setIsDesignerVisible] = useState(false)
  const [areDotsVisible, setAreDotsVisible] = useState(false)
  const [dimLightbox, setDimLightbox] = useState<{ images: any[]; currentIndex: number } | null>(null)
  const [materialLightbox, setMaterialLightbox] = useState<{ images: any[]; currentIndex: number } | null>(null)
  const [activeMaterialGroup, setActiveMaterialGroup] = useState<number | null>(null)
  const [activeBookIndex, setActiveBookIndex] = useState<number>(0)

  const { isLoggedIn, user } = useAuth()
  const { t, locale } = useTranslation()
  const { addToCart } = useCart()

  const DRAG_THRESHOLD = 50
  const dragStartY = useRef<number>(0)

  // Derived values
  const imageBorderClass = siteSettings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'

  const bandMedia = useMemo(() => {
    if (!product) return []
    const altMedia = product.alternativeMedia || []
    const mainUrl = typeof product.mainImage === 'string' ? product.mainImage : product.mainImage?.url || ''
    const head = mainUrl ? [{ type: 'image' as const, url: mainUrl, ...((typeof product.mainImage === 'object' ? product.mainImage : {}) as any) }] : []
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
  const totalHeroSlides = slideCount > 1 ? slideCount + 2 : slideCount
  const heroMedia = useMemo(() => {
    if (slideCount <= 1) return bandMedia
    const first = bandMedia[0]
    const last = bandMedia[bandMedia.length - 1]
    return [last, ...bandMedia, first]
  }, [bandMedia, slideCount])

  // Effects
  useEffect(() => {
    if (!product) {
      reset()
      return
    }
    const palette = typeof product.mainImage === 'object' ? (product.mainImage as any)?.palette : undefined
    setFromPalette(palette)
    return () => reset()
  }, [product, reset, setFromPalette])

  useEffect(() => {
    if (!product) return
    const productName = t(product.name)
    const productDescription = t(product.description) || productName
    const productImage = typeof product.mainImage === 'string' ? product.mainImage : (product.mainImage as any)?.url || ''
    const catName = category ? t(category.name) : ''
    const seoTitle = catName ? `${catName} - ${productName}` : productName

    analytics.pageview(window.location.pathname, seoTitle)
    analytics.trackEcommerce('view_item', product.id, (product as any)?.price || 0)

    const productSchema = getProductSchema({
      name: productName,
      description: productDescription,
      image: productImage,
      brand: designer ? t(designer.name) : undefined,
    })
    addStructuredData(productSchema, 'product-schema')
  }, [product, designer, category, t])

  useSEO({
    title: product ? (category ? `${t(category.name)} - ${t(product.name)}` : t(product.name)) : 'BIRIM',
    description: product ? t(product.description) : 'BIRIM - Modern tasarım ve mimari çözümler',
    image: typeof product?.mainImage === 'string' ? product.mainImage : (product?.mainImage as any)?.url || '',
    type: 'product',
    siteName: 'BIRIM',
    locale: 'tr_TR',
  })

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!product) return
    setIsFullscreenButtonVisible(false)
    setIsDesignerVisible(false)
    setIsTitleVisible(false)
    setAreDotsVisible(false)
    setTimeout(() => setIsFullscreenButtonVisible(true), 500)
    setTimeout(() => setIsDesignerVisible(true), 400)
    setTimeout(() => setIsTitleVisible(true), 700)
    setTimeout(() => setAreDotsVisible(true), 500)
  }, [product])

  useEffect(() => {
    if (product && bandMedia.length > 0) {
      setCurrentImageIndex(0)
      setHeroSlideIndex(slideCount > 1 ? 1 : 0)
    }
  }, [product, bandMedia.length, slideCount])

  // Handlers
  const heroNext = () => {
    if (slideCount <= 1 || !heroTransitionEnabled) return
    setHeroSlideIndex(prev => prev + 1)
    setCurrentImageIndex(prev => (prev + 1) % slideCount)
  }

  const heroPrev = () => {
    if (slideCount <= 1 || !heroTransitionEnabled) return
    setHeroSlideIndex(prev => prev - 1)
    setCurrentImageIndex(prev => (prev - 1 + slideCount) % slideCount)
  }

  const handleHeroTransitionEnd = () => {
    if (slideCount <= 1 || !heroTransitionEnabled) return
    if (heroSlideIndex === totalHeroSlides - 1) {
      setHeroTransitionEnabled(false)
      setHeroSlideIndex(1)
    } else if (heroSlideIndex === 0) {
      setHeroTransitionEnabled(false)
      setHeroSlideIndex(totalHeroSlides - 2)
    }
  }

  useEffect(() => {
    if (!heroTransitionEnabled) {
      const id = requestAnimationFrame(() => setHeroTransitionEnabled(true))
      return () => cancelAnimationFrame(id)
    }
    return undefined
  }, [heroTransitionEnabled])

  const handleHeroDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.closest('a, button')) return
    const x = 'touches' in e ? e.touches[0]?.clientX : e.clientX
    const y = 'touches' in e ? e.touches[0]?.clientY : e.clientY

    if (x === undefined || y === undefined) return

    setIsDragging(true)
    setDragStartX(x)
    dragStartY.current = y
    setDraggedX(0)
  }

  const handleHeroDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const x = 'touches' in e ? e.touches[0]?.clientX : e.clientX
    const y = 'touches' in e ? e.touches[0]?.clientY : e.clientY

    if (x === undefined || y === undefined) return

    const deltaX = Math.abs(x - dragStartX)
    const deltaY = Math.abs(y - dragStartY.current)
    if (deltaY > deltaX && deltaY > 10) {
      setIsDragging(false)
      return
    }
    setDraggedX(x - dragStartX)
  }

  const handleHeroDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (draggedX < -DRAG_THRESHOLD) heroNext()
    else if (draggedX > DRAG_THRESHOLD) heroPrev()
    setDraggedX(0)
  }

  if (productLoading) return <div className="pt-20"><PageLoading message={t('loading')} /></div>
  if (!product) return <div className="pt-20 text-center"><p className="text-gray-600">{t('product_not_found')}</p></div>

  const relatedProducts = siblingProducts.filter(p => p.id !== product.id).slice(0, 4)
  const showRelatedProducts = siteSettings?.showRelatedProducts !== false

  const mergedGroups = (() => {
    const groupedMap = new Map<string, any>()
    const productGrouped = (product as any).groupedMaterials || []
    for (const g of productGrouped) {
      const key = typeof g.groupTitle === 'string' ? g.groupTitle : JSON.stringify(g.groupTitle)
      if (!groupedMap.has(key)) {
        groupedMap.set(key, { ...g, books: [...(g.books || [])], materials: [...(g.materials || [])] })
      } else {
        const existing = groupedMap.get(key)
        existing.books = [...existing.books, ...(g.books || [])]
        existing.materials = [...existing.materials, ...(g.materials || [])]
      }
    }
    return Array.from(groupedMap.values())
  })()

  const productIdForNav = product.id
  const currentIdxInSiblings = siblingProducts.findIndex(p => p.id === productIdForNav)
  const prevProduct = currentIdxInSiblings > 0 ? siblingProducts[currentIdxInSiblings - 1] : null
  const nextProduct = currentIdxInSiblings < siblingProducts.length - 1 ? siblingProducts[currentIdxInSiblings + 1] : null

  return (
    <div data-product-detail className="min-h-screen bg-white">
      <style>{`
                @keyframes dot-grow { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
                @keyframes fill-line { from { width: 0; } to { width: 100%; } }
                @keyframes arrow-scale-in { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
                @keyframes close-in { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
                .animate-dot-grow { animation: dot-grow 0.5s ease-out forwards; }
                .animate-fill-line { animation: fill-line 5s linear forwards; }
            `}</style>

      <ProductHero
        product={product}
        designer={designer}
        heroMedia={heroMedia}
        slideCount={slideCount}
        totalHeroSlides={totalHeroSlides}
        heroSlideIndex={heroSlideIndex}
        draggedX={draggedX}
        heroTransitionEnabled={heroTransitionEnabled}
        isMobile={isMobile}
        isTitleVisible={isTitleVisible}
        isDesignerVisible={isDesignerVisible}
        areDotsVisible={areDotsVisible}
        isFullscreenButtonVisible={isFullscreenButtonVisible}
        imageBorderClass={imageBorderClass}
        currentImageIndex={currentImageIndex}
        onNext={heroNext}
        onPrev={heroPrev}
        onDragStart={handleHeroDragStart}
        onDragMove={handleHeroDragMove}
        onDragEnd={handleHeroDragEnd}
        onTransitionEnd={handleHeroTransitionEnd}
        onOpenFullscreen={() => setIsFullscreenOpen(true)}
        onSetSlideIndex={setHeroSlideIndex}
        onSetCurrentImageIndex={setCurrentImageIndex}
        onSetTransitionEnabled={setHeroTransitionEnabled}
      />

      <ProductThumbnails
        productName={product.name}
        bandMedia={bandMedia}
        currentImageIndex={currentImageIndex}
        imageBorderClass={imageBorderClass}
        onSelect={(idx) => {
          setHeroTransitionEnabled(false)
          setHeroSlideIndex(idx + 1)
          setCurrentImageIndex(idx)
        }}
      />

      <main className="bg-gray-100 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12">
          <ProductInfo product={product} category={category} locale={locale} />

          <div className="mt-12 space-y-16">
            <ProductDimensions
              dimImages={product.dimensionImages?.filter(di => di?.image) || []}
              imageBorderClass={imageBorderClass}
              onOpenLightbox={(imgs, idx) => setDimLightbox({ images: imgs, currentIndex: idx })}
            />

            <ProductMaterials
              mergedGroups={mergedGroups}
              grouped={(product as any).groupedMaterials || []}
              flatMaterials={product.materials || []}
              activeMaterialGroup={activeMaterialGroup}
              activeBookIndex={activeBookIndex}
              imageBorderClass={imageBorderClass}
              onSetActiveMaterialGroup={setActiveMaterialGroup}
              onSetActiveBookIndex={setActiveBookIndex}
              onOpenMaterialLightbox={(imgs, idx) => setMaterialLightbox({ images: imgs, currentIndex: idx })}
            />

            <ProductDesignerSection designer={designer || null} t={t} />

            {product.buyable && (
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={() => (mergedGroups.length > 0 && activeMaterialGroup === null) ? alert(t('please_select_price_group')) : addToCart(product)}
                  className={`group w-20 h-20 flex items-center justify-center rounded-full transition-all duration-300 transform hover:scale-110 active:scale-100 hover:shadow-lg ${mergedGroups.length > 0 && activeMaterialGroup === null ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
                >
                  <TransparentShoppingBagIcon />
                </button>
              </div>
            )}

            {product.exclusiveContent && (
              <ProductExclusiveContentSection exclusiveContent={product.exclusiveContent} isLoggedIn={isLoggedIn} user={user} navigate={navigate} t={t} />
            )}

            <ProductRelated products={relatedProducts} show={showRelatedProducts} />
          </div>

          {Array.isArray(product?.media) && product.media.length > 0 && product.showMediaPanels !== false && (
            <ProductMediaPanels
              product={product}
              imageBorderClass={imageBorderClass}
              youTubeThumb={(url) => {
                let id = ''
                if (url.includes('v=')) id = url.split('v=')[1]?.split('&')[0] || ''
                else if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1]?.split('?')[0] || ''
                return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : ''
              }}
              openPanelLightbox={(idx) => {
                setLightboxSource('panel')
                setLightboxImageIndex(idx)
                setIsLightboxOpen(true)
              }}
              t={t}
            />
          )}
        </div>
      </main>

      <ProductBottomNav
        prevProduct={prevProduct}
        nextProduct={nextProduct}
        show={Boolean(siteSettings?.showProductPrevNext)}
      />

      {isFullscreenOpen && bandMedia.length > 0 && (
        <FullscreenMediaViewer
          items={bandMedia.map(m => ({ type: m.type, url: m.url, urlMobile: m.urlMobile, urlDesktop: m.urlDesktop, crop: m.crop, hotspot: m.hotspot }))}
          initialIndex={currentImageIndex}
          onClose={() => setIsFullscreenOpen(false)}
        />
      )}

      {isLightboxOpen && (
        <ProductMediaLightbox
          items={lightboxSource === 'panel' ? (product.media || []) : bandMedia}
          currentIndex={lightboxImageIndex}
          onClose={() => setIsLightboxOpen(false)}
          onNext={() => setLightboxImageIndex(prev => (prev + 1) % (lightboxSource === 'panel' ? (product.media?.length || 0) : bandMedia.length))}
          onPrev={() => setLightboxImageIndex(prev => (prev - 1 + (lightboxSource === 'panel' ? (product.media?.length || 0) : bandMedia.length)) % (lightboxSource === 'panel' ? (product.media?.length || 0) : bandMedia.length))}
          showMetadata={lightboxSource === 'panel'}
        />
      )}

      {dimLightbox && (
        <ProductMediaLightbox
          items={dimLightbox.images}
          currentIndex={dimLightbox.currentIndex}
          onClose={() => setDimLightbox(null)}
          onNext={() => setDimLightbox({ ...dimLightbox, currentIndex: (dimLightbox.currentIndex + 1) % dimLightbox.images.length })}
          onPrev={() => setDimLightbox({ ...dimLightbox, currentIndex: (dimLightbox.currentIndex - 1 + dimLightbox.images.length) % dimLightbox.images.length })}
        />
      )}

      {materialLightbox && (
        <ProductMediaLightbox
          items={materialLightbox.images}
          currentIndex={materialLightbox.currentIndex}
          onClose={() => setMaterialLightbox(null)}
          onNext={() => setMaterialLightbox({ ...materialLightbox, currentIndex: (materialLightbox.currentIndex + 1) % materialLightbox.images.length })}
          onPrev={() => setMaterialLightbox({ ...materialLightbox, currentIndex: (materialLightbox.currentIndex - 1 + materialLightbox.images.length) % materialLightbox.images.length })}
        />
      )}
    </div>
  )
}
