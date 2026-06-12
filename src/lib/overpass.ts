import type { Monument } from '../types/game'
import type { Rarity } from '../types/game'

// ── Category colors ───────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
  volcano: '#22c55e', glacier: '#22c55e', peak: '#22c55e', cave: '#22c55e',
  waterfall: '#22c55e', hot_spring: '#22c55e', park: '#22c55e', reserve: '#22c55e',
  spring: '#38bdf8', tree: '#22c55e', cliff: '#22c55e', gorge: '#22c55e',
  arch: '#22c55e', cape: '#22c55e', rock: '#22c55e', beach: '#22c55e',
  palace: '#f59e0b', heritage: '#f59e0b', castle: '#f59e0b', fort: '#f59e0b',
  ruins: '#f59e0b', monument: '#f59e0b', memorial: '#f59e0b', megalith: '#f59e0b',
  tower: '#f59e0b', roman: '#f59e0b', statue: '#f59e0b', cemetery: '#f59e0b',
  museum: '#3b82f6', cathedral: '#3b82f6', theatre: '#3b82f6', library: '#3b82f6',
  artwork: '#3b82f6', fountain: '#38bdf8', garden: '#3b82f6', worship: '#3b82f6',
  lighthouse: '#f97316', windmill: '#f97316', watermill: '#f97316', mine: '#f97316',
  bunker: '#78716c', dovecote: '#a78bfa', lavoir: '#60a5fa', well: '#38bdf8',
  cross: '#e5e7eb', shrine: '#fbbf24', milestone: '#9ca3af', battlefield: '#ef4444',
  trench: '#78716c', roman_road: '#d97706',
  station: '#f97316', bridge: '#f97316', tunnel: '#f97316',
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
  if (tags.historic === 'ruins')            return { rarity: 'epic', type: 'ruins',      icon: '🏚️' }
  if (tags.natural === 'arch')              return { rarity: 'epic', type: 'arch',       icon: '🌉' }
  if (tags.historic === 'fort')             return { rarity: 'epic', type: 'fort',       icon: '🏰' }
  if (tags.man_made === 'lighthouse')       return { rarity: 'epic', type: 'lighthouse', icon: '🗼' }
  if (tags.historic === 'megalith' || tags.historic === 'dolmen' || tags.historic === 'menhir') return { rarity: 'epic', type: 'megalith', icon: '🗿' }
  if (tags.natural === 'cape')              return { rarity: 'epic', type: 'cape',       icon: '🏔️' }
  if (tags.military === 'bunker' || tags.military === 'pillbox') return { rarity: 'epic', type: 'bunker', icon: '🪖' }
  if (tags.historic === 'battlefield')      return { rarity: 'epic', type: 'battlefield', icon: '⚔️' }

  // RARE
  if (tags.tourism === 'viewpoint')         return { rarity: 'rare', type: 'viewpoint',  icon: '👁️' }
  if (tags.tourism === 'museum')            return { rarity: 'rare', type: 'museum',     icon: '🏛️' }
  if (tags.historic === 'monument')         return { rarity: 'rare', type: 'monument',   icon: '🗿' }
  if (tags.natural === 'spring' || tags.waterway === 'spring') return { rarity: 'rare', type: 'spring', icon: '💦' }
  if (tags.natural === 'tree' && (tags.landmark === 'yes' || tags.denotation === 'landmark' || tags.heritage)) return { rarity: 'rare', type: 'tree', icon: '🌳' }
  if (tags.man_made === 'windmill')         return { rarity: 'rare', type: 'windmill',   icon: '🌀' }
  if (tags.man_made === 'watermill')        return { rarity: 'rare', type: 'watermill',  icon: '⚙️' }
  if (tags.historic === 'mine' || tags.historic === 'mineshaft') return { rarity: 'rare', type: 'mine', icon: '⛏️' }
  if (tags.historic === 'tower')            return { rarity: 'rare', type: 'tower',      icon: '🗼' }
  if (tags.natural === 'cliff')             return { rarity: 'rare', type: 'cliff',      icon: '🪨' }
  if (tags.natural === 'gorge')             return { rarity: 'rare', type: 'gorge',      icon: '🏔️' }
  if (tags.historic === 'cemetery')         return { rarity: 'rare', type: 'cemetery',   icon: '⚰️' }
  if (tags.amenity === 'theatre' && tags.historic)  return { rarity: 'rare', type: 'theatre',  icon: '🎭' }
  if (tags.historic === 'memorial')         return { rarity: 'rare', type: 'memorial',   icon: '🪦' }
  if (tags.natural === 'rock')              return { rarity: 'rare', type: 'rock',      icon: '🪨' }
  if (tags.man_made === 'dovecote')         return { rarity: 'rare', type: 'dovecote',   icon: '🕊️' }
  if (tags.historic === 'roman_road')       return { rarity: 'rare', type: 'roman_road', icon: '🛣️' }
  if (tags.historic === 'trench')           return { rarity: 'rare', type: 'trench',     icon: '🪖' }

  // COMMON — éléments ruraux fréquents
  if (tags.tourism === 'artwork')           return { rarity: 'common', type: 'artwork',  icon: '🎨' }
  if (tags.amenity === 'fountain')          return { rarity: 'common', type: 'fountain', icon: '⛲' }
  if (tags.leisure === 'garden')            return { rarity: 'common', type: 'garden',   icon: '🌷' }
  if (tags.man_made === 'water_well')       return { rarity: 'common', type: 'well',     icon: '🪣' }
  if (tags.historic === 'wayside_cross')    return { rarity: 'common', type: 'cross',    icon: '✝️' }
  if (tags.historic === 'wayside_shrine')   return { rarity: 'common', type: 'shrine',   icon: '⛩️' }
  if (tags.historic === 'lavoir' || tags.amenity === 'lavoir') return { rarity: 'common', type: 'lavoir', icon: '🪣' }
  if (tags.historic === 'boundary_stone' || tags.historic === 'milestone') return { rarity: 'common', type: 'milestone', icon: '🪨' }

  return null
}

// ── Cache persistant ──────────────────────────────────────────
const CACHE_KEY = 'ti2_overpass_cache'
const CACHE_VERSION = 4

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

// ── Noms par défaut pour éléments sans nom OSM ─────────────────
const DEFAULT_NAMES: Record<string, string> = {
  lavoir: 'Lavoir', well: 'Puits ancien', spring: 'Source naturelle',
  fountain: 'Fontaine', cross: 'Croix de chemin', shrine: 'Oratoire',
  milestone: 'Borne historique', dovecote: 'Pigeonnier', bunker: 'Bunker',
  battlefield: 'Champ de bataille', trench: 'Tranchée', tree: 'Arbre remarquable',
  roman_road: 'Voie romaine', memorial: 'Mémorial', ruins: 'Ruines',
  castle: 'Château', fort: 'Fort', garden: 'Jardin', artwork: "Œuvre d'art",
}

function getMonumentName(tags: Record<string,string>, type: string): string {
  if (tags.name) return tags.name
  return DEFAULT_NAMES[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g,' ')
}

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

  const q = `[out:json][timeout:25];
(
  node["tourism"~"attraction|viewpoint|museum|artwork"]["name"](around:5000,${lat},${lng});
  node["historic"~"castle|monument|palace|fort|ruins|megalith|dolmen|menhir|mine|tower|cemetery"]["name"](around:5000,${lat},${lng});
  node["natural"~"volcano|cave_entrance|hot_spring|waterfall|peak|glacier|spring|arch|cliff|cape|gorge|rock"]["name"](around:5000,${lat},${lng});
  node["waterway"="waterfall"]["name"](around:5000,${lat},${lng});
  node["amenity"~"cathedral|theatre"]["historic"](around:5000,${lat},${lng});
  node["man_made"~"lighthouse|windmill|watermill"]["name"](around:5000,${lat},${lng});
  node["natural"="tree"]["landmark"="yes"](around:5000,${lat},${lng});
  node["natural"="tree"]["heritage"](around:5000,${lat},${lng});
  node["historic"="memorial"]["tourism"](around:5000,${lat},${lng});
  node["amenity"="fountain"](around:5000,${lat},${lng});
  node["leisure"="garden"]["tourism"](around:5000,${lat},${lng});
  node["tourism"="artwork"](around:5000,${lat},${lng});
  node["man_made"="water_well"](around:5000,${lat},${lng});
  node["historic"~"wayside_cross|wayside_shrine"](around:5000,${lat},${lng});
  node["historic"~"boundary_stone|milestone"](around:5000,${lat},${lng});
  node["man_made"="dovecote"](around:5000,${lat},${lng});
  node["military"~"bunker|pillbox"](around:5000,${lat},${lng});
  node["historic"~"battlefield|trench"](around:5000,${lat},${lng});
  node["waterway"="spring"](around:5000,${lat},${lng});
  node["natural"="spring"](around:5000,${lat},${lng});
  node["historic"="roman_road"](around:5000,${lat},${lng});
  way["historic"~"castle|ruins|fort"]["name"](around:5000,${lat},${lng});
  way["historic"~"lavoir"](around:5000,${lat},${lng});
  way["amenity"="lavoir"](around:5000,${lat},${lng});
  way["military"~"bunker"](around:5000,${lat},${lng});
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
      if (!el.tags) continue
      const id = `osm_${el.type}_${el.id}`
      if (existingIds.has(id)) continue
      const elLat = el.lat || el.center?.lat
      const elLng = el.lon || el.center?.lon
      if (!elLat || !elLng) continue

      const classified = classify(el.tags)
      if (!classified) continue

      results.push({ id, name: getMonumentName(el.tags, classified.type), lat: elLat, lng: elLng, ...classified, discovered: false })
    }

    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 }
    const limited = results
      .sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity])
      .slice(0, 25)

    cache[key] = { monuments: limited, timestamp: Date.now() }
    saveCache(cache)

    return limited.filter(m => !existingIds.has(m.id))
  } catch { return [] }
}
