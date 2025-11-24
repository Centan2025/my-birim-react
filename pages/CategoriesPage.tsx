import {Link} from 'react-router-dom'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {useCategories} from '../src/hooks/useCategories'
import {useSiteSettings} from '../src/hooks/useSiteData'

export function CategoriesPage() {
  const {data: categories = [], isLoading: loading} = useCategories()
  const {t} = useTranslation()
  const {data: settings} = useSiteSettings()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'

  if (loading) {
    return (
      <div className="pt-20 min-h-screen">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  return (
    <div className="bg-gray-100">
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
            <h1
              className="text-4xl md:text-6xl font-bold tracking-tighter uppercase"
              style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}
            >
              {t('products')}
            </h1>
            <p
              className="mt-4 text-lg max-w-2xl mx-auto"
              style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}
            >
              {t('products_page_subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 gap-12">
            {categories.map(category => (
              <Link
                key={category.id}
                to={`/products/${category.id}`}
                className="group block overflow-hidden transition-all duration-300"
              >
                <div className={`relative h-[600px] overflow-hidden ${imageBorderClass}`}>
                  <OptimizedImage
                    src={category.heroImage}
                    alt={t(category.name)}
                    className={`w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.03] ${imageBorderClass}`}
                    loading="lazy"
                    quality={85}
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h2
                      className="text-4xl md:text-5xl lg:text-6xl font-bold text-white uppercase tracking-wider"
                      style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}
                    >
                      {t(category.name)}
                    </h2>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-gray-600 text-lg md:text-xl">{t(category.subtitle)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center">{t('no_products_in_category')}</p>
        )}
      </div>
    </div>
  )
}
