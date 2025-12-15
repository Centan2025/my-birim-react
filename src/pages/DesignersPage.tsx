import React from 'react'
import {Link} from 'react-router-dom'
import type {Designer} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {useDesigners} from '../hooks/useDesigners'
import {useSiteSettings} from '../hooks/useSiteData'
import {Breadcrumbs} from '../components/Breadcrumbs'
import ScrollReveal from '../components/ScrollReveal'
import {useSEO} from '../hooks/useSEO'

const DesignerCard: React.FC<{designer: Designer}> = ({designer}) => {
  const {t} = useTranslation()
  const {data: settings} = useSiteSettings()
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'
  return (
    <Link to={`/designer/${designer.id}`} className="group flex flex-col h-full text-center">
      <div className={`overflow-hidden bg-white aspect-[3/4] ${imageBorderClass}`}>
        <OptimizedImage
          src={typeof designer.image === 'string' ? designer.image : designer.image?.url || ''}
          srcMobile={
            typeof designer.image === 'object' ? designer.image.urlMobile : designer.imageMobile
          }
          srcDesktop={
            typeof designer.image === 'object' ? designer.image.urlDesktop : designer.imageDesktop
          }
          alt={t(designer.name)}
          className={`w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.03] filter grayscale ${imageBorderClass}`}
          loading="lazy"
          quality={85}
        />
      </div>
      <div className="mt-4 min-h-[2.5rem] flex items-center justify-center">
        <h3 className="text-xl font-light text-gray-500 transition-colors duration-700 ease-in-out group-hover:text-gray-600">
          {t(designer.name)}
        </h3>
      </div>
    </Link>
  )
}

export function DesignersPage() {
  const {data: designers = [], isLoading: loading} = useDesigners()
  const {t} = useTranslation()

  // SEO meta
  useSEO({
    title: `BIRIM - ${t('designers') || 'Tasarımcılar'}`,
    description: 'BIRIM ile çalışan tasarımcılar ve yaratıcı ekip hakkında bilgiler',
    type: 'profile',
    siteName: 'BIRIM',
    locale: 'tr_TR',
    section: 'Designers',
  })

  if (loading) {
    return (
      <div className="pt-20">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  return (
    <div className="bg-gray-100 animate-fade-in-up-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 lg:pt-24 pb-16">
        <Breadcrumbs
          className="mb-6"
          items={[
            {label: t('homepage'), to: '/'},
            {label: t('designers')},
          ]}
        />
        <div className="text-center mt-6 md:mt-8 mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-gray-600">{t('designers')}</h1>
          <div className="h-px bg-gray-300 mt-4 w-full"></div>
        </div>
        {designers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8 items-stretch">
            {designers.map((designer, index) => (
              <ScrollReveal 
                key={designer.id} 
                delay={index < 12 ? index * 20 : 0} 
                threshold={0.01}
              >
                <DesignerCard designer={designer} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal delay={0} threshold={0.01}>
            <p className="text-gray-600 text-center">{t('designer_not_found')}</p>
          </ScrollReveal>
        )}
      </div>
    </div>
  )
}
