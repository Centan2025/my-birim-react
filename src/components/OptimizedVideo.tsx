import React, {useState, useRef, useCallback} from 'react'
import {rewriteR2Url} from '../services/sanity/client'

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
  onClick?: React.MouseEventHandler<HTMLVideoElement>
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
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // src zaten cms.ts tarafından rewrite edilerek geliyor (BUG-1 düzeltildi)
  // Ancak çift koruma için burada da rewriteR2Url çağırabiliriz.
  const rwSrc = rewriteR2Url(src)
  const rwSrcMobile = rewriteR2Url(srcMobile)
  const rwSrcDesktop = rewriteR2Url(srcDesktop)

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

      // MEDIA_ERR_ABORTED için sessizce devam et (kullanıcı veya slider geçişi durdurmuş olabilir)
      if (error.code === MediaError.MEDIA_ERR_ABORTED) {
        return
      }

      // Sadece gerçek yükleme hatalarını yakala
      if (
        error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ||
        error.code === MediaError.MEDIA_ERR_NETWORK ||
        error.code === MediaError.MEDIA_ERR_DECODE
      ) {
        console.warn('Video yükleme uyarısı/hatası:', {
          code: error.code,
          message: error.message,
          videoSrc: videoElement.src || videoElement.currentSrc,
          errorCode: {
            1: 'MEDIA_ERR_ABORTED',
            2: 'MEDIA_ERR_NETWORK',
            3: 'MEDIA_ERR_DECODE',
            4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
          }[error.code],
        })
        setHasError(true)
        onError?.()
        return
      }
      return
    }
    // Error event'i geldi ama error objesi yoksa, muhtemelen cache hatası
    // Bu durumda video yine de çalışabilir, bu yüzden görmezden gel
    console.warn('Video error event tetiklendi ama error objesi yok:', {
      videoSrc: videoElement?.src || videoElement?.currentSrc,
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
  const mobileSrc = rwSrcMobile || rwSrc
  const desktopSrc = rwSrcDesktop || rwSrc
  const useArtDirection = Boolean(rwSrcMobile || rwSrcDesktop)

  // Poster için de Art Direction desteği
  const getPosterForScreen = useCallback((): string | undefined => {
    if (typeof window !== 'undefined') {
      const isMobileScreen = window.innerWidth <= 768
      if (isMobileScreen && posterMobile) return posterMobile
      if (!isMobileScreen && posterDesktop) return posterDesktop
    }
    return poster
  }, [poster, posterMobile, posterDesktop])

  // Video src'i için ekran boyutuna göre seç
  const getVideoSrc = (): string => {
    let rawSrc = rwSrc
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 768
      if (isMobile && rwSrcMobile) rawSrc = mobileSrc
      else if (!isMobile && rwSrcDesktop) rawSrc = desktopSrc
    }

    if (!rawSrc) return ''
    try {
      // URL segmentlerini trim et ve encode et
      const parts = rawSrc.split('/')
      const trimmedSrc = parts
        .map((p, i) => {
          if (i < 3 && p.includes(':')) return p
          return p.trim()
        })
        .join('/')

      return encodeURI(decodeURI(trimmedSrc)).replace(/ /g, '%20')
    } catch {
      return rawSrc.replace(/ /g, '%20')
    }
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
  }, [posterMobile, posterDesktop, poster, getPosterForScreen])

  // Handle autoPlay prop changes (for carousel/slider scenarios)
  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (autoPlay) {
      // Try to play the video
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // If play is interrupted by a pause() call, it throws an AbortError.
          // We can safely ignore AbortErrors to avoid console spam.
          if (error.name !== 'AbortError') {
            console.warn('Video autoplay prevented:', error)
          }
        })
      }
    } else {
      // Pause the video when not active
      video.pause()
    }
  }, [autoPlay])

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
  }, [rwSrc, rwSrcMobile, rwSrcDesktop])

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{minHeight: '200px'}}
      >
        <div className="text-center p-4">
          <span className="text-gray-400 text-sm block mb-2">Video yüklenemedi</span>
          <span className="text-gray-300 text-xs block">
            URL: {rwSrc || rwSrcMobile || rwSrcDesktop || 'Belirtilmemiş'}
          </span>
        </div>
      </div>
    )
  }

  // Don't render a video element if there's no source at all
  if (!rwSrc && !rwSrcMobile && !rwSrcDesktop) {
    return null
  }

  // Art Direction kullanılıyorsa, video src'i dinamik olarak ayarla
  if (useArtDirection) {
    const videoSrc = getVideoSrc()
    return (
      <video
        ref={videoRef}
        src={videoSrc}
        poster={getPosterForScreen()}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline={playsInline}
        preload={preload}
        className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className}`}
        style={style}
        onClick={onClick}
        onLoadedData={handleLoadedData}
        onError={handleError}
        onCanPlay={handleLoadedData}
      >
        <track kind="captions" srcLang="en" label="English" />
      </video>
    )
  }

  // Normal kullanım (Art Direction yok)
  return (
    <video
      ref={videoRef}
      src={rwSrc}
      poster={poster}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      controls={controls}
      playsInline={playsInline}
      preload={preload}
      className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className}`}
      style={style}
      onClick={onClick}
      onLoadedData={handleLoadedData}
      onError={handleError}
      onCanPlay={handleLoadedData}
    >
      <track kind="captions" srcLang="en" label="English" />
    </video>
  )
}
