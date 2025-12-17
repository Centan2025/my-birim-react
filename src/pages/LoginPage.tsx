import React, {useEffect, useState} from 'react'
import {useNavigate, Link} from 'react-router-dom'
import {useAuth} from '../App'
import {useTranslation} from '../i18n'
import {registerUser, loginUser} from '../services/cms'
import {loginRateLimiter, registerRateLimiter} from '../lib/rateLimiter'
import {analytics} from '../lib/analytics'
import {
  validateLoginForm,
  validateRegisterForm,
  getPasswordStrength,
} from '../lib/formValidation'
import {useSEO} from '../hooks/useSEO'

export function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [profession, setProfession] = useState('')
  const [country, setCountry] = useState('')
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
  const pageTitle = isLoginMode
    ? `BIRIM - ${t('login') || 'Giriş'}`
    : `BIRIM - ${t('register') || 'Üyelik'}`

  useSEO({
    title: pageTitle,
    description:
      t('login_subtitle') ||
      t('register') ||
      'BIRIM üyelik ve giriş sayfası. Tasarım ve mimari ürünlere erişin.',
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
    // Küçük bir gecikmeyle React state'i DOM üzerine yazsın
    const timer = setTimeout(() => {
      setEmail('')
      setPassword('')
    }, 50)
    return () => clearTimeout(timer)
  }, [auth.isLoggedIn])

  // Ülkeyi konuma göre tahmin et (sadece üye ol modundayken ve country boşsa)
  useEffect(() => {
    if (!isLoginMode && !country) {
      // Önce tarayıcı konumunu dene
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async pos => {
            try {
              const {latitude, longitude} = pos.coords
              const resp = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=tr`
              )
              const data = await resp.json()
              if (data?.countryName) {
                setCountry(data.countryName)
                return
              }
            } catch {
              // sessiz geç
            }
          },
          () => {
            // izin verilmezse sessizce geç
          }
        )
      }
    }
  }, [isLoginMode, country])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setValidationErrors({})
    setIsLoading(true)

    // Form validation
    const validation = validateLoginForm(email, password)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      setIsLoading(false)
      return
    }

    // Rate limit kontrolü
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
        // Başarılı girişte rate limit'i sıfırla
        loginRateLimiter.reset(rateLimitKey)
        auth.login(user)
        navigate('/profile')
      } else {
        setError(t('invalid_credentials') || 'Geçersiz e-posta veya şifre')
        // Kalan deneme sayısını göster
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

    // Form validation
    const validation = validateRegisterForm(email, password, name, company, profession, country)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      setIsLoading(false)
      return
    }

    // Rate limit kontrolü
    const rateLimitKey = email || 'global'
    const rateLimitResult = registerRateLimiter.check(rateLimitKey)

    if (!rateLimitResult.allowed) {
      const minutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000)
      setError(`Çok fazla deneme yapıldı. Lütfen ${minutes} dakika sonra tekrar deneyin.`)
      setIsLoading(false)
      return
    }

    try {
      const user = await registerUser(email, password, name, company, profession, country)
      // Başarılı kayıtta rate limit'i sıfırla
      registerRateLimiter.reset(rateLimitKey)
      auth.login(user)
      analytics.trackUserAction('register', user._id)
      // E-posta doğrulama linki gönder
      const verificationToken = user.verificationToken
      const emailApiUrl = import.meta.env['VITE_EMAIL_API_URL'] as string | undefined
      if (verificationToken) {
        const verificationUrl = `${window.location.origin}/#/verify-email?token=${encodeURIComponent(
          verificationToken
        )}`
        // Konsolda her zaman test linki
        // eslint-disable-next-line no-console
        console.log('[Email Verification] Test link:', verificationUrl)

        if (emailApiUrl) {
          try {
            // Mail için kullanılacak logo yolu - public/img/logo-1.png
            const logoPath = '/img/logo-1.png'
            const logoUrl = `${window.location.origin}${logoPath}`

            await fetch(emailApiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email,
                verificationUrl,
                logoUrl,
              }),
            })
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[Email Verification] Mail gönderilemedi:', e)
          }
        }
      }
      // Kullanıcı local storage'a kaydedildiyse uyarı göster
      if (user._id.startsWith('user_')) {
        setSuccess(
          "Kayıt başarılı! (Not: Sanity token yapılandırılmamış, veriler local storage'da saklanıyor)"
        )
      } else {
        setSuccess('Kayıt başarılı! Lütfen e-posta kutunuzu kontrol edin ve üyeliğinizi onaylayın.')
      }
      setTimeout(() => {
        navigate('/profile')
      }, 1000)
    } catch (err: unknown) {
      let errorMessage = err instanceof Error ? err.message : 'Kayıt olurken bir hata oluştu'
      // Sanity token hatası için özel mesaj
      if (
        errorMessage.includes('token') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('yapılandırılmamış')
      ) {
        errorMessage =
          'Sanity token yapılandırılmamış veya yetkisiz. Çözüm: Proje kök dizininde .env dosyası oluşturup VITE_SANITY_TOKEN=your_token_here ekleyin. Token\'ı https://sanity.io/manage adresinden alın. Token\'ın "Editor" veya "Admin" yetkisi olmalıdır. Uygulamayı yeniden başlatın.'
      }
      setError(errorMessage)
      // Kalan deneme sayısını göster
      const remaining = rateLimitResult.remaining
      if (remaining > 0) {
        setError(`${errorMessage} (${remaining} deneme hakkı kaldı)`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-4xl font-light text-gray-900 mb-2 tracking-tight">
            {isLoginMode ? 'Hoş Geldiniz' : 'Üye Olun'}
          </h2>
          <p className="text-sm text-gray-500">
            {isLoginMode ? 'Hesabınıza giriş yapın' : 'Yeni hesap oluşturun'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-none overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
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
              className={`flex-1 py-4 text-center font-medium text-sm transition-all duration-300 relative ${
                isLoginMode ? 'text-gray-900 bg-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('login') || 'Giriş Yap'}
              {isLoginMode && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(false)
                setEmail('')
                setPassword('')
                setName('')
                setCompany('')
                setProfession('')
                setError('')
                setSuccess('')
                setValidationErrors({})
                setPasswordStrength(null)
              }}
              className={`flex-1 py-4 text-center font-medium text-sm transition-all duration-300 relative ${
                !isLoginMode ? 'text-gray-900 bg-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Üye Ol
              {!isLoginMode && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
              )}
            </button>
          </div>

          {/* Form Content */}
          <div className="p-8">
            {isLoginMode ? (
              <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
                <div className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('email') || 'E-posta'}
                    </label>
                    <input
                      id="email"
                      name="login-email"
                      type="email"
                      autoComplete="off"
                      required
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
                      className={`w-full px-4 py-3 border rounded-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400 ${
                        validationErrors['email'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="E-posta adresiniz"
                    />
                    {validationErrors['email'] && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors['email']}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {t('password') || 'Şifre'}
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="off"
                      required
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
                      className={`w-full px-4 py-3 border rounded-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400 ${
                        validationErrors['password'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                    />
                    {validationErrors['password'] && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors['password']}</p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-none text-sm whitespace-pre-wrap">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-none text-sm">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-none text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Giriş yapılıyor...
                    </>
                  ) : (
                    t('login') || 'Giriş Yap'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-6" autoComplete="off">
                <div className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Ad Soyad
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={e => {
                        setName(e.target.value)
                        if (validationErrors['name']) {
                          setValidationErrors(prev => {
                            const newErrors = {...prev}
                            delete newErrors['name']
                            return newErrors
                          })
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400 ${
                        validationErrors['name'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Adınız Soyadınız"
                    />
                    {validationErrors['name'] && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors['name']}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="register-email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {t('email') || 'E-posta'}
                    </label>
                    <input
                      id="register-email"
                      name="register-email"
                      type="email"
                      autoComplete="off"
                      required
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
                      className={`w-full px-4 py-3 border rounded-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400 ${
                        validationErrors['email'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="E-posta adresiniz"
                    />
                    {validationErrors['email'] && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors['email']}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="register-password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {t('password') || 'Şifre'}
                    </label>
                    <div>
                      <input
                        id="register-password"
                        name="register-password"
                        type="password"
                        autoComplete="new-password"
                        required
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
                        className={`w-full px-4 py-3 border rounded-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400 ${
                          validationErrors['password'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="••••••••"
                      />
                      {validationErrors['password'] && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors['password']}</p>
                      )}
                      {password && passwordStrength && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  passwordStrength === 'weak'
                                    ? 'bg-red-500 w-1/3'
                                    : passwordStrength === 'medium'
                                      ? 'bg-yellow-500 w-2/3'
                                      : 'bg-green-500 w-full'
                                }`}
                              ></div>
                            </div>
                            <span
                              className={`text-xs font-medium ${
                                passwordStrength === 'weak'
                                  ? 'text-red-600'
                                  : passwordStrength === 'medium'
                                    ? 'text-yellow-600'
                                    : 'text-green-600'
                              }`}
                            >
                              {passwordStrength === 'weak'
                                ? 'Zayıf'
                                : passwordStrength === 'medium'
                                  ? 'Orta'
                                  : 'Güçlü'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Şifre en az 8 karakter olmalı ve büyük/küçük harf, rakam içermelidir
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Firma
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      autoComplete="organization"
                      value={company}
                      onChange={e => {
                        setCompany(e.target.value)
                        if (validationErrors['company']) {
                          setValidationErrors(prev => {
                            const newErrors = {...prev}
                            delete newErrors['company']
                            return newErrors
                          })
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400 ${
                        validationErrors['company'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Firma Adı"
                    />
                    {validationErrors['company'] && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors['company']}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="profession"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Meslek
                    </label>
                    <input
                      id="profession"
                      name="profession"
                      type="text"
                      autoComplete="organization-title"
                      value={profession}
                      onChange={e => {
                        setProfession(e.target.value)
                        if (validationErrors['profession']) {
                          setValidationErrors(prev => {
                            const newErrors = {...prev}
                            delete newErrors['profession']
                            return newErrors
                          })
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400 ${
                        validationErrors['profession'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Mesleğiniz"
                    />
                    {validationErrors['profession'] && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors['profession']}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Ülke
                    </label>
                    <input
                      id="country"
                      name="country"
                      type="text"
                      value={country}
                      onChange={e => {
                        setCountry(e.target.value)
                        if (validationErrors['country']) {
                          setValidationErrors(prev => {
                            const newErrors = {...prev}
                            delete newErrors['country']
                            return newErrors
                          })
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400 ${
                        validationErrors['country'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ülkeniz"
                    />
                    {validationErrors['country'] && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors['country']}</p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-none text-sm whitespace-pre-wrap">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-none text-sm">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-none text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Kayıt yapılıyor...
                    </>
                  ) : (
                    'Üye Ol'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          Üye olarak{' '}
          <Link to="/products" className="font-medium text-gray-900 hover:text-gray-700 underline">
            özel içeriklere
          </Link>{' '}
          erişebilirsiniz.
        </p>
      </div>
    </div>
  )
}
