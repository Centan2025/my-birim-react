import React, {useEffect, useState} from 'react'
import {useNavigate, Link} from 'react-router-dom'
import {motion} from 'framer-motion'
import {ArrowRight, UserCheck, CheckCircle2} from 'lucide-react'
import {useAuth} from '../context/AuthContext'
import {useTranslation} from '../i18n'
import {registerUser, loginUser} from '../services/cms'
import {loginRateLimiter, registerRateLimiter} from '../lib/rateLimiter'
import {analytics} from '../lib/analytics'
import {
  validateLoginForm,
  validateShortRegisterForm,
  getPasswordStrength,
} from '../lib/formValidation'
import {useSEO} from '../hooks/useSEO'
import {useHeaderTheme} from '../context/HeaderThemeContext'
import {Breadcrumbs} from '../components/Breadcrumbs'

export function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'consumer' | 'architect'>('consumer')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(
    null
  )

  const auth = useAuth()
  const navigate = useNavigate()
  const {t} = useTranslation()
  const {reset} = useHeaderTheme()

  useEffect(() => {
    reset()
    return () => reset()
  }, [reset])

  const pageTitle = isLoginMode
    ? `BIRIM - ${t('login') || 'Giriş Yap'}`
    : `BIRIM - ${t('sign_up') || 'Üye Ol'}`

  useSEO({
    title: pageTitle,
    description:
      t('login_subtitle') || t('register_subtitle') || 'Birim Mobilya üyelik ve giriş portalı',
    siteName: 'BIRIM',
    type: 'website',
    locale: 'tr_TR',
  })

  // Eğer kullanıcı zaten giriş yaptıysa, /login'e geldiğinde direkt profiline yönlendir
  useEffect(() => {
    if (auth.isLoggedIn) {
      navigate('/profile', {replace: true})
    }
  }, [auth.isLoggedIn, navigate])

  // İlk yüklemede tarayıcı otomatik doldurmuş olsa bile alanları temizle
  useEffect(() => {
    if (auth.isLoggedIn) return
    const timer = setTimeout(() => {
      setEmail('')
      setPassword('')
    }, 50)
    return () => clearTimeout(timer)
  }, [auth.isLoggedIn])

  if (auth.isLoggedIn && auth.user) {
    return (
      <div className="bg-[var(--bg-secondary)] min-h-screen text-[var(--text-primary)] flex items-center justify-center p-8 pt-28">
        <div className="text-center space-y-4 max-w-sm bg-[var(--bg-primary)] p-8 border border-[var(--border-primary)]">
          <h2 className="text-2xl font-light tracking-tight">
            {t('welcome_back') || 'Hoş Geldiniz'}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {auth.user.name || auth.user.email}
          </p>
          <Link
            to="/profile"
            className="inline-block w-full bg-[#111827] dark:bg-white text-white dark:text-black py-3 text-xs font-semibold uppercase tracking-widest hover:bg-[#c5a059] transition-colors"
          >
            {t('profile') || 'Profil Sayfama Git'}
          </Link>
        </div>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setValidationErrors({})
    setIsLoading(true)

    const validation = validateLoginForm(email, password)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      setIsLoading(false)
      return
    }

    const rateLimitKey = email || 'global'
    const rateLimitResult = loginRateLimiter.check(rateLimitKey)

    if (!rateLimitResult.allowed) {
      const minutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000)
      setError(t('too_many_attempts', String(minutes)))
      setIsLoading(false)
      return
    }

    try {
      const user = await loginUser(email, password)
      if (user) {
        loginRateLimiter.reset(rateLimitKey)
        auth.login(user)
        navigate('/profile')
      } else {
        setError(t('invalid_credentials') || 'Geçersiz e-posta veya şifre')
        const remaining = rateLimitResult.remaining
        if (remaining > 0) {
          setError(
            `${t('invalid_credentials') || 'Geçersiz e-posta veya şifre'} (${remaining} deneme hakkı kaldı)`
          )
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Giriş yapılırken bir hata oluştu'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setValidationErrors({})
    setIsLoading(true)

    const validation = validateShortRegisterForm(firstName, lastName, email, password, role)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      setIsLoading(false)
      return
    }

    const rateLimitKey = email || 'global'
    const rateLimitResult = registerRateLimiter.check(rateLimitKey)

    if (!rateLimitResult.allowed) {
      const minutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000)
      setError(t('too_many_attempts', String(minutes)))
      setIsLoading(false)
      return
    }

    try {
      const user = await registerUser(email, password, firstName, lastName, role, {
        company,
      })
      registerRateLimiter.reset(rateLimitKey)
      auth.login(user)
      analytics.trackUserAction('register', user._id)
      if (user._id.startsWith('user_')) {
        setSuccess('Kayıt başarılı! Hesabınız oluşturuldu.')
      } else {
        setSuccess('Kayıt başarılı! Lütfen e-posta kutunuzu kontrol edin ve üyeliğinizi onaylayın.')
      }
      setTimeout(() => {
        navigate('/profile')
      }, 1000)
    } catch (err: unknown) {
      let errorMessage = err instanceof Error ? err.message : 'Kayıt olurken bir hata oluştu'
      if (
        errorMessage.includes('token') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('yapılandırılmamış')
      ) {
        errorMessage = 'Sanity token yapılandırılmamış veya yetkisiz.'
      }
      setError(errorMessage)
      const remaining = rateLimitResult.remaining
      if (remaining > 0) {
        setError(`${errorMessage} (${remaining} deneme hakkı kaldı)`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-[var(--bg-secondary)] min-h-screen text-[var(--text-primary)] transition-colors duration-500 pt-20 md:pt-24 lg:pt-28 pb-20 font-inter">
      {/* Breadcrumbs */}
      <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4 text-gray-400">
        <Breadcrumbs
          items={[
            {label: t('homepage') || 'Ana Sayfa', to: '/'},
            {label: isLoginMode ? t('login') || 'Giriş Yap' : t('sign_up') || 'Üye Ol'},
          ]}
        />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 pt-4">
        {/* Page Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-light text-[var(--text-primary)] tracking-tight uppercase">
            {isLoginMode ? t('login') || 'Giriş Yap' : t('sign_up') || 'Üye Ol'}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-2 font-light">
            {isLoginMode
              ? 'Birim Mobilya üye hesabınıza erişin.'
              : 'Üyelik oluşturun ve mimarlık programı avantajlarından yararlanın.'}
          </p>
        </div>

        {/* Minimal Auth Box */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] p-6 sm:p-8 shadow-sm">
          {/* Tab Switcher */}
          <div className="flex border-b border-[var(--border-primary)] mb-6">
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(true)
                setEmail('')
                setPassword('')
                setError('')
                setSuccess('')
                setValidationErrors({})
                setPasswordStrength(null)
              }}
              className={`flex-1 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors relative ${
                isLoginMode
                  ? 'text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t('login') || 'Giriş Yap'}
              {isLoginMode && (
                <motion.div
                  layoutId="tabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c5a059]"
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(false)
                setEmail('')
                setPassword('')
                setFirstName('')
                setLastName('')
                setCompany('')
                setRole('consumer')
                setError('')
                setSuccess('')
                setValidationErrors({})
                setPasswordStrength(null)
              }}
              className={`flex-1 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors relative ${
                !isLoginMode
                  ? 'text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t('sign_up') || 'Üye Ol'}
              {!isLoginMode && (
                <motion.div
                  layoutId="tabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c5a059]"
                />
              )}
            </button>
          </div>

          {/* Form Content */}
          {isLoginMode ? (
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs uppercase tracking-wider text-[var(--text-primary)] mb-1 font-medium"
                >
                  {t('email') || 'E-posta'} *
                </label>
                <input
                  id="email"
                  name="login-email"
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    if (validationErrors['email']) {
                      setValidationErrors(prev => {
                        const newErrors = {...prev}
                        delete newErrors['email']
                        return newErrors
                      })
                    }
                  }}
                  className={`w-full px-3.5 py-3 bg-[var(--bg-secondary)] border text-sm text-[var(--text-primary)] focus:border-[#c5a059] transition-colors ${
                    validationErrors['email'] ? 'border-red-500' : 'border-[var(--border-primary)]'
                  }`}
                  placeholder="e-posta@adresiniz.com"
                />
                {validationErrors['email'] && (
                  <p className="mt-1 text-xs text-red-500">{validationErrors['email']}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs uppercase tracking-wider text-[var(--text-primary)] mb-1 font-medium"
                >
                  {t('password') || 'Şifre'} *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="off"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    if (validationErrors['password']) {
                      setValidationErrors(prev => {
                        const newErrors = {...prev}
                        delete newErrors['password']
                        return newErrors
                      })
                    }
                  }}
                  className={`w-full px-3.5 py-3 bg-[var(--bg-secondary)] border text-sm text-[var(--text-primary)] focus:border-[#c5a059] transition-colors ${
                    validationErrors['password']
                      ? 'border-red-500'
                      : 'border-[var(--border-primary)]'
                  }`}
                  placeholder="••••••••"
                />
                {validationErrors['password'] && (
                  <p className="mt-1 text-xs text-red-500">{validationErrors['password']}</p>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <Link
                  to="/reset-password"
                  className="text-xs text-[var(--text-secondary)] hover:text-[#c5a059] transition-colors font-light"
                >
                  {t('forgot_password') || 'Şifremi unuttum'}
                </Link>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#111827] dark:bg-white text-white dark:text-black hover:bg-[#c5a059] dark:hover:bg-[#c5a059] dark:hover:text-black font-semibold text-xs uppercase tracking-widest py-3.5 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Giriş Yapılıyor...</span>
                ) : (
                  <>
                    <span>{t('login') || 'Giriş Yap'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5" autoComplete="off">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-xs uppercase tracking-wider text-[var(--text-primary)] mb-1 font-medium"
                  >
                    Ad *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={firstName}
                    onChange={e => {
                      setFirstName(e.target.value)
                      if (validationErrors['firstName']) {
                        setValidationErrors(prev => {
                          const newErrors = {...prev}
                          delete newErrors['firstName']
                          return newErrors
                        })
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border text-sm text-[var(--text-primary)] focus:border-[#c5a059] transition-colors ${
                      validationErrors['firstName']
                        ? 'border-red-500'
                        : 'border-[var(--border-primary)]'
                    }`}
                    placeholder="Adınız"
                  />
                  {validationErrors['firstName'] && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors['firstName']}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-xs uppercase tracking-wider text-[var(--text-primary)] mb-1 font-medium"
                  >
                    Soyad *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={lastName}
                    onChange={e => {
                      setLastName(e.target.value)
                      if (validationErrors['lastName']) {
                        setValidationErrors(prev => {
                          const newErrors = {...prev}
                          delete newErrors['lastName']
                          return newErrors
                        })
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border text-sm text-[var(--text-primary)] focus:border-[#c5a059] transition-colors ${
                      validationErrors['lastName']
                        ? 'border-red-500'
                        : 'border-[var(--border-primary)]'
                    }`}
                    placeholder="Soyadınız"
                  />
                  {validationErrors['lastName'] && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors['lastName']}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="block text-xs uppercase tracking-wider text-[var(--text-primary)] mb-1 font-medium"
                >
                  E-posta *
                </label>
                <input
                  id="register-email"
                  name="register-email"
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    if (validationErrors['email']) {
                      setValidationErrors(prev => {
                        const newErrors = {...prev}
                        delete newErrors['email']
                        return newErrors
                      })
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border text-sm text-[var(--text-primary)] focus:border-[#c5a059] transition-colors ${
                    validationErrors['email'] ? 'border-red-500' : 'border-[var(--border-primary)]'
                  }`}
                  placeholder="e-posta@adresiniz.com"
                />
                {validationErrors['email'] && (
                  <p className="mt-1 text-xs text-red-500">{validationErrors['email']}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="block text-xs uppercase tracking-wider text-[var(--text-primary)] mb-1 font-medium"
                >
                  Şifre *
                </label>
                <input
                  id="register-password"
                  name="register-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => {
                    const newPassword = e.target.value
                    setPassword(newPassword)
                    setPasswordStrength(newPassword ? getPasswordStrength(newPassword) : null)
                    if (validationErrors['password']) {
                      setValidationErrors(prev => {
                        const newErrors = {...prev}
                        delete newErrors['password']
                        return newErrors
                      })
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border text-sm text-[var(--text-primary)] focus:border-[#c5a059] transition-colors ${
                    validationErrors['password']
                      ? 'border-red-500'
                      : 'border-[var(--border-primary)]'
                  }`}
                  placeholder="En az 8 karakter"
                />
                {validationErrors['password'] && (
                  <p className="mt-1 text-xs text-red-500">{validationErrors['password']}</p>
                )}
                {password && passwordStrength && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-[var(--border-primary)] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength === 'weak'
                            ? 'bg-red-500 w-1/3'
                            : passwordStrength === 'medium'
                              ? 'bg-amber-500 w-2/3'
                              : 'bg-emerald-500 w-full'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                      {passwordStrength === 'weak'
                        ? 'Zayıf'
                        : passwordStrength === 'medium'
                          ? 'Orta'
                          : 'Güçlü'}
                    </span>
                  </div>
                )}
              </div>

              {/* Role Selection Buttons */}
              <div className="pt-1">
                <span className="block text-xs uppercase tracking-wider text-[var(--text-primary)] mb-1.5 font-medium">
                  Üyelik Tipi *
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('consumer')}
                    className={`py-2.5 px-3 border text-xs text-center transition-colors ${
                      role === 'consumer'
                        ? 'border-[#c5a059] bg-[#c5a059]/10 text-[var(--text-primary)] font-medium'
                        : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-gray-400'
                    }`}
                  >
                    Son Kullanıcı
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('architect')}
                    className={`py-2.5 px-3 border text-xs text-center transition-colors ${
                      role === 'architect'
                        ? 'border-[#c5a059] bg-[#c5a059]/10 text-[var(--text-primary)] font-medium'
                        : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-gray-400'
                    }`}
                  >
                    Mimar / İç Mimar
                  </button>
                </div>

                {role === 'architect' && (
                  <div className="mt-2 p-2.5 bg-[#c5a059]/10 border border-[#c5a059]/30 text-xs text-[var(--text-primary)] flex items-start gap-2">
                    <UserCheck className="w-4 h-4 text-[#c5a059] shrink-0 mt-0.5" />
                    <span>
                      <strong>Mimar Programı:</strong> Üyeliğiniz doğrulanınca CAD/BIM çizimleri
                      erişime açılır.
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-1 text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5 font-light">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#c5a059] shrink-0" />
                <span>
                  E-posta bülten abonesi olmak için alt bilgideki bülteni kullanabilirsiniz.
                </span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#111827] dark:bg-white text-white dark:text-black hover:bg-[#c5a059] dark:hover:bg-[#c5a059] dark:hover:text-black font-semibold text-xs uppercase tracking-widest py-3.5 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Kaydolunuyor...</span>
                ) : (
                  <>
                    <span>{t('sign_up') || 'Üye Ol'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
