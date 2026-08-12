/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import {motion} from 'framer-motion'
import {Link} from 'react-router-dom'
import type {NewsItem} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useNews} from '../hooks/useNews'
import {useSEO} from '../hooks/useSEO'
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

const formatDate = (dateString: string, locale: string): string => {
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

const NewsCard: React.FC<{item: NewsItem}> = ({item}) => {
  const {t, locale} = useTranslation()

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
    <div className="group border-b border-[var(--border-primary)] py-10 md:py-16 first:pt-0 last:border-0 hover:bg-[var(--bg-secondary)]/50 transition-colors duration-300">
      <Link to={`/news/${item.id}`} className="block">
        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_320px] items-start gap-8 md:gap-16">
          {/* Kolon 1: Tarih */}
          <div className="pt-0">
            <p className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] text-[var(--text-secondary)] uppercase leading-none mt-0">
              {formatDate(item.date, locale)}
            </p>
          </div>

          {/* Kolon 2: Başlık ve Özet */}
          <div className="flex flex-col gap-5 max-w-2xl transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:translate-x-6">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-light tracking-tight text-[var(--text-primary)] group-hover:text-[var(--text-secondary)] transition-colors duration-300 uppercase leading-tight">
              {t(item.title)}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm md:text-base leading-relaxed font-light">
              {summary}
            </p>
          </div>

          {/* Kolon 3: Görsel */}
          <div className="w-full h-40 md:h-48 overflow-hidden ml-auto">
            <OptimizedImage
              src={typeof item.mainImage === 'string' ? item.mainImage : item.mainImage?.url || ''}
              srcMobile={typeof item.mainImage === 'object' ? item.mainImage.urlMobile : undefined}
              srcDesktop={
                typeof item.mainImage === 'object' ? item.mainImage.urlDesktop : undefined
              }
              alt={t(item.title)}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] will-change-transform"
              width={1200}
              height={800}
              loading="lazy"
              quality={95}
            />
          </div>
        </div>
      </Link>
    </div>
  )
}

export function NewsPage() {
  const {data: news = [], isLoading: loading} = useNews()
  const {t} = useTranslation()

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
      <div className="pt-20 bg-[var(--bg-primary)] min-h-screen">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  const containerClass =
    'w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0'

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen animate-fade-in-up-subtle pt-20 md:pt-20 lg:pt-20">
      {/* Breadcrumb Band */}
      <div className="w-full relative z-20">
        <div className={containerClass + ' py-4 md:py-2 lg:py-3'}>
          <Breadcrumbs items={[{label: t('homepage'), to: '/'}, {label: t('news')}]} />
        </div>
      </div>

      {/* Sayfa Başlığı */}
      <div className={containerClass + ' pt-4 md:pt-12 pb-12'}>
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 1, ease: 'easeOut'}}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)] tracking-tight text-center uppercase">
            {t('news_title') || t('news')}
          </h1>
        </motion.div>
      </div>

      {/* Haber Listesi */}
      <div className={containerClass + ' pb-16 md:pb-24'}>
        {news.length > 0 ? (
          <div className="pt-0">
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
            <p className="text-[var(--text-secondary)] text-lg italic font-light">{t('no_news')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
