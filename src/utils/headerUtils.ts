// Ortak (shared) Dark Hero Page check logic
export const isDarkHeroPage = (p: string): boolean => {
  if (!p) return true
  const path = p.toLowerCase()
  return (
    path === '/' ||
    path === '' ||
    path.startsWith('/about') ||
    path.startsWith('/project/') ||
    (path.startsWith('/projects/') && path !== '/projects' && path !== '/projects/') ||
    path === '/products' ||
    path === '/categories'
  )
}
