import React from 'react'
import { NavLink } from 'react-router-dom'
import type { Category, Product } from '../types'
import type { HeaderTranslateFn } from './HeaderShared'

interface HeaderProductsPanelProps {
  isOpen: boolean
  categories: Category[]
  hoveredCategoryId: string | null
  onHoveredCategoryChange: (id: string | null) => void
  categoryProducts: Map<string, Product[]>
  submenuOffset: number
  onEnter: () => void
  onLeave: () => void
  onClose: () => void
  t: HeaderTranslateFn
}

export const HeaderProductsPanel: React.FC<HeaderProductsPanelProps> = ({
  isOpen,
  categories,
  hoveredCategoryId,
  onHoveredCategoryChange,
  categoryProducts,
  submenuOffset,
  onEnter,
  onLeave,
  onClose,
  t,
}) => {
  return (
    // Ürün kategorileri paneli - header içinde genişleyip daralır
    <div
      className={`hidden lg:block transition-all duration-500 ease-in-out ${isOpen
        ? 'opacity-100 translate-y-0 max-h-[800px]'
        : 'opacity-0 -translate-y-2 max-h-0 overflow-hidden'
        }`}
      style={{
        backgroundColor: isOpen ? 'rgba(0, 0, 0, 0.85)' : 'transparent',
        backdropFilter: isOpen ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: isOpen ? 'blur(16px)' : 'none',
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Beyaz ayırıcı çizgi */}
      <div className="w-full border-t border-white/50"></div>

      <div
        className="pt-4 pb-3 grid grid-cols-[auto_1fr] gap-24"
        style={{ paddingLeft: submenuOffset, paddingRight: '5rem' }}
      >
        {/* Sol taraf - Kategoriler */}
        <div className="overflow-y-auto hide-scrollbar pr-6">
          <div className="flex flex-col gap-3">
            {categories.map(category => (
              <NavLink
                key={category.id}
                to={`/products/${category.id}`}
                className="group relative px-0 py-2 text-sm font-semibold uppercase text-gray-200 hover:text-white transition-colors duration-300"
                onClick={onClose}
                onMouseEnter={() => onHoveredCategoryChange(category.id)}
              >
                <span className="relative inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5 uppercase">
                  {t(category.name)}
                  <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-center"></span>
                </span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Sağ taraf - Görsel */}
        <div
          className="relative w-[600px] self-stretch overflow-hidden"
          style={{
            backgroundColor: 'transparent',
          }}
        >
          {(() => {
            const hoveredCategory = categories.find(c => c.id === hoveredCategoryId)

            // Hover edilmediyse boş alan göster
            if (!hoveredCategory) {
              return null
            }

            let imageUrl = ''
            let imageClass = 'w-full h-full object-cover'

            // Önce menuImage'i kontrol et
            if (hoveredCategory.menuImage) {
              imageUrl = hoveredCategory.menuImage
            } else {
              // menuImage yoksa ilk ürün görselini göster
              const products = categoryProducts.get(hoveredCategory.id)

              if (products && products.length > 0) {
                // Görseli olan ilk ürünü bul
                for (const product of products) {
                  // Ana görseli kontrol et
                  let tempImageUrl =
                    typeof product.mainImage === 'string'
                      ? product.mainImage
                      : product.mainImage?.url

                  // Ana görsel yoksa alternativeMedia'dan al
                  if (
                    !tempImageUrl &&
                    product.alternativeMedia &&
                    product.alternativeMedia.length > 0
                  ) {
                    const firstAlt = product.alternativeMedia[0]
                    if (firstAlt && firstAlt.type === 'image' && firstAlt.url) {
                      tempImageUrl = firstAlt.url
                    }
                  }

                  if (tempImageUrl && tempImageUrl.trim() !== '') {
                    imageUrl = tempImageUrl
                    imageClass = 'max-w-full max-h-full object-contain'
                    break
                  }
                }
              }
            }

            // Görsel bulunduysa göster
            if (imageUrl) {
              return (
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    key={hoveredCategory.id}
                    src={imageUrl}
                    alt={t(hoveredCategory.name)}
                    className={`${imageClass} image-transition`}
                    style={{
                      animation: 'crossFade 0.5s ease-in-out',
                    }}
                  />
                </div>
              )
            }

            return null
          })()}
        </div>
      </div>

      <div className="w-full border-t border-white/50 mt-3"></div>
      <div className="pt-3 pb-3" style={{ paddingLeft: submenuOffset, paddingRight: '5rem' }}>
        <NavLink
          to="/products"
          className="group relative inline-block px-0 py-2 text-sm font-bold uppercase text-white hover:text-gray-200 transition-colors duration-300"
          onClick={onClose}
        >
          <span className="relative inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5 uppercase">
            {t('view_all')}
            <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-center"></span>
          </span>
        </NavLink>
      </div>
    </div>
  )
}


