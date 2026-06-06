import { useMemo, useState } from 'react'

interface Props {
  log: Array<{ timestamp: string; points?: number; type?: string }>
}

const WEEKS = 15
const DAYS = 7
const CELL = 13
const GAP = 3
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

interface DayData {
  date: string
  xp: number
  discoveries: number
  isToday: boolean
  dayLabel: string
  monthLabel: string
}

export default function ActivityGraph({ log }: Props) {
  const [selected, setSelected] = useState<DayData | null>(null)

  const { grid, maxVal, totalActiveDays, totalXP } = useMemo(() => {
    const dayMap = new Map<string, { xp: number; discoveries: number }>()

    log.forEach(e => {
      const d = e.timestamp.split('T')[0]
      const existing = dayMap.get(d) || { xp: 0, discoveries: 0 }
      existing.xp += e.points || 10
      if (e.type === 'monument' || e.type === 'country' || e.type === 'badge') {
        existing.discoveries++
      }
      dayMap.set(d, existing)
    })

    const today = new Date()
    const cells: DayData[] = []

    for (let i = WEEKS * DAYS - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const data = dayMap.get(dateStr) || { xp: 0, discoveries: 0 }
      cells.push({
        date: dateStr,
        xp: data.xp,
        discoveries: data.discoveries,
        isToday: i === 0,
        dayLabel: DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1],
        monthLabel: MONTHS[d.getMonth()],
      })
    }

    const maxVal = Math.max(...cells.map(c => c.xp), 1)
    const totalActiveDays = cells.filter(c => c.xp > 0).length
    const totalXP = cells.reduce((s, c) => s + c.xp, 0)

    return { grid: cells, maxVal, totalActiveDays, totalXP }
  }, [log])

  const getColor = (xp: number, isToday: boolean) => {
    if (isToday && xp === 0) return 'rgba(0,245,212,0.12)'
    if (xp === 0) return 'rgba(255,255,255,0.04)'
    const intensity = xp / maxVal
    if (intensity < 0.2)  return 'rgba(0,180,160,0.3)'
    if (intensity < 0.4)  return 'rgba(0,200,180,0.5)'
    if (intensity < 0.6)  return 'rgba(0,220,200,0.7)'
    if (intensity < 0.8)  return 'rgba(0,235,210,0.85)'
    return 'rgba(0,245,212,1)'
  }

  // Grouper par semaines
  const weeks: DayData[][] = []
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(grid.slice(w * DAYS, (w + 1) * DAYS))
  }

  // Labels des mois (au-dessus)
  const monthLabels: { label: string; col: number }[] = []
  weeks.forEach((week, wi) => {
    const firstDay = week[0]
    if (wi === 0 || firstDay.date.endsWith('-01') || (wi > 0 && weeks[wi-1][0].monthLabel !== firstDay.monthLabel)) {
      monthLabels.push({ label: firstDay.monthLabel, col: wi })
    }
  })

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div>
      {/* Titre + résumé */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase' }}>
          Activité · {WEEKS} semaines
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
          {totalActiveDays}j actifs · +{totalXP.toLocaleString()} XP
        </div>
      </div>

      {/* Labels mois */}
      <div style={{ display: 'flex', marginLeft: 18, marginBottom: 3, gap: GAP }}>
        {weeks.map((_, wi) => {
          const ml = monthLabels.find(m => m.col === wi)
          return (
            <div key={wi} style={{ width: CELL, fontSize: 7, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', overflow: 'visible', whiteSpace: 'nowrap' }}>
              {ml ? ml.label : ''}
            </div>
          )
        })}
      </div>

      {/* Grille */}
      <div style={{ display: 'flex', gap: 2 }}>
        {/* Labels jours */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, paddingTop: 1, marginRight: 2 }}>
          {DAY_LABELS.map((d, i) => (
            <div key={i} style={{ width: 10, height: CELL, fontSize: 7, color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', fontFamily: 'monospace' }}>
              {i % 2 === 0 ? d : ''}
            </div>
          ))}
        </div>

        {/* Cellules */}
        <div style={{ display: 'flex', gap: GAP, overflowX: 'hidden' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {week.map((cell, di) => (
                <div
                  key={di}
                  onClick={() => setSelected(selected?.date === cell.date ? null : cell)}
                  style={{
                    width: CELL, height: CELL, borderRadius: 3,
                    background: getColor(cell.xp, cell.isToday),
                    border: selected?.date === cell.date
                      ? '1.5px solid rgba(0,245,212,0.9)'
                      : cell.isToday
                        ? '1px solid rgba(0,245,212,0.4)'
                        : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: cell.xp > maxVal * 0.7 ? '0 0 4px rgba(0,245,212,0.5)' : 'none',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Détail du jour sélectionné */}
      {selected && (
        <div style={{
          marginTop: 10, padding: '10px 12px', borderRadius: 10,
          background: 'rgba(0,245,212,0.06)',
          border: '1px solid rgba(0,245,212,0.2)',
          animation: 'toastIn 0.2s ease-out',
        }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', color: '#fff', marginBottom: 4, textTransform: 'capitalize' }}>
            {formatDate(selected.date)}
            {selected.isToday && <span style={{ marginLeft: 8, fontSize: 9, color: '#00f5d4', background: 'rgba(0,245,212,0.15)', padding: '2px 6px', borderRadius: 4 }}>Aujourd'hui</span>}
          </div>
          {selected.xp > 0 ? (
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>XP gagné</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#00f5d4', fontFamily: 'monospace' }}>+{selected.xp.toLocaleString()}</div>
              </div>
              {selected.discoveries > 0 && (
                <div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Découvertes</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#f59e0b', fontFamily: 'monospace' }}>{selected.discoveries}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
              Pas d'exploration ce jour
            </div>
          )}
        </div>
      )}

      {/* Légende */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)' }}>Moins</span>
        {[0, 0.2, 0.4, 0.7, 1].map((v, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: 2,
            background: v === 0 ? 'rgba(255,255,255,0.04)' : getColor(v * maxVal, false),
          }} />
        ))}
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)' }}>Plus</span>
      </div>
    </div>
  )
}
