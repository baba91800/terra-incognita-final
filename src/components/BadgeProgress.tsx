// Notification "badge proche" — affiché quand il manque peu pour débloquer un badge
import { useMemo } from 'react'
import type { Badge } from '../types/game'

interface Props {
  badges: Badge[]
  tiles: Set<string>
  totalDist: number
  score: number
  monuments: Array<{ discovered: boolean; rarity: string; type: string }>
  countries: Array<{ rarity: string }>
  streak: number
}

interface Progress {
  badge: Badge
  current: number
  target: number
  pct: number
  unit: string
}

export default function BadgeProgress({ badges, tiles, totalDist, score, monuments, countries, streak }: Props) {
  const nearby = useMemo(() => {
    const km2 = tiles.size * 0.0001
    const dm = monuments.filter(m => m.discovered)
    const caves = dm.filter(m => m.type === 'cave').length
    const peaks = dm.filter(m => m.type === 'peak').length
    const lighthouses = dm.filter(m => m.type === 'lighthouse').length
    const windmills = dm.filter(m => m.type === 'windmill').length
    const legendary = dm.filter(m => m.rarity === 'legendary').length
    const naturalTypes = ['volcano','glacier','peak','cave','waterfall','hot_spring','park','reserve','spring','tree','cliff','gorge','arch','cape']
    const natural = dm.filter(m => naturalTypes.includes(m.type)).length
    const epicHistoric = dm.filter(m => m.rarity === 'epic' && ['castle','fort','ruins','megalith','palace','cathedral'].includes(m.type)).length

    const checks: Array<{ id: string; current: number; target: number; unit: string }> = [
      { id: 'b1',  current: km2,          target: 0.01,   unit: 'km²' },
      { id: 'b14', current: km2,          target: 0.1,    unit: 'km²' },
      { id: 'b2',  current: km2,          target: 1,      unit: 'km²' },
      { id: 'b3',  current: km2,          target: 10,     unit: 'km²' },
      { id: 'b19', current: km2,          target: 50,     unit: 'km²' },
      { id: 'b13', current: totalDist/1000, target: 10,   unit: 'km' },
      { id: 'b18', current: totalDist/1000, target: 42,   unit: 'km' },
      { id: 'b20', current: totalDist/1000, target: 100,  unit: 'km' },
      { id: 'b4',  current: dm.length,    target: 1,      unit: 'sites' },
      { id: 'b5',  current: dm.length,    target: 5,      unit: 'sites' },
      { id: 'b6',  current: dm.length,    target: 10,     unit: 'sites' },
      { id: 'b7',  current: legendary,    target: 1,      unit: 'légendaires' },
      { id: 'b12', current: legendary,    target: 3,      unit: 'légendaires' },
      { id: 'b16', current: natural,      target: 5,      unit: 'naturels' },
      { id: 'b17', current: epicHistoric, target: 3,      unit: 'épiques' },
      { id: 'b21', current: caves,        target: 3,      unit: 'grottes' },
      { id: 'b22', current: peaks,        target: 3,      unit: 'sommets' },
      { id: 'b23', current: lighthouses,  target: 2,      unit: 'phares' },
      { id: 'b24', current: windmills,    target: 3,      unit: 'moulins' },
      { id: 'b8',  current: score,        target: 5000,   unit: 'pts' },
      { id: 'b25', current: score,        target: 10000,  unit: 'pts' },
      { id: 'b26', current: score,        target: 100000, unit: 'pts' },
      { id: 'b10', current: countries.length, target: 3,  unit: 'pays' },
      { id: 'b11', current: countries.length, target: 5,  unit: 'pays' },
      { id: 'b27', current: countries.length, target: 10, unit: 'pays' },
      { id: 'b15', current: streak,       target: 7,      unit: 'jours' },
      { id: 'b31', current: streak,       target: 30,     unit: 'jours' },
    ]

    const result: Progress[] = []
    checks.forEach(c => {
      const badge = badges.find(b => b.id === c.id)
      if (!badge || badge.earned) return
      const pct = Math.min(100, (c.current / c.target) * 100)
      // Afficher seulement si progression > 20% et < 100%
      if (pct >= 20 && pct < 100) {
        result.push({ badge, current: c.current, target: c.target, pct, unit: c.unit })
      }
    })

    // Trier par % décroissant — les plus proches d'abord
    return result.sort((a, b) => b.pct - a.pct).slice(0, 3)
  }, [badges, tiles.size, totalDist, score, monuments, countries, streak])

  if (nearby.length === 0) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(255,165,0,0.6)', textTransform: 'uppercase', marginBottom: 8 }}>
        🎯 Badges proches
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {nearby.map(p => (
          <div key={p.badge.id} style={{ background: 'rgba(255,165,0,0.05)', border: '1px solid rgba(255,165,0,0.15)', borderRadius: 10, padding: '8px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{p.badge.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 'bold', color: '#fff' }}>{p.badge.name}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{p.badge.description}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: 'rgba(255,165,0,0.9)', fontFamily: 'monospace' }}>{p.pct.toFixed(0)}%</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                  {typeof p.current === 'number' && p.current < 10 ? p.current.toFixed(2) : Math.round(p.current as number)}/{p.target} {p.unit}
                </div>
              </div>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${p.pct}%`, height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, rgba(255,140,0,0.7), rgba(255,200,0,0.9))',
                boxShadow: '0 0 6px rgba(255,165,0,0.4)',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
