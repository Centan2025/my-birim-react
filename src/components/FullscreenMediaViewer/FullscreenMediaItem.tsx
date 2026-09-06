import React from 'react'
import {OptimizedImage} from '../OptimizedImage'
import {OptimizedVideo} from '../OptimizedVideo'
import {MediaItem} from './types'

const toYouTubeEmbed = (url: string) => {
  if (!url) return ''
  let id = ''
  if (url.includes('youtube.com/watch?v=')) {
    id = url.split('v=')[1]?.split('&')[0] || ''
  } else if (url.includes('youtu.be/')) {
    id = url.split('youtu.be/')[1]?.split('?')[0] || ''
  } else if (url.includes('youtube.com/embed/')) {
    id = url.split('embed/')[1]?.split('?')[0] || ''
  }
  return id
    ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&controls=1&playlist=${id}&loop=1`
    : url
}

interface FullscreenMediaItemProps {
  item: MediaItem
  index: number
  isVisible: boolean
  isClosing: boolean
  hasEntered?: boolean
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
  hasEntered,
  animationDelay,
  isMobile,
  isLandscape: _isLandscape,
  itemRef,
}) => {
  if (!item) return null

  const activeUrl = isMobile ? item.urlMobile || item.url : item.urlDesktop || item.url

  const activeCrop = isMobile ? item.cropMobile || item.crop : item.cropDesktop || item.crop

  const activeHotspot = isMobile
    ? item.hotspotMobile || item.hotspot
    : item.hotspotDesktop || item.hotspot

  const activeOrigWidth = isMobile
    ? item.origWidthMobile || item.origWidth
    : item.origWidthDesktop || item.origWidth

  const activeOrigHeight = isMobile
    ? item.origHeightMobile || item.origHeight
    : item.origHeightDesktop || item.origHeight

  const activeIsMirrored = isMobile
    ? Boolean(item.isMirroredMobile || (item.isMirrored && !item.urlMobile))
    : Boolean(item.isMirroredDesktop || (item.isMirrored && !item.urlDesktop))

  return (
    <div
      ref={itemRef}
      className={`flex-shrink-0 flex items-center justify-center ${
        hasEntered && !isClosing
          ? 'opacity-100 translate-y-0 scale-100'
          : `transition-all cubic-bezier(0.23, 1, 0.32, 1) ${
              isVisible && !isClosing
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-12 scale-95'
            }`
      }`}
      style={{
        transitionDelay: hasEntered && !isClosing ? '0ms' : `${animationDelay}ms`,
        transitionDuration: hasEntered && !isClosing ? '0ms' : '500ms',
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
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        padding: '0',
      }}
    >
      {item.type === 'image' ? (
        <OptimizedImage
          src={activeUrl}
          srcMobile={item.urlMobile}
          srcDesktop={item.urlDesktop}
          alt=""
          className="w-full h-full object-contain max-md:object-contain max-lg:object-contain mx-auto my-auto select-none pointer-events-none"
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
            margin: 'auto',
            WebkitBackfaceVisibility: 'hidden',
          }}
          loading="eager"
          quality={100}
          crop={activeCrop}
          cropMobile={item.cropMobile || item.crop}
          cropDesktop={item.cropDesktop || item.crop}
          hotspot={activeHotspot}
          hotspotMobile={item.hotspotMobile || item.hotspot}
          hotspotDesktop={item.hotspotDesktop || item.hotspot}
          origWidth={activeOrigWidth as number}
          origHeight={activeOrigHeight as number}
          origWidthMobile={item.origWidthMobile as number}
          origHeightMobile={item.origHeightMobile as number}
          origWidthDesktop={item.origWidthDesktop as number}
          origHeightDesktop={item.origHeightDesktop as number}
          isMirrored={activeIsMirrored}
          isMirroredMobile={item.isMirroredMobile}
          isMirroredDesktop={item.isMirroredDesktop}
        />
      ) : item.type === 'video' ? (
        <OptimizedVideo
          src={activeUrl}
          srcMobile={item.urlMobile}
          srcDesktop={item.urlDesktop}
          className="w-full h-full object-contain mx-auto my-auto"
          style={{
            maxHeight: '100dvh',
            maxWidth: '100vw',
            width: '100%',
            height: '100%',
            display: 'block',
            margin: 'auto',
            objectFit: 'contain',
            objectPosition: 'center',
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
          className="w-full h-full max-w-[100vw] max-h-[100dvh] mx-auto my-auto"
          title={`fullscreen-media-youtube-${index}`}
          src={toYouTubeEmbed(item.url)}
          allow="autoplay; encrypted-media; fullscreen"
          frameBorder="0"
          style={{
            height: '100dvh',
            width: '100vw',
            aspectRatio: '16/9',
            margin: 'auto',
          }}
        />
      )}
    </div>
  )
}
