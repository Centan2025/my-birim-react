import React, {useState, useMemo, useRef, forwardRef, useImperativeHandle} from 'react'
import {Link} from 'react-router-dom'
import {motion, useInView, AnimatePresence} from 'framer-motion'
import {Search, X} from 'lucide-react'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useNews} from '../hooks/useNews'
import {useSEO} from '../hooks/useSEO'
import {TextMaskReveal} from '../components/TextMaskReveal'

const ArrowRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 6 22 12" />
    <path d="M22 12H2" />
  </svg>
)

interface CategoryObj {
  tr?: string
  en?: string
}

type ProcessedNewsItem = NonNullable<ReturnType<typeof useNews>['data']>[number] & {
  imageUrl: string
  categoryLabel: string
}

interface NewsCardV2ItemProps {
  item: ProcessedNewsItem
  index: number
  isTr: boolean
}

const NewsCardV2Item = forwardRef<HTMLDivElement, NewsCardV2ItemProps>(function NewsCardV2Item(
  {item, index, isTr},
  forwardedRef
) {
  const localRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement)
  const isInView = useInView(localRef, {once: true, amount: 0.05, margin: '0px 0px 50px 0px'})
  const colIndex = index % 3
  const cardDelay = index < 6 ? 0.06 + index * 0.08 : (colIndex % 3) * 0.07
  const {t} = useTranslation()
  const title = t(item.title)
  const cardImage = item.imageUrl

  return (
    <motion.div
      ref={localRef}
      layout
      initial={{opacity: 0, y: 45, scale: 0.92}}
      animate={isInView ? {opacity: 1, y: 0, scale: 1} : {opacity: 0, y: 45, scale: 0.92}}
      exit={{opacity: 0, scale: 0.9, y: 20, transition: {duration: 0.35, ease: 'easeOut'}}}
      transition={{
        layout: {duration: 0.5, ease: [0.16, 1, 0.3, 1]},
        y: {
          duration: 0.92,
          delay: cardDelay,
          ease: [0.16, 1, 0.3, 1],
        },
        scale: {
          duration: 0.84,
          delay: cardDelay + 0.05,
          ease: [0.45, 0, 0.2, 1],
        },
        opacity: {
          duration: 0.68,
          delay: cardDelay,
          ease: 'easeOut',
        },
      }}
      className="h-full"
    >
      <article className="group relative flex flex-col h-full bg-transparent border border-black/[0.06] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/15 transition-colors duration-300 will-change-transform">
        <Link to={`/news/${item.id}`} className="flex flex-col h-full focus:outline-none">
          {/* Dikey Kart Görsel Alanı (Sade, rozetsiz 4:5 Dikey Görsel) */}
          <div className="relative w-full aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-900 select-none">
            {cardImage ? (
              <OptimizedImage
                src={cardImage}
                alt={title}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                quality={92}
                loading={index < 3 ? 'eager' : 'lazy'}
                crop={typeof item.mainImage === 'object' ? item.mainImage.crop : undefined}
                hotspot={typeof item.mainImage === 'object' ? item.mainImage.hotspot : undefined}
                origWidth={
                  typeof item.mainImage === 'object'
                    ? ((item.mainImage as Record<string, unknown>)['origWidth'] as number)
                    : undefined
                }
                origHeight={
                  typeof item.mainImage === 'object'
                    ? ((item.mainImage as Record<string, unknown>)['origHeight'] as number)
                    : undefined
                }
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 text-neutral-400 font-mono text-xs">
                BIRIM
              </div>
            )}
          </div>

          {/* Dikey Kart Tipografi Alanı (Kategori, Başlık ve Haberi Oku Butonu) */}
          <div className="flex flex-col flex-grow p-6 sm:p-7 justify-between gap-5">
            <div className="flex flex-col gap-2">
              {/* Kategori Etiketi */}
              <span className="text-[11px] font-mono tracking-wide uppercase text-neutral-400 dark:text-neutral-500 font-light">
                {item.categoryLabel}
              </span>

              {/* Başlık */}
              <h2 className="text-lg sm:text-xl font-light text-[var(--text-primary)] group-hover:text-black dark:group-hover:text-white transition-colors duration-300 leading-snug uppercase tracking-tight font-sans line-clamp-2">
                {title}
              </h2>
            </div>

            {/* Haberin Detayı Butonu */}
            <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wide font-medium text-[var(--text-primary)]">
                <span>{isTr ? 'Haberin Detayı' : 'Article Details'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-primary)] transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </Link>
      </article>
    </motion.div>
  )
})

const getCategoryLabel = (
  category: unknown,
  t: (key: string) => string,
  locale: string = 'tr'
): string => {
  const loc = locale === 'tr' ? 'tr-TR' : 'en-US'
  if (!category) return (t('news_press') || 'BASIN').toLocaleUpperCase(loc)
  if (typeof category === 'string') {
    const key = category.toLowerCase()
    if (key === 'press') return (t('news_press') || 'BASIN').toLocaleUpperCase(loc)
    if (key === 'events') return (t('news_events') || 'SERGİ & ETKİNLİK').toLocaleUpperCase(loc)
    if (key === 'awards') return (t('news_awards') || 'ÖDÜLLER').toLocaleUpperCase(loc)
    if (key === 'launch') return (t('news_launch') || 'LANSMAN').toLocaleUpperCase(loc)
    return category.toLocaleUpperCase(loc)
  }
  const translated = t(String(category))
  if (translated) return translated.toLocaleUpperCase(loc)
  return (t('news_press') || 'BASIN').toLocaleUpperCase(loc)
}

export function NewsPageV2() {
  const {data: news = [], isLoading: loading} = useNews()
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // SEO meta
  useSEO({
    title: `BIRIM - ${t('news') || 'Haberler'} | Dikey Kartlar`,
    description: 'BIRIM ile ilgili güncel haberler, basın içerikleri ve editoryal duyurular.',
    type: 'article',
    siteName: 'BIRIM',
    locale: isTr ? 'tr_TR' : 'en_US',
    section: 'News',
  })

  // Pre-process items for image and category label
  const processedNews = useMemo(() => {
    return news.map(item => {
      const imageUrl =
        typeof item.mainImage === 'string'
          ? item.mainImage
          : item.mainImage?.url || item.media?.[0]?.url || ''

      return {
        ...item,
        imageUrl,
        categoryLabel: getCategoryLabel(item.category, t, locale),
      }
    })
  }, [news, t, locale])

  // Filtered news
  const filteredNews = useMemo(() => {
    return processedNews.filter(item => {
      const titleText = String(t(item.title)).toLowerCase()
      const search = searchQuery.toLowerCase().trim()
      const matchesSearch = !search || titleText.includes(search)

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

  // Predefined Categories (no counts)
  const categories = useMemo(() => {
    const predefined = [
      {id: 'all', label: t('news_all') || 'TÜMÜ'},
      {id: 'press', label: t('news_press') || 'BASIN'},
      {id: 'events', label: t('news_events') || 'SERGİ & ETKİNLİK'},
      {id: 'awards', label: t('news_awards') || 'ÖDÜLLER'},
      {id: 'launch', label: t('news_launch') || 'LANSMAN'},
    ]

    return predefined.filter(cat => {
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
    <div className="bg-[var(--bg-primary)] min-h-screen animate-fade-in-up-subtle pt-20 md:pt-20 lg:pt-20 pb-28">
      {/* Breadcrumb Band */}
      <div className="w-full relative z-20">
        <div className={containerClass + ' py-4'}>
          <Breadcrumbs items={[{label: t('homepage'), to: '/'}, {label: t('news')}]} />
        </div>
      </div>

      {/* Sayfa Başlığı */}
      <div className={containerClass + ' pt-2 md:pt-4 pb-4 md:pb-6 text-center'}>
        <TextMaskReveal delay={60} duration={1.15}>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)] tracking-tight uppercase text-center">
            {t('news_title') || 'Haberler'}
          </h1>
        </TextMaskReveal>
      </div>

      {/* Filtre ve Arama Alanı */}
      <div className={containerClass + ' mb-8 md:mb-12'}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 md:pt-2 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          {/* Kategoriler (Adetler kaldırıldı) */}
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-1">
            {categories.map(cat => {
              const isActive = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs md:text-sm font-mono tracking-wide uppercase transition-colors duration-200 relative py-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-[var(--text-primary)] font-medium'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{cat.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="activeCategoryBorderV2"
                      className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[var(--text-primary)]"
                      transition={{type: 'spring', stiffness: 420, damping: 32}}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Canlı Arama Inputu */}
          <div className="relative min-w-[220px] sm:min-w-[260px]">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isTr ? 'Haberlerde ara...' : 'Search news...'}
                aria-label={isTr ? 'Haberlerde ara' : 'Search news'}
                className="w-full pl-9 pr-8 py-1.5 text-xs font-mono bg-transparent border border-black/10 dark:border-white/15 focus:border-black dark:focus:border-white text-[var(--text-primary)] placeholder:text-neutral-400 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-0.5 text-neutral-400 hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Aramayı temizle"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dikey Kart Formatında Sade Haber Akışı (Minimal Vertical Cards) */}
      <main className={containerClass}>
        {filteredNews.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <p className="text-sm font-mono text-neutral-400 uppercase tracking-widest mb-4">
              {isTr
                ? 'Aramanızla eşleşen haber bulunamadı.'
                : 'No news found matching your criteria.'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSearchQuery('')
              }}
              className="text-xs font-mono tracking-widest uppercase text-[var(--text-primary)] underline underline-offset-4 hover:opacity-75 transition-opacity"
            >
              {isTr ? 'Filtreleri Temizle' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
            <AnimatePresence mode="popLayout">
              {filteredNews.map((item, index) => (
                <NewsCardV2Item key={item.id} item={item} index={index} isTr={isTr} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}

export default NewsPageV2
