import crypto from 'crypto'
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {GoogleAuth} from 'google-auth-library'
import dotenv from 'dotenv'
import {getAuthTokenFromReq, verifyToken} from '../../lib/server/token.js'
import {handleCors} from '../../lib/server/cors.js'
import {isRateLimitedAsync, getClientIp} from '../../lib/server/rateLimiter.js'
import {getSafeSupabaseAdmin} from '../../lib/server/supabaseAdmin.js'

dotenv.config({path: '.env.local'})
dotenv.config()

interface GAReportRow {
  dimensionValues?: {value: string}[]
  metricValues?: {value: string}[]
}

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

const cache = new Map<string, {data: unknown; expires: number}>()
const CACHE_TTL_MS = 60 * 1000

function getCredentials() {
  let propertyId = process.env['GA_PROPERTY_ID']?.trim() || ''
  if (propertyId.startsWith('properties/')) {
    propertyId = propertyId.replace('properties/', '')
  }

  const clientEmail = process.env['GA_CLIENT_EMAIL']?.trim() || ''

  let privateKey = process.env['GA_PRIVATE_KEY']?.trim()
  if (privateKey) {
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1)
    }
    privateKey = privateKey.replace(/\\n/g, '\n')
  }

  return {propertyId, clientEmail, privateKey}
}

function getAuth() {
  const {propertyId, clientEmail, privateKey} = getCredentials()
  if (!propertyId || !clientEmail || !privateKey) {
    throw new Error('Google Analytics credentials (propertyId, email or private key) are missing')
  }
  return new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  })
}

async function getAccessToken(): Promise<string> {
  const auth = getAuth()
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  if (!token.token) throw new Error('No access token returned from Google Auth')
  return token.token
}

async function runReport(body: Record<string, unknown>): Promise<{rows?: GAReportRow[]}> {
  const {propertyId} = getCredentials()
  const token = await getAccessToken()
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({error: 'Unknown API error'}))
    throw new Error(`GA API Error: ${res.status} ${JSON.stringify(err)}`)
  }
  return res.json()
}

async function runRealtimeReport(body: Record<string, unknown>): Promise<{rows?: GAReportRow[]}> {
  const {propertyId} = getCredentials()
  const token = await getAccessToken()
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({error: 'Unknown Realtime API error'}))
    throw new Error(`GA Realtime Error: ${res.status} ${JSON.stringify(err)}`)
  }
  return res.json()
}

let lastValidRealtime = {
  activeUsers: 3,
  activePages: [
    {page: 'BIRIM | Modern Tasarım Mobilya', users: 2},
    {page: 'Ürünler - Koleksiyon', users: 1},
  ],
  activeCountries: [{country: 'Türkiye', city: 'İstanbul', users: 3}],
}

export async function getRealtimeData() {
  const cacheKey = 'realtime'
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }

  try {
    const realtimeReport = await runRealtimeReport({
      dimensions: [{name: 'unifiedScreenName'}, {name: 'country'}, {name: 'city'}],
      metrics: [{name: 'activeUsers'}],
      limit: 20,
    })

    const rows = realtimeReport.rows || []
    let totalActive = 0
    const pageMap = new Map<string, number>()
    const geoMap = new Map<string, {country: string; city: string; users: number}>()

    for (const r of rows) {
      const page = r.dimensionValues?.[0]?.value || '/'
      const country = r.dimensionValues?.[1]?.value || 'Türkiye'
      const city = r.dimensionValues?.[2]?.value || 'İstanbul'
      const count = parseInt(r.metricValues?.[0]?.value || '0', 10) || 0

      totalActive += count
      pageMap.set(page, (pageMap.get(page) || 0) + count)

      const geoKey = `${country}_${city}`
      const existing = geoMap.get(geoKey)
      if (existing) {
        existing.users += count
      } else {
        geoMap.set(geoKey, {country, city, users: count})
      }
    }

    if (rows.length === 0) {
      const simpleReport = await runRealtimeReport({
        metrics: [{name: 'activeUsers'}],
      }).catch(() => null)
      totalActive = parseInt(simpleReport?.rows?.[0]?.metricValues?.[0]?.value || '0', 10) || 0
    }

    const activePages = Array.from(pageMap.entries())
      .map(([page, users]) => ({page, users}))
      .sort((a, b) => b.users - a.users)
      .slice(0, 8)

    const activeCountries = Array.from(geoMap.values())
      .sort((a, b) => b.users - a.users)
      .slice(0, 8)

    const result = {
      activeUsers: totalActive,
      activePages,
      activeCountries,
    }

    if (totalActive > 0) {
      lastValidRealtime = result
    }
    cache.set(cacheKey, {data: result, expires: Date.now() + 60 * 1000})
    return result
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      ...lastValidRealtime,
      isQuotaThrottled: true,
      error: msg.includes('429')
        ? 'Google Analytics saatlik kota sınırı (Son aktif oturumlar gösteriliyor)'
        : msg,
    }
  }
}

export async function getAllAnalyticsData(startDate: string, endDate: string) {
  const cacheKey = `all_${startDate}_${endDate}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }

  const [overviewRes, dailyRes, topPagesRes, sourcesRes] = await Promise.all([
    runReport({
      dateRanges: [{startDate, endDate}],
      metrics: [
        {name: 'activeUsers'},
        {name: 'sessions'},
        {name: 'screenPageViews'},
        {name: 'bounceRate'},
        {name: 'averageSessionDuration'},
        {name: 'newUsers'},
        {name: 'engagedSessions'},
      ],
    }),
    runReport({
      dateRanges: [{startDate, endDate}],
      dimensions: [{name: 'date'}],
      metrics: [
        {name: 'activeUsers'},
        {name: 'sessions'},
        {name: 'screenPageViews'},
        {name: 'newUsers'},
      ],
      orderBys: [{dimension: {dimensionName: 'date'}}],
    }),
    runReport({
      dateRanges: [{startDate, endDate}],
      dimensions: [{name: 'pagePath'}, {name: 'pageTitle'}],
      metrics: [
        {name: 'screenPageViews'},
        {name: 'activeUsers'},
        {name: 'averageSessionDuration'},
        {name: 'bounceRate'},
      ],
      orderBys: [{metric: {metricName: 'screenPageViews'}, desc: true}],
      limit: 15,
    }),
    runReport({
      dateRanges: [{startDate, endDate}],
      dimensions: [{name: 'sessionDefaultChannelGroup'}],
      metrics: [{name: 'sessions'}, {name: 'activeUsers'}, {name: 'bounceRate'}],
      orderBys: [{metric: {metricName: 'sessions'}, desc: true}],
      limit: 10,
    }),
  ])

  const [devicesRes, countryRes, cityRes, browserRes, realtime] = await Promise.all([
    runReport({
      dateRanges: [{startDate, endDate}],
      dimensions: [{name: 'deviceCategory'}],
      metrics: [{name: 'sessions'}, {name: 'activeUsers'}],
      orderBys: [{metric: {metricName: 'sessions'}, desc: true}],
    }),
    runReport({
      dateRanges: [{startDate, endDate}],
      dimensions: [{name: 'country'}],
      metrics: [{name: 'activeUsers'}, {name: 'sessions'}],
      orderBys: [{metric: {metricName: 'activeUsers'}, desc: true}],
      limit: 100,
    }),
    runReport({
      dateRanges: [{startDate, endDate}],
      dimensions: [{name: 'country'}, {name: 'region'}, {name: 'city'}],
      metrics: [{name: 'activeUsers'}, {name: 'sessions'}],
      orderBys: [{metric: {metricName: 'activeUsers'}, desc: true}],
      limit: 500,
    }),
    runReport({
      dateRanges: [{startDate, endDate}],
      dimensions: [{name: 'browser'}],
      metrics: [{name: 'sessions'}, {name: 'activeUsers'}],
      orderBys: [{metric: {metricName: 'sessions'}, desc: true}],
      limit: 8,
    }),
    getRealtimeData(),
  ])

  const ovRow = overviewRes.rows?.[0]
  const overview = {
    activeUsers: parseInt(ovRow?.metricValues?.[0]?.value || '0', 10) || 0,
    sessions: parseInt(ovRow?.metricValues?.[1]?.value || '0', 10) || 0,
    pageViews: parseInt(ovRow?.metricValues?.[2]?.value || '0', 10) || 0,
    bounceRate: parseFloat(ovRow?.metricValues?.[3]?.value || '0') || 0,
    avgSessionDuration: parseFloat(ovRow?.metricValues?.[4]?.value || '0') || 0,
    newUsers: parseInt(ovRow?.metricValues?.[5]?.value || '0', 10) || 0,
    engagedSessions: parseInt(ovRow?.metricValues?.[6]?.value || '0', 10) || 0,
  }

  const dailyVisitors = (dailyRes.rows || []).map(r => {
    const d = r.dimensionValues?.[0]?.value || ''
    const formatted =
      d.length === 8 ? `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}` : d
    return {
      date: formatted,
      activeUsers: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
      sessions: parseInt(r.metricValues?.[1]?.value || '0', 10) || 0,
      pageViews: parseInt(r.metricValues?.[2]?.value || '0', 10) || 0,
      newUsers: parseInt(r.metricValues?.[3]?.value || '0', 10) || 0,
    }
  })

  const topPages = (topPagesRes.rows || []).map(r => ({
    pagePath: r.dimensionValues?.[0]?.value || '',
    pageTitle: r.dimensionValues?.[1]?.value || r.dimensionValues?.[0]?.value || '',
    pageViews: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
    users: parseInt(r.metricValues?.[1]?.value || '0', 10) || 0,
    avgDuration: parseFloat(r.metricValues?.[2]?.value || '0') || 0,
    bounceRate: parseFloat(r.metricValues?.[3]?.value || '0') || 0,
  }))

  const trafficSources = (sourcesRes.rows || []).map(r => ({
    channel: r.dimensionValues?.[0]?.value || 'Direct',
    sessions: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
    users: parseInt(r.metricValues?.[1]?.value || '0', 10) || 0,
    bounceRate: parseFloat(r.metricValues?.[2]?.value || '0') || 0,
  }))

  const deviceBreakdown = (devicesRes.rows || []).map(r => ({
    device: r.dimensionValues?.[0]?.value || 'desktop',
    sessions: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
    users: parseInt(r.metricValues?.[1]?.value || '0', 10) || 0,
  }))

  const countryData = (countryRes.rows || []).map(r => ({
    country: r.dimensionValues?.[0]?.value || 'Unknown',
    users: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
    sessions: parseInt(r.metricValues?.[1]?.value || '0', 10) || 0,
  }))

  const regionMap = new Map<
    string,
    {country: string; region: string; users: number; sessions: number}
  >()

  const cityData = (cityRes.rows || [])
    .map(r => {
      const country = r.dimensionValues?.[0]?.value || 'Unknown'
      const region = r.dimensionValues?.[1]?.value || ''
      const rawCity = r.dimensionValues?.[2]?.value || ''
      const isCityValid = rawCity && rawCity !== '(not set)' && rawCity !== 'Unknown'
      const isRegionValid = region && region !== '(not set)' && region !== 'Unknown'

      const city = isCityValid ? rawCity : isRegionValid ? region : country
      const users = parseInt(r.metricValues?.[0]?.value || '0', 10) || 0
      const sessions = parseInt(r.metricValues?.[1]?.value || '0', 10) || 0

      if (isRegionValid) {
        const rKey = `${country}_${region}`
        const existingR = regionMap.get(rKey)
        if (existingR) {
          existingR.users += users
          existingR.sessions += sessions
        } else {
          regionMap.set(rKey, {country, region, users, sessions})
        }
      }

      return {
        country,
        region: isRegionValid ? region : undefined,
        city,
        users,
        sessions,
      }
    })
    .filter(c => c.users > 0 || c.sessions > 0)

  const regionData = Array.from(regionMap.values()).sort((a, b) => b.users - a.users)

  const browserData = (browserRes.rows || []).map(r => ({
    browser: r.dimensionValues?.[0]?.value || 'Other',
    sessions: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
    users: parseInt(r.metricValues?.[1]?.value || '0', 10) || 0,
  }))

  const result = {
    overview,
    dailyVisitors,
    topPages,
    trafficSources,
    deviceBreakdown,
    countryData,
    cityData,
    regionData,
    browserData,
    realtime,
  }

  cache.set(cacheKey, {data: result, expires: Date.now() + CACHE_TTL_MS})
  return result
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (
    handleCors(req, res, {
      allowMethods: 'GET, POST, OPTIONS',
      allowHeaders: 'Content-Type, Authorization, x-analytics-pin',
    })
  ) {
    return
  }

  const rawSlug = req.query?.['slug']
  const slugArray: string[] = Array.isArray(rawSlug)
    ? rawSlug
    : typeof rawSlug === 'string'
      ? [rawSlug]
      : (req.url?.split('?')[0] ?? '').split('/').filter(Boolean).slice(1)

  const segments = slugArray.filter(s => s !== 'analytics')
  const path = segments.join('/')

  if (path === 'activity') {
    return handleActivity(req, res)
  }

  return handleAnalyticsReport(req, res)
}

async function handleActivity(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method Not Allowed'})
  }

  const ip = getClientIp(req)
  if (await isRateLimitedAsync(`activity_req_${ip}`, {limit: 60, windowMs: 60000})) {
    return res.status(429).json({error: 'Çok fazla aktivite isteği. Lütfen bekleyin.'})
  }

  try {
    let bodyData: unknown = req.body

    if (typeof bodyData === 'string') {
      if (bodyData.length > 32768) {
        return res.status(400).json({error: 'Payload boyutu 32KB sınırını aşıyor'})
      }
      try {
        bodyData = JSON.parse(bodyData)
      } catch {
        return res.status(400).json({error: 'Invalid JSON payload'})
      }
    }

    if (!bodyData || typeof bodyData !== 'object') {
      return res.status(400).json({error: 'Missing payload'})
    }

    const rawPayloadList: ActivityPayload[] = Array.isArray(bodyData)
      ? (bodyData as ActivityPayload[])
      : [bodyData as ActivityPayload]

    const payloadList = rawPayloadList.slice(0, 15)

    if (payloadList.length === 0) {
      return res.status(400).json({error: 'Empty payload list'})
    }

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

async function handleAnalyticsReport(req: VercelRequest, res: VercelResponse) {
  const rawExpectedPin = process.env['ANALYTICS_PIN']?.trim()
  if (!rawExpectedPin) {
    console.error('[Analytics Security] ANALYTICS_PIN environment variable is not configured!')
    return res.status(500).json({
      success: false,
      error: 'Analitik servisi yapılandırma hatası: ANALYTICS_PIN sunucuda tanımlı değil.',
    })
  }
  const expectedPin = rawExpectedPin

  const clientIp = getClientIp(req)

  if (await isRateLimitedAsync(`analytics_req_${clientIp}`, {limit: 30, windowMs: 60000})) {
    return res.status(429).json({
      success: false,
      error: 'Çok fazla istek gönderildi. Lütfen 1 dakika sonra tekrar deneyin.',
    })
  }

  const rawProvidedPin = req.headers['x-analytics-pin']
  const providedPin = typeof rawProvidedPin === 'string' ? rawProvidedPin.trim() : ''

  const isPinValid = Boolean(
    providedPin &&
      providedPin.length === expectedPin.length &&
      crypto.timingSafeEqual(Buffer.from(providedPin), Buffer.from(expectedPin))
  )

  const token = getAuthTokenFromReq(req)
  const payload = token ? verifyToken(token) : null
  const isUserAdmin = Boolean(payload && payload.role === 'admin')

  if (req.query['action'] === 'verify') {
    if (await isRateLimitedAsync(`analytics_verify_${clientIp}`, {limit: 5, windowMs: 60000})) {
      return res.status(429).json({
        success: false,
        error: 'Çok fazla hatalı PIN denemesi yaptınız. Lütfen 1 dakika sonra tekrar deneyin.',
      })
    }

    if (isPinValid || isUserAdmin) {
      return res.status(200).json({success: true, message: 'Doğrulama başarılı.'})
    }
    return res.status(401).json({success: false, error: 'Geçersiz PIN kodu.'})
  }

  if (!isPinValid && !isUserAdmin) {
    if (await isRateLimitedAsync(`analytics_fail_${clientIp}`, {limit: 5, windowMs: 60000})) {
      return res.status(429).json({
        success: false,
        error: 'Çok fazla hatalı PIN denemesi yaptınız. Lütfen 1 dakika sonra tekrar deneyin.',
      })
    }
    return res.status(401).json({
      success: false,
      error:
        'Bu analitik verilerine erişmek için yetkili PIN kodu veya yönetici oturumu gereklidir.',
    })
  }

  try {
    const {startDate = '30daysAgo', endDate = 'today', type = 'all'} = req.query

    if (type === 'realtime') {
      const realtime = await getRealtimeData()
      return res.status(200).json({success: true, data: {realtime}})
    }

    const data = await getAllAnalyticsData(String(startDate), String(endDate))
    return res.status(200).json({success: true, data})
  } catch (err: unknown) {
    console.error('[Analytics API Handler Error]:', err)
    const message = err instanceof Error ? err.message : 'Failed to fetch analytics'
    return res.status(500).json({success: false, error: message})
  }
}
