import {useState, useEffect, useMemo} from 'react'
import {Link} from 'react-router-dom'
import {useSiteSettings} from '../src/hooks/useSiteData'
import {useHomePageContent} from '../src/hooks/useHomePage'
import {OptimizedImage} from '../components/OptimizedImage'
import {OptimizedVideo} from '../components/OptimizedVideo'
import {YouTubeBackground} from '../components/YouTubeBackground'
import {HomeHero} from '../components/HomeHero'
import {useTranslation} from '../i18n'
import {useSEO} from '../src/hooks/useSEO'
import ScrollReveal from '../components/ScrollReveal'

export function HomePage() {
  const {data: content} = useHomePageContent()
  const {data: settings} = useSiteSettings()
  const [inspirationImageHeight, setInspirationImageHeight] = useState<number | null>(null)
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

  // Animasyon sistemi kaldırıldı - yazılar direkt görünür


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
              .hero-page-container-mobile > div:first-child,
              .hero-page-container-mobile > div:first-child[class*="relative"],
              .hero-container-mobile {
                height: 100dvh !important;
                min-height: 100dvh !important;
                max-height: 100dvh !important;
                overscroll-behavior: none !important;
                overscroll-behavior-y: none !important;
                overscroll-behavior-x: none !important;
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
                scroll-snap-type: none !important;
                scroll-padding: 0 !important;
                scroll-behavior: auto !important;
                -webkit-overflow-scrolling: touch !important;
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
                overscroll-behavior-x: none !important;
                overscroll-behavior-y: none !important;
                overscroll-behavior: none !important;
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
                overscroll-behavior: none !important;
                overscroll-behavior-y: none !important;
                overscroll-behavior-x: none !important;
                /* Genişlik inline style'dan gelecek, CSS override etmesin */
              }
              .hero-slide-mobile,
              .hero-slide-mobile[style] {
                /* Genişlik inline style'dan gelecek, CSS override etmesin */
                height: 100dvh !important;
                min-height: 100dvh !important;
                max-height: 100dvh !important;
                flex-shrink: 0 !important;
                flex-grow: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: hidden !important;
                position: relative !important;
                box-sizing: border-box !important;
                left: 0 !important;
                right: 0 !important;
                scroll-snap-align: none !important;
                scroll-snap-stop: normal !important;
                scroll-margin: 0 !important;
                overscroll-behavior: none !important;
                overscroll-behavior-y: none !important;
                overscroll-behavior-x: none !important;
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
                height: 100dvh !important;
                min-height: 100dvh !important;
                max-height: 100dvh !important;
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
                height: 100dvh !important;
                min-height: 100dvh !important;
                max-height: 100dvh !important;
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
                height: 100dvh !important;
                min-height: 100dvh !important;
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
      {content?.contentBlocks &&
        content.contentBlocks.length > 0 &&
        (() => {
          const sortedBlocks = [...content.contentBlocks].sort(
            (a, b) => (a.order || 0) - (b.order || 0)
          )
          return (
            <>
              {sortedBlocks.map((block, index) => {
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
                    ? {fontFamily: `"${titleFont}", sans-serif`}
                    : undefined

                return (
                  <section
                    key={index}
                    className={`content-block-wrapper ${index === 0 ? 'pt-0 pb-0' : index === 1 ? 'pt-0 pb-20' : 'py-20'} ${backgroundColor}`}
                    data-block-index={index}
                  >
                    {isFullWidth ? (
                      <div className="w-full overflow-hidden">
                        {block.title && (
                          <div className="container mx-auto px-2 sm:px-3 lg:px-4 pt-6 md:pt-8 pb-6 md:pb-8">
                            <ScrollReveal delay={0} threshold={0.1} width="w-full" className="h-auto" distance={50} duration={0.6}>
                              <h2
                                className={`text-2xl md:text-4xl lg:text-5xl font-bold ${titleFontClass} ${textAlignClass} text-gray-950`}
                                style={titleFontStyle}
                              >
                                {t(block.title)}
                              </h2>
                            </ScrollReveal>
                          </div>
                        )}
                        <ScrollReveal delay={50} threshold={0.1} width="w-full" className="h-auto">
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
                            <OptimizedImage
                              src={mediaUrl}
                              alt=""
                              className={`w-full h-auto ${isMobile ? 'object-contain' : 'object-cover'} max-w-full block`}
                              loading="lazy"
                              quality={85}
                            />
                          )}
                        </ScrollReveal>
                        {block.description && (
                          <div className="container mx-auto px-2 sm:px-3 lg:px-4 py-12">
                            <ScrollReveal delay={100} threshold={0.1} width="w-full" className="h-auto">
                              <div className={`prose max-w-none ${textAlignClass}`}>
                                <p className="text-lg md:text-xl text-gray-950 font-light leading-relaxed">
                                  {t(block.description)}
                                </p>
                              </div>
                            </ScrollReveal>
                            {block.linkText && block.linkUrl && (
                              <ScrollReveal delay={200} threshold={0.1} width="w-full" className="h-auto">
                                <div className={`mt-6 ${textAlignClass}`}>
                                  <Link
                                    to={block.linkUrl}
                                    className="group inline-flex items-center gap-x-3 text-gray-950 font-semibold py-3 pl-0 pr-5 text-sm md:text-lg rounded-lg"
                                  >
                                    <span className="inline-flex items-end gap-x-3 border-b border-transparent group-hover:border-gray-900 pb-1 transition-all duration-300 ease-out">
                                      <span className="group-hover:text-gray-500 leading-none">
                                        {t(block.linkText)}
                                      </span>
                                      <span className="w-8 h-[1px] md:w-10 bg-current" />
                                    </span>
                                  </Link>
                                </div>
                              </ScrollReveal>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="container mx-auto px-2 sm:px-3 lg:px-4">
                        {block.title && (
                          <div className={`pt-6 md:pt-8 pb-6 md:pb-8 ${textAlignClass}`}>
                            <ScrollReveal delay={0} threshold={0.1} width="w-full" className="h-auto" distance={50} duration={0.6}>
                              <h2
                                className={`text-2xl md:text-4xl lg:text-5xl font-bold ${titleFontClass} text-gray-950`}
                                style={titleFontStyle}
                              >
                                {t(block.title)}
                              </h2>
                            </ScrollReveal>
                          </div>
                        )}
                        <div
                          className={`flex flex-col ${isLeft ? 'md:flex-row' : isRight ? 'md:flex-row-reverse' : 'md:flex-row items-center'} gap-12`}
                        >
                          <div
                            className={`w-full ${isCenter ? 'md:w-full' : 'md:w-1/2'} overflow-visible`}
                          >
                            <ScrollReveal delay={50} threshold={0.1} width="w-full" className="h-auto">
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
                                <OptimizedImage
                                  src={mediaUrl}
                                  alt=""
                                  className={`w-full h-auto ${imageBorderClass} ${isMobile ? 'object-contain' : 'object-cover'} max-w-full block`}
                                  loading="lazy"
                                  quality={85}
                                />
                              )}
                            </ScrollReveal>
                          </div>
                          {block.description && (
                            <div className={`w-full ${isCenter ? 'md:w-full' : 'md:w-1/2'}`}>
                              <ScrollReveal delay={100} threshold={0.1} width="w-full" className="h-auto">
                                <div className={`prose max-w-none ${textAlignClass}`}>
                                  <p className="text-lg md:text-xl text-gray-950 font-light leading-relaxed">
                                    {t(block.description)}
                                  </p>
                                </div>
                              </ScrollReveal>
                              {block.linkText && block.linkUrl && (
                                <ScrollReveal delay={200} threshold={0.1} width="w-full" className="h-auto">
                                  <div className={`mt-6 ${textAlignClass}`}>
                                    <Link
                                      to={block.linkUrl}
                                      className="group inline-flex items-center gap-x-3 text-gray-950 font-semibold py-3 pl-0 pr-5 text-sm md:text-lg rounded-lg"
                                    >
                                      <span className="inline-flex items-end gap-x-3 border-b border-transparent group-hover:border-gray-900 pb-1 transition-all duration-300 ease-out">
                                        <span className="group-hover:text-gray-500 leading-none">
                                          {t(block.linkText)}
                                        </span>
                                        <span className="w-8 h-[1px] md:w-10 bg-current" />
                                      </span>
                                    </Link>
                                  </div>
                                </ScrollReveal>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                )
              })}
            </>
          )
        })()}

      {/* Inspiration Section */}
      {inspiration &&
        (inspiration.backgroundImage || inspiration.title || inspiration.subtitle) && (
          <section
            className="content-block-wrapper relative py-16 md:py-32 bg-gray-900 text-white text-center inspiration-section-mobile"
            style={{
              backgroundImage: `url(${isMobile && bgImageMobile ? bgImageMobile : bgImageDesktop || bgImageUrl})`,
              backgroundSize: isMobile ? '100vw auto' : 'cover',
              backgroundAttachment: 'fixed',
              backgroundPosition: isMobile ? 'left center' : 'center center',
              backgroundRepeat: 'no-repeat',
              ...(isMobile && inspirationImageHeight && bgImageUrl
                ? {
                    height: `${inspirationImageHeight}px`,
                    minHeight: `${inspirationImageHeight}px`,
                    paddingTop: 0,
                    paddingBottom: 0,
                  }
                : {}),
              ...(!isMobile && inspirationImageHeight && bgImageUrl
                ? {minHeight: `${inspirationImageHeight}px`}
                : {}),
            }}
          >
            <div className="absolute inset-0 bg-black/50"></div>
            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
              <ScrollReveal delay={0} threshold={0.1} width="w-full" className="h-auto">
                <h2 className="text-4xl font-light leading-relaxed">{t(inspiration.title)}</h2>
              </ScrollReveal>
              <ScrollReveal delay={100} threshold={0.1} width="w-full" className="h-auto">
                <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">
                  {t(inspiration.subtitle)}
                </p>
              </ScrollReveal>
              {inspiration.buttonText && (
                <ScrollReveal delay={200} threshold={0.1} width="w-full" className="h-auto">
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
        )}
    </div>
  )
}
