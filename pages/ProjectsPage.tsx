import {Link} from 'react-router-dom'
import type {Project} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useProjects} from '../src/hooks/useProjects'
import {useSiteSettings} from '../src/hooks/useSiteData'
import ScrollReveal from '../components/ScrollReveal'

const ProjectCard: React.FC<{project: Project}> = ({project}) => {
  const {t} = useTranslation()
  const {data: settings} = useSiteSettings()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'
  return (
    <Link to={`/projects/${project.id}`} className="group flex flex-col h-full text-center">
      <div className={`overflow-hidden bg-white aspect-[16/10] ${imageBorderClass}`}>
        {project.cover && (
          <OptimizedImage
            src={typeof project.cover === 'string' ? project.cover : project.cover?.url || ''}
            srcMobile={typeof project.cover === 'object' ? project.cover.urlMobile : undefined}
            srcDesktop={typeof project.cover === 'object' ? project.cover.urlDesktop : undefined}
            alt={t(project.title)}
            className={`w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.03] ${imageBorderClass}`}
            loading="lazy"
            quality={85}
          />
        )}
      </div>
      <div className="mt-4 min-h-[2.5rem] flex items-center justify-center">
        <h3 className="text-xl font-light text-gray-500 group-hover:text-gray-600">
          {t(project.title)}
        </h3>
      </div>
    </Link>
  )
}

export function ProjectsPage() {
  const {data: projects = [], isLoading: loading} = useProjects()
  const {t} = useTranslation()

  if (loading) {
    return (
      <div className="pt-20">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  return (
    <div className="bg-gray-100 animate-fade-in-up-subtle">
      <div className="w-full max-w-[95vw] mx-auto px-2 sm:px-4 lg:px-6 pt-20 md:pt-24 lg:pt-24 pb-16">
        <Breadcrumbs
          className="mb-6"
          items={[
            {label: t('homepage'), to: '/'},
            {label: t('projects') || 'Projeler'},
          ]}
        />
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-gray-600">
            {t('projects') || 'Projeler'}
          </h1>
          <div className="h-px bg-gray-300 mt-4 w-full"></div>
        </div>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8 items-stretch">
            {projects.map((project, index) => (
              <ScrollReveal 
                key={project.id} 
                delay={index < 12 ? index * 20 : 0} 
                threshold={0.01}
              >
                <ProjectCard project={project} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal delay={0} threshold={0.01}>
            <p className="text-gray-600 text-center">
              {t('project_not_found') || 'Proje bulunamadı'}
            </p>
          </ScrollReveal>
        )}
      </div>
    </div>
  )
}
