import {motion} from 'framer-motion'
import {Link} from 'react-router-dom'
import type {Project} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useProjects} from '../hooks/useProjects'
import ScrollReveal from '../components/ScrollReveal'
import {useSEO} from '../hooks/useSEO'

/**
 * Modern Grid Card for Projects
 * Design inspired by the reference image.
 */
const ProjectCard: React.FC<{project: Project; index: number}> = ({project, index}) => {
  const {t} = useTranslation()

  // Extract year from localized date string (e.g., "15.03.2023" -> "2023")
  const dateVal = typeof project.date === 'string' ? project.date : t(project.date as never)
  const year = typeof dateVal === 'string' ? dateVal.match(/\d{4}/)?.[0] || dateVal : ''

  return (
    <ScrollReveal delay={index * 50} threshold={0.05} direction="none" distance={0}>
      <Link
        to={`/projects/${project.id}`}
        className="group relative block aspect-square md:aspect-[4/3] lg:aspect-[16/10] overflow-hidden bg-zinc-900 border-[0.5px] border-white/5"
      >
        {/* Project Image */}
        {project.cover && (
          <OptimizedImage
            src={typeof project.cover === 'string' ? project.cover : project.cover?.url || ''}
            srcMobile={typeof project.cover === 'object' ? project.cover.urlMobile : undefined}
            srcDesktop={typeof project.cover === 'object' ? project.cover.urlDesktop : undefined}
            alt={t(project.title)}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] will-change-transform"
            width={1200}
            height={800}
            loading="lazy"
            quality={90}
            crop={typeof project.cover === 'object' ? project.cover.crop : undefined}
            hotspot={typeof project.cover === 'object' ? project.cover.hotspot : undefined}
            origWidth={typeof project.cover === 'object' ? (project.cover as Record<string, unknown>)['origWidth'] as number : undefined}
            origHeight={typeof project.cover === 'object' ? (project.cover as Record<string, unknown>)['origHeight'] as number : undefined}
          />
        )}

        {/* Dynamic Gradient Overlay - Darker at bottom for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90 group-hover:opacity-75 transition-opacity duration-700" />

        {/* Floating Content */}
        <div className="absolute inset-0 p-8 md:p-12 lg:p-16 flex flex-col justify-end">
          {/* Meta Row: Year | Category */}
          <div className="flex items-center gap-3 mb-3">
            {year && (
              <span className="text-[11px] md:text-xs font-bold tracking-[0.3em] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] uppercase">
                {year}
              </span>
            )}
            <div className="w-8 h-px bg-white/40"></div>
            {project.projectCategory && (
              <span className="text-[10px] md:text-xs font-medium tracking-[0.25em] text-white/70 uppercase">
                {t(project.projectCategory)}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-white uppercase leading-[1.1] mb-2 group-hover:text-white transition-colors">
            {t(project.title)}
          </h2>

          {/* Location / Secondary Info */}
          {project.excerpt && (
            <p className="text-[11px] md:text-xs font-normal tracking-[0.12em] text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase mt-2">
              {(() => {
                const val = t(project.excerpt)
                return typeof val === 'string' ? val.substring(0, 90) : ''
              })()}
            </p>
          )}
        </div>
      </Link>
    </ScrollReveal>
  )
}

export function ProjectsPage() {
  const {data: projects = [], isLoading: loading} = useProjects()
  const {t} = useTranslation()

  useSEO({
    title: t('projects_meta_title') || 'BIRIM - Projeler',
    description:
      t('projects_meta_description') || 'BIRIM projeleri, referans işleri ve uygulama örnekleri',
    type: 'website',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'Projects',
  })

  if (loading) {
    return (
      <div className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen animate-fade-in-up-subtle pt-20 md:pt-24 lg:pt-24 selection:bg-primary selection:text-black">
      {/* Breadcrumb Band */}
      <div className="w-full relative z-20">
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4 text-gray-400">
          <Breadcrumbs
            items={[{label: t('homepage'), to: '/'}, {label: t('projects') || 'Projeler'}]}
          />
        </div>
      </div>

      {/* Sayfa Başlığı */}
      <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-4 md:pt-12 pb-12">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 1, ease: 'easeOut'}}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)] tracking-tight text-center uppercase">
            {t('projects') || 'Projeler'}
          </h1>
        </motion.div>
      </div>

      {/* Proje Listesi - 2 Kolon Izgara (Gap Kaldırıldı) */}
      <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pb-16 md:pb-24">
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        ) : (
          <div className="py-32 text-center">
            <p className="text-[var(--text-secondary)] text-lg italic font-light tracking-widest">
              {t('project_not_found')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
