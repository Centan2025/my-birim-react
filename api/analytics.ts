import type {VercelRequest, VercelResponse} from '@vercel/node'
import {GoogleAuth} from 'google-auth-library'
import dotenv from 'dotenv'

dotenv.config({path: '.env.local'})
dotenv.config()

interface GAReportRow {
  dimensionValues?: {value: string}[]
  metricValues?: {value: string}[]
}

// In-memory cache to prevent 429 and reduce Google Analytics API quota usage
const cache = new Map<string, {data: unknown; expires: number}>()
const CACHE_TTL_MS = 60 * 1000 // 1 minute

function getCredentials() {
  let propertyId = process.env['GA_PROPERTY_ID']?.trim() || '514459801'
  if (propertyId.startsWith('properties/')) {
    propertyId = propertyId.replace('properties/', '')
  }

  const clientEmail =
    process.env['GA_CLIENT_EMAIL']?.trim() ||
    'analiz-botu@birim-mobilya-analitik.iam.gserviceaccount.com'

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
  const {clientEmail, privateKey} = getCredentials()
  if (!clientEmail || !privateKey) {
    throw new Error('Google Analytics credentials (email or private key) are missing')
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

export async function getRealtimeData() {
  const cacheKey = 'realtime'
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }

  try {
    const userReport = await runRealtimeReport({
      metrics: [{name: 'activeUsers'}],
    })

    const pageReport = await runRealtimeReport({
      dimensions: [{name: 'unifiedScreenName'}],
      metrics: [{name: 'activeUsers'}],
      limit: 10,
    })

    const geoReport = await runRealtimeReport({
      dimensions: [{name: 'country'}, {name: 'city'}],
      metrics: [{name: 'activeUsers'}],
      limit: 10,
    })

    const activeUsers = parseInt(userReport.rows?.[0]?.metricValues?.[0]?.value || '0', 10) || 0

    const activePages = (pageReport.rows || []).map(r => ({
      page: r.dimensionValues?.[0]?.value || '/',
      users: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
    }))

    const activeCountries = (geoReport.rows || []).map(r => ({
      country: r.dimensionValues?.[0]?.value || '',
      city: r.dimensionValues?.[1]?.value || '',
      users: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
    }))

    const result = {
      activeUsers,
      activePages,
      activeCountries,
    }

    cache.set(cacheKey, {data: result, expires: Date.now() + 15 * 1000}) // 15s cache for realtime
    return result
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {activeUsers: 0, activePages: [], activeCountries: [], error: msg}
  }
}

export async function getAllAnalyticsData(startDate: string, endDate: string) {
  const cacheKey = `all_${startDate}_${endDate}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }

  // Run sequentially / small batches with a tiny delay to respect Google concurrent quota
  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

  // 1. Overview
  const overviewRes = await runReport({
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
  })
  await sleep(60)

  // 2. Daily Visitors
  const dailyRes = await runReport({
    dateRanges: [{startDate, endDate}],
    dimensions: [{name: 'date'}],
    metrics: [
      {name: 'activeUsers'},
      {name: 'sessions'},
      {name: 'screenPageViews'},
      {name: 'newUsers'},
    ],
    orderBys: [{dimension: {dimensionName: 'date'}}],
  })
  await sleep(60)

  // 3. Top Pages
  const topPagesRes = await runReport({
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
  })
  await sleep(60)

  // 4. Sources
  const sourcesRes = await runReport({
    dateRanges: [{startDate, endDate}],
    dimensions: [{name: 'sessionDefaultChannelGroup'}],
    metrics: [{name: 'sessions'}, {name: 'activeUsers'}, {name: 'bounceRate'}],
    orderBys: [{metric: {metricName: 'sessions'}, desc: true}],
    limit: 10,
  })
  await sleep(60)

  // 5. Devices
  const devicesRes = await runReport({
    dateRanges: [{startDate, endDate}],
    dimensions: [{name: 'deviceCategory'}],
    metrics: [{name: 'sessions'}, {name: 'activeUsers'}],
    orderBys: [{metric: {metricName: 'sessions'}, desc: true}],
  })
  await sleep(60)

  // 6. Countries
  const countryRes = await runReport({
    dateRanges: [{startDate, endDate}],
    dimensions: [{name: 'country'}],
    metrics: [{name: 'activeUsers'}, {name: 'sessions'}],
    orderBys: [{metric: {metricName: 'activeUsers'}, desc: true}],
    limit: 15,
  })
  await sleep(60)

  // 7. Cities
  const cityRes = await runReport({
    dateRanges: [{startDate, endDate}],
    dimensions: [{name: 'city'}],
    metrics: [{name: 'activeUsers'}, {name: 'sessions'}],
    orderBys: [{metric: {metricName: 'activeUsers'}, desc: true}],
    limit: 15,
  })
  await sleep(60)

  // 8. Browsers
  const browserRes = await runReport({
    dateRanges: [{startDate, endDate}],
    dimensions: [{name: 'browser'}],
    metrics: [{name: 'sessions'}, {name: 'activeUsers'}],
    orderBys: [{metric: {metricName: 'sessions'}, desc: true}],
    limit: 8,
  })

  // 9. Realtime
  const realtime = await getRealtimeData()

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

  const cityData = (cityRes.rows || [])
    .filter(r => r.dimensionValues?.[0]?.value !== '(not set)')
    .map(r => ({
      city: r.dimensionValues?.[0]?.value || 'Unknown',
      users: parseInt(r.metricValues?.[0]?.value || '0', 10) || 0,
      sessions: parseInt(r.metricValues?.[1]?.value || '0', 10) || 0,
    }))

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
    browserData,
    realtime,
  }

  cache.set(cacheKey, {data: result, expires: Date.now() + CACHE_TTL_MS})
  return result
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-analytics-pin')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
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
