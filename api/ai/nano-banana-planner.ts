import {GoogleGenAI} from '@google/genai'
import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3'
import crypto from 'crypto'

// Rate Limiting (In-Memory IP Tracker)
interface RateLimitRecord {
  count: number
  resetTime: number
}
const ipStore = new Map<string, RateLimitRecord>()

function checkRateLimit(
  ip: string,
  limit = 3,
  windowMs = 60 * 1000
): {allowed: boolean; remaining: number; resetMs: number} {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return {allowed: true, remaining: 999, resetMs: 0}
  }
  const now = Date.now()
  const record = ipStore.get(ip)
  if (!record || now > record.resetTime) {
    ipStore.set(ip, {count: 1, resetTime: now + windowMs})
    return {allowed: true, remaining: limit - 1, resetMs: windowMs}
  }
  if (record.count >= limit) {
    return {allowed: false, remaining: 0, resetMs: record.resetTime - now}
  }
  record.count += 1
  return {allowed: true, remaining: limit - record.count, resetMs: record.resetTime - now}
}

function sanitizePrompt(input?: unknown, maxLength = 150): string {
  if (!input || typeof input !== 'string') return ''
  const sanitized = input.trim().slice(0, maxLength)
  return sanitized
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
async function getBase64FromImageInput(
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
    if (targetUrl.includes('cdn.sanity.io') && !targetUrl.includes('w=')) {
      try {
        const urlObj = new URL(targetUrl)
        urlObj.searchParams.set('w', '512')
        urlObj.searchParams.set('q', '60')
        urlObj.searchParams.set('auto', 'format')
        targetUrl = urlObj.toString()
      } catch {
        // use default targetUrl
      }
    }

    const fetchRes = await fetch(targetUrl)
    if (!fetchRes.ok) {
      throw new Error(`Referans görsel indirilemedi: ${fetchRes.statusText}`)
    }
    const arrayBuffer = await fetchRes.arrayBuffer()
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
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      return res.status(200).json({})
    }

    if (req.method !== 'POST') {
      return res.status(405).json({error: 'Method Not Allowed'})
    }

    const clientIp =
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket?.remoteAddress ||
      '127.0.0.1'

    const rateCheck = checkRateLimit(clientIp, 3, 60 * 1000)
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Çok fazla istek attınız, lütfen 1 dakika bekleyin.',
        retryAfterSeconds: Math.ceil(rateCheck.resetMs / 1000),
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

    const apiKey = process.env['GEMINI_API_KEY'] || process.env['VITE_GEMINI_API_KEY']
    if (!apiKey) {
      return res.status(500).json({
        error:
          'GEMINI_API_KEY bulunamadı. Lütfen sunucu ortam değişkenlerine (env) GEMINI_API_KEY tanımlayın.',
      })
    }

    try {
      await getBase64FromImageInput(roomImage)
      await getBase64FromImageInput(productImage)

      let promptText = cleanPrompt
        ? cleanPrompt
        : `A photorealistic interior design photograph of a room featuring ${productName || 'furniture'}. High quality, professional photography, soft realistic lighting.`

      if (productDetails && typeof productDetails === 'object') {
        const detailsList: string[] = []
        if (productDetails.material) detailsList.push(`Material: ${productDetails.material}`)
        if (productDetails.legStyle) detailsList.push(`Leg style: ${productDetails.legStyle}`)
        if (productDetails.color) detailsList.push(`Color: ${productDetails.color}`)
        if (productDetails.description) detailsList.push(`Details: ${productDetails.description}`)
        if (detailsList.length > 0) {
          promptText += `, ${detailsList.join(', ')}`
        }
      }

      if (angle && typeof angle === 'string') {
        promptText += `, view from angle: ${angle}`
      }

      if (alignmentInstruction && typeof alignmentInstruction === 'string') {
        promptText += `, placed: ${alignmentInstruction}`
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
