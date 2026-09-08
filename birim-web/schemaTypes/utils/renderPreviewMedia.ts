import React from 'react'

/**
 * Medya önizlemeleri için yardımcı fonksiyon.
 * Görselse <img>, videosa <video> elementi döner.
 */
export const renderPreviewMedia = (
  url: string | undefined,
  type?: string,
  isMirrored?: boolean,
) => {
  if (!url) return undefined

  const isVideo = type === 'video' || Boolean(url.match(/\.(mp4|webm|ogg|mov)$/i))
  const transformStyle = isMirrored ? 'scaleX(-1)' : 'none'

  // Eğer url bir görsel değilse ve tip videosa video elementi kullan
  if (isVideo && !url.match(/\.(webp|jpg|jpeg|png|gif|avif)$/i)) {
    return () =>
      React.createElement('video', {
        src: url,
        style: {width: '100%', height: '100%', objectFit: 'cover', transform: transformStyle},
        autoPlay: false,
        muted: true,
        playsInline: true,
        preload: 'metadata',
      })
  }

  return () =>
    React.createElement('img', {
      src: url,
      style: {width: '100%', height: '100%', objectFit: 'cover', transform: transformStyle},
    })
}
