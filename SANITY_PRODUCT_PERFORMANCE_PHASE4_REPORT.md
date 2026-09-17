# BİRİM Control Center — Product Performance & Funnel Phase 4 Report

**Date:** 2026-09-17  
**Scope:** Sanity Studio Control Center Product Performance Dashboard, Authoritative Backend Aggregation Engine, Conversion Funnel Visualization  
**Status:** COMPLETE & VERIFIED

---

## 1. Authoritative Backend Aggregation Engine

### 1.1 Pure Calculation Architecture (`lib/commerce/admin-product-performance-service.ts`)

- **Authoritative Source:** `paidOrders`, `unitsSold`, `grossRevenue` are derived strictly from database records (`orders` with status `PAID`, `PARTIALLY_REFUNDED`, `REFUNDED` and their associated `order_items`).
- **Engagement Source:** `views`, `clicks`, `variantInteractions`, `addToBagCount`, `checkoutStarts` are derived from `shop_analytics_events`.
- **Safe Conversion Rate Computation:**
  $$\text{View } \to \text{ Bag Rate} = \frac{\text{Add to Bag Count}}{\text{Views}} \times 100 \quad (\text{0 when views} = 0)$$
  $$\text{Bag } \to \text{ Purchase Rate} = \frac{\text{Paid Orders}}{\text{Add to Bag Count}} \times 100 \quad (\text{0 when add to bag} = 0)$$
  $$\text{Overall Funnel Rate} = \frac{\text{Paid Orders}}{\text{Total Views}} \times 100 \quad (\text{0 when total views} = 0)$$

### 1.2 Multi-Currency Segregation

- All financial and engagement metrics are isolated by currency (`TRY`, `EUR`, `USD`).
- Currencies are never cross-summed.

### 1.3 Refund Allocation Semantics

- Partial refunds cannot be arbitrarily allocated across heterogeneous product line items without transaction-level itemization.
- Therefore, product-level revenue strictly reports **Gross Sales** from confirmed orders.
- Refund totals and Net Revenue remain authoritative at the order level and store overview, accompanied by an explicit disclosure note.

---

## 2. API Endpoints & Routing

| Endpoint                                   | Method | Security Gate                            | Description                                                           |
| :----------------------------------------- | :----- | :--------------------------------------- | :-------------------------------------------------------------------- |
| `/api/analytics/shop/events`               | `POST` | Rate Limiter + Zero-PII Validator        | Non-blocking storefront engagement event ingestion.                   |
| `/api/admin/analytics/products`            | `GET`  | Admin JWT / `x-admin-secret` Break-Glass | Returns per-product engagement, sales, and conversion funnel summary. |
| `/api/admin/commerce/products/performance` | `GET`  | Admin JWT / `x-admin-secret` Break-Glass | Alias route for product performance metrics.                          |

---

## 3. Database Migration Status

- **File:** `supabase/migrations/20260917_shop_analytics_events.sql`
- **Status:** `MIGRATION REQUIRED` (NOT applied to production database).
- **Security & Constraints:**
  - Idempotent SQL (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
  - Row-Level Security (RLS) is enabled.
  - Public / Anon direct write permissions are **revoked**; ingestion operates strictly via backend service-role API.
  - Zero PII columns.

---

## 4. Sanity Studio Control Center UI (`birim-web`)

- **Component:** `ProductPerformance.tsx`
- **Hook:** `useProductPerformance.ts`
- **Features:**
  1. **4-Stage Funnel Overview:** Visualizes `Product Views` $\to$ `Add to Bag` $\to$ `Checkout Starts` $\to$ `Paid Orders` with step-by-step and overall conversion rates.
  2. **Product Performance Table:** Sortable by Gross Revenue, Views, Add to Bag, Paid Orders, Units Sold, and Conversion Rates.
  3. **Resilient Degradation:** Provides elegant loading skeletons, error boundaries, and empty state messaging when database tables are awaiting migration.
  4. **Strict Zero-Credential Architecture:** No long-lived admin credentials, keys, or storage tokens used in the frontend.

---

## 5. Verification Results

| Project          | Unit Tests                      | Lint Errors              | Production Build |
| :--------------- | :------------------------------ | :----------------------- | :--------------- |
| `my-birim-react` | **635 passed** (71 test suites) | **0 errors, 0 warnings** | Built in 7.21s   |
| `birim-web`      | Tested via Vitest & React build | **0 errors, 0 warnings** | Built in 18.5s   |
| `birim-shop`     | **54 passed** (17 test suites)  | **0 errors, 0 warnings** | Built in 999ms   |
