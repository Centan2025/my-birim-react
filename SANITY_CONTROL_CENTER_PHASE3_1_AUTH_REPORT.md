# BİRİM Sanity Control Center — Faz 3.1 Authentication Hardening Raporu

**Tarih:** 17 Eylül 2026  
**Durum:** Başarıyla Tamamlandı (%100 Pass, Sıfır Hardcoded Secret, Sıfır Client Secret Input)  
**Kapsam:** Control Center Authentication Hardening, Credential Storage Scan & Least Privilege

---

## 1. AuthBanner Önceki Davranışı

Faz 3 ilk sürümünde, commerce API'si yetkisiz (401/403) yanıt verdiğinde `AuthBanner.tsx` bileşeni kullanıcıya bir input sunarak `ADMIN_SECRET` değerinin manuel girilmesine ve bunun browser'da `localStorage.setItem('birim_admin_secret', ...)` ile saklanmasına olanak tanıyordu.

---

## 2. Kaldırılan Manuel Secret Akışı

Faz 3.1 ile birlikte aşağıdaki tüm güvensiz client mekanizmaları tamamen temizlendi ve kaldırıldı:

- `AuthBanner.tsx` içindeki `<input type="password" placeholder="Admin Secret..." />` ve form gönderim akışı.
- `localStorage.setItem('birim_admin_secret', ...)` ve `localStorage.getItem('birim_admin_secret')` kodları.
- `(window as any).__ADMIN_SECRET__` fallback okuma girişimi.
- `useCommerceMetrics.ts` ve `useRecentOrders.ts` içindeki `x-admin-secret` client header ekleme mantığı.
- SessionStorage üzerinde herhangi bir secret tutma ihtimali.

---

## 3. Yeni Authentication Modeli

Control Center artık tarayıcı seviyesinde hiçbir secret veya uzun ömürlü anahtar istemez ve saklamaz:

1. **HttpOnly Secure Session / Cookie Tabanlı Yetkilendirme:**
   - Control Center HTTP istekleri `credentials: 'include'` ile gönderilir.
   - Kullanıcı BİRİM web sitesinde/admin panelinde oturum açtığında üretilen `birim_token` HttpOnly cookie'si tarayıcı tarafından otomatik ve güvenli şekilde sunucuya iletilir.
2. **Server-Side Token Doğrulama (`lib/server/token.ts`):**
   - Sunucu tarafında `getAuthTokenFromReq` ile gelen HttpOnly cookie veya Bearer authorization doğrulanır (`verifyToken`).
   - Kullanıcının `role === 'admin'` olup olmadığı yetkili sunucu katmanında kontrol edilir.
3. **CORS ve Origin Koruması (`lib/server/cors.ts`):**
   - `https://birim.sanity.studio` ve izinli BİRİM origin'leri dışındaki kaynaklara `Access-Control-Allow-Credentials` verilmez.
4. **Break-Glass İzolasyonu:**
   - Sunucu operasyonel break-glass desteği (`x-admin-secret`) yalnızca sunucu içi CLI/operator kullanımında korunmuş; Sanity Studio browser client kodlarından tamamen arındırılmıştır.

---

## 4. Browser Credential Storage Durumu

Yapılan tam tarama (Secret Scan) sonucunda:

- `localStorage`: Privileged hiçbir secret/token tutulmamaktadır (yalnızca UI dil tercihi ve Studio dahili araçları bulunmaktadır).
- `sessionStorage`: Sıfır veri.
- `IndexedDB / Cookies`: Yalnızca HttpOnly güvenli session çerezleri tarayıcı motoru tarafından yönetilmektedir; JavaScript erişimine kapalıdır (XSS korumalı).

---

## 5. API Request Authentication

| İstek                | Endpoint                          | Yetkilendirme Yöntemi                      | Browser Secret İletimi |
| :------------------- | :-------------------------------- | :----------------------------------------- | :--------------------- |
| **Commerce Metrics** | `GET /api/admin/commerce/metrics` | `credentials: 'include'` (HttpOnly Cookie) | **YOK**                |
| **Recent Orders**    | `GET /api/admin/commerce/orders`  | `credentials: 'include'` (HttpOnly Cookie) | **YOK**                |
| **Product Health**   | Sanity GROQ Client                | Sanity Studio Authenticated Client Session | **YOK**                |

---

## 6. Unauthorized UX (Yetkisiz Erişim Arayüzü)

Yetkisiz kullanıcılar veya aktif admin oturumu bulunmayan durumlar için `AuthBanner.tsx` sade, bilgilendirici ve güvenli bir duruma dönüştürüldü:

```text
ADMIN ACCESS REQUIRED
Commerce data is available only to authorized BİRİM administrators.
Product Health remains available from Sanity.
[Open Admin Login] [Yeniden Dene]
```

Kullanıcı `Open Admin Login` butonuna tıklayarak resmi login sayfasına yönlendirilir; doğrudan dashboard içine asla credential yazamaz.

---

## 7. Partial Dashboard Davranışı (Kısmi Başarısızlık Dayanıklılığı)

Commerce API yetkilendirmesi başarısız olsa dahi:

- **Net Satış, Siparişler, AOV, İadeler:** Güvenli şekilde sıfırlanır ve "Admin Access Required" uyarısı gösterilir (yetkisiz bilgi sızdırılmaz).
- **Product Health Paneli:** Sanity GROQ üzerinden kesintisiz olarak çalışır; Satışa Hazır, İnceleme Gereken, Stokta ve Ön Sipariş sayıları ile Needs Attention doküman linkleri %100 işlevsel kalır.

---

## 8. Test Sonuçları

- **Test Dosyası:** [control_center_dashboard.test.ts](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/src/test/control_center_dashboard.test.ts)
- **Eklenen Doğrulamalar:**
  - `AuthBanner.tsx` içinde input veya secret form bulunmadığının statik & çalışma zamanı doğrulaması.
  - `useCommerceMetrics.ts` ve `useRecentOrders.ts` içinde `x-admin-secret`, `localStorage`, `sessionStorage` bulunmadığı ve `credentials: 'include'` kullanıldığının doğrulaması.
  - Unauthorized state durumunda dashboard'un çökmeksizin bilgilendirici banner gösterdiğinin doğrulaması.
- **Sonuç:** 69 test dosyasında **612 test %100 PASS**.

---

## 9. Derleme (Build) Sonuçları

- **Sanity Studio Derlemesi (`birim-web`):** `npm run build` -> **0 hata ile başarılı**.
- **Web App Derlemesi (`my-birim-react`):** `npm run build` (tsc, vite build, sitemap, robots) -> **0 hata ile başarılı**.
- **ESLint:** `npm run lint` -> **0 error ile başarılı**.

---

## 10. Secret Scan Raporu

`birim-web` kök dizininde yapılan derin arama:

- `ADMIN_SECRET`: Temiz (0 eşleşme).
- `x-admin-secret`: Temiz (0 eşleşme).
- `SUPABASE_SERVICE_ROLE_KEY`: Temiz (0 eşleşme).
- `service_role`: Temiz (0 eşleşme).

---

## 11. Kalan Auth Riskleri & Notlar

1. **Production Deployment Notu:** Canlıya alma aşamasında `birim.sanity.studio` ile BİRİM API domaini arasında cross-site cookie kullanımında `SameSite=None; Secure` ayarı gerekirse reverse proxy / sub-domain (`studio.birim.com`) seviyesinde first-party cookie olarak çalıştırılması önerilir.
2. **Shop & Quote Cart İzolasyonu:** `birim-shop` ve `my-birim-react` Quote Cart kodlarına (`CartContext.tsx`, `CartSidebar.tsx`) hiçbir müdahalede bulunulmamıştır.
