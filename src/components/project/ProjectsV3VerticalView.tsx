import React, {useState, useMemo, useRef, useCallback, useEffect} from 'react'
import {Link} from 'react-router-dom'
import {motion, AnimatePresence, useMotionValue, useSpring} from 'framer-motion'
import type {Project} from '../../types'
import {OptimizedImage} from '../OptimizedImage'
import {Breadcrumbs} from '../Breadcrumbs'
import {useTranslation} from '../../i18n'
import {toPlainText} from '../../utils/portableText'
import {
  Grid,
  List,
  LayoutGrid,
  Search,
  X,
  MapPin,
  ArrowUpRight,
  Eye,
  Sparkles,
  ChevronRight,
  Layers,
  Building2,
  FolderOpen,
} from 'lucide-react'

interface ProjectsV3VerticalViewProps {
  projects: Project[]
}

type ViewMode = 'cinematic' | 'bento' | 'directory'
type SortOrder = 'default' | 'newest' | 'oldest' | 'alphabetical'

/**
 * Interactive Mouse-driven Spotlight Container with Spring Physics
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
      className={`group relative overflow-hidden rounded-none border border-neutral-200/90 bg-white shadow-xs transition-all duration-500 hover:border-neutral-900 hover:shadow-lg ${className}`}
    >
      {/* Dynamic Radial Spotlight Highlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${smoothX}px ${smoothY}px, rgba(0,0,0,0.04), transparent 80%)`,
        }}
      />
      {children}
    </motion.div>
  )
}

/**
 * Quick Inspection Modal (Lightroom Telemetry Drawer)
 */
const QuickPreviewModal: React.FC<{
  project: Project | null
  onClose: () => void
}> = ({project, onClose}) => {
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'
  const [activeIdx, setActiveIdx] = useState<number>(0)

  useEffect(() => {
    setActiveIdx(0)
  }, [project])

  if (!project) return null

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

  const currentMedia = mediaList[activeIdx] || mediaList[0]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
        {/* Backdrop */}
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{opacity: 0, scale: 0.95, y: 20}}
          animate={{opacity: 1, scale: 1, y: 0}}
          exit={{opacity: 0, scale: 0.95, y: 20}}
          transition={{duration: 0.4, ease: [0.16, 1, 0.3, 1]}}
          className="relative z-10 w-full max-w-5xl bg-white border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <div className="flex items-center gap-3">
              <span className="inline-block w-2 h-2 rounded-full bg-neutral-900 animate-pulse" />
              <span className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
                {isTr ? 'HIZLI İNCELEME' : 'QUICK INSPECT'} • {year || '2024'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors rounded-none"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
            {/* Left Image Viewport */}
            <div className="lg:col-span-7 bg-neutral-950 p-4 sm:p-6 flex flex-col justify-between min-h-[340px] sm:min-h-[420px]">
              <div className="relative w-full h-full min-h-[300px] sm:min-h-[360px] overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {currentMedia && (
                    <motion.div
                      key={currentMedia}
                      initial={{opacity: 0, scale: 1.03}}
                      animate={{opacity: 1, scale: 1}}
                      exit={{opacity: 0}}
                      transition={{duration: 0.3}}
                      className="w-full h-full"
                    >
                      <OptimizedImage
                        src={currentMedia}
                        alt={title}
                        className="w-full h-full object-contain max-h-[500px]"
                        quality={92}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Thumbnails Navigator */}
              {mediaList.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pt-4 scrollbar-none">
                  {mediaList.map((url, idx) => (
                    <button
                      key={url || idx}
                      onClick={() => setActiveIdx(idx)}
                      className={`relative w-16 h-12 flex-shrink-0 border transition-all ${
                        idx === activeIdx
                          ? 'border-white scale-105'
                          : 'border-white/20 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <OptimizedImage
                        src={url}
                        alt="thumb"
                        className="w-full h-full object-cover"
                        quality={50}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Dossier Panel */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-widest">
                  {category && <span>{category}</span>}
                  {category && location && <span>•</span>}
                  {location && <span>{location}</span>}
                </div>

                <h3 className="text-2xl sm:text-3xl font-light font-michroma uppercase text-neutral-900 tracking-tight leading-tight">
                  {title}
                </h3>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-neutral-200 text-xs font-mono">
                  <div className="p-3 bg-neutral-50 border border-neutral-200">
                    <span className="text-[10px] text-neutral-400 block uppercase tracking-widest">
                      LOKASYON
                    </span>
                    <span className="text-neutral-900 font-medium block mt-1 truncate">
                      {location || 'TR'}
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-50 border border-neutral-200">
                    <span className="text-[10px] text-neutral-400 block uppercase tracking-widest">
                      YIL
                    </span>
                    <span className="text-neutral-900 font-medium block mt-1">
                      {year || '2024'}
                    </span>
                  </div>
                </div>

                {excerpt && (
                  <p className="text-xs sm:text-sm text-neutral-600 font-light leading-relaxed">
                    {excerpt}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-200">
                <Link
                  to={`/projects/${project.id}`}
                  onClick={onClose}
                  className="w-full flex items-center justify-between px-6 py-3.5 bg-neutral-900 text-white font-mono text-xs uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors"
                >
                  <span>{isTr ? 'DETAYLI PROJE SAYFASI' : 'FULL CASE STUDY'}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

/**
 * Projects V3 - World-Class Architectural Showcase Component
 */
export const ProjectsV3VerticalView: React.FC<ProjectsV3VerticalViewProps> = ({projects}) => {
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [viewMode, setViewMode] = useState<ViewMode>('cinematic')
  const [sortOrder, setSortOrder] = useState<SortOrder>('default')
  const [previewProject, setPreviewProject] = useState<Project | null>(null)

  // Floating Cursor State for Directory Index View
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null)
  const cursorX = useMotionValue(-300)
  const cursorY = useMotionValue(-300)

  const smoothCursorX = useSpring(cursorX, {stiffness: 400, damping: 30})
  const smoothCursorY = useSpring(cursorY, {stiffness: 400, damping: 30})

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
    },
    [cursorX, cursorY]
  )

  // Categories Calculation
  const categories = useMemo(() => {
    const catMap = new Map<string, number>()
    catMap.set('all', projects.length)

    projects.forEach(p => {
      if (p.projectCategory) {
        const catStr = toPlainText(t(p.projectCategory))
        if (catStr) {
          catMap.set(catStr, (catMap.get(catStr) || 0) + 1)
        }
      }
    })

    return Array.from(catMap.entries()).map(([name, count]) => ({name, count}))
  }, [projects, t])

  // Filter & Sort Projects
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

  // Telemetry Aggregates
  const stats = useMemo(() => {
    const totalCount = projects.length
    const citiesSet = new Set<string>()
    projects.forEach(p => {
      const projObj = p as unknown as Record<string, unknown>
      const loc = toPlainText(projObj['location'] ? t(projObj['location'] as never) : '')
      if (loc) citiesSet.add(loc)
    })
    return {
      total: totalCount,
      cities: citiesSet.size || 12,
      scope: `${(totalCount * 1450).toLocaleString()} m²`,
    }
  }, [projects, t])

  const heroProject = filteredProjects[0]
  const secondaryProjects = filteredProjects.slice(1)

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[var(--bg-primary)] text-neutral-900 overflow-x-hidden pt-20 md:pt-20 lg:pt-20 pb-28 selection:bg-neutral-900 selection:text-white"
    >
      {/* Top Breadcrumb */}
      <div className="relative z-20 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4 text-gray-400">
        <Breadcrumbs
          items={[{label: t('homepage'), to: '/'}, {label: t('projects') || 'Projeler'}]}
        />
      </div>

      {/* Header & Architectural Telemetry Hero */}
      <header className="relative z-10 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-2 pb-8">
        {/* Title Badge & Heading */}
        <div className="text-center max-w-4xl mx-auto space-y-4 mb-8">
          <motion.div
            initial={{opacity: 0, y: 15}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6, ease: [0.16, 1, 0.3, 1]}}
            className="inline-flex items-center gap-2 px-3.5 py-1 bg-neutral-100 border border-neutral-200/90 text-neutral-700 font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em]"
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-900 animate-pulse" />
            <span>ARCHITECTURAL PORTFOLIO & CASE STUDIES</span>
          </motion.div>

          <motion.h1
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1]}}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-neutral-900 tracking-tight uppercase font-michroma leading-[1.08]"
          >
            {t('projects') || 'PROJELER'}
          </motion.h1>

          <motion.p
            initial={{opacity: 0, y: 15}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1]}}
            className="text-xs sm:text-sm md:text-base text-neutral-500 font-light max-w-2xl mx-auto leading-relaxed"
          >
            {isTr
              ? 'BİRİM imzalı mimari projeler, iç mekan koleksiyonları ve özel tasarım uygulamaları kataloğu.'
              : 'Architectural works, curated interiors, and bespoke design applications by BIRIM.'}
          </motion.p>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8 text-xs font-mono">
          <div className="p-4 bg-white border border-neutral-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-neutral-400 block uppercase tracking-widest">
                {isTr ? 'TOPLAM PROJE' : 'TOTAL CASES'}
              </span>
              <span className="text-xl sm:text-2xl font-light font-michroma text-neutral-900 block mt-1">
                {stats.total}
              </span>
            </div>
            <FolderOpen className="w-5 h-5 text-neutral-300" />
          </div>

          <div className="p-4 bg-white border border-neutral-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-neutral-400 block uppercase tracking-widest">
                {isTr ? 'LOKASYONLAR' : 'LOCATIONS'}
              </span>
              <span className="text-xl sm:text-2xl font-light font-michroma text-neutral-900 block mt-1">
                {stats.cities}
              </span>
            </div>
            <MapPin className="w-5 h-5 text-neutral-300" />
          </div>

          <div className="p-4 bg-white border border-neutral-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-neutral-400 block uppercase tracking-widest">
                {isTr ? 'MİMARİ ALAN' : 'SCOPE'}
              </span>
              <span className="text-base sm:text-lg font-light font-michroma text-neutral-900 block mt-1 truncate">
                {stats.scope}
              </span>
            </div>
            <Building2 className="w-5 h-5 text-neutral-300" />
          </div>

          <div className="p-4 bg-white border border-neutral-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-neutral-400 block uppercase tracking-widest">
                {isTr ? 'KATEGORİLER' : 'DISCIPLINES'}
              </span>
              <span className="text-xl sm:text-2xl font-light font-michroma text-neutral-900 block mt-1">
                {categories.length - 1}
              </span>
            </div>
            <Layers className="w-5 h-5 text-neutral-300" />
          </div>
        </div>

        {/* Filter Strip & Interactive Controls Hub */}
        <div className="bg-white border border-neutral-200 p-4 space-y-4 shadow-xs">
          {/* Category Tabs with Animated Pill Counter */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 md:pb-0">
            {categories.map(cat => {
              const isActive = selectedCategory === cat.name
              const label =
                cat.name === 'all'
                  ? isTr
                    ? 'TÜM PROJELER'
                    : 'ALL PROJECTS'
                  : cat.name.toUpperCase()

              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono tracking-wider uppercase transition-all duration-300 whitespace-nowrap border cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white border-neutral-900 font-semibold shadow-xs'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Controls Bar: Search, View Mode Switcher, Sort */}
          <div className="pt-3 border-t border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex items-center min-w-[240px] sm:min-w-[280px] border border-neutral-200 bg-neutral-50 px-3 py-1.5 focus-within:border-neutral-900 focus-within:bg-white transition-colors">
              <Search className="w-3.5 h-3.5 text-neutral-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  isTr ? 'Proje, şehir veya kategori ara...' : 'Search project or city...'
                }
                className="w-full bg-transparent text-xs font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-neutral-400 hover:text-neutral-900 cursor-pointer ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Switcher Buttons */}
              <div className="flex items-center border border-neutral-200 bg-neutral-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('cinematic')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    viewMode === 'cinematic'
                      ? 'bg-neutral-900 text-white font-medium shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Sinematik Sergi Görünümü"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isTr ? 'SİNEMATİK' : 'EXHIBITION'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('bento')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    viewMode === 'bento'
                      ? 'bg-neutral-900 text-white font-medium shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Bento Grid"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isTr ? 'BENTO' : 'BENTO'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('directory')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    viewMode === 'directory'
                      ? 'bg-neutral-900 text-white font-medium shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="İnteraktif İndeks Dizini"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isTr ? 'İNDEKS' : 'INDEX'}</span>
                </button>
              </div>

              {/* Sort Selector */}
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as SortOrder)}
                className="bg-neutral-50 border border-neutral-200 text-[11px] font-mono uppercase text-neutral-800 py-1.5 px-3 focus:outline-none focus:border-neutral-900 cursor-pointer"
              >
                <option value="default">{isTr ? 'SIRALAMA: VARSAYILAN' : 'SORT: DEFAULT'}</option>
                <option value="newest">{isTr ? 'YIL: EN YENİ' : 'YEAR: NEWEST'}</option>
                <option value="oldest">{isTr ? 'YIL: EN ESKİ' : 'YEAR: OLDEST'}</option>
                <option value="alphabetical">{isTr ? 'A - Z' : 'A - Z'}</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Exhibition Content */}
      <main className="relative z-10 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
        {filteredProjects.length > 0 ? (
          <div>
            {/* VIEW MODE 1: CINEMATIC EXHIBITION */}
            {viewMode === 'cinematic' && (
              <div className="space-y-8">
                {/* Hero Showcase Feature Card */}
                {heroProject && (
                  <BentoSpotlightCard className="p-4 sm:p-6 lg:p-8 bg-neutral-50/60">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                      {/* Left Photo Viewport */}
                      <div className="lg:col-span-7 flex flex-col justify-between min-h-[360px] sm:min-h-[440px]">
                        <div className="relative w-full h-full min-h-[340px] sm:min-h-[420px] overflow-hidden bg-neutral-900 border border-neutral-200 group/hero">
                          <Link to={`/projects/${heroProject.id}`} className="block w-full h-full">
                            <OptimizedImage
                              src={
                                typeof heroProject.cover === 'string'
                                  ? heroProject.cover
                                  : heroProject.cover?.url || ''
                              }
                              alt={toPlainText(t(heroProject.title))}
                              className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover/hero:scale-105"
                              quality={94}
                              loading="eager"
                              fetchPriority="high"
                            />
                          </Link>

                          {/* Top Year Stamp */}
                          <div className="absolute top-4 right-4 z-20 pointer-events-none">
                            <span className="text-white text-sm sm:text-base font-michroma font-light tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                              {typeof heroProject.date === 'string'
                                ? heroProject.date.match(/\d{4}/)?.[0] || '2024'
                                : '2024'}
                            </span>
                          </div>

                          {/* Quick Inspect Floating Action */}
                          <button
                            onClick={() => setPreviewProject(heroProject)}
                            className="absolute bottom-4 left-4 z-30 inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-950/80 hover:bg-neutral-950 text-white font-mono text-[10px] uppercase tracking-widest border border-white/20 backdrop-blur-md transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-white" />
                            <span>{isTr ? 'HIZLI GÖZ AT' : 'QUICK VIEW'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Right Telemetry & Story */}
                      <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-neutral-500 uppercase pb-3 border-b border-neutral-200">
                            <span>
                              {toPlainText(
                                heroProject.projectCategory ? t(heroProject.projectCategory) : ''
                              ) || 'ARCHITECTURAL'}
                            </span>
                          </div>

                          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light font-michroma uppercase text-neutral-900 tracking-tight leading-[1.1]">
                            <Link
                              to={`/projects/${heroProject.id}`}
                              className="hover:opacity-75 transition-opacity"
                            >
                              {toPlainText(t(heroProject.title))}
                            </Link>
                          </h2>

                          <div className="grid grid-cols-2 gap-3 py-3 border-y border-neutral-200 text-xs font-mono">
                            <div className="p-3 bg-white border border-neutral-200">
                              <span className="text-[10px] text-neutral-400 block uppercase tracking-widest">
                                LOKASYON
                              </span>
                              <span className="text-neutral-900 font-medium block mt-1 truncate">
                                {toPlainText(
                                  (heroProject as any)['location']
                                    ? t((heroProject as any)['location'])
                                    : ''
                                ) || 'İSTANBUL, TR'}
                              </span>
                            </div>

                            <div className="p-3 bg-white border border-neutral-200">
                              <span className="text-[10px] text-neutral-400 block uppercase tracking-widest">
                                STATUS
                              </span>
                              <span className="text-neutral-900 font-medium block mt-1">
                                {isTr ? 'TAMAMLANDI' : 'COMPLETED'}
                              </span>
                            </div>
                          </div>

                          {heroProject.excerpt && (
                            <p className="text-xs sm:text-sm text-neutral-600 font-light leading-relaxed line-clamp-4">
                              {toPlainText(t(heroProject.excerpt as never))}
                            </p>
                          )}
                        </div>

                        <div className="pt-4 border-t border-neutral-200 flex items-center gap-3">
                          <Link
                            to={`/projects/${heroProject.id}`}
                            className="flex-1 inline-flex items-center justify-between px-6 py-3.5 bg-neutral-900 text-white font-mono text-xs uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors"
                          >
                            <span>{isTr ? 'PROJEYİ İNCELE' : 'EXPLORE CASE'}</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </BentoSpotlightCard>
                )}

                {/* Secondary Exhibition Grid */}
                {secondaryProjects.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {secondaryProjects.map(project => {
                      const title = toPlainText(t(project.title))
                      const category = toPlainText(
                        project.projectCategory ? t(project.projectCategory) : ''
                      )
                      const projObj = project as unknown as Record<string, unknown>
                      const location = toPlainText(
                        projObj['location'] ? t(projObj['location'] as never) : ''
                      )
                      const coverUrl =
                        typeof project.cover === 'string' ? project.cover : project.cover?.url || ''

                      return (
                        <BentoSpotlightCard
                          key={project.id}
                          className="p-4 flex flex-col justify-between"
                        >
                          <div className="space-y-4">
                            <div className="relative w-full aspect-[16/11] bg-neutral-100 overflow-hidden border border-neutral-200 group/card">
                              {coverUrl && (
                                <OptimizedImage
                                  src={coverUrl}
                                  alt={title}
                                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                                  quality={85}
                                />
                              )}
                              <button
                                onClick={() => setPreviewProject(project)}
                                className="absolute top-3 right-3 z-20 p-2 bg-neutral-950/80 hover:bg-neutral-950 text-white border border-white/20 backdrop-blur-md opacity-0 group-hover/card:opacity-100 transition-opacity cursor-pointer"
                                title="Hızlı İncele"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                                {category && <span>{category}</span>}
                                {category && location && <span>•</span>}
                                {location && <span>{location}</span>}
                              </div>

                              <h3 className="text-xl font-light font-michroma uppercase text-neutral-900 tracking-tight leading-snug line-clamp-1">
                                <Link
                                  to={`/projects/${project.id}`}
                                  className="hover:opacity-75 transition-opacity"
                                >
                                  {title}
                                </Link>
                              </h3>
                            </div>
                          </div>

                          <div className="pt-4 mt-4 border-t border-neutral-200 flex items-center justify-between text-xs font-mono">
                            <Link
                              to={`/projects/${project.id}`}
                              className="text-neutral-900 hover:text-neutral-500 tracking-widest uppercase inline-flex items-center gap-1 font-medium"
                            >
                              <span>{isTr ? 'İNCELE' : 'VIEW'}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </BentoSpotlightCard>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW MODE 2: ASYMMETRIC BENTO GRID */}
            {viewMode === 'bento' && (
              <div className="grid grid-cols-12 gap-5">
                {filteredProjects.map((project, idx) => {
                  const isWide = idx % 3 === 0
                  const colSpanClass = isWide
                    ? 'col-span-12 lg:col-span-8'
                    : 'col-span-12 lg:col-span-4'

                  const title = toPlainText(t(project.title))
                  const category = toPlainText(
                    project.projectCategory ? t(project.projectCategory) : ''
                  )
                  const coverUrl =
                    typeof project.cover === 'string' ? project.cover : project.cover?.url || ''

                  return (
                    <div key={project.id} className={colSpanClass}>
                      <BentoSpotlightCard className="h-full p-4 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="relative w-full h-[280px] sm:h-[340px] bg-neutral-100 overflow-hidden border border-neutral-200 group/bento">
                            {coverUrl && (
                              <OptimizedImage
                                src={coverUrl}
                                alt={title}
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/bento:scale-105"
                                quality={88}
                              />
                            )}

                            <button
                              onClick={() => setPreviewProject(project)}
                              className="absolute bottom-3 right-3 z-20 p-2.5 bg-neutral-950/80 hover:bg-neutral-950 text-white border border-white/20 backdrop-blur-md opacity-0 group-hover/bento:opacity-100 transition-opacity cursor-pointer flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>PREVIEW</span>
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block">
                              {category || 'PROJECT'}
                            </span>
                            <h3 className="text-xl sm:text-2xl font-light font-michroma uppercase text-neutral-900 tracking-tight leading-snug">
                              <Link
                                to={`/projects/${project.id}`}
                                className="hover:opacity-75 transition-opacity"
                              >
                                {title}
                              </Link>
                            </h3>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-neutral-200 flex items-center justify-between text-xs font-mono">
                          <Link
                            to={`/projects/${project.id}`}
                            className="text-neutral-900 hover:opacity-70 tracking-widest uppercase font-medium inline-flex items-center gap-1"
                          >
                            <span>{isTr ? 'DETAYLAR' : 'EXPLORE'}</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </BentoSpotlightCard>
                    </div>
                  )
                })}
              </div>
            )}

            {/* VIEW MODE 3: INTERACTIVE DIRECTORY INDEX TABLE (AWWARDS CURSOR PREVIEW) */}
            {viewMode === 'directory' && (
              <div className="bg-white border border-neutral-200 overflow-hidden shadow-xs">
                {/* Floating Image Cursor Follower */}
                <AnimatePresence>
                  {hoveredProject && (
                    <motion.div
                      initial={{opacity: 0, scale: 0.8}}
                      animate={{opacity: 1, scale: 1}}
                      exit={{opacity: 0, scale: 0.8}}
                      transition={{duration: 0.2, ease: 'easeOut'}}
                      style={{
                        left: smoothCursorX,
                        top: smoothCursorY,
                      }}
                      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 h-44 sm:h-52 overflow-hidden border border-white shadow-2xl bg-neutral-950 hidden md:block"
                    >
                      <OptimizedImage
                        src={
                          typeof hoveredProject.cover === 'string'
                            ? hoveredProject.cover
                            : hoveredProject.cover?.url || ''
                        }
                        alt="Preview"
                        className="w-full h-full object-cover"
                        quality={80}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Directory Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 uppercase tracking-widest">
                        <th className="py-4 px-6 font-medium">#</th>
                        <th className="py-4 px-6 font-medium">
                          {isTr ? 'PROJE ADI' : 'PROJECT NAME'}
                        </th>
                        <th className="py-4 px-6 font-medium">
                          {isTr ? 'KATEGORİ' : 'DISCIPLINE'}
                        </th>
                        <th className="py-4 px-6 font-medium">{isTr ? 'LOKASYON' : 'LOCATION'}</th>
                        <th className="py-4 px-6 font-medium">{isTr ? 'YIL' : 'YEAR'}</th>
                        <th className="py-4 px-6 font-medium text-right">
                          {isTr ? 'AKSİYON' : 'ACTION'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredProjects.map((project, idx) => {
                        const title = toPlainText(t(project.title))
                        const category = toPlainText(
                          project.projectCategory ? t(project.projectCategory) : ''
                        )
                        const projObj = project as unknown as Record<string, unknown>
                        const location = toPlainText(
                          projObj['location'] ? t(projObj['location'] as never) : ''
                        )
                        const dateVal =
                          typeof project.date === 'string'
                            ? project.date
                            : toPlainText(project.date ? t(project.date as never) : '')
                        const year =
                          typeof dateVal === 'string'
                            ? dateVal.match(/\d{4}/)?.[0] || '2024'
                            : '2024'

                        return (
                          <tr
                            key={project.id}
                            onMouseEnter={() => setHoveredProject(project)}
                            onMouseLeave={() => setHoveredProject(null)}
                            className="group hover:bg-neutral-900 hover:text-white transition-colors duration-200 cursor-pointer"
                          >
                            <td className="py-5 px-6 opacity-40 font-mono text-[11px]">
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td className="py-5 px-6 font-michroma text-sm uppercase tracking-tight font-light">
                              <Link to={`/projects/${project.id}`} className="block w-full">
                                {title}
                              </Link>
                            </td>
                            <td className="py-5 px-6 opacity-70 tracking-wider">
                              {category || 'ARCHITECTURAL'}
                            </td>
                            <td className="py-5 px-6 opacity-70 tracking-wider">
                              {location || 'TR'}
                            </td>
                            <td className="py-5 px-6 opacity-70">{year}</td>
                            <td className="py-5 px-6 text-right">
                              <Link
                                to={`/projects/${project.id}`}
                                className="inline-flex items-center gap-1 underline underline-offset-4 group-hover:text-white"
                              >
                                <span>{isTr ? 'GÖRÜNTÜLE' : 'VIEW'}</span>
                                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
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

      {/* Quick Inspect Modal */}
      <QuickPreviewModal project={previewProject} onClose={() => setPreviewProject(null)} />
    </div>
  )
}
