import { computeExplorationPercent, estimateDeptPercent, estimateCountryPercent } from '../lib/territory'
import type { TerritoryData } from '../lib/territory'

interface Props {
  territory: TerritoryData
  totalTiles: number
}

export default function TerritoryBar({ territory, totalTiles }: Props) {
  if (!territory.city && !territory.department && !territory.country) return null

  // % ville — basé sur la vraie surface OSM si disponible
  const cityPct = computeExplorationPercent(totalTiles, territory.cityAreaKm2)
  const deptPct = estimateDeptPercent(totalTiles)
  const countryPct = estimateCountryPercent(totalTiles)

  // Afficher la surface explorée en m²
  const exploredM2 = totalTiles * 100

  const rows = [
    {
      label: territory.city,
      pct: cityPct,
      icon: '🏙️',
      color: '#00f5d4',
      // Afficher km² de la ville si connu
      extra: territory.cityAreaKm2 ? `${territory.cityAreaKm2.toFixed(1)} km²` : null,
    },
    { label: territory.department, pct: deptPct, icon: '🗺️', color: '#3b82f6', extra: null },
    { label: territory.country,    pct: countryPct, icon: '🌍', color: '#a855f7', extra: null },
  ].filter(r => r.label)

  return (
    <div style={{
      position: 'absolute', bottom: 160, left: 12,
      zIndex: 600, pointerEvents: 'none',
      width: 170,
    }}>
      <div style={{
        background: 'rgba(5,12,24,0.88)',
        border: '1px solid rgba(0,245,212,0.12)',
        borderRadius: 10, padding: '8px 10px',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontSize: 8, letterSpacing: '0.15em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>
          Exploration
        </div>
        {rows.map(r => (
          <div key={r.label} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10 }}>{r.icon}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 85 }}>{r.label}</span>
              </div>
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: r.color, flexShrink: 0 }}>
                {r.pct > 0 ? r.pct.toFixed(2) + '%' : `${(exploredM2/1000).toFixed(0)}k m²`}
              </span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.max(r.pct, 0.5)}%`, height: '100%', borderRadius: 2,
                background: r.color, opacity: 0.8,
                transition: 'width 1s ease',
                boxShadow: `0 0 4px ${r.color}`,
              }} />
            </div>
            {r.extra && (
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', marginTop: 1, fontFamily: 'monospace' }}>
                sur {r.extra}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
