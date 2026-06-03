import type { Monument } from '../types/game'
import { RARITY_COLORS, RARITY_LABELS } from '../lib/constants'
import { CATEGORY_COLORS } from '../lib/overpass'

interface Props {
  monuments: Monument[]
}

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  volcano:    { label: 'Volcans',      icon: '🌋' },
  glacier:    { label: 'Glaciers',     icon: '🧊' },
  peak:       { label: 'Sommets',      icon: '⛰️' },
  cave:       { label: 'Grottes',      icon: '🕳️' },
  waterfall:  { label: 'Cascades',     icon: '💧' },
  hot_spring: { label: 'Sources',      icon: '♨️' },
  park:       { label: 'Parcs',        icon: '🌲' },
  reserve:    { label: 'Réserves',     icon: '🌿' },
  palace:     { label: 'Palais',       icon: '🏯' },
  heritage:   { label: 'UNESCO',       icon: '🏛️' },
  castle:     { label: 'Châteaux',     icon: '🏰' },
  fort:       { label: 'Forteresses',  icon: '🏰' },
  ruins:      { label: 'Ruines',       icon: '🏚️' },
  monument:   { label: 'Monuments',    icon: '🗿' },
  memorial:   { label: 'Mémoriaux',    icon: '🪦' },
  megalith:   { label: 'Mégalithes',   icon: '🗿' },
  museum:     { label: 'Musées',       icon: '🏛️' },
  cathedral:  { label: 'Cathédrales',  icon: '⛪' },
  lighthouse: { label: 'Phares',       icon: '🗼' },
  windmill:   { label: 'Moulins',      icon: '🌀' },
  tower:      { label: 'Tours',        icon: '🗼' },
  viewpoint:  { label: 'Belvédères',   icon: '👁️' },
  artwork:    { label: 'Œuvres',       icon: '🎨' },
  fountain:   { label: 'Fontaines',    icon: '⛲' },
  garden:     { label: 'Jardins',      icon: '🌷' },
  mine:       { label: 'Mines',        icon: '⛏️' },
  cliff:      { label: 'Falaises',     icon: '🪨' },
  arch:       { label: 'Arches',       icon: '🌉' },
  spring:     { label: 'Sources',      icon: '💦' },
  tree:       { label: 'Arbres',       icon: '🌳' },
  theatre:    { label: 'Théâtres',     icon: '🎭' },
  cemetery:   { label: 'Cimetières',   icon: '⚰️' },
}

export default function MonumentStats({ monuments }: Props) {
  const discovered = monuments.filter(m => m.discovered)

  if (discovered.length === 0) {
    return (
      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center', padding: '20px 0' }}>
        Aucun monument découvert
      </div>
    )
  }

  // Grouper par type
  const byType = new Map<string, Monument[]>()
  discovered.forEach(m => {
    if (!byType.has(m.type)) byType.set(m.type, [])
    byType.get(m.type)!.push(m)
  })

  // Grouper par rareté
  const byRarity = {
    legendary: discovered.filter(m => m.rarity === 'legendary'),
    epic:      discovered.filter(m => m.rarity === 'epic'),
    rare:      discovered.filter(m => m.rarity === 'rare'),
    common:    discovered.filter(m => m.rarity === 'common'),
  }

  const sorted = [...byType.entries()].sort((a, b) => b[1].length - a[1].length)

  return (
    <div>
      {/* Par rareté */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
        {(['legendary', 'epic', 'rare', 'common'] as const).map(r => (
          <div key={r} style={{
            background: `${RARITY_COLORS[r]}12`,
            border: `1px solid ${RARITY_COLORS[r]}30`,
            borderRadius: 8, padding: '7px 6px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: RARITY_COLORS[r], fontFamily: 'monospace' }}>
              {byRarity[r].length}
            </div>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
              {RARITY_LABELS[r]}
            </div>
          </div>
        ))}
      </div>

      {/* Par type */}
      <div style={{ fontSize: 9, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginBottom: 8 }}>
        Par catégorie
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {sorted.map(([type, items]) => {
          const info = TYPE_LABELS[type] || { label: type, icon: '📍' }
          const color = CATEGORY_COLORS[type] || '#9ca3af'
          const maxCount = sorted[0][1].length
          const pct = (items.length / maxCount) * 100
          return (
            <div key={type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 13 }}>{info.icon}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{info.label}</span>
                </div>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color, fontWeight: 'bold' }}>{items.length}</span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 2,
                  background: color, opacity: 0.7,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
