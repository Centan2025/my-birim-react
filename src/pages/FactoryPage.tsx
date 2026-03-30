import { useState, useEffect } from 'react'
import { getFactoryPageContent } from '../services/cms'
import type { FactoryPageContent, NewsMedia } from '../types'
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
            <div className="relative aspect-video overflow-hidden bg-[var(--bg-secondary)]">
              {m.type === 'video' || m.type === 'youtube' ? (
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
                  alt={`${alt} ${idx + 1}`}
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

export function FactoryPage() {
  const [content, setContent] = useState<FactoryPageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()
  const { setFromPalette, reset } = useHeaderTheme()

  // SEO
  const heroImageObj = typeof content?.heroImage === 'object' ? content.heroImage : null
  const heroImageUrl = heroImageObj
    ? heroImageObj.url
    : typeof content?.heroImage === 'string'
      ? content.heroImage
      : ''

  useSEO({
    title: `BIRIM - ${t('factory') || 'Fabrika'}`,
    description: (content && t(content.heroSubtitle)) || 'Fabrika',
    image: heroImageUrl,
    type: 'website',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'Factory',
  })

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true)
      try {
        const pageContent = await getFactoryPageContent()
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
        typeof content.heroImage === 'object' &&
          content.heroImage !== null &&
          'palette' in content.heroImage
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
    <div className="bg-[var(--bg-primary)] animate-fade-in-up-subtle">
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
              sizes="100vw"
              quality={90}
              crop={heroImageObj?.crop}
              hotspot={heroImageObj?.hotspot}
              origWidth={(heroImageObj as any)?.origWidth}
              origHeight={(heroImageObj as any)?.origHeight}
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
      <div className="bg-[var(--bg-tertiary)] overflow-hidden pb-32 font-light">
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4 text-[11px] sm:text-[12px]">
          <Breadcrumbs
            items={[{ label: t('homepage'), to: '/' }, { label: t('factory') || 'Fabrika' }]}
          />
        </div>

        {/* FACTORY CONTENT */}
        <div className="pt-16 pb-32">
          <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
            {content.content && (
              <div className="max-w-4xl mx-auto text-center mb-24">
                <ScrollReveal threshold={0.2} distance={20}>
                  <div className="text-[var(--text-primary)] leading-relaxed font-roboto-thin text-lg md:text-xl">
                    {(() => {
                      const textContent = t(content.content)
                      const isPortable =
                        Array.isArray(textContent) ||
                        (typeof textContent === 'object' &&
                          textContent !== null &&
                          (textContent as any)._type === 'block')

                      if (isPortable) {
                        const blocks = Array.isArray(textContent)
                          ? textContent
                          : [textContent]
                        return <PortableTextLite value={blocks as any} />
                      }

                      return <p>{textContent as string}</p>
                    })()}
                  </div>
                </ScrollReveal>
              </div>
            )}

            {/* Alt Medyalar (Full Width) */}
            <MediaGallery media={content.gallery} alt={t('factory') as string || 'Factory'} />
          </div>
        </div>
      </div>
    </div>
  )
}
