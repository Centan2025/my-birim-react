import {Link} from 'react-router-dom'
import {useEffect, useMemo} from 'react'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {useCategories} from '../hooks/useCategories'
import {useProducts} from '../hooks/useProducts'
import {useSiteSettings} from '../hooks/useSiteData'
import ScrollReveal from '../components/ScrollReveal'
import {useSEO} from '../hooks/useSEO'
import {useHeaderTheme} from '../context/HeaderThemeContext'

export function CategoriesPage() {
  const {data: categories = [], isLoading: categoriesLoading} = useCategories()
  const {data: allProducts = [], isLoading: productsLoading} = useProducts()
  const {t} = useTranslation()
  const {data: settings} = useSiteSettings()
  const {reset} = useHeaderTheme()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'
  const pageTitle = `BIRIM - ${t('categories') || t('products') || 'Kategoriler'}`

  useSEO({
    title: pageTitle,
    description: t('products_page_subtitle') || t('products') || 'Ürün kategorileri',
    siteName: 'BIRIM',
    type: 'website',
    locale: 'tr_TR',
  })

  // Ürünleri kategori ID'sine gore haritalayarak aramalari O(N) karmasikligina dusur
  const categoryImageMap = useMemo(() => {
    const map = new Map<string, any>()
    for (const product of allProducts) {
      if (product && product.categoryId && product.mainImage && !map.has(product.categoryId)) {
        map.set(product.categoryId, product.mainImage)
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
    <div className="bg-[var(--bg-tertiary)] min-h-screen transition-colors duration-500">
      {/* Hero Section */}
      <div className="relative h-[500px] animate-fade-in-down">
        <div className="absolute inset-0">
          <OptimizedImage
            src="https://picsum.photos/seed/categories-hero/1920/1080"
            alt={t('products')}
            className={`w-full h-full object-cover ${imageBorderClass}`}
            loading="eager"
            quality={90}
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative h-full flex items-center justify-center text-center text-white pt-20">
          <div>
            <h1 className="text-4xl md:text-6xl font-oswald font-light tracking-[0.1em] uppercase drop-shadow-md">
              {t('products')}
            </h1>
            <p className="mt-4 text-lg max-w-2xl mx-auto drop-shadow-md">
              {t('products_page_subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-16">
        {categoriesWithImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {categoriesWithImages.map((category, index) => (
              <ScrollReveal key={category.id} delay={index < 12 ? index * 20 : 0} threshold={0.01}>
                <Link
                  to={`/products/${category.id}`}
                  className="group block overflow-hidden transition-all duration-300"
                >
                  <div className={`relative h-[450px] overflow-hidden ${imageBorderClass}`}>
                    {category.displayImage && (
                      <OptimizedImage
                        src={
                          typeof category.displayImage === 'string'
                            ? category.displayImage
                            : category.displayImage.url
                        }
                        srcMobile={
                          typeof category.displayImage === 'object'
                            ? category.displayImage.urlMobile
                            : undefined
                        }
                        srcDesktop={
                          typeof category.displayImage === 'object'
                            ? category.displayImage.urlDesktop
                            : undefined
                        }
                        alt={t(category.name)}
                        className={`w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.03] ${imageBorderClass}`}
                        loading="lazy"
                        quality={85}
                        crop={
                          typeof category.displayImage === 'object'
                            ? (category.displayImage as any).crop
                            : undefined
                        }
                        hotspot={
                          typeof category.displayImage === 'object'
                            ? (category.displayImage as any).hotspot
                            : undefined
                        }
                      />
                    )}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300"></div>
                    <div className="absolute inset-0 flex items-end justify-center pb-12">
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-oswald font-light tracking-[0.1em] text-white uppercase drop-shadow-md">
                        {t(category.name)}
                      </h2>
                    </div>
                  </div>
                  <div className="mt-6">
                    <p className="text-[var(--text-secondary)] text-lg md:text-xl">
                      {t(category.subtitle)}
                    </p>
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
