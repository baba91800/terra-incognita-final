import { useState } from 'react'
import type { TerritoryData } from '../lib/territory'
import { computeCityPercent } from '../lib/territory'

interface Props {
  territory: TerritoryData
  totalTiles: number
}

export default function CityProgress({ territory, totalTiles }: Props) {
  const [expanded, setExpanded] = useState(false)

  const cityName = territory.city || 'Localisation...'
  const cityPct = territory.city ? computeCityPercent(territory.city, territory.cityAreaKm2) : 0
  const deptPct = Math.min(100, (totalTiles / 50000) * 100)
  const countryPct = Math.min(100, (totalTiles / 500000) * 100)
  const exploredKm2 = (totalTiles * 0.0001).toFixed(3)

  return (
    <div
      onClick={() => setExpanded(v => !v)}
      style={{
        position: 'absolute', bottom: 160, left: 12,
        zIndex: 600, cursor: 'pointer',
        background: 'rgba(5,12,24,0.92)',
        border: '1px solid rgba(0,245,212,0.2)',
        borderRadius: 12,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        minWidth: 150,
      }}
    >
      {/* Compact — toujours visible */}
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 16 }}>🏙️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cityName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#00f5d4', fontFamily: 'monospace' }}>
              {cityPct < 0.01 ? '<0.01%' : cityPct.toFixed(1) + '%'}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
              {exploredKm2} km²
            </div>
          </div>
          {/* Barre progression ville */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
            <div style={{
              width: `${Math.max(cityPct, 0.3)}%`, height: '100%', borderRadius: 2,
              background: 'linear-gradient(90deg, #00b4a0, #00f5d4)',
              boxShadow: '0 0 6px rgba(0,245,212,0.5)',
              transition: 'width 1s ease',
            }} />
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(0,245,212,0.4)', transition: 'transform 0.3s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▲
        </div>
      </div>

      {/* Étendu — dept + pays */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Département */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>🗺️</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{territory.department}</span>
              </div>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#3b82f6', flexShrink: 0 }}>{deptPct.toFixed(1)}%</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(deptPct, 0.1)}%`, height: '100%', background: '#3b82f6', borderRadius: 2 }} />
            </div>
          </div>

          {/* Pays */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>🌍</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{territory.country}</span>
              </div>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#a855f7', flexShrink: 0 }}>{countryPct.toFixed(2)}%</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(countryPct, 0.05)}%`, height: '100%', background: '#a855f7', borderRadius: 2 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
