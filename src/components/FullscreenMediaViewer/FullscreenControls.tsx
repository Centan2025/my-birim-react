import React from 'react'

interface FullscreenControlsProps {
  isMobile: boolean
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
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          className="group flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-gray-950 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95 shadow-lg"
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
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-7 w-7 transition-all duration-500 ease-in-out ${
              isButtonVisible && !isClosing ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
            }`}
            style={{
              transform: isButtonVisible && !isClosing ? 'rotate(0deg)' : 'rotate(90deg)',
              transitionDelay: isClosing ? (isMobile ? '200ms' : '0ms') : '0ms',
            }}
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Navigasyon Düğmeleri (Desktop) */}
      {!isMobile && slideCount > 1 && (
        <div
          className="flex absolute left-1/2 -translate-x-1/2 items-center gap-4 z-20"
          style={{
            bottom: '32px',
            opacity: isButtonVisible && !isClosing ? 1 : 0,
            transform: `translateX(-50%) ${isButtonVisible && !isClosing ? 'translateY(0)' : 'translateY(40px)'}`,
            transition:
              'opacity 700ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            willChange: 'transform, opacity',
          }}
        >
          <button
            type="button"
            onClick={onPrev}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-gray-950 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95 shadow-lg"
            aria-label="Previous"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 -ml-0.5 transition-transform duration-300 group-hover:-translate-x-0.5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNext}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-gray-950 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95 shadow-lg"
            aria-label="Next"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 ml-0.5 transition-transform duration-300 group-hover:translate-x-0.5"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      {/* Mobil Yukar-Git Düğmesi */}
      {isMobile && (
        <button
          type="button"
          onClick={handleScrollToTop}
          className={`absolute bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-gray-950 backdrop-blur-md transition-all duration-300 z-30 shadow-lg ${
            showScrollToTop
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 -mt-0.5"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
      )}
    </>
  )
}
