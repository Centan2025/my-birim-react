import { GoogleGenAI } from '@google/genai'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'
import { checkRateLimit, sanitizePrompt } from '../../src/utils/aiSecurity'

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
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    '127.0.0.1'

  const rateCheck = checkRateLimit(clientIp, 3, 60 * 1000)
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: 'Çok fazla istek attınız, lütfen 1 dakika bekleyin.',
      retryAfterSeconds: Math.ceil(rateCheck.resetMs / 1000),
    })
  }

  const { roomImage, productImage, customPrompt, angle, alignmentInstruction, productName, productDetails } = req.body || {}

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
    return res.status(500).json({
      error:
        'GEMINI_API_KEY tanımlanmamış. Lütfen .env.local dosyasına GEMINI_API_KEY ekleyin.',
    })
  }

  try {
    const roomImg = await getBase64FromImageInput(roomImage)
    const productImg = await getBase64FromImageInput(productImage)

    let promptText = cleanPrompt ? cleanPrompt : `
You are an expert photorealistic 3D interior visualizer and rendering engine.

INPUT IMAGES:
- Image 1: The room background provided by the user.
- Image 2: The target furniture product (${productName || 'Target Furniture'}).

CRITICAL PRODUCT IDENTITY RULE:
- You MUST PRESERVE the exact design, geometry, proportions, arms, cushions, legs, stitchings, and fabric texture of the target furniture in Image 2.
- DO NOT invent, redesign, modify, or substitute the furniture model with a different style.
- The product in the final room output must be 100% IDENTICAL to the product shown in Image 2.
- Only adjust its 3D angle, lighting, and contact shadows to fit Image 1; DO NOT alter its physical design features.

CRITICAL ENGINE INSTRUCTIONS:
1. STRICT PRODUCT PRESERVATION: The target furniture in Image 2 must not be redesigned or modified in any way. Keep the exact armrest shape, leg style, cushion count, and fabric texture 100% identical to Image 2.

2. STRICTLY NO CUT-OUT / NO STICKER OVERLAY: Do NOT simply paste Image 2 on top of Image 1 as a 2D cut-out layer. You must fully re-render and seamlessly integrate the furniture into the 3D space of the room.

3. CAMERA & PERSPECTIVE ALIGNMENT:
   - Analyze the vanishing point, horizon line, focal length, and camera pitch of the room in Image 1.
   - Mentally rotate and adjust the 3D spatial orientation of the target furniture in Image 2 so that its scale, footprint, and perspective align perfectly with the floor plane of the room.

4. ENVIRONMENT & RELIGHTING MATCHING:
   - Identify all key light sources in the room (e.g., window daylight, warm ceiling lamps, ambient shadows).
   - Apply the exact color temperature, direction, and intensity of the room's lighting to the newly placed furniture.
   - Cast soft, physically accurate contact shadows on the floor directly beneath and around the base of the furniture based on the primary light source.

5. SEAMLESS BLENDING & DUST/ATMOSPHERE:
   - Soften and blend the outer contours of the furniture with the ambient atmosphere and lighting of the room. Eliminate any unnatural sharp outlines or cutout artifacts.
   - Match the overall camera grain, ISO noise, and micro-sharpness of Image 1.
`.trim()

    if (productDetails && typeof productDetails === 'object') {
      const detailsList: string[] = []
      if (productDetails.material) detailsList.push(`Material/Fabric: ${productDetails.material}`)
      if (productDetails.legStyle) detailsList.push(`Leg Style: ${productDetails.legStyle}`)
      if (productDetails.color) detailsList.push(`Color/Finish: ${productDetails.color}`)
      if (productDetails.description) detailsList.push(`Description: ${productDetails.description}`)
      if (detailsList.length > 0) {
        promptText += `\n\nTARGET PRODUCT SPECIFICATIONS:\n${detailsList.join('\n')}`
      }
    }

    if (angle && typeof angle === 'string') {
      promptText += `\nROTATION INSTRUCTION: Orient and render the product from the requested angle: ${angle}.`
    }

    if (alignmentInstruction && typeof alignmentInstruction === 'string') {
      promptText += `\nPOSITIONING INSTRUCTION: Adjust the product's placement and perspective in the room according to: ${alignmentInstruction}.`
    }

    promptText += `\n\nFINAL OUTPUT:\nThe result must be a single, photorealistic high-resolution photograph as if taken directly by an interior design photographer in a single shot.`

    const ai = new GoogleGenAI({ apiKey })
    const imageModels = [
      'gemini-2.5-flash-image',
      'nano-banana-pro-preview',
      'gemini-3.1-flash-image',
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
      throw new Error(
        'Google Gemini AI modellerinden yeni oda görseli sentezlenemedi. Lütfen API anahtarınızın Nano Banana / Gemini Image izinlerini kontrol edin.'
      )
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
    const isQuotaExceeded = message.includes('RESOURCE_EXHAUSTED') || message.includes('Quota exceeded') || message.includes('429')

    if (isQuotaExceeded) {
      return res.status(200).json({
        success: true,
        imageUrl: roomImage,
        isDemo: true,
        message: 'Google Gemini API kotanız (Free Tier) dolduğu için Demo modunda çalıştırıldı. Kotanız yenilendiğinde canlı AI sentezi yapılacaktır.',
      })
    }

    return res.status(500).json({
      error: `AI Oda Tasarımı oluşturulurken bir hata meydana geldi: ${message}`,
    })
  }
}
