import {useRef, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {ArrowRight} from 'lucide-react'
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
  const scrollAnimRef = useRef<number | null>(null)

  // Header'ı şeffaf ve elemanlarını (logo, ikonlar, linkler) beyaz yap
  useEffect(() => {
    setBrightness(0)
    return () => {
      resetHeaderTheme()
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

    // 60FPS Dinamik Koyulaşma & Açılma Hesaplama (Gelen sayfalar koyudan başlayıp açılarak gelir, çıkanlar kararır)
    const updateDarkenCurtains = () => {
      const viewHeight = container.clientHeight || window.innerHeight || 1
      const sections = container.querySelectorAll<HTMLElement>('[data-designer-index]')

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
      if (index < 0 || index >= designers.length) return
      isAnimating = true
      isScrollingRef.current = true
      lastScrollTime = performance.now()
      currentIndexRef.current = index

      const targetSection = container.querySelector<HTMLElement>(`[data-designer-index="${index}"]`)
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
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 sm:p-16 relative bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900">
                    {/* Architectural Ambient Radiant Grid */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.12] via-transparent to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

                    <div className="relative z-10 w-full max-w-md sm:max-w-xl flex flex-col items-center justify-center text-center">
                      <SiteLogo
                        logoUrl={settings?.logoUrl}
                        className="w-full max-w-[240px] sm:max-w-[320px] h-auto object-contain brightness-110 grayscale mb-6 drop-shadow-[0_20px_50px_rgba(255,255,255,0.15)]"
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
                      className="w-full h-full object-cover object-center grayscale contrast-[1.04] brightness-[1.04]"
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
    </div>
  )
}

export default DesignersPageV2
