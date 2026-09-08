import React, {useState} from 'react'
import {createPortal} from 'react-dom'
import {motion, AnimatePresence} from 'framer-motion'
import {useSelection} from '../../context/SelectionContext'
import {CreateProjectModal} from './CreateProjectModal'

interface AddToProjectModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName?: string
}

export const AddToProjectModal: React.FC<AddToProjectModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName = '',
}) => {
  const {projects, addProductToProject, removeProductFromProject, isProductInProject} =
    useSelection()

  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleToggleProject = async (projectId: string) => {
    if (isProductInProject(projectId, productId)) {
      await removeProductFromProject(projectId, productId)
    } else {
      await addProductToProject(projectId, productId)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
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
              className="relative w-full max-w-sm bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 shadow-2xl border border-[var(--border-primary)] z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-primary)]">
                <div>
                  <h3 className="text-base font-light uppercase tracking-wider text-[var(--text-primary)]">
                    PROJEYE EKLE
                  </h3>
                  {productName && (
                    <p className="text-[11px] text-[var(--text-secondary)] font-light truncate max-w-[220px] mt-0.5">
                      {productName}
                    </p>
                  )}
                </div>

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

              {/* Projects List */}
              <div className="py-4 max-h-60 overflow-y-auto divide-y divide-[var(--border-primary)]">
                {projects.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-400 font-light">
                    Henüz oluşturulmuş bir projeniz yok.
                  </div>
                ) : (
                  projects.map(project => {
                    const isChecked = isProductInProject(project.id, productId)
                    return (
                      <label
                        key={project.id}
                        className="py-3 px-1 flex items-center justify-between hover:bg-[var(--bg-secondary)] cursor-pointer group transition-colors rounded-xs"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleProject(project.id)}
                            className="w-4 h-4 rounded-none border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-black dark:accent-white"
                          />
                          <div>
                            <span className="text-xs font-medium tracking-wide uppercase group-hover:opacity-75 transition-opacity text-[var(--text-primary)]">
                              {project.name}
                            </span>
                            <span className="text-[10px] text-[var(--text-secondary)] block font-light">
                              {project.productIds.length} ürün
                            </span>
                          </div>
                        </div>

                        {isChecked && (
                          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Eklendi
                          </span>
                        )}
                      </label>
                    )
                  })
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-[var(--border-primary)] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs tracking-wider uppercase font-semibold text-[var(--text-primary)] hover:opacity-75 transition-opacity cursor-pointer"
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

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#3c424d] text-white border border-[#3c424d] text-xs uppercase tracking-widest font-semibold hover:bg-[#4a515c] hover:border-[#4a515c] transition-all cursor-pointer shadow-sm"
                >
                  TAMAM
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        initialProductIds={[productId]}
      />
    </>,
    document.body
  )
}
