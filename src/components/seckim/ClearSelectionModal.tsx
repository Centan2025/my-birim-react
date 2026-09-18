import React, {useState} from 'react'
import {createPortal} from 'react-dom'
import {motion, AnimatePresence} from 'framer-motion'
import {useFocusTrap} from '../../hooks/useFocusTrap'
import {useTranslation} from '../../i18n'

interface ClearSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<unknown> | unknown
  count: number
}

export const ClearSelectionModal: React.FC<ClearSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count,
}) => {
  const {t} = useTranslation()
  const [loading, setLoading] = useState(false)
  const modalFocusTrap = useFocusTrap(isOpen, onClose)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
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
          aria-label={t('clear_modal_title')}
        >
          {/* Backdrop */}
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.25}}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={loading ? undefined : onClose}
          />

          {/* Modal Card */}
          <motion.div
            ref={modalFocusTrap as React.RefObject<HTMLDivElement>}
            initial={{opacity: 0, scale: 0.96, y: 15}}
            animate={{opacity: 1, scale: 1, y: 0}}
            exit={{opacity: 0, scale: 0.96, y: 15}}
            transition={{duration: 0.28, ease: [0.16, 1, 0.3, 1]}}
            className="relative w-full max-w-md bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 shadow-2xl border border-[var(--border-primary)] z-10 focus:outline-none"
            tabIndex={-1}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base font-light tracking-wider uppercase text-[var(--text-primary)]">
                  {t('clear_modal_title')}
                </h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="p-1 text-neutral-400 hover:text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-50"
                aria-label={t('close') || 'Kapat'}
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

            {/* Description */}
            <div className="py-6">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                {t('clear_modal_desc', count)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 border border-[var(--border-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {t('cancel')}
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2c2c2c] hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-white text-xs uppercase tracking-widest font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {loading && (
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                <span>{loading ? t('clearing') : t('confirm_clear')}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
