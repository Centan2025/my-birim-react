# BİRİM.COM — LEGACY COMMERCE FRONTEND CLEANUP & SHOP BRIDGE REPORT

**Date:** 2026-09-17  
**Status:** COMPLETED & AUTHORITATIVE CONSISTENCY VERIFIED  
**Platforms:** `my-birim-react` (BİRİM.COM & Commerce Backend), `birim-shop` (BİRİM SHOP Frontend), `birim-web` (Sanity Studio)

---

## 1. EXECUTIVE SUMMARY

The BİRİM digital platform ecosystem has been cleanly partitioned into two complementary and distinct web applications with zero loss of backend capability or design elegance:

1. **BİRİM.COM (`my-birim-react`):**
   - **Role:** Brand, architectural projects, design philosophy, product catalog & discovery, PDF generation, and Quote Cart (`birim_cart`) for bespoke commercial / architectural project inquiries.
   - **Shop Integration:** Non-intrusive, luxury "SHOP" bridge navigation in desktop and mobile headers, plus contextual "Shop'ta Satın Al" / "Shop'ta Gör" CTAs on eligible product cards and product detail pages (PDP).

2. **BİRİM SHOP (`birim-shop`):**
   - **Role:** Dedicated direct e-commerce experience (`https://shop.birim.com`), shopping bag drawer, multi-step checkout, authoritative payment verification, guest order management, and Sanity-integrated product analytics.

3. **Commerce Backend & Database (Shared):**
   - 100% of shared backend routes (`/api/commerce/*`, `/api/admin/*`, `lib/commerce/*`), payment state machine, CORS allowlists, refund workflows, and database tables (`commerce_orders`, `shop_analytics_events`) remain completely intact and active.

---

## 2. SITE ROLES & ARCHITECTURE

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              BİRİM.COM                                 │
│          (Brand, Catalog, Projects, Design & Quote Cart)               │
├───────────────────────────────────┬────────────────────────────────────┤
│ • Design Storytelling & Projects  │ • Architectural Quote Cart         │
│ • Full Catalog & Filtering        │ • Desktop & Mobile "SHOP" Link     │
│ • High-Res Gallery & PDFs         │ • Product Card & PDP "Shop CTA"    │
└─────────────────┬─────────────────┴──────────────────┬─────────────────┘
                  │                                    │
                  │ External Bridge Navigation         │ REST API / CORS
                  ▼                                    ▼
┌───────────────────────────────────┐        ┌───────────────────────────┐
│            BİRİM SHOP             │        │    SHARED COMMERCE API    │
│     (https://shop.birim.com)      │        │    (Central Platform)     │
├───────────────────────────────────┤        ├───────────────────────────┤
│ • Fast Direct E-Commerce          │        │ • /api/commerce/cart      │
│ • Variant Configurator & Bag      │◄───────┤ • /api/commerce/checkout  │
│ • Authoritative Checkout Flow     │        │ • /api/commerce/orders    │
│ • Order Confirmation & Receipts   │        │ • /api/commerce/payments  │
└───────────────────────────────────┘        └───────────────────────────┘
```

---

## 3. AUTHORITATIVE SHOP BRIDGE SPECIFICATION

### A. Strict Commerce Eligibility Rules (`isProductShopEligible`)

A product qualifies for a direct Shop CTA if and only if all of the following conditions are satisfied:

1. `commerce_enabled !== false` (Global and candidate-level check).
2. `buyable === true`.
3. `sale_enabled === true`.
4. `sales_mode !== 'NONE' && sales_mode !== 'QUOTE'` (must be `'DIRECT'` or `'CONFIGURABLE'`).
5. **Mandatory Valid Slug:** A usable slug string or `{current: string}` must be present. Object `id` alone is strictly insufficient for Shop deep-linking.

### B. Fail-Safe Deep Link Resolution (`getShopProductUrl`)

- Resolves deep link to `${getShopBaseUrl()}/product/${slug}`.
- If the slug is missing, empty, whitespace-only, `'undefined'`, or `'null'`, the function returns `null`.
- UI components (`ProductCard`, `ProductInfo`) verify non-null URL before rendering any Shop CTA button.

### C. Visual Hierarchy & CTA Routing

- **`DIRECT` on PDP:** Primary solid black action button with label `"Shop'ta Satın Al"` / `"Buy in Shop"`.
- **`CONFIGURABLE` on PDP:** Primary action button with label `"Shop'ta Gör"` / `"View in Shop"`.
- **`ProductCard` Badge:** Minimalist pill button with label `"Shop'ta Gör"` / `"View in Shop"`.
- **`QUOTE` products (`sales_mode === 'QUOTE'`):** Shop CTA hidden; exclusively routed to Quote Cart.
- **`NONE` products (`sales_mode === 'NONE'`):** Shop CTA hidden; purely editorial.

### D. Global Header SHOP Link

- Persistent in desktop navigation and mobile drawer/inline menus.
- Navigates unconditionally to `https://shop.birim.com` (independent of individual product eligibility).

---

## 4. VERIFICATION & TEST RESULTS (AUTHORITATIVE)

| Project / Package               |        Test Suite Execution        |              Build Verification              |   Status    |
| :------------------------------ | :--------------------------------: | :------------------------------------------: | :---------: |
| **`my-birim-react`**            | **72 / 72 files PASS (659 tests)** | **Exit code 0** (tsc, vite, sitemap, robots) | ✅ Verified |
| **`birim-shop`**                | **18 / 18 files PASS (58 tests)**  |         **Exit code 0** (tsc, vite)          | ✅ Verified |
| **`birim-web` (Sanity Studio)** |                 —                  |  **Exit code 0** (sanity build, postbuild)   | ✅ Verified |

---

## 5. CONCLUSION

The Shop Bridge consistency implementation is complete, strictly aligned with the backend commerce state machine, and verified across all test suites and production build targets.
