import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import React from 'react'
import {render, screen, waitFor, fireEvent} from '@testing-library/react'
import {MemoryRouter, Route, Routes} from 'react-router-dom'
import {AccountPage} from '../pages/AccountPage'
import * as accountApi from '../services/accountApi'
import {AuthContext} from '../context/AuthContext'
import type {
  CustomerProfileData,
  CustomerAddress,
  CustomerBillingProfile,
} from '../../lib/account/account-service'
import type {CustomerOrderSummary, OrderDetailResult} from '../../lib/commerce/order-types'

vi.mock('../hooks/useSEO', () => ({
  useSEO: vi.fn(),
  SEOProvider: ({children}: any) => children,
}))

const mockProfile: CustomerProfileData = {
  id: 'user-123',
  email: 'ahmet@birim.com',
  name: 'Ahmet Yılmaz',
  firstName: 'Ahmet',
  lastName: 'Yılmaz',
  company: 'Birim Tasarım',
  profession: 'Mimar',
  phone: '+905551112233',
  taxId: null,
  role: 'architect',
  architectVerificationStatus: 'approved',
  isVerified: true,
  newsletterSubscribed: true,
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-02T10:00:00Z',
}

const mockAddresses: CustomerAddress[] = [
  {
    id: 'addr-1',
    userId: 'user-123',
    label: 'Ofis Adresim',
    recipientName: 'Ahmet Yılmaz',
    phone: '+905551112233',
    addressLine1: 'Nispetiye Cad. No: 10',
    addressLine2: 'Kat 4',
    city: 'İstanbul',
    district: 'Beşiktaş',
    postalCode: '34340',
    country: 'Türkiye',
    isDefaultShipping: true,
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
  },
]

const mockBillingProfiles: CustomerBillingProfile[] = [
  {
    id: 'bill-1',
    userId: 'user-123',
    billingType: 'company',
    label: 'Şirket Faturası',
    fullName: null,
    companyName: 'Birim Mimarlık Ltd.',
    taxOffice: 'Beşiktaş VD',
    taxNumber: '1234567890',
    addressLine1: 'Nispetiye Cad. No: 10',
    addressLine2: null,
    city: 'İstanbul',
    district: 'Beşiktaş',
    postalCode: '34340',
    country: 'Türkiye',
    isDefault: true,
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
  },
]

const mockOrders: CustomerOrderSummary[] = [
  {
    id: 'ord-101',
    orderNumber: 'BRM-20260917-111111',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    currency: 'TRY',
    grandTotal: 50000,
    itemCount: 1,
    firstItemNameSnapshot: 'Gala Koltuk',
    firstItemSkuSnapshot: 'BRM-GAL-01',
    createdAt: '2026-09-17T10:00:00Z',
  },
]

const mockOrderDetail: OrderDetailResult = {
  id: 'ord-101',
  orderNumber: 'BRM-20260917-111111',
  status: 'CONFIRMED',
  paymentStatus: 'PAID',
  paymentProvider: 'MOCK',
  paymentTransactionId: 'mock-tx-123',
  currency: 'TRY',
  subtotal: 50000,
  discountTotal: 0,
  shippingTotal: 0,
  taxTotal: 10000,
  grandTotal: 50000,
  customerType: 'INDIVIDUAL',
  customerSnapshot: {
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    email: 'ahmet@birim.com',
    phone: '+905551112233',
  },
  shippingAddressSnapshot: {
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    addressLine1: 'Nispetiye Cad. No: 10',
    addressLine2: null,
    city: 'İstanbul',
    district: 'Beşiktaş',
    postalCode: '34340',
    country: 'Türkiye',
    phone: '+905551112233',
  },
  billingAddressSnapshot: {
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    addressLine1: 'Nispetiye Cad. No: 10',
    addressLine2: null,
    city: 'İstanbul',
    district: 'Beşiktaş',
    postalCode: '34340',
    country: 'Türkiye',
    phone: '+905551112233',
  },
  corporateBillingSnapshot: null,
  notes: null,
  createdAt: '2026-09-17T10:00:00Z',
  updatedAt: '2026-09-17T10:00:00Z',
  items: [
    {
      productId: 'prod-gala',
      variantId: null,
      productNameSnapshot: 'Gala Koltuk',
      skuSnapshot: 'BRM-GAL-01',
      selectedOptionsSnapshot: {kumas: 'Keten'},
      quantity: 1,
      unitPrice: 50000,
      totalPrice: 50000,
    },
  ],
}
describe('BİRİM Canonical Account Center UI (Phase 2B Tests)', () => {
  beforeEach(() => {
    vi.spyOn(accountApi, 'getAccountProfile').mockResolvedValue(mockProfile)
    vi.spyOn(accountApi, 'listAccountAddresses').mockResolvedValue(mockAddresses)
    vi.spyOn(accountApi, 'listAccountBillingProfiles').mockResolvedValue(mockBillingProfiles)
    vi.spyOn(accountApi, 'listAccountOrders').mockResolvedValue(mockOrders)
    vi.spyOn(accountApi, 'getAccountOrderDetail').mockResolvedValue(mockOrderDetail)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  function renderWithAuth(
    ui: React.ReactNode,
    authValue: {
      isLoggedIn: boolean
      user: any
      login: () => void
      logout: () => void
    },
    initialEntry = '/hesabim'
  ) {
    return render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/hesabim" element={ui} />
            <Route path="/login" element={<div>Login Page Mock</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    )
  }

  // 1. Auth States
  describe('Authentication States', () => {
    it('renders unauthenticated login state when user is not logged in without calling account APIs', () => {
      renderWithAuth(<AccountPage />, {
        isLoggedIn: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
      })

      expect(screen.getByRole('heading', {name: /Giriş Yapın/i})).toBeInTheDocument()
      expect(screen.getByText(/Giriş Yap \/ Üye Ol/i)).toBeInTheDocument()
      expect(accountApi.getAccountProfile).not.toHaveBeenCalled()
      expect(accountApi.listAccountAddresses).not.toHaveBeenCalled()
    })

    it('renders authenticated account center with overview when logged in', async () => {
      renderWithAuth(<AccountPage />, {
        isLoggedIn: true,
        user: {name: 'Ahmet Yılmaz', email: 'ahmet@birim.com', _id: 'user-123'},
        login: vi.fn(),
        logout: vi.fn(),
      })

      await waitFor(() => {
        expect(screen.getByText(/Hoş Geldiniz, Ahmet Yılmaz/i)).toBeInTheDocument()
      })
      expect(screen.getByText(/Genel Bakış/i)).toBeInTheDocument()
      expect(screen.getByText(/Profil Bilgilerim/i)).toBeInTheDocument()
      expect(screen.getByText(/Teslimat Adreslerim/i)).toBeInTheDocument()
    })
  })

  // 2. Profile Section & Mutability Allowlist Safety
  describe('Profile Operations & Mutability Safety', () => {
    it('renders profile section with read-only email and editable fields', async () => {
      renderWithAuth(
        <AccountPage />,
        {
          isLoggedIn: true,
          user: {name: 'Ahmet Yılmaz', email: 'ahmet@birim.com', _id: 'user-123'},
          login: vi.fn(),
          logout: vi.fn(),
        },
        '/hesabim?tab=profile'
      )

      await waitFor(() => {
        expect(screen.getByText(/Profil Bilgilerim/i)).toBeInTheDocument()
      })
      expect(screen.getByText('ahmet@birim.com')).toBeInTheDocument()
      expect(screen.getByText('Birim Tasarım')).toBeInTheDocument()
    })

    it('submits strictly allowed fields and rejects forbidden fields on profile update', async () => {
      const updateSpy = vi.spyOn(accountApi, 'updateAccountProfile').mockResolvedValue({
        ...mockProfile,
        name: 'Ahmet Can Yılmaz',
      })

      renderWithAuth(
        <AccountPage />,
        {
          isLoggedIn: true,
          user: {name: 'Ahmet Yılmaz', email: 'ahmet@birim.com', _id: 'user-123'},
          login: vi.fn(),
          logout: vi.fn(),
        },
        '/hesabim?tab=profile'
      )

      await waitFor(() => {
        expect(screen.getByRole('button', {name: /Düzenle/i})).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', {name: /Düzenle/i}))

      const nameInput = screen.getByLabelText(/Ad Soyad/i)
      fireEvent.change(nameInput, {target: {value: 'Ahmet Can Yılmaz'}})

      fireEvent.click(screen.getByRole('button', {name: /Değişiklikleri Kaydet/i}))

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith({
          name: 'Ahmet Can Yılmaz',
          phone: '+905551112233',
          company: 'Birim Tasarım',
          profession: 'Mimar',
        })
      })

      // Verify forbidden fields were NOT included in the payload
      const sentPayload = updateSpy.mock.calls[0][0] as any
      expect(sentPayload.user_id).toBeUndefined()
      expect(sentPayload.role).toBeUndefined()
      expect(sentPayload.architect_verification_status).toBeUndefined()
      expect(sentPayload.email).toBeUndefined()
      expect(sentPayload.first_name).toBeUndefined()
      expect(sentPayload.last_name).toBeUndefined()
      expect(sentPayload.tax_id).toBeUndefined()
    })

    it('renders professional section with read-only fields and no CAD/BIM or quote actions', async () => {
      renderWithAuth(
        <AccountPage />,
        {
          isLoggedIn: true,
          user: {name: 'Ahmet Yılmaz', email: 'ahmet@birim.com', _id: 'user-123'},
          login: vi.fn(),
          logout: vi.fn(),
        },
        '/hesabim?tab=professional'
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', {name: /Profesyonel Hesabım/i})).toBeInTheDocument()
      })
      expect(screen.getByText(/Doğrulandı \(Aktif\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Mimar \/ Profesyonel/i)).toBeInTheDocument()
      expect(screen.getAllByText('Birim Tasarım').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Mimar').length).toBeGreaterThan(0)

      // Ensure deferred CAD/BIM and Quote tool cards are NOT rendered
      expect(screen.queryByText(/CAD \/ BIM İndirmeleri/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Proje Teklif Altyapısı/i)).not.toBeInTheDocument()
    })
  })

  // 3. Delivery Addresses
  describe('Address Operations', () => {
    it('renders address list and default indicator', async () => {
      renderWithAuth(
        <AccountPage />,
        {
          isLoggedIn: true,
          user: {name: 'Ahmet Yılmaz', email: 'ahmet@birim.com', _id: 'user-123'},
          login: vi.fn(),
          logout: vi.fn(),
        },
        '/hesabim?tab=addresses'
      )

      await waitFor(() => {
        expect(screen.getByText('Ofis Adresim')).toBeInTheDocument()
      })
      expect(screen.getByText('Nispetiye Cad. No: 10, Kat 4')).toBeInTheDocument()
      expect(screen.getByText('Varsayılan')).toBeInTheDocument()
    })

    it('triggers create address modal and saves address', async () => {
      const createSpy = vi.spyOn(accountApi, 'createAccountAddress').mockResolvedValue({
        id: 'addr-2',
        userId: 'user-123',
        label: 'Ev Adresim',
        recipientName: 'Ahmet Yılmaz',
        phone: '+905551112233',
        addressLine1: 'Bağdat Cad. No: 20',
        addressLine2: null,
        city: 'İstanbul',
        district: 'Kadıköy',
        postalCode: '34710',
        country: 'Türkiye',
        isDefaultShipping: false,
        createdAt: '2026-09-17T12:00:00Z',
        updatedAt: '2026-09-17T12:00:00Z',
      })

      renderWithAuth(
        <AccountPage />,
        {
          isLoggedIn: true,
          user: {name: 'Ahmet Yılmaz', email: 'ahmet@birim.com', _id: 'user-123'},
          login: vi.fn(),
          logout: vi.fn(),
        },
        '/hesabim?tab=addresses'
      )

      await waitFor(() => {
        expect(screen.getByRole('button', {name: /Yeni Adres Ekle/i})).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', {name: /Yeni Adres Ekle/i}))

      expect(screen.getByText(/Yeni Teslimat Adresi/i)).toBeInTheDocument()
      fireEvent.change(screen.getByPlaceholderText(/Örn: Ev, Ofis/i), {
        target: {value: 'Ev Adresim'},
      })
      fireEvent.change(screen.getByPlaceholderText(/Cadde, mahalle/i), {
        target: {value: 'Bağdat Cad. No: 20'},
      })
      fireEvent.change(screen.getByPlaceholderText(/Kadıköy/i), {target: {value: 'Kadıköy'}})

      fireEvent.click(screen.getByRole('button', {name: /^Kaydet$/i}))

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalled()
      })
    })
  })

  // 4. Billing Profiles & Tax Number Masking
  describe('Billing Profile Operations & Masking', () => {
    it('masks corporate tax number on display', async () => {
      renderWithAuth(
        <AccountPage />,
        {
          isLoggedIn: true,
          user: {name: 'Ahmet Yılmaz', email: 'ahmet@birim.com', _id: 'user-123'},
          login: vi.fn(),
          logout: vi.fn(),
        },
        '/hesabim?tab=billing'
      )

      await waitFor(() => {
        expect(screen.getByText('Şirket Faturası')).toBeInTheDocument()
      })
      expect(screen.getByText(/VKN: \*\*\*\*\*\*7890/i)).toBeInTheDocument()
    })
  })

  // 5. Order History & Detail Snapshots
  describe('Orders History & Detail View', () => {
    it('renders order list and opens detail modal with snapshot data', async () => {
      renderWithAuth(
        <AccountPage />,
        {
          isLoggedIn: true,
          user: {name: 'Ahmet Yılmaz', email: 'ahmet@birim.com', _id: 'user-123'},
          login: vi.fn(),
          logout: vi.fn(),
        },
        '/hesabim?tab=orders'
      )

      await waitFor(() => {
        expect(screen.getByText('BRM-20260917-111111')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', {name: /Detay/i}))

      await waitFor(() => {
        expect(screen.getByText(/Sipariş Detayı/i)).toBeInTheDocument()
      })
      expect(screen.getAllByText('Gala Koltuk').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/SKU: BRM-GAL-01/i).length).toBeGreaterThan(0)
    })
  })

  // 6. Partial Failure Isolation
  describe('API Partial Failure Isolation', () => {
    it('renders profile and addresses even when orders API fails', async () => {
      vi.spyOn(accountApi, 'listAccountOrders').mockRejectedValue(
        new Error('Sipariş servisi geçici olarak kapalı.')
      )

      renderWithAuth(
        <AccountPage />,
        {
          isLoggedIn: true,
          user: {name: 'Ahmet Yılmaz', email: 'ahmet@birim.com', _id: 'user-123'},
          login: vi.fn(),
          logout: vi.fn(),
        },
        '/hesabim?tab=overview'
      )

      await waitFor(() => {
        expect(screen.getByText(/Hoş Geldiniz/i)).toBeInTheDocument()
      })
      expect(screen.getByText('Teslimat Adresleri')).toBeInTheDocument()
    })
  })

  // 7. Client PII Zero Storage Safety
  describe('PII Zero Storage Safety', () => {
    it('does not store address or billing PII in localStorage or sessionStorage', async () => {
      renderWithAuth(
        <AccountPage />,
        {
          isLoggedIn: true,
          user: {name: 'Ahmet Yılmaz', email: 'ahmet@birim.com', _id: 'user-123'},
          login: vi.fn(),
          logout: vi.fn(),
        },
        '/hesabim?tab=addresses'
      )

      await waitFor(() => {
        expect(screen.getByText('Ofis Adresim')).toBeInTheDocument()
      })

      expect(localStorage.getItem('customer_addresses')).toBeNull()
      expect(localStorage.getItem('customer_billing')).toBeNull()
      expect(sessionStorage.getItem('customer_addresses')).toBeNull()
      expect(sessionStorage.getItem('customer_billing')).toBeNull()
    })
  })
})
