# Medya Optimizasyonu Kılavuzu

Bu projede görseller ve videolar için optimizasyon araçları mevcuttur.

## 📸 Görsel Optimizasyonu

### 1. OptimizedImage Component Kullanımı

```tsx
import { OptimizedImage } from '../components/OptimizedImage';

// Basit kullanım
<OptimizedImage
  src={imageUrl}
  alt="Açıklama"
  className="w-full h-auto"
/>

// Responsive image ile
<OptimizedImage
  src={imageUrl}
  alt="Açıklama"
  className="w-full h-auto"
  width={1200}
  height={800}
  quality={85}
  format="webp"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1200px"
/>

// Eager loading (above the fold için)
<OptimizedImage
  src={heroImageUrl}
  alt="Hero görsel"
  loading="eager"
  className="w-full"
/>
```

### 2. Sanity Image URL Optimizasyonu

`services/cms.ts` dosyasındaki `mapImage` fonksiyonu artık otomatik olarak:
- **WebP formatı** kullanıyor (daha küçük dosya boyutu)
- **%85 kalite** ile optimize ediyor
- **1600px genişlik** ile sınırlandırıyor
- **Auto format** ile WebP desteklenmiyorsa otomatik fallback yapıyor

### 3. Manuel Optimizasyon

```tsx
import { getOptimizedImageUrl } from '../src/lib/mediaOptimization';

const optimizedUrl = getOptimizedImageUrl(sanityImageAsset, {
  width: 1200,
  height: 800,
  quality: 85,
  format: 'webp',
  fit: 'crop'
});
```

## 🎥 Video Optimizasyonu

### 1. OptimizedVideo Component Kullanımı

```tsx
import { OptimizedVideo } from '../components/OptimizedVideo';

// Basit kullanım
<OptimizedVideo
  src={videoUrl}
  className="w-full"
  controls
/>

// Lazy loading ile
<OptimizedVideo
  src={videoUrl}
  className="w-full"
  poster={posterImageUrl}
  loading="lazy"
  preload="none"
  controls
/>

// Autoplay video (hero section için)
<OptimizedVideo
  src={videoUrl}
  className="w-full h-full"
  autoPlay
  loop
  muted
  playsInline
  preload="auto"
/>
```

### 2. Video Optimizasyon İpuçları

- **Poster Image**: Her video için poster image ekleyin (ilk frame görüntüsü)
- **Preload**: Sadece görünür videolar için `preload="auto"`, diğerleri için `preload="none"`
- **Format**: MP4 formatı kullanın (en iyi tarayıcı desteği)
- **Compression**: Videoları yüklemeden önce sıkıştırın (HandBrake, FFmpeg)

## 🚀 Best Practices

### Görseller İçin:

1. **Lazy Loading**: Above-the-fold dışındaki tüm görseller için `loading="lazy"` kullanın
2. **Responsive Images**: `srcset` ve `sizes` attribute'larını kullanın
3. **WebP Format**: Modern tarayıcılar için WebP, eski tarayıcılar için otomatik fallback
4. **Kalite**: %80-85 kalite genellikle yeterlidir (görsel kalite kaybı minimal)
5. **Boyut**: Görselleri görüntülenecek boyuttan daha büyük yüklemeyin

### Videolar İçin:

1. **Poster Images**: Her video için poster image ekleyin
2. **Preload Control**: Sadece görünür videolar için preload yapın
3. **Compression**: Videoları yüklemeden önce optimize edin
4. **Format**: MP4 (H.264 codec) en iyi uyumluluk için
5. **Multiple Qualities**: Farklı kalitelerde video sunun (adaptive streaming)

## 📊 Performans Metrikleri

Optimizasyon sonrası beklenen iyileştirmeler:
- **Görsel boyutu**: %60-80 azalma (WebP kullanımı ile)
- **Sayfa yükleme süresi**: %40-60 iyileşme
- **Bandwidth kullanımı**: %50-70 azalma
- **Core Web Vitals**: İyileşme (LCP, CLS)

## 🔧 Sanity CMS'de Optimizasyon

Sanity'de görseller yüklenirken:
- Otomatik olarak optimize edilir
- WebP formatı desteklenir
- Responsive URL'ler oluşturulur

Örnek URL formatı:
```
https://cdn.sanity.io/images/{project}/{dataset}/{imageId}-{width}x{height}.{format}?q={quality}&auto=format
```

## 📝 Örnekler

### Hero Section Görseli
```tsx
<OptimizedImage
  src={heroImage}
  alt="Hero"
  loading="eager" // Above the fold
  className="w-full h-screen object-cover"
  quality={90} // Yüksek kalite
/>
```

### Product Card Görseli
```tsx
<OptimizedImage
  src={productImage}
  alt={productName}
  loading="lazy" // Lazy load
  className="w-full h-64 object-cover"
  width={400}
  height={400}
  quality={80}
/>
```

### Video Background
```tsx
<OptimizedVideo
  src={backgroundVideo}
  autoPlay
  loop
  muted
  playsInline
  preload="auto"
  className="absolute inset-0 w-full h-full object-cover"
/>
```

