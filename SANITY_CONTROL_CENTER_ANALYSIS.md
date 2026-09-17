# BİRİM SANITY CONTROL CENTER — MİMARİ ANALİZ VE DÖNÜŞÜM PLANI

**Tarih:** 17 Eylül 2026  
**Hedef Sistem:** BİRİM Control Center (Sanity Studio v3 Unified Dashboard)  
**Kapsam:** `my-birim-react/birim-web` & `my-birim-react/api`  
**Durum:** Mimari Analiz Tamamlandı (0 Fonksiyonel Kod Değişikliği)

---

## 1. EXISTING SANITY ARCHITECTURE (MEVCUT SANITY MİMARİSİ)

- **Sanity Sürümü:** Sanity v3 (`sanity@^3.77.0`, `@sanity/structure`, `@sanity/vision`, `@sanity/orderable-document-list`, `@sanity/color-input`).
- **Project ID:** `wn3a082f`
- **Dataset:** `production`
- **Studio Host:** `birim` (`https://birim.sanity.studio`)
- **Deployment ID:** `uhq1n1x3jfninkphme61bf2x`
- **Vite & CLI Config:** `birim-web/sanity.cli.ts` içerisinde Vite optimizeDeps ve özel Sentry/WebSocket blocker eklentileri ile yapılandırılmıştır. Node ortamı için global DOM shim'leri tanımlıdır.

---

## 2. STUDIO LOCATION (STUDIO KONUMU VE DOSYA HARİTASI)

- **Studio Root:** `C:\Users\ASUS\.gemini\antigravity\scratch\my-birim-react\birim-web`
- **Konfigürasyon Dosyaları:**
  - `birim-web/sanity.config.ts`: Studio ana tanımları, eklentiler, search strategy (`groq2024`), default document views.
  - `birim-web/sanity.cli.ts`: Deployment ve CLI ayarları.
  - `birim-web/deskStructure.ts`: Sol navigasyon (Desk Structure) listesi ve menü ağacı.
  - `birim-web/schemaTypes/index.ts`: Şema tipleri fihristi.

---

## 3. SCHEMA MAP (ŞEMA VE TİP HARİTASI)

Mevcut Studio içerisinde **20 Doküman Tipi** ve **9 Obje Tipi** tanımlıdır:

### Doküman Tipleri (Document Types):

1. `product`: Ürünler ve modeller
2. `category`: Kategoriler
3. `designer`: Tasarımcılar
4. `project`: Mimari projeler
5. `newsItem`: Basın ve haberler
6. `homePage`: Ana sayfa editoryal blokları
7. `aboutPage`: Hakkımızda sayfası (v1)
8. `aboutPageV2`: Hakkımızda sayfası (v2)
9. `factoryPage`: Üretim / Fabrika sayfası
10. `contactPage`: İletişim sayfası
11. `siteSettings`: Genel site ayarları, header/footer konfigürasyonu
12. `footer`: Altbilgi metinleri ve menüleri
13. `cookiesPolicy`: Çerez politikası
14. `privacyPolicy`: Gizlilik politikası
15. `termsOfService`: Kullanım koşulları
16. `kvkkPolicy`: KVKK metni
17. `distanceSalesAgreement`: Mesafeli satış sözleşmesi
18. `preliminaryInfoForm`: Ön bilgilendirme formu
19. `materialGroup`: Malzeme grupları
20. `translations`: UI sözlük çevirileri

### Obje Tipleri (Object Types):

1. `productVariant`: Varyant fiyatı, SKU, opsiyonlar (`COLOR`, `SIZE`, `MATERIAL`), aktiflik durumu
2. `productHotspot`: Görsel üzerinde etkileşimli ürün etiketleri
3. `r2Asset`: Cloudflare R2 görsel/video metadata'sı, crop/hotspot ve mobil/desktop URL'leri
4. `seoFields`: Meta title, description, keywords, ogImage
5. `interactiveShowcaseItem`: İnteraktif vitrin elemanı
6. `localizedString`: `{ tr?: string, en?: string }`
7. `localizedText`: Çok dilli düz metin
8. `localizedPortableText`: Çok dilli zengin metin (Rich Text)
9. `shared`: Ortak medya ve panel yapılandırma objeleri

---

## 4. DESK STRUCTURE (MEVCUT YÖNETİM AĞACI)

`birim-web/deskStructure.ts` dosyasında:

- `Site Analitiği` (GA4 iframe arayüzü)
- `Üyeler & Mimarlar (Supabase)` (Supabase özel React görünümü)
- `Site Ayarları`, `UI Çevirileri`, `Ana Sayfa`
- `Kategoriler & Modeller` (Sıralanabilir kategori listesi)
- `Tüm Modeller` (Standart `product` listesi)
- `Tasarımcılar`, `Projeler`, `Haberler`, `Hakkımızda`, `Üretim`, `İletişim`, `Altbilgi`, `Malzeme Grupları`

---

## 5. PRODUCT SCHEMA & COMMERCE FIELDS

`birim-web/schemaTypes/documents/product.tsx` şeması aşağıdaki commerce alanlarını barındırır:

- `buyable` (boolean): Satın alınabilirlik bayrağı.
- `sale_enabled` (boolean): E-ticaret satışına açık olup olmadığı.
- `sales_mode` (string): `NONE`, `DIRECT`, `CONFIGURABLE`, `QUOTE`.
- `price` (number): Taban fiyat.
- `currency` (string): Para birimi (`TRY`, `USD`, `EUR`).
- `sku` (string): Stok kodu.
- `stockStatus` (string): `in_stock`, `out_of_stock`, `preorder`.
- `variants` (array of `productVariant`): Özel varyantlar listesi.

---

## 6. CURRENT CUSTOM COMPONENTS & TOOLS

- **Custom Navbar:** `CustomStudioNavbar.tsx` (Dil seçici ve stüdyo üst barı).
- **Document Views:** `CategoryProductsView.tsx` (Kategoriye bağlı modelleri listeleyen özel sekme), `PreviewView.tsx` (Canlı iframe önizleme).
- **Custom Tools:**
  - `excelImportTool` (Excel'den ürün ve veri aktarımı).
  - `mediaImportTool` & `mediaExportTool` (R2 / Cloudflare medya araçları).
  - `emailExportTool` (Bülten e-postalarını dışa aktarma).
  - `supabaseUsersTool` (Supabase kullanıcı ve mimar onay arayüzü).

---

## 7. CURRENT ADMIN API (MEVCUT SUNUCU ADMIN ENDPOINT'LERİ)

`my-birim-react/api/admin/[...slug].ts` sunucu tarafında hazırdır:

- `GET /api/admin/members`: Supabase profilleri listesi (mimarlar, kurumsal üyeler).
- `POST /api/admin/members`: Üye onay durumu ve rol güncellemeleri.
- `GET /api/admin/commerce/orders`: Supabase `commerce_orders` tablosundan sayfalanmış, filtrelenebilir (arama, durum, ödeme durumu, tarih aralığı) sipariş listesi.
- `GET /api/admin/commerce/orders/:orderId`: Sipariş detayları, kalemler, ödeme ve iade logları.
- `POST /api/admin/commerce/orders` (`action: 'cancel' | 'refund'`): Sipariş iptal ve iade işlemleri.

---

## 8. CURRENT ANALYTICS API

`my-birim-react/api/analytics.ts`:

- Google Analytics Data API v1beta (`runReport`, `runRealtimeReport`).
- Kullanıcı aktivite loglama (`user_activity_logs`).

---

## 9. ORDER & READ API CAPABILITIES (SİPARİŞ VERİ YETENEKLERİ)

- **Authoritative Kaynak:** Supabase PostgreSQL (`commerce_orders`, `commerce_order_items`, `commerce_payment_transactions`, `commerce_refunds`).
- **Mevcut Yetenekler:**
  - Sipariş durumları: `PENDING`, `PAID`, `CANCELLED`, `REFUNDED`, `FAILED`.
  - Toplam satış (Subtotal, Tax, Shipping, Grand Total).
  - Arama ve tarih filtreleme.
- Sanity Studio bu verileri doğrudan veritabanından değil, **yalnızca read-only `/api/admin/commerce/orders` API'si üzerinden** okuyacaktır.

---

## 10. CRITICAL SECURITY FINDING & BOUNDARIES (GÜVENLİK İNCELEMESİ)

> [!CAUTION]
> **KRİTİK GÜVENLİK BULGUSU:**  
> `birim-web/components/SupabaseUsersStudioView.tsx` (satır 65-66) içerisinde hardcoded `SUPABASE_ADMIN_KEY` (service_role) istemci tarafına gömülmüştür.  
> Sanity Studio tamamen tarayıcıda çalışan bir Single Page Application (SPA)'dır. Servis anahtarları, DB admin anahtarları ve ödeme gizli anahtarları asla Studio koduna gömülmemelidir.

### Güvenlik Sınırı Kuralı:

1. Studio istemcisi hiçbir zaman `SUPABASE_SERVICE_ROLE_KEY`, `PAYMENT_SECRET_KEY` veya `ADMIN_SECRET` içermeyecektir.
2. Control Center tüm commerce ve analitik verilerini sunucu tarafındaki `/api/admin/*` üzerinden güvenli admin oturumu ile çekecektir.

---

## 11. AUTHENTICATION APPROACH (KİMLİK DOĞRULAMA YAKLAŞIMI)

- Sanity Studio oturumu açmış kullanıcılar için:
  - **Seçenek A (Önerilen):** Admin Giriş Token'ı (kısa ömürlü HttpOnly Cookie veya Authorization Bearer Header ile taşınan Admin JWT).
  - **Seçenek B:** Sanity Studio SSO / Project User Role doğrulaması yapan sunucu middleware'i (`@sanity/client` ile user role check).
- Tarayıcı koduna statik `x-admin-secret` gömmek kesinlikle yasaktır.

---

## 12. CORS REQUIREMENTS (CORS GEREKSİNİMLERİ)

`my-birim-react/lib/server/cors.ts` içerisinde Studio origin'i zaten tanımlıdır:

- `https://birim.sanity.studio`
- `https://www.birim.com`
- `http://localhost:3333` (Geliştirme ortamı)
- Credentials: `true`.

---

## 13. PROPOSED CONTROL CENTER INFORMATION ARCHITECTURE (BİLGİ MİMARİSİ)

```text
┌─────────────────────────────────────────────────────────────┐
│                   BİRİM CONTROL CENTER                      │
├─────────────────────────────────────────────────────────────┤
│ 1. OVERVIEW (Genel Bakış Dashboard)                         │
│    ├── Net Sales, Orders, AOV, Refunds                      │
│    ├── Sales Trend Chart (30 Days)                          │
│    ├── Needs Attention Alerts (Fiyat/Görsel/Varyant Eksik)  │
│    └── Recent Orders Snapshot (Son 5 Sipariş)               │
├─────────────────────────────────────────────────────────────┤
│ 2. PRODUCTS (Gelişmiş Ürün Yönetimi)                        │
│    ├── All Products (Tüm Modeller)                          │
│    ├── Commerce Ready (Satışa Hazır Olanlar)                │
│    ├── Needs Attention (Ticari/İçerik Eksiği Olanlar)       │
│    ├── Out of Stock (Stokta Olmayanlar)                     │
│    ├── Preorder (Ön Siparişte Olanlar)                      │
│    └── Drafts & Unpublished (Taslaklar)                     │
├─────────────────────────────────────────────────────────────┤
│ 3. COMMERCE & ORDERS (Sipariş ve Satış İzleme)              │
│    ├── Recent Orders (Read-Only Liste)                      │
│    └── Order Status Filter (PAID, PENDING, REFUNDED)        │
├─────────────────────────────────────────────────────────────┤
│ 4. PERFORMANCE & METRICS (Ürün ve Kategori Performansı)     │
│    ├── Top Viewed Products                                  │
│    ├── Most Added to Bag                                    │
│    └── Conversion Rates (Funnel)                            │
├─────────────────────────────────────────────────────────────┤
│ 5. CONTENT (Sayfa ve Editoryal Yönetim)                     │
│    ├── Home Page, About, Factory, Contact                   │
│    └── Projects, Designers, News                            │
├─────────────────────────────────────────────────────────────┤
│ 6. MEDIA & ASSETS (R2 Medya Merkezi)                        │
├─────────────────────────────────────────────────────────────┤
│ 7. SETTINGS & TRANSLATIONS (Site Ayarları ve Çeviriler)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 14. OVERVIEW METRICS (GENEL BAKIŞ METRİKLERİ)

Authoritative backend `/api/admin/commerce/orders` üzerinden üretilecek güvenilir metrikler:

- **Net Sales:** İadeler düşülmüş net ciro (`SUM(grand_total) - SUM(refund_total)`).
- **Order Count:** Başarılı sipariş adedi (`COUNT(orders WHERE payment_status == 'PAID')`).
- **Average Order Value (AOV):** Ortalama sipariş büyüklüğü (`Net Sales / Order Count`).
- **Refund Total:** Toplam iade tutarı (`SUM(refund_total)`).
- **Zaman Filtreleri:** Bugün, 7 Gün, 30 Gün, 90 Gün.

---

## 15. PRODUCT READINESS ENGINE (ÜRÜN HAZIRLIK KONTROLÜ)

Her ürün için otomatik olarak hesaplanan hazırlık kriterleri:

1. `name.tr` ve `name.en` tanımlı mı?
2. `id.current` (Slug) geçerli mi?
3. En az 1 kapak görseli (`isCover == true`) var mı?
4. `category` referansı seçilmiş mi?
5. `sale_enabled == true` ise:
   - `price > 0` ve `currency` tanımlı mı?
   - `sku` tanımlı mı?
   - `stockStatus` belirlenmiş mi?
   - `sales_mode == 'CONFIGURABLE'` ise en az 1 aktif varyant (`variants[enabled == true]`) var mı?

### Durum Seviyeleri:

- 🟢 **READY (Hazır):** Tüm kriterler eksiksiz.
- 🟡 **NEEDS ATTENTION (Dikkat):** Satışa açık ancak fiyat, SKU veya varyant eksik.
- ⚪ **DRAFT / INCOMPLETE (Eksik):** Temel içerik veya görsel eksik.

---

## 16. NEEDS ATTENTION LOGIC (KALİTE KONTROL LİSTESİ)

Desk Structure içerisinde özel bir GROQ sorgusuyla çalışan otomatik filtre:

```groq
*[_type == "product" && (
  (sale_enabled == true && (!defined(price) || price <= 0 || !defined(sku) || sku == "")) ||
  (sale_enabled == true && sales_mode == "CONFIGURABLE" && count(variants[enabled == true]) == 0) ||
  count(media) == 0 ||
  !defined(category)
)]
```

Bu sayede katalog yöneticisi ticari aksaklık yaratabilecek tüm ürünleri tek tıkla listeler.

---

## 17. PRODUCT PERFORMANCE ARCHITECTURE (PERFORMANS MİMARİSİ)

- `birim-shop` tarafında tanımlanan `SHOP_ANALYTICS_EVENT_PLAN.md` eventleri (`product_view`, `product_click`, `add_to_bag`, `checkout_start`, `order_created`) Supabase içerisinde `shop_analytics_events` tablosunda toplanır.
- Sanity Control Center, `/api/admin/analytics/products` endpoint'i üzerinden ürün bazlı görüntülenme, sepete eklenme ve dönüşüm oranlarını görüntüler.

---

## 18. ORDERS READ-ONLY APPROACH (SİPARİŞ GÖRÜNÜMÜ)

- Siparişler Sanity şeması yapılmaz (Sanity document değildir).
- Studio içerisindeki Control Center özel arayüzünde, `/api/admin/commerce/orders` endpoint'inden çekilen read-only bir sipariş kartı/tablosu gösterilir.
- Müşteri kişisel verileri (telefon, adres) liste görünümünde gizlenir, yalnızca Sipariş No, Durum, Kalem Sayısı, Tutar ve Tarih sunulur (**Zero-PII Compliance**).

---

## 19. ANALYTICS STORAGE RECOMMENDATION (DEPOLAMA KARARI)

- **Öneri: Seçenek A + D (Supabase Events + Daily Aggregations)**
  - Ham eventler: Supabase `shop_analytics_events` tablosunda anonim (PII-free) olarak tutulur.
  - Günlük metrikler: `shop_daily_product_metrics` tablosunda toplanarak dashboard açılış hızı maksimize edilir.

---

## 20. REQUIRED BACKEND ADDITIONS (GEREKLİ SUNUCU GELİŞTİRMELERİ)

1. `/api/admin/commerce/metrics`: Tarih aralığına göre Net Satış, Sipariş Adedi, AOV ve İade toplamlarını dönen özet endpoint.
2. `/api/admin/analytics/products`: Ürün bazlı analitik huni (Funnel) metrikleri endpoint'i.
3. `/api/admin/auth/verify`: Studio kullanıcısının admin yetkisini doğrulayan güvenli token endpoint'i.

---

## 21. REQUIRED SANITY STUDIO CHANGES (GELECEK AŞAMALARDA YAPILACAKLAR)

1. `birim-web/tools/controlCenter/`: Yeni Control Center Custom Studio Tool'u.
2. `birim-web/deskStructure.ts`: `Commerce Ready`, `Needs Attention`, `Out of Stock`, `Preorder` filtreli listelerinin eklenmesi.
3. `birim-web/schemaTypes/documents/product.tsx`: Liste preview görünümünde Sales Mode (`DIRECT`, `CONFIGURABLE`, `QUOTE`), Stok Durumu ve Fiyatın gösterilmesi.
4. `SupabaseUsersStudioView.tsx`: Hardcoded `SUPABASE_ADMIN_KEY` kaldırılarak güvenli `/api/admin/members` endpoint'ine bağlanması.

---

## 22. RISKS & MITIGATION (RİSKLER VE ÖNLEMLER)

- **Risk 1 (Güvenlik):** Client-side service role sızıntısı. -> **Önlem:** Tüm Supabase yazma/okuma işlemleri server API'ye taşınacaktır.
- **Risk 2 (Performans):** Studio açılışında ağır sipariş sorguları. -> **Önlem:** Sayfalama (pagination) ve 60 saniyelik sunucu önbelleği (cache).
- **Risk 3 (UI Bozulması):** Aşırı özel CSS'in Sanity Studio güncellemelerini kırması. -> **Önlem:** Yalnızca Sanity'nin resmi `@sanity/ui` bileşenleri kullanılacaktır.

---

## 23. RECOMMENDED IMPLEMENTATION PHASES (UYGULAMA FAZLARI)

- **Faz 1: Güvenlik İyileştirmesi & Backend Metrik Endpoint'leri**
  - `SupabaseUsersStudioView.tsx` içerisindeki service role anahtarını temizleme.
  - `/api/admin/commerce/metrics` endpoint'ini geliştirme.
- **Faz 2: Desk Structure & Product Readiness**
  - Sanity Desk Structure'a filtrelenmiş ürün listeleri (`Commerce Ready`, `Needs Attention`) ve zengin preview'lar ekleme.
- **Faz 3: Control Center Studio Tool**
  - Overview, Satış Grafiği ve Son Siparişler bileşenlerini içeren `ControlCenterTool` geliştirme.
- **Faz 4: Performance & Analytics Widget'ı**
  - Ürün funnel ve görüntülenme metriklerini Control Center'a bağlama.

---

## 24. SIGN-OFF STATUS & INTEGRITY CHECK

Bu analiz aşamasında **hiçbir fonksiyonel kod dosyası değiştirilmemiş**, mevcut sistemin işleyişi %100 korunmuştur.

- `my-birim-react` git status: `working tree clean` (rapor dosyası hariç).
- `birim-shop` git status: `working tree clean`.

---

# SANITY CONTROL CENTER ANALYSIS COMPLETE

## Existing capabilities

1. Sanity v3 altyapısı hazır, Cloudflare R2 medya yönetimi entegre.
2. Ürün şemasında `buyable`, `sale_enabled`, `sales_mode`, `price`, `sku`, `stockStatus`, `variants` alanları tanımlı.
3. Sunucu tarafında `/api/admin/commerce/orders` sipariş listeleme, detay ve iptal/iade altyapısı mevcut.
4. Supabase üzerinde `commerce_orders`, `commerce_order_items`, `commerce_refunds` tabloları çalışır durumda.
5. GA4 analitik ve kullanıcı aktivite API'si mevcut.

## Missing capabilities

1. Sanity Studio içerisinde merkezi bir "Control Center" dashboard ekranı bulunmuyor.
2. Desk Structure'da `Commerce Ready` ve `Needs Attention` gibi ticari hazır olma filtreleri bulunmuyor.
3. Satış metriklerini (Net Satış, Sipariş Adedi, AOV, İade) özetleyen `/api/admin/commerce/metrics` endpoint'i henüz yazılmadı.
4. `SupabaseUsersStudioView.tsx` istemci kodunda hardcoded `SUPABASE_ADMIN_KEY` yer alıyor (güvenlik açığı).
5. Ürün analitik eventlerini (Görüntülenme -> Sepete Ekleme -> Satın Alma) toplayan ve ürün bazında özetleyen tablo/pipeline henüz bağlanmadı.

## Recommended architecture

- **Veri Ayrımı:** Sanity Studio = İçerik ve Yönetim Arayüzü (UI); Supabase = Authoritative Ticaret ve Sipariş Veritabanı.
- **Güvenlik Köprüsü:** Sanity Studio doğrudan Supabase service role kullanmaz; yalnızca doğrulanmış `/api/admin/*` serverless endpoint'leri ile haberleşir.
- **BİRİM Tasarım Uyumu:** Minimalist, siyah-beyaz, yüksek boşluklu, `@sanity/ui` native bileşenleriyle inşa edilmiş lüks kontrol paneli.
- **Sıfır Kişisel Veri (Zero-PII):** Dashboard ve analitik görünümlerinde müşteri adı, e-posta, telefon ve adres gizlenir.

## Security findings

1. `birim-web/components/SupabaseUsersStudioView.tsx` içerisindeki hardcoded `SUPABASE_ADMIN_KEY` (service_role) derhal sunucu katmanına taşınmalı ve bundle'dan kaldırılmalıdır.
2. Control Center API çağrıları için session-based admin token veya Sanity user yetkilendirmesi kullanılmalıdır.
3. CORS kuralları yalnızca `https://birim.sanity.studio` ve localhost domainlerine açık tutulmalıdır.

## Proposed implementation phases

1. **Faz 1:** Güvenlik temizliği (`SupabaseUsersStudioView.tsx` refactor) & `/api/admin/commerce/metrics` API'si.
2. **Faz 2:** Desk Structure optimizasyonu (Commerce Ready, Needs Attention, zenginleştirilmiş ürün önizlemeleri).
3. **Faz 3:** BİRİM Control Center Studio Tool (Overview kartları, 30 günlük satış trendi, son siparişler listesi).
4. **Faz 4:** Ürün performans ve dönüşüm hunisi (Funnel) analitik paneli.
