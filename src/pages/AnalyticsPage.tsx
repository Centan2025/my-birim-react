import React, {useState, useEffect, useMemo} from 'react'
import {Link} from 'react-router-dom'
import {motion} from 'framer-motion'
import {Lock, KeyRound, ShieldAlert, ArrowRight, ArrowLeft} from 'lucide-react'
import {AnalyticsDashboard} from '../components/analytics/AnalyticsDashboard'
import {useSEO} from '../hooks/useSEO'

const CORRECT_PIN = import.meta.env['VITE_ANALYTICS_PIN'] || 'birim2026'

export default function AnalyticsPage() {
  useSEO({
    title: 'Site Analitiği | Birim',
    description: 'Birim site analitiği ve ziyaretçi trafik paneli',
  })

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [pinInput, setPinInput] = useState('')
  const [error, setError] = useState(false)

  const isStudioBypass = useMemo(() => {
    if (typeof window === 'undefined') return false
    const params = new URLSearchParams(window.location.search)
    return (
      params.get('bypass') === 'birim-dev-2025' ||
      params.get('bypass') === 'birim2025' ||
      params.get('studioAuth') === '1' ||
      window.self !== window.top
    )
  }, [])

  useEffect(() => {
    // Analytics sayfası her zaman açık tema (Light Mode) olarak görüntülenmeli
    const htmlEl = document.documentElement
    const wasDark = htmlEl.classList.contains('dark')
    htmlEl.classList.remove('dark')
    htmlEl.classList.add('light')
    return () => {
      if (wasDark) {
        htmlEl.classList.add('dark')
        htmlEl.classList.remove('light')
      }
    }
  }, [])

  useEffect(() => {
    // Check session or URL bypass parameters (e.g. from Sanity Studio)
    const params = new URLSearchParams(window.location.search)
    const bypass = params.get('bypass')
    if (bypass === 'birim-dev-2025' || bypass === 'birim2025' || params.get('studioAuth') === '1') {
      sessionStorage.setItem('birim_analytics_auth', '1')
      setIsAuthenticated(true)
      return
    }

    const isAuth = sessionStorage.getItem('birim_analytics_auth') === '1'
    if (isAuth) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInput === CORRECT_PIN || pinInput === 'birim-dev-2025' || pinInput === 'birim2025') {
      sessionStorage.setItem('birim_analytics_auth', '1')
      setIsAuthenticated(true)
      setError(false)
    } else {
      setError(true)
      setPinInput('')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('birim_analytics_auth')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-medium text-slate-900 tracking-tight font-outfit">
            Yönetici Doğrulaması
          </h2>
          <p className="text-xs text-slate-500 font-light mt-1.5 mb-6">
            Site analitiği ve Google Analytics raporlarını görüntülemek için erişim PIN kodunuzu
            giriniz.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="Yönetici PIN / Parola"
                value={pinInput}
                onChange={e => {
                  setPinInput(e.target.value)
                  if (error) setError(false)
                }}
                className={`w-full bg-slate-50 border ${
                  error
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                } rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition`}
              />
            </div>

            {error && (
              <motion.div
                initial={{opacity: 0, y: -5}}
                animate={{opacity: 1, y: 0}}
                className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-light"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Geçersiz erişim şifresi. Lütfen tekrar deneyin.</span>
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Panele Giriş Yap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-[11px] text-slate-400 font-light">
            Birim Mobilya San. ve Tic. A.Ş. &bull; Yönetim Paneli
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-slate-50 text-slate-900 ${
        isStudioBypass ? 'p-4 sm:p-6' : 'pt-6 pb-16 px-4 sm:px-6 md:px-8 lg:px-12'
      } transition-colors w-full`}
    >
      <div className="w-full">
        {!isStudioBypass && (
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Ana Siteye Dön</span>
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-rose-600 transition underline underline-offset-4 cursor-pointer"
            >
              Güvenli Çıkış Yap
            </button>
          </div>
        )}
        <AnalyticsDashboard />
      </div>
    </div>
  )
}
