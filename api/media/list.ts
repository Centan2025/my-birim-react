import {S3Client, ListObjectsV2Command} from '@aws-sdk/client-s3'

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
  query?: Record<string, string | string[]>
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
