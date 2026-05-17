export type TileKey = string // "x:y"
export type TileState = 'hidden' | 'discovered'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Monument {
  id: string
  name: string
  lat: number
  lng: number
  rarity: Rarity
  type: string
  icon?: string
  discovered: boolean
  discoveredAt?: string
}

export interface CountryDiscovery {
  code: string
  name: string
  flag: string
  rarity: Rarity
  points: number
  discoveredAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earned: boolean
  earnedAt?: string
  location?: string
}

export interface DailyObjective {
  id: string
  date: string          // YYYY-MM-DD
  description: string
  icon: string
  type: 'tiles' | 'monuments' | 'countries' | 'score' | 'distance'
  target: number
  current: number
  completed: boolean
  reward: number
}

export interface PlayerLevel {
  level: number
  xp: number
  xpForNext: number
  title: string
}

export interface ExplorationPath {
  lat: number
  lng: number
  timestamp: number
}

export interface DiscoveryLog {
  id: string
  type: 'monument' | 'country' | 'badge' | 'level' | 'objective'
  title: string
  subtitle?: string
  icon: string
  points?: number
  rarity?: Rarity
  timestamp: string
}

export interface Notification {
  id: string
  type: 'monument' | 'badge' | 'tile' | 'country' | 'level' | 'objective'
  title: string
  subtitle?: string
  points: number
  rarity?: Rarity
  icon?: string
}
