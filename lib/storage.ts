import { Badge, Monument, CountryDiscovery, DailyObjective, DiscoveryLog, ExplorationPath } from '@/types/game'
import { DEFAULT_BADGES, DEFAULT_MONUMENTS, DEFAULT_LAT, DEFAULT_LNG } from './constants'

const KEYS = {
  TILES: 'ti_tiles',
  SCORE: 'ti_score',
  BADGES: 'ti_badges',
  MONUMENTS: 'ti_monuments',
  PLAYER: 'ti_player',
  COUNTRIES: 'ti_countries',
  XP: 'ti_xp',
  LEVEL: 'ti_level',
  OBJECTIVES: 'ti_objectives',
  LOG: 'ti_log',
  PATH: 'ti_path',
  DISTANCE: 'ti_distance',
}

const safe = {
  get: (key: string) => { try { return localStorage.getItem(key) } catch { return null } },
  set: (key: string, val: string) => { try { localStorage.setItem(key, val) } catch {} },
  remove: (key: string) => { try { localStorage.removeItem(key) } catch {} },
}

export const saveTiles = (t: Set<string>) => safe.set(KEYS.TILES, JSON.stringify([...t]))
export const loadTiles = (): Set<string> => { const r = safe.get(KEYS.TILES); return r ? new Set(JSON.parse(r)) : new Set() }

export const saveScore = (s: number) => safe.set(KEYS.SCORE, String(s))
export const loadScore = (): number => { const r = safe.get(KEYS.SCORE); return r ? parseInt(r, 10) : 0 }

export const saveXP = (xp: number) => safe.set(KEYS.XP, String(xp))
export const loadXP = (): number => { const r = safe.get(KEYS.XP); return r ? parseInt(r, 10) : 0 }

export const saveLevel = (l: number) => safe.set(KEYS.LEVEL, String(l))
export const loadLevel = (): number => { const r = safe.get(KEYS.LEVEL); return r ? parseInt(r, 10) : 1 }

export const saveDistance = (d: number) => safe.set(KEYS.DISTANCE, String(d))
export const loadDistance = (): number => { const r = safe.get(KEYS.DISTANCE); return r ? parseFloat(r) : 0 }

export function saveBadges(badges: Badge[]): void { safe.set(KEYS.BADGES, JSON.stringify(badges)) }
export function loadBadges(): Badge[] {
  const raw = safe.get(KEYS.BADGES)
  if (raw) {
    const saved = JSON.parse(raw) as Badge[]
    return DEFAULT_BADGES.map(def => saved.find(b => b.id === def.id) || def)
  }
  return [...DEFAULT_BADGES]
}

export function saveMonuments(monuments: Monument[]): void { safe.set(KEYS.MONUMENTS, JSON.stringify(monuments)) }
export function loadMonuments(): Monument[] {
  const raw = safe.get(KEYS.MONUMENTS)
  if (raw) {
    const saved = JSON.parse(raw) as Monument[]
    return DEFAULT_MONUMENTS.map(def => {
      const found = saved.find(m => m.id === def.id)
      return found ? { ...def, discovered: found.discovered, discoveredAt: found.discoveredAt } : def
    })
  }
  return [...DEFAULT_MONUMENTS]
}

export function savePlayer(lat: number, lng: number): void { safe.set(KEYS.PLAYER, JSON.stringify({ lat, lng })) }
export function loadPlayer(): { lat: number; lng: number } {
  const raw = safe.get(KEYS.PLAYER)
  return raw ? JSON.parse(raw) : { lat: DEFAULT_LAT, lng: DEFAULT_LNG }
}

export function saveCountries(countries: CountryDiscovery[]): void { safe.set(KEYS.COUNTRIES, JSON.stringify(countries)) }
export function loadCountries(): CountryDiscovery[] {
  const raw = safe.get(KEYS.COUNTRIES); return raw ? JSON.parse(raw) : []
}

export function saveObjectives(objectives: DailyObjective[]): void { safe.set(KEYS.OBJECTIVES, JSON.stringify(objectives)) }
export function loadObjectives(): DailyObjective[] {
  const raw = safe.get(KEYS.OBJECTIVES); return raw ? JSON.parse(raw) : []
}

export function saveLog(log: DiscoveryLog[]): void {
  // Keep last 100 entries
  safe.set(KEYS.LOG, JSON.stringify(log.slice(-100)))
}
export function loadLog(): DiscoveryLog[] {
  const raw = safe.get(KEYS.LOG); return raw ? JSON.parse(raw) : []
}

export function savePath(path: ExplorationPath[]): void {
  // Keep last 500 points
  safe.set(KEYS.PATH, JSON.stringify(path.slice(-500)))
}
export function loadPath(): ExplorationPath[] {
  const raw = safe.get(KEYS.PATH); return raw ? JSON.parse(raw) : []
}

export function clearAll(): void {
  Object.values(KEYS).forEach(k => safe.remove(k))
}
