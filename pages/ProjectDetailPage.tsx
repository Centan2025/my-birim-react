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
  const [idx,setIdx] = useState(0)
  const [anim,setAnim] = useState<'enter'|'leave'|null>(null)
  useEffect(()=>{ if(projectId){ getProjectById(projectId).then((p)=>{ setProject(p); setLoading(false) })}},[projectId])
  useEffect(()=>{ if(!project) return; setAnim('leave'); const a=setTimeout(()=>setAnim('enter'),10); const b=setTimeout(()=>setAnim(null),260); return ()=>{clearTimeout(a);clearTimeout(b)} },[idx, project])
  if (loading) return <div className="pt-20 text-center">{t('loading')}...</div>
  if (!project) return <div className="pt-20 text-center">Proje bulunamadı</div>
  const gallery = project.gallery || []
  const curr = gallery[idx]
  const next = ()=> setIdx(i=> gallery.length? (i+1)%gallery.length : 0)
  const prev = ()=> setIdx(i=> gallery.length? (i-1+gallery.length)%gallery.length : 0)
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">{t(project.title)}</h1>
      {project.date && <p className="text-sm text-gray-500 mt-2">{new Date(project.date).toLocaleDateString()}</p>}
      {project.cover && !curr && <img src={project.cover} alt={t(project.title)} className="mt-6 w-full max-h-[520px] object-cover" />}
      {curr && (
        <div className="mt-6 relative">
          <img src={curr} alt="project" className={`w-full max-h-[520px] object-cover transition-all duration-250 ${anim==='leave' ? 'opacity-0 -translate-y-1' : anim==='enter' ? 'opacity-100 translate-y-0' : ''}`} />
          {gallery.length>1 && (
            <div className="absolute inset-0 flex items-center justify-between px-2">
              <button onClick={prev} className="bg-black/40 text-white px-3 py-2">‹</button>
              <button onClick={next} className="bg-black/40 text-white px-3 py-2">›</button>
            </div>
          )}
        </div>
      )}
      {project.body && <p className="mt-6 text-gray-700 leading-relaxed">{t(project.body)}</p>}
      {gallery.length>0 && (
        <div className="mt-6 grid grid-cols-6 gap-2">
          {gallery.map((g,i)=>(
            <button key={i} onClick={()=>setIdx(i)} className={`border ${i===idx?'border-gray-900':'border-transparent hover:border-gray-400'}`}>
              <img src={g} alt={`thumb-${i}`} className="w-full h-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
