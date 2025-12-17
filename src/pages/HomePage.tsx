import React, { useState, useEffect, useMemo } from 'react'
import { useSiteSettings } from '../hooks/useSiteData'
import { useHomePageContent } from '../hooks/useHomePage'
import { HomeHero } from '../components/HomeHero'
import { useSEO } from '../hooks/useSEO'
import { HomeContentBlocks } from '../components/HomeContentBlocks'
import { HomeInspirationSection } from '../components/HomeInspirationSection'
import { useHeaderTheme } from '../context/HeaderThemeContext'

export function HomePage() {
  const { data: content } = useHomePageContent()
  const { data: settings } = useSiteSettings()
  const { setFromPalette, reset } = useHeaderTheme()
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
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'

  // SEO
  const seoData = useMemo(
    () => ({
      title: 'BIRIM - Ana Sayfa',
      description: 'BIRIM - Modern tasarım ve mimari çözümler',
      image: content?.heroMedia?.[0]?.url || undefined,
      type: 'website' as const,
      siteName: 'BIRIM',
      locale: 'tr_TR',
    }),
    [content?.heroMedia]
  )

  useSEO(seoData)

  const [mobileHeroHeight, setMobileHeroHeight] = useState<number | null>(null)
  const lastWidthRef = React.useRef(typeof window !== 'undefined' ? window.innerWidth : 0)

  // Header temasını hero görsel paletinden besle
  useEffect(() => {
    if (!content?.heroMedia || !Array.isArray(content.heroMedia)) {
      reset()
      return () => reset()
    }
    const firstImageWithPalette = content.heroMedia.find(
      (m: any) => m?.type === 'image' && m?.palette
    )
    if (firstImageWithPalette?.palette) {
      setFromPalette(firstImageWithPalette.palette)
    } else {
      reset()
    }
    return () => reset()
  }, [content?.heroMedia, reset, setFromPalette])

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
  const inspiration = content.inspirationSection || {
    backgroundImage: '',
    title: '',
    subtitle: '',
    buttonText: '',
    buttonLink: '/',
  }

  // Helper: backgroundImage string veya object olabilir
  const bgImageUrl = inspiration.backgroundImage
    ? typeof inspiration.backgroundImage === 'string'
      ? inspiration.backgroundImage
      : inspiration.backgroundImage.url
    : ''
  const bgImageMobile =
    inspiration.backgroundImage && typeof inspiration.backgroundImage === 'object'
      ? inspiration.backgroundImage.urlMobile
      : undefined
  const bgImageDesktop =
    inspiration.backgroundImage && typeof inspiration.backgroundImage === 'object'
      ? inspiration.backgroundImage.urlDesktop
      : undefined

  return (
<div
  className={`bg-gray-100 text-gray-900 ${isMobile ? 'hero-page-container-mobile' : ''}`}
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
        position: 'relative',
      }
      : {
        position: 'relative',
      }
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
                width: 100vw !important;
                max-width: 100vw !important;
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
                width: 100vw !important;
                max-width: 100vw !important;
                min-width: 100vw !important;
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
                width: 100vw !important;
                min-width: 100vw !important;
                max-width: 100vw !important;
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
                width: 100vw !important;
              }
              .hero-slide-mobile .w-full {
                width: 100vw !important;
              }
              .hero-slide-mobile img,
              .hero-slide-mobile img[style] {
                width: 100vw !important;
                min-width: 100vw !important;
                max-width: 100vw !important;
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
                width: 100vw !important;
                max-width: 100vw !important;
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
                width: 100vw !important;
                max-width: 100vw !important;
                min-width: 100vw !important;
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

      {/* Hero Altı Gri Bant */}
      <section className="w-full bg-gray-100 h-10 md:h-12" />

      {/* Content Blocks Section */}
      {content?.contentBlocks && content.contentBlocks.length > 0 && (
        <HomeContentBlocks
          blocks={content.contentBlocks}
          isMobile={isMobile}
          imageBorderClass={imageBorderClass}
        />
      )}

      {/* Inspiration Section */}
      {inspiration && (
        <HomeInspirationSection
          inspiration={inspiration}
          isMobile={isMobile}
          bgImageUrl={bgImageUrl}
          bgImageMobile={bgImageMobile}
          bgImageDesktop={bgImageDesktop}
        />
      )}
    </div>
  )
}