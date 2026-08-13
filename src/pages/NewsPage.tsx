import {useState, useMemo} from 'react'
import {motion} from 'framer-motion'
import {Link} from 'react-router-dom'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useNews} from '../hooks/useNews'
import {useSEO} from '../hooks/useSEO'
import ScrollReveal from '../components/ScrollReveal'

interface SanityBlockChild {
  _type?: string
  text?: string
}

interface SanityBlockItem {
  _type?: string
  children?: SanityBlockChild[]
}

interface CategoryObj {
  tr?: string
  en?: string
}

// Helper to convert Sanity block content to plain text
const blockToPlainText = (blocks: unknown): string => {
  if (!blocks) return ''
  if (typeof blocks === 'string') return blocks
  if (!Array.isArray(blocks)) return ''
  return (blocks as SanityBlockItem[])
    .map(block => {
      if (
        !block ||
        typeof block !== 'object' ||
        block._type !== 'block' ||
        !Array.isArray(block.children)
      ) {
        return ''
      }
      return block.children
        .map(child => (typeof child?.text === 'string' ? child.text : ''))
        .join('')
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

const estimateReadTime = (text: string): number => {
  if (!text) return 2
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 180))
}

const getCategoryLabel = (category: unknown, t: (key: string) => string): string => {
  if (!category) return (t('news_press') || 'BASIN').toUpperCase()
  if (typeof category === 'string') {
    const key = category.toLowerCase()
    if (key === 'press') return (t('news_press') || 'BASIN').toUpperCase()
    if (key === 'events') return (t('news_events') || 'SERGİ & ETKİNLİK').toUpperCase()
    if (key === 'awards') return (t('news_awards') || 'ÖDÜLLER').toUpperCase()
    if (key === 'launch') return (t('news_launch') || 'LANSMAN').toUpperCase()
    return category.toUpperCase()
  }
  const translated = t(String(category))
  if (translated) return translated.toUpperCase()
  return (t('news_press') || 'BASIN').toUpperCase()
}

export function NewsPage() {
  const {data: news = [], isLoading: loading} = useNews()
  const {t, locale} = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // SEO meta
  useSEO({
    title: `BIRIM - ${t('news') || 'Haberler'}`,
    description: 'BIRIM ile ilgili güncel haberler, duyurular ve basın içerikleri',
    type: 'article',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'News',
  })

  // Pre-process items for summary and read time
  const processedNews = useMemo(() => {
    return news.map((item, index) => {
      const translatedContent = t(item.content)
      const plainText = blockToPlainText(translatedContent)
      const summary = plainText ? plainText.substring(0, 160).trim() + '...' : ''
      const readMinutes = item.readTime
        ? item.readTime
        : `${estimateReadTime(plainText)} ${t('read_time')?.replace('{0} ', '') || 'min read'}`

      return {
        ...item,
        summary,
        readMinutes,
        indexNumber: String(index + 1).padStart(2, '0'),
        categoryLabel: getCategoryLabel(item.category, t),
      }
    })
  }, [news, t])

  // Filtered news
  const filteredNews = useMemo(() => {
    return processedNews.filter(item => {
      const titleMatch = String(t(item.title)).toLowerCase().includes(searchQuery.toLowerCase())
      const summaryMatch = item.summary.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSearch = titleMatch || summaryMatch

      if (!matchesSearch) return false
      if (selectedCategory === 'all') return true

      const catRaw = String(
        typeof item.category === 'string'
          ? item.category
          : typeof item.category === 'object' && item.category
            ? (item.category as CategoryObj).tr || (item.category as CategoryObj).en || ''
            : ''
      ).toLowerCase()
      const catLabel = (item.categoryLabel || '').toLowerCase()
      const sel = selectedCategory.toLowerCase()

      if (sel === 'press')
        return (
          catRaw.includes('press') ||
          catRaw.includes('basın') ||
          catLabel.includes('press') ||
          catLabel.includes('basın')
        )
      if (sel === 'events')
        return (
          catRaw.includes('event') ||
          catRaw.includes('exhibition') ||
          catRaw.includes('sergi') ||
          catRaw.includes('etkinlik') ||
          catLabel.includes('event') ||
          catLabel.includes('exhibition') ||
          catLabel.includes('sergi') ||
          catLabel.includes('etkinlik')
        )
      if (sel === 'awards')
        return (
          catRaw.includes('award') ||
          catRaw.includes('ödül') ||
          catLabel.includes('award') ||
          catLabel.includes('ödül')
        )
      if (sel === 'launch')
        return (
          catRaw.includes('launch') ||
          catRaw.includes('lansman') ||
          catLabel.includes('launch') ||
          catLabel.includes('lansman')
        )

      return catRaw.includes(sel) || catLabel.includes(sel)
    })
  }, [processedNews, selectedCategory, searchQuery, t])

  // Featured Article (Hero Spotlight)
  const featuredArticle = useMemo(() => {
    if (processedNews.length === 0) return null
    return processedNews.find(item => item.featured) || processedNews[0]
  }, [processedNews])

  // Non-featured news list for grid display
  const newsList = useMemo(() => {
    if (selectedCategory !== 'all' || searchQuery.trim() !== '') {
      return filteredNews
    }
    // If showing all without search, omit the featured article from the main list below
    return featuredArticle ? processedNews.filter(n => n.id !== featuredArticle.id) : processedNews
  }, [filteredNews, featuredArticle, processedNews, selectedCategory, searchQuery])

  // Filter categories to only include those that have at least one article
  const categories = useMemo(() => {
    const predefinedCategories = [
      {id: 'all', label: t('news_all') || 'TÜMÜ'},
      {id: 'press', label: t('news_press') || 'BASIN'},
      {id: 'events', label: t('news_events') || 'SERGİ & ETKİNLİK'},
      {id: 'awards', label: t('news_awards') || 'ÖDÜLLER'},
      {id: 'launch', label: t('news_launch') || 'LANSMAN'},
    ]

    return predefinedCategories.filter(cat => {
      if (cat.id === 'all') return true
      return processedNews.some(item => {
        const catRaw = String(
          typeof item.category === 'string'
            ? item.category
            : typeof item.category === 'object' && item.category
              ? (item.category as CategoryObj).tr || (item.category as CategoryObj).en || ''
              : ''
        ).toLowerCase()
        const catLabel = (item.categoryLabel || '').toLowerCase()

        if (cat.id === 'press')
          return (
            catRaw.includes('press') ||
            catRaw.includes('basın') ||
            catLabel.includes('press') ||
            catLabel.includes('basın')
          )
        if (cat.id === 'events')
          return (
            catRaw.includes('event') ||
            catRaw.includes('exhibition') ||
            catRaw.includes('sergi') ||
            catRaw.includes('etkinlik') ||
            catLabel.includes('event') ||
            catLabel.includes('exhibition') ||
            catLabel.includes('sergi') ||
            catLabel.includes('etkinlik')
          )
        if (cat.id === 'awards')
          return (
            catRaw.includes('award') ||
            catRaw.includes('ödül') ||
            catLabel.includes('award') ||
            catLabel.includes('ödül')
          )
        if (cat.id === 'launch')
          return (
            catRaw.includes('launch') ||
            catRaw.includes('lansman') ||
            catLabel.includes('launch') ||
            catLabel.includes('lansman')
          )

        return catRaw.includes(cat.id) || catLabel.includes(cat.id)
      })
    })
  }, [processedNews, t])

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
        <div className={containerClass + ' py-4'}>
          <Breadcrumbs items={[{label: t('homepage'), to: '/'}, {label: t('news')}]} />
        </div>
      </div>

      {/* Sayfa Header & Subtitle (Ortalanmış, Projeler başlığı boyutunda) */}
      <div className={containerClass + ' pt-2 md:pt-4 pb-4 md:pb-6 text-center'}>
        <motion.div
          initial={{opacity: 0, y: 15}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.8, ease: 'easeOut'}}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)] tracking-tight uppercase text-center">
            {t('news_title') || 'Haberler'}
          </h1>
        </motion.div>
      </div>

      <div className={containerClass + ' mb-6 md:mb-8'}>
        {/* Filtre Barı & Arama */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 md:pt-2 pb-4 border-b border-[var(--border-primary)]/40">
          {/* Kategoriler */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1">
            {categories.map(cat => {
              const isActive = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs md:text-sm font-mono tracking-widest uppercase transition-all duration-300 relative py-1 whitespace-nowrap ${
                    isActive
                      ? 'text-[var(--text-primary)] font-medium'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {cat.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryBorder"
                      className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[var(--text-primary)]"
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Arama */}
          <div className="flex items-center gap-4 self-start sm:self-auto">
            <div className="relative">
              <input
                type="text"
                placeholder={t('search_placeholder') || 'Ara...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-b border-[var(--border-primary)] focus:border-[var(--text-primary)] text-xs md:text-sm py-1 px-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition-colors w-36 sm:w-48 font-light"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Spotlight Article (Only when showing all without active search) */}
      {featuredArticle && selectedCategory === 'all' && searchQuery.trim() === '' && (
        <div className={containerClass + ' mb-10 md:mb-14'}>
          <ScrollReveal threshold={0.05} direction="up" distance={20}>
            <Link to={`/news/${featuredArticle.id}`} className="group block relative">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center bg-[var(--bg-secondary)]/80 p-6 md:p-10 border border-neutral-300/18 dark:border-neutral-700/20 transition-all duration-500 hover:border-[var(--text-primary)]/40">
                {/* Hero Photo */}
                <div className="lg:col-span-7 h-[300px] md:h-[450px] overflow-hidden relative">
                  <OptimizedImage
                    src={
                      typeof featuredArticle.mainImage === 'string'
                        ? featuredArticle.mainImage
                        : featuredArticle.mainImage?.url || ''
                    }
                    srcMobile={
                      typeof featuredArticle.mainImage === 'object'
                        ? featuredArticle.mainImage.urlMobile
                        : undefined
                    }
                    srcDesktop={
                      typeof featuredArticle.mainImage === 'object'
                        ? featuredArticle.mainImage.urlDesktop
                        : undefined
                    }
                    alt={t(featuredArticle.title)}
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    width={1400}
                    height={900}
                    loading="eager"
                    quality={95}
                    crop={
                      typeof featuredArticle.mainImage === 'object'
                        ? featuredArticle.mainImage.crop
                        : undefined
                    }
                    hotspot={
                      typeof featuredArticle.mainImage === 'object'
                        ? featuredArticle.mainImage.hotspot
                        : undefined
                    }
                    origWidth={
                      typeof featuredArticle.mainImage === 'object'
                        ? (featuredArticle.mainImage.origWidth as number)
                        : undefined
                    }
                    origHeight={
                      typeof featuredArticle.mainImage === 'object'
                        ? (featuredArticle.mainImage.origHeight as number)
                        : undefined
                    }
                  />
                </div>

                {/* Hero Details */}
                <div className="lg:col-span-5 flex flex-col justify-between h-full py-2">
                  <div>
                    <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                      <span>{formatDate(featuredArticle.date, locale)}</span>
                      <span>•</span>
                      <span>{featuredArticle.categoryLabel}</span>
                    </div>

                    <h2 className="text-2xl md:text-4xl font-light text-[var(--text-primary)] uppercase tracking-tight leading-tight group-hover:text-[var(--text-secondary)] transition-colors mb-4">
                      {t(featuredArticle.title)}
                    </h2>

                    <p className="text-sm md:text-base text-[var(--text-secondary)] font-light leading-relaxed mb-6 line-clamp-4">
                      {featuredArticle.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-end pt-4 border-t border-neutral-300/18 dark:border-neutral-700/20 text-xs font-mono tracking-widest uppercase text-[var(--text-primary)]">
                    <span className="flex items-center gap-1 group-hover:translate-x-2 transition-transform duration-300">
                      OKU <span className="text-base">↗</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </ScrollReveal>
        </div>
      )}

      {/* Main Articles Grid Stream */}
      <div className={containerClass + ' pb-20 md:pb-32'}>
        {newsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
            {newsList.map((item, index) => (
              <ScrollReveal
                key={item.id}
                delay={index * 80}
                threshold={0.01}
                direction="up"
                distance={30}
              >
                <Link
                  to={`/news/${item.id}`}
                  className="group block flex flex-col h-full border border-neutral-300/18 dark:border-neutral-700/20 p-6 hover:border-[var(--text-primary)]/40 transition-all duration-500 bg-[var(--bg-secondary)]/50"
                >
                  <div className="w-full aspect-[21/9] overflow-hidden relative mb-6 border border-neutral-200/15 dark:border-neutral-800/20 bg-neutral-900/10">
                    <OptimizedImage
                      src={
                        typeof item.mainImage === 'string'
                          ? item.mainImage
                          : item.mainImage?.url || ''
                      }
                      srcMobile={
                        typeof item.mainImage === 'object' ? item.mainImage.urlMobile : undefined
                      }
                      srcDesktop={
                        typeof item.mainImage === 'object' ? item.mainImage.urlDesktop : undefined
                      }
                      alt={t(item.title)}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      width={1200}
                      height={514}
                      loading="lazy"
                      quality={92}
                      crop={typeof item.mainImage === 'object' ? item.mainImage.crop : undefined}
                      hotspot={
                        typeof item.mainImage === 'object' ? item.mainImage.hotspot : undefined
                      }
                      origWidth={
                        typeof item.mainImage === 'object'
                          ? (item.mainImage.origWidth as number)
                          : undefined
                      }
                      origHeight={
                        typeof item.mainImage === 'object'
                          ? (item.mainImage.origHeight as number)
                          : undefined
                      }
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-grow">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                        <span>{formatDate(item.date, locale)}</span>
                        <span>{item.categoryLabel}</span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-light text-[var(--text-primary)] uppercase tracking-tight leading-snug group-hover:text-[var(--text-secondary)] transition-colors mb-3">
                        {t(item.title)}
                      </h2>
                      <p className="text-xs md:text-sm text-[var(--text-secondary)] font-light leading-relaxed line-clamp-3 mb-6">
                        {item.summary}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-300/18 dark:border-neutral-700/20 text-[11px] font-mono uppercase tracking-widest text-[var(--text-primary)] mt-auto">
                      <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors font-light">
                        {t('read_more') || 'DEVAMINI OKU'}
                      </span>
                      <span className="group-hover:translate-x-1 transition-transform">↗</span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center border-t border-b border-[var(--border-primary)]">
            <p className="text-[var(--text-secondary)] text-base font-light italic">
              {t('no_news') || 'Şu anda gösterilecek haber bulunmamaktadır.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
