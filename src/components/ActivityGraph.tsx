import { useMemo, useState } from 'react'
import type { Translations } from '../lib/i18n'

interface Props {
  log: Array<{ timestamp: string; points?: number; type?: string }>
  path: Array<{ lat: number; lng: number; timestamp: number }>
  t: Translations
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const DAY_LABELS = ['L','M','M','J','V','S','D']
const DAY_NAMES = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']

function distBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export default function ActivityGraph({ log, path, t }: Props) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(null)

  const { kmByDate, xpByDate, monByDate, m2ByDate, maxKm, totalActiveDays, streak } = useMemo(() => {
    const xpByDate: Record<string, number> = {}
    const monByDate: Record<string, number> = {}
    const m2ByDate: Record<string, number> = {}

    log.forEach(e => {
      const key = new Date(e.timestamp).toISOString().slice(0, 10)
      if (e.points) xpByDate[key] = (xpByDate[key] || 0) + e.points
      if (e.type === 'monument') monByDate[key] = (monByDate[key] || 0) + 1
      if (e.type === 'tile') m2ByDate[key] = (m2ByDate[key] || 0) + 100
    })

    // Distance basée sur path si disponible
    const kmByDate: Record<string, number> = {}
    for (let i = 1; i < path.length; i++) {
      const prev = path[i-1], cur = path[i]
      const d = distBetween(prev.lat, prev.lng, cur.lat, cur.lng)
      if (d > 50) continue // ignorer les sauts GPS aberrants
      const key = new Date(cur.timestamp).toISOString().slice(0, 10)
      kmByDate[key] = (kmByDate[key] || 0) + d / 1000
    }
    // Si pas de distance calculée mais XP > 0, marquer comme jour actif avec 0.1 km minimum
    Object.keys(xpByDate).forEach(key => {
      if (!kmByDate[key]) kmByDate[key] = 0.1
    })

    const maxKm = Math.max(...Object.values(kmByDate), 0.1)
    const totalActiveDays = Object.values(kmByDate).filter(v => v > 0).length

    // Streak actuel
    let streak = 0
    const check = new Date(today)
    check.setHours(12)
    for (let i = 0; i < 365; i++) {
      const key = check.toISOString().slice(0, 10)
      if (kmByDate[key] > 0) { streak++; check.setDate(check.getDate() - 1) }
      else if (i === 0) { check.setDate(check.getDate() - 1) }
      else break
    }

    return { kmByDate, xpByDate, monByDate, m2ByDate, maxKm, totalActiveDays, streak }
  }, [log, path])

  // Construire la grille du mois
  const { days, firstDayOffset } = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const firstDayOffset = (firstDay + 6) % 7 // lundi = 0
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1
      const key = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const isToday = key === today.toISOString().slice(0, 10)
      const isFuture = new Date(key) > today
      return { day: d, key, km: kmByDate[key] || 0, isToday, isFuture }
    })
    return { days, firstDayOffset }
  }, [viewYear, viewMonth, kmByDate])

  const getColor = (km: number, isFuture: boolean) => {
    if (isFuture) return 'rgba(255,255,255,0.02)'
    if (km === 0) return 'rgba(255,255,255,0.06)'
    const intensity = Math.min(1, km / maxKm)
    if (intensity < 0.2) return 'rgba(0,245,212,0.2)'
    if (intensity < 0.4) return 'rgba(0,245,212,0.4)'
    if (intensity < 0.6) return 'rgba(0,245,212,0.6)'
    if (intensity < 0.8) return 'rgba(0,245,212,0.8)'
    return '#00f5d4'
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) }
    else setViewMonth(m => m-1)
    setSelected(null)
  }
  const nextMonth = () => {
    const n = new Date(viewYear, viewMonth + 1, 1)
    if (n > today) return
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) }
    else setViewMonth(m => m+1)
    setSelected(null)
  }

  const selectedKey = selected
  const selData = selectedKey ? {
    km: kmByDate[selectedKey] || 0,
    xp: xpByDate[selectedKey] || 0,
    mon: monByDate[selectedKey] || 0,
    m2: m2ByDate[selectedKey] || 0,
  } : null
  const selDate = selectedKey ? new Date(selectedKey + 'T12:00:00') : null

  const isNextDisabled = new Date(viewYear, viewMonth + 1, 1) > today

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 16 }}>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, background: 'rgba(0,245,212,0.06)', borderRadius: 10, padding: '8px 12px' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Jours actifs</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#00f5d4', fontFamily: 'monospace' }}>{totalActiveDays}</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(245,158,11,0.06)', borderRadius: 10, padding: '8px 12px' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Série actuelle</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#f59e0b', fontFamily: 'monospace' }}>🔥 {streak}j</div>
        </div>
      </div>

      {/* Navigation mois */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◀</button>
        <div style={{ fontSize: 14, fontWeight: 'bold', color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace' }}>
          {MONTHS[viewMonth]} {viewYear}
        </div>
        <button onClick={nextMonth} style={{ background: isNextDisabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)', border: 'none', color: isNextDisabled ? 'rgba(255,255,255,0.2)' : '#fff', borderRadius: 8, width: 32, height: 32, cursor: isNextDisabled ? 'default' : 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</button>
      </div>

      {/* Labels jours semaine */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DAY_LABELS.map((l, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', padding: '2px 0' }}>{l}</div>
        ))}
      </div>

      {/* Grille calendrier */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {/* Cases vides avant le 1er */}
        {Array.from({ length: firstDayOffset }, (_, i) => (
          <div key={`e${i}`} />
        ))}
        {/* Jours du mois */}
        {days.map(({ day, key, km, isToday, isFuture }) => (
          <div
            key={key}
            onClick={() => !isFuture && setSelected(selected === key ? null : key)}
            style={{
              aspectRatio: '1',
              borderRadius: 6,
              background: getColor(km, isFuture),
              border: isToday ? '1.5px solid rgba(0,245,212,0.7)' : selected === key ? '1.5px solid rgba(255,255,255,0.4)' : '1.5px solid transparent',
              cursor: isFuture ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontFamily: 'monospace',
              color: km > 0 ? (km/maxKm > 0.6 ? '#000' : 'rgba(255,255,255,0.8)') : 'rgba(255,255,255,0.25)',
              fontWeight: isToday ? 'bold' : 'normal',
              transition: 'transform 0.1s',
              transform: selected === key ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginRight: 4 }}>Inactif</span>
        {[0, 0.2, 0.4, 0.7, 1].map(v => (
          <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: getColor(v * maxKm, false) }} />
        ))}
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>Actif</span>
      </div>

      {/* Panel détail jour sélectionné */}
      {selData && selDate && (
        <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(0,245,212,0.05)', borderRadius: 12, border: '1px solid rgba(0,245,212,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>
              {DAY_NAMES[(selDate.getDay() + 6) % 7]} {selDate.getDate()} {MONTHS_SHORT[selDate.getMonth()]} {selDate.getFullYear()}
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 2, letterSpacing: '0.08em' }}>XP GAGNÉ</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#f59e0b', fontFamily: 'monospace' }}>
                {selData.xp > 0 ? `+${selData.xp.toLocaleString()}` : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 2, letterSpacing: '0.08em' }}>ZONE EXPLORÉE</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#a78bfa', fontFamily: 'monospace' }}>
                {selData.m2 > 0 ? `${(selData.m2).toLocaleString()} m²` : '—'}
              </div>
            </div>
            {selData.mon > 0 && (
              <div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 2, letterSpacing: '0.08em' }}>MONUMENTS</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#22c55e', fontFamily: 'monospace' }}>🏛️ {selData.mon}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
