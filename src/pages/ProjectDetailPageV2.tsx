import {useMemo, useState, useEffect, useRef, useCallback} from 'react'
import {useQuery} from '@tanstack/react-query'
import {useParams, Link} from 'react-router-dom'
import {motion, AnimatePresence} from 'framer-motion'
import {OptimizedImage} from '../components/OptimizedImage'
import {OptimizedVideo} from '../components/OptimizedVideo'
import {FullscreenMediaViewer} from '../components/FullscreenMediaViewer'
import {PageLoading} from '../components/LoadingSpinner'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useTranslation} from '../i18n'
import {useProjects} from '../hooks/useProjects'
import {getProjectById} from '../services/cms'
import {analytics} from '../lib/analytics'
import ScrollReveal from '../components/ScrollReveal'
import {useSEO} from '../hooks/useSEO'
import {useHeaderTheme} from '../context/HeaderThemeContext'
import PortableTextLite from '../components/PortableTextLite'
import {HomeContentBlocks} from '../components/HomeContentBlocks'
import {InteractiveShowcase} from '../components/InteractiveShowcase'
import type {ContentBlock, R2ImageMetadata} from '../types'

interface MediaItem {
  type: 'image' | 'video' | 'youtube'
  url: string
  urlMobile?: string
  urlDesktop?: string
  palette?: {
    dominant?: {background: string}
  }
  crop?: R2ImageMetadata['crop']
  hotspot?: R2ImageMetadata['hotspot']
  origWidth?: number
  origHeight?: number
}

export function ProjectDetailPageV2() {
  const {projectId} = useParams<{projectId: string}>()

  const {data: project, isLoading: loading} = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => {
      if (!projectId) throw new Error('Project ID is required')
      return getProjectById(projectId)
    },
    enabled: !!projectId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  })

  const {data: allProjects = []} = useProjects()
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'
  const {setFromPalette, reset} = useHeaderTheme()
  const imageBorderClass = 'rounded-none'

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 1024
    return false
  })

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [fullscreenIdx, setFullscreenIdx] = useState(0)
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false)

  // Header theme
  useEffect(() => {
    if (!project) {
      reset()
      return () => reset()
    }
    const palette =
      project.cover &&
      typeof project.cover === 'object' &&
      project.cover !== null &&
      'palette' in project.cover
        ? project.cover.palette
        : undefined
    if (palette) {
      setFromPalette(palette)
    } else {
      reset()
    }
    return () => reset()
  }, [project, reset, setFromPalette])

  // Prev / Next project calculation
  const {prevProject, nextProject} = useMemo(() => {
    if (!project || allProjects.length < 2) return {prevProject: null, nextProject: null}
    const currentIndex = allProjects.findIndex(p => p.id === project.id)
    if (currentIndex === -1) return {prevProject: null, nextProject: null}
    const prev =
      currentIndex > 0 ? allProjects[currentIndex - 1] : allProjects[allProjects.length - 1]
    const next =
      currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : allProjects[0]
    return {prevProject: prev, nextProject: next}
  }, [project, allProjects])

  // Analytics
  useEffect(() => {
    if (!project || typeof window === 'undefined') return
    const pageTitle = `BIRIM - ${t('projects') || 'Projeler'} - ${t(project.title)}`
    analytics.pageview(window.location.pathname, pageTitle)
    analytics.event({
      category: 'project',
      action: 'view_project_v2',
      label: t(project.title),
    })
  }, [project, t])

  const coverUrl = project?.cover
    ? typeof project.cover === 'string'
      ? project.cover
      : project.cover.url
    : ''
  const coverMobile =
    project && project.cover && typeof project.cover === 'object'
      ? project.cover.urlMobile
      : undefined
  const coverDesktop =
    project && project.cover && typeof project.cover === 'object'
      ? project.cover.urlDesktop
      : undefined
  const coverCrop =
    project && project.cover && typeof project.cover === 'object'
      ? (project.cover as {crop?: R2ImageMetadata['crop']}).crop
      : undefined
  const coverHotspot =
    project && project.cover && typeof project.cover === 'object'
      ? (project.cover as {hotspot?: R2ImageMetadata['hotspot']}).hotspot
      : undefined

  // Hero Media List
  const heroMedia = useMemo(() => {
    if (!project) return []
    const list: MediaItem[] = []
    if (coverUrl) {
      list.push({
        type: 'image',
        url: coverUrl,
        urlMobile: coverMobile,
        urlDesktop: coverDesktop,
        crop: coverCrop,
        hotspot: coverHotspot,
      })
    }
    if (project.media && Array.isArray(project.media)) {
      project.media.forEach(m => {
        if (m.url && m.url !== coverUrl) {
          list.push({
            type: m.type || 'image',
            url: m.url,
            urlMobile: m.urlMobile,
            urlDesktop: m.urlDesktop,
            crop: m.crop,
            hotspot: m.hotspot,
          })
        }
      })
    }
    return list
  }, [project, coverUrl, coverMobile, coverDesktop, coverCrop, coverHotspot])

  const heroCount = heroMedia.length

  const nextHeroSlide = useCallback(() => {
    if (heroCount <= 1) return
    setCurrentSlide(prev => (prev + 1) % heroCount)
  }, [heroCount])

  const prevHeroSlide = useCallback(() => {
    if (heroCount <= 1) return
    setCurrentSlide(prev => (prev - 1 + heroCount) % heroCount)
  }, [heroCount])

  // Autoplay for Hero Slider
  useEffect(() => {
    if (heroCount <= 1 || isAutoplayPaused) return
    const timer = setInterval(() => {
      nextHeroSlide()
    }, 6000)
    return () => clearInterval(timer)
  }, [heroCount, isAutoplayPaused, nextHeroSlide])

  // Gallery & All Media Extract
  const mediaData = useMemo(() => {
    if (!project) return {all: [], gallery: []}
    const media: MediaItem[] = []

    // 1. Hero Medias
    heroMedia.forEach(m => media.push(m))

    // 2. Content blocks
    if (project.contentBlocks && Array.isArray(project.contentBlocks)) {
      project.contentBlocks.forEach((block: ContentBlock) => {
        const mUrl = block.image || block.url
        if (mUrl && block.mediaType !== 'panels') {
          media.push({
            type: (block.mediaType as 'image' | 'video' | 'youtube') || 'image',
            url: mUrl,
            urlMobile: block.imageMobile || block.urlMobile,
            urlDesktop: block.imageDesktop || block.urlDesktop,
            crop: block.crop,
            hotspot: block.hotspot,
          })
        }

        const scanPortableText = (val: unknown) => {
          if (!val) return
          const blks = Array.isArray(val) ? val : [val]
          blks.forEach(b => {
            const item = b as Record<string, unknown>
            if (item?.['_type'] === 'portableTextImage') {
              const r2 = item['imageR2'] as {url?: string} | undefined
              const img = item['image'] as {asset?: {url?: string}} | undefined
              const url = r2?.url || img?.asset?.url
              if (url) {
                media.push({
                  type: 'image',
                  url,
                  urlMobile: (item['imageMobileR2'] as {url?: string})?.url,
                  urlDesktop: (item['imageDesktopR2'] as {url?: string})?.url,
                })
              }
            }
          })
        }
        scanPortableText(t(block.description as never))

        if (block.mediaType === 'panels' && Array.isArray(block.imagePanels)) {
          block.imagePanels.forEach(p => {
            if (p.url) {
              media.push({
                type: p.type || 'image',
                url: p.url,
                crop: p.crop,
                hotspot: p.hotspot,
              })
            }
          })
        }
      })
    }

    // 3. Body deep scan
    const scanDeep = (val: unknown, target: MediaItem[]) => {
      if (!val) return
      if (Array.isArray(val)) {
        val.forEach(v => scanDeep(v, target))
      } else if (typeof val === 'object' && val !== null) {
        const obj = val as Record<string, unknown>
        if (
          obj?.['_type'] === 'portableTextImage' ||
          obj?.['_type'] === 'image' ||
          obj?.['imageR2']
        ) {
          const r2 = obj['imageR2'] as {url?: string} | undefined
          const img = obj['image'] as {asset?: {url?: string}} | undefined
          const url = r2?.url || img?.asset?.url || (obj['url'] as string)

          if (typeof url === 'string' && url) {
            target.push({
              type: 'image',
              url,
              urlMobile:
                (obj['imageMobileR2'] as {url?: string})?.url || (obj['urlMobile'] as string),
              urlDesktop:
                (obj['imageDesktopR2'] as {url?: string})?.url || (obj['urlDesktop'] as string),
            })
          }
        }
        Object.values(obj).forEach(v => scanDeep(v, target))
      }
    }
    if (project.body) {
      scanDeep(t(project.body as never), media)
    }

    const seen = new Set<string>()
    const masterMedia = media.filter(m => {
      const u = String(m.url || '').trim()
      if (!u || seen.has(u)) return false
      seen.add(u)
      return true
    })

    const excludedUrls = new Set<string>()
    heroMedia.forEach(m => excludedUrls.add(m.url))
    if (project.contentBlocks) {
      project.contentBlocks.forEach((block: ContentBlock) => {
        const url = block.image || block.url
        if (url) excludedUrls.add(url)
      })
    }

    const galleryItems = masterMedia.filter(m => !excludedUrls.has(m.url))
    return {all: masterMedia, gallery: galleryItems}
  }, [project, heroMedia, t])

  const allMedia = mediaData.all
  const galleryMedia = mediaData.gallery
  const projectTitle = project ? t(project.title) : ''

  // Open fullscreen at index
  const openFullscreen = (mediaItemUrl: string) => {
    const foundIdx = allMedia.findIndex(m => m.url === mediaItemUrl)
    setFullscreenIdx(foundIdx !== -1 ? foundIdx : 0)
    setIsFullscreenOpen(true)
  }

  // Scroll to gallery
  const galleryRef = useRef<HTMLDivElement>(null)
  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'})
  }

  useSEO({
    title: project ? `BIRIM - ${t(project.title)}` : undefined,
    description: project ? t(project.excerpt || '') : undefined,
    image: coverUrl || undefined,
    type: 'article',
    siteName: 'BIRIM',
    locale: 'tr_TR',
  })

  if (loading) {
    return (
      <div className="pt-20 bg-[var(--bg-primary)] min-h-screen">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="pt-20 bg-[var(--bg-primary)] min-h-screen text-center">
        <p className="text-[var(--text-secondary)]">{t('project_not_found')}</p>
      </div>
    )
  }

  const currentHeroMedia = heroMedia[currentSlide] || heroMedia[0]

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-neutral-100 selection:bg-neutral-100 selection:text-black">
      {/* 1. CINEMATIC FULL-BLEED HERO BANNER */}
      <section
        className="relative w-full h-screen min-h-[640px] flex flex-col justify-end overflow-hidden"
        onMouseEnter={() => setIsAutoplayPaused(true)}
        onMouseLeave={() => setIsAutoplayPaused(false)}
      >
        {/* Hero Background Slider with Soft Transition */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            {currentHeroMedia && (
              <motion.div
                key={currentHeroMedia.url}
                initial={{opacity: 0, scale: 1.05}}
                animate={{opacity: 1, scale: 1}}
                exit={{opacity: 0}}
                transition={{duration: 0.9, ease: [0.16, 1, 0.3, 1]}}
                className="absolute inset-0 w-full h-full"
              >
                {currentHeroMedia.type === 'video' ? (
                  <OptimizedVideo
                    src={currentHeroMedia.url}
                    srcMobile={currentHeroMedia.urlMobile}
                    srcDesktop={currentHeroMedia.urlDesktop}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <OptimizedImage
                    src={currentHeroMedia.url}
                    srcMobile={currentHeroMedia.urlMobile}
                    srcDesktop={currentHeroMedia.urlDesktop}
                    alt={projectTitle}
                    className="w-full h-full object-cover"
                    quality={95}
                    crop={currentHeroMedia.crop}
                    hotspot={currentHeroMedia.hotspot}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Luxury Vignette & Dark Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f]/40 to-black/60 z-10 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/70 z-10 pointer-events-none" />
        </div>

        {/* Top-Left Breadcrumb overlay - White color (Exact V1 Position) */}
        <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none pt-20 lg:pt-20 max-lg:landscape:pt-12">
          <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4 max-lg:landscape:py-0">
            <Breadcrumbs
              items={[
                {label: t('homepage'), to: '/'},
                {label: t('projects') || 'Projeler', to: '/projects'},
                {label: projectTitle},
              ]}
              className="pointer-events-auto text-white/90 drop-shadow-md [&_a]:!text-white/80 [&_a:hover]:!text-white [&_span.font-bold]:!text-white [&_span.text-gray-400]:!text-white/50"
            />
          </div>
        </div>

        {/* Bottom Hero Content */}
        <div className="relative z-20 pb-10 md:pb-14 px-6 md:px-12 lg:px-16 w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            {/* Left: Project Title */}
            <div className="lg:col-span-8 space-y-4">
              <motion.div
                initial={{opacity: 0, y: 30}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.8, delay: 0.2}}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-block h-[1px] w-10 bg-white/60" />
                  <span className="text-xs md:text-sm font-mono tracking-widest uppercase text-neutral-300">
                    {project.date
                      ? t(project.date)
                      : isTr
                        ? 'Birim Mimari Proje'
                        : 'Birim Architectural Project'}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light font-michroma tracking-tight text-white leading-snug drop-shadow-lg">
                  {projectTitle}
                </h1>
              </motion.div>
            </div>

            {/* Right: Slider Controls & Actions (Keskin Köşeli) */}
            <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-end gap-5">
              {/* Slide Counter & Arrows */}
              <div className="flex items-center gap-4 backdrop-blur-md bg-black/35 border border-white/20 px-4 py-2.5 rounded-none shadow-2xl">
                {heroCount > 1 && (
                  <button
                    type="button"
                    onClick={prevHeroSlide}
                    aria-label="Previous Slide"
                    className="p-1 text-neutral-300 hover:text-white transition-colors hover:scale-110 active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                )}

                <div className="font-mono text-xs tracking-widest text-neutral-300">
                  <span className="text-white font-semibold">
                    {String(currentSlide + 1).padStart(2, '0')}
                  </span>
                  <span className="opacity-40 mx-1.5">/</span>
                  <span className="opacity-60">{String(heroCount).padStart(2, '0')}</span>
                </div>

                {heroCount > 1 && (
                  <button
                    type="button"
                    onClick={nextHeroSlide}
                    aria-label="Next Slide"
                    className="p-1 text-neutral-300 hover:text-white transition-colors hover:scale-110 active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                )}

                <div className="w-[1px] h-4 bg-white/20" />

                {/* Fullscreen Trigger */}
                <button
                  type="button"
                  onClick={() => openFullscreen(currentHeroMedia?.url || '')}
                  title={isTr ? 'Tam Ekranda Aç' : 'View Fullscreen'}
                  className="p-1 text-neutral-300 hover:text-white transition-transform hover:scale-110 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                </button>
              </div>

              {/* Quick Scroll Down CTA */}
              <button
                type="button"
                onClick={scrollToGallery}
                className="group inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-neutral-400 hover:text-white transition-colors"
              >
                <span>{isTr ? 'Ayrıntıları İncele' : 'Explore Details'}</span>
                <span className="p-1 rounded-none border border-white/20 group-hover:translate-y-1 transition-transform">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {/* Hero Slider Micro Thumbnails Strip (Keskin Köşeli) */}
          {heroCount > 1 && (
            <div className="mt-8 pt-6 pb-2 px-1 border-t border-white/10 hidden md:flex items-center gap-3 overflow-x-auto no-scrollbar">
              {heroMedia.map((m, idx) => {
                const isActive = idx === currentSlide
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`relative flex-shrink-0 h-14 w-24 rounded-none overflow-hidden transition-all duration-200 ${
                      isActive
                        ? 'border-2 border-white opacity-100 shadow-md'
                        : 'border border-white/20 opacity-40 hover:opacity-80'
                    }`}
                  >
                    <OptimizedImage
                      src={m.url}
                      alt={`Thumb ${idx + 1}`}
                      className="w-full h-full object-cover"
                      quality={40}
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* 2. ARCHITECTURAL METADATA & SPECS BAR (Keskin Köşeli & Geometrik) */}
      <section className="border-y border-neutral-800 bg-[#121214]/95 backdrop-blur-md sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="space-y-1">
              <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                {isTr ? 'Proje' : 'Project'}
              </span>
              <p className="text-sm font-medium text-white truncate">{projectTitle}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                {isTr ? 'Dönem / Yıl' : 'Period / Year'}
              </span>
              <p className="text-sm font-medium text-white">
                {project.date ? t(project.date) : '—'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                {isTr ? 'Medya Arşivi' : 'Media Archive'}
              </span>
              <p className="text-sm font-medium text-white font-mono">
                {allMedia.length} {isTr ? 'Özel Kare' : 'Frames'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                {isTr ? 'Tasarım & Donatı' : 'Curated By'}
              </span>
              <p className="text-sm font-medium text-white">Birim Architectural</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EDITORIAL STORY / OVERVIEW SECTION */}
      {(project.excerpt || project.body) && (
        <section
          ref={galleryRef}
          className="py-20 md:py-28 px-6 md:px-12 lg:px-16 max-w-6xl mx-auto"
        >
          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              {/* Left Column */}
              <div className="lg:col-span-5 space-y-6">
                <span className="inline-block text-xs font-mono tracking-widest uppercase text-neutral-400 border-b border-neutral-700 pb-2">
                  {isTr ? 'KONSEPT & MİMARİ VİZYON' : 'CONCEPT & ARCHITECTURAL VISION'}
                </span>
                <h2 className="text-2xl md:text-3xl font-light leading-relaxed text-neutral-100 font-michroma">
                  {isTr
                    ? 'Mekanın ruhuna dokunan, zanaat ve modern çizgilerin kusursuz buluşması.'
                    : 'A seamless dialogue between artisanal craftsmanship and contemporary spatial design.'}
                </h2>
                <div className="w-16 h-[2px] bg-neutral-600" />
              </div>

              {/* Right Column (Keskin Köşeli Kutu) */}
              <div className="lg:col-span-7 space-y-8 text-neutral-300 font-light text-base md:text-lg leading-relaxed">
                {project.excerpt && (
                  <div className="p-6 rounded-none bg-neutral-900/60 border border-neutral-800 text-neutral-200 leading-relaxed font-normal">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <PortableTextLite value={t(project.excerpt as never) as any} />
                  </div>
                )}

                {project.body && (
                  <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-michroma">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <PortableTextLite value={t(project.body as never) as any} />
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* 4. INTERACTIVE SHOWCASE (Hotspots) */}
      {!isMobile && project?.interactiveShowcase && project.interactiveShowcase.length > 0 && (
        <section className="py-16 bg-[#121215] border-y border-neutral-800">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="mb-10 text-center space-y-2">
              <span className="text-xs font-mono tracking-widest uppercase text-neutral-400">
                {isTr ? 'ÜRÜN ETKİLEŞİMİ' : 'FURNITURE DISCOVERY'}
              </span>
              <h3 className="text-2xl md:text-3xl font-michroma font-light text-white">
                {project.interactiveShowcaseTitle
                  ? t(project.interactiveShowcaseTitle)
                  : isTr
                    ? 'Projede Kullanılan Birim Tasarımları'
                    : 'Birim Pieces in the Project'}
              </h3>
            </div>
            <InteractiveShowcase
              items={project.interactiveShowcase}
              sectionTitle={project.interactiveShowcaseTitle}
            />
          </div>
        </section>
      )}

      {/* 5. CONTENT BLOCKS */}
      {project.contentBlocks && project.contentBlocks.length > 0 && (
        <section className="py-12 bg-[#0d0d0f]">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <HomeContentBlocks
              blocks={project.contentBlocks}
              isMobile={isMobile}
              imageBorderClass={imageBorderClass}
            />
          </div>
        </section>
      )}

      {/* 6. CURATED EDITORIAL GALLERY GRID (Keskin Köşeli) */}
      {galleryMedia.length > 0 && (
        <section className="py-20 md:py-28 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-neutral-800 gap-4">
            <div>
              <span className="text-xs font-mono tracking-widest uppercase text-neutral-400">
                {isTr ? 'GÖRSEL ARŞİV' : 'CURATED GALLERY'}
              </span>
              <h3 className="text-2xl md:text-4xl font-light font-michroma text-white mt-1">
                {isTr ? 'Detaylar ve Atmosfer' : 'Atmosphere & Details'}
              </h3>
            </div>
            <p className="text-xs font-mono text-neutral-400">
              {isTr
                ? 'Görsellere tıklayarak tam ekranda keşfedin'
                : 'Click images to view in full resolution'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
            {galleryMedia.map((m, i) => {
              const patternIdx = i % 5
              let colSpan = 'md:col-span-6'
              if (patternIdx === 0) colSpan = 'md:col-span-12'
              else if (patternIdx === 3) colSpan = 'md:col-span-8'
              else if (patternIdx === 4) colSpan = 'md:col-span-4'

              return (
                <ScrollReveal key={i} delay={(i % 4) * 100}>
                  <div
                    className={`${colSpan} group relative rounded-none overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-500 transition-all duration-500 cursor-pointer`}
                    onClick={() => openFullscreen(m.url)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') openFullscreen(m.url)
                    }}
                  >
                    <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden">
                      {m.type === 'image' && (
                        <OptimizedImage
                          src={m.url}
                          srcMobile={m.urlMobile}
                          srcDesktop={m.urlDesktop}
                          alt={`${projectTitle} Gallery ${i + 1}`}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          crop={m.crop}
                          hotspot={m.hotspot}
                          origWidth={m.origWidth}
                          origHeight={m.origHeight}
                        />
                      )}
                      {m.type === 'video' && (
                        <OptimizedVideo
                          src={m.url}
                          srcMobile={m.urlMobile}
                          srcDesktop={m.urlDesktop}
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      )}

                      {/* Hover Overlay with expand icon (Keskin Köşeli) */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="p-3.5 rounded-none bg-white text-black shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Bottom Image Tag */}
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-none bg-black/80 text-[10px] font-mono tracking-widest text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
                        FRAME {String(i + 1).padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </section>
      )}

      {/* 7. CINEMATIC PREV / NEXT PROJECT TRANSITION STRIP (Keskin Köşeli) */}
      <section className="border-t border-neutral-800 bg-[#09090b] py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Prev Project Card */}
            {prevProject ? (
              <Link
                to={`/projects/${prevProject.id}`}
                className="group relative flex flex-col justify-between p-8 rounded-none bg-neutral-950 border border-neutral-800 hover:border-white/40 hover:bg-neutral-900 transition-all duration-300"
              >
                <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-neutral-400 group-hover:text-white uppercase transition-colors">
                  <svg
                    className="w-4 h-4 transition-transform group-hover:-translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span>{isTr ? 'Önceki Proje' : 'Previous Project'}</span>
                </div>
                <div className="mt-6">
                  <h4 className="text-xl md:text-2xl font-michroma font-light text-neutral-200 group-hover:text-white truncate">
                    {t(prevProject.title)}
                  </h4>
                  {prevProject.date && (
                    <p className="text-xs font-mono text-neutral-500 mt-1">{t(prevProject.date)}</p>
                  )}
                </div>
              </Link>
            ) : (
              <div />
            )}

            {/* Next Project Card */}
            {nextProject ? (
              <Link
                to={`/projects/${nextProject.id}`}
                className="group relative flex flex-col justify-between p-8 rounded-none bg-neutral-950 border border-neutral-800 hover:border-white/40 hover:bg-neutral-900 transition-all duration-300 text-right"
              >
                <div className="flex items-center justify-end gap-2 text-xs font-mono tracking-widest text-neutral-400 group-hover:text-white uppercase transition-colors">
                  <span>{isTr ? 'Sonraki Proje' : 'Next Project'}</span>
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <div className="mt-6">
                  <h4 className="text-xl md:text-2xl font-michroma font-light text-neutral-200 group-hover:text-white truncate">
                    {t(nextProject.title)}
                  </h4>
                  {nextProject.date && (
                    <p className="text-xs font-mono text-neutral-500 mt-1">{t(nextProject.date)}</p>
                  )}
                </div>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </section>

      {/* Fullscreen Media Viewer */}
      {isFullscreenOpen && allMedia.length > 0 && (
        <FullscreenMediaViewer
          items={allMedia.map(m => {
            const item = m as unknown as Record<string, unknown>
            return {
              type: m.type,
              url: m.url,
              urlMobile: m.urlMobile,
              urlDesktop: m.urlDesktop,
              crop: m.crop,
              cropMobile: item['cropMobile'] as R2ImageMetadata['crop'],
              cropDesktop: item['cropDesktop'] as R2ImageMetadata['crop'],
              hotspot: m.hotspot,
              hotspotMobile: item['hotspotMobile'] as R2ImageMetadata['hotspot'],
              hotspotDesktop: item['hotspotDesktop'] as R2ImageMetadata['hotspot'],
              origWidth: item['origWidth'] as number | undefined,
              origWidthMobile: item['origWidthMobile'] as number | undefined,
              origWidthDesktop: item['origWidthDesktop'] as number | undefined,
              origHeight: item['origHeight'] as number | undefined,
              origHeightMobile: item['origHeightMobile'] as number | undefined,
              origHeightDesktop: item['origHeightDesktop'] as number | undefined,
              isMirrored: item['isMirrored'] as boolean | undefined,
              isMirroredMobile: item['isMirroredMobile'] as boolean | undefined,
              isMirroredDesktop: item['isMirroredDesktop'] as boolean | undefined,
            }
          })}
          initialIndex={fullscreenIdx}
          onClose={() => setIsFullscreenOpen(false)}
        />
      )}
    </div>
  )
}
