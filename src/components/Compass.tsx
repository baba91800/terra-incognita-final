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
      position: 'absolute', top: 180, right: 12,
      zIndex: 600, pointerEvents: 'none',
      width: 56, height: 56,
    }}>
      {/* Outer ring */}
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: 'rgba(5,12,24,0.92)',
        border: '1px solid rgba(0,245,212,0.2)',
        boxShadow: '0 0 16px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Cardinal points */}
        {['N','E','S','O'].map((d, i) => {
          const angle = i * 90
          const rad = (angle - heading) * Math.PI / 180
          const r = 18
          const x = 28 + Math.sin(rad) * r
          const y = 28 - Math.cos(rad) * r
          return (
            <div key={d} style={{
              position: 'absolute',
              left: x - 5, top: y - 5,
              width: 10, height: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontFamily: 'monospace', fontWeight: 'bold',
              color: d === 'N' ? '#ef4444' : 'rgba(255,255,255,0.4)',
            }}>{d}</div>
          )
        })}

        {/* Needle */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: `translate(-50%, -50%) rotate(${-heading}deg)`,
          width: 2, height: 28,
          transformOrigin: 'center center',
        }}>
          {/* North (red) */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, #ef4444, #991b1b)',
            borderRadius: '2px 2px 0 0',
          }} />
          {/* South (white) */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '50%',
            background: 'linear-gradient(0deg, rgba(255,255,255,0.6), rgba(255,255,255,0.3))',
            borderRadius: '0 0 2px 2px',
          }} />
        </div>

        {/* Center dot */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 5, height: 5, borderRadius: '50%',
          background: '#00f5d4',
          boxShadow: '0 0 6px rgba(0,245,212,0.8)',
        }} />
      </div>

      {/* Direction label */}
      <div style={{
        position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)',
        fontSize: 9, fontFamily: 'monospace', color: 'rgba(0,245,212,0.6)',
        letterSpacing: '0.1em',
      }}>{dir}</div>
    </div>
  )
}
