// Helper to resolve absolute URLs for Sanity Studio previews
export const getPreviewUrl = (url?: string): string => {
  if (!url) return ''

  let domain = 'https://assets.birim.com'
  try {
    if (typeof process !== 'undefined' && process.env && process.env.SANITY_STUDIO_R2_DOMAIN) {
      domain = process.env.SANITY_STUDIO_R2_DOMAIN
    }
  } catch (e) {}

  if (url.startsWith('/')) {
    url = url.substring(1)
  }

  const r2Folders = [
    'uploads/',
    'bulk-uploads/',
    'products/',
    'designers/',
    'projects/',
    'news/',
    'materials/',
    'home/',
    'factory/',
  ]

  if (!url.startsWith('migration/')) {
    const folder = r2Folders.find((f) => url.startsWith(f))
    if (folder) {
      url = `migration/${url}`
    }
  }

  if (url.startsWith('migration/')) {
    return `${domain}/${url}`.replace(/ /g, '%20')
  }

  if (
    (url.includes('.r2.dev') || url.includes('.workers.dev')) &&
    !domain.includes(new URL(url).hostname)
  ) {
    try {
      const parsed = new URL(url)
      let path = parsed.pathname.startsWith('/') ? parsed.pathname.substring(1) : parsed.pathname

      // Also check path for prefixing
      if (!path.startsWith('migration/')) {
        const folder = r2Folders.find((f) => path.startsWith(f))
        if (folder) {
          path = `migration/${path}`
        }
      }

      return `${domain}/${path}`.replace(/ /g, '%20')
    } catch (e) {}
  }

  return url.replace(/ /g, '%20')
}
