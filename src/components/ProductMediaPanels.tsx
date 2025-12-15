import {OptimizedImage} from './OptimizedImage'
import ScrollReveal from './ScrollReveal'

interface ProductMediaPanelsProps {
  product: any
  imageBorderClass: string
  youTubeThumb: (url: string) => string
  openPanelLightbox: (index: number) => void
  t: (value: any) => string
}

export function ProductMediaPanels({
  product,
  imageBorderClass,
  youTubeThumb,
  openPanelLightbox,
  t,
}: ProductMediaPanelsProps) {
  if (!Array.isArray((product as any)?.media) || (product as any).media.length === 0) {
    return null
  }

  const media = (product as any).media
  const sectionTitle =
    (product as any)?.mediaSectionTitle &&
    String((product as any).mediaSectionTitle).trim().length > 0
      ? t((product as any).mediaSectionTitle)
      : 'Projeler'

  return (
    <ScrollReveal delay={700} threshold={0.05}>
      <section className="mt-12">
        <h2 className="text-xl font-light text-gray-600 mb-4">{sectionTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {media.map((m: any, idx: number) => (
            <div key={idx} className="overflow-hidden">
              <button
                onClick={() => openPanelLightbox(idx)}
                className="relative w-full aspect-video bg-gray-200 flex items-center justify-center"
              >
                {m.type === 'image' ? (
                  <OptimizedImage
                    src={m.url}
                    alt={`media-${idx}`}
                    className={`w-full h-full object-cover ${imageBorderClass}`}
                    loading="lazy"
                    quality={85}
                  />
                ) : m.type === 'video' ? (
                  <div className={`w-full h-full bg-gray-300 ${imageBorderClass}`} />
                ) : (
                  <OptimizedImage
                    src={youTubeThumb(m.url)}
                    alt={`youtube thumb ${idx + 1}`}
                    className={`w-full h-full object-cover ${imageBorderClass}`}
                    loading="lazy"
                    quality={75}
                  />
                )}
                {(m.type === 'video' || m.type === 'youtube') && (
                  <span className="pointer-events-none absolute bottom-2 right-2">
                    <span className="bg-white/85 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center shadow">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 ml-0.5"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                )}
              </button>
              {m.title && (
                <div className="px-1 pt-2 text-sm text-gray-600">{t(m.title)}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </ScrollReveal>
  )
}


