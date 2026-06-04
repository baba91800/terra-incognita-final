import { useEffect, useRef, useState } from 'react'

interface Props {
  playerLat: number
  playerLng: number
  tiles: Set<string>
  countries: Array<{ code: string; flag: string; name: string }>
  onClose: () => void
}

function latLngToXYZ(lat: number, lng: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return [
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ]
}

function rotate3D(lat: number, lng: number, rotX: number, rotY: number, R: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  let x = -R * Math.sin(phi) * Math.cos(theta)
  let y = R * Math.cos(phi)
  let z = R * Math.sin(phi) * Math.sin(theta)
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
  const x1 = x * cosY + z * sinY
  const z1 = -x * sinY + z * cosY
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX)
  const y1 = y * cosX - z1 * sinX
  const z2 = y * sinX + z1 * cosX
  return [x1, y1, z2]
}

function isApproxLand(lat: number, lng: number): boolean {
  if (lat > 35 && lat < 72 && lng > -12 && lng < 40) return true
  if (lat > -35 && lat < 38 && lng > -18 && lng < 52) return true
  if (lat > 0 && lat < 75 && lng > 40 && lng < 145) return true
  if (lat > 15 && lat < 72 && lng > -170 && lng < -50) return true
  if (lat > -55 && lat < 15 && lng > -82 && lng < -34) return true
  if (lat > -40 && lat < -10 && lng > 113 && lng < 155) return true
  if (lat < -70) return true
  return false
}

const COUNTRY_COORDS: Record<string, [number, number]> = {
  FR:[46.2,2.2],DE:[51.2,10.5],GB:[54.4,-2.2],ES:[40.5,-3.7],
  IT:[42.5,12.6],US:[37.1,-95.7],JP:[36.2,138.3],CN:[35.9,104.2],
  IN:[20.6,79.0],BR:[-14.2,-51.9],AU:[-25.3,133.8],CA:[56.1,-106.3],
  PT:[39.4,-8.2],GR:[39.1,21.8],TR:[38.9,35.2],ZA:[-30.6,22.9],
  EG:[26.8,30.8],TH:[15.9,100.9],AR:[-38.4,-63.6],NO:[64.6,17.9],
  NZ:[-40.9,174.9],MA:[31.8,-7.1],KR:[35.9,127.8],VN:[16.1,107.8],
  RU:[61.5,105.3],MN:[46.9,103.8],IS:[64.9,-18.5],NP:[28.4,84.1],
  ET:[9.1,40.5],BT:[27.5,90.4],CU:[21.5,-79.5],MM:[17.1,96.7],
}

const CONTINENT_DOTS: [number, number][] = []
for (let lat = -80; lat <= 80; lat += 3) {
  for (let lng = -180; lng <= 180; lng += 3) {
    if (isApproxLand(lat, lng)) CONTINENT_DOTS.push([lat, lng])
  }
}

let starsCache: Array<{x:number;y:number;r:number;a:number}>|null = null

export default function GlobeView({ playerLat, playerLng, tiles, countries, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const rotRef = useRef({ x: -playerLat * Math.PI / 180, y: -playerLng * Math.PI / 180 - Math.PI })
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0, vx: 0, vy: 0 })
  const sizeRef = useRef({ w: 0, h: 0 })

  // Précalculer les points explorés
  const exploredPoints = useRef<[number,number][]>([])
  useEffect(() => {
    const MPL = 111320, TILE_SIZE = 10
    const MPG = MPL * Math.cos(playerLat * Math.PI / 180)
    const pts: [number,number][] = []
    tiles.forEach(k => {
      const [tx,ty] = k.split(':').map(Number)
      pts.push([(ty+0.5)*TILE_SIZE/MPL, (tx+0.5)*TILE_SIZE/MPG])
    })
    exploredPoints.current = pts
  }, [tiles, playerLat])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let destroyed = false

    // Initialiser les étoiles
    starsCache = null

    const getSize = () => {
      const W = window.innerWidth
      const H = window.innerHeight
      sizeRef.current = { w: W, h: H }
      canvas.width = W
      canvas.height = H
    }
    getSize()
    window.addEventListener('resize', getSize)

    const draw = () => {
      if (destroyed) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const W = sizeRef.current.w
      const H = sizeRef.current.h
      if (W === 0 || H === 0) { animRef.current = requestAnimationFrame(draw); return }

      const cx = W / 2, cy = H / 2
      const R = Math.min(W, H) * 0.38

      ctx.clearRect(0, 0, W, H)

      // Fond
      ctx.fillStyle = '#030810'
      ctx.fillRect(0, 0, W, H)

      // Étoiles
      if (!starsCache) {
        starsCache = Array.from({ length: 200 }, () => ({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.6 + 0.1,
        }))
      }
      starsCache.forEach(s => {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2)
        ctx.fillStyle = `rgba(255,255,255,${s.a})`; ctx.fill()
      })

      const rotX = rotRef.current.x
      const rotY = rotRef.current.y

      // Globe
      const grad = ctx.createRadialGradient(cx-R*0.3, cy-R*0.3, R*0.1, cx, cy, R)
      grad.addColorStop(0, 'rgba(0,40,80,0.95)')
      grad.addColorStop(0.5, 'rgba(0,20,45,0.98)')
      grad.addColorStop(1, 'rgba(2,5,15,1)')
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2)
      ctx.fillStyle = grad; ctx.fill()

      // Halo
      const halo = ctx.createRadialGradient(cx, cy, R*0.95, cx, cy, R*1.15)
      halo.addColorStop(0, 'rgba(0,245,212,0.08)')
      halo.addColorStop(1, 'rgba(0,245,212,0)')
      ctx.beginPath(); ctx.arc(cx, cy, R*1.15, 0, Math.PI*2)
      ctx.fillStyle = halo; ctx.fill()

      // Continents
      CONTINENT_DOTS.forEach(([lat, lng]) => {
        const [x3,y3,z3] = rotate3D(lat, lng, rotX, rotY, R)
        if (z3 < 0) return
        ctx.beginPath(); ctx.arc(cx+x3, cy-y3, 1.2, 0, Math.PI*2)
        ctx.fillStyle = 'rgba(30,60,100,0.6)'; ctx.fill()
      })

      // Grille
      ctx.strokeStyle = 'rgba(0,245,212,0.05)'; ctx.lineWidth = 0.5
      for (let lng2 = -180; lng2 <= 180; lng2 += 30) {
        ctx.beginPath(); let started = false
        for (let lat2 = -80; lat2 <= 80; lat2 += 5) {
          const [x,y,z] = rotate3D(lat2, lng2, rotX, rotY, R)
          if (z < 0) { started = false; continue }
          if (!started) { ctx.moveTo(cx+x, cy-y); started = true } else ctx.lineTo(cx+x, cy-y)
        }
        ctx.stroke()
      }
      for (let lat2 = -60; lat2 <= 60; lat2 += 30) {
        ctx.beginPath(); let started = false
        for (let lng2 = -180; lng2 <= 180; lng2 += 5) {
          const [x,y,z] = rotate3D(lat2, lng2, rotX, rotY, R)
          if (z < 0) { started = false; continue }
          if (!started) { ctx.moveTo(cx+x, cy-y); started = true } else ctx.lineTo(cx+x, cy-y)
        }
        ctx.stroke()
      }

      // Zones explorées
      exploredPoints.current.forEach(([lat,lng]) => {
        const [x3,y3,z3] = rotate3D(lat, lng, rotX, rotY, R)
        if (z3 < 0) return
        const alpha = Math.min(1, 0.3 + (z3/R)*0.7)
        ctx.beginPath(); ctx.arc(cx+x3, cy-y3, 2.5, 0, Math.PI*2)
        ctx.fillStyle = `rgba(0,245,212,${alpha*0.8})`; ctx.fill()
      })

      // Pays visités
      countries.slice(0, 20).forEach(c => {
        const coords = COUNTRY_COORDS[c.code]
        if (!coords) return
        const [x3,y3,z3] = rotate3D(coords[0], coords[1], rotX, rotY, R)
        if (z3 < 0) return
        const size = Math.max(12, 18*(z3/R))
        ctx.font = `${size}px serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(c.flag, cx+x3, cy-y3)
      })

      // Joueur
      const [px,py,pz] = rotate3D(playerLat, playerLng, rotX, rotY, R)
      if (pz > 0) {
        const sx = cx+px, sy = cy-py
        const pulse = (Math.sin(Date.now()*0.003)+1)/2
        const pr = 6+pulse*4
        const pg = ctx.createRadialGradient(sx,sy,0,sx,sy,pr*2)
        pg.addColorStop(0,'rgba(0,245,212,0.6)'); pg.addColorStop(1,'rgba(0,245,212,0)')
        ctx.beginPath(); ctx.arc(sx,sy,pr*2,0,Math.PI*2); ctx.fillStyle=pg; ctx.fill()
        ctx.beginPath(); ctx.arc(sx,sy,5,0,Math.PI*2); ctx.fillStyle='#00f5d4'; ctx.fill()
        ctx.beginPath(); ctx.arc(sx,sy,3,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill()
      }

      // Lumière
      const lightGrad = ctx.createRadialGradient(cx-R*0.4,cy-R*0.4,0,cx,cy,R)
      lightGrad.addColorStop(0,'rgba(255,255,255,0.04)')
      lightGrad.addColorStop(0.5,'rgba(0,0,0,0)')
      lightGrad.addColorStop(1,'rgba(0,0,0,0.4)')
      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2)
      ctx.fillStyle=lightGrad; ctx.fill()

      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2)
      ctx.strokeStyle='rgba(0,245,212,0.15)'; ctx.lineWidth=1.5; ctx.stroke()

      // Inertie
      if (!dragRef.current.active) {
        rotRef.current.y += dragRef.current.vx*0.95
        rotRef.current.x += dragRef.current.vy*0.95
        dragRef.current.vx *= 0.95
        dragRef.current.vy *= 0.95
        if (Math.abs(dragRef.current.vx) < 0.0001) rotRef.current.y += 0.0015
      }

      animRef.current = requestAnimationFrame(draw)
    }

    // Démarrer après un court délai pour que le DOM soit prêt
    setTimeout(() => { if (!destroyed) animRef.current = requestAnimationFrame(draw) }, 100)

    const onDown = (e: MouseEvent|TouchEvent) => {
      const pt = 'touches' in e ? e.touches[0] : e
      dragRef.current = { active:true, lastX:pt.clientX, lastY:pt.clientY, vx:0, vy:0 }
    }
    const onMove = (e: MouseEvent|TouchEvent) => {
      if (!dragRef.current.active) return
      const pt = 'touches' in e ? e.touches[0] : e
      const dx = pt.clientX-dragRef.current.lastX
      const dy = pt.clientY-dragRef.current.lastY
      dragRef.current.vx = dx*0.005; dragRef.current.vy = dy*0.005
      rotRef.current.y += dx*0.005; rotRef.current.x += dy*0.005
      rotRef.current.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotRef.current.x))
      dragRef.current.lastX = pt.clientX; dragRef.current.lastY = pt.clientY
    }
    const onUp = () => { dragRef.current.active = false }

    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseup', onUp)
    canvas.addEventListener('touchstart', onDown as any, { passive: true })
    canvas.addEventListener('touchmove', onMove as any, { passive: true })
    canvas.addEventListener('touchend', onUp)

    return () => {
      destroyed = true
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', getSize)
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onUp)
    }
  }, [playerLat, playerLng])

  return (
    <div style={{ position:'fixed', inset:0, zIndex:900, background:'#030810' }}>
      <canvas ref={canvasRef} style={{ display:'block', width:'100%', height:'100%', cursor:'grab', touchAction:'none' }} />

      {/* Stats */}
      <div style={{ position:'absolute', bottom:40, left:'50%', transform:'translateX(-50%)', display:'flex', gap:12, pointerEvents:'none' }}>
        {[
          { icon:'🗺️', label:'Tuiles', value:tiles.size.toLocaleString() },
          { icon:'📐', label:'Surface', value:`${(tiles.size*100).toLocaleString()} m²` },
          { icon:'🌍', label:'Pays', value:countries.length.toString() },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(5,12,24,0.92)', border:'1px solid rgba(0,245,212,0.2)', borderRadius:10, padding:'8px 14px', textAlign:'center', backdropFilter:'blur(12px)' }}>
            <div style={{ fontSize:16 }}>{s.icon}</div>
            <div style={{ fontSize:14, fontWeight:'bold', color:'#00f5d4', fontFamily:'monospace' }}>{s.value}</div>
            <div style={{ fontSize:8, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Titre */}
      <div style={{ position:'absolute', top:20, left:'50%', transform:'translateX(-50%)', fontSize:10, letterSpacing:'0.3em', color:'rgba(0,245,212,0.5)', textTransform:'uppercase', fontFamily:'monospace', pointerEvents:'none' }}>
        Terra Incognita · Globe
      </div>

      {/* Légende */}
      <div style={{ position:'absolute', bottom:120, left:20, display:'flex', flexDirection:'column', gap:6, pointerEvents:'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#00f5d4' }} />
          <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontFamily:'monospace' }}>Zones explorées</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#fff' }} />
          <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontFamily:'monospace' }}>Ta position</span>
        </div>
      </div>

      {/* Bouton fermer */}
      <button onClick={onClose} style={{ position:'absolute', top:16, right:16, width:40, height:40, borderRadius:10, background:'rgba(5,12,24,0.92)', border:'1px solid rgba(0,245,212,0.2)', color:'#00f5d4', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(12px)' }}>✕</button>

      <div style={{ position:'absolute', bottom:16, right:16, fontSize:9, color:'rgba(255,255,255,0.15)', fontFamily:'monospace', pointerEvents:'none' }}>
        Glisse pour tourner
      </div>
    </div>
  )
}
