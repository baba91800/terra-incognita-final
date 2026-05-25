import { useEffect, useRef, useState } from 'react'
import type { Monument } from '../types/game'
import { RARITY_COLORS } from '../lib/constants'
import { dist } from '../lib/geo'
import type { Translations } from '../lib/i18n'

interface Props {
  monuments: Monument[]
  playerLat: number
  playerLng: number
  t: Translations
  onNavigate: (m: Monument) => void
}

const PROXIMITY_THRESHOLD = 100 // meters
const ALERT_COOLDOWN = 60000 // 1 minute per monument

export default function ProximityAlert({ monuments, playerLat, playerLng, t, onNavigate }: Props) {
  const [alert, setAlert] = useState<Monument | null>(null)
  const [distance, setDistance] = useState(0)
  const alerted = useRef<Map<string, number>>(new Map())
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const now = Date.now()

    // Find nearest undiscovered monument within threshold
    let nearest: Monument | null = null
    let nearestDist = Infinity

    monuments.forEach(m => {
      if (m.discovered) return
      const d = dist(playerLat, playerLng, m.lat, m.lng)
      if (d < PROXIMITY_THRESHOLD && d < nearestDist) {
        const lastAlert = alerted.current.get(m.id) || 0
        if (now - lastAlert > ALERT_COOLDOWN) {
          nearest = m
          nearestDist = d
        }
      }
    })

    if (nearest && nearestDist !== Infinity) {
      alerted.current.set((nearest as Monument).id, now)
      setAlert(nearest)
      setDistance(nearestDist)

      // Vibrate on mobile
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])

      // Auto dismiss after 5s
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setAlert(null), 5000)
    }

    // Update distance if already showing alert
    if (alert) {
      const d = dist(playerLat, playerLng, alert.lat, alert.lng)
      setDistance(d)
      if (d > PROXIMITY_THRESHOLD * 1.5) setAlert(null)
    }
  }, [playerLat, playerLng]) // eslint-disable-line

  if (!alert) return null

  const color = RARITY_COLORS[alert.rarity]
  const distLabel = Math.round(distance) + ' m'

  return (
    <div style={{
      position: 'absolute', top: 100, left: '50%', transform: 'translateX(-50%)',
      zIndex: 690, pointerEvents: 'auto',
      animation: 'toastIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
    }}>
      <div style={{
        background: 'rgba(5,12,24,0.97)',
        border: `1px solid ${color}80`,
        borderRadius: 14, padding: '10px 16px',
        boxShadow: `0 0 30px ${color}30, 0 8px 32px rgba(0,0,0,0.6)`,
        display: 'flex', alignItems: 'center', gap: 12,
        minWidth: 240,
      }}>
        {/* Pulsing dot */}
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: color, flexShrink: 0,
          boxShadow: `0 0 10px ${color}`,
          animation: 'pulse 1s ease-in-out infinite',
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>
            {color === RARITY_COLORS.legendary ? t.legendary : color === RARITY_COLORS.epic ? t.epic : color === RARITY_COLORS.rare ? t.rare : t.common} · {distLabel}
          </div>
          <div style={{ fontSize: 12, color: '#fff', fontStyle: 'italic' }}>??? {t.unknownSite}</div>
        </div>

        {/* Navigate button */}
        <button
          onClick={() => { onNavigate(alert); setAlert(null) }}
          style={{
            background: `${color}20`, border: `1px solid ${color}50`,
            borderRadius: 8, color: color, cursor: 'pointer',
            fontSize: 11, padding: '5px 10px', fontFamily: 'monospace',
            flexShrink: 0,
          }}
        >
          → Nav
        </button>

        {/* Dismiss */}
        <button onClick={() => setAlert(null)} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)',
          cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: '0 4px',
        }}>✕</button>
      </div>
    </div>
  )
}
