import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {getAuthTokenFromReq, verifyToken} from '../auth/_token'

const R2_ACCOUNT_ID =
  process.env['R2_ACCOUNT_ID'] ||
  process.env['SANITY_STUDIO_R2_ACCOUNT_ID'] ||
  process.env['VITE_R2_ACCOUNT_ID']
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
  process.env['VITE_R2_DOMAIN']

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

  const rawAction = req.query['action']
  const action = Array.isArray(rawAction)
    ? rawAction[0]
    : rawAction || req.url?.split('?')[0].split('/').pop()

  switch (action) {
    case 'presigned-url':
      return handlePresignedUrl(req, res)
    case 'delete-batch':
      return handleDeleteBatch(req, res)
    case 'list':
      return handleList(req, res)
    default:
      return res.status(404).json({error: `Bilinmeyen media aksiyonu: ${action}`})
  }
}

async function handlePresignedUrl(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
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

  const token = getAuthTokenFromReq(req)
  const payload = token ? verifyToken(token) : null
  const adminSecret = process.env['SANITY_TOKEN'] || process.env['MEDIA_ADMIN_SECRET']
  const authHeader = req.headers?.['authorization'] || req.headers?.['x-api-secret']
  const headerToken =
    typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : ''
  const isAdminAuthorized = adminSecret && headerToken === adminSecret

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

async function handleDeleteBatch(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).json({})
  }

  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const expectedToken = process.env['SANITY_TOKEN'] || process.env['MEDIA_ADMIN_SECRET']
  if (!expectedToken) {
    return res.status(500).json({error: 'Sunucu yetkilendirme anahtarı yapılandırılmamış.'})
  }

  const authHeader = req.headers?.['authorization'] || req.headers?.['x-api-secret']
  const tokenStr =
    typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : ''
  if (tokenStr !== expectedToken) {
    return res.status(401).json({error: 'Yetkisiz erişim.'})
  }

  const {keys} = req.body || {}

  if (!Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({error: 'keys parametresi bos olamaz.'})
  }

  const safeKeys: string[] = []
  for (const k of keys) {
    if (typeof k !== 'string' || k.includes('..')) {
      return res.status(400).json({error: 'Geçersiz dosya anahtarı tespit edildi.'})
    }
    safeKeys.push(k)
  }

  try {
    const command = new DeleteObjectsCommand({
      Bucket: R2_BUCKET_NAME,
      Delete: {
        Objects: safeKeys.map((key: string) => ({Key: key})),
        Quiet: true,
      },
    })

    await r2Client.send(command)

    return res.status(200).json({
      success: true,
      deletedCount: safeKeys.length,
    })
  } catch (error: unknown) {
    console.error('R2 delete error:', error)
    return res.status(500).json({error: 'Dosyalar silinemedi. Lütfen daha sonra tekrar deneyin.'})
  }
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).json({})
  }

  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const {continuationToken} = req.body || {}

  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      ContinuationToken: continuationToken as string | undefined,
    })

    const response = await r2Client.send(command)

    return res.status(200).json({
      success: true,
      contents: response.Contents || [],
      nextContinuationToken: response.NextContinuationToken,
    })
  } catch (error: unknown) {
    console.error('R2 list error:', error)
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata'
    return res.status(500).json({error: `Dosyalar listelenemedi: ${message}`})
  }
}
