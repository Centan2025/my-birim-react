import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3'

const R2_ACCOUNT_ID = (process.env.SANITY_STUDIO_R2_ACCOUNT_ID || '').trim()
const R2_ACCESS_KEY_ID = (process.env.SANITY_STUDIO_R2_ACCESS_KEY_ID || '').trim()
const R2_SECRET_ACCESS_KEY = (process.env.SANITY_STUDIO_R2_SECRET_ACCESS_KEY || '').trim()
const R2_BUCKET_NAME = (process.env.SANITY_STUDIO_R2_BUCKET_NAME || 'birim-assets').trim()
const R2_DOMAIN = (
  process.env.SANITY_STUDIO_R2_DOMAIN || 'https://birim-assets.web-birim.workers.dev'
).trim()

let r2Client: S3Client | null = null
if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
}

export async function uploadToR2(
  blob: Blob | File,
  key: string,
  contentType: string,
): Promise<string> {
  const domainToUse = R2_DOMAIN.startsWith('http') ? R2_DOMAIN : `https://${R2_DOMAIN}`
  const finalFileUrl = `${domainToUse}/${key}`

  // 1. Direct R2 upload via S3Client if valid credentials present in runtime
  if (r2Client) {
    try {
      const buffer = await blob.arrayBuffer()
      const uint8 = new Uint8Array(buffer)
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: uint8,
          ContentType: contentType,
        }),
      )
      return finalFileUrl
    } catch {
      // Fallback silently to presigned URL
    }
  }

  // 2. Presigned URL fallback
  const lastSlash = key.lastIndexOf('/')
  const folder = key.substring(0, lastSlash)
  const filename = key.substring(lastSlash + 1)

  const studioToken =
    (typeof process !== 'undefined' && process.env
      ? process.env.SANITY_STUDIO_SANITY_TOKEN ||
        process.env.SANITY_STUDIO_MEDIA_ADMIN_SECRET ||
        process.env.SANITY_STUDIO_API_SECRET
      : '') || ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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
    : 'https://birim-web-antigravity.vercel.app'

  let res: Response
  try {
    res = await fetch(`${apiBase}/api/media/presigned-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify({filename, contentType, folder}),
    })
  } catch (fetchErr) {
    if (isLocal) {
      // Fallback to production if local API server is not running
      res = await fetch('https://birim-web-antigravity.vercel.app/api/media/presigned-url', {
        method: 'POST',
        headers,
        body: JSON.stringify({filename, contentType, folder}),
      })
    } else {
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
