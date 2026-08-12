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
import type {ContentBlock, R2ImageMetadata} from '../types'

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
  const coverCropMobile =
    project && project.cover && typeof project.cover === 'object'
      ? (project.cover as {cropMobile?: R2ImageMetadata['crop']}).cropMobile
      : undefined
  const coverHotspotMobile =
    project && project.cover && typeof project.cover === 'object'
      ? (project.cover as {hotspotMobile?: R2ImageMetadata['hotspot']}).hotspotMobile
      : undefined

  const mediaData = useMemo(() => {
    if (!project) return {all: [], gallery: []}

    const media: MediaItem[] = []

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

    // 2. Ana Galeri
    if (project.media && Array.isArray(project.media)) {
      project.media.forEach(m => {
        const u = m.url
        if (u) {
          media.push({
            type: m.type || 'image',
            url: u,
            urlMobile: m.urlMobile,
            urlDesktop: m.urlDesktop,
            crop: m.crop,
            hotspot: m.hotspot,
          })
        }
      })
    }

    // 3. İçerik Blokları
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

    // 4. Body
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
    if (coverUrl) excludedUrls.add(coverUrl)
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
  }, [project, coverUrl, coverMobile, coverDesktop, coverCrop, coverHotspot, t])

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
      <div className="relative w-full h-[60vh] md:h-[75vh] overflow-hidden">
        {coverUrl ? (
          <div className="absolute inset-0">
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
              cropMobile={coverCropMobile}
              hotspotMobile={coverHotspotMobile}
              origWidth={
                project.cover && typeof project.cover === 'object'
                  ? (project.cover as {origWidth?: number}).origWidth
                  : undefined
              }
              origHeight={
                project.cover && typeof project.cover === 'object'
                  ? (project.cover as {origHeight?: number}).origHeight
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-[var(--bg-secondary)]" />
        )}

        <div className="absolute inset-0 bg-black/40 z-10" />

        {/* Top-Left Breadcrumb overlay - White color */}
        <div className="absolute top-20 landscape:top-12 md:top-24 left-0 right-0 z-40 pointer-events-none pt-4 landscape:pt-0 md:pt-4">
          <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
            <Breadcrumbs
              items={[
                {label: t('homepage'), to: '/'},
                {label: t('projects') || 'Projeler', to: '/projects'},
                {label: t(project.title)},
              ]}
              className="pointer-events-auto inline-block text-white/90 drop-shadow-md [&_a]:!text-white/80 [&_a:hover]:!text-white [&_span.font-bold]:!text-white [&_span.text-gray-400]:!text-white/50"
            />
          </div>
        </div>

        {/* Bottom-Left Title & Project Info */}
        <div className="absolute bottom-12 md:bottom-10 left-0 right-0 text-white z-30 pointer-events-none">
          <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
            <h1
              className="text-xl md:text-2xl lg:text-3xl font-light tracking-tight text-white mb-2 md:mb-4 font-michroma pointer-events-auto"
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
                className="text-base md:text-lg lg:text-xl text-white/90 font-light font-michroma pointer-events-auto"
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

        {allMedia.length > 0 && (
          <div
            className="absolute bottom-10 right-4 md:right-8 z-30"
            style={{
              opacity: isFullscreenButtonVisible ? 1 : 0,
              transform: isFullscreenButtonVisible ? 'scale(1)' : 'scale(0)',
              transition:
                'opacity 700ms ease-out, transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <button
              onClick={() => {
                setIdx(0)
                setIsFullscreenOpen(true)
              }}
              className="flex h-12 w-12 items-center justify-center border-[0.5px] border-white/40 bg-transparent text-white transition-all hover:bg-white/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.8"
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

      <div className="w-full bg-[var(--bg-secondary)]">
        <div className="w-full max-w-[95%] md:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-8">
          <div className="flex justify-between mb-8">
            {prevProject && (
              <Link to={`/projects/${prevProject.id}`}>
                <ArrowLeft />
              </Link>
            )}
            {nextProject && (
              <Link to={`/projects/${nextProject.id}`}>
                <ArrowRight />
              </Link>
            )}
          </div>

          <div className="space-y-6">
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
      </div>

      {project.contentBlocks && project.contentBlocks.length > 0 && (
        <div className="mt-10">
          <HomeContentBlocks
            blocks={project.contentBlocks}
            isMobile={isMobile}
            imageBorderClass={imageBorderClass}
          />
        </div>
      )}

      {galleryMedia.length > 0 && (
        <div className="mt-10 bg-[var(--bg-secondary)] pb-10">
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
