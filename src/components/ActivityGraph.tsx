import { useMemo, useState } from 'react'
import type { Translations } from '../lib/i18n'

interface Props {
  log: Array<{ timestamp: string; points?: number; type?: string }>
  path: Array<{ lat: number; lng: number; timestamp: number }>
  t: Translations
}

const WEEKS = 15
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const DAY_NAMES = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

function distBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export default function ActivityGraph({ log, path, t }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  const { weeks, dayData, maxKm, totalActiveDays, currentStreak, avgKm } = useMemo(() => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    // Calculer km par jour depuis le path
    const kmByDate: Record<string, number> = {}
    const xpByDate: Record<string, number> = {}
    const monByDate: Record<string, number> = {}

    for (let i = 1; i < path.length; i++) {
      const prev = path[i-1], cur = path[i]
      const d = distBetween(prev.lat, prev.lng, cur.lat, cur.lng)
      const dateKey = new Date(cur.timestamp).toISOString().slice(0, 10)
      kmByDate[dateKey] = (kmByDate[dateKey] || 0) + d / 1000
    }

    log.forEach(e => {
      const dateKey = new Date(e.timestamp).toISOString().slice(0, 10)
      if (e.points) xpByDate[dateKey] = (xpByDate[dateKey] || 0) + e.points
      if (e.type === 'monument') monByDate[dateKey] = (monByDate[dateKey] || 0) + 1
    })

    // Construire la grille — WEEKS semaines en arrière depuis aujourd'hui
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - (WEEKS * 7) + 1)
    // Aligner sur lundi
    const dayOfWeek = (startDate.getDay() + 6) % 7
    startDate.setDate(startDate.getDate() - dayOfWeek)

    const weeks: Array<Array<{ date: string; km: number; xp: number; mon: number; isToday: boolean; isFuture: boolean }>> = []
    let cur = new Date(startDate)

    for (let w = 0; w < WEEKS; w++) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const key = cur.toISOString().slice(0, 10)
        const isToday = cur.toDateString() === today.toDateString()
        const isFuture = cur > today
        week.push({ date: key, km: kmByDate[key] || 0, xp: xpByDate[key] || 0, mon: monByDate[key] || 0, isToday, isFuture })
        cur.setDate(cur.getDate() + 1)
      }
      weeks.push(week)
    }

    const allDays = weeks.flat().filter(d => !d.isFuture)
    const maxKm = Math.max(...allDays.map(d => d.km), 0.1)
    const totalActiveDays = allDays.filter(d => d.km > 0).length

    // Streak actuel
    let streak = 0
    const todayKey = today.toISOString().slice(0, 10)
    let checkDate = new Date(today)
    while (true) {
      const key = checkDate.toISOString().slice(0, 10)
      if (kmByDate[key] > 0) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else if (key === todayKey) {
        checkDate.setDate(checkDate.getDate() - 1)
      } else break
    }

    const activeDays = allDays.filter(d => d.km > 0)
    const avgKm = activeDays.length > 0 ? activeDays.reduce((s, d) => s + d.km, 0) / activeDays.length : 0

    // Construire dayData (index par date)
    const dayData: Record<string, typeof allDays[0]> = {}
    allDays.forEach(d => dayData[d.date] = d)

    return { weeks, dayData, maxKm, totalActiveDays, currentStreak, avgKm }
  }, [log, path])

  const getColor = (km: number, isFuture: boolean, isToday: boolean) => {
    if (isFuture) return 'rgba(255,255,255,0.03)'
    if (km === 0) return 'rgba(255,255,255,0.06)'
    const intensity = Math.min(1, km / maxKm)
    if (intensity < 0.25) return 'rgba(0,180,160,0.4)'
    if (intensity < 0.5)  return 'rgba(0,210,180,0.6)'
    if (intensity < 0.75) return 'rgba(0,235,200,0.8)'
    return '#00f5d4'
  }

  const selectedData = selected ? dayData[selected] : null
  const selectedDate = selected ? new Date(selected + 'T12:00:00') : null

  // Mois labels
  const monthLabels: Array<{ label: string; col: number }> = []
  weeks.forEach((week, wi) => {
    const firstDay = week[0]
    const d = new Date(firstDay.date + 'T12:00:00')
    if (d.getDate() <= 7) {
      monthLabels.push({ label: MONTHS[d.getMonth()], col: wi })
    }
  })

  const CELL = 16
  const GAP = 3

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: '16px', marginBottom: 16 }}>

      {/* Stats résumé */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 80 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Jours actifs</div>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#00f5d4', fontFamily: 'monospace' }}>{totalActiveDays}</div>
        </div>
        <div style={{ flex: 1, minWidth: 80 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Série actuelle</div>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#f59e0b', fontFamily: 'monospace' }}>🔥 {currentStreak || 0}j</div>
        </div>
        <div style={{ flex: 1, minWidth: 80 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Moy. / jour actif</div>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#a78bfa', fontFamily: 'monospace' }}>{avgKm.toFixed(1)} km</div>
        </div>
      </div>

      {/* Labels mois */}
      <div style={{ display: 'flex', paddingLeft: 28, marginBottom: 4, position: 'relative', height: 14 }}>
        {monthLabels.map(({ label, col }) => (
          <div key={col} style={{
            position: 'absolute', left: 28 + col * (CELL + GAP),
            fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', whiteSpace: 'nowrap'
          }}>{label}</div>
        ))}
      </div>

      {/* Grille */}
      <div style={{ display: 'flex', gap: GAP, alignItems: 'flex-start' }}>
        {/* Labels jours */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, paddingTop: 0 }}>
          {['L','','M','','V','','D'].map((label, i) => (
            <div key={i} style={{ width: 16, height: CELL, fontSize: 8, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', fontFamily: 'monospace' }}>{label}</div>
          ))}
        </div>

        {/* Colonnes semaines */}
        <div style={{ display: 'flex', gap: GAP, overflowX: 'auto' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {week.map((day, di) => (
                <div
                  key={di}
                  onClick={() => !day.isFuture && setSelected(selected === day.date ? null : day.date)}
                  style={{
                    width: CELL, height: CELL, borderRadius: 3,
                    background: getColor(day.km, day.isFuture, day.isToday),
                    cursor: day.isFuture ? 'default' : 'pointer',
                    border: day.isToday ? '1px solid rgba(0,245,212,0.6)' : selected === day.date ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
                    transition: 'transform 0.1s',
                    transform: selected === day.date ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>Moins</span>
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: getColor(v * maxKm, false, false) }} />
        ))}
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>Plus</span>
      </div>

      {/* Tooltip sélection */}
      {selectedData && selectedDate && (
        <div style={{
          marginTop: 12, padding: '12px 16px',
          background: 'rgba(0,245,212,0.05)', borderRadius: 10,
          border: '1px solid rgba(0,245,212,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>
              {DAY_NAMES[(selectedDate.getDay() + 6) % 7]} {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>DISTANCE</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#00f5d4', fontFamily: 'monospace' }}>
                {selectedData.km > 0 ? `${selectedData.km.toFixed(2)} km` : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>XP GAGNÉ</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#f59e0b', fontFamily: 'monospace' }}>
                {selectedData.xp > 0 ? `+${selectedData.xp.toLocaleString()}` : '—'}
              </div>
            </div>
            {selectedData.mon > 0 && (
              <div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>MONUMENTS</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#a78bfa', fontFamily: 'monospace' }}>{selectedData.mon}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
