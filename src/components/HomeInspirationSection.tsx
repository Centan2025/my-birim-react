import React, { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
}

export const HomeInspirationSection: React.FC<HomeInspirationSectionProps> = ({
  inspiration,
  isMobile,
  bgImageUrl,
  bgImageMobile,
  bgImageDesktop,
}) => {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)

  if (!inspiration || (!inspiration.backgroundImage && !inspiration.title && !inspiration.subtitle)) {
    return null
  }

  const backgroundImage =
    isMobile && bgImageMobile ? bgImageMobile : bgImageDesktop || bgImageUrl

  const dynamicHeightStyles =
    isMobile
      ? {
          height: '25vh',
          minHeight: '25vh',
        }
      : {
          height: '66vh',
          minHeight: '66vh',
        }

  useLayoutEffect(() => {
    const updateClipPath = () => {
      const container = containerRef.current
      const portalBg = portalRef.current

      if (!container || !portalBg) return

      const rect = container.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const windowWidth = window.innerWidth

      // Performans: Ekran dışı kontrolü
      if (rect.bottom < 0 || rect.top > windowHeight) {
        portalBg.style.clipPath = 'inset(100% 0 0 0)' 
        return
      }

      // HESAPLAMA:
      // Footer kesilmesini önlemek için "Safety Crop" mantığı (+1px)
      const top = Math.max(0, rect.top)
      const bottom = Math.max(0, windowHeight - rect.bottom + 1)
      const left = Math.max(0, rect.left)
      const right = Math.max(0, windowWidth - rect.right)

      portalBg.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`
    }

    updateClipPath()

    window.addEventListener('scroll', updateClipPath, { passive: true })
    window.addEventListener('resize', updateClipPath, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateClipPath)
      window.removeEventListener('resize', updateClipPath)
    }
  }, [])

  return (
    <>
      <style>{`
        /* DÜZELTME: Background-color kaldırıldı.
           Footer artık kendi orijinal rengini kullanacak. 
           Z-index: 50 olduğu için görselin üstünde kalmaya devam edecek. */
        footer {
          position: relative !important;
          z-index: 50 !important;
        }

        .portal-fixed-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          
          /* Görselin Z-index'i. Footer'ın (50) altında, sayfanın (body) üstünde. */
          z-index: 10; 
          
          pointer-events: none;
          background-size: cover;
          background-position: center center;
          
          /* Varsayılan kapalı */
          clip-path: inset(100% 0 0 0);
          
          will-change: clip-path;
          transform: translateZ(0);
        }

        .inspiration-container {
          position: relative;
          z-index: 20; 
          
          /* Yırtılmayı önleyen SİYAH arka plan */
          background-color: #000;
        }
        
        .inspiration-content {
          position: relative;
          z-index: 30;
        }
      `}</style>

      {/* PORTAL: Sabit Görsel */}
      {createPortal(
        <div 
          ref={portalRef}
          className="portal-fixed-bg"
          style={{
            backgroundImage: `url(${backgroundImage})`,
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" />
        </div>,
        document.body
      )}
      
      {/* PLACEHOLDER: Siyah Arka Planlı Container */}
      <div 
        ref={containerRef}
        className="inspiration-container w-full"
        style={dynamicHeightStyles}
      >
        {/* İçerik */}
        <div className="inspiration-content container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl h-full flex flex-col justify-center items-center text-white text-center pointer-events-auto">
          <ScrollReveal delay={0} threshold={0.1} width="w-full" className="h-auto">
            <h2 className="text-4xl font-normal leading-relaxed">{t(inspiration.title)}</h2>
          </ScrollReveal>
          <ScrollReveal delay={100} threshold={0.1} width="w-full" className="h-auto">
            <p className="mt-4 text-lg text-gray-100 max-w-2xl mx-auto font-normal leading-relaxed">
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
      </div>
    </>
  )
}