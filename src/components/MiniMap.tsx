import { useEffect, useRef } from 'react'
import { TILE_SIZE } from '../lib/constants'
const MPL = 111320
const SZ = 130

export default function MiniMap({ tiles, playerLat, playerLng, path }: { tiles: Set<string>; playerLat: number; playerLng: number; path: Array<{lat:number;lng:number}> }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c || tiles.size === 0) return
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, SZ, SZ)
    ctx.fillStyle = '#030810'; ctx.fillRect(0, 0, SZ, SZ)
    const MPG = MPL * Math.cos(playerLat * Math.PI / 180)
    const coords: {tx:number;ty:number}[] = []
    tiles.forEach(k => { const [tx,ty] = k.split(':').map(Number); coords.push({tx,ty}) })
    if (!coords.length) return
    const minTx = Math.min(...coords.map(c=>c.tx)), maxTx = Math.max(...coords.map(c=>c.tx))
    const minTy = Math.min(...coords.map(c=>c.ty)), maxTy = Math.max(...coords.map(c=>c.ty))
    const spanX = Math.max(1, maxTx-minTx+1), spanY = Math.max(1, maxTy-minTy+1)
    const pad = 8, draw = SZ-pad*2
    const scale = Math.min(draw/spanX, draw/spanY, 4)
    const ox = pad+(draw-spanX*scale)/2, oy = pad+(draw-spanY*scale)/2
    coords.forEach(({tx,ty}) => {
      ctx.fillStyle = 'rgba(0,245,212,0.25)'
      ctx.fillRect(ox+(tx-minTx)*scale, oy+(maxTy-ty)*scale, Math.max(1,scale), Math.max(1,scale))
    })
    if (path.length > 1) {
      ctx.strokeStyle = 'rgba(0,245,212,0.5)'; ctx.lineWidth = 1; ctx.beginPath()
      path.forEach((pt,i) => {
        const ptx = Math.floor(pt.lng*MPG/TILE_SIZE), pty = Math.floor(pt.lat*MPL/TILE_SIZE)
        const x = ox+(ptx-minTx)*scale+scale/2, y = oy+(maxTy-pty)*scale+scale/2
        i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y)
      }); ctx.stroke()
    }
    const px = Math.floor(playerLng*MPG/TILE_SIZE), py = Math.floor(playerLat*MPL/TILE_SIZE)
    const ppx = ox+(px-minTx)*scale+scale/2, ppy = oy+(maxTy-py)*scale+scale/2
    ctx.strokeStyle = 'rgba(0,245,212,0.4)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(ppx,ppy,5,0,Math.PI*2); ctx.stroke()
    ctx.fillStyle = '#00f5d4'; ctx.beginPath(); ctx.arc(ppx,ppy,3,0,Math.PI*2); ctx.fill()
  }, [tiles.size, playerLat, playerLng, path.length]) // eslint-disable-line

  return (
    <div className="hud-panel p-1" style={{width:SZ+8,height:SZ+24}}>
      <div style={{fontSize:8,letterSpacing:'0.2em',color:'rgba(255,255,255,0.2)',textTransform:'uppercase',textAlign:'center',marginBottom:2}}>Overview</div>
      <canvas ref={ref} width={SZ} height={SZ} style={{borderRadius:4,imageRendering:'pixelated'}} />
    </div>
  )
}
