import {describe, it, expect, beforeEach, vi} from 'vitest'
import {render, screen, waitFor, act} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import {BrowserRouter} from 'react-router-dom'
import {LoginPage} from '@/pages/LoginPage'
import * as cms from '@/services/cms'
import * as rateLimiter from '@/lib/rateLimiter'
import {SEOProvider} from '../hooks/useSEO'
import {HelmetProvider} from 'react-helmet-async'

// Mock dependencies
vi.mock('@/services/cms')
vi.mock('@/lib/rateLimiter')

import {AuthContext} from '../context/AuthContext'

// Mock useAuth with a factory function
const mockAuthValue = {
  isLoggedIn: false,
  login: vi.fn(),
  logout: vi.fn(),
  user: null as unknown,
}

// i18n mock with proper translations
const translations: Record<string, string> = {
  email: 'E-posta',
  password: 'Şifre',
  login: 'Giriş Yap',
  invalid_credentials: 'Geçersiz e-posta veya şifre',
  close_search: 'Aramayı kapat',
  open_search: 'Ara',
  switch_language: 'Dil değiştir',
  profile: 'Profil',
  cart: 'Sepet',
  items: 'ürün',
  close_menu: 'Menüyü kapat',
  open_menu: 'Menüyü aç',
  main_menu: 'Ana menü',
  search: 'Ara',
  products_menu: 'Ürünler menüsü',
  view_all: 'Tümünü Gör',
  already_logged_in: 'Hoş Geldiniz',
  welcome_back: 'Hoş Geldiniz',
  sign_up: 'Üye Ol',
  logout: 'Çıkış Yap',
  register: 'Kayıt Ol',
  full_name: 'Ad Soyad',
  company: 'Firma',
  profession: 'Meslek',
  country: 'Ülke',
  forgot_password: 'Şifremi Unuttum',
  no_account: 'Hesabınız yok mu?',
  have_account: 'Zaten hesabınız var mı?',
  too_many_attempts: 'Çok fazla deneme',
}

vi.mock('../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] || key,
    locale: 'tr',
    setLocale: vi.fn(),
    supportedLocales: ['tr', 'en', 'it'],
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

const renderLoginPage = (authValue = mockAuthValue) => {
  return render(
    <HelmetProvider>
      <AuthContext.Provider value={authValue}>
        <SEOProvider>
          <BrowserRouter>
            <LoginPage />
          </BrowserRouter>
        </SEOProvider>
      </AuthContext.Provider>
    </HelmetProvider>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Reset rate limiter mocks
    vi.mocked(rateLimiter.loginRateLimiter.check).mockReturnValue({
      allowed: true,
      remaining: 5,
      resetTime: Date.now() + 900000,
    })
    vi.mocked(rateLimiter.registerRateLimiter.check).mockReturnValue({
      allowed: true,
      remaining: 3,
      resetTime: Date.now() + 3600000,
    })
  })

  it('renders login form by default', () => {
    renderLoginPage()

    expect(screen.getByLabelText(/e-posta/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/şifre/i)).toBeInTheDocument()
    // Submit button'u bul (type="submit" olan)
    const submitButtons = screen.getAllByRole('button', {name: 'Giriş Yap'})
    const submitButton = submitButtons.find(btn => btn.getAttribute('type') === 'submit')
    expect(submitButton).toBeInTheDocument()
  })

  it('switches to register mode', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    const registerTab = screen.getByRole('button', {name: 'Üye Ol'})
    await act(async () => {
      await user.click(registerTab)
    })

    expect(screen.getByLabelText('Ad *')).toBeInTheDocument()
    expect(screen.getByLabelText('Soyad *')).toBeInTheDocument()
  })

  it('handles login form submission', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(cms.loginUser)
    mockLogin.mockResolvedValue({
      _id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      company: '',
      profession: '',
      role: 'consumer',
      userType: 'full_member',
      isActive: true,
      createdAt: new Date().toISOString(),
    })

    renderLoginPage()

    const emailInput = screen.getByLabelText(/e-posta/i)
    const passwordInput = screen.getByLabelText(/şifre/i)
    const submitButtons = screen.getAllByRole('button', {name: 'Giriş Yap'})
    const submitButton = submitButtons.find(btn => (btn as HTMLButtonElement).type === 'submit')!

    await act(async () => {
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
    })

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('handles login error', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(cms.loginUser)
    mockLogin.mockRejectedValue(new Error('Geçersiz'))

    renderLoginPage()

    const emailInput = screen.getByLabelText(/e-posta/i)
    const passwordInput = screen.getByLabelText(/şifre/i)
    const submitButtons = screen.getAllByRole('button', {name: 'Giriş Yap'})
    const submitButton = submitButtons.find(btn => (btn as HTMLButtonElement).type === 'submit')!

    await act(async () => {
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/geçersiz/i)).toBeInTheDocument()
    })
  })

  it('handles rate limiting', async () => {
    const user = userEvent.setup()
    vi.mocked(rateLimiter.loginRateLimiter.check).mockReturnValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 900000,
    })

    renderLoginPage()

    const emailInput = screen.getByLabelText(/e-posta/i)
    const passwordInput = screen.getByLabelText(/şifre/i)
    const submitButtons = screen.getAllByRole('button', {name: 'Giriş Yap'})
    const submitButton = submitButtons.find(btn => (btn as HTMLButtonElement).type === 'submit')!

    await act(async () => {
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/çok fazla deneme/i)).toBeInTheDocument()
    })
  })

  it('handles register form submission', async () => {
    const user = userEvent.setup()
    const mockRegister = vi.mocked(cms.registerUser)
    mockRegister.mockResolvedValue({
      _id: 'user-1',
      email: 'newuser@example.com',
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      role: 'consumer',
      company: '',
      userType: 'full_member',
      isActive: true,
      createdAt: new Date().toISOString(),
    })

    renderLoginPage()

    // Switch to register mode
    const registerTab = screen.getByRole('button', {name: 'Üye Ol'})
    await act(async () => {
      await user.click(registerTab)
    })

    const firstNameInput = screen.getByLabelText('Ad *')
    const lastNameInput = screen.getByLabelText('Soyad *')
    const emailInput = screen.getByLabelText('E-posta *')
    const passwordInput = screen.getByLabelText('Şifre *')
    const submitButtons = screen.getAllByRole('button', {name: 'Üye Ol'})
    const submitButton = submitButtons.find(btn => (btn as HTMLButtonElement).type === 'submit')!

    await act(async () => {
      await user.type(firstNameInput, 'John')
      await user.type(lastNameInput, 'Doe')
      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
    })

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'newuser@example.com',
        'password123',
        'John',
        'Doe',
        'consumer',
        {company: ''}
      )
    })
  })

  it('shows validation errors for empty fields on register', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    // Switch to register mode
    const registerTab = screen.getByRole('button', {name: 'Üye Ol'})
    await act(async () => {
      await user.click(registerTab)
    })

    const submitButtons = screen.getAllByRole('button', {name: 'Üye Ol'})
    const submitButton = submitButtons.find(btn => (btn as HTMLButtonElement).type === 'submit')!

    await act(async () => {
      await user.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Ad gereklidir')).toBeInTheDocument()
      expect(screen.getByText('Soyad gereklidir')).toBeInTheDocument()
      expect(screen.getByText('E-posta adresi gereklidir')).toBeInTheDocument()
    })
  })

  it('shows logged in state when user is authenticated', () => {
    const authVal = {
      isLoggedIn: true,
      user: {
        _id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        company: '',
        profession: '',
        userType: 'full_member',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      login: vi.fn(),
      logout: vi.fn(),
    }

    renderLoginPage(authVal as unknown as typeof mockAuthValue)

    // "Hoş Geldiniz" metni i18n'den geliyor, mock'da "already_logged_in" key'i var
    expect(screen.getByText('Hoş Geldiniz')).toBeInTheDocument()
  })
})
