import { useState, useEffect } from 'react'
import { getAboutPageContent } from '../services/cms'
import type { AboutPageContent, NewsMedia } from '../types'
import { OptimizedImage } from '../components/OptimizedImage'
import { PageLoading } from '../components/LoadingSpinner'
import { useTranslation } from '../i18n'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { useSEO } from '../hooks/useSEO'
import { useHeaderTheme } from '../context/HeaderThemeContext'
import ScrollReveal from '../components/ScrollReveal'
import PortableTextLite from '../components/PortableTextLite'

// Alt Medya Galerisi Bileşeni - Ekranı sağdan sola kaplayan tam genişlik (breakout) yapı
const MediaGallery = ({ media, alt }: { media?: NewsMedia[]; alt: string }) => {
  if (!media || media.length === 0) return null

  return (
    <div className="mt-20 relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
        {media.map((m, idx) => (
          <ScrollReveal key={idx} delay={idx * 100} distance={10} threshold={0.1}>
            <div className="relative aspect-video overflow-hidden bg-gray-50">
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
                  alt={`${alt} gallery ${idx + 1}`}
                  className="w-full h-full object-cover"
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
  const { t } = useTranslation()
  const { setFromPalette, reset } = useHeaderTheme()

  // SEO
  const heroImageUrl =
    typeof content?.heroImage === 'object' ? content?.heroImage?.url : content?.heroImage

  useSEO({
    title: `BIRIM - ${t('about') || 'Hakkımızda'}`,
    description:
      (content && (t(content.heroSubtitle) || t(content.storyTitle))) ||
      'BIRIM hakkında bilgiler',
    image: heroImageUrl,
    type: 'article',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'About',
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

  // Header temasını hero görseli paletinden besle
  useEffect(() => {
    if (!content?.heroImage) {
      reset()
    } else {
      const palette =
        typeof content.heroImage === 'object' && content.heroImage !== null && 'palette' in content.heroImage
          ? content.heroImage.palette
          : undefined
      if (palette) {
        setFromPalette(palette)
      } else {
        reset()
      }
    }
    return () => reset()
  }, [content?.heroImage, reset, setFromPalette])

  if (loading || !content) {
    return (
      <div className="pt-24">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  return (
    <div className="bg-white animate-fade-in-up-subtle">
      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[500px] bg-gray-900 text-white flex items-center justify-center overflow-hidden">
        {content.heroImage && (
          <div className="absolute inset-0 w-full h-full scale-105 animate-slow-zoom">
            <OptimizedImage
              src={heroImageUrl || ''}
              alt={t(content.heroTitle)}
              className="w-full h-full opacity-60 object-cover"
              width={1920}
              height={1080}
              loading="eager"
              quality={90}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />
          </div>
        )}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <ScrollReveal delay={100} duration={1.2} distance={15}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tighter uppercase leading-none">
              {t(content.heroTitle)}
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={300} duration={1.2} distance={20}>
            <p className="mt-8 text-lg md:text-2xl text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">
              {t(content.heroSubtitle)}
            </p>
          </ScrollReveal>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="bg-white overflow-hidden pb-32 font-light">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 text-[11px] sm:text-[12px]">
          <Breadcrumbs
            className="mb-12"
            items={[
              { label: t('homepage'), to: '/' },
              { label: t('about') },
            ]}
          />
        </div>

        {/* 1. SECTION: HISTORY */}
        {content.historySection && (
          <div className="pb-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-20">
                <div className="flex-1 lg:max-w-xl">
                  <ScrollReveal threshold={0.2} distance={20}>
                    <h2 className="text-3xl md:text-5xl font-light text-gray-900 mb-8 tracking-tight">
                      {t(content.historySection.title)}
                    </h2>
                    <div className="text-gray-900 leading-relaxed font-roboto-thin text-lg md:text-xl">
                      {Array.isArray(t(content.historySection.content)) ? (
                        <>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <PortableTextLite value={t(content.historySection.content) as any} />
                        </>
                      ) : (
                        <p>{t(content.historySection.content)}</p>
                      )}
                    </div>
                  </ScrollReveal>
                </div>
                <div className="flex-1 w-full lg:w-auto">
                  <ScrollReveal threshold={0.2} delay={200} duration={1} distance={10}>
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <OptimizedImage
                        src={content.historySection.image || content.storyImage || ''}
                        alt="History"
                        className="w-full h-full object-cover"
                      />
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
          <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-gray-50 py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col-reverse lg:flex-row items-start gap-12 lg:gap-20 text-left">
                <div className="flex-1 w-full lg:w-auto">
                  <ScrollReveal threshold={0.2} duration={1} distance={10}>
                    <div className="relative aspect-video overflow-hidden">
                      <OptimizedImage
                        src={content.identitySection.image || ''}
                        alt="Identity"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </ScrollReveal>
                </div>
                <div className="flex-1 lg:max-w-xl">
                  <ScrollReveal threshold={0.2} distance={20}>
                    <h2 className="text-3xl md:text-5xl font-light text-gray-900 mb-8 tracking-tight">
                      {t(content.identitySection.title)}
                    </h2>
                    <div className="text-gray-900 leading-relaxed font-roboto-thin text-lg md:text-xl">
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
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <ScrollReveal threshold={0.2} distance={20}>
                  <h2 className="text-4xl md:text-6xl font-light text-gray-900 mb-16 tracking-tight text-center">
                    {t(content.qualitySection.title)}
                  </h2>
                </ScrollReveal>

                <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start text-left">
                  <div className="lg:w-1/3">
                    <ScrollReveal threshold={0.2} distance={25} delay={100}>
                      <div className="text-gray-900 leading-relaxed font-roboto-thin text-lg md:text-xl">
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
                      <div className="relative aspect-video lg:aspect-[16/9] overflow-hidden">
                        <OptimizedImage
                          src={content.qualitySection.image || ''}
                          alt="Quality"
                          className="w-full h-full object-cover"
                        />
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
    </div>
  )
}
