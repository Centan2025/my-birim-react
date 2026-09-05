import React, {useState, useMemo, useRef, useEffect} from 'react'
import {Link} from 'react-router-dom'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
  useScroll,
} from 'framer-motion'
import type {Project} from '../../types'
import {OptimizedImage} from '../OptimizedImage'
import {Breadcrumbs} from '../Breadcrumbs'
import {useTranslation} from '../../i18n'
import {toPlainText} from '../../utils/portableText'

interface ProjectsV3VerticalViewProps {
  projects: Project[]
}

type ViewMode = 'stack' | 'runway' | 'matrix'
type SortOrder = 'default' | 'newest' | 'oldest' | 'alphabetical'

/**
 * Precision Architectural Crosshair Mark (+)
 */
const CrosshairMark: React.FC<{
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  className?: string
}> = ({position, className = ''}) => {
  const posClasses = {
    'top-left': '-top-2 -left-2',
    'top-right': '-top-2 -right-2',
    'bottom-left': '-bottom-2 -left-2',
    'bottom-right': '-bottom-2 -right-2',
  }[position]

  return (
    <span
      className={`absolute ${posClasses} z-20 pointer-events-none font-mono text-xs text-neutral-400 select-none ${className}`}
      aria-hidden="true"
    >
      +
    </span>
  )
}

/**
 * AWWWARDS SCROLL RULER & ELEVATION TELEMETRY (Tüm sayfada başından sonuna aktif)
 */
const ArchitecturalScrollRuler: React.FC<{
  totalProjects: number
}> = ({totalProjects}) => {
  const {scrollYProgress} = useScroll()
  const smoothProgress = useSpring(scrollYProgress, {stiffness: 300, damping: 30})

  const [percent, setPercent] = useState(0)
  const [activeProjectNum, setActiveProjectNum] = useState(1)

  useEffect(() => {
    return smoothProgress.on('change', latest => {
      const p = Math.round(latest * 100)
      setPercent(p)
      const current = Math.min(totalProjects, Math.max(1, Math.ceil(latest * totalProjects)))
      setActiveProjectNum(current)
    })
  }, [smoothProgress, totalProjects])

  const markerTop = useTransform(smoothProgress, [0, 1], ['0%', '88%'])

  const scrollToTop = () => {
    window.scrollTo({top: 0, behavior: 'smooth'})
  }

  return (
    <div className="fixed right-3 sm:right-6 top-24 bottom-20 z-40 hidden md:flex flex-col items-end pointer-events-none select-none">
      <div className="relative h-full w-10 flex flex-col justify-between items-end border-r border-neutral-300 dark:border-neutral-800 pr-1.5 text-[9px] font-mono text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span>00%</span>
          <span className="w-2.5 h-px bg-neutral-400" />
        </div>
        <div className="flex items-center gap-1.5">
          <span>25%</span>
          <span className="w-1.5 h-px bg-neutral-300" />
        </div>
        <div className="flex items-center gap-1.5">
          <span>50%</span>
          <span className="w-2.5 h-px bg-neutral-400" />
        </div>
        <div className="flex items-center gap-1.5">
          <span>75%</span>
          <span className="w-1.5 h-px bg-neutral-300" />
        </div>
        <div className="flex items-center gap-1.5">
          <span>100%</span>
          <span className="w-2.5 h-px bg-neutral-400" />
        </div>

        {/* Scroll ile Senkronize Canlı Gösterge Kartuşu */}
        <motion.div
          style={{top: markerTop}}
          className="absolute right-0 translate-x-[1px] flex items-center gap-2 pointer-events-auto cursor-pointer group"
          onClick={scrollToTop}
          title="Başa Dön"
        >
          <div className="bg-neutral-950 text-white px-2.5 py-1.5 border border-white/20 shadow-2xl flex flex-col items-end gap-0.5 whitespace-nowrap transition-transform duration-200 group-hover:-translate-x-1.5">
            <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-neutral-200">
              <span className="w-1.5 h-1.5 bg-white animate-pulse" />
              <span>ELV: {String(percent).padStart(2, '0')}%</span>
            </div>
            <div className="font-mono text-[8px] tracking-wider text-neutral-400">
              CASE: [{String(activeProjectNum).padStart(2, '0')}/
              {String(totalProjects).padStart(2, '0')}]
            </div>
          </div>
          <span className="w-3.5 h-0.5 bg-neutral-900 dark:bg-white" />
        </motion.div>
      </div>
    </div>
  )
}

/**
 * 1. AWWWARDS SCROLL STACKING MONOLITH CARD
 * Her kart ekranda sticky sabitlenir; kullanıcı scroll ettikçe bir sonraki kart üstüne biner
 * ve önceki kart hafifçe geriye doğru küçülüp kararır (Curtain Stacking Effect)
 */
const StackingMonolithCard: React.FC<{
  project: Project
  index: number
  total: number
}> = ({project, index, total}) => {
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'
  const cardRef = useRef<HTMLDivElement>(null)

  // Bu kartın sayfa içindeki scroll durumunu takip et
  const {scrollYProgress} = useScroll({
    target: cardRef,
    offset: ['start end', 'start start'],
  })

  // Bir sonraki kart bunun üstüne binerken bu kartın geriye çekilmesi için scroll offset
  const {scrollYProgress: exitProgress} = useScroll({
    target: cardRef,
    offset: ['start start', 'end start'],
  })

  // Scroll girdisiyle ölçek ve parlaklık değişimi (Awwwards Stacking)
  const scale = useTransform(exitProgress, [0, 1], [1, 0.92])
  const opacity = useTransform(exitProgress, [0, 0.85, 1], [1, 0.5, 0.2])
  const imageParallaxY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  const title = toPlainText(t(project.title))
  const category = project.projectCategory ? toPlainText(t(project.projectCategory)) : ''
  const pObj = project as unknown as Record<string, unknown>
  const location = toPlainText(pObj['location'] ? t(pObj['location'] as never) : '')
  const pDate =
    typeof project.date === 'string'
      ? project.date
      : toPlainText(project.date ? t(project.date as never) : '')
  const year = typeof pDate === 'string' ? pDate.match(/\d{4}/)?.[0] || pDate : ''
  const excerpt = project.excerpt ? toPlainText(t(project.excerpt as never)) : ''
  const coverUrl = typeof project.cover === 'string' ? project.cover : project.cover?.url || ''

  return (
    <div
      ref={cardRef}
      className="relative min-h-[92vh] sm:min-h-[88vh] sticky top-24 sm:top-28 mb-12 sm:mb-20 last:mb-0"
    >
      <motion.div
        style={{scale, opacity}}
        className="w-full h-full bg-white border border-neutral-300 dark:border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.12)] relative overflow-hidden"
      >
        <CrosshairMark position="top-left" />
        <CrosshairMark position="top-right" />
        <CrosshairMark position="bottom-left" />
        <CrosshairMark position="bottom-right" />

        {/* Kart İçi Grid: Sol Metin & Telemetri / Sağ Devasa Görsel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 h-full min-h-[540px] sm:min-h-[620px] lg:min-h-[700px] items-stretch">
          {/* Sol Kolon: Mimari Künye & Devasa Tipografi (6 Kolon) */}
          <div className="lg:col-span-6 p-6 sm:p-10 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-neutral-200">
            {/* Üst Mimari Aks Strip */}
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-xs text-neutral-500 uppercase tracking-widest pb-4 border-b border-neutral-200">
                <div className="flex items-center gap-2 font-semibold text-neutral-900">
                  <span className="w-2 h-2 bg-neutral-900 inline-block" />
                  <span>
                    CASE [{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}]
                  </span>
                </div>
                <span>{year || '2024'}</span>
              </div>

              {category && (
                <div className="text-xs font-mono tracking-[0.25em] text-neutral-400 uppercase">
                  TYPOLOGY // {category}
                </div>
              )}

              {/* Devasa Brutalist Başlık */}
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-light font-michroma uppercase text-neutral-900 tracking-tight leading-[1.08] pt-2">
                <Link
                  to={`/projects/${project.id}`}
                  className="hover:opacity-80 transition-opacity"
                >
                  {title}
                </Link>
              </h2>

              {excerpt && (
                <p className="text-xs sm:text-sm font-light text-neutral-600 leading-relaxed font-mono pt-4 line-clamp-3 max-w-lg">
                  {excerpt}
                </p>
              )}
            </div>

            {/* Alt Mimari Detaylar & Aksiyon */}
            <div className="pt-8 mt-6 border-t border-neutral-200 space-y-6">
              <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase tracking-widest">
                    LOKASYON
                  </span>
                  <span className="text-neutral-900 font-medium block mt-1">
                    {location || 'İSTANBUL, TR'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase tracking-widest">
                    DURUM
                  </span>
                  <span className="text-neutral-900 font-medium block mt-1">TAMAMLANDI</span>
                </div>
              </div>

              <Link
                to={`/projects/${project.id}`}
                className="w-full inline-flex items-center justify-between px-6 py-4 bg-neutral-900 text-white hover:bg-neutral-800 font-mono text-xs uppercase tracking-[0.25em] transition-all rounded-none font-semibold shadow-md group"
              >
                <span>{isTr ? 'PROJEYİ DETAYLI İNCELE' : 'EXPLORE CASE STUDY'}</span>
                <span className="transition-transform duration-300 group-hover:translate-x-2 font-bold">
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Sağ Kolon: Tam Boy Sinematik Görsel Sahnesi (6 Kolon) */}
          <div className="lg:col-span-6 relative overflow-hidden bg-neutral-950 min-h-[360px] sm:min-h-[460px] lg:min-h-full">
            <Link to={`/projects/${project.id}`} className="block w-full h-full relative group">
              {coverUrl && (
                <motion.div
                  style={{y: imageParallaxY}}
                  className="absolute -inset-y-12 inset-x-0 w-full h-[120%]"
                >
                  <OptimizedImage
                    src={coverUrl}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    quality={92}
                    loading={index < 2 ? 'eager' : 'lazy'}
                  />
                </motion.div>
              )}

              {/* Gradient & Telemetri Katmanı */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

              {/* Görsel İçi Canlı Etiket */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white font-mono text-xs z-10 pointer-events-none">
                <span className="px-3 py-1 bg-black/60 backdrop-blur-sm border border-white/20 uppercase tracking-widest text-[10px]">
                  VIEWPORT // {String(index + 1).padStart(2, '0')}
                </span>
                <span className="tracking-widest uppercase text-[10px] text-white/80">
                  CLICK TO VIEW ↗
                </span>
              </div>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/**
 * 2. KINETIC MOMENTUM RUNWAY (Hıza Duyarlı Yatay Skew)
 */
const KineticRunwaySlider: React.FC<{
  projects: Project[]
}> = ({projects}) => {
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'
  const runwayRef = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const xVelocity = useVelocity(x)
  const skewX = useTransform(xVelocity, [-1500, 1500], [-10, 10])

  return (
    <div className="relative w-full overflow-hidden py-4">
      <div className="flex items-center justify-between pb-4 font-mono text-xs text-neutral-500 uppercase tracking-widest border-b border-neutral-200 mb-6">
        <span>← {isTr ? 'SÜRÜKLE VEYA KAYDIR' : 'DRAG TO NAVIGATE'} →</span>
        <span>VELOCITY SKEW // 60FPS</span>
      </div>

      <div className="cursor-grab active:cursor-grabbing overflow-hidden">
        <motion.div
          ref={runwayRef}
          drag="x"
          dragConstraints={{
            right: 0,
            left: -(
              projects.length * 440 -
              (typeof window !== 'undefined' ? window.innerWidth : 1200) +
              100
            ),
          }}
          style={{x, skewX}}
          className="flex gap-6 sm:gap-8 will-change-transform py-2"
        >
          {projects.map((project, idx) => {
            const title = toPlainText(t(project.title))
            const category = project.projectCategory ? toPlainText(t(project.projectCategory)) : ''
            const pObj = project as unknown as Record<string, unknown>
            const location = toPlainText(pObj['location'] ? t(pObj['location'] as never) : '')
            const pDate =
              typeof project.date === 'string'
                ? project.date
                : toPlainText(project.date ? t(project.date as never) : '')
            const year = typeof pDate === 'string' ? pDate.match(/\d{4}/)?.[0] || pDate : ''
            const coverUrl =
              typeof project.cover === 'string' ? project.cover : project.cover?.url || ''

            return (
              <div
                key={project.id}
                className="w-[310px] sm:w-[380px] md:w-[440px] flex-shrink-0 select-none"
              >
                <Link
                  to={`/projects/${project.id}`}
                  className="group block bg-white border border-neutral-200 hover:border-neutral-900 transition-colors p-4 relative shadow-sm hover:shadow-xl"
                >
                  <CrosshairMark position="top-left" />
                  <CrosshairMark position="top-right" />
                  <CrosshairMark position="bottom-left" />
                  <CrosshairMark position="bottom-right" />

                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200 text-xs font-mono text-neutral-500 uppercase tracking-widest">
                    <span>PRJ-{String(idx + 1).padStart(2, '0')}</span>
                    <span>{year || '2024'}</span>
                  </div>

                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 border border-neutral-200 mt-3">
                    {coverUrl && (
                      <OptimizedImage
                        src={coverUrl}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                        quality={90}
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-30 group-hover:opacity-10 transition-opacity" />
                  </div>

                  <div className="pt-4 space-y-2">
                    <div className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                      {category || 'ARCHITECTURAL CASE'}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-light font-michroma uppercase text-neutral-900 tracking-tight leading-tight truncate">
                      {title}
                    </h3>
                    <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs font-mono text-neutral-500">
                      <span>{location || 'İSTANBUL, TR'}</span>
                      <span className="font-semibold text-neutral-900 group-hover:translate-x-1 transition-transform">
                        {isTr ? 'İNCELE ↗' : 'EXPLORE ↗'}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}

/**
 * 3. MONOLITHIC MATRIX (Asimetrik 12-col mimari grid)
 */
const MonolithicMatrixGrid: React.FC<{
  projects: Project[]
}> = ({projects}) => {
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'

  return (
    <div className="grid grid-cols-12 gap-6 sm:gap-8 items-stretch">
      {projects.map((project, idx) => {
        const title = toPlainText(t(project.title))
        const category = project.projectCategory ? toPlainText(t(project.projectCategory)) : ''
        const pObj = project as unknown as Record<string, unknown>
        const location = toPlainText(pObj['location'] ? t(pObj['location'] as never) : '')
        const pDate =
          typeof project.date === 'string'
            ? project.date
            : toPlainText(project.date ? t(project.date as never) : '')
        const year = typeof pDate === 'string' ? pDate.match(/\d{4}/)?.[0] || pDate : ''
        const excerpt = project.excerpt ? toPlainText(t(project.excerpt as never)) : ''
        const coverUrl =
          typeof project.cover === 'string' ? project.cover : project.cover?.url || ''

        const isFull = idx % 5 === 0
        const isWide = idx % 5 === 1 || idx % 5 === 4
        const colSpanClass = isFull
          ? 'col-span-12'
          : isWide
            ? 'col-span-12 lg:col-span-7'
            : 'col-span-12 lg:col-span-5'

        return (
          <motion.div
            key={project.id}
            initial={{opacity: 0, y: 30}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: '-50px'}}
            transition={{duration: 0.7, delay: (idx % 3) * 0.08, ease: [0.16, 1, 0.3, 1]}}
            className={colSpanClass}
          >
            <Link
              to={`/projects/${project.id}`}
              className="group flex flex-col justify-between h-full bg-white border border-neutral-200 hover:border-neutral-900 transition-all p-5 sm:p-6 relative shadow-xs hover:shadow-2xl"
            >
              <CrosshairMark position="top-left" />
              <CrosshairMark position="top-right" />
              <CrosshairMark position="bottom-left" />
              <CrosshairMark position="bottom-right" />

              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 text-xs font-mono text-neutral-500 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-neutral-900" />
                  <span>PRJ-{String(idx + 1).padStart(2, '0')}</span>
                  {category && (
                    <>
                      <span>/</span>
                      <span className="text-neutral-900 font-medium">{category}</span>
                    </>
                  )}
                </div>
                <span>{year || '2024'}</span>
              </div>

              <div
                className={`relative w-full overflow-hidden bg-neutral-100 border border-neutral-200 my-4 ${
                  isFull
                    ? 'aspect-[21/9] min-h-[320px] sm:min-h-[440px]'
                    : isWide
                      ? 'aspect-[16/10] min-h-[280px] sm:min-h-[350px]'
                      : 'aspect-[4/3] min-h-[260px] sm:min-h-[300px]'
                }`}
              >
                {coverUrl && (
                  <OptimizedImage
                    src={coverUrl}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-106"
                    quality={90}
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-30 group-hover:opacity-10 transition-opacity" />
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-light font-michroma uppercase text-neutral-900 tracking-tight leading-tight group-hover:opacity-80 transition-opacity">
                  {title}
                </h3>

                {excerpt && (
                  <p className="text-xs text-neutral-600 font-light leading-relaxed line-clamp-2">
                    {excerpt}
                  </p>
                )}

                <div className="pt-4 border-t border-neutral-200 flex items-center justify-between text-xs font-mono text-neutral-500">
                  <span className="tracking-wider">{location || 'İSTANBUL, TR'}</span>
                  <span className="font-semibold text-neutral-900 group-hover:translate-x-1.5 transition-transform">
                    {isTr ? 'PROJEYİ AÇ ↗' : 'VIEW CASE ↗'}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}

/**
 * Projects V3 - Awwwards Architectural Edition (Master Component)
 */
export const ProjectsV3VerticalView: React.FC<ProjectsV3VerticalViewProps> = ({projects}) => {
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [viewMode, setViewMode] = useState<ViewMode>('stack')
  const [sortOrder, setSortOrder] = useState<SortOrder>('default')
  const [liveTime, setLiveTime] = useState<string>('')

  // Scroll Progress & Velocity
  const {scrollY, scrollYProgress} = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothProgress = useSpring(scrollYProgress, {stiffness: 280, damping: 28})
  const [currentSpeed, setCurrentSpeed] = useState('0')

  useEffect(() => {
    return scrollVelocity.on('change', latest => {
      const spd = Math.abs(Math.round(latest))
      setCurrentSpeed(spd > 10 ? `${spd} PX/S` : 'IDLE')
    })
  }, [scrollVelocity])

  // Live Architectural Telemetry Clock (UTC / Istanbul)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      setLiveTime(timeStr)
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Extract distinct categories
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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-neutral-900 overflow-x-hidden pt-20 md:pt-20 lg:pt-20 pb-32 selection:bg-neutral-900 selection:text-white relative">
      {/* 1. TÜM SAYFA BOYUNCA AKTİF SCROLL TELEMETRİ CETVELİ */}
      <ArchitecturalScrollRuler totalProjects={filteredProjects.length} />

      {/* Top Breadcrumb */}
      <div className="relative z-20 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4 text-gray-400">
        <Breadcrumbs
          items={[{label: t('homepage'), to: '/'}, {label: t('projects') || 'Projeler'}]}
        />
      </div>

      {/* Awwwards Architectural Header & Telemetry Strip */}
      <header className="relative z-10 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-2 pb-6">
        {/* Canlı Mimari Telemetri Barı */}
        <div className="flex flex-wrap items-center justify-between py-2.5 border-b border-neutral-200 text-[11px] font-mono text-neutral-500 uppercase tracking-widest gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full bg-neutral-900 opacity-75" />
              <span className="relative inline-flex h-2 w-2 bg-neutral-900" />
            </span>
            <span>INDEX ARCHIVES // BIRIM STUDIO</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <span className="hidden sm:inline">LAT: 41.0082° N / LONG: 28.9784° E</span>
            <span>IST: {liveTime || '12:00:00'}</span>
            <span className="hidden lg:inline">VELOCITY: {currentSpeed}</span>
            <span>
              TOPLAM: <strong className="text-neutral-900 font-semibold">{projects.length}</strong>
            </span>
          </div>
        </div>

        {/* Ana Tipografik Sahne: Masked Reveal Animasyonu */}
        <div className="pt-8 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="overflow-hidden">
              <motion.span
                initial={{y: '100%'}}
                animate={{y: '0%'}}
                transition={{duration: 0.6, ease: [0.16, 1, 0.3, 1]}}
                className="text-xs font-mono tracking-[0.3em] uppercase text-neutral-500 block mb-2"
              >
                CURATED ARCHITECTURAL ARCHIVES
              </motion.span>
            </div>
            <div className="overflow-hidden">
              <motion.h1
                initial={{y: '100%'}}
                animate={{y: '0%'}}
                transition={{duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1]}}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-neutral-900 tracking-tight uppercase font-michroma"
              >
                {t('projects') || 'Projeler'}
              </motion.h1>
            </div>
          </div>

          <div className="overflow-hidden max-w-md">
            <motion.p
              initial={{y: '100%'}}
              animate={{y: '0%'}}
              transition={{duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1]}}
              className="text-xs sm:text-sm font-light text-neutral-600 leading-relaxed font-mono"
            >
              {isTr
                ? 'Mekân ve mobilya arasındaki mimari diyaloğu şekillendiren seçkin projeler ve referans uygulamalar.'
                : 'Curated architectural projects and bespoke interior applications defining the dialogue between space and form.'}
            </motion.p>
          </div>
        </div>

        {/* Sticky Mimari Kumanda & Filtre Kontrol Barı */}
        <div className="sticky top-20 z-30 border-y border-neutral-200 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md relative">
          {/* Scroll İlerleme Çizgisi */}
          <motion.div
            style={{scaleX: smoothProgress, transformOrigin: 'left'}}
            className="absolute -top-px left-0 right-0 h-[2px] bg-neutral-900"
          />

          {/* Kategori Filtre Butonları */}
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {categories.map(cat => {
              const isActive = selectedCategory === cat
              const label = cat === 'all' ? (isTr ? 'TÜMÜ' : 'ALL') : cat.toUpperCase()

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-mono tracking-[0.2em] uppercase transition-all duration-200 whitespace-nowrap relative py-1.5 cursor-pointer rounded-none ${
                    isActive
                      ? 'text-neutral-900 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  <span>{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeAwwwardsTab"
                      transition={{type: 'spring', stiffness: 380, damping: 28}}
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900"
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Sağ Kumandalar: 3'lü Görünüm Modu, Sıralama, Arama */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* 3 Görünüm Modu Switcher */}
            <div className="flex items-center border border-neutral-300 bg-white p-0.5 rounded-none shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('stack')}
                className={`px-3 py-1 text-[10px] font-mono tracking-wider uppercase transition-colors cursor-pointer rounded-none ${
                  viewMode === 'stack'
                    ? 'bg-neutral-900 text-white font-semibold'
                    : 'text-neutral-600 hover:text-black'
                }`}
                title="Scroll Stacking Monoliths"
              >
                ▼ {isTr ? 'KATMAN' : 'STACK'}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('runway')}
                className={`px-3 py-1 text-[10px] font-mono tracking-wider uppercase transition-colors cursor-pointer rounded-none ${
                  viewMode === 'runway'
                    ? 'bg-neutral-900 text-white font-semibold'
                    : 'text-neutral-600 hover:text-black'
                }`}
                title="Kinetic Momentum Runway"
              >
                ⇄ {isTr ? 'RUNWAY' : 'RUNWAY'}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1 text-[10px] font-mono tracking-wider uppercase transition-colors cursor-pointer rounded-none ${
                  viewMode === 'matrix'
                    ? 'bg-neutral-900 text-white font-semibold'
                    : 'text-neutral-600 hover:text-black'
                }`}
                title="Monolithic 3D Matrix"
              >
                ▦ {isTr ? 'MATRIX' : 'MATRIX'}
              </button>
            </div>

            {/* Sıralama */}
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
              className="bg-transparent border-b border-neutral-300 text-[10px] font-mono uppercase text-neutral-800 py-1 px-1 focus:outline-none focus:border-neutral-900 transition-colors rounded-none cursor-pointer"
            >
              <option value="default">{isTr ? 'SIRALAMA: VARSAYILAN' : 'SORT: DEFAULT'}</option>
              <option value="newest">{isTr ? 'YIL: EN YENİ' : 'YEAR: NEWEST'}</option>
              <option value="oldest">{isTr ? 'YIL: EN ESKİ' : 'YEAR: OLDEST'}</option>
              <option value="alphabetical">{isTr ? 'A - Z' : 'A - Z'}</option>
            </select>

            {/* Arama Barı */}
            <div className="relative flex items-center min-w-[160px] sm:min-w-[190px] border-b border-neutral-300 focus-within:border-neutral-900 transition-colors py-0.5">
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
                placeholder={isTr ? 'Filtrele...' : 'Filter...'}
                className="w-full bg-transparent text-xs font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none rounded-none py-0.5"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-sm font-mono text-neutral-400 hover:text-neutral-900 cursor-pointer ml-1"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Exhibition Stage */}
      <main className="relative z-10 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-6">
        {filteredProjects.length > 0 ? (
          <div>
            {/* VIEW MODE 1 (DEFAULT): FULL-PAGE SCROLL STACKING MONOLITHS */}
            {viewMode === 'stack' && (
              <div className="relative">
                {filteredProjects.map((project, idx) => (
                  <StackingMonolithCard
                    key={project.id}
                    project={project}
                    index={idx}
                    total={filteredProjects.length}
                  />
                ))}
              </div>
            )}

            {/* VIEW MODE 2: KINETIC MOMENTUM RUNWAY */}
            {viewMode === 'runway' && <KineticRunwaySlider projects={filteredProjects} />}

            {/* VIEW MODE 3: MONOLITHIC MATRIX */}
            {viewMode === 'matrix' && <MonolithicMatrixGrid projects={filteredProjects} />}
          </div>
        ) : (
          <div className="py-24 text-center space-y-4 border border-dashed border-neutral-300 p-8 bg-white">
            <p className="text-neutral-500 font-mono text-xs tracking-widest uppercase">
              {isTr ? 'EŞLEŞEN MİMARİ PROJE BULUNAMADI' : 'NO ARCHITECTURAL PROJECTS FOUND'}
            </p>
            <p className="text-sm font-light text-neutral-400 max-w-md mx-auto font-mono">
              {isTr
                ? 'Seçilen arama kriterlerine uygun proje kaydı bulunamadı.'
                : 'No architectural cases match the selected query.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all')
                setSearchQuery('')
                setSortOrder('default')
              }}
              className="mt-2 inline-block px-5 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 font-mono text-xs uppercase tracking-[0.2em] rounded-none transition-colors cursor-pointer"
            >
              {isTr ? 'FİLTRELERİ SIFIRLA' : 'RESET FILTERS'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
