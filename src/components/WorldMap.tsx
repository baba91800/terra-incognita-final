import { useEffect, useRef } from 'react'
import type { CountryDiscovery } from '../types/game'

interface Props {
  countries: CountryDiscovery[]
  playerLat: number
  playerLng: number
  onClose?: () => void
}

export default function WorldMap({ countries, playerLat, playerLng, onClose }: Props) {
  const svgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const visitedCodes = new Set(countries.map(c => c.code))
    const container = svgRef.current

    // Charger D3 + topojson dynamiquement
    Promise.all([
      import('https://cdn.jsdelivr.net/npm/d3@7/+esm' as any),
      import('https://cdn.jsdelivr.net/npm/topojson-client@3/+esm' as any),
    ]).then(async ([d3Module, topoModule]) => {
      const d3 = d3Module
      const topojson = topoModule

      const world = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json())

      const width = container.clientWidth || 360
      const height = width * 0.5

      container.innerHTML = ''
      const svg = d3.select(container).append('svg')
        .attr('width', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('background', 'transparent')

      const projection = d3.geoNaturalEarth1()
        .scale(width / 6.5)
        .translate([width / 2, height / 2])

      const path = d3.geoPath(projection)
      const countries_feat = topojson.feature(world, world.objects.countries)

      // Fond océan
      svg.append('rect')
        .attr('width', width).attr('height', height)
        .attr('fill', 'rgba(0,30,60,0.5)')
        .attr('rx', 8)

      // Pays
      svg.selectAll('path.country')
        .data(countries_feat.features)
        .join('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', (d: any) => visitedCodes.has(String(d.id)) ? '#00f5d4' : 'rgba(255,255,255,0.08)')
        .attr('stroke', 'rgba(0,0,0,0.3)')
        .attr('stroke-width', 0.4)

      // Position joueur
      try {
        const [px, py] = projection([playerLng, playerLat]) as [number, number]
        if (px && py) {
          svg.append('circle')
            .attr('cx', px).attr('cy', py).attr('r', 4)
            .attr('fill', '#f59e0b')
            .attr('stroke', '#000')
            .attr('stroke-width', 1)
        }
      } catch {}
    }).catch(() => {})
  }, [countries, playerLat, playerLng])

  const pct = ((countries.length / 195) * 100).toFixed(2)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(2,5,15,0.97)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(0,245,212,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>Carte du monde</div>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#00f5d4', fontFamily: 'monospace' }}>{countries.length} <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>/ 195 pays</span></div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{pct}% du monde exploré</div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        )}
      </div>

      {/* Carte */}
      <div ref={svgRef} style={{ flex: 1, margin: '0 12px', borderRadius: 12, overflow: 'hidden', background: 'rgba(0,20,40,0.5)' }} />

      {/* Légende + pays visités */}
      <div style={{ padding: '12px 20px 24px' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: '#00f5d4' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Visité</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Non visité</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Position</span>
          </div>
        </div>

        {/* Drapeaux pays visités */}
        {countries.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {countries.map(c => (
              <div key={c.code} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 24 }}>{c.flag}</span>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', maxWidth: 40, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
