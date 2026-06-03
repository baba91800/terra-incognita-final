import { useEffect, useRef, useState } from 'react'

interface Props {
  playerLat: number
  playerLng: number
  tiles: Set<string>
  cityName: string | null
  onClose: () => void
}

interface BoundaryData {
  name: string
  type: string // city, town, village, suburb...
  areaSqKm: number
  polygon: Array<[number, number]> // lat, lng
}

// ── Fetch frontière via Nominatim + Overpass ─────────────────
async function fetchCityBoundary(lat: number, lng: number): Promise<BoundaryData | null> {
  try {
    // 1. Reverse geocoding pour obtenir l'OSM ID
    const nomRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=12`,
      { headers: { 'User-Agent': 'TerraIncognita/0.1 (https://terra-incognita-final.vercel.app)', 'Accept-Language': 'fr' } }
    )
    const nomData = await nomRes.json()
    const addr = nomData.address || {}
    const name = addr.city || addr.town || addr.village || addr.municipality || 'Localité'
    const osmType = nomData.osm_type // relation, way, node
    const osmId = nomData.osm_id

    if (!osmId) return null

    // 2. Overpass pour récupérer le polygone de la frontière
    const typeChar = osmType === 'relation' ? 'rel' : osmType === 'way' ? 'way' : 'node'
    const query = `[out:json][timeout:15];
${typeChar}(${osmId});
out geom;`

    const ovRes = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST', body: query,
      headers: { 'Content-Type': 'text/plain' },
    })
    const ovData = await ovRes.json()

    if (!ovData.elements?.length) return null

    const el = ovData.elements[0]
    let polygon: Array<[number, number]> = []

    if (el.geometry) {
      polygon = el.geometry.map((pt: any) => [pt.lat, pt.lon] as [number, number])
    } else if (el.members) {
      // Relation — prendre le premier outer way
      const outer = el.members.find((m: any) => m.role === 'outer' && m.geometry)
      if (outer) polygon = outer.geometry.map((pt: any) => [pt.lat, pt.lon] as [number, number])
    }

    if (polygon.length < 3) return null

    // Calculer la surface approximative (formule de Shoelace)
    let area = 0
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length
      area += polygon[i][1] * polygon[j][0]
      area -= polygon[j][1] * polygon[i][0]
    }
    const areaSqDeg = Math.abs(area) / 2
    const MPL = 111320
    const areaSqKm = areaSqDeg * MPL * MPL * Math.cos(lat * Math.PI / 180) / 1_000_000

    return { name, type: addr.city ? 'Ville' : addr.town ? 'Bourg' : 'Village', areaSqKm, polygon }
  } catch { return null }
}

export default function CityBoundary({ playerLat, playerLng, tiles, cityName, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [boundary, setBoundary] = useState<BoundaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [realPercent, setRealPercent] = useState<number | null>(null)

  useEffect(() => {
    fetchCityBoundary(playerLat, playerLng).then(data => {
      setLoading(false)
      if (!data) { setError(true); return }
      setBoundary(data)
    })
  }, [playerLat, playerLng])

  // Calculer le vrai % quand on a la frontière + les tuiles
  useEffect(() => {
    if (!boundary || tiles.size === 0) return

    // Trouver les bounds du polygone
    const lats = boundary.polygon.map(p => p[0])
    const lngs = boundary.polygon.map(p => p[1])
    const minLat = Math.min(...lats), maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)

    const MPL = 111320
    const MPG = MPL * Math.cos(playerLat * Math.PI / 180)
    const TILE_SIZE = 10

    // Compter les tuiles découvertes DANS le polygone
    let tilesInCity = 0
    let totalTilesInCity = 0

    // Estimer le nombre total de tuiles dans la ville
    const tileSpanLat = (maxLat - minLat) * MPL / TILE_SIZE
    const tileSpanLng = (maxLng - minLng) * MPG / TILE_SIZE
    totalTilesInCity = Math.round(tileSpanLat * tileSpanLng * 0.7) // ~70% de terre dans le bbox

    // Compter les tuiles explorées dans le bbox de la ville
    tiles.forEach(key => {
      const [tx, ty] = key.split(':').map(Number)
      const tileLat = (ty + 0.5) * TILE_SIZE / MPL
      const tileLng = (tx + 0.5) * TILE_SIZE / MPG
      if (tileLat >= minLat && tileLat <= maxLat && tileLng >= minLng && tileLng <= maxLng) {
        tilesInCity++
      }
    })

    if (totalTilesInCity > 0) {
      setRealPercent(Math.min(100, (tilesInCity / totalTilesInCity) * 100))
    }
  }, [boundary, tiles, playerLat])

  // Dessiner la carte avec le polygone
  useEffect(() => {
    if (!boundary || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#030810'
    ctx.fillRect(0, 0, W, H)

    const poly = boundary.polygon
    const lats = poly.map(p => p[0])
    const lngs = poly.map(p => p[1])
    const minLat = Math.min(...lats), maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)

    const pad = 40
    const scaleX = (W - pad * 2) / (maxLng - minLng)
    const scaleY = (H - pad * 2 - 80) / (maxLat - minLat)
    const scale = Math.min(scaleX, scaleY)

    const toX = (lng: number) => pad + (lng - minLng) * scale + (W - pad * 2 - (maxLng - minLng) * scale) / 2
    const toY = (lat: number) => H - 80 - pad - (lat - minLat) * scale + (H - 80 - pad * 2 - (maxLat - minLat) * scale) / 2 - (H - 80 - pad * 2 - (maxLat - minLat) * scale) / 2

    // Fond de la ville
    ctx.beginPath()
    poly.forEach(([lat, lng], i) => {
      i === 0 ? ctx.moveTo(toX(lng), toY(lat)) : ctx.lineTo(toX(lng), toY(lat))
    })
    ctx.closePath()
    ctx.fillStyle = 'rgba(0,30,60,0.6)'
    ctx.fill()

    // Grille de tuiles explorées dans la ville
    const MPL = 111320
    const MPG = MPL * Math.cos(playerLat * Math.PI / 180)
    const TILE_SIZE = 10

    tiles.forEach(key => {
      const [tx, ty] = key.split(':').map(Number)
      const tileLat = (ty + 0.5) * TILE_SIZE / MPL
      const tileLng = (tx + 0.5) * TILE_SIZE / MPG
      if (tileLat < minLat || tileLat > maxLat || tileLng < minLng || tileLng > maxLng) return
      const px = toX(tileLng)
      const py = toY(tileLat)
      const sz = Math.max(2, TILE_SIZE * scale * 0.8)
      ctx.fillStyle = 'rgba(0,245,212,0.5)'
      ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz)
    })

    // Contour de la ville
    ctx.beginPath()
    poly.forEach(([lat, lng], i) => {
      i === 0 ? ctx.moveTo(toX(lng), toY(lat)) : ctx.lineTo(toX(lng), toY(lat))
    })
    ctx.closePath()
    ctx.strokeStyle = 'rgba(0,245,212,0.6)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Glow contour
    ctx.beginPath()
    poly.forEach(([lat, lng], i) => {
      i === 0 ? ctx.moveTo(toX(lng), toY(lat)) : ctx.lineTo(toX(lng), toY(lat))
    })
    ctx.closePath()
    ctx.strokeStyle = 'rgba(0,245,212,0.15)'
    ctx.lineWidth = 8
    ctx.stroke()

    // Position joueur
    const px = toX(playerLng)
    const py = toY(playerLat)
    const pulse = (Math.sin(Date.now() * 0.003) + 1) / 2
    const g = ctx.createRadialGradient(px, py, 0, px, py, 12 + pulse * 6)
    g.addColorStop(0, 'rgba(0,245,212,0.6)')
    g.addColorStop(1, 'rgba(0,245,212,0)')
    ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2)
    ctx.fillStyle = g; ctx.fill()
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#00f5d4'; ctx.fill()
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'; ctx.fill()

  }, [boundary, tiles, playerLat, playerLng])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#030810', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(0,245,212,0.1)', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(0,245,212,0.5)', textTransform: 'uppercase', marginBottom: 2 }}>Territoire</div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>
            {loading ? 'Chargement...' : error ? 'Données indisponibles' : boundary?.name || cityName || '—'}
          </div>
        </div>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 16 }}>✕</button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ color: '#00f5d4', fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }} className="animate-pulse">
              Récupération des frontières...
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>Via OpenStreetMap</div>
          </div>
        )}
        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 32 }}>🗺️</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: 12 }}>Frontières non disponibles</div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>pour cette localité</div>
          </div>
        )}
        {boundary && (
          <canvas
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight - 160}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>

      {/* Stats en bas */}
      {boundary && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,245,212,0.1)', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { icon: '🏙️', label: boundary.type, value: boundary.name },
              { icon: '📐', label: 'Surface ville', value: `${boundary.areaSqKm.toFixed(1)} km²` },
              {
                icon: '🗺️', label: '% exploré (réel)',
                value: realPercent !== null ? `${realPercent.toFixed(3)}%` : `${((tiles.size * 100) / Math.max(1, boundary.areaSqKm * 10000)).toFixed(3)}%`
              },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 14 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#00f5d4', fontFamily: 'monospace', marginTop: 2 }}>{s.value}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>Progression</span>
              <span style={{ fontSize: 9, color: '#00f5d4', fontFamily: 'monospace' }}>
                {realPercent !== null ? `${realPercent.toFixed(3)}%` : '—'}
              </span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${realPercent ?? 0}%`, height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, #00b4a0, #00f5d4)',
                boxShadow: '0 0 8px rgba(0,245,212,0.5)',
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
