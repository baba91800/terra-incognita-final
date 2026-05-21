import { useEffect, useRef } from 'react'
import type { Monument } from '../types/game'
import { RARITY_COLORS } from '../lib/constants'
import { dist } from '../lib/geo'
import type { Translations } from '../lib/i18n'

interface Props {
  mapRef: React.RefObject<any>
  target: Monument | null
  playerLat: number
  playerLng: number
  onCancel: () => void
  onArrived: () => void
  t: Translations
}

const ARRIVED_THRESHOLD = 30 // meters

export default function NavLine({ mapRef, target, playerLat, playerLng, onCancel, onArrived, t }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const dashOffset = useRef(0)

  useEffect(() => {
    if (!target) return
    const d = dist(playerLat, playerLng, target.lat, target.lng)
    if (d <= ARRIVED_THRESHOLD) { onArrived(); return }
  }, [playerLat, playerLng, target, onArrived])

  useEffect(() => {
    const map = mapRef.current
    const canvas = canvasRef.current
    if (!map || !canvas || !target) {
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    const draw = () => {
      const size = map.getSize()
      if (canvas.width !== size.x || canvas.height !== size.y) {
        canvas.width = size.x; canvas.height = size.y
      }
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      try {
        const from = map.latLngToContainerPoint([playerLat, playerLng])
        const to = map.latLngToContainerPoint([target.lat, target.lng])
        const color = RARITY_COLORS[target.rarity]

        // Glow effect
        ctx.save()
        ctx.shadowColor = color
        ctx.shadowBlur = 8

        // Dashed line
        dashOffset.current = (dashOffset.current + 0.5) % 20
        ctx.setLineDash([10, 8])
        ctx.lineDashOffset = -dashOffset.current
        ctx.strokeStyle = color + 'cc'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.stroke()

        // Arrow at destination
        const angle = Math.atan2(to.y - from.y, to.x - from.x)
        const arrowSize = 10
        ctx.setLineDash([])
        ctx.lineDashOffset = 0
        ctx.strokeStyle = color
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(to.x - Math.cos(angle - 0.4) * arrowSize, to.y - Math.sin(angle - 0.4) * arrowSize)
        ctx.lineTo(to.x, to.y)
        ctx.lineTo(to.x - Math.cos(angle + 0.4) * arrowSize, to.y - Math.sin(angle + 0.4) * arrowSize)
        ctx.stroke()

        ctx.restore()

        // Pulse circle at destination
        const pulse = (Math.sin(Date.now() * 0.003) + 1) / 2
        const pulseR = 12 + pulse * 8
        const pulseAlpha = 0.6 - pulse * 0.3
        ctx.beginPath()
        ctx.arc(to.x, to.y, pulseR, 0, Math.PI * 2)
        ctx.strokeStyle = color + Math.round(pulseAlpha * 255).toString(16).padStart(2, '0')
        ctx.lineWidth = 1.5
        ctx.setLineDash([])
        ctx.stroke()

      } catch {}

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    map.on('move zoom', () => {})

    return () => cancelAnimationFrame(animRef.current)
  }, [target, playerLat, playerLng, mapRef])

  if (!target) return null

  const distance = dist(playerLat, playerLng, target.lat, target.lng)
  const distLabel = distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`
  const color = RARITY_COLORS[target.rarity]

  return (
    <>
      <canvas ref={canvasRef} style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:510}} />

      {/* Navigation HUD */}
      <div style={{
        position:'absolute', bottom:80, left:'50%', transform:'translateX(-50%)',
        zIndex:650, pointerEvents:'auto',
        background:'rgba(5,12,24,0.96)', border:`1px solid ${color}60`,
        borderRadius:14, padding:'12px 18px',
        boxShadow:`0 0 30px ${color}25, 0 8px 32px rgba(0,0,0,0.6)`,
        display:'flex', alignItems:'center', gap:14, minWidth:260,
      }}>
        {/* Icon */}
        <div style={{
          width:40, height:40, borderRadius:10,
          background:`${color}20`, border:`1px solid ${color}50`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
          flexShrink:0,
        }}>
          {target.icon || '📍'}
        </div>

        {/* Info */}
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:9, color:`${color}`, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:3}}>{t.navigateTo}</div>
          <div style={{fontSize:13, fontWeight:'bold', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{target.name}</div>
          <div style={{display:'flex', alignItems:'center', gap:8, marginTop:4}}>
            <span style={{fontSize:11, color:'rgba(255,255,255,0.4)'}}>{t.distanceTo}</span>
            <span style={{fontSize:13, fontWeight:'bold', color:color, fontFamily:'monospace'}}>{distLabel}</span>
          </div>
        </div>

        {/* Cancel */}
        <button onClick={onCancel} style={{
          width:32, height:32, borderRadius:8, flexShrink:0,
          background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)',
          color:'rgba(239,68,68,0.8)', cursor:'pointer', fontSize:14,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>✕</button>
      </div>
    </>
  )
}
