import React, {useState} from 'react'
import {createPortal} from 'react-dom'
import {motion, AnimatePresence} from 'framer-motion'
import {useSelection} from '../../context/SelectionContext'
import type {UserProject} from '../../types/seckim'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (project: UserProject) => void
  initialProductIds?: string[]
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialProductIds = [],
}) => {
  const {createProject} = useSelection()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Lütfen bir proje adı girin.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const prj = await createProject(name.trim(), description.trim(), initialProductIds)
      if (prj) {
        setName('')
        setDescription('')
        onCreated?.(prj)
        onClose()
      } else {
        setError('Proje oluşturulurken bir sorun oluştu.')
      }
    } catch {
      setError('İşlem sırasında bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            initial={{opacity: 0, scale: 0.96, y: 15}}
            animate={{opacity: 1, scale: 1, y: 0}}
            exit={{opacity: 0, scale: 0.96, y: 15}}
            transition={{duration: 0.28, ease: [0.16, 1, 0.3, 1]}}
            className="relative w-full max-w-md bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 shadow-2xl border border-[var(--border-primary)] z-10"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-primary)]">
              <h3 className="text-base font-light uppercase tracking-wider text-[var(--text-primary)]">
                YENİ PROJE OLUŞTUR
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-neutral-400 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                aria-label="Kapat"
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

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Proje Adı *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Örn: İstanbul Villa, Bodrum Residence"
                  className="w-full px-3.5 py-2.5 bg-transparent border border-[var(--border-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Proje Açıklaması (Opsiyonel)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Projenin konumu, kapsamı veya notlarınız..."
                  className="w-full px-3.5 py-2.5 bg-transparent border border-[var(--border-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors resize-none font-light"
                />
              </div>

              {error && (
                <div className="p-2.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                  {error}
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-[var(--border-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-primary)] text-xs uppercase tracking-wider font-semibold hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                >
                  VAZGEÇ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#3c424d] text-white border border-[#3c424d] text-xs uppercase tracking-widest font-semibold hover:bg-[#4a515c] hover:border-[#4a515c] disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {loading ? 'KAYDEDİLİYOR...' : 'OLUŞTUR'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
