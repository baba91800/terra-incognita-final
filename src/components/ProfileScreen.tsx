import { useState, useEffect } from 'react'
import type { Badge, Monument, CountryDiscovery } from '../types/game'
import { RARITY_COLORS, LEVEL_TITLES } from '../lib/constants'
import { computeZones, getZoneStats } from '../lib/zones'
import type { Translations } from '../lib/i18n'

interface Props {
  onClose: () => void
  score: number; xp: number; level: number; levelTitle: string
  totalTiles: number; totalDist: number
  badges: Badge[]; monuments: Monument[]; countries: CountryDiscovery[]
  tiles: Set<string>; playerLat: number; playerLng: number
  t: Translations
}

const AVATAR_KEY = 'ti2_avatar'
const PSEUDO_KEY = 'ti2_pseudo'

const AVATARS = ['🧭','🗺️','🏔️','🌋','⛰️','🏝️','🌍','🚀','🦅','🐺','🦁','🐉','⚔️','🔭','🌠']

export default function ProfileScreen({ onClose, score, xp, level, levelTitle, totalTiles, totalDist, badges, monuments, countries, tiles, playerLat, playerLng, t }: Props) {
  const [pseudo, setPseudo] = useState(() => localStorage.getItem(PSEUDO_KEY) || 'Explorer')
  const [avatar, setAvatar] = useState(() => localStorage.getItem(AVATAR_KEY) || '🧭')
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<'profile'|'zones'>('profile')

  const zones = computeZones(tiles, playerLat, playerLng)
  const zoneStats = getZoneStats(zones)
  const earnedBadges = badges.filter(b => b.earned)
  const discMonuments = monuments.filter(m => m.discovered)

  const savePseudo = (v: string) => {
    const clean = v.slice(0, 20)
    setPseudo(clean)
    localStorage.setItem(PSEUDO_KEY, clean)
  }
  const saveAvatar = (a: string) => {
    setAvatar(a)
    localStorage.setItem(AVATAR_KEY, a)
  }

  const xpForLevel = (l: number) => Math.floor(300 * Math.pow(1.55, l - 1))
  const nextTitle = LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 800,
      background: 'rgba(2,5,15,0.97)',
      backdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column',
      animation: 'toastIn 0.3s ease-out',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px 0',
        borderBottom: '1px solid rgba(0,245,212,0.1)',
        paddingBottom: 12,
      }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(0,245,212,0.6)', textTransform: 'uppercase' }}>
          Profil
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setTab('profile')} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            background: tab === 'profile' ? 'rgba(0,245,212,0.2)' : 'transparent',
            border: `1px solid ${tab === 'profile' ? 'rgba(0,245,212,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: tab === 'profile' ? '#00f5d4' : 'rgba(255,255,255,0.4)',
          }}>Profil</button>
          <button onClick={() => setTab('zones')} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            background: tab === 'zones' ? 'rgba(0,245,212,0.2)' : 'transparent',
            border: `1px solid ${tab === 'zones' ? 'rgba(0,245,212,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: tab === 'zones' ? '#00f5d4' : 'rgba(255,255,255,0.4)',
          }}>Zones</button>
        </div>
        <button onClick={onClose} style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 16,
        }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

        {tab === 'profile' && (
          <>
            {/* Avatar + Pseudo */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 12, marginBottom: 24,
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(0,245,212,0.1)',
                border: '2px solid rgba(0,245,212,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 40,
                boxShadow: '0 0 24px rgba(0,245,212,0.2)',
              }}>{avatar}</div>

              {/* Avatar picker */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 280 }}>
                {AVATARS.map(a => (
                  <button key={a} onClick={() => saveAvatar(a)} style={{
                    width: 36, height: 36, borderRadius: 8, fontSize: 20,
                    background: avatar === a ? 'rgba(0,245,212,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${avatar === a ? 'rgba(0,245,212,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                  }}>{a}</button>
                ))}
              </div>

              {/* Pseudo */}
              {editing ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    autoFocus
                    value={pseudo}
                    onChange={e => savePseudo(e.target.value)}
                    onBlur={() => setEditing(false)}
                    onKeyDown={e => e.key === 'Enter' && setEditing(false)}
                    style={{
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,245,212,0.4)',
                      borderRadius: 8, padding: '8px 12px', color: '#fff',
                      fontSize: 16, fontFamily: 'monospace', width: 180, textAlign: 'center',
                    }}
                  />
                </div>
              ) : (
                <button onClick={() => setEditing(true)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>{pseudo}</span>
                  <span style={{ fontSize: 11, color: 'rgba(0,245,212,0.5)' }}>✏️</span>
                </button>
              )}

              {/* Level badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(0,245,212,0.08)', border: '1px solid rgba(0,245,212,0.2)',
                borderRadius: 20, padding: '6px 14px',
              }}>
                <span style={{ fontSize: 11, color: 'rgba(0,245,212,0.6)', fontFamily: 'monospace' }}>Niveau</span>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#00f5d4', fontFamily: 'monospace' }}>{level}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>—</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{levelTitle}</span>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {[
                { icon: '⚡', label: 'XP Total', value: xp.toLocaleString() },
                { icon: '🗺️', label: t.statTiles, value: totalTiles.toLocaleString() },
                { icon: '👟', label: t.statDist, value: `${(totalDist / 1000).toFixed(2)} km` },
                { icon: '🏛️', label: t.statSites, value: `${discMonuments.length}` },
                { icon: '🌍', label: t.statCountries, value: countries.length.toString() },
                { icon: '🏅', label: t.statBadges, value: `${earnedBadges.length}/${badges.length}` },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '10px 12px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Badges earned */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase', marginBottom: 10 }}>
                Badges — {earnedBadges.length}/{badges.length}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {badges.map(b => (
                  <div key={b.id} style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: b.earned ? 'rgba(0,245,212,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${b.earned ? 'rgba(0,245,212,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, opacity: b.earned ? 1 : 0.25,
                    title: b.name,
                  }} title={b.name}>{b.icon}</div>
                ))}
              </div>
            </div>

            {/* Countries */}
            {countries.length > 0 && (
              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase', marginBottom: 10 }}>
                  Pays visités — {countries.length}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {countries.map(c => (
                    <div key={c.code} style={{
                      fontSize: 24, title: c.name,
                      filter: `drop-shadow(0 0 4px ${RARITY_COLORS[c.rarity]}60)`,
                    }} title={c.name}>{c.flag}</div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'zones' && (
          <>
            {/* Zone stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
              {[
                { label: 'Zones', value: zoneStats.total },
                { label: 'Complétées', value: zoneStats.completed },
                { label: 'Moy. %', value: zoneStats.avgPercent + '%' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '10px 12px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#00f5d4', fontFamily: 'monospace' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Zone list */}
            {zones.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'center', padding: '32px 0' }}>
                Explore pour créer des zones
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {zones.slice(0, 50).map(z => (
                <div key={z.id} style={{
                  background: z.completed ? 'rgba(0,245,212,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${z.completed ? 'rgba(0,245,212,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 10, padding: '10px 14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{z.completed ? '✅' : '🗺️'}</span>
                      <span style={{ fontSize: 12, color: z.completed ? '#00f5d4' : 'rgba(255,255,255,0.6)' }}>{z.name}</span>
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace',
                      color: z.completed ? '#00f5d4' : 'rgba(255,255,255,0.5)',
                    }}>{z.percent}%</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      width: `${z.percent}%`, height: '100%', borderRadius: 2,
                      background: z.completed ? 'linear-gradient(90deg,#00b4a0,#00f5d4)' : 'linear-gradient(90deg,#3b82f6,#60a5fa)',
                      transition: 'width 0.5s',
                    }} />
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', marginTop: 4 }}>
                    {z.discoveredTiles}/{z.totalTiles} tuiles
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
