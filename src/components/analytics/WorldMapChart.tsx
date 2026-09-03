/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import {memo, useState, useCallback, useRef} from 'react'
import {ComposableMap, Geographies, Geography, Marker} from 'react-simple-maps'
import {COUNTRY_COORDS} from '../../lib/geo-coords'
import {ZoomIn, ZoomOut, RotateCcw, Move} from 'lucide-react'
const WORLD_GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
interface CountryData {
  country: string
  users: number
  sessions: number
}
interface Props {
  countries: CountryData[]
}
function WorldMapChart({countries}: Props) {
  const [tooltipContent, setTooltipContent] = useState('')
  const [tooltipPos, setTooltipPos] = useState({x: 0, y: 0})
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([20, 20])
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{
    x: number
    y: number
    center: [number, number]
  } | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const maxUsers = Math.max(...countries.map(c => c.users), 1)
  const markers = countries
    .map(c => {
      const coords = COUNTRY_COORDS[c.country]
      if (!coords) return null
      return {...c, lat: coords[0], lng: coords[1]}
    })
    .filter(Boolean) as (CountryData & {lat: number; lng: number})[]
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 6))
  }, [])
  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const next = Math.max(prev / 1.5, 1)
      if (next === 1) setCenter([20, 20])
      return next
    })
  }, [])
  const handleReset = useCallback(() => {
    setZoom(1)
    setCenter([20, 20])
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
  return (
    <div
      role="region"
      aria-label="Dünya Haritası"
      ref={mapRef}
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
      {tooltipContent && !isDragging && (
        <div
          className="absolute z-50 pointer-events-none bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 shadow-2xl transform -translate-x-1/2 -translate-y-full"
          style={{left: tooltipPos.x, top: tooltipPos.y - 10}}
        >
          <p className="text-xs text-white font-bold whitespace-nowrap">{tooltipContent}</p>
        </div>
      )}
      {/* Zoom Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          title="Yakınlaştır"
        >
          {' '}
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          title="Uzaklaştır"
        >
          {' '}
          <ZoomOut className="w-4 h-4" />
        </button>
        {zoom !== 1 && (
          <>
            <button
              onClick={handleReset}
              className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              title="Sıfırla"
            >
              {' '}
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <div className="w-8 h-6 flex items-center justify-center">
              <span className="text-[9px] text-white/60 font-bold">{zoom.toFixed(1)}x</span>
            </div>
          </>
        )}
      </div>
      {/* Drag hint */}
      {zoom > 1 && !isDragging && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 border border-white/15">
          <Move className="w-3 h-3 text-white/60" />
          <span className="text-[10px] text-white/60">Sürükleyerek dolaşın</span>
        </div>
      )}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120 * zoom,
          center: center,
        }}
        style={{width: '100%', height: 'auto', userSelect: 'none'}}
        viewBox="0 0 800 500"
      >
        {' '}
        <defs>
          <radialGradient id="globe-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
          <filter id="marker-glow">
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="800" height="500" fill="url(#globe-glow)" />
        <Geographies geography={WORLD_GEO_URL}>
          {({geographies}) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="rgba(148,163,184,0.12)"
                stroke="rgba(148,163,184,0.2)"
                strokeWidth={0.4}
                style={{
                  default: {outline: 'none'},
                  hover: {fill: 'rgba(99,102,241,0.2)', outline: 'none'},
                  pressed: {outline: 'none'},
                }}
              />
            ))
          }
        </Geographies>
        {markers.map((m, i) => {
          const sizeScale = Math.max(4, Math.min(22, (m.users / maxUsers) * 22))
          const intensity = Math.max(0.3, m.users / maxUsers)
          return (
            <Marker
              key={`${m.country}-${i}`}
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
                setTooltipContent(
                  `${m.country}: ${m.users.toLocaleString('tr-TR')} kullanıcı • ${m.sessions.toLocaleString('tr-TR')} oturum`
                )
              }}
              onMouseLeave={() => setTooltipContent('')}
            >
              <circle
                r={sizeScale + 4}
                fill="none"
                stroke={`rgba(99,102,241,${intensity * 0.3})`}
                strokeWidth={1}
                className="animate-ping"
                style={{animationDuration: `${2 + i * 0.3}s`}}
              />
              <circle
                r={sizeScale + 2}
                fill={`rgba(99,102,241,${intensity * 0.15})`}
                filter="url(#marker-glow)"
              />
              <circle
                r={sizeScale}
                fill={`rgba(99,102,241,${intensity * 0.7})`}
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={1}
                className="cursor-pointer transition-all duration-300 hover:fill-indigo-400"
              />
              <circle r={Math.max(2, sizeScale * 0.3)} fill="white" opacity={0.9} />
            </Marker>
          )
        })}
      </ComposableMap>
    </div>
  )
}
export default memo(WorldMapChart)
