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
} from 'lucide-react'
import TurkeyMapChart from './TurkeyMapChart'
import WorldMapChart from './WorldMapChart'

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
  cityData: {
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
    <div className="bg-slate-900/95 text-white backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-xs">
      <p className="font-semibold text-slate-300 mb-2">{label}</p>
      {payload.map((p, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{backgroundColor: p.color}} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-bold text-white">
            {typeof p.value === 'number' ? p.value.toLocaleString('tr-TR') : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

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
  const [dateRange, setDateRange] = useState<'7daysAgo' | '30daysAgo' | '90daysAgo' | '365daysAgo'>(
    '30daysAgo'
  )
  const [activeTab, setActiveTab] = useState<
    'overview' | 'realtime' | 'pages' | 'geography' | 'sources'
  >('overview')
  const [mapSubTab, setMapSubTab] = useState<'turkey' | 'world'>('turkey')
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

  const fetchData = useCallback(
    async (range: string, isSilent = false) => {
      try {
        if (!isSilent) setLoading(true)
        setError(null)

        const res = await fetch(`${apiBaseUrl}/analytics?startDate=${range}&endDate=today&type=all`)
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
    [apiBaseUrl]
  )

  const fetchRealtime = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/analytics?type=realtime`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data?.realtime) {
          setRealtimeData(json.data.realtime)
        }
      }
    } catch {
      // ignore
    }
  }, [apiBaseUrl])

  useEffect(() => {
    fetchData(dateRange)
  }, [dateRange, fetchData])

  // Realtime polling every 25 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRealtime()
    }, 25000)
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
          className="px-5 py-2.5 bg-slate-900 text-white text-xs uppercase tracking-wider rounded-lg hover:bg-slate-800 transition"
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
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-100 dark:border-indigo-900/40',
    },
    {
      label: 'Toplam Oturum',
      value: (overview?.sessions || 0).toLocaleString('tr-TR'),
      sub: 'Ziyaret sayısı',
      icon: Compass,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950/40',
      border: 'border-cyan-100 dark:border-cyan-900/40',
    },
    {
      label: 'Sayfa Görüntüleme',
      value: (overview?.pageViews || 0).toLocaleString('tr-TR'),
      sub: 'Görüntülenen sayfa',
      icon: Eye,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-100 dark:border-emerald-900/40',
    },
    {
      label: 'Hemen Çıkma Oranı',
      value: `%${((overview?.bounceRate || 0) * 100).toFixed(1)}`,
      sub: 'Tek sayfada ayrılan',
      icon: TrendingDown,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-100 dark:border-rose-900/40',
    },
    {
      label: 'Ortalama Süre',
      value: formatDuration(overview?.avgSessionDuration || 0),
      sub: 'Oturum başına süre',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-100 dark:border-amber-900/40',
    },
    {
      label: 'Yeni Kullanıcılar',
      value: (overview?.newUsers || 0).toLocaleString('tr-TR'),
      sub: 'İlk kez gelen ziyaretçi',
      icon: Zap,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      border: 'border-purple-100 dark:border-purple-900/40',
    },
  ]

  return (
    <div
      className={`w-full ${isEmbeddedInStudio ? 'p-6 bg-slate-50 min-h-screen text-slate-800' : 'text-inherit'}`}
    >
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight font-outfit">
              Site Analitiği & Ziyaretçi Raporu
            </h1>
            {isEmbeddedInStudio && (
              <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-[11px] font-medium tracking-wide">
                Sanity CMS
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-light mt-1">
            Google Analytics (GA4) mülküne bağlı gerçek zamanlı ve dönemsel trafik göstergeleri
          </p>
        </div>

        {/* Action Controls & Date Range */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-300/60 dark:border-slate-700/60">
            <button
              onClick={() => setDateRange('7daysAgo')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                dateRange === '7daysAgo'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Son 7 Gün
            </button>
            <button
              onClick={() => setDateRange('30daysAgo')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                dateRange === '30daysAgo'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Son 30 Gün
            </button>
            <button
              onClick={() => setDateRange('90daysAgo')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                dateRange === '90daysAgo'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Son 3 Ay
            </button>
            <button
              onClick={() => setDateRange('365daysAgo')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                dateRange === '365daysAgo'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Son 1 Yıl
            </button>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Verileri Yenile"
            className="p-2 bg-slate-200/70 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 border border-slate-300/60 dark:border-slate-700/60 rounded-xl transition flex items-center justify-center text-slate-700 dark:text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Genel Bakış</span>
        </button>

        <button
          onClick={() => setActiveTab('realtime')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'realtime'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400" />
          <span>Canlı İzleme ({activeOnline})</span>
        </button>

        <button
          onClick={() => setActiveTab('geography')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'geography'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4 text-indigo-400" />
          <span>Haritalar & Coğrafya</span>
        </button>

        <button
          onClick={() => setActiveTab('pages')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'pages'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Sayfalar & Modeller</span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'sources'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>Kaynaklar & Cihazlar</span>
        </button>
      </div>

      {/* Realtime Live Pulse Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 mb-8 text-white shadow-lg border border-indigo-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
              <span className="absolute w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="relative w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold font-outfit tracking-tight">
                  {activeOnline} {activeOnline === 1 ? 'Kişi' : 'Kullanıcı'} Canlı
                </h3>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 rounded font-semibold uppercase tracking-wider">
                  Realtime
                </span>
              </div>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Şu anda sitede gezinen anlık ziyaretçi sayısı
              </p>
            </div>
          </div>

          {realtimeData?.activePages && realtimeData.activePages.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 max-w-lg">
              <span className="text-xs text-slate-400 font-medium mr-1">Aktif Sayfalar:</span>
              {realtimeData.activePages.slice(0, 4).map((p, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-slate-200 truncate max-w-[200px]"
                  title={p.page}
                >
                  {p.page.replace(/^BIRIM\s*[-|]?\s*/i, '')} ({p.users})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

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
                  className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border ${kpi.border} shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200`}
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
                    <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
                      {kpi.value}
                    </p>
                    <p className="text-[11px] text-slate-400 font-light mt-0.5">{kpi.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Main Trends Area Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                  Ziyaretçi & Sayfa Görüntülenme Trendi
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Günlük kullanıcı, oturum ve sayfa görüntüleme yoğunluğu
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-600" />
                  <span className="text-slate-600 dark:text-slate-300">Kullanıcılar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-cyan-500" />
                  <span className="text-slate-600 dark:text-slate-300">Oturumlar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-300">Sayfa Gör.</span>
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
                    tickFormatter={v => {
                      const parts = v.split('-')
                      return parts.length === 3 ? `${parts[2]}/${parts[1]}` : v
                    }}
                  />
                  <YAxis tick={{fontSize: 11, fill: '#94a3b8'}} tickLine={false} axisLine={false} />
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
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl mb-8 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-xl font-bold tracking-tight">
                    Etkileşimli Ziyaretçi Haritası
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Kullanıcıların harita üzerindeki coğrafi yoğunluğu ve şehir dağılımı (Zoom & Pan
                  destekli)
                </p>
              </div>

              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setMapSubTab('turkey')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                    mapSubTab === 'turkey'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Türkiye Haritası
                </button>
                <button
                  onClick={() => setMapSubTab('world')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                    mapSubTab === 'world'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dünya Haritası
                </button>
              </div>
            </div>

            <div className="w-full bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80 overflow-hidden">
              {mapSubTab === 'turkey' ? (
                <TurkeyMapChart turkishCities={turkishCitiesForMap} />
              ) : (
                <WorldMapChart countries={data?.countryData || []} />
              )}
            </div>
          </div>

          {/* Grid Row 2: Top Pages Table & Traffic Channels */}
          <div className="grid lg:grid-cols-12 gap-8 mb-8">
            {/* Top Visited Pages & Products Table */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    En Çok Ziyaret Edilen Sayfalar & Modeller
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    En yüksek etkileşim alan içerikler
                  </p>
                </div>
                <span className="text-xs text-slate-400">{data?.topPages?.length || 0} Sayfa</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="pb-3 font-semibold">Sayfa / Başlık</th>
                      <th className="pb-3 font-semibold text-right">Görüntüleme</th>
                      <th className="pb-3 font-semibold text-right">Tekil Ziyaretçi</th>
                      <th className="pb-3 font-semibold text-right">Ort. Süre</th>
                      <th className="pb-3 font-semibold text-right">Hemen Çıkma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {(data?.topPages || []).slice(0, 10).map((page, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 pr-4 max-w-[260px] truncate">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {page.pageTitle || page.pagePath}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {page.pagePath}
                          </p>
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {page.pageViews.toLocaleString('tr-TR')}
                        </td>
                        <td className="py-3 text-right text-slate-600 dark:text-slate-300">
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  Trafik Kaynakları
                </h3>
                <p className="text-xs text-slate-400 mb-5">Ziyaretçilerin geldiği kanallar</p>

                <div className="space-y-3">
                  {(data?.trafficSources || []).map((source, idx) => {
                    const totalSessions = overview?.sessions || 1
                    const percent = Math.round((source.sessions / totalSessions) * 100)
                    const color = CHANNEL_COLORS[source.channel] || '#6366f1'
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {source.channel}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {source.sessions.toLocaleString('tr-TR')} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  Cihaz Dağılımı
                </h3>
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
                        className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                      >
                        <Icon
                          className="w-5 h-5 mx-auto mb-2"
                          style={{color: DEVICE_COLORS[dev.device] || '#6366f1'}}
                        />
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          {dev.device === 'desktop'
                            ? 'Masaüstü'
                            : dev.device === 'mobile'
                              ? 'Mobil'
                              : 'Tablet'}
                        </p>
                        <p className="text-base font-bold text-slate-900 dark:text-white font-outfit mt-1">
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-rose-500" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Şehirlere Göre Ziyaretçiler
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">En yoğun ziyaretçi çeken şehirler</p>

              <div className="space-y-2.5">
                {(data?.cityData || []).slice(0, 8).map((city, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {city.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500">
                      <span>{city.users.toLocaleString('tr-TR')} kullanıcı</span>
                      <span className="font-mono text-slate-400">({city.sessions} oturum)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Country Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-indigo-500" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Ülkelere Göre Ziyaretçiler
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">Uluslararası ve yerel trafik dağılımı</p>

              <div className="space-y-2.5">
                {(data?.countryData || []).slice(0, 8).map((country, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {country.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500">
                      <span>{country.users.toLocaleString('tr-TR')} kullanıcı</span>
                      <span className="font-mono text-slate-400">({country.sessions} oturum)</span>
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
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Anlık Canlı
                  </span>
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className="text-5xl font-black font-outfit text-emerald-400">{activeOnline}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Şu anda sitede gezinen anlık ziyaretçi
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                Her 20 saniyede bir otomatik yenilenir
              </div>
            </div>

            <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                Şu Anda Gezilen Sayfalar
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Aktif ziyaretçilerin açık tuttuğu sayfalar
              </p>

              <div className="space-y-2">
                {(realtimeData?.activePages || []).map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-md">
                      {p.page}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
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

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Canlı Ziyaretçi Konumları
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Şu an aktif olan ziyaretçilerin şehir ve ülkeleri
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(realtimeData?.activeCountries || []).map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.city || c.country}
                      </p>
                      <p className="text-[10px] text-slate-400">{c.country}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{c.users} Kişi</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: GEOGRAPHY & FULL MAPS */}
      {activeTab === 'geography' && (
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  <h2 className="text-xl font-bold tracking-tight">
                    Türkiye Ziyaretçi Yoğunluğu Haritası
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Şehirlere göre kullanıcı yoğunluk noktaları (Yakınlaştırma ve kaydırma destekli)
                </p>
              </div>
            </div>

            <div className="w-full bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80 overflow-hidden">
              <TurkeyMapChart turkishCities={turkishCitiesForMap} />
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-xl font-bold tracking-tight">
                    Dünya Ziyaretçi Dağılımı Haritası
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Uluslararası ziyaretçilerin ülke bazlı dağılımı
                </p>
              </div>
            </div>

            <div className="w-full bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80 overflow-hidden">
              <WorldMapChart countries={data?.countryData || []} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
                Şehirlere Göre Dağılım
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {(data?.cityData || []).map((city, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {city.city}
                    </span>
                    <div className="flex items-center gap-3 text-slate-500">
                      <span>{city.users.toLocaleString('tr-TR')} kullanıcı</span>
                      <span className="font-mono text-slate-400">({city.sessions} oturum)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
                Ülkelere Göre Dağılım
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {(data?.countryData || []).map((country, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {country.country}
                    </span>
                    <div className="flex items-center gap-3 text-slate-500">
                      <span>{country.users.toLocaleString('tr-TR')} kullanıcı</span>
                      <span className="font-mono text-slate-400">({country.sessions} oturum)</span>
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
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
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Sayfa / Başlık</th>
                  <th className="pb-3 font-semibold text-right">Görüntüleme</th>
                  <th className="pb-3 font-semibold text-right">Tekil Ziyaretçi</th>
                  <th className="pb-3 font-semibold text-right">Ort. Okunma Süresi</th>
                  <th className="pb-3 font-semibold text-right">Hemen Çıkma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredPages.map((page, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 pr-4 max-w-[360px]">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
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
                    <td className="py-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                      {page.pageViews.toLocaleString('tr-TR')}
                    </td>
                    <td className="py-3.5 text-right text-slate-600 dark:text-slate-300">
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
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
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {source.channel}
                        </span>
                        <span className="text-slate-500 font-mono">
                          {source.sessions.toLocaleString('tr-TR')} oturum (%{percent})
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                Tarayıcı Dağılımı
              </h3>
              <p className="text-xs text-slate-400 mb-6">En çok tercih edilen web tarayıcıları</p>

              <div className="space-y-3">
                {(data?.browserData || []).map((b, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {b.browser}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {b.users.toLocaleString('tr-TR')} kullanıcı
                      </span>
                      <span className="text-slate-400 font-mono">({b.sessions} oturum)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              Cihaz Kategorileri
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Masaüstü, mobil telefon ve tablet cihaz oranları
            </p>

            <div className="grid md:grid-cols-3 gap-4 text-center">
              {(data?.deviceBreakdown || []).map((dev, idx) => {
                const totalSessions = overview?.sessions || 1
                const percent = Math.round((dev.sessions / totalSessions) * 100)
                const Icon =
                  dev.device === 'mobile' ? Smartphone : dev.device === 'tablet' ? Tablet : Monitor
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                  >
                    <Icon
                      className="w-8 h-8 mx-auto mb-3"
                      style={{color: DEVICE_COLORS[dev.device] || '#6366f1'}}
                    />
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {dev.device === 'desktop'
                        ? 'Masaüstü'
                        : dev.device === 'mobile'
                          ? 'Mobil'
                          : 'Tablet'}
                    </h4>
                    <p className="text-3xl font-black text-slate-900 dark:text-white font-outfit mt-2">
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
  )
}
