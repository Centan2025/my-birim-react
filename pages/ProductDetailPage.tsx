/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
import React, {useState, useEffect, useMemo, useRef} from 'react'
import {useParams, Link, useNavigate} from 'react-router-dom'
// FIX: Imported SiteSettings type to correctly type component state.
import type {LocalizedString} from '../types'
import {useAuth} from '../App'
import {OptimizedImage} from '../components/OptimizedImage'
import {OptimizedVideo} from '../components/OptimizedVideo'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {useCart} from '../context/CartContext'
import {useSEO} from '../src/hooks/useSEO'
import {FullscreenMediaViewer} from '../components/FullscreenMediaViewer'
import {addStructuredData, getProductSchema} from '../src/lib/seo'
import {analytics} from '../src/lib/analytics'
import {useProduct, useProductsByCategory} from '../src/hooks/useProducts'
import {useDesigner} from '../src/hooks/useDesigners'
import {useCategories} from '../src/hooks/useCategories'
import {useSiteSettings} from '../src/hooks/useSiteData'
import ScrollReveal from '../components/ScrollReveal'

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)


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
  const {productId} = useParams<{productId: string}>()
  const navigate = useNavigate()

  // React Query hooks
  const {data: product, isLoading: productLoading} = useProduct(productId)
  const {data: siteSettings} = useSiteSettings()
  const {data: allCategories = []} = useCategories()

  // Designer ve category'yi product'tan al
  const {data: designer} = useDesigner(product?.designerId)
  const {data: siblingProducts = []} = useProductsByCategory(product?.categoryId)
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
  const {isLoggedIn, user} = useAuth()
  const {t, locale} = useTranslation()
  const {addToCart} = useCart()
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
    images: {image: string; title?: LocalizedString}[]
    currentIndex: number
  } | null>(null)
  const [materialLightbox, setMaterialLightbox] = useState<{
    images: {image: string; name: string}[]
    currentIndex: number
  } | null>(null)
  // Thumbnails horizontal drag/scroll
  const thumbRef = useRef<HTMLDivElement | null>(null)
  const [thumbDragStartX, setThumbDragStartX] = useState<number | null>(null)
  const [thumbScrollStart, setThumbScrollStart] = useState<number>(0)

  // Sayfa animasyonu - ilk açılışta fade-in
  useEffect(() => {
    // PageTransition animasyonu kullanıldığı için bu animasyonu kaldırdık
    setIsPageVisible(true)
  }, [productId])

  // Sayfa başlığı + GA pageview: "Kategori Adı - Ürün Adı"
  useEffect(() => {
    if (!product) return
    if (typeof window === 'undefined') return

    const categoryName = category ? t(category.name) : ''
    const productName = t(product.name)
    const title = categoryName ? `${categoryName} - ${productName}` : productName
    if (typeof document !== 'undefined') {
      document.title = title
    }

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
  const {prevProduct, nextProduct} = useMemo(() => {
    if (!product || siblingProducts.length < 2) return {prevProduct: null, nextProduct: null}
    const currentIndex = siblingProducts.findIndex(p => p.id === product.id)
    if (currentIndex === -1) return {prevProduct: null, nextProduct: null}
    const prev = currentIndex > 0 ? siblingProducts[currentIndex - 1] : null
    const next =
      currentIndex < siblingProducts.length - 1 ? siblingProducts[currentIndex + 1] : null
    return {prevProduct: prev, nextProduct: next}
  }, [product, siblingProducts])
  // Bottom prev/next visibility from CMS settings
  const showBottomPrevNext = Boolean(siteSettings?.showProductPrevNext)

  // Aynı groupTitle'a sahip grupları tek bir sekme altında birleştir - erken return'lerden önce
  const grouped = useMemo(() => {
    if (!product) return []
    return Array.isArray((product as any).groupedMaterials) ? (product as any).groupedMaterials : []
  }, [product])

  const mergedGroups = useMemo(() => {
    const map = new Map<string, any>()
    ;(grouped || []).forEach((g: any) => {
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
          if (!byTitle.has(bKey)) byTitle.set(bKey, {bookTitle: b.bookTitle, materials: []})
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
      ? arw.filter(Boolean).map((u: string) => ({type: 'image' as const, url: u}))
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
    {autoplay = true, controls = false}: {autoplay?: boolean; controls?: boolean} = {}
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
      className={`min-h-screen transition-all duration-700 ease-out ${
        isPageVisible
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
              transform: `translateX(calc(-${
                (heroSlideIndex * 100) / totalHeroSlides
              }% + ${draggedX}px))`,
              transition: heroTransitionEnabled ? 'transform 0.3s ease-out' : 'none',
            }}
            onTransitionEnd={handleHeroTransitionEnd}
          >
            {heroMedia.map((m, index) => {
              if (!m) return null
              return (
                <div
                  key={index}
                  className="relative h-full shrink-0 bg-white flex items-center justify-center"
                  style={{width: `${100 / totalHeroSlides}%`}}
                >
                  {m.type === 'image' ? (
                    <OptimizedImage
                      src={m.url}
                      srcMobile={m.urlMobile}
                      srcDesktop={m.urlDesktop}
                      alt={`${t(product.name)} ${index + 1}`}
                      className={`w-full h-full object-contain ${imageBorderClass}`}
                      loading="eager"
                      quality={90}
                    />
                  ) : m.type === 'video' ? (
                    <OptimizedVideo
                      src={m.url}
                      srcMobile={m.urlMobile}
                      srcDesktop={m.urlDesktop}
                      className={`w-full h-full object-contain ${imageBorderClass}`}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      loading="eager"
                    />
                  ) : (
                    <iframe
                      className="w-full h-full"
                      title="youtube-player"
                      src={toYouTubeEmbed(m.url, {autoplay: true})}
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

          {/* hero arrows - sadece desktop'ta göster */}
          {!isMobile && (
            <>
              <button
                onClick={heroPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/35 hover:bg-black/55 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                aria-label="Previous hero slide"
              >
                ‹
              </button>
              <button
                onClick={heroNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/35 hover:bg-black/55 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                aria-label="Next hero slide"
              >
                ›
              </button>
            </>
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
                      className={`relative rounded-full transition-all duration-500 ease-in-out group ${
                        areDotsVisible ? 'animate-dot-height-grow' : 'h-0.5'
                      } ${
                        isActive ? 'w-12 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                      } ${
                        areDotsVisible
                          ? 'translate-x-0 opacity-100'
                          : isLeft
                            ? '-translate-x-[150%] opacity-0'
                            : 'translate-x-[250%] opacity-0'
                      }`}
                      style={{
                        transitionDelay: `${animationDelay}ms`,
                        ...(areDotsVisible ? {} : {height: '0.0625rem'}),
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
            <button
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
              className="group absolute bottom-3 right-3 md:bottom-4 md:right-4 bg-black/35 text-white rounded-full w-8 h-8 md:w-10 md:h-10 z-20 hover:scale-110 active:scale-95 flex items-center justify-center"
              style={{
                opacity: isFullscreenButtonVisible ? 1 : 0,
                transform: isFullscreenButtonVisible ? 'translateX(0)' : 'translateX(80px)',
                transition: 'opacity 700ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                willChange: 'transform, opacity',
              }}
              aria-label="Büyüt"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:scale-110 md:w-5 md:h-5"
              >
                <path d="M14 3h8v8M10 21h-8v-8" />
              </svg>
            </button>
          )}
        </div>
        {/* Divider and Thumbnails under hero */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="flex gap-3 min-w-max pb-2">
                  {bandMedia.map((m, idx) => (
                    <button
                      key={idx}
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
                      className={`relative flex-shrink-0 w-24 h-24 overflow-hidden border-2 transition-all duration-300 ${currentImageIndex === idx ? 'border-gray-400 shadow-md' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'}`}
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
                  if (thumbRef.current) thumbRef.current.scrollBy({left: -240, behavior: 'smooth'})
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
                  if (thumbRef.current) thumbRef.current.scrollBy({left: 240, behavior: 'smooth'})
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
          
          {/* Breadcrumbs - mobilde thumbnails bantının altında */}
          <nav className="lg:hidden py-8 mt-4 text-[11px] sm:text-[12px] text-gray-500" aria-label="Breadcrumb">
            <ol className="list-none p-0 inline-flex items-center">
              <li>
                <Link to="/" className="hover:text-gray-800 uppercase underline underline-offset-4">
                  {t('homepage')}
                </Link>
              </li>
              <li className="mx-2 font-light text-gray-400">|</li>
              {category && (
                <>
                  <li>
                    <Link
                      to={`/products/${category.id}`}
                      className="hover:text-gray-800 uppercase underline underline-offset-4"
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
        </div>
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-0 md:pt-24 lg:pt-12 pb-12">
          {/* Breadcrumbs - desktop'ta burada */}
          <nav className="hidden lg:block mb-8 text-[11px] sm:text-[12px] text-gray-500" aria-label="Breadcrumb">
            <ol className="list-none p-0 inline-flex items-center">
              <li>
                <Link to="/" className="hover:text-gray-800 uppercase underline underline-offset-4">
                  {t('homepage')}
                </Link>
              </li>
              <li className="mx-2 font-light text-gray-400">|</li>
              {category && (
                <>
                  <li>
                    <Link
                      to={`/products/${category.id}`}
                      className="hover:text-gray-800 uppercase underline underline-offset-4"
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
              <h2 className="text-2xl md:text-4xl font-light text-gray-600">{t(product.name)}</h2>
              <ScrollReveal delay={200}>
                <p className="mt-3 text-gray-500 leading-relaxed max-w-2xl font-light">
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
                          onClick={() => setDimLightbox({images: dimImages, currentIndex: idx})}
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

            {product.materials && grouped.length > 0 && (
              <ScrollReveal delay={300} threshold={0.05}>
                <div className="pb-4">
                <h2 className="text-xl font-light text-gray-600 mb-4">
                  {t('material_alternatives')}
                </h2>

                {/* Group tabs - similar to image design */}
                <div className="flex flex-wrap gap-0 border-t border-b border-gray-400 mb-6 bg-gray-200">
                  {(Array.isArray(mergedGroups) ? mergedGroups : []).map((g: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveMaterialGroup(idx)}
                      className={`px-5 py-3 text-sm font-thin tracking-wider transition-all duration-200 border-b-2 rounded-none ${
                        activeMaterialGroup === idx
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
                          className={`px-4 py-2 text-sm font-thin tracking-wider transition-all duration-200 border-b-2 rounded-none ${
                            activeBookIndex === idx
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
                </div>
              </ScrollReveal>
            )}

            {/* Designer section after materials */}
            {designer && (
              <ScrollReveal delay={400} threshold={0.05}>
                <section className="mt-10 bg-gray-200 text-gray-600 border-t border-b border-gray-400">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10">
                  <h2 className="text-xl font-thin text-gray-600 mb-4">{t('designer')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="w-full">
                      <OptimizedImage
                        src={
                          typeof designer.image === 'string'
                            ? designer.image
                            : designer.image?.url || ''
                        }
                        srcMobile={
                          typeof designer.image === 'object'
                            ? designer.image.urlMobile
                            : designer.imageMobile
                        }
                        srcDesktop={
                          typeof designer.image === 'object'
                            ? designer.image.urlDesktop
                            : designer.imageDesktop
                        }
                        alt={t(designer.name)}
                        className="w-full h-auto object-cover filter grayscale"
                        loading="lazy"
                        quality={85}
                      />
                    </div>
                    <div className="w-full">
                      <h3 className="text-2xl font-thin text-gray-600">{t(designer.name)}</h3>
                      <p className="mt-4 text-gray-500 font-light leading-relaxed">
                        {t(designer.bio).slice(0, 400)}
                        {t(designer.bio).length > 400 ? '…' : ''}
                      </p>
                      <Link
                        to={`/designer/${designer.id}`}
                        className="inline-block mt-6 text-gray-600 font-light underline underline-offset-4 hover:text-gray-800"
                      >
                        {t('discover_the_designer')}
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
              </ScrollReveal>
            )}

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
              <ScrollReveal delay={600} threshold={0.05}>
                <div className="relative rounded-none border border-gray-200 bg-white/70 backdrop-blur p-6 sm:p-8 pb-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-light text-gray-700">
                    İndirilebilir Dosyalar
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-none border border-gray-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                      {t('additional_images') || 'Ek Görseller'}
                    </div>
                    {product.exclusiveContent.images &&
                    product.exclusiveContent.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {product.exclusiveContent.images.map((img, idx) => (
                          <OptimizedImage
                            key={idx}
                            src={img}
                            alt={`exclusive-${idx}`}
                            className={`w-full aspect-video object-cover ${imageBorderClass}`}
                            loading="lazy"
                            quality={85}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Ek görsel bulunmuyor</p>
                    )}
                  </div>
                  <div className="rounded-none border border-gray-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                      {t('technical_drawings') || 'Teknik Çizimler'}
                    </div>
                    {product.exclusiveContent.drawings &&
                    product.exclusiveContent.drawings.length > 0 ? (
                      <ul className="space-y-2">
                        {product.exclusiveContent.drawings.map((doc, idx) => (
                          <li key={idx} className="group">
                            <a
                              href={doc.url}
                              download
                              onClick={e => {
                                const canDownload = isLoggedIn && user?.userType === 'full_member'
                                if (!canDownload) {
                                  e.preventDefault()
                                  navigate('/login')
                                }
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-none border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              <span className="shrink-0 text-gray-600 group-hover:text-gray-900">
                                <DownloadIcon />
                              </span>
                              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                {t(doc.name)}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 text-sm">Teknik çizim bulunmuyor</p>
                    )}
                  </div>
                  <div className="rounded-none border border-gray-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                      {t('3d_models') || '3D Modeller'}
                    </div>
                    {product.exclusiveContent.models3d &&
                    product.exclusiveContent.models3d.length > 0 ? (
                      <ul className="space-y-2">
                        {product.exclusiveContent.models3d.map((model, idx) => (
                          <li key={idx} className="group">
                            <a
                              href={model.url}
                              download
                              onClick={e => {
                                const canDownload = isLoggedIn && user?.userType === 'full_member'
                                if (!canDownload) {
                                  e.preventDefault()
                                  navigate('/login')
                                }
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-none border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              <span className="shrink-0 text-gray-600 group-hover:text-gray-900">
                                <DownloadIcon />
                              </span>
                              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                {t(model.name)}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 text-sm">3D model bulunmuyor</p>
                    )}
                  </div>
                </div>
                {/* Alt çizgi: kartın tam alt kenarında, kenarlara kadar */}
                <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-300" />
              </div>
              </ScrollReveal>
            )}

            {/* bottom prev/next removed; now overlay under menu */}
          </section>
          {Array.isArray((product as any)?.media) &&
            (product as any).media.length > 0 &&
            (product as any).showMediaPanels !== false && (
              <ScrollReveal delay={700} threshold={0.05}>
                <section className="mt-12">
                <h2 className="text-xl font-light text-gray-600 mb-4">
                  {(product as any)?.mediaSectionTitle &&
                  String((product as any).mediaSectionTitle).trim().length > 0
                    ? t((product as any).mediaSectionTitle)
                    : 'Projeler'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(product as any).media.map((m: any, idx: number) => (
                    <div key={idx} className="overflow-hidden">
                      <button
                        onClick={() => openPanelLightbox(idx)}
                        className="relative w-full aspect-video bg-gray-200 flex items-center justify-center"
                      >
                        {m.type === 'image' ? (
                          <OptimizedImage
                            src={m.url}
                            alt={`media-${idx}`}
                            className={`w-full h-full object-cover ${imageBorderClass}`}
                            loading="lazy"
                            quality={85}
                          />
                        ) : m.type === 'video' ? (
                          <div className={`w-full h-full bg-gray-300 ${imageBorderClass}`} />
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
                          <span className="pointer-events-none absolute bottom-2 right-2">
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
                      {m.title && (
                        <div className="px-1 pt-2 text-sm text-gray-600">{t(m.title)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
              </ScrollReveal>
            )}
        </div>
      </main>

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center"
          style={{animationDuration: '0.2s'}}
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
                  style={{pointerEvents: 'auto'}}
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
      {dimLightbox && dimLightbox.images.length > 0 && (
        <div
          className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDimLightbox(null)}
        >
          <div
            className="bg-white rounded-lg shadow-sm border border-gray-100 max-w-4xl w-full max-h-[90vh] overflow-auto relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setDimLightbox(null)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors z-20 p-2 hover:bg-gray-100 rounded-full"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
            <div className="p-8 relative">
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 backdrop-blur-sm z-10"
                    style={{
                      width: '54px',
                      height: '54px',
                      backgroundColor: 'rgba(62, 60, 60, 0.5)',
                      color: '#d3caca'
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
                      setDimLightbox({
                        ...dimLightbox,
                        currentIndex: (dimLightbox.currentIndex + 1) % dimLightbox.images.length,
                      })
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 backdrop-blur-sm z-10"
                    style={{
                      width: '54px',
                      height: '54px',
                      backgroundColor: 'rgba(62, 60, 60, 0.5)',
                      color: '#d3caca'
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
              {(() => {
                const currentImage = dimLightbox.images[dimLightbox.currentIndex]
                if (!currentImage) return null
                return (
                  <OptimizedImage
                    src={currentImage.image}
                    alt={currentImage.title ? t(currentImage.title) : 'Technical Drawing'}
                    className="w-full h-auto object-contain"
                    loading="eager"
                    quality={95}
                  />
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Material Images Modal */}
      {materialLightbox && materialLightbox.images.length > 0 && (
        <div
          className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-1"
          onClick={() => setMaterialLightbox(null)}
        >
          <div
            className="bg-white border border-gray-300 max-w-2xl w-full max-h-[98vh] overflow-hidden relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setMaterialLightbox(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 transition-colors z-20 p-1 hover:bg-gray-100 rounded-full"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
            <div className="relative">
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 backdrop-blur-sm z-10"
                    style={{
                      width: '54px',
                      height: '54px',
                      backgroundColor: 'rgba(62, 60, 60, 0.5)',
                      color: '#d3caca'
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 backdrop-blur-sm z-10"
                    style={{
                      width: '54px',
                      height: '54px',
                      backgroundColor: 'rgba(62, 60, 60, 0.5)',
                      color: '#d3caca'
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
                    <OptimizedImage
                      src={currentImage.image}
                      alt={currentImage.name}
                      className="w-full h-auto object-contain"
                      loading="eager"
                      quality={95}
                    />
                  )
                })()}
            </div>
          </div>
        </div>
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
