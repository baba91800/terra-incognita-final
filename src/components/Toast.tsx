import type { Notification } from '../types/game'
import { RARITY_COLORS, RARITY_LABELS } from '../lib/constants'

export default function Toast({ notifications }: { notifications: Notification[] }) {
  return (
    <div style={{position:'absolute',top:96,left:'50%',transform:'translateX(-50%)',zIndex:700,display:'flex',flexDirection:'column',gap:8,alignItems:'center',pointerEvents:'none'}}>
      {notifications.map(n => (
        <div key={n.id} className="toast hud-panel" style={{
          minWidth:220,
          borderColor: n.rarity ? RARITY_COLORS[n.rarity]+'60' : n.type==='level' ? '#f59e0b60' : n.type==='objective' ? '#22c55e60' : undefined,
          boxShadow: n.rarity ? `0 0 20px ${RARITY_COLORS[n.rarity]}30` : undefined
        }}>
          {n.type==='monument' && <Row icon="🏆" label="Monument Discovered" title={n.title} sub={n.rarity?`${RARITY_LABELS[n.rarity]} · +${n.points} XP`:undefined} color={n.rarity?RARITY_COLORS[n.rarity]:undefined} />}
          {n.type==='badge'    && <Row icon={n.icon||'🏅'} label="Badge Earned" title={n.title} sub={n.subtitle} color="#00f5d4" />}
          {n.type==='country'  && <Row icon={n.icon||'🌍'} label="Country Unlocked" title={n.title} sub={n.rarity?`${RARITY_LABELS[n.rarity]} · +${n.points} XP`:undefined} color={n.rarity?RARITY_COLORS[n.rarity]:undefined} />}
          {n.type==='level'    && <Row icon="🎖️" label="Level Up!" title={n.title} sub={n.subtitle} color="#f59e0b" />}
          {n.type==='objective'&& <Row icon="🎯" label="Objective Complete" title={n.subtitle||n.title} sub={`+${n.points} XP`} color="#22c55e" />}
        </div>
      ))}
    </div>
  )
}

function Row({icon,label,title,sub,color}:{icon:string;label:string;title:string;sub?:string;color?:string}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:12}}>
      <span style={{fontSize:22}}>{icon}</span>
      <div>
        <div style={{fontSize:9,letterSpacing:'0.2em',color:'rgba(255,255,255,0.4)',textTransform:'uppercase'}}>{label}</div>
        <div style={{fontSize:13,fontWeight:'bold',color:'#fff'}}>{title}</div>
        {sub && <div style={{fontSize:10,marginTop:2,color:color||'rgba(255,255,255,0.4)'}}>{sub}</div>}
      </div>
    </div>
  )
}
