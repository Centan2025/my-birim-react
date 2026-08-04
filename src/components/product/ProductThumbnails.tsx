import React, {useRef, useState, useEffect} from 'react'
import {motion} from 'framer-motion'
import {OptimizedImage} from '../OptimizedImage'
import {useTranslation} from '../../i18n'
import type {LocalizedString} from '../../types'

interface ProductThumbnailsProps {
  productName: LocalizedString
  bandMedia: {
    type: 'image' | 'video' | 'youtube'
    url: string
    crop?: {
      x: number
      y: number
      width: number
      height: number
    }
    hotspot?: {
      x: number
      y: number
    }
    isMirrored?: boolean
    isMirroredMobile?: boolean
    isMirroredDesktop?: boolean
  }[]
  currentImageIndex: number
  imageBorderClass: string
  onSelect: (index: number) => void
}

const youTubeThumb = (url: string) => {
  if (!url) return ''
  let id = ''
  if (url.includes('youtube.com/watch?v=')) {
    id = url.split('v=')[1]?.split('&')[0] || ''
  } else if (url.includes('youtu.be/')) {
    id = url.split('youtu.be/')[1]?.split('?')[0] || ''
  } else if (url.includes('youtube.com/embed/')) {
    id = url.split('embed/')[1]?.split('?')[0] || ''
  }
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : ''
}

export const ProductThumbnails: React.FC<ProductThumbnailsProps> = ({
  productName,
  bandMedia,
  currentImageIndex,
  imageBorderClass,
  onSelect,
}) => {
  const {t} = useTranslation()
  const thumbRef = useRef<HTMLDivElement | null>(null)
  const [thumbDragStartX, setThumbDragStartX] = useState<number | null>(null)
  const [thumbScrollStart, setThumbScrollStart] = useState<number>(0)
  const thumbButtonsRef = useRef<(HTMLButtonElement | null)[]>([])

  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isCentering, setIsCentering] = useState(true)

  const checkArrows = () => {
    if (!thumbRef.current) return
    const {scrollLeft, scrollWidth, clientWidth} = thumbRef.current
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth)
    setIsCentering(scrollWidth <= clientWidth)
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    checkArrows()
    const handleResize = () => checkArrows()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [bandMedia])

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <style>{`
                @keyframes thumb-fade-in-right {
                    from { opacity: 0; transform: translateX(40px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
      <div className="mt-1 md:mt-2 border-b border-gray-300 py-3">
        <div className="relative select-none">
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            ref={thumbRef}
            className="scrollbar-hide overflow-x-auto cursor-grab active:cursor-grabbing max-lg:overflow-y-visible"
            role="region"
            aria-label="Thumbnail Slider"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            onScroll={checkArrows}
            onMouseDown={e => {
              setThumbDragStartX(e.clientX)
              setThumbScrollStart(thumbRef.current ? thumbRef.current.scrollLeft : 0)
            }}
            onMouseLeave={() => {
              setThumbDragStartX(null)
            }}
            onMouseUp={() => {
              setThumbDragStartX(null)
            }}
            onMouseMove={e => {
              if (thumbDragStartX === null || !thumbRef.current) return
              const delta = e.clientX - thumbDragStartX
              thumbRef.current.scrollLeft = thumbScrollStart - delta
            }}
            onKeyDown={e => {
              if (!thumbRef.current) return
              if (e.key === 'ArrowLeft') thumbRef.current.scrollBy({left: -50, behavior: 'smooth'})
              if (e.key === 'ArrowRight') thumbRef.current.scrollBy({left: 50, behavior: 'smooth'})
            }}
          >
            <motion.div
              key={`thumbnails-${bandMedia.length}`}
              className={`relative flex gap-3 min-w-max pb-2 ${isCentering ? 'mx-auto w-fit' : ''}`}
              initial="revealOff"
              animate="revealOn"
              variants={{
                revealOff: {opacity: 0},
                revealOn: {opacity: 1, transition: {staggerChildren: 0.1}},
              }}
            >
              {bandMedia.map((m, idx) => (
                <motion.div
                  key={idx}
                  variants={{
                    revealOff: {opacity: 0, x: -50},
                    revealOn: {
                      opacity: 1,
                      x: 0,
                      transition: {type: 'spring', stiffness: 100, damping: 20},
                    },
                  }}
                  className="flex-shrink-0"
                >
                  <button
                    ref={el => {
                      thumbButtonsRef.current[idx] = el
                    }}
                    className={`relative z-20 w-24 h-24 rounded-none transition-all duration-300 ${
                      currentImageIndex === idx
                        ? 'opacity-100'
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                    onClick={() => onSelect(idx)}
                  >
                    <motion.div
                      variants={{
                        revealOff: {scaleX: 0, transformOrigin: 'left'},
                        revealOn: {
                          scaleX: 1,
                          transition: {duration: 0.8, ease: [0.22, 1, 0.36, 1]},
                        },
                      }}
                      className="relative overflow-hidden w-full h-full shadow-sm"
                    >
                      <motion.div
                        variants={{
                          revealOff: {opacity: 0, x: -20},
                          revealOn: {
                            opacity: 1,
                            x: 0,
                            transition: {delay: 0.2, duration: 0.8},
                          },
                        }}
                        className="w-full h-full"
                      >
                        {m.type === 'image' ? (
                          <OptimizedImage
                            src={m.url}
                            alt={`${t(productName)} thumbnail ${idx + 1}`}
                            className={`w-full h-full object-cover ${imageBorderClass}`}
                            loading="lazy"
                            quality={75}
                            crop={m.crop}
                            hotspot={m.hotspot}
                            origWidth={(m as Record<string, unknown>)['origWidth'] as number}
                            origHeight={(m as Record<string, unknown>)['origHeight'] as number}
                            isMirrored={m.isMirrored}
                            isMirroredMobile={m.isMirroredMobile}
                            isMirroredDesktop={m.isMirroredDesktop}
                          />
                        ) : m.type === 'video' ? (
                          <video
                            src={m.url}
                            className={`w-full h-full object-cover ${imageBorderClass}`}
                            muted
                            playsInline
                            preload="metadata"
                            style={{pointerEvents: 'none'}}
                          />
                        ) : (
                          <OptimizedImage
                            src={youTubeThumb(m.url)}
                            alt={`youtube thumb ${idx + 1}`}
                            className={`w-full h-full object-cover ${imageBorderClass}`}
                            loading="lazy"
                            quality={75}
                          />
                        )}
                        {(m.type === 'video' || m.type === 'youtube') && (
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <span className="bg-white/85 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center shadow">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-5 h-5 ml-0.5"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </span>
                          </span>
                        )}
                        {/* Minimal active indicator */}
                        <div
                          className="pointer-events-none absolute -bottom-2 left-0 right-0 h-[3px] bg-gray-500 z-[30] origin-center transition-transform duration-300 ease-out"
                          style={{
                            transform: currentImageIndex === idx ? 'scaleX(1)' : 'scaleX(0)',
                          }}
                        />
                      </motion.div>
                    </motion.div>
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </div>
          {/* Scroll buttons */}
          {!isMobile && showLeftArrow && (
            <button
              aria-label="scroll-left"
              onClick={() => {
                if (thumbRef.current) thumbRef.current.scrollBy({left: -240, behavior: 'smooth'})
              }}
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded transition-transform hover:scale-105 active:scale-95 z-10"
              style={{
                left: '-60px',
                width: '44px',
                height: '44px',
                backgroundColor: 'transparent',
                color: '#4b5563',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="33"
                height="33"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16 20 8 12 16 4" />
              </svg>
            </button>
          )}
          {!isMobile && showRightArrow && (
            <button
              aria-label="scroll-right"
              onClick={() => {
                if (thumbRef.current) thumbRef.current.scrollBy({left: 240, behavior: 'smooth'})
              }}
              className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded transition-transform hover:scale-105 active:scale-95 z-10"
              style={{
                right: '-60px',
                width: '44px',
                height: '44px',
                backgroundColor: 'transparent',
                color: '#4b5563',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="33"
                height="33"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="8 20 16 12 8 4" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
