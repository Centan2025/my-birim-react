import {useState, useEffect} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {useNavigate} from 'react-router-dom'
import type {Designer} from '../types'
import {useTranslation} from '../i18n'
import {useDesigners} from '../hooks/useDesigners'
import {useSEO} from '../hooks/useSEO'
import {PageLoading} from '../components/LoadingSpinner'
import {OptimizedImage} from '../components/OptimizedImage'
import PortableTextLite from '../components/PortableTextLite'
import {Breadcrumbs} from '../components/Breadcrumbs'

export function DesignersPage() {
  const {data: designers = [], isLoading: loading} = useDesigners()
  const {t} = useTranslation()
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
    <div className="h-auto min-h-screen lg:h-screen flex flex-col bg-[var(--bg-primary)] selection:bg-primary selection:text-black transition-colors duration-500 lg:overflow-hidden text-[var(--text-primary)] pt-20">
      {/* Breadcrumb Band */}
      <div className="w-full relative z-20">
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4">
          <Breadcrumbs
            items={[{label: t('homepage'), to: '/'}, {label: t('designers') || 'Tasarımcılar'}]}
          />
        </div>
      </div>

      <main className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto flex flex-col lg:flex-row flex-1 lg:overflow-hidden mt-4 lg:mt-8">
        {/* Sol Taraf: Portre ve Bilgi (Sabit kalır) */}
        <div className="hidden lg:flex w-full lg:w-1/2 min-h-[45svh] lg:h-full shrink-0 relative lg:overflow-hidden bg-[var(--bg-designer-hero)] border border-[var(--border-primary)] mt-0 pt-0 px-10 lg:px-16 xl:px-20 2xl:px-28 group flex-col transition-colors duration-500">
          <div className="flex-none lg:flex-1 relative mt-10 lg:mt-28 flex items-start justify-start overflow-visible">
            <AnimatePresence mode="wait">
              {activeDesigner && (
                <motion.div
                  key={activeDesigner.id}
                  initial={{opacity: 0, x: -30}}
                  animate={{opacity: 1, x: 0}}
                  exit={{opacity: 0, x: 30}}
                  transition={{duration: 1, ease: [0.43, 0.13, 0.23, 0.96]}}
                  className="relative w-full h-[40vh] lg:h-[62%] xl:h-[65%] 2xl:h-[65%] max-h-[650px] z-10 flex items-center justify-start"
                >
                  <div className="w-full h-full aspect-[3/2]">
                    <OptimizedImage
                      alt={t(activeDesigner.name)}
                      className="w-full h-full object-cover portrait-frame"
                      src={getImageUrl(activeDesigner)}
                      srcMobile={
                        typeof activeDesigner.image === 'object'
                          ? activeDesigner.image.urlMobile
                          : undefined
                      }
                      srcDesktop={
                        typeof activeDesigner.image === 'object'
                          ? activeDesigner.image.urlDesktop
                          : undefined
                      }
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Alt Bilgi ve Karar Butonu - Alta Sabitlendi */}
          <div className="absolute bottom-6 lg:bottom-8 xl:bottom-12 left-10 lg:left-16 xl:left-20 2xl:left-28 right-10 lg:right-16 xl:right-20 2xl:right-28 z-40 bg-transparent h-[180px] lg:h-[200px]">
            <AnimatePresence mode="wait">
              {activeDesigner && (
                <motion.div
                  key={activeDesigner.id}
                  initial={{opacity: 0, y: 15}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0, y: -15}}
                  transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
                  className="grid grid-cols-1 lg:grid-cols-[calc(45%+1.5rem)_1fr] w-full h-full items-start gap-0"
                >
                  {/* Sol Sütun: İsim ve Buton */}
                  <div className="flex flex-col items-start pt-6 lg:pt-10 h-full">
                    <h2
                      className="text-xl md:text-2xl lg:text-3xl xl:text-[2.4rem] uppercase leading-[1.1] text-[var(--text-primary)] font-inter text-left"
                      style={{
                        fontWeight: 500,
                        letterSpacing: '-0.08em',
                      }}
                    >
                      {t(activeDesigner.name)}
                    </h2>

                    <div className="mt-auto pb-0">
                      <button
                        onClick={() => navigate(`/designer/${activeDesigner.id}`)}
                        className="w-full lg:w-auto text-center text-[10px] xl:text-[11px] uppercase font-medium tracking-[0.3em] text-[var(--text-primary)] border border-[var(--text-primary)]/30 px-6 xl:px-10 py-4 xl:py-5 hover:bg-primary/20 hover:border-primary transition-all duration-500 ease-out cursor-pointer whitespace-nowrap"
                      >
                        {t('explore_designer')}
                      </button>
                    </div>
                  </div>

                  {/* Sağ Sütun: Biyografi */}
                  <div className="pl-4 lg:pl-6 pt-10 lg:pt-16">
                    <div className="text-xs xl:text-sm leading-relaxed text-[var(--text-primary)]/70 font-light text-left w-full line-clamp-3 lg:line-clamp-4">
                      {(() => {
                        const bio = t(activeDesigner.bio)
                        return Array.isArray(bio) ? <PortableTextLite value={bio} /> : bio
                      })()}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sağ Taraf: Rehber Listesi - Bağımsız Scroll */}
        <div className="w-full lg:w-1/2 lg:flex-1 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] border-l border-[var(--border-primary)]/10 transition-colors duration-500 scroll-smooth lg:overscroll-contain pb-20 lg:pb-0">
          <div className="py-2 md:py-12 lg:pt-0 lg:pb-24 px-6 lg:px-20 min-h-full flex flex-col justify-start">
            <div className="mb-8 lg:mb-12 w-full">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)] tracking-tight text-left mb-4">
                {t('designers')}
              </h1>
              <div className="h-px w-full bg-[var(--border-primary)]"></div>
            </div>
            <nav className="flex flex-col gap-4 md:gap-4 lg:gap-6">
              {designers.map(designer => (
                <button
                  key={designer.id}
                  onClick={() => handleDesignerClick(designer)}
                  className={`
                    designer-name-link 
                    text-left 
                    font-arial-regular
                    text-[clamp(2.25rem,3.5vw,4rem)]
                    uppercase 
                    leading-[0.95] 
                    transition-all 
                    duration-500 
                    cursor-pointer
                    ${
                      activeDesigner?.id === designer.id
                        ? 'text-primary'
                        : 'text-[var(--text-primary)]/75 dark:text-[var(--text-primary)]/40 hover:text-primary/40'
                    }
                  `}
                >
                  {t(designer.name)}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </main>

      <style>{`
        .vertical-text { writing-mode: vertical-rl; }
      `}</style>
    </div>
  )
}
