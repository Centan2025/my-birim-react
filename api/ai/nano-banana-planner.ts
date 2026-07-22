import { GoogleGenAI } from '@google/genai'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'

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

  const { roomImage, productImage, customPrompt } = req.body || {}

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

    const defaultPrompt = `
CRITICAL INSTRUCTION: Do NOT perform a naive cut-and-paste or sticker overlay. 

You are a photorealistic 3D render and interior design engine.
1. Take the room background (Image 1) and the target furniture (Image 2).
2. Completely RE-RENDER the target furniture inside the room scene.
3. MATCH THE ENVIRONMENT: 
   - Match the exact light source, color temperature, and brightness of the room.
   - Cast soft, physically accurate contact shadows on the floor directly beneath and around the furniture.
   - Match the floor perspective, horizon line, and camera focal length.
4. BLENDING: Smoothly blend the edges of the furniture with the ambient atmosphere and lighting of the room so there are NO sharp cutout outlines or sticker-like artifacts.
5. The final output must look like a single real photograph taken in one shot, not a composite image.
`

    const promptText = customPrompt && typeof customPrompt === 'string' ? customPrompt : defaultPrompt

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
