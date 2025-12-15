import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../src/hooks/useSiteData'
import { useHomePageContent } from '../src/hooks/useHomePage'
import { OptimizedVideo } from '../components/OptimizedVideo'
import { YouTubeBackground } from '../components/YouTubeBackground'
import { HomeHero } from '../components/HomeHero'
import { useTranslation } from '../i18n'
import { useSEO } from '../src/hooks/useSEO'
import ScrollReveal from '../components/ScrollReveal'
import ParallaxImage from '../components/ParallaxImage'
import { useGoogleFonts } from '../src/hooks/useGoogleFont'

export function HomePage() {
  const { data: content } = useHomePageContent()
  const { data: settings } = useSiteSettings()

  const [inspirationImageHeight, setInspirationImageHeight] = useState<number | null>(null)
  const [inspirationSectionRef, setInspirationSectionRef] = useState<HTMLElement | null>(null)
  const [showFixedBackground, setShowFixedBackground] = useState(false)
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
  const { t } = useTranslation()
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

  // Content block'lardaki Google Fonts'u yükle
  const contentBlockFonts = useMemo(() => {
    if (!content?.contentBlocks) return []
    return content.contentBlocks
      .map((block) => block.titleFont)
      .filter((font): font is string => Boolean(font))
  }, [content?.contentBlocks])

  useGoogleFonts(contentBlockFonts)

  // İlham section görünürken fixed background'u göster
  useEffect(() => {
    if (!inspirationSectionRef || typeof window === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setShowFixedBackground(entry.isIntersecting)
        })
      },
      {
        threshold: 0.1,
      }
    )

    observer.observe(inspirationSectionRef)

    return () => {
      observer.disconnect()
    }
  }, [inspirationSectionRef])


  // İlham görselinin yüksekliğini hesapla - hook'lar early return'den önce olmalı
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      const vw = document.documentElement.clientWidth || window.innerWidth
      setIsMobile(mobile)
      setViewportWidth(vw)
    }
    checkMobile()

    const inspiration = content?.inspirationSection
    const bgImg = inspiration?.backgroundImage
    const bgImgUrl = bgImg ? (typeof bgImg === 'string' ? bgImg : bgImg.url) : ''
    if (!bgImgUrl) {
      setInspirationImageHeight(null)
      return
    }

    const img = new Image()
    img.onload = () => {
      if (isMobile) {
        // Mobilde görsel genişliği viewport genişliğine eşit, yüksekliği orantılı
        const aspectRatio = img.height / img.width
        const calculatedHeight = viewportWidth * aspectRatio
        // Bölüm yüksekliğini görsel yüksekliğinden %20 daha az yap
        setInspirationImageHeight(calculatedHeight * 0.8)
      } else {
        // Desktop'ta görsel cover olarak kullanılıyor, minimum yükseklik ayarla
        setInspirationImageHeight(Math.max(img.height, 400))
      }
    }
    img.onerror = () => {
      setInspirationImageHeight(null)
    }
    img.src = bgImgUrl

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
  }, [content?.inspirationSection?.backgroundImage, isMobile, viewportWidth])

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
    <>
      {/* Fixed background image - sadece ilham section görünürken göster */}
      {showFixedBackground && bgImageUrl && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${isMobile && bgImageMobile ? bgImageMobile : bgImageDesktop || bgImageUrl})`,
            backgroundSize: isMobile ? '100vw auto' : 'cover',
            backgroundPosition: isMobile ? 'left center' : 'center center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0, // Behind everything
            opacity: 1.0,
          }}
        />
      )}
      <div
        className={`bg-gray-100 text-gray-800 ${isMobile ? 'hero-page-container-mobile' : ''}`}
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
            /* Desktop override - mobil style'ları geçersiz kıl */
            @media (min-width: 1024px) {
              .hero-page-container-mobile {
                width: 100% !important;
                max-width: 100% !important;
                overflow: hidden !important;
              }
              /* Hero container - parent */
              div[class*="relative"][class*="h-screen"] {
                width: 100% !important;
                max-width: 100% !important;
                overflow: hidden !important;
                position: relative !important;
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
                /* Inline style'daki genişlik değerini koru, CSS override etmesin */
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
              .inspiration-section-mobile {
                width: 100vw !important;
                max-width: 100vw !important;
                margin-left: calc(-50vw + 50%) !important;
                margin-right: calc(-50vw + 50%) !important;
                left: 0 !important;
                right: 0 !important;
                position: relative !important;
                box-sizing: border-box !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                overflow: hidden !important;
              }
              .inspiration-section-mobile[style*="backgroundImage"] {
                background-size: 100vw auto !important;
                background-position: left center !important;
                background-repeat: no-repeat !important;
                background-attachment: scroll !important;
              }
              body {
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              html {
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              #root {
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
              }
              main {
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
              }
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
                /* Genişlik inline style'dan gelecek, CSS override etmesin */
              }
              .hero-slide-mobile,
              .hero-slide-mobile[style] {
                /* Genişlik inline style'dan gelecek, CSS override etmesin */
                height: auto !important;
                min-height: auto !important;
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
                height: auto !important;
                min-height: auto !important;
                left: 0 !important;
                right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                object-fit: contain !important;
                object-position: top !important;
                position: relative !important;
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
                height: auto !important;
                min-height: auto !important;
                left: 0 !important;
                right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                object-fit: contain !important;
                object-position: top !important;
                position: relative !important;
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
                height: 100vh !important;
                min-height: 100vh !important;
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
        <section className="w-full bg-gray-200 h-10 md:h-12" />

        {/* Content Blocks Section */}
        {content?.contentBlocks &&
          content.contentBlocks.length > 0 &&
          (() => {
            const sortedBlocks = [...content.contentBlocks].sort(
              (a, b) => (a.order || 0) - (b.order || 0)
            )

            // Boş (medya da yazı da olmayan) blokları tamamen gösterme
            const hasAnyContent = (block: any) => {
              const hasDescription = Boolean(block?.description)
              const hasImage =
                block?.image || block?.imageMobile || block?.imageDesktop
              const hasVideo =
                block?.videoFile || block?.videoFileMobile || block?.videoFileDesktop
              const hasUrl = Boolean(block?.url)

              return hasDescription || hasImage || hasVideo || hasUrl
            }

            const visibleBlocks = sortedBlocks.filter(hasAnyContent)
            const lastIndex = visibleBlocks.length - 1

            return (
              <div className="relative" style={{ zIndex: 2 }}>
                {visibleBlocks.map((block, index) => {
                  const getMediaUrl = () => {
                    if (block.mediaType === 'image' && block.image) {
                      return block.image
                    }
                    return block.url || ''
                  }

                  const mediaUrl = getMediaUrl()
                  const isFullWidth = block.position === 'full'
                  const isLeft = block.position === 'left'
                  const isRight = block.position === 'right'
                  const isCenter = block.position === 'center'
                  const hasDescription = Boolean(block.description)

                  const backgroundColor =
                    block.backgroundColor === 'gray' ? 'bg-gray-100' : 'bg-white'
                  const textAlign = block.textAlignment || 'left'
                  const textAlignClass =
                    textAlign === 'center'
                      ? 'text-center'
                      : textAlign === 'right'
                        ? 'text-right'
                        : 'text-left'
                  const titleFont = block.titleFont || 'normal'

                  // Font class veya style belirle
                  const titleFontClass =
                    titleFont === 'serif'
                      ? 'font-serif'
                      : titleFont === 'mono'
                        ? 'font-mono'
                        : titleFont === 'normal'
                          ? 'font-sans'
                          : '' // Google Font için class yok, inline style kullanacağız

                  // Google Font için inline style
                  const titleFontStyle =
                    titleFont && titleFont !== 'normal' && titleFont !== 'serif' && titleFont !== 'mono'
                      ? { fontFamily: `"${titleFont}", sans-serif` }
                      : undefined

                  const sectionSpacingClass = (() => {
                    const isLast = index === lastIndex

                    // Yazı yoksa: mobilde minimum, desktop'ta daha sıkı boşluk
                    if (!hasDescription) {
                      if (index === 0) return 'pt-0 pb-0'
                      if (index === 1) return 'pt-0 pb-2 md:pb-6'
                      if (isLast) return 'pt-2 pb-1 md:pt-4 md:pb-6'
                      return 'py-3 md:py-8'
                    }

                    // Yazı varsa: genel olarak hem mobilde hem desktop'ta boşlukları azalt
                    if (index === 0) return 'pt-0 pb-0'
                    if (index === 1) return 'pt-2 pb-6 md:pt-3 md:pb-10'
                    if (isLast) return 'pt-4 pb-6 md:pt-6 md:pb-12'
                    return 'py-6 md:py-12'
                  })()

                  return (
                    <React.Fragment key={`block-${block.order || index}-${index}`}>
                      {index > 0 && (
                        <div className="w-full h-px bg-gray-200" />
                      )}
                      <section key={index} className={`${sectionSpacingClass} ${backgroundColor}`}>
                        {isFullWidth ? (
                          <div
                            className={`w-full overflow-hidden ${hasDescription ? 'py-4 md:py-10' : 'py-0 md:py-6'
                              }`}
                          >
                            {block.title && (
                              <ScrollReveal delay={100}>
                                <div className="container mx-auto px-2 sm:px-3 lg:px-4 pb-6 md:pb-8">
                                  <h2
                                    className={`text-2xl md:text-4xl lg:text-5xl font-bold ${titleFontClass} ${textAlignClass} text-gray-900`}
                                    style={titleFontStyle}
                                  >
                                    {t(block.title)}
                                  </h2>
                                </div>
                              </ScrollReveal>
                            )}
                            {block.mediaType === 'youtube' ? (
                              <div className="relative w-full aspect-video overflow-hidden">
                                <YouTubeBackground url={mediaUrl} />
                              </div>
                            ) : block.mediaType === 'video' ? (
                              <OptimizedVideo
                                src={mediaUrl}
                                className={`w-full h-auto max-w-full ${isMobile ? 'object-contain' : 'object-cover'}`}
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="auto"
                                loading="lazy"
                              />
                            ) : (
                              <ParallaxImage
                                src={mediaUrl}
                                alt=""
                                className="w-full"
                                imgClassName={`${isMobile ? 'object-contain' : 'object-cover'} max-w-full block`}
                                loading="lazy"
                                quality={85}
                              />
                            )}
                            {block.description && (
                              <ScrollReveal delay={200}>
                                <div className="container mx-auto px-2 sm:px-3 lg:px-4 py-12">
                                  <div className={`prose max-w-none ${textAlignClass}`}>
                                    <p className="text-lg md:text-xl text-gray-700 font-light leading-relaxed">
                                      {t(block.description)}
                                    </p>
                                  </div>
                                  {block.linkText && block.linkUrl && (
                                    <div className={`mt-6 ${textAlignClass}`}>
                                      <Link
                                        to={block.linkUrl}
                                        className="group inline-flex items-center gap-x-3 text-gray-900 font-semibold py-3 pl-0 pr-5 text-sm md:text-lg rounded-lg"
                                      >
                                        <span className="inline-flex items-end gap-x-3 border-b border-transparent group-hover:border-gray-900 pb-1 transition-all duration-300 ease-out">
                                          <span className="group-hover:text-gray-500 leading-none">
                                            {t(block.linkText)}
                                          </span>
                                          <span className="w-8 h-[1px] md:w-10 bg-current" />
                                        </span>
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              </ScrollReveal>
                            )}
                          </div>
                        ) : (
                          <div
                            className={`container mx-auto px-2 sm:px-3 lg:px-4 ${hasDescription ? 'py-4 md:py-10' : 'py-1 md:py-6'
                              }`}
                          >
                            {block.title && (
                              <ScrollReveal delay={100}>
                                <div className={`pb-6 md:pb-8 ${textAlignClass}`}>
                                  <h2
                                    className={`text-2xl md:text-4xl lg:text-5xl font-bold ${titleFontClass} text-gray-900`}
                                    style={titleFontStyle}
                                  >
                                    {t(block.title)}
                                  </h2>
                                </div>
                              </ScrollReveal>
                            )}
                            <div
                              className={`flex flex-col ${isLeft ? 'md:flex-row' : isRight ? 'md:flex-row-reverse' : 'md:flex-row items-center'} gap-12`}
                            >
                              <div className={`w-full ${isCenter ? 'md:w-full' : 'md:w-1/2'} overflow-visible`}>
                                {block.mediaType === 'youtube' ? (
                                  <div className="relative w-full aspect-video overflow-hidden">
                                    <YouTubeBackground url={mediaUrl} />
                                  </div>
                                ) : block.mediaType === 'video' ? (
                                  <OptimizedVideo
                                    src={mediaUrl}
                                    className={`w-full h-auto ${imageBorderClass} max-w-full ${isMobile ? 'object-contain' : 'object-cover'}`}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    preload="auto"
                                    loading="lazy"
                                  />
                                ) : (
                                  <ParallaxImage
                                    src={mediaUrl}
                                    alt=""
                                    className="w-full"
                                    imgClassName={`${imageBorderClass} ${isMobile ? 'object-contain' : 'object-cover'} max-w-full block`}
                                    loading="lazy"
                                    quality={85}
                                  />
                                )}
                              </div>
                              <ScrollReveal delay={200} width="w-full" className={`${isCenter ? 'md:w-full' : 'md:w-1/2'}`}>
                                <div className={`w-full`}>
                                  <div className={`prose max-w-none ${textAlignClass}`}>
                                    <p className="text-lg md:text-xl text-gray-700 font-light leading-relaxed">
                                      {t(block.description)}
                                    </p>
                                  </div>
                                  {block.linkText && block.linkUrl && (
                                    <div className={`mt-6 ${textAlignClass}`}>
                                      <Link
                                        to={block.linkUrl}
                                        className="group inline-flex items-center gap-x-3 text-gray-900 font-semibold py-3 pl-0 pr-5 text-sm md:text-lg rounded-lg"
                                      >
                                        <span className="inline-flex items-end gap-x-3 border-b border-transparent group-hover:border-gray-900 pb-1 transition-all duration-300 ease-out">
                                          <span className="group-hover:text-gray-500 leading-none">
                                            {t(block.linkText)}
                                          </span>
                                          <span className="w-8 h-[1px] md:w-10 bg-current" />
                                        </span>
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              </ScrollReveal>
                            </div>
                          </div>
                        )}
                      </section>
                    </React.Fragment>
                  )
                })}
              </div>
            )
          })()}

        {/* Inspiration Section */}
        {inspiration &&
          (inspiration.backgroundImage || inspiration.title || inspiration.subtitle) && (
            <>
              <ScrollReveal>
                <section
                  ref={(el) => setInspirationSectionRef(el)}
                  className="relative py-16 md:py-32 text-white text-center inspiration-section-mobile"
                  style={{
                    ...(isMobile && inspirationImageHeight && bgImageUrl
                      ? {
                        height: `${inspirationImageHeight}px`,
                        minHeight: `${inspirationImageHeight}px`,
                        paddingTop: 0,
                        paddingBottom: 0,
                      }
                      : {}),
                    ...(!isMobile && inspirationImageHeight && bgImageUrl
                      ? { minHeight: `${inspirationImageHeight}px` }
                      : {}),
                    position: 'relative',
                    zIndex: 1, // Above fixed background (0)
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent dark overlay (50%)
                  }}
                >
                  {/* Overlay removed - using section backgroundColor instead */}
                  <div className="relative z-10 container mx-auto px-2 sm:px-2 lg:px-3 max-w-4xl">
                    <ScrollReveal delay={200}>
                      <h2 className="text-4xl font-light leading-relaxed">{t(inspiration.title)}</h2>
                    </ScrollReveal>
                    <ScrollReveal delay={300}>
                      <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">
                        {t(inspiration.subtitle)}
                      </p>
                    </ScrollReveal>
                    {inspiration.buttonText && (
                      <ScrollReveal delay={400}>
                        <Link
                          to={inspiration.buttonLink || '/'}
                          className="group mt-8 inline-flex items-center gap-x-3 text-white font-semibold py-3 pl-0 pr-5 text-lg rounded-lg"
                        >
                          <span className="inline-flex items-end gap-x-3 border-b border-transparent group-hover:border-white pb-1 transition-all duration-300 ease-out">
                            <span className="group-hover:text-gray-200 leading-none">{t(inspiration.buttonText)}</span>
                            <span className="w-8 h-[1px] md:w-10 bg-current" />
                          </span>
                        </Link>
                      </ScrollReveal>
                    )}
                  </div>
                </section>
              </ScrollReveal>
            </>
          )}
      </div>
    </>
  )
}
