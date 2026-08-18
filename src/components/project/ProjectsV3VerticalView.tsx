import React, {useState, useMemo, useRef, useCallback} from 'react'
import {Link} from 'react-router-dom'
import {motion, AnimatePresence, useMotionValue, useSpring} from 'framer-motion'
import type {Project} from '../../types'
import {OptimizedImage} from '../OptimizedImage'
import {Breadcrumbs} from '../Breadcrumbs'
import {useTranslation} from '../../i18n'
import {toPlainText} from '../../utils/portableText'

interface ProjectsV3VerticalViewProps {
  projects: Project[]
}

type ViewMode = 'bento' | 'editorial'
type SortOrder = 'default' | 'newest' | 'oldest' | 'alphabetical'

/**
 * Interactive Sharp Light Architectural Bento Card with Mouse-driven Spotlight & Spring Physics
 */
const BentoSpotlightCard: React.FC<{
  children: React.ReactNode
  className?: string
  onClick?: () => void
}> = ({children, className = '', onClick}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const smoothX = useSpring(mouseX, {stiffness: 280, damping: 24})
  const smoothY = useSpring(mouseY, {stiffness: 280, damping: 24})

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    },
    [mouseX, mouseY]
  )

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-none border border-neutral-200/90 bg-white shadow-xs transition-all duration-300 hover:border-neutral-900 hover:shadow-md ${className}`}
    >
      {/* Dynamic Radial Spotlight Highlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(550px circle at ${smoothX}px ${smoothY}px, rgba(0,0,0,0.035), transparent 80%)`,
        }}
      />
      {children}
    </motion.div>
  )
}

/**
 * Hero Master Light Architectural Bento Showcase
 */
const HeroBentoSection: React.FC<{
  project: Project
}> = ({project}) => {
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'
  const [activeMediaIdx, setActiveMediaIdx] = useState<number>(0)

  const mediaList = useMemo(() => {
    const list: {url: string; urlMobile?: string; urlDesktop?: string}[] = []
    if (project.cover) {
      if (typeof project.cover === 'string') list.push({url: project.cover})
      else if (project.cover.url) list.push({url: project.cover.url})
    }
    if (project.media) {
      project.media.forEach(m => {
        if (m.url && (!list[0] || list[0].url !== m.url)) list.push({url: m.url})
      })
    }
    return list
  }, [project.cover, project.media])

  const activeMedia = mediaList[activeMediaIdx] || mediaList[0]
  const title = toPlainText(t(project.title))
  const category = toPlainText(project.projectCategory ? t(project.projectCategory) : '')
  const projObj = project as unknown as Record<string, unknown>
  const location = toPlainText(projObj['location'] ? t(projObj['location'] as never) : '')
  const dateVal =
    typeof project.date === 'string'
      ? project.date
      : toPlainText(project.date ? t(project.date as never) : '')
  const year = typeof dateVal === 'string' ? dateVal.match(/\d{4}/)?.[0] || dateVal : ''
  const excerpt = toPlainText(project.excerpt ? t(project.excerpt as never) : '')

  return (
    <section className="mb-6 md:mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Left: Cinematic Master Viewport (7 Cols) */}
        <BentoSpotlightCard className="lg:col-span-7 flex flex-col justify-between p-2.5 min-h-[380px] sm:min-h-[440px] lg:min-h-[490px]">
          <div className="relative block w-full h-full min-h-[360px] sm:min-h-[420px] lg:min-h-[470px] overflow-hidden bg-neutral-100 group/link border border-neutral-200">
            <Link to={`/projects/${project.id}`} className="absolute inset-0 z-10">
              <AnimatePresence mode="wait">
                {activeMedia && (
                  <motion.div
                    key={activeMedia.url}
                    initial={{opacity: 0, scale: 1.02}}
                    animate={{opacity: 1, scale: 1}}
                    exit={{opacity: 0}}
                    transition={{duration: 0.5, ease: [0.16, 1, 0.3, 1]}}
                    className="absolute inset-0 w-full h-full"
                  >
                    <OptimizedImage
                      src={activeMedia.url}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover/link:scale-105"
                      quality={92}
                      loading="eager"
                      fetchPriority="high"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>

            {/* Subtle Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40 pointer-events-none" />

            {/* Top Right Year Stamp (Modern Typography, No Background, Pure White Text) */}
            {year && (
              <div className="absolute top-4 right-4 z-20 pointer-events-none">
                <span className="text-white text-sm sm:text-base font-michroma font-light tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {year}
                </span>
              </div>
            )}

            {/* Multi-angle Asset Navigator (No Background) */}
            {mediaList.length > 1 && (
              <div
                className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5"
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onKeyDown={e => e.stopPropagation()}
                role="toolbar"
                tabIndex={0}
              >
                {mediaList.slice(0, 6).map((item, idx) => (
                  <button
                    key={item.url || idx}
                    type="button"
                    onClick={() => setActiveMediaIdx(idx)}
                    className={`h-1.5 transition-all duration-300 cursor-pointer rounded-none ${
                      idx === activeMediaIdx
                        ? 'w-5 bg-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]'
                        : 'w-1.5 bg-white/50 hover:bg-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]'
                    }`}
                    aria-label={`Frame ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </BentoSpotlightCard>

        {/* Right: Architectural Dossier Telemetry (5 Cols - Crisp Light Palette) */}
        <BentoSpotlightCard className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 lg:p-9 bg-neutral-50/70">
          <div className="space-y-5">
            {/* Header Category Strip */}
            {category && (
              <div className="text-xs font-mono tracking-widest text-neutral-500 pb-3 border-b border-neutral-200 uppercase">
                {category}
              </div>
            )}

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light font-michroma uppercase text-neutral-900 tracking-tight leading-[1.14]">
              <Link to={`/projects/${project.id}`} className="hover:opacity-75 transition-opacity">
                {title}
              </Link>
            </h2>

            {/* Architectural Spec Data Grid */}
            <div className="grid grid-cols-2 gap-2.5 py-2.5 border-y border-neutral-200 text-xs font-mono">
              <div className="p-3 bg-white border border-neutral-200/90 shadow-xs">
                <span className="text-[10px] text-neutral-400 block uppercase tracking-widest">
                  {isTr ? 'LOKASYON' : 'LOCATION'}
                </span>
                <span className="text-neutral-900 font-medium block mt-1 truncate">
                  {location || 'İSTANBUL, TR'}
                </span>
              </div>
              <div className="p-3 bg-white border border-neutral-200/90 shadow-xs">
                <span className="text-[10px] text-neutral-400 block uppercase tracking-widest">
                  {isTr ? 'DÖNEM' : 'TIMELINE'}
                </span>
                <span className="text-neutral-900 font-medium block mt-1">{year || '2024'}</span>
              </div>
            </div>

            {/* Narrative Excerpt */}
            {excerpt && (
              <p className="text-sm text-neutral-600 font-light leading-relaxed line-clamp-3">
                {excerpt}
              </p>
            )}
          </div>

          {/* Action Footer (Birim Architectural Outline Button) */}
          <div className="pt-5 mt-3 border-t border-neutral-200">
            <Link
              to={`/projects/${project.id}`}
              className="group/btn w-full inline-flex items-center justify-between px-6 py-3.5 bg-transparent border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white font-mono text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-xs font-medium rounded-none"
            >
              <span>{isTr ? 'PROJEYİ İNCELE' : 'EXPLORE PROJECT'}</span>
              <span className="transition-transform duration-300 group-hover/btn:translate-x-1.5 font-bold">
                →
              </span>
            </Link>
          </div>
        </BentoSpotlightCard>
      </div>
    </section>
  )
}

/**
 * Modular Asymmetric Bento Grid Card (Light Aesthetic & Sharp Geometry)
 */
const BentoGridItem: React.FC<{
  project: Project
  colSpanClass: string
}> = ({project, colSpanClass}) => {
  const {t} = useTranslation()

  const dateVal =
    typeof project.date === 'string'
      ? project.date
      : toPlainText(project.date ? t(project.date as never) : '')
  const year = typeof dateVal === 'string' ? dateVal.match(/\d{4}/)?.[0] || dateVal : ''
  const projObj = project as unknown as Record<string, unknown>
  const location = toPlainText(projObj['location'] ? t(projObj['location'] as never) : '')
  const category = toPlainText(project.projectCategory ? t(project.projectCategory) : '')
  const excerpt = toPlainText(project.excerpt ? t(project.excerpt as never) : '')
  const title = toPlainText(t(project.title))

  const coverUrl = typeof project.cover === 'string' ? project.cover : project.cover?.url || ''

  return (
    <motion.div
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-40px'}}
      transition={{duration: 0.6, ease: [0.16, 1, 0.3, 1]}}
      className={colSpanClass}
    >
      <BentoSpotlightCard className="h-full flex flex-col justify-between p-3 sm:p-3.5 bg-white">
        <Link
          to={`/projects/${project.id}`}
          className="group/card flex flex-col h-full justify-between space-y-3.5"
        >
          {/* Visual Container (Uniform Height across all cards) */}
          <div className="relative w-full h-[260px] sm:h-[320px] md:h-[360px] overflow-hidden bg-neutral-100 border border-neutral-200/80">
            {coverUrl && (
              <OptimizedImage
                src={coverUrl}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                quality={88}
                loading="lazy"
              />
            )}

            {/* Subtle Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-40 pointer-events-none" />

            {/* Top Right Year Stamp (Modern Typography, No Background, Pure White Text) */}
            {year && (
              <div className="absolute top-3.5 right-3.5 z-20 pointer-events-none">
                <span className="text-white text-xs sm:text-sm font-michroma font-light tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {year}
                </span>
              </div>
            )}
          </div>

          {/* Metadata & Typography */}
          <div className="p-1 space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
              {category && <span>{category}</span>}
              {category && location && <span>•</span>}
              {location && <span>{location}</span>}
            </div>

            <h3 className="text-xl sm:text-2xl font-light font-michroma uppercase text-neutral-900 tracking-tight leading-snug truncate group-hover/card:opacity-75 transition-opacity">
              {title}
            </h3>

            {excerpt && (
              <p className="text-xs text-neutral-600 font-light line-clamp-2 leading-relaxed">
                {excerpt}
              </p>
            )}

            <div className="pt-2.5 border-t border-neutral-200 flex items-center justify-between text-[11px] font-mono text-neutral-500 group-hover/card:text-neutral-900 transition-colors">
              <span className="tracking-[0.15em] uppercase">İNCELE</span>
              <span className="font-bold transition-transform duration-300 group-hover/card:translate-x-1">
                →
              </span>
            </div>
          </div>
        </Link>
      </BentoSpotlightCard>
    </motion.div>
  )
}

/**
 * Editorial Lookbook Full-Width Spread Card (Unified Direction & Zero Radius)
 */
const EditorialLookbookCard: React.FC<{
  project: Project
}> = ({project}) => {
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'

  const title = toPlainText(t(project.title))
  const category = toPlainText(project.projectCategory ? t(project.projectCategory) : '')
  const projObj = project as unknown as Record<string, unknown>
  const location = toPlainText(projObj['location'] ? t(projObj['location'] as never) : '')
  const dateVal =
    typeof project.date === 'string'
      ? project.date
      : toPlainText(project.date ? t(project.date as never) : '')
  const year = typeof dateVal === 'string' ? dateVal.match(/\d{4}/)?.[0] || dateVal : ''
  const excerpt = toPlainText(project.excerpt ? t(project.excerpt as never) : '')

  const mediaList: string[] = []
  if (project.cover) {
    if (typeof project.cover === 'string') mediaList.push(project.cover)
    else if (project.cover.url) mediaList.push(project.cover.url)
  }
  if (project.media) {
    project.media.forEach(m => {
      if (m.url && !mediaList.includes(m.url)) mediaList.push(m.url)
    })
  }

  return (
    <motion.article
      initial={{opacity: 0, y: 25}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-60px'}}
      transition={{duration: 0.7, ease: [0.16, 1, 0.3, 1]}}
      className="border border-neutral-200 bg-white p-5 sm:p-8 lg:p-10 mb-8 rounded-none shadow-xs hover:border-neutral-900 transition-colors"
    >
      {/* Unified direction for all projects: Left (7 Cols Visual) - Right (5 Cols Specs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Visual Spread Stage (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="relative aspect-[16/10] bg-neutral-100 border border-neutral-200 overflow-hidden group">
            <Link to={`/projects/${project.id}`} className="block w-full h-full">
              {mediaList[0] && (
                <OptimizedImage
                  src={mediaList[0]}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-104"
                  quality={90}
                  loading="lazy"
                />
              )}
            </Link>

            {/* Top Right Year Stamp (Modern Typography, No Background, Pure White Text) */}
            {year && (
              <div className="absolute top-4 right-4 z-20 pointer-events-none">
                <span className="text-white text-sm sm:text-base font-michroma font-light tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {year}
                </span>
              </div>
            )}
          </div>

          {/* Mini Gallery Strip */}
          {mediaList.length > 1 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {mediaList.slice(1, 4).map((url, i) => (
                <Link
                  key={url || i}
                  to={`/projects/${project.id}`}
                  className="aspect-[16/10] bg-neutral-100 border border-neutral-200 overflow-hidden hover:opacity-80 transition-opacity rounded-none"
                >
                  <OptimizedImage
                    src={url}
                    alt={`${title} sub-frame ${i + 1}`}
                    className="w-full h-full object-cover"
                    quality={65}
                    loading="lazy"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Technical Specification & Narrative Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-200 pb-3">
              {category && <span>{category}</span>}
              {category && year && <span>•</span>}
              {year && <span>{year}</span>}
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light font-michroma uppercase text-neutral-900 tracking-tight leading-tight">
              <Link to={`/projects/${project.id}`} className="hover:opacity-75 transition-opacity">
                {title}
              </Link>
            </h3>

            {location && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 border border-neutral-200 text-neutral-700 font-mono text-[11px] uppercase tracking-wider">
                <span>📍</span>
                <span>{location}</span>
              </div>
            )}

            {excerpt && (
              <p className="text-sm text-neutral-600 font-light leading-relaxed">{excerpt}</p>
            )}
          </div>

          <div className="pt-6 border-t border-neutral-200">
            <Link
              to={`/projects/${project.id}`}
              className="group/btn w-full inline-flex items-center justify-between px-6 py-3.5 bg-transparent border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white font-mono text-xs uppercase tracking-[0.2em] transition-all duration-300 rounded-none shadow-xs font-medium"
            >
              <span>{isTr ? 'PROJEYİ İNCELE' : 'VIEW CASE STUDY'}</span>
              <span className="transition-transform duration-300 group-hover/btn:translate-x-1.5 font-bold">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

/**
 * Projects V3 - Kinetic Spatial Bento (Clean Light Architectural Palette & Sharp Geometry)
 */
export const ProjectsV3VerticalView: React.FC<ProjectsV3VerticalViewProps> = ({projects}) => {
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [viewMode, setViewMode] = useState<ViewMode>('bento')
  const [sortOrder, setSortOrder] = useState<SortOrder>('default')

  // Extract distinct categories (without counts)
  const categories = useMemo(() => {
    const catSet = new Set<string>()

    projects.forEach(p => {
      if (p.projectCategory) {
        const catStr = toPlainText(t(p.projectCategory))
        if (catStr) catSet.add(catStr)
      }
    })

    return ['all', ...Array.from(catSet)]
  }, [projects, t])

  // Filter & Sort projects
  const filteredProjects = useMemo(() => {
    const list = projects.filter(p => {
      const matchCat =
        selectedCategory === 'all' ||
        (p.projectCategory && toPlainText(t(p.projectCategory)) === selectedCategory)

      if (!matchCat) return false

      if (!searchQuery.trim()) return true

      const q = searchQuery.toLowerCase().trim()
      const titleStr = toPlainText(t(p.title)).toLowerCase()
      const projObj = p as unknown as Record<string, unknown>
      const locStr = toPlainText(
        projObj['location'] ? t(projObj['location'] as never) : ''
      ).toLowerCase()
      const catStr = toPlainText(p.projectCategory ? t(p.projectCategory) : '').toLowerCase()

      return titleStr.includes(q) || locStr.includes(q) || catStr.includes(q)
    })

    if (sortOrder === 'alphabetical') {
      return [...list].sort((a, b) =>
        toPlainText(t(a.title)).localeCompare(toPlainText(t(b.title)))
      )
    }

    if (sortOrder === 'newest' || sortOrder === 'oldest') {
      return [...list].sort((a, b) => {
        const dateA =
          typeof a.date === 'string' ? a.date : toPlainText(a.date ? t(a.date as never) : '')
        const dateB =
          typeof b.date === 'string' ? b.date : toPlainText(b.date ? t(b.date as never) : '')
        const yearA = parseInt(dateA.match(/\d{4}/)?.[0] || '0', 10)
        const yearB = parseInt(dateB.match(/\d{4}/)?.[0] || '0', 10)
        return sortOrder === 'newest' ? yearB - yearA : yearA - yearB
      })
    }

    return list
  }, [projects, selectedCategory, searchQuery, sortOrder, t])

  const heroProject = filteredProjects[0]
  const gridProjects = filteredProjects.slice(1)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-neutral-900 overflow-x-hidden pt-20 md:pt-20 lg:pt-20 pb-24 selection:bg-neutral-900 selection:text-white">
      {/* Top Breadcrumb */}
      <div className="relative z-20 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4 text-gray-400">
        <Breadcrumbs
          items={[{label: t('homepage'), to: '/'}, {label: t('projects') || 'Projeler'}]}
        />
      </div>

      {/* Header & Minimalist Architectural Filter Hub */}
      <header className="relative z-10 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-2 pb-6">
        <motion.div
          initial={{opacity: 0, y: 15}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.7, ease: [0.16, 1, 0.3, 1]}}
          className="text-center mb-6"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-neutral-900 tracking-tight uppercase font-michroma">
            {t('projects') || 'Projeler'}
          </h1>
        </motion.div>

        {/* Clean, Sharp & Architectural Filter Strip */}
        <div className="border-y border-neutral-200 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Sharp Category Text Tabs (No Counts) */}
          <div className="flex items-center gap-5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {categories.map(cat => {
              const isActive = selectedCategory === cat
              const label = cat === 'all' ? (isTr ? 'TÜMÜ' : 'ALL') : cat.toUpperCase()

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-mono tracking-[0.2em] uppercase transition-all duration-300 whitespace-nowrap relative py-1.5 cursor-pointer rounded-none ${
                    isActive
                      ? 'text-neutral-900 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  <span>{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeBentoV3Tab"
                      transition={{type: 'spring', stiffness: 350, damping: 25}}
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900"
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Right Controls: View Switcher, Sort, Search */}
          <div className="flex flex-wrap items-center gap-4">
            {/* View Mode Switcher (Bento / Editorial) */}
            <div className="flex items-center border border-neutral-300 bg-white p-0.5 rounded-none">
              <button
                type="button"
                onClick={() => setViewMode('bento')}
                className={`px-3 py-1 text-[10px] font-mono tracking-wider uppercase transition-colors cursor-pointer rounded-none ${
                  viewMode === 'bento'
                    ? 'bg-neutral-900 text-white font-medium'
                    : 'text-neutral-600 hover:text-black'
                }`}
                title="Bento Grid"
              >
                ▦ {isTr ? 'BENTO' : 'BENTO'}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('editorial')}
                className={`px-3 py-1 text-[10px] font-mono tracking-wider uppercase transition-colors cursor-pointer rounded-none ${
                  viewMode === 'editorial'
                    ? 'bg-neutral-900 text-white font-medium'
                    : 'text-neutral-600 hover:text-black'
                }`}
                title="Editorial Lookbook"
              >
                ▤ {isTr ? 'DERGİ' : 'LOOKBOOK'}
              </button>
            </div>

            {/* Sort Selector */}
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
              className="bg-transparent border-b border-neutral-300 text-[10px] font-mono uppercase text-neutral-800 py-1.5 px-1 focus:outline-none focus:border-neutral-900 transition-colors rounded-none cursor-pointer"
            >
              <option value="default">{isTr ? 'SIRALAMA: VARSAYILAN' : 'SORT: DEFAULT'}</option>
              <option value="newest">{isTr ? 'YIL: EN YENİ' : 'YEAR: NEWEST'}</option>
              <option value="oldest">{isTr ? 'YIL: EN ESKİ' : 'YEAR: OLDEST'}</option>
              <option value="alphabetical">{isTr ? 'A - Z' : 'A - Z'}</option>
            </select>

            {/* Minimalist Borderless Search Input with Clean Modern Icon */}
            <div className="relative flex items-center min-w-[170px] sm:min-w-[200px] border-b border-neutral-300 focus-within:border-neutral-900 transition-colors py-1">
              <svg
                className="w-3.5 h-3.5 text-neutral-500 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isTr ? 'Projelerde ara...' : 'Search cases...'}
                className="w-full bg-transparent text-xs font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none rounded-none py-0.5"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-sm font-mono text-neutral-400 hover:text-neutral-900 cursor-pointer ml-1"
                  aria-label="Aramayı temizle"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Exhibition Stage */}
      <main className="relative z-10 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
        {filteredProjects.length > 0 ? (
          <div>
            {/* VIEW MODE 1: ASYMMETRIC BENTO GRID */}
            {viewMode === 'bento' && (
              <div>
                {/* 1. Hero Master Bento Hub */}
                {heroProject && <HeroBentoSection project={heroProject} />}

                {/* 2. Modular Asymmetric Bento Grid */}
                {gridProjects.length > 0 && (
                  <div className="grid grid-cols-12 gap-4 sm:gap-5 items-stretch">
                    {gridProjects.map((project, idx) => {
                      const isLastSingle =
                        idx === gridProjects.length - 1 && gridProjects.length % 2 === 1
                      const isWide = isLastSingle || idx % 4 === 0 || idx % 4 === 3
                      const colSpanClass = isLastSingle
                        ? 'col-span-12'
                        : isWide
                          ? 'col-span-12 lg:col-span-7'
                          : 'col-span-12 lg:col-span-5'

                      return (
                        <BentoGridItem
                          key={project.id}
                          project={project}
                          colSpanClass={colSpanClass}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW MODE 2: EDITORIAL LOOKBOOK (UNIFIED DIRECTION) */}
            {viewMode === 'editorial' && (
              <div className="space-y-6">
                {filteredProjects.map(project => (
                  <EditorialLookbookCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-24 text-center space-y-4 border border-dashed border-neutral-300 p-8 bg-white">
            <p className="text-neutral-500 font-mono text-xs tracking-widest uppercase">
              {isTr ? 'EŞLEŞEN MİMARİ PROJE BULUNAMADI' : 'NO ARCHITECTURAL PROJECTS FOUND'}
            </p>
            <p className="text-sm font-light text-neutral-400 max-w-md mx-auto">
              {isTr
                ? 'Aradığınız kriterlere uygun bir mimari proje bulunamadı.'
                : 'No architectural cases match the selected query.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all')
                setSearchQuery('')
                setSortOrder('default')
              }}
              className="mt-2 inline-block px-5 py-2.5 bg-transparent border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white font-mono text-xs uppercase tracking-[0.2em] rounded-none transition-colors cursor-pointer"
            >
              {isTr ? 'FİLTRELERİ SIFIRLA' : 'RESET FILTERS'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
