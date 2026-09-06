import React, {useState, useEffect, useMemo} from 'react'
import {useTranslation} from '../i18n'
import {useSiteSettings} from '../hooks/useSiteData'
import {useHomePageContent} from '../hooks/useHomePage'
import {Link} from 'react-router-dom'
import {HomeHero} from '../components/HomeHero'
import {useSEO} from '../hooks/useSEO'
import {HomeContentBlocks} from '../components/HomeContentBlocks'
import {useHeaderTheme} from '../context/HeaderThemeContext'

export function HomePage() {
  const {data: content} = useHomePageContent()
  const {data: settings} = useSiteSettings()
  const {setBrightness, reset} = useHeaderTheme()

  useEffect(() => {
    // HomePage has a dark hero slider banner (HomeHero).
    // Set brightness to 0 so header logo & text always remain clean white at the top of the page.
    setBrightness(0)
    return () => reset()
  }, [setBrightness, reset])
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return false
  })
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.clientWidth || window.innerWidth
    }
    return 0
  })
  const {t, locale} = useTranslation()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'

  // SEO
  const seoData = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = settings as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socialLinks = s?.socialLinks?.map((link: any) => link?.url).filter(Boolean) || [
      'https://www.instagram.com/birim',
      'https://www.linkedin.com/company/birim',
    ]

    return {
      title: t('home_meta_title') || 'BIRIM - Ana Sayfa',
      description: t('home_meta_description') || 'BIRIM - Modern tasarım ve mimari çözümler',
      image: content?.heroMedia?.[0]?.url || undefined,
      type: 'website' as const,
      siteName: 'BIRIM',
      locale: 'tr_TR',
      schema: [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          '@id': `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/#organization`,
          name: 'BIRIM',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com',
          logo: {
            '@type': 'ImageObject',
            url:
              typeof window !== 'undefined'
                ? `${window.location.origin}/logo.png`
                : 'https://www.birim.com/logo.png',
            width: '180',
            height: '60',
          },
          image:
            typeof window !== 'undefined'
              ? `${window.location.origin}/logo.png`
              : 'https://www.birim.com/logo.png',
          description: t('home_meta_description') || 'BIRIM - Modern tasarım ve mimari çözümler',
          sameAs: socialLinks,
          contactPoint: {
            '@type': 'ContactPoint',
            email: s?.contactEmail || 'info@birim.com',
            telephone: s?.contactPhone || '+90 216 123 45 67',
            contactType: 'customer service',
            areaServed: 'TR',
            availableLanguage: ['Turkish', 'English'],
          },
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Modern Sanat Sokak No:12',
            addressLocality: 'Istanbul',
            addressRegion: 'Istanbul',
            postalCode: '34000',
            addressCountry: 'TR',
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          '@id': `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/#website`,
          name: 'BIRIM',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com',
          description: t('home_meta_description') || 'BIRIM - Modern tasarım ve mimari çözümler',
          publisher: {
            '@id': `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/#organization`,
          },
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/#/products?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
          inLanguage: 'tr-TR',
        },
      ],
    }
  }, [content?.heroMedia, t, settings])

  useSEO(seoData)

  const [mobileHeroHeight, setMobileHeroHeight] = useState<number | null>(null)
  const lastWidthRef = React.useRef(typeof window !== 'undefined' ? window.innerWidth : 0)

  // Header temasını sıfırla (HomeHero bg-black/50 overlay içerdiği için hero her zaman koyudur)
  useEffect(() => {
    reset()
    return () => reset()
  }, [reset])

  // İlham görselinin yüksekliğini hesapla
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      const vw = document.documentElement.clientWidth || window.innerWidth
      const currentWidth = window.innerWidth

      setIsMobile(mobile)
      setViewportWidth(vw)

      if (mobile) {
        if (Math.abs(currentWidth - lastWidthRef.current) > 1 || !mobileHeroHeight) {
          setMobileHeroHeight(window.innerHeight)
          lastWidthRef.current = currentWidth
        }
      } else {
        setMobileHeroHeight(null)
      }
    }

    if (typeof window !== 'undefined' && !mobileHeroHeight) {
      setMobileHeroHeight(window.innerHeight)
    }
    checkMobile()

    let resizeTimeout: ReturnType<typeof setTimeout> | null = null
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        checkMobile()
      }, 150)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeout) clearTimeout(resizeTimeout)
    }
  }, [isMobile, viewportWidth, mobileHeroHeight])

  // Desktop Home Page Section Snap & Smooth Navigation Controller
  useEffect(() => {
    if (isMobile) return

    let isSnapping = false
    let lastSnapTime = 0
    let accumulatedDelta = 0
    let resetTimer: ReturnType<typeof setTimeout> | null = null
    let safetyUnlockTimer: ReturnType<typeof setTimeout> | null = null
    const INTENTIONAL_THRESHOLD = 50 // Belirgin kaydırmada tetikle
    const COOLDOWN_MS = 400 // Kısa ve akıcı geçiş süresi

    const snapTo = (targetY: number) => {
      isSnapping = true
      lastSnapTime = Date.now()

      const unlock = () => {
        isSnapping = false
        if (safetyUnlockTimer) {
          clearTimeout(safetyUnlockTimer)
          safetyUnlockTimer = null
        }
      }

      if (safetyUnlockTimer) clearTimeout(safetyUnlockTimer)
      safetyUnlockTimer = setTimeout(unlock, 600)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any
      if (win.lenis && typeof win.lenis.scrollTo === 'function') {
        win.lenis.scrollTo(targetY, {
          offset: 0,
          duration: 0.6,
          lock: false,
          easing: (t: number) => 1 - Math.pow(1 - t, 3),
          onComplete: unlock,
        })
      } else {
        window.scrollTo({
          top: targetY,
          behavior: 'smooth',
        })
        setTimeout(unlock, 500)
      }
    }

    const handleWheel = (e: WheelEvent) => {
      // Yatay kaydırma, Ctrl+zoom es geç
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.ctrlKey) return

      // Dialog, input veya menü içi etkileşimlerde es geç
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('input, textarea, select, [role="dialog"], .no-scroll-snap')
      ) {
        return
      }

      const now = Date.now()
      if (isSnapping || now - lastSnapTime < COOLDOWN_MS) {
        return
      }

      // Mikro titreşimleri yoksay
      if (Math.abs(e.deltaY) < 15) return

      accumulatedDelta += e.deltaY

      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(() => {
        accumulatedDelta = 0
      }, 120)

      if (Math.abs(accumulatedDelta) < INTENTIONAL_THRESHOLD) {
        return
      }

      const direction = accumulatedDelta > 0 ? 'down' : 'up'
      accumulatedDelta = 0

      const winHeight = window.innerHeight
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight

      const heroElem = document.getElementById('home-hero-section')
      const heroHeight = heroElem ? heroElem.offsetHeight : winHeight

      // Yukarı kaydırırken Hero bölgesine yakınsak DOĞRUDAN Hero'ya git (0)
      if (direction === 'up') {
        if (scrollY <= 10) return
        if (scrollY <= heroHeight + 120) {
          snapTo(0)
          return
        }
      }

      // En altta footer'a doğru serbest doğal geçiş
      if (direction === 'down' && winHeight + scrollY >= docHeight - 60) {
        return
      }

      // Hero ve içerik bloklarını hedefler olarak al
      const blockElems = Array.from(
        document.querySelectorAll<HTMLElement>('.home-content-block-snap')
      ).filter(el => el && el.offsetHeight > 0)

      const targets: HTMLElement[] = []
      if (heroElem) targets.push(heroElem)
      targets.push(...blockElems)

      if (targets.length === 0) return

      // Viewport merkezine göre aktif bloğu bul
      const viewportCenter = scrollY + winHeight * 0.45
      let currentIndex = 0
      let closestDist = Infinity

      for (let i = 0; i < targets.length; i++) {
        const el = targets[i]
        if (!el) continue
        const top = el.offsetTop
        const height = el.offsetHeight

        if (viewportCenter >= top && viewportCenter <= top + height) {
          currentIndex = i
          break
        }
        const dist = Math.abs(top - scrollY)
        if (dist < closestDist) {
          closestDist = dist
          currentIndex = i
        }
      }

      const currentElem = targets[currentIndex]
      if (!currentElem) return
      const currentRect = currentElem.getBoundingClientRect()

      let targetScrollY: number | null = null

      if (direction === 'down') {
        const remainingBelow = currentRect.bottom - winHeight

        // Eğer mevcut bölüm ekrandan uzunsa ve altı henüz ekranda değilse kalan kısmı göster
        if (remainingBelow > 40) {
          const step = Math.min(remainingBelow, winHeight * 0.8)
          targetScrollY = scrollY + step
        } else if (currentIndex < targets.length - 1) {
          const nextElem = targets[currentIndex + 1]
          if (nextElem) {
            targetScrollY = scrollY + nextElem.getBoundingClientRect().top
          }
        }
      } else {
        // direction === 'up'
        const hiddenAbove = -currentRect.top

        // Eğer bu bölümün üst kısmı ekranın yukarısında kalmışsa önce orayı göster
        if (hiddenAbove > 40) {
          const step = Math.min(hiddenAbove, winHeight * 0.8)
          targetScrollY = scrollY - step
        } else if (currentIndex > 0) {
          const prevElem = targets[currentIndex - 1]
          if (currentIndex - 1 === 0) {
            // Önceki hedef Hero ise doğrudan en tepeye git
            targetScrollY = 0
          } else if (prevElem) {
            const prevRect = prevElem.getBoundingClientRect()
            if (prevRect.height > winHeight) {
              targetScrollY = scrollY + prevRect.bottom - winHeight
            } else {
              targetScrollY = scrollY + prevRect.top
            }
          }
        } else {
          targetScrollY = 0
        }
      }

      if (targetScrollY !== null && Math.abs(targetScrollY - scrollY) > 15) {
        snapTo(targetScrollY)
      }
    }

    window.addEventListener('wheel', handleWheel, {passive: true})

    return () => {
      window.removeEventListener('wheel', handleWheel)
      if (resetTimer) clearTimeout(resetTimer)
      if (safetyUnlockTimer) clearTimeout(safetyUnlockTimer)
    }
  }, [isMobile])

  // Content blocks use natural fluid height without artificial 100vh height gaps

  if (!content || !settings) {
    return <div className="h-screen w-full bg-gray-900" />
  }

  const heroMedia = Array.isArray(content.heroMedia) ? content.heroMedia : []

  return (
    <div
      className={`bg-[var(--bg-primary)] text-[var(--text-primary)] ${isMobile ? 'hero-page-container-mobile' : ''}`}
      style={
        isMobile && viewportWidth > 0
          ? {
              width: `${viewportWidth}px`,
              maxWidth: `${viewportWidth}px`,
              overflowX: 'hidden',
              margin: 0,
              padding: 0,
              left: 0,
              right: 0,
            }
          : {}
      }
    >
      {/* Hero Section */}
      {heroMedia.length > 0 ? (
        <>
          <style>{`
            .hero-scroll-container::-webkit-scrollbar {
              display: none;
            }
            @media (min-width: 1024px) {
              .hero-page-container-mobile {
                width: 100% !important;
                max-width: 100% !important;
                overflow: hidden !important;
              }
              .hero-scroll-container {
                width: auto !important;
                min-width: auto !important;
                max-width: none !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                position: relative !important;
                display: flex !important;
                flex-wrap: nowrap !important;
              }
              .hero-slide-mobile,
              .hero-scroll-container > div {
                height: 100% !important;
                margin-left: 0 !important;
                padding-left: 0 !important;
                flex-shrink: 0 !important;
                flex-grow: 0 !important;
              }
              .hero-slide-mobile video,
              .hero-slide-mobile img,
              .hero-scroll-container video,
              .hero-scroll-container img,
              .hero-slide-mobile iframe,
              .hero-scroll-container iframe {
                width: 100% !important;
                max-width: 100% !important;
                min-width: 100% !important;
                height: 100% !important;
                min-height: 100% !important;
                object-fit: cover !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                transform: none !important;
                border: none !important;
              }
            }
            @media (max-width: 1023px) {
              .hero-page-container-mobile {
                width: 100% !important;
                max-width: 100% !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                overflow-x: hidden !important;
                box-sizing: border-box !important;
                position: relative !important;
                left: 0 !important;
                right: 0 !important;
              }
              .hero-page-container-mobile > div:first-child,
              .hero-page-container-mobile > div:first-child[class*="relative"],
              .hero-container-mobile {
                height: ${mobileHeroHeight ? `${mobileHeroHeight}px` : '100vh'} !important;
                min-height: ${mobileHeroHeight ? `${mobileHeroHeight}px` : '100vh'} !important;
                max-height: ${mobileHeroHeight ? `${mobileHeroHeight}px` : '100vh'} !important;
              }
              .hero-main-container-mobile {
                width: 100% !important;
                max-width: 100% !important;
                min-width: 100% !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding: 0 !important;
                overflow-x: auto !important;
                overflow-y: hidden !important;
                box-sizing: border-box !important;
                position: relative !important;
                left: 0 !important;
                right: 0 !important;
                scroll-snap-type: x mandatory !important;
                scroll-padding: 0 !important;
                scroll-behavior: auto !important;
                -webkit-overflow-scrolling: touch !important;
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
                overscroll-behavior-x: contain !important;
              }
              .hero-main-container-mobile::-webkit-scrollbar {
                display: none !important;
              }
              .hero-scroll-container {
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                overflow-x: visible !important;
                overflow-y: hidden !important;
                box-sizing: border-box !important;
                position: relative !important;
                display: flex !important;
                flex-wrap: nowrap !important;
                scroll-snap-type: none !important;
                will-change: transform !important;
              }
              .hero-slide-mobile,
              .hero-slide-mobile[style] {
                height: ${mobileHeroHeight ? `${mobileHeroHeight}px` : '100vh'} !important;
                min-height: ${mobileHeroHeight ? `${mobileHeroHeight}px` : '100vh'} !important;
                max-height: ${mobileHeroHeight ? `${mobileHeroHeight}px` : '100vh'} !important;
                flex-shrink: 0 !important;
                flex-grow: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: hidden !important;
                position: relative !important;
                box-sizing: border-box !important;
                left: 0 !important;
                right: 0 !important;
                scroll-snap-align: start !important;
                scroll-snap-stop: always !important;
                scroll-margin: 0 !important;
              }
              .hero-slide-mobile video,
              .hero-slide-mobile video[style],
              .hero-slide-mobile video.w-full,
              .hero-slide-mobile video.h-full,
              .hero-video-mobile,
              .hero-video-mobile[style],
              video.hero-video-mobile,
              video.hero-video-mobile[style],
              video.w-full.hero-video-mobile,
              video.h-full.hero-video-mobile,
              .hero-slide-mobile > video,
              .hero-slide-mobile > video[style],
              .hero-slide-mobile video.w-full.h-full,
              .hero-slide-mobile video.object-contain,
              .hero-slide-mobile video.absolute,
              .hero-slide-mobile video.inset-0 {
                display: block !important;
                width: 100% !important;
                min-width: 100% !important;
                max-width: 100% !important;
                height: ${mobileHeroHeight ? `${mobileHeroHeight}px` : '100vh'} !important;
                min-height: ${mobileHeroHeight ? `${mobileHeroHeight}px` : '100vh'} !important;
                max-height: ${mobileHeroHeight ? `${mobileHeroHeight}px` : '100vh'} !important;
                left: 0 !important;
                right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                object-fit: cover !important;
                object-position: center !important;
                position: absolute !important;
                top: 0 !important;
                transform: none !important;
                box-sizing: border-box !important;
              }
              .hero-slide-mobile video.w-full {
                width: 100% !important;
              }
              .hero-slide-mobile .w-full {
                width: 100% !important;
              }
              .hero-slide-mobile img,
              .hero-slide-mobile img[style] {
                width: 100% !important;
                min-width: 100% !important;
                max-width: 100% !important;
                height: ${mobileHeroHeight ? `${mobileHeroHeight}px` : '100vh'} !important;
                min-height: ${mobileHeroHeight ? `${mobileHeroHeight}px` : '100vh'} !important;
                max-height: ${mobileHeroHeight ? `${mobileHeroHeight}px` : '100vh'} !important;
                left: 0 !important;
                right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                object-fit: cover !important;
                object-position: center !important;
                position: absolute !important;
                top: 0 !important;
                transform: none !important;
                box-sizing: border-box !important;
              }
              .hero-slide-mobile > div[class*="absolute"][class*="bg-black"] {
                width: 100% !important;
                max-width: 100% !important;
                left: 0 !important;
                right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                position: absolute !important;
                top: 0 !important;
                bottom: 0 !important;
              }
              .hero-slide-mobile iframe,
              .hero-slide-mobile iframe[style] {
                width: 100% !important;
                max-width: 100% !important;
                min-width: 100% !important;
                height: ${mobileHeroHeight ? `${mobileHeroHeight}px` : '100vh'} !important;
                min-height: ${mobileHeroHeight ? `${mobileHeroHeight}px` : '100vh'} !important;
                left: 0 !important;
                right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                position: absolute !important;
                top: 0 !important;
                bottom: 0 !important;
                transform: none !important;
                box-sizing: border-box !important;
              }
              .home-content-block-snap,
              .content-block-wrapper {
                min-height: 0 !important;
                height: auto !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
                margin-top: 0 !important;
                margin-bottom: 0 !important;
              }
            }
          `}</style>
          <div id="home-hero-section" className="scroll-snap-start">
            <HomeHero content={content} settings={settings} />
          </div>
        </>
      ) : (
        <div className="relative h-[50vh] w-full bg-gray-900" />
      )}

      {/* Hero Altı Bant / Quick Action Banner */}
      {(() => {
        const getLocVal = (val?: unknown) => {
          if (!val) return ''
          if (typeof val === 'string') return val.trim()
          if (typeof val === 'object') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const current = (val as any)[locale] || (val as any).tr || (val as any).en || ''
            return typeof current === 'string' ? current.trim() : ''
          }
          return ''
        }

        const title = getLocVal(content?.quickBannerTitle)
        const subtitle = getLocVal(content?.quickBannerSubtitle)
        const buttonText = getLocVal(content?.quickBannerButtonText)
        const link = content?.quickBannerLink || '/products'

        const hasTextContent = !!(title || subtitle)

        return (
          <section
            id="home-quick-banner"
            className={`w-full bg-[#484d54] text-white transition-colors duration-500 font-roboto ${
              !hasTextContent ? 'py-3 md:py-4' : 'py-3.5 md:py-4'
            }`}
          >
            <div
              className={`w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-8 text-center md:text-left ${
                !hasTextContent ? 'justify-center min-h-[44px] md:min-h-0' : 'min-h-[44px]'
              }`}
            >
              {hasTextContent ? (
                <div className="space-y-1">
                  {title ? (
                    <h3 className="text-sm md:text-lg font-medium uppercase tracking-[0.08em] text-white font-roboto">
                      {title}
                    </h3>
                  ) : null}
                  {subtitle ? (
                    <p className="text-[11px] md:text-sm text-gray-200 font-normal tracking-[0.06em]">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="hidden md:block" />
              )}
              {buttonText ? (
                <Link
                  to={link}
                  className={`group inline-flex items-center gap-2.5 text-white text-xs md:text-base uppercase tracking-[0.08em] font-medium hover:text-gray-200 transition-colors duration-300 py-1 ${
                    !hasTextContent ? 'my-auto md:my-0 md:ml-auto' : 'md:ml-auto'
                  }`}
                >
                  <span>{buttonText}</span>
                  <span className="text-base md:text-lg font-normal transition-transform duration-300 group-hover:translate-x-1.5">
                    &gt;
                  </span>
                </Link>
              ) : null}
            </div>
          </section>
        )
      })()}

      {/* Content Blocks & Interactive Showcase Section */}
      {((content?.contentBlocks && content.contentBlocks.length > 0) ||
        (content?.interactiveShowcase && content.interactiveShowcase.length > 0)) && (
        <HomeContentBlocks
          blocks={content.contentBlocks || []}
          isMobile={isMobile}
          imageBorderClass={imageBorderClass}
          interactiveShowcase={content.interactiveShowcase}
          interactiveShowcaseTitle={content.interactiveShowcaseTitle}
          interactiveShowcaseBlockIndex={content.interactiveShowcaseBlockIndex}
        />
      )}
    </div>
  )
}
