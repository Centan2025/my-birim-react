export const isDarkHeroPage = (p: string): boolean => {
  if (!p) return false
  const path = p.toLowerCase()

  // Ürün ve Ürün Listesi sayfaları her zaman açık renktir (header elemanları siyah olmalı)
  if (path.startsWith('/product') || path.startsWith('/products')) {
    return false
  }

  // Proje Detay sayfaları: V3 (beyaz versiyon) seçiliyse header elemanları siyah olmalı (isDarkHero = false)
  if (path.startsWith('/project/') || path.startsWith('/projects/')) {
    if (typeof window !== 'undefined') {
      const search = window.location.search || window.location.hash
      if (search.includes('v=3') || search.includes('v=v3')) {
        return false
      }
    }
    return true
  }

  // Tasarımcılar V2 sayfası (koyu / tam ekran editoryal akış)
  if (path.startsWith('/designers')) {
    if (typeof window !== 'undefined') {
      const search = window.location.search || window.location.hash
      if (
        search.includes('v=2') ||
        search.includes('v=v2') ||
        localStorage.getItem('birim_designers_view_version') === 'v2'
      ) {
        return true
      }
    }
  }

  // Projeler V4 sayfası (tam ekran dikey akış - Header şeffaf ve beyaz elemanlar)
  if (path.startsWith('/projects') || path.startsWith('/projeler')) {
    if (typeof window !== 'undefined') {
      const search = window.location.search || window.location.hash
      if (
        search.includes('v=4') ||
        search.includes('v=v4') ||
        search.includes('v=fullscreen') ||
        localStorage.getItem('birim_projects_view_version') === 'v4'
      ) {
        return true
      }
    }
  }

  // Koyu hero kapak görseli olan sayfalar (Ana Sayfa, Hakkımızda, Üretim/Fabrika)
  if (
    path === '/' ||
    path === '' ||
    path.startsWith('/about') ||
    path.startsWith('/factory') ||
    path.startsWith('/uretim')
  ) {
    return true
  }

  return false
}
