# BİRİM SANITY CONTROL CENTER — FAZ 2 RAPORU

**Tarih:** 17 Eylül 2026  
**Kapsam:** Desk Structure Optimizasyonu + Product Readiness Engine + Needs Attention  
**Hedef Proje:** `my-birim-react` (`birim-web` Sanity Studio)  
**Durum:** Başarıyla Tamamlandı (68 Test Dosyası, 600 Test %100 Başarılı, Build & Lint Temiz)

---

## 1. DESK STRUCTURE BEFORE / AFTER (ÖNCESİ VE SONRASI)

### Önceki Yapı:

- Düz ve gruplanmamış liste görünümü.
- Tüm `product` dokümanları tek bir "Tüm Modeller" listesindeydi.
- Satışa hazır olan ve olmayan ürünleri ayırmak için filtre yoktu.
- Stok durumu bazlı veya veri eksiği olan ürünleri görmek için her ürünü tek tek açmak gerekiyordu.

### Yeni Yapı:

- **Ürünler & Modeller (Commerce Hub):**
  - 📦 **Tüm Ürünler:** Tüm ürün dokümanları.
  - ✅ **Satışa Hazır (Commerce Ready):** Yayında ve eksiksiz satılabilir ürünler.
  - ⚠️ **İnceleme Gerektirenler (Needs Attention):** Satışa açılmış fakat fiyatı, SKU'su, varyantı veya görseli eksik olanlar.
  - 🏷️ **Stok Durumları (Inventory Health):**
    - 🟢 Stokta Olanlar (`in_stock`)
    - 🟡 Ön Sipariş (`preorder`)
    - 🔴 Stok Dışı (`out_of_stock`)
  - 📝 **Taslak & Yayında Olmayanlar:** Draft veya `isPublished == false` olan ürünler.
- **Katalog & Mimari:** Kategoriler & Sıralama, Tasarımcılar, Projeler, Malzeme Grupları, Haberler & Basın.
- **Sayfa İçerikleri (Content):** Ana Sayfa, Hakkımızda, Üretim, İletişim.
- **Kullanıcılar & Raporlar:** Site Analitiği, Üyeler & Mimarlar (Supabase).
- **Site Ayarları & Yasal:** Genel Ayarlar, UI Çevirileri, Footer ve 6 Yasal Sözleşme (Mesafeli Satış, Ön Bilgilendirme dahil).

---

## 2. PRODUCT MENU HIERARCHY (ÜRÜN MENÜ HİYERARŞİSİ)

```text
Ürünler & Modeller (🪑)
  ├── Tüm Ürünler (📦)
  ├── Satışa Hazır (Commerce Ready) (✅)
  ├── İnceleme Gerektirenler (Needs Attention) (⚠️)
  ├── ────────────────
  ├── Stok Durumları (Inventory Health) (🏷️)
  │     ├── Stokta Olanlar (🟢)
  │     ├── Ön Sipariş (🟡)
  │     └── Stok Dışı (🔴)
  └── Taslak & Yayında Olmayanlar (📝)
```

---

## 3. COMMERCE READY GROQ QUERY

Satışa hazır ürünleri filtreleyen authoritative GROQ sorgusu:

```groq
_type == "product" &&
isPublished == true &&
sale_enabled == true &&
buyable == true &&
defined(category) &&
(
  (sales_mode == "DIRECT" && defined(price) && price > 0 && defined(currency) && defined(sku) && defined(stockStatus)) ||
  (sales_mode == "CONFIGURABLE" && count(variants[enabled == true && defined(price) && price > 0 && defined(sku)]) > 0)
)
```

---

## 4. NEEDS ATTENTION GROQ QUERY

Satışa açılmış fakat eksik verisi olan ürünleri tespit eden GROQ sorgusu:

```groq
_type == "product" &&
sale_enabled == true &&
(
  !defined(category) ||
  buyable != true ||
  !defined(sales_mode) ||
  sales_mode in ["NONE", "QUOTE"] ||
  !defined(stockStatus) ||
  (sales_mode == "DIRECT" && (!defined(price) || price <= 0 || !defined(currency) || !defined(sku))) ||
  (sales_mode == "CONFIGURABLE" && (count(variants[enabled == true]) == 0 || count(variants[enabled == true && (!defined(price) || price <= 0 || !defined(sku))]) > 0)) ||
  count(media) == 0
)
```

---

## 5. STOCK FILTERS (STOK FİLTRELERİ)

Yalnızca şemadaki gerçek enum değerleri kullanılmıştır:

- **Stokta:** `_type == "product" && stockStatus == "in_stock"`
- **Ön Sipariş:** `_type == "product" && stockStatus == "preorder"`
- **Stok Dışı:** `_type == "product" && stockStatus == "out_of_stock"`

---

## 6. READINESS ENGINE (`getProductReadiness`)

- Konumlar: `lib/commerce/product-readiness.ts` ve `birim-web/utils/productReadiness.ts`
- Prensip: Saf, deterministik fonksiyon. Veritabanına hiçbir state yazmaz, anlık hesaplama yapar.
- Dönüş Yapısı:

```ts
{
  status: 'READY' | 'NEEDS_ATTENTION' | 'INCOMPLETE' | 'NOT_FOR_SALE',
  isCommerceReady: boolean,
  blockers: string[],
  warnings: string[],
  summary: string
}
```

---

## 7. BLOCKERS VS WARNINGS (ENGELLEYİCİLER VE UYARILAR)

- **Blockers (Satışı Doğrudan Engelleyenler):**
  - Türkçe isim (`name.tr`), slug veya kategori eksikliği.
  - Medya/görsel bulunmaması.
  - `sale_enabled: true` iken `buyable: false` olması veya Satış Modunun `NONE`/`QUOTE` olması.
  - DIRECT modda fiyatın, SKU'nun veya para biriminin eksik olması.
  - CONFIGURABLE modda hiç aktif varyant olmaması veya aktif varyantlarda fiyat/SKU eksikliği.
- **Warnings (Kalite & SEO Uyarıları):**
  - İngilizce isim (`name.en`) eksikliği (satışı engellemez).
  - Açıklama metni veya tasarımcı atanmamış olması.
  - Belirgin kapak görseli (`isCover`) işaretlenmemiş olması.

---

## 8. PRODUCT PREVIEW (LİSTE ÖNİZLEME GELİŞTİRMESİ)

`product.tsx` şemasındaki `preview.prepare` metodu zenginleştirildi:

- **DIRECT:** `Kategori · DIRECT · ₺125.000 · SKU: NMA-01 · Stokta`
- **CONFIGURABLE:** `Kategori · CONFIGURABLE (2 Aktif / 4 Varyant) · SKU: NMA-CFG · Ön Sipariş` (Yanıltıcı taban fiyat gösterilmez).
- **QUOTE:** `Kategori · QUOTE (Teklif) · Stokta`

---

## 9. PRODUCT EDITOR IMPROVEMENTS (ÜRÜN EDİTÖRÜ)

- `birim-web/components/ProductDocumentInput.tsx` bileşeni güncellendi.
- Breadcrumbs çubuğunun hemen altına **Commerce Readiness Inspector** eklendi:
  - Gerçek zamanlı badge (`● Commerce Ready`, `▲ Needs Attention`, `○ Katalog`).
  - Detayları Göster/Gizle butonuyla engelleyicileri (✕) ve uyarıları (!) tek tıkla listeleme.
  - Sıfır veritabanı yazımı, anlık tepki.

---

## 10. SCHEMA VALIDATIONS (ŞEMA DOĞRULAMALARI)

- `sales_mode`: `sale_enabled=true` ise `NONE` seçildiğinde uyarı/hata.
- `price` & `sku`: `sales_mode == 'DIRECT'` iken zorunlu.
- `variants`: `sales_mode == 'CONFIGURABLE'` iken en az 1 aktif varyant zorunlu.

---

## 11. LOCALIZATION RULES (DİL KURALLARI)

- Türkçe alanlar (`name.tr`) ana pazar için zorunlu blocker kabul edilir.
- İngilizce alanların (`name.en`) eksikliği satışı bloke etmez, editöre editoryal uyarı olarak gösterilir.

---

## 12. SECURITY REGRESSION

- İstemci tarafında hiçbir secret key, admin token veya `SUPABASE_SERVICE_ROLE_KEY` bulunmadığı test edilmiştir.
- Tüm yönetim operasyonları Faz 1'de kurulan sunucu API modeliyle uyumludur.

---

## 13. TESTS (TEST KAPSAMI)

- **Yeni Test Dosyası:** `src/test/product_readiness.test.ts` (9 kapsamlı test)
  - DIRECT tam konfigürasyon → READY
  - DIRECT fiyatsız / SKU'suz → NEEDS_ATTENTION
  - CONFIGURABLE aktif varyantlı → READY
  - CONFIGURABLE tüm varyantlar kapalı → NEEDS_ATTENTION
  - `sale_enabled: false` → NOT_FOR_SALE
  - `name.en` eksikliği → Warning only
  - Preview formatlama (DIRECT fiyatlı, CONFIGURABLE varyant sayılı)
- **Test Koşumu:** **68 test dosyası, 600 testin tamamı (%100) başarıyla geçmiştir.**

---

## 14. SANITY BUILD & LINT

- `npm run lint`: 0 hata, 0 uyarı.
- `npm run build` (`my-birim-react`): Başarıyla tamamlandı (Vite + Sitemap + Robots).
- `npm run build` (`birim-web` Sanity Studio): Başarıyla tamamlandı (19.6s, 0 hata).

---

## 15. VISUAL VERIFICATION (GÖRSEL DOĞRULAMA)

- Sol menüde kategorilere ve stok durumlarına göre anında filtrelenebilir hiyerarşi oluşturuldu.
- Ürün açıldığında üstte gerçek zamanlı Readiness durumu gösteriliyor.
- Quote Cart (`CartContext.tsx`, `CartSidebar.tsx`, `birim_cart`) ve `birim-shop` dokunulmadan korundu.

---

## 16. NEXT PHASE READINESS (FAZ 3 HAZIRLIĞI)

- Ürün ve desk mimarisi tamamlandı.
- Sistem, bir sonraki aşama olan **Faz 3: Control Center Dashboard UI (KPI kartları, hızlı grafikler ve sipariş görünümü)** için tam olarak hazırdır.
