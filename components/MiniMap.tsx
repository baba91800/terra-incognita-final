'use client'

import { useEffect, useRef } from 'react'
import { TILE_SIZE_METERS } from '@/lib/constants'

interface MiniMapProps {
  discoveredTiles: Set<string>
  playerLat: number
  playerLng: number
  explorationPath: Array<{ lat: number; lng: number }>
}

const METERS_PER_LAT = 111320
const SIZE = 140
const PADDING = 8

export default function MiniMap({ discoveredTiles, playerLat, playerLng, explorationPath }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || discoveredTiles.size === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, SIZE, SIZE)

    // Background
    ctx.fillStyle = '#030810'
    ctx.fillRect(0, 0, SIZE, SIZE)

    const METERS_PER_LNG = METERS_PER_LAT * Math.cos((playerLat * Math.PI) / 180)

    // Collect all tile coords
    const coords: Array<{ tx: number; ty: number }> = []
    discoveredTiles.forEach(key => {
      const [txStr, tyStr] = key.split(':')
      coords.push({ tx: parseInt(txStr), ty: parseInt(tyStr) })
    })

    if (coords.length === 0) return

    const minTx = Math.min(...coords.map(c => c.tx))
    const maxTx = Math.max(...coords.map(c => c.tx))
    const minTy = Math.min(...coords.map(c => c.ty))
    const maxTy = Math.max(...coords.map(c => c.ty))

    const spanX = Math.max(1, maxTx - minTx + 1)
    const spanY = Math.max(1, maxTy - minTy + 1)

    const drawSize = SIZE - PADDING * 2
    const scale = Math.min(drawSize / spanX, drawSize / spanY, 4)
    const offsetX = PADDING + (drawSize - spanX * scale) / 2
    const offsetY = PADDING + (drawSize - spanY * scale) / 2

    // Draw tiles
    coords.forEach(({ tx, ty }) => {
      const x = offsetX + (tx - minTx) * scale
      const y = offsetY + (maxTy - ty) * scale // flip Y
      ctx.fillStyle = 'rgba(0, 245, 212, 0.25)'
      ctx.fillRect(x, y, Math.max(1, scale), Math.max(1, scale))
    })

    // Draw path
    if (explorationPath.length > 1) {
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      explorationPath.forEach((pt, i) => {
        const ptTx = Math.floor((pt.lng * METERS_PER_LNG) / TILE_SIZE_METERS)
        const ptTy = Math.floor((pt.lat * METERS_PER_LAT) / TILE_SIZE_METERS)
        const x = offsetX + (ptTx - minTx) * scale + scale / 2
        const y = offsetY + (maxTy - ptTy) * scale + scale / 2
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }

    // Player dot
    const playerTx = Math.floor((playerLng * METERS_PER_LNG) / TILE_SIZE_METERS)
    const playerTy = Math.floor((playerLat * METERS_PER_LAT) / TILE_SIZE_METERS)
    const px = offsetX + (playerTx - minTx) * scale + scale / 2
    const py = offsetY + (maxTy - playerTy) * scale + scale / 2

    // Pulse ring
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(px, py, 5, 0, Math.PI * 2)
    ctx.stroke()

    // Core dot
    ctx.fillStyle = '#00f5d4'
    ctx.beginPath()
    ctx.arc(px, py, 3, 0, Math.PI * 2)
    ctx.fill()

  }, [discoveredTiles.size, playerLat, playerLng, explorationPath.length]) // eslint-disable-line

  return (
    <div
      className="hud-panel p-1.5"
      style={{ width: SIZE + 12, height: SIZE + 12 }}
    >
      <div className="text-[8px] tracking-[0.2em] text-white/20 uppercase text-center mb-1">Overview</div>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="rounded"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}
