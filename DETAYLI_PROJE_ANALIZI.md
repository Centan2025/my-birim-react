# Birim Web - Detaylı Proje Analizi Raporu

**Tarih:** 26 Şubat 2026  
**Kapsam:** Frontend (Vite, React, TypeScript), Backend (Sanity CMS) ve Proje Konfigürasyonları.  
**Son Deploy:** `https://birim.sanity.studio/` ✅  
**Git Branch:** `main` — son commit `9ec1675`  

Bu rapor projenin genel mimarisine, mevcut hatalarına, eksikliklerine ve uzun vadede eklenmesi gereken iyileştirmelere yönelik çok detaylı bir analizi içermektedir.

---

## 1. Mimari ve Kod Kalitesi (Architecture & Code Quality)

### 🔴 Mevcut Durum ve Sorunlar
- **Büyük Boyutlu Dosyalar (God Objects):**
    - `src/App.tsx` **~47 KB** — tüm route tanımları, layout mantığı, lazy loading ve global context sağlayıcıları tek dosyada.
    - `src/components/Header.tsx` (~73 KB) — refaktör kapsamında `HeaderIcons.tsx`, `useHeaderSearch.ts`, `useHeroBrightness.ts` ayrıştırması yapıldı ancak dosya hâlâ çok büyük; `HeaderNavigation`, `HeaderMobileMenu`, `HeaderDesktop` gibi bileşenlere bölünmesi gerekiyor.
    - `src/services/sanity/client.ts` (9.5 KB) — temel Sanity istemcisinin yanı sıra `mapImage`, `resolveMediaUrl`, `processDocument` gibi genel amaçlı fonksiyonlar içeriyor; `mediaUtils.ts` veya `documentUtils.ts` olarak ayrılmalı.
- **ESLint Maksimum Uyarı Aşımı:** `package.json`'da `--max-warnings 300` ile lint geçirilebilir hale getirilmiş. Bu bir band-aid çözüm; asıl amaç 0 uyarı olmalı.
- **`any` Kullanımları:** `src/services/sanity/auth.ts` ve `pages.ts` içinde Sanity'den dönen ham nesneler için hâlâ `as any` veya tip assertion kullanılıyor.

### 🟡 Kısmen Tamamlananlar
- ✅ `cms.ts` **refaktöre edildi** — `src/services/sanity/` altında `auth.ts`, `categories.ts`, `news.ts`, `pages.ts`, `products.ts`, `settings.ts`, `client.ts` olarak bölündü.
- ✅ `useHeaderSearch.ts` hook'u ayrıştırıldı.
- ✅ `useHeroBrightness.ts` hook'u ayrıştırıldı.
- ✅ `HeaderIcons.tsx` component'i ayrıştırıldı.

### 🟢 Öneriler ve Aksiyonlar
- **`App.tsx` Parçalama:** Route konfigürasyonu `routes/index.tsx` dosyasına taşınmalı. Layout bileşenleri `layouts/` klasörüne çıkarılmalı.
- **`Header.tsx` Tamamlanması:** `HeaderDesktopNav`, `HeaderMobileMenu`, `HeaderSearchBar`, `HeaderLogo` gibi atomic bileşenlerle tamamlanmalı. Hedef: her bileşen maksimum 200 satır.
- **Tip Güvenliğini Artırma:** Sanity'den dönen ham veri için `Zod` şema tanımları (`src/schemas/`) oluşturularak runtime validasyonu sağlanmalı.
- **ESLint Sıfırlama:** `--max-warnings 300` kaldırılarak `0`'a indirilmeli ve CI'da bu kural bloke edici olmalı.

---

## 2. Test ve Güvenilirlik (Testing & Reliability)

### 🔴 Mevcut Durum ve Sorunlar
- **Test Coverage:** `src/test/` dizininde 8 test dosyası mevcut:
  - `CartContext.test.tsx`, `ErrorBoundary.test.tsx`, `HomePage.test.tsx`
  - `LoginPage.test.tsx`, `NewsDetailPage.test.tsx`, `ProductDetailPage.test.tsx`
  - `cms.test.ts`, `seo.test.tsx`
  - ⚠️ Coverage hâlâ %30-40 civarında tahmin ediliyor; kritik hook'lar (`useProducts`, `useCategories`, `useHeaderSearch`) test edilmiyor.
- **E2E (Uçtan Uca) Test Yokluğu:** Sepet akışı, filtreleme, iletişim formu gibi kritik kullanıcı senaryoları için E2E testleri bulunmuyor.
- **Hook Testleri Eksik:** `src/hooks/` altındaki 14 hook'un hiçbiri doğrudan test edilmiyor.
- **Sanity Duplicate Key Uyarısı:** `MediaImportTool.tsx` içinde `hasResponsiveSizes` duplicate key uyarısı Sanity build'de çıkıyor — fonksiyonel değil ama temizlenmeli.

### 🟡 Kısmen Tamamlananlar
- ✅ Vitest + `@vitest/coverage-v8` kurulu
- ✅ `@testing-library/react` entegre
- ✅ `setup.ts` dosyası mevcut
- ✅ `vitest.config.ts` yapılandırılmış

### 🟢 Öneriler ve Aksiyonlar
- **Öncelikli Hook Testleri:** `useProducts`, `useCategories`, `useHeaderSearch`, `useHeroBrightness` için Vitest testleri yazılmalı.
- **Service Testleri:** `src/services/sanity/products.ts` ve `auth.ts` için mock'lu Sanity client testleri eklenmeli.
- **E2E Testler:** Playwright kurularak en az 3 kritik yol (`ana sayfa → ürün listesi → detay`, `arama`, `iletişim formu`) otomatize edilmeli.
- **CI Coverage Eşiği:** CI pipeline'a `--coverage --coverage-threshold 60` eşiği eklenmeli ve zamanla %70'e çıkarılmalı.
- **MediaImportTool Temizliği:** `birim-web/tools/mediaImport/MediaImportTool.tsx` içindeki duplicate `hasResponsiveSizes` key'leri çözülmeli.

---

## 3. Performans (Performance & Optimization)

### 🔴 Mevcut Durum ve Sorunlar
- **Medya URL Karmaşıklığı:** `src/lib/mediaOptimization.ts` ve `src/services/sanity/client.ts` içinde `resolveMediaUrl`, `mapImage`, `isR2Url` gibi zincirleme URL dönüşüm fonksiyonları var. Cloudflare R2 geçişi sırasında oluşan bu karmaşıklık teknik borç yaratıyor.
- **PWA Eksikliği:** Uygulama henüz Progressive Web App (PWA) desteklemiyor. `vite-plugin-pwa` kurulu değil.
- **Route-level Code Splitting:** `App.tsx`'te bazı sayfalar `React.lazy()` ile yükleniyor, ancak hangi sayfaların kritik yolda olduğu ve hangilenin lazy olduğu net değil. Bundle analizi (`ANALYZE=true npm run build`) düzenli çalıştırılmalı.
- **Büyük JS Bundle'ları:** `sanity-vendor` ve `react-vendor` chunk'ları iyi ayrıştırılmış. Ancak `App.tsx` (47 KB) kendisi bundle'a dahil olduğu için kritik parçayı şişirebilir.

### 🟡 Kısmen Tamamlananlar
- ✅ `vite-plugin-remove-console` — production build'de `console.log` temizliyor
- ✅ `rollup-plugin-visualizer` — bundle analizi aktif (`ANALYZE=true`)
- ✅ `@vitest/coverage-v8` — size-limit entegrasyonu
- ✅ `OptimizedImage.tsx` ve `R2Image.tsx` — resim optimizasyon bileşenleri
- ✅ `src/lib/webVitals.ts` — CLS, LCP, FCP, TTFB, INP metrikleri toplanıyor
- ✅ React Query cache TTL'leri veri tipine göre optimize edilmiş

### 🟢 Öneriler ve Aksiyonlar
- **PWA Desteği:** `vite-plugin-pwa` eklenerek Service Worker ve Web App Manifest oluşturulmalı. En azından offline fallback sayfası ve "Ana ekrana ekle" akışı sağlanmalı.
- **Medya Pipeline Sadeleştirilmesi:** Tüm R2 URL'leri tek bir canonical formata (`https://cdn.birim.com/...`) dönüştürülmeli. İstemci tarafındaki string replace/rewrite zinciri kaldırılmalı; bu işlem Cloudflare Worker veya Sanity transform üzerinde yapılmalı.
- **`App.tsx` Bölünmesi:** Route config ayrı dosyaya alındığında kritik yol bundle'ı küçülecek; tüm sayfalar `lazy()` ile sarılmalı.
- **Cache-Control Header Optimizasyonu:** `vercel.json`'da sadece `/static/` için `immutable` cache var. `/assets/` Vite çıktıları için de `public, max-age=31536000, immutable` eklenmeli.

---

## 4. Kullanıcı Deneyimi ve SEO (UX / UI / SEO)

### 🔴 Mevcut Durum ve Sorunlar
- **Sayfa Bazlı Error Boundary Eksikliği:** Tek bir root Error Boundary var. Sayfa bazında hata yakalama yok; bir sayfadaki hata tüm uygulamayı çökertebilir.
- **i18n Tutarsızlığı:** `src/i18n/` klasörü mevcut, ancak `src/services/sanity/client.ts` gibi servis dosyalarında bazı Türkçe sabit string'ler var. Örneğin hata mesajları.
- **A11y Klavye Navigasyonu:** `useFocusTrap.ts` hook'u var ancak tüm dialog ve dropdown'larda kullanılıp kullanılmadığı doğrulanmamış. Özellikle mobil menüde focus trap manuel test edilmeli.
- **Open Graph / Sosyal Medya Tag'ları:** `useSEO.tsx` hook'u mevcut, ancak ürün sayfalarında dinamik OG image (ürün fotoğrafı) oluşturulup oluşturulmadığı kontrol edilmeli.

### 🟡 Kısmen Tamamlananlar
- ✅ `react-helmet-async` entegre ve aktif
- ✅ `useSEO.tsx` hook'u yazılmış
- ✅ `sitemap.xml` generate scripti aktif (build'de çalışıyor)
- ✅ `robots.txt` generate scripti aktif
- ✅ `useFocusTrap.ts` hook'u mevcut
- ✅ `eslint-plugin-jsx-a11y` entegre
- ✅ `I18nProvider` kurulmuş

### 🟢 Öneriler ve Aksiyonlar
- **Sayfa Error Boundary'leri:** React Router v6 `errorElement` prop'u kullanılarak her route için özel hata sayfası tanımlanmalı ya da her `<Route>` içine `<ErrorBoundary>` sarmalı.
- **Dinamik OG Image:** Ürün ve proje detay sayfalarında Open Graph image tag'ı ürünün ilk görseline dinamik olarak set edilmeli.
- **A11y Kapsamlı Test:** Lighthouse'a ek olarak `axe-core` veya `jest-axe` ile otomatik a11y testleri yazılmalı.
- **i18n String Audit:** `grep -r "\"[A-ZÇĞİÖŞÜ]" src/services src/lib` ile servis katmanındaki Türkçe sabit string'ler tespit edilip i18n dosyalarına taşınmalı.

---

## 5. Güvenlik ve Altyapı (Security & DevOps)

### 🔴 Mevcut Durum ve Sorunlar
- **Content Security Policy (CSP) Eksikliği:** `vercel.json`'da `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy` header'ları mevcut. Ancak **CSP (Content-Security-Policy) header'ı eksik** — bu XSS'e karşı en kritik koruma katmanı.
- **Dependabot / Renovate Yok:** `.github/workflows/ci.yml` aktif ama bağımlılık güncellemelerini otomatize eden Dependabot veya Renovate yapılandırması yok. `package-lock.json` içindeki eski paketler güvenlik açığı oluşturabilir.
- **Sentry Tam Entegrasyon:** `@sentry/react` bağımlılık olarak var ve env değişkenleri tanımlı. Ancak Sentry'nin Performance Monitoring (traces) ve Session Replay özelliklerinin aktif olup olmadığı kontrol edilmeli.
- **API Token Güvenliği:** Sanity token `.env` dosyasına alınmış. Ancak `VITE_SANITY_TOKEN` değişkeni istemci-taraflı bundle'a dahil olduğu için public (herkes görebilir). Sadece build-time veya server-side kullanım için node-only token ayrımı yapılmalı.

### 🟡 Kısmen Tamamlananlar
- ✅ `vercel.json` güvenlik header'ları (CSP hariç)
- ✅ `.github/workflows/ci.yml` CI pipeline aktif (lint, type check, test, build)
- ✅ Husky pre-commit hook aktif
- ✅ `lint-staged` entegre
- ✅ `src/lib/envValidation.ts` — Zod ile env değişkenleri validate ediliyor
- ✅ `src/lib/rateLimiter.ts` — rate limiting mekanizması mevcut
- ✅ `src/lib/sanitize.ts` — DOMPurify entegrasyonu

### 🟢 Öneriler ve Aksiyonlar
- **CSP Header Eklenmesi:** `vercel.json`'a aşağıdaki gibi katı bir CSP eklenmelidir:
  ```json
  {
    "key": "Content-Security-Policy",
    "value": "default-src 'self'; script-src 'self' 'nonce-{NONCE}' https://www.googletagmanager.com; img-src 'self' https://cdn.sanity.io https://*.r2.cloudflarestorage.com data:; connect-src 'self' https://*.sanity.io wss://*.sanity.io https://www.google-analytics.com; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; frame-ancestors 'none';"
  }
  ```
- **Dependabot Aktifleştirme:** `.github/dependabot.yml` dosyası oluşturularak haftada bir npm paket güncellemesi PR'ı açılmalı.
- **Sanity Token Ayrımı:** `VITE_SANITY_TOKEN` değeri public bundle'a gömülüyor. Yalnızca build scriptleri veya Sanity Studio için kullanılıyorsa `SANITY_TOKEN` (VITE prefix'siz) olarak saklanmalı; frontend preview için ayrı, kısıtlı yetkili bir token kullanılmalı.
- **Sentry Doğrulaması:** `src/index.tsx` içinde `Sentry.init()` çağrısının `tracesSampleRate` ve `replaysSessionSampleRate` ile tam yapılandırıldığından emin olunmalı.

---

## 6. Sanity CMS Kalitesi (Yeni Bölüm)

### 🔴 Mevcut Durum ve Sorunlar
- **`MediaImportTool.tsx` Duplicate Key'leri:** Sanity build sırasında 20+ adet `Duplicate key "hasResponsiveSizes" in object literal` uyarısı alınıyor. Bu uyarılar deploy'u engellemese de kod kalitesini düşürüyor.
- **Schema Validasyonları:** `birim-web/schemaTypes/documents/` altındaki şemalar için Sanity'nin yerel `validation` fonksiyonları bazı alanlarda eksik (örn: URL format kontrolü, gerekli medya boyutları).
- **Preview URL'leri:** `previewUrl.ts` içindeki preview mantığı düz string interpolasyonu kullanıyor; ortam değişkenine bağımlılık kontrol edilmeli.

### 🟡 Kısmen Tamamlananlar
- ✅ Sanity Studio başarıyla `https://birim.sanity.studio/` adresine deploy edildi
- ✅ `designer.tsx`, `siteSettings.tsx` şema dosyaları tanımlanmış
- ✅ R2 Cloudflare entegrasyonu Sanity Studio içinden aktif

### 🟢 Öneriler ve Aksiyonlar
- **Duplicate Key Temizliği:** `MediaImportTool.tsx` içinde 3000+ satırda tekrar eden `hasResponsiveSizes` field'ları, spread operator veya yardımcı bir builder fonksiyonuyla tekilleştirilmeli.
- **Schema Validasyonları Güçlendirme:** URL alanları için `validation: (Rule) => Rule.uri({ scheme: ['https'] })` gibi kurallar eklenmeli.
- **Sanity Webhook Entegrasyonu:** İçerik değişikliklerinde Vercel'in on-demand ISR (Incremental Static Regeneration) endpoint'ini tetikleyecek Sanity webhook kurulmalı — şu an `@sanity/webhook` paketi var ama aktif mi kontrol edilmeli.

---

## 7. Kod Organizasyonu ve Bağımlılık Yönetimi (Yeni Bölüm)

### 🔴 Mevcut Durum ve Sorunlar
- **Geçici Dosyalar Repodan Temizlenmedi:**
  - `eslint_report.txt`, `lint_errors.txt`, `lint_report_2..5.txt` — geliştirme sürecinde oluşan araştırma dosyaları repoda kalıyor.
  - `fix_header.cjs`, `patch_previews.cjs`, `sanity_out.json`, `sanity_out_utf8.json` — tek seferlik araçlar repoda kalıyor.
  - `dummy`, `test-email.js`, `test-env.js` — test amaçlı dosyalar temizlenmemiş.
  - `strategy_notes.md` — geliştirici notları repoda.
- **Büyük `package.json` Dependency Listesi:** `express`, `nodemailer`, `@aws-sdk/client-s3`, `bcryptjs` production dependency'de bulunuyor — bunlar sadece `email-server.js` tarafından kullanılıyor. Frontend bundle'ına dahil olabilirler (Vite tree-shaking yapıyor olsa da).

### 🟢 Öneriler ve Aksiyonlar
- **`.gitignore` Güncellenmesi:** Rapor, log ve tek seferlik script dosyaları `.gitignore`'a eklenmeli veya `scripts/temp/` klasörüne taşınmalı:
  ```
  *_report*.txt
  lint_*.txt
  eslint_*.txt
  sanity_out*.json
  fix_*.cjs
  patch_*.cjs
  strategy_notes.md
  test-*.js
  dummy
  ```
- **Server Bağımlılıklarını Ayırma:** `email-server.js` ve ilgili paketler (`express`, `nodemailer`, `cors`) ayrı bir `email-server/` paketi veya `devDependencies`'e taşınmalı. Alternatif olarak Vercel Edge Functions veya Resend/SendGrid API kullanılabilir.

---

## 📋 Özet ve En Acil Aksiyon Listesi (Priority List)

| Öncelik | Konu | Durum |
|---------|------|-------|
| 🔴 Kritik | Repo temizliği (geçici dosyalar, log'lar) | ⚠️ Yapılmadı |
| 🔴 Kritik | CSP Header eklenmesi (`vercel.json`) | ⚠️ Yapılmadı |
| 🔴 Kritik | ESLint `--max-warnings 300` → `0` | ⚠️ Yapılmadı |
| 🔴 Kritik | `VITE_SANITY_TOKEN` public exposure riski | ⚠️ İncelenmeli |
| 🟡 Yüksek | `App.tsx` → route config + layouts ayrımı | ⚠️ Yapılmadı |
| 🟡 Yüksek | `Header.tsx` tamamlanması (mobile + desktop bileşenleri) | 🔄 Devam ediyor |
| 🟡 Yüksek | Hook testleri (`useProducts`, `useCategories`, vb.) | ⚠️ Yapılmadı |
| 🟡 Yüksek | PWA (vite-plugin-pwa) kurulumu | ⚠️ Yapılmadı |
| 🟡 Yüksek | Sayfa bazlı Error Boundary eklenmesi | ⚠️ Yapılmadı |
| 🟡 Yüksek | MediaImportTool duplicate key temizliği | ⚠️ Yapılmadı |
| 🟢 Orta | Dependabot yapılandırması | ⚠️ Yapılmadı |
| 🟢 Orta | Dinamik OG image (ürün/proje detay sayfaları) | ⚠️ Yapılmadı |
| 🟢 Orta | Sanity Webhook → Vercel on-demand revalidation | ⚠️ İncelenmeli |
| 🟢 Düşük | E2E testler (Playwright) | ⚠️ Yapılmadı |
| 🟢 Düşük | Server bağımlılıklarını ayrıştırma | ⚠️ Yapılmadı |

---

## ✅ Tamamlanan İyileştirmeler (Referans)

| Tarih | Konu |
|-------|------|
| 2026-02-26 | `cms.ts` → `src/services/sanity/` altında 7 modüle bölündü |
| 2026-02-26 | `Header.tsx` → `HeaderIcons.tsx`, `useHeaderSearch.ts`, `useHeroBrightness.ts` ayrıştırıldı |
| 2026-02-26 | Git push `main` branch'e yapıldı |
| 2026-02-26 | Sanity Studio `https://birim.sanity.studio/` adresine deploy edildi |
| 2026-02-25 | LCP optimizasyonu — `OptimizedImage` `fetchPriority` düzeltmesi |
| 2026-02-25 | Sanity thumbnail preview sorunu giderildi |
| 2026-02-24 | Cloudflare R2 domain → `VITE_R2_DOMAIN` env var ile düzeltildi |
| 2026-02-23 | Sanity WebSocket bağlantı hatası giderildi |
| ~2026-02 | CI/CD pipeline (`.github/workflows/ci.yml`) oluşturuldu |
| ~2026-02 | Husky pre-commit + lint-staged kuruldu |
| ~2026-02 | Web Vitals monitoring (`src/lib/webVitals.ts`) eklendi |
| ~2026-02 | Env validation (`src/lib/envValidation.ts` + Zod) eklendi |
| ~2026-02 | Console.log production'dan kaldırma plugin'i |
| ~2026-02 | Bundle size limit monitoring |

---

**Son Güncelleme:** 26 Şubat 2026  
**Hazırlayan:** AI Assistant (Antigravity)
