import {useState, useMemo, useEffect} from 'react'
import {Link, useNavigate, useSearchParams} from 'react-router-dom'
import {useSelection} from '../context/SelectionContext'
import {useProducts} from '../hooks/useProducts'
import {useCategories} from '../hooks/useCategories'
import {useDesigners} from '../hooks/useDesigners'
import {useTranslation} from '../i18n'
import {useSEO} from '../hooks/useSEO'
import {OptimizedImage} from '../components/OptimizedImage'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {CreateProjectModal} from '../components/seckim/CreateProjectModal'
import {AddToProjectModal} from '../components/seckim/AddToProjectModal'
import {InquiryModal} from '../components/seckim/InquiryModal'
import {ClearSelectionModal} from '../components/seckim/ClearSelectionModal'
import {generateSeckimPDF} from '../utils/pdfGenerator'
import type {Product, Category, Designer} from '../types'
import {getLocalizedText, getProductImageProps, type UserProject} from '../types/seckim'

export function SeckimPage() {
  const {t, locale} = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') === 'projeler' ? 'projeler' : 'seckim'
  const [activeTab, setActiveTab] = useState<'seckim' | 'projeler'>(tabFromUrl)

  useEffect(() => {
    setActiveTab(tabFromUrl)
  }, [tabFromUrl])

  const handleTabChange = (tab: 'seckim' | 'projeler') => {
    setActiveTab(tab)
    if (tab === 'projeler') {
      setSearchParams({tab: 'projeler'}, {replace: true})
    } else {
      setSearchParams({}, {replace: true})
    }
  }

  const {
    selectedProductIds,
    projects,
    removeFromSelection,
    clearSelection,
    deleteProject,
    isSelectionEnabled,
  } = useSelection()

  const {data: allProducts = [], isLoading: isProductsLoading} = useProducts()
  const {data: categories = []} = useCategories()
  const {data: designers = []} = useDesigners()

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)
  const [addToProjectTarget, setAddToProjectTarget] = useState<{id: string; name: string} | null>(
    null
  )
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  // Redirect if feature is turned off in CMS
  useEffect(() => {
    if (!isSelectionEnabled) {
      navigate('/', {replace: true})
    }
  }, [isSelectionEnabled, navigate])

  useSEO({
    title: `${t('seckim_and_projects')} • Birim Mobilya`,
    description: t('seckim_page_description'),
  })

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of categories as Category[]) {
      map.set(c.id, t(c.name))
    }
    return map
  }, [categories, t])

  const designerMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const d of designers as Designer[]) {
      map[d.id] = t(d.name)
    }
    return map
  }, [designers, t])

  const selectedProducts = useMemo(() => {
    const set = new Set(selectedProductIds)
    return (allProducts as Product[]).filter(p => set.has(p.id))
  }, [allProducts, selectedProductIds])

  const handlePdfDownload = async () => {
    if (selectedProducts.length === 0) return
    setIsGeneratingPdf(true)
    try {
      const pdfBlob = await generateSeckimPDF({
        projectName: `BİRİM MOBİLYA - ${t('seckim').toUpperCase()}`,
        projectDescription: t('seckim_page_description'),
        products: selectedProducts,
        designerNamesMap: designerMap,
        categoryNamesMap: Object.fromEntries(categoryMap),
      })

      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Birim-Sectiklerim-${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF creation error:', err)
      alert(t('pdf_download_error'))
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleClearAll = () => {
    if (selectedProducts.length === 0) return
    setIsClearModalOpen(true)
  }

  if (!isSelectionEnabled) {
    return null
  }

  const upperLocale = locale === 'tr' ? 'tr-TR' : 'en-US'
  const containerClass =
    'w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0'

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pt-16 md:pt-20 lg:pt-24 pb-32">
      {/* Top Breadcrumbs */}
      <div className={`${containerClass} py-3 sm:py-4`}>
        <Breadcrumbs
          items={
            activeTab === 'projeler'
              ? [
                  {label: (t('homepage') || 'ANASAYFA').toLocaleUpperCase(upperLocale), to: '/'},
                  {
                    label: (t('seckim') || 'SEÇTİKLERİM').toLocaleUpperCase(upperLocale),
                    to: '/seckim',
                  },
                  {
                    label: (t('my_projects') || 'PROJELERİM').toLocaleUpperCase(upperLocale),
                    to: '/seckim?tab=projeler',
                  },
                ]
              : [
                  {label: (t('homepage') || 'ANASAYFA').toLocaleUpperCase(upperLocale), to: '/'},
                  {
                    label: (t('seckim') || 'SEÇTİKLERİM').toLocaleUpperCase(upperLocale),
                    to: '/seckim',
                  },
                ]
          }
        />
      </div>

      <div className={`${containerClass} pt-2 sm:pt-4`}>
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[var(--border-primary)]">
          <div>
            <span className="text-xs font-mono tracking-widest uppercase text-neutral-400">
              {t('project_management')}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[var(--text-primary)] mt-2">
              {t('seckim_and_projects')}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light mt-2 max-w-xl leading-relaxed">
              {t('seckim_page_description')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsCreateProjectOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-[var(--border-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-primary)] text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>{t('new_project')}</span>
            </button>

            {selectedProducts.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handlePdfDownload}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-[var(--border-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-primary)] text-xs uppercase tracking-widest font-semibold hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingPdf ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>{t('generating_pdf')}</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                      <span>{t('create_pdf')}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsInquiryOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2c2c2c] text-white border border-[#2c2c2c] text-xs uppercase tracking-widest font-semibold hover:bg-[#404040] hover:border-[#404040] transition-all cursor-pointer shadow-sm"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M22 2L11 13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>{t('get_info_quote')}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Switcher & List Controls */}
        <div className="flex items-center justify-between gap-4 pt-8 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-6 sm:gap-8">
            <button
              type="button"
              onClick={() => handleTabChange('seckim')}
              className={`pb-4 text-xs tracking-widest uppercase font-medium transition-all relative cursor-pointer inline-flex items-center gap-2 group ${
                activeTab === 'seckim'
                  ? 'text-[var(--text-primary)]'
                  : 'text-neutral-400 hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="tracking-widest">{t('all_selections')}</span>
              <span
                className={`text-[11px] font-mono tracking-tight transition-colors duration-200 ${
                  activeTab === 'seckim'
                    ? 'text-[var(--text-primary)] font-semibold'
                    : 'text-neutral-400 group-hover:text-[var(--text-primary)] font-normal'
                }`}
              >
                {String(selectedProducts.length).padStart(2, '0')}
              </span>
              {activeTab === 'seckim' && (
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[var(--text-primary)]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('projeler')}
              className={`pb-4 text-xs tracking-widest uppercase font-medium transition-all relative cursor-pointer inline-flex items-center gap-2 group ${
                activeTab === 'projeler'
                  ? 'text-[var(--text-primary)]'
                  : 'text-neutral-400 hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="tracking-widest">{t('my_projects')}</span>
              <span
                className={`text-[11px] font-mono tracking-tight transition-colors duration-200 ${
                  activeTab === 'projeler'
                    ? 'text-[var(--text-primary)] font-semibold'
                    : 'text-neutral-400 group-hover:text-[var(--text-primary)] font-normal'
                }`}
              >
                {String(projects.length).padStart(2, '0')}
              </span>
              {activeTab === 'projeler' && (
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[var(--text-primary)]" />
              )}
            </button>
          </div>

          {selectedProducts.length > 0 && activeTab === 'seckim' && (
            <button
              type="button"
              onClick={handleClearAll}
              className="pb-4 text-[11px] sm:text-xs font-light text-neutral-400 hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1.5 group shrink-0"
              title={t('clear_all_selections')}
            >
              <svg
                className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110"
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
        </div>

        {/* TAB 1: SEÇTİKLERİM */}
        {activeTab === 'seckim' && (
          <div className="pt-8">
            {isProductsLoading && selectedProductIds.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                {selectedProductIds.map(id => (
                  <div
                    key={id}
                    className="bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 flex flex-col aspect-[4/5] animate-pulse justify-between"
                  >
                    <div className="aspect-square w-full bg-[var(--bg-secondary)]" />
                    <div className="h-4 bg-[var(--bg-secondary)] w-3/4 mt-4" />
                  </div>
                ))}
              </div>
            ) : selectedProducts.length === 0 ? (
              <div className="py-24 text-center max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto rounded-full border border-[var(--border-primary)] flex items-center justify-center mb-6 text-neutral-400">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </div>
                <h2 className="text-xl font-light uppercase tracking-wider text-[var(--text-primary)]">
                  {t('no_selections_yet')}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-2.5 font-light leading-relaxed">
                  {t('no_selections_desc')}
                </p>
                <Link
                  to="/products"
                  className="mt-8 inline-block px-8 py-3.5 border border-[var(--text-primary)] text-[var(--text-primary)] text-xs uppercase tracking-widest font-semibold hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"
                >
                  {t('explore_products')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                {selectedProducts.map(product => {
                  const imgProps = getProductImageProps(product)
                  const categoryTitle = categoryMap.get(product.categoryId) || ''
                  const designer = designerMap[product.designerId || ''] || ''

                  return (
                    <div
                      key={product.id}
                      className="group relative bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 flex flex-col overflow-hidden shadow-xs hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300"
                    >
                      {/* Top-Right Remove (X) Button: Frameless, larger, animated rotation & scale, neutral hover */}
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeFromSelection(product.id)
                        }}
                        className="absolute top-2.5 right-2.5 z-20 w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-all duration-300 ease-out hover:scale-115 hover:rotate-90 active:scale-95 cursor-pointer"
                        title={t('remove_from_selection')}
                        aria-label={`${t(product.name)} - ${t('remove_from_selection')}`}
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

                      {/* Product Image Link */}
                      <Link
                        to={`/product/${product.id}`}
                        className="relative overflow-hidden aspect-square w-full flex items-center justify-center bg-white dark:bg-neutral-900 p-4 border-b border-neutral-100 dark:border-neutral-800/80 block"
                      >
                        <OptimizedImage
                          {...imgProps}
                          alt={t(product.name)}
                          width={480}
                          height={480}
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="w-full h-full object-contain transform transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                          fitAuto={true}
                        />
                      </Link>

                      {/* Info & Actions */}
                      <div className="p-4 flex flex-col flex-1 justify-between gap-4 bg-white dark:bg-neutral-900">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={`/product/${product.id}`}
                              className="text-sm font-semibold tracking-tight uppercase hover:opacity-75 transition-opacity text-[var(--text-primary)]"
                            >
                              {t(product.name)}
                            </Link>
                            <span className="text-[11px] font-mono text-neutral-400">
                              {product.year}
                            </span>
                          </div>

                          {categoryTitle && (
                            <p className="text-xs text-[var(--text-secondary)] font-light mt-0.5">
                              {categoryTitle}
                            </p>
                          )}
                          {designer && (
                            <p className="text-[11px] text-neutral-400 font-light mt-0.5">
                              {designer}
                            </p>
                          )}
                        </div>

                        {/* Card bottom actions */}
                        <div className="pt-3 border-t border-[var(--border-primary)] flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setAddToProjectTarget({
                                id: product.id,
                                name: getLocalizedText(product.name),
                              })
                            }
                            className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 border border-neutral-200 dark:border-neutral-700 hover:border-[var(--text-primary)] text-[var(--text-primary)] text-[11px] font-semibold tracking-wider uppercase transition-colors cursor-pointer bg-white dark:bg-neutral-800"
                          >
                            + {t('add_to_project').toUpperCase()}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROJELERİM */}
        {activeTab === 'projeler' && (
          <div className="pt-8">
            {projects.length === 0 ? (
              <div className="py-24 text-center max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto rounded-full border border-[var(--border-primary)] flex items-center justify-center mb-6 text-neutral-400">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                  </svg>
                </div>
                <h2 className="text-xl font-light uppercase tracking-wider text-[var(--text-primary)]">
                  {t('no_projects_yet_title')}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-2.5 font-light leading-relaxed">
                  {t('no_projects_yet_desc')}
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateProjectOpen(true)}
                  className="mt-8 inline-block px-8 py-3.5 bg-[#2c2c2c] text-white border border-[#2c2c2c] text-xs uppercase tracking-widest font-semibold hover:bg-[#404040] hover:border-[#404040] transition-all cursor-pointer shadow-sm"
                >
                  + {t('create_project')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {projects.map((project: UserProject) => {
                  const prjProducts = (allProducts as Product[]).filter(p =>
                    project.productIds.includes(p.id)
                  )

                  return (
                    <div
                      key={project.id}
                      className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 p-6 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 group"
                    >
                      <div>
                        {/* Title & Product Count */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Link
                              to={`/seckim/proje/${project.id}`}
                              className="text-lg font-medium tracking-wide uppercase hover:opacity-75 transition-opacity block text-[var(--text-primary)]"
                            >
                              {project.name}
                            </Link>
                            <span className="text-xs text-neutral-400 font-light mt-0.5 block">
                              {t('products_count_short', project.productIds.length)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(t('delete_project_confirm', project.name))) {
                                deleteProject(project.id)
                              }
                            }}
                            className="p-1 text-neutral-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title={t('delete_project')}
                            aria-label={t('delete_project')}
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>

                        {project.description && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-light line-clamp-2 leading-relaxed">
                            {project.description}
                          </p>
                        )}

                        {/* Thumbnails preview */}
                        <div className="mt-5 grid grid-cols-4 gap-2">
                          {prjProducts.length > 4 ? (
                            <>
                              {prjProducts.slice(0, 3).map(p => {
                                const imgProps = getProductImageProps(p)
                                return (
                                  <div
                                    key={p.id}
                                    className="aspect-square bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 overflow-hidden relative flex items-center justify-center p-1"
                                  >
                                    <OptimizedImage
                                      {...imgProps}
                                      alt={t(p.name)}
                                      width={100}
                                      height={100}
                                      className="w-full h-full object-contain"
                                      fitAuto={true}
                                    />
                                  </div>
                                )
                              })}
                              {/* 4th slot with +X overlay */}
                              {(() => {
                                const fourthProd = prjProducts[3]
                                if (!fourthProd) return null
                                const imgProps = getProductImageProps(fourthProd)
                                const remainingCount = prjProducts.length - 3
                                return (
                                  <Link
                                    to={`/seckim/proje/${project.id}`}
                                    key={fourthProd.id}
                                    className="aspect-square bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 overflow-hidden relative flex items-center justify-center p-1 group/more block"
                                    title={`${remainingCount} ${t('more_products') || 'ürün daha'}`}
                                  >
                                    <OptimizedImage
                                      {...imgProps}
                                      alt={t(fourthProd.name)}
                                      width={100}
                                      height={100}
                                      className="w-full h-full object-contain opacity-40 blur-[0.5px]"
                                      fitAuto={true}
                                    />
                                    <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-[1px] flex items-center justify-center text-white text-xs font-semibold tracking-wider transition-colors group-hover/more:bg-neutral-950/75">
                                      +{remainingCount}
                                    </div>
                                  </Link>
                                )
                              })()}
                            </>
                          ) : (
                            <>
                              {prjProducts.slice(0, 4).map(p => {
                                const imgProps = getProductImageProps(p)
                                return (
                                  <div
                                    key={p.id}
                                    className="aspect-square bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 overflow-hidden relative flex items-center justify-center p-1"
                                  >
                                    <OptimizedImage
                                      {...imgProps}
                                      alt={t(p.name)}
                                      width={100}
                                      height={100}
                                      className="w-full h-full object-contain"
                                      fitAuto={true}
                                    />
                                  </div>
                                )
                              })}
                              {prjProducts.length < 4 &&
                                Array.from({length: 4 - prjProducts.length}).map((_, idx) => (
                                  <div
                                    key={idx}
                                    className="aspect-square bg-neutral-100/60 dark:bg-neutral-900/40 border border-dashed border-neutral-200 dark:border-neutral-800"
                                  />
                                ))}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[var(--border-primary)] flex items-center justify-between">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase">
                          {new Date(project.createdAt).toLocaleDateString(upperLocale)}
                        </span>

                        <Link
                          to={`/seckim/proje/${project.id}`}
                          className="text-xs font-semibold tracking-wider uppercase text-[var(--text-primary)] hover:underline underline-offset-4"
                        >
                          {t('view_project')}
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
      />

      {addToProjectTarget && (
        <AddToProjectModal
          isOpen={true}
          onClose={() => setAddToProjectTarget(null)}
          productId={addToProjectTarget.id}
          productName={addToProjectTarget.name}
        />
      )}

      <InquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        selectedProducts={selectedProducts}
      />

      <ClearSelectionModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={clearSelection}
        count={selectedProducts.length}
      />
    </div>
  )
}

export default SeckimPage
