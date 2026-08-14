import {useMemo, useState, useEffect, useRef, useCallback} from 'react'
import {useQuery} from '@tanstack/react-query'
import {useParams, Link} from 'react-router-dom'
import {OptimizedImage} from '../components/OptimizedImage'
import {OptimizedVideo} from '../components/OptimizedVideo'
import {FullscreenMediaViewer} from '../components/FullscreenMediaViewer'
import {PageLoading} from '../components/LoadingSpinner'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useTranslation} from '../i18n'
import {useProjects} from '../hooks/useProjects'
import {getProjectById} from '../services/cms'
import {useSiteSettings} from '../hooks/useSiteData'
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

export function ProjectDetailPageV1() {
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
  const {t} = useTranslation()
  const {data: settings} = useSiteSettings()
  const {setFromPalette, reset} = useHeaderTheme()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 1024
    return false
  })

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [idx, setIdx] = useState(0)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [isFullscreenButtonVisible, setIsFullscreenButtonVisible] = useState(false)
  const [isTitleVisible, setIsTitleVisible] = useState(false)
  const [isLocationVisible, setIsLocationVisible] = useState(false)
  const [isPageVisible, setIsPageVisible] = useState(false)

  // Header temasını kapak görseli paletinden besle
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

  // Prev/Next must be declared before any early returns to keep hooks order stable
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

  // Sayfa animasyonu - ilk açılışta fade-in
  useEffect(() => {
    setIsPageVisible(false)
    const timer = setTimeout(() => {
      setIsPageVisible(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [projectId])

  // Analytics: proje detay görüntüleme (SEO başlığı ile uyumlu)
  useEffect(() => {
    if (!project) return
    if (typeof window === 'undefined') return

    const pageTitle = `BIRIM - ${t('projects') || 'Projeler'} - ${t(project.title)}`
    analytics.pageview(window.location.pathname, pageTitle)

    analytics.event({
      category: 'project',
      action: 'view_project',
      label: t(project.title),
    })
  }, [project, t])

  // Fullscreen buton animasyonu
  useEffect(() => {
    if (!project) return
    setIsFullscreenButtonVisible(false)
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        setIsFullscreenButtonVisible(true)
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [project])

  // Konum animasyonu
  useEffect(() => {
    if (!project) return
    setIsLocationVisible(false)
    const timer = setTimeout(() => {
      setIsLocationVisible(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [project])

  // Başlık animasyonu
  useEffect(() => {
    if (!project) return
    setIsTitleVisible(false)
    const timer = setTimeout(() => {
      setIsTitleVisible(true)
    }, 550)
    return () => clearTimeout(timer)
  }, [project])

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
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0)
  const [isHeroDragging, setIsHeroDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [draggedX, setDraggedX] = useState(0)
  const [isHeroTransitioning, setIsHeroTransitioning] = useState(false)
  const [areDotsVisible, setAreDotsVisible] = useState(false)

  const DRAG_THRESHOLD = 40
  const heroContainerRef = useRef<HTMLDivElement>(null)
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoPlayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dragStartY = useRef<number>(0)

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
  const safeHeroIndex = heroCount > 0 ? ((currentHeroSlide % heroCount) + heroCount) % heroCount : 0

  const extendedHeroMedia = useMemo(() => {
    if (heroCount <= 1) return heroMedia
    const last = heroMedia[heroCount - 1]
    const first = heroMedia[0]
    if (!last || !first) return heroMedia
    return [last, ...heroMedia, first]
  }, [heroMedia, heroCount])

  const resetHeroCloneIfNeeded = useCallback(() => {
    if (heroCount <= 1) return
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }
    const safeCurrent = ((currentHeroSlide % heroCount) + heroCount) % heroCount
    if (safeCurrent !== currentHeroSlide) {
      setIsHeroTransitioning(true)
      setCurrentHeroSlide(safeCurrent)
    }
  }, [currentHeroSlide, heroCount])

  const goToNextHeroSlide = useCallback(() => {
    if (heroCount <= 1) {
      setDraggedX(0)
      return
    }
    const safeCurrent = ((currentHeroSlide % heroCount) + heroCount) % heroCount
    const nextSlide = safeCurrent + 1

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }

    if (nextSlide >= heroCount) {
      setIsHeroTransitioning(false)
      setCurrentHeroSlide(heroCount)
      transitionTimeoutRef.current = setTimeout(() => {
        setIsHeroTransitioning(true)
        setCurrentHeroSlide(0)
        requestAnimationFrame(() => {
          setIsHeroTransitioning(false)
          transitionTimeoutRef.current = null
        })
      }, 750)
    } else {
      setIsHeroTransitioning(false)
      setCurrentHeroSlide(nextSlide)
    }
    setDraggedX(0)
  }, [currentHeroSlide, heroCount])

  const goToPrevHeroSlide = useCallback(() => {
    if (heroCount <= 1) {
      setDraggedX(0)
      return
    }
    const safeCurrent = ((currentHeroSlide % heroCount) + heroCount) % heroCount
    const prevSlide = safeCurrent - 1

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }

    if (prevSlide < 0) {
      setIsHeroTransitioning(false)
      setCurrentHeroSlide(-1)
      transitionTimeoutRef.current = setTimeout(() => {
        setIsHeroTransitioning(true)
        setCurrentHeroSlide(heroCount - 1)
        requestAnimationFrame(() => {
          setIsHeroTransitioning(false)
          transitionTimeoutRef.current = null
        })
      }, 750)
    } else {
      setIsHeroTransitioning(false)
      setCurrentHeroSlide(prevSlide)
    }
    setDraggedX(0)
  }, [currentHeroSlide, heroCount])

  // Otomatik Oynatma (Auto-play 5s)
  useEffect(() => {
    if (heroCount <= 1 || isHeroDragging) return
    autoPlayIntervalRef.current = setInterval(() => {
      goToNextHeroSlide()
    }, 5000)
    return () => {
      if (autoPlayIntervalRef.current) clearInterval(autoPlayIntervalRef.current)
    }
  }, [heroCount, isHeroDragging, goToNextHeroSlide])

  // Mouse & Touch Sürükleme Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (heroCount <= 1) return
    if (e.target instanceof HTMLElement && e.target.closest('a, button')) return
    resetHeroCloneIfNeeded()
    setIsHeroDragging(true)
    setDragStartX(e.clientX)
    dragStartY.current = e.clientY
    setDraggedX(0)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isHeroDragging || heroCount <= 1) return
    setDraggedX(e.clientX - dragStartX)
  }

  const handleMouseUp = () => {
    if (!isHeroDragging) return
    setIsHeroDragging(false)
    if (draggedX < -DRAG_THRESHOLD) {
      goToNextHeroSlide()
    } else if (draggedX > DRAG_THRESHOLD) {
      goToPrevHeroSlide()
    } else {
      setDraggedX(0)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (heroCount <= 1) return
    if (e.target instanceof HTMLElement && e.target.closest('a, button')) return
    const touch = e.touches[0]
    if (!touch) return
    resetHeroCloneIfNeeded()
    setIsHeroDragging(true)
    setDragStartX(touch.clientX)
    dragStartY.current = touch.clientY
    setDraggedX(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isHeroDragging || heroCount <= 1) return
    const touch = e.touches[0]
    if (!touch) return
    const deltaX = Math.abs(touch.clientX - dragStartX)
    const deltaY = Math.abs(touch.clientY - dragStartY.current)
    if (deltaY > deltaX * 2.5 && deltaY > 15) {
      setIsHeroDragging(false)
      setDraggedX(0)
      return
    }
    setDraggedX(touch.clientX - dragStartX)
  }

  // Dots animasyonu
  useEffect(() => {
    if (!project) return
    setAreDotsVisible(false)
    const timer = setTimeout(() => {
      setAreDotsVisible(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [project])

  const handleTouchEnd = () => {
    if (!isHeroDragging) return
    setIsHeroDragging(false)
    if (draggedX < -DRAG_THRESHOLD) {
      goToNextHeroSlide()
    } else if (draggedX > DRAG_THRESHOLD) {
      goToPrevHeroSlide()
    } else {
      setDraggedX(0)
    }
  }

  const mediaData = useMemo(() => {
    if (!project) return {all: [], gallery: []}

    const media: MediaItem[] = []

    // 1. Hero Medyaları
    heroMedia.forEach(m => media.push(m))

    // 2. İçerik Blokları
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

    // 3. Body
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
    // Hero medyaları altta tekrar sıralanmayacak
    heroMedia.forEach(m => excludedUrls.add(m.url))
    if (project.contentBlocks) {
      project.contentBlocks.forEach((block: ContentBlock) => {
        const url = block.image || block.url
        if (url) excludedUrls.add(url)
        const scan = (val: unknown) => {
          if (!val) return
          const blks = Array.isArray(val) ? val : [val]
          blks.forEach(b => {
            if (b?._type === 'portableTextImage' && (b.imageR2?.url || b.image?.asset?.url)) {
              excludedUrls.add(b.imageR2?.url || b.image?.asset?.url)
            }
          })
        }
        scan(t(block.description as never))
      })
    }

    const galleryItems = masterMedia.filter(m => !excludedUrls.has(m.url))

    return {all: masterMedia, gallery: galleryItems}
  }, [project, heroMedia, t])

  const allMedia = mediaData.all
  const galleryMedia = mediaData.gallery
  const projectTitle = project ? t(project.title) : ''

  useSEO({
    title: project ? `BIRIM - ${t(project.title)}` : undefined,
    description: project ? t(project.excerpt || '') : undefined,
    image: coverUrl || undefined,
    type: 'article',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    schema: project
      ? {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          '@id': `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/#/projects/${projectId}#project`,
          name: t(project.title),
          description: t(project.excerpt || '') || t(project.title),
          ...(coverUrl && {image: coverUrl}),
          ...(project.date && {datePublished: project.date}),
          author: {
            '@type': 'Organization',
            '@id': `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/#organization`,
          },
          publisher: {
            '@id': `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/#organization`,
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': typeof window !== 'undefined' ? window.location.href : '',
          },
        }
      : undefined,
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

  return (
    <div
      className={`min-h-screen bg-[var(--bg-primary)] transition-all duration-700 ease-out ${
        isPageVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
      }`}
    >
      <style>{`
        @media (orientation: landscape) and (max-height: 600px) {
          .project-hero-title {
            font-size: 1.15rem !important;
            line-height: 1.2 !important;
            margin-bottom: 0.25rem !important;
          }
          .project-hero-date {
            font-size: 0.75rem !important;
          }
        }
      `}</style>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={heroContainerRef}
        role="region"
        aria-label="Hero slider"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-[calc(100vh-48px)] md:h-[calc(100vh-56px)] overflow-hidden select-none"
      >
        {heroCount > 0 ? (
          <div className="absolute inset-0 overflow-hidden">
            <div
              className={`flex h-full w-full ${
                isHeroDragging ? 'cursor-grabbing' : heroCount > 1 ? 'cursor-grab' : ''
              }`}
              style={{
                transform:
                  heroCount > 1
                    ? `translateX(calc(-${(currentHeroSlide + 1) * 100}% + ${draggedX}px))`
                    : 'translateX(0)',
                transition: isHeroTransitioning
                  ? 'none'
                  : isHeroDragging
                    ? 'none'
                    : 'transform 750ms cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              {extendedHeroMedia.map((m, i) => (
                <div key={i} className="relative w-full h-full flex-shrink-0">
                  {m.type === 'video' ? (
                    <OptimizedVideo
                      src={m.url}
                      srcMobile={m.urlMobile}
                      srcDesktop={m.urlDesktop}
                      className="w-full h-full object-cover pointer-events-none"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <OptimizedImage
                      src={m.url}
                      srcMobile={m.urlMobile}
                      srcDesktop={m.urlDesktop}
                      alt={`${t(project.title)} ${i + 1}`}
                      className="w-full h-full object-cover pointer-events-none"
                      loading={i === 1 || heroCount === 1 ? 'eager' : 'lazy'}
                      quality={90}
                      crop={m.crop}
                      hotspot={m.hotspot}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Slayt Noktaları (Indicators - HomeHero Stili) */}
            {heroCount > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 pointer-events-auto">
                {(() => {
                  const centerIndex = Math.floor(heroCount / 2)
                  return heroMedia.map((_, index) => {
                    const isActive = index === safeHeroIndex
                    const distanceFromCenter = Math.abs(index - centerIndex)
                    const animationDelay = distanceFromCenter * 50

                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setIsHeroTransitioning(false)
                          setCurrentHeroSlide(index)
                        }}
                        className={`relative h-2 rounded-none transition-all duration-500 ease-in-out group ${
                          areDotsVisible ? 'animate-dot-grow' : 'opacity-0 scale-0'
                        } ${isActive ? 'w-2 bg-red-900' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                        style={{
                          transitionDelay: `${animationDelay}ms`,
                        }}
                        aria-label={`Go to slide ${index + 1}`}
                      >
                        {isActive && (
                          <div
                            key={`${safeHeroIndex}-${index}`}
                            className="absolute top-0 left-0 h-full rounded-none bg-red-900 animate-fill-line"
                          />
                        )}
                      </button>
                    )
                  })
                })()}
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 bg-[var(--bg-secondary)]" />
        )}

        <div className="absolute inset-0 bg-black/25 z-10 pointer-events-none" />

        {/* Top-Left Breadcrumb overlay - White color */}
        <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none pt-20 lg:pt-20 max-lg:landscape:pt-12">
          <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4 max-lg:landscape:py-0">
            <Breadcrumbs
              items={[
                {label: t('homepage'), to: '/'},
                {label: t('projects') || 'Projeler', to: '/projects'},
                {label: t(project.title)},
              ]}
              className="pointer-events-auto text-white/90 drop-shadow-md [&_a]:!text-white/80 [&_a:hover]:!text-white [&_span.font-bold]:!text-white [&_span.text-gray-400]:!text-white/50"
            />
          </div>
        </div>

        {/* Bottom Title & Fullscreen Button overlay */}
        <div
          className="absolute left-0 right-0 z-30 pointer-events-none"
          style={{
            bottom: 'max(16px, env(safe-area-inset-bottom, 0px) + 16px)',
          }}
        >
          <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 flex items-end justify-between gap-4">
            {/* Bottom-Left Title & Project Info */}
            <div className="flex-1">
              <h1
                className="project-hero-title text-base max-md:landscape:text-base md:text-2xl lg:text-3xl font-light tracking-tight text-white mb-1 md:mb-3 font-michroma pointer-events-auto"
                style={{
                  transform: isTitleVisible ? 'translateX(0)' : 'translateX(-40px)',
                  opacity: isTitleVisible ? 1 : 0,
                  transition: 'transform 1000ms ease-out, opacity 1000ms ease-out',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {t(project.title)}
              </h1>

              {project.date && (
                <p
                  className="project-hero-date text-xs max-md:landscape:text-xs md:text-base lg:text-lg text-white/90 font-light font-michroma pointer-events-auto"
                  style={{
                    transform: isLocationVisible ? 'translateX(0)' : 'translateX(-40px)',
                    opacity: isLocationVisible ? 1 : 0,
                    transition: 'transform 1000ms ease-out, opacity 1000ms ease-out 100ms',
                    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                >
                  {t(project.date)}
                </p>
              )}
            </div>

            {/* Bottom-Right Hero Navigation & Fullscreen Buttons */}
            <div className="flex items-center gap-2 md:gap-3 pointer-events-none flex-shrink-0">
              {heroCount > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPrevHeroSlide}
                    className="group pointer-events-auto flex h-8 w-8 md:h-10 md:w-10 items-center justify-center border-[0.5px] border-white/80 bg-transparent text-white transition-all duration-300 hover:bg-white/10 active:scale-95 shadow-lg"
                    aria-label="Previous slide"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-300 group-hover:-translate-x-1 text-white"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={goToNextHeroSlide}
                    className="group pointer-events-auto flex h-8 w-8 md:h-10 md:w-10 items-center justify-center border-[0.5px] border-white/80 bg-transparent text-white transition-all duration-300 hover:bg-white/10 active:scale-95 shadow-lg"
                    aria-label="Next slide"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-300 group-hover:translate-x-1 text-white"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </>
              )}
              {allMedia.length > 0 && (
                <div
                  className="pointer-events-none flex-shrink-0"
                  style={{
                    opacity: isFullscreenButtonVisible ? 1 : 0,
                    transform: isFullscreenButtonVisible ? 'scale(1)' : 'scale(0)',
                    transition:
                      'opacity 700ms ease-out, transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <button
                    onClick={() => {
                      setIdx(safeHeroIndex)
                      setIsFullscreenOpen(true)
                    }}
                    className="group pointer-events-auto flex h-8 w-8 md:h-10 md:w-10 items-center justify-center border-[0.5px] border-white/80 bg-transparent text-white transition-all duration-300 hover:bg-white/10 active:scale-95 shadow-lg"
                    aria-label="Tam Ekran"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform duration-500 group-hover:scale-110 h-4 w-4 md:h-5 md:w-5 text-white"
                    >
                      <path d="M15 3h6v6" />
                      <path d="M9 21H3v-6" />
                      <path d="M21 3l-7 7" />
                      <path d="M3 21l7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Altı Koyu Gri Bant (Dikey Ortalanmış Navigasyon Düğmeleri) */}
      <div className="w-full bg-[#1c1f24] text-white flex items-center min-h-[48px] md:min-h-[56px] py-2 md:py-2.5">
        <div className="w-full max-w-[95%] md:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0 flex justify-start">
            {prevProject ? (
              <Link
                to={`/projects/${prevProject.id}`}
                className="group inline-flex items-center gap-1.5 md:gap-2.5 text-white hover:text-gray-200 transition-colors max-w-full"
                aria-label={t(prevProject.title)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0 transition-transform duration-300 group-hover:-translate-x-1"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                <span className="text-xs md:text-sm font-bold max-w-[120px] sm:max-w-[220px] md:max-w-[340px] lg:max-w-[460px] truncate whitespace-nowrap overflow-hidden text-ellipsis opacity-90 group-hover:opacity-100">
                  {t(prevProject.title)}
                </span>
              </Link>
            ) : (
              <span className="w-8 h-8" />
            )}
          </div>

          <div className="flex-1 min-w-0 flex justify-end">
            {nextProject ? (
              <Link
                to={`/projects/${nextProject.id}`}
                className="group inline-flex items-center gap-1.5 md:gap-2.5 text-white hover:text-gray-200 transition-colors max-w-full justify-end"
                aria-label={t(nextProject.title)}
              >
                <span className="text-xs md:text-sm font-bold max-w-[120px] sm:max-w-[220px] md:max-w-[340px] lg:max-w-[460px] truncate whitespace-nowrap overflow-hidden text-ellipsis opacity-90 group-hover:opacity-100 text-right">
                  {t(nextProject.title)}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            ) : (
              <span className="w-8 h-8" />
            )}
          </div>
        </div>
      </div>

      {/* Interactive Showcase (Hotspot Slider) - Sadece projede veri varsa ve desktop'ta göster */}
      {!isMobile && project?.interactiveShowcase && project.interactiveShowcase.length > 0 && (
        <div className="hidden md:block">
          <InteractiveShowcase
            items={project.interactiveShowcase}
            sectionTitle={project.interactiveShowcaseTitle}
          />
        </div>
      )}

      {/* Proje Detay Metin İçeriği */}
      {(project.excerpt || project.body) && (
        <div className="w-full bg-[var(--bg-primary)] py-8 md:py-12">
          <div className="w-full max-w-[95%] md:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 space-y-6">
            {project.excerpt && (
              <div className="text-[var(--text-primary)] font-roboto-thin text-lg md:text-xl leading-relaxed">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <PortableTextLite value={t(project.excerpt as never) as any} />
              </div>
            )}
            {project.body && (
              <div className="text-[var(--text-primary)] font-roboto-thin text-lg md:text-xl leading-relaxed">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <PortableTextLite value={t(project.body as never) as any} />
              </div>
            )}
          </div>
        </div>
      )}

      {project.contentBlocks && project.contentBlocks.length > 0 && (
        <div>
          <HomeContentBlocks
            blocks={project.contentBlocks}
            isMobile={isMobile}
            imageBorderClass={imageBorderClass}
          />
        </div>
      )}

      {galleryMedia.length > 0 && (
        <div className="bg-[var(--bg-secondary)] pb-10">
          <div className="w-full max-w-[95%] md:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
            <div className="space-y-0">
              {galleryMedia.map((m, i) => {
                const globalIdx = allMedia.findIndex(am => am.url === m.url)
                return (
                  <ScrollReveal key={i} delay={i * 80}>
                    <button
                      onClick={() => {
                        setIdx(globalIdx !== -1 ? globalIdx : i)
                        setIsFullscreenOpen(true)
                      }}
                      className="w-full block"
                    >
                      {m.type === 'image' && (
                        <OptimizedImage
                          src={m.url}
                          srcMobile={m.urlMobile}
                          srcDesktop={m.urlDesktop}
                          alt={projectTitle}
                          className="w-full h-auto"
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
                          className="w-full"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      )}
                    </button>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </div>
      )}

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
          initialIndex={idx}
          onClose={() => setIsFullscreenOpen(false)}
        />
      )}
    </div>
  )
}
