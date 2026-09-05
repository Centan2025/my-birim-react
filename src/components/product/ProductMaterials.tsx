import React, {useState, useEffect, useRef} from 'react'
import {motion, type Variants} from 'framer-motion'
import {OptimizedImage} from '../OptimizedImage'
import {useTranslation} from '../../i18n'
import ScrollReveal from '../ScrollReveal'
import type {LocalizedString} from '../../types'
import {mapImage, SanityImageLike} from '../../services/sanity/client'

interface ProductMaterialsProps {
  mergedGroups: {
    groupTitle: LocalizedString
    books: {bookTitle: LocalizedString; materials: {image: string; name: LocalizedString}[]}[]
  }[]
  grouped: {materials: {image: string; name: LocalizedString}[]}[]
  flatMaterials: {image: string; name: LocalizedString}[]
  activeMaterialGroup: number | null
  activeBookIndex: number
  imageBorderClass: string
  onSetActiveMaterialGroup: (index: number) => void
  onSetActiveBookIndex: (index: number) => void
  onOpenMaterialLightbox: (images: {image: string; name: string}[], index: number) => void
}

const sideReveal: Record<string, Variants> = {
  container: {
    revealOff: {opacity: 0},
    revealOn: {
      opacity: 1,
      transition: {staggerChildren: 0.1},
    },
  },
  item: {
    revealOff: {opacity: 0, x: -50},
    revealOn: {
      opacity: 1,
      x: 0,
      transition: {type: 'spring', stiffness: 100, damping: 20},
    },
  },
  wrapper: {
    revealOff: {scaleX: 0, transformOrigin: 'left'},
    revealOn: {
      scaleX: 1,
      transition: {duration: 0.8, ease: [0.22, 1, 0.36, 1]},
    },
  },
  image: {
    revealOff: {opacity: 0, x: -20},
    revealOn: {
      opacity: 1,
      x: 0,
      transition: {delay: 0.2, duration: 0.8},
    },
  },
}

/**
 * Animated container that fades/slides content when `animKey` changes.
 */
const AnimatedContent: React.FC<{
  animKey: string
  children: React.ReactNode
  variants?: Variants
  className?: string
}> = ({animKey, children, variants, className}) => {
  return (
    <motion.div
      key={animKey}
      initial={variants ? 'revealOff' : {opacity: 0, y: 10}}
      whileInView={variants ? 'revealOn' : {opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.1}}
      transition={variants ? undefined : {duration: 0.4, ease: 'easeOut'}}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const MaterialCard: React.FC<{
  material: {image: string; name: string | LocalizedString}
  imageBorderClass: string
  t: (v: string | LocalizedString) => string
  onClick: () => void
  className?: string
}> = ({material, imageBorderClass, t, onClick, className}) => (
  <motion.div
    variants={sideReveal['item']}
    className={`text-center group cursor-pointer flex flex-col items-center ${className ?? 'w-full sm:w-28 md:w-32'}`}
    title={t(material.name)}
    onClick={onClick}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') onClick()
    }}
    role="button"
    tabIndex={0}
  >
    <motion.div
      variants={sideReveal['wrapper']}
      className="relative overflow-hidden w-full aspect-square sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-sm shadow-sm"
    >
      <motion.div variants={sideReveal['image']} className="w-full h-full overflow-hidden">
        <OptimizedImage
          src={material.image}
          alt={t(material.name)}
          className={`w-full h-full object-cover border border-[var(--border-primary)] group-hover:opacity-80 transition-all duration-300 ${imageBorderClass}`}
          loading="lazy"
          disableResizing={true}
          style={{
            transform: 'scale(1.75)',
            transformOrigin: 'center center',
            imageRendering: 'auto',
          }}
        />
      </motion.div>
    </motion.div>
    <p className="mt-2 md:mt-3 text-[11px] leading-tight md:text-sm text-[var(--text-primary)] font-normal tracking-wider w-full break-words">
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
  const {t} = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFlatExpanded, setIsFlatExpanded] = useState(false)
  const activeTabRef = useRef<HTMLButtonElement | null>(null)

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
  const safeBookIndex = Math.min(Math.max(activeBookIndex, 0), Math.max(books.length - 1, 0))
  const activeGroupObj = activeGroup as Record<string, unknown> | undefined
  const activeGroupMaterials = Array.isArray(activeGroupObj?.['materials'])
    ? (activeGroupObj['materials'] as {image: string; name: LocalizedString}[])
    : undefined
  const currentMaterials: {image: string; name: LocalizedString}[] =
    Array.isArray(books[safeBookIndex]?.materials) && books[safeBookIndex].materials.length > 0
      ? books[safeBookIndex].materials
      : activeGroupMaterials && activeGroupMaterials.length > 0
        ? activeGroupMaterials
        : Array.isArray(grouped[safeActiveIndex]?.materials)
          ? grouped[safeActiveIndex].materials
          : []

  // Ensure active book tab is visible in mobile horizontal scroll
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [safeBookIndex])

  // Reset expanded state on group or book change
  useEffect(() => {
    setIsExpanded(false)
  }, [activeMaterialGroup, activeBookIndex])

  if (!hasMaterialGroups && flatMaterials.length === 0) return null

  const getMaterialsForLightbox = (
    materials: {image?: unknown; name?: string | LocalizedString}[]
  ) =>
    materials
      .map(m => {
        const imgUrl = typeof m.image === 'string' ? m.image : mapImage(m.image as SanityImageLike)
        return {
          image: imgUrl,
          name: t(m.name || ''),
        }
      })
      .filter(m => Boolean(m.image))

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
        <h2 className="text-xl font-light text-[var(--text-secondary)] mb-4">
          {t('material_alternatives')}
        </h2>
        {hasMaterialGroups ? (
          <>
            {/* Group tabs */}
            <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-0 border-t border-b border-[var(--border-primary)] mb-6 bg-[var(--bg-tertiary)] -mx-4 px-4 sm:mx-0 sm:px-0">
              {(Array.isArray(mergedGroups) ? mergedGroups : []).map((g, idx: number) => (
                <button
                  key={`group-${idx}`}
                  onClick={() => {
                    onSetActiveMaterialGroup(idx)
                    setIsExpanded(false)
                  }}
                  className={`shrink-0 px-5 py-3 text-sm font-normal tracking-wider transition-all duration-200 border-b-2 rounded-none whitespace-nowrap ${
                    activeMaterialGroup === idx
                      ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--text-primary)] font-medium'
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
                {/* Swatch books tabs */}
                {books.length > 0 && (
                  <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-0 border-b border-gray-200 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
                    {books.map((book, idx: number) => (
                      <button
                        key={`book-${idx}`}
                        ref={safeBookIndex === idx ? activeTabRef : undefined}
                        onClick={() => {
                          onSetActiveBookIndex(idx)
                          setIsExpanded(false)
                        }}
                        className={`shrink-0 px-4 py-2 text-xs sm:text-sm font-normal tracking-wider transition-all duration-200 border-b-2 rounded-none whitespace-nowrap ${
                          safeBookIndex === idx
                            ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--text-primary)] font-medium'
                            : 'bg-transparent text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {t(book.bookTitle)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Materials with staggered animation */}
                <motion.div
                  key={`book-${safeActiveIndex}-${safeBookIndex}`}
                  initial="revealOff"
                  animate="revealOn"
                  variants={sideReveal['container']}
                  className={
                    isExpanded
                      ? 'grid grid-cols-3 sm:flex sm:flex-wrap gap-3 md:gap-6'
                      : 'flex sm:flex-wrap overflow-x-auto no-scrollbar sm:overflow-visible snap-x snap-mandatory gap-3 md:gap-6 pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0'
                  }
                >
                  {currentMaterials.map((material, index: number) => (
                    <MaterialCard
                      key={`mat-${index}-${material.image || index}`}
                      material={material}
                      imageBorderClass={imageBorderClass}
                      t={t}
                      className={
                        isExpanded
                          ? 'w-full sm:w-28 md:w-32'
                          : 'w-24 shrink-0 snap-start sm:w-28 md:w-32 sm:shrink'
                      }
                      onClick={() => {
                        onOpenMaterialLightbox(getMaterialsForLightbox(currentMaterials), index)
                      }}
                    />
                  ))}

                  {/* Extra interactive card at the end of the carousel when not expanded */}
                  {!isExpanded && currentMaterials.length > 4 && (
                    <motion.div
                      variants={sideReveal['item']}
                      onClick={() => setIsExpanded(true)}
                      className="text-center group cursor-pointer flex flex-col items-center w-24 shrink-0 snap-start sm:hidden"
                      role="button"
                      tabIndex={0}
                      title={t('show_more')}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') setIsExpanded(true)
                      }}
                    >
                      <div className="relative overflow-hidden w-full aspect-square rounded-sm border border-dashed border-[var(--border-primary)] flex flex-col items-center justify-center bg-[var(--bg-secondary)] group-hover:bg-[var(--bg-tertiary)] transition-colors">
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          +{currentMaterials.length - 4}
                        </span>
                        <span className="text-[9px] tracking-wider text-[var(--text-secondary)] mt-0.5 uppercase text-center px-1">
                          {t('show_more')}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] leading-tight text-[var(--text-secondary)] font-normal tracking-wider">
                        {t('more') || 'Daha Fazla'}
                      </p>
                    </motion.div>
                  )}
                </motion.div>

                {/* Show More / Show Less Button on Mobile */}
                {currentMaterials.length > 4 && (
                  <div className="mt-4 sm:hidden -mx-4">
                    <button
                      type="button"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="w-full py-3.5 px-4 text-xs font-normal tracking-widest uppercase border-t border-b border-[var(--border-primary)] text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-secondary)] transition-colors flex items-center justify-center gap-2"
                    >
                      <span>
                        {isExpanded
                          ? t('show_less') || 'Daha Az Göster'
                          : t('show_more') || 'Daha Fazla Göster'}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
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
          <div>
            <motion.div
              initial="revealOff"
              animate="revealOn"
              variants={sideReveal['container']}
              className={
                isFlatExpanded
                  ? 'grid grid-cols-3 sm:flex sm:flex-wrap gap-3 md:gap-6'
                  : 'flex sm:flex-wrap overflow-x-auto no-scrollbar sm:overflow-visible snap-x snap-mandatory gap-3 md:gap-6 pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0'
              }
            >
              {flatMaterials.map((material, index) => (
                <MaterialCard
                  key={`matflat-${index}-${material.image || index}`}
                  material={material}
                  imageBorderClass={imageBorderClass}
                  t={t}
                  className={
                    isFlatExpanded
                      ? 'w-full sm:w-28 md:w-32'
                      : 'w-24 shrink-0 snap-start sm:w-28 md:w-32 sm:shrink'
                  }
                  onClick={() =>
                    onOpenMaterialLightbox(getMaterialsForLightbox(flatMaterials), index)
                  }
                />
              ))}

              {!isFlatExpanded && flatMaterials.length > 4 && (
                <motion.div
                  variants={sideReveal['item']}
                  onClick={() => setIsFlatExpanded(true)}
                  className="text-center group cursor-pointer flex flex-col items-center w-24 shrink-0 snap-start sm:hidden"
                  role="button"
                  tabIndex={0}
                  title={t('show_more')}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') setIsFlatExpanded(true)
                  }}
                >
                  <div className="relative overflow-hidden w-full aspect-square rounded-sm border border-dashed border-[var(--border-primary)] flex flex-col items-center justify-center bg-[var(--bg-secondary)] group-hover:bg-[var(--bg-tertiary)] transition-colors">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      +{flatMaterials.length - 4}
                    </span>
                    <span className="text-[9px] tracking-wider text-[var(--text-secondary)] mt-0.5 uppercase text-center px-1">
                      {t('show_more')}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-tight text-[var(--text-secondary)] font-normal tracking-wider">
                    {t('more') || 'Daha Fazla'}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {flatMaterials.length > 4 && (
              <div className="mt-4 sm:hidden -mx-4">
                <button
                  type="button"
                  onClick={() => setIsFlatExpanded(!isFlatExpanded)}
                  className="w-full py-3.5 px-4 text-xs font-normal tracking-widest uppercase border-t border-b border-[var(--border-primary)] text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-secondary)] transition-colors flex items-center justify-center gap-2"
                >
                  <span>
                    {isFlatExpanded
                      ? t('show_less') || 'Daha Az Göster'
                      : t('show_more') || 'Daha Fazla Göster'}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${isFlatExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </ScrollReveal>
  )
}
