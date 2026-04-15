import React from 'react'
import { OptimizedImage } from '../OptimizedImage'
import { OptimizedVideo } from '../OptimizedVideo'
import { MediaItem } from './types'

interface FullscreenMediaItemProps {
  item: MediaItem
  index: number
  isVisible: boolean
  isClosing: boolean
  animationDelay: number
  isMobile: boolean
  isLandscape: boolean
  itemRef: (el: HTMLDivElement | null) => void
}

export const FullscreenMediaItem: React.FC<FullscreenMediaItemProps> = ({
  item,
  index,
  isVisible,
  isClosing,
  animationDelay,
  isMobile,
  isLandscape,
  itemRef,
}) => {
  if (!item) return null

  // Desktop ve mobil landscape için sabit yükseklik hesapla
  const fixedHeight =
    isMobile && isLandscape ? 'calc(100dvh - 12px)' : !isMobile ? 'calc(100vh - 16px)' : 'auto'

  const itemWidth = isMobile && isLandscape ? 'auto' : !isMobile ? 'auto' : '100%'

  return (
    <div
      ref={itemRef}
      className={`flex-shrink-0 flex items-center justify-center transition-all cubic-bezier(0.23, 1, 0.32, 1) ${isVisible && !isClosing
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-12 scale-95'
        }`}
      style={{
        transitionDelay: `${animationDelay}ms`,
        transitionDuration: '500ms',
        height: fixedHeight,
        minHeight: fixedHeight === 'auto' ? 'auto' : fixedHeight,
        maxHeight: fixedHeight === 'auto' ? 'none' : fixedHeight,
        width: itemWidth,
        minWidth: isMobile && isLandscape ? '0' : !isMobile ? '0' : '100%',
        maxWidth: isMobile && isLandscape ? 'none' : !isMobile ? 'none' : '100%',
        marginTop: isMobile && isLandscape ? '0' : isMobile ? (index === 0 ? '0' : '2px') : '0',
        marginBottom: isMobile && isLandscape ? '0' : '0',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        scrollSnapAlign: (isMobile && isLandscape) || !isMobile ? 'start' : 'none',
      }}
    >
      {item.type === 'image' ? (
        <OptimizedImage
          src={item.url}
          srcMobile={item.urlMobile}
          srcDesktop={item.urlDesktop}
          alt=""
          className="h-full w-auto max-w-none"
          sizes="100vw"
          fetchPriority="high"
          style={{
            height: fixedHeight === 'auto' ? 'auto' : '100%',
            maxHeight: fixedHeight === 'auto' ? 'none' : '100%',
            maxWidth: 'none',
            width:
              isMobile && isLandscape ? 'auto' : fixedHeight === 'auto' ? '100%' : 'fit-content',
            minWidth: isMobile && isLandscape ? '0' : 'auto',
            display: 'block',
            WebkitBackfaceVisibility: 'hidden'
          }}
          loading="eager"
          quality={100}
          crop={item.crop}
          hotspot={item.hotspot}
        />
      ) : item.type === 'video' ? (
        <OptimizedVideo
          src={item.url}
          srcMobile={item.urlMobile}
          srcDesktop={item.urlDesktop}
          className="h-full w-auto max-w-none"
          style={{
            height: fixedHeight === 'auto' ? 'auto' : '100%',
            maxHeight: fixedHeight === 'auto' ? 'none' : '100%',
            maxWidth: 'none',
            width:
              isMobile && isLandscape ? 'auto' : fixedHeight === 'auto' ? '100%' : 'fit-content',
            minWidth: isMobile && isLandscape ? '0' : 'auto',
            display: 'block',
          }}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          loading="eager"
        />
      ) : (
        <iframe
          className="w-full h-full"
          title={`fullscreen-media-youtube-${index}`}
          src={item.url}
          allow="autoplay; encrypted-media; fullscreen"
          frameBorder="0"
          style={{
            height: fixedHeight === 'auto' ? '60vh' : '100%',
            width: isMobile && isLandscape ? 'auto' : fixedHeight === 'auto' ? '100%' : 'auto',
            maxWidth: isMobile && isLandscape ? 'none' : 'none',
            minWidth: isMobile && isLandscape ? '0' : 'auto',
            aspectRatio: '16/9',
          }}
        />
      )}
    </div>
  )
}
