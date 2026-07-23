import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'

// Rate Limiting (In-Memory IP Tracker)
interface RateLimitRecord {
  count: number
  resetTime: number
}
const ipStore = new Map<string, RateLimitRecord>()

function checkRateLimit(ip: string, limit = 3, windowMs = 60 * 1000): { allowed: boolean; remaining: number; resetMs: number } {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return { allowed: true, remaining: 999, resetMs: 0 }
  }
  const now = Date.now()
  const record = ipStore.get(ip)
  if (!record || now > record.resetTime) {
    ipStore.set(ip, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetMs: windowMs }
  }
  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetMs: record.resetTime - now }
  }
  record.count += 1
  return { allowed: true, remaining: limit - record.count, resetMs: record.resetTime - now }
}

function sanitizePrompt(input?: unknown, maxLength = 150): string {
  if (!input || typeof input !== 'string') return ''
  let sanitized = input.trim().slice(0, maxLength)
  return sanitized
    .replace(/<[^>]*>?/gm, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/ignore previous instructions/gi, '')
    .replace(/system prompt/gi, '')
    .replace(/override instructions/gi, '')
}

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || process.env.SANITY_STUDIO_R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.SANITY_STUDIO_R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.SANITY_STUDIO_R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.SANITY_STUDIO_R2_BUCKET_NAME || 'birim-web'
const R2_DOMAIN = process.env.R2_DOMAIN || process.env.SANITY_STUDIO_R2_DOMAIN

interface ApiRequest {
  method?: string
  body?: {
    roomImage?: string
    productImage?: string
    customPrompt?: string
  }
  headers?: Record<string, string>
}

interface ApiResponse {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

/**
 * Normalizes input image string (Data URL or HTTP URL or raw base64) into base64 + mimeType
 */
async function getBase64FromImageInput(
  imageInput: string
): Promise<{ base64Data: string; mimeType: string }> {
  if (imageInput.startsWith('data:')) {
    const matches = imageInput.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
    if (matches && matches.length === 3) {
      return { mimeType: matches[1], base64Data: matches[2] }
    }
  }

  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    const fetchRes = await fetch(imageInput)
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
  return { mimeType: 'image/jpeg', base64Data: imageInput }
}

/**
 * Uploads generated image buffer to Cloudflare R2 or returns data URL as fallback
 */
async function uploadToR2OrFallback(
  imageBuffer: Buffer,
  mimeType: string = 'image/png'
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

      const fileName = `ai-room-planner/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.png`
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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      return res.status(200).json({})
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' })
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

    const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const { roomImage, productImage, customPrompt, angle, alignmentInstruction, productName, productDetails } = bodyData

    if (!roomImage || typeof roomImage !== 'string') {
      return res
        .status(400)
        .json({ error: 'Kullanıcının oda görseli (roomImage) zorunludur.' })
    }

    if (!productImage || typeof productImage !== 'string') {
      return res
        .status(400)
        .json({ error: 'Seçilen ürün görseli (productImage) zorunludur.' })
    }

    const cleanPrompt = sanitizePrompt(customPrompt, 150)

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY Vercel ortamında bulunamadı, demo moduna geçiliyor.')
      return res.status(200).json({
        success: true,
        imageUrl: roomImage,
        isDemo: true,
        message: 'Google Gemini API anahtarı sunucuda henüz tanımlanmadığı için oda görseliniz hazırlandı. Canlı 3D sentezi için API anahtarı eklenmelidir.',
      })
    }

  try {
    const roomImg = await getBase64FromImageInput(roomImage)
    const productImg = await getBase64FromImageInput(productImage)

    let promptText = cleanPrompt ? cleanPrompt : `
You are an ultra-precise photorealistic 3D interior renderer and product-exact visualizer engine.

INPUT IMAGES:
- Image 1: The target room background scene.
- Image 2: The EXACT product model (${productName || 'Target Furniture'}).

ZERO-TOLERANCE MANDATORY PRODUCT CONSTRAINTS:
1. NO MODEL MODIFICATION OR SUBSTITUTION (ABSOLUTE RULE):
   - You MUST NOT change, alter, modify, redesign, simplify, or substitute the furniture model under ANY circumstances.
   - The product in the rendered room MUST be 100% IDENTICAL in structure, shape, geometry, proportions, arms, backrest, cushions, legs, stitching pattern, upholstery texture, color, and design language to the EXACT model shown in Image 2.
   - DO NOT generate a generic or alternative sofa/chair/table. It MUST be the EXACT same product model as Image 2.

2. ALLOWED VS FORBIDDEN ALTERATIONS:
   - ALLOWED: Adjusting the 3D perspective rotation, scale, room placement, and realistic environmental lighting/shadows of the product to fit Image 1 seamlessly.
   - FORBIDDEN: Modifying the armrest curve, leg material/shape, cushion shape/count, seam details, or fabric weave of Image 2.

3. STRICTLY NO CUT-OUT / STICKER OVERLAY:
   - Do NOT perform a naive 2D copy-paste or cutout overlay.
   - Fully re-render the exact furniture model of Image 2 into the 3D space of Image 1 with physically accurate contact shadows on the floor and realistic light reflections matching Image 1's light sources.

4. ENVIRONMENT & BACKGROUND INTEGRITY:
   - Analyze the vanishing point, horizon line, scale, camera height, and lighting of Image 1.
   - Place the untouched model of Image 2 firmly onto the floor plane of Image 1.
   - Do NOT alter the walls, floor materials, windows, or existing elements of Image 1 except casting soft contact shadows on the floor beneath the newly placed product.

5. EXACTLY ONE SINGLE PRODUCT INSTANCE (STRICT NO-DUPLICATION RULE):
   - Render EXACTLY ONE (1) single instance of the furniture model from Image 2 in the room.
   - NEVER place a second copy, clone, or duplicate of the furniture in the room.
   - There MUST be ONLY ONE piece of this furniture in the entire generated room image.
`.trim()

    if (productDetails && typeof productDetails === 'object') {
      const detailsList: string[] = []
      if (productDetails.material) detailsList.push(`- Material/Fabric: ${productDetails.material}`)
      if (productDetails.legStyle) detailsList.push(`- Leg Style: ${productDetails.legStyle}`)
      if (productDetails.color) detailsList.push(`- Color/Finish: ${productDetails.color}`)
      if (productDetails.description) detailsList.push(`- Description: ${productDetails.description}`)
      if (detailsList.length > 0) {
        promptText += `\n\nEXACT PRODUCT SPECIFICATIONS TO KEEP UNCHANGED:\n${detailsList.join('\n')}`
      }
    }

    if (angle && typeof angle === 'string') {
      promptText += `\n\nROTATION INSTRUCTION: Re-render the SINGLE model from Image 2 from the requested angle: ${angle}. Ensure there is ONLY ONE piece of furniture in the room.`
    }

    if (alignmentInstruction && typeof alignmentInstruction === 'string') {
      promptText += `\n\nPOSITIONING INSTRUCTION: Reposition the SINGLE model from Image 2 on the floor according to: ${alignmentInstruction}. Ensure NO duplicate furniture appears.`
    }

    let outputImageBuffer: Buffer | null = null
    let outputMimeType = 'image/png'

    const imageModels = [
      'gemini-3.1-flash-image',
      'gemini-2.5-flash-image',
      'nano-banana-pro-preview',
      'gemini-3-pro-image',
      'gemini-2.0-flash',
    ]

    for (const modelName of imageModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
        const apiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: promptText },
                  { inlineData: { mimeType: roomImg.mimeType, data: roomImg.base64Data } },
                  { inlineData: { mimeType: productImg.mimeType, data: productImg.base64Data } },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.15,
              responseModalities: ['IMAGE', 'TEXT'],
            },
          }),
        })

        if (!apiRes.ok) continue

        const resData = (await apiRes.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>
          text?: string
        }

        const candidates = resData.candidates || []
        if (candidates.length > 0 && candidates[0].content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              outputImageBuffer = Buffer.from(part.inlineData.data, 'base64')
              if (part.inlineData.mimeType) outputMimeType = part.inlineData.mimeType
              break
            }
          }
        }

        if (!outputImageBuffer && resData.text) {
          const match = resData.text.match(/data:(image\/[a-zA-Z+]+);base64,([A-Za-z0-9+/=]+)/)
          if (match) {
            outputMimeType = match[1]
            outputImageBuffer = Buffer.from(match[2], 'base64')
          }
        }

        if (outputImageBuffer) break
      } catch (err: unknown) {
        console.warn(`Model ${modelName} fetch skipped:`, err)
      }
    }

    if (!outputImageBuffer) {
      console.warn('⚠️ Google Gemini AI görsel sentezleme kotalara veya model erişimine takıldı, demo modu aktif edildi.')
      return res.status(200).json({
        success: true,
        imageUrl: roomImage,
        isDemo: true,
        message: 'Google Gemini API kotanız veya model erişim izniniz için önizleme modu hazırlandı. Kotanız yenilendiğinde canlı 3D sentezleme yapılacaktır.',
      })
    }

    const publicUrl = await uploadToR2OrFallback(outputImageBuffer, outputMimeType)

    return res.status(200).json({
      success: true,
      imageUrl: publicUrl,
      message: 'Oda tasarımınız Nano Banana (Gemini AI) ile başarıyla tamamlandı.',
    })
  } catch (error: unknown) {
    console.error('Nano Banana Planner API Error:', error)
    const message = error instanceof Error ? error.message : 'Bilinmeyen sunucu hatası.'

    return res.status(200).json({
      success: true,
      imageUrl: typeof req.body === 'object' && req.body?.roomImage ? req.body.roomImage : '',
      isDemo: true,
      message: `AI Oda Tasarımı önizleme modu aktif: ${message}`,
    })
  }
  } catch (topError: unknown) {
    console.error('Nano Banana Top-Level API Error:', topError)
    const message = topError instanceof Error ? topError.message : 'Bilinmeyen sunucu hatası.'
    return res.status(200).json({
      success: true,
      isDemo: true,
      message: `AI Oda Tasarımı önizleme modu aktif: ${message}`,
    })
  }
}
