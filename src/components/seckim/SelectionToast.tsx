import React, {useEffect} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {useSelection} from '../../context/SelectionContext'

export const SelectionToast: React.FC = () => {
  const {notification, dismissNotification} = useSelection()

  useEffect(() => {
    if (!notification?.visible) return
    const timer = setTimeout(() => {
      dismissNotification()
    }, 4500)
    return () => clearTimeout(timer)
  }, [notification, dismissNotification])

  return (
    <AnimatePresence>
      {notification?.visible && (
        <motion.div
          initial={{opacity: 0, y: 20, scale: 0.98}}
          animate={{opacity: 1, y: 0, scale: 1}}
          exit={{opacity: 0, y: 15, scale: 0.98}}
          transition={{duration: 0.28, ease: [0.16, 1, 0.3, 1]}}
          className="fixed bottom-6 right-6 z-[90] max-w-sm w-[calc(100vw-3rem)] sm:w-auto"
          role="status"
          aria-live="polite"
        >
          <div className="bg-[#3c424d] text-white px-5 py-3.5 shadow-2xl border border-[#4a515c] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
              <p className="text-xs tracking-wider uppercase font-light text-neutral-100">
                {notification.message}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {notification.actionLabel && notification.onAction && (
                <button
                  type="button"
                  onClick={notification.onAction}
                  className="text-xs font-medium tracking-widest uppercase text-white hover:text-neutral-200 underline underline-offset-4 cursor-pointer transition-colors"
                >
                  {notification.actionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={dismissNotification}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer transition-colors"
                aria-label="Kapat"
              >
                <svg
                  className="w-3.5 h-3.5"
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
