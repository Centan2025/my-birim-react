# BİRİM — UNIFIED CUSTOMER ACCOUNT ARCHITECTURE AUDIT

## Supabase Auth + Professional Membership + Newsletter + Customer Profile + Shop + Orders

> **STATUS:** AUDIT ONLY — ZERO CODE MODIFICATIONS  
> **EVALUATION DATE:** 2026-09-17  
> **REPOSITORIES AUDITED:**
>
> 1. Main Project: `C:\Users\ASUS\.gemini\antigravity\scratch\my-birim-react`
> 2. Sanity Studio: `C:\Users\ASUS\.gemini\antigravity\scratch\my-birim-react\birim-web`
> 3. Shop: `C:\Users\ASUS\.gemini\antigravity\scratch\birim-shop`

---

## 1. SUPABASE AUTH AUDIT

- **Browser Client Initialization:** `VERIFIED IN CODE`
  - Location: [`src/lib/supabaseClient.ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/src/lib/supabaseClient.ts)
  - Uses `createClient(supabaseUrl, supabaseAnonKey)` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Server/Admin Client Initialization:** `VERIFIED IN CODE`
  - Location: [`lib/server/supabaseAdmin.ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/lib/server/supabaseAdmin.ts)
  - Uses `getSafeSupabaseAdmin()` / `getSupabaseAdmin()` with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Configured with `auth: { autoRefreshToken: false, persistSession: false }`.
- **Login Flow:** `VERIFIED IN CODE`
  - Endpoint: `POST /api/auth/login` in [`api/auth/[action].ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/api/auth/%5Baction%5D.ts#L128-L243)
  - Authenticates credentials against Supabase Auth via `clientAuth.auth.signInWithPassword({ email, password })`.
  - Verifies email confirmation (`authUser.email_confirmed_at || profile.is_verified`).
  - Generates custom HMAC-SHA256 JWT via `createToken({ sub: authUser.id, email, role })`.
  - Sets HttpOnly cookie `birim_token` and returns `{ success: true, token, user }`.
- **Logout Flow:** `VERIFIED IN CODE`
  - Endpoint: `POST /api/auth/logout` in [`api/auth/[action].ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/api/auth/%5Baction%5D.ts#L535-L543)
  - Calls `clearAuthCookie(res)` (`Max-Age=0`).
  - Frontend [`AuthContext.tsx`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/src/context/AuthContext.tsx#L120-L133) clears `localStorage.removeItem('birim_user')` and resets state.
- **Signup Flow:** `VERIFIED IN CODE`
  - Endpoint: `POST /api/auth/register` in [`api/auth/[action].ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/api/auth/%5Baction%5D.ts#L245-L472)
  - Creates user in `auth.users` via `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: false, user_metadata })`.
  - Generates SHA-256 hashed verification token, sends verification email, and creates row in `public.profiles`.
- **Session Restore:** `VERIFIED IN CODE`
  - Endpoint: `GET /api/auth/me` in [`api/auth/[action].ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/api/auth/%5Baction%5D.ts#L474-L533)
  - Reads `birim_token` cookie or Bearer token header, verifies JWT payload `sub`, fetches profile from `public.profiles`.
- **Token Refresh:** `VERIFIED IN CODE`
  - Custom JWT lasts 7 days (`Max-Age=604800`). No rolling token refresh endpoint currently exists.
- **Password Reset:** `VERIFIED IN CODE`
  - Endpoint: `POST /api/auth/reset-password` in [`api/auth/[action].ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/api/auth/%5Baction%5D.ts#L627-L725)
  - `action === 'request'`: stores `reset_password_token` in `auth.users.user_metadata` and sends email.
  - `action === 'confirm'`: verifies token expiry and updates password via `supabaseAdmin.auth.admin.updateUserById`.
- **Email Verification:** `VERIFIED IN CODE`
  - Endpoint: `POST /api/auth/verify` in [`api/auth/[action].ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/api/auth/%5Baction%5D.ts#L544-L626)
  - Verifies token hash, confirms `email_confirm = true`, sets `profiles.is_verified = true`.
- **Magic Link:** `NOT FOUND` (Not implemented).
- **OAuth Providers:** `NOT FOUND` (Only email/password authentication is implemented).

---

## 2. AUTH ROUTES

### A. Main Site (`my-birim-react`)

`VERIFIED IN CODE` — Source: [`src/routes/AppRoutes.tsx`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/src/routes/AppRoutes.tsx)

- `/login` — `LoginPage` (Giriş Yap & Üye Ol tabs)
- `/profile` — `ProfilePage` (Hesap Özeti, Mimar Durumu, Siparişlerim Bağlantısı)
- `/verify-email` — `VerifyEmailPage`
- `/reset-password` — `ResetPasswordPage`
- `/account/orders` — `CommerceOrdersPage` (Kullanıcı Sipariş Geçmişi)
- `/account/orders/:orderId` — `CommerceOrderDetailPage` (Sipariş Detayı)
- `/admin/orders` — `CommerceOrdersAdminPage`
- `/admin/orders/:orderId` — `CommerceOrderDetailAdminPage`

### B. Shop Site (`birim-shop`)

`VERIFIED IN CODE` — Source: [`birim-shop/src/routes/AppRoutes.tsx`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/birim-shop/src/routes/AppRoutes.tsx)

- `/` — `HomePage`
- `/category/:categorySlug` — `CategoryPage`
- `/product/:slug` — `ProductDetailPage`
- `/bag` — `BagPage`
- `/checkout` — `CheckoutPage`
- `/order/:orderId` — `OrderResultPage`
- **Auth Routes in Shop:** `NOT FOUND` (No login, signup, or profile routes exist in Shop).

---

## 3. HEADER AUTH UX

### A. Main Site Header (`my-birim-react/src/components/Header.tsx`)

`VERIFIED IN CODE`

- **Desktop:**
  - Displays a text button next to "Seçtiklerim": `GİRİŞ` / `LOGIN` (when logged out) or `PROFİL` / `PROFILE` (when logged in).
  - Clicking this button dispatches `window.dispatchEvent(new Event('openFloatingAuthPanel'))`, opening [`FloatingAuthPanel.tsx`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/src/components/FloatingAuthPanel.tsx).
  - Inside `FloatingAuthPanel`: If logged in, shows user name, email, "Profilime Git" button, and "Çıkış Yap" button. If logged out, shows email/password login form and "Üye Ol / Bültene Katıl" trigger.
- **Mobile:**
  - Inside [`HeaderMobileMenuOverlay.tsx`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/src/components/HeaderMobileMenuOverlay.tsx):
  - Renders `GİRİŞ YAP / ÜYE OL` (links to `/login`) or `PROFİLİM` (links to `/profile`).
- **Profile Icon:** No graphic avatar icon; uses clean typography (`GİRİŞ` / `PROFİL`) matching BİRİM minimalism.
- **Professional:** In the footer band (`HomeNewsletter`), the "PROFESYONEL ERİŞİM" tab allows architect applications.

### B. Shop Site Header (`birim-shop/src/components/layout/ShopHeader.tsx`)

`VERIFIED IN CODE`

- **Desktop & Mobile:** Contains ONLY `SiteLogo`, `ShopNav` (categories), Language Switcher, and `ShoppingBagIcon` (Cart Drawer).
- **Auth/Profile/Login in Shop Header:** `NOT FOUND` (Shop header has no user, login, or account controls).

---

## 4. AUTH STATE MANAGEMENT

`VERIFIED IN CODE` — Source: [`src/context/AuthContext.tsx`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/src/context/AuthContext.tsx)

- State is managed via React Context (`AuthContext` + `useState<User | null>`).
- **Initial Render:** Hydrates from `localStorage.getItem('birim_user')` for instantaneous UI render.
- **Authoritative Verification:** Immediately calls `getCurrentSessionUser()` -> `GET /api/auth/me` with `credentials: 'same-origin'`.
- **Sync:** If server confirms valid session, sets user in state and updates `birim_user` in `localStorage`. If server returns 401/unauthenticated, wipes `birim_user` and resets state to `null`.
- **Logout:** Dispatches `POST /api/auth/logout`, clears `localStorage.removeItem('birim_user')`, and resets state.

---

## 5. COOKIE & TOKEN MODEL

`VERIFIED IN CODE` — Source: [`lib/server/token.ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/lib/server/token.ts)

| Attribute       | Value                                    | Analysis                                               |
| :-------------- | :--------------------------------------- | :----------------------------------------------------- |
| **Cookie Name** | `birim_token`                            | Primary authentication cookie                          |
| **Token Type**  | Custom JWT (HMAC-SHA256)                 | Signed using `JWT_SECRET`                              |
| **Payload**     | `{ sub: userId, email, role, iat, exp }` | Contains authoritative `auth.users.id`                 |
| **HttpOnly**    | `true`                                   | Prevents JavaScript XSS access                         |
| **Secure**      | `true` in production                     | Transmitted only over HTTPS                            |
| **SameSite**    | `Lax`                                    | Sent on same-site & top-level cross-site navigations   |
| **Domain**      | **NOT SPECIFIED (Host-Only)**            | **CRITICAL: Cookie is restricted to `birim.com` only** |
| **Path**        | `/`                                      | Valid for all routes on the host                       |
| **Max-Age**     | `604800` (7 days)                        | Session duration                                       |

---

## 6. CROSS-SUBDOMAIN SESSION STATUS

`VERIFIED IN CODE`

- **Current Capability:** `NOT SUPPORTED`
- **Why Cross-Domain Session Fails Today:**
  1. `setAuthCookie` in [`lib/server/token.ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/lib/server/token.ts#L129-L136) omits `Domain=.birim.com`. The cookie is therefore Host-Only (`www.birim.com` or `birim.com`).
  2. `shop.birim.com` cannot read host-only cookies set by `birim.com`.
  3. `localStorage` is isolated by browser origin security (`birim.com` != `shop.birim.com`).
  4. `birim-shop` has no `AuthProvider` or session hydration logic on mount.

---

## 7. SUPABASE DATABASE USER TABLES

`VERIFIED IN SCHEMA` & `VERIFIED IN MIGRATION`

| Table Name                     | Schema File                                                      | Purpose                                                             |
| :----------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------ |
| `public.profiles`              | `scripts/supabase_schema.sql`                                    | 1-to-1 extension of `auth.users` (name, role, status, verification) |
| `public.favorites`             | `scripts/supabase_schema.sql`                                    | Product bookmarks / favorites                                       |
| `public.user_activities`       | `scripts/supabase_schema.sql`                                    | User analytics and dwell time                                       |
| `public.user_selections`       | `scripts/seckim_schema.sql`                                      | Saved items in "Seçtiklerim"                                        |
| `public.projects`              | `scripts/seckim_schema.sql`                                      | Custom architect projects & collections                             |
| `public.project_products`      | `scripts/seckim_schema.sql`                                      | Products linked to specific projects                                |
| `public.inquiries`             | `scripts/seckim_schema.sql`                                      | Project quote requests and lead submissions                         |
| `public.orders`                | `scripts/commerce_schema.sql`, `commerce_order_engine.sql`       | Authoritative commerce orders                                       |
| `public.order_items`           | `scripts/commerce_schema.sql`, `commerce_order_engine.sql`       | Immutable snapshots of order line items                             |
| `public.payment_transactions`  | `scripts/commerce_schema.sql`, `commerce_payment_foundation.sql` | Payment attempt records                                             |
| `public.refunds`               | `scripts/commerce_order_lifecycle_and_refunds.sql`               | Refund records                                                      |
| `public.commerce_order_events` | `scripts/commerce_order_lifecycle_and_refunds.sql`               | Order audit trail                                                   |
| `public.shop_analytics_events` | `supabase/migrations/20260917_shop_analytics_events.sql`         | Zero-PII analytics events                                           |

- `customers`: `NOT FOUND`
- `addresses` / `customer_addresses`: `NOT FOUND`
- `billing_profiles`: `NOT FOUND`
- `newsletter_subscribers`: `NOT FOUND` (Stored directly in `profiles`)

---

## 8. AUTH.USERS RELATIONSHIPS

`VERIFIED IN SCHEMA`

- `profiles.id` -> `REFERENCES auth.users(id) ON DELETE CASCADE`
- `favorites.user_id` -> `REFERENCES auth.users(id) ON DELETE CASCADE`
- `user_activities.user_id` -> `REFERENCES auth.users(id) ON DELETE CASCADE`
- `user_selections.user_id` -> `REFERENCES auth.users(id) ON DELETE CASCADE`
- `projects.user_id` -> `REFERENCES auth.users(id) ON DELETE CASCADE`
- `inquiries.user_id` -> `REFERENCES auth.users(id) ON DELETE SET NULL`
- `orders.user_id` -> `REFERENCES auth.users(id) ON DELETE SET NULL`

---

## 9. PROFILES TABLE SCHEMA

`VERIFIED IN SCHEMA` — Source: [`scripts/supabase_schema.sql`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/scripts/supabase_schema.sql#L7-L22)

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'architect', 'admin')),
  company TEXT,
  profession TEXT,
  phone TEXT,
  tax_id TEXT,
  architect_verification_status TEXT DEFAULT 'none' CHECK (architect_verification_status IN ('none', 'pending', 'approved', 'rejected')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 10 & 11. PROFESSIONAL MEMBERSHIP & STATUS ENUM

`VERIFIED IN CODE` & `VERIFIED IN SCHEMA`

- **Application Forms:**
  1. Footer `HomeNewsletter` ("PROFESYONEL ERİŞİM" tab)
  2. Register form on `/login` (Role: "Mimar / İç Mimar")
- **Approval Workflow:**
  - Status set to `'pending'` on registration.
  - Verification email dispatched to user.
  - Studio Admin navigates to "Üye & Mimar Yönetimi" tool (`SupabaseUsersStudioView.tsx`).
  - Admin clicks "Onayla" -> calls `PATCH /api/admin/members` -> sets `architect_verification_status = 'approved'`.
- **Database Status Enum (`scripts/supabase_schema.sql`):**
  - `'none'` (Standard consumer)
  - `'pending'` (Application submitted, awaiting review)
  - `'approved'` (Verified architect)
  - `'rejected'` (Application declined)
- **TypeScript Status Enum (`src/types.ts`):**
  - `'not_requested'` | `'pending_verification'` | `'verified'` | `'rejected'`

---

## 12. PROFESSIONAL APPLICATION FLOW

```text
User Submits Application (HomeNewsletter / LoginPage)
       │
       ▼
API Endpoint: POST /api/auth/subscribe (or /api/auth/register)
       │
       ├─► Supabase Auth: auth.admin.createUser (email_confirm: false)
       ├─► Supabase DB: public.profiles.upsert (role='architect', status='pending')
       └─► Serverless Email Service: Dispatches verification link with SHA-256 token
       │
       ▼
User Clicks /verify-email?token=... -> POST /api/auth/verify -> profiles.is_verified = true
       │
       ▼
Sanity Studio "Üye & Mimar Yönetimi" -> Admin reviews professional credentials
       │
       ▼
Admin Approves -> PATCH /api/admin/members -> profiles.architect_verification_status = 'approved'
       │
       ▼
User logs in -> User object receives architectVerificationStatus = 'verified'
```

---

## 13, 14 & 15. PROTECTED CONTENT & DOWNLOAD AUTHORIZATION

`VERIFIED IN CODE` — Source: [`src/components/ProductExclusiveContentSection.tsx`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/src/components/ProductExclusiveContentSection.tsx)

- **Protected Content Types:** Technical Drawings (CAD, DWG, PDF), 3D Models (3DS, OBJ, BIM, GLTF), High-Res Images.
- **Download Authorization Model:** **`FRONTEND-ONLY CHECK / NO SERVER GATING`**
  - Lines 73–105: The `onClick` handler checks `if (!isLoggedIn) ... if (!isVerifiedArchitect) ...` and calls `e.preventDefault()`.
  - **Vulnerability / Architectural Gap:** The rendered HTML anchor tag `<a href={doc.url} download>` links directly to public Cloudflare R2 / Sanity CDN URLs (`https://assets.birim.com/...`).
  - Anyone inspecting the page source or querying Sanity directly can download all CAD/3D files without authentication.
- **Presigned URLs in `api/media/[action].ts`:** Used strictly for administrative _uploading_ to R2, not for gated client _downloads_.

---

## 16, 17 & 18. NEWSLETTER & CONSENT MODEL

`VERIFIED IN CODE`

- **Newsletter Forms:** Footer band (`HomeNewsletter.tsx`) + Mobile overlay drawer.
- **Backend Handler:** `POST /api/auth/subscribe` (lines 957–1023 of [`api/auth/[action].ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/api/auth/%5Baction%5D.ts#L957-L1023)).
- **Identity Storage:** Automatically creates an account in `auth.users` with `email_confirm: true` and sets `profiles.profession = 'Bülten Abonesi'`.
- **Newsletter != Account:** Currently, newsletter subscribers are stored as regular `auth.users` and `profiles` records without passwords. If they later register, `handleRegister` upgrades the row.
- **Consent Fields:** `NOT FOUND` in database schema (No `kvkk_consent_at`, `marketing_consent_at`, or `consent_ip` columns exist in `profiles`).

---

## 19, 20 & 21. SANITY CONTROL CENTER & SECURITY

`VERIFIED IN CODE`

- **Custom Tools in Sanity Studio (`birim-web`):**
  - `supabaseUsersTool` (`SupabaseUsersStudioView.tsx`) — Full member list, architect approvals, subscriber counts, user activity analytics.
  - `controlCenterTool` (`ControlCenterTool.tsx`) — Commercial revenue KPIs, orders, product health, product performance.
- **Studio -> Supabase Access Path:**
  - Sanity Studio **NEVER** connects directly to Supabase from the client bundle.
  - Studio calls serverless admin endpoints: `fetch('/api/admin/members', { credentials: 'include' })`.
  - The serverless function validates admin authorization via `birim_token` cookie (role === 'admin') or `x-admin-secret` header, then calls `getSafeSupabaseAdmin()`.
- **Service Role Safety:** `VERIFIED` — No Supabase Service Role Key or direct admin initialization exists in `birim-web` client assets.

---

## 22 & 23. CUSTOMER ADDRESS & BILLING MODEL

- **Customer Addresses:** `NO PERSISTENT CUSTOMER ADDRESS MODEL`
  - There is no `customer_addresses` table.
- **Billing Profiles:** `NO PERSISTENT CUSTOMER BILLING PROFILE MODEL`
  - There is no `customer_billing_profiles` table.
- **Current Storage:** Address and billing details exist strictly as transient state in checkout and immutable JSON snapshots in `public.orders`.

---

## 24 & 25. CHECKOUT DATA & LIFETIME

`VERIFIED IN CODE` — Source: [`birim-shop/src/pages/CheckoutPage.tsx`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/birim-shop/src/pages/CheckoutPage.tsx)

- **Data Collected:** `firstName`, `lastName`, `email`, `phone`, `address`, `apartment`, `city`, `postalCode`, `country`, `notes`, `paymentMethod`, `customerType`.
- **Data Lifetime:**
  - Held strictly in React component memory (`formData`).
  - Sent to serverless `POST /api/commerce/orders`.
  - **Zero PII in browser persistent storage:** Verified that checkout PII is never written to `localStorage`, `sessionStorage`, or URL query parameters.

---

## 26, 27, 28 & 29. ORDER MODEL, GUEST ORDERS & ORDER HISTORY

`VERIFIED IN CODE` & `VERIFIED IN SCHEMA`

- **Order Snapshots:**
  - `orders.shipping_address_snapshot` (JSONB)
  - `orders.billing_address_snapshot` (JSONB)
  - `order_items.product_name_snapshot`, `sku_snapshot`, `selected_options_snapshot`, `unit_price`, `total_price`.
- **Order -> User Link:**
  - `orders.user_id` (UUID references `auth.users(id)`).
  - Populated automatically if valid `birim_token` JWT is present on request; otherwise set to `NULL`.
- **Guest Orders:**
  - Authenticated via cryptographically signed HMAC token (`createGuestOrderToken` -> `x-guest-token`).
  - Held in memory via [`guestTokenStore.ts`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/birim-shop/src/services/commerce/guestTokenStore.ts).
  - Guest and authenticated orders reside in the same `public.orders` table.
- **Order History:**
  - Exists on main site: `/account/orders` ([`CommerceOrdersPage.tsx`](file:///C:/Users/ASUS/.gemini/antigravity/scratch/my-birim-react/src/pages/CommerceOrdersPage.tsx)).
  - Queries `GET /api/commerce/orders` -> filters `where user_id = auth.uid()`.
  - Does NOT exist on `birim-shop`.

---

## 30, 31, 32 & 33. IDENTITY & ACCOUNT INTEGRATION

`VERIFIED IN CODE`

- **Can Professional & Shop Customer share the same `auth.users.id` today?**
  - **Database Layer:** **YES**. Both link to `auth.users.id`.
  - **Current Runtime Obstacles:**
    1. Host-only cookie prevents cross-domain auth between `birim.com` and `shop.birim.com`.
    2. `birim-shop` lacks Supabase auth client and session state.
    3. Absence of persistent address and billing tables requires customers to re-type checkout info on every order.
- **Duplicate User Model Risk:** Low at table level (single `profiles` table), but newsletter auto-creation creates passwordless auth accounts that require special handling on later registration.

---

## 34 & 35. SHOP AUTH & API PROPAGATION

`VERIFIED IN CODE`

- **Shop Auth State:** **`SHOP CURRENTLY GUEST-FIRST / NO ACCOUNT SESSION`**
  - No `createClient`, `getSession`, or `onAuthStateChange` in `birim-shop`.
- **Shop -> Main API Auth:**
  - `birim-shop` sends `credentials: 'include'` on all `fetch` requests to `/api/commerce/*`.
  - However, because the cookie currently lacks `Domain=.birim.com`, the browser will not send `birim_token` across subdomains.

---

## 36, 37 & 38. API AUTHENTICATION MATRIX

`VERIFIED IN CODE`

| Client / Actor           | Target Endpoint                       | Auth Mechanism          | Credentials Sent               | Server Verification                               |
| :----------------------- | :------------------------------------ | :---------------------- | :----------------------------- | :------------------------------------------------ |
| **Customer / Architect** | `/api/auth/*`, `/api/commerce/orders` | Custom HMAC JWT         | `birim_token` cookie or Bearer | `verifyToken(token)` -> verifies `sub` & `role`   |
| **Guest Shopper**        | `/api/commerce/orders?orderId=...`    | Signed HMAC Token       | `x-guest-token` header         | `verifyGuestOrderToken(orderId, token)`           |
| **Admin User**           | `/api/admin/*`                        | Custom JWT (Admin role) | `birim_token` cookie           | `verifyToken(token)` -> checks `role === 'admin'` |
| **Admin Break-Glass**    | `/api/admin/*`                        | Pre-shared Secret       | `x-admin-secret` header        | `crypto.timingSafeEqual` with `ADMIN_SECRET`      |
| **Server Backend**       | Supabase PostgreSQL                   | Supabase Service Role   | Internal Node.js client        | Full DB access / RLS bypass for business logic    |

---

## 39 & 40. ROW LEVEL SECURITY (RLS) INVENTORY

`VERIFIED IN SCHEMA`

| Table                   | RLS Status | Policies Defined                                                            | Client Direct Access                                               |
| :---------------------- | :--------- | :-------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| `profiles`              | ENABLED    | Select own (`auth.uid() = id`), Update own, Public view approved architects | Read/Update own profile only (Privileged fields locked by trigger) |
| `favorites`             | ENABLED    | Select/Insert/Delete own (`auth.uid() = user_id`)                           | Full CRUD on own favorites                                         |
| `user_activities`       | ENABLED    | Select/Insert own (`auth.uid() = user_id`)                                  | Insert/Select own activity records                                 |
| `user_selections`       | ENABLED    | Select/Insert/Delete own (`auth.uid() = user_id`)                           | Full CRUD on own selections                                        |
| `projects`              | ENABLED    | Select own or public, Insert/Update/Delete own                              | Full CRUD on own projects                                          |
| `project_products`      | ENABLED    | Based on parent project access                                              | CRUD on own project products                                       |
| `inquiries`             | ENABLED    | Anyone can Insert (`WITH CHECK (true)`), Select own                         | Anonymous lead submission + user lookup                            |
| `orders`                | ENABLED    | Select own (`auth.uid() = user_id`). No direct Insert/Update/Delete         | Read-only for own orders; modifications serverless-only            |
| `order_items`           | ENABLED    | Select items belonging to user's orders                                     | Read-only for own order items                                      |
| `payment_transactions`  | ENABLED    | NO public/auth policies granted                                             | **Completely locked** (Serverless service role only)               |
| `refunds`               | ENABLED    | NO public/auth policies granted                                             | **Completely locked** (Serverless service role only)               |
| `commerce_order_events` | ENABLED    | NO public/auth policies granted                                             | **Completely locked** (Serverless service role only)               |
| `shop_analytics_events` | ENABLED    | NO public/auth policies granted                                             | **Completely locked** (Serverless service role only)               |

---

## 44. SOURCE OF TRUTH MATRIX

`VERIFIED IN ARCHITECTURE`

| Data Domain                 | Current Source of Truth                                               | Recommended Target Architecture                                                                             |
| :-------------------------- | :-------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| **Identity (`auth.users`)** | Supabase Auth (`auth.users`)                                          | Supabase Auth (`auth.users`)                                                                                |
| **Profile & User Meta**     | Supabase PostgreSQL (`public.profiles`)                               | Supabase PostgreSQL (`public.profiles`)                                                                     |
| **Professional Status**     | Supabase PostgreSQL (`public.profiles.architect_verification_status`) | Supabase PostgreSQL (`public.profiles.architect_verification_status`)                                       |
| **Newsletter Consent**      | Implicit in `public.profiles.profession = 'Bülten Abonesi'`           | Dedicated columns in `public.profiles` (`newsletter_subscribed`, `kvkk_consent_at`, `marketing_consent_at`) |
| **Shipping Addresses**      | Order Snapshots only in `public.orders`                               | `public.customer_addresses` (1-to-many with `auth.users`) + Order Snapshot                                  |
| **Billing Profiles**        | Order Snapshots only in `public.orders`                               | `public.customer_billing_profiles` (1-to-many with `auth.users`) + Order Snapshot                           |
| **Orders & Items**          | Supabase PostgreSQL (`public.orders`, `public.order_items`)           | Supabase PostgreSQL (`public.orders`, `public.order_items`)                                                 |
| **Product Access Rules**    | Sanity CMS (`exclusiveContent`, `accessRequirements`)                 | Sanity CMS (`accessRequirements`)                                                                           |
| **Catalog & Products**      | Sanity CMS (`products`, `categories`, `designers`)                    | Sanity CMS (`products`, `categories`, `designers`)                                                          |
| **Protected Media Files**   | Cloudflare R2 / Sanity Assets                                         | Cloudflare R2 (Accessed via signed download URLs or server download proxy)                                  |

---

## 48. MIGRATION INVENTORY

`VERIFIED IN MIGRATIONS & SCRIPTS`

### Applied / Existing Database Schemas

1. `scripts/supabase_schema.sql` — Profiles, favorites, user activities, profile triggers.
2. `scripts/seckim_schema.sql` — Selections, projects, project products, inquiries.
3. `scripts/commerce_schema.sql` — Orders, order items, payment transactions.
4. `scripts/commerce_order_engine.sql` — Atomic order creation RPC (`create_commerce_order_atomic`), scoped idempotency.
5. `scripts/commerce_payment_foundation.sql` — Payment transaction RPCs (`create_payment_transaction_atomic`, `resolve_payment_event_atomic`).
6. `scripts/commerce_order_lifecycle_and_refunds.sql` — Order cancellations (`cancel_commerce_order_atomic`), refunds (`process_order_refund_atomic`), order audit events.

### Pending / Unapplied Migrations

1. `supabase/migrations/20260917_shop_analytics_events.sql` — Zero-PII analytics events table.

---

## 49. IMPLEMENTATION RISK MATRIX

| Area                               | Risk Level | Rationale                                                                                                                             | Mitigation Strategy                                                                                                                                |
| :--------------------------------- | :--------: | :------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cross-Subdomain Auth**           |   `HIGH`   | Setting `Domain=.birim.com` affects cookie delivery across all environments; requires handling local dev (`localhost`) vs production. | Use dynamic cookie domain setting based on host environment (`isProd ? '.birim.com' : undefined`).                                                 |
| **Protected Downloads Gating**     |   `HIGH`   | Direct R2/Sanity CDN links currently allow bypassing auth. Switching requires signed URLs or server proxy.                            | Introduce `GET /api/media/download?assetId=...` that verifies `birim_token` and architect verification status before redirecting to signed R2 URL. |
| **Persistent Addresses & Billing** |  `MEDIUM`  | Introducing `customer_addresses` must preserve guest checkout simplicity and avoid schema conflicts.                                  | Design `customer_addresses` with optional user attachment; maintain immutable JSON snapshot on orders.                                             |
| **Guest Order Linking / Claiming** |  `MEDIUM`  | Linking a guest order to an account after registration could lead to unauthorized access if email ownership is not verified.          | Only link orders when user has completed email verification matching `customer_email`.                                                             |
| **Newsletter Upgrade Flow**        |   `LOW`    | Existing passwordless subscribers in `auth.users` must upgrade smoothly upon password registration.                                   | Retain existing `handleRegister` upgrade branch while adding explicit consent timestamps.                                                          |
| **Shop Header Account Dropdown**   |   `LOW`    | Purely frontend UI addition matching BİRİM minimalism.                                                                                | Reusable header account component responding to `useAuth()` session.                                                                               |

---

## 50. VERIFICATION SUMMARY MATRIX

- Supabase Client Configuration: `VERIFIED IN CODE`
- Server Supabase Admin: `VERIFIED IN CODE`
- Auth Routes: `VERIFIED IN CODE`
- Header UX: `VERIFIED IN CODE`
- Auth State Management: `VERIFIED IN CODE`
- Cookie & Token Structure: `VERIFIED IN CODE`
- Cross-Domain Session Status: `VERIFIED IN CODE` (Currently unsupported)
- User Tables & Schemas: `VERIFIED IN SCHEMA`
- RLS Policies: `VERIFIED IN SCHEMA`
- Professional Application & Approval: `VERIFIED IN CODE`
- Download Authorization: `VERIFIED IN CODE` (Frontend-only, no server gating)
- Newsletter Implementation: `VERIFIED IN CODE`
- Customer Address Model: `NOT FOUND` (Snapshot only)
- Billing Profile Model: `NOT FOUND` (Snapshot only)
- Zero-PII Compliance: `VERIFIED IN CODE`
