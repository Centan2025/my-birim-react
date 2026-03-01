# 📸 Medya Rehberi - Birim Web Projesi

Bu rehber, Birim Web projesinde kullanılan tüm medya dosyalarının (görseller, videolar) nasıl hazırlanması, yüklenmesi ve kullanılması gerektiğini detaylı olarak açıklar.

## 📋 İçindekiler

1. [Görsel Medya Standartları](#görsel-medya-standartları)
2. [Video Medya Standartları](#video-medya-standartları)
3. [Sanity CMS'de Medya Yükleme](#sanity-cmsde-medya-yükleme)
4. [Art Direction (Mobil/Desktop)](#art-direction-mobildesktop)
5. [Kod Kullanımı](#kod-kullanımı)
6. [Best Practices](#best-practices)
7. [Dosya Boyutu Limitleri](#dosya-boyutu-limitleri)
8. [Optimizasyon Araçları](#optimizasyon-araçları)
9. [Sık Karşılaşılan Sorunlar](#sık-karşılaşılan-sorunlar)

---

## 📸 Görsel Medya Standartları

### Desteklenen Formatlar

- **WebP** (Önerilen - en küçük dosya boyutu)
- **JPEG/JPG** (Yaygın kullanım)
- **PNG** (Şeffaflık gerektiğinde)

### Görsel Boyut Önerileri

#### Hero Görselleri (Ana Sayfa, Kategori Sayfaları)

- **Desktop**: 1920x1080px (16:9) veya 1920x1200px (16:10)
- **Mobil**: 768x1024px (3:4) veya 1080x1920px (9:16)
- **Kalite**: %85-90
- **Maksimum Dosya Boyutu**: 500KB (optimize edilmiş)

#### Ürün Ana Görselleri

- **Desktop**: 1200x1200px (1:1) veya 1200x1600px (3:4)
- **Mobil**: 800x800px (1:1) veya 800x1067px (3:4)
- **Kalite**: %85
- **Maksimum Dosya Boyutu**: 300KB (optimize edilmiş)

#### Ürün Alternatif Görselleri

- **Desktop**: 1200x800px (3:2) veya 1200x900px (4:3)
- **Mobil**: 800x600px (4:3)
- **Kalite**: %80-85
- **Maksimum Dosya Boyutu**: 250KB (optimize edilmiş)

#### Ürün Ölçü Görselleri (Dimension Images)

- **Desktop**: 1600x1200px (4:3) veya 1600x900px (16:9)
- **Mobil**: 800x600px (4:3)
- **Kalite**: %80
- **Maksimum Dosya Boyutu**: 400KB (optimize edilmiş)
- **Format**: PNG (teknik çizimler için)

#### Malzeme Görselleri

- **Boyut**: 400x400px (1:1)
- **Kalite**: %80
- **Maksimum Dosya Boyutu**: 100KB (optimize edilmiş)

#### Kart Görselleri (Product Card, Designer Card)

- **Boyut**: 600x600px (1:1) veya 600x800px (3:4)
- **Kalite**: %80
- **Maksimum Dosya Boyutu**: 150KB (optimize edilmiş)

#### Logo ve İkonlar

- **Boyut**: 512x512px (1:1) veya SVG formatı (önerilen)
- **Format**: PNG (şeffaflık için) veya SVG
- **Maksimum Dosya Boyutu**: 50KB

### Aspect Ratio Önerileri

| Kullanım Alanı   | Önerilen Aspect Ratio        | Notlar                                      |
| ---------------- | ---------------------------- | ------------------------------------------- |
| Hero Görselleri  | 16:9 (desktop), 9:16 (mobil) | Geniş ekranlar için yatay, mobil için dikey |
| Ürün Ana Görseli | 1:1 veya 3:4                 | Kare veya dikey dikdörtgen                  |
| Ürün Galeri      | 3:2 veya 4:3                 | Yatay dikdörtgen                            |
| Ölçü Görselleri  | 4:3 veya 16:9                | Teknik çizimler için                        |
| Kart Görselleri  | 1:1                          | Kare format                                 |

---

## 🎥 Video Medya Standartları

### Desteklenen Formatlar

- **MP4** (H.264 codec - Önerilen)
- **WebM** (Opsiyonel, daha küçük dosya boyutu)
- **YouTube URL** (Harici video servisleri için)

### Video Boyut Önerileri

#### Hero Videoları (Ana Sayfa)

- **Desktop**:
  - Çözünürlük: 1920x1080px (Full HD)
  - Bitrate: 5-8 Mbps
  - Frame Rate: 30fps
  - Süre: 10-30 saniye (loop için)
  - Maksimum Dosya Boyutu: 10MB
- **Mobil**:
  - Çözünürlük: 1080x1920px (Dikey) veya 1080x608px (Yatay)
  - Bitrate: 2-4 Mbps
  - Frame Rate: 30fps
  - Süre: 10-20 saniye
  - Maksimum Dosya Boyutu: 5MB

#### Ürün Videoları

- **Desktop**:
  - Çözünürlük: 1280x720px (HD) veya 1920x1080px (Full HD)
  - Bitrate: 3-5 Mbps
  - Frame Rate: 30fps
  - Maksimum Dosya Boyutu: 15MB
- **Mobil**:
  - Çözünürlük: 720x1280px (Dikey) veya 720x404px (Yatay)
  - Bitrate: 1.5-3 Mbps
  - Frame Rate: 30fps
  - Maksimum Dosya Boyutu: 8MB

#### Arka Plan Videoları (Background)

- **Desktop**:
  - Çözünürlük: 1920x1080px
  - Bitrate: 4-6 Mbps
  - Frame Rate: 30fps
  - Süre: 15-60 saniye (loop)
  - Maksimum Dosya Boyutu: 20MB
- **Mobil**:
  - Çözünürlük: 1080x1920px
  - Bitrate: 2-3 Mbps
  - Frame Rate: 30fps
  - Maksimum Dosya Boyutu: 10MB

### Video Optimizasyon Ayarları

#### FFmpeg ile Optimizasyon

```bash
# Desktop video için
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 128k -movflags +faststart output.mp4

# Mobil video için (daha düşük bitrate)
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 25 -vf scale=1080:1920 -c:a aac -b:a 96k -movflags +faststart output_mobile.mp4
```

#### HandBrake Ayarları

- **Preset**: Fast 1080p30 veya Fast 720p30
- **Quality**: RF 23 (Desktop), RF 25 (Mobil)
- **Audio**: AAC, 128kbps (Desktop), 96kbps (Mobil)
- **Web Optimized**: ✅ (Fast Start)

### Poster Image (Video Önizleme)

Her video için poster image (ilk frame görüntüsü) eklenmelidir:

- **Boyut**: Video ile aynı aspect ratio
- **Format**: WebP veya JPEG
- **Kalite**: %85
- **Maksimum Dosya Boyutu**: 200KB

---

## 🗄️ Sanity CMS'de Medya Yükleme

### Görsel Yükleme

1. **Sanity Studio'da Görsel Yükleme**:
   - Görsel alanına tıklayın
   - "Upload" butonuna tıklayın
   - Dosyayı seçin
   - **Hotspot** ayarlayın (önemli görsel alanları işaretlemek için)

2. **Art Direction için Görsel Yükleme**:
   - **Ana Görsel (Tüm Cihazlar)**: Varsayılan görsel
   - **Mobil Görsel**: Mobil cihazlar için özel görsel (opsiyonel)
   - **Desktop Görsel**: Desktop cihazlar için özel görsel (opsiyonel)

3. **Hotspot Kullanımı**:
   - Görselin önemli kısmını işaretleyin
   - Crop işlemlerinde bu alan korunur

### Video Yükleme

1. **Sanity Studio'da Video Yükleme**:
   - Video alanına tıklayın
   - "Upload" butonuna tıklayın
   - MP4 dosyasını seçin
   - Yükleme tamamlanana kadar bekleyin

2. **Art Direction için Video Yükleme**:
   - **Ana Video (Tüm Cihazlar)**: Varsayılan video
   - **Mobil Video**: Mobil cihazlar için özel video (opsiyonel)
   - **Desktop Video**: Desktop cihazlar için özel video (opsiyonel)

3. **YouTube URL Kullanımı**:
   - Video türünü "YouTube" olarak seçin
   - YouTube URL'ini girin (örn: `https://www.youtube.com/watch?v=VIDEO_ID`)

### Dosya İsimlendirme Kuralları

- **Görseller**:
  - Format: `{kategori}-{isim}-{boyut}.{uzanti}`
  - Örnek: `urun-ana-koltuk-desktop.jpg`, `urun-ana-koltuk-mobile.webp`
- **Videolar**:
  - Format: `{kategori}-{isim}-{boyut}.mp4`
  - Örnek: `hero-ana-sayfa-desktop.mp4`, `hero-ana-sayfa-mobile.mp4`

### Sanity Otomatik Optimizasyon

Sanity CDN otomatik olarak:

- **WebP formatına** dönüştürür (destekleniyorsa)
- **Responsive URL'ler** oluşturur
- **Kalite optimizasyonu** yapar
- **Boyut optimizasyonu** yapar

URL Formatı:

```
https://cdn.sanity.io/images/{projectId}/{dataset}/{imageId}-{width}x{height}.{format}?q={quality}&auto=format
```

---

## 🎨 Art Direction (Mobil/Desktop)

### Ne Zaman Kullanılmalı?

Art Direction, farklı ekran boyutları için farklı medya dosyaları kullanmanıza olanak tanır. Şu durumlarda kullanılmalıdır:

1. **Farklı Kompozisyonlar**: Mobilde dikey, desktop'ta yatay görsel
2. **Farklı Crop'lar**: Mobilde yakın çekim, desktop'ta geniş açı
3. **Performans**: Mobilde daha küçük/düşük kaliteli medya
4. **İçerik Farklılıkları**: Mobilde farklı içerik gösterilmesi gerektiğinde

### Görseller İçin Art Direction

#### Sanity Schema'da

```typescript
// Ana görsel (tüm cihazlar için)
mainImage: {
  type: 'image'
}

// Mobil görsel (opsiyonel)
mainImageMobile: {
  type: 'image'
}

// Desktop görsel (opsiyonel)
mainImageDesktop: {
  type: 'image'
}
```

#### Kod Kullanımı

```tsx
<OptimizedImage
  src={product.mainImage.url} // Fallback
  srcMobile={product.mainImage.urlMobile} // Mobil (max-width: 768px)
  srcDesktop={product.mainImage.urlDesktop} // Desktop (min-width: 769px)
  alt={product.name}
  className="w-full"
/>
```

### Videolar İçin Art Direction

#### Sanity Schema'da

```typescript
// Ana video (tüm cihazlar için)
videoFile: { type: 'file', accept: 'video/*' }

// Mobil video (opsiyonel)
videoFileMobile: { type: 'file', accept: 'video/*' }

// Desktop video (opsiyonel)
videoFileDesktop: { type: 'file', accept: 'video/*' }
```

#### Kod Kullanımı

```tsx
<OptimizedVideo
  src={media.url} // Fallback
  srcMobile={media.urlMobile} // Mobil (max-width: 768px)
  srcDesktop={media.urlDesktop} // Desktop (min-width: 769px)
  poster={posterUrl}
  posterMobile={posterMobileUrl}
  posterDesktop={posterDesktopUrl}
  className="w-full"
  controls
/>
```

### Art Direction Kullanım Senaryoları

1. **Hero Section**:
   - Mobil: Dikey görsel (9:16)
   - Desktop: Yatay görsel (16:9)

2. **Ürün Ana Görseli**:
   - Mobil: Yakın çekim, dikey
   - Desktop: Geniş açı, yatay

3. **Video Background**:
   - Mobil: Daha kısa, düşük kaliteli
   - Desktop: Uzun, yüksek kaliteli

4. **Banner Görselleri**:
   - Mobil: Farklı crop, önemli alan vurgulanmış
   - Desktop: Tam görsel

---

## 💻 Kod Kullanımı

### OptimizedImage Component

#### Temel Kullanım

```tsx
import {OptimizedImage} from '../components/OptimizedImage'
;<OptimizedImage src={imageUrl} alt="Açıklama" className="w-full h-auto" />
```

#### Responsive Image

```tsx
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
```

#### Eager Loading (Above the Fold)

```tsx
<OptimizedImage
  src={heroImageUrl}
  alt="Hero görsel"
  loading="eager"
  className="w-full"
  quality={90}
/>
```

#### Art Direction

```tsx
<OptimizedImage
  src={imageUrl} // Fallback
  srcMobile={mobileImageUrl} // Mobil (max-width: 768px)
  srcDesktop={desktopImageUrl} // Desktop (min-width: 769px)
  alt="Açıklama"
  className="w-full h-auto"
/>
```

### OptimizedVideo Component

#### Temel Kullanım

```tsx
import {OptimizedVideo} from '../components/OptimizedVideo'
;<OptimizedVideo src={videoUrl} className="w-full" controls />
```

#### Lazy Loading

```tsx
<OptimizedVideo
  src={videoUrl}
  className="w-full"
  poster={posterImageUrl}
  loading="lazy"
  preload="none"
  controls
/>
```

#### Autoplay Video (Hero)

```tsx
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

#### Art Direction

```tsx
<OptimizedVideo
  src={videoUrl} // Fallback
  srcMobile={mobileVideoUrl} // Mobil (max-width: 768px)
  srcDesktop={desktopVideoUrl} // Desktop (min-width: 769px)
  poster={posterImageUrl}
  posterMobile={mobilePosterUrl}
  posterDesktop={desktopPosterUrl}
  className="w-full"
  controls
/>
```

### Manuel Optimizasyon Fonksiyonları

```tsx
import {getOptimizedImageUrl} from '../src/lib/mediaOptimization'

const optimizedUrl = getOptimizedImageUrl(sanityImageAsset, {
  width: 1200,
  height: 800,
  quality: 85,
  format: 'webp',
  fit: 'crop',
})
```

---

## 🚀 Best Practices

### Görseller İçin

1. **Lazy Loading**:
   - Above-the-fold dışındaki tüm görseller için `loading="lazy"` kullanın
   - Above-the-fold görseller için `loading="eager"` kullanın

2. **Responsive Images**:
   - `srcset` ve `sizes` attribute'larını kullanın
   - Component otomatik olarak oluşturur

3. **Art Direction**:
   - Farklı ekranlar için farklı görseller kullanın (`srcMobile`, `srcDesktop`)
   - Özellikle hero ve ürün görselleri için önemli

4. **Format Seçimi**:
   - WebP formatı kullanın (daha küçük dosya boyutu)
   - Eski tarayıcılar için otomatik fallback yapılır

5. **Kalite Ayarları**:
   - %80-85 kalite genellikle yeterlidir
   - Hero görselleri için %90 kullanılabilir
   - Görsel kalite kaybı minimal

6. **Boyut Optimizasyonu**:
   - Görselleri görüntülenecek boyuttan daha büyük yüklemeyin
   - Sanity otomatik olarak optimize eder

7. **Alt Text**:
   - Her görsel için anlamlı `alt` text ekleyin
   - SEO ve erişilebilirlik için önemli

### Videolar İçin

1. **Poster Images**:
   - Her video için poster image ekleyin
   - İlk frame görüntüsü veya özel tasarlanmış poster

2. **Art Direction**:
   - Farklı ekranlar için farklı videolar kullanın
   - Mobilde daha küçük/düşük kaliteli video

3. **Preload Control**:
   - Sadece görünür videolar için `preload="auto"`
   - Diğerleri için `preload="none"` veya `preload="metadata"`

4. **Compression**:
   - Videoları yüklemeden önce optimize edin
   - FFmpeg veya HandBrake kullanın

5. **Format**:
   - MP4 (H.264 codec) en iyi uyumluluk için
   - WebM opsiyonel olarak eklenebilir

6. **Autoplay**:
   - Sadece muted videolar için autoplay kullanın
   - `playsInline` attribute'unu ekleyin (mobil için)

7. **Loop**:
   - Arka plan videoları için loop kullanın
   - Kısa videolar (10-30 saniye) tercih edin

### Genel Best Practices

1. **Dosya Boyutu**:
   - Görseller: Maksimum 500KB (optimize edilmiş)
   - Videolar: Maksimum 20MB (desktop), 10MB (mobil)

2. **CDN Kullanımı**:
   - Tüm medya Sanity CDN üzerinden servis edilir
   - Otomatik optimizasyon ve caching

3. **Caching**:
   - Sanity CDN otomatik olarak cache yapar
   - URL değişmediği sürece cache kullanılır

4. **Error Handling**:
   - Component'ler otomatik olarak hata yönetimi yapar
   - Görsel/video yüklenemezse placeholder gösterilir

---

## 📏 Dosya Boyutu Limitleri

### Görseller

| Kullanım Alanı             | Maksimum Boyut (Optimize Edilmiş) | Notlar                       |
| -------------------------- | --------------------------------- | ---------------------------- |
| Hero Görselleri            | 500KB                             | Yüksek kalite, büyük görsel  |
| Ürün Ana Görseli           | 300KB                             | Orta kalite                  |
| Ürün Alternatif Görselleri | 250KB                             | Orta kalite                  |
| Ölçü Görselleri            | 400KB                             | Teknik çizimler, PNG formatı |
| Malzeme Görselleri         | 100KB                             | Küçük görsel                 |
| Kart Görselleri            | 150KB                             | Küçük görsel                 |
| Logo ve İkonlar            | 50KB                              | Çok küçük görsel veya SVG    |

### Videolar

| Kullanım Alanı                | Maksimum Boyut | Notlar             |
| ----------------------------- | -------------- | ------------------ |
| Hero Videoları (Desktop)      | 10MB           | 10-30 saniye, loop |
| Hero Videoları (Mobil)        | 5MB            | 10-20 saniye, loop |
| Ürün Videoları (Desktop)      | 15MB           | Orta uzunluk       |
| Ürün Videoları (Mobil)        | 8MB            | Orta uzunluk       |
| Arka Plan Videoları (Desktop) | 20MB           | 15-60 saniye, loop |
| Arka Plan Videoları (Mobil)   | 10MB           | 15-30 saniye, loop |

### Sanity Limitleri

- **Görsel**: Maksimum 10MB (yükleme öncesi)
- **Video**: Maksimum 100MB (yükleme öncesi)
- **Toplam Depolama**: Proje planına göre değişir

---

## 🛠️ Optimizasyon Araçları

### Görsel Optimizasyon

1. **ImageOptim** (Mac):
   - Otomatik optimizasyon
   - WebP dönüştürme
   - Batch processing

2. **Squoosh** (Web):
   - Tarayıcı tabanlı
   - WebP, JPEG, PNG optimizasyonu
   - Gerçek zamanlı önizleme

3. **TinyPNG** (Web):
   - PNG ve JPEG optimizasyonu
   - Batch processing
   - API desteği

4. **Photoshop**:
   - "Export for Web" özelliği
   - Kalite ayarları
   - Format seçimi

### Video Optimizasyon

1. **FFmpeg** (Komut Satırı):

   ```bash
   # Desktop video
   ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 128k -movflags +faststart output.mp4

   # Mobil video
   ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 25 -vf scale=1080:1920 -c:a aac -b:a 96k -movflags +faststart output_mobile.mp4
   ```

2. **HandBrake** (GUI):
   - Kullanıcı dostu arayüz
   - Preset'ler
   - Batch processing

3. **Adobe Media Encoder**:
   - Profesyonel araç
   - Detaylı ayarlar
   - Batch processing

### Online Araçlar

1. **CloudConvert**:
   - Format dönüştürme
   - Optimizasyon
   - Batch processing

2. **FreeConvert**:
   - Video ve görsel optimizasyonu
   - Format dönüştürme

---

## ❓ Sık Karşılaşılan Sorunlar

### Görsel Yüklenmiyor

**Sorun**: Görsel sayfada görünmüyor.

**Çözümler**:

1. Sanity'de görselin yüklendiğinden emin olun
2. URL'nin doğru olduğunu kontrol edin
3. CORS ayarlarını kontrol edin
4. Browser console'da hata mesajlarını kontrol edin

### Video Oynatılamıyor

**Sorun**: Video oynatılamıyor veya yüklenmiyor.

**Çözümler**:

1. Video formatının MP4 (H.264) olduğundan emin olun
2. Dosya boyutunun limit içinde olduğunu kontrol edin
3. Video codec'ini kontrol edin (H.264 önerilir)
4. Poster image'in yüklendiğinden emin olun

### Art Direction Çalışmıyor

**Sorun**: Mobil/desktop görselleri doğru gösterilmiyor.

**Çözümler**:

1. Sanity'de mobil/desktop görsellerinin yüklendiğinden emin olun
2. Component'te `srcMobile` ve `srcDesktop` prop'larının doğru geçirildiğini kontrol edin
3. Browser'ın responsive mode'da olduğundan emin olun
4. Console'da hata mesajlarını kontrol edin

### Dosya Boyutu Çok Büyük

**Sorun**: Görsel/video dosyası çok büyük.

**Çözümler**:

1. Optimizasyon araçlarını kullanın (ImageOptim, FFmpeg, HandBrake)
2. Kalite ayarlarını düşürün (%80-85)
3. Görsel boyutunu küçültün
4. WebP formatına dönüştürün (görseller için)

### Performans Sorunları

**Sorun**: Sayfa yavaş yükleniyor.

**Çözümler**:

1. Lazy loading kullanın (`loading="lazy"`)
2. Preload ayarlarını kontrol edin (videolar için)
3. Görsel boyutlarını optimize edin
4. CDN cache'ini kontrol edin

### Sanity Yükleme Hatası

**Sorun**: Sanity'de dosya yüklenemiyor.

**Çözümler**:

1. Dosya boyutunun limit içinde olduğunu kontrol edin
2. İnternet bağlantınızı kontrol edin
3. Tarayıcı cache'ini temizleyin
4. Farklı bir tarayıcı deneyin

---

## 📚 Ek Kaynaklar

### Sanity Dokümantasyonu

- [Sanity Image URLs](https://www.sanity.io/docs/image-urls)
- [Sanity File Assets](https://www.sanity.io/docs/file-assets)

### Optimizasyon Araçları

- [Squoosh](https://squoosh.app/)
- [ImageOptim](https://imageoptim.com/)
- [FFmpeg](https://ffmpeg.org/)
- [HandBrake](https://handbrake.fr/)

### Web Performans

- [Web.dev - Image Optimization](https://web.dev/fast/#optimize-your-images)
- [Web.dev - Video Optimization](https://web.dev/fast/#optimize-your-videos)

---

## 📝 Özet Checklist

### Görsel Yüklemeden Önce

- [ ] Doğru boyutta (önerilen boyutlara uygun)
- [ ] Optimize edilmiş (ImageOptim, Squoosh, vb.)
- [ ] WebP formatına dönüştürülmüş (opsiyonel ama önerilir)
- [ ] Dosya boyutu limit içinde
- [ ] Anlamlı dosya adı

### Video Yüklemeden Önce

- [ ] MP4 formatında (H.264 codec)
- [ ] Optimize edilmiş (FFmpeg, HandBrake)
- [ ] Doğru çözünürlükte
- [ ] Dosya boyutu limit içinde
- [ ] Poster image hazırlanmış

### Sanity'de Yükleme

- [ ] Ana görsel/video yüklendi
- [ ] Mobil versiyonu yüklendi (gerekirse)
- [ ] Desktop versiyonu yüklendi (gerekirse)
- [ ] Hotspot ayarlandı (görseller için)
- [ ] Alt text eklendi (görseller için)

### Kod Kullanımı

- [ ] Doğru component kullanıldı (`OptimizedImage` veya `OptimizedVideo`)
- [ ] Lazy loading ayarlandı (gerekirse)
- [ ] Art Direction prop'ları eklendi (gerekirse)
- [ ] Alt text eklendi (görseller için)
- [ ] Poster image eklendi (videolar için)

---

**Son Güncelleme**: 2025-01-29
**Versiyon**: 1.0
