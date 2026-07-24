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

  return false
}
