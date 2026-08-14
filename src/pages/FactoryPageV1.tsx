import {useState, useEffect} from 'react'
import {motion} from 'framer-motion'
import {getFactoryPageContent} from '../services/cms'
import type {FactoryPageContent, NewsMedia} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useSEO} from '../hooks/useSEO'
import {useHeaderTheme} from '../context/HeaderThemeContext'
import ScrollReveal from '../components/ScrollReveal'
import PortableTextLite from '../components/PortableTextLite'
import {FullscreenMediaViewer} from '../components/FullscreenMediaViewer/FullscreenMediaViewer'

// Alt Medya Galerisi Bileşeni - Ekranı sağdan sola kaplayan tam genişlik (breakout) yapı
const MediaGallery = ({media, alt}: {media?: NewsMedia[]; alt: string}) => {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [initialIndex, setInitialIndex] = useState(0)

  if (!media || media.length === 0) return null

  const openViewer = (index: number) => {
    setInitialIndex(index)
    setViewerOpen(true)
  }

  // FullscreenMediaViewer için medyayı dönüştür
  const viewerItems = media.map(m => ({
    type: (m.type === 'youtube' ? 'youtube' : m.type === 'video' ? 'video' : 'image') as
      | 'image'
      | 'video'
      | 'youtube',
    url: m.url,
    urlMobile: m.urlMobile,
    urlDesktop: m.urlDesktop,
    crop: m.crop,
    hotspot: m.hotspot,
  }))

  return (
    <>
      <div className="relative w-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {media.map((m, idx) => (
            <ScrollReveal key={idx} delay={idx * 80} distance={15} threshold={0.1}>
              <div
                className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-secondary)] border border-neutral-500/20 cursor-pointer group"
                onClick={() => openViewer(idx)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openViewer(idx)
                  }
                }}
                role="button"
                tabIndex={0}
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
                    <div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors duration-300 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full border border-white/60 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-0 h-0 border-t-[7px] border-t-transparent border-l-[12px] border-l-white border-b-[7px] border-b-transparent ml-1" />
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
                      origWidth={m.origWidth as number}
                      origHeight={m.origHeight as number}
                      quality={90}
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

export function FactoryPageV1() {
  const [content, setContent] = useState<FactoryPageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const {t, locale} = useTranslation()
  const {reset} = useHeaderTheme()

  // SEO
  const firstImageUrl = content?.gallery?.[0]?.url || ''

  useSEO({
    title: `BIRIM - ${t('factory') || 'Fabrika'}`,
    description: (content && t(content.title)) || 'Fabrika',
    image: firstImageUrl,
    type: 'website',
    siteName: 'BIRIM',
    locale: locale === 'tr' ? 'tr_TR' : 'en_US',
    section: 'Factory',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ManufacturingBusiness',
      name: 'BIRIM - Üretim Tesisi',
      description: (content && t(content.title)) || 'BIRIM mobilya üretim tesisi',
      url: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/#/factory`,
      ...(firstImageUrl && {image: firstImageUrl}),
      parentOrganization: {
        '@id': `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/#organization`,
      },
    },
  })

  useEffect(() => {
    let isMounted = true
    const fetchContent = async () => {
      setLoading(true)
      try {
        const pageContent = await getFactoryPageContent()
        if (isMounted) {
          setContent(pageContent || null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchContent()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    reset()
    return () => reset()
  }, [reset])

  if (loading || !content) {
    return (
      <div className="pt-24 min-h-screen bg-[var(--bg-primary)]">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  const containerClass =
    'w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0'

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen animate-fade-in-up-subtle pt-20 md:pt-16 lg:pt-20 selection:bg-primary selection:text-black">
      {/* Top Section: Breadcrumb & Title */}
      <div>
        {/* Breadcrumb Band */}
        <div className="w-full relative z-20">
          <div className={containerClass + ' py-3 text-gray-400'}>
            <Breadcrumbs
              items={[{label: t('homepage'), to: '/'}, {label: t('factory') || 'Fabrika'}]}
            />
          </div>
        </div>

        {/* Sayfa Başlığı */}
        <div className={containerClass + ' pt-2 md:pt-6 pb-6 md:pb-8 text-center'}>
          <motion.div
            initial={{opacity: 0, y: 15}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.8, ease: 'easeOut'}}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)] tracking-tight uppercase text-center">
              {t(content.title) || t('factory') || 'FABRİKA'}
            </h1>
          </motion.div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className={containerClass + ' pb-16 md:pb-24 font-light overflow-hidden'}>
        {/* FACTORY CONTENT */}
        <div className="flex flex-col items-start">
          {/* Rich Text Content */}
          {content.content && (
            <div className="max-w-5xl text-left mb-16">
              <ScrollReveal threshold={0.2} distance={20}>
                <div className="text-[var(--text-primary)] leading-relaxed font-roboto-thin text-lg md:text-xl [&_p:first-child]:mt-0">
                  {(() => {
                    const textContent = t(content.content)
                    const isPortable =
                      Array.isArray(textContent) ||
                      (typeof textContent === 'object' &&
                        textContent !== null &&
                        (textContent as Record<string, unknown>)['_type'] === 'block')

                    if (isPortable) {
                      const blocks = Array.isArray(textContent) ? textContent : [textContent]
                      return (
                        <PortableTextLite
                          value={blocks as Parameters<typeof PortableTextLite>[0]['value']}
                        />
                      )
                    }

                    return <p>{textContent as string}</p>
                  })()}
                </div>
              </ScrollReveal>
            </div>
          )}

          {/* Galeri */}
          {content.gallery && content.gallery.length > 0 && (
            <div className="w-full pt-0">
              <MediaGallery media={content.gallery} alt={(t('factory') as string) || 'Factory'} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
