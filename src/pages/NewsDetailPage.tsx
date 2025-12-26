import { useMemo, useEffect, FC, SVGProps } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { NewsMedia } from '../types'
import { OptimizedImage } from '../components/OptimizedImage'
import { OptimizedVideo } from '../components/OptimizedVideo'
import { PageLoading } from '../components/LoadingSpinner'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { useTranslation } from '../i18n'
import { useNewsItem, useNews } from '../hooks/useNews'
import { useSiteSettings } from '../hooks/useSiteData'
import { analytics } from '../lib/analytics'
import { useSEO } from '../hooks/useSEO'
import { addStructuredData, getArticleSchema } from '../lib/seo'
import PortableTextLite from '../components/PortableTextLite'

const getYouTubeId = (url: string): string | null => {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2] && match[2].length === 11 ? match[2] : null
}

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

const MediaComponent: FC<{ media: NewsMedia }> = ({ media }) => {
  const { t } = useTranslation()
  const { data: settings } = useSiteSettings()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'

  const renderMedia = () => {
    if (media.type === 'image') {
      return (
        <OptimizedImage
          src={media.url}
          srcMobile={media.urlMobile}
          srcDesktop={media.urlDesktop}
          alt={t(media.caption) || ''}
          className={`w-full h-auto object-cover ${imageBorderClass}`}
          loading="lazy"
          quality={85}
        />
      )
    }
    if (media.type === 'video') {
      // Video dosyası mı yoksa URL mi kontrol et
      const isVideoFile =
        media.url &&
        (media.url.includes('.mp4') ||
          media.url.includes('.webm') ||
          media.url.includes('.mov') ||
          media.url.includes('cdn.sanity.io/files'))
      if (isVideoFile) {
        return (
          <div className="relative w-full" style={{ paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
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
      // URL ise iframe kullan (harici video servisleri için)
      return (
        <div className="relative w-full" style={{ paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
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
        <div className="relative w-full" style={{ paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
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
        <figcaption className="mt-2 text-center text-sm text-gray-500">
          {t(media.caption)}
        </figcaption>
      )}
    </figure>
  )
}

const MinimalChevronLeft = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
)

const MinimalChevronRight = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export function NewsDetailPage() {
  const { newsId } = useParams<{ newsId: string }>()
  const { data: item, isLoading: loading } = useNewsItem(newsId)
  const { data: allNews = [] } = useNews()
  const { t } = useTranslation()
  const { data: settings } = useSiteSettings()
  const showBottomPrevNext = Boolean(settings?.showProductPrevNext)

  const { prevNews, nextNews } = useMemo(() => {
    if (!item || allNews.length < 2) return { prevNews: null, nextNews: null }
    const currentIndex = allNews.findIndex(n => n.id === item.id)
    if (currentIndex === -1) return { prevNews: null, nextNews: null }
    const prev = currentIndex > 0 ? allNews[currentIndex - 1] : null
    const next = currentIndex < allNews.length - 1 ? allNews[currentIndex + 1] : null
    return { prevNews: prev, nextNews: next }
  }, [item, allNews])

  // SEO ve Analytics: haber detay görüntüleme
  const newsTitle = item ? t(item.title) : ''
  const newsDescription = item ? t(item.content) || newsTitle : ''
  const mainImageUrl =
    item && typeof item.mainImage === 'string'
      ? item.mainImage
      : (item?.mainImage && typeof item.mainImage === 'object' ? item.mainImage.url : '') || undefined

  useSEO({
    title: newsTitle ? `BIRIM - ${t('news') || 'Haberler'} - ${newsTitle}` : 'BIRIM - Haberler',
    description: newsDescription || 'BIRIM ile ilgili güncel haberler ve duyurular',
    image: mainImageUrl,
    type: 'article',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'News',
    publishedTime: item?.date,
  })

  useEffect(() => {
    if (!item) return
    if (typeof window === 'undefined') return

    const pageTitle = `BIRIM - ${t('news') || 'Haberler'} - ${t(item.title)}`
    analytics.pageview(window.location.pathname, pageTitle)

    analytics.event({
      category: 'news',
      action: 'view_news',
      label: t(item.title), // ID yerine haber başlığı
    })
  }, [item, t])

  // Structured Data (Article)
  useEffect(() => {
    if (!item) return

    const schema = getArticleSchema({
      headline: newsTitle || t(item.title),
      description: newsDescription || t(item.content),
      image: mainImageUrl,
      datePublished: item.date,
      author: {
        name: 'BIRIM',
      },
      publisher: {
        name: 'BIRIM',
        logo: settings?.logoUrl,
      },
    })

    addStructuredData(schema, 'news-article-schema')
  }, [item, newsTitle, newsDescription, mainImageUrl, settings?.logoUrl])

  if (loading) {
    return (
      <div className="pt-28">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  if (!item) {
    return <div className="pt-28 text-center">{t('news_not_found')}</div>
  }

  return (
    <div key={newsId} className="bg-white animate-fade-in-up-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 lg:pt-24 pb-16">
        <div className="w-full">
          {/* Breadcrumbs - diğer sayfalarla aynı hizalama */}
          <Breadcrumbs
            className="mb-8"
            items={[
              { label: t('homepage'), to: '/' },
              { label: t('news'), to: '/news' },
              { label: t(item.title) },
            ]}
          />

          <div className="max-w-4xl mx-auto">
            <article>
              <div className="mt-6 md:mt-8 mb-6">
                <p className="text-sm text-gray-500 mb-3 font-light">{formatDate(item.date)}</p>
                {/* Başlık altındaki gri çizgi – tam ekran (proje sayfasıyla aynı) */}
                <div className="mt-2 md:mt-3 lg:mt-2 relative left-1/2 right-1/2 -mx-[50vw] w-screen">
                  <div className="h-px bg-gray-300 w-full"></div>
                </div>
              </div>

              <OptimizedImage
                src={
                  typeof item.mainImage === 'string'
                    ? item.mainImage
                    : (item.mainImage && typeof item.mainImage === 'object'
                      ? item.mainImage.url
                      : '') || ''
                }
                srcMobile={
                  typeof item.mainImage === 'object' && item.mainImage
                    ? item.mainImage.urlMobile
                    : undefined
                }
                srcDesktop={
                  typeof item.mainImage === 'object' && item.mainImage
                    ? item.mainImage.urlDesktop
                    : undefined
                }
                alt={t(item.title)}
                className={`w-full h-auto object-cover mb-6 ${settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'}`}
                width={1200}
                height={675}
                loading="eager"
                quality={90}
              />
            </article>
          </div>
        </div>

        {/* Gray content area with breakout pattern - matches ProjectDetailPage */}
        <div className="mt-8 relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-gray-700 mb-6">
                {t(item.title)}
              </h1>
              <div className="prose prose-lg lg:prose-xl text-gray-900 max-w-none w-full px-4 sm:px-0">
                {(() => {
                  const content = t(item.content)
                  return Array.isArray(content) ? (
                    <PortableTextLite value={content} />
                  ) : (
                    <p className="font-normal">{content}</p>
                  )
                })()}
              </div>

              <div className="mt-12 space-y-12">
                {item.media.map((media, index) => (
                  <MediaComponent key={index} media={media} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Prev / Next controls - footer'ın hemen üzerinde, project sayfasındaki gibi hizalı */}
        {showBottomPrevNext && (prevNews || nextNews) && (
          <div className="bg-white border-t border-gray-200 mt-0">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  {prevNews ? (
                    <Link
                      to={`/news/${prevNews.id}`}
                      className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      aria-label="Previous news"
                    >
                      <MinimalChevronLeft className="w-12 h-12 md:w-16 md:h-16" />
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>
                <div className="flex-1 text-right">
                  {nextNews ? (
                    <Link
                      to={`/news/${nextNews.id}`}
                      className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      aria-label="Next news"
                    >
                      <MinimalChevronRight className="w-12 h-12 md:w-16 md:h-16" />
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
