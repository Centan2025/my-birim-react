import { Link } from 'react-router-dom'
import type { Project } from '../types'
import { OptimizedImage } from '../components/OptimizedImage'
import { PageLoading } from '../components/LoadingSpinner'
import { useTranslation } from '../i18n'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { useProjects } from '../hooks/useProjects'
import ScrollReveal from '../components/ScrollReveal'
import { useSEO } from '../hooks/useSEO'

const ProjectRow: React.FC<{ project: Project; index: number }> = ({ project, index }) => {
  const { t } = useTranslation()
  return (
    <ScrollReveal delay={index * 80} threshold={0.01} direction="up" distance={30}>
      <Link
        to={`/projects/${project.id}`}
        className="group block border-b border-gray-300 transition-colors duration-300 hover:bg-gray-50/50"
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8 py-8 md:py-10 lg:py-12">
          {/* Sol: Proje adı - hover'da sağa kayar */}
          <div className="flex items-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-light tracking-tight text-gray-900 uppercase transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:text-gray-600 group-hover:translate-x-6">
              {t(project.title)}
            </h2>
          </div>

          {/* Orta: Kategori + Yıl */}
          <div className="hidden md:flex flex-col items-start min-w-[200px] lg:min-w-[260px]">
            {project.projectCategory && (
              <span className="text-base lg:text-lg text-gray-400 uppercase tracking-widest font-light">
                {t(project.projectCategory)}
              </span>
            )}
            {project.date && (
              <span className="text-base lg:text-lg text-gray-400 mt-1 font-light">
                {t(project.date)}
              </span>
            )}
          </div>

          {/* Mobilde: Kategori + Yıl */}
          <div className="flex md:hidden gap-4 text-sm text-gray-400">
            {project.projectCategory && (
              <span className="uppercase tracking-wider">{t(project.projectCategory)}</span>
            )}
            {project.date && <span>{t(project.date)}</span>}
          </div>

          {/* Sağ: Proje görseli */}
          <div className="flex justify-end">
            <div className="w-full md:w-[320px] lg:w-[400px] aspect-[16/10] overflow-hidden">
              {project.cover && (
                <OptimizedImage
                  src={typeof project.cover === 'string' ? project.cover : project.cover?.url || ''}
                  srcMobile={typeof project.cover === 'object' ? project.cover.urlMobile : undefined}
                  srcDesktop={typeof project.cover === 'object' ? project.cover.urlDesktop : undefined}
                  alt={t(project.title)}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  width={800}
                  height={500}
                  loading="lazy"
                  quality={85}
                  crop={typeof project.cover === 'object' ? (project.cover as any).crop : undefined}
                  hotspot={typeof project.cover === 'object' ? (project.cover as any).hotspot : undefined}
                />
              )}
            </div>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  )
}

export function ProjectsPage() {
  const { data: projects = [], isLoading: loading } = useProjects()
  const { t } = useTranslation()

  // SEO meta
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
      <div className="pt-20">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen animate-fade-in-up-subtle">
      {/* Breadcrumb Band */}
      <div className="w-full bg-white">
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-20 md:pt-24 lg:pt-24 pb-4">
          <Breadcrumbs
            items={[{ label: t('homepage'), to: '/' }, { label: t('projects') || 'Projeler' }]}
          />
        </div>
      </div>

      {/* Sayfa Başlığı */}
      <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-4 md:pt-6 pb-4 md:pb-8">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 tracking-tight text-center">
          {t('projects') || 'Projeler'}
        </h1>
      </div>

      {/* Proje Listesi - Yatay satır düzeni */}
      <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pb-16 md:pb-24">
        {projects.length > 0 ? (
          <div className="border-t border-gray-200">
            {projects.map((project, index) => (
              <ProjectRow key={project.id} project={project} index={index} />
            ))}
          </div>
        ) : (
          <ScrollReveal delay={0} threshold={0.01}>
            <p className="text-gray-500 text-center py-16">{t('project_not_found')}</p>
          </ScrollReveal>
        )}
      </div>
    </div>
  )
}
