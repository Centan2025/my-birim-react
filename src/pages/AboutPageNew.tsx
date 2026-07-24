import {useState, useEffect} from 'react'
import {Link} from 'react-router-dom'
import {motion, AnimatePresence} from 'framer-motion'
import {getAboutPageContent, getDesigners} from '../services/cms'
import type {AboutPageContent, NewsMedia, Designer} from '../types'
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
  hero: '/img/about/hero.jpg',
  history: '/img/about/history.jpg',
  identity: '/img/about/identity.jpg',
  quality: '/img/about/quality.jpg',
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
                      origWidth={m.origWidth}
                      origHeight={m.origHeight}
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

  const heroImageUrl = getSanitizedImage(content?.heroImage, DEFAULT_IMAGES.hero)
  const heroImageMobileUrl = getSanitizedImage(content?.heroImageMobile, '')
  const identityImgUrl = getSanitizedImage(content?.identitySection?.image, DEFAULT_IMAGES.identity)
  const identityImgMobileUrl = getSanitizedImage(content?.identitySection?.imageMobile, '')
  const qualityImgUrl = getSanitizedImage(content?.qualitySection?.image, DEFAULT_IMAGES.quality)
  const qualityImgMobileUrl = getSanitizedImage(content?.qualitySection?.imageMobile, '')

  const identitySection = {
    title: content?.identitySection?.title,
    content: content?.identitySection?.content,
    image: identityImgUrl,
    imageMobile: identityImgMobileUrl,
    media: content?.identitySection?.media,
  }

  const qualitySection = {
    title: content?.qualitySection?.title,
    content: content?.qualitySection?.content,
    image: qualityImgUrl,
    imageMobile: qualityImgMobileUrl,
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

  const eras =
    content?.eras && content.eras.length > 0
      ? content.eras.map((era, idx) => ({
          year: era.year || `${1970 + idx * 15}`,
          title: getPlainText(t(era.title)),
          description: getPlainText(t(era.description)),
          image: getSanitizedImage(era.image, DEFAULT_IMAGES.history),
          imageMobile: getSanitizedImage(era.imageMobile, ''),
        }))
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
      {/* Floating Design Switcher Banner */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary,#e5e7eb)]/40 text-[var(--text-primary)] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-xl flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-light backdrop-blur-md">
          <span className="px-2 py-0.5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full font-normal uppercase text-[9px] sm:text-[10px] tracking-wider whitespace-nowrap">
            Tasarım V2 (Varsayılan)
          </span>
          <Link
            to="/about-v1"
            className="hover:opacity-75 transition-opacity underline underline-offset-4 whitespace-nowrap"
          >
            V1 Klasik Tasarıma Geç
          </Link>
        </div>
      </div>

      {/* Hero Header Section */}
      <div className="relative h-[60vh] sm:h-[75vh] min-h-[420px] sm:min-h-[550px] bg-gray-900 text-white flex items-center justify-center overflow-hidden hero-section">
        <div className="absolute inset-0 w-full h-full scale-105 animate-slow-zoom">
          <OptimizedImage
            src={heroImageUrl}
            srcMobile={heroImageMobileUrl || undefined}
            fallbackSrc={DEFAULT_IMAGES.hero}
            alt={getPlainText(t(content?.heroTitle)) || 'Hakkımızda'}
            className="w-full h-full opacity-60 object-cover"
            width={1920}
            height={1080}
            loading="eager"
            sizes="100vw"
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/40" />
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
            <h1 className="font-outfit text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extralight tracking-tight uppercase leading-tight sm:leading-none text-white break-words">
              {heroTitleText || 'HAKKIMIZDA'}
            </h1>
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
          <Breadcrumbs
            items={[
              {label: t('homepage'), to: '/'},
              {label: t('about')},
            ]}
          />
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
                        ? 'border-[var(--text-primary)] bg-[var(--bg-secondary)] shadow-sm'
                        : 'border-neutral-500/40 hover:border-[var(--text-primary)]/50'
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
                      <div className="flex items-center justify-center w-7 h-7 rounded-none border border-neutral-500/40 text-[var(--text-primary)] font-light text-base flex-shrink-0">
                        {isActive ? '−' : '+'}
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: 'easeInOut' }}
                        >
                          <div className="p-4 pt-0 border-t border-neutral-500/30 space-y-4">
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
                                src={era.image}
                                srcMobile={era.imageMobile || undefined}
                                fallbackSrc={DEFAULT_IMAGES.history}
                                alt="Era History"
                                className="w-full h-full object-cover"
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
              <div className="grid grid-cols-4 gap-4 mb-12">
                {eras.map((era, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveEraIndex(idx)}
                    className={`p-6 text-left border rounded-none transition-all duration-300 ${
                      activeEraIndex === idx || (activeEraIndex === -1 && idx === 0)
                        ? 'border-[var(--text-primary)] bg-[var(--bg-secondary)] shadow-sm'
                        : 'border-neutral-500/40 hover:border-[var(--text-primary)]/50'
                    }`}
                  >
                    <span className="font-outfit text-3xl md:text-4xl font-light tracking-tight block text-[var(--text-primary)]">
                      {era.year}
                    </span>
                    {era.title ? (
                      <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mt-2 block font-normal truncate">
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
                  <div className="p-12 bg-[var(--bg-secondary)] border border-neutral-500/40 rounded-none">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentIdx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4 }}
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
                              src={currentEra.image}
                              srcMobile={currentEra.imageMobile || undefined}
                              fallbackSrc={DEFAULT_IMAGES.history}
                              alt="Era History"
                              className="w-full h-full object-cover"
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
                    src={qualitySection.image}
                    srcMobile={qualitySection.imageMobile || undefined}
                    fallbackSrc={DEFAULT_IMAGES.quality}
                    alt="Quality"
                    className="w-full h-full object-cover"
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
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-16 gap-3 sm:gap-4">
                <div>
                  <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                    İŞBİRLİKLERİ
                  </span>
                  <h2 className="font-outfit text-2xl sm:text-4xl md:text-5xl font-extralight text-[var(--text-primary)] uppercase tracking-tight mt-1 sm:mt-2">
                    Tasarımcı Ekosistemi
                  </h2>
                </div>
                <Link
                  to="/designers"
                  className="mt-4 md:mt-0 text-xs uppercase tracking-widest text-[var(--text-primary)] hover:opacity-75 transition-opacity underline underline-offset-4"
                >
                  Tüm Tasarımcılar
                </Link>
              </div>

              {/* Interactive Split Exhibition Showcase */}
              {(() => {
                const currentDesigner =
                  designersWithImage[activeDesignerIndex] ?? designersWithImage[0]!
                const currentImgUrl =
                  typeof currentDesigner.image === 'string'
                    ? currentDesigner.image
                    : (currentDesigner.image as {url: string}).url
                const currentBioText = getPlainText(t(currentDesigner.bio))

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    {/* Left Column: Interactive Designer List */}
                    <div className="lg:col-span-5 flex flex-col justify-center space-y-3">
                      {designersWithImage.slice(0, 5).map((designer, idx) => {
                        const isActive = activeDesignerIndex === idx
                        const dName = getPlainText(t(designer.name))
                        const dRoleText = getPlainText(t(designer.role))
                        const dBioText = getPlainText(t(designer.bio))
                        const dSubtext =
                          dRoleText ||
                          (dBioText
                            ? dBIOTextSubstr(dBioText, 45)
                            : '')

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
                            className={`p-6 border transition-all duration-300 cursor-pointer group ${
                              isActive
                                ? 'bg-[var(--bg-secondary)] border-[var(--text-primary)] translate-x-2 shadow-sm'
                                : 'border-[var(--border-primary,#e5e7eb)]/20 hover:border-[var(--text-primary)]/40'
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
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                               </svg>
                             </div>
                           </div>
                         )
                       })}
                    </div>

                    {/* Right Column: Featured Active Designer Exhibition Card */}
                    <div className="lg:col-span-7 bg-[var(--bg-secondary)] border border-[var(--border-primary,#e5e7eb)]/30 p-8 md:p-12 flex flex-col justify-between">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeDesignerIndex}
                          initial={{opacity: 0, y: 15}}
                          animate={{opacity: 1, y: 0}}
                          exit={{opacity: 0, y: -15}}
                          transition={{duration: 0.3}}
                          className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center h-full"
                        >
                          <div className="md:col-span-6 relative aspect-[3/4] overflow-hidden grayscale">
                            <OptimizedImage
                              src={currentImgUrl}
                              fallbackSrc={DEFAULT_IMAGES.identity}
                              alt={getPlainText(t(currentDesigner.name))}
                              className="w-full h-full object-cover grayscale"
                            />
                          </div>

                          <div className="md:col-span-6 flex flex-col justify-between h-full space-y-6">
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
                               className="group inline-flex items-center gap-3 text-xs uppercase tracking-widest text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-primary,#e5e7eb)] hover:border-[var(--text-primary)] px-6 py-3.5 transition-all font-light w-fit shadow-sm"
                             >
                               <span>Tasarımcı Koleksiyonu</span>
                               <svg
                                 className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor"
                                 strokeWidth="1.2"
                               >
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
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
          </section>
        )}
      </div>
    </div>
  )
}

function dBIOTextSubstr(str: string, len: number): string {
  return str.length > len ? str.substring(0, len) + '...' : str
}
