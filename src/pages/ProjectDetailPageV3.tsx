import React, {useMemo, useState, useEffect, useRef} from 'react'
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

/**
 * 60FPS Parallax Vertical Media Item Card
 */
const ParallaxMediaCard: React.FC<{
  media: MediaItem
  index: number
  total: number
  year: string
  projectTitle: string
  onOpenFullscreen: (url: string) => void
  onRegisterRef: (el: HTMLDivElement | null) => void
}> = ({media, index, year, projectTitle, onOpenFullscreen, onRegisterRef}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const imageWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let animationFrameId: number | null = null

    const updateParallax = () => {
      if (!cardRef.current || !imageWrapperRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight || document.documentElement.clientHeight

      // Only calculate when visible in viewport range
      if (rect.bottom >= -150 && rect.top <= windowHeight + 150) {
        const cardCenterY = rect.top + rect.height / 2
        const screenCenterY = windowHeight / 2
        const normalizedPosY = (cardCenterY - screenCenterY) / (windowHeight / 2)
        const clampedPosY = Math.max(-1.4, Math.min(1.4, normalizedPosY))
        const shiftY = clampedPosY * -55 // 55px Smooth Parallax Displacement

        imageWrapperRef.current.style.transform = `scale(1.22) translate3d(0px, ${shiftY.toFixed(1)}px, 0px)`
      }
    }

    const onScroll = () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(updateParallax)
    }

    updateParallax()
    window.addEventListener('scroll', onScroll, {passive: true})
    window.addEventListener('resize', onScroll, {passive: true})

    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <ScrollReveal delay={index < 2 ? 0 : 80}>
      <div
        ref={node => {
          // @ts-expect-error mutable ref
          cardRef.current = node
          onRegisterRef(node)
        }}
        className="group relative bg-neutral-100 border border-neutral-300 hover:border-neutral-900 transition-all duration-500 shadow-sm hover:shadow-xl rounded-none overflow-hidden"
      >
        {/* Card Header Strip */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-neutral-200 text-[11px] font-mono tracking-widest text-neutral-700">
          <div className="flex items-center gap-2 font-semibold">
            <span className="w-1.5 h-1.5 bg-black rounded-none inline-block" />
            <span>{String(index + 1).padStart(2, '0')}</span>
          </div>
          <span className="text-neutral-400 uppercase text-[10px]">
            BIRIM ARCHITECTURAL / {year || '2024'}
          </span>
        </div>

        {/* Visual Media Container with Parallax Effect */}
        <div
          className="relative aspect-[16/10] md:aspect-[16/11] w-full overflow-hidden bg-neutral-900 cursor-pointer"
          onClick={() => onOpenFullscreen(media.url)}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') onOpenFullscreen(media.url)
          }}
        >
          <div
            ref={imageWrapperRef}
            className="w-full h-full will-change-transform pointer-events-none"
            style={{
              transform: 'scale(1.22) translate3d(0px, 0px, 0px)',
            }}
          >
            {media.type === 'image' && (
              <OptimizedImage
                src={media.url}
                srcMobile={media.urlMobile}
                srcDesktop={media.urlDesktop}
                alt={`${projectTitle} - ${index + 1}`}
                className="w-full h-full object-cover"
                loading={index < 2 ? 'eager' : 'lazy'}
                quality={92}
                crop={media.crop}
                hotspot={media.hotspot}
                origWidth={media.origWidth}
                origHeight={media.origHeight}
              />
            )}
            {media.type === 'video' && (
              <OptimizedVideo
                src={media.url}
                srcMobile={media.urlMobile}
                srcDesktop={media.urlDesktop}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            )}
          </div>

          {/* Fullscreen Button (Ultra Şeffaf & Hafif Cam Efektli) */}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onOpenFullscreen(media.url)
            }}
            title="Tam Ekran"
            aria-label="Tam Ekran"
            className="group pointer-events-auto absolute bottom-3 right-3 flex h-8 w-8 md:h-10 md:w-10 items-center justify-center border-[0.5px] border-white/25 bg-black/10 text-white/90 hover:text-white backdrop-blur-md transition-all duration-300 hover:bg-black/35 hover:border-white/60 active:scale-95 shadow-sm rounded-none z-10"
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
      </div>
    </ScrollReveal>
  )
}

export function ProjectDetailPageV3() {
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
  const imageBorderClass = 'rounded-none'
  const {setBrightness, reset} = useHeaderTheme()

  // Header temasını beyaz zemin (siyah elemanlar) olarak zorla
  useEffect(() => {
    setBrightness(1)
    return () => reset()
  }, [setBrightness, reset])

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 1024
    return false
  })

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [fullscreenIdx, setFullscreenIdx] = useState(0)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)

  const mediaItemRefs = useRef<(HTMLDivElement | null)[]>([])

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
      action: 'view_project_v3_split',
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

  // Extract All Medias
  const allMedia = useMemo(() => {
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

    if (project.contentBlocks && Array.isArray(project.contentBlocks)) {
      project.contentBlocks.forEach((block: ContentBlock) => {
        const mUrl = block.image || block.url
        if (mUrl && block.mediaType !== 'panels') {
          list.push({
            type: (block.mediaType as 'image' | 'video' | 'youtube') || 'image',
            url: mUrl,
            urlMobile: block.imageMobile || block.urlMobile,
            urlDesktop: block.imageDesktop || block.urlDesktop,
            crop: block.crop,
            hotspot: block.hotspot,
          })
        }
        if (block.mediaType === 'panels' && Array.isArray(block.imagePanels)) {
          block.imagePanels.forEach(p => {
            if (p.url) {
              list.push({
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

    const seen = new Set<string>()
    return list.filter(m => {
      const u = String(m.url || '').trim()
      if (!u || seen.has(u)) return false
      seen.add(u)
      return true
    })
  }, [project, coverUrl, coverMobile, coverDesktop, coverCrop, coverHotspot])

  // Track active media item on scroll
  useEffect(() => {
    if (allMedia.length === 0) return

    const handleScroll = () => {
      const windowCenter = window.innerHeight / 2
      let closestIdx = 0
      let minDistance = Infinity

      mediaItemRefs.current.forEach((el, idx) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const elCenter = rect.top + rect.height / 2
        const distance = Math.abs(elCenter - windowCenter)
        if (distance < minDistance) {
          minDistance = distance
          closestIdx = idx
        }
      })

      setActiveMediaIndex(closestIdx)
    }

    window.addEventListener('scroll', handleScroll, {passive: true})
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [allMedia])

  const scrollToMediaItem = (index: number) => {
    const target = mediaItemRefs.current[index]
    if (target) {
      target.scrollIntoView({behavior: 'smooth', block: 'center'})
    }
  }

  const projectTitle = project ? t(project.title) : ''
  const projObj = (project || {}) as unknown as Record<string, unknown>
  const projectLocation = projObj['location'] ? t(projObj['location'] as never) : ''
  const projectCategory = project?.projectCategory ? t(project.projectCategory) : ''
  const dateVal = project?.date
    ? typeof project.date === 'string'
      ? project.date
      : t(project.date as never)
    : ''
  const year = typeof dateVal === 'string' ? dateVal.match(/\d{4}/)?.[0] || dateVal : ''

  const openFullscreen = (mediaItemUrl: string) => {
    const foundIdx = allMedia.findIndex(m => m.url === mediaItemUrl)
    setFullscreenIdx(foundIdx !== -1 ? foundIdx : 0)
    setIsFullscreenOpen(true)
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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-black selection:text-white pt-20 md:pt-24 pb-36 font-sans">
      {/* 1. TOP BREADCRUMB STRIP */}
      <div className="w-full max-w-[96%] lg:max-w-[90vw] mx-auto px-4 md:px-8 lg:px-0 py-3 border-b border-neutral-200 text-neutral-500">
        <Breadcrumbs
          items={[
            {label: t('homepage'), to: '/'},
            {label: t('projects') || 'Projeler', to: '/projects'},
            {label: projectTitle},
          ]}
          className="text-xs uppercase tracking-widest text-neutral-500 [&_a]:!text-neutral-500 [&_a:hover]:!text-neutral-900 [&_span.font-bold]:!text-neutral-900"
        />
      </div>

      {/* 2. SPLIT ARCHITECTURAL WORKSPACE */}
      <main className="w-full max-w-[96%] lg:max-w-[90vw] mx-auto px-4 md:px-8 lg:px-0 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* ============================================================ */}
          {/* SOL PANEL (STICKY ARCHITECTURAL DOSSIER - SABİT MİMARİ DOSYA) */}
          {/* ============================================================ */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-7 pb-10">
            {/* Tag & Title Header */}
            <div className="space-y-3 pb-6 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-[2px] bg-black inline-block" />
                <span className="text-[10px] font-mono tracking-widest text-neutral-600 font-semibold uppercase">
                  {isTr ? 'MİMARİ DOSYA' : 'ARCHITECTURAL DOSSIER'}
                </span>
                {projectCategory && (
                  <>
                    <span className="text-neutral-300">/</span>
                    <span className="text-[10px] font-mono tracking-widest text-neutral-600 font-semibold uppercase">
                      {projectCategory}
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light font-oswald tracking-wide text-neutral-900 uppercase leading-snug whitespace-nowrap truncate">
                {projectTitle}
              </h1>
            </div>

            {/* Architectural Index Specs Table */}
            <div className="border border-neutral-200 bg-neutral-50/70 p-5 space-y-4 rounded-none">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="space-y-1 border-l-2 border-neutral-900 pl-3">
                  <span className="text-[10px] font-mono tracking-widest text-neutral-600 font-semibold uppercase">
                    {isTr ? 'KONUM' : 'LOCATION'}
                  </span>
                  <p className="text-xs font-semibold text-neutral-900 truncate">
                    {projectLocation || 'İstanbul, TR'}
                  </p>
                </div>
                <div className="space-y-1 border-l-2 border-neutral-400 pl-3">
                  <span className="text-[10px] font-mono tracking-widest text-neutral-600 font-semibold uppercase">
                    {isTr ? 'DÖNEM' : 'PERIOD'}
                  </span>
                  <p className="text-xs font-semibold text-neutral-900 font-mono">
                    {year || '2024'}
                  </p>
                </div>
                <div className="space-y-1 border-l-2 border-neutral-400 pl-3">
                  <span className="text-[10px] font-mono tracking-widest text-neutral-600 font-semibold uppercase">
                    {isTr ? 'TİPOLOJİ' : 'TYPOLOGY'}
                  </span>
                  <p className="text-xs font-semibold text-neutral-900 uppercase truncate">
                    {projectCategory || 'Architectural'}
                  </p>
                </div>
                <div className="space-y-1 border-l-2 border-neutral-400 pl-3">
                  <span className="text-[10px] font-mono tracking-widest text-neutral-600 font-semibold uppercase">
                    {isTr ? 'DONATI' : 'FURNITURE'}
                  </span>
                  <p className="text-xs font-semibold text-neutral-900 truncate">
                    Birim Collection
                  </p>
                </div>
              </div>
            </div>

            {/* Project Narrative & Description (Proje Açıklama Alanı) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-black rounded-none inline-block" />
                <span className="text-[10px] font-mono tracking-widest text-neutral-600 font-semibold uppercase">
                  {isTr ? 'PROJE HAKKINDA' : 'PROJECT STORY'}
                </span>
              </div>

              <div className="space-y-4 text-neutral-700 font-normal text-base md:text-[16px] leading-relaxed max-h-[440px] overflow-y-auto pr-2 scrollbar-thin">
                {project.excerpt ? (
                  <div className="p-4 sm:p-5 bg-white border-l-2 border-neutral-900 text-neutral-800 leading-relaxed font-normal text-base md:text-[16.5px] shadow-sm">
                    {typeof t(project.excerpt as never) === 'string' ? (
                      <p className="leading-relaxed">{String(t(project.excerpt as never))}</p>
                    ) : (
                      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                      <PortableTextLite value={t(project.excerpt as never) as any} />
                    )}
                  </div>
                ) : null}

                {project.body ? (
                  <div className="prose max-w-none text-neutral-700 text-base md:text-[16px] leading-relaxed prose-p:text-neutral-700 prose-p:leading-relaxed prose-headings:font-michroma prose-headings:text-neutral-800">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <PortableTextLite value={t(project.body as never) as any} />
                  </div>
                ) : !project.excerpt ? (
                  <p className="text-sm text-neutral-600 italic leading-relaxed">
                    {isTr
                      ? `${projectTitle}, Birim koleksiyonunun çağdaş mimari ve mekan kurgusunu yansıtan özel bir projesidir.`
                      : `${projectTitle} is a bespoke project curated with Birim furniture collection, reflecting contemporary spatial architecture.`}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Projeye Uygun Açık/Şık Aktif Görsel Kontrol Bandı */}
            <div className="p-4 bg-white border border-neutral-300 text-neutral-900 rounded-none flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono tracking-widest text-neutral-600 font-semibold uppercase">
                  {isTr ? 'MEKAN DETAYI' : 'SPATIAL DETAIL'}
                </span>
                <div className="font-mono text-base font-michroma flex items-center gap-2 text-neutral-900">
                  <span className="font-bold">{String(activeMediaIndex + 1).padStart(2, '0')}</span>
                  <span className="text-neutral-300 font-light">/</span>
                  <span className="text-neutral-500 text-xs">
                    {String(allMedia.length).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Fullscreen Expand CTA */}
              <button
                type="button"
                onClick={() => openFullscreen(allMedia[activeMediaIndex]?.url || '')}
                className="group px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 hover:border-neutral-400 text-xs font-mono tracking-wider uppercase font-medium transition-colors duration-200 rounded-none flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
              >
                <span>{isTr ? 'BÜYÜT' : 'EXPAND'}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110"
                >
                  <path d="M15 3h6v6" />
                  <path d="M9 21H3v-6" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 21l7-7" />
                </svg>
              </button>
            </div>

            {/* Micro Thumbnail Grid for Instant Navigation */}
            {allMedia.length > 1 && (
              <div className="space-y-2 pt-2 border-t border-neutral-200">
                <span className="text-[10px] font-mono tracking-widest text-neutral-600 font-semibold uppercase block">
                  {isTr ? 'PROJE GÖRSELLERİ' : 'PROJECT IMAGES'}
                </span>
                <div className="grid grid-cols-6 gap-2">
                  {allMedia.map((m, idx) => {
                    const isActive = idx === activeMediaIndex
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => scrollToMediaItem(idx)}
                        className={`relative aspect-[4/3] rounded-none overflow-hidden border transition-all duration-200 ${
                          isActive
                            ? 'border-2 border-black ring-1 ring-black scale-105 opacity-100 z-10'
                            : 'border-neutral-300 opacity-40 hover:opacity-80'
                        }`}
                        title={`Görsel ${idx + 1}`}
                      >
                        <OptimizedImage
                          src={m.url}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          quality={30}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Prev / Next Quick Nav Strip */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-200 text-xs font-mono uppercase tracking-widest text-neutral-600">
              {prevProject ? (
                <Link
                  to={`/projects/${prevProject.id}`}
                  className="hover:text-black transition-colors flex items-center gap-1.5"
                >
                  <span>←</span>
                  <span className="truncate max-w-[140px]">{t(prevProject.title)}</span>
                </Link>
              ) : (
                <span />
              )}
              {nextProject ? (
                <Link
                  to={`/projects/${nextProject.id}`}
                  className="hover:text-black transition-colors flex items-center gap-1.5"
                >
                  <span className="truncate max-w-[140px]">{t(nextProject.title)}</span>
                  <span>→</span>
                </Link>
              ) : (
                <span />
              )}
            </div>
          </aside>

          {/* ============================================================ */}
          {/* SAĞ PANEL (DEV MİMARİ PARALLAX GÖRSEL AKIŞI) */}
          {/* ============================================================ */}
          <section className="lg:col-span-7 space-y-12 lg:space-y-16">
            {allMedia.map((m, i) => (
              <ParallaxMediaCard
                key={i}
                media={m}
                index={i}
                total={allMedia.length}
                year={year}
                projectTitle={projectTitle}
                onOpenFullscreen={openFullscreen}
                onRegisterRef={el => {
                  mediaItemRefs.current[i] = el
                }}
              />
            ))}

            {/* Interactive Showcase (varsa alt bölüme entegre) */}
            {!isMobile &&
              project?.interactiveShowcase &&
              project.interactiveShowcase.length > 0 && (
                <div className="py-8 bg-neutral-50 border border-neutral-200 p-6 rounded-none">
                  <div className="mb-6 space-y-1">
                    <span className="text-xs font-mono tracking-widest uppercase text-neutral-500">
                      {isTr ? 'ÜRÜN ETKİLEŞİMİ' : 'FURNITURE DISCOVERY'}
                    </span>
                    <h3 className="text-xl md:text-2xl font-michroma font-light text-neutral-900">
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
              )}

            {/* Additional Content Blocks (varsa) */}
            {project.contentBlocks && project.contentBlocks.length > 0 && (
              <div className="py-6 border-t border-neutral-200">
                <HomeContentBlocks
                  blocks={project.contentBlocks}
                  isMobile={isMobile}
                  imageBorderClass={imageBorderClass}
                />
              </div>
            )}
          </section>
        </div>
      </main>

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
