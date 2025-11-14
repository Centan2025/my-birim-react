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

// Art Direction: Farklı ekranlar için farklı görseller
<OptimizedImage
  src={imageUrl} // Fallback (mobil versiyonu yoksa kullanılır)
  srcMobile={mobileImageUrl} // Mobil için görsel (max-width: 768px)
  srcDesktop={desktopImageUrl} // Desktop için görsel (min-width: 769px)
  alt="Açıklama"
  className="w-full h-auto"
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

// Art Direction: Farklı ekranlar için farklı videolar
<OptimizedVideo
  src={videoUrl} // Fallback (mobil versiyonu yoksa kullanılır)
  srcMobile={mobileVideoUrl} // Mobil için video (max-width: 768px)
  srcDesktop={desktopVideoUrl} // Desktop için video (min-width: 769px)
  poster={posterImageUrl} // Fallback poster
  posterMobile={mobilePosterUrl} // Mobil için poster
  posterDesktop={desktopPosterUrl} // Desktop için poster
  className="w-full"
  controls
/>
```

### 2. Video Optimizasyon İpuçları

- **Poster Image**: Her video için poster image ekleyin (ilk frame görüntüsü)
- **Preload**: Sadece görünür videolar için `preload="auto"`, diğerleri için `preload="none"`
- **Format**: MP4 formatı kullanın (en iyi tarayıcı desteği)
- **Compression**: Videoları yüklemeden önce sıkıştırın (HandBrake, FFmpeg)

## 🎨 Art Direction (Farklı Ekranlar İçin Farklı Medya)

Art Direction özelliği, farklı ekran boyutları için farklı medya dosyaları kullanmanıza olanak tanır. Bu özellik özellikle mobil ve desktop için farklı kompozisyonlar gerektiğinde kullanışlıdır.

### Nasıl Çalışır?

- **Mobil için medya varsa**: Mobil cihazlarda (max-width: 768px) mobil versiyonu gösterilir
- **Desktop için medya varsa**: Desktop cihazlarda (min-width: 769px) desktop versiyonu gösterilir
- **Fallback**: Eğer mobil versiyonu yoksa, desktop versiyonu kullanılır. O da yoksa `src` prop'u kullanılır

### Görseller İçin Art Direction

```tsx
<OptimizedImage
  src={defaultImage} // Fallback
  srcMobile={mobileImage} // Mobil için (opsiyonel)
  srcDesktop={desktopImage} // Desktop için (opsiyonel)
  alt="Açıklama"
  className="w-full"
/>
```

### Videolar İçin Art Direction

```tsx
<OptimizedVideo
  src={defaultVideo} // Fallback
  srcMobile={mobileVideo} // Mobil için (opsiyonel)
  srcDesktop={desktopVideo} // Desktop için (opsiyonel)
  poster={defaultPoster} // Fallback poster
  posterMobile={mobilePoster} // Mobil için poster (opsiyonel)
  posterDesktop={desktopPoster} // Desktop için poster (opsiyonel)
  className="w-full"
  controls
/>
```

### Art Direction Kullanım Senaryoları

1. **Hero Section**: Mobilde dikey, desktop'ta yatay kompozisyon
2. **Product Images**: Mobilde yakın çekim, desktop'ta geniş açı
3. **Video Backgrounds**: Mobilde daha kısa/düşük kaliteli, desktop'ta yüksek kaliteli
4. **Banner Images**: Mobilde farklı crop, desktop'ta tam görsel

## 🚀 Best Practices

### Görseller İçin:

1. **Lazy Loading**: Above-the-fold dışındaki tüm görseller için `loading="lazy"` kullanın
2. **Responsive Images**: `srcset` ve `sizes` attribute'larını kullanın
3. **Art Direction**: Farklı ekranlar için farklı görseller kullanın (`srcMobile`, `srcDesktop`)
4. **WebP Format**: Modern tarayıcılar için WebP, eski tarayıcılar için otomatik fallback
5. **Kalite**: %80-85 kalite genellikle yeterlidir (görsel kalite kaybı minimal)
6. **Boyut**: Görselleri görüntülenecek boyuttan daha büyük yüklemeyin

### Videolar İçin:

1. **Poster Images**: Her video için poster image ekleyin
2. **Art Direction**: Farklı ekranlar için farklı videolar kullanın (`srcMobile`, `srcDesktop`)
3. **Poster Art Direction**: Farklı ekranlar için farklı poster'lar kullanın (`posterMobile`, `posterDesktop`)
4. **Preload Control**: Sadece görünür videolar için preload yapın
5. **Compression**: Videoları yüklemeden önce optimize edin
6. **Format**: MP4 (H.264 codec) en iyi uyumluluk için
7. **Multiple Qualities**: Farklı kalitelerde video sunun (adaptive streaming)

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

### Art Direction ile Hero Section
```tsx
<OptimizedImage
  src={heroImage} // Fallback
  srcMobile={heroImageMobile} // Mobil için özel kompozisyon
  srcDesktop={heroImageDesktop} // Desktop için özel kompozisyon
  alt="Hero"
  loading="eager"
  className="w-full h-screen object-cover"
  quality={90}
/>
```

### Art Direction ile Video Hero
```tsx
<OptimizedVideo
  src={heroVideo} // Fallback
  srcMobile={heroVideoMobile} // Mobil için daha kısa/düşük kaliteli
  srcDesktop={heroVideoDesktop} // Desktop için yüksek kaliteli
  poster={heroPoster}
  posterMobile={heroPosterMobile}
  posterDesktop={heroPosterDesktop}
  autoPlay
  loop
  muted
  playsInline
  preload="auto"
  className="absolute inset-0 w-full h-full object-cover"
/>
```

