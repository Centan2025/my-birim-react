# BİRİM — UNIFIED ACCOUNT PHASE 1: SHARED SESSION FOUNDATION REPORT

> **Scope**: `birim.com` (`my-birim-react`), `shop.birim.com` (`birim-shop`), `birim-web` (Sanity Studio).  
> **Status**: Completed & Verified on September 17, 2026.

---

## 1. Old Auth Architecture (Pre-Phase 1 State)

- **Isolated Frontends**: `birim.com` and `shop.birim.com` functioned as completely disconnected applications in terms of user state.
- **Host-Only Cookie on Main**: `birim_token` was generated on `birim.com/api/auth/login` and stored with `Path=/; HttpOnly; SameSite=Lax` without any unified session bridge.
- **Shop as Pure Guest**: `birim-shop` had zero auth hydration on startup, no context for logged-in users, and treated every shopper as a guest.
- **Order Linkage Gap**: Orders placed from `birim-shop` did not automatically carry user authentication to attach `orders.user_id`.

---

## 2. Final Session Authority Model

- **Single Authority**: `https://birim.com/api/auth/*` is established as the **sole customer authentication authority**.
- **Zero Second Authority**: `birim-shop` does NOT initialize a secondary Supabase auth client or local JWT issuer. It strictly acts as a consumer of the central session authority.

```text
                           [ Supabase Auth (auth.users) ]
                                         │
                         [ CENTRAL API AUTHORITY: birim.com ]
                                         │
                ┌────────────────────────┴────────────────────────┐
                ▼                                                 ▼
      BİRİM.COM CLIENT                                   BİRİM SHOP CLIENT
    (Direct Cookie Session)                           (Cross-Origin Credentials)
```

---

## 3. Cookie Strategy & Hardening

- **Cookie Flags**:
  - `HttpOnly`: Strictly non-accessible to client JavaScript (prevents XSS exfiltration).
  - `SameSite=Lax`: Protects against cross-site request forgery while permitting top-level navigations.
  - `Path=/`: Valid across all API and page routes.
  - `Secure`: Dynamically set to `true` in production (`NODE_ENV === 'production'`) and omitted during local development (`http://localhost:*`), ensuring local testing is unbroken.
  - `Max-Age=604800`: 7-day expiration with single-point invalidation.

---

## 4. Why Host-Only Strategy Was Chosen Over Domain Wildcard

- **Network Reality**: `birim-shop` communicates directly with `https://birim.com/api/...` endpoints.
- **Browser Cookie Semantics**: When a web application on `https://shop.birim.com` initiates `fetch('https://birim.com/api/...', { credentials: 'include' })`, the browser attaches cookies that match the **destination host** (`birim.com`).
- **Security Isolation**: Using a Host-Only cookie on `birim.com` prevents leaking the session token to unrelated or future subdomains (e.g., `studio.birim.com`, `assets.birim.com`, `preview.birim.com`).
- **Conclusion**: `Domain=.birim.com` was intentionally avoided as Host-Only with credentialed CORS is technically superior and offers minimal attack surface.

---

## 5. Cross-Origin Credentials Flow

- **CORS Specification**:
  - `Access-Control-Allow-Origin: https://shop.birim.com` (Exact match via `EXACT_ALLOWED_ORIGINS` in `lib/server/cors.ts`).
  - `Access-Control-Allow-Credentials: true`.
  - Wildcard `*` is strictly disallowed with credentials.
- **Commerce Client Audit**:
  - `apiClient` (`src/services/api.ts`): Set to `credentials: 'include'` by default.
  - `validateCommerceCart` (`cartValidation.ts`): Configured with `credentials: 'include'`.
  - `createCommerceOrderClient` & `fetchCommerceOrderClient` (`orderService.ts`): Configured with `credentials: 'include'`.
  - `initiateCommercePayment` & `getCommercePaymentStatus` (`paymentService.ts`): Configured with `credentials: 'include'`.

---

## 6. Central Session Endpoint Specification (`GET /api/auth/session`)

- **Route**: `GET /api/auth/session` (and alias `GET /api/auth/me`).
- **Authentication Contract**:
  1. Reads `birim_token` from HttpOnly cookie or `Authorization: Bearer` header.
  2. Verifies cryptographic signature and expiry via HMAC-SHA256 (`verifyToken`).
  3. Queries `public.profiles` in Supabase to resolve **fresh, real-time profile state** (preventing stale claims if role or architect status changed post-token creation).
  4. Returns minimized, safe payload:

```json
{
  "authenticated": true,
  "user": {
    "id": "usr_uuid_123",
    "email": "mimar@birim.com",
    "fullName": "Selin Mimar",
    "role": "architect",
    "architectVerificationStatus": "approved",
    "company": "Selin Mimarlık",
    "profession": "İç Mimar",
    "isVerified": true
  }
}
```

- **Unauthenticated / Expired Contract**:

```json
{
  "authenticated": false,
  "user": null
}
```

- **Zero Leakage**: No raw JWTs, secret keys, password hashes, or admin tokens are ever exposed.

---

## 7. Shop Auth Hydration (`ShopAuthContext`)

- **State Machine**:
  - `loading`: Initial startup check in progress.
  - `authenticated`: Session verified; `user` populated.
  - `guest`: Confirmed unauthenticated (200 false or 401).
  - `error`: Network offline / backend unavailable.
- **Resilience**:
  - Network errors do NOT crash the shop or block checkout.
  - `isGuest` evaluates to `true` during both `guest` and `error` states, guaranteeing uninterrupted guest shopping.
- **Zero Token Persistence**: Zero token storage in `localStorage`, `sessionStorage`, `IndexedDB`, or URL queries.

---

## 8. Logout Propagation

- **Single Logout**: Calling `POST /api/auth/logout` on `birim.com` clears `birim_token` with `Max-Age=0; HttpOnly; Secure; SameSite=Lax`.
- **Shop Propagation**: Upon subsequent hydration or page refresh, `shop.birim.com` immediately transitions to `guest` state.

---

## 9. Order User Ownership — Server Authority

- **Client Cannot Spoof `user_id`**: Zod schema `createOrderRequestSchema` strictly enforces `.strict()` rejection of client-provided `user_id` or `userId`.
- **Server-Side Derivation**: `handleOrders` in `api/commerce/[...slug].ts` extracts `userId` from verified token session:
  - If authenticated session exists: `orders.user_id = session.userId`.
  - If guest: `orders.user_id = NULL` and signed `guestToken` is generated.
- **Snapshot Immutability**: Historical order snapshots (`shipping_address_snapshot`, `billing_address_snapshot`, customer names) remain frozen in `orders` record.

---

## 10. Guest Checkout Preservation

- **100% Retained**:
  - In-memory `guestTokenStore.ts` remains active.
  - Header `x-guest-token` transmission is preserved.
  - Database `guest_token_hash` validation continues to guard guest order lookups.
  - Unauthenticated shoppers can complete checkout without login barriers.

---

## 11. Administrative Isolation & Studio Safety

- **Admin Key Protection**: Customer session endpoints use public anon / serverless admin clients without exposing service role keys to browser bundles.
- **Sanity Studio Safety**: Sanity Content Lake continues to hold zero customer PII. Studio member approval uses `/api/admin/members` protected by Studio Secret.

---

## 12. Professional Membership Preservation

- **Unified Identifier**: `architect` users share the same `auth.users.id` identity.
- **Real-time Status Resolution**: Verification state (`approved`, `pending`, `rejected`) is resolved dynamically from `profiles` on each session check.
- **Shop Badge Affordance**: Authenticated architects display a discreet `MİMAR` tag in the Shop Header.

---

## 13. Newsletter System Preservation

- **Zero Disruption**: Newsletter signup flows (`/api/newsletter/subscribe`, `profiles.profession = 'Bülten Abonesi'`) remain completely untouched in this phase.

---

## 14. Security Scan Results

- **Secrets Scan**: Grep for `JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and raw credentials in client bundles returned **0 occurrences**.
- **Storage Scan**: Grep for token persistence in `localStorage`/`sessionStorage` returned **0 occurrences**.

---

## 15. Test & Build Verification Summary

| Package              | Test Suites   | Tests Count    | Lint Status                         | Build Status               |
| -------------------- | ------------- | -------------- | ----------------------------------- | -------------------------- |
| `my-birim-react`     | **74 Passed** | **683 Passed** | **0 Errors** (11 warnings in tests) | **Built in 7.79s (Pass)**  |
| `birim-shop`         | **20 Passed** | **68 Passed**  | **0 Errors, 0 Warnings**            | **Built in 1.03s (Pass)**  |
| `birim-web` (Studio) | N/A           | N/A            | Clean                               | **Built in 18.17s (Pass)** |

---

## 16. Remaining Gaps & Proposed Phase 2 Scope

### Remaining Architectural Gaps (Scheduled for Phase 2)

1. **Persistent Customer Address Model**: Missing `customer_addresses` table and REST endpoints (`GET/POST/PUT/DELETE /api/customer/addresses`).
2. **Persistent Billing Profiles**: Missing `customer_billing_profiles` table for individual TC ID and corporate e-Fatura/tax credentials.
3. **Checkout Prefill**: Automatic 1-click address selection for logged-in shoppers in `CheckoutForm.tsx`.
4. **Customer Account Dashboard**: User account views (`/hesabim`, `/hesabim/siparisler`, `/hesabim/adresler`).
5. **Historical Orders API**: Authenticated order history endpoint (`GET /api/orders/history`).
6. **CAD/BIM Server Gating**: Cloudflare R2 private bucket + HMAC signed URLs for 3D/CAD downloads.

---

# UNIFIED ACCOUNT PHASE 1 — SHARED SESSION FOUNDATION COMPLETE
