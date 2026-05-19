import { useEffect, useRef, useCallback, useState } from 'react'
import type { Monument } from '../types/game'
import { RARITY_COLORS, TILE_SIZE } from '../lib/constants'
import DiscoveryEffect, { type Effect } from './DiscoveryEffect'

interface Props {
  playerLat: number; playerLng: number
  tiles: Set<string>; monuments: Monument[]
  onMapReady: (map: any) => void
}

const MPL = 111320

export default function MapView({ playerLat, playerLng, tiles, monuments, onMapReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const playerMarker = useRef<any>(null)
  const fogCanvas = useRef<HTMLCanvasElement>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const animRef = useRef<number>(0)
  const timeRef = useRef<number>(0)
  const [effects, setEffects] = useState<Effect[]>([])
  const prevMonuments = useRef<Set<string>>(new Set())

  const drawFog = useCallback((time: number = 0) => {
    const map = mapRef.current
    const canvas = fogCanvas.current
    if (!map || !canvas) return
    const size = map.getSize()
    if (canvas.width !== size.x || canvas.height !== size.y) {
      canvas.width = size.x; canvas.height = size.y
    }
    const ctx = canvas.getContext('2d', { alpha: true })!
    const off = document.createElement('canvas')
    off.width = canvas.width; off.height = canvas.height
    const octx = off.getContext('2d', { alpha: true })!

    // Fog base
    octx.fillStyle = 'rgb(2,5,15)'
    octx.fillRect(0, 0, off.width, off.height)

    // Pulsing halos for undiscovered monuments
    octx.globalCompositeOperation = 'source-over'
    const pulse = Math.sin(time * 0.002) * 0.5 + 0.5 // 0 to 1

    monuments.forEach(m => {
      if (m.discovered) return
      try {
        const pt = map.latLngToContainerPoint([m.lat, m.lng])
        const color = RARITY_COLORS[m.rarity]

        // Pulsing outer glow
        const baseR = m.rarity === 'legendary' ? 85 : m.rarity === 'epic' ? 65 : m.rarity === 'rare' ? 48 : 32
        const outerR = baseR + pulse * (m.rarity === 'legendary' ? 20 : m.rarity === 'epic' ? 15 : 10)
        const baseAlpha = m.rarity === 'legendary' ? 0.4 : m.rarity === 'epic' ? 0.35 : m.rarity === 'rare' ? 0.3 : 0.25
        const alpha = baseAlpha + pulse * 0.15

        const og = octx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, outerR)
        og.addColorStop(0, color + Math.round(alpha * 255).toString(16).padStart(2,'0'))
        og.addColorStop(0.5, color + Math.round(alpha * 0.5 * 255).toString(16).padStart(2,'0'))
        og.addColorStop(1, color + '00')
        octx.fillStyle = og; octx.beginPath(); octx.arc(pt.x, pt.y, outerR, 0, Math.PI * 2); octx.fill()

        // Bright pulsing core
        const innerR = (m.rarity === 'legendary' ? 14 : m.rarity === 'epic' ? 10 : m.rarity === 'rare' ? 8 : 5) + pulse * 3
        const ig = octx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, innerR)
        ig.addColorStop(0, color + 'ff'); ig.addColorStop(0.6, color + 'aa'); ig.addColorStop(1, color + '00')
        octx.fillStyle = ig; octx.beginPath(); octx.arc(pt.x, pt.y, innerR, 0, Math.PI * 2); octx.fill()
      } catch {}
    })

    // Cut holes — discovered tiles
    octx.globalCompositeOperation = 'destination-out'
    const bounds = map.getBounds()
    const zoom = map.getZoom()
    const MPG = MPL * Math.cos(playerLat * Math.PI / 180)

    tiles.forEach(key => {
      const [tx, ty] = key.split(':').map(Number)
      const tLat = (ty + 0.5) * TILE_SIZE / MPL
      const tLng = (tx + 0.5) * TILE_SIZE / MPG
      if (tLat < bounds.getSouth() - 0.01 || tLat > bounds.getNorth() + 0.01) return
      if (tLng < bounds.getWest() - 0.01 || tLng > bounds.getEast() + 0.01) return
      try {
        const pt = map.latLngToContainerPoint([tLat, tLng])
        const mpp = (156543.03392 * Math.cos(tLat * Math.PI / 180)) / Math.pow(2, zoom)
        const tp = Math.max(8, TILE_SIZE / mpp)
        const r = tp * 2.2
        const g = octx.createRadialGradient(pt.x, pt.y, tp * 0.3, pt.x, pt.y, r)
        g.addColorStop(0, 'rgba(0,0,0,1)')
        g.addColorStop(0.82, 'rgba(0,0,0,1)')
        g.addColorStop(1, 'rgba(0,0,0,0)')
        octx.fillStyle = g; octx.beginPath(); octx.arc(pt.x, pt.y, r, 0, Math.PI * 2); octx.fill()
      } catch {}
    })

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(off, 0, 0)
  }, [tiles, playerLat, monuments])

  // Animation loop for pulsing halos
  useEffect(() => {
    let running = true
    const loop = (t: number) => {
      if (!running) return
      timeRef.current = t
      drawFog(t)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => { running = false; cancelAnimationFrame(animRef.current) }
  }, [drawFog])

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    import('leaflet').then(({ default: L }) => {
      const map = L.map(containerRef.current!, {
        center: [playerLat, playerLng], zoom: 17,
        zoomControl: false, attributionControl: false,
      })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '©OSM ©CARTO', maxZoom: 19, subdomains: 'abcd',
      }).addTo(map)
      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map)
      playerMarker.current = L.circleMarker([playerLat, playerLng], {
        radius: 9, fillColor: '#00f5d4', fillOpacity: 1, color: '#fff', weight: 2.5
      }).addTo(map)
      mapRef.current = map
      onMapReady(map)
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, []) // eslint-disable-line

  // Player movement
  useEffect(() => {
    if (!mapRef.current || !playerMarker.current) return
    playerMarker.current.setLatLng([playerLat, playerLng])
    mapRef.current.panTo([playerLat, playerLng], { animate: true, duration: 0.4 })
  }, [playerLat, playerLng])

  // Monument markers + discovery effects
  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(({ default: L }) => {
      monuments.forEach(m => {
        const color = RARITY_COLORS[m.rarity]
        const ex = markersRef.current.get(m.id)

        // Check if just discovered → trigger effect
        if (m.discovered && !prevMonuments.current.has(m.id)) {
          prevMonuments.current.add(m.id)
          try {
            const pt = mapRef.current.latLngToContainerPoint([m.lat, m.lng])
            const effect: Effect = {
              id: m.id + Date.now(),
              x: pt.x, y: pt.y,
              label: m.name,
              color,
              points: m.rarity === 'legendary' ? 1000 : m.rarity === 'epic' ? 300 : m.rarity === 'rare' ? 150 : 50,
            }
            setEffects(prev => [...prev, effect])
            setTimeout(() => setEffects(prev => prev.filter(e => e.id !== effect.id)), 3500)
          } catch {}
        } else if (m.discovered) {
          prevMonuments.current.add(m.id)
        }

        if (ex) {
          ex.setStyle({
            fillColor: m.discovered ? color : 'transparent',
            fillOpacity: m.discovered ? 0.95 : 0,
            color: m.discovered ? color : 'transparent',
            weight: m.discovered ? 2.5 : 0,
          })
        } else {
          const mk = L.circleMarker([m.lat, m.lng], {
            radius: m.rarity === 'legendary' ? 11 : m.rarity === 'epic' ? 9 : 7,
            fillColor: m.discovered ? color : 'transparent',
            fillOpacity: m.discovered ? 0.95 : 0,
            color: m.discovered ? color : 'transparent',
            weight: m.discovered ? 2.5 : 0,
          }).addTo(mapRef.current)
          mk.bindPopup(`
            <div style="background:rgba(5,12,24,0.97);border:1px solid ${color}70;color:#fff;padding:12px 16px;border-radius:10px;min-width:140px;font-family:monospace;box-shadow:0 0 24px ${color}30;">
              <div style="font-size:22px;text-align:center;margin-bottom:6px">${m.icon||'📍'}</div>
              <div style="font-size:9px;color:${color};letter-spacing:0.2em;text-transform:uppercase;margin-bottom:4px">${m.rarity}</div>
              <div style="font-size:13px;font-weight:bold">${m.discovered ? m.name : '???'}</div>
              ${m.discovered&&m.discoveredAt?`<div style="font-size:9px;color:rgba(255,255,255,0.25);margin-top:6px">${new Date(m.discoveredAt).toLocaleDateString()}</div>`:''}
            </div>
          `, { className: 'custom-popup' })
          markersRef.current.set(m.id, mk)
        }
      })
    })
  }, [monuments])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <canvas ref={fogCanvas} className="absolute inset-0 pointer-events-none" style={{ zIndex: 500 }} />
      <DiscoveryEffect effects={effects} />
    </div>
  )
}
