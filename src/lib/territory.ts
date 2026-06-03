// Territory exploration system
// Uses Nominatim reverse geocoding to track city/department/country coverage

export interface TerritoryData {
  city: string | null
  department: string | null
  country: string | null
  lastUpdated: string
}

const TERRITORY_KEY = 'ti2_territory_data'

export function loadTerritory(): TerritoryData {
  try {
    const raw = localStorage.getItem(TERRITORY_KEY)
    return raw ? JSON.parse(raw) : { city: null, department: null, country: null, lastUpdated: '' }
  } catch { return { city: null, department: null, country: null, lastUpdated: '' } }
}

export function saveTerritory(data: TerritoryData) {
  try { localStorage.setItem(TERRITORY_KEY, JSON.stringify(data)) } catch {}
}

// Estimation % exploré basée sur le nombre de tuiles
export function estimateCityPercent(totalTiles: number): number {
  return Math.min(100, (totalTiles / 5000) * 100)
}
export function estimateDeptPercent(totalTiles: number): number {
  return Math.min(100, (totalTiles / 50000) * 100)
}
export function estimateCountryPercent(totalTiles: number): number {
  return Math.min(100, (totalTiles / 500000) * 100)
}

// FIX #9 & #10 — User-Agent requis + throttle sur déplacement significatif (~200m)
const TERRITORY_GRID = 0.002 // ~200m de précision
let lastFetchKey = ''
let fetchTimer: ReturnType<typeof setTimeout> | null = null

export async function fetchTerritory(lat: number, lng: number): Promise<TerritoryData | null> {
  const key = `${(lat / TERRITORY_GRID).toFixed(0)},${(lng / TERRITORY_GRID).toFixed(0)}`
  if (key === lastFetchKey) return null
  lastFetchKey = key

  // Debounce — on attend 2s avant d'envoyer (évite les appels en rafale)
  return new Promise(resolve => {
    if (fetchTimer) clearTimeout(fetchTimer)
    fetchTimer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
          {
            headers: {
              // FIX #9 — User-Agent obligatoire selon usage policy Nominatim
              'Accept-Language': 'fr',
              'User-Agent': 'TerraIncognita/0.1 (https://terra-incognita-final.vercel.app)',
            }
          }
        )
        if (!res.ok) { resolve(null); return }
        const data = await res.json()
        const addr = data?.address || {}
        const territory: TerritoryData = {
          city: addr.city || addr.town || addr.village || addr.municipality || null,
          department: addr.county || addr.state_district || addr.state || null,
          country: addr.country || null,
          lastUpdated: new Date().toISOString(),
        }
        saveTerritory(territory)
        resolve(territory)
      } catch { resolve(null) }
    }, 2000)
  })
}
