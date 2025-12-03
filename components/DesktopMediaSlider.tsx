import React, {useEffect, useMemo, useState} from 'react'
import {OptimizedImage} from './OptimizedImage'
import {OptimizedVideo} from './OptimizedVideo'
import type {ContactLocationMedia} from '../types'

type MediaItem = ContactLocationMedia

interface DesktopMediaSliderProps {
  items: MediaItem[]
  activeIndex: number
}

export const DesktopMediaSlider: React.FC<DesktopMediaSliderProps> = ({
  items,
  activeIndex,
}) => {
  const [slideIndex, setSlideIndex] = useState(() => {
    if (!items || items.length <= 1) return 0
    const safe = Math.max(0, Math.min(activeIndex, items.length - 1))
    return safe + 1 // [last, ...items, first] dizisinde gerçek index +1
  })
  const [transitionEnabled, setTransitionEnabled] = useState(true)

  const slideCount = items.length

  const cloned = useMemo(() => {
    if (!items || items.length <= 1) return items || []
    const first = items[0]
    const last = items[items.length - 1]
    return [last, ...items, first]
  }, [items])

  const totalSlides = cloned.length || 1

  useEffect(() => {
    if (!items || items.length === 0) return
    const safe = Math.max(0, Math.min(activeIndex, items.length - 1))
    if (items.length > 1) {
      setSlideIndex(safe + 1)
    } else {
      setSlideIndex(0)
    }
  }, [activeIndex, items])

  const getUrl = (m: MediaItem): string => {
    if (m.type === 'image') {
      if (m.url) return m.url
      if (m.image?.asset?.url) return m.image.asset.url
    }
    if (m.type === 'video') {
      if (m.url) return m.url
      if (m.videoFile?.asset?.url) return m.videoFile.asset.url
    }
    if (m.type === 'youtube' && m.url) {
      const match = m.url.match(
        /(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([^"&?/\s]{11})/
      )
      const id = match && match[1]
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : m.url
    }
    return ''
  }

  const handleTransitionEnd = () => {
    if (slideCount <= 1) return
    if (!transitionEnabled) return

    if (slideIndex === totalSlides - 1) {
      // sağdaki clone'dan ilk gerçeğe
      setTransitionEnabled(false)
      setSlideIndex(1)
      return
    }
    if (slideIndex === 0) {
      // soldaki clone'dan son gerçeğe
      setTransitionEnabled(false)
      setSlideIndex(totalSlides - 2)
    }
  }

  useEffect(() => {
    if (!transitionEnabled) {
      const id = requestAnimationFrame(() => {
        setTransitionEnabled(true)
      })
      return () => cancelAnimationFrame(id)
    }
    return
  }, [transitionEnabled])

  if (!items || items.length === 0) return null

  return (
    <div className="relative w-full h-full">
      <div className="relative max-h-full max-w-full overflow-hidden flex items-center justify-center w-full h-full">
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            width: `${totalSlides * 100}%`,
            transform: `translateX(-${
              (slideIndex * 100) / totalSlides
            }%)`,
            transition: transitionEnabled ? 'transform 0.3s ease-out' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {cloned.map((item, idx) => {
            const url = getUrl(item)
            return (
              <div
                key={idx}
                className="relative h-full w-full shrink-0 flex items-center justify-center"
                style={{width: `${100 / totalSlides}%`}}
              >
                {item.type === 'youtube' ? (
                  <iframe
                    src={url}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media; fullscreen"
                    frameBorder="0"
                    title={`contact-media-${idx}`}
                  />
                ) : item.type === 'video' ? (
                  <OptimizedVideo
                    src={url}
                    controls
                    autoPlay
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                    preload="auto"
                    loading="eager"
                  />
                ) : (
                  <OptimizedImage
                    src={url}
                    alt=""
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                    loading="eager"
                    quality={95}
                    draggable={false}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


