import React, {useState, useMemo, useCallback} from 'react'
import {Link} from 'react-router-dom'
import {motion, AnimatePresence} from 'framer-motion'
import type {Project} from '../../types'
import {OptimizedImage} from '../OptimizedImage'
import {Breadcrumbs} from '../Breadcrumbs'
import ScrollReveal from '../ScrollReveal'
import {useTranslation} from '../../i18n'

interface ProjectsV3VerticalViewProps {
  projects: Project[]
}

type ViewLayoutMode = 'editorial' | 'index'

/**
 * Individual Multi-Angle Interactive Gallery Frame
 */
const ProjectMediaFrame: React.FC<{
  project: Project
  aspectRatioClass?: string
  priority?: boolean
}> = ({project, aspectRatioClass = 'aspect-[16/10]', priority = false}) => {
  const {t} = useTranslation()
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0)

  // Collect all available valid image media items
  const mediaList = useMemo(() => {
    const list: {
      url: string
      urlMobile?: string
      urlDesktop?: string
      crop?: unknown
      hotspot?: unknown
    }[] = []

    if (project.cover) {
      if (typeof project.cover === 'string') {
        list.push({url: project.cover})
      } else if (project.cover.url) {
        list.push({
          url: project.cover.url,
          urlMobile: project.cover.urlMobile,
          urlDesktop: project.cover.urlDesktop,
          crop: project.cover.crop,
          hotspot: project.cover.hotspot,
        })
      }
    }

    if (project.media && project.media.length > 0) {
      project.media.forEach(m => {
        if (m.url && (!list[0] || list[0].url !== m.url)) {
          list.push({
            url: m.url,
            urlMobile: m.urlMobile,
            urlDesktop: m.urlDesktop,
            crop: m.crop,
            hotspot: m.hotspot,
          })
        }
      })
    }

    return list
  }, [project.cover, project.media])

  const activeMedia = mediaList[activeMediaIndex] || mediaList[0]

  return (
    <div
      className={`group/frame relative w-full ${aspectRatioClass} overflow-hidden bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800`}
    >
      {/* Active Photo */}
      <AnimatePresence mode="wait">
        {activeMedia && (
          <motion.div
            key={activeMedia.url}
            initial={{opacity: 0, scale: 1.04}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.5, ease: 'easeOut'}}
            className="absolute inset-0 w-full h-full"
          >
            <OptimizedImage
              src={activeMedia.url}
              srcMobile={activeMedia.urlMobile}
              srcDesktop={activeMedia.urlDesktop}
              alt={t(project.title)}
              className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover/frame:scale-105"
              loading={priority ? 'eager' : 'lazy'}
              quality={92}
              crop={activeMedia.crop as never}
              hotspot={activeMedia.hotspot as never}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Architectural Lens Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-60 group-hover/frame:opacity-40 transition-opacity duration-500 pointer-events-none" />

      {/* Multi-angle Mini Navigation Bar (If project has >1 photos) */}
      {mediaList.length > 1 && (
        <div
          className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1.5 border border-white/20"
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onKeyDown={e => e.stopPropagation()}
          role="toolbar"
          tabIndex={0}
        >
          <span className="text-[10px] font-mono tracking-widest text-neutral-300 mr-1.5">
            {String(activeMediaIndex + 1).padStart(2, '0')}/{String(mediaList.length).padStart(2, '0')}
          </span>
          {mediaList.slice(0, 5).map((item, idx) => (
            <button
              key={item.url}
              type="button"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                setActiveMediaIndex(idx)
              }}
              className={`h-1.5 transition-all duration-300 ${
                activeMediaIndex === idx
                  ? 'w-5 bg-white'
                  : 'w-2 bg-white/40 hover:bg-white/80'
              }`}
              title={`Fotoğraf ${idx + 1}`}
              aria-label={`Fotoğraf ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Architectural Corner Crosshairs */}
      <div className="absolute top-3 left-3 text-[10px] font-mono text-white/50 pointer-events-none opacity-0 group-hover/frame:opacity-100 transition-opacity duration-300">
        +
      </div>
      <div className="absolute top-3 right-3 text-[10px] font-mono text-white/50 pointer-events-none opacity-0 group-hover/frame:opacity-100 transition-opacity duration-300">
        +
      </div>
      <div className="absolute bottom-3 right-3 text-[10px] font-mono text-white/50 pointer-events-none opacity-0 group-hover/frame:opacity-100 transition-opacity duration-300">
        +
      </div>
    </div>
  )
}

/**
 * Projects V3 Vertical Monograph & Spatial Editorial Component
 */
export const ProjectsV3VerticalView: React.FC<ProjectsV3VerticalViewProps> = ({projects}) => {
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [layoutMode, setLayoutMode] = useState<ViewLayoutMode>('editorial')
  const [hoveredIndexProject, setHoveredIndexProject] = useState<Project | null>(null)

  // Extract distinct categories with counts
  const {categories, categoryCounts} = useMemo(() => {
    const counts: Record<string, number> = {all: projects.length}
    const catSet = new Set<string>()

    projects.forEach(p => {
      if (p.projectCategory) {
        const catStr = t(p.projectCategory)
        if (catStr) {
          catSet.add(catStr)
          counts[catStr] = (counts[catStr] || 0) + 1
        }
      }
    })

    return {
      categories: ['all', ...Array.from(catSet)],
      categoryCounts: counts,
    }
  }, [projects, t])

  // Filter projects by category and search query
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchCat =
        selectedCategory === 'all' ||
        (p.projectCategory && t(p.projectCategory) === selectedCategory)

      if (!matchCat) return false

      if (!searchQuery.trim()) return true

      const q = searchQuery.toLowerCase().trim()
      const titleStr = t(p.title)?.toLowerCase() || ''
      const projObj = p as unknown as Record<string, unknown>
      const locStr = projObj['location'] ? (t(projObj['location'] as never) || '').toLowerCase() : ''
      const catStr = p.projectCategory ? (t(p.projectCategory) || '').toLowerCase() : ''

      return titleStr.includes(q) || locStr.includes(q) || catStr.includes(q)
    })
  }, [projects, selectedCategory, searchQuery, t])

  // Helper to extract clean year and location
  const getProjectMeta = useCallback(
    (project: Project) => {
      const dateVal =
        typeof project.date === 'string' ? project.date : t(project.date as never)
      const year =
        typeof dateVal === 'string' ? dateVal.match(/\d{4}/)?.[0] || dateVal : ''
      const projObj = project as unknown as Record<string, unknown>
      const location = projObj['location'] ? t(projObj['location'] as never) : ''
      const category = project.projectCategory ? t(project.projectCategory) : ''
      const excerpt = project.excerpt ? t(project.excerpt as never) : ''

      return {year, location, category, excerpt}
    },
    [t]
  )

  const previewProject = hoveredIndexProject || filteredProjects[0]

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-x-hidden pt-20 md:pt-24 pb-36 selection:bg-neutral-900 selection:text-white">
      {/* 1. ARCHITECTURAL TOP BREADCRUMB */}
      <div className="relative z-20 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[85vw] mx-auto px-4 md:px-8 lg:px-0 py-4 text-neutral-400">
        <Breadcrumbs
          items={[{label: t('homepage'), to: '/'}, {label: t('projects') || 'Projeler'}]}
        />
      </div>

      {/* 2. GRAND ARCHITECTURAL HEADER & CONTROL STRIP */}
      <header className="relative z-10 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[85vw] mx-auto px-4 md:px-8 lg:px-0 pt-6 pb-10 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          {/* Main Title Block */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-[1.5px] bg-neutral-900 dark:bg-white" />
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-neutral-500 dark:text-neutral-400">
                {isTr ? 'MİMARİ & MEKANSAL PORTFOLYO' : 'SPATIAL & ARCHITECTURAL ARCHIVE'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.2rem] font-light font-michroma tracking-tight text-[var(--text-primary)] uppercase leading-[1.05]">
              {t('projects') || 'Projeler'}
            </h1>
          </div>

          {/* Quick Stats & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-mono tracking-widest text-neutral-500">
            {/* Project Counter */}
            <div className="border-l-2 border-neutral-900 dark:border-white pl-4 py-1">
              <span className="text-neutral-900 dark:text-white font-bold text-xl font-michroma mr-2">
                {String(filteredProjects.length).padStart(2, '0')}
              </span>
              <span className="text-[11px] uppercase">
                {isTr ? 'KAYITLI PROJE' : 'TOTAL CASES'}
              </span>
            </div>

            {/* Layout Mode Switcher (Editorial vs Matrix Index) */}
            <div className="flex items-center border border-neutral-300 dark:border-neutral-700 p-0.5">
              <button
                type="button"
                onClick={() => setLayoutMode('editorial')}
                className={`px-3 py-1.5 text-[11px] uppercase transition-all duration-200 flex items-center gap-1.5 ${
                  layoutMode === 'editorial'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title={isTr ? 'Görsel Editöryel Akış' : 'Editorial View'}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <span>{isTr ? 'EDİTÖRYEL' : 'EDITORIAL'}</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('index')}
                className={`px-3 py-1.5 text-[11px] uppercase transition-all duration-200 flex items-center gap-1.5 ${
                  layoutMode === 'index'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title={isTr ? 'Katalog / İndeks Tablosu' : 'Index Table'}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>{isTr ? 'İNDEKS' : 'INDEX'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Matrix & Search Toolbar */}
        <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Badges */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map(cat => {
              const isCatActive = selectedCategory === cat
              const label = cat === 'all' ? (isTr ? 'TÜM PROJELER' : 'ALL WORKS') : cat.toUpperCase()
              const count = categoryCounts[cat] || 0

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 px-3.5 py-2 text-[11px] font-mono tracking-wider uppercase transition-all duration-200 border flex items-center gap-2 ${
                    isCatActive
                      ? 'bg-neutral-950 text-white border-neutral-950 dark:bg-white dark:text-neutral-950 dark:border-white font-medium shadow-sm'
                      : 'bg-transparent text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-none font-mono ${
                      isCatActive
                        ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Quick Search Box */}
          <div className="relative min-w-[220px] max-w-xs w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isTr ? 'PROJE ARA...' : 'SEARCH CASES...'}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3.5 py-2 pl-9 text-xs font-mono tracking-wider text-[var(--text-primary)] placeholder-neutral-400 focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
            />
            <svg
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. MAIN VERTICAL BODY */}
      <main className="relative z-10 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[85vw] mx-auto px-4 md:px-8 lg:px-0 pt-12 md:pt-16">
        {filteredProjects.length === 0 ? (
          <div className="py-28 text-center border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 p-12">
            <p className="text-neutral-500 font-mono text-xs tracking-widest uppercase">
              {isTr
                ? 'Aradığınız kriterlere uygun proje bulunamadı.'
                : 'No projects matched your criteria.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all')
                setSearchQuery('')
              }}
              className="mt-4 inline-block text-xs font-mono tracking-wider uppercase text-neutral-900 dark:text-white underline underline-offset-4"
            >
              {isTr ? 'Filtreleri Temizle' : 'Reset Filters'}
            </button>
          </div>
        ) : layoutMode === 'editorial' ? (
          /* =========================================================================
             LAYOUT MODE 1: ASYMMETRIC ARCHITECTURAL EDITORIAL CADENCE
             ========================================================================= */
          <div className="space-y-24 md:space-y-36">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => {
                const {year, location, category, excerpt} = getProjectMeta(project)
                const isHeroFeature = index === 0 && selectedCategory === 'all' && !searchQuery
                const isEven = index % 2 === 0
                const formattedIndex = String(index + 1).padStart(2, '0')

                /* -------------------------------------------------------------------
                   A) HERO MASTERWORK BANNER (First Project)
                   ------------------------------------------------------------------- */
                if (isHeroFeature) {
                  return (
                    <motion.article
                      key={project.id}
                      initial={{opacity: 0, y: 35}}
                      whileInView={{opacity: 1, y: 0}}
                      viewport={{once: true, margin: '-50px'}}
                      transition={{duration: 0.8, ease: 'easeOut'}}
                      className="relative w-full"
                    >
                      <Link
                        to={`/projects/${project.id}`}
                        className="group block relative w-full overflow-hidden bg-neutral-950 border border-neutral-800 hover:border-white transition-all duration-700 shadow-2xl"
                      >
                        {/* Interactive Media Container */}
                        <div className="relative aspect-[16/10] sm:aspect-[16/9] md:aspect-[21/9] w-full">
                          <ProjectMediaFrame
                            project={project}
                            aspectRatioClass="aspect-[16/10] sm:aspect-[16/9] md:aspect-[21/9]"
                            priority
                          />

                          {/* Hero Metadata Gradient Plate */}
                          <div className="absolute inset-x-0 bottom-0 p-6 md:p-12 z-20 flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-t from-black/95 via-black/50 to-transparent">
                            <div className="space-y-3 flex-1 min-w-0 text-white">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="px-2.5 py-1 bg-white text-black font-mono text-[10px] font-bold tracking-widest uppercase">
                                  {isTr ? 'ÖNE ÇIKAN PROJE' : 'FEATURED CASE'}
                                </span>
                                <span className="text-xs font-mono tracking-widest text-neutral-300">
                                  #{formattedIndex}
                                </span>
                                {year && (
                                  <>
                                    <span className="text-neutral-500">/</span>
                                    <span className="text-xs font-mono tracking-widest text-neutral-300">
                                      {year}
                                    </span>
                                  </>
                                )}
                                {category && (
                                  <>
                                    <span className="text-neutral-500">/</span>
                                    <span className="text-xs font-mono tracking-widest text-neutral-300 uppercase">
                                      {category}
                                    </span>
                                  </>
                                )}
                                {location && (
                                  <>
                                    <span className="text-neutral-500">/</span>
                                    <span className="text-xs font-mono tracking-widest text-neutral-300 uppercase">
                                      {location}
                                    </span>
                                  </>
                                )}
                              </div>

                              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-light font-michroma tracking-tight text-white uppercase group-hover:text-neutral-200 transition-colors truncate">
                                {t(project.title)}
                              </h2>

                              {excerpt && (
                                <p className="text-sm font-light text-neutral-300 max-w-3xl line-clamp-2 hidden sm:block">
                                  {excerpt}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs font-mono tracking-widest uppercase text-white bg-black/80 backdrop-blur-md px-6 py-3.5 border border-white/30 group-hover:bg-white group-hover:text-black transition-all flex-shrink-0">
                              <span>{isTr ? 'PROJEYİ KEŞFET' : 'EXPLORE PROJECT'}</span>
                              <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                                →
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  )
                }

                /* -------------------------------------------------------------------
                   B) ASYMMETRIC SPLIT LOOKBOOK ROWS
                   ------------------------------------------------------------------- */
                return (
                  <motion.article
                    key={project.id}
                    initial={{opacity: 0, y: 40}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true, margin: '-60px'}}
                    transition={{duration: 0.8, ease: 'easeOut'}}
                    className="relative"
                  >
                    <div
                      className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center ${
                        !isEven ? 'lg:flex-row-reverse' : ''
                      }`}
                    >
                      {/* Architectural Info Plate (5 Columns) */}
                      <div
                        className={`lg:col-span-5 space-y-6 ${
                          !isEven ? 'lg:order-2 lg:pl-4' : 'lg:order-1 lg:pr-4'
                        }`}
                      >
                        {/* Monospace Code & Coordinates */}
                        <div className="flex items-center gap-3 text-xs font-mono tracking-widest text-neutral-500">
                          <span className="text-lg font-bold text-[var(--text-primary)] font-michroma">
                            {formattedIndex}
                          </span>
                          <span className="w-8 h-[1px] bg-neutral-300 dark:bg-neutral-700" />
                          <span>{year || '2024'}</span>
                          {category && (
                            <>
                              <span className="text-neutral-300 dark:text-neutral-700">/</span>
                              <span className="text-neutral-700 dark:text-neutral-300 uppercase font-medium">
                                {category}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-light font-michroma tracking-tight text-[var(--text-primary)] uppercase leading-[1.15]">
                          <Link
                            to={`/projects/${project.id}`}
                            className="hover:opacity-75 transition-opacity"
                          >
                            {t(project.title)}
                          </Link>
                        </h2>

                        {/* Location Spec & Excerpt Narrative */}
                        <div className="space-y-4 text-neutral-600 dark:text-neutral-400 font-light text-sm leading-relaxed">
                          {location && (
                            <div className="flex items-center gap-2 font-mono text-xs uppercase text-neutral-800 dark:text-neutral-200">
                              <span className="w-1.5 h-1.5 bg-neutral-900 dark:bg-white inline-block" />
                              <span>{location}</span>
                            </div>
                          )}
                          {excerpt && typeof excerpt === 'string' && (
                            <p className="line-clamp-3 text-neutral-600 dark:text-neutral-400 font-light">
                              {excerpt}
                            </p>
                          )}
                        </div>

                        {/* Architectural Spec Badges Strip */}
                        <div className="pt-2 flex flex-wrap items-center gap-4">
                          <Link
                            to={`/projects/${project.id}`}
                            className="group/btn inline-flex items-center gap-3 px-6 py-3 border border-neutral-900 dark:border-white bg-transparent text-xs font-mono tracking-widest uppercase text-neutral-900 dark:text-white hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300 shadow-sm"
                          >
                            <span>{isTr ? 'DETAYLI İNCELE' : 'VIEW CASE'}</span>
                            <svg
                              className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                              />
                            </svg>
                          </Link>

                          {project.media && project.media.length > 0 && (
                            <span className="text-[11px] font-mono text-neutral-400">
                              [{project.media.length} {isTr ? 'GÖRSEL' : 'ASSETS'}]
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Interactive Media Frame (7 Columns) */}
                      <div
                        className={`lg:col-span-7 ${!isEven ? 'lg:order-1' : 'lg:order-2'}`}
                      >
                        <ScrollReveal delay={80}>
                          <Link
                            to={`/projects/${project.id}`}
                            className="group/card block relative shadow-xl hover:shadow-2xl transition-all duration-500"
                          >
                            <ProjectMediaFrame
                              project={project}
                              aspectRatioClass="aspect-[16/10]"
                            />

                            {/* Floating Stamp */}
                            <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-black/75 backdrop-blur-md border border-white/20 text-[10px] font-mono tracking-widest text-white uppercase opacity-0 group-hover/card:opacity-100 transition-opacity">
                              BIRIM / {year || 'ARCH'}
                            </div>
                          </Link>
                        </ScrollReveal>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* =========================================================================
             LAYOUT MODE 2: ARCHITECTURAL INDEX & MATRIX DIRECTORY
             ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Index List (8 cols) */}
            <div className="lg:col-span-8 border-t border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredProjects.map((project, index) => {
                const {year, location, category} = getProjectMeta(project)
                const formattedIndex = String(index + 1).padStart(2, '0')
                const isHovered = hoveredIndexProject?.id === project.id

                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    onMouseEnter={() => setHoveredIndexProject(project)}
                    className={`group block py-5 md:py-6 px-3 transition-colors ${
                      isHovered
                        ? 'bg-neutral-100/80 dark:bg-neutral-900/60'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-baseline gap-4 sm:gap-6 min-w-0">
                        <span className="text-xs font-mono font-bold text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white">
                          #{formattedIndex}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg md:text-xl font-michroma uppercase text-[var(--text-primary)] group-hover:translate-x-1 transition-transform truncate">
                            {t(project.title)}
                          </h3>
                          <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500 mt-1">
                            {category && <span className="uppercase">{category}</span>}
                            {location && (
                              <>
                                <span>•</span>
                                <span className="uppercase">{location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 text-xs font-mono text-neutral-400">
                        <span>{year || '2024'}</span>
                        <span className="w-8 h-8 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Sticky Preview Plate (4 cols on Desktop) */}
            <div className="hidden lg:block lg:col-span-4 sticky top-28">
              <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 p-4 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-400 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <span>{isTr ? 'HIZLI ÖNİZLEME' : 'QUICK PREVIEW'}</span>
                  <span>{previewProject ? t(previewProject.title) : ''}</span>
                </div>

                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-950">
                  {previewProject && (
                    <ProjectMediaFrame
                      project={previewProject}
                      aspectRatioClass="aspect-[4/3]"
                    />
                  )}
                </div>

                {previewProject && (
                  <div className="space-y-2 pt-1 text-xs font-mono">
                    <p className="text-[var(--text-primary)] font-michroma uppercase truncate">
                      {t(previewProject.title)}
                    </p>
                    <p className="text-neutral-500 text-[11px] line-clamp-2">
                      {t(previewProject.excerpt as never) ||
                        (isTr ? 'Birim mimari referans projesi.' : 'Birim architectural showcase project.')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
