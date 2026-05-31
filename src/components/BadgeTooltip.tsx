import { useState } from 'react'
import type { Badge } from '../types/game'

export default function BadgeTooltip({ badge }: { badge: Badge }) {
  const [show, setShow] = useState(false)

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setShow(v => !v)} style={{
        width: 44, height: 44, borderRadius: 10, cursor: 'pointer',
        background: badge.earned ? 'rgba(0,245,212,0.1)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${badge.earned ? 'rgba(0,245,212,0.3)' : 'rgba(255,255,255,0.06)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, opacity: badge.earned ? 1 : 0.2, transition: 'all 0.15s',
      }}>{badge.icon}</div>

      {show && (
        <div onClick={() => setShow(false)} style={{
          position: 'fixed', inset: 0, zIndex: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'rgba(5,12,24,0.98)',
            border: `1px solid ${badge.earned ? 'rgba(0,245,212,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 16, padding: '24px 28px', maxWidth: 280,
            textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            animation: 'toastIn 0.3s ease-out',
          }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{badge.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: badge.earned ? '#fff' : 'rgba(255,255,255,0.4)', marginBottom: 8, fontFamily: 'monospace' }}>{badge.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16, lineHeight: 1.7 }}>{badge.description}</div>
            {badge.earned
              ? <div style={{ fontSize: 11, color: 'rgba(0,245,212,0.7)', fontFamily: 'monospace' }}>✓ Obtenu le {new Date(badge.earnedAt!).toLocaleDateString()}</div>
              : <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>🔒 Non débloqué</div>
            }
          </div>
        </div>
      )}
    </div>
  )
}
