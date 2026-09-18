export function getAdminApiUrl(path: string): string {
  if (typeof window === 'undefined') return path
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.endsWith('.local')

  const cleanPath = path.startsWith('/') ? path : `/${path}`
  if (isLocal) {
    return `http://localhost:3002${cleanPath}`
  }
  return `https://www.birim.com${cleanPath}`
}
