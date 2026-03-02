import { motion } from 'framer-motion'
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
  return (
    <motion.div
      key={animKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

const MaterialCard: React.FC<{
  material: any
  imageBorderClass: string
  t: (v: any) => string
  onClick: () => void
}> = ({ material, imageBorderClass, t, onClick }) => (
  <div
    className="text-center group cursor-pointer flex flex-col items-center w-full sm:w-28 md:w-32"
    title={t(material.name)}
    onClick={onClick}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') onClick()
    }}
    role="button"
    tabIndex={0}
  >
    <OptimizedImage
      src={material.image}
      alt={t(material.name)}
      className={`w-full aspect-square sm:w-28 sm:h-28 md:w-32 md:h-32 object-cover border border-gray-200 group-hover:border-gray-400 transition-all duration-200 shadow-sm group-hover:shadow-md ${imageBorderClass}`}
      loading="lazy"
      quality={80}
    />
    <p className="mt-2 md:mt-3 text-[11px] leading-tight md:text-sm text-gray-600 font-thin tracking-wider w-full break-words">
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
                      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-3 md:gap-6">
                        {(Array.isArray(books[activeBookIndex]?.materials)
                          ? books[activeBookIndex].materials
                          : []
                        ).map((material: any, index: number) => (
                          <MaterialCard
                            key={`mat-${index}-${material.image || index}`}
                            material={material}
                            imageBorderClass={imageBorderClass}
                            t={t}
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
                  <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-3 md:gap-6">
                    {(Array.isArray(grouped[safeActiveIndex]?.materials)
                      ? grouped[safeActiveIndex].materials
                      : []
                    ).map((material: any, index: number) => (
                      <MaterialCard
                        key={`mat-${index}-${material.image || index}`}
                        material={material}
                        imageBorderClass={imageBorderClass}
                        t={t}
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
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-3 md:gap-6">
            {flatMaterials.map((material, index) => (
              <MaterialCard
                key={`matflat-${index}-${material.image || index}`}
                material={material}
                imageBorderClass={imageBorderClass}
                t={t}
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
