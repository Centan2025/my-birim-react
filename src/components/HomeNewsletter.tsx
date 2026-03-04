import { useState, FC, FormEventHandler, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Mail, User, Building, Briefcase, Globe, Phone, Lock, Minus } from 'lucide-react'
import { subscribeEmail, subscribeProfessional } from '../services/cms'
import { analytics } from '../lib/analytics'
import { useTranslation } from '../i18n'

export const HomeNewsletter: FC = () => {
    const { t } = useTranslation()
    const [isExpanded, setIsExpanded] = useState(false)
    const [activeTab, setActiveTab] = useState<'newsletter' | 'professional'>('newsletter')
    const [email, setEmail] = useState('')
    const [profData, setProfData] = useState({ name: '', company: '', profession: '', country: '', email: '', phone: '', password: '' })
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState<string | null>(null)

    const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
                (result as { message?: string } | null | undefined)?.message || ''
            ).toLowerCase()
            const isAlready =
                normalizedMessage.includes('zaten aboneliğe kayıtlı') ||
                normalizedMessage.includes('zaten kayıtlı') ||
                normalizedMessage.includes('already subscribed')

            const finalMessage = isAlready
                ? t('newsletter_already_subscribed')
                : t('newsletter_success')

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
                showMessage(t('newsletter_error'), 'error')
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
                value: profData.profession ? 1 : 0
            })

            const msg = result?.message || t('professional_disclaimer')
            showMessage(msg, 'success')
            setProfData({ name: '', company: '', profession: '', country: '', email: '', phone: '', password: '' })
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String((err as unknown) ?? '')
            if (
                errorMessage.includes('zaten kayıtlı') ||
                errorMessage.includes('onay bekliyor') ||
                errorMessage.toLowerCase().includes('already')
            ) {
                showMessage(errorMessage, 'success')
            } else {
                showMessage(t('newsletter_error'), 'error')
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
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <section className="bg-[#e5e5e5] w-full relative border-t border-gray-200 overflow-hidden">
            {/* Collapse Trigger Button - Band Style */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-6 py-5 md:py-6 text-xs md:text-sm font-bold tracking-[0.3em] uppercase bg-[#d4d4d4] hover:bg-[#c9c9c9] transition-colors group z-30 relative font-inter"
            >
                <div className="flex-1 text-center md:pl-10 font-bold tracking-[0.4em]">
                    {t('newsletter_title')} & {t('professional_access')}
                </div>
                <div className="flex-shrink-0 ml-4">
                    <div className={`flex items-center gap-3 bg-black text-white px-6 py-3 transition-all duration-500 ${isExpanded ? 'bg-zinc-700' : 'bg-black'} font-inter`}>
                        <span className="text-[11px] md:text-xs tracking-[0.2em] font-bold">
                            {isExpanded ? t('close') : t('join_us')}
                        </span>
                        {isExpanded ? (
                            <Minus className="w-3.5 h-3.5" />
                        ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-500" />
                        )}
                    </div>
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="pt-8 pb-16 w-full flex flex-col items-center">
                            {/* Background Decorative Element */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-50" />

                            <div className="flex gap-4 md:gap-12 mb-12 relative z-20">
                                <div role="tablist" className="relative flex">
                                    <button
                                        role="tab"
                                        aria-selected={activeTab === 'newsletter'}
                                        onClick={() => setActiveTab('newsletter')}
                                        className={`relative pb-4 px-6 text-xs md:text-sm font-bold tracking-[0.25em] transition-all duration-500 uppercase font-inter ${activeTab === 'newsletter' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {t('newsletter_title')}
                                        {activeTab === 'newsletter' && (
                                            <motion.div
                                                layoutId="activeTabUnderline"
                                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-400"
                                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                    </button>
                                    <button
                                        role="tab"
                                        aria-selected={activeTab === 'professional'}
                                        onClick={() => setActiveTab('professional')}
                                        className={`relative pb-4 px-6 text-xs md:text-sm font-bold tracking-[0.25em] transition-all duration-500 uppercase font-inter ${activeTab === 'professional' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {t('professional_access')}
                                        {activeTab === 'professional' && (
                                            <motion.div
                                                layoutId="activeTabUnderline"
                                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-400"
                                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
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
                                            <motion.p variants={itemVariants} className="text-xs md:text-sm uppercase tracking-widest font-medium text-gray-500 mb-8 text-center max-w-md">
                                                {t('newsletter_prompt')}
                                            </motion.p>

                                            <motion.form
                                                variants={itemVariants}
                                                onSubmit={handleSubmitNewsletter}
                                                className="w-full flex flex-col md:flex-row gap-0 border border-gray-300 focus-within:border-black transition-colors duration-500 bg-white shadow-sm"
                                            >
                                                <div className="flex-grow flex items-center px-4 py-1">
                                                    <Mail className="w-4 h-4 text-gray-400 mr-3" />
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={e => setEmail(e.target.value)}
                                                        required
                                                        placeholder={t('email_placeholder').toUpperCase()}
                                                        className="w-full bg-transparent py-4 text-gray-900 placeholder-gray-400 focus:outline-none text-sm md:text-base tracking-widest font-semibold font-inter"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={status === 'loading'}
                                                    className="bg-black text-white px-10 py-5 hover:bg-zinc-800 transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden group min-w-[200px] font-inter"
                                                >
                                                    <span className="text-[11px] md:text-xs uppercase tracking-[0.25em] font-bold">
                                                        {status === 'loading' ? t('waiting') : t('subscribe')}
                                                    </span>
                                                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500" />
                                                </button>
                                            </motion.form>

                                            <motion.div variants={itemVariants} className="mt-6 h-6">
                                                <AnimatePresence mode="wait">
                                                    {message && (
                                                        <motion.p
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -5 }}
                                                            className={`text-[11px] md:text-xs uppercase tracking-[0.15em] font-bold text-center ${status === 'error' ? 'text-red-500' : 'text-gray-900'}`}
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
                                            <motion.p variants={itemVariants} className="text-xs md:text-sm uppercase tracking-widest font-medium text-gray-500 mb-10 text-center">
                                                {t('professional_access_desc')}
                                            </motion.p>

                                            <form onSubmit={handleSubmitProfessional} className="space-y-4">
                                                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <User className="h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={profData.name}
                                                            onChange={e => setProfData({ ...profData, name: e.target.value })}
                                                            required
                                                            placeholder={t('full_name').toUpperCase()}
                                                            className="block w-full pl-11 bg-white border border-gray-200 py-3.5 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-all text-sm md:text-base tracking-widest shadow-sm font-semibold font-inter"
                                                        />
                                                    </div>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <Building className="h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={profData.company}
                                                            onChange={e => setProfData({ ...profData, company: e.target.value })}
                                                            required
                                                            placeholder={t('company').toUpperCase()}
                                                            className="block w-full pl-11 bg-white border border-gray-200 py-3.5 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-all text-sm md:text-base tracking-widest shadow-sm font-semibold font-inter"
                                                        />
                                                    </div>
                                                </motion.div>

                                                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <Briefcase className="h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={profData.profession}
                                                            onChange={e => setProfData({ ...profData, profession: e.target.value })}
                                                            required
                                                            placeholder={t('profession').toUpperCase()}
                                                            className="block w-full pl-11 bg-white border border-gray-200 py-3.5 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-all text-sm md:text-base tracking-widest shadow-sm font-semibold font-inter"
                                                        />
                                                    </div>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <Globe className="h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={profData.country}
                                                            onChange={e => setProfData({ ...profData, country: e.target.value })}
                                                            required
                                                            placeholder={t('country').toUpperCase()}
                                                            className="block w-full pl-11 bg-white border border-gray-200 py-3.5 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-all text-sm md:text-base tracking-widest shadow-sm font-semibold font-inter"
                                                        />
                                                    </div>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <Phone className="h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
                                                        </div>
                                                        <input
                                                            type="tel"
                                                            value={profData.phone}
                                                            onChange={e => setProfData({ ...profData, phone: e.target.value })}
                                                            required
                                                            placeholder={t('phone').toUpperCase()}
                                                            className="block w-full pl-11 bg-white border border-gray-200 py-3.5 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-all text-sm md:text-base tracking-widest shadow-sm font-semibold font-inter"
                                                        />
                                                    </div>
                                                </motion.div>

                                                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
                                                        </div>
                                                        <input
                                                            type="email"
                                                            value={profData.email}
                                                            onChange={e => setProfData({ ...profData, email: e.target.value })}
                                                            required
                                                            placeholder={t('email').toUpperCase()}
                                                            className="block w-full pl-11 bg-white border border-gray-200 py-3.5 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-all text-sm md:text-base tracking-widest shadow-sm font-semibold font-inter"
                                                        />
                                                    </div>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
                                                        </div>
                                                        <input
                                                            type="password"
                                                            value={profData.password || ''}
                                                            onChange={e => setProfData({ ...profData, password: e.target.value })}
                                                            required
                                                            placeholder={t('set_password')}
                                                            className="block w-full pl-11 bg-white border border-gray-200 py-3.5 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-all text-sm md:text-base tracking-widest shadow-sm font-semibold font-inter"
                                                        />
                                                    </div>
                                                </motion.div>

                                                <motion.div variants={itemVariants} className="pt-6 flex flex-col items-center">
                                                    <button
                                                        type="submit"
                                                        disabled={status === 'loading'}
                                                        className="w-full md:w-auto md:min-w-[340px] group flex items-center justify-between bg-black text-white px-10 py-5 hover:bg-zinc-800 transition-all duration-500 disabled:opacity-50 border border-black shadow-lg font-inter"
                                                    >
                                                        <span className="text-[11px] md:text-xs uppercase tracking-[0.3em] font-bold">
                                                            {status === 'loading' ? t('waiting') : t('complete_application')}
                                                        </span>
                                                        <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
                                                    </button>

                                                    <div className="h-6 mt-6">
                                                        <AnimatePresence mode="wait">
                                                            {message ? (
                                                                <motion.p
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    exit={{ opacity: 0 }}
                                                                    className={`text-[11px] md:text-xs uppercase tracking-[0.15em] font-bold ${status === 'error' ? 'text-red-500' : 'text-gray-900'}`}
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
