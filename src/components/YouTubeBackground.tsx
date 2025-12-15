import React from 'react'
import {useTranslation} from '../i18n'

const getYouTubeId = (url: string): string | null => {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2] && match[2].length === 11 ? match[2] : null
}

interface YouTubeBackgroundProps {
  url: string
  isMobile?: boolean
}

export const YouTubeBackground: React.FC<YouTubeBackgroundProps> = ({url, isMobile = false}) => {
  const {t} = useTranslation()
  const videoId = getYouTubeId(url)

  if (!videoId) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <p className="text-white">{t('invalid_youtube_url')}</p>
      </div>
    )
  }

  return (
    <div
      className="absolute top-0 left-0 w-full h-full overflow-hidden"
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: 0,
      }}
    >
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        title="youtube-background"
        style={{
          pointerEvents: 'none',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          border: 'none',
          ...(isMobile
            ? {
                minWidth: '100%',
                maxWidth: '100%',
              }
            : {
                minWidth: '100%',
                minHeight: '100%',
                objectFit: 'cover',
              }),
        }}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&autohide=1&modestbranding=1&rel=0`}
        frameBorder="0"
        allow="autoplay; encrypted-media; fullscreen"
      ></iframe>
    </div>
  )
}
