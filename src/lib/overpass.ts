import type { Monument } from '../types/game'
import type { Rarity } from '../types/game'

// ── Category colors ───────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
  volcano: '#22c55e', glacier: '#22c55e', peak: '#22c55e', cave: '#22c55e',
  waterfall: '#22c55e', hot_spring: '#22c55e', park: '#22c55e', reserve: '#22c55e',
  spring: '#22c55e', tree: '#22c55e', cliff: '#22c55e', gorge: '#22c55e',
  arch: '#22c55e', cape: '#22c55e', rock: '#22c55e', beach: '#22c55e',
  palace: '#f59e0b', heritage: '#f59e0b', castle: '#f59e0b', fort: '#f59e0b',
  ruins: '#f59e0b', monument: '#f59e0b', memorial: '#f59e0b', megalith: '#f59e0b',
  tower: '#f59e0b', roman: '#f59e0b', statue: '#f59e0b', cemetery: '#f59e0b',
  museum: '#3b82f6', cathedral: '#3b82f6', theatre: '#3b82f6', library: '#3b82f6',
  artwork: '#3b82f6', fountain: '#3b82f6', garden: '#3b82f6', worship: '#3b82f6',
  lighthouse: '#f97316', windmill: '#f97316', watermill: '#f97316', mine: '#f97316',
  bunker: '#f97316', station: '#f97316', bridge: '#f97316', tunnel: '#f97316',
  attraction: '#00f5d4', place: '#00f5d4', viewpoint: '#00f5d4',
}

// ── Classification ────────────────────────────────────────────
function classify(tags: Record<string, string>): { rarity: Rarity; type: string; icon: string } | null {
  // LEGENDARY
  if (tags.natural === 'volcano')           return { rarity: 'legendary', type: 'volcano',    icon: '🌋' }
  if (tags.natural === 'glacier')           return { rarity: 'legendary', type: 'glacier',    icon: '🧊' }
  if (tags.historic === 'palace')           return { rarity: 'legendary', type: 'palace',     icon: '🏯' }
  if (tags['heritage:operator'] === 'UNESCO') return { rarity: 'legendary', type: 'heritage', icon: '🏛️' }
  if (tags.natural === 'peak' && parseInt(tags.ele||'0') > 3000) return { rarity: 'legendary', type: 'peak', icon: '⛰️' }
  if (tags.man_made === 'lighthouse' && tags.tourism === 'attraction') return { rarity: 'legendary', type: 'lighthouse', icon: '🗼' }

  // EPIC
  if (tags.natural === 'cave_entrance')     return { rarity: 'epic', type: 'cave',       icon: '🕳️' }
  if (tags.waterway === 'waterfall' || tags.natural === 'waterfall') return { rarity: 'epic', type: 'waterfall', icon: '💧' }
  if (tags.natural === 'hot_spring')        return { rarity: 'epic', type: 'hot_spring', icon: '♨️' }
  if (tags.historic === 'castle')           return { rarity: 'epic', type: 'castle',     icon: '🏰' }
  if (tags.boundary === 'national_park')    return { rarity: 'epic', type: 'park',       icon: '🌲' }
  if (tags.leisure === 'nature_reserve')    return { rarity: 'epic', type: 'reserve',    icon: '🌿' }
  if (tags.natural === 'peak')              return { rarity: 'epic', type: 'peak',       icon: '⛰️' }
  if (tags.amenity === 'cathedral')         return { rarity: 'epic', type: 'cathedral',  icon: '⛪' }
  if (tags.historic === 'ruins' && tags.tourism) return { rarity: 'epic', type: 'ruins', icon: '🏚️' }
  if (tags.natural === 'arch')              return { rarity: 'epic', type: 'arch',       icon: '🌉' }
  if (tags.historic === 'fort')             return { rarity: 'epic', type: 'fort',       icon: '🏰' }
  if (tags.man_made === 'lighthouse')       return { rarity: 'epic', type: 'lighthouse', icon: '🗼' }
  if (tags.historic === 'megalith' || tags.historic === 'dolmen' || tags.historic === 'menhir') return { rarity: 'epic', type: 'megalith', icon: '🗿' }
  if (tags.natural === 'cape')              return { rarity: 'epic', type: 'cape',       icon: '🏔️' }

  // RARE
  if (tags.tourism === 'viewpoint')         return { rarity: 'rare', type: 'viewpoint',  icon: '👁️' }
  if (tags.tourism === 'museum')            return { rarity: 'rare', type: 'museum',     icon: '🏛️' }
  if (tags.historic === 'monument')         return { rarity: 'rare', type: 'monument',   icon: '🗿' }
  if (tags.natural === 'spring')            return { rarity: 'rare', type: 'spring',     icon: '💦' }
  if (tags.natural === 'tree' && (tags.landmark === 'yes' || tags.denotation === 'landmark')) return { rarity: 'rare', type: 'tree', icon: '🌳' }
  if (tags.man_made === 'windmill')         return { rarity: 'rare', type: 'windmill',   icon: '🌀' }
  if (tags.man_made === 'watermill')        return { rarity: 'rare', type: 'watermill',  icon: '⚙️' }
  if (tags.historic === 'mine' || tags.historic === 'mineshaft') return { rarity: 'rare', type: 'mine', icon: '⛏️' }
  if (tags.historic === 'tower')            return { rarity: 'rare', type: 'tower',      icon: '🗼' }
  if (tags.natural === 'cliff')             return { rarity: 'rare', type: 'cliff',      icon: '🪨' }
  if (tags.natural === 'gorge')             return { rarity: 'rare', type: 'gorge',      icon: '🏔️' }
  if (tags.historic === 'cemetery' && tags.tourism) return { rarity: 'rare', type: 'cemetery', icon: '⚰️' }
  if (tags.amenity === 'theatre' && tags.historic)  return { rarity: 'rare', type: 'theatre',  icon: '🎭' }
  if (tags.historic === 'memorial' && tags.tourism) return { rarity: 'rare', type: 'memorial', icon: '🪦' }
  if (tags.natural === 'rock' && tags.name) return { rarity: 'rare', type: 'rock',      icon: '🪨' }

  // COMMON — seulement les lieux vraiment notables
  // On filtre strictement : doit avoir tourism=attraction ET un nom connu
  if (tags.tourism === 'artwork' && tags.name && tags.wikidata) return { rarity: 'common', type: 'artwork', icon: '🎨' }
  if (tags.amenity === 'fountain' && tags.tourism === 'attraction' && tags.wikidata) return { rarity: 'common', type: 'fountain', icon: '⛲' }
  if (tags.leisure === 'garden' && tags.tourism === 'attraction' && tags.wikidata) return { rarity: 'common', type: 'garden', icon: '🌷' }

  // Rejeter tout le reste pour éviter la saturation
  return null
}

// ── Cache persistant ──────────────────────────────────────────
const CACHE_KEY = 'ti2_overpass_cache'
const CACHE_VERSION = 3

interface CacheEntry { monuments: Monument[]; timestamp: number }

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
    const keys = Object.keys(cache)
    if (keys.length > 200) {
      keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp)
          .slice(0, keys.length - 200)
          .forEach(k => delete cache[k])
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify({ version: CACHE_VERSION, data: cache }))
  } catch {}
}

const memCache = new Set<string>()
function zoneKey(lat: number, lng: number) { return `${Math.floor(lat / 0.03)},${Math.floor(lng / 0.03)}` }

// ── Fetch ─────────────────────────────────────────────────────
export async function fetchMonuments(lat: number, lng: number, existingIds: Set<string>): Promise<Monument[]> {
  const key = zoneKey(lat, lng)
  if (memCache.has(key)) return []
  memCache.add(key)

  const cache = loadCache()
  const cached = cache[key]
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000
  if (cached && Date.now() - cached.timestamp < ONE_WEEK) {
    return cached.monuments.filter(m => !existingIds.has(m.id))
  }

  // Query — only named, notable places
  const q = `[out:json][timeout:20];
(
  node["tourism"~"attraction|viewpoint|museum|artwork"]["name"](around:5000,${lat},${lng});
  node["historic"~"castle|monument|palace|fort|ruins|megalith|dolmen|menhir|mine|tower|cemetery"]["name"](around:5000,${lat},${lng});
  node["natural"~"volcano|cave_entrance|hot_spring|waterfall|peak|glacier|spring|arch|cliff|cape|gorge"]["name"](around:5000,${lat},${lng});
  node["waterway"="waterfall"]["name"](around:5000,${lat},${lng});
  node["amenity"~"cathedral|theatre"]["name"]["historic"](around:5000,${lat},${lng});
  node["man_made"~"lighthouse|windmill|watermill"]["name"](around:5000,${lat},${lng});
  node["natural"="tree"]["landmark"="yes"]["name"](around:5000,${lat},${lng});
  node["historic"="memorial"]["tourism"]["name"](around:5000,${lat},${lng});
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
      if (existingIds.has(id)) continue
      const elLat = el.lat || el.center?.lat
      const elLng = el.lon || el.center?.lon
      if (!elLat || !elLng) continue

      const classified = classify(el.tags)
      if (!classified) continue // Skip unclassified — reduces clutter

      results.push({ id, name: el.tags.name, lat: elLat, lng: elLng, ...classified, discovered: false })
    }

    // Limit to 20 most interesting per zone (prioritize by rarity)
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 }
    const limited = results
      .sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity])
      .slice(0, 20)

    cache[key] = { monuments: limited, timestamp: Date.now() }
    saveCache(cache)

    return limited.filter(m => !existingIds.has(m.id))
  } catch { return [] }
}
