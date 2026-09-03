/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import {memo, useState, useCallback, useRef} from 'react'
import {ComposableMap, Geographies, Geography, Marker} from 'react-simple-maps'
import {TURKEY_CITY_COORDS} from '../../lib/geo-coords'
import {ZoomIn, ZoomOut, RotateCcw, Move} from 'lucide-react'
const WORLD_GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
interface TurkishCityData {
  city: string
  region: string
  users: number
  sessions: number
  pageViews: number
}
interface Props {
  turkishCities: TurkishCityData[]
}
const DEFAULT_CENTER: [number, number] = [35.5, 39.0]
const DEFAULT_SCALE = 2000
function TurkeyMapChart({turkishCities}: Props) {
  const [tooltipData, setTooltipData] = useState<TurkishCityData | null>(null)
  const [tooltipPos, setTooltipPos] = useState({x: 0, y: 0})
  const [hoveredCity, setHoveredCity] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{
    x: number
    y: number
    center: [number, number]
  } | null>(null)
  const maxUsers = Math.max(...turkishCities.map(c => c.users), 1)
  const markers = turkishCities
    .map(c => {
      const coords = TURKEY_CITY_COORDS[c.city]
      if (!coords) return null
      return {...c, lat: coords[0], lng: coords[1]}
    })
    .filter(Boolean) as (TurkishCityData & {lat: number; lng: number})[]
  const getColor = (users: number) => {
    const ratio = users / maxUsers
    if (ratio > 0.7)
      return {
        fill: '#ec4899',
        glow: 'rgba(236,72,153,0.4)',
        ring: 'rgba(236,72,153,0.2)',
      }
    if (ratio > 0.4)
      return {
        fill: '#8b5cf6',
        glow: 'rgba(139,92,246,0.35)',
        ring: 'rgba(139,92,246,0.15)',
      }
    if (ratio > 0.2)
      return {
        fill: '#6366f1',
        glow: 'rgba(99,102,241,0.3)',
        ring: 'rgba(99,102,241,0.12)',
      }
    return {
      fill: '#06b6d4',
      glow: 'rgba(6,182,212,0.25)',
      ring: 'rgba(6,182,212,0.1)',
    }
  }
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.4, 4))
  }, [])
  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const next = Math.max(prev / 1.4, 1)
      if (next === 1) setCenter(DEFAULT_CENTER)
      return next
    })
  }, [])
  const handleReset = useCallback(() => {
    setZoom(1)
    setCenter(DEFAULT_CENTER)
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
      const sensitivity = 0.015 / zoom
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
  return (
    <div
      role="region"
      aria-label="Türkiye Haritası"
      className="relative w-full"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
      }}
    >
      {/* Tooltip */}
      {tooltipData && !isDragging && (
        <div
          className="absolute z-50 pointer-events-none bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl px-4 py-3 shadow-xl transform -translate-x-1/2 -translate-y-full text-slate-800"
          style={{left: tooltipPos.x, top: tooltipPos.y - 10}}
        >
          <p className="text-xs font-black text-slate-900 mb-1">{tooltipData.city}</p>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Kullanıcı</p>
              <p className="text-sm font-bold text-indigo-600">
                {tooltipData.users.toLocaleString('tr-TR')}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Oturum</p>
              <p className="text-sm font-bold text-cyan-600">
                {tooltipData.sessions.toLocaleString('tr-TR')}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Sayfa Gör.</p>
              <p className="text-sm font-bold text-pink-600">
                {tooltipData.pageViews.toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Legend */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-white/90 backdrop-blur-md rounded-xl p-3 border border-slate-200 shadow-sm text-slate-700">
        <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mb-1">
          Yoğunluk
        </p>
        {[
          {label: 'Çok Yüksek', color: '#ec4899'},
          {label: 'Yüksek', color: '#8b5cf6'},
          {label: 'Orta', color: '#6366f1'},
          {label: 'Düşük', color: '#06b6d4'},
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: l.color}} />
            <span className="text-[10px] text-slate-600 font-medium">{l.label}</span>
          </div>
        ))}
      </div>
      {/* Zoom Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
          title="Yakınlaştır"
        >
          {' '}
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
          title="Uzaklaştır"
        >
          {' '}
          <ZoomOut className="w-4 h-4" />
        </button>
        {zoom !== 1 && (
          <>
            <button
              onClick={handleReset}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
              title="Sıfırla"
            >
              {' '}
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <div className="w-8 h-6 flex items-center justify-center">
              <span className="text-[9px] text-slate-600 font-bold">{zoom.toFixed(1)}x</span>
            </div>
          </>
        )}
      </div>
      {/* Drag hint */}
      {zoom > 1 && !isDragging && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 border border-slate-200 shadow-sm">
          <Move className="w-3 h-3 text-slate-600" />
          <span className="text-[10px] text-slate-600 font-medium">Sürükleyerek dolaşın</span>
        </div>
      )}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: DEFAULT_SCALE * zoom,
          center: center,
        }}
        style={{width: '100%', height: 'auto', userSelect: 'none'}}
        viewBox="0 0 800 450"
      >
        {' '}
        <defs>
          <filter id="city-glow">
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="800" height="450" fill="#f8fafc" />
        <Geographies geography={WORLD_GEO_URL}>
          {({geographies}) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#e2e8f0"
                stroke="#cbd5e1"
                strokeWidth={0.5}
                style={{
                  default: {outline: 'none'},
                  hover: {fill: '#cbd5e1', outline: 'none'},
                  pressed: {outline: 'none'},
                }}
              />
            ))
          }
        </Geographies>
        {markers.map((m, i) => {
          const sizeScale = Math.max(5, Math.min(28, (m.users / maxUsers) * 28))
          const colors = getColor(m.users)
          const isHovered = hoveredCity === m.city
          const isTopCity = i < 3
          return (
            <Marker
              key={`tr-${m.city}-${i}`}
              coordinates={[m.lng, m.lat]}
              onMouseEnter={(e: React.MouseEvent) => {
                if (isDragging) return
                const rect = e.currentTarget?.closest('svg')?.getBoundingClientRect()
                if (rect) {
                  setTooltipPos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  })
                }
                setTooltipData(m)
                setHoveredCity(m.city)
              }}
              onMouseLeave={() => {
                setTooltipData(null)
                setHoveredCity(null)
              }}
            >
              {isTopCity && (
                <>
                  <circle
                    r={sizeScale + 12}
                    fill="none"
                    stroke={colors.ring}
                    strokeWidth={0.8}
                    opacity={0.4}
                    className="animate-ping"
                    style={{animationDuration: '3s'}}
                  />
                  <circle
                    r={sizeScale + 7}
                    fill="none"
                    stroke={colors.ring}
                    strokeWidth={0.5}
                    opacity={0.6}
                    className="animate-ping"
                    style={{animationDuration: '2s', animationDelay: '0.5s'}}
                  />
                </>
              )}
              <circle r={sizeScale + 4} fill={colors.glow} filter="url(#city-glow)" />
              <circle
                r={isHovered ? sizeScale + 2 : sizeScale}
                fill={colors.fill}
                opacity={isHovered ? 0.9 : 0.7}
                stroke="white"
                strokeWidth={isHovered ? 1.5 : 0.8}
                strokeOpacity={0.6}
                className="cursor-pointer transition-all duration-300"
              />
              <circle r={Math.max(2, sizeScale * 0.25)} fill="white" opacity={0.85} />
              {(isTopCity || isHovered) && (
                <text
                  textAnchor="middle"
                  y={-(sizeScale + 8)}
                  style={{
                    fill: 'rgba(226,232,240,0.9)',
                    fontSize: isTopCity ? '10px' : '9px',
                    fontWeight: 800,
                    fontFamily: 'system-ui',
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  }}
                >
                  {m.city}
                </text>
              )}
            </Marker>
          )
        })}
      </ComposableMap>
    </div>
  )
}
export default memo(TurkeyMapChart)
