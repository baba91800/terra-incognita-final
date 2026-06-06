// Objectifs hebdomadaires — plus ambitieux que les quotidiens
import type { ObjType } from '../types/game'

export interface WeeklyObjective {
  id: string
  type: ObjType
  target: number
  current: number
  reward: number
  completed: boolean
  icon: string
  description: string
  weekStart: string // ISO date du lundi de la semaine
}

const WEEKLY_TEMPLATES = [
  { id:'w1', type:'tiles'     as ObjType, target:500,   reward:1000, icon:'🗺️', description:'Explorer 500 nouvelles tuiles cette semaine' },
  { id:'w2', type:'tiles'     as ObjType, target:2000,  reward:3000, icon:'🌍', description:'Explorer 2000 nouvelles tuiles cette semaine' },
  { id:'w3', type:'monuments' as ObjType, target:3,     reward:1500, icon:'🏛️', description:'Découvrir 3 monuments cette semaine' },
  { id:'w4', type:'monuments' as ObjType, target:5,     reward:2500, icon:'🏰', description:'Découvrir 5 monuments cette semaine' },
  { id:'w5', type:'distance'  as ObjType, target:5000,  reward:1200, icon:'👟', description:'Marcher 5 km cette semaine' },
  { id:'w6', type:'distance'  as ObjType, target:15000, reward:3000, icon:'🏃', description:'Marcher 15 km cette semaine' },
  { id:'w7', type:'countries' as ObjType, target:1,     reward:2000, icon:'🌐', description:'Découvrir un nouveau pays cette semaine' },
  { id:'w8', type:'score'     as ObjType, target:5000,  reward:1500, icon:'⚡', description:'Gagner 5000 XP cette semaine' },
  { id:'w9', type:'score'     as ObjType, target:15000, reward:4000, icon:'💫', description:'Gagner 15000 XP cette semaine' },
]

const WEEKLY_KEY = 'ti2_weekly_obj'

function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // lundi
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0]
}

export function genWeeklyObjectives(): WeeklyObjective[] {
  const weekStart = getWeekStart()
  const seed = weekStart.split('-').reduce((a, b) => a + parseInt(b), 0)
  const pick = (o: number) => WEEKLY_TEMPLATES[(seed + o) % WEEKLY_TEMPLATES.length]
  return [pick(0), pick(2), pick(5)].map(t => ({
    ...t, weekStart, current: 0, completed: false
  }))
}

export function loadWeeklyObjectives(): WeeklyObjective[] {
  try {
    const raw = localStorage.getItem(WEEKLY_KEY)
    if (!raw) return genWeeklyObjectives()
    const saved: WeeklyObjective[] = JSON.parse(raw)
    // Nouvelle semaine → reset
    if (!saved.length || saved[0].weekStart !== getWeekStart()) {
      const fresh = genWeeklyObjectives()
      saveWeeklyObjectives(fresh)
      return fresh
    }
    return saved
  } catch { return genWeeklyObjectives() }
}

export function saveWeeklyObjectives(obj: WeeklyObjective[]): void {
  try { localStorage.setItem(WEEKLY_KEY, JSON.stringify(obj)) } catch {}
}

export function getDaysLeftInWeek(): number {
  const now = new Date()
  const day = now.getDay()
  return day === 0 ? 0 : 7 - day
}
