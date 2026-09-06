import React from 'react'

interface FullscreenControlsProps {
  isMobile: boolean
  isLandscape: boolean
  isClosing: boolean
  isButtonVisible: boolean
  handleClose: () => void
  onPrev?: () => void
  onNext?: () => void
  showScrollToTop?: boolean
  handleScrollToTop?: () => void
  slideCount: number
}

export const FullscreenControls: React.FC<FullscreenControlsProps> = ({
  isMobile,
  isLandscape,
  isClosing,
  isButtonVisible,
  handleClose,
  onPrev,
  onNext,
  showScrollToTop,
  handleScrollToTop,
  slideCount,
}) => {
  return (
    <>
      {/* Kapatma Düğmesi */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-end px-4 py-2 md:py-3 z-10"
        style={{
          opacity: isClosing ? 0 : 1,
          transition: 'opacity 300ms ease-in-out',
          transitionDelay: isClosing ? (isMobile ? '200ms' : '0ms') : '0ms',
          paddingTop: isMobile ? 'max(8px, env(safe-area-inset-top, 0px))' : undefined,
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          className={`group flex items-center justify-center rounded-none border border-white/80 bg-black/60 text-white backdrop-blur-md transition-all duration-300 hover:bg-black/80 active:scale-95 shadow-xl ${
            isMobile ? 'h-12 w-12' : 'h-14 w-14'
          }`}
          style={{
            opacity: isClosing ? 0 : isButtonVisible ? 1 : 0,
            transform: isButtonVisible && !isClosing ? 'scale(1)' : 'scale(0)',
            transition:
              'opacity 700ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            willChange: 'transform, opacity',
          }}
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={isMobile ? '1.5' : '1.0'}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${isMobile ? 'h-7 w-7' : 'h-8 w-8'} text-white transition-transform duration-300 group-hover:rotate-90`}
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigasyon Düğmeleri (Ekranın Altında, Yan Yana ve Yatayda Tam Ortalanmış) */}
      {slideCount > 1 && (
        <div
          className="absolute flex items-center justify-center gap-3 z-20 pointer-events-auto"
          style={{
            left: '50%',
            bottom: isMobile ? 'max(16px, env(safe-area-inset-bottom, 0px) + 12px)' : '32px',
            opacity: isButtonVisible && !isClosing ? 1 : 0,
            transform: `translateX(-50%) ${isButtonVisible && !isClosing ? 'translateY(0)' : 'translateY(24px)'}`,
            transition:
              'opacity 700ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            willChange: 'transform, opacity',
          }}
        >
          {/* Önceki Düğmesi */}
          <button
            type="button"
            onClick={onPrev}
            className={`group flex items-center justify-center rounded-none border border-white/80 bg-black/60 text-white backdrop-blur-md transition-all duration-300 hover:bg-black/80 active:scale-95 shadow-xl ${
              isMobile ? 'h-12 w-12' : 'h-14 w-14'
            }`}
            aria-label="Previous"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={isMobile ? '1.5' : '0.8'}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`${isMobile ? 'h-7 w-7' : 'h-9 w-9'} text-white -ml-0.5 transition-transform duration-300 group-hover:-translate-x-1`}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Sonraki Düğmesi */}
          <button
            type="button"
            onClick={onNext}
            className={`group flex items-center justify-center rounded-none border border-white/80 bg-black/60 text-white backdrop-blur-md transition-all duration-300 hover:bg-black/80 active:scale-95 shadow-xl ${
              isMobile ? 'h-12 w-12' : 'h-14 w-14'
            }`}
            aria-label="Next"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={isMobile ? '1.5' : '0.8'}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`${isMobile ? 'h-7 w-7' : 'h-9 w-9'} text-white ml-0.5 transition-transform duration-300 group-hover:translate-x-1`}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      {/* Mobil Yukar-Git Düğmesi */}
      {isMobile && !isLandscape && (
        <button
          type="button"
          onClick={handleScrollToTop}
          className={`absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-none border border-white/80 bg-black/60 text-white backdrop-blur-md transition-all duration-300 z-30 shadow-xl ${
            showScrollToTop
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          style={{
            bottom: 'max(24px, env(safe-area-inset-bottom, 0px) + 16px)',
          }}
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-white -mt-0.5"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
      )}
    </>
  )
}
