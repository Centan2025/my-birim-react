import {useEffect, useState} from 'react'
import {useParams} from 'react-router-dom'
import {ProductCard} from '../components/ProductCard'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {useDesigner} from '../src/hooks/useDesigners'
import {useProductsByDesigner} from '../src/hooks/useProducts'
import {useSiteSettings} from '../src/hooks/useSiteData'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {analytics} from '../src/lib/analytics'
import ScrollReveal from '../components/ScrollReveal'

export function DesignerDetailPage() {
  const {designerId} = useParams<{designerId: string}>()
  const {data: designer, isLoading: loading} = useDesigner(designerId)
  const {data: products = []} = useProductsByDesigner(designer?.id)
  const {t} = useTranslation()
  const {data: settings} = useSiteSettings()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'
  const [isTitleVisible, setIsTitleVisible] = useState(false)

  // Analytics: tasarımcı detay görüntüleme
  useEffect(() => {
    if (!designer) return
    if (typeof window === 'undefined') return

    const title = `TASARIMCI - ${t(designer.name)}`
    if (typeof document !== 'undefined') {
      document.title = title
    }

    analytics.pageview(window.location.pathname, title)

    analytics.event({
      category: 'designer',
      action: 'view_designer',
      label: t(designer.name), // ID yerine tasarımcı adı
    })
  }, [designer, t])

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
        <p className="text-gray-600">{t('designer_not_found')}</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 animate-fade-in-up-subtle">
      <div className="container mx-auto px-2 sm:px-2 lg:px-2 pt-20 md:pt-24 lg:pt-24 pb-16">
        <Breadcrumbs
          className="mb-8"
          items={[
            {label: t('homepage'), to: '/'},
            {label: t('about'), to: '/about'},
            {label: t('designers'), to: '/designers'},
            {label: t(designer.name)},
          ]}
        />
        <div className="flex flex-col md:flex-row-reverse items-center md:items-start gap-8 md:gap-16 mb-12">
          <div className="flex-shrink-0">
            <OptimizedImage
              src={typeof designer.image === 'string' ? designer.image : designer.image?.url || ''}
              srcMobile={
                typeof designer.image === 'object' ? designer.image.urlMobile : designer.imageMobile
              }
              srcDesktop={
                typeof designer.image === 'object'
                  ? designer.image.urlDesktop
                  : designer.imageDesktop
              }
              alt={t(designer.name)}
              className={`w-80 h-96 md:w-96 md:h-[32rem] object-cover shadow-none md:shadow-none filter grayscale ${imageBorderClass}`}
              loading="eager"
              quality={90}
            />
          </div>
          <div className="text-left w-full">
            <div className="max-w-2xl">
              <h1 className={`text-4xl font-light text-gray-600 ${
                isTitleVisible
                  ? 'translate-x-0 opacity-100'
                  : '-translate-x-[150%] opacity-0'
              }`} style={{
                transition: 'transform 700ms ease-out, opacity 1200ms ease-out'
              }}>{t(designer.name)}</h1>
              <ScrollReveal delay={200}>
                <p className="mt-4 text-gray-500 leading-relaxed">{t(designer.bio)}</p>
              </ScrollReveal>
            </div>
          </div>
        </div>

        <div className="border-t pt-12">
          <h2 className="text-3xl font-light text-gray-600 mb-8">
            {t('designs') || 'Tasarımları'}
          </h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[2px]">
              {products.map((product, index) => (
                <ScrollReveal 
                  key={product.id} 
                  delay={index < 12 ? index * 20 : 0} 
                  threshold={0.01}
                >
                  <ProductCard product={product} variant="light" />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <ScrollReveal delay={0} threshold={0.01}>
              <p className="text-gray-600">{t('no_products_by_designer')}</p>
            </ScrollReveal>
          )}
        </div>
      </div>
    </div>
  )
}
