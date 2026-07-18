import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { Search, MapPin, X } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

import { useProperties } from '../../hooks/useRealtimeProperties'
import { useVisitedProperties } from '../../hooks/useVisitedProperties'
import { AdminMap } from '../../components/admin/AdminMap'
import { PropertyListSidebar } from '../../components/admin/PropertyListSidebar'
import { MapControls } from '../../components/admin/MapControls'
import { BuildingLayer } from '../../components/admin/BuildingLayer'
import { StreetLabelsLayer } from '../../components/admin/StreetLabelsLayer'
import { fetchBuildingsByBounds } from '../../lib/supabaseApi'
import { supabase } from '../../lib/supabase'
import { AIGeocodeHelper } from '../../components/admin/ai/AIGeocodeHelper'
import { paramsToFilters, filtersToParams, applyFilters } from '../../components/admin/MapFilters'
import type { DbProperty } from '../../types/property'

const getActiveMap = () => {
  return (window as any)._homesurge_map_instance
}

const locateUser = () => {
  const map = getActiveMap()
  if (!map) return
  if (map.locate) {
    map.locate({ setView: true, maxZoom: 18 })
    map.once('locationfound', (e: any) => {
      const { lat, lng } = e.latlng
      try {
        const container = map.getContainer?.()
        if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
          map.setView([lat, lng], 16)
        }
      } catch {}
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'user-location-dot',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        }),
      }).addTo(map)
    })
  }
}

const TILE_LAYERS = [
  { label: 'Voyager', url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', attribution: 'CARTO' },
  { label: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Esri' },
  { label: 'Streets', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: 'OpenStreetMap' },
]

export function AdminMapPage() {
  const { properties, isLoading, error } = useProperties()
  const { visitedIds, markVisited, markVisitedBatch, clearVisited, visitedCount } = useVisitedProperties()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [filters, setFilters] = useState(paramsToFilters(searchParams))
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null)
  const [activeLayerIndex, setActiveLayerIndex] = useState(() => {
    const storedLayer = localStorage.getItem('homesurge_map_layer')
    return storedLayer && !isNaN(parseInt(storedLayer, 10)) ? parseInt(storedLayer, 10) : 0
  })
  const [selectedProperty, setSelectedProperty] = useState<DbProperty | null>(null)
  const [buildingsGeoJSON, setBuildingsGeoJSON] = useState<GeoJSON.FeatureCollection>({ type: 'FeatureCollection', features: [] })
  const [zoomLevel, setZoomLevel] = useState<number | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null)
  const [pinnedBuildingIds, setPinnedBuildingIds] = useState<Set<number>>(new Set())
  const userLocationMarkerRef = useRef<L.Marker | null>(null)
  const locationListenerAddedRef = useRef(false)
  const buildingsGeoJSONRef = useRef(buildingsGeoJSON)
  buildingsGeoJSONRef.current = buildingsGeoJSON
  const leafletMapRef = useRef<L.Map | null>(null)
  const pinnedRef = useRef(pinnedBuildingIds)
  pinnedRef.current = pinnedBuildingIds
  const [placeQuery, setPlaceQuery] = useState('')
  const [placeResults, setPlaceResults] = useState<any[]>([])
  const [placeSearching, setPlaceSearching] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null)
  const selectedPlaceMarkerRef = useRef<L.Marker | null>(null)
  const [labelBounds, setLabelBounds] = useState<L.LatLngBounds | undefined>(undefined)

  const activeLayer = TILE_LAYERS[activeLayerIndex]

  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = placeQuery.trim()
      if (q.length < 3) {
        setPlaceResults([])
        return
      }
      setPlaceSearching(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Kenya')}&limit=5&addressdetails=1`
        const resp = await fetch(url, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'Homesurge/1.0' }
        })
        const data = await resp.json()
        setPlaceResults(Array.isArray(data) ? data : [])
      } catch {
        setPlaceResults([])
      } finally {
        setPlaceSearching(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [placeQuery])

  const dropPlacePin = useCallback((result: any) => {
    const map = leafletMapRef.current
    if (!map) return
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    if (isNaN(lat) || isNaN(lng)) return

    setSelectedPlace(result)
    setPlaceQuery(result.display_name)
    setPlaceResults([])

    if (selectedPlaceMarkerRef.current) {
      selectedPlaceMarkerRef.current.remove()
    }
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'user-location-dot',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      })
    }).addTo(map)
    selectedPlaceMarkerRef.current = marker

    map.flyTo([lat, lng], 16)
  }, [])

  const clearPlacePin = useCallback(() => {
    if (selectedPlaceMarkerRef.current) {
      selectedPlaceMarkerRef.current.remove()
      selectedPlaceMarkerRef.current = null
    }
    setSelectedPlace(null)
    setPlaceQuery('')
    setPlaceResults([])
  }, [])

  const handleAddPropertyAtPlace = useCallback(() => {
    if (!selectedPlace) return
    const lat = selectedPlace.lat
    const lng = selectedPlace.lon
    navigate(`/admin/new?lat=${lat}&lng=${lng}`)
  }, [selectedPlace, navigate])

  useEffect(() => {
    const map = leafletMapRef.current
    if (!map || locationListenerAddedRef.current) return
    locationListenerAddedRef.current = true

    const handleLocationFound = (e: any) => {
      const latlng = e.latlng
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove()
      }
      const marker = L.marker(latlng, {
        icon: L.divIcon({
          className: 'user-location-dot',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        })
      }).addTo(map)
      userLocationMarkerRef.current = marker

      const current = buildingsGeoJSONRef.current
      if (current.features.length > 0) {
        let nearest: any = null
        let minDist = Infinity
        for (const f of current.features) {
          const coords = (f.geometry as GeoJSON.Polygon).coordinates[0]
          let sumLat = 0, sumLng = 0
          for (const c of coords) {
            sumLat += (c as number[])[1]
            sumLng += (c as number[])[0]
          }
          const cLat = sumLat / coords.length
          const cLng = sumLng / coords.length
          const d = (cLat - latlng.lat) ** 2 + (cLng - latlng.lng) ** 2
          if (d < minDist) {
            minDist = d
            nearest = f
          }
        }
        if (nearest && minDist < 0.00045) {
          setSelectedBuilding(nearest.properties)
        }
      }
    }

    map.on('locationfound', handleLocationFound)
    map.on('locationerror', (e: any) => {
      console.error('Location error:', e.message)
    })

    return () => {
      map.off('locationfound', handleLocationFound)
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove()
        userLocationMarkerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('homesurge_map_layer', String(activeLayerIndex))
  }, [activeLayerIndex])

  const filteredProperties = useMemo(() => {
    return applyFilters(properties, filters) as DbProperty[]
  }, [properties, filters])

  const geocodedProperties = useMemo(() => {
    return filteredProperties.filter(p => p.latitude != null && p.longitude != null)
  }, [filteredProperties])

  const ungeocodedProperties = useMemo(() => {
    return filteredProperties.filter(p => p.latitude == null || p.longitude == null)
  }, [filteredProperties])

  const unvisitedProperties = useMemo(() => {
    return geocodedProperties.filter(p => !visitedIds.has(p.id))
  }, [geocodedProperties, visitedIds])

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setSearchParams(filtersToParams(newFilters), { replace: true })
  }

  const handleMapReady = (map: L.Map) => {
    leafletMapRef.current = map
    ;(window as any)._homesurge_map_instance = map
    setZoomLevel(map.getZoom())
    const storedCenter = localStorage.getItem('homesurge_map_center')
    const storedZoom = localStorage.getItem('homesurge_map_zoom')
    let initialized = false
    if (storedCenter && storedZoom) {
      try {
        const parsed = JSON.parse(storedCenter)
        if (Array.isArray(parsed) && parsed.length >= 2) {
          const [lat, lng] = parsed
          if (typeof lat === 'number' && typeof lng === 'number') {
            map.setView([lat, lng], parseInt(storedZoom, 10))
            setZoomLevel(map.getZoom())
            initialized = true
          }
        }
      } catch {}
    }
    if (!initialized && geocodedProperties.length > 0) {
      const firstProp = geocodedProperties[0]
      map.setView([Number(firstProp.latitude), Number(firstProp.longitude)], 17)
      setZoomLevel(17)
    } else if (!initialized) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            map.setView([pos.coords.latitude, pos.coords.longitude], 17)
            setZoomLevel(17)
          },
          () => {
            map.setView([-1.286389, 36.817223], 17)
            setZoomLevel(17)
          },
          { enableHighAccuracy: true, timeout: 5000 }
        )
      } else {
        map.setView([-1.286389, 36.817223], 17)
        setZoomLevel(17)
      }
    }

    map.on('zoomend', () => {
      setZoomLevel(map.getZoom())
    })
    map.on('moveend', () => {
      localStorage.setItem('homesurge_map_center', JSON.stringify([map.getCenter().lat, map.getCenter().lng]))
      localStorage.setItem('homesurge_map_zoom', String(map.getZoom()))
      setLabelBounds(map.getBounds())
      handleMapMoveEnd()
    })
    setLabelBounds(map.getBounds())
    handleMapMoveEnd()
  }

  const handleResetView = useCallback(() => {
    const map = getActiveMap()
    if (!map) return
    if (geocodedProperties.length > 0) {
      const firstProp = geocodedProperties[0]
      if (map.flyTo) map.flyTo([Number(firstProp.latitude), Number(firstProp.longitude)], 12)
      else if (map.setView) map.setView([Number(firstProp.latitude), Number(firstProp.longitude)], 12)
    } else {
      if (map.flyTo) map.flyTo([-1.286389, 36.817223], 12)
      else if (map.setView) map.setView([-1.286389, 36.817223], 12)
    }
    localStorage.removeItem('homesurge_map_center')
    localStorage.removeItem('homesurge_map_zoom')
  }, [geocodedProperties])

  const handleClearVisited = () => {
    clearVisited()
  }

  const handleNextUnvisited = useCallback(() => {
    if (unvisitedProperties.length === 0) return
    const next = unvisitedProperties[0]
    markVisited(next.id)
    setSelectedProperty(next)
    const map = (window as any)._homesurge_map_instance
    if (map && next.latitude && next.longitude) {
      map.flyTo([Number(next.latitude), Number(next.longitude)], 16)
    }
  }, [unvisitedProperties, markVisited])

  const handleMarkAllReviewed = useCallback(() => {
    const ids = geocodedProperties.map(p => p.id)
    markVisitedBatch(ids)
  }, [geocodedProperties, markVisitedBatch])

  const handleSelectProperty = useCallback((p: DbProperty | null) => {
    setSelectedProperty(p)
  }, [])

  const handleMapMove = useCallback(async () => {
    const map = (window as any)._homesurge_map_instance
    if (!map) return
    try {
      const container = map.getContainer?.()
      if (!container || container.offsetWidth === 0 || container.offsetHeight === 0) return
      const b = map.getBounds()
      const fc = await fetchBuildingsByBounds(b.getWest(), b.getSouth(), b.getEast(), b.getNorth())
      if (fc.features.length > 0) setBuildingsGeoJSON(fc)
    } catch (e) {
      console.error('Failed to load buildings for viewport:', e)
    }
  }, [])

  const debouncedMoveRef = useRef<number | null>(null)
  const handleMapMoveEnd = useCallback(() => {
    if (debouncedMoveRef.current) window.clearTimeout(debouncedMoveRef.current)
    debouncedMoveRef.current = window.setTimeout(() => handleMapMove(), 500)
  }, [handleMapMove])

  const handleBuildingClick = useCallback((feature: GeoJSON.Feature | null) => {
    setSelectedBuilding(feature ? (feature as any).properties : null)
    if (feature) {
      const id = (feature.properties?.id as number) ?? null
      setPinnedBuildingIds(prev => {
        const next = new Set(prev)
        if (id != null) {
          if (next.has(id)) next.delete(id)
          else next.add(id)
        }
        return next
      })
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        handleNextUnvisited()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setSelectedProperty(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNextUnvisited])

  if (isLoading) return <div className="p-6 text-center text-zinc-500 h-full flex items-center justify-center">Loading map data...</div>
  if (error) return <div className="p-6 text-center text-red-500 h-full flex items-center justify-center">Error loading map: {(error as Error).message}</div>

  return (
    <div className="flex flex-col min-h-screen bg-trace-dusk text-white">
      <div className="flex flex-col p-4">
        <h1 className="text-2xl font-bold text-cyan-400 mb-4">Admin Map</h1>

        <div className="glass-card rounded-xl p-3 mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400">
          <span>Total: <span className="font-semibold text-white">{properties.length}</span></span>
          <span>With Pins: <span className="font-semibold text-cyan-400">{geocodedProperties.length}</span></span>
          <span>Published: <span className="font-semibold text-green-400">{properties.filter(p => p.is_published).length}</span></span>
          <span>Draft: <span className="font-semibold text-amber-400">{properties.filter(p => !p.is_published).length}</span></span>
          {visitedCount > 0 && (
            <span className="flex items-center gap-1">
              Reviewed: <span className="font-semibold text-emerald-400">{visitedCount}</span>
              <button
                type="button"
                onClick={handleClearVisited}
                className="ml-1 text-[10px] underline text-zinc-500 hover:text-white"
              >
                clear
              </button>
            </span>
          )}
        </div>

        <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10" style={{ height: '600px' }}>
          <AdminMap
            properties={geocodedProperties}
            onMarkerHover={setHoveredPropertyId}
            activeLayer={activeLayer}
            onMapReady={handleMapReady}
            visitedIds={visitedIds}
            onMarkVisited={markVisited}
            selectedProperty={selectedProperty}
            onSelectProperty={handleSelectProperty}
          />
          <BuildingLayer
            visible={true}
            buildings={buildingsGeoJSON}
            onBuildingClick={handleBuildingClick}
            pinnedIds={pinnedBuildingIds}
            activeLayerLabel={activeLayer.label}
          />
          <StreetLabelsLayer
            visible={true}
            activeLayerLabel={activeLayer.label}
            bounds={labelBounds}
          />
          <MapControls
            onLocate={locateUser}
            isLive={false}
            status="disconnected"
            onLayerChange={setActiveLayerIndex}
            activeLayerIndex={activeLayerIndex}
            tileLayers={TILE_LAYERS}
            onResetView={handleResetView}
            unvisitedCount={unvisitedProperties.length}
            mapInstance={leafletMapRef.current}
            zoomLevel={zoomLevel ?? undefined}
          />
          {selectedBuilding && (
            <div className="absolute bottom-4 left-4 right-4 z-[900] md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom duration-200">
              <div className="glass-card rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-sm">Building #{selectedBuilding.id}</h3>
                  <button
                    onClick={() => setSelectedBuilding(null)}
                    className="rounded-lg p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs text-zinc-400 space-y-1">
                  <div>Type: <span className="text-zinc-200 capitalize">{selectedBuilding.building_type}</span></div>
                  <div>Height: <span className="text-cyan-300">{selectedBuilding.height_m}m</span></div>
                  {selectedBuilding.name && <div>Name: <span className="text-zinc-200">{selectedBuilding.name}</span></div>}
                  <div>Status: <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    selectedBuilding.status === 'listed' ? 'bg-emerald-400/20 text-emerald-300' :
                    selectedBuilding.status === 'registered' ? 'bg-blue-400/20 text-blue-300' :
                    selectedBuilding.status === 'claimed' ? 'bg-violet-400/20 text-violet-300' :
                    selectedBuilding.status === 'verified' ? 'bg-blue-400/20 text-blue-300' :
                    selectedBuilding.status === 'custom' ? 'bg-pink-400/20 text-pink-300' :
                    'bg-amber-400/20 text-amber-300'
                  }`}>{selectedBuilding.status}</span></div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const id = selectedBuilding?.id
                      if (id != null) {
                        setPinnedBuildingIds(prev => {
                          const next = new Set(prev)
                          if (next.has(id)) next.delete(id)
                          else next.add(id)
                          return next
                        })
                      }
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedBuilding && pinnedBuildingIds.has(selectedBuilding.id)
                        ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-200'
                        : 'border-white/10 bg-black/20 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {selectedBuilding && pinnedBuildingIds.has(selectedBuilding.id) ? '📌 Pinned' : '📍 Pin building'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Height (m)"
                    defaultValue={selectedBuilding.height_m}
                    className="flex-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-zinc-200"
                    onBlur={(e) => {
                      const h = parseFloat(e.target.value)
                      if (!isNaN(h)) {
                        setSelectedBuilding((prev: any) => prev ? { ...prev, height_m: h } : null)
                      }
                    }}
                  />
                  <select
                    defaultValue={selectedBuilding.status}
                    className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-zinc-200"
                    onChange={(e) => setSelectedBuilding((prev: any) => prev ? { ...prev, status: e.target.value } : null)}
                  >
                    <option value="unregistered">Unregistered</option>
                    <option value="registered">Registered</option>
                    <option value="listed">Listed</option>
                  </select>
                </div>
                {selectedBuilding.status === 'unregistered' && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <p className="text-[10px] text-zinc-500">Register this building as a property listing</p>
                    <input
                      type="text"
                      placeholder="Property name"
                      defaultValue={selectedBuilding.name ?? ''}
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-zinc-200"
                      id="reg-name"
                    />
                    <select
                      defaultValue="apartment"
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-zinc-200"
                      id="reg-type"
                    >
                      {['apartment', 'bedsitter', 'bungalow', 'maisonette', 'studio', 'townhouse', 'bnb', 'land', 'commercial'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Rent price (KES)"
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-zinc-200"
                      id="reg-price"
                    />
                    <button
                      onClick={async () => {
                        const name = (document.getElementById('reg-name') as HTMLInputElement)?.value || selectedBuilding.name || 'Untitled'
                        const price = parseInt((document.getElementById('reg-price') as HTMLInputElement)?.value || '0')
                        const type = (document.getElementById('reg-type') as HTMLSelectElement)?.value || 'apartment'
                        try {
                          if (!supabase || !selectedBuilding.id) return
                          const { error } = await supabase.rpc('upsert_building', {
                            p_id: selectedBuilding.id,
                            p_status: 'registered',
                            p_name: name,
                            p_metadata: { ...selectedBuilding, property_name: name, property_type: type, rent_price: price }
                          })
                          if (error) throw error
                          setSelectedBuilding((prev: any) => prev ? { ...prev, status: 'registered', name } : null)
                        } catch (e) {
                          console.error('Register failed:', e)
                        }
                      }}
                      className="w-full rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-2 text-xs font-medium hover:bg-cyan-500/30 transition-colors"
                    >
                      Register Building
                    </button>
                  </div>
                )}
                {selectedBuilding.status === 'registered' && (
                  <button
                    onClick={async () => {
                      try {
                        if (!supabase || !selectedBuilding.id) return
                        const { error } = await supabase.rpc('upsert_building', {
                          p_id: selectedBuilding.id,
                          p_status: 'listed',
                        })
                        if (error) throw error
                        setSelectedBuilding((prev: any) => prev ? { ...prev, status: 'listed' } : null)
                      } catch (e) {
                        console.error('List failed:', e)
                      }
                    }}
                    className="w-full rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-2 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                  >
                    Mark as Listed
                  </button>
                )}
              </div>
            </div>
          )}
          <PropertyListSidebar
            properties={filteredProperties}
            hoveredId={hoveredPropertyId}
            onHover={setHoveredPropertyId}
            onSelect={(p) => {
              markVisited(p.id)
              setSelectedProperty(p)
              const map = getActiveMap()
              if (map && p.latitude && p.longitude) {
                map.flyTo([Number(p.latitude), Number(p.longitude)], 15)
              }
            }}
            visitedIds={visitedIds}
            onMarkVisited={markVisited}
          />
        </div>

        <div className="mb-4">
          <AIGeocodeHelper
            onSelect={(r) => {
              const pid = prompt('Property ID to geocode:')
              if (!pid || !supabase) return
              supabase.from('properties').update({ latitude: r.lat, longitude: r.lng }).eq('id', pid).then(({ error }) => {
                if (error) alert(error.message)
                else alert('Geocoded!')
              })
            }}
          />
        </div>

        <div className="glass-card rounded-xl p-3 mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400">
          <span>Total: <span className="font-semibold text-white">{properties.length}</span></span>
          <span>With Pins: <span className="font-semibold text-cyan-400">{geocodedProperties.length}</span></span>
          <button
            type="button"
            onClick={() => handleFilterChange({ ...filters, hasCoordinates: true })}
            className="hover:text-cyan-300 transition-colors"
          >
            Unlocated: <span className="font-semibold text-amber-400">{ungeocodedProperties.length}</span>
          </button>
          <span>Published: <span className="font-semibold text-green-400">{properties.filter(p => p.is_published).length}</span></span>
          <span>Draft: <span className="font-semibold text-amber-400">{properties.filter(p => !p.is_published).length}</span></span>
          {visitedCount > 0 && (
            <span className="flex items-center gap-1">
              Reviewed: <span className="font-semibold text-emerald-400">{visitedCount}</span>
              <button
                type="button"
                onClick={handleClearVisited}
                className="ml-1 text-[10px] underline text-zinc-500 hover:text-white"
              >
                clear
              </button>
            </span>
          )}
          {pinnedBuildingIds.size > 0 && (
            <span className="flex items-center gap-1">
              Pinned: <span className="font-semibold text-cyan-400">{pinnedBuildingIds.size}</span>
              <button
                type="button"
                onClick={() => setPinnedBuildingIds(new Set())}
                className="ml-1 text-[10px] underline text-zinc-500 hover:text-white"
              >
                clear
              </button>
            </span>
          )}
        </div>

        {filters.hideReviewed && (
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Showing {filteredProperties.length} of {properties.length} (reviewed hidden)
            </span>
          </div>
        )}

        <div className="mb-3 flex flex-wrap gap-2">
          {unvisitedProperties.length > 0 && (
            <button
              type="button"
              onClick={handleNextUnvisited}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/25 transition-colors"
            >
              Next unvisited ({unvisitedProperties.length})
            </button>
          )}
          {pinnedBuildingIds.size > 0 && (
            <button
              type="button"
              onClick={() => setPinnedBuildingIds(new Set())}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors"
            >
              Clear pins ({pinnedBuildingIds.size})
            </button>
          )}
          {geocodedProperties.length > 0 && visitedCount < geocodedProperties.length && (
            <button
              type="button"
              onClick={handleMarkAllReviewed}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/20 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20 transition-colors"
            >
              Mark all visible as reviewed
            </button>
          )}
          <span className="text-[10px] text-zinc-600 self-center ml-auto">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-mono">N</kbd> for next unvisited
          </span>
        </div>

        <div className="mb-3 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={placeQuery}
              onChange={(e) => setPlaceQuery(e.target.value)}
              placeholder="Search place in Kenya... (e.g. Rongai, Kajiado)"
              className="w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-20 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-cyan-400 focus:outline-none"
            />
            {placeQuery && (
              <button
                onClick={clearPlacePin}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {selectedPlace && (
              <button
                onClick={handleAddPropertyAtPlace}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2 py-1 text-[10px] font-medium hover:bg-cyan-500/30"
              >
                + Add here
              </button>
            )}
          </div>
          {placeSearching && (
            <div className="absolute left-0 right-0 mt-1 rounded-xl border border-white/10 bg-slate-900/95 p-3 text-xs text-zinc-400">
              Searching places...
            </div>
          )}
          {!placeSearching && placeResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-md shadow-2xl z-50 max-h-64 overflow-y-auto">
              {placeResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => dropPlacePin(r)}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                >
                  <div className="text-xs text-zinc-200 font-medium flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                    {r.display_name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
