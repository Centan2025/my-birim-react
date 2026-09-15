# BIRIM WEB — KAPSAMLI PRODUCTION AUDIT RAPORU

**Web Security, Architecture, UX/UI, Performance, SEO, Accessibility & Code Quality**

**Tarih:** 15 Eylül 2026  
**Proje:** `birim-web-local` (`my-birim-react`)  
**Denetim Kapsamı:** Production Hazırlığı, Bilgi Güvenliği, Kullanıcı Deneyimi, Marka Algısı ve Altyapı İncelemesi  
**Denetim Rolleri:** Web Security Engineer, Senior Next.js/React Engineer, UX/UI Designer, Product Designer, SEO Specialist, Accessibility Specialist, Performance Engineer, DevOps Engineer, CRO Specialist.

---

## 1. EXECUTIVE SUMMARY (YÖNETİCİ ÖZETİ)

Proje kaynak kodları, Vercel sunucusuz fonksiyonları (`api/`), Supabase veritabanı şeması ve RLS politikaları, Sanity CMS entegrasyonu ve istemci tarafı bileşenleri derinlemesine denetlenmiştir.

Birim markasının web sitesi; çağdaş tipografi, minimalist tasarım dili ve mimari odaklı görsel kimliğiyle güçlü bir **"High-end Design Brand"** temeline sahiptir. Ancak production ortamında güvenliği ve ölçeklenebilirliği doğrudan tehdit eden **kritik yetkilendirme bypass açıkları**, **kaynak koda gömülü fallback servis anahtarları (Service Role)**, **istemci tabanlı render (CSR) sebebiyle sosyal medya/SEO indeksleme kısıtları** ve **aşırı font yüklemesi** tespit edilmiştir.

### Skor Tablosu (100 Üzerinden)

| Alan                                           |      Puan      | Durum                                                       |
| :--------------------------------------------- | :------------: | :---------------------------------------------------------- |
| **Security (Güvenlik)**                        |  **58 / 100**  | 🔴 Kritik & Yüksek Seviye Güvenlik Açıkları Mevcut          |
| **UX (Kullanıcı Deneyimi)**                    |  **74 / 100**  | 🟡 İyi Temel, B2B/Mimar Akışlarında Sürtünmeler Var         |
| **UI (Görsel & Tasarım Dili)**                 |  **82 / 100**  | 🟢 Güçlü Estetik, Premium Hissiyat                          |
| **Performance (Performans)**                   |  **70 / 100**  | 🟡 Aşırı Web Font ve Ağır Vendor Kütüphaneleri              |
| **SEO (Arama Motoru Optimizasyonu)**           |  **62 / 100**  | 🟠 SPA/CSR Kaynaklı Sosyal Medya & Bot İndeksleme Sıkıntısı |
| **Accessibility (Erişilebilirlik - WCAG 2.2)** |  **66 / 100**  | 🟡 Modal Focus Trap ve İkon Label Eksikleri                 |
| **Code Quality (Kod Kalitesi)**                |  **76 / 100**  | 🟢 TypeScript Tip Güvenliği Yüksek, Versiyon Kirliliği Var  |
| **Mobile Experience (Mobil Deneyim)**          |  **75 / 100**  | 🟡 Genel Olarak Uyumlu, 360px ve Menüde İyileştirme Gerekli |
| **Conversion Rate Optimization (Dönüşüm)**     |  **71 / 100**  | 🟡 Teklif Alma / Seçkim Akışında Sürtünmeler                |
| **Premium Brand Experience (Lüks Standart)**   |  **78 / 100**  | 🟢 Minotti / B&B Italia Seviyesine Yakın, Detaylar Eksik    |
| **GENEL ORTALAMA (OVERALL)**                   | **71.2 / 100** | ⚠️ **Production Öncesi Güvenlik Düzeltmesi Zorunlu**        |

---

## 2. PROJECT ARCHITECTURE AUDIT (MİMARİ ANALİZ)

- **Uygulama Mimarisi:** İstemci tarafında **Vite 7.2 + React 18.2 + TypeScript + React Router DOM 6.23** mimarisinde Single Page Application (SPA).
- **Backend / API Katmanı:** Vercel Serverless Functions (`api/*.ts`), `@vercel/node` ile Node.js runtime ortamında çalışmaktadır. Yerel geliştirme için Express tabanlı `local-api-server.mjs` bulunmaktadır.
- **Veritabanı & Kimlik Doğrulama:** Supabase PostgreSQL + GoTrue Auth.
- **İçerik Yönetimi (CMS):** Sanity v3 (`birim-web` klasöründe ayrı Sanity Studio projesi) + GROQ sorgulama proxy'si (`api/sanity/query.ts`).
- **Medya & CDN:** Cloudflare R2 (AWS S3 uyumlu) + Sanity CDN + Vercel Edge Network.
- **Yapay Zeka Servisleri:** `@google/genai` SDK ile Google Imagen 3 tabanlı mekan planlama (`api/ai/nano-banana-planner.ts`).
- **Stil & Animasyon:** Tailwind CSS v4, Framer Motion v12, Lenis smooth scroll.
- **Gözlem & Hata Takibi:** `@sentry/react`, Google Analytics 4, PostHog.

---

## 3. SECURITY FINDINGS (GÜVENLİK BULGULARI)

| ID         | Severity        | Problem                                                       | Dosya / Konum                                                      | Risk Analizi                                                                                                                                                                                                                                                                                                                                       | Çözüm Önerisi                                                                                                                                                                              |
| :--------- | :-------------- | :------------------------------------------------------------ | :----------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEC-01** | 🔴 **CRITICAL** | **Origin Header Spoofing ile Admin Yetkilendirme Bypass**     | `api/admin/members.ts:43-51`                                       | İstemcinin gönderdiği `Origin: https://birim.sanity.studio` veya `Origin: http://localhost:3000` başlığı sorgusuz sualsiz admin yetkisi sağlamaktadır. Saldırgan `curl` veya script ile tek bir başlık ekleyerek tüm kullanıcıların kişisel verilerini (ad, e-posta, telefon, vergi no) çekebilir, rolleri admin yapabilir ve mimar onaylayabilir. | Origin başlığı güvenilmezdir (istemci tarafından manipüle edilebilir). Bu blok derhal kaldırılmalı; yalnızca doğrulanmış Admin JWT token veya `ADMIN_SECRET` başlığı zorunlu tutulmalıdır. |
| **SEC-02** | 🔴 **CRITICAL** | **Hardcoded Supabase Service Role Key Fallback**              | `lib/server/supabaseAdmin.ts:8-12`                                 | Ortam değişkeni tanımlanmadığında kod içindeki statik `DEFAULT_SUPABASE_SERVICE_ROLE_KEY` (`SERVICE_ROLE_EXPOSED`) anahtarı devreye girmektedir. Bu anahtar Supabase'deki tüm RLS (Row Level Security) korumasını aşarak veritabanına sınırsız okuma/yazma/silme yetkisi verir.                                                                    | Kod içerisindeki fallback string silinmeli; anahtar eksikse sunucu hata fırlatmalı (500). Açığa çıkmış olabilecek gerçek Supabase anahtarı panelden derhal döndürülmelidir (rotate).       |
| **SEC-03** | 🟠 **HIGH**     | **Sabit ve Tahmin Edilebilir Bakım Modu Bypass Kodları**      | `src/App.tsx:197-203`                                              | `birim-dev-2025`, `birim2025`, `birim-preview` gibi statik anahtarlar client bundle'da açıkça yer almaktadır. `/?bypass=birim2025` yazan herkes bakım modunu devre dışı bırakabilir. Ayrıca bypass çerezi (`SameSite=Lax`, `Secure` ve `HttpOnly` bayrakları olmadan) saklanmaktadır.                                                              | Sabit bypass kodları kaldırılmalı, yalnızca sunucu tarafı oturumu olan admin kullanıcılara geçiş izni verilmelidir.                                                                        |
| **SEC-04** | 🟠 **HIGH**     | **Eski Projelerin Supabase URL ve Anon Key Tanımları**        | `src/lib/supabaseClient.ts:8`, `api/auth/[action].ts:139-143`      | İki farklı Supabase proje ID'si (`rkmpfx...` ve `drertb...`) ve tam Anon JWT token'ı kod içerisine hardcoded yazılmıştır. Proje altyapısı ve eski veritabanı uç noktaları açığa çıkmaktadır.                                                                                                                                                       | Kod içerisindeki fallback string'ler temizlenmeli, yalnızca ortam değişkenleri (`VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) kullanılmalıdır.                                         |
| **SEC-05** | 🟠 **HIGH**     | **Teklif E-postalarında HTML / Script Enjeksiyonu Riski**     | `api/inquiry.ts:98-105`                                            | Formdan gelen `name`, `company`, `email`, `phone`, `projectName`, `message` alanları hiçbir HTML sanitize veya escape işlemine tabi tutulmadan doğrudan HTML e-posta şablonuna gömülmektedir. Yöneticilere phishing / zararlı HTML içeren e-postalar gönderilebilir.                                                                               | Tüm metin girdileri `encodeURIComponent` veya HTML entity escape fonksiyonundan geçirilmeli, şablonda güvenli metin kullanılmalıdır.                                                       |
| **SEC-06** | 🟡 **MEDIUM**   | **Teklif ve Aktivite API'lerinde Rate Limit Eksikliği**       | `api/inquiry.ts:1-35`, `api/analytics/activity.ts:1-35`            | Teklif gönderme (`/api/inquiry`) ve analitik kayıt (`/api/analytics/activity`) uçlarında IP bazlı rate limit bulunmamaktadır. Botlar spam göndererek Resend/SMTP kotalarını bitirebilir veya veritabanını şişirebilir.                                                                                                                             | `isRateLimitedAsync` kontrolü her iki uca da eklenmeli; reCAPTCHA v3 veya Cloudflare Turnstile entegre edilmelidir.                                                                        |
| **SEC-07** | 🟡 **MEDIUM**   | **LocalStorage'da JWT Token Saklanması**                      | `src/pages/AnalyticsPage.tsx:40`, `src/services/sanity/auth.ts:17` | `birim_token` istemci tarafında `localStorage` içinde tutulmakta ve okunmaktadır. XSS zafiyeti durumunda oturum anahtarı çalınabilir.                                                                                                                                                                                                              | Oturum yönetimi yalnızca `HttpOnly; Secure; SameSite=Lax` çerezler üzerinden yürütülmeli; JS'in token okumasına izin verilmemelidir.                                                       |
| **SEC-08** | 🟡 **MEDIUM**   | **VITE_ANALYTICS_PIN ile PIN Kodunun İstemciye İfşası Riski** | `api/analytics.ts:392`, `scripts/local-api-server.mjs:32`          | Vite, `VITE_` ön eki taşıyan tüm değişkenleri derleme anında istemci bundle'ına dahil eder. Analitik PIN kodu gizli bir sunucu sırrı olmalıdır.                                                                                                                                                                                                    | `VITE_ANALYTICS_PIN` kaldırılmalı, yalnızca sunucu tarafı `ANALYTICS_PIN` ortam değişkeni kullanılmalıdır.                                                                                 |
| **SEC-09** | 🔵 **LOW**      | **CSP İçinde unsafe-inline Kullanımı**                        | `vercel.json:41`                                                   | `script-src 'self' 'unsafe-inline'` ve `style-src 'unsafe-inline'` XSS saldırılarına karşı tam koruma sağlamamaktadır.                                                                                                                                                                                                                             | Dinamik inline scriptler yerine CSP nonce veya sha256 hash mekanizmasına geçilmelidir.                                                                                                     |

---

## 4. SUPABASE SECURITY & RLS AUDIT

- **RLS Durumu:** `profiles`, `favorites`, `user_selections`, `projects`, `project_products`, `inquiries`, `user_activities` tablolarının tamamında RLS aktiftir.
- **Kritik Yetki Yükseltme Riski (Privilege Escalation):**
  - `scripts/supabase_schema.sql` dosyasında `profiles` tablosu için şu güncelleme kuralı bulunmaktadır:
    ```sql
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    ```
  - Bu kural kolon kontrolü yapmadığından, oturum açmış herhangi bir kullanıcı Supabase API'si üzerinden kendi profil satırındaki `role` değerini doğrudan `'admin'`, `architect_verification_status` değerini `'approved'` yapabilmektedir!
  - **Çözüm:** Kolon bazlı UPDATE kuralı tanımlanmalı; `role`, `architect_verification_status` ve `is_verified` alanları sadece `service_role` (sunucu tarafı) tarafından güncellenebilir olmalıdır.

---

## 5. USER EXPERIENCE (UX) & CONVERSION AUDIT

### İlk 5 Saniye Testi

- **Güçlü Yönler:** Minimalist tasarım, yüksek kaliteli görsel seçimi ve heykelsi mobilya sunumu kullanıcının premium bir mobilya markasında olduğunu hemen hissettiriyor.
- **Geliştirme Alanı:** Değer önerisi (mimari tasarım vizyonu, proje desteği) yeterince vurgulanmıyor; kullanıcı doğrudan ürün listesine veya galeriye yönlendiriliyor.

### Ürün Keşfi & Teklif Alma Akışı

- **Problem 1 (Teknik Veri Eksikliği):** Lüks mobilya müşterisi ve mimarlar için boyutlar, teknik çizimler, 2D/3D CAD modelleri, döşeme kumaş kartelası ve bakım talimatları hayati önem taşır. Mevcut ürün detay sayfasında bu bilgiler parçalı ve yetersiz kalmaktadır.
- **Problem 2 (Seçkim / Proje Sepeti Sürtünmesi):** `CartSidebar.tsx` içinde kullanıcı ürünleri projeye veya mekana göre (Örn: Salon, Toplantı Odası) gruplayamamakta, doğrudan teklif formuna geçişte ürün varyasyonları (kumaş rengi, ayak tipi) kaybolabilmektedir.
- **Problem 3 (Arama ve Filtreleme):** Ürün filtreleme sırasında URL senkronizasyonu eksik olduğu için kullanıcı geri geldiğinde filtreleri kaybetmektedir.

---

## 6. PERFORMANCE & ASSET AUDIT

| Metrik / Konu               | Mevcut Durum                                                                                                             | Risk / Etki                                                                           | Optimizasyon Önerisi                                                                                                                                   |
| :-------------------------- | :----------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Web Font Yükü**           | `index.html` içinde 5 farklı Google Fonts ailesi (`Inter`, `Jura`, `Michroma`, `Oswald`, `Roboto`) aynı anda yükleniyor. | 200KB+ render-blocking font transferi, mobilde LCP gecikmesi ve FOIT/CLS sıçramaları. | Font ailesi 2 temel fonta indirgenmeli (Başlıklar: Jura/Michroma, Metin: Inter). Fontlar self-host edilmeli ve `woff2` formatında preload edilmelidir. |
| **Ağır Kütüphaneler**       | `jspdf`, `html2canvas`, `react-simple-maps`, `recharts` doğrudan `package.json` ana bağımlılıklarında yer alıyor.        | Genel JS bundle boyutunun gereksiz büyümesi, yavaş TTI (Time to Interactive).         | Bu kütüphaneler yalnızca ilgili sayfalarda (Analytics, PDF export) dinamik `React.lazy()` veya dinamik `import()` ile yüklenmelidir.                   |
| **Konsol Bastırma Scripti** | `public/early-utils.js` dosyasında `console.warn` ve `console.log` monkey-patching yapılıyor.                            | Ekstra HTTP isteği ve runtime overhead.                                               | `vite.config.ts` içindeki `esbuild.drop = ['console', 'debugger']` ile derleme anında çözülmeli, bu script kaldırılmalıdır.                            |
| **Görsel Optimizasyonu**    | Sanity CDN ve Cloudflare R2 kullanılmakta; `w=`, `q=`, `auto=format` parametreleri iyi yapılandırılmış.                  | Genel olarak başarılı.                                                                | Hero ve LCP görselleri için `fetchpriority="high"` etiketi eklenmelidir.                                                                               |

---

## 7. SEO & SOSYAL MEDYA AUDIT

- **Client-Side Rendering (SPA) Kısıtı:** Site Vite SPA olduğu için sunucu tarafında dinamik HTML üretilmemektedir (`react-helmet-async` yalnızca istemci tarafında DOM'a etki eder).
- **Sosyal Medya Botları (Open Graph):** WhatsApp, LinkedIn, X (Twitter), Facebook ve iMessage scraper botları JavaScript çalıştırmaz. Bir kullanıcı `/product/bongo-sofa` linkini WhatsApp'ta paylaştığında, bot raw `index.html`'deki genel "BIRIM | Modern Tasarım" başlığını ve logosunu çeker; ilgili ürünün adı, açıklaması ve görseli paylaşılamaz.
- **Çözüm:** Vercel Edge Middleware veya `/api/og` route handler kullanılarak, sosyal medya crawler User-Agent'ları tespit edilmeli ve Sanity'den ilgili ürünün Open Graph meta etiketleri sunucuda enjekte edilmelidir (veya dinamik SSR/prerender uygulanmalıdır).
- **Yapılandırılmış Veri (Schema.org):** Ürün sayfalarında `schema.org/Product`, `brand`, `offers`, `material` ve `image` JSON-LD şemaları eksiktir. Google Zengin Arama Sonuçları (Rich Snippets) için bu şemalar eklenmelidir.
- **Hreflang:** Çok dilli (TR/EN) altyapı bulunmasına rağmen `<link rel="alternate" hreflang="tr" ...>` etiketleri dinamik olarak başlığa eklenmemektedir.

---

## 8. ACCESSIBILITY (WCAG 2.2) AUDIT

1. **İkon Butonlarında Eksik `aria-label`:** Sepet açma/kapama, favorilere ekleme, menü hamburger butonu ve arama ikonlarında yalnızca SVG ikon bulunmakta, metin etiketi bulunmamaktadır. Ekran okuyucu kullanıcıları için butonun işlevi anlaşılamamaktadır.
2. **Modal Dialoglarda Focus Trap Eksikliği:** `AiRoomPlannerModal.tsx` ve `InquiryModal.tsx` açıldığında klavye odağı (Tab tuşu) modal dışındaki arka plan elemanlarına kayabilmektedir. Modal açıldığında odak modal içine kilitlenmeli ve Escape tuşuyla kapatılabilmelidir.
3. **Renk Kontrastı (Muted Text):** Minimalist tasarım estetiği için kullanılan açık gri (`#888`, `#999`) alt başlıklar, açık temada WCAG AA standardı olan 4.5:1 kontrast oranını sınırda yakalamaktadır. Bu metinler `#666` tonuna çekilmelidir.

---

## 9. CODE QUALITY & MAINTAINABILITY AUDIT

- **Ölü Kod & Versiyon Kirliliği:** `src/pages/` dizininde aktif olarak routelanmayan çok sayıda eski sayfa varyantı bulunmaktadır:
  - `AboutPage.tsx` (Yeni versiyon: `AboutPageNew.tsx`)
  - `ContactPageV2.tsx`
  - `DesignersPageV1.tsx`, `DesignersPageV2.tsx`
  - `FactoryPageV2.tsx`
  - `NewsPageV1.tsx`, `NewsPageV2.tsx`, `NewsPageV3.tsx`
  - `ProjectDetailPageV1.tsx`, `ProjectDetailPageV2.tsx`, `ProjectDetailPageV3.tsx`
  - _Öneri:_ Bu dosyalar projeden kaldırılarak kod tabanı sadeleştirilmelidir.
- **Çift Auth Katmanı:** Projede hem `/api/auth/*` serverless endpointleri hem de doğrudan istemci taraflı `supabase.auth` fonksiyonları paralel olarak kullanılmaktadır. Bu durum state senkronizasyonunda tutarsızlıklara yol açabilmektedir.

---

## 10. COMPETITOR-LEVEL LUXURY BENCHMARK

_(Referans Markalar: Minotti, Poliform, B&B Italia, Vitra)_

| Kriter                          | Minotti / Poliform Standardı                                                                             | Birim Web Mevcut Durumu                                                                    | Seviye / Aksiyon                                                       |
| :------------------------------ | :------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| **Görsel Ritim & Tipografi**    | Geniş beyaz alanlar, heykelsi görsel yerleşimleri, güçlü editoryal grid.                                 | Oldukça başarılı; fotoğraflar ve tipografik hiyerarşi premium hissettiriyor.               | **High-End Design Brand** (Seviye 3/5).                                |
| **Malzeme & Doku Deneyimi**     | Yüksek çözünürlüklü kumaş, deri, mermer, ahşap kaplama numuneleri ve dokunma hissi veren makro çekimler. | Ürün sayfalarında malzeme kartelaları sınırlı; genel ürün fotoğraflarına ağırlık verilmiş. | Her ürün için "Malzeme & Doku Kartelası" interaktif modülü eklenmeli.  |
| **Mimar / B2B Araçları**        | Tek tıkla DWG, 3D Revit, 3DS Max modelleri, teknik şartname PDF'i ve proje alanı.                        | Mimar kayıt formu ve seçkim listesi var ancak doğrudan CAD/DWG indirme akışı eksik.        | Ürün sayfasına "Teknik Çizim & 3D CAD İndirme" alanı eklenmeli.        |
| **Mekan & Koleksiyon Anlatımı** | Tasarımcının hikayesi, üretim süreci ve mekan içi yerleşim kombinasyonları (Editorial Storytelling).     | Tasarımcı sayfaları ve mekan planner modülü mevcut.                                        | Koleksiyon hikayeleri video ve editoryal bloklarla zenginleştirilmeli. |

---

## 11. TOP 10 PRIORITIES (EN ÖNEMLİ 10 İŞ)

1. 🔴 **CRITICAL (SEC-01):** `api/admin/members.ts` içindeki `origin.includes('localhost')` ve `origin === 'https://birim.sanity.studio'` kontrollerini kaldırıp, sıkı Admin JWT / secret kontrolü getirmek.
2. 🔴 **CRITICAL (SEC-02):** `lib/server/supabaseAdmin.ts` içindeki hardcoded `DEFAULT_SUPABASE_SERVICE_ROLE_KEY` fallback'ini tamamen silmek ve gerçek anahtarı Supabase panelinden döndürmek (rotate).
3. 🟠 **HIGH (SEC-03):** `src/App.tsx` içindeki hardcoded maintenance bypass şifrelerini (`birim2025`, `birim-dev-2025`) kaldırmak.
4. 🟠 **HIGH (SEC-04):** `src/lib/supabaseClient.ts` ve `api/auth/[action].ts` dosyalarındaki statik proje URL ve fallback anon key tanımlarını temizlemek.
5. 🟠 **HIGH (SEC-05):** `api/inquiry.ts` e-posta şablonundaki metin alanlarını HTML sanitize işleminden geçirmek.
6. 🟠 **HIGH (PERF-01):** `index.html` dosyasındaki 5 farklı Google Fonts ailesini 2 temel fonta (Jura & Inter) indirgemek ve self-host etmek.
7. 🟠 **HIGH (SEO-01):** Sosyal medya botları ve arama motorları için dinamik Open Graph meta yönetimini (Vercel Edge / Prerender) kurgulamak.
8. 🟡 **MEDIUM (SEC-06 & SEC-07):** `api/inquiry.ts` için IP rate limit eklemek ve `localStorage`'da JWT saklama alışkanlığını sonlandırmak.
9. 🟡 **MEDIUM (UX-01):** Ürün detay sayfalarına mimarlar için 3D CAD/DWG ve materyal kartela indirme bloğu eklemek.
10. 🟡 **MEDIUM (CQ-01):** `src/pages` altındaki V1/V2/V3 eski kopya bileşenleri temizleyerek kod tabanını sadeleştirmek.

---

## 12. THREE-PHASE ACTION PLAN (ÜÇ AŞAMALI AKSİYON PLANI)

### PHASE 1 — IMMEDIATE (Production Güvenliği & Acil Düzeltmeler)

- `api/admin/members.ts` yetkilendirme açığının kapatılması (Origin spoofing engelleme).
- `supabaseAdmin.ts` ve `supabaseClient.ts` içerisindeki tüm hardcoded secret fallback'lerinin kaldırılması.
- `src/App.tsx` bakım modu bypass listesinin güvenli hale getirilmesi.
- `api/inquiry.ts` içindeki HTML enjeksiyonu açığının kapatılması ve rate limiting eklenmesi.
- `VITE_ANALYTICS_PIN` ortam değişkeninin client bundle'dan ayrıştırılması.

### PHASE 2 — NEXT (UX, Performans & SEO İyileştirmeleri)

- Tipografi ve font optimizasyonu (5 fonttan 2 fonta geçiş, font yükleme süresini %60 azaltma).
- Ağır kütüphanelerin (`jspdf`, `recharts`, `react-simple-maps`) dinamik `import()` ile ayrıştırılması.
- Zengin Snippet (`schema.org/Product` ve `Organization`) yapılandırılmış veri entegrasyonu.
- Sosyal medya paylaşımları için dinamik Open Graph meta yönetimi.
- `aria-label` ve Modal Focus Trap erişilebilirlik düzeltmeleri.
- `src/pages` içerisindeki V1/V2/V3 ölü kodların temizlenmesi.

### PHASE 3 — PREMIUM (Uluslararası Lüks Mobilya Markası Standardı)

- **B&B Italia / Minotti Seviyesi 3D & Materyal Deneyimi:** Her ürün için yüksek çözünürlüklü doku örnekleri, döşeme kumaş/deri seçici ve mimarlar için 2D/3D CAD indirme merkezi.
- **Akıllı Mekan & Teklif Hazırlama:** Seçkim/Proje sepetini oda bazlı teklif PDF'ine dönüştüren kurumsal B2B akışı.
- **Global Prestij Hissi:** İki dilli (TR/EN) pürüzsüz dil geçişi, optimize edilmiş mikro-etkileşimler ve sıfır layout-shift (CLS) geçişleri.

---

_Rapor Sonu._
