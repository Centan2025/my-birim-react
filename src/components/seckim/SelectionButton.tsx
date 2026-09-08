import React, {useState} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {useSelection} from '../../context/SelectionContext'
import type {Product} from '../../types'
import {getLocalizedText} from '../../types/seckim'

interface SelectionButtonProps {
  product: Product
  className?: string
  showLabel?: boolean
}

export const SelectionButton: React.FC<SelectionButtonProps> = ({
  product,
  className = '',
  showLabel = false,
}) => {
  const {isInSelection, toggleSelection, isSelectionEnabled} = useSelection()
  const [showTooltip, setShowTooltip] = useState(false)

  if (!isSelectionEnabled) return null

  const selected = isInSelection(product.id)
  const rawName = getLocalizedText(product.name)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleSelection(product.id, rawName)
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={`group/btn relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-none transition-all duration-300 ease-out backdrop-blur-md cursor-pointer z-10 ${
          selected
            ? 'bg-[#3c424d] text-white border border-[#3c424d] shadow-[0_2px_10px_rgba(60,66,77,0.35)] hover:bg-[#4a515c] hover:border-[#4a515c] hover:scale-105 active:scale-95'
            : 'bg-white/90 dark:bg-neutral-900/80 text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-900 border border-black/[0.07] dark:border-white/[0.12] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:scale-105 active:scale-95'
        }`}
        aria-label={selected ? `${rawName} seçtiklerimden çıkar` : `${rawName} seçtiklerime ekle`}
        title={selected ? 'Seçtiklerimden çıkar' : 'Seçtiklerime ekle'}
      >
        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 ease-out group-hover/btn:scale-105 group-active/btn:scale-90"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={selected ? '1.4' : '1.25'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="7" y="7" width="13" height="13" rx="1.5" fill="none" />
          <path d="M4 17V5a1 1 0 0 1 1-1h12" fill="none" />
        </svg>

        {showLabel && (
          <span className="ml-2 text-xs uppercase tracking-wider font-light">
            {selected ? 'Seçtiklerimden Çıkar' : 'Seçtiklerime Ekle'}
          </span>
        )}
      </button>

      {/* Tooltip on hover with smooth horizontal line animation */}
      <AnimatePresence>
        {showTooltip && !showLabel && (
          <motion.div
            role="tooltip"
            initial={{opacity: 0, y: 4}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 3}}
            transition={{duration: 0.22, ease: [0.16, 1, 0.3, 1]}}
            className="hidden sm:flex flex-col items-end absolute right-0 bottom-full mb-2 pointer-events-none z-30"
          >
            <span className="text-[9px] tracking-[0.18em] uppercase font-medium text-neutral-900 dark:text-white bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-2.5 py-1 shadow-sm border border-black/[0.06] dark:border-white/[0.1] whitespace-nowrap">
              {selected ? 'Seçtiklerimden Çıkar' : 'Seçtiklerime Ekle'}
            </span>
            {/* Tam genişlikte sağdan sola çizilen zarif animasyonlu yatay çizgi */}
            <motion.div
              className={`h-[1.5px] w-full ${selected ? 'bg-[#3c424d]' : 'bg-neutral-900 dark:bg-white'} origin-right mt-1 shadow-xs`}
              initial={{scaleX: 0}}
              animate={{scaleX: 1}}
              exit={{scaleX: 0}}
              transition={{duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.04}}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
