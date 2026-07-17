import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import MarkerClusterGroup from 'react-leaflet-cluster'
import type { DbProperty } from '../../types/property'
import { useNavigate } from 'react-router-dom'
import { Edit, Phone, MapPin, AlertTriangle, CheckCircle2, Copy } from 'lucide-react'
import { timeAgo } from '../../lib/timeAgo'
import { shouldShowBathrooms } from '../../lib/helpers'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

type Props = {
  properties: DbProperty[]
  onMarkerHover?: (id: string | null) => void
  activeLayer: { label: string; url: string; attribution: string }
  onMapReady?: (map: L.Map) => void
  visitedIds?: Set<string>
  onMarkVisited?: (id: string) => void
  selectedProperty?: DbProperty | null
  onSelectProperty?: (p: DbProperty) => void
}

const METERS_PER_DEGREE_LAT = 111_320

function coordsWithin(pa: DbProperty, pb: DbProperty, maxMeters = 40): boolean {
  if (pa.latitude == null || pa.longitude == null || pb.latitude == null || pb.longitude == null) return false
  const dLat = Math.abs(Number(pa.latitude) - Number(pb.latitude))
  const dLng = Math.abs(Number(pa.longitude) - Number(pb.longitude)) * Math.cos((Number(pa.latitude) * Math.PI) / 180)
  const meterDist = Math.sqrt((dLat * METERS_PER_DEGREE_LAT) ** 2 + (dLng * METERS_PER_DEGREE_LAT) ** 2)
  return meterDist <= maxMeters
}

function findDuplicates(property: DbProperty, all: DbProperty[]): DbProperty[] {
  return all.filter((p) => {
    if (p.id === property.id) return false
    const sameEstate = (property.estate?.trim() && p.estate?.trim() && property.estate.trim().toLowerCase() === p.estate.trim().toLowerCase()) ||
      (property.address?.trim() && p.address?.trim() && property.address.trim().toLowerCase() === p.address.trim().toLowerCase())
    const sameTown = property.town?.trim() && p.town?.trim() && property.town.trim().toLowerCase() === p.town.trim().toLowerCase()
    return sameEstate && sameTown && coordsWithin(property, p, 60)
  })
}

export function AdminMap({ properties, onMarkerHover, activeLayer, onMapReady, visitedIds, onMarkVisited, selectedProperty, onSelectProperty }: Props) {
  const navigate = useNavigate()
  const [contextMenu, setContextMenu] = useState<{ lat: number, lng: number, x: number, y: number } | null>(null)
  const [_userLocation, _setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [_userHeading, _setUserHeading] = useState<number | null>(null)
  const [_mapKey, _setMapKey] = useState(0)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const locationInitializedRef = useRef(false)

  const initialCenter: [number, number] = useMemo(() => {
    const firstGeocoded = properties.find(p => p.latitude != null && p.longitude != null)
    return firstGeocoded ? [Number(firstGeocoded.latitude), Number(firstGeocoded.longitude)] : [-1.286389, 36.817223]
  }, [properties])

  const handleAddHere = () => {
    if (contextMenu) {
      navigate(`/admin/new?lat=${contextMenu.lat}&lng=${contextMenu.lng}`)
      setContextMenu(null)
    }
  }

  const handleCopyCoords = async () => {
    if (contextMenu) {
      await navigator.clipboard.writeText(`${contextMenu.lat.toFixed(6)}, ${contextMenu.lng.toFixed(6)}`)
      setContextMenu(null)
    }
  }

  const handleMarkerClick = useCallback((p: DbProperty) => {
    onMarkVisited?.(p.id)
    onSelectProperty?.(p)
  }, [onMarkVisited, onSelectProperty])

  const handleCloseDetail = useCallback(() => {
    onSelectProperty?.(null as any)
  }, [onSelectProperty])

  const MapEvents = () => {
    const map = useMap()
    useEffect(() => {
      if (onMapReady) onMapReady(map)
      ;(window as any)._homesurge_map_instance = map

      if (!locationInitializedRef.current) {
        locationInitializedRef.current = true
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude
              const lng = pos.coords.longitude
              _setUserLocation({ lat, lng })
              _setUserHeading(pos.coords.heading ?? null)
              const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                  className: 'user-location-dot',
                  iconSize: [12, 12],
                  iconAnchor: [6, 6],
                }),
              }).addTo(map)
              userMarkerRef.current = marker
            },
            () => {},
            { enableHighAccuracy: true, timeout: 5000 }
          )
        }
      }
    }, [map])

    useMapEvents({
      contextmenu: (e) => {
        setContextMenu({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          x: e.originalEvent.pageX,
          y: e.originalEvent.pageY
        })
      },
      click: () => setContextMenu(null),
      movestart: () => setContextMenu(null),
    })

    return null
  }

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      <MapContainer
        center={initialCenter}
        zoom={13}
        maxZoom={18}
        minZoom={5}
        className="w-full h-full"
        scrollWheelZoom
        zoomControl
        worldCopyJump={false}
      >
        <TileLayer
          attribution={activeLayer.attribution}
          url={activeLayer.url}
        />

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={60}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom
          disableClusteringAtZoom={16}
          iconCreateFunction={(cluster: any) => {
            const count = cluster.getChildCount()
            let size = 'small'
            if (count > 10) size = 'medium'
            if (count > 100) size = 'large'
            const hasPublished = cluster.getAllChildMarkers().some((m: any) => m.options.propertyData.is_published)
            const bgColor = hasPublished ? 'bg-cyan-500' : 'bg-amber-500'
            return L.divIcon({
              html: `<div class="cluster-marker ${bgColor} cluster-marker-${size}"><span>${count}</span></div>`,
              className: 'custom-cluster-icon',
              iconSize: L.point(40, 40),
            })
          }}
        >
          {properties.map((p) => {
            const isVisited = visitedIds?.has(p.id) ?? false
            const markerColor = p.is_published
              ? (p.is_available ? 'bg-cyan-500' : 'bg-gray-500')
              : (p.is_available ? 'bg-amber-500' : 'bg-red-500')

            const customIcon = L.divIcon({
              html: `<div class="custom-marker-icon ${markerColor}${isVisited ? ' visited-ring' : ''}"></div>`,
              className: 'custom-marker-container',
              iconSize: [20, 20],
              iconAnchor: [10, 20],
              popupAnchor: [0, -15],
            })

            const duplicates = findDuplicates(p, properties)

            return (
              <Marker
                key={p.id}
                position={[Number(p.latitude), Number(p.longitude)]}
                icon={customIcon}
                eventHandlers={{
                  mouseover: () => onMarkerHover?.(p.id),
                  mouseout: () => onMarkerHover?.(null),
                  click: () => handleMarkerClick(p),
                }}
              >
<Popup maxWidth={300} className="property-popup" autoClose={false} closeOnClick={false}>
                      <div className="min-w-[240px] space-y-2 p-4 bg-[#0f172a] text-white rounded-lg shadow-xl" style={{backgroundColor: '#0f172a'}}>
                        {p.cover_image_url && (
                      <img
                        src={p.cover_image_url}
                        alt={p.title || 'Property image'}
                        className="w-full h-28 object-cover rounded-lg mb-2"
                        loading="lazy"
                      />
                    )}
                    <div className="flex flex-wrap gap-1">
                      <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        p.is_published ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {p.is_published ? 'Published' : 'Draft'}
                      </span>
                      <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        p.is_available ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {p.is_available ? 'Available' : 'Unavailable'}
                      </span>
                      {p.furnished && (
                        <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium">
                          Furnished
                        </span>
                      )}
                      {isVisited && (
                        <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Reviewed
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm leading-tight text-cyan-400">{p.title}</h4>
                    <p className="text-xs text-zinc-500">{p.listing_reference ?? 'N/A'}</p>
                    <p className="text-[10px] text-zinc-600">{timeAgo(p.created_at)}</p>
                    <p className="text-sm font-medium text-violet-300">
                      KSh {Number(p.price).toLocaleString()}
                      {p.price_type === 'monthly' ? '/mo' : p.price_type === 'sale' ? ' (sale)' : ' (negotiable)'}
                    </p>
                    <div className="text-xs text-zinc-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[p.estate, p.town, p.county].filter(Boolean).join(' • ')}
                    </div>
                     <div className="flex gap-3 text-xs text-zinc-500 mt-1">
                       {p.bedrooms != null && <span>{p.bedrooms} bed</span>}
                       {shouldShowBathrooms(p.bedrooms, p.property_type) && p.bathrooms != null && <span>{p.bathrooms} bath</span>}
                       {p.size_sqm != null && <span>{p.size_sqm}m²</span>}
                       {p.property_type && <span className="capitalize">{p.property_type}</span>}
                     </div>
                    {duplicates.length > 0 && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-400/20">
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-300 uppercase tracking-wider mb-1">
                          <AlertTriangle className="h-3 w-3" />
                          Same location
                        </div>
                        {duplicates.map((d) => (
                          <div key={d.id} className="text-[11px] text-zinc-400 truncate">
                            {d.listing_reference ?? d.title}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => { handleMarkerClick(p); navigate(`/admin/edit/${p.id}`) }}
                        className="flex-1 text-center text-xs bg-cyan-500/20 text-cyan-300 rounded px-2 py-1.5 hover:bg-cyan-500/30 transition-colors font-medium flex items-center justify-center gap-1"
                      >
                        <Edit className="h-3 w-3" /> Edit
                      </button>
                      {p.owner_phone && (
                        <a
                          href={`tel:${p.owner_phone.replace(/\s/g, '')}`}
                          className="flex-1 text-center text-xs bg-green-500/20 text-green-300 rounded px-2 py-1.5 hover:bg-green-500/30 transition-colors font-medium flex items-center justify-center gap-1"
                        >
                          <Phone className="h-3 w-3" /> Call
                        </a>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MarkerClusterGroup>

        <MapEvents />
      </MapContainer>

      {/* Custom Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[1000] bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-lg shadow-xl py-1 w-48 overflow-hidden animate-in fade-in zoom-in duration-150"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={handleAddHere}
            className="w-full text-left px-4 py-2 hover:bg-cyan-500/20 text-sm text-cyan-100 flex items-center gap-2"
          >
            <span className="text-lg">+</span> Add House Here
          </button>
          <button
            onClick={handleCopyCoords}
            className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm text-zinc-300 flex items-center gap-2"
          >
            <Copy className="h-3.5 w-3.5" /> Copy coordinates
          </button>
          <div className="px-4 py-1 text-[10px] text-white/40 border-t border-white/10">
            {contextMenu.lat.toFixed(5)}, {contextMenu.lng.toFixed(5)}
          </div>
        </div>
      )}

      {/* Property Detail Panel */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-4 right-4 z-[900] md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom duration-200">
          <div className="glass-card rounded-2xl p-4 space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1 mb-1">
                  <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    selectedProperty.is_published ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {selectedProperty.is_published ? 'Published' : 'Draft'}
                  </span>
                  <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    selectedProperty.is_available ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {selectedProperty.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <h3 className="font-semibold text-white leading-tight line-clamp-1">{selectedProperty.title}</h3>
                <p className="text-xs text-zinc-500">{selectedProperty.listing_reference ?? 'N/A'}</p>
              </div>
              <button
                onClick={handleCloseDetail}
                className="shrink-0 rounded-lg p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {selectedProperty.cover_image_url && (
              <img
                src={selectedProperty.cover_image_url}
                alt={selectedProperty.title}
                className="w-full h-32 object-cover rounded-xl"
                loading="lazy"
              />
            )}

            <p className="text-sm font-semibold text-violet-300">
              KSh {Number(selectedProperty.price).toLocaleString()}
              {selectedProperty.price_type === 'monthly' ? '/mo' : selectedProperty.price_type === 'sale' ? ' (sale)' : ' (negotiable)'}
            </p>

            <div className="text-xs text-zinc-500 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {[selectedProperty.estate, selectedProperty.town, selectedProperty.county].filter(Boolean).join(' • ')}
            </div>

             <div className="flex gap-3 text-xs text-zinc-500">
               {selectedProperty.bedrooms != null && <span>{selectedProperty.bedrooms} bed</span>}
               {shouldShowBathrooms(selectedProperty.bedrooms, selectedProperty.property_type) && selectedProperty.bathrooms != null && <span>{selectedProperty.bathrooms} bath</span>}
               {selectedProperty.size_sqm != null && <span>{selectedProperty.size_sqm}m²</span>}
               {selectedProperty.property_type && <span className="capitalize">{selectedProperty.property_type}</span>}
             </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { handleMarkerClick(selectedProperty); navigate(`/admin/edit/${selectedProperty.id}`) }}
                className="flex-1 text-center text-xs bg-cyan-500/20 text-cyan-300 rounded-lg px-3 py-2 hover:bg-cyan-500/30 transition-colors font-medium flex items-center justify-center gap-1"
              >
                <Edit className="h-3.5 w-3.5" /> Edit
              </button>
              {selectedProperty.owner_phone && (
                <a
                  href={`tel:${selectedProperty.owner_phone.replace(/\s/g, '')}`}
                  className="flex-1 text-center text-xs bg-green-500/20 text-green-300 rounded-lg px-3 py-2 hover:bg-green-500/30 transition-colors font-medium flex items-center justify-center gap-1"
                >
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
