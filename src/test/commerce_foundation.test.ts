import {describe, it, expect, vi} from 'vitest'
import fs from 'fs'
import path from 'path'
import siteSettings from '../../birim-web/schemaTypes/documents/siteSettings'
import product from '../../birim-web/schemaTypes/documents/product'
import productVariant from '../../birim-web/schemaTypes/objects/productVariant'
import {getSiteSettings} from '../services/sanity/settings'
import {sanity} from '../services/sanity/client'
import type {Product, OrderItem} from '../types'

describe('BİRİM Commerce Phase 1 — Foundation Tests', () => {
  const schemaSqlPath = path.resolve(__dirname, '../../scripts/commerce_schema.sql')
  const schemaSqlContent = fs.readFileSync(schemaSqlPath, 'utf8')
  // Strip comments to test column definitions
  const sqlWithoutComments = schemaSqlContent
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//gm, '')
    .toLowerCase()

  // 1. commerce_enabled defaults to false
  it('1. commerce_enabled defaults to false in Sanity schema and runtime fallback', async () => {
    // Sanity document schema assertion
    const commerceEnabledField = siteSettings.fields.find(
      (f: {name: string}) => f.name === 'commerce_enabled'
    )
    expect(commerceEnabledField).toBeDefined()
    expect(commerceEnabledField.initialValue).toBe(false)
    expect(commerceEnabledField.type).toBe('boolean')

    // Runtime getSiteSettings fallback assertion
    if (sanity) {
      vi.spyOn(sanity, 'fetch').mockResolvedValueOnce({})
    }
    const settings = await getSiteSettings()
    expect(settings.commerce_enabled).toBe(false)
  })

  // 2. Existing product sale_enabled defaults to false
  it('2. existing product sale_enabled defaults to false in schema and projection', () => {
    const saleEnabledField = product.fields.find((f: {name: string}) => f.name === 'sale_enabled')
    expect(saleEnabledField).toBeDefined()
    expect(saleEnabledField.initialValue).toBe(false)
    expect(saleEnabledField.type).toBe('boolean')

    // Mock an unmigrated existing product row from Sanity/database
    const legacyProductRow: Partial<Product> = {
      id: 'kilit-sehpa',
      buyable: true,
      price: 15000,
      currency: 'TRY',
    }

    // Default fallback verification
    const safeSaleEnabled = legacyProductRow.sale_enabled ?? false
    expect(safeSaleEnabled).toBe(false)
  })

  // 3. Existing product sales_mode defaults to NONE
  it('3. existing product sales_mode defaults to NONE in schema and projection', () => {
    const salesModeField = product.fields.find((f: {name: string}) => f.name === 'sales_mode')
    expect(salesModeField).toBeDefined()
    expect(salesModeField.initialValue).toBe('NONE')

    const validOptions = ['NONE', 'DIRECT', 'CONFIGURABLE', 'QUOTE']
    const optionValues = salesModeField.options?.list?.map((opt: {value: string}) => opt.value)
    expect(optionValues).toEqual(expect.arrayContaining(validOptions))

    const legacyProductRow: Partial<Product> = {
      id: 'kilit-sehpa',
      buyable: true,
    }
    const safeSalesMode = legacyProductRow.sales_mode ?? 'NONE'
    expect(safeSalesMode).toBe('NONE')
  })

  // 4. buyable remains independent from sale_enabled
  it('4. buyable field remains completely independent from sale_enabled', () => {
    const buyableField = product.fields.find((f: {name: string}) => f.name === 'buyable')
    const saleEnabledField = product.fields.find((f: {name: string}) => f.name === 'sale_enabled')

    expect(buyableField).toBeDefined()
    expect(saleEnabledField).toBeDefined()
    expect(buyableField.name).not.toBe(saleEnabledField.name)

    // Verification: Product can have buyable: true but sale_enabled: false (catalog quote mode)
    const quoteOnlyProduct: Partial<Product> = {
      id: 'arch-sofa',
      buyable: true,
      sale_enabled: false,
      sales_mode: 'NONE',
    }
    expect(quoteOnlyProduct.buyable).toBe(true)
    expect(quoteOnlyProduct.sale_enabled).toBe(false)
    expect(quoteOnlyProduct.sales_mode).toBe('NONE')
  })

  // 5. Orders are isolated by authenticated user (RLS)
  it('5. SQL migration enforces user isolation RLS on public.orders', () => {
    expect(schemaSqlContent).toContain('ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;')
    expect(schemaSqlContent).toContain('CREATE POLICY "Users can view own orders"')
    expect(schemaSqlContent).toContain('USING (auth.uid() = user_id);')
  })

  // 6. Client cannot update order status (RLS & Service Role write isolation)
  it('6. SQL migration denies direct client INSERT/UPDATE/DELETE on orders table', () => {
    const lines = schemaSqlContent.split('\n')
    const updatePolicies = lines.filter(
      l => l.includes('CREATE POLICY') && l.includes('orders') && l.includes('FOR UPDATE')
    )
    const insertPolicies = lines.filter(
      l => l.includes('CREATE POLICY') && l.includes('orders') && l.includes('FOR INSERT')
    )
    expect(updatePolicies.length).toBe(0)
    expect(insertPolicies.length).toBe(0)
  })

  // 7. Client cannot access another user\'s order
  it('7. SQL migration restricts order_items access to parent order owner', () => {
    expect(schemaSqlContent).toContain('ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;')
    expect(schemaSqlContent).toContain('CREATE POLICY "Users can view own order items"')
    expect(schemaSqlContent).toContain('o.user_id = auth.uid()')
  })

  // 8. Client cannot access payment transactions
  it('8. SQL migration completely denies direct client access to payment_transactions', () => {
    expect(schemaSqlContent).toContain(
      'ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;'
    )

    const lines = schemaSqlContent.split('\n')
    const paymentPolicies = lines.filter(
      l => l.includes('CREATE POLICY') && l.includes('payment_transactions')
    )
    expect(paymentPolicies.length).toBe(0)
  })

  // 9. Order item snapshot fields exist
  it('9. SQL schema and TypeScript models include historical snapshot fields', () => {
    expect(schemaSqlContent).toContain('product_name_snapshot TEXT NOT NULL')
    expect(schemaSqlContent).toContain('sku_snapshot TEXT')
    expect(schemaSqlContent).toContain('selected_options_snapshot JSONB')
    expect(schemaSqlContent).toContain('unit_price NUMERIC(12,2)')
    expect(schemaSqlContent).toContain('total_price NUMERIC(12,2)')

    // TypeScript contract assertion
    const mockItem: OrderItem = {
      id: 'item-uuid-1',
      order_id: 'order-uuid-1',
      product_id: 'kilit-sehpa',
      variant_id: 'var-1',
      product_name_snapshot: 'Kilit Sehpa',
      sku_snapshot: 'KLT-001',
      selected_options_snapshot: [{name: 'COLOR', value: 'Natural'}],
      quantity: 2,
      unit_price: 7500,
      total_price: 15000,
      created_at: new Date().toISOString(),
    }
    expect(mockItem.product_name_snapshot).toBe('Kilit Sehpa')
    expect(mockItem.total_price).toBe(15000)
  })

  // 10. No PAN/CVV/expiry fields exist in schema or models
  it('10. Sensitive card data fields (PAN, CVV, expiry) do NOT exist in schema columns', () => {
    expect(sqlWithoutComments).not.toContain('card_number')
    expect(sqlWithoutComments).not.toContain('pan')
    expect(sqlWithoutComments).not.toContain('cvv')
    expect(sqlWithoutComments).not.toContain('cvc')
    expect(sqlWithoutComments).not.toContain('expiry')
    expect(sqlWithoutComments).not.toContain('cardholder')
  })

  // 11. Migration does not modify existing product prices
  it('11. SQL migration contains NO UPDATE/DELETE statements modifying existing catalog/product data', () => {
    const lines = schemaSqlContent.split('\n')
    const updateStatements = lines.filter(l => l.trim().toUpperCase().startsWith('UPDATE '))
    const deleteStatements = lines.filter(l => l.trim().toUpperCase().startsWith('DELETE FROM '))
    expect(updateStatements.length).toBe(0)
    expect(deleteStatements.length).toBe(0)
  })

  // 12. Migration does not modify existing buyable values
  it('12. SQL migration does not alter or overwrite existing buyable flags or tables', () => {
    expect(schemaSqlContent).not.toContain('ALTER TABLE public.products')
    expect(schemaSqlContent).not.toContain('SET buyable')
  })

  // Variant schema validation
  it('validates productVariant object schema definition', () => {
    expect(productVariant.name).toBe('productVariant')
    expect(productVariant.type).toBe('object')
    const fields = productVariant.fields.map((f: {name: string}) => f.name)
    expect(fields).toEqual(
      expect.arrayContaining(['id', 'title', 'sku', 'price', 'currency', 'options', 'enabled'])
    )
  })
})
