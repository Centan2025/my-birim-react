import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { Designer } from '../types'
import { useTranslation } from '../i18n'
import { useDesigners } from '../hooks/useDesigners'
import { useSEO } from '../hooks/useSEO'
import { PageLoading } from '../components/LoadingSpinner'
import { OptimizedImage } from '../components/OptimizedImage'
import PortableTextLite from '../components/PortableTextLite'
import { Breadcrumbs } from '../components/Breadcrumbs'

export function DesignersPage() {
  const { data: designers = [], isLoading: loading } = useDesigners()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeDesigner, setActiveDesigner] = useState<Designer | null>(null)

  // SEO meta
  useSEO({
    title: `BIRIM - ${t('designers') || 'Tasarımcılar'}`,
    description: 'BIRIM ile çalışan tasarımcılar ve yaratıcı ekip hakkında bilgiler',
    type: 'profile',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'Designers',
  })

  useEffect(() => {
    if (designers.length > 0 && !activeDesigner) {
      setActiveDesigner(designers[0] || null)
    }
  }, [designers, activeDesigner])

  // Removed local isDarkMode effect, handled by DarkModeProvider

  const handleDesignerClick = (designer: Designer) => {
    // Mobilde tıklandığında anında detay sayfasına git (Sol taraf zaten gizli)
    if (window.innerWidth < 1024) {
      navigate(`/designer/${designer.id}`)
      return
    }

    if (activeDesigner?.id === designer.id) {
      navigate(`/designer/${designer.id}`)
    } else {
      setActiveDesigner(designer)
    }
  }

  if (loading || !activeDesigner) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <PageLoading message={t('loading')} />
      </div>
    )
  }


  const getImageUrl = (designer: Designer) => {
    return typeof designer.image === 'string' ? designer.image : designer.image?.url || ''
  }

  return (
    <div className="h-auto min-h-screen lg:h-screen flex flex-col bg-[var(--bg-primary)] selection:bg-primary selection:text-black transition-colors duration-500 lg:overflow-hidden text-[var(--text-primary)]">
      <main className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto flex flex-col lg:flex-row flex-1 lg:overflow-hidden mt-16 lg:mt-16 xl:mt-20">
        {/* Sol Taraf: Portre ve Bilgi (Sabit kalır) */}
        <div className="hidden lg:flex w-full lg:w-1/2 min-h-[45svh] lg:h-full shrink-0 relative lg:overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] group flex-col transition-colors duration-500 pb-8 lg:pb-0">
          {/* Breadcrumbs (Left Top Desktop) */}
          <div className="absolute top-4 left-6 lg:top-8 lg:left-0 z-30">
            <Breadcrumbs
              items={[{ label: t('homepage'), to: '/' }, { label: t('designers') || 'Tasarımcılar' }]}
            />
          </div>
          <div className="flex-none lg:flex-1 relative mx-6 lg:ml-0 lg:mr-12 mt-12 lg:mt-10 xl:mt-16 2xl:mt-24 mb-4 lg:mb-2 xl:mb-4 2xl:mb-8 flex items-start justify-center overflow-visible">
            <AnimatePresence mode="wait">
              {activeDesigner && (
                <motion.div
                  key={activeDesigner.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 1, ease: [0.43, 0.13, 0.23, 0.96] }}
                  className="relative w-full h-[35vh] lg:h-[70%] xl:h-[80%] 2xl:h-[90%] max-h-[850px] z-10"
                >
                  <OptimizedImage
                    alt={t(activeDesigner.name)}
                    className="w-full h-full object-cover portrait-frame"
                    src={getImageUrl(activeDesigner)}
                    srcMobile={typeof activeDesigner.image === 'object' ? activeDesigner.image.urlMobile : undefined}
                    srcDesktop={typeof activeDesigner.image === 'object' ? activeDesigner.image.urlDesktop : undefined}
                  />

                  {/* Name alignment: Anchor point is exactly the bottom edge of the image */}
                  <div className="absolute left-0 bottom-0 z-30 pointer-events-none">
                    <div className="relative h-0">
                      {/* First Name - Bottom edge sits exactly on the anchor point (optical adjustment) */}
                      <motion.span
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="absolute bottom-[-2px] lg:bottom-[-4px] left-0 whitespace-nowrap text-3xl md:text-5xl lg:text-[70px] xl:text-[80px] 2xl:text-[90px] text-white font-display uppercase tracking-tighter leading-[0.75]"
                      >
                        {t(activeDesigner.name).split(' ')[0]}
                      </motion.span>
                      {/* Surname - Starts from the anchor point and hangs below */}
                      <motion.span
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                        className="absolute top-0 left-0 text-[var(--text-designer-surname)] font-display uppercase tracking-tighter text-3xl md:text-5xl lg:text-[70px] xl:text-[80px] 2xl:text-[90px] whitespace-nowrap leading-[0.75]"
                      >
                        {t(activeDesigner.name).split(' ').slice(1).join(' ')}
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-full z-20 px-8 lg:px-0 lg:pr-12 pb-10 lg:pb-12 xl:pb-14 mt-auto flex flex-col justify-end items-start bg-transparent">
            <AnimatePresence mode="wait">
              {activeDesigner && (
                <motion.div
                  key={activeDesigner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col lg:flex-row items-center lg:items-end justify-center lg:justify-between w-full gap-0 lg:gap-12"
                >
                  {/* Title and Bio Wrapper - Hidden on Mobile */}
                  <div className="hidden lg:flex flex-col items-start w-full lg:max-w-lg mb-2 text-left pointer-events-auto">
                    {/* Role is visible on all devices */}
                    {activeDesigner.role && (
                      <span className="text-xs lg:text-sm uppercase tracking-[0.25em] text-[var(--text-secondary)] mb-1 xl:mb-2 2xl:mb-3 font-medium">
                        {t(activeDesigner.role)}
                      </span>
                    )}
                    {/* Bio is hidden on mobile */}
                    <div className="text-sm xl:text-base leading-relaxed text-[var(--text-secondary)] font-light lg:line-clamp-1 xl:line-clamp-2 overflow-hidden text-left">
                      {(() => {
                        const bio = t(activeDesigner.bio)
                        return Array.isArray(bio) ? (
                          <PortableTextLite value={bio} />
                        ) : (
                          bio
                        )
                      })()}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/designer/${activeDesigner.id}`)}
                    className="w-full lg:w-auto text-center text-[10px] xl:text-[11px] 2xl:text-sm uppercase font-medium tracking-[0.3em] text-[var(--text-primary)] border border-black/30 dark:border-[var(--border-primary)] px-6 xl:px-8 2xl:px-12 py-4 xl:py-5 2xl:py-6 hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all cursor-pointer whitespace-nowrap self-end lg:self-auto pointer-events-auto"
                  >
                    {t('explore_designer')}
                  </button>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sağ Taraf: Rehber Listesi - Bağımsız Scroll */}
        <div className="w-full lg:w-1/2 lg:flex-1 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto custom-scrollbar bg-[var(--bg-designer-panel)] border-l border-[var(--border-primary)]/10 transition-colors duration-500 scroll-smooth lg:overscroll-contain pb-20 lg:pb-0">
          <div className="py-12 lg:py-24 px-6 lg:px-20 min-h-full flex flex-col justify-start">
            <div className="w-full mb-8 lg:hidden">
              <Breadcrumbs
                items={[{ label: t('homepage'), to: '/' }, { label: t('designers') || 'Tasarımcılar' }]}
              />
            </div>
            <div className="mb-8 lg:mb-12 w-full">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)] tracking-tight text-left mb-4">
                {t('designers')}
              </h1>
              <div className="h-px w-full bg-[var(--border-primary)]"></div>
            </div>
            <nav className="flex flex-col gap-4 lg:gap-6">
              {designers.map((designer) => (
                <button
                  key={designer.id}
                  onClick={() => handleDesignerClick(designer)}
                  className={`
                    designer-name-link 
                    text-left 
                    font-arial-regular
                    text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-[95px]
                    uppercase 
                    leading-[0.95] 
                    transition-all 
                    duration-500 
                    cursor-pointer
                    ${activeDesigner?.id === designer.id
                      ? 'text-primary'
                      : 'text-[var(--text-primary)]/40 dark:text-[var(--text-primary)]/15 hover:text-primary/40'
                    }
                  `}
                >
                  {t(designer.name)}
                </button>
              ))}
            </nav>
            {/* Scroll Indicator for long lists */}
            <div className="mt-20 opacity-30 flex items-center space-x-4">
              <div className="w-px h-12 bg-[var(--border-primary)] relative overflow-hidden">
                <motion.div
                  animate={{ y: [0, 48] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 left-0 w-full h-1/3 bg-primary"
                />
              </div>
              <span className="text-[8px] uppercase tracking-[0.3em] vertical-text text-[var(--text-secondary)]">{t('scroll_discovery')}</span>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .vertical-text { writing-mode: vertical-rl; }
      `}</style>
    </div>
  )
}

