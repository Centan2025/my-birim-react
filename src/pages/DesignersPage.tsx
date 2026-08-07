import {motion} from 'framer-motion'
import {useNavigate} from 'react-router-dom'
import type {Designer} from '../types'
import {useTranslation} from '../i18n'
import {useDesigners} from '../hooks/useDesigners'
import {useSEO} from '../hooks/useSEO'
import {PageLoading} from '../components/LoadingSpinner'
import {OptimizedImage} from '../components/OptimizedImage'
import {Breadcrumbs} from '../components/Breadcrumbs'

export function DesignersPage() {
  const {data: designers = [], isLoading: loading} = useDesigners()
  const {t} = useTranslation()
  const navigate = useNavigate()

  // SEO meta
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'
  useSEO({
    title: `BIRIM - ${t('designers') || 'Tasarımcılar'}`,
    description: 'BIRIM ile çalışan vizyoner tasarımcılar ve yaratıcı küratörler.',
    type: 'profile',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'Designers',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: t('designers') || 'Tasarımcılar',
      description: 'BIRIM ile çalışan vizyoner tasarımcılar ve yaratıcı küratörler.',
      url: `${baseUrl}/#/designers`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: designers.length,
        itemListElement: designers.slice(0, 20).map((d, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: t(d.name),
          url: `${baseUrl}/#/designer/${d.id}`,
        })),
      },
    },
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  const getImageUrl = (designer: Designer) => {
    return typeof designer.image === 'string' ? designer.image : designer.image?.url || ''
  }

  const getBioText = (bio: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bioVal = t(bio as any) as any
    if (typeof bioVal === 'string') return bioVal
    if (Array.isArray(bioVal) && bioVal.length > 0) {
      const firstBlock = bioVal.find((b: Record<string, unknown>) => b['_type'] === 'block')
      if (firstBlock && Array.isArray(firstBlock.children)) {
        return firstBlock.children.map((c: Record<string, unknown>) => c['text']).join(' ')
      }
    }
    return ''
  }

  const containerVariants = {
    hidden: {opacity: 0},
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: {opacity: 0, scale: 0.95, y: 30},
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ease: [0.215, 0.61, 0.355, 1] as any,
      },
    },
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] overflow-x-hidden pt-20 md:pt-24 lg:pt-24 pb-32">
      {/* Background Decorative Text */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 opacity-[0.03] dark:opacity-[0.05]">
        <h2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30vw] font-bold leading-none outline-text whitespace-nowrap uppercase tracking-tighter">
          {t('designers')}
        </h2>
      </div>

      {/* Breadcrumb Section */}
      <div className="relative z-20 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4 text-gray-400">
        <Breadcrumbs
          items={[{label: t('homepage'), to: '/'}, {label: t('designers') || 'Tasarımcılar'}]}
        />
      </div>

      {/* Header Section (Matching Projects Page) */}
      <header className="relative z-10 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-4 md:pt-12 pb-12">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 1, ease: 'easeOut'}}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)] tracking-tight text-center uppercase">
            {t('designers')}
          </h1>
        </motion.div>
      </header>

      {/* Grid Section */}
      <main className="relative z-10 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {designers.map(designer => (
            <motion.div
              key={designer.id}
              variants={cardVariants}
              whileHover={{y: -8}}
              onClick={() => navigate(`/designer/${designer.id}`)}
              className="group relative cursor-pointer overflow-hidden aspect-[4/5] bg-[var(--bg-secondary)] border border-[var(--border-primary)]/20 transition-all duration-500"
            >
              {/* Image Container */}
              <div className="w-full h-full overflow-hidden relative">
                <OptimizedImage
                  alt={t(designer.name)}
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 portrait-frame group-hover:grayscale-0"
                  src={getImageUrl(designer)}
                  srcMobile={
                    typeof designer.image === 'object' ? designer.image.urlMobile : undefined
                  }
                  srcDesktop={
                    typeof designer.image === 'object' ? designer.image.urlDesktop : undefined
                  }
                  crop={typeof designer.image === 'object' ? designer.image.crop : undefined}
                  hotspot={
                    typeof designer.image === 'object' ? designer.image.hotspot : undefined
                  }
                  origWidth={
                    typeof designer.image === 'object' ? designer.image.origWidth : undefined
                  }
                  origHeight={
                    typeof designer.image === 'object' ? designer.image.origHeight : undefined
                  }
                  cropMobile={
                    typeof designer.image === 'object' ? designer.image.cropMobile : undefined
                  }
                  hotspotMobile={
                    typeof designer.image === 'object' ? designer.image.hotspotMobile : undefined
                  }
                  origWidthMobile={
                    typeof designer.image === 'object' ? designer.image.origWidthMobile : undefined
                  }
                  origHeightMobile={
                    typeof designer.image === 'object'
                      ? designer.image.origHeightMobile
                      : undefined
                  }
                  cropDesktop={
                    typeof designer.image === 'object' ? designer.image.cropDesktop : undefined
                  }
                  hotspotDesktop={
                    typeof designer.image === 'object' ? designer.image.hotspotDesktop : undefined
                  }
                  origWidthDesktop={
                    typeof designer.image === 'object'
                      ? designer.image.origWidthDesktop
                      : undefined
                  }
                  origHeightDesktop={
                    typeof designer.image === 'object'
                      ? designer.image.origHeightDesktop
                      : undefined
                  }
                />

                {/* Refined Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-700"></div>
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              </div>

              {/* Information Panel - Simplified & Modern */}
              <div className="absolute bottom-0 left-0 w-full p-8 lg:p-10 translate-y-[calc(100%-110px)] group-hover:translate-y-0 transition-transform duration-700 ease-[cubic-bezier(0.2,0,0,1)]">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 border-t border-white/10"></div>

                <div className="relative z-10">
                  <div className="overflow-hidden mb-2">
                    <p className="text-[9px] tracking-[0.5em] font-medium text-white/40 uppercase group-hover:text-white/60 transition-colors duration-500">
                      {t('designer') || 'Tasarımcı'}
                    </p>
                  </div>

                  <h3 className="text-xl md:text-2xl font-light text-white uppercase mb-4 tracking-widest leading-none">
                    {t(designer.name)}
                  </h3>

                  <div className="h-px w-8 bg-white/20 mb-8 group-hover:w-full transition-all duration-700 ease-in-out"></div>

                  <div className="text-[11px] text-white/40 font-light line-clamp-3 uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:text-white/70 transition-all duration-700 delay-100 leading-relaxed">
                    {getBioText(designer.bio)}
                  </div>

                  <div className="mt-8 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 delay-200">
                    <span className="text-[9px] font-medium tracking-[0.4em] text-white/30 group-hover:text-white border-b border-white/10 group-hover:border-white/30 pb-2 transition-all duration-500 uppercase">
                      {t('explore_designer') || 'View Profile'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative Linear Accents */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                <div className="absolute top-0 left-8 right-8 h-px bg-white/5"></div>
                <div className="absolute bottom-0 left-8 right-8 h-px bg-white/5"></div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Decorative Navigation Aid */}
      <div className="mt-32 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 flex justify-between items-center opacity-30">
        <div className="h-px flex-1 bg-[var(--border-primary)]"></div>
        <div className="mx-8 text-[10px] uppercase tracking-[0.5em] font-light text-[var(--text-secondary)] whitespace-nowrap">
          BIRIM COLLABORATORS
        </div>
        <div className="h-px flex-1 bg-[var(--border-primary)]"></div>
      </div>
    </div>
  )
}
