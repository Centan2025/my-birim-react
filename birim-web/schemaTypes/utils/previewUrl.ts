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

  if (url.startsWith('migration/')) {
    return `${domain}/${url}`.replace(/ /g, '%20')
  }

  if (url.includes('.r2.dev') && !domain.includes('.r2.dev')) {
    try {
      const parsed = new URL(url)
      const path = parsed.pathname.startsWith('/') ? parsed.pathname.substring(1) : parsed.pathname
      return `${domain}/${path}`.replace(/ /g, '%20')
    } catch (e) {}
  }

  return url.replace(/ /g, '%20')
}
