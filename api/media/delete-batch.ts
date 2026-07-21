import {S3Client, DeleteObjectsCommand} from '@aws-sdk/client-s3'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || process.env.SANITY_STUDIO_R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.SANITY_STUDIO_R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.SANITY_STUDIO_R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.SANITY_STUDIO_R2_BUCKET_NAME || 'birim-web'

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

  const {keys} = req.body || {}

  if (!Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({error: 'keys parametresi bos olamaz.'})
  }

  try {
    const command = new DeleteObjectsCommand({
      Bucket: R2_BUCKET_NAME,
      Delete: {
        Objects: keys.map((key: string) => ({Key: key})),
        Quiet: true,
      },
    })

    await r2Client.send(command)

    return res.status(200).json({
      success: true,
      deletedCount: keys.length,
    })
  } catch (error: any) {
    console.error('R2 delete error:', error)
    return res.status(500).json({error: `Dosyalar silinemedi: ${error.message}`})
  }
}
