import {GoogleGenAI} from '@google/genai'
import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3'
import crypto from 'crypto'
import {getAuthTokenFromReq, verifyToken} from '../../lib/server/token.js'
import {handleCors} from '../../lib/server/cors.js'
import {isRateLimitedAsync, getClientIp} from '../../lib/server/rateLimiter.js'

function sanitizePrompt(input?: unknown, maxLength = 150): string {
  if (!input || typeof input !== 'string') return ''
  const sanitized = input.trim().slice(0, maxLength)
  return sanitized
    .replace(/[\r\n]+/g, ' ')
    .replace(/<[^>]*>?/gm, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/ignore previous instructions/gi, '')
    .replace(/system prompt/gi, '')
    .replace(/override instructions/gi, '')
}

const R2_ACCOUNT_ID = process.env['R2_ACCOUNT_ID'] || process.env['SANITY_STUDIO_R2_ACCOUNT_ID']
const R2_ACCESS_KEY_ID =
  process.env['R2_ACCESS_KEY_ID'] || process.env['SANITY_STUDIO_R2_ACCESS_KEY_ID']
const R2_SECRET_ACCESS_KEY =
  process.env['R2_SECRET_ACCESS_KEY'] || process.env['SANITY_STUDIO_R2_SECRET_ACCESS_KEY']
const R2_BUCKET_NAME =
  process.env['R2_BUCKET_NAME'] || process.env['SANITY_STUDIO_R2_BUCKET_NAME'] || 'birim-web'
const R2_DOMAIN = process.env['R2_DOMAIN'] || process.env['SANITY_STUDIO_R2_DOMAIN']

import type {VercelRequest, VercelResponse} from '@vercel/node'

/**
 * Normalizes input image string (Data URL or HTTP URL or raw base64) into base64 + mimeType
 */
async function _getBase64FromImageInput(
  imageInput: string
): Promise<{base64Data: string; mimeType: string}> {
  if (imageInput.startsWith('data:')) {
    const matches = imageInput.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
    if (matches && matches[1] && matches[2]) {
      return {mimeType: matches[1], base64Data: matches[2]}
    }
  }

  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    let targetUrl = imageInput
    try {
      const parsedUrl = new URL(targetUrl)
      const hostname = parsedUrl.hostname.toLowerCase()

      // SSRF Protection: Block internal IPs, Cloud metadata, IPv6 loopback, and local network
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname === '[::1]' ||
        hostname.includes('169.254.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
        hostname.startsWith('fc00:') ||
        hostname.startsWith('fe80:') ||
        hostname.startsWith('0x') ||
        /^\d+$/.test(hostname)
      ) {
        throw new Error('Dahili ağ URL adreslerine erişim engellendi.')
      }

      if (targetUrl.includes('cdn.sanity.io') && !targetUrl.includes('w=')) {
        parsedUrl.searchParams.set('w', '512')
        parsedUrl.searchParams.set('q', '60')
        parsedUrl.searchParams.set('auto', 'format')
        targetUrl = parsedUrl.toString()
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Dahili')) {
        throw err
      }
      throw new Error('Geçersiz görsel URL adresi.')
    }

    const fetchRes = await fetch(targetUrl, {redirect: 'manual'})
    if (fetchRes.status >= 300 && fetchRes.status < 400) {
      throw new Error('Yönlendirme yapılan URL adresleri kabul edilmemektedir.')
    }
    if (!fetchRes.ok) {
      throw new Error(`Referans görsel indirilemedi: ${fetchRes.statusText}`)
    }

    const contentLength = fetchRes.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      throw new Error('Görsel dosya boyutu 10 MB sınırını aşıyor.')
    }

    const arrayBuffer = await fetchRes.arrayBuffer()
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
      throw new Error('Görsel dosya boyutu 10 MB sınırını aşıyor.')
    }
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = fetchRes.headers.get('content-type') || 'image/jpeg'
    return {
      mimeType,
      base64Data: buffer.toString('base64'),
    }
  }

  // Raw base64 fallback
  return {mimeType: 'image/jpeg', base64Data: imageInput}
}

/**
 * Uploads generated image buffer to Cloudflare R2 or returns data URL as fallback
 */
async function uploadToR2OrFallback(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
    try {
      const r2Client = new S3Client({
        region: 'auto',
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
      })

      const fileName = `ai-room-planner/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.jpg`
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        Body: imageBuffer,
        ContentType: mimeType,
      })

      await r2Client.send(command)

      const domain = R2_DOMAIN
        ? R2_DOMAIN.startsWith('http')
          ? R2_DOMAIN
          : `https://${R2_DOMAIN}`
        : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}`

      return `${domain}/${fileName}`
    } catch (err: unknown) {
      console.warn('Cloudflare R2 upload warning, using base64 fallback:', err)
    }
  }

  return `data:${mimeType};base64,${imageBuffer.toString('base64')}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (
      handleCors(req, res, {
        allowMethods: 'POST, OPTIONS',
        allowHeaders: 'Content-Type, Authorization, x-api-secret',
      })
    ) {
      return
    }

    if (req.method !== 'POST') {
      return res.status(405).json({error: 'Method Not Allowed'})
    }

    // Require authentication session or admin token for Imagen 3 AI generation
    const token = getAuthTokenFromReq(req)
    const payload = token ? verifyToken(token) : null
    const adminSecret = process.env['SANITY_TOKEN'] || process.env['MEDIA_ADMIN_SECRET']
    const authHeader = req.headers?.['authorization'] || req.headers?.['x-api-secret']
    const headerToken =
      typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : ''
    const isAdminAuthorized = Boolean(
      adminSecret &&
        headerToken &&
        headerToken.length === adminSecret.length &&
        crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(adminSecret))
    )

    if (!payload && !isAdminAuthorized && process.env['NODE_ENV'] === 'production') {
      return res
        .status(401)
        .json({error: 'Oda tasarlama AI servisini kullanmak için oturum açmanız gerekmektedir.'})
    }

    const clientIp = getClientIp(req)

    if (await isRateLimitedAsync(`ai_planner_ip_${clientIp}`, {limit: 5, windowMs: 60 * 1000})) {
      return res.status(429).json({
        error: 'Çok fazla istek attınız, lütfen 1 dakika bekleyin.',
      })
    }

    const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const {
      roomImage,
      productImage,
      customPrompt,
      angle,
      alignmentInstruction,
      productName,
      productDetails,
    } = bodyData

    if (!roomImage || typeof roomImage !== 'string') {
      return res.status(400).json({error: 'Kullanıcının oda görseli (roomImage) zorunludur.'})
    }

    if (!productImage || typeof productImage !== 'string') {
      return res.status(400).json({error: 'Seçilen ürün görseli (productImage) zorunludur.'})
    }

    const cleanPrompt = sanitizePrompt(customPrompt, 150)

    const apiKey = process.env['GEMINI_API_KEY']
    if (!apiKey) {
      return res.status(500).json({
        error:
          'GEMINI_API_KEY bulunamadı. Lütfen sunucu ortam değişkenlerine (env) GEMINI_API_KEY tanımlayın.',
      })
    }

    try {
      // SSRF ve Boyut Koruması: Girdileri doğrula ve güvenli hale getir
      await Promise.all([
        _getBase64FromImageInput(roomImage),
        _getBase64FromImageInput(productImage),
      ])

      const safeProductName = sanitizePrompt(productName, 60) || 'furniture'
      let promptText = cleanPrompt
        ? cleanPrompt
        : `A photorealistic interior design photograph of a room featuring ${safeProductName}. High quality, professional photography, soft realistic lighting.`

      if (productDetails && typeof productDetails === 'object') {
        const detailsList: string[] = []
        if (productDetails.material)
          detailsList.push(`Material: ${sanitizePrompt(productDetails.material, 50)}`)
        if (productDetails.legStyle)
          detailsList.push(`Leg style: ${sanitizePrompt(productDetails.legStyle, 50)}`)
        if (productDetails.color)
          detailsList.push(`Color: ${sanitizePrompt(productDetails.color, 50)}`)
        if (productDetails.description)
          detailsList.push(`Details: ${sanitizePrompt(productDetails.description, 100)}`)
        if (detailsList.length > 0) {
          promptText += `, ${detailsList.join(', ')}`
        }
      }

      if (angle && typeof angle === 'string') {
        const cleanAngle = sanitizePrompt(angle, 30)
        if (cleanAngle) {
          promptText += `, view from angle: ${cleanAngle}`
        }
      }

      if (alignmentInstruction && typeof alignmentInstruction === 'string') {
        const cleanAlignment = sanitizePrompt(alignmentInstruction, 50)
        if (cleanAlignment) {
          promptText += `, placed: ${cleanAlignment}`
        }
      }

      // Initialize official @google/genai SDK instance
      const ai = new GoogleGenAI({apiKey})

      // Use Imagen 3 generateImages API
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-fast-generate-001',
        prompt: promptText,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
        },
      })

      const generatedImage = (
        response as {
          generatedImages?: Array<{image?: {imageBytes?: string | Uint8Array}}>
        }
      )?.generatedImages?.[0]?.image
      if (!generatedImage || !generatedImage.imageBytes) {
        throw new Error('Imagen 3 API geçerli bir görsel yanıtı üretemedi.')
      }

      const rawBytes = generatedImage.imageBytes
      const base64Data =
        typeof rawBytes === 'string' ? rawBytes : Buffer.from(rawBytes).toString('base64')

      const outputImageBuffer = Buffer.from(base64Data, 'base64')
      const publicUrl = await uploadToR2OrFallback(outputImageBuffer, 'image/jpeg')

      return res.status(200).json({
        success: true,
        imageUrl: publicUrl,
        message: 'Oda tasarımınız Imagen 3 (Google AI) ile başarıyla oluşturuldu.',
      })
    } catch (error: unknown) {
      console.error('Imagen 3 Generation Error:', error)
      const message = error instanceof Error ? error.message : 'Bilinmeyen sunucu hatası.'

      return res.status(500).json({
        error: `Imagen 3 AI Görsel Oluşturma Hatası: ${message}`,
      })
    }
  } catch (topError: unknown) {
    console.error('Nano Banana Top-Level API Error:', topError)
    const message = topError instanceof Error ? topError.message : 'Bilinmeyen sunucu hatası.'
    return res.status(500).json({
      error: `API Sunucu Hatası: ${message}`,
    })
  }
}
