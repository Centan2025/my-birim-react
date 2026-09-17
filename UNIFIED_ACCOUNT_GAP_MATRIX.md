# BİRİM — UNIFIED ACCOUNT GAP MATRIX

> **System Scope**: `birim.com` (`my-birim-react`), `shop.birim.com` (`birim-shop`), and `birim-web` (Sanity Studio).  
> **Audit Status**: Completed on September 17, 2026.

---

## 1. Comprehensive Capability Breakdown

| #      | Target Capability                                   | Current Status                     | Existing Code / Schema                                                                                                                                         | Missing Pieces                                                                                                                           | Impact / Risk                                                                                             | Recommended Phase                                   |
| ------ | --------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **1**  | **Single Sign-On / Cross-Subdomain Session**        | **Partial**                        | Custom JWT in `lib/server/token.ts`, `birim_token` cookie set in `/api/auth/login`.                                                                            | Cookie missing `Domain=.birim.com; Secure;`. `birim-shop` lacks auth context and session hydration logic.                                | Users logged in on `birim.com` appear logged out on `shop.birim.com`, breaking unified UX.                | **Phase 1: Session & Cross-Domain Auth Foundation** |
| **2**  | **Customer Profile & Metadata**                     | **Exists**                         | `public.profiles` table with `id`, `email`, `full_name`, `phone`, `role`, `company`, `profession`.                                                             | Profile editing API & frontend forms in `birim-shop`. Synchronization of phone format standards.                                         | Minimal risk, data model is robust and already references `auth.users`.                                   | **Phase 2: Customer Account & Address Models**      |
| **3**  | **Professional Badge & Authorization**              | **Exists (Partial Gate)**          | `profiles.role = 'architect'`, `profiles.architect_verification_status` (`pending`, `approved`, `rejected`). Sanity Studio view `SupabaseUsersStudioView.tsx`. | **CAD/BIM download is only client-gated** in `ProductExclusiveContentSection.tsx`. No serverless signed URL generator.                   | Unauthenticated users can scrape or download proprietary CAD/3D files if URL is known.                    | **Phase 4: Asset Gating & Studio Security**         |
| **4**  | **Saved Shipping Addresses**                        | **Missing**                        | Only single snapshot stored in `orders.shipping_address_snapshot` JSONB.                                                                                       | No persistent `customer_addresses` table, no CRUD APIs (`GET/POST/PUT/DELETE /api/customer/addresses`), no address selector in checkout. | Returning customers must manually re-type shipping address every checkout. Higher friction & drop-off.    | **Phase 2: Customer Account & Address Models**      |
| **5**  | **Saved Billing Profiles (Corporate / Individual)** | **Missing**                        | Only single snapshot stored in `orders.billing_address_snapshot` JSONB.                                                                                        | No persistent `customer_billing_profiles` table, no tax office/tax number validation model.                                              | Corporate buyers (architects, contractors) cannot save VAT/e-Fatura credentials for repeat orders.        | **Phase 2: Customer Account & Address Models**      |
| **6**  | **Checkout Prefill & 1-Click Selection**            | **Missing**                        | Checkout form in `CheckoutForm.tsx` supports manual input and transient local state.                                                                           | Auth context listener in `birim-shop`, address/billing prefill hooks, toggle for "Use saved address".                                    | Increased cart abandonment during payment and checkout flows.                                             | **Phase 3: Unified Checkout Integration**           |
| **7**  | **Order Ownership & Historical Orders View**        | **Partial (DB Ready, UI Missing)** | `orders.user_id` column exists in `public.orders` and links when JWT is passed.                                                                                | No `/hesabim/siparisler` (or `/account/orders`) view, no customer order history API `/api/orders/history`.                               | Customers cannot track previous purchases, download invoices, or see order states after closing checkout. | **Phase 3: Unified Checkout Integration**           |
| **8**  | **Guest Order Post-Purchase Account Claiming**      | **Missing**                        | Guest orders store `guest_token_hash` and `guest_email`.                                                                                                       | Workflow / API `/api/orders/claim` to link past guest orders matching customer's email upon registration.                                | Fragmented purchase history if customer shops as guest first and registers later.                         | **Phase 3: Unified Checkout Integration**           |
| **9**  | **Newsletter Subscription & KVKK Consent**          | **Exists (Needs Decoupling)**      | `profiles.newsletter_subscribed`, `profiles.profession = 'Bülten Abonesi'`. Passwordless accounts in `auth.users`.                                             | Dedicated `newsletter_subscribers` table for lightweight anonymous subscriptions without polluting `auth.users`.                         | Clutter in `auth.users` with non-login fake password accounts. Unclear explicit KVKK consent timestamp.   | **Phase 5: Newsletter & Communication Decoupling**  |
| **10** | **Admin / Studio Data Isolation (PII Protection)**  | **Exists (Secure)**                | `birim-web` connects via serverless `/api/admin/*` endpoints using Studio Secret.                                                                              | Fine-grained RBAC on admin endpoints; rate-limiting on member modification.                                                              | Low risk currently, but must maintain strict zero-PII storage policy inside Sanity Content Lake.          | **Phase 4: Asset Gating & Studio Security**         |

---

## 2. Risk & Complexity Matrix

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   RISK VS IMPACT MATRIX                                         │
│                                                                                                 │
│   HIGH    │ [4] Saved Addresses           [1] Cross-Subdomain SSO        [3] Protected CAD Gate │
│   IMPACT  │ (Checkout friction)            (Unified identity broken)     (Asset IP leakage)     │
│           │                                                                                     │
│           │ [5] Saved Billing Profiles    [7] Order History View         [8] Guest Claiming     │
│           │ (Corporate/Architect UX)      (Post-purchase retention)     (Data fragmentation)   │
│           │                                                                                     │
│   LOW     │ [9] Newsletter Clean-up       [2] Profile Sync              [10] Admin RBAC         │
│   IMPACT  │ (DB hygiene)                  (Metadata alignment)          (Security audit)       │
│           └─────────────────────────────────────────────────────────────────────────────────────┤
│             LOW COMPLEXITY                   MEDIUM COMPLEXITY              HIGH COMPLEXITY     │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Structural Gap Analysis

### 3.1 Identity & Session Bridge

- **Current**: Session cookie `birim_token` is Host-Only on `birim.com`. `birim-shop` is a completely isolated guest-first application with zero session hydration.
- **Gap**: No shared cookie scope (`Domain=.birim.com`), no shared auth state hook (`useAuth()`), no unified login redirect bridge between the marketing site and the shop.

### 3.2 Address & Profile Persistence

- **Current**: Customer data is only ephemeral in checkout forms and frozen as immutable snapshots inside `orders.shipping_address_snapshot` and `orders.billing_address_snapshot`.
- **Gap**: Lack of 1st-class relational tables (`customer_addresses`, `customer_billing_profiles`) linked via `user_id -> auth.users(id)`.

### 3.3 Protected Asset Security (CAD / BIM)

- **Current**: The frontend component `ProductExclusiveContentSection.tsx` inspects client state and renders raw `<a href="...">` links directly pointing to public CDN URLs.
- **Gap**: Direct object reference vulnerability (IDOR/public URL leakage). Requires private storage bucket and a serverless signed URL generator verifying `role == 'architect' && status == 'approved'`.

---

## 4. Phased Implementation Roadmap

```text
Phase 1: Shared Auth & Domain Session Foundation
  ├── Configure `Domain=.birim.com; Secure; HttpOnly; SameSite=Lax` in auth cookie handler
  ├── Implement lightweight session hydration hook (`useAuth`) in `birim-shop`
  └── Unify JWT verification middleware across both codebases

Phase 2: Database Schemas & Customer Profile APIs
  ├── Create `customer_addresses` table (user_id, title, address, city, district, postal_code, is_default)
  ├── Create `customer_billing_profiles` table (user_id, type [individual|corporate], tax_id, tax_office)
  ├── Add RLS policies ensuring users can only read/modify their own records
  └── Implement REST endpoints: `GET/POST/PUT/DELETE /api/customer/addresses` & `/api/customer/billing`

Phase 3: Unified Checkout, Prefill & Order History
  ├── Update `birim-shop` checkout to automatically prefill default shipping & billing for logged-in users
  ├── Pass `user_id` reliably to `POST /api/orders` when session exists
  ├── Build `/hesabim/siparisler` order history view with tracking and invoice download
  └── Implement guest order linking via email match on account creation (`/api/orders/claim`)

Phase 4: Serverless Asset Gating & Signed Download URLs
  ├── Move CAD/3D/BIM assets to private Cloudflare R2 bucket
  ├── Implement `/api/assets/download?fileId=...` endpoint with architect verification guard
  └── Issue short-lived HMAC signed URLs (60-second TTL) for authorized downloads

Phase 5: Newsletter Architecture Decoupling & Studio Enhancements
  ├── Separate anonymous newsletter subscribers into `newsletter_subscribers` table
  ├── Ensure KVKK consent timestamp is recorded explicitly
  └── Enhance Sanity Studio "Üye & Mimar Yönetimi" with member search and order volume insights (read-only)
```
