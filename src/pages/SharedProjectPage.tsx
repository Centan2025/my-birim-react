import {useState, useEffect, useMemo} from 'react'
import {useParams, Link} from 'react-router-dom'
import {useProducts} from '../hooks/useProducts'
import {useCategories} from '../hooks/useCategories'
import {useDesigners} from '../hooks/useDesigners'
import {useSelection} from '../context/SelectionContext'
import {useTranslation} from '../i18n'
import {useSEO} from '../hooks/useSEO'
import {OptimizedImage} from '../components/OptimizedImage'
import {InquiryModal} from '../components/seckim/InquiryModal'
import {generateSeckimPDF} from '../utils/pdfGenerator'
import {fetchProjectByShareToken} from '../services/supabase/seckim'
import type {Product, Category, Designer} from '../types'
import {getLocalizedText, getProductImageProps, type UserProject} from '../types/seckim'

export function SharedProjectPage() {
  const {shareToken} = useParams<{shareToken: string}>()
  const {t} = useTranslation()
  const {addToSelection} = useSelection()

  const {data: allProducts = []} = useProducts()
  const {data: categories = []} = useCategories()
  const {data: designers = []} = useDesigners()

  const [project, setProject] = useState<UserProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)

  useEffect(() => {
    async function loadProject() {
      if (!shareToken) {
        setLoading(false)
        return
      }

      try {
        // 1. Check if Supabase has it
        const serverPrj = await fetchProjectByShareToken(shareToken)
        if (serverPrj) {
          setProject(serverPrj)
          setLoading(false)
          return
        }

        // 2. Check local storage if created on this browser
        const storedProjects = localStorage.getItem('birim_seckim_projects')
        if (storedProjects) {
          const parsed = JSON.parse(storedProjects)
          const found = parsed.find((p: UserProject) => p.shareToken === shareToken)
          if (found) {
            setProject(found)
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [shareToken])

  useSEO({
    title: project
      ? `${project.name} • Proje Seçkisi | Birim Mobilya`
      : 'Paylaşılan Proje • Birim Mobilya',
    description: project?.description || 'Birim Mobilya mimari mobilya seçkisi.',
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

  const handlePdfDownload = async () => {
    if (projectProducts.length === 0 || !project) return
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
      alert('PDF oluşturulurken bir hata oluştu.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleCopyAllToMySelection = () => {
    for (const p of projectProducts) {
      addToSelection(p.id, getLocalizedText(p.name))
    }
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 3500)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-xl font-light uppercase tracking-wider text-[var(--text-primary)]">
          Paylaşılan Seçki Bulunamadı
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-2 font-light">
          Bu proje bağlantısı geçersiz, kaldırılmış veya erişime kapatılmış olabilir.
        </p>
        <Link
          to="/"
          className="mt-6 px-6 py-2.5 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
        >
          ANA SAYFAYA DÖN
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)] pb-24">
      {/* Brand Top bar */}
      <div className="border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold tracking-widest uppercase text-[var(--text-primary)]">
              BİRİM
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">|</span>
            <span className="text-[11px] font-mono tracking-wider text-neutral-500 uppercase">
              PAYLAŞILAN MİMARİ SEÇKİ
            </span>
          </div>

          <Link
            to="/products"
            className="text-[11px] tracking-wider uppercase font-medium hover:underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            TÜM KOLEKSİYON →
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-10">
        {/* Project Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[var(--border-primary)]">
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400">
              PROJE SEÇKİSİ • {projectProducts.length} ÜRÜN
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[var(--text-primary)] mt-2">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light mt-2 max-w-2xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Copy all to my selection */}
            <button
              type="button"
              onClick={handleCopyAllToMySelection}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--border-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-primary)] text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <span>{copiedAll ? 'SEÇKİME EKLENDİ ✓' : 'SEÇKİME EKLE'}</span>
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
                    <span>PDF İNDİR</span>
                  </>
                )}
              </button>
            )}

            {/* Quote / Inquiry Request */}
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
          </div>
        </div>

        {/* Products Grid */}
        <div className="pt-8">
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
                        <p className="text-[11px] text-neutral-400 font-light mt-0.5">{designer}</p>
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
                        ÜRÜNÜ İNCELE →
                      </Link>

                      <button
                        type="button"
                        onClick={() => addToSelection(product.id, getLocalizedText(product.name))}
                        className="text-[11px] font-light text-neutral-500 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        + Seçkime Ekle
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
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

export default SharedProjectPage
