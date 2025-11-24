import React, {useState, useEffect, useRef} from 'react'
import {Link} from 'react-router-dom'
import {useSiteSettings} from '../src/hooks/useSiteData'
import {useHomePageContent} from '../src/hooks/useHomePage'
import type {SiteSettings, HomePageContent} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {OptimizedVideo} from '../components/OptimizedVideo'
import {useTranslation} from '../i18n'
import {useSEO} from '../src/hooks/useSEO'

const ArrowRight = (props: React.ComponentProps<'svg'>) => (
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
    {...props}
  >
    <path d="M5 12h14" />
  </svg>
)

const getYouTubeId = (url: string): string | null => {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

const YouTubeBackground: React.FC<{url: string; isMobile?: boolean}> = ({
  url,
  isMobile = false,
}) => {
  const videoId = getYouTubeId(url)
  if (!videoId) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <p className="text-white">Geçersiz YouTube URL'si</p>
      </div>
    )
  }
  return (
    <div
      className="absolute top-0 left-0 w-full h-full overflow-hidden"
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: 0,
      }}
    >
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        style={{
          pointerEvents: 'none',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          border: 'none',
          ...(isMobile
            ? {
                minWidth: '100%',
                maxWidth: '100%',
              }
            : {
                minWidth: '100%',
                minHeight: '100%',
                objectFit: 'cover',
              }),
        }}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&autohide=1&modestbranding=1&rel=0`}
        frameBorder="0"
        allow="autoplay; encrypted-media; fullscreen"
      ></iframe>
    </div>
  )
}

export function HomePage() {
  const {data: content} = useHomePageContent()
  const {data: settings} = useSiteSettings()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [inspirationImageHeight, setInspirationImageHeight] = useState<number | null>(null)
  const {t} = useTranslation()
  const imageBorderClass =
    settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'

  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [draggedX, setDraggedX] = useState(0)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return false
  })
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      // Scrollbar genişliğini hariç tutmak için clientWidth kullan
      return document.documentElement.clientWidth || window.innerWidth
    }
    return 0
  })
  const [heroHeight, setHeroHeight] = useState<number | null>(null)
  const DRAG_THRESHOLD = 50 // pixels
  const heroContainerRef = useRef<HTMLDivElement>(null)
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const innerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoPlayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Touch event'ler için non-passive listener'lar ekle
  useEffect(() => {
    const container = heroContainerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('a, button')) {
        return
      }
      setIsDragging(true)
      const startX = e.touches[0].clientX
      setDragStartX(startX)
      setDraggedX(0)
      e.preventDefault() // Non-passive listener olduğu için preventDefault çalışır
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      const currentX = e.touches[0].clientX
      setDraggedX(currentX - dragStartX)
      e.preventDefault() // Non-passive listener olduğu için preventDefault çalışır
    }

    const handleTouchEnd = () => {
      if (!isDragging) return
      setIsDragging(false)

      const slideCount = content?.heroMedia ? content.heroMedia.length : 1
      if (slideCount <= 1) {
        setDraggedX(0)
        return
      }

      if (draggedX < -DRAG_THRESHOLD) {
        const nextSlide = currentSlide + 1
        if (nextSlide >= slideCount) {
          if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current)
          }
          if (innerTimeoutRef.current) {
            clearTimeout(innerTimeoutRef.current)
          }
          setCurrentSlide(nextSlide)
          transitionTimeoutRef.current = setTimeout(() => {
            setIsTransitioning(true)
            requestAnimationFrame(() => {
              setCurrentSlide(0)
              requestAnimationFrame(() => {
                innerTimeoutRef.current = setTimeout(() => {
                  setIsTransitioning(false)
                  transitionTimeoutRef.current = null
                  innerTimeoutRef.current = null
                }, 16)
              })
            })
          }, 600)
        } else {
          setCurrentSlide(nextSlide)
        }
      } else if (draggedX > DRAG_THRESHOLD) {
        const prevSlide = currentSlide - 1
        if (prevSlide < 0) {
          if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current)
          }
          if (innerTimeoutRef.current) {
            clearTimeout(innerTimeoutRef.current)
          }
          setCurrentSlide(prevSlide)
          transitionTimeoutRef.current = setTimeout(() => {
            setIsTransitioning(true)
            requestAnimationFrame(() => {
              setCurrentSlide(slideCount - 1)
              requestAnimationFrame(() => {
                innerTimeoutRef.current = setTimeout(() => {
                  setIsTransitioning(false)
                  transitionTimeoutRef.current = null
                  innerTimeoutRef.current = null
                }, 16)
              })
            })
          }, 600)
        } else {
          setCurrentSlide(prevSlide)
        }
      }
      setDraggedX(0)
    }

    // Non-passive listener'lar ekle (passive: false)
    container.addEventListener('touchstart', handleTouchStart, {passive: false})
    container.addEventListener('touchmove', handleTouchMove, {passive: false})
    container.addEventListener('touchend', handleTouchEnd, {passive: false})

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, dragStartX, draggedX, currentSlide, content])

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      // Scrollbar genişliğini hariç tutmak için clientWidth kullan
      const vw = document.documentElement.clientWidth || window.innerWidth
      setIsMobile(mobile)
      setViewportWidth(vw)
    }
    checkMobile()
    
    // Debounce resize event'i
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(checkMobile, 150)
    }
    
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeout) clearTimeout(resizeTimeout)
    }
  }, [])

  // Content yüklendikten sonra hero height'ı hesapla (sadece mobil için)
  // DOM manipülasyonu yapmıyoruz, sadece state güncelliyoruz

  // Desktop için DOM manipülasyonu yapmıyoruz, inline style'lar yeterli

  const handleDragStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (e.target instanceof HTMLElement && e.target.closest('a, button')) {
      return
    }
    setIsDragging(true)
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX
    setDragStartX(startX)
    setDraggedX(0)
    // preventDefault sadece mouse event'lerde çalışır, touch event'ler için useEffect'te non-passive listener kullanıyoruz
    if (!('touches' in e)) {
      e.preventDefault()
    }
  }

  const handleDragMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!isDragging) return
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX
    setDraggedX(currentX - dragStartX)
    // preventDefault sadece mouse event'lerde çalışır, touch event'ler için useEffect'te non-passive listener kullanıyoruz
    if (!('touches' in e)) {
      e.preventDefault()
    }
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const slideCount = content?.heroMedia ? content.heroMedia.length : 1
    if (slideCount <= 1) {
      setDraggedX(0)
      return
    }

    if (draggedX < -DRAG_THRESHOLD) {
      // Sağa kaydır (sonraki slide)
      const nextSlide = currentSlide + 1

      // Eğer son slide'dan sonraki klona geçiyorsak, animasyon bitene kadar bekle sonra gerçek ilk slide'a geç
      if (nextSlide >= slideCount) {
        // Önceki timeout'ları temizle
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current)
        }
        if (innerTimeoutRef.current) {
          clearTimeout(innerTimeoutRef.current)
        }
        setCurrentSlide(nextSlide) // Klona geç
        // Animasyon bitene kadar bekle (600ms) sonra gerçek ilk slide'a geç
        transitionTimeoutRef.current = setTimeout(() => {
          // Transition'ı kapat
          setIsTransitioning(true)
          // Bir sonraki frame'de currentSlide'ı değiştir (transition kapalıyken)
          requestAnimationFrame(() => {
            setCurrentSlide(0)
            // Bir frame daha bekle ve transition'ı tekrar aç
            requestAnimationFrame(() => {
              innerTimeoutRef.current = setTimeout(() => {
                setIsTransitioning(false)
                transitionTimeoutRef.current = null
                innerTimeoutRef.current = null
              }, 16) // Bir frame süresi (~16ms)
            })
          })
        }, 600)
      } else {
        setCurrentSlide(nextSlide)
      }
    } else if (draggedX > DRAG_THRESHOLD) {
      // Sola kaydır (önceki slide)
      const prevSlide = currentSlide - 1

      // Eğer ilk slide'dan önceki klona geçiyorsak, animasyon bitene kadar bekle sonra gerçek son slide'a geç
      if (prevSlide < 0) {
        // Önceki timeout'ları temizle
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current)
        }
        if (innerTimeoutRef.current) {
          clearTimeout(innerTimeoutRef.current)
        }
        setCurrentSlide(prevSlide) // Klona geç
        // Animasyon bitene kadar bekle (600ms) sonra gerçek son slide'a geç
        transitionTimeoutRef.current = setTimeout(() => {
          // Transition'ı kapat
          setIsTransitioning(true)
          // Bir sonraki frame'de currentSlide'ı değiştir (transition kapalıyken)
          requestAnimationFrame(() => {
            setCurrentSlide(slideCount - 1)
            // Bir frame daha bekle ve transition'ı tekrar aç
            requestAnimationFrame(() => {
              innerTimeoutRef.current = setTimeout(() => {
                setIsTransitioning(false)
                transitionTimeoutRef.current = null
                innerTimeoutRef.current = null
              }, 16) // Bir frame süresi (~16ms)
            })
          })
        }, 600)
      } else {
        setCurrentSlide(prevSlide)
      }
    }
    setDraggedX(0)
  }


  // SEO
  useSEO({
    title: 'BIRIM - Ana Sayfa',
    description: 'BIRIM - Modern tasarım ve mimari çözümler',
    image: content?.heroMedia?.[0]?.url || undefined,
    type: 'website',
    siteName: 'BIRIM',
    locale: 'tr_TR',
  })

  // İlham görselinin yüksekliğini hesapla (mobilde)
  useEffect(() => {
    const bgImg = content?.inspirationSection?.backgroundImage
    const bgImgUrl = bgImg ? (typeof bgImg === 'string' ? bgImg : bgImg.url) : ''
    if (!isMobile || !bgImgUrl) {
      setInspirationImageHeight(null)
      return
    }

    const img = new Image()
    img.onload = () => {
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth
      // Görselin genişliği viewport genişliğine eşit olacak, yüksekliği orantılı olarak hesapla
      const aspectRatio = img.height / img.width
      const calculatedHeight = viewportWidth * aspectRatio
      // Bölüm yüksekliğini görsel yüksekliğinden %20 daha az yap
      setInspirationImageHeight(calculatedHeight * 0.8)
    }
    img.onerror = () => {
      setInspirationImageHeight(null)
    }
    img.src = bgImgUrl
  }, [isMobile, content?.inspirationSection?.backgroundImage, viewportWidth])

  // Klonlardan gerçek slide'a geçiş kontrolü için state
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Cleanup timeout'ları component unmount olduğunda
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
      if (innerTimeoutRef.current) {
        clearTimeout(innerTimeoutRef.current)
      }
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current)
      }
    }
  }, [])

  // Otomatik geçiş için interval
  useEffect(() => {
    // Önceki interval'ı temizle
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current)
      autoPlayIntervalRef.current = null
    }

    // Otomatik geçiş kapalıysa veya içerik yoksa çık
    if (!content?.heroMedia || content.heroMedia.length <= 1) {
      return
    }

    // Sadece açıkça true olduğunda çalış (false veya undefined ise çalışma)
    if (content.heroAutoPlay !== true) {
      return
    }

    // Sürükleme veya geçiş yapılıyorsa bekle
    if (isDragging || isTransitioning) return
    // Otomatik geçiş interval'ını başlat (5 saniyede bir)
    autoPlayIntervalRef.current = setInterval(() => {
      if (isDragging || isTransitioning) return
      if (content?.heroAutoPlay !== true) {
        // Eğer otomatik geçiş kapatıldıysa interval'ı durdur
        if (autoPlayIntervalRef.current) {
          clearInterval(autoPlayIntervalRef.current)
          autoPlayIntervalRef.current = null
        }
        return
      }

      const slideCount = content.heroMedia.length
      setCurrentSlide(prev => {
        const next = prev + 1
        if (next >= slideCount) {
          // Son slide'dan ilk slide'a geç
          return 0
        }
        return next
      })
    }, 5000) // 5 saniye

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current)
        autoPlayIntervalRef.current = null
      }
    }
  }, [content?.heroMedia, content?.heroAutoPlay, isDragging, isTransitioning])

  // Klonlardan gerçek slide'a geçiş kontrolü - sadece otomatik geçiş için (drag değil)
  useEffect(() => {
    if (!content?.heroMedia) return
    const slideCount = content.heroMedia.length || 1
    if (slideCount <= 1 || isDragging || isTransitioning) return

    // Otomatik geçiş sırasında klonlara geçildiyse düzelt
    // (handleDragEnd zaten bunu yönetiyor)
    if (currentSlide >= slideCount) {
      const timer = setTimeout(() => {
        setIsTransitioning(true)
        setTimeout(() => {
          setCurrentSlide(0)
          setIsTransitioning(false)
        }, 10)
      }, 650)
      return () => clearTimeout(timer)
    }

    if (currentSlide < 0) {
      const timer = setTimeout(() => {
        setIsTransitioning(true)
        setTimeout(() => {
          setCurrentSlide(slideCount - 1)
          setIsTransitioning(false)
        }, 10)
      }, 650)
      return () => clearTimeout(timer)
    }
  }, [currentSlide, content, isDragging, isTransitioning])

  // Mobilde Hero container yüksekliğini medyanın gerçek boyutuna göre ayarla
  useEffect(() => {
    if (!isMobile || !content?.heroMedia) return

    const updateHeroHeight = () => {
      const heroContainer = heroContainerRef.current
      if (!heroContainer) return

      // Normalize edilmiş slide index'ini bul
      const slideCount = content.heroMedia.length || 1
      const normalizedSlide =
        currentSlide < 0 ? slideCount - 1 : currentSlide >= slideCount ? 0 : currentSlide

      // Klonlar dahil gerçek slide index'ini bul
      const realIndex = normalizedSlide + 1 // +1 çünkü ilk klon var

      // Aktif slide'ı bul
      const slides = heroContainer.querySelectorAll('.hero-slide-mobile')
      const activeSlide = slides[realIndex] as HTMLElement
      if (!activeSlide) return

      // Medya elementini bul (video veya img)
      const mediaElement = activeSlide.querySelector('video, img') as
        | HTMLVideoElement
        | HTMLImageElement
      if (!mediaElement) return

      const updateHeight = () => {
        // Önce container genişliğini al
        const containerWidth =
          viewportWidth || window.innerWidth || heroContainer.getBoundingClientRect().width

        // Medyanın aspect ratio'sunu kullanarak yüksekliği hesapla
        let calculatedHeight = 0

        if (mediaElement instanceof HTMLVideoElement) {
          if (mediaElement.videoWidth > 0 && mediaElement.videoHeight > 0) {
            const aspectRatio = mediaElement.videoWidth / mediaElement.videoHeight
            calculatedHeight = containerWidth / aspectRatio
          }
        } else if (mediaElement instanceof HTMLImageElement) {
          if (mediaElement.naturalWidth > 0 && mediaElement.naturalHeight > 0) {
            const aspectRatio = mediaElement.naturalWidth / mediaElement.naturalHeight
            calculatedHeight = containerWidth / aspectRatio
          }
        }

        // Eğer hesaplama başarısız olduysa, render edilmiş yüksekliği ölç
        if (calculatedHeight <= 0) {
          const mediaRect = mediaElement.getBoundingClientRect()
          if (mediaRect.height > 0) {
            calculatedHeight = mediaRect.height
          }
        }

        if (calculatedHeight > 0) {
          setHeroHeight(calculatedHeight)
          // Container yüksekliğini de ayarla
          if (heroContainer) {
            heroContainer.style.height = `${calculatedHeight}px`
            heroContainer.style.minHeight = `${calculatedHeight}px`
            heroContainer.style.maxHeight = `${calculatedHeight}px`
          }
          // Slide container'ının yüksekliğini de ayarla
          if (activeSlide) {
            activeSlide.style.height = `${calculatedHeight}px`
            activeSlide.style.minHeight = `${calculatedHeight}px`
          }
        }
      }

      // Medya yüklenene kadar bekle
      if (mediaElement instanceof HTMLVideoElement) {
        if (mediaElement.readyState >= 2) {
          // HAVE_CURRENT_DATA
          setTimeout(updateHeight, 50)
        } else {
          mediaElement.addEventListener(
            'loadedmetadata',
            () => {
              setTimeout(updateHeight, 50)
            },
            {once: true}
          )
          mediaElement.addEventListener(
            'loadeddata',
            () => {
              setTimeout(updateHeight, 50)
            },
            {once: true}
          )
        }
      } else if (mediaElement instanceof HTMLImageElement) {
        if (mediaElement.complete && mediaElement.naturalHeight > 0) {
          setTimeout(updateHeight, 50)
        } else {
          mediaElement.addEventListener(
            'load',
            () => {
              setTimeout(updateHeight, 50)
            },
            {once: true}
          )
        }
      }
    }

    // Slide değiştiğinde veya viewport genişliği değiştiğinde güncelle
    const timeoutId = setTimeout(updateHeroHeight, 100)
    return () => clearTimeout(timeoutId)
  }, [isMobile, content, currentSlide, viewportWidth])

  // İlham görselinin yüksekliğini hesapla - hook'lar early return'den önce olmalı
  useEffect(() => {
    const inspiration = content?.inspirationSection
    const bgImg = inspiration?.backgroundImage
    const bgImgUrl = bgImg ? (typeof bgImg === 'string' ? bgImg : bgImg.url) : ''
    if (!bgImgUrl) {
      setInspirationImageHeight(null)
      return
    }

    const img = new Image()
    img.onload = () => {
      if (isMobile) {
        // Mobilde görsel genişliği viewport genişliğine eşit, yüksekliği orantılı
        const vw = document.documentElement.clientWidth || window.innerWidth
        const aspectRatio = img.height / img.width
        const calculatedHeight = vw * aspectRatio
        // Bölüm yüksekliğini görsel yüksekliğinden %20 daha az yap
        setInspirationImageHeight(calculatedHeight * 0.8)
      } else {
        // Desktop'ta görsel cover olarak kullanılıyor, minimum yükseklik ayarla
        setInspirationImageHeight(Math.max(img.height, 400))
      }
    }
    img.onerror = () => {
      setInspirationImageHeight(null)
    }
    img.src = bgImgUrl
  }, [content?.inspirationSection?.backgroundImage, isMobile])

  if (!content || !settings) {
    return <div className="h-screen w-full bg-gray-800" />
  }

  const heroMedia = Array.isArray(content.heroMedia) ? content.heroMedia : []
  const slideCount = heroMedia.length || 1
  const inspiration = content.inspirationSection || {
    backgroundImage: '',
    title: '',
    subtitle: '',
    buttonText: '',
    buttonLink: '/',
  }

  // Helper: backgroundImage string veya object olabilir
  const bgImageUrl = inspiration.backgroundImage
    ? typeof inspiration.backgroundImage === 'string'
      ? inspiration.backgroundImage
      : inspiration.backgroundImage.url
    : ''
  const bgImageMobile =
    inspiration.backgroundImage && typeof inspiration.backgroundImage === 'object'
      ? inspiration.backgroundImage.urlMobile
      : undefined
  const bgImageDesktop =
    inspiration.backgroundImage && typeof inspiration.backgroundImage === 'object'
      ? inspiration.backgroundImage.urlDesktop
      : undefined

  // Infinite carousel için klonlanmış slide'lar
  // Son slide'ı başa, ilk slide'ı sona ekle
  const clonedMedia =
    slideCount > 1
      ? [
          heroMedia[heroMedia.length - 1], // Son slide başa
          ...heroMedia,
          heroMedia[0], // İlk slide sona
        ]
      : heroMedia
  const totalSlides = clonedMedia.length

  // Transform hesaplama: klonlar dahil
  // currentSlide 0'dan slideCount-1'e kadar
  // Transform: -(currentSlide + 1) * (100 / totalSlides)%
  // +1 çünkü ilk klon var
  const getTransform = () => {
    if (slideCount <= 1) return 'translateX(0%)'
    // currentSlide'ı normalize et (klonlar hariç, 0 ile slideCount-1 arası)
    const normalizedSlide =
      currentSlide < 0 ? slideCount - 1 : currentSlide >= slideCount ? 0 : currentSlide
    
    // Mobilde px bazlı, desktop'ta yüzde bazlı hesaplama
    if (isMobile && viewportWidth > 0) {
      // Mobilde her slide viewport genişliğinde
      const slideWidth = viewportWidth
      const translateX = -(normalizedSlide + 1) * slideWidth
      return `translateX(calc(${translateX}px + ${draggedX}px))`
    } else {
      // Desktop'ta: Her slide hero container'ın %100 genişliğinde
      // Scroll container genişliği: totalSlides * 100%
      // Transform: -(normalizedSlide + 1) * 100%
      // +1 çünkü ilk klon var (index 0)
      const translateX = -(normalizedSlide + 1) * 100
      return `translateX(calc(${translateX}% + ${draggedX}px))`
    }
  }

  return (
    <div
      className={`bg-gray-100 text-gray-800 ${isMobile ? 'hero-page-container-mobile' : ''}`}
      style={
        isMobile && viewportWidth > 0
          ? {
              width: `${viewportWidth}px`,
              maxWidth: `${viewportWidth}px`,
              overflowX: 'hidden',
              margin: 0,
              padding: 0,
              left: 0,
              right: 0,
            }
          : {}
      }
    >
      {/* Hero Section */}
      {heroMedia.length > 0 ? (
        <div
          ref={heroContainerRef}
          className={`relative ${isMobile ? '' : 'h-screen'} md:h-screen overflow-hidden cursor-grab active:cursor-grabbing`}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          style={
            {
              padding: 0,
              margin: 0,
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollSnapType: 'none',
              scrollBehavior: 'auto',
              WebkitOverflowScrolling: 'auto',
              boxSizing: 'border-box',
              position: 'relative',
              ...(isMobile && heroHeight
                ? {
                    height: `${heroHeight}px`,
                    minHeight: `${heroHeight}px`,
                    maxHeight: `${heroHeight}px`,
                  }
                : {}),
            } as React.CSSProperties
          }
        >
          <style>{`
            .hero-scroll-container::-webkit-scrollbar {
              display: none;
            }
            /* Desktop override - mobil style'ları geçersiz kıl */
            @media (min-width: 1024px) {
              .hero-page-container-mobile {
                width: 100% !important;
                max-width: 100% !important;
                overflow: hidden !important;
              }
              /* Hero container - parent */
              div[class*="relative"][class*="h-screen"] {
                width: 100% !important;
                max-width: 100% !important;
                overflow: hidden !important;
                position: relative !important;
              }
              .hero-scroll-container {
                width: auto !important;
                min-width: auto !important;
                max-width: none !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                position: relative !important;
                display: flex !important;
                flex-wrap: nowrap !important;
              }
              .hero-slide-mobile,
              .hero-scroll-container > div {
                /* Inline style'daki genişlik değerini koru, CSS override etmesin */
                height: 100% !important;
                margin-left: 0 !important;
                padding-left: 0 !important;
                flex-shrink: 0 !important;
                flex-grow: 0 !important;
              }
              .hero-slide-mobile video,
              .hero-slide-mobile img,
              .hero-scroll-container video,
              .hero-scroll-container img,
              .hero-slide-mobile iframe,
              .hero-scroll-container iframe {
                width: 100% !important;
                max-width: 100% !important;
                min-width: 100% !important;
                height: 100% !important;
                min-height: 100% !important;
                object-fit: cover !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                transform: none !important;
                border: none !important;
              }
            }
            @media (max-width: 1023px) {
              .inspiration-section-mobile {
                width: 100vw !important;
                max-width: 100vw !important;
                margin-left: calc(-50vw + 50%) !important;
                margin-right: calc(-50vw + 50%) !important;
                left: 0 !important;
                right: 0 !important;
                position: relative !important;
                box-sizing: border-box !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                overflow: hidden !important;
              }
              .inspiration-section-mobile[style*="backgroundImage"] {
                background-size: 100vw auto !important;
                background-position: left center !important;
                background-repeat: no-repeat !important;
              }
              body {
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              html {
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              #root {
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
              }
              main {
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .hero-page-container-mobile {
                width: 100vw !important;
                max-width: 100vw !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                overflow-x: hidden !important;
                box-sizing: border-box !important;
                position: relative !important;
                left: 0 !important;
                right: 0 !important;
              }
              .hero-main-container-mobile {
                width: 100vw !important;
                max-width: 100vw !important;
                min-width: 100vw !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding: 0 !important;
                overflow-x: auto !important;
                overflow-y: hidden !important;
                box-sizing: border-box !important;
                position: relative !important;
                left: 0 !important;
                right: 0 !important;
                scroll-snap-type: x mandatory !important;
                scroll-padding: 0 !important;
                scroll-behavior: auto !important;
                -webkit-overflow-scrolling: touch !important;
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
                overscroll-behavior-x: contain !important;
              }
              .hero-main-container-mobile::-webkit-scrollbar {
                display: none !important;
              }
              .hero-scroll-container {
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                overflow-x: visible !important;
                overflow-y: hidden !important;
                box-sizing: border-box !important;
                position: relative !important;
                display: flex !important;
                flex-wrap: nowrap !important;
                scroll-snap-type: none !important;
                will-change: transform !important;
                /* Genişlik inline style'dan gelecek, CSS override etmesin */
              }
              .hero-slide-mobile,
              .hero-slide-mobile[style] {
                /* Genişlik inline style'dan gelecek, CSS override etmesin */
                height: auto !important;
                min-height: auto !important;
                flex-shrink: 0 !important;
                flex-grow: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: hidden !important;
                position: relative !important;
                box-sizing: border-box !important;
                left: 0 !important;
                right: 0 !important;
                scroll-snap-align: start !important;
                scroll-snap-stop: always !important;
                scroll-margin: 0 !important;
              }
              .hero-slide-mobile video,
              .hero-slide-mobile video[style],
              .hero-slide-mobile video.w-full,
              .hero-slide-mobile video.h-full,
              .hero-video-mobile,
              .hero-video-mobile[style],
              video.hero-video-mobile,
              video.hero-video-mobile[style],
              video.w-full.hero-video-mobile,
              video.h-full.hero-video-mobile,
              .hero-slide-mobile > video,
              .hero-slide-mobile > video[style],
              .hero-slide-mobile video.w-full.h-full,
              .hero-slide-mobile video.object-contain,
              .hero-slide-mobile video.absolute,
              .hero-slide-mobile video.inset-0 {
                display: block !important;
                width: 100vw !important;
                min-width: 100vw !important;
                max-width: 100vw !important;
                height: auto !important;
                min-height: auto !important;
                left: 0 !important;
                right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                object-fit: contain !important;
                object-position: top !important;
                position: relative !important;
                top: 0 !important;
                transform: none !important;
                box-sizing: border-box !important;
              }
              .hero-slide-mobile video.w-full {
                width: 100vw !important;
              }
              .hero-slide-mobile .w-full {
                width: 100vw !important;
              }
              .hero-slide-mobile img,
              .hero-slide-mobile img[style] {
                width: 100vw !important;
                min-width: 100vw !important;
                max-width: 100vw !important;
                height: auto !important;
                min-height: auto !important;
                left: 0 !important;
                right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                object-fit: contain !important;
                object-position: top !important;
                position: relative !important;
                top: 0 !important;
                transform: none !important;
                box-sizing: border-box !important;
              }
              .hero-slide-mobile > div[class*="absolute"][class*="bg-black"] {
                width: 100vw !important;
                max-width: 100vw !important;
                left: 0 !important;
                right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                position: absolute !important;
                top: 0 !important;
                bottom: 0 !important;
              }
              .hero-slide-mobile iframe,
              .hero-slide-mobile iframe[style] {
                width: 100vw !important;
                max-width: 100vw !important;
                min-width: 100vw !important;
                height: 100vh !important;
                min-height: 100vh !important;
                left: 0 !important;
                right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                position: absolute !important;
                top: 0 !important;
                bottom: 0 !important;
                transform: none !important;
                box-sizing: border-box !important;
              }
            }
          `}</style>
          <div
            className="flex h-full md:h-full hero-scroll-container"
            style={
              {
                // Desktop'ta: Her slide 100% genişliğinde, scroll container totalSlides * 100% genişliğinde
                // Mobilde: Her slide viewportWidth px, scroll container totalSlides * viewportWidth px
                width: isMobile && viewportWidth > 0 
                  ? `${totalSlides * viewportWidth}px`
                  : `${totalSlides * 100}%`,
                minWidth: isMobile && viewportWidth > 0 
                  ? `${totalSlides * viewportWidth}px`
                  : `${totalSlides * 100}%`,
                maxWidth: isMobile && viewportWidth > 0 
                  ? `${totalSlides * viewportWidth}px`
                  : `${totalSlides * 100}%`,
                transform: getTransform(),
                transition: isDragging || isTransitioning ? 'none' : 'transform 0.6s ease-in-out',
                flexWrap: 'nowrap',
                padding: 0,
                margin: 0,
                boxSizing: 'border-box',
                position: 'relative',
                overflowX: 'hidden',
                overflowY: 'hidden',
                display: 'flex',
              } as React.CSSProperties
            }
          >
            {clonedMedia.map((media, index) => {
              // Klon mu yoksa gerçek slide mı kontrol et
              const isClone = slideCount > 1 && (index === 0 || index === totalSlides - 1)
              const realIndex =
                index === 0 ? slideCount - 1 : index === totalSlides - 1 ? 0 : index - 1

              return (
                <div
                  key={`${isClone ? 'clone-' : ''}${realIndex}-${index}`}
                  className={`relative ${isMobile ? '' : 'h-full'} flex-shrink-0 ${isMobile ? 'hero-slide-mobile' : ''}`}
                  style={{
                    width: isMobile && viewportWidth > 0
                      ? `${viewportWidth}px`
                      : '100%', // Desktop'ta her slide hero container'ın tam genişliği
                    minWidth: isMobile && viewportWidth > 0
                      ? `${viewportWidth}px`
                      : '100%',
                    maxWidth: isMobile && viewportWidth > 0
                      ? `${viewportWidth}px`
                      : '100%',
                    flexShrink: 0,
                    flexGrow: 0,
                    scrollSnapAlign: 'none',
                    scrollSnapStop: 'normal',
                    padding: 0,
                    margin: 0,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    position: 'relative',
                    ...(isMobile && heroHeight
                      ? {height: `${heroHeight}px`, minHeight: `${heroHeight}px`}
                      : !isMobile
                        ? {height: '100%', minHeight: '100%'}
                        : {}),
                  }}
                >
                  {media.type === 'video' ? (
                    <OptimizedVideo
                      src={media.url}
                      srcMobile={media.urlMobile}
                      srcDesktop={media.urlDesktop}
                      className={`${isMobile ? 'relative' : 'absolute'} top-0 left-0 w-full ${isMobile ? 'h-auto' : 'h-full'} ${isMobile ? 'object-contain object-top' : 'object-cover'}`}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      loading="eager"
                    />
                  ) : media.type === 'youtube' ? (
                    <YouTubeBackground url={media.url} isMobile={isMobile} />
                  ) : (
                    <OptimizedImage
                      src={media.url}
                      srcMobile={media.urlMobile}
                      srcDesktop={media.urlDesktop}
                      alt={t(media.title)}
                      className={`${isMobile ? 'relative' : 'absolute'} top-0 left-0 w-full ${isMobile ? 'h-auto' : 'h-full'} ${isMobile ? 'object-contain object-top' : 'object-cover'}`}
                      loading="eager"
                      quality={90}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/50 z-10"></div>
                  {(() => {
                    const textPosition = media.textPosition || 'center'
                    const justifyClass =
                      textPosition === 'left'
                        ? 'justify-center md:justify-start'
                        : textPosition === 'right'
                          ? 'justify-center md:justify-end'
                          : 'justify-center'
                    const textAlignClass =
                      textPosition === 'left'
                        ? 'text-center md:text-left'
                        : textPosition === 'right'
                          ? 'text-center md:text-right'
                          : 'text-center'
                    return (
                      <div
                        className={`absolute z-20 ${isMobile ? 'w-full px-4' : 'container mx-auto px-4 sm:px-6 lg:px-8'} h-full flex items-center ${justifyClass}`}
                        style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                      >
                        <div
                          className={`flex flex-col md:flex-row items-center text-white gap-12 md:gap-16 ${content.isHeroTextVisible ? 'max-w-4xl' : ''} ${textAlignClass}`}
                        >
                          {content.isHeroTextVisible && (
                            <div className="relative w-full">
                              <div className="animate-fade-in-up-subtle">
                                <h1
                                  className="text-base md:text-5xl font-light tracking-tight mb-4 leading-relaxed"
                                  style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}
                                >
                                  {t(media.title)}
                                </h1>
                                <p
                                  className="text-[10px] md:text-xl mb-8 leading-relaxed"
                                  style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}
                                >
                                  {t(media.subtitle)}
                                </p>
                                {media.isButtonVisible && (
                                  <Link
                                    to={media.buttonLink || '/'}
                                    className="group inline-flex items-center gap-x-3 text-white font-semibold py-2 pl-0 pr-4 text-[10px] md:text-lg rounded-lg"
                                  >
                                    <span className="inline-flex items-center gap-x-3 border-b border-transparent group-hover:border-white pb-1 transition-all duration-300 ease-out">
                                      <span className="group-hover:text-gray-200">
                                        {t(media.buttonText)}
                                      </span>
                                      <ArrowRight className="w-3 h-3 md:w-6 md:h-6" />
                                    </span>
                                  </Link>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )
            })}
          </div>
          {slideCount > 1 && (
            <div
              className={`${isMobile ? 'absolute' : 'absolute'} ${isMobile ? 'bottom-4' : 'bottom-10'} left-1/2 -translate-x-1/2 z-30 flex items-center space-x-4`}
              style={isMobile ? {position: 'absolute', bottom: '16px'} : {}}
            >
              {heroMedia.map((_, index) => {
                // currentSlide'ı normalize et (klonlar hariç)
                const normalizedSlide =
                  currentSlide < 0 ? slideCount - 1 : currentSlide >= slideCount ? 0 : currentSlide
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`relative rounded-full h-2 transition-all duration-500 ease-in-out group ${index === normalizedSlide ? 'w-12 bg-white/50' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                    aria-label={`Go to slide ${index + 1}`}
                  >
                    {index === normalizedSlide && (
                      <div
                        key={`${normalizedSlide}-${index}`}
                        className="absolute top-0 left-0 h-full rounded-full bg-white animate-fill-line"
                      ></div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-[50vh] w-full bg-gray-800" />
      )}

      {/* Content Blocks Section */}
      {content?.contentBlocks &&
        content.contentBlocks.length > 0 &&
        (() => {
          const sortedBlocks = [...content.contentBlocks].sort(
            (a, b) => (a.order || 0) - (b.order || 0)
          )
          return (
            <>
              {sortedBlocks.map((block, index) => {
                const getMediaUrl = () => {
                  if (block.mediaType === 'image' && block.image) {
                    return block.image
                  }
                  return block.url || ''
                }

                const mediaUrl = getMediaUrl()
                const isFullWidth = block.position === 'full'
                const isLeft = block.position === 'left'
                const isRight = block.position === 'right'
                const isCenter = block.position === 'center'

                const backgroundColor =
                  block.backgroundColor === 'gray' ? 'bg-gray-100' : 'bg-white'
                const textAlign = block.textAlignment || 'left'
                const textAlignClass =
                  textAlign === 'center'
                    ? 'text-center'
                    : textAlign === 'right'
                      ? 'text-right'
                      : 'text-left'

                return (
                  <section
                    key={index}
                    className={`${index === 0 ? 'pt-0 pb-0' : index === 1 ? 'pt-0 pb-20' : 'py-20'} ${backgroundColor}`}
                  >
                    {isFullWidth ? (
                      <div className="w-full overflow-hidden">
                        {block.mediaType === 'youtube' ? (
                          <div className="relative w-full aspect-video overflow-hidden">
                            <YouTubeBackground url={mediaUrl} />
                          </div>
                        ) : block.mediaType === 'video' ? (
                          <OptimizedVideo
                            src={mediaUrl}
                            className={`w-full h-auto max-w-full ${isMobile ? 'object-contain' : 'object-cover'}`}
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            loading="lazy"
                          />
                        ) : (
                          <OptimizedImage
                            src={mediaUrl}
                            alt=""
                            className={`w-full h-auto ${isMobile ? 'object-contain' : 'object-cover'} max-w-full block`}
                            loading="lazy"
                            quality={85}
                          />
                        )}
                        {block.description && (
                          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                            <div className={`prose max-w-none ${textAlignClass}`}>
                              <p className="text-sm md:text-lg text-gray-700 font-light leading-relaxed">
                                {t(block.description)}
                              </p>
                            </div>
                            {block.linkText && block.linkUrl && (
                              <div className={`mt-6 ${textAlignClass}`}>
                                <Link
                                  to={block.linkUrl}
                                  className="group inline-flex items-center gap-x-3 text-gray-900 font-semibold py-3 pl-0 pr-5 text-sm md:text-lg rounded-lg"
                                >
                                  <span className="inline-flex items-center gap-x-3 border-b border-transparent group-hover:border-gray-900 pb-1 transition-all duration-300 ease-out">
                                    <span className="group-hover:text-gray-500">
                                      {t(block.linkText)}
                                    </span>
                                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                                  </span>
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div
                          className={`flex flex-col ${isLeft ? 'md:flex-row' : isRight ? 'md:flex-row-reverse' : 'md:flex-row items-center'} gap-12`}
                        >
                          <div
                            className={`w-full ${isCenter ? 'md:w-full' : 'md:w-1/2'} overflow-hidden`}
                          >
                            {block.mediaType === 'youtube' ? (
                              <div className="relative w-full aspect-video overflow-hidden">
                                <YouTubeBackground url={mediaUrl} />
                              </div>
                            ) : block.mediaType === 'video' ? (
                              <OptimizedVideo
                                src={mediaUrl}
                                className={`w-full h-auto ${imageBorderClass} max-w-full ${isMobile ? 'object-contain' : 'object-cover'}`}
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="auto"
                                loading="lazy"
                              />
                            ) : (
                              <OptimizedImage
                                src={mediaUrl}
                                alt=""
                                className={`w-full h-auto ${imageBorderClass} ${isMobile ? 'object-contain' : 'object-cover'} max-w-full block`}
                                loading="lazy"
                                quality={85}
                              />
                            )}
                          </div>
                          {block.description && (
                            <div className={`w-full ${isCenter ? 'md:w-full' : 'md:w-1/2'}`}>
                              <div className={`prose max-w-none ${textAlignClass}`}>
                                <p className="text-sm md:text-lg text-gray-700 font-light leading-relaxed">
                                  {t(block.description)}
                                </p>
                              </div>
                              {block.linkText && block.linkUrl && (
                                <div className={`mt-6 ${textAlignClass}`}>
                                  <Link
                                    to={block.linkUrl}
                                    className="group inline-flex items-center gap-x-3 text-gray-900 font-semibold py-3 pl-0 pr-5 text-sm md:text-lg rounded-lg"
                                  >
                                    <span className="inline-flex items-center gap-x-3 border-b border-transparent group-hover:border-gray-900 pb-1 transition-all duration-300 ease-out">
                                      <span className="group-hover:text-gray-500">
                                        {t(block.linkText)}
                                      </span>
                                      <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                                    </span>
                                  </Link>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                )
              })}
            </>
          )
        })()}

      {/* Inspiration Section */}
      {inspiration &&
        (inspiration.backgroundImage || inspiration.title || inspiration.subtitle) && (
          <section
            className="relative py-16 md:py-32 bg-gray-800 text-white text-center inspiration-section-mobile"
            style={{
              backgroundImage: `url(${isMobile && bgImageMobile ? bgImageMobile : bgImageDesktop || bgImageUrl})`,
              backgroundSize: isMobile ? '100vw auto' : 'cover',
              backgroundAttachment: 'fixed',
              backgroundPosition: isMobile ? 'left center' : 'center center',
              backgroundRepeat: 'no-repeat',
              ...(isMobile && inspirationImageHeight && bgImageUrl
                ? {
                    height: `${inspirationImageHeight}px`,
                    minHeight: `${inspirationImageHeight}px`,
                    paddingTop: 0,
                    paddingBottom: 0,
                  }
                : {}),
              ...(!isMobile && inspirationImageHeight && bgImageUrl
                ? {minHeight: `${inspirationImageHeight}px`}
                : {}),
            }}
          >
            <div className="absolute inset-0 bg-black/50"></div>
            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up-subtle max-w-4xl">
              <h2 className="text-4xl font-light leading-relaxed">{t(inspiration.title)}</h2>
              <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">
                {t(inspiration.subtitle)}
              </p>
              {inspiration.buttonText && (
                <Link
                  to={inspiration.buttonLink || '/'}
                  className="group mt-8 inline-flex items-center gap-x-3 text-white font-semibold py-3 pl-0 pr-5 text-lg rounded-lg"
                >
                  <span className="inline-flex items-center gap-x-3 border-b border-transparent group-hover:border-white pb-1 transition-all duration-300 ease-out">
                    <span className="group-hover:text-gray-200">{t(inspiration.buttonText)}</span>
                    <ArrowRight className="w-6 h-6" />
                  </span>
                </Link>
              )}
            </div>
          </section>
        )}
    </div>
  )
}
