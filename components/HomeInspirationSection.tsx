import React from 'react'
import { Link } from 'react-router-dom'

import type { HomePageContent } from '../types'
import { useTranslation } from '../i18n'
import ScrollReveal from './ScrollReveal'

interface HomeInspirationSectionProps {
  inspiration: HomePageContent['inspirationSection']
  isMobile: boolean
  bgImageUrl: string
  bgImageMobile?: string
  bgImageDesktop?: string
  inspirationImageHeight: number | null
}

export const HomeInspirationSection: React.FC<HomeInspirationSectionProps> = ({
  inspiration,
  isMobile,
  bgImageUrl,
  bgImageMobile,
  bgImageDesktop,
  inspirationImageHeight,
}) => {
  const { t } = useTranslation()

  if (!inspiration || (!inspiration.backgroundImage && !inspiration.title && !inspiration.subtitle)) {
    return null
  }

  const backgroundImage =
    isMobile && bgImageMobile ? bgImageMobile : bgImageDesktop || bgImageUrl

  const dynamicHeightStyles =
    isMobile && inspirationImageHeight && bgImageUrl
      ? {
          height: `${inspirationImageHeight}px`,
          minHeight: `${inspirationImageHeight}px`,
          paddingTop: 0,
          paddingBottom: 0,
        }
      : !isMobile && inspirationImageHeight && bgImageUrl
        ? { minHeight: `${inspirationImageHeight}px` }
        : {}

  return (
    <section
      className="content-block-wrapper relative py-16 md:py-32 bg-gray-900 text-white text-center inspiration-section-mobile"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: isMobile ? '100vw auto' : 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: isMobile ? 'left center' : 'center center',
        backgroundRepeat: 'no-repeat',
        ...dynamicHeightStyles,
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <ScrollReveal delay={0} threshold={0.1} width="w-full" className="h-auto">
          <h2 className="text-4xl font-light leading-relaxed">{t(inspiration.title)}</h2>
        </ScrollReveal>
        <ScrollReveal delay={100} threshold={0.1} width="w-full" className="h-auto">
          <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">
            {t(inspiration.subtitle)}
          </p>
        </ScrollReveal>
        {inspiration.buttonText && (
          <ScrollReveal delay={200} threshold={0.1} width="w-full" className="h-auto">
            <Link
              to={inspiration.buttonLink || '/'}
              className="group mt-8 inline-flex items-center gap-x-3 text-white font-semibold py-3 pl-0 pr-5 text-lg rounded-lg"
            >
              <span className="inline-flex items-end gap-x-3 border-b border-transparent group-hover:border-white pb-1 transition-all duration-300 ease-out">
                <span className="group-hover:text-gray-200 leading-none">
                  {t(inspiration.buttonText)}
                </span>
                <span className="w-8 h-[1px] md:w-10 bg-current" />
              </span>
            </Link>
          </ScrollReveal>
        )}
      </div>
    </section>
  )
}


