import React, {useState, useEffect, useCallback} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {X, LogOut, ArrowRight} from 'lucide-react'
import {useAuth} from '../context/AuthContext'
import {useTranslation} from '../i18n'
import {useNavigate, Link} from 'react-router-dom'
import {loginUser} from '../services/cms'
import {loginRateLimiter} from '../lib/rateLimiter'
import {useFocusTrap} from '../hooks/useFocusTrap'

export const FloatingAuthPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const {isLoggedIn, user, login, logout} = useAuth()
  const {t} = useTranslation()
  const navigate = useNavigate()
  const handleClose = useCallback(() => setIsOpen(false), [])
  const focusTrapRef = useFocusTrap(isOpen, handleClose)

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Giriş yapılırken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToFooter = () => {
    setIsOpen(false)
    setTimeout(() => {
      const newsletterSection = document.getElementById('home-newsletter')
      if (newsletterSection) {
        const lenis = (
          window as unknown as {
            lenis?: {scrollTo: (target: HTMLElement | number, opts?: unknown) => void}
          }
        ).lenis

        if (lenis && typeof lenis.scrollTo === 'function') {
          lenis.scrollTo(newsletterSection, {offset: -80, duration: 1.2})
        } else {
          const headerHeight = document.querySelector('header')?.clientHeight || 80
          const elementPosition = newsletterSection.getBoundingClientRect().top + window.pageYOffset
          const offsetPosition = elementPosition - headerHeight - 20

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          })
        }

        setTimeout(() => {
          window.dispatchEvent(new Event('openNewsletter'))
        }, 600)
      } else {
        window.location.href = '/#home-newsletter'
      }
    }, 350)
  }

  return (
    <>
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />

            {/* Panel */}
            <motion.div
              ref={focusTrapRef as React.RefObject<HTMLDivElement>}
              role="dialog"
              aria-modal="true"
              aria-label={isLoggedIn ? t('profile') : t('login')}
              initial={{x: '100%', scaleX: 0.6, opacity: 0}}
              animate={{
                x: 0,
                scaleX: [0.6, 1.035, 0.99, 1],
                opacity: 1,
              }}
              exit={{
                x: '100%',
                scaleX: 0.6,
                opacity: 0,
                transition: {duration: 0.42, ease: [0.32, 0, 0.67, 0]},
              }}
              transition={{
                duration: 0.65,
                ease: [0.16, 1, 0.3, 1],
                times: [0, 0.52, 0.78, 1],
                opacity: {duration: 0.35},
              }}
              style={{transformOrigin: 'right center'}}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[400px] bg-[var(--bg-secondary)] shadow-[-10px_0_40px_-15px_rgba(0,0,0,0.3)] z-[101] flex flex-col"
            >
              {/* Panel Header */}
              <motion.div
                initial={{opacity: 0, x: 35, scaleX: 0.85, filter: 'blur(4px)'}}
                animate={{opacity: 1, x: 0, scaleX: 1, filter: 'blur(0px)'}}
                transition={{delay: 0.12, duration: 0.52, ease: [0.16, 1, 0.3, 1]}}
                style={{transformOrigin: 'right center'}}
                className="flex items-center justify-between px-8 py-10 border-b border-[var(--border-primary)]/10 bg-[var(--bg-primary)]/40"
              >
                <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-[var(--text-primary)]">
                  {isLoggedIn ? t('profile') : t('login')}
                  <span className="block h-0.5 w-12 bg-primary mt-3" />
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label={t('close') || 'Kapat'}
                  className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-300 ease-out hover:rotate-90 hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <X className="w-5 h-5 transition-transform duration-300" />
                </button>
              </motion.div>

              <div className="flex-1 overflow-y-auto px-8 py-10">
                {isLoggedIn ? (
                  <div className="space-y-12">
                    <motion.div
                      initial={{opacity: 0, x: 40, scaleX: 0.85, filter: 'blur(4px)'}}
                      animate={{opacity: 1, x: 0, scaleX: 1, filter: 'blur(0px)'}}
                      transition={{delay: 0.18, duration: 0.52, ease: [0.16, 1, 0.3, 1]}}
                      style={{transformOrigin: 'right center'}}
                    >
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.3em] font-bold mb-4">
                        {t('welcome_back') || 'Hoş Geldiniz'}
                      </p>
                      <p className="text-2xl font-bold font-jura tracking-tight text-[var(--text-primary)]">
                        {user?.name}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] font-inter mt-1 tracking-wide">
                        {user?.email}
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{opacity: 0, x: 40, scaleX: 0.85, filter: 'blur(4px)'}}
                      animate={{opacity: 1, x: 0, scaleX: 1, filter: 'blur(0px)'}}
                      transition={{delay: 0.25, duration: 0.52, ease: [0.16, 1, 0.3, 1]}}
                      style={{transformOrigin: 'right center'}}
                      className="space-y-4 pt-10 border-t border-[var(--border-primary)]/10"
                    >
                      <Link
                        to="/hesabim"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between w-full p-5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--bg-primary)] transition-all duration-500 uppercase tracking-[0.25em] text-[11px] font-bold font-inter group"
                      >
                        <span>{t('go_to_profile') || 'Hesabıma Git'}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>

                      <button
                        onClick={() => {
                          logout()
                          setIsOpen(false)
                          navigate('/')
                        }}
                        className="flex items-center justify-between w-full p-5 border border-[var(--border-primary)]/20 text-[var(--text-secondary)] hover:text-red-600 hover:border-red-600/30 transition-all duration-500 uppercase tracking-[0.25em] text-[11px] font-bold font-inter group"
                      >
                        <span>{t('logout')}</span>
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    <form onSubmit={handleLogin} className="space-y-8">
                      <motion.div
                        initial={{opacity: 0, x: 40, scaleX: 0.85, filter: 'blur(4px)'}}
                        animate={{opacity: 1, x: 0, scaleX: 1, filter: 'blur(0px)'}}
                        transition={{delay: 0.18, duration: 0.52, ease: [0.16, 1, 0.3, 1]}}
                        style={{transformOrigin: 'right center'}}
                        className="relative group"
                      >
                        <label
                          htmlFor="floating-auth-email"
                          className="block text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--text-secondary)] mb-2 transition-colors group-focus-within:text-[var(--text-primary)]"
                        >
                          {t('email')}
                        </label>
                        <input
                          id="floating-auth-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full bg-transparent border-b border-[var(--border-primary)] py-3 text-sm focus:border-primary focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 transition-all placeholder:text-[var(--text-secondary)]/30 font-inter font-medium tracking-wider text-[var(--text-primary)]"
                          style={{outline: 'none', boxShadow: 'none'}}
                          placeholder="e-posta@adresiniz.com"
                        />
                      </motion.div>

                      <motion.div
                        initial={{opacity: 0, x: 40, scaleX: 0.85, filter: 'blur(4px)'}}
                        animate={{opacity: 1, x: 0, scaleX: 1, filter: 'blur(0px)'}}
                        transition={{delay: 0.25, duration: 0.52, ease: [0.16, 1, 0.3, 1]}}
                        style={{transformOrigin: 'right center'}}
                        className="relative group"
                      >
                        <label
                          htmlFor="floating-auth-password"
                          className="block text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--text-secondary)] mb-2 transition-colors group-focus-within:text-[var(--text-primary)]"
                        >
                          {t('password')}
                        </label>
                        <input
                          id="floating-auth-password"
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full bg-transparent border-b border-[var(--border-primary)] py-3 text-sm focus:border-primary focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 transition-all placeholder:text-[var(--text-secondary)]/30 font-inter font-medium tracking-wider text-[var(--text-primary)]"
                          style={{outline: 'none', boxShadow: 'none'}}
                          placeholder="••••••••"
                        />
                      </motion.div>

                      {error && (
                        <motion.p
                          initial={{opacity: 0, height: 0}}
                          animate={{opacity: 1, height: 'auto'}}
                          className="text-red-500 text-[11px] uppercase tracking-widest font-bold"
                        >
                          {error}
                        </motion.p>
                      )}

                      <motion.div
                        initial={{opacity: 0, x: 40, scaleX: 0.85, filter: 'blur(4px)'}}
                        animate={{opacity: 1, x: 0, scaleX: 1, filter: 'blur(0px)'}}
                        transition={{delay: 0.32, duration: 0.52, ease: [0.16, 1, 0.3, 1]}}
                        style={{transformOrigin: 'right center'}}
                        className="space-y-4"
                      >
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] p-5 uppercase tracking-[0.3em] text-[11px] font-bold hover:bg-[var(--bg-primary)] transition-all duration-500 disabled:opacity-50 flex justify-between items-center font-inter group cursor-pointer"
                        >
                          <span>{isLoading ? t('waiting') : t('login')}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="text-center pt-2">
                          <Link
                            to="/reset-password"
                            onClick={() => setIsOpen(false)}
                            className="text-[10px] text-[var(--text-secondary)] hover:text-primary uppercase tracking-[0.2em] font-bold font-inter transition-colors inline-block pb-1 border-b border-transparent hover:border-primary"
                          >
                            {t('forgot_password')}
                          </Link>
                        </div>
                      </motion.div>
                    </form>

                    <motion.div
                      initial={{opacity: 0, x: 40, scaleX: 0.85, filter: 'blur(4px)'}}
                      animate={{opacity: 1, x: 0, scaleX: 1, filter: 'blur(0px)'}}
                      transition={{delay: 0.38, duration: 0.52, ease: [0.16, 1, 0.3, 1]}}
                      style={{transformOrigin: 'right center'}}
                      className="pt-12 mt-12 border-t border-[var(--border-primary)]/10 text-center"
                    >
                      <p className="text-[10px] text-[var(--text-secondary)] mb-6 tracking-[0.3em] uppercase font-bold">
                        {t('not_registered')}
                      </p>
                      <button
                        onClick={scrollToFooter}
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] p-5 uppercase tracking-[0.25em] text-[10px] md:text-[11px] font-bold text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:border-[var(--text-primary)] transition-all duration-500 font-inter group flex items-center justify-between shadow-sm cursor-pointer"
                      >
                        <span>{t('register_or_subscribe')}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
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
