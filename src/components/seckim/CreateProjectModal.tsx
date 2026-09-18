import React, {useState} from 'react'
import {createPortal} from 'react-dom'
import {motion, AnimatePresence} from 'framer-motion'
import {useFocusTrap} from '../../hooks/useFocusTrap'
import {useSelection} from '../../context/SelectionContext'
import {useTranslation} from '../../i18n'
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
  const {t} = useTranslation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalFocusTrap = useFocusTrap(isOpen, onClose)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError(t('project_name_required'))
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
        setError(t('project_create_error'))
      }
    } catch {
      setError(t('project_create_error'))
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
          aria-label={t('create_new_project_title')}
        >
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            ref={modalFocusTrap as React.RefObject<HTMLDivElement>}
            initial={{opacity: 0, scale: 0.96, y: 15}}
            animate={{opacity: 1, scale: 1, y: 0}}
            exit={{opacity: 0, scale: 0.96, y: 15}}
            transition={{duration: 0.28, ease: [0.16, 1, 0.3, 1]}}
            className="relative w-full max-w-md bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 shadow-2xl border border-[var(--border-primary)] z-10 focus:outline-none"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-primary)]">
              <h3 className="text-base font-light uppercase tracking-wider text-[var(--text-primary)]">
                {t('create_new_project_title')}
              </h3>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="p-1.5 text-neutral-400 hover:text-[var(--text-primary)] transition-all duration-300 ease-out hover:rotate-90 hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
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

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="create-project-name"
                  className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  {t('project_name_label')}
                </label>
                <input
                  id="create-project-name"
                  name="projectName"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('project_name_placeholder')}
                  className="w-full px-3.5 py-2.5 bg-transparent border border-[var(--border-primary)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="create-project-desc"
                  className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  {t('project_desc_label')}
                </label>
                <textarea
                  id="create-project-desc"
                  name="projectDescription"
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t('project_desc_placeholder')}
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
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#2c2c2c] text-white border border-[#2c2c2c] text-xs uppercase tracking-widest font-semibold hover:bg-[#404040] hover:border-[#404040] disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {loading ? t('saving') : t('create')}
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
