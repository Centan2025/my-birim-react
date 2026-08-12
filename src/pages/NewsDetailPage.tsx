/* eslint-disable @typescript-eslint/no-explicit-any */
import {useMemo, useEffect, useState, FC} from 'react'
import {useParams, Link} from 'react-router-dom'
import {motion, AnimatePresence} from 'framer-motion'
import type {NewsMedia} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {OptimizedVideo} from '../components/OptimizedVideo'
import {PageLoading} from '../components/LoadingSpinner'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useTranslation} from '../i18n'
import {useNewsItem, useNews} from '../hooks/useNews'
import {useSiteSettings} from '../hooks/useSiteData'
import {analytics} from '../lib/analytics'
import {useSEO} from '../hooks/useSEO'
import PortableTextLite from '../components/PortableTextLite'

const getYouTubeId = (url: string): string | null => {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2] && match[2].length === 11 ? match[2] : null
}

const formatDate = (dateString: string, locale: string = 'tr'): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date
    .toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase()
}

const getCategoryLabel = (category: any, t: (key: string) => string): string => {
  if (!category) return (t('news_press') || 'BASIN').toUpperCase()
  if (typeof category === 'string') {
    const key = category.toLowerCase()
    if (key === 'press') return (t('news_press') || 'BASIN').toUpperCase()
    if (key === 'events') return (t('news_events') || 'SERGİ & ETKİNLİK').toUpperCase()
    if (key === 'awards') return (t('news_awards') || 'ÖDÜLLER').toUpperCase()
    if (key === 'launch') return (t('news_launch') || 'LANSMAN').toUpperCase()
    return category.toUpperCase()
  }
  const translated = t(category)
  if (translated) return translated.toUpperCase()
  return (t('news_press') || 'BASIN').toUpperCase()
}

const MediaComponent: FC<{media: NewsMedia; onImageClick?: (url: string) => void}> = ({
  media,
  onImageClick,
}) => {
  const {t} = useTranslation()
  const {data: settings} = useSiteSettings()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'

  const renderMedia = () => {
    if (media.type === 'image') {
      return (
        /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
        <div
          className="cursor-zoom-in overflow-hidden relative group"
          onClick={() => onImageClick && onImageClick(media.url)}
        >
          <OptimizedImage
            src={media.url}
            srcMobile={media.urlMobile}
            srcDesktop={media.urlDesktop}
            alt={t(media.caption) || ''}
            className={`w-full h-auto object-cover transition-transform duration-700 group-hover:scale-102 ${imageBorderClass}`}
            width={1920}
            loading="lazy"
            quality={95}
            crop={(media as any).crop}
            hotspot={(media as any).hotspot}
            origWidth={(media as any).origWidth}
            origHeight={(media as any).origHeight}
            cropMobile={(media as any).cropMobile}
            hotspotMobile={(media as any).hotspotMobile}
            origWidthMobile={(media as any).origWidthMobile}
            origHeightMobile={(media as any).origHeightMobile}
          />
        </div>
      )
    }
    if (media.type === 'video') {
      const isVideoFile =
        media.url &&
        (media.url.includes('.mp4') ||
          media.url.includes('.webm') ||
          media.url.includes('.mov') ||
          media.url.includes('cdn.sanity.io/files'))
      if (isVideoFile) {
        return (
          <div className="relative w-full" style={{paddingTop: '56.25%'}}>
            <OptimizedVideo
              src={media.url}
              srcMobile={media.urlMobile}
              srcDesktop={media.urlDesktop}
              className={`absolute top-0 left-0 w-full h-full object-cover ${imageBorderClass}`}
              controls
              playsInline
              preload="metadata"
              loading="lazy"
            />
          </div>
        )
      }
      return (
        <div className="relative w-full" style={{paddingTop: '56.25%'}}>
          <iframe
            src={media.url}
            title={t(media.caption) || 'News video'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            className={`absolute top-0 left-0 w-full h-full ${imageBorderClass}`}
          ></iframe>
        </div>
      )
    }
    if (media.type === 'youtube') {
      const videoId = getYouTubeId(media.url)
      if (!videoId) return <p className="text-red-500 text-center">Geçersiz YouTube URL'si</p>
      return (
        <div className="relative w-full" style={{paddingTop: '56.25%'}}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
            title={t(media.caption) || 'YouTube video player'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            className="absolute top-0 left-0 w-full h-full"
          ></iframe>
        </div>
      )
    }
    return null
  }

  return (
    <figure className="my-8">
      {renderMedia()}
      {media.caption && (
        <figcaption className="mt-2 text-center text-xs font-mono text-[var(--text-secondary)]">
          {t(media.caption)}
        </figcaption>
      )}
    </figure>
  )
}

export function NewsDetailPage() {
  const {newsId} = useParams<{newsId: string}>()
  const {data: item, isLoading: loading} = useNewsItem(newsId)
  const {data: allNews = []} = useNews()
  const {t, locale} = useTranslation()

  const [scrollProgress, setScrollProgress] = useState(0)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Scroll Reading Progress Bar calculation
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100)))
      }
    }
    window.addEventListener('scroll', handleScroll, {passive: true})
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const {prevNews, nextNews, relatedArticles} = useMemo(() => {
    if (!item || allNews.length < 2) return {prevNews: null, nextNews: null, relatedArticles: []}
    const currentIndex = allNews.findIndex(n => n.id === item.id)
    if (currentIndex === -1) return {prevNews: null, nextNews: null, relatedArticles: []}
    const prev = currentIndex > 0 ? allNews[currentIndex - 1] : null
    const next = currentIndex < allNews.length - 1 ? allNews[currentIndex + 1] : null
    const related = allNews.filter(n => n.id !== item.id).slice(0, 2)
    return {prevNews: prev, nextNews: next, relatedArticles: related}
  }, [item, allNews])

  const newsTitle = item ? t(item.title) : ''
  const newsDescription = item ? t(item.content) || newsTitle : ''
  const mainImageObj = typeof item?.mainImage === 'object' ? item.mainImage : null
  const mainImageUrl = mainImageObj
    ? mainImageObj.url
    : typeof item?.mainImage === 'string'
      ? item.mainImage
      : undefined

  const additionalMedia = useMemo(() => {
    if (!item?.media) return []
    return item.media.filter(media => {
      if (!media.url) return false
      if (media.isCover) return false
      if (mainImageUrl && media.url === mainImageUrl) return false
      return true
    })
  }, [item?.media, mainImageUrl])

  useSEO({
    title: newsTitle ? `BIRIM - ${t('news') || 'Haberler'} - ${newsTitle}` : 'BIRIM - Haberler',
    description: newsDescription || 'BIRIM ile ilgili güncel haberler ve duyurular',
    image: mainImageUrl,
    type: 'article',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'News',
    publishedTime: item?.date,
    schema: item
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          '@id': `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/news/${newsId}#article`,
          headline: newsTitle || t(item.title),
          description: newsDescription || t(item.content),
          image: mainImageUrl,
          datePublished: item.date,
          dateModified: item._updatedAt || item.date,
          author: {
            '@type': 'Person',
            name: 'BIRIM',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com',
          },
          publisher: {
            '@id': `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/#organization`,
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': typeof window !== 'undefined' ? window.location.href : '',
          },
        }
      : undefined,
  })

  useEffect(() => {
    if (!item) return
    if (typeof window === 'undefined') return

    const pageTitle = `BIRIM - ${t('news') || 'Haberler'} - ${t(item.title)}`
    analytics.pageview(window.location.pathname, pageTitle)

    analytics.event({
      category: 'news',
      action: 'view_news',
      label: t(item.title),
    })
  }, [item, t])

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  if (loading) {
    return (
      <div className="pt-28 bg-[var(--bg-primary)] min-h-screen">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="pt-28 text-center bg-[var(--bg-primary)] min-h-screen text-[var(--text-primary)] font-light">
        {t('news_not_found')}
      </div>
    )
  }

  return (
    <div
      key={newsId}
      className="bg-[var(--bg-primary)] min-h-screen animate-fade-in-up-subtle pt-20 md:pt-20 lg:pt-20"
    >
      {/* Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[2px] bg-[var(--text-primary)] z-50 transition-all duration-150"
        style={{width: `${scrollProgress}%`}}
      />

      {/* Lightbox Image Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
          >
            <img
              src={lightboxImage}
              alt="Fullscreen View"
              className="max-w-full max-h-[90vh] object-contain shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-6 right-6 text-white text-2xl font-mono p-2 hover:opacity-75 transition-opacity"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumbs */}
      <div className="w-full relative z-20">
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4">
          <Breadcrumbs
            items={[
              {label: t('homepage'), to: '/'},
              {label: t('news'), to: '/news'},
              {label: t(item.title)},
            ]}
          />
        </div>
      </div>

      <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-4 md:pt-8 pb-24">
        {/* Article Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-primary)] pb-6 mb-8 md:mb-12">
          <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider">
            <span>{formatDate(item.date, locale)}</span>
            {item.category && (
              <>
                <span>•</span>
                <span>{getCategoryLabel(item.category, t)}</span>
              </>
            )}
          </div>

          {/* Social Share & Press Kit Actions */}
          <div className="flex items-center gap-4 text-xs font-mono tracking-widest uppercase">
            <button
              onClick={handleCopyLink}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors relative"
            >
              {copiedLink ? t('link_copied') || 'KOPYALANDI ✓' : t('share_article') || 'PAYLAŞ'}
            </button>

            {item.pressKitUrl && (
              <a
                href={item.pressKitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[var(--border-primary)] px-3 py-1 text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"
              >
                {t('download_press_kit') || 'BASIN KİTİ'} ↓
              </a>
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-light text-[var(--text-primary)] uppercase tracking-tight leading-tight mb-10 md:mb-16">
          {t(item.title)}
        </h1>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          {/* Main Cover & Media */}
          <div className="lg:col-span-7 flex flex-col w-full">
            {mainImageUrl && (
              /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
              <div
                className="cursor-zoom-in overflow-hidden mb-8 border border-[var(--border-primary)]/40"
                onClick={() => setLightboxImage(mainImageUrl)}
              >
                <OptimizedImage
                  src={mainImageUrl || ''}
                  srcMobile={mainImageObj?.urlMobile}
                  srcDesktop={mainImageObj?.urlDesktop}
                  alt={t(item.title)}
                  className="w-full h-auto object-cover transition-transform duration-700 hover:scale-102"
                  width={1920}
                  height={1080}
                  loading="eager"
                  quality={95}
                />
              </div>
            )}

            {additionalMedia.map((media, index) => (
              <MediaComponent
                key={index}
                media={media}
                onImageClick={url => setLightboxImage(url)}
              />
            ))}
          </div>

          {/* Article Text Content */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 flex flex-col w-full">
            <div className="text-[var(--text-primary)] leading-relaxed font-light text-base md:text-lg space-y-6">
              {(() => {
                const content = t(item.content)
                const isPortableText =
                  Array.isArray(content) ||
                  (typeof content === 'object' &&
                    content !== null &&
                    (content as any)._type === 'block')

                if (isPortableText) {
                  const blocks = Array.isArray(content) ? content : [content]
                  return <PortableTextLite value={blocks} />
                }

                return (
                  <p className="text-[var(--text-primary)] leading-relaxed font-light text-base md:text-lg whitespace-pre-line">
                    {content as string}
                  </p>
                )
              })()}
            </div>

            {/* Related Designer or Product Tag Link if present */}
            {(item.relatedDesignerId || item.relatedProductId) && (
              <div className="mt-12 pt-6 border-t border-[var(--border-primary)] flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">
                {item.relatedDesignerId && (
                  <Link
                    to={`/designers/${item.relatedDesignerId}`}
                    className="hover:text-[var(--text-primary)] transition-colors"
                  >
                    → {t('view_designer') || 'Tasarımcıyı Gör'}
                  </Link>
                )}
                {item.relatedProductId && (
                  <Link
                    to={`/products/${item.relatedProductId}`}
                    className="hover:text-[var(--text-primary)] transition-colors"
                  >
                    → {t('view_product') || 'Ürünü İncele'}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Prev / Next Article Navigation */}
        {(prevNews || nextNews) && (
          <div className="mt-20 md:mt-32 pt-10 border-t border-[var(--border-primary)] grid grid-cols-1 md:grid-cols-2 gap-8">
            {prevNews ? (
              <Link
                to={`/news/${prevNews.id}`}
                className="group flex items-center gap-4 p-4 border border-[var(--border-primary)] hover:border-[var(--text-primary)]/50 transition-colors"
              >
                <div className="w-20 h-16 overflow-hidden flex-shrink-0">
                  <OptimizedImage
                    src={
                      typeof prevNews.mainImage === 'string'
                        ? prevNews.mainImage
                        : prevNews.mainImage?.url || ''
                    }
                    alt={t(prevNews.title)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    width={160}
                    height={120}
                  />
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase text-[var(--text-secondary)] tracking-widest block mb-1">
                    ← {t('previous_news') || 'ÖNCEKİ HABER'}
                  </span>
                  <h3 className="text-sm font-light text-[var(--text-primary)] uppercase line-clamp-1 group-hover:text-[var(--text-secondary)] transition-colors">
                    {t(prevNews.title)}
                  </h3>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextNews && (
              <Link
                to={`/news/${nextNews.id}`}
                className="group flex items-center justify-between gap-4 p-4 border border-[var(--border-primary)] hover:border-[var(--text-primary)]/50 transition-colors text-right"
              >
                <div className="text-right ml-auto">
                  <span className="text-[9px] font-mono uppercase text-[var(--text-secondary)] tracking-widest block mb-1">
                    {t('next_news') || 'SONRAKİ HABER'} →
                  </span>
                  <h3 className="text-sm font-light text-[var(--text-primary)] uppercase line-clamp-1 group-hover:text-[var(--text-secondary)] transition-colors">
                    {t(nextNews.title)}
                  </h3>
                </div>
                <div className="w-20 h-16 overflow-hidden flex-shrink-0">
                  <OptimizedImage
                    src={
                      typeof nextNews.mainImage === 'string'
                        ? nextNews.mainImage
                        : nextNews.mainImage?.url || ''
                    }
                    alt={t(nextNews.title)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    width={160}
                    height={120}
                  />
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Related Articles Modülü */}
        {relatedArticles.length > 0 && (
          <div className="mt-20">
            <h2 className="text-xl font-light text-[var(--text-primary)] uppercase tracking-wider mb-8 border-b border-[var(--border-primary)] pb-4">
              {t('related_news') || 'DİĞER HABERLER'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedArticles.map(relItem => (
                <Link
                  key={relItem.id}
                  to={`/news/${relItem.id}`}
                  className="group block border border-[var(--border-primary)] p-5 hover:border-[var(--text-primary)]/40 transition-colors"
                >
                  <div className="h-44 overflow-hidden mb-4">
                    <OptimizedImage
                      src={
                        typeof relItem.mainImage === 'string'
                          ? relItem.mainImage
                          : relItem.mainImage?.url || ''
                      }
                      alt={t(relItem.title)}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      width={600}
                      height={400}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-wider block mb-2">
                    {formatDate(relItem.date, locale)}
                  </span>
                  <h3 className="text-lg font-light text-[var(--text-primary)] uppercase group-hover:text-[var(--text-secondary)] transition-colors line-clamp-2">
                    {t(relItem.title)}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
