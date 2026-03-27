import {RefObject, FC} from 'react'
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
  searchInputRef: RefObject<HTMLInputElement>
  isLightMode: boolean
}

export const HeaderSearchPanel: FC<HeaderSearchPanelProps> = ({
  isOpen,
  isMobile,
  isHeaderVisible,
  headerHeight,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  isSearching,
  allData,
  t,
  closeSearch,
  searchPanelRef,
  searchInputRef,
  isLightMode,
}) => {
  return (
    <div>
      {/* Tarayıcıların varsayılan mavi X ikonunu gizle ve özel X ikonunu stillendir */}
      <style>
        {`
          #global-search-input::-webkit-search-decoration,
          #global-search-input::-webkit-search-cancel-button,
          #global-search-input::-webkit-search-results-button,
          #global-search-input::-webkit-search-results-decoration {
            display: none;
          }

          @keyframes birim-search-x-spin-in {
            0% {
              transform: rotate(-90deg) scale(0.6);
              opacity: 0;
            }
            60% {
              transform: rotate(15deg) scale(1);
              opacity: 1;
            }
            100% {
              transform: rotate(0deg) scale(1);
              opacity: 1;
            }
          }

          .birim-search-x-animate-in {
            animation: birim-search-x-spin-in 0.3s ease-out;
          }

        `}
      </style>

      <div
        ref={searchPanelRef}
        id="search-panel"
        role="search"
        aria-label={t('search') || 'Ara'}
        className={`fixed left-0 right-0 z-[100] backdrop-blur-lg transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } ${isLightMode ? 'bg-white/95' : 'bg-black/80'}`}
        style={{
          // Paneli tam olarak header'ın altından başlat
          top: isHeaderVisible ? `${headerHeight}px` : '0px',
          borderTop: 'none',
        }}
      >
        <div className={`container mx-auto px-6 ${isMobile ? 'py-4' : 'py-8'}`}>
          <div className="w-full max-w-3xl mx-auto">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="search"
                placeholder={t('search_placeholder') || ''}
                id="global-search-input"
                name="global-search"
                className={`w-full bg-transparent outline-none transition-colors duration-300 pr-10 ${
                  isMobile ? 'text-lg pb-2' : 'text-2xl pb-3'
                } ${isLightMode ? 'text-black placeholder-black/40' : 'text-white placeholder-white/40'}`}
                value={searchQuery}
                onChange={e => onSearchQueryChange(e.target.value)}
              />
              {/* Alt çizgi: header desktop menü alt çizgisine benzer, ortadan iki yana büyüyen animasyon */}
              <div
                className={`pointer-events-none absolute left-0 right-0 ${
                  isMobile ? 'bottom-[0px]' : 'bottom-[2px]'
                } h-px transform origin-center transition-transform duration-300 ease-out ${
                  isOpen ? 'scale-x-100' : 'scale-x-0'
                } ${isLightMode ? 'bg-black/20' : 'bg-gray-500'}`}
              />

              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSearchQueryChange('')}
                  aria-label={t('clear_search') || 'Aramayı temizle'}
                  className="absolute right-0 inset-y-0 flex items-center justify-center px-2 group"
                >
                  {/* Sade, ince beyaz çizgilerden oluşan X ikonu (biraz büyütülmüş) */}
                  <span className="relative w-5 h-5 birim-search-x-animate-in">
                    <span className={`absolute inset-0 before:absolute before:left-1/2 before:top-[3px] before:bottom-[3px] before:w-[1px] before:-translate-x-1/2 before:rotate-45 after:absolute after:left-1/2 after:top-[3px] after:bottom-[3px] after:w-[1px] after:-translate-x-1/2 after:-rotate-45 transition-colors ${
                        isLightMode ? 'before:bg-black after:bg-black group-hover:before:bg-black/70 group-hover:after:bg-black/70' : 'before:bg-white after:bg-white group-hover:before:bg-white/90 group-hover:after:bg-white/90'
                    }`} />
                  </span>
                </button>
              )}
            </div>

            {searchQuery.length > 0 && (
              <div className="mt-6 max-h-[50vh] overflow-y-auto pr-2">
                {isSearching && <p className="text-center text-gray-300">{t('searching')}</p>}

                {!isSearching &&
                  searchQuery.length > 1 &&
                  searchResults.products.length === 0 &&
                  searchResults.designers.length === 0 &&
                  searchResults.categories.length === 0 && (
                    <p className={`text-center ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>
                      {t('search_no_results', searchQuery)}
                    </p>
                  )}

                {searchResults.products.length > 0 && (
                  <div className="mb-6">
                    <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 pl-3 ${
                        isLightMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {t('products')}
                    </h3>
                    <div className="space-y-2">
                      {searchResults.products.map(product => {
                        const designerNameSource = allData?.designers.find(
                          d => d.id === product.designerId
                        )?.name
                        const designerName = designerNameSource ? t(designerNameSource) : ''
                        return (
                          <Link
                            key={product.id}
                            to={`/product/${product.id}`}
                            onClick={closeSearch}
                            className={`flex items-center p-3 rounded-md transition-colors duration-200 ${
                                isLightMode ? 'hover:bg-black/5' : 'hover:bg-white/10'
                            }`}
                          >
                            <img
                              src={
                                typeof product.mainImage === 'string'
                                  ? product.mainImage
                                  : product.mainImage?.url || ''
                              }
                              alt={t(product.name)}
                              className="w-12 h-12 object-cover rounded-md mr-4 flex-shrink-0"
                            />
                            <div>
                              <p className={`font-semibold ${isLightMode ? 'text-black' : 'text-white'}`}>{t(product.name)}</p>
                              {designerName && (
                                <p className={`text-sm ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>{designerName}</p>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {searchResults.categories.length > 0 && (
                  <div className="mb-6">
                    <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 pl-3 ${
                        isLightMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {t('categories')}
                    </h3>
                    <div className="space-y-2">
                      {searchResults.categories.map(category => (
                        <Link
                          key={category.id}
                          to={`/products/${category.id}`}
                          onClick={closeSearch}
                          className={`flex items-center p-3 rounded-md transition-colors duration-200 ${
                              isLightMode ? 'hover:bg-black/5' : 'hover:bg-white/10'
                          }`}
                        >
                          <img
                            src={
                              typeof category.heroImage === 'string'
                                ? category.heroImage
                                : category.heroImage?.url || ''
                            }
                            alt={t(category.name)}
                            className="w-12 h-12 object-cover rounded-md mr-4 flex-shrink-0"
                          />
                          <div>
                            <p className={`font-semibold ${isLightMode ? 'text-black' : 'text-white'}`}>{t(category.name)}</p>
                            <p className={`text-sm ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('category')}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.designers.length > 0 && (
                  <div>
                    <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 pl-3 ${
                        isLightMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {t('designers')}
                    </h3>
                    <div className="space-y-2">
                      {searchResults.designers.map(designer => (
                        <Link
                          key={designer.id}
                          to={`/designer/${designer.id}`}
                          onClick={closeSearch}
                          className={`flex items-center p-3 rounded-md transition-colors duration-200 ${
                              isLightMode ? 'hover:bg-black/5' : 'hover:bg-white/10'
                          }`}
                        >
                          <img
                            src={
                              typeof designer.image === 'string'
                                ? designer.image
                                : designer.image?.url || ''
                            }
                            alt={t(designer.name)}
                            className="w-12 h-12 object-cover rounded-full mr-4 flex-shrink-0"
                          />
                          <div>
                            <p className={`font-semibold ${isLightMode ? 'text-black' : 'text-white'}`}>{t(designer.name)}</p>
                            <p className={`text-sm ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('designer')}</p>
                          </div>
                        </Link>
                      ))}
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
