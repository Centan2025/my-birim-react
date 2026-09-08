import React, {useState} from 'react'
import {useTranslation} from '../../i18n'
import type {Category, Designer, Product, ProductMaterialsGroup} from '../../types'
import {downloadProductDetailPDF} from '../../utils/pdfGenerator'

interface ProductPdfButtonProps {
  product: Product
  category?: Category | null
  designer?: Designer | null
  designers?: Designer[]
  mergedGroups?: ProductMaterialsGroup[]
  variant?: 'default' | 'icon-only'
  className?: string
}

export const ProductPdfButton: React.FC<ProductPdfButtonProps> = ({
  product,
  category,
  designer,
  designers,
  mergedGroups,
  variant = 'icon-only',
  className = '',
}) => {
  const {t, locale} = useTranslation()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (isDownloading || !product) return
    setIsDownloading(true)
    try {
      await downloadProductDetailPDF({
        product,
        category,
        designer,
        designers,
        mergedGroups,
        locale,
      })
    } catch (err) {
      console.error('PDF download error:', err)
      alert(t('pdf_download_error') || 'PDF oluşturulurken bir hata oluştu.')
    } finally {
      setIsDownloading(false)
    }
  }

  if (variant === 'icon-only') {
    return (
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className={`group relative inline-flex items-center justify-center w-10 h-10 md:w-11 md:h-11 text-[var(--text-primary)] hover:text-black dark:hover:text-white bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-none border border-neutral-400 dark:border-neutral-500 hover:border-black dark:hover:border-white transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-none ${className}`}
        aria-label={t('product_info_pdf') || 'Ürün Bilgi Formu PDF İndir'}
        title={t('product_info_pdf') || 'Ürün Bilgi Formu (PDF)'}
      >
        {isDownloading ? (
          <svg
            className="w-4 h-4 md:w-5 md:h-5 animate-spin text-current"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:translate-y-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="4" x2="12" y2="14" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="5" y1="19" x2="19" y2="19" />
          </svg>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      className={`group relative inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-none ${className}`}
      aria-label={t('product_info_pdf') || 'Ürün Bilgi Formu PDF İndir'}
      title={t('product_info_pdf') || 'Ürün Bilgi Formu'}
    >
      {isDownloading ? (
        <>
          <svg
            className="w-4 h-4 animate-spin text-current"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="tracking-widest">{t('generating_pdf') || 'PDF HAZIRLANIYOR...'}</span>
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:scale-110"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="12" y2="18" />
            <line x1="15" y1="15" x2="12" y2="18" />
          </svg>
          <span className="tracking-widest">{t('download_pdf') || 'PDF İNDİR'}</span>
        </>
      )}
    </button>
  )
}
