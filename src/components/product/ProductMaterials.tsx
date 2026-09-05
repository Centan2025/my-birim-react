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
  disableVariants?: boolean
}> = ({material, imageBorderClass, t, onClick, className, disableVariants}) => (
  <motion.div
    variants={disableVariants ? undefined : sideReveal['item']}
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
      variants={disableVariants ? undefined : sideReveal['wrapper']}
      className="relative overflow-hidden w-full aspect-square sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-sm shadow-sm"
    >
      <motion.div
        variants={disableVariants ? undefined : sideReveal['image']}
        className="w-full h-full overflow-hidden"
      >
        <OptimizedImage
          src={material.image}
          alt={t(material.name)}
          className={`w-full h-full object-cover border border-[var(--border-primary)] group-hover:opacity-80 transition-all duration-300 ${imageBorderClass}`}
          loading="lazy"
          disableResizing={true}
          style={{
            transform: 'scale(3.5)',
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

interface CollapsibleMaterialSectionProps {
  materials: {image: string; name: LocalizedString}[]
  imageBorderClass: string
  isExpanded: boolean
  onToggleExpanded: () => void
  onOpenMaterialLightbox: (images: {image: string; name: string}[], index: number) => void
  t: (v: string | LocalizedString) => string
  getMaterialsForLightbox: (
    materials: {image?: unknown; name?: string | LocalizedString}[]
  ) => {image: string; name: string}[]
  containerKey?: string
}

const CollapsibleMaterialSection: React.FC<CollapsibleMaterialSectionProps> = ({
  materials,
  imageBorderClass,
  isExpanded,
  onToggleExpanded,
  onOpenMaterialLightbox,
  t,
  getMaterialsForLightbox,
  containerKey,
}) => {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const buttonContainerRef = useRef<HTMLDivElement | null>(null)
  const [carouselHeight, setCarouselHeight] = useState<number>(152)
  const [isClosing, setIsClosing] = useState(false)

  // Measure natural height of mobile carousel for smooth height transition
  useEffect(() => {
    if (carouselRef.current) {
      const h = carouselRef.current.offsetHeight
      if (h > 0) setCarouselHeight(h)
    }
  }, [materials])

  useEffect(() => {
    const el = carouselRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const h = entry.borderBoxSize?.[0]?.blockSize ?? entry.target.getBoundingClientRect().height
        if (h > 0 && !isExpanded) {
          setCarouselHeight(Math.round(h))
        }
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [isExpanded])

  const animRef = useRef<number | null>(null)

  // Clean up any pending animation on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current)
      }
    }
  }, [])

  // If parent resets isExpanded (e.g. tab changed), cancel any closing state and cleanup styles
  useEffect(() => {
    if (!isExpanded) {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current)
        animRef.current = null
      }
      if (containerRef.current) {
        containerRef.current.style.height = ''
      }
      setIsClosing(false)
    }
  }, [isExpanded])

  const lightboxItems = getMaterialsForLightbox(materials)
  const isEffectivelyExpanded = isExpanded && !isClosing

  const handleToggleExpanded = () => {
    if (isClosing) return

    if (isExpanded) {
      if (typeof window === 'undefined' || !containerRef.current) {
        onToggleExpanded()
        return
      }

      const container = containerRef.current
      const initialHeight = container.offsetHeight || 0
      const targetHeight = carouselHeight || 152
      const deltaHeight = Math.max(0, initialHeight - targetHeight)

      // Fallback if already collapsed or in headless test environment
      if (deltaHeight <= 0) {
        setIsClosing(true)
        setTimeout(() => {
          onToggleExpanded()
          setIsClosing(false)
        }, 50)
        return
      }

      const initialScrollY = window.scrollY
      const duration = 380 // ms
      const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

      setIsClosing(true)

      if (animRef.current) {
        cancelAnimationFrame(animRef.current)
      }

      // Synchronously animate container height and window scroll frame-by-frame
      // so the button's screen position remains completely fixed ("ekrandaki yeri değişmemeli")
      const step = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(1, elapsed / duration)
        const eased = 1 - Math.pow(1 - progress, 3) // Apple-like easeOutCubic

        const currentDelta = deltaHeight * eased
        const currentHeight = initialHeight - currentDelta
        const currentScrollY = Math.max(0, initialScrollY - currentDelta)

        container.style.height = `${currentHeight}px`
        if (typeof window.scrollTo === 'function') {
          window.scrollTo(0, currentScrollY)
        }

        if (progress < 1) {
          animRef.current = requestAnimationFrame(step)
        } else {
          container.style.height = ''
          setIsClosing(false)
          onToggleExpanded()
          animRef.current = null
        }
      }

      animRef.current = requestAnimationFrame(step)
    } else {
      onToggleExpanded()
    }
  }

  return (
    <div ref={sectionRef}>
      {/* Desktop View: Always full wrap grid */}
      <motion.div
        key={containerKey ? `desk-${containerKey}` : undefined}
        initial="revealOff"
        animate="revealOn"
        variants={sideReveal['container']}
        className="hidden sm:flex sm:flex-wrap gap-3 md:gap-6"
      >
        {materials.map((material, index) => (
          <MaterialCard
            key={`desk-${index}-${material.image || index}`}
            material={material}
            imageBorderClass={imageBorderClass}
            t={t}
            className="w-28 md:w-32"
            onClick={() => onOpenMaterialLightbox(lightboxItems, index)}
          />
        ))}
      </motion.div>

      {/* Mobile View: Smooth collapsible container when > 4 materials */}
      <div className="sm:hidden">
        {materials.length <= 4 ? (
          <div className="grid grid-cols-3 gap-3 pt-1">
            {materials.map((material, index) => (
              <MaterialCard
                key={`mob-short-${index}-${material.image || index}`}
                material={material}
                imageBorderClass={imageBorderClass}
                t={t}
                className="w-full"
                onClick={() => onOpenMaterialLightbox(lightboxItems, index)}
              />
            ))}
          </div>
        ) : (
          <>
            <motion.div
              ref={containerRef}
              initial={false}
              animate={
                isClosing
                  ? undefined
                  : {
                      height: isExpanded ? 'auto' : carouselHeight,
                    }
              }
              transition={{
                duration: 0.42,
                ease: [0.25, 1, 0.5, 1], // Apple-like smooth cubic bezier
              }}
              className="overflow-hidden relative -mx-4"
            >
              {isExpanded ? (
                <div className="w-full grid grid-cols-3 gap-3 pt-1 pb-2 px-4">
                  {materials.map((material, index) => (
                    <motion.div
                      key={`grid-${index}-${material.image || index}`}
                      initial={{opacity: 0, scale: 0.96}}
                      animate={{opacity: 1, scale: 1}}
                      transition={{
                        duration: 0.22,
                        delay: Math.min(index * 0.02, 0.2),
                        ease: 'easeOut',
                      }}
                    >
                      <MaterialCard
                        material={material}
                        imageBorderClass={imageBorderClass}
                        t={t}
                        className="w-full"
                        disableVariants={true}
                        onClick={() => onOpenMaterialLightbox(lightboxItems, index)}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="w-full">
                  <div
                    ref={carouselRef}
                    className="w-full flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-3 pb-3 pt-1 px-4"
                  >
                    {materials.map((material, index) => (
                      <MaterialCard
                        key={`car-${index}-${material.image || index}`}
                        material={material}
                        imageBorderClass={imageBorderClass}
                        t={t}
                        className="w-24 shrink-0 snap-start"
                        disableVariants={true}
                        onClick={() => onOpenMaterialLightbox(lightboxItems, index)}
                      />
                    ))}

                    {/* Extra interactive card at the end of the carousel when not expanded */}
                    <div
                      onClick={handleToggleExpanded}
                      className="text-center group cursor-pointer flex flex-col items-center w-24 shrink-0 snap-start"
                      role="button"
                      tabIndex={0}
                      title={t('show_more') || 'Daha Fazla Göster'}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') handleToggleExpanded()
                      }}
                    >
                      <div className="relative overflow-hidden w-full aspect-square rounded-sm border border-dashed border-[var(--border-primary)] flex flex-col items-center justify-center bg-[var(--bg-secondary)] group-hover:bg-[var(--bg-tertiary)] transition-colors p-2 text-center">
                        <svg
                          className="w-4 h-4 text-[var(--text-secondary)] mb-1.5 transition-transform group-hover:scale-110"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <span className="text-[10px] tracking-wider text-[var(--text-primary)] uppercase font-medium text-center leading-tight">
                          {t('show_more') || 'Daha Fazla Göster'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Show More / Show Less Button on Mobile */}
            <div ref={buttonContainerRef} className="mt-3 -mx-4">
              <button
                type="button"
                onClick={handleToggleExpanded}
                className="w-full py-3 px-4 text-xs font-normal tracking-widest uppercase border-t border-b border-[var(--border-primary)] text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-secondary)] active:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center gap-2"
              >
                <span>
                  {isEffectivelyExpanded
                    ? t('show_less') || 'Daha Az Göster'
                    : t('show_more') || 'Daha Fazla Göster'}
                </span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${isEffectivelyExpanded ? 'rotate-180' : ''}`}
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
          </>
        )}
      </div>
    </div>
  )
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
    if (activeTabRef.current && typeof activeTabRef.current.scrollIntoView === 'function') {
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
                  <div className="relative flex overflow-x-auto no-scrollbar sm:flex-wrap gap-0 border-b border-[var(--border-primary)] mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
                    {books.map((book, idx: number) => {
                      const isSelected = safeBookIndex === idx
                      return (
                        <button
                          key={`book-${idx}`}
                          ref={isSelected ? activeTabRef : undefined}
                          onClick={() => {
                            onSetActiveBookIndex(idx)
                            setIsExpanded(false)
                          }}
                          type="button"
                          role="tab"
                          aria-selected={isSelected}
                          className="relative shrink-0 px-4 py-0 bg-transparent border-0 rounded-none whitespace-nowrap cursor-pointer focus:outline-none select-none"
                        >
                          <span
                            className={`relative inline-block py-2.5 text-xs sm:text-sm font-medium tracking-wider transition-colors duration-200 ${
                              isSelected
                                ? 'text-[var(--text-primary)]'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {t(book.bookTitle)}
                            {isSelected && (
                              <motion.span
                                layoutId={`active-kartela-underline-${safeActiveIndex}`}
                                className="absolute -bottom-px left-0 right-0 h-[2px] bg-[var(--text-primary)] z-10"
                                transition={{
                                  type: 'spring',
                                  stiffness: 400,
                                  damping: 32,
                                }}
                              />
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Materials with smooth collapsible animation */}
                <CollapsibleMaterialSection
                  containerKey={`book-${safeActiveIndex}-${safeBookIndex}`}
                  materials={currentMaterials}
                  imageBorderClass={imageBorderClass}
                  isExpanded={isExpanded}
                  onToggleExpanded={() => setIsExpanded(!isExpanded)}
                  onOpenMaterialLightbox={onOpenMaterialLightbox}
                  t={t}
                  getMaterialsForLightbox={getMaterialsForLightbox}
                />
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
            <CollapsibleMaterialSection
              containerKey="flat-materials"
              materials={flatMaterials}
              imageBorderClass={imageBorderClass}
              isExpanded={isFlatExpanded}
              onToggleExpanded={() => setIsFlatExpanded(!isFlatExpanded)}
              onOpenMaterialLightbox={onOpenMaterialLightbox}
              t={t}
              getMaterialsForLightbox={getMaterialsForLightbox}
            />
          </div>
        )}
      </div>
    </ScrollReveal>
  )
}
