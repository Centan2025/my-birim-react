import React, {useMemo, useState} from 'react'
import {useNavigate, Link} from 'react-router-dom'
import {motion, AnimatePresence} from 'framer-motion'
import {useSelection} from '../../context/SelectionContext'
import {useProducts} from '../../hooks/useProducts'
import {useCategories} from '../../hooks/useCategories'
import {useTranslation} from '../../i18n'
import {useFocusTrap} from '../../hooks/useFocusTrap'
import {OptimizedImage} from '../OptimizedImage'
import {InquiryModal} from './InquiryModal'
import type {Product, Category} from '../../types'
import {getProductImageProps} from '../../types/seckim'

export const SelectionDrawer: React.FC = () => {
  const {isDrawerOpen, closeDrawer, selectedProductIds, removeFromSelection} = useSelection()
  const {data: allProducts = [], isLoading: isProductsLoading} = useProducts()
  const {data: categories = []} = useCategories()
  const {t} = useTranslation()
  const navigate = useNavigate()
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)

  const drawerRef = useFocusTrap(isDrawerOpen, closeDrawer)

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of categories as Category[]) {
      map.set(c.id, t(c.name))
    }
    return map
  }, [categories, t])

  const selectedProducts = useMemo(() => {
    const idSet = new Set(selectedProductIds)
    return (allProducts as Product[]).filter(p => idSet.has(p.id))
  }, [allProducts, selectedProductIds])

  const handleNavigateToSeckim = () => {
    closeDrawer()
    navigate('/seckim')
  }

  const handleExplore = () => {
    closeDrawer()
    navigate('/products')
  }

  return (
    <>
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[75] flex justify-end" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.3}}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={closeDrawer}
              aria-label="Kapat"
            />

            {/* Slide-over Drawer */}
            <motion.div
              ref={drawerRef as React.RefObject<HTMLDivElement>}
              initial={{x: '100%'}}
              animate={{x: 0}}
              exit={{x: '100%'}}
              transition={{duration: 0.35, ease: [0.16, 1, 0.3, 1]}}
              className="relative w-full max-w-md h-full bg-[var(--bg-primary)] text-[var(--text-primary)] border-l border-[var(--border-primary)] shadow-2xl flex flex-col z-10"
            >
              {/* Drawer Header */}
              <div className="px-6 py-6 border-b border-[var(--border-primary)] flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-light tracking-wider uppercase text-[var(--text-primary)]">
                    SEÇKİM
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-light tracking-wide">
                    Projeniz için seçtiğiniz ürünler
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDrawer}
                  className="p-2 text-neutral-500 hover:text-[var(--text-primary)] transition-colors cursor-pointer -mr-2"
                  aria-label="Kapat"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {isProductsLoading && selectedProductIds.length > 0 ? (
                  <div className="space-y-4">
                    {selectedProductIds.map(id => (
                      <div key={id} className="flex items-center gap-4 animate-pulse py-2">
                        <div className="w-20 h-20 bg-[var(--bg-secondary)] flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-[var(--bg-secondary)] w-3/4" />
                          <div className="h-3 bg-[var(--bg-secondary)] w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
                    <div className="w-12 h-12 rounded-full border border-[var(--border-primary)] flex items-center justify-center mb-5 text-neutral-400">
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-light uppercase tracking-wider text-[var(--text-primary)]">
                      Henüz bir seçkiniz yok
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-2 max-w-xs font-light leading-relaxed">
                      Beğendiğiniz ürünleri seçkinize ekleyerek projeniz için bir araya
                      getirebilirsiniz.
                    </p>
                    <button
                      type="button"
                      onClick={handleExplore}
                      className="mt-8 px-6 py-3 border border-[var(--border-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-primary)] text-xs uppercase tracking-widest hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all cursor-pointer font-semibold"
                    >
                      ÜRÜNLERİ KEŞFET
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-primary)]">
                    {selectedProducts.map(product => {
                      const imgProps = getProductImageProps(product)
                      const categoryTitle = categoryMap.get(product.categoryId) || ''

                      return (
                        <div
                          key={product.id}
                          className="py-4 first:pt-0 last:pb-0 flex items-center gap-4 group"
                        >
                          <Link
                            to={`/product/${product.id}`}
                            onClick={closeDrawer}
                            className="w-20 h-20 bg-[var(--bg-secondary)] flex-shrink-0 relative overflow-hidden flex items-center justify-center p-1 block"
                          >
                            <OptimizedImage
                              {...imgProps}
                              alt={t(product.name)}
                              width={80}
                              height={80}
                              className="w-full h-full object-contain"
                              fitAuto={true}
                            />
                          </Link>

                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/product/${product.id}`}
                              onClick={closeDrawer}
                              className="text-sm font-medium tracking-wide uppercase hover:opacity-75 transition-opacity block truncate text-[var(--text-primary)]"
                            >
                              {t(product.name)}
                            </Link>
                            {categoryTitle && (
                              <p className="text-xs text-[var(--text-secondary)] font-light mt-0.5 truncate">
                                {categoryTitle}
                              </p>
                            )}
                            <span className="text-[10px] text-neutral-400 tracking-wider mt-1 block">
                              {product.year}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromSelection(product.id)}
                            className="p-2 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                            aria-label={`${t(product.name)} seçkiden çıkar`}
                            title="Seçkiden çıkar"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              {selectedProducts.length > 0 && (
                <div className="px-6 py-5 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] space-y-3">
                  <div className="flex items-center justify-between text-xs tracking-wider uppercase text-[var(--text-secondary)] font-light">
                    <span>Toplam</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {selectedProducts.length} ÜRÜN
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleNavigateToSeckim}
                      className="w-full py-3.5 px-3 border border-[var(--border-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-primary)] text-xs tracking-widest uppercase font-semibold hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all duration-200 text-center cursor-pointer"
                    >
                      SEÇKİYİ GÖRÜNTÜLE
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsInquiryOpen(true)}
                      className="w-full py-3.5 px-3 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs tracking-widest uppercase font-semibold hover:opacity-90 transition-opacity text-center cursor-pointer shadow-sm"
                    >
                      BİLGİ / TEKLİF AL
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inquiry Quote Modal */}
      <InquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        selectedProducts={selectedProducts}
      />
    </>
  )
}
