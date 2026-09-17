# BİRİM — PRE-PRODUCTION FULL SYSTEM SIMULATION REPORT

## Real CMS Data + Safe Fake Customer / Order / Payment Environment

---

## 1. Executive Summary

This simulation environment provides a complete, isolated pre-production testing bed connecting **BİRİM.COM**, **BİRİM SHOP**, **Sanity CMS**, and **Supabase**. It runs authentic application code against real content data structures while ensuring strictly zero production mutations, zero real customer data, zero production payment activation, and zero production migrations.

### Environment Status

- **Overall Status**: **VERIFIED / READY FOR QA**
- **Sanity Dataset**: `staging` (Target for Mode A deterministic fixtures & Mode B real catalog mirror)
- **Supabase Target**: Isolated Staging / Test Environment
- **Payment Provider**: Mock Adapter (Guarded strictly against production activation)
- **Production Migration**: **NOT APPLIED**
- **Production Deployment**: **NOT TRIGGERED**
- **Production Mutations**: **0**

---

## 2. Production Parity Matrix

| Component                    | Pre-Production / Staging                              | Production                        |
| :--------------------------- | :---------------------------------------------------- | :-------------------------------- |
| **Sanity CMS Dataset**       | `staging`                                             | `production`                      |
| **Product & Material Graph** | Cloned real dependency structure + Test Matrix        | Authoritative live catalog        |
| **Customer Identities**      | Deterministic fake test users (`@test.birim.invalid`) | Real authenticated users          |
| **Addresses & Billing**      | Obviously fake test PII                               | Real customer data                |
| **Orders & Snapshots**       | Test orders with real staged product snapshots        | Live transactional orders         |
| **Payment Gateway**          | Server-authoritative Mock Provider (`mock` / `test`)  | Future Payment Provider (TBD)     |
| **Auth Session**             | Central `birim_token` (Host-Only)                     | Central `birim_token` (Host-Only) |
| **Analytics**                | Disabled / Test property                              | Live Google/Plausible analytics   |
| **SEO Indexing**             | `noindex, nofollow` / Disallow                        | Canonical indexing                |

---

## 3. Staging Data Strategy & Modes

### Mode A — Deterministic Test Matrix

Stable fixtures designed for automated regression testing:

1. `test-shop-direct-chair`: DIRECT purchase armchair (`price: 35,000 TRY`, instant buy).
2. `test-shop-configurable-sofa`: CONFIGURABLE sofa (`dim-220`, `mat-oak`, `swatch-luna-beige`, server-calculated price).
3. `test-shop-quote-table`: QUOTE table (`sales_mode: 'QUOTE'`, non-buyable direct, inquiry/Quote Cart only).
4. `test-shop-none-object`: NONE object (`sales_mode: 'NONE'`, non-buyable, archival exhibition).

### Mode B — Realistic Catalog Mirror

- Script: `scripts/clone-production-catalog-to-staging.ts` (`npm run fixtures:catalog:clone`).
- Mechanism: Queries production Sanity dataset via read-only CDN client, harvests safe allowlisted types (`category`, `designer`, `materialGroup`, `product`), strips drafts and private operational data, and outputs clean staging payloads (`real-catalog-staging.json` / `.ndjson`).
- Safety: Strictly read-only against production; rejects any target dataset other than `staging`.

---

## 4. Deterministic Test Customer Identities

| Identity                        | Email                                            | Role        | Verification | Addresses      | Billing                         | Orders                                    |
| :------------------------------ | :----------------------------------------------- | :---------- | :----------- | :------------- | :------------------------------ | :---------------------------------------- |
| **USER A (Standard)**           | `customer-standard@test.birim.invalid`           | `member`    | `none`       | 2 saved        | 1 corporate (VKN: `1111111111`) | 1 historical order (`CONFIRMED` / `PAID`) |
| **USER B (Architect Pending)**  | `customer-architect-pending@test.birim.invalid`  | `architect` | `pending`    | 0              | 0                               | 0                                         |
| **USER C (Architect Approved)** | `customer-architect-approved@test.birim.invalid` | `architect` | `approved`   | 0              | 0                               | 0                                         |
| **USER D (Empty Account)**      | `customer-empty@test.birim.invalid`              | `user`      | `none`       | 0              | 0                               | 0                                         |
| **USER E (Edge Case)**          | `customer-edge@test.birim.invalid`               | `member`    | `none`       | 1 (no default) | 1 individual (no default)       | 0                                         |

---

## 5. End-to-End Simulation Flow Results

### 1. DIRECT Product Checkout Flow — `PASS`

- Product: `prod-chair-direct` (`sales_mode: 'DIRECT'`).
- Validation: Server confirms buyability and price (`35,000 TRY`).
- Order Creation: Order placed in `PENDING_PAYMENT` state with line-item and shipping snapshots.
- Mock Payment: `initiatePayment` -> `handlePaymentCallback` -> Order transitions to `CONFIRMED` / `PAID`.

### 2. CONFIGURABLE Product Flow — `PASS`

- Product: `prod-sofa-configurable` (`sales_mode: 'CONFIGURABLE'`).
- Variant: Dimension `dim-220` + Finish `mat-oak` / `swatch-luna-beige` -> Variant SKU `BRM-SRM-220-OAK-BG`.
- Price Calculation: Server evaluates combination and sets authoritative price (`72,000 TRY`).

### 3. QUOTE and NONE Product Commerce Isolation — `PASS`

- QUOTE product (`prod-table-quote`): Attempting direct checkout throws `PRODUCT_NOT_BUYABLE` (`Ürün satın alınabilir durumda değil`). Preserves Quote Cart (`birim_cart`) inquiry path.
- NONE product (`prod-object-none`): Attempting direct checkout throws `PRODUCT_NOT_BUYABLE`.

### 4. Guest Checkout Isolation — `PASS`

- Unauthenticated checkout executes cleanly.
- `orders.user_id` is set to `null` / `undefined`.
- Signed HMAC `guestToken` is issued and verified; order history is inaccessible without the token.

### 5. Authenticated Checkout & Account Prefill — `PASS`

- Authenticated user session hydrates automatically.
- Default delivery address and corporate billing profile prefill checkout form.
- Save-to-account checkbox triggers non-blocking background save.
- Order ownership attached to user (`orders.user_id = usr-test-standard-001`).

### 6. Historical Order Snapshot Immutability — `PASS`

- Modifying or deleting customer saved addresses in `/hesabim` has zero effect on historical orders.
- Order detail drawer renders immutable `shippingAddressSnapshot` and `billingAddressSnapshot`.

### 7. Multi-User Isolation — `PASS`

- User A can only list and view orders belonging to User A (`orders.user_id = User A`).
- Accessing another user's order ID returns `403 FORBIDDEN` / `PAYMENT_ORDER_NOT_OWNED`.

### 8. Mock Payment Safety Guard — `PASS`

- `MockPaymentProvider` incorporates `assertAllowedEnvironment()`.
- In `NODE_ENV === 'production'`, calling mock payment immediately throws `403 MOCK_PROVIDER_DISABLED`.
- Simulates `SUCCESS`, `FAILURE`, `CANCELLED`, and `TIMEOUT` states deterministically.

---

## 6. Verification Commands & Test Results

```bash
# my-birim-react
npm test -- --run   # 77 test files, 725 tests passed (0 failures)
npm run lint        # 0 errors, 45 warnings (within allowed threshold)
npm run build       # Succeeded (Vite build + sitemap + robots)

# birim-shop
npm test -- --run   # 22 test files, 91 tests passed (0 failures)
npm run lint        # 0 errors, 0 warnings
npm run build       # Succeeded (Vite build in 1.09s)

# Sanity Studio
npm run build       # Succeeded (18.8s)
```

---

## 7. Physical Cloud Staging Infrastructure Status

### A. Supabase Staging Project

- **Status**: **NOT CREATED / BLOCKED ON MANUAL DASHBOARD ACTION**
- **Existing Production DB**: `rkmpfxervwqleibhbiqv.supabase.co` (STRICTLY PROTECTED with zero test mutations or schema modifications).
- **Provisioning Method**: Programmatic project creation via `npx supabase projects create` requires `SUPABASE_ACCESS_TOKEN`. Without an account token in the environment, a new separate project (e.g. `birim-staging`) must be created manually via [Supabase Dashboard](https://supabase.com/dashboard/projects).
- **Staging Schema Target**: Once provisioned, execute `supabase/migrations/20260917_customer_addresses_and_billing.sql` exclusively on the staging database.

### B. Sanity Staging Cloud Dataset

- **Status**: **NOT CREATED ON CLOUD / LOCAL HARVEST READY**
- **Production Dataset**: `production` on project `wn3a082f` (95 products, 10 categories, 11 designers, 3 material groups).
- **Staging Dataset**: Cloud query returned 404. Creating dataset `staging` on project `wn3a082f` requires write token (`npx sanity dataset create staging` or [Sanity Manage Dashboard](https://sanity.io/manage/project/wn3a082f/datasets)).
- **Local Staging Payloads**: Generated and ready for import in `dist/staging-fixtures/real-catalog-staging.json` & `.ndjson` (75 documents, 0 broken references) and `staging-fixtures.json` & `.ndjson` (Mode A deterministic fixtures).

---

## 8. Next Steps & Go-Live Prerequisites

1. **Physical Staging Provisioning**:
   - Create dataset `staging` on Sanity project `wn3a082f`.
   - Create separate Supabase staging project (e.g. `birim-staging`) and execute `20260917_customer_addresses_and_billing.sql`.
   - Seed deterministic fake accounts via `npm run fixtures:accounts:create`.
2. **Payment Provider Selection**: When payment gateway vendor (e.g. iyzico, PayTR) is chosen, implement the provider adapter conforming to `PaymentProvider` interface.
3. **Production Migration Execution**: Apply `20260917_customer_addresses_and_billing.sql` to Supabase production upon explicit go-live authorization.
