import {useState, FC, FormEventHandler, useRef, useEffect} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {
  ArrowUpRight,
  Minus,
} from 'lucide-react'
import {subscribeEmail, subscribeProfessional} from '../services/cms'
import {analytics} from '../lib/analytics'
import {useTranslation} from '../i18n'

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

export const HomeNewsletter: FC = () => {
  const {t} = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'newsletter' | 'professional'>('newsletter')
  const [email, setEmail] = useState('')
  const [profData, setProfData] = useState({
    name: '',
    company: '',
    profession: '',
    country: '',
    email: '',
    phone: '',
    password: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Listen for external 'openNewsletter' event (e.g. from FloatingAuthPanel)
  useEffect(() => {
    const handleOpen = () => {
      setIsExpanded(true)
    }
    window.addEventListener('openNewsletter', handleOpen)
    return () => {
      window.removeEventListener('openNewsletter', handleOpen)
    }
  }, [])

  const showMessage = (msg: string, type: 'success' | 'error') => {
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)

    setMessage(msg)
    setStatus(type)

    messageTimeoutRef.current = setTimeout(() => {
      hideTimeoutRef.current = setTimeout(() => {
        setMessage(null)
        setStatus('idle')
      }, 1000)
    }, 4000)
  }

  const handleSubmitNewsletter: FormEventHandler<HTMLFormElement> = async e => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')

    try {
      const result = await subscribeEmail(email)
      analytics.event({
        action: 'sign_up',
        category: 'Newsletter',
        label: email,
      })

      const normalizedMessage = String(
        (result as {message?: string} | null | undefined)?.message || ''
      ).toLowerCase()
      const isAlready =
        normalizedMessage.includes('zaten aboneliğe kayıtlı') ||
        normalizedMessage.includes('zaten kayıtlı') ||
        normalizedMessage.includes('already subscribed')

      const finalMessage = isAlready ? t('newsletter_already_subscribed') : t('newsletter_success')

      showMessage(finalMessage, 'success')

      if (!isAlready) {
        setEmail('')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String((err as unknown) ?? '')
      if (
        errorMessage.includes('zaten aboneliğe kayıtlı') ||
        errorMessage.includes('zaten kayıtlı') ||
        errorMessage.toLowerCase().includes('already subscribed')
      ) {
        showMessage(t('newsletter_already_subscribed'), 'success')
      } else {
        showMessage(errorMessage, 'error')
      }
    }
  }

  const handleSubmitProfessional: FormEventHandler<HTMLFormElement> = async e => {
    e.preventDefault()
    if (!profData.email) return
    setStatus('loading')

    try {
      const result = await subscribeProfessional(profData)
      analytics.event({
        action: 'sign_up_professional',
        category: 'Newsletter',
        label: profData.email,
        value: profData.profession ? 1 : 0,
      })

      const msg = result?.message || t('professional_disclaimer')
      showMessage(msg, 'success')
      setProfData({
        name: '',
        company: '',
        profession: '',
        country: '',
        email: '',
        phone: '',
        password: '',
      })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String((err as unknown) ?? '')
      if (
        errorMessage.includes('zaten kayıtlı') ||
        errorMessage.includes('onay bekliyor') ||
        errorMessage.toLowerCase().includes('already')
      ) {
        showMessage(errorMessage, 'success')
      } else {
        showMessage(errorMessage, 'error')
      }
    }
  }

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [])

  const containerVariants = {
    hidden: {opacity: 0},
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: {opacity: 0, y: 15},
    visible: {opacity: 1, y: 0},
  }

  return (
    <section
      id="home-newsletter"
      className="bg-[#484d54] w-full relative overflow-hidden text-white leading-none font-inter"
    >
      {/* Collapse Trigger Button - Band Style */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="block w-full bg-[#555a62] transition-colors group z-30 relative border-t border-white/10 font-inter"
      >
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          <div className="flex-1 flex flex-col items-center text-center md:items-start md:text-left justify-center">
            <span className="font-light tracking-tight text-xl md:text-2xl text-white transition-colors font-inter">
              {t('newsletter_title')}
            </span>
            <span className="font-light tracking-tight text-[12px] md:text-[14px] text-gray-300 mt-2 transition-colors font-inter">
              {t('professional_access_desc')}
            </span>
          </div>
          <div className="flex-shrink-0 md:ml-4 w-full md:w-auto">
          <div
            className={`flex items-center justify-center gap-3 bg-transparent text-white border border-gray-400 px-6 py-3 transition-all duration-500 font-inter hover:bg-white/5`}
          >
            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.15em] font-medium">
              {isExpanded ? t('close') : t('join_us')}
            </span>
            {isExpanded ? (
              <Minus className="w-3.5 h-3.5" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-500" />
            )}
          </div>
        </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{height: 0, opacity: 0}}
            animate={{height: 'auto', opacity: 1}}
            exit={{height: 0, opacity: 0}}
            transition={{duration: 0.6, ease: [0.16, 1, 0.3, 1]}}
            className="overflow-hidden"
          >
            <div 
              className="pt-8 pb-16 w-full flex flex-col items-center text-[var(--text-primary)] relative transition-all duration-500"
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0f2f5 50%, #dbe1e6 100%)' }}
            >
              <div className="flex gap-4 md:gap-12 mb-12 relative z-20">
                <div role="tablist" className="relative flex">
                  <button
                    role="tab"
                    aria-selected={activeTab === 'newsletter'}
                    onClick={() => setActiveTab('newsletter')}
                    className={`relative pb-4 px-6 text-[11px] md:text-xs font-medium uppercase tracking-[0.15em] transition-all duration-500 font-inter ${activeTab === 'newsletter' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    {t('join_us')}
                    {activeTab === 'newsletter' && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--text-primary)]"
                        transition={{type: 'spring', stiffness: 380, damping: 30}}
                      />
                    )}
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'professional'}
                    onClick={() => setActiveTab('professional')}
                    className={`relative pb-4 px-6 text-[11px] md:text-xs font-medium uppercase tracking-[0.15em] transition-all duration-500 font-inter ${activeTab === 'professional' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    {t('professional_access')}
                    {activeTab === 'professional' && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--text-primary)]"
                        transition={{type: 'spring', stiffness: 380, damping: 30}}
                      />
                    )}
                  </button>
                </div>
              </div>

              <div className="w-full max-w-5xl mx-auto px-6 lg:px-0 relative z-10">
                <AnimatePresence mode="wait">
                  {activeTab === 'newsletter' && (
                    <motion.div
                      key="tab-news"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="w-full max-w-2xl mx-auto flex flex-col items-center"
                    >

                      <motion.form
                        variants={itemVariants}
                        onSubmit={handleSubmitNewsletter}
                        className="w-full flex flex-col md:flex-row gap-0 border border-gray-400 focus-within:border-[var(--text-primary)] transition-colors duration-500 bg-[var(--bg-primary)]"
                      >
                        <div className="flex-grow flex items-center px-4 py-1">
                          <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder={capitalize(t('email_placeholder'))}
                            className="w-full bg-transparent py-4 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none text-sm md:text-base tracking-widest font-semibold font-inter"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={status === 'loading'}
                          className="bg-[#3c424d] text-white border border-[#3c424d] px-10 py-5 hover:bg-[#4a515c] transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden group min-w-[200px] font-inter"
                        >
                          <span className="text-[10px] md:text-[11px] uppercase tracking-[0.15em] font-medium">
                            {status === 'loading' ? t('waiting') : t('subscribe')}
                          </span>
                          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500" />
                        </button>
                      </motion.form>

                      <motion.div variants={itemVariants} className="mt-6 h-6">
                        <AnimatePresence mode="wait">
                          {message && (
                            <motion.p
                              initial={{opacity: 0, y: 5}}
                              animate={{opacity: 1, y: 0}}
                              exit={{opacity: 0, y: -5}}
                              className={`text-[11px] md:text-xs uppercase tracking-[0.15em] font-bold text-center ${status === 'error' ? 'text-red-500' : 'text-[var(--text-primary)]'}`}
                            >
                              {message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  )}

                  {activeTab === 'professional' && (
                    <motion.div
                      key="tab-prof"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="w-full"
                    >

                      <form onSubmit={handleSubmitProfessional} className="space-y-4">
                        <motion.div
                          variants={itemVariants}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          <div className="relative group">
                            <input
                              type="text"
                              value={profData.name}
                              onChange={e => setProfData({...profData, name: e.target.value})}
                              required
                              placeholder={capitalize(t('full_name'))}
                              className="block w-full px-6 bg-[var(--bg-primary)] border border-gray-400 py-3.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--text-primary)] transition-all text-sm md:text-base tracking-widest font-semibold font-inter"
                            />
                          </div>
                          <div className="relative group">
                            <input
                              type="text"
                              value={profData.company}
                              onChange={e => setProfData({...profData, company: e.target.value})}
                              required
                              placeholder={capitalize(t('company'))}
                              className="block w-full px-6 bg-[var(--bg-primary)] border border-gray-400 py-3.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--text-primary)] transition-all text-sm md:text-base tracking-widest font-semibold font-inter"
                            />
                          </div>
                        </motion.div>

                        <motion.div
                          variants={itemVariants}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                          <div className="relative group">
                            <input
                              type="text"
                              value={profData.profession}
                              onChange={e => setProfData({...profData, profession: e.target.value})}
                              required
                              placeholder={capitalize(t('profession'))}
                              className="block w-full px-6 bg-[var(--bg-primary)] border border-gray-400 py-3.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--text-primary)] transition-all text-sm md:text-base tracking-widest font-semibold font-inter"
                            />
                          </div>
                          <div className="relative group">
                            <input
                              type="text"
                              value={profData.country}
                              onChange={e => setProfData({...profData, country: e.target.value})}
                              required
                              placeholder={capitalize(t('country'))}
                              className="block w-full px-6 bg-[var(--bg-primary)] border border-gray-400 py-3.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--text-primary)] transition-all text-sm md:text-base tracking-widest font-semibold font-inter"
                            />
                          </div>
                          <div className="relative group">
                            <input
                              type="tel"
                              value={profData.phone}
                              onChange={e => setProfData({...profData, phone: e.target.value})}
                              required
                              placeholder={capitalize(t('phone'))}
                              className="block w-full px-6 bg-[var(--bg-primary)] border border-gray-400 py-3.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--text-primary)] transition-all text-sm md:text-base tracking-widest font-semibold font-inter"
                            />
                          </div>
                        </motion.div>

                        <motion.div
                          variants={itemVariants}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          <div className="relative group">
                            <input
                              type="email"
                              value={profData.email}
                              onChange={e => setProfData({...profData, email: e.target.value})}
                              required
                              placeholder={capitalize(t('email'))}
                              className="block w-full px-6 bg-[var(--bg-primary)] border border-gray-400 py-3.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--text-primary)] transition-all text-sm md:text-base tracking-widest font-semibold font-inter"
                            />
                          </div>
                          <div className="relative group">
                            <input
                              type="password"
                              value={profData.password || ''}
                              onChange={e => setProfData({...profData, password: e.target.value})}
                              required
                              placeholder={capitalize(t('set_password'))}
                              className="block w-full px-6 bg-[var(--bg-primary)] border border-gray-400 py-3.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--text-primary)] transition-all text-sm md:text-base tracking-widest font-semibold font-inter"
                            />
                          </div>
                        </motion.div>

                        <motion.div
                          variants={itemVariants}
                          className="pt-6 flex flex-col items-center"
                        >
                          <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full md:w-auto md:min-w-[340px] group flex items-center justify-between bg-[#3c424d] text-white border border-[#3c424d] px-10 py-5 hover:bg-[#4a515c] transition-all duration-500 disabled:opacity-50 font-inter"
                          >
                            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.15em] font-medium">
                              {status === 'loading' ? t('waiting') : t('complete_application')}
                            </span>
                            <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
                          </button>

                          <div className="h-6 mt-6">
                            <AnimatePresence mode="wait">
                              {message ? (
                                <motion.p
                                  initial={{opacity: 0}}
                                  animate={{opacity: 1}}
                                  exit={{opacity: 0}}
                                  className={`text-[11px] md:text-xs uppercase tracking-[0.15em] font-bold ${status === 'error' ? 'text-red-500' : 'text-[var(--text-primary)]'}`}
                                >
                                  {message}
                                </motion.p>
                              ) : (
                                <p className="text-[10px] md:text-[11px] uppercase tracking-widest font-semibold text-gray-400">
                                  {t('professional_disclaimer')}
                                </p>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
