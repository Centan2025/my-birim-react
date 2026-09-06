import {useState, useEffect, useMemo} from 'react'
import {motion} from 'framer-motion'
import {getContactPageContent, mapImage} from '../services/cms'
import type {ContactPageContent, ContactLocation, NewsMedia} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {analytics} from '../lib/analytics'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {FullscreenMediaViewer} from '../components/FullscreenMediaViewer'
import {useSEO} from '../hooks/useSEO'
import {useHeaderTheme} from '../context/HeaderThemeContext'
import ScrollReveal from '../components/ScrollReveal'

const containerClass =
  'w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0'

const DEFAULT_SPACE_IMAGES = [
  'https://assets.birim.com/migration/about/hero-1788417284053.jpg',
  'https://assets.birim.com/migration/about/history-1788417454936.jpg',
  'https://assets.birim.com/migration/about/quality-1788417453056.jpg',
  'https://assets.birim.com/migration/about/identity-1788417450030.jpg',
]

const DEFAULT_FALLBACK_LOCATION: ContactLocation = {
  title: {tr: 'Nişantaşı Showroom', en: 'Nişantaşı Showroom'},
  type: {tr: 'Nişantaşı', en: 'Nişantaşı'},
  address: 'Abdi İpekçi Cad. No: 42 Nişantaşı, 34367 Şişli / İstanbul',
  phone: '+90 (212) 284 82 82',
  email: 'nisantasi@birim.com',
  mapEmbedUrl:
    'https://maps.google.com/maps?q=Abdi+Ipekci+Caddesi+Nisantasi&t=&z=15&ie=UTF8&iwloc=&output=embed',
  isMediaVisible: true,
}

const convertGoogleMapsUrlToEmbed = (url: string): string => {
  if (!url) return ''

  const iframeSrcMatch = url.match(/src=["'](.*?)["']/)
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    url = iframeSrcMatch[1]
  }

  if (url.includes('/embed')) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`
    }
    return url
  }

  const placeIdMatch = url.match(/!1s([^!?&]+)/)
  if (placeIdMatch && placeIdMatch[1]) {
    const placeId = placeIdMatch[1]
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s${encodeURIComponent(placeId)}!2s!5e0!3m2!1str!2str!4v1!5m2!1str!2str`
  }

  const dataMatch = url.match(/data=!([^?&]+)/)
  if (dataMatch && dataMatch[1]) {
    const data = dataMatch[1]
    return `https://www.google.com/maps/embed?pb=!${data}`
  }

  const placeMatch = url.match(/maps\/place\/([^/?]+)/)
  if (placeMatch && placeMatch[1]) {
    let placeName = placeMatch[1]
    try {
      placeName = decodeURIComponent(placeName)
    } catch {
      /* ignore */
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&t=&z=14&ie=UTF8&iwloc=&output=embed`
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }

  return url
}

const getYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  )
  return match && match[1] && match[1].length === 11 ? match[1] : null
}

export function ContactPageV2() {
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'
  const {reset: resetHeaderTheme} = useHeaderTheme()

  const [content, setContent] = useState<ContactPageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Fullscreen Viewer
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState<NewsMedia[]>([])
  const [viewerIndex, setViewerIndex] = useState(0)

  useEffect(() => {
    resetHeaderTheme()
  }, [resetHeaderTheme])

  useSEO({
    title: t('contact_meta_title') || `BIRIM - ${t('contact')}`,
    description: t(content?.subtitle) || t('contact_meta_description_default'),
    type: 'website',
    siteName: 'BIRIM',
    locale: isTr ? 'tr_TR' : 'en_US',
    section: 'Contact',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: t('contact') || 'İletişim',
      url: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/contact?v=2`,
      description: t(content?.subtitle) || t('contact_meta_description_default'),
    },
  })

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true)
      try {
        const data = await getContactPageContent()
        setContent(data)
      } catch (err) {
        console.error('Contact fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [])

  const locations = useMemo<ContactLocation[]>(() => {
    if (content?.locations && content.locations.length > 0) {
      return content.locations
    }
    return [
      {
        title: {tr: 'Nişantaşı Showroom', en: 'Nişantaşı Showroom'},
        type: {tr: 'Nişantaşı', en: 'Nişantaşı'},
        address: 'Abdi İpekçi Cad. No: 42 Nişantaşı, 34367 Şişli / İstanbul',
        phone: '+90 (212) 284 82 82',
        email: 'nisantasi@birim.com',
        mapEmbedUrl:
          'https://maps.google.com/maps?q=Abdi+Ipekci+Caddesi+Nisantasi&t=&z=15&ie=UTF8&iwloc=&output=embed',
        isMediaVisible: true,
      },
      {
        title: {tr: 'Fenerbahçe Showroom', en: 'Fenerbahçe Showroom'},
        type: {tr: 'Fenerbahçe', en: 'Fenerbahçe'},
        address: 'Fener Kalamış Cad. No: 18 Fenerbahçe, 34726 Kadıköy / İstanbul',
        phone: '+90 (216) 345 80 80',
        email: 'fenerbahce@birim.com',
        mapEmbedUrl:
          'https://maps.google.com/maps?q=Fener+Kalamis+Caddesi+Fenerbahce&t=&z=15&ie=UTF8&iwloc=&output=embed',
        isMediaVisible: true,
      },
    ]
  }, [content?.locations])

  const getLocationBadgeName = (loc: ContactLocation, idx: number): string => {
    const typeStr = t(loc.type)
    if (typeStr && !/^(Showroom|Fabrika|Mağaza|Ofis|Genel|Diğer)/i.test(typeStr.trim())) {
      return typeStr.toUpperCase()
    }

    const titleStr = t(loc.title)
    const addrStr = loc.address || ''

    const districts = [
      'Nişantaşı',
      'Fenerbahçe',
      'Sancaktepe',
      'Levent',
      'Dilovası',
      'Maslak',
      'Kalamış',
      'Bağdat Caddesi',
      'Etiler',
      'Kadıköy',
      'Beşiktaş',
      'Şişli',
      'Ataşehir',
      'Ümraniye',
      'Tuzla',
      'Kartal',
      'Maltepe',
      'Sarıyer',
      'Beyoğlu',
      'Kocaeli',
    ]

    for (const d of districts) {
      if (new RegExp(d, 'i').test(titleStr) || new RegExp(d, 'i').test(addrStr)) {
        return d.toUpperCase()
      }
    }

    const cleaned = titleStr
      .replace(
        /Showroom|Mağaza|Tasarım Stüdyosu|Entegre Üretim Tesisi|Fabrika|Deneyim Alanı|&/gi,
        ''
      )
      .trim()
    if (cleaned.length > 1 && cleaned.length < 20) {
      return cleaned.toUpperCase()
    }

    return titleStr
      ? (titleStr.split(' ')[0] || (idx === 0 ? 'NİŞANTAŞI' : 'FENERBAHÇE')).toUpperCase()
      : idx === 0
        ? 'NİŞANTAŞI'
        : 'FENERBAHÇE'
  }

  const gridClass = useMemo(() => {
    const count = locations.length
    if (count === 1) return 'grid grid-cols-1 max-w-3xl mx-auto gap-8'
    if (count === 2) return 'grid grid-cols-1 lg:grid-cols-2 max-w-6xl mx-auto gap-8 lg:gap-12'
    if (count === 4) return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
    if (count % 2 === 0) return 'grid grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto gap-8 lg:gap-12'
    return 'grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10'
  }, [locations.length])

  const activeLocation: ContactLocation =
    locations[selectedLocationIndex] ?? locations[0] ?? DEFAULT_FALLBACK_LOCATION

  const getLocationMedia = (loc: ContactLocation, idx: number): NewsMedia[] => {
    if (loc?.media && loc.media.length > 0) {
      const parsed = loc.media
        .map(m => {
          let url = m.url || ''
          if (!url) {
            const rawImage =
              (m as {imageR2?: unknown}).imageR2 ||
              (m as {imageDesktopR2?: unknown}).imageDesktopR2 ||
              (m as {imageMobileR2?: unknown}).imageMobileR2 ||
              m.image
            if (rawImage) {
              url = mapImage(rawImage) || ''
            }
            if (!url && m.type === 'image' && m.image?.asset?.url) url = m.image.asset.url
            if (m.type === 'video' && m.videoFile?.asset?.url) url = m.videoFile.asset.url
          }
          if (m.type === 'youtube' && url) {
            const id = getYouTubeId(url)
            url = id ? `https://www.youtube.com/embed/${id}?rel=0` : url
          }
          return {type: m.type || 'image', url}
        })
        .filter(m => Boolean(m.url)) as NewsMedia[]

      if (parsed.length > 0) return parsed
    }

    const directImage =
      (loc as {imageR2?: unknown}).imageR2 || (loc as {image?: {url?: string}}).image
    if (directImage) {
      const url =
        typeof (directImage as {url?: string})?.url === 'string'
          ? (directImage as {url: string}).url
          : mapImage(directImage)
      if (url) {
        return [{type: 'image', url}]
      }
    }

    const fallback: string =
      DEFAULT_SPACE_IMAGES[idx % DEFAULT_SPACE_IMAGES.length] ?? DEFAULT_SPACE_IMAGES[0] ?? ''
    return [{type: 'image', url: fallback}]
  }

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const openGalleryForLocation = (loc: ContactLocation, idx: number) => {
    const media = getLocationMedia(loc, idx)
    setViewerImages(media)
    setViewerIndex(0)
    setIsFullscreenOpen(true)
  }

  if (loading) {
    return <PageLoading message={t('loading')} />
  }

  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen pt-20 md:pt-20 lg:pt-20 transition-colors duration-500">
      {/* Breadcrumbs */}
      <div className="w-full relative z-20">
        <div className={containerClass + ' py-4'}>
          <Breadcrumbs items={[{label: t('homepage'), to: '/'}, {label: t('contact')}]} />
        </div>
      </div>

      {/* Main Page Title (Matching Designers Page) */}
      <header className={'relative z-10 ' + containerClass + ' pt-4 md:pt-12 pb-12'}>
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 1, ease: 'easeOut'}}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)] tracking-tight text-center uppercase">
            {t(content?.title) || t('contact')}
          </h1>
        </motion.div>
      </header>

      {/* Subtitle with clean divider */}
      <div className={containerClass + ' pb-16'}>
        {content?.subtitle && (
          <div className="text-center mb-14 border-t border-[var(--border-primary)] pt-10 max-w-3xl mx-auto">
            <p className="text-base md:text-lg text-[var(--text-secondary)] font-light leading-relaxed">
              {t(content.subtitle)}
            </p>
          </div>
        )}

        {/* Section 1: Architectural Location Cards Grid */}
        <div className={gridClass}>
          {locations.map((loc, idx) => {
            const media = getLocationMedia(loc, idx)
            const mainImg: string =
              media[0]?.url ||
              DEFAULT_SPACE_IMAGES[idx % DEFAULT_SPACE_IMAGES.length] ||
              DEFAULT_SPACE_IMAGES[0] ||
              ''

            const isShowroom = idx === 0
            const defaultHours = isShowroom
              ? isTr
                ? 'Hafta İçi: 09:00 – 18:30 · Cumartesi: 10:00 – 17:00'
                : 'Mon – Fri: 09:00 – 18:30 · Sat: 10:00 – 17:00'
              : isTr
                ? 'Hafta İçi: 08:00 – 18:00 · Hafta Sonu: Kapalı'
                : 'Mon – Fri: 08:00 – 18:00 · Weekends: Closed'
            const hoursText = loc.hours ? t(loc.hours) : defaultHours

            return (
              <ScrollReveal key={idx} delay={idx * 100} distance={15}>
                <div className="group flex flex-col h-full bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--text-secondary)]/40 hover:shadow-md transition-all duration-500">
                  {/* Space Photograph */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openGalleryForLocation(loc, idx)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openGalleryForLocation(loc, idx)
                      }
                    }}
                    className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-secondary)] cursor-pointer"
                  >
                    <OptimizedImage
                      src={mainImg}
                      alt={t(loc.title)}
                      className="w-full h-full object-cover grayscale contrast-[1.05] brightness-[0.94] opacity-90 group-hover:grayscale-0 group-hover:contrast-100 group-hover:brightness-100 group-hover:opacity-100 transition-all duration-700 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-700 pointer-events-none" />
                  </div>

                  {/* Space Details */}
                  <div className="p-6 md:p-8 flex flex-col flex-grow justify-between space-y-6">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-secondary)] block mb-1">
                        {t(loc.type)}
                      </span>
                      <h3 className="text-xl md:text-2xl font-light text-[var(--text-primary)] tracking-tight">
                        {t(loc.title)}
                      </h3>

                      <p className="mt-3 text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                        {loc.address}
                      </p>

                      {/* Working Hours Info */}
                      <div className="mt-4 pt-4 border-t border-[var(--border-primary)]/60 flex items-start gap-2 text-xs text-[var(--text-secondary)] font-light">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 border border-[var(--border-primary)]">
                          {isTr ? 'Saatler' : 'Hours'}
                        </span>
                        <span>{hoursText}</span>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-[var(--border-primary)] space-y-3 text-xs font-light">
                      {/* Phone & Address Copy */}
                      <div className="flex items-center justify-between">
                        <a
                          href={`tel:${loc.phone.replace(/[^0-9+]/g, '')}`}
                          className="text-[var(--text-primary)] hover:underline font-mono text-sm tracking-wide"
                        >
                          {loc.phone}
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(loc.address, `addr-${idx}`)}
                          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer text-xs transition-colors"
                        >
                          {copiedId === `addr-${idx}` ? (
                            <span className="text-emerald-600 font-medium">
                              ✓ {isTr ? 'Kopyalandı' : 'Copied'}
                            </span>
                          ) : (
                            <span>{isTr ? 'Adresi Kopyala' : 'Copy Address'}</span>
                          )}
                        </button>
                      </div>

                      {/* Email */}
                      {loc.email && (
                        <div className="flex items-center justify-between">
                          <a
                            href={`mailto:${loc.email}`}
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline block truncate font-mono"
                          >
                            {loc.email}
                          </a>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(loc.email || '', `email-${idx}`)}
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer text-xs transition-colors"
                          >
                            {copiedId === `email-${idx}` ? (
                              <span className="text-emerald-600 font-medium">✓</span>
                            ) : (
                              <span>{isTr ? 'E-postayı Kopyala' : 'Copy'}</span>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="pt-3 border-t border-[var(--border-primary)]/60 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLocationIndex(idx)
                            const mapEl = document.getElementById('interactive-map-section')
                            mapEl?.scrollIntoView({behavior: 'smooth'})
                          }}
                          className="text-[var(--text-primary)] font-mono text-xs uppercase tracking-wider underline hover:opacity-75 cursor-pointer py-1"
                        >
                          {isTr ? 'Haritada İncele ↓' : 'View on Map ↓'}
                        </button>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-xs uppercase tracking-wider hover:underline py-1"
                        >
                          {isTr ? 'Google Maps ↗' : 'Directions ↗'}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>

        {/* Section 2: Full Interactive Map Section */}
        <div
          id="interactive-map-section"
          className="mt-24 pt-16 border-t border-[var(--border-primary)]"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">
                {isTr ? 'Konum' : 'Location'}
              </span>
              <h2 className="text-2xl md:text-3xl font-light text-[var(--text-primary)] mt-1.5 tracking-tight">
                {t(activeLocation.title)}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-light">
                {activeLocation.address}
              </p>
            </div>

            {/* Redesigned Location Switcher Buttons (Nişantaşı, Fenerbahçe etc.) */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {locations.map((loc, idx) => {
                const isSelected = selectedLocationIndex === idx
                const labelName = getLocationBadgeName(loc, idx)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedLocationIndex(idx)
                      analytics.event({
                        category: 'Contact',
                        action: 'map_tab_switch',
                        label: labelName,
                      })
                    }}
                    className={`relative px-5 py-2.5 text-xs font-mono uppercase tracking-widest transition-all cursor-pointer border ${
                      isSelected
                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)] font-medium shadow-sm'
                        : 'border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)]/50'
                    }`}
                  >
                    {labelName}
                  </button>
                )
              })}
            </div>
          </div>

          {activeLocation.mapEmbedUrl && (
            <div className="relative aspect-[16/9] md:aspect-[21/9] w-full border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden shadow-sm">
              <iframe
                src={convertGoogleMapsUrlToEmbed(activeLocation.mapEmbedUrl)}
                width="100%"
                height="100%"
                style={{border: 0}}
                className="w-full h-full"
                allow="fullscreen"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={t(activeLocation.title)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox Media Viewer */}
      {isFullscreenOpen && viewerImages.length > 0 && (
        <FullscreenMediaViewer
          items={viewerImages.map(m => ({
            type: m.type as 'image' | 'video' | 'youtube',
            url: m.url,
          }))}
          initialIndex={viewerIndex}
          onClose={() => setIsFullscreenOpen(false)}
        />
      )}
    </div>
  )
}
