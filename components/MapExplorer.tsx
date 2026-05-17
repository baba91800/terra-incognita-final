'use client'

import { useEffect, useRef, useState } from 'react'
import type L from 'leaflet'
import { Monument } from '@/types/game'
import { RARITY_COLORS } from '@/lib/constants'
import FogCanvas from './FogCanvas'

interface MapExplorerProps {
  playerLat: number
  playerLng: number
  discoveredTiles: Set<string>
  monuments: Monument[]
  onMapReady: (map: L.Map) => void
}

export default function MapExplorer({
  playerLat, playerLng, discoveredTiles, monuments, onMapReady
}: MapExplorerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const playerMarkerRef = useRef<L.CircleMarker | null>(null)
  const monumentMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map())
  const [mapReady, setMapReady] = useState(false)

  // Init Leaflet map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default

      const map = L.map(containerRef.current!, {
        center: [playerLat, playerLng],
        zoom: 17,
        zoomControl: false,
        attributionControl: false,
      })

      // Light but styled tile layer — clear when revealed
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '©OSM ©CARTO',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map)

      // Zoom control (top-right, below HUD)
      L.control.zoom({ position: 'topright' }).addTo(map)

      // Attribution small
      L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map)

      mapRef.current = map
      onMapReady(map)
      setMapReady(true)
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, []) // eslint-disable-line

  // Update player marker
  useEffect(() => {
    if (!mapRef.current || !mapReady) return

    import('leaflet').then(({ default: L }) => {
      const map = mapRef.current!

      if (playerMarkerRef.current) {
        playerMarkerRef.current.setLatLng([playerLat, playerLng])
      } else {
        playerMarkerRef.current = L.circleMarker([playerLat, playerLng], {
          radius: 8,
          fillColor: '#00f5d4',
          fillOpacity: 1,
          color: '#ffffff',
          weight: 2,
          className: 'player-marker',
        }).addTo(map)
      }

      // Pan to player smoothly
      map.panTo([playerLat, playerLng], { animate: true, duration: 0.3 })
    })
  }, [playerLat, playerLng, mapReady])

  // Render monument markers
  useEffect(() => {
    if (!mapReady) return

    import('leaflet').then(({ default: L }) => {
      const map = mapRef.current!

      monuments.forEach(m => {
        const existing = monumentMarkersRef.current.get(m.id)
        const color = RARITY_COLORS[m.rarity]

        if (existing) {
          // Update style if just discovered
          existing.setStyle({
            fillColor: m.discovered ? color : '#1a1a2e',
            fillOpacity: m.discovered ? 0.9 : 0.6,
            color: m.discovered ? color : '#333355',
            weight: m.discovered ? 2 : 1,
          })
        } else {
          const marker = L.circleMarker([m.lat, m.lng], {
            radius: m.rarity === 'legendary' ? 10 : m.rarity === 'epic' ? 8 : 6,
            fillColor: m.discovered ? color : '#1a1a2e',
            fillOpacity: m.discovered ? 0.9 : 0.6,
            color: m.discovered ? color : '#333355',
            weight: m.discovered ? 2 : 1,
          }).addTo(map)

          marker.bindPopup(`
            <div style="background:#070f1a;border:1px solid ${color}40;color:#fff;padding:8px 12px;border-radius:6px;min-width:120px;">
              <div style="font-size:9px;letter-spacing:0.2em;color:${color};text-transform:uppercase;margin-bottom:4px;">
                ${m.discovered ? m.rarity : '???'}
              </div>
              <div style="font-size:13px;font-weight:bold;">
                ${m.discovered ? m.name : '??? Unknown Site'}
              </div>
              ${m.discovered && m.discoveredAt ? `<div style="font-size:9px;color:#ffffff40;margin-top:4px;">Discovered ${new Date(m.discoveredAt).toLocaleDateString()}</div>` : ''}
            </div>
          `, { className: 'custom-popup' })

          monumentMarkersRef.current.set(m.id, marker)
        }
      })
    })
  }, [monuments, mapReady])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {mapReady && (
        <FogCanvas
          mapRef={mapRef as React.RefObject<L.Map>}
          discoveredTiles={discoveredTiles}
          playerLat={playerLat}
          playerLng={playerLng}
        />
      )}
    </div>
  )
}
