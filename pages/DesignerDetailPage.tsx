import React, {useEffect} from 'react'
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

export function DesignerDetailPage() {
  const {designerId} = useParams<{designerId: string}>()
  const {data: designer, isLoading: loading} = useDesigner(designerId)
  const {data: products = []} = useProductsByDesigner(designer?.id)
  const {t} = useTranslation()
  const {data: settings} = useSiteSettings()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'

  // Analytics: tasarımcı detay görüntüleme
  useEffect(() => {
    if (!designer) return
    if (typeof window === 'undefined') return

    const title = `BIRIM - ${t(designer.name)}`
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
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
              className={`w-80 h-96 md:w-96 md:h-[32rem] object-cover shadow-lg filter grayscale ${imageBorderClass}`}
              loading="eager"
              quality={90}
            />
          </div>
          <div className="text-left w-full">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-light text-gray-600">{t(designer.name)}</h1>
              <p className="mt-4 text-gray-500 leading-relaxed">{t(designer.bio)}</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-12">
          <h2 className="text-3xl font-light text-gray-600 mb-8">
            {t('designs') || 'Tasarımları'}
          </h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {products.map(product => (
                <ProductCard key={product.id} product={product} variant="light" />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">{t('no_products_by_designer')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
