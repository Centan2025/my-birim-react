import React, {useRef, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {ArrowRight} from 'lucide-react'
import type {Project} from '../../types'
import {OptimizedImage} from '../OptimizedImage'
import {useTranslation} from '../../i18n'
import {toPlainText} from '../../utils/portableText'
import {useHeaderTheme} from '../../context/HeaderThemeContext'

interface ProjectsV4FullscreenViewProps {
  projects: Project[]
}

export const ProjectsV4FullscreenView: React.FC<ProjectsV4FullscreenViewProps> = ({projects}) => {
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'
  const navigate = useNavigate()
  const {setBrightness, reset: resetHeaderTheme} = useHeaderTheme()

  const containerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const currentIndexRef = useRef(0)
  const animFrameIdRef = useRef<number | null>(null)
  const scrollAnimRef = useRef<number | null>(null)

  // Header'ı şeffaf ve elemanlarını (logo, linkler, ikonlar) beyaz yap
  useEffect(() => {
    setBrightness(0)
    return () => {
      resetHeaderTheme()
    }
  }, [setBrightness, resetHeaderTheme])

  // Ultra-Smooth, Yavaşlatılmış ve Sinematik Bölüm Bölüm (Section by Section) Scroll Sistemi
  // + Ekrandan Çıkan Projelerin Yavaşça Koyulaşması (Smooth Exit Darkening)
  useEffect(() => {
    const container = containerRef.current
    if (!container || projects.length === 0) return

    let touchStartY = 0

    // 60FPS Dinamik Koyulaşma Hesaplama (Ekran dışına doğru kayan projeleri yumuşakça karartır)
    const updateDarkenCurtains = () => {
      const viewHeight = window.innerHeight || container.clientHeight || 1
      const sections = container.querySelectorAll<HTMLElement>('[data-project-index]')

      sections.forEach(section => {
        const rect = section.getBoundingClientRect()
        // Projenin üst sınırdan ne kadar yukarı kaydığı (ekrandan çıkış mesafesi)
        const distPastTop = -rect.top
        let darkenProgress = 0

        if (distPastTop > 0) {
          // Üstten ekrandan dışarı doğru çıkarken kademeli olarak koyulaşır (%0 -> %85 siyah perde)
          darkenProgress = Math.min(0.85, (distPastTop / viewHeight) * 0.95)
        } else if (rect.top > 0) {
          // Alttan ekrana doğru yaklaşırken hafif yumuşak geçiş
          const distFromCenter = rect.top / viewHeight
          darkenProgress = Math.min(0.35, distFromCenter * 0.35)
        }

        const curtain = section.querySelector('.scroll-darken-curtain') as HTMLElement | null
        if (curtain) {
          curtain.style.opacity = `${darkenProgress.toFixed(3)}`
        }
      })
    }

    // Özel 900ms İpeksi & Dengeli Easing Interpolasyonu (Cinematic Smooth Transition)
    const smoothScrollTo = (targetY: number, duration = 900) => {
      const currentContainer = containerRef.current
      if (!currentContainer) return

      const startY = currentContainer.scrollTop
      const distance = targetY - startY
      if (Math.abs(distance) < 2) {
        isScrollingRef.current = false
        return
      }

      const startTime = performance.now()

      // Akıcı ve seri cubic ease-in-out eğrisi
      const easeInOutCubic = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(1, elapsed / duration)
        const easedProgress = easeInOutCubic(progress)

        currentContainer.scrollTop = startY + distance * easedProgress
        updateDarkenCurtains()

        if (progress < 1) {
          scrollAnimRef.current = requestAnimationFrame(step)
        } else {
          currentContainer.scrollTop = targetY
          scrollAnimRef.current = null
          setTimeout(() => {
            isScrollingRef.current = false
          }, 60)
        }
      }

      if (scrollAnimRef.current !== null) {
        cancelAnimationFrame(scrollAnimRef.current)
      }
      scrollAnimRef.current = requestAnimationFrame(step)
    }

    const scrollToSection = (index: number) => {
      if (index < 0 || index >= projects.length) return
      isScrollingRef.current = true
      currentIndexRef.current = index

      const targetY = index * window.innerHeight
      smoothScrollTo(targetY, 900)
    }

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 16) return
      e.preventDefault()

      if (isScrollingRef.current) return

      if (e.deltaY > 0) {
        if (currentIndexRef.current < projects.length - 1) {
          scrollToSection(currentIndexRef.current + 1)
        }
      } else {
        if (currentIndexRef.current > 0) {
          scrollToSection(currentIndexRef.current - 1)
        }
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScrollingRef.current) return
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        if (currentIndexRef.current < projects.length - 1) {
          scrollToSection(currentIndexRef.current + 1)
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        if (currentIndexRef.current > 0) {
          scrollToSection(currentIndexRef.current - 1)
        }
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) {
        touchStartY = e.touches[0].clientY
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrollingRef.current || !e.changedTouches[0]) return
      const touchEndY = e.changedTouches[0].clientY
      const deltaY = touchStartY - touchEndY

      if (Math.abs(deltaY) > 40) {
        if (deltaY > 0 && currentIndexRef.current < projects.length - 1) {
          scrollToSection(currentIndexRef.current + 1)
        } else if (deltaY < 0 && currentIndexRef.current > 0) {
          scrollToSection(currentIndexRef.current - 1)
        }
      }
    }

    const handleScroll = () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current)
      }
      animFrameIdRef.current = requestAnimationFrame(() => {
        updateDarkenCurtains()
        if (!isScrollingRef.current) {
          const currentPos = container.scrollTop
          const calculatedIndex = Math.round(currentPos / (window.innerHeight || 1))
          currentIndexRef.current = calculatedIndex
        }
      })
    }

    // İlk mount anında perdeyi hesapla
    updateDarkenCurtains()

    container.addEventListener('wheel', handleWheel, {passive: false})
    window.addEventListener('keydown', handleKeyDown)
    container.addEventListener('touchstart', handleTouchStart, {passive: true})
    container.addEventListener('touchend', handleTouchEnd, {passive: true})
    container.addEventListener('scroll', handleScroll, {passive: true})

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current)
      }
      if (scrollAnimRef.current !== null) {
        cancelAnimationFrame(scrollAnimRef.current)
      }
      container.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('scroll', handleScroll)
    }
  }, [projects.length])

  return (
    <div
      ref={containerRef}
      data-lenis-prevent
      className="h-screen w-full bg-black text-white selection:bg-white selection:text-black overflow-y-auto no-scrollbar"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {/* Full-width Section-by-Section Smooth Snapping Stream */}
      <main className="w-full flex flex-col gap-0 p-0 m-0">
        {projects.map((project, index) => {
          const title = toPlainText(t(project.title))
          const category = project.projectCategory ? toPlainText(t(project.projectCategory)) : ''
          const pObj = project as unknown as Record<string, unknown>
          const location = toPlainText(pObj['location'] ? t(pObj['location'] as never) : '')
          const pDate =
            typeof project.date === 'string'
              ? project.date
              : toPlainText(project.date ? t(project.date as never) : '')
          const year = typeof pDate === 'string' ? pDate.match(/\d{4}/)?.[0] || pDate : ''
          const excerpt = project.excerpt ? toPlainText(t(project.excerpt as never)) : ''
          const coverUrl =
            typeof project.cover === 'string' ? project.cover : project.cover?.url || ''

          return (
            <section
              key={project.id}
              id={`project-${project.id}`}
              data-project-index={index}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/projects/${project.id}`)}
              onKeyDown={e => {
                if (e.key === 'Enter') navigate(`/projects/${project.id}`)
              }}
              className="relative w-full h-screen min-h-screen flex flex-col justify-end overflow-hidden cursor-pointer select-none focus:outline-none"
              style={{willChange: 'transform'}}
            >
              {/* Full-Screen Natural Brightness Visual Background */}
              <div className="absolute inset-0 w-full h-full overflow-hidden bg-neutral-900 pointer-events-none">
                {coverUrl ? (
                  <div className="w-full h-full relative">
                    <OptimizedImage
                      src={coverUrl}
                      alt={title}
                      className="w-full h-full object-cover object-center"
                      quality={95}
                      loading={index < 2 ? 'eager' : 'lazy'}
                      crop={typeof project.cover === 'object' ? project.cover.crop : undefined}
                      hotspot={
                        typeof project.cover === 'object' ? project.cover.hotspot : undefined
                      }
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
                  </div>
                ) : (
                  <div className="w-full h-full bg-neutral-900" />
                )}

                {/* Soft, Transparent Lighter Gradient Overlays - Clear & Bright Visuals */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-85" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

                {/* 60FPS Dynamic Exit Darkening Curtain (Ekrandan dışarı çıktıkça yavaşça koyulaşan sinematik katman) */}
                <div
                  className="scroll-darken-curtain absolute inset-0 bg-black pointer-events-none will-change-[opacity]"
                  style={{opacity: 0, transition: 'opacity 0.1s ease-out'}}
                />
              </div>

              {/* Bottom Architectural Presentation (No Buttons, Pure Typography) */}
              <div className="relative z-10 w-full max-w-[96%] sm:max-w-[92%] lg:max-w-[88vw] mx-auto pb-14 sm:pb-20 pt-8 pointer-events-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end">
                  {/* Left Column: Big Typographic Title & Metadata Tagline (No Left Numbers) */}
                  <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                    <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white uppercase tracking-tight leading-[0.95] mb-3 drop-shadow-md font-oswald">
                      {title}
                    </h2>

                    <div className="flex items-center gap-3 text-xs sm:text-sm font-light tracking-[0.25em] text-white/80 uppercase">
                      {category && <span>{category}</span>}
                      {category && (year || location) && <span className="text-white/30">/</span>}
                      {location && <span>{location}</span>}
                      {location && year && <span className="text-white/30">/</span>}
                      {year && <span>{year}</span>}
                    </div>
                  </div>

                  {/* Right Column: Excerpt & Pure Typographic Text Link */}
                  <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-end bg-transparent p-0">
                    {excerpt ? (
                      <p className="text-xs sm:text-sm text-white/85 font-light leading-relaxed line-clamp-3 sm:line-clamp-4 mb-4 drop-shadow-sm font-mono">
                        {excerpt}
                      </p>
                    ) : null}

                    {/* Direct Text Link without box/button */}
                    <div className="inline-flex items-center gap-2.5 text-xs sm:text-sm uppercase tracking-[0.25em] font-medium text-white/90 hover:text-white w-fit font-mono">
                      <span>{isTr ? 'Projeyi İncele' : 'Explore Project'}</span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
