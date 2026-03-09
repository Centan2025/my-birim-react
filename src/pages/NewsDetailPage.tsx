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
          crop={(media as any).crop}
          hotspot={(media as any).hotspot}
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

/* Thin minimal arrow: horizontal line with angled tip, no bottom serifs */
const ArrowLeft = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="0.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* angled tip */}
    <path d="M8 6 2 12" />
    {/* horizontal line */}
    <path d="M2 12h20" />
  </svg>
)

const ArrowRight = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="0.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* angled tip */}
    <path d="M16 6 22 12" />
    {/* horizontal line */}
    <path d="M22 12H2" />
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
  const mainImageObj = typeof item?.mainImage === 'object' ? item.mainImage : null
  const mainImageUrl = mainImageObj
    ? mainImageObj.url
    : typeof item?.mainImage === 'string'
      ? item.mainImage
      : undefined

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
  }, [item, newsTitle, newsDescription, mainImageUrl, settings?.logoUrl, t])

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
    <div key={newsId} className="bg-gray-100 animate-fade-in-up-subtle pt-20 md:pt-24 lg:pt-24">
      {/* Breadcrumb Band */}
      <div className="w-full relative z-20">
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4">
          <Breadcrumbs
            items={[
              { label: t('homepage'), to: '/' },
              { label: t('news'), to: '/news' },
              { label: t(item.title) },
            ]}
          />
        </div>
      </div>

      <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-6 md:pt-8 pb-16">
        {/* Prev / Next arrows at top of content block */}
        {showBottomPrevNext && (prevNews || nextNews) && (
          <div className="flex items-center justify-between mb-6">
            <div>
              {prevNews ? (
                <Link
                  to={`/news/${prevNews.id}`}
                  className="inline-flex items-center text-gray-400 hover:text-gray-800 transition-colors"
                  aria-label="Previous news"
                >
                  <ArrowLeft className="w-7 h-7 md:w-8 md:h-8" />
                </Link>
              ) : (
                <span className="w-7 h-7 md:w-8 md:h-8" />
              )}
            </div>
            <div>
              {nextNews ? (
                <Link
                  to={`/news/${nextNews.id}`}
                  className="inline-flex items-center text-gray-400 hover:text-gray-800 transition-colors"
                  aria-label="Next news"
                >
                  <ArrowRight className="w-7 h-7 md:w-8 md:h-8" />
                </Link>
              ) : (
                <span className="w-7 h-7 md:w-8 md:h-8" />
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Sol Kolon: Görseller (Main Image + Media) */}
          <div className="flex flex-col w-full overflow-hidden">
            {mainImageUrl && (
              <OptimizedImage
                src={mainImageUrl || ''}
                srcMobile={mainImageObj?.urlMobile}
                srcDesktop={mainImageObj?.urlDesktop}
                alt={t(item.title)}
                className={`w-full h-auto object-cover ${settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'}`}
                width={1200}
                height={675}
                loading="eager"
                quality={90}
                crop={(mainImageObj as any)?.crop}
                hotspot={(mainImageObj as any)?.hotspot}
              />
            )}

            <div className="flex flex-col">
              {item.media && item.media.map((media, index) => (
                <MediaComponent key={index} media={media} />
              ))}
            </div>
          </div>

          {/* Sağ Kolon: Detaylar ve İçerik */}
          <div className="lg:sticky lg:top-32 flex flex-col w-full">
            <p className="text-sm text-gray-500 mb-4 font-light">{formatDate(item.date)}</p>
            <div className="h-px bg-gray-300 w-full mb-6"></div>

            <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-gray-700 mb-8">
              {t(item.title)}
            </h1>

            <div className="text-gray-900 leading-relaxed font-roboto-thin text-lg md:text-xl max-w-none w-full">
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
                  <p className="text-gray-900 leading-relaxed font-roboto-thin text-lg md:text-xl">
                    {content as string}
                  </p>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
