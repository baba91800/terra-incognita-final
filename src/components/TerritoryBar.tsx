import { useState } from 'react'
import { computeExplorationPercent, computeDeptPercent, computeCountryPercent, computeCityPercent } from '../lib/territory'
import type { TerritoryData } from '../lib/territory'
import type { Translations } from '../lib/i18n'

interface Props {
  territory: TerritoryData
  totalTiles: number
  t: Translations
  isNavigating?: boolean
}

export default function TerritoryBar({ territory, totalTiles, t, isNavigating }: Props) {
  const [visible, setVisible] = useState(false)

  if (!territory.city && !territory.department && !territory.country) return null

  const cityPct = territory.city ? computeCityPercent(territory.city, territory.cityAreaKm2) : computeExplorationPercent(totalTiles, territory.cityAreaKm2)
  const deptPct = territory.department ? computeDeptPercent(totalTiles, territory.department) : 0
  const countryPct = territory.country ? computeCountryPercent(totalTiles, territory.country) : 0

  const rows = [
    { icon: '🏙️', name: territory.city,       pct: cityPct,    color: '#00f5d4' },
    { icon: '🗺️', name: territory.department, pct: deptPct,    color: '#3b82f6' },
    { icon: '🌍', name: territory.country,    pct: countryPct, color: '#a855f7' },
  ].filter(r => r.name)

  const opacity = isNavigating && !visible ? 0.25 : 1

  return (
    <div
      onClick={() => { if (isNavigating) { setVisible(true); setTimeout(() => setVisible(false), 3000) } }}
      style={{
        position: 'absolute', bottom: 90, left: 12,
        zIndex: 600, width: 200,
        pointerEvents: isNavigating ? 'auto' : 'none',
        opacity, transition: 'opacity 0.3s ease',
        cursor: isNavigating ? 'pointer' : 'default',
      }}
    >
      <div style={{
        background: 'rgba(5,12,24,0.88)',
        border: '1px solid rgba(0,245,212,0.12)',
        borderRadius: 10, padding: '6px 8px',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>
          {t.exploration}
        </div>
        {rows.map(r => (
          <div key={r.name} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 12 }}>{r.icon}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{r.name}</span>
              </div>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: r.color, flexShrink: 0, fontWeight: 'bold' }}>
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
