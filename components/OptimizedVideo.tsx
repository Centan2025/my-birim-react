import React, { useState, useRef } from 'react';

interface OptimizedVideoProps {
  src: string;
  className?: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  loading?: 'lazy' | 'eager';
  preload?: 'none' | 'metadata' | 'auto';
  onLoad?: () => void;
  onError?: () => void;
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
  poster,
  autoPlay = false,
  loop = false,
  muted = false,
  controls = false,
  playsInline = true,
  loading = 'lazy',
  preload = 'none', // Varsayılan olarak preload yok (performans için)
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const handleLoadedData = () => {
    setIsLoaded(true);
    onLoad?.();
  };
  
  const handleError = () => {
    setHasError(true);
    onError?.();
  };
  
  // Intersection Observer ile lazy loading
  React.useEffect(() => {
    if (loading === 'lazy' && videoRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && videoRef.current) {
              // Video görünür olduğunda yükle
              if (preload === 'none') {
                videoRef.current.preload = 'metadata';
              }
              observer.disconnect();
            }
          });
        },
        { rootMargin: '50px' }
      );
      
      observer.observe(videoRef.current);
      
      return () => observer.disconnect();
    }
  }, [loading, preload]);
  
  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Video yüklenemedi</span>
      </div>
    );
  }
  
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
      onLoadedData={handleLoadedData}
      onError={handleError}
    />
  );
};

