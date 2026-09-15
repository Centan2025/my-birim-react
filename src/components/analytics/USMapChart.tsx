/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import {memo, useState, useCallback, useRef, useMemo} from 'react'
import {ComposableMap, Geographies, Geography, Marker} from 'react-simple-maps'
import {US_STATE_META, getUSStateFromFips, getCityCoordinates} from '../../lib/geo-coords'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Users,
  BarChart3,
  MapPin,
  Sparkles,
  X,
  Building2,
} from 'lucide-react'

const US_GEO_URL = '/data/us-states-10m.json'

export interface CityData {
  country?: string
  region?: string
  city: string
  users: number
  sessions: number
}

export interface RegionData {
  country?: string
  region: string
  users: number
  sessions: number
}

interface Props {
  cities?: CityData[]
  regions?: RegionData[]
}

type MetricType = 'users' | 'sessions'

interface TooltipInfo {
  type: 'state' | 'city'
  stateName?: string
  stateNameTr?: string
  stateCode?: string
  cityName?: string
  users: number
  sessions: number
  percentage?: string
  citiesInState?: {city: string; users: number; sessions: number}[]
}

function USMapChart({cities = [], regions = []}: Props) {
  const [metric, setMetric] = useState<MetricType>('users')
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const [tooltipPos, setTooltipPos] = useState({x: 0, y: 0})
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([-96, 38])
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredFips, setHoveredFips] = useState<string | null>(null)

  const dragStart = useRef<{
    x: number
    y: number
    center: [number, number]
  } | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Filter only US data
  const usCities = useMemo(() => {
    return cities.filter(c => {
      const country = (c.country || '').toLowerCase()
      return country === 'united states' || country === 'usa' || country === 'us'
    })
  }, [cities])

  // Aggregate stats by State
  const stateStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string
        nameTr: string
        code: string
        users: number
        sessions: number
        cities: CityData[]
      }
    >()

    // 1. Initialize from regions if provided
    regions
      .filter(r => {
        const country = (r.country || '').toLowerCase()
        return !country || country === 'united states' || country === 'usa' || country === 'us'
      })
      .forEach(r => {
        const meta = Object.values(US_STATE_META).find(
          m =>
            m.name.toLowerCase() === r.region.toLowerCase() ||
            m.code.toLowerCase() === r.region.toLowerCase()
        )
        if (meta) {
          const key = meta.name.toLowerCase()
          map.set(key, {
            name: meta.name,
            nameTr: meta.nameTr,
            code: meta.code,
            users: r.users,
            sessions: r.sessions,
            cities: [],
          })
        }
      })

    // 2. Attach cities and fallback aggregation
    usCities.forEach(c => {
      let stateName = c.region
      let meta = stateName
        ? Object.values(US_STATE_META).find(
            m =>
              m.name.toLowerCase() === stateName?.toLowerCase() ||
              m.code.toLowerCase() === stateName?.toLowerCase()
          )
        : undefined

      // If state is missing or (not set), try matching city in major US cities
      if (!meta) {
        for (const [sName, sMeta] of Object.entries(US_STATE_META)) {
          if (c.city.toLowerCase().includes(sName.toLowerCase())) {
            meta = sMeta
            stateName = sName
            break
          }
        }
      }

      if (meta) {
        const key = meta.name.toLowerCase()
        const existing = map.get(key)
        if (existing) {
          if (!existing.cities.some(item => item.city === c.city)) {
            existing.cities.push(c)
          }
          if (regions.length === 0) {
            existing.users += c.users
            existing.sessions += c.sessions
          }
        } else {
          map.set(key, {
            name: meta.name,
            nameTr: meta.nameTr,
            code: meta.code,
            users: c.users,
            sessions: c.sessions,
            cities: [c],
          })
        }
      }
    })

    return map
  }, [usCities, regions])

  const totalUSUsers = useMemo(() => {
    let sum = 0
    stateStatsMap.forEach(s => {
      sum += metric === 'users' ? s.users : s.sessions
    })
    return (
      sum || usCities.reduce((acc, c) => acc + (metric === 'users' ? c.users : c.sessions), 0) || 1
    )
  }, [stateStatsMap, usCities, metric])

  const maxStateMetric = useMemo(() => {
    let max = 1
    stateStatsMap.forEach(s => {
      const v = metric === 'users' ? s.users : s.sessions
      if (v > max) max = v
    })
    return max
  }, [stateStatsMap, metric])

  // Resolved US city markers with coordinates
  const resolvedCityMarkers = useMemo(() => {
    const list: (CityData & {lat: number; lng: number})[] = []
    const seen = new Set<string>()

    usCities.forEach(c => {
      if (!c.city || c.city === '(not set)' || c.city === 'Unknown') return
      const coords = getCityCoordinates(c.city, 'United States', c.region)
      if (coords) {
        const key = `${c.city}_${c.region}`
        if (!seen.has(key)) {
          seen.add(key)
          list.push({
            ...c,
            lat: coords[0],
            lng: coords[1],
          })
        }
      }
    })
    return list.sort((a, b) => (metric === 'users' ? b.users - a.users : b.sessions - a.sessions))
  }, [usCities, metric])

  // Get data for a State polygon by FIPS or Name
  const getStateDataByFips = useCallback(
    (fips: string) => {
      const stateName = getUSStateFromFips(fips)
      if (!stateName) return undefined
      return stateStatsMap.get(stateName.toLowerCase())
    },
    [stateStatsMap]
  )

  // Choropleth color fill
  const getStateFill = useCallback(
    (fips: string) => {
      const stateData = getStateDataByFips(fips)
      if (!stateData) return '#f1f5f9' // slate-100

      const val = metric === 'users' ? stateData.users : stateData.sessions
      if (val === 0) return '#f1f5f9'

      const ratio = val / maxStateMetric

      if (selectedState && selectedState.toLowerCase() === stateData.name.toLowerCase()) {
        return '#3730a3' // Indigo-800 selected
      }

      if (ratio > 0.6) return '#4338ca' // Indigo-700
      if (ratio > 0.3) return '#4f46e5' // Indigo-600
      if (ratio > 0.15) return '#6366f1' // Indigo-500
      if (ratio > 0.05) return '#818cf8' // Indigo-400
      return '#c7d2fe' // Indigo-200
    },
    [getStateDataByFips, metric, maxStateMetric, selectedState]
  )

  // State selection handler
  const handleStateClick = useCallback((stateName: string) => {
    const meta =
      US_STATE_META[stateName] ||
      Object.values(US_STATE_META).find(m => m.nameTr.toLowerCase() === stateName.toLowerCase())
    if (meta) {
      setSelectedState(meta.name)
      setCenter([meta.center[1], meta.center[0]])
      setZoom(2.5)
    }
  }, [])

  const handleReset = useCallback(() => {
    setZoom(1)
    setCenter([-96, 38])
    setSelectedState(null)
  }, [])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 6))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const next = Math.max(prev / 1.5, 1)
      if (next === 1) {
        setCenter([-96, 38])
        setSelectedState(null)
      }
      return next
    })
  }, [])

  // Drag pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom <= 1) return
      e.preventDefault()
      setIsDragging(true)
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        center: [...center] as [number, number],
      }
    },
    [zoom, center]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragStart.current || zoom <= 1) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      const sensitivity = 0.05 / zoom
      setCenter([
        dragStart.current.center[0] - dx * sensitivity,
        dragStart.current.center[1] + dy * sensitivity,
      ])
    },
    [isDragging, zoom]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    dragStart.current = null
  }, [])

  // Top 6 States
  const topStates = useMemo(() => {
    return Array.from(stateStatsMap.values())
      .sort((a, b) => (metric === 'users' ? b.users - a.users : b.sessions - a.sessions))
      .filter(s => s.users > 0)
      .slice(0, 6)
  }, [stateStatsMap, metric])

  // Selected state info
  const selectedStateData = useMemo(() => {
    if (!selectedState) return null
    return stateStatsMap.get(selectedState.toLowerCase())
  }, [selectedState, stateStatsMap])

  return (
    <div
      role="region"
      aria-label="Amerika Birleşik Devletleri Haritası"
      ref={mapRef}
      className="relative w-full select-none overflow-hidden rounded-2xl bg-slate-900/5 backdrop-blur-sm border border-slate-200/80"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
      }}
    >
      {/* Top Header Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Breadcrumb */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md rounded-xl px-3 py-1.5 border border-slate-200 shadow-sm text-xs font-medium text-slate-700">
          <button
            onClick={handleReset}
            className={`hover:text-indigo-600 transition-colors flex items-center gap-1.5 ${
              !selectedState ? 'font-bold text-indigo-600' : 'text-slate-600'
            }`}
          >
            <span>🇺🇸</span>
            <span>
              Amerika Birleşik Devletleri ({totalUSUsers.toLocaleString('tr-TR')}{' '}
              {metric === 'users' ? 'kullanıcı' : 'oturum'})
            </span>
          </button>

          {selectedState && (
            <>
              <span className="text-slate-400">/</span>
              <span className="font-bold text-slate-900 bg-indigo-50 border border-indigo-200/80 rounded-lg px-2 py-0.5 flex items-center gap-1">
                <span>📍</span>
                <span>{selectedStateData?.nameTr || selectedState}</span>
              </span>
              <button
                onClick={handleReset}
                className="ml-1 text-[11px] text-slate-400 hover:text-slate-700 underline"
                title="Tüm ABD görünümüne dön"
              >
                Sıfırla
              </button>
            </>
          )}
        </div>

        {/* Right: Metric Toggle */}
        <div className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-md rounded-xl p-1 border border-slate-200 shadow-sm">
          <button
            onClick={() => setMetric('users')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              metric === 'users'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Kullanıcı</span>
          </button>
          <button
            onClick={() => setMetric('sessions')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              metric === 'sessions'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Oturum</span>
          </button>
        </div>
      </div>

      {/* Floating Selected State Inspector Panel */}
      {selectedState && selectedStateData && (
        <div className="absolute top-14 right-3 z-30 w-72 sm:w-80 max-h-[380px] bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-slate-200/90 shadow-2xl flex flex-col pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl leading-none">🇺🇸</span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {selectedStateData.nameTr} ({selectedStateData.code})
                </h3>
                <p className="text-[10px] text-slate-500 truncate">{selectedStateData.name}</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Tüm ABD görünümüne dön"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 my-2.5">
            <div className="bg-indigo-50/80 rounded-xl p-2 border border-indigo-100/60">
              <span className="text-[10px] text-indigo-600 font-medium block">Kullanıcı</span>
              <span className="text-sm font-extrabold text-indigo-950">
                {selectedStateData.users.toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/60">
              <span className="text-[10px] text-slate-500 font-medium block">Oturum</span>
              <span className="text-sm font-extrabold text-slate-900">
                {selectedStateData.sessions.toLocaleString('tr-TR')}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5 px-0.5">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-rose-500" />
              <span>Şehir Dağılımı ({selectedStateData.cities.length})</span>
            </span>
          </div>

          <div className="overflow-y-auto space-y-1.5 pr-1 max-h-48">
            {selectedStateData.cities.length > 0 ? (
              selectedStateData.cities
                .sort((a, b) => (metric === 'users' ? b.users - a.users : b.sessions - a.sessions))
                .map((city, idx) => {
                  const val = metric === 'users' ? city.users : city.sessions
                  const maxVal = Math.max(
                    ...selectedStateData.cities.map(c =>
                      metric === 'users' ? c.users : c.sessions
                    ),
                    1
                  )
                  const pct = Math.round((val / maxVal) * 100)
                  const coords = getCityCoordinates(city.city, 'United States', selectedState)

                  return (
                    <button
                      type="button"
                      key={`us-state-city-${city.city}-${idx}`}
                      onClick={() => {
                        if (coords) {
                          setCenter([coords[1], coords[0]])
                          setZoom(5.0)
                        }
                      }}
                      className="w-full text-left p-2 rounded-xl bg-slate-50/80 hover:bg-indigo-50/70 border border-slate-100 transition-colors cursor-pointer group block"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800 truncate group-hover:text-indigo-700">
                            {city.city}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900">
                            {val.toLocaleString('tr-TR')}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">
                            {metric === 'users' ? 'kull.' : 'otur.'}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                          style={{width: `${pct}%`}}
                        />
                      </div>
                    </button>
                  )
                })
            ) : (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center space-y-1">
                <p className="text-[11px] font-semibold text-slate-700">📍 Eyalet Geneli Trafik</p>
                <p className="text-[10px] text-slate-500 leading-snug">
                  GA4 bu eyaletteki ({selectedStateData.users} kullanıcı) ziyaretçileri eyalet
                  geneli olarak raporlamıştır.
                </p>
              </div>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleReset}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
            >
              🇺🇸 Tüm ABD
            </button>
            <span className="text-[10px] text-slate-400">
              ABD Payı: %{((selectedStateData.users / totalUSUsers) * 100).toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* Floating Zoom Controls */}
      <div className="absolute top-16 left-3 z-10 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          title="Yakınlaştır"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          title="Uzaklaştır"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        {zoom !== 1 && (
          <button
            onClick={handleReset}
            className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            title="Görünümü Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tooltip */}
      {tooltip && !isDragging && (
        <div
          className="absolute z-50 pointer-events-none bg-slate-900/95 text-white backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl transform -translate-x-1/2 -translate-y-full min-w-[220px] animate-in fade-in zoom-in-95 duration-150"
          style={{left: tooltipPos.x, top: tooltipPos.y - 12}}
        >
          {tooltip.type === 'state' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">🇺🇸</span>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {tooltip.stateNameTr || tooltip.stateName} ({tooltip.stateCode})
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-tight">{tooltip.stateName}</p>
                  </div>
                </div>
                {tooltip.percentage && (
                  <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-md">
                    %{tooltip.percentage}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
                <div className="bg-slate-800/80 rounded-lg p-1.5">
                  <p className="text-[9px] text-slate-400 font-medium">Kullanıcı</p>
                  <p className="text-xs font-bold text-indigo-300">
                    {tooltip.users.toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-1.5">
                  <p className="text-[9px] text-slate-400 font-medium">Oturum</p>
                  <p className="text-xs font-bold text-slate-200">
                    {tooltip.sessions.toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              {tooltip.citiesInState && tooltip.citiesInState.length > 0 && (
                <div className="pt-1 border-t border-slate-800/80">
                  <p className="text-[9px] text-slate-400 font-medium mb-1 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-indigo-400" />
                    <span>Şehirler:</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {tooltip.citiesInState.slice(0, 4).map((tc, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300"
                      >
                        {tc.city}{' '}
                        <span className="text-indigo-400 font-semibold">({tc.users})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[9px] text-indigo-300/80 font-medium text-center pt-1 border-t border-slate-800">
                🔍 Şehirlere ve detaylara odaklanmak için tıklayın
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">{tooltip.cityName}</h4>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {tooltip.stateNameTr || tooltip.stateName} &bull; ABD
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                <span className="text-slate-400">Trafik:</span>
                <span className="font-bold text-rose-300">
                  {tooltip.users.toLocaleString('tr-TR')} kullanıcı &bull;{' '}
                  {tooltip.sessions.toLocaleString('tr-TR')} oturum
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SVG Map */}
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{
          scale: 1000 * zoom,
        }}
        style={{width: '100%', height: 'auto', userSelect: 'none'}}
        viewBox="0 0 960 600"
      >
        <defs>
          <filter id="us-city-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="960" height="600" fill="#f8fafc" />

        {/* US States Geographies */}
        <Geographies geography={US_GEO_URL}>
          {({geographies}) =>
            geographies.map(geo => {
              const fips = geo.id
              const stateData = getStateDataByFips(fips)
              const hasData = Boolean(stateData && stateData.users > 0)
              const stateName = getUSStateFromFips(fips) || geo.properties?.name || ''
              const meta = US_STATE_META[stateName]
              const isCurrentSelected =
                selectedState && selectedState.toLowerCase() === stateName.toLowerCase()
              const isHovered = hoveredFips === fips

              const fill = getStateFill(fips)

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke={isCurrentSelected ? '#1e1b4b' : isHovered ? '#6366f1' : '#cbd5e1'}
                  strokeWidth={isCurrentSelected ? 2 : isHovered ? 1.5 : 0.6}
                  onMouseEnter={(e: React.MouseEvent) => {
                    if (isDragging) return
                    setHoveredFips(fips)
                    const rect = e.currentTarget?.closest('svg')?.getBoundingClientRect()
                    if (rect) {
                      setTooltipPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      })
                    }

                    if (stateData) {
                      const val = metric === 'users' ? stateData.users : stateData.sessions
                      const pct = ((val / totalUSUsers) * 100).toFixed(1)
                      setTooltip({
                        type: 'state',
                        stateName: stateData.name,
                        stateNameTr: stateData.nameTr,
                        stateCode: stateData.code,
                        users: stateData.users,
                        sessions: stateData.sessions,
                        percentage: pct,
                        citiesInState: stateData.cities,
                      })
                    } else {
                      setTooltip({
                        type: 'state',
                        stateName: stateName,
                        stateNameTr: meta?.nameTr || stateName,
                        stateCode: meta?.code,
                        users: 0,
                        sessions: 0,
                      })
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredFips(null)
                    setTooltip(null)
                  }}
                  onClick={() => {
                    if (stateName) handleStateClick(stateName)
                  }}
                  style={{
                    default: {
                      outline: 'none',
                      cursor: hasData ? 'pointer' : 'default',
                      transition: 'fill 0.2s ease, stroke 0.2s ease',
                    },
                    hover: {
                      fill: hasData ? '#3730a3' : '#e2e8f0',
                      outline: 'none',
                      cursor: hasData ? 'pointer' : 'default',
                    },
                    pressed: {outline: 'none'},
                  }}
                />
              )
            })
          }
        </Geographies>

        {/* City Marker Pins Layer */}
        {resolvedCityMarkers.map((city, idx) => {
          const val = metric === 'users' ? city.users : city.sessions
          const markerSize = Math.max(3.5, Math.min(12, Math.sqrt(val) * 2 + 2.5))
          const isCityInSelectedState =
            !selectedState ||
            (city.region && city.region.toLowerCase() === selectedState.toLowerCase())

          if (!isCityInSelectedState && zoom > 1.5) return null

          return (
            <Marker
              key={`us-city-${city.city}-${idx}`}
              coordinates={[city.lng, city.lat]}
              onMouseEnter={(e: React.MouseEvent) => {
                if (isDragging) return
                e.stopPropagation()
                const rect = e.currentTarget?.closest('svg')?.getBoundingClientRect()
                if (rect) {
                  setTooltipPos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  })
                }
                const stateMeta = city.region ? US_STATE_META[city.region] : undefined
                setTooltip({
                  type: 'city',
                  cityName: city.city,
                  stateName: city.region || 'United States',
                  stateNameTr: stateMeta?.nameTr || city.region,
                  users: city.users,
                  sessions: city.sessions,
                })
              }}
              onMouseLeave={() => setTooltip(null)}
              onClick={e => {
                e.stopPropagation()
                if (city.region) handleStateClick(city.region)
              }}
            >
              {/* Outer Pulsing Ring */}
              <circle
                r={markerSize + 4}
                fill="none"
                stroke="rgba(244, 63, 94, 0.45)"
                strokeWidth={1}
                className="animate-ping"
                style={{animationDuration: `${1.8 + (idx % 4) * 0.3}s`}}
              />

              {/* Glowing Halo */}
              <circle
                r={markerSize + 2}
                fill="rgba(244, 63, 94, 0.25)"
                filter="url(#us-city-glow)"
              />

              {/* City Pin */}
              <circle
                r={markerSize}
                fill="#f43f5e"
                stroke="#ffffff"
                strokeWidth={1.2}
                className="cursor-pointer transition-transform hover:scale-125"
              />

              {/* Inner dot */}
              <circle r={Math.max(1.2, markerSize * 0.35)} fill="#ffffff" />

              {/* City Name Label */}
              {(zoom >= 2 || val >= 5 || selectedState) && (
                <text
                  textAnchor="middle"
                  y={-markerSize - 4}
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: Math.max(8, Math.min(11, 12 / Math.sqrt(zoom))),
                    fontWeight: 700,
                    fill: '#0f172a',
                    paintOrder: 'stroke',
                    stroke: '#ffffff',
                    strokeWidth: 3,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    pointerEvents: 'none',
                  }}
                >
                  {city.city} ({val})
                </text>
              )}
            </Marker>
          )
        })}
      </ComposableMap>

      {/* Bottom Bar: Top States Chips & Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/90 backdrop-blur-md rounded-xl p-1 border border-slate-200 shadow-sm overflow-x-auto max-w-full">
          <span className="text-[10px] text-slate-400 font-semibold px-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Lider Eyaletler:</span>
          </span>
          {topStates.map((s, i) => {
            const isSelected = selectedState === s.name
            return (
              <button
                key={i}
                onClick={() => handleStateClick(s.name)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100/80 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{s.nameTr}</span>
                <span className="text-[9px] opacity-75">
                  ({(metric === 'users' ? s.users : s.sessions).toLocaleString('tr-TR')})
                </span>
              </button>
            )
          })}
        </div>

        <div className="pointer-events-auto hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-xl px-3 py-1.5 border border-slate-200 shadow-sm text-[10px] text-slate-600 font-medium">
          <span>Yoğunluk:</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-400">Az</span>
            <div className="w-16 h-2 rounded-full bg-gradient-to-r from-indigo-200 via-indigo-500 to-indigo-800" />
            <span className="text-[9px] text-indigo-700 font-bold">Çok</span>
          </div>
        </div>
      </div>

      {zoom > 1 && !isDragging && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-slate-900/80 text-white backdrop-blur-md rounded-full px-3 py-1 shadow-md pointer-events-none">
          <Move className="w-3 h-3 text-slate-300" />
          <span className="text-[10px] font-medium">Sürükleyerek dolaşın</span>
        </div>
      )}
    </div>
  )
}

export default memo(USMapChart)
