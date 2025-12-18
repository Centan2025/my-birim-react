import {useState, useMemo, useEffect, useRef} from 'react'
import {useParams} from 'react-router-dom'
import {ProductCard} from '../components/ProductCard'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useProducts, useProductsByCategory} from '../hooks/useProducts'
import {useCategory, useCategories} from '../hooks/useCategories'
import {useSiteSettings} from '../hooks/useSiteData'
import type {Product} from '../types'
import ScrollReveal from '../components/ScrollReveal'
import {useSEO} from '../hooks/useSEO'
import {useHeaderTheme} from '../context/HeaderThemeContext'

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
  const sortRef = useRef<HTMLDivElement | null>(null)

  // React Query hooks - always call both, use enabled to control
  const {data: allProductsData, isLoading: allProductsLoading} = useProducts()
  const {data: categoryProductsData, isLoading: categoryProductsLoading} =
    useProductsByCategory(categoryId)
  const allProducts = useMemo(() => allProductsData ?? [], [allProductsData])
  const categoryProducts = useMemo(() => categoryProductsData ?? [], [categoryProductsData])
  const {data: category} = useCategory(categoryId)
  const {data: categories = []} = useCategories()
  const {setFromPalette, reset} = useHeaderTheme()

  // Use category products if categoryId exists, otherwise use all products
  const products = categoryId ? categoryProducts : allProducts
  const loading = categoryId ? categoryProductsLoading : allProductsLoading

  // Dışarı tıklayınca sort menüsünü kapat
  useEffect(() => {
    if (!isSortOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSortOpen])

  const sortedProducts = useMemo(() => {
    // If showing all products (no categoryId), group by category first
    if (!categoryId && allProducts.length > 0) {
      // Group products by category
      const productsByCategory = new Map<string, Product[]>()

      allProducts.forEach(product => {
        const catId = product.categoryId || 'uncategorized'
        if (!productsByCategory.has(catId)) {
          productsByCategory.set(catId, [])
        }
        productsByCategory.get(catId)!.push(product)
      })

      // Sort products within each category
      productsByCategory.forEach(categoryProducts => {
        if (sortBy === 'name-asc') {
          categoryProducts.sort((a, b) => t(a.name).localeCompare(t(b.name)))
        } else if (sortBy === 'year-desc') {
          categoryProducts.sort((a, b) => b.year - a.year)
        }
      })

      // Get category order from categories list (CMS orderRank sırasına göre zaten sıralı)
      const categoryOrder = categories.map(cat => cat.id)

      // Sort categories by their order in the categories list (CMS sıralaması)
      const sortedCategoryIds = Array.from(productsByCategory.keys()).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a)
        const indexB = categoryOrder.indexOf(b)

        // If both are in the list, use their CMS order
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB
        }
        // If only one is in the list, prioritize it
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        // If neither is in the list, sort alphabetically by category name as fallback
        const catA = categories.find(c => c.id === a)
        const catB = categories.find(c => c.id === b)
        if (catA && catB) {
          return t(catA.name).localeCompare(t(catB.name))
        }
        return a.localeCompare(b)
      })

      // Flatten products in category order
      const result: Product[] = []
      sortedCategoryIds.forEach(catId => {
        const categoryProducts = productsByCategory.get(catId) || []
        result.push(...categoryProducts)
      })

      return result
    }

    // If showing products from a specific category, just sort normally
    const sorted = [...products]
    if (sortBy === 'name-asc') {
      sorted.sort((a, b) => t(a.name).localeCompare(t(b.name)))
    } else if (sortBy === 'year-desc') {
      sorted.sort((a, b) => b.year - a.year)
    }
    return sorted
  }, [products, sortBy, t, categoryId, allProducts, categories])

  // SEO meta
  const categoryName = category ? t(category.name) : ''
  const pageTitle = categoryName || t('products') || 'Ürünler'
  const pageDescription = category
    ? t(category.subtitle) || pageTitle
    : t('all_products_subtitle') || pageTitle
  const heroImageUrl = category?.heroImage

  useSEO({
    title: `BIRIM - ${pageTitle}`,
    description: pageDescription,
    image: heroImageUrl,
    type: 'website',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'Products',
  })

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setIsSortOpen(false)
  }

  // Header temasını listelenen ürünlerin paletlerinden besle (öncelik kategori ürünleri)
  useEffect(() => {
    const sourceProducts = categoryId ? categoryProducts : allProducts
    const candidate = sourceProducts.find(
      p => typeof p.mainImage === 'object' && p.mainImage !== null && 'palette' in p.mainImage
    )
    if (candidate && typeof candidate.mainImage === 'object' && candidate.mainImage !== null && 'palette' in candidate.mainImage) {
      setFromPalette(candidate.mainImage.palette)
    } else {
      reset()
    }
    return () => reset()
  }, [categoryId, categoryProducts, allProducts, setFromPalette, reset])

  if (loading) {
    return (
      <div className="pt-20">
        <PageLoading message={t('loading')} />
      </div>
    )
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

      <div className="container mx-auto px-2 sm:px-2 lg:px-2 py-16">
        <Breadcrumbs
          className="mb-6"
          items={
            category
              ? [
                  {label: t('homepage'), to: '/'},
                  {label: t('products'), to: '/products'},
                  {label: t(category.name)},
                ]
              : [{label: t('homepage'), to: '/'}, {label: t('products')}]
          }
        />
        {/* Sort Controls */}
        <div className="flex justify-end items-center mb-12">
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 text-sm font-light text-gray-500 hover:text-gray-600 transition-transform duration-300 transform hover:-translate-y-1 hover:scale-105"
            >
              <span>{t('sort')}</span>
              <ChevronDownIcon />
            </button>
            {isSortOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 py-1 shadow-sm z-10">
                <button
                  onClick={() => handleSortChange('year-desc')}
                  className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                >
                  {t('sort_newest')}
                </button>
                <button
                  onClick={() => handleSortChange('name-asc')}
                  className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                >
                  {t('sort_name_asc')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {sortedProducts.length > 0 ? (
          !categoryId && allProducts.length > 0 ? (
            // Eğer kategori seçili değilse (tüm ürünler), kategorilere göre grupla ve başlık göster
            (() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const productsByCategory = new Map<string, {category: any, products: Product[]}>()
              
              sortedProducts.forEach(product => {
                const catId = product.categoryId || 'uncategorized'
                if (!productsByCategory.has(catId)) {
                  const category = categories.find(c => c.id === catId)
                  productsByCategory.set(catId, {category, products: []})
                }
                productsByCategory.get(catId)!.products.push(product)
              })

              // Kategori sırasına göre sırala
              const categoryOrder = categories.map(cat => cat.id)
              const sortedCategoryIds = Array.from(productsByCategory.keys()).sort((a, b) => {
                const indexA = categoryOrder.indexOf(a)
                const indexB = categoryOrder.indexOf(b)
                if (indexA !== -1 && indexB !== -1) return indexA - indexB
                if (indexA !== -1) return -1
                if (indexB !== -1) return 1
                return a.localeCompare(b)
              })

              let productIndex = 0
              return (
                <div>
                  {sortedCategoryIds.map(catId => {
                    const {category, products} = productsByCategory.get(catId)!
                    const categoryName = category ? t(category.name) : catId
                    const startIndex = productIndex
                    productIndex += products.length
                    
                    return (
                      <div key={catId} className="mb-16">
                        {/* Category Title */}
                        <h2 
                          className="font-oswald text-4xl md:text-5xl lg:text-6xl uppercase text-gray-900 mb-8"
                          style={{
                            fontFamily: '"Oswald", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '0.1em'
                          }}
                        >
                          {categoryName}
                        </h2>
                        {/* Products Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
                          {products.map((product, idx) => (
                            <ScrollReveal 
                              key={product.id} 
                              delay={startIndex + idx < 12 ? (startIndex + idx) * 20 : 0} 
                              threshold={0.01}
                            >
                              <ProductCard product={product} variant="light" />
                            </ScrollReveal>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()
          ) : (
            // Eğer kategori seçiliyse, normal grid göster
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
              {sortedProducts.map((product, index) => (
                <ScrollReveal 
                  key={product.id} 
                  delay={index < 12 ? index * 20 : 0} 
                  threshold={0.01}
                >
                  <ProductCard product={product} variant="light" />
                </ScrollReveal>
              ))}
            </div>
          )
        ) : (
          <ScrollReveal delay={0} threshold={0.01}>
            <p className="text-gray-600 text-center">
              {t('no_products_in_category')}
            </p>
          </ScrollReveal>
        )}
      </div>
    </div>
  )
}
