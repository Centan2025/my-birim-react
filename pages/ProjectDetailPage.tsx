import {useEffect, useState} from 'react'
import { useParams } from 'react-router-dom'
import { getProjectById } from '../services/cms'
import type { Project } from '../types'
import { useTranslation } from '../i18n'

export function ProjectDetailPage(){
  const { projectId } = useParams<{projectId: string}>()
  const [project,setProject] = useState<Project|undefined>(undefined)
  const [loading,setLoading] = useState(true)
  const { t } = useTranslation()
  useEffect(()=>{ if(projectId){ getProjectById(projectId).then((p)=>{ setProject(p); setLoading(false) })}},[projectId])
  if (loading) return <div className="pt-20 text-center">{t('loading')}...</div>
  if (!project) return <div className="pt-20 text-center">Proje bulunamadı</div>
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">{t(project.title)}</h1>
      {project.date && <p className="text-sm text-gray-500 mt-2">{new Date(project.date).toLocaleDateString()}</p>}
      {project.cover && <img src={project.cover} alt={t(project.title)} className="mt-6 w-full max-h-[520px] object-cover rounded-lg" />}
      {project.body && <p className="mt-6 text-gray-700 leading-relaxed">{t(project.body)}</p>}
      {project.gallery && project.gallery.length>0 && (
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.gallery.map((img,idx)=> (
            <img key={idx} src={img} alt={`Projegorsel-${idx}`} className="w-full h-64 object-cover rounded-lg" />
          ))}
        </div>
      )}
    </div>
  )
}
