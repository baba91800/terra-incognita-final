import { Monument } from '@/types/game'
import { RARITY_COLORS } from './constants'

// OSM tags → rarity mapping
const LEGENDARY_TAGS = [
  { tag: 'heritage', value: 'UNESCO' },
  { tag: 'historic', value: 'world_heritage' },
  { tag: 'natural', value: 'volcano' },
  { tag: 'natural', value: 'peak', minEle: 3000 },
  { tag: 'tourism', value: 'wonder' },
  { tag: 'amenity', value: 'place_of_worship', religion: 'muslim', capacity: 5000 },
]

const TYPE_RARITY: Record<string, { rarity: Monument['rarity']; type: string; icon: string }> = {
  // Legendary
  'historic=castle+ruins=no+castle_type=royal':    { rarity: 'legendary', type: 'castle',    icon: '🏰' },
  'natural=volcano':                               { rarity: 'legendary', type: 'volcano',   icon: '🌋' },
  'natural=glacier':                               { rarity: 'legendary', type: 'glacier',   icon: '🧊' },
  'waterway=waterfall+height=100':                 { rarity: 'legendary', type: 'waterfall', icon: '💧' },
  'tourism=attraction+heritage=yes':               { rarity: 'legendary', type: 'heritage',  icon: '🏛️' },
  'amenity=cathedral+denomination=catholic':       { rarity: 'legendary', type: 'cathedral', icon: '⛪' },
  'historic=palace':                               { rarity: 'legendary', type: 'palace',    icon: '🏯' },

  // Epic  
  'natural=cave_entrance':                         { rarity: 'epic', type: 'cave',       icon: '🕳️' },
  'waterway=waterfall':                            { rarity: 'epic', type: 'waterfall',  icon: '💧' },
  'natural=hot_spring':                            { rarity: 'epic', type: 'hot_spring', icon: '♨️' },
  'historic=castle':                               { rarity: 'epic', type: 'castle',     icon: '🏰' },
  'boundary=national_park':                        { rarity: 'epic', type: 'park',       icon: '🌲' },
  'leisure=nature_reserve':                        { rarity: 'epic', type: 'reserve',    icon: '🌿' },
  'tourism=museum+attraction=yes':                 { rarity: 'epic', type: 'museum',     icon: '🏛️' },
  'amenity=cathedral':                             { rarity: 'epic', type: 'cathedral',  icon: '⛪' },
  'historic=ruins+tourism=attraction':             { rarity: 'epic', type: 'ruins',      icon: '🏚️' },
  'natural=peak':                                  { rarity: 'epic', type: 'peak',       icon: '⛰️' },
  'natural=cliff':                                 { rarity: 'epic', type: 'cliff',      icon: '🪨' },
  'natural=arch':                                  { rarity: 'epic', type: 'arch',       icon: '🌉' },

  // Rare
  'natural=spring':                                { rarity: 'rare', type: 'spring',     icon: '💦' },
  'natural=tree+landmark=yes':                     { rarity: 'rare', type: 'tree',       icon: '🌳' },
  'tourism=viewpoint':                             { rarity: 'rare', type: 'viewpoint',  icon: '👁️' },
  'historic=monument':                             { rarity: 'rare', type: 'monument',   icon: '🗿' },
  'historic=memorial+tourism=attraction':          { rarity: 'rare', type: 'memorial',   icon: '🪦' },
  'tourism=museum':                                { rarity: 'rare', type: 'museum',     icon: '🏛️' },
  'amenity=place_of_worship+tourism=attraction':   { rarity: 'rare', type: 'temple',     icon: '🛕' },
  'natural=beach+tourism=attraction':              { rarity: 'rare', type: 'beach',      icon: '🏖️' },
  'natural=island':                                { rarity: 'rare', type: 'island',     icon: '🏝️' },
  'historic=fort':                                 { rarity: 'rare', type: 'fort',       icon: '🏰' },
  'natural=gorge':                                 { rarity: 'rare', type: 'gorge',      icon: '🏔️' },
  'natural=lake+tourism=attraction':               { rarity: 'rare', type: 'lake',       icon: '🏞️' },

  // Common
  'historic=memorial':                             { rarity: 'common', type: 'memorial',  icon: '🪦' },
  'tourism=artwork':                               { rarity: 'common', type: 'artwork',   icon: '🎨' },
  'historic=statue':                               { rarity: 'common', type: 'statue',    icon: '🗿' },
  'amenity=fountain+tourism=attraction':           { rarity: 'common', type: 'fountain',  icon: '⛲' },
  'tourism=information+historic=yes':              { rarity: 'common', type: 'historic',  icon: '📜' },
  'natural=tree':                                  { rarity: 'common', type: 'tree',      icon: '🌲' },
  'leisure=garden+tourism=attraction':             { rarity: 'common', type: 'garden',    icon: '🌷' },
}

// Overpass query builder
function buildQuery(lat: number, lng: number, radius: number): string {
  return `
[out:json][timeout:25];
(
  node["tourism"="attraction"](around:${radius},${lat},${lng});
  node["tourism"="viewpoint"](around:${radius},${lat},${lng});
  node["tourism"="museum"](around:${radius},${lat},${lng});
  node["historic"="castle"](around:${radius},${lat},${lng});
  node["historic"="monument"](around:${radius},${lat},${lng});
  node["historic"="memorial"]["tourism"="attraction"](around:${radius},${lat},${lng});
  node["historic"="palace"](around:${radius},${lat},${lng});
  node["historic"="ruins"]["tourism"="attraction"](around:${radius},${lat},${lng});
  node["historic"="fort"](around:${radius},${lat},${lng});
  node["historic"="statue"](around:${radius},${lat},${lng});
  node["natural"="volcano"](around:${radius},${lat},${lng});
  node["natural"="cave_entrance"](around:${radius},${lat},${lng});
  node["natural"="hot_spring"](around:${radius},${lat},${lng});
  node["natural"="waterfall"](around:${radius},${lat},${lng});
  node["natural"="peak"]["prominence"](around:${radius},${lat},${lng});
  node["natural"="arch"](around:${radius},${lat},${lng});
  node["natural"="tree"]["landmark"="yes"](around:${radius},${lat},${lng});
  node["natural"="spring"](around:${radius},${lat},${lng});
  node["natural"="glacier"](around:${radius},${lat},${lng});
  node["waterway"="waterfall"](around:${radius},${lat},${lng});
  node["amenity"="cathedral"](around:${radius},${lat},${lng});
  node["amenity"="fountain"]["tourism"="attraction"](around:${radius},${lat},${lng});
  node["tourism"="artwork"]["name"](around:${radius},${lat},${lng});
  way["boundary"="national_park"](around:${radius},${lat},${lng});
  way["leisure"="nature_reserve"](around:${radius},${lat},${lng});
  relation["boundary"="national_park"](around:${radius},${lat},${lng});
);
out center;
`
}

function classifyElement(tags: Record<string, string>): { rarity: Monument['rarity']; type: string; icon: string } {
  // Legendary checks
  if (tags.historic === 'palace' || tags.castle_type === 'royal')
    return { rarity: 'legendary', type: 'palace', icon: '🏯' }
  if (tags.natural === 'volcano')
    return { rarity: 'legendary', type: 'volcano', icon: '🌋' }
  if (tags.natural === 'glacier')
    return { rarity: 'legendary', type: 'glacier', icon: '🧊' }
  if (tags.heritage === '1' || tags['heritage:operator'] === 'UNESCO' || (tags.wikidata && tags.tourism === 'attraction' && tags.historic))
    return { rarity: 'legendary', type: 'heritage', icon: '🏛️' }

  // Epic checks
  if (tags.natural === 'cave_entrance')
    return { rarity: 'epic', type: 'cave', icon: '🕳️' }
  if (tags.waterway === 'waterfall' || tags.natural === 'waterfall')
    return { rarity: 'epic', type: 'waterfall', icon: '💧' }
  if (tags.natural === 'hot_spring')
    return { rarity: 'epic', type: 'hot_spring', icon: '♨️' }
  if (tags.historic === 'castle')
    return { rarity: 'epic', type: 'castle', icon: '🏰' }
  if (tags.boundary === 'national_park' || tags.leisure === 'nature_reserve')
    return { rarity: 'epic', type: 'park', icon: '🌲' }
  if (tags.natural === 'peak')
    return { rarity: 'epic', type: 'peak', icon: '⛰️' }
  if (tags.natural === 'arch')
    return { rarity: 'epic', type: 'arch', icon: '🌉' }
  if (tags.amenity === 'cathedral')
    return { rarity: 'epic', type: 'cathedral', icon: '⛪' }
  if (tags.historic === 'ruins' && tags.tourism === 'attraction')
    return { rarity: 'epic', type: 'ruins', icon: '🏚️' }
  if (tags.natural === 'cliff')
    return { rarity: 'epic', type: 'cliff', icon: '🪨' }

  // Rare checks
  if (tags.tourism === 'viewpoint')
    return { rarity: 'rare', type: 'viewpoint', icon: '👁️' }
  if (tags.tourism === 'museum')
    return { rarity: 'rare', type: 'museum', icon: '🏛️' }
  if (tags.historic === 'monument')
    return { rarity: 'rare', type: 'monument', icon: '🗿' }
  if (tags.historic === 'fort')
    return { rarity: 'rare', type: 'fort', icon: '🏰' }
  if (tags.natural === 'spring')
    return { rarity: 'rare', type: 'spring', icon: '💦' }
  if (tags['natural:tree'] === 'landmark' || (tags.natural === 'tree' && tags.landmark === 'yes'))
    return { rarity: 'rare', type: 'tree', icon: '🌳' }
  if (tags.historic === 'memorial' && tags.tourism === 'attraction')
    return { rarity: 'rare', type: 'memorial', icon: '🪦' }

  // Common
  if (tags.tourism === 'artwork' && tags.name)
    return { rarity: 'common', type: 'artwork', icon: '🎨' }
  if (tags.historic === 'statue')
    return { rarity: 'common', type: 'statue', icon: '🗿' }
  if (tags.amenity === 'fountain' && tags.tourism === 'attraction')
    return { rarity: 'common', type: 'fountain', icon: '⛲' }
  if (tags.historic === 'memorial')
    return { rarity: 'common', type: 'memorial', icon: '🪦' }
  if (tags.leisure === 'garden' && tags.tourism === 'attraction')
    return { rarity: 'common', type: 'garden', icon: '🌷' }
  if (tags.natural === 'tree')
    return { rarity: 'common', type: 'tree', icon: '🌲' }

  // Default attraction
  if (tags.tourism === 'attraction')
    return { rarity: 'rare', type: 'attraction', icon: '📍' }

  return { rarity: 'common', type: 'place', icon: '📌' }
}

// Cache to avoid refetching same zones
const fetchedZones = new Set<string>()

function zoneKey(lat: number, lng: number, zoomLevel = 0.02): string {
  return `${Math.floor(lat / zoomLevel)},${Math.floor(lng / zoomLevel)}`
}

export async function fetchNearbyMonuments(
  lat: number,
  lng: number,
  existingIds: Set<string>
): Promise<Monument[]> {
  const key = zoneKey(lat, lng)
  if (fetchedZones.has(key)) return []
  fetchedZones.add(key)

  const query = buildQuery(lat, lng, 3000)
  const url = 'https://overpass-api.de/api/interpreter'

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' },
    })
    if (!res.ok) return []
    const data = await res.json()

    const monuments: Monument[] = []

    for (const el of data.elements) {
      // Skip unnamed
      if (!el.tags?.name) continue

      const id = `osm_${el.type}_${el.id}`
      if (existingIds.has(id)) continue

      // Get coordinates
      let elLat = el.lat
      let elLng = el.lon
      if (!elLat && el.center) {
        elLat = el.center.lat
        elLng = el.center.lon
      }
      if (!elLat || !elLng) continue

      const { rarity, type, icon } = classifyElement(el.tags)

      monuments.push({
        id,
        name: el.tags.name,
        lat: elLat,
        lng: elLng,
        rarity,
        type,
        discovered: false,
        icon,
      } as Monument & { icon: string })
    }

    return monuments
  } catch {
    return []
  }
}

export { zoneKey, fetchedZones }
