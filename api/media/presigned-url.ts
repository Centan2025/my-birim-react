import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {getAuthTokenFromReq, verifyToken} from '../../lib/server/token'

const R2_ACCOUNT_ID =
  process.env['R2_ACCOUNT_ID'] ||
  process.env['SANITY_STUDIO_R2_ACCOUNT_ID'] ||
  process.env['VITE_R2_ACCOUNT_ID'] ||
  '114e37dc2d51e58147e027097a68470b'
const R2_ACCESS_KEY_ID =
  process.env['R2_ACCESS_KEY_ID'] ||
  process.env['SANITY_STUDIO_R2_ACCESS_KEY_ID'] ||
  process.env['VITE_R2_ACCESS_KEY_ID']
const R2_SECRET_ACCESS_KEY =
  process.env['R2_SECRET_ACCESS_KEY'] ||
  process.env['SANITY_STUDIO_R2_SECRET_ACCESS_KEY'] ||
  process.env['VITE_R2_SECRET_ACCESS_KEY']
const R2_BUCKET_NAME =
  process.env['R2_BUCKET_NAME'] ||
  process.env['SANITY_STUDIO_R2_BUCKET_NAME'] ||
  process.env['VITE_R2_BUCKET_NAME'] ||
  'birim-web'
const R2_DOMAIN =
  process.env['R2_DOMAIN'] ||
  process.env['SANITY_STUDIO_R2_DOMAIN'] ||
  process.env['VITE_R2_DOMAIN'] ||
  'https://assets.birim.com'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin =
    typeof req.headers.origin === 'string' && req.headers.origin ? req.headers.origin : '*'
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  // Auth check: require JWT session, admin key, or request from Sanity Studio / local Studio
  const token = getAuthTokenFromReq(req)
  const payload = token ? verifyToken(token) : null
  const adminSecret = process.env['SANITY_TOKEN'] || process.env['MEDIA_ADMIN_SECRET']
  const authHeader = req.headers?.['authorization'] || req.headers?.['x-api-secret']
  const headerToken =
    typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : ''
  const isSanityStudioOrigin =
    origin.endsWith('.sanity.studio') ||
    origin.includes('localhost:3333') ||
    origin.includes('127.0.0.1:3333')
  const isAdminAuthorized = (adminSecret && headerToken === adminSecret) || isSanityStudioOrigin

  if (!payload && !isAdminAuthorized) {
    return res.status(401).json({error: 'Dosya yükleme bileti almak için yetkiniz yok.'})
  }

  const {filename, contentType, folder} = req.body || {}

  if (
    !filename ||
    typeof filename !== 'string' ||
    !contentType ||
    typeof contentType !== 'string'
  ) {
    return res.status(400).json({error: 'filename ve contentType parametreleri gereklidir.'})
  }

  const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'application/pdf',
  ]

  if (!ALLOWED_MIME_TYPES.includes(contentType.toLowerCase())) {
    return res.status(400).json({error: 'Desteklenmeyen dosya formatı.'})
  }

  if (filename.includes('..') || (folder && typeof folder === 'string' && folder.includes('..'))) {
    return res.status(400).json({error: 'Geçersiz klasör veya dosya adı.'})
  }

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return res.status(500).json({
      error:
        'Cloudflare R2 konfigürasyon değişkenleri (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) sunucu ortamında tanımlı değil.',
    })
  }

  try {
    const safeFolder = typeof folder === 'string' && folder.trim() ? folder.trim() : 'uploads'
    const cleanFileName = filename.trim().replace(/[^a-zA-Z0-9_.-]/g, '_')
    const key = safeFolder.endsWith('/')
      ? `${safeFolder}${cleanFileName}`
      : `${safeFolder}/${cleanFileName}`

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })

    const url = await getSignedUrl(
      r2Client as unknown as Parameters<typeof getSignedUrl>[0],
      command,
      {
        expiresIn: 900,
      }
    )

    const defaultDomain = 'assets.birim.com'
    const domainToUse = R2_DOMAIN && R2_DOMAIN !== 'undefined' ? R2_DOMAIN : defaultDomain
    const r2Domain = domainToUse.startsWith('http') ? domainToUse : `https://${domainToUse}`
    const finalFileUrl = `${r2Domain}/${key}`

    return res.status(200).json({
      success: true,
      uploadUrl: url,
      fileUrl: finalFileUrl,
      key: key,
    })
  } catch (error: unknown) {
    console.error('Presigned URL error:', error)
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata'
    return res.status(500).json({error: `Presigned URL olusturulamadi: ${message}`})
  }
}
