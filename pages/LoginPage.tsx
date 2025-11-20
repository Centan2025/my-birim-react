import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { useTranslation } from '../i18n';
import { registerUser, loginUser } from '../services/cms';

export function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [profession, setProfession] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      const user = await loginUser(email, password);
      if (user) {
        auth.login(user);
        navigate('/profile');
      } else {
        setError(t('invalid_credentials') || 'Geçersiz e-posta veya şifre');
      }
    } catch (err: any) {
      setError(err.message || 'Giriş yapılırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      const user = await registerUser(email, password, name, company, profession);
      auth.login(user);
      // Kullanıcı local storage'a kaydedildiyse uyarı göster
      if (user._id.startsWith('user_')) {
        setSuccess('Kayıt başarılı! (Not: Sanity token yapılandırılmamış, veriler local storage\'da saklanıyor)');
      } else {
        setSuccess('Kayıt başarılı! Yönlendiriliyorsunuz...');
      }
      setTimeout(() => {
        navigate('/profile');
      }, 1000);
    } catch (err: any) {
      let errorMessage = err.message || 'Kayıt olurken bir hata oluştu';
      // Sanity token hatası için özel mesaj
      if (errorMessage.includes('token') || errorMessage.includes('permission') || errorMessage.includes('yapılandırılmamış')) {
        errorMessage = 'Sanity token yapılandırılmamış veya yetkisiz. Çözüm: Proje kök dizininde .env dosyası oluşturup VITE_SANITY_TOKEN=your_token_here ekleyin. Token\'ı https://sanity.io/manage adresinden alın. Token\'ın "Editor" veya "Admin" yetkisi olmalıdır. Uygulamayı yeniden başlatın.';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    auth.logout();
    navigate('/');
  }

  if (auth.isLoggedIn) {
      return (
          <div className="bg-gray-50 flex items-center justify-center animate-fade-in-up-subtle py-20">
              <div className="text-center p-8">
                  <h1 className="text-2xl font-semibold mb-4">{t('already_logged_in') || 'Zaten giriş yaptınız'}</h1>
                  <p className="text-gray-600 mb-4">{auth.user?.email}</p>
                  <div className="flex gap-4 justify-center">
                    <Link
                      to="/profile"
                      className="bg-gray-800 text-white font-semibold py-2 px-6 rounded-none hover:bg-gray-700 transition-colors duration-200"
                    >
                      Üye Paneli
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="bg-gray-600 text-white font-semibold py-2 px-6 rounded-none hover:bg-gray-500 transition-colors duration-200"
                    >
                      {t('logout') || 'Çıkış Yap'}
                    </button>
                  </div>
              </div>
          </div>
      )
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
                setIsLoginMode(true);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-4 text-center font-medium text-sm transition-all duration-300 relative ${
                isLoginMode
                  ? 'text-gray-900 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
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
                setIsLoginMode(false);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-4 text-center font-medium text-sm transition-all duration-300 relative ${
                !isLoginMode
                  ? 'text-gray-900 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
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
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('email') || 'E-posta'}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                      placeholder="ornek@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('password') || 'Şifre'}
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                      placeholder="••••••••"
                    />
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
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Giriş yapılıyor...
                    </>
                  ) : (
                    (t('login') || 'Giriş Yap')
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-6">
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
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                      placeholder="Adınız Soyadınız"
                    />
                  </div>
                  <div>
                    <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('email') || 'E-posta'}
                    </label>
                    <input
                      id="register-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                      placeholder="ornek@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('password') || 'Şifre'}
                    </label>
                    <input
                      id="register-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Firma
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      autoComplete="organization"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                      placeholder="Firma Adı"
                    />
                  </div>
                  <div>
                    <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-2">
                      Meslek
                    </label>
                    <input
                      id="profession"
                      name="profession"
                      type="text"
                      autoComplete="job-title"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                      placeholder="Mesleğiniz"
                    />
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
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
  );
}