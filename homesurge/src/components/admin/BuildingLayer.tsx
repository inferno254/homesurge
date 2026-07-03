import { useEffect, useRef } from 'react'
import L from 'leaflet'

type Props = {
  visible: boolean
  buildings?: GeoJSON.FeatureCollection
  onBuildingClick?: (feature: GeoJSON.Feature | null) => void
  pinnedIds?: Set<number>
  activeLayerLabel?: string
}

const STATUS_COLORS: Record<string, string> = {
  unregistered: '#888888',
  unverified: '#888888',
  registered: '#3B82F6',
  listed: '#10B981',
  verified: '#3B82F6',
  claimed: '#8B5CF6',
  custom: '#EC4899',
}

export function BuildingLayer({ visible, buildings, onBuildingClick, pinnedIds, activeLayerLabel }: Props) {
  const layerRef = useRef<L.GeoJSON | null>(null)

  // Only render buildings on the Voyager layer
  const shouldShow = visible && activeLayerLabel === 'Voyager'

  useEffect(() => {
    if (!layerRef.current) return
    const map = (window as any)._homesurge_map_instance as L.Map | undefined
    if (!map) return

    if (shouldShow) {
      layerRef.current.addTo(map)
    } else {
      layerRef.current.remove()
    }
  }, [shouldShow])

  useEffect(() => {
    const map = (window as any)._homesurge_map_instance as L.Map | undefined
    if (!map) return

    if (layerRef.current) {
      layerRef.current.remove()
      layerRef.current = null
    }

    if (!shouldShow || !buildings || buildings.features.length === 0) return

    const features = buildings.features.slice(0, 150)
    const layer = L.geoJSON({ ...buildings, features } as GeoJSON.FeatureCollection, {
      style: (feature) => {
        if (!feature) return {}
        const status = (feature.properties?.status as string) || 'unregistered'
        const baseColor = STATUS_COLORS[status] || STATUS_COLORS.unregistered
        const id = feature.properties?.id as number | undefined
        const isPinned = pinnedIds?.has(id ?? -1) ?? false
        return {
          color: isPinned ? '#22d3ee' : '#ffffff',
          weight: isPinned ? 2.5 : 1,
          opacity: isPinned ? 1 : 0.6,
          fillColor: isPinned ? '#22d3ee' : baseColor,
          fillOpacity: isPinned ? 0.55 : 0.35,
          dashArray: isPinned ? '6 3' : undefined,
        }
      },
      onEachFeature: (feature, leaf) => {
        leaf.on('click', () => {
          onBuildingClick?.(feature)
          const status = feature?.properties?.status
          const color = STATUS_COLORS[status as string] || STATUS_COLORS.unregistered
          layerRef.current?.resetStyle(leaf)
          ;(leaf as any).setStyle({
            color: '#22d3ee',
            weight: 2.5,
            fillColor: color,
            fillOpacity: 0.65,
            dashArray: '6 3',
          })
        })
      },
    })

    layerRef.current = layer
    if (shouldShow) {
      layer.addTo(map)
    }
  }, [buildings, shouldShow, onBuildingClick])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    const map = (window as any)._homesurge_map_instance as L.Map | undefined
    if (!map) return

    layer.eachLayer((leaf: any) => {
      const feature = leaf.feature as GeoJSON.Feature | undefined
      const id = feature?.properties?.id as number | undefined
      const isPinned = pinnedIds?.has(id ?? -1) ?? false
      const status = (feature?.properties?.status as string) || 'unregistered'
      const baseColor = STATUS_COLORS[status] || STATUS_COLORS.unregistered
      leaf.setStyle({
        color: isPinned ? '#22d3ee' : '#ffffff',
        weight: isPinned ? 2.5 : 1,
        opacity: isPinned ? 1 : 0.6,
        fillColor: isPinned ? '#22d3ee' : baseColor,
        fillOpacity: isPinned ? 0.55 : 0.35,
        dashArray: isPinned ? '6 3' : undefined,
      })
    })
  }, [pinnedIds])

  return null
}
