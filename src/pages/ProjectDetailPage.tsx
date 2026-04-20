/* eslint-disable @typescript-eslint/no-explicit-any */
import {useMemo, useState, useEffect} from 'react'
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

const getYouTubeId = (url: string): string | null => {
  if (!url) return null
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[1] && match[1].length === 11 ? match[1] : null
}

const ArrowLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="0.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M8 6 2 12" />
    <path d="M2 12h20" />
  </svg>
)

const ArrowRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="0.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 6 22 12" />
    <path d="M22 12H2" />
  </svg>
)

export function ProjectDetailPage() {
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

  // Mobile detection for HomeContentBlocks
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const showBottomPrevNext = Boolean(settings?.showProductPrevNext)
  const [idx, setIdx] = useState(0)
  // Hero için index ve geçiş kontrolü - ProductDetailPage'teki hero mantığına paralel
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
    const prev = currentIndex > 0 ? allProjects[currentIndex - 1] : null
    const next = currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : null
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
  const coverCrop =
    project && project.cover && typeof project.cover === 'object'
      ? (project.cover as any).crop
      : undefined
  const coverHotspot =
    project && project.cover && typeof project.cover === 'object'
      ? (project.cover as any).hotspot
      : undefined

  // --- TÜM MEDYA ÖĞELERİNİ TOPLA (Fullscreen Viewer İçin) ---
  const allMedia = useMemo(() => {
    if (!project) return []

    const media: any[] = []

    // 1. Kapak Görseli
    if (coverUrl) {
      media.push({
        type: 'image',
        url: coverUrl,
        urlMobile: coverMobile,
        urlDesktop: coverDesktop,
        crop: coverCrop,
        hotspot: coverHotspot,
      })
    }

    // 2. Ana Galeri (media array)
    if (project.media && Array.isArray(project.media)) {
      project.media.forEach((m: any) => {
        const u = m.url || m.image
        if (u) {
          media.push({
            type: m.type || 'image',
            url: u,
            urlMobile: m.urlMobile,
            urlDesktop: m.urlDesktop,
            crop: (m as any).crop,
            hotspot: (m as any).hotspot,
          })
        }
      })
    }

    // 3. İçerik Bloklarındaki Medyalar (Content Blocks)
    if (project.contentBlocks && Array.isArray(project.contentBlocks)) {
      project.contentBlocks.forEach((block: any) => {
        // Ana blok medyası
        const mUrl = block.image || block.url
        const mType = block.mediaType || (block.image ? 'image' : block.url ? 'video' : undefined)

        if (mType && mUrl) {
          media.push({
            type: mType,
            url: mUrl,
            crop: block.crop,
            hotspot: block.hotspot,
          })
        }

        // Blok içindeki Portable Text (description) içindeki görselleri tara
        const scanPortableText = (val: any) => {
          if (!val) return
          const blocks = Array.isArray(val) ? val : [val]
          blocks.forEach(b => {
            if (b._type === 'portableTextImage' && b.imageR2?.url) {
              media.push({
                type: 'image',
                url: b.imageR2.url,
                crop: b.imageR2.cropWidth
                  ? {
                      x: b.imageR2.cropX || 0,
                      y: b.imageR2.cropY || 0,
                      width: b.imageR2.cropWidth,
                      height: b.imageR2.cropHeight,
                    }
                  : undefined,
                hotspot:
                  b.imageR2.hotspotX !== undefined
                    ? {x: b.imageR2.hotspotX, y: b.imageR2.hotspotY}
                    : undefined,
              })
            }
          })
        }

        if (block.description) {
          const desc = t(block.description)
          scanPortableText(desc)
        }
      })
    }

    // 4. Excerpt ve Body içindeki görselleri de ekle (opsiyonel ama tutarlılık için iyi)
    if (project.excerpt) scanDeep(t(project.excerpt), media)
    if (project.body) scanDeep(t(project.body), media)

    function scanDeep(val: any, target: any[]) {
      if (!val) return
      const blocks = Array.isArray(val) ? val : [val]
      blocks.forEach(b => {
        if (b._type === 'portableTextImage' && b.imageR2?.url) {
          target.push({
            type: 'image',
            url: b.imageR2.url,
            crop: b.imageR2.cropWidth
              ? {
                  x: b.imageR2.cropX || 0,
                  y: b.imageR2.cropY || 0,
                  width: b.imageR2.cropWidth,
                  height: b.imageR2.cropHeight,
                }
              : undefined,
            hotspot:
              b.imageR2.hotspotX !== undefined
                ? {x: b.imageR2.hotspotX, y: b.imageR2.hotspotY}
                : undefined,
          })
        }
      })
    }

    // Deduplicate
    const seen = new Set<string>()
    return media.filter(m => {
      const u = String(m.url || '').trim()
      if (!u || seen.has(u)) return false
      seen.add(u)
      return true
    })
  }, [project, coverUrl, coverMobile, coverDesktop, coverCrop, coverHotspot])

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
    schema: project ? {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: projectTitle,
      description: projectDescription,
      image: seoImage,
      datePublished: project.date,
      locationCreated: (project as any).location ? {
        '@type': 'Place',
        name: typeof (project as any).location === 'string' ? t((project as any).location) : 'Turkey'
      } : undefined,
      creator: {
        '@type': 'Organization',
        name: 'BIRIM'
      }
    } : undefined
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
        <p className="text-[var(--text-secondary)]">
          {t('project_not_found') || 'Proje bulunamadı'}
        </p>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-[var(--bg-primary)] transition-all duration-700 ease-out ${
        isPageVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
      }`}
      style={{
        transform: isPageVisible ? 'translateY(0)' : 'translateY(80px)',
      }}
    >
      {/* Hero Alanı: Kapak görseli ve üzerine bindirilmiş başlık/yıl */}
      <div className="relative w-full h-[60vh] md:h-[75vh] overflow-hidden hero-section">
        {/* Hero Medya (Sadece kapak görseli) */}
        {coverUrl ? (
          <div className="absolute inset-0 w-full h-full">
            <OptimizedImage
              src={coverUrl}
              srcMobile={coverMobile}
              srcDesktop={coverDesktop}
              alt={t(project.title)}
              className="w-full h-full object-cover"
              loading="eager"
              quality={90}
              crop={coverCrop}
              hotspot={coverHotspot}
              origWidth={
                project && project.cover && typeof project.cover === 'object'
                  ? (project.cover as any).origWidth
                  : undefined
              }
              origHeight={
                project && project.cover && typeof project.cover === 'object'
                  ? (project.cover as any).origHeight
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full bg-[var(--bg-secondary)]" />
        )}

        {/* Dark Overlay for Readability */}
        <div className="absolute inset-0 bg-black/40 z-10" />

        {/* Hero İçerik (Başlık, Tarih) - SOL ÜST */}
        <div className="absolute inset-0 z-20 flex flex-col justify-start pt-24 md:pt-28 lg:pt-32">
          <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-light tracking-tight text-white mb-2 md:mb-4"
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
                className="text-base md:text-lg lg:text-xl text-white/90 font-light"
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
        </div>

        {/* Fullscreen Butonu */}
        {allMedia.length > 0 && (
          <div
            className="absolute bottom-10 right-4 md:right-8 z-30"
            style={{
              opacity: isFullscreenButtonVisible ? 1 : 0,
              transform: isFullscreenButtonVisible ? 'scale(1)' : 'scale(0)',
              transition:
                'opacity 700ms ease-out, transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              ...(isMobile ? {bottom: 'max(16px, env(safe-area-inset-bottom, 0px) + 16px)'} : {}),
            }}
          >
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                setIdx(0)
                setIsFullscreenOpen(true)
              }}
              className="flex h-12 w-12 items-center justify-center rounded-none border-[0.5px] border-white/40 bg-transparent text-white transition-all duration-300 hover:scale-110 hover:bg-white/10 shadow-xl"
              aria-label="Büyüt"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-9 w-9"
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

      {/* Breadcrumb Band - Hero'nun altında */}
      <div className="w-full relative z-20">
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4">
          <Breadcrumbs
            items={[
              {label: t('homepage'), to: '/'},
              {label: t('projects') || 'Projeler', to: '/projects'},
              {label: t(project.title)},
            ]}
          />
        </div>
      </div>

      {(project.excerpt ||
        project.body ||
        allMedia.length > 0 ||
        (showBottomPrevNext && (prevProject || nextProject))) && (
        <div className="mt-0 relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[var(--bg-secondary)]">
          <div className="w-full md:max-w-[92%] lg:max-w-[80vw] mx-auto md:px-8 lg:px-0 py-6 md:py-8">
            {/* Top Prev / Next controls */}
            {showBottomPrevNext && (prevProject || nextProject) && (
              <div className="flex items-center justify-between mb-8 px-4 sm:px-0">
                <div>
                  {prevProject ? (
                    <Link
                      to={`/projects/${prevProject.id}`}
                      className="inline-flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      aria-label="Previous project"
                    >
                      <ArrowLeft className="w-7 h-7 md:w-8 md:h-8" />
                    </Link>
                  ) : (
                    <span className="w-7 h-7 md:w-8 md:h-8" />
                  )}
                </div>
                <div>
                  {nextProject ? (
                    <Link
                      to={`/projects/${nextProject.id}`}
                      className="inline-flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      aria-label="Next project"
                    >
                      <ArrowRight className="w-7 h-7 md:w-8 md:h-8" />
                    </Link>
                  ) : (
                    <span className="w-7 h-7 md:w-8 md:h-8" />
                  )}
                </div>
              </div>
            )}

            {/* Başlık ile aynı sol hizaya oturan içerik */}
            {(project.excerpt || project.body) && (
              <div className="w-full max-w-[95%] mx-auto space-y-4 px-4 sm:px-0 md:max-w-none md:mx-0">
                {project.excerpt && (
                  <ScrollReveal delay={200}>
                    {(() => {
                      const excerptContent = t(project.excerpt)
                      const isPortable =
                        Array.isArray(excerptContent) ||
                        (typeof excerptContent === 'object' &&
                          excerptContent !== null &&
                          (excerptContent as any)._type === 'block')

                      if (isPortable) {
                        const blocks = Array.isArray(excerptContent)
                          ? excerptContent
                          : [excerptContent]
                        return (
                          <div className="text-[var(--text-primary)] leading-relaxed font-roboto-thin text-lg md:text-xl">
                            <PortableTextLite
                              value={blocks}
                              onMediaClick={url => {
                                const clickIdx = allMedia.findIndex(m => m.url === url)
                                if (clickIdx !== -1) {
                                  setIdx(clickIdx)
                                  setIsFullscreenOpen(true)
                                }
                              }}
                            />
                          </div>
                        )
                      }

                      return (
                        <p className="text-[var(--text-primary)] leading-relaxed font-roboto-thin text-lg md:text-xl">
                          {excerptContent as string}
                        </p>
                      )
                    })()}
                  </ScrollReveal>
                )}
                {project.body && (
                  <ScrollReveal delay={300}>
                    {(() => {
                      const bodyContent = t(project.body)
                      const isPortable =
                        Array.isArray(bodyContent) ||
                        (typeof bodyContent === 'object' &&
                          bodyContent !== null &&
                          (bodyContent as any)._type === 'block')

                      if (isPortable) {
                        const blocks = Array.isArray(bodyContent) ? bodyContent : [bodyContent]
                        return (
                          <div className="text-[var(--text-primary)] leading-relaxed font-roboto-thin text-lg md:text-xl">
                            <PortableTextLite
                              value={blocks}
                              onMediaClick={url => {
                                const clickIdx = allMedia.findIndex(m => m.url === url)
                                if (clickIdx !== -1) {
                                  setIdx(clickIdx)
                                  setIsFullscreenOpen(true)
                                }
                              }}
                            />
                          </div>
                        )
                      }

                      return (
                        <div className="text-[var(--text-primary)] leading-relaxed font-roboto-thin text-lg md:text-xl whitespace-pre-line">
                          {bodyContent as string}
                        </div>
                      )
                    })()}
                  </ScrollReveal>
                )}
              </div>
            )}

            {/* İçerik Blokları - Ana sayfa ile aynı sistem */}
            {project.contentBlocks && project.contentBlocks.length > 0 ? (
              <div className={`${project.excerpt || project.body ? 'mt-10' : ''}`}>
                <HomeContentBlocks
                  blocks={project.contentBlocks}
                  isMobile={isMobile}
                  imageBorderClass={imageBorderClass}
                  overrideBackgroundColor="bg-[var(--bg-secondary)]"
                  onMediaClick={url => {
                    const clickIdx = allMedia.findIndex(m => m.url === url)
                    if (clickIdx !== -1) {
                      setIdx(clickIdx)
                      setIsFullscreenOpen(true)
                    }
                  }}
                />
              </div>
            ) : (
              /* Eski medya sistemi - contentBlocks yoksa fallback */
              allMedia.length > 0 && (
                <div className={`space-y-0 ${project.excerpt || project.body ? 'mt-10' : ''}`}>
                  {allMedia.map((m, i) => (
                    <ScrollReveal key={i} delay={i * 80} threshold={0.1} distance={20}>
                      <button
                        type="button"
                        onClick={() => {
                          setIdx(i)
                          setIsFullscreenOpen(true)
                        }}
                        className="w-full block cursor-pointer focus:outline-none group"
                      >
                        {m.type === 'image' && (
                          <OptimizedImage
                            src={m.url}
                            srcMobile={m.urlMobile}
                            srcDesktop={m.urlDesktop}
                            alt={`${t(project.title)} - ${i + 1}`}
                            className="w-full h-auto object-cover"
                            loading="lazy"
                            quality={85}
                            crop={m.crop}
                            hotspot={m.hotspot}
                            origWidth={m.origWidth}
                            origHeight={m.origHeight}
                          />
                        )}
                        {m.type === 'video' && (
                          <div className="w-full relative">
                            <OptimizedVideo
                              src={m.url}
                              srcMobile={m.urlMobile}
                              srcDesktop={m.urlDesktop}
                              className="w-full h-auto object-cover"
                              autoPlay
                              loop
                              muted
                              playsInline
                              preload="metadata"
                              loading="lazy"
                            />
                          </div>
                        )}
                        {m.type === 'youtube' && (
                          <div className="w-full aspect-video relative overflow-hidden">
                            <iframe
                              src={`https://www.youtube.com/embed/${getYouTubeId(m.url)}?autoplay=0&rel=0`}
                              title={`Video ${i + 1}`}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                              className="absolute top-0 left-0 w-full h-full"
                            />
                          </div>
                        )}
                      </button>
                    </ScrollReveal>
                  ))}
                </div>
              )
            )}
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
            crop: m.crop,
            hotspot: m.hotspot,
          }))}
          initialIndex={idx}
          onClose={() => setIsFullscreenOpen(false)}
        />
      )}
    </div>
  )
}

