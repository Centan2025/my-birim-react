import React from 'react'
import {OptimizedImage} from '../OptimizedImage'
import {useTranslation} from '../../i18n'
import ScrollReveal from '../ScrollReveal'

interface ProductMaterialsProps {
  mergedGroups: any[]
  grouped: any[]
  flatMaterials: any[]
  activeMaterialGroup: number | null
  activeBookIndex: number
  imageBorderClass: string
  onSetActiveMaterialGroup: (index: number) => void
  onSetActiveBookIndex: (index: number) => void
  onOpenMaterialLightbox: (images: any[], index: number) => void
}

export const ProductMaterials: React.FC<ProductMaterialsProps> = ({
  mergedGroups,
  grouped,
  flatMaterials,
  activeMaterialGroup,
  activeBookIndex,
  imageBorderClass,
  onSetActiveMaterialGroup,
  onSetActiveBookIndex,
  onOpenMaterialLightbox,
}) => {
  const {t} = useTranslation()

  const hasMaterialGroups = Array.isArray(mergedGroups) && mergedGroups.length > 0
  const safeActiveIndex =
    activeMaterialGroup === null
      ? 0
      : Math.min(Math.max(activeMaterialGroup, 0), Math.max(mergedGroups.length - 1, 0))
  const activeGroup =
    activeMaterialGroup !== null && Array.isArray(mergedGroups)
      ? mergedGroups[safeActiveIndex]
      : undefined
  const books = Array.isArray(activeGroup?.books) ? activeGroup.books : []

  if (!hasMaterialGroups && flatMaterials.length === 0) return null

  return (
    <ScrollReveal delay={300} threshold={0.05}>
      <div className="pb-4">
        <h2 className="text-xl font-light text-gray-600 mb-4">{t('material_alternatives')}</h2>
        {hasMaterialGroups ? (
          <>
            {/* Group tabs */}
            <div className="flex flex-wrap gap-0 border-t border-b border-gray-400 mb-6 bg-gray-200">
              {(Array.isArray(mergedGroups) ? mergedGroups : []).map((g: any, idx: number) => (
                <button
                  key={`group-${idx}`}
                  onClick={() => onSetActiveMaterialGroup(idx)}
                  className={`px-5 py-3 text-sm font-thin tracking-wider transition-all duration-200 border-b-2 rounded-none ${
                    activeMaterialGroup === idx
                      ? 'bg-white text-gray-800 border-gray-500'
                      : 'bg-transparent text-gray-600 border-transparent hover:text-gray-800'
                  }`}
                >
                  {t(g.groupTitle)}
                </button>
              ))}
            </div>

            {/* Swatch books tabs */}
            {activeMaterialGroup !== null ? (
              books.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-0 border-b border-gray-200 mb-6">
                    {books.map((book: any, idx: number) => (
                      <button
                        key={`book-${idx}`}
                        onClick={() => onSetActiveBookIndex(idx)}
                        className={`px-4 py-2 text-sm font-thin tracking-wider transition-all duration-200 border-b-2 rounded-none ${
                          activeBookIndex === idx
                            ? 'bg-white text-gray-800 border-gray-500'
                            : 'bg-transparent text-gray-600 border-transparent hover:text-gray-800'
                        }`}
                      >
                        {t(book.bookTitle)}
                      </button>
                    ))}
                  </div>

                  {/* Materials */}
                  <div className="flex flex-wrap gap-6">
                    {(Array.isArray(books[activeBookIndex]?.materials)
                      ? books[activeBookIndex].materials
                      : []
                    ).map((material: any, index: number) => (
                      <div
                        key={index}
                        className="text-center group cursor-pointer"
                        title={t(material.name)}
                        onClick={() => {
                          const allMaterials = Array.isArray(books[activeBookIndex]?.materials)
                            ? books[activeBookIndex].materials
                            : []

                          onOpenMaterialLightbox(
                            allMaterials.map((m: any) => ({
                              image: m.image,
                              name: t(m.name),
                            })),
                            index
                          )
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            const allMaterials = Array.isArray(books[activeBookIndex]?.materials)
                              ? books[activeBookIndex].materials
                              : []

                            onOpenMaterialLightbox(
                              allMaterials.map((m: any) => ({
                                image: m.image,
                                name: t(m.name),
                              })),
                              index
                            )
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <OptimizedImage
                          src={material.image}
                          alt={t(material.name)}
                          className={`w-28 h-28 md:w-32 md:h-32 object-cover border border-gray-200 group-hover:border-gray-400 transition-all duration-200 shadow-sm group-hover:shadow-md ${imageBorderClass}`}
                          loading="lazy"
                          quality={80}
                        />
                        <p className="mt-3 text-xs md:text-sm text-gray-600 font-thin tracking-wider max-w-[120px] break-words">
                          {t(material.name)}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Fallback:Direct materials if no books */
                <div className="flex flex-wrap gap-6">
                  {(Array.isArray(grouped[safeActiveIndex]?.materials)
                    ? grouped[safeActiveIndex].materials
                    : []
                  ).map((material: any, index: number) => (
                    <div
                      key={`mat-${index}-${material.image || index}`}
                      className="text-center group cursor-pointer"
                      title={t(material.name)}
                      onClick={() => {
                        const allMaterials = Array.isArray(grouped[safeActiveIndex]?.materials)
                          ? grouped[safeActiveIndex].materials
                          : []

                        onOpenMaterialLightbox(
                          allMaterials.map((m: any) => ({
                            image: m.image,
                            name: t(m.name),
                          })),
                          index
                        )
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          const allMaterials = Array.isArray(grouped[safeActiveIndex]?.materials)
                            ? grouped[safeActiveIndex].materials
                            : []

                          onOpenMaterialLightbox(
                            allMaterials.map((m: any) => ({
                              image: m.image,
                              name: t(m.name),
                            })),
                            index
                          )
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <OptimizedImage
                        src={material.image}
                        alt={t(material.name)}
                        className={`w-28 h-28 md:w-32 md:h-32 object-cover border border-gray-200 group-hover:border-gray-400 transition-all duration-200 shadow-sm group-hover:shadow-md ${imageBorderClass}`}
                        loading="lazy"
                        quality={80}
                      />
                      <p className="mt-3 text-xs md:text-sm text-gray-600 font-thin tracking-wider max-w-[120px] break-words">
                        {t(material.name)}
                      </p>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="py-8 text-left text-gray-500 font-light">
                {t('please_select_price_group') ||
                  'Lütfen kartelaları görüntülemek için bir fiyat grubu seçiniz.'}
              </div>
            )}
          </>
        ) : (
          /* Flat materials fallback */
          <div className="flex flex-wrap gap-6">
            {flatMaterials.map((material, index) => (
              <div
                key={`matflat-${index}-${material.image || index}`}
                className="text-center group cursor-pointer"
                title={t(material.name)}
                onClick={() =>
                  onOpenMaterialLightbox(
                    flatMaterials.map(m => ({
                      image: m.image,
                      name: t(m.name),
                    })),
                    index
                  )
                }
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onOpenMaterialLightbox(
                      flatMaterials.map(m => ({
                        image: m.image,
                        name: t(m.name),
                      })),
                      index
                    )
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <OptimizedImage
                  src={material.image}
                  alt={t(material.name)}
                  className={`w-28 h-28 md:w-32 md:h-32 object-cover border border-gray-200 group-hover:border-gray-400 transition-all duration-200 shadow-sm group-hover:shadow-md ${imageBorderClass}`}
                  loading="lazy"
                  quality={80}
                />
                <p className="mt-3 text-xs md:text-sm text-gray-600 font-thin tracking-wider max-w-[120px] break-words">
                  {t(material.name)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollReveal>
  )
}
