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
    // ERR_CACHE_OPERATION_NOT_SUPPORTED gibi cache hatalarını görmezden gel
    // Bu hatalar genellikle tarayıcı cache mekanizmasından kaynaklanır ve video yine de yüklenebilir
    const videoElement = e?.currentTarget
    if (videoElement?.error) {
      const error = videoElement.error
      // Sadece gerçek yükleme hatalarını yakala
      // MEDIA_ERR_SRC_NOT_SUPPORTED: Video formatı desteklenmiyor veya URL geçersiz
      if (error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        setHasError(true)
        onError?.()
        return
      }
      // Diğer hatalar (cache, network vb.) için sessizce devam et
      // Video yine de yüklenmeye çalışacak veya zaten yüklenmiş olabilir
      return
    }
    // Error event'i geldi ama error objesi yoksa, muhtemelen cache hatası
    // Bu durumda video yine de çalışabilir, bu yüzden görmezden gel
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
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Video yüklenemedi</span>
      </div>
    )
  }

  // Art Direction kullanılıyorsa, video src'i dinamik olarak ayarla
  if (useArtDirection) {
    return (
      <video
        ref={videoRef}
        src={getVideoSrc()}
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
        onError={handleError}
        onCanPlay={handleLoadedData}
      >
        {/* Mobil için video source */}
        {srcMobile && <source src={mobileSrc} media="(max-width: 768px)" />}
        {/* Desktop için video source */}
        {srcDesktop && <source src={desktopSrc} media="(min-width: 769px)" />}
      </video>
    )
  }

  // Normal kullanım (Art Direction yok)
  return (
    <video
      ref={videoRef}
      src={src}
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
      onError={handleError}
      onCanPlay={handleLoadedData}
    />
  )
}
