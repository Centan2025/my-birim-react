import React, {useState, useEffect, useMemo, useRef} from 'react'
import {getContactPageContent} from '../services/cms'
import type {ContactPageContent, ContactLocation, ContactLocationMedia} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {OptimizedVideo} from '../components/OptimizedVideo'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {analytics} from '../src/lib/analytics'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {FullscreenMediaViewer} from '../components/FullscreenMediaViewer'

const getYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  )
  return match && match[1] && match[1].length === 11 ? match[1] : null
}

const youTubeThumb = (url: string): string => {
  const videoId = getYouTubeId(url)
  return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : ''
}

const convertGoogleMapsUrlToEmbed = (url: string): string => {
  if (!url) return ''

  // Zaten embed URL ise olduğu gibi döndür
  if (url.includes('/embed')) {
    // Eğer https:// yoksa ekle
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`
    }
    return url
  }

  // Place ID'yi çıkar - format: !1s0x14cab93b568287b3:0xbae194105488893c
  // Veya data=!4m2!3m1!1s0x14cab93b568287b3:0xbae194105488893c formatında
  const placeIdMatch = url.match(/!1s([^!?&]+)/)
  if (placeIdMatch && placeIdMatch[1]) {
    const placeId = placeIdMatch[1]
    // Embed URL formatına çevir - Google Maps embed formatı
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s${encodeURIComponent(placeId)}!2s!5e0!3m2!1str!2str!4v1!5m2!1str!2str`
  }

  // data parametresinden çıkar - format: data=!4m2!3m1!1s...
  const dataMatch = url.match(/data=!([^?&]+)/)
  if (dataMatch && dataMatch[1]) {
    const data = dataMatch[1]
    // Embed URL formatına çevir
    return `https://www.google.com/maps/embed?pb=!${data}`
  }

  // Place link formatı: google.com/maps/place/...
  const placeMatch = url.match(/maps\/place\/([^/?]+)/)
  if (placeMatch && placeMatch[1]) {
    const placeName = placeMatch[1]
    // Place name ile search yaparak embed oluştur
    return `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(placeName)}`
  }

  // Hiçbiri eşleşmezse, https:// ekleyip döndür
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }

  return url
}

const MapPinIcon = (props: React.ComponentProps<'svg'>) => (
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
    {...props}
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
)
const PhoneIcon = (props: React.ComponentProps<'svg'>) => (
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
    {...props}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
)
const MailIcon = (props: React.ComponentProps<'svg'>) => (
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
    {...props}
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
)

const MediaModal: React.FC<{
  allMedia: ContactLocationMedia[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
}> = ({allMedia, initialIndex, isOpen, onClose}) => {
  // Mantıksal index (sonsuz döngü için)
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!allMedia || allMedia.length === 0) return 0
    return Math.max(0, Math.min(initialIndex, allMedia.length - 1))
  })

  // Kayma animasyonu için klonlu dizi index'i
  const [slideIndex, setSlideIndex] = useState(() => {
    if (!allMedia || allMedia.length <= 1) return 0
    const safe = Math.max(0, Math.min(initialIndex, allMedia.length - 1))
    return safe + 1 // [last, ...allMedia, first] içinde gerçek index +1
  })
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const [slideWidth, setSlideWidth] = useState(0)

  const hasMultiple = allMedia.length > 1

  // [son, ...allMedia, ilk] → sonsuz döngü için
  const clonedMedia = useMemo(() => {
    if (!allMedia || allMedia.length <= 1) return allMedia || []
    const first = allMedia[0]
    const last = allMedia[allMedia.length - 1]
    return [last, ...allMedia, first]
  }, [allMedia])

  const totalSlides = clonedMedia.length || 1

  useEffect(() => {
    if (!allMedia || allMedia.length === 0) return
    const safe = Math.max(0, Math.min(initialIndex, allMedia.length - 1))
    setCurrentIndex(safe)
    if (allMedia.length > 1) {
      setSlideIndex(safe + 1)
    } else {
      setSlideIndex(0)
    }
  }, [initialIndex, allMedia])

  // Modal açıldığında ve pencere boyutu değiştiğinde her slide'ın genişliğini piksel cinsinden ölç
  useEffect(() => {
    if (!isOpen) return
    const measure = () => {
      if (!sliderRef.current) return
      const width = sliderRef.current.clientWidth
      setSlideWidth(width)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [isOpen, totalSlides])

  const getMediaUrl = (m: ContactLocationMedia) => {
    if (m.type === 'image') {
      if (m.url) return m.url
      if (m.image?.asset?.url) return m.image.asset.url
    }
    if (m.type === 'video') {
      if (m.url) return m.url
      if (m.videoFile?.asset?.url) return m.videoFile.asset.url
    }
    if (m.type === 'youtube' && m.url) {
      const videoId = getYouTubeId(m.url)
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : m.url
    }
    return ''
  }

  const goNext = () => {
    if (!hasMultiple) return
    if (!transitionEnabled) return
    setSlideIndex(prev => prev + 1)
    setCurrentIndex(prev =>
      allMedia.length > 0 ? (prev + 1) % allMedia.length : prev
    )
  }

  const goPrev = () => {
    if (!hasMultiple) return
    if (!transitionEnabled) return
    setSlideIndex(prev => prev - 1)
    setCurrentIndex(prev =>
      allMedia.length > 0
        ? (prev - 1 + allMedia.length) % allMedia.length
        : prev
    )
  }

  // Klavye navigasyonu (ok tuşları ve ESC)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && hasMultiple) {
        goNext()
      } else if (e.key === 'ArrowLeft' && hasMultiple) {
        goPrev()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hasMultiple, onClose])

  if (!isOpen || allMedia.length === 0) return null

  const currentItem = allMedia[currentIndex]
  const currentUrl = currentItem ? getMediaUrl(currentItem) : ''

  const handleTransitionEnd = () => {
    if (!hasMultiple) return
    if (!transitionEnabled) return

    if (slideIndex === totalSlides - 1) {
      // sağdaki clone'dan ilk gerçeğe
      setTransitionEnabled(false)
      setSlideIndex(1)
      return
    }
    if (slideIndex === 0) {
      // soldaki clone'dan son gerçeğe
      setTransitionEnabled(false)
      setSlideIndex(totalSlides - 2)
    }
  }

  useEffect(() => {
    if (!transitionEnabled) {
      const id = requestAnimationFrame(() => {
        setTransitionEnabled(true)
      })
      return () => cancelAnimationFrame(id)
    }
    return
  }, [transitionEnabled])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="relative inline-flex items-center justify-center w-[90vw] max-w-6xl h-[80vh] max-h-[85vh] bg-black">
        {/* Kapatma butonu */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-20 text-white hover:text-gray-300 transition-colors bg-black/70 w-9 h-9 flex items-center justify-center hover:bg-black/90 shadow-lg rounded-full pointer-events-auto"
          aria-label="Close"
          type="button"
        >
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
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Önceki buton */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            goPrev()
          }}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white hover:text-gray-300 transition-colors bg-black/70 w-10 h-10 items-center justify-center hover:bg-black/90 shadow-lg rounded-full pointer-events-auto"
          aria-label="Previous"
        >
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
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {/* Sonraki buton */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            goNext()
          }}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white hover:text-gray-300 transition-colors bg-black/70 w-10 h-10 items-center justify-center hover:bg-black/90 shadow-lg rounded-full pointer-events-auto"
          aria-label="Next"
        >
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
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <div className="relative max-h-full max-w-full overflow-hidden flex items-center justify-center w-full h-full">
          {currentItem && (
            currentItem.type === 'youtube' ? (
              <iframe
                src={currentUrl}
                className="w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
                frameBorder="0"
                title={`contact-location-media-${currentIndex}`}
              />
            ) : currentItem.type === 'video' ? (
              <OptimizedVideo
                src={currentUrl}
                controls
                autoPlay
                className="max-w-full max-h-full w-auto h-auto object-contain"
                preload="auto"
                loading="eager"
              />
            ) : (
              <OptimizedImage
                src={currentUrl}
                alt=""
                className="max-w-full max-h-full w-auto h-auto object-contain"
                loading="eager"
                quality={95}
                draggable={false}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}
const LocationCard: React.FC<{
  location: ContactLocation
  isSelected: boolean
  onSelect: () => void
}> = ({location, isSelected, onSelect}) => {
  const {t} = useTranslation()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        analytics.event({
          category: 'contact',
          action: 'select_location',
          label: t(location.title),
        })
        onSelect()
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          analytics.event({
            category: 'contact',
            action: 'select_location',
            label: t(location.title),
          })
          onSelect()
        }
      }}
      className={`p-4 cursor-pointer w-full max-w-full transition-all duration-300 ${
        isSelected ? 'bg-gray-200' : 'hover:bg-gray-100'
      }`}
    >
      <h3 className="text-xl font-light text-gray-500">{t(location.title)}</h3>
      <p className="mt-2 text-gray-500 flex items-start gap-2 font-light">
        <MapPinIcon className="mt-1 flex-shrink-0 text-gray-400" />
        <span className="break-words">{location.address}</span>
      </p>
      <p className="mt-1 text-gray-500 flex items-center gap-2 font-light">
        <PhoneIcon className="flex-shrink-0 text-gray-400" />
        <span>{location.phone}</span>
      </p>
      {location.email && (
        <p className="mt-1 text-gray-500 flex items-center gap-2 font-light">
          <MailIcon className="flex-shrink-0 text-gray-400" />
          <span>{location.email}</span>
        </p>
      )}
    </div>
  )
}

export function ContactPage() {
  const [content, setContent] = useState<ContactPageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<ContactLocation | null>(null)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(0)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const thumbRef = useRef<HTMLDivElement | null>(null)
  const [thumbDragStartX, setThumbDragStartX] = useState<number | null>(null)
  const [thumbScrollStart, setThumbScrollStart] = useState<number>(0)
  const {t} = useTranslation()
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      // Sadece gerçek mobil (telefon) için: Tailwind md breakpoint'i (768px) altı "mobil" kabul edilsin
      return window.innerWidth < 768
    }
    return false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true)
      const pageContent = await getContactPageContent()
      setContent(pageContent)
      if (pageContent && pageContent.locations.length > 0) {
        const firstWithMap = pageContent.locations.find(loc => loc.mapEmbedUrl)
        setSelectedLocation(firstWithMap || pageContent.locations[0] || null)
      }
      setLoading(false)
    }
    fetchContent()
  }, [])

  // Fix: Ensure useMemo always returns a consistently typed object to avoid type inference issues.
  // FIX: Explicitly setting the return type for useMemo to avoid type inference issues with Object.entries downstream.
  const locationGroups = useMemo((): Record<string, ContactLocation[]> => {
    const groups: Record<string, ContactLocation[]> = {}
    for (const loc of content?.locations || []) {
      const type = t(loc.type) || t('other_location_type')
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type].push(loc)
    }
    return groups
  }, [content, t])

  // Seçili lokasyonun medyalarını al
  const selectedLocationMedia = useMemo(() => {
    if (
      !selectedLocation ||
      !selectedLocation.isMediaVisible ||
      !selectedLocation.media ||
      !Array.isArray(selectedLocation.media)
    ) {
      return []
    }
    return selectedLocation.media.filter(m => {
      const hasDirectUrl = Boolean(m.url)
      const hasImageAsset = Boolean(m.type === 'image' && m.image?.asset?.url)
      const hasVideoAsset = Boolean(m.type === 'video' && m.videoFile?.asset?.url)
      return hasDirectUrl || hasImageAsset || hasVideoAsset
    })
  }, [selectedLocation])

  const selectedLocationMediaForViewer = useMemo(
    () =>
      selectedLocationMedia
        .map(m => {
          let url = m.url || ''
          if (!url) {
            if (m.type === 'image' && m.image?.asset?.url) {
              url = m.image.asset.url
            } else if (m.type === 'video' && m.videoFile?.asset?.url) {
              url = m.videoFile.asset.url
            }
          }
          if (!url) return null

          if (m.type === 'youtube') {
            const id = getYouTubeId(url)
            url = id ? `https://www.youtube.com/embed/${id}?rel=0` : url
          }

          return {
            type: m.type,
            url,
          } as {type: 'image' | 'video' | 'youtube'; url: string}
        })
        .filter(Boolean) as {type: 'image' | 'video' | 'youtube'; url: string}[],
    [selectedLocationMedia]
  )

  // Seçili lokasyon değiştiğinde analytics event + sayfa başlığı gönder
  useEffect(() => {
    if (!selectedLocation) return

    const locationTitle = t(selectedLocation.title)
    const title = `İLETİŞİM - ${locationTitle}`

    if (typeof document !== 'undefined') {
      document.title = title
    }

    analytics.pageview(window.location.pathname, title)

    analytics.event({
      category: 'contact',
      action: 'view_location',
      label: locationTitle,
    })
  }, [selectedLocation, t])

  if (loading || !content) {
    return <PageLoading message={t('loading')} />
  }

  // Seçili lokasyonun medya bandı (thumbnail şeridi)
  const renderSelectedLocationMediaStrip = () => {
    if (selectedLocationMedia.length === 0) return null

    return (
      <>
        <style>{`
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
        <div className="relative select-none">
          {/* Mouse ile yatay sürükleme için; klavye ile etkileşim gerekmiyor */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            ref={thumbRef}
            className="hide-scrollbar overflow-x-auto cursor-grab active:cursor-grabbing w-full max-w-full"
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
              {selectedLocationMedia.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    analytics.event({
                      category: 'contact',
                      action: 'open_media',
                      label: selectedLocation ? t(selectedLocation.title) : '',
                      value: idx,
                    })
                    setSelectedMediaIndex(idx)
                    // Tüm cihazlarda: ürün / proje detay sayfasındakiyle aynı tam ekran viewer
                    setIsFullscreenOpen(true)
                  }}
                  className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 overflow-hidden border-2 border-transparent opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-300"
                >
                  {m.type === 'image' ? (
                    <OptimizedImage
                      src={m.url || ''}
                      alt={`Media ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      quality={75}
                      draggable={false}
                    />
                  ) : m.type === 'video' ? (
                    <div className="w-full h-full bg-black/60" />
                  ) : (
                    <OptimizedImage
                      src={youTubeThumb(m.url || '')}
                      alt={`youtube thumb ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      quality={75}
                    />
                  )}
                  {(m.type === 'video' || m.type === 'youtube') && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="bg-white/85 text-gray-900 w-10 h-10 flex items-center justify-center shadow">
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
          {selectedLocationMedia.length > 6 && (
            <>
              {/* Ok butonlarını sadece desktop'ta göster; mobilde parmakla kaydırma yeterli */}
              <button
                aria-label="scroll-left"
                onClick={() => {
                  if (!thumbRef.current) return
                  const delta = thumbRef.current.clientWidth || 240
                  thumbRef.current.scrollTo({
                    left: thumbRef.current.scrollLeft - delta,
                    behavior: 'smooth',
                  })
                }}
                className="hidden md:block md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 shadow px-2 py-2"
              >
                ‹
              </button>
              <button
                aria-label="scroll-right"
                onClick={() => {
                  if (!thumbRef.current) return
                  const delta = thumbRef.current.clientWidth || 240
                  thumbRef.current.scrollTo({
                    left: thumbRef.current.scrollLeft + delta,
                    behavior: 'smooth',
                  })
                }}
                className="hidden md:block md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 shadow px-2 py-2"
              >
                ›
              </button>
            </>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="bg-gray-100 animate-fade-in-up-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 lg:pt-24 pb-16">
        <Breadcrumbs
          className="mb-6"
          items={[{label: t('homepage'), to: '/'}, {label: t('contact')}]}
        />
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-gray-600 uppercase">
            {t('contact')}
          </h1>
          <div className="h-px bg-gray-300 mt-4 w-full"></div>
          <p className="mt-4 text-lg text-gray-500 max-w-3xl mx-auto font-light">
            {t(content.subtitle)}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div className="bg-white p-6 shadow-sm border border-gray-300 space-y-8 w-full overflow-x-hidden">
            {/* FIX: Refactored to use Object.keys to avoid potential type inference issues with Object.entries in some TypeScript environments. */}
            {Object.keys(locationGroups).map(type => (
              <div key={type}>
                <h2 className="text-2xl font-light text-gray-600 mb-2">{type}</h2>
                <div className="h-px bg-gray-300 mb-6 w-full"></div>
                <div className="space-y-4">
                  {(locationGroups[type] || []).map((loc, index) => (
                    <LocationCard
                      key={index}
                      location={loc}
                      isSelected={
                        selectedLocation?.title === loc.title &&
                        selectedLocation?.address === loc.address
                      }
                      onSelect={() => setSelectedLocation(loc)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mobilde: haritanın üzerinde medya bandı */}
          {selectedLocationMedia.length > 0 && (
            <div className="mt-4 border-y border-gray-300 py-2 md:hidden w-full overflow-x-hidden">
              {renderSelectedLocationMediaStrip()}
            </div>
          )}

          <div className="bg-white shadow-sm border border-gray-300 overflow-hidden min-h-[340px] md:min-h-[380px] sticky top-32 h-[420px] md:h-[460px] lg:h-[520px]">
            {selectedLocation?.mapEmbedUrl ? (
              <iframe
                src={convertGoogleMapsUrlToEmbed(selectedLocation.mapEmbedUrl)}
                width="100%"
                height="100%"
                style={{border: 0}}
                allow="fullscreen"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${t(selectedLocation.title)}`}
                key={selectedLocation.mapEmbedUrl}
              ></iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                <p>{t('map_not_available')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Medya Bantı - Seçili lokasyonun medyaları (sadece desktop: haritanın altında tam genişlik) */}
        {selectedLocationMedia.length > 0 && (
          <div className="mt-12 border-y border-gray-300 py-3 hidden md:block">
            {renderSelectedLocationMediaStrip()}
          </div>
        )}
      </div>
      {/* Tüm cihazlar için: ürün / proje detay sayfasındakiyle aynı tam ekran viewer */}
      {isFullscreenOpen && selectedLocationMediaForViewer.length > 0 && (
        <FullscreenMediaViewer
          items={selectedLocationMediaForViewer}
          initialIndex={selectedMediaIndex}
          onClose={() => setIsFullscreenOpen(false)}
          forceShowArrows
        />
      )}
    </div>
  )
}
