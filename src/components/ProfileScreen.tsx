import { useState, useRef, useEffect } from 'react'
import type { Badge, Monument, CountryDiscovery } from '../types/game'
import { RARITY_COLORS } from '../lib/constants'
import { computeExplorationPercent, computeDeptPercent, computeCountryPercent, computeCityPercent } from '../lib/territory'
import type { TerritoryData } from '../lib/territory'
import type { Translations } from '../lib/i18n'
import { getBadgeName, getBadgeDesc } from '../lib/i18n'
import { exportData, importData } from '../lib/exportImport'
import AvatarEditor, { loadAvatarPhoto } from './AvatarEditor'
import ShareCard from './ShareCard'
import ActivityGraph from './ActivityGraph'
import MonumentStats from './MonumentStats'
import BadgeProgress from './BadgeProgress'

interface Props {
  onClose: () => void
  onReset: () => void
  score: number; xp: number; level: number; levelTitle: string
  totalTiles: number; totalDist: number
  badges: Badge[]; monuments: Monument[]; countries: CountryDiscovery[]
  log: Array<{ timestamp: string; points?: number; type?: string }>
  path?: Array<{ lat: number; lng: number; timestamp: number }>
  tiles: Set<string>; playerLat: number; playerLng: number
  territory: TerritoryData
  t: Translations
}

const AVATAR_KEY = 'ti2_avatar'
const PSEUDO_KEY = 'ti2_pseudo'



// Correspondance ISO2 -> code numérique TopoJSON
const ISO2_TO_NUMERIC: Record<string, string> = {
  'FR': '250', 'DE': '276', 'ES': '724', 'IT': '380', 'GB': '826',
  'PT': '620', 'BE': '056', 'NL': '528', 'CH': '756', 'AT': '040',
  'PL': '616', 'CZ': '203', 'HU': '348', 'RO': '642', 'GR': '300',
  'SE': '752', 'NO': '578', 'FI': '246', 'DK': '208', 'IE': '372',
  'US': '840', 'CA': '124', 'BR': '076', 'AU': '036', 'CN': '156',
  'JP': '392', 'IN': '356', 'RU': '643', 'MX': '484', 'AR': '032',
  'ZA': '710', 'NG': '566', 'EG': '818', 'MA': '504', 'KE': '404',
  'TR': '792', 'SA': '682', 'AE': '784', 'TH': '764', 'VN': '704',
  'KR': '410', 'ID': '360', 'PH': '608', 'MY': '458', 'SG': '702',
}

// Mini carte monde intégrée dans le profil
function WorldMapMini({ countries, playerLat, playerLng }: { countries: CountryDiscovery[], playerLat: number, playerLng: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let cancelled = false

    Promise.all([
      fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json()),
      import('https://cdn.jsdelivr.net/npm/d3@7/+esm' as any),
      import('https://cdn.jsdelivr.net/npm/topojson-client@3/+esm' as any),
    ]).then(([world, d3, topo]) => {
      if (cancelled || !el) return
      const visited = new Set(countries.map(c => ISO2_TO_NUMERIC[c.code] || c.code))
      const W = el.clientWidth || 320
      const H = Math.round(W * 0.5)
      el.innerHTML = ''
      const svg = d3.select(el).append('svg')
        .attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`)
        .style('border-radius', '10px').style('background', 'rgba(0,20,50,0.6)')
      const proj = d3.geoNaturalEarth1().scale(W / 6.5).translate([W/2, H/2])
      const path = d3.geoPath(proj)
      const feats = topo.feature(world, world.objects.countries)
      svg.selectAll('path').data(feats.features).join('path')
        .attr('d', path)
        .attr('fill', (d: any) => visited.has(String(d.id)) ? '#00f5d4' : 'rgba(255,255,255,0.07)')
        .attr('stroke', 'rgba(0,0,0,0.4)').attr('stroke-width', 0.3)
      try {
        const [px, py] = proj([playerLng, playerLat]) as [number,number]
        if (px && py) {
          svg.append('circle').attr('cx', px).attr('cy', py).attr('r', 3)
            .attr('fill', '#f59e0b').attr('stroke', '#000').attr('stroke-width', 1)
        }
      } catch {}
    }).catch(() => {})

    return () => { cancelled = true }
  }, [countries, playerLat, playerLng])

  return (
    <div>
      <div ref={ref} style={{ width: '100%', borderRadius: 10, overflow: 'hidden', minHeight: 160 }} />
      {countries.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
          {countries.map(c => (
            <div key={c.code} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 24 }}>{c.flag}</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', maxWidth: 48, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProfileScreen({ onClose, onReset, score, xp, level, levelTitle, totalTiles, totalDist, badges, monuments, countries, log, path = [], territory, tiles, playerLat, playerLng, t }: Props) {
  const [pseudo, setPseudo] = useState(() => localStorage.getItem(PSEUDO_KEY) || 'Explorer')
  const [avatar, setAvatar] = useState(() => localStorage.getItem(AVATAR_KEY) || '🧭')
  const [avatarPhoto, setAvatarPhoto] = useState<string | undefined>(() => loadAvatarPhoto())
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<'profile' | 'territory' | 'stats'>('profile')
  const [showAvatarEditor, setShowAvatarEditor] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const earnedBadges = badges.filter(b => b.earned)
  const discMonuments = monuments.filter(m => m.discovered)
  const streak = parseInt(localStorage.getItem('ti2_streak') || '0')

  const savePseudo = (v: string) => {
    const c = v.slice(0, 20)
    setPseudo(c)
    localStorage.setItem(PSEUDO_KEY, c)
  }

  const cityPct = territory.city ? computeCityPercent(territory.city, territory.cityAreaKm2) : computeExplorationPercent(totalTiles, territory.cityAreaKm2)
  const deptPct = territory.department ? computeDeptPercent(totalTiles, territory.department) : 0
  const countryPct = territory.country ? computeCountryPercent(totalTiles, territory.country) : 0

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await importData(file)
    setImportMsg({ ok: result.success, text: result.message })
    if (result.success) setTimeout(() => window.location.reload(), 1500)
  }

  const TABS = [
    { id: 'profile' as const,   label: t.profile },
    { id: 'territory' as const, label: t.territory },
    { id: 'stats' as const,     label: t.stats },
  ]

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(2,5,15,0.97)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', animation: 'toastIn 0.3s ease-out' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(0,245,212,0.1)', flexShrink: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'rgba(0,245,212,0.6)', textTransform: 'uppercase' }}>{t.profile}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {TABS.map(tab_ => (
              <button key={tab_.id} onClick={() => setTab(tab_.id)} style={{
                padding: '5px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                background: tab === tab_.id ? 'rgba(0,245,212,0.2)' : 'transparent',
                border: `1px solid ${tab === tab_.id ? 'rgba(0,245,212,0.5)' : 'rgba(255,255,255,0.1)'}`,
                color: tab === tab_.id ? '#00f5d4' : 'rgba(255,255,255,0.4)',
              }}>{tab_.label}</button>
            ))}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

          {/* ── PROFIL ── */}
          {tab === 'profile' && (
            <>
              {/* Avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div onClick={() => setShowAvatarEditor(true)} style={{ width: 86, height: 86, borderRadius: '50%', background: 'rgba(0,245,212,0.1)', border: '2.5px solid rgba(0,245,212,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, boxShadow: '0 0 24px rgba(0,245,212,0.2)', cursor: 'pointer', overflow: 'hidden' }}>
                  {avatarPhoto ? <img src={avatarPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" /> : avatar}
                </div>
                <button onClick={() => setShowAvatarEditor(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: 'rgba(0,245,212,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {t.editAvatar}
                </button>

                {editing ? (
                  <input autoFocus value={pseudo} onChange={e => savePseudo(e.target.value)} onBlur={() => setEditing(false)} onKeyDown={e => e.key === 'Enter' && setEditing(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,245,212,0.4)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 16, fontFamily: 'monospace', width: 180, textAlign: 'center', outline: 'none' }} />
                ) : (
                  <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>{pseudo}</span>
                    <span style={{ fontSize: 11, color: 'rgba(0,245,212,0.5)' }}>✏️</span>
                  </button>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,245,212,0.08)', border: '1px solid rgba(0,245,212,0.2)', borderRadius: 20, padding: '6px 14px' }}>
                  <span style={{ fontSize: 11, color: 'rgba(0,245,212,0.6)', fontFamily: 'monospace' }}>{t.level}</span>
                  <span style={{ fontSize: 18, fontWeight: 'bold', color: '#00f5d4', fontFamily: 'monospace' }}>{level}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>—</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{levelTitle}</span>
                </div>

                {streak > 0 && (
                  <div style={{ fontSize: 11, color: 'rgba(255,165,0,0.8)', fontFamily: 'monospace' }}>
                    🔥 {streak} {streak > 1 ? t.days : t.day} — {t.streakActive}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { icon: '⚡', label: t.statXP,         value: xp.toLocaleString() },
                  { icon: '📐', label: t.statTiles,      value: `${(totalTiles * 100).toLocaleString()} m²` },
                  { icon: '👟', label: t.statDist,       value: `${(totalDist / 1000).toFixed(2)} km` },
                  { icon: '🏛️', label: t.statSites,      value: discMonuments.length.toString() },
                  { icon: '🌍', label: t.statCountries,  value: countries.length.toString() },
                  { icon: '🏅', label: t.statBadges,     value: `${earnedBadges.length}/${badges.length}` },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Graphique activité */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <ActivityGraph log={log} path={path} t={t} />
              </div>

              {/* Badges proches */}
              <BadgeProgress
                badges={badges}
                tiles={tiles}
                totalDist={totalDist}
                score={score}
                monuments={monuments}
                countries={countries}
                streak={parseInt(localStorage.getItem('ti2_streak')||'0')}
                t={t}
              />

              {/* Badges */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase', marginBottom: 10 }}>
                  {t.badgesTitle} — {earnedBadges.length}/{badges.length}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {badges.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBadge(b)}
                      style={{
                        width: 54, height: 54, borderRadius: 12, cursor: 'pointer',
                        background: b.earned ? 'rgba(0,245,212,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${b.earned ? 'rgba(0,245,212,0.35)' : 'rgba(255,255,255,0.07)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 26, opacity: b.earned ? 1 : 0.3,
                        position: 'relative',
                      }}
                    >
                      {b.icon}
                      {b.earned && (
                        <div style={{ position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: '#00f5d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#030810', fontWeight: 'bold' }}>✓</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pays */}
              {countries.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>
                    {t.countriesTitle} — {countries.length}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {countries.map(c => (
                      <div key={c.code} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <span title={c.name} style={{ fontSize: 24, filter: `drop-shadow(0 0 4px ${RARITY_COLORS[c.rarity]}60)` }}>{c.flag}</span>
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export/Import/Share */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginBottom: 10 }}>{t.dataTitle}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <button onClick={() => exportData()} style={{ padding: '10px 6px', borderRadius: 8, cursor: 'pointer', background: 'rgba(0,245,212,0.07)', border: '1px solid rgba(0,245,212,0.2)', color: '#00f5d4', fontSize: 11, fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 18 }}>📤</span>{t.exportBtn}
                  </button>
                  <button onClick={() => importRef.current?.click()} style={{ padding: '10px 6px', borderRadius: 8, cursor: 'pointer', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', fontSize: 11, fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 18 }}>📥</span>{t.importBtn}
                  </button>
                  <button onClick={() => setShowShare(true)} style={{ padding: '10px 6px', borderRadius: 8, cursor: 'pointer', background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)', color: '#a855f7', fontSize: 11, fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 18 }}>🔗</span>{t.shareBtn}
                  </button>
                </div>
                <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
                {importMsg && (
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: importMsg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${importMsg.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, fontSize: 11, color: importMsg.ok ? '#4ade80' : 'rgba(239,68,68,0.8)' }}>
                    {importMsg.text}
                  </div>
                )}
              </div>

              {/* Reset */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                <button onClick={onReset} style={{ width: '100%', padding: '10px', borderRadius: 8, cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.6)', fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  ⚠️ {t.reset}
                </button>
              </div>
            </>
          )}

          {/* ── TERRITOIRE ── */}
          {tab === 'territory' && (
            <>
              {/* Carte du monde */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase', marginBottom: 12 }}>PAYS DÉCOUVERTS — {countries.length}</div>
                <WorldMapMini countries={countries} playerLat={playerLat} playerLng={playerLng} />
              </div>
              <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase', marginBottom: 16 }}>{t.exploration}</div>
              {[
                { icon: '🏙️', label: t.cityLabel||'Ville',      name: territory.city||'—',       pct: cityPct,    color: '#00f5d4', extra: territory.cityAreaKm2 ? `sur ${territory.cityAreaKm2.toFixed(1)} km²` : null },
                { icon: '🗺️', label: t.deptLabel||'Département',       name: territory.department||'—', pct: deptPct,    color: '#3b82f6', extra: null },
                { icon: '🌍', label: t.countryLabel2||'Pays',  name: territory.country||'—',    pct: countryPct, color: '#a855f7', extra: null },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{row.icon}</span>
                      <div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{row.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#fff' }}>{row.name || '—'}</div>
                        {row.extra && <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{row.extra}</div>}
                      </div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 'bold', color: row.color, fontFamily: 'monospace' }}>
                      {row.pct > 0.001 ? row.pct.toFixed(2) + '%' : row.pct > 0 ? '<0.01%' : '0%'}
                    </div>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(row.pct, 0.2)}%`, height: '100%', borderRadius: 4, background: row.color, boxShadow: `0 0 8px ${row.color}60`, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── STATS MONUMENTS ── */}
          {tab === 'stats' && (
            <>
              <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase', marginBottom: 16 }}>
                {t.sitesDiscovered} — {discMonuments.length}
              </div>
              <MonumentStats monuments={monuments} />
            </>
          )}
        </div>
      </div>

      {/* Badge detail */}
      {selectedBadge && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 950, background: 'rgba(2,5,15,0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'rgba(5,12,24,0.99)', border: `1px solid ${selectedBadge.earned ? 'rgba(0,245,212,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 24, padding: 32, maxWidth: 300, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.9)', animation: 'toastIn 0.3s ease-out' }}>
            <div style={{ fontSize: 72, marginBottom: 16, filter: selectedBadge.earned ? 'none' : 'grayscale(1) opacity(0.4)' }}>{selectedBadge.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: selectedBadge.earned ? '#fff' : 'rgba(255,255,255,0.35)', marginBottom: 10, fontFamily: 'monospace' }}>{getBadgeName(t,selectedBadge.id)||selectedBadge.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 20 }}>{getBadgeDesc(t,selectedBadge.id)||selectedBadge.description}</div>
            {selectedBadge.earned
              ? <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,245,212,0.1)', border: '1px solid rgba(0,245,212,0.3)', borderRadius: 20, padding: '8px 18px', marginBottom: 16 }}>
                  <span>✅</span>
                  <span style={{ fontSize: 12, color: '#00f5d4', fontFamily: 'monospace' }}>
                    {selectedBadge.earnedAt ? `${t.foundAt} ${new Date(selectedBadge.earnedAt).toLocaleDateString()}` : t.badgeEarned}
                  </span>
                </div>
              : <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '8px 18px', marginBottom: 16 }}>
                  <span>🔒</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{t.badgeNotEarned}</span>
                </div>
            }
            <br />
            <button onClick={() => setSelectedBadge(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 28px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13 }}>
              {t.closeBtn}
            </button>
          </div>
        </div>
      )}

      {/* Avatar editor */}
      {showAvatarEditor && (
        <AvatarEditor
          currentAvatar={avatar} currentPhoto={avatarPhoto}
          onAvatarChange={(a, p) => { setAvatar(a); setAvatarPhoto(p) }}
          onClose={() => setShowAvatarEditor(false)}
        />
      )}

      {/* Share */}
      {showShare && (
        <ShareCard
          tiles={tiles} playerLat={playerLat} playerLng={playerLng}
          score={score} level={level} levelTitle={levelTitle}
          totalDist={totalDist} monuments={monuments}
          pseudo={pseudo} avatar={avatar} avatarPhoto={avatarPhoto}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  )
}
