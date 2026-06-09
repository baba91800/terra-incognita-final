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
}

const MPL = 111320

async function fetchCityPolygon(lat: number, lng: number): Promise<[number,number][]|null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=12`,
      { headers: { 'User-Agent':'TerraIncognita/0.1','Accept-Language':'fr' } }
    )
    const d = await r.json()
    const osmType = d.osm_type, osmId = d.osm_id
    if (!osmId) return null
    const tc = osmType==='relation'?'rel':osmType==='way'?'way':'node'
    const q = `[out:json][timeout:15];${tc}(${osmId});out geom;`
    const r2 = await fetch('https://overpass.kumi.systems/api/interpreter',{method:'POST',body:q,headers:{'Content-Type':'text/plain'}})
    const d2 = await r2.json()
    if (!d2.elements?.length) return null
    const el = d2.elements[0]
    let poly: [number,number][] = []
    if (el.geometry) poly = el.geometry.map((p:any)=>[p.lat,p.lon] as [number,number])
    else if (el.members) {
      const outer = el.members.find((m:any)=>m.role==='outer'&&m.geometry)
      if (outer) poly = outer.geometry.map((p:any)=>[p.lat,p.lon] as [number,number])
    }
    return poly.length > 3 ? poly : null
  } catch { return null }
}

export default function MapView({ playerLat, playerLng, tiles, monuments, personalMarkers, onMapReady, onMonumentClick, onLongPress, onMarkerClick, heading, navRoute }: Props) {
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
  const mapMovedRef = useRef(false)

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
    const pulse = Math.sin(time*0.002)*0.5+0.5
    monuments.forEach(m => {
      if (m.discovered) return
      try {
        const pt = map.latLngToContainerPoint([m.lat,m.lng])
        const color = CATEGORY_COLORS[m.type]||(m.rarity==='legendary'?'#a855f7':RARITY_COLORS[m.rarity])
        const baseR = m.rarity==='legendary'?85:m.rarity==='epic'?65:m.rarity==='rare'?48:32
        const outerR = baseR+pulse*(m.rarity==='legendary'?20:m.rarity==='epic'?15:10)
        const baseAlpha = m.rarity==='legendary'?0.4:m.rarity==='epic'?0.35:m.rarity==='rare'?0.3:0.25
        const alpha = baseAlpha+pulse*0.15
        const og = octx.createRadialGradient(pt.x,pt.y,0,pt.x,pt.y,outerR)
        og.addColorStop(0,color+Math.round(alpha*255).toString(16).padStart(2,'0'))
        og.addColorStop(0.5,color+Math.round(alpha*0.5*255).toString(16).padStart(2,'0'))
        og.addColorStop(1,color+'00')
        octx.fillStyle=og; octx.beginPath(); octx.arc(pt.x,pt.y,outerR,0,Math.PI*2); octx.fill()
        const innerR=(m.rarity==='legendary'?14:m.rarity==='epic'?10:m.rarity==='rare'?8:5)+pulse*3
        const ig = octx.createRadialGradient(pt.x,pt.y,0,pt.x,pt.y,innerR)
        ig.addColorStop(0,color+'ff'); ig.addColorStop(0.6,color+'aa'); ig.addColorStop(1,color+'00')
        octx.fillStyle=ig; octx.beginPath(); octx.arc(pt.x,pt.y,innerR,0,Math.PI*2); octx.fill()
      } catch {}
    })
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

  // Init map avec leaflet-rotate
  useEffect(() => {
    if (!containerRef.current||mapRef.current) return
    import('leaflet').then(async ({default:L}) => {
      const map = L.map(containerRef.current!, {
        center:[playerLat,playerLng], zoom:17,
        zoomControl:false, attributionControl:false,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{
        attribution:'©OSM ©CARTO',maxZoom:19,subdomains:'abcd',
      }).addTo(map)

      // Boutons zoom bien positionnés
      L.control.zoom({position:'bottomright'}).addTo(map)
      L.control.attribution({position:'bottomleft',prefix:false}).addTo(map)

      playerMarker.current = L.marker([playerLat,playerLng],{
        icon:L.divIcon({
          html:`<div style="width:16px;height:16px;border-radius:50%;background:#00f5d4;border:2.5px solid white;box-shadow:0 0 10px rgba(0,245,212,0.8)"></div>`,
          className:'',iconSize:[16,16],iconAnchor:[8,8],
        })
      }).addTo(map)

      map.on('dragstart',()=>{ mapMovedRef.current=true; setShowRecenter(true) })

      map.on('click',(e:any) => {
        if (!onMonumentClick) return
        let nearest:Monument|null=null, nearestDist=Infinity
        monuments.forEach(m => {
          if (m.discovered) return
          const d=Math.sqrt(Math.pow(e.latlng.lat-m.lat,2)+Math.pow(e.latlng.lng-m.lng,2))
          if (d<nearestDist&&d<0.001){nearest=m;nearestDist=d}
        })
        if (nearest) onMonumentClick(nearest)
      })

      let pressTimer:ReturnType<typeof setTimeout>|null=null
      map.on('mousedown touchstart',(e:any)=>{
        pressTimer=setTimeout(()=>{
          const latlng=e.latlng||map.mouseEventToLatLng(e.originalEvent)
          if (latlng&&onLongPress) onLongPress(latlng.lat,latlng.lng)
        },600)
      })
      map.on('mouseup touchend mousemove',()=>{if(pressTimer){clearTimeout(pressTimer);pressTimer=null}})
      mapRef.current=map; onMapReady(map)
    })
    return () => { if (mapRef.current){mapRef.current.remove();mapRef.current=null} }
  },[]) // eslint-disable-line

  // Tracé navigation
  useEffect(() => {
    navRoutePoints.current = navRoute || []
  }, [navRoute])

  // Contour de la ville
  useEffect(() => {
    const key=`${playerLat.toFixed(2)},${playerLng.toFixed(2)}`
    if (key===lastCityKey.current) return
    lastCityKey.current=key
    cityPolygonPoints.current = []
    fetchCityPolygon(playerLat, playerLng).then(polygon => {
      if (polygon && polygon.length > 3) {
        cityPolygonPoints.current = polygon
        console.log('Contour ville chargé:', polygon.length, 'points')
      } else {
        console.warn('Contour ville: pas de polygone retourné')
      }
    }).catch(e => console.error('Erreur contour ville:', e))
  },[playerLat,playerLng])

  // Player marker + rotation carte heading-up via leaflet-rotate
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

      if (!mapMovedRef.current) {
        // Rotation fluide via leaflet-rotate
        map.panTo([playerLat,playerLng],{animate:true,duration:0.3})
      }
    })
  },[playerLat,playerLng,heading])

  // Monument markers
  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(({default:L}) => {
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
          ex.setStyle({fillColor:m.discovered?color:'transparent',fillOpacity:m.discovered?0.95:0,color:m.discovered?color:'transparent',weight:m.discovered?2.5:0})
        } else {
          const mk=L.circleMarker([m.lat,m.lng],{
            radius:m.rarity==='legendary'?11:m.rarity==='epic'?9:7,
            fillColor:m.discovered?color:'transparent',fillOpacity:m.discovered?0.95:0,
            color:m.discovered?color:'transparent',weight:m.discovered?2.5:0,
          }).addTo(mapRef.current)
          mk.bindPopup(`<div style="background:rgba(5,12,24,0.97);border:1px solid ${color}70;color:#fff;padding:12px 16px;border-radius:10px;min-width:140px;font-family:monospace;">
            <div style="font-size:22px;text-align:center;margin-bottom:6px">${m.icon||'📍'}</div>
            <div style="font-size:9px;color:${color};letter-spacing:0.2em;text-transform:uppercase;margin-bottom:4px">${m.rarity}</div>
            <div style="font-size:13px;font-weight:bold">${m.discovered?m.name:'???'}</div>
            ${m.discovered&&m.discoveredAt?`<div style="font-size:9px;color:rgba(255,255,255,0.25);margin-top:6px">${new Date(m.discoveredAt).toLocaleDateString()}</div>`:''}
          </div>`,{className:'custom-popup'})
          markersRef.current.set(m.id,mk)
        }
      })
    })
  },[monuments])

  // Personal markers
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
      <canvas ref={fogCanvas} className="absolute inset-0 pointer-events-none" style={{zIndex:500}} />
      <DiscoveryEffect effects={effects} />
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
