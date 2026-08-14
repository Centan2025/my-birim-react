export const isDarkHeroPage = (p: string): boolean => {
  if (!p) return false
  const path = p.toLowerCase()

  // Ürün ve Ürün Listesi sayfaları her zaman açık renktir (header elemanları siyah olmalı)
  if (path.startsWith('/product') || path.startsWith('/products')) {
    return false
  }

  // Koyu hero kapak görseli olan sayfalar (Ana Sayfa, Hakkımızda, Projeler)
  if (
    path === '/' ||
    path === '' ||
    path.startsWith('/about') ||
    path.startsWith('/project/') ||
    path.startsWith('/projects/')
  ) {
    return true
  }

  // Fabrika sayfası: Sadece V2 (karanlık sinematik hero) koyu hero kabul edilir
  if (path.startsWith('/factory')) {
    if (typeof window !== 'undefined') {
      const search = window.location.search || window.location.hash
      if (
        search.includes('v=3') ||
        search.includes('v=v3') ||
        search.includes('v=1') ||
        search.includes('v=v1')
      ) {
        return false
      }
      if (search.includes('v=2') || search.includes('v=v2')) {
        return true
      }
    }
    if (typeof document !== 'undefined') {
      const hero = document.querySelector('.hero-section')
      if (hero) return true
    }
    return false
  }

  return false
}
