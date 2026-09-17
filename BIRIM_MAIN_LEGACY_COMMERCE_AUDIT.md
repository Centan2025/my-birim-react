# BİRİM.COM — LEGACY COMMERCE FRONTEND AUDIT REPORT

**Audit Date:** 2026-09-17  
**Scope:** `my-birim-react` (Main Web & Commerce Backend Platform)  
**Objective:** Clarify site roles (BİRİM.COM = Brand, Catalog, Architecture, Quote Cart; BİRİM SHOP = Direct Online Sales & Checkout), audit all commerce files, establish the Shop Bridge, and safely streamline legacy frontend code without touching shared backend APIs or the Quote Cart.

---

## 1. ECOSYSTEM & SITE ROLES MAP

```text
┌────────────────────────────────────────────────────────┐
│                      BİRİM.COM                         │
│   (Brand, Architecture, Catalog, Editorial, Quotes)    │
├───────────────────────────┬────────────────────────────┤
│ • Editorial & Projects    │ • Quote Cart (birim_cart)  │
│ • Design Storytelling     │ • Header "SHOP" Bridge     │
│ • Technical Specs & PDFs  │ • Product Card "Shop CTA"  │
│ • Designer Profiles       │ • Product Detail "Shop CTA"│
└─────────────┬─────────────┴─────────────┬──────────────┘
              │                           │
              │ HTTP Navigation           │ /api/commerce/*
              ▼                           ▼
┌───────────────────────────┐   ┌──────────────────────────┐
│         BİRİM SHOP        │   │   COMMERCE BACKEND API   │
│   (https://shop.birim.com)│   │   (Shared Server API)    │
├───────────────────────────┤   ├──────────────────────────┤
│ • Dedicated E-Commerce    │   │ • /api/commerce/cart     │
│ • Bag Drawer & Bag Page   │   │ • /api/commerce/checkout │
│ • Variant Selector & Buy  │   │ • /api/commerce/orders   │
│ • Production Checkout     │   │ • /api/commerce/payments │
│ • Order Confirmation      │   │ • /api/commerce/refunds  │
└───────────────────────────┘   └──────────────────────────┘
```

---

## 2. DETAILED FILE CLASSIFICATION INVENTORY

### A. KEEP — SHARED COMMERCE BACKEND (DO NOT TOUCH)

These files provide the central commerce engine powering both BİRİM SHOP and internal order fulfillment.

| Path                                 | Purpose                                                                                                         |  Status  |
| :----------------------------------- | :-------------------------------------------------------------------------------------------------------------- | :------: |
| `api/commerce/[...slug].ts`          | Consolidated commerce API router (cart, checkout, orders, payments, refunds)                                    | **KEEP** |
| `api/admin/[...slug].ts`             | Admin commerce API (metrics, order list, detail, refund mutation)                                               | **KEEP** |
| `lib/commerce/cart-validator.ts`     | Server-authoritative cart calculation, stock & pricing validation                                               | **KEEP** |
| `lib/commerce/checkout-validator.ts` | Server-authoritative checkout validation & tax computation                                                      | **KEEP** |
| `lib/commerce/order-service.ts`      | Idempotent order creation & database snapshot persistence                                                       | **KEEP** |
| `lib/commerce/types.ts`              | Authoritative domain commerce types & interfaces                                                                | **KEEP** |
| `lib/commerce/payment/*`             | Provider-neutral payment abstraction, state machine, guest auth                                                 | **KEEP** |
| `lib/server/cors.ts`                 | Cross-Origin Resource Sharing allowlist for `shop.birim.com` & `birim.com`                                      | **KEEP** |
| `lib/server/rateLimiter.ts`          | Rate limiting for commerce endpoints                                                                            | **KEEP** |
| `lib/server/token.ts`                | JWT session creation & verification                                                                             | **KEEP** |
| `lib/server/supabaseAdmin.ts`        | Privileged Supabase client factory                                                                              | **KEEP** |
| `src/services/commerce/*`            | Client service SDKs (`cart.ts`, `checkout.ts`, `orders.ts`, `payments.ts`, `adminOrders.ts`, `adminMetrics.ts`) | **KEEP** |
| `src/types/commerceCart.ts`          | Cart & validation types                                                                                         | **KEEP** |
| `src/types/checkout.ts`              | Checkout payload & response types                                                                               | **KEEP** |
| `supabase/migrations/*`              | Database schema migrations (`commerce_orders`, `shop_analytics_events`)                                         | **KEEP** |

### B. KEEP — QUOTE CART (0 BEHAVIOR CHANGE)

The architectural quote cart used on BİRİM.COM for project proposals and inquiries.

| Path                                          | Purpose                                                                   |  Status  |
| :-------------------------------------------- | :------------------------------------------------------------------------ | :------: |
| `src/context/CartContext.tsx`                 | Architectural quote cart provider (`birim_cart` storage key)              | **KEEP** |
| `src/components/CartSidebar.tsx`              | Slide-out quote drawer with proposal submission to `/contact?source=cart` | **KEEP** |
| `src/components/product/ProductAddToCart.tsx` | Adds catalog items to quote cart                                          | **KEEP** |
| `src/test/CartContext.test.tsx`               | Quote cart unit tests                                                     | **KEEP** |
| `src/test/CartSidebar.test.tsx`               | Quote drawer unit tests                                                   | **KEEP** |

### C. KEEP — MAIN SITE PRODUCT & EDITORIAL EXPERIENCE

The primary brand, catalog, designer, and editorial pages.

| Path                                               | Purpose                                                          |  Status  |
| :------------------------------------------------- | :--------------------------------------------------------------- | :------: |
| `src/pages/ProductDetailPage.tsx`                  | Editorial PDP with storytelling, materials, dimensions, and PDFs | **KEEP** |
| `src/pages/ProductsPage.tsx`                       | Main catalog grid and filtering                                  | **KEEP** |
| `src/pages/CategoriesPage.tsx`                     | Category discovery index                                         | **KEEP** |
| `src/components/ProductCard.tsx`                   | Catalog product card component                                   | **KEEP** |
| `src/components/ProductCardReveal.tsx`             | Smooth stagger animation wrapper for product cards               | **KEEP** |
| `src/components/product/*`                         | Hero, thumbnails, materials, dimensions, related products        | **KEEP** |
| `src/pages/admin/CommerceOrdersAdminPage.tsx`      | Internal admin panel for managing commerce orders                | **KEEP** |
| `src/pages/admin/CommerceOrderDetailAdminPage.tsx` | Internal admin panel for order detail & refunds                  | **KEEP** |

### D. KEEP / ENHANCE — SHOP BRIDGE

The natural, elegant connectors guiding users from BİRİM.COM to `shop.birim.com`.

| Path                                         | Description / Enhancement Plan                                                              |   Status    |
| :------------------------------------------- | :------------------------------------------------------------------------------------------ | :---------: |
| `src/utils/shopBridge.ts`                    | Shared eligibility helper (`isProductShopEligible`) and URL generator (`getShopProductUrl`) |   **NEW**   |
| `src/components/Header.tsx`                  | Desktop & mobile persistent `SHOP` / `BİRİM SHOP` link                                      | **ENHANCE** |
| `src/components/HeaderMobileMenuOverlay.tsx` | Mobile menu `SHOP` navigation link                                                          | **ENHANCE** |
| `src/components/HeaderMobileMenuInline.tsx`  | Mobile inline menu `SHOP` navigation link                                                   | **ENHANCE** |
| `src/components/ProductCard.tsx`             | Direct Shop CTA on commerce-eligible cards                                                  | **ENHANCE** |
| `src/components/product/ProductInfo.tsx`     | Clean, typographic "Shop'ta Satın Al / Buy in Shop" CTA                                     | **ENHANCE** |

### E. LEGACY FRONTEND — CANDIDATES FOR CLEANUP & REDIRECTION

| Path                                    | Current Role                           | Recommendation                                                                      |
| :-------------------------------------- | :------------------------------------- | :---------------------------------------------------------------------------------- |
| `src/pages/CommerceCheckoutPage.tsx`    | Duplicate client checkout on main site | Cleanly redirect `/checkout` route to `https://shop.birim.com/checkout`             |
| `src/pages/CommerceOrderResultPage.tsx` | Duplicate order result on main site    | Cleanly redirect `/order/:orderId` route to `https://shop.birim.com/order/:orderId` |

---

## 3. SHOP BRIDGE SPECIFICATION & RULES

### 1. Commerce Eligibility Rule

A product is eligible for the Shop CTA if and only if:

```typescript
product.buyable === true &&
  product.sale_enabled === true &&
  product.sales_mode !== 'NONE' &&
  product.sales_mode !== 'QUOTE' &&
  Boolean(product.id || product.slug)
```

### 2. CTA Routing Behavior

- **DIRECT products:** Links directly to `https://shop.birim.com/product/{slug}`. CTA: `"Shop'ta Satın Al"` / `"Buy in Shop"` or `"Shop'ta Gör"` / `"View in Shop"`.
- **CONFIGURABLE products:** Links to `https://shop.birim.com/product/{slug}`. CTA: `"Shop'ta Gör"` / `"View in Shop"`.
- **QUOTE products (`sales_mode === 'QUOTE'`):** No Shop CTA; uses Quote Cart / Inquiry.
- **NONE products (`sales_mode === 'NONE'`):** No Shop CTA; editorial only.
- **`buyable === false` or `sale_enabled === false`:** No Shop CTA.

### 3. Header SHOP Link

- **Desktop:** Appears in the top right navigation area next to language selector and auth.
- **Mobile:** Prominently featured in both mobile overlay and inline menus.
- **URL:** Configurable via `import.meta.env.VITE_SHOP_URL || 'https://shop.birim.com'`.
