'use client'

import { useEffect, useRef, useCallback } from 'react'
import { TILE_SIZE_METERS } from '@/lib/constants'

interface FogCanvasProps {
  mapRef: React.RefObject<L.Map | null>
  discoveredTiles: Set<string>
  playerLat: number
  playerLng: number
}

const METERS_PER_LAT = 111320

export default function FogCanvas({ mapRef, discoveredTiles, playerLat, playerLng }: FogCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  const draw = useCallback(() => {
    const map = mapRef.current
    const canvas = canvasRef.current
    if (!map || !canvas) return

    const size = map.getSize()
    if (canvas.width !== size.x || canvas.height !== size.y) {
      canvas.width = size.x
      canvas.height = size.y
    }

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Step 1: clear to fully transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Step 2: fill entire canvas with dense fog
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'rgba(2, 5, 15, 0.97)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Step 3: destination-out = source alpha erases destination
    // rgba center alpha=1 → fog alpha becomes 0 → map 100% visible
    // rgba edge alpha=0   → fog untouched → stays black
    ctx.globalCompositeOperation = 'destination-out'

    const bounds = map.getBounds()
    const zoom = map.getZoom()
    const METERS_PER_LNG = METERS_PER_LAT * Math.cos((playerLat * Math.PI) / 180)

    discoveredTiles.forEach(key => {
      const [txStr, tyStr] = key.split(':')
      const tx = parseInt(txStr, 10)
      const ty = parseInt(tyStr, 10)

      const tileLat = (ty + 0.5) * TILE_SIZE_METERS / METERS_PER_LAT
      const tileLng = (tx + 0.5) * TILE_SIZE_METERS / METERS_PER_LNG

      if (
        tileLat < bounds.getSouth() - 0.008 ||
        tileLat > bounds.getNorth() + 0.008 ||
        tileLng < bounds.getWest() - 0.008 ||
        tileLng > bounds.getEast() + 0.008
      ) return

      try {
        const point = map.latLngToContainerPoint([tileLat, tileLng])
        const metersPerPixel = (156543.03392 * Math.cos((tileLat * Math.PI) / 180)) / Math.pow(2, zoom)
        const tilePixels = Math.max(6, TILE_SIZE_METERS / metersPerPixel)
        const radius = tilePixels * 1.6

        const gradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, radius
        )
        gradient.addColorStop(0,    'rgba(0, 0, 0, 1)')
        gradient.addColorStop(0.75, 'rgba(0, 0, 0, 1)')
        gradient.addColorStop(0.92, 'rgba(0, 0, 0, 0.5)')
        gradient.addColorStop(1,    'rgba(0, 0, 0, 0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
        ctx.fill()
      } catch {}
    })

    ctx.globalCompositeOperation = 'source-over'

  }, [discoveredTiles, playerLat, mapRef])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const onMove = () => {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = requestAnimationFrame(draw)
    }

    map.on('move zoom moveend zoomend', onMove)
    draw()

    return () => {
      map.off('move zoom moveend zoomend', onMove)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [mapRef, draw])

  useEffect(() => {
    cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = requestAnimationFrame(draw)
  }, [discoveredTiles.size, draw])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 500 }}
    />
  )
}
