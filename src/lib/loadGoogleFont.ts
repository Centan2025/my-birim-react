/**
 * Google Font'u dinamik olarak yükler
 */
const loadedFonts = new Set<string>()

export function loadGoogleFont(fontFamily: string): void {
  // Varsayılan fontlar için yükleme yapma
  if (fontFamily === 'normal' || fontFamily === 'serif' || fontFamily === 'mono') {
    return
  }

  // Zaten yüklenmişse tekrar yükleme
  if (loadedFonts.has(fontFamily)) {
    return
  }

  // Font adında boşluk varsa + ile değiştir (Google Fonts API formatı)
  const fontName = fontFamily.replace(/\s+/g, '+')
  
  // Link elementi oluştur
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;700&display=swap`
  link.crossOrigin = 'anonymous'
  
  // Head'e ekle
  document.head.appendChild(link)
  
  // Yüklenmiş fontları takip et
  loadedFonts.add(fontFamily)
}

/**
 * Font family CSS değerini döndürür
 */
export function getFontFamily(fontFamily: string): string {
  // Varsayılan fontlar için Tailwind class'ları
  if (fontFamily === 'serif') {
    return 'font-serif'
  }
  if (fontFamily === 'mono') {
    return 'font-mono'
  }
  if (fontFamily === 'normal') {
    return 'font-sans'
  }

  // Google Font için font-family CSS değeri
  // Fallback fontlar ekle
  const category = getFontCategory(fontFamily)
  return `"${fontFamily}", ${category}`
}

/**
 * Font kategorisini tahmin et (fallback için)
 */
function getFontCategory(fontFamily: string): string {
  const lower = fontFamily.toLowerCase()
  
  // Serif fontlar
  if (lower.includes('serif') || lower.includes('display') || lower.includes('slab')) {
    return 'serif'
  }
  
  // Monospace fontlar
  if (lower.includes('mono') || lower.includes('code')) {
    return 'monospace'
  }
  
  // Varsayılan: sans-serif
  return 'sans-serif'
}

