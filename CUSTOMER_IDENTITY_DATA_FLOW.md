# BİRİM — CUSTOMER IDENTITY DATA FLOW

> **System Scope**: `birim.com` (`my-birim-react`), `shop.birim.com` (`birim-shop`), and `birim-web` (Sanity Studio).  
> **Purpose**: Visual data flows and sequence diagrams illustrating user authentication, professional membership lifecycle, newsletter subscription, protected asset gating, and unified commerce order processing.

---

## 1. Authentication & Session Hydration Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Browser)
    participant Web as birim.com (React Client)
    participant AuthAPI as /api/auth/login (Edge/Node API)
    participant SupaAuth as Supabase Auth (auth.users)
    participant SupaDB as Supabase DB (public.profiles)

    User->>Web: Submits Email & Password
    Web->>AuthAPI: POST /api/auth/login { email, password }
    AuthAPI->>SupaAuth: signInWithPassword(email, password)
    alt Invalid Credentials
        SupaAuth-->>AuthAPI: AuthError (Invalid login credentials)
        AuthAPI-->>Web: 401 Unauthorized { error: 'Invalid credentials' }
        Web-->>User: Display error toast
    else Valid Credentials
        SupaAuth-->>AuthAPI: User Object (UUID, email, metadata)
        AuthAPI->>SupaDB: SELECT * FROM profiles WHERE id = user.id
        SupaDB-->>AuthAPI: Profile row (role, architect_status, full_name, etc.)
        AuthAPI->>AuthAPI: createToken({ sub, email, role, status }) [HMAC-SHA256]
        AuthAPI-->>Web: 200 OK { user, profile }<br/>Set-Cookie: birim_token=...; HttpOnly; SameSite=Lax; Path=/
        Web->>Web: Store user in AuthContext / Zustand State
        Web-->>User: Redirect / Update Header (Profile Avatar, Professional Badge)
    end
```

### Cookie Scope & Cross-Subdomain Behavior

```text
CURRENT IMPLEMENTATION:
Set-Cookie: birim_token=<JWT>; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800
[Result: Host-Only cookie for birim.com — shop.birim.com CANNOT read this cookie]

TARGET IMPLEMENTATION:
Set-Cookie: birim_token=<JWT>; Domain=.birim.com; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
[Result: Shared cookie across birim.com, shop.birim.com, api.birim.com]
```

---

## 2. Professional Membership Application & Approval Flow

```mermaid
sequenceDiagram
    autonumber
    actor Arch as Architect / Designer
    actor Admin as BİRİM Operations (Admin)
    participant Web as birim.com (Mimar Portalı)
    participant API as /api/auth/register & /api/admin/members
    participant DB as Supabase DB (public.profiles)
    participant Studio as Sanity Studio (Üye & Mimar Yönetimi)

    Arch->>Web: Fills Professional Application (Chamber ID, Office, Portfolio URL)
    Web->>API: POST /api/auth/register { email, role: 'architect', chamber_no, company, ... }
    API->>DB: INSERT INTO auth.users + INSERT INTO profiles (role='architect', architect_verification_status='pending')
    API-->>Web: 200 OK (Registration Pending)
    Web-->>Arch: Confirmation message ("Hesabınız incelemeye alındı")

    Note over Admin,Studio: Verification Phase
    Admin->>Studio: Opens "Üye & Mimar Yönetimi" Dashboard
    Studio->>API: GET /api/admin/members (Protected by Studio Secret)
    API->>DB: SELECT * FROM profiles WHERE role='architect' ORDER BY created_at DESC
    DB-->>API: Architect records
    API-->>Studio: Display pending applications
    Admin->>Studio: Clicks "Onayla" (Approve)
    Studio->>API: PATCH /api/admin/members { userId, status: 'approved' }
    API->>DB: UPDATE profiles SET architect_verification_status = 'approved' WHERE id = userId
    DB-->>API: Updated
    API-->>Studio: 200 OK (Success)

    Note over Arch,Web: Next Login / Session Refresh
    Arch->>Web: Logs in
    Web->>DB: Fetch profile
    DB-->>Web: architect_verification_status = 'approved'
    Web-->>Arch: Unlocks "Mimar Özel Alanı" & CAD/BIM Download Badges
```

---

## 3. Newsletter Subscription & Account Upgrade Flow

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Anonymous Visitor
    participant Web as birim.com (Footer / Modal)
    participant NewsAPI as /api/newsletter/subscribe
    participant DB as Supabase DB (auth.users & profiles)

    Visitor->>Web: Enters email in Newsletter Signup
    Web->>NewsAPI: POST /api/newsletter/subscribe { email, source: 'footer_form' }
    NewsAPI->>DB: SELECT * FROM profiles WHERE email = email
    alt Email Already Registered (Full Account or Subscribed)
        DB-->>NewsAPI: Existing Record
        NewsAPI->>DB: UPDATE profiles SET newsletter_subscribed = true WHERE email = email
        NewsAPI-->>Web: 200 OK ("Bülten aboneliğiniz güncellendi.")
    else New Visitor
        NewsAPI->>DB: adminAuthClient.createUser({ email, password: randomSecurePassword() })
        NewsAPI->>DB: INSERT INTO profiles (id, email, profession='Bülten Abonesi', newsletter_subscribed=true)
        NewsAPI-->>Web: 200 OK ("Aboneliğiniz başarıyla tamamlandı.")
    end
    Web-->>Visitor: Success Feedback

    Note over Visitor,Web: Account Upgrade Phase (Later)
    Visitor->>Web: Navigates to Register / Set Password
    Web->>DB: Submits Registration with same email
    DB->>DB: Upgrades password, updates full_name, profession, role
    Web-->>Visitor: Account converted to full Active Customer
```

---

## 4. Protected Asset (CAD / 3D / BIM) Download Flow

### 4.1 Current Flow (Client-Side Check / No Server Gating)

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Logged in or Guest)
    participant UI as ProductExclusiveContentSection.tsx
    participant CDN as Cloudflare R2 / Sanity CDN

    User->>UI: Views Product Detail Page
    alt Client Auth State is Verified
        UI-->>User: Displays active Download Buttons (<a href="https://cdn.birim.com/cad/model.dwg" download>)
        User->>CDN: Direct GET request to public asset URL
        CDN-->>User: Serves DWG / 3DS / Revit file
    else Guest / Not Verified
        UI-->>User: Displays Lock Icon & "Üye Girişi Yapın" Modal Trigger
    end
    Note over User,CDN: VULNERABILITY: If an unauthenticated user knows the CDN URL, asset is downloaded directly without auth check.
```

### 4.2 Target Recommended Flow (Server-Gated Signed URLs)

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant UI as ProductPage
    participant AssetAPI as /api/assets/download?fileId=...
    participant Auth as Auth & Profile Guard
    participant Storage as Cloudflare R2 (Private Bucket)

    User->>UI: Clicks "Download 3D CAD (.dwg)"
    UI->>AssetAPI: GET /api/assets/download?fileId=chair-01-cad (Sends birim_token cookie)
    AssetAPI->>Auth: Validate JWT & check (role == 'architect' && status == 'approved')
    alt Not Authorized
        Auth-->>AssetAPI: Denied (403 Forbidden)
        AssetAPI-->>UI: 403 { error: 'Professional verification required' }
        UI-->>User: Show verification prompt modal
    else Authorized
        Auth-->>AssetAPI: Approved
        AssetAPI->>Storage: Generate Signed URL (HMAC-SHA256, Expire in 60s)
        Storage-->>AssetAPI: https://storage.birim.com/private/...?signature=xyz&expires=1710000000
        AssetAPI-->>UI: 302 Redirect to Signed URL (or JSON { downloadUrl })
        UI->>Storage: Fetch file via Signed URL
        Storage-->>User: Stream secure binary file
    end
```

---

## 5. Shop Guest Checkout Flow

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Guest Shopper
    participant Shop as shop.birim.com (Checkout UI)
    participant OrderAPI as /api/orders (Shop Serverless API)
    participant PayTR as PayTR Payment Gateway
    participant DB as Supabase DB (public.orders)

    Guest->>Shop: Adds items to Cart & fills Delivery/Billing form
    Shop->>OrderAPI: POST /api/orders { items, guest_email, shipping_address, billing_address }
    OrderAPI->>OrderAPI: Generate guestToken = HMAC_SHA256(order_id + secret)
    OrderAPI->>DB: INSERT INTO orders (user_id=NULL, guest_token_hash, status='pending_payment', ...)
    OrderAPI->>PayTR: Request Payment Iframe Token { merchant_oid, email, total }
    PayTR-->>OrderAPI: { token: 'paytr_iframe_token_xxx' }
    OrderAPI-->>Shop: 200 OK { token, guestToken, orderId }
    Shop->>Shop: Store guestToken in Memory (guestTokenStore)
    Shop->>PayTR: Render PayTR Iframe
    Guest->>PayTR: Completes 3D Secure Card Payment
    PayTR->>OrderAPI: POST /api/payment/callback (Webhook)
    OrderAPI->>DB: UPDATE orders SET status='paid', payment_status='success' WHERE id=merchant_oid
    OrderAPI-->>PayTR: "OK"
    PayTR-->>Shop: Redirect to /order/success?order_id=...
    Shop->>OrderAPI: GET /api/orders/order_id (Header: x-guest-token: guestToken)
    OrderAPI->>DB: SELECT * FROM orders WHERE id=order_id
    DB-->>OrderAPI: Order details
    OrderAPI-->>Shop: 200 OK (Order summary)
    Shop-->>Guest: Displays "Siparişiniz Alındı" summary
```

---

## 6. Authenticated Checkout Flow (Target Unified Model)

```mermaid
sequenceDiagram
    autonumber
    actor Member as Logged-In Customer
    participant Shop as shop.birim.com (Checkout UI)
    participant CustAPI as /api/customer/addresses
    participant OrderAPI as /api/orders
    participant DB as Supabase DB (public.orders, customer_addresses, customer_billing_profiles)

    Member->>Shop: Enters Checkout (Logged in with .birim.com session)
    Shop->>CustAPI: GET /api/customer/addresses (Cookie: birim_token)
    CustAPI->>DB: SELECT * FROM customer_addresses WHERE user_id = token.sub
    DB-->>CustAPI: List of saved addresses
    CustAPI-->>Shop: Return saved addresses & billing profiles
    Shop-->>Member: Pre-fills forms, allows 1-click select of default address
    Member->>Shop: Clicks "Siparişi Tamamla"
    Shop->>OrderAPI: POST /api/orders { items, selected_address_id, ... }
    OrderAPI->>DB: INSERT INTO orders (user_id = token.sub, shipping_snapshot, billing_snapshot, status='pending_payment')
    OrderAPI-->>Shop: Payment Token
    Member->>Shop: Completes Payment
    Note over Member,DB: Order is permanently linked to user_id (Visible in Customer Order History)
```

---

## 7. Customer Order History & Tracking Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Guest
    participant Portal as Account / Orders Page
    participant API as /api/orders/history
    participant DB as Supabase DB (public.orders)

    alt Authenticated Customer
        Customer->>Portal: Visits /hesabim/siparisler (or /account/orders)
        Portal->>API: GET /api/orders/history (Cookie: birim_token)
        API->>DB: SELECT * FROM orders WHERE user_id = token.sub ORDER BY created_at DESC
        DB-->>API: List of historical orders & tracking numbers
        API-->>Portal: 200 OK [orders]
        Portal-->>Customer: Renders interactive order list, statuses, invoice download buttons
    else Guest Tracking Flow
        Customer->>Portal: Visits /siparis-takip
        Customer->>Portal: Enters Order Number (e.g. BIR-2026-0089) + Email
        Portal->>API: POST /api/orders/track { order_number, email }
        API->>DB: SELECT * FROM orders WHERE order_number = ... AND guest_email = ...
        DB-->>API: Single order record
        API-->>Portal: 200 OK (Sanitized order status, cargo tracking URL)
        Portal-->>Customer: Renders live shipping status
    end
```

---

## 8. Logout & Session Termination Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant Web as birim.com / shop.birim.com
    participant AuthAPI as /api/auth/logout
    participant SupaAuth as Supabase Auth

    User->>Web: Clicks "Çıkış Yap" (Sign Out)
    Web->>AuthAPI: POST /api/auth/logout
    AuthAPI->>SupaAuth: signOut() [Invalidates server refresh token]
    AuthAPI-->>Web: Set-Cookie: birim_token=; Path=/; Domain=.birim.com; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT
    Web->>Web: Clear local AuthContext, cart cache, user state
    Web-->>User: Redirect to Home / Public view (Header resets to "Giriş Yap")
```

---

## 9. Security & Administrative Data Boundary Flow

```mermaid
graph TD
    subgraph Client_Layer["Client Applications (Browser)"]
        Web["birim.com<br/>(React / Tailwind)"]
        Shop["shop.birim.com<br/>(React / Shop App)"]
        Studio["birim-web<br/>(Sanity Studio v3)"]
    end

    subgraph Edge_API_Layer["Backend / Edge API Layer (Node / Cloudflare)"]
        AuthRoute["/api/auth/*<br/>(Public Anon Key)"]
        ShopRoute["/api/orders, /api/payment/*<br/>(Service Role Key)"]
        AdminRoute["/api/admin/members<br/>(Protected by Secret / Admin JWT)"]
        AssetRoute["/api/assets/download<br/>(Signed URL Generator)"]
    end

    subgraph Data_Storage["Data & Storage Infrastructure"]
        SupaAuth["Supabase Auth<br/>(auth.users)"]
        SupaDB["Supabase Postgres<br/>(public.profiles, orders, addresses)"]
        R2["Cloudflare R2<br/>(Private CAD/BIM / Public Images)"]
        SanityCloud["Sanity Content Lake<br/>(CMS Catalog Data Only)"]
    end

    Web --> AuthRoute
    Shop --> ShopRoute
    Studio --> AdminRoute
    Web --> AssetRoute

    AuthRoute --> SupaAuth
    AuthRoute --> SupaDB
    ShopRoute --> SupaDB
    AdminRoute --> SupaDB
    AssetRoute --> R2
    Studio -.->|CMS Content Only| SanityCloud
    Studio x-.-x|NO Direct DB / Service Key| SupaDB

    classDef secure fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef edge fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    classDef client fill:#fff3e0,stroke:#e65100,stroke-width:2px;

    class SupaAuth,SupaDB,R2,SanityCloud secure;
    class AuthRoute,ShopRoute,AdminRoute,AssetRoute edge;
    class Web,Shop,Studio client;
```
