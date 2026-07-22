export const isDarkHeroPage = (p: string): boolean => {
  if (!p) return true
  const path = p.toLowerCase()
  if (
    path === '/' ||
    path === '' ||
    path.startsWith('/about') ||
    path.startsWith('/project/') ||
    path.startsWith('/projects/')
  ) {
    return true
  }
  if (typeof document !== 'undefined' && document.querySelector('.hero-section')) {
    return true
  }
  return false
}
