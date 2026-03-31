export const isDarkHeroPage = (p: string): boolean => {
  if (!p) return true
  const path = p.toLowerCase()
  return (
    path === '/' ||
    path === '' ||
    path.startsWith('/about') ||
    path.startsWith('/project/') ||
    path.startsWith('/projects/') ||
    path.startsWith('/categories') ||
    path.startsWith('/products')
  )
}
