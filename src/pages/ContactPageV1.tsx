import React, {useState, useEffect, useMemo, useRef, useCallback} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {getContactPageContent} from '../services/cms'
import type {ContactPageContent, ContactLocation} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {analytics} from '../lib/analytics'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {FullscreenMediaViewer} from '../components/FullscreenMediaViewer'
import {useSEO} from '../hooks/useSEO'

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

  // iframe tag i├ğeriyorsa src i├ğindeki URL'i alal─▒m
  const iframeSrcMatch = url.match(/src=["'](.*?)["']/)
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    url = iframeSrcMatch[1]
  }

  // Zaten embed URL ise oldu─şu gibi d├Ând├╝r
  if (url.includes('/embed')) {
    // E─şer https:// yoksa ve url bir website protokol ile ba┼şlam─▒yorsa ekle
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`
    }
    return url
  }

  // Place ID'yi ├ğ─▒kar - format: !1s0x14cab93b568287b3:0xbae194105488893c
  // Veya data=!4m2!3m1!1s0x14cab93b568287b3:0xbae194105488893c format─▒nda
  const placeIdMatch = url.match(/!1s([^!?&]+)/)
  if (placeIdMatch && placeIdMatch[1]) {
    const placeId = placeIdMatch[1]
    // Embed URL format─▒na ├ğevir - Google Maps embed format─▒
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s${encodeURIComponent(placeId)}!2s!5e0!3m2!1str!2str!4v1!5m2!1str!2str`
  }

  // data parametresinden ├ğ─▒kar - format: data=!4m2!3m1!1s...
  const dataMatch = url.match(/data=!([^?&]+)/)
  if (dataMatch && dataMatch[1]) {
    const data = dataMatch[1]
    // Embed URL format─▒na ├ğevir
    return `https://www.google.com/maps/embed?pb=!${data}`
  }

  // Place link format─▒: google.com/maps/place/...
  const placeMatch = url.match(/maps\/place\/([^/?]+)/)
  if (placeMatch && placeMatch[1]) {
    let placeName = placeMatch[1]
    // Decode first to avoid double encoding in case it's already encoded
    try {
      placeName = decodeURIComponent(placeName)
    } catch (e) {
      /* ignore error */
    }
    // Place name ile search yaparak embed olu┼ştur (API keysiz kullan─▒m)
    return `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&t=&z=14&ie=UTF8&iwloc=&output=embed`
  }

  // Hi├ğbiri e┼şle┼şmezse, q parametresi varsa onu dene veya son ├ğare kendisini d├Ând├╝r
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

const ThinArrowLeft = (props: React.ComponentProps<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="square"
    strokeLinejoin="miter"
    {...props}
  >
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
)

const ThinArrowRight = (props: React.ComponentProps<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="square"
    strokeLinejoin="miter"
    {...props}
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
)
const LocationCard: React.FC<{
  location: ContactLocation
  isSelected: boolean
  isMapVisible: boolean
  onSelect: () => void
  onShowMap: () => void
}> = ({location, isSelected, isMapVisible, onSelect, onShowMap}) => {
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
      className={`p-4 cursor-pointer w-full max-full transition-all duration-300 ${
        isSelected ? 'bg-[var(--bg-tertiary)]' : 'hover:bg-[var(--bg-secondary)]'
      }`}
    >
      <h3 className="text-xl font-light text-[var(--text-secondary)]">{t(location.title)}</h3>
      <p className="mt-2 text-[var(--text-secondary)] flex items-start gap-2 font-light">
        <MapPinIcon className="mt-1 flex-shrink-0 opacity-60" />
        <span className="break-words">{location.address}</span>
      </p>
      <p className="mt-1 text-[var(--text-secondary)] flex items-center gap-2 font-light">
        <PhoneIcon className="flex-shrink-0 opacity-60" />
        <span>{location.phone}</span>
      </p>
      {location.email && (
        <p className="mt-1 text-[var(--text-secondary)] flex items-center gap-2 font-light">
          <MailIcon className="flex-shrink-0 opacity-60" />
          <span>{location.email}</span>
        </p>
      )}

      {/* Haritay─▒ A├ğ Butonu & Harita */}
      <AnimatePresence>
        {isSelected && location.mapEmbedUrl && (
          <motion.div
            key="show-map-btn"
            initial={{opacity: 0, height: 0}}
            animate={{opacity: 1, height: 'auto'}}
            exit={{opacity: 0, height: 0}}
            transition={{duration: 0.3}}
            className="mt-6 overflow-hidden flex flex-col gap-4"
          >
            <button
              type="button"
              onClick={e => {
                e.stopPropagation() // Kart se├ğimini tekrar tetiklememek i├ğin
                onShowMap()
              }}
              className={`flex items-center gap-2 px-5 py-2.5 outline-none font-light tracking-wider text-sm transition-all duration-300 w-max ${
                isMapVisible
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:opacity-80 border border-[var(--border-primary)] shadow-inner'
                  : 'bg-[var(--bg-primary)] text-[var(--text-primary)] hover:opacity-80 border border-[var(--border-primary)] shadow-sm hover:shadow active:scale-95'
              }`}
            >
              <MapPinIcon className="w-4 h-4" />
              {isMapVisible
                ? t('hide_map') || 'HAR─░TAYI G─░ZLE'
                : t('show_map') || 'HAR─░TAYI G├ûR'}
            </button>

            <AnimatePresence>
              {isMapVisible && (
                <motion.div
                  key="inline-map"
                  initial={{opacity: 0, height: 0}}
                  animate={{opacity: 1, height: 450}}
                  exit={{opacity: 0, height: 0}}
                  transition={{duration: 0.5, ease: [0.22, 1, 0.36, 1]}}
                  className="w-full relative shadow-sm border border-[var(--border-primary)] mt-2"
                >
                  <iframe
                    src={convertGoogleMapsUrlToEmbed(location.mapEmbedUrl)}
                    width="100%"
                    height="100%"
                    style={{border: 0}}
                    className="w-full h-full"
                    allow="fullscreen"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${t(location.title)}`}
                  ></iframe>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ContactPageV1() {
  const [content, setContent] = useState<ContactPageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<ContactLocation | null>(null)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(0)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const thumbRef = useRef<HTMLDivElement | null>(null)
  const [thumbDragStartX, setThumbDragStartX] = useState<number | null>(null)
  const [thumbScrollStart, setThumbScrollStart] = useState<number>(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const {t} = useTranslation()

  const checkScroll = useCallback(() => {
    if (thumbRef.current) {
      const {scrollLeft, scrollWidth, clientWidth} = thumbRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth)
    }
  }, [])

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [checkScroll, selectedLocation])

  // SEO meta
  useSEO({
    title: t('contact_meta_title') || `BIRIM - ${t('contact')}`,
    description: t(content?.subtitle) || t('contact_meta_description_default'),
    type: 'website',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'Contact',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: t('contact') || '─░leti┼şim',
      url: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/#/contact`,
      description: t(content?.subtitle) || t('contact_meta_description_default'),
      mainEntity: {
        '@type': 'Organization',
        '@id': `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/#organization`,
        name: 'BIRIM',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          areaServed: 'TR',
          availableLanguage: ['Turkish', 'English'],
        },
      },
    },
  })

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true)
      const pageContent = await getContactPageContent()
      setContent(pageContent)
      // ─░lk a├ğ─▒l─▒┼şta hi├ğbir adresi se├ğili yapma, harita da gizli kals─▒n
      setSelectedLocation(null)
      setShowMap(false)
      setLoading(false)
    }
    fetchContent()
  }, [])

  // Fix: Ensure useMemo always returns a consistently typed object to avoid type inference issues.
  const locationGroupsMap = useMemo(() => {
    const map = new Map<string, ContactLocation[]>()
    for (const loc of content?.locations || []) {
      const type = t(loc.type) || t('other_location_type')
      if (!map.has(type)) {
        map.set(type, [])
      }
      map.get(type)!.push(loc)
    }
    return map
  }, [content, t])

  // Se├ğili lokasyonun medyalar─▒n─▒ al
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

  useEffect(() => {
    if (!selectedLocation) return
    const locationTitle = t(selectedLocation.title)
    analytics.event({
      category: 'contact',
      action: 'view_location',
      label: locationTitle,
    })

    // Se├ğim de─şi┼şti─şinde haritay─▒ direkt G├ûSTERME
    setShowMap(false)

    // Log a generate_lead event for viewing contact info
    analytics.event({
      action: 'generate_lead',
      category: 'Contact',
      label: locationTitle,
    })
  }, [selectedLocation, t])

  if (loading || !content) {
    return <PageLoading message={t('loading')} />
  }

  // Se├ğili lokasyonun medya band─▒ (thumbnail ┼şeridi)
  const renderSelectedLocationMediaStrip = () => {
    if (selectedLocationMedia.length === 0) return null

    return (
      <>
        <div className="relative select-none">
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            ref={thumbRef}
            className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing w-full max-w-full focus:outline-none"
            onScroll={checkScroll}
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
            <motion.div
              key={`contact-media-${selectedLocationMedia.length}`}
              className="flex gap-3 min-w-max pb-2"
              initial="revealOff"
              animate="revealOn"
              variants={{
                revealOff: {opacity: 0},
                revealOn: {opacity: 1, transition: {staggerChildren: 0.1}},
              }}
            >
              {selectedLocationMedia.map((m, idx) => (
                <motion.div
                  key={idx}
                  className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24"
                  variants={{
                    revealOff: {opacity: 0, x: -50},
                    revealOn: {
                      opacity: 1,
                      x: 0,
                      transition: {type: 'spring', stiffness: 100, damping: 20},
                    },
                  }}
                >
                  <button
                    onClick={() => {
                      analytics.event({
                        category: 'contact',
                        action: 'open_media',
                        label: selectedLocation ? t(selectedLocation.title) : '',
                        value: idx,
                      })
                      setSelectedMediaIndex(idx)
                      setIsFullscreenOpen(true)
                    }}
                    className="relative w-full h-full border-2 border-transparent opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-300"
                  >
                    <motion.div
                      variants={{
                        revealOff: {scaleX: 0, transformOrigin: 'left'},
                        revealOn: {
                          scaleX: 1,
                          transition: {duration: 0.8, ease: [0.22, 1, 0.36, 1]},
                        },
                      }}
                      className="relative overflow-hidden w-full h-full"
                    >
                      <motion.div
                        variants={{
                          revealOff: {opacity: 0, x: -20},
                          revealOn: {
                            opacity: 1,
                            x: 0,
                            transition: {delay: 0.2, duration: 0.8},
                          },
                        }}
                        className="w-full h-full"
                      >
                        {m.type === 'image' ? (
                          <OptimizedImage
                            src={m.url || ''}
                            alt={`Media ${idx + 1}`}
                            className="w-full h-full object-cover shadow-sm"
                            loading="lazy"
                            quality={75}
                            draggable={false}
                          />
                        ) : m.type === 'video' ? (
                          <div className="w-full h-full bg-black/60 shadow-sm" />
                        ) : (
                          <OptimizedImage
                            src={youTubeThumb(m.url || '')}
                            alt={`youtube thumb ${idx + 1}`}
                            className="w-full h-full object-cover shadow-sm"
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
                      </motion.div>
                    </motion.div>
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </div>
          {canScrollLeft && (
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
              className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-12 items-center justify-center rounded transition-transform hover:scale-105 active:scale-95 z-10 w-10 h-10 text-gray-500 hover:text-gray-900 bg-transparent"
            >
              <ThinArrowLeft className="w-8 h-8" />
            </button>
          )}

          {canScrollRight && (
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
              className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-12 items-center justify-center rounded transition-transform hover:scale-105 active:scale-95 z-10 w-10 h-10 text-gray-500 hover:text-gray-900 bg-transparent"
            >
              <ThinArrowRight className="w-8 h-8" />
            </button>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="bg-[var(--bg-primary)] pt-20 md:pt-20 lg:pt-20 transition-colors duration-500">
      {/* Breadcrumb Band */}
      <div className="w-full relative z-20">
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4">
          <motion.div
            initial={{opacity: 0, y: 15}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6, ease: [0.22, 1, 0.36, 1]}}
          >
            <Breadcrumbs items={[{label: t('homepage'), to: '/'}, {label: t('contact')}]} />
          </motion.div>
        </div>
      </div>
      <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-4 md:pt-12 pb-12">
        <motion.div
          className="text-center"
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1]}}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)] tracking-tight uppercase">
            {t('contact')}
          </h1>
        </motion.div>
      </div>

      <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pb-16">
        <motion.div
          className="text-center mb-12 border-t border-[var(--border-primary)] pt-16"
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1]}}
        >
          <p className="text-lg text-[var(--text-secondary)] max-w-3xl mx-auto font-light">
            {t(content.subtitle)}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 max-w-4xl mx-auto gap-8 md:gap-12 items-start transition-all duration-700 ease-in-out">
          <motion.div
            className="bg-[var(--bg-primary)] p-6 shadow-sm border border-[var(--border-primary)] w-full overflow-x-hidden"
            initial={{opacity: 0, y: 30}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1]}}
          >
            {Array.from(locationGroupsMap.entries()).map(([type, locs]) => (
              <div key={type} className="mb-8 last:mb-0">
                <h2 className="text-2xl font-light text-[var(--text-secondary)] mb-2">{type}</h2>
                <div className="h-px bg-[var(--border-primary)] mb-6 w-full"></div>
                <div className="space-y-4">
                  {locs.map((loc, index) => (
                    <LocationCard
                      key={index}
                      location={loc}
                      isSelected={
                        selectedLocation?.title === loc.title &&
                        selectedLocation?.address === loc.address
                      }
                      isMapVisible={
                        showMap &&
                        selectedLocation?.title === loc.title &&
                        selectedLocation?.address === loc.address
                      }
                      onSelect={() => {
                        setSelectedLocation(loc)
                        setShowMap(false)
                      }}
                      onShowMap={() => setShowMap(!showMap)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>

          {selectedLocationMedia.length > 0 && (
            <motion.div
              className="mt-4 border-y border-[var(--border-primary)] py-2 md:hidden w-full overflow-x-hidden"
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1]}}
            >
              {renderSelectedLocationMediaStrip()}
            </motion.div>
          )}

          {selectedLocationMedia.length > 0 && (
            <motion.div
              className="mt-8 border-y border-[var(--border-primary)] py-3 hidden md:block"
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.6, ease: [0.22, 1, 0.36, 1]}}
            >
              {renderSelectedLocationMediaStrip()}
            </motion.div>
          )}
        </div>
        {isFullscreenOpen && selectedLocationMediaForViewer.length > 0 && (
          <FullscreenMediaViewer
            items={selectedLocationMediaForViewer}
            initialIndex={selectedMediaIndex}
            onClose={() => setIsFullscreenOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
