import React, {useState, useRef, useCallback} from 'react'
import {rewriteR2Url, R2_DOMAIN, R2_ORIGIN_DOMAIN} from '../services/sanity/client'

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
 * - Multi-domain HTML5 source desteği (Worker CDN + R2 Origin fallback)
 * - YouTube ve geçersiz URL filtresi
 * - Preload & lazy loading yönetimi
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
  preload = 'none',
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

  // src prop'ları değiştiğinde state'leri sıfırla
  React.useEffect(() => {
    setIsLoaded(false)
    setHasError(false)
  }, [src, srcMobile, srcDesktop])

  const rawRwSrc = rewriteR2Url(src)
  const rawRwSrcMobile = rewriteR2Url(srcMobile)
  const rawRwSrcDesktop = rewriteR2Url(srcDesktop)

  const handleLoadedData = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = useCallback(
    (e?: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      // Eğer hata çocuk bir <source> etiketinden kabarmışsa (bubbling), göz ardı et
      if (e?.target && e.target !== e.currentTarget) {
        return
      }

      const videoElement = e?.currentTarget
      if (videoElement?.error) {
        const error = videoElement.error
        const codeAborted = typeof MediaError !== 'undefined' ? MediaError.MEDIA_ERR_ABORTED : 1

        // MEDIA_ERR_ABORTED için sessizce devam et (kullanıcı veya slider geçişi durdurmuş olabilir)
        if (error.code === codeAborted) {
          return
        }

        const currentSrc = videoElement.src || videoElement.currentSrc
        if (!currentSrc || currentSrc === window.location.href) {
          return
        }

        setHasError(true)
        onError?.()
      }
    },
    [onError]
  )

  // Intersection Observer ile lazy loading
  React.useEffect(() => {
    if (loading === 'lazy' && videoRef.current) {
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting && videoRef.current) {
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

  // Video URL'lerini seç ve YouTube kontrolü yap
  const getActiveSrc = (): string => {
    let rawSrc = rawRwSrc
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 768
      if (isMobile && rawRwSrcMobile) rawSrc = rawRwSrcMobile
      else if (!isMobile && rawRwSrcDesktop) rawSrc = rawRwSrcDesktop
    }

    if (!rawSrc) return ''
    if (rawSrc.includes('youtube.com') || rawSrc.includes('youtu.be')) return ''
    return rawSrc
  }

  const activeSrc = getActiveSrc()

  // Fallback domain URL'i üret (Worker CDN -> Direct R2)
  const getFallbackUrl = (primaryUrl: string): string => {
    if (!primaryUrl) return ''
    if (R2_DOMAIN && R2_ORIGIN_DOMAIN && R2_DOMAIN !== R2_ORIGIN_DOMAIN) {
      const r2DomainNoProtocol = R2_DOMAIN.replace(/^https?:\/\//, '')
      const originDomainNoProtocol = R2_ORIGIN_DOMAIN.replace(/^https?:\/\//, '')
      if (primaryUrl.includes(r2DomainNoProtocol)) {
        return primaryUrl.replace(r2DomainNoProtocol, originDomainNoProtocol)
      }
    }
    return ''
  }

  const fallbackSrc = getFallbackUrl(activeSrc)

  // Poster için Art Direction desteği
  const getPosterForScreen = useCallback((): string | undefined => {
    if (typeof window !== 'undefined') {
      const isMobileScreen = window.innerWidth <= 768
      if (isMobileScreen && posterMobile) return posterMobile
      if (!isMobileScreen && posterDesktop) return posterDesktop
    }
    return poster
  }, [poster, posterMobile, posterDesktop])

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

  // Handle autoPlay prop changes
  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (autoPlay) {
      if (typeof video.play === 'function') {
        const playPromise = video.play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (
              error.name !== 'AbortError' &&
              error.name !== 'NotAllowedError' &&
              error.name !== 'NotSupportedError'
            ) {
              /* silent catch */
            }
          })
        }
      }
    } else {
      if (typeof video.pause === 'function') {
        try {
          video.pause()
        } catch {
          /* ignore JSDOM / unhandled pause errors */
        }
      }
    }
  }, [autoPlay])

  // Source veya activeSrc değiştiğinde HTML5 video elementini reload et
  React.useEffect(() => {
    if (videoRef.current && typeof videoRef.current.load === 'function') {
      try {
        videoRef.current.load()
      } catch {
        /* ignore JSDOM / unhandled load errors */
      }
    }
  }, [activeSrc, fallbackSrc])

  // Video yükleme durumunu kontrol et
  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    if (video.readyState >= 1) {
      setIsLoaded(true)
    }

    const checkLoaded = () => {
      if (video.readyState >= 1) {
        setIsLoaded(true)
      }
    }

    video.addEventListener('loadedmetadata', checkLoaded)
    video.addEventListener('loadeddata', checkLoaded)
    video.addEventListener('canplay', checkLoaded)
    video.addEventListener('play', checkLoaded)
    video.addEventListener('playing', checkLoaded)

    // Mobil ve yavaş ağlar için fallback görünürlük zamanlayıcısı
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 1500)

    return () => {
      clearTimeout(timer)
      video.removeEventListener('loadedmetadata', checkLoaded)
      video.removeEventListener('loadeddata', checkLoaded)
      video.removeEventListener('canplay', checkLoaded)
      video.removeEventListener('play', checkLoaded)
      video.removeEventListener('playing', checkLoaded)
    }
  }, [activeSrc])

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{minHeight: '200px'}}
      >
        <div className="text-center p-4">
          <span className="text-gray-400 text-sm block mb-2">Video yüklenemedi</span>
          <span className="text-gray-300 text-xs block">URL: {activeSrc || 'Belirtilmemiş'}</span>
        </div>
      </div>
    )
  }

  if (!activeSrc) {
    return null
  }

  return (
    <video
      ref={videoRef}
      src={activeSrc}
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
      <source src={activeSrc} type="video/mp4" />
      {fallbackSrc && <source src={fallbackSrc} type="video/mp4" />}
      <track kind="captions" srcLang="en" label="English" />
    </video>
  )
}
