import { computeExplorationPercent, estimateDeptPercent, estimateCountryPercent, computeCityPercent } from '../lib/territory'
import type { TerritoryData } from '../lib/territory'
import type { Translations } from '../lib/i18n'

interface Props {
  territory: TerritoryData
  totalTiles: number
  t: Translations
}

export default function TerritoryBar({ territory, totalTiles, t }: Props) {
  if (!territory.city && !territory.department && !territory.country) return null

  const cityPct = territory.city ? computeCityPercent(territory.city, territory.cityAreaKm2) : computeExplorationPercent(totalTiles, territory.cityAreaKm2)
  const deptPct = estimateDeptPercent(totalTiles)
  const countryPct = estimateCountryPercent(totalTiles)

  const rows = [
    { icon: '🏙️', name: territory.city,       pct: cityPct,    color: '#00f5d4' },
    { icon: '🗺️', name: territory.department, pct: deptPct,    color: '#3b82f6' },
    { icon: '🌍', name: territory.country,    pct: countryPct, color: '#a855f7' },
  ].filter(r => r.name)

  return (
    <div style={{
      position: 'absolute', bottom: 160, left: 12,
      zIndex: 600, pointerEvents: 'none', width: 170,
    }}>
      <div style={{
        background: 'rgba(5,12,24,0.88)',
        border: '1px solid rgba(0,245,212,0.12)',
        borderRadius: 10, padding: '8px 10px',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontSize: 8, letterSpacing: '0.15em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>
          {t.exploration}
        </div>
        {rows.map(r => (
          <div key={r.name} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10 }}>{r.icon}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{r.name}</span>
              </div>
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: r.color, flexShrink: 0 }}>
                {r.pct > 0.01 ? r.pct.toFixed(1) + '%' : r.pct > 0 ? '<0.1%' : '0%'}
              </span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.max(r.pct, 0.3)}%`, height: '100%', borderRadius: 2,
                background: r.color, opacity: 0.8,
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
