import { estimateCityPercent, estimateDeptPercent, estimateCountryPercent } from '../lib/territory'
import type { TerritoryData } from '../lib/territory'

interface Props {
  territory: TerritoryData
  totalTiles: number
}

export default function TerritoryBar({ territory, totalTiles }: Props) {
  if (!territory.city && !territory.department && !territory.country) return null

  const cityPct = estimateCityPercent(totalTiles, territory.cityAreaKm2)
  const deptPct = estimateDeptPercent(totalTiles, territory.deptAreaKm2)
  const countryPct = estimateCountryPercent(totalTiles, territory.countryAreaKm2)

  const rows = [
    { label: territory.city,       pct: cityPct,    icon: '🏙️', color: '#00f5d4' },
    { label: territory.department, pct: deptPct,    icon: '🗺️', color: '#3b82f6' },
    { label: territory.country,    pct: countryPct, icon: '🌍', color: '#a855f7' },
  ].filter(r => r.label)

  return (
    <div style={{
      position: 'absolute', bottom: 160, left: 12,
      zIndex: 600, pointerEvents: 'none', width: 160,
    }}>
      <div style={{
        background: 'rgba(5,12,24,0.88)',
        border: '1px solid rgba(0,245,212,0.12)',
        borderRadius: 10, padding: '8px 10px',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontSize: 8, letterSpacing: '0.15em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Exploration</div>
        {rows.map(r => (
          <div key={r.label as string} style={{ marginBottom: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10 }}>{r.icon}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 85 }}>{r.label}</span>
              </div>
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: r.color, flexShrink: 0 }}>{r.pct.toFixed(2)}%</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100,r.pct)}%`, height: '100%', borderRadius: 2, background: r.color, opacity: 0.8, transition: 'width 1s ease', boxShadow: `0 0 4px ${r.color}` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
