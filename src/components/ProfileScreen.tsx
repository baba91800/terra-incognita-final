import { useState, useRef } from 'react'
import type { Badge, Monument, CountryDiscovery } from '../types/game'
import { RARITY_COLORS, LEVEL_TITLES } from '../lib/constants'
import { estimateCityPercent, estimateDeptPercent, estimateCountryPercent } from '../lib/territory'
import type { TerritoryData } from '../lib/territory'
import type { Translations } from '../lib/i18n'
import GlobeView from './GlobeView'
import { exportData, importData } from '../lib/exportImport'
import MonumentStats from './MonumentStats'
import AvatarEditor, { loadAvatarPhoto } from './AvatarEditor'
import ShareCard from './ShareCard'
import ActivityGraph from './ActivityGraph'

interface Props {
  onClose: () => void
  score: number; xp: number; level: number; levelTitle: string
  totalTiles: number; totalDist: number
  badges: Badge[]; monuments: Monument[]; countries: CountryDiscovery[]
  log: Array<{ timestamp: string; points?: number }>
  tiles: Set<string>; playerLat: number; playerLng: number
  territory: TerritoryData
  t: Translations
}

const AVATARS = [
  { icon: '🧭', label: 'Explorateur' }, { icon: '🏔️', label: 'Montagne' },
  { icon: '🌋', label: 'Volcan' },      { icon: '🏝️', label: 'Île' },
  { icon: '🌍', label: 'Monde' },       { icon: '🚀', label: 'Aventure' },
  { icon: '🦅', label: 'Aigle' },       { icon: '🐺', label: 'Loup' },
  { icon: '🦁', label: 'Lion' },        { icon: '🐉', label: 'Dragon' },
  { icon: '⚔️', label: 'Guerrier' },   { icon: '🔭', label: 'Curieux' },
  { icon: '🌠', label: 'Étoile' },      { icon: '🗺️', label: 'Carte' },
  { icon: '💎', label: 'Diamant' },
]

const AVATAR_KEY = 'ti2_avatar'
const PSEUDO_KEY = 'ti2_pseudo'

export default function ProfileScreen({ onClose, score, xp, level, levelTitle, totalTiles, totalDist, badges, monuments, countries, territory, tiles, playerLat, playerLng, t }: Props) {
  const [pseudo, setPseudo] = useState(() => localStorage.getItem(PSEUDO_KEY) || 'Explorer')
  const [avatar, setAvatar] = useState(() => localStorage.getItem(AVATAR_KEY) || '🧭')
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<'profile'|'territory'|'stats'>('profile')
  const [showGlobe, setShowGlobe] = useState(false)
  const [importMsg, setImportMsg] = useState<{ok:boolean;text:string}|null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const [avatarPhoto, setAvatarPhoto] = useState<string|undefined>(() => loadAvatarPhoto())
  const [showAvatarEditor, setShowAvatarEditor] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showBoundary, setShowBoundary] = useState(false)

  const earnedBadges = badges.filter(b => b.earned)
  const discMonuments = monuments.filter(m => m.discovered)
  const streak = parseInt(localStorage.getItem('ti2_streak') || '0')

  const savePseudo = (v: string) => { const c = v.slice(0,20); setPseudo(c); localStorage.setItem(PSEUDO_KEY, c) }
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const result = await importData(file)
    setImportMsg({ ok: result.success, text: result.message })
    if (result.success) setTimeout(() => window.location.reload(), 1500)
  }
  const saveAvatar = (a: string) => { setAvatar(a); localStorage.setItem(AVATAR_KEY, a) }

  const cityPct = estimateCityPercent(totalTiles)
  const deptPct = estimateDeptPercent(totalTiles)
  const countryPct = estimateCountryPercent(totalTiles)

  return (
    <>
      <div style={{ position:'fixed', inset:0, zIndex:800, background:'rgba(2,5,15,0.97)', backdropFilter:'blur(20px)', display:'flex', flexDirection:'column', animation:'toastIn 0.3s ease-out' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid rgba(0,245,212,0.1)' }}>
          <div style={{ fontSize:11, letterSpacing:'0.2em', color:'rgba(0,245,212,0.6)', textTransform:'uppercase' }}>Profil</div>
          <div style={{ display:'flex', gap:8 }}>
            {(['profile','territory','stats'] as const).map(tab_ => (
              <button key={tab_} onClick={()=>setTab(tab_)} style={{
                padding:'5px 14px', borderRadius:6, fontSize:11, cursor:'pointer',
                background: tab===tab_ ? 'rgba(0,245,212,0.2)' : 'transparent',
                border: `1px solid ${tab===tab_ ? 'rgba(0,245,212,0.5)' : 'rgba(255,255,255,0.1)'}`,
                color: tab===tab_ ? '#00f5d4' : 'rgba(255,255,255,0.4)',
              }}>{tab_==='profile' ? 'Profil' : tab_==='territory' ? 'Territoire' : 'Stats'}</button>
            ))}
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:16 }}>✕</button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:16 }}>

          {tab === 'profile' && (
            <>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, marginBottom:20 }}>
                <div onClick={() => setShowAvatarEditor(true)} style={{ width:80, height:80, borderRadius:'50%', background:'rgba(0,245,212,0.1)', border:'2px solid rgba(0,245,212,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, boxShadow:'0 0 24px rgba(0,245,212,0.2)', cursor:'pointer', overflow:'hidden' }}>
                {avatarPhoto ? <img src={avatarPhoto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="avatar" /> : avatar}
              </div>
              <div style={{fontSize:8,color:'rgba(0,245,212,0.4)',letterSpacing:'0.1em',textTransform:'uppercase',cursor:'pointer'}} onClick={()=>setShowAvatarEditor(true)}>Modifier</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center', maxWidth:300 }}>
                  {AVATARS.map(a => (
                    <button key={a.icon} onClick={()=>saveAvatar(a.icon)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, width:50, padding:'5px 3px', borderRadius:8, fontSize:20, background: avatar===a.icon ? 'rgba(0,245,212,0.2)' : 'rgba(255,255,255,0.04)', border:`1px solid ${avatar===a.icon ? 'rgba(0,245,212,0.5)' : 'rgba(255,255,255,0.08)'}`, cursor:'pointer' }}>
                      {a.icon}
                      <span style={{ fontSize:7, color:'rgba(255,255,255,0.3)' }}>{a.label}</span>
                    </button>
                  ))}
                </div>
                {editing ? (
                  <input autoFocus value={pseudo} onChange={e=>savePseudo(e.target.value)} onBlur={()=>setEditing(false)} onKeyDown={e=>e.key==='Enter'&&setEditing(false)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(0,245,212,0.4)', borderRadius:8, padding:'8px 12px', color:'#fff', fontSize:16, fontFamily:'monospace', width:180, textAlign:'center', outline:'none' }} />
                ) : (
                  <button onClick={()=>setEditing(true)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:18, fontWeight:'bold', color:'#fff', fontFamily:'monospace' }}>{pseudo}</span>
                    <span style={{ fontSize:11, color:'rgba(0,245,212,0.5)' }}>✏️</span>
                  </button>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(0,245,212,0.08)', border:'1px solid rgba(0,245,212,0.2)', borderRadius:20, padding:'6px 14px' }}>
                  <span style={{ fontSize:11, color:'rgba(0,245,212,0.6)', fontFamily:'monospace' }}>Niveau</span>
                  <span style={{ fontSize:18, fontWeight:'bold', color:'#00f5d4', fontFamily:'monospace' }}>{level}</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>—</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>{levelTitle}</span>
                </div>
                {streak > 0 && (
                  <div style={{ fontSize:11, color:'rgba(255,165,0,0.8)', fontFamily:'monospace' }}>🔥 {streak} jour{streak>1?'s':''} consécutif{streak>1?'s':''}</div>
                )}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:18 }}>
                {[
                  { icon:'⚡', label:'XP Total',         value: xp.toLocaleString() },
                  { icon:'📐', label:'Surface explorée', value: `${(totalTiles*100).toLocaleString()} m²` },
                  { icon:'👟', label:'Distance',         value: `${(totalDist/1000).toFixed(2)} km` },
                  { icon:'🏛️', label:'Sites trouvés',    value: discMonuments.length.toString() },
                  { icon:'🌍', label:'Pays visités',      value: countries.length.toString() },
                  { icon:'🏅', label:'Badges',            value: `${earnedBadges.length}/${badges.length}` },
                ].map(s => (
                  <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 12px', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:18 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{s.label}</div>
                      <div style={{ fontSize:16, fontWeight:'bold', color:'#fff', fontFamily:'monospace' }}>{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:9, letterSpacing:'0.15em', color:'rgba(0,245,212,0.5)', textTransform:'uppercase', marginBottom:10 }}>Badges — {earnedBadges.length}/{badges.length}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                  {badges.map(b => (
                    <div key={b.id} title={b.name + ' — ' + b.description} style={{ width:44, height:44, borderRadius:10, background: b.earned?'rgba(0,245,212,0.1)':'rgba(255,255,255,0.03)', border:`1px solid ${b.earned?'rgba(0,245,212,0.3)':'rgba(255,255,255,0.06)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, opacity:b.earned?1:0.2, cursor:'default' }}>{b.icon}</div>
                  ))}
                </div>
              </div>

              {countries.length > 0 && (
                <div>
                  <div style={{ fontSize:9, letterSpacing:'0.15em', color:'rgba(0,245,212,0.5)', textTransform:'uppercase', marginBottom:8 }}>Pays visités — {countries.length}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {countries.map(c => (
                      <span key={c.code} title={c.name} style={{ fontSize:24, filter:`drop-shadow(0 0 4px ${RARITY_COLORS[c.rarity]}60)` }}>{c.flag}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'territory' && (
            <>
              <div style={{ fontSize:9, letterSpacing:'0.15em', color:'rgba(0,245,212,0.5)', textTransform:'uppercase', marginBottom:16 }}>Territoire exploré</div>

              {/* Bouton Globe 3D */}
              <button onClick={() => setShowGlobe(true)} style={{
                width:'100%', padding:'14px', borderRadius:12, cursor:'pointer', marginBottom:20,
                background:'rgba(0,245,212,0.08)', border:'1px solid rgba(0,245,212,0.2)',
                color:'#00f5d4', fontFamily:'monospace', fontSize:13,
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              }}>
                <span style={{ fontSize:24 }}>🌍</span> Vue Globe 3D
              </button>

              {/* Bouton Frontières ville */}
              <button onClick={() => setShowBoundary(true)} style={{
                width:'100%', padding:'14px', borderRadius:12, cursor:'pointer', marginBottom:20,
                background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)',
                color:'#3b82f6', fontFamily:'monospace', fontSize:13,
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              }}>
                <span style={{ fontSize:24 }}>🏙️</span> Frontières de ma ville
              </button>

              {[
                { icon:'🏙️', label:'Ville',       name: territory.city,       pct: cityPct,    color:'#00f5d4' },
                { icon:'🗺️', label:'Département', name: territory.department, pct: deptPct,    color:'#3b82f6' },
                { icon:'🌍', label:'Pays',         name: territory.country,    pct: countryPct, color:'#a855f7' },
              ].map(row => (
                <div key={row.label} style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:20 }}>{row.icon}</span>
                      <div>
                        <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{row.label}</div>
                        <div style={{ fontSize:14, fontWeight:'bold', color:'#fff' }}>{row.name || '—'}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:22, fontWeight:'bold', color: row.color, fontFamily:'monospace' }}>{row.pct.toFixed(2)}%</div>
                  </div>
                  <div style={{ height:8, background:'rgba(255,255,255,0.05)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${row.pct}%`, height:'100%', borderRadius:4, background: row.color, boxShadow:`0 0 8px ${row.color}60`, transition:'width 1s ease' }} />
                  </div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', fontFamily:'monospace', marginTop:4 }}>
                    {(totalTiles * 100).toLocaleString()} m² explorés
                  </div>
                </div>
              ))}

              <div style={{ marginTop:8, padding:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:10 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', lineHeight:1.6 }}>
                  Les pourcentages sont calculés par rapport à la surface totale de chaque territoire. Plus tu marches, plus tu dévoiles le monde.
                </div>
              </div>
            </>
          )}
        {tab === 'stats' && (
          <>
            <div style={{fontSize:9,letterSpacing:'0.15em',color:'rgba(0,245,212,0.5)',textTransform:'uppercase',marginBottom:16}}>
              Sites découverts
            </div>
            <MonumentStats monuments={monuments} />
          </>
        )}
        </div>
      </div>

      {/* Globe 3D */}
      {showBoundary && (
        <CityBoundary
          playerLat={playerLat} playerLng={playerLng}
          tiles={tiles} cityName={territory.city}
          onClose={() => setShowBoundary(false)}
        />
      )}

      {showAvatarEditor && (
        <AvatarEditor
          currentAvatar={avatar} currentPhoto={avatarPhoto}
          onAvatarChange={(a, p) => { setAvatar(a); setAvatarPhoto(p) }}
          onClose={() => setShowAvatarEditor(false)}
        />
      )}
      {showShare && (
        <ShareCard
          tiles={tiles} playerLat={playerLat} playerLng={playerLng}
          score={score} level={level} levelTitle={levelTitle}
          totalDist={totalDist} monuments={monuments}
          pseudo={pseudo} avatar={avatar} avatarPhoto={avatarPhoto}
          onClose={() => setShowShare(false)}
        />
      )}
      {showGlobe && (
        <GlobeView
          playerLat={playerLat} playerLng={playerLng}
          tiles={tiles} countries={countries}
          onClose={() => setShowGlobe(false)}
        />
      )}
    </>
  )
}
