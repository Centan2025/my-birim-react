import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { PageLoading } from '../components/LoadingSpinner'
import { useTranslation } from '../i18n'
import { useSEO } from '../hooks/useSEO'
import { FullscreenMediaViewer } from '../components/FullscreenMediaViewer'
import { addStructuredData, getProductSchema } from '../lib/seo'
import { analytics } from '../lib/analytics'
import { useProductDetail } from '../hooks/useProductDetail'
import { useLightbox } from '../hooks/useLightbox'
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
import { ProductAddToCart } from '../components/product/ProductAddToCart'

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()

  // All data, derived state, and responsive detection
  const {
    product,
    productLoading,
    designer,
    category,
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
  } = useProductDetail(productId)

  // Lightbox state (reusable hook for each lightbox)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [lightboxSource, setLightboxSource] = useState<'band' | 'panel'>('band')
  const mediaLightbox = useLightbox()
  const dimLightbox = useLightbox()
  const materialLightbox = useLightbox()

  // Material selection state
  const [activeMaterialGroup, setActiveMaterialGroup] = useState<number | null>(null)
  const [activeBookIndex, setActiveBookIndex] = useState<number>(0)

  // Malzeme grupları yüklendiğinde ilk grubu otomatik seç
  useEffect(() => {
    if (mergedGroups.length > 0) {
      setActiveMaterialGroup(0)
      setActiveBookIndex(0)
    } else {
      setActiveMaterialGroup(null)
    }
  }, [mergedGroups])

  // Animation visibility state
  const [isFullscreenButtonVisible, setIsFullscreenButtonVisible] = useState(false)
  const [isTitleVisible, setIsTitleVisible] = useState(false)
  const [isDesignerVisible, setIsDesignerVisible] = useState(false)
  const [areDotsVisible, setAreDotsVisible] = useState(false)

  const { isLoggedIn, user } = useAuth()
  const { t, locale } = useTranslation()

  // SEO & Analytics
  useSEO({
    title: product
      ? category
        ? `${t(category.name)} - ${t(product.name)}`
        : t(product.name)
      : 'BIRIM',
    description: product ? t(product.description) : 'BIRIM - Modern tasarım ve mimari çözümler',
    image:
      typeof product?.mainImage === 'string'
        ? product.mainImage
        : (product?.mainImage as any)?.url || '',
    type: 'product',
    siteName: 'BIRIM',
    locale: 'tr_TR',
  })

  useEffect(() => {
    if (!product) return
    const productName = t(product.name)
    const productDescription = t(product.description) || productName
    const productImage =
      typeof product.mainImage === 'string'
        ? product.mainImage
        : (product.mainImage as any)?.url || ''
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

  // Entrance animations
  useEffect(() => {
    if (!product) return
    const fromCard = (window.history.state?.usr as any)?.fromCard

    setIsFullscreenButtonVisible(false)
    setIsDesignerVisible(false)
    setIsTitleVisible(false)
    setAreDotsVisible(false)

    if (fromCard) {
      // Fast track animations if coming from card
      setTimeout(() => setIsFullscreenButtonVisible(true), 100)
      setTimeout(() => setIsDesignerVisible(true), 50)
      setTimeout(() => setIsTitleVisible(true), 200)
      setTimeout(() => setAreDotsVisible(true), 100)
    } else {
      // Standard animations
      setTimeout(() => setIsFullscreenButtonVisible(true), 500)
      setTimeout(() => setIsDesignerVisible(true), 400)
      setTimeout(() => setIsTitleVisible(true), 700)
      setTimeout(() => setAreDotsVisible(true), 500)
    }
  }, [product])

  // Loading / Not found
  if (productLoading)
    return (
      <div className="pt-20">
        <PageLoading message={t('loading')} />
      </div>
    )
  if (!product)
    return (
      <div className="pt-20 text-center">
        <p className="text-gray-600">{t('product_not_found')}</p>
      </div>
    )

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
        totalHeroSlides={heroHook.totalHeroSlides}
        heroSlideIndex={heroHook.heroSlideIndex}
        draggedX={heroHook.draggedX}
        heroTransitionEnabled={heroHook.heroTransitionEnabled}
        isMobile={isMobile}
        isTitleVisible={isTitleVisible}
        isDesignerVisible={isDesignerVisible}
        areDotsVisible={areDotsVisible}
        isFullscreenButtonVisible={isFullscreenButtonVisible}
        imageBorderClass={imageBorderClass}
        currentImageIndex={heroHook.currentImageIndex}
        onNext={heroHook.heroNext}
        onPrev={heroHook.heroPrev}
        onDragStart={heroHook.handleHeroDragStart}
        onDragMove={heroHook.handleHeroDragMove}
        onDragEnd={heroHook.handleHeroDragEnd}
        onTransitionEnd={heroHook.handleHeroTransitionEnd}
        onOpenFullscreen={() => setIsFullscreenOpen(true)}
        onSetSlideIndex={heroHook.setHeroSlideIndex}
        onSetCurrentImageIndex={heroHook.setCurrentImageIndex}
        onSetTransitionEnabled={heroHook.setHeroTransitionEnabled}
      />

      <ProductThumbnails
        productName={product.name}
        bandMedia={bandMedia}
        currentImageIndex={heroHook.currentImageIndex}
        imageBorderClass={imageBorderClass}
        onSelect={idx => {
          heroHook.setHeroTransitionEnabled(true)
          heroHook.setHeroSlideIndex(idx + 1)
          heroHook.setCurrentImageIndex(idx)
        }}
      />

      <main className="bg-gray-100 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12">
          <ProductInfo product={product} category={category} locale={locale} />

          <div className="mt-12 space-y-16">
            <ProductDimensions
              dimImages={product.dimensionImages?.filter((di: any) => di?.image) || []}
              imageBorderClass={imageBorderClass}
              onOpenLightbox={(imgs, idx) => dimLightbox.open(imgs, idx)}
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
              onOpenMaterialLightbox={(imgs, idx) => materialLightbox.open(imgs, idx)}
            />

            <ProductDesignerSection designer={designer || null} t={t} />

            <ProductAddToCart
              product={product}
              mergedGroups={mergedGroups}
              activeMaterialGroup={activeMaterialGroup}
            />

            {product.exclusiveContent && (
              <ProductExclusiveContentSection
                exclusiveContent={product.exclusiveContent}
                isLoggedIn={isLoggedIn}
                user={user}
                navigate={navigate}
                t={t}
              />
            )}

            <ProductRelated products={relatedProducts} show={showRelatedProducts} />
          </div>

          {Array.isArray(product?.media) &&
            product.media.length > 0 &&
            product.showMediaPanels !== false && (
              <ProductMediaPanels
                product={product}
                imageBorderClass={imageBorderClass}
                youTubeThumb={url => {
                  let id = ''
                  if (url.includes('v=')) id = url.split('v=')[1]?.split('&')[0] || ''
                  else if (url.includes('youtu.be/'))
                    id = url.split('youtu.be/')[1]?.split('?')[0] || ''
                  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : ''
                }}
                openPanelLightbox={idx => {
                  setLightboxSource('panel')
                  mediaLightbox.open(product.media || [], idx)
                }}
                t={t}
              />
            )}
        </div>
      </main>

      <ProductBottomNav
        prevProduct={prevProduct}
        nextProduct={nextProduct}
        show={showProductPrevNext}
      />

      {/* Fullscreen viewer */}
      {isFullscreenOpen && bandMedia.length > 0 && (
        <FullscreenMediaViewer
          items={bandMedia.map(m => ({
            type: m.type,
            url: m.url,
            urlMobile: m.urlMobile,
            urlDesktop: m.urlDesktop,
            crop: m.crop,
            hotspot: m.hotspot,
          }))}
          initialIndex={heroHook.currentImageIndex}
          onClose={() => setIsFullscreenOpen(false)}
        />
      )}

      {/* Media lightbox (band or panel) */}
      {mediaLightbox.isOpen && (
        <ProductMediaLightbox
          items={mediaLightbox.images}
          currentIndex={mediaLightbox.currentIndex}
          onClose={mediaLightbox.close}
          onNext={mediaLightbox.next}
          onPrev={mediaLightbox.prev}
          showMetadata={lightboxSource === 'panel'}
        />
      )}

      {/* Dimension image lightbox */}
      {dimLightbox.isOpen && (
        <ProductMediaLightbox
          items={dimLightbox.images}
          currentIndex={dimLightbox.currentIndex}
          onClose={dimLightbox.close}
          onNext={dimLightbox.next}
          onPrev={dimLightbox.prev}
        />
      )}

      {/* Material image lightbox */}
      {materialLightbox.isOpen && (
        <ProductMediaLightbox
          items={materialLightbox.images}
          currentIndex={materialLightbox.currentIndex}
          onClose={materialLightbox.close}
          onNext={materialLightbox.next}
          onPrev={materialLightbox.prev}
        />
      )}
    </div>
  )
}
