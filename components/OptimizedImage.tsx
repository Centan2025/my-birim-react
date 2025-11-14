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
  
  const optimizedSrc = getOptimizedUrl(src);
  
  // Responsive srcset oluştur
  const generateSrcSet = (): string => {
    if (srcSet) return srcSet;
    
    if (src.includes('cdn.sanity.io/images')) {
      const sizes = [400, 800, 1200, 1600, 2000];
      return sizes
        .map((w) => {
          const url = getOptimizedUrl(src);
          const urlObj = new URL(url);
          urlObj.searchParams.set('w', w.toString());
          return `${urlObj.toString()} ${w}w`;
        })
        .join(', ');
    }
    
    return '';
  };
  
  const responsiveSrcSet = generateSrcSet();
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1200px';
  
  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`} style={{ width, height }}>
        <span className="text-gray-400 text-sm">Görsel yüklenemedi</span>
      </div>
    );
  }
  
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

