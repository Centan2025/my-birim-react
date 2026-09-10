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
  const scrollAnimRef = useRef<number | null>(null)

  // Header'ı şeffaf ve elemanlarını (logo, linkler, ikonlar) beyaz yap
  useEffect(() => {
    setBrightness(0)
    return () => {
      resetHeaderTheme()
    }
  }, [setBrightness, resetHeaderTheme])

  // Ultra-Smooth, Yavaşlatılmış ve Sinematik Bölüm Bölüm (Section by Section) Scroll Sistemi
  // Ultra-Smooth, Yavaşlatılmış ve Sinematik Bölüm Bölüm (Section by Section) Scroll Sistemi
  // + Ekrandan Çıkan Projelerin Yavaşça Koyulaşması & Gelenlerin Açılarak Belirmesi
  useEffect(() => {
    const container = containerRef.current
    if (!container || projects.length === 0) return

    let isAnimating = false
    let lastScrollTime = 0
    const COOLDOWN_MS = 950
    let wheelDeltaAccumulator = 0
    let wheelTimer: ReturnType<typeof setTimeout> | null = null
    let touchStartY = 0
    let touchAccumulator = 0

    // 60FPS Dinamik Koyulaşma & Açılma Hesaplama (Gelen sayfalar koyudan başlayıp açılarak gelir, çıkanlar kararır)
    const updateDarkenCurtains = () => {
      const viewHeight = container.clientHeight || window.innerHeight || 1
      const sections = container.querySelectorAll<HTMLElement>('[data-project-index]')

      sections.forEach(section => {
        const rect = section.getBoundingClientRect()
        const distPastTop = -rect.top
        let darkenProgress = 0

        if (distPastTop > 0) {
          // Üstten ekrandan dışarı doğru çıkarken kademeli olarak koyulaşır (%0 -> %90)
          darkenProgress = Math.min(0.9, (distPastTop / viewHeight) * 0.95)
        } else if (rect.top > 0) {
          // Alttan ekrana doğru yaklaşırken koyudan başlayıp açılarak gelir (%90 -> %0)
          const distRatio = Math.min(1, rect.top / viewHeight)
          darkenProgress = Math.min(0.9, distRatio * 0.9)
        } else {
          darkenProgress = 0
        }

        const curtain = section.querySelector('.scroll-darken-curtain') as HTMLElement | null
        if (curtain) {
          curtain.style.opacity = `${darkenProgress.toFixed(3)}`
        }
      })
    }

    // Özel 850ms İpeksi & Dengeli Easing Interpolasyonu (Cinematic Smooth Transition)
    const smoothScrollTo = (targetY: number, duration = 850) => {
      const currentContainer = containerRef.current
      if (!currentContainer) return

      const startY = currentContainer.scrollTop
      const distance = targetY - startY
      if (Math.abs(distance) < 2) {
        currentContainer.scrollTop = targetY
        isAnimating = false
        isScrollingRef.current = false
        updateDarkenCurtains()
        return
      }

      if (scrollAnimRef.current !== null) {
        cancelAnimationFrame(scrollAnimRef.current)
      }

      const startTime = performance.now()

      // Akıcı cubic ease-in-out eğrisi
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
          updateDarkenCurtains()
          setTimeout(() => {
            isAnimating = false
            isScrollingRef.current = false
          }, 120)
        }
      }

      scrollAnimRef.current = requestAnimationFrame(step)
    }

    const scrollToSection = (index: number) => {
      if (index < 0 || index >= projects.length) return
      isAnimating = true
      isScrollingRef.current = true
      lastScrollTime = performance.now()
      currentIndexRef.current = index

      const targetSection = container.querySelector<HTMLElement>(`[data-project-index="${index}"]`)
      const targetY = targetSection ? targetSection.offsetTop : index * container.clientHeight
      smoothScrollTo(targetY, 850)
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const now = performance.now()
      if (isAnimating || isScrollingRef.current || now - lastScrollTime < COOLDOWN_MS) {
        wheelDeltaAccumulator = 0
        return
      }

      wheelDeltaAccumulator += e.deltaY

      if (wheelTimer) clearTimeout(wheelTimer)
      wheelTimer = setTimeout(() => {
        wheelDeltaAccumulator = 0
      }, 100)

      const INTENT_THRESHOLD = 30

      if (wheelDeltaAccumulator >= INTENT_THRESHOLD) {
        if (currentIndexRef.current < projects.length - 1) {
          wheelDeltaAccumulator = 0
          scrollToSection(currentIndexRef.current + 1)
        }
      } else if (wheelDeltaAccumulator <= -INTENT_THRESHOLD) {
        if (currentIndexRef.current > 0) {
          wheelDeltaAccumulator = 0
          scrollToSection(currentIndexRef.current - 1)
        }
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = performance.now()
      if (isAnimating || isScrollingRef.current || now - lastScrollTime < COOLDOWN_MS) return

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
        touchAccumulator = 0
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        touchAccumulator = touchStartY - e.touches[0].clientY
      }
    }

    const handleTouchEnd = () => {
      const now = performance.now()
      if (isAnimating || isScrollingRef.current || now - lastScrollTime < COOLDOWN_MS) return

      const TOUCH_THRESHOLD = 45
      if (touchAccumulator >= TOUCH_THRESHOLD) {
        if (currentIndexRef.current < projects.length - 1) {
          scrollToSection(currentIndexRef.current + 1)
        }
      } else if (touchAccumulator <= -TOUCH_THRESHOLD) {
        if (currentIndexRef.current > 0) {
          scrollToSection(currentIndexRef.current - 1)
        }
      }
      touchAccumulator = 0
    }

    const handleResize = () => {
      const currentContainer = containerRef.current
      if (!currentContainer) return
      const targetSection = currentContainer.querySelector<HTMLElement>(
        `[data-project-index="${currentIndexRef.current}"]`
      )
      if (targetSection) {
        currentContainer.scrollTop = targetSection.offsetTop
      } else {
        currentContainer.scrollTop = currentIndexRef.current * currentContainer.clientHeight
      }
      updateDarkenCurtains()
    }

    // İlk mount anında perdeyi hesapla
    updateDarkenCurtains()

    window.addEventListener('wheel', handleWheel, {passive: false})
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('touchstart', handleTouchStart, {passive: true})
    window.addEventListener('touchmove', handleTouchMove, {passive: true})
    window.addEventListener('touchend', handleTouchEnd, {passive: true})
    window.addEventListener('resize', handleResize)

    return () => {
      if (scrollAnimRef.current !== null) {
        cancelAnimationFrame(scrollAnimRef.current)
      }
      if (wheelTimer) clearTimeout(wheelTimer)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('resize', handleResize)
    }
  }, [projects.length])

  return (
    <div
      ref={containerRef}
      data-lenis-prevent
      className="h-screen h-[100dvh] w-full bg-black text-white selection:bg-white selection:text-black overflow-hidden select-none touch-none"
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
              className="relative w-full h-screen h-[100dvh] min-h-[100dvh] max-h-[100dvh] flex-shrink-0 flex flex-col justify-end overflow-hidden cursor-pointer select-none focus:outline-none"
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

                {/* Subtle Cinematic Gradient: Yukarısı daha koyu, aşağısı daha açık */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-75 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />

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
