import { ZoomIn, ZoomOut, Locate, Maximize2, Minimize2, RotateCcw, Compass } from 'lucide-react'
import { useState, useEffect } from 'react'
import L from 'leaflet'

type Props = {
  isLive: boolean
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  onLocate: () => void
  onLayerChange: (index: number) => void
  activeLayerIndex: number
  tileLayers: { label: string; url: string; attribution: string }[]
  onResetView?: () => void
  unvisitedCount?: number
  mapInstance?: L.Map | null
  zoomLevel?: number
}

export function MapControls({ isLive, status, onLocate, onLayerChange, activeLayerIndex, tileLayers, onResetView, unvisitedCount, mapInstance, zoomLevel }: Props) {
  const [fullscreen, setFullscreen] = useState(false)
  const [heading, setHeading] = useState<number | null>(null)
  const [showHeading, setShowHeading] = useState(false)

  useEffect(() => {
    const handleOrientation = (e: any) => {
      if (e.alpha !== null) {
        setHeading(360 - e.alpha)
      }
    }
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission().catch(() => {})
    }
    window.addEventListener('deviceorientation', handleOrientation)
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [])

  // Rotate map based on compass heading when enabled
  useEffect(() => {
    if (showHeading && heading !== null && mapInstance) {
      const map = mapInstance as L.Map
      // Leaflet rotation via CSS transform
      const center = map.getCenter()
      map.setView(center, map.getZoom())
      const mapPane = map.getPanes().mapPane as HTMLElement
      if (mapPane) {
        mapPane.style.transformOrigin = 'center center'
        mapPane.style.transform = `rotate(${heading}deg)`
      }
    }
    // Clean up rotation on disable
    if (!showHeading && mapInstance) {
      const map = mapInstance as L.Map
      const mapPane = map.getPanes().mapPane as HTMLElement
      if (mapPane) {
        mapPane.style.transform = ''
      }
    }
  }, [showHeading, heading, mapInstance])

  const handleZoomIn = () => {
    if (mapInstance) {
      const z = mapInstance.getZoom()
      if (z < 18) mapInstance.zoomIn()
    }
  }
  const handleZoomOut = () => {
    if (mapInstance) mapInstance.zoomOut()
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setFullscreen(false)
    }
  }

  return (
    <div className="absolute top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-auto">
      {/* Layer Switcher */}
      <div className="glass-card flex rounded-lg overflow-hidden shadow-lg border border-white/20">
        {tileLayers.map((layer, index) => {
          const active = activeLayerIndex === index
          const colorClass = active
            ? index === 0
              ? 'bg-cyan-500 text-trace-dusk'
              : index === 1
                ? 'bg-violet-500 text-white'
                : 'bg-amber-400 text-trace-dusk'
            : 'text-zinc-400 hover:bg-white/10'
          return (
            <button
              key={layer.label}
              type="button"
              onClick={() => onLayerChange(index)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${colorClass}`}
            >
              {layer.label}
            </button>
          )
        })}
      </div>

      {/* Zoom and Utility Controls */}
      <div className="glass-card flex flex-col gap-1 p-1 rounded-lg shadow-lg border border-white/20">
        {/* Realtime status dot */}
        <div
          className={`mb-1 h-2.5 w-2.5 rounded-full mx-auto ${
            isLive ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : status === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'
          }`}
          title={isLive ? 'Realtime connected' : status === 'connecting' ? 'Connecting...' : 'Realtime disconnected'}
        />
        {unvisitedCount != null && unvisitedCount > 0 && (
          <div className="mb-1 text-[9px] text-center font-semibold text-amber-300">
            {unvisitedCount} new
          </div>
        )}

        <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 font-mono mb-1">
          z{zoomLevel != null ? zoomLevel.toFixed(1) : '-'}
        </div>

        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onLocate}
          title="Locate me"
        >
          <Locate className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowHeading(s => !s)}
          title="Toggle compass direction"
          className={showHeading ? 'text-violet-300 border-violet-400/40 bg-violet-500/10 rounded-lg p-1' : ''}
        >
          <Compass className="h-4 w-4" />
          {showHeading && heading !== null && (
            <span className="block text-[8px] font-mono">{heading.toFixed(0)}°</span>
          )}
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>

        {onResetView && (
          <button
            type="button"
            onClick={onResetView}
            title="Reset view"
            className="text-zinc-400 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
