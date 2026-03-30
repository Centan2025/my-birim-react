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
      <div className="relative h-[500px] animate-fade-in-down hero-section">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
            {categoriesWithImages.map((category, index) => (
              <ScrollReveal
                key={category.id}
                delay={index < 12 ? index * 50 : 0}
                threshold={0.01}
                initialScale={1}
                distance={0}
                direction="none"
              >
                <Link to={`/products/${category.id}`} className="group block overflow-hidden">
                  <div className="relative h-[300px] sm:h-[350px] lg:h-[450px] overflow-hidden rounded-none border-none">
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
                        className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.08] rounded-none"
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
                    {/* Bottom-heavy gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-500"></div>

                    {/* Text content inside at the bottom */}
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 lg:p-6 flex flex-col justify-end h-full">
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-oswald font-light tracking-[0.1em] text-white uppercase drop-shadow-md">
                        {t(category.name)}
                      </h2>
                      <div className="h-px w-12 bg-white/40 mt-2 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                      <p className="mt-2 text-white/80 text-sm md:text-base font-light tracking-wide opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500">
                        {t(category.subtitle)}
                      </p>
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
