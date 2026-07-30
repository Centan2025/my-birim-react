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
  const {t} = useTranslation()
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
            }
          `}</style>
          <HomeHero content={content} settings={settings} />
        </>
      ) : (
        <div className="relative h-[50vh] w-full bg-gray-900" />
      )}

      {/* Hero Altı Bant / Quick Action Banner */}
      <section className="w-full bg-[var(--bg-secondary)] border-y border-[var(--border-primary)]/10 py-6 md:py-8 transition-colors duration-500">
        <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 text-center md:text-left">
          <div className="space-y-1">
            <h3 className="font-outfit text-xs md:text-sm uppercase tracking-[0.25em] font-light text-[var(--text-primary)]">
              {t('explore_collection_title') || 'BİRİM TASARIM KOLEKSİYONU'}
            </h3>
            <p className="text-[11px] md:text-xs text-[var(--text-secondary)] font-light tracking-wide">
              {t('explore_collection_subtitle') || 'Zamansız parçalar ve mimari çözümleri keşfedin'}
            </p>
          </div>
          <Link
            to="/products"
            className="group inline-flex items-center gap-3 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)]/40 px-6 py-3 text-[10px] md:text-xs uppercase tracking-[0.25em] font-light hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all duration-500 rounded-none shadow-sm"
          >
            <span>{t('explore_products') || 'ÜRÜNLERİ KEŞFET'}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Content Blocks Section */}
      {content?.contentBlocks && content.contentBlocks.length > 0 && (
        <HomeContentBlocks
          blocks={content.contentBlocks}
          isMobile={isMobile}
          imageBorderClass={imageBorderClass}
        />
      )}
    </div>
  )
}
