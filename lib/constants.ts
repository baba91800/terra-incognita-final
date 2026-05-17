export const TILE_SIZE_METERS = 10
export const REVEAL_RADIUS_METERS = 30
export const MONUMENT_DISCOVER_RADIUS_METERS = 25
export const MOVE_STEP_METERS = 10

export const RARITY_POINTS = {
  common: 50,
  rare: 150,
  epic: 300,
  legendary: 1000,
} as const

export const RARITY_COLORS = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
} as const

export const RARITY_LABELS = {
  common: 'COMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: 'LEGENDARY',
} as const

export const TILE_POINTS = 10

// ── LEVEL SYSTEM ─────────────────────────────────────────────
export const LEVEL_TITLES = [
  'Novice', 'Wanderer', 'Scout', 'Explorer', 'Pathfinder',
  'Ranger', 'Cartographer', 'Adventurer', 'Voyager', 'Discoverer',
  'Pioneer', 'Trailblazer', 'Geographer', 'World Seeker', 'Legend',
]

export function xpForLevel(level: number): number {
  return Math.floor(300 * Math.pow(1.55, level - 1))
}

export function getLevelFromXP(xp: number): { level: number; xpIntoLevel: number; xpForNext: number } {
  let level = 1
  let remaining = xp
  while (remaining >= xpForLevel(level) && level < LEVEL_TITLES.length) {
    remaining -= xpForLevel(level)
    level++
  }
  return { level, xpIntoLevel: remaining, xpForNext: xpForLevel(level) }
}

// ── DAILY OBJECTIVES ─────────────────────────────────────────
export type ObjType = 'tiles' | 'monuments' | 'countries' | 'score' | 'distance'

export interface ObjTemplate {
  id: string
  type: ObjType
  target: number
  reward: number
  icon: string
  description: string
}

export const OBJECTIVE_TEMPLATES: ObjTemplate[] = [
  { id: 'obj_tiles_50',   type: 'tiles',     target: 50,   reward: 200, icon: '🗺️', description: 'Discover 50 new tiles' },
  { id: 'obj_tiles_150',  type: 'tiles',     target: 150,  reward: 500, icon: '🗺️', description: 'Discover 150 new tiles' },
  { id: 'obj_tiles_300',  type: 'tiles',     target: 300,  reward: 900, icon: '🗺️', description: 'Discover 300 new tiles' },
  { id: 'obj_monument_1', type: 'monuments', target: 1,    reward: 300, icon: '🏛️', description: 'Discover 1 monument' },
  { id: 'obj_monument_3', type: 'monuments', target: 3,    reward: 700, icon: '🏛️', description: 'Discover 3 monuments' },
  { id: 'obj_country_1',  type: 'countries', target: 1,    reward: 400, icon: '🌍', description: 'Discover a new country' },
  { id: 'obj_score_500',  type: 'score',     target: 500,  reward: 200, icon: '⚡', description: 'Earn 500 XP today' },
  { id: 'obj_score_2000', type: 'score',     target: 2000, reward: 600, icon: '⚡', description: 'Earn 2000 XP today' },
  { id: 'obj_dist_500',   type: 'distance',  target: 500,  reward: 300, icon: '👟', description: 'Walk 500 meters' },
  { id: 'obj_dist_1000',  type: 'distance',  target: 1000, reward: 500, icon: '👟', description: 'Walk 1 km' },
]

export function generateDailyObjectives(date: string): Array<ObjTemplate & { date: string; current: number; completed: boolean }> {
  const seed = date.split('-').reduce((a, b) => a + parseInt(b), 0)
  const pick = (offset: number) => OBJECTIVE_TEMPLATES[(seed + offset) % OBJECTIVE_TEMPLATES.length]
  return [pick(0), pick(3), pick(7)].map(t => ({ ...t, date, current: 0, completed: false }))
}

export function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

// ── DEFAULT DATA ──────────────────────────────────────────────
export const DEFAULT_LAT = 48.8566
export const DEFAULT_LNG = 2.3522

export const DEFAULT_MONUMENTS = [
  { id: 'm1',  name: 'Tour Eiffel',        lat: 48.8584, lng: 2.2945,  rarity: 'legendary' as const, type: 'monument',  icon: '🗼', discovered: false },
  { id: 'm2',  name: 'Arc de Triomphe',    lat: 48.8738, lng: 2.2950,  rarity: 'epic'      as const, type: 'monument',  icon: '🏛️', discovered: false },
  { id: 'm3',  name: 'Musée du Louvre',    lat: 48.8606, lng: 2.3376,  rarity: 'legendary' as const, type: 'museum',    icon: '🏛️', discovered: false },
  { id: 'm4',  name: 'Cathédrale Notre-Dame', lat: 48.8530, lng: 2.3499, rarity: 'epic'    as const, type: 'cathedral', icon: '⛪', discovered: false },
  { id: 'm5',  name: 'Sacré-Cœur',        lat: 48.8867, lng: 2.3431,  rarity: 'epic'      as const, type: 'cathedral', icon: '⛪', discovered: false },
  { id: 'm6',  name: "Musée d'Orsay",      lat: 48.8599, lng: 2.3266,  rarity: 'rare'      as const, type: 'museum',    icon: '🏛️', discovered: false },
  { id: 'm7',  name: 'Palais Royal',       lat: 48.8638, lng: 2.3370,  rarity: 'rare'      as const, type: 'monument',  icon: '🏯', discovered: false },
  { id: 'm8',  name: 'Place de la Bastille', lat: 48.8533, lng: 2.3692, rarity: 'common'   as const, type: 'monument',  icon: '🗿', discovered: false },
  { id: 'm9',  name: 'Panthéon',           lat: 48.8462, lng: 2.3461,  rarity: 'rare'      as const, type: 'monument',  icon: '🏛️', discovered: false },
  { id: 'm10', name: 'Sainte-Chapelle',    lat: 48.8554, lng: 2.3450,  rarity: 'rare'      as const, type: 'cathedral', icon: '⛪', discovered: false },
  { id: 'm11', name: 'Place des Vosges',   lat: 48.8554, lng: 2.3646,  rarity: 'common'    as const, type: 'monument',  icon: '🗿', discovered: false },
  { id: 'm12', name: 'Opéra Garnier',      lat: 48.8719, lng: 2.3316,  rarity: 'rare'      as const, type: 'monument',  icon: '🎭', discovered: false },
]

export const DEFAULT_BADGES = [
  { id: 'b1',  name: 'First Steps',          description: 'Discover 10 tiles',              icon: '👣', earned: false },
  { id: 'b2',  name: 'Explorer',             description: 'Discover 500 tiles',             icon: '🗺️', earned: false },
  { id: 'b3',  name: 'Urban Explorer',       description: 'Discover 2000 tiles',            icon: '🏙️', earned: false },
  { id: 'b4',  name: 'Monument Hunter',      description: 'Discover your first monument',   icon: '🏛️', earned: false },
  { id: 'b5',  name: 'Castle Seeker',        description: 'Discover 5 monuments',           icon: '🏰', earned: false },
  { id: 'b6',  name: 'Capital Explorer',     description: 'Discover 10 monuments',          icon: '🌆', earned: false },
  { id: 'b7',  name: 'Legendary Discoverer', description: 'Discover a Legendary monument',  icon: '⭐', earned: false },
  { id: 'b8',  name: 'Century',              description: 'Reach 5000 points',              icon: '💯', earned: false },
  { id: 'b9',  name: 'Epic Hunter',          description: 'Discover an Epic monument',      icon: '💎', earned: false },
  { id: 'b10', name: 'Night Wanderer',       description: 'Discover 200 tiles',             icon: '🌙', earned: false },
]

// ── COUNTRY BONUSES ───────────────────────────────────────────
export interface CountryBonus {
  code: string
  name: string
  flag: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points: number
  reason: string
}

export const COUNTRY_BONUSES: CountryBonus[] = [
  { code: 'AQ', name: 'Antarctica',            flag: '🇦🇶', rarity: 'legendary', points: 2000, reason: 'The frozen frontier' },
  { code: 'NR', name: 'Nauru',                 flag: '🇳🇷', rarity: 'legendary', points: 1500, reason: 'Smallest island nation' },
  { code: 'TV', name: 'Tuvalu',                flag: '🇹🇻', rarity: 'legendary', points: 1500, reason: 'Barely above sea level' },
  { code: 'KI', name: 'Kiribati',              flag: '🇰🇮', rarity: 'legendary', points: 1500, reason: 'Spans the Date Line' },
  { code: 'PW', name: 'Palau',                 flag: '🇵🇼', rarity: 'legendary', points: 1200, reason: 'Pristine Pacific paradise' },
  { code: 'BT', name: 'Bhutan',                flag: '🇧🇹', rarity: 'epic',      points: 600,  reason: 'Kingdom of Happiness' },
  { code: 'TM', name: 'Turkmenistan',          flag: '🇹🇲', rarity: 'epic',      points: 600,  reason: 'Cradle of Fire' },
  { code: 'KP', name: 'North Korea',           flag: '🇰🇵', rarity: 'epic',      points: 700,  reason: 'The Hermit Kingdom' },
  { code: 'AF', name: 'Afghanistan',           flag: '🇦🇫', rarity: 'epic',      points: 500,  reason: 'Ancient Silk Road' },
  { code: 'MM', name: 'Myanmar',               flag: '🇲🇲', rarity: 'epic',      points: 350,  reason: 'Land of Golden Pagodas' },
  { code: 'CU', name: 'Cuba',                  flag: '🇨🇺', rarity: 'epic',      points: 350,  reason: 'Island frozen in time' },
  { code: 'MN', name: 'Mongolia',              flag: '🇲🇳', rarity: 'rare',      points: 200,  reason: 'Empire of the steppes' },
  { code: 'KZ', name: 'Kazakhstan',            flag: '🇰🇿', rarity: 'rare',      points: 180,  reason: 'Vast Central Asian steppe' },
  { code: 'IS', name: 'Iceland',               flag: '🇮🇸', rarity: 'rare',      points: 130,  reason: 'Land of Fire and Ice' },
  { code: 'GE', name: 'Georgia',               flag: '🇬🇪', rarity: 'rare',      points: 150,  reason: 'Birthplace of wine' },
  { code: 'NP', name: 'Nepal',                 flag: '🇳🇵', rarity: 'rare',      points: 150,  reason: 'Rooftop of the world' },
  { code: 'ET', name: 'Ethiopia',              flag: '🇪🇹', rarity: 'rare',      points: 140,  reason: 'Cradle of Humanity' },
  { code: 'FR', name: 'France',                flag: '🇫🇷', rarity: 'common',    points: 50,   reason: 'Most visited country' },
  { code: 'DE', name: 'Germany',               flag: '🇩🇪', rarity: 'common',    points: 50,   reason: 'Heart of Europe' },
  { code: 'GB', name: 'United Kingdom',        flag: '🇬🇧', rarity: 'common',    points: 50,   reason: 'Birthplace of democracy' },
  { code: 'ES', name: 'Spain',                 flag: '🇪🇸', rarity: 'common',    points: 50,   reason: 'Land of Flamenco' },
  { code: 'IT', name: 'Italy',                 flag: '🇮🇹', rarity: 'common',    points: 50,   reason: 'Eternal cities' },
  { code: 'US', name: 'United States',         flag: '🇺🇸', rarity: 'common',    points: 50,   reason: 'Land of opportunity' },
  { code: 'JP', name: 'Japan',                 flag: '🇯🇵', rarity: 'common',    points: 80,   reason: 'Rising Sun' },
  { code: 'CN', name: 'China',                 flag: '🇨🇳', rarity: 'common',    points: 80,   reason: 'Middle Kingdom' },
  { code: 'IN', name: 'India',                 flag: '🇮🇳', rarity: 'common',    points: 80,   reason: 'Subcontinent of contrasts' },
  { code: 'BR', name: 'Brazil',                flag: '🇧🇷', rarity: 'common',    points: 80,   reason: 'Largest in South America' },
  { code: 'AU', name: 'Australia',             flag: '🇦🇺', rarity: 'common',    points: 80,   reason: 'Land Down Under' },
  { code: 'CA', name: 'Canada',                flag: '🇨🇦', rarity: 'common',    points: 60,   reason: 'Great white north' },
  { code: 'MX', name: 'Mexico',                flag: '🇲🇽', rarity: 'common',    points: 60,   reason: 'Ancient Aztec civilization' },
  { code: 'PT', name: 'Portugal',              flag: '🇵🇹', rarity: 'common',    points: 55,   reason: 'Age of Discoveries' },
  { code: 'GR', name: 'Greece',                flag: '🇬🇷', rarity: 'common',    points: 60,   reason: 'Cradle of civilization' },
  { code: 'TR', name: 'Turkey',                flag: '🇹🇷', rarity: 'common',    points: 60,   reason: 'Bridge East and West' },
  { code: 'ZA', name: 'South Africa',          flag: '🇿🇦', rarity: 'common',    points: 70,   reason: 'Rainbow Nation' },
  { code: 'EG', name: 'Egypt',                 flag: '🇪🇬', rarity: 'common',    points: 70,   reason: 'Land of Pharaohs' },
  { code: 'TH', name: 'Thailand',              flag: '🇹🇭', rarity: 'common',    points: 70,   reason: 'Land of Smiles' },
  { code: 'AR', name: 'Argentina',             flag: '🇦🇷', rarity: 'common',    points: 70,   reason: 'Land of Tango' },
  { code: 'PE', name: 'Peru',                  flag: '🇵🇪', rarity: 'common',    points: 80,   reason: 'Cradle of the Inca' },
  { code: 'NO', name: 'Norway',                flag: '🇳🇴', rarity: 'common',    points: 65,   reason: 'Land of Fjords' },
  { code: 'NZ', name: 'New Zealand',           flag: '🇳🇿', rarity: 'common',    points: 80,   reason: 'Middle Earth' },
  { code: 'RU', name: 'Russia',                flag: '🇷🇺', rarity: 'common',    points: 75,   reason: 'Largest country on Earth' },
  { code: 'MA', name: 'Morocco',               flag: '🇲🇦', rarity: 'common',    points: 65,   reason: 'Gateway to Africa' },
  { code: 'KR', name: 'South Korea',           flag: '🇰🇷', rarity: 'common',    points: 70,   reason: 'Land of Morning Calm' },
  { code: 'VN', name: 'Vietnam',               flag: '🇻🇳', rarity: 'common',    points: 70,   reason: 'S-curve of Asia' },
  { code: 'ID', name: 'Indonesia',             flag: '🇮🇩', rarity: 'common',    points: 70,   reason: '17,000 islands' },
]

export const COUNTRY_BONUS_MAP: Record<string, CountryBonus> =
  COUNTRY_BONUSES.reduce((acc, c) => ({ ...acc, [c.code]: c }), {})
