/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useParams, Link, useNavigate } from 'react-router-dom'
// FIX: Imported SiteSettings type to correctly type component state.
import type { LocalizedString } from '../types'
import { useAuth } from '../App'
import { OptimizedImage } from '../components/OptimizedImage'
import { OptimizedVideo } from '../components/OptimizedVideo'
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
import ScrollReveal from '../components/ScrollReveal'
import { ProductDesignerSection } from '../components/ProductDesignerSection'
import { ProductExclusiveContentSection } from '../components/ProductExclusiveContentSection'
import { ProductMediaPanels } from '../components/ProductMediaPanels'
import { ProductCard } from '../components/ProductCard'

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

const MinimalChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
)

const MinimalChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m9 18 6-6-6-6" />
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

  // Designer ve category'yi product'tan al
  const { data: designer } = useDesigner(product?.designerId)
  const { data: siblingProducts = [] } = useProductsByCategory(product?.categoryId)
  const category = useMemo(
    () => allCategories.find(c => c.id === product?.categoryId),
    [allCategories, product?.categoryId]
  )

  const loading = productLoading
  const [mainImage, setMainImage] = useState('')
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0)
  const [lightboxSource, setLightboxSource] = useState<'band' | 'panel'>('band')
  const youTubePlayerRef = useRef<HTMLIFrameElement | null>(null)
  const [ytPlaying, setYtPlaying] = useState<boolean>(false)
  const { isLoggedIn, user } = useAuth()
  const { t, locale } = useTranslation()
  const { addToCart } = useCart()
  // FIX: Removed usage of non-existent `useSiteSettings` hook and now use the local `siteSettings` state.
  const imageBorderClass =
    siteSettings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'
  const [activeMaterialGroup, setActiveMaterialGroup] = useState<number>(0)
  const [activeBookIndex, setActiveBookIndex] = useState<number>(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState<number>(0)
  const [draggedX, setDraggedX] = useState<number>(0)
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  // Hero için sonsuz kayma (cloned slides) index'i
  const [heroSlideIndex, setHeroSlideIndex] = useState<number>(1) // 1: ilk gerçek slide
  const [heroTransitionEnabled, setHeroTransitionEnabled] = useState(true)
  const DRAG_THRESHOLD = 50 // pixels
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return false
  })
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [isFullscreenButtonVisible, setIsFullscreenButtonVisible] = useState(false)
  const [isTitleVisible, setIsTitleVisible] = useState(false)
  const [isDesignerVisible, setIsDesignerVisible] = useState(false)
  const [areDotsVisible, setAreDotsVisible] = useState(false)
  const [isPageVisible, setIsPageVisible] = useState(false)
  const [dimLightbox, setDimLightbox] = useState<{
    images: { image: string; title?: LocalizedString }[]
    currentIndex: number
  } | null>(null)
  const [materialLightbox, setMaterialLightbox] = useState<{
    images: { image: string; name: string }[]
    currentIndex: number
  } | null>(null)
  // Thumbnails horizontal drag/scroll
  const thumbRef = useRef<HTMLDivElement | null>(null)
  const [thumbDragStartX, setThumbDragStartX] = useState<number | null>(null)
  const thumbButtonsRef = useRef<(HTMLButtonElement | null)[]>([])
  const thumbListRef = useRef<HTMLDivElement | null>(null)
  const thumbIndicatorRef = useRef<HTMLDivElement | null>(null)
  const [thumbIndicatorBox, setThumbIndicatorBox] = useState<{
    left: number
    top: number
    width: number
    height: number
    visible: boolean
  }>({ left: 0, top: 0, width: 0, height: 0, visible: false })
  const [thumbScrollStart, setThumbScrollStart] = useState<number>(0)
  const scrollLockRef = useRef<number>(0)
  const closeBtnAnimStyle: React.CSSProperties = {
    animation: 'close-in 650ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
  }

  const arrowInLeft: React.CSSProperties = {
    transform: 'translateX(-40px)',
    opacity: 0,
    animation: 'arrow-in-left 520ms cubic-bezier(0.34, 1.56, 0.64, 1) 120ms forwards',
  }

  const arrowInRight: React.CSSProperties = {
    transform: 'translateX(40px)',
    opacity: 0,
    animation: 'arrow-in-right 520ms cubic-bezier(0.34, 1.56, 0.64, 1) 200ms forwards',
  }

  // Işık kutuları açıkken hem body hem html scroll'unu kilitle, pozisyonu koru
  useEffect(() => {
    if (typeof document === 'undefined') return
    const html = document.documentElement
    const body = document.body

    const shouldLock = Boolean(dimLightbox || materialLightbox)
    if (shouldLock) {
      scrollLockRef.current = window.scrollY || 0
      body.style.position = 'fixed'
      body.style.top = `-${scrollLockRef.current}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.width = '100%'
      body.style.overflow = 'hidden'
      body.style.touchAction = 'none'
      html.style.overflow = 'hidden'
      html.style.touchAction = 'none'
    } else {
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      body.style.overflow = ''
      body.style.touchAction = ''
      html.style.overflow = ''
      html.style.touchAction = ''
      if (scrollLockRef.current) {
        window.scrollTo(0, scrollLockRef.current)
      }
    }

    return () => {
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      body.style.overflow = ''
      body.style.touchAction = ''
      html.style.overflow = ''
      html.style.touchAction = ''
      if (scrollLockRef.current) {
        window.scrollTo(0, scrollLockRef.current)
      }
    }
  }, [dimLightbox, materialLightbox])

  // Sayfa animasyonu - ilk açılışta fade-in
  useEffect(() => {
    // PageTransition animasyonu kullanıldığı için bu animasyonu kaldırdık
    setIsPageVisible(true)
  }, [productId])

  // Close butonu slide-in + spin animasyonu için global keyframe
  useEffect(() => {
    if (typeof document === 'undefined') return
    const id = 'lightbox-slide-in-right'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      @keyframes close-in {
        from { opacity: 0; transform: translateX(100px) rotate(90deg); }
        to { opacity: 1; transform: translateX(0) rotate(0deg); }
      }
      @keyframes arrow-in-left {
        from { opacity: 0; transform: translateX(-40px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes arrow-in-right {
        from { opacity: 0; transform: translateX(40px); }
        to { opacity: 1; transform: translateX(0); }
      }
    `
    document.head.appendChild(style)
    return () => {
      style.remove()
    }
  }, [])

  // Header temasını ürün görseli paletinden besle
  useEffect(() => {
    if (!product) {
      reset()
      return
    }
    const palette =
      typeof product.mainImage === 'object' ? (product.mainImage as any).palette : undefined
    setFromPalette(palette)
    return () => reset()
  }, [product, reset, setFromPalette])

  // Sayfa başlığı + GA pageview: "Kategori Adı - Ürün Adı"
  useEffect(() => {
    if (!product) return
    if (typeof window === 'undefined') return

    const categoryName = category ? t(category.name) : ''
    const productName = t(product.name)
    const title = categoryName ? `${categoryName} - ${productName}` : productName
    analytics.pageview(window.location.pathname, title)
  }, [product, t])

  // Grup değiştiğinde kartela indexini sıfırla
  useEffect(() => {
    setActiveBookIndex(0)
  }, [activeMaterialGroup])


  // Fullscreen buton animasyonu - sağdan fade ile gelir
  useEffect(() => {
    if (!product) return
    setIsFullscreenButtonVisible(false)
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        setIsFullscreenButtonVisible(true)
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [product])

  // Tasarımcı adı animasyonu - önce başlar, fade ile birlikte soldan gel
  useEffect(() => {
    if (!product || !designer) return
    setIsDesignerVisible(false)
    const timer = setTimeout(() => {
      setIsDesignerVisible(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [product, designer])

  // Ürün adı animasyonu - tasarımcı adından sonra başlar, fade ile birlikte soldan gel
  useEffect(() => {
    if (!product) return
    setIsTitleVisible(false)
    const timer = setTimeout(() => {
      setIsTitleVisible(true)
    }, 700)
    return () => clearTimeout(timer)
  }, [product])

  // Dot'lar animasyonu - ilk açılışta sağdan ve soldan birlikte gel
  useEffect(() => {
    if (!product) return
    setAreDotsVisible(false)
    const timer = setTimeout(() => {
      setAreDotsVisible(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [product])

  // Product değiştiğinde main image'i ayarla
  useEffect(() => {
    if (!product) return

    // İlk görünmesini istediğimiz medya: alternatifMedia varsa onun ilk öğesi; yoksa eski alternatif görseller
    const altMediaArr: any[] = Array.isArray((product as any).alternativeMedia)
      ? (product as any).alternativeMedia
      : []
    if (altMediaArr.length > 0) {
      setCurrentImageIndex(0)
      const first = altMediaArr[0]
      if (first?.type === 'image' && first?.url) {
        setMainImage(first.url)
      } else {
        // video/youtube ise mainImage'i dokunmadan bırakıyoruz; slider yine doğru render eder
        const mainImgUrl =
          typeof product.mainImage === 'string' ? product.mainImage : product.mainImage?.url || ''
        setMainImage(mainImgUrl)
      }
    } else {
      const altImgs = Array.isArray(product.alternativeImages) ? product.alternativeImages : []
      const mainImgUrl =
        typeof product.mainImage === 'string' ? product.mainImage : product.mainImage?.url || ''
      const allImgs = [mainImgUrl, ...altImgs].filter(Boolean)
      setMainImage(allImgs[0] || '')
      setCurrentImageIndex(0)
    }
  }, [product])

  // SEO ve Structured Data
  const productName = product ? t(product.name) : ''
  const productDescription = product ? t(product.description) || productName : ''
  const productImage =
    product && typeof product.mainImage === 'string'
      ? product.mainImage
      : (product?.mainImage && typeof product.mainImage === 'object'
        ? product.mainImage.url
        : '') || ''
  const categoryNameForSeo = category ? t(category.name) : ''
  const seoTitle = productName
    ? categoryNameForSeo
      ? `${categoryNameForSeo} - ${productName}`
      : productName
    : 'BIRIM'

  useSEO({
    title: seoTitle,
    description: productDescription || 'BIRIM - Modern tasarım ve mimari çözümler',
    image: productImage,
    type: 'product',
    siteName: 'BIRIM',
    locale: 'tr_TR',
  })

  // Structured Data (Schema.org)
  useEffect(() => {
    if (!product || !productName) return

    const productSchema = getProductSchema({
      name: productName,
      description: productDescription,
      image: productImage,
      brand: designer ? t(designer.name) : undefined,
    })
    addStructuredData(productSchema, 'product-schema')
  }, [product, designer, productName, productDescription, productImage, t])
  const { prevProduct, nextProduct } = useMemo(() => {
    if (!product || siblingProducts.length < 2) return { prevProduct: null, nextProduct: null }
    const currentIndex = siblingProducts.findIndex(p => p.id === product.id)
    if (currentIndex === -1) return { prevProduct: null, nextProduct: null }
    const prev = currentIndex > 0 ? siblingProducts[currentIndex - 1] : null
    const next =
      currentIndex < siblingProducts.length - 1 ? siblingProducts[currentIndex + 1] : null
    return { prevProduct: prev, nextProduct: next }
  }, [product, siblingProducts])
  // Bottom prev/next visibility from CMS settings
  const showBottomPrevNext = Boolean(siteSettings?.showProductPrevNext)

  // Benzer ürünler: aynı kategorideki diğer ürünler
  const relatedProducts = useMemo(
    () =>
      siblingProducts
        .filter(p => p.id !== product?.id)
        .slice(0, 4),
    [siblingProducts, product?.id]
  )
  const showRelatedProducts = siteSettings?.showRelatedProducts !== false

  // Aynı groupTitle'a sahip grupları tek bir sekme altında birleştir - erken return'lerden önce
  const grouped = useMemo(() => {
    if (!product) return []
    return Array.isArray((product as any).groupedMaterials) ? (product as any).groupedMaterials : []
  }, [product])

  const mergedGroups = useMemo(() => {
    const map = new Map<string, any>()
      ; (grouped || []).forEach((g: any) => {
        const key = JSON.stringify(g.groupTitle || '')
        if (!map.has(key)) {
          map.set(key, {
            groupTitle: g.groupTitle,
            books: Array.isArray(g.books) ? [...g.books] : [],
            materials: Array.isArray(g.materials) ? [...g.materials] : [],
          })
        } else {
          const agg = map.get(key)
          // kitapları başlıklarına göre birleştir
          const byTitle = new Map<string, any>()
            ;[...(agg.books || []), ...(g.books || [])].forEach((b: any) => {
              const bKey = JSON.stringify(b.bookTitle || '')
              if (!byTitle.has(bKey)) byTitle.set(bKey, { bookTitle: b.bookTitle, materials: [] })
              const entry = byTitle.get(bKey)
              entry.materials = [...entry.materials, ...(Array.isArray(b.materials) ? b.materials : [])]
            })
          agg.books = Array.from(byTitle.values())
          agg.materials = [
            ...(agg.materials || []),
            ...(Array.isArray(g.materials) ? g.materials : []),
          ]
          map.set(key, agg)
        }
      })
    return Array.from(map.values())
  }, [grouped])

  // Görsel/Video/YouTube bant medyası (erken return'lerden önce)
  const rawAltMedia: any[] = Array.isArray((product as any)?.alternativeMedia)
    ? (product as any).alternativeMedia
    : []
  // Helper: mainImage string veya object olabilir
  const mainImageUrl = product?.mainImage
    ? typeof product.mainImage === 'string'
      ? product.mainImage
      : product.mainImage.url
    : ''
  const mainImageMobile =
    product?.mainImage && typeof product.mainImage === 'object'
      ? product.mainImage.urlMobile
      : undefined
  const mainImageDesktop =
    product?.mainImage && typeof product.mainImage === 'object'
      ? product.mainImage.urlDesktop
      : undefined

  const fallbackImages = (() => {
    const ai = Array.isArray((product as any)?.alternativeImages)
      ? (product as any).alternativeImages
      : []
    const arw = [mainImageUrl, ...ai]
    return Array.isArray(arw)
      ? arw.filter(Boolean).map((u: string) => ({ type: 'image' as const, url: u }))
      : []
  })()
  // Bant medyası: alternatif medya varsa, ana görseli en başa ekle
  const bandMedia: {
    type: 'image' | 'video' | 'youtube'
    url: string
    urlMobile?: string
    urlDesktop?: string
  }[] = (() => {
    if (rawAltMedia.length) {
      const head: any[] = mainImageUrl
        ? [
          {
            type: 'image',
            url: mainImageUrl,
            urlMobile: mainImageMobile,
            urlDesktop: mainImageDesktop,
          },
        ]
        : []
      const merged = [...head, ...rawAltMedia]
      // tekilleştir (aynı url tekrar etmesin)
      const seen = new Set<string>()
      return merged.filter((m: any) => {
        const key = `${m.type}:${m.url || (m.image && 'image')}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }
    return fallbackImages
  })()
  const firstImageIndex = useMemo(() => bandMedia.findIndex(m => m.type === 'image'), [bandMedia])

  const safeActiveIndex = Math.min(
    Math.max(activeMaterialGroup, 0),
    Math.max(mergedGroups.length - 1, 0)
  )
  const activeGroup = Array.isArray(mergedGroups) ? mergedGroups[safeActiveIndex] : undefined
  const books = Array.isArray((activeGroup as any)?.books) ? (activeGroup as any).books : []
  const hasMaterialGroups = Array.isArray(mergedGroups) && mergedGroups.length > 0
  const flatMaterials =
    Array.isArray(product?.materials) && product.materials.length > 0 ? product.materials : []
  // FIX: Safely access `dimensionImages` (now added to Product type) and provide a fallback array to prevent errors when it's undefined.
  const dimImages = product?.dimensionImages?.filter(di => di?.image) ?? []
  const slideCount = bandMedia.length || 1

  // Hero için cloned media: [son, ...band, ilk] → yönü koruyan sonsuz kayma
  const heroMedia = useMemo(() => {
    if (slideCount <= 1) return bandMedia
    const first = bandMedia[0]
    const last = bandMedia[bandMedia.length - 1]
    return [last, ...bandMedia, first]
  }, [bandMedia, slideCount])
  const totalHeroSlides = heroMedia.length || 1

  // Ekran genişliğine göre mobil/desktop takibi
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Desktop thumbnail seçimi: aktif çerçevenin kayarak gitmesi için ölçüm
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return

    const updateIndicator = () => {
      const listEl = thumbListRef.current
      const targetEl = thumbButtonsRef.current[currentImageIndex]
      const scrollEl = thumbRef.current
      const indicatorEl = thumbIndicatorRef.current

      if (!listEl || !targetEl || !indicatorEl || isMobile) {
        setThumbIndicatorBox(prev => (prev.visible ? { ...prev, visible: false } : prev))
        return
      }

      const scrollLeft = scrollEl?.scrollLeft ?? 0
      const scrollTop = scrollEl?.scrollTop ?? 0

      setThumbIndicatorBox({
        left: targetEl.offsetLeft - scrollLeft,
        top: targetEl.offsetTop - scrollTop,
        width: targetEl.offsetWidth,
        height: targetEl.offsetHeight,
        visible: true,
      })
    }

    updateIndicator()

    window.addEventListener('resize', updateIndicator)
    const scrollEl = thumbRef.current
    scrollEl?.addEventListener('scroll', updateIndicator, { passive: true })

    return () => {
      window.removeEventListener('resize', updateIndicator)
      scrollEl?.removeEventListener('scroll', updateIndicator)
    }
  }, [currentImageIndex, bandMedia.length, isMobile])

  // HomePage hero medya mantığına benzer drag + sonsuz kayma sistemi
  const dragStartY = useRef<number>(0)
  const handleHeroDragStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (e.target instanceof HTMLElement && e.target.closest('a, button')) {
      return
    }
    const startX =
      'touches' in e && e.touches && e.touches.length > 0
        ? (e.touches[0]?.clientX ?? 0)
        : 'clientX' in e
          ? e.clientX
          : 0
    const startY =
      'touches' in e && e.touches && e.touches.length > 0
        ? (e.touches[0]?.clientY ?? 0)
        : 'clientY' in e
          ? e.clientY
          : 0
    setIsDragging(true)
    setDragStartX(startX)
    dragStartY.current = startY
    setDraggedX(0)
    // React 18+ touch event'leri varsayılan olarak passive olabilir;
    // bu nedenle sadece mouse olaylarında preventDefault çağır.
    if (!('touches' in e)) {
      e.preventDefault()
    }
  }

  const handleHeroDragMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!isDragging) return
    const currentX =
      'touches' in e && e.touches && e.touches.length > 0
        ? (e.touches[0]?.clientX ?? 0)
        : 'clientX' in e
          ? e.clientX
          : 0
    const currentY =
      'touches' in e && e.touches && e.touches.length > 0
        ? (e.touches[0]?.clientY ?? 0)
        : 'clientY' in e
          ? e.clientY
          : 0

    const deltaX = Math.abs(currentX - dragStartX)
    const deltaY = Math.abs(currentY - dragStartY.current)

    // Dikey scroll daha fazlaysa, yatay drag'ı iptal et ve sayfa scroll'una izin ver
    if (deltaY > deltaX && deltaY > 10) {
      setIsDragging(false)
      return
    }

    setDraggedX(currentX - dragStartX)
  }

  const handleHeroDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    if (draggedX < -DRAG_THRESHOLD) {
      heroNext()
    } else if (draggedX > DRAG_THRESHOLD) {
      heroPrev()
    }
    setDraggedX(0)
  }

  // currentImageIndex değiştiğinde mainImage'i güncelle (erken return'lerden önce)
  useEffect(() => {
    if (bandMedia.length > 0 && currentImageIndex < bandMedia.length) {
      const current = bandMedia[currentImageIndex]
      const newImage = current?.type === 'image' ? current.url : mainImage
      if (newImage && newImage !== mainImage) {
        setMainImage(newImage)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageIndex, bandMedia.length])

  // Ürün ilk yüklendiğinde ilk gösterilecek medyayı mümkünse görsel yap
  useEffect(() => {
    if (bandMedia.length > 0) {
      // Ana görsel bantta ilk sırada; değilse ilk görsel index'ine git
      const mainIdx = bandMedia.findIndex(m => m.type === 'image' && m.url === mainImageUrl)
      const idx = mainIdx >= 0 ? mainIdx : firstImageIndex >= 0 ? firstImageIndex : 0
      setCurrentImageIndex(idx)
      // Hero sonsuz kayma index'ini de ilk gerçek slide'a hizala
      if (slideCount > 1) {
        setHeroSlideIndex(idx + 1) // cloned dizide +1 offset
      } else {
        setHeroSlideIndex(0)
      }
      // mainImage'i anında güncelle (özellikle video ilkse boş kalmasın)
      const current = bandMedia[idx]
      if (current?.type === 'image' && current.url && current.url !== mainImage) {
        setMainImage(current.url)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bandMedia.length])

  // Ürün detay sayfası görüntülendiğinde e-ticaret event'i gönder
  useEffect(() => {
    if (!product) return
    analytics.trackEcommerce('view_product', product.id, (product as any)?.price)
  }, [product])

  // Hero geçişi bittiğinde cloned slide'lardan gerçek slide'a "snap" et (animasyonsuz)
  const handleHeroTransitionEnd = () => {
    if (slideCount <= 1) return
    if (!heroTransitionEnabled) return

    // Sonraki clone'dan ilk gerçeğe
    if (heroSlideIndex === totalHeroSlides - 1) {
      setHeroTransitionEnabled(false)
      setHeroSlideIndex(1)
      return
    }
    // Önceki clone'dan son gerçeğe
    if (heroSlideIndex === 0) {
      setHeroTransitionEnabled(false)
      setHeroSlideIndex(totalHeroSlides - 2)
    }
  }

  // Snap sonrasında transition'ı tekrar aç
  useEffect(() => {
    if (!heroTransitionEnabled) {
      const id = requestAnimationFrame(() => {
        setHeroTransitionEnabled(true)
      })
      return () => cancelAnimationFrame(id)
    }
    return
  }, [heroTransitionEnabled])

  if (loading) {
    return (
      <div className="pt-20">
        <PageLoading message={t('loading')} />
      </div>
    )
  }
  if (!product) {
    return (
      <div className="pt-20 text-center">
        <p className="text-gray-600">{t('product_not_found') || 'Ürün bulunamadı'}</p>
      </div>
    )
  }

  const heroNext = () => {
    if (slideCount <= 1) return
    if (!heroTransitionEnabled) return
    // Sonsuz kayma index'i: cloned dizide bir sağa
    setHeroSlideIndex(prev => prev + 1)
    // Mantıksal index (thumbnails, mainImage vs. için)
    setCurrentImageIndex(prev => (prev + 1) % slideCount)
    analytics.event({
      category: 'media',
      action: 'hero_next',
      label: t(product.name), // ID yerine ürün adı
    })
  }
  const heroPrev = () => {
    if (slideCount <= 1) return
    if (!heroTransitionEnabled) return
    setHeroSlideIndex(prev => prev - 1)
    setCurrentImageIndex(prev => (prev - 1 + slideCount) % slideCount)
    analytics.event({
      category: 'media',
      action: 'hero_prev',
      label: t(product.name),
    })
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    // YouTube iframe'i sıfırla
    setYtPlaying(false)
  }
  const openPanelLightbox = (index: number) => {
    setLightboxSource('panel')
    setLightboxImageIndex(index)
    const panels = (product as any)?.media || []
    const item = panels[index]
    if (item && item.type === 'youtube') {
      setYtPlaying(true)
    } else {
      setYtPlaying(false)
    }
    analytics.event({
      category: 'media',
      action: 'open_lightbox_panel',
      label: t(product.name),
      value: index,
    })
    setIsLightboxOpen(true)
  }
  const currentLightboxItems =
    lightboxSource === 'panel'
      ? Array.isArray((product as any)?.media)
        ? (product as any).media
        : []
      : bandMedia
  const nextImage = () => {
    setLightboxImageIndex(prevIndex => {
      const nextIdx = (prevIndex + 1) % (currentLightboxItems.length || 1)
      const target = currentLightboxItems[nextIdx]
      if (target?.type === 'youtube') {
        setYtPlaying(true)
      } else {
        setYtPlaying(false)
      }
      return nextIdx
    })
  }
  const prevImageFn = () => {
    setLightboxImageIndex(prevIndex => {
      const nextIdx =
        (prevIndex - 1 + (currentLightboxItems.length || 1)) % (currentLightboxItems.length || 1)
      const target = currentLightboxItems[nextIdx]
      if (target?.type === 'youtube') {
        setYtPlaying(true)
      } else {
        setYtPlaying(false)
      }
      return nextIdx
    })
  }

  // YouTube helpers
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null
    const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[1] && match[1].length === 11 ? match[1] : null
  }
  const toYouTubeEmbed = (
    url: string,
    { autoplay = true, controls = false }: { autoplay?: boolean; controls?: boolean } = {}
  ): string => {
    const id = getYouTubeId(url)
    if (!id) return url
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: '1',
      playsinline: '1',
      controls: controls ? '1' : '0',
      modestbranding: '1',
      rel: '0',
      enablejsapi: '1',
      iv_load_policy: '3',
      fs: '0',
      disablekb: controls ? '0' : '1',
      loop: '1',
      playlist: id,
    }).toString()
    return `https://www.youtube-nocookie.com/embed/${id}?${params}`
  }
  const youTubeThumb = (url: string): string => {
    const id = getYouTubeId(url)
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''
  }

  return (
    <div
      className={`min-h-screen transition-all duration-700 ease-out ${isPageVisible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-20'
        }`}
      style={{
        transform: isPageVisible ? 'translateY(0)' : 'translateY(80px)',
        backgroundColor: 'white',
      }}
    >
      {/* Local style for hiding scrollbar */}
      <div data-product-detail>
        <style>
          {`
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          /* Product Detail Hero - CSS override'larından koru */
          @media (max-width: 767px) {
            [data-product-detail] header > div:first-child {
              height: 60vh !important;
              min-height: 60vh !important;
              max-height: 60vh !important;
            }
          }
          @media (min-width: 768px) {
            [data-product-detail] header > div:first-child {
              height: 70vh !important;
              min-height: 70vh !important;
              max-height: 70vh !important;
            }
          }
          /* Mobilde sayfa scroll'unu düzelt */
          @media (max-width: 1023px) {
            /* Ana container ve body scroll düzeltmesi */
            html, body {
              overflow-x: hidden;
              overflow-y: auto !important;
              height: auto !important;
              min-height: 100vh;
            }
            /* Hero touch action */
            [data-product-detail] header > div:first-child {
              touch-action: pan-x pan-y;
            }
            /* Thumbnail container - yatay scroll korunmalı */
            [data-product-detail] header .hide-scrollbar {
              overflow-x: auto !important;
              overflow-y: visible !important;
            }
            /* Main içerik tam yükseklikte olmalı */
            [data-product-detail] {
              min-height: 100vh;
              overflow: visible !important;
            }
            [data-product-detail] main {
              touch-action: pan-y;
              -webkit-overflow-scrolling: touch;
              overflow: visible !important;
              height: auto !important;
              max-height: none !important;
              min-height: auto !important;
            }
            [data-product-detail] main > div {
              overflow: visible !important;
              height: auto !important;
              max-height: none !important;
            }
          }
        `}
        </style>
        {/* helpers */}
        {(() => null)()}
        {/* FULL-WIDTH HERO IMAGE */}
        <header className="relative w-full">
          <div
            className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden cursor-grab active:cursor-grabbing"
            style={{
              height: '60vh',
              minHeight: '60vh',
              maxHeight: '60vh',
            }}
            onMouseDown={handleHeroDragStart}
            onMouseMove={handleHeroDragMove}
            onMouseUp={handleHeroDragEnd}
            onMouseLeave={handleHeroDragEnd}
            onTouchStart={handleHeroDragStart}
            onTouchMove={handleHeroDragMove}
            onTouchEnd={handleHeroDragEnd}
          >
            <div
              className="flex h-full"
              style={{
                width: `${totalHeroSlides * 100}%`,
                transform: `translateX(calc(-${(heroSlideIndex * 100) / totalHeroSlides
                  }% + ${draggedX}px))`,
                transition: heroTransitionEnabled ? 'transform 0.3s ease-out' : 'none',
              }}
              onTransitionEnd={handleHeroTransitionEnd}
            >
              {heroMedia.map((m, index) => {
                if (!m) return null
                const shouldEagerLoad =
                  (slideCount <= 1 && index === 0) ||
                  (slideCount > 1 && index === 1) // cloned dizide ilk gerçek slide
                const isActiveSlide = heroSlideIndex === index
                return (
                  <div
                    key={index}
                    className="relative h-full shrink-0 bg-white flex items-center justify-center"
                    style={{ width: `${100 / totalHeroSlides}%` }}
                  >
                    {m.type === 'image' ? (
                      <OptimizedImage
                        src={m.url}
                        srcMobile={m.urlMobile}
                        srcDesktop={m.urlDesktop}
                        alt={`${t(product.name)} ${index + 1}`}
                        className={`w-full h-full object-contain ${imageBorderClass}`}
                        width={1600}
                        height={900}
                        loading={shouldEagerLoad ? 'eager' : 'lazy'}
                        fetchPriority={shouldEagerLoad ? 'high' : 'low'}
                        quality={90}
                      />
                    ) : m.type === 'video' ? (
                      <OptimizedVideo
                        src={m.url}
                        srcMobile={m.urlMobile}
                        srcDesktop={m.urlDesktop}
                        className={`w-full h-full object-contain ${imageBorderClass}`}
                        autoPlay={isActiveSlide}
                        muted
                        loop
                        playsInline
                        preload={shouldEagerLoad ? 'auto' : 'metadata'}
                        loading={shouldEagerLoad ? 'eager' : 'lazy'}
                      />
                    ) : (
                      <iframe
                        className="w-full h-full"
                        title="youtube-player"
                        src={toYouTubeEmbed(m.url, { autoplay: isActiveSlide })}
                        allow="autoplay; encrypted-media; fullscreen"
                        frameBorder="0"
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />

            {/* overlay breadcrumbs top-left */}
            <nav className="absolute top-4 left-4 text-sm text-white/80">
              <ol className="list-none p-0 inline-flex items-center gap-2">
                <li>
                  <Link to="/" className="hover:text-white uppercase underline underline-offset-4">
                    {t('homepage')}
                  </Link>
                </li>
                {category && (
                  <>
                    <li className="opacity-70">/</li>
                    <li>
                      <Link to={`/products/${category.id}`} className="hover:text-white">
                        {t(category.name)}
                      </Link>
                    </li>
                  </>
                )}
                <li className="opacity-70">/</li>
                <li className="text-white">{t(product.name)}</li>
              </ol>
            </nav>

            <div className="absolute bottom-10 md:bottom-10 left-6 md:left-10 text-white">
              <div style={{
                transform: isTitleVisible ? 'translateX(0)' : 'translateX(-40px)',
                opacity: isTitleVisible ? 1 : 0,
                transition: 'transform 1000ms ease-out, opacity 1000ms ease-out'
              }}>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg">
                  {t(product.name)}
                </h1>
              </div>
              {designer && (
                <div className="mt-2 text-white/80" style={{
                  transform: isDesignerVisible ? 'translateX(0)' : 'translateX(-40px)',
                  opacity: isDesignerVisible ? 1 : 0,
                  transition: 'transform 1000ms ease-out, opacity 1000ms ease-out'
                }}>
                  <Link to={`/designer/${designer.id}`} className="hover:text-white">
                    {t(designer.name)}
                  </Link>{' '}
                  — {product.year}
                </div>
              )}
            </div>

            {/* hero arrows - sadece desktop'ta göster - Modern Glassmorphism */}
            {slideCount > 1 && !isMobile && (
              <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-between px-4 xl:px-8">
                <button
                  type="button"
                  onClick={heroPrev}
                  className="group pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-black/40 active:scale-95"
                  style={arrowInLeft}
                  aria-label="Previous hero slide"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 transition-transform duration-300 group-hover:-translate-x-0.5"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={heroNext}
                  className="group pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-black/40 active:scale-95"
                  style={arrowInRight}
                  aria-label="Next hero slide"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}

            {/* Hero altındaki slider dot'ları (HomeHero ile aynı stil) */}
            {slideCount > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-4">
                {(() => {
                  // Klonlu dizideki index'ten gerçek slide index'ine normalize et
                  const normalizedSlideIndex =
                    slideCount <= 1
                      ? 0
                      : heroSlideIndex === 0
                        ? slideCount - 1
                        : heroSlideIndex === totalHeroSlides - 1
                          ? 0
                          : heroSlideIndex - 1

                  return bandMedia.map((_, index) => {
                    const isActive = index === normalizedSlideIndex
                    // Ortadaki dot'tan başlayarak sağa ve sola doğru animasyon
                    const centerIndex = Math.floor(bandMedia.length / 2)
                    const distanceFromCenter = Math.abs(index - centerIndex)
                    const isLeft = index < centerIndex
                    const animationDelay = distanceFromCenter * 50

                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (slideCount > 1) {
                            setHeroTransitionEnabled(false)
                            setHeroSlideIndex(index + 1) // cloned dizide +1 offset
                          } else {
                            setHeroSlideIndex(0)
                          }
                          setCurrentImageIndex(index)
                        }}
                        className={`relative rounded-full transition-all duration-500 ease-in-out group ${areDotsVisible ? 'animate-dot-height-grow' : 'h-0.5'
                          } ${isActive ? 'w-12 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                          } ${areDotsVisible
                            ? 'translate-x-0 opacity-100'
                            : isLeft
                              ? '-translate-x-[150%] opacity-0'
                              : 'translate-x-[250%] opacity-0'
                          }`}
                        style={{
                          transitionDelay: `${animationDelay}ms`,
                          ...(areDotsVisible ? {} : { height: '0.0625rem' }),
                        }}
                        aria-label={`Görsel ${index + 1}`}
                      >
                        {isActive && (
                          <div
                            key={`${normalizedSlideIndex}-${index}`}
                            className="absolute top-0 left-0 h-full rounded-full bg-white animate-fill-line"
                          ></div>
                        )}
                      </button>
                    )
                  })
                })()}
              </div>
            )}

            {/* Fullscreen button - sadece görsel varsa göster */}
            {bandMedia.length > 0 && (
              <div
                className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-20"
                style={{
                  opacity: isFullscreenButtonVisible ? 1 : 0,
                  transform: isFullscreenButtonVisible
                    ? 'translateX(0) rotate(0deg)'
                    : 'translateX(80px) rotate(90deg)',
                  transition:
                    'opacity 700ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  willChange: 'transform, opacity',
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    analytics.event({
                      category: 'media',
                      action: 'band_click',
                      label: product?.id,
                      value: currentImageIndex,
                    })
                    setIsFullscreenOpen(true)
                  }}
                className="group flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-black/40 active:scale-95"
                  aria-label="Büyüt"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 md:h-7 md:w-7 transition-transform duration-500"
                  >
                    <line x1="12" y1="4" x2="12" y2="20" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          {/* Divider and Thumbnails under hero */}
          <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Üst/alt çizgileri tek yerde tanımla: aynı renk/kalınlık */}
            <div className="mt-1 md:mt-2 border-y border-gray-300 py-3">
              {/* Hide scrollbar with custom class; enable drag scroll */}
              <div className="relative select-none">
                <div
                  ref={thumbRef}
                  className="hide-scrollbar overflow-x-auto cursor-grab active:cursor-grabbing"
                  onMouseDown={e => {
                    setThumbDragStartX(e.clientX)
                    setThumbScrollStart(thumbRef.current ? thumbRef.current.scrollLeft : 0)
                  }}
                  onMouseLeave={() => {
                    setThumbDragStartX(null)
                  }}
                  onMouseUp={() => {
                    setThumbDragStartX(null)
                  }}
                  onMouseMove={e => {
                    if (thumbDragStartX === null || !thumbRef.current) return
                    const delta = e.clientX - thumbDragStartX
                    thumbRef.current.scrollLeft = thumbScrollStart - delta
                  }}
                >
                  <div
                    ref={thumbListRef}
                    className="relative flex gap-3 min-w-max pb-2"
                  >
                    {!isMobile && (
                      <div
                        ref={thumbIndicatorRef}
                        aria-hidden="true"
                        className="pointer-events-none absolute z-10 rounded-none border-[1.5px] border-gray-400 transition-[transform,width,height,opacity] duration-350 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
                        style={{
                          transform: `translate3d(${thumbIndicatorBox.left}px, ${thumbIndicatorBox.top}px, 0)`,
                          width: thumbIndicatorBox.width || 0,
                          height: thumbIndicatorBox.height || 0,
                          opacity: thumbIndicatorBox.visible ? 1 : 0,
                        }}
                      />
                    )}
                    {bandMedia.map((m, idx) => (
                      <button
                        key={idx}
                        ref={el => {
                          thumbButtonsRef.current[idx] = el
                        }}
                        className={`relative z-20 flex-shrink-0 w-24 h-24 overflow-hidden rounded-none border-2 transition-all duration-300 ${currentImageIndex === idx ? 'border-transparent' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'}`}
                        onClick={() => {
                          // Thumbnail tıklanınca hero sonsuz kaydırma index'ini
                          // ilgili slide'a hizala ve ana görsel index'ini güncelle.
                          if (slideCount > 1) {
                            setHeroTransitionEnabled(false)
                            setHeroSlideIndex(idx + 1) // cloned dizide +1 offset
                          } else {
                            setHeroSlideIndex(0)
                          }
                          setCurrentImageIndex(idx)
                        }}
                      >
                        {m.type === 'image' ? (
                          <OptimizedImage
                            src={m.url}
                            alt={`${t(product.name)} thumbnail ${idx + 1}`}
                            className={`w-full h-full object-cover ${imageBorderClass}`}
                            loading="lazy"
                            quality={75}
                          />
                        ) : m.type === 'video' ? (
                          <div className={`w-full h-full bg-black/60 ${imageBorderClass}`} />
                        ) : (
                          <OptimizedImage
                            src={youTubeThumb(m.url)}
                            alt={`youtube thumb ${idx + 1}`}
                            className={`w-full h-full object-cover ${imageBorderClass}`}
                            loading="lazy"
                            quality={75}
                          />
                        )}
                        {(m.type === 'video' || m.type === 'youtube') && (
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <span className="bg-white/85 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center shadow">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-5 h-5 ml-0.5"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </span>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Scroll buttons */}
                <button
                  aria-label="scroll-left"
                  onClick={() => {
                    if (thumbRef.current) thumbRef.current.scrollBy({ left: -240, behavior: 'smooth' })
                  }}
                  className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded transition-transform hover:scale-105 active:scale-95 z-10"
                  style={{
                    left: '-60px',
                    width: '44px',
                    height: '44px',
                    backgroundColor: 'transparent',
                    color: '#4b5563'
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="33"
                    height="33"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="16 20 8 12 16 4" />
                  </svg>
                </button>
                <button
                  aria-label="scroll-right"
                  onClick={() => {
                    if (thumbRef.current) thumbRef.current.scrollBy({ left: 240, behavior: 'smooth' })
                  }}
                  className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded transition-transform hover:scale-105 active:scale-95 z-10"
                  style={{
                    right: '-60px',
                    width: '44px',
                    height: '44px',
                    backgroundColor: 'transparent',
                    color: '#4b5563'
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="33"
                    height="33"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="8 20 16 12 8 4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Breadcrumbs removed from here to move to gray area */}
            <div className="hidden"></div>
          </section>
        </header>

        {/* Tüm cihazlarda tam ekran viewer - iletişim sayfasındaki sistem ile aynı */}
        {isFullscreenOpen && bandMedia.length > 0 && (
          <FullscreenMediaViewer
            items={bandMedia.map(m => ({
              type: m.type,
              url: m.url,
              urlMobile: m.urlMobile,
              urlDesktop: m.urlDesktop,
            }))}
            initialIndex={currentImageIndex}
            onClose={() => setIsFullscreenOpen(false)}
          />
        )}

        {/* DETAILS BELOW */}
        <main className="bg-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12 pb-12">
            {/* Breadcrumbs - desktop ve mobile (artık gray alanda) */}
            <nav className="mb-8 text-[11px] sm:text-[12px] text-gray-700" aria-label="Breadcrumb">
              <ol className="list-none p-0 inline-flex items-center">
                <li>
                  <Link
                    to="/"
                    className="uppercase underline underline-offset-4 text-gray-900 hover:text-gray-900"
                  >
                    {t('homepage')}
                  </Link>
                </li>
                <li className="mx-2 font-light text-gray-400">|</li>
                {category && (
                  <>
                    <li>
                      <Link
                        to={`/products/${category.id}`}
                        className="uppercase underline underline-offset-4 text-gray-900 hover:text-gray-900"
                      >
                        {t(category.name)}
                      </Link>
                    </li>
                    <li className="mx-2 font-light text-gray-400">|</li>
                  </>
                )}
                <li className="font-light text-gray-500" aria-current="page">
                  {t(product.name)}
                </li>
              </ol>
            </nav>

            <section className="space-y-10">
              {product.buyable && product.price > 0 && (
                <div>
                  <p className="text-3xl font-light text-gray-600">
                    {new Intl.NumberFormat(locale, {
                      style: 'currency',
                      currency: product.currency || 'TRY',
                    }).format(product.price)}
                  </p>
                </div>
              )}

              <div>
                <h2 className="text-2xl md:text-4xl font-normal text-gray-700">{t(product.name)}</h2>
                <ScrollReveal delay={200}>
                  <p className="mt-3 text-gray-900 leading-relaxed max-w-2xl font-normal">
                    {t(product.description)}
                  </p>
                </ScrollReveal>
              </div>

              {/* Dimensions as small drawings (thumbnails) - MOVED BEFORE MATERIALS */}
              {dimImages.length > 0 && (
                <ScrollReveal delay={200} threshold={0.05}>
                  <div className="pb-4">
                    <h2 className="text-xl font-light text-gray-600">{t('dimensions')}</h2>
                    <div className="h-px bg-gray-300 my-4" />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {dimImages.map(
                        (
                          dimImg: {
                            image: string
                            imageMobile?: string
                            imageDesktop?: string
                            title?: LocalizedString
                          },
                          idx: number
                        ) => (
                          <div key={idx} className="flex flex-col items-center">
                            <button
                              onClick={() => setDimLightbox({ images: dimImages, currentIndex: idx })}
                              className="group border border-gray-200 transition-transform duration-200 p-3 bg-white rounded-none"
                            >
                              <OptimizedImage
                                src={dimImg.image}
                                srcMobile={dimImg.imageMobile}
                                srcDesktop={dimImg.imageDesktop}
                                alt={dimImg.title ? t(dimImg.title) : `${t('dimensions')} ${idx + 1}`}
                                className={`w-full h-40 object-contain group-hover:scale-[1.03] transition-transform duration-700 ease-in-out ${imageBorderClass}`}
                                loading="lazy"
                                quality={85}
                              />
                            </button>
                            {dimImg.title && (
                              <p className="mt-2 text-sm text-gray-600 text-center font-medium">
                                {t(dimImg.title)}
                              </p>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </ScrollReveal>
              )}

              {(hasMaterialGroups || flatMaterials.length > 0) && (
                <ScrollReveal delay={300} threshold={0.05}>
                  <div className="pb-4">
                    <h2 className="text-xl font-light text-gray-600 mb-4">
                      {t('material_alternatives')}
                    </h2>
                    {hasMaterialGroups ? (
                      <>
                        {/* Group tabs - similar to image design */}
                        <div className="flex flex-wrap gap-0 border-t border-b border-gray-400 mb-6 bg-gray-200">
                          {(Array.isArray(mergedGroups) ? mergedGroups : []).map((g: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => setActiveMaterialGroup(idx)}
                              className={`px-5 py-3 text-sm font-thin tracking-wider transition-all duration-200 border-b-2 rounded-none ${activeMaterialGroup === idx
                                ? 'bg-white text-gray-800 border-gray-500'
                                : 'bg-transparent text-gray-600 border-transparent hover:text-gray-800'
                                }`}
                            >
                              {t(g.groupTitle)}
                            </button>
                          ))}
                        </div>

                        {/* Swatch books (kartelalar) yatay sekmeler */}
                        {books.length > 0 ? (
                          <>
                            <div className="flex flex-wrap gap-0 border-b border-gray-200 mb-6">
                              {books.map((book: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => setActiveBookIndex(idx)}
                                  className={`px-4 py-2 text-sm font-thin tracking-wider transition-all duration-200 border-b-2 rounded-none ${activeBookIndex === idx
                                    ? 'bg-white text-gray-800 border-gray-500'
                                    : 'bg-transparent text-gray-600 border-transparent hover:text-gray-800'
                                    }`}
                                >
                                  {t(book.bookTitle)}
                                </button>
                              ))}
                            </div>

                            {/* Seçili kartelaya ait malzemeler */}
                            <div className="flex flex-wrap gap-6">
                              {(Array.isArray(books[activeBookIndex]?.materials)
                                ? books[activeBookIndex].materials
                                : []
                              ).map((material: any, index: number) => (
                                <div
                                  key={index}
                                  className="text-center group cursor-pointer"
                                  title={t(material.name)}
                                  onClick={() => {
                                    const allMaterials = Array.isArray(books[activeBookIndex]?.materials)
                                      ? books[activeBookIndex].materials
                                      : []
                                    setMaterialLightbox({
                                      images: allMaterials.map((m: any) => ({
                                        image: m.image,
                                        name: t(m.name),
                                      })),
                                      currentIndex: index,
                                    })
                                  }}
                                >
                                  <OptimizedImage
                                    src={material.image}
                                    alt={t(material.name)}
                                    className={`w-28 h-28 md:w-32 md:h-32 object-cover border border-gray-200 group-hover:border-gray-400 transition-all duration-200 shadow-sm group-hover:shadow-md ${imageBorderClass}`}
                                    loading="lazy"
                                    quality={80}
                                  />
                                  <p className="mt-3 text-xs md:text-sm text-gray-600 font-thin tracking-wider max-w-[120px] break-words">
                                    {t(material.name)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          /* Fallback: if no books, show materials directly */
                          <>
                            <div className="flex flex-wrap gap-6">
                              {(Array.isArray(grouped[safeActiveIndex]?.materials)
                                ? grouped[safeActiveIndex].materials
                                : []
                              ).map((material: any, index: number) => (
                                <div
                                  key={index}
                                  className="text-center group cursor-pointer"
                                  title={t(material.name)}
                                  onClick={() => {
                                    const allMaterials = Array.isArray(grouped[safeActiveIndex]?.materials)
                                      ? grouped[safeActiveIndex].materials
                                      : []
                                    setMaterialLightbox({
                                      images: allMaterials.map((m: any) => ({
                                        image: m.image,
                                        name: t(m.name),
                                      })),
                                      currentIndex: index,
                                    })
                                  }}
                                >
                                  <OptimizedImage
                                    src={material.image}
                                    alt={t(material.name)}
                                    className={`w-28 h-28 md:w-32 md:h-32 object-cover border border-gray-200 group-hover:border-gray-400 transition-all duration-200 shadow-sm group-hover:shadow-md ${imageBorderClass}`}
                                    loading="lazy"
                                    quality={80}
                                  />
                                  <p className="mt-3 text-xs md:text-sm text-gray-600 font-thin tracking-wider max-w-[120px] break-words">
                                    {t(material.name)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      /* Flat fallback: grouped malzeme yoksa product.materials listesini göster */
                      <div className="flex flex-wrap gap-6">
                        {flatMaterials.map((material: any, index: number) => (
                          <div
                            key={index}
                            className="text-center group cursor-pointer"
                            title={t(material.name)}
                            onClick={() => {
                              setMaterialLightbox({
                                images: flatMaterials.map((m: any) => ({
                                  image: m.image,
                                  name: t(m.name),
                                })),
                                currentIndex: index,
                              })
                            }}
                          >
                            <OptimizedImage
                              src={material.image}
                              alt={t(material.name)}
                              className={`w-28 h-28 md:w-32 md:h-32 object-cover border border-gray-200 group-hover:border-gray-400 transition-all duration-200 shadow-sm group-hover:shadow-md ${imageBorderClass}`}
                              loading="lazy"
                              quality={80}
                            />
                            <p className="mt-3 text-xs md:text-sm text-gray-600 font-thin tracking-wider max-w-[120px] break-words">
                              {t(material.name)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              )}

              {/* Designer section after materials */}
              <ProductDesignerSection designer={designer} t={t} />

              {product.buyable && (
                <ScrollReveal delay={500} threshold={0.05}>
                  <div className="pt-6 border-t border-gray-200">
                    <button
                      onClick={() => addToCart(product)}
                      className="group w-20 h-20 flex items-center justify-center bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-100 hover:shadow-lg"
                      aria-label={t('add_to_cart')}
                    >
                      <TransparentShoppingBagIcon />
                    </button>
                  </div>
                </ScrollReveal>
              )}

              {product.exclusiveContent && (
                <ProductExclusiveContentSection
                  exclusiveContent={product.exclusiveContent}
                  isLoggedIn={isLoggedIn}
                  user={user}
                  navigate={navigate}
                  imageBorderClass={imageBorderClass}
                  t={t}
                />
              )}

              {/* Benzer ürünler / Bunlar da ilginizi çekebilir - indirilebilir alanın altında */}
              {showRelatedProducts && relatedProducts.length > 0 && (
                <ScrollReveal delay={550} threshold={0.05}>
                  <div className="pt-10 border-t border-gray-200">
                    <h2 className="text-xl md:text-2xl font-normal text-gray-700 mb-4">
                      {t('related_products') || 'Benzer ürünler'}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
                      {relatedProducts.map((related, index) => (
                        <ScrollReveal
                          key={related.id}
                          delay={index < 8 ? index * 40 : 0}
                          threshold={0.05}
                        >
                          <ProductCard product={related} variant="light" />
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              )}

              {/* bottom prev/next removed; now overlay under menu */}
            </section>
            {Array.isArray((product as any)?.media) &&
              (product as any).media.length > 0 &&
              (product as any).showMediaPanels !== false && (
                <ProductMediaPanels
                  product={product}
                  imageBorderClass={imageBorderClass}
                  youTubeThumb={youTubeThumb}
                  openPanelLightbox={openPanelLightbox}
                  t={t}
                />
              )}
          </div>
        </main>

        {isLightboxOpen && (
          <div
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center"
            style={{ animationDuration: '0.2s' }}
          >
            <button
              onClick={prevImageFn}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 backdrop-blur-sm z-20"
              style={{
                width: '54px',
                height: '54px',
                backgroundColor: 'rgba(62, 60, 60, 0.5)',
                color: '#d3caca'
              }}
            >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="16 20 8 12 16 4" />
                      </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 backdrop-blur-sm z-20"
              style={{
                width: '54px',
                height: '54px',
                backgroundColor: 'rgba(62, 60, 60, 0.5)',
                color: '#d3caca'
              }}
            >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="8 20 16 12 8 4" />
                      </svg>
            </button>
            <div className="relative w-screen max-w-screen-2xl h-[80vh] p-2 overflow-hidden">
              <button
                onClick={closeLightbox}
                className="absolute top-2 right-2 text-white hover:opacity-75 transition-opacity z-[80] bg-black/50 rounded-full p-2"
              >
                <CloseIcon />
              </button>
              {currentLightboxItems[lightboxImageIndex]?.type === 'image' ? (
                <OptimizedImage
                  src={currentLightboxItems[lightboxImageIndex].url}
                  alt="Enlarged product view"
                  className="w-full h-full object-contain"
                  loading="eager"
                  quality={95}
                />
              ) : currentLightboxItems[lightboxImageIndex]?.type === 'video' ? (
                <OptimizedVideo
                  src={currentLightboxItems[lightboxImageIndex].url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                  preload="auto"
                  loading="eager"
                />
              ) : (
                <div className="relative w-full h-full">
                  {/* Doğrudan iframe'i göster, ortadaki büyük play butonu kaldırıldı */}
                  <iframe
                    ref={youTubePlayerRef as any}
                    className="w-full h-full pointer-events-auto"
                    title="youtube-player"
                    src={toYouTubeEmbed(currentLightboxItems[lightboxImageIndex]?.url || '', {
                      autoplay: true,
                      controls: false,
                    })}
                    allow="autoplay; encrypted-media; fullscreen"
                    frameBorder="0"
                    style={{ pointerEvents: 'auto' }}
                  />
                  <button
                    onClick={() => {
                      const next = !ytPlaying
                      try {
                        youTubePlayerRef.current?.contentWindow?.postMessage(
                          JSON.stringify({
                            event: 'command',
                            func: next ? 'playVideo' : 'pauseVideo',
                            args: [],
                          }),
                          '*'
                        )
                      } catch (error) {
                        // Cross-origin hatası olabilir, sessizce devam et
                        console.warn('YouTube player postMessage hatası:', error)
                      }
                      setYtPlaying(next)
                    }}
                    className="absolute bottom-4 right-4 z-[60] bg-white/85 text-gray-900 rounded-full w-12 h-12 flex items-center justify-center shadow hover:bg-white pointer-events-auto"
                  >
                    {ytPlaying ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6"
                      >
                        <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6 ml-0.5"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
              {/* Medya bilgileri overlay - sadece panel medyaları için göster */}
              {lightboxSource === 'panel' &&
                currentLightboxItems[lightboxImageIndex] &&
                (() => {
                  const currentItem = currentLightboxItems[lightboxImageIndex]

                  const linkUrl = currentItem?.link ? String(currentItem.link).trim() : ''
                  const linkText = currentItem?.linkText
                  const hasLink = linkUrl.length > 0
                  const hasLinkText =
                    linkText &&
                    (typeof linkText === 'string' ||
                      (typeof linkText === 'object' && Object.keys(linkText).length > 0))

                  return (
                    <div className="absolute bottom-2 left-2 max-w-md p-6 text-white z-[70] pointer-events-auto">
                      {currentItem.title && (
                        <h3 className="text-xl font-light mb-2">{t(currentItem.title)}</h3>
                      )}
                      {currentItem.description && (
                        <p className="text-sm text-white/90 leading-relaxed mb-3">
                          {t(currentItem.description)}
                        </p>
                      )}
                      {hasLink &&
                        hasLinkText &&
                        (() => {
                          const isExternal =
                            linkUrl.startsWith('http://') ||
                            linkUrl.startsWith('https://') ||
                            linkUrl.startsWith('//')

                          const linkContent = (
                            <span className="inline-flex items-center gap-2 text-white/90 hover:text-white font-light transition-all duration-300 cursor-pointer group">
                              <span className="relative">
                                <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-white/50 transition-all duration-300">
                                  {t(linkText)}
                                </span>
                                <span className="absolute bottom-0 left-0 w-0 h-px bg-white/50 group-hover:w-full transition-all duration-300"></span>
                              </span>
                              {isExternal && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
                                >
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                  <polyline points="15 3 21 3 21 9"></polyline>
                                  <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                              )}
                            </span>
                          )

                          return isExternal ? (
                            <a
                              href={linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => {
                                e.stopPropagation()
                              }}
                            >
                              {linkContent}
                            </a>
                          ) : (
                            <Link
                              to={linkUrl}
                              onClick={e => {
                                e.stopPropagation()
                                closeLightbox()
                              }}
                            >
                              {linkContent}
                            </Link>
                          )
                        })()}
                    </div>
                  )
                })()}
            </div>
          </div>
        )}

        {/* Dimension Images Modal */}
        {dimLightbox &&
          dimLightbox.images.length > 0 &&
          createPortal(
            <div
              className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center"
              onClick={() => setDimLightbox(null)}
            >
              <div
                className="relative flex items-center justify-center max-w-[90vw] max-h-[90vh] border border-gray-300 shadow-2xl overflow-hidden bg-transparent"
                onClick={e => e.stopPropagation()}
              >
      <button
        onClick={() => setDimLightbox(null)}
        className="absolute top-4 right-4 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/60 bg-white/70 backdrop-blur-md shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:text-gray-900 transition-colors"
        style={closeBtnAnimStyle}
        aria-label="Close"
      >
        <CloseIcon />
      </button>
                <div className="relative w-full h-full flex items-center justify-center">
                  {dimLightbox.images.length > 1 && (
                    <>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setDimLightbox({
                            ...dimLightbox,
                            currentIndex:
                              (dimLightbox.currentIndex - 1 + dimLightbox.images.length) %
                              dimLightbox.images.length,
                          })
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 backdrop-blur-sm z-10 w-10 h-10 md:w-14 md:h-14"
                        style={{
                          backgroundColor: 'rgba(62, 60, 60, 0.5)',
                          color: '#d3caca',
                          ...arrowInLeft,
                        }}
                        aria-label="Previous"
                      >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="16 20 8 12 16 4" />
                      </svg>
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setDimLightbox({
                            ...dimLightbox,
                            currentIndex:
                              (dimLightbox.currentIndex + 1) % dimLightbox.images.length,
                          })
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 backdrop-blur-sm z-10 w-10 h-10 md:w-14 md:h-14"
                        style={{
                          backgroundColor: 'rgba(62, 60, 60, 0.5)',
                          color: '#d3caca',
                          ...arrowInRight,
                        }}
                        aria-label="Next"
                      >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="8 20 16 12 8 4" />
                      </svg>
                      </button>
                    </>
                  )}
                  {(() => {
                    const currentImage = dimLightbox.images[dimLightbox.currentIndex]
                    if (!currentImage) return null
                    return (
                      <div className="flex items-center justify-center">
                        <OptimizedImage
                          src={currentImage.image}
                          alt={currentImage.title ? t(currentImage.title) : 'Technical Drawing'}
                          className="max-h-[82vh] max-w-[88vw] object-contain"
                          loading="eager"
                          quality={95}
                        />
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Material Images Modal */}
        {materialLightbox &&
          materialLightbox.images.length > 0 &&
          createPortal(
            <div
              className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center"
              onClick={() => setMaterialLightbox(null)}
            >
              <div
                className="relative flex items-center justify-center max-w-[90vw] max-h-[90vh] border border-gray-300 shadow-2xl overflow-hidden bg-transparent"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => setMaterialLightbox(null)}
                  className="absolute top-3 right-3 z-20 w-10 h-10 md:w-11 md:h-11 rounded-full border border-white/60 bg-white/70 backdrop-blur-md shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:text-gray-900 transition-colors"
                  style={closeBtnAnimStyle}
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
                <div className="relative w-full h-full flex items-center justify-center">
                  {materialLightbox.images.length > 1 && (
                    <>
                    <button
                        onClick={e => {
                          e.stopPropagation()
                          setMaterialLightbox({
                            ...materialLightbox,
                            currentIndex:
                              (materialLightbox.currentIndex - 1 + materialLightbox.images.length) %
                              materialLightbox.images.length,
                          })
                        }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 backdrop-blur-sm z-10 w-10 h-10 md:w-14 md:h-14"
                      style={{
                        backgroundColor: 'rgba(62, 60, 60, 0.5)',
                        color: '#d3caca',
                        ...arrowInLeft,
                      }}
                        aria-label="Previous"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="41"
                          height="41"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="16 20 8 12 16 4" />
                        </svg>
                      </button>
                    <button
                        onClick={e => {
                          e.stopPropagation()
                          setMaterialLightbox({
                            ...materialLightbox,
                            currentIndex:
                              (materialLightbox.currentIndex + 1) % materialLightbox.images.length,
                          })
                        }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 backdrop-blur-sm z-10 w-10 h-10 md:w-14 md:h-14"
                      style={{
                        backgroundColor: 'rgba(62, 60, 60, 0.5)',
                        color: '#d3caca',
                        ...arrowInRight,
                      }}
                        aria-label="Next"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="41"
                          height="41"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="8 20 16 12 8 4" />
                        </svg>
                      </button>
                    </>
                  )}
                  {materialLightbox.images[materialLightbox.currentIndex] &&
                    (() => {
                      const currentImage = materialLightbox.images[materialLightbox.currentIndex]
                      if (!currentImage) return null
                    return (
                      <div className="flex items-center justify-center">
                        <OptimizedImage
                          src={currentImage.image}
                          alt={currentImage.name}
                          className="max-h-[82vh] max-w-[88vw] object-contain"
                          loading="eager"
                          quality={95}
                        />
                      </div>
                    )
                    })()}
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Bottom Prev / Next controls - footer'ın hemen üzerinde */}
        {showBottomPrevNext && (prevProduct || nextProduct) && (
          <div className="bg-white border-t border-gray-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  {prevProduct ? (
                    <Link
                      to={`/product/${prevProduct.id}`}
                      className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      aria-label="Previous product"
                    >
                      <MinimalChevronLeft className="w-12 h-12 md:w-16 md:h-16" />
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>
                <div className="flex-1 text-right">
                  {nextProduct ? (
                    <Link
                      to={`/product/${nextProduct.id}`}
                      className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      aria-label="Next product"
                    >
                      <MinimalChevronRight className="w-12 h-12 md:w-16 md:h-16" />
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
