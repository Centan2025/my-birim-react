import React, {useState} from 'react'
import {createPortal} from 'react-dom'
import {motion, AnimatePresence} from 'framer-motion'
import {useAuth} from '../../context/AuthContext'
import {submitInquiry} from '../../services/supabase/seckim'
import {analytics} from '../../lib/analytics'
import {useTranslation} from '../../i18n'
import type {Product} from '../../types'
import type {InquirySelectedProduct} from '../../types/seckim'
import {getLocalizedText} from '../../types/seckim'

interface InquiryModalProps {
  isOpen: boolean
  onClose: () => void
  selectedProducts: Product[]
  projectName?: string
}

export const InquiryModal: React.FC<InquiryModalProps> = ({
  isOpen,
  onClose,
  selectedProducts,
  projectName = '',
}) => {
  const {user} = useAuth()
  const {t} = useTranslation()

  const [name, setName] = useState(user?.name || '')
  const [company, setCompany] = useState(user?.company || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [currentProjectName, setCurrentProjectName] = useState(projectName)
  const [message, setMessage] = useState('')

  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setErrorMessage('Lütfen adınızı ve e-posta adresinizi girin.')
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const formattedProducts: InquirySelectedProduct[] = selectedProducts.map(p => {
        const prodRecord = p as unknown as Record<string, unknown>
        const dims = prodRecord['dimensions'] as
          | {width?: number; depth?: number; height?: number}
          | undefined
        const dimsStr = dims
          ? [
              dims.width ? `G:${dims.width}` : '',
              dims.depth ? `D:${dims.depth}` : '',
              dims.height ? `Y:${dims.height}` : '',
            ]
              .filter(Boolean)
              .join(' ')
          : ''
        return {
          id: p.id,
          name: getLocalizedText(p.name),
          category: p.categoryId,
          dimensions: dimsStr,
          image:
            typeof p.mainImage === 'string'
              ? p.mainImage
              : (p.mainImage as {url?: string} | undefined)?.url || '',
        }
      })

      const res = await submitInquiry(
        {
          name: name.trim(),
          company: company.trim(),
          email: email.trim(),
          phone: phone.trim(),
          projectName: currentProjectName.trim(),
          message: message.trim(),
          selectedProducts: formattedProducts,
        },
        user?._id
      )

      analytics.event({
        category: 'seckim',
        action: 'inquiry_submitted',
        label: currentProjectName || 'Genel Seçtiklerim',
        value: selectedProducts.length,
      })

      if (res.success) {
        setIsSuccess(true)
      } else {
        setErrorMessage('Talebiniz iletilirken bir sorun oluştu. Lütfen tekrar deneyin.')
      }
    } catch {
      setErrorMessage('İşlem sırasında bir sorun oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsSuccess(false)
    setErrorMessage(null)
    onClose()
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          <motion.div
            initial={{opacity: 0, scale: 0.96, y: 15}}
            animate={{opacity: 1, scale: 1, y: 0}}
            exit={{opacity: 0, scale: 0.96, y: 15}}
            transition={{duration: 0.3, ease: [0.16, 1, 0.3, 1]}}
            className="relative w-full max-w-xl max-h-[90vh] bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-2xl overflow-y-auto border border-[var(--border-primary)]"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--border-primary)] flex items-center justify-between sticky top-0 bg-[var(--bg-primary)] z-10">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                  BİRİM PROJE DESTEĞİ
                </span>
                <h3 className="text-lg font-light tracking-wide uppercase text-[var(--text-primary)] mt-0.5">
                  BİLGİ & TEKLİF TALEBİ
                </h3>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 text-neutral-400 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
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

            {/* Body */}
            <div className="p-6">
              {isSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#3c424d] text-white flex items-center justify-center">
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-light uppercase tracking-wider text-[var(--text-primary)]">
                    Talebiniz Alındı
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto font-light leading-relaxed">
                    Seçtiğiniz ürünlerle ilgili talebiniz Birim proje ve mimari ekibimize
                    iletilmiştir. En kısa sürede sizinle iletişime geçeceğiz.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-6 px-8 py-3 bg-[#3c424d] text-white border border-[#3c424d] text-xs uppercase tracking-widest font-semibold hover:bg-[#4a515c] hover:border-[#4a515c] transition-all"
                  >
                    TAMAM
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Selected Products Preview Box */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-2">
                      SEÇİLEN ÜRÜNLER ({selectedProducts.length})
                    </label>
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800 flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                      {selectedProducts.map(p => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-neutral-800 text-[11px] font-medium tracking-wide uppercase border border-neutral-200 dark:border-neutral-700 shadow-2xs"
                        >
                          {t(p.name)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                        Ad Soyad *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Adınız Soyadınız"
                        className="w-full px-3.5 py-2.5 bg-transparent border border-neutral-300 dark:border-neutral-700 text-xs focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                        Firma / Ofis
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={e => setCompany(e.target.value)}
                        placeholder="Mimarlık Ofisi / Şirket"
                        className="w-full px-3.5 py-2.5 bg-transparent border border-neutral-300 dark:border-neutral-700 text-xs focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                        E-Posta *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="ornek@alanadi.com"
                        className="w-full px-3.5 py-2.5 bg-transparent border border-neutral-300 dark:border-neutral-700 text-xs focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+90 5XX XXX XX XX"
                        className="w-full px-3.5 py-2.5 bg-transparent border border-neutral-300 dark:border-neutral-700 text-xs focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                      Proje Adı / Lokasyon
                    </label>
                    <input
                      type="text"
                      value={currentProjectName}
                      onChange={e => setCurrentProjectName(e.target.value)}
                      placeholder="Örn: Bodrum Villa Projesi, İstanbul Ofis"
                      className="w-full px-3.5 py-2.5 bg-transparent border border-neutral-300 dark:border-neutral-700 text-xs focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                      Notunuz / Özel Talepleriniz
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Malzeme tercihleri, proje teslim tarihi veya adetler hakkında bilgi ekleyebilirsiniz..."
                      className="w-full px-3.5 py-2.5 bg-transparent border border-neutral-300 dark:border-neutral-700 text-xs focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors resize-none font-light"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                      {errorMessage}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-5 py-3 border border-[var(--border-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-primary)] text-xs uppercase tracking-widest font-semibold hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                    >
                      VAZGEÇ
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-7 py-3 bg-[#3c424d] text-white border border-[#3c424d] text-xs uppercase tracking-widest font-semibold hover:bg-[#4a515c] hover:border-[#4a515c] disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      {loading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>GÖNDERİLİYOR...</span>
                        </>
                      ) : (
                        <span>BİRİM'E GÖNDER</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
