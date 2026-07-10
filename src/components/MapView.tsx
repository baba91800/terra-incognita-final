import { useEffect, useRef, useCallback, useState } from 'react'
import type { Monument, PersonalMarker } from '../types/game'
import { RARITY_COLORS, TILE_SIZE } from '../lib/constants'
import { CATEGORY_COLORS } from '../lib/overpass'
import DiscoveryEffect, { type Effect } from './DiscoveryEffect'

interface Props {
  onMonumentClick?: (m: Monument) => void
  onLongPress?: (lat: number, lng: number) => void
  onMarkerClick?: (m: PersonalMarker) => void
  playerLat: number; playerLng: number
  tiles: Set<string>; monuments: Monument[]
  personalMarkers: PersonalMarker[]
  heading: number | null
  navRoute?: [number,number][]
  onMapReady: (map: any) => void
  onZoomMin?: () => void
}

const MPL = 111320

async function fetchCityPolygon(lat: number, lng: number): Promise<[number,number][]|null> {
  const cacheKey = `ti2_city_poly_v2_${(lat/0.05).toFixed(0)}_${(lng/0.05).toFixed(0)}`
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const poly = JSON.parse(cached)
      if (poly?.length > 3) return poly
    }
  } catch {}
  try {
    // Étape 1 : trouver le nom de la commune via reverse geocoding
    const rev = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&addressdetails=1`,
      { headers: { 'User-Agent': 'TerraIncognita/0.1', 'Accept-Language': 'fr' } }
    )
    if (!rev.ok) return null
    const revData = await rev.json()
    const addr = revData.address || {}
    const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet
    if (!cityName) return null

    // Étape 2 : chercher la commune par nom avec polygon_geojson=1
    const search = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=geojson&limit=5&polygon_geojson=1&addressdetails=1&countrycodes=fr`,
      { headers: { 'User-Agent': 'TerraIncognita/0.1', 'Accept-Language': 'fr' } }
    )
    if (!search.ok) return null
    const searchData = await search.json()

    // Trouver le résultat qui est une commune (type=administrative, class=boundary)
    const feature = searchData.features?.find((f: any) =>
      f.properties?.type === 'administrative' ||
      f.properties?.addresstype === 'municipality' ||
      f.properties?.addresstype === 'city' ||
      f.properties?.addresstype === 'town' ||
      f.properties?.addresstype === 'village'
    ) || searchData.features?.[0]

    if (!feature?.geometry) return null
    const geom = feature.geometry
    let poly: [number,number][] = []

    if (geom.type === 'Polygon') {
      poly = geom.coordinates[0].map(([lng, lat]: [number,number]) => [lat, lng] as [number,number])
    } else if (geom.type === 'MultiPolygon') {
      const largest = geom.coordinates.reduce((a: any, b: any) => a[0].length > b[0].length ? a : b)
      poly = largest[0].map(([lng, lat]: [number,number]) => [lat, lng] as [number,number])
    }

    if (poly.length > 3) {
      try { localStorage.setItem(cacheKey, JSON.stringify(poly)) } catch {}
      return poly
    }
    return null
  } catch { return null }
}

export default function MapView({ playerLat, playerLng, tiles, monuments, personalMarkers, onMapReady, onMonumentClick, onLongPress, onMarkerClick, heading, navRoute, onZoomMin }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const playerMarker = useRef<any>(null)
  const fogCanvas = useRef<HTMLCanvasElement>(null)
  const personalMarkersRef = useRef<Map<string,any>>(new Map())
  const markersRef = useRef<Map<string,any>>(new Map())
  const cityPolygonPoints = useRef<[number,number][]>([])
  const navRoutePoints = useRef<[number,number][]>([])
  const animRef = useRef<number>(0)
  const [effects, setEffects] = useState<Effect[]>([])
  const prevMonuments = useRef<Set<string>>(new Set())
  const lastCityKey = useRef('')
  const [showRecenter, setShowRecenter] = useState(false)
  const [selectedMonument, setSelectedMonument] = useState<Monument|null>(null)
  const [currentHeading, setCurrentHeading] = useState<number|null>(null)
  const mapMovedRef = useRef(false)
  const longPressTimer = useRef<any>(null)
  const longPressStart = useRef<{x:number,y:number}|null>(null)
  const monumentsRef = useRef<Monument[]>([])

  useEffect(() => { monumentsRef.current = monuments }, [monuments])

  const drawFog = useCallback((time: number = 0) => {
    const map = mapRef.current
    const canvas = fogCanvas.current
    if (!map || !canvas) return
    const size = map.getSize()
    if (canvas.width !== size.x || canvas.height !== size.y) {
      canvas.width = size.x; canvas.height = size.y
    }
    const ctx = canvas.getContext('2d',{alpha:true})!
    const off = document.createElement('canvas')
    off.width = canvas.width; off.height = canvas.height
    const octx = off.getContext('2d',{alpha:true})!
    octx.fillStyle = 'rgb(2,5,15)'
    octx.fillRect(0,0,off.width,off.height)
    octx.globalCompositeOperation = 'source-over'

    {
      const pulse = Math.sin(time*0.002)*0.5+0.5
      monuments.forEach(m => {
        if (m.discovered) return
        try {
          const pt = map.latLngToContainerPoint([m.lat,m.lng])
          const color = CATEGORY_COLORS[m.type]||(m.rarity==='legendary'?'#a855f7':RARITY_COLORS[m.rarity])
          const baseR = m.rarity==='legendary'?45:m.rarity==='epic'?35:m.rarity==='rare'?28:20
          const outerR = baseR+pulse*(m.rarity==='legendary'?8:m.rarity==='epic'?6:4)
          const baseAlpha = m.rarity==='legendary'?0.75:m.rarity==='epic'?0.65:m.rarity==='rare'?0.55:0.48
          const alpha = baseAlpha+pulse*0.15
          const og = octx.createRadialGradient(pt.x,pt.y,0,pt.x,pt.y,outerR)
          og.addColorStop(0,color+Math.round(alpha*255).toString(16).padStart(2,'0'))
          og.addColorStop(0.5,color+Math.round(alpha*0.5*255).toString(16).padStart(2,'0'))
          og.addColorStop(1,color+'00')
          octx.fillStyle=og; octx.beginPath(); octx.arc(pt.x,pt.y,outerR,0,Math.PI*2); octx.fill()
          const innerR=(m.rarity==='legendary'?10:m.rarity==='epic'?8:m.rarity==='rare'?6:4)+pulse*2
          const ig = octx.createRadialGradient(pt.x,pt.y,0,pt.x,pt.y,innerR)
          ig.addColorStop(0,color+'ff'); ig.addColorStop(0.6,color+'aa'); ig.addColorStop(1,color+'00')
          octx.fillStyle=ig; octx.beginPath(); octx.arc(pt.x,pt.y,innerR,0,Math.PI*2); octx.fill()
        } catch {}
      })
    }

    octx.globalCompositeOperation = 'destination-out'
    const bounds = map.getBounds()
    const zoom = map.getZoom()
    const MPG = MPL*Math.cos(playerLat*Math.PI/180)
    tiles.forEach(key => {
      const [tx,ty] = key.split(':').map(Number)
      const tLat=(ty+0.5)*TILE_SIZE/MPL, tLng=(tx+0.5)*TILE_SIZE/MPG
      if (tLat<bounds.getSouth()-0.01||tLat>bounds.getNorth()+0.01) return
      if (tLng<bounds.getWest()-0.01||tLng>bounds.getEast()+0.01) return
      try {
        const pt = map.latLngToContainerPoint([tLat,tLng])
        const mpp=(156543.03392*Math.cos(tLat*Math.PI/180))/Math.pow(2,zoom)
        const tp=Math.max(8,TILE_SIZE/mpp)
        const r=tp*2.2
        const g=octx.createRadialGradient(pt.x,pt.y,tp*0.3,pt.x,pt.y,r)
        g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(0.82,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)')
        octx.fillStyle=g; octx.beginPath(); octx.arc(pt.x,pt.y,r,0,Math.PI*2); octx.fill()
      } catch {}
    })
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.drawImage(off,0,0)

    // Tracé de navigation PAR-DESSUS le fog
    if (navRoutePoints.current.length > 1) {
      try {
        ctx.save()
        ctx.setLineDash([14, 8])
        ctx.strokeStyle = 'rgba(0,245,212,0.95)'
        ctx.lineWidth = 5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.shadowColor = '#00f5d4'
        ctx.shadowBlur = 12
        ctx.beginPath()
        let firstNav = true
        navRoutePoints.current.forEach(([lat, lng]) => {
          try {
            const pt = map.latLngToContainerPoint([lat, lng])
            if (firstNav) { ctx.moveTo(pt.x, pt.y); firstNav = false }
            else ctx.lineTo(pt.x, pt.y)
          } catch {}
        })
        ctx.stroke()
        ctx.restore()
      } catch {}
    }

    // Monuments découverts — dessinés sur le canvas (persistants)
    monuments.filter(m => m.discovered).forEach(m => {
      try {
        const pt = map.latLngToContainerPoint([m.lat, m.lng])
        const color = RARITY_COLORS[m.rarity]
        const size = m.rarity === 'legendary' ? 20 : m.rarity === 'epic' ? 17 : m.rarity === 'rare' ? 15 : 13

        // Cercle fond
        ctx.save()
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(5,12,24,0.92)'
        ctx.fill()
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.shadowColor = color
        ctx.shadowBlur = 8
        ctx.stroke()
        ctx.restore()

        // Emoji
        ctx.save()
        ctx.font = `${size}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(m.icon || '📍', pt.x, pt.y)
        ctx.restore()
      } catch {}
    })

    // Contour ville PAR-DESSUS le fog
    if (cityPolygonPoints.current.length > 2) {
      try {
        const pulse2 = Math.sin(time * 0.0015) * 0.25 + 0.65
        ctx.save()
        ctx.setLineDash([10, 7])
        ctx.strokeStyle = `rgba(0,245,212,${pulse2})`
        ctx.lineWidth = 2
        ctx.shadowColor = '#00f5d4'
        ctx.shadowBlur = 8
        ctx.beginPath()
        let first = true
        cityPolygonPoints.current.forEach(([lat, lng]) => {
          try {
            const pt = map.latLngToContainerPoint([lat, lng])
            if (first) { ctx.moveTo(pt.x, pt.y); first = false }
            else ctx.lineTo(pt.x, pt.y)
          } catch {}
        })
        ctx.closePath()
        ctx.stroke()
        ctx.restore()
      } catch {}
    }
  },[tiles,playerLat,monuments])

  useEffect(() => {
    let running = true
    const loop = (t:number) => {
      if (!running) return
      drawFog(t)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => { running=false; cancelAnimationFrame(animRef.current) }
  },[drawFog])

  useEffect(() => {
    if (!containerRef.current||mapRef.current) return
    import('leaflet').then(async ({default:L}) => {
      const map = L.map(containerRef.current!, {
        center:[playerLat,playerLng], zoom:17,
        zoomControl:false, attributionControl:false,
        zoomSnap:0.5, zoomDelta:0.5,
      })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{
        attribution:'©OSM ©CARTO',maxZoom:19,subdomains:'abcd',
      }).addTo(map)
      L.control.zoom({position:'bottomright'}).addTo(map)
      L.control.attribution({position:'bottomleft',prefix:false}).addTo(map)
      playerMarker.current = L.marker([playerLat,playerLng],{
        icon:L.divIcon({
          html:`<div style="width:16px;height:16px;border-radius:50%;background:#00f5d4;border:2.5px solid white;box-shadow:0 0 10px rgba(0,245,212,0.8)"></div>`,
          className:'',iconSize:[16,16],iconAnchor:[8,8],
        })
      }).addTo(map)
      map.on('dragstart',()=>{ mapMovedRef.current=true; setShowRecenter(true) })
      map.on('zoom', () => { if (map.getZoom() <= 3 && onZoomMin) onZoomMin() })
      map.on('click',(e:any) => {
        let nearest:Monument|null=null, nearestDist=Infinity
        // Chercher monument découvert ou non
        monumentsRef.current.forEach(m => {
          const d=Math.sqrt(Math.pow(e.latlng.lat-m.lat,2)+Math.pow(e.latlng.lng-m.lng,2))
          if (d<nearestDist&&d<0.003){nearest=m;nearestDist=d}
        })
        if (nearest) {
          if (nearest.discovered) {
            setSelectedMonument(nearest)
          } else if (onMonumentClick) {
            onMonumentClick(nearest)
          }
        }
      })
      // Appui long géré via overlay div
      mapRef.current=map; onMapReady(map)
    })
    return () => { if (mapRef.current){mapRef.current.remove();mapRef.current=null} }
  },[]) // eslint-disable-line

  useEffect(() => {
    navRoutePoints.current = navRoute || []
  }, [navRoute])

  useEffect(() => {
    if (Math.abs(playerLat - 48.8566) < 0.001 && Math.abs(playerLng - 2.3522) < 0.001) return
    const key=`${(playerLat/0.05).toFixed(0)},${(playerLng/0.05).toFixed(0)}`
    if (key===lastCityKey.current) return
    lastCityKey.current=key
    fetchCityPolygon(playerLat, playerLng).then(polygon => {
      if (polygon && polygon.length > 3) {
        cityPolygonPoints.current = polygon
      }
    }).catch(() => {})
  },[playerLat,playerLng])

  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(({default:L}) => {
      const map=mapRef.current!; if (!map) return
      const icon = L.divIcon({
        html:`<div style="width:18px;height:18px;border-radius:50%;background:#00f5d4;border:3px solid white;box-shadow:0 0 12px rgba(0,245,212,0.9)"></div>`,
        className:'',iconSize:[18,18],iconAnchor:[9,9],
      })
      if (playerMarker.current) {
        playerMarker.current.setLatLng([playerLat,playerLng])
        playerMarker.current.setIcon(icon)
      } else {
        playerMarker.current=L.marker([playerLat,playerLng],{icon}).addTo(map)
      }
      setCurrentHeading(heading)
      if (!mapMovedRef.current) {
        map.panTo([playerLat,playerLng],{animate:true,duration:0.5})
// heading-up désactivé — cause désalignement fog
      }
    })
  },[playerLat,playerLng,heading])

  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(({default:L}) => {
      // Nettoyer les marqueurs qui ne sont plus dans la liste
      // MAIS préserver les monuments découverts même s'ils ne sont plus dans la liste chargée
      const currentIds = new Set(monuments.map(m => m.id))
      markersRef.current.forEach((mk, id) => {
        const isDiscovered = (mk as any)._isDiscovered
        if (!currentIds.has(id) && !isDiscovered) {
          mk.remove()
          markersRef.current.delete(id)
        }
      })

      monuments.forEach(m => {
        const color=RARITY_COLORS[m.rarity]
        const ex=markersRef.current.get(m.id)
        if (m.discovered&&!prevMonuments.current.has(m.id)) {
          prevMonuments.current.add(m.id)
          try {
            const pt=mapRef.current.latLngToContainerPoint([m.lat,m.lng])
            const effect:Effect={id:m.id+Date.now(),x:pt.x,y:pt.y,label:m.name,color,points:m.rarity==='legendary'?1000:m.rarity==='epic'?300:m.rarity==='rare'?150:50}
            setEffects(prev=>[...prev,effect])
            setTimeout(()=>setEffects(prev=>prev.filter(e=>e.id!==effect.id)),3500)
          } catch {}
        } else if (m.discovered) prevMonuments.current.add(m.id)
        if (ex) {
          if (m.discovered && (ex as any)._isCircleMarker) {
            ex.remove()
            markersRef.current.delete(m.id)
            // Recréer comme marker emoji — tombe dans le else ci-dessous
          } else {
            return // marqueur déjà correct
          }
        }
        if (!markersRef.current.has(m.id)) {
          const mk = m.discovered
            ? L.marker([m.lat,m.lng], {
                icon: L.divIcon({
                  html: `<div style="width:32px;height:32px;border-radius:50%;background:rgba(5,12,24,0.9);border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 10px ${color}80">${m.icon||'📍'}</div>`,
                  className:'',iconSize:[32,32],iconAnchor:[16,16],
                })
              }).addTo(mapRef.current)
            : (() => {
                const cm = L.circleMarker([m.lat,m.lng],{
                  radius:m.rarity==='legendary'?11:m.rarity==='epic'?9:7,
                  fillColor:'transparent',fillOpacity:0,
                  color:'transparent',weight:0,
                }).addTo(mapRef.current);
                (cm as any)._isCircleMarker = true;
                return cm;
              })()
          if (m.discovered) {
            mk.on('click', () => mk.openPopup())
            ;(mk as any)._isDiscovered = true
          }
          mk.bindPopup(`<div style="background:rgba(5,12,24,0.97);border:1px solid ${color}70;color:#fff;padding:12px 16px;border-radius:10px;min-width:140px;font-family:monospace;">
            <div style="font-size:22px;text-align:center;margin-bottom:6px">${m.icon||'📍'}</div>
            <div style="font-size:9px;color:${color};letter-spacing:0.2em;text-transform:uppercase;margin-bottom:4px">${m.rarity}</div>
            <div style="font-size:13px;font-weight:bold">${m.discovered?m.name:'???'}</div>
            ${m.discovered&&m.discoveredAt?`<div style="font-size:9px;color:rgba(255,255,255,0.25);margin-top:6px">${new Date(m.discoveredAt).toLocaleDateString()}</div>`:''}
          </div>`,{className:'custom-popup',maxWidth:200})
          markersRef.current.set(m.id,mk)
        }
      })
    })
  },[monuments])

  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(({default:L}) => {
      const map=mapRef.current!
      personalMarkersRef.current.forEach((mk,id)=>{
        if (!personalMarkers.find(m=>m.id===id)){mk.remove();personalMarkersRef.current.delete(id)}
      })
      personalMarkers.forEach(m => {
        const existing=personalMarkersRef.current.get(m.id)
        if (existing){existing.setLatLng([m.lat,m.lng]);return}
        const mk=L.marker([m.lat,m.lng],{
          icon:L.divIcon({
            html:`<div style="width:36px;height:36px;border-radius:50%;background:rgba(5,12,24,0.95);border:2px solid rgba(255,200,50,0.7);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 12px rgba(255,200,50,0.4);cursor:pointer">${m.icon}</div>`,
            className:'',iconSize:[36,36],iconAnchor:[18,18],
          })
        }).addTo(map)
        mk.on('click',()=>onMarkerClick&&onMarkerClick(m))
        personalMarkersRef.current.set(m.id,mk)
      })
    })
  },[personalMarkers])

  const recenter = () => {
    if (!mapRef.current) return
    mapRef.current.setView([playerLat,playerLng], 17, {animate:true,duration:0.5})
    mapMovedRef.current = false
    setShowRecenter(false)
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {/* Overlay pour appui long */}
      <div
        style={{ position:'absolute', inset:0, zIndex:499, pointerEvents: onLongPress ? 'auto' : 'none' }}
        onTouchStart={e => {
          const t = e.touches[0]
          longPressStart.current = { x: t.clientX, y: t.clientY }
          longPressTimer.current = setTimeout(() => {
            if (!mapRef.current || !longPressStart.current) return
            const map = mapRef.current
            const rect = containerRef.current!.getBoundingClientRect()
            const x = longPressStart.current.x - rect.left
            const y = longPressStart.current.y - rect.top
            const latlng = map.containerPointToLatLng([x, y])
            if (onLongPress) onLongPress(latlng.lat, latlng.lng)
          }, 600)
        }}
        onTouchMove={e => {
          if (!longPressStart.current || !longPressTimer.current) return
          const t = e.touches[0]
          const dx = t.clientX - longPressStart.current.x
          const dy = t.clientY - longPressStart.current.y
          if (Math.sqrt(dx*dx+dy*dy) > 8) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
          }
        }}
        onTouchEnd={() => {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
          longPressStart.current = null
        }}
      />
      <canvas ref={fogCanvas} className="absolute inset-0 pointer-events-none" style={{zIndex:500}} />
      <DiscoveryEffect effects={effects} />
      {selectedMonument && (
        <div style={{
          position:'absolute', bottom:120, left:'50%', transform:'translateX(-50%)',
          zIndex:600, background:'rgba(5,12,24,0.97)',
          border:`1px solid ${RARITY_COLORS[selectedMonument.rarity]}50`,
          borderRadius:16, padding:'16px 20px', minWidth:220,
          boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
        }}>
          <button onClick={()=>setSelectedMonument(null)} style={{position:'absolute',top:8,right:8,background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:16}}>✕</button>
          <div style={{textAlign:'center',fontSize:32,marginBottom:8}}>{selectedMonument.icon||'📍'}</div>
          <div style={{fontSize:9,color:RARITY_COLORS[selectedMonument.rarity],letterSpacing:'0.15em',textTransform:'uppercase',textAlign:'center',marginBottom:4}}>{selectedMonument.rarity}</div>
          <div style={{fontSize:14,fontWeight:'bold',color:'#fff',textAlign:'center',marginBottom:4}}>{selectedMonument.name}</div>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',textAlign:'center'}}>{selectedMonument.type}</div>
          {selectedMonument.discoveredAt && <div style={{fontSize:9,color:'rgba(255,255,255,0.25)',textAlign:'center',marginTop:8}}>Découvert le {new Date(selectedMonument.discoveredAt).toLocaleDateString()}</div>}
        </div>
      )}

      {showRecenter && (
        <button onClick={recenter} style={{
          position:'absolute',bottom:200,right:12,zIndex:600,
          width:44,height:44,borderRadius:10,
          background:'rgba(5,12,24,0.94)',border:'1px solid rgba(0,245,212,0.3)',
          color:'#00f5d4',cursor:'pointer',fontSize:20,
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 0 16px rgba(0,0,0,0.5)',
        }}>🎯</button>
      )}
    </div>
  )
}

export {}
