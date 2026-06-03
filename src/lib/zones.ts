// Zone completion system
// Divides the map into 200x200m sectors
// Each sector has a completion % based on tiles discovered

const ZONE_SIZE_METERS = 200
const METERS_PER_LAT = 111320

export interface Zone {
  id: string
  name: string
  lat: number
  lng: number
  totalTiles: number
  discoveredTiles: number
  percent: number
  completed: boolean
}

function zoneId(zx: number, zy: number) { return `z${zx}:${zy}` }

export function computeZones(
  discoveredTiles: Set<string>,
  playerLat: number,
  playerLng: number
): Zone[] {
  if (discoveredTiles.size === 0) return []

  const MPG = METERS_PER_LAT * Math.cos(playerLat * Math.PI / 180)
  const TILE_SIZE = 10
  const TILES_PER_ZONE = ZONE_SIZE_METERS / TILE_SIZE // 20 tiles per zone side

  // Group tiles by zone
  const zoneMap = new Map<string, { discovered: number }>()

  discoveredTiles.forEach(key => {
    const [tx, ty] = key.split(':').map(Number)
    const zx = Math.floor(tx / TILES_PER_ZONE)
    const zy = Math.floor(ty / TILES_PER_ZONE)
    const zid = zoneId(zx, zy)
    const existing = zoneMap.get(zid) || { discovered: 0 }
    existing.discovered++
    zoneMap.set(zid, existing)
  })

  const zones: Zone[] = []
  const TOTAL_TILES_IN_ZONE = TILES_PER_ZONE * TILES_PER_ZONE // 400

  zoneMap.forEach((data, id) => {
    const [zx, zy] = id.slice(1).split(':').map(Number)
    const centerTx = zx * TILES_PER_ZONE + TILES_PER_ZONE / 2
    const centerTy = zy * TILES_PER_ZONE + TILES_PER_ZONE / 2
    const lat = (centerTy + 0.5) * TILE_SIZE / METERS_PER_LAT
    const lng = (centerTx + 0.5) * TILE_SIZE / MPG
    const percent = Math.min(100, Math.round((data.discovered / TOTAL_TILES_IN_ZONE) * 100))

    zones.push({
      id, name: `Zone ${Math.abs(zx)}-${Math.abs(zy)}`,
      lat, lng,
      totalTiles: TOTAL_TILES_IN_ZONE,
      discoveredTiles: data.discovered,
      percent,
      completed: percent >= 80, // 80% = completed
    })
  })

  return zones.sort((a, b) => b.percent - a.percent)
}

export function getZoneStats(zones: Zone[]) {
  const total = zones.length
  const completed = zones.filter(z => z.completed).length
  const avgPercent = total > 0 ? Math.round(zones.reduce((s, z) => s + z.percent, 0) / total) : 0
  return { total, completed, avgPercent }
}
