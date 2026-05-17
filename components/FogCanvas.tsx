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

    // Use offscreen canvas for clean compositing
    const offscreen = document.createElement('canvas')
    offscreen.width = canvas.width
    offscreen.height = canvas.height
    const octx = offscreen.getContext('2d', { alpha: true })
    if (!octx) return

    // Step 1: fill offscreen with solid black fog
    octx.fillStyle = 'rgb(2, 5, 15)'
    octx.fillRect(0, 0, offscreen.width, offscreen.height)

    // Step 2: cut holes using destination-out on offscreen
    octx.globalCompositeOperation = 'destination-out'

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
        tileLat < bounds.getSouth() - 0.01 ||
        tileLat > bounds.getNorth() + 0.01 ||
        tileLng < bounds.getWest() - 0.01 ||
        tileLng > bounds.getEast() + 0.01
      ) return

      try {
        const point = map.latLngToContainerPoint([tileLat, tileLng])
        const metersPerPixel = (156543.03392 * Math.cos((tileLat * Math.PI) / 180)) / Math.pow(2, zoom)
        const tilePixels = Math.max(8, TILE_SIZE_METERS / metersPerPixel)
        const radius = tilePixels * 2.0

        // Pure solid erase in center, soft edge only at border
        const gradient = octx.createRadialGradient(
          point.x, point.y, tilePixels * 0.5,
          point.x, point.y, radius
        )
        gradient.addColorStop(0,   'rgba(0,0,0,1)')
        gradient.addColorStop(0.8, 'rgba(0,0,0,1)')
        gradient.addColorStop(1,   'rgba(0,0,0,0)')

        octx.fillStyle = gradient
        octx.beginPath()
        octx.arc(point.x, point.y, radius, 0, Math.PI * 2)
        octx.fill()
      } catch {}
    })

    // Step 3: draw offscreen onto main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(offscreen, 0, 0)

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
