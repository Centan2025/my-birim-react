# Birim Web - Detaylı Proje Analizi Raporu

**Tarih:** 26 Şubat 2026  
**Kapsam:** Frontend (Vite, React, TypeScript), Backend (Sanity CMS) ve Proje Konfigürasyonları.

Bu rapor projenin genel mimarisine, mevcut hatalarına, eksikliklerine ve uzun vadede eklenmesi gereken iyileştirmelere yönelik çok detaylı bir analizi içermektedir.

---

## 1. Mimari ve Kod Kalitesi (Architecture & Code Quality)

### 🔴 Mevcut Durum ve Sorunlar
- **Büyük Boyutlu Dosyalar (God Objects):**
    - `src/services/cms.ts` dosyası 96 KB boyutunda ve 2700 satırdan fazla. Tüm veri çekme işlemleri, veri formatlama ve iş mantığı tek bir dosyada toplanmış.
    - `src/components/Header.tsx` (~73 KB) çok fazla sorumluluk üstlenmiş durumda (mobil/masaüstü menü, arama, vb.).
- **ESLint Hataları:** Terminalde çalıştırılan `npm run lint` komutu hata ile sonuçlanıyor. Bu, projede çözülmemiş style veya logic uyarıları/hataları olduğunu gösteriyor (Büyük ihtimalle any kullanımları veya unused değişkenler).
- **TypeScript Strict Mode:** Projede tam anlamıyla strict modu açık (`npx tsc --noEmit` hatasız geçiyor), bu çok olumlu bir durum. Ancak bazı dosyalarda hala `eslint-disable` ve `any` type casting (örneğin `cms.ts` içinde `img as any` vb.) kullanılmış.

### 🟢 Öneriler ve Aksiyonlar
- **Böl ve Yönet (Refactoring):** `cms.ts` dosyası en kısa zamanda alt servislere bölünmeli (örneğin: `productsService.ts`, `settingsService.ts`, `categoriesService.ts`).
- **Component Parçalaması:** `Header.tsx` gibi büyük componentler, `HeaderNavigation`, `HeaderSearch`, `HeaderActions` gibi daha küçük ve yeniden kullanılabilir alt parçalara ayrılmalı.
- **Tip Güvenliğini Artırma:** `any` kullanımları (özellikle Sanity'den gelen dinamik verilerde) Zod veya benzeri bir validasyon kütüphanesiyle çalışma zamanı (runtime) validasyonlarına dönüştürülmeli.

---

## 2. Test ve Güvenilirlik (Testing & Reliability)

### 🔴 Mevcut Durum ve Sorunlar
- **Düşük Test Kapsamı (Coverage):** `src/test/` dizininde sadece birkaç adet test dosyası (`CartContext.test.tsx` vb.) bulunuyor. Projenin genel test coverage'ı çok düşük. Kritik iş mantıkları ve UI davranışları, regressions (gerileme) hatalarına karşı korumasız.
- **E2E (Uçtan Uca) Test Yokluğu:** Kullanıcının sepet, giriş, filtreleme gibi kritik senaryolarını test eden E2E testleri bulunmuyor.

### 🟢 Öneriler ve Aksiyonlar
- **Birim Testleri (Unit Tests):** Vitest kullanılarak utility fonksiyonları (`src/lib` ve `src/utils`), hook'lar ve karmaşık UI bileşenleri için testler yazılmalı. Hedef %70+ coverage olmalı.
- **E2E Test Entegrasyonu:** Playwright veya Cypress kurularak kritik akışlar (Kullanıcı girişi, Ürün Sepete Ekleme, Checkout adımları) için otomatize testler yazılmalı.

---

## 3. Performans (Performance & Optimization)

### 🔴 Mevcut Durum ve Sorunlar
- **Görsel ve Medya Optimizasyonları:** Resim optimizasyonu için çeşitli çalışmalar (`OptimizedImage.tsx`, `R2Image.tsx`) yapılmış ancak Cloudflare R2'ye geçiş sürecinde hala eski ".r2.dev" URL'lerinin manuel rewrite edildiği karmaşık bir fonksiyon zinciri var (`mapImage` vb.).
- **Bundle (Paket) Boyutu:** Bundle analizi (`rollup-plugin-visualizer`) var, ancak "vendor" chunk'ı (Sanity ve React kütüphaneleri) dışında route sayfalarında ne kadar kod bölümlendiği net değil.
- **PWA Eksikliği:** Uygulama henüz Progressive Web App (PWA) desteklemiyor. İnternet kesintilerinde veya kötü bağlantılarda bir yedekleme sayfası (Offline Fallback) ve tarayıcıya "Yükle" opsiyonu sunmuyor.

### 🟢 Öneriler ve Aksiyonlar
- **Medya Pipeline İyileştirmesi:** Sanity içerisine kaydedilen tüm görseller için sadece tek tip URL tutulmalı ve CDN düzeyinde (örneğin Cloudflare Image Resizing) transformasyonlar kullanılmalı. İstemci tarafında URL string değiştirme (replace) işlemleri azaltılmalı.
- **Gelişmiş Caching Kullanımı:** `react-query` kullanıldığı için genel istekler önbelleğe alıyor. Ancak bazı değişmeyen ayar verileri için Service Worker üzerinden önbellekleme sağlanabilir.
- **PWA Desteği Eklenmesi:** `vite-plugin-pwa` ile hızlıca bir ServiceWorker ve Manifest eklenip web sayfası uygulama (app) benzeri bir deneyime kavuşturulmalı.

---

## 4. Kullanıcı Deneyimi ve SEO (UX / UI / SEO)

### 🔴 Mevcut Durum ve Sorunlar
- **Hata Yakalama (Error Boundary):** Sadece kök dizinde (Root) tek bir Error Boundary var. Bir sayfada hata olduğunda büyük ihtimalle tüm uygulama veya ana çerçeve etkileniyor.
- **Uluslararasılaştırma (i18n):** `I18nProvider` kurulmuş, ancak kod içerisinde veya tasarımda tüm string'lerin dinamik gelip gelmediğinin denetimi yapılmalı (Örn: `cms.ts` içinde bazı yerlerde "Ürün Detayı" statik olarak atanıyor).
- **Erişilebilirlik (A11y):** ESLint ile a11y kuralları entegre edilmiş ancak dinamik açılır menülerde klavye odak şifrelemesi (Focus Trap) gibi gelişmiş kontrollerin manuel ve screen-reader testleri yapılmalı.

### 🟢 Öneriler ve Aksiyonlar
- **Sayfa Bazlı Error Boundary:** React Router içinde her bir `<Route>` veya sayfa modülü kendi Error Boundary'si içine alınmalı. Böylelikle sadece sorunlu bölge çöker; menü ve footer sağlam kalır.
- **SEO ve Meta Tag'ları:** Sayfa bazlı SEO title, description, Open Graph etiketlerinin tam olarak yönetildiğinden emin olunmalı. `react-helmet-async` ve sitemap üretimi aktif, ancak sitemap güncel kalmalı.

---

## 5. Güvenlik ve Altyapı (Security & DevOps)

### 🔴 Mevcut Durum ve Sorunlar
- **Content Security Policy (CSP):** `vercel.json` tablosunda birçok iyi Header var, ancak en güçlü savunma katmanı olan CSP (Content Security Policy) ayarlanmamış.
- **API Monitoring:** Uygulamada Sentry kurulumu için ortam değişkenleri var ancak hataların (özellikle Sanity ile yaşanan bağlantı sorunları veya rate-limit) anlık izlemesi eksik olabilir.

### 🟢 Öneriler ve Aksiyonlar
- **CSP Eklenmesi:** XSS saldırılarına karşı korunmak için izin verilen domainleri (Sanity, R2 CDN, Google Analytics, vb.) belirten katı bir CSP kuralı yazılmalı.
- **Sürekli Entegrasyon (CI/CD):** `.github/workflows` ile kurulan pipeline'da bir de periyodik olarak dependabot/renovate ile kütüphane sürümlerini güncelleyecek kurallar ayarlanmalı. `package-lock.json` içindeki eski sürümler güvenlik zafiyeti doğurabilir.

---

## 📋 Özet ve En Acil Aksiyon Listesi (Priority List)

1. **(Kritik) `cms.ts` Dosyasının Refaktör Edilmesi:** Bakımı imkansız hale gelmeden fonksiyon odaklı parçalara (hook veya alt servis) ayrılmalıdır.
2. **(Kritik) ESLint Hatalarının Sıfırlanması:** TypeScript uyarı/hatalarının sıfırlandığı gibi lint hataları da temizlenmeli ve CI sürecinde bloke edici hale getirilmelidir.
3. **(Yüksek) Birim Testleri:** Sepet (Cart), Yetkilendirme (Auth) ve Fiyat/Ürün hesaplama logikleri için acil %100 coverage sağlanmalı.
4. **(Yüksek) PWA ve Service Worker:** Mobil web deneyimini iyileştirmek ve hız puanını artırmak için PWA eklentisi Vite'a kurulmalı.
5. **(Orta) Component Parçalarılması:** Header ve FullscreenMediaViewer gibi şişkin bileşenler (bloated components), okunabilirliği artırmak için bölünmelidir.
