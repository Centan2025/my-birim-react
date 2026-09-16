import React from 'react'
import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {render, screen, waitFor, fireEvent} from '@testing-library/react'
import {MemoryRouter, Route, Routes} from 'react-router-dom'
import {HelmetProvider} from 'react-helmet-async'
import {SEOProvider} from '../hooks/useSEO'
import {CommerceOrdersPage} from '../pages/CommerceOrdersPage'
import {CommerceOrderDetailPage} from '../pages/CommerceOrderDetailPage'
import * as AuthContextModule from '../context/AuthContext'
import * as OrdersServiceModule from '../services/commerce/orders'
import * as PaymentsServiceModule from '../services/commerce/payments'

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <HelmetProvider>
      <SEOProvider>{ui}</SEOProvider>
    </HelmetProvider>
  )
}

describe('Phase 6A.2 — Customer Order History & Detail Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('CommerceOrdersPage (/account/orders)', () => {
    it('renders login prompt if user is not authenticated', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        isLoggedIn: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
      })

      renderWithProviders(
        <MemoryRouter>
          <CommerceOrdersPage />
        </MemoryRouter>
      )

      expect(screen.getByText('GİRİŞ GEREKLİ')).toBeInTheDocument()
      expect(screen.getByText('Giriş Yap / Üye Ol')).toBeInTheDocument()
    })

    it('renders empty state when user has no orders', async () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        isLoggedIn: true,
        user: {
          _id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          isVerified: true,
          createdAt: new Date().toISOString(),
        },
        login: vi.fn(),
        logout: vi.fn(),
      })

      vi.spyOn(OrdersServiceModule, 'fetchCustomerOrdersClient').mockResolvedValue([])

      renderWithProviders(
        <MemoryRouter>
          <CommerceOrdersPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Henüz bir siparişiniz bulunmuyor')).toBeInTheDocument()
      })
      expect(screen.getByText('Koleksiyonu Keşfet')).toBeInTheDocument()
    })

    it('renders order list with correct badges and formatted prices when orders exist', async () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        isLoggedIn: true,
        user: {
          _id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          isVerified: true,
          createdAt: new Date().toISOString(),
        },
        login: vi.fn(),
        logout: vi.fn(),
      })

      vi.spyOn(OrdersServiceModule, 'fetchCustomerOrdersClient').mockResolvedValue([
        {
          id: 'ord-1',
          orderNumber: 'BRM-20260916-AAA111',
          status: 'PENDING_PAYMENT',
          paymentStatus: 'PENDING',
          currency: 'TRY',
          subtotal: 15000,
          discountTotal: 0,
          shippingTotal: 0,
          taxTotal: 0,
          grandTotal: 15000,
          itemsCount: 1,
          createdAt: '2026-09-16T10:00:00Z',
        },
        {
          id: 'ord-2',
          orderNumber: 'BRM-20260916-BBB222',
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          currency: 'TRY',
          subtotal: 45000,
          discountTotal: 0,
          shippingTotal: 0,
          taxTotal: 0,
          grandTotal: 45000,
          itemsCount: 2,
          createdAt: '2026-09-16T12:00:00Z',
        },
      ])

      renderWithProviders(
        <MemoryRouter>
          <CommerceOrdersPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('BRM-20260916-AAA111')).toBeInTheDocument()
        expect(screen.getByText('BRM-20260916-BBB222')).toBeInTheDocument()
      })

      expect(screen.getByText('Ödeme Bekliyor')).toBeInTheDocument()
      expect(screen.getByText('Ödeme Alındı')).toBeInTheDocument()
      expect(screen.getByText('Ödemeyi Tamamla')).toBeInTheDocument()
    })
  })

  describe('CommerceOrderDetailPage (/account/orders/:orderId)', () => {
    it('renders server-authoritative line items and totals breakdown', async () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        isLoggedIn: true,
        user: {
          _id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          isVerified: true,
          createdAt: new Date().toISOString(),
        },
        login: vi.fn(),
        logout: vi.fn(),
      })

      vi.spyOn(OrdersServiceModule, 'fetchCommerceOrderClient').mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'BRM-20260916-AAA111',
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        currency: 'TRY',
        subtotal: 45000,
        discountTotal: 0,
        shippingTotal: 0,
        taxTotal: 0,
        grandTotal: 45000,
        items: [
          {
            productId: 'prod-era',
            variantId: 'var-walnut-180',
            productName: 'Era Çalışma Masası',
            sku: 'BRM-ERA-WAL-180',
            selectedOptions: {Malzeme: 'Ceviz', Ölçü: '180x90'},
            quantity: 1,
            unitPrice: 45000,
            totalPrice: 45000,
          },
        ],
        createdAt: '2026-09-16T10:00:00Z',
      })

      renderWithProviders(
        <MemoryRouter initialEntries={['/account/orders/ord-1']}>
          <Routes>
            <Route path="/account/orders/:orderId" element={<CommerceOrderDetailPage />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getAllByText('BRM-20260916-AAA111').length).toBeGreaterThan(0)
        expect(screen.getByText('Era Çalışma Masası')).toBeInTheDocument()
        expect(screen.getByText('SKU: BRM-ERA-WAL-180')).toBeInTheDocument()
        expect(screen.getByText('Malzeme: Ceviz')).toBeInTheDocument()
        expect(screen.getByText('Ölçü: 180x90')).toBeInTheDocument()
      })

      expect(screen.getByText('Şimdi Öde')).toBeInTheDocument()
    })

    it('allows triggering mock payment retry for pending payment order', async () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        isLoggedIn: true,
        user: {
          _id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          isVerified: true,
          createdAt: new Date().toISOString(),
        },
        login: vi.fn(),
        logout: vi.fn(),
      })

      const fetchOrderMock = vi.spyOn(OrdersServiceModule, 'fetchCommerceOrderClient')
      fetchOrderMock.mockResolvedValueOnce({
        id: 'ord-1',
        orderNumber: 'BRM-20260916-AAA111',
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        currency: 'TRY',
        subtotal: 15000,
        discountTotal: 0,
        shippingTotal: 0,
        taxTotal: 0,
        grandTotal: 15000,
        items: [
          {
            productId: 'prod-gala',
            productName: 'Gala Sandalye',
            sku: 'BRM-GAL-001',
            quantity: 1,
            unitPrice: 15000,
            totalPrice: 15000,
          },
        ],
        createdAt: '2026-09-16T10:00:00Z',
      })

      const initiateMock = vi
        .spyOn(PaymentsServiceModule, 'initiateCommercePayment')
        .mockResolvedValue({
          id: 'tx-mock-123',
          status: 'PENDING',
          provider: 'mock',
          orderId: 'ord-1',
          orderNumber: 'BRM-20260916-AAA111',
          amount: 15000,
          amountMinor: 1500000,
          currency: 'TRY',
          createdAt: new Date().toISOString(),
        })

      const completeMock = vi
        .spyOn(PaymentsServiceModule, 'completeMockPaymentClient')
        .mockResolvedValue({
          success: true,
          status: 'PAID',
          orderId: 'ord-1',
        })

      renderWithProviders(
        <MemoryRouter initialEntries={['/account/orders/ord-1']}>
          <Routes>
            <Route path="/account/orders/:orderId" element={<CommerceOrderDetailPage />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Şimdi Öde')).toBeInTheDocument()
      })

      // Click "Şimdi Öde"
      fireEvent.click(screen.getByText('Şimdi Öde'))

      await waitFor(() => {
        expect(initiateMock).toHaveBeenCalledWith('ord-1')
        expect(screen.getByText('Ödeme Sağlayıcı Simülasyonu')).toBeInTheDocument()
      })

      // Click Simulate Success
      const successBtn = screen.getByText('✓ Başarılı Ödeme Simüle Et (SUCCESS)')
      fireEvent.click(successBtn)

      await waitFor(() => {
        expect(completeMock).toHaveBeenCalledWith('tx-mock-123', {
          status: 'SUCCESS',
          orderId: 'ord-1',
        })
      })
    })
  })
})
