import {useState, useEffect} from 'react'
import {Link} from 'react-router-dom'
import {getAboutPageContent} from '../services/cms'
import type {AboutPageContent, NewsMedia} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useSEO} from '../hooks/useSEO'
import {useHeaderTheme} from '../context/HeaderThemeContext'
import ScrollReveal from '../components/ScrollReveal'
import PortableTextLite from '../components/PortableTextLite'

// Alt Medya Galerisi Bileşeni - Ekranı sağdan sola kaplayan tam genişlik (breakout) yapı
const MediaGallery = ({media, alt}: {media?: NewsMedia[]; alt: string}) => {
  if (!media || media.length === 0) return null

  return (
    <div className="mt-20 relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
        {media.map((m, idx) => (
          <ScrollReveal key={idx} delay={idx * 100} distance={10} threshold={0.1}>
            <div className="relative aspect-video overflow-hidden bg-[var(--bg-secondary)]">
              {m.type === 'video' ? (
                <video
                  src={m.url}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <OptimizedImage
                  src={m.url}
                  srcMobile={m.urlMobile}
                  srcDesktop={m.urlDesktop}
                  alt={`${alt} gallery ${idx + 1}`}
                  className="w-full h-full object-cover"
                  crop={m.crop}
                  hotspot={m.hotspot}
                  origWidth={m.origWidth}
                  origHeight={m.origHeight}
                />
              )}
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  )
}

export function AboutPage() {
  const [content, setContent] = useState<AboutPageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const {t} = useTranslation()
  const {reset} = useHeaderTheme()

  useEffect(() => {
    reset()
    return () => reset()
  }, [reset])

  // SEO
  const heroImageObj = typeof content?.heroImage === 'object' ? content.heroImage : null
  const heroImageUrl = heroImageObj
    ? heroImageObj.url
    : typeof content?.heroImage === 'string'
      ? content.heroImage
      : ''

  useSEO({
    title: `BIRIM - ${t('about') || 'Hakkımızda'}`,
    description:
      (content && (t(content.heroSubtitle) || t(content.storyTitle))) ||
      t('about_meta_description_default'),
    image: heroImageUrl,
    type: 'article',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'About',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      '@id': `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/about#webpage`,
      name: t('about') || 'Hakkımızda',
      description:
        (content && (t(content.heroSubtitle) || t(content.storyTitle))) ||
        t('about_meta_description_default'),
      url: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/about`,
      mainEntity: {
        '@id': `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/#organization`,
      },
    },
  })

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true)
      try {
        const pageContent = await getAboutPageContent()
        setContent(pageContent || null)
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [])



  if (loading || !content) {
    return (
      <div className="pt-24">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-primary)] animate-fade-in-up-subtle">
      {/* Hero Section / Header */}
      {heroImageUrl ? (
        <div className="relative h-[70vh] min-h-[500px] bg-gray-900 text-white flex items-center justify-center overflow-hidden hero-section">
          <div className="absolute inset-0 w-full h-full scale-105 animate-slow-zoom">
            <OptimizedImage
              src={heroImageUrl}
              alt={t(content.heroTitle)}
              className="w-full h-full opacity-60 object-cover"
              width={1920}
              height={1080}
              loading="eager"
              sizes="100vw"
              quality={90}
              crop={heroImageObj?.crop}
              hotspot={heroImageObj?.hotspot}
              origWidth={(heroImageObj as {origWidth?: number})?.origWidth}
              origHeight={(heroImageObj as {origHeight?: number})?.origHeight}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />
          </div>
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            <ScrollReveal delay={100} duration={1.2} distance={15}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tighter uppercase leading-none">
                {t(content.heroTitle)}
              </h1>
            </ScrollReveal>
            {content.heroSubtitle && (
              <ScrollReveal delay={300} duration={1.2} distance={20}>
                <p className="mt-8 text-lg md:text-2xl text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">
                  {t(content.heroSubtitle)}
                </p>
              </ScrollReveal>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-20 md:pt-24 lg:pt-28 pb-8 text-[var(--text-primary)]">
          <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4 text-[11px] sm:text-[12px]">
            <Breadcrumbs items={[{label: t('homepage'), to: '/'}, {label: t('about')}]} />
          </div>
          <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 text-center pt-4 pb-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-[var(--text-primary)] uppercase leading-none">
              {t(content.heroTitle)}
            </h1>
            {content.heroSubtitle && (
              <p className="mt-6 text-base md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-light leading-relaxed">
                {t(content.heroSubtitle)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Content Sections */}
      <div className="bg-[var(--bg-tertiary)] overflow-hidden pb-32 font-light">
        {heroImageUrl && (
          <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4 text-[11px] sm:text-[12px]">
            <Breadcrumbs items={[{label: t('homepage'), to: '/'}, {label: t('about')}]} />
          </div>
        )}

        {/* 1. SECTION: HISTORY */}
        {content.historySection && (
          <div className="pb-32">
            <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
              <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-20">
                <div className="flex-1 lg:max-w-xl">
                  <ScrollReveal threshold={0.2} distance={20}>
                    <h2 className="text-3xl md:text-5xl font-light text-[var(--text-primary)] mb-8 tracking-tight">
                      {t(content.historySection.title)}
                    </h2>
                    <div className="text-[var(--text-primary)] leading-relaxed font-roboto-thin text-lg md:text-xl">
                      {(() => {
                        const historyContent = t(content.historySection.content)
                        const isPortable =
                          Array.isArray(historyContent) ||
                          (typeof historyContent === 'object' &&
                            historyContent !== null &&
                            (historyContent as Record<string, unknown>)['_type'] === 'block')

                        if (isPortable) {
                          const blocks = Array.isArray(historyContent)
                            ? historyContent
                            : [historyContent]
                          return <PortableTextLite value={blocks as Record<string, unknown>[]} />
                        }

                        return <p>{historyContent as string}</p>
                      })()}
                    </div>
                  </ScrollReveal>
                </div>
                <div className="flex-1 w-full lg:w-auto">
                  <ScrollReveal threshold={0.2} delay={200} duration={1} distance={10}>
                    <div className="relative w-full overflow-hidden">
                      {(() => {
                        const img = content.historySection?.image
                        const url =
                          typeof img === 'object' ? img.url : img || content.storyImage || ''
                        return (
                          <OptimizedImage
                            src={url}
                            alt="History"
                            className="w-full h-auto object-cover block"
                            crop={typeof img === 'object' ? img.crop : undefined}
                            hotspot={typeof img === 'object' ? img.hotspot : undefined}
                            origWidth={
                              typeof img === 'object'
                                ? (img as {origWidth?: number}).origWidth
                                : undefined
                            }
                            origHeight={
                              typeof img === 'object'
                                ? (img as {origHeight?: number}).origHeight
                                : undefined
                            }
                          />
                        )
                      })()}
                    </div>
                  </ScrollReveal>
                </div>
              </div>
              {/* Alt Medyalar (Full Width) */}
              <MediaGallery media={content.historySection.media} alt="History" />
            </div>
          </div>
        )}

        {/* 2. SECTION: IDENTITY (Gray Background Breakout) */}
        {content.identitySection && (
          <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[var(--bg-secondary)] py-32">
            <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
              <div className="flex flex-col-reverse lg:flex-row items-start gap-12 lg:gap-20 text-left">
                <div className="flex-1 w-full lg:w-auto">
                  <ScrollReveal threshold={0.2} duration={1} distance={10}>
                    <div className="relative w-full overflow-hidden">
                      {(() => {
                        const img = content.identitySection?.image
                        const url = typeof img === 'object' ? img.url : img || ''
                        return (
                          <OptimizedImage
                            src={url}
                            alt="Identity"
                            className="w-full h-auto object-cover block"
                            crop={typeof img === 'object' ? img.crop : undefined}
                            hotspot={typeof img === 'object' ? img.hotspot : undefined}
                            origWidth={
                              typeof img === 'object'
                                ? (img as {origWidth?: number}).origWidth
                                : undefined
                            }
                            origHeight={
                              typeof img === 'object'
                                ? (img as {origHeight?: number}).origHeight
                                : undefined
                            }
                          />
                        )
                      })()}
                    </div>
                  </ScrollReveal>
                </div>
                <div className="flex-1 lg:max-w-xl">
                  <ScrollReveal threshold={0.2} distance={20}>
                    <h2 className="text-3xl md:text-5xl font-light text-[var(--text-primary)] mb-8 tracking-tight">
                      {t(content.identitySection.title)}
                    </h2>
                    <div className="text-[var(--text-primary)] leading-relaxed font-roboto-thin text-lg md:text-xl">
                      {Array.isArray(t(content.identitySection.content)) ? (
                        <>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <PortableTextLite value={t(content.identitySection.content) as any} />
                        </>
                      ) : (
                        <p>{t(content.identitySection.content)}</p>
                      )}
                    </div>
                  </ScrollReveal>
                </div>
              </div>
              {/* Alt Medyalar (Full Width) */}
              <MediaGallery media={content.identitySection.media} alt="Identity" />
            </div>
          </div>
        )}

        {/* 3. SECTION: QUALITY */}
        {content.qualitySection && (
          <div className="pt-32 pb-24">
            <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
              <div className="max-w-7xl mx-auto">
                <ScrollReveal threshold={0.2} distance={20}>
                  <h2 className="text-4xl md:text-6xl font-light text-[var(--text-primary)] mb-16 tracking-tight text-center">
                    {t(content.qualitySection.title)}
                  </h2>
                </ScrollReveal>

                <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start text-left">
                  <div className="lg:w-1/3">
                    <ScrollReveal threshold={0.2} distance={25} delay={100}>
                      <div className="text-[var(--text-primary)] leading-relaxed font-roboto-thin text-lg md:text-xl">
                        {Array.isArray(t(content.qualitySection.content)) ? (
                          <>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <PortableTextLite value={t(content.qualitySection.content) as any} />
                          </>
                        ) : (
                          <p>{t(content.qualitySection.content)}</p>
                        )}
                      </div>
                    </ScrollReveal>
                  </div>
                  <div className="lg:w-2/3 w-full">
                    <ScrollReveal threshold={0.2} delay={200} duration={1} distance={10}>
                      <div className="relative w-full overflow-hidden">
                        {(() => {
                          const img = content.qualitySection?.image
                          const url = typeof img === 'object' ? img.url : img || ''
                          return (
                            <OptimizedImage
                              src={url}
                              alt="Quality"
                              className="w-full h-auto object-cover block"
                              crop={typeof img === 'object' ? img.crop : undefined}
                              hotspot={typeof img === 'object' ? img.hotspot : undefined}
                              origWidth={
                                typeof img === 'object'
                                  ? (img as {origWidth?: number}).origWidth
                                  : undefined
                              }
                              origHeight={
                                typeof img === 'object'
                                  ? (img as {origHeight?: number}).origHeight
                                  : undefined
                              }
                            />
                          )
                        })()}
                      </div>
                    </ScrollReveal>
                  </div>
                </div>
                {/* Alt Medyalar (Full Width) */}
                <MediaGallery media={content.qualitySection.media} alt="Quality" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Design Switcher Banner */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/20 text-white p-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-medium">
          <span className="px-3 py-1 bg-gray-700 text-gray-200 rounded-full font-semibold">
            Klasik Tasarım (V1)
          </span>
          <Link
            to="/about"
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-full transition-colors duration-200"
          >
            ✨ Yeni Tasarıma Geç (V2)
          </Link>
        </div>
      </div>
    </div>
  )
}
