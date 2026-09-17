# BİRİM SHOP — PRODUCTION GO-LIVE & INFRASTRUCTURE REPORT

**Document Version:** 1.0.0 — Production Go-Live Verification  
**Date:** 2026-09-17  
**Target Topology:** Storefront (`shop.birim.com`), Main API (`birim.com/api`), CMS (`studio.birim.com`)  
**Status:** `READY WITH GO-LIVE ACTIONS`

---

## 1. PRODUCTION ARCHITECTURE & TOPOLOGY

```text
                                  ┌────────────────────────┐
                                  │      SANITY CMS        │
                                  │ (Single Dataset: prod) │
                                  └───────────┬────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
        ┌─────────────────────────┐                       ┌─────────────────────────┐
        │   BİRİM.COM MAIN WEB    │                       │       BİRİM SHOP        │
        │   https://birim.com     │                       │  https://shop.birim.com │
        │  (Vite + React / Node)  │                       │      (Vite + React)     │
        └────────────┬────────────┘                       └────────────┬────────────┘
                     │                                                 │
                     │                 /api/commerce/*                 │
                     └────────────────────────┬────────────────────────┘
                                              ▼
                                 ┌─────────────────────────┐
                                 │   COMMERCE BACKEND API  │
                                 │   (Serverless Functions)│
                                 └────────────┬────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
        ┌─────────────────────────┐                       ┌─────────────────────────┐
        │    SUPABASE DATABASE    │                       │     PAYMENT GATEWAY     │
        │  (PostgreSQL + RLS)     │                       │     (Provider Engine)   │
        └─────────────────────────┘                       └─────────────────────────┘
```

---

## 2. URLS & DOMAINS INVENTORY

| Service / Resource    | Production URL / Origin                       | Role                                            |
| :-------------------- | :-------------------------------------------- | :---------------------------------------------- |
| **Storefront**        | `https://shop.birim.com`                      | Customer-facing BİRİM Shop                      |
| **Main Web Platform** | `https://www.birim.com` / `https://birim.com` | Brand website & corporate portal                |
| **Commerce API**      | `https://birim.com/api/commerce/*`            | Central cart, checkout, orders, payment backend |
| **Sanity Studio**     | `https://studio.birim.com`                    | Unified editorial CMS & Control Center          |
| **Fallback Studio**   | `https://birim.sanity.studio`                 | Sanity-managed cloud hosting                    |
| **Asset CDN**         | `https://assets.birim.com`                    | Cloudflare R2 media & product imagery           |
| **Database**          | Supabase Production Project                   | Transactional database with Row-Level Security  |

---

## 3. STOREFRONT DEPLOYMENT SPECIFICATION

- **Repository:** `birim-shop`
- **Build Command:** `npm run build` (`tsc && vite build`)
- **Output Directory:** `dist`
- **Node Runtime:** Node.js 20 LTS
- **SPA Routing Fallback:** Configured via `public/_redirects` (`/* /index.html 200`) and `vercel.json` rewrites.
- **Asset Caching:** Static hashed assets in `/assets/*` serve with `Cache-Control: public, max-age=31536000, immutable`.
- **Target Custom Domain:** `shop.birim.com` (Requires CNAME to hosting provider with SSL).

---

## 4. ENVIRONMENT VARIABLES CLASSIFICATION

All client-facing environment variables in `birim-shop` are safe, non-sensitive public parameters:

| Variable                  | Classification | Production Default / Description                     |
| :------------------------ | :------------: | :--------------------------------------------------- |
| `VITE_SANITY_PROJECT_ID`  |   `REQUIRED`   | Sanity Project ID (`wn3a082f`)                       |
| `VITE_SANITY_DATASET`     |   `REQUIRED`   | Dataset Name (`production`)                          |
| `VITE_SANITY_API_VERSION` |   `OPTIONAL`   | API Date Version (`2025-01-01`)                      |
| `VITE_API_URL`            |   `OPTIONAL`   | API Base URL (`/api` or `https://www.birim.com/api`) |
| `VITE_R2_DOMAIN`          |   `OPTIONAL`   | Cloudflare R2 CDN (`assets.birim.com`)               |
| `VITE_USE_MOCK_DATA`      |   `DEV ONLY`   | Must remain `false` or unset in production           |

> [!IMPORTANT]
> **Secret Verification:** Static code and bundle analysis verified that **0** server secrets (Supabase `service_role`, `JWT_SECRET`, `ADMIN_SECRET`, payment API secrets) are bundled into client code.

---

## 5. DNS & DOMAIN ROUTING

- **`shop.birim.com`:** Requires CNAME pointing to the frontend hosting platform (e.g., Cloudflare Pages / Vercel / Netlify) with automatic TLS certificate provisioning.
- **`studio.birim.com`:** Recommended CNAME for Sanity Studio custom domain to share the root `.birim.com` domain cookie scope.

---

## 6. SSL / TLS CONFIGURATION

- All communications require HTTPS (TLS 1.3 preferred, TLS 1.2 minimum).
- HTTP-to-HTTPS automatic 301 redirection enforced on hosting edge.
- `Strict-Transport-Security` (HSTS) active on production headers.

---

## 7. SANITY STUDIO AUTHENTICATION & CONTROL CENTER

- **Hardened Admin Auth:** Control Center never prompts operators for raw API keys, JWT tokens, or `ADMIN_SECRET`.
- **Session Transmission:** Admin requests to `/api/commerce/admin/*` utilize authenticated HttpOnly session cookies or secure server proxy context.
- **Emergency Break-Glass:** The backend break-glass `x-admin-secret` remains strictly a server-side operator tool and is completely omitted from the Studio bundle.

---

## 8. COOKIE ARCHITECTURE & SECURITY ANALYSIS

- **Cookie Name:** `birim_token` (and `birim_admin_token`)
- **Flags:** `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
- **Domain Scope:**
  - When set with `Domain=.birim.com`, the cookie is seamlessly presented across `birim.com`, `shop.birim.com`, and `studio.birim.com`.
  - Host-only cookies (without `Domain`) only reach the exact issuing domain.
  - Setting `SameSite=None` is explicitly avoided to preserve CSRF protections.

---

## 9. SANITY UX — PRODUCT COMMERCE TOGGLE FINALIZATION

In accordance with Phase 9 editor usability requirements:

1. **`buyable`:**
   - **Title:** `E-Ticarette Satılabilir`
   - **Description:** _"Bu ürünün yapısal olarak BİRİM SHOP üzerinden doğrudan satışa uygun olup olmadığını belirler."_ (Structural commerce eligibility)
2. **`sale_enabled`:**
   - **Title:** `Satış Aktif`
   - **Description:** _"Bu ürünün şu anda BİRİM SHOP üzerinde aktif olarak satışa sunulup sunulmadığını belirler."_ (Operational active toggle)
3. **Inspector Display:** Real-time visual status pills rendered in [`ProductDocumentInput.tsx`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/birim-web/components/ProductDocumentInput.tsx):
   - `E-Ticarette Satılabilir: ✓ / ✕`
   - `Satış Aktif: ✓ / ✕`
   - `Mod: DIRECT / CONFIGURABLE / QUOTE / NONE`
   - State explanation banner (e.g., _"Ürün doğrudan satışa açıktır"_ or _"Ürün e-ticarete uygundur ancak satış şu anda kapalıdır"_).
4. **Backend Contract:** Field names (`buyable`, `sale_enabled`, `sales_mode`) and GROQ query logic remain **100% unchanged**.

---

## 10. DATABASE MIGRATION INVENTORY

| Migration File / Table               |      Status       | Action Required                                 |
| :----------------------------------- | :---------------: | :---------------------------------------------- |
| `commerce_orders`                    | `ALREADY APPLIED` | Active in production DB. Do NOT re-run.         |
| `commerce_order_items`               | `ALREADY APPLIED` | Active in production DB. Do NOT re-run.         |
| `commerce_payment_attempts`          | `ALREADY APPLIED` | Active in production DB. Do NOT re-run.         |
| `commerce_refunds`                   | `ALREADY APPLIED` | Active in production DB. Do NOT re-run.         |
| `20260917_shop_analytics_events.sql` |     `PENDING`     | Execute once in production Supabase SQL Editor. |

---

## 11. ANALYTICS MIGRATION & ZERO-PII INGESTION

- **Schema Safety:** `20260917_shop_analytics_events.sql` features `CREATE TABLE IF NOT EXISTS`, compound indexes (`created_at`, `product_id`, `event_name`), and `ROW LEVEL SECURITY` enabled.
- **Public Write Denied:** Direct client `anon` access is blocked. Ingestion is mediated through `/api/commerce/analytics` using service-role credentials.
- **Client Event Restriction:** Dangerous client events (`purchase`, `payment_success`, `order_created`) return `400 INVALID_EVENT_NAME`. Financial metrics are strictly computed from database orders.
- **Consent Compliance:** Session UUID is memory-only; no cookies or persistent storage are initialized prior to explicit user engagement consent.

---

## 12. PAYMENT CONFIGURATION & TEST VS. LIVE MODE

- **Provider Architecture:** Provider-neutral payment interface with adapter registry (`mock`, `iyzico`, etc.) in [`lib/commerce/payment`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/lib/commerce/payment).
- **Environment Gating:**
  - `PAYMENT_PROVIDER`: Specifies active provider adapter.
  - In production (`NODE_ENV=production`), live gateway keys are required.
- **Server Authority:** Browser clients cannot mutate order payment status. Transition to `PAID` happens exclusively upon cryptographically signed webhook callback or server verification.

---

## 13. CMS CONTENT READINESS

- **Shop Settings:** `shopSettings.shopEnabled` controls storefront operational mode.
- **Shop Home:** Localized editorial hero, selected products carousel, category discovery cards, and brand storytelling blocks loaded dynamically from Sanity.
- **Category Hierarchy:** Living, Dining, Workspace, Lighting, Accessories mapped with localized titles and hero banners.

---

## 14. PRODUCT SALES READINESS

- **DIRECT Products:** Must have `buyable=true`, `sale_enabled=true`, `sales_mode='DIRECT'`, valid `price > 0`, `currency`, `sku`, and `stockStatus`.
- **CONFIGURABLE Products:** Must have `buyable=true`, `sale_enabled=true`, `sales_mode='CONFIGURABLE'`, and at least one active variant with valid `price` and `sku`. Variant selection is required before Add to Bag is enabled.

---

## 15. SEO & STRUCTURED DATA VERIFICATION

- **Canonical URLs:** Prefixed with `https://shop.birim.com`.
- **Private Route Indexing:** `<meta name="robots" content="noindex, nofollow">` verified on `/bag`, `/checkout`, `/order/*`, and `404`.
- **JSON-LD Schemas:** Organization & WebSite on Home, Breadcrumbs on Category, Product on PDP (single Offer strictly limited to `DIRECT` products with price > 0).
- **Sitemap & Robots:** Automated generation of `dist/sitemap.xml` (140 URLs) and `dist/robots.txt`.

---

## 16. SECURITY VERIFICATION & SECRET SCAN

- **Bundle Scans:** Scanned `birim-shop/dist`, `my-birim-react/dist`, and `birim-web/dist`. Found **0** secret leaks.
- **CORS Protection:** `lib/server/cors.ts` restricts origins to `*.birim.com` and `birim.sanity.studio`. No wildcard with credentials.
- **Rate Limiting:** Active on cart validation, checkout, and order lookup routes.

---

## 17. SMOKE TESTS SUMMARY

1. **Home:** Loads hero, products, navigation, logo geometry, and language switch.
2. **Catalog & PDP:** Category filtering, product detail specs, variant selection gating.
3. **Cart & Drawer:** Server-authoritative line items, subtotal calculation, quantity steppers.
4. **Checkout:** PII isolation verified, idempotency key generation, validation errors caught.
5. **Order Lifecycle:** Cart preserved during payment attempt; cart cleared only upon verified `PAID`.
6. **Quote Cart:** `birim_cart` and `CartContext` preserved with 0 regressions.

---

## 18. TEST SUITE RESULTS

| Project              | Tests Passed  | Test Files |         Build Status          |
| :------------------- | :-----------: | :--------: | :---------------------------: |
| **`birim-shop`**     |  **58 / 58**  |     18     |      Clean build (993ms)      |
| **`my-birim-react`** | **635 / 635** |     71     | Clean build + sitemap (7.18s) |
| **`birim-web`**      |      N/A      |    N/A     |  Clean Sanity build (18.2s)   |

---

## 19. OPEN ISSUES & HUMAN ACTION ITEMS

To finalize formal live deployment, the following 3 operator actions must be executed in production:

1. **DNS CNAME Configuration:** Point `shop.birim.com` CNAME record to the storefront hosting target and verify SSL certificate activation.
2. **Apply Analytics Database Migration:** Execute [`20260917_shop_analytics_events.sql`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/supabase/migrations/20260917_shop_analytics_events.sql) once in the production Supabase SQL Editor.
3. **Production Payment Gateway Credentials:** Configure live payment gateway API keys in the production server environment variables (`PAYMENT_PROVIDER`, API keys, signature secrets).

---

## 20. ROLLBACK PLAN

In the event of an unexpected post-launch incident:

1. **Storefront Maintenance Mode:** Toggle `shopSettings.shopEnabled = false` in Sanity Studio to immediately show the elegant maintenance banner without redeploying.
2. **DNS Rollback:** Revert `shop.birim.com` DNS CNAME record to the previous holding page or static maintenance target.
3. **Payment Deactivation:** Switch `PAYMENT_PROVIDER` to `mock` or disable checkout routes via server configuration.
4. **Database Safety:** The analytics migration is purely additive (`CREATE TABLE IF NOT EXISTS`); existing orders and quote carts remain completely isolated and unaffected.
