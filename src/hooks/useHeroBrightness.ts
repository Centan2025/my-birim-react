import {useState, useEffect, useRef} from 'react'

export function useHeroBrightness(
  isMobile: boolean,
  pathname: string,
  contextBrightness: number | null
) {
  const [heroBrightness, setHeroBrightness] = useState<number | null>(null)
  const heroBrightnessRef = useRef<number | null>(null)

  useEffect(() => {
    if (contextBrightness === null) {
      setHeroBrightness(null)
      heroBrightnessRef.current = null
      return
    }

    const applyPaletteBrightness = () => {
      if (window.scrollY > 0) {
        setHeroBrightness(null)
        heroBrightnessRef.current = null
      } else {
        setHeroBrightness(contextBrightness)
        heroBrightnessRef.current = contextBrightness
      }
    }

    applyPaletteBrightness()
    window.addEventListener('scroll', applyPaletteBrightness, {passive: true})
    return () => window.removeEventListener('scroll', applyPaletteBrightness)
  }, [contextBrightness])

  useEffect(() => {
    if (contextBrightness !== null) return
    if (window.scrollY > 0) {
      setHeroBrightness(null)
      return
    }

    let isCancelled = false

    const checkTopImageBrightness = () => {
      if (pathname !== pathname) {
        // This is a bit redundant but matches the original check logic
        isCancelled = true
        return
      }

      if (window.scrollY > 0) {
        setHeroBrightness(null)
        return
      }

      let activeMedia: HTMLImageElement | HTMLVideoElement | null = null

      const heroContainer = document.querySelector('.hero-scroll-container')
      if (heroContainer) {
        const slides = heroContainer.querySelectorAll('.hero-slide-mobile, [class*="hero-slide"]')
        for (const slide of Array.from(slides)) {
          const img = slide.querySelector('img') as HTMLImageElement
          const video = slide.querySelector('video') as HTMLVideoElement
          if (img && img.complete) {
            activeMedia = img
            break
          } else if (video && video.readyState >= 2) {
            activeMedia = video
            break
          }
        }
      }

      if (!activeMedia) {
        const main = document.querySelector('main')
        if (main) {
          const firstSection = main.querySelector('section, div, img, video') as HTMLElement
          if (firstSection) {
            const img = firstSection.querySelector('img') as HTMLImageElement
            const video = firstSection.querySelector('video') as HTMLVideoElement
            if (img && img.complete && img.offsetTop < 500) activeMedia = img
            else if (video && video.readyState >= 2 && video.offsetTop < 500) activeMedia = video
          }
        }
      }

      if (!activeMedia) {
        const allImages = document.querySelectorAll('img, video')
        for (const media of Array.from(allImages)) {
          const rect = media.getBoundingClientRect()
          if (rect.top >= 0 && rect.top < 500 && rect.left >= 0 && rect.left < window.innerWidth) {
            if (media instanceof HTMLImageElement && media.complete) {
              activeMedia = media
              break
            } else if (media instanceof HTMLVideoElement && media.readyState >= 2) {
              activeMedia = media
              break
            }
          }
        }
      }

      if (!activeMedia) {
        if (!isCancelled) setHeroBrightness(null)
        return
      }

      if (isCancelled) return

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = Math.min(activeMedia.width || activeMedia.offsetWidth || 100, 200)
      canvas.height = Math.min(activeMedia.height || activeMedia.offsetHeight || 100, 200)

      try {
        ctx.drawImage(activeMedia, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        if (isCancelled) return

        let totalBrightness = 0
        let pixelCount = 0
        const sampleRate = 10
        for (let i = 0; i < data.length; i += 4 * sampleRate) {
          if (isCancelled) return
          const r = data[i],
            g = data[i + 1],
            b = data[i + 2]
          if (r !== undefined && g !== undefined && b !== undefined) {
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
            totalBrightness += brightness
            pixelCount++
          }
        }

        if (isCancelled) return
        if (pixelCount > 0) {
          setHeroBrightness(totalBrightness / pixelCount)
        } else {
          setHeroBrightness(null)
        }
      } catch (e) {
        setHeroBrightness(null)
      }
    }

    const immediateTimeoutId = setTimeout(checkTopImageBrightness, 100)
    const timeoutId = setTimeout(checkTopImageBrightness, 500)
    const intervalId = setInterval(checkTopImageBrightness, 2000)

    return () => {
      isCancelled = true
      clearTimeout(immediateTimeoutId)
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [isMobile, pathname, contextBrightness])

  return {heroBrightness, heroBrightnessRef}
}
