# BİRİM Sanity Studio — Faz 3.5 Multi-Site, Shared Content & Dil Yönetimi Raporu

**Tarih:** 17 Eylül 2026  
**Durum:** Başarıyla Tamamlandı (70 Test Dosyası, 623 Test %100 Geçti, Main & Studio Derlemeleri Sıfır Hata)  
**Kapsam:** BİRİM.COM + BİRİM SHOP + Shared Content + Çok Dilli Yönetim Mimarisi

---

## 1. Before / After Studio Information Architecture (IA)

### Önceki Yapı (Faz 3):

Studio sol menüsünde içerikler tek bir liste halinde karışıktı. E-ticaret storefront'u (`birim-shop`) ile ana mimari site (`birim.com`) içerik ayrımı net değildi.

### Yeni Yapı (Faz 3.5):

```text
┌─────────────────────────────────────────────────────────────┐
│                      SANITY STUDIO                          │
├─────────────────────────────────────────────────────────────┤
│ 📊 CONTROL CENTER (Canlı E-Ticaret & Envanter Dashboard)   │
│ 🌐 BİRİM.COM (Ana Web Sitesi & Mimari Editoryal)            │
│    ├── Ana Sayfa (homePage)                                 │
│    ├── Hakkımızda (aboutPageV2)                             │
│    ├── Üretim / Fabrika (factoryPage)                       │
│    ├── Projeler (project)                                   │
│    ├── Haberler & Basın (newsItem)                          │
│    ├── İletişim (contactPage)                               │
│    └── Altbilgi (footer)                                    │
│ 🛍️ BİRİM SHOP (E-Commerce Storefront)                       │
│    ├── Shop Ana Sayfası (shopHomePage - Singleton)          │
│    └── Shop Ayarları (shopSettings - Singleton)             │
│ 🪑 ÜRÜNLER & KATALOG (ORTAK / SHARED CATALOG)                │
│    ├── Tüm Ürünler (product)                                │
│    ├── Satışa Hazır (Commerce Ready)                        │
│    ├── İnceleme Gerektirenler (Needs Attention)             │
│    ├── Stok Durumları (In Stock / Preorder / Out of Stock)  │
│    ├── Taslak & Yayında Olmayanlar                          │
│    ├── Kategoriler & Sıralama (category)                    │
│    ├── Tasarımcılar (designer)                              │
│    └── Malzeme Grupları (materialGroup)                     │
│ 👥 KULLANICILAR & RAPORLAR                                  │
│    ├── Site Analitiği (Google Analytics)                    │
│    └── Üyeler & Mimarlar (Supabase Üye Yönetimi)            │
│ ⚙️ SİTE AYARLARI & DİLLER                                    │
│    ├── BİRİM.COM Genel Ayarlar (siteSettings)               │
│    └── UI Çevirileri (Sözlük / translations)                │
│ ⚖️ YASAL METİNLER (ORTAK / SHARED LEGAL)                     │
│    ├── Çerez Politikası (cookiesPolicy)                     │
│    ├── Gizlilik Politikası (privacyPolicy)                  │
│    ├── Kullanım Şartları (termsOfService)                   │
│    ├── KVKK Aydınlatma Metni (kvkkPolicy)                   │
│    ├── Mesafeli Satış Sözleşmesi (distanceSalesAgreement)   │
│    └── Ön Bilgilendirme Formu (preliminaryInfoForm)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Main Site Content Ownership

- **Ana Sayfa (`homePage`):** Mimari marka konumlandırması, editoryal hikaye blokları, hero vitrini.
- **Hakkımızda (`aboutPageV2`):** BİRİM tasarım felsefesi, tarihçe, tasarım manifestosu.
- **Üretim / Fabrika (`factoryPage`):** Zanaat, endüstriyel üretim hatları, malzeme işleme kabiliyetleri.
- **Projeler (`project`):** Mimari referans projeler, otel/ofis uygulamaları, mekansal çekimler.
- **Haberler & Basın (`newsItem`):** Fuar katılımları (Salone del Mobile vb.), ödüller, basın bültenleri.
- **İletişim & Footer (`contactPage`, `footer`):** Genel merkez, showroom adresleri, kurumsal bağlantılar.

---

## 3. Shop Content Ownership

- **Shop Ana Sayfası (`shopHomePage`):**
  - E-ticaret odaklı Hero vitrini (satın alma CTA'leri ile).
  - Selected Objects (Doğrudan satın alınabilir kürasyonlu ürün seçimi).
  - Editorial Blocks (Alışverişe yönlendiren mimari hikaye anlatımları).
  - Category Discovery (Shop kategori keşif kartları).
  - Closer Look (Öne çıkarılan tekil mobilya odağı).
  - Shop SEO & paylaşım meta etiketleri.
- **Shop Ayarları (`shopSettings`):**
  - Mağaza açık/kapalı durumu ve bakım mesajı.
  - Dil ve para birimi destekleri.
  - Ücretsiz kargo eşiği, kargo/iade bilgilendirme metinleri, destek e-posta/telefonu.

---

## 4. Shared Content Ownership (Ortak İçerikler — Sıfır Duplication)

Aşağıdaki varlıklar kesinlikle kopyalanmamış (`shopProduct`, `shopCategory` gibi yapay tipler açılmamış), tek bir authoritative şema olarak her iki siteye hizmet etmektedir:

- **`product`:** Tek fiziksel mobilya dokümanı; hem ana sitede mimari obje hem de Shop'ta satın alınabilir ürün olarak kullanılır.
- **`category`:** Hem mimari katalog navigasyonu hem de e-ticaret kategori ağacı için ortak kullanılır.
- **`designer`:** Tasarımcı profilleri ve biyografileri ortaktır.
- **`materialGroup`:** Ahşap, mermer, kumaş, deri varyasyonları ortaktır.
- **Medya & Assetler:** Cloudflare R2 ve Sanity görsel havuzu ortak kullanılır.

---

## 5. `shopHomePage` Schema Tasarımı

[shopHomePage.tsx](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/birim-web/schemaTypes/documents/shopHomePage.tsx) şu 6 organize alan grubundan (Field Groups) oluşur:

1. `hero`: `heroEnabled`, `heroTitle` (localized), `heroSubtitle` (localized), `heroMedia`, `heroCtaLabel`, `heroCtaTarget`.
2. `selectedObjects`: `selectedObjectsTitle`, `selectedObjectsSubtitle`, `selectedProducts` (reference to `product` array).
3. `editorial`: `editorialSections` (array: `heading`, `subheading`, `body`, `media`, `ctaLabel`, `ctaTarget`, `layoutVariant`).
4. `categoryDiscovery`: `categoryDiscoveryTitle`, `categoryDiscoverySubtitle`, `featuredCategories` (reference to `category` array).
5. `featuredProduct`: `featuredProductEnabled`, `featuredProduct` (reference to `product`), `featuredProductHeadline`, `featuredProductDescription`, `featuredProductMedia`.
6. `seo`: `seo` (metaTitle, metaDescription, ogImage).

---

## 6. `shopSettings` Schema Tasarımı

[shopSettings.tsx](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/birim-web/schemaTypes/documents/shopSettings.tsx) mağazanın çalışma kurallarını içerir:

1. `general`: `shopEnabled` (boolean), `maintenanceMessage` (localizedText).
2. `localization`: `defaultLanguage` ('tr' | 'en'), `availableLanguages` (['tr', 'en']), `defaultCurrency` ('TRY' | 'EUR' | 'USD'), `supportedCurrencies` (['TRY', 'EUR', 'USD']).
3. `commerceMessages`: `announcementBannerEnabled`, `announcementBannerText`, `freeShippingThreshold`, `shippingNotice`, `returnNotice`.
4. `contact`: `supportEmail`, `supportPhone`, `mainSiteUrl`.
5. `seo`: Shop genel varsayılan meta etiketleri.

---

## 7. Singleton Stratejisi

- `shopHomePage` ve `shopSettings` şemaları Studio desk yapısında sabit `documentId('shopHomePage')` ve `documentId('shopSettings')` ile açılır.
- [sanity.config.ts](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/birim-web/sanity.config.ts) içinde `document.newDocumentOptions` yapılandırması ile global "+" menüsünden bu tipler filtrelenmiştir.
- `document.actions` yapılandırması ile singleton dokümanların `duplicate` (çoğaltma) ve `unpublish` aksiyonları devre dışı bırakılmıştır.

---

## 8. Dil Modeli (Language Model)

- BİRİM'in mevcut alan-düzeyi yerelleştirme (Field-Level Localization) sistemi (`localizedString`, `localizedText`, `localizedPortableText`) korunmuştur.
- Her metin alanının altında `{ tr: string, en: string }` veri modeli yer alır.
- Doküman düzeyinde dil kopyalaması (`product_tr`, `product_en`) yapılmaz.

---

## 9. Studio Dil UX (Language UX)

- Studio üst çubuğundaki [CustomStudioNavbar.tsx](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/birim-web/components/CustomStudioNavbar.tsx) ve [StudioLanguageBar.tsx](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/birim-web/components/StudioLanguageBar.tsx) butonları (`TR`, `EN`, `TÜMÜ`) sadece **UI görünüm filtresidir**.
- Dil seçimi hiçbir zaman veriyi silmez veya mutasyona uğratmaz; sadece formdaki o dile ait inputların görünürlüğünü/odağını yönetir.

---

## 10. Localization Fallback Semantik Kuralı

Frontend veri okuma katmanı için deterministik fallback kuralı:

- **Türkçe (TR) istendiğinde:** Öncelik `data.tr` -> Eksikse `data.en` -> Eksikse boş metin `""`.
- **İngilizce (EN) istendiğinde:** Öncelik `data.en` -> Eksikse `data.tr` -> Eksikse boş metin `""`.
- Fallback işlemi Sanity veritabanına aynı metni iki kez yazarak değil, istemci/servis katmanında dinamik olarak çözülür.

---

## 11. Translation Completeness vs. Commerce Readiness

- **Commerce Readiness:** Ürünün fiyat, SKU, stok durumu ve Türkçe başlığının (`name.tr`) tam olması online satışı açmak için yeterlidir.
- **Translation Quality:** İngilizce metin (`name.en` veya `description.en`) eksik olsa dahi bu bir satış engeli (blocker) değil, editoryal uyarıdır (warning). TR mağazasında satış devam edebilir.

---

## 12. Product Visibility Semantiği

- **Ana Sitede Görünürlük:** `isPublished == true` olan tüm ürünler katalogda sergilenir.
- **Shop'ta Satışa Açıklık:** `sale_enabled == true && buyable == true && sales_mode in ["DIRECT", "CONFIGURABLE"]` olan ürünler doğrudan satın alınabilir.
- Fazladan yapay flag'ler (`showInShop`, `commerceVisible` vb.) eklenmemiştir.

---

## 13. SEO Ayrıştırması

- `siteSettings.seo` -> BİRİM.COM ana sitesi kurumsal meta varsayılanları (`og:type`, `metaTitle`, `metaDescription`).
- `shopSettings.seo` -> BİRİM SHOP mağazası e-ticaret odaklı varsayılan meta etiketleri.
- `product.seo` -> İlgili mobilyanın her iki frontend tarafından da tüketilen spesifik ürün meta etiketleri.

---

## 14. Yasal Metinlerin (Legal) Ortak Kullanımı

- KVKK, Çerez Politikası, Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu tek bir şema havuzunda `Yasal Metinler (Ortak)` altında tutulur.
- Hem BİRİM.COM hem de BİRİM SHOP aynı yasal dokümanları çeker; ayrı sözleşme kopyaları oluşturulmaz.

---

## 15. Shared References Doğrulaması

`shopHomePage` içerisindeki tüm seçimler (`selectedProducts`, `featuredCategories`, `featuredProduct`) mevcut `product` ve `category` dokümanlarına doğrudan Sanity `reference` bağlantısı kurar.

---

## 16. Control Center Uyumluluğu

- Faz 3 ve Faz 3.1'de geliştirilen **BİRİM Control Center** dashboard'u, üst menüdeki yerini ve yetkili API bağlantısını aynen korur.
- `useCommerceMetrics`, `useRecentOrders` ve `useProductHealth` hook'ları yeni şema yapısıyla %100 uyumludur.

---

## 17. Production Auth / Cookie Mimarisi Değerlendirmesi

Control Center'ın `credentials: 'include'` ile yetkilendirilmesi sürecinde:

- **Mevcut Durum:** `https://birim.sanity.studio` ile BİRİM API origin'i cross-site olabilir. `SameSite=Lax` güvenlik çerezi bu durumda tarayıcı tarafından kısıtlanabilir.
- **Önerilen Kalıcı Çözüm (Option A):** Sanity Studio'nun `https://studio.birim.com` adresinde self-host edilmesi (veya reverse proxy altına alınması). Böylece `birim.com` ile first-party aynı site çerezi güvenle taşınır.
- **Alternatif (Option B):** Server-side Sanity Identity Bridge doğrulaması.
- **Güvenlik Notu:** Bu fazda çerez ayarları körlemesine `SameSite=None` yapılarak güvenlik zayıflatılmamıştır.

---

## 18. Test Sonuçları

- Yeni test suite: [sanity_multisite_phase3_5.test.ts](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/src/test/sanity_multisite_phase3_5.test.ts)
- Kapsam: Şema kayıtları, anti-duplication doğrulaması, field groups, dil/para birimi ayrımı, desk structure IA, singleton kuralları, dil fallback semantiği.
- **Sonuç:** 70 test dosyasında **623 test %100 başarılı**.

---

## 19. Derleme (Build) Sonuçları

- **Sanity Studio (`npm run build` in `birim-web`):** Başarılı (0 hata).
- **Web App (`npm run build` in `my-birim-react`):** Başarılı (0 hata, typecheck & sitemap dahil).
- **ESLint (`npm run lint`):** 0 error, 0 warning.

---

## 20. Sıradaki Frontend Entegrasyon Fazı

Bu fazda `birim-shop` projesine dokunulmamış (READ ONLY kuralı korunmuş), Studio CMS altyapısı hazır hale getirilmiştir. Bir sonraki fazda:

1. `birim-shop` içerisindeki `homeService.ts` / `shopSettingsService.ts` katmanları yazılarak Sanity'deki `shopHomePage` ve `shopSettings` verileri tüketilecektir.
2. `HomePage.tsx` bileşeni canlı CMS verileriyle dinamik hale getirilecektir.
