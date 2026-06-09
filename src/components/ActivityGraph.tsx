import { useMemo, useState } from 'react'

import type { Translations } from '../lib/i18n'

interface Props {
  log: Array<{ timestamp: string; points?: number; type?: string }>
  path: Array<{ lat: number; lng: number; timestamp: number }>
  t: Translations
}

const WEEKS = 12
const DAYS = 7
const CELL = 14
const GAP = 3
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function distBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

interface DayData {
  date: string
  km: number
  xp: number
  discoveries: number
  isToday: boolean
  label: string
}

export default function ActivityGraph({ log, path, t }: Props) {
  const [selected, setSelected] = useState<DayData | null>(null)

  const { grid, maxKm, totalKm, totalActiveDays } = useMemo(() => {
    // Calculer km par jour depuis le path
    const kmByDay = new Map<string, number>()
    for (let i = 1; i < path.length; i++) {
      const prev = path[i-1]
      const curr = path[i]
      // Ignorer les sauts trop grands (GPS perdu)
      const d = distBetween(prev.lat, prev.lng, curr.lat, curr.lng)
      if (d > 500) continue // >500m entre deux points = saut GPS
      const date = new Date(curr.timestamp).toISOString().split('T')[0]
      kmByDay.set(date, (kmByDay.get(date) || 0) + d / 1000)
    }

    // XP et découvertes par jour depuis le log
    const xpByDay = new Map<string, { xp: number; discoveries: number }>()
    log.forEach(e => {
      const d = e.timestamp.split('T')[0]
      const existing = xpByDay.get(d) || { xp: 0, discoveries: 0 }
      existing.xp += e.points || 0
      if (['monument','country','badge'].includes(e.type || '')) existing.discoveries++
      xpByDay.set(d, existing)
    })

    const today = new Date()
    const cells: DayData[] = []
    for (let i = WEEKS * DAYS - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const km = kmByDay.get(dateStr) || 0
      const extra = xpByDay.get(dateStr) || { xp: 0, discoveries: 0 }
      const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1
      cells.push({
        date: dateStr, km,
        xp: extra.xp, discoveries: extra.discoveries,
        isToday: i === 0,
        label: DAY_LABELS[dayIdx],
      })
    }

    const maxKm = Math.max(...cells.map(c => c.km), 0.1)
    const totalKm = cells.reduce((s, c) => s + c.km, 0)
    const totalActiveDays = cells.filter(c => c.km > 0).length

    return { grid: cells, maxKm, totalKm, totalActiveDays }
  }, [log, path])

  const getColor = (km: number, isToday: boolean) => {
    if (isToday && km === 0) return 'rgba(0,245,212,0.1)'
    if (km === 0) return 'rgba(255,255,255,0.04)'
    const intensity = km / maxKm
    if (intensity < 0.15) return 'rgba(0,160,140,0.4)'
    if (intensity < 0.35) return 'rgba(0,190,165,0.55)'
    if (intensity < 0.6)  return 'rgba(0,215,190,0.72)'
    if (intensity < 0.85) return 'rgba(0,235,210,0.88)'
    return '#00f5d4'
  }

  const weeks: DayData[][] = []
  for (let w = 0; w < WEEKS; w++) weeks.push(grid.slice(w * DAYS, (w + 1) * DAYS))

  // Labels mois
  const monthLabels: { label: string; col: number }[] = []
  weeks.forEach((week, wi) => {
    const d = new Date(week[0].date)
    if (wi === 0 || d.getDate() <= 7) {
      if (wi === 0 || weeks[wi-1][0].date.substring(0,7) !== week[0].date.substring(0,7)) {
        monthLabels.push({ label: MONTHS[d.getMonth()], col: wi })
      }
    }
  })

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>
            {t.activityTitle} · {WEEKS} {t.weeksLabel}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#00f5d4', fontFamily: 'monospace' }}>{totalKm.toFixed(1)} km</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.totalPeriod}</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{totalActiveDays}j</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Jours actifs</div>
            </div>
            {totalActiveDays > 0 && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{(totalKm / totalActiveDays).toFixed(1)} km</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.avgPerDay}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Labels mois */}
      <div style={{ display: 'flex', marginLeft: 18, marginBottom: 4, gap: GAP }}>
        {weeks.map((_, wi) => {
          const ml = monthLabels.find(m => m.col === wi)
          return (
            <div key={wi} style={{ width: CELL, fontSize: 7, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', overflow: 'visible', whiteSpace: 'nowrap' }}>
              {ml ? ml.label : ''}
            </div>
          )
        })}
      </div>

      {/* Grille */}
      <div style={{ display: 'flex', gap: 2 }}>
        {/* Labels jours */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: 2 }}>
          {DAY_LABELS.map((d, i) => (
            <div key={i} style={{ width: 10, height: CELL, fontSize: 7, color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', fontFamily: 'monospace' }}>
              {i % 2 === 0 ? d : ''}
            </div>
          ))}
        </div>

        {/* Cellules */}
        <div style={{ display: 'flex', gap: GAP }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {week.map((cell, di) => (
                <div
                  key={di}
                  onClick={() => setSelected(selected?.date === cell.date ? null : cell)}
                  style={{
                    width: CELL, height: CELL, borderRadius: 3,
                    background: getColor(cell.km, cell.isToday),
                    border: selected?.date === cell.date
                      ? '1.5px solid #00f5d4'
                      : cell.isToday
                        ? '1px solid rgba(0,245,212,0.5)'
                        : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'transform 0.1s',
                    boxShadow: cell.km > maxKm * 0.7 ? `0 0 5px rgba(0,245,212,0.5)` : 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Détail jour sélectionné */}
      {selected && (
        <div style={{
          marginTop: 12, padding: '12px 14px', borderRadius: 10,
          background: 'rgba(0,245,212,0.05)', border: '1px solid rgba(0,245,212,0.2)',
          animation: 'toastIn 0.2s ease-out',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#fff', marginBottom: 2, textTransform: 'capitalize' }}>
                {formatDate(selected.date)}
                {selected.isToday && <span style={{ marginLeft: 8, fontSize: 9, color: '#00f5d4', background: 'rgba(0,245,212,0.15)', padding: '2px 6px', borderRadius: 4 }}>{t.todayLabel}</span>}
              </div>
              {selected.km > 0 ? (
                <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 'bold', color: '#00f5d4', fontFamily: 'monospace' }}>{selected.km.toFixed(2)} km</div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.kmWalked}</div>
                  </div>
                  {selected.xp > 0 && (
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 'bold', color: '#f59e0b', fontFamily: 'monospace' }}>+{selected.xp.toLocaleString()}</div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.xpEarned}</div>
                    </div>
                  )}
                  {selected.discoveries > 0 && (
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 'bold', color: '#a855f7', fontFamily: 'monospace' }}>{selected.discoveries}</div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.discoveries}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', marginTop: 4 }}>
                  {t.noExploration}
                </div>
              )}
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>✕</button>
          </div>
        </div>
      )}

      {/* Légende */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)' }}>0 km</span>
        {[0, 0.15, 0.35, 0.6, 0.85, 1].map((v, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: 2,
            background: getColor(v * maxKm, false),
          }} />
        ))}
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)' }}>{maxKm.toFixed(1)} km</span>
      </div>
    </div>
  )
}
