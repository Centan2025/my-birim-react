import {useEffect, useState} from 'react'
import { Link } from 'react-router-dom'
import { getProjects } from '../services/cms'
import type { Project } from '../types'
import { useTranslation } from '../i18n'

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const { t } = useTranslation();
  return (
    <Link to={`/projects/${project.id}`} className="group flex flex-col h-full text-center">
      <div className="overflow-hidden bg-white aspect-[16/10]">
        {project.cover && (
          <img
            src={project.cover}
            alt={t(project.title)}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
          />
        )}
      </div>
      <div className="mt-4 min-h-[2.5rem] flex items-center justify-center">
        <h3 className="text-xl font-light text-gray-500 group-hover:text-gray-600">{t(project.title)}</h3>
      </div>
    </Link>
  );
};

export function ProjectsPage(){
  const [projects,setProjects] = useState<Project[]>([])
  const [loading,setLoading] = useState(true)
  const { t } = useTranslation()
  useEffect(()=>{ getProjects().then((p)=>{ setProjects(p); setLoading(false) }) },[])
  
  if (loading) {
    return <div className="pt-20 text-center">{t('loading')}...</div>;
  }

  return (
    <div className="bg-gray-100 animate-fade-in-up">
      <div className="w-full max-w-[95vw] mx-auto px-2 sm:px-4 lg:px-6 pt-28 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-gray-600">{t('projects')||'Projeler'}</h1>
          <div className="h-px bg-gray-300 mt-4 w-full"></div>
        </div>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8 items-stretch">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center">{t('project_not_found') || 'Proje bulunamadı'}</p>
        )}
      </div>
    </div>
  )
}
