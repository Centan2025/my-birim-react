import {RefObject, FC, useState, useEffect, useCallback} from 'react'
import {Link} from 'react-router-dom'
import type {Category, Designer, Product} from '../types'
import type {HeaderTranslateFn} from './HeaderShared'

interface SearchResults {
  products: Product[]
  designers: Designer[]
  categories: Category[]
}

interface AllData {
  products: Product[]
  designers: Designer[]
  categories: Category[]
}

interface HeaderSearchPanelProps {
  isOpen: boolean
  isMobile: boolean
  isHeaderVisible: boolean
  headerHeight: number
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  searchResults: SearchResults
  isSearching: boolean
  allData: AllData | null
  t: HeaderTranslateFn
  closeSearch: () => void
  searchPanelRef: RefObject<HTMLDivElement>
  searchInputRef?: RefObject<HTMLInputElement>
  searchButtonRef?: RefObject<HTMLButtonElement | null>
  isLightMode: boolean
}

const getProductImageUrl = (product: Product): string => {
  if (typeof product.mainImage === 'string' && product.mainImage.trim().length > 0) {
    return product.mainImage
  }
  if (
    product.mainImage &&
    typeof product.mainImage === 'object' &&
    'url' in product.mainImage &&
    typeof product.mainImage.url === 'string' &&
    product.mainImage.url.trim().length > 0
  ) {
    return product.mainImage.url
  }
  return ''
}

const getCategoryImageUrl = (category: Category, allProducts?: Product[]): string => {
  // 1. Kendi heroImage görseli varsa onu kullan
  if (typeof category.heroImage === 'string' && category.heroImage.trim().length > 0) {
    return category.heroImage
  }
  if (
    category.heroImage &&
    typeof category.heroImage === 'object' &&
    'url' in category.heroImage &&
    typeof category.heroImage.url === 'string' &&
    category.heroImage.url.trim().length > 0
  ) {
    return category.heroImage.url
  }

  // 2. Kategori görseli yoksa, CategoriesPage mantığı gibi bu kategoriye ait ilk ürünün görselini bul
  if (allProducts && allProducts.length > 0) {
    const catId = category.id?.toLowerCase()
    const product = allProducts.find(p => p.categoryId?.toLowerCase() === catId && p.mainImage)
    if (product) {
      const productImg = getProductImageUrl(product)
      if (productImg) return productImg
    }
  }

  return ''
}

const getDesignerImageUrl = (designer: Designer): string => {
  if (typeof designer.image === 'string' && designer.image.trim().length > 0) {
    return designer.image
  }
  if (
    designer.image &&
    typeof designer.image === 'object' &&
    'url' in designer.image &&
    typeof designer.image.url === 'string' &&
    designer.image.url.trim().length > 0
  ) {
    return designer.image.url
  }
  return ''
}

export const HeaderSearchPanel: FC<HeaderSearchPanelProps> = ({
  isOpen,
  isMobile,
  isHeaderVisible,
  headerHeight,
  searchQuery,
  searchResults,
  isSearching,
  allData,
  t,
  closeSearch,
  searchPanelRef,
  searchButtonRef,
  isLightMode,
}) => {
  const [searchOffset, setSearchOffset] = useState<number>(24)

  const updateSearchOffset = useCallback(() => {
    if (searchButtonRef?.current) {
      const btnRect = searchButtonRef.current.getBoundingClientRect()
      setSearchOffset(Math.round(btnRect.left))
    }
  }, [searchButtonRef])

  useEffect(() => {
    if (!isOpen) return
    updateSearchOffset()
    window.addEventListener('resize', updateSearchOffset)
    return () => window.removeEventListener('resize', updateSearchOffset)
  }, [isOpen, updateSearchOffset])

  // ESC ile kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeSearch()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeSearch])

  const isResultsVisible = isOpen && searchQuery.trim().length > 0

  return (
    <div>
      {/* Tarayıcı varsayılan arama ikonlarını temizle */}
      <style>
        {`
          #global-search-input::-webkit-search-decoration,
          #global-search-input::-webkit-search-cancel-button,
          #global-search-input::-webkit-search-results-button,
          #global-search-input::-webkit-search-results-decoration,
          #global-search-input-mobile::-webkit-search-decoration,
          #global-search-input-mobile::-webkit-search-cancel-button,
          #global-search-input-mobile::-webkit-search-results-button,
          #global-search-input-mobile::-webkit-search-results-decoration {
            display: none;
          }

          #global-search-input:focus,
          #global-search-input:focus-visible,
          #global-search-input:active,
          #global-search-input-mobile:focus,
          #global-search-input-mobile:focus-visible,
          #global-search-input-mobile:active {
            outline: none !important;
            box-shadow: none !important;
          }
        `}
      </style>

      {/* Arama Sonuçları Dropdown Paneli: Sadece arama yapıldığında aşağı açılır */}
      <div
        ref={searchPanelRef}
        id="search-panel"
        role="region"
        aria-label={t('search_results') || 'Arama Sonuçları'}
        className={`fixed left-0 right-0 z-[100] backdrop-blur-xl transition-all duration-300 ease-out ${
          isResultsVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        } ${isLightMode ? 'bg-white/95 text-neutral-900 shadow-xl border-b border-black/10' : 'bg-neutral-900/95 text-white shadow-2xl border-b border-white/10'}`}
        style={{
          top: isHeaderVisible ? `${headerHeight}px` : '0px',
          backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 15, 15, 0.94)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        <div
          className={`w-full ${isMobile ? 'py-4 px-4 sm:px-6' : 'py-5'}`}
          style={{
            paddingLeft: isMobile ? undefined : `${searchOffset}px`,
            paddingRight: isMobile ? undefined : '2rem',
          }}
        >
          <div className="w-full max-w-xl">
            {/* Arama Sonuçları */}
            {searchQuery.length > 0 && (
              <div className="mt-2 sm:mt-5 max-h-[65vh] sm:max-h-[50vh] overflow-y-auto pr-2 hide-scrollbar">
                {isSearching && (
                  <p className="text-center py-4 text-sm text-neutral-400 font-inter">
                    {t('searching')}
                  </p>
                )}

                {!isSearching &&
                  searchQuery.length > 1 &&
                  searchResults.products.length === 0 &&
                  searchResults.designers.length === 0 &&
                  searchResults.categories.length === 0 && (
                    <p
                      className={`text-center py-4 text-sm font-inter ${
                        isLightMode ? 'text-neutral-500' : 'text-neutral-400'
                      }`}
                    >
                      {t('search_no_results', searchQuery)}
                    </p>
                  )}

                {searchResults.products.length > 0 && (
                  <div className="mb-5">
                    <h3
                      className={`text-xs font-semibold uppercase tracking-wider mb-2 pl-1 ${
                        isLightMode ? 'text-neutral-500' : 'text-neutral-400'
                      }`}
                    >
                      {t('products')}
                    </h3>
                    <div className="space-y-1.5">
                      {searchResults.products.map(product => {
                        const designerNameSource = allData?.designers.find(
                          d => d.id === product.designerId
                        )?.name
                        const designerName = designerNameSource ? t(designerNameSource) : ''
                        const productImgUrl = getProductImageUrl(product)

                        return (
                          <Link
                            key={product.id}
                            to={`/product/${product.id}`}
                            onClick={closeSearch}
                            className={`flex items-center p-2.5 transition-colors duration-200 ${
                              isLightMode ? 'hover:bg-black/5' : 'hover:bg-white/10'
                            }`}
                          >
                            {productImgUrl ? (
                              <img
                                src={productImgUrl}
                                alt={t(product.name)}
                                className="w-12 h-12 object-cover mr-3.5 flex-shrink-0 bg-neutral-200 dark:bg-neutral-800"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 mr-3.5 flex-shrink-0 flex items-center justify-center text-xs font-medium text-neutral-500 uppercase">
                                {t(product.name).slice(0, 2)}
                              </div>
                            )}
                            <div>
                              <p
                                className={`font-semibold text-sm ${
                                  isLightMode ? 'text-neutral-900' : 'text-white'
                                }`}
                              >
                                {t(product.name)}
                              </p>
                              {designerName && (
                                <p
                                  className={`text-xs ${
                                    isLightMode ? 'text-neutral-500' : 'text-neutral-400'
                                  }`}
                                >
                                  {designerName}
                                </p>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {searchResults.categories.length > 0 && (
                  <div className="mb-5">
                    <h3
                      className={`text-xs font-semibold uppercase tracking-wider mb-2 pl-1 ${
                        isLightMode ? 'text-neutral-500' : 'text-neutral-400'
                      }`}
                    >
                      {t('categories')}
                    </h3>
                    <div className="space-y-1.5">
                      {searchResults.categories.map(category => {
                        const categoryImgUrl = getCategoryImageUrl(category, allData?.products)
                        return (
                          <Link
                            key={category.id}
                            to={`/products/${category.id}`}
                            onClick={closeSearch}
                            className={`flex items-center p-2.5 transition-colors duration-200 ${
                              isLightMode ? 'hover:bg-black/5' : 'hover:bg-white/10'
                            }`}
                          >
                            {categoryImgUrl ? (
                              <img
                                src={categoryImgUrl}
                                alt={t(category.name)}
                                className="w-12 h-12 object-contain bg-[var(--bg-primary)] p-0.5 mr-3.5 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 mr-3.5 flex-shrink-0 flex items-center justify-center text-xs font-medium text-neutral-500 uppercase">
                                {t(category.name).slice(0, 2)}
                              </div>
                            )}
                            <div>
                              <p
                                className={`font-semibold text-sm ${
                                  isLightMode ? 'text-neutral-900' : 'text-white'
                                }`}
                              >
                                {t(category.name)}
                              </p>
                              <p
                                className={`text-xs ${
                                  isLightMode ? 'text-neutral-500' : 'text-neutral-400'
                                }`}
                              >
                                {t('category')}
                              </p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {searchResults.designers.length > 0 && (
                  <div>
                    <h3
                      className={`text-xs font-semibold uppercase tracking-wider mb-2 pl-1 ${
                        isLightMode ? 'text-neutral-500' : 'text-neutral-400'
                      }`}
                    >
                      {t('designers')}
                    </h3>
                    <div className="space-y-1.5">
                      {searchResults.designers.map(designer => {
                        const designerImgUrl = getDesignerImageUrl(designer)
                        return (
                          <Link
                            key={designer.id}
                            to={`/designer/${designer.id}`}
                            onClick={closeSearch}
                            className={`flex items-center p-2.5 transition-colors duration-200 ${
                              isLightMode ? 'hover:bg-black/5' : 'hover:bg-white/10'
                            }`}
                          >
                            {designerImgUrl ? (
                              <img
                                src={designerImgUrl}
                                alt={t(designer.name)}
                                className="w-12 h-12 object-cover mr-3.5 flex-shrink-0 bg-neutral-200 dark:bg-neutral-800"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 mr-3.5 flex-shrink-0 flex items-center justify-center text-xs font-medium text-neutral-500 uppercase">
                                {t(designer.name).slice(0, 2)}
                              </div>
                            )}
                            <div>
                              <p
                                className={`font-semibold text-sm ${
                                  isLightMode ? 'text-neutral-900' : 'text-white'
                                }`}
                              >
                                {t(designer.name)}
                              </p>
                              <p
                                className={`text-xs ${
                                  isLightMode ? 'text-neutral-500' : 'text-neutral-400'
                                }`}
                              >
                                {t('designer')}
                              </p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
