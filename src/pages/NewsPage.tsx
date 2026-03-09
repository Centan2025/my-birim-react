import React from 'react'
import { Link } from 'react-router-dom'
import type { NewsItem } from '../types'
import { OptimizedImage } from '../components/OptimizedImage'
import { PageLoading } from '../components/LoadingSpinner'
import { useTranslation } from '../i18n'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { useNews } from '../hooks/useNews'
import { useSEO } from '../hooks/useSEO'
import ScrollReveal from '../components/ScrollReveal'

// Helper to convert Sanity block content to plain text
const blockToPlainText = (blocks: any): string => {
  if (!blocks) return ''
  if (typeof blocks === 'string') return blocks
  if (!Array.isArray(blocks)) return ''
  return blocks
    .map(block => {
      if (block._type !== 'block' || !block.children) {
        return ''
      }
      return block.children.map((child: any) => child.text).join('')
    })
    .join(' ')
}

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

const NewsCard: React.FC<{ item: NewsItem }> = ({ item }) => {
  const { t } = useTranslation()

  // Extract a summary from content if available
  const getSummary = () => {
    const translatedContent = t(item.content)
    const plainText = blockToPlainText(translatedContent)
    if (plainText) {
      return plainText.substring(0, 160).trim() + '...'
    }
    return ''
  }

  const summary = getSummary()

  return (
    <div className="group border-b border-gray-300 pb-16 mb-16 last:border-0 last:mb-0">
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
        {/* Text Content */}
        <div className="flex-1 order-2 md:order-1">
          <p className="text-sm text-gray-500 mb-2 font-light">{formatDate(item.date)}</p>
          <Link to={`/news/${item.id}`} className="block mb-6">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-light tracking-tight text-gray-900 group-hover:text-gray-600 transition-colors duration-300 leading-tight uppercase">
              {t(item.title)}
            </h2>
          </Link>

          <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-2xl font-light">
            {summary}
          </p>

          <Link
            to={`/news/${item.id}`}
            className="inline-flex items-center text-[11px] font-bold tracking-[0.2em] uppercase text-gray-900 transition-all duration-300"
          >
            <span>{t('continue_reading') || 'İÇERİĞİN DEVAMI'}</span>
          </Link>
        </div>

        {/* Image */}
        <Link
          to={`/news/${item.id}`}
          className="w-full md:w-[40%] aspect-[4/3] md:aspect-[3/2] overflow-hidden rounded-sm order-1 md:order-2"
        >
          <OptimizedImage
            src={typeof item.mainImage === 'string' ? item.mainImage : item.mainImage?.url || ''}
            srcMobile={typeof item.mainImage === 'object' ? item.mainImage.urlMobile : undefined}
            srcDesktop={typeof item.mainImage === 'object' ? item.mainImage.urlDesktop : undefined}
            alt={t(item.title)}
            className="w-full h-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-110"
            width={1200}
            height={800}
            loading="lazy"
            quality={90}
          />
        </Link>
      </div>
    </div>
  )
}

export function NewsPage() {
  const { data: news = [], isLoading: loading } = useNews()
  const { t } = useTranslation()

  // SEO meta
  useSEO({
    title: `BIRIM - ${t('news') || 'Haberler'}`,
    description: 'BIRIM ile ilgili güncel haberler, duyurular ve basın içerikleri',
    type: 'article',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'News',
  })

  if (loading) {
    return (
      <div className="pt-20">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  const containerClass = "w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0"

  return (
    <div className="bg-gray-100 min-h-screen animate-fade-in-up-subtle pt-20 md:pt-24 lg:pt-24">
      {/* Breadcrumb Band */}
      <div className="w-full relative z-20">
        <div className={containerClass + " py-4"}>
          <Breadcrumbs
            items={[{ label: t('homepage'), to: '/' }, { label: t('news') }]}
          />
        </div>
      </div>

      {/* Sayfa Başlığı */}
      <div className={containerClass + " pt-4 md:pt-12 pb-12"}>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 tracking-tight text-center uppercase">
          {t('news_title') || t('news')}
        </h1>
      </div>

      {/* Haber Listesi */}
      <div className={containerClass + " pb-16 md:pb-24"}>
        {news.length > 0 ? (
          <div className="border-t border-gray-300 pt-16">
            {news.map((item, index) => (
              <ScrollReveal
                key={item.id}
                delay={index * 100}
                threshold={0.01}
                direction="up"
                distance={30}
              >
                <NewsCard item={item} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-gray-400 text-lg italic font-light">{t('no_news')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
