import type {NavigateFunction} from 'react-router-dom'
import ScrollReveal from './ScrollReveal'
import type {LocalizedString, User} from '../types'

interface ExclusiveDownloadItem {
  url: string
  name: LocalizedString | string
}

interface ExclusiveContent {
  images?: Array<string | {url?: string; image?: string}>
  drawings?: ExclusiveDownloadItem[]
  models3d?: ExclusiveDownloadItem[]
}

interface ExclusiveContentSectionProps {
  exclusiveContent: ExclusiveContent | null
  isLoggedIn: boolean
  user: User | null
  navigate: NavigateFunction
  t: (value: string | LocalizedString) => string
  onOpenImageFullscreen?: (index: number) => void
}

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

export function ProductExclusiveContentSection({
  exclusiveContent,
  isLoggedIn,
  user,
  navigate,
  t,
  onOpenImageFullscreen,
}: ExclusiveContentSectionProps) {
  if (!exclusiveContent) return null

  const hasImages = Array.isArray(exclusiveContent.images) && exclusiveContent.images.length > 0
  const hasDrawings =
    Array.isArray(exclusiveContent.drawings) && exclusiveContent.drawings.length > 0
  const hasModels3d =
    Array.isArray(exclusiveContent.models3d) && exclusiveContent.models3d.length > 0

  const totalActiveColumns = [hasImages, hasDrawings, hasModels3d].filter(Boolean).length

  // Do not render section if there are no downloadable files at all
  if (totalActiveColumns === 0) return null

  const isVerifiedArchitect =
    isLoggedIn &&
    user &&
    user.isVerified &&
    (user.role === 'admin' ||
      (user.role === 'architect' && user.architectVerificationStatus === 'verified'))

  const handleDownloadClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    _url: string,
    isProAsset: boolean = false
  ) => {
    if (!isLoggedIn) {
      e.preventDefault()
      navigate('/login')
      return
    }

    if (user && !user.isVerified) {
      e.preventDefault()
      alert('Email adresiniz henüz doğrulanmamış. Lütfen email kutunuzu kontrol edin.')
      return
    }

    if (isProAsset && !isVerifiedArchitect) {
      e.preventDefault()
      if (user?.role === 'architect') {
        alert(
          'CAD, DWG ve BIM dosyaları doğrulanmış "Mimar Programı" üyelerine özeldir. Başvurunuz şu anda inceleme aşamasındadır.'
        )
      } else {
        alert(
          'CAD, DWG, 3DS ve BIM dosyaları yalnızca doğrulanmış Mimarlar ve İç Mimarlar ("Mimar Programı") için erişilebilirdir. Profilinizden mimar doğrulaması talep edebilirsiniz.'
        )
      }
      return
    }
  }

  const handleImageClick = (e: React.MouseEvent, _url: string, idx: number) => {
    if (!isLoggedIn) {
      e.preventDefault()
      navigate('/login')
      return
    }

    if (user && !user.isVerified) {
      e.preventDefault()
      alert('Email adresiniz henüz doğrulanmamış. Lütfen email kutunuzu kontrol edin.')
      return
    }

    if (onOpenImageFullscreen) {
      e.preventDefault()
      onOpenImageFullscreen(idx)
    }
  }

  const getExtraImageLabel = (_img: string | {url?: string; image?: string}, idx: number) => {
    return `${t('additional_image') || 'Ek Görsel'} ${idx + 1}`
  }

  const gridColsClass =
    totalActiveColumns === 3
      ? 'md:grid-cols-3'
      : totalActiveColumns === 2
        ? 'md:grid-cols-2'
        : 'md:grid-cols-1'

  return (
    <ScrollReveal delay={600} threshold={0.05}>
      <div className="relative rounded-none border border-[var(--border-primary)] bg-[var(--bg-primary)]/70 backdrop-blur p-6 sm:p-8 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-light text-[var(--text-primary)]">
            {t('downloadable_files') || 'Ürün Kaynakları'}
          </h2>
        </div>
        <div className={`grid grid-cols-1 ${gridColsClass} gap-6`}>
          {hasImages && (
            <div className="rounded-none border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
              <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-3">
                {t('additional_images') || 'Ek Görseller'}
              </div>
              <ul className="space-y-2">
                {exclusiveContent.images!.map((img, idx) => {
                  const url = typeof img === 'string' ? img : img?.url || img?.image || ''
                  const label = getExtraImageLabel(img, idx)
                  return (
                    <li key={idx} className="group">
                      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-none border border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                        <button
                          type="button"
                          onClick={e => handleImageClick(e, url, idx)}
                          className="flex items-center gap-2 flex-grow text-left cursor-pointer select-none overflow-hidden"
                          title={label}
                        >
                          <span className="shrink-0 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M15 3h6v6" />
                              <path d="M9 21H3v-6" />
                              <path d="M21 3l-7 7" />
                              <path d="M3 21l7-7" />
                            </svg>
                          </span>
                          <span className="text-sm text-[var(--text-primary)] group-hover:text-[var(--text-primary)] truncate">
                            {label}
                          </span>
                        </button>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => handleDownloadClick(e, url)}
                          className="shrink-0 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          title="İndir"
                        >
                          <DownloadIcon />
                        </a>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {hasDrawings && (
            <div className="rounded-none border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
              <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-3">
                {t('technical_drawings') || 'Teknik Çizimler'}
              </div>
              <ul className="space-y-2">
                {exclusiveContent.drawings!.map((doc, idx) => (
                  <li key={idx} className="group">
                    <a
                      href={doc.url}
                      download
                      onClick={e => handleDownloadClick(e, doc.url)}
                      className="flex items-center gap-2 px-3 py-2 rounded-none border border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <span className="shrink-0 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                        <DownloadIcon />
                      </span>
                      <span className="text-sm text-[var(--text-primary)] group-hover:text-[var(--text-primary)]">
                        {t(doc.name)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasModels3d && (
            <div className="rounded-none border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
              <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-3">
                {t('3d_models') || '3D Modeller'}
              </div>
              <ul className="space-y-2">
                {exclusiveContent.models3d!.map((model, idx) => (
                  <li key={idx} className="group">
                    <a
                      href={model.url}
                      download
                      onClick={e => handleDownloadClick(e, model.url, true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-none border border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <span className="shrink-0 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                        <DownloadIcon />
                      </span>
                      <span className="text-sm text-[var(--text-primary)] group-hover:text-[var(--text-primary)]">
                        {t(model.name)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {/* Alt çizgi: kartın tam alt kenarında, kenarlara kadar */}
        <div className="absolute left-0 right-0 bottom-0 h-px bg-[var(--border-primary)]" />
      </div>
    </ScrollReveal>
  )
}
