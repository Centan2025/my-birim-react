import { useEffect } from 'react'

/**
 * Google Fonts'u dinamik olarak yükler
 * @param fontName - Google Fonts'tan yüklenecek font adı (örn: "Playfair Display", "Roboto")
 */
export function useGoogleFont(fontName: string | undefined) {
  useEffect(() => {
    if (!fontName || typeof window === 'undefined') return

    // Standart fontlar için yükleme yapma
    if (fontName === 'normal' || fontName === 'serif' || fontName === 'mono') {
      return
    }

    // Font zaten yüklenmiş mi kontrol et
    const fontId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`
    const existingLink = document.getElementById(fontId)
    if (existingLink) {
      return
    }

    // Google Fonts URL'ini oluştur
    // Font adındaki boşlukları + ile değiştir
    const fontFamily = fontName.replace(/\s+/g, '+')
    const href = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@200;300;400;500;600;700&display=swap`

    // Link elementi oluştur ve ekle
    const link = document.createElement('link')
    link.id = fontId
    link.rel = 'stylesheet'
    link.href = href
    link.crossOrigin = 'anonymous'

    // Preconnect ekle (eğer yoksa)
    const preconnectGoogle = document.querySelector('link[href="https://fonts.googleapis.com"]')
    if (!preconnectGoogle) {
      const preconnect1 = document.createElement('link')
      preconnect1.rel = 'preconnect'
      preconnect1.href = 'https://fonts.googleapis.com'
      document.head.appendChild(preconnect1)
    }

    const preconnectGstatic = document.querySelector('link[href="https://fonts.gstatic.com"]')
    if (!preconnectGstatic) {
      const preconnect2 = document.createElement('link')
      preconnect2.rel = 'preconnect'
      preconnect2.href = 'https://fonts.gstatic.com'
      preconnect2.crossOrigin = 'anonymous'
      document.head.appendChild(preconnect2)
    }

    document.head.appendChild(link)

    // Cleanup function
    return () => {
      const linkToRemove = document.getElementById(fontId)
      if (linkToRemove) {
        linkToRemove.remove()
      }
    }
  }, [fontName])
}

/**
 * Birden fazla Google Font'u yükler
 * @param fontNames - Yüklenecek font adları dizisi
 */
export function useGoogleFonts(fontNames: (string | undefined)[]) {
  useEffect(() => {
    if (!fontNames || fontNames.length === 0 || typeof window === 'undefined') return

    // Standart fontları filtrele
    const googleFonts = fontNames.filter(
      (font) => font && font !== 'normal' && font !== 'serif' && font !== 'mono'
    ) as string[]

    if (googleFonts.length === 0) return

    // Benzersiz fontları al
    const uniqueFonts = [...new Set(googleFonts)]

    // Her font için yükleme işlemi
    uniqueFonts.forEach((fontName) => {
      const fontId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`
      const existingLink = document.getElementById(fontId)
      if (existingLink) {
        return
      }

      const fontFamily = fontName.replace(/\s+/g, '+')
      const href = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@200;300;400;500;600;700&display=swap`

      const link = document.createElement('link')
      link.id = fontId
      link.rel = 'stylesheet'
      link.href = href
      link.crossOrigin = 'anonymous'

      document.head.appendChild(link)
    })

    // Preconnect ekle (eğer yoksa)
    const preconnectGoogle = document.querySelector('link[href="https://fonts.googleapis.com"]')
    if (!preconnectGoogle) {
      const preconnect1 = document.createElement('link')
      preconnect1.rel = 'preconnect'
      preconnect1.href = 'https://fonts.googleapis.com'
      document.head.appendChild(preconnect1)
    }

    const preconnectGstatic = document.querySelector('link[href="https://fonts.gstatic.com"]')
    if (!preconnectGstatic) {
      const preconnect2 = document.createElement('link')
      preconnect2.rel = 'preconnect'
      preconnect2.href = 'https://fonts.gstatic.com'
      preconnect2.crossOrigin = 'anonymous'
      document.head.appendChild(preconnect2)
    }
  }, [fontNames])
}

