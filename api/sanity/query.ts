interface ApiRequest {
  method?: string
  query?: Record<string, string>
  body?: Record<string, unknown>
  headers?: Record<string, string>
}

interface ApiResponse {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

const SANITY_PROJECT_ID =
  process.env['VITE_SANITY_PROJECT_ID'] || process.env['SANITY_PROJECT_ID'] || 'wn3a082f'
const SANITY_DATASET =
  process.env['VITE_SANITY_DATASET'] || process.env['SANITY_DATASET'] || 'production'
const SANITY_API_VERSION =
  process.env['VITE_SANITY_API_VERSION'] || process.env['SANITY_API_VERSION'] || '2025-01-01'

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'})
  }

  const query = (req.method === 'GET' ? req.query?.['query'] : req.body?.['query']) as
    | string
    | undefined
  if (!query) {
    return res.status(400).json({error: 'Missing query parameter'})
  }

  const sanityUrl = new URL(
    `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`
  )
  sanityUrl.searchParams.set('query', query)
  sanityUrl.searchParams.set('returnQuery', 'false')

  // Forward GROQ params ($param)
  const params = req.method === 'GET' ? req.query : req.body
  if (params && typeof params === 'object') {
    for (const [key, val] of Object.entries(params)) {
      if (key.startsWith('$') && typeof val === 'string') {
        sanityUrl.searchParams.set(key, val)
      }
    }
  }

  // Forward perspective
  const perspective = (
    req.method === 'GET' ? req.query?.['perspective'] : req.body?.['perspective']
  ) as string | undefined
  if (perspective) {
    sanityUrl.searchParams.set('perspective', perspective)
  }

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    }

    // Forward auth token if present
    const authHeader = req.headers?.['authorization']
    if (authHeader && typeof authHeader === 'string') {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(sanityUrl.toString(), {
      method: 'GET',
      headers,
    })

    const data = await response.json()

    // Cache for 60s on CDN, 10s on browser
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300, max-age=10')
    res.setHeader('Access-Control-Allow-Origin', '*')

    return res.status(response.status).json(data)
  } catch (err) {
    console.error('Sanity proxy error:', err)
    return res.status(502).json({error: 'Failed to fetch from Sanity'})
  }
}
