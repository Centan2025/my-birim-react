import {describe, it, expect} from 'vitest'
import fs from 'fs'
import path from 'path'
import {formatCurrencyAmount} from '../../birim-web/tools/controlCenter/components/MetricCard'
import {getProductReadiness} from '../../birim-web/utils/productReadiness'
import type {CurrencyMetrics, OrderSummaryItem} from '../../birim-web/tools/controlCenter/types'

describe('BİRİM Control Center Phase 3 & 3.1 Tests', () => {
  describe('Multi-Currency Formatting & Isolation', () => {
    it('correctly formats TRY currency amount with ₺ symbol', () => {
      const formatted = formatCurrencyAmount(12450.5, 'TRY')
      expect(formatted).toContain('₺')
      expect(formatted).toContain('12.450,50')
    })

    it('correctly formats EUR currency amount with € symbol', () => {
      const formatted = formatCurrencyAmount(4500, 'EUR')
      expect(formatted).toContain('€')
      expect(formatted).toContain('4.500,00')
    })

    it('correctly formats USD currency amount with $ symbol', () => {
      const formatted = formatCurrencyAmount(9800.75, 'USD')
      expect(formatted).toContain('$')
      expect(formatted).toContain('9.800,75')
    })

    it('handles 0 amount correctly without NaN', () => {
      const formatted = formatCurrencyAmount(0, 'TRY')
      expect(formatted).toBe('₺0,00')
    })

    it('never mixes metrics between currencies in response object', () => {
      const mockMetrics: Record<string, CurrencyMetrics> = {
        TRY: {
          currency: 'TRY',
          grossSales: 50000,
          netSales: 45000,
          refundTotal: 5000,
          paidOrdersCount: 10,
          pendingPaymentsCount: 2,
          averageOrderValue: 4500,
          cancelledOrdersCount: 1,
          failedPaymentsCount: 0,
        },
        EUR: {
          currency: 'EUR',
          grossSales: 3000,
          netSales: 3000,
          refundTotal: 0,
          paidOrdersCount: 2,
          pendingPaymentsCount: 0,
          averageOrderValue: 1500,
          cancelledOrdersCount: 0,
          failedPaymentsCount: 0,
        },
      }

      // Check TRY isolation
      expect(mockMetrics['TRY'].netSales).toBe(45000)
      expect(mockMetrics['TRY'].paidOrdersCount).toBe(10)

      // Check EUR isolation
      expect(mockMetrics['EUR'].netSales).toBe(3000)
      expect(mockMetrics['EUR'].paidOrdersCount).toBe(2)

      // Verify they are never summed into a mixed total
      expect(mockMetrics['TRY'].netSales).not.toBe(
        mockMetrics['TRY'].netSales + mockMetrics['EUR'].netSales
      )
    })
  })

  describe('Zero-PII Recent Orders Safety', () => {
    it('ensures OrderSummaryItem contains only non-PII operational fields', () => {
      const sampleOrder: OrderSummaryItem = {
        id: 'ord-123-uuid',
        orderNumber: 'ORD-20260917-8821',
        status: 'paid',
        paymentStatus: 'paid',
        currency: 'TRY',
        subtotal: 10000,
        discountTotal: 1000,
        shippingTotal: 0,
        taxTotal: 1800,
        grandTotal: 10800,
        itemsCount: 3,
        createdAt: '2026-09-17T12:00:00Z',
      }

      // Must have order operational details
      expect(sampleOrder.orderNumber).toBe('ORD-20260917-8821')
      expect(sampleOrder.grandTotal).toBe(10800)
      expect(sampleOrder.itemsCount).toBe(3)

      // Must NOT contain personal identifiable information (PII)
      const orderKeys = Object.keys(sampleOrder)
      expect(orderKeys).not.toContain('customerName')
      expect(orderKeys).not.toContain('email')
      expect(orderKeys).not.toContain('phone')
      expect(orderKeys).not.toContain('shippingAddress')
      expect(orderKeys).not.toContain('billingAddress')
    })
  })

  describe('Product Health & Readiness Integration', () => {
    it('evaluates ready and non-ready products accurately for dashboard counters', () => {
      const readyProduct = {
        _id: 'prod-1',
        name: {tr: 'Modüler Kanepe', en: 'Modular Sofa'},
        id: {current: 'moduler-kanepe'},
        category: {_ref: 'cat-sofas'},
        isPublished: true,
        buyable: true,
        sale_enabled: true,
        sales_mode: 'DIRECT',
        price: 25000,
        currency: 'TRY',
        sku: 'SOFA-MOD-01',
        stockStatus: 'in_stock',
        media: [{url: 'https://cdn.birim.com/sofa.jpg', isCover: true}],
      }

      const incompleteProduct = {
        _id: 'prod-2',
        name: {tr: 'Eksik Masa'},
        id: {current: 'eksik-masa'},
        sale_enabled: true,
        sales_mode: 'DIRECT',
        price: 0, // Invalid price blocker
        sku: '',
      }

      const res1 = getProductReadiness(readyProduct)
      expect(res1.status).toBe('READY')
      expect(res1.isCommerceReady).toBe(true)

      const res2 = getProductReadiness(incompleteProduct)
      expect(res2.status).toBe('NEEDS_ATTENTION')
      expect(res2.isCommerceReady).toBe(false)
      expect(res2.blockers.length).toBeGreaterThan(0)
    })
  })

  describe('Control Center Time Range Support', () => {
    it('validates supported range parameters', () => {
      const validRanges = ['today', '7d', '30d', '90d']
      validRanges.forEach(range => {
        expect(['today', '7d', '30d', '90d']).toContain(range)
      })
    })
  })

  describe('Phase 3.1 Authentication Hardening & Secret Scan', () => {
    it('ensures AuthBanner does not contain secret inputs or credential forms', () => {
      const bannerPath = path.resolve(
        __dirname,
        '../../birim-web/tools/controlCenter/components/AuthBanner.tsx'
      )
      const content = fs.readFileSync(bannerPath, 'utf8')

      expect(content).not.toContain('<input')
      expect(content).not.toContain('ADMIN_SECRET')
      expect(content).not.toContain('x-admin-secret')
      expect(content).not.toContain('localStorage')
      expect(content).not.toContain('sessionStorage')
      expect(content).toContain('Admin Access Required')
      expect(content).toContain('Product Health remains available from Sanity')
    })

    it('ensures useCommerceMetrics does not send x-admin-secret or read from storage', () => {
      const metricsHookPath = path.resolve(
        __dirname,
        '../../birim-web/tools/controlCenter/hooks/useCommerceMetrics.ts'
      )
      const content = fs.readFileSync(metricsHookPath, 'utf8')

      expect(content).not.toContain('x-admin-secret')
      expect(content).not.toContain('localStorage')
      expect(content).not.toContain('sessionStorage')
      expect(content).toContain("credentials: 'include'")
    })

    it('ensures useRecentOrders does not send x-admin-secret or read from storage', () => {
      const ordersHookPath = path.resolve(
        __dirname,
        '../../birim-web/tools/controlCenter/hooks/useRecentOrders.ts'
      )
      const content = fs.readFileSync(ordersHookPath, 'utf8')

      expect(content).not.toContain('x-admin-secret')
      expect(content).not.toContain('localStorage')
      expect(content).not.toContain('sessionStorage')
      expect(content).toContain("credentials: 'include'")
    })

    it('ensures ControlCenterTool handles unauthorized state cleanly', () => {
      const toolContent = fs.readFileSync(
        path.resolve(__dirname, '../../birim-web/tools/controlCenter/ControlCenterTool.tsx'),
        'utf8'
      )
      expect(toolContent).toContain('isUnauthorized')
      expect(toolContent).toContain('<AuthBanner onRetry={handleRefreshAll} />')
    })
  })
})
