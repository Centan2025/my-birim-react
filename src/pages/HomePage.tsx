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

  // İlham görselinin yüksekliğini hesapla
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      const vw = document.documentElement.clientWidth || window.innerWidth
      const currentWidth = window.innerWidth

      setIsMobile(prev => (prev !== mobile ? mobile : prev))
      setViewportWidth(prev => (prev !== vw ? vw : prev))

      if (mobile) {
        if (Math.abs(currentWidth - lastWidthRef.current) > 1) {
          setMobileHeroHeight(window.innerHeight)
          lastWidthRef.current = currentWidth
        }
      } else {
        setMobileHeroHeight(null)
      }
    }

    if (typeof window !== 'undefined') {
      if (window.innerWidth < 1024) {
        setMobileHeroHeight(window.innerHeight)
      }
      checkMobile()
    }

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
  }, [])

  // Desktop Home Page Section Snap & Smooth Navigation Controller
  useEffect(() => {
    if (isMobile) return

    let isSnapping = false
    let lastSnapTime = 0
    let accumulatedDelta = 0
    let resetTimer: ReturnType<typeof setTimeout> | null = null
    let safetyUnlockTimer: ReturnType<typeof setTimeout> | null = null
    const INTENTIONAL_THRESHOLD = 35 // Belirgin kaydırmada tetikle
    const COOLDOWN_MS = 450 // Adımlar arası kilit süresi

    const snapTo = (targetY: number) => {
      const docHeight = document.documentElement.scrollHeight
      const winHeight = window.innerHeight
      const maxScroll = Math.max(0, docHeight - winHeight)
      const clampedY = Math.max(0, Math.min(targetY, maxScroll))

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
      safetyUnlockTimer = setTimeout(unlock, 800)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any
      if (win.lenis && typeof win.lenis.scrollTo === 'function') {
        win.lenis.scrollTo(clampedY, {
          offset: 0,
          duration: 0.75,
          lock: true,
          easing: (t: number) => 1 - Math.pow(1 - t, 3),
          onComplete: unlock,
        })
      } else {
        window.scrollTo({
          top: clampedY,
          behavior: 'smooth',
        })
        setTimeout(unlock, 650)
      }
    }

    const triggerStep = (direction: 'down' | 'up') => {
      const winHeight = window.innerHeight
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight

      const heroElem = document.getElementById('home-hero-section')
      const heroHeight = heroElem ? heroElem.offsetHeight : winHeight

      const bannerElem = document.getElementById('home-quick-banner')
      const bannerHeight = bannerElem ? bannerElem.offsetHeight : 0
      const bannerTop = bannerElem ? bannerElem.getBoundingClientRect().top + scrollY : heroHeight
      const bannerBottomScrollY =
        bannerElem && bannerHeight > 0 ? Math.max(0, bannerTop + bannerHeight - winHeight) : 0

      // İçerik bloklarını ve interaktif vitrini hedefler olarak al
      const blockElems = Array.from(
        document.querySelectorAll<HTMLElement>('.home-content-block-snap')
      ).filter(el => el && el.offsetHeight > 0)

      const firstBlockTop = blockElems[0]
        ? blockElems[0].getBoundingClientRect().top + scrollY
        : bannerTop + bannerHeight

      // --- AŞAĞI KAYDIRMA KADEMELERİ (STEP BY STEP DOWN) ---
      if (direction === 'down') {
        // En altta footer'a doğru serbest geçiş
        if (winHeight + scrollY >= docHeight - 30) {
          return
        }

        // Kademe 1: Hero tam ekrandayken önce Hero altındaki gri bant alttan çıksın
        if (bannerBottomScrollY > 10 && scrollY < bannerBottomScrollY - 20) {
          snapTo(bannerBottomScrollY)
          return
        }

        // Kademe 2: Gri bant kademesindeyken bir sonraki scroll'da interaktif ürün görsellerine / ilk bloğa kay
        if (scrollY < firstBlockTop - 35) {
          snapTo(firstBlockTop)
          return
        }

        // Kademe 3+: İçerik blokları tek tek ekrana yerleşsin
        if (blockElems.length === 0) return

        let currentIndex = 0
        let closestDist = Infinity

        for (let i = 0; i < blockElems.length; i++) {
          const el = blockElems[i]
          if (!el) continue
          const top = el.getBoundingClientRect().top + scrollY
          const height = el.offsetHeight

          if (scrollY >= top - 45 && scrollY < top + height - 45) {
            currentIndex = i
            break
          }
          const dist = Math.abs(top - scrollY)
          if (dist < closestDist) {
            closestDist = dist
            currentIndex = i
          }
        }

        const currentElem = blockElems[currentIndex]
        if (!currentElem) return
        const currentRect = currentElem.getBoundingClientRect()
        const remainingBelow = currentRect.bottom - winHeight

        // Eğer mevcut bölüm ekrandan uzunsa ve altı henüz ekranda değilse kalan kısmı göster
        if (remainingBelow > 70) {
          snapTo(scrollY + Math.min(remainingBelow, winHeight * 0.85))
        } else if (currentIndex < blockElems.length - 1) {
          const nextElem = blockElems[currentIndex + 1]
          if (nextElem) {
            snapTo(nextElem.getBoundingClientRect().top + scrollY)
          }
        } else {
          // Son bloğun altındayız -> Footer'ı göster
          if (winHeight + scrollY < docHeight - 30) {
            snapTo(docHeight - winHeight)
          }
        }
      }

      // --- YUKARI KAYDIRMA KADEMELERİ (STEP BY STEP UP) ---
      if (direction === 'up') {
        if (scrollY <= 15) return

        // Gri bant kademesindeysek veya Hero'ya çok yakınsak doğrudan tam Hero'ya (0) dön
        if (bannerBottomScrollY > 0) {
          if (scrollY <= bannerBottomScrollY + 30) {
            snapTo(0)
            return
          }
          // İlk bloğun henüz üst kısmındaysak gri bant kademesine geri dön
          if (scrollY <= firstBlockTop + 35) {
            snapTo(bannerBottomScrollY)
            return
          }
        } else {
          if (scrollY <= 40) {
            snapTo(0)
            return
          }
        }

        if (blockElems.length === 0) {
          snapTo(0)
          return
        }

        let currentIndex = 0
        let closestDist = Infinity

        for (let i = 0; i < blockElems.length; i++) {
          const el = blockElems[i]
          if (!el) continue
          const top = el.getBoundingClientRect().top + scrollY
          const height = el.offsetHeight

          if (scrollY >= top - 45 && scrollY < top + height - 45) {
            currentIndex = i
            break
          }
          const dist = Math.abs(top - scrollY)
          if (dist < closestDist) {
            closestDist = dist
            currentIndex = i
          }
        }

        const currentElem = blockElems[currentIndex]
        if (!currentElem) return
        const currentRect = currentElem.getBoundingClientRect()
        const hiddenAbove = -currentRect.top

        // Eğer bu bölümün üst kısmı ekranın yukarısında kalmışsa önce orayı göster
        if (hiddenAbove > 70) {
          snapTo(scrollY - Math.min(hiddenAbove, winHeight * 0.85))
        } else if (currentIndex > 0) {
          const prevElem = blockElems[currentIndex - 1]
          if (currentIndex - 1 === 0) {
            snapTo(firstBlockTop)
          } else if (prevElem) {
            snapTo(prevElem.getBoundingClientRect().top + scrollY)
          }
        } else {
          // İlk içerik bloğunun / interaktif vitrinin tepesindeyken yukarı kaydırıldığında gri bant kademesine git
          snapTo(bannerBottomScrollY > 0 ? bannerBottomScrollY : 0)
        }
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

      // Geçiş animasyonu devam ederken veya cooldown süresince atalet tekerlek hareketlerini engelle
      if (isSnapping || Date.now() - lastSnapTime < COOLDOWN_MS) {
        e.preventDefault()
        return
      }

      // Mikro titreşimleri yoksay
      if (Math.abs(e.deltaY) < 12) return

      accumulatedDelta += e.deltaY

      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(() => {
        accumulatedDelta = 0
      }, 140)

      if (Math.abs(accumulatedDelta) < INTENTIONAL_THRESHOLD) {
        return
      }

      // İstemli adım geçişinde tarayıcının serbest akışını engelle
      e.preventDefault()

      const direction = accumulatedDelta > 0 ? 'down' : 'up'
      accumulatedDelta = 0

      triggerStep(direction)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('input, textarea, select, [role="dialog"], .no-scroll-snap')
      ) {
        return
      }

      if (isSnapping || Date.now() - lastSnapTime < COOLDOWN_MS) {
        return
      }

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault()
        triggerStep('down')
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault()
        triggerStep('up')
      }
    }

    window.addEventListener('wheel', handleWheel, {passive: false})
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
      if (resetTimer) clearTimeout(resetTimer)
      if (safetyUnlockTimer) clearTimeout(safetyUnlockTimer)
    }
  }, [isMobile])

  // Content blocks use natural fluid height without artificial 100vh height gaps

  if (!content || !settings) {
    return <div className="h-screen w-full bg-gray-900 hero-section" />
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
              #home-hero-section,
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
            className={`w-full bg-[#f2f3f5] dark:bg-[#18191b] border-y border-[var(--border-primary)] text-[var(--text-primary)] transition-colors duration-500 font-roboto ${
              !hasTextContent ? 'py-6 md:py-8 lg:py-10' : 'py-6 md:py-8 lg:py-10'
            }`}
          >
            <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 flex flex-col items-center justify-center gap-3 text-center min-h-[64px] md:min-h-[80px]">
              {hasTextContent && (
                <div className="space-y-1.5 text-center">
                  {title ? (
                    <h3 className="text-base md:text-xl lg:text-2xl font-medium uppercase tracking-[0.08em] text-[var(--text-primary)] font-roboto">
                      {title}
                    </h3>
                  ) : null}
                  {subtitle ? (
                    <p className="text-xs md:text-sm lg:text-base text-[var(--text-secondary)] font-normal tracking-[0.06em]">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              )}
              {buttonText ? (
                <Link
                  to={link}
                  className="group inline-flex items-center gap-3 text-[var(--text-primary)] text-sm md:text-lg lg:text-xl uppercase tracking-[0.1em] font-medium hover:text-[var(--text-secondary)] transition-colors duration-300 py-1"
                >
                  <span>{buttonText}</span>
                  <span className="text-lg md:text-xl font-normal transition-transform duration-300 group-hover:translate-x-2">
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
