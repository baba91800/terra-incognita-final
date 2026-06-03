// Territory exploration system
// Uses Nominatim reverse geocoding to track city/department/country coverage

export interface TerritoryStats {
  city: string | null
  department: string | null
  country: string | null
  cityPercent: number
  departmentPercent: number
  countryPercent: number
}

const CACHE_KEY = 'ti2_territory'
const TERRITORY_KEY = 'ti2_territory_data'

interface TerritoryData {
  city: string | null
  department: string | null
  country: string | null
  lastUpdated: string
}

export function loadTerritory(): TerritoryData {
  try {
    const raw = localStorage.getItem(TERRITORY_KEY)
    return raw ? JSON.parse(raw) : { city: null, department: null, country: null, lastUpdated: '' }
  } catch { return { city: null, department: null, country: null, lastUpdated: '' } }
}

export function saveTerritory(data: TerritoryData) {
  try { localStorage.setItem(TERRITORY_KEY, JSON.stringify(data)) } catch {}
}

// Estimate exploration % based on tiles discovered in the area
export function estimateCityPercent(totalTiles: number): number {
  // Rough estimate: average city ~50km² = 50,000,000 m² / 100m² per tile = 500,000 tiles for 100%
  // We cap at realistic walking exploration
  return Math.min(100, (totalTiles / 5000) * 100)
}

export function estimateDeptPercent(totalTiles: number): number {
  return Math.min(100, (totalTiles / 50000) * 100)
}

export function estimateCountryPercent(totalTiles: number): number {
  return Math.min(100, (totalTiles / 500000) * 100)
}

let lastFetch = ''

export async function fetchTerritory(lat: number, lng: number): Promise<TerritoryData | null> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`
  if (key === lastFetch) return null
  lastFetch = key

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { 'Accept-Language': 'fr' } }
    )
    const data = await res.json()
    const addr = data?.address || {}

    const territory: TerritoryData = {
      city: addr.city || addr.town || addr.village || addr.municipality || null,
      department: addr.county || addr.state_district || addr.state || null,
      country: addr.country || null,
      lastUpdated: new Date().toISOString(),
    }
    saveTerritory(territory)
    return territory
  } catch { return null }
}
