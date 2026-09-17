# BİRİM UNIFIED CUSTOMER ACCOUNT — PRODUCTION ACTIVATION GUIDE

## Preflight, Migration, Deployment, Smoke Testing, Rollback & Monitoring

---

## 1. Executive Summary & Safety Policy

This document outlines the strict, safe, step-by-step procedure for taking the **Unified Customer Account (Phase 2)** live in production across **BİRİM.COM** and **BİRİM SHOP**.

### Mandatory Safety Guardrails

1. **Zero Premature Execution**: No database migrations or production deployments shall be executed without explicit operator approval.
2. **Additive-Only Schema**: The database changes introduce new tables and an additive column. Existing production tables (`auth.users`, `public.orders`, `public.order_items`, `public.profiles`) are never dropped or destructively modified.
3. **Failure Isolation**: If any account service or database function encounters an issue, guest checkout, cart validation, and quote cart continue operating without interruption.
4. **Zero Secrets in Documentation**: All secrets (`JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) remain in secure environment management systems and are never committed or logged.

---

## 2. Migration Execution Process

### Canonical Migration Script

Path: `supabase/migrations/20260917_customer_addresses_and_billing.sql` (mirrored in `scripts/customer_account_schema.sql`)

### Changes Included

1. **Profile Enhancement**: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS newsletter_subscribed BOOLEAN DEFAULT false;`
2. **Customer Addresses Table**: `public.customer_addresses` with partial unique index for default shipping per user.
3. **Customer Billing Profiles Table**: `public.customer_billing_profiles` with partial unique index for default billing per user.
4. **Triggers**: `handle_updated_at()` trigger for `updated_at` timestamps on update.
5. **Row Level Security (RLS)**: Enabled with idempotent `DROP POLICY IF EXISTS ... CREATE POLICY ...` allowing users to manage only their own records.
6. **Atomic Default RPCs**:
   - `public.set_default_customer_address(p_user_id UUID, p_address_id UUID)`
   - `public.set_default_customer_billing_profile(p_user_id UUID, p_billing_id UUID)`
   - Defined with `SECURITY DEFINER`, `search_path = public, pg_temp`, ownership validation, execution permissions revoked from `PUBLIC`, `anon`, `authenticated`, and granted exclusively to `service_role`.

### Execution Options

- **Option A (Supabase Dashboard)**: Open Supabase Project SQL Editor -> Paste contents of `supabase/migrations/20260917_customer_addresses_and_billing.sql` -> Execute.
- **Option B (Supabase CLI)**: Run `supabase db push` against the linked production environment.

---

## 3. Deployment Sequence

To avoid any race conditions where frontend code requests database resources before they exist, follow this exact order:

```text
[Step 1: Backup & Recovery Verification]
   │ Verify Supabase backup / PITR status
   ▼
[Step 2: Apply Database Migration]
   │ Execute 20260917_customer_addresses_and_billing.sql
   ▼
[Step 3: Verify Database Objects]
   │ Confirm tables, indexes, RLS, and RPC execution rights
   ▼
[Step 4: Deploy BİRİM.COM (my-birim-react)]
   │ Deploys backend account APIs (/api/account/*) and /hesabim UI
   ▼
[Step 5: Smoke Test BİRİM.COM Account Center]
   │ Verify login, profile edit, address CRUD, billing CRUD
   ▼
[Step 6: Deploy BİRİM SHOP (birim-shop)]
   │ Deploys checkout prefill and ShopHeader HESABIM link
   ▼
[Step 7: Cross-Subdomain Smoke Test]
   │ Verify SSO hydration on shop.birim.com and checkout prefill
   ▼
[Step 8: Post-Activation Monitoring (First 60 mins)]
```

---

## 4. Live Smoke-Test Checklist

Perform these tests using an internal BİRİM test account (e.g. `test-account@birim.com`):

### 1. Central Authentication & Account Center (`https://www.birim.com/hesabim`)

- [ ] Log in with test account on `birim.com`.
- [ ] Confirm automatic redirection / access to `/hesabim`.
- [ ] Update profile fields (`name`, `phone`, `company`, `profession`) -> Confirm persistence upon refresh.
- [ ] Toggle newsletter subscription checkbox -> Confirm real-time persistence.
- [ ] Verify `role`, `email`, and `user_id` remain non-editable.

### 2. Delivery Addresses

- [ ] Create a new delivery address (e.g. "Ev - Kadıköy").
- [ ] Create a second delivery address (e.g. "Ofis - Beşiktaş").
- [ ] Set "Ofis - Beşiktaş" as default shipping -> Verify default badge switches atomically.
- [ ] Edit an existing address line -> Confirm updated values persist.
- [ ] Delete non-default address -> Confirm modal confirmation and deletion.

### 3. Billing Profiles

- [ ] Create an Individual billing profile with 11-digit TCKN.
- [ ] Create a Corporate billing profile with Company Name, Tax Office, and 10-digit VKN.
- [ ] Verify VKN masking (`******1234`) on display.
- [ ] Switch default billing profile -> Verify atomic default update.

### 4. BİRİM SHOP Integration (`https://shop.birim.com`)

- [ ] Navigate to `shop.birim.com` while logged in -> Confirm `ShopHeader` displays user initials and links to `https://www.birim.com/hesabim`.
- [ ] Add an eligible direct-purchase product to bag -> Proceed to `/checkout`.
- [ ] Confirm saved default delivery address and billing profile automatically prefill form fields.
- [ ] Switch between saved address cards -> Confirm form fields update immediately.
- [ ] Select "Yeni Adres" -> Fill a new address with "Bu teslimat adresini hesabıma kaydet" checked.
- [ ] Complete order placement -> Confirm order created successfully, `orders.user_id` matches user ID, and new address appears in `/hesabim`.

### 5. Historical Order Snapshot Immutability

- [ ] Go to `https://www.birim.com/hesabim` -> Tab _Siparişlerim_.
- [ ] Inspect the placed order in detail drawer -> Confirm snapshot displays original delivery address.
- [ ] Modify or delete the address in _Teslimat Adreslerim_ -> Reopen order drawer and confirm historical snapshot is completely unchanged.

### 6. Guest Checkout & Quote Cart Regression

- [ ] Open incognito/private browser (unauthenticated).
- [ ] Complete a guest checkout on `shop.birim.com` -> Confirm `orders.user_id` is NULL, guest token is issued, and no account APIs are called.
- [ ] On `birim.com`, add items to the Quote Cart (`birim_cart`) -> Proceed to `/contact?source=cart` -> Confirm Quote Cart operates 100% untouched.

---

## 5. Rollback Strategy & Triggers

### Rollback Triggers (Halt & Revert Criteria)

- **High Severity (Immediate Rollback)**:
  - Systemic 500 errors on authentication or order creation.
  - Cross-user data leakage (a user seeing another user's addresses/orders).
  - Guest checkout completely blocked.
  - Quote Cart or catalog browsing impaired.
- **Medium Severity (Hotfix or Partial Rollback)**:
  - Shop prefill failing to fetch (automatically falls back to manual form; if persistent, investigated via CORS/cookie logs).

### Application Rollback Process

1. Revert `my-birim-react` and `birim-shop` deployments to previous production commit.
2. Because the database migration is strictly additive, **no database DROP is required**. The previous application version safely ignores `customer_addresses`, `customer_billing_profiles`, and `newsletter_subscribed`.
3. Database tables and columns can remain in place while frontend/backend code is diagnosed.

---

## 6. Monitoring Plan (First 60 Minutes)

Monitor via existing server logs and analytics:

1. **API Error Rates**: Monitor `GET /api/auth/session`, `GET/POST /api/account/*`, and `POST /api/commerce/orders` for 5xx anomalies.
2. **CORS & Preflight**: Ensure `OPTIONS` and cross-origin calls from `shop.birim.com` to `www.birim.com/api` return `200` with valid headers.
3. **PII Safety Verification**: Confirm server logs contain zero customer address, phone, or billing payloads.
4. **Order Conversion**: Verify successful order transitions to `PENDING_PAYMENT` / `CONFIRMED`.
