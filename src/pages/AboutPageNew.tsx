import {useState, useEffect} from 'react'
import {Link} from 'react-router-dom'
import {motion, AnimatePresence} from 'framer-motion'
import {getAboutPageContent, getDesigners} from '../services/cms'
import type {AboutPageContent, NewsMedia, Designer, R2ImageMetadata} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useSEO} from '../hooks/useSEO'
import {useHeaderTheme} from '../context/HeaderThemeContext'
import ScrollReveal from '../components/ScrollReveal'
import PortableTextLite from '../components/PortableTextLite'
import {FullscreenMediaViewer} from '../components/FullscreenMediaViewer/FullscreenMediaViewer'

const containerClass =
  'w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0'

const DEFAULT_IMAGES = {
  hero: 'https://assets.birim.com/migration/about/hero-1788417284053.jpg',
  history: 'https://assets.birim.com/migration/about/history-1788417454936.jpg',
  identity: 'https://assets.birim.com/migration/about/identity-1788417450030.jpg',
  quality: 'https://assets.birim.com/migration/about/quality-1788417453056.jpg',
}

const isBrokenUrl = (url?: string): boolean =>
  !url || url.includes('1772637182314') || url.includes('BF006_CAB_06')

const getSanitizedImage = (img: unknown, fallback: string): string => {
  const rawUrl =
    typeof img === 'object' && img !== null && 'url' in img
      ? (img as {url?: string}).url
      : typeof img === 'string'
        ? img
        : ''
  return isBrokenUrl(rawUrl) ? fallback : rawUrl!
}

const getPlainText = (val: unknown): string => {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (Array.isArray(val)) {
    return val
      .map(item => {
        if (typeof item === 'string') return item
        if (typeof item === 'object' && item !== null) {
          const b = item as Record<string, unknown>
          if (Array.isArray(b['children'])) {
            return (b['children'] as Record<string, unknown>[])
              .map(child => (child['text'] as string) || '')
              .join('')
          }
        }
        return ''
      })
      .join(' ')
      .trim()
  }
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>
    if (typeof obj['tr'] === 'string') return obj['tr']
    if (typeof obj['en'] === 'string') return obj['en']
  }
  return String(val)
}

interface MediaGalleryProps {
  media?: NewsMedia[]
  alt: string
}

const MediaGallery = ({media, alt}: MediaGalleryProps) => {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [initialIndex, setInitialIndex] = useState(0)

  const galleryItems: NewsMedia[] =
    media && media.length > 0
      ? media.map((m, idx) => ({
          ...m,
          url: isBrokenUrl(m.url)
            ? idx % 3 === 0
              ? DEFAULT_IMAGES.hero
              : idx % 3 === 1
                ? DEFAULT_IMAGES.history
                : DEFAULT_IMAGES.quality
            : m.url,
        }))
      : [
          {type: 'image', url: DEFAULT_IMAGES.hero, caption: 'Birim Showroom Estetiği'},
          {type: 'image', url: DEFAULT_IMAGES.history, caption: 'Zanaat ve Atölye Hassasiyeti'},
          {type: 'image', url: DEFAULT_IMAGES.quality, caption: 'Modern Üretim Parkuru'},
        ]

  const openViewer = (index: number) => {
    setInitialIndex(index)
    setViewerOpen(true)
  }

  const viewerItems = galleryItems.map(m => ({
    type: (m.type === 'youtube' ? 'youtube' : m.type === 'video' ? 'video' : 'image') as
      | 'image'
      | 'video'
      | 'youtube',
    url: m.url,
    urlMobile: m.urlMobile,
    urlDesktop: m.urlDesktop,
    crop: m.crop,
    hotspot: m.hotspot,
  }))

  return (
    <>
      <div className="mt-12 w-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {galleryItems.map((m, idx) => (
            <ScrollReveal key={idx} delay={idx * 80} distance={10} threshold={0.1}>
              <div
                className="relative aspect-video overflow-hidden bg-[var(--bg-secondary)] cursor-pointer group"
                onClick={() => openViewer(idx)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openViewer(idx)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {m.type === 'video' || m.type === 'youtube' ? (
                  <div className="w-full h-full relative">
                    <video
                      src={m.url}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full border border-white/60 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    <OptimizedImage
                      src={m.url}
                      fallbackSrc={DEFAULT_IMAGES.history}
                      srcMobile={m.urlMobile}
                      srcDesktop={m.urlDesktop}
                      alt={`${alt} ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      crop={m.crop}
                      hotspot={m.hotspot}
                      origWidth={m.origWidth as number}
                      origHeight={m.origHeight as number}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {viewerOpen && (
        <FullscreenMediaViewer
          items={viewerItems}
          initialIndex={initialIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  )
}

export function AboutPageNew() {
  const [content, setContent] = useState<AboutPageContent | null>(null)
  const [designers, setDesigners] = useState<Designer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeEraIndex, setActiveEraIndex] = useState(0)
  const [activeDesignerIndex, setActiveDesignerIndex] = useState(0)
  const {t} = useTranslation()
  const {reset} = useHeaderTheme()

  useEffect(() => {
    // Let the Header's hero-boundary tracker handle light/dark mode.
    // Reset any leftover theme from previous pages on mount/unmount.
    reset()
    return () => reset()
  }, [reset])

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      setLoading(true)
      try {
        const [pageContent, designerList] = await Promise.all([
          getAboutPageContent(),
          getDesigners().catch(() => []),
        ])
        if (isMounted) {
          setContent(pageContent || null)
          setDesigners(designerList || [])
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchData()
    return () => {
      isMounted = false
    }
  }, [])

  const getImageMeta = (img: unknown) => {
    if (typeof img === 'object' && img !== null) {
      const obj = img as Record<string, unknown>
      return {
        crop: obj['crop'] as R2ImageMetadata['crop'],
        hotspot: obj['hotspot'] as R2ImageMetadata['hotspot'],
        origWidth: obj['origWidth'] as number | undefined,
        origHeight: obj['origHeight'] as number | undefined,
      }
    }
    return {}
  }

  const heroImageObj =
    typeof content?.heroImage === 'object' && content?.heroImage !== null
      ? (content.heroImage as Record<string, unknown>)
      : null
  const heroImageMobileObj =
    typeof content?.heroImageMobile === 'object' && content?.heroImageMobile !== null
      ? (content.heroImageMobile as Record<string, unknown>)
      : null

  const heroImageUrl = getSanitizedImage(
    heroImageObj?.['url'] || content?.heroImage,
    DEFAULT_IMAGES.hero
  )
  const heroImageMobileUrl = getSanitizedImage(
    heroImageMobileObj?.['url'] ||
      (heroImageObj?.['urlMobile'] as string | undefined) ||
      content?.heroImageMobile,
    ''
  )

  const heroImgMeta = getImageMeta(content?.heroImage)
  const heroImgMobMeta = getImageMeta(content?.heroImageMobile)
  const identityImgUrl = getSanitizedImage(content?.identitySection?.image, DEFAULT_IMAGES.identity)
  const identityImgMobileUrl = getSanitizedImage(content?.identitySection?.imageMobile, '')
  const qualityImgUrl = getSanitizedImage(content?.qualitySection?.image, DEFAULT_IMAGES.quality)
  const qualityImgMobileUrl = getSanitizedImage(content?.qualitySection?.imageMobile, '')

  const identityImgMeta = getImageMeta(content?.identitySection?.image)
  const identityImgMobMeta = getImageMeta(content?.identitySection?.imageMobile)
  const qualityImgMeta = getImageMeta(content?.qualitySection?.image)
  const qualityImgMobMeta = getImageMeta(content?.qualitySection?.imageMobile)

  const identitySection = {
    title: content?.identitySection?.title,
    content: content?.identitySection?.content,
    image: identityImgUrl,
    imageMobile: identityImgMobileUrl,
    crop: identityImgMeta.crop,
    hotspot: identityImgMeta.hotspot,
    origWidth: identityImgMeta.origWidth,
    origHeight: identityImgMeta.origHeight,
    cropMobile: identityImgMobMeta.crop,
    hotspotMobile: identityImgMobMeta.hotspot,
    origWidthMobile: identityImgMobMeta.origWidth,
    origHeightMobile: identityImgMobMeta.origHeight,
    media: content?.identitySection?.media,
  }

  const qualitySection = {
    title: content?.qualitySection?.title,
    content: content?.qualitySection?.content,
    image: qualityImgUrl,
    imageMobile: qualityImgMobileUrl,
    crop: qualityImgMeta.crop,
    hotspot: qualityImgMeta.hotspot,
    origWidth: qualityImgMeta.origWidth,
    origHeight: qualityImgMeta.origHeight,
    cropMobile: qualityImgMobMeta.crop,
    hotspotMobile: qualityImgMobMeta.hotspot,
    origWidthMobile: qualityImgMobMeta.origWidth,
    origHeightMobile: qualityImgMobMeta.origHeight,
    media: content?.qualitySection?.media,
  }

  const designersWithImage = designers.filter(d => {
    if (!d.image) return false
    const imgUrl = typeof d.image === 'string' ? d.image : d.image.url
    return !!imgUrl && typeof imgUrl === 'string' && imgUrl.trim() !== ''
  })

  useSEO({
    title: `BIRIM - ${t('about') || 'Hakkımızda'}`,
    description:
      (content && (t(content.heroSubtitle) || t(content.storyTitle))) ||
      t('about_meta_description_default'),
    image: heroImageUrl,
    type: 'article',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'About',
  })

  if (loading) {
    return (
      <div className="pt-24 min-h-screen bg-[var(--bg-primary)]">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  const renderContentText = (val: unknown) => {
    if (!val) return null
    const translated = t(val as string)
    if (!translated) return null

    const isPortable =
      Array.isArray(translated) ||
      (typeof translated === 'object' &&
        translated !== null &&
        (translated as Record<string, unknown>)['_type'] === 'block')

    if (isPortable) {
      const blocks = Array.isArray(translated) ? translated : [translated]
      return <PortableTextLite value={blocks as Record<string, unknown>[]} />
    }
    return <p className="leading-relaxed font-light text-base md:text-lg">{translated as string}</p>
  }

  const heroBadgeText = getPlainText(t(content?.heroBadge))
  const heroTitleText = getPlainText(t(content?.heroTitle))
  const heroSubtitleText = getPlainText(t(content?.heroSubtitle || content?.storyTitle))

  const manifestoLabel = getPlainText(t(content?.manifestoLabel))
  const manifestoQuote = getPlainText(t(content?.manifestoQuote))

  const timelineTitle = getPlainText(t(content?.timelineTitle))
  const timelineSubtitle = getPlainText(t(content?.timelineSubtitle))

  interface FormattedEra {
    year: string
    title: string
    description: string
    image: string
    imageMobile: string
    crop?: R2ImageMetadata['crop']
    hotspot?: R2ImageMetadata['hotspot']
    origWidth?: number
    origHeight?: number
    cropMobile?: R2ImageMetadata['crop']
    hotspotMobile?: R2ImageMetadata['hotspot']
    origWidthMobile?: number
    origHeightMobile?: number
  }

  const eras: FormattedEra[] =
    content?.eras && content.eras.length > 0
      ? content.eras.map((era, idx) => {
          const imgMeta =
            typeof era.image === 'object' && era.image !== null
              ? (era.image as Record<string, unknown>)
              : {}
          const imgMobMeta =
            typeof era.imageMobile === 'object' && era.imageMobile !== null
              ? (era.imageMobile as Record<string, unknown>)
              : {}

          return {
            year: era.year || `${1970 + idx * 15}`,
            title: getPlainText(t(era.title)),
            description: getPlainText(t(era.description)),
            image: getSanitizedImage(era.image, DEFAULT_IMAGES.history),
            imageMobile: getSanitizedImage(era.imageMobile, ''),
            crop: imgMeta['crop'] as R2ImageMetadata['crop'],
            hotspot: imgMeta['hotspot'] as R2ImageMetadata['hotspot'],
            origWidth: imgMeta['origWidth'] as number | undefined,
            origHeight: imgMeta['origHeight'] as number | undefined,
            cropMobile: imgMobMeta['crop'] as R2ImageMetadata['crop'],
            hotspotMobile: imgMobMeta['hotspot'] as R2ImageMetadata['hotspot'],
            origWidthMobile: imgMobMeta['origWidth'] as number | undefined,
            origHeightMobile: imgMobMeta['origHeight'] as number | undefined,
          }
        })
      : [
          {
            year: '1970',
            title: 'Temeller ve Kuruluş',
            description:
              'İstanbul’da geleneksel mobilya zanaatını mimari hassasiyetle birleştiren ilk atölyenin kuruluşu.',
            image: DEFAULT_IMAGES.history,
            imageMobile: '',
          },
          {
            year: '1992',
            title: 'Endüstriyel Ölçek ve Fabrika',
            description:
              'Teknolojik altyapının güçlendirilmesi ve modern mobilya üretimine yönelik entegre tesis hamlesi.',
            image: DEFAULT_IMAGES.quality,
            imageMobile: '',
          },
          {
            year: '2008',
            title: 'Global Tasarımcı Koleksiyonları',
            description:
              'Uluslararası saygınlığa sahip endüstriyel tasarımcılarla özgün ve ikonik seri tasarımların başlanması.',
            image: DEFAULT_IMAGES.identity,
            imageMobile: '',
          },
          {
            year: 'Günümüz',
            title: 'Sürdürülebilir Mimari Lüks',
            description:
              'Dünyanın dört bir yanındaki prestijli konut ve ticari projelere zamansız mobilya çözümleri sunumu.',
            image: DEFAULT_IMAGES.hero,
            imageMobile: '',
          },
        ]

  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] animate-fade-in-up-subtle font-light selection:bg-[var(--text-primary)] selection:text-[var(--bg-primary)]">
      {/* Hero Header Section */}
      <div className="relative h-[60vh] sm:h-[75vh] min-h-[420px] sm:min-h-[550px] bg-gray-900 text-white flex items-center justify-center overflow-hidden hero-section">
        <div className="absolute inset-0 w-full h-full scale-105 animate-slow-zoom">
          <OptimizedImage
            src={heroImageUrl}
            srcMobile={heroImageMobileUrl || undefined}
            fallbackSrc={DEFAULT_IMAGES.hero}
            alt={getPlainText(t(content?.heroTitle)) || 'Hakkımızda'}
            className="w-full h-full opacity-85 object-cover"
            width={1920}
            height={1080}
            loading="eager"
            sizes="100vw"
            quality={90}
            crop={heroImgMeta.crop}
            hotspot={heroImgMeta.hotspot}
            origWidth={heroImgMeta.origWidth}
            origHeight={heroImgMeta.origHeight}
            cropMobile={heroImgMobMeta.crop}
            hotspotMobile={heroImgMobMeta.hotspot}
            origWidthMobile={heroImgMobMeta.origWidth}
            origHeightMobile={heroImgMobMeta.origHeight}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/50" />
        </div>
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto">
          <motion.div
            initial={{opacity: 0, y: 30}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 1}}
          >
            {heroBadgeText ? (
              <span className="font-outfit text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.25em] sm:tracking-[0.35em] text-gray-300 mb-3 sm:mb-6 inline-block font-light">
                {heroBadgeText}
              </span>
            ) : null}
            {heroTitleText ? (
              <h1 className="font-outfit text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extralight tracking-tight uppercase leading-tight sm:leading-none text-white break-words">
                {heroTitleText}
              </h1>
            ) : null}
          </motion.div>
          {heroSubtitleText ? (
            <motion.p
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 1, delay: 0.3}}
              className="font-outfit mt-4 sm:mt-8 text-sm sm:text-base md:text-xl text-gray-200 max-w-2xl mx-auto font-light leading-relaxed tracking-wide px-2 sm:px-0"
            >
              {heroSubtitleText}
            </motion.p>
          ) : null}
        </div>
      </div>

      {/* Main Page Layout */}
      <div className="bg-[var(--bg-primary)] pb-16 sm:pb-32">
        <div className={containerClass + ' py-3 sm:py-4 text-[11px] sm:text-[12px]'}>
          <Breadcrumbs items={[{label: t('homepage'), to: '/'}, {label: t('about')}]} />
        </div>

        {/* SECTION 1: ARCHITECTURAL MANIFESTO QUOTE */}
        {manifestoQuote ? (
          <section className="py-12 sm:py-20 border-b border-[var(--border-primary,#e5e7eb)]/30">
            <div className={containerClass}>
              <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 px-2 sm:px-0">
                {manifestoLabel ? (
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[var(--text-secondary)] font-light">
                    {manifestoLabel}
                  </span>
                ) : null}
                <blockquote className="font-outfit text-xl sm:text-3xl md:text-5xl lg:text-6xl font-extralight text-[var(--text-primary)] leading-snug sm:leading-tight tracking-tight uppercase">
                  {manifestoQuote}
                </blockquote>
              </div>
            </div>
          </section>
        ) : null}

        {/* SECTION 2: INTERACTIVE HISTORICAL ERA TIMELINE */}
        <section className="py-12 sm:py-24 border-b border-[var(--border-primary,#e5e7eb)]/30">
          <div className={containerClass}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-16 gap-3 sm:gap-4">
              <div>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[var(--text-secondary)] font-light">
                  TARİHÇE
                </span>
                {timelineTitle ? (
                  <h2 className="font-outfit text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extralight text-[var(--text-primary)] uppercase tracking-tight mt-1 sm:mt-2">
                    {timelineTitle}
                  </h2>
                ) : null}
              </div>
              {timelineSubtitle ? (
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light max-w-sm">
                  {timelineSubtitle}
                </p>
              ) : null}
            </div>

            {/* MOBILE ONLY: Inline Accordion Expansion Flow (lg:hidden) */}
            <div className="space-y-3 lg:hidden">
              {eras.map((era, idx) => {
                const isActive = activeEraIndex === idx
                return (
                  <div
                    key={idx}
                    className={`border transition-all duration-300 rounded-none overflow-hidden ${
                      isActive
                        ? 'border-[var(--text-primary)]/12 bg-[var(--bg-secondary)]'
                        : 'border-neutral-500/20 hover:border-[var(--text-primary)]/10'
                    }`}
                  >
                    <button
                      onClick={() => setActiveEraIndex(isActive ? -1 : idx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-outfit text-2xl font-light tracking-tight text-[var(--text-primary)] min-w-[65px]">
                          {era.year}
                        </span>
                        {era.title ? (
                          <span className="font-outfit text-xs font-light uppercase tracking-wider text-[var(--text-primary)]">
                            {era.title}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-center w-7 h-7 text-[var(--text-primary)] flex-shrink-0">
                        <motion.div
                          animate={{rotate: isActive ? 45 : 0}}
                          transition={{duration: 0.3, ease: 'easeInOut'}}
                          className="relative w-4 h-4 flex items-center justify-center"
                        >
                          <span className="absolute w-3.5 h-[1.5px] bg-current" />
                          <span className="absolute h-3.5 w-[1.5px] bg-current" />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div
                          initial={{height: 0, opacity: 0}}
                          animate={{height: 'auto', opacity: 1}}
                          exit={{height: 0, opacity: 0}}
                          transition={{duration: 0.35, ease: 'easeInOut'}}
                        >
                          <div className="p-4 pt-0 border-t border-neutral-500/20 space-y-4">
                            <div className="space-y-2 pt-3">
                              <span className="font-outfit text-3xl font-extralight text-[var(--text-secondary)]/40 block">
                                {era.year}
                              </span>
                              {era.title ? (
                                <h3 className="font-outfit text-lg font-light text-[var(--text-primary)] uppercase">
                                  {era.title}
                                </h3>
                              ) : null}
                              {era.description ? (
                                <p className="text-[var(--text-secondary)] font-light text-xs leading-relaxed">
                                  {era.description}
                                </p>
                              ) : null}
                            </div>
                            <div className="relative aspect-[16/10] overflow-hidden rounded-none">
                              <OptimizedImage
                                key={`${era.year}-${era.image}`}
                                src={era.image}
                                srcMobile={era.imageMobile || undefined}
                                fallbackSrc={DEFAULT_IMAGES.history}
                                alt="Era History"
                                className="w-full h-full object-cover"
                                crop={era.crop}
                                hotspot={era.hotspot}
                                origWidth={era.origWidth}
                                origHeight={era.origHeight}
                                cropMobile={era.cropMobile}
                                hotspotMobile={era.hotspotMobile}
                                origWidthMobile={era.origWidthMobile}
                                origHeightMobile={era.origHeightMobile}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>

            {/* DESKTOP ONLY: Classic Grid & Showcase Box (hidden lg:block) */}
            <div className="hidden lg:block">
              {/* Timeline Era Selector Grid */}
              <div
                className="grid gap-3 lg:gap-4 mb-12"
                style={{gridTemplateColumns: `repeat(${eras.length}, minmax(0, 1fr))`}}
              >
                {eras.map((era, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveEraIndex(idx)}
                    className={`p-4 lg:p-5 text-left border rounded-none transition-all duration-300 ${
                      activeEraIndex === idx || (activeEraIndex === -1 && idx === 0)
                        ? 'border-[var(--text-primary)]/12 bg-[var(--bg-secondary)]'
                        : 'border-neutral-500/20 hover:border-[var(--text-primary)]/10'
                    }`}
                  >
                    <span className="font-outfit text-2xl lg:text-3xl xl:text-4xl font-light tracking-tight block text-[var(--text-primary)]">
                      {era.year}
                    </span>
                    {era.title ? (
                      <span className="text-[11px] lg:text-xs uppercase tracking-wider text-[var(--text-secondary)] mt-1.5 block font-normal truncate">
                        {era.title}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>

              {/* Selected Era Content Box */}
              {(() => {
                const currentIdx = activeEraIndex === -1 ? 0 : activeEraIndex
                const currentEra = eras[currentIdx] ?? eras[0]!
                return (
                  <div className="p-12 bg-[var(--bg-secondary)] border border-neutral-500/20 rounded-none">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentIdx}
                        initial={{opacity: 0, x: 20}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: -20}}
                        transition={{duration: 0.4}}
                        className="grid grid-cols-12 gap-8 items-center"
                      >
                        <div className="col-span-5 space-y-4">
                          <span className="font-outfit text-7xl font-extralight text-[var(--text-secondary)]/50 block">
                            {currentEra.year}
                          </span>
                          {currentEra.title ? (
                            <h3 className="font-outfit text-3xl font-light text-[var(--text-primary)] uppercase">
                              {currentEra.title}
                            </h3>
                          ) : null}
                          {currentEra.description ? (
                            <p className="text-[var(--text-secondary)] font-light text-base lg:text-lg leading-relaxed">
                              {currentEra.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="col-span-7">
                          <div className="relative aspect-[16/10] overflow-hidden rounded-none">
                            <OptimizedImage
                              key={`${currentEra.year}-${currentEra.image}`}
                              src={currentEra.image}
                              srcMobile={currentEra.imageMobile || undefined}
                              fallbackSrc={DEFAULT_IMAGES.history}
                              alt="Era History"
                              className="w-full h-full object-cover"
                              crop={currentEra.crop}
                              hotspot={currentEra.hotspot}
                              origWidth={currentEra.origWidth}
                              origHeight={currentEra.origHeight}
                              cropMobile={currentEra.cropMobile}
                              hotspotMobile={currentEra.hotspotMobile}
                              origWidthMobile={currentEra.origWidthMobile}
                              origHeightMobile={currentEra.origHeightMobile}
                            />
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )
              })()}
            </div>
          </div>
        </section>

        {/* SECTION 3: IDENTITY & QUALITY ASYMMETRIC GRID */}
        <section className="py-12 sm:py-24 border-b border-[var(--border-primary,#e5e7eb)]/30">
          <div className={containerClass}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16 items-start">
              <div className="lg:col-span-5 space-y-4 sm:space-y-8">
                <div>
                  <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                    KİMLİK & MİMARİ
                  </span>
                  {getPlainText(t(identitySection.title)) ? (
                    <h2 className="font-outfit text-2xl sm:text-4xl md:text-5xl font-extralight text-[var(--text-primary)] uppercase tracking-tight mt-1 sm:mt-2 leading-tight">
                      {getPlainText(t(identitySection.title))}
                    </h2>
                  ) : null}
                </div>
                <div className="text-[var(--text-primary)] leading-relaxed font-roboto-thin text-base sm:text-lg md:text-xl">
                  {renderContentText(identitySection.content)}
                </div>
              </div>
              <div className="lg:col-span-7">
                <div className="relative aspect-[4/3] overflow-hidden rounded-none">
                  <OptimizedImage
                    src={identitySection.image}
                    srcMobile={identitySection.imageMobile || undefined}
                    fallbackSrc={DEFAULT_IMAGES.identity}
                    alt="Identity"
                    className="w-full h-full object-cover"
                    crop={identitySection.crop}
                    hotspot={identitySection.hotspot}
                    origWidth={identitySection.origWidth}
                    origHeight={identitySection.origHeight}
                    cropMobile={identitySection.cropMobile}
                    hotspotMobile={identitySection.hotspotMobile}
                    origWidthMobile={identitySection.origWidthMobile}
                    origHeightMobile={identitySection.origHeightMobile}
                  />
                </div>
              </div>
              <div className="lg:col-span-12">
                <MediaGallery media={identitySection.media} alt="Identity" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: CRAFTSMANSHIP & QUALITY */}
        <section className="py-12 sm:py-24 border-b border-[var(--border-primary,#e5e7eb)]/30">
          <div className={containerClass}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16 items-start">
              <div className="lg:col-span-7 order-2 lg:order-1">
                <div className="relative aspect-[4/3] overflow-hidden rounded-none">
                  <OptimizedImage
                    key={qualitySection.image}
                    src={qualitySection.image}
                    srcMobile={qualitySection.imageMobile || undefined}
                    fallbackSrc={DEFAULT_IMAGES.quality}
                    alt="Quality"
                    className="w-full h-full object-cover"
                    crop={qualitySection.crop}
                    hotspot={qualitySection.hotspot}
                    origWidth={qualitySection.origWidth}
                    origHeight={qualitySection.origHeight}
                    cropMobile={qualitySection.cropMobile}
                    hotspotMobile={qualitySection.hotspotMobile}
                    origWidthMobile={qualitySection.origWidthMobile}
                    origHeightMobile={qualitySection.origHeightMobile}
                  />
                </div>
              </div>
              <div className="lg:col-span-5 order-1 lg:order-2 space-y-4 sm:space-y-8">
                <div>
                  <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                    ZANAAT & KALİTE
                  </span>
                  {getPlainText(t(qualitySection.title)) ? (
                    <h2 className="font-outfit text-2xl sm:text-4xl md:text-5xl font-extralight text-[var(--text-primary)] uppercase tracking-tight mt-1 sm:mt-2 leading-tight">
                      {getPlainText(t(qualitySection.title))}
                    </h2>
                  ) : null}
                </div>
                <div className="text-[var(--text-primary)] leading-relaxed font-roboto-thin text-base sm:text-lg md:text-xl">
                  {renderContentText(qualitySection.content)}
                </div>
              </div>
              <div className="lg:col-span-12 order-3">
                <MediaGallery media={qualitySection.media} alt="Quality" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: INTERACTIVE DESIGNER EXHIBITION */}
        {designersWithImage.length > 0 && (
          <section className="py-12 sm:py-24 border-t border-[var(--border-primary,#e5e7eb)]/30">
            <div className={containerClass}>
              <div className="mb-8 sm:mb-16">
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                  İŞBİRLİKLERİ
                </span>
                <h2 className="font-outfit text-2xl sm:text-4xl md:text-5xl font-extralight text-[var(--text-primary)] uppercase tracking-tight mt-1 sm:mt-2">
                  Tasarımcı Ortaklarımız
                </h2>
              </div>

              {/* MOBILE ONLY: Horizontal Swipeable Designer Cards Carousel (lg:hidden) */}
              <div className="lg:hidden">
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6">
                  {designersWithImage.slice(0, 5).map((designer, idx) => {
                    const dName = getPlainText(t(designer.name))
                    const dRoleText = getPlainText(t(designer.role))
                    const dBioText = getPlainText(t(designer.bio))
                    const dImgUrl =
                      typeof designer.image === 'string'
                        ? designer.image
                        : (designer.image as {url: string}).url

                    return (
                      <div
                        key={designer.id || idx}
                        className="w-[82vw] max-w-[310px] flex-shrink-0 snap-center border border-neutral-500/40 bg-[var(--bg-secondary)] p-5 rounded-none flex flex-col justify-between shadow-sm"
                      >
                        <div className="space-y-4">
                          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-none grayscale">
                            <OptimizedImage
                              src={dImgUrl}
                              srcMobile={
                                typeof designer.image === 'object'
                                  ? designer.image.urlMobile
                                  : undefined
                              }
                              srcDesktop={
                                typeof designer.image === 'object'
                                  ? designer.image.urlDesktop
                                  : undefined
                              }
                              fallbackSrc={DEFAULT_IMAGES.identity}
                              alt={dName}
                              className="w-full h-full object-cover grayscale"
                              crop={
                                typeof designer.image === 'object' ? designer.image.crop : undefined
                              }
                              hotspot={
                                typeof designer.image === 'object'
                                  ? designer.image.hotspot
                                  : undefined
                              }
                              origWidth={
                                typeof designer.image === 'object'
                                  ? designer.image.origWidth
                                  : undefined
                              }
                              origHeight={
                                typeof designer.image === 'object'
                                  ? designer.image.origHeight
                                  : undefined
                              }
                              cropMobile={
                                typeof designer.image === 'object'
                                  ? designer.image.cropMobile
                                  : undefined
                              }
                              hotspotMobile={
                                typeof designer.image === 'object'
                                  ? designer.image.hotspotMobile
                                  : undefined
                              }
                              origWidthMobile={
                                typeof designer.image === 'object'
                                  ? designer.image.origWidthMobile
                                  : undefined
                              }
                              origHeightMobile={
                                typeof designer.image === 'object'
                                  ? designer.image.origHeightMobile
                                  : undefined
                              }
                              cropDesktop={
                                typeof designer.image === 'object'
                                  ? designer.image.cropDesktop
                                  : undefined
                              }
                              hotspotDesktop={
                                typeof designer.image === 'object'
                                  ? designer.image.hotspotDesktop
                                  : undefined
                              }
                              origWidthDesktop={
                                typeof designer.image === 'object'
                                  ? designer.image.origWidthDesktop
                                  : undefined
                              }
                              origHeightDesktop={
                                typeof designer.image === 'object'
                                  ? designer.image.origHeightDesktop
                                  : undefined
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            {dRoleText && (
                              <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] block font-light">
                                {dRoleText}
                              </span>
                            )}
                            <h3 className="font-outfit text-xl font-light uppercase tracking-tight text-[var(--text-primary)]">
                              {dName}
                            </h3>
                            {dBioText && (
                              <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed line-clamp-3">
                                {dBioText}
                              </p>
                            )}
                          </div>
                        </div>

                        <Link
                          to={`/designer/${designer.id}`}
                          className="group inline-flex items-center justify-between text-[11px] uppercase tracking-widest text-[var(--text-primary)] bg-[var(--bg-primary)] border border-neutral-500/40 hover:border-[var(--text-primary)] px-4 py-3 transition-all font-light w-full shadow-sm mt-5"
                        >
                          <span>Tasarımcı Koleksiyonu</span>
                          <svg
                            className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                            />
                          </svg>
                        </Link>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between mt-4 px-1">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-light opacity-60">
                    Kaydırın &rarr;
                  </span>
                  <Link
                    to="/designers"
                    className="text-xs uppercase tracking-widest text-[var(--text-primary)] hover:opacity-75 transition-opacity underline underline-offset-4"
                  >
                    Tüm Tasarımcılar
                  </Link>
                </div>
              </div>

              {/* DESKTOP ONLY: Classic Split Exhibition Showcase (hidden lg:block) */}
              <div className="hidden lg:block">
                {(() => {
                  const currentDesigner =
                    designersWithImage[activeDesignerIndex === -1 ? 0 : activeDesignerIndex] ??
                    designersWithImage[0]!
                  const currentImgUrl =
                    typeof currentDesigner.image === 'string'
                      ? currentDesigner.image
                      : (currentDesigner.image as {url: string}).url
                  const currentBioText = getPlainText(t(currentDesigner.bio))

                  return (
                    <div className="grid grid-cols-12 gap-8 items-stretch">
                      {/* Left Column: Interactive Designer List */}
                      <div className="col-span-5 flex flex-col justify-between">
                        <div className="space-y-3">
                          {designersWithImage.slice(0, 5).map((designer, idx) => {
                            const isActive =
                              (activeDesignerIndex === -1 ? 0 : activeDesignerIndex) === idx
                            const dName = getPlainText(t(designer.name))
                            const dRoleText = getPlainText(t(designer.role))
                            const dBioText = getPlainText(t(designer.bio))
                            const dSubtext =
                              dRoleText || (dBioText ? dBioText.slice(0, 45) + '...' : '')

                            return (
                              <div
                                key={designer.id || idx}
                                onMouseEnter={() => setActiveDesignerIndex(idx)}
                                onClick={() => setActiveDesignerIndex(idx)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    setActiveDesignerIndex(idx)
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                className={`p-6 border rounded-none transition-all duration-300 cursor-pointer group ${
                                  isActive
                                    ? 'bg-[var(--bg-secondary)] border-[var(--text-primary)] translate-x-2 shadow-sm'
                                    : 'border-neutral-500/40 hover:border-[var(--text-primary)]/40'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div>
                                    <h3 className="text-xl md:text-2xl font-light uppercase tracking-tight text-[var(--text-primary)] mt-1">
                                      {dName}
                                    </h3>
                                    {dSubtext && (
                                      <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mt-0.5 block font-light truncate max-w-xs">
                                        {dSubtext}
                                      </span>
                                    )}
                                  </div>
                                  <svg
                                    className={`w-5 h-5 ml-auto flex-shrink-0 transition-all duration-300 ${
                                      isActive
                                        ? 'text-[var(--text-primary)] translate-x-1 opacity-100'
                                        : 'text-[var(--text-secondary)] opacity-30 group-hover:opacity-70 group-hover:translate-x-0.5'
                                    }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="1.2"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M3 12h18L13.5 4.5"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        <Link
                          to="/designers"
                          className="group inline-flex items-center justify-between text-xs uppercase tracking-widest text-[var(--text-primary)] border border-neutral-500/40 hover:border-[var(--text-primary)] bg-[var(--bg-secondary)] px-6 py-4 transition-all font-light w-full shadow-sm"
                        >
                          <span>Tüm Tasarımcılar</span>
                          <svg
                            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 12h18L13.5 4.5"
                            />
                          </svg>
                        </Link>
                      </div>

                      {/* Right Column: Featured Active Designer Exhibition Card */}
                      <div className="col-span-7 bg-[var(--bg-secondary)] border border-neutral-500/40 rounded-none p-8 md:p-12 flex flex-col justify-between">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeDesignerIndex === -1 ? 0 : activeDesignerIndex}
                            initial={{opacity: 0, y: 15}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -15}}
                            transition={{duration: 0.3}}
                            className="grid grid-cols-12 gap-8 items-center h-full"
                          >
                            <div className="col-span-6 relative aspect-[3/4] overflow-hidden rounded-none grayscale">
                              <OptimizedImage
                                src={currentImgUrl}
                                srcMobile={
                                  typeof currentDesigner.image === 'object'
                                    ? currentDesigner.image.urlMobile
                                    : undefined
                                }
                                srcDesktop={
                                  typeof currentDesigner.image === 'object'
                                    ? currentDesigner.image.urlDesktop
                                    : undefined
                                }
                                fallbackSrc={DEFAULT_IMAGES.identity}
                                alt={getPlainText(t(currentDesigner.name))}
                                className="w-full h-full object-cover grayscale"
                                crop={
                                  typeof currentDesigner.image === 'object'
                                    ? currentDesigner.image.crop
                                    : undefined
                                }
                                hotspot={
                                  typeof currentDesigner.image === 'object'
                                    ? currentDesigner.image.hotspot
                                    : undefined
                                }
                                origWidth={
                                  typeof currentDesigner.image === 'object'
                                    ? currentDesigner.image.origWidth
                                    : undefined
                                }
                                origHeight={
                                  typeof currentDesigner.image === 'object'
                                    ? currentDesigner.image.origHeight
                                    : undefined
                                }
                                cropMobile={
                                  typeof currentDesigner.image === 'object'
                                    ? currentDesigner.image.cropMobile
                                    : undefined
                                }
                                hotspotMobile={
                                  typeof currentDesigner.image === 'object'
                                    ? currentDesigner.image.hotspotMobile
                                    : undefined
                                }
                                origWidthMobile={
                                  typeof currentDesigner.image === 'object'
                                    ? currentDesigner.image.origWidthMobile
                                    : undefined
                                }
                                origHeightMobile={
                                  typeof currentDesigner.image === 'object'
                                    ? currentDesigner.image.origHeightMobile
                                    : undefined
                                }
                                cropDesktop={
                                  typeof currentDesigner.image === 'object'
                                    ? currentDesigner.image.cropDesktop
                                    : undefined
                                }
                                hotspotDesktop={
                                  typeof currentDesigner.image === 'object'
                                    ? currentDesigner.image.hotspotDesktop
                                    : undefined
                                }
                                origWidthDesktop={
                                  typeof currentDesigner.image === 'object'
                                    ? currentDesigner.image.origWidthDesktop
                                    : undefined
                                }
                                origHeightDesktop={
                                  typeof currentDesigner.image === 'object'
                                    ? currentDesigner.image.origHeightDesktop
                                    : undefined
                                }
                              />
                            </div>

                            <div className="col-span-6 flex flex-col justify-between h-full space-y-6">
                              <div className="space-y-4">
                                {currentDesigner.role && (
                                  <span className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                                    {getPlainText(t(currentDesigner.role))}
                                  </span>
                                )}
                                <h3 className="text-3xl font-light uppercase tracking-tight text-[var(--text-primary)]">
                                  {getPlainText(t(currentDesigner.name))}
                                </h3>
                                {currentBioText && (
                                  <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed line-clamp-6">
                                    {currentBioText}
                                  </p>
                                )}
                              </div>

                              <Link
                                to={`/designer/${currentDesigner.id}`}
                                className="group inline-flex items-center gap-3 text-xs uppercase tracking-widest text-[var(--text-primary)] bg-[var(--bg-primary)] border border-neutral-500/40 hover:border-[var(--text-primary)] px-6 py-3.5 transition-all font-light w-fit shadow-sm"
                              >
                                <span>Tasarımcı Koleksiyonu</span>
                                <svg
                                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                  />
                                </svg>
                              </Link>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
