import { useState } from 'react'
import type { PersonalMarker } from '../types/game'

const ICONS = [
  '🏠','⭐','❤️','📍','🎯','☕','🍺','🍕','🍞','🏪',
  '🌳','🏋️','📸','🎨','🏖️','⛰️','🌸','💎','🚩','🔖',
  '🏛️','⛪','🕌','🕍','🏗️','🏟️','🎭','🎪','🛒','🏥',
  '🏫','🏦','🚉','✈️','🚀','🌊','🌋','🗻','🌲','🦁',
]

interface Props {
  lat: number
  lng: number
  existing?: PersonalMarker
  onSave: (m: PersonalMarker) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

export default function MarkerEditor({ lat, lng, existing, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(existing?.name || '')
  const [note, setNote] = useState(existing?.note || '')
  const [icon, setIcon] = useState(existing?.icon || '📍')

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      id: existing?.id || Date.now().toString(),
      name: name.trim(),
      note: note.trim() || undefined,
      icon, lat, lng,
      createdAt: existing?.createdAt || new Date().toISOString(),
    })
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(2,5,15,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 0 0 0',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'rgba(5,12,24,0.98)', border: '1px solid rgba(0,245,212,0.2)',
        borderRadius: '20px 20px 0 0', padding: '20px 20px 36px', width: '100%',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.8)',
        animation: 'toastIn 0.3s ease-out',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', color: 'rgba(0,245,212,0.6)', textTransform: 'uppercase' }}>
            {existing ? 'Modifier le lieu' : 'Nouveau lieu'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        {/* Icônes */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8, letterSpacing: '0.08em' }}>ICÔNE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
            {ICONS.map(i => (
              <button key={i} onClick={() => setIcon(i)} style={{
                fontSize: 20, background: icon === i ? 'rgba(0,245,212,0.15)' : 'rgba(255,255,255,0.04)',
                border: icon === i ? '1.5px solid rgba(0,245,212,0.5)' : '1.5px solid transparent',
                borderRadius: 8, padding: '6px 0', cursor: 'pointer', transition: 'all 0.15s',
              }}>{i}</button>
            ))}
          </div>
        </div>

        {/* Nom */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '0.08em' }}>NOM</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Ma boulangerie préférée"
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(0,245,212,0.2)', borderRadius: 10,
              color: '#fff', padding: '10px 14px', fontSize: 14,
              fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Note optionnelle */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '0.08em' }}>NOTE (optionnel)</div>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Détails, horaires..."
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
              color: '#fff', padding: '10px 14px', fontSize: 13,
              fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {existing && onDelete && (
            <button onClick={() => { onDelete(existing.id); onClose() }} style={{
              flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: 'rgba(239,68,68,0.8)', fontSize: 13, fontFamily: 'monospace',
            }}>🗑️ Supprimer</button>
          )}
          <button onClick={handleSave} disabled={!name.trim()} style={{
            flex: 2, padding: '12px', borderRadius: 10, cursor: name.trim() ? 'pointer' : 'default',
            background: name.trim() ? 'rgba(0,245,212,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${name.trim() ? 'rgba(0,245,212,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: name.trim() ? '#00f5d4' : 'rgba(255,255,255,0.3)',
            fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace',
          }}>✓ Enregistrer</button>
        </div>
      </div>
    </div>
  )
}
