import { useState } from 'react'
import type { Monument } from '../types/game'
import { RARITY_COLORS } from '../lib/constants'

const RARITY_LABELS: Record<string, string> = {
  legendary: 'Légendaire',
  epic: 'Épique',
  rare: 'Rare',
  common: 'Commun',
}
import { CATEGORY_COLORS } from '../lib/overpass'

interface Props {
  monuments: Monument[]
  onLocate?: (m: Monument) => void
}

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  volcano:    { label: 'Volcans',           icon: '🌋' },
  glacier:    { label: 'Glaciers',          icon: '🧊' },
  peak:       { label: 'Sommets',           icon: '⛰️' },
  cave:       { label: 'Grottes',           icon: '🕳️' },
  waterfall:  { label: 'Cascades',          icon: '💧' },
  hot_spring: { label: 'Sources chaudes',   icon: '♨️' },
  park:       { label: 'Parcs nationaux',   icon: '🌲' },
  reserve:    { label: 'Réserves',          icon: '🌿' },
  palace:     { label: 'Palais',            icon: '🏯' },
  heritage:   { label: 'Patrimoine',        icon: '🏛️' },
  castle:     { label: 'Châteaux',          icon: '🏰' },
  fort:       { label: 'Forteresses',       icon: '🏰' },
  ruins:      { label: 'Ruines',            icon: '🏚️' },
  monument:   { label: 'Monuments',         icon: '🗿' },
  memorial:   { label: 'Mémoriaux',         icon: '🪦' },
  megalith:   { label: 'Mégalithes',        icon: '🗿' },
  museum:     { label: 'Musées',            icon: '🏛️' },
  cathedral:  { label: 'Cathédrales',       icon: '⛪' },
  church:     { label: 'Églises',           icon: '⛪' },
  chapel:     { label: 'Chapelles',         icon: '⛪' },
  lighthouse: { label: 'Phares',            icon: '🗼' },
  windmill:   { label: 'Moulins à vent',    icon: '🌀' },
  watermill:  { label: 'Moulins à eau',     icon: '⚙️' },
  tower:      { label: 'Tours',             icon: '🗼' },
  obelisk:    { label: 'Obélisques',        icon: '🗿' },
  viewpoint:  { label: 'Belvédères',        icon: '👁️' },
  artwork:    { label: 'Œuvres d\'art',     icon: '🎨' },
  fountain:   { label: 'Fontaines',         icon: '⛲' },
  garden:     { label: 'Jardins',           icon: '🌷' },
  mine:       { label: 'Mines',             icon: '⛏️' },
  cliff:      { label: 'Falaises',          icon: '🪨' },
  arch:       { label: 'Arches',            icon: '🌉' },
  spring:     { label: 'Sources',           icon: '💦' },
  tree:       { label: 'Arbres remarquables', icon: '🌳' },
  theatre:    { label: 'Théâtres',          icon: '🎭' },
  cemetery:   { label: 'Cimetières',        icon: '⚰️' },
  bunker:     { label: 'Bunkers',           icon: '🪖' },
  battlefield:{ label: 'Champs de bataille',icon: '⚔️' },
  trench:     { label: 'Tranchées',         icon: '🪖' },
  dovecote:   { label: 'Pigeonniers',       icon: '🕊️' },
  lavoir:     { label: 'Lavoirs',           icon: '🪣' },
  well:       { label: 'Puits anciens',     icon: '🪣' },
  cross:      { label: 'Croix de chemin',   icon: '✝️' },
  shrine:     { label: 'Oratoires',         icon: '⛩️' },
  milestone:  { label: 'Bornes historiques',icon: '🪨' },
  roman_road: { label: 'Voies romaines',    icon: '🛣️' },
  rock:       { label: 'Rochers',           icon: '🪨' },
}

export default function MonumentStats({ monuments, onLocate }: Props) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedMonument, setSelectedMonument] = useState<Monument | null>(null)

  const discovered = monuments.filter(m => m.discovered)

  if (discovered.length === 0) {
    return (
      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center', padding: '20px 0' }}>
        Aucun monument découvert
      </div>
    )
  }

  const byType = new Map<string, Monument[]>()
  discovered.forEach(m => {
    if (!byType.has(m.type)) byType.set(m.type, [])
    byType.get(m.type)!.push(m)
  })

  const byRarity = {
    legendary: discovered.filter(m => m.rarity === 'legendary'),
    epic:      discovered.filter(m => m.rarity === 'epic'),
    rare:      discovered.filter(m => m.rarity === 'rare'),
    common:    discovered.filter(m => m.rarity === 'common'),
  }

  const sorted = [...byType.entries()].sort((a, b) => b[1].length - a[1].length)

  // Vue détail d'un monument
  if (selectedMonument) {
    const color = RARITY_COLORS[selectedMonument.rarity]
    return (
      <div>
        <button onClick={() => setSelectedMonument(null)} style={{ background: 'none', border: 'none', color: 'rgba(0,245,212,0.7)', cursor: 'pointer', fontSize: 12, marginBottom: 16, fontFamily: 'monospace', padding: 0 }}>← Retour</button>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{selectedMonument.icon || '📍'}</div>
          <div style={{ fontSize: 9, color, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>{selectedMonument.rarity}</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>{selectedMonument.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{TYPE_LABELS[selectedMonument.type]?.label || selectedMonument.type}</div>
        </div>
        {selectedMonument.discoveredAt && (
          <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
            Découvert le {new Date(selectedMonument.discoveredAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
        <button onClick={() => { onLocate?.(selectedMonument); setSelectedMonument(null) }} style={{
            width: '100%', padding: '12px', borderRadius: 10, cursor: 'pointer',
            background: 'rgba(0,245,212,0.1)', border: '1px solid rgba(0,245,212,0.3)',
            color: '#00f5d4', fontSize: 13, fontFamily: 'monospace', fontWeight: 'bold',
          }}>📍 Voir sur la carte</button>
      </div>
    )
  }

  // Vue liste d'une catégorie
  if (selectedType) {
    const items = byType.get(selectedType) || []
    const info = TYPE_LABELS[selectedType] || { label: selectedType, icon: '📍' }
    return (
      <div>
        <button onClick={() => setSelectedType(null)} style={{ background: 'none', border: 'none', color: 'rgba(0,245,212,0.7)', cursor: 'pointer', fontSize: 12, marginBottom: 16, fontFamily: 'monospace', padding: 0 }}>← Retour</button>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 12 }}>
          {info.icon} {info.label} — {items.length}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(m => {
            const color = RARITY_COLORS[m.rarity]
            return (
              <div key={m.id} onClick={() => setSelectedMonument(m)} style={{
                background: `${color}08`, border: `1px solid ${color}25`,
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{m.icon || '📍'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                  <div style={{ fontSize: 9, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{m.rarity}</div>
                  {m.discoveredAt && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{new Date(m.discoveredAt).toLocaleDateString('fr-FR')}</div>}
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>›</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Vue principale
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

      {/* Par catégorie */}
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
            <div key={type} onClick={() => setSelectedType(type)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 13 }}>{info.icon}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{info.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color, fontWeight: 'bold' }}>{items.length}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>›</span>
                </div>
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
