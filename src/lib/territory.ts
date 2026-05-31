export interface TerritoryData {
  city: string | null
  department: string | null
  country: string | null
  cityAreaKm2: number | null
  deptAreaKm2: number | null
  countryAreaKm2: number | null
  cityBoundary: [number,number][] | null
  lastUpdated: string
}

const TERRITORY_KEY = 'ti2_territory_data'
const TILE_AREA_M2 = 100 // 10x10m per tile

let lastFetch = ''

export function loadTerritory(): TerritoryData {
  try {
    const raw = localStorage.getItem(TERRITORY_KEY)
    return raw ? JSON.parse(raw) : empty()
  } catch { return empty() }
}

function empty(): TerritoryData {
  return { city:null, department:null, country:null, cityAreaKm2:null, deptAreaKm2:null, countryAreaKm2:null, cityBoundary:null, lastUpdated:'' }
}

export function saveTerritory(data: TerritoryData) {
  try { localStorage.setItem(TERRITORY_KEY, JSON.stringify(data)) } catch {}
}

export function calcPercent(totalTiles: number, areakm2: number | null, fallbackDivisor: number): number {
  if (areakm2 && areakm2 > 0) {
    const exploredM2 = totalTiles * TILE_AREA_M2
    const totalM2 = areakm2 * 1_000_000
    return Math.min(99.9, (exploredM2 / totalM2) * 100)
  }
  return Math.min(99.9, (totalTiles / fallbackDivisor) * 100)
}

export function estimateCityPercent(totalTiles: number, areakm2: number | null): number {
  return calcPercent(totalTiles, areakm2, 5000)
}
export function estimateDeptPercent(totalTiles: number, areakm2: number | null): number {
  return calcPercent(totalTiles, areakm2, 50000)
}
export function estimateCountryPercent(totalTiles: number, areakm2: number | null): number {
  return calcPercent(totalTiles, areakm2, 500000)
}

export async function fetchTerritory(lat: number, lng: number): Promise<TerritoryData | null> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`
  if (key === lastFetch) return null
  lastFetch = key

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&addressdetails=1`,
      { headers: { 'Accept-Language': 'fr' } }
    )
    const data = await res.json()
    const addr = data?.address || {}

    const city = addr.city || addr.town || addr.village || addr.municipality || null
    const department = addr.county || addr.state_district || addr.state || null
    const country = addr.country || null

    let cityAreaKm2: number | null = null
    let cityBoundary: [number,number][] | null = null

    if (city) {
      try {
        const q = `[out:json][timeout:10];
relation["name"="${city}"]["boundary"="administrative"]["admin_level"~"^[6-9]$"];
out geom qt 1;`
        const r2 = await fetch('https://overpass.kumi.systems/api/interpreter', {
          method: 'POST', body: q,
          headers: { 'Content-Type': 'text/plain' }
        })
        const d2 = await r2.json()
        if (d2.elements?.[0]) {
          const el = d2.elements[0]
          if (el.members) {
            const outer = el.members.find((m: any) => m.role === 'outer' && m.geometry)
            if (outer?.geometry) {
              cityBoundary = outer.geometry.map((pt: any) => [pt.lat, pt.lon] as [number,number])
            }
          }
          if (el.bounds) {
            const latDiff = (el.bounds.maxlat - el.bounds.minlat) * 111.32
            const lngDiff = (el.bounds.maxlon - el.bounds.minlon) * 111.32 * Math.cos(lat * Math.PI / 180)
            cityAreaKm2 = Math.round(latDiff * lngDiff * Math.PI / 4)
          }
        }
      } catch {}
    }

    const territory: TerritoryData = {
      city, department, country,
      cityAreaKm2, deptAreaKm2: null, countryAreaKm2: null,
      cityBoundary, lastUpdated: new Date().toISOString(),
    }
    saveTerritory(territory)
    return territory
  } catch { return null }
}
