/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import {memo, useState, useCallback, useRef, useMemo} from 'react'
import {ComposableMap, Geographies, Geography, Marker} from 'react-simple-maps'
import {
  COUNTRY_META,
  getCountryFlag,
  getCityCoordinates,
  getCountryCoordinates,
  isCountryMatch,
} from '../../lib/geo-coords'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Users,
  BarChart3,
  MapPin,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

const WORLD_GEO_URL = '/data/countries-110m.json'

export interface CountryData {
  country: string
  users: number
  sessions: number
}

export interface CityData {
  country?: string
  city: string
  users: number
  sessions: number
}

interface Props {
  countries: CountryData[]
  cities?: CityData[]
}

type MetricType = 'users' | 'sessions'

interface TooltipInfo {
  type: 'country' | 'city'
  countryName?: string
  cityName?: string
  users: number
  sessions: number
  percentage?: string
  topCities?: {city: string; users: number}[]
}

function WorldMapChart({countries, cities = []}: Props) {
  const [metric, setMetric] = useState<MetricType>('users')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const [tooltipPos, setTooltipPos] = useState({x: 0, y: 0})
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([20, 20])
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredGeoName, setHoveredGeoName] = useState<string | null>(null)

  const dragStart = useRef<{
    x: number
    y: number
    center: [number, number]
  } | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Aggregations
  const totalMetric = useMemo(() => {
    return countries.reduce((acc, c) => acc + (metric === 'users' ? c.users : c.sessions), 0) || 1
  }, [countries, metric])

  const maxMetric = useMemo(() => {
    return Math.max(...countries.map(c => (metric === 'users' ? c.users : c.sessions)), 1)
  }, [countries, metric])

  // Map of country name -> CountryData for O(1) lookup
  const countryMap = useMemo(() => {
    const map = new Map<string, CountryData>()
    countries.forEach(c => {
      map.set(c.country.toLowerCase(), c)
    })
    return map
  }, [countries])

  // Group cities by country
  const citiesByCountry = useMemo(() => {
    const map = new Map<string, CityData[]>()
    cities.forEach(c => {
      const countryKey = (c.country || 'Unknown').toLowerCase()
      const list = map.get(countryKey) || []
      list.push(c)
      map.set(countryKey, list)
    })
    return map
  }, [cities])

  // Find country data for a geography polygon
  const getCountryForGeo = useCallback(
    (geoName: string): CountryData | undefined => {
      if (!geoName) return undefined
      // Direct lookup
      const direct = countryMap.get(geoName.toLowerCase())
      if (direct) return direct

      // Alias / normalization match
      for (const c of countries) {
        if (isCountryMatch(geoName, c.country)) {
          return c
        }
      }
      return undefined
    },
    [countryMap, countries]
  )

  // Color generator for choropleth
  const getGeoFill = useCallback(
    (geoName: string) => {
      const country = getCountryForGeo(geoName)
      if (!country) return '#e2e8f0' // Slate-200 default

      const val = metric === 'users' ? country.users : country.sessions
      const ratio = val / maxMetric

      if (selectedCountry && isCountryMatch(geoName, selectedCountry)) {
        return '#4338ca' // Indigo-700 when selected
      }

      if (ratio > 0.6) return '#4338ca' // Deep Indigo
      if (ratio > 0.3) return '#4f46e5' // Indigo-600
      if (ratio > 0.1) return '#6366f1' // Indigo-500
      if (ratio > 0.03) return '#818cf8' // Indigo-400
      return '#a5b4fc' // Indigo-300 light
    },
    [getCountryForGeo, metric, maxMetric, selectedCountry]
  )

  // Country drill-down handler
  const handleCountryClick = useCallback((countryName: string) => {
    const meta = COUNTRY_META[countryName]
    if (meta) {
      setCenter(meta.center)
      setZoom(meta.zoom)
      setSelectedCountry(countryName)
    } else {
      const coords = getCountryCoordinates(countryName)
      if (coords) {
        setCenter(coords)
        setZoom(4.0)
        setSelectedCountry(countryName)
      }
    }
  }, [])

  const handleReset = useCallback(() => {
    setZoom(1)
    setCenter([20, 20])
    setSelectedCountry(null)
  }, [])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 8))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const next = Math.max(prev / 1.5, 1)
      if (next === 1) {
        setCenter([20, 20])
        setSelectedCountry(null)
      }
      return next
    })
  }, [])

  // Drag to pan
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
      const sensitivity = 0.3 / zoom
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

  // Country markers for ALL active countries (ensures EVERY country has a point on the map)
  const countryMarkers = useMemo(() => {
    return countries
      .map(c => {
        const coords = getCountryCoordinates(c.country)
        if (!coords) return null
        return {
          ...c,
          lng: coords[0],
          lat: coords[1],
        }
      })
      .filter(Boolean) as (CountryData & {lng: number; lat: number})[]
  }, [countries])

  // Active cities to display
  const activeCityMarkers = useMemo(() => {
    if (selectedCountry) {
      // Find cities in selected country
      const matched = cities.filter(
        c =>
          (c.country && isCountryMatch(selectedCountry, c.country)) ||
          c.country?.toLowerCase() === selectedCountry.toLowerCase()
      )
      return matched
        .map(c => {
          const coords = getCityCoordinates(c.city, c.country)
          if (!coords) {
            const countryCoords = getCountryCoordinates(c.country || selectedCountry)
            if (!countryCoords) return null
            return {...c, lat: countryCoords[1], lng: countryCoords[0]}
          }
          return {...c, lat: coords[0], lng: coords[1]}
        })
        .filter(Boolean) as (CityData & {lat: number; lng: number})[]
    }

    // Global view: show all available resolved cities
    return cities
      .map(c => {
        const coords = getCityCoordinates(c.city, c.country)
        if (!coords) return null
        return {...c, lat: coords[0], lng: coords[1]}
      })
      .filter(Boolean) as (CityData & {lat: number; lng: number})[]
  }, [selectedCountry, cities])

  // Top 5 countries for quick filter chips
  const topCountries = useMemo(() => {
    return [...countries]
      .sort((a, b) => (metric === 'users' ? b.users - a.users : b.sessions - a.sessions))
      .slice(0, 5)
  }, [countries, metric])

  return (
    <div
      role="region"
      aria-label="Dünya Haritası"
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
      {/* Top Header Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Breadcrumb / Drill-down status */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md rounded-xl px-3 py-1.5 border border-slate-200 shadow-sm text-xs font-medium text-slate-700">
          <button
            onClick={handleReset}
            className={`hover:text-indigo-600 transition-colors flex items-center gap-1 ${
              !selectedCountry ? 'font-bold text-indigo-600' : 'text-slate-600'
            }`}
          >
            <span>🌍</span>
            <span>Dünya</span>
          </button>

          {selectedCountry && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="flex items-center gap-1.5 font-bold text-slate-900 bg-indigo-50 border border-indigo-200/80 rounded-lg px-2 py-0.5">
                <span>{getCountryFlag(selectedCountry)}</span>
                <span>{COUNTRY_META[selectedCountry]?.nameTr || selectedCountry}</span>
              </span>
              <button
                onClick={handleReset}
                className="ml-1 text-[11px] text-slate-400 hover:text-slate-700 underline"
                title="Küresel görünüme dön"
              >
                Geri Dön
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

      {/* Floating Zoom Controls (Left) */}
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

      {/* Rich Tooltip */}
      {tooltip && !isDragging && (
        <div
          className="absolute z-50 pointer-events-none bg-slate-900/95 text-white backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl transform -translate-x-1/2 -translate-y-full min-w-[220px] animate-in fade-in zoom-in-95 duration-150"
          style={{left: tooltipPos.x, top: tooltipPos.y - 12}}
        >
          {tooltip.type === 'country' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">
                    {getCountryFlag(tooltip.countryName || '')}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {COUNTRY_META[tooltip.countryName || '']?.nameTr || tooltip.countryName}
                    </h4>
                    {COUNTRY_META[tooltip.countryName || ''] && (
                      <p className="text-[10px] text-slate-400 leading-tight">
                        {tooltip.countryName}
                      </p>
                    )}
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

              {tooltip.topCities && tooltip.topCities.length > 0 ? (
                <div className="pt-1 border-t border-slate-800/80">
                  <p className="text-[9px] text-slate-400 font-medium mb-1 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-indigo-400" />
                    <span>Şehir Dağılımı:</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {tooltip.topCities.slice(0, 3).map((tc, idx) => (
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
              ) : (
                <div className="pt-1 border-t border-slate-800/80">
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                    <MapPin className="w-2.5 h-2.5 text-indigo-400" />
                    <span>Şehir Detayı: Genel Ülke Trafiği</span>
                  </p>
                </div>
              )}

              <p className="text-[9px] text-indigo-300/80 font-medium text-center pt-1 border-t border-slate-800">
                🔍 Şehirlere yakınlaşmak için tıklayın
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">{tooltip.cityName}</h4>
                  {tooltip.countryName && (
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {getCountryFlag(tooltip.countryName)} {tooltip.countryName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                <span className="text-slate-400">Trafik:</span>
                <span className="font-bold text-rose-300">
                  {tooltip.users.toLocaleString('tr-TR')} kullanıcı •{' '}
                  {tooltip.sessions.toLocaleString('tr-TR')} oturum
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Map SVG */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 125 * zoom,
          center: center,
        }}
        style={{width: '100%', height: 'auto', userSelect: 'none'}}
        viewBox="0 0 800 500"
      >
        <defs>
          <filter id="city-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="800" height="500" fill="#f8fafc" />

        {/* Countries Choropleth Layer */}
        <Geographies geography={WORLD_GEO_URL}>
          {({geographies}) =>
            geographies.map(geo => {
              const geoName = geo.properties?.name || ''
              const country = getCountryForGeo(geoName)
              const hasData = Boolean(country)
              const isHovered = hoveredGeoName === geoName
              const isCurrentSelected = selectedCountry && isCountryMatch(geoName, selectedCountry)

              const fill = getGeoFill(geoName)

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke={isCurrentSelected ? '#312e81' : isHovered ? '#6366f1' : '#cbd5e1'}
                  strokeWidth={isCurrentSelected ? 1.5 : isHovered ? 1.0 : 0.5}
                  onMouseEnter={(e: React.MouseEvent) => {
                    if (isDragging) return
                    setHoveredGeoName(geoName)

                    const rect = e.currentTarget?.closest('svg')?.getBoundingClientRect()
                    if (rect) {
                      setTooltipPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      })
                    }

                    if (country) {
                      const val = metric === 'users' ? country.users : country.sessions
                      const pct = ((val / totalMetric) * 100).toFixed(1)
                      const countryCities = citiesByCountry.get(country.country.toLowerCase()) || []

                      setTooltip({
                        type: 'country',
                        countryName: country.country,
                        users: country.users,
                        sessions: country.sessions,
                        percentage: pct,
                        topCities: countryCities.slice(0, 3),
                      })
                    } else {
                      setTooltip({
                        type: 'country',
                        countryName: geoName,
                        users: 0,
                        sessions: 0,
                      })
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredGeoName(null)
                    setTooltip(null)
                  }}
                  onClick={() => {
                    if (country) {
                      handleCountryClick(country.country)
                    } else if (geoName) {
                      handleCountryClick(geoName)
                    }
                  }}
                  style={{
                    default: {
                      outline: 'none',
                      cursor: hasData ? 'pointer' : 'default',
                      transition: 'fill 0.2s ease, stroke 0.2s ease',
                    },
                    hover: {
                      fill: hasData ? '#4338ca' : '#cbd5e1',
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

        {/* 1. Country Center Markers Layer (Guarantees EVERY country with traffic has a point) */}
        {!selectedCountry &&
          countryMarkers.map((c, idx) => {
            const val = metric === 'users' ? c.users : c.sessions
            const markerSize = Math.max(3.5, Math.min(15, (val / maxMetric) * 14 + 3))
            const intensity = Math.max(0.35, val / maxMetric)

            return (
              <Marker
                key={`country-point-${c.country}-${idx}`}
                coordinates={[c.lng, c.lat]}
                onMouseEnter={(e: React.MouseEvent) => {
                  if (isDragging) return
                  const rect = e.currentTarget?.closest('svg')?.getBoundingClientRect()
                  if (rect) {
                    setTooltipPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    })
                  }
                  const pct = ((val / totalMetric) * 100).toFixed(1)
                  const countryCities = citiesByCountry.get(c.country.toLowerCase()) || []

                  setTooltip({
                    type: 'country',
                    countryName: c.country,
                    users: c.users,
                    sessions: c.sessions,
                    percentage: pct,
                    topCities: countryCities.slice(0, 3),
                  })
                }}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => handleCountryClick(c.country)}
              >
                {/* Glowing ring */}
                <circle
                  r={markerSize + 4}
                  fill="none"
                  stroke={`rgba(99, 102, 241, ${intensity * 0.4})`}
                  strokeWidth={1}
                  className="animate-ping"
                  style={{animationDuration: `${2.2 + (idx % 4) * 0.4}s`}}
                />
                <circle
                  r={markerSize + 2}
                  fill={`rgba(99, 102, 241, ${intensity * 0.2})`}
                  filter="url(#city-glow)"
                />
                <circle
                  r={markerSize}
                  fill={`rgba(79, 70, 229, ${intensity * 0.9})`}
                  stroke="#ffffff"
                  strokeWidth={1.2}
                  className="cursor-pointer transition-transform hover:scale-125"
                />
                <circle r={Math.max(1.8, markerSize * 0.35)} fill="white" opacity={0.95} />
              </Marker>
            )
          })}

        {/* 2. City Markers Layer (Rendered for specific cities with vibrant dots) */}
        {activeCityMarkers.map((city, idx) => {
          const val = metric === 'users' ? city.users : city.sessions
          const markerSize = Math.max(
            3.5,
            Math.min(10, Math.sqrt(val) * 0.9 * (zoom > 2 ? 0.8 : 1))
          )

          return (
            <Marker
              key={`city-point-${city.city}-${idx}`}
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
                setTooltip({
                  type: 'city',
                  cityName: city.city,
                  countryName: city.country,
                  users: city.users,
                  sessions: city.sessions,
                })
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Pulsing Outer Ring */}
              <circle
                r={markerSize + 4}
                fill="none"
                stroke="rgba(244, 63, 94, 0.4)"
                strokeWidth={1}
                className="animate-ping"
                style={{animationDuration: `${1.8 + (idx % 3) * 0.4}s`}}
              />

              {/* Glowing Halo */}
              <circle r={markerSize + 2} fill="rgba(244, 63, 94, 0.2)" filter="url(#city-glow)" />

              {/* City Dot */}
              <circle
                r={markerSize}
                fill="#f43f5e"
                stroke="#ffffff"
                strokeWidth={1.2}
                className="cursor-pointer transition-transform hover:scale-125"
              />

              {/* City Name Label (Visible when zoomed in or in country drill-down) */}
              {(zoom >= 3 || selectedCountry) && (
                <text
                  textAnchor="middle"
                  y={-markerSize - 4}
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: Math.max(7, Math.min(10, 11 / Math.sqrt(zoom))),
                    fontWeight: 700,
                    fill: '#0f172a',
                    paintOrder: 'stroke',
                    stroke: '#ffffff',
                    strokeWidth: 2.5,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    pointerEvents: 'none',
                  }}
                >
                  {city.city}
                </text>
              )}
            </Marker>
          )
        })}

        {/* 3. Fallback Country Center Label in Drill-down mode if no city breakdown exists */}
        {selectedCountry &&
          activeCityMarkers.length === 0 &&
          (() => {
            const coords = getCountryCoordinates(selectedCountry)
            if (!coords) return null
            const countryObj = countries.find(c => isCountryMatch(selectedCountry, c.country))
            const val = countryObj
              ? metric === 'users'
                ? countryObj.users
                : countryObj.sessions
              : 0

            return (
              <Marker coordinates={[coords[0], coords[1]]}>
                <circle
                  r={12}
                  fill="none"
                  stroke="rgba(79, 70, 229, 0.5)"
                  strokeWidth={1.5}
                  className="animate-ping"
                />
                <circle r={8} fill="#4f46e5" stroke="#ffffff" strokeWidth={1.5} />
                <circle r={3} fill="#ffffff" />
                <text
                  textAnchor="middle"
                  y={-14}
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: 10,
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
                  {COUNTRY_META[selectedCountry]?.nameTr || selectedCountry} (Genel Trafik:{' '}
                  {val.toLocaleString('tr-TR')})
                </text>
              </Marker>
            )
          })()}
      </ComposableMap>

      {/* Bottom Bar: Quick Filter Chips & Heat Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Top Countries Quick Drill-down Chips */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/90 backdrop-blur-md rounded-xl p-1 border border-slate-200 shadow-sm overflow-x-auto max-w-full">
          <span className="text-[10px] text-slate-400 font-semibold px-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Liderler:</span>
          </span>
          {topCountries.map((c, i) => {
            const isSelected = selectedCountry === c.country
            return (
              <button
                key={i}
                onClick={() => handleCountryClick(c.country)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100/80 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{getCountryFlag(c.country)}</span>
                <span>{COUNTRY_META[c.country]?.nameTr || c.country}</span>
                <span className="text-[9px] opacity-75">
                  ({(metric === 'users' ? c.users : c.sessions).toLocaleString('tr-TR')})
                </span>
              </button>
            )
          })}
        </div>

        {/* Heat Intensity Legend */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-xl px-3 py-1.5 border border-slate-200 shadow-sm text-[10px] text-slate-600 font-medium">
          <span>Yoğunluk:</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-400">Az</span>
            <div className="w-16 h-2 rounded-full bg-gradient-to-r from-indigo-200 via-indigo-500 to-indigo-800" />
            <span className="text-[9px] text-indigo-700 font-bold">Çok</span>
          </div>
        </div>
      </div>

      {/* Drag hint when zoomed */}
      {zoom > 1 && !isDragging && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-slate-900/80 text-white backdrop-blur-md rounded-full px-3 py-1 shadow-md pointer-events-none">
          <Move className="w-3 h-3 text-slate-300" />
          <span className="text-[10px] font-medium">Sürükleyerek dolaşın</span>
        </div>
      )}
    </div>
  )
}

export default memo(WorldMapChart)
