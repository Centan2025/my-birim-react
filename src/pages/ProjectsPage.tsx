import React, {useRef, useState, useEffect} from 'react'
import {motion} from 'framer-motion'
import {Link} from 'react-router-dom'
import type {Project} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useProjects} from '../hooks/useProjects'
import {useSEO} from '../hooks/useSEO'

/**
 * Architectural Horizontal Gallery Card with 3D Parallax Displacement
 */
const ProjectHorizontalCard: React.FC<{
  project: Project
  total: number
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  hasDraggedRef: React.RefObject<boolean>
}> = ({project, scrollContainerRef, hasDraggedRef}) => {
  const {t} = useTranslation()
  const cardRef = useRef<HTMLDivElement>(null)
  const imageWrapperRef = useRef<HTMLDivElement>(null)

  // Calculate 60FPS Parallax Offset directly via DOM transform (both Mobile Vertical & Desktop Horizontal)
  useEffect(() => {
    const container = scrollContainerRef.current

    let animationFrameId: number | null = null

    const updateParallax = () => {
      if (!cardRef.current || !imageWrapperRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const windowWidth = window.innerWidth || document.documentElement.clientWidth
      const windowHeight = window.innerHeight || document.documentElement.clientHeight
      const isMobile = windowWidth < 768

      if (isMobile) {
        // Subtle & Smooth Vertical Parallax for Mobile
        const cardCenterY = rect.top + rect.height / 2
        const screenCenterY = windowHeight / 2
        const normalizedPosY = (cardCenterY - screenCenterY) / (windowHeight / 2)
        const clampedPosY = Math.max(-1.2, Math.min(1.2, normalizedPosY))
        const shiftY = clampedPosY * -65 // Smooth 65px vertical parallax shift on mobile

        imageWrapperRef.current.style.transform = `scale(1.25) translate3d(0px, ${shiftY.toFixed(1)}px, 0px)`
      } else {
        // Ultra-Dramatic 250px Horizontal Parallax for Desktop
        const cardCenterX = rect.left + rect.width / 2
        const screenCenterX = windowWidth / 2
        const normalizedPosX = (cardCenterX - screenCenterX) / (windowWidth / 2)
        const clampedPosX = Math.max(-1.8, Math.min(1.8, normalizedPosX))
        const shiftX = clampedPosX * -250 // Massive 250px horizontal parallax shift

        imageWrapperRef.current.style.transform = `scale(1.52) translate3d(${shiftX.toFixed(1)}px, 0px, 0px)`
      }
    }

    const onScrollOrDrag = () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(updateParallax)
    }

    updateParallax()
    if (container) container.addEventListener('scroll', onScrollOrDrag, {passive: true})
    window.addEventListener('scroll', onScrollOrDrag, {passive: true})
    window.addEventListener('resize', onScrollOrDrag, {passive: true})

    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
      if (container) container.removeEventListener('scroll', onScrollOrDrag)
      window.removeEventListener('scroll', onScrollOrDrag)
      window.removeEventListener('resize', onScrollOrDrag)
    }
  }, [scrollContainerRef])

  // Extract year from localized date string
  const dateVal = typeof project.date === 'string' ? project.date : t(project.date as never)
  const year = typeof dateVal === 'string' ? dateVal.match(/\d{4}/)?.[0] || dateVal : ''

  return (
    <div
      ref={cardRef}
      data-project-card="true"
      className="flex-shrink-0 w-full md:w-[84vw] lg:w-[78vw] max-w-[1450px] snap-center pr-3 md:pr-5 mb-6 md:mb-0"
    >
      <Link
        to={`/projects/${project.id}`}
        onClick={e => {
          if (hasDraggedRef.current) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        className="group relative block w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] overflow-hidden bg-zinc-950 border-[0.5px] border-white/10 hover:border-white/80 shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.18)] transition-all duration-700"
      >
        {/* Project Image Wrapper with 60FPS Ultra-Dramatic Parallax Displacement */}
        <div
          ref={imageWrapperRef}
          className="w-full h-full overflow-hidden will-change-transform pointer-events-none"
          style={{
            transform: 'scale(1.48) translate3d(0px, 0px, 0px)',
          }}
        >
          {project.cover && (
            <OptimizedImage
              src={typeof project.cover === 'string' ? project.cover : project.cover?.url || ''}
              srcMobile={typeof project.cover === 'object' ? project.cover.urlMobile : undefined}
              srcDesktop={typeof project.cover === 'object' ? project.cover.urlDesktop : undefined}
              alt={t(project.title)}
              className="w-full h-full object-cover pointer-events-none"
              width={1200}
              height={800}
              loading="lazy"
              quality={90}
              crop={typeof project.cover === 'object' ? project.cover.crop : undefined}
              hotspot={typeof project.cover === 'object' ? project.cover.hotspot : undefined}
              origWidth={
                typeof project.cover === 'object'
                  ? ((project.cover as Record<string, unknown>)['origWidth'] as number)
                  : undefined
              }
              origHeight={
                typeof project.cover === 'object'
                  ? ((project.cover as Record<string, unknown>)['origHeight'] as number)
                  : undefined
              }
            />
          )}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />

        {/* Floating Architectural Details with Glassmorphism */}
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 z-10 pointer-events-none transition-all duration-700 bg-gradient-to-t from-black/95 via-black/70 to-transparent group-hover:backdrop-blur-md border-t border-transparent group-hover:border-white/15">
          {/* Meta Line */}
          <div className="flex items-center gap-3 mb-2.5">
            {year && (
              <span className="text-[10px] md:text-[11px] font-bold tracking-[0.3em] text-white uppercase drop-shadow">
                {year}
              </span>
            )}
            {year && project.projectCategory && <div className="w-6 h-px bg-white/40" />}
            {project.projectCategory && (
              <span className="text-[10px] md:text-[11px] font-medium tracking-[0.25em] text-white/70 uppercase">
                {t(project.projectCategory)}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light tracking-tight text-white uppercase leading-tight mb-2 transition-all duration-500 group-hover:drop-shadow-[0_2px_12px_rgba(255,255,255,0.4)]">
            {t(project.title)}
          </h2>

          {/* Minimal Bottom Line with Location/Category Hover Transition (Option 2) */}
          <div className="relative overflow-hidden h-7 mt-3 pt-2 border-t border-white/15">
            {/* Default State: BIRIM / YEAR */}
            <span className="text-[10px] font-mono tracking-widest text-white/50 group-hover:-translate-y-full group-hover:opacity-0 transition-all duration-500 ease-out absolute left-0 top-2">
              BIRIM / {year || 'ARCH'}
            </span>

            {/* Hover State: LOCATION / CATEGORY */}
            <span className="text-[10px] font-mono tracking-widest text-white font-medium translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out absolute left-0 top-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {(() => {
                const projObj = project as unknown as Record<string, unknown>
                const cat = project.projectCategory ? t(project.projectCategory) : ''
                const loc = projObj['location'] ? t(projObj['location'] as never) : ''
                if (loc && cat) return `${loc} · ${cat}`.toUpperCase()
                if (loc) return `${loc} / TR`.toUpperCase()
                if (cat) return `İSTANBUL / ${cat}`.toUpperCase()
                return 'İSTANBUL, TR'
              })()}
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}

export function ProjectsPage() {
  const {data: projects = [], isLoading: loading} = useProjects()
  const {t} = useTranslation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Mouse Drag & Smooth Inertia Scroll State
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftStartRef = useRef(0)
  const hasDraggedRef = useRef(false)
  const targetScrollLeftRef = useRef(0)

  useSEO({
    title: t('projects_meta_title') || 'BIRIM - Projeler',
    description:
      t('projects_meta_description') || 'BIRIM projeleri, referans işleri ve uygulama örnekleri',
    type: 'website',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'Projects',
  })

  // Smooth Inertia Scroll & Window Event Listeners
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    targetScrollLeftRef.current = container.scrollLeft

    let lerpRafId: number | null = null

    // 60FPS Smooth Inertia Interpolation Loop (Lerp)
    const smoothLerpLoop = () => {
      const isMobile = window.innerWidth < 768
      if (!isMobile && container) {
        const maxScroll = container.scrollWidth - container.clientWidth
        if (maxScroll > 0) {
          targetScrollLeftRef.current = Math.max(
            0,
            Math.min(maxScroll, targetScrollLeftRef.current)
          )
          const diff = targetScrollLeftRef.current - container.scrollLeft
          if (Math.abs(diff) > 0.5) {
            container.scrollLeft += diff * 0.12 // Smooth dampening factor
          }
        }
      }
      lerpRafId = requestAnimationFrame(smoothLerpLoop)
    }

    lerpRafId = requestAnimationFrame(smoothLerpLoop)

    // Wheel listener: Capture phase 100% trap to prevent vertical page scroll when mouse is over project cards
    const handleWheel = (e: WheelEvent) => {
      const containerEl = scrollContainerRef.current
      if (!containerEl) return
      const isHorizontal = containerEl.scrollWidth > containerEl.clientWidth + 10
      if (!isHorizontal) return // Allow native vertical scroll when in mobile portrait mode

      const targetEl = e.target as HTMLElement | null

      // Check if mouse wheel target is inside or hovering any project card or gallery container
      const isOverProjectCard =
        Boolean(targetEl?.closest?.('[data-project-card="true"]')) ||
        Boolean(targetEl?.closest?.('.project-gallery-wrapper')) ||
        Boolean(containerEl?.contains(targetEl as Node))

      if (isOverProjectCard) {
        e.preventDefault()
        e.stopPropagation()
        const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
        targetScrollLeftRef.current += delta * 2.2
      }
    }

    // Global Window MouseMove listener for smooth inertia dragging
    const handleWindowMouseMove = (e: MouseEvent) => {
      // If left mouse button is no longer pressed, immediately terminate dragging
      if (e.buttons !== 1) {
        isDraggingRef.current = false
        return
      }
      if (!isDraggingRef.current || !container) return
      const isHorizontal = container.scrollWidth > container.clientWidth + 10
      if (!isHorizontal) return

      e.preventDefault()
      const x = e.pageX - container.offsetLeft
      const walk = (x - startXRef.current) * 1.8
      if (Math.abs(walk) > 5) {
        hasDraggedRef.current = true
      }
      targetScrollLeftRef.current = scrollLeftStartRef.current - walk
    }

    const handleWindowMouseUp = () => {
      isDraggingRef.current = false
    }

    // Finger Touch Drag Event Handlers for Mobile Horizontal Scroll
    const handleTouchStart = (e: TouchEvent) => {
      const containerEl = scrollContainerRef.current
      if (!containerEl) return
      const isHorizontal = containerEl.scrollWidth > containerEl.clientWidth + 10
      if (!isHorizontal) return

      const touch = e.touches[0]
      if (touch) {
        isDraggingRef.current = true
        hasDraggedRef.current = false
        startXRef.current = touch.pageX - containerEl.offsetLeft
        scrollLeftStartRef.current = containerEl.scrollLeft
        targetScrollLeftRef.current = containerEl.scrollLeft
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      const containerEl = scrollContainerRef.current
      if (!isDraggingRef.current || !containerEl) return
      const isHorizontal = containerEl.scrollWidth > containerEl.clientWidth + 10
      if (!isHorizontal) return

      const touch = e.touches[0]
      if (touch) {
        const x = touch.pageX - containerEl.offsetLeft
        const walk = (x - startXRef.current) * 1.8
        if (Math.abs(walk) > 5) {
          hasDraggedRef.current = true
          if (e.cancelable) e.preventDefault()
        }
        targetScrollLeftRef.current = scrollLeftStartRef.current - walk
      }
    }

    const handleTouchEnd = () => {
      isDraggingRef.current = false
    }

    // Capture phase (capture: true) traps wheel BEFORE browser computes page scroll
    window.addEventListener('wheel', handleWheel, {passive: false, capture: true})
    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
    window.addEventListener('mouseleave', handleWindowMouseUp)
    window.addEventListener('blur', handleWindowMouseUp)
    window.addEventListener('dragend', handleWindowMouseUp)
    window.addEventListener('touchstart', handleTouchStart, {passive: true})
    window.addEventListener('touchmove', handleTouchMove, {passive: false})
    window.addEventListener('touchend', handleTouchEnd, {passive: true})

    return () => {
      if (lerpRafId !== null) cancelAnimationFrame(lerpRafId)
      window.removeEventListener('wheel', handleWheel, {capture: true} as AddEventListenerOptions)
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
      window.removeEventListener('mouseleave', handleWindowMouseUp)
      window.removeEventListener('blur', handleWindowMouseUp)
      window.removeEventListener('dragend', handleWindowMouseUp)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [projects])

  // Track scroll progress
  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return
    const maxScroll = container.scrollWidth - container.clientWidth
    if (maxScroll > 0) {
      setScrollProgress(container.scrollLeft / maxScroll)
    }
  }

  // Mouse Drag Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current
    if (!container) return
    const isHorizontal = container.scrollWidth > container.clientWidth + 10
    if (!isHorizontal) return

    isDraggingRef.current = true
    hasDraggedRef.current = false
    startXRef.current = e.pageX - container.offsetLeft
    scrollLeftStartRef.current = container.scrollLeft
    targetScrollLeftRef.current = container.scrollLeft
  }

  const scrollToProjectIndex = (index: number) => {
    if (!scrollContainerRef.current) return
    const maxScroll =
      scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth
    if (projects.length > 1) {
      targetScrollLeftRef.current = (index / (projects.length - 1)) * maxScroll
    }
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      targetScrollLeftRef.current -= 650
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      targetScrollLeftRef.current += 650
    }
  }

  if (loading) {
    return (
      <div className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  const activeIndex = Math.min(
    projects.length - 1,
    Math.max(0, Math.round(scrollProgress * (projects.length - 1)))
  )

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen animate-fade-in-up-subtle pt-20 md:pt-16 lg:pt-20 selection:bg-primary selection:text-black flex flex-col justify-between overflow-x-hidden">
      {/* Top Section: Breadcrumb & Title */}
      <div>
        {/* Breadcrumb Band */}
        <div className="w-full relative z-20">
          <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-3 text-gray-400">
            <Breadcrumbs
              items={[{label: t('homepage'), to: '/'}, {label: t('projects') || 'Projeler'}]}
            />
          </div>
        </div>

        {/* Sayfa Başlığı (Ortalanmış) */}
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-2 md:pt-6 pb-6 md:pb-8 text-center">
          <motion.div
            initial={{opacity: 0, y: 15}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.8, ease: 'easeOut'}}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)] tracking-tight uppercase text-center">
              {t('projects') || 'Projeler'}
            </h1>
          </motion.div>
        </div>
      </div>

      {/* Exhibition Gallery Stream (Vertical on Mobile, Horizontal Runway on Desktop) */}
      <div className="w-full my-auto py-4">
        {projects.length > 0 ? (
          /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onDragStart={e => e.preventDefault()}
            className="flex flex-col md:flex-row items-center overflow-y-visible md:overflow-x-auto scrollbar-none pl-4 md:pl-[calc(4%+32px)] lg:pl-[10vw] pr-4 md:pr-[10vw] py-4 cursor-default md:cursor-grab active:md:cursor-grabbing select-none"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {projects.map(project => (
              <ProjectHorizontalCard
                key={project.id}
                project={project}
                total={projects.length}
                scrollContainerRef={scrollContainerRef}
                hasDraggedRef={hasDraggedRef}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-[var(--text-secondary)] text-lg italic font-light tracking-widest">
              {t('project_not_found')}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation & Segmented Dash Progress Bar (Desktop Only) */}
      <div className="hidden md:block w-full py-5 md:py-6 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 mt-auto">
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 flex items-center justify-center relative">
          {/* Centered Segmented Dash Bar */}
          <div className="w-full max-w-md flex items-center justify-center gap-2.5 py-2 mx-auto">
            {projects.map((p, idx) => {
              const isActive = idx === activeIndex
              const isPast = idx < activeIndex
              return (
                <button
                  key={p.id || idx}
                  onClick={() => scrollToProjectIndex(idx)}
                  className={`flex-1 rounded-full transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-white h-[4px] scale-y-125'
                      : isPast
                        ? 'bg-zinc-400 hover:bg-white h-[3px]'
                        : 'bg-zinc-700 hover:bg-zinc-500 h-[3px]'
                  }`}
                  aria-label={`Project ${idx + 1}`}
                />
              )
            })}
          </div>

          {/* Clean Flat Square Arrow Buttons (Right-aligned) */}
          <div className="absolute right-0 flex items-center gap-2">
            <button
              onClick={scrollLeft}
              className="w-10 h-10 bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-700 hover:border-white flex items-center justify-center transition-all duration-300 active:scale-95 group"
              aria-label="Scroll left"
            >
              <svg
                className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
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
            </button>
            <button
              onClick={scrollRight}
              className="w-10 h-10 bg-zinc-900 hover:bg-white text-zinc-300 hover:text-black border border-zinc-700 hover:border-white flex items-center justify-center transition-all duration-300 active:scale-95 group"
              aria-label="Scroll right"
            >
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
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
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
