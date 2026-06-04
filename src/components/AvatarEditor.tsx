import { useState, useRef } from 'react'

const AVATARS = [
  { icon: '🧭', label: 'Explorateur' }, { icon: '🏔️', label: 'Montagne' },
  { icon: '🌋', label: 'Volcan' },      { icon: '🏝️', label: 'Île' },
  { icon: '🌍', label: 'Monde' },       { icon: '🚀', label: 'Aventure' },
  { icon: '🦅', label: 'Aigle' },       { icon: '🐺', label: 'Loup' },
  { icon: '🦁', label: 'Lion' },        { icon: '🐉', label: 'Dragon' },
  { icon: '⚔️', label: 'Guerrier' },   { icon: '🔭', label: 'Curieux' },
  { icon: '🌠', label: 'Étoile' },      { icon: '🗺️', label: 'Carte' },
  { icon: '💎', label: 'Diamant' },     { icon: '🏄', label: 'Surfeur' },
  { icon: '🦊', label: 'Renard' },      { icon: '🐬', label: 'Dauphin' },
  { icon: '🦋', label: 'Papillon' },    { icon: '🌊', label: 'Vague' },
]

const AVATAR_KEY = 'ti2_avatar'
const AVATAR_PHOTO_KEY = 'ti2_avatar_photo'

interface Props {
  onClose: () => void
  onAvatarChange: (avatar: string, photoUrl?: string) => void
  currentAvatar: string
  currentPhoto?: string
}

export default function AvatarEditor({ onClose, onAvatarChange, currentAvatar, currentPhoto }: Props) {
  const [selected, setSelected] = useState(currentAvatar)
  const [photo, setPhoto] = useState<string | undefined>(currentPhoto)
  const [mode, setMode] = useState<'emoji' | 'photo'>(currentPhoto ? 'photo' : 'emoji')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      // Redimensionner en canvas 200x200 avant de stocker en base64
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 200; canvas.height = 200
        const ctx = canvas.getContext('2d')!
        // Crop carré centré
        const size = Math.min(img.width, img.height)
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200)
        const compressed = canvas.toDataURL('image/jpeg', 0.7)
        setPhoto(compressed)
        setMode('photo')
      }
      img.src = result
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSave = () => {
    if (mode === 'photo' && photo) {
      localStorage.setItem(AVATAR_PHOTO_KEY, photo)
      localStorage.setItem(AVATAR_KEY, selected)
      onAvatarChange(selected, photo)
    } else {
      localStorage.removeItem(AVATAR_PHOTO_KEY)
      localStorage.setItem(AVATAR_KEY, selected)
      onAvatarChange(selected, undefined)
    }
    onClose()
  }

  const removePhoto = () => {
    setPhoto(undefined)
    setMode('emoji')
    localStorage.removeItem(AVATAR_PHOTO_KEY)
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 950, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      />

      {/* Volet déroulant depuis le bas */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 960,
        background: 'rgba(5,12,24,0.99)',
        border: '1px solid rgba(0,245,212,0.15)',
        borderRadius: '20px 20px 0 0',
        padding: '0 0 32px 0',
        maxHeight: '85vh',
        overflowY: 'auto',
        animation: 'slideUp 0.35s cubic-bezier(0.175,0.885,0.32,1.1)',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.8)',
      }}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(0,245,212,0.6)', textTransform: 'uppercase' }}>Choisir un avatar</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        {/* Preview actuel */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            border: '2.5px solid rgba(0,245,212,0.4)',
            boxShadow: '0 0 30px rgba(0,245,212,0.25)',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,245,212,0.08)',
            marginBottom: 8,
          }}>
            {mode === 'photo' && photo ? (
              <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" />
            ) : (
              <span style={{ fontSize: 44 }}>{selected}</span>
            )}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {mode === 'photo' ? 'Photo personnelle' : 'Emoji'}
          </div>
        </div>

        {/* Tabs mode */}
        <div style={{ display: 'flex', gap: 8, padding: '0 20px', marginBottom: 18 }}>
          {(['emoji', 'photo'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
              background: mode === m ? 'rgba(0,245,212,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${mode === m ? 'rgba(0,245,212,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: mode === m ? '#00f5d4' : 'rgba(255,255,255,0.4)',
              fontFamily: 'monospace', transition: 'all 0.2s',
            }}>
              {m === 'emoji' ? '😀 Emoji' : '📷 Photo'}
            </button>
          ))}
        </div>

        {/* Contenu selon mode */}
        {mode === 'emoji' && (
          <div style={{ padding: '0 20px' }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Sélectionne ton avatar
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {AVATARS.map(a => (
                <button
                  key={a.icon}
                  onClick={() => { setSelected(a.icon); setMode('emoji') }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
                    background: selected === a.icon && mode === 'emoji' ? 'rgba(0,245,212,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${selected === a.icon && mode === 'emoji' ? 'rgba(0,245,212,0.6)' : 'rgba(255,255,255,0.07)'}`,
                    transition: 'all 0.15s',
                    boxShadow: selected === a.icon && mode === 'emoji' ? '0 0 12px rgba(0,245,212,0.2)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 26 }}>{a.icon}</span>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)' }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'photo' && (
          <div style={{ padding: '0 20px' }}>
            {/* Zone de drop */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? 'rgba(0,245,212,0.8)' : 'rgba(0,245,212,0.2)'}`,
                borderRadius: 12, padding: '28px 20px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.2s', marginBottom: 16,
                background: dragging ? 'rgba(0,245,212,0.05)' : 'rgba(255,255,255,0.02)',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                {photo ? 'Changer la photo' : 'Ajouter une photo'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                Appuie ou glisse une image ici
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>

            {photo && (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <img src={photo} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(0,245,212,0.3)' }} alt="preview" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Photo chargée ✓</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>Stockée localement (JPEG 200×200)</div>
                  </div>
                </div>
                <button onClick={removePhoto} style={{
                  width: '100%', padding: '8px', borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  color: 'rgba(239,68,68,0.6)', fontSize: 11, fontFamily: 'monospace',
                  marginBottom: 4,
                }}>
                  🗑️ Supprimer la photo
                </button>
              </>
            )}
          </div>
        )}

        {/* Bouton sauvegarder */}
        <div style={{ padding: '20px 20px 0' }}>
          <button onClick={handleSave} style={{
            width: '100%', padding: '14px', borderRadius: 12, cursor: 'pointer',
            background: 'linear-gradient(135deg,#00b4a0,#00f5d4)',
            border: 'none', color: '#030810', fontSize: 14, fontWeight: 'bold',
            fontFamily: 'monospace', letterSpacing: '0.04em',
            boxShadow: '0 0 20px rgba(0,245,212,0.3)',
          }}>
            ✓ Enregistrer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  )
}

// Helper pour charger la photo sauvegardée
export function loadAvatarPhoto(): string | undefined {
  try { return localStorage.getItem(AVATAR_PHOTO_KEY) || undefined } catch { return undefined }
}
