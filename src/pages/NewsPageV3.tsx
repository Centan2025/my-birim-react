import {useState, useMemo} from 'react'
import {Link} from 'react-router-dom'
import {ArrowRight, Search, X} from 'lucide-react'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useNews} from '../hooks/useNews'
import {useSEO} from '../hooks/useSEO'
import {TextMaskReveal} from '../components/TextMaskReveal'

interface CategoryObj {
  tr?: string
  en?: string
}

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

export function NewsPageV3() {
  const {data: news = [], isLoading: loading} = useNews()
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeNewsId, setActiveNewsId] = useState<string | null>(null)

  // SEO meta
  useSEO({
    title: `BIRIM - ${t('news') || 'Haberler'} | Görsel Dizin`,
    description: 'BIRIM ile ilgili güncel haberler, basın içerikleri ve görsel editoryal akış.',
    type: 'article',
    siteName: 'BIRIM',
    locale: isTr ? 'tr_TR' : 'en_US',
    section: 'News',
  })

  // Pre-process news
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

  // Categories without count
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

  // Currently focused article for the large sticky visual frame
  const currentFeaturedItem = useMemo(() => {
    if (activeNewsId) {
      const found = filteredNews.find(item => item.id === activeNewsId)
      if (found) return found
    }
    return filteredNews[0] || null
  }, [activeNewsId, filteredNews])

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
          {/* Kategoriler */}
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-1">
            {categories.map(cat => {
              const isActive = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs md:text-sm font-mono tracking-widest uppercase transition-all duration-300 relative py-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-[var(--text-primary)] font-medium'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{cat.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[var(--text-primary)] animate-scale-x" />
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

      {/* Görsel Ağırlıklı & Sade Split-Screen Akışı (Visual-Centric Editorial Split) */}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* Sol Kolon: Büyük Mimari Görsel Çerçevesi (Smooth Crossfade Showcase) */}
            <div className="hidden lg:block lg:col-span-6 sticky top-28 select-none">
              {currentFeaturedItem && (
                <div className="flex flex-col">
                  {/* Görsel Üstü Minimal Meta Başlık (Option 2) */}
                  <div className="flex items-center justify-between pb-3 px-1 text-[11px] font-mono tracking-[0.25em] text-neutral-500 dark:text-neutral-400 uppercase font-light border-b border-black/[0.04] dark:border-white/[0.06] mb-3 transition-colors duration-300">
                    <span>{currentFeaturedItem.categoryLabel}</span>
                    <span className="text-neutral-400 dark:text-neutral-600 font-mono tracking-widest text-[10px]">
                      BIRIM
                    </span>
                  </div>

                  <Link
                    to={`/news/${currentFeaturedItem.id}`}
                    className="group relative block w-full aspect-[4/3] xl:aspect-[16/11] overflow-hidden bg-neutral-900 border border-black/[0.08] dark:border-white/[0.1] shadow-2xl focus:outline-none"
                  >
                    {/* Katmanlı Yumuşak Geçişli Görseller (Smooth Stacked Crossfade) */}
                    {filteredNews.map(item => {
                      const isCurrent = item.id === currentFeaturedItem.id
                      if (!item.imageUrl) return null
                      return (
                        <div
                          key={item.id}
                          className={`absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out ${
                            isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                          }`}
                        >
                          <OptimizedImage
                            src={item.imageUrl}
                            alt={t(item.title)}
                            className="w-full h-full object-cover object-center"
                            quality={95}
                            loading="eager"
                            crop={
                              typeof item.mainImage === 'object' ? item.mainImage.crop : undefined
                            }
                            hotspot={
                              typeof item.mainImage === 'object'
                                ? item.mainImage.hotspot
                                : undefined
                            }
                            origWidth={
                              typeof item.mainImage === 'object'
                                ? ((item.mainImage as Record<string, unknown>)[
                                    'origWidth'
                                  ] as number)
                                : undefined
                            }
                            origHeight={
                              typeof item.mainImage === 'object'
                                ? ((item.mainImage as Record<string, unknown>)[
                                    'origHeight'
                                  ] as number)
                                : undefined
                            }
                          />
                        </div>
                      )
                    })}

                    {/* Hafif Degrade Katmanı: Aşağısı daha koyu, yukarısı açık */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-20 pointer-events-none" />

                    {/* Alt Tıklanabilir İnceleme İpucu */}
                    <div className="absolute inset-x-0 bottom-0 p-6 flex items-end justify-between z-20 pointer-events-none">
                      <span className="text-sm font-mono text-white/90 uppercase tracking-widest flex items-center gap-2">
                        <span>{isTr ? 'Haberi Görüntüle' : 'View Article'}</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </span>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Sağ Kolon: Sade ve Akıcı Tipografik Liste (Sakin, animasyonsuz metinler) */}
            <div className="lg:col-span-6 flex flex-col border-t border-black/[0.08] dark:border-white/[0.08]">
              {filteredNews.map(item => {
                const title = t(item.title)
                const isSelected = currentFeaturedItem?.id === item.id

                return (
                  <article
                    key={item.id}
                    onMouseEnter={() => setActiveNewsId(item.id)}
                    className={`group border-b border-black/[0.08] dark:border-white/[0.08] transition-colors duration-200 ${
                      isSelected
                        ? 'bg-black/[0.03] dark:bg-white/[0.04]'
                        : 'hover:bg-black/[0.015] dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Mobil Görsel (Sadece mobil/küçük ekranlarda kart üstünde gösterilir) */}
                    <div className="lg:hidden w-full aspect-[16/9] overflow-hidden bg-neutral-900 mt-4 select-none">
                      {item.imageUrl ? (
                        <OptimizedImage
                          src={item.imageUrl}
                          alt={title}
                          className="w-full h-full object-cover"
                          quality={85}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-600 font-mono text-xs">
                          BIRIM
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/news/${item.id}`}
                      className="flex flex-col py-6 sm:py-7 px-2 sm:px-4 gap-3 focus:outline-none"
                    >
                      {/* Üst Kategori Etiketi */}
                      <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-neutral-400 dark:text-neutral-500 font-light">
                        {item.categoryLabel}
                      </span>

                      {/* Haber Başlığı */}
                      <h2
                        className={`text-xl sm:text-2xl font-light uppercase tracking-tight font-sans transition-colors duration-200 leading-snug ${
                          isSelected
                            ? 'text-black dark:text-white'
                            : 'text-[var(--text-primary)] group-hover:text-black dark:group-hover:text-white'
                        }`}
                      >
                        {title}
                      </h2>

                      {/* Haberi Oku Butonu */}
                      <div className="pt-2 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] font-medium text-[var(--text-primary)]">
                        <span>{isTr ? 'Haberi Oku' : 'Read Article'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                      </div>
                    </Link>
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default NewsPageV3
