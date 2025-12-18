/* eslint-disable jsx-a11y/media-has-caption */
import React, {useState, useRef} from 'react'

interface OptimizedVideoProps {
  src: string
  className?: string
  style?: React.CSSProperties
  poster?: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  playsInline?: boolean
  loading?: 'lazy' | 'eager'
  preload?: 'none' | 'metadata' | 'auto'
  // Art Direction: Farklı ekranlar için farklı videolar
  srcMobile?: string // Mobil için video (varsa)
  srcDesktop?: string // Desktop için video (varsa)
  posterMobile?: string // Mobil için poster (varsa)
  posterDesktop?: string // Desktop için poster (varsa)
  onLoad?: () => void
  onError?: () => void
}

/**
 * Optimize edilmiş video component'i
 * - Lazy loading desteği
 * - Poster image desteği
 * - Preload kontrolü
 * - Hata yönetimi
 */
export const OptimizedVideo: React.FC<OptimizedVideoProps> = ({
  src,
  className = '',
  style,
  poster,
  autoPlay = false,
  loop = false,
  muted = false,
  controls = false,
  playsInline = true,
  loading = 'lazy',
  preload = 'none', // Varsayılan olarak preload yok (performans için)
  srcMobile,
  srcDesktop,
  posterMobile,
  posterDesktop,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleLoadedData = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = (e?: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = e?.currentTarget
    if (videoElement?.error) {
      const error = videoElement.error
      // Hata kodlarını kontrol et
      // MEDIA_ERR_ABORTED (1): Yükleme kullanıcı tarafından durduruldu
      // MEDIA_ERR_NETWORK (2): Ağ hatası
      // MEDIA_ERR_DECODE (3): Video decode edilemedi
      // MEDIA_ERR_SRC_NOT_SUPPORTED (4): Video formatı desteklenmiyor veya URL geçersiz
      
      console.error('Video yükleme hatası:', {
        code: error.code,
        message: error.message,
        videoSrc: videoElement.src || videoElement.currentSrc,
        errorCode: {
          1: 'MEDIA_ERR_ABORTED',
          2: 'MEDIA_ERR_NETWORK',
          3: 'MEDIA_ERR_DECODE',
          4: 'MEDIA_ERR_SRC_NOT_SUPPORTED'
        }[error.code]
      })
      
      // Sadece gerçek yükleme hatalarını yakala
      if (error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || 
          error.code === MediaError.MEDIA_ERR_NETWORK ||
          error.code === MediaError.MEDIA_ERR_DECODE) {
        setHasError(true)
        onError?.()
        return
      }
      // MEDIA_ERR_ABORTED için sessizce devam et (kullanıcı durdurmuş olabilir)
      return
    }
    // Error event'i geldi ama error objesi yoksa, muhtemelen cache hatası
    // Bu durumda video yine de çalışabilir, bu yüzden görmezden gel
    console.warn('Video error event tetiklendi ama error objesi yok:', {
      videoSrc: videoElement?.src || videoElement?.currentSrc
    })
  }

  // Intersection Observer ile lazy loading
  React.useEffect(() => {
    if (loading === 'lazy' && videoRef.current) {
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting && videoRef.current) {
              // Video görünür olduğunda yükle
              if (preload === 'none') {
                videoRef.current.preload = 'metadata'
              }
              observer.disconnect()
            }
          })
        },
        {rootMargin: '50px'}
      )

      observer.observe(videoRef.current)

      return () => observer.disconnect()
    }
    return undefined
  }, [loading, preload])

  // Art Direction: srcMobile veya srcDesktop varsa kullan, yoksa src'i kullan
  const mobileSrc = srcMobile || src
  const desktopSrc = srcDesktop || src
  const useArtDirection = Boolean(srcMobile || srcDesktop)

  // Poster için de Art Direction desteği
  const getPosterForScreen = (): string | undefined => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 768
      if (isMobile && posterMobile) return posterMobile
      if (!isMobile && posterDesktop) return posterDesktop
    }
    return poster
  }

  // Video src'i için ekran boyutuna göre seç
  const getVideoSrc = (): string => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 768
      if (isMobile && srcMobile) return mobileSrc
      if (!isMobile && srcDesktop) return desktopSrc
    }
    return src
  }

  // Poster'ı dinamik olarak güncelle
  React.useEffect(() => {
    if (videoRef.current && (posterMobile || posterDesktop)) {
      const updatePoster = () => {
        if (videoRef.current) {
          const newPoster = getPosterForScreen()
          if (newPoster) {
            videoRef.current.poster = newPoster
          }
        }
      }

      updatePoster()
      window.addEventListener('resize', updatePoster)
      return () => window.removeEventListener('resize', updatePoster)
    }
    return undefined
  }, [posterMobile, posterDesktop, poster])

  // Video yükleme durumunu kontrol et
  React.useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current

      // Video zaten yüklenmişse (cache'den gelmiş olabilir)
      if (video.readyState >= 2) {
        setIsLoaded(true)
      }

      // Video yüklendiğinde kontrol et
      const checkLoaded = () => {
        if (video.readyState >= 2) {
          setIsLoaded(true)
        }
      }

      video.addEventListener('loadeddata', checkLoaded)
      video.addEventListener('canplay', checkLoaded)

      return () => {
        video.removeEventListener('loadeddata', checkLoaded)
        video.removeEventListener('canplay', checkLoaded)
      }
    }
    return undefined
  }, [src, srcMobile, srcDesktop])

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`} style={{minHeight: '200px'}}>
        <div className="text-center p-4">
          <span className="text-gray-400 text-sm block mb-2">Video yüklenemedi</span>
          <span className="text-gray-300 text-xs block">URL: {src || srcMobile || srcDesktop || 'Belirtilmemiş'}</span>
        </div>
      </div>
    )
  }

  // Art Direction kullanılıyorsa, video src'i dinamik olarak ayarla
  if (useArtDirection) {
    const videoSrc = getVideoSrc()
    return (
      <video
        ref={videoRef}
        poster={getPosterForScreen()}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline={playsInline}
        preload={preload}
        className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className}`}
        style={style}
        onLoadedData={handleLoadedData}
        onError={(e) => {
          // İlk hata source tag'lerinden gelirse, direkt src'i dene
          const video = e.currentTarget
          if (!video.src && videoSrc) {
            video.src = videoSrc
            video.load()
          } else {
            handleError(e)
          }
        }}
        onCanPlay={handleLoadedData}
      >
        {/* Mobil için video source */}
        {srcMobile && <source src={mobileSrc} type="video/mp4" media="(max-width: 768px)" />}
        {/* Desktop için video source */}
        {srcDesktop && <source src={desktopSrc} type="video/mp4" media="(min-width: 769px)" />}
        {/* Fallback source */}
        <source src={videoSrc} type="video/mp4" />
      </video>
    )
  }

  // Normal kullanım (Art Direction yok)
  // Video URL'i geçerliyse, önce source tag'lerini dene, sonra direkt src kullan
  return (
    <video
      ref={videoRef}
      poster={poster}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      controls={controls}
      playsInline={playsInline}
      preload={preload}
      className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className}`}
      style={style}
      onLoadedData={handleLoadedData}
      onError={(e) => {
        // İlk hata source tag'inden gelirse, direkt src'i dene
        const video = e.currentTarget
        if (video.src !== src && src) {
          video.src = src
          video.load()
        } else {
          handleError(e)
        }
      }}
      onCanPlay={handleLoadedData}
    >
      <source src={src} type="video/mp4" />
      {/* Fallback: Eğer source çalışmazsa, video element'inin src'i kullanılacak */}
    </video>
  )
}
