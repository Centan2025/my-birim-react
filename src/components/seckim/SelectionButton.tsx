import React from 'react'
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
        className={`group/btn relative flex items-center justify-center p-1 bg-transparent border-0 shadow-none outline-none transition-all duration-300 ease-out cursor-pointer z-10 ${
          selected
            ? 'text-[#525252] dark:text-neutral-300 hover:text-[#333333] dark:hover:text-white hover:scale-110 active:scale-90'
            : 'text-neutral-400 hover:text-neutral-800 dark:text-neutral-500 dark:hover:text-white hover:scale-110 active:scale-90'
        }`}
        aria-label={selected ? `${rawName} seçtiklerimden çıkar` : `${rawName} seçtiklerime ekle`}
      >
        <svg
          className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-300 ease-out group-hover/btn:scale-105 group-active/btn:scale-90"
          viewBox="0 0 24 24"
          fill={selected ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={selected ? '1.5' : '1.3'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>

        {showLabel && (
          <span className="ml-2 text-xs uppercase tracking-wider font-light">
            {selected ? 'Seçtiklerimden Çıkar' : 'Seçtiklerime Ekle'}
          </span>
        )}
      </button>
    </div>
  )
}
