import React, {useEffect, useState} from 'react'
import { Link } from 'react-router-dom'
import { getProjects } from '../services/cms'
import type { Project } from '../types'
import { useTranslation } from '../i18n'

export function ProjectsPage(){
  const [projects,setProjects] = useState<Project[]>([])
  const [loading,setLoading] = useState(true)
  const { t } = useTranslation()
  useEffect(()=>{ getProjects().then((p)=>{ setProjects(p); setLoading(false) }) },[])
  if (loading) return <div className="pt-20 text-center">{t('loading')}...</div>
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('projects')||'Projeler'}</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((p)=> (
          <Link key={p.id} to={`/projects/${p.id}`} className="group block rounded-lg overflow-hidden border bg-white hover:shadow-lg transition">
            {p.cover && <img src={p.cover} alt={t(p.title)} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />}
            <div className="p-4">
              <h3 className="font-semibold text-lg text-gray-900">{t(p.title)}</h3>
              {p.date && <p className="text-xs text-gray-500 mt-1">{new Date(p.date).toLocaleDateString()}</p>}
              {p.excerpt && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{t(p.excerpt)}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
