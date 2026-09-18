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
import {ClearSelectionModal} from './ClearSelectionModal'
import type {Product, Category} from '../../types'
import {getProductImageProps} from '../../types/seckim'

export const SelectionDrawer: React.FC = () => {
  const {isDrawerOpen, closeDrawer, selectedProductIds, removeFromSelection, clearSelection} =
    useSelection()
  const {data: allProducts = [], isLoading: isProductsLoading} = useProducts()
  const {data: categories = []} = useCategories()
  const {t} = useTranslation()
  const navigate = useNavigate()
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

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

  const handleClearAll = () => {
    if (selectedProducts.length === 0) return
    setIsClearModalOpen(true)
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
              initial={{x: '100%', scaleX: 0.6, opacity: 0}}
              animate={{
                x: 0,
                scaleX: [0.6, 1.035, 0.99, 1],
                opacity: 1,
              }}
              exit={{
                x: '100%',
                scaleX: 0.6,
                opacity: 0,
                transition: {duration: 0.42, ease: [0.32, 0, 0.67, 0]},
              }}
              transition={{
                duration: 0.65,
                ease: [0.16, 1, 0.3, 1],
                times: [0, 0.52, 0.78, 1],
                opacity: {duration: 0.35},
              }}
              style={{transformOrigin: 'right center'}}
              className="relative w-full max-w-md h-full bg-[var(--bg-primary)] text-[var(--text-primary)] border-l border-[var(--border-primary)] shadow-2xl flex flex-col z-10"
            >
              {/* Drawer Header */}
              <motion.div
                initial={{opacity: 0, x: 35, scaleX: 0.85, filter: 'blur(4px)'}}
                animate={{opacity: 1, x: 0, scaleX: 1, filter: 'blur(0px)'}}
                transition={{delay: 0.12, duration: 0.52, ease: [0.16, 1, 0.3, 1]}}
                style={{transformOrigin: 'right center'}}
                className="px-6 py-6 border-b border-[var(--border-primary)] flex items-start justify-between"
              >
                <div>
                  <h2 className="text-xl font-light tracking-wider uppercase text-[var(--text-primary)]">
                    {t('seckim')}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-light tracking-wide">
                    {t('seckim_drawer_subtitle')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedProducts.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-[11px] uppercase tracking-wider text-neutral-400 hover:text-[var(--text-primary)] transition-all duration-300 py-1.5 px-2.5 rounded-sm hover:bg-neutral-100 dark:hover:bg-neutral-800/60 cursor-pointer font-medium active:scale-95 flex items-center gap-1.5 group"
                      title={t('clear_all_selections')}
                    >
                      <svg
                        className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      <span>{t('clear_all_selections')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="p-1.5 text-neutral-400 hover:text-[var(--text-primary)] transition-all duration-300 ease-out hover:rotate-90 hover:scale-110 active:scale-95 cursor-pointer -mr-1"
                    aria-label={t('close') || 'Kapat'}
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </motion.div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
                {isProductsLoading && selectedProductIds.length > 0 ? (
                  <div className="space-y-4 py-2">
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
                ) : (
                  <>
                    <AnimatePresence initial={true}>
                      {selectedProducts.map((product, idx) => {
                        const imgProps = getProductImageProps(product)
                        const categoryTitle = categoryMap.get(product.categoryId) || ''

                        return (
                          <motion.div
                            key={product.id}
                            layout
                            initial={{opacity: 0, x: 40, scaleX: 0.85, filter: 'blur(4px)'}}
                            animate={{opacity: 1, x: 0, scaleX: 1, filter: 'blur(0px)'}}
                            exit={{
                              opacity: 0,
                              x: 30,
                              scaleX: 0.8,
                              filter: 'blur(4px)',
                              height: 0,
                              paddingTop: 0,
                              paddingBottom: 0,
                              borderBottomWidth: 0,
                              transition: {
                                opacity: {duration: 0.25, ease: 'easeOut'},
                                x: {duration: 0.35, ease: 'easeOut'},
                                scaleX: {duration: 0.3, ease: 'easeOut'},
                                filter: {duration: 0.25},
                                height: {duration: 0.55, ease: [0.22, 1, 0.36, 1]},
                                paddingTop: {duration: 0.55, ease: [0.22, 1, 0.36, 1]},
                                paddingBottom: {duration: 0.55, ease: [0.22, 1, 0.36, 1]},
                                borderBottomWidth: {duration: 0.55},
                              },
                            }}
                            transition={{
                              duration: 0.52,
                              delay: 0.12 + Math.min(idx * 0.06, 0.3),
                              ease: [0.16, 1, 0.3, 1],
                              layout: {
                                duration: 0.55,
                                ease: [0.22, 1, 0.36, 1],
                              },
                            }}
                            style={{transformOrigin: 'right center', overflow: 'hidden'}}
                            className="py-4 border-b border-[var(--border-primary)] flex items-center gap-4 group"
                          >
                            <Link
                              to={`/product/${product.id}`}
                              onClick={closeDrawer}
                              className="w-20 h-20 bg-white flex-shrink-0 relative overflow-hidden flex items-center justify-center p-1 block"
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
                              className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all duration-200 hover:rotate-90 hover:scale-110 active:scale-95 cursor-pointer"
                              aria-label={`${t(product.name)} - ${t('remove_from_selection')}`}
                              title={t('remove_from_selection')}
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>

                    {selectedProducts.length === 0 && (
                      <motion.div
                        key="empty"
                        initial={{opacity: 0, x: 35, scaleX: 0.85, filter: 'blur(4px)'}}
                        animate={{opacity: 1, x: 0, scaleX: 1, filter: 'blur(0px)'}}
                        transition={{duration: 0.52, delay: 0.18, ease: [0.16, 1, 0.3, 1]}}
                        style={{transformOrigin: 'right center'}}
                        className="my-auto flex flex-col items-center justify-center text-center py-16 px-4"
                      >
                        <div className="w-12 h-12 rounded-full border border-[var(--border-primary)] flex items-center justify-center mb-5 text-neutral-400">
                          <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                          </svg>
                        </div>
                        <h3 className="text-base font-light uppercase tracking-wider text-[var(--text-primary)]">
                          {t('no_selections_yet')}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-2 max-w-xs font-light leading-relaxed">
                          {t('no_selections_desc')}
                        </p>
                        <button
                          type="button"
                          onClick={handleExplore}
                          className="mt-8 px-6 py-3 border border-[var(--border-primary)] hover:border-[#2c2c2c] text-[var(--text-primary)] bg-[var(--bg-primary)] text-xs uppercase tracking-widest hover:bg-[#2c2c2c] hover:text-white transition-all cursor-pointer font-semibold"
                        >
                          {t('explore_products')}
                        </button>
                      </motion.div>
                    )}
                  </>
                )}
              </div>

              {/* Drawer Footer */}
              <AnimatePresence>
                {selectedProducts.length > 0 && (
                  <motion.div
                    initial={{opacity: 0, y: 20, scale: 0.94, filter: 'blur(3px)'}}
                    animate={{opacity: 1, y: 0, scale: 1, filter: 'blur(0px)'}}
                    exit={{opacity: 0, y: 15, transition: {duration: 0.25}}}
                    transition={{duration: 0.52, delay: 0.2, ease: [0.16, 1, 0.3, 1]}}
                    className="px-6 py-5 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleNavigateToSeckim}
                        className="w-full py-3.5 px-3 border border-[var(--border-primary)] hover:border-[#2c2c2c] text-[var(--text-primary)] bg-[var(--bg-primary)] text-xs tracking-widest uppercase font-semibold hover:bg-[#2c2c2c] hover:text-white transition-all duration-200 text-center cursor-pointer"
                      >
                        {t('seckim')}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsInquiryOpen(true)}
                        className="w-full py-3.5 px-3 bg-[#2c2c2c] text-white border border-[#2c2c2c] text-xs tracking-widest uppercase font-semibold hover:bg-[#404040] hover:border-[#404040] transition-all text-center cursor-pointer shadow-sm"
                      >
                        {t('get_quote_inquiry')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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

      {/* Clear Selection Confirmation Modal */}
      <ClearSelectionModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={clearSelection}
        count={selectedProducts.length}
      />
    </>
  )
}
