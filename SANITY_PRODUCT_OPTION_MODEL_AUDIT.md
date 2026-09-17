# BİRİM SANITY — CATALOG OPTIONS → COMMERCE SELECTION AUDIT

**Audit Date:** 2026-09-17  
**Scope:** `birim-web` (Sanity Studio), `my-birim-react` (BİRİM.COM & Commerce Backend Platform), `birim-shop` (BİRİM SHOP Storefront)  
**Objective:** Thorough audit of existing Sanity schemas for dimensions, technical drawings, material groups, cartelas, colors/swatches, and product variants to design a zero-regression, non-destructive, additive commerce selection layer.

---

## 1. CURRENT PRODUCT SCHEMA INVENTORY

In `birim-web/schemaTypes/documents/product.tsx`, the `product` document currently contains:

```text
product (Document)
├── basicInfo (Fieldset)
│   ├── id (slug: mandatory)
│   ├── name (localizedString: mandatory)
│   ├── designers (array of reference -> designer)
│   ├── category (reference -> category: mandatory)
│   └── year (number)
├── publishing (Fieldset)
│   ├── isPublished (boolean)
│   ├── publishAt (datetime)
│   ├── sortOrder (number)
│   └── showHeroNavigation (boolean)
├── mediaGroup (Fieldset)
│   ├── media (array of productSimpleMediaItem, with isCover, R2 assets)
│   └── dimensionImages (array of productDimensionImage: technical drawings & measurement sheets)
├── bottomMediaPanelsGroup (Fieldset)
│   ├── showMediaPanels (boolean)
│   ├── mediaSectionTitle (localizedString)
│   ├── mediaSectionText (localizedPortableText)
│   └── bottomMedia (array of productPanelMediaItem)
├── details (Fieldset)
│   ├── description (localizedPortableText)
│   ├── materialSelections (array of productMaterialSelection -> group reference & selected swatches)
│   ├── showMaterials (boolean)
│   └── exclusiveContent (exclusiveContent: 3D models, technical drawings, exclusive images)
├── commerce (Fieldset)
│   ├── buyable (boolean: "E-Ticarette Satılabilir")
│   ├── sale_enabled (boolean: "Satış Aktif")
│   ├── sales_mode (string: NONE | DIRECT | CONFIGURABLE | QUOTE)
│   ├── price (number)
│   ├── currency (string: TRY | EUR | USD)
│   ├── sku (string)
│   ├── stockStatus (string: in_stock | out_of_stock | preorder)
│   └── variants (array of productVariant)
└── seoGroup (Fieldset)
    └── seo (seoFields)
```

---

## 2. CURRENT DIMENSION & TECHNICAL DRAWING MODEL

### Schema Structure (`shared.ts` -> `productDimensionImage`)

```typescript
export const productDimensionImage = defineType({
  name: 'productDimensionImage',
  title: 'Ölçü Görseli',
  type: 'object',
  fields: [
    {
      name: 'imageR2',
      title: 'Görsel (Tüm Cihazlar)',
      type: 'r2Asset',
      validation: Rule => Rule.required(),
    },
    {name: 'imageMobileR2', title: 'Görsel (Mobil)', type: 'r2Asset'},
    {name: 'imageDesktopR2', title: 'Görsel (Desktop)', type: 'r2Asset'},
    {name: 'title', title: 'Başlık', type: 'localizedString'},
  ],
})
```

### Analysis & Findings:

1. **Level:** `dimensionImages` is defined directly at the **product level** (`product.dimensionImages[]`).
2. **Usage:**
   - On BİRİM.COM (`ProductDimensions.tsx`), it renders responsive technical diagrams / dimension schemes with localized captions (e.g. "Genişlik: 240cm, Derinlik: 100cm, Yükseklik: 75cm").
   - In PDF generation (`pdfGenerator.ts`), each dimension image is printed with its title.
   - In Seçtiklerim (`seckim.ts`), dimension images serve as technical fallbacks.
3. **Data Characteristics:**
   - Each item in `dimensionImages` has an intrinsic Sanity `_key` and a localized `title` (e.g. `{ tr: "240 x 100 cm", en: "240 x 100 cm" }`).

---

## 3. CURRENT MATERIAL, CARTELA & SWATCH MODEL

### Schema Structure

1. **`materialGroup` (Document)** (`materialGroup.tsx`):
   - `title: localizedString` (e.g. "Kumaş", "Deri", "Metal", "Ahşap / Cila")
   - `books: array of materialSwatchBook` (Cartelas / Swatch Books)
     - `title: localizedString` (e.g. "Luna", "Terra", "Camira", "Kvadrat Remix")
     - `items: array of productMaterial` (Colors / Finishes)
       - `name: localizedString` (e.g. "Bej / Luna 01", "Antrasit / Luna 14")
       - `imageR2: r2Asset` (High-resolution material texture / swatch image)

2. **`productMaterialSelection` (Object in `product.materialSelections[]`)** (`shared.ts`):
   - `group: reference -> materialGroup`
   - `materials: array of productMaterial` (specific swatches selected for this product)
   - Managed via custom `MaterialSelectionInput.tsx` UI in Sanity Studio.

### Actual Hierarchy in Production:

```text
materialGroup (Doc: e.g. "Kumaş")
    └── materialSwatchBook (Kartela: e.g. "Luna")
            └── productMaterial (Swatch: e.g. "01 Bej", "14 Antrasit")
```

When attached to a `product`:

```text
product.materialSelections[]
    └── group (Reference to "Kumaş")
    └── materials[] (Selected subset of swatches with _key, name, imageR2)
```

---

## 4. CURRENT VARIANT MODEL & DUPLICATION AUDIT

### Schema Structure (`productVariant.ts`)

```typescript
export const productVariant = defineType({
  name: 'productVariant',
  title: 'Ürün Varyantı',
  type: 'object',
  fields: [
    {name: 'id', title: 'Varyant ID', type: 'string'},
    {name: 'title', title: 'Varyant Başlığı', type: 'localizedString'},
    {name: 'sku', title: 'Varyant SKU', type: 'string'},
    {name: 'price', title: 'Varyant Fiyatı', type: 'number'},
    {name: 'currency', title: 'Para Birimi', type: 'string', initialValue: 'TRY'},
    {
      name: 'options',
      title: 'Varyant Seçenekleri (Key/Value)',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'variantOption',
          fields: [
            {name: 'name', type: 'string'},
            {name: 'value', type: 'string'},
          ],
        },
      ],
    },
    {name: 'enabled', title: 'Varyant Aktif', type: 'boolean', initialValue: true},
  ],
})
```

### Duplication & Usability Audit:

1. Currently, options are entered as loose key/value pairs (`{name: 'COLOR', value: 'Beige'}`).
2. There is no automated tie between the variant options and the authoritative catalog swatches (`materialSelections`) or technical drawings (`dimensionImages`).
3. Editors had to manually type text that duplicated catalog swatch names and dimensions.
4. Price, SKU, currency, and enabled flag are already correctly located at the variant layer (authoritative commerce data).

---

## 5. DEPENDENCY INVENTORY

| System / Component                                          | Dependent Fields                                                             | Usage & Invariants                                                                                 |
| :---------------------------------------------------------- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| **BİRİM.COM PDP (`ProductDetailPage.tsx`)**                 | `dimensionImages`, `materialSelections`, `showMaterials`, `exclusiveContent` | Renders technical drawings carousel and material tabs. Must never be filtered by commerce toggles. |
| **BİRİM.COM Materials (`ProductMaterials.tsx`)**            | `materials`, `groupedMaterials`                                              | Renders interactive swatch viewer and book tabs.                                                   |
| **BİRİM.COM PDF Gen (`pdfGenerator.ts`)**                   | `dimensionImages`, `materials`                                               | Generates architectural cutsheets and product teardown PDFs.                                       |
| **BİRİM.COM Quote Cart (`ProductAddToCart.tsx`)**           | `buyable`, `materials`                                                       | Adds catalog items to inquiry cart (`birim_cart`).                                                 |
| **Shared Backend (`lib/commerce/sanityCommerceClient.ts`)** | `buyable`, `sale_enabled`, `sales_mode`, `price`, `currency`, `variants`     | Single roundtrip authoritative GROQ fetch for cart & checkout validation.                          |
| **BİRİM SHOP Storefront (`birim-shop`)**                    | `buyable`, `sale_enabled`, `sales_mode`, `price`, `currency`, `variants`     | Maps product details and variants for online purchase.                                             |

---

## 6. PROPOSED TARGET ARCHITECTURE (ADDITIVE & NON-DESTRUCTIVE)

```text
PRODUCT DOCUMENT (Sanity)
│
├── 1. CATALOG / DESIGN LAYER (Authoritative & Pure - BİRİM.COM)
│   ├── dimensionImages[] (Drawings, dimensions, sizes: _key, title, imageR2)
│   └── materialSelections[] (Material types, kartelas, swatches: group ref, materials[])
│
├── 2. COMMERCE SELECTION LAYER (Additive - Sanity Studio "# SHOP SATIŞ KONFİGÜRASYONU")
│   ├── buyable (E-Ticarette Satılabilir)
│   ├── sale_enabled (Satış Aktif)
│   ├── sales_mode (NONE | DIRECT | CONFIGURABLE | QUOTE)
│   │
│   ├── commerceOptions (Additive object / fields)
│   │   ├── selectedDimensions[] (Selected dimension image _keys / titles allowed for sale)
│   │   └── selectedMaterials[] (Selected swatch _keys / names allowed for sale)
│   │
│   └── variants[] (Sellable Variant Configurations)
│       ├── id (Unique variant identifier)
│       ├── title (Localized display title)
│       ├── sku (Authoritative variant SKU)
│       ├── price (Authoritative variant price)
│       ├── currency (Currency: TRY/EUR/USD)
│       ├── stockStatus (in_stock | out_of_stock | preorder)
│       ├── leadTimeWeeks (Optional production lead time)
│       ├── dimensionKey (Reference/_key to selected dimension)
│       ├── materialKey (Reference/_key to selected swatch)
│       ├── options[] (Key/value options for backward compatibility)
│       └── enabled (Active / Inactive toggle)
```

---

## 7. BACKWARD COMPATIBILITY & SAFETY GUARANTEE

1. **No Breaking Schema Renames:** All existing fields (`dimensionImages`, `materialSelections`, `buyable`, `sale_enabled`, `sales_mode`, `variants`, `price`, `currency`, `sku`, `stockStatus`) remain exactly as named with their exact data types.
2. **No Data Rewrites:** Existing products without the new commerce selection fields continue to render identically on BİRİM.COM and evaluate cleanly in commerce engines.
3. **No Cross-Product Duplication:** Swatch names and dimensions are referenced via catalog IDs/keys rather than detached duplicate text.
4. **Authoritative Commerce Isolation:** Stock, price, SKU, and lead time remain strictly within the commerce layer and do not pollute pure catalog swatch objects.
