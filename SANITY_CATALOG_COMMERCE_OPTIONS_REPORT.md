# BİRİM SANITY — CATALOG OPTIONS → COMMERCE SELECTION FINAL CONSISTENCY REPORT

**Date:** 2026-09-17  
**Status:** APPROVED, FULLY CONSISTENT & VERIFIED  
**Workspaces:**

- **Primary / Main Platform:** `my-birim-react` (`C:\Users\ASUS\.gemini\antigravity\scratch\my-birim-react`)
- **Sanity Studio:** `birim-web` (`C:\Users\ASUS\.gemini\antigravity\scratch\my-birim-react\birim-web`)
- **Shop Frontend (Read Only):** `birim-shop` (`C:\Users\ASUS\.gemini\antigravity\scratch\birim-shop`)

---

## 1. Executive Summary & Core Principles

This report documents the final architectural consistency fix for the Sanity Catalog → Commerce model across the BİRİM platform.

### Core Guarantees Achieved:

1. **Authoritative Stock Status Contract:** Strictly `in_stock`, `out_of_stock`, `preorder`. No custom `made_to_order` enum in stockStatus. Made-to-order production timelines are represented by `leadTimeWeeks`.
2. **Zero-Duplication in Commerce Selections:** Commerce selections (`selectedDimensions`, `selectedMaterials`) store key-based references (`dimensionKey`, `materialKey`, `enabled`, `sortOrder`) rather than duplicate business data (titles, images, swatch URLs, group names). Authoritative catalog data is resolved at runtime.
3. **Strict Shop Opt-In:** For new structured CONFIGURABLE products, `catalog options ≠ sellable options`. An empty selection does NOT expose the entire catalog to Shop.
4. **BİRİM.COM Zero Regression:** Architectural PDP, material swatch rendering, PDF generation, Seçtiklerim (Collections), and Quote Cart continue rendering 100% of catalog specifications without being filtered by commerce selections.
5. **Legacy Compatibility:** Existing legacy products using `variants.options` continue to work without data migration.
6. **Readiness & Broken Linkage Protection:** Broken `dimensionKey` or `materialKey` references are flagged in Readiness Inspector as `"Catalog option reference unavailable"` without auto-deleting variant data.
7. **Read-Only Shop Invariance:** `birim-shop` was strictly untouched and verified to pass all tests and production builds.

---

## 2. Stock Status Contract & Lead Time Architecture

### Authoritative Stock Status Enum:

```typescript
type StockStatus = 'in_stock' | 'out_of_stock' | 'preorder'
```

### Made-to-Order Business Semantics:

- `made_to_order` is **NOT** a stock status enum.
- Made-to-order products and variants define their production / delivery timeline through `leadTimeWeeks` (e.g. `leadTimeWeeks: 4` or `leadTimeWeeks: 6`).
- When a product or variant is made-to-order, editors configure:
  - `stockStatus`: `'preorder'` (or `'in_stock'` with custom lead time)
  - `leadTimeWeeks`: `4` (weeks)
- Backend, Sanity Studio schemas (`product.tsx`, `productVariant.ts`), and TypeScript models (`src/types.ts`) all enforce this exact contract.

---

## 3. Zero-Duplication Strategy & Catalog Authority

```
┌────────────────────────────────────────────────────────────────────────┐
│                   LAYER 1: CATALOG OPTIONS (Authoritative)              │
│  - dimensionImages[]: {_key, imageR2, title: {tr, en}}                 │
│  - materialSelections[]: {_key, group->{title, books[]{items[]{...}}}} │
│  * Master source of truth for all architectural and product data       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Key references only (_key)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  LAYER 2: COMMERCE SELECTION (References Only)         │
│  - selectedDimensions[]: {dimensionKey, enabled, sortOrder}            │
│  - selectedMaterials[]: {materialKey, enabled, sortOrder}              │
│  * Holds NO duplicate titles/images; resolved at runtime from Layer 1  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Option combinations
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   LAYER 3: SELLABLE VARIANTS (SKU & Price)             │
│  - variants[]: {sku, price, currency, dimensionKey, materialKey, ...}  │
│  * Links directly to dimension and material keys                       │
└────────────────────────────────────────────────────────────────────────┘
```

### Final Persisted Schema Specifications:

- **`productSellableDimension`** ([`birim-web/schemaTypes/objects/shared.ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/birim-web/schemaTypes/objects/shared.ts)):
  - `dimensionKey`: string (required) — matches authoritative `dimensionImages[]._key`.
  - `enabled`: boolean (default: true).
  - `sortOrder`: number (optional).
    _(Zero duplicate business data persisted; titles and technical drawings are resolved dynamically at runtime from `dimensionImages` via `dimensionKey`)_.
- **`productSellableMaterial`** ([`birim-web/schemaTypes/objects/shared.ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/birim-web/schemaTypes/objects/shared.ts)):
  - `materialKey`: string (required) — matches authoritative swatch `_key` in `materialSelections`.
  - `enabled`: boolean (default: true).
  - `sortOrder`: number (optional).
    _(Zero duplicate business data persisted; group name, cartela book, finish name, and swatch preview image are resolved dynamically at runtime from `materialSelections` via `materialKey`)_.

---

## 4. Stable Key Analysis

- **Sanity Array `_key` Stability:**
  - Sanity automatically generates a random, unique alphanumeric `_key` (e.g. `'c3b1a8f9'`) upon item creation.
  - `_key` is immutable across edits, field updates, re-ordering, draft state changes, and publishing.
  - The only scenario where `_key` changes is if an editor deletes the item and creates a new one.
- **Non-Destructive Reference Integrity:**
  - No bulk migration is needed. Existing documents retain their stable `_key` values.

---

## 5. Strict Shop Opt-In vs Legacy Fallback Rules

### Strict Shop Opt-In for Structured Products:

- If a product is configured with the new structured model (`selectedDimensions` or `selectedMaterials` defined, or variants with `dimensionKey`/`materialKey`):
  - `selectedDimensions: []` → **0** sellable dimensions on Shop (does **NOT** expose all catalog dimensions).
  - `selectedMaterials: []` → **0** sellable materials on Shop (does **NOT** expose all catalog materials).
- **Rule:** `catalog options ≠ sellable options`.

### Legacy Backward Compatibility:

- Products that only define `variants[].options: [{name, value}]` without structured selections or keys are detected as legacy configurable products.
- Legacy products continue to function with existing option mappings without requiring immediate schema upgrades.

---

## 6. Readiness Inspector & Linkage Verification

The diagnostic engine ([`birim-web/utils/productReadiness.ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/birim-web/utils/productReadiness.ts) & [`lib/commerce/product-readiness.ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/lib/commerce/product-readiness.ts)) validates:

1. **CONFIGURABLE Mode Linkage:**
   - Requires at least 1 valid, enabled sellable variant.
   - For structured products, every enabled variant's `dimensionKey` must exist in catalog `dimensionImages` and be enabled in `selectedDimensions`.
   - Every enabled variant's `materialKey` must exist in catalog `materialSelections` and be enabled in `selectedMaterials`.
2. **Broken Reference Detection:**
   - If a variant references a `dimensionKey` or `materialKey` that was deleted from the catalog:
     - The variant is **NOT** automatically deleted.
     - Readiness flags a blocker: `"Catalog option reference unavailable"`.
     - Status becomes `NEEDS_ATTENTION`.
3. **DIRECT Products:**
   - DIRECT products only require `price > 0`, `currency`, `sku`, `stockStatus`, `buyable: true`, and `sale_enabled: true`.
   - No unnecessary dimension/material selection requirement is placed on DIRECT products.

---

## 7. BİRİM.COM Zero Regression Verification

- **Architectural Discovery / Catalog PDP:** Renders 100% of `dimensionImages` and `materials` from `materialSelections`.
- **PDF Spec Sheet Generator:** Generates spec sheets with complete dimension and material specs.
- **Seçtiklerim (Collections / Projelerim):** Preserves collection items and project finish notes.
- **Quote Cart (Teklif Sepeti):** Works independently on `birim_cart` storage without interference from Shop commerce options.

---

## 8. Test Suite & Build Verification Scorecard

| Workspace                | Task / Command      | Result     | Details                                  |
| ------------------------ | ------------------- | ---------- | ---------------------------------------- |
| `my-birim-react`         | `npm test -- --run` | **PASSED** | 73 test files, 671 tests passed          |
| `my-birim-react`         | `npm run lint`      | **PASSED** | 0 errors                                 |
| `my-birim-react`         | `npm run build`     | **PASSED** | Full production build + sitemap + robots |
| `birim-web` (Studio)     | `npm run build`     | **PASSED** | Sanity Studio compiled cleanly           |
| `birim-shop` (Read Only) | `npm test -- --run` | **PASSED** | 19 test files, 63 tests passed           |
| `birim-shop` (Read Only) | `npm run build`     | **PASSED** | Vite production build compiled cleanly   |

---

## 9. Final Sign-off

- **Catalog Authority:** 100% Preserved
- **Commerce Selections:** Key-based references, zero duplication
- **Stock Status Enum:** Strictly `in_stock`, `out_of_stock`, `preorder`
- **Shop Opt-In:** Strict explicit opt-in for new structured products
- **Legacy Compatibility:** 100% Preserved
- **Shop Codebase:** Untouched (READ ONLY)
- **Status:** **COMPLETE & VERIFIED**
