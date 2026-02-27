import React, { useState, useEffect, useRef } from 'react'
import { OptimizedImage } from '../OptimizedImage'
import { useTranslation } from '../../i18n'
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

/**
 * Animated container that fades/slides content when `animKey` changes.
 */
const AnimatedContent: React.FC<{ animKey: string; children: React.ReactNode }> = ({
  animKey,
  children,
}) => {
  const [displayKey, setDisplayKey] = useState(animKey)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentChildren, setCurrentChildren] = useState(children)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (animKey !== displayKey) {
      // Fade out
      setIsAnimating(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        // Swap content and fade in
        setCurrentChildren(children)
        setDisplayKey(animKey)
        // Trigger reflow then fade in
        requestAnimationFrame(() => {
          setIsAnimating(false)
        })
      }, 200) // fade-out süresi
    } else {
      setCurrentChildren(children)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [animKey, displayKey, children])

  return (
    <div
      className={`transition-all duration-300 ease-out ${isAnimating ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
        }`}
    >
      {currentChildren}
    </div>
  )
}

const MaterialCard: React.FC<{
  material: any
  index: number
  imageBorderClass: string
  t: (v: any) => string
  onClick: () => void
  animDelay: number
}> = ({ material, index, imageBorderClass, t, onClick, animDelay }) => (
  <div
    key={index}
    className="text-center group cursor-pointer"
    title={t(material.name)}
    onClick={onClick}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') onClick()
    }}
    role="button"
    tabIndex={0}
    style={{
      animationDelay: `${animDelay}ms`,
      animation: 'materialFadeIn 0.4s ease-out both',
    }}
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
)

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
  const { t } = useTranslation()

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

  const getMaterialsForLightbox = (materials: any[]) =>
    materials.map((m: any) => ({
      image: m.image,
      name: t(m.name),
    }))

  return (
    <ScrollReveal delay={300} threshold={0.05}>
      {/* Animasyon keyframes */}
      <style>{`
        @keyframes materialFadeIn {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
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
                  className={`px-5 py-3 text-sm font-thin tracking-wider transition-all duration-200 border-b-2 rounded-none ${activeMaterialGroup === idx
                      ? 'bg-white text-gray-800 border-gray-500'
                      : 'bg-transparent text-gray-600 border-transparent hover:text-gray-800'
                    }`}
                >
                  {t(g.groupTitle)}
                </button>
              ))}
            </div>

            {/* Content area with animation */}
            {activeMaterialGroup !== null ? (
              <AnimatedContent animKey={`group-${safeActiveIndex}`}>
                {books.length > 0 ? (
                  <>
                    {/* Swatch books tabs */}
                    <div className="flex flex-wrap gap-0 border-b border-gray-200 mb-6">
                      {books.map((book: any, idx: number) => (
                        <button
                          key={`book-${idx}`}
                          onClick={() => onSetActiveBookIndex(idx)}
                          className={`px-4 py-2 text-sm font-thin tracking-wider transition-all duration-200 border-b-2 rounded-none ${activeBookIndex === idx
                              ? 'bg-white text-gray-800 border-gray-500'
                              : 'bg-transparent text-gray-600 border-transparent hover:text-gray-800'
                            }`}
                        >
                          {t(book.bookTitle)}
                        </button>
                      ))}
                    </div>

                    {/* Materials with staggered animation */}
                    <AnimatedContent animKey={`book-${safeActiveIndex}-${activeBookIndex}`}>
                      <div className="flex flex-wrap gap-6">
                        {(Array.isArray(books[activeBookIndex]?.materials)
                          ? books[activeBookIndex].materials
                          : []
                        ).map((material: any, index: number) => (
                          <MaterialCard
                            key={`mat-${index}-${material.image || index}`}
                            material={material}
                            index={index}
                            imageBorderClass={imageBorderClass}
                            t={t}
                            animDelay={index * 30}
                            onClick={() => {
                              const allMaterials = Array.isArray(books[activeBookIndex]?.materials)
                                ? books[activeBookIndex].materials
                                : []
                              onOpenMaterialLightbox(getMaterialsForLightbox(allMaterials), index)
                            }}
                          />
                        ))}
                      </div>
                    </AnimatedContent>
                  </>
                ) : (
                  /* Fallback: Direct materials if no books */
                  <div className="flex flex-wrap gap-6">
                    {(Array.isArray(grouped[safeActiveIndex]?.materials)
                      ? grouped[safeActiveIndex].materials
                      : []
                    ).map((material: any, index: number) => (
                      <MaterialCard
                        key={`mat-${index}-${material.image || index}`}
                        material={material}
                        index={index}
                        imageBorderClass={imageBorderClass}
                        t={t}
                        animDelay={index * 30}
                        onClick={() => {
                          const allMaterials = Array.isArray(grouped[safeActiveIndex]?.materials)
                            ? grouped[safeActiveIndex].materials
                            : []
                          onOpenMaterialLightbox(getMaterialsForLightbox(allMaterials), index)
                        }}
                      />
                    ))}
                  </div>
                )}
              </AnimatedContent>
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
              <MaterialCard
                key={`matflat-${index}-${material.image || index}`}
                material={material}
                index={index}
                imageBorderClass={imageBorderClass}
                t={t}
                animDelay={index * 30}
                onClick={() =>
                  onOpenMaterialLightbox(getMaterialsForLightbox(flatMaterials), index)
                }
              />
            ))}
          </div>
        )}
      </div>
    </ScrollReveal>
  )
}
