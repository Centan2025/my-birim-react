import {describe, it, expect, beforeEach, vi} from 'vitest'
import {render, screen, waitFor, act} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {BrowserRouter} from 'react-router-dom'
import {LoginPage} from '../../pages/LoginPage'
import * as cms from '../../services/cms'
import * as rateLimiter from '../../src/lib/rateLimiter'

// Mock dependencies
vi.mock('../../services/cms')
vi.mock('../../src/lib/rateLimiter')

// Mock useAuth with a factory function
const mockUseAuth = vi.fn(() => ({
  isLoggedIn: false,
  login: vi.fn(),
  logout: vi.fn(),
  user: null as any,
}))

vi.mock('../../App', () => ({
  useAuth: () => mockUseAuth(),
}))

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
  logout: 'Çıkış Yap',
}

vi.mock('../../i18n', () => ({
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

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
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

    expect(screen.getByLabelText('E-posta')).toBeInTheDocument()
    expect(screen.getByLabelText('Şifre')).toBeInTheDocument()
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

    expect(screen.getByLabelText(/ad soyad/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/firma/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/meslek/i)).toBeInTheDocument()
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
      userType: 'full_member',
      isActive: true,
      createdAt: new Date().toISOString(),
    })

    renderLoginPage()

    const emailInput = screen.getByLabelText('E-posta')
    const passwordInput = screen.getByLabelText('Şifre')
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
    mockLogin.mockResolvedValue(null)

    renderLoginPage()

    const emailInput = screen.getByLabelText('E-posta')
    const passwordInput = screen.getByLabelText('Şifre')
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

    const emailInput = screen.getByLabelText('E-posta')
    const passwordInput = screen.getByLabelText('Şifre')
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
      name: 'New User',
      company: 'Test Company',
      profession: 'Designer',
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

    const emailInput = screen.getByLabelText('E-posta')
    const passwordInput = screen.getByLabelText('Şifre')
    const nameInput = screen.getByLabelText(/ad soyad/i)
    const submitButtons = screen.getAllByRole('button', {name: 'Üye Ol'})
    const submitButton = submitButtons.find(btn => (btn as HTMLButtonElement).type === 'submit')!

    await act(async () => {
      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(nameInput, 'New User')
      await user.click(submitButton)
    })

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'newuser@example.com',
        'password123',
        'New User',
        '',
        ''
      )
    })
  })

  it('shows logged in state when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
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
    })

    renderLoginPage()

    // "Hoş Geldiniz" metni i18n'den geliyor, mock'da "already_logged_in" key'i var
    expect(screen.getByText('Hoş Geldiniz')).toBeInTheDocument()
  })
})

