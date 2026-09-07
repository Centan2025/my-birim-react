import type {VercelRequest, VercelResponse} from '@vercel/node'
import {handleCors} from '../../lib/server/cors.js'
import {getClientIp} from '../../lib/server/rateLimiter.js'
import {getSafeSupabaseAdmin} from '../../lib/server/supabaseAdmin.js'

interface ActivityPayload {
  user_id: string
  user_email?: string
  session_id: string
  activity_type: 'session_start' | 'page_view' | 'page_dwell' | 'download' | 'session_end'
  page_url?: string
  page_title?: string
  duration_seconds?: number
  download_file_name?: string
  download_file_type?: string
  platform?: string
  os?: string
  browser?: string
  referrer?: string
  metadata?: Record<string, unknown>
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  try {
    let bodyData: unknown = req.body

    // Parse if sendBeacon sent string payload
    if (typeof bodyData === 'string') {
      try {
        bodyData = JSON.parse(bodyData)
      } catch {
        return res.status(400).json({error: 'Invalid JSON payload'})
      }
    }

    if (!bodyData || typeof bodyData !== 'object') {
      return res.status(400).json({error: 'Missing payload'})
    }

    const payloadList: ActivityPayload[] = Array.isArray(bodyData)
      ? (bodyData as ActivityPayload[])
      : [bodyData as ActivityPayload]

    if (payloadList.length === 0) {
      return res.status(400).json({error: 'Empty payload list'})
    }

    // Capture request context
    const ip = getClientIp(req)
    const country =
      (req.headers['x-vercel-ip-country'] as string) ||
      (req.headers['cf-ipcountry'] as string) ||
      null
    const city = (req.headers['x-vercel-ip-city'] as string)
      ? decodeURIComponent(req.headers['x-vercel-ip-city'] as string)
      : null

    const supabase = getSafeSupabaseAdmin()
    if (!supabase) {
      return res.status(503).json({error: 'Supabase admin client unavailable'})
    }

    const rowsToInsert = payloadList
      .filter(item => item && item.user_id && item.session_id && item.activity_type)
      .map(item => ({
        user_id: item.user_id,
        user_email: item.user_email || null,
        session_id: item.session_id,
        activity_type: item.activity_type,
        page_url: item.page_url || null,
        page_title: item.page_title || null,
        duration_seconds: Math.max(0, Math.floor(Number(item.duration_seconds) || 0)),
        download_file_name: item.download_file_name || null,
        download_file_type: item.download_file_type || null,
        platform: item.platform || null,
        os: item.os || null,
        browser: item.browser || null,
        referrer: item.referrer || null,
        ip_address: ip || null,
        city: city || null,
        country: country || null,
        metadata: item.metadata || {},
        created_at: new Date().toISOString(),
      }))

    if (rowsToInsert.length === 0) {
      return res.status(400).json({error: 'No valid activity rows to record'})
    }

    const {error} = await supabase.from('user_activities').insert(rowsToInsert)

    if (error) {
      console.error('[Activity API] Error inserting activities:', error.message)
      // Return 200 with error details so clients don't continually retry on schema errors
      return res.status(200).json({
        success: false,
        warning: 'Activities received but persistence failed',
        details: error.message,
      })
    }

    return res.status(200).json({
      success: true,
      recorded: rowsToInsert.length,
    })
  } catch (err) {
    console.error('[Activity API] Unexpected error:', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal Server Error',
    })
  }
}
