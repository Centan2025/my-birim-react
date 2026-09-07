import React, {useState} from 'react'
import {useSelection} from '../../context/SelectionContext'
import {AddToProjectModal} from './AddToProjectModal'
import type {Product} from '../../types'
import {getLocalizedText} from '../../types/seckim'

interface DetailSelectionCTAProps {
  product: Product
}

export const DetailSelectionCTA: React.FC<DetailSelectionCTAProps> = ({product}) => {
  const {isInSelection, toggleSelection, isSelectionEnabled} = useSelection()
  const [isAddToProjectOpen, setIsAddToProjectOpen] = useState(false)

  if (!isSelectionEnabled) return null

  const selected = isInSelection(product.id)
  const rawName = getLocalizedText(product.name)

  const handleToggle = () => {
    toggleSelection(product.id, rawName)
  }

  return (
    <>
      <div className="pt-6 border-t border-[var(--border-primary)] flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          className={`group relative inline-flex items-center justify-center gap-3 px-7 py-3.5 text-xs font-semibold uppercase tracking-widest transition-all duration-300 cursor-pointer border ${
            selected
              ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] shadow-sm'
              : 'bg-transparent text-[var(--text-primary)] border-[var(--border-primary)] hover:border-[var(--text-primary)]'
          }`}
          aria-label={selected ? `${rawName} seçkiden çıkar` : `${rawName} seçkiye ekle`}
        >
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:scale-105"
            viewBox="0 0 24 24"
            fill={selected ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={selected ? '1.4' : '1.2'}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6.5 3.5H17.5V20.5L12 16.75L6.5 20.5V3.5Z" />
          </svg>
          <span className="tracking-widest">{selected ? 'SEÇKİDEN ÇIKAR' : 'SEÇKİYE EKLE'}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsAddToProjectOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>PROJEYE EKLE</span>
        </button>
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
