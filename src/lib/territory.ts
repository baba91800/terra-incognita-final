// Surfaces réelles en km² pour les calculs de %

// Surfaces moyennes des départements français en km²
const DEPT_AREAS: Record<string, number> = {
  'Ain': 5762, 'Aisne': 7369, 'Allier': 7340, 'Alpes-de-Haute-Provence': 6925,
  'Hautes-Alpes': 5549, 'Alpes-Maritimes': 4299, 'Ardèche': 5529, 'Ardennes': 5229,
  'Ariège': 4890, 'Aube': 6004, 'Aude': 6139, 'Aveyron': 8735,
  'Bouches-du-Rhône': 5087, 'Calvados': 5548, 'Cantal': 5726, 'Charente': 5956,
  'Charente-Maritime': 6864, 'Cher': 7235, 'Corrèze': 5857, 'Côte-d\'Or': 8763,
  'Côtes-d\'Armor': 6878, 'Creuse': 5565, 'Dordogne': 9060, 'Doubs': 5234,
  'Drôme': 6530, 'Eure': 6040, 'Eure-et-Loir': 5880, 'Finistère': 6733,
  'Gard': 5853, 'Haute-Garonne': 6309, 'Gers': 6257, 'Gironde': 10000,
  'Hérault': 6101, 'Ille-et-Vilaine': 6775, 'Indre': 6791, 'Indre-et-Loire': 6127,
  'Isère': 7431, 'Jura': 4999, 'Landes': 9243, 'Loir-et-Cher': 6343,
  'Loire': 4781, 'Haute-Loire': 4977, 'Loire-Atlantique': 6815, 'Loiret': 6775,
  'Lot': 5217, 'Lot-et-Garonne': 5361, 'Lozère': 5167, 'Maine-et-Loire': 7166,
  'Manche': 5938, 'Marne': 8162, 'Haute-Marne': 6211, 'Mayenne': 5175,
  'Meurthe-et-Moselle': 5246, 'Meuse': 6211, 'Morbihan': 6823, 'Moselle': 6216,
  'Nièvre': 6817, 'Nord': 5743, 'Oise': 5860, 'Orne': 6103, 'Pas-de-Calais': 6671,
  'Puy-de-Dôme': 7970, 'Pyrénées-Atlantiques': 7645, 'Hautes-Pyrénées': 4464,
  'Pyrénées-Orientales': 4116, 'Bas-Rhin': 4755, 'Haut-Rhin': 3525,
  'Rhône': 2715, 'Haute-Saône': 5360, 'Saône-et-Loire': 8575, 'Sarthe': 6206,
  'Savoie': 6028, 'Haute-Savoie': 4388, 'Paris': 105, 'Seine-Maritime': 6278,
  'Seine-et-Marne': 5915, 'Yvelines': 2284, 'Deux-Sèvres': 5999, 'Somme': 6170,
  'Tarn': 5758, 'Tarn-et-Garonne': 3718, 'Var': 5973, 'Vaucluse': 3567,
  'Vendée': 6720, 'Vienne': 6990, 'Haute-Vienne': 5520, 'Vosges': 5874,
  'Yonne': 7427, 'Territoire de Belfort': 609, 'Essonne': 1804, 'Hauts-de-Seine': 176,
  'Seine-Saint-Denis': 236, 'Val-de-Marne': 245, 'Val-d\'Oise': 1246,
}

// Surfaces des pays en km²
const COUNTRY_AREAS: Record<string, number> = {
  'France': 551695, 'Germany': 357114, 'Spain': 505990, 'Italy': 301340,
  'United Kingdom': 242495, 'Portugal': 92212, 'Belgium': 30528, 'Netherlands': 41543,
  'Switzerland': 41285, 'Austria': 83871, 'Poland': 312696, 'Czech Republic': 78866,
  'Hungary': 93028, 'Romania': 238397, 'Greece': 131957, 'Sweden': 447430,
  'Norway': 385207, 'Finland': 338424, 'Denmark': 43094, 'Ireland': 70273,
  'United States': 9833520, 'Canada': 9984670, 'Brazil': 8515767, 'Australia': 7692024,
  'China': 9596960, 'Japan': 377915, 'India': 3287263, 'Russia': 17098242,
  'Mexico': 1964375, 'Argentina': 2780400,
}

export function getDeptArea(deptName: string): number {
  if (!deptName) return 5000
  // Cherche le nom exact ou partiel
  const exact = DEPT_AREAS[deptName]
  if (exact) return exact
  const partial = Object.keys(DEPT_AREAS).find(k => deptName.includes(k) || k.includes(deptName))
  return partial ? DEPT_AREAS[partial] : 5000
}

export function getCountryArea(countryName: string): number {
  if (!countryName) return 500000
  const exact = COUNTRY_AREAS[countryName]
  if (exact) return exact
  const partial = Object.keys(COUNTRY_AREAS).find(k => countryName.includes(k) || k.includes(countryName))
  return partial ? COUNTRY_AREAS[partial] : 500000
}

export function computeExplorationPercent(totalTiles: number, cityAreaKm2?: number): number {
  if (!cityAreaKm2 || cityAreaKm2 <= 0) return 0
  const exploredKm2 = totalTiles * 0.0001
  return Math.min(100, (exploredKm2 / cityAreaKm2) * 100)
}

export function computeDeptPercent(totalTiles: number, deptName: string): number {
  const areaKm2 = getDeptArea(deptName)
  const exploredKm2 = totalTiles * 0.0001
  return Math.min(100, (exploredKm2 / areaKm2) * 100)
}

export function computeCountryPercent(totalTiles: number, countryName: string): number {
  const areaKm2 = getCountryArea(countryName)
  const exploredKm2 = totalTiles * 0.0001
  return Math.min(100, (exploredKm2 / areaKm2) * 100)
}

export function estimateDeptPercent(totalTiles: number): number {
  return Math.min(100, (totalTiles / 50000000) * 100)
}

export function estimateCountryPercent(totalTiles: number): number {
  return Math.min(100, (totalTiles / 5000000000) * 100)
}

// ── Territoire ────────────────────────────────────────────────
export interface TerritoryData {
  city: string
  department: string
  country: string
  cityAreaKm2?: number
}

const TERRITORY_KEY = 'ti2_territory'

export function loadTerritory(): TerritoryData {
  try {
    const raw = localStorage.getItem(TERRITORY_KEY)
    return raw ? JSON.parse(raw) : { city: '', department: '', country: '' }
  } catch { return { city: '', department: '', country: '' } }
}

export function saveTerritory(t: TerritoryData) {
  try { localStorage.setItem(TERRITORY_KEY, JSON.stringify(t)) } catch {}
}

export async function fetchTerritory(lat: number, lng: number): Promise<TerritoryData> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=12`,
      { headers: { 'User-Agent': 'TerraIncognita/0.1', 'Accept-Language': 'fr' } }
    )
    const d = await r.json()
    const addr = d.address || {}
    const city = addr.city || addr.town || addr.village || addr.municipality || ''
    const department = addr.county || addr.state_district || addr.state || ''
    const country = addr.country || ''

    // Récupérer la surface de la ville via Nominatim
    let cityAreaKm2: number | undefined
    try {
      const r2 = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&polygon_geojson=0&addressdetails=0`,
        { headers: { 'User-Agent': 'TerraIncognita/0.1' } }
      )
      const d2 = await r2.json()
      if (d2[0]?.boundingbox) {
        const bb = d2[0].boundingbox.map(Number)
        const latDiff = bb[1] - bb[0]
        const lngDiff = bb[3] - bb[2]
        const latKm = latDiff * 111
        const lngKm = lngDiff * 111 * Math.cos(lat * Math.PI / 180)
        cityAreaKm2 = Math.round(latKm * lngKm * 10) / 10
      }
    } catch {}

    const territory = { city, department, country, cityAreaKm2 }
    saveTerritory(territory)
    return territory
  } catch {
    return loadTerritory()
  }
}

// ── Tuiles par ville ─────────────────────────────────────────
const CITY_TILES_KEY = 'ti2_city_tiles'

interface CityTilesData { [cityName: string]: number }

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

export function computeCityPercent(cityName: string, cityAreaKm2?: number): number {
  if (!cityAreaKm2 || cityAreaKm2 <= 0 || !cityName) return 0
  const tiles = getCityTiles(cityName)
  const exploredKm2 = tiles * 0.0001
  return Math.min(100, (exploredKm2 / cityAreaKm2) * 100)
}
