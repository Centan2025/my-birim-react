import React, { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { OptimizedImage } from '../OptimizedImage'
import { OptimizedVideo } from '../OptimizedVideo'
import { useTranslation } from '../../i18n'

interface ProductMediaLightboxProps {
  items: any[]
  currentIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  showMetadata?: boolean
}

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const toYouTubeEmbed = (url: string, { autoplay = false, controls = false } = {}) => {
  if (!url) return ''
  let id = ''
  if (url.includes('youtube.com/watch?v=')) {
    id = url.split('v=')[1]?.split('&')[0] || ''
  } else if (url.includes('youtu.be/')) {
    id = url.split('youtu.be/')[1]?.split('?')[0] || ''
  } else if (url.includes('youtube.com/embed/')) {
    id = url.split('embed/')[1]?.split('?')[0] || ''
  }
  return id
    ? `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&mute=1&controls=${controls ? 1 : 0}&playlist=${id}&loop=1`
    : ''
}

export const ProductMediaLightbox: React.FC<ProductMediaLightboxProps> = ({
  items,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  showMetadata = false,
}) => {
  const { t } = useTranslation()
  const youTubePlayerRef = useRef<HTMLIFrameElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Açılış animasyonu: mount sonrası hemen tetikle
  useEffect(() => {
    // Bir sonraki frame'de animasyonu başlat
    const raf = requestAnimationFrame(() => {
      setIsVisible(true)
    })
    // Body scroll'u kilitle
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = ''
    }
  }, [])

  // Kapanış animasyonu
  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300) // Animasyon süresiyle eşleşmeli
  }

  const currentItem = items[currentIndex]
  if (!currentItem) return null

  // Map item properties (handles different schemas for main media, dimensions, and materials)
  const url = (currentItem.url || currentItem.image || '') as string
  const type = (currentItem.type || 'image') as string
  const title = currentItem.title || currentItem.name || ''

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ease-out ${isVisible ? 'bg-black/80 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
        }`}
      onClick={handleClose}
      onKeyDown={e => {
        if (e.key === 'Escape') handleClose()
        if (e.key === 'ArrowLeft') onPrev()
        if (e.key === 'ArrowRight') onNext()
      }}
      role="presentation"
      tabIndex={0}
    >
      {/* Prev Button */}
      {items.length > 1 && (
        <button
          onClick={e => {
            e.stopPropagation()
            onPrev()
          }}
          className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95 bg-white/90 text-gray-950 backdrop-blur-md z-20 shadow-lg border border-black/5 w-12 h-12 md:w-14 md:h-14 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 20 8 12 16 4" />
          </svg>
        </button>
      )}

      {/* Next Button */}
      {items.length > 1 && (
        <button
          onClick={e => {
            e.stopPropagation()
            onNext()
          }}
          className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95 bg-white/90 text-gray-950 backdrop-blur-md z-20 shadow-lg border border-black/5 w-12 h-12 md:w-14 md:h-14 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
            }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="8 20 16 12 8 4" />
          </svg>
        </button>
      )}

      {/* İçerik - tam ekran dikey ortalama */}
      <div
        className={`relative w-screen h-screen flex items-center justify-center p-4 md:p-8 transition-all duration-300 ease-out ${isVisible
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-90'
          }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 md:top-6 md:right-6 z-[80] w-10 h-10 md:w-12 md:h-12 rounded-full border border-black/10 bg-white/90 text-gray-950 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95 shadow-lg flex items-center justify-center ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
        >
          <CloseIcon />
        </button>

        {/* Medya içeriği - tam dikey ortalama */}
        <div className="w-full h-full max-w-screen-2xl max-h-[90vh] flex items-center justify-center">
          {type === 'image' ? (
            <OptimizedImage
              src={url}
              alt="Enlarged view"
              className="max-w-full max-h-[85vh] object-contain"
              loading="eager"
              quality={95}
            />
          ) : type === 'video' ? (
            <OptimizedVideo
              src={url}
              autoPlay
              muted
              loop
              playsInline
              className="max-w-full max-h-[85vh] object-contain"
              preload="auto"
              loading="eager"
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <iframe
                ref={youTubePlayerRef}
                className="w-full h-full max-w-5xl"
                title="youtube-player"
                src={toYouTubeEmbed(url, { autoplay: true })}
                allow="autoplay; encrypted-media; fullscreen"
                frameBorder="0"
              />
            </div>
          )}
        </div>

        {/* Metadata Overlay */}
        {showMetadata && (
          <div className={`absolute bottom-6 left-6 max-w-md p-6 text-white z-[70] pointer-events-none transition-all duration-300 delay-150 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
            {title && <h3 className="text-xl font-light mb-2">{t(title)}</h3>}
            {currentItem.description && (
              <p className="text-sm text-white/90 leading-relaxed mb-3">
                {t(currentItem.description)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
