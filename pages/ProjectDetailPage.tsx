import {useMemo, useState, useEffect} from 'react'
import {useParams, Link} from 'react-router-dom'
import {OptimizedImage} from '../components/OptimizedImage'
import {OptimizedVideo} from '../components/OptimizedVideo'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {useProject, useProjects} from '../src/hooks/useProjects'
import {useSiteSettings} from '../src/hooks/useSiteData'
import {analytics} from '../src/lib/analytics'

const getYouTubeId = (url: string): string | null => {
  if (!url) return null
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[1] && match[1].length === 11 ? match[1] : null
}

const youTubeThumb = (url: string): string => {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''
}

const MinimalChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
)

const MinimalChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export function ProjectDetailPage() {
  const {projectId} = useParams<{projectId: string}>()
  const {data: project, isLoading: loading} = useProject(projectId)
  const {data: allProjects = []} = useProjects()
  const {t} = useTranslation()
  const {data: settings} = useSiteSettings()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'
  const showBottomPrevNext = Boolean(settings?.showProductPrevNext)
  const [idx, setIdx] = useState(0)
  const [anim, setAnim] = useState<'enter' | 'leave' | null>(null)
  useEffect(() => {
    if (!project) return
    setAnim('leave')
    const a = setTimeout(() => setAnim('enter'), 10)
    const b = setTimeout(() => setAnim(null), 260)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [idx, project])
  // Prev/Next must be declared before any early returns to keep hooks order stable
  const {prevProject, nextProject} = useMemo(() => {
    if (!project || allProjects.length < 2) return {prevProject: null, nextProject: null}
    const currentIndex = allProjects.findIndex(p => p.id === project.id)
    if (currentIndex === -1) return {prevProject: null, nextProject: null}
    const prev = currentIndex > 0 ? allProjects[currentIndex - 1] : null
    const next = currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : null
    return {prevProject: prev, nextProject: next}
  }, [project, allProjects])
  // Analytics: proje detay görüntüleme
  useEffect(() => {
    if (!project) return
    if (typeof window === 'undefined') return

    const title = `PROJELER - ${t(project.title)}`
    if (typeof document !== 'undefined') {
      document.title = title
    }

    analytics.pageview(window.location.pathname, title)

    analytics.event({
      category: 'project',
      action: 'view_project',
      label: t(project.title), // ID yerine proje başlığı
    })
  }, [project, t])

  if (loading) {
    return (
      <div className="pt-20">
        <PageLoading message={t('loading')} />
      </div>
    )
  }
  if (!project) {
    return (
      <div className="pt-20 text-center">
        <p className="text-gray-600">{t('project_not_found') || 'Proje bulunamadı'}</p>
      </div>
    )
  }

  // Helper: cover string veya object olabilir
  const coverUrl = project.cover
    ? typeof project.cover === 'string'
      ? project.cover
      : project.cover.url
    : ''
  const coverMobile =
    project.cover && typeof project.cover === 'object' ? project.cover.urlMobile : undefined
  const coverDesktop =
    project.cover && typeof project.cover === 'object' ? project.cover.urlDesktop : undefined

  // Use cover image + media array (images and videos)
  const mediaArray = (project.media || []).map(m => ({
    type: m.type,
    url: m.url,
    urlMobile: m.urlMobile,
    urlDesktop: m.urlDesktop,
    image: m.image || (m.type === 'image' ? m.url : undefined),
  }))
  // Cover görselini başa ekle (eğer varsa ve media array'inde yoksa)
  const coverMedia = coverUrl
    ? [
        {
          type: 'image' as const,
          url: coverUrl,
          urlMobile: coverMobile,
          urlDesktop: coverDesktop,
          image: coverUrl,
        },
      ]
    : []
  // Cover'ı media array'inin başına ekle, ancak aynı URL'den varsa tekrar ekleme
  const existingUrls = new Set(mediaArray.map(m => m.url))
  const coverToAdd = coverMedia.filter(m => !existingUrls.has(m.url))
  const allMedia = [...coverToAdd, ...mediaArray]

  const curr = allMedia[idx]
  const next = () => setIdx(i => (allMedia.length ? (i + 1) % allMedia.length : 0))
  const prev = () =>
    setIdx(i => (allMedia.length ? (i - 1 + allMedia.length) % allMedia.length : 0))

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      <Breadcrumbs
        className="mb-6"
        items={[
          {label: t('homepage'), to: '/'},
          {label: t('projects') || 'Projeler', to: '/projects'},
          {label: t(project.title)},
        ]}
      />
      <div className="mb-8">
        <h1 className="text-4xl font-light tracking-tight text-gray-900">{t(project.title)}</h1>
        {project.date && <p className="text-sm text-gray-500 mt-2 font-light">{t(project.date)}</p>}
        <div className="h-px bg-gray-300 mt-4"></div>
      </div>
      {coverUrl && !curr && (
        <OptimizedImage
          src={coverUrl}
          srcMobile={coverMobile}
          srcDesktop={coverDesktop}
          alt={t(project.title)}
          className={`mt-10 w-full h-auto object-contain ${imageBorderClass}`}
          loading="eager"
          quality={90}
        />
      )}
      {curr && (
        <div className="mt-10 relative">
          {curr.type === 'image' && (
            <OptimizedImage
              src={curr.url}
              srcMobile={curr.urlMobile}
              srcDesktop={curr.urlDesktop}
              alt="project"
              className={`w-full h-auto object-contain transition-all duration-250 ${imageBorderClass} ${anim === 'leave' ? 'opacity-0 -translate-y-1' : anim === 'enter' ? 'opacity-100 translate-y-0' : ''}`}
              loading="eager"
              quality={90}
            />
          )}
          {curr.type === 'video' && (
            <div
              className={`w-full transition-all duration-250 ${anim === 'leave' ? 'opacity-0 -translate-y-1' : anim === 'enter' ? 'opacity-100 translate-y-0' : ''}`}
              style={{paddingTop: '56.25%'}}
            >
              <OptimizedVideo
                src={curr.url}
                srcMobile={curr.urlMobile}
                srcDesktop={curr.urlDesktop}
                className={`absolute top-0 left-0 w-full h-full object-contain ${imageBorderClass}`}
                controls
                playsInline
                preload="metadata"
                loading="eager"
              />
            </div>
          )}
          {curr.type === 'youtube' && (
            <div
              className={`w-full transition-all duration-250 ${anim === 'leave' ? 'opacity-0 -translate-y-1' : anim === 'enter' ? 'opacity-100 translate-y-0' : ''}`}
              style={{paddingTop: '56.25%'}}
            >
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(curr.url)}?rel=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>
          )}
          {allMedia.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
              <button
                onClick={prev}
                className="bg-black/40 text-white px-3 py-2 pointer-events-auto hover:bg-black/60 transition-colors"
              >
                ‹
              </button>
              <button
                onClick={next}
                className="bg-black/40 text-white px-3 py-2 pointer-events-auto hover:bg-black/60 transition-colors"
              >
                ›
              </button>
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
      {allMedia.length > 0 && (
        <div className="mt-8 grid grid-cols-6 gap-2">
          {allMedia.map((m, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`border ${i === idx ? 'border-gray-900' : 'border-transparent hover:border-gray-400'}`}
            >
              {m.type === 'image' && (
                <OptimizedImage
                  src={m.url}
                  alt={`thumb-${i}`}
                  className="w-full aspect-square object-contain bg-gray-50"
                  loading="lazy"
                  quality={75}
                />
              )}
              {m.type === 'video' && (
                <div className="w-full aspect-square bg-gray-50 flex items-center justify-center relative">
                  <OptimizedVideo
                    src={m.url}
                    className="w-full h-full object-contain"
                    preload="none"
                    loading="lazy"
                  />
                  <span className="absolute bottom-1 right-1 bg-white/85 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center shadow text-xs">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-3 h-3 ml-0.5"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>
              )}
              {m.type === 'youtube' && (
                <div className="w-full aspect-square bg-gray-50 relative">
                  <OptimizedImage
                    src={youTubeThumb(m.url)}
                    alt={`youtube thumb ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    quality={75}
                  />
                  <span className="absolute bottom-1 right-1 bg-white/85 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center shadow text-xs">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-3 h-3 ml-0.5"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Prev / Next controls */}
      {showBottomPrevNext && (prevProject || nextProject) && (
        <div className="bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                {prevProject ? (
                  <Link
                    to={`/projects/${prevProject.id}`}
                    className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="Previous project"
                  >
                    <MinimalChevronLeft className="w-12 h-12 md:w-16 md:h-16" />
                  </Link>
                ) : (
                  <span />
                )}
              </div>
              <div className="flex-1 text-right">
                {nextProject ? (
                  <Link
                    to={`/projects/${nextProject.id}`}
                    className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="Next project"
                  >
                    <MinimalChevronRight className="w-12 h-12 md:w-16 md:h-16" />
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
