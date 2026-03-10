import {useEffect, useState, useRef} from 'react'
import {useParams, useLocation} from 'react-router-dom'
import {ProductCard} from '../components/ProductCard'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {useDesigner} from '../hooks/useDesigners'
import {useProductsByDesigner} from '../hooks/useProducts'
import {useSiteSettings} from '../hooks/useSiteData'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {analytics} from '../lib/analytics'
import ScrollReveal from '../components/ScrollReveal'
import {useSEO} from '../hooks/useSEO'
import PortableTextLite from '../components/PortableTextLite'

import {useCardTransition} from '../context/CardTransitionContext'

export function DesignerDetailPage() {
  const {designerId: liveId} = useParams<{designerId: string}>()
  // Sayfa geçişlerinde param sıfırlandığı için ilk id'yi kilitliyoruz
  const [frozenId] = useState(liveId)
  const designerId = frozenId || liveId

  const location = useLocation()
  const fromCard = location.state?.fromCard
  const initialDesignerData = location.state?.designer

  const {data: designerData, isLoading: loading} = useDesigner(designerId, initialDesignerData)
  const {data: productsData = []} = useProductsByDesigner(designerData?.id)

  // Veri dondurma: Geçiş anında veri kaybolmasını önler
  const [frozenDesigner, setFrozenDesigner] = useState<any>(null)
  const [frozenProducts, setFrozenProducts] = useState<any[]>([])

  useEffect(() => {
    if (designerData) setFrozenDesigner(designerData)
    if (productsData.length > 0) setFrozenProducts(productsData)
  }, [designerData, productsData])

  const designer = designerData || frozenDesigner
  const products = productsData.length > 0 ? productsData : frozenProducts

  const {t} = useTranslation()
  const {setTargetRect, phase} = useCardTransition()
  const imageRef = useRef<HTMLDivElement>(null)

  const {data: settings} = useSiteSettings()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'
  const [isTitleVisible, setIsTitleVisible] = useState(false)

  // Track the actual location of the image in the detail page
  useEffect(() => {
    if (!loading && designer && imageRef.current) {
      const updateRect = () => {
        if (imageRef.current) {
          const rect = imageRef.current.getBoundingClientRect()
          // Use direct viewport coordinates since overlay is fixed
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: imageBorderClass === 'rounded-lg' ? '8px' : '0px',
          })
        }
      }

      // First immediate measurement
      updateRect()

      // Continuous measurement during the first 1 second of expansion
      // to handle scroll-to-top and layout shifts
      const interval = setInterval(updateRect, 32) // ~30fps tracking
      const timeout = setTimeout(() => clearInterval(interval), 1000)

      window.addEventListener('resize', updateRect)
      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
        window.removeEventListener('resize', updateRect)
      }
    }
    return () => {}
  }, [loading, designer, setTargetRect, imageBorderClass])

  const designerName = designer ? t(designer.name) : ''
  const designerImageUrl =
    typeof designer?.image === 'string'
      ? designer.image
      : designer?.image?.url || designer?.image?.urlDesktop || designer?.image?.urlMobile || ''
  const pageTitle = designerName ? `TASARIMCI - ${designerName}` : 'TASARIMCI'

  useSEO({
    title: pageTitle,
    description: designer ? t(designer.bio) || designerName : t('designers') || 'Tasarımcılar',
    image: designerImageUrl,
    type: 'profile',
    siteName: 'BIRIM',
    locale: 'tr_TR',
  })

  // Analytics: tasarımcı detay görüntüleme
  useEffect(() => {
    if (!designer) return
    if (typeof window === 'undefined') return

    analytics.pageview(window.location.pathname, pageTitle)

    analytics.event({
      category: 'designer',
      action: 'view_designer',
      label: t(designer.name), // ID yerine tasarımcı adı
    })
  }, [designer, pageTitle, t])

  // Tasarımcı adı animasyonu - soldan fade ile gel
  useEffect(() => {
    if (!designer) return
    setIsTitleVisible(false)
    const timer = setTimeout(() => {
      setIsTitleVisible(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [designer])

  if (loading) {
    return (
      <div className="pt-20">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  if (!designer) {
    return (
      <div className="pt-20 text-center">
        <p className="text-[var(--text-secondary)]">{t('designer_not_found')}</p>
      </div>
    )
  }

  return (
    <div
      className={`h-auto min-h-screen lg:h-screen flex flex-col bg-[var(--bg-secondary)] selection:bg-primary selection:text-black transition-colors duration-500 lg:overflow-hidden text-[var(--text-primary)] pt-20 ${fromCard ? '' : 'animate-fade-in-up-subtle'}`}
    >
      {/* Breadcrumb Band */}
      <div className="w-full relative z-20">
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4">
          <Breadcrumbs
            items={[
              {label: t('homepage'), to: '/'},
              {label: t('designers'), to: '/designers'},
              {label: t(designer.name)},
            ]}
          />
        </div>
      </div>

      <main className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto flex flex-col lg:flex-row flex-1 lg:overflow-hidden mt-4 lg:mt-8">
        {/* Sol Taraf: Büyük Görsel (Sabit) */}
        <div className="w-full lg:w-1/2 h-[60vh] lg:h-full shrink-0 relative lg:overflow-y-auto custom-scrollbar bg-[var(--bg-designer-hero)] border border-[var(--border-primary)] mt-0 p-10 lg:pt-24 lg:pb-16 lg:px-16 xl:pt-24 xl:pb-24 xl:px-24 flex flex-col group transition-colors duration-500">
          <div className="flex-1 relative mt-0 flex items-start justify-center overflow-visible">
            <div
              ref={imageRef}
              className="relative w-full h-[85%] lg:h-[85%] xl:h-[95%] max-h-[850px] z-10"
            >
              <OptimizedImage
                src={
                  typeof designer.image === 'string' ? designer.image : designer.image?.url || ''
                }
                srcMobile={
                  typeof designer.image === 'object'
                    ? designer.image.urlMobile
                    : designer.imageMobile
                }
                srcDesktop={
                  typeof designer.image === 'object'
                    ? designer.image.urlDesktop
                    : designer.imageDesktop
                }
                alt={t(designer.name)}
                className={`w-full h-full object-cover portrait-frame filter grayscale transition-all duration-700 group-hover:grayscale-0 ${imageBorderClass} ${phase === 'animating' ? 'opacity-0' : 'opacity-100'}`}
                loading="eager"
                quality={90}
                crop={typeof designer.image === 'object' ? (designer.image as any).crop : undefined}
                hotspot={
                  typeof designer.image === 'object' ? (designer.image as any).hotspot : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Sağ Taraf: Bilgiler ve Tasarımlar (Scroll Edilebilir) */}
        <div className="w-full lg:w-1/2 lg:flex-1 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto custom-scrollbar bg-[var(--bg-secondary)] lg:border-l border-[var(--border-primary)] scroll-smooth pb-20 lg:pb-0">
          <div className="py-12 lg:py-24 px-6 lg:px-20 min-h-full flex flex-col justify-start">
            <div className="mb-12 lg:mb-16">
              <h1
                className={`text-4xl md:text-5xl lg:text-7xl font-display uppercase tracking-tighter text-[var(--text-primary)] leading-none mb-4 transition-all duration-1000 ease-out delay-300 ${isTitleVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
              >
                {t(designer.name)}
              </h1>

              {designer.role && (
                <ScrollReveal delay={400}>
                  <p className="text-sm md:text-base uppercase tracking-[0.25em] text-[var(--text-secondary)] font-medium ml-1">
                    {t(designer.role)}
                  </p>
                </ScrollReveal>
              )}

              <div className="h-px w-full bg-[var(--border-primary)] my-8 lg:my-12"></div>

              <ScrollReveal delay={500}>
                <div className="text-base lg:text-lg leading-relaxed text-[var(--text-secondary)] font-light max-w-2xl">
                  {(() => {
                    const bio = t(designer.bio)
                    return Array.isArray(bio) ? <PortableTextLite value={bio} /> : <p>{bio}</p>
                  })()}
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={600} threshold={0.01}>
              <div className="pt-6">
                <h2 className="text-2xl lg:text-3xl font-light text-[var(--text-primary)] tracking-tight mb-8">
                  {t('designs') || 'Tasarımları'}
                </h2>

                {products.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-8">
                    {products.map((product, index) => (
                      <ScrollReveal
                        key={product.id}
                        delay={index < 8 ? index * 100 : 0}
                        threshold={0.01}
                      >
                        <ProductCard product={product} />
                      </ScrollReveal>
                    ))}
                  </div>
                ) : (
                  <p className="text-[var(--text-secondary)] italic mt-4">
                    {t('no_products_by_designer')}
                  </p>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </main>
    </div>
  )
}
