import type { Monument } from '../types/game'
import type { Rarity } from '../types/game'

// ── Cache persistant localStorage ────────────────────────────
const CACHE_KEY = 'ti2_overpass_cache'
const CACHE_VERSION = 2

interface CacheEntry {
  monuments: Monument[]
  timestamp: number
}

function loadCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed.version !== CACHE_VERSION) return {}
    return parsed.data || {}
  } catch { return {} }
}

function saveCache(cache: Record<string, CacheEntry>) {
  try {
    // Keep only last 200 zones to avoid localStorage overflow
    const keys = Object.keys(cache)
    if (keys.length > 200) {
      const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp)
      sorted.slice(0, keys.length - 200).forEach(k => delete cache[k])
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify({ version: CACHE_VERSION, data: cache }))
  } catch {}
}

const memoryCache = new Set<string>() // in-memory dedup for current session

function zoneKey(lat: number, lng: number) {
  return `${Math.floor(lat / 0.03)},${Math.floor(lng / 0.03)}`
}

// ── Classification OSM → rareté ───────────────────────────────
// Category → color mapping (independent of rarity)
export const CATEGORY_COLORS: Record<string, string> = {
  // Nature — green
  volcano: '#22c55e', glacier: '#22c55e', peak: '#22c55e', cave: '#22c55e',
  waterfall: '#22c55e', hot_spring: '#22c55e', park: '#22c55e', reserve: '#22c55e',
  spring: '#22c55e', tree: '#22c55e', cliff: '#22c55e', gorge: '#22c55e',
  arch: '#22c55e', cape: '#22c55e', rock: '#22c55e', beach: '#22c55e',
  // History — gold
  palace: '#f59e0b', heritage: '#f59e0b', castle: '#f59e0b', fort: '#f59e0b',
  ruins: '#f59e0b', monument: '#f59e0b', memorial: '#f59e0b', megalith: '#f59e0b',
  tower: '#f59e0b', roman: '#f59e0b', statue: '#f59e0b', cemetery: '#f59e0b',
  // Culture — blue
  museum: '#3b82f6', cathedral: '#3b82f6', theatre: '#3b82f6', library: '#3b82f6',
  artwork: '#3b82f6', fountain: '#3b82f6', garden: '#3b82f6', worship: '#3b82f6',
  // Unusual — orange
  lighthouse: '#f97316', windmill: '#f97316', watermill: '#f97316', mine: '#f97316',
  bunker: '#f97316', station: '#f97316', bridge: '#f97316', tunnel: '#f97316',
  // Default
  attraction: '#00f5d4', place: '#00f5d4', viewpoint: '#00f5d4',
}
  if (tags.natural === 'volcano')                          return { rarity: 'legendary', type: 'volcano',    icon: '🌋' }
  if (tags.natural === 'glacier')                          return { rarity: 'legendary', type: 'glacier',    icon: '🧊' }
  if (tags.historic === 'palace')                          return { rarity: 'legendary', type: 'palace',     icon: '🏯' }
  if (tags['heritage:operator'] === 'UNESCO')              return { rarity: 'legendary', type: 'heritage',   icon: '🏛️' }
  if (tags.natural === 'peak' && parseInt(tags.ele||'0') > 3000) return { rarity: 'legendary', type: 'peak', icon: '⛰️' }
  if (tags.man_made === 'lighthouse' && tags.tourism === 'attraction') return { rarity: 'legendary', type: 'lighthouse', icon: '🗼' }
  if (tags.natural === 'cave_entrance')                    return { rarity: 'epic', type: 'cave',       icon: '🕳️' }
  if (tags.waterway === 'waterfall' || tags.natural === 'waterfall') return { rarity: 'epic', type: 'waterfall', icon: '💧' }
  if (tags.natural === 'hot_spring')                       return { rarity: 'epic', type: 'hot_spring', icon: '♨️' }
  if (tags.historic === 'castle')                          return { rarity: 'epic', type: 'castle',     icon: '🏰' }
  if (tags.boundary === 'national_park')                   return { rarity: 'epic', type: 'park',       icon: '🌲' }
  if (tags.leisure === 'nature_reserve')                   return { rarity: 'epic', type: 'reserve',    icon: '🌿' }
  if (tags.natural === 'peak')                             return { rarity: 'epic', type: 'peak',       icon: '⛰️' }
  if (tags.amenity === 'cathedral')                        return { rarity: 'epic', type: 'cathedral',  icon: '⛪' }
  if (tags.historic === 'ruins' && tags.tourism)           return { rarity: 'epic', type: 'ruins',      icon: '🏚️' }
  if (tags.natural === 'arch')                             return { rarity: 'epic', type: 'arch',       icon: '🌉' }
  if (tags.historic === 'fort')                            return { rarity: 'epic', type: 'fort',       icon: '🏰' }
  if (tags.man_made === 'lighthouse')                      return { rarity: 'epic', type: 'lighthouse', icon: '🗼' }
  if (tags.historic === 'megalith' || tags.historic === 'dolmen' || tags.historic === 'menhir') return { rarity: 'epic', type: 'megalith', icon: '🗿' }
  if (tags.natural === 'cape')                             return { rarity: 'epic', type: 'cape',       icon: '🏔️' }
  if (tags.tourism === 'viewpoint')                        return { rarity: 'rare', type: 'viewpoint',  icon: '👁️' }
  if (tags.tourism === 'museum')                           return { rarity: 'rare', type: 'museum',     icon: '🏛️' }
  if (tags.historic === 'monument')                        return { rarity: 'rare', type: 'monument',   icon: '🗿' }
  if (tags.natural === 'spring')                           return { rarity: 'rare', type: 'spring',     icon: '💦' }
  if (tags.natural === 'tree' && (tags.landmark === 'yes' || tags.denotation === 'landmark')) return { rarity: 'rare', type: 'tree', icon: '🌳' }
  if (tags.man_made === 'windmill')                        return { rarity: 'rare', type: 'windmill',   icon: '🌀' }
  if (tags.man_made === 'watermill')                       return { rarity: 'rare', type: 'watermill',  icon: '⚙️' }
  if (tags.historic === 'mine' || tags.historic === 'mineshaft') return { rarity: 'rare', type: 'mine', icon: '⛏️' }
  if (tags.historic === 'tower')                           return { rarity: 'rare', type: 'tower',      icon: '🗼' }
  if (tags.natural === 'cliff')                            return { rarity: 'rare', type: 'cliff',      icon: '🪨' }
  if (tags.natural === 'gorge')                            return { rarity: 'rare', type: 'gorge',      icon: '🏔️' }
  if (tags.historic === 'cemetery' && tags.tourism)        return { rarity: 'rare', type: 'cemetery',   icon: '⚰️' }
  if (tags.amenity === 'theatre' && tags.historic)         return { rarity: 'rare', type: 'theatre',    icon: '🎭' }
  if (tags.historic === 'memorial' && tags.tourism)        return { rarity: 'rare', type: 'memorial',   icon: '🪦' }
  if (tags.natural === 'rock' && tags.name)                return { rarity: 'rare', type: 'rock',       icon: '🪨' }
  if (tags.tourism === 'artwork' && tags.name)             return { rarity: 'common', type: 'artwork',   icon: '🎨' }
  if (tags.historic === 'statue')                          return { rarity: 'common', type: 'statue',    icon: '🗿' }
  if (tags.amenity === 'fountain' && tags.tourism)         return { rarity: 'common', type: 'fountain',  icon: '⛲' }
  if (tags.historic === 'memorial')                        return { rarity: 'common', type: 'memorial',  icon: '🪦' }
  if (tags.leisure === 'garden' && tags.tourism)           return { rarity: 'common', type: 'garden',    icon: '🌷' }
  if (tags.natural === 'tree')                             return { rarity: 'common', type: 'tree',      icon: '🌲' }
  if (tags.tourism === 'attraction')                       return { rarity: 'common', type: 'attraction', icon: '📍' }
  return { rarity: 'common', type: 'place', icon: '📌' }
}

// ── Fetch avec cache ──────────────────────────────────────────
export async function fetchMonuments(lat: number, lng: number, existingIds: Set<string>): Promise<Monument[]> {
  const key = zoneKey(lat, lng)
  if (memoryCache.has(key)) return []
  memoryCache.add(key)

  // Check persistent cache first
  const cache = loadCache()
  const cached = cache[key]
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000
  if (cached && Date.now() - cached.timestamp < ONE_WEEK) {
    // Return cached monuments not already known
    return cached.monuments.filter(m => !existingIds.has(m.id))
  }

  const q = `[out:json][timeout:25];
(
  node["tourism"~"attraction|viewpoint|museum|artwork"](around:3000,${lat},${lng});
  node["historic"~"castle|monument|palace|fort|memorial|ruins|megalith|dolmen|menhir|mine|mineshaft|tower|cemetery|statue|wayside_cross"](around:3000,${lat},${lng});
  node["natural"~"volcano|cave_entrance|hot_spring|waterfall|peak|glacier|spring|tree|arch|cliff|cape|gorge|rock|beach"](around:3000,${lat},${lng});
  node["waterway"="waterfall"](around:3000,${lat},${lng});
  node["amenity"~"cathedral|fountain|theatre"](around:3000,${lat},${lng});
  node["man_made"~"lighthouse|windmill|watermill"](around:3000,${lat},${lng});
  node["boundary"="national_park"](around:3000,${lat},${lng});
  node["leisure"~"nature_reserve|garden"](around:3000,${lat},${lng});
);
out center;`

  try {
    const res = await fetch('https://overpass.kumi.systems/api/interpreter', {
      method: 'POST', body: q,
      headers: { 'Content-Type': 'text/plain' }
    })
    if (!res.ok) return []
    const data = await res.json()
    const results: Monument[] = []

    for (const el of data.elements) {
      if (!el.tags?.name) continue
      const id = `osm_${el.type}_${el.id}`
      const elLat = el.lat || el.center?.lat
      const elLng = el.lon || el.center?.lon
      if (!elLat || !elLng) continue
      const { rarity, type, icon } = classify(el.tags)
      results.push({ id, name: el.tags.name, lat: elLat, lng: elLng, rarity, type, icon, discovered: false })
    }

    // Save to persistent cache
    cache[key] = { monuments: results, timestamp: Date.now() }
    saveCache(cache)

    return results.filter(m => !existingIds.has(m.id))
  } catch { return [] }
}
