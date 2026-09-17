# BİRİM SANITY CONTROL CENTER — FAZ 1 RAPORU

**Tarih:** 17 Eylül 2026  
**Kapsam:** Güvenlik Temizliği + Commerce Metrics API  
**Hedef Proje:** `my-birim-react` (`birim-web` Studio & Consolidated Admin API)  
**Durum:** Başarıyla Tamamlandı (Tüm Testler, Lint, Build & Secret Scan Geçti)

---

## 1. HARDCODED SERVICE-ROLE BULGUSUNUN DOĞRULANMASI

Yapılan analiz ve doğrulama neticesinde:

- `birim-web/components/SupabaseUsersStudioView.tsx` (65-66. satırlar): `SUPABASE_ADMIN_KEY` isimli ve içeriğinde `role: "service_role"` olan açık JWT token'ı tespit edilmiştir.
- `birim-web/tools/emailExport/EmailExportTool.tsx` (119. satır): `sbKey` değişkeni içerisinde aynı service_role JWT token'ının kullanıldığı tespit edilmiştir.
- **Risk Doğrulaması:** Bu iki dosya Sanity Studio istemci bundle'ına derlenmekteydi ve tarayıcı ortamında anahtarın okunması durumunda Supabase RLS (Row Level Security) korumasını bypass edebilirdi.

---

## 2. KALDIRILAN CREDENTIAL PATH'LERİ

Aşağıdaki credential ve doğrudan client instantiations koddan tamamen temizlenmiştir:

1. `birim-web/components/SupabaseUsersStudioView.tsx`:
   - `const SUPABASE_ADMIN_KEY = '...'` silindi.
   - `const SUPABASE_URL = '...'` silindi.
   - `const supabase = createClient(...)` istemci örneği silindi.
   - `@supabase/supabase-js` import'u kaldırıldı.
2. `birim-web/tools/emailExport/EmailExportTool.tsx`:
   - `const sbKey = '...'` ve `createSupabaseClient(sbUrl, sbKey, ...)` silindi.

---

## 3. SUPABASE USERS STUDIO VIEW REFACTOR

- `SupabaseUsersStudioView.tsx` ve `EmailExportTool.tsx` artık doğrudan veritabanına bağlanmak yerine, yetkilendirilmiş sunucu API uç noktası olan `/api/admin/members` üzerinden çalışmaktadır.
- **İşlem Eşleşmeleri:**
  - **Üyeleri Listeleme:** `GET /api/admin/members` (`credentials: 'include'`).
  - **Profil / Mimar Statüsü / Rol Güncelleme:** `PATCH /api/admin/members` (`body: { id, name, company, country, profession, phone, tax_id, role, architect_verification_status, is_verified }`).
  - **Üye Silme:** `DELETE /api/admin/members` (`body: { id }`).
- **Kullanıcı Geri Bildirimi:** Eğer oturum açmamış veya admin olmayan bir kullanıcı Studio aracına girerse, uygulama çökmek veya anahtar sızdırmak yerine net bir uyarı vermektedir:
  > _"Admin yetkisi gereklidir. Lütfen BİRİM Admin girişi yapın veya oturumunuzu yenileyin."_

---

## 4. KULLANILAN AUTH MODELİ

- **Yetkilendirme Standartları:**
  1. **Admin JWT Token:** `Authorization: Bearer <JWT>` veya HttpOnly `birim_token` çerezi üzerinden `verifyToken` ile doğrulanır (`payload.role === 'admin'`).
  2. **Break-Glass Admin Secret:** `x-admin-secret` HTTP başlığı `crypto.timingSafeEqual` ile doğrulanır (sunucu ortamındaki `ADMIN_SECRET` ile).
- **Güvenlik Kuralı:** İstemci tarafına kesinlikle statik admin secret gömülmemiştir. İstekler standart tarayıcı oturumu ve çerezler üzerinden güvenle yürütülür.

---

## 5. METRICS ENDPOINT (`GET /api/admin/commerce/metrics`)

- **Router:** `api/admin/[...slug].ts` (mevcut konsolide router mimarisi korundu).
- **HTTP Metodu:** Yalnızca `GET` (diğer metodlar için `405 Method Not Allowed`).
- **Desteklenen Parametreler:**
  - `range`: `'today' | '7d' | '30d' | '90d'` (varsayılan: `'30d'`).
  - `from` / `to`: Özel ISO 8601 tarih aralığı (ör. `2026-09-01T00:00:00Z`).
- **Validasyon:** Hatalı zaman aralığı veya geçersiz tarih formatı girildiğinde `400 INVALID_REQUEST` döner.

---

## 6. METRIC DEFINITIONS (HESAPLAMA SÖZLEŞMESİ)

Hesaplamalar authoritative `orders` ve `refunds` tablolarından türetilir:

- **Gross Sales (Brüt Satış):** `status` veya `payment_status` değeri `PAID`, `PARTIALLY_REFUNDED`, `REFUNDED` olan siparişlerin `grand_total` toplamı.
- **Refund Total (Toplam İade):** `refunds` tablosundaki gerçekleşmiş (`status === 'SUCCESS' || status === 'PAID'`) iadelerin `amount` toplamı.
- **Net Sales (Net Satış):** `Gross Sales - Refund Total` (kuruş/minor unit hassasiyetinde hesaplanır).
- **Paid Orders Count:** Başarıyla ödenmiş siparişlerin toplam adedi.
- **Average Order Value (AOV):** `Net Sales / Paid Orders Count` (sıfır sipariş durumunda güvenli 0, asla `NaN` veya `Infinity` üretmez).
- **Pending Payments Count:** `status === 'PENDING_PAYMENT'` veya `payment_status === 'PENDING'` olan sipariş adedi.
- **Cancelled Orders Count:** `status === 'CANCELLED'` olan sipariş adedi.

---

## 7. CURRENCY HANDLING (ÇOKLU PARA BİRİMİ YÖNETİMİ)

- Farklı para birimleri (TRY, EUR, USD) kesinlikle birbirine eklenmez veya yapay kur dönüşümü yapılmaz.
- Metrikler `metrics: Record<string, CurrencyCommerceMetrics>` altında her para birimi için izole olarak gruplanır (ör. `metrics.TRY`, `metrics.EUR`).
- `daily[]` trend serisi de `currency` kırılımıyla üretilir.

---

## 8. PII PROTECTION (KİŞİSEL VERİ KORUMASI)

- Metrics endpoint'i aggregate bir analiz uç noktasıdır.
- Response içerisinde müşteri adı (`customer_name`), e-posta (`customer_email`), telefon (`customer_phone`), adres bilgileri, IP adresi veya kart/ödeme snapshot'ları **kesinlikle yer almaz**.
- Unit test ile sıfır PII sızıntısı garanti edilmiştir.

---

## 9. RATE LIMITING

- Mevcut merkezi rate limiter altyapısı kullanılmıştır:
  - `admin_commerce_metrics_${ip}` anahtarı ile dakikada maksimum 60 istek sınırı.
  - Limit aşıldığında `429 RATE_LIMITED` döner.

---

## 10. ERROR HANDLING

- Veritabanı veya sunucu hatalarında istemciye raw PostgreSQL mesajı, tablo şeması veya stack trace döndürülmez.
- Standart Commerce hata sözleşmesi kullanılır:
  - `401 UNAUTHORIZED`
  - `400 INVALID_REQUEST`
  - `405 METHOD_NOT_ALLOWED`
  - `429 RATE_LIMITED`
  - `500 INTERNAL_ERROR`

---

## 11. TESTS (TEST KAPSAMI VE SONUÇLARI)

- **Yeni Test Dosyası:** `src/test/admin_commerce_metrics.test.ts` (17 test)
  - Auth red ve onay mekanizmaları
  - `today`, `7d`, `30d`, `90d` ve custom tarih çözümleme
  - Net sales, AOV, iade düşümü doğrulamaları
  - Sıfır sipariş güvenliği (Zero division safe)
  - Para birimi izolasyonu
  - Günlük (`daily[]`) trend üretimi
  - PII yokluğu denetimi
- **Güncellenen Test Dosyası:** `src/test/adminMembers.test.ts` (10 test)
  - Profil alanları ve DELETE endpoint testi
  - Sanity Studio dosyalarında hardcoded anahtar bulunmadığının negatif doğrulaması
- **Test Koşumu:** **67 test dosyası, 591 testin tamamı (%100) başarıyla geçmiştir.**

---

## 12. BUILD (DERLEME DOĞRULAMASI)

- **my-birim-react Build:** `tsc && vite build && generate-sitemap && generate-robots` hatasız tamamlandı.
- **birim-web (Sanity Studio) Build:** `sanity build && postbuild` hatasız tamamlandı.

---

## 13. SECRET SCAN

Tüm kaynak kod ve derleme çıktıları (`dist/`, `birim-web/dist/`) taranmıştır:

- `SUPABASE_ADMIN_KEY`: Sadece test assertion'larında (negatif kontrol olarak) bulundu, kodda 0.
- `4Bglk8zupMO9ooUDL0u4-9TpRZg7kMDM0MxwqALlVa8`: Koddan ve derleme çıktılarından tamamen kaldırıldı (0).
- `SUPABASE_SERVICE_ROLE_KEY`: İstemci bundle'ında 0.

---

## 14. UNRESOLVED AUTH RISKS & GELECEK NOTLAR

- Sanity Studio bağımsız host'ta (`https://birim.sanity.studio`) çalıştırıldığında, yöneticinin tarayıcısında BİRİM Admin oturum çerezi (`birim_token`) yoksa Studio üzerindeki üye yönetim ve metrik araçları 401 döndürür. Bu durum bir güvenlik açığı değil, güvenlik gereğidir. Gelecek fazlarda Studio içine gömülü bir Admin Login Dialog / Auth Bridge eklenebilir.

---

## 15. NEXT PHASE READINESS (FAZ 2 HAZIRLIĞI)

- Güvenlik temeli ve veri API'si hazırlandı.
- Sistem, bir sonraki aşama olan Desk Structure zenginleştirmesi (Control Center menüsü, Needs Attention filtreleri, Product Health klasörleri) için hazırdır.
