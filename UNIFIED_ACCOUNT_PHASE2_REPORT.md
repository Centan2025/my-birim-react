# UNIFIED CUSTOMER ACCOUNT — PHASE 2 FINAL REPORT

## Supabase Auth + Customer Profiles + Addresses + Billing + Account Center UI + Shop Checkout Prefill + Final Integration

---

## 1. Executive Summary

Phase 2 establishes a single authoritative customer account model across BİRİM.COM and BİRİM SHOP.

- **Phase 2A (Database Schema & Server APIs)**: **VERIFIED**
- **Phase 2B (Canonical Account Center UI on `/hesabim`)**: **VERIFIED**
- **Phase 2C (Shop Checkout Prefill & Shop Header Integration)**: **VERIFIED**
- **Final Integration Review**: **VERIFIED**
- **Production Migration**: **NOT APPLIED** (Additive migration script preserved in `supabase/migrations/20260917_customer_addresses_and_billing.sql`)
- **Production Activation**: **PENDING**

---

## 2. Phase 2 Architecture & Integration Contracts

### Central Identity & Session Authority

- **Canonical Identity**: `auth.users.id` in Supabase remains the single customer identity. Zero secondary customer tables or parallel IDs created.
- **Central Session**: `birim_token` (Host-Only, HttpOnly, SameSite=Lax, Secure in production) serves as the authoritative session cookie.
- **Cross-Subdomain Session**: BİRİM SHOP (`shop.birim.com`) reads user session via `GET /api/auth/session` with `credentials: 'include'` against `www.birim.com/api`.
- **CORS & Credentials**: `handleCors` dynamically verifies allowed origins (`https://shop.birim.com`, `https://www.birim.com`, `https://birim.com`), echoing exact origin and `Access-Control-Allow-Credentials: true`. No wildcard origins used with credentials.

### Account API Contracts

- **Profile Mutability Allowlist**: Strictly limited to `name`, `phone`, `company`, `profession`, `newsletter_subscribed`. Forbidden fields (`role`, `architect_verification_status`, `is_verified`, `email`, `user_id`) cannot be modified by customer requests.
- **Delivery Addresses**: Full CRUD (`customer_addresses`) with atomic default switching RPC (`set_default_customer_address`) protected by `SECURITY DEFINER` and `REVOKE FROM anon, authenticated`.
- **Billing Profiles**: Full CRUD (`customer_billing_profiles`) with atomic default switching RPC (`set_default_customer_billing_profile`). Turkish 11-digit TCKN and 10-digit VKN are canonically stored in `tax_number`. No parallel `tckn` column.
- **Order Ownership & Snapshot Immutability**: Order placement captures historical snapshots (`shippingAddressSnapshot`, `billingAddressSnapshot`, `lineItemsSnapshot`). Modifying saved addresses or billing profiles in the account center never alters historical order data. Server assigns `orders.user_id` from the authenticated session; client payloads never transmit or control `user_id`.

### BİRİM SHOP Checkout & Navigation

- **Prefill & Switching**: Authenticated users on `shop.birim.com/checkout` automatically load saved delivery addresses and billing profiles. Switching between saved cards immediately updates checkout fields.
- **Save to Account**: Optional "Bu teslimat adresini hesabıma kaydet" / "Bu fatura profilini hesabıma kaydet" triggers non-blocking asynchronous saves upon order creation. Account save failures never block checkout or payment.
- **Header & Navigation**: Desktop header user icon and mobile navigation drawer link to canonical `https://www.birim.com/hesabim`. Zero local `/hesabim` routes created in Shop.
- **Guest Flow & Quote Cart Isolation**: 100% untouched guest checkout flow with `guestTokenStore`. Zero changes to main website Quote Cart (`CartContext`, `CartSidebar`, `/contact?source=cart`).

### Security, Privacy, & Data Isolation

- **Zero Client-Side PII Storage**: Strictly zero customer PII in `localStorage`, `sessionStorage`, cookies, query parameters, or analytics events.
- **Sanity Zero-PII Boundary**: Sanity CMS remains strictly for catalog/content/configuration. Zero customer data stored in Sanity.
- **PII Logging Safety**: All client and server error logs use sanitized, generic messages without emitting user PII.

---

## 3. Test & Verification Matrix

| Workspace / Project             | Test Suite Result                            | Lint Result                              | Build Result                                           |
| :------------------------------ | :------------------------------------------- | :--------------------------------------- | :----------------------------------------------------- |
| **`my-birim-react`**            | 76 test files, 715 tests passed (0 failures) | 0 errors, 45 warnings (within threshold) | Succeeded (`dist/` generated, sitemap/robots complete) |
| **`birim-shop`**                | 22 test files, 91 tests passed (0 failures)  | 0 errors, 0 warnings                     | Succeeded (`dist/` built with zero errors)             |
| **`birim-web` (Sanity Studio)** | N/A (Studio schema)                          | 0 errors                                 | Succeeded (`sanity build` 18.8s)                       |

---

## 4. Production Readiness Status

```text
CODE READY: YES
TESTS VERIFIED: YES (100% PASS ACROSS ALL WORKSPACES)
PRODUCTION MIGRATION: NOT APPLIED
PRODUCTION ACTIVATION: PENDING
```
