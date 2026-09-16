import React, {useState, useEffect, useCallback, useMemo} from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import {motion, AnimatePresence} from 'framer-motion'
import {
  Users,
  Eye,
  Clock,
  TrendingDown,
  Monitor,
  Smartphone,
  Tablet,
  Activity,
  RefreshCw,
  Globe,
  MapPin,
  Compass,
  Zap,
  Layers,
  FileText,
  Radio,
  Search,
  ExternalLink,
  Loader2,
} from 'lucide-react'

import {getCountryFlag, COUNTRY_META} from '../../lib/geo-coords'

const TurkeyMapChart = React.lazy(() => import('./TurkeyMapChart'))
const USMapChart = React.lazy(() => import('./USMapChart'))
const WorldMapChart = React.lazy(() => import('./WorldMapChart'))

export interface AnalyticsData {
  overview: {
    activeUsers: number
    sessions: number
    pageViews: number
    bounceRate: number
    avgSessionDuration: number
    newUsers: number
    engagedSessions: number
  }
  dailyVisitors: {
    date: string
    activeUsers: number
    sessions: number
    pageViews: number
    newUsers: number
  }[]
  topPages: {
    pagePath: string
    pageTitle: string
    pageViews: number
    users: number
    avgDuration: number
    bounceRate: number
  }[]
  trafficSources: {
    channel: string
    sessions: number
    users: number
    bounceRate: number
  }[]
  deviceBreakdown: {
    device: string
    sessions: number
    users: number
  }[]
  countryData: {
    country: string
    users: number
    sessions: number
  }[]
  regionData?: {
    country?: string
    region: string
    users: number
    sessions: number
  }[]
  cityData: {
    country?: string
    region?: string
    city: string
    users: number
    sessions: number
  }[]
  browserData: {
    browser: string
    sessions: number
    users: number
  }[]
  realtime?: {
    activeUsers: number
    activePages: {page: string; users: number}[]
    activeCountries: {country: string; city: string; users: number}[]
    error?: string
  }
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: '#6366f1',
  mobile: '#06b6d4',
  tablet: '#f59e0b',
}

const CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': '#10b981',
  Direct: '#6366f1',
  'Organic Social': '#ec4899',
  Referral: '#f59e0b',
  Unassigned: '#94a3b8',
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0 sn'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  if (m === 0) return `${s} sn`
  return `${m} dk ${s} sn`
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{color: string; name: string; value: number | string}>
  label?: string
}

function CustomTooltip({active, payload, label}: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 text-slate-800 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{backgroundColor: p.color}} />
          <span className="text-slate-500 font-medium">{p.name}:</span>
          <span className="font-bold text-slate-900">
            {typeof p.value === 'number' ? p.value.toLocaleString('tr-TR') : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

type DateRangeKey =
  | '7daysAgo'
  | '30daysAgo'
  | '90daysAgo'
  | '180daysAgo'
  | '365daysAgo'
  | '2020-01-01'

const DATE_RANGES: {key: DateRangeKey; label: string}[] = [
  {key: '7daysAgo', label: 'Son 7 Gün'},
  {key: '30daysAgo', label: 'Son 30 Gün'},
  {key: '90daysAgo', label: 'Son 3 Ay'},
  {key: '180daysAgo', label: 'Son 6 Ay'},
  {key: '365daysAgo', label: 'Son 1 Yıl'},
  {key: '2020-01-01', label: 'Tüm Zamanlar'},
]

interface AnalyticsDashboardProps {
  apiBaseUrl?: string
  isEmbeddedInStudio?: boolean
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  apiBaseUrl = '/api',
  isEmbeddedInStudio = false,
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [realtimeData, setRealtimeData] = useState<AnalyticsData['realtime'] | null>(null)
  const [dateRange, setDateRange] = useState<DateRangeKey>('30daysAgo')
  const [activeTab, setActiveTab] = useState<
    'overview' | 'realtime' | 'pages' | 'geography' | 'sources'
  >('overview')
  const [mapSubTab, setMapSubTab] = useState<'turkey' | 'us' | 'world'>('turkey')
  const [pageSearch, setPageSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredPages = useMemo(() => {
    if (!data?.topPages) return []
    if (!pageSearch.trim()) return data.topPages
    const q = pageSearch.toLowerCase()
    return data.topPages.filter(
      p => p.pagePath.toLowerCase().includes(q) || p.pageTitle.toLowerCase().includes(q)
    )
  }, [data?.topPages, pageSearch])

  const turkishCitiesForMap = useMemo(() => {
    if (!data?.cityData) return []
    return data.cityData.map(c => ({
      city: c.city,
      region: '',
      users: c.users,
      sessions: c.sessions,
      pageViews: c.sessions * 4,
    }))
  }, [data?.cityData])

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {}
    if (typeof window !== 'undefined') {
      const pin = sessionStorage.getItem('birim_analytics_pin')
      if (pin) headers['x-analytics-pin'] = pin
      const token = localStorage.getItem('birim_token')
      if (token) headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }, [])

  const fetchData = useCallback(
    async (range: string, isSilent = false) => {
      try {
        if (!isSilent) setLoading(true)
        setError(null)

        const res = await fetch(
          `${apiBaseUrl}/analytics?startDate=${range}&endDate=today&type=all`,
          {
            headers: getAuthHeaders(),
            credentials: 'same-origin',
          }
        )
        if (!res.ok) {
          throw new Error(`API hatası: ${res.status}`)
        }
        const json = await res.json()
        if (json.success && json.data) {
          setData(json.data)
          if (json.data.realtime) {
            setRealtimeData(json.data.realtime)
          }
        } else {
          throw new Error(json.error || 'Veri alınamadı')
        }
      } catch (err: unknown) {
        console.error('[AnalyticsDashboard] Veri çekme hatası:', err)
        const msg =
          err instanceof Error ? err.message : 'Analitik verileri yüklenirken bir sorun oluştu.'
        setError(msg)
      } finally {
        if (!isSilent) setLoading(false)
        setRefreshing(false)
      }
    },
    [apiBaseUrl, getAuthHeaders]
  )

  const fetchRealtime = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/analytics?type=realtime`, {
        headers: getAuthHeaders(),
        credentials: 'same-origin',
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data?.realtime) {
          setRealtimeData(json.data.realtime)
        }
      }
    } catch {
      // ignore
    }
  }, [apiBaseUrl, getAuthHeaders])

  useEffect(() => {
    fetchData(dateRange)
  }, [dateRange, fetchData])

  // Realtime polling every 45 seconds (only when active tab is visible)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      fetchRealtime()
    }, 45000)
    return () => clearInterval(interval)
  }, [fetchRealtime])

  const handleManualRefresh = () => {
    setRefreshing(true)
    fetchData(dateRange, true)
    fetchRealtime()
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
        <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light text-slate-500 tracking-wide">
          Google Analytics canlı verileri yükleniyor...
        </p>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <Activity className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-medium text-slate-800 mb-1">Analitik Yüklenemedi</h3>
        <p className="text-sm text-slate-500 max-w-md mb-6">{error}</p>
        <button
          onClick={handleManualRefresh}
          className="px-5 py-2.5 bg-slate-900 text-white text-xs uppercase tracking-wider rounded-lg hover transition"
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  const overview = data?.overview
  const activeOnline = realtimeData?.activeUsers ?? 0

  const kpis = [
    {
      label: 'Aktif Ziyaretçiler',
      value: (overview?.activeUsers || 0).toLocaleString('tr-TR'),
      sub: 'Tekil kullanıcı',
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      label: 'Toplam Oturum',
      value: (overview?.sessions || 0).toLocaleString('tr-TR'),
      sub: 'Ziyaret sayısı',
      icon: Compass,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      border: 'border-cyan-100',
    },
    {
      label: 'Sayfa Görüntüleme',
      value: (overview?.pageViews || 0).toLocaleString('tr-TR'),
      sub: 'Görüntülenen sayfa',
      icon: Eye,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Hemen Çıkma Oranı',
      value: `%${((overview?.bounceRate || 0) * 100).toFixed(1)}`,
      sub: 'Tek sayfada ayrılan',
      icon: TrendingDown,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
    },
    {
      label: 'Ortalama Süre',
      value: formatDuration(overview?.avgSessionDuration || 0),
      sub: 'Oturum başına süre',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Yeni Kullanıcılar',
      value: (overview?.newUsers || 0).toLocaleString('tr-TR'),
      sub: 'İlk kez gelen ziyaretçi',
      icon: Zap,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
  ]

  return (
    <div
      className={`w-full ${isEmbeddedInStudio ? 'p-6 bg-slate-50 min-h-screen text-slate-800' : 'text-inherit'}`}
    >
      {/* Sticky Top Header, Filter & Controls Bar */}
      <div className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur-md pt-3 pb-4 -mx-2 px-2 sm:-mx-4 sm:px-4 border-b border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] mb-6 transition-all">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-light tracking-tight font-outfit text-slate-900">
                Site Analitiği & Ziyaretçi Raporu
              </h1>
              {isEmbeddedInStudio && (
                <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-[11px] font-medium tracking-wide">
                  Sanity CMS
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-light mt-0.5">
              Google Analytics (GA4) mülküne bağlı gerçek zamanlı ve dönemsel trafik göstergeleri
            </p>
          </div>

          {/* Action Controls & Date Range Filter */}
          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
            <div className="flex bg-slate-200/80 p-1 rounded-xl border border-slate-300/70 shadow-xs flex-wrap">
              {DATE_RANGES.map(range => {
                const isActive = dateRange === range.key
                const isItemLoading = loading && isActive
                return (
                  <button
                    key={range.key}
                    onClick={() => {
                      if (dateRange !== range.key) {
                        setDateRange(range.key)
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isItemLoading && <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />}
                    <span>{range.label}</span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing || loading}
              title="Verileri Yenile"
              className="p-2 bg-slate-200/80 hover:bg-slate-300/80 border border-slate-300/70 rounded-xl transition flex items-center justify-center text-slate-700 shadow-xs cursor-pointer disabled:opacity-60"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing || loading ? 'animate-spin text-indigo-600' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Animated Progress Shimmer on Top Bar */}
        {loading && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden bg-indigo-100/60">
            <motion.div
              initial={{x: '-100%'}}
              animate={{x: '100%'}}
              transition={{repeat: Infinity, duration: 1.1, ease: 'easeInOut'}}
              className="h-full w-2/3 bg-gradient-to-r from-transparent via-indigo-600 to-transparent"
            />
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Genel Bakış</span>
          </button>

          <button
            onClick={() => setActiveTab('realtime')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'realtime'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Canlı İzleme ({activeOnline})</span>
          </button>

          <button
            onClick={() => setActiveTab('geography')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'geography'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Haritalar & Coğrafya</span>
          </button>

          <button
            onClick={() => setActiveTab('pages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'pages'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Sayfalar & Modeller</span>
          </button>

          <button
            onClick={() => setActiveTab('sources')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'sources'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Kaynaklar & Cihazlar</span>
          </button>
        </div>
      </div>

      {/* Realtime Live Pulse Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50/60 via-white to-indigo-50/60 p-5 mb-8 text-slate-800 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-300">
              <span className="absolute w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="relative w-2.5 h-2.5 rounded-full bg-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm font-bold font-outfit tracking-tight text-slate-900">
                  {activeOnline} {activeOnline === 1 ? 'Kişi' : 'Kullanıcı'} Canlı
                </h3>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded font-semibold uppercase tracking-wider">
                  Realtime
                </span>
              </div>
              <p className="text-xs text-slate-500 font-light mt-0.5">
                Şu anda sitede gezinen anlık ziyaretçi sayısı
              </p>
            </div>
          </div>

          {realtimeData?.activePages && realtimeData.activePages.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 max-w-lg">
              <span className="text-xs text-slate-500 font-medium mr-1">Aktif Sayfalar:</span>
              {realtimeData.activePages.slice(0, 4).map((p, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 bg-slate-100 hover rounded-lg text-slate-700 font-medium border border-slate-200/60 truncate max-w-[200px]"
                  title={p.page}
                >
                  {p.page.replace(/^BIRIM\s*[-|]?\s*/i, '')} ({p.users})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Dashboard Content with Loading Feedback Overlay */}
      <div className="relative">
        <AnimatePresence>
          {loading && data && (
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.2}}
              className="absolute inset-0 z-30 bg-slate-50/50 backdrop-blur-[1.5px] rounded-3xl flex flex-col items-center justify-start pt-20 pointer-events-none"
            >
              <motion.div
                initial={{scale: 0.9, y: 10, opacity: 0}}
                animate={{scale: 1, y: 0, opacity: 1}}
                exit={{scale: 0.9, y: 10, opacity: 0}}
                className="sticky top-44 flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/95 border border-indigo-200/80 shadow-2xl text-slate-800 backdrop-blur-md"
              >
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold tracking-wide text-slate-800 font-outfit">
                  {DATE_RANGES.find(r => r.key === dateRange)?.label} verileri yükleniyor...
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OVERVIEW TAB CONTENT */}
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
              {kpis.map((kpi, idx) => {
                const Icon = kpi.icon
                return (
                  <div
                    key={idx}
                    className={`p-4 sm:p-5 rounded-2xl bg-white border ${kpi.border} shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
                        {kpi.label}
                      </span>
                      <div className={`p-2 rounded-xl ${kpi.bg}`}>
                        <Icon className={`w-4 h-4 ${kpi.color}`} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xl sm font-bold tracking-tight text-slate-900 font-outfit">
                        {kpi.value}
                      </p>
                      <p className="text-[11px] text-slate-400 font-light mt-0.5">{kpi.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Main Trends Area Chart */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Ziyaretçi & Sayfa Görüntülenme Trendi
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Günlük kullanıcı, oturum ve sayfa görüntüleme yoğunluğu
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-600" />
                    <span className="text-slate-600">Kullanıcılar</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-cyan-500" />
                    <span className="text-slate-600">Oturumlar</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Sayfa Gör.</span>
                  </div>
                </div>
              </div>

              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={data?.dailyVisitors || []}
                    margin={{top: 10, right: 10, left: -20, bottom: 0}}
                  >
                    <defs>
                      <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(148,163,184,0.15)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{fontSize: 11, fill: '#94a3b8'}}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                      tickFormatter={v => {
                        const parts = v.split('-')
                        if (parts.length === 3) {
                          if (dateRange === '365daysAgo' || dateRange === '2020-01-01') {
                            return `${parts[1]}/${parts[0].slice(2)}`
                          }
                          return `${parts[2]}/${parts[1]}`
                        }
                        return v
                      }}
                    />
                    <YAxis
                      tick={{fontSize: 11, fill: '#94a3b8'}}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="pageViews"
                      name="Sayfa Görüntüleme"
                      fill="url(#gradViews)"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="activeUsers"
                      name="Kullanıcılar"
                      fill="url(#gradUsers)"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Interactive Maps Showcase on Overview */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm mb-8 text-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      Etkileşimli Ziyaretçi Haritası
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Kullanıcıların harita üzerindeki coğrafi yoğunluğu ve şehir dağılımı (Zoom & Pan
                    destekli)
                  </p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setMapSubTab('turkey')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                      mapSubTab === 'turkey'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover'
                    }`}
                  >
                    Türkiye Haritası
                  </button>
                  <button
                    onClick={() => setMapSubTab('us')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                      mapSubTab === 'us'
                        ? 'bg-white text-slate-900 shadow-sm font-bold'
                        : 'text-slate-600 hover'
                    }`}
                  >
                    <span>🇺🇸</span>
                    <span>ABD Haritası</span>
                  </button>
                  <button
                    onClick={() => setMapSubTab('world')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                      mapSubTab === 'world'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover'
                    }`}
                  >
                    Dünya Haritası
                  </button>
                </div>
              </div>

              <div className="w-full bg-slate-50/80 rounded-2xl p-4 border border-slate-200 overflow-hidden min-h-[300px] flex items-center justify-center">
                <React.Suspense
                  fallback={
                    <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                      Harita yükleniyor...
                    </div>
                  }
                >
                  {mapSubTab === 'turkey' ? (
                    <TurkeyMapChart turkishCities={turkishCitiesForMap} />
                  ) : mapSubTab === 'us' ? (
                    <USMapChart cities={data?.cityData || []} regions={data?.regionData || []} />
                  ) : (
                    <WorldMapChart
                      countries={data?.countryData || []}
                      cities={data?.cityData || []}
                    />
                  )}
                </React.Suspense>
              </div>
            </div>

            {/* Grid Row 2: Top Pages Table & Traffic Channels */}
            <div className="grid lg:grid-cols-12 gap-8 mb-8">
              {/* Top Visited Pages & Products Table */}
              <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      En Çok Ziyaret Edilen Sayfalar & Modeller
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      En yüksek etkileşim alan içerikler
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {data?.topPages?.length || 0} Sayfa
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="pb-3 font-semibold">Sayfa / Başlık</th>
                        <th className="pb-3 font-semibold text-right">Görüntüleme</th>
                        <th className="pb-3 font-semibold text-right">Tekil Ziyaretçi</th>
                        <th className="pb-3 font-semibold text-right">Ort. Süre</th>
                        <th className="pb-3 font-semibold text-right">Hemen Çıkma</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data?.topPages || []).slice(0, 10).map((page, idx) => (
                        <tr key={idx} className="hover transition-colors">
                          <td className="py-3 pr-4 max-w-[260px] truncate">
                            <p className="font-medium text-slate-800 truncate">
                              {page.pageTitle || page.pagePath}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              {page.pagePath}
                            </p>
                          </td>
                          <td className="py-3 text-right font-semibold text-slate-900">
                            {page.pageViews.toLocaleString('tr-TR')}
                          </td>
                          <td className="py-3 text-right text-slate-600">
                            {page.users.toLocaleString('tr-TR')}
                          </td>
                          <td className="py-3 text-right text-slate-500 font-mono">
                            {formatDuration(page.avgDuration)}
                          </td>
                          <td className="py-3 text-right text-slate-500">
                            %{(page.bounceRate * 100).toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Traffic Channels & Device Breakdown */}
              <div className="lg:col-span-4 space-y-8">
                {/* Traffic Sources */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">Trafik Kaynakları</h3>
                  <p className="text-xs text-slate-400 mb-5">Ziyaretçilerin geldiği kanallar</p>

                  <div className="space-y-3">
                    {(data?.trafficSources || []).map((source, idx) => {
                      const totalSessions = overview?.sessions || 1
                      const percent = Math.round((source.sessions / totalSessions) * 100)
                      const color = CHANNEL_COLORS[source.channel] || '#6366f1'
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700">{source.channel}</span>
                            <span className="text-slate-500 font-mono">
                              {source.sessions.toLocaleString('tr-TR')} ({percent}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{width: `${Math.min(percent, 100)}%`, backgroundColor: color}}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Device Breakdown */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">Cihaz Dağılımı</h3>
                  <p className="text-xs text-slate-400 mb-5">Masaüstü, mobil ve tablet oranları</p>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    {(data?.deviceBreakdown || []).map((dev, idx) => {
                      const totalSessions = overview?.sessions || 1
                      const percent = Math.round((dev.sessions / totalSessions) * 100)
                      const Icon =
                        dev.device === 'mobile'
                          ? Smartphone
                          : dev.device === 'tablet'
                            ? Tablet
                            : Monitor
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50"
                        >
                          <Icon
                            className="w-5 h-5 mx-auto mb-2"
                            style={{color: DEVICE_COLORS[dev.device] || '#6366f1'}}
                          />
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                            {dev.device === 'desktop'
                              ? 'Masaüstü'
                              : dev.device === 'mobile'
                                ? 'Mobil'
                                : 'Tablet'}
                          </p>
                          <p className="text-base font-bold text-slate-900 font-outfit mt-1">
                            %{percent}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {dev.sessions.toLocaleString('tr-TR')} oturum
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Row 3: Geography & Cities */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* City Breakdown */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <h3 className="text-base font-semibold text-slate-900">
                    Şehirlere Göre Ziyaretçiler
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">En yoğun ziyaretçi çeken şehirler</p>

                <div className="space-y-2.5">
                  {(data?.cityData || []).slice(0, 8).map((city, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-base shrink-0">
                          {getCountryFlag(city.country || '')}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 truncate block">
                            {city.city}
                          </span>
                          {city.country && (
                            <span className="text-[10px] text-slate-400 truncate block">
                              {COUNTRY_META[city.country]?.nameTr || city.country}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-slate-500 shrink-0">
                        <span className="font-medium text-slate-800">
                          {city.users.toLocaleString('tr-TR')} kullanıcı
                        </span>
                        <span className="font-mono text-slate-400">({city.sessions} oturum)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Country Breakdown */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-base font-semibold text-slate-900">
                    Ülkelere Göre Ziyaretçiler
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">Uluslararası ve yerel trafik dağılımı</p>

                <div className="space-y-2.5">
                  {(data?.countryData || []).slice(0, 8).map((country, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-base shrink-0">
                          {getCountryFlag(country.country)}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 truncate block">
                            {COUNTRY_META[country.country]?.nameTr || country.country}
                          </span>
                          {COUNTRY_META[country.country] && (
                            <span className="text-[10px] text-slate-400 truncate block">
                              {country.country}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-slate-500 shrink-0">
                        <span className="font-medium text-slate-800">
                          {country.users.toLocaleString('tr-TR')} kullanıcı
                        </span>
                        <span className="font-mono text-slate-400">
                          ({country.sessions} oturum)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB: REALTIME */}
        {activeTab === 'realtime' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 text-slate-900 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Anlık Canlı
                    </span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <p className="text-5xl font-black font-outfit text-emerald-600">{activeOnline}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Şu anda sitede gezinen anlık ziyaretçi
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
                  Her 20 saniyede bir otomatik yenilenir
                </div>
              </div>

              <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-1">
                  Şu Anda Gezilen Sayfalar
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Aktif ziyaretçilerin açık tuttuğu sayfalar
                </p>

                <div className="space-y-2">
                  {(realtimeData?.activePages || []).map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs"
                    >
                      <span className="font-medium text-slate-800 truncate max-w-md">{p.page}</span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {p.users} kullanıcı
                      </span>
                    </div>
                  ))}
                  {(!realtimeData?.activePages || realtimeData.activePages.length === 0) && (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      Şu anda aktif gezilen sayfa yok.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                Canlı Ziyaretçi Konumları
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Şu an aktif olan ziyaretçilerin şehir ve ülkeleri
              </p>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(realtimeData?.activeCountries || []).map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      <div>
                        <p className="font-semibold text-slate-800">{c.city || c.country}</p>
                        <p className="text-[10px] text-slate-400">{c.country}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">{c.users} Kişi</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: GEOGRAPHY & FULL MAPS */}
        {activeTab === 'geography' && (
          <div className="space-y-8">
            {/* Turkey Map */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm text-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-rose-500" />
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      Türkiye Ziyaretçi Yoğunluğu Haritası
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Türkiye genelindeki il ve ilçe bazlı kullanıcı yoğunluk noktaları (Yakınlaştırma
                    ve kaydırma destekli)
                  </p>
                </div>
              </div>

              <div className="w-full bg-slate-50/80 rounded-2xl p-4 border border-slate-200 overflow-hidden min-h-[300px]">
                <React.Suspense
                  fallback={
                    <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                      Türkiye Haritası yükleniyor...
                    </div>
                  }
                >
                  <TurkeyMapChart turkishCities={turkishCitiesForMap} />
                </React.Suspense>
              </div>
            </div>

            {/* USA Map */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm text-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl leading-none">🇺🇸</span>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      Amerika Birleşik Devletleri (ABD) Ziyaretçi Haritası
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Eyalet (State) sıcaklık haritası ve nokta atışı şehir pinleri (Albers
                    Projeksiyonu & Yakınlaştırma)
                  </p>
                </div>
              </div>

              <div className="w-full bg-slate-50/80 rounded-2xl p-4 border border-slate-200 overflow-hidden min-h-[300px]">
                <React.Suspense
                  fallback={
                    <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                      ABD Haritası yükleniyor...
                    </div>
                  }
                >
                  <USMapChart cities={data?.cityData || []} regions={data?.regionData || []} />
                </React.Suspense>
              </div>
            </div>

            {/* World Map */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm text-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      Dünya Ziyaretçi Dağılımı Haritası
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Uluslararası ziyaretçilerin küresel ölçekte ülke ve şehir bazlı dağılımı
                  </p>
                </div>
              </div>

              <div className="w-full bg-slate-50/80 rounded-2xl p-4 border border-slate-200 overflow-hidden min-h-[300px]">
                <React.Suspense
                  fallback={
                    <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                      Dünya Haritası yükleniyor...
                    </div>
                  }
                >
                  <WorldMapChart
                    countries={data?.countryData || []}
                    cities={data?.cityData || []}
                  />
                </React.Suspense>
              </div>
            </div>

            {/* 3-Column Breakdown: Cities, Regions/States, Countries */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Cities Table */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <h3 className="text-base font-semibold text-slate-900">Şehirlere Göre Dağılım</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">En çok ziyaretçi alan şehirler</p>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {(data?.cityData || []).slice(0, 50).map((city, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-base shrink-0">
                          {getCountryFlag(city.country || '')}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 truncate block">
                            {city.city}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {city.region ? `${city.region} • ` : ''}
                            {COUNTRY_META[city.country || '']?.nameTr || city.country}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 shrink-0 text-right">
                        <span className="font-medium text-slate-800">
                          {city.users.toLocaleString('tr-TR')}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          ({city.sessions})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regions / US States Table */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base leading-none">🏛️</span>
                  <h3 className="text-base font-semibold text-slate-900">Eyalet & Bölgeler</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">ABD Eyaletleri ve bölge dağılımları</p>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {(data?.regionData || []).slice(0, 50).map((region, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-base shrink-0">
                          {getCountryFlag(region.country || '')}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 truncate block">
                            {region.region}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {COUNTRY_META[region.country || '']?.nameTr || region.country}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 shrink-0 text-right">
                        <span className="font-medium text-slate-800">
                          {region.users.toLocaleString('tr-TR')}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          ({region.sessions})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Countries Table */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-base font-semibold text-slate-900">Ülkelere Göre Dağılım</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">Uluslararası ülke toplamları</p>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {(data?.countryData || []).map((country, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-base shrink-0">
                          {getCountryFlag(country.country)}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 truncate block">
                            {COUNTRY_META[country.country]?.nameTr || country.country}
                          </span>
                          {COUNTRY_META[country.country] && (
                            <span className="text-[10px] text-slate-400 truncate block">
                              {country.country}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 shrink-0 text-right">
                        <span className="font-medium text-slate-800">
                          {country.users.toLocaleString('tr-TR')}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          ({country.sessions})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PAGES & PRODUCTS */}
        {activeTab === 'pages' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Sayfalar & Mobilya Modelleri Raporu
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tüm sayfaların etkileşim, görüntülenme ve oturum istatistikleri
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Sayfa veya model ara..."
                  value={pageSearch}
                  onChange={e => setPageSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-semibold">Sayfa / Başlık</th>
                    <th className="pb-3 font-semibold text-right">Görüntüleme</th>
                    <th className="pb-3 font-semibold text-right">Tekil Ziyaretçi</th>
                    <th className="pb-3 font-semibold text-right">Ort. Okunma Süresi</th>
                    <th className="pb-3 font-semibold text-right">Hemen Çıkma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPages.map((page, idx) => (
                    <tr key={idx} className="hover transition-colors">
                      <td className="py-3.5 pr-4 max-w-[360px]">
                        <p className="font-semibold text-slate-800 truncate">
                          {page.pageTitle || page.pagePath}
                        </p>
                        <a
                          href={page.pagePath}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-indigo-500 hover:underline font-mono truncate flex items-center gap-1 mt-0.5"
                        >
                          {page.pagePath} <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      </td>
                      <td className="py-3.5 text-right font-bold text-slate-900">
                        {page.pageViews.toLocaleString('tr-TR')}
                      </td>
                      <td className="py-3.5 text-right text-slate-600">
                        {page.users.toLocaleString('tr-TR')}
                      </td>
                      <td className="py-3.5 text-right text-slate-500 font-mono">
                        {formatDuration(page.avgDuration)}
                      </td>
                      <td className="py-3.5 text-right text-slate-500 font-semibold">
                        %{(page.bounceRate * 100).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: SOURCES & TECH */}
        {activeTab === 'sources' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-1">
                  Trafik Kanalları & Edinme
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Ziyaretçilerin web sitenize ulaşma yolları
                </p>

                <div className="space-y-4">
                  {(data?.trafficSources || []).map((source, idx) => {
                    const totalSessions = overview?.sessions || 1
                    const percent = Math.round((source.sessions / totalSessions) * 100)
                    const color = CHANNEL_COLORS[source.channel] || '#6366f1'
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{source.channel}</span>
                          <span className="text-slate-500 font-mono">
                            {source.sessions.toLocaleString('tr-TR')} oturum (%{percent})
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{width: `${Math.min(percent, 100)}%`, backgroundColor: color}}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-1">Tarayıcı Dağılımı</h3>
                <p className="text-xs text-slate-400 mb-6">En çok tercih edilen web tarayıcıları</p>

                <div className="space-y-3">
                  {(data?.browserData || []).map((b, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs"
                    >
                      <span className="font-medium text-slate-800">{b.browser}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">
                          {b.users.toLocaleString('tr-TR')} kullanıcı
                        </span>
                        <span className="text-slate-400 font-mono">({b.sessions} oturum)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Cihaz Kategorileri</h3>
              <p className="text-xs text-slate-400 mb-6">
                Masaüstü, mobil telefon ve tablet cihaz oranları
              </p>

              <div className="grid md:grid-cols-3 gap-4 text-center">
                {(data?.deviceBreakdown || []).map((dev, idx) => {
                  const totalSessions = overview?.sessions || 1
                  const percent = Math.round((dev.sessions / totalSessions) * 100)
                  const Icon =
                    dev.device === 'mobile'
                      ? Smartphone
                      : dev.device === 'tablet'
                        ? Tablet
                        : Monitor
                  return (
                    <div
                      key={idx}
                      className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50"
                    >
                      <Icon
                        className="w-8 h-8 mx-auto mb-3"
                        style={{color: DEVICE_COLORS[dev.device] || '#6366f1'}}
                      />
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                        {dev.device === 'desktop'
                          ? 'Masaüstü'
                          : dev.device === 'mobile'
                            ? 'Mobil'
                            : 'Tablet'}
                      </h4>
                      <p className="text-3xl font-black text-slate-900 font-outfit mt-2">
                        %{percent}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        {dev.sessions.toLocaleString('tr-TR')} Oturum &bull;{' '}
                        {dev.users.toLocaleString('tr-TR')} Kullanıcı
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
