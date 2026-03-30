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
import { FullscreenMediaViewer } from '../components/FullscreenMediaViewer/FullscreenMediaViewer'

// Alt Medya Galerisi Bileşeni - Ekranı sağdan sola kaplayan tam genişlik (breakout) yapı
const MediaGallery = ({ media, alt }: { media?: NewsMedia[]; alt: string }) => {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [initialIndex, setInitialIndex] = useState(0)

  if (!media || media.length === 0) return null

  const openViewer = (index: number) => {
    setInitialIndex(index)
    setViewerOpen(true)
  }

  // FullscreenMediaViewer için medyayı dönüştür
  const viewerItems = media.map(m => ({
    type: (m.type === 'youtube' ? 'youtube' : m.type === 'video' ? 'video' : 'image') as 'image' | 'video' | 'youtube',
    url: m.url,
    urlMobile: m.urlMobile,
    urlDesktop: m.urlDesktop,
    crop: m.crop,
    hotspot: m.hotspot
  }))

  return (
    <>
      <div className="mt-20 relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {media.map((m, idx) => (
            <ScrollReveal key={idx} delay={idx * 100} distance={10} threshold={0.1}>
              <div 
                className="relative aspect-video overflow-hidden bg-[var(--bg-secondary)] cursor-pointer group"
                onClick={() => openViewer(idx)}
              >
                {m.type === 'video' || m.type === 'youtube' ? (
                  <div className="w-full h-full relative">
                    <video
                      src={m.url}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300 flex items-center justify-center">
                       <div className="w-12 h-12 rounded-full border border-white/50 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    <OptimizedImage
                      src={m.url}
                      srcMobile={m.urlMobile}
                      srcDesktop={m.urlDesktop}
                      alt={`${alt} ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      crop={m.crop}
                      hotspot={m.hotspot}
                      origWidth={m.origWidth}
                      origHeight={m.origHeight}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {viewerOpen && (
        <FullscreenMediaViewer
          items={viewerItems}
          initialIndex={initialIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  )
}

export function FactoryPage() {
  const [content, setContent] = useState<FactoryPageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const { t, locale } = useTranslation()
  const { reset } = useHeaderTheme()

  // SEO
  const firstImageUrl = content?.gallery?.[0]?.url || ''

  useSEO({
    title: `BIRIM - ${t('factory') || 'Fabrika'}`,
    description: (content && t(content.heroSubtitle)) || 'Fabrika',
    image: firstImageUrl,
    type: 'website',
    siteName: 'BIRIM',
    locale: locale === 'tr' ? 'tr_TR' : 'en_US',
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

  // Fabrika sayfası için koyu/açık tema sıfırlaması
  useEffect(() => {
    reset()
    return () => reset()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading || !content) {
    return (
      <div className="pt-24">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-tertiary)] min-h-screen animate-fade-in-up-subtle">
      {/* Header Space & Breadcrumbs */}
       <div className="pt-32 pb-4">
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 text-[11px] sm:text-[12px]">
          <Breadcrumbs
            items={[{ label: t('homepage'), to: '/' }, { label: t('factory') || 'Fabrika' }]}
          />
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="overflow-hidden pb-32 font-light">
        {/* FACTORY HEADER & CONTENT */}
        <div className="pt-8 pb-32">
          <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
            
            {/* Title Section */}
            <div className="max-w-4xl mb-16">
               <ScrollReveal delay={100} duration={1.2} distance={15}>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tighter uppercase leading-none text-[var(--text-primary)]">
                  {t(content.heroTitle)}
                </h1>
              </ScrollReveal>
              {content.heroSubtitle && (
                <ScrollReveal delay={300} duration={1.2} distance={20}>
                  <p className="mt-8 text-lg md:text-2xl text-[var(--text-primary)] opacity-80 max-w-2xl font-light leading-relaxed">
                    {t(content.heroSubtitle)}
                  </p>
                </ScrollReveal>
              )}
            </div>

            {/* Rich Text Content */}
            {content.content && (
              <div className="max-w-4xl text-left mb-24">
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
