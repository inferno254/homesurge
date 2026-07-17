import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

const STORAGE_KEY = 'homesurge_street_labels_rongai'
const CACHE_VERSION = 'v1'

type Props = {
  visible: boolean
  activeLayerLabel?: string
  bounds?: L.LatLngBounds
}

type StreetFeature = {
  type: 'Feature'
  properties: { name: string; highway?: string; [key: string]: any }
  geometry: GeoJSON.LineString
}

function getStreetLabel(highway?: string): string {
  if (!highway) return '🛣️'
  const map: Record<string, string> = {
    motorway: '🛣️',
    trunk: '🛣️',
    primary: '🛣️',
    secondary: '🛣️',
    tertiary: '🛣️',
    residential: '🏠',
    unclassified: '🛤️',
    service: '🛤️',
    track: '🛤️',
    path: '🚶',
    footway: '🚶',
  }
  return map[highway] || '🛣️'
}

function midpoint(coords: number[][]): [number, number] {
  const midIndex = Math.floor(coords.length / 2)
  const c = coords[midIndex]
  return [c[0], c[1]]
}

async function loadStreetData(): Promise<GeoJSON.FeatureCollection> {
  const cached = localStorage.getItem(STORAGE_KEY)
  if (cached) {
    try {
      const parsed = JSON.parse(cached)
      if (parsed.version === CACHE_VERSION && parsed.features) {
        return { type: 'FeatureCollection', features: parsed.features }
      }
    } catch {}
  }

  // Rongai + Nairobi environs bounding box
  const bbox = '-1.45,36.68,-1.34,36.80'
  const query = `[out:json][timeout:120];(way["highway"]["name"](${bbox}););out body;>;out skel qt;`
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
  const resp = await fetch(url, { headers: { 'User-Agent': 'Homesurge/1.0' } })
  if (!resp.ok) throw new Error(`Overpass ${resp.status}`)
  const data = await resp.json()

  const nodes: Record<number, [number, number]> = {}
  const ways: Record<number, number[]> = {}
  const tags: Record<number, { name: string; highway?: string }> = {}

  for (const el of data.elements || []) {
    if (el.type === 'node') nodes[el.id] = [el.lon, el.lat]
    else if (el.type === 'way') {
      ways[el.id] = el.nodes || []
      tags[el.id] = { name: el.tags?.name || '', highway: el.tags?.highway || '' }
    }
  }

  const features: StreetFeature[] = []
  for (const [id, nodeIds] of Object.entries(ways)) {
    const tag = tags[Number(id)]
    if (!tag?.name) continue
    const coords = nodeIds.map((nid) => nodes[nid]).filter(Boolean) as [number, number][]
    if (coords.length < 2) continue
    features.push({
      type: 'Feature',
      properties: { name: tag.name, highway: tag.highway },
      geometry: { type: 'LineString', coordinates: coords },
    })
  }

  const fc = { type: 'FeatureCollection', features } as GeoJSON.FeatureCollection
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CACHE_VERSION, features, timestamp: Date.now() }))
  } catch {}
  return fc
}

export function StreetLabelsLayer({ visible, activeLayerLabel, bounds }: Props) {
  const layerRef = useRef<L.LayerGroup | null>(null)
  const [streetData, setStreetData] = useState<GeoJSON.FeatureCollection | null>(null)
  const shouldShow = visible && activeLayerLabel === 'Streets'

  useEffect(() => {
    if (!streetData && shouldShow) {
      loadStreetData().then(setStreetData).catch(() => {})
    }
  }, [shouldShow, streetData])

  useEffect(() => {
    const map = (window as any)._homesurge_map_instance as L.Map | undefined
    if (!map) return

    if (layerRef.current) {
      layerRef.current.remove()
      layerRef.current = null
    }

    if (!shouldShow || !streetData || streetData.features.length === 0) return

    const group = L.layerGroup()
    const boundsBox = bounds || map.getBounds()

    for (const feature of streetData.features) {
      const props = feature.properties || {}
      const coords = (feature.geometry as GeoJSON.LineString).coordinates
      const [lng, lat] = midpoint(coords)
      if (!boundsBox.contains([lat, lng])) continue

      const name = props.name
      const icon = getStreetLabel(props.highway)
      const label = L.divIcon({
        className: 'street-label',
        html: `<div class="street-label-inner"><span class="street-label-icon">${icon}</span><span class="street-label-text">${name}</span></div>`,
        iconSize: [120, 24],
        iconAnchor: [60, 12],
      })
      L.marker([lat, lng], { icon: label }).addTo(group)
    }

    group.addTo(map)
    layerRef.current = group
  }, [shouldShow, streetData, bounds])

  return null
}
