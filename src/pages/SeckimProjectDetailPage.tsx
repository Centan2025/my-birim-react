import {useState, useMemo} from 'react'
import {useParams, Link, useNavigate} from 'react-router-dom'
import {useSelection} from '../context/SelectionContext'
import {useProducts} from '../hooks/useProducts'
import {useCategories} from '../hooks/useCategories'
import {useDesigners} from '../hooks/useDesigners'
import {useTranslation} from '../i18n'
import {useSEO} from '../hooks/useSEO'
import {OptimizedImage} from '../components/OptimizedImage'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {InquiryModal} from '../components/seckim/InquiryModal'
import {generateSeckimPDF} from '../utils/pdfGenerator'
import type {Product, Category, Designer} from '../types'
import {getProductImageProps, type UserProject} from '../types/seckim'

export function SeckimProjectDetailPage() {
  const {projectId} = useParams<{projectId: string}>()
  const navigate = useNavigate()
  const {t} = useTranslation()

  const {projects, removeProductFromProject, deleteProject, updateProject, isSelectionEnabled} =
    useSelection()

  const {data: allProducts = [], isLoading: isProductsLoading} = useProducts()
  const {data: categories = []} = useCategories()
  const {data: designers = []} = useDesigners()

  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)

  // Redirect if feature is turned off in CMS
  if (!isSelectionEnabled) {
    navigate('/', {replace: true})
    return null
  }

  const project = useMemo(() => {
    return projects.find((p: UserProject) => p.id === projectId)
  }, [projects, projectId])

  useSEO({
    title: project ? `${project.name} • Proje Seçkisi` : 'Proje Seçkisi',
    description: project?.description || 'Birim Mobilya proje ürün seçkisi.',
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

  const projectProducts = useMemo(() => {
    if (!project) return []
    const set = new Set(project.productIds)
    return (allProducts as Product[]).filter(p => set.has(p.id))
  }, [allProducts, project])

  if (!project) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-xl font-light uppercase tracking-wider text-[var(--text-primary)]">
          Proje Bulunamadı
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-2 font-light">
          İstediğiniz proje silinmiş veya mevcut değil.
        </p>
        <Link
          to="/seckim?tab=projeler"
          className="mt-6 px-6 py-2.5 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
        >
          PROJELERİM'E DÖN
        </Link>
      </div>
    )
  }

  const handlePdfDownload = async () => {
    if (projectProducts.length === 0) return
    setIsGeneratingPdf(true)
    try {
      const pdfBlob = await generateSeckimPDF({
        projectName: project.name,
        projectDescription: project.description,
        products: projectProducts,
        designerNamesMap: designerMap,
        categoryNamesMap: Object.fromEntries(categoryMap),
      })

      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name.replace(/\s+/g, '-')}-Seckim.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF error:', err)
      alert('PDF oluşturulurken bir sorun oluştu.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleShare = async () => {
    let token = project.shareToken
    if (!token) {
      token = 'prj_' + Math.random().toString(36).substring(2, 10)
      await updateProject(project.id, {shareToken: token, isPublic: true})
    } else if (!project.isPublic) {
      await updateProject(project.id, {isPublic: true})
    }

    const shareUrl = `${window.location.origin}/seckim/paylas/${token}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 3000)
    } catch {
      prompt('Paylaşılabilir proje bağlantısı:', shareUrl)
    }
  }

  const handleDelete = async () => {
    if (window.confirm(`"${project.name}" projesini silmek istediğinize emin misiniz?`)) {
      await deleteProject(project.id)
      navigate('/seckim?tab=projeler')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)] pb-24">
      {/* Top Breadcrumbs */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-8 sm:pt-12">
        <Breadcrumbs
          items={[
            {label: t('homepage') || 'ANASAYFA', to: '/'},
            {label: 'SEÇKİM', to: '/seckim'},
            {label: 'PROJELERİM', to: '/seckim?tab=projeler'},
            {label: project.name.toUpperCase(), to: `/seckim/proje/${project.id}`},
          ]}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-6">
        {/* Project Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[var(--border-primary)]">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400">
                PROJE SEÇKİSİ
              </span>
              <span className="text-[11px] font-mono uppercase text-neutral-400">•</span>
              <span className="text-[11px] font-mono uppercase text-neutral-500">
                {projectProducts.length} ÜRÜN
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[var(--text-primary)] mt-2">
              {project.name}
            </h1>

            {project.description ? (
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light mt-2 max-w-2xl leading-relaxed">
                {project.description}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-neutral-400 font-light mt-1 italic">
                Projeniz için oluşturduğunuz ürün seçkisi.
              </p>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Share Project Link */}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--border-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-primary)] text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer"
              title="Paylaşılabilir bağlantıyı kopyala"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>{copiedShare ? 'KOPYALANDI ✓' : 'PAYLAŞ'}</span>
            </button>

            {/* PDF Export */}
            {projectProducts.length > 0 && (
              <button
                type="button"
                onClick={handlePdfDownload}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--border-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-primary)] text-xs uppercase tracking-widest font-semibold hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer disabled:opacity-50"
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
            )}

            {/* Quote Request */}
            {projectProducts.length > 0 && (
              <button
                type="button"
                onClick={() => setIsInquiryOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
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
            )}

            {/* Delete Project */}
            <button
              type="button"
              onClick={handleDelete}
              className="p-2.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
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
        </div>

        {/* Products Grid */}
        <div className="pt-8">
          {isProductsLoading && project.productIds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {project.productIds.map(id => (
                <div
                  key={id}
                  className="bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 flex flex-col aspect-[4/5] animate-pulse justify-between"
                >
                  <div className="aspect-square w-full bg-[var(--bg-secondary)]" />
                  <div className="h-4 bg-[var(--bg-secondary)] w-3/4 mt-4" />
                </div>
              ))}
            </div>
          ) : projectProducts.length === 0 ? (
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
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <h2 className="text-xl font-light uppercase tracking-wider text-[var(--text-primary)]">
                Bu projede henüz ürün yok
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-2 font-light leading-relaxed">
                Beğendiğiniz mobilyaları ürün kartı veya ürün detayı üzerinden bu projeye
                ekleyebilirsiniz.
              </p>
              <Link
                to="/products"
                className="mt-8 inline-block px-8 py-3.5 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
              >
                ÜRÜNLERİ İNCELE
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {projectProducts.map(product => {
                const imgProps = getProductImageProps(product)
                const categoryTitle = categoryMap.get(product.categoryId) || ''
                const designer = designerMap[product.designerId || ''] || ''

                const prodRecord = product as unknown as Record<string, unknown>
                const dims = prodRecord['dimensions'] as
                  | {width?: number; depth?: number; height?: number}
                  | undefined

                return (
                  <div
                    key={product.id}
                    className="group bg-[var(--bg-primary)] border border-[var(--border-primary)] flex flex-col overflow-hidden shadow-2xs hover:shadow-md transition-shadow"
                  >
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
                        {dims && (
                          <p className="text-[10px] font-mono text-neutral-400 mt-1">
                            {[
                              dims.width ? `G:${dims.width}` : '',
                              dims.depth ? `D:${dims.depth}` : '',
                              dims.height ? `Y:${dims.height}` : '',
                            ]
                              .filter(Boolean)
                              .join(' × ')}{' '}
                            cm
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[var(--border-primary)] flex items-center justify-between gap-2">
                        <Link
                          to={`/product/${product.id}`}
                          className="text-[11px] font-medium tracking-wider uppercase text-[var(--text-primary)] hover:underline underline-offset-4"
                        >
                          İNCELE →
                        </Link>

                        <button
                          type="button"
                          onClick={() => removeProductFromProject(project.id, product.id)}
                          className="text-[11px] font-light text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          Projeden Çıkar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <InquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        selectedProducts={projectProducts}
        projectName={project.name}
      />
    </div>
  )
}

export default SeckimProjectDetailPage
