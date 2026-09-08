import React, {useState} from 'react'
import {useSelection} from '../../context/SelectionContext'
import {AddToProjectModal} from './AddToProjectModal'
import {ProductPdfButton} from '../product/ProductPdfButton'
import type {Category, Designer, Product, ProductMaterialsGroup} from '../../types'
import {getLocalizedText} from '../../types/seckim'

interface DetailSelectionCTAProps {
  product: Product
  category?: Category | null
  designer?: Designer | null
  designers?: Designer[]
  mergedGroups?: ProductMaterialsGroup[]
}

export const DetailSelectionCTA: React.FC<DetailSelectionCTAProps> = ({
  product,
  category,
  designer,
  designers,
  mergedGroups,
}) => {
  const {isInSelection, toggleSelection, isSelectionEnabled} = useSelection()
  const [isAddToProjectOpen, setIsAddToProjectOpen] = useState(false)

  const selected = isInSelection(product.id)
  const rawName = getLocalizedText(product.name)

  const handleToggle = () => {
    toggleSelection(product.id, rawName)
  }

  return (
    <>
      <div className="pt-6 border-t border-[var(--border-primary)] flex flex-wrap items-center gap-3">
        {isSelectionEnabled && (
          <>
            <button
              type="button"
              onClick={handleToggle}
              className={`group relative inline-flex items-center justify-center gap-3 px-7 py-3.5 text-xs font-semibold uppercase tracking-widest transition-all duration-300 cursor-pointer border ${
                selected
                  ? 'bg-[#3c424d] text-white border-[#3c424d] hover:bg-[#4a515c] hover:border-[#4a515c] shadow-sm'
                  : 'bg-transparent text-[var(--text-primary)] border-[var(--border-primary)] hover:border-[#3c424d] hover:text-[#3c424d]'
              }`}
              aria-label={selected ? `${rawName} seçtiklerimden çıkar` : `${rawName} seçtiklerime ekle`}
            >
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:scale-105"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={selected ? '1.4' : '1.2'}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="7" y="7" width="13" height="13" rx="1.5" fill="none" />
                <path d="M4 17V5a1 1 0 0 1 1-1h12" fill="none" />
              </svg>
              <span className="tracking-widest">
                {selected ? 'SEÇTİKLERİMDEN ÇIKAR' : 'SEÇTİKLERİME EKLE'}
              </span>
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
          </>
        )}

        <ProductPdfButton
          product={product}
          category={category}
          designer={designer}
          designers={designers}
          mergedGroups={mergedGroups}
        />
      </div>

      {isSelectionEnabled && (
        <AddToProjectModal
          isOpen={isAddToProjectOpen}
          onClose={() => setIsAddToProjectOpen(false)}
          productId={product.id}
          productName={rawName}
        />
      )}
    </>
  )
}
