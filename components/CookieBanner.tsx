import {useEffect, useState} from 'react'

const STORAGE_KEY = 'cookie_consent_v2'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      setVisible(!v)
    } catch {
      setVisible(true)
    }
  }, [])

  const acceptAll = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({necessary: true, analytics: true, ts: Date.now()})
      )
    } catch (error) {
      // localStorage erişilemiyorsa sessizce devam et
      console.warn('localStorage erişilemedi:', error)
    }
    setVisible(false)
  }

  const acceptNecessaryOnly = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({necessary: true, analytics: false, ts: Date.now()})
      )
    } catch (error) {
      console.warn('localStorage erişilemedi:', error)
    }
    setVisible(false)
  }

  const rejectAll = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({necessary: true, analytics: false, rejected: true, ts: Date.now()})
      )
    } catch (error) {
      console.warn('localStorage erişilemedi:', error)
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] bg-gray-900/95 text-gray-100 border-t border-white/15 pointer-events-auto">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2">
          <p className="flex-1 text-[11px] sm:text-xs leading-relaxed text-gray-200">
            Çerezleri; siteyi çalıştırmak, deneyiminizi iyileştirmek ve kullanım istatistikleri
            toplamak için kullanıyoruz. Detaylar için{' '}
            <a
              href="#/cookies"
              className="underline underline-offset-2 decoration-gray-400 hover:decoration-gray-100 hover:text-gray-100 transition-colors"
            >
              Çerez Politikası
            </a>
            'na bakabilirsiniz.
          </p>
          <div className="flex flex-wrap items-center justify-end gap-4 sm:gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.18em]">
            <button
              onClick={acceptNecessaryOnly}
              className="px-2.5 sm:px-3 py-1 border border-white/25 text-gray-100 hover:bg-white/05 hover:border-white/40 transition-colors"
            >
              Yalnızca zorunlu
            </button>
            <button
              onClick={rejectAll}
              className="px-2.5 sm:px-3 py-1 border border-white/25 text-gray-100 hover:bg-white/05 hover:border-white/40 transition-colors"
            >
              Hepsini reddet
            </button>
            <button
              onClick={acceptAll}
              className="px-3 sm:px-4 py-1 bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-colors"
            >
              Tümünü kabul et
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
