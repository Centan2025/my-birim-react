import React, {useEffect, useRef, useState} from 'react'
import {OptimizedImage} from './OptimizedImage'
import {OptimizedVideo} from './OptimizedVideo'

type MediaItem = {
  type: 'image' | 'video' | 'youtube'
  url: string
  urlMobile?: string
  urlDesktop?: string
}

interface FullscreenMediaViewerProps {
  items: MediaItem[]
  initialIndex?: number
  onClose: () => void
}

export const FullscreenMediaViewer: React.FC<FullscreenMediaViewerProps> = ({
  items,
  initialIndex = 0,
  onClose,
}) => {
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isButtonVisible, setIsButtonVisible] = useState(false)
  const [visibleIndices, setVisibleIndices] = useState<number[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const closingVisibleIndicesRef = useRef<number[]>([])
  
  // Mouse drag için state'ler (sadece desktop)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragStartScrollLeft = useRef(0)
  
  // Mobilde yukarı git butonu için state
  const [showScrollToTop, setShowScrollToTop] = useState(false)

  if (!items || items.length === 0) return null

  const slideCount = items.length

  // Mobil kontrolü
  useEffect(() => {
    if (typeof window === 'undefined') return
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Açılış animasyonu
  useEffect(() => {
    // Kısa bir gecikme ile animasyonu başlat
    const timer = setTimeout(() => {
      setIsVisible(true)
      // Buton animasyonu için kısa bir gecikme
      setTimeout(() => {
        setIsButtonVisible(true)
      }, 100)
    }, 10)
    return () => clearTimeout(timer)
  }, [])

  // Kapanış animasyonu
  const handleClose = () => {
    // O anki scroll pozisyonuna göre görünür görselleri hesapla
    let currentVisible: number[] = []
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const containerTop = container.scrollTop
      const containerBottom = containerTop + container.clientHeight
      
      itemRefs.current.forEach((ref, index) => {
        if (!ref) return
        const itemTop = ref.offsetTop
        const itemBottom = itemTop + ref.offsetHeight
        
        if (itemBottom > containerTop && itemTop < containerBottom) {
          currentVisible.push(index)
        }
      })
      
      // Görünür görselleri pozisyonlarına göre sırala (üstten alta)
      currentVisible.sort((a, b) => {
        const refA = itemRefs.current[a]
        const refB = itemRefs.current[b]
        if (!refA || !refB) return 0
        return refA.offsetTop - refB.offsetTop
      })
      
      setVisibleIndices(currentVisible)
      closingVisibleIndicesRef.current = currentVisible
    }
    
    // Önce görsellerin animasyonunu başlat (isClosing = true, isVisible hala true)
    setIsClosing(true)
    
    // Buton animasyonunu hemen başlat (kapanış)
    setIsButtonVisible(false)
    
    // En üstteki görselin animasyonu bitince (en üstteki görselin delay + duration)
    const visibleCount = closingVisibleIndicesRef.current.length > 0 
      ? closingVisibleIndicesRef.current.length 
      : currentVisible.length
    const topItemDelay = visibleCount > 0 ? (visibleCount - 1) * 75 : (items.length - 1) * 75 // 100ms -> 75ms
    const imageAnimationDuration = 250 // Hızlandırıldı: 400 -> 250
    const totalImageAnimation = topItemDelay + imageAnimationDuration
    
    // Görseller animasyonu bitince beyaz fon fade'i başlat
    setTimeout(() => {
      setIsVisible(false)
      
      // Beyaz fon fade bitince onClose çağır (hızlandırıldı: 300 -> 200)
      setTimeout(() => {
        onClose()
      }, 200)
    }, totalImageAnimation)
  }

  // Açıldığında sayfayı en üste kaydır ve body scroll'unu kilitle
  useEffect(() => {
    if (typeof window === 'undefined') return

    window.scrollTo({top: 0, behavior: 'auto'})
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    // Sayfa arka planının (hem body hem html) kaymasını durdur
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [])


  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  // Mouse drag handlers (sadece desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile || !scrollContainerRef.current) return
    e.preventDefault()
    setIsDragging(true)
    dragStartX.current = e.clientX
    dragStartScrollLeft.current = scrollContainerRef.current.scrollLeft
    // Cursor'u grabbing yap
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grabbing'
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile || !isDragging || !scrollContainerRef.current) return
    e.preventDefault()
    const x = e.clientX
    const walk = (dragStartX.current - x) * 1.5 // Hız çarpanı
    scrollContainerRef.current.scrollLeft = dragStartScrollLeft.current + walk
  }

  // Mouse bırakıldığında en yakın görsele snap et
  const snapToNearestImage = () => {
    if (!scrollContainerRef.current || isMobile) return
    const container = scrollContainerRef.current
    const itemWidth = window.innerWidth * 0.98 - 32 // 98vw - 2rem (32px)
    const currentScroll = container.scrollLeft
    const nearestIndex = Math.round(currentScroll / itemWidth)
    const targetScroll = nearestIndex * itemWidth
    
    container.scrollTo({
      left: Math.max(0, Math.min(targetScroll, container.scrollWidth - container.clientWidth)),
      behavior: 'smooth',
    })
  }

  const handleMouseUp = () => {
    if (isMobile || !isDragging) return
    setIsDragging(false)
    // Cursor'u grab yap
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab'
    }
    // En yakın görsele snap et
    snapToNearestImage()
  }

  const handleMouseLeave = () => {
    if (isMobile || !isDragging) return
    setIsDragging(false)
    // Cursor'u grab yap
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab'
    }
    // En yakın görsele snap et
    snapToNearestImage()
  }

  // Görünür görselleri tespit et (mobilde scroll pozisyonuna göre)
  useEffect(() => {
    if (!scrollContainerRef.current || typeof window === 'undefined') return
    
    const updateVisibleIndices = () => {
      if (!scrollContainerRef.current) return
      const container = scrollContainerRef.current
      const containerTop = container.scrollTop
      const containerBottom = containerTop + container.clientHeight
      
      // Mobilde yukarı git butonunu göster/gizle
      if (isMobile) {
        // 200px'den fazla aşağı kaydırıldıysa butonu göster
        setShowScrollToTop(containerTop > 200)
      }
      
      const visible: number[] = []
      itemRefs.current.forEach((ref, index) => {
        if (!ref) return
        const itemTop = ref.offsetTop
        const itemBottom = itemTop + ref.offsetHeight
        
        // Görselin bir kısmı görünürse ekle
        if (itemBottom > containerTop && itemTop < containerBottom) {
          visible.push(index)
        }
      })
      
      // Görünür görselleri pozisyonlarına göre sırala (üstten alta)
      visible.sort((a, b) => {
        const refA = itemRefs.current[a]
        const refB = itemRefs.current[b]
        if (!refA || !refB) return 0
        return refA.offsetTop - refB.offsetTop
      })
      
      setVisibleIndices(visible)
    }
    
    updateVisibleIndices()
    const container = scrollContainerRef.current
    container.addEventListener('scroll', updateVisibleIndices)
    window.addEventListener('resize', updateVisibleIndices)
    
    return () => {
      container.removeEventListener('scroll', updateVisibleIndices)
      window.removeEventListener('resize', updateVisibleIndices)
    }
  }, [items.length, isMobile])

  // Mobilde yukarı git fonksiyonu
  const handleScrollToTop = () => {
    if (!scrollContainerRef.current) return
    scrollContainerRef.current.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    // Her görselin genişliği: calc(98vw - 2rem)
    const itemWidth = window.innerWidth * 0.98 - 32 // 98vw - 2rem (32px)
    const scrollPosition = index * itemWidth
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth',
    })
  }

  const handleScrollLeft = () => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    // Bir sonraki görselin sınırına kadar git
    const itemWidth = window.innerWidth * 0.98 - 32 // 98vw - 2rem (32px)
    const currentScroll = container.scrollLeft
    const targetScroll = Math.floor(currentScroll / itemWidth) * itemWidth
    // Eğer zaten tam hizalıysa, bir önceki görsele git
    const scrollTo = Math.abs(currentScroll - targetScroll) < 10 
      ? Math.max(0, targetScroll - itemWidth)
      : targetScroll
    container.scrollTo({
      left: scrollTo,
      behavior: 'smooth',
    })
  }

  const handleScrollRight = () => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    // Bir sonraki görselin sınırına kadar git
    const itemWidth = window.innerWidth * 0.98 - 32 // 98vw - 2rem (32px)
    const currentScroll = container.scrollLeft
    const targetScroll = Math.ceil(currentScroll / itemWidth) * itemWidth
    // Eğer zaten tam hizalıysa, bir sonraki görsele git
    const scrollTo = Math.abs(currentScroll - targetScroll) < 10
      ? Math.min(container.scrollWidth - container.clientWidth, targetScroll + itemWidth)
      : targetScroll
    container.scrollTo({
      left: scrollTo,
      behavior: 'smooth',
    })
  }

  // initialIndex değiştiğinde scroll yap
  useEffect(() => {
    if (initialIndex >= 0 && scrollContainerRef.current) {
      scrollToIndex(initialIndex)
    }
  }, [initialIndex])

  // Global mouse event listener'ları (drag container dışına çıktığında)
  useEffect(() => {
    if (isMobile) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !scrollContainerRef.current) return
      e.preventDefault()
      const x = e.clientX
      const walk = (dragStartX.current - x) * 1.5
      scrollContainerRef.current.scrollLeft = dragStartScrollLeft.current + walk
    }

    const handleGlobalMouseUp = () => {
      if (!isDragging || !scrollContainerRef.current) return
      setIsDragging(false)
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.cursor = 'grab'
      }
      // En yakın görsele snap et
      const container = scrollContainerRef.current
      const itemWidth = window.innerWidth * 0.98 - 32
      const currentScroll = container.scrollLeft
      const nearestIndex = Math.round(currentScroll / itemWidth)
      const targetScroll = nearestIndex * itemWidth
      
      container.scrollTo({
        left: Math.max(0, Math.min(targetScroll, container.scrollWidth - container.clientWidth)),
        behavior: 'smooth',
      })
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, isMobile])

  // Header, TopBanner, Footer ve diğer üstteki/altteki elementleri tamamen gizle
  useEffect(() => {
    // Body'ye class ekle
    document.body.classList.add('fullscreen-viewer-active')
    
    const hideElement = (selector: string) => {
      const elements = document.querySelectorAll(selector)
      elements.forEach((el) => {
        if (el) {
          const htmlEl = el as HTMLElement
          htmlEl.style.setProperty('display', 'none', 'important')
          htmlEl.style.setProperty('visibility', 'hidden', 'important')
          htmlEl.style.setProperty('opacity', '0', 'important')
          htmlEl.style.setProperty('pointer-events', 'none', 'important')
          htmlEl.style.setProperty('position', 'absolute', 'important')
          htmlEl.style.setProperty('top', '-9999px', 'important')
          htmlEl.style.setProperty('z-index', '-1', 'important')
        }
      })
    }
    
    // Tüm üstteki ve altteki elementleri gizle
    hideElement('header')
    hideElement('footer')
    hideElement('a[href="#main-content"]')
    hideElement('main > div:first-child')
    hideElement('[class*="top-banner"]')
    hideElement('[class*="TopBanner"]')
    hideElement('.bg-gray-900') // TopBanner
    // Main içindeki tüm üstteki div'leri kontrol et
    const main = document.querySelector('main')
    if (main) {
      const firstChild = main.firstElementChild as HTMLElement
      if (firstChild && firstChild.classList.contains('bg-gray-900')) {
        hideElement('main > div.bg-gray-900')
      }
    }
    
    return () => {
      // Body'den class'ı kaldır
      document.body.classList.remove('fullscreen-viewer-active')
      
      // Tüm elementleri geri getir
      const showElement = (selector: string) => {
        const elements = document.querySelectorAll(selector)
        elements.forEach((el) => {
          if (el) {
            const htmlEl = el as HTMLElement
            htmlEl.style.removeProperty('display')
            htmlEl.style.removeProperty('visibility')
            htmlEl.style.removeProperty('opacity')
            htmlEl.style.removeProperty('pointer-events')
            htmlEl.style.removeProperty('position')
            htmlEl.style.removeProperty('top')
            htmlEl.style.removeProperty('z-index')
          }
        })
      }
      
      showElement('header')
      showElement('footer')
      showElement('a[href="#main-content"]')
      showElement('main > div:first-child')
      showElement('[class*="top-banner"]')
      showElement('[class*="TopBanner"]')
      showElement('.bg-gray-900')
      showElement('main > div.bg-gray-900')
    }
  }, [])

  return (
    // Tam ekran overlay - arka plandaki sayfayı tamamen kapatır
    <div 
      className="fixed bg-white flex flex-col overflow-hidden" 
      style={{
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        width: '100vw', 
        height: '100vh',
        zIndex: 99999,
        overflow: 'hidden',
      }}
    >
      {/* İçerik için opacity animasyonu */}
      <div 
        className={`w-full h-full flex flex-col transition-opacity duration-500 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
      {/* Üstte kapatma düğmesi */}
      <div 
        className="flex items-center justify-end px-4 py-2 md:py-3 bg-white/95 shadow-sm z-10 shrink-0"
        style={{
          opacity: isClosing ? 0 : 1,
          transition: 'opacity 300ms ease-in-out',
          transitionDelay: isClosing ? (isMobile ? '200ms' : '0ms') : '0ms',
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-500 ease-in-out outline-none focus:outline-none focus:ring-0 active:outline-none active:ring-0"
          aria-label="Kapat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-gray-900 transition-all duration-500 ease-in-out ${
              isButtonVisible && !isClosing
                ? 'opacity-100 rotate-0'
                : isClosing
                  ? 'opacity-0 rotate-90'
                  : 'opacity-0 rotate-90'
            }`}
            style={{
              transform: isButtonVisible && !isClosing 
                ? 'rotate(0deg)' 
                : isClosing 
                  ? 'rotate(90deg)' 
                  : 'rotate(90deg)',
              transitionDelay: isClosing ? (isMobile ? '200ms' : '0ms') : '0ms',
            }}
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Görseller - mobilde alt alta, desktop'ta yan yana */}
      <div className="flex-1 relative overflow-hidden" style={{width: '100%', height: '100vh', maxHeight: '100vh'}}>
        <div
          ref={scrollContainerRef}
          className="w-full h-full overflow-y-auto md:overflow-y-hidden md:overflow-x-auto flex flex-col md:flex-row items-start md:items-stretch gap-[2px] md:gap-1 px-0 md:px-4 pt-0 md:pt-0 md:cursor-grab md:select-none"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            width: '100%',
            height: '100%',
            maxHeight: '100%',
            cursor: isDragging && !isMobile ? 'grabbing' : (!isMobile ? 'grab' : 'default'),
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <style>
            {`
              div::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
              }
              * {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
              }
            `}
          </style>
          {items.map((item, i) => {
            if (!item) return null
            // Açılırken: ilk görselden son görsele (i * 150ms)
            // Kapanırken: ekranda görünen görsellerin sırasına göre (en alttaki önce)
            let animationDelay = 0
            if (isClosing) {
              // Desktop'ta görünmeyen görseller için delay 0
              if (!isMobile) {
                // Desktop'ta görünür görselleri kontrol et
                const currentVisible = closingVisibleIndicesRef.current.length > 0 
                  ? closingVisibleIndicesRef.current 
                  : visibleIndices
                
                if (currentVisible.length > 0) {
                  const visibleIndex = currentVisible.indexOf(i)
                  if (visibleIndex >= 0) {
                    // En alttaki görsel (currentVisible'deki son) önce gitsin
                    const reverseIndex = currentVisible.length - 1 - visibleIndex
                    animationDelay = reverseIndex * 75 // 150ms -> 75ms
                  } else {
                    // Desktop'ta görünmeyen görseller hemen gitsin
                    animationDelay = 0
                  }
                } else {
                  // Fallback: eski mantık
                  animationDelay = (items.length - 1 - i) * 75 // 150ms -> 75ms
                }
              } else {
                // Mobilde: kapanışta hesaplanan görünür görselleri kullan
                const currentVisible = closingVisibleIndicesRef.current.length > 0 
                  ? closingVisibleIndicesRef.current 
                  : visibleIndices
                
                if (currentVisible.length > 0) {
                  const visibleIndex = currentVisible.indexOf(i)
                  if (visibleIndex >= 0) {
                    // En alttaki görsel (currentVisible'deki son) önce gitsin
                    const reverseIndex = currentVisible.length - 1 - visibleIndex
                    animationDelay = reverseIndex * 75 // 150ms -> 75ms
                  } else {
                    // Görünmeyen görseller hemen gitsin
                    animationDelay = 0
                  }
                } else {
                  // Fallback: eski mantık
                  animationDelay = (items.length - 1 - i) * 75 // 150ms -> 75ms
                }
              }
            } else {
              animationDelay = isVisible ? i * 150 : 0
            }
            
            return (
              <div
                key={i}
                ref={(el) => {
                  itemRefs.current[i] = el
                }}
                className={`flex-shrink-0 flex items-start md:items-stretch justify-center w-full md:w-[calc(98vw-2rem)] md:min-w-[calc(98vw-2rem)] h-auto md:h-full transition-all ease-out ${
                  isVisible && !isClosing
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8 md:translate-y-0'
                }`}
                style={{
                  transitionDelay: `${animationDelay}ms`,
                  transitionDuration: '250ms', // 400ms -> 250ms
                }}
              >
                {item.type === 'image' ? (
                  <OptimizedImage
                    src={item.url}
                    srcMobile={item.urlMobile}
                    srcDesktop={item.urlDesktop}
                    alt=""
                    className="w-full h-auto md:w-full md:h-full md:object-cover"
                    loading="eager"
                    quality={95}
                  />
                ) : item.type === 'video' ? (
                  <OptimizedVideo
                    src={item.url}
                    srcMobile={item.urlMobile}
                    srcDesktop={item.urlDesktop}
                    className="w-full h-auto md:w-full md:h-full md:object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    loading="eager"
                  />
                ) : (
                  <iframe
                    className="w-full h-[60vh] md:w-full md:h-full"
                    title={`fullscreen-media-youtube-${i}`}
                    src={item.url}
                    allow="autoplay; encrypted-media; fullscreen"
                    frameBorder="0"
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Sağa sola düğmeleri - altta ortada (sadece desktop'ta) */}
        {slideCount > 1 && (
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-4 z-20" style={{bottom: '32px'}}>
            <button
              type="button"
              onClick={handleScrollLeft}
              className="bg-black/35 hover:bg-black/55 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              aria-label="Sol"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleScrollRight}
              className="bg-black/35 hover:bg-black/55 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              aria-label="Sağ"
            >
              ›
            </button>
          </div>
        )}

        {/* Mobilde yukarı git butonu - sağ alt köşe */}
        {isMobile && (
          <button
            type="button"
            onClick={handleScrollToTop}
            className={`md:hidden absolute bottom-6 right-6 bg-black/70 hover:bg-black/90 text-white rounded-full p-4 transition-all duration-300 z-30 shadow-lg ${
              showScrollToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
            aria-label="Yukarı git"
          >
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
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
        )}
      </div>
      </div>
    </div>
  )
}

