import React, { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
  sizes?: string;
  srcSet?: string;
  // Art Direction: Farklı ekranlar için farklı görseller
  srcMobile?: string; // Mobil için görsel (varsa)
  srcDesktop?: string; // Desktop için görsel (varsa)
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimize edilmiş görsel component'i
 * - Lazy loading desteği
 * - WebP format desteği
 * - Responsive images (srcset)
 * - Placeholder gösterimi
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  quality = 85,
  format = 'webp',
  sizes,
  srcSet,
  srcMobile,
  srcDesktop,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Placeholder (çok küçük, gri renk)
  const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4=';
  
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };
  
  const handleError = () => {
    setHasError(true);
    onError?.();
  };
  
  // Sanity image URL'lerini optimize et
  const getOptimizedUrl = (url: string): string => {
    if (!url) return placeholder;
    
    // Eğer zaten Sanity CDN URL'i ise, optimizasyon parametreleri ekle
    if (url.includes('cdn.sanity.io/images')) {
      const urlObj = new URL(url);
      
      // Mevcut parametreleri koru, yeni parametreler ekle
      if (width) urlObj.searchParams.set('w', width.toString());
      if (height) urlObj.searchParams.set('h', height.toString());
      urlObj.searchParams.set('q', quality.toString());
      urlObj.searchParams.set('fm', format);
      urlObj.searchParams.set('auto', 'format'); // WebP desteklenmiyorsa otomatik fallback
      
      return urlObj.toString();
    }
    
    return url;
  };
  
  // Art Direction: srcMobile veya srcDesktop varsa kullan, yoksa src'i kullan
  const mobileSrc = srcMobile || src;
  const desktopSrc = srcDesktop || src;
  const optimizedMobileSrc = getOptimizedUrl(mobileSrc);
  const optimizedDesktopSrc = getOptimizedUrl(desktopSrc);
  const optimizedSrc = getOptimizedUrl(src);
  
  // Responsive srcset oluştur
  const generateSrcSet = (baseUrl: string): string => {
    if (srcSet) return srcSet;
    
    if (baseUrl.includes('cdn.sanity.io/images')) {
      const sizes = [400, 800, 1200, 1600, 2000];
      return sizes
        .map((w) => {
          const url = getOptimizedUrl(baseUrl);
          const urlObj = new URL(url);
          urlObj.searchParams.set('w', w.toString());
          return `${urlObj.toString()} ${w}w`;
        })
        .join(', ');
    }
    
    return '';
  };
  
  const responsiveSrcSet = generateSrcSet(src);
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1200px';

  // Art Direction kullanılıyor mu? (srcMobile veya srcDesktop varsa)
  const useArtDirection = Boolean(srcMobile || srcDesktop);

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`} style={{ width, height }}>
        <span className="text-gray-400 text-sm">Görsel yüklenemedi</span>
      </div>
    );
  }

  // Art Direction ile picture elementi kullan
  if (useArtDirection) {
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        {!isLoaded && (
          <img
            src={placeholder}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-sm"
            aria-hidden="true"
          />
        )}
        <picture>
          {/* Mobil için görsel (max-width: 768px) */}
          {srcMobile && (
            <source
              media="(max-width: 768px)"
              srcSet={generateSrcSet(mobileSrc) || optimizedMobileSrc}
              sizes={defaultSizes}
            />
          )}
          {/* Desktop için görsel (min-width: 769px) */}
          {srcDesktop && (
            <source
              media="(min-width: 769px)"
              srcSet={generateSrcSet(desktopSrc) || optimizedDesktopSrc}
              sizes={defaultSizes}
            />
          )}
          {/* Fallback: Eğer mobil versiyonu yoksa desktop'u kullan, o da yoksa src'i kullan */}
          <img
            src={srcMobile ? optimizedMobileSrc : (srcDesktop ? optimizedDesktopSrc : optimizedSrc)}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className}`}
            onLoad={handleLoad}
            onError={handleError}
            decoding="async"
          />
        </picture>
      </div>
    );
  }

  // Normal kullanım (Art Direction yok)
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {!isLoaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
          aria-hidden="true"
        />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        srcSet={responsiveSrcSet || undefined}
        sizes={responsiveSrcSet ? defaultSizes : undefined}
        className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
      />
    </div>
  );
};

