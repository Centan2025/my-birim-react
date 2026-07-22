import {Link} from 'react-router-dom'
import {useEffect, useMemo} from 'react'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useCategories} from '../hooks/useCategories'
import {useProducts} from '../hooks/useProducts'
import ScrollReveal from '../components/ScrollReveal'
import {useSEO} from '../hooks/useSEO'
import {useHeaderTheme} from '../context/HeaderThemeContext'

export function CategoriesPage() {
  const {data: categories = [], isLoading: categoriesLoading} = useCategories()
  const {data: allProducts = [], isLoading: productsLoading} = useProducts()
  const {t} = useTranslation()
  const {reset} = useHeaderTheme()
  const pageTitle = `BIRIM - ${t('categories') || t('products') || 'Kategoriler'}`

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'
  useSEO({
    title: pageTitle,
    description: t('products_page_subtitle') || t('products') || 'Ürün kategorileri',
    siteName: 'BIRIM',
    type: 'website',
    locale: 'tr_TR',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: t('categories') || t('products') || 'Kategoriler',
      description: t('products_page_subtitle') || 'Ürün kategorileri',
      url: `${baseUrl}/#/categories`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: categories.length,
        itemListElement: categories.slice(0, 30).map((c, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: t(c.name),
          url: `${baseUrl}/#/products/${c.id}`,
        })),
      },
    },
  })

  // Ürünleri kategori ID'sine gore haritalayarak aramalari O(N) karmasikligina dusur
  const categoryImageMap = useMemo(() => {
    const map = new Map<string, unknown>()
    for (const product of allProducts) {
      const catId = product.categoryId?.toLowerCase()
      const hasUrl =
        typeof product.mainImage === 'object' && product.mainImage !== null
          ? (product.mainImage as {url?: string}).url
          : false
      if (product && catId && hasUrl && !map.has(catId)) {
        map.set(catId, product.mainImage)
      }
    }
    return map
  }, [allProducts])

  // Her kategori için görsel belirle: heroImage yoksa haritadan bul
  const categoriesWithImages = useMemo(() => {
    return categories.map(category => {
      // Eğer kategori görseli varsa onu kullan
      if (category.heroImage) {
        return {...category, displayImage: category.heroImage}
      }

      // Kategori görseli yoksa, harita uzerindeki urun görselini kullan
      const displayImage = categoryImageMap.get(category.id) || null
      return {...category, displayImage}
    })
  }, [categories, categoryImageMap])

  // Header temasını varsayılana sıfırla (Kategoriler dizini için rastgele renk atamasını kaldır)
  useEffect(() => {
    reset()
    return () => reset()
  }, [reset])

  if (categoriesLoading || productsLoading) {
    return (
      <div className="pt-20 min-h-screen">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-secondary)] min-h-screen transition-colors duration-500 pt-20 md:pt-24 lg:pt-24 selection:bg-primary selection:text-black">
      {/* Breadcrumb Band */}
      <div className="w-full relative z-20">
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4 text-gray-400">
          <Breadcrumbs
            items={[{label: t('homepage'), to: '/'}, {label: t('categories') || 'Ürün Grupları'}]}
          />
        </div>
      </div>

      {/* Sayfa Başlığı */}
      <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-4 md:pt-12 pb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)] tracking-tight text-center uppercase">
          {t('categories') || 'Ürün Grupları'}
        </h1>
      </div>

      {/* Categories Grid */}
      <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pb-16 md:pb-24">
        {categoriesWithImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2">
            {categoriesWithImages.map((category, index) => (
              <ScrollReveal
                key={category.id}
                delay={index < 12 ? index * 50 : 0}
                threshold={0.01}
                initialScale={1}
                distance={0}
                direction="none"
              >
                <Link to={`/products/${category.id}`} className="group block overflow-hidden rounded-none">
                  <div className="relative h-[300px] sm:h-[350px] lg:h-[450px] overflow-hidden rounded-none border-none">
                    {category.displayImage && (
                      <OptimizedImage
                        src={
                          typeof category.displayImage === 'string'
                            ? category.displayImage
                            : (category.displayImage as {url: string}).url
                        }
                        srcMobile={
                          typeof category.displayImage === 'object'
                            ? (category.displayImage as {urlMobile?: string}).urlMobile
                            : undefined
                        }
                        srcDesktop={
                          typeof category.displayImage === 'object'
                            ? (category.displayImage as {urlDesktop?: string}).urlDesktop
                            : undefined
                        }
                        alt={t(category.name)}
                        className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03] rounded-none"
                        loading="lazy"
                        quality={85}
                        crop={
                          typeof category.displayImage === 'object'
                            ? (
                                category.displayImage as {
                                  crop?: import('../types').R2ImageMetadata['crop']
                                }
                              ).crop
                            : undefined
                        }
                        hotspot={
                          typeof category.displayImage === 'object'
                            ? (
                                category.displayImage as {
                                  hotspot?: import('../types').R2ImageMetadata['hotspot']
                                }
                              ).hotspot
                            : undefined
                        }
                      />
                    )}
                    {/* Text content inside at the bottom */}
                    <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8 flex flex-col justify-end z-10">
                      <h2 className="text-xl md:text-2xl font-light tracking-widest text-[var(--text-primary)] uppercase leading-none">
                        {t(category.name)}
                      </h2>
                      {/* Line expanding from w-8 to w-full on hover (matching DesignersPage) */}
                      <div className="h-px w-8 bg-[var(--text-primary)]/30 my-3 group-hover:w-full transition-all duration-700 ease-in-out"></div>
                      {category.subtitle && (
                        <p className="text-[var(--text-secondary)] text-xs md:text-sm font-light tracking-widest uppercase opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-700 ease-in-out line-clamp-2">
                          {t(category.subtitle)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal delay={0} threshold={0.01}>
            <p className="text-[var(--text-secondary)] text-center">
              {t('no_products_in_category')}
            </p>
          </ScrollReveal>
        )}
      </div>
    </div>
  )
}
