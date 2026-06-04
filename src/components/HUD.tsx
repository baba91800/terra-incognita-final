import { useState, useEffect } from 'react'
import type { Badge, Monument, CountryDiscovery, DailyObjective, DiscoveryLog, ExplorationPath } from '../types/game'
import { RARITY_COLORS, RARITY_LABELS, LANGS } from '../lib/constants'
import { type Lang, useT, type Translations } from '../lib/i18n'

type Panel = 'none'|'badges'|'monuments'|'countries'|'objectives'|'log'|'stats'

interface Props {
  score:number; xp:number; level:number; xpIntoLevel:number; xpForNext:number; levelTitle:string
  totalTiles:number; explorationPercent:string; totalDist:number
  badges:Badge[]; monuments:Monument[]; countries:CountryDiscovery[]
  objectives:DailyObjective[]; log:DiscoveryLog[]; path:ExplorationPath[]
  tiles:Set<string>; playerLat:number; playerLng:number
  gpsActive:boolean; onStartGPS:()=>void; onStopGPS:()=>void
  lang: Lang; onChangeLang: (l: Lang) => void
  t: Translations; onOpenProfile: () => void
}

export default function HUD(p:Props) {
  const [panel,setPanel]=useState<Panel>('none')
  const [installEvt,setInstallEvt]=useState<any>(null)
  const [showLang,setShowLang]=useState(false)
  const tp=(x:Panel)=>setPanel(v=>v===x?'none':x)
  const t=p.t
  const earnedB=p.badges.filter(b=>b.earned)
  const discM=p.monuments.filter(m=>m.discovered)
  const todayDone=p.objectives.filter(o=>o.completed).length
  const xpPct=Math.min(100,Math.round(p.xpIntoLevel/p.xpForNext*100))
  const streak=parseInt(localStorage.getItem('ti2_streak')||'0')

  useEffect(()=>{
    const h=(e:any)=>{e.preventDefault();setInstallEvt(e)}
    window.addEventListener('beforeinstallprompt',h)
    return ()=>window.removeEventListener('beforeinstallprompt',h)
  },[])

  const install=async()=>{
    if(!installEvt) return
    installEvt.prompt(); await installEvt.userChoice; setInstallEvt(null)
  }

  const NAV_BTNS = [
    { id:'badges'     as Panel, icon:'🏅', label:t.badges,     count:earnedB.length },
    { id:'monuments'  as Panel, icon:'🏛️', label:t.sites,      count:discM.length },
    { id:'countries'  as Panel, icon:'🌍', label:t.countries,  count:p.countries.length },
    { id:'objectives' as Panel, icon:'🎯', label:t.objectives, count:todayDone },
    { id:'log'        as Panel, icon:'📜', label:t.log,        count:null },
    { id:'stats'      as Panel, icon:'📊', label:t.stats,      count:null },
  ]

  return (
    <>
      {/* ── TOP BAR ── */}
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:600,pointerEvents:'none'}}>
        <div style={{display:'flex',alignItems:'stretch',justifyContent:'space-between',padding:'10px 12px',gap:10}}>

          {/* LEFT — Score + Level */}
          <div style={{display:'flex',flexDirection:'column',gap:8,pointerEvents:'auto',minWidth:160}}>
            <div className="hud-panel">
              <div style={{fontSize:9,letterSpacing:'0.18em',color:'rgba(0,245,212,0.5)',textTransform:'uppercase',marginBottom:3}}>Explorer Points</div>
              <div style={{fontSize:26,fontWeight:'bold',color:'#00f5d4',fontFamily:'monospace',lineHeight:1}}>{p.score.toLocaleString()}</div>
              <div style={{display:'flex',gap:14,marginTop:8}}>
                {[['m²',(p.totalTiles*100).toLocaleString()],['Zone',p.explorationPercent+'%'],['km',(p.totalDist/1000).toFixed(2)]].map(([l,v])=>(
                  <div key={l as string}>
                    <div style={{fontSize:8,color:'rgba(255,255,255,0.2)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{l}</div>
                    <div style={{fontSize:12,fontFamily:'monospace',color:'rgba(255,255,255,0.65)'}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* XP Bar */}
            <div className="hud-panel" style={{padding:'8px 12px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                <div style={{display:'flex',alignItems:'center',gap:7}}>
                  <div style={{
                    width:24,height:24,borderRadius:6,
                    background:'linear-gradient(135deg,rgba(0,180,160,0.3),rgba(0,245,212,0.15))',
                    border:'1px solid rgba(0,245,212,0.4)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:11,fontWeight:'bold',color:'#00f5d4',fontFamily:'monospace'
                  }}>{p.level}</div>
                  <span style={{fontSize:10,color:'rgba(255,255,255,0.4)',letterSpacing:'0.08em',textTransform:'uppercase'}}>{p.levelTitle}</span>
                </div>
                <span style={{fontSize:8,color:'rgba(255,255,255,0.18)',fontFamily:'monospace'}}>{p.xpIntoLevel}/{p.xpForNext}</span>
              </div>
              <div style={{height:5,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden'}}>
                <div style={{
                  width:`${xpPct}%`,height:'100%',borderRadius:3,
                  background:'linear-gradient(90deg,#00b4a0,#00f5d4)',
                  boxShadow:'0 0 8px rgba(0,245,212,0.6)',
                  transition:'width 0.6s ease',
                }} />
              </div>
            </div>

            {/* STREAK */}
            {streak > 0 && (
              <div className="hud-panel" style={{padding:'6px 12px',display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:16}}>🔥</span>
                <div>
                  <div style={{fontSize:13,fontWeight:'bold',color:'rgba(255,165,0,0.9)',fontFamily:'monospace'}}>{streak} jour{streak>1?'s':''}</div>
                  <div style={{fontSize:8,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Série active</div>
                </div>
              </div>
            )}
          </div>

          {/* CENTER — Logo */}
          <div style={{flex:1,display:'flex',justifyContent:'center',alignItems:'flex-start',paddingTop:6,pointerEvents:'none'}}>
            <div style={{textAlign:'center'}}>
              <img src="/logo.png" alt="Terra" style={{
                width:48,height:48,borderRadius:'50%',objectFit:'cover',
                border:'1.5px solid rgba(0,245,212,0.3)',marginBottom:5,
                boxShadow:'0 0 16px rgba(0,245,212,0.25)',
              }} />
              <div style={{fontSize:8,letterSpacing:'0.18em',color:'rgba(255,255,255,0.25)',textTransform:'uppercase',fontFamily:'monospace'}}>Terra Incognita</div>
            </div>
          </div>

          {/* RIGHT — Controls */}
          <div style={{display:'flex',flexDirection:'column',gap:7,alignItems:'flex-end',pointerEvents:'auto'}}>
            {/* GPS */}
            <button
              className={`hud-btn ${p.gpsActive?'active':''}`}
              onClick={p.gpsActive?p.onStopGPS:p.onStartGPS}
              style={p.gpsActive?{background:'rgba(34,197,94,0.15)',borderColor:'rgba(34,197,94,0.5)',color:'#4ade80',boxShadow:'0 0 12px rgba(34,197,94,0.2)'}:{}}
            >
              <span>{p.gpsActive?'📡':'📍'}</span>
              <span style={{fontSize:11}}>{p.gpsActive?t.gpsOn:t.gps}</span>
            </button>

            {/* Profile */}
            <button className="hud-btn" onClick={p.onOpenProfile} style={{fontSize:11}}>
              <span>👤</span><span>Profil</span>
            </button>

            {/* Install */}
            {installEvt && (
              <button className="hud-btn active" onClick={install} style={{fontSize:11}}>
                <span>📲</span><span>{t.install}</span>
              </button>
            )}            {/* Language selector */}
            <div style={{position:'relative'}}>
              <button className="hud-btn" onClick={()=>setShowLang(v=>!v)} style={{fontSize:11,padding:'6px 10px'}}>
                <span>🌐</span>
                <span>{p.lang.toUpperCase()}</span>
              </button>
              {showLang && (
                <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'rgba(5,12,24,0.97)',border:'1px solid rgba(0,245,212,0.2)',borderRadius:10,overflow:'hidden',zIndex:800,minWidth:140,boxShadow:'0 8px 32px rgba(0,0,0,0.6)'}}>
                  {[{code:'fr',label:'Français',flag:'🇫🇷'},{code:'en',label:'English',flag:'🇬🇧'},{code:'es',label:'Español',flag:'🇪🇸'},{code:'de',label:'Deutsch',flag:'🇩🇪'},{code:'pt',label:'Português',flag:'🇵🇹'}].map(l=>(
                    <button key={l.code} onClick={()=>{p.onChangeLang(l.code as Lang);setShowLang(false)}} style={{
                      display:'flex',alignItems:'center',gap:10,width:'100%',padding:'9px 14px',
                      background:p.lang===l.code?'rgba(0,245,212,0.12)':'transparent',
                      border:'none',color:'#fff',cursor:'pointer',fontSize:12,
                      borderBottom:'1px solid rgba(255,255,255,0.04)',
                    }}>
                      <span>{l.flag}</span><span>{l.label}</span>
                      {p.lang===l.code&&<span style={{marginLeft:'auto',color:'#00f5d4',fontSize:10}}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nav buttons — 2 columns */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
              {NAV_BTNS.map(btn=>(
                <button
                  key={btn.id}
                  className={`hud-btn ${panel===btn.id?'active':''}`}
                  onClick={()=>tp(btn.id)}
                  style={{justifyContent:'center',padding:'7px 10px',fontSize:12}}
                >
                  <span>{btn.icon}</span>
                  {btn.count!==null&&<span style={{fontSize:10,opacity:0.7}}>{btn.count}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── PANELS ── */}

      {panel==='badges'&&(
        <Panel title={`${t.badgesTitle} — ${earnedB.length}/${p.badges.length}`} left onClose={()=>setPanel('none')}>
          {p.badges.map(b=>(
            <div key={b.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,border:`1px solid ${b.earned?'rgba(0,245,212,0.25)':'rgba(255,255,255,0.05)'}`,background:b.earned?'rgba(0,245,212,0.05)':'transparent',opacity:b.earned?1:0.4,cursor:'default',userSelect:'none'}}>
              <span style={{fontSize:20,flexShrink:0}}>{b.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:'bold',color:b.earned?'#fff':'rgba(255,255,255,0.3)'}}>{b.name}</div>
                <div style={{fontSize:9,color:'rgba(255,255,255,0.3)',marginTop:1,lineHeight:1.4}}>{b.description}</div>
                {b.earnedAt&&<div style={{fontSize:8,color:'rgba(0,245,212,0.5)',marginTop:2}}>{new Date(b.earnedAt).toLocaleDateString()}</div>}
              </div>
              <span style={{fontSize:12,flexShrink:0,opacity:b.earned?1:0.3}}>{b.earned?'✓':'🔒'}</span>
            </div>
          ))}
        </Panel>
      )}

      {panel==='objectives'&&(
        <Panel title={t.objectivesTitle} left onClose={()=>setPanel('none')}>
          {p.objectives.map(o=>{
            const pct=Math.min(100,o.target>0?o.current/o.target*100:0)
            return (
              <div key={o.id} style={{opacity:o.completed?0.55:1}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontSize:16}}>{o.icon}</span>
                    <span style={{fontSize:11,color:o.completed?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.75)',textDecoration:o.completed?'line-through':'none'}}>{o.description}</span>
                  </div>
                  <span style={{fontSize:10,color:'rgba(0,245,212,0.7)',fontFamily:'monospace',marginLeft:8,flexShrink:0}}>+{o.reward}</span>
                </div>
                <div style={{height:4,background:'rgba(255,255,255,0.06)',borderRadius:2,overflow:'hidden',marginLeft:24}}>
                  <div style={{width:`${pct}%`,height:'100%',borderRadius:2,transition:'width 0.4s',background:o.completed?'linear-gradient(90deg,#22c55e,#4ade80)':'linear-gradient(90deg,#00b4a0,#00f5d4)'}} />
                </div>
                <div style={{fontSize:9,color:'rgba(255,255,255,0.2)',fontFamily:'monospace',marginLeft:24,marginTop:2}}>{o.current}/{o.target}{o.completed&&<span style={{color:'rgba(34,197,94,0.6)',marginLeft:8}}>✓ Complété</span>}</div>
              </div>
            )
          })}
        </Panel>
      )}

      {panel==='log'&&(
        <Panel title={t.logTitle} left onClose={()=>setPanel('none')}>
          {p.log.length===0&&<Empty text={t.noDiscoveries} />}
          {p.log.map(e=>(
            <div key={e.id} style={{display:'flex',gap:10,alignItems:'flex-start',paddingBottom:8,borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <span style={{fontSize:15,flexShrink:0,marginTop:1}}>{e.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:'bold',color:e.rarity?RARITY_COLORS[e.rarity]:'rgba(255,255,255,0.8)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.title}</div>
                {e.subtitle&&<div style={{fontSize:9,color:'rgba(255,255,255,0.3)',marginTop:1}}>{e.subtitle}</div>}
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                {e.points&&e.points>0&&<div style={{fontSize:9,color:'rgba(0,245,212,0.6)',fontFamily:'monospace'}}>+{e.points}</div>}
                <div style={{fontSize:8,color:'rgba(255,255,255,0.15)',fontFamily:'monospace'}}>{new Date(e.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
              </div>
            </div>
          ))}
        </Panel>
      )}

      {panel==='monuments'&&(
        <Panel title={`${t.sitesTitle} — ${discM.length}/${p.monuments.length}`} onClose={()=>setPanel('none')}>
          {p.monuments.map(m=>(
            <div key={m.id} style={{display:'flex',gap:10,alignItems:'center',padding:'8px 10px',borderRadius:8,border:`1px solid ${m.discovered?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.04)'}`,background:m.discovered?'rgba(255,255,255,0.03)':'transparent'}}>
              <span style={{fontSize:18}}>{m.discovered?(m.icon||'📍'):'❓'}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:'bold',color:m.discovered?'#fff':'rgba(255,255,255,0.2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.discovered?m.name:t.unknownSite}</div>
                <div style={{fontSize:9,marginTop:2,color:RARITY_COLORS[m.rarity]}}>{RARITY_LABELS[m.rarity]}</div>
              </div>
              {m.discovered&&<span style={{color:'#22c55e',fontSize:12}}>✓</span>}
            </div>
          ))}
        </Panel>
      )}

      {panel==='countries'&&(
        <Panel title={`${t.countriesTitle} — ${p.countries.length}`} onClose={()=>setPanel('none')}>
          {p.countries.length===0&&<Empty text={t.noCountries} />}
          {[...p.countries].sort((a,b)=>b.points-a.points).map(c=>(
            <div key={c.code} style={{display:'flex',gap:12,alignItems:'center',padding:'8px 10px',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)'}}>
              <span style={{fontSize:22}}>{c.flag}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:'bold',color:'#fff'}}>{c.name}</div>
                <div style={{fontSize:9,marginTop:2,color:RARITY_COLORS[c.rarity]}}>{RARITY_LABELS[c.rarity]} · +{c.points} XP</div>
              </div>
            </div>
          ))}
        </Panel>
      )}

      {panel==='stats'&&(
        <Panel title={t.statsTitle} onClose={()=>setPanel('none')}>
          {[
            ['⚡',`XP ${t.total}`,p.xp.toLocaleString()],
            ['🎖️',t.level,`${p.level} — ${p.levelTitle}`],
            ['🗺️','Tiles',p.totalTiles.toLocaleString()],
            ['👟',t.distance,`${(p.totalDist/1000).toFixed(2)} km`],
            ['🏛️',t.sites,`${discM.length}/${p.monuments.length}`],
            ['🌍',t.countries,p.countries.length.toString()],
            ['🏅',t.badges,`${earnedB.length}/${p.badges.length}`],
            ['🎯',t.objectives,p.objectives.filter(o=>o.completed).length.toString()],
          ].map(([icon,label,value])=>(
            <div key={label as string} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <span style={{fontSize:15}}>{icon}</span>
                <span style={{fontSize:12,color:'rgba(255,255,255,0.45)'}}>{label}</span>
              </div>
              <span style={{fontSize:12,fontFamily:'monospace',color:'rgba(255,255,255,0.75)'}}>{value}</span>
            </div>
          ))}
        </Panel>
      )}

      {/* ── GPS CTA ── */}
      <div style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',zIndex:600,pointerEvents:'auto'}}>
        {!p.gpsActive ? (
          <button onClick={p.onStartGPS} style={{display:'flex',alignItems:'center',gap:14,cursor:'pointer',background:'rgba(5,12,24,0.94)',border:'1px solid rgba(0,245,212,0.25)',borderRadius:14,padding:'12px 22px',boxShadow:'0 0 30px rgba(0,0,0,0.5)',transition:'all 0.2s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(0,245,212,0.5)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(0,245,212,0.25)'}
          >
            <span style={{fontSize:28}}>📍</span>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:13,fontWeight:'bold',color:'#00f5d4',letterSpacing:'0.05em'}}>{t.activateGPS}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:2}}>{t.activateGPSDesc}</div>
            </div>
          </button>
        ) : (
          <div style={{display:'flex',alignItems:'center',gap:10,background:'rgba(5,12,24,0.94)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:12,padding:'8px 16px',boxShadow:'0 0 20px rgba(34,197,94,0.15)'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#4ade80',boxShadow:'0 0 8px #4ade80'}} className="animate-pulse" />
            <span style={{fontSize:11,color:'#4ade80',fontFamily:'monospace',letterSpacing:'0.05em'}}>{t.gpsActive}</span>
            <button onClick={p.onStopGPS} style={{fontSize:10,color:'rgba(239,68,68,0.4)',background:'none',border:'none',cursor:'pointer',marginLeft:4,padding:'2px 6px'}}>✕</button>
          </div>
        )}
      </div>
    </>
  )
}

function Panel({title,children,left,onClose}:{title:string;children:React.ReactNode;left?:boolean;onClose:()=>void}) {
  return (
    <div style={{
      position:'absolute',top:180,[left?'left':'right']:12,
      zIndex:750,width:280,
      background:'rgba(5,12,24,0.94)',
      border:'1px solid rgba(0,245,212,0.14)',
      borderRadius:14,padding:'12px 14px',
      backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
      maxHeight:'58vh',overflowY:'auto',pointerEvents:'auto',
      touchAction:'pan-y',
      boxShadow:'0 8px 40px rgba(0,0,0,0.6)',
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{fontSize:9,letterSpacing:'0.18em',color:'rgba(0,245,212,0.6)',textTransform:'uppercase'}}>{title}</div>
        <button onClick={onClose} style={{fontSize:14,color:'rgba(255,255,255,0.25)',background:'none',border:'none',cursor:'pointer',lineHeight:1,padding:'2px 6px'}}>✕</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>{children}</div>
    </div>
  )
}

function Empty({text}:{text:string}) {
  return <div style={{color:'rgba(255,255,255,0.2)',fontSize:11,textAlign:'center',padding:'20px 0',lineHeight:1.6}}>{text}</div>
}
