// Ortak (shared) Dark Hero Page check logic
export const isDarkHeroPage = (p: string): boolean => {
  return (
    p === '/' ||
    p === '' ||
    p.startsWith('/about') ||
    p === '/products' ||
    p === '/categories' ||
    p.startsWith('/product/') ||
    p.startsWith('/projects/') ||
    p.startsWith('/project/') ||
    /^\/products\/[^/]+$/.test(p) ||
    /^\/product\/[^/]+$/.test(p)
  )
}
