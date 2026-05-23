import { useState } from 'react'
import type { PersonalMarker } from '../types/game'

const ICONS = ['🏠','⭐','🌟','❤️','📍','🍕','🏪','🌳','🏋️','🎯','🔖','☕','🍺','📸','🎨','🏖️','⛰️','🌸','💎','🚩']

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
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'rgba(5,12,24,0.98)', border: '1px solid rgba(0,245,212,0.2)',
        borderRadius: 16, padding: 20, width: '100%', maxWidth: 340,
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        animation: 'toastIn 0.3s ease-out',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', color: 'rgba(0,245,212,0.6)', textTransform: 'uppercase' }}>
            {existing ? 'Modifier le marqueur' : 'Nouveau marqueur'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        {/* Icon picker */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Icône</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ICONS.map(i => (
              <button key={i} onClick={() => setIcon(i)} style={{
                width: 38, height: 38, borderRadius: 8, fontSize: 20,
                background: icon === i ? 'rgba(0,245,212,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${icon === i ? 'rgba(0,245,212,0.5)' : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{i}</button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Nom *</div>
          <input
            value={name} onChange={e => setName(e.target.value.slice(0, 40))}
            placeholder="Ex: Ma maison, Café sympa..."
            style={{
              width: '100%', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(0,245,212,0.2)', borderRadius: 8,
              padding: '9px 12px', color: '#fff', fontSize: 13,
              fontFamily: 'monospace', outline: 'none',
            }}
          />
        </div>

        {/* Note */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Note (optionnel)</div>
          <textarea
            value={note} onChange={e => setNote(e.target.value.slice(0, 200))}
            placeholder="Une note personnelle..."
            rows={2}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
              padding: '9px 12px', color: '#fff', fontSize: 12,
              fontFamily: 'monospace', outline: 'none', resize: 'none',
            }}
          />
        </div>

        {/* Coords */}
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace', marginBottom: 16 }}>
          📍 {lat.toFixed(5)}, {lng.toFixed(5)}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {existing && onDelete && (
            <button onClick={() => { onDelete(existing.id); onClose() }} style={{
              flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: 'rgba(239,68,68,0.8)', fontSize: 12,
            }}>🗑️ Supprimer</button>
          )}
          <button onClick={handleSave} disabled={!name.trim()} style={{
            flex: 2, padding: '10px', borderRadius: 8, cursor: name.trim() ? 'pointer' : 'not-allowed',
            background: name.trim() ? 'linear-gradient(135deg,#00b4a0,#00f5d4)' : 'rgba(255,255,255,0.05)',
            border: 'none', color: name.trim() ? '#030810' : 'rgba(255,255,255,0.2)',
            fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace',
            transition: 'all 0.2s',
          }}>✓ Enregistrer</button>
        </div>
      </div>
    </div>
  )
}
