import { useEffect, useRef } from 'react'

interface Effect {
  id: string
  x: number
  y: number
  label: string
  color: string
  points: number
}

interface Props {
  effects: Effect[]
}

export default function DiscoveryEffect({ effects }: Props) {
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:600,overflow:'hidden'}}>
      {effects.map(e => (
        <div key={e.id} style={{position:'absolute',left:e.x,top:e.y,transform:'translate(-50%,-50%)'}}>
          {/* Expanding ring */}
          <div className="reveal-ring" style={{
            position:'absolute', left:'50%', top:'50%',
            width:40, height:40, marginLeft:-20, marginTop:-20,
            borderRadius:'50%',
            border:`2px solid ${e.color}`,
            boxShadow:`0 0 20px ${e.color}`,
          }} />
          {/* Second ring delayed */}
          <div className="reveal-ring" style={{
            position:'absolute', left:'50%', top:'50%',
            width:40, height:40, marginLeft:-20, marginTop:-20,
            borderRadius:'50%',
            border:`1px solid ${e.color}88`,
            animationDelay:'0.2s',
          }} />
          {/* Label */}
          <div className="discovery-label" style={{
            position:'absolute', left:'50%', top:-50,
            transform:'translateX(-50%)',
            background:`linear-gradient(135deg,rgba(5,12,24,0.95),rgba(5,12,24,0.9))`,
            border:`1px solid ${e.color}60`,
            borderRadius:8, padding:'6px 12px',
            whiteSpace:'nowrap', textAlign:'center',
            boxShadow:`0 0 20px ${e.color}40`,
          }}>
            <div style={{fontSize:11,fontWeight:'bold',color:'#fff'}}>{e.label}</div>
            <div style={{fontSize:10,color:e.color,fontFamily:'monospace'}}>+{e.points} XP</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export type { Effect }
