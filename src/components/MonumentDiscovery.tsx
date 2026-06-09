import { useEffect, useState } from 'react'
import type { Monument } from '../types/game'
import { RARITY_COLORS } from '../lib/constants'
import type { Translations } from '../lib/i18n'

interface Props {
  monument: Monument
  points: number
  t: Translations
  onClose: () => void
}

const RARITY_LABELS: Record<string, string> = {
  common: 'COMMUN', rare: 'RARE', epic: 'ÉPIQUE', legendary: 'LÉGENDAIRE'
}

const RARITY_EMOJIS: Record<string, string> = {
  common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟡'
}

export default function MonumentDiscovery({ monument, points, t, onClose }: Props) {
  const [phase, setPhase] = useState<'enter'|'show'|'exit'>('enter')
  const color = RARITY_COLORS[monument.rarity]

  useEffect(() => {
    // Séquence d'animation
    setTimeout(() => setPhase('show'), 100)
    // Fermeture automatique après 4s pour les communs, 6s pour les autres
    const delay = monument.rarity === 'legendary' ? 7000 : monument.rarity === 'epic' ? 6000 : monument.rarity === 'rare' ? 5000 : 4000
    const timer = setTimeout(() => {
      setPhase('exit')
      setTimeout(onClose, 500)
    }, delay)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setPhase('exit')
    setTimeout(onClose, 400)
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 850,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        background: phase === 'show'
          ? `radial-gradient(ellipse at center, ${color}20 0%, rgba(2,5,15,0.92) 70%)`
          : 'rgba(2,5,15,0)',
        backdropFilter: phase === 'show' ? 'blur(8px)' : 'none',
        transition: 'all 0.5s ease',
        opacity: phase === 'exit' ? 0 : 1,
      }}
    >
      {/* Particules / étoiles en fond pour legendary */}
      {monument.rarity === 'legendary' && phase === 'show' && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 6px ${color}`,
              animation: `float ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }} />
          ))}
        </div>
      )}

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(5,12,24,0.97)',
          border: `1px solid ${color}50`,
          borderRadius: 24,
          padding: 32,
          maxWidth: 320, width: '100%',
          textAlign: 'center',
          boxShadow: `0 0 60px ${color}30, 0 20px 60px rgba(0,0,0,0.8)`,
          transform: phase === 'enter' ? 'scale(0.8) translateY(40px)' : phase === 'exit' ? 'scale(0.9) translateY(-20px)' : 'scale(1) translateY(0)',
          transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          position: 'relative',
        }}
      >
        {/* Badge découverte */}
        <div style={{
          position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
          background: color, borderRadius: 20, padding: '4px 16px',
          fontSize: 10, fontWeight: 'bold', color: '#030810',
          fontFamily: 'monospace', letterSpacing: '0.15em',
          boxShadow: `0 0 20px ${color}80`,
        }}>
          ✦ DÉCOUVERTE ✦
        </div>

        {/* Icône monument */}
        <div style={{
          fontSize: monument.rarity === 'legendary' ? 80 : monument.rarity === 'epic' ? 70 : 60,
          marginBottom: 16, marginTop: 8,
          filter: `drop-shadow(0 0 20px ${color}80)`,
          animation: 'float 2s ease-in-out infinite',
        }}>
          {monument.icon || '📍'}
        </div>

        {/* Rareté */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: `${color}15`, border: `1px solid ${color}40`,
          borderRadius: 20, padding: '4px 14px', marginBottom: 12,
        }}>
          <span style={{ fontSize: 12 }}>{RARITY_EMOJIS[monument.rarity]}</span>
          <span style={{ fontSize: 10, fontFamily: 'monospace', color, letterSpacing: '0.15em' }}>
            {RARITY_LABELS[monument.rarity]}
          </span>
        </div>

        {/* Nom */}
        <div style={{
          fontSize: monument.name.length > 20 ? 18 : 22,
          fontWeight: 'bold', color: '#fff',
          fontFamily: 'monospace', marginBottom: 8,
          lineHeight: 1.3,
          textShadow: `0 0 20px ${color}60`,
        }}>
          {monument.name}
        </div>

        {/* Type */}
        <div style={{
          fontSize: 12, color: 'rgba(255,255,255,0.4)',
          marginBottom: 20, textTransform: 'capitalize',
        }}>
          {monument.type?.replace(/_/g, ' ')}
        </div>

        {/* Points */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 16,
          marginBottom: 24,
        }}>
          <div style={{
            background: `${color}15`, border: `1px solid ${color}30`,
            borderRadius: 12, padding: '10px 20px',
          }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color, fontFamily: 'monospace' }}>
              +{points}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              XP
            </div>
          </div>
          {monument.discoveredAt && (
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '10px 20px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
                {new Date(monument.discoveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {new Date(monument.discoveredAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Barre de progression rareté */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            {(['common','rare','epic','legendary'] as const).map(r => (
              <div key={r} style={{
                width: '22%', height: 4, borderRadius: 2,
                background: r === monument.rarity ? color : 'rgba(255,255,255,0.08)',
                boxShadow: r === monument.rarity ? `0 0 8px ${color}` : 'none',
              }} />
            ))}
          </div>
        </div>

        {/* Bouton fermer */}
        <button
          onClick={handleClose}
          style={{
            background: `linear-gradient(135deg, ${color}30, ${color}15)`,
            border: `1px solid ${color}40`,
            borderRadius: 12, padding: '10px 28px',
            color, cursor: 'pointer', fontSize: 13,
            fontFamily: 'monospace', letterSpacing: '0.08em',
            transition: 'all 0.2s',
          }}
        >
          {t.closeBtn} ✕
        </button>
      </div>
    </div>
  )
}
