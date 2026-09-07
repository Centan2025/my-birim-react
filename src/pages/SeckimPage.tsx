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
import {generateSeckimPDF} from '../utils/pdfGenerator'
import type {Product, Category, Designer} from '../types'
import {getLocalizedText, getProductImageProps, type UserProject} from '../types/seckim'

export function SeckimPage() {
  const {t} = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'projeler' ? 'projeler' : 'seckim'

  const {selectedProductIds, projects, removeFromSelection, deleteProject, isSelectionEnabled} =
    useSelection()

  const {data: allProducts = [], isLoading: isProductsLoading} = useProducts()
  const {data: categories = []} = useCategories()
  const {data: designers = []} = useDesigners()

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
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
    title: 'Seçtiklerim & Projelerim • Birim Mobilya',
    description: 'Birim Mobilya mimari ve iç mimari ürün seçimleri, koleksiyon ve ürün grupları.',
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
        projectName: 'BİRİM MOBİLYA - GENEL SEÇTİKLERİM',
        projectDescription: 'Mimari ve İç Mimari Ürün Seçimleri',
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
      alert('PDF oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  if (!isSelectionEnabled) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-32">
      {/* Top Breadcrumbs */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-8 sm:pt-12">
        <Breadcrumbs
          items={[
            {label: t('homepage') || 'ANASAYFA', to: '/'},
            {label: 'SEÇTİKLERİM', to: '/seckim'},
          ]}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[var(--border-primary)]">
          <div>
            <span className="text-xs font-mono tracking-widest uppercase text-neutral-400">
              PROJE YÖNETİMİ
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[var(--text-primary)] mt-2">
              SEÇTİKLERİM & PROJELERİM
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light mt-2 max-w-xl leading-relaxed">
              Mekan ve projeleriniz için seçtiğiniz Birim tasarımlarını bir araya getirin, projelere
              ayırın ve profesyonel teklif veya PDF oluşturun.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCreateProjectOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 border border-[var(--border-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-primary)] text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer"
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
              <span>YENİ PROJE</span>
            </button>

            {selectedProducts.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handlePdfDownload}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center gap-2 px-5 py-3 border border-[var(--border-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-primary)] text-xs uppercase tracking-widest font-semibold hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingPdf ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>HAZIRLANIYOR...</span>
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
                      <span>PDF OLUŞTUR</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsInquiryOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
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
                  <span>BİLGİ / TEKLİF AL</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-8 pt-8 border-b border-[var(--border-primary)]">
          <button
            type="button"
            onClick={() => setSearchParams({tab: 'seckim'})}
            className={`pb-4 text-xs tracking-widest uppercase font-medium transition-all relative cursor-pointer ${
              activeTab === 'seckim'
                ? 'text-[var(--text-primary)]'
                : 'text-neutral-400 hover:text-[var(--text-primary)]'
            }`}
          >
            <span>TÜM SEÇTİKLERİM ({selectedProducts.length})</span>
            {activeTab === 'seckim' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--text-primary)]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSearchParams({tab: 'projeler'})}
            className={`pb-4 text-xs tracking-widest uppercase font-medium transition-all relative cursor-pointer ${
              activeTab === 'projeler'
                ? 'text-[var(--text-primary)]'
                : 'text-neutral-400 hover:text-[var(--text-primary)]'
            }`}
          >
            <span>PROJELERİM ({projects.length})</span>
            {activeTab === 'projeler' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--text-primary)]" />
            )}
          </button>
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
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-light uppercase tracking-wider text-[var(--text-primary)]">
                  Henüz bir seçiminiz yok
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-2.5 font-light leading-relaxed">
                  Beğendiğiniz ürünleri seçtiklerinize ekleyerek projeniz için bir araya
                  getirebilirsiniz.
                </p>
                <Link
                  to="/products"
                  className="mt-8 inline-block px-8 py-3.5 border border-[var(--text-primary)] text-[var(--text-primary)] text-xs uppercase tracking-widest font-semibold hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"
                >
                  ÜRÜNLERİ KEŞFET
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
                      className="group bg-[var(--bg-primary)] border border-[var(--border-primary)] flex flex-col overflow-hidden shadow-2xs hover:shadow-md transition-shadow"
                    >
                      {/* Product Image Link */}
                      <Link
                        to={`/product/${product.id}`}
                        className="relative overflow-hidden aspect-square w-full flex items-center justify-center bg-[var(--bg-primary)] p-2 block"
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
                      <div className="p-4 flex flex-col flex-1 justify-between gap-4">
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
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[var(--border-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] text-[11px] font-semibold tracking-wider uppercase transition-colors cursor-pointer bg-[var(--bg-primary)]"
                          >
                            + PROJEYE EKLE
                          </button>

                          <button
                            type="button"
                            onClick={() => removeFromSelection(product.id)}
                            className="text-xs font-light text-neutral-400 hover:text-red-600 transition-colors cursor-pointer py-1 px-2"
                          >
                            Çıkar
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
                  Henüz bir proje oluşturmadınız
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-2.5 font-light leading-relaxed">
                  İstanbul Villa, Bodrum Residence veya Otel Projesi gibi farklı mekanlar için
                  seçtiğiniz mobilyaları projeler altında toplayabilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateProjectOpen(true)}
                  className="mt-8 inline-block px-8 py-3.5 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  + PROJE OLUŞTUR
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
                      className="bg-[var(--bg-primary)] border border-[var(--border-primary)] p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow group"
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
                              {project.productIds.length} ürün
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `"${project.name}" projesini silmek istediğinize emin misiniz?`
                                )
                              ) {
                                deleteProject(project.id)
                              }
                            }}
                            className="p-1 text-neutral-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Projeyi sil"
                            aria-label="Projeyi sil"
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
                          {prjProducts.slice(0, 4).map(p => {
                            const imgProps = getProductImageProps(p)
                            return (
                              <div
                                key={p.id}
                                className="aspect-square bg-[var(--bg-secondary)] overflow-hidden relative flex items-center justify-center p-1"
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
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[var(--border-primary)] flex items-center justify-between">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase">
                          {new Date(project.createdAt).toLocaleDateString('tr-TR')}
                        </span>

                        <Link
                          to={`/seckim/proje/${project.id}`}
                          className="text-xs font-semibold tracking-wider uppercase text-[var(--text-primary)] hover:underline underline-offset-4"
                        >
                          PROJEYİ İNCELE →
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
    </div>
  )
}

export default SeckimPage
