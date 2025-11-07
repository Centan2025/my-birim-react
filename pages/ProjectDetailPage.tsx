import {useEffect, useState} from 'react'
import { useParams } from 'react-router-dom'
import { getProjectById } from '../services/cms'
import type { Project } from '../types'
import { useTranslation } from '../i18n'

const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[1] && match[1].length === 11 ? match[1] : null;
};

const youTubeThumb = (url: string): string => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
};

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
  
  // Use only media array (images and videos)
  const allMedia = (project.media || []).map((m) => ({ type: m.type, url: m.url, image: m.image || (m.type === 'image' ? m.url : undefined) }))
  
  const curr = allMedia[idx]
  const next = ()=> setIdx(i=> allMedia.length? (i+1)%allMedia.length : 0)
  const prev = ()=> setIdx(i=> allMedia.length? (i-1+allMedia.length)%allMedia.length : 0)
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      <div className="mb-8">
        <h1 className="text-4xl font-light tracking-tight text-gray-900">{t(project.title)}</h1>
        {project.date && (
          <p className="text-sm text-gray-500 mt-2 font-light">
            {t(project.date)}
          </p>
        )}
        <div className="h-px bg-gray-300 mt-4"></div>
      </div>
      {project.cover && !curr && <img src={project.cover} alt={t(project.title)} className="mt-10 w-full h-auto object-contain" />}
      {curr && (
        <div className="mt-10 relative">
          {curr.type === 'image' && (
            <img src={curr.url} alt="project" className={`w-full h-auto object-contain transition-all duration-250 ${anim==='leave' ? 'opacity-0 -translate-y-1' : anim==='enter' ? 'opacity-100 translate-y-0' : ''}`} />
          )}
          {curr.type === 'video' && (
            <div className={`w-full transition-all duration-250 ${anim==='leave' ? 'opacity-0 -translate-y-1' : anim==='enter' ? 'opacity-100 translate-y-0' : ''}`} style={{ paddingTop: '56.25%' }}>
              <video 
                src={curr.url} 
                className="absolute top-0 left-0 w-full h-full object-contain"
                controls
                playsInline
              />
            </div>
          )}
          {curr.type === 'youtube' && (
            <div className={`w-full transition-all duration-250 ${anim==='leave' ? 'opacity-0 -translate-y-1' : anim==='enter' ? 'opacity-100 translate-y-0' : ''}`} style={{ paddingTop: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(curr.url)}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>
          )}
          {allMedia.length>1 && (
            <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
              <button onClick={prev} className="bg-black/40 text-white px-3 py-2 pointer-events-auto hover:bg-black/60 transition-colors">‹</button>
              <button onClick={next} className="bg-black/40 text-white px-3 py-2 pointer-events-auto hover:bg-black/60 transition-colors">›</button>
            </div>
          )}
        </div>
      )}
      {(project.excerpt || project.body) && (
        <div className="mt-12 space-y-4">
          {project.excerpt && (
            <p className="text-lg text-gray-600 leading-relaxed font-light">{t(project.excerpt)}</p>
          )}
          {project.body && (
            <div className="text-gray-700 leading-relaxed font-light whitespace-pre-line">
              {t(project.body)}
            </div>
          )}
        </div>
      )}
      {allMedia.length>0 && (
        <div className="mt-8 grid grid-cols-6 gap-2">
          {allMedia.map((m,i)=>(
            <button key={i} onClick={()=>setIdx(i)} className={`border ${i===idx?'border-gray-900':'border-transparent hover:border-gray-400'}`}>
              {m.type === 'image' && (
                <img src={m.url} alt={`thumb-${i}`} className="w-full aspect-square object-contain bg-gray-50" />
              )}
              {m.type === 'video' && (
                <div className="w-full aspect-square bg-gray-50 flex items-center justify-center relative">
                  <video src={m.url} className="w-full h-full object-contain" />
                  <span className="absolute bottom-1 right-1 bg-white/85 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center shadow text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                  </span>
                </div>
              )}
              {m.type === 'youtube' && (
                <div className="w-full aspect-square bg-gray-50 relative">
                  <img src={youTubeThumb(m.url)} alt={`youtube thumb ${i + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-white/85 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center shadow text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
