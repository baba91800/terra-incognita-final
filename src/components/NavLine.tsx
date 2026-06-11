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
  onRouteUpdate: (coords: [number,number][]) => void
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
  const fallback: [number,number][] = [[fromLat, fromLng], [toLat, toLng]]
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    const data = await res.json()
    if (data.routes?.[0]?.geometry?.coordinates) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number,number])
    }
  } catch {}
  return fallback
}

export default function NavLine({ mapRef, target, playerLat, playerLng, onCancel, onArrived, onRouteUpdate, t }: Props) {
  const markerRef = useRef<any>(null)
  const [dist, setDist] = useState<number | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const lastRouteKey = useRef('')

  // Nettoyer quand target devient null
  useEffect(() => {
    if (!target) {
      onRouteUpdate([]) // Effacer le tracé
      setDist(null)
      lastRouteKey.current = ''
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
    }
  }, [target])

  useEffect(() => {
    if (!target || !mapRef.current) return

    const d = distM(playerLat, playerLng, target.lat, target.lng)
    setDist(d)

    if (d < 25) { onArrived(); return }

    const routeKey = `${(playerLat).toFixed(4)},${(playerLng).toFixed(4)},${target.id}`
    if (routeKey === lastRouteKey.current) return
    lastRouteKey.current = routeKey
    setRouteLoading(true)

    // Ligne droite immédiate
    onRouteUpdate([[playerLat, playerLng], [target.lat, target.lng]])

    fetchRoute(playerLat, playerLng, target.lat, target.lng).then(coords => {
      setRouteLoading(false)
      if (!target) return // Annulé entre temps
      onRouteUpdate(coords)

      // Marqueur destination
      import('leaflet').then(({ default: L }) => {
        const map = mapRef.current
        if (!map || !target) return
        if (markerRef.current) markerRef.current.remove()
        markerRef.current = L.marker([target.lat, target.lng], {
          icon: L.divIcon({
            html: `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
              <div style="width:44px;height:44px;border-radius:50%;background:rgba(5,12,24,0.95);border:2px solid rgba(0,245,212,0.6);display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 0 20px rgba(0,245,212,0.4)">${target.icon || '📍'}</div>
              <div style="background:rgba(5,12,24,0.9);border:1px solid rgba(0,245,212,0.3);border-radius:8px;padding:3px 8px;font-size:10px;color:#00f5d4;font-family:monospace;white-space:nowrap">${target.discovered ? target.name : '???'}</div>
            </div>`,
            className: '', iconSize: [44, 70], iconAnchor: [22, 22],
          })
        }).addTo(map)
      })
    })
  }, [target, playerLat, playerLng])

  useEffect(() => {
    return () => {
      onRouteUpdate([])
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
      <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: 'rgba(0,245,212,0.1)', border: '1px solid rgba(0,245,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
        {target.icon || '📍'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {target.discovered ? target.name : '??? Lieu inconnu'}
        </div>
        <div style={{ marginTop: 3 }}>
          {routeLoading
            ? <span style={{ fontSize: 10, color: 'rgba(0,245,212,0.5)', fontFamily: 'monospace' }}>Calcul itinéraire...</span>
            : <span style={{ fontSize: 14, fontWeight: 'bold', color: '#00f5d4', fontFamily: 'monospace' }}>{distLabel}</span>
          }
        </div>
      </div>
      <button onClick={onCancel} style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.8)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
    </div>
  )
}
