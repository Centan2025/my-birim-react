import crypto from 'crypto'
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {getAuthTokenFromReq, verifyToken} from '../../lib/server/token.js'
import {handleCors} from '../../lib/server/cors.js'
import {isRateLimitedAsync, getClientIp} from '../../lib/server/rateLimiter.js'

function getR2Config() {
  const accountId = (
    process.env['R2_ACCOUNT_ID'] ||
    process.env['SANITY_STUDIO_R2_ACCOUNT_ID'] ||
    ''
  ).trim()
  const accessKeyId = (
    process.env['R2_ACCESS_KEY_ID'] ||
    process.env['SANITY_STUDIO_R2_ACCESS_KEY_ID'] ||
    ''
  ).trim()
  const secretAccessKey = (
    process.env['R2_SECRET_ACCESS_KEY'] ||
    process.env['SANITY_STUDIO_R2_SECRET_ACCESS_KEY'] ||
    ''
  ).trim()
  const bucketName = (
    process.env['R2_BUCKET_NAME'] ||
    process.env['SANITY_STUDIO_R2_BUCKET_NAME'] ||
    'birim-web'
  ).trim()
  const domain = (
    process.env['R2_DOMAIN'] ||
    process.env['SANITY_STUDIO_R2_DOMAIN'] ||
    'https://assets.birim.com'
  ).trim()

  return {accountId, accessKeyId, secretAccessKey, bucketName, domain}
}

function getR2Client() {
  const {accountId, accessKeyId, secretAccessKey} = getR2Config()
  return new S3Client({
    region: 'auto',
    endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '',
    credentials: {
      accessKeyId: accessKeyId || '',
      secretAccessKey: secretAccessKey || '',
    },
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) {
    return
  }

  const clientIp = getClientIp(req)
  if (await isRateLimitedAsync(`media_action_${clientIp}`, {limit: 45, windowMs: 60000})) {
    return res.status(429).json({error: 'Çok fazla istek yapıldı. Lütfen 1 dakika bekleyin.'})
  }

  const rawAction = req.query['action']
  const action = Array.isArray(rawAction)
    ? rawAction[0]
    : rawAction || (req.url?.split('?')[0] ?? '').split('/').pop()

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

function isMediaAuthorized(req: VercelRequest): boolean {
  // 1. JWT Admin token from cookie/headers
  const token = getAuthTokenFromReq(req)
  const payload = token ? verifyToken(token) : null
  if (payload && payload.role === 'admin') {
    return true
  }

  // 2. Secret token match
  const adminSecret =
    process.env['SANITY_TOKEN'] || process.env['MEDIA_ADMIN_SECRET'] || process.env['ADMIN_SECRET']
  const authHeader = req.headers?.['authorization'] || req.headers?.['x-api-secret']
  const headerToken =
    typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : ''

  if (
    adminSecret &&
    headerToken &&
    headerToken.length === adminSecret.length &&
    crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(adminSecret))
  ) {
    return true
  }

  // 3. Studio Origin / Referer check
  const rawOrigin = req.headers?.origin || req.headers?.referer
  let origin = typeof rawOrigin === 'string' ? rawOrigin.trim() : ''
  try {
    if (origin.startsWith('http://') || origin.startsWith('https://')) {
      origin = new URL(origin).origin
    }
  } catch (_err) {
    // Ignore invalid URL format in origin/referer headers
  }

  if (origin === 'https://birim.sanity.studio' || origin.endsWith('.sanity.studio')) {
    return true
  }

  // Development environment & local studio access
  if (process.env['NODE_ENV'] === 'development') {
    if (
      origin === 'http://localhost:3333' ||
      origin === 'http://localhost:3002' ||
      origin === 'http://localhost:3001'
    ) {
      return true
    }
  }

  return false
}

async function handlePresignedUrl(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  if (!isMediaAuthorized(req)) {
    return res
      .status(401)
      .json({error: 'Dosya yükleme bileti almak için yönetici yetkisi gereklidir.'})
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

  const {accountId, accessKeyId, secretAccessKey, bucketName, domain} = getR2Config()

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return res.status(500).json({
      error:
        'Cloudflare R2 konfigürasyon değişkenleri (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) sunucu ortamında tanımlı değil.',
    })
  }

  try {
    const safeFolder = typeof folder === 'string' && folder.trim() ? folder.trim() : 'uploads'
    const cleanFileName = filename.trim().replace(/[^a-zA-Z0-9_.-]/g, '_')
    const uniquePrefix = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
    const finalFileName = `${uniquePrefix}_${cleanFileName}`
    const key = safeFolder.endsWith('/')
      ? `${safeFolder}${finalFileName}`
      : `${safeFolder}/${finalFileName}`

    const isSvg = contentType.toLowerCase() === 'image/svg+xml'
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      ...(isSvg ? {ContentDisposition: `attachment; filename="${cleanFileName}"`} : {}),
    })

    const r2Client = getR2Client()
    const url = await getSignedUrl(
      r2Client as unknown as Parameters<typeof getSignedUrl>[0],
      command,
      {
        expiresIn: 900,
      }
    )

    const defaultDomain = 'assets.birim.com'
    const domainToUse = domain && domain !== 'undefined' ? domain : defaultDomain
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
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  if (!isMediaAuthorized(req)) {
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
    const {bucketName} = getR2Config()
    const r2Client = getR2Client()
    const command = new DeleteObjectsCommand({
      Bucket: bucketName,
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
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  if (!isMediaAuthorized(req)) {
    return res.status(401).json({error: 'Dosya listesini görüntüleme yetkiniz yok.'})
  }

  const {continuationToken} = req.body || {}

  try {
    const {bucketName} = getR2Config()
    const r2Client = getR2Client()
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
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
