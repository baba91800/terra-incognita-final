import { useEffect, useRef, useState } from 'react'
import type { Monument } from '../types/game'
import type { Translations } from '../lib/i18n'

interface Props {
  mapRef: React.RefObject<any>
  target: Monument | null
  playerLat: number
  playerLng: number
  onCancel: () => void
  onArrived: () => void
  t: Translations
}

function distM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

async function fetchRoute(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<[number,number][]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
    const res = await fetch(url)
    const data = await res.json()
    if (data.routes?.[0]?.geometry?.coordinates) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng])
    }
  } catch {}
  // Fallback ligne droite
  return [[fromLat, fromLng], [toLat, toLng]]
}

export default function NavLine({ mapRef, target, playerLat, playerLng, onCancel, onArrived, t }: Props) {
  const routeLayer = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [dist, setDist] = useState<number | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const lastRouteKey = useRef('')

  useEffect(() => {
    if (!target || !mapRef.current) {
      if (routeLayer.current) { routeLayer.current.remove(); routeLayer.current = null }
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
      setDist(null)
      return
    }

    const d = distM(playerLat, playerLng, target.lat, target.lng)
    setDist(d)

    // Arrivée
    if (d < 25) { onArrived(); return }

    // Charger la route OSRM (seulement si la position a changé de >10m)
    const routeKey = `${(playerLat).toFixed(4)},${(playerLng).toFixed(4)}`
    const shouldRefetch = routeKey !== lastRouteKey.current

    if (shouldRefetch) {
      lastRouteKey.current = routeKey
      setRouteLoading(true)

      fetchRoute(playerLat, playerLng, target.lat, target.lng).then(coords => {
        setRouteLoading(false)
        if (!mapRef.current) return

        import('leaflet').then(({ default: L }) => {
          const map = mapRef.current
          if (!map) return

          // Supprimer l'ancien tracé
          if (routeLayer.current) { routeLayer.current.remove(); routeLayer.current = null }

          // Tracer la route sur les rues
          routeLayer.current = L.polyline(coords, {
            color: '#00f5d4',
            weight: 4,
            opacity: 0.85,
            dashArray: '10, 6',
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map)

          // Marqueur destination
          if (markerRef.current) { markerRef.current.remove() }
          markerRef.current = L.marker([target.lat, target.lng], {
            icon: L.divIcon({
              html: `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                <div style="width:44px;height:44px;border-radius:50%;background:rgba(5,12,24,0.95);border:2px solid rgba(0,245,212,0.6);display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 0 20px rgba(0,245,212,0.4)">
                  ${target.icon || '📍'}
                </div>
                <div style="background:rgba(5,12,24,0.9);border:1px solid rgba(0,245,212,0.3);border-radius:8px;padding:3px 8px;font-size:10px;color:#00f5d4;font-family:monospace;white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis">
                  ${target.name || '???'}
                </div>
              </div>`,
              className: '',
              iconSize: [44, 70],
              iconAnchor: [22, 22],
            })
          }).addTo(map)
        })
      })
    }
  }, [target, playerLat, playerLng])

  // Cleanup
  useEffect(() => {
    return () => {
      if (routeLayer.current) { routeLayer.current.remove(); routeLayer.current = null }
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
    }
  }, [])

  if (!target || dist === null) return null

  const distLabel = dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`

  return (
    <div style={{
      position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
      zIndex: 600, pointerEvents: 'auto',
      background: 'rgba(5,12,24,0.95)',
      border: '1px solid rgba(0,245,212,0.25)',
      borderRadius: 16, padding: '12px 20px',
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      minWidth: 260,
    }}>
      {/* Icône monument */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(0,245,212,0.1)', border: '1px solid rgba(0,245,212,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>
        {target.icon || '📍'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {target.discovered ? target.name : '??? Lieu inconnu'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          {routeLoading
            ? <span style={{ fontSize: 10, color: 'rgba(0,245,212,0.5)', fontFamily: 'monospace' }}>Calcul itinéraire...</span>
            : <span style={{ fontSize: 14, fontWeight: 'bold', color: '#00f5d4', fontFamily: 'monospace' }}>{distLabel}</span>
          }
        </div>
      </div>

      {/* Bouton annuler */}
      <button onClick={onCancel} style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
        color: 'rgba(239,68,68,0.8)', cursor: 'pointer', fontSize: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>✕</button>
    </div>
  )
}
