import React, {useMemo} from 'react'
import {useParams, Link} from 'react-router-dom'
import type {NewsMedia} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {OptimizedVideo} from '../components/OptimizedVideo'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {useNewsItem, useNews} from '../src/hooks/useNews'
import {useSiteSettings} from '../src/hooks/useSiteData'

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

const MediaComponent: React.FC<{media: NewsMedia}> = ({media}) => {
  const {t} = useTranslation()
  const {data: settings} = useSiteSettings()
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
          <div className="relative w-full" style={{paddingTop: '56.25%' /* 16:9 Aspect Ratio */}}>
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
        <div className="relative w-full" style={{paddingTop: '56.25%' /* 16:9 Aspect Ratio */}}>
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
        <div className="relative w-full" style={{paddingTop: '56.25%' /* 16:9 Aspect Ratio */}}>
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

const MinimalChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
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

const MinimalChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
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
  const {newsId} = useParams<{newsId: string}>()
  const {data: item, isLoading: loading} = useNewsItem(newsId)
  const {data: allNews = []} = useNews()
  const {t} = useTranslation()
  const {data: settings} = useSiteSettings()
  const showBottomPrevNext = Boolean(settings?.showProductPrevNext)

  const {prevNews, nextNews} = useMemo(() => {
    if (!item || allNews.length < 2) return {prevNews: null, nextNews: null}
    const currentIndex = allNews.findIndex(n => n.id === item.id)
    if (currentIndex === -1) return {prevNews: null, nextNews: null}
    const prev = currentIndex > 0 ? allNews[currentIndex - 1] : null
    const next = currentIndex < allNews.length - 1 ? allNews[currentIndex + 1] : null
    return {prevNews: prev, nextNews: next}
  }, [item, allNews])

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

  // By adding a `key` prop here, we ensure that React treats navigations
  // between different news items as distinct components, automatically resetting state.
  return (
    <div key={newsId} className="bg-white animate-fade-in-up-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-0">
        <div className="max-w-4xl mx-auto">
          <nav className="mb-8 text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="list-none p-0 inline-flex items-center">
              <li>
                <Link to="/" className="hover:text-gray-800">
                  {t('homepage')}
                </Link>
              </li>
              <li className="mx-2 font-light text-gray-400">|</li>
              <li>
                <Link to="/news" className="hover:text-gray-800">
                  {t('news')}
                </Link>
              </li>
            </ol>
          </nav>

          <article>
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-3 font-light">{formatDate(item.date)}</p>
              <div className="h-px bg-gray-300"></div>
            </div>

            <OptimizedImage
              src={typeof item.mainImage === 'string' ? item.mainImage : (item.mainImage && typeof item.mainImage === 'object' ? item.mainImage.url : '') || ''}
              srcMobile={typeof item.mainImage === 'object' && item.mainImage ? item.mainImage.urlMobile : undefined}
              srcDesktop={
                typeof item.mainImage === 'object' && item.mainImage ? item.mainImage.urlDesktop : undefined
              }
              alt={t(item.title)}
              className={`w-full h-auto object-cover mb-6 ${settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'}`}
              loading="eager"
              quality={90}
            />
          </article>
        </div>
      </div>

      <div className="bg-gray-100 w-full pt-6 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-gray-600 mb-4">
              {t(item.title)}
            </h1>
            <div className="flex items-center min-h-[200px]">
              <div className="prose prose-lg lg:prose-xl text-gray-700 max-w-none w-full [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
                <p className="font-light">{t(item.content)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <article>
            <div className="mt-12">
              {item.media.map((media, index) => (
                <MediaComponent key={index} media={media} />
              ))}
            </div>
          </article>
        </div>
      </div>

      {/* Bottom Prev / Next controls */}
      {showBottomPrevNext && (prevNews || nextNews) && (
        <div className="bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
  )
}
