import { useState, useEffect } from 'react'
import type { Badge, Monument, CountryDiscovery, DailyObjective, DiscoveryLog, ExplorationPath } from '../types/game'
import { RARITY_COLORS, RARITY_LABELS } from '../lib/constants'
import MiniMap from './MiniMap'

type Panel = 'none'|'badges'|'monuments'|'countries'|'objectives'|'log'|'stats'

interface Props {
  score:number; xp:number; level:number; xpIntoLevel:number; xpForNext:number; levelTitle:string
  totalTiles:number; explorationPercent:string; totalDist:number
  badges:Badge[]; monuments:Monument[]; countries:CountryDiscovery[]
  objectives:DailyObjective[]; log:DiscoveryLog[]; path:ExplorationPath[]
  tiles:Set<string>; playerLat:number; playerLng:number
  gpsActive:boolean; onStartGPS:()=>void; onStopGPS:()=>void; onReset:()=>void
}

export default function HUD(p:Props) {
  const [panel,setPanel]=useState<Panel>('none')
  const [installEvt,setInstallEvt]=useState<any>(null)
  const tp=(x:Panel)=>setPanel(v=>v===x?'none':x)
  const earnedB=p.badges.filter(b=>b.earned)
  const discM=p.monuments.filter(m=>m.discovered)
  const todayDone=p.objectives.filter(o=>o.completed).length

  useEffect(()=>{
    const h=(e:any)=>{e.preventDefault();setInstallEvt(e)}
    window.addEventListener('beforeinstallprompt',h)
    return ()=>window.removeEventListener('beforeinstallprompt',h)
  },[])

  const install=async()=>{
    if(!installEvt) return
    installEvt.prompt()
    await installEvt.userChoice
    setInstallEvt(null)
  }

  const pct=Math.min(100,Math.round(p.xpIntoLevel/p.xpForNext*100))

  return (
    <>
      {/* TOP */}
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:600,pointerEvents:'none'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:12,gap:8}}>

          {/* Left */}
          <div style={{display:'flex',flexDirection:'column',gap:8,pointerEvents:'auto'}}>
            <div className="hud-panel">
              <div style={{fontSize:9,letterSpacing:'0.2em',color:'rgba(0,245,212,0.5)',textTransform:'uppercase',marginBottom:2}}>Explorer Points</div>
              <div style={{fontSize:24,fontWeight:'bold',color:'#00f5d4',fontFamily:'monospace'}}>{p.score.toLocaleString()}</div>
              <div style={{display:'flex',gap:12,marginTop:8}}>
                {[['Tiles',p.totalTiles.toLocaleString()],['Zone',p.explorationPercent+'%'],['km',(p.totalDist/1000).toFixed(2)]].map(([l,v])=>(
                  <div key={l}><div style={{fontSize:9,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{l}</div><div style={{fontSize:11,fontFamily:'monospace',color:'rgba(255,255,255,0.6)'}}>{v}</div></div>
                ))}
              </div>
            </div>
            {/* XP Bar */}
            <div className="hud-panel" style={{minWidth:200}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:22,height:22,borderRadius:4,border:'1px solid rgba(0,245,212,0.4)',background:'rgba(0,245,212,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:'bold',color:'#00f5d4',fontFamily:'monospace'}}>{p.level}</div>
                  <span style={{fontSize:10,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',textTransform:'uppercase'}}>{p.levelTitle}</span>
                </div>
                <span style={{fontSize:9,color:'rgba(255,255,255,0.2)',fontFamily:'monospace'}}>{p.xpIntoLevel}/{p.xpForNext}</span>
              </div>
              <div style={{height:6,background:'rgba(255,255,255,0.05)',borderRadius:3,overflow:'hidden'}}>
                <div style={{width:`${pct}%`,height:'100%',background:'linear-gradient(90deg,#00b4a0,#00f5d4)',boxShadow:'0 0 8px rgba(0,245,212,0.5)',transition:'width 0.5s',borderRadius:3}} />
              </div>
            </div>
          </div>

          {/* Center logo */}
          <div style={{flex:1,display:'flex',justifyContent:'center',paddingTop:4,pointerEvents:'none'}}>
            <div style={{textAlign:'center'}}>
              <img src="/logo.png" alt="Terra" style={{width:44,height:44,borderRadius:'50%',border:'1px solid rgba(0,245,212,0.2)',marginBottom:4}} />
              <div style={{fontSize:9,letterSpacing:'0.15em',color:'rgba(255,255,255,0.3)',textTransform:'uppercase',fontFamily:'monospace'}}>Terra Incognita</div>
            </div>
          </div>

          {/* Right */}
          <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end',pointerEvents:'auto'}}>
            <button className={`hud-btn ${p.gpsActive?'active':''}`} onClick={p.gpsActive?p.onStopGPS:p.onStartGPS} style={p.gpsActive?{background:'rgba(34,197,94,0.2)',borderColor:'rgba(34,197,94,0.5)',color:'#4ade80'}:{}}>
              {p.gpsActive?'📡 GPS ON':'📍 GPS'}
            </button>
            {installEvt && <button className="hud-btn active" onClick={install}>📲 Installer</button>}
            <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'flex-end',maxWidth:160}}>
              {([['badges','🏅',earnedB.length],['monuments','🏛️',discM.length],['countries','🌍',p.countries.length],['objectives','🎯',todayDone],['log','📜',p.log.length],['stats','📊',null]] as const).map(([id,icon,count])=>(
                <button key={id} className={`hud-btn ${panel===id?'active':''}`} onClick={()=>tp(id as Panel)}>
                  {icon}{count!==null?` ${count}`:''}
                </button>
              ))}
            </div>
            <button onClick={p.onReset} style={{fontSize:9,color:'rgba(239,68,68,0.3)',background:'none',border:'none',cursor:'pointer',letterSpacing:'0.1em',textTransform:'uppercase'}}>Reset</button>
          </div>
        </div>
      </div>

      {/* PANELS LEFT */}
      {panel==='badges' && <SidePanel title={`Badges — ${earnedB.length}/${p.badges.length}`} left>
        {p.badges.map(b=>(
          <div key={b.id} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 8px',borderRadius:6,border:`1px solid ${b.earned?'rgba(0,245,212,0.3)':'rgba(255,255,255,0.05)'}`,background:b.earned?'rgba(0,245,212,0.05)':'transparent',opacity:b.earned?1:0.4}}>
            <span style={{fontSize:18}}>{b.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:'bold',color:b.earned?'#fff':'rgba(255,255,255,0.4)'}}>{b.name}</div>
              <div style={{fontSize:9,color:'rgba(255,255,255,0.3)'}}>{b.description}</div>
              {b.earnedAt&&<div style={{fontSize:8,color:'rgba(0,245,212,0.5)',marginTop:2}}>{new Date(b.earnedAt).toLocaleDateString()}</div>}
            </div>
            {!b.earned&&<span style={{color:'rgba(255,255,255,0.2)',fontSize:11}}>🔒</span>}
          </div>
        ))}
      </SidePanel>}

      {panel==='objectives' && <SidePanel title="Daily Objectives" left>
        {p.objectives.map(o=>{
          const pct=Math.min(100,o.target>0?(o.current/o.target)*100:0)
          return <div key={o.id} style={{opacity:o.completed?0.6:1}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontSize:14}}>{o.icon}</span>
                <span style={{fontSize:11,color:o.completed?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.7)',textDecoration:o.completed?'line-through':'none'}}>{o.description}</span>
              </div>
              <span style={{fontSize:10,color:'rgba(0,245,212,0.6)',fontFamily:'monospace',marginLeft:8,flexShrink:0}}>+{o.reward}</span>
            </div>
            <div style={{height:4,background:'rgba(255,255,255,0.05)',borderRadius:2,overflow:'hidden',marginLeft:22}}>
              <div style={{width:`${pct}%`,height:'100%',background:o.completed?'linear-gradient(90deg,#22c55e,#4ade80)':'linear-gradient(90deg,#00b4a0,#00f5d4)',transition:'width 0.3s',borderRadius:2}} />
            </div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.2)',fontFamily:'monospace',marginLeft:22,marginTop:2}}>{o.current}/{o.target}{o.completed&&<span style={{color:'rgba(34,197,94,0.6)',marginLeft:8}}>✓</span>}</div>
          </div>
        })}
      </SidePanel>}

      {panel==='log' && <SidePanel title="Discovery Log" left>
        {p.log.length===0&&<div style={{color:'rgba(255,255,255,0.2)',fontSize:11,textAlign:'center',padding:'16px 0'}}>No discoveries yet</div>}
        {p.log.map(e=>(
          <div key={e.id} style={{display:'flex',gap:10,alignItems:'flex-start',paddingBottom:8,borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
            <span style={{fontSize:14,flexShrink:0}}>{e.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:'bold',color:e.rarity?RARITY_COLORS[e.rarity]:'rgba(255,255,255,0.8)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.title}</div>
              {e.subtitle&&<div style={{fontSize:9,color:'rgba(255,255,255,0.3)'}}>{e.subtitle}</div>}
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              {e.points&&e.points>0&&<div style={{fontSize:9,color:'rgba(0,245,212,0.6)',fontFamily:'monospace'}}>+{e.points}</div>}
              <div style={{fontSize:8,color:'rgba(255,255,255,0.15)',fontFamily:'monospace'}}>{new Date(e.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          </div>
        ))}
      </SidePanel>}

      {/* PANELS RIGHT */}
      {panel==='monuments' && <SidePanel title={`Monuments — ${discM.length}/${p.monuments.length}`}>
        {p.monuments.map(m=>(
          <div key={m.id} style={{display:'flex',gap:10,alignItems:'center',padding:'6px 8px',borderRadius:6,border:`1px solid ${m.discovered?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.05)'}`,background:m.discovered?'rgba(255,255,255,0.04)':'transparent'}}>
            <span style={{fontSize:16}}>{m.discovered?(m.icon||'📍'):'❓'}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:'bold',color:m.discovered?'#fff':'rgba(255,255,255,0.25)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.discovered?m.name:'??? Unknown'}</div>
              <div style={{fontSize:9,marginTop:2,color:RARITY_COLORS[m.rarity]}}>{RARITY_LABELS[m.rarity]}</div>
            </div>
            {m.discovered&&<span style={{color:'#22c55e',fontSize:11}}>✓</span>}
          </div>
        ))}
      </SidePanel>}

      {panel==='countries' && <SidePanel title={`Countries — ${p.countries.length}`}>
        {p.countries.length===0&&<div style={{color:'rgba(255,255,255,0.2)',fontSize:11,textAlign:'center',padding:'16px 0'}}>Visit a new country to unlock a bonus</div>}
        {[...p.countries].sort((a,b)=>b.points-a.points).map(c=>(
          <div key={c.code} style={{display:'flex',gap:10,alignItems:'center',padding:'6px 8px',borderRadius:6,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)'}}>
            <span style={{fontSize:20}}>{c.flag}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:'bold',color:'#fff'}}>{c.name}</div>
              <div style={{fontSize:9,marginTop:2,color:RARITY_COLORS[c.rarity]}}>{RARITY_LABELS[c.rarity]} · +{c.points} XP</div>
            </div>
          </div>
        ))}
      </SidePanel>}

      {panel==='stats' && <SidePanel title="Statistics">
        {[
          ['⚡','Total XP',p.xp.toLocaleString()],
          ['🎖️','Level',`${p.level} — ${p.levelTitle}`],
          ['🗺️','Tiles',p.totalTiles.toLocaleString()],
          ['👟','Distance',`${(p.totalDist/1000).toFixed(2)} km`],
          ['🏛️','Monuments',`${discM.length}/${p.monuments.length}`],
          ['🌍','Countries',p.countries.length.toString()],
          ['🏅','Badges',`${earnedB.length}/${p.badges.length}`],
          ['🎯','Objectives',p.objectives.filter(o=>o.completed).length.toString()],
        ].map(([icon,label,value])=>(
          <div key={label as string} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:14}}>{icon}</span>
              <span style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{label}</span>
            </div>
            <span style={{fontSize:11,fontFamily:'monospace',color:'rgba(255,255,255,0.7)'}}>{value}</span>
          </div>
        ))}
      </SidePanel>}

      {/* MINIMAP */}
      <div style={{position:'absolute',bottom:16,left:12,zIndex:600,pointerEvents:'none'}}>
        <MiniMap tiles={p.tiles} playerLat={p.playerLat} playerLng={p.playerLng} path={p.path} />
      </div>

      {/* GPS STATUS */}
      <div style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',zIndex:600,pointerEvents:'auto'}}>
        {!p.gpsActive ? (
          <button className="hud-panel" onClick={p.onStartGPS} style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer',border:'1px solid rgba(0,245,212,0.2)',borderRadius:10,padding:'10px 16px',background:'rgba(7,15,26,0.88)'}}>
            <span style={{fontSize:24}}>📍</span>
            <div>
              <div style={{fontSize:12,fontWeight:'bold',color:'#00f5d4'}}>Activer le GPS</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>Pour commencer à explorer</div>
            </div>
          </button>
        ) : (
          <div className="hud-panel" style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#4ade80',animation:'pulse 2s infinite'}} />
            <span style={{fontSize:11,color:'#4ade80',fontFamily:'monospace'}}>GPS actif — explore le monde</span>
            <button onClick={p.onStopGPS} style={{fontSize:10,color:'rgba(239,68,68,0.5)',background:'none',border:'none',cursor:'pointer',marginLeft:8}}>Stop</button>
          </div>
        )}
      </div>
    </>
  )
}

function SidePanel({ title, children, left }: { title: string; children: React.ReactNode; left?: boolean }) {
  return (
    <div style={{
      position:'absolute', top:176, [left?'left':'right']:12,
      zIndex:600, width:272,
      background:'rgba(7,15,26,0.9)', border:'1px solid rgba(0,245,212,0.15)',
      borderRadius:10, padding:'10px 12px',
      backdropFilter:'blur(12px)', maxHeight:'55vh',
      overflowY:'auto', pointerEvents:'auto'
    }}>
      <div style={{fontSize:9,letterSpacing:'0.2em',color:'rgba(0,245,212,0.6)',textTransform:'uppercase',marginBottom:10}}>{title}</div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>{children}</div>
    </div>
  )
}
