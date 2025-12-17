import { useMemo, useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { OptimizedImage } from '../components/OptimizedImage'
import { OptimizedVideo } from '../components/OptimizedVideo'
import { FullscreenMediaViewer } from '../components/FullscreenMediaViewer'
import { PageLoading } from '../components/LoadingSpinner'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { useTranslation } from '../i18n'
import { useProject, useProjects } from '../hooks/useProjects'
import { useSiteSettings } from '../hooks/useSiteData'
import { analytics } from '../lib/analytics'
import ScrollReveal from '../components/ScrollReveal'
import { useSEO } from '../hooks/useSEO'
import { useHeaderTheme } from '../context/HeaderThemeContext'

const getYouTubeId = (url: string): string | null => {
  if (!url) return null
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[1] && match[1].length === 11 ? match[1] : null
}

const youTubeThumb = (url: string): string => {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''
}

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

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: project, isLoading: loading } = useProject(projectId)
  const { data: allProjects = [] } = useProjects()
  const { t } = useTranslation()
  const { data: settings } = useSiteSettings()
  const { setFromPalette, reset } = useHeaderTheme()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'
  const showBottomPrevNext = Boolean(settings?.showProductPrevNext)
  const [idx, setIdx] = useState(0)
  // Hero için index ve geçiş kontrolü - ProductDetailPage'teki hero mantığına paralel
  const [heroSlideIndex, setHeroSlideIndex] = useState(1) // 1: ilk gerçek slide (klonlu dizide)
  const [heroTransitionEnabled, setHeroTransitionEnabled] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [draggedX, setDraggedX] = useState(0)
  const DRAG_THRESHOLD = 50
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return false
  })
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [isFullscreenButtonVisible, setIsFullscreenButtonVisible] = useState(false)
  const [isTitleVisible, setIsTitleVisible] = useState(false)
  const [isLocationVisible, setIsLocationVisible] = useState(false)
  const [areDotsVisible, setAreDotsVisible] = useState(false)
  const [isPageVisible, setIsPageVisible] = useState(false)

  // Header temasını kapak görseli paletinden besle
  useEffect(() => {
    if (!project) {
      reset()
      return () => reset()
    }
    const palette =
      project.cover && typeof project.cover === 'object' ? (project.cover as any).palette : undefined
    if (palette) {
      setFromPalette(palette)
    } else {
      reset()
    }
    return () => reset()
  }, [project, reset, setFromPalette])
  // Prev/Next must be declared before any early returns to keep hooks order stable
  const { prevProject, nextProject } = useMemo(() => {
    if (!project || allProjects.length < 2) return { prevProject: null, nextProject: null }
    const currentIndex = allProjects.findIndex(p => p.id === project.id)
    if (currentIndex === -1) return { prevProject: null, nextProject: null }
    const prev = currentIndex > 0 ? allProjects[currentIndex - 1] : null
    const next = currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : null
    return { prevProject: prev, nextProject: next }
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
      label: t(project.title), // ID yerine proje başlığı
    })
  }, [project, t])


  // Fullscreen buton animasyonu - sağdan fade ile gelir
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

  // Proje konumu animasyonu - önce başlar, fade ile birlikte soldan gel
  useEffect(() => {
    if (!project) return
    setIsLocationVisible(false)
    const timer = setTimeout(() => {
      setIsLocationVisible(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [project])

  // Proje adı animasyonu - proje konumundan sonra başlar, fade ile birlikte soldan gel
  useEffect(() => {
    if (!project) return
    setIsTitleVisible(false)
    const timer = setTimeout(() => {
      setIsTitleVisible(true)
    }, 550)
    return () => clearTimeout(timer)
  }, [project])

  // Dot'lar animasyonu - ilk açılışta sağdan ve soldan birlikte gel
  useEffect(() => {
    if (!project) return
    setAreDotsVisible(false)
    const timer = setTimeout(() => {
      setAreDotsVisible(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [project])

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

  // --- HERO MEDYA HESAPLAMALARI (ÜRÜN DETAY MANTIĞINA YAKIN) ---

  // Helper: cover string veya object olabilir
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

  // Use cover image + media array (images and videos)
  const mediaArray = (project?.media || []).map(m => ({
    type: m.type,
    url: m.url,
    urlMobile: m.urlMobile,
    urlDesktop: m.urlDesktop,
    image: m.image || (m.type === 'image' ? m.url : undefined),
  }))

  // Cover görselini başa ekle (eğer varsa ve media array'inde yoksa)
  const coverMedia = coverUrl
    ? [
      {
        type: 'image' as const,
        url: coverUrl,
        urlMobile: coverMobile,
        urlDesktop: coverDesktop,
        image: coverUrl,
      },
    ]
    : []
  // Cover'ı media array'inin başına ekle, ancak aynı URL'den varsa tekrar ekleme
  const existingUrls = new Set(mediaArray.map(m => m.url))
  const coverToAdd = coverMedia.filter(m => !existingUrls.has(m.url))
  const allMedia = [...coverToAdd, ...mediaArray]

  const curr = allMedia[idx]
  const slideCount = allMedia.length || 1

  // Hero için cloned media: [son, ...allMedia, ilk] → yönü koruyan sonsuz kayma
  const heroMedia = useMemo(() => {
    if (slideCount <= 1) return allMedia
    const first = allMedia[0]
    const last = allMedia[allMedia.length - 1]
    return [last, ...allMedia, first]
  }, [allMedia, slideCount])
  const totalSlides = heroMedia.length || 1

  // SEO meta bilgileri
  const projectTitle = project ? t(project.title) : ''
  const projectDescription = project && project.body ? t(project.body) : projectTitle
  const seoImage =
    coverUrl ||
    (project?.media && project.media.length > 0 && project.media[0]
      ? project.media[0].url
      : undefined) ||
    undefined

  useSEO({
    title: projectTitle
      ? `BIRIM - ${t('projects') || 'Projeler'} - ${projectTitle}`
      : 'BIRIM - Projeler',
    description: projectDescription || 'BIRIM projeleri ve referans işleri',
    image: seoImage,
    type: 'article',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'Projects',
  })

  // Snap sonrası transition'ı tekrar aç
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
  if (!project) {
    return (
      <div className="pt-20 text-center">
        <p className="text-gray-600">{t('project_not_found') || 'Proje bulunamadı'}</p>
      </div>
    )
  }

  // Hero ileri/geri - ProductDetailPage'teki heroNext/heroPrev benzeri (sonsuz kayma)
  const next = () => {
    if (slideCount <= 1) return
    if (!heroTransitionEnabled) return
    // Sonsuz kayma index'i: cloned dizide bir sağa
    setHeroSlideIndex(prev => prev + 1)
    // Mantıksal index (thumbnails vb. için)
    setIdx(prev => (prev + 1) % slideCount)
  }

  const prev = () => {
    if (slideCount <= 1) return
    if (!heroTransitionEnabled) return
    setHeroSlideIndex(prev => prev - 1)
    setIdx(prev => (prev - 1 + slideCount) % slideCount)
  }

  // Üst ana medya alanı için drag (mouse/touch) ile ileri-geri geçiş
  const handleHeroDragStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (e.target instanceof HTMLElement && e.target.closest('a, button')) {
      return
    }
    setIsDragging(true)
    const startX =
      'touches' in e && e.touches && e.touches.length > 0
        ? (e.touches[0]?.clientX ?? 0)
        : 'clientX' in e
          ? e.clientX
          : 0
    setDragStartX(startX)
    setDraggedX(0)
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
    setDraggedX(currentX - dragStartX)
  }

  const handleHeroDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    if (draggedX < -DRAG_THRESHOLD) {
      next()
    } else if (draggedX > DRAG_THRESHOLD) {
      prev()
    }
    setDraggedX(0)
  }

  // Hero geçişi bittiğinde cloned slide'lardan gerçek slide'a "snap" et (animasyonsuz)
  const handleHeroTransitionEnd = () => {
    if (slideCount <= 1) return
    if (!heroTransitionEnabled) return

    // Sonraki clone'dan ilk gerçeğe
    if (heroSlideIndex === totalSlides - 1) {
      setHeroTransitionEnabled(false)
      setHeroSlideIndex(1)
      return
    }
    // Önceki clone'dan son gerçeğe
    if (heroSlideIndex === 0) {
      setHeroTransitionEnabled(false)
      setHeroSlideIndex(totalSlides - 2)
    }
  }

  return (
    <div
      className={`min-h-screen bg-white transition-all duration-700 ease-out ${isPageVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-20'
        }`}
      style={{
        transform: isPageVisible ? 'translateY(0)' : 'translateY(80px)',
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 lg:pt-24">
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: t('homepage'), to: '/' },
            { label: t('projects') || 'Projeler', to: '/projects' },
            { label: t(project.title) },
          ]}
        />
        <div className="mt-6 md:mt-8 mb-4 md:mb-6 lg:mb-6">
          <h1
            className="text-4xl font-light tracking-tight text-gray-900"
            style={{
              transform: isTitleVisible ? 'translateX(0)' : 'translateX(-40px)',
              opacity: isTitleVisible ? 1 : 0,
              transition: 'transform 1000ms ease-out, opacity 1000ms ease-out'
            }}
          >
            {t(project.title)}
          </h1>
          {project.date && (
            <p
              className="text-sm text-gray-500 mt-2 font-light"
              style={{
                transform: isLocationVisible ? 'translateX(0)' : 'translateX(-40px)',
                opacity: isLocationVisible ? 1 : 0,
                transition: 'transform 1000ms ease-out, opacity 1000ms ease-out'
              }}
            >
              {t(project.date)}
            </p>
          )}
          {/* Başlık altındaki gri çizgi – tam ekran */}
          <div className="mt-2 md:mt-3 lg:mt-2 relative left-1/2 right-1/2 -mx-[50vw] w-screen">
            <div className="h-px bg-gray-300 w-full"></div>
          </div>
        </div>
        {/* Sadece kapak görseli varsa - sabit oranlı hero alanı */}
        {coverUrl && !curr && (
          <div className="mt-2 md:mt-3 lg:mt-2 relative w-full aspect-[16/9]">
            <OptimizedImage
              src={coverUrl}
              srcMobile={coverMobile}
              srcDesktop={coverDesktop}
              alt={t(project.title)}
              className={`absolute inset-0 w-full h-full object-contain mx-auto ${imageBorderClass}`}
              loading="eager"
              quality={90}
            />
          </div>
        )}
        {curr && (
          <div
            className="mt-2 md:mt-3 lg:mt-2 relative"
            onMouseDown={handleHeroDragStart}
            onMouseMove={handleHeroDragMove}
            onMouseUp={handleHeroDragEnd}
            onMouseLeave={handleHeroDragEnd}
            onTouchStart={handleHeroDragStart}
            onTouchMove={handleHeroDragMove}
            onTouchEnd={handleHeroDragEnd}
          >
            {/* Slider'lı hero alanı - sabit oranlı */}
            <div className="w-full overflow-hidden relative aspect-[16/9]">
              <div
                className="flex h-full"
                style={{
                  width: `${totalSlides * 100}%`,
                  transform: `translateX(calc(-${((slideCount <= 1 ? 0 : heroSlideIndex) * 100) / totalSlides
                    }% + ${draggedX}px))`,
                  transition: isDragging || !heroTransitionEnabled ? 'none' : 'transform 0.3s ease-out',
                }}
                onTransitionEnd={handleHeroTransitionEnd}
              >
                {heroMedia.map((m, i) => {
                  if (!m) return null
                  return (
                    <div
                      key={i}
                      className="relative w-full h-full shrink-0"
                      style={{ width: `${100 / totalSlides}%` }}
                    >
                      {m.type === 'image' && (
                        <OptimizedImage
                          src={m.url}
                          srcMobile={m.urlMobile}
                          srcDesktop={m.urlDesktop}
                          alt="project"
                          className={`w-full h-full object-contain mx-auto ${imageBorderClass}`}
                          loading="eager"
                          quality={90}
                        />
                      )}
                      {m.type === 'video' && (
                        <div style={{ paddingTop: '56.25%' }} className="w-full relative">
                          <OptimizedVideo
                            src={m.url}
                            srcMobile={m.urlMobile}
                            srcDesktop={m.urlDesktop}
                            className={`absolute top-0 left-0 w-full h-full object-contain ${imageBorderClass}`}
                            controls
                            playsInline
                            preload="metadata"
                            loading="eager"
                          />
                        </div>
                      )}
                      {m.type === 'youtube' && (
                        <div style={{ paddingTop: '56.25%' }} className="w-full relative">
                          <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeId(m.url)}?rel=0`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                            className="absolute top-0 left-0 w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Hero altındaki slider dot'ları (HomeHero / ProductDetailPage ile aynı stil) */}
              {slideCount > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-4">
                  {(() => {
                    // Klonlu dizideki index'ten gerçek slide index'ine normalize et
                    const normalizedSlideIndex =
                      slideCount <= 1
                        ? 0
                        : heroSlideIndex === 0
                          ? slideCount - 1
                          : heroSlideIndex === totalSlides - 1
                            ? 0
                            : heroSlideIndex - 1

                    return allMedia.map((_, index) => {
                      const isActive = index === normalizedSlideIndex
                      // Ortadaki dot'tan başlayarak sağa ve sola doğru animasyon
                      const centerIndex = Math.floor(allMedia.length / 2)
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
                            setIdx(index)
                          }}
                          className={`relative rounded-full transition-all duration-500 ease-in-out group ${areDotsVisible ? 'animate-dot-height-grow' : 'h-0.5'
                            } ${isActive ? 'w-12 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                            } ${areDotsVisible
                              ? 'translate-x-0 opacity-100'
                              : isLeft
                                ? '-translate-x-[150%] opacity-0'
                                : 'translate-x-[250%] opacity-0'
                            }`}
                          style={{
                            transitionDelay: `${animationDelay}ms`,
                            ...(areDotsVisible ? {} : { height: '0.0625rem' }),
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

              {/* Fullscreen button - sadece medya varsa göster */}
              {allMedia.length > 0 && (
                <div
                  className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-20"
                  style={{
                    opacity: isFullscreenButtonVisible ? 1 : 0,
                    transform: isFullscreenButtonVisible
                      ? 'translateX(0) rotate(0deg)'
                      : 'translateX(80px) rotate(90deg)',
                    transition:
                      'opacity 700ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    willChange: 'transform, opacity',
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      analytics.event({
                        category: 'media',
                        action: 'project_fullscreen_click',
                        label: project?.id,
                        value: idx,
                      })
                      setIsFullscreenOpen(true)
                    }}
                    className="group flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-black/40 active:scale-95"
                    aria-label="Büyüt"
                  >
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
                      className="h-6 w-6 md:h-8 md:w-8 transition-transform duration-500"
                    >
                      <line x1="12" y1="4" x2="12" y2="20" />
                      <line x1="4" y1="12" x2="20" y2="12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            {allMedia.length > 1 && !isMobile && (
              <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-between px-6">
                <button
                  type="button"
                  onClick={prev}
                  className="group pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-black/40 active:scale-95"
                  aria-label={t('previous')}
                >
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
                    className="h-8 w-8 transition-transform duration-300 group-hover:-translate-x-0.5"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="group pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-black/40 active:scale-95"
                  aria-label={t('next')}
                >
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
                    className="h-8 w-8 transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
        {/* Ana görselin altında ince gri çizgi – tam ekran */}
        {curr && (
          <div className="mt-6 relative left-1/2 right-1/2 -mx-[50vw] w-screen">
            <div className="h-px bg-gray-300 w-full" />
          </div>
        )}
        {(project.excerpt || project.body || allMedia.length > 0) && (
          <div className="mt-0 relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-gray-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
              {/* Başlık ile aynı sol hizaya oturan içerik */}
              {(project.excerpt || project.body) && (
                <div className="max-w-4xl mx-auto space-y-4 px-4 sm:px-0">
                  {project.excerpt && (
                    <ScrollReveal delay={200}>
                      <p className="text-lg text-gray-900 leading-relaxed font-normal">
                        {t(project.excerpt)}
                      </p>
                    </ScrollReveal>
                  )}
                  {project.body && (
                    <ScrollReveal delay={300}>
                      <div className="text-gray-900 leading-relaxed font-normal whitespace-pre-line">
                        {t(project.body)}
                      </div>
                    </ScrollReveal>
                  )}
                </div>
              )}

              {allMedia.length > 0 && (
                <div className={`grid grid-cols-2 gap-4 ${project.excerpt || project.body ? 'mt-10' : ''}`}>
                  {allMedia.map((m, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setIdx(i)
                        setIsFullscreenOpen(true)
                      }}
                      className="border border-gray-200 bg-gray-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                    >
                      {m.type === 'image' && (
                        <OptimizedImage
                          src={m.url}
                          alt={`thumb-${i}`}
                          className="w-full aspect-square object-contain"
                          loading="lazy"
                          quality={75}
                        />
                      )}
                      {m.type === 'video' && (
                        <div className="w-full aspect-square bg-gray-50 flex items-center justify-center relative">
                          <OptimizedVideo
                            src={m.url}
                            className="w-full h-full object-contain"
                            preload="none"
                            loading="lazy"
                          />
                          <span className="absolute bottom-1 right-1 bg-white/85 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center shadow text-xs">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-3 h-3 ml-0.5"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        </div>
                      )}
                      {m.type === 'youtube' && (
                        <div className="w-full aspect-square bg-gray-50 relative">
                          <OptimizedImage
                            src={youTubeThumb(m.url)}
                            alt={`youtube thumb ${i + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            quality={75}
                          />
                          <span className="absolute bottom-1 right-1 bg-white/85 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center shadow text-xs">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-3 h-3 ml-0.5"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Prev / Next controls - footer'ın hemen üzerinde */}
        {showBottomPrevNext && (prevProject || nextProject) && (
          <div className="bg-white border-t border-gray-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  {prevProject ? (
                    <Link
                      to={`/projects/${prevProject.id}`}
                      className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      aria-label="Previous project"
                    >
                      <MinimalChevronLeft className="w-12 h-12 md:w-16 md:h-16" />
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>
                <div className="flex-1 text-right">
                  {nextProject ? (
                    <Link
                      to={`/projects/${nextProject.id}`}
                      className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      aria-label="Next project"
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
        {/* Tüm cihazlarda tam ekran viewer - ürün ve iletişim sayfalarıyla aynı sistem */}
        {isFullscreenOpen && allMedia.length > 0 && (
          <FullscreenMediaViewer
            items={allMedia.map(m => ({
              type: m.type,
              url: m.url,
              urlMobile: m.urlMobile,
              urlDesktop: m.urlDesktop,
            }))}
            initialIndex={idx}
            onClose={() => setIsFullscreenOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
