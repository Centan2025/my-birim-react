import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, X, LogOut, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../i18n'
import { Link } from 'react-router-dom'
import { loginUser } from '../services/cms'
import { loginRateLimiter } from '../lib/rateLimiter'

export const FloatingAuthPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { isLoggedIn, user, login, logout } = useAuth()
  const { t } = useTranslation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleOpenFloatingAuth = () => {
      setIsOpen(true)
    }
    window.addEventListener('openFloatingAuthPanel', handleOpenFloatingAuth)
    return () => {
      window.removeEventListener('openFloatingAuthPanel', handleOpenFloatingAuth)
    }
  }, [])

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
        setIsOpen(false)
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
    setTimeout(() => {
      const newsletterSection = document.getElementById('home-newsletter')
      if (newsletterSection) {
        newsletterSection.scrollIntoView({ behavior: 'smooth', block: 'start' })

        // Kaydırma biterken (sayfa uzunluğuna göre 1.5 saniye) newsletter'ı aç
        setTimeout(() => {
          window.dispatchEvent(new Event('openNewsletter'))
        }, 1500)
      } else {
        // Yedek: Sayfa sonuna git
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        })
      }
    }, 500)
  }

  return (
    <>
      {/* Floating button (Hidden on mobile) */}
      <div className="hidden lg:flex fixed right-0 top-[60%] -translate-y-1/2 z-[45]">
        <button
          onClick={() => setIsOpen(true)}
          className={`p-3.5 shadow-2xl backdrop-blur-xl focus:outline-none transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center border-[0.5px] rounded-none translate-x-1/2 hover:translate-x-0 opacity-80 hover:opacity-100 group ${isLoggedIn
            ? 'bg-white text-black border-black hover:bg-gray-50'
            : 'bg-black/40 text-white border-white/30 hover:bg-black/80'
            }`}
          aria-label={isLoggedIn ? t('profile') || 'Profil' : t('login') || 'Giriş Yap'}
        >
          <User
            strokeWidth={0.8}
            className="w-6 h-6 md:w-7 md:h-7 transition-transform duration-700 group-hover:scale-110"
          />
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[400px] bg-[#f5f5f5] shadow-[-10px_0_40px_-15px_rgba(0,0,0,0.3)] z-[101] flex flex-col"
            >
              <div className="flex items-center justify-between px-8 py-10 border-b border-black/5 bg-white/40">
                <h2 className="text-sm font-bold uppercase tracking-[0.4em] font-inter text-gray-900">
                  {isLoggedIn ? t('profile') : t('login')}
                  <span className="block h-0.5 w-12 bg-black mt-3" />
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors group"
                >
                  <X className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-10">
                {isLoggedIn ? (
                  <div className="space-y-12">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-bold mb-4">
                        {t('welcome_back') || 'Hoş Geldiniz'}
                      </p>
                      <p className="text-2xl font-bold font-jura tracking-tight text-gray-900">{user?.name}</p>
                      <p className="text-sm text-gray-500 font-inter mt-1 tracking-wide">{user?.email}</p>
                    </motion.div>

                    <div className="space-y-4 pt-10 border-t border-black/5">
                      <Link
                        to="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between w-full p-5 bg-[#e5e5e5] text-black border border-black hover:bg-[#d8d8d8] transition-all duration-500 uppercase tracking-[0.25em] text-[11px] font-bold font-inter group"
                      >
                        <span>{t('go_to_profile')}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>

                      <button
                        onClick={() => {
                          logout()
                          setIsOpen(false)
                          window.location.href = '/'
                        }}
                        className="flex items-center justify-between w-full p-5 border border-black/10 text-gray-400 hover:text-red-600 hover:border-red-600/30 transition-all duration-500 uppercase tracking-[0.25em] text-[11px] font-bold font-inter group"
                      >
                        <span>{t('logout')}</span>
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    <form onSubmit={handleLogin} className="space-y-8">
                      <div className="relative group">
                        <label className="block text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400 mb-2 transition-colors group-focus-within:text-black">
                          {t('email')}
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full bg-transparent border-b border-black/20 py-3 text-sm focus:border-black focus:outline-none transition-all placeholder:text-gray-300 font-inter font-medium tracking-wider"
                          placeholder="e-posta@adresiniz.com"
                        />
                      </div>
                      <div className="relative group">
                        <label className="block text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400 mb-2 transition-colors group-focus-within:text-black">
                          {t('password')}
                        </label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full bg-transparent border-b border-black/20 py-3 text-sm focus:border-black focus:outline-none transition-all placeholder:text-gray-300 font-inter font-medium tracking-wider"
                          placeholder="••••••••"
                        />
                      </div>

                      {error && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-red-500 text-[11px] uppercase tracking-widest font-bold"
                        >
                          {error}
                        </motion.p>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#e5e5e5] text-black border border-black p-5 mt-4 uppercase tracking-[0.3em] text-[11px] font-bold hover:bg-[#d8d8d8] transition-all duration-500 disabled:opacity-50 flex justify-between items-center font-inter group"
                      >
                        <span>{isLoading ? t('waiting') : t('login')}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <div className="text-center pt-2">
                        <Link
                          to="/reset-password"
                          onClick={() => setIsOpen(false)}
                          className="text-[10px] text-gray-400 hover:text-black uppercase tracking-[0.2em] font-bold font-inter transition-colors inline-block pb-1 border-b border-transparent hover:border-black"
                        >
                          {t('forgot_password')}
                        </Link>
                      </div>
                    </form>

                    <div className="pt-12 mt-12 border-t border-black/5 text-center">
                      <p className="text-[10px] text-gray-400 mb-6 tracking-[0.3em] uppercase font-bold">
                        {t('not_registered')}
                      </p>
                      <button
                        onClick={scrollToFooter}
                        className="w-full bg-white border border-black/10 p-5 uppercase tracking-[0.25em] text-[10px] md:text-[11px] font-bold hover:bg-black hover:text-white transition-all duration-700 font-inter group flex items-center justify-between shadow-sm"
                      >
                        <span>{t('register_or_subscribe')}</span>
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
