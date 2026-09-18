import React, {useState} from 'react'
import {useSelection} from '../../context/SelectionContext'
import {useTranslation} from '../../i18n'
import {AddToProjectModal} from './AddToProjectModal'
import type {Product} from '../../types'
import {getLocalizedText} from '../../types/seckim'
import {AnimatedTooltip} from '../AnimatedTooltip'

interface DetailSelectionCTAProps {
  product: Product
}

export const DetailSelectionCTA: React.FC<DetailSelectionCTAProps> = ({product}) => {
  const {isInSelection, toggleSelection, isSelectionEnabled} = useSelection()
  const {t} = useTranslation()
  const [isAddToProjectOpen, setIsAddToProjectOpen] = useState(false)

  if (!isSelectionEnabled) return null

  const selected = isInSelection(product.id)
  const rawName = getLocalizedText(product.name)

  const handleToggle = () => {
    toggleSelection(product.id, rawName)
  }

  const selectionTooltip = selected ? t('remove_from_selection') : t('add_to_selection')
  const addToProjectLabel = t('add_to_project')

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        {/* Seçtiklerime Ekle / Çıkar Icon Butonu */}
        <AnimatedTooltip content={selectionTooltip} position="top">
          <button
            type="button"
            onClick={handleToggle}
            className={`group relative inline-flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-none border transition-all duration-300 cursor-pointer shrink-0 shadow-none ${
              selected
                ? 'bg-[#525252] text-white border-[#525252] hover:bg-[#636363] hover:border-[#636363]'
                : 'bg-transparent text-[var(--text-primary)] hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-400 dark:border-neutral-500 hover:border-black dark:hover:border-white'
            }`}
            aria-label={`${rawName} - ${selectionTooltip}`}
          >
            <svg
              className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-105"
              viewBox="0 0 24 24"
              fill={selected ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={selected ? '1.5' : '1.3'}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>
        </AnimatedTooltip>

        {/* Projeye Ekle Icon Butonu */}
        <AnimatedTooltip content={addToProjectLabel} position="top">
          <button
            type="button"
            onClick={() => setIsAddToProjectOpen(true)}
            className="group relative inline-flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-none border border-neutral-400 dark:border-neutral-500 hover:border-black dark:hover:border-white text-[var(--text-primary)] hover:text-black dark:hover:text-white bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300 cursor-pointer shrink-0 shadow-none"
            aria-label={addToProjectLabel}
          >
            <svg
              className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-105"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          </button>
        </AnimatedTooltip>
      </div>

      <AddToProjectModal
        isOpen={isAddToProjectOpen}
        onClose={() => setIsAddToProjectOpen(false)}
        productId={product.id}
        productName={rawName}
      />
    </>
  )
}
