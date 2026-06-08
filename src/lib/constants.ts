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
  'Novice','Vagabond','Éclaireur','Explorateur','Pisteur',
  'Ranger','Cartographe','Aventurier','Voyageur','Découvreur',
  'Pionnier','Défricheur','Géographe','Chercheur de Mondes','Légende',
]

export function xpForLevel(l: number) { return Math.floor(1200 * Math.pow(1.8, l - 1)) }
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
  // ── Surface ──────────────────────────────────────────────
  { id:'b1',  name:'Premiers Pas',              description:'Explorer 0.01 km²',                    icon:'👣', earned:false },
  { id:'b14', name:'Explorateur Débutant',      description:'Explorer 0.1 km²',                     icon:'🗺️', earned:false },
  { id:'b2',  name:'Explorateur',               description:'Explorer 1 km²',                       icon:'🧭', earned:false },
  { id:'b3',  name:'Grand Explorateur',         description:'Explorer 10 km²',                      icon:'🏙️', earned:false },
  { id:'b19', name:'Maître Explorateur',        description:'Explorer 50 km²',                      icon:'🌐', earned:false },
  // ── Distance ─────────────────────────────────────────────
  { id:'b13', name:'Marcheur',                  description:'Marcher 10 km',                        icon:'🚶', earned:false },
  { id:'b18', name:'Randonneur',                description:'Marcher 42 km',                        icon:'🏃', earned:false },
  { id:'b20', name:'Ultra Marcheur',            description:'Marcher 100 km',                       icon:'✈️', earned:false },
  // ── Monuments généraux ───────────────────────────────────
  { id:'b4',  name:'Chasseur de Monuments',     description:'Trouver ton premier monument',         icon:'🏛️', earned:false },
  { id:'b5',  name:'Chercheur de Châteaux',     description:'Trouver 5 monuments',                  icon:'🏰', earned:false },
  { id:'b6',  name:'Explorateur de Villes',     description:'Trouver 10 monuments',                 icon:'🌆', earned:false },
  { id:'b7',  name:'Découvreur Légendaire',     description:'Trouver un monument Légendaire',       icon:'⭐', earned:false },
  { id:'b9',  name:'Chasseur Épique',           description:'Trouver un monument Épique',           icon:'💎', earned:false },
  { id:'b12', name:'Roi des Légendes',          description:'Trouver 3 monuments légendaires',      icon:'👑', earned:false },
  // ── Monuments spécifiques ────────────────────────────────
  { id:'b16', name:'Naturaliste',               description:'Trouver 5 sites naturels',             icon:'🌿', earned:false },
  { id:'b17', name:'Archéologue',               description:'Trouver 3 monuments épiques historiques', icon:'⛏️', earned:false },
  { id:'b21', name:'Spéléologue',               description:'Trouver 3 grottes',                    icon:'🕳️', earned:false },
  { id:'b22', name:'Alpiniste',                 description:'Trouver 3 sommets',                    icon:'⛰️', earned:false },
  { id:'b23', name:'Gardien de Phare',          description:'Trouver 2 phares',                     icon:'🗼', earned:false },
  { id:'b24', name:'Chasseur de Moulins',       description:'Trouver 3 moulins',                    icon:'🌀', earned:false },
  // ── Scores ───────────────────────────────────────────────
  { id:'b8',  name:'Centenaire',                description:'Atteindre 5 000 points',               icon:'💯', earned:false },
  { id:'b25', name:'Millionnaire',              description:'Atteindre 10 000 points',              icon:'🏆', earned:false },
  { id:'b26', name:'Légende',                  description:'Atteindre 100 000 points',              icon:'🌟', earned:false },
  // ── Pays ─────────────────────────────────────────────────
  { id:'b10', name:'Voyageur',                  description:'Visiter 3 pays',                       icon:'🌍', earned:false },
  { id:'b11', name:'Globe-Trotter',             description:'Visiter 5 pays',                       icon:'✈️', earned:false },
  { id:'b27', name:'Explorateur International', description:'Visiter 10 pays',                      icon:'🗺️', earned:false },
  { id:'b28', name:'Aventurier Mondial',        description:'Visiter 20 pays',                      icon:'🌐', earned:false },
  { id:'b29', name:'Terre Rare',                description:'Découvrir un pays épique',             icon:'💜', earned:false },
  { id:'b30', name:'Légende Vivante',           description:'Découvrir un pays légendaire',         icon:'🔮', earned:false },
  // ── Régularité ───────────────────────────────────────────
  { id:'b15', name:'Fidèle',                   description:'Explorer 7 jours consécutifs',          icon:'📅', earned:false },
  { id:'b31', name:'Acharné',                  description:'Explorer 30 jours consécutifs',         icon:'🔥', earned:false },
  // ── Temps ────────────────────────────────────────────────
  { id:'b32', name:'Lève-tôt',                 description:'Explorer avant 8h du matin',            icon:'🌅', earned:false },
  { id:'b33', name:'Noctambule',               description:'Explorer après 22h',                    icon:'🌙', earned:false },
  { id:'b34', name:'Week-end Warrior',         description:'Explorer samedi ET dimanche',           icon:'⚔️', earned:false },
  // ── Saisons ──────────────────────────────────────────────
  { id:'bs1', name:'Explorateur Hivernal',     description:'Explorer en hiver (déc-fév)',           icon:'❄️', earned:false },
  { id:'bs2', name:'Esprit du Printemps',      description:'Trouver un jardin au printemps',        icon:'🌸', earned:false },
  { id:'bs3', name:'Aventurier Estival',       description:'Explorer 1 km² en été',                icon:'☀️', earned:false },
  { id:'bs4', name:"Chasseur d'Automne",       description:'Trouver un monument en automne',        icon:'🍂', earned:false },
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

// ── NOUVEAUX BADGES ───────────────────────────────────────────


