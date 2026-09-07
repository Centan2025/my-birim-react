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
import {TextMaskReveal} from '../components/TextMaskReveal'
import {ProductCardReveal} from '../components/ProductCardReveal'

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
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase()
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

type ViewLayoutMode = 'bento' | 'archive'

export function NewsPageV2() {
  const {data: news = [], isLoading: loading} = useNews()
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [layoutMode, setLayoutMode] = useState<ViewLayoutMode>('bento')

  // SEO meta
  useSEO({
    title: `BIRIM - ${t('news') || 'Haberler'} | V2`,
    description: 'BIRIM güncel haberleri, lansmanlar, sergiler ve basın duyuruları',
    type: 'article',
    siteName: 'BIRIM',
    locale: isTr ? 'tr_TR' : 'en_US',
    section: 'News',
  })

  // Pre-process items
  const processedNews = useMemo(() => {
    return news.map(item => {
      const translatedContent = t(item.content)
      const plainText = blockToPlainText(translatedContent)
      const summary = plainText ? plainText.substring(0, 175).trim() + '...' : ''

      return {
        ...item,
        summary,
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

  // Split featured items for the Editorial Hero
  const {heroArticle, editorialPicks, streamNews} = useMemo(() => {
    if (filteredNews.length === 0) {
      return {heroArticle: null, editorialPicks: [], streamNews: []}
    }

    // If searching or category is active, show flat list in stream
    if (selectedCategory !== 'all' || searchQuery.trim() !== '') {
      return {
        heroArticle: null,
        editorialPicks: [],
        streamNews: filteredNews,
      }
    }

    const featured = filteredNews.find(item => item.featured) || filteredNews[0]
    if (!featured) {
      return {heroArticle: null, editorialPicks: [], streamNews: filteredNews}
    }
    const others = filteredNews.filter(n => n.id !== featured.id)
    const picks = others.slice(0, 3)
    const stream = others.slice(3)

    return {
      heroArticle: featured,
      editorialPicks: picks,
      streamNews: stream,
    }
  }, [filteredNews, selectedCategory, searchQuery])

  // Categories with existing articles
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
    'w-full max-w-[96%] md:max-w-[94%] lg:max-w-[84vw] mx-auto px-4 md:px-8 lg:px-0'

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen text-[var(--text-primary)] animate-fade-in-up-subtle pt-20 md:pt-20 pb-24">
      {/* Breadcrumb Band */}
      <div className="w-full relative z-20 border-b border-black/[0.05] dark:border-white/[0.06]">
        <div
          className={containerClass + ' py-3 flex items-center justify-between text-xs font-mono'}
        >
          <Breadcrumbs
            items={[{label: t('homepage'), to: '/'}, {label: t('news') || 'Haberler'}]}
          />
        </div>
      </div>

      {/* Editorial Header */}
      <header className={containerClass + ' pt-8 md:pt-14 pb-8 md:pb-12'}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-black dark:border-white pb-6">
          <div>
            <TextMaskReveal delay={40} duration={1.1}>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tighter uppercase leading-[0.95]">
                {t('news_title') || 'Haberler'}
              </h1>
            </TextMaskReveal>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1 text-xs font-mono text-[var(--text-secondary)]">
            <span>{formatDate(new Date().toISOString(), locale)}</span>
          </div>
        </div>

        {/* Toolbar: Categories, View Switcher & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-b border-black/[0.08] dark:border-white/[0.08]">
          {/* Categories */}
          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar py-1">
            {categories.map(cat => {
              const isActive = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs font-mono tracking-widest uppercase transition-all duration-300 relative py-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-normal'
                  }`}
                >
                  <span className="flex items-center gap-1.5">{cat.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryIndicatorV2"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-black dark:bg-white"
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Right Controls: View Mode & Search */}
          <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end pb-2 lg:pb-0">
            {/* View Mode Toggle: Bento vs Archive List */}
            <div className="flex items-center border border-black/[0.12] dark:border-white/[0.15] p-0.5 bg-[var(--bg-secondary)]">
              <button
                type="button"
                onClick={() => setLayoutMode('bento')}
                className={`px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  layoutMode === 'bento'
                    ? 'bg-black text-white dark:bg-white dark:text-black font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title={isTr ? 'Bento / Magazin Görünümü' : 'Bento Grid View'}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                </svg>
                <span className="hidden sm:inline">Bento</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('archive')}
                className={`px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  layoutMode === 'archive'
                    ? 'bg-black text-white dark:bg-white dark:text-black font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title={isTr ? 'Arşiv / Liste Görünümü' : 'Archive List View'}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
                </svg>
                <span className="hidden sm:inline">{isTr ? 'Dizin' : 'Index'}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder={t('search_placeholder') || 'Haberlerde ara...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-b border-black/[0.15] dark:border-white/[0.2] focus:border-black dark:focus:border-white text-xs font-mono py-1 px-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition-all w-36 sm:w-48"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={containerClass}>
        {/* EDITORIAL HERO SPOTLIGHT & PICKS (Only in Bento mode and default unfiltered view) */}
        {layoutMode === 'bento' && heroArticle && (
          <section className="mb-14 md:mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
              {/* Left Major Headline (Col 7) */}
              <div className="lg:col-span-7 flex flex-col justify-between border border-black/[0.08] dark:border-white/[0.1] bg-[var(--bg-secondary)] p-6 md:p-8 hover:border-black/30 dark:hover:border-white/30 transition-all duration-500 group">
                <Link to={`/news/${heroArticle.id}`} className="block">
                  <div className="flex items-center justify-between gap-3 text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider mb-4 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                    <span className="font-medium text-[var(--text-primary)]">
                      {heroArticle.categoryLabel}
                    </span>
                    <span>{formatDate(heroArticle.date, locale)}</span>
                  </div>

                  {/* Cinematic Large Image */}
                  <div className="w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden relative mb-6 bg-black/5">
                    <ProductCardReveal
                      direction="down"
                      duration={1.1}
                      delay={0.05}
                      className="w-full h-full"
                    >
                      <OptimizedImage
                        src={
                          typeof heroArticle.mainImage === 'string'
                            ? heroArticle.mainImage
                            : heroArticle.mainImage?.url || ''
                        }
                        srcMobile={
                          typeof heroArticle.mainImage === 'object'
                            ? heroArticle.mainImage.urlMobile
                            : undefined
                        }
                        srcDesktop={
                          typeof heroArticle.mainImage === 'object'
                            ? heroArticle.mainImage.urlDesktop
                            : undefined
                        }
                        alt={t(heroArticle.title)}
                        className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                        width={1400}
                        height={850}
                        loading="eager"
                        quality={95}
                        crop={
                          typeof heroArticle.mainImage === 'object'
                            ? heroArticle.mainImage.crop
                            : undefined
                        }
                        hotspot={
                          typeof heroArticle.mainImage === 'object'
                            ? heroArticle.mainImage.hotspot
                            : undefined
                        }
                      />
                    </ProductCardReveal>
                  </div>

                  {/* Title & Summary */}
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light uppercase tracking-tight leading-tight group-hover:text-[var(--text-secondary)] transition-colors mb-4">
                    {t(heroArticle.title)}
                  </h2>
                  <p className="text-sm md:text-base text-[var(--text-secondary)] font-light leading-relaxed mb-6 line-clamp-3">
                    {heroArticle.summary}
                  </p>

                  <div className="flex items-center justify-end pt-4 border-t border-black/[0.06] dark:border-white/[0.08] text-xs font-mono uppercase tracking-widest text-[var(--text-primary)]">
                    <span className="flex items-center gap-1.5 group-hover:translate-x-2 transition-transform duration-300 font-medium">
                      {isTr ? 'HABERİ OKU' : 'READ STORY'}{' '}
                      <span className="text-base leading-none">↗</span>
                    </span>
                  </div>
                </Link>
              </div>

              {/* Right Side: Editorial Picks Column (Col 5) */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div className="border-b-2 border-black dark:border-white pb-2 mb-6 flex items-center justify-between">
                  <h3 className="text-xs font-mono tracking-widest uppercase font-semibold text-[var(--text-primary)]">
                    {isTr ? 'EDİTÖRÜN SEÇTİKLERİ / GÜNCEL' : 'CURATED STORIES'}
                  </h3>
                </div>

                <div className="flex flex-col divide-y divide-black/[0.08] dark:divide-white/[0.08] flex-1">
                  {editorialPicks.map(pick => (
                    <Link
                      key={pick.id}
                      to={`/news/${pick.id}`}
                      className="group block py-5 first:pt-0 last:pb-0 hover:bg-[var(--bg-secondary)]/60 px-3 -mx-3 transition-colors"
                    >
                      <div className="flex gap-4 items-start">
                        <div className="w-24 sm:w-28 aspect-[4/3] flex-shrink-0 overflow-hidden bg-black/5 relative">
                          <OptimizedImage
                            src={
                              typeof pick.mainImage === 'string'
                                ? pick.mainImage
                                : pick.mainImage?.url || ''
                            }
                            alt={t(pick.title)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            width={300}
                            height={225}
                            loading="lazy"
                            quality={85}
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                              <span>{pick.categoryLabel}</span>
                              <span>•</span>
                              <span>{formatDate(pick.date, locale)}</span>
                            </div>
                            <h4 className="text-sm sm:text-base font-medium uppercase tracking-tight leading-snug line-clamp-2 group-hover:text-[var(--text-secondary)] transition-colors">
                              {t(pick.title)}
                            </h4>
                          </div>
                          <div className="flex items-center justify-end mt-2 pt-2 text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">
                            <span className="group-hover:translate-x-1 group-hover:text-[var(--text-primary)] transition-all">
                              ↗
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Press Kit Callout Card */}
                <div className="mt-8 p-6 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-secondary)]">
                      {isTr ? 'BASIN & MEDYA İLİŞKİLERİ' : 'PRESS & MEDIA INQUIRIES'}
                    </span>
                    <span className="text-[10px] font-mono font-semibold uppercase text-[var(--text-primary)]">
                      PRESS KIT
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed mb-4">
                    {isTr
                      ? 'Yüksek çözünürlüklü ürün fotoğrafları, basın bültenleri ve röportaj talepleri için basın kiti sayfamızı ziyaret edebilirsiniz.'
                      : 'High-resolution photography, press kits, and editorial interview inquiries for media representatives.'}
                  </p>
                  <a
                    href="mailto:press@birim.com"
                    className="inline-flex items-center gap-2 text-xs font-mono font-medium tracking-wider uppercase border-b border-black dark:border-white pb-0.5 hover:opacity-70 transition-opacity"
                  >
                    <span>press@birim.com</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* VIEW MODE: BENTO GRID STREAM */}
        {layoutMode === 'bento' && (
          <section>
            {(heroArticle || selectedCategory !== 'all' || searchQuery.trim() !== '') && (
              <div className="border-b border-black dark:border-white pb-2 mb-8 flex items-center justify-between">
                <h3 className="text-xs font-mono tracking-widest uppercase font-semibold">
                  {searchQuery
                    ? isTr
                      ? 'ARAMA SONUÇLARI'
                      : 'SEARCH RESULTS'
                    : selectedCategory !== 'all'
                      ? categories.find(c => c.id === selectedCategory)?.label || ''
                      : isTr
                        ? 'TÜM YAYIN AKIŞI'
                        : 'ALL ARTICLES'}
                </h3>
              </div>
            )}

            {filteredNews.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-black/[0.1] dark:border-white/[0.1] my-8">
                <p className="text-[var(--text-secondary)] text-sm font-mono uppercase tracking-widest">
                  {t('no_news') || 'Aradığınız kriterlere uygun haber bulunamadı.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 text-xs font-mono uppercase tracking-wider border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                  >
                    {isTr ? 'Filtreyi Temizle' : 'Clear Filter'}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {(heroArticle ? streamNews : filteredNews).map((item, index) => {
                  return (
                    <ScrollReveal
                      key={item.id}
                      delay={(index % 3) * 100}
                      threshold={0.05}
                      direction="up"
                      distance={20}
                    >
                      <Link
                        to={`/news/${item.id}`}
                        className="group flex flex-col h-full border border-black/[0.08] dark:border-white/[0.1] p-5 sm:p-6 bg-[var(--bg-secondary)]/40 hover:border-black/30 dark:hover:border-white/30 transition-all duration-500"
                      >
                        {/* Image */}
                        <div className="w-full aspect-[16/10] overflow-hidden relative mb-5 bg-black/5">
                          <ProductCardReveal
                            direction="down"
                            duration={0.9}
                            delay={0.05}
                            className="w-full h-full"
                          >
                            <OptimizedImage
                              src={
                                typeof item.mainImage === 'string'
                                  ? item.mainImage
                                  : item.mainImage?.url || ''
                              }
                              srcMobile={
                                typeof item.mainImage === 'object'
                                  ? item.mainImage.urlMobile
                                  : undefined
                              }
                              srcDesktop={
                                typeof item.mainImage === 'object'
                                  ? item.mainImage.urlDesktop
                                  : undefined
                              }
                              alt={t(item.title)}
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                              width={900}
                              height={560}
                              loading="lazy"
                              quality={90}
                              crop={
                                typeof item.mainImage === 'object' ? item.mainImage.crop : undefined
                              }
                              hotspot={
                                typeof item.mainImage === 'object'
                                  ? item.mainImage.hotspot
                                  : undefined
                              }
                            />
                          </ProductCardReveal>
                        </div>

                        {/* Text */}
                        <div className="flex flex-col justify-between flex-grow">
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-wider mb-2.5">
                              <span>{formatDate(item.date, locale)}</span>
                              <span className="font-medium text-[var(--text-primary)]">
                                {item.categoryLabel}
                              </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-light uppercase tracking-tight leading-snug group-hover:text-[var(--text-secondary)] transition-colors mb-3">
                              {t(item.title)}
                            </h3>

                            <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed line-clamp-3 mb-6">
                              {item.summary}
                            </p>
                          </div>

                          <div className="flex items-center justify-end pt-3 border-t border-black/[0.06] dark:border-white/[0.08] text-[11px] font-mono uppercase tracking-widest text-[var(--text-primary)] mt-auto">
                            <span className="group-hover:translate-x-1.5 transition-transform flex items-center gap-1 font-medium">
                              {t('read_more') || 'OKU'} ↗
                            </span>
                          </div>
                        </div>
                      </Link>
                    </ScrollReveal>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* VIEW MODE: ARCHIVE LIST / DOSSIER INDEX */}
        {layoutMode === 'archive' && (
          <section className="border-t border-black dark:border-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.15] dark:border-white/[0.2] text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                    <th className="py-4 px-2 sm:px-4 font-normal w-28 sm:w-36">
                      {isTr ? 'TARİH' : 'DATE'}
                    </th>
                    <th className="py-4 px-2 sm:px-4 font-normal w-32 sm:w-40">
                      {isTr ? 'KATEGORİ' : 'CATEGORY'}
                    </th>
                    <th className="py-4 px-2 sm:px-4 font-normal">
                      {isTr ? 'BAŞLIK & ÖZET' : 'TITLE & SYNOPSIS'}
                    </th>
                    <th className="py-4 px-2 sm:px-4 font-normal text-right w-16 sm:w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
                  {filteredNews.map(item => (
                    <tr
                      key={item.id}
                      className="group hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                      onClick={() => {
                        window.location.href = `/news/${item.id}`
                      }}
                    >
                      <td className="py-5 px-2 sm:px-4 text-xs font-mono text-[var(--text-secondary)] whitespace-nowrap">
                        {formatDate(item.date, locale)}
                      </td>
                      <td className="py-5 px-2 sm:px-4 text-xs font-mono font-medium whitespace-nowrap">
                        <span className="px-2 py-0.5 border border-black/[0.1] dark:border-white/[0.1] text-[10px] tracking-wider">
                          {item.categoryLabel}
                        </span>
                      </td>
                      <td className="py-5 px-2 sm:px-4">
                        <Link to={`/news/${item.id}`} className="block">
                          <h4 className="text-base sm:text-lg font-normal uppercase tracking-tight group-hover:underline underline-offset-4 decoration-1">
                            {t(item.title)}
                          </h4>
                          <p className="text-xs text-[var(--text-secondary)] font-light mt-1 line-clamp-1 hidden sm:block">
                            {item.summary}
                          </p>
                        </Link>
                      </td>
                      <td className="py-5 px-2 sm:px-4 text-xs font-mono text-[var(--text-secondary)] text-right whitespace-nowrap">
                        <span className="group-hover:text-[var(--text-primary)] inline-flex items-center justify-end font-medium">
                          <span className="group-hover:translate-x-1 transition-transform text-sm">
                            ↗
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredNews.length === 0 && (
              <div className="py-16 text-center text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">
                {t('no_news') || 'Kayıt bulunamadı.'}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
