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
}: ExclusiveContentSectionProps) {
  if (!exclusiveContent) return null

  const canDownload = isLoggedIn && user?.userType === 'full_member' && user?.isVerified

  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>, _url: string) => {
    if (!canDownload) {
      e.preventDefault()
      // Kullanıcı kayıtlı ama email doğrulamadıysa
      if (isLoggedIn && user && !user.isVerified) {
        alert(
          'Email adresiniz henüz doğrulanmamış. Lütfen email kutunuzu kontrol ederek hesabınızı doğrulayın.'
        )
        return
      }
      navigate('/login')
      return
    }
  }

  const getExtraImageLabel = (_img: string | {url?: string; image?: string}, idx: number) => {
    return `${t('additional_image') || 'Ek Görsel'} ${idx + 1}`
  }

  return (
    <ScrollReveal delay={600} threshold={0.05}>
      <div className="relative rounded-none border border-[var(--border-primary)] bg-[var(--bg-primary)]/70 backdrop-blur p-6 sm:p-8 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-light text-[var(--text-primary)]">
            {t('downloadable_files') || 'Ürün Kaynakları'}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-none border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
            <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              {t('additional_images') || 'Ek Görseller'}
            </div>
            {exclusiveContent.images && exclusiveContent.images.length > 0 ? (
              <ul className="space-y-2">
                {exclusiveContent.images.map((img, idx) => {
                  const url = typeof img === 'string' ? img : img?.url || img?.image || ''
                  const label = getExtraImageLabel(img, idx)
                  return (
                    <li key={idx} className="group">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => handleDownloadClick(e, url)}
                        className="flex items-center gap-2 px-3 py-2 rounded-none border border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        <span className="shrink-0 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                          <DownloadIcon />
                        </span>
                        <span className="text-sm text-[var(--text-primary)] group-hover:text-[var(--text-primary)] break-all">
                          {label}
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-[var(--text-secondary)] opacity-50 text-sm">
                {t('no_additional_images') || 'Ek görsel bulunmuyor'}
              </p>
            )}
          </div>
          <div className="rounded-none border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
            <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              {t('technical_drawings') || 'Teknik Çizimler'}
            </div>
            {exclusiveContent.drawings && exclusiveContent.drawings.length > 0 ? (
              <ul className="space-y-2">
                {exclusiveContent.drawings.map((doc, idx) => (
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
            ) : (
              <p className="text-[var(--text-secondary)] opacity-50 text-sm">
                {t('no_technical_drawings') || 'Teknik çizim bulunmuyor'}
              </p>
            )}
          </div>
          <div className="rounded-none border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
            <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              {t('3d_models') || '3D Modeller'}
            </div>
            {exclusiveContent.models3d && exclusiveContent.models3d.length > 0 ? (
              <ul className="space-y-2">
                {exclusiveContent.models3d.map((model, idx) => (
                  <li key={idx} className="group">
                    <a
                      href={model.url}
                      download
                      onClick={e => handleDownloadClick(e, model.url)}
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
            ) : (
              <p className="text-[var(--text-secondary)] opacity-50 text-sm">
                {t('no_3d_models') || '3D model bulunmuyor'}
              </p>
            )}
          </div>
        </div>
        {/* Alt çizgi: kartın tam alt kenarında, kenarlara kadar */}
        <div className="absolute left-0 right-0 bottom-0 h-px bg-[var(--border-primary)]" />
      </div>
    </ScrollReveal>
  )
}
