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
// XP required to reach each level (index = level - 1)
export const LEVEL_TITLES = [
  'Novice',        // 1
  'Wanderer',      // 2
  'Scout',         // 3
  'Explorer',      // 4
  'Pathfinder',    // 5
  'Ranger',        // 6
  'Cartographer',  // 7
  'Adventurer',    // 8
  'Voyager',       // 9
  'Discoverer',    // 10
  'Pioneer',       // 11
  'Trailblazer',   // 12
  'Geographer',    // 13
  'World Seeker',  // 14
  'Legend',        // 15
]

export function xpForLevel(level: number): number {
  // Exponential curve: level 2 = 500xp, doubles roughly every 3 levels
  return Math.floor(300 * Math.pow(1.55, level - 1))
}

export function totalXpForLevel(level: number): number {
  let total = 0
  for (let i = 1; i < level; i++) total += xpForLevel(i)
  return total
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
export const OBJECTIVE_TEMPLATES = [
  { id: 'obj_tiles_50',    type: 'tiles' as const,     target: 50,   reward: 200,  icon: '🗺️', description: 'Discover 50 new tiles' },
  { id: 'obj_tiles_150',   type: 'tiles' as const,     target: 150,  reward: 500,  icon: '🗺️', description: 'Discover 150 new tiles' },
  { id: 'obj_tiles_300',   type: 'tiles' as const,     target: 300,  reward: 900,  icon: '🗺️', description: 'Discover 300 new tiles' },
  { id: 'obj_monument_1',  type: 'monuments' as const, target: 1,    reward: 300,  icon: '🏛️', description: 'Discover 1 monument' },
  { id: 'obj_monument_3',  type: 'monuments' as const, target: 3,    reward: 700,  icon: '🏛️', description: 'Discover 3 monuments' },
  { id: 'obj_country_1',   type: 'countries' as const, target: 1,    reward: 400,  icon: '🌍', description: 'Discover a new country' },
  { id: 'obj_score_500',   type: 'score' as const,     target: 500,  reward: 200,  icon: '⚡', description: 'Earn 500 XP today' },
  { id: 'obj_score_2000',  type: 'score' as const,     target: 2000, reward: 600,  icon: '⚡', description: 'Earn 2000 XP today' },
  { id: 'obj_dist_500',    type: 'distance' as const,  target: 500,  reward: 300,  icon: '👟', description: 'Walk 500 meters' },
  { id: 'obj_dist_1000',   type: 'distance' as const,  target: 1000, reward: 500,  icon: '👟', description: 'Walk 1 km' },
]

export function generateDailyObjectives(date: string): import('@/types/game').DailyObjective[] {
  // Deterministic 3 objectives from date seed
  const seed = date.split('-').reduce((a, b) => a + parseInt(b), 0)
  const pick = (offset: number) => OBJECTIVE_TEMPLATES[(seed + offset) % OBJECTIVE_TEMPLATES.length]
  const picked = [pick(0), pick(3), pick(7)]
  return picked.map(t => ({
    ...t,
    date,
    current: 0,
    completed: false,
  }))
}

export function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

// Paris centered monuments
export const DEFAULT_MONUMENTS = [
  { id: 'm1', name: 'Tour Eiffel', lat: 48.8584, lng: 2.2945, rarity: 'legendary' as const, type: 'monument', discovered: false },
  { id: 'm2', name: 'Arc de Triomphe', lat: 48.8738, lng: 2.295, rarity: 'epic' as const, type: 'monument', discovered: false },
  { id: 'm3', name: 'Musée du Louvre', lat: 48.8606, lng: 2.3376, rarity: 'legendary' as const, type: 'museum', discovered: false },
  { id: 'm4', name: 'Cathédrale Notre-Dame', lat: 48.853, lng: 2.3499, rarity: 'epic' as const, type: 'cathedral', discovered: false },
  { id: 'm5', name: 'Sacré-Cœur', lat: 48.8867, lng: 2.3431, rarity: 'epic' as const, type: 'cathedral', discovered: false },
  { id: 'm6', name: 'Musée d\'Orsay', lat: 48.8599, lng: 2.3266, rarity: 'rare' as const, type: 'museum', discovered: false },
  { id: 'm7', name: 'Palais Royal', lat: 48.8638, lng: 2.337, rarity: 'rare' as const, type: 'monument', discovered: false },
  { id: 'm8', name: 'Place de la Bastille', lat: 48.8533, lng: 2.3692, rarity: 'common' as const, type: 'monument', discovered: false },
  { id: 'm9', name: 'Panthéon', lat: 48.8462, lng: 2.3461, rarity: 'rare' as const, type: 'monument', discovered: false },
  { id: 'm10', name: 'Sainte-Chapelle', lat: 48.8554, lng: 2.345, rarity: 'rare' as const, type: 'cathedral', discovered: false },
  { id: 'm11', name: 'Place des Vosges', lat: 48.8554, lng: 2.3646, rarity: 'common' as const, type: 'monument', discovered: false },
  { id: 'm12', name: 'Opéra Garnier', lat: 48.8719, lng: 2.3316, rarity: 'rare' as const, type: 'monument', discovered: false },
]

export const DEFAULT_BADGES = [
  { id: 'b1', name: 'First Steps', description: 'Discover 10 tiles', icon: '👣', earned: false },
  { id: 'b2', name: 'Explorer', description: 'Discover 500 tiles', icon: '🗺️', earned: false },
  { id: 'b3', name: 'Urban Explorer', description: 'Discover 2000 tiles', icon: '🏙️', earned: false },
  { id: 'b4', name: 'Monument Hunter', description: 'Discover your first monument', icon: '🏛️', earned: false },
  { id: 'b5', name: 'Castle Seeker', description: 'Discover 5 monuments', icon: '🏰', earned: false },
  { id: 'b6', name: 'Capital Explorer', description: 'Discover 10 monuments', icon: '🌆', earned: false },
  { id: 'b7', name: 'Legendary Discoverer', description: 'Discover a Legendary monument', icon: '⭐', earned: false },
  { id: 'b8', name: 'Century', description: 'Reach 5000 points', icon: '💯', earned: false },
  { id: 'b9', name: 'Epic Hunter', description: 'Discover an Epic monument', icon: '💎', earned: false },
  { id: 'b10', name: 'Night Wanderer', description: 'Discover 200 tiles', icon: '🌙', earned: false },
]

export const DEFAULT_LAT = 48.8566
export const DEFAULT_LNG = 2.3522

// Country bonus system — detected via reverse geocoding (Nominatim)
export type CountryRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface CountryBonus {
  code: string       // ISO 3166-1 alpha-2
  name: string
  flag: string
  rarity: CountryRarity
  points: number
  reason: string     // shown in notification
}

export const COUNTRY_BONUSES: CountryBonus[] = [
  // LEGENDARY — extremely remote or rare to visit
  { code: 'AQ', name: 'Antarctica',         flag: '🇦🇶', rarity: 'legendary', points: 2000, reason: 'The frozen frontier' },
  { code: 'TF', name: 'French S. Territories', flag: '🇹🇫', rarity: 'legendary', points: 2000, reason: 'Most remote territory on Earth' },
  { code: 'NU', name: 'Niue',               flag: '🇳🇺', rarity: 'legendary', points: 1500, reason: 'One of the smallest nations' },
  { code: 'NR', name: 'Nauru',              flag: '🇳🇷', rarity: 'legendary', points: 1500, reason: 'Smallest island nation' },
  { code: 'TV', name: 'Tuvalu',             flag: '🇹🇻', rarity: 'legendary', points: 1500, reason: 'Barely above sea level' },
  { code: 'KI', name: 'Kiribati',           flag: '🇰🇮', rarity: 'legendary', points: 1500, reason: 'Spans the International Date Line' },
  { code: 'MH', name: 'Marshall Islands',   flag: '🇲🇭', rarity: 'legendary', points: 1500, reason: 'Remote Pacific atoll nation' },
  { code: 'PW', name: 'Palau',              flag: '🇵🇼', rarity: 'legendary', points: 1200, reason: 'Pristine Pacific paradise' },
  { code: 'CK', name: 'Cook Islands',       flag: '🇨🇰', rarity: 'legendary', points: 1200, reason: 'Self-governing Pacific nation' },
  { code: 'WS', name: 'Samoa',              flag: '🇼🇸', rarity: 'legendary', points: 1000, reason: 'Heart of Polynesia' },

  // EPIC — far, rare, or geopolitically special
  { code: 'BT', name: 'Bhutan',             flag: '🇧🇹', rarity: 'epic', points: 600, reason: 'Kingdom of Happiness, limited tourism' },
  { code: 'TM', name: 'Turkmenistan',       flag: '🇹🇲', rarity: 'epic', points: 600, reason: 'Cradle of Fire' },
  { code: 'KP', name: 'North Korea',        flag: '🇰🇵', rarity: 'epic', points: 700, reason: 'The Hermit Kingdom' },
  { code: 'AF', name: 'Afghanistan',        flag: '🇦🇫', rarity: 'epic', points: 500, reason: 'Ancient Silk Road crossroads' },
  { code: 'YE', name: 'Yemen',              flag: '🇾🇪', rarity: 'epic', points: 500, reason: 'Ancient Arabia Felix' },
  { code: 'SO', name: 'Somalia',            flag: '🇸🇴', rarity: 'epic', points: 500, reason: 'Horn of Africa' },
  { code: 'IQ', name: 'Iraq',               flag: '🇮🇶', rarity: 'epic', points: 400, reason: 'Cradle of civilization' },
  { code: 'SY', name: 'Syria',              flag: '🇸🇾', rarity: 'epic', points: 400, reason: 'Ancient crossroads of empires' },
  { code: 'LY', name: 'Libya',              flag: '🇱🇾', rarity: 'epic', points: 400, reason: 'Land of ancient Carthage' },
  { code: 'MM', name: 'Myanmar',            flag: '🇲🇲', rarity: 'epic', points: 350, reason: 'Land of Golden Pagodas' },
  { code: 'CU', name: 'Cuba',               flag: '🇨🇺', rarity: 'epic', points: 350, reason: 'Island frozen in time' },
  { code: 'IR', name: 'Iran',               flag: '🇮🇷', rarity: 'epic', points: 350, reason: 'Persian Empire legacy' },
  { code: 'MG', name: 'Madagascar',         flag: '🇲🇬', rarity: 'epic', points: 300, reason: '90% endemic species' },
  { code: 'GN', name: 'Papua New Guinea',   flag: '🇵🇬', rarity: 'epic', points: 350, reason: 'Last great wilderness' },
  { code: 'MV', name: 'Maldives',           flag: '🇲🇻', rarity: 'epic', points: 300, reason: 'Sinking paradise' },

  // RARE — off the beaten track
  { code: 'MN', name: 'Mongolia',           flag: '🇲🇳', rarity: 'rare', points: 200, reason: 'Empire of the steppes' },
  { code: 'KZ', name: 'Kazakhstan',         flag: '🇰🇿', rarity: 'rare', points: 180, reason: 'Vast Central Asian steppe' },
  { code: 'UZ', name: 'Uzbekistan',         flag: '🇺🇿', rarity: 'rare', points: 180, reason: 'Ancient Silk Road cities' },
  { code: 'GE', name: 'Georgia',            flag: '🇬🇪', rarity: 'rare', points: 150, reason: 'Birthplace of wine' },
  { code: 'AM', name: 'Armenia',            flag: '🇦🇲', rarity: 'rare', points: 150, reason: 'First Christian nation' },
  { code: 'AZ', name: 'Azerbaijan',         flag: '🇦🇿', rarity: 'rare', points: 150, reason: 'Land of Fire' },
  { code: 'LK', name: 'Sri Lanka',          flag: '🇱🇰', rarity: 'rare', points: 150, reason: 'Teardrop of India' },
  { code: 'NP', name: 'Nepal',              flag: '🇳🇵', rarity: 'rare', points: 150, reason: 'Rooftop of the world' },
  { code: 'BO', name: 'Bolivia',            flag: '🇧🇴', rarity: 'rare', points: 150, reason: 'Highest capital on Earth' },
  { code: 'EC', name: 'Ecuador',            flag: '🇪🇨', rarity: 'rare', points: 130, reason: 'Middle of the world' },
  { code: 'IS', name: 'Iceland',            flag: '🇮🇸', rarity: 'rare', points: 130, reason: 'Land of Fire and Ice' },
  { code: 'EE', name: 'Estonia',            flag: '🇪🇪', rarity: 'rare', points: 120, reason: 'Digital republic of the North' },
  { code: 'LV', name: 'Latvia',             flag: '🇱🇻', rarity: 'rare', points: 120, reason: 'Baltic amber coast' },
  { code: 'LT', name: 'Lithuania',          flag: '🇱🇹', rarity: 'rare', points: 120, reason: 'Heart of the Baltics' },
  { code: 'AL', name: 'Albania',            flag: '🇦🇱', rarity: 'rare', points: 130, reason: 'Land of the Eagles' },
  { code: 'ME', name: 'Montenegro',         flag: '🇲🇪', rarity: 'rare', points: 130, reason: 'Black Mountain Adriatic' },
  { code: 'MK', name: 'North Macedonia',    flag: '🇲🇰', rarity: 'rare', points: 120, reason: 'Land of Alexander the Great' },
  { code: 'XK', name: 'Kosovo',             flag: '🇽🇰', rarity: 'rare', points: 150, reason: 'Newest nation in Europe' },
  { code: 'MD', name: 'Moldova',            flag: '🇲🇩', rarity: 'rare', points: 130, reason: 'Wine country of Eastern Europe' },
  { code: 'BY', name: 'Belarus',            flag: '🇧🇾', rarity: 'rare', points: 130, reason: 'Last dictatorship of Europe' },
  { code: 'GH', name: 'Ghana',              flag: '🇬🇭', rarity: 'rare', points: 120, reason: 'Gateway to West Africa' },
  { code: 'ET', name: 'Ethiopia',           flag: '🇪🇹', rarity: 'rare', points: 140, reason: 'Cradle of Humanity' },
  { code: 'TZ', name: 'Tanzania',           flag: '🇹🇿', rarity: 'rare', points: 140, reason: 'Kilimanjaro & Serengeti' },
  { code: 'RW', name: 'Rwanda',             flag: '🇷🇼', rarity: 'rare', points: 130, reason: 'Land of a Thousand Hills' },

  // COMMON — major / easy to reach countries
  { code: 'FR', name: 'France',             flag: '🇫🇷', rarity: 'common', points: 50,  reason: 'Most visited country in the world' },
  { code: 'DE', name: 'Germany',            flag: '🇩🇪', rarity: 'common', points: 50,  reason: 'Heart of Europe' },
  { code: 'GB', name: 'United Kingdom',     flag: '🇬🇧', rarity: 'common', points: 50,  reason: 'Birthplace of modern democracy' },
  { code: 'ES', name: 'Spain',              flag: '🇪🇸', rarity: 'common', points: 50,  reason: 'Land of Flamenco & Tapas' },
  { code: 'IT', name: 'Italy',              flag: '🇮🇹', rarity: 'common', points: 50,  reason: 'Eternal cities & cuisine' },
  { code: 'US', name: 'United States',      flag: '🇺🇸', rarity: 'common', points: 50,  reason: 'Land of opportunity' },
  { code: 'JP', name: 'Japan',              flag: '🇯🇵', rarity: 'common', points: 80,  reason: 'Rising Sun' },
  { code: 'CN', name: 'China',              flag: '🇨🇳', rarity: 'common', points: 80,  reason: 'Middle Kingdom' },
  { code: 'IN', name: 'India',              flag: '🇮🇳', rarity: 'common', points: 80,  reason: 'Subcontinent of contrasts' },
  { code: 'BR', name: 'Brazil',             flag: '🇧🇷', rarity: 'common', points: 80,  reason: 'Largest country in South America' },
  { code: 'AU', name: 'Australia',          flag: '🇦🇺', rarity: 'common', points: 80,  reason: 'Land Down Under' },
  { code: 'CA', name: 'Canada',             flag: '🇨🇦', rarity: 'common', points: 60,  reason: 'Great white north' },
  { code: 'MX', name: 'Mexico',             flag: '🇲🇽', rarity: 'common', points: 60,  reason: 'Ancient Aztec civilization' },
  { code: 'NL', name: 'Netherlands',        flag: '🇳🇱', rarity: 'common', points: 50,  reason: 'Land below sea level' },
  { code: 'BE', name: 'Belgium',            flag: '🇧🇪', rarity: 'common', points: 50,  reason: 'Heart of the EU' },
  { code: 'CH', name: 'Switzerland',        flag: '🇨🇭', rarity: 'common', points: 60,  reason: 'Alps & precision' },
  { code: 'AT', name: 'Austria',            flag: '🇦🇹', rarity: 'common', points: 55,  reason: 'Imperial Habsburg legacy' },
  { code: 'PT', name: 'Portugal',           flag: '🇵🇹', rarity: 'common', points: 55,  reason: 'Age of Discoveries' },
  { code: 'PL', name: 'Poland',             flag: '🇵🇱', rarity: 'common', points: 55,  reason: 'Central European powerhouse' },
  { code: 'CZ', name: 'Czech Republic',     flag: '🇨🇿', rarity: 'common', points: 55,  reason: 'Golden City of Prague' },
  { code: 'HU', name: 'Hungary',            flag: '🇭🇺', rarity: 'common', points: 55,  reason: 'Pearl of the Danube' },
  { code: 'GR', name: 'Greece',             flag: '🇬🇷', rarity: 'common', points: 60,  reason: 'Cradle of Western civilization' },
  { code: 'TR', name: 'Turkey',             flag: '🇹🇷', rarity: 'common', points: 60,  reason: 'Bridge between East and West' },
  { code: 'ZA', name: 'South Africa',       flag: '🇿🇦', rarity: 'common', points: 70,  reason: 'Rainbow Nation' },
  { code: 'EG', name: 'Egypt',              flag: '🇪🇬', rarity: 'common', points: 70,  reason: 'Land of Pharaohs' },
  { code: 'MA', name: 'Morocco',            flag: '🇲🇦', rarity: 'common', points: 65,  reason: 'Gateway to Africa' },
  { code: 'TH', name: 'Thailand',           flag: '🇹🇭', rarity: 'common', points: 70,  reason: 'Land of Smiles' },
  { code: 'VN', name: 'Vietnam',            flag: '🇻🇳', rarity: 'common', points: 70,  reason: 'S-curve of Asia' },
  { code: 'ID', name: 'Indonesia',          flag: '🇮🇩', rarity: 'common', points: 70,  reason: 'Archipelago of 17,000 islands' },
  { code: 'AR', name: 'Argentina',          flag: '🇦🇷', rarity: 'common', points: 70,  reason: 'Land of Tango & Patagonia' },
  { code: 'CO', name: 'Colombia',           flag: '🇨🇴', rarity: 'common', points: 70,  reason: 'Gateway to South America' },
  { code: 'PE', name: 'Peru',               flag: '🇵🇪', rarity: 'common', points: 80,  reason: 'Cradle of the Inca' },
  { code: 'KR', name: 'South Korea',        flag: '🇰🇷', rarity: 'common', points: 70,  reason: 'Land of the Morning Calm' },
  { code: 'SA', name: 'Saudi Arabia',       flag: '🇸🇦', rarity: 'common', points: 80,  reason: 'Heart of the Arabian Peninsula' },
  { code: 'AE', name: 'UAE',                flag: '🇦🇪', rarity: 'common', points: 70,  reason: 'Desert of the Future' },
  { code: 'RU', name: 'Russia',             flag: '🇷🇺', rarity: 'common', points: 75,  reason: 'Largest country on Earth' },
  { code: 'UA', name: 'Ukraine',            flag: '🇺🇦', rarity: 'common', points: 70,  reason: 'Breadbasket of Europe' },
  { code: 'NO', name: 'Norway',             flag: '🇳🇴', rarity: 'common', points: 65,  reason: 'Land of Fjords' },
  { code: 'SE', name: 'Sweden',             flag: '🇸🇪', rarity: 'common', points: 60,  reason: 'Kingdom of Vikings' },
  { code: 'DK', name: 'Denmark',            flag: '🇩🇰', rarity: 'common', points: 60,  reason: 'Happiest country on Earth' },
  { code: 'FI', name: 'Finland',            flag: '🇫🇮', rarity: 'common', points: 60,  reason: 'Land of a Thousand Lakes' },
  { code: 'NZ', name: 'New Zealand',        flag: '🇳🇿', rarity: 'common', points: 80,  reason: 'Middle Earth' },
]

// For fast lookup by country code
export const COUNTRY_BONUS_MAP: Record<string, CountryBonus> =
  COUNTRY_BONUSES.reduce((acc, c) => ({ ...acc, [c.code]: c }), {})

