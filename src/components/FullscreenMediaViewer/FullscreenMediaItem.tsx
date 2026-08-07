import React from 'react'
import {OptimizedImage} from '../OptimizedImage'
import {OptimizedVideo} from '../OptimizedVideo'
import {MediaItem} from './types'

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
    isMobile && isLandscape ? 'calc(100dvh - 12px)' : !isMobile ? 'calc(100dvh - 24px)' : 'auto'

  const itemWidth = isMobile && !isLandscape ? '100vw' : '100vw'

  return (
    <div
      ref={itemRef}
      className={`flex-shrink-0 flex items-center justify-center transition-all cubic-bezier(0.23, 1, 0.32, 1) ${
        isVisible && !isClosing
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
        minWidth: itemWidth,
        maxWidth: itemWidth,
        marginTop: isMobile && isLandscape ? '0' : isMobile ? (index === 0 ? '0' : '2px') : '0',
        marginBottom: '0',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        scrollSnapAlign: 'center',
        scrollSnapStop: 'always',
      }}
    >
      {item.type === 'image' ? (
        <OptimizedImage
          src={item.url}
          srcMobile={item.urlMobile}
          srcDesktop={item.urlDesktop}
          alt=""
          className="max-h-[85vh] max-w-[90vw] object-contain mx-auto"
          sizes="100vw"
          fetchPriority="high"
          style={{
            height: fixedHeight === 'auto' ? 'auto' : '100%',
            maxHeight: fixedHeight === 'auto' ? 'none' : '85vh',
            maxWidth: '90vw',
            width: 'auto',
            display: 'block',
            WebkitBackfaceVisibility: 'hidden',
            objectFit: 'contain',
          }}
          loading="eager"
          quality={100}
          crop={item.crop}
          hotspot={item.hotspot}
          origWidth={item.origWidth as number}
          origHeight={item.origHeight as number}
          isMirrored={item.isMirrored}
          isMirroredMobile={item.isMirroredMobile}
          isMirroredDesktop={item.isMirroredDesktop}
        />
      ) : item.type === 'video' ? (
        <OptimizedVideo
          src={item.url}
          srcMobile={item.urlMobile}
          srcDesktop={item.urlDesktop}
          className="max-h-[85vh] max-w-[90vw] object-contain mx-auto"
          style={{
            height: fixedHeight === 'auto' ? 'auto' : '100%',
            maxHeight: fixedHeight === 'auto' ? 'none' : '85vh',
            maxWidth: '90vw',
            width: 'auto',
            display: 'block',
            objectFit: 'contain',
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
          className="max-h-[85vh] max-w-[90vw]"
          title={`fullscreen-media-youtube-${index}`}
          src={item.url}
          allow="autoplay; encrypted-media; fullscreen"
          frameBorder="0"
          style={{
            height: fixedHeight === 'auto' ? '60vh' : '85vh',
            width: '90vw',
            aspectRatio: '16/9',
          }}
        />
      )}
    </div>
  )
}
