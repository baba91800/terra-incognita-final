// Territoire — surface réelle via OSM

export interface TerritoryData {
  city: string | null
  department: string | null
  country: string | null
  lastUpdated: string
  cityAreaKm2?: number      // Surface réelle de la ville en km²
  cityOsmId?: number        // OSM ID pour calculer % réel
  cityOsmType?: string
}

const TERRITORY_KEY = 'ti2_territory_data'
const TERRITORY_GRID = 0.002 // ~200m
let lastFetchKey = ''
let fetchTimer: ReturnType<typeof setTimeout> | null = null

// Reset au démarrage pour forcer le recalcul si données incomplètes
if (typeof localStorage !== 'undefined') {
  const saved = localStorage.getItem('ti2_territory_data')
  if (saved) {
    const parsed = JSON.parse(saved || '{}')
    if (parsed.city && !parsed.cityAreaKm2) {
      localStorage.removeItem('ti2_territory_data')
    }
  }
}

export function loadTerritory(): TerritoryData {
  try {
    const raw = localStorage.getItem(TERRITORY_KEY)
    if (!raw) return { city: null, department: null, country: null, lastUpdated: '' }
    const parsed = JSON.parse(raw)
    // Si cityAreaKm2 manque, on force un refetch en vidant lastUpdated
    if (parsed.city && parsed.cityAreaKm2 === undefined) {
      parsed.lastUpdated = ''
    }
    return parsed
  } catch { return { city: null, department: null, country: null, lastUpdated: '' } }
}

export function saveTerritory(data: TerritoryData) {
  try { localStorage.setItem(TERRITORY_KEY, JSON.stringify(data)) } catch {}
}

// FIX — % basé sur la vraie surface OSM de la ville
// On stocke la surface réelle lors du fetch Nominatim
export function computeExplorationPercent(totalTiles: number, cityAreaKm2?: number): number {
  if (!cityAreaKm2 || cityAreaKm2 <= 0) return 0
  // Chaque tuile = 10m x 10m = 100m² = 0.0001 km²
  const exploredKm2 = totalTiles * 0.0001
  return Math.min(100, (exploredKm2 / cityAreaKm2) * 100)
}

// Estimation grossière pour dept et pays (inchangé)
export function estimateDeptPercent(totalTiles: number): number {
  return Math.min(100, (totalTiles / 50000) * 100)
}
export function estimateCountryPercent(totalTiles: number): number {
  return Math.min(100, (totalTiles / 500000) * 100)
}

// Garde pour compatibilité
export function estimateCityPercent(totalTiles: number): number {
  return Math.min(100, (totalTiles / 5000) * 100)
}

// Fetch territoire + surface réelle de la ville
export async function fetchTerritory(lat: number, lng: number): Promise<TerritoryData | null> {
  const key = `${(lat / TERRITORY_GRID).toFixed(0)},${(lng / TERRITORY_GRID).toFixed(0)}`
  if (key === lastFetchKey) return null
  lastFetchKey = key

  return new Promise(resolve => {
    if (fetchTimer) clearTimeout(fetchTimer)
    fetchTimer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=12`,
          {
            headers: {
              'Accept-Language': 'fr',
              'User-Agent': 'TerraIncognita/0.1 (https://terra-incognita-final.vercel.app)',
            }
          }
        )
        if (!res.ok) { resolve(null); return }
        const data = await res.json()
        const addr = data?.address || {}

        // Récupérer la surface via Overpass
        let cityAreaKm2: number | undefined
        const osmId = data.osm_id
        const osmType = data.osm_type

        if (osmId) {
          try {
            const tc = osmType === 'relation' ? 'rel' : osmType === 'way' ? 'way' : 'node'
            const q = `[out:json][timeout:10];${tc}(${osmId});out tags;`
            const r2 = await fetch('https://overpass.kumi.systems/api/interpreter', {
              method: 'POST', body: q,
              headers: { 'Content-Type': 'text/plain' }
            })
            const d2 = await r2.json()
            // surface tag en m² si disponible
            const surfaceTag = d2.elements?.[0]?.tags?.['area']
              || d2.elements?.[0]?.tags?.['surface']
            if (surfaceTag) {
              cityAreaKm2 = parseFloat(surfaceTag) / 1_000_000
            } else {
              // Fallback — récupérer la géométrie et calculer
              const q2 = `[out:json][timeout:15];${tc}(${osmId});out geom;`
              const r3 = await fetch('https://overpass.kumi.systems/api/interpreter', {
                method: 'POST', body: q2,
                headers: { 'Content-Type': 'text/plain' }
              })
              const d3 = await r3.json()
              const el = d3.elements?.[0]
              let poly: [number, number][] = []
              if (el?.geometry) poly = el.geometry.map((p: any) => [p.lat, p.lon])
              else if (el?.members) {
                const outer = el.members.find((m: any) => m.role === 'outer' && m.geometry)
                if (outer) poly = outer.geometry.map((p: any) => [p.lat, p.lon])
              }
              if (poly.length > 3) {
                // Formule de Shoelace pour calculer la surface
                let area = 0
                for (let i = 0; i < poly.length; i++) {
                  const j = (i + 1) % poly.length
                  area += poly[i][1] * poly[j][0]
                  area -= poly[j][1] * poly[i][0]
                }
                const areaDeg = Math.abs(area) / 2
                const MPL = 111320
                cityAreaKm2 = areaDeg * MPL * MPL * Math.cos(lat * Math.PI / 180) / 1_000_000
              }
            }
          } catch {}
        }

        const territory: TerritoryData = {
          city: addr.city || addr.town || addr.village || addr.municipality || null,
          department: addr.county || addr.state_district || addr.state || null,
          country: addr.country || null,
          lastUpdated: new Date().toISOString(),
          cityAreaKm2,
          cityOsmId: osmId,
          cityOsmType: osmType,
        }
        saveTerritory(territory)
        resolve(territory)
      } catch { resolve(null) }
    }, 2000)
  })
}

// ── Tuiles par ville ─────────────────────────────────────
const CITY_TILES_KEY = 'ti2_city_tiles'

interface CityTilesData {
  [cityName: string]: number // nombre de tuiles explorées dans cette ville
}

export function loadCityTiles(): CityTilesData {
  try {
    const raw = localStorage.getItem(CITY_TILES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function saveCityTiles(data: CityTilesData) {
  try { localStorage.setItem(CITY_TILES_KEY, JSON.stringify(data)) } catch {}
}

export function updateCityTiles(cityName: string, newTilesCount: number) {
  if (!cityName) return
  const data = loadCityTiles()
  data[cityName] = (data[cityName] || 0) + newTilesCount
  saveCityTiles(data)
}

export function getCityTiles(cityName: string): number {
  if (!cityName) return 0
  return loadCityTiles()[cityName] || 0
}

// Calcul % basé sur les tuiles spécifiques à la ville
export function computeCityPercent(cityName: string, cityAreaKm2?: number): number {
  if (!cityAreaKm2 || cityAreaKm2 <= 0 || !cityName) return 0
  const tiles = getCityTiles(cityName)
  const exploredKm2 = tiles * 0.0001
  return Math.min(100, (exploredKm2 / cityAreaKm2) * 100)
}
