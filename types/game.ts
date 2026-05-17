export type TileKey = string
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type ObjType = 'tiles' | 'monuments' | 'countries' | 'score' | 'distance'

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
}

export interface DailyObjective {
  id: string
  date: string
  description: string
  icon: string
  type: ObjType
  target: number
  current: number
  completed: boolean
  reward: number
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
  type: 'monument' | 'badge' | 'country' | 'level' | 'objective'
  title: string
  subtitle?: string
  points: number
  rarity?: Rarity
  icon?: string
}
