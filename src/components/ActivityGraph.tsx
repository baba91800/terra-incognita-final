import { useMemo } from 'react'

interface Props {
  log: Array<{ timestamp: string; points?: number }>
}

const WEEKS = 15
const DAYS = 7
const CELL = 11
const GAP = 3

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export default function ActivityGraph({ log }: Props) {
  const grid = useMemo(() => {
    // Construire une map date → XP gagné ce jour
    const dayMap = new Map<string, number>()

    log.forEach(e => {
      const d = e.timestamp.split('T')[0]
      dayMap.set(d, (dayMap.get(d) || 0) + (e.points || 10))
    })

    // Générer les WEEKS*DAYS derniers jours
    const today = new Date()
    const cells: Array<{ date: string; value: number; isToday: boolean }> = []

    for (let i = WEEKS * DAYS - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      cells.push({
        date: dateStr,
        value: dayMap.get(dateStr) || 0,
        isToday: i === 0,
      })
    }

    return cells
  }, [log])

  const maxVal = Math.max(...grid.map(c => c.value), 1)

  const getColor = (value: number, isToday: boolean) => {
    if (isToday && value === 0) return 'rgba(0,245,212,0.15)'
    if (value === 0) return 'rgba(255,255,255,0.04)'
    const intensity = value / maxVal
    if (intensity < 0.25) return 'rgba(0,180,160,0.35)'
    if (intensity < 0.5)  return 'rgba(0,200,180,0.55)'
    if (intensity < 0.75) return 'rgba(0,220,200,0.75)'
    return 'rgba(0,245,212,0.95)'
  }

  // Grouper par semaines (colonnes)
  const weeks: typeof grid[] = []
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(grid.slice(w * DAYS, (w + 1) * DAYS))
  }

  const totalDays = grid.filter(c => c.value > 0).length
  const totalXP = grid.reduce((s, c) => s + c.value, 0)

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase' }}>
          Activité — {WEEKS} semaines
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
          {totalDays}j · +{totalXP.toLocaleString()} XP
        </div>
      </div>

      <div style={{ display: 'flex', gap: GAP }}>
        {/* Labels jours */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, paddingTop: 1 }}>
          {DAY_LABELS.map((d, i) => (
            <div key={i} style={{
              width: 10, height: CELL,
              fontSize: 7, color: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace',
            }}>{i % 2 === 0 ? d : ''}</div>
          ))}
        </div>

        {/* Grille */}
        <div style={{ display: 'flex', gap: GAP, overflowX: 'auto' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {week.map((cell, di) => (
                <div
                  key={di}
                  title={`${cell.date} · ${cell.value > 0 ? `+${cell.value} XP` : 'Pas d\'exploration'}`}
                  style={{
                    width: CELL, height: CELL, borderRadius: 2,
                    background: getColor(cell.value, cell.isToday),
                    border: cell.isToday ? '1px solid rgba(0,245,212,0.5)' : '1px solid transparent',
                    transition: 'all 0.2s',
                    cursor: 'default',
                    boxShadow: cell.value > maxVal * 0.75 ? '0 0 4px rgba(0,245,212,0.4)' : 'none',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)' }}>Moins</span>
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <div key={v} style={{
            width: 9, height: 9, borderRadius: 2,
            background: v === 0 ? 'rgba(255,255,255,0.04)' : `rgba(0,${180 + v * 65},${160 + v * 52},${0.35 + v * 0.6})`,
          }} />
        ))}
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)' }}>Plus</span>
      </div>
    </div>
  )
}
