import React, {useState} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {User, X, LogOut, ArrowRight} from 'lucide-react'
import {useAuth} from '../context/AuthContext'
import {useTranslation} from '../i18n'
import {Link, useNavigate} from 'react-router-dom'
import {loginUser} from '../services/cms'
import {loginRateLimiter} from '../lib/rateLimiter'

export const FloatingAuthPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const {isLoggedIn, user, login, logout} = useAuth()
  const {t} = useTranslation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const rateLimitKey = email || 'global'
    const rateLimitResult = loginRateLimiter.check(rateLimitKey)

    if (!rateLimitResult.allowed) {
      setError(t('too_many_attempts') || 'Çok fazla deneme yaptınız.')
      setIsLoading(false)
      return
    }

    try {
      const loggedInUser = await loginUser(email, password)
      if (loggedInUser) {
        loginRateLimiter.reset(rateLimitKey)
        login(loggedInUser)
        setEmail('')
        setPassword('')
      } else {
        setError(t('invalid_credentials') || 'Geçersiz e-posta veya şifre')
      }
    } catch (err: any) {
      setError(err.message || 'Giriş yapılırken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToFooter = () => {
    setIsOpen(false)
    navigate('/login', {replace: false})
    setTimeout(() => {
      window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})
    }, 300)
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed right-0 top-[60%] -translate-y-1/2 z-[45]">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black text-white p-3 shadow-lg hover:bg-zinc-800 focus:outline-none transition-all duration-300 animate-fade-in-up flex items-center justify-center border border-r-0 border-transparent hover:border-white/20 translate-x-1/2 hover:translate-x-0 opacity-50 hover:opacity-100"
          style={{borderTopLeftRadius: '0.25rem', borderBottomLeftRadius: '0.25rem'}}
        >
          <User className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-[100]"
            />

            {/* Panel */}
            <motion.div
              initial={{x: '100%'}}
              animate={{x: 0}}
              exit={{x: '100%'}}
              transition={{type: 'tween', duration: 0.3}}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl z-[101] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] font-inter">
                  {isLoggedIn ? t('profile') || 'Profil' : t('login') || 'Giriş Yap'}
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {isLoggedIn ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase tracking-widest">
                        {t('welcome') || 'Hoş geldiniz'}
                      </p>
                      <p className="text-lg font-bold font-helvetica mt-1">{user?.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-gray-100">
                      <Link
                        to="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between w-full p-4 border border-black hover:bg-black hover:text-white transition-colors uppercase tracking-[0.2em] text-[11px] font-bold font-inter"
                      >
                        <span>{t('go_to_profile') || 'Profile Git'}</span>
                        <User className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => {
                          logout()
                          setIsOpen(false)
                          navigate('/')
                        }}
                        className="flex items-center justify-between w-full p-4 border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-600 transition-colors uppercase tracking-[0.2em] text-[11px] font-bold font-inter"
                      >
                        <span>{t('logout') || 'Çıkış Yap'}</span>
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <form onSubmit={handleLogin} className="space-y-5">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-2">
                          {t('email') || 'E-posta'}
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full border-b border-gray-300 py-2 text-sm focus:border-black focus:outline-none transition-colors"
                          placeholder="E-posta adresiniz"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-2">
                          {t('password') || 'Şifre'}
                        </label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full border-b border-gray-300 py-2 text-sm focus:border-black focus:outline-none transition-colors"
                          placeholder="••••••••"
                        />
                      </div>

                      {error && <p className="text-red-500 text-xs mt-2 font-inter">{error}</p>}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-black text-white p-4 mt-6 uppercase tracking-[0.2em] text-[11px] font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 flex justify-between items-center font-inter"
                      >
                        {isLoading ? t('waiting') || 'Bekleniyor' : t('login') || 'Giriş Yap'}
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <div className="text-right">
                        <Link
                          to="/reset-password"
                          onClick={() => setIsOpen(false)}
                          className="text-[10px] text-gray-500 hover:text-black uppercase tracking-wider font-inter underline"
                        >
                          {t('forgot_password') || 'Şifremi unuttum'}
                        </Link>
                      </div>
                    </form>

                    <div className="pt-8 mt-8 border-t border-gray-100 text-center">
                      <p className="text-xs text-gray-500 mb-4 tracking-widest uppercase">
                        {t('not_registered') || 'Üye Değil Misiniz?'}
                      </p>
                      <button
                        onClick={scrollToFooter}
                        className="w-full border border-black p-4 uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-[11px] font-bold hover:bg-black hover:text-white transition-colors font-inter group flex items-center justify-between"
                      >
                        <span>{t('register_or_subscribe') || 'Üye Ol / Kayıt Ol'}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
