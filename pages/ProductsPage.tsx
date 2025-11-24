import {useState, useMemo} from 'react'
import {useParams} from 'react-router-dom'
import {ProductCard} from '../components/ProductCard'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {useProducts, useProductsByCategory} from '../src/hooks/useProducts'
import {useCategory} from '../src/hooks/useCategories'
import {useSiteSettings} from '../src/hooks/useSiteData'

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export function ProductsPage() {
  const {categoryId} = useParams<{categoryId: string}>()
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [sortBy, setSortBy] = useState('year-desc') // Default sort by newest
  const {t} = useTranslation()
  const {data: settings} = useSiteSettings()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'

  // React Query hooks - always call both, use enabled to control
  const {data: allProducts = [], isLoading: allProductsLoading} = useProducts()
  const {data: categoryProducts = [], isLoading: categoryProductsLoading} = useProductsByCategory(
    categoryId
  )
  const {data: category} = useCategory(categoryId)

  // Use category products if categoryId exists, otherwise use all products
  const products = categoryId ? categoryProducts : allProducts
  const loading = categoryId ? categoryProductsLoading : allProductsLoading

  const sortedProducts = useMemo(() => {
    const sorted = [...products]
    if (sortBy === 'name-asc') {
      sorted.sort((a, b) => t(a.name).localeCompare(t(b.name)))
    } else if (sortBy === 'year-desc') {
      sorted.sort((a, b) => b.year - a.year)
    }
    return sorted
  }, [products, sortBy, t])

  if (loading) {
    return (
      <div className="pt-20">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setIsSortOpen(false)
  }

  return (
    <div className="bg-gray-100">
      {/* Category Hero Image */}
      <div className="relative h-[450px] animate-fade-in-down">
        <div className="absolute inset-0">
          <OptimizedImage
            src={category?.heroImage || 'https://picsum.photos/seed/default/1920/1080'}
            alt={t(category?.name) || t('products')}
            className={`w-full h-full object-cover ${imageBorderClass}`}
            loading="eager"
            quality={90}
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative h-full flex items-center justify-center text-center text-white pt-20">
          <div>
            <h1
              className="text-4xl md:text-6xl font-light tracking-tighter uppercase"
              style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}
            >
              {category ? t(category.name) : t('view_all')}
            </h1>
            <p
              className="mt-4 text-lg max-w-2xl mx-auto font-light"
              style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}
            >
              {category ? t(category.subtitle) : t('all_products_subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Sort Controls */}
        <div className="flex justify-end items-center mb-12">
          <div className="relative">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 text-sm font-light text-gray-500 hover:text-gray-600 transition-transform duration-300 transform hover:-translate-y-1 hover:scale-105"
            >
              <span>{t('sort')}</span>
              <ChevronDownIcon />
            </button>
            {isSortOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10">
                <button
                  onClick={() => handleSortChange('year-desc')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t('sort_newest')}
                </button>
                <button
                  onClick={() => handleSortChange('name-asc')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t('sort_name_asc')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 animate-fade-in-up-subtle">
            {sortedProducts.map((product, index) => (
              <div
                key={product.id}
                style={{animationDelay: `${index * 100}ms`}}
                className="animate-fade-in-up-subtle"
              >
                <ProductCard product={product} variant="light" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 animate-fade-in-up-subtle text-center">
            {t('no_products_in_category')}
          </p>
        )}
      </div>
    </div>
  )
}
