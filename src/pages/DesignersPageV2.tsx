import {useState, useRef, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {motion} from 'framer-motion'
import {ArrowRight, ChevronDown} from 'lucide-react'
import type {Designer, Product} from '../types'
import {useTranslation} from '../i18n'
import {useDesigners} from '../hooks/useDesigners'
import {useProducts} from '../hooks/useProducts'
import {useSiteSettings} from '../hooks/useSiteData'
import {useSEO} from '../hooks/useSEO'
import {useHeaderTheme} from '../context/HeaderThemeContext'
import {PageLoading} from '../components/LoadingSpinner'
import {OptimizedImage} from '../components/OptimizedImage'
import {SiteLogo} from '../components/SiteLogo'
import {isBirimDesignStudio} from '../utils/designerUtils'

export function DesignersPageV2() {
  const {data: designers = [], isLoading: loading} = useDesigners()
  const {data: products = []} = useProducts()
  const {data: settings} = useSiteSettings()
  const {t, locale} = useTranslation()
  const navigate = useNavigate()
  const {setBrightness, reset: resetHeaderTheme} = useHeaderTheme()

  const containerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const currentIndexRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollToSectionRef = useRef<(index: number) => void>(() => {})
  const scrollAnimRef = useRef<number | null>(null)

  // Header'ı şeffaf ve elemanlarını (logo, ikonlar, linkler) beyaz yap
  useEffect(() => {
    setBrightness(0)
    return () => {
      resetHeaderTheme()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('setHeaderVisibility', {detail: true}))
      }
    }
  }, [setBrightness, resetHeaderTheme])

  // SEO meta
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'
  useSEO({
    title: `BIRIM - ${t('designers') || 'Tasarımcılar'} | Editoryal Akış`,
    description:
      'BIRIM ile çalışan vizyoner tasarımcılar ve yaratıcı küratörler - Tam ekran editoryal deneyim.',
    type: 'profile',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'Designers',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${t('designers') || 'Tasarımcılar'} - Editoryal Akış`,
      description: 'BIRIM ile çalışan vizyoner tasarımcılar ve yaratıcı küratörler.',
      url: `${baseUrl}/#/designers?v=2`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: designers.length,
        itemListElement: designers.slice(0, 20).map((d, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: t(d.name),
          url: `${baseUrl}/#/designer/${d.id}`,
        })),
      },
    },
  })

  // Ultra-Smooth, Yavaşlatılmış ve Sinematik Bölüm Bölüm (Section by Section) Scroll Sistemi
  // + Ekrandan Çıkan Kartların Yavaşça Koyulaşması & Gelenlerin Açılarak Belirmesi
  useEffect(() => {
    const container = containerRef.current
    if (!container || designers.length === 0) return

    let isAnimating = false
    let lastScrollTime = 0
    const COOLDOWN_MS = 950
    let wheelDeltaAccumulator = 0
    let wheelTimer: ReturnType<typeof setTimeout> | null = null
    let touchStartY = 0
    let touchAccumulator = 0

    // 60FPS Dinamik Koyulaşma & Açılma Hesaplama (Gelen sayfalar hafif koyudan başlayıp açılarak gelir, çıkanlar yumuşakça kararır)
    const updateDarkenCurtains = () => {
      const viewHeight = container.clientHeight || window.innerHeight || 1
      const sections = container.querySelectorAll<HTMLElement>('[data-designer-index]')

      sections.forEach(section => {
        const rect = section.getBoundingClientRect()
        const distPastTop = -rect.top
        let darkenProgress = 0

        if (distPastTop > 0) {
          // Üstten ekrandan dışarı doğru çıkarken hafifçe koyulaşır (%0 -> %40)
          darkenProgress = Math.min(0.4, (distPastTop / viewHeight) * 0.45)
        } else if (rect.top > 0) {
          // Alttan ekrana doğru yaklaşırken yumuşakça açılarak gelir (%40 -> %0)
          const distRatio = Math.min(1, rect.top / viewHeight)
          darkenProgress = Math.min(0.4, distRatio * 0.4)
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
      if (index < 0 || index >= designers.length) return
      const isScrollingDown = index > currentIndexRef.current
      isAnimating = true
      isScrollingRef.current = true
      lastScrollTime = performance.now()
      currentIndexRef.current = index
      setActiveIndex(index)

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('setHeaderVisibility', {
            detail: !isScrollingDown || index === 0,
          })
        )
      }

      const targetSection = container.querySelector<HTMLElement>(`[data-designer-index="${index}"]`)
      const targetY = targetSection ? targetSection.offsetTop : index * container.clientHeight
      smoothScrollTo(targetY, 850)
    }

    scrollToSectionRef.current = scrollToSection

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
        if (currentIndexRef.current < designers.length - 1) {
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
        if (currentIndexRef.current < designers.length - 1) {
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
        if (currentIndexRef.current < designers.length - 1) {
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
        `[data-designer-index="${currentIndexRef.current}"]`
      )
      if (targetSection) {
        currentContainer.scrollTop = targetSection.offsetTop
      } else {
        currentContainer.scrollTop = currentIndexRef.current * currentContainer.clientHeight
      }
      updateDarkenCurtains()
    }

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
  }, [designers.length])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  const getImageUrl = (designer: Designer) => {
    return typeof designer.image === 'string' ? designer.image : designer.image?.url || ''
  }

  const getBioText = (bio: unknown) => {
    if (!bio) return ''
    const raw = bio as Record<string, unknown> | unknown[]
    let blocks: unknown[] | null = null
    if (Array.isArray(raw)) {
      blocks = raw
    } else if (raw && typeof raw === 'object') {
      const localizedMap = raw as Record<string, unknown[]>
      if (Array.isArray(localizedMap[locale])) {
        blocks = localizedMap[locale]
      } else if (Array.isArray(localizedMap['tr'])) {
        blocks = localizedMap['tr']
      } else if (Array.isArray(localizedMap['en'])) {
        blocks = localizedMap['en']
      }
    }

    if (blocks && Array.isArray(blocks) && blocks.length > 0) {
      return blocks
        .map((b: unknown) => {
          if (b && typeof b === 'object' && (b as {children?: unknown[]}).children) {
            return ((b as {children: {text?: string}[]}).children || [])
              .map(c => c.text || '')
              .join('')
              .trim()
          }
          return ''
        })
        .filter(Boolean)
        .join('\n')
    }

    const bioVal = t(bio as Parameters<typeof t>[0])
    if (typeof bioVal === 'string') return bioVal.trim()
    return ''
  }

  const getDesignerProducts = (designerId: string): Product[] => {
    return products.filter(
      p =>
        p.designerId === designerId ||
        (Array.isArray(p.designerIds) && p.designerIds.includes(designerId))
    )
  }

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
        {designers.map((designer, index) => {
          const isBirimStudio = isBirimDesignStudio(designer) || Boolean(designer.isCompanyLogo)
          const designerProducts = getDesignerProducts(designer.id)
          const bioExcerpt =
            getBioText(designer.bio) ||
            (isBirimStudio
              ? t('birim_studio_bio_short') ||
                "Birim'in yenilikçi ve zamansız tasarım vizyonunu yansıtan iç tasarım stüdyosu."
              : '')

          return (
            <section
              key={designer.id}
              id={`designer-${designer.id}`}
              data-designer-index={index}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/designer/${designer.id}`)}
              onKeyDown={e => {
                if (e.key === 'Enter') navigate(`/designer/${designer.id}`)
              }}
              className="relative w-full h-screen h-[100dvh] min-h-[100dvh] max-h-[100dvh] flex-shrink-0 flex flex-col justify-end overflow-hidden cursor-pointer select-none focus:outline-none"
              style={{willChange: 'transform'}}
            >
              {/* Full-Screen Luminous Black & White Visual Background */}
              <div className="absolute inset-0 w-full h-full overflow-hidden bg-neutral-900 pointer-events-none">
                {isBirimStudio ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 sm:p-16 relative bg-neutral-900">
                    <div className="relative z-10 w-full max-w-lg sm:max-w-2xl flex flex-col items-center justify-center text-center">
                      <SiteLogo
                        logoUrl={settings?.logoUrl}
                        className="w-full max-w-[300px] sm:max-w-[420px] h-auto object-contain brightness-110 grayscale mb-6"
                      />
                      <p className="text-xs sm:text-sm font-light tracking-[0.4em] text-white/70 uppercase">
                        {t('design_studio') || 'Tasarım Stüdyosu'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    <OptimizedImage
                      alt={t(designer.name)}
                      className="w-full h-full object-cover object-center grayscale contrast-[0.96] brightness-[1.08]"
                      src={getImageUrl(designer)}
                      srcMobile={
                        typeof designer.image === 'object' ? designer.image.urlMobile : undefined
                      }
                      srcDesktop={
                        typeof designer.image === 'object' ? designer.image.urlDesktop : undefined
                      }
                      crop={typeof designer.image === 'object' ? designer.image.crop : undefined}
                      hotspot={
                        typeof designer.image === 'object' ? designer.image.hotspot : undefined
                      }
                      origWidth={
                        typeof designer.image === 'object' ? designer.image.origWidth : undefined
                      }
                      origHeight={
                        typeof designer.image === 'object' ? designer.image.origHeight : undefined
                      }
                      cropMobile={
                        typeof designer.image === 'object' ? designer.image.cropMobile : undefined
                      }
                      hotspotMobile={
                        typeof designer.image === 'object'
                          ? designer.image.hotspotMobile
                          : undefined
                      }
                      origWidthMobile={
                        typeof designer.image === 'object'
                          ? designer.image.origWidthMobile
                          : undefined
                      }
                      origHeightMobile={
                        typeof designer.image === 'object'
                          ? designer.image.origHeightMobile
                          : undefined
                      }
                      cropDesktop={
                        typeof designer.image === 'object' ? designer.image.cropDesktop : undefined
                      }
                      hotspotDesktop={
                        typeof designer.image === 'object'
                          ? designer.image.hotspotDesktop
                          : undefined
                      }
                      origWidthDesktop={
                        typeof designer.image === 'object'
                          ? designer.image.origWidthDesktop
                          : undefined
                      }
                      origHeightDesktop={
                        typeof designer.image === 'object'
                          ? designer.image.origHeightDesktop
                          : undefined
                      }
                    />
                  </div>
                )}
                {!isBirimStudio && (
                  <>
                    {/* Subtle, balanced gradients */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />
                  </>
                )}

                {/* 60FPS Dynamic Exit Darkening Curtain (Ekrandan dışarı çıktıkça yavaşça koyulaşan sinematik katman) */}
                <div
                  className="scroll-darken-curtain absolute inset-0 bg-black pointer-events-none will-change-[opacity]"
                  style={{opacity: 0, transition: 'opacity 0.1s ease-out'}}
                />
              </div>

              {/* Bottom Architectural Presentation & Transparent Info Panel */}
              <div className="relative z-10 w-full max-w-[96%] sm:max-w-[92%] lg:max-w-[88vw] mx-auto pb-14 sm:pb-20 pt-8 pointer-events-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end">
                  {/* Left Column: Big Typographic Title & Tagline */}
                  <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                    <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white uppercase tracking-tight leading-[0.95] mb-3 drop-shadow-md">
                      {t(designer.name)}
                    </h2>

                    {designer.role && (
                      <p className="text-xs sm:text-sm font-light tracking-[0.25em] text-white/80 uppercase">
                        {t(designer.role)}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Transparent Floating Info Panel */}
                  <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-end bg-transparent p-0">
                    {bioExcerpt ? (
                      <p className="text-xs sm:text-sm text-white/85 font-light leading-relaxed line-clamp-3 sm:line-clamp-4 mb-4 drop-shadow-sm">
                        {bioExcerpt}
                      </p>
                    ) : null}

                    {/* Designer's Products - Direct Transparent Inline Typography without prefix */}
                    {designerProducts.length > 0 && (
                      <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-light tracking-wider uppercase text-white/85">
                        {designerProducts.slice(0, 4).map((p, pIdx) => (
                          <span key={p.id} className="text-white/95">
                            {t(p.name)}
                            {pIdx < Math.min(designerProducts.length, 4) - 1 ? (
                              <span className="text-white/35 ml-2">/</span>
                            ) : null}
                          </span>
                        ))}
                        {designerProducts.length > 4 && (
                          <span className="text-white/50 text-[10px] font-mono ml-1">
                            +{designerProducts.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* CTA Button without underline */}
                    <div className="inline-flex items-center gap-2.5 text-xs sm:text-sm uppercase tracking-[0.25em] font-medium text-white/90 hover:text-white w-fit">
                      <span>{t('explore_designer') || 'Tasarımcıyı Keşfet'}</span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </main>

      {/* Right-Side Dynamic Editorial Micro-Index (Konsept 2) */}
      {designers.length > 1 && (
        <aside
          aria-label={t('designers') || 'Tasarımcılar'}
          className="hidden md:block group/index fixed right-2 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-30 pointer-events-auto select-none p-3 -mr-3"
        >
          <div className="relative flex items-center justify-end">
            {/* Ambient Collapsed State (Ultra-minimalist vertical dash bar) */}
            <div className="flex flex-col items-center gap-1.5 py-2.5 px-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.3)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/index:opacity-0 group-hover/index:scale-90 group-hover/index:pointer-events-none">
              {designers.map((d, idx) => {
                const isActive = activeIndex === idx
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      scrollToSectionRef.current(idx)
                    }}
                    className="flex items-center justify-center p-0.5 focus:outline-none cursor-pointer"
                    aria-label={`${t(d.name)} (${idx + 1}/${designers.length})`}
                  >
                    <span
                      className={`block rounded-full transition-all duration-500 ${
                        isActive
                          ? 'w-[2px] h-5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]'
                          : 'w-[2px] h-1.5 bg-white/40'
                      }`}
                    />
                  </button>
                )
              })}
            </div>

            {/* Expanded Editorial Index (Daha şeffaf, yumuşak süzülen panel) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 min-w-[210px] sm:min-w-[240px] max-h-[80vh] overflow-y-auto py-2.5 px-2.5 rounded-xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] antialiased opacity-0 translate-x-4 scale-95 pointer-events-none origin-right transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/index:opacity-100 group-hover/index:translate-x-0 group-hover/index:scale-100 group-hover/index:pointer-events-auto">
              <div className="flex flex-col gap-0.5">
                {designers.map((d, idx) => {
                  const isActive = activeIndex === idx
                  return (
                    <button
                      key={`expanded-${d.id}`}
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        scrollToSectionRef.current(idx)
                      }}
                      className={`group/item flex items-center justify-between py-1.5 px-2.5 rounded-lg text-left transition-colors duration-150 cursor-pointer focus:outline-none ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center min-w-0 pr-2">
                        <span
                          className={`text-xs uppercase tracking-wider truncate ${
                            isActive ? 'text-white font-medium' : 'font-normal'
                          }`}
                        >
                          {t(d.name)}
                        </span>
                      </div>

                      <span
                        className={`block rounded-full transition-all duration-200 flex-shrink-0 ${
                          isActive
                            ? 'w-1.5 h-1.5 bg-white shadow-[0_0_6px_rgba(255,255,255,1)]'
                            : 'w-1 h-1 bg-transparent group-hover/item:bg-white/60'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Bottom Scroll Down Hint with Animated Arrow */}
      {designers.length > 1 && (
        <button
          type="button"
          onClick={() => {
            if (activeIndex < designers.length - 1) {
              scrollToSectionRef.current(activeIndex + 1)
            }
          }}
          className={`fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center text-white/80 hover:text-white transition-all duration-500 cursor-pointer focus:outline-none group p-1.5 ${
            activeIndex === designers.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          aria-label={t('scroll_down') || 'Aşağı Kaydır'}
        >
          <motion.div
            animate={{y: [0, 4, 0]}}
            transition={{duration: 1.5, repeat: Infinity, ease: 'easeInOut'}}
            className="p-1 rounded-full bg-black/30 border border-white/15 backdrop-blur-md group-hover:border-white/40 group-hover:bg-black/50 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
          >
            <ChevronDown className="w-3.5 h-3.5 text-white" />
          </motion.div>
        </button>
      )}
    </div>
  )
}

export default DesignersPageV2
