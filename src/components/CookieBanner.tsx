import {useEffect, useState} from 'react'
import {motion, AnimatePresence} from 'framer-motion'

const STORAGE_KEY = 'cookie_consent_v2'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (!v) {
        timer = setTimeout(() => setVisible(true), 1500)
      }
    } catch {
      setVisible(true)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [])

  const saveConsent = (data: {necessary: boolean; analytics: boolean; rejected?: boolean}) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({...data, ts: Date.now()}))
    } catch (error) {
      console.warn('localStorage access error:', error)
    }
    setVisible(false)
  }

  const acceptAll = () => saveConsent({necessary: true, analytics: true})
  const acceptNecessaryOnly = () => saveConsent({necessary: true, analytics: false})
  const rejectAll = () => saveConsent({necessary: true, analytics: false, rejected: true})

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{y: 50, opacity: 0, x: '-50%'}}
          animate={{y: 0, opacity: 1, x: '-50%'}}
          exit={{y: 50, opacity: 0, x: '-50%'}}
          transition={{duration: 0.8, ease: [0.16, 1, 0.3, 1]}}
          className="fixed bottom-6 left-1/2 z-[100] w-[92%] md:w-full md:max-w-xl bg-[#1c1e1d]/95 backdrop-blur-md border border-white/10 p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-inter"
        >
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-400">
                Çerez Ayarları
              </h3>
              <p className="text-[12px] md:text-[13px] leading-relaxed text-gray-300 font-light tracking-wide">
                BİRİM olarak web sitemizde deneyiminizi iyileştirmek, içerikleri kişiselleştirmek ve trafik analizi yapmak için çerezler kullanıyoruz. Detaylı bilgi için{' '}
                <a
                  href="#/cookies"
                  className="text-white underline underline-offset-4 hover:text-white/60 transition-colors decoration-white/20 hover:decoration-white/60"
                >
                  Çerez Politikası
                </a>
                'nı inceleyebilirsiniz.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-1 gap-2">
                <button
                  onClick={rejectAll}
                  className="flex-1 px-4 py-3 border border-white/10 text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-medium text-gray-400 hover:text-white hover:border-white/30 transition-all duration-300"
                >
                  Reddet
                </button>
                <button
                  onClick={acceptNecessaryOnly}
                  className="flex-1 px-4 py-3 border border-white/10 text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-medium text-gray-400 hover:text-white hover:border-white/30 transition-all duration-300"
                >
                  Seçilenler
                </button>
              </div>
              <button
                onClick={acceptAll}
                className="flex-initial sm:min-w-[180px] px-6 py-3 bg-[#3c424d] text-white text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-bold hover:bg-[#4a515c] transition-all duration-500 shadow-lg border border-white/5"
              >
                Tümünü Kabul Et
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
