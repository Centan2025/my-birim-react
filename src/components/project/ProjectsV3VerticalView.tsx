import React, {useState, useMemo} from 'react'
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

export const ProjectsV3VerticalView: React.FC<ProjectsV3VerticalViewProps> = ({projects}) => {
  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'

  // Extract distinct categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    projects.forEach(p => {
      if (p.projectCategory) {
        const catStr = t(p.projectCategory)
        if (catStr) cats.add(catStr)
      }
    })
    return ['all', ...Array.from(cats)]
  }, [projects, t])

  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'all') return projects
    return projects.filter(p => {
      if (!p.projectCategory) return false
      return t(p.projectCategory) === selectedCategory
    })
  }, [projects, selectedCategory, t])

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-x-hidden pt-20 md:pt-24 pb-36 selection:bg-black selection:text-white">
      {/* 1. TOP BREADCRUMB */}
      <div className="relative z-20 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[85vw] mx-auto px-4 md:px-8 lg:px-0 py-4 text-neutral-500">
        <Breadcrumbs
          items={[{label: t('homepage'), to: '/'}, {label: t('projects') || 'Projeler'}]}
        />
      </div>

      {/* 2. EDITORIAL HERO HEADER */}
      <header className="relative z-10 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[85vw] mx-auto px-4 md:px-8 lg:px-0 pt-6 pb-12 border-b border-neutral-200">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-[1px] bg-neutral-400" />
              <span className="text-xs font-mono tracking-widest uppercase text-neutral-500">
                {isTr ? 'MİMARİ PORTFOLYO' : 'ARCHITECTURAL PORTFOLIO'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-light font-michroma tracking-tight text-neutral-700 uppercase leading-none">
              {t('projects') || 'Projeler'}
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 text-xs font-mono tracking-widest text-neutral-500">
            <div className="border-l border-neutral-300 pl-4 py-1">
              <span className="text-neutral-900 font-semibold text-base font-michroma mr-2">
                {projects.length}
              </span>
              <span>{isTr ? 'REFERANS PROJE' : 'TOTAL CASES'}</span>
            </div>
            <p className="max-w-xs text-[11px] font-sans font-light leading-relaxed text-neutral-600 hidden md:block">
              {isTr
                ? 'Birim tasarım ve üretim vizyonunu yansıtan seçkin mimari referanslar.'
                : 'Selected architectural benchmarks articulating Birim craftsmanship and design vision.'}
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        {categories.length > 2 && (
          <div className="mt-8 flex items-center gap-2.5 overflow-x-auto no-scrollbar pt-2">
            {categories.map(cat => {
              const isCatActive = selectedCategory === cat
              const label = cat === 'all' ? (isTr ? 'TÜMÜ' : 'ALL') : cat.toUpperCase()
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative px-4 py-2 text-[11px] sm:text-xs font-mono tracking-wider uppercase transition-all duration-300 rounded-none cursor-pointer border ${
                    isCatActive
                      ? 'bg-[#18181b] text-white border-[#18181b] dark:bg-white dark:text-black dark:border-white font-medium shadow-sm'
                      : 'bg-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {isCatActive && (
                      <span className="w-1.5 h-1.5 bg-[#c5a059] rounded-full inline-block" />
                    )}
                    <span>{label}</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </header>

      {/* 3. MONOLITHIC VERTICAL LOOKBOOK STREAM */}
      <main className="relative z-10 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[85vw] mx-auto px-4 md:px-8 lg:px-0 pt-16">
        {filteredProjects.length > 0 ? (
          <div className="space-y-24 md:space-y-36">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => {
                const dateVal =
                  typeof project.date === 'string' ? project.date : t(project.date as never)
                const year =
                  typeof dateVal === 'string' ? dateVal.match(/\d{4}/)?.[0] || dateVal : ''
                const projObj = project as unknown as Record<string, unknown>
                const location = projObj['location'] ? t(projObj['location'] as never) : ''
                const category = project.projectCategory ? t(project.projectCategory) : ''
                const excerpt = project.excerpt ? t(project.excerpt as never) : ''

                const isEven = index % 2 === 0
                const isHeroFeature = index === 0 && selectedCategory === 'all'

                if (isHeroFeature) {
                  // Full-bleed Grand Monolith Card
                  return (
                    <motion.article
                      key={project.id}
                      initial={{opacity: 0, y: 40}}
                      whileInView={{opacity: 1, y: 0}}
                      viewport={{once: true, margin: '-50px'}}
                      transition={{duration: 0.8}}
                      className="relative w-full"
                    >
                      <Link
                        to={`/projects/${project.id}`}
                        className="group block relative w-full overflow-hidden bg-neutral-100 border border-neutral-300 hover:border-neutral-900 shadow-xl hover:shadow-2xl transition-all duration-700 rounded-none"
                      >
                        <div className="relative aspect-[16/10] md:aspect-[21/9] w-full overflow-hidden">
                          {project.cover && (
                            <OptimizedImage
                              src={
                                typeof project.cover === 'string'
                                  ? project.cover
                                  : project.cover?.url || ''
                              }
                              srcMobile={
                                typeof project.cover === 'object'
                                  ? project.cover.urlMobile
                                  : undefined
                              }
                              srcDesktop={
                                typeof project.cover === 'object'
                                  ? project.cover.urlDesktop
                                  : undefined
                              }
                              alt={t(project.title)}
                              className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                              loading="eager"
                              quality={92}
                              crop={
                                typeof project.cover === 'object' ? project.cover.crop : undefined
                              }
                              hotspot={
                                typeof project.cover === 'object'
                                  ? project.cover.hotspot
                                  : undefined
                              }
                            />
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                          {/* Hero Overlay Details */}
                          <div className="absolute inset-x-0 bottom-0 p-6 md:p-12 z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-3 flex-1 min-w-0 text-white">
                              <div className="flex items-center gap-3">
                                <span className="px-2.5 py-1 bg-white text-black font-mono text-[10px] font-bold tracking-widest uppercase rounded-none">
                                  FEATURED CASE
                                </span>
                                {year && (
                                  <span className="text-xs font-mono tracking-widest text-neutral-200">
                                    {year}
                                  </span>
                                )}
                                {category && (
                                  <>
                                    <span className="text-neutral-400">/</span>
                                    <span className="text-xs font-mono tracking-widest text-neutral-200 uppercase">
                                      {category}
                                    </span>
                                  </>
                                )}
                              </div>
                              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[2.25rem] xl:text-4xl font-light font-michroma tracking-tight text-white uppercase group-hover:text-neutral-200 transition-colors whitespace-nowrap truncate">
                                {t(project.title)}
                              </h2>
                            </div>

                            <div className="flex items-center gap-3 text-xs font-mono tracking-widest uppercase text-white bg-black/60 backdrop-blur-md px-5 py-3 border border-white/30 group-hover:bg-white group-hover:text-black transition-all flex-shrink-0 rounded-none">
                              <span>{isTr ? 'PROJEYİ İNCELE' : 'EXPLORE CASE'}</span>
                              <span className="transition-transform duration-300 group-hover:translate-x-1">
                                →
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  )
                }

                // Split Lookbook Row (Alternating White Editorial Style)
                return (
                  <motion.article
                    key={project.id}
                    initial={{opacity: 0, y: 40}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true, margin: '-60px'}}
                    transition={{duration: 0.8}}
                    className="relative"
                  >
                    <div
                      className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center ${
                        !isEven ? 'lg:flex-row-reverse' : ''
                      }`}
                    >
                      {/* Text Column (5 Cols) */}
                      <div
                        className={`lg:col-span-5 space-y-6 ${!isEven ? 'lg:order-2' : 'lg:order-1'}`}
                      >
                        {/* Monospace Counter & Year */}
                        <div className="flex items-center gap-4 text-xs font-mono tracking-widest text-neutral-500">
                          <span className="text-base font-semibold text-neutral-900 font-michroma">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="w-8 h-[1px] bg-neutral-300" />
                          <span>{year || '2024'}</span>
                          {category && (
                            <>
                              <span className="text-neutral-300">/</span>
                              <span className="text-neutral-700 uppercase font-medium">{category}</span>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-light font-michroma tracking-tight text-neutral-900 uppercase leading-snug">
                          {t(project.title)}
                        </h2>

                        {/* Optional Excerpt / Location Meta */}
                        <div className="space-y-4 text-neutral-600 font-light text-sm leading-relaxed">
                          {location && (
                            <p className="flex items-center gap-2 font-mono text-xs uppercase text-neutral-800">
                              <span className="w-1.5 h-1.5 bg-neutral-900 rounded-none" />
                              <span>{location}</span>
                            </p>
                          )}
                          {excerpt && typeof excerpt === 'string' && (
                            <p className="line-clamp-3 text-neutral-600">{excerpt}</p>
                          )}
                        </div>

                        {/* Action Link */}
                        <div className="pt-2">
                          <Link
                            to={`/projects/${project.id}`}
                            className="group/btn inline-flex items-center gap-3 px-6 py-3 border border-neutral-900 bg-white text-xs font-mono tracking-widest uppercase text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all duration-300 rounded-none shadow-sm hover:shadow-md"
                          >
                            <span>{isTr ? 'DETAYLARI GÖR' : 'VIEW PROJECT'}</span>
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
                        </div>
                      </div>

                      {/* Image Column (7 Cols) */}
                      <div
                        className={`lg:col-span-7 ${!isEven ? 'lg:order-1' : 'lg:order-2'}`}
                      >
                        <ScrollReveal delay={100}>
                          <Link
                            to={`/projects/${project.id}`}
                            className="group block relative w-full aspect-[16/10] overflow-hidden bg-neutral-100 border border-neutral-300 hover:border-neutral-900 transition-all duration-500 rounded-none shadow-lg hover:shadow-2xl"
                          >
                            {project.cover && (
                              <OptimizedImage
                                src={
                                  typeof project.cover === 'string'
                                  ? project.cover
                                  : project.cover?.url || ''
                                }
                                srcMobile={
                                  typeof project.cover === 'object'
                                    ? project.cover.urlMobile
                                    : undefined
                                }
                                srcDesktop={
                                  typeof project.cover === 'object'
                                    ? project.cover.urlDesktop
                                    : undefined
                                }
                                alt={t(project.title)}
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                loading="lazy"
                                quality={90}
                                crop={
                                  typeof project.cover === 'object'
                                    ? project.cover.crop
                                    : undefined
                                }
                                hotspot={
                                  typeof project.cover === 'object'
                                    ? project.cover.hotspot
                                    : undefined
                                }
                              />
                            )}

                            {/* Corner Frame Tag */}
                            <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-md border border-neutral-200 text-[10px] font-mono tracking-widest text-neutral-800 rounded-none opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
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
          <div className="py-28 text-center border border-neutral-200 bg-neutral-50 p-12">
            <p className="text-neutral-500 font-mono text-sm tracking-widest uppercase">
              {isTr
                ? 'Seçilen kategoride proje bulunamadı.'
                : 'No projects found in this category.'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
