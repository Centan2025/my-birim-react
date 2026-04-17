import { motion, type Variants } from 'framer-motion'
import { OptimizedImage } from '../OptimizedImage'
import { useTranslation } from '../../i18n'
import ScrollReveal from '../ScrollReveal'
import type { LocalizedString } from '../../types'

interface ProductMaterialsProps {
  mergedGroups: { groupTitle: LocalizedString; books: { bookTitle: LocalizedString; materials: { image: string; name: LocalizedString }[] }[] }[]
  grouped: { materials: { image: string; name: LocalizedString }[] }[]
  flatMaterials: { image: string; name: LocalizedString }[]
  activeMaterialGroup: number | null
  activeBookIndex: number
  imageBorderClass: string
  onSetActiveMaterialGroup: (index: number) => void
  onSetActiveBookIndex: (index: number) => void
  onOpenMaterialLightbox: (images: { image: string; name: string }[], index: number) => void
}

const sideReveal: Record<string, Variants> = {
  container: {
    revealOff: { opacity: 0 },
    revealOn: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  },
  item: {
    revealOff: { opacity: 0, x: -50 },
    revealOn: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 }
    },
  },
  wrapper: {
    revealOff: { scaleX: 0, transformOrigin: 'left' },
    revealOn: {
      scaleX: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  },
  image: {
    revealOff: { opacity: 0, x: -20 },
    revealOn: {
      opacity: 1,
      x: 0,
      transition: { delay: 0.2, duration: 0.8 }
    }
  }
}

/**
 * Animated container that fades/slides content when `animKey` changes.
 */
const AnimatedContent: React.FC<{ animKey: string; children: React.ReactNode; variants?: Variants; className?: string }> = ({
  animKey,
  children,
  variants,
  className
}) => {
  return (
    <motion.div
      key={animKey}
      initial={variants ? "revealOff" : { opacity: 0, y: 10 }}
      whileInView={variants ? "revealOn" : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={variants ? undefined : { duration: 0.4, ease: 'easeOut' }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const MaterialCard: React.FC<{
  material: { image: string; name: string | LocalizedString }
  imageBorderClass: string
  t: (v: string | LocalizedString) => string
  onClick: () => void
}> = ({ material, imageBorderClass, t, onClick }) => (
  <motion.div
    variants={sideReveal['item']}
    className="text-center group cursor-pointer flex flex-col items-center w-full sm:w-28 md:w-32"
    title={t(material.name)}
    onClick={onClick}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') onClick()
    }}
    role="button"
    tabIndex={0}
  >
    <motion.div variants={sideReveal['wrapper']} className="relative overflow-hidden w-full aspect-square sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-sm shadow-sm">
      <motion.div variants={sideReveal['image']} className="w-full h-full">
        <OptimizedImage
          src={material.image}
          alt={t(material.name)}
          className={`w-full h-full object-cover border border-[var(--border-primary)] group-hover:opacity-80 transition-all duration-200 group-hover:scale-105 ${imageBorderClass}`}
          loading="lazy"
          quality={80}
        />
      </motion.div>
    </motion.div>
    <p className="mt-2 md:mt-3 text-[11px] leading-tight md:text-sm text-[var(--text-secondary)] font-thin tracking-wider w-full break-words">
      {t(material.name)}
    </p>
  </motion.div>
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

  const getMaterialsForLightbox = (materials: { image?: string; name?: string | LocalizedString }[]) =>
    materials
      .filter((m) => !!m.image)
      .map((m) => ({
        image: m.image as string,
        name: t(m.name || ''),
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
        <h2 className="text-xl font-light text-[var(--text-secondary)] mb-4">{t('material_alternatives')}</h2>
        {hasMaterialGroups ? (
          <>
            {/* Group tabs */}
            <div className="flex flex-wrap gap-0 border-t border-b border-[var(--border-primary)] mb-6 bg-[var(--bg-tertiary)]">
              {(Array.isArray(mergedGroups) ? mergedGroups : []).map((g, idx: number) => (
                <button
                  key={`group-${idx}`}
                  onClick={() => onSetActiveMaterialGroup(idx)}
                  className={`px-5 py-3 text-sm font-thin tracking-wider transition-all duration-200 border-b-2 rounded-none ${activeMaterialGroup === idx
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--text-primary)]'
                    : 'bg-transparent text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
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
                      {books.map((book, idx: number) => (
                        <button
                          key={`book-${idx}`}
                          onClick={() => onSetActiveBookIndex(idx)}
                          className={`px-4 py-2 text-sm font-thin tracking-wider transition-all duration-200 border-b-2 rounded-none ${activeBookIndex === idx
                            ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--text-primary)]'
                            : 'bg-transparent text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                            }`}
                        >
                          {t(book.bookTitle)}
                        </button>
                      ))}
                    </div>

                    {/* Materials with staggered animation */}
                    <motion.div
                      key={`book-${safeActiveIndex}-${activeBookIndex}`}
                      initial="revealOff"
                      animate="revealOn"
                      variants={sideReveal['container']}
                      className="grid grid-cols-3 sm:flex sm:flex-wrap gap-3 md:gap-6"
                    >
                      {(Array.isArray(books[activeBookIndex]?.materials)
                        ? books[activeBookIndex].materials
                        : []
                      ).map((material, index: number) => (
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
                    </motion.div>
                  </>
                ) : (
                  /* Fallback: Direct materials if no books */
                  <motion.div
                    key={`group-direct-${safeActiveIndex}`}
                    initial="revealOff"
                    animate="revealOn"
                    variants={sideReveal['container']}
                    className="grid grid-cols-3 sm:flex sm:flex-wrap gap-3 md:gap-6"
                  >
                    {(Array.isArray(grouped[safeActiveIndex]?.materials)
                      ? grouped[safeActiveIndex].materials
                      : []
                    ).map((material, index: number) => (
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
                  </motion.div>
                )}
              </AnimatedContent>
            ) : (
              <div className="py-8 text-left text-[var(--text-secondary)] font-light">
                {t('please_select_price_group') ||
                  'Lütfen kartelaları görüntülemek için bir fiyat grubu seçiniz.'}
              </div>
            )}
          </>
        ) : (
          /* Flat materials fallback */
          <motion.div
            initial="revealOff"
            animate="revealOn"
            variants={sideReveal['container']}
            className="grid grid-cols-3 sm:flex sm:flex-wrap gap-3 md:gap-6"
          >
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
          </motion.div>
        )}
      </div>
    </ScrollReveal>
  )
}
