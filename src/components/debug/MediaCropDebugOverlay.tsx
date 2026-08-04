import React, {useEffect, useState} from 'react'
import {mediaCropDebugger, type MediaCropDebugInfo} from '../../utils/mediaCropDebug'

export const MediaCropDebugOverlay: React.FC = () => {
  const [isActive, setIsActive] = useState(false)
  const [showOutlines, setShowOutlines] = useState(false)
  const [reports, setReports] = useState<MediaCropDebugInfo[]>([])
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  )
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    setIsActive(mediaCropDebugger.isOverlayActive())
    setShowOutlines(mediaCropDebugger.isVisualOutlinesActive())
    setReports(mediaCropDebugger.getReport())

    const unsubscribe = mediaCropDebugger.subscribe(() => {
      setIsActive(mediaCropDebugger.isOverlayActive())
      setShowOutlines(mediaCropDebugger.isVisualOutlinesActive())
      setReports(mediaCropDebugger.getReport())
    })

    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)

    return () => {
      unsubscribe()
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Visual outlines Injection Effect
  useEffect(() => {
    const styleId = 'media-crop-debug-outlines-style'
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null

    if (showOutlines && isActive) {
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = styleId
        document.head.appendChild(styleEl)
      }
      styleEl.innerHTML = `
        [data-debug-media-id] {
          outline: 2px dashed rgba(16, 185, 129, 0.8) !important;
          outline-offset: -2px !important;
        }
        [data-debug-media-id] .responsive-crop-inner {
          outline: 2px dashed rgba(6, 182, 212, 0.8) !important;
          outline-offset: -2px !important;
        }
        [data-debug-media-id]::after {
          content: attr(data-crop-info);
          position: absolute;
          top: 4px;
          left: 4px;
          background: rgba(15, 23, 42, 0.85);
          color: #38bdf8;
          font-family: monospace;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(56, 189, 248, 0.3);
          z-index: 9999;
          pointer-events: none;
        }
      `
    } else {
      if (styleEl) {
        styleEl.remove()
      }
    }
    return () => {
      if (styleEl) styleEl.remove()
    }
  }, [showOutlines, isActive])

  if (!isActive) {
    return (
      <button
        onClick={() => mediaCropDebugger.enable()}
        className="fixed bottom-4 right-4 z-[99999] px-3 py-2 bg-black/80 hover:bg-black text-white text-xs font-mono rounded-full border border-white/20 shadow-2xl backdrop-blur flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
        title="Görsel & Crop Hata Ayıklama Paneli (Ctrl+Shift+D)"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>🔍 Debug Crop</span>
      </button>
    )
  }

  const isMobileView = viewportWidth <= 1023

  const handleCopyJSON = (item: MediaCropDebugInfo) => {
    navigator.clipboard.writeText(JSON.stringify(item, null, 2))
    setCopiedId(item.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="fixed bottom-4 right-4 z-[99999] w-96 max-h-[85vh] bg-slate-950/95 text-slate-100 rounded-xl border border-slate-800 shadow-2xl backdrop-blur-md flex flex-col font-mono text-xs overflow-hidden transition-all">
      {/* Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="font-bold text-slate-200">Media Crop Inspector</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
            {isMobileView ? '📱 MOBİL (<1023px)' : '💻 DESKTOP (>=1024px)'} ({viewportWidth}px)
          </span>
          <button
            onClick={() => mediaCropDebugger.disable()}
            className="text-slate-400 hover:text-white text-sm font-bold px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Info & Toolbar */}
      <div className="px-3 py-2 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          Kayıtlı Medya: <strong className="text-emerald-400">{reports.length}</strong>
        </span>
        <button
          onClick={() => mediaCropDebugger.toggleVisualOutlines()}
          className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
            showOutlines
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          {showOutlines ? '📐 Görsel Çerçeve: AÇIK' : '📐 Görsel Çerçeve: KAPALI'}
        </button>
      </div>

      {/* Media Records List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 divide-y divide-slate-800/50">
        {reports.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            Sayfada yüklü medya öğesi bulunamadı.
          </div>
        ) : (
          reports.map((item, idx) => {
            const isHighlighted = highlightedId === item.id

            // Check if mobile crop missing when on mobile viewport
            const isMobileWarning = isMobileView && !item.cropMobile && item.cropDesktop

            return (
              <div
                key={item.id}
                onMouseEnter={() => {
                  setHighlightedId(item.id)
                  const el = document.querySelector(`[data-debug-media-id="${item.id}"]`)
                  if (el) el.classList.add('outline-4', 'outline-emerald-500', 'outline-dashed')
                }}
                onMouseLeave={() => {
                  setHighlightedId(null)
                  const el = document.querySelector(`[data-debug-media-id="${item.id}"]`)
                  if (el) el.classList.remove('outline-4', 'outline-emerald-500', 'outline-dashed')
                }}
                className={`pt-3 first:pt-0 transition-colors ${
                  isHighlighted ? 'bg-emerald-950/30 p-2 rounded border border-emerald-500/30' : ''
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-200 mb-1">
                  <span className="truncate max-w-[180px]" title={item.src}>
                    #{idx + 1} {item.componentName || 'OptimizedImage'}
                  </span>
                  <div className="flex items-center gap-1">
                    {isMobileWarning && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
                        ⚠️ Mobil Crop Yok
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        item.activeClientCrop
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {item.activeClientCrop ? 'CROP AKTİF' : 'CROP YOK'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-300">
                  <div className="truncate text-slate-400" title={item.src}>
                    🔗 <span className="text-slate-300 font-mono">{item.src.split('/').pop()}</span>
                  </div>

                  {item.srcMobile && (
                    <div className="truncate text-slate-400" title={item.srcMobile}>
                      📱 Mobil Src:{' '}
                      <span className="text-slate-300 font-mono">
                        {item.srcMobile.split('/').pop()}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-2 p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold mb-0.5">
                        💻 DESKTOP CROP
                      </div>
                      {item.cropDesktop ? (
                        <div className="text-emerald-400 font-mono">
                          X:{item.cropDesktop.x.toFixed(2)} Y:{item.cropDesktop.y.toFixed(2)}
                          <br />
                          W:{item.cropDesktop.width.toFixed(2)} H:
                          {item.cropDesktop.height.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-slate-500 italic">Tanımsız (Tam)</div>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold mb-0.5">
                        📱 MOBİL CROP
                      </div>
                      {item.cropMobile ? (
                        <div className="text-cyan-400 font-mono">
                          X:{item.cropMobile.x.toFixed(2)} Y:{item.cropMobile.y.toFixed(2)}
                          <br />
                          W:{item.cropMobile.width.toFixed(2)} H:{item.cropMobile.height.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-amber-400/80 italic">Masaüstü/Tam</div>
                      )}
                    </div>
                  </div>

                  {item.computedStyle && (
                    <div className="mt-1 text-[10px] text-slate-400 font-mono bg-black/40 p-1.5 rounded border border-slate-900">
                      <div>
                        Scale Desk: {item.computedStyle.scaleXDesk} x{' '}
                        {item.computedStyle.scaleYDesk}
                      </div>
                      <div>
                        Pos Desk: Left {item.computedStyle.leftDesk}, Top{' '}
                        {item.computedStyle.topDesk}
                      </div>
                      {item.computedStyle.scaleXMob && (
                        <div className="text-cyan-300/80 mt-0.5">
                          Scale Mob: {item.computedStyle.scaleXMob} x {item.computedStyle.scaleYMob}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleCopyJSON(item)}
                      className="text-[9px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                    >
                      {copiedId === item.id ? 'Copied JSON!' : 'Copy JSON'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <button
          onClick={() => mediaCropDebugger.logAll()}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer transition-colors"
        >
          Console'a Yazdır
        </button>
        <span className="italic">Ctrl+Shift+D ile Gizle</span>
      </div>
    </div>
  )
}
