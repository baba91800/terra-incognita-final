import { useEffect, useState, useRef } from 'react'

interface Props {
  heading: number | null
}

export default function Compass({ heading }: Props) {
  if (heading === null) return null

  const dirs = ['N','NE','E','SE','S','SO','O','NO']
  const dir = dirs[Math.round(heading / 45) % 8]

  return (
    <div style={{
      position: 'absolute', bottom: 70, right: 68,
      zIndex: 600, pointerEvents: 'none',
      width: 52, height: 52,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: 'rgba(5,12,24,0.92)',
        border: '1px solid rgba(0,245,212,0.2)',
        boxShadow: '0 0 12px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {['N','E','S','O'].map((d, i) => {
          const angle = i * 90
          const rad = (angle - heading) * Math.PI / 180
          const r = 17
          const x = 26 + Math.sin(rad) * r
          const y = 26 - Math.cos(rad) * r
          return (
            <div key={d} style={{
              position: 'absolute',
              left: x - 5, top: y - 5,
              width: 10, height: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, fontFamily: 'monospace', fontWeight: 'bold',
              color: d === 'N' ? '#ef4444' : 'rgba(255,255,255,0.35)',
            }}>{d}</div>
          )
        })}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: `translate(-50%, -50%) rotate(${-heading}deg)`,
          width: 2, height: 26,
          transformOrigin: 'center center',
        }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'50%', background:'linear-gradient(180deg,#ef4444,#991b1b)', borderRadius:'2px 2px 0 0' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'50%', background:'rgba(255,255,255,0.5)', borderRadius:'0 0 2px 2px' }} />
        </div>
        <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:4, height:4, borderRadius:'50%', background:'#00f5d4' }} />
      </div>
      <div style={{ position:'absolute', bottom:-14, left:'50%', transform:'translateX(-50%)', fontSize:8, fontFamily:'monospace', color:'rgba(0,245,212,0.6)', letterSpacing:'0.1em' }}>{dir}</div>
    </div>
  )
}
