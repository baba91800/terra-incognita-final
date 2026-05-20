import type { Rarity } from '../types/game'

export const TILE_SIZE = 10
export const REVEAL_RADIUS = 30
export const MONUMENT_RADIUS = 25
export const MOVE_STEP = 10
export const TILE_POINTS = 10
export const DEFAULT_LAT = 48.8566
export const DEFAULT_LNG = 2.3522

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9ca3af', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b'
}
export const RARITY_POINTS: Record<Rarity, number> = {
  common: 50, rare: 150, epic: 300, legendary: 1000
}
export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'COMMON', rare: 'RARE', epic: 'EPIC', legendary: 'LEGENDARY'
}

export const LANGS = [
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch',   flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
]

export const LEVEL_TITLES = [
  'Novice','Wanderer','Scout','Explorer','Pathfinder',
  'Ranger','Cartographer','Adventurer','Voyager','Discoverer',
  'Pioneer','Trailblazer','Geographer','World Seeker','Legend',
]

export function xpForLevel(l: number) { return Math.floor(300 * Math.pow(1.55, l - 1)) }
export function getLevelFromXP(xp: number) {
  let level = 1, remaining = xp
  while (remaining >= xpForLevel(level) && level < LEVEL_TITLES.length) {
    remaining -= xpForLevel(level); level++
  }
  return { level, xpIntoLevel: remaining, xpForNext: xpForLevel(level) }
}

export function todayStr() { return new Date().toISOString().split('T')[0] }

export const OBJ_TEMPLATES = [
  { id:'o1', type:'tiles' as ObjType,     target:50,   reward:200, icon:'🗺️', description:'Discover 50 new tiles' },
  { id:'o2', type:'tiles' as ObjType,     target:150,  reward:500, icon:'🗺️', description:'Discover 150 new tiles' },
  { id:'o3', type:'monuments' as ObjType, target:1,    reward:300, icon:'🏛️', description:'Discover 1 monument' },
  { id:'o4', type:'monuments' as ObjType, target:3,    reward:700, icon:'🏛️', description:'Discover 3 monuments' },
  { id:'o5', type:'countries' as ObjType, target:1,    reward:400, icon:'🌍', description:'Discover a new country' },
  { id:'o6', type:'score' as ObjType,     target:500,  reward:200, icon:'⚡', description:'Earn 500 XP today' },
  { id:'o7', type:'score' as ObjType,     target:2000, reward:600, icon:'⚡', description:'Earn 2000 XP today' },
  { id:'o8', type:'distance' as ObjType,  target:500,  reward:300, icon:'👟', description:'Walk 500 meters' },
  { id:'o9', type:'distance' as ObjType,  target:1000, reward:500, icon:'👟', description:'Walk 1 km' },
]

export function genObjectives(date: string) {
  const seed = date.split('-').reduce((a,b) => a + parseInt(b), 0)
  const pick = (o: number) => OBJ_TEMPLATES[(seed + o) % OBJ_TEMPLATES.length]
  return [pick(0), pick(3), pick(6)].map(t => ({ ...t, date, current: 0, completed: false }))
}

export const DEFAULT_MONUMENTS = [
  { id:'m1',  name:'Tour Eiffel',         lat:48.8584, lng:2.2945,  rarity:'legendary' as Rarity, type:'monument',  icon:'🗼', discovered:false },
  { id:'m2',  name:'Arc de Triomphe',     lat:48.8738, lng:2.2950,  rarity:'epic'      as Rarity, type:'monument',  icon:'🏛️', discovered:false },
  { id:'m3',  name:'Musée du Louvre',     lat:48.8606, lng:2.3376,  rarity:'legendary' as Rarity, type:'museum',    icon:'🏛️', discovered:false },
  { id:'m4',  name:'Notre-Dame',          lat:48.8530, lng:2.3499,  rarity:'epic'      as Rarity, type:'cathedral', icon:'⛪', discovered:false },
  { id:'m5',  name:'Sacré-Cœur',         lat:48.8867, lng:2.3431,  rarity:'epic'      as Rarity, type:'cathedral', icon:'⛪', discovered:false },
  { id:'m6',  name:"Musée d'Orsay",       lat:48.8599, lng:2.3266,  rarity:'rare'      as Rarity, type:'museum',    icon:'🏛️', discovered:false },
  { id:'m7',  name:'Panthéon',            lat:48.8462, lng:2.3461,  rarity:'rare'      as Rarity, type:'monument',  icon:'🏛️', discovered:false },
  { id:'m8',  name:'Sainte-Chapelle',     lat:48.8554, lng:2.3450,  rarity:'rare'      as Rarity, type:'cathedral', icon:'⛪', discovered:false },
  { id:'m9',  name:'Opéra Garnier',       lat:48.8719, lng:2.3316,  rarity:'rare'      as Rarity, type:'monument',  icon:'🎭', discovered:false },
  { id:'m10', name:'Place des Vosges',    lat:48.8554, lng:2.3646,  rarity:'common'    as Rarity, type:'monument',  icon:'🗿', discovered:false },
]

export const DEFAULT_BADGES = [
  { id:'b1',  name:'First Steps',          description:'Discover 10 tiles',            icon:'👣', earned:false },
  { id:'b2',  name:'Explorer',             description:'Discover 500 tiles',           icon:'🗺️', earned:false },
  { id:'b3',  name:'Urban Explorer',       description:'Discover 2000 tiles',          icon:'🏙️', earned:false },
  { id:'b4',  name:'Monument Hunter',      description:'Find your first monument',     icon:'🏛️', earned:false },
  { id:'b5',  name:'Castle Seeker',        description:'Find 5 monuments',             icon:'🏰', earned:false },
  { id:'b6',  name:'Capital Explorer',     description:'Find 10 monuments',            icon:'🌆', earned:false },
  { id:'b7',  name:'Legendary Discoverer', description:'Find a Legendary monument',    icon:'⭐', earned:false },
  { id:'b8',  name:'Century',              description:'Reach 5000 points',            icon:'💯', earned:false },
  { id:'b9',  name:'Epic Hunter',          description:'Find an Epic monument',        icon:'💎', earned:false },
  { id:'b10', name:'Night Wanderer',       description:'Discover 200 tiles',           icon:'🌙', earned:false },
]

export interface CountryBonus { code:string; name:string; flag:string; rarity:Rarity; points:number; reason:string }
export const COUNTRIES: CountryBonus[] = [
  { code:'AQ', name:'Antarctica',     flag:'🇦🇶', rarity:'legendary', points:2000, reason:'The frozen frontier' },
  { code:'NR', name:'Nauru',          flag:'🇳🇷', rarity:'legendary', points:1500, reason:'Smallest island nation' },
  { code:'TV', name:'Tuvalu',         flag:'🇹🇻', rarity:'legendary', points:1500, reason:'Barely above sea level' },
  { code:'BT', name:'Bhutan',         flag:'🇧🇹', rarity:'epic',      points:600,  reason:'Kingdom of Happiness' },
  { code:'KP', name:'North Korea',    flag:'🇰🇵', rarity:'epic',      points:700,  reason:'The Hermit Kingdom' },
  { code:'MM', name:'Myanmar',        flag:'🇲🇲', rarity:'epic',      points:350,  reason:'Land of Golden Pagodas' },
  { code:'CU', name:'Cuba',           flag:'🇨🇺', rarity:'epic',      points:350,  reason:'Island frozen in time' },
  { code:'MN', name:'Mongolia',       flag:'🇲🇳', rarity:'rare',      points:200,  reason:'Empire of the steppes' },
  { code:'IS', name:'Iceland',        flag:'🇮🇸', rarity:'rare',      points:130,  reason:'Land of Fire and Ice' },
  { code:'NP', name:'Nepal',          flag:'🇳🇵', rarity:'rare',      points:150,  reason:'Rooftop of the world' },
  { code:'ET', name:'Ethiopia',       flag:'🇪🇹', rarity:'rare',      points:140,  reason:'Cradle of Humanity' },
  { code:'FR', name:'France',         flag:'🇫🇷', rarity:'common',    points:50,   reason:'Most visited country' },
  { code:'DE', name:'Germany',        flag:'🇩🇪', rarity:'common',    points:50,   reason:'Heart of Europe' },
  { code:'GB', name:'United Kingdom', flag:'🇬🇧', rarity:'common',    points:50,   reason:'Birthplace of democracy' },
  { code:'ES', name:'Spain',          flag:'🇪🇸', rarity:'common',    points:50,   reason:'Land of Flamenco' },
  { code:'IT', name:'Italy',          flag:'🇮🇹', rarity:'common',    points:50,   reason:'Eternal cities' },
  { code:'US', name:'United States',  flag:'🇺🇸', rarity:'common',    points:50,   reason:'Land of opportunity' },
  { code:'JP', name:'Japan',          flag:'🇯🇵', rarity:'common',    points:80,   reason:'Rising Sun' },
  { code:'CN', name:'China',          flag:'🇨🇳', rarity:'common',    points:80,   reason:'Middle Kingdom' },
  { code:'IN', name:'India',          flag:'🇮🇳', rarity:'common',    points:80,   reason:'Subcontinent of contrasts' },
  { code:'BR', name:'Brazil',         flag:'🇧🇷', rarity:'common',    points:80,   reason:'Largest in South America' },
  { code:'AU', name:'Australia',      flag:'🇦🇺', rarity:'common',    points:80,   reason:'Land Down Under' },
  { code:'CA', name:'Canada',         flag:'🇨🇦', rarity:'common',    points:60,   reason:'Great white north' },
  { code:'PT', name:'Portugal',       flag:'🇵🇹', rarity:'common',    points:55,   reason:'Age of Discoveries' },
  { code:'GR', name:'Greece',         flag:'🇬🇷', rarity:'common',    points:60,   reason:'Cradle of civilization' },
  { code:'TR', name:'Turkey',         flag:'🇹🇷', rarity:'common',    points:60,   reason:'Bridge East and West' },
  { code:'ZA', name:'South Africa',   flag:'🇿🇦', rarity:'common',    points:70,   reason:'Rainbow Nation' },
  { code:'EG', name:'Egypt',          flag:'🇪🇬', rarity:'common',    points:70,   reason:'Land of Pharaohs' },
  { code:'TH', name:'Thailand',       flag:'🇹🇭', rarity:'common',    points:70,   reason:'Land of Smiles' },
  { code:'AR', name:'Argentina',      flag:'🇦🇷', rarity:'common',    points:70,   reason:'Land of Tango' },
  { code:'NO', name:'Norway',         flag:'🇳🇴', rarity:'common',    points:65,   reason:'Land of Fjords' },
  { code:'NZ', name:'New Zealand',    flag:'🇳🇿', rarity:'common',    points:80,   reason:'Middle Earth' },
  { code:'MA', name:'Morocco',        flag:'🇲🇦', rarity:'common',    points:65,   reason:'Gateway to Africa' },
  { code:'KR', name:'South Korea',    flag:'🇰🇷', rarity:'common',    points:70,   reason:'Land of Morning Calm' },
  { code:'VN', name:'Vietnam',        flag:'🇻🇳', rarity:'common',    points:70,   reason:'S-curve of Asia' },
  { code:'RU', name:'Russia',         flag:'🇷🇺', rarity:'common',    points:75,   reason:'Largest country on Earth' },
]
export const COUNTRY_MAP: Record<string, CountryBonus> = COUNTRIES.reduce((a,c) => ({...a,[c.code]:c}), {})
