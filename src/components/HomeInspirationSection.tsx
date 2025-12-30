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



  const hasInspiration =
    Boolean(inspiration) &&
    Boolean(inspiration.backgroundImage || inspiration.title || inspiration.subtitle)

  const backgroundImage =
    isMobile && bgImageMobile ? bgImageMobile : bgImageDesktop || bgImageUrl

  const dynamicHeightStyles =
    isMobile
      ? {
        // Yüksekliği sabit tutmak yerine, minimum yükseklik veriyoruz.
        // Böylece tarayıcı farklarından bağımsız olarak önceki content
        // bloklarının üstüne binme riski azalır.
        minHeight: '25vh',
      }
      : {
        minHeight: '55vh',
      }

  useLayoutEffect(() => {
    let animationFrameId: number;

    const updateClipPath = () => {
      const container = containerRef.current
      const portalBg = portalRef.current

      if (!container || !portalBg) return

      const rect = container.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const windowWidth = window.innerWidth

      // Eleman ekranda görünmüyorsa portal'ı tamamen gizle
      if (rect.bottom <= 0 || rect.top >= windowHeight) {
        portalBg.style.clipPath = 'inset(100% 0 0 0)'
        return
      }

      // --- KESİN ÇÖZÜM AYARI ---
      // Desktop'ta hem üstten hem alttan kırpma ile çalışıyoruz,
      // mobilde ise SENKRON problemlerini tamamen engellemek için
      // sadece ÜSTTEN kırpma yapıyoruz, alttan hiç kırpmıyoruz.

      // Mobil: sadece üstten clip, altta boşluk kalmaz
      if (isMobile) {
        const BUFFER_TOP = 5; // çok küçük bir tampon
        const top = Math.max(0, rect.top - BUFFER_TOP)
        const left = Math.max(0, rect.left)
        const right = Math.max(0, windowWidth - rect.right)

        portalBg.style.clipPath = `inset(${top}px ${right}px 0 ${left}px)`
        return
      }

      // Desktop: buffer yok, content'leri kesmemek için
      const BUFFER_TOP = 0;
      const top = Math.max(0, rect.top - BUFFER_TOP)
      const bottom = 0 // Alttan kesme yok, content'lerin üstüne binmesin

      const left = Math.max(0, rect.left)
      const right = Math.max(0, windowWidth - rect.right)

      portalBg.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`
    }

    const onScroll = () => {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(updateClipPath)
    }

    updateClipPath()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isMobile])

  if (!hasInspiration) {
    return null
  }

  return (
    <>
      <style>{`
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
          /* Portal arka planda, ilham bloğunun ALTINDA ama diğer içeriklerin ÜZERİNDE kalır */
          z-index: 10;
          pointer-events: none;
          background-size: cover;
          background-position: center center;
          clip-path: inset(100% 0 0 0);
          will-change: clip-path;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
        }

        .inspiration-container {
          position: relative;
          z-index: 20; 
          
          /* ÇÖZÜMÜN PARÇASI: */
          /* 1. Arka plan tamamen şeffaf (Siyah blok oluşamaz). */
          background-color: transparent; 
          
          transform: translateZ(0);
        }

        
        .inspiration-content {
          position: relative;
          /* İçerik portalın (resmin) önünde durmalı */
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

      {/* PLACEHOLDER: Container */}
      <div
        ref={containerRef}
        className="inspiration-container w-full"
        style={dynamicHeightStyles}
      >
        <div className="inspiration-content container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl h-full flex flex-col justify-center items-center text-white text-center pointer-events-auto">
          <ScrollReveal delay={0} threshold={0.1} width="w-full" className="h-auto" initialScale={0.95}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal leading-relaxed">{t(inspiration.title)}</h2>
          </ScrollReveal>
          <ScrollReveal delay={100} threshold={0.1} width="w-full" className="h-auto" initialScale={0.95}>
            <p className="mt-4 text-xl md:text-2xl lg:text-3xl text-gray-100 max-w-2xl mx-auto font-normal leading-relaxed">
              {t(inspiration.subtitle)}
            </p>
          </ScrollReveal>
          {inspiration.buttonText && (
            <ScrollReveal delay={200} threshold={0.1} width="w-full" className="h-auto" initialScale={0.95}>
              <Link
                to={inspiration.buttonLink || '/'}
                className="group mt-8 inline-flex items-center gap-x-3 text-white font-semibold py-4 px-10 text-xl md:text-2xl rounded-none border border-white/30 hover:border-white hover:bg-white/10 transition-all duration-300"
              >
                <span className="inline-flex justify-center transition-all duration-500 ease-out">
                  <span className="leading-none transition-all duration-500 ease-out md:group-hover:tracking-[0.12em] md:group-hover:text-gray-200">
                    {t(inspiration.buttonText)}
                  </span>
                </span>
              </Link>
            </ScrollReveal>
          )}
        </div>


      </div>
    </>
  )
}