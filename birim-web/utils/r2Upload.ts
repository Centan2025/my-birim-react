const R2_DOMAIN = (
  (typeof process !== 'undefined' && process.env?.['SANITY_STUDIO_R2_DOMAIN']) ||
  'https://assets.birim.com'
).trim()

export async function uploadToR2(
  blob: Blob | File,
  key: string,
  contentType: string,
): Promise<string> {
  const domainToUse = R2_DOMAIN.startsWith('http') ? R2_DOMAIN : `https://${R2_DOMAIN}`
  const finalFileUrl = `${domainToUse}/${key}`

  // Presigned URL flow (Zero master credentials on client)
  const lastSlash = key.lastIndexOf('/')
  const folder = key.substring(0, lastSlash)
  const filename = key.substring(lastSlash + 1)

  let studioToken =
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.['SANITY_STUDIO_SANITY_TOKEN']) ||
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.['SANITY_STUDIO_MEDIA_ADMIN_SECRET']) ||
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.['SANITY_STUDIO_API_SECRET']) ||
    (typeof process !== 'undefined' && process.env
      ? process.env.SANITY_STUDIO_SANITY_TOKEN ||
        process.env.SANITY_STUDIO_MEDIA_ADMIN_SECRET ||
        process.env.SANITY_STUDIO_API_SECRET
      : '') ||
    ''

  if (!studioToken && typeof window !== 'undefined' && window.localStorage) {
    studioToken =
      window.localStorage.getItem('SANITY_STUDIO_SANITY_TOKEN') ||
      window.localStorage.getItem('SANITY_TOKEN') ||
      window.localStorage.getItem('sanity_admin_token') ||
      ''
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-sanity-studio': 'birim',
  }
  if (studioToken) {
    headers['Authorization'] = `Bearer ${studioToken}`
  }

  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.startsWith('10.') ||
      window.location.hostname.endsWith('.local'))

  const apiBase = isLocal
    ? `${window.location.protocol || 'http:'}//${window.location.hostname}:3002`
    : 'https://www.birim.com'

  let res: Response
  try {
    res = await fetch(`${apiBase}/api/media/presigned-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify({filename, contentType, folder}),
    })
  } catch (fetchErr) {
    // Fallback to secondary production url if primary fails or if local API server is not running
    try {
      res = await fetch('https://birim-web-antigravity.vercel.app/api/media/presigned-url', {
        method: 'POST',
        headers,
        body: JSON.stringify({filename, contentType, folder}),
      })
    } catch {
      throw fetchErr
    }
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.error || `Presigned URL isteği başarısız: ${res.statusText}`)
  }

  const {uploadUrl, fileUrl} = await res.json()
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {'Content-Type': contentType},
    body: blob,
  })

  if (!uploadRes.ok) {
    throw new Error(`R2 dosya yükleme başarısız (${uploadRes.status}): ${uploadRes.statusText}`)
  }

  return fileUrl || finalFileUrl
}
