import { useEffect, useState, useCallback } from 'react'

interface Props {
  mapRef: React.RefObject<any>
}

// FIX #18 — On n'utilise plus mapRef.current comme dépendance de useEffect
// À la place, on expose une fonction update appelée depuis l'extérieur via callback pattern,
// et on écoute un event custom 'mapready' pour démarrer l'écoute dès que la carte est prête.
export default function ScaleBar({ mapRef }: Props) {
  const [scale, setScale] = useState<{ width: number; label: string } | null>(null)

  const attachListeners = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    const update = () => {
      const zoom = map.getZoom()
      const center = map.getCenter()
      const metersPerPixel = (156543.03392 * Math.cos(center.lat * Math.PI / 180)) / Math.pow(2, zoom)
      const targetMeters = metersPerPixel * 100
      const nice = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000]
      const rounded = nice.reduce((prev, curr) =>
        Math.abs(curr - targetMeters) < Math.abs(prev - targetMeters) ? curr : prev
      )
      const width = rounded / metersPerPixel
      const label = rounded >= 1000 ? `${rounded / 1000} km` : `${rounded} m`
      setScale({ width, label })
    }

    map.on('zoom move zoomend moveend', update)
    update()
    return () => map.off('zoom move zoomend moveend', update)
  }, [mapRef])

  // Polling léger pour détecter quand la carte devient disponible
  // (évite le piège de ref.current comme dépendance)
  useEffect(() => {
    let cleanup: (() => void) | undefined
    let attempts = 0
    const MAX_ATTEMPTS = 30 // 3 secondes max

    const tryAttach = () => {
      if (mapRef.current) {
        cleanup = attachListeners() ?? undefined
        return
      }
      attempts++
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(tryAttach, 100)
      }
    }

    tryAttach()
    return () => { cleanup?.() }
  }, [attachListeners])

  if (!scale) return null

  return (
    <div style={{
      position: 'absolute', bottom: 20, right: 70,
      zIndex: 600, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    }}>
      <div style={{
        fontSize: 9, fontFamily: 'monospace', color: 'rgba(0,245,212,0.7)',
        letterSpacing: '0.08em', textShadow: '0 1px 4px rgba(0,0,0,0.8)',
      }}>
        {scale.label}
      </div>
      <div style={{
        width: scale.width, height: 3,
        background: 'rgba(0,245,212,0.8)', borderRadius: 2,
        boxShadow: '0 0 6px rgba(0,245,212,0.5)', position: 'relative',
      }}>
        <div style={{ position: 'absolute', left: 0, top: -3, width: 2, height: 9, background: 'rgba(0,245,212,0.8)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', right: 0, top: -3, width: 2, height: 9, background: 'rgba(0,245,212,0.8)', borderRadius: 1 }} />
      </div>
    </div>
  )
}
