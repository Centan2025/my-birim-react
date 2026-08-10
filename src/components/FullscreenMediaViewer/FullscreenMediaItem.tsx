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
  isMobile: _isMobile,
  isLandscape: _isLandscape,
  itemRef,
}) => {
  if (!item) return null

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
        height: '100dvh',
        width: '100vw',
        minWidth: '100vw',
        maxWidth: '100vw',
        marginTop: '0',
        marginBottom: '0',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        scrollSnapAlign: 'center',
        scrollSnapStop: 'always',
        padding: '0',
      }}
    >
      {item.type === 'image' ? (
        <OptimizedImage
          src={item.url}
          srcMobile={item.urlMobile}
          srcDesktop={item.urlDesktop}
          alt=""
          className="w-full h-full object-contain mx-auto select-none pointer-events-none"
          sizes="100vw"
          fetchPriority="high"
          style={{
            maxHeight: '100dvh',
            maxWidth: '100vw',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
          className="w-full h-full object-contain mx-auto"
          style={{
            maxHeight: '100dvh',
            maxWidth: '100vw',
            width: '100%',
            height: '100%',
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
          className="w-full h-full max-w-[100vw] max-h-[100dvh]"
          title={`fullscreen-media-youtube-${index}`}
          src={item.url}
          allow="autoplay; encrypted-media; fullscreen"
          frameBorder="0"
          style={{
            height: '100dvh',
            width: '100vw',
            aspectRatio: '16/9',
          }}
        />
      )}
    </div>
  )
}
