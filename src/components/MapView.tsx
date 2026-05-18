import { useEffect, useRef, useCallback } from 'react'
import type { Monument } from '../types/game'
import { RARITY_COLORS, TILE_SIZE } from '../lib/constants'

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

  const drawFog = useCallback(() => {
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

    // Fog
    octx.fillStyle = 'rgb(2,5,15)'
    octx.fillRect(0, 0, off.width, off.height)

    // Halos for undiscovered monuments
    octx.globalCompositeOperation = 'source-over'
    monuments.forEach(m => {
      if (m.discovered) return
      try {
        const pt = map.latLngToContainerPoint([m.lat, m.lng])
        const color = RARITY_COLORS[m.rarity]
        const outerR = m.rarity === 'legendary' ? 80 : m.rarity === 'epic' ? 60 : m.rarity === 'rare' ? 45 : 30
        const og = octx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, outerR)
        og.addColorStop(0, color + '55'); og.addColorStop(0.4, color + '33'); og.addColorStop(1, color + '00')
        octx.fillStyle = og; octx.beginPath(); octx.arc(pt.x, pt.y, outerR, 0, Math.PI * 2); octx.fill()
        const innerR = m.rarity === 'legendary' ? 12 : m.rarity === 'epic' ? 9 : m.rarity === 'rare' ? 7 : 5
        const ig = octx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, innerR)
        ig.addColorStop(0, color + 'ff'); ig.addColorStop(1, color + '00')
        octx.fillStyle = ig; octx.beginPath(); octx.arc(pt.x, pt.y, innerR, 0, Math.PI * 2); octx.fill()
      } catch {}
    })

    // Cut holes for discovered tiles
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
        const r = tp * 2.0
        const g = octx.createRadialGradient(pt.x, pt.y, tp * 0.5, pt.x, pt.y, r)
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.8, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)')
        octx.fillStyle = g; octx.beginPath(); octx.arc(pt.x, pt.y, r, 0, Math.PI * 2); octx.fill()
      } catch {}
    })

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(off, 0, 0)
  }, [tiles, playerLat, monuments])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let L: any
    import('leaflet').then(mod => {
      L = mod.default
      const map = L.map(containerRef.current, {
        center: [playerLat, playerLng], zoom: 17,
        zoomControl: false, attributionControl: false,
      })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '©OSM ©CARTO', maxZoom: 19, subdomains: 'abcd',
      }).addTo(map)
      L.control.zoom({ position: 'topright' }).addTo(map)
      L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map)
      playerMarker.current = L.circleMarker([playerLat, playerLng], {
        radius: 8, fillColor: '#00f5d4', fillOpacity: 1, color: '#fff', weight: 2
      }).addTo(map)
      map.on('move zoom moveend zoomend', () => {
        cancelAnimationFrame(animRef.current)
        animRef.current = requestAnimationFrame(drawFog)
      })
      mapRef.current = map
      onMapReady(map)
      drawFog()
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!mapRef.current || !playerMarker.current) return
    playerMarker.current.setLatLng([playerLat, playerLng])
    mapRef.current.panTo([playerLat, playerLng], { animate: true, duration: 0.3 })
  }, [playerLat, playerLng])

  useEffect(() => {
    cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(drawFog)
  }, [drawFog, tiles.size, monuments.length])

  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(({ default: L }) => {
      monuments.forEach(m => {
        const color = RARITY_COLORS[m.rarity]
        const ex = markersRef.current.get(m.id)
        if (ex) {
          ex.setStyle({ fillColor: m.discovered ? color : 'transparent', fillOpacity: m.discovered ? 0.9 : 0, color: m.discovered ? color : 'transparent', weight: m.discovered ? 2 : 0 })
        } else {
          const mk = L.circleMarker([m.lat, m.lng], {
            radius: m.rarity === 'legendary' ? 10 : m.rarity === 'epic' ? 8 : 6,
            fillColor: m.discovered ? color : 'transparent', fillOpacity: m.discovered ? 0.9 : 0,
            color: m.discovered ? color : 'transparent', weight: m.discovered ? 2 : 0,
          }).addTo(mapRef.current)
          mk.bindPopup(`<div style="background:#070f1a;border:1px solid ${color}60;color:#fff;padding:10px;border-radius:8px;min-width:130px;font-family:monospace;"><div style="font-size:18px;text-align:center">${m.icon||'📍'}</div><div style="font-size:9px;color:${color};letter-spacing:0.15em;text-transform:uppercase">${m.rarity}</div><div style="font-size:13px;font-weight:bold">${m.discovered ? m.name : '???'}</div>${m.discovered&&m.discoveredAt?`<div style="font-size:9px;color:#fff3;margin-top:4px">${new Date(m.discoveredAt).toLocaleDateString()}</div>`:''}</div>`, { className: 'custom-popup' })
          markersRef.current.set(m.id, mk)
        }
      })
    })
  }, [monuments])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <canvas ref={fogCanvas} className="absolute inset-0 pointer-events-none" style={{ zIndex: 500 }} />
    </div>
  )
}
