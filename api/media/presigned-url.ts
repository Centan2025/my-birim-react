import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || process.env.SANITY_STUDIO_R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.SANITY_STUDIO_R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.SANITY_STUDIO_R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.SANITY_STUDIO_R2_BUCKET_NAME || 'birim-web'
const R2_DOMAIN = process.env.R2_DOMAIN || process.env.SANITY_STUDIO_R2_DOMAIN

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
})

interface ApiRequest {
  method?: string
  body?: Record<string, unknown>
  headers?: Record<string, string>
}

interface ApiResponse {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).json({})
  }

  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const {filename, contentType, folder} = req.body || {}

  if (!filename || !contentType) {
    return res.status(400).json({error: 'filename ve contentType parametreleri gereklidir.'})
  }

  try {
    const key = folder ? `${folder}/${filename}` : `uploads/${filename}`

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })

    // Presigned URL valid for 15 minutes
    const url = await getSignedUrl(r2Client, command, {expiresIn: 900})

    const r2Domain = R2_DOMAIN?.startsWith('http') ? R2_DOMAIN : `https://${R2_DOMAIN}`
    const finalFileUrl = `${r2Domain}/${key}`

    return res.status(200).json({
      success: true,
      uploadUrl: url,
      fileUrl: finalFileUrl,
      key: key,
    })
  } catch (error: any) {
    console.error('Presigned URL error:', error)
    return res.status(500).json({error: `Presigned URL olusturulamadi: ${error.message}`})
  }
}
