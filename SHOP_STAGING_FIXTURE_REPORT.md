# BİRİM — Safe Shop Test Data & Staging Fixture Setup Report

## 1. Executive Summary

This setup delivers a completely safe, isolated, and repeatable test fixture architecture for **BİRİM SHOP** using a dedicated `staging` dataset in the existing Sanity CMS project (`wn3a082f`).

### Core Safety Guarantees:

- **Zero Production Mutation**: Production dataset (`production`) is strictly read-only.
- **Cross-Dataset Reference Isolation**: Referenced documents (`category`, `designer`, `materialGroup`) are cloned directly into `staging` so that Sanity references (`_ref`) resolve natively within the `staging` dataset without cross-dataset reference errors.
- **Hard Runtime Guards**: All creation and cleanup scripts hard-abort with a fatal error if executed against `production`.
- **Deterministic & Idempotent**: Uses stable document IDs (`test-shop-*`) to prevent duplicate document spam.

---

## 2. Sanity Dataset Architecture & Audit

| Component                | Parameter / Path                       | Default / Production           | Local Staging Test              |
| :----------------------- | :------------------------------------- | :----------------------------- | :------------------------------ |
| **Sanity Project ID**    | `projectId`                            | `wn3a082f`                     | `wn3a082f`                      |
| **Production Dataset**   | `dataset`                              | `production` _(Authoritative)_ | —                               |
| **Staging Dataset**      | `dataset`                              | —                              | `staging`                       |
| **API Version**          | `apiVersion`                           | `2025-01-01`                   | `2025-01-01`                    |
| **Birim Web Studio**     | `sanity.config.ts`                     | `production` (fallback)        | `SANITY_STUDIO_DATASET=staging` |
| **Birim Web CLI**        | `sanity.cli.ts`                        | `production` (fallback)        | `SANITY_STUDIO_DATASET=staging` |
| **Main Site Client**     | `src/lib/sanityClient.ts`              | `production` (fallback)        | `VITE_SANITY_DATASET=staging`   |
| **Main Commerce Client** | `lib/commerce/sanityCommerceClient.ts` | `production` (fallback)        | `VITE_SANITY_DATASET=staging`   |
| **Shop Client**          | `src/services/content/sanityClient.ts` | `production` (fallback)        | `VITE_SANITY_DATASET=staging`   |
| **Shop Vite Proxy**      | `vite.config.ts`                       | `production` (fallback)        | `VITE_SANITY_DATASET=staging`   |

### Creating the Staging Dataset in Sanity (If not already created):

```bash
npx sanity dataset create staging --visibility public
```

---

## 3. Test Product Matrix & Scenarios

| Product Key / ID              | Title                     | Mode           | Sellable | Variants / Stock Scenario                                              | Opt-In Verification                                                                                                              |
| :---------------------------- | :------------------------ | :------------- | :------- | :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| `test-shop-configurable-sofa` | `SOLO SOFA [TEST]`        | `CONFIGURABLE` | Yes      | 4 Matrix Variants (`in_stock`, `preorder`, `out_of_stock`, `in_stock`) | Catalog has 3 sizes (220, 240, 280) & 3 swatches; Shop opts in only to 220 & 240 and 2 swatches (tests strict opt-in filtering). |
| `test-shop-direct-chair`      | `FOSSIL ARMCHAIR [TEST]`  | `DIRECT`       | Yes      | Fixed single-item price (18,500 TRY), `in_stock`                       | Direct purchase with no variant selection required.                                                                              |
| `test-shop-quote-table`       | `RICH TABLE [TEST]`       | `QUOTE`        | No       | Direct purchase CTA hidden; Quote request flow active                  | Verifies non-transactable architectural quote semantics.                                                                         |
| `test-shop-none-object`       | `MINIMA ACCESSORY [TEST]` | `NONE`         | No       | Direct purchase and Quote CTAs disabled                                | Verifies pure catalog showcase items.                                                                                            |

---

## 4. Configurable Fixture Detail (`test-shop-configurable-sofa`)

### A. Dimensions (`dimensionImages[]`)

1. `dim-220`: `220 x 95 x 75 cm` — Selected for Shop (Enabled, Order 1)
2. `dim-240`: `240 x 95 x 75 cm` — Selected for Shop (Enabled, Order 2)
3. `dim-280`: `280 x 105 x 75 cm` — **Catalog Only** _(Not in `selectedDimensions`, verifying opt-in behavior)_

### B. Materials & Swatches (`materialSelections[]`)

- Uses real catalog fabric group (`materialGroup`) with swatches:
  - `swatch-luna-beige`: Selected for Shop (Order 1)
  - `swatch-luna-grey`: Selected for Shop (Order 2)
  - `swatch-luna-anthracite`: **Catalog Only** _(Not in `selectedMaterials`)_

### C. Variants Matrix (`variants[]`)

| Variant ID      | SKU                   | Dimension         | Material   | Price      | Stock Status   | Lead Time | Enabled |
| :-------------- | :-------------------- | :---------------- | :--------- | :--------- | :------------- | :-------- | :------ |
| `var-220-beige` | `TEST-SOFA-220-BEIGE` | `dim-220` (220cm) | Luna Beige | 42,000 TRY | `in_stock`     | —         | True    |
| `var-220-grey`  | `TEST-SOFA-220-GREY`  | `dim-220` (220cm) | Luna Grey  | 42,000 TRY | `preorder`     | 4 Weeks   | True    |
| `var-240-beige` | `TEST-SOFA-240-BEIGE` | `dim-240` (240cm) | Luna Beige | 48,000 TRY | `out_of_stock` | —         | True    |
| `var-240-grey`  | `TEST-SOFA-240-GREY`  | `dim-240` (240cm) | Luna Grey  | 48,000 TRY | `in_stock`     | —         | True    |

---

## 5. Local Environment Configuration

### For `birim-shop` (`.env.local` or `.env`):

```bash
VITE_SANITY_PROJECT_ID=wn3a082f
VITE_SANITY_DATASET=staging
VITE_SANITY_API_VERSION=2025-01-01
VITE_API_URL=/api
```

### For `my-birim-react` (`.env.local` or `.env`):

```bash
VITE_SANITY_PROJECT_ID=wn3a082f
VITE_SANITY_DATASET=staging
SANITY_STUDIO_DATASET=staging
VITE_SANITY_API_VERSION=2025-01-01
```

---

## 6. Execution & Automation Commands

### 1. Generating Test Fixtures in Staging

```bash
# In birim-shop:
npm run fixtures:create

# Or with write token:
SANITY_TOKEN="your-editor-token" npm run fixtures:create
```

_When no `SANITY_TOKEN` is supplied, the script outputs compiled JSON and NDJSON payloads to `dist/staging-fixtures/` ready for Sanity CLI import:_

```bash
npx sanity dataset import "dist/staging-fixtures/staging-fixtures.ndjson" staging --replace
```

### 2. Cleaning Up Test Fixtures from Staging

```bash
# In birim-shop:
npm run fixtures:cleanup

# Or with write token:
SANITY_TOKEN="your-editor-token" npm run fixtures:cleanup
```

_Or via Sanity CLI:_

```bash
npx sanity documents delete test-shop-configurable-sofa test-shop-direct-chair test-shop-quote-table test-shop-none-object --dataset staging
```

---

## 7. Safety Validation & Unit Test Coverage

Unit test suite (`src/test/StagingFixtures.test.ts`) guarantees:

1. `assertSafeStagingDataset('production')` throws a fatal error immediately.
2. `assertSafeStagingDataset('staging')` passes cleanly.
3. Automated test suite runs on every build (`72 tests passed across 21 test suites`).
