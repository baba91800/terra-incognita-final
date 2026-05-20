import type { Notification } from '../types/game'
import { RARITY_COLORS, RARITY_LABELS } from '../lib/constants'
import { type Lang, useT } from '../lib/i18n'

export default function Toast({ notifications, lang }: { notifications: Notification[]; lang: Lang }) {
  const t = useT(lang)
  return (
    <div style={{position:'absolute',top:100,left:'50%',transform:'translateX(-50%)',zIndex:700,display:'flex',flexDirection:'column',gap:8,alignItems:'center',pointerEvents:'none',minWidth:240}}>
      {notifications.map(n => (
        <div key={n.id} className="toast hud-panel" style={{
          width:'100%',
          borderColor: n.rarity ? RARITY_COLORS[n.rarity]+'60' : n.type==='level' ? '#f59e0b60' : n.type==='objective' ? '#22c55e60' : 'rgba(0,245,212,0.2)',
          boxShadow: n.rarity ? `0 0 24px ${RARITY_COLORS[n.rarity]}25` : '0 4px 24px rgba(0,0,0,0.4)',
        }}>
          {n.type==='monument' && <Row icon="🏆" label={t.monumentDiscovered} title={n.title} sub={n.rarity?`${RARITY_LABELS[n.rarity]} · +${n.points} XP`:undefined} color={n.rarity?RARITY_COLORS[n.rarity]:undefined}/>}
          {n.type==='badge'    && <Row icon={n.icon||'🏅'} label={t.badgeUnlocked} title={n.title} sub={n.subtitle} color="#00f5d4"/>}
          {n.type==='country'  && <Row icon={n.icon||'🌍'} label={t.newCountry} title={n.title} sub={n.rarity?`${RARITY_LABELS[n.rarity]} · +${n.points} XP`:undefined} color={n.rarity?RARITY_COLORS[n.rarity]:undefined}/>}
          {n.type==='level'    && <Row icon="🎖️" label={t.levelUp} title={n.title} sub={n.subtitle} color="#f59e0b"/>}
          {n.type==='objective'&& <Row icon="🎯" label={t.objectiveComplete} title={n.subtitle||n.title} sub={`+${n.points} XP`} color="#22c55e"/>}
        </div>
      ))}
    </div>
  )
}

function Row({icon,label,title,sub,color}:{icon:string;label:string;title:string;sub?:string;color?:string}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:12}}>
      <span style={{fontSize:24,flexShrink:0}}>{icon}</span>
      <div>
        <div style={{fontSize:8,letterSpacing:'0.18em',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',marginBottom:2}}>{label}</div>
        <div style={{fontSize:13,fontWeight:'bold',color:'#fff'}}>{title}</div>
        {sub&&<div style={{fontSize:10,marginTop:2,color:color||'rgba(255,255,255,0.4)'}}>{sub}</div>}
      </div>
    </div>
  )
}
