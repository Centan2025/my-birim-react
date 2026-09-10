import {useState, useEffect} from 'react'
import {useSearchParams} from 'react-router-dom'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {useProjects} from '../hooks/useProjects'
import {useSEO} from '../hooks/useSEO'
import {ProjectsV2VerticalView} from '../components/project/ProjectsV2VerticalView'
import {ProjectsV3VerticalView} from '../components/project/ProjectsV3VerticalView'
import {ProjectsV4FullscreenView} from '../components/project/ProjectsV4FullscreenView'

export function ProjectsPage() {
  const {data: projects = [], isLoading: loading} = useProjects()
  const {t} = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const paramVersion = searchParams.get('v')

  // Layout View Version: 'v2' | 'v3' | 'v4'
  const initialVersion: 'v2' | 'v3' | 'v4' =
    paramVersion === '4' || paramVersion === 'v4' || paramVersion === 'fullscreen'
      ? 'v4'
      : paramVersion === '3' || paramVersion === 'v3'
        ? 'v3'
        : paramVersion === '2' || paramVersion === 'v2'
          ? 'v2'
          : (typeof window !== 'undefined' &&
              (localStorage.getItem('birim_projects_view_version') as 'v2' | 'v3' | 'v4')) ||
            'v2'

  const [viewVersion, setViewVersion] = useState<'v2' | 'v3' | 'v4'>(
    (initialVersion as string) === 'v1' ? 'v2' : initialVersion
  )

  useEffect(() => {
    if (paramVersion === '4' || paramVersion === 'v4' || paramVersion === 'fullscreen') {
      setViewVersion('v4')
    } else if (paramVersion === '3' || paramVersion === 'v3') {
      setViewVersion('v3')
    } else if (
      paramVersion === '2' ||
      paramVersion === 'v2' ||
      paramVersion === '1' ||
      paramVersion === 'v1'
    ) {
      setViewVersion('v2')
    }
  }, [paramVersion])

  const handleVersionChange = (v: 'v2' | 'v3' | 'v4') => {
    setViewVersion(v)
    if (typeof window !== 'undefined') {
      localStorage.setItem('birim_projects_view_version', v)
    }
    const newParams = new URLSearchParams(searchParams)
    newParams.set('v', v === 'v4' ? '4' : v === 'v3' ? '3' : '2')
    setSearchParams(newParams, {replace: true})
  }

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
    <>
      {viewVersion === 'v4' ? (
        <ProjectsV4FullscreenView projects={projects} />
      ) : viewVersion === 'v3' ? (
        <ProjectsV3VerticalView projects={projects} />
      ) : (
        <ProjectsV2VerticalView projects={projects} />
      )}

      {/* Floating Version Comparison Switcher (V2 / V3 / V4 - Keskin Köşeli) */}
      <aside
        aria-label="Projeler Görünüm Seçici"
        className="fixed bottom-6 right-6 z-50 flex items-center select-none"
      >
        <div className="flex items-center gap-1 p-1 bg-neutral-950/95 text-white backdrop-blur-xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)] rounded-none">
          <button
            type="button"
            onClick={() => handleVersionChange('v2')}
            className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
              viewVersion === 'v2'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-300 hover:text-white'
            }`}
            title="V2 - Dikey Küratörlü Grid"
          >
            V2 <span className="text-[10px] opacity-70 hidden sm:inline">Grid</span>
          </button>
          <button
            type="button"
            onClick={() => handleVersionChange('v3')}
            className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
              viewVersion === 'v3'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-300 hover:text-white'
            }`}
            title="V3 - Awwwards Kinetik Mimari Sahne & Split İndeks"
          >
            V3 <span className="text-[10px] opacity-70 hidden sm:inline">Awwwards</span>
          </button>
          <button
            type="button"
            onClick={() => handleVersionChange('v4')}
            className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors rounded-none cursor-pointer ${
              viewVersion === 'v4'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-300 hover:text-white'
            }`}
            title="V4 - Sinematik Tam Ekran Mimari Deneyim"
          >
            V4 <span className="text-[10px] opacity-70 hidden sm:inline">Tam Ekran</span>
          </button>
        </div>
      </aside>
    </>
  )
}
